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
import { startSession, cameraAlreadyAllowed, cameraFirstFrame, showStartButton, showLoading } from './modules/camera.js';
import { playerCamera } from './modules/camera.js';
import { closeArtwork, toggleArtworkLabels } from './modules/artwork.js';
import { startFrameDriver, traversalRecord, freezeMotion } from './modules/portal.js';
import { shaderStatus, freezeShaders } from './modules/dimension.js';
// A sonda de campo (R14): só desenha alguma coisa com `?sonda=1`, e é o que permite ler os números
// num telemóvel, onde não há consola.
import { startSonda } from './modules/sonda.js';
// O ensaio do A/B do fundo (R14): com `?ensaio=1` faz as duas fases e mostra um bloco só.
import { startEnsaio } from './modules/ensaio.js';
import { orientationStatus } from './modules/orientation.js';
import { validateScene } from './scene/validation.js';
import { buildScene } from './scene/scene-builder.js';
import { textIn } from './scene/schema.js';
import { startAnalytics, pageLocation } from './scene/analytics.js';
import { RETURN_PARAMETER, takePose } from './scene/return-pose.js';
import { initI18n, languageFromUrl, currentLanguage } from './i18n.js';
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
  on: on,
  // Which backgrounds were built and how the shader cadence is going (R14/R15) — what the shader
  // battery reads instead of guessing from pixels.
  shader: () => shaderStatus(),
  // How the phone's orientation sensor was judged (D52): whether the magic-window stayed on, and the
  // noise floor that decided it.
  orientation: () => orientationStatus(),
  // A última travessia que esta sessão pediu (D55): a página que sai escreve-a e a que chega lê-a,
  // por isso é o que diz se um atravessar sem mudar de página ficou a meio.
  traversal: () => traversalRecord(),
  // The tests compare captures of the same scene (R16): a background that animates changes every
  // pixel between them. This is the lever that stops it, and it is the visitor's own
  // `prefers-reduced-motion` mechanism. Uma porta em movimento (D59) é a mesma história: o lever pára
  // as duas coisas, porque quem o puxa quer o ecrã parado e não meio parado.
  freezeShaders: () => {
    const stopped = freezeShaders();
    freezeMotion(true);
    return stopped;
  },
  // O movimento das portas, sozinho (D59), para um instrumento que só olha para elas.
  freezeMotion: (frozen) => freezeMotion(frozen),
  // Onde a câmara está e para onde olha (D63): é o que o regresso da ficha guarda e devolve, e é o
  // que os instrumentos leem para provar que o visitante voltou ao mesmo sítio.
  pose: () => playerCamera.pose()
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
// `/scene2/` is the world `scene2`, and the root is the gate. `?scene=<slug>` overrides it, for the
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

  // O regresso da ficha (D63): quem abriu uma obra e voltou é devolvido ao sítio onde estava — a
  // posição, o olhar e a dimensão —, em vez de ao início do mundo. A ficha pede-o com `?volta=1`, e
  // sem um ponto guardado (ou com um de outra visita, já velho) nada acontece.
  if (new URLSearchParams(window.location.search).get(RETURN_PARAMETER) === '1') {
    const ponto = takePose(data.world && data.world.slug);
    if (ponto) {
      setActiveDimension(ponto.dimension);
      const aplicado = playerCamera.setPose(ponto);
      window.portalDebug.returned = Object.assign({ aplicado: aplicado }, ponto);
    }
  }

  // A medição da sala (D62): uma propriedade por mundo, e o ID mora no dado. Sem ID não acontece
  // nada — nenhum script, nenhum pedido, nenhuma linha na consola.
  window.portalDebug.analytics = startAnalytics({
    id: data.world && data.world.analytics && data.world.analytics.id,
    title: textIn(data.world && data.world.name, currentLanguage()) || data.world.slug,
    location: pageLocation(window.location.href, ['scene'])
  });
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
//
// Two reasons for the page to start by itself, and neither of them is a first visit: the visitor came
// through a door (D37), or they have already allowed the camera in a previous visit (D41) — the
// browser remembers the gesture, so there is nothing to ask them again. On a browser that cannot
// answer the second question (Safari), the button stays and the visitor gives the gesture (D34).
//
// The **button is decided before the scene is built** (D42): it is hidden in the markup and only
// appears when it is the missing thing. The build waits for every asset — seconds on a phone — and a
// button painted over a black screen while the page loads is what one used to see in the middle of a
// portal transition (measured in the author's screen recording). While it loads, an arrival shows the
// loading line instead of an empty screen.
async function start() {
  await initI18n(languageFromUrl());
  const arriving = arrivedFromADoor();
  if (arriving) showLoading();
  const auto = arriving || await cameraAlreadyAllowed();
  if (!auto) showStartButton();
  sceneReady = buildFromData();
  const built = await sceneReady;
  if (built) startFrameDriver();
  if (!built) return;
  // The field probe shows what the page is doing, for whoever is testing on a phone (R14). It is
  // created after the build, so it never measures a scene that does not exist yet.
  startSonda();
  // O ensaio do A/B (R14): com `?ensaio=1` mede os dois lados do fundo sozinho, recarrega e mostra um
  // bloco só. Também depois do build, pela mesma razão da sonda — e porque a segunda fase precisa de
  // uma cena a desenhar para medir alguma coisa.
  startEnsaio();
  if (auto) startSession({ arrival: true });
  // The image bridge has done its work once there is a scene to look at (D43): what the visitor sees
  // from here on is the world, and the frame that was covering the wait goes in the same frame — no
  // fade, because a cross-dissolve between two pictures of the same place is seen as an effect (D44).
  //
  // It waits for **both** things: two frames drawn (the canvas has to be on the screen before the
  // picture over it goes) and the camera's first frame when the world shows the camera (D45) — taking
  // the picture away first left the black of the empty `<video>` showing, which is the frame of camera
  // the author saw in the middle of a crossing.
  if (window.arrivalFrame) {
    const drawn = new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    drawn.then(cameraFirstFrame).then(() => window.arrivalFrame.hide());
  }
}

// The click is bound at module level, before the scene exists: a visitor who taps the button while the
// assets load is not ignored — the session starts when there is a scene to start.
let sceneReady = null;

start().catch((error) => console.error('[scene] the scene could not be built:', error));

// --- THE INTERFACE'S BUTTONS ---
// Bound here instead of with inline attributes (`onclick`), which were the last code in the HTML
// and are gone since Fase 4: the markup carries a key, never a call. `js/app.js` is the exhibition's
// entry point, so it is what knows these two buttons exist — the modules do not.
function bind(id, handler) {
  const element = document.getElementById(id);
  if (element) element.addEventListener('click', handler);
}

bind('btn-iniciar', async () => {
  if (sceneReady) await sceneReady;
  startSession();
});
bind('btn-fechar-obra', closeArtwork);
