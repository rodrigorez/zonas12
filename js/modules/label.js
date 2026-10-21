// The name of a thing, in the debug view (D39/D40): one sprite with the text painted once.
//
// A sprite and not a plane: whoever arrives lands **behind** a door, and a plane would read mirrored
// from there — a sprite always faces the camera. It is shared by the doors and the works so the two
// cannot drift apart in size, colour or font.
//
// The text comes from the data (a dimension's name, a world's slug, an asset's id) — this file never
// names a thing itself, it only draws what it is given.
import { state } from '../core/index.js';

// In metres, because the label lives in the scene and not on the screen; the maximum width is the
// width of a door, so that a label never covers more than the thing it names.
const LABEL_FONT = '600 48px system-ui, "Segoe UI", Roboto, sans-serif';
const LABEL_PADDING = 22;
const LABEL_HEIGHT = 1.1;
const LABEL_MAX_WIDTH = 12;

function paint(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = LABEL_FONT;
  const width = Math.ceil(context.measureText(text).width) + LABEL_PADDING * 2;
  const height = 48 + LABEL_PADDING * 2;
  canvas.width = width;
  canvas.height = height;
  // Resizing a canvas forgets the drawing state, the font included.
  context.font = LABEL_FONT;
  context.textBaseline = 'middle';
  if (typeof context.roundRect === 'function') context.roundRect(1.5, 1.5, width - 3, height - 3, 12);
  else context.rect(1.5, 1.5, width - 3, height - 3);
  context.fillStyle = 'rgba(10, 4, 4, 0.82)';
  context.fill();
  context.lineWidth = 3;
  context.strokeStyle = 'rgba(255, 107, 107, 0.95)';
  context.stroke();
  context.fillStyle = '#f6eded';
  context.fillText(text, LABEL_PADDING, height / 2 + 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return { texture: texture, aspect: width / height };
}

// A sprite for one text. `name` is the object's name in the scene graph (what the tests look at),
// and `maxWidth` is how wide it may get before it starts to shrink.
export function createLabel(text, options = {}) {
  const painted = paint(text);
  const material = new THREE.SpriteMaterial({ map: painted.texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(material);
  if (options.name) sprite.name = options.name;
  const maxWidth = options.maxWidth || LABEL_MAX_WIDTH;
  let height = LABEL_HEIGHT;
  let width = height * painted.aspect;
  if (width > maxWidth) {
    width = maxWidth;
    height = width / painted.aspect;
  }
  sprite.scale.set(width, height, 1);
  sprite.renderOrder = state.drawOrder.debug;
  return sprite;
}

// A sprite shares its geometry with every other sprite in the scene (it is three's own), so only the
// material and the texture belong to the entity that made this label.
export function disposeLabel(sprite) {
  if (!sprite || !sprite.material) return;
  if (sprite.material.map) sprite.material.map.dispose();
  sprite.material.dispose();
}
