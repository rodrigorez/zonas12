// --- CORE ---
// The scene state, the registries and the stencil rules live in js/core/ (decision D1).
// This file is the application: the bootstrapping and the bridge to the interface. The camera,
// artwork, dimension and portal modules live in js/modules/ (docs/ROADMAP.md, Fase 2).
import {
  state,
  registerContent,
  applyStencilState,
  syncStencilValues,
  setActiveDimension,
  on
} from './core/index.js';
import { setupMobileControls, reportCameraError } from './modules/camera.js';
import { closeArtwork } from './modules/artwork.js';
import './modules/dimension.js';
import { startFrameDriver } from './modules/portal.js';

// --- DEBUG AND TEST HANDLE ---
// The console and the regression scripts (docs/ROADMAP.md section 10) drive the scene
// through this. The application itself does not use it.
window.portalAR = state;
window.portalDebug = {
  state: state,
  setActiveDimension: setActiveDimension,
  applyStencilState: applyStencilState,
  syncStencilValues: syncStencilValues,
  registerContent: registerContent,
  on: on
};

// The per-frame driver belongs to the portal module (decision D19): it walks the portal
// registry and hands the dimensions the windows show to the core, which is the only place that
// assigns stencil values.
startFrameDriver();

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

// --- TEMPORARY BRIDGE TO THE INTERFACE ---
// index.html still calls these from inline attributes (onclick) and from its own inline
// script. Now that this file is a module, its scope is no longer global, so they have to be
// reachable from window. The three names are the interface's, so they keep their Portuguese
// spelling until Fase 4 removes the bridge with the inline script.
window.fecharObra = closeArtwork;
window.configurarBotoesMobile = setupMobileControls;
window.tratarErroCamera = reportCameraError;
