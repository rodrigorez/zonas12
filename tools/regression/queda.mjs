// A queda para a imagem num aparelho que não sustenta o shader (R18), medida nos dois lados.
//
// Porque existe: o A/B do R14 mostrou que o telemóvel mais fraco paga 15,2% dos quadros pelo shader, e
// que a escada do R15 **nunca chega a «estático»** nesse aparelho (a cadência de 20/s cumpre-se em
// média) — portanto a rede que existia não disparava. O R18 acrescenta o degrau que faltava: quando nem
// a cadência de recurso se sustenta ao pixelRatio mínimo, o fundo **troca para a imagem de reserva** (já
// descodificada, com as obras e as portas desenhadas nela) em vez de congelar.
//
// O que se mede:
//
//   1. a política, sem GPU: um aparelho de 8 quadros/s desce o pixelRatio até ao piso 1, desce a
//      cadência para 15 e **só então** desiste — e a ordem dos eventos prova-o;
//   2. desiste **uma vez** e não volta atrás (um fundo que vai e volta é pior do que qualquer dos lados);
//   3. um aparelho bom nunca desiste (20 s a 60 Hz, zero eventos);
//   4. sem imagem para trocar, o degrau antigo mantém-se: congela, não desiste;
//   5. na cena, `?queda=sempre` troca mesmo: o fundo passa a `image`, as obras e as portas continuam lá
//      e o shader deixa de animar;
//   6. por omissão a cena **não** troca num aparelho bom, e `?queda=0` também não.
//
// Uso, da raiz do projeto: node tools/regression/queda.mjs
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';
import { createPolicy } from '../../js/modules/shader-policy.js';

// Um aparelho que desenha 8 quadros por segundo: o mesmo perfil que o `shader.mjs` usa para a política.
const SLOW_GAP = 125;

function fakeResolution(start) {
  let ratio = start;
  const sets = [];
  return {
    min: 1,
    max: start,
    get: () => ratio,
    set: (value) => { ratio = value; sets.push(value); },
    sets,
    ratio: () => ratio
  };
}

// Corre a política com um relógio em vez de uma GPU, a partir de `from` (o relógio nunca anda para trás).
function run(policy, clock, from, durationMs) {
  let now = from;
  const end = from + durationMs;
  while (now <= end) {
    clock.now = now;
    policy.frame(now);
    now += SLOW_GAP;
  }
  return now;
}

function policyChecks() {
  const check = checks();

  // 1. O aparelho lento, com uma imagem para onde trocar.
  const slowClock = { now: 0 };
  const slowResolution = fakeResolution(2);
  const calls = [];
  const slow = createPolicy({
    resolution: slowResolution,
    clock: () => slowClock.now,
    onGiveUp: (reason) => calls.push(reason)
  });
  const afterFirst = run(slow, slowClock, 0, 60000);
  const slowStatus = slow.status();
  const what = slowStatus.events.map((event) => event.what);
  check.check('o aparelho lento desiste, e a política diz que desistiu',
    calls.length === 1 && slowStatus.gaveUp === true, JSON.stringify({ calls: calls.length, gaveUp: slowStatus.gaveUp }));
  check.check('desiste só depois do piso 1 e da cadência de 15 (a ordem dos eventos)',
    what.indexOf('15 fps') >= 0 && what.indexOf('fundo de imagem') > what.indexOf('15 fps') &&
      slowResolution.ratio() === 1 && what.indexOf('estático') < 0,
    JSON.stringify(what) + ' · pixelRatio ' + slowResolution.ratio());
  check.check('o motivo chega a quem troca o fundo (não é uma desistência muda)',
    typeof calls[0] === 'string' && /15/.test(calls[0]), String(calls[0]));

  // 2. Uma vez só: mais dois minutos de miséria não repetem a chamada nem voltam a animar.
  const updatesBefore = slowStatus.updates;
  const eventsBefore = slowStatus.events.length;
  run(slow, slowClock, afterFirst, 120000);
  const afterStatus = slow.status();
  check.check('desiste uma vez só, e não volta a animar depois de desistir',
    calls.length === 1 && afterStatus.updates === updatesBefore && afterStatus.events.length === eventsBefore,
    JSON.stringify({ calls: calls.length, updates: [updatesBefore, afterStatus.updates] }));

  // 3. Um aparelho bom não desiste.
  const goodClock = { now: 0 };
  let goodCalls = 0;
  const good = createPolicy({
    resolution: fakeResolution(2),
    clock: () => goodClock.now,
    onGiveUp: () => { goodCalls += 1; }
  });
  let now = 0;
  while (now <= 20000) { goodClock.now = now; good.frame(now); now += 1000 / 60; }
  check.check('um aparelho bom a 60 Hz nunca desiste (20 s, zero eventos)',
    goodCalls === 0 && good.status().events.length === 0 && good.status().gaveUp === false,
    JSON.stringify({ chamadas: goodCalls, eventos: good.status().events.length }));

  // 4. Sem imagem para trocar, o degrau antigo: congela. É o que `?queda=0` deixa.
  const frozenClock = { now: 0 };
  const frozen = createPolicy({ resolution: fakeResolution(2), clock: () => frozenClock.now, onGiveUp: null });
  run(frozen, frozenClock, 0, 60000);
  check.check('sem imagem para trocar, o último degrau continua a ser congelar',
    frozen.status().gaveUp === false && frozen.status().cadence === 0 && frozen.status().mode === 'static',
    JSON.stringify(frozen.status().events.map((event) => event.what)));

  return check.report('a queda para a imagem, na política');
}

async function sceneChecks() {
  const check = checks();
  const site = await serveProject();
  const browser = await openBrowser({ width: 1024, height: 768 });
  const ready = async (tries) => {
    for (let i = 0; i < (tries || 400); i++) {
      const ok = await browser.evaluate(
        'Boolean(window.portalDebug && window.portalDebug.state && document.querySelector("a-scene") && document.querySelector("a-scene").renderer)'
      ).catch(() => false);
      if (ok) return true;
      await sleep(150);
    }
    return false;
  };
  const read = () => browser.evaluate(`(() => {
    const shader = window.portalDebug.shader();
    const fundo = (shader.backgrounds || []).find((item) => item.dimension === 0) || {};
    return {
      fundo: fundo.mode,
      pedido: fundo.requested,
      shaderId: fundo.shaderId,
      desistiu: Boolean(shader.policy && shader.policy.gaveUp),
      atualizacoes: shader.policy ? shader.policy.updates : null,
      obras: document.querySelectorAll('[data-artwork-id]').length,
      portas: (window.portalDebug.state.portals || []).length,
      esfera: Boolean(document.querySelector('.dimension-0'))
    };
  })()`);

  try {
    // 5. `?queda=sempre`: a troca acontece, na sala de produção (a que tem obras e portas).
    await browser.goto(site.base + '/scene1/?queda=sempre&bust=' + Date.now(), 90000);
    await ready();
    await sleep(1500);
    const forced = await read();
    check.check('`?queda=sempre` troca o fundo do shader para a imagem',
      forced.fundo === 'image' && forced.shaderId === null, JSON.stringify(forced));
    check.check('a cena continua inteira depois da troca (as 5 obras, as portas e a esfera no sítio)',
      forced.obras > 0 && forced.portas > 0 && forced.esfera === true,
      JSON.stringify({ obras: forced.obras, portas: forced.portas, esfera: forced.esfera }));

    const before = forced.atualizacoes;
    await sleep(1500);
    const after = (await read()).atualizacoes;
    check.check('depois da troca o shader já não anima (nenhuma atualização nova)',
      after === before, before + ' → ' + after);

    // 6. Por omissão, num aparelho bom, não troca — nem depois de 12 s, que é tempo de sobra para a
    //    escada reagir a uma degradação.
    await browser.goto(site.base + '/scene1/?bust=' + Date.now(), 90000);
    await ready();
    await sleep(12000);
    const normal = await read();
    check.check('por omissão a cena não desiste num aparelho bom (12 s depois)',
      normal.fundo === 'shader' && normal.desistiu === false, JSON.stringify(normal));

    // 7. `?queda=0` desliga a troca e deixa a rede antiga no lugar.
    await browser.goto(site.base + '/scene1/?queda=0&bust=' + Date.now(), 90000);
    await ready();
    await sleep(1500);
    const off = await read();
    check.check('`?queda=0` mantém o shader e não desiste (a rede antiga fica disponível)',
      off.fundo === 'shader' && off.desistiu === false, JSON.stringify(off));
  } finally {
    await browser.close();
    await site.close();
  }
  return check.report('a queda para a imagem, na cena');
}

async function main() {
  const policy = policyChecks();
  const scene = await sceneChecks();
  process.exit(policy && scene ? 0 : 1);
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
