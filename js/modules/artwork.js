// The artwork module: everything that belongs to one item of content of a dimension — the
// dimensional material that registers it with the core, the click that opens it and the modal
// that shows it, plus the cursor listener that marks what can be clicked.
//
// It registers the three A-Frame components the scene uses, so importing the module is what
// makes them exist. The modal is this application's, not the editor's: the core never sees it
// (docs/ROADMAP.md, section 5.0).
import { state, registerContent, unregisterContent } from '../core/index.js';

const ARTWORK_COMPONENT = 'dimensional-material';
const OPENING_COMPONENT = 'open-artwork';

// A-Frame's vec3 in the object form of setAttribute needs { x, y, z }: an array there is read as
// an object with no axes and falls back to the default, silently (measured in A-Frame 1.8,
// utils/coordinates.js parse). The data writes vectors as arrays, so the factory translates —
// and this is the only place in this module that knows the difference.
const vector = (value) => ({ x: value[0], y: value[1], z: value[2] });

// --- The modal (the overlay window) ---
// The modal is a dialog: when it opens the focus goes into it and the rest of the page becomes
// `inert` (out of the reach of Tab, of the mouse and of the screen reader); Escape leaves it.
// The listener is added on open and removed on close — one per opening, never one per artwork.
// There is no focus to give back when it closes: what opens it is a 3D artwork, which is not
// focusable.
function onModalKeydown(event) {
  if (event.key === 'Escape') {
    closeArtwork();
    return;
  }
  if (event.key !== 'Tab') return;
  // `inert` takes the rest of the page out of reach, but the cycle has to close inside the
  // modal: without this, Tab past the last control would leave for the `body`. The move is made
  // here instead of being left to the browser because, with the focus inside the iframe, the
  // events go to the document of the frame and the native Tab escaped with nobody able to stop
  // it.
  const focusable = document.querySelectorAll('#modal-obra button, #modal-obra [tabindex]:not([tabindex="-1"])');
  if (focusable.length === 0) return;
  event.preventDefault();
  const current = [...focusable].indexOf(document.activeElement);
  const step = event.shiftKey ? -1 : 1;
  const next = (current + step + focusable.length) % focusable.length;
  focusable[next].focus();
}

// Everything that is not the modal. `inert` keeps the focus inside the dialog without having to
// intercept Tab by hand — and solves the same problem for the mouse and for the
// accessibility tree.
function setInert(active) {
  [...document.body.children].forEach((element) => {
    if (element.id === 'modal-obra') return;
    if (active) element.setAttribute('inert', '');
    else element.removeAttribute('inert');
  });
}

// The modal is the exhibition's, and this module never assumes it is there: a host that imports the
// module without the dialog — the editor is the second one (Fase 4) — still gets the components, and
// a click that has nowhere to open says so once instead of throwing (docs/ROADMAP.md, R13).
const MODAL_ID = 'modal-obra';
const FRAME_ID = 'iframe-obra';
const BACK_ID = 'btn-fechar-obra';

let warnedNoModal = false;

function openArtwork(url) {
  const dialog = document.getElementById(MODAL_ID);
  if (!dialog) {
    if (!warnedNoModal) {
      warnedNoModal = true;
      console.warn('[artwork] this page has no modal (' + MODAL_ID + '): the artworks open nowhere');
    }
    return;
  }
  const frame = document.getElementById(FRAME_ID);
  if (frame) {
    frame.src = url;
    bindFrameKeys(frame);
  }
  dialog.style.display = 'flex';
  setInert(true);
  const back = document.getElementById(BACK_ID);
  if (back) back.focus();
  document.removeEventListener('keydown', onModalKeydown);
  document.addEventListener('keydown', onModalKeydown);
}

// Closing what is not there is a no-op, not an error: a host without the modal may still call it.
export function closeArtwork() {
  const dialog = document.getElementById(MODAL_ID);
  const frame = document.getElementById(FRAME_ID);
  if (dialog) dialog.style.display = 'none';
  if (frame) frame.src = '';
  setInert(false);
  document.removeEventListener('keydown', onModalKeydown);
}

// The keys of the modal have to work inside the embedded artwork too. When it is clicked there,
// the focus moves to the document of the frame and no keyboard event reaches the outer
// document any more: Escape stopped closing and Tab stopped being kept inside the dialog. For
// artworks of the same origin the document of the frame can be listened to (it is the same
// listener, and it always uses the outer `document`); for those of another origin there is no
// access — there the back button (`artwork.back`) is what remains, as it does not depend on the
// keyboard.
//
// It is bound when the modal is first opened and not when the module is imported: the iframe is the
// host's, and an import has no right to require it (R13).
const framesWithKeys = new WeakSet();

function bindFrameKeys(frame) {
  if (framesWithKeys.has(frame)) return;
  framesWithKeys.add(frame);
  frame.addEventListener('load', function () {
    try {
      const frameDocument = this.contentDocument;
      if (!frameDocument) return;
      frameDocument.removeEventListener('keydown', onModalKeydown);
      frameDocument.addEventListener('keydown', onModalKeydown);
    } catch (error) {
      // Artwork of another origin: no access to the document of the frame.
    }
  });
}

// --- The A-Frame components ---

AFRAME.registerComponent('cursor-listener', {
  init: function () {
    this.el.setAttribute('class', 'interactable');
  }
});

AFRAME.registerComponent(OPENING_COMPONENT, {
  schema: { url: { type: 'string' } },
  init: function () {
    this.el.addEventListener('click', () => {
      if (!this.canInteract()) return;
      openArtwork(this.data.url);
    });
  },
  // Only artworks of the dimension the visitor is in can be clicked: seeing them through the
  // window of a portal does not count. The raycaster does not know about the stencil, so
  // without this test an invisible artwork of another dimension could be clicked.
  canInteract: function () {
    const attribute = this.el.getAttribute(ARTWORK_COMPONENT);
    if (!attribute) return true;
    return Number(attribute.dimension) === state.activeDimension;
  }
});

AFRAME.registerComponent(ARTWORK_COMPONENT, {
  schema: { dimension: { type: 'int', default: 0 } },
  init: function () {
    this.el.setAttribute('data-dimension', this.data.dimension);
    this.el.classList.add('dimension-' + this.data.dimension);
    this.el.addEventListener('loaded', () => this.applyStencil());
    if (this.el.getObject3D('mesh')) this.applyStencil();
  },
  applyStencil: function () {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;
    const drawOrder = state.drawOrder;
    mesh.traverse((node) => {
      if (node.isMesh && node.material) {
        node.renderOrder = drawOrder.artwork;
        node.name = 'dimension-' + this.data.dimension + '-artwork';
        registerContent(this.data.dimension, node, 'artwork');
      }
    });
  },
  // The counterpart of applyStencil: an artwork that leaves the scene has to leave the registry
  // too, or the core keeps configuring materials that no longer exist (docs/ROADMAP.md, A4).
  remove: function () {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;
    mesh.traverse((node) => {
      if (node.isMesh && node.material) unregisterContent(this.data.dimension, node);
    });
  }
});

// ---- the artwork as data (Fase 3) ----

// Creates the entity of one artwork of the scene data. The `artwork` it receives is the data with
// the address to open already resolved, when there is one: with `interaction: 'modal'` the
// address comes from the assets catalogue (D20, so the file is named once) and the builder is the
// one that knows the catalogue.
//
// A subtlety of the two names: `asset` is the id of the entry in `<a-assets>` — the catalogue id
// the builder gives the <img>/<video> — and it becomes the `#id` selector the material loads.
export function createArtwork(artwork, parent) {
  const el = document.createElement('a-box');
  el.setAttribute('class', 'interactable');
  // The id in the DOM, like a portal's and a dimension's: it is what the editor uses to find the
  // element of the artwork it is changing without rebuilding the world (Fase 4, D33).
  el.setAttribute('data-artwork-id', artwork.id);
  el.setAttribute('src', '#' + artwork.asset);
  el.setAttribute('width', artwork.size[0]);
  el.setAttribute('height', artwork.size[1]);
  el.setAttribute('depth', artwork.size[2]);
  el.setAttribute('position', vector(artwork.position));
  if (artwork.rotation) el.setAttribute('rotation', vector(artwork.rotation));
  el.setAttribute(ARTWORK_COMPONENT, { dimension: artwork.dimension });
  if (artwork.url) {
    el.setAttribute(OPENING_COMPONENT, { url: artwork.url });
  }
  parent.appendChild(el);
  return el;
}

// Removing the entity is enough: the component's remove() above takes the registry entry with it.
export function removeArtwork(el) {
  if (el) el.remove();
}
