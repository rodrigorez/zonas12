import { state } from './state.js';
import { applyStencilState } from './stencil.js';
import { emit } from './events.js';

// Changes the active dimension. Portal traversal calls this.
// It is the only way in, on purpose: two sources of truth for "where am I" is exactly what
// caused the original flicker between dimensions (the mask switched at the portal plane and
// a separate flag switched at the collision box edge).
export function setActiveDimension(id) {
  if (state.activeDimension === id) return;
  state.activeDimension = id;
  state.signature = null;
  console.info('[core] Active dimension: ' + id);
  applyStencilState();
  emit('dimension:active-changed', { dimension: id });
}
