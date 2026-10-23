// Arranque do ambiente de teste: a mesma arquitetura da exposição (câmera real atrás, cena com
// stencil, portais entre dimensões), mas com 5 fundos esféricos desenhados pelo p5.js e um motor
// que decide sozinho quantos deles animar.
//
// Dimensão 0 é a ativa; 1–4 são fundos p5; 5 é a câmera real (sem entidade). Cada porta mostra uma
// dimensão diferente de 0, por isso todas as 5 podem estar visíveis ao mesmo tempo.
import { state, setActiveDimension } from '../js/core/index.js';
import { startSession, cameraAlreadyAllowed, showStartButton, createPlayerCamera, useRealCamera } from '../js/modules/camera.js';
import { createPortal, setWorld, setNavigation, startFrameDriver } from '../js/modules/portal.js';
import { withDefaults } from '../js/scene/scene-builder.js';
import { SCENE } from '../js/scene/schema.js';
import { initI18n, languageFromUrl } from '../js/i18n.js';
import '../js/scene/render-config.js';
import { createP5Dimension } from './dimension-p5.js';
import { createEngine } from './engine.js';

const params = new URLSearchParams(location.search);
const width = Number(params.get('res')) || 1024;
const fps = Number(params.get('fps')) || 30;

const DOORS = [
  { x: -50, shows: 1 },
  { x: -25, shows: 2 },
  { x: 0, shows: 5 },
  { x: 25, shows: 3 },
  { x: 50, shows: 4 }
];

function doorData(index, door) {
  return withDefaults({
    id: 100 + index, ownedBy: -1, position: [door.x, 0, -80], width: 10, height: 12,
    box: [12, 16, 1], boxPosition: [0, 8, 0], boxRotation: [0, 0, 0], trigger: 'plane',
    frame: { color: '#ff0000', thickness: 0.3 },
    window: { kind: 'dimension-pair', dimensionA: 0, dimensionB: door.shows },
    action: { kind: 'enter-window' }
  }, SCENE.portals);
}

const engine = createEngine({ fps });
window.testeEngine = engine;

function deviceInfo() {
  const gl = document.createElement('canvas').getContext('webgl');
  const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
  const video = document.getElementById('webcam-video');
  return {
    userAgent: navigator.userAgent, nucleos: navigator.hardwareConcurrency, memoriaGB: navigator.deviceMemory,
    pixelRatio: devicePixelRatio, tela: innerWidth + '×' + innerHeight,
    gpu: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : 'desconhecida',
    camera: video && video.videoWidth ? 'ligada' : 'desligada',
    resolucaoCamera: video && video.videoWidth ? video.videoWidth + '×' + video.videoHeight : null,
    resolucaoFundo: width + '×' + width / 2
  };
}

function setupHud() {
  const hud = document.getElementById('hud');
  const buttons = [...document.querySelectorAll('#hud-botoes button[data-mode]')];
  buttons.forEach((button) => button.addEventListener('click', () => {
    engine.setMode(button.dataset.mode);
    buttons.forEach((other) => other.classList.toggle('on', other === button));
  }));
  document.getElementById('btn-copiar').addEventListener('click', async (event) => {
    const text = JSON.stringify({ dispositivo: deviceInfo(), ...engine.snapshot() }, null, 1);
    try { await navigator.clipboard.writeText(text); event.target.textContent = 'Copiado!'; }
    catch (error) { window.prompt('Copie o log:', text); }
    setTimeout(() => { event.target.textContent = 'Copiar log'; }, 1500);
  });
  setInterval(() => {
    const c = engine.current;
    hud.textContent = 'modo ' + c.mode + ' | fps ' + c.fps.toFixed(0) + ' | p95 ' + c.p95.toFixed(1) + ' ms | animados ' +
      c.animated + '/' + c.visible + ' visíveis | desenho ' + c.drawMs.toFixed(1) + ' ms | dim ' + state.activeDimension;
  }, 500);
}

async function start() {
  await initI18n(languageFromUrl());
  const auto = await cameraAlreadyAllowed();
  if (!auto) showStartButton();

  setWorld('teste');
  setNavigation(false);
  const parent = document.querySelector('a-scene');
  if (!parent.hasLoaded) await new Promise((resolve) => parent.addEventListener('loaded', resolve, { once: true }));

  createPlayerCamera({ position: [0, 1.6, 0], speed: 0.1 }, parent);
  useRealCamera(true);

  const built = [0, 1, 2, 3, 4].map((id) => createP5Dimension({ id, sketch: id, width }, parent));
  await Promise.all(built.map((entry) => entry.ready));

  DOORS.forEach((door, index) => createPortal(doorData(index, door), parent, { label: 'Fundo ' + door.shows }));
  setActiveDimension(0);
  startFrameDriver();
  if (auto) startSession({ arrival: true });
  setupHud();
  engine.start();
}

start().catch((error) => {
  console.error(error);
  document.getElementById('hud').textContent = 'erro: ' + error.message;
});
