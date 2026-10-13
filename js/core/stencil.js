import { state } from './state.js';
import { MAX_WINDOWS } from './limits.js';
import { emit } from './events.js';

// Writes the stencil rule on a material:
//   1..255 (value) -> draws inside the windows that show that dimension
//   null (no role) -> does not draw
// Only the comparison changes; the operations stay Keep, so none of these materials ever
// writes to the stencil buffer - the only writer is the mask of each portal.
export function applyStencilRule(material, ref) {
  material.stencilWrite = true;
  material.stencilWriteMask = 0xFF;
  material.stencilFuncMask = 0xFF;
  material.stencilFail = THREE.KeepStencilOp;
  material.stencilZFail = THREE.KeepStencilOp;
  material.stencilZPass = THREE.KeepStencilOp;
  if (ref === null) {
    material.stencilFunc = THREE.NeverStencilFunc;
    return material;
  }
  material.stencilFunc = THREE.EqualStencilFunc;
  material.stencilRef = ref;
  return material;
}

// Decides, per dimension, what each material draws:
//  - active dimension: no stencil test at all, depth decides. The mask of every window
//    writes depth, so whatever belongs to the active dimension and sits behind a window is
//    hidden by it, and whatever sits in front draws over it. This is what keeps the portal
//    frames whole when they cross a window.
//  - dimension shown by a window: draws only where that window wrote its value, and ignores
//    depth (the world of that dimension is on the other side of the window).
//  - dimension without a window: never draws.
// Whoever needs to react (the portals refreshing their window) subscribes to
// 'stencil:changed' instead of being called from here.
export function applyStencilState() {
  const drawOrder = state.drawOrder;
  Object.keys(state.dimensions).forEach(function (key) {
    const id = Number(key);
    const value = state.stencilValues.has(id) ? state.stencilValues.get(id) : null;
    state.dimensions[key].forEach(function (entry) {
      const material = entry.material;
      const normalOrder = entry.panorama ? drawOrder.panorama : drawOrder.artwork;
      if (id === state.activeDimension) {
        material.stencilWrite = false;
        material.depthTest = entry.depth.test;
        material.depthWrite = entry.depth.write;
        entry.mesh.renderOrder = normalOrder;
      } else if (value !== null) {
        applyStencilRule(material, value);
        material.depthTest = false;
        material.depthWrite = false;
        // Leaves before the artworks of the active dimension: the artworks in front of the
        // window draw afterwards, over the content of the window.
        entry.mesh.renderOrder = entry.panorama ? drawOrder.panorama : drawOrder.panorama + 0.5;
      } else {
        applyStencilRule(material, null);
        material.depthTest = entry.depth.test;
        material.depthWrite = entry.depth.write;
        entry.mesh.renderOrder = normalOrder;
      }
    });
  });
  emit('stencil:changed');
}

// Assigns a stencil value to every dimension that a window is showing. Values run 1..255,
// where 0 means "no window here". Reapplies the state only when something actually changed,
// so the work is not redone every frame.
export function syncStencilValues(shownDimensions) {
  const shown = shownDimensions.slice().sort(function (a, b) { return a - b; });
  if (shown.length > MAX_WINDOWS) {
    console.warn('[core] ' + shown.length + ' windows exceed the stencil limit (' + MAX_WINDOWS +
      '); the extra ones get no window.');
    shown.length = MAX_WINDOWS;
  }
  const signature = state.activeDimension + '|' + shown.join(',');
  if (signature === state.signature) return;
  state.signature = signature;
  state.stencilValues = new Map();
  shown.forEach(function (dimension, i) { state.stencilValues.set(dimension, i + 1); });
  applyStencilState();
}
