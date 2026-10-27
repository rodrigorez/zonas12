// A bateria do fundo shader (Fase 7, bloco B9; R14/R15). Responde a quatro perguntas:
//
//   1. a política, sem GPU: nunca passa de 20 atualizações por segundo; só desce depois de **duas**
//      janelas más; desce primeiro o pixelRatio, depois a cadência para 15, e só então congela; e o
//      pixelRatio nunca fica abaixo de 1;
//   2. com `?shader=0`, um mundo `kind: "shader"` mostra a **imagem de reserva** — o escape e o
//      rollback;
//   3. por omissão, é o shader que está desenhado e entrega no máximo 20 atualizações por segundo;
//   4. com `prefers-reduced-motion`, o fundo começa e fica estático.
//
// O A/B controlado nos três aparelhos (o que fecha o R14) não se faz aqui: é a medição que falta, e
// continua registada como pendente no roadmap.
//
// Uso, da raiz do projeto: node tools/regression/shader.mjs
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, serveProject, openBrowser, checks, sleep, difference } from './harness.mjs';
import { createPolicy, SHADER_POLICY } from '../../js/modules/shader-policy.js';
import { SHADER_IDS } from '../../js/modules/shaders.js';
import { validateScene } from '../../js/scene/validation.js';

const FIXTURE = 'data/worlds/shader.json';

// ---- 1. a política, com um relógio em vez de uma GPU ----

function simulate(policy, options) {
  const gap = options.gap;
  let now = options.from || 0;
  const end = now + options.duration;
  while (now <= end) {
    policy.frame(now);
    now += gap;
  }
  return now;
}

function fakeResolution(start) {
  const state = { ratio: start, min: 1, max: start, sets: [] };
  return {
    min: 1,
    max: start,
    get: () => state.ratio,
    set: (value) => { state.ratio = value; state.sets.push(value); },
    sets: state.sets,
    ratio: () => state.ratio
  };
}

function policyChecks() {
  const check = checks();

  // Um ecrã de 60 Hz a entregar o que a política pede: 20 por segundo, sem descer nada.
  const goodClock = { now: 0 };
  const goodResolution = fakeResolution(2);
  const good = createPolicy({ resolution: goodResolution, clock: () => goodClock.now });
  let now = 0;
  while (now <= 15000) { goodClock.now = now; good.frame(now); now += 1000 / 60; }
  const goodStatus = good.status();
  check.check('a 60 Hz, a política fica em 20 atualizações/s', goodStatus.cadence === 20, JSON.stringify(goodStatus));
  check.check('a 60 Hz, o pixelRatio não desce', goodStatus.pixelRatio === 2, String(goodStatus.pixelRatio));

  // O primeiro fotograma pede no máximo 2 e nunca acima do DPR do aparelho; a partir daí a escada sobe
  // até ao nativo, e é o único caminho para lá chegar (medido no telemóvel fraco: a 2,625 desenhava
  // 38,7 quadros/s, a 1,945 desenhava 57,3).
  const climbResolution = fakeResolution(3);
  const climbClock = { now: 0 };
  const climb = createPolicy({ resolution: climbResolution, clock: () => climbClock.now });
  check.check('o primeiro fotograma num DPR 3 pede 2, e o renderer fica nesse valor',
    climb.status().pixelRatio === 2 && climbResolution.ratio() === 2,
    'política=' + climb.status().pixelRatio + ', renderer=' + climbResolution.ratio());
  let climbNow = 0;
  while (climbNow <= 60000) { climbClock.now = climbNow; climb.frame(climbNow); climbNow += 1000 / 60; }
  check.check('sem degradação, a escada sobe até ao DPR do aparelho',
    climb.status().pixelRatio === 3 && climbResolution.ratio() === 3,
    'política=' + climb.status().pixelRatio + ' em 60 s');
  const lowResolution = fakeResolution(1.17);
  const low = createPolicy({ resolution: lowResolution, clock: () => 0 });
  check.check('num ecrã de DPR 1,17 o primeiro fotograma fica no nativo',
    low.status().pixelRatio === 1.17, String(low.status().pixelRatio));

  // A procura do teto **para**: um aparelho que aguenta abaixo de 1,9 e falha a partir daí converge em
  // poucos movimentos e cala-se — é a promessa «sem oscilação» medida, e não afirmada.
  let tetoAtual = 2.625;
  const tetoSets = [];
  const tetoResolution = {
    min: 1,
    max: 2.625,
    get: () => tetoAtual,
    set: (value) => { tetoAtual = +value.toFixed(3); tetoSets.push(tetoAtual); }
  };
  const tetoClock = { now: 0 };
  const teto = createPolicy({ resolution: tetoResolution, clock: () => tetoClock.now });
  let tetoNow = 0;
  while (tetoNow <= 240000) {
    tetoClock.now = tetoNow;
    teto.frame(tetoNow);
    tetoNow += 1000 / (tetoAtual >= 1.9 ? 8 : 60);
  }
  const tetoStatus = teto.status();
  const ultimoEvento = tetoStatus.events.length ? tetoStatus.events[tetoStatus.events.length - 1].t : 0;
  check.check('a procura do teto converge e cala-se (sem oscilar)',
    tetoStatus.events.length <= 6 && tetoStatus.pixelRatio >= 1.8 && tetoStatus.pixelRatio < 1.9 && ultimoEvento < 60,
    JSON.stringify(tetoStatus.events.map((evento) => evento.what + ' ' + evento.pixelRatio + '@' + evento.t)));

  // A mesma política, com atualizações medidas de 5 em 5 segundos: a taxa nunca passa de 20/s.
  const rateClock = { now: 0 };
  const rate = createPolicy({ clock: () => rateClock.now });
  simulate(rate, { duration: 3000, gap: 1000 / 60 }); // a linha de base estática
  let before = rate.status().updates;
  rateClock.now = 8000;
  simulate(rate, { duration: 5000, gap: 1000 / 60, from: 3000 });
  const delivered = rate.status().updates - before;
  check.check('a taxa entregue não passa de 20 por segundo', delivered <= SHADER_POLICY.targetFps * 5,
    delivered + ' atualizações em 5 s');

  // Um aparelho que só consegue 8 quadros por segundo: a escada inteira, sem oscilar.
  const badClock = { now: 0 };
  const badResolution = fakeResolution(2);
  const bad = createPolicy({ resolution: badResolution, clock: () => badClock.now });
  let tick = 0;
  while (tick <= 60000) { badClock.now = tick; bad.frame(tick); tick += 125; }
  const badStatus = bad.status();
  check.check('degradação persistente desce o pixelRatio até ao piso 1',
    badResolution.ratio() === 1 && badResolution.sets.every((value) => value >= 1),
    JSON.stringify(badResolution.sets));
  check.check('no piso, a cadência desce para 15 e depois congela',
    badStatus.cadence === 0 && badStatus.mode === 'static', JSON.stringify(badStatus));
  check.check('a escada não volta a subir sozinha', badStatus.events.every((event) => event.what !== 'subiu pr'),
    JSON.stringify(badStatus.events.map((event) => event.what)));

  // O aparelho do R18, medido no PowerVR: 40 quadros/s a 2,63 e 60 a 1,0. A escada tem de descer a
  // resolução até os quadros voltarem e **parar lá** — mantendo a cadência de 20/s, que é o que a
  // produção promete. Antes do chão de quadros, este mesmo aparelho subia a resolução e ficava a 40/s
  // com a cadência a falhar um quinto das vezes.
  let fracoAtual = 2;
  const fracoSets = [];
  const fracoResolution = {
    min: 1,
    max: 2.625,
    get: () => fracoAtual,
    set: (value) => { fracoAtual = +value.toFixed(3); fracoSets.push(fracoAtual); }
  };
  const fracoClock = { now: 0 };
  const fraco = createPolicy({ resolution: fracoResolution, clock: () => fracoClock.now });
  let fracoNow = 0;
  while (fracoNow <= 90000) {
    fracoClock.now = fracoNow;
    fraco.frame(fracoNow);
    fracoNow += 1000 / (fracoAtual > 1.8 ? 40 : 60);
  }
  const fracoStatus = fraco.status();
  check.check('num aparelho que só faz 40 quadros/s acima de 1,8, a escada desce até os quadros voltarem',
    fracoAtual <= 1.8 && fracoStatus.fps >= SHADER_POLICY.minFps,
    'pixelRatio ' + fracoAtual + ' · ' + JSON.stringify(fracoSets) + ' · fps ' + fracoStatus.fps);
  check.check('e mantém a cadência de 20/s (não sacrifica a animação à nitidez)',
    fracoStatus.cadence === SHADER_POLICY.targetFps && fracoStatus.gaveUp === false,
    JSON.stringify({ cadence: fracoStatus.cadence, gaveUp: fracoStatus.gaveUp }));
  check.check('não desce abaixo do necessário (pára onde os quadros voltam, não no piso)',
    fracoAtual > 1, String(fracoAtual));
  check.check('e a escada cala-se depois de encontrar o valor (sem rastejar mudando a nitidez)',
    fracoStatus.events.filter((event) => /pr/.test(event.what)).length <= 7,
    fracoStatus.events.map((event) => event.what + ' ' + event.pixelRatio).join(' · '));

  // Um aparelho bom nunca é penalizado pelo chão de quadros: a 60 Hz não há um único evento.
  const floorSafeClock = { now: 0 };
  const floorSafe = createPolicy({ resolution: fakeResolution(2), clock: () => floorSafeClock.now });
  let floorSafeNow = 0;
  while (floorSafeNow <= 30000) {
    floorSafeClock.now = floorSafeNow;
    floorSafe.frame(floorSafeNow);
    floorSafeNow += 1000 / 60;
  }
  check.check('o chão de quadros não toca num aparelho que já os faz',
    floorSafe.status().events.every((event) => !/desceu pr/.test(event.what)),
    JSON.stringify(floorSafe.status().events.map((event) => event.what)));
  // `prefers-reduced-motion`: estático desde o primeiro quadro.
  const reducedClock = { now: 0 };
  const reduced = createPolicy({ clock: () => reducedClock.now, reducedMotion: true });
  let reducedNow = 0;
  while (reducedNow <= 20000) { reducedClock.now = reducedNow; reduced.frame(reducedNow); reducedNow += 1000 / 60; }
  const reducedStatus = reduced.status();
  check.check('prefers-reduced-motion mantém o fundo estático',
    reducedStatus.mode === 'static' && reducedStatus.updates === 0, JSON.stringify(reducedStatus));

  // Uma página escondida não anima; ao voltar, recomeça em estático e reavalia.
  const hiddenClock = { now: 0 };
  const hidden = createPolicy({ clock: () => hiddenClock.now });
  let hiddenNow = 0;
  while (hiddenNow <= 8000) { hiddenClock.now = hiddenNow; hidden.frame(hiddenNow); hiddenNow += 1000 / 60; }
  const beforeHide = hidden.status().updates;
  hidden.setHidden(true);
  while (hiddenNow <= 16000) { hiddenClock.now = hiddenNow; hidden.frame(hiddenNow); hiddenNow += 1000 / 60; }
  const duringHide = hidden.status().updates - beforeHide;
  check.check('uma página escondida não anima', duringHide === 0, duringHide + ' atualizações');
  hidden.setHidden(false);
  hiddenClock.now = 16000;
  simulate(hidden, { duration: 1000, gap: 1000 / 60, from: 16000 });
  check.check('ao voltar, o primeiro segundo é estático', hidden.status().mode === 'static',
    JSON.stringify(hidden.status()));

  return check.report('a política do shader');
}

// ---- 2. o dado: o fixture é o que diz ser ----

function dataChecks() {
  const check = checks();
  const scene = JSON.parse(readFileSync(join(ROOT, FIXTURE), 'utf8'));
  const report = validateScene(scene, {
    exists: () => true,
    imageSize: () => ({ width: 480, height: 240 })
  });
  check.check('o fixture do shader passa no validador, sem avisos',
    report.ok && report.warnings.length === 0, JSON.stringify({ errors: report.errors, warnings: report.warnings }));

  const dimension = (scene.dimensions || [])[0] || {};
  check.check('o shaderId é de uma lista interna (nunca GLSL do ficheiro)',
    dimension.kind === 'shader' && SHADER_IDS.includes(dimension.shaderId), String(dimension.shaderId));
  check.check('a imagem de reserva está no catálogo de assets',
    Boolean(dimension.fallbackAsset && scene.assets && scene.assets[dimension.fallbackAsset]),
    String(dimension.fallbackAsset));

  const broken = JSON.parse(JSON.stringify(scene));
  broken.dimensions[0].shaderId = 'shader-que-nao-existe';
  const missing = validateScene(broken, { exists: () => true, imageSize: () => ({ width: 480, height: 240 }) });
  check.check('um shaderId fora da lista é recusado',
    !missing.ok && missing.errors.some((error) => error.includes('is not one of')), JSON.stringify(missing.errors));

  // A produção: as três salas, cada uma com o seu shader e a imagem que a substitui.
  const production = [
    ['scene1', 'grade-neon', 'cidade-360'],
    ['scene2', 'por-do-sol', 'praia'],
    ['scene3', 'nuvens', 'skycloud']
  ];
  for (const [slug, shaderId, asset] of production) {
    const world = JSON.parse(readFileSync(join(ROOT, 'data', 'worlds', slug + '.json'), 'utf8'));
    const dimension = (world.dimensions || []).find((entry) => entry.id === 0) || {};
    check.check(slug + ': kind shader, ' + shaderId + ', reserva ' + asset,
      dimension.kind === 'shader' && dimension.shaderId === shaderId && dimension.fallbackAsset === asset,
      JSON.stringify(dimension));
    const type = world.assets && world.assets[asset] ? world.assets[asset].type : null;
    check.check(slug + ': a reserva é uma imagem do catálogo', type === 'image', String(type));
  }

  return check.report('o dado do shader');
}

// ---- 3. a página: a flag, a cadência e o movimento reduzido ----

async function pageChecks() {
  const check = checks();
  const site = await serveProject();
  const browser = await openBrowser({ camera: false, width: 800, height: 600 });
  try {
    const status = () => browser.evaluate('window.portalDebug.shader()');
    const stamp = () => 'bust=' + Date.now() + '-' + Math.random();

    // `?shader=0` é o escape (produção por omissão): o mesmo mundo, o fundo de imagem.
    await browser.goto(site.base + '/?scene=shader&shader=0&' + stamp());
    await sleep(1500);
    let reported = await status();
    check.check('?shader=0 mostra a imagem de reserva',
      reported.backgrounds.length === 1 && reported.backgrounds[0].mode === 'image',
      JSON.stringify(reported.backgrounds));
    const offShot = await browser.screenshot();
    check.check('a imagem de reserva é desenhada (não é um ecrã preto)',
      offShot.litFraction > 0.2, 'litFraction=' + offShot.litFraction.toFixed(2));

    // Sem parâmetro: o shader é o que a produção desenha.
    const noiseBefore = browser.console.length;
    await browser.goto(site.base + '/?scene=shader&' + stamp());
    await sleep(4500);
    const first = await status();
    await sleep(3000);
    const second = await status();
    const delta = second.policy ? second.policy.updates - (first.policy ? first.policy.updates : 0) : 0;
    const rate = delta / 3;
    check.check('por omissão, o fundo é o shader',
      second.enabled === true && second.backgrounds[0] && second.backgrounds[0].mode === 'shader',
      JSON.stringify(second.backgrounds));
    check.check('o shader entrega no máximo 20 atualizações por segundo',
      rate > 0 && rate <= SHADER_POLICY.targetFps + 0.5, rate.toFixed(1) + ' atualizações/s');
    check.check('o pixelRatio do shader nunca fica abaixo de 1',
      second.policy && second.policy.pixelRatio >= 1, JSON.stringify(second.policy));
    const onShot = await browser.screenshot();
    check.check('o shader é desenhado (não é um ecrã preto)',
      onShot.litFraction > 0.2, 'litFraction=' + onShot.litFraction.toFixed(2));
    // Entrega não é o mesmo que animação: dois quadros separados no tempo têm de diferir na tela.
    await sleep(900);
    const laterShot = await browser.screenshot();
    const moved = difference(onShot, laterShot);
    check.check('o shader anima a tela (dois quadros diferem)', moved !== null && moved > 0.2,
      'diferença=' + (moved === null ? 'null' : moved.toFixed(2)));
    const noise = browser.console.slice(noiseBefore).filter((line) => /error|exception/i.test(line));
    check.check('a página do shader não escreve erros na consola', noise.length === 0, noise.join(' | '));

    // Movimento reduzido: o shader fica estático, e continua desenhado.
    await browser.page.send('Emulation.setEmulatedMedia', {
      features: [{ name: 'prefers-reduced-motion', value: 'reduce' }]
    });
    await browser.goto(site.base + '/?scene=shader&' + stamp());
    await sleep(5000);
    const reduced = await status();
    check.check('prefers-reduced-motion mantém o shader estático',
      reduced.policy && reduced.policy.mode === 'static' && reduced.policy.updates === 0,
      JSON.stringify(reduced.policy));
    const reducedShot = await browser.screenshot();
    check.check('o quadro estático continua visível',
      reducedShot.litFraction > 0.2, 'litFraction=' + reducedShot.litFraction.toFixed(2));
    await browser.page.send('Emulation.setEmulatedMedia', { features: [] });

    // As três salas de produção, cada uma com o seu shader, por omissão.
    const salas = [['scene1', 'grade-neon'], ['scene2', 'por-do-sol'], ['scene3', 'nuvens']];
    for (const [slug, shaderId] of salas) {
      await browser.goto(site.base + '/?scene=' + slug + '&' + stamp());
      await sleep(1200);
      const state = await status();
      const entry = (state.backgrounds || []).find((item) => item.dimension === 0) || {};
      check.check(slug + ': a produção desenha ' + shaderId,
        entry.mode === 'shader' && entry.shaderId === shaderId, JSON.stringify(entry));
    }
    await browser.goto(site.base + '/?scene=scene1&shader=0&' + stamp());
    await sleep(1200);
    const escape = await status();
    const offEntry = (escape.backgrounds || []).find((item) => item.dimension === 0) || {};
    check.check('scene1 com ?shader=0 mostra a imagem de reserva',
      offEntry.mode === 'image', JSON.stringify(offEntry));

    // A sonda de campo (R14): com `?sonda=1` o painel diz o que a página está a fazer, e é o que se lê
    // num telemóvel; sem o parâmetro não existe painel nenhum.
    check.check('sem ?sonda=1 não há painel na página', await browser.evaluate('!document.getElementById("sonda")'),
      'painel ausente');
    const sondaNoise = browser.console.length;
    await browser.goto(site.base + '/?scene=scene2&sonda=1&' + stamp());
    // 3 s de aquecimento (quadro parado) mais 2 s de janela da taxa: é o que a sonda precisa para ter
    // um número, e é o tempo que o visitante leva a olhar para o ecrã.
    await sleep(6000);
    const sonda = await browser.evaluate(`(() => {
      const painel = document.getElementById('sonda');
      return painel ? painel.querySelector('#sonda-texto').textContent : null;
    })()`);
    check.check('com ?sonda=1 o painel mostra o fundo e a cadência',
      typeof sonda === 'string' && /por-do-sol/.test(sonda) && /cadência 20\/s/.test(sonda),
      sonda === null ? 'sem painel' : sonda.split('\n').slice(2, 5).join(' | '));
    const taxaNaSonda = sonda === null ? null : Number((/atualizações\s+([0-9.]+)\/s/.exec(sonda) || [])[1]);
    check.check('a sonda mede a taxa entregue (19 a 21 por segundo)',
      taxaNaSonda !== null && taxaNaSonda >= 19 && taxaNaSonda <= 21, 'taxa=' + taxaNaSonda);
    const quadrosNaSonda = sonda === null ? null : Number((/quadros\s+([0-9.]+)\/s/.exec(sonda) || [])[1]);
    check.check('a sonda conta os quadros da página (é o número do A/B)',
      quadrosNaSonda !== null && quadrosNaSonda >= 10, 'quadros=' + quadrosNaSonda);
    const resumo = await browser.evaluate(`(() => {
      const elemento = document.getElementById('sonda-resumo');
      return elemento ? elemento.textContent : null;
    })()`);
    check.check('o resumo de uma linha cabe num SMS e traz os seis números',
      typeof resumo === 'string' && /^R scene2 20 [0-9.]+ [0-9.]+ 0 \d+x\d+\/[0-9.]+ e\d+ \([0-9.]+\/s\)$/.test(resumo),
      resumo === null ? 'sem resumo' : resumo);
    const sondaErrors = browser.console.slice(sondaNoise).filter((line) => /error|exception/i.test(line));
    check.check('a sonda não escreve erros na consola', sondaErrors.length === 0, sondaErrors.join(' | '));

    // O editor: o painel da dimensão oferece o que a cena constrói, e abre o fixture sem erros.
    const editorNoise = browser.console.length;
    // `goto` waits for `portalDebug`, which only the exhibition has: the editor is opened by hand,
    // like the archived batteries do.
    await browser.page.send('Page.navigate', { url: site.base + '/editor.html?world=shader&' + stamp() });
    await sleep(3000);
    const panel = await browser.evaluate(`(() => {
      const shader = document.querySelector('[name="dimension.0.shaderId"]');
      const fallback = document.querySelector('[name="dimension.0.fallbackAsset"]');
      return {
        shader: shader ? shader.value : null,
        fallback: fallback ? fallback.value : null,
        kinds: [...document.querySelectorAll('[name="dimension.0.kind"] option')].map((option) => option.value)
      };
    })()`);
    check.check('o painel da dimensão oferece o kind shader', panel.kinds.includes('shader'), JSON.stringify(panel.kinds));
    check.check('o painel mostra o shader e a imagem de reserva do fixture',
      panel.shader === 'por-do-sol' && panel.fallback === 'ceu-shader', JSON.stringify(panel));
    const editorErrors = browser.console.slice(editorNoise).filter((line) => /error|exception/i.test(line));
    check.check('o editor abre o fixture sem erros de consola', editorErrors.length === 0, editorErrors.join(' | '));
  } finally {
    await browser.close();
    await site.close();
  }
  return check.report('a página do shader');
}

async function main() {
  const policy = policyChecks();
  const data = dataChecks();
  const page = await pageChecks();
  if (!policy || !data || !page) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
