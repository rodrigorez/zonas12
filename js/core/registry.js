import { state } from './state.js';
import { MAX_DIMENSIONS } from './limits.js';
import { applyStencilState } from './stencil.js';

// Registers a mesh (the panorama of a dimension, or an artwork) as content of that
// dimension. `role` is 'panorama' or 'artwork' and only changes the draw order.
// The material's original depth settings are remembered: they are restored whenever the
// dimension becomes the active one again.
export function registerContent(dimensionId, mesh, role) {
  const id = Number(dimensionId);
  if (!(id >= 0 && id < MAX_DIMENSIONS)) {
    console.warn('[core] ID ' + dimensionId + ' out of range 0..' + (MAX_DIMENSIONS - 1) +
      '; object ignored.');
    return;
  }
  const list = state.dimensions[id] || (state.dimensions[id] = []);
  if (!list.some(function (entry) { return entry.mesh === mesh; })) {
    list.push({
      mesh: mesh,
      material: mesh.material,
      panorama: role === 'panorama',
      depth: { test: mesh.material.depthTest, write: mesh.material.depthWrite }
    });
  }
  state.signature = null;
  applyStencilState();
}

// A portal registers itself so the scene can be listed and traversed. The core never calls
// methods on portals: it announces the stencil changed and each window refreshes itself.
export function registerPortal(portal) {
  state.portals.push(portal);
  state.signature = null;
}

export function unregisterPortal(portal) {
  const i = state.portals.indexOf(portal);
  if (i >= 0) state.portals.splice(i, 1);
  state.signature = null;
}
