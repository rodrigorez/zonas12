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

// The standard of a panorama — a background or a portrait (law L14): 2:1 equirectangular, because
// that is what a sphere unwraps to. The width is a ceiling and not a target: a texture costs four
// bytes per pixel, so an image above the standard is what makes the memory unpredictable (measured:
// 9923×2614 is 99 MB), and an image below it costs less and is not a defect.
export const PANORAMA_WIDTH = 2048;
export const PANORAMA_HEIGHT = 1024;
