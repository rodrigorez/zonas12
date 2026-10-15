// Public API of the core. Everything else imports from here, so the files inside js/core/
// can be rearranged without touching the modules that use them.
//
// Dependency direction (docs/ROADMAP.md, section 5.0): modules -> core, never the other way.
// Nothing here touches the DOM, the keyboard, JSON or the A-Frame components.
export { MAX_DIMENSIONS, MAX_PORTALS, MAX_WINDOWS, DERIVED_DIMENSION_BASE } from './limits.js';
export { state } from './state.js';
export { on, off, emit } from './events.js';
export { applyStencilRule, applyStencilState, syncStencilValues } from './stencil.js';
export { registerContent, unregisterContent, registerPortal, unregisterPortal } from './registry.js';
export { setActiveDimension } from './active-dimension.js';
