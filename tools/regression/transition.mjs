// A bateria da transição (D42): o botão «ATIVAR EXPOSIÇÃO» não aparece a meio de uma travessia.
//
// O que se mede é uma **linha do tempo**, não um instante: uma sonda instalada antes do documento
// anota cada mudança (botão, «Carregando…», primeira porta) e o resultado compara-se com o que devia
// ser em cada caso. Quatro casos, porque o que muda é a permissão — e porque um deles é uma permissão
// que nunca responde:
//   1. chegada com a permissão dada e a rede a 800 kB/s: o botão **nunca** aparece, e a linha
//      «Carregando…» está lá enquanto a cena não existe;
//   2. primeira visita sem permissão: o botão aparece **antes** dos assets, e o clique esconde-o;
//   3. chegada sem permissão: o botão só volta depois de a câmara ser recusada;
//   4. uma pergunta de permissão que nunca responde: o tempo-limite de 1 s deixa a página utilizável.
//
// Uso, da raiz do projeto: node tools/regression/transition.mjs
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

const LARGURA = 390;
const ALTURA = 844;

// A linha do tempo. Só se guarda o que muda, e a primeira marca do botão e a primeira da cena são
// tomadas a `requestAnimationFrame` para a ordem não depender do intervalo da amostragem.
const SONDA = `(() => {
  window.__linha = [];
  window.__marcas = { botao: null, cena: null };
  const marcar = () => {
    if (window.__marcas.botao === null) {
      const botao = document.getElementById('btn-iniciar');
      if (botao && getComputedStyle(botao).display !== 'none') window.__marcas.botao = Math.round(performance.now());
    }
    if (window.__marcas.cena === null && document.querySelector('[data-portal-id]')) {
      window.__marcas.cena = Math.round(performance.now());
    }
    if (window.__marcas.botao === null || window.__marcas.cena === null) requestAnimationFrame(marcar);
  };
  requestAnimationFrame(marcar);
  const ler = () => {
    const botao = document.getElementById('btn-iniciar');
    const overlay = document.getElementById('loading-overlay');
    const estado = {
      t: Math.round(performance.now()),
      botao: botao ? getComputedStyle(botao).display !== 'none' : null,
      overlay: overlay ? getComputedStyle(overlay).display !== 'none' : null,
      cena: Boolean(document.querySelector('[data-portal-id]'))
    };
    const ultimo = window.__linha[window.__linha.length - 1];
    if (!ultimo || ultimo.botao !== estado.botao || ultimo.overlay !== estado.overlay || ultimo.cena !== estado.cena) {
      window.__linha.push(estado);
    }
    if (performance.now() < 40000) setTimeout(ler, 40);
  };
  setTimeout(ler, 0);
})()`;

// Uma pergunta de permissão que nunca responde: o que um browser mal implementado faz, e o que o
// tempo-limite da D42 tem de sobreviver sem deixar a exposição presa na linha «Carregando…».
const PERMISSAO_MUDA = `(() => {
  if (navigator.permissions) {
    navigator.permissions.query = function () { return new Promise(function () {}); };
  }
})()`;

const PRONTA = `Boolean(window.portalDebug && window.portalDebug.state && window.portalDebug.state.portals && ` +
  `document.querySelector('a-scene') && document.querySelector('a-scene').renderer)`;

async function timeline(browser, url, what) {
  const before = await browser.evaluate('performance.timeOrigin').catch(() => null);
  await browser.page.send('Page.navigate', { url });
  const until = Date.now() + 90000;
  while (Date.now() < until) {
    try {
      if (await browser.evaluate(`performance.timeOrigin !== ${before} && ${PRONTA}`)) break;
    } catch (error) { /* ainda a navegar */ }
    await sleep(250);
  }
  await sleep(12000);
  const linha = await browser.evaluate('window.__linha');
  console.log('');
  console.log('== ' + what + ' ==');
  for (const passo of linha) {
    console.log('  ' + String(passo.t).padStart(6) + ' ms  botão: ' + String(passo.botao).padEnd(5) +
      '  carregando: ' + String(passo.overlay).padEnd(5) + '  cena: ' + passo.cena);
  }
  return linha;
}

async function main() {
  const site = await serveProject();
  const result = checks();
  const bust = '?bust=' + Date.now();

  // ---- 1. a chegada a uma sala, com a permissão já dada, em 3G ----
  let browser = await openBrowser({
    width: LARGURA, height: ALTURA, dpr: 2, mobile: true, camera: true, throttle: true, probe: SONDA
  });
  try {
    await browser.grantCamera(site.base);
    const linha = await timeline(browser, site.base + '/scene2/?from=scene1&' + bust.slice(1),
      'chegada à praia, com permissão, 800 kB/s');
    result.check('na transição para uma sala o botão nunca aparece',
      linha.every((passo) => passo.botao !== true),
      linha.filter((passo) => passo.botao === true).length + ' passo(s) com botão');
    result.check('e o ecrã não fica vazio enquanto carrega: a linha «Carregando…» está lá',
      linha.some((passo) => passo.overlay === true && passo.cena === false),
      JSON.stringify(linha.slice(0, 4)));
    const fim = linha[linha.length - 1];
    result.check('no fim: cena pronta, botão fora e nada por cima',
      fim.cena === true && fim.botao === false && fim.overlay === false, JSON.stringify(fim));
  } finally {
    await browser.close();
  }

  // ---- 2. a primeira visita, sem permissão ----
  browser = await openBrowser({ width: LARGURA, height: ALTURA, dpr: 2, mobile: true, camera: false, probe: SONDA });
  try {
    const linha = await timeline(browser, site.base + '/' + bust, 'primeira visita, sem permissão');
    const marcas = await browser.evaluate('window.__marcas');
    const primeiro = linha.find((passo) => passo.botao === true);
    result.check('na primeira visita o botão aparece', Boolean(primeiro), JSON.stringify(linha.slice(0, 4)));
    result.check('e antes de a cena existir (não espera pelos assets)',
      typeof marcas.botao === 'number' && (marcas.cena === null || marcas.botao < marcas.cena),
      JSON.stringify(marcas));
    const clicado = await browser.evaluate(`(async () => {
      document.getElementById('btn-iniciar').click();
      await new Promise((done) => setTimeout(done, 2000));
      return { botao: getComputedStyle(document.getElementById('btn-iniciar')).display };
    })()`);
    result.check('e o clique continua a esconder o botão', clicado.botao === 'none', JSON.stringify(clicado));
  } finally {
    await browser.close();
  }

  // ---- 3. a chegada sem permissão: tenta, falha e devolve o botão ----
  browser = await openBrowser({ width: LARGURA, height: ALTURA, dpr: 2, mobile: true, camera: false, probe: SONDA });
  try {
    const linha = await timeline(browser, site.base + '/scene1/?from=gate&' + bust.slice(1),
      'chegada à cidade, sem permissão');
    const comBotao = linha.filter((passo) => passo.botao === true);
    result.check('sem permissão, o botão só aparece depois de a câmara ser recusada',
      comBotao.length > 0 && comBotao[0].cena === true, JSON.stringify(comBotao.slice(0, 2)));
  } finally {
    await browser.close();
  }

  // ---- 4. um browser que não responde à pergunta da permissão ----
  browser = await openBrowser({ width: LARGURA, height: ALTURA, dpr: 2, mobile: true, camera: false, probe: SONDA });
  try {
    await browser.page.send('Page.addScriptToEvaluateOnNewDocument', { source: PERMISSAO_MUDA });
    const linha = await timeline(browser, site.base + '/' + bust, 'permissão que nunca responde');
    const primeiro = linha.find((passo) => passo.botao === true);
    result.check('a pergunta sem resposta não trava a página: o botão aparece na mesma',
      Boolean(primeiro) && primeiro.t < 6000, primeiro ? 'botão aos ' + primeiro.t + ' ms' : 'sem botão');
    const estado = await browser.evaluate(`({
      botao: getComputedStyle(document.getElementById('btn-iniciar')).display,
      overlay: getComputedStyle(document.getElementById('loading-overlay')).display
    })`);
    result.check('e a página fica utilizável', estado.botao === 'block' && estado.overlay === 'none',
      JSON.stringify(estado));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('D42 (a transição e o botão)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
