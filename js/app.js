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
import { closeArtwork } from './modules/artwork.js';
import { startFrameDriver } from './modules/portal.js';
import { validateScene } from './scene/validation.js';
import { buildScene } from './scene/scene-builder.js';

// --- DEBUG AND TEST HANDLE ---
// The console and the regression scripts (docs/ROADMAP.md section 10) drive the scene
// through this. The application itself does not use it.
window.portalAR = state;
window.portalDebug = {
  state: state,
  setActiveDimension: setActiveDimension,
  applyStencilState: applyStencilState,
  syncStencilValues: syncStencilValues,
  on: on
};

AFRAME.registerComponent('ar-config', {
  init: function () {
    this.el.setAttribute('embedded', '');
    this.applyRendererConfig();
    this.el.addEventListener('render-target-loaded', () => this.applyRendererConfig());
  },
  applyRendererConfig: function () {
    const renderer = this.el.renderer;
    if (!renderer) return;
    renderer.setClearColor(0x000000, 0);
    // Confirms what A-Frame 1.8.0 already fixes when it initialises the renderer system
    // (src/systems/renderer.js): with sortObjects false, three ignores the renderOrder and
    // draws in tree order, which only works by accident with a portal. With several, the masks
    // have to be drawn before all the content.
    // (renderOrder: mask 1, panorama 2, artworks 3, frame 4)
    renderer.sortObjects = true;
    // The stencil is cleared to 0 every frame; 0 means "no window here".
    renderer.autoClearStencil = true;
  }
});

// Development keyboard shortcuts: one listener for the whole scene, walking the portal
// registry. Registering one listener per portal (as before) left a dead listener behind for
// every portal created and destroyed — and the removed portal stayed alive in the closure,
// with no way of being collected. Creating and destroying portals in a loop is test T9
// (docs/ROADMAP.md section 10).
document.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (key !== 'r' && key !== 'd') return;
  state.portals.slice().forEach(function (portal) {
    if (key === 'r') portal.rotate();
    else portal.toggleDebugMode();
  });
});

// --- THE SCENE, FROM DATA ---
// One name per file: `?scene=example` loads the fixture of D9 (data/scene-example.json). Any
// other value is a typo, and the exhibition loads with its own scene.
const DEFAULT_SCENE = 'data/scene.json';
const SCENE_FILES = { example: 'data/scene-example.json' };

async function loadScene() {
  const requested = new URLSearchParams(window.location.search).get('scene');
  let file = DEFAULT_SCENE;
  if (requested) {
    if (SCENE_FILES[requested]) file = SCENE_FILES[requested];
    else console.warn('[scene] there is no scene called "' + requested + '"; loading ' + DEFAULT_SCENE);
  }
  const response = await fetch(file);
  if (!response.ok) throw new Error(file + ': HTTP ' + response.status);
  return response.json();
}

async function buildFromData() {
  const data = await loadScene();
  const report = validateScene(data);

  // The console is a test (T8): a scene that is fine says nothing at all. What cannot be checked
  // here — whether the file of an asset exists on disk — is the command line's job
  // (tools/scene/validate.mjs).
  if (!report.ok) {
    report.errors.forEach((error) => console.error('[scene] ' + error));
    return false;
  }
  report.warnings.forEach((warning) => console.warn('[scene] ' + warning));

  // The build is asynchronous because the assets have to be loaded before the components that
  // use them are created (see scene-builder.js).
  await buildScene(data);
  return true;
}

// The frame driver starts only after the build: until then there is no portal to walk, and the
// camera the collision asks for does not exist yet either.
buildFromData()
  .then((built) => { if (built) startFrameDriver(); })
  .catch((error) => console.error('[scene] the scene could not be built:', error));

// --- TEMPORARY BRIDGE TO THE INTERFACE ---
// index.html still calls these two from inline attributes (`onclick`). The names are the
// interface's, so they keep their Portuguese spelling until Fase 4 takes the inline attributes
// away. `configurarBotoesMobile` and `tratarErroCamera` left the bridge with the inline script
// that used to call them: `startSession` (js/modules/camera.js) is what drives both now.
window.iniciarCena = startSession;
window.fecharObra = closeArtwork;
