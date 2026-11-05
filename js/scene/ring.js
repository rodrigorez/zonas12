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

// Os dois raios e a margem de oclusão (D77, revistos na D93). Uma obra está entre o centro e as
// portas, por isso é ela que decide o raio — mas não é a largura dela que manda, é o **teto** da folga
// entre dois anéis regulares (`clearanceCeiling`), que só depende do número de lugares: o pior caso da
// exposição é o das **7 obras com 6 portas** (a sala 1, com a porta da sala 12), cujo teto é 4,29°.
//
// A 40 m a meia-largura de uma obra de 4 m é 2,86° e, com a margem de 2°, a folga pedida é 4,86° —
// acima do teto, e por isso a sala 1 recusou a sexta porta (medido: 4,29° disponíveis para 4,86°
// pedidos). A 60 m a mesma obra ocupa 1,91° e a folga pedida desce a 3,91°, abaixo do teto com 0,38° de
// margem. O anel das portas cresce na mesma proporção (2:3) para as obras não ficarem encostadas às
// portas, e o fundo (500 m, L1) continua muito acima dos dois.
export const RING = {
  artworks: { radius: 60, height: 1.5 },
  portals: { radius: 90, height: 0 },
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

// ---- L31: o plano dos anéis do portão, quando as portas deixam de caber num ----
//
// O portão tem **uma porta por sala** (L24), por isso cresce com a exposição. Num anel só, a 90 m, o
// passo é 360/n e a corda é 2R·sin(π/n): medido, 13 portas dão **27,69°** e **43,1 m** de corda (35,1 m
// entre bordas de 8 m) e 27 dão **13,33°** e **20,9 m** (12,9 m entre bordas) — com as portas a oscilar
// 4 a 5 m, o anel deixa de ser um átrio e passa a ser uma vedação.
//
// O limite de **vinte** é o ponto em que a corda cai abaixo de **28 m** (20 m entre bordas): daí para
// cima o passo é menor que 18° e a porta lê-se como um selo.
//
// Daí para cima, anéis concêntricos a R, 2R, 3R… com as portas repartidas o mais igualmente possível e
// as fases intercaladas (o anel *i* desfasado de `i · 360/(c·k)`), que é o que põe cada porta no vão da
// de dentro.
//
// **Dois anéis não chegam para vinte e sete, e o número que o decide é aritmético.** A folga entre duas
// grelhas regulares de *a* e *b* pontos tem teto `360 / (2·mmc(a, b))`. Com 27 portas, qualquer reparto
// em dois dá números coprimos — 12 + 15 tem mmc 60 e um teto de **3,00°**, abaixo dos **3,82°** de que
// as janelas precisam, e isso **não depende do raio** (medido de 120 a 200 m: o teto é o mesmo). **Três
// anéis de nove** a 90 / 180 / 270 m dão **13,33°** e passam com folga. Foi medido no ensaio da sala de
// ensaio (`tools/scene/ensaio-dois-aneis.mjs`, D97).
export const SINGLE_RING_MAX = 20;

// A corda mínima entre dois centros vizinhos dentro do mesmo anel (portas de 8 m → 20 m entre bordas).
export const MIN_RING_CHORD = 28;

// O número máximo de anéis que o plano procura. Quatro chega para qualquer exposição que caiba no
// fundo de 500 m (4 × 90 = 360 m).
export const MAX_RINGS = 4;

// O anel onde cada porta se senta, e a fase de cada anel — ou `null` quando nem quatro anéis servem
// (aí o problema é o número de portas, e quem chama tem de dizer isso).
//
// Puro e determinístico: a mesma contagem dá sempre o mesmo plano, que é o que o dado gravado precisa.
export function ringPlan(count, width) {
  const doorWidth = width === undefined ? 8 : width;
  const base = RING.portals.radius;
  const planos = [];

  // Repartir `count` por `rings` anéis **sem exigir partes iguais**. A igualdade é o caso bonito, mas
  // não serve para os números ímpares: 23 portas em partes iguais dão 6+6+6+5, e o anel de 5 contra a
  // grelha de 15° que os três de 6 formam tem um tecto de 3,00° — abaixo dos 3,18° pedidos. Com uma
  // parte de 8 e três de 5 (8 + 5 + 5 + 5 = 23) o tecto sobe a 4,50° e passa. Por isso a busca é sobre
  // repartos, e não sobre metades.
  for (let rings = 1; rings <= MAX_RINGS; rings++) {
    const candidates = [];
    const iguais = Math.floor(count / rings);
    if (iguais * rings === count) candidates.push(Array.from({ length: rings }, () => iguais));
    for (let distintos = 1; distintos < rings; distintos++) {
      for (let grande = 2; grande <= SINGLE_RING_MAX; grande++) {
        const resto = count - distintos * grande;
        const pequeno = resto / (rings - distintos);
        if (!Number.isInteger(pequeno) || pequeno < 2 || pequeno > grande) continue;
        const reparto = [];
        for (let i = 0; i < rings - distintos; i++) reparto.push(pequeno);
        for (let i = 0; i < distintos; i++) reparto.push(grande);
        // Menor por dentro: acrescentar uma porta ao fim nunca mexe nas de dentro.
        reparto.sort((a, b) => a - b);
        const chave = reparto.join('+');
        if (!candidates.some((cada) => cada.join('+') === chave)) candidates.push(reparto);
      }
    }

    for (const counts of candidates) {
      const radii = counts.map((_, index) => base * (index + 1));
      const chords = counts.map((cada, index) => chord(radii[index], cada));
      if (Math.min(...chords) < MIN_RING_CHORD) continue;

      const needed = round(halfWidth(doorWidth, radii[0]) + halfWidth(doorWidth, radii[rings - 1]));
      if (rings === 1) {
        return { rings: [{ count: count, radius: base, phase: 0 }], clearance: Infinity, needed: needed };
      }

      // As fases: os anéis intercalam-se pela fórmula; e o anel que quebra a igualdade leva uma busca
      // de meio grau, que é a única parte que precisa de ser procurada.
      const phases = counts.map((cada, index) => (index === 0 ? 0 : round((index * 360) / (cada * rings))));
      const aneis = counts.map((cada, index) => {
        const angles = [];
        for (let slot = 0; slot < cada; slot++) angles.push(normaliseAngle(phases[index] + (slot * 360) / cada));
        return angles;
      });
      const folga = () => {
        let smallest = Infinity;
        for (let left = 0; left < rings; left++) {
          for (let right = left + 1; right < rings; right++) {
            smallest = Math.min(smallest, angularClearance(aneis[left], aneis[right]));
          }
        }
        return smallest;
      };
      const todosIguais = counts.every((cada) => cada === counts[0]);
      let melhor = { phases: phases.slice(), clearance: round(folga()) };
      if (!todosIguais) {
        const ultimo = rings - 1;
        for (let step = 0; step < 720; step++) {
          const phase = step * 0.5;
          aneis[ultimo] = [];
          for (let slot = 0; slot < counts[ultimo]; slot++) {
            aneis[ultimo].push(normaliseAngle(phase + (slot * 360) / counts[ultimo]));
          }
          const clearance = folga();
          if (clearance > melhor.clearance) {
            melhor = { phases: phases.slice(0, ultimo).concat([round(phase)]), clearance: round(clearance) };
          }
        }
      }
      if (melhor.clearance < needed) continue;

      const ringsOut = counts.map((cada, index) => ({
        count: cada,
        radius: radii[index],
        phase: melhor.phases[index]
      }));
      const spread = Math.max(...counts) - Math.min(...counts);
      planos.push({ rings: ringsOut, clearance: melhor.clearance, needed: needed, spread: spread });
    }
  }

  // A escolha: primeiro o reparto mais **equilibrado** (é o que a estética e o ensaio aprovaram — 27
  // portas dão três anéis de nove, não dois de nove e dezoito), depois o menor número de anéis, e só
  // então a maior folga.
  if (planos.length === 0) return null;
  planos.sort((left, right) => left.spread - right.spread ||
    left.rings.length - right.rings.length ||
    right.clearance - left.clearance);
  const escolhido = planos[0];
  return { rings: escolhido.rings, clearance: escolhido.clearance, needed: escolhido.needed };
}

// Os lugares de cada anel do plano, na forma de `ringPositions` (com `ring` a dizer de qual veio).
export function ringPlanPositions(count, height, width) {
  const plan = ringPlan(count, width);
  const y = height === undefined ? 0 : height;
  const places = [];
  if (!plan) return places;
  plan.rings.forEach((anel, ring) => {
    for (const spot of ringPositions(anel.count, anel.radius, anel.phase, y)) {
      places.push(Object.assign({}, spot, { index: places.length, ring: ring, radius: anel.radius }));
    }
  });
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

// O giro do retrato de uma porta de mundo (D78). A janela de uma porta mostra o fundo do destino, e
// esse fundo é ancorado ao **azimute do mundo dele** — mas a janela está no mundo de origem.
//
// As duas vistas que têm de coincidir: a janela olha **para fora**, na direcção do anel da porta de
// onde se sai (`from`); a chegada olha **para dentro**, que é essa direcção rodada de meia volta no
// anel do destino (`arrival + 180`). O que separa as duas é a diferença, e é isso que a esfera do
// retrato tem de rodar — a mesma esfera desenha o shader e o recorte, e os dois ficam alinhados.
//
// Medido na porta 38 da sala 10: sem giro, 27,79 de salto no corte com a meta em 0,50; com ele, 0,27.
// O resultado fica em (-180, 180] para o dado ser legível.
export function portraitTurn(from, arrival) {
  const turn = normaliseAngle(arrival + 180 - from);
  return round(turn > 180 ? turn - 360 : turn, 1);
}

// O azimute com que um destino abre para uma **primeira visita** (D84/D89).
//
// Uma porta de uma sala com `world.carryOrigin: false` entra no destino **sem `?from`**, e sem `?from`
// não há porta de chegada: o visitante aparece na pose por omissão de `cameras.player` — e o esquema
// dessa câmara tem só `position` e `speed`, nenhuma rotação, porque a câmara nasce sempre a olhar para
// **−Z**. O azimute da chegada é, por isso, 0 **por construção**, e não por omissão: não é um número
// que se ajuste, é o que o formato permite.
//
// É a peça que faltava à L26 para poder julgar essas portas: sem porta de chegada, a conta do giro não
// tinha segundo termo e a lei saltava-as em silêncio (era o único sítio onde o dado afirmava mais do
// que uma lei provava).
export const FIRST_VISIT_AZIMUTH = 0;

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
