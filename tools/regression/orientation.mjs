// A orientação do telemóvel (D52): o magic-window do A-Frame é o que faz do aparelho uma janela para
// a cena, mas num telemóvel **sem giroscópio** o ruído do acelerómetro chega ao ecrã como tremor. O
// que esta bateria responde, e nesta ordem:
//
//   1. com `?giroscopio=0` o magic-window é desligado logo, e a câmara deixa de seguir o sensor;
//   2. com um sensor ruidoso (eventos a saltar de amostra para amostra) ele é desligado sozinho
//      depois da medição, e a câmara também deixa de seguir;
//   3. com um sensor estável (valores a andar devagar) fica **ligado**, e a câmara segue;
//   4. a sonda mostra a linha do giroscópio com o tremor medido.
//
// Os eventos são sintéticos (`new DeviceOrientationEvent(...)`), porque um Chrome sem cabeça não tem
// sensores: o que se exercita é a decisão, que é o que o módulo faz de nosso.
//
// Uso, da raiz do projeto: node tools/regression/orientation.mjs
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

const RUIDOSO = `(() => {
  let n = 0;
  window.__sensorStop = false;
  const passo = () => {
    if (window.__sensorStop) return;
    n += 1;
    // Saltos de graus entre amostras: o que um acelerómetro sozinho entrega a olho nu.
    const salto = (n % 2 ? 1 : -1) * (2 + (n % 5));
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', {
      alpha: 30 + salto, beta: 10 - salto, gamma: 5 + salto
    }));
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
})()`;

const ESTAVEL = `(() => {
  let n = 0;
  window.__sensorStop = false;
  const passo = () => {
    if (window.__sensorStop) return;
    n += 1;
    // Uma deriva lenta: é o que um giroscópio fundido entrega — o visitante a mexer-se devagar.
    window.dispatchEvent(new DeviceOrientationEvent('deviceorientation', {
      alpha: 30 + n * 0.05, beta: 10 + n * 0.03, gamma: 5 + n * 0.02
    }));
    requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
})()`;

const ROTACAO = `(() => {
  const camera = document.querySelector('a-camera');
  return { x: +camera.object3D.rotation.x.toFixed(4), y: +camera.object3D.rotation.y.toFixed(4) };
})()`;

async function main() {
  const site = await serveProject();
  const browser = await openBrowser({ width: 390, height: 844, dpr: 2, mobile: true });
  const check = checks();
  const stamp = () => 'bust=' + Date.now() + '-' + Math.random();

  try {
    // 1. O escape: `?giroscopio=0` desliga logo, sem esperar pela medição.
    await browser.goto(site.base + '/scene1/?giroscopio=0&' + stamp(), 60000);
    await sleep(1200);
    const forcado = await browser.evaluate('window.portalDebug.orientation()');
    const dadosForcado = await browser.evaluate(
      `(() => document.querySelector('a-camera').components['look-controls'].data.magicWindowTrackingEnabled)()`);
    check.check('?giroscopio=0 desliga o magic-window de imediato',
      forcado.tracking === false && forcado.reason === '?giroscopio=0' && dadosForcado === false,
      JSON.stringify(forcado) + ' · look-controls=' + dadosForcado);

    // 2. Sensor ruidoso: mede, decide, desliga — e a câmara deixa de seguir.
    await browser.goto(site.base + '/scene1/?' + stamp(), 60000);
    await sleep(600);
    await browser.evaluate(RUIDOSO);
    await sleep(6500);
    const ruidoso = await browser.evaluate('window.portalDebug.orientation()');
    // A comparação é **depois** de a decisão estar tomada: durante os 6 s de medição a câmara segue o
    // sensor (é o que se está a medir), e comparar com o início media isso, não a decisão.
    const depoisRuidoso = await browser.evaluate(ROTACAO);
    await sleep(1200);
    const maisTarde = await browser.evaluate(ROTACAO);
    await browser.evaluate('window.__sensorStop = true');
    check.check('um sensor ruidoso é desligado sozinho, com o piso de ruído medido',
      ruidoso.tracking === false && ruidoso.reason === 'sensor ruidoso' &&
        ruidoso.jitter !== null && ruidoso.jitter > 0.5 && ruidoso.samples > 100,
      JSON.stringify(ruidoso));
    const parado = Math.abs(maisTarde.x - depoisRuidoso.x) + Math.abs(maisTarde.y - depoisRuidoso.y);
    check.check('depois de desligar, a câmara não segue mais o sensor',
      parado < 0.02, 'variação=' + parado.toFixed(4));

    // 3. Sensor estável: fica ligado, e a câmara segue.
    await browser.goto(site.base + '/scene1/?' + stamp(), 60000);
    await sleep(600);
    await browser.evaluate(ESTAVEL);
    await sleep(7000);
    const estavel = await browser.evaluate('window.portalDebug.orientation()');
    const dadosEstavel = await browser.evaluate(
      `(() => document.querySelector('a-camera').components['look-controls'].data.magicWindowTrackingEnabled)()`);
    const rotacaoEstavel = await browser.evaluate(ROTACAO);
    await browser.evaluate('window.__sensorStop = true');
    check.check('um sensor estável mantém o magic-window ligado',
      estavel.tracking === true && estavel.reason === 'sensor estável' && dadosEstavel === true &&
        estavel.jitter !== null && estavel.jitter <= 0.5,
      JSON.stringify(estavel) + ' · look-controls=' + dadosEstavel);
    check.check('com o sensor estável a câmara segue a orientação',
      Math.abs(rotacaoEstavel.x) + Math.abs(rotacaoEstavel.y) > 0.01, JSON.stringify(rotacaoEstavel));

    // 4. A sonda mostra a linha do giroscópio (é o que se lê no telemóvel).
    await browser.goto(site.base + '/scene1/?sonda=1&giroscopio=0&' + stamp(), 60000);
    await sleep(2500);
    const sonda = await browser.evaluate(
      `(() => { const p = document.getElementById('sonda-texto'); return p ? p.textContent : null; })()`);
    check.check('a sonda mostra a linha do giroscópio',
      typeof sonda === 'string' && /giroscópio\s+desligado/.test(sonda),
      sonda === null ? 'sem painel' : (sonda.split('\n').find((linha) => linha.startsWith('giroscópio')) || 'sem linha'));
  } finally {
    await browser.close();
    await site.close();
  }

  const total = check.report('D52 (a orientação do telemóvel)');
  if (!total) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
