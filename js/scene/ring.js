// A disposição em dois anéis: as obras num círculo de raio R1 e as portas num círculo concêntrico de
// raio R2 > R1, cada anel com o seu passo angular constante e o mesmo centro — o ponto onde o
// visitante entra no espaço.
//
// Porque existe: a regra é a mesma nas doze páginas e não pode ficar escrita à mão em cada ficheiro
// de mundo (é a L6 outra vez: uma só casa para a regra). O `tools/scene/ring.mjs` mede o dado com
// isto, a Fase 3 reescreve o dado com isto, e o validador e o editor hão-de perguntar o mesmo em vez
// de repetirem a aritmética.
//
// Puro: sem A-Frame, sem Three, sem disco. Ângulos em graus, medidas em metros.
//
// A convenção é a da câmara e a das obras: θ mede-se a partir do eixo −Z e cresce para +X (o mesmo
// sentido de `atan2(x, −z)`); a posição é [R·sin θ, y, −R·cos θ] e a frente de quem ali está aponta
// ao centro com `rotation.y = −θ`. É a conta que mantém uma obra de `rotation: [0, 0, 0]` numa fila
// a z < 0 virada ao visitante — o anel é a mesma regra, com a frente a rodar.

// Os dois raios e a margem de oclusão (D77). Uma obra está entre o centro e as portas, por isso é
// ela que decide o raio: com 7 obras e 5 portas a folga máxima possível entre um eixo de porta e um
// eixo de obra é 5,14° (o teto de `clearanceCeiling`), e 40 m é o raio a partir do qual a
// meia-largura de uma obra de 4 m — 2,86° — fica abaixo disso com a margem à vontade.
export const RING = {
  artworks: { radius: 40, height: 1.5 },
  portals: { radius: 60, height: 0 },
  // Graus de folga além da meia-largura de uma obra: o que separa «a obra esconde a porta» de «a
  // obra passa ao lado da porta».
  occlusionMargin: 2,
  // O que faz um objeto do dado contar como «no anel»: meio metro e meio grau, que é a folga de
  // quem escreveu os números à mão.
  radiusTolerance: 0.5,
  angleTolerance: 0.5
};

const DEGREES = 180 / Math.PI;

const round = (value, places) => {
  const factor = 10 ** (places === undefined ? 2 : places);
  return Math.round(value * factor) / factor;
};

// θ no intervalo [0, 360).
export function normaliseAngle(degrees) {
  const wrapped = degrees % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

// A distância mais curta entre dois ângulos, em graus (0…180).
export function angularGap(a, b) {
  const difference = Math.abs(normaliseAngle(a) - normaliseAngle(b));
  return difference > 180 ? 360 - difference : difference;
}

// A menor distância entre um ângulo de A e um ângulo de B. `Infinity` quando um dos lados está
// vazio: um anel sem vizinhos não tem com que colidir, e um número inventado aqui esconderia isso.
export function angularClearance(anglesA, anglesB) {
  let smallest = Infinity;
  for (let left = 0; left < anglesA.length; left++) {
    for (let right = 0; right < anglesB.length; right++) {
      const gap = angularGap(anglesA[left], anglesB[right]);
      if (gap < smallest) smallest = gap;
    }
  }
  return smallest;
}

// Meia-largura angular de um objeto de `width` metros visto do centro de um anel de raio `radius`:
// quanto do círculo é que ele ocupa.
export function halfWidth(width, radius) {
  if (!(radius > 0) || !(width > 0)) return 0;
  return Math.atan(width / 2 / radius) * DEGREES;
}

// O que se pede entre um eixo de porta e um eixo de obra para a obra não passar à frente da porta.
export function requiredClearance(width, radius, margin) {
  return halfWidth(width, radius) + (margin === undefined ? RING.occlusionMargin : margin);
}

// A fase que põe um vão do anel centrado em `target`: com o alvo em 0, o eixo de quem entra cai
// entre duas obras em vez de acertar numa. (Uma obra a 0° estaria exactamente à frente da câmara.)
export function gapPhase(count, target) {
  const centre = target === undefined ? 0 : target;
  return normaliseAngle(centre + 180 / Math.max(count, 1));
}

const greatestCommonDivisor = (a, b) => (b === 0 ? a : greatestCommonDivisor(b, a % b));

// O teto da folga entre dois anéis regulares de `countA` e `countB` lugares.
//
// As diferenças entre as duas grelhas regulares formam outra grelha, de passo 360/m.m.c.(a, b), e a
// maior distância a que um ponto se pode pôr de todos os outros é metade disso. É este número que
// diz se o `bestPhase` achou o óptimo ou ficou a meio caminho.
export function clearanceCeiling(countA, countB) {
  if (!countA || !countB) return Infinity;
  const leastCommonMultiple = (countA * countB) / greatestCommonDivisor(countA, countB);
  return 360 / (2 * leastCommonMultiple);
}

// A fase do anel das portas que mais afasta cada porta do eixo de uma obra.
//
// Determinística de propósito: varre o círculo de 0,05 em 0,05 graus, fica com a maior folga e, no
// empate, com a primeira — a mesma conta dá sempre a mesma resposta, que é o que os testes e o dado
// gravado precisam.
export function bestPhase(count, otherAngles, step) {
  const stepSize = step === undefined ? 0.05 : step;
  if (!count || !otherAngles || otherAngles.length === 0) return { phase: 0, clearance: Infinity };

  let best = { phase: 0, clearance: -1 };
  const steps = Math.round(360 / stepSize);
  const angles = [];
  for (let index = 0; index < steps; index++) {
    const phase = index * stepSize;
    angles.length = 0;
    for (let slot = 0; slot < count; slot++) angles.push(normaliseAngle(phase + (slot * 360) / count));
    const clearance = angularClearance(angles, otherAngles);
    if (clearance > best.clearance) best = { phase: round(phase), clearance: round(clearance) };
  }
  return best;
}

// Os `count` lugares de um anel, com a posição e a rotação que o dado guarda.
export function ringPositions(count, radius, phase, height) {
  const places = [];
  const centre = phase === undefined ? 0 : phase;
  const y = height === undefined ? 0 : height;
  for (let index = 0; index < count; index++) {
    const angle = normaliseAngle(centre + (index * 360) / count);
    const radians = angle / DEGREES;
    places.push({
      index: index,
      angle: round(angle),
      position: [round(radius * Math.sin(radians)), round(y), round(-radius * Math.cos(radians))],
      rotation: [0, round(-angle), 0]
    });
  }
  return places;
}

// A distância em linha recta entre dois lugares vizinhos: é ela que diz se duas caixas de 12 m (ou
// dois painéis de 4 m) cabem no anel sem se tocarem.
export function chord(radius, count) {
  if (count < 2) return 0;
  return 2 * radius * Math.sin(Math.PI / count);
}

// Onde é que um objeto do dado está, em coordenadas do anel: o raio e o ângulo.
export function ringCoordinates(position) {
  const x = Array.isArray(position) ? position[0] : 0;
  const z = Array.isArray(position) ? position[2] : 0;
  return { radius: Math.hypot(x, z), angle: normaliseAngle(Math.atan2(x, -z) * DEGREES) };
}

// Quanto é que o dado se afasta do anel que a regra pede: o pior desvio de raio e o pior desvio de
// ângulo ao lugar mais próximo. É a medida que o `tools/scene/ring.mjs` imprime e que a Fase 3 leva
// a zero.
export function ringDeviation(objects, radius, phase, count) {
  const slots = ringPositions(count, radius, phase, 0).map((place) => place.angle);
  const deviation = { radius: 0, angle: 0 };
  if (slots.length === 0) return deviation;

  for (const object of objects) {
    const at = ringCoordinates(object.position);
    const nearest = Math.min.apply(null, slots.map((slot) => angularGap(at.angle, slot)));
    deviation.radius = Math.max(deviation.radius, Math.abs(at.radius - radius));
    deviation.angle = Math.max(deviation.angle, nearest);
  }
  return { radius: round(deviation.radius), angle: round(deviation.angle) };
}
