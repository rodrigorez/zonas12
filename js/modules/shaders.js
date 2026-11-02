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
import { shader as fichario } from '../shaders/fichario.js';
// shaders:imports end

export const VERTEX = `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

// The prelude and the tail of every fragment. Exported because the validator composes exactly the
// same text before compiling a body.
//
// O preâmbulo tem uma coisa que não é paisagem: os **buracos do mundo real** (D81). Uma janela de
// porta mostra uma fotografia do destino, mas uma porta do destino que mostra a dimensão `camera` não
// desenha nada — quem olha por ela vê o `<video>` da câmara, que fica atrás do canvas do renderer. Na
// janela esse sítio tem de ficar vazio também, senão via-se ali o fundo do destino e ao chegar via-se
// a câmara (medido: 0,62 a 1,70 de salto na costura). Os retângulos vêm do dado (`window.reality`) e
// são (azimute, elevação) em graus, no referencial em que o retrato foi cozido — que é o mesmo em que
// este `vDir` é lido.
//
// O preâmbulo tem outra coisa que não é paisagem: a **emenda da esfera** (D82). `az` é um serrilhado
// — salta de +PI para -PI atrás do visitante — pelo que tudo o que o use como linha recta herda o
// corte. Ficam aqui as três ferramentas para não a ter, uma casa só para todas:
//   · `volta` — o azimute em voltas, -0.5..+0.5. Um padrão periódico fecha na emenda se a frequência
//     for um inteiro de voltas; e o índice de uma célula pintada ao acaso leva `mod(indice, N)`, para
//     que a célula que atravessa a emenda receba uma só cor;
//   · `azim` — o par (d.x, d.z), seno e cosseno do azimute, contínuo em toda a volta: para direcções e
//     para o ruído que se desenrola ao longo da esfera;
//   · `noise3` — ruído sobre a direcção, sem coordenada nenhuma que salte: é o que os fundos orgânicos
//     usam em vez de `noise(vec2(az * …, el * …))`.
export const FRAGMENT_HEAD = `
precision mediump float;
varying vec3 vDir;
uniform float uTime;
uniform int uHolesN;
uniform vec4 uHoles[4];
const float PI = 3.14159265;
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float hash3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float noise3(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
}
void main() {
  vec3 d = normalize(vDir);
  float az = atan(d.x, -d.z);
  float el = asin(clamp(d.y, -1.0, 1.0));
  float volta = az / (2.0 * PI);
  vec2 azim = d.xz;
  for (int i = 0; i < 4; i++) {
    if (i >= uHolesN) break;
    vec4 hole = uHoles[i];
    if (az > hole.x && az < hole.z && el > hole.y && el < hole.w) discard;
  }
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
  nucleo,
  fichario
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
