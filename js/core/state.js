// The single source of truth of the scene. This file holds data only - no decisions.
//   activeDimension : where the visitor is. Changed only through setActiveDimension().
//   dimensions      : dimension id -> content entries ({ mesh, material, panorama, depth })
//   portals         : portal components, in registration order
//   stencilValues   : dimension id -> stencil value (1..255) of the window that shows it
//   signature       : last applied state, so the same work is not redone every frame
//   drawOrder       : render order (with sortObjects = true, renderOrder wins)
export const state = {
  activeDimension: 0,
  dimensions: Object.create(null),
  portals: [],
  stencilValues: new Map(),
  signature: null,
  drawOrder: { mask: 1, panorama: 2, artwork: 3, frame: 4, debug: 10 }
};
