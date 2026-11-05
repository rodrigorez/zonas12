#!/usr/bin/env node
// A disposição em dois anéis, medida no dado das doze páginas (Fase 1 da D77).
//
// Porque existe: a regra dos dois anéis é geometria, e geometria escrita à mão em doze ficheiros é a
// mesma aritmética doze vezes — o que a L6 não quer. A conta vive em `js/scene/ring.js`, puro, o
// mesmo módulo que a Fase 3 há-de usar para reescrever o dado; aqui lê-se o disco e imprime-se a
// tabela que decide se os raios servem.
//
// Esta ferramenta **não escreve nada** sem `--aplicar` (o `--posicoes` mostra o que a regra propõe).
// O que ela responde é a pergunta da Fase 1: a folga entre os dois anéis chega para nenhuma obra
// tapar o eixo de uma porta? As caixas de 12 m cabem no anel? O fundo de cada sala é maior do que o
// anel (L1)? E o dado, está em anel ou ainda nas filas de antes?
//
// Uso: node tools/scene/ring.mjs [--posicoes] [--aplicar] [mundo...]
//      (--posicoes imprime também os lugares que a regra propõe, por mundo)
//      (--aplicar põe as obras e as portas nos anéis, e é a única coisa que escreve)
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  RING, MIN_RING_CHORD, SINGLE_RING_MAX, angularGap, bestPhase, chord, clearanceCeiling, gapPhase,
  requiredClearance, ringDeviation, ringPlan, ringPlanPositions,
  ringPositions
} from '../../js/scene/ring.js';
import { FIXTURES } from '../../js/scene/fixtures.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

// Os fixtures não são salas (D9) — a lista vive em `js/scene/fixtures.js` desde a lei L22, porque o
// browser também precisa dela.

const args = process.argv.slice(2);
const showPositions = args.includes('--posicoes');
const apply = args.includes('--aplicar');
const wanted = args.filter((arg) => !arg.startsWith('--'));

const round = (value) => Math.round(value * 100) / 100;
const decimal = (value) => round(value).toFixed(2).replace('.', ',');
const degrees = (value) => `${decimal(value)}°`;
const pad = (value, width, right) => (right ? String(value).padStart(width) : String(value).padEnd(width));
const place = (position, rotation) =>
  `[${pad(decimal(position[0]), 7, true)} ${pad(decimal(position[1]), 7, true)} ${pad(decimal(position[2]), 8, true)}]` +
  `  rotation [0, ${decimal(rotation[1])}, 0]`;

const directory = join(root, 'data', 'worlds');
if (!existsSync(directory)) {
  console.error(`data/worlds/ não existe — o anel mede-se no dado, e o dado não está aqui`);
  process.exit(1);
}

const worlds = [];
for (const name of readdirSync(directory).filter((entry) => entry.endsWith('.json'))) {
  const text = readFileSync(join(directory, name), 'utf8');
  const scene = JSON.parse(text);
  const slug = (scene.world && scene.world.slug) || basename(name, '.json');
  if (FIXTURES.includes(slug)) continue;
  if (wanted.length > 0 && !wanted.includes(slug)) continue;
  worlds.push({ slug: slug, scene: scene, file: name, eol: text.includes('\r\n') ? '\r\n' : '\n' });
}

// O portão primeiro e as salas pela ordem do número: é a ordem em que se lê a exposição.
const order = (slug) => {
  const digits = /(\d+)/.exec(slug);
  return digits ? Number(digits[1]) : -1;
};
worlds.sort((a, b) => order(a.slug) - order(b.slug) || a.slug.localeCompare(b.slug));

if (worlds.length === 0) {
  console.error(`nenhum mundo para medir${wanted.length > 0 ? `: ${wanted.join(', ')}` : ''}`);
  process.exit(1);
}

// A medida de um mundo: os dois anéis que a regra pede, o que ela promete e onde é que o dado está.
function measure(scene) {
  const artworks = scene.artworks || [];
  const portals = scene.portals || [];

  const widths = artworks
    .map((artwork) => (artwork.size && Number(artwork.size[0])) || 0)
    .filter((width) => width > 0);
  const boxWidths = portals
    .map((portal) => (portal.box && Number(portal.box[0])) || 12)
    .filter((width) => width > 0);

  // A fase das obras põe um vão em 0° (o eixo de quem entra); a das portas é a que mais afasta cada
  // porta do eixo de uma obra.
  const artworkPhase = artworks.length > 0 ? gapPhase(artworks.length) : 0;
  const artworksRing = ringPositions(artworks.length, RING.artworks.radius, artworkPhase, RING.artworks.height);
  const doors = bestPhase(portals.length, artworksRing.map((spot) => spot.angle));
  // L31 (D97): acima de vinte portas um anel só é uma vedação, e o lugar de cada porta passa a vir do
  // plano de anéis — o mesmo que o validador confere.
  const plano = portals.length > SINGLE_RING_MAX ? ringPlan(portals.length) : null;
  const portalsRing = plano
    ? ringPlanPositions(portals.length, RING.portals.height)
    : ringPositions(portals.length, RING.portals.radius, doors.phase, RING.portals.height);

  const workWidth = widths.length > 0 ? Math.max.apply(null, widths) : 4;
  const boxWidth = boxWidths.length > 0 ? Math.max.apply(null, boxWidths) : 12;

  return {
    artworks: artworks,
    portals: portals,
    artworkPhase: artworkPhase,
    portalsPhase: doors.phase,
    clearance: doors.clearance,
    needed: artworks.length > 0 ? requiredClearance(workWidth, RING.artworks.radius) : 0,
    workWidth: workWidth,
    boxWidth: boxWidth,
    artworksChord: chord(RING.artworks.radius, artworks.length),
    portalsChord: chord(RING.portals.radius, portals.length),
    artworksRing: artworksRing,
    portalsRing: portalsRing,
    artworkDeviation: ringDeviation(artworks, RING.artworks.radius, artworkPhase, artworks.length),
    portalsDeviation: ringDeviation(portals, RING.portals.radius, doors.phase, portals.length),
    // O plano de anéis (L31), quando existe: diz quantos anéis são e onde cada porta se senta.
    plan: plano,
    planOk: plano
      ? Math.min(...plano.rings.map((anel) => chord(anel.radius, anel.count))) >= MIN_RING_CHORD
      : true,
    planNote: plano
      ? plano.rings.map((anel) => `${anel.count} a ${anel.radius} m`).join(' + ') +
        ` · folga ${plano.clearance === Infinity ? '—' : plano.clearance}° para ${plano.needed}°`
      : '',
    onRing: (deviation) => deviation.radius <= RING.radiusTolerance && deviation.angle <= RING.angleTolerance
  };
}

// O anel que a regra propõe confere consigo próprio: os lugares no raio, os passos iguais e a frente
// virada ao centro. É o que faz disto um instrumento e não um desenho — se a aritmética de
// `js/scene/ring.js` se partir, é aqui que se vê, e não na captura de ecrã da Fase 3.
function checkRing(places, radius) {
  const problems = [];
  const step = places.length > 1 ? 360 / places.length : 0;
  for (let index = 0; index < places.length; index++) {
    const spot = places[index];
    if (Math.abs(Math.hypot(spot.position[0], spot.position[2]) - radius) > 0.01) {
      problems.push(`o lugar ${spot.index} não está no raio de ${radius} m`);
    }
    if (places.length > 1) {
      const next = places[(index + 1) % places.length];
      if (Math.abs(angularGap(spot.angle, next.angle) - step) > 0.01) {
        problems.push(`o passo entre os lugares ${spot.index} e ${next.index} não é ${decimal(step)}°`);
      }
    }
    const front = [
      Math.sin((spot.rotation[1] * Math.PI) / 180),
      Math.cos((spot.rotation[1] * Math.PI) / 180)
    ];
    if (Math.abs(front[0] + spot.position[0] / radius) > 0.001 ||
      Math.abs(front[1] + spot.position[2] / radius) > 0.001) {
      problems.push(`o lugar ${spot.index} não está virado ao centro`);
    }
  }
  return problems;
}

// Põe as obras e as portas nos anéis que a regra pede.
//
// A obra i fica no lugar i do seu anel; as portas ficam nos lugares por ordem do ficheiro, com uma
// excepção: a porta do portão (a que se declara chegada do portão) fica no lugar mais próximo de 0°,
// para quem atravessa o portão ver a sala de frente. A folga do anel não muda com isso — muda só
// quem se senta onde. A altura é a que o dado já tinha: o anel decide o plano, não a altura.
function assignRing(scene, measured) {
  let moved = 0;
  const place = (object, seat, height) => {
    const before = Array.isArray(object.position) ? object.position : [0, 0, 0];
    if (Math.abs(before[0] - seat.position[0]) > 0.01 || Math.abs(before[2] - seat.position[2]) > 0.01) {
      moved++;
    }
    object.position = [seat.position[0], height, seat.position[2]];
    object.rotation = [0, seat.rotation[1], 0];
  };

  (scene.artworks || []).forEach((artwork, index) => {
    const seat = measured.artworksRing[index];
    if (!seat) return;
    const height = Array.isArray(artwork.position) && typeof artwork.position[1] === 'number'
      ? artwork.position[1]
      : RING.artworks.height;
    place(artwork, seat, round(height));
  });

  const portals = scene.portals || [];
  const seats = measured.portalsRing;
  if (portals.length > 0 && seats.length > 0) {
    const door = portals.findIndex((portal) => portal.arrivalFrom === 'gate');
    const order = door >= 0 ? [door] : [];
    for (let index = 0; index < portals.length; index++) {
      if (index !== door) order.push(index);
    }
    let anchor = 0;
    if (door >= 0) {
      anchor = seats.reduce((best, seat, index) =>
        (angularGap(seat.angle, 0) < angularGap(seats[best].angle, 0) ? index : best), 0);
    }
    const ringSeats = seats.slice(anchor).concat(seats.slice(0, anchor));
    order.forEach((portalIndex, position) => {
      const portal = portals[portalIndex];
      const height = Array.isArray(portal.position) && typeof portal.position[1] === 'number'
        ? portal.position[1]
        : RING.portals.height;
      place(portal, ringSeats[position], round(height));
    });
  }
  return moved;
}

// O fundo de cada sala tem de ser maior do que o anel (L1): a obra de `radius` metros mostrada
// dentro da janela é a mesma esfera que envolve a cena.
function smallBackgrounds(scene) {
  const small = [];
  for (const dimension of scene.dimensions || []) {
    if (dimension.kind === 'camera') continue;
    if (typeof dimension.radius !== 'number') continue;
    if (dimension.radius <= RING.portals.radius) small.push(dimension);
  }
  return small;
}

console.log(`anel: R1 = ${RING.artworks.radius} m (obras, altura ${decimal(RING.artworks.height)}) · ` +
  `R2 = ${RING.portals.radius} m (portas)`);
console.log(`folga entre um eixo de porta e um eixo de obra: meia-largura da obra + ` +
  `${decimal(RING.occlusionMargin)}° de margem`);
console.log('');
console.log(
  pad('mundo', 11) + pad('obras', 7, true) + pad('portas', 8, true) +
  pad('folga', 9, true) + pad('precisa', 9, true) + '  ' + pad('anel', 6) + 'dado'
);

const failures = [];
const tight = [];
let withoutArtworks = 0;
let onRingCount = 0;
let failedWorlds = 0;
let movedObjects = 0;
const writtenWorlds = [];

for (const world of worlds) {
  const measured = measure(world.scene);
  const hasArtworks = measured.artworks.length > 0;
  if (!hasArtworks) withoutArtworks++;

  // O veredicto do anel: a folga chega? As caixas cabem? O fundo envolve a cena?
  let verdict = 'ok';
  let tightNote = null;
  const fail = (message) => {
    verdict = 'falha';
    failures.push(`${world.slug}: ${message}`);
  };

  if (hasArtworks && measured.clearance < measured.needed) {
    fail(`a folga é ${degrees(measured.clearance)} e o que se pede é ${degrees(measured.needed)} — ` +
      `uma obra fica à frente do eixo de uma porta`);
  } else if (hasArtworks && measured.clearance < measured.needed + 1) {
    tightNote = `folga ${degrees(measured.clearance)} para ${degrees(measured.needed)} pedidos — ` +
      `${degrees(measured.clearance - measured.needed)} de margem`;
  }

  if (measured.artworks.length > 1 && measured.artworksChord < measured.workWidth + 2) {
    fail(`as obras estão a ${decimal(measured.artworksChord)} m umas das outras e um painel de ` +
      `${decimal(measured.workWidth)} m não cabe no anel (R1 = ${RING.artworks.radius} m)`);
  }
  if (measured.portals.length > 1 && measured.portalsChord < measured.boxWidth + 1) {
    fail(`as portas estão a ${decimal(measured.portalsChord)} m umas das outras e uma caixa de ` +
      `${decimal(measured.boxWidth)} m não cabe no anel (R2 = ${RING.portals.radius} m)`);
  }
  if (measured.plan && !measured.planOk) {
    fail(`o plano de ${measured.plan.rings.length} anéis não cabe (${measured.planNote}) — law L31`);
  }

  for (const dimension of smallBackgrounds(world.scene)) {
    fail(`dimensões[${dimension.id}]: o raio ${dimension.radius} não é maior do que o anel ` +
      `(${RING.portals.radius} m) — lei L1`);
  }

  for (const problem of checkRing(measured.artworksRing, RING.artworks.radius)) {
    fail(`anel das obras: ${problem}`);
  }
  if (measured.plan) {
    // L31: com mais de um anel, cada um é conferido com o seu raio e o seu número de lugares.
    const porAnel = new Map();
    for (const spot of measured.portalsRing) {
      if (!porAnel.has(spot.radius)) porAnel.set(spot.radius, []);
      porAnel.get(spot.radius).push(spot);
    }
    for (const [radius, lugares] of porAnel) {
      for (const problem of checkRing(lugares, radius)) fail(`anel das portas (${radius} m): ${problem}`);
    }
  } else {
    for (const problem of checkRing(measured.portalsRing, RING.portals.radius)) {
      fail(`anel das portas: ${problem}`);
    }
  }

  // O `--aplicar` é a única coisa que escreve, e escreve depois de todos os veredictos: um anel que
  // não passa nas contas não chega ao dado.
  if (apply && verdict !== 'falha') {
    movedObjects += assignRing(world.scene, measured);
    measured.artworkDeviation = ringDeviation(
      measured.artworks, RING.artworks.radius, measured.artworkPhase, measured.artworks.length);
    measured.portalsDeviation = ringDeviation(
      measured.portals, RING.portals.radius, measured.portalsPhase, measured.portals.length);
    writtenWorlds.push(world);
  }

  if (verdict === 'ok' && tightNote) {
    verdict = 'justo';
    tight.push(`${world.slug}: ${tightNote}`);
  }
  if (verdict === 'falha') failedWorlds++;

  const onRing = (!hasArtworks || measured.onRing(measured.artworkDeviation)) &&
    measured.onRing(measured.portalsDeviation);
  if (onRing) onRingCount++;

  console.log(
    pad(world.slug, 11) +
    pad(measured.artworks.length, 7, true) +
    pad(measured.portals.length, 8, true) +
    pad(hasArtworks ? degrees(measured.clearance) : '—', 9, true) +
    pad(hasArtworks ? degrees(measured.needed) : '—', 9, true) +
    '  ' + pad(verdict, 6) +
    (onRing ? 'em anel' : 'fora')
  );

  if (showPositions) {
    if (hasArtworks) {
      console.log(`            obras: fase ${degrees(measured.artworkPhase)} · ` +
        `cordas de ${decimal(measured.artworksChord)} m`);
      for (const spot of measured.artworksRing) {
        console.log(`              θ ${pad(degrees(spot.angle), 8, true)}  ${place(spot.position, spot.rotation)}`);
      }
    }
    console.log(`            portas: fase ${degrees(measured.portalsPhase)} · ` +
      `cordas de ${decimal(measured.portalsChord)} m`);
    for (const spot of measured.portalsRing) {
      console.log(`              θ ${pad(degrees(spot.angle), 8, true)}  ${place(spot.position, spot.rotation)}`);
    }
    console.log('');
  }
}

// A escrita, com o fim de linha de cada ficheiro: o diff passa a ser só o que mudou.
if (apply && writtenWorlds.length > 0) {
  for (const world of writtenWorlds) {
    const text = JSON.stringify(world.scene, null, 2).replace(/\n/g, world.eol) + world.eol;
    writeFileSync(join(directory, world.file), text, 'utf8');
  }
}

// As combinações que uma sala pode ter depois do grafo da D77 — 3 a 7 obras e 3 a 5 portas — medidas
// uma a uma. É esta tabela que prova que o raio de `RING.artworks.radius` serve para todas, e não só
// para as salas de hoje: a folga de cada par é a maior que existe (é o que o `bestPhase` procura) e o
// teto é o que ela poderia ser — se a busca ficasse abaixo dele, era a busca que estava errada, não a
// geometria. (Na D93 o raio subiu de 40 para 60 m por causa da única combinação que a tabela não tem:
// 7 obras × 6 portas, que a sala 1 pediu ao receber a porta do portão da sala 12.)
console.log('');
console.log(`as combinações de uma sala (painel de 4 m, margem de ${decimal(RING.occlusionMargin)}°):`);
console.log(
  pad('obras', 7, true) + pad('portas', 8, true) + pad('folga', 9, true) +
  pad('teto', 9, true) + pad('precisa', 9, true) + '  veredicto'
);
const combinationsNeeded = requiredClearance(4, RING.artworks.radius);
const belowCeiling = [];
for (let artworks = 3; artworks <= 7; artworks++) {
  const phase = gapPhase(artworks);
  const angles = ringPositions(artworks, RING.artworks.radius, phase, RING.artworks.height)
    .map((spot) => spot.angle);
  for (let portals = 3; portals <= 5; portals++) {
    const doors = bestPhase(portals, angles);
    const ceiling = clearanceCeiling(artworks, portals);
    const margin = doors.clearance - combinationsNeeded;
    const verdict = margin < 0
      ? `falha (faltam ${degrees(-margin)})`
      : (margin < 1 ? `justo (margem ${degrees(margin)})` : `ok (margem ${degrees(margin)})`);
    if (ceiling - doors.clearance > 0.051) {
      belowCeiling.push(`${artworks} obras × ${portals} portas: ${degrees(doors.clearance)} ` +
        `para um teto de ${degrees(ceiling)}`);
    }
    console.log(
      pad(artworks, 7, true) + pad(portals, 8, true) +
      pad(degrees(doors.clearance), 9, true) +
      pad(degrees(ceiling), 9, true) +
      pad(degrees(combinationsNeeded), 9, true) + '  ' + verdict
    );
  }
}

console.log('');
for (const warning of tight) console.log(`  warning: ${warning}`);
for (const warning of belowCeiling) {
  console.log(`  warning: o bestPhase não chegou ao teto — ${warning}`);
}
for (const failure of failures) console.error(`  error: ${failure}`);

console.log(`${worlds.length} mundo(s) · ${worlds.length - withoutArtworks} com anel de obras · ` +
  `${worlds.length - tight.length - failedWorlds} ok, ${tight.length} justo(s), ${failedWorlds} falha(s)`);
console.log(`o dado: ${onRingCount} de ${worlds.length} em anel ` +
  `(${onRingCount === worlds.length ? 'nada a fazer' : 'o `--aplicar` põe os que faltam; o `--posicoes` mostra o que a regra pede'})`);
if (apply) {
  console.log(`escrito: ${writtenWorlds.length} ficheiro(s) em data/worlds/ · ` +
    `${movedObjects} objeto(s) postos no anel`);
}

if (failures.length > 0) process.exit(1);
