// The camera module. It is the only file in the project that knows how to find the player
// rig, so the panorama, the portal and the on-screen D-pad ask it for a position instead of
// reaching for the element themselves (docs/ROADMAP.md, A5).
//
// It owns two things: the player camera (where the visitor is) and the real camera (the
// webcam stream behind dimension 0), plus the interface that only makes sense while the
// webcam is being requested — the loading overlay and the error message.
//
// Since Fase 3 the camera comes from the data too: `createPlayerCamera` builds it from
// `cameras.player` and the module keeps the element, so there is no selector here any more —
// looking for `a-camera` by name was the second place that knew where the camera lives.
//
// Nothing here knows about dimensions, portals, stencil or draw order.

import { t } from '../i18n.js';

// Step of the on-screen D-pad, in metres per frame. It is the fallback: the value comes from the
// data (cameras.player.speed) and `createPlayerCamera` replaces it. The converter reads this
// constant to write the JSON, which is what keeps the two from drifting.
const MOBILE_SPEED = 0.1;

// What the rig is, in code: where it starts and how fast the D-pad walks is data, but the
// controls themselves (the pointer lock, the keyboard acceleration and the cursor) are the
// application's, not something a scene author writes.
const CAMERA_RIG = {
  lookControls: { pointerLockEnabled: false },
  wasdControls: { acceleration: 45 },
  cursor: { color: '#ffffff', opacity: 0.8, objects: '.interactable' }
};

const held = { forward: false, backward: false, left: false, right: false };

let playerEl = null;
let mobileSpeed = MOBILE_SPEED;
let realCameraEnabled = false;
// The stream of the webcam, once there is one (D41): the button asks this, not the click.
let stream = null;

// A-Frame's vec3 in the object form needs { x, y, z }: an array there is read as an object with
// no axes and falls back to the default, silently (measured in A-Frame 1.8,
// utils/coordinates.js parse). The data writes vectors as arrays, so the factory translates.
const vector = (value) => ({ x: value[0], y: value[1], z: value[2] });

function playerElement() {
  return playerEl;
}

// The player camera. `position()` is the position of the element and `worldPosition()` the
// position in the world — the panorama follows the first, the collision box needs the second.
export const playerCamera = {
  position: function () {
    const element = playerElement();
    return element ? element.object3D.position : null;
  },

  worldPosition: function (target) {
    const element = playerElement();
    return element ? element.object3D.getWorldPosition(target) : null;
  },

  setPosition: function (position) {
    const element = playerElement();
    if (!element) return false;
    element.object3D.position.set(position.x, position.y, position.z);
    return true;
  }
};

// One frame of the on-screen D-pad movement. The angle comes from the camera itself, so the
// movement turns with whatever `look-controls` is pointing at.
function stepMobileMovement() {
  const element = playerElement();
  if (element) {
    const position = element.object3D.position;
    const angle = element.object3D.rotation.y;
    if (held.forward) {
      position.x -= Math.sin(angle) * mobileSpeed;
      position.z -= Math.cos(angle) * mobileSpeed;
    }
    if (held.backward) {
      position.x += Math.sin(angle) * mobileSpeed;
      position.z += Math.cos(angle) * mobileSpeed;
    }
    if (held.left) {
      position.x -= Math.cos(angle) * mobileSpeed;
      position.z += Math.sin(angle) * mobileSpeed;
    }
    if (held.right) {
      position.x += Math.cos(angle) * mobileSpeed;
      position.z -= Math.sin(angle) * mobileSpeed;
    }
  }
  requestAnimationFrame(stepMobileMovement);
}

function bindPadButton(id, direction) {
  const button = document.getElementById(id);
  // The D-pad is the exhibition's: a host without it wires nothing (R13).
  if (!button) return false;
  const set = function (value) {
    return function (event) {
      event.preventDefault();
      held[direction] = value;
    };
  };
  button.addEventListener('touchstart', set(true));
  button.addEventListener('touchend', set(false));
  button.addEventListener('mousedown', set(true));
  button.addEventListener('mouseup', set(false));
  button.addEventListener('mouseleave', set(false));
  return true;
}

let movementLoopRunning = false;

// Wires the on-screen D-pad and starts the movement loop. The interface calls it when the
// visitor activates the exhibition on a touch device (index.html, the start button).
export function setupMobileControls() {
  const bound = [
    bindPadButton('btn-frente', 'forward'),
    bindPadButton('btn-tras', 'backward'),
    bindPadButton('btn-esq', 'left'),
    bindPadButton('btn-dir', 'right')
  ].filter(Boolean).length;
  // No D-pad in this page, no loop: a frame driver walking a camera nobody can steer is work for
  // nothing — and the editor has no D-pad (R13).
  if (bound === 0 || movementLoopRunning) return;
  movementLoopRunning = true;
  stepMobileMovement();
}

// The loading overlay is interface state, but it belongs here: it is only meaningful while
// the webcam is being requested. Since D42 the entry point also shows it while the assets load, so an
// arrival has something on the screen instead of a black page with a button on it.
//
// Since D43 an arrival already has something on the screen — the last frame of the world it came from
// — and a line appearing over it is itself the sign of a crossing (measured seam: the bridge and the
// arriving world differ by less than one step of walking, so any new element is what one notices).
// The line is therefore only for a screen that would otherwise be empty (D44).
export function showLoading() {
  if (window.arrivalFrame && window.arrivalFrame.element()) return;
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'flex';
}

function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

// The button is the first visit's gesture, and the fallback of an arrival whose camera was refused
// (D37): the browser may be waiting for a gesture, and the visitor is the one who can give it.
//
// It is also the **way to the camera**, so it follows the camera and not the click (D41): whoever has
// a stream has nothing to activate, and the button is hidden the moment the stream exists — even when
// the camera is not in sight (in a room, the camera is only the window of the door that goes back).
// And it starts **hidden in the markup** (D42): it appears when the page has decided that it is what
// is missing, and not before.
function hideStartButton() {
  const start = document.getElementById('btn-iniciar');
  if (!start) return;
  start.hidden = true;
  start.style.display = 'none';
}

export function showStartButton() {
  if (isCameraActive()) return;
  const start = document.getElementById('btn-iniciar');
  if (!start) return;
  start.hidden = false;
  start.style.display = 'block';
}

// Whether the camera is on right now — the question the button asks, and the one a page can answer
// about a stream another part of the app started.
export function isCameraActive() {
  if (!stream) return false;
  const tracks = stream.getVideoTracks();
  return stream.active && tracks.some((track) => track.readyState === 'live');
}

// Whether the browser already has the visitor's permission for the camera, from a previous visit.
// Then there is no gesture to ask for and the exhibition can start by itself (D41). Safari has no
// `camera` in `permissions.query` — it throws, the answer is `false`, and the gesture rule stays.
//
// The answer is waited for at most one second (D42, measured): the question is a convenience, and a
// browser that does not answer it (it happened with the network throttled, and a page that is offline
// behind a captive portal can do the same) must not hold the whole exhibition — the visitor would be
// left with the loading line and no way in. No answer means "unknown", which is the gesture rule.
const PERMISSION_TIMEOUT = 1000;

// How long an arrival waits for the camera's first frame before showing the world anyway (D45). The
// image bridge stays up meanwhile, so this is the most a visitor can be left looking at the picture
// they already had — and a camera that is refused, or that errors, does not wait at all: the refusal
// resolves it and the world appears with the message.
const FIRST_FRAME_TIMEOUT = 3000;

// Whether the camera has **presented** a frame — not merely decoded one. `loadeddata` says a frame
// exists; `requestVideoFrameCallback` says one reached the compositor, and it is the difference
// between a world that shows the camera and a world that shows the black of an empty `<video>`
// (measured: with `loadeddata` alone the gate was black for seconds in one run).
//
// A world whose floor is the camera (the gate) shows that black over the whole screen; a camera
// window shows it in a smaller rectangle. Either way it is a frame of camera inside a crossing, which
// is what the image bridge exists to avoid (D43/D45).
let firstFrame = null;
let finishFirstFrame = null;

export function cameraFirstFrame() {
  if (!realCameraEnabled) return Promise.resolve('no camera in this world');
  if (cameraGaveUp) return Promise.resolve('camera will not show: ' + cameraGaveUp);
  const video = document.getElementById('webcam-video');
  if (!video) return Promise.resolve('no surface for the camera');
  if (video.readyState >= 2 && video.videoWidth > 0 && !video.paused) {
    // Already running: one frame presented is what the asking page needs, and it is already past.
    return Promise.resolve('already there');
  }
  if (firstFrame) return firstFrame;
  firstFrame = new Promise((resolve) => {
    const done = (why) => {
      if (!finishFirstFrame) return;
      clearTimeout(limit);
      const finish = finishFirstFrame;
      finishFirstFrame = null;
      finish(why);
    };
    const limit = setTimeout(() => done('timeout'), FIRST_FRAME_TIMEOUT);
    finishFirstFrame = resolve;
    if (typeof video.requestVideoFrameCallback === 'function') {
      video.requestVideoFrameCallback(() => done('frame presented'));
    }
    video.addEventListener('playing', () => done('playing'), { once: true });
    video.addEventListener('error', () => done('error'), { once: true });
  });
  return firstFrame;
}

// A camera that is refused has no frame coming: the arrival must not stay on the picture waiting for
// one (D45).
let cameraGaveUp = null;

function cameraWillNotShow(why) {
  cameraGaveUp = why;
  if (!finishFirstFrame) return;
  const finish = finishFirstFrame;
  finishFirstFrame = null;
  finish(why);
}

export async function cameraAlreadyAllowed(timeoutMs) {
  if (!navigator.permissions || typeof navigator.permissions.query !== 'function') return false;
  const limit = typeof timeoutMs === 'number' ? timeoutMs : PERMISSION_TIMEOUT;
  const unknown = new Promise((resolve) => setTimeout(() => resolve(null), limit));
  try {
    const answer = await Promise.race([navigator.permissions.query({ name: 'camera' }), unknown]);
    return Boolean(answer && answer.state === 'granted');
  } catch (error) {
    return false;
  }
}

export function reportCameraError(error) {
  console.error('Failed to access the camera:', error);
  hideLoading();
  // No frame is coming, so an arrival waiting for one gives up here (D45).
  cameraWillNotShow(String((error && error.name) || error || 'error'));
  // One warning at a time: this function can run more than once (permission denied and, later,
  // an error in the middle) and without this the messages piled up on the screen.
  const previous = document.getElementById('erro-camera');
  if (previous) previous.remove();
  const message = document.createElement('div');
  message.className = 'loading-overlay';
  message.id = 'erro-camera';
  message.setAttribute('role', 'alert');
  // Interface text: a key from the catalogue (D12), never a literal in the code.
  message.textContent = t('camera.error');
  message.style.display = 'flex';
  document.body.appendChild(message);
  const start = document.getElementById('btn-iniciar');
  if (start) start.style.display = 'none';
}

// ---- the camera as data (Fase 3) ----

// Builds the player rig from `cameras.player` and keeps the element: from here on this module is
// the one that knows where the camera is, and it no longer looks for it by name (A5, the second
// half — a selector here and a builder creating the element would be two places again).
export function createPlayerCamera(player, parent) {
  const el = document.createElement('a-camera');
  if (player && player.position) el.setAttribute('position', vector(player.position));
  // A rotation comes from the builder when the visitor arrives from another world: they look the way
  // the door crosses, which is the way the window showed (D14). A scene that declares none starts
  // looking along -Z.
  if (player && Array.isArray(player.rotation)) el.setAttribute('rotation', vector(player.rotation));
  el.setAttribute('look-controls', CAMERA_RIG.lookControls);
  el.setAttribute('wasd-controls', CAMERA_RIG.wasdControls);

  const cursor = document.createElement('a-cursor');
  Object.entries(CAMERA_RIG.cursor).forEach(([name, value]) => cursor.setAttribute(name, value));
  el.appendChild(cursor);

  parent.appendChild(el);
  playerEl = el;
  if (player && typeof player.speed === 'number' && player.speed > 0) mobileSpeed = player.speed;
  return el;
}

// Whether the exhibition stands in the real world (dimension 0 shows the webcam). The data says
// so — `cameras.real.enabled` — and `startSession` is what acts on it.
export function useRealCamera(enabled) {
  realCameraEnabled = enabled === true;
}

// What the start button does (`app.start` in the catalogue, whose key the markup carries). It was
// the inline script of index.html until Fase 3, and it lives here because all of it is the camera's
// business: the webcam, the loading overlay, the error message and the on-screen D-pad.
//
// `options.arrival` says the visitor got here through a door (D37). Then nothing is asked of them:
// the exhibition has already been activated in the world they came from, and a room that is entirely
// virtual has nothing to ask either. If the camera is refused anyway — the browser may want the
// gesture a page load cannot give it — the button comes back, with the message that says why.
export function startSession(options) {
  const arrival = Boolean(options && options.arrival);
  showLoading();
  hideStartButton();

  // The D-pad group is the exhibition's markup; a host without it still gets the controls wired
  // (if it has the buttons) and never breaks here (R13).
  if (AFRAME.utils.device.isMobile()) {
    const pad = document.getElementById('controles-mobile');
    if (pad) pad.style.display = 'block';
    setupMobileControls();
  }

  // Dimension 0 is the real world only when the data says so: with `real.enabled` false the
  // exhibition is entirely virtual, and asking for the camera would be asking for nothing.
  if (!realCameraEnabled) {
    hideLoading();
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    reportCameraError(new Error('getUserMedia is not supported'));
    return;
  }

  const video = document.getElementById('webcam-video');
  if (!video) {
    // The data asks for the real world but this page has no surface for it: the exhibition's
    // <video> is the only one, and a host without it says so instead of throwing inside the
    // promise — where the failure would look like a camera error (R13).
    console.warn('[camera] the data asks for the real world and this page has no <video> for it');
    hideLoading();
    return;
  }
  navigator.mediaDevices
    .getUserMedia({ video: { width: 1280, height: 720, facingMode: 'environment' } })
    .then((mediaStream) => {
      stream = mediaStream;
      video.srcObject = mediaStream;
      video.play();
      // The camera is on, so there is nothing left to activate — whatever asked for it (D41).
      hideStartButton();
      // The canvas has to be resized once the stream is running: without this the first frames
      // are squeezed into the size the page had before the camera started.
      setTimeout(() => {
        const scene = document.querySelector('a-scene');
        if (scene && scene.resize) {
          scene.resize();
          // A `resize` limpa o buffer do canvas e o canvas é `alpha: true`: até à renderização
          // seguinte o compositor só tem o <video> por baixo para mostrar — e é isso que se vê como um
          // fotograma da câmara a meio de uma travessia (D45). Desenhar já fecha essa janela.
          if (scene.renderer && scene.object3D && scene.camera) {
            scene.renderer.render(scene.object3D, scene.camera);
          }
        }
      }, 300);
      setTimeout(hideLoading, 500);
    })
    .catch((error) => {
      reportCameraError(error);
      if (arrival) showStartButton();
    });
}
