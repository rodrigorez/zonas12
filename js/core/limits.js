// Hard limits of the scene.
// MAX_WINDOWS is the only physical one: the stencil buffer has 8 bits, so at most 255
// different dimensions can be visible at the same time. The other two are organisational -
// they exist so that every dimension and every portal has an id.
export const MAX_DIMENSIONS = 512;
export const MAX_PORTALS = 512;
export const MAX_WINDOWS = 255;

// The band of ids a declared dimension may NOT use (law L15): the builder derives a dimension per
// portrait, in this band, and hands its id to the door (D26). A declared id inside it would end up
// activated by mistake — the camera inside a portrait.
export const DERIVED_DIMENSION_BASE = 448;
