#!/usr/bin/env node
// One injected fault per law and per rule of the shape, to prove that the validator fails when it
// should.
//
// Why: an instrument that cannot fail proves nothing. The pose sweep has `fault: 'bar'` and
// `fault: 'stencil'` for exactly this reason (tools/regression/pose-sweep.mjs); here each case
// takes the scene as it is, injects one defect, and checks not only that the report is not ok but
// that the message about that law is the one that came out — a validator that fails for the wrong
// reason is a validator nobody can trust.
//
// The answers the command line gives the validator are stubbed, so a case can lie about the disk
// on purpose: `exists`, `imageSize` and `worldExists`.
//
// Usage: node tools/scene/laws-selftest.mjs

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateScene, unreachableWorlds, missingArrivals, portraitTurns, repeatedDestinations, realityWindows } from '../../js/scene/validation.js';
import { checkArranques } from './arranques.mjs';
import { ringPlanPositions } from '../../js/scene/ring.js';
import {
  WINDOW_KINDS,
  ACTION_KINDS,
  WINDOWS,
  ACTIONS,
  isLegalCombination,
  validateDoor,
  worldHref
} from '../../js/modules/portal-kinds.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
// The world the faults are injected into: the one that carries everything the cases need — the
// assets the rules talk about (the video, a photo, a portrait), two doors, five artworks and the
// dimensions. The scene of the exhibition is no longer one file (D24): it is four worlds and a
// fixture, and any of them can be the subject of a fault.
const scene = JSON.parse(readFileSync(join(root, 'data', 'worlds', 'scene1.json'), 'utf8'));

// What the command line answers by default: the files are where the paths say, and every panorama
// has the standard shape (the shapes themselves are checked by the layout of the disk, in B8).
const options = {
  exists: (assetPath) => existsSync(join(root, assetPath)),
  imageSize: () => ({ width: 2048, height: 1024 })
};

// One door that navigates, for the cases that need one: legal on its own (window `none` with
// action `navigate`).
const navigatingDoor = (overrides) => Object.assign({
  id: 30, ownedBy: 0, position: [0, 0, -400], width: 4, height: 5,
  box: [4, 5, 1], window: { kind: 'none' }, action: { kind: 'navigate', target: 'scene3' }
}, overrides);

// A scene that is the same as the exhibition but with 256 different windows: the stencil has 8
// bits, so the 256th has no value to write (law L5).
function withTooManyWindows(copy) {
  copy.dimensions = [{ id: 0, kind: 'camera' }];
  copy.portals = [];
  for (let i = 1; i <= 256; i++) {
    copy.dimensions.push({ id: i, kind: 'image', asset: 'praia', radius: 500 });
    copy.portals.push({
      id: i - 1, ownedBy: 0, position: [0, 0, -400], width: 4, height: 5, box: [4, 5, 1],
      window: { kind: 'dimension-pair', dimensionA: 0, dimensionB: i },
      action: { kind: 'enter-window' }
    });
  }
  return copy;
}

// A posição de um objeto do anel noutro ângulo, com o mesmo raio: é o que um arrasto faz, e é a
// avaria das leis L22 (o passo) e L23 (a obra no eixo da porta).
const anguloDe = (posicao) => (Math.atan2(posicao[0], -posicao[2]) * 180) / Math.PI;
const comAngulo = (posicao, angulo) => {
  const raio = Math.hypot(posicao[0], posicao[2]);
  const radianos = (angulo * Math.PI) / 180;
  const arredondar = (valor) => Math.round(valor * 100) / 100;
  return [arredondar(raio * Math.sin(radianos)), posicao[1], arredondar(-raio * Math.cos(radianos))];
};

const cases = [
  {
    law: 'the shape',
    what: 'an unknown field',
    expect: 'unknown field',
    inject: (copy) => { copy.dimensions[0].colour = '#ffffff'; }
  },
  {
    law: 'the shape',
    what: 'a required field left out',
    expect: 'cameras.real: required',
    inject: (copy) => { delete copy.cameras.real; }
  },
  {
    law: 'the shape',
    what: 'a version this reader does not know',
    expect: 'this reader reads',
    inject: (copy) => { copy.version = 2; }
  },
  {
    law: 'the shape',
    what: 'a field the kind of the axis does not take',
    expect: 'window.radius: not written when kind is',
    inject: (copy) => { copy.portals[0].window.radius = 10; }
  },
  {
    law: 'L1',
    what: 'a background radius smaller than the scene',
    expect: 'law L1',
    inject: (copy) => { copy.dimensions[0].radius = 10; }
  },
  {
    law: 'L4',
    what: 'a door standing inside another door',
    expect: 'law L4',
    inject: (copy) => { copy.portals[1].position = [...copy.portals[0].position]; }
  },
  {
    law: 'L5',
    what: 'the 256th distinct window',
    expect: 'law L5',
    inject: withTooManyWindows
  },
  {
    law: 'L9',
    what: 'an asset that is not on the disk',
    expect: 'law L9',
    options: { exists: () => false },
    inject: () => {}
  },
  {
    law: 'L10',
    what: 'an asset outside the folders of the D7 rule',
    expect: 'law L10',
    level: 'warning',
    // A pasta errada costuma ser também um ficheiro que não existe (L9, erro), e o caso isola as
    // duas leis: diz ao validador que o ficheiro está lá.
    options: { exists: () => true },
    inject: (copy) => { copy.assets.praia.path = 'assets/images/praia.jpg'; }
  },
  {
    law: 'L11',
    what: 'a door that navigates to a world that does not exist',
    expect: 'law L11',
    options: { worldExists: () => false },
    inject: (copy) => { copy.portals.push(navigatingDoor({})); }
  },
  {
    // A D30 listou quatro valores que validavam e não eram construídos. A Fase 7 construiu-os
    // (B5/B6/B7), e o que resta destes três casos são as leis que o formato sempre teve por trás
    // deles: cada valor continua a ter o que exigir, e é isso que se injecta agora.
    law: 'B7',
    what: 'a text artwork without its text',
    expect: 'needs its text',
    inject: (copy) => {
      copy.artworks[0].kind = 'text';
      delete copy.artworks[0].asset;
    }
  },
  {
    law: 'B6',
    what: 'a link interaction without an address',
    expect: 'interaction "link" needs a url',
    inject: (copy) => {
      copy.artworks[0].interaction = 'link';
      delete copy.artworks[0].url;
    }
  },
  {
    law: 'B5',
    what: 'a flat background without a colour',
    expect: 'without a colour',
    level: 'warning',
    inject: (copy) => {
      const dimension = copy.dimensions[0];
      dimension.kind = 'color';
      dimension.radius = 120;
      delete dimension.asset;
      delete dimension.shaderId;
      delete dimension.fallbackAsset;
      delete dimension.color;
    }
  },
  {
    law: 'B5',
    what: 'a flat background with no radius at all',
    expect: 'a flat background needs a radius',
    inject: (copy) => {
      const dimension = copy.dimensions[0];
      dimension.kind = 'color';
      dimension.color = '#202020';
      delete dimension.asset;
      delete dimension.shaderId;
      delete dimension.fallbackAsset;
      delete dimension.radius;
    }
  },
  {
    law: 'L12',
    what: 'an absolute path in the data',
    expect: 'law L12',
    inject: (copy) => { copy.assets.praia.path = '/srv/zonas/praia.jpg'; }
  },
  {
    law: 'L13',
    what: 'a portrait that is not a picture',
    expect: 'law L13',
    inject: (copy) => {
      copy.portals.push(navigatingDoor({
        window: { kind: 'preview', asset: 'video', radius: 120 }
      }));
    }
  },
  {
    law: 'L14',
    what: 'a panorama that is not 2:1',
    expect: 'law L14',
    options: { imageSize: () => ({ width: 960, height: 240 }) },
    inject: () => {}
  },
  {
    law: 'L15',
    what: 'a declared id inside the reserved band',
    expect: 'law L15',
    inject: (copy) => { copy.dimensions[0].id = 448; }
  },
  {
    law: 'L16',
    what: 'a box the arrival point falls inside',
    expect: 'law L16',
    inject: (copy) => { copy.portals[0].arrivalFrom = 'scene3'; copy.portals[0].boxRotation = [0, 90, 0]; }
  },
  {
    law: 'L17',
    what: 'two arrival doors for the same world of origin',
    expect: 'law L17',
    inject: (copy) => { copy.portals[0].arrivalFrom = 'scene3'; copy.portals[1].arrivalFrom = 'scene3'; }
  },
  {
    law: 'L18',
    what: 'a window that shows another world with an action that stays in this one',
    expect: 'law L18',
    inject: (copy) => {
      copy.portals[0].window = { kind: 'preview', asset: 'retrato-praia', radius: 120 };
      copy.portals[0].action = { kind: 'enter-window' };
    }
  },
  {
    // A exceção da D38: a janela que mostra a câmara pode navegar — mas só para o mundo de entrada,
    // que é o único cujo fundo **é** a câmara. Para uma sala, o que a janela mostra seria outra coisa.
    law: 'D38',
    what: 'a camera window that navigates to a room instead of the entry world',
    expect: 'law L18',
    inject: (copy) => {
      if (!copy.dimensions.some((dimension) => dimension.kind === 'camera')) {
        copy.dimensions.push({ id: 1, kind: 'camera', name: { pt: 'Realidade', en: 'Reality' } });
      }
      const porta = copy.portals[0];
      porta.window = { kind: 'dimension-pair', dimensionA: 0, dimensionB: 1 };
      porta.action = { kind: 'navigate', target: 'scene2' };
      delete porta.arrivalFrom;
    }
  },
  // ---- os dois anéis (D77) ----
  {
    law: 'L22',
    what: 'uma obra ainda no lugar de uma fila',
    expect: 'law L22',
    inject: (copy) => { copy.artworks[0].position = [0, 1.5, -55]; }
  },
  {
    law: 'L22',
    what: 'uma obra virada ao contrário (a frente não olha o centro)',
    expect: 'law L22',
    inject: (copy) => { copy.artworks[1].rotation = [0, 0, 0]; }
  },
  {
    law: 'L22',
    what: 'duas obras vizinhas com outro passo',
    expect: 'equal steps inside a ring',
    inject: (copy) => {
      // O mesmo arrasto da L22, mas com a frente corrigida: a única coisa errada que resta é o passo.
      const angulo = anguloDe(copy.artworks[2].position) + 5;
      copy.artworks[2].position = comAngulo(copy.artworks[2].position, angulo);
      copy.artworks[2].rotation = [0, Math.round(-angulo * 100) / 100, 0];
    }
  },
  {
    law: 'L23',
    what: 'uma obra exactamente no eixo de uma porta',
    expect: 'law L23',
    inject: (copy) => {
      copy.artworks[0].position = comAngulo(copy.artworks[0].position, anguloDe(copy.portals[0].position));
    }
  },
  {
    law: 'L24',
    what: 'uma sala com duas portas',
    expect: 'law L24',
    inject: (copy) => { copy.portals = copy.portals.slice(0, 2); }
  },
  {
    law: 'L24',
    what: 'uma sala com seis portas',
    expect: 'law L24',
    inject: (copy) => { copy.portals.push(navigatingDoor({ id: 90 })); }
  },
  {
    law: 'L24',
    what: 'uma sala sem porta para o portão',
    expect: 'law L24',
    inject: (copy) => {
      const porta = copy.portals.find((portal) => portal.action && portal.action.target === 'gate');
      if (porta) porta.action.target = 'scene3';
    }
  },
  {
    // L29 (D87): a porta que oscila e passa a maior parte do ciclo fora do alcance do visitante. A
    // avaria é o que a sala de ensaio tinha antes de ser corrigida — translação em X com rotação em X
    // a 90°, que dá 20,0% do ciclo. É a lei que faz o sorteio recusar um em cada três.
    law: 'L29',
    what: 'uma porta a oscilar em X e a rodar em X a 90°',
    expect: 'law L29',
    inject: (copy) => {
      const porta = copy.portals[0];
      porta.motion = {
        kind: 'sway', axis: [1, 0, 0], amplitude: 5, period: 15,
        rotationAxis: [1, 0, 0], angle: 90, rotationPeriod: 15
      };
    }
  },
  {
    // A outra face da L29: um sorteio que passa. Sem este caso, uma lei que recusasse **tudo** também
    // passaria o teste de cima — e é a diagonal do controlo que a distingue.
    law: 'L29',
    what: 'uma porta a oscilar em Y e a rodar em Y a 45° (o sorteio que passa)',
    expect: 'law L29',
    expectNone: true,
    inject: (copy) => {
      const porta = copy.portals[0];
      porta.motion = {
        kind: 'sway', axis: [0, 1, 0], amplitude: 6, period: 15,
        rotationAxis: [0, 1, 0], angle: 45, rotationPeriod: 15
      };
    }
  },
  {
    // L30 (D9): a sala de ensaio não se usa. A avaria aponta uma porta da sala 1 à `scene100` — que
    // existe em disco, por isso a L11 não tem nada a dizer; o que está errado é a exposição a entrar
    // num mundo de ensaio. A porta que muda de destino não é a do portão, para a L24 ficar de fora.
    law: 'L30',
    what: 'uma porta que navega para a sala de ensaio (scene100)',
    expect: 'law L30',
    inject: (copy) => {
      const porta = copy.portals.find((portal) => (portal.action || {}).target &&
        portal.action.target !== 'gate');
      porta.action.target = 'scene100';
    }
  },
  {
    // A outra metade da L30: ninguém chega de um mundo de ensaio. A avaria dá à porta do portão a
    // chegada da sala de ensaio — continua a ser uma origem só, para a L17 ficar de fora.
    law: 'L30',
    what: 'uma porta que se declara chegada da sala de ensaio',
    expect: 'law L30',
    inject: (copy) => {
      copy.portals[0].arrivalFrom = 'scene100';
    }
  },
  {
    // L31 (D97): acima de vinte portas, um anel só é uma vedação. A avaria põe vinte e sete portas
    // todas a 90 m, que é exactamente o portão com a exposição inteira. A L24 também vai disparar — e
    // é honesto que dispare, porque a sala deixou de ser uma sala.
    law: 'L31',
    what: 'vinte e sete portas todas no mesmo anel',
    expect: 'law L31',
    inject: (copy) => {
      copy.portals = [];
      for (let i = 0; i < 27; i++) {
        const radianos = ((i * 360) / 27) * Math.PI / 180;
        copy.portals.push(navigatingDoor({
          id: i,
          position: [Math.round(90 * Math.sin(radianos) * 100) / 100, 0,
            Math.round(-90 * Math.cos(radianos) * 100) / 100]
        }));
      }
    }
  },
  {
    // O controlo da L31: as mesmas vinte e sete portas, nos três anéis de nove que o plano dá. Sem este
    // caso, uma lei que recusasse **tudo** passaria o de cima — foi assim que se descobriu que dois
    // anéis não servem para 27 (m.m.c. de 12 e 15 é 60).
    law: 'L31',
    what: 'vinte e sete portas nos três anéis de nove (o plano que passa)',
    expect: 'law L31',
    expectNone: true,
    inject: (copy) => {
      // O portão é que cresce (uma porta por sala, L24) — por isso é ele que se injeta, senão a L24
      // dispararia pelos vinte e sete portas e o controlo não provava nada sobre a L31.
      copy.world = { slug: 'gate', name: { pt: 'Portão', en: 'Gate' } };
      copy.artworks = [];
      copy.portals = [];
      for (const lugar of ringPlanPositions(27, 0)) {
        copy.portals.push(navigatingDoor({ id: lugar.index, position: lugar.position }));
      }
    }
  }
];

let detected = 0;
const rows = [];

for (const testCase of cases) {
  const copy = JSON.parse(JSON.stringify(scene));
  testCase.inject(copy);

  const report = validateScene(copy, Object.assign({}, options, testCase.options));
  const messages = report.errors.concat(report.warnings);
  const found = messages.some((message) => message.includes(testCase.expect));
  const level = testCase.level === 'warning' ? report.ok : !report.ok;
  // Um caso `expectNone` é o controlo da própria lei: a mesma injecção que a deve deixar passar. Sem
  // ele, uma lei que recusasse tudo passava os outros casos e ninguém dava por isso.
  const ok = testCase.expectNone ? !found && report.ok : found && level;
  if (ok) detected++;

  rows.push({
    law: testCase.law,
    what: testCase.what,
    ok,
    message: (messages.find((message) => message.includes(testCase.expect)) || report.errors[0] ||
      report.warnings[0] || 'nothing was reported')
  });
}

// The control: with nothing injected, the validator has to say nothing.
const clean = validateScene(JSON.parse(JSON.stringify(scene)), options);
const control = { errors: clean.errors.length, warnings: clean.warnings.length, ok: clean.ok };

// And the graph: a world nobody can reach is a world nobody visits. The entry is the world the
// cases are injected into (a world reaches itself) and the orphan is the one nobody points at.
const orphan = JSON.parse(JSON.stringify(scene));
orphan.world = { slug: 'orfao', name: { pt: 'Órfão', en: 'Orphan' } };
const reachable = unreachableWorlds([scene, orphan], scene.world.slug);

// And the arrivals (law L19): a door to a world that says nothing about where the visitor comes from
// lands them wherever the camera says. The exhibition answers every one of its doors — the beach did
// not, until the B7 walked it and the D29 fixed it — so the case is made both ways: the whole
// exhibition, and a world the doors point at with every `arrivalFrom` stripped.
const exhibition = ['gate', 'scene1', 'scene2', 'scene3']
  .map((slug) => JSON.parse(readFileSync(join(root, 'data', 'worlds', slug + '.json'), 'utf8')));
const answered = missingArrivals(exhibition);

// The fault is the one the B7 found, put back: the beach's door 5 stripped of `arrivalFrom`, which
// is what left the visitor from the gate landing wherever the camera says (D29).
const withGap = exhibition.map((copy) => JSON.parse(JSON.stringify(copy)));
withGap.find((copy) => copy.world.slug === 'scene2').portals
  .forEach((portal) => { if (portal.id === 5) delete portal.arrivalFrom; });
const gaps = missingArrivals(withGap);
const arrivals = {
  answered: answered.length,
  gaps: gaps.map((gap) => `${gap.from} -> ${gap.to}`),
  doors: gaps.length === 1 ? gaps[0].portals : []
};

// The tables of the two axes (section 5.4): what each kind means, which combinations are legal and
// where the address of a world lives. Pure, so it is checked here and not in the browser.
const legalCombinations = [
  ['dimension-pair', 'enter-window'],
  ['dimension-pair', 'none'],
  ['preview', 'navigate'],
  ['preview', 'none'],
  ['none', 'navigate']
];
const tableChecks = [];
const check = (what, ok) => tableChecks.push({ what, ok });

for (const kind of WINDOW_KINDS) {
  check(`the window kind "${kind}" has an entry in the table`,
    !!WINDOWS[kind] && typeof WINDOWS[kind].shows === 'string');
}
for (const kind of ACTION_KINDS) {
  const entry = ACTIONS[kind];
  check(`the action kind "${kind}" says whether it enters and whether it navigates`,
    !!entry && typeof entry.enters === 'boolean' && typeof entry.navigates === 'boolean');
}
for (const windowKind of WINDOW_KINDS) {
  for (const actionKind of ACTION_KINDS) {
    const expected = legalCombinations.some((pair) => pair[0] === windowKind && pair[1] === actionKind);
    check(`${windowKind} + ${actionKind} is ${expected ? 'legal' : 'illegal'}`,
      isLegalCombination(windowKind, actionKind) === expected);
  }
}
const base = 'http://example.test/zonas12/';
check('the address of the gate is the root of the deployment (D24)', worldHref('gate', base) === base);
check('the address of a room is its own folder (D28)', worldHref('scene2', base) === base + 'scene2/');
check('a pair that links a dimension to itself is refused',
  validateDoor({ window: { kind: 'dimension-pair', dimensionA: 1, dimensionB: 1 }, action: { kind: 'enter-window' } }).length === 1);
check('a door that is fine has nothing to report',
  validateDoor({ window: { kind: 'dimension-pair', dimensionA: 0, dimensionB: 1 }, action: { kind: 'enter-window' } }).length === 0);
check('a portrait that the visitor would walk into is refused (L18)',
  validateDoor({ window: { kind: 'preview', asset: 'retrato', radius: 100 }, action: { kind: 'enter-window' } }).length === 1);

const tablesPassed = tableChecks.filter((entry) => entry.ok).length;

// L25 (D77): duas salas não podem ter o mesmo conjunto de destinos. A exposição tem um conjunto
// diferente em cada sala; a avaria dá à sala 3 os destinos da sala 2 — o mesmo corredor em duas
// salas, que é o que a regra proíbe.
const sameSet = exhibition.map((copy) => JSON.parse(JSON.stringify(copy)));
const destinationsOfTwo = sameSet.find((copy) => copy.world.slug === 'scene2').portals
  .map((portal) => portal.action && portal.action.target)
  .filter((target) => target && target !== 'gate');
sameSet.find((copy) => copy.world.slug === 'scene3').portals
  .filter((portal) => portal.action && portal.action.target !== 'gate')
  .forEach((portal, index) => { portal.action.target = destinationsOfTwo[index % destinationsOfTwo.length]; });
const repeatedClean = repeatedDestinations(exhibition, 'gate');
const repeatedFault = repeatedDestinations(sameSet, 'gate');
const repeatedAsExpected = repeatedClean.length === 0 && repeatedFault.length === 1 &&
  repeatedFault[0].worlds.length === 2 &&
  repeatedFault[0].worlds.indexOf('scene2') !== -1 && repeatedFault[0].worlds.indexOf('scene3') !== -1;

// L26 (D78): o giro do retrato. A exposição está com o giro que a conta dá (`azimuths.mjs`); a avaria
// põe a porta 3 da sala 1 sem giro, que é o estado de onde se veio — o que se vê pela janela está
// girado em relação ao que se vê ao chegar. Nas doze páginas a porta 38 da sala 10 media 27,79 de
// salto no corte, com a meta em 0,50.
const turnClean = portraitTurns(exhibition);
const noTurn = exhibition.map((copy) => JSON.parse(JSON.stringify(copy)));
const sala1 = noTurn.find((copy) => copy.world.slug === 'scene1');
const vitima = sala1.portals.find((portal) => (portal.window || {}).azimuth !== undefined);
delete vitima.window.azimuth;
const turnFault = portraitTurns(noTurn);
const turnsAsExpected = turnClean.length === 0 && turnFault.length === 1 &&
  turnFault[0].from === 'scene1' && turnFault[0].door === vitima.id && turnFault[0].found === null;

// L26, o caso que faltava (D89): uma porta de uma sala com `carryOrigin: false` não tem porta de
// chegada no destino, e o segundo termo da conta é o azimute de uma **primeira visita** (0: a câmara do
// jogador nasce a olhar para −Z). A sala de ensaio tem três dessas portas; a avaria roda uma delas 30°.
const primeiraVisita = ['scene100', 'scene3', 'scene6', 'scene9']
  .map((slug) => JSON.parse(readFileSync(join(root, 'data', 'worlds', slug + '.json'), 'utf8')));
const turnsFirstClean = portraitTurns(primeiraVisita);
const turnsFirstFaultLista = primeiraVisita.map((copy) => JSON.parse(JSON.stringify(copy)));
const portaDaSala100 = turnsFirstFaultLista
  .find((copy) => copy.world.slug === 'scene100').portals
  .find((portal) => (portal.window || {}).kind === 'preview');
portaDaSala100.window.azimuth = (portaDaSala100.window.azimuth || 0) + 30;
const turnsFirstFault = portraitTurns(turnsFirstFaultLista);
const turnsFirstAsExpected = turnsFirstClean.length === 0 && turnsFirstFault.length === 1 &&
  turnsFirstFault[0].from === 'scene100' && turnsFirstFault[0].door === portaDaSala100.id &&
  turnsFirstFault[0].firstVisit === true;

// L28 (D81): os buracos do mundo real na janela. A exposição está com os buracos que a conta dá
// (`reality.mjs --aplicar`); a avaria tira-os da porta 3 da sala 1, que é o estado de onde se veio —
// pela janela via-se o fundo do destino onde ao chegar se vê a câmara. Medido na porta 7 da sala 3,
// 0,72 de salto no corte (1,70 na porta 9 da sala 4), com a meta em 0,50.
const holesClean = realityWindows(exhibition);
const noHoles = exhibition.map((copy) => JSON.parse(JSON.stringify(copy)));
const salaDasJanelas = noHoles.find((copy) => copy.world.slug === 'scene1');
const comBuracos = salaDasJanelas.portals.find((portal) => Array.isArray((portal.window || {}).reality) &&
  portal.window.reality.length > 0);
delete comBuracos.window.reality;
const holesFault = realityWindows(noHoles);
const holesAsExpected = holesClean.length === 0 && holesFault.length === 1 &&
  holesFault[0].from === 'scene1' && holesFault[0].door === comBuracos.id &&
  holesFault[0].expected.length === 1;

// L28, o caso da D89: as portas da sala de ensaio não têm porta de chegada, mas têm janela — e a conta
// dos buracos faz-se na mesma. Ali o destino não mostra a câmara, por isso o esperado é **nenhum
// buraco**; a avaria inventa um, que é o que a lei tem de apanhar (um buraco no sítio errado mostra o
// fundo do destino onde o visitante devia ver a câmara).
const holesFirstClean = realityWindows(primeiraVisita);
const withFakeHole = primeiraVisita.map((copy) => JSON.parse(JSON.stringify(copy)));
const portaComBuraco = withFakeHole.find((copy) => copy.world.slug === 'scene100').portals
  .find((portal) => (portal.window || {}).kind === 'preview');
portaComBuraco.window.reality = [{ az0: -10, el0: -5, az1: 10, el1: 5 }];
const holesFirstFault = realityWindows(withFakeHole);
const holesFirstAsExpected = holesFirstClean.length === 0 && holesFirstFault.length === 1 &&
  holesFirstFault[0].from === 'scene100' && holesFirstFault[0].door === portaComBuraco.id &&
  holesFirstFault[0].expected.length === 0;

console.table(rows.map((row) => ({ law: row.law, 'injected fault': row.what, detected: row.ok ? 'yes' : 'NO', message: row.message.slice(0, 96) })));
console.log(`laws and shape: ${detected} of ${cases.length} faults detected`);
console.log(`control (nothing injected): ${control.ok ? 'clean' : 'FAILED'} — ` +
  `${control.errors} errors, ${control.warnings} warnings`);
console.log(`world graph: an unreachable world is ${reachable.length === 1 && reachable[0] === 'orfao' ? 'detected' : 'NOT detected'}`);
const arrivalsAsExpected = arrivals.answered === 0 && arrivals.gaps.length === 1 &&
  arrivals.gaps[0] === 'gate -> scene2' && arrivals.doors.length === 1 && arrivals.doors[0] === 1;
console.log(`arrivals (L19): the exhibition answers every door (${arrivals.answered} gaps), and a door ` +
  `with no arrival at the destination is ${arrivalsAsExpected ? 'detected' : 'NOT detected'}` +
  (arrivals.gaps.length ? ` (${arrivals.gaps.join(', ')}, doors ${arrivals.doors.join(', ')})` : ''));
console.log(`destinations (L25): the exhibition has a set of its own in every room ` +
  `(${repeatedClean.length} repeated), and two rooms pointing at the same ones is ` +
  `${repeatedAsExpected ? 'detected' : 'NOT detected'}`);
console.log(`portrait turns (L26): the exhibition is turned to the arrival ` +
  `(${turnClean.length} wrong), and a window with no turn is ` +
  `${turnsAsExpected ? 'detected' : 'NOT detected'}` +
  (turnFault.length ? ` (${turnFault.map((each) => each.from + ' ' + each.door + ' asks ' + each.expected + '°').join(', ')})` : ''));
console.log(`portrait turns (L26), uma porta sem chegada (D89): a sala de ensaio está com o giro da ` +
  `primeira visita (${turnsFirstClean.length} wrong), e uma porta rodada 30° é ` +
  `${turnsFirstAsExpected ? 'detected' : 'NOT detected'}` +
  (turnsFirstFault.length ? ` (${turnsFirstFault.map((each) => each.from + ' ' + each.door +
    ' asks ' + each.expected + '°').join(', ')})` : ''));
console.log(`reality holes (L28): the exhibition leaves the real world where the destination shows it ` +
  `(${holesClean.length} wrong), and a window with no holes is ` +
  `${holesAsExpected ? 'detected' : 'NOT detected'}` +
  (holesFault.length ? ` (${holesFault.map((each) => each.from + ' ' + each.door + ' asks ' +
  JSON.stringify(each.expected)).join(', ')})` : ''));

console.log(`reality holes (L28), uma porta sem chegada (D89): a sala de ensaio não tem buracos a pedir ` +
  `(${holesFirstClean.length} wrong), e um buraco inventado é ` +
  `${holesFirstAsExpected ? 'detected' : 'NOT detected'}` +
  (holesFirstFault.length ? ` (${holesFirstFault.map((each) => each.from + ' ' + each.door +
    ' esperava ' + JSON.stringify(each.expected)).join(', ')})` : ''));

// The arranques (D28): one file per world, and the four the same outside the `<base>` line. Here the
// disk is a map in memory, so a case can lie about it on purpose — which is the only way to know
// that a room with no arranque, or a room whose arranque kept the root's `<base>`, would be caught.
const arranqueFiles = {};
for (const relative of ['index.html', 'scene1/index.html', 'scene2/index.html', 'scene3/index.html']) {
  arranqueFiles[relative] = readFileSync(join(root, relative), 'utf8');
}
const arranqueSlugs = ['gate', 'scene1', 'scene2', 'scene3'];
const withFiles = (changes) => (relative) => (relative in changes ? changes[relative] : arranqueFiles[relative]);
const arranqueCases = [
  ['the exhibition as it is', withFiles({}), 0],
  ['a room with no arranque at all', withFiles({ 'scene2/index.html': null }), 'scene2/index.html is not there'],
  ['a room whose arranque kept the root\'s <base>',
    withFiles({ 'scene2/index.html': arranqueFiles['index.html'] }), 'needs href="../"'],
  ['a room whose arranque has no <base>',
    withFiles({ 'scene2/index.html': arranqueFiles['scene2/index.html'].replace(/^.*<base.*$/m, '') }), 'has no <base>'],
  ['an arranque that diverged by one word',
    withFiles({ 'scene1/index.html': arranqueFiles['scene1/index.html'].replace('</title>', ' x</title>') }),
    'is not the same file as index.html']
];
const arranqueChecks = arranqueCases.map(([what, read, expected]) => {
  const report = checkArranques(arranqueSlugs, { entry: 'gate', read: read });
  const message = report.errors[0] || '';
  const ok = expected === 0
    ? report.errors.length === 0 && report.checked.length === 4
    : report.errors.length === 1 && message.includes(expected);
  return { what: what, ok: ok, message: message || 'nothing was reported' };
});
const arranquesPassed = arranqueChecks.filter((entry) => entry.ok).length;
console.log(`arranques (D28): ${arranquesPassed} of ${arranqueChecks.length} cases behave as they should`);
for (const entry of arranqueChecks.filter((entry) => !entry.ok)) {
  console.error(`  failed: ${entry.what} — ${entry.message}`);
}
console.log(`tables of the two axes: ${tablesPassed} of ${tableChecks.length} checks pass`);
for (const entry of tableChecks.filter((entry) => !entry.ok)) console.error(`  failed: ${entry.what}`);

const failed = detected !== cases.length || !control.ok || reachable.length !== 1 ||
  !arrivalsAsExpected || !repeatedAsExpected || arranquesPassed !== arranqueChecks.length ||
  tablesPassed !== tableChecks.length;
if (failed) {
  console.error('the validator did not fail where it should');
  process.exit(1);
}
