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
//     arrival door per origin), L18 (the two axes combine legally), L20 (the ficha of a work is one
//     page, D62), L21 (the measurement id of a room, when there is one, is a GA4 id), L22 and L23
//     (the two rings, and the clearance between them — D77) and L24 (three to five doors per room,
//     one of them to the gate — D77).
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
import { validateDoor, ENTRY_WORLD } from '../modules/portal-kinds.js';
import { arrivalPoint } from './arrival.js';
import { alcanceDaPorta, ALCANCE_MINIMO } from './reach.js';
import { realityHoles, sameHoles } from './reality.js';
import { RING, angularGap, portraitTurn, requiredClearance, ringCoordinates } from './ring.js';
import { isFixture } from './fixtures.js';

const EYE_HEIGHT = 1.6;

// Uma sala tem de três a cinco portas (D77): abaixo de três não há escolha nenhuma — duas portas são
// um corredor —, e acima de cinco a sala deixa de ser uma sala e passa a ser um átrio, que é o que o
// portão é. O limite é da regra, não do anel: a 60 m seis caixas de 12 m ainda ficam a 60 m umas das
// outras.
const MIN_DOORS = 3;
const MAX_DOORS = 5;

// The shape of the name of an asset file (law L10): assets/<type>/<name>.<ext>, all lowercase, with
// the hyphens the D7 rule uses. It is a warning and not an error because a file in the wrong place
// still loads — what is lost is the folder being searchable.
const ASSET_FILE = /^assets\/(panoramas|artworks|video|models|previews)\/[a-z0-9]+(?:-[a-z0-9]+)*\.(?:jpg|jpeg|png|webp|mp4|webm|gltf|glb)$/;

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

// Um caminho que é um endereço (D64): o ficheiro vive fora do projeto e é o browser que o vai buscar.
export const isRemotePath = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);

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

  // ---- L21: a medição de uma sala, quando existe, tem a forma de um ID da GA4 (D62) ----
  //
  // Um ID mal escrito não dá erro em sítio nenhum: a GA ignora-o em silêncio e a exposição fica sem
  // números sem ninguém dar por isso. Vazio é o estado normal (as propriedades ainda não existem).
  const analytics = scene.world && scene.world.analytics;
  if (analytics) {
    const id = analytics.id;
    if (typeof id === 'string' && id.trim() !== '' && !/^G-[A-Za-z0-9]{6,}$/.test(id.trim())) {
      err(`world.analytics.id: "${id}" is not a GA4 measurement id (it looks like G-XXXXXXX) — law L21`);
    }
    if (typeof id !== 'string') {
      err('world.analytics: the id has to be a string (empty while the property does not exist) — law L21');
    }
  }

  checkSceneFields(scene, err, warn, { assets, ids });

// ---- the catalogue (D20) ----
  for (const [id, asset] of Object.entries(assets)) {
    if (!asset || typeof asset !== 'object') { err(`assets.${id}: not an object`); continue; }
    if (typeof asset.path === 'string') {
      // Um asset pode viver **fora** do projeto (D64): a capa de uma obra cujo conteúdo está num site
      // pode ser a imagem que esse site já serve (o thumbnail do YouTube, por exemplo). Nesse caso as
      // perguntas de disco (existe? que forma tem? o nome segue a regra?) não têm resposta do lado de
      // cá — diz-se que não foram verificadas, em vez de se inventar uma resposta.
      if (isRemotePath(asset.path)) {
        skipped.push(`assets.${id}: "${asset.path}" is remote — existence, shape and name not checked ` +
          `(the exhibition depends on another server for it)`);
        if (!asset.alt) warn(`assets.${id}: no alt — the <img> the builder creates will have no description`);
        continue;
      }
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
    if (typeof asset.path === 'string' && !isRemotePath(asset.path) && !ASSET_FILE.test(asset.path)) {
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
    } else if (dimension.kind === 'shader') {
      // The trial of R14/R15: the shader comes from the internal list (the schema has the enum) and
      // the image fallback is what stands in for it while the flag is closed — so it has to be an
      // image that exists, not a video and not a promise.
      if (typeof dimension.radius !== 'number') err(`${where}: a background needs a radius — law L1`);
      const fallback = dimension.fallbackAsset ? assets[dimension.fallbackAsset] : null;
      if (fallback && fallback.type !== 'image') {
        err(`${where}: the fallback of a shader has to be an image, not "${fallback.type}"`);
      }
    }
    if (dimension.kind === 'color' && !dimension.color) {
      warn(`${where}: kind "color" without a colour — the background will be black`);
    }
    if (dimension.kind === 'color' && typeof dimension.radius !== 'number') {
      err(`${where}: a flat background needs a radius — law L1 (the background is a sphere like the others)`);
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

  // ---- L22 and L23: the two rings, and the clearance between them ----
  //
  // The disposition of D77: the works on a circle of radius R1 and the doors on a concentric circle
  // of radius R2, equal steps inside each ring, and the front of every object turned to the centre.
  // The arithmetic lives in js/scene/ring.js — the same that writes the data — and what is proved
  // here is that the data is still what it wrote: a work dragged in the editor, or a `position`
  // edited by hand, breaks the law and the report says which one and by how much.
  //
  // A fixture (D9) is not a room and has no rings. Who says so is the scene's **own** slug, and not
  // only the caller: the instruments that check a fixture (`tools/regression/shader.mjs` with the
  // `shader` world) do not know they are holding one, and the law read their world as a room with
  // no doors.
  const fixture = options.fixture === true || isFixture(scene.world && scene.world.slug);
  if (!fixture) {
    ringErrors(scene.artworks || [], RING.artworks.radius, 'artworks', err);
    ringErrors(scene.portals || [], RING.portals.radius, 'portals', err);
    clearanceErrors(scene.artworks || [], scene.portals || [], err);
  }

  // ---- artworks: what they show, and how they open ----
  for (const artwork of scene.artworks || []) {
    const where = `artworks[${artwork.id}]`;
    const asset = artwork.asset ? assets[artwork.asset] : null;
    if (artwork.kind === 'image' || artwork.kind === 'video' || artwork.kind === 'model') {
      if (!artwork.asset) err(`${where}: kind "${artwork.kind}" needs an asset`);
      else if (asset && asset.type !== artwork.kind) {
        err(`${where}: kind "${artwork.kind}" with an asset of type "${asset.type}" — one of the two is wrong`);
      }
    }
    if (artwork.kind === 'text' && !artwork.text) {
      err(`${where}: kind "text" needs its text (the content of the work, per language)`);
    }
    // Uma obra `site` é uma página (D60): o `site` é o que ela mostra, e o `asset` — quando existe — é
    // a imagem que fica no lugar dela. Um site que não é um endereço não é um site.
    if (artwork.kind === 'site') {
      if (!artwork.site) err(`${where}: kind "site" needs its site (the address the page tries to embed)`);
      else if (!/^https?:\/\//i.test(artwork.site)) {
        err(`${where}: site "${artwork.site}" is not an http(s) address`);
      }
      if (artwork.asset && asset && asset.type !== 'image') {
        err(`${where}: the asset of a "site" work is the image that stands in for it, so it has to be an image`);
      }
    }
    if (artwork.site && !/^https?:\/\//i.test(artwork.site)) {
      err(`${where}: site "${artwork.site}" is not an http(s) address`);
    }
    if (artwork.interaction === 'link' && !artwork.url) {
      err(`${where}: interaction "link" needs a url (an external address, which is not an asset)`);
    }
    if (artwork.interaction !== 'link' && artwork.url) {
      err(`${where}: url is only for interaction "link" — with "${artwork.interaction}" the url comes from the ` +
        `asset catalogue (D20) or from the ficha (D60), and having both is the duplication A6 closed`);
    }
  }

  // ---- D30, fechada na Fase 7 ----
  //
  // Os quatro valores que a D30 listou como «validados e não construídos» — obra `model` e `text`,
  // dimensão `color` e `interaction: "link"` — passaram a ser construídos (B5, B6 e B7). O aviso que
  // aqui os denunciava saiu com eles: um aviso que já não aponta para nada é ruído no relatório, e o
  // T8 mede o ruído.

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
    for (const problem of validateDoor(portal, dimensions)) {
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

    // D53: uma janela que desenha o fundo do destino ao vivo precisa do recorte — sem ele as obras e
    // as portas do outro lado não estão lá, e ao atravessar aparecem de repente (medido: a costura
    // sobe de 0,3 para 1,0 a 4,4 na meta de 0,50).
    if (windowAxis.kind === 'preview' && windowAxis.shaderId) {
      if (!windowAxis.cutout) {
        err(`${where}: the window draws "${windowAxis.shaderId}" live and has no cutout — the works ` +
          `and the doors of the destination would be missing (D53)`);
      } else if (!assets[windowAxis.cutout]) {
        err(`${where}: the cutout "${windowAxis.cutout}" is not in the assets catalogue (D20)`);
      }
    }
  }

  // ---- L17: at most one arrival door per world of origin ----
  const arrivalDoors = new Map();
  for (const portal of scene.portals || []) {
    if (typeof portal.arrivalFrom !== 'string') continue;
    // A porta de chegada **pode** oscilar desde a D87. A razão antiga (o dado descrevia onde a porta
    // estava quando o ficheiro foi escrito) continua verdadeira, mas agora o que a chegada lê é a
    // **pose de repouso** — a fase 0 do seno, que é exactamente a pose do dado. E o
    // `prefers-reduced-motion` congela nessa mesma fase. Quem garante que a porta continua a ser
    // alcançável é a L29, não esta.
    if (portal.motion && portal.motion.kind && portal.motion.kind !== 'sway') {
      err(`portals[${portal.id}]: it is the arrival door of "${portal.arrivalFrom}" and it declares ` +
        `motion "${portal.motion.kind}" — only an oscillation ("sway") can be the door a visitor ` +
        `arrives behind (D87: the arrival reads the resting pose, which is the one in the file; ` +
        `"spin" and "orbit" have no resting pose)`);
      continue;
    }
    const previous = arrivalDoors.get(portal.arrivalFrom);
    if (previous !== undefined) {
      err(`portals[${portal.id}]: it is the arrival door of "${portal.arrivalFrom}", and so is ` +
        `portals[${previous}] — law L17 (one per origin, or the visitor appears somewhere arbitrary)`);
      continue;
    }
    arrivalDoors.set(portal.arrivalFrom, portal.id);
  }

  // ---- L16: the arrival is in front of the door and away from every box ----
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
    // The fallback of a shader is a panorama too: it is what the visitor sees when the shader is not
    // built, so it carries the same 2:1 rule (L14).
    ...dimensions
      .filter((dimension) => dimension.kind === 'shader' && dimension.fallbackAsset)
      .map((dimension) => ({ what: `dimensions[${dimension.id}].fallbackAsset`, asset: dimension.fallbackAsset })),
    ...(scene.portals || [])
      .filter((portal) => (portal.window || {}).kind === 'preview' && portal.window.asset)
      .map((portal) => ({ what: `portals[${portal.id}].window`, asset: portal.window.asset }))
  ];
  for (const panorama of panoramas) {
    const entry = assets[panorama.asset];
    if (!entry || typeof entry.path !== 'string') continue;
    // Um panorama remoto não se mede daqui (D64): a forma dele é do servidor que o serve.
    if (isRemotePath(entry.path)) {
      skipped.push(`${panorama.what}: the shape of "${entry.path}" was not measured (it is remote)`);
      continue;
    }
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

  // ---- L24: three to five doors per room, one of them to the gate ----
  //
  // The gate is not a room: it is where the visitor comes in, and it has a door per world. The
  // minimum is choice (two doors is a corridor) and the maximum belongs to the rule, not to the
  // ring: at 60 m, six doors would still be 60 m apart — what six doors lose is the room being a
  // room (D77).
  const worldSlug = scene.world && scene.world.slug;
  if (!fixture && worldSlug !== ENTRY_WORLD) {
    const roomDoors = scene.portals || [];
    if (roomDoors.length < MIN_DOORS || roomDoors.length > MAX_DOORS) {
      err(`the world has ${roomDoors.length} door(s) — law L24 (a room has three to five, or it is ` +
        `not a room)`);
    }
    const toEntry = roomDoors.filter((portal) => (portal.action || {}).target === ENTRY_WORLD).length;
    if (toEntry !== 1) {
      err(`${toEntry} door(s) to the gate ("${ENTRY_WORLD}") — law L24 (exactly one, or the visitor ` +
        `has no way back)`);
    }
  }

  // ---- L29: a moving door is reachable for at least half the cycle (D87) ----
  //
  // A conta vive em `reach.js` — a mesma que o sorteio usa para recusar um sorteio e a mesma que o
  // instrumento mede. A oscilação tem dois períodos independentes, por isso a amostra é o par de fases
  // (translação × rotação) e não um ciclo só.
  for (const portal of scene.portals || []) {
    if (!portal.motion || portal.motion.kind !== 'sway') continue;
    const alcance = alcanceDaPorta(portal);
    if (alcance.percentagem < ALCANCE_MINIMO) {
      err(`portals[${portal.id}]: it oscillates and the visitor only reaches it in ` +
        `${alcance.percentagem.toFixed(1)}% of the cycle — law L29 (at least ${ALCANCE_MINIMO}%: a ` +
        `door that spends most of the time out of reach is a door that takes the visitor nowhere)`);
    }
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

// L26 (D78): o giro do retrato de cada porta de mundo é o que a conta dá. A janela mostra o fundo do
// destino **ao vivo** (D53), e esse fundo é ancorado ao azimute do mundo de destino — mas a janela
// está no mundo de origem. Sem o giro, o que se vê pela porta está girado em relação ao que se vê ao
// chegar (medido na porta 38 da sala 10: **27,79** de salto no corte, com a meta em 0,50; com o giro,
// **0,27**). Como a L19, esta lei precisa das duas páginas — o ângulo da porta de chegada está no
// ficheiro do destino —, por isso só a linha de comando a pode provar.
//
// Devolve uma lista `{ from, door, to, expected, found }`; vazia é o caso bom.
export function portraitTurns(scenes) {
  const arrivals = new Map();
  for (const scene of scenes) {
    for (const portal of scene.portals || []) {
      if (typeof portal.arrivalFrom !== 'string') continue;
      arrivals.set(portal.arrivalFrom + ' -> ' + (scene.world && scene.world.slug),
        ringCoordinates(portal.position).angle);
    }
  }

  const wrong = [];
  for (const scene of scenes) {
    const from = scene.world && scene.world.slug;
    for (const portal of scene.portals || []) {
      const window = portal.window || {};
      const action = portal.action || {};
      if (window.kind !== 'preview' || action.kind !== 'navigate') continue;
      const arrival = arrivals.get(from + ' -> ' + action.target);
      if (typeof arrival !== 'number') continue; // sem porta de chegada é a L19 que responde
      const expected = portraitTurn(ringCoordinates(portal.position).angle, arrival);
      const found = typeof window.azimuth === 'number' ? window.azimuth : null;
      if (found === null || angularGap(found, expected) > 0.05) {
        wrong.push({ from: from, door: portal.id, to: action.target, expected: expected, found: found });
      }
    }
  }
  return wrong;
}

// ---- L28: a janela que tem de deixar passar o mundo real ----
//
// Uma porta `dimension-pair` que mostra a dimensão `camera` não desenha nada: quem olha por ela vê o
// `<video>` da câmara, que fica **atrás do canvas**. A janela de uma porta de mundo é uma fotografia
// (o retrato e o recorte) e não tem câmara lá dentro, por isso o dado diz onde é que o fundo ao vivo
// tem de ser furado (D81) — e a conta é a mesma que a ferramenta escreve (`realityHoles`), como a L26
// faz com o giro do retrato. Devolve uma lista `{ from, door, to, expected, found }`; vazia é o caso
// bom.
export function realityWindows(scenes) {
  const byWorld = new Map(scenes.map((scene) => [scene.world && scene.world.slug, scene]));
  const wrong = [];
  for (const scene of scenes) {
    const from = scene.world && scene.world.slug;
    for (const portal of scene.portals || []) {
      const window = portal.window || {};
      const action = portal.action || {};
      if (window.kind !== 'preview' || action.kind !== 'navigate') continue;
      const destination = byWorld.get(action.target);
      if (!destination) continue; // a L11 responde por um destino que não existe
      const expected = realityHoles(destination, from);
      const found = Array.isArray(window.reality) ? window.reality : [];
      if (!sameHoles(found, expected)) {
        wrong.push({ from: from, door: portal.id, to: action.target, expected: expected, found: found });
      }
    }
  }
  return wrong;
}

// The arrival point of a "from" portal, in the space of another portal's box. Position and// rotation of the box are the portal's, so a door that has been turned is handled like the
// collision itself does (js/modules/portal.js, detectTraversal) — and that means the door's own
// yaw counts: `boxRotation` is the rotation of the box *inside* the door, and a door of the ring is
// turned by the ring (`rotation.y = −θ`). Reading only `boxRotation` worked while every door faced
// +Z; with the rings it would prove a box in one place and the scene would collide in another.
function insideBox(point, portal) {
  const doorYaw = Array.isArray(portal.rotation) && typeof portal.rotation[1] === 'number'
    ? portal.rotation[1]
    : 0;
  const boxYaw = Array.isArray(portal.boxRotation) && typeof portal.boxRotation[1] === 'number'
    ? portal.boxRotation[1]
    : 0;
  const offset = [point[0] - portal.position[0], point[1] - portal.position[1], point[2] - portal.position[2]];
  const angle = (-(doorYaw + boxYaw) * Math.PI) / 180;
  const local = [
    offset[0] * Math.cos(angle) + offset[2] * Math.sin(angle),
    offset[1],
    -offset[0] * Math.sin(angle) + offset[2] * Math.cos(angle)
  ];
  const centre = portal.boxPosition || [0, 0, 0];
  const half = portal.box.map((side) => side / 2);
  return [0, 1, 2].every((axis) => Math.abs(local[axis] - centre[axis]) <= half[axis]);
}

// ---- the two rings (L22 and L23) ----

// What is wrong with one ring, one line of the report per object.
//
// Three things: the object is on the circle (radius within the tolerance of the ring), it faces the
// centre (rotation.y = −θ, the same convention the camera and the works use), and the step to its
// neighbour is the step of the ring. The first two are per object; the third is the ring as a whole,
// so it is reported once — the first wrong step says what happened, and the rest would be the same
// sentence.
function ringErrors(objects, radius, what, err) {
  const angles = [];
  for (const object of objects) {
    const at = ringCoordinates(object.position);
    if (Math.abs(at.radius - radius) > RING.radiusTolerance) {
      err(`${what}[${object.id}]: ${at.radius.toFixed(1)} m from the centre and the ring is at ` +
        `${radius} m — law L22 (the works and the doors are two circles around the point where the ` +
        `visitor comes in)`);
      continue;
    }
    const yaw = Array.isArray(object.rotation) && typeof object.rotation[1] === 'number'
      ? object.rotation[1]
      : 0;
    if (angularGap(-at.angle, yaw) > RING.angleTolerance) {
      err(`${what}[${object.id}]: rotation.y is ${yaw} and the object looks at ${(-at.angle).toFixed(1)} ` +
        `— law L22 (the front of every object of a ring looks at the centre)`);
    }
    angles.push(at.angle);
  }

  if (angles.length < 2) return;
  const sorted = angles.slice().sort((a, b) => a - b);
  const step = 360 / sorted.length;
  for (let index = 0; index < sorted.length; index++) {
    const next = (sorted[(index + 1) % sorted.length] - sorted[index] + 360) % 360;
    if (Math.abs(next - step) > RING.angleTolerance) {
      err(`${what}: the step between two neighbours is ${next.toFixed(1)}° and the ring asks for ` +
        `${step.toFixed(1)}° — law L22 (equal steps inside a ring)`);
      return;
    }
  }
}

// The closest pair between the two rings (L23): a work between the visitor and a door hides the axis
// of the door, and what is asked is the half-width of the work plus the margin of D77. Measured on
// the data, not on the ring the rule would have written — so a ring that was dragged still gets the
// honest answer.
function clearanceErrors(artworks, portals, err) {
  if (artworks.length === 0 || portals.length === 0) return;
  const widths = artworks
    .map((artwork) => (artwork.size && Number(artwork.size[0])) || 0)
    .filter((width) => width > 0);
  const needed = requiredClearance(widths.length > 0 ? Math.max.apply(null, widths) : 4, RING.artworks.radius);

  let closest = { gap: Infinity, artwork: null, portal: null };
  for (const portal of portals) {
    const door = ringCoordinates(portal.position);
    for (const artwork of artworks) {
      const work = ringCoordinates(artwork.position);
      const gap = angularGap(door.angle, work.angle);
      if (gap < closest.gap) closest = { gap: gap, artwork: artwork, portal: portal };
    }
  }
  if (closest.gap < needed) {
    err(`portals[${closest.portal.id}] and artworks[${closest.artwork.id}] are ${closest.gap.toFixed(1)}° ` +
      `apart and ${needed.toFixed(1)}° are asked — law L23 (the work stands in front of the axis of ` +
      `the door)`);
  }
}

// As salas com o mesmo conjunto de destinos (lei L25).
//
// A regra da D77 quer as portas de cada sala escolhidas **de forma diferente em cada uma**: quem
// entra em duas salas não deve encontrar o mesmo corredor. O conjunto não conta a ordem nem a porta
// do portão (todas as salas têm uma).
//
// Como `unreachableWorlds` e `missingArrivals`, precisa de todos os ficheiros de uma vez: a exposição
// carrega um mundo e nunca vê os outros (D14), por isso só a linha de comando pode perguntar isto.
export function repeatedDestinations(scenes, entrySlug) {
  const bySignature = new Map();
  for (const scene of scenes) {
    const slug = scene.world && scene.world.slug;
    if (!slug) continue;
    const destinations = (scene.portals || [])
      .map((portal) => (portal.action || {}).target)
      .filter((target) => typeof target === 'string' && target !== entrySlug)
      .sort();
    if (destinations.length === 0) continue;
    const signature = destinations.join('+');
    if (!bySignature.has(signature)) bySignature.set(signature, []);
    bySignature.get(signature).push(slug);
  }
  return [...bySignature.entries()]
    .filter((entry) => entry[1].length > 1)
    .map((entry) => ({ destinations: entry[0].split('+'), worlds: entry[1] }));
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
