#!/usr/bin/env node
// Fase 3B, block B6 (docs/ROADMAP.md section 9): splits the single scene — four dimensions in one
// file, the house of Fase 3 — into the four worlds decided in D24, plus the fixture of two
// dimensions that keeps the live window exercised (T1–T9).
//
// What changes, and why it is a change of meaning and not of format:
//   one file, four dimensions   ->  one file per world, each dimension renumbered from 0;
//   a portal between two        ->  a world door: `window: preview` (the portrait of the
//   dimensions of this world        destination) and `action: navigate`;
//   crossing changes the        ->  crossing leaves the page (D14), and the visitor appears behind
//   active dimension                the door of the destination that is marked `arrivalFrom`.
//
// The graph of the doors does not change: it is the same eight doors, in the same places, each one
// now pointing at a world instead of at a dimension of the same file. What changes is the reach:
// the rooms stop being dimensions of one world and become worlds, and the only way between them is
// a door that navigates.
//
// There is no "0 differences" proof here, and there cannot be: the format migration (scene-v3.mjs)
// changes how the same values are written, and this one changes what the scene *does*. What it gives
// instead is the correspondence table it prints — portal by portal, dimension by dimension, artwork
// by artwork — and the tests (T10, T11, §10).
//
// Reads:  data/scene.json (the single world of format 3)
// Writes: data/worlds/{gate,scene1,scene2,scene3,example}.json
// Usage:  node tools/migration/worlds.mjs [--check]
//
// As salas passaram a chamar-se `scene1`, `scene2` e `scene3` na Fase 7 (a cidade, a praia e o céu,
// pela ordem da visita): o nome de conteúdo mantém-se, o endereço é que mudou.
//
// After the migration the file it read stops existing: the worlds are the scene from here on, and
// the tool refuses to run twice (there is no data/scene.json any more).

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateScene, summarise } from '../../js/scene/validation.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

// The radius of a portrait (D14): the sphere does not follow the camera, and its radius has to be
// bigger than about three times the distance from the visitor to the door — otherwise the surface
// of the sphere falls in front of the plane of the door and the parallax inverts.
const PORTRAIT_RADIUS = 120;

// Which world each dimension of the single scene becomes (D24), and the name of each world in each
// language (content, written here because this script is the record of the migration).
const WORLDS = [
  { slug: 'gate', from: [0], name: { pt: 'Portão', en: 'Gate' } },
  { slug: 'scene1', from: [1], name: { pt: 'Cidade 360º', en: 'City 360º' } },
  { slug: 'scene2', from: [2], name: { pt: 'Praia', en: 'Beach' } },
  { slug: 'scene3', from: [3], name: { pt: 'Céu 360º', en: 'Sky 360º' } }
];

// Which door of the destination world the visitor appears behind, per world of origin (law L17: one
// per origin). The doors are the old portals, by id.
const ARRIVAL = {
  gate: { scene1: 0, scene2: 1 },
  scene1: { gate: 2, scene2: 3 },
  scene2: { gate: 5, scene1: 4, scene3: 6 },
  scene3: { scene2: 7 }
};

// One portal of the single scene pointed where the pair said, and nothing checked the door was a
// good one. Portals 4 and 5 stood side by side in the beach and were the same door twice, both
// opening onto the city; with one world per dimension that duplication turned into a missing way
// out — the beach had no door back to the gate, and no door of it could say it was the arrival from
// there (the visitor landed at whatever the camera said, and the runtime warned). Decision of
// 2026-10-16 (§9, D29): the left door leads back to the gate, with `window: none` like the city's,
// because there is still no picture of the gate. This table is the whole of the change.
const RETARGET = { 5: 'gate' };

// The portrait each door shows, by world of destination. The gate has none: the reality of the
// gate is the camera, and there is no picture of it — a borrowed portrait would lie to the visitor
// about where the door leads, so that door is left with `window: none` (a legal combination) until
// the author has an image (decision of 2026-10-15, §9).
const PORTRAIT = {
  scene1: 'retrato-cidade',
  scene2: 'retrato-praia',
  scene3: 'retrato-ceu'
};

const worldOfDimension = (id) => {
  const world = WORLDS.find((candidate) => candidate.from.includes(id));
  return world ? world.slug : null;
};

const round = (value) => (typeof value === 'number' ? Math.round(value * 1000) / 1000 : value);

function readSingleScene() {
  const file = join(root, 'data', 'scene.json');
  if (!existsSync(file)) {
    console.error('worlds.mjs: data/scene.json is not there. This migration reads the single world of');
    console.error('  format 3 and writes the four of D24; from here on the worlds are the scene.');
    process.exit(1);
  }
  return JSON.parse(readFileSync(file, 'utf8'));
}

// One door of a world, from one portal of the single scene. The destination is the dimension of the
// pair that is not the one the door stands in (the pair lives inside the window axis since D25).
function worldDoor(portal, hereSlug, scene) {
  const pair = portal.window || {};
  const there = RETARGET[portal.id] ||
    worldOfDimension(pair.dimensionA === portal.ownedBy ? pair.dimensionB : pair.dimensionA);
  const portrait = PORTRAIT[there];
  const door = {
    id: portal.id,
    ownedBy: 0,
    position: portal.position.map(round),
    width: portal.width,
    height: portal.height,
    box: portal.box.map(round),
    boxPosition: (portal.boxPosition || [0, 8, 0]).map(round),
    boxRotation: (portal.boxRotation || [0, 0, 0]).map(round),
    trigger: portal.trigger,
    frame: { ...portal.frame },
    window: portrait
      ? { kind: 'preview', asset: portrait, radius: PORTRAIT_RADIUS }
      : { kind: 'none' },
    action: { kind: 'navigate', target: there }
  };
  if (portal.rotation && portal.rotation.some((part) => part !== 0)) door.rotation = portal.rotation.map(round);
  if (ARRIVAL[hereSlug] && ARRIVAL[hereSlug][there] === portal.id) door.arrivalFrom = there;
  return door;
}

// The assets a world needs: the ones its dimension and its artworks name, plus the portraits of its
// doors. A world loads nothing of the others (D14: the file of the destination is never read).
function assetsFor(scene, dimensionIds, artworks, doors) {
  const used = new Set();
  for (const dimension of scene.dimensions) {
    if (dimensionIds.includes(dimension.id) && dimension.asset) used.add(dimension.asset);
  }
  for (const artwork of artworks) used.add(artwork.asset);
  for (const door of doors) {
    if (door.window.asset) used.add(door.window.asset);
  }
  const catalogue = {};
  for (const id of used) catalogue[id] = scene.assets[id];
  return catalogue;
}

function buildWorlds(scene) {
  const worlds = [];

  for (const world of WORLDS) {
    const dimensions = scene.dimensions
      .filter((dimension) => world.from.includes(dimension.id))
      .map((dimension) => {
        const copy = { id: 0, kind: dimension.kind };
        if (dimension.asset) copy.asset = dimension.asset;
        if (dimension.name) copy.name = dimension.name;
        if (typeof dimension.radius === 'number') copy.radius = dimension.radius;
        if (typeof dimension.color === 'string') copy.color = dimension.color;
        return copy;
      });

    const artworks = scene.artworks
      .filter((artwork) => world.from.includes(artwork.dimension))
      .map((artwork) => ({ ...artwork, dimension: 0 }));

    const doors = scene.portals
      .filter((portal) => world.from.includes(portal.ownedBy))
      .map((portal) => worldDoor(portal, world.slug, scene));

    worlds.push({
      file: 'data/worlds/' + world.slug + '.json',
      scene: {
        version: 3,
        world: { slug: world.slug, name: world.name },
        // The real world behind dimension 0 is the gate's: the room of the camera is where the
        // exhibition starts (D24), and the rooms are entirely virtual.
        cameras: { player: scene.cameras.player, real: { enabled: world.slug === 'gate' } },
        assets: assetsFor(scene, world.from, artworks, doors),
        dimensions,
        artworks,
        portals: doors
      }
    });
  }

  // The fixture (D9 and D24): two dimensions and a door between them of each kind — the live window
  // of the pair, which the exhibition no longer has, and a world door. It is what `?scene=example`
  // loads, and it is what keeps T1–T9 exercised.
  const fixture = fixtureWorld(scene);
  worlds.push(fixture);
  return worlds;
}

function fixtureWorld(scene) {
  const dimensions = [
    { id: 0, kind: 'image', asset: 'cidade-360', radius: 500, name: { pt: 'Cidade 360º', en: 'City 360º' } },
    { id: 1, kind: 'image', asset: 'skycloud', radius: 500, name: { pt: 'Céu 360º', en: 'Sky 360º' } }
  ];
  const artworks = scene.artworks
    .filter((artwork) => artwork.dimension === 1 || artwork.dimension === 3)
    .map((artwork) => ({ ...artwork, dimension: artwork.dimension === 1 ? 0 : 1 }));
  const pair = scene.portals.find((portal) => portal.id === 2);
  // Two doors of the pair, one on each side: a door belongs to the dimension it stands in
  // (`ownedBy`), so a single one is a door into a room with no way back — the trap the fixture had
  // when it was written, and which the walk of T1/T7 walked into.
  const doors = [
    {
      id: 0,
      ownedBy: 0,
      position: [0, 0, -45],
      width: pair.width,
      height: pair.height,
      box: pair.box,
      boxPosition: pair.boxPosition,
      boxRotation: pair.boxRotation,
      trigger: pair.trigger,
      frame: { ...pair.frame },
      window: { kind: 'dimension-pair', dimensionA: 0, dimensionB: 1 },
      action: { kind: 'enter-window' }
    },
    {
      id: 2,
      ownedBy: 1,
      position: [0, 0, -110],
      width: pair.width,
      height: pair.height,
      box: pair.box,
      boxPosition: pair.boxPosition,
      boxRotation: pair.boxRotation,
      trigger: pair.trigger,
      frame: { ...pair.frame },
      window: { kind: 'dimension-pair', dimensionA: 0, dimensionB: 1 },
      action: { kind: 'enter-window' }
    },
    {
      id: 1,
      ownedBy: 0,
      position: [25, 0, -45],
      width: 10,
      height: 12,
      box: [12, 16, 1],
      boxPosition: [0, 8, 0],
      trigger: 'plane',
      window: { kind: 'preview', asset: 'retrato-praia', radius: PORTRAIT_RADIUS },
      action: { kind: 'navigate', target: 'scene2' },
      arrivalFrom: 'scene2'
    },
    // A second door with the **same** portrait, and the reason the fixture keeps it: two doors that
    // show the same picture share one derived dimension — 1 texture, 1 stencil value, 1 drawing
    // (D26). The exhibition used to prove it by accident, with the two duplicated portals of the
    // beach, and the D29 turned one of them into the way back to the gate; the fixture is where
    // that mechanism is exercised on purpose from now on.
    {
      id: 3,
      ownedBy: 0,
      position: [-25, 0, -45],
      width: 10,
      height: 12,
      box: [12, 16, 1],
      boxPosition: [0, 8, 0],
      trigger: 'plane',
      window: { kind: 'preview', asset: 'retrato-praia', radius: PORTRAIT_RADIUS },
      action: { kind: 'navigate', target: 'scene2' }
    }
  ];
  const assets = assetsFor(scene, [1, 3], artworks, doors);
  return {
    file: 'data/worlds/example.json',
    scene: {
      version: 3,
      world: { slug: 'example', name: { pt: 'Exemplo', en: 'Example' } },
      cameras: { player: scene.cameras.player, real: { enabled: false } },
      assets,
      dimensions,
      artworks,
      portals: doors
    }
  };
}

// The correspondence table: what each thing of the single scene became. It is the proof this
// migration can give (a change of meaning has no "0 differences").
function correspondence(scene, worlds) {
  const bySlug = new Map(worlds.map((world) => [world.scene.world.slug, world.scene]));
  const lines = [];

  for (const dimension of scene.dimensions) {
    const slug = worldOfDimension(dimension.id);
    const world = bySlug.get(slug);
    const landed = world.dimensions.find((candidate) => candidate.asset === dimension.asset || candidate.kind === dimension.kind);
    lines.push({
      what: 'dimension ' + dimension.id,
      from: dimension.kind + (dimension.asset ? ' ' + dimension.asset : ''),
      to: slug + (landed ? ' dimension ' + landed.id : ' — NOT FOUND')
    });
  }
  for (const artwork of scene.artworks) {
    const slug = worldOfDimension(artwork.dimension);
    const world = bySlug.get(slug);
    const found = world.artworks.some((candidate) => candidate.asset === artwork.asset && candidate.id === artwork.id);
    lines.push({ what: 'artwork ' + artwork.id, from: artwork.asset, to: slug + (found ? ' artwork ' + artwork.id : ' — NOT FOUND') });
  }
  for (const portal of scene.portals) {
    const here = worldOfDimension(portal.ownedBy);
    const pair = portal.window || {};
    const there = RETARGET[portal.id] ||
      worldOfDimension(pair.dimensionA === portal.ownedBy ? pair.dimensionB : pair.dimensionA);
    const door = bySlug.get(here).portals.find((candidate) => candidate.id === portal.id);
    const kind = door ? door.window.kind + ' + ' + door.action.kind + (door.arrivalFrom ? ' (arrival from ' + door.arrivalFrom + ')' : '') : 'NOT FOUND';
    lines.push({ what: 'portal ' + portal.id, from: here + ' (pair with ' + there + ')', to: there + ': ' + kind });
  }
  return lines;
}

const checkOnly = process.argv.includes('--check');
const scene = readSingleScene();

if (scene.version !== 3 || !Array.isArray(scene.portals) || scene.portals.some((portal) => typeof portal.window.dimensionA !== 'number')) {
  console.error('worlds.mjs: data/scene.json is not the single world of format 3 (the doors still link two');
  console.error('  dimensions in the old way). Run tools/migration/scene-v3.mjs first.');
  process.exit(1);
}

const worlds = buildWorlds(scene);
const table = correspondence(scene, worlds);

console.log('what each thing of the single scene became:');
for (const line of table) console.log(`  ${line.what.padEnd(14)} ${line.from.padEnd(28)} -> ${line.to}`);

let failed = 0;
for (const world of worlds) {
  const report = validateScene(world.scene);
  const counts = summarise(world.scene);
  const ok = report.ok;
  if (!ok) failed++;
  console.log(`${world.file}: ${ok ? 'OK' : 'FAILED'} (${counts.dimensions} dimensions, ` +
    `${counts.artworks} artworks, ${counts.portals} portals, ${counts.assets} assets, ` +
    `${counts.distinctWindows} distinct windows)`);
  for (const error of report.errors) console.error(`  error: ${error}`);
  for (const note of report.skipped.filter((skip) => !skip.includes('not measured'))) console.log(`  note: ${note}`);
}

const notFound = table.filter((line) => line.to.includes('NOT FOUND'));
if (notFound.length) {
  console.error(`${notFound.length} thing(s) of the single scene did not land anywhere:`);
  for (const line of notFound) console.error(`  ${line.what}: ${line.from}`);
  failed++;
}

if (failed) {
  console.error('nothing was written');
  process.exit(1);
}

if (!checkOnly) {
  mkdirSync(join(root, 'data', 'worlds'), { recursive: true });
  for (const world of worlds) writeFileSync(resolve(root, world.file), JSON.stringify(world.scene, null, 2) + '\n', 'utf8');
  console.log(`written: ${worlds.map((world) => world.file).join(', ')}`);
} else {
  console.log('--check: nothing was written');
}
