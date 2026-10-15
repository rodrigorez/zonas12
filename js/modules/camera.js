// The camera module. It is the only file in the project that knows how to find the player
// rig, so the panorama, the portal and the on-screen D-pad ask it for a position instead of
// reaching for the element themselves (docs/ROADMAP.md, A5).
//
// It owns two things: the player camera (where the visitor is) and the real camera (the
// webcam stream behind dimension 0), plus the interface that only makes sense while the
// webcam is being requested — the loading overlay and the error message.
//
// Nothing here knows about dimensions, portals, stencil or draw order.
const PLAYER_SELECTOR = 'a-camera';

// Step of the on-screen D-pad, in metres per frame (data/scene.json, cameras.player.speed).
const MOBILE_SPEED = 0.1;

const held = { forward: false, backward: false, left: false, right: false };

function playerElement() {
  return document.querySelector(PLAYER_SELECTOR);
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
      position.x -= Math.sin(angle) * MOBILE_SPEED;
      position.z -= Math.cos(angle) * MOBILE_SPEED;
    }
    if (held.backward) {
      position.x += Math.sin(angle) * MOBILE_SPEED;
      position.z += Math.cos(angle) * MOBILE_SPEED;
    }
    if (held.left) {
      position.x -= Math.cos(angle) * MOBILE_SPEED;
      position.z += Math.sin(angle) * MOBILE_SPEED;
    }
    if (held.right) {
      position.x += Math.cos(angle) * MOBILE_SPEED;
      position.z -= Math.sin(angle) * MOBILE_SPEED;
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
