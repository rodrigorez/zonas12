// O regresso ao sítio de onde se saiu (D63), medido no browser.
//
// Porque existe: abrir a ficha de uma obra e voltar punha a câmara **no início do mundo**. Quem estava
// a três metros de uma obra via-a abrir e, ao voltar, tinha de caminhar outra vez até lá. O pedido do
// autor foi claro: guardar o ponto no clique e devolvê-lo no regresso, no telemóvel e no computador.
//
// O que se mede:
//
//   1. o clique numa obra que abre a ficha **guarda** o ponto de vista (posição, olhar e dimensão);
//   2. o «voltar» traz o visitante **a esse ponto** — posição e olhar, dentro de uma tolerância;
//   3. o ponto é de **um** regresso: uma segunda entrada no mundo (sem clique) começa onde o dado diz,
//      e não num sítio que já não é o que o visitante deixou.
//
// Uso, da raiz do projeto:
//
//   node tools/regression/volta.mjs
//
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

// A pose de partida deste teste: longe do início (0, 1.6, 0) e com um olhar próprio, para uma câmara
// que ficasse no princípio não passar por acidente.
const POSE = { position: [-18, 1.6, -42], yaw: 0.8, pitch: 0.05 };
const TOLERANCIA_POSICAO = 0.2;
const TOLERANCIA_ANGULO = 1.5; // graus

const perto = (a, b, tolerancia) => Math.abs(a - b) <= tolerancia;

async function main() {
  const result = checks();
  const site = await serveProject();
  const browser = await openBrowser({ width: 1200, height: 800 });
  try {
    await browser.goto(site.base + '/scene1/?bust=' + Date.now(), 60000);
    for (let i = 0; i < 200; i++) {
      const pronta = await browser.evaluate(
        'Boolean(window.portalDebug && document.querySelector("a-scene") && document.querySelector("a-scene").renderer && document.querySelector("[data-artwork-id=\\"0\\"]"))'
      ).catch(() => false);
      if (pronta) break;
      await sleep(150);
    }
    await browser.evaluate(`sessionStorage.removeItem('zonas12.volta')`);

    // 1. Pôr a câmara no ponto escolhido e clicar numa obra que abre a ficha.
    const antes = await browser.evaluate(`(() => {
      const cam = document.querySelector('a-camera');
      cam.object3D.position.set(${POSE.position[0]}, ${POSE.position[1]}, ${POSE.position[2]});
      const look = cam.components['look-controls'];
      look.yawObject.rotation.y = ${POSE.yaw};
      look.pitchObject.rotation.x = ${POSE.pitch};
      cam.object3D.rotation.set(${POSE.pitch}, ${POSE.yaw}, 0);
      const obra = document.querySelector('[data-artwork-id="0"]');
      const modo = (obra.getAttribute('open-artwork') || {}).mode;
      obra.emit('click', {}, false);
      return { modo: modo };
    })()`);
    result.check('a obra da sala abre a ficha (modo "page")', antes.modo === 'page', String(antes.modo));

    // Espera-se pela ficha — a navegação leva a página com ela.
    for (let i = 0; i < 200; i++) {
      const naFicha = await browser.evaluate('Boolean(window.obraDebug && document.querySelector(".botao-voltar"))').catch(() => false);
      if (naFicha) break;
      await sleep(150);
    }
    const guardado = await browser.evaluate(`(() => {
      const raw = sessionStorage.getItem('zonas12.volta');
      const naFicha = Boolean(window.obraDebug && window.obraDebug.world);
      return { naFicha: naFicha, guardado: raw ? JSON.parse(raw) : null };
    })()`);
    result.check('o clique guarda o ponto de vista da sala (mundo, posição, olhar e dimensão)',
      Boolean(guardado.guardado) &&
        guardado.guardado.world === 'scene1' &&
        perto(guardado.guardado.position[0], POSE.position[0], TOLERANCIA_POSICAO) &&
        perto(guardado.guardado.position[2], POSE.position[2], TOLERANCIA_POSICAO) &&
        perto(guardado.guardado.yaw, POSE.yaw * 180 / Math.PI, TOLERANCIA_ANGULO) &&
        guardado.guardado.dimension === 0,
      JSON.stringify(guardado));

    // 2. O «voltar» da ficha traz o visitante ao mesmo ponto.
    const voltar = await browser.evaluate(`document.querySelector('.botao-voltar').getAttribute('href')`);
    result.check('o «voltar» pede o regresso ao ponto (?volta=1)',
      typeof voltar === 'string' && /scene1\/\?volta=1$/.test(voltar), String(voltar));

    await browser.evaluate(`document.querySelector('.botao-voltar').click()`).catch(() => {});
    for (let i = 0; i < 300; i++) {
      const voltou = await browser.evaluate(
        'Boolean(window.portalDebug && window.portalDebug.world === "scene1" && document.querySelector("a-scene") && document.querySelector("a-scene").renderer)'
      ).catch(() => false);
      if (voltou) break;
      await sleep(150);
    }
    await sleep(1200);
    const depois = await browser.evaluate(`(() => {
      const cam = document.querySelector('a-camera');
      const look = cam.components['look-controls'];
      return {
        position: [cam.object3D.position.x, cam.object3D.position.y, cam.object3D.position.z],
        yaw: look.yawObject.rotation.y * 180 / Math.PI,
        pitch: look.pitchObject.rotation.x * 180 / Math.PI,
        devolvido: window.portalDebug.returned || null,
        resta: sessionStorage.getItem('zonas12.volta')
      };
    })()`);
    result.check('o regresso devolve a posição onde o visitante estava',
      perto(depois.position[0], POSE.position[0], TOLERANCIA_POSICAO) &&
        perto(depois.position[2], POSE.position[2], TOLERANCIA_POSICAO),
      JSON.stringify(depois.position));
    result.check('e devolve o olhar (yaw e pitch)',
      perto(depois.yaw, POSE.yaw * 180 / Math.PI, TOLERANCIA_ANGULO) &&
        perto(depois.pitch, POSE.pitch * 180 / Math.PI, TOLERANCIA_ANGULO),
      JSON.stringify({ yaw: depois.yaw, pitch: depois.pitch }));
    result.check('o ponto é consumido: não fica guardado para a próxima visita',
      depois.resta === null, String(depois.resta));

    // 3. Sem ponto guardado, o mundo começa onde o dado diz (e não onde o teste o deixou).
    await browser.goto(site.base + '/scene1/?volta=1&bust=' + Date.now(), 60000);
    for (let i = 0; i < 300; i++) {
      const pronta = await browser.evaluate(
        'Boolean(window.portalDebug && window.portalDebug.world === "scene1" && document.querySelector("a-scene") && document.querySelector("a-scene").renderer)'
      ).catch(() => false);
      if (pronta) break;
      await sleep(150);
    }
    await sleep(800);
    const semPonto = await browser.evaluate(`(() => {
      const cam = document.querySelector('a-camera');
      return {
        position: [cam.object3D.position.x, cam.object3D.position.y, cam.object3D.position.z],
        devolvido: window.portalDebug.returned || null
      };
    })()`);
    result.check('sem ponto guardado, ?volta=1 não move ninguém: a sala começa no dado',
      perto(semPonto.position[0], 0, TOLERANCIA_POSICAO) &&
        perto(semPonto.position[2], 0, TOLERANCIA_POSICAO) &&
        semPonto.devolvido === null,
      JSON.stringify(semPonto));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('o regresso ao ponto de onde se saiu (D63)');
  process.exit(result.list.some((item) => !item.ok) ? 1 : 0);
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
