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

AFRAME.registerComponent('config-ar', {
  init: function () {
    this.el.setAttribute('embedded', '');
    this.aplicarConfigRenderer();
    this.el.addEventListener('render-target-loaded', () => this.aplicarConfigRenderer());
  },
  aplicarConfigRenderer: function () {
    let renderer = this.el.renderer;
    if (!renderer) return;
    renderer.setClearColor(0x000000, 0);
    // Confirma o que o A-Frame 1.8.0 já fixa ao inicializar o sistema do renderer
    // (src/systems/renderer.js): com sortObjects a false o three ignora o renderOrder e
    // desenha pela ordem da árvore, o que só funciona por acaso com um portal. Com vários,
    // as máscaras têm de ser desenhadas antes de todo o conteúdo.
    // (renderOrder: máscara 1, panorama 2, obras 3, moldura 4)
    renderer.sortObjects = true;
    // O stencil é limpo a 0 em cada frame; 0 significa "nenhuma janela aqui".
    renderer.autoClearStencil = true;
  }
});

// Atalhos de teclado de desenvolvimento: um ouvinte só para a cena inteira, a iterar o
// registo dos portais. Registar um ouvinte por portal (como antes) deixava um ouvinte morto
// por cada portal criado e destruído — e o portal removido ficava vivo na closure, sem poder
// ser recolhido. Criar e destruir portais em ciclo é o teste T9 (docs/ROADMAP.md secção 10).
document.addEventListener('keydown', (evento) => {
  let tecla = evento.key.toLowerCase();
  if (tecla !== 'r' && tecla !== 'd') return;
  state.portals.slice().forEach(function (portal) {
    if (tecla === 'r') portal.rotate();
    else portal.toggleDebugMode();
  });
});

// --- TEMPORARY BRIDGE TO THE INTERFACE ---
// index.html still calls these from inline attributes (onclick) and from its own inline
// script. Now that this file is a module, its scope is no longer global, so they have to be
// reachable from window. Removed in Fase 4, when the interface becomes a module with its
// own listeners.
window.fecharObra = closeArtwork;
window.configurarBotoesMobile = setupMobileControls;
window.tratarErroCamera = reportCameraError;
