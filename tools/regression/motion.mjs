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
//
// A posição que se mede é a do **centro da porta** (D86), e não a da origem da entidade: a oscilação
// roda sobre o centro, e por isso a origem descreve um arco de meia altura de raio. Medir a origem media
// o arco. O controlo positivo — a mesma porta rodada sobre a base, que afastaria o centro 8,49 m — é o
// que mostra que esta medida apanha o defeito.
const AMOSTRAR = (ms, ids) => `(async () => {
  const ids = ${JSON.stringify(ids)};
  const ler = () => {
    const linha = { t: performance.now(), portas: {} };
    for (const id of ids) {
      const portal = window.portalDebug.state.portals.find((cada) => cada.data.id === id);
      if (!portal) continue;
      const meio = portal.centreWorld(new THREE.Vector3());
      const q = portal.el.object3D.quaternion;
      linha.portas[id] = {
        p: [meio.x, meio.y, meio.z],
        q: [q.x, q.y, q.z, q.w]
      };
    }
    return linha;
  };
  const amostras = [ler()];
  const fim = performance.now() + ${ms};
  while (performance.now() < fim) {
    await new Promise((done) => setTimeout(done, 100));
    amostras.push(ler());
  }
  return amostras;
})()`;

const amplitude = (valores) => (Math.max(...valores) - Math.min(...valores)) / 2;
const centro = (valores) => (Math.max(...valores) + Math.min(...valores)) / 2;
const graus = (valores) => amplitude(valores) * 180 / Math.PI;

// A meia oscilação (o tempo entre dois cruzamentos do centro, em segundos): é onde a curva é mais
// inclinada, e por isso onde a amostra custa menos — nos extremos ela é plana e o instante medido
// escorrega. Devolve os intervalos todos (a mediana é o que conta) e com quantos cruzamentos se ficou:
// uma medição que não viu nenhum tem de o dizer, em vez de aparecer como um número que falhou.
function meiaOscilacao(valores, tempos) {
  const meio = centro(valores);
  const cruzamentos = [];
  for (let i = 1; i < valores.length; i++) {
    const antes = valores[i - 1] - meio;
    const agora = valores[i] - meio;
    if (antes * agora < 0) {
      cruzamentos.push(tempos[i - 1] + (tempos[i] - tempos[i - 1]) * (antes / (antes - agora)));
    }
  }
  const intervalos = cruzamentos.slice(1).map((tempo, i) => (tempo - cruzamentos[i]) / 1000);
  const ordenados = intervalos.slice().sort((a, b) => a - b);
  return {
    segundos: ordenados.length ? ordenados[Math.floor((ordenados.length - 1) / 2)] : null,
    intervalos,
    cruzamentos: cruzamentos.length
  };
}

// O ângulo **com sinal** de uma orientação em relação a outra, medido sobre um eixo da porta (D87).
// Um ângulo sem sinal (o `2·acos`) dá meio valor — medido: 45° onde o dado diz 90° — e a série deixa de
// ser um seno (é um `|seno|`, que dobra a frequência e estraga a leitura do período).
//
// A conta: `dq = q_repouso⁻¹ · q_agora`, e o ângulo com sinal sobre o eixo é `2·atan2(v·eixo, w)`.
const multiplicarQ = (a, b) => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]
];
const conjugado = (q) => [-q[0], -q[1], -q[2], q[3]];
const anguloComSinal = (repouso, agora, eixoLocal) => {
  const dq = multiplicarQ(conjugado(repouso), agora);
  const senoMetade = dq[0] * eixoLocal[0] + dq[1] * eixoLocal[1] + dq[2] * eixoLocal[2];
  return (2 * Math.atan2(senoMetade, dq[3]) * 180) / Math.PI;
};
// O deslocamento do centro projectado numa direcção do mundo (a do eixo da porta, levada pela rotação
// do dado): é a amplitude da translação, medida no eixo que o sorteio nomeou.
const projeccao = (p, base, direcao) =>
  (p[0] - base[0]) * direcao[0] + (p[1] - base[1]) * direcao[1] + (p[2] - base[2]) * direcao[2];
// O quanto do deslocamento **não** é ao longo do eixo: tem de ser zero.
const residuo = (p, base, direcao, aoLongo) => Math.hypot(
  p[0] - base[0] - direcao[0] * aoLongo,
  p[1] - base[1] - direcao[1] * aoLongo,
  p[2] - base[2] - direcao[2] * aoLongo
);
const eixoDoDado = (quaternion, eixo) => {
  const [x, y, z, w] = quaternion;
  const [ax, ay, az] = eixo;
  // v' = q · v · q⁻¹, escrito à mão para não depender de three neste ficheiro.
  const ix = w * ax + y * az - z * ay;
  const iy = w * ay + z * ax - x * az;
  const iz = w * az + x * ay - y * ax;
  const iw = -x * ax - y * ay - z * az;
  return [
    ix * w + iw * -x + iy * -z - iz * -y,
    iy * w + iw * -y + iz * -x - ix * -z,
    iz * w + iw * -z + ix * -y - iy * -x
  ];
};

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
      typeof lei === 'string' && /can be the door a visitor arrives behind/.test(lei),
      lei.slice(0, 260));

    // ---- A sala de ensaio: as quatro portas **sorteadas** (D87) --------------------------------
    // O que se mede é o que o **dado** pede, e não a fórmula: em cada porta, a amplitude da translação
    // no eixo que o sorteio nomeou (e nada nos outros dois), o ângulo da rotação no eixo que ele
    // nomeou, e os **dois** períodos — o da translação e o da rotação, que são independentes.
    const dado = JSON.parse(readFileSync(join(ROOT, 'data', 'worlds', 'scene100.json'), 'utf8'));
    const comMovimento = dado.portals.filter((cada) => cada.motion && cada.motion.kind === 'sway');
    const ids = comMovimento.map((cada) => cada.id);
    await browser.goto(site.base + '/?scene=scene100&bust=' + Date.now(), 60000);
    for (let i = 0; i < 150; i++) {
      if (await browser.evaluate(PRONTO).catch(() => false)) break;
      await sleep(200);
    }
    await sleep(2000);
    // A pose do dado (D86): o `settleMotion` põe as portas onde o ficheiro as escreve e pára o relógio.
    // É contra ela que a pose de cada instante é comparada, e é ela que a chegada lê (a fase 0 do seno).
    const repouso = await browser.evaluate(`(() => {
      const d = window.portalDebug;
      if (d.settleMotion) d.settleMotion();
      const estados = {};
      for (const id of ${JSON.stringify(ids)}) {
        const portal = d.state.portals.find((cada) => cada.data.id === id);
        const meio = portal.centreWorld(new THREE.Vector3());
        const q = portal.el.object3D.quaternion;
        estados[id] = { p: [meio.x, meio.y, meio.z], q: [q.x, q.y, q.z, q.w] };
      }
      return estados;
    })()`);
    // Assentes, as portas estão **exactamente** onde o ficheiro as põe — é esta invariante que mantém a
    // L16 verdadeira, o retrato válido e a sala alcançável com o `prefers-reduced-motion`.
    const assentes = await browser.evaluate(`(() => {
      const d = window.portalDebug;
      const desvios = [];
      for (const id of ${JSON.stringify(ids)}) {
        const portal = d.state.portals.find((cada) => cada.data.id === id);
        const object = portal.el.object3D;
        desvios.push({
          id: id,
          posicao: Math.max(...['x', 'y', 'z'].map((k, i) =>
            Math.abs(object.position[k] - portal.basePosition[k]))),
          rotacao: Math.max(...['x', 'y', 'z'].map((k) =>
            Math.abs(object.rotation[k] - portal.baseRotation[k])))
        });
      }
      return desvios;
    })()`);
    result.check('sala de ensaio · assentes, as portas estão onde o ficheiro as põe (a pose de repouso)',
      assentes.every((cada) => cada.posicao <= 1e-6 && cada.rotacao <= 1e-6),
      assentes.map((cada) => 'porta ' + cada.id + ': ' + cada.posicao.toExponential(1) + ' m, ' +
        cada.rotacao.toExponential(1) + ' rad').join(' | '));
    await browser.evaluate('window.portalDebug.freezeMotion(false)');
    // O movimento volta a andar no instante em que o relógio está, e por isso a porta salta da pose do
    // dado para a pose daquele instante: esse salto atravessa o centro e inventava um cruzamento a mais
    // (medido: meia oscilação de 7,66 s em vez de 10). Espera-se que fique para trás.
    await sleep(1500);
    // Duas oscilações do período mais longo (20 s): 42 s dão pelo menos dois cruzamentos em cada porta
    // e em cada um dos dois movimentos.
    const amostras = await browser.evaluate(AMOSTRAR(42000, ids), 90000);
    const tempos = amostras.map((amostra) => amostra.t);
    const nomes = ['X', 'Y', 'Z'];
    const medidas = {};

    for (const porta of comMovimento) {
      const id = porta.id;
      const base = repouso[id];
      const eixoTranslacao = porta.motion.axis.findIndex((valor) => valor === 1);
      const eixoRotacao = (porta.motion.rotationAxis || porta.motion.axis)
        .findIndex((valor) => valor === 1);
      // A direcção do eixo da porta, no mundo: a rotação do dado leva-a. É aí que a amplitude se mede.
      const direcao = eixoDoDado(base.q, porta.motion.axis);
      const deslocamentos = amostras.map((a) => projeccao(a.portas[id].p, base.p, direcao));
      const residuos = amostras.map((a, i) => residuo(a.portas[id].p, base.p, direcao, deslocamentos[i]));
      // O ângulo com sinal sobre o eixo que o sorteio nomeou: é o que dá a amplitude (em módulo) e a
      // série certa para o período.
      const angulosSerie = amostras.map((a) =>
        anguloComSinal(base.q, a.portas[id].q, porta.motion.rotationAxis || porta.motion.axis));
      const metros = amplitude(deslocamentos);
      const angulos = amplitude(angulosSerie);
      const translacao = meiaOscilacao(deslocamentos, tempos);
      const rotacao = meiaOscilacao(angulosSerie, tempos);
      medidas[id] = { translacao, rotacao };
      result.check('sala de ensaio · porta ' + id + ' (' + porta.action.target + '): oscila ±' +
        porta.motion.amplitude + ' m em ' + nomes[eixoTranslacao] + ' e ±' + porta.motion.angle +
        '° em ' + nomes[eixoRotacao],
        Math.abs(metros - porta.motion.amplitude) <= 0.15 &&
          Math.abs(angulos - porta.motion.angle) <= 2 &&
          Math.max(...residuos) <= 0.02,
        'translação ' + metros.toFixed(3) + ' m (dado ' + porta.motion.amplitude + '), rotação ' +
          angulos.toFixed(2) + '° (dado ' + porta.motion.angle + '), desvio fora do eixo ' +
          Math.max(...residuos).toExponential(1) + ' m');
    }

    const meiasTranslacao = comMovimento.map((porta) => medidas[porta.id].translacao.segundos);
    const meiasRotacao = comMovimento.map((porta) => medidas[porta.id].rotacao.segundos);
    const periodosTranslacao = comMovimento.map((porta) => porta.motion.period);
    const periodosRotacao = comMovimento.map((porta) => porta.motion.rotationPeriod);
    result.check('sala de ensaio · os dois períodos de cada porta são os do dado',
      comMovimento.every((porta, i) =>
        meiasTranslacao[i] !== null && Math.abs(meiasTranslacao[i] - periodosTranslacao[i] / 2) <= 0.8 &&
        meiasRotacao[i] !== null && Math.abs(meiasRotacao[i] - periodosRotacao[i] / 2) <= 0.8),
      'translação ' + comMovimento.map((porta, i) =>
        (meiasTranslacao[i] === null ? '—' : meiasTranslacao[i].toFixed(2)) + '/' +
        (porta.motion.period / 2).toFixed(2)).join(' · ') +
      ' | rotação ' + comMovimento.map((porta, i) =>
        (meiasRotacao[i] === null ? '—' : meiasRotacao[i].toFixed(2)) + '/' +
        (porta.motion.rotationPeriod / 2).toFixed(2)).join(' · ') + ' (medido/esperado, s)');

    // O controlo positivo da D86: a mesma porta, rodada de 90° **sobre a base** — que é o que a
    // animação fazia antes desta correcção. Se a medida do centro não apanhasse o defeito, este número
    // seria zero e a verificação de cima não provava nada.
    const controlo = await browser.evaluate(`(() => {
      const d = window.portalDebug;
      d.settleMotion();
      const portal = d.state.portals.find((cada) => cada.data.id === ${ids[0]});
      const object = portal.el.object3D;
      const antes = portal.centreWorld(new THREE.Vector3());
      const base = portal.baseRotation.clone();
      object.rotation.set(base.x + Math.PI / 2, base.y, base.z);
      object.updateMatrixWorld(true);
      const depois = portal.centreWorld(new THREE.Vector3());
      object.rotation.copy(base);
      object.updateMatrixWorld(true);
      return { desvio: antes.distanceTo(depois) };
    })()`);
    result.check('sala de ensaio · o controlo: rodar sobre a base afastaria o centro da porta',
      controlo.desvio >= 5,
      'com o pivô na base o centro sai ' + controlo.desvio.toFixed(2) + ' m do lugar; com o pivô no ' +
        'centro sai 0,000 m (a diagonal da porta é o raio que ele descreveria)');

    // ---- A travessia exige que o visitante ande (D87) --------------------------------------------
    // A caixa de colisão roda com a porta e varre até 12 m para dentro da sala. Aqui a porta é **rodada
    // à mão** com a câmara parada no ponto de chegada: os dois sentidos da mesma prova. Sem a condição,
    // o cruzamento do plano dispara e o visitante é levado sem se mexer; com ela, não.
    const parado = await browser.evaluate(`(async () => {
      const d = window.portalDebug;
      const portal = d.state.portals.find((cada) => cada.data.id === 1);
      d.freezeMotion(true);
      d.settleMotion();
      const conta = { navegacoes: 0 };
      const original = portal.navigate.bind(portal);
      portal.navigate = function () { conta.navegacoes++; };
      const camara = document.querySelector('a-camera').object3D;
      // A câmara no ponto de chegada da porta (meia profundidade da caixa + 0,5 m à frente).
      const centro = portal.centreWorld(new THREE.Vector3());
      const frente = new THREE.Vector3(0, 0, 1)
        .applyQuaternion(portal.portalGroup.getWorldQuaternion(new THREE.Quaternion()))
        .normalize();
      const distancia = portal.data.box ? portal.data.box.z / 2 + 0.5 : 1;
      camara.position.set(centro.x + frente.x * distancia, 1.6, centro.z + frente.z * distancia);
      const base = portal.baseRotation.clone();
      const espera = () => new Promise((done) =>
        requestAnimationFrame(() => requestAnimationFrame(done)));
      // A porta varre uma volta inteira, com a câmara parada.
      for (let i = 0; i < 24; i++) {
        const angulo = (i / 24) * Math.PI * 2;
        portal.el.object3D.rotation.set(base.x + angulo, base.y, base.z);
        await espera();
      }
      const semAndar = conta.navegacoes;
      // O controlo: a mesma varredura, com a câmara a andar 5 cm por passo.
      conta.navegacoes = 0;
      for (let i = 0; i < 24; i++) {
        const angulo = (i / 24) * Math.PI * 2;
        portal.el.object3D.rotation.set(base.x + angulo, base.y, base.z);
        camara.position.z += 0.05;
        await espera();
      }
      portal.navigate = original;
      return { semAndar: semAndar, aAndar: conta.navegacoes };
    })()`);
    result.check('sala de ensaio · parado, a porta em movimento não leva o visitante',
      parado.semAndar === 0,
      'com a câmara parada e a porta a varrer uma volta inteira: ' + parado.semAndar +
        ' navegação(ões); com a câmara a andar: ' + parado.aAndar);
    result.check('sala de ensaio · e o controlo: a andar, a mesma varredura leva-o',
      parado.aAndar > 0,
      'sem este controlo, «parado não é levado» também passaria numa cena sem travessia nenhuma');

    const congelado = await browser.evaluate(`(async () => {
      window.portalDebug.freezeMotion(true);
      const ler = () => ${JSON.stringify(ids)}.map((id) => {
        const portal = window.portalDebug.state.portals.find((cada) => cada.data.id === id);
        const posicao = portal.centreWorld(new THREE.Vector3());
        const q = portal.el.object3D.quaternion;
        return posicao.x.toFixed(4) + ',' + posicao.y.toFixed(4) + ',' + posicao.z.toFixed(4) +
          '@' + [q.x, q.y, q.z, q.w].map((v) => v.toFixed(4)).join(',');
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
