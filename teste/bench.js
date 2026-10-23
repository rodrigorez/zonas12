// Mede o custo de quadro de fundos esféricos: imagem estática x p5.js estático x p5.js animado,
// com um ou dois fundos visíveis (o ativo e o visto pela porta) e, opcionalmente, a câmera ligada.
const THREE = AFRAME.THREE;
const WARMUP_MS = 1500;
const MEASURE_MS = 6000;
const SLOW_FRAME_MS = 33.4;
const IMAGES = ['assets/panoramas/praia-d0-praia.jpg', 'assets/panoramas/ceu-d0-skycloud.jpg'];
const PALETTES = [
  { skyTop: [8, 18, 48], skyBottom: [230, 105, 83], seaTop: [31, 79, 99], seaBottom: [4, 17, 35] },
  { skyTop: [20, 10, 50], skyBottom: [110, 160, 230], seaTop: [40, 60, 110], seaBottom: [8, 8, 30] }
];

// `half`: a metade direita da textura é transparente e deixa a câmera aparecer por trás.
const SCENARIOS = [
  { name: 'Só a câmera (sem esfera)', kind: 'none', count: 0 },
  { name: 'Imagem estática × 2 fundos', kind: 'image', count: 2 },
  { name: 'p5.js estático × 2 fundos', kind: 'p5', animated: false, count: 2 },
  { name: 'p5.js animado 30 fps × 1 fundo', kind: 'p5', animated: true, count: 1 },
  { name: 'p5.js animado 30 fps × 2 fundos', kind: 'p5', animated: true, count: 2 },
  { name: 'A: imagem metade/câmera × 1', kind: 'image', half: true, count: 1 },
  { name: 'A: p5.js estático metade/câmera × 1', kind: 'p5', animated: false, half: true, count: 1 },
  { name: 'A: p5.js animado metade/câmera × 1', kind: 'p5', animated: true, half: true, count: 1 },
  { name: 'A: p5.js animado metade/câmera × 2', kind: 'p5', animated: true, half: true, count: 2 }
];

// Apaga a metade direita (com um degradê de 64 px na borda) para a câmera aparecer por trás.
function maskRightHalf(context, width, height) {
  context.save();
  context.globalCompositeOperation = 'destination-out';
  context.fillStyle = '#000';
  context.fillRect(width / 2 + 32, 0, width / 2 - 32, height);
  const edge = context.createLinearGradient(width / 2 - 32, 0, width / 2 + 32, 0);
  edge.addColorStop(0, 'rgba(0,0,0,0)');
  edge.addColorStop(1, 'rgba(0,0,0,1)');
  context.fillStyle = edge;
  context.fillRect(width / 2 - 32, 0, 64, height);
  context.restore();
}

function halfImageTexture(image) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const context = canvas.getContext('2d');
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  maskRightHalf(context, canvas.width, canvas.height);
  return new THREE.CanvasTexture(canvas);
}

const $ = (id) => document.getElementById(id);
const sceneEl = document.querySelector('a-scene');
let current = null;
let cameraStream = null;
const results = [];

function setStatus(text) { $('estado').textContent = text; }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function sketchFor(palette, animated, half, stats, ready) {
  return (p) => {
    const mix = (a, b, t) => p.lerpColor(p.color(...a), p.color(...b), t);
    p.setup = () => {
      p.pixelDensity(1);
      p.createCanvas(1024, 512);
      p.frameRate(30);
      if (!animated) p.noLoop();
      ready();
    };
    p.draw = () => {
      const started = performance.now();
      const horizon = p.height * 0.52;
      for (let y = 0; y < p.height; y++) {
        const sky = y < horizon;
        const amount = sky ? y / horizon : (y - horizon) / (p.height - horizon);
        p.stroke(sky ? mix(palette.skyTop, palette.skyBottom, amount) : mix(palette.seaTop, palette.seaBottom, amount));
        p.line(0, y, p.width, y);
      }
      p.noStroke();
      for (let ring = 5; ring >= 0; ring--) {
        p.fill(255, 205, 143, 12 + ring * 2);
        p.circle(p.width * 0.25, horizon - 72, 112 + ring * 30);
      }
      p.fill(255, 224, 165);
      p.circle(p.width * 0.25, horizon - 72, 88);
      p.noFill();
      for (let row = 0; row < 14; row++) {
        const y = horizon + 10 + row * 14;
        const phase = p.frameCount * 0.045 + row * 0.7;
        p.stroke(180, 220, 221, 90 - row * 4);
        p.strokeWeight(row < 3 ? 2 : 1);
        p.beginShape();
        for (let x = 0; x <= p.width; x += 8) {
          p.vertex(x, y + Math.sin((x / p.width) * p.TWO_PI * 2 + phase) * (2 + row * 0.35));
        }
        p.endShape();
      }
      if (half) maskRightHalf(p.drawingContext, p.width, p.height);
      stats.drawCount++;
      stats.drawMs += performance.now() - started;
    };
  };
}

function makeSphere(texture, radius, order, transparent) {
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture, side: THREE.BackSide, depthWrite: false, toneMapped: false, transparent: transparent === true
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 64, 48), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = order;
  return mesh;
}

async function buildScenario(scenario) {
  const group = new THREE.Group();
  const stats = { drawCount: 0, drawMs: 0 };
  const textures = [];
  const sketches = [];

  for (let i = 0; i < scenario.count; i++) {
    let texture;
    if (scenario.kind === 'image') {
      texture = await new THREE.TextureLoader().loadAsync(IMAGES[i % IMAGES.length]);
      if (scenario.half) {
        const source = texture;
        texture = halfImageTexture(source.image);
        source.dispose();
      }
    } else {
      let ready;
      const done = new Promise((resolve) => { ready = resolve; });
      const sketch = new p5(sketchFor(PALETTES[i % PALETTES.length], scenario.animated, scenario.half === true, stats, ready));
      await done;
      sketches.push(sketch);
      texture = new THREE.CanvasTexture(sketch.canvas);
      texture.userData.drawsSeen = -1;
    }
    textures.push(texture);
    group.add(makeSphere(texture, 500 - i * 100, 2 + i * 0.1, scenario.half));
  }
  sceneEl.object3D.add(group);
  return { group, stats, textures, sketches, scenario };
}

function disposeScenario(built) {
  if (!built) return;
  sceneEl.object3D.remove(built.group);
  built.group.children.forEach((mesh) => { mesh.geometry.dispose(); mesh.material.dispose(); });
  built.textures.forEach((texture) => texture.dispose());
  built.sketches.forEach((sketch) => sketch.remove());
}

// Envia a textura à GPU só quando o p5.js desenhou um quadro novo.
function syncTextures(built) {
  if (!built || built.scenario.kind !== 'p5') return;
  built.textures.forEach((texture) => {
    if (texture.userData.drawsSeen !== built.stats.drawCount) {
      texture.userData.drawsSeen = built.stats.drawCount;
      texture.needsUpdate = true;
    }
  });
}

function percentile(sorted, fraction) {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

function measure(built) {
  return new Promise((resolve) => {
    const deltas = [];
    let last = null;
    let startedAt = null;
    let drawCountAtStart = 0;
    let drawMsAtStart = 0;

    function frame(now) {
      syncTextures(built);
      if (last !== null && startedAt !== null) deltas.push(now - last);
      last = now;
      if (startedAt === null && now >= WARMUP_AT) {
        startedAt = now;
        drawCountAtStart = built.stats.drawCount;
        drawMsAtStart = built.stats.drawMs;
      }
      if (startedAt !== null && now - startedAt >= MEASURE_MS) {
        const sorted = deltas.slice().sort((a, b) => a - b);
        const total = deltas.reduce((sum, value) => sum + value, 0);
        const draws = built.stats.drawCount - drawCountAtStart;
        resolve({
          fps: (deltas.length / total) * 1000,
          avg: total / deltas.length,
          p95: percentile(sorted, 0.95),
          max: sorted[sorted.length - 1],
          slow: (deltas.filter((value) => value > SLOW_FRAME_MS).length / deltas.length) * 100,
          drawMs: draws > 0 ? (built.stats.drawMs - drawMsAtStart) / draws : null,
          draws
        });
        return;
      }
      requestAnimationFrame(frame);
    }
    const WARMUP_AT = performance.now() + WARMUP_MS;
    requestAnimationFrame(frame);
  });
}

function gpuName() {
  try {
    const gl = sceneEl.renderer.getContext();
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'indisponível';
  } catch (error) { return 'indisponível'; }
}

function deviceSummary() {
  return {
    userAgent: navigator.userAgent,
    nucleos: navigator.hardwareConcurrency || null,
    memoriaGB: navigator.deviceMemory || null,
    pixelRatio: window.devicePixelRatio,
    tela: window.innerWidth + '×' + window.innerHeight,
    gpu: gpuName(),
    camera: cameraStream ? 'ligada' : 'desligada',
    resolucaoCamera: cameraStream ? $('webcam-video').videoWidth + '×' + $('webcam-video').videoHeight : null
  };
}

function render() {
  const body = $('tabela').querySelector('tbody');
  body.textContent = '';
  results.forEach((entry) => {
    const row = body.insertRow();
    const values = [
      entry.name, entry.fps.toFixed(1), entry.avg.toFixed(1), entry.p95.toFixed(1), entry.max.toFixed(1),
      entry.slow.toFixed(1), entry.drawMs === null ? '—' : entry.drawMs.toFixed(2) + ' ×' + entry.draws
    ];
    values.forEach((value) => { row.insertCell().textContent = value; });
  });
  $('tabela').hidden = false;
  const text = $('resultado-texto');
  text.value = JSON.stringify({ dispositivo: deviceSummary(), resultados: results }, null, 1);
  text.hidden = false;
  $('btn-copiar').disabled = false;
}

async function runAll() {
  $('btn-iniciar-teste').disabled = true;
  results.length = 0;
  for (let i = 0; i < SCENARIOS.length; i++) {
    const scenario = SCENARIOS[i];
    setStatus('(' + (i + 1) + '/' + SCENARIOS.length + ') Medindo: ' + scenario.name + '…');
    const built = await buildScenario(scenario);
    current = built;
    const outcome = await measure(built);
    results.push(Object.assign({ name: scenario.name }, outcome));
    disposeScenario(built);
    current = null;
    await sleep(500);
  }
  setStatus('Concluído. FPS perto do limite da tela e poucos quadros lentos significam folga.');
  render();
  $('btn-iniciar-teste').disabled = false;
}

async function toggleCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    $('webcam-video').srcObject = null;
    $('btn-camera').textContent = 'Ligar câmera';
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { width: 1280, height: 720, facingMode: 'environment' }, audio: false
    });
    $('webcam-video').srcObject = cameraStream;
    $('btn-camera').textContent = 'Desligar câmera';
  } catch (error) {
    setStatus('Câmera indisponível: ' + error.name + ' (no celular exige HTTPS).');
  }
}

async function copyResults() {
  const text = $('resultado-texto');
  try {
    await navigator.clipboard.writeText(text.value);
    setStatus('Resultados copiados.');
  } catch (error) {
    text.select();
    setStatus('Selecione e copie o texto abaixo.');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  $('btn-camera').addEventListener('click', toggleCamera);
  $('btn-iniciar-teste').addEventListener('click', runAll);
  $('btn-copiar').addEventListener('click', copyResults);
});
