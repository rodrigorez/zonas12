// A costura de uma travessia, medida porta a porta.
//
// O que se mede: atravessa-se a porta a pé, a olhar para ela; a página que sai guarda o quadro da ponte
// (o que estava no ecrã) e a que chega é fotografada depois de assente. A diferença entre as duas
// assinaturas 4x4 de luminosidade é o **salto no corte** — o que muda de uma imagem para a outra.
//
// A referência é o movimento: um passo a caminhar muda a imagem em ~1 (mediana), e os passos mais
// largos chegam a 3. Um salto no corte abaixo disso não se distingue de andar — a meta do B20 (D46) é
// **0,5**. A coluna do maior passo inclui o próprio corte (é a maior diferença entre dois fotogramas
// seguidos, travessia adentro) e fica ali como retrato do que é mexer.
//
// Só as portas com retrato entram na verificação: as duas que mostram a câmara (cidade 2 e praia 5)
// levam ao portão, cuja imagem é a câmara ao vivo — uma fotografia nunca é igual a uma câmara a andar,
// e isso não é um salto, é a realidade a mexer.
//
// Uso, da raiz do projeto: node tools/regression/seam.mjs [mundo] [porta]
import { serveProject, openBrowser, checks, difference, sleep } from './harness.mjs';

const LARGURA = 390;
const ALTURA = 844;
const ESCALA = 0.5;

// As portas com retrato, e de que mundo são.
const PORTAS = [
  { mundo: 'gate', porta: 0, destino: 'scene1' },
  { mundo: 'gate', porta: 1, destino: 'scene2' },
  { mundo: 'scene1', porta: 3, destino: 'scene2' },
  { mundo: 'scene2', porta: 4, destino: 'scene1' },
  { mundo: 'scene2', porta: 6, destino: 'scene3' },
  { mundo: 'scene3', porta: 7, destino: 'scene2' }
];

// As que levam ao portão, onde a imagem é a câmara: medidas, mas não verificadas contra 0,5.
const CAMARA = [
  { mundo: 'scene1', porta: 2, destino: 'gate' },
  { mundo: 'scene2', porta: 5, destino: 'gate' }
];

const SONDA = `
  window.__trace = [];
  const marca = (nome) => window.__trace.push({ t: Math.round(performance.now() * 10) / 10, nome: nome });
  const getItemOriginal = Storage.prototype.getItem;
  Storage.prototype.getItem = function (chave) {
    const valor = getItemOriginal.call(this, chave);
    if (chave === 'zonas12.ultimoQuadro' && valor) window.__quadroDaPonte = valor;
    return valor;
  };
  // Só conta como saída depois de a ponte ter sido **vista**: um documento novo passa os primeiros
  // instantes sem quadro nenhum, e isso não é a ponte a sair — é a página a chegar.
  let ponteVista = false;
  const vigia = setInterval(() => {
    const imagem = document.querySelector('.ultimo-quadro');
    if (imagem) ponteVista = true;
    else if (ponteVista && !window.__saiu) { window.__saiu = true; marca('ponte retirada'); }
  }, 8);
`;

// A assinatura do quadro da ponte, medida na página que chega (é lá que ele está).
const ASSINATURA = `
  (async () => {
    const dados = window.__quadroDaPonte;
    if (!dados) return null;
    const imagem = new Image();
    await new Promise((done, fail) => { imagem.onload = done; imagem.onerror = fail; imagem.src = dados; });
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = Math.round(160 * imagem.naturalHeight / imagem.naturalWidth);
    const contexto = canvas.getContext('2d');
    contexto.drawImage(imagem, 0, 0, canvas.width, canvas.height);
    const pixels = contexto.getImageData(0, 0, canvas.width, canvas.height).data;
    const blocos = [];
    for (let by = 0; by < 4; by++) {
      for (let bx = 0; bx < 4; bx++) {
        let soma = 0, n = 0;
        const x0 = Math.floor(bx * canvas.width / 4), x1 = Math.floor((bx + 1) * canvas.width / 4);
        const y0 = Math.floor(by * canvas.height / 4), y1 = Math.floor((by + 1) * canvas.height / 4);
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const at = (y * canvas.width + x) * 4;
            soma += 0.299 * pixels[at] + 0.587 * pixels[at + 1] + 0.114 * pixels[at + 2];
            n++;
          }
        }
        blocos.push(soma / n);
      }
    }
    return { blocks: blocos };
  })()
`;

const atravessar = (porta) => `(async () => {
  const cena = document.querySelector('a-scene');
  const cameraEl = cena.querySelector('a-camera');
  const alvo = window.portalDebug.state.portals.find((p) => p.data.id === ${porta});
  if (!alvo) { console.error('a porta ${porta} não está nesta página'); return; }
  const centro = new THREE.Vector3();
  alvo.el.object3D.getWorldPosition(centro);
  const direcao = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(alvo.el.object3D.getWorldQuaternion(new THREE.Quaternion()));
  const olhar = Math.atan2(direcao.x, direcao.z);
  const inicio = centro.clone().addScaledVector(direcao, -6);
  const fim = centro.clone().addScaledVector(direcao, 2.5);
  for (let i = 0; i <= 90; i++) {
    const ponto = inicio.clone().lerp(fim, i / 90);
    cameraEl.object3D.position.set(ponto.x, 1.6, ponto.z);
    cameraEl.object3D.rotation.set(0, olhar, 0);
    await new Promise((done) => requestAnimationFrame(done));
  }
})()`;

async function medir(browser, site, alvo) {
  const bust = 'bust=' + Date.now() + Math.random();
  const url = alvo.mundo === 'gate' ? '/?' + bust : '/' + alvo.mundo + '/?' + bust;
  await browser.goto(site.base + url, 60000);
  await sleep(2500);

  const amostras = [];
  let aCorrer = true;
  let depoisDaPonte = null;
  const inicio = Date.now();
  const amostrar = (async () => {
    while (aCorrer && Date.now() - inicio < 9000) {
      try {
        const shot = await browser.screenshot(ESCALA);
        // O quadro que interessa para a costura é o **primeiro depois de a ponte sair**: com fundos
        // animados, esperar 8 s compara o retrato com um instante qualquer da animação, e isso não é
        // o corte — é o tempo a passar.
        const saiu = await browser.evaluate('Boolean(window.__saiu)').catch(() => false);
        if (saiu && !depoisDaPonte) {
          // Um fotograma pintado depois de a ponte sair, e não a superfície da página anterior que o
          // compositor ainda mostra: dois `requestAnimationFrame` chegam para a cena se pintar.
          await browser.evaluate('new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))')
            .catch(() => { /* a página vai-se embora */ });
          // O fundo do destino pára antes de se medir a costura. O quadro da ponte foi capturado com os
          // shaders **congelados** (D54), por isso comparar com um destino a animar media o tempo que
          // passou e não o corte: era isso que fazia o `scene2 → scene3` variar entre 0,34 e 0,56 sem
          // nada mudar no código. Congelar aqui põe os dois lados no mesmo instante.
          await browser.evaluate('(() => { if (window.portalDebug && window.portalDebug.freezeShaders) window.portalDebug.freezeShaders(); return true; })()')
            .catch(() => { /* sem política (fundo de imagem): nada a congelar */ });
          await browser.evaluate('new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))')
            .catch(() => { /* a página vai-se embora */ });
          depoisDaPonte = await browser.screenshot(ESCALA);
        }
        amostras.push({ t: Date.now() - inicio, mean: shot.mean, blocks: shot.blocks, saiu: saiu });
      } catch (error) {
        amostras.push({ t: Date.now() - inicio, failed: error.message });
      }
      await sleep(5);
    }
  })();
  await sleep(150);
  await browser.page.send('Runtime.evaluate', { expression: atravessar(alvo.porta), awaitPromise: false }, 3000)
    .catch(() => { /* a página vai-se embora */ });
  await sleep(8000);
  aCorrer = false;
  await amostrar;

  const escuros = amostras.filter((item) => !item.failed && item.mean < 6).length;
  const mundo = await browser.evaluate('window.portalDebug && window.portalDebug.world').catch(() => null);
  const ponte = await browser.evaluate(ASSINATURA).catch(() => null);
  const final = await browser.screenshot(ESCALA);
  // A chegada para a costura é o primeiro quadro depois de a ponte sair; o final fica só para se
  // poder olhar para a imagem.
  const chegada = depoisDaPonte || final;
  const salto = ponte ? difference(ponte, chegada) : null;
  const blocos = ponte ? ponte.blocks.map((valor, i) => Math.abs(valor - chegada.blocks[i])) : null;
  // Para se poder olhar para as duas imagens: os pixels do quadro da ponte e o PNG da chegada.
  const pixelsDaPonte = await browser.evaluate('window.__quadroDaPonte || null').catch(() => null);

  // O maior salto entre dois fotogramas seguidos é a régua: o que o olho já aceita como movimento.
  let maiorPasso = 0;
  for (let i = 1; i < amostras.length; i++) {
    if (amostras[i].failed || amostras[i - 1].failed) continue;
    const saltoPasso = difference(amostras[i], amostras[i - 1]);
    if (saltoPasso !== null && saltoPasso > maiorPasso) maiorPasso = saltoPasso;
  }

  return { mundo: mundo, escuros: escuros, salto: salto, blocos: blocos, maiorPasso: maiorPasso,
    ponte: pixelsDaPonte, chegada: final, depoisDaPonte: depoisDaPonte,
    amostras: amostras.filter((item) => !item.failed).length };
}

async function main() {
  const escolhidoMundo = process.argv[2];
  const escolhidaPorta = process.argv[3] === undefined ? null : Number(process.argv[3]);
  const site = await serveProject();
  const browser = await openBrowser({ width: LARGURA, height: ALTURA, dpr: 2, mobile: true, probe: SONDA });
  const result = checks();

  const alvos = escolhidoMundo
    ? PORTAS.concat(CAMARA).filter((alvo) => alvo.mundo === escolhidoMundo &&
      (escolhidaPorta === null || alvo.porta === escolhidaPorta))
    : PORTAS;

  try {
    console.log('porta                     chega a   escuros   salto no corte   maior passo');
    for (const alvo of alvos) {
      const medida = await medir(browser, site, alvo);
      const nome = (alvo.mundo + ' ' + alvo.porta).padEnd(22);
      console.log('  ' + nome + String(medida.mundo).padEnd(9) + String(medida.escuros).padEnd(10) +
        (medida.salto === null ? 'sem ponte' : medida.salto.toFixed(2)).padStart(10) + '          ' +
        medida.maiorPasso.toFixed(2));
      const comCamera = alvo.destino === 'gate';
      if (process.env.IMAGENS && medida.ponte) {
        // As duas imagens que se comparam: a que a ponte pintou e a que o mundo mostrou depois.
        const { writeFileSync } = await import('node:fs');
        const { join } = await import('node:path');
        const prefixo = 'costura-' + alvo.mundo + '-' + alvo.porta;
        writeFileSync(join(process.cwd(), prefixo + '-ponte.jpg'),
          Buffer.from(String(medida.ponte).split(',')[1], 'base64'));
        writeFileSync(join(process.cwd(), prefixo + '-chegada.png'), medida.chegada.bytes);
        if (medida.depoisDaPonte) {
          writeFileSync(join(process.cwd(), prefixo + '-depois.png'), medida.depoisDaPonte.bytes);
        }
        console.log('    escritas ' + prefixo + '-ponte.jpg, ' + prefixo + '-chegada.png e ' + prefixo + '-depois.png');
      }
      if (process.env.BLOCOS && medida.blocos) {
        // Onde é que a diferença está: uma grelha 4x4 do valor absoluto por bloco.
        console.log('    blocos (|ponte - chegada|):');
        for (let linha = 0; linha < 4; linha++) {
          console.log('      ' + medida.blocos.slice(linha * 4, linha * 4 + 4)
            .map((valor) => valor.toFixed(1).padStart(7)).join(''));
        }
      }
      result.check(alvo.mundo + ' ' + alvo.porta + ' → ' + alvo.destino + ': a travessia chega e não tem fotograma escuro',
        medida.mundo === alvo.destino && medida.escuros === 0,
        'mundo=' + medida.mundo + ', ' + medida.escuros + ' escuro(s) em ' + medida.amostras + ' amostra(s)');
      if (comCamera) {
        // A imagem do portão é a câmara ao vivo: uma fotografia nunca é igual a uma câmara a andar.
        console.log('    (leva à câmara: o salto mede a realidade a mexer, não a costura)');
        continue;
      }
      result.check(alvo.mundo + ' ' + alvo.porta + ' → ' + alvo.destino + ': o salto no corte é ≤ 0,50',
        medida.salto !== null && medida.salto <= 0.5,
        medida.salto === null ? 'sem quadro da ponte'
          : medida.salto.toFixed(2) + ' (o maior passo a caminhar é ' + medida.maiorPasso.toFixed(2) + ')');
    }
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('D46 (a costura das travessias)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
