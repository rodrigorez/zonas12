// The shader backgrounds, as an internal list (R15): the data names one by `shaderId` and never
// brings GLSL, a URL or an expression of its own. A file that names something else is a validation
// error, not a scene that tries to compile it.
//
// Each shader is a module under `js/shaders/` with a `body` — the code between the prelude and the
// closing brace. The prelude is here, one for all of them: it declares `vDir`/`uTime`, derives `az`
// and `el` and opens `vec3 col`, so a shader only paints. A body that does not write `col` is
// refused by `tools/shader/validate.mjs`, and so is one that cannot sustain the 20 updates per
// second of the policy.
//
// The trial pages of `teste/` import this same list, so what is measured there is what the
// exhibition runs — one list, not two.
//
// The installer (`tools/shader/install.mjs`) writes the two marked blocks below; the markers are
// part of the contract and must stay.

// shaders:imports begin
import { shader as porDoSol } from '../shaders/por-do-sol.js';
import { shader as noiteAurora } from '../shaders/noite-aurora.js';
import { shader as nuvens } from '../shaders/nuvens.js';
import { shader as gradeNeon } from '../shaders/grade-neon.js';
import { shader as ondas } from '../shaders/ondas.js';
import { shader as becos } from '../shaders/becos.js';
import { shader as aguas } from '../shaders/aguas.js';
import { shader as holograma } from '../shaders/holograma.js';
import { shader as mangue } from '../shaders/mangue.js';
import { shader as nucleo } from '../shaders/nucleo.js';
// shaders:imports end

export const VERTEX = `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// The prelude and the tail of every fragment. Exported because the validator composes exactly the
// same text before compiling a body.
export const FRAGMENT_HEAD = `
precision mediump float;
varying vec3 vDir;
uniform float uTime;
const float PI = 3.14159265;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
void main() {
  vec3 d = normalize(vDir);
  float az = atan(d.x, -d.z);
  float el = asin(clamp(d.y, -1.0, 1.0));
  vec3 col;
`;
export const FRAGMENT_TAIL = `
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

const INSTALLED = [
  // shaders:list begin
  porDoSol,
  noiteAurora,
  nuvens,
  gradeNeon,
  ondas,
  becos,
  aguas,
  holograma,
  mangue,
  nucleo
  // shaders:list end
];

export const SHADERS = INSTALLED.map((shader) => Object.assign({}, shader, {
  fragment: FRAGMENT_HEAD + shader.body + FRAGMENT_TAIL
}));

// The IDs the format may name. The schema takes its enum from here, so a shader that exists in this
// list is a shader the validator accepts, and the other way round.
export const SHADER_IDS = SHADERS.map((shader) => shader.id);

export function shaderById(id) {
  return SHADERS.find((shader) => shader.id === id) || null;
}

// The whole fragment of one body, as the validator and the installer see it.
export function fragmentFor(body) {
  return FRAGMENT_HEAD + body + FRAGMENT_TAIL;
}

// The production switch (author's decision, 2026-10-24): the shader is what the exhibition draws,
// and `?shader=0` is the escape hatch — it builds the `fallbackAsset` like an image dimension, which
// is what serves the A/B and the rollback. Any other value (or none) keeps the shader.
export function shadersEnabled(search) {
  const source = search === undefined && typeof window !== 'undefined' ? window.location.search : search;
  return new URLSearchParams(source || '').get('shader') !== '0';
}
