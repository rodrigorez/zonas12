// The artwork module: everything that belongs to one item of content of a dimension — the
// dimensional material that registers it with the core, the click that opens it and the modal
// that shows it, plus the cursor listener that marks what can be clicked.
//
// It registers the three A-Frame components the scene uses, so importing the module is what
// makes them exist. The modal is this application's, not the editor's: the core never sees it
// (docs/ROADMAP.md, section 5.0).
import { state, registerContent, unregisterContent } from '../core/index.js';
import { createLabel, disposeLabel } from './label.js';
import { playerCamera } from './camera.js';
import { rememberPose } from '../scene/return-pose.js';

const ARTWORK_COMPONENT = 'dimensional-material';
// A obra que abre a ficha (D60) deixa o ponto de vista guardado (D63): o «voltar» da ficha devolve o
// visitante ao sítio onde estava, e não ao início do mundo.
function rememberBeforeLeaving() {
  const pose = playerCamera.pose();
  if (!pose) return false;
  return rememberPose({
    position: pose.position,
    yaw: pose.yaw,
    pitch: pose.pitch,
    dimension: state.activeDimension
  });
}

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
  schema: {
    url: { type: 'string' },
    // O que o clique faz (D57/D60): `modal` abre a obra na janela da exposição, `page` **navega para a
    // ficha da obra** (a página gerada, no mesmo separador), `link` navega para o endereço. Era o que
    // faltava do R9 — o endereço validava e aparecia dentro do modal, e quem o punha num mundo queria
    // sair para fora dele.
    mode: { type: 'string', default: 'modal' }
  },
  init: function () {
    this.el.addEventListener('click', () => {
      if (!this.canInteract()) return;
      if (this.data.mode === 'page' || this.data.mode === 'link') {
        if (!this.data.url) return;
        // A ficha é uma página: antes de sair, guarda-se o ponto de vista (D63).
        if (this.data.mode === 'page') rememberBeforeLeaving();
        window.location.assign(this.data.url);
        return;
      }
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
  schema: {
    dimension: { type: 'int', default: 0 },
    // The name of the work, for the debug view (D40). Written by the builder from the data, like the
    // door's (D39): this component only draws what it is given.
    label: { type: 'string', default: '' },
    // Whether the name starts visible: the exhibition shows it with the debug key, the editor's
    // preview from the start.
    labelAlways: { type: 'boolean', default: false },
    // How far above the centre the top of the work is — the works are not all the same height, and
    // the name goes above the work, not over it.
    labelY: { type: 'number', default: 1.5 }
  },
  init: function () {
    this.el.setAttribute('data-dimension', this.data.dimension);
    this.el.classList.add('dimension-' + this.data.dimension);
    this.el.addEventListener('loaded', () => this.applyStencil());
    // Um `kind: "model"` só tem malha quando o GLTF chega (D58): o evento é o que a traz.
    this.el.addEventListener('model-loaded', () => this.applyStencil());
    if (this.el.getObject3D('mesh')) this.applyStencil();
    if (this.data.labelAlways) this.showLabel(true);
  },
  // The name above the work, for whoever is debugging (D40). Same sprite as the doors (js/modules/
  // label.js), so the two read the same and are sized by the same rules.
  showLabel: function (visible) {
    if (visible && !this.labelSprite && this.data.label) {
      this.labelSprite = createLabel(this.data.label, { name: 'artwork-' + this.el.getAttribute('data-artwork-id') + '-label' });
      // `labelY` is the top of the work: the name sits above it, clear of the picture.
      this.labelSprite.position.set(0, this.data.labelY + this.labelSprite.scale.y / 2 + 0.4, 0);
      this.el.object3D.add(this.labelSprite);
    }
    if (this.labelSprite) this.labelSprite.visible = visible;
  },
  toggleLabel: function () {
    // The first press builds it, the next ones only hide it: the text is painted once.
    if (!this.labelSprite) {
      this.showLabel(true);
      return true;
    }
    this.labelSprite.visible = !this.labelSprite.visible;
    return this.labelSprite.visible;
  },
  applyStencil: function () {
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;
    const drawOrder = state.drawOrder;
    mesh.traverse((node) => {
      // `model-loaded` chega depois de `loaded`: registar duas vezes a mesma malha deixaria uma
      // entrada órfã no núcleo, e ela seria configurada depois de o objeto já não existir (A4).
      if (node.isMesh && node.material && !node.userData.registeredByArtwork) {
        node.userData.registeredByArtwork = true;
        node.renderOrder = drawOrder.artwork;
        node.name = 'dimension-' + this.data.dimension + '-artwork';
        registerContent(this.data.dimension, node, 'artwork');
      }
    });
  },
  // The counterpart of applyStencil: an artwork that leaves the scene has to leave the registry
  // too, or the core keeps configuring materials that no longer exist (docs/ROADMAP.md, A4).
  remove: function () {
    // The name is a sprite this component made: its material and its texture go with it, and the
    // geometry, which is three's own and shared, does not (D40).
    if (this.labelSprite) {
      disposeLabel(this.labelSprite);
      this.labelSprite = null;
    }
    const mesh = this.el.getObject3D('mesh');
    if (!mesh) return;
    mesh.traverse((node) => {
      if (!node.isMesh || !node.material) return;
      unregisterContent(this.data.dimension, node);
      // O plano de um `kind: "text"` é construído por este módulo (D58): a geometria e o material são
      // da obra, e ninguém mais os liberta. A malha de um GLTF é do `gltf-model`, que trata disso.
      if (node.userData.owned) {
        if (node.geometry) node.geometry.dispose();
        if (node.material.map) node.material.map.dispose();
        node.material.dispose();
      }
    });
  }
});

// The names of the works, all at once, for the debug key (D40): the same key that shows the collision
// boxes of the doors shows the name of every work, and the module that owns the entity is the one
// that knows how to find it.
export function toggleArtworkLabels() {
  let visible = false;
  document.querySelectorAll('[data-artwork-id]').forEach((element) => {
    const component = element.components && element.components[ARTWORK_COMPONENT];
    if (component) visible = component.toggleLabel();
  });
  return visible;
}

// ---- the artwork as data (Fase 3) ----

// Uma obra `kind: "text"` (D58): o texto é desenhado num canvas e o desenho vai para um plano com
// transparência. Sem fonte externa de propósito — o `text` do A-Frame vai buscar uma fonte à rede, e a
// exposição tem de abrir sem rede e sem um aviso na consola (T8).
const TEXT_FONT_PX = 96;
const TEXT_MAX_WIDTH_PX = 2048;

function textTexture(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  const font = '700 ' + TEXT_FONT_PX + 'px system-ui, "Segoe UI", Roboto, sans-serif';
  context.font = font;
  const padding = Math.round(TEXT_FONT_PX * 0.25);
  const measured = Math.ceil(context.measureText(text).width);
  canvas.width = Math.min(TEXT_MAX_WIDTH_PX, Math.max(TEXT_FONT_PX, measured + padding * 2));
  canvas.height = Math.round(TEXT_FONT_PX * 1.6);
  // Redimensionar o canvas esquece o estado do desenho, a fonte incluída.
  context.font = font;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillStyle = '#f6eded';
  context.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - padding * 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// O plano do texto: a malha é construída aqui, como a do fundo de uma dimensão, e o componente a
// registra no núcleo como qualquer outra obra. `owned` diz ao `remove` que a geometria e o material
// são desta obra e não do A-Frame.
function textMesh(text, size) {
  const width = size[0];
  const height = size[1];
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    map: textTexture(text),
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.userData.owned = true;
  return mesh;
}

// Creates the entity of one artwork of the scene data. The `artwork` it receives is the data with
// the address to open already resolved, when there is one: with `interaction: 'modal'` the
// address comes from the assets catalogue (D20, so the file is named once) and the builder is the
// one that knows the catalogue.
//
// O que a obra **é** vem do `kind` (D58): uma imagem ou um vídeo são uma caixa com a textura; um
// `model` é a malha do GLTF do catálogo, e o `size` escala-a por eixo; um `text` é um plano com o
// texto desenhado. As três aceitam posição, rotação e tamanho como as outras.
//
// Uma obra `site` (D60/D62) é uma página, mas na sala ela é a **capa**: o `asset` dela é, por lei, uma
// imagem, e sem a caixa a obra existia no dado e não existia na sala — não se via e não se clicava.
//
// A subtlety of the two names: `asset` is the id of the entry in `<a-assets>` — the catalogue id
// the builder gives the <img>/<video> — and it becomes the `#id` selector the material loads.
export function createArtwork(artwork, parent, derived = {}) {
  const kind = artwork.kind || 'image';
  const drawsItsImage = kind === 'image' || kind === 'video' || (kind === 'site' && Boolean(artwork.asset));
  const el = document.createElement(drawsItsImage ? 'a-box' : 'a-entity');
  el.setAttribute('class', 'interactable');
  // The id in the DOM, like a portal's and a dimension's: it is what the editor uses to find the
  // element of the artwork it is changing without rebuilding the world (Fase 4, D33).
  el.setAttribute('data-artwork-id', artwork.id);
  el.setAttribute('position', vector(artwork.position));
  if (artwork.rotation) el.setAttribute('rotation', vector(artwork.rotation));

  if (drawsItsImage) {
    el.setAttribute('src', '#' + artwork.asset);
    el.setAttribute('width', artwork.size[0]);
    el.setAttribute('height', artwork.size[1]);
    el.setAttribute('depth', artwork.size[2]);
  } else if (kind === 'model') {
    // O GLTF do catálogo, escalado pelo `size`: um modelo não tem «largura em metros» como uma
    // fotografia, e um fator por eixo é o que se lê no dado.
    el.setAttribute('gltf-model', '#' + artwork.asset);
    el.setAttribute('scale', vector(artwork.size));
  } else if (kind === 'text') {
    const text = derived.text || artwork.asset || '';
    if (text) el.setObject3D('mesh', textMesh(text, artwork.size));
  }

  const settings = { dimension: artwork.dimension };
  // The name in the debug view (D40) and where it sits, which the builder knows because it has the
  // size of the work.
  if (typeof derived.label === 'string' && derived.label) settings.label = derived.label;
  if (derived.labelAlways) settings.labelAlways = true;
  settings.labelY = artwork.size[1] / 2;
  el.setAttribute(ARTWORK_COMPONENT, settings);
  if (artwork.url) {
    // O modo vem da interacção: `page` leva à ficha (D60), `link` ao endereço, o resto ao modal.
    const mode = artwork.interaction === 'page' ? 'page'
      : (artwork.interaction === 'link' ? 'link' : 'modal');
    el.setAttribute(OPENING_COMPONENT, { url: artwork.url, mode: mode });
  }
  parent.appendChild(el);
  return el;
}

// Removing the entity is enough: the component's remove() above takes the registry entry with it.
export function removeArtwork(el) {
  if (el) el.remove();
}
