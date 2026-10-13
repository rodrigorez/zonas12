// Hard limits of the scene.
// MAX_WINDOWS is the only physical one: the stencil buffer has 8 bits, so at most 255
// different dimensions can be visible at the same time. The other two are organisational -
// they exist so that every dimension and every portal has an id.
export const MAX_DIMENSIONS = 512;
export const MAX_PORTALS = 512;
export const MAX_WINDOWS = 255;
