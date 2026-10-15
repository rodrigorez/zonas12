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
//     L9 (every asset exists) and L12 (no absolute paths).
//
// What it does not check, on purpose:
//   - the laws of render (L2, L3, L6, L7, L8): they are properties of the code, not of the data;
//   - the laws of the worlds (L10, L11, L13, L14, L15, L16, L17, L18): they arrive with the block
//     that creates doors to another world and derived dimensions (Fase 3B, §9, block B3).
//
// Pure: no DOM, no A-Frame, no three. The only outside information it needs is how to tell
// whether a file exists (`options.exists`), which only the command line can answer.

import { SCENE, SCENE_VERSION, LANGUAGES } from './schema.js';
import { MAX_WINDOWS } from '../core/index.js';

const EYE_HEIGHT = 1.6;

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

  // ---- L5: how many different dimensions a window can show at once ----
  const summary = summarise(scene);
  if (summary.distinctWindows > MAX_WINDOWS) {
    err(`${summary.distinctWindows} distinct windows exceed the stencil limit (${MAX_WINDOWS}) — law L5` +
      ` (the extra ones get no window)`);
  }

  return { ok: errors.length === 0, errors, warnings, skipped, summary };
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
