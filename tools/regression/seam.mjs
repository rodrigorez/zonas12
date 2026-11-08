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
// As portas que mostram a câmara — uma por sala, a do portão — são medidas mas não entram na
// verificação: a imagem delas é a câmara ao vivo, e uma fotografia nunca é igual a uma câmara a andar.
// Isso não é um salto, é a realidade a mexer.
//
// **O estado hoje: a bateria falha, e já falhava antes do anel.** Medida a mesma lista no marco
// v0.0.16 (as filas, o código e os retratos de então), a costura deu 3,4 a 17,3 onde a meta é 0,50 —
// os valores de 0,31 a 0,41 que estão no ROADMAP são de um estado anterior da janela (D53 passou a
// desenhar o fundo do destino ao vivo, em vez do retrato). O que se corrigiu aqui foi o caminho: o
// instrumento atravessava a porta **de fora para dentro**, e a janela é uma máscara de uma face.
// O que falta é a janela e a chegada não darem a mesma imagem — fica por investigar, e até lá esta
// bateria não serve de portão.
//
// Uso, da raiz do projeto: node tools/regression/seam.mjs [mundo] [porta]
import { join } from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import { ROOT, serveProject, openBrowser, checks, difference, sleep } from './harness.mjs';
import { FIXTURES } from '../../js/scene/fixtures.js';

const LARGURA = 390;
const ALTURA = 844;
const ESCALA = 0.5;

// As portas, lidas do dado: uma entrada por porta que navega, com o mundo onde ela está e o destino.
//
// A lista esteve escrita à mão e envelheceu — a disposição em dois anéis (D77) mudou portas de sítio e
// de id, e a lista continuava a apontar para a porta 33, que já não existe. O grafo é do dado, e é o
// mesmo ficheiro que a exposição carrega que se lê aqui.
//
// As que levam ao portão mostram a câmara ao vivo: são medidas, mas não julgadas contra 0,5 — uma
// fotografia nunca é igual a uma câmara a andar.
function portasDoDado() {
  const portas = [];
  for (const name of readdirSync(join(ROOT, 'data', 'worlds')).filter((entry) => entry.endsWith('.json'))) {
    const scene = JSON.parse(readFileSync(join(ROOT, 'data', 'worlds', name), 'utf8'));
    const mundo = scene.world && scene.world.slug;
    if (!mundo || FIXTURES.includes(mundo)) continue;
    MUNDOS.set(mundo, scene);
    for (const portal of scene.portals || []) {
      const acao = portal.action || {};
      if (acao.kind !== 'navigate' || typeof acao.target !== 'string') continue;
      portas.push({ mundo: mundo, porta: portal.id, destino: acao.target,
        // Os buracos do mundo real desta janela (D81): os blocos que eles ocupam na imagem não são
        // comparados (ver `blocosDoMundoReal`).
        reality: portal.window && Array.isArray(portal.window.reality) ? portal.window.reality : [] });
    }
  }
  return portas;
}

const MUNDOS = new Map();
const PORTAS = portasDoDado();

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

// A travessia, feita pelo caminho do visitante: de **dentro** da sala, a olhar para a porta, até ficar
// do outro lado. Com a disposição em anel (D77) as portas ficaram a 60 m do centro e viradas para
// dentro, e o caminho que este instrumento fazia — começar atrás da porta e atravessá-la — passou a
// ser o único que ninguém faz: entrava-se pelo lado de fora, sem retrato nenhum à vista, e media-se o
// salto entre a sala de partida e a de chegada (65,9 numa porta que devia dar 0,3). O olhar vai pelo
// `setPose` da câmara (D63), que é quem escreve no `look-controls`.
const atravessar = (porta) => `(async () => {
  const { playerCamera } = await import('/js/modules/camera.js');
  // As portas na **pose do dado** antes de andar (D91): a caminhada entra pela porta que o ficheiro
  // descreve, e uma porta a oscilar está a metros dela — sem assentar, a travessia não acontecia e a
  // ponte não existia (medido: 36 de 128 verificações, contra 125 antes do movimento entrar nas salas).
  if (window.portalDebug && window.portalDebug.settleMotion) window.portalDebug.settleMotion();
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const alvo = window.portalDebug.state.portals.find((p) => p.data.id === ${porta});
  if (!alvo) { console.error('a porta ${porta} não está nesta página'); return; }
  const centro = new THREE.Vector3();
  alvo.el.object3D.getWorldPosition(centro);
  const frente = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(alvo.el.object3D.getWorldQuaternion(new THREE.Quaternion()));
  const olhar = (Math.atan2(frente.x, frente.z) * 180) / Math.PI;
  const inicio = centro.clone().addScaledVector(frente, 6);
  const fim = centro.clone().addScaledVector(frente, -2.5);
  for (let i = 0; i <= 90; i++) {
    const ponto = inicio.clone().lerp(fim, i / 90);
    playerCamera.setPose({ position: [ponto.x, 1.6, ponto.z], yaw: olhar, pitch: 0 });
    await new Promise((done) => requestAnimationFrame(done));
  }
})()`;

// A diferença de duas assinaturas 4x4, **ignorando os blocos onde está o mundo real** (D81). Uma porta
// do destino que mostra a dimensão `camera` não desenha nada: o que se vê por ela é o `<video>` da
// câmara, atrás do canvas. Na janela e na chegada está a mesma câmara, mas cada página abre o **seu**
// stream e dois fotogramas nunca coincidem (verde contra preto media 2,34 onde a geometria dá 0,28) —
// o mundo real não é uma imagem, e o que esta bateria mede é a imagem. Os blocos ignorados contam-se do
// retângulo que o dado guarda em `window.reality`, projectado com a câmara da chegada.
function diferencaSem(um, outro, ignorados) {
  if (!um || !outro || !um.blocks || !outro.blocks) return null;
  let total = 0;
  let contados = 0;
  for (let i = 0; i < um.blocks.length; i++) {
    if (ignorados.has(i)) continue;
    total += Math.abs(um.blocks[i] - outro.blocks[i]);
    contados += 1;
  }
  return contados === 0 ? null : total / contados;
}

// Os blocos 4x4 (índice = linha * 4 + coluna) que o mundo real ocupa na chegada, a partir dos
// retângulos em azimute/elevação que o dado da porta de origem guarda. A janela e a chegada vêem a
// mesma direcção (é o que a D78 alinhou), por isso o mesmo retângulo serve para as duas imagens.
function blocosDoMundoReal(alvo, mundoDestino) {
  const ignorados = new Set();
  const buracos = Array.isArray(alvo.reality) ? alvo.reality : [];
  if (buracos.length === 0) return ignorados;
  const chegada = (mundoDestino.portals || []).find((porta) => porta.arrivalFrom === alvo.mundo);
  if (!chegada) return ignorados;
  // A direcção da chegada: o visitante aterra virado para **dentro** da sala, meio giro depois da
  // porta que atravessou (js/scene/arrival.js). O eixo da câmara é o mesmo que a janela mostra — é o
  // que a D78 alinhou —, por isso o retângulo do dado serve para as duas imagens.
  const yaw = (((chegada.rotation && chegada.rotation[1]) || 0) + 180) * (Math.PI / 180);
  // O eixo da câmara para uma rotação de A-Frame: a frente (0,0,−1) rodada por `yaw`, e a direita.
  const frente = [-Math.sin(yaw), 0, -Math.cos(yaw)];
  const direita = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const vertical = (60 * Math.PI) / 180;
  const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * (LARGURA / ALTURA));
  for (const buraco of buracos) {
    for (const az of [buraco.az0, buraco.az1]) {
      for (const el of [buraco.el0, buraco.el1]) {
        const radianos = { az: (az * Math.PI) / 180, el: (el * Math.PI) / 180 };
        const direcao = [
          Math.sin(radianos.az) * Math.cos(radianos.el),
          Math.sin(radianos.el),
          -Math.cos(radianos.az) * Math.cos(radianos.el)
        ];
        const profundidade = direcao[0] * frente[0] + direcao[2] * frente[2];
        if (profundidade <= 0.01) continue;
        const x = ((direcao[0] * direita[0] + direcao[2] * direita[2]) / profundidade) /
          Math.tan(horizontal / 2);
        const y = (direcao[1] / profundidade) / Math.tan(vertical / 2);
        const coluna = Math.min(3, Math.max(0, Math.floor(((x + 1) / 2) * 4)));
        const linha = Math.min(3, Math.max(0, Math.floor(((1 - y) / 2) * 4)));
        ignorados.add(linha * 4 + coluna);
      }
    }
  }
  return ignorados;
}

async function medir(browser, site, alvo) {
  const bust = 'bust=' + Date.now() + Math.random();
  const url = alvo.mundo === 'gate' ? '/?' + bust : '/' + alvo.mundo + '/?' + bust;
  await browser.goto(site.base + url, 60000);
  await sleep(2500);

  const amostras = [];
  let aCorrer = true;
  let depoisDaPonte = null;
  let mesmoInstante = null;
  let relogio = null;
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
          // As portas, na **pose do dado** (D91): o retrato que a ponte mostra foi cozido com elas
          // assentes, e congelar o movimento onde ele está deixava a porta do destino a meio de uma
          // oscilação — a costura passava a medir isso em vez do corte.
          await browser.evaluate('(() => { if (window.portalDebug && window.portalDebug.settleMotion) window.portalDebug.settleMotion(); return true; })()')
            .catch(() => { /* sem portais em movimento: nada a assentar */ });
          await browser.evaluate('new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))')
            .catch(() => { /* a página vai-se embora */ });
          depoisDaPonte = await browser.screenshot(ESCALA);
          // O instante que cada lado está a mostrar (D53/D78): a ponte leva-o consigo, e a chegada
          // continua-o. A diferença entre os dois é o **salto de tempo** no corte.
          relogio = await browser.evaluate(`(() => {
            const ponte = window.arrivalFrame && window.arrivalFrame.shaderTime
              ? window.arrivalFrame.shaderTime() : null;
            const politica = window.portalDebug && window.portalDebug.shader
              ? window.portalDebug.shader().policy : null;
            return { ponte: typeof ponte === 'number' ? ponte : null,
              chegada: politica && typeof politica.time === 'number' ? politica.time : null };
          })()`).catch(() => null);
          // O mesmo quadro com a chegada **no instante da ponte**: a costura da imagem mede-se com os
          // dois lados parados no mesmo instante, senão mede-se a animação a andar (D53 faz a janela
          // animar, e 0,1 s de mangue vale 16 na assinatura).
          if (relogio && typeof relogio.ponte === 'number') {
            await browser.evaluate(`import('/js/modules/dimension.js').then((modulo) =>
              modulo.anchorShaders(${relogio.ponte}))`).catch(() => null);
            await browser.evaluate('new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)))')
              .catch(() => { /* a página vai-se embora */ });
            mesmoInstante = await browser.screenshot(ESCALA);
          }
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
  // A costura da **imagem**: a ponte contra a chegada no mesmo instante (D78). Sem o mesmo instante,
  // a diferença mede também a animação a andar — e o que se quer saber é se o quadro está no sítio.
  const comMesmoInstante = mesmoInstante || chegada;
  // O mundo real não é uma imagem (D81): os blocos que ele ocupa não entram nesta conta.
  const ignorados = blocosDoMundoReal(alvo, MUNDOS.get(alvo.destino));
  const salto = ponte ? diferencaSem(ponte, comMesmoInstante, ignorados) : null;
  const saltoNatural = ponte ? diferencaSem(ponte, chegada, ignorados) : null;
  const blocos = ponte ? ponte.blocks.map((valor, i) => (ignorados.has(i) ? null : Math.abs(valor - comMesmoInstante.blocks[i]))) : null;
  // O **salto de tempo** no corte: o instante que a página que chegou estava a mostrar menos o que a
  // ponte trazia. É a outra metade da costura: a imagem pode estar no sítio e o instante não.
  const instante = relogio && typeof relogio.ponte === 'number' && typeof relogio.chegada === 'number'
    ? relogio.chegada - relogio.ponte
    : null;
  // Para se poder olhar para as duas imagens: os pixels do quadro da ponte e o PNG da chegada.
  const pixelsDaPonte = await browser.evaluate('window.__quadroDaPonte || null').catch(() => null);

  // O maior salto entre dois fotogramas seguidos é a régua: o que o olho já aceita como movimento.
  let maiorPasso = 0;
  for (let i = 1; i < amostras.length; i++) {
    if (amostras[i].failed || amostras[i - 1].failed) continue;
    const saltoPasso = difference(amostras[i], amostras[i - 1]);
    if (saltoPasso !== null && saltoPasso > maiorPasso) maiorPasso = saltoPasso;
  }

  return { mundo: mundo, escuros: escuros, salto: salto, saltoNatural: saltoNatural, instante: instante,
    blocos: blocos, maiorPasso: maiorPasso,
    ponte: pixelsDaPonte, chegada: final, depoisDaPonte: depoisDaPonte, mesmoInstante: mesmoInstante,
    amostras: amostras.filter((item) => !item.failed).length };
}

async function main() {
  const escolhidoMundo = process.argv[2];
  const escolhidaPorta = process.argv[3] === undefined ? null : Number(process.argv[3]);
  const site = await serveProject();
  const browser = await openBrowser({ width: LARGURA, height: ALTURA, dpr: 2, mobile: true, probe: SONDA });
  const result = checks();

  const alvos = escolhidoMundo
    ? PORTAS.filter((alvo) => alvo.mundo === escolhidoMundo &&
      (escolhidaPorta === null || alvo.porta === escolhidaPorta))
    : PORTAS;

  try {
    console.log('porta                     chega a   escuros   salto no corte   salto de tempo   maior passo');
    for (const alvo of alvos) {
      const medida = await medir(browser, site, alvo);
      const nome = (alvo.mundo + ' ' + alvo.porta).padEnd(22);
      console.log('  ' + nome + String(medida.mundo).padEnd(9) + String(medida.escuros).padEnd(10) +
        (medida.salto === null ? 'sem ponte' : medida.salto.toFixed(2)).padStart(10) + '          ' +
        (medida.instante === null ? '—' : (medida.instante * 1000).toFixed(0) + ' ms').padStart(12) +
        '   ' + medida.maiorPasso.toFixed(2));
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
            .map((valor) => (valor === null ? '   real' : valor.toFixed(1).padStart(7))).join(''));
        }
      }
      if (comCamera) {
        // A imagem do portão é a câmara ao vivo: uma fotografia nunca é igual a uma câmara a andar, e
        // os «fotogramas escuros» de uma chegada ao portão são o arranque do dispositivo de câmara do
        // Chrome, não a costura a falhar. Julga-se que a travessia **chega**; o salto e os escuros
        // ficam de fora — o salto já ficava, e a mesma excepção passa a valer para a escuridão.
        result.check(alvo.mundo + ' ' + alvo.porta + ' → ' + alvo.destino +
          ': a travessia chega (a chegada é a câmara, não se julga a imagem)',
          medida.mundo === alvo.destino,
          'mundo=' + medida.mundo + ' — a janela mostra a câmara ao vivo: ' + medida.escuros +
            ' escuro(s) em ' + medida.amostras + ' amostra(s) são o arranque do dispositivo');
        console.log('    (leva à câmara: o salto mede a realidade a mexer, não a costura)');
        continue;
      }
      result.check(alvo.mundo + ' ' + alvo.porta + ' → ' + alvo.destino + ': a travessia chega e não tem fotograma escuro',
        medida.mundo === alvo.destino && medida.escuros === 0,
        'mundo=' + medida.mundo + ', ' + medida.escuros + ' escuro(s) em ' + medida.amostras + ' amostra(s)');
      result.check(alvo.mundo + ' ' + alvo.porta + ' → ' + alvo.destino + ': o salto no corte é ≤ 0,50',
        medida.salto !== null && medida.salto <= 0.5,
        medida.salto === null ? 'sem quadro da ponte'
          : medida.salto.toFixed(2) + ' (no instante em que a página chegou era ' +
            (medida.saltoNatural === null ? '—' : medida.saltoNatural.toFixed(2)) +
            '; o maior passo a caminhar é ' + medida.maiorPasso.toFixed(2) + ')');
      // A outra metade (D78): a imagem pode estar no sítio e o instante não. Um quadro de fundo é uma
      // atualização da cadência — 50 ms a 20 por segundo, o intervalo em que o `uTime` pode mudar.
      result.check(alvo.mundo + ' ' + alvo.porta + ' → ' + alvo.destino + ': o instante do corte é ≤ 1 quadro',
        medida.instante !== null && Math.abs(medida.instante) <= 0.05,
        medida.instante === null ? 'a página não diz o instante em que chegou'
          : (medida.instante * 1000).toFixed(0) + ' ms de animação (um quadro de fundo é 50 ms)');
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
