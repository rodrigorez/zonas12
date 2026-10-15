#!/usr/bin/env node
// Fase 3B, block B2 (docs/ROADMAP.md, section 9): migrates the scene files from format 2 to format
// 3 — one file per world, and the portal with two independent axes (decisions D24 and D25).
//
// What changes, and what does not:
//   version 2 -> 3                        a reader refuses a version it does not know (D23);
//   + `world { slug, name }`              the file now describes a world of its own;
//   `dimensionA`/`dimensionB`             they move inside the axis that shows them:
//     -> `window { kind: "dimension-pair", … }`
//   + `action { kind: "enter-window" }`   the second axis, with the behaviour of today;
//   everything else                       copied as it was, value by value.
//
// Why a script and not an edit by hand: the move touches 8 portals and the pair of each, and doing
// it by hand invites a swapped `A`/`B`. The script does it once and compares what it wrote with
// what it read, value by value — the same proof the migration of Fase 0 used (0 differences).
//
// Reads:  data/scene.json and data/scene-example.json, in format 2
// Writes: the same two files, in format 3 (two-space JSON, the formatting that was there)
// Usage:  node tools/migration/scene-v3.mjs [--check]
//         --check  does the comparison and writes nothing
//
// After this migration the files are the record of it: the tool refuses to run on a file that is
// not format 2 — the same guard the HTML converter (convert.mjs) has since Fase 3.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENE_VERSION } from '../../js/scene/schema.js';
import { validateScene } from '../../js/scene/validation.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const FILES = ['data/scene.json', 'data/scene-example.json'];

// The world the scene becomes in this migration. Fase 3B splits the exhibition into four worlds
// and this is the first of them — the gate —, which is where the four dimensions of the scene
// live until that split happens (block B6). It is authored content, like the names the converter
// of Fase 0 had to write by hand.
const WORLD = { slug: 'gate', name: { pt: 'Portão', en: 'Gate' } };

// The fields of a door that move into the first axis, written as a table so the migration and the
// comparison below read the same one: a field that is not here is copied as it was.
const TO_WINDOW = ['dimensionA', 'dimensionB'];

const TOP_LEVEL = ['version', 'world', 'cameras', 'assets', 'dimensions', 'artworks', 'portals'];

function toV3(scene) {
  const out = { version: SCENE_VERSION, world: { slug: WORLD.slug, name: { ...WORLD.name } } };
  for (const key of ['cameras', 'assets', 'dimensions', 'artworks']) {
    if (scene[key] !== undefined) out[key] = scene[key];
  }
  out.portals = (scene.portals || []).map((portal) => {
    const door = {};
    for (const [name, value] of Object.entries(portal)) {
      if (!TO_WINDOW.includes(name)) door[name] = value;
    }
    door.window = { kind: 'dimension-pair' };
    TO_WINDOW.forEach((name) => { door.window[name] = portal[name]; });
    door.action = { kind: 'enter-window' };
    return door;
  });
  return out;
}

// What was read against what was written: every value of the file that was read has to be in the
// file that was written, and nothing may appear that was not there — apart from the world block,
// the two axes and the version.
function compare(before, after) {
  let compared = 0;
  let moved = 0;
  const differences = [];

  const same = (what, a, b) => {
    compared++;
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      differences.push(`${what}: ${JSON.stringify(a)} -> ${JSON.stringify(b)}`);
    }
  };
  const movedValue = (what, from, to) => {
    moved++;
    same(what, from, to);
  };

  if (before.version !== 2) differences.push(`version: the file declares ${JSON.stringify(before.version)}`);
  same('version written', after.version, SCENE_VERSION);
  for (const key of ['cameras', 'assets', 'dimensions', 'artworks']) {
    same(key, before[key], after[key]);
  }

  const beforePortals = before.portals || [];
  const afterPortals = after.portals || [];
  same('portals: how many', beforePortals.length, afterPortals.length);
  beforePortals.forEach((portal, index) => {
    const door = afterPortals[index];
    same(`portals[${index}].id`, portal.id, door.id);
    TO_WINDOW.forEach((name) => movedValue(`portals[${index}].window.${name}`, portal[name], door.window[name]));
    same(`portals[${index}].window.kind`, door.window.kind, 'dimension-pair');
    same(`portals[${index}].action.kind`, door.action.kind, 'enter-window');
    for (const [name, value] of Object.entries(portal)) {
      if (TO_WINDOW.includes(name)) continue;
      same(`portals[${index}].${name}`, value, door[name]);
    }
    // Nothing else may appear in the door: the axes are the only new fields.
    const extra = Object.keys(door).filter((name) => !(name in portal) && name !== 'window' && name !== 'action');
    same(`portals[${index}]: no extra field`, extra, []);
  });

  same('no unknown top-level field', Object.keys(after).filter((key) => !TOP_LEVEL.includes(key)), []);
  return { compared, moved, differences };
}

const checkOnly = process.argv.includes('--check');
let failed = 0;

for (const file of FILES) {
  const path = resolve(root, file);
  const before = JSON.parse(readFileSync(path, 'utf8'));

  if (before.version !== 2) {
    console.error(`${file}: declares version ${JSON.stringify(before.version)} and this migration reads version 2.`);
    console.error('  The file this migration wrote is in git; from here on the scene is edited in the new format.');
    failed++;
    continue;
  }

  const after = toV3(before);
  const report = compare(before, after);
  const validation = validateScene(after);
  const ok = report.differences.length === 0 && validation.ok;

  console.log(`${file}: ${ok ? 'OK' : 'FAILED'} — ${report.moved} values into an axis, ` +
    `${report.compared} compared, ${report.differences.length} differences`);
  report.differences.forEach((difference) => console.error(`  difference: ${difference}`));
  validation.errors.forEach((error) => console.error(`  error: ${error}`));
  validation.warnings.forEach((warning) => console.log(`  warning: ${warning}`));

  if (!ok) {
    failed++;
    continue;
  }
  if (!checkOnly) writeFileSync(path, JSON.stringify(after, null, 2) + '\n', 'utf8');
}

if (failed) {
  console.error(`${failed} file(s) failed`);
  process.exit(1);
}
if (checkOnly) console.log('--check: nothing was written');
