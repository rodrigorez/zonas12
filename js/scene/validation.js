// The laws of the scene, checked against the data instead of against a running scene.
//
// Why here and not in the builder: the same report has to reach the console of the exhibition,
// the command line (tools/scene/validate.mjs) and, later, the editor. Written once,
// a scene that passes in one of them passes in all three.
//
// What it checks:
//   - the shape, taken from schema.js (fields, types, allowed values, references, unknown keys),
//     including the rules of the two axes of a portal: what each kind of `window` and `action`
//     requires and what it forbids (D25);
//   - the laws of docs/ROADMAP.md section 8 that the data alone can prove: L1 (background wider
//     than the scene), L4 (arrival outside every other box), L5 (at most 255 windows at once),
//     L9 (every asset exists), L10 (the name of an asset file says what it is — a warning), L11 (a
//     door that navigates names a world that exists), L12 (no absolute paths), L13 (a portrait is a
//     picture, never a live world), L14 (the 2:1 shape of a panorama, and its size — a warning only
//     above the standard), L15 (the reserved band of ids), L16 and L17 (the arrival point, and one
//     arrival door per origin) and L18 (the two axes combine legally).
//   - the graph of the worlds, when the caller has all of them: the rooms nobody can reach
//     (`unreachableWorlds`) and the doors whose destination says nothing about where the visitor
//     comes from (`missingArrivals`, law L19).
//
// What it does not check, on purpose:
//   - the laws of render (L2, L3, L6, L7, L8): they are properties of the code, not of the data.
//
// Pure: no DOM, no A-Frame, no three. The only outside information it needs is how to tell
// whether a file exists (`options.exists`), which only the command line can answer.

import { SCENE, SCENE_VERSION, LANGUAGES } from './schema.js';
import {
  MAX_WINDOWS,
  MAX_DIMENSIONS,
  DERIVED_DIMENSION_BASE,
  PANORAMA_WIDTH,
  PANORAMA_HEIGHT
} from '../core/index.js';
import { validateDoor } from '../modules/portal-kinds.js';
import { arrivalPoint } from './arrival.js';

const EYE_HEIGHT = 1.6;

// The shape of the name of an asset file (law L10): assets/<type>/<name>.<ext>, all lowercase, with
// the hyphens the D7 rule uses. It is a warning and not an error because a file in the wrong place
// still loads — what is lost is the folder being searchable.
const ASSET_FILE = /^assets\/(panoramas|artworks|video|previews)\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|jpeg|png|webp|mp4|webm)$/;

// The measurements of the scene, so a caller can print them without walking the data again.
export function summarise(scene) {
  const windows = new Set();
  for (const portal of scene.portals || []) {
    const axis = portal.window || {};
    if (axis.kind === 'dimension-pair') {
      const ownedBy = portal.ownedBy;
      const other = ownedBy === axis.dimensionA ? axis.dimensionB : axis.dimensionA;
      windows.add(ownedBy + '->' + other);
    } else if (axis.kind === 'preview') {
      // A portrait becomes a dimension the builder derives (D26): two doors that name the same
      // portrait with the same radius share it, so they take one stencil value and not two.
      windows.add('preview:' + axis.asset + '@' + axis.radius);
    }
    // `kind: "none"` shows nothing: it takes no stencil value, so it is no window at all.
  }
  return {
    dimensions: (scene.dimensions || []).length,
    artworks: (scene.artworks || []).length,
    portals: (scene.portals || []).length,
    assets: Object.keys(scene.assets || {}).length,
    distinctWindows: windows.size
  };
}

export function validateScene(scene, options = {}) {
  const errors = [];
  const warnings = [];
  const skipped = [];
  const err = (message) => errors.push(message);
  const warn = (message) => warnings.push(message);

  if (!scene || typeof scene !== 'object' || Array.isArray(scene)) {
    return { ok: false, errors: ['the scene is not an object'], warnings, skipped, summary: null };
  }

  // ---- the version, before anything else: a reader that does not know the format cannot
  // pretend it read it (D23).
  if (scene.version !== SCENE_VERSION) {
    err(`version: the file declares ${JSON.stringify(scene.version)}, this reader reads ${SCENE_VERSION}`);
  }

  const assets = scene.assets && typeof scene.assets === 'object' ? scene.assets : {};
  const dimensions = Array.isArray(scene.dimensions) ? scene.dimensions : [];
  const ids = new Set(dimensions.map((dimension) => dimension.id));

  checkSceneFields(scene, err, warn, { assets, ids });

  // ---- the catalogue (D20) ----
  for (const [id, asset] of Object.entries(assets)) {
    if (!asset || typeof asset !== 'object') { err(`assets.${id}: not an object`); continue; }
    if (typeof asset.path === 'string') {
      if (/^([a-zA-Z]:[\\/]|[\\/])/.test(asset.path)) {
        err(`assets.${id}: path "${asset.path}" is absolute — law L12 (published in a folder, everything breaks)`);
      }
      if (asset.path.split(/[\\/]/).includes('..')) {
        warn(`assets.${id}: path "${asset.path}" walks out of the project`);
      }
      if (typeof options.exists === 'function') {
        const found = options.exists(asset.path);
        if (found === false) err(`assets.${id}: "${asset.path}" does not exist on disk — law L9 (an image that never appears)`);
        else if (found === undefined) skipped.push(`assets.${id}: could not tell whether "${asset.path}" exists`);
      } else {
        skipped.push(`assets.${id}: existence not checked (no way to look at the disk)`);
      }
    }
    if (!asset.alt) warn(`assets.${id}: no alt — the <img> the builder creates will have no description`);
    // ---- L10: the name of the file says what it is (a warning: it is hygiene, not a break) ----
    if (typeof asset.path === 'string' && !ASSET_FILE.test(asset.path)) {
      warn(`assets.${id}: "${asset.path}" is not assets/<type>/<name>.<ext> — law L10 (the folder stops being searchable)`);
    }
  }

  // ---- dimensions and what their background needs ----
  for (const dimension of dimensions) {
    const where = `dimensions[${dimension.id}]`;
    if (dimension.kind === 'camera' || dimension.kind === 'color') {
      if (dimension.asset) err(`${where}: kind "${dimension.kind}" does not show an asset`);
    } else if (dimension.kind === 'image' || dimension.kind === 'video') {
      if (!dimension.asset) err(`${where}: kind "${dimension.kind}" needs an asset`);
      if (typeof dimension.radius !== 'number') err(`${where}: a background needs a radius — law L1`);
    }
    if (dimension.kind === 'color' && !dimension.color) {
      warn(`${where}: kind "color" without a colour — the background will be black`);
    }
    // ---- L15: the band of ids that belongs to the derived dimensions ----
    if (Number.isInteger(dimension.id) && dimension.id >= DERIVED_DIMENSION_BASE) {
      err(`${where}: the declared id ${dimension.id} is inside the band reserved for the derived ` +
        `dimensions (${DERIVED_DIMENSION_BASE}…${MAX_DIMENSIONS - 1}) — law L15 (it is activated by ` +
        `mistake and the camera ends up inside a portrait)`);
    }
  }

  // ---- L1: the background has to be wider than the scene ----
  const points = [
    ...(scene.portals || []).map((portal) => portal.position),
    ...(scene.artworks || []).map((artwork) => artwork.position)
  ].filter((point) => Array.isArray(point));
  if (points.length) {
    const extent = Math.max(...points.map((point) => Math.hypot(point[0], point[1], point[2])));
    for (const dimension of dimensions) {
      if (dimension.kind === 'camera') continue;
      if (typeof dimension.radius === 'number' && dimension.radius <= extent) {
        err(`dimensions[${dimension.id}]: radius ${dimension.radius} is not larger than the scene extent ` +
          `(${extent.toFixed(1)}) — law L1 (the background of the active dimension shows up inside the window)`);
      }
    }
  }

  // ---- artworks: what they show, and how they open ----
  for (const artwork of scene.artworks || []) {
    const where = `artworks[${artwork.id}]`;
    const asset = artwork.asset ? assets[artwork.asset] : null;
    if (artwork.kind === 'image' || artwork.kind === 'video') {
      if (!artwork.asset) err(`${where}: kind "${artwork.kind}" needs an asset`);
      else if (asset && asset.type !== artwork.kind) {
        err(`${where}: kind "${artwork.kind}" with an asset of type "${asset.type}" — one of the two is wrong`);
      }
    }
    if (artwork.interaction === 'link' && !artwork.url) {
      err(`${where}: interaction "link" needs a url (an external address, which is not an asset)`);
    }
    if (artwork.interaction !== 'link' && artwork.url) {
      err(`${where}: url is only for interaction "link" — with "${artwork.interaction}" the url comes from the ` +
        `asset catalogue (D20), and having both is the duplication A6 closed`);
    }
  }

  // ---- L4: arriving must not fall inside another box (chain crossings) ----
  const portals = (scene.portals || []).filter((portal) => Array.isArray(portal.position) && Array.isArray(portal.box));
  for (const from of portals) {
    const arrival = [from.position[0], EYE_HEIGHT, from.position[2]];
    for (const other of portals) {
      if (other === from) continue;
      if (insideBox(arrival, other)) {
        err(`portals[${from.id}]: arriving there falls inside the box of portal ${other.id} — law L4 ` +
          `(chain crossings: the visitor ping-pongs between dimensions)`);
      }
    }
  }

  // ---- L11, L13 and L18: what the two axes of a door may say ----
  for (const portal of scene.portals || []) {
    const windowAxis = portal.window || {};
    const actionAxis = portal.action || {};
    const where = `portals[${portal.id}]`;

    // L18, and whatever else the table asks of a door (section 5.4): the same list the editor
    // (Fase 4) shows to whoever writes a door, so the two cannot disagree.
    for (const problem of validateDoor(portal)) {
      err(`${where}: ${problem.message} — ${problem.law}`);
    }

    // L11: a door that navigates names a world that exists. Which worlds exist is a question only
    // the command line can answer (each one is a file of its own), so without that answer the
    // check is reported as not verified instead of passed.
    if (actionAxis.kind === 'navigate' && typeof actionAxis.target === 'string') {
      if (typeof options.worldExists !== 'function') {
        skipped.push(`${where}: the world "${actionAxis.target}" was not checked (no way to list the worlds)`);
      } else if (options.worldExists(actionAxis.target) === false) {
        err(`${where}: the world "${actionAxis.target}" does not exist — law L11 (a door that navigates to nowhere)`);
      }
    }

    // L13: the portrait of a door is a picture, never the destination loaded live — the page of
    // one world never reads the file of another (D14).
    if (windowAxis.kind === 'preview' && windowAxis.asset) {
      const portrait = assets[windowAxis.asset];
      if (portrait && portrait.type !== 'image') {
        err(`${where}: the portrait "${windowAxis.asset}" is a ${portrait.type} — law L13 (the ` +
          `destination is never loaded live)`);
      }
    }
  }

  // ---- L17: at most one arrival door per world of origin ----
  const arrivalDoors = new Map();
  for (const portal of scene.portals || []) {
    if (typeof portal.arrivalFrom !== 'string') continue;
    const previous = arrivalDoors.get(portal.arrivalFrom);
    if (previous !== undefined) {
      err(`portals[${portal.id}]: it is the arrival door of "${portal.arrivalFrom}", and so is ` +
        `portals[${previous}] — law L17 (one per origin, or the visitor appears somewhere arbitrary)`);
      continue;
    }
    arrivalDoors.set(portal.arrivalFrom, portal.id);
  }

  // ---- L16: the arrival is behind the door and away from every box ----
  // The point is the one the builder will place the camera on (js/scene/arrival.js, one home for
  // the geometry), so what is proved here is what happens on the screen.
  const camera = scene.cameras && scene.cameras.player ? scene.cameras.player : {};
  const eyeHeight = Array.isArray(camera.position) && typeof camera.position[1] === 'number'
    ? camera.position[1]
    : EYE_HEIGHT;
  for (const portal of portals) {
    if (typeof portal.arrivalFrom !== 'string') continue;
    const arrival = arrivalPoint(portal, eyeHeight).position;
    for (const other of portals) {
      if (!insideBox(arrival, other)) continue;
      const where = other === portal ? 'the door itself' : `portals[${other.id}]`;
      err(`portals[${portal.id}]: arriving from "${portal.arrivalFrom}" lands inside the box of ` +
        `${where} — law L16 (the first step forward crosses it again: chain crossings)`);
      break;
    }
  }

  // ---- L14: the shape of a panorama, which is a background or a portrait ----
  const panoramas = [
    ...dimensions
      .filter((dimension) => dimension.asset && (dimension.kind === 'image' || dimension.kind === 'video'))
      .map((dimension) => ({ what: `dimensions[${dimension.id}]`, asset: dimension.asset })),
    ...(scene.portals || [])
      .filter((portal) => (portal.window || {}).kind === 'preview' && portal.window.asset)
      .map((portal) => ({ what: `portals[${portal.id}].window`, asset: portal.window.asset }))
  ];
  for (const panorama of panoramas) {
    const entry = assets[panorama.asset];
    if (!entry || typeof entry.path !== 'string') continue;
    // Reading an image is another question only the command line can answer (the same shape as
    // `exists`): in the browser it is reported as not verified.
    if (typeof options.imageSize !== 'function') {
      skipped.push(`${panorama.what}: the shape of "${entry.path}" was not measured (no way to read an image)`);
      continue;
    }
    const size = options.imageSize(entry.path);
    if (!size) {
      skipped.push(`${panorama.what}: the shape of "${entry.path}" could not be read`);
      continue;
    }
    if (size.width !== size.height * 2) {
      err(`${panorama.what}: "${entry.path}" is ${size.width}×${size.height}, which is not the 2:1 of an ` +
        `equirectangular panorama — law L14 (the distortion shows in the window)`);
    } else if (size.width > PANORAMA_WIDTH) {
      warn(`${panorama.what}: "${entry.path}" is ${size.width}×${size.height}; above the standard ` +
        `${PANORAMA_WIDTH}×${PANORAMA_HEIGHT} — law L14 (the memory grows with the pixels)`);
    }
  }

  // ---- L5: how many different dimensions a window can show at once ----
  const summary = summarise(scene);
  if (summary.distinctWindows > MAX_WINDOWS) {
    err(`${summary.distinctWindows} distinct windows exceed the stencil limit (${MAX_WINDOWS}) — law L5` +
      ` (the extra ones get no window)`);
  }

  return { ok: errors.length === 0, errors, warnings, skipped, summary };
}

// Which worlds nobody can reach from the entry one (the gate), walking the doors that navigate.
//
// Pure, and separate from validateScene because it needs the whole set of files at once: only the
// command line has them (the exhibition loads one world and never sees the others, which is the
// point of D14).
export function unreachableWorlds(scenes, entrySlug) {
  const doors = new Map();
  for (const scene of scenes) {
    const from = scene.world && scene.world.slug;
    doors.set(from, (scene.portals || [])
      .filter((portal) => (portal.action || {}).kind === 'navigate' && typeof portal.action.target === 'string')
      .map((portal) => portal.action.target));
  }
  const reachable = new Set([entrySlug]);
  const queue = [entrySlug];
  while (queue.length > 0) {
    for (const target of doors.get(queue.shift()) || []) {
      if (!reachable.has(target)) {
        reachable.add(target);
        queue.push(target);
      }
    }
  }
  return scenes
    .map((scene) => scene.world && scene.world.slug)
    .filter((slug) => slug && !reachable.has(slug));
}

// The doors whose destination does not say where the visitor came from (law L19): a door from A to
// B, and no door of B declaring `arrivalFrom: A`. The visitor still arrives — the runtime puts them
// where the camera says, and warns about it right there (js/scene/scene-builder.js) — but the
// arrival is a place nobody chose, and the way back is wherever it happens to be.
//
// The runtime warning and this check are the same fact seen from two sides, and this one is the
// side that can be asked *before* somebody walks the door: the beach stayed without a way back to
// the gate since the scene was written, and only the B7 walk found it (D29, docs/ROADMAP.md §9).
//
// One entry per pair — `{ from, to, portals }`, with every door that makes the pair — and none for
// a destination with no file of its own: a door to a world that does not exist is L11's business.
// Same shape as unreachableWorlds, and for the same reason: the exhibition loads one world and
// never sees the others (D14), so only the command line can ask this.
export function missingArrivals(scenes) {
  const arrivals = new Map();
  for (const scene of scenes) {
    arrivals.set(scene.world && scene.world.slug, new Set((scene.portals || [])
      .filter((portal) => typeof portal.arrivalFrom === 'string')
      .map((portal) => portal.arrivalFrom)));
  }

  const gaps = new Map();
  for (const scene of scenes) {
    const from = scene.world && scene.world.slug;
    for (const portal of scene.portals || []) {
      const action = portal.action || {};
      if (action.kind !== 'navigate' || typeof action.target !== 'string') continue;
      if (!arrivals.has(action.target) || arrivals.get(action.target).has(from)) continue;
      const key = from + ' -> ' + action.target;
      if (!gaps.has(key)) gaps.set(key, { from: from, to: action.target, portals: [] });
      gaps.get(key).portals.push(portal.id);
    }
  }
  return [...gaps.values()];
}

// The arrival point of a "from" portal, in the space of another portal's box. Position and
// rotation of the box are the portal's, so a door that has been turned is handled like the
// collision itself does (js/modules/portal.js, detectTraversal).
function insideBox(point, portal) {
  const rotation = Array.isArray(portal.boxRotation) ? portal.boxRotation[1] || 0 : 0;
  const offset = [point[0] - portal.position[0], point[1] - portal.position[1], point[2] - portal.position[2]];
  const angle = (-rotation * Math.PI) / 180;
  const local = [
    offset[0] * Math.cos(angle) + offset[2] * Math.sin(angle),
    offset[1],
    -offset[0] * Math.sin(angle) + offset[2] * Math.cos(angle)
  ];
  const centre = portal.boxPosition || [0, 0, 0];
  const half = portal.box.map((side) => side / 2);
  return [0, 1, 2].every((axis) => Math.abs(local[axis] - centre[axis]) <= half[axis]);
}

// ---- the shape, walked from schema.js ----

// The top level: SCENE is not a descriptor like the others, it is the list of them (version,
// cameras, assets, dimensions, artworks, portals), which is why the walk starts here by hand.
function checkSceneFields(scene, err, warn, context) {
  for (const name of Object.keys(scene)) {
    if (!SCENE[name]) {
      err(`${name}: unknown field at the top of the scene — law of the format (a swapped field is silent otherwise)`);
    }
  }
  for (const [name, field] of Object.entries(SCENE)) {
    const value = scene[name];
    if (value === undefined) {
      if (field.required) err(`${name}: required`);
      continue;
    }
    checkValue(value, field, name, err, warn, context);
  }
}

function checkNode(holder, node, path, err, warn, context) {
  const fields = node.fields || node.item || node.entry;
  if (!fields) return;

  for (const name of Object.keys(holder)) {
    if (!fields[name]) err(`${path}${name}: unknown field — law of the format (a swapped field is silent otherwise)`);
  }
  for (const [name, field] of Object.entries(fields)) {
    const value = holder[name];
    if (value === undefined) {
      if (field.required) err(`${path}${name}: required`);
      continue;
    }
    checkValue(value, field, `${path}${name}`, err, warn, context);
  }

  checkRules(holder, node, path, err);
}

// What a value of one field requires or forbids in the others — `window` and `action` ask for
// different fields per kind. The rule is data, written in schema.js next to the fields it
// constrains, so the reader, the migration and (later) the editor ask the same question.
function checkRules(holder, node, path, err) {
  for (const rule of node.rules || []) {
    const [field, expected] = Object.entries(rule.when)[0];
    if (holder[field] !== expected) continue;
    for (const name of rule.require || []) {
      if (holder[name] === undefined) err(`${path}${name}: required when ${field} is "${expected}"`);
    }
    for (const name of rule.forbid || []) {
      if (holder[name] !== undefined) err(`${path}${name}: not written when ${field} is "${expected}"`);
    }
  }
}

function checkValue(value, field, path, err, warn, context) {
  switch (field.type) {
    case 'int':
      if (!Number.isInteger(value)) { err(`${path}: expected a whole number, found ${JSON.stringify(value)}`); return; }
      if (field.min !== undefined && value < field.min) err(`${path}: ${value} is below ${field.min}`);
      if (field.max !== undefined && value > field.max) err(`${path}: ${value} is above ${field.max}`);
      if (field.ref) checkRef(value, field, path, err, context);
      return;
    case 'number':
      if (typeof value !== 'number' || !Number.isFinite(value)) { err(`${path}: expected a number, found ${JSON.stringify(value)}`); return; }
      if (field.positive && value <= 0) err(`${path}: ${value} is not greater than zero`);
      return;
    case 'string':
      if (typeof value !== 'string') err(`${path}: expected a string, found ${JSON.stringify(value)}`);
      return;
    case 'boolean':
      if (typeof value !== 'boolean') err(`${path}: expected true or false, found ${JSON.stringify(value)}`);
      return;
    case 'enum':
      if (!field.oneOf.includes(value)) {
        err(`${path}: "${value}" is not one of ${field.oneOf.join(', ')}`);
      }
      return;
    case 'vec3': {
      if (!Array.isArray(value) || value.length !== 3 || !value.every((part) => typeof part === 'number' && Number.isFinite(part))) {
        err(`${path}: expected three numbers, found ${JSON.stringify(value)}`);
        return;
      }
      if (field.positive && value.some((part) => part <= 0)) err(`${path}: every side has to be greater than zero, found ${JSON.stringify(value)}`);
      return;
    }
    case 'text': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        err(`${path}: expected a text by language (${LANGUAGES.join(', ')}), found ${JSON.stringify(value)}`);
        return;
      }
      const written = Object.keys(value).filter((language) => typeof value[language] === 'string' && value[language].length > 0);
      for (const language of Object.keys(value)) {
        if (!LANGUAGES.includes(language)) warn(`${path}: "${language}" is not a language of the interface (${LANGUAGES.join(', ')})`);
      }
      if (written.length === 0) err(`${path}: no language written`);
      return;
    }
    case 'asset':
      if (typeof value !== 'string') { err(`${path}: expected the name of an asset, found ${JSON.stringify(value)}`); return; }
      if (!Object.prototype.hasOwnProperty.call(context.assets, value)) {
        err(`${path}: "${value}" is not in the assets catalogue — law L9 (a file nothing declares)`);
      }
      return;
    case 'object':
      if (!value || typeof value !== 'object' || Array.isArray(value)) { err(`${path}: expected an object`); return; }
      checkNode(value, field, `${path}.`, err, warn, context);
      return;
    case 'array': {
      if (!Array.isArray(value)) { err(`${path}: expected a list`); return; }
      const seen = new Map();
      const idField = field.item && field.item.id;
      value.forEach((item, index) => {
        if (!item || typeof item !== 'object') { err(`${path}[${index}]: expected an object`); return; }
        if (idField && Number.isInteger(item.id)) {
          if (seen.has(item.id)) err(`${path}[${index}]: id ${item.id} is repeated (first at [${seen.get(item.id)}])`);
          else seen.set(item.id, index);
        }
        checkNode(item, field, `${path}[${index}].`, err, warn, context);
      });
      return;
    }
    case 'map':
      if (!value || typeof value !== 'object' || Array.isArray(value)) { err(`${path}: expected an object with one entry per asset`); return; }
      for (const [key, entry] of Object.entries(value)) {
        if (!entry || typeof entry !== 'object') { err(`${path}.${key}: expected an object`); continue; }
        checkNode(entry, field, `${path}.${key}.`, err, warn, context);
      }
      return;
    default:
      warn(`${path}: field type "${field.type}" is not checked`);
  }
}

function checkRef(value, field, path, err, context) {
  if (field.ref === 'dimensions' && !context.ids.has(value)) {
    if (!(field.plusMinusOne && value === -1)) {
      err(`${path}: dimension ${value} does not exist`);
    }
  }
}
