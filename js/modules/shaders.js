// The shader backgrounds, as an internal list (R15): the data names one by `shaderId` and never
// brings GLSL, a URL or an expression of its own. A file that names something else is a validation
// error, not a scene that tries to compile it.
//
// Each shader paints the colour of a pixel from the direction of the look (`d`) and the time
// (`uTime`): no texture, no canvas. They are deliberately light (few iterations, mediump), which is
// what makes a phone sustain the 20 updates per second the policy allows.
//
// The trial pages of `teste/` import this same list, so what is measured there is what the
// exhibition runs — one list, not two.

export const VERTEX = `
varying vec3 vDir;
void main() {
  vDir = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

const HEAD = `
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
const TAIL = `
  gl_FragColor = vec4(col, 1.0);
}`;

const body = (code) => HEAD + code + TAIL;

export const SHADERS = [
  {
    id: 'por-do-sol',
    name: 'Pôr do sol no mar',
    fragment: body(`
      vec3 sky = mix(vec3(0.9, 0.41, 0.33), vec3(0.03, 0.07, 0.18), smoothstep(0.0, 0.9, el));
      float sun = smoothstep(0.12, 0.0, length(vec2(az - 0.4, el - 0.2)));
      sky += vec3(1.0, 0.8, 0.55) * sun;
      float wave = sin(az * 18.0 + uTime * 1.4 + 6.0 / (abs(el) + 0.05)) * 0.5 + 0.5;
      vec3 sea = mix(vec3(0.02, 0.1, 0.18), vec3(0.45, 0.7, 0.75), wave * smoothstep(0.0, -0.3, el) * 0.5);
      col = el > 0.0 ? sky : sea;`)
  },
  {
    id: 'noite-aurora',
    name: 'Noite com aurora',
    fragment: body(`
      vec2 g = vec2(az, el) * 60.0;
      float star = step(0.985, hash(floor(g))) * (0.6 + 0.4 * sin(uTime * 2.0 + hash(floor(g)) * 30.0));
      float band = sin(az * 4.0 + uTime * 0.6 + sin(az * 2.0) * 2.0) * 0.12 + 0.35;
      float aur = smoothstep(0.14, 0.0, abs(el - band));
      col = mix(vec3(0.01, 0.02, 0.06), vec3(0.04, 0.08, 0.2), 1.0 - el);
      col += star * step(0.0, el);
      col += vec3(0.2, 1.0, 0.65) * aur * 0.7;`)
  },
  {
    id: 'nuvens',
    name: 'Nuvens à deriva',
    fragment: body(`
      vec2 p = vec2(az * 1.5 + uTime * 0.05, el * 3.0);
      float n = noise(p * 3.0) * 0.6 + noise(p * 6.0 + 3.0) * 0.4;
      vec3 sky = mix(vec3(0.15, 0.5, 0.75), vec3(0.6, 0.85, 1.0), 1.0 - abs(el));
      col = mix(sky, vec3(1.0), smoothstep(0.5, 0.8, n));`)
  },
  {
    id: 'grade-neon',
    name: 'Grade neon',
    fragment: body(`
      vec3 sky = mix(vec3(0.48, 0.12, 0.64), vec3(0.08, 0.0, 0.17), clamp(el * 2.0, 0.0, 1.0));
      float depth = 1.0 / max(-el, 0.02);
      vec2 grid = vec2(az * 6.0 * depth * 0.12, depth + uTime * 2.0);
      vec2 line = smoothstep(0.04, 0.0, abs(fract(grid) - 0.5) - 0.46);
      float g = max(line.x, line.y) * smoothstep(0.0, -0.15, el);
      col = el > 0.0 ? sky : vec3(0.04, 0.0, 0.08) + vec3(1.0, 0.25, 0.8) * g;`)
  },
  {
    id: 'ondas',
    name: 'Ondas concêntricas',
    fragment: body(`
      float r = length(vec2(az * 0.5, el * 1.2));
      float ring = smoothstep(0.08, 0.0, abs(fract(r * 4.0 - uTime * 0.25) - 0.5) - 0.4);
      col = mix(vec3(0.03, 0.04, 0.16), vec3(0.07, 0.02, 0.23), 1.0 - el);
      col += vec3(0.45, 0.7, 1.0) * ring * (1.0 - clamp(r, 0.0, 1.5) / 1.5);`)
  }
];

// The IDs the format may name. The schema takes its enum from here, so a shader that exists in this
// list is a shader the validator accepts, and the other way round.
export const SHADER_IDS = SHADERS.map((shader) => shader.id);

export function shaderById(id) {
  return SHADERS.find((shader) => shader.id === id) || null;
}

// The feature flag of the trial (R14/R15). Production stays on `kind: "image"` until the controlled
// A/B on three devices closes R14; until then the shader is only built when the address asks for it,
// and a `kind: "shader"` dimension shows its `fallbackAsset` like any other image background.
export function shadersEnabled(search) {
  const source = search === undefined && typeof window !== 'undefined' ? window.location.search : search;
  return new URLSearchParams(source || '').get('shader') === '1';
}
