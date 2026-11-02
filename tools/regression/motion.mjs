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
// E, desde a D85, na **sala de ensaio** (`?scene=scene100`), a oscilação `sway`:
//
//   7. cada uma das três portas vai e volta num eixo só (A em X, B em Y, C em Z), na translação de
//      ±5 m e na rotação de ±45°, com os outros eixos parados e as duas em fase;
//   8. ao fim de uma oscilação completa está onde começou — medido pela meia oscilação contra o
//      período do dado;
//   9. a porta do portão, que não tem `motion`, não se mexe (é o controlo);
//  10. `freezeMotion` pára a oscilação onde ela está.
//
// Uso, da raiz do projeto:
//
//   node tools/regression/motion.mjs
//
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { serveProject, openBrowser, checks, sleep, ROOT } from './harness.mjs';

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

// As amostras do movimento, recolhidas **dentro** da página (D85): uma ida e volta ao CDP por amostra
// somava o tempo da ponte ao tempo medido e punha o período a oscilar entre corridas. Aqui o relógio e
// a leitura são o mesmo.
const AMOSTRAR = (ms) => `(async () => {
  const ids = [0, 1, 2, 3];
  const ler = () => {
    const linha = { t: performance.now(), portas: {} };
    for (const id of ids) {
      const portal = window.portalDebug.state.portals.find((cada) => cada.data.id === id);
      if (!portal) continue;
      const object = portal.el.object3D;
      const position = object.getWorldPosition(new THREE.Vector3());
      linha.portas[id] = {
        p: [position.x, position.y, position.z],
        r: [object.rotation.x, object.rotation.y, object.rotation.z]
      };
    }
    return linha;
  };
  const amostras = [ler()];
  const fim = performance.now() + ${ms};
  while (performance.now() < fim) {
    await new Promise((done) => setTimeout(done, 120));
    amostras.push(ler());
  }
  return amostras;
})()`;

const amplitude = (valores) => (Math.max(...valores) - Math.min(...valores)) / 2;
const centro = (valores) => (Math.max(...valores) + Math.min(...valores)) / 2;
const graus = (valores) => amplitude(valores) * 180 / Math.PI;

// A meia oscilação (o tempo entre dois cruzamentos do centro, em segundos): é onde a curva é mais
// inclinada, e por isso onde a amostra de 120 ms custa menos — nos extremos ela é plana e o instante
// medido escorrega. Devolve também com quantos cruzamentos se ficou: uma medição que não viu nenhum
// tem de o dizer, em vez de aparecer como um número que falhou.
function meiaOscilacao(amostras, id, eixo) {
  const valores = amostras.map((amostra) => amostra.portas[id].p[eixo]);
  const meio = centro(valores);
  const tempos = [];
  for (let i = 1; i < amostras.length; i++) {
    const antes = valores[i - 1] - meio;
    const agora = valores[i] - meio;
    if (antes * agora < 0) {
      tempos.push(amostras[i - 1].t + (amostras[i].t - amostras[i - 1].t) * (antes / (antes - agora)));
    }
  }
  return {
    segundos: tempos.length >= 2 ? (tempos[1] - tempos[0]) / 1000 : null,
    cruzamentos: tempos.length
  };
}

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

    // ---- A sala de ensaio (D84/D85): a oscilação das três portas ---------------------------------
    // O que se mede é o que o **dado** pede, e não a fórmula: a amplitude em cada eixo, os outros dois
    // parados, a translação e a rotação em fase, e a meia oscilação contra o período declarado.
    const dado = JSON.parse(readFileSync(join(ROOT, 'data', 'worlds', 'scene100.json'), 'utf8'));
    await browser.goto(site.base + '/?scene=scene100&bust=' + Date.now(), 60000);
    for (let i = 0; i < 150; i++) {
      if (await browser.evaluate(PRONTO).catch(() => false)) break;
      await sleep(200);
    }
    await sleep(2000);
    // Uma oscilação e um pouco: com o período de 20 s, 23 s dão pelo menos dois cruzamentos do centro
    // em cada porta, que é o que a meia oscilação precisa.
    const amostras = await browser.evaluate(AMOSTRAR(23000), 60000);
    const nomes = ['X', 'Y', 'Z'];
    const medidas = {};
    for (const id of [1, 2, 3]) {
      const porta = dado.portals.find((cada) => cada.id === id);
      const eixo = porta.motion.axis.findIndex((valor) => valor === 1);
      const posicoes = [0, 1, 2].map((k) => amostras.map((a) => a.portas[id].p[k]));
      const rotacoes = [0, 1, 2].map((k) => amostras.map((a) => a.portas[id].r[k]));
      const metros = posicoes.map(amplitude);
      const angulos = rotacoes.map(graus);
      const outros = [0, 1, 2].filter((k) => k !== eixo);
      const meio = centro(posicoes[eixo]);
      // Em fase: no instante em que a porta está no extremo positivo, a rotação também está.
      const iMax = posicoes[eixo].indexOf(Math.max(...posicoes[eixo]));
      const desvio = rotacoes[eixo][iMax] - centro(rotacoes[eixo]);
      medidas[id] = meiaOscilacao(amostras, id, eixo);
      result.check('sala de ensaio · porta ' + id + ' (' + nomes[eixo] + '): oscila ±' +
        porta.motion.amplitude + ' m e ±' + porta.motion.angle +
        '°, em fase e com os outros eixos parados',
        Math.abs(metros[eixo] - porta.motion.amplitude) <= 0.15 &&
          outros.every((k) => metros[k] <= 0.03) &&
          Math.abs(angulos[eixo] - porta.motion.angle) <= 1.5 &&
          outros.every((k) => angulos[k] <= 0.5) &&
          Math.abs(meio - porta.position[eixo]) <= 0.15 &&
          desvio > 0 && Math.abs(desvio * 180 / Math.PI - porta.motion.angle) <= 2,
        'posição ' + metros.map((valor) => valor.toFixed(3)).join(' / ') + ' m, rotação ' +
          angulos.map((valor) => valor.toFixed(2)).join(' / ') + '°, centro ' + meio.toFixed(3) +
          ' (dado ' + porta.position[eixo] + ')');
    }
    const meias = [1, 2, 3].map((id) => medidas[id].segundos);
    const cruzamentos = [1, 2, 3].map((id) => medidas[id].cruzamentos);
    const periodo = dado.portals.find((cada) => cada.id === 1).motion.period;
    result.check('sala de ensaio · a oscilação tem o período do dado (' + periodo + ' s)',
      meias.every((valor) => valor !== null && Math.abs(valor - periodo / 2) <= 0.8),
      'meia oscilação ' + meias.map((valor) => valor === null ? 'sem cruzamentos' : valor.toFixed(2) + ' s')
        .join(' / ') + ' (esperado ' + (periodo / 2) + ' s), ' + amostras.length + ' amostras e ' +
        cruzamentos.join(' / ') + ' cruzamentos');

    // O controlo: a porta do portão não declara `motion`, e por isso não pode mexer-se.
    const quieta = [0, 1, 2].map((k) => amplitude(amostras.map((a) => a.portas[0].p[k])));
    const quietaRotacao = [0, 1, 2].map((k) => amplitude(amostras.map((a) => a.portas[0].r[k])));
    result.check('sala de ensaio · a porta do portão, que não declara movimento, fica parada',
      quieta.every((valor) => valor <= 0.005) && quietaRotacao.every((valor) => valor <= 0.001),
      'posição ' + quieta.map((valor) => valor.toFixed(4)).join(' / ') + ' m, rotação ' +
        quietaRotacao.map((valor) => valor.toFixed(4)).join(' / ') + ' rad');

    const congelado = await browser.evaluate(`(async () => {
      window.portalDebug.freezeMotion(true);
      const ler = () => [1, 2, 3].map((id) => {
        const portal = window.portalDebug.state.portals.find((cada) => cada.data.id === id);
        const posicao = portal.el.object3D.getWorldPosition(new THREE.Vector3());
        return posicao.x.toFixed(4) + ',' + posicao.y.toFixed(4) + ',' + posicao.z.toFixed(4) +
          '@' + portal.el.object3D.rotation.toArray().slice(0, 3).map((v) => v.toFixed(4)).join(',');
      });
      const antes = ler();
      await new Promise((done) => setTimeout(done, 1500));
      return { antes: antes, depois: ler() };
    })()`);
    result.check('sala de ensaio · `freezeMotion` pára a oscilação onde ela está',
      JSON.stringify(congelado.antes) === JSON.stringify(congelado.depois),
      JSON.stringify(congelado.antes.slice(0, 1)) + (congelado.antes[0] === congelado.depois[0]
        ? ' — igual 1,5 s depois' : ' — mudou'));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('os portais em movimento (B8)');
  process.exit(result.list.some((item) => !item.ok) ? 1 : 0);
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
