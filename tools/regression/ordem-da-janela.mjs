// A ordem da janela (D80): o conteúdo de uma porta não passa por cima do que está à frente dela.
//
// O que se mede, e porque é assim: a janela mostra o destino com duas camadas — o fundo ao vivo e, por
// cima dele, o **recorte** com as obras e as portas do outro lado. A política do stencil sempre disse
// que o recorte "sai antes das obras da dimensão ativa", e era verdade no `renderOrder` e falso no
// desenho: um material `transparent` vai para o passe seguinte a **toda** a geometria opaca, e aí a
// ordem deixa de contar. O resultado via-se no ecrã — a obra do destino pintada por cima da obra que
// está na sala do visitante, à frente da janela.
//
// Esperar que o mundo ofereça essa sobreposição é esperar por uma coincidência (a obra tem de calhar em
// frente da janela e o destino ter lá conteúdo, ao mesmo tempo). Por isso a bateria **constrói** a
// sobreposição: encosta uma obra da sala a 3 m à frente de uma porta com janela de shader e põe a câmara
// a 1,2 m dessa obra, a olhar para a porta. A obra enche o ecrã e a janela fica atrás dela; tudo o que o
// recorte desenhar cai sobre a obra e conta-se.
//
// Três números por sala, e um deles é o controlo que diz que o instrumento vê o defeito:
//   · o que está no projeto (recorte opaco com `alphaTest`) tem de dar **0** pixéis do recorte sobre a
//     obra;
//   · com o material posto em `transparent` como estava antes da D80, os mesmos pixéis têm de passar de
//     zero — senão a medição não estava a ver nada;
//   · duas fotografias seguidas da mesma cena têm de dar o mesmo (o shader fica congelado).
//
// Uso, da raiz do projeto:
//
//   node tools/regression/ordem-da-janela.mjs                 as salas com janela de shader e obras
//   node tools/regression/ordem-da-janela.mjs scene1 scene8   só as que se nomearem
//
import { readFileSync, readdirSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { join } from 'node:path';
import { ROOT, serveProject, openBrowser, sleep, checks } from './harness.mjs';

// Uma fotografia do ecrã descodificada: o harness devolve a assinatura, e aqui precisa-se dos pixéis.
// São as mesmas quatro linhas de `pngBrightness` com a matriz dos filtros do PNG ao lado, porque o
// projeto não tem `package.json` e não vai buscar um descodificador (D1).
function descodificar(buffer) {
  let pos = 8;
  let largura = 0;
  let altura = 0;
  let profundidade = 0;
  let cor = 0;
  const dados = [];
  while (pos < buffer.length) {
    const comprimento = buffer.readUInt32BE(pos);
    const tipo = buffer.toString('ascii', pos + 4, pos + 8);
    const bloco = buffer.subarray(pos + 8, pos + 8 + comprimento);
    if (tipo === 'IHDR') {
      largura = bloco.readUInt32BE(0);
      altura = bloco.readUInt32BE(4);
      profundidade = bloco[8];
      cor = bloco[9];
    } else if (tipo === 'IDAT') dados.push(bloco);
    else if (tipo === 'IEND') break;
    pos += 12 + comprimento;
  }
  if (profundidade !== 8) throw new Error('PNG com ' + profundidade + ' bits por canal');
  const canais = { 0: 1, 2: 3, 4: 2, 6: 4 }[cor];
  if (!canais) throw new Error('PNG com o tipo de cor ' + cor);
  const cru = inflateSync(Buffer.concat(dados));
  const passo = largura * canais;
  const pixels = Buffer.alloc(altura * passo);
  let lido = 0;
  for (let y = 0; y < altura; y++) {
    const filtro = cru[lido++];
    const linha = cru.subarray(lido, lido + passo);
    lido += passo;
    const base = y * passo;
    const anterior = y > 0 ? base - passo : -1;
    for (let x = 0; x < passo; x++) {
      const a = x >= canais ? pixels[base + x - canais] : 0;
      const b = anterior >= 0 ? pixels[anterior + x] : 0;
      const c = anterior >= 0 && x >= canais ? pixels[anterior + x - canais] : 0;
      let valor = linha[x];
      if (filtro === 1) valor += a;
      else if (filtro === 2) valor += b;
      else if (filtro === 3) valor += (a + b) >> 1;
      else if (filtro === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        valor += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filtro !== 0) throw new Error('filtro PNG ' + filtro);
      pixels[base + x] = valor & 0xff;
    }
  }
  return { largura, altura, canais, pixels };
}

const brilho = (imagem, x, y) => {
  const em = y * imagem.largura * imagem.canais + x * imagem.canais;
  return 0.299 * imagem.pixels[em] + 0.587 * imagem.pixels[em + 1] + 0.114 * imagem.pixels[em + 2];
};

// Quantos pixéis mudam entre duas fotografias. O ecrã é 900x500 e o custo é uma comparação por pixel.
const diferenca = (um, outro) => {
  let n = 0;
  for (let y = 0; y < um.altura; y++) {
    for (let x = 0; x < um.largura; x++) {
      if (Math.abs(brilho(um, x, y) - brilho(outro, x, y)) > 8) n++;
    }
  }
  return n;
};

// A cena da medição: a obra à frente da porta e a câmara à frente da obra, a olhar a porta. Devolve
// também o retângulo da obra no ecrã, para se saber se ela tapa o ecrã todo (é isso que faz o número
// significar "o recorte por cima da obra" e não "o recorte em qualquer sítio").
const MONTAR = (pose) => `(async () => {
  const { playerCamera } = await import('/js/modules/camera.js');
  const obra = document.querySelector('[data-artwork-id]');
  if (!obra) return null;
  obra.setAttribute('position', { x: ${pose.obra[0]}, y: 1.5, z: ${pose.obra[1]} });
  obra.setAttribute('rotation', { x: 0, y: ${pose.virada}, z: 0 });
  playerCamera.setPose({
    position: [${pose.camara[0]}, 1.6, ${pose.camara[1]}], yaw: ${-pose.yaw}, pitch: 0
  });
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const camera = document.querySelector('a-scene').camera;
  camera.updateMatrixWorld();
  const largura = window.innerWidth;
  const altura = window.innerHeight;
  const w = Number(obra.getAttribute('width'));
  const h = Number(obra.getAttribute('height'));
  obra.object3D.updateWorldMatrix(true, false);
  const cantos = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]
    .map(([x, y]) => new THREE.Vector3(x, y, 0).applyMatrix4(obra.object3D.matrixWorld).project(camera));
  const xs = cantos.map((p) => (p.x + 1) / 2 * largura);
  const ys = cantos.map((p) => (1 - p.y) / 2 * altura);
  return {
    obra: obra.getAttribute('data-artwork-id'),
    tapa: Math.min(...xs) <= 0 && Math.max(...xs) >= largura && Math.min(...ys) <= 0 &&
      Math.max(...ys) >= altura
  };
})()`;

// O material do recorte como estava antes da D80 (`transparent`) e como está agora. O `needsUpdate` é o
// que faz o three.js voltar a decidir em que passe o material entra.
const RECORTES = (transparente, visivel) => `(() => {
  let n = 0;
  document.querySelector('a-scene').object3D.traverse((o) => {
    if (!o.name || !/-recorte$/.test(o.name) || !o.material) return;
    o.material.transparent = ${transparente};
    o.material.needsUpdate = true;
    o.visible = ${visivel};
    n += 1;
  });
  return n;
})()`;

const mundosComJanela = () => {
  // Um ficheiro por mundo em `data/worlds/` (D24), como o validador os lista.
  const pasta = join(ROOT, 'data/worlds');
  return readdirSync(pasta)
    .filter((nome) => nome.endsWith('.json'))
    .map((nome) => nome.slice(0, -'.json'.length))
    .filter((slug) => {
      const mundo = JSON.parse(readFileSync(join(pasta, slug + '.json'), 'utf8'));
      const obras = (mundo.artworks || []).length;
      const janelas = (mundo.portals || []).filter((p) => p.window && p.window.kind === 'preview' &&
        p.window.shaderId).length;
      return obras > 0 && janelas > 0;
    });
};

const resultado = checks();
const site = await serveProject();
const browser = await openBrowser({ width: 900, height: 500, dpr: 2, mobile: true });
try {
  const pedidos = process.argv.slice(2);
  const mundos = pedidos.length ? pedidos : mundosComJanela();
  for (const mundo of mundos) {
    const definicao = JSON.parse(readFileSync(join(ROOT, 'data/worlds/' + mundo + '.json'), 'utf8'));
    const porta = (definicao.portals || []).find((p) => p.window && p.window.kind === 'preview' &&
      p.window.shaderId);
    if (!porta || !(definicao.artworks || []).length) {
      console.log('skip ' + mundo + ': sem porta com janela de shader ou sem obras');
      continue;
    }
    // O eixo da porta, do centro para fora: a obra a 3 m à frente dela e a câmara a 1,2 m da obra
    // ficam do lado de dentro, e a janela fica atrás dos dois.
    const [px, , pz] = porta.position;
    const raio = Math.hypot(px, pz);
    const dentro = [-px / raio, -pz / raio];
    const obra = [px + dentro[0] * 3, pz + dentro[1] * 3];
    const camara = [px + dentro[0] * 4.2, pz + dentro[1] * 4.2];
    const yaw = (Math.atan2(px - camara[0], -(pz - camara[1])) * 180 / Math.PI + 360) % 360;
    const virada = Math.atan2(camara[0] - obra[0], camara[1] - obra[1]) * 180 / Math.PI;

    await browser.goto(site.base + '/' + mundo + '/?bust=' + Date.now(), 60000);
    await sleep(8000);
    // O fundo tem de estar parado: sem isto as duas fotografias diferem por animação, e a medição
    // passaria a medir o shader (foi o primeiro erro desta sonda — números da ordem dos milhares onde
    // não havia nada).
    await browser.evaluate('(() => { window.portalDebug.freezeShaders(); return true; })()');
    // E as portas na pose do dado (D91): a moldura de uma porta em movimento muda pixels entre as duas
    // fotografias, e esta sonda mede a **ordem** da janela, não o movimento.
    await browser.evaluate('(() => { if (window.portalDebug.settleMotion) window.portalDebug.settleMotion(); return true; })()');
    const montado = await browser.evaluate(MONTAR({ obra, camara, yaw, virada }));
    if (!montado) {
      console.log('skip ' + mundo + ': a sala não tem obras no DOM');
      continue;
    }
    await sleep(400);

    const medir = async (transparente) => {
      await browser.evaluate(RECORTES(transparente, true));
      await sleep(150);
      const comRecorte = descodificar((await browser.screenshot(1)).bytes);
      const repetido = descodificar((await browser.screenshot(1)).bytes);
      await browser.evaluate(RECORTES(transparente, false));
      await sleep(150);
      const semRecorte = descodificar((await browser.screenshot(1)).bytes);
      await browser.evaluate(RECORTES(transparente, true));
      await sleep(100);
      return { sobre: diferenca(comRecorte, semRecorte), ruido: diferenca(comRecorte, repetido) };
    };

    const comoEsta = await medir(false);
    const controlo = await medir(true);

    resultado.check(mundo + ' (porta ' + porta.id + '): a obra tapa o ecrã, e o recorte não passa por cima dela',
      montado.tapa && comoEsta.sobre === 0,
      'tapa=' + montado.tapa + ', recorte sobre a obra ' + comoEsta.sobre + ' px, ruído ' + comoEsta.ruido);
    resultado.check(mundo + ': o instrumento vê o defeito quando o recorte é transparente (controlo)',
      controlo.sobre > 0 && controlo.ruido === 0,
      'recorte sobre a obra ' + controlo.sobre + ' px, ruído ' + controlo.ruido);
  }
} finally {
  await browser.close();
  await site.close();
}
resultado.report('D80 (a ordem da janela)');
