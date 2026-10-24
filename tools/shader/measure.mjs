// The shader validator's two halves: the static rules a body has to obey, and the measurement the
// policy promises (20 updates per second) done in a real WebGL context.
//
// Why a browser and not a parser: whether a fragment compiles, links and sustains the cadence is a
// fact of the GPU and the driver, not of the text. The page it uses is the trial fixture
// (`?scene=shader`), which already has the renderer, the stencil and an A-Frame camera; the bench
// hides the fixture's own background and draws the candidate on its own sphere.
//
// The static rules are the contract of the prelude (js/modules/shaders.js): `uTime` and the look are
// given, the body paints `col`, and nothing comes from outside the file.
import { readFileSync } from 'node:fs';
import { serveProject, openBrowser, sleep } from '../regression/harness.mjs';
import { VERTEX, fragmentFor } from '../../js/modules/shaders.js';

export const LIMITS = {
  maxBodyBytes: 8 * 1024,
  targetFps: 20,
  seconds: 5,
  minRate: 19,        // 95% of 20: a shader that cannot keep the cadence does not pass
  p95ReferenceMs: 100,
  width: 800,
  height: 600
};

const RULES = [
  {
    // An #include, a #version or an #extension would change the program the prelude agreed to.
    test: /^\s*#/m,
    why: 'directivas # (#include, #version, #extension) não entram: o prelúdio é o contrato'
  },
  {
    test: /\b(sampler2D|samplerCube|texture2D|textureCube)\b|\btexture\s*\(/,
    why: 'não há texturas: o fundo é calculado e não lê ficheiros'
  },
  {
    test: /\buniform\s+\w+/,
    why: 'os uniformes são do prelúdio (só uTime); o corpo não declara nenhum'
  },
  {
    test: /\bdiscard\b/,
    why: 'discard deixaria buracos no fundo (a esfera tem de cobrir a vista)'
  },
  {
    test: /\bwhile\s*\(/,
    why: 'while não tem limite conhecido; o orçamento de quadro não o admite'
  },
  {
    test: /\bgl_FragDepth\b/,
    why: 'gl_FragDepth mexeria na profundidade/máscara do portal (L2)'
  }
];

// Um `.glsl` gravado no Windows chega com BOM (U+FEFF) à frente. O BOM é transporte, não é shader:
// sem o tirar, o texto entregue ao WebGL começa num carácter que o compilador não conhece.
export function readBody(file) {
  return readFileSync(file, 'utf8').replace(/^\uFEFF/, '');
}

export function checkSource(body) {
  const errors = [];
  const bytes = Buffer.byteLength(body, 'utf8');
  if (bytes > LIMITS.maxBodyBytes) {
    errors.push(`o corpo tem ${bytes} bytes; o máximo é ${LIMITS.maxBodyBytes}`);
  }
  for (const rule of RULES) {
    if (rule.test.test(body)) errors.push(rule.why);
  }
  if (!/\bcol\s*(=|\+=|-=|\*=|\/=)/.test(body)) {
    errors.push('o corpo não escreve `col` (o prelúdio abre `vec3 col` e o fundo pinta-a)');
  }
  if (!body.trim()) errors.push('o corpo está vazio');
  return { ok: errors.length === 0, errors, bytes };
}

// The in-page bench. The vertex and the fragment arrive as JSON strings: the page compiles exactly
// what the validator composed, and nothing in the page decides what runs.
function probe(vertex, fragment, seconds, targetFps) {
  return `(async () => {
  const sceneEl = document.querySelector('a-scene');
  const renderer = sceneEl && sceneEl.renderer;
  const three = window.THREE;
  if (!renderer || !three) return { problems: ['sem renderer/THREE na página'] };

  renderer.setPixelRatio(1);
  sceneEl.resize();

  const fixture = sceneEl.querySelector('[data-dimension]');
  if (fixture && fixture.object3D) fixture.object3D.visible = false;

  const problems = [];
  if (renderer.debug) {
    renderer.debug.onShaderError = (gl, program) => {
      const log = gl.getProgramInfoLog(program) || 'sem log do programa';
      problems.push('erro de shader: ' + log.trim());
    };
  }

  const material = new three.ShaderMaterial({
    uniforms: { uTime: { value: 2 } },
    vertexShader: ${JSON.stringify(vertex)},
    fragmentShader: ${JSON.stringify(fragment)},
    side: three.BackSide,
    depthWrite: false
  });
  const mesh = new three.Mesh(new three.SphereGeometry(100, 64, 64), material);
  mesh.frustumCulled = false;
  sceneEl.object3D.add(mesh);

  try {
    renderer.compile(sceneEl.object3D, sceneEl.camera);
  } catch (error) {
    problems.push('exceção ao compilar: ' + String((error && error.message) || error));
  }

  const interval = 1000 / ${targetFps};
  const frames = [];
  let updates = 0;
  let nextUpdate = 0;
  const end = performance.now() + ${seconds} * 1000;

  await new Promise((resolve) => {
    const frame = (now) => {
      frames.push(now);
      if (!nextUpdate) nextUpdate = now + interval;
      if (now >= nextUpdate) {
        updates += 1;
        material.uniforms.uTime.value = updates / ${targetFps};
        nextUpdate += interval;
        if (now - nextUpdate >= interval) nextUpdate = now + interval;
      }
      if (now < end) requestAnimationFrame(frame);
      else resolve();
    };
    requestAnimationFrame(frame);
  });

  const elapsed = (frames[frames.length - 1] - frames[0]) / 1000;
  const deltas = [];
  for (let i = 1; i < frames.length; i++) deltas.push(frames[i] - frames[i - 1]);
  const gaps = deltas.slice().sort((a, b) => a - b);
  const p95 = gaps.length ? gaps[Math.min(gaps.length - 1, Math.floor(gaps.length * 0.95))] : 0;

  renderer.render(sceneEl.object3D, sceneEl.camera);
  const gl = renderer.getContext();
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const points = [[0.5, 0.5], [0.35, 0.6], [0.65, 0.6], [0.5, 0.3], [0.5, 0.75]];
  let brightest = 0;
  for (const point of points) {
    const pixel = new Uint8Array(4);
    gl.readPixels(Math.floor(width * point[0]), Math.floor(height * point[1]), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    brightest = Math.max(brightest, pixel[0], pixel[1], pixel[2]);
  }

  sceneEl.object3D.remove(mesh);
  mesh.geometry.dispose();
  material.dispose();

  return { problems, updates, seconds: elapsed, rate: elapsed > 0 ? updates / elapsed : 0, p95, brightest, frames: frames.length };
})()`;
}

export async function measure(body, options) {
  const settings = Object.assign({}, LIMITS, options || {});
  const site = await serveProject();
  const browser = await openBrowser({ camera: false, width: settings.width, height: settings.height });
  try {
    const ready = await browser.goto(site.base + '/?scene=shader&bust=' + Date.now(), 60000);
    if (!ready) throw new Error('a página do ensaio não carregou');
    await sleep(1500);
    return await browser.evaluate(
      probe(VERTEX, fragmentFor(body), settings.seconds, settings.targetFps), 120000);
  } finally {
    await browser.close();
    await site.close();
  }
}

export function verdict(measurement, options) {
  const settings = Object.assign({}, LIMITS, options || {});
  if (!measurement) {
    return { ok: false, fatal: ['não houve medição'], errors: ['não houve medição'], warnings: [] };
  }
  const warnings = [];
  // Um shader que não compila, ou que não pinta nada, não é um shader lento: não há valor de
  // `--force` que o torne visível, e por isso estes erros são fatais — os únicos que `--force`
  // não perdoa.
  const fatal = [];
  if (measurement.problems && measurement.problems.length) fatal.push(...measurement.problems);
  if (!(measurement.brightest > 0)) {
    fatal.push('o shader não desenhou nada (os pontos medidos ficaram pretos)');
  }
  const errors = fatal.slice();
  if (!(measurement.rate >= settings.minRate)) {
    errors.push(`entregou ${measurement.rate.toFixed(1)} atualizações/s; o mínimo é ${settings.minRate} (o teto é ${settings.targetFps})`);
  }
  if (measurement.p95 > settings.p95ReferenceMs) {
    warnings.push(`p95 de ${measurement.p95.toFixed(1)} ms — acima de ${settings.p95ReferenceMs} ms de referência`);
  }
  return { ok: errors.length === 0, fatal, errors, warnings };
}
