// O retrato de uma porta de mundo, desenhado pela própria exposição (D46).
//
// Porque existe: a janela de uma porta de mundo mostrava o **panorama** do destino, e a chegada a esse
// destino mostra o panorama **mais as obras e as portas dele**. O que se via ao atravessar era, por
// isso, uma imagem diferente da que estava no ecrã � medido: o salto no corte ia de **0,68 a 13,36**
// nas seis portas com retrato.
//
// O que faz: abre o mundo de destino com `?from=<origem>`, deixa o `arrivalPoint` pôr a câmara onde o
// visitante vai aparecer (uma só casa para a geometria � L16), desenha seis faces de cubo a partir
// dali e converte-as numa equirretangular 2:1 � com as obras e as portas lá dentro, porque são a
// cena. O ficheiro é o retrato que a porta vai mostrar, e é por isso que atravessar deixa de mudar a
// imagem.
//
// O retrato é um **asset derivado**: regere-o quando a sala mudar (mover uma obra muda o retrato das
// portas que a mostram). E regere-o **duas vezes**: o retrato de um mundo contém as janelas das
// portas desse mundo, que são retratos deles próprios � a primeira passagem cozinha o que lá estava,
// a segunda o que lá ficou. Medido, o mesmo retrato saiu com 438, 215 e 378 kB em passagens seguidas;
// a costura não se mexe com isso (0,37 antes e depois), mas o ficheiro sim.
//
// A esfera onde o retrato é mostrado fica centrada à **altura dos olhos** (D47), que é a altura de
// onde este cubo é desenhado � é o que faz a imagem através da porta ser a imagem da chegada.
//
// Uso, da raiz do projeto:
//   node tools/scene/portrait.mjs --todos
//   node tools/scene/portrait.mjs <mundo> <origem> [ficheiro] [--direto]
//
// `--direto` desenha a **primeira visita**: a câmara fica na pose por omissão do mundo em vez de numa
// porta de chegada. É o que uma porta da sala de ensaio mostra (D84), porque lá o `?from` não viaja.
// Os pares vêm do dado (`preview` que navega, com o retrato na convenção `<destino>-de-<origem>`).
import { join } from 'node:path';
import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { writeAtomic } from '../coordination/atomic.mjs';
import { oficina } from '../coordination/locks.mjs';
import { serveProject, openBrowser, ROOT, sleep } from '../regression/harness.mjs';
import { DERIVED_DIMENSION_BASE } from '../../js/core/index.js';

// O tamanho da imagem. Enquanto o fundo era um panorama, quem mandava era a resolução: medido na
// porta mais difícil (praia 4 �  cidade), 2560x1280 deixava a costura em **0,58** (falhava a meta de
// 0,50) e 3072x1536 em **0,41 a 0,47**. Com o shader como fundo isso deixa de existir � o céu, o mar
// e o chão são calculados e chegam exatos �, e o retrato só carrega as obras e as portas. Fica o
// tamanho padrão das imagens do projeto (2048x1024, lei L14): 8 MiB de textura por retrato em vez de
// 18, que é o que um PowerVR GE8320 (o aparelho fraco do ensaio de 2026-10) agradece.
//
// A qualidade do JPEG quase não conta (0,85 dava 0,39 e 0,75 dava 0,40 a 4096); quem mandava era a
// resolução.
const TAMANHO = { largura: 2048, altura: 1024, face: 1536, qualidade: 0.85 };

// As portas com retrato, lidas do **dado** (D84): uma entrada por porta `preview` que navega, com o
// mundo de destino, o mundo de origem e se essa origem leva o `?from` (as salas levam; a sala de
// ensaio não — `world.carryOrigin: false`).
//
// A lista esteve escrita à mão (39 pares) e teria de crescer à mão com cada porta nova — a mesma
// lição que a P1 da spec (D83) deixou nas baterias. O que continua a ser uma regra está aqui: só se
// desenha o que segue a convenção `<destino>-de-<origem>.jpg`, porque é essa a porta que a janela
// mostra; um fixture que aponte para um panorama antigo (o `example` aponta para `praia.jpg`) fica de
// fora em vez de ser substituído por um retrato.
const CONVENCAO = /(^|\/)previews\/[a-z0-9-]+-de-[a-z0-9-]+\.jpg$/;

function portasDoDado() {
  const pasta = join(ROOT, 'data', 'worlds');
  const portas = [];
  const vistas = new Set();
  for (const nome of readdirSync(pasta).filter((entrada) => entrada.endsWith('.json'))) {
    const cena = JSON.parse(readFileSync(join(pasta, nome), 'utf8'));
    const origem = (cena.world && cena.world.slug) || nome.replace(/\.json$/, '');
    const direto = Boolean(cena.world && cena.world.carryOrigin === false);
    for (const portal of cena.portals || []) {
      const janela = portal.window || {};
      const acao = portal.action || {};
      if (janela.kind !== 'preview' || acao.kind !== 'navigate') continue;
      const retrato = (cena.assets && cena.assets[janela.asset] && cena.assets[janela.asset].path) || null;
      if (!retrato || !CONVENCAO.test(retrato)) continue;
      const chave = origem + '>' + acao.target;
      if (vistas.has(chave)) continue;
      vistas.add(chave);
      portas.push({ destino: acao.target, origem, direto, retrato });
    }
  }
  return portas.sort((a, b) => a.destino.localeCompare(b.destino) || a.origem.localeCompare(b.origem));
}

const PORTAS = portasDoDado();

const todos = process.argv[2] === '--todos';
const mundo = todos ? null : process.argv[2];
const origem = todos ? null : process.argv[3];
const direto = process.argv.includes('--direto');
if (!todos && (!mundo || !origem)) {
  console.error('uso: node tools/scene/portrait.mjs <mundo> <origem> [ficheiro]');
  console.error('     node tools/scene/portrait.mjs --todos');
  console.error('exemplo: node tools/scene/portrait.mjs scene1 scene2');
  process.exit(1);
}

// O desenho, dentro da página: cubo a partir da câmara de chegada, e o cubo desdobrado **duas vezes** —
// uma com o fundo (o retrato inteiro, que é a reserva) e outra **sem** fundo, com transparência (o
// recorte que a janela compõe sobre o shader ao vivo, D53).
const DESENHAR = (largura, altura, face, qualidade) => `(async () => {
  const cena = document.querySelector('a-scene');
  const renderer = cena.renderer;
  const camera = cena.camera;
  const cena3d = cena.object3D;
  if (!renderer || !camera || !cena3d) return { erro: 'sem renderer ou câmara' };

  // O cursor é interface, não paisagem: não entra no retrato.
  const cursor = document.querySelector('a-cursor');
  if (cursor) cursor.setAttribute('visible', false);

  // A **porta por onde se chega** fica a ~1 m da câmara e o quadro dela tem 10x12 m: ocupa metade da
  // fotografia e é ela que aparece como uma **tira vermelha** dentro da janela (D79). Não é do retrato
  // — é a porta que o visitante tem atrás de si, e a janela nunca mostra essa direcção. Sai da
  // fotografia, e com ela a tira.
  //
  // O arrivalFrom é do **dado do mundo**, não do componente: a porta viva encontra-se pelo id que o
  // ficheiro diz (foi assim que a primeira versão desta correcção não escondeu nada).
  const deOnde = new URLSearchParams(location.search).get('from');
  let chegada = null;
  if (deOnde && window.portalDebug && window.portalDebug.world) {
    const mundo = await (await fetch('data/worlds/' + window.portalDebug.world + '.json')).json();
    const dado = (mundo.portals || []).find((porta) => porta.arrivalFrom === deOnde);
    if (dado) chegada = window.portalDebug.state.portals.find((porta) => porta.data.id === dado.id) || null;
  }
  const esconderChegada = (esconder) => {
    if (chegada && chegada.portalGroup) chegada.portalGroup.visible = !esconder;
  };

  const posicao = new THREE.Vector3();
  camera.getWorldPosition(posicao);

  // As esferas de fundo (as dimensões) são exactamente o que o recorte tira: o que sobra são as obras
  // e as portas, que é o que falta à janela para o corte não se ver. As obras também levam o atributo
  // data-dimension (é assim que o stencil lhes dá a dimensão), por isso o que se procura é o
  // **componente** da dimensão e não o atributo.
  //
  // O que sai são só as dimensões **da sala** (D78): as janelas das portas são dimensões derivadas
  // (a banda de ids da L15), e tirá-las deixava o recorte com um **buraco** em cada porta — pela
  // janela via-se o fundo através delas, e ao chegar via-se o retrato delas. Medido na porta 28 da
  // sala 9: 1,11 de salto, com as duas portas do destino vazias no retrato.
  const fundos = Array.from(cena.querySelectorAll('[data-dimension]'))
    .filter((elemento) => elemento.components && elemento.components['dimension-panorama'])
    .filter((elemento) => elemento.components['dimension-panorama'].data.dimension < ${DERIVED_DIMENSION_BASE});
  const esconderFundos = (esconder) => {
    fundos.forEach((elemento) => {
      elemento.object3D.visible = !esconder;
    });
  };

  const alvoCubo = new THREE.WebGLCubeRenderTarget(${face}, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter,
    // A cena desenha com stencil (a lei L6, o stencil: true do renderer) e as janelas das portas
    // são máscaras de stencil: um render target **sem** stencil desenha o cubo inteiro a zeros. Medido
    // em 2026-10-29, com a sala em anel: 0,0 de brilho sem o stencil e 41,1 com ele, no mesmo sítio.
    stencilBuffer: true
  });
  const cubo = new THREE.CubeCamera(0.1, 4000, alvoCubo);
  cubo.position.copy(posicao);
  // O retrato tem de casar com o primeiro quadro do destino: o shader começa no instante que a ponte
  // deixou (ou no estático, 2) — e é esse o instante que o retrato guarda.
  const ponte = window.arrivalFrame && window.arrivalFrame.shaderTime ? window.arrivalFrame.shaderTime() : null;
  const instante = typeof ponte === 'number' ? ponte : 2;
  cena3d.traverse((object) => {
    if (object.material && object.material.uniforms && object.material.uniforms.uTime) {
      object.material.uniforms.uTime.value = instante;
    }
  });

  const alvo = new THREE.WebGLRenderTarget(${largura}, ${altura}, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat,
    // Pelo mesmo motivo do cubo: sem stencil, o desdobramento sai preto.
    stencilBuffer: true
  });
  // A cor sai como está e o **alfa vem do cubo**: com o fundo escondido, o que não tem objecto fica
  // transparente — é isso que faz do recorte um recorte.
  const material = new THREE.ShaderMaterial({
    uniforms: { mapa: { value: alvoCubo.texture } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    // A convenção da esfera do three (SphereGeometry com phi 0..2π e theta 0..π, uv = (u, 1-v)):
    // o topo da imagem olha para cima, e a coluna 0 para -X. A cor sai como está: o render target do
    // three já entrega sRGB, e codificar outra vez (medido) estraga a imagem toda — 47,8 de costura.
    fragmentShader: [
      'uniform samplerCube mapa;',
      'varying vec2 vUv;',
      'void main() {',
      '  float theta = 3.141592653589793 * (1.0 - vUv.y);',
      '  float phi = 6.283185307179586 * vUv.x;',
      '  vec3 direcao = vec3(-cos(phi) * sin(theta), cos(theta), sin(phi) * sin(theta));',
      '  gl_FragColor = textureCube(mapa, direcao);',
      '}'
    ].join('\\n')
  });
  const quadrado = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  const desenho = new THREE.Scene();
  desenho.add(quadrado);
  const camaraDoDesenho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const ler = (opaco) => {
    renderer.setRenderTarget(alvo);
    renderer.render(desenho, camaraDoDesenho);
    const pixels = new Uint8Array(${largura} * ${altura} * 4);
    renderer.readRenderTargetPixels(alvo, 0, 0, ${largura}, ${altura}, pixels);
    renderer.setRenderTarget(null);
    const tela = document.createElement('canvas');
    tela.width = ${largura};
    tela.height = ${altura};
    const contexto = tela.getContext('2d');
    const dados = contexto.createImageData(${largura}, ${altura});
    // O readback começa na linha de baixo; a imagem começa em cima.
    for (let y = 0; y < ${altura}; y++) {
      const origem = (${altura} - 1 - y) * ${largura} * 4;
      dados.data.set(pixels.subarray(origem, origem + ${largura} * 4), y * ${largura} * 4);
    }
    // O retrato inteiro é opaco por definição; o recorte guarda o alfa que veio do cubo.
    if (opaco) for (let i = 3; i < dados.data.length; i += 4) dados.data[i] = 255;
    contexto.putImageData(dados, 0, 0);
    return tela;
  };

  // 1. O retrato inteiro: fundo opaco e tudo visível — menos a porta por onde se chega (D79).
  renderer.setClearColor(0x000000, 1);
  esconderFundos(false);
  esconderChegada(true);
  cubo.update(renderer, cena3d);
  const inteiro = ler(true).toDataURL('image/jpeg', ${qualidade});

  // 2. O recorte: só as obras e as portas, sobre transparência.
  renderer.setClearColor(0x000000, 0);
  esconderFundos(true);
  cubo.update(renderer, cena3d);
  const recorte = ler(false).toDataURL('image/png');
  esconderFundos(false);
  esconderChegada(false);
  renderer.setClearColor(0x000000, 0);

  return { inteiro: inteiro, recorte: recorte, posicao: [posicao.x, posicao.y, posicao.z] };
})()`;

// O caminho do recorte a partir do caminho do retrato: `assets/previews/scene1-de-gate.jpg` →
// `assets/previews/recorte-scene1-de-gate.png`. Um por porta, ao lado do retrato que ele recorta.
function recorteDe(destino) {
  const corte = Math.max(destino.lastIndexOf('/'), destino.lastIndexOf('\\'));
  const pasta = destino.slice(0, corte + 1);
  const nome = destino.slice(corte + 1).replace(/\.[a-z]+$/i, '');
  return pasta + 'recorte-' + nome + '.png';
}

async function gerar(mundo, origem, destino, opcoes = {}) {
  const tamanho = TAMANHO;
  const site = await serveProject();
  const browser = await openBrowser({ width: 1280, height: 800, camera: true });
  try {
    // `--direto`: a origem não leva `?from` — é o caso da sala de ensaio (D84), cujas portas entram no
    // destino como uma **primeira visita**. A câmara fica então na pose por omissão do mundo
    // (`cameras.player`), e não numa porta de chegada; é essa a imagem que o visitante vê ao entrar.
    const url = opcoes.direto
      ? site.base + '/' + mundo + '/?bust=' + Date.now()
      : site.base + '/' + mundo + '/?from=' + origem + '&bust=' + Date.now();
    const pronta = await browser.goto(url, 90000);
    if (!pronta) throw new Error('a cena de ' + mundo + ' não ficou pronta');
    // A sala só está construída quando `built` o diz (D68): `state.portals` enche-se antes disso, e com
    // as capas no Google Drive o fundo da dimensão ainda não existe nesse instante. Esperar só pelas
    // portas apanhava a sala a meio e o retrato inteiro saía **preto** (medido, 2026-10-27: 13 kB em vez
    // de 171 kB na sala 3) — o recorte vinha certo, porque as obras já lá estavam e é só delas que ele
    // é feito. Por isso a espera é pelo `built`, e depois pelos fundos que o retrato vai desenhar.
    //
    // As **capas** também contam (2026-10-29): a da sala 9 é remota como as outras, e a primeira
    // passagem desenhou as quatro obras como retângulos pretos — o `built` já era `true` e as texturas
    // ainda vinham pela rede. A espera passou a incluir as imagens do catálogo (`<a-assets>`), que é
    // onde as capas entram; as que já falharam não seguram a passagem, senão uma capa em baixo
    // pendurava o retrato para sempre.
    for (let i = 0; i < 240; i++) {
      const estado = await browser.evaluate(`(() => {
        const depuracao = window.portalDebug;
        if (!depuracao || depuracao.built !== true) return null;
        const cena = document.querySelector('a-scene');
        if (!cena) return null;
        const fundos = Array.from(cena.querySelectorAll('[data-dimension]'))
          .filter((elemento) => elemento.components && elemento.components['dimension-panorama']);
        const capas = Array.from(document.querySelectorAll('a-assets img'))
          .filter((imagem) => !(imagem.complete && imagem.naturalWidth === 0));
        const assentes = capas.filter((imagem) => imagem.complete && imagem.naturalWidth > 0).length;
        return { portas: depuracao.state.portals.length, fundos: fundos.length,
                 capas: capas.length, assentes };
      })()`).catch(() => null);
      // `capas > 0` também conta: o `a-assets` enche-se aos poucos, e um instante com zero imagens
      // dava `0 === 0` e a passagem seguia sem esperar por nenhuma.
      if (estado && estado.portas > 0 && estado.fundos > 0 && estado.capas > 0 &&
          estado.assentes === estado.capas) break;
      await sleep(250);
    }
    await sleep(2500);
    // O `?from=` tem de ter posto a câmara no sítio: se não pôs, o mundo não tem porta de chegada
    // para esta origem e o retrato sairia do lugar errado. Sem `?from` (D84) o que se confirma é que a
    // câmara está **acima do chão**, e não a pose de repouso da entrada.
    const chegada = await browser.evaluate(`(() => {
      const cena = document.querySelector('a-scene');
      const camera = cena.camera;
      const posicao = new THREE.Vector3();
      camera.getWorldPosition(posicao);
      return { mundo: window.portalDebug.world, posicao: [posicao.x, posicao.y, posicao.z] };
    })()`);
    console.log('mundo ' + mundo + ' a chegar de ' + (opcoes.direto ? '(primeira visita)' : origem) +
      ': câmara em [' +
      chegada.posicao.map((valor) => Math.round(valor * 100) / 100).join(', ') + ']');

    // As portas **assentam na pose do dado** antes de o shader congelar (D87). O retrato é a imagem
    // que o visitante vê ao chegar, e a chegada acontece na fase 0 do seno — a pose de repouso. Uma
    // sala com portas a oscilar (as salas novas, desde a D87) tinha o retrato cozido na fase em que a
    // página estivesse — arbitrária, porque ela esteve aberta dezenas de segundos — e a janela deixava
    // de mostrar o que o visitante ia ver. `settleMotion` põe as portas onde o ficheiro as escreve e
    // pára o relógio; nas salas sem movimento não há nada a assentar.
    await browser.evaluate(
      '(() => { const d = window.portalDebug; if (d && d.settleMotion) d.settleMotion(); return true; })()'
    ).catch(() => { /* uma página sem o lever */ });

    // O shader **congela** antes de desenhar (2026-10-27). O retrato fixa o instante em cada material,
    // mas o ciclo da exposição volta a escrever `uTime` a cada fotograma — e as seis faces do cubo são
    // desenhadas com esperas pelo meio, cada uma num instante diferente. Era isso que fazia o mesmo
    // retrato sair com 438, 215 e 378 kB em passagens seguidas, e que punha os anéis do mar fora de
    // fase em relação à chegada (a costura de uma porta media 1,4 a 2,0 em vez de 0,3). Congelado, o
    // instante que `shaderTime()` devolve é o mesmo que o retrato guarda.
    await browser.evaluate(
      '(() => { if (window.portalDebug && window.portalDebug.freezeShaders) window.portalDebug.freezeShaders(); return true; })()'
    ).catch(() => { /* um mundo sem política de shader não tem o que congelar */ });

    const desenho = await browser.evaluate(
      DESENHAR(tamanho.largura, tamanho.altura, tamanho.face, tamanho.qualidade), 180000);
    if (!desenho || !desenho.inteiro || !desenho.recorte) {
      throw new Error('o desenho falhou: ' + JSON.stringify(desenho));
    }

    mkdirSync(join(ROOT, 'assets', 'previews'), { recursive: true });
    const escrever = (caminho, dadosUrl) => {
      const bytes = Buffer.from(dadosUrl.split(',')[1], 'base64');
      // A oficina (D96, M1): dois `portrait` ao mesmo tempo desenham os mesmos pares e um apaga o outro.
      oficina('os retratos (portrait)', () => writeAtomic(join(ROOT, caminho), bytes));
      console.log('escrito ' + caminho + ': ' + tamanho.largura + 'x' + tamanho.altura + ', ' +
        Math.round(bytes.length / 1024) + ' kB');
      return bytes.length;
    };
    // O retrato inteiro é a reserva (`?shader=0`, ou um driver que recusa o programa); o recorte é o
    // que a janela compõe sobre o shader ao vivo (D53).
    escrever(destino, desenho.inteiro);
    escrever(recorteDe(destino), desenho.recorte);
  } finally {
    await browser.close();
    await site.close();
  }
}

async function main() {
  if (todos) {
    for (const porta of PORTAS) {
      await gerar(porta.destino, porta.origem, porta.retrato, { direto: porta.direto });
    }
    return;
  }
  const pedido = process.argv[4] && !process.argv[4].startsWith('--') ? process.argv[4] : null;
  await gerar(mundo, origem,
    pedido || join('assets', 'previews', mundo + '-de-' + origem + '.jpg'), { direto });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
