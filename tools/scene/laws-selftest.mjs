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
import { validateScene, unreachableWorlds, missingArrivals } from '../../js/scene/validation.js';
import { checkArranques } from './arranques.mjs';
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
const scene = JSON.parse(readFileSync(join(root, 'data', 'worlds', 'cidade.json'), 'utf8'));

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
  box: [4, 5, 1], window: { kind: 'none' }, action: { kind: 'navigate', target: 'ceu' }
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
    inject: (copy) => { copy.portals[0].arrivalFrom = 'ceu'; copy.portals[0].boxRotation = [0, 90, 0]; }
  },
  {
    law: 'L17',
    what: 'two arrival doors for the same world of origin',
    expect: 'law L17',
    inject: (copy) => { copy.portals[0].arrivalFrom = 'ceu'; copy.portals[1].arrivalFrom = 'ceu'; }
  },
  {
    law: 'L18',
    what: 'a window that shows another world with an action that stays in this one',
    expect: 'law L18',
    inject: (copy) => {
      copy.portals[0].window = { kind: 'preview', asset: 'retrato-praia', radius: 120 };
      copy.portals[0].action = { kind: 'enter-window' };
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
  const ok = found && level;
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
const exhibition = ['gate', 'cidade', 'praia', 'ceu']
  .map((slug) => JSON.parse(readFileSync(join(root, 'data', 'worlds', slug + '.json'), 'utf8')));
const answered = missingArrivals(exhibition);

// The fault is the one the B7 found, put back: the beach's door 5 stripped of `arrivalFrom`, which
// is what left the visitor from the gate landing wherever the camera says (D29).
const withGap = exhibition.map((copy) => JSON.parse(JSON.stringify(copy)));
withGap.find((copy) => copy.world.slug === 'praia').portals
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
check('the address of a room is its own folder (D28)', worldHref('praia', base) === base + 'praia/');
check('a pair that links a dimension to itself is refused',
  validateDoor({ window: { kind: 'dimension-pair', dimensionA: 1, dimensionB: 1 }, action: { kind: 'enter-window' } }).length === 1);
check('a door that is fine has nothing to report',
  validateDoor({ window: { kind: 'dimension-pair', dimensionA: 0, dimensionB: 1 }, action: { kind: 'enter-window' } }).length === 0);
check('a portrait that the visitor would walk into is refused (L18)',
  validateDoor({ window: { kind: 'preview', asset: 'retrato', radius: 100 }, action: { kind: 'enter-window' } }).length === 1);

const tablesPassed = tableChecks.filter((entry) => entry.ok).length;

console.table(rows.map((row) => ({ law: row.law, 'injected fault': row.what, detected: row.ok ? 'yes' : 'NO', message: row.message.slice(0, 96) })));
console.log(`laws and shape: ${detected} of ${cases.length} faults detected`);
console.log(`control (nothing injected): ${control.ok ? 'clean' : 'FAILED'} — ` +
  `${control.errors} errors, ${control.warnings} warnings`);
console.log(`world graph: an unreachable world is ${reachable.length === 1 && reachable[0] === 'orfao' ? 'detected' : 'NOT detected'}`);
const arrivalsAsExpected = arrivals.answered === 0 && arrivals.gaps.length === 1 &&
  arrivals.gaps[0] === 'gate -> praia' && arrivals.doors.length === 1 && arrivals.doors[0] === 1;
console.log(`arrivals (L19): the exhibition answers every door (${arrivals.answered} gaps), and a door ` +
  `with no arrival at the destination is ${arrivalsAsExpected ? 'detected' : 'NOT detected'}` +
  (arrivals.gaps.length ? ` (${arrivals.gaps.join(', ')}, doors ${arrivals.doors.join(', ')})` : ''));

// The arranques (D28): one file per world, and the four the same outside the `<base>` line. Here the
// disk is a map in memory, so a case can lie about it on purpose — which is the only way to know
// that a room with no arranque, or a room whose arranque kept the root's `<base>`, would be caught.
const arranqueFiles = {};
for (const relative of ['index.html', 'cidade/index.html', 'praia/index.html', 'ceu/index.html']) {
  arranqueFiles[relative] = readFileSync(join(root, relative), 'utf8');
}
const arranqueSlugs = ['gate', 'cidade', 'praia', 'ceu'];
const withFiles = (changes) => (relative) => (relative in changes ? changes[relative] : arranqueFiles[relative]);
const arranqueCases = [
  ['the exhibition as it is', withFiles({}), 0],
  ['a room with no arranque at all', withFiles({ 'praia/index.html': null }), 'praia/index.html is not there'],
  ['a room whose arranque kept the root\'s <base>',
    withFiles({ 'praia/index.html': arranqueFiles['index.html'] }), 'needs href="../"'],
  ['a room whose arranque has no <base>',
    withFiles({ 'praia/index.html': arranqueFiles['praia/index.html'].replace(/^.*<base.*$/m, '') }), 'has no <base>'],
  ['an arranque that diverged by one word',
    withFiles({ 'cidade/index.html': arranqueFiles['cidade/index.html'].replace('<title>', '<title> ') }),
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
  !arrivalsAsExpected || arranquesPassed !== arranqueChecks.length || tablesPassed !== tableChecks.length;
if (failed) {
  console.error('the validator did not fail where it should');
  process.exit(1);
}
