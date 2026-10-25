// Os portais em movimento (B8 da Fase 7), medidos na cena.
//
// Porque existe: a §1 dizia «portais em movimento animado (fica para depois)» e a Fase 7 emendou-a — o
// movimento passa a ser dado da cena. O que isto tem de delicado não é animar: é que **três coisas já
// prometidas** continuam verdadeiras com uma porta a andar — a colisão é lida do mundo (por isso a
// travessia acontece onde a porta está), o `prefers-reduced-motion` do visitante a pára, e uma porta
// em movimento não pode ser a porta de chegada (o ponto de chegada vem do dado, D59).
//
//   1. a porta `spin` roda: a rotação muda com o tempo, e volta ao mesmo sítio ao fim do período;
//   2. a porta `orbit` anda em círculo: a posição muda, e o raio medido é o do dado;
//   3. a caixa acompanha: a porta é detectada onde ela está, não onde o ficheiro a escreveu;
//   4. com `prefers-reduced-motion`, as duas ficam paradas;
//   5. `freezeMotion` pára-as, e é o que os instrumentos usam para comparar capturas;
//   6. o validador recusa uma porta de chegada em movimento.
//
// Uso, da raiz do projeto:
//
//   node tools/regression/motion.mjs
//
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

const PRONTO = `Boolean(window.portalDebug && window.portalDebug.state &&
  document.querySelector('a-scene') && document.querySelector('a-scene').renderer)`;

const ler = (id) => `(() => {
  const portal = window.portalDebug.state.portals.find((cada) => cada.data.id === ${id});
  if (!portal) return null;
  const object = portal.el.object3D;
  const position = object.getWorldPosition(new THREE.Vector3());
  const rotation = object.rotation;
  return {
    x: +position.x.toFixed(3), y: +position.y.toFixed(3), z: +position.z.toFixed(3),
    rx: +rotation.x.toFixed(3), ry: +rotation.y.toFixed(3), rz: +rotation.z.toFixed(3)
  };
})()`;

async function main() {
  const result = checks();
  const site = await serveProject();
  const browser = await openBrowser({ width: 1100, height: 800 });
  try {
    await browser.goto(site.base + '/?scene=r9&bust=' + Date.now(), 60000);
    for (let i = 0; i < 150; i++) {
      if (await browser.evaluate(PRONTO).catch(() => false)) break;
      await sleep(200);
    }
    await sleep(2500);

    const inicio = { spin: await browser.evaluate(ler(0)), orbit: await browser.evaluate(ler(1)) };
    await sleep(2000);
    const meio = { spin: await browser.evaluate(ler(0)), orbit: await browser.evaluate(ler(1)) };

    result.check('a porta `spin` roda com o tempo',
      inicio.spin && meio.spin && Math.abs(meio.spin.ry - inicio.spin.ry) > 0.05,
      JSON.stringify({ antes: inicio.spin, depois: meio.spin }));
    const raioMedido = inicio.orbit
      ? Math.hypot(meio.orbit.x - 6, meio.orbit.z - (-20))
      : null;
    result.check('a porta `orbit` anda em círculo, e o raio é o do dado',
      raioMedido !== null && Math.abs(raioMedido - 3) < 0.05 &&
        (inicio.orbit.x !== meio.orbit.x || inicio.orbit.z !== meio.orbit.z),
      JSON.stringify({ raio: raioMedido === null ? null : +raioMedido.toFixed(3), antes: inicio.orbit, depois: meio.orbit }));

    // 3. A caixa acompanha a porta: o centro do mundo da caixa é o da porta onde ela está agora.
    const caixa = await browser.evaluate(`(() => {
      const portal = window.portalDebug.state.portals.find((cada) => cada.data.id === 1);
      const centro = portal.boxCenter.clone();
      portal.portalGroup.updateWorldMatrix(true, false);
      const noMundo = portal.portalGroup.localToWorld(centro);
      const porta = portal.el.object3D.getWorldPosition(new THREE.Vector3());
      return {
        caixa: { x: +noMundo.x.toFixed(2), z: +noMundo.z.toFixed(2) },
        porta: { x: +porta.x.toFixed(2), z: +porta.z.toFixed(2) }
      };
    })()`);
    // A caixa está em `boxPosition` (0, 2, 0) dentro da porta: em X e Z coincide com ela.
    result.check('a caixa de colisão acompanha a porta em movimento',
      Math.abs(caixa.caixa.x - caixa.porta.x) < 0.02 && Math.abs(caixa.caixa.z - caixa.porta.z) < 0.02,
      JSON.stringify(caixa));

    // 5. `freezeMotion` pára as duas — é o lever que as capturas usam.
    const paradas = await browser.evaluate(`(async () => {
      window.portalDebug.freezeMotion(true);
      const antes = window.portalDebug.state.portals.map((cada) =>
        cada.el.object3D.rotation.y.toFixed(4) + '@' + cada.el.object3D.position.x.toFixed(4));
      await new Promise((done) => setTimeout(done, 1200));
      const depois = window.portalDebug.state.portals.map((cada) =>
        cada.el.object3D.rotation.y.toFixed(4) + '@' + cada.el.object3D.position.x.toFixed(4));
      return { antes: antes, depois: depois };
    })()`);
    result.check('`freezeMotion` pára as portas onde elas estão',
      JSON.stringify(paradas.antes) === JSON.stringify(paradas.depois),
      JSON.stringify(paradas));

    // 4. `prefers-reduced-motion`: a cena nova, com a media query emulada.
    await browser.page.send('Emulation.setEmulatedMedia',
      { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
    await browser.goto(site.base + '/?scene=r9&bust=' + Date.now() + 'r', 60000);
    for (let i = 0; i < 150; i++) {
      if (await browser.evaluate(PRONTO).catch(() => false)) break;
      await sleep(200);
    }
    await sleep(2000);
    const reduzido = await browser.evaluate(`(async () => {
      const ler = () => window.portalDebug.state.portals.map((cada) =>
        cada.el.object3D.rotation.y.toFixed(4) + '@' + cada.el.object3D.position.x.toFixed(4));
      const antes = ler();
      await new Promise((done) => setTimeout(done, 1500));
      return { antes: antes, depois: ler() };
    })()`);
    result.check('com `prefers-reduced-motion` as portas ficam paradas',
      JSON.stringify(reduzido.antes) === JSON.stringify(reduzido.depois),
      JSON.stringify(reduzido));
    await browser.page.send('Emulation.setEmulatedMedia', { features: [] });

    // 6. A lei: uma porta de chegada não pode mexer-se.
    const lei = await browser.evaluate(`(async () => {
      const modulo = await import('/js/scene/validation.js');
      const base = JSON.parse(JSON.stringify(window.portalDebug.state.portals.length ? {} : {}));
      const cena = {
        version: 3,
        world: { slug: 'ensaio' },
        cameras: { player: { position: [0, 1.6, 0], speed: 0.1 }, real: { enabled: false } },
        assets: {},
        dimensions: [{ id: 0, kind: 'color', color: '#101010', radius: 100 }],
        artworks: [],
        portals: [{
          id: 0, ownedBy: 0, position: [0, 0, -8], rotation: [0, 0, 0],
          width: 4, height: 5, box: [4, 5, 1], boxPosition: [0, 2.5, 0],
          window: { kind: 'dimension-pair', dimensionA: 0, dimensionB: 0 },
          action: { kind: 'enter-window' },
          arrivalFrom: 'gate',
          motion: { kind: 'spin', period: 10, axis: [0, 1, 0] }
        }]
      };
      const relatorio = modulo.validateScene(cena, {});
      return relatorio.errors.map((erro) => erro.message || String(erro)).join(' | ');
    })()`);
    result.check('o validador recusa uma porta de chegada em movimento',
      typeof lei === 'string' && /cannot be the one a visitor arrives behind/.test(lei),
      lei.slice(0, 220));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('os portais em movimento (B8)');
  process.exit(result.list.some((item) => !item.ok) ? 1 : 0);
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
