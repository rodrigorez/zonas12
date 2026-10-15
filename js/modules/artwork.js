// The artwork module: everything that belongs to one item of content of a dimension — the
// dimensional material that registers it with the core, the click that opens it and the modal
// that shows it, plus the cursor listener that marks what can be clicked.
//
// It registers the three A-Frame components the scene uses, so importing the module is what
// makes them exist. The modal is this application's, not the editor's: the core never sees it
// (docs/ROADMAP.md, section 5.0).
import { state, registerContent, unregisterContent } from '../core/index.js';

const ARTWORK_COMPONENT = 'dimensional-material';

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

function openArtwork(url) {
  document.getElementById('iframe-obra').src = url;
  document.getElementById('modal-obra').style.display = 'flex';
  setInert(true);
  document.getElementById('btn-fechar-obra').focus();
  document.removeEventListener('keydown', onModalKeydown);
  document.addEventListener('keydown', onModalKeydown);
}

export function closeArtwork() {
  document.getElementById('modal-obra').style.display = 'none';
  document.getElementById('iframe-obra').src = '';
  setInert(false);
  document.removeEventListener('keydown', onModalKeydown);
}

// The keys of the modal have to work inside the embedded artwork too. When it is clicked there,
// the focus moves to the document of the frame and no keyboard event reaches the outer
// document any more: Escape stopped closing and Tab stopped being kept inside the dialog. For
// artworks of the same origin the document of the frame can be listened to (it is the same
// listener, and it always uses the outer `document`); for those of another origin there is no
// access — there the "Voltar para a Galeria" button is what remains, as it does not depend on
// the keyboard.
document.getElementById('iframe-obra').addEventListener('load', function () {
  try {
    const frameDocument = this.contentDocument;
    if (!frameDocument) return;
    frameDocument.removeEventListener('keydown', onModalKeydown);
    frameDocument.addEventListener('keydown', onModalKeydown);
  } catch (error) {
    // Artwork of another origin: no access to the document of the frame.
  }
});

// --- The A-Frame components ---

AFRAME.registerComponent('cursor-listener', {
  init: function () {
    this.el.setAttribute('class', 'interactable');
  }
});

AFRAME.registerComponent('open-artwork', {
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

AFRAME.registerComponent('dimensional-material', {
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
