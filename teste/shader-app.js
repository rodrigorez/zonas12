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
import { createShaderDimension } from './dimension-shader.js';
import { createEngine } from './engine.js';

const params = new URLSearchParams(location.search);
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

// Faixa do pixelRatio: nunca acima de PR_MAX (ganho pequeno, custo alto) nem abaixo de PR_MIN (borrado).
const PR_MAX = 2;
const PR_MIN = 1;
const MEMORY_DAYS = 30;
const fixedRatio = Number(params.get('pr')) > 0;
const adaptive = !fixedRatio && params.get('adapt') !== '0';

function sceneEl() { return document.querySelector('a-scene'); }

function memoryKey() {
  const gl = document.createElement('canvas').getContext('webgl');
  const ext = gl && gl.getExtension('WEBGL_debug_renderer_info');
  return 'zonas-pr:' + (ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '?') + '|' + screen.width + 'x' + screen.height;
}

// O que este aparelho já mostrou aguentar, de uma visita anterior (vale MEMORY_DAYS dias).
function readMemory() {
  try {
    const saved = JSON.parse(localStorage.getItem(memoryKey()));
    if (saved && Date.now() - saved.at < MEMORY_DAYS * 86400000) return saved;
  } catch (error) { /* sem memória */ }
  return null;
}

const memory = adaptive && params.get('memoria') !== '0' ? readMemory() : null;
const clampRatio = (value) => Math.min(PR_MAX, Math.max(PR_MIN, value));

const resolution = adaptive ? {
  min: PR_MIN,
  max: Math.min(PR_MAX, devicePixelRatio),
  badAt: memory ? memory.badAt : 0,
  get: () => sceneEl().renderer.getPixelRatio(),
  set: (value) => { sceneEl().renderer.setPixelRatio(value); sceneEl().resize(); },
  save: (state) => {
    try { localStorage.setItem(memoryKey(), JSON.stringify({ ...state, at: Date.now() })); } catch (error) { /* ignora */ }
  }
} : null;

const engine = createEngine({ fps, resolution });
window.testeEngine = engine;

function renderRatio() {
  const scene = document.querySelector('a-scene');
  return scene && scene.renderer ? scene.renderer.getPixelRatio() : null;
}

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
    tipoFundo: 'shader',
    pixelRatioAplicado: renderRatio(),
    antialias: params.get('aa') !== '0',
    ajusteAutomatico: adaptive, faixaPixelRatio: [PR_MIN, PR_MAX], memoria: memory
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
      c.animated + '/' + c.visible + ' visíveis | desenho ' + c.drawMs.toFixed(1) + ' ms | pr ' + renderRatio().toFixed(2) + (adaptive ? ' auto' : ' fixo') + ' | aa ' + (params.get('aa') !== '0' ? 'on' : 'off');
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

  // ?pr= fixa o pixelRatio e desliga o ajuste; ?adapt=0 desliga o ajuste; ?aa=0 desliga o antialias.
  // Sem parâmetros: começa na memória do aparelho ou no máximo permitido, e o motor ajusta.
  const requestedRatio = Number(params.get('pr'));
  const initial = fixedRatio ? requestedRatio : adaptive ? clampRatio(memory ? memory.ratio : Math.min(PR_MAX, devicePixelRatio)) : 0;
  if (initial > 0) {
    parent.renderer.setPixelRatio(initial);
    parent.resize();
  }

  createPlayerCamera({ position: [0, 1.6, 0], speed: 0.1 }, parent);
  useRealCamera(true);

  [0, 1, 2, 3, 4].forEach((id) => createShaderDimension({ id, shader: id }, parent));

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
