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
}

// Wires the on-screen D-pad and starts the movement loop. The interface calls it when the
// visitor activates the exhibition on a touch device (index.html, `iniciarCena`).
export function setupMobileControls() {
  bindPadButton('btn-frente', 'forward');
  bindPadButton('btn-tras', 'backward');
  bindPadButton('btn-esq', 'left');
  bindPadButton('btn-dir', 'right');
  stepMobileMovement();
}

// The loading overlay is interface state, but it belongs here: it is only meaningful while
// the webcam is being requested.
function hideLoading() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.style.display = 'none';
  }
}

export function reportCameraError(error) {
  console.error('Failed to access the camera:', error);
  hideLoading();
  // One warning at a time: this function can run more than once (permission denied and, later,
  // an error in the middle) and without this the messages piled up on the screen.
  const previous = document.getElementById('erro-camera');
  if (previous) previous.remove();
  const message = document.createElement('div');
  message.className = 'loading-overlay';
  message.id = 'erro-camera';
  message.setAttribute('role', 'alert');
  // Interface text: still a literal because nothing reads the i18n catalogue yet
  // (docs/ROADMAP.md, R3 — the interface only uses `t('…')` from Fase 4 on).
  message.innerHTML = 'Não foi possível acessar a câmera. Por favor, verifique as permissões.';
  message.style.display = 'flex';
  document.body.appendChild(message);
  document.getElementById('btn-iniciar').style.display = 'none';
}

// ---- the camera as data (Fase 3) ----

// Builds the player rig from `cameras.player` and keeps the element: from here on this module is
// the one that knows where the camera is, and it no longer looks for it by name (A5, the second
// half — a selector here and a builder creating the element would be two places again).
export function createPlayerCamera(player, parent) {
  const el = document.createElement('a-camera');
  if (player && player.position) el.setAttribute('position', vector(player.position));
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

// What the "ATIVAR EXPOSIÇÃO" button does. It was the inline script of index.html until Fase 3,
// and it lives here because all of it is the camera's business: the webcam, the loading overlay,
// the error message and the on-screen D-pad.
export function startSession() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) overlay.style.display = 'flex';
  const start = document.getElementById('btn-iniciar');
  if (start) start.style.display = 'none';

  if (AFRAME.utils.device.isMobile()) {
    document.getElementById('controles-mobile').style.display = 'block';
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
  navigator.mediaDevices
    .getUserMedia({ video: { width: 1280, height: 720, facingMode: 'environment' } })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
      // The canvas has to be resized once the stream is running: without this the first frames
      // are squeezed into the size the page had before the camera started.
      setTimeout(() => {
        const scene = document.querySelector('a-scene');
        if (scene && scene.resize) scene.resize();
      }, 300);
      setTimeout(hideLoading, 500);
    })
    .catch((error) => reportCameraError(error));
}
