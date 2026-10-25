// The preview: the world being edited, built by the same builder the exhibition uses (D3/D4).
//
// It is a **preview** and says so to the builder (`preview: true`), which turns the navigation off
// (D32): walking into a world door inside the tool must not take the editor — and the work — away.
//
// One scene at a time. The build is asynchronous (the assets load first), so the previous scene goes
// down before the next one goes up: two built scenes at once would double the textures in memory for
// no gain, since only one is ever shown.
import { buildScene, withDefaults, addressToOpen, portalLabel, artworkLabel } from '../scene/scene-builder.js';
import { SCENE, textIn } from '../scene/schema.js';
import { currentLanguage } from '../i18n.js';
import { startFrameDriver } from '../modules/portal.js';
import { createDimension, removeDimension } from '../modules/dimension.js';
import { createArtwork, removeArtwork } from '../modules/artwork.js';
import { createPortal, removePortal } from '../modules/portal.js';
import { createPlayerCamera } from '../modules/camera.js';

let built = null;

export function previewElement() {
  return document.querySelector('a-scene');
}

export async function show(data) {
  clear();
  // `labels: true` is the editor's own decision (D39): the names of the doors are part of what a
  // tool shows, and this page has no debug key of its own.
  built = await buildScene(data, { parent: previewElement(), preview: true, labels: true });
  // The frame driver is what asks, every frame, which dimension each window shows and hands the
  // values to the core. The exhibition starts it in its entry point; the editor has to do the same,
  // or every window in the preview is black (measured before this line: 0 stencil values and alpha 0
  // inside a window). Setting it twice is harmless — it is one component on the <a-scene>.
  startFrameDriver();
  return built;
}

// The counterpart of `show`, and the reason R8 could be closed: the builder's `remove()` releases the
// scene, the modules' registries and the GPU memory (js/scene/scene-builder.js).
export function clear() {
  if (!built) return;
  built.remove();
  built = null;
}

// Whether there is a scene up — what the first panel will ask before touching anything.
export function isShowing() {
  return built !== null;
}

// ---- changing one thing without rebuilding everything (D33) ----
//
// A number typed in a panel changes one entity. Rebuilding the whole scene would reload every asset
// (measured: the build awaits all of them) and would move the camera, so the two functions below take
// down **one** entity and build it again with the data as it is now.

function dimensionElement(id) {
  if (!built) return null;
  return built.elements.dimensions.find(
    (element) => Number(element.getAttribute('data-dimension')) === Number(id)
  ) || null;
}

export function replaceDimension(dimension) {
  if (!built) return null;
  const previous = dimensionElement(dimension.id);
  if (previous) {
    const at = built.elements.dimensions.indexOf(previous);
    if (at >= 0) built.elements.dimensions.splice(at, 1);
    // `removeDimension` is the module's own: it takes the registry entry and the GPU memory with it
    // (A4), which is what makes this loop safe to repeat.
    removeDimension(previous);
  }
  // A dimension of kind `camera` has no entity — the webcam is the background — and the factory says
  // so by returning null.
  const created = createDimension(withDefaults(dimension, SCENE.dimensions), previewElement());
  if (created) built.elements.dimensions.push(created);
  return created;
}

export function replaceCamera(player) {
  if (!built) return null;
  if (built.elements.camera) built.elements.camera.remove();
  built.elements.camera = createPlayerCamera(withDefaults(player, SCENE.cameras.fields.player), previewElement());
  return built.elements.camera;
}

// An artwork is found by the id it carries in the DOM (`data-artwork-id`, set by the module): the
// array order would work too, but an id is what the data says and what a reader of the DOM can see.
export function replaceArtwork(artwork, catalogue) {
  if (!built) return null;
  const previous = built.elements.artworks.find(
    (element) => Number(element.getAttribute('data-artwork-id')) === Number(artwork.id)
  ) || null;
  if (previous) {
    const at = built.elements.artworks.indexOf(previous);
    if (at >= 0) built.elements.artworks.splice(at, 1);
    removeArtwork(previous);
  }
  const data = withDefaults(artwork, SCENE.artworks);
  // The address an artwork opens is derived from the catalogue, never written in the data (D20) — and
  // it is the builder's own function, so the preview cannot open something the exhibition would not.
  data.url = addressToOpen(data, catalogue);
  const created = createArtwork(data, previewElement(), {
    label: artworkLabel(data, built.scene && built.scene.dimensions),
    labelAlways: true,
    // O texto de uma obra `kind: "text"`, na língua da página (D57).
    text: textIn(data.text, currentLanguage())
  });
  built.elements.artworks.push(created);
  return created;
}

// A door is found by `data-portal-id` and re-created with the same portrait dimension it had: the
// derived dimensions are built once per world (one per unique portrait), so re-creating a door must
// **reuse** one, not make another. A change of the window axis rebuilds the world instead — that is
// the axis that decides which portraits exist at all.
export function replacePortal(portal) {
  if (!built) return null;
  const previous = built.elements.portals.find(
    (element) => Number(element.getAttribute('data-portal-id')) === Number(portal.id)
  ) || null;
  let derived = {};
  if (previous) {
    const component = previous.components && previous.components['stencil-portal'];
    const id = component && component.data ? component.data.previewDimension : -1;
    if (typeof id === 'number' && id >= 0) derived = { previewDimension: id };
    const at = built.elements.portals.indexOf(previous);
    if (at >= 0) built.elements.portals.splice(at, 1);
    removePortal(previous);
  }
  const created = createPortal(withDefaults(portal, SCENE.portals), previewElement(), {
    previewDimension: derived.previewDimension,
    label: portalLabel(portal, built.scene && built.scene.dimensions),
    labelAlways: true
  });
  built.elements.portals.push(created);
  return created;
}
