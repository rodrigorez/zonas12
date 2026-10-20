// The preview: the world being edited, built by the same builder the exhibition uses (D3/D4).
//
// It is a **preview** and says so to the builder (`preview: true`), which turns the navigation off
// (D32): walking into a world door inside the tool must not take the editor — and the work — away.
//
// One scene at a time. The build is asynchronous (the assets load first), so the previous scene goes
// down before the next one goes up: two built scenes at once would double the textures in memory for
// no gain, since only one is ever shown.
import { buildScene } from '../scene/scene-builder.js';
import { startFrameDriver } from '../modules/portal.js';

let built = null;

export function previewElement() {
  return document.querySelector('a-scene');
}

export async function show(data) {
  clear();
  built = await buildScene(data, { parent: previewElement(), preview: true });
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
