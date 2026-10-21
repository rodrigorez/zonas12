// Which worlds exist, as far as a page can know.
//
// There is no manifest (D14, M5) and a browser cannot list a folder, so the editor derives the map the
// way the house is built: from the gate's doors — plus the fixture — one fetch per slug, then one more
// level down (a room that opens another room is still a room of this house).
//
// What comes back is **data** for the validator and for the panel, never a scene: nothing here builds
// another world, which is what law L13 is about. A world file is read once and kept; a slug whose file
// is not there stays in the map as `null`, which is the answer L11 needs.
import { textIn } from '../scene/schema.js';

const NAME = /^[a-z0-9-]+$/;
const ENTRY_WORLD = 'gate';
// The fixture of D9 is not a room anybody reaches, but it is a world file worth opening.
const FIXTURE_WORLD = 'example';
const FIXTURES = [FIXTURE_WORLD];

const cache = new Map();
let order = [];

const isWorldName = (slug) => typeof slug === 'string' && NAME.test(slug);

async function read(slug) {
  try {
    const response = await fetch('data/worlds/' + slug + '.json');
    if (!response.ok) throw new Error('HTTP ' + response.status);
    cache.set(slug, await response.json());
  } catch (error) {
    cache.set(slug, null);
  }
  return cache.get(slug);
}

function targetsOf(scene) {
  return ((scene && scene.portals) || [])
    .map((portal) => portal.action || {})
    .filter((action) => action.kind === 'navigate' && isWorldName(action.target))
    .map((action) => action.target);
}

export async function refresh() {
  const gate = await read(ENTRY_WORLD);
  const found = new Set([ENTRY_WORLD, FIXTURE_WORLD]);
  for (const slug of targetsOf(gate)) found.add(slug);
  for (const slug of [...found]) {
    const scene = cache.has(slug) ? cache.get(slug) : await read(slug);
    for (const target of targetsOf(scene)) found.add(target);
  }
  order = [...found];
  return order.slice();
}

// Reads any slug that was asked for and is not in the map yet (a door whose target was just typed).
export async function ensure(slugs) {
  for (const slug of slugs || []) {
    if (!isWorldName(slug) || cache.has(slug)) continue;
    await read(slug);
    if (order.indexOf(slug) === -1) order.push(slug);
  }
}

// `true` / `false` when the file was looked for, `undefined` when it was not asked yet — the validator
// treats only an explicit `false` as law L11, so "not asked" can never become a false accusation.
export function exists(slug) {
  if (!cache.has(slug)) return undefined;
  return cache.get(slug) !== null;
}

export function sceneOf(slug) {
  return cache.get(slug) || null;
}

export function knownSlugs() {
  return order.slice();
}

export function nameOf(slug, language) {
  const scene = cache.get(slug);
  if (!scene) return null;
  return textIn(scene.world && scene.world.name, language);
}

// Every world file read so far. `order` first, so the list is stable.
export function scenes() {
  return order.map((slug) => cache.get(slug)).filter(Boolean);
}

// The same cut the command line makes (tools/scene/validate.mjs): the fixture is not part of the graph —
// nobody reaches it through a door — so its doors do not count for L19 either. Two hosts, one answer.
export function graphScenes() {
  return scenes().filter((scene) => !scene.world || FIXTURES.indexOf(scene.world.slug) === -1);
}
