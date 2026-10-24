// A bateria da chegada: quem vem por uma porta não carrega em nada para entrar (D37), e o botão de
// entrada segue a câmara e não o clique (D41) — as duas decisões medem-se juntas porque é a mesma
// pergunta: quem pede a câmara, e quando.
//
// Duas metades, porque o que muda é a permissão:
//   · câmara concedida (dispositivo falso): a primeira visita arranca sozinha, a chegada a uma sala
//     também, e o céu — que não tem câmara nenhuma — não faz pedido nenhum;
//   · câmara recusada (o `getUserMedia` substituído por um que rejeita, antes da carga): o botão volta
//     com a mensagem, que é o recuo da D37.
//
// Uso, da raiz do projeto: node tools/regression/camera-arrival.mjs
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

// Quantas vezes a página pediu a câmara. É o número que distingue «arrancou sozinha» de «pediu licença».
const CONTA = `(() => {
  window.__gum = 0;
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && !navigator.mediaDevices.__conta) {
    const original = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function (constraints) {
      window.__gum++;
      return original(constraints);
    };
    navigator.mediaDevices.__conta = true;
  }
})()`;

// A recusa: um `getUserMedia` que diz não, instalado antes de qualquer documento correr.
const RECUSA = `(() => {
  window.__gum = 0;
  navigator.mediaDevices.getUserMedia = function () {
    window.__gum++;
    const error = new Error('Permission denied');
    error.name = 'NotAllowedError';
    return Promise.reject(error);
  };
})()`;

const ESTADO = `(() => {
  const button = document.getElementById('btn-iniciar');
  const video = document.getElementById('webcam-video');
  return {
    url: location.pathname + location.search,
    world: window.portalDebug && window.portalDebug.world,
    botao: button ? getComputedStyle(button).display : null,
    erro: Boolean(document.getElementById('erro-camera')),
    video: video && video.srcObject ? 'com stream' : 'sem stream',
    pedidos: window.__gum
  };
})()`;

const PRONTA = `Boolean(window.portalDebug && window.portalDebug.world && document.querySelector('a-scene').renderer)`;

// Abre uma página e devolve o estado depois de ela estar construída. A `timeOrigin` tem de mudar: sem
// isso lê-se o documento anterior, que ainda está a responder.
async function open(browser, url) {
  const before = await browser.evaluate('performance.timeOrigin').catch(() => null);
  await browser.page.send('Page.navigate', { url });
  for (let i = 0; i < 300; i++) {
    try {
      if (await browser.evaluate(`performance.timeOrigin !== ${before} && ${PRONTA}`)) break;
    } catch (error) { /* ainda a navegar */ }
    await sleep(200);
  }
  await sleep(2500);
  return browser.evaluate(ESTADO);
}

async function main() {
  const site = await serveProject();
  const result = checks();
  const bust = 'bust=' + Date.now();

  console.log('== câmara concedida ==');
  let browser = await openBrowser({ camera: true, probe: CONTA });
  try {
    const portao = await open(browser, site.base + '/?' + bust);
    // D41: com a permissão já dada não há gesto a pedir, e a primeira visita arranca sozinha — o botão
    // só volta se a câmara for recusada.
    result.check('primeira visita com a permissão dada: arranca sozinha e não mostra o botão (D41)',
      portao.botao === 'none' && portao.pedidos === 1 && portao.video === 'com stream', JSON.stringify(portao));

    const cidade = await open(browser, site.base + '/scene1/?from=gate&' + bust);
    // Uma sala com dimensão `camera` mostra a realidade (D38), por isso pede a câmara na mesma — o que
    // a D37 garante é que ninguém tem de carregar num botão para entrar.
    result.check('chegar a uma sala por uma porta: entra sozinha, sem botão, e a câmara é pedida (D38)',
      cidade.botao === 'none' && cidade.pedidos === 1 && cidade.erro === false, JSON.stringify(cidade));

    const volta = await open(browser, site.base + '/?from=scene1&' + bust);
    result.check('voltar ao portão por uma porta: arranca sozinho e pede a câmara uma vez',
      volta.botao === 'none' && volta.pedidos === 1 && volta.video === 'com stream', JSON.stringify(volta));

    const ceu = await open(browser, site.base + '/scene3/?from=scene2&' + bust);
    result.check('outra sala, sem câmara nos dados: arranca sozinha e não faz pedido nenhum',
      ceu.botao === 'none' && ceu.pedidos === 0, JSON.stringify(ceu));
  } finally {
    await browser.close();
  }

  console.log('');
  console.log('== câmara recusada (o browser quer o gesto) ==');
  browser = await openBrowser({ camera: false, probe: RECUSA });
  try {
    const recusada = await open(browser, site.base + '/?from=scene1&' + bust);
    result.check('se a câmara for recusada, o botão volta com a mensagem (o recuo da D37)',
      recusada.botao === 'block' && recusada.erro === true, JSON.stringify(recusada));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('D37 (a chegada por uma porta)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
