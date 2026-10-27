// A bateria do botão de entrada (D41): o botão é a porta para a câmara, não um «play», por isso segue
// a câmara e não o clique.
//
// Três instâncias de Chrome, porque o que muda é a permissão — e é ela que decide tudo:
//   1. sem permissão: a primeira visita fica com o botão à espera e **não** pede a câmara (a regra do
//      gesto); uma chegada por uma porta tenta, falha e devolve o botão com a mensagem (o recuo da D37);
//   2. com a permissão já dada: a primeira visita arranca sozinha, e numa sala — onde a câmara só se vê
//      pela janela da porta — o botão desaparece à mesma, porque quem manda é o stream e não a vista;
//   3. no telemóvel (390×844, toque): o botão sai e o D-pad entra.
//
// Uso, da raiz do projeto: node tools/regression/start-button.mjs
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

// A câmara é pedida quando a cena acaba de ser construída, por isso o contador tem de existir **antes**
// do documento: uma sonda instalada depois só veria os pedidos que ainda não aconteceram.
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

const ESTADO = `(() => {
  const button = document.getElementById('btn-iniciar');
  const pad = document.getElementById('controles-mobile');
  const video = document.getElementById('webcam-video');
  const overlay = document.getElementById('loading-overlay');
  return {
    url: location.pathname + location.search,
    mundo: window.portalDebug && window.portalDebug.world,
    botao: button ? getComputedStyle(button).display : null,
    dpad: pad ? getComputedStyle(pad).display : null,
    overlay: overlay ? getComputedStyle(overlay).display : null,
    stream: Boolean(video && video.srcObject),
    erro: Boolean(document.getElementById('erro-camera')),
    pedidos: window.__gum
  };
})()`;

const PRONTA = `Boolean(window.portalDebug && window.portalDebug.built && window.portalDebug.world && document.querySelector('a-scene').renderer)`;

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

  // ---- 1. primeira visita, sem permissão nenhuma ----
  console.log('== 1. primeira visita, sem permissão ==');
  let browser = await openBrowser({ camera: false, probe: CONTA });
  try {
    const primeira = await open(browser, site.base + '/?' + bust);
    result.check('a primeira visita fica com o botão à espera e não pede a câmara',
      primeira.botao === 'block' && primeira.pedidos === 0 && primeira.stream === false,
      JSON.stringify(primeira));

    const recusada = await open(browser, site.base + '/?from=scene1&' + bust);
    result.check('a chegada tenta a câmara, falha sem permissão e devolve o botão com a mensagem',
      recusada.pedidos === 1 && recusada.botao === 'block' && recusada.erro === true && recusada.stream === false,
      JSON.stringify(recusada));
  } finally {
    await browser.close();
  }

  // ---- 2. a permissão já foi dada numa visita anterior ----
  console.log('');
  console.log('== 2. permissão já dada (visita anterior) ==');
  browser = await openBrowser({ camera: true, probe: CONTA });
  try {
    await browser.grantCamera(site.base);
    const portao = await open(browser, site.base + '/?' + bust);
    result.check('com a permissão já dada, a primeira visita arranca sozinha',
      portao.botao === 'none' && portao.stream === true && portao.pedidos === 1 && portao.overlay === 'none',
      JSON.stringify(portao));

    // Numa sala a câmara só se vê pela janela da porta: o botão tem de desaparecer à mesma.
    const sala = await open(browser, site.base + '/?scene=scene1&' + bust);
    result.check('numa sala, com a câmara fora da vista, o botão também desaparece',
      sala.botao === 'none' && sala.stream === true && sala.pedidos === 1, JSON.stringify(sala));

    const modulo = await browser.evaluate(`(async () => {
      const camera = await import('/js/modules/camera.js');
      return {
        activa: camera.isCameraActive(),
        permitida: await camera.cameraAlreadyAllowed(),
        botao: getComputedStyle(document.getElementById('btn-iniciar')).display
      };
    })()`);
    result.check('o módulo diz que a câmara está activa e que a permissão é dele',
      modulo.activa === true && modulo.permitida === true && modulo.botao === 'none', JSON.stringify(modulo));
  } finally {
    await browser.close();
  }

  // ---- 3. o mesmo, em telemóvel ----
  console.log('');
  console.log('== 3. telemóvel (390×844, toque) ==');
  browser = await openBrowser({ camera: true, probe: CONTA, width: 390, height: 844, dpr: 3, mobile: true });
  try {
    // O A-Frame decide «é telemóvel» pelo agente do utilizador e pelo toque, não pelo tamanho da janela.
    await browser.page.send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await browser.page.send('Emulation.setUserAgentOverride', {
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 ' +
        '(KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    });
    await browser.grantCamera(site.base);

    const telemovel = await open(browser, site.base + '/?scene=scene2&' + bust);
    result.check('no telemóvel, com permissão: botão fora e D-pad dentro',
      telemovel.botao === 'none' && telemovel.stream === true && telemovel.dpad === 'block',
      JSON.stringify(telemovel));
    const reconhece = await browser.evaluate('({ telemovel: AFRAME.utils.device.isMobile() })');
    result.check('a página reconhece-se como telemóvel', reconhece.telemovel === true, JSON.stringify(reconhece));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('D41 (o botão de entrada)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
