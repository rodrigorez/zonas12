// --- CORE ---
// The scene state, the registries and the stencil rules live in js/core/ (decision D1).
// This file is the application: the bootstrapping and the bridge to the interface.
//
// Since Fase 3 the scene comes from data: this file loads data/scene.json, has it checked against
// the format and the laws, and hands it to the scene builder. The camera, artwork, dimension and
// portal modules live in js/modules/; the format, its validation and the build live in js/scene/.
import {
  state,
  applyStencilState,
  syncStencilValues,
  setActiveDimension,
  on
} from './core/index.js';
import { startSession } from './modules/camera.js';
import { closeArtwork, toggleArtworkLabels } from './modules/artwork.js';
import { startFrameDriver } from './modules/portal.js';
import { validateScene } from './scene/validation.js';
import { buildScene } from './scene/scene-builder.js';
import { initI18n, languageFromUrl } from './i18n.js';
// Registers the `ar-config` component. It lives in js/scene/ because the scene's renderer settings
// are the scene's: the editor's preview needs the same ones (Fase 4), and two copies would be two
// sources of the drawing rules (law L6).
import './scene/render-config.js';

// --- DEBUG AND TEST HANDLE ---
// The console and the regression scripts (docs/ROADMAP.md section 10) drive the scene
// through this. The application itself does not use it.
window.portalAR = state;
window.portalDebug = {
  state: state,
  // Which world the page is showing (D28), for the console and the regression scripts. `state`
  // holds what the scene is made of; this says which file it was read from.
  world: null,
  setActiveDimension: setActiveDimension,
  applyStencilState: applyStencilState,
  syncStencilValues: syncStencilValues,
  on: on
};

// Development keyboard shortcuts: one listener for the whole scene, walking the portal
// registry. Registering one listener per portal (as before) left a dead listener behind for
// every portal created and destroyed — and the removed portal stayed alive in the closure,
// with no way of being collected. Creating and destroying portals in a loop is test T9
// (docs/ROADMAP.md section 10).
//
// The same key shows the **name** of every door (D39) and of every work (D40): they are both part of
// the debug view, and one key for the two is one thing to remember.
document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key !== 'r' && key !== 'd') return;
  if (key === 'd') toggleArtworkLabels();
  state.portals.slice().forEach(function (portal) {
    if (key === 'r') portal.rotate();
    else portal.toggleDebugMode();
  });
});

// --- THE WORLD, FROM DATA ---
// One file per world (D24) and one arranque per world: the gate is the root page and a room is a
// folder of its own (D28). The arranque is the same file everywhere — it only differs in the `<base>`
// that says how deep it is — and the world it serves is what is left of the path after that base:
// `/praia/` is the world `praia`, and the root is the gate. `?scene=<slug>` overrides it, for the
// fixture of D9 and for opening a room before its folder exists.
const DEFAULT_WORLD = 'gate';
const WORLD_NAME = /^[a-z0-9-]+$/;

function worldFromPath() {
  const base = new URL(document.baseURI).pathname;
  const here = window.location.pathname;
  const rest = here.startsWith(base) ? here.slice(base.length) : '';
  const slug = rest.split('/').filter(Boolean)[0];
  return slug && WORLD_NAME.test(slug) ? slug : DEFAULT_WORLD;
}

function requestedWorld() {
  const requested = new URLSearchParams(window.location.search).get('scene');
  if (!requested) return worldFromPath();
  if (!WORLD_NAME.test(requested)) {
    console.warn('[scene] "' + requested + '" is not a world name; loading ' + worldFromPath());
    return worldFromPath();
  }
  return requested;
}

async function loadScene() {
  const file = 'data/worlds/' + requestedWorld() + '.json';
  const response = await fetch(file);
  if (!response.ok) throw new Error(file + ': HTTP ' + response.status);
  return response.json();
}

async function buildFromData() {
  const data = await loadScene();
  window.portalDebug.world = data.world.slug;
  const report = validateScene(data);

  // The console is a test (T8): a scene that is fine says nothing at all. What cannot be checked
  // here — whether the file of an asset exists on disk, or the shape of an image — is the command
  // line's job (tools/scene/validate.mjs).
  if (!report.ok) {
    report.errors.forEach((error) => console.error('[scene] ' + error));
    return false;
  }
  report.warnings.forEach((warning) => console.warn('[scene] ' + warning));

  // The build is asynchronous because the assets have to be loaded before the components that
  // use them are created (see scene-builder.js). `from` is the world the visitor came from, when
  // they came through a door (D14).
  const from = new URLSearchParams(window.location.search).get('from');
  await buildScene(data, { from });
  return true;
}

// Arriving through a door is not a first visit. Each world is a page of its own (D24), so the door
// navigates and the page loads again — and until D37 that meant asking the visitor to activate the
// exhibition in every room, even the ones with no camera to ask for. The `?from=<slug>` a door writes
// is exactly the fact that they came through one (D14), and it is what starts the page by itself. The
// button stays in the markup, for the first visit and as the fallback if the camera is refused.
function arrivedFromADoor() {
  const from = new URLSearchParams(window.location.search).get('from');
  return typeof from === 'string' && WORLD_NAME.test(from);
}

// The frame driver starts only after the build: until then there is no portal to walk, and the
// camera the collision asks for does not exist yet either.
//
// The catalogue comes first: the interface is written with keys and the texts only arrive when this
// resolves (D12). A scene that is fine still says nothing in the console (test T8).
async function start() {
  await initI18n(languageFromUrl());
  const built = await buildFromData();
  if (built) startFrameDriver();
  if (arrivedFromADoor()) startSession({ arrival: true });
}

start().catch((error) => console.error('[scene] the scene could not be built:', error));

// --- THE INTERFACE'S BUTTONS ---
// Bound here instead of with inline attributes (`onclick`), which were the last code in the HTML
// and are gone since Fase 4: the markup carries a key, never a call. `js/app.js` is the exhibition's
// entry point, so it is what knows these two buttons exist — the modules do not.
function bind(id, handler) {
  const element = document.getElementById(id);
  if (element) element.addEventListener('click', handler);
}

bind('btn-iniciar', startSession);
bind('btn-fechar-obra', closeArtwork);
