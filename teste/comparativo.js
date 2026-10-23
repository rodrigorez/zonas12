const WIDTH = 1024;
const HEIGHT = 512;
const WARMUP_MS = 5000;
const MEASURE_MS = 15000;
const RUNS = 3;
const FRAME_LIMIT_MS = 33.4;
const DEVICE_NAME_KEY = 'zonas12-comparativo-device-name';
const RUN_HISTORY_KEY = 'zonas12-comparativo-history-v1';
const TECHNOLOGIES = ['image', 'shader', 'p5'];
const SHADER_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const SHADER_FRAGMENT = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  const float PI = 3.14159265;
  void main() {
    float x = vUv.x;
    float y = 1.0 - vUv.y;
    float horizon = 0.52;
    vec3 color;
    if (y < horizon) {
      float t = y / horizon;
      color = mix(vec3(0.031, 0.071, 0.184), vec3(0.902, 0.412, 0.325), t);
    } else {
      float t = (y - horizon) / (1.0 - horizon);
      color = mix(vec3(0.122, 0.31, 0.388), vec3(0.016, 0.067, 0.137), t);
      for (int row = 0; row < 18; row++) {
        float r = float(row);
        float lineY = horizon + 8.0 / 512.0 + r * 13.0 / 512.0;
        float amplitude = (2.0 + r * 0.45) / 512.0;
        float waveY = lineY + sin(x * PI * 4.0 + uTime * 1.4 + r * 0.7) * amplitude;
        float line = 1.0 - smoothstep(0.0015, 0.004, abs(y - waveY));
        color = mix(color, vec3(0.42, 0.68, 0.70), line * max(0.12, 0.7 - r * 0.03));
      }
    }
    float sunDistance = distance(vec2(x, y), vec2(0.5, horizon - 512.0 * 0.14 / 512.0));
    float sun = 1.0 - smoothstep(0.083, 0.087, sunDistance);
    float ringDistance = abs(sunDistance - 0.085);
    float ring = 1.0 - smoothstep(0.004, 0.008, ringDistance);
    color = mix(color, vec3(1.0, 0.878, 0.647), sun);
    color = mix(color, vec3(1.0, 0.816, 0.60), ring * 0.24);
    gl_FragColor = vec4(color, 1.0);
  }
`;
const TECH = document.body.dataset.tech;
const params = new URLSearchParams(location.search);
const requestedRatio = Number(params.get('pr'));
const antialias = params.get('aa') !== '0';
const $ = (id) => document.getElementById(id);
const results = [];

const sceneEl = document.querySelector('a-scene');
let cameraStream = null;
let background = null;
let animationFrame = 0;
let activeMode = 'static';
let p5Instance = null;
let p5Canvas = null;
let p5Texture = null;
let shaderMaterial = null;
let benchmarkImage = null;
let startedAt = null;
let p5DrawMs = 0;
let p5DrawCount = 0;
let p5InitialDrawMs = 0;
let p5InitialDrawCount = 0;
let lastShaderUpdate = 0;
let preparationMetrics = null;
let latestPayload = null;

function status(text) {
  $('status').textContent = text;
}

function setMode(mode) {
  activeMode = mode;
  if (TECH === 'p5') {
    if (mode === 'static') p5Instance.noLoop();
    else {
      p5Instance.frameRate(30);
      p5Instance.loop();
    }
  }
  if (TECH === 'shader' && mode === 'static') shaderMaterial.uniforms.uTime.value = 2;
}

function makeSphere(material) {
  const sphere = new AFRAME.THREE.Mesh(
    new AFRAME.THREE.SphereGeometry(500, 64, 48),
    material
  );
  sphere.name = 'benchmark-panorama';
  sphere.frustumCulled = false;
  sphere.renderOrder = 2;
  sceneEl.object3D.add(sphere);
  return sphere;
}

function makeP5() {
  return new Promise((resolve) => {
    p5Instance = new p5((p) => {
      p.draw = () => {
        const start = performance.now();
        drawP5(p, activeMode === 'animated' ? p.millis() / 1000 : 2);
        p5DrawMs += performance.now() - start;
        p5DrawCount++;
        if (p5Texture) p5Texture.needsUpdate = true;
      };
      p.setup = () => {
        p.pixelDensity(1);
        const canvas = p.createCanvas(WIDTH, HEIGHT);
        canvas.style('display', 'none');
        p.noLoop();
        p5Canvas = p.canvas;
        p5Texture = new AFRAME.THREE.CanvasTexture(p5Canvas);
        configureTexture(p5Texture);
        background = makeSphere(new AFRAME.THREE.MeshBasicMaterial({
          map: p5Texture, side: AFRAME.THREE.BackSide, depthWrite: false, toneMapped: false
        }));
        p.redraw();
        if (p5DrawCount === 0) {
          const start = performance.now();
          drawP5(p, 2);
          p5DrawMs += performance.now() - start;
          p5DrawCount++;
          p5Texture.needsUpdate = true;
        }
        p5InitialDrawMs = p5DrawMs;
        p5InitialDrawCount = p5DrawCount;
        resolve();
      };
    });
  });
}

function drawP5(p, time) {
  const ctx = p.drawingContext;
  const horizon = HEIGHT * 0.52;
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#08122f');
  sky.addColorStop(1, '#e66953');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, WIDTH, horizon);

  const sea = ctx.createLinearGradient(0, horizon, 0, HEIGHT);
  sea.addColorStop(0, '#1f4f63');
  sea.addColorStop(1, '#041123');
  ctx.fillStyle = sea;
  ctx.fillRect(0, horizon, WIDTH, HEIGHT - horizon);

  ctx.fillStyle = '#ffe0a5';
  ctx.beginPath();
  ctx.arc(WIDTH * 0.5, horizon - HEIGHT * 0.14, HEIGHT * 0.085, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.24;
  ctx.strokeStyle = '#ffd099';
  for (let ring = 1; ring <= 5; ring++) {
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(WIDTH * 0.5, horizon - HEIGHT * 0.14, HEIGHT * (0.085 + ring * 0.035), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.lineWidth = 2;
  for (let row = 0; row < 18; row++) {
    const y = horizon + 8 + row * 13;
    const amplitude = 2 + row * 0.45;
    ctx.strokeStyle = `rgba(180,220,221,${Math.max(0.12, 0.7 - row * 0.03)})`;
    ctx.beginPath();
    for (let x = 0; x <= WIDTH; x += 4) {
      const wave = Math.sin(x / WIDTH * Math.PI * 4 + time * 1.4 + row * 0.7) * amplitude;
      if (x === 0) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
}

function configureTexture(texture) {
  texture.minFilter = AFRAME.THREE.LinearFilter;
  texture.magFilter = AFRAME.THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.colorSpace = AFRAME.THREE.SRGBColorSpace;
}

async function buildBackground() {
  if (TECH === 'image') {
    const texture = await new AFRAME.THREE.TextureLoader().loadAsync('teste/assets/por-do-sol-1024x512.jpg');
    benchmarkImage = texture.image;
    configureTexture(texture);
    background = makeSphere(new AFRAME.THREE.MeshBasicMaterial({
      map: texture, side: AFRAME.THREE.BackSide, depthWrite: false, toneMapped: false
    }));
    return;
  }

  if (TECH === 'p5') {
    await makeP5();
    return;
  }

  shaderMaterial = new AFRAME.THREE.ShaderMaterial({
    uniforms: { uTime: { value: 2 } },
    vertexShader: SHADER_VERTEX,
    fragmentShader: SHADER_FRAGMENT,
    side: AFRAME.THREE.BackSide,
    depthWrite: false
  });
  background = makeSphere(shaderMaterial);
}

function frameShader(time) {
  if (TECH === 'shader' && activeMode === 'animated' && time - lastShaderUpdate >= 1000 / 30) {
    shaderMaterial.uniforms.uTime.value = time / 1000;
    lastShaderUpdate = time;
  }
  animationFrame = requestAnimationFrame(frameShader);
}

async function browserDetails() {
  const ua = navigator.userAgent;
  let clientHints = null;
  if (navigator.userAgentData && navigator.userAgentData.getHighEntropyValues) {
    try {
      clientHints = await navigator.userAgentData.getHighEntropyValues(['model', 'platformVersion', 'architecture']);
    } catch (error) {
      console.warn('Informações detalhadas do aparelho não estão disponíveis pelo navegador.', error);
    }
  }
  const platform = navigator.userAgentData && navigator.userAgentData.platform;
  const video = $('camera');
  const gl = sceneEl.renderer.getContext();
  let gpu = 'indisponível';
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) gpu = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
  } catch (error) {
    console.warn('Não foi possível consultar o nome da GPU.', error);
  }
  const imageInfo = benchmarkImage ? {
    arquivo: 'teste/assets/por-do-sol-1024x512.jpg',
    largura: benchmarkImage.naturalWidth,
    altura: benchmarkImage.naturalHeight,
    proporcao: benchmarkImage.naturalWidth / benchmarkImage.naturalHeight,
    canaisOriginais: 'RGB (JPEG)',
    canaisDescodificados: 'RGBA (textura WebGL)',
    bytesTransferidos: performance.getEntriesByName(new URL('teste/assets/por-do-sol-1024x512.jpg', document.baseURI).href)
      .at(-1)?.transferSize ?? null,
    bytesCorpoCodificado: performance.getEntriesByName(new URL('teste/assets/por-do-sol-1024x512.jpg', document.baseURI).href)
      .at(-1)?.encodedBodySize ?? null,
    duracaoRequisicaoMs: performance.getEntriesByName(new URL('teste/assets/por-do-sol-1024x512.jpg', document.baseURI).href)
      .at(-1)?.duration ?? null
  } : null;

  return {
    identificacaoInformada: $('device-label').value.trim() || null,
    userAgent: ua,
    modeloReportadoPeloNavegador: clientHints && clientHints.model || null,
    plataforma: platform || (/Android/i.test(ua) ? 'Android' : /iPhone|iPad/i.test(ua) ? 'iOS' : navigator.platform),
    versaoPlataforma: clientHints && clientHints.platformVersion || null,
    arquitetura: clientHints && clientHints.architecture || null,
    nucleosLogicos: navigator.hardwareConcurrency || null,
    memoriaAproximadaGB: navigator.deviceMemory || null,
    gpu,
    telaCSS: `${innerWidth}x${innerHeight}`,
    telaFisicaAproximada: `${Math.round(innerWidth * devicePixelRatio)}x${Math.round(innerHeight * devicePixelRatio)}`,
    devicePixelRatio,
    pixelRatioAplicado: sceneEl.renderer.getPixelRatio(),
    antialiasSolicitado: antialias,
    camera: video.videoWidth ? 'ligada' : 'desligada',
    cameraResolucao: video.videoWidth ? `${video.videoWidth}x${video.videoHeight}` : null,
    imagem: imageInfo,
    canvasP5: p5Canvas ? `${p5Canvas.width}x${p5Canvas.height}; RGBA` : null,
    p5MemoriaCanvasAproximadaBytes: p5Canvas ? p5Canvas.width * p5Canvas.height * 4 : null,
    p5DesenhosIniciais: TECH === 'p5' ? p5InitialDrawCount : null,
    p5TempoDesenhoInicialMs: TECH === 'p5' ? +p5InitialDrawMs.toFixed(3) : null,
    p5DesenhosDuranteTeste: TECH === 'p5' ? p5DrawCount : null,
    p5TempoMedioDesenhoMs: TECH === 'p5' && p5DrawCount ? +(p5DrawMs / p5DrawCount).toFixed(3) : null,
    memoriaTexturaAproximadaBytes: benchmarkImage ? WIDTH * HEIGHT * 4 : null,
    shader: TECH === 'shader' ? 'fragment shader; sem textura de panorama' : null
  };
}

function percentile(sorted, fraction) {
  return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * fraction))];
}

function measureOnce(requestedMode, mode, runIndex) {
  return new Promise((resolve) => {
    const intervals = [];
    let previous = 0;
    let phase = 'warmup';
    let phaseStart = 0;
    const runStartedAt = new Date();

    function step(now) {
      if (phaseStart === 0) phaseStart = now;
      if (previous && phase === 'measure') intervals.push(now - previous);
      previous = now;

      const elapsed = now - phaseStart;
      if (phase === 'warmup' && elapsed >= WARMUP_MS) {
        phase = 'measure';
        phaseStart = now;
        previous = now;
      } else if (phase === 'measure' && elapsed >= MEASURE_MS) {
        const sorted = intervals.slice().sort((a, b) => a - b);
        const average = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
        const slow = intervals.filter((value) => value > FRAME_LIMIT_MS).length;
        resolve({
          repeticao: runIndex + 1,
          condicaoSolicitada: requestedMode,
          modoRenderizado: mode,
          inicioLocal: runStartedAt.toLocaleString(),
          fimLocal: new Date().toLocaleString(),
          inicioUTC: runStartedAt.toISOString(),
          fimUTC: new Date().toISOString(),
          duracaoMs: Math.round(elapsed),
          quadros: intervals.length,
          fpsMedio: +(1000 / average).toFixed(2),
          quadroMedioMs: +average.toFixed(2),
          p95Ms: +percentile(sorted, 0.95).toFixed(2),
          maxMs: +sorted[sorted.length - 1].toFixed(2),
          quadrosAcima33_4msPct: +(slow / intervals.length * 100).toFixed(2)
        });
        return;
      }
      animationFrame = requestAnimationFrame(step);
    }
    setMode(mode);
    requestAnimationFrame(step);
  });
}

async function renderResults(deviceName, mode) {
  latestPayload = {
    teste: {
      tecnologia: TECH,
      nomeAparelho: deviceName,
      modoAtual: mode,
      horaInicioLocal: new Date(startedAt).toLocaleString(),
      horaInicioUTC: startedAt,
      horaFimLocal: new Date().toLocaleString(),
      horaFimUTC: new Date().toISOString(),
      enderecoPagina: location.href,
      protocolo: { aquecimentoSegundos: 5, medicaoSegundos: 15, repeticoes: RUNS, limiteQuadroLentoMs: FRAME_LIMIT_MS },
      dispositivo: await browserDetails(),
      preparacao: preparationMetrics,
      resultados: results
    }
  };
  saveHistory(latestPayload.teste);
  renderAnalysis();
  $('log').value = JSON.stringify({
    teste: latestPayload.teste,
    comparacao: getComparisonSummary(latestPayload.teste)
  }, null, 2);
  $('copy').disabled = false;
}

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function conditionKey(test) {
  const device = test.dispositivo;
  return [
    test.nomeAparelho.trim().toLowerCase(),
    device.gpu,
    device.telaCSS,
    device.pixelRatioAplicado,
    device.antialiasSolicitado,
    device.camera,
    device.cameraResolucao || 'sem-camera'
  ].join('|');
}

function readHistory() {
  try {
    const history = JSON.parse(localStorage.getItem(RUN_HISTORY_KEY) || '{}');
    return history && typeof history === 'object' && !Array.isArray(history) ? history : {};
  } catch (error) {
    console.warn('Não foi possível ler o histórico comparativo salvo.', error);
    return {};
  }
}

function saveHistory(test) {
  const history = readHistory();
  const key = conditionKey(test);
  const testSummary = {
    tecnologia: TECH,
    nomeAparelho: test.nomeAparelho,
    modo: test.modoAtual,
    fpsMediano: +median(results.map((item) => item.fpsMedio)).toFixed(2),
    p95MedianoMs: +median(results.map((item) => item.p95Ms)).toFixed(2),
    quadrosLentosMedianoPct: +median(results.map((item) => item.quadrosAcima33_4msPct)).toFixed(2),
    horaLocal: new Date().toLocaleString()
  };
  history[key] = history[key] || {};
  history[key][test.modoAtual] = history[key][test.modoAtual] || {};
  history[key][test.modoAtual][TECH] = testSummary;
  try {
    localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn('Não foi possível guardar o histórico comparativo neste navegador.', error);
    status('Resultados calculados, mas o navegador não permitiu guardar o histórico entre páginas.');
  }
}

function getComparisonSummary(test) {
  const history = readHistory();
  const modeHistory = history[conditionKey(test)] && history[conditionKey(test)][test.modoAtual] || {};
  return {
    modo: test.modoAtual,
    comparacao: TECHNOLOGIES.map((tech) => modeHistory[tech] || null).filter(Boolean)
  };
}

function analysisFor(modeHistory) {
  const entries = TECHNOLOGIES.map((tech) => modeHistory[tech]).filter(Boolean);
  if (!entries.length) return 'Execute um teste para ver a análise.';

  const lines = entries.map((entry) =>
    `${techLabel(entry.tecnologia)}: mediana ${entry.fpsMediano} fps, p95 ${entry.p95MedianoMs} ms, quadros lentos ${entry.quadrosLentosMedianoPct}%.`
  );
  if (entries.length > 1) {
    const fpsValues = entries.map((entry) => entry.fpsMediano);
    const p95Values = entries.map((entry) => entry.p95MedianoMs);
    const fpsSpread = Math.max(...fpsValues) - Math.min(...fpsValues);
    const p95Spread = Math.max(...p95Values) - Math.min(...p95Values);
    if (fpsSpread > 15 || p95Spread > 5) {
      lines.push('A diferença entre tecnologias é relevante; interprete junto com a variação das três repetições.');
    } else {
      lines.push('Resultados próximos nesta condição; a variação entre repetições pode explicar parte da diferença.');
    }
  }
  const complete = TECHNOLOGIES.every((tech) => modeHistory[tech]);
  if (complete) {
    const ordered = entries.slice().sort((a, b) => a.p95MedianoMs - b.p95MedianoMs);
    lines.push(`Menor p95 nesta condição: ${techLabel(ordered[0].tecnologia)}.`);
  } else {
    lines.push('A comparação entre tecnologias aparece quando os resultados deste modo forem coletados nas três páginas com as mesmas condições.');
  }
  return lines.join('\n');
}

function techLabel(tech) {
  return tech === 'p5' ? 'p5.js' : tech === 'image' ? 'Imagem' : 'Shader';
}

function renderAnalysis() {
  const history = readHistory();
  const key = latestPayload ? conditionKey(latestPayload.teste) : null;
  const saved = key && history[key] || {};
  const modeHistory = latestPayload ? saved[latestPayload.teste.modoAtual] || {} : {};
  const fps = median(results.map((item) => item.fpsMedio));
  const p95 = median(results.map((item) => item.p95Ms));
  const slow = median(results.map((item) => item.quadrosAcima33_4msPct));
  const quality = p95 <= 20 ? 'Fluidez boa nesta rodada.' : p95 <= 33.4
    ? 'Atenção: p95 acima de 20 ms; confira as repetições e compare com as outras tecnologias.'
    : 'Desempenho baixo: muitas entregas de quadro podem ultrapassar 30 fps.';
  $('analysis-current').textContent =
    `${latestPayload.teste.modoAtual === 'static' ? 'Teste 1 — estático' : 'Teste 2 — animado'}: ` +
    `FPS mediano ${fps.toFixed(2)}; p95 mediano ${p95.toFixed(2)} ms; ` +
    `${slow.toFixed(2)}% dos quadros acima de ${FRAME_LIMIT_MS} ms. ${quality}`;
  $('analysis-history').textContent = analysisFor(modeHistory);
}

async function run(mode) {
  if (!sceneEl.hasLoaded) {
    status('Aguardando o renderer...');
    return;
  }
  const deviceName = $('device-label').value.trim();
  if (!deviceName) {
    status('Informe o nome do aparelho uma vez; ele será reutilizado nas outras páginas.');
    $('device-label').focus();
    return;
  }
  try {
    localStorage.setItem(DEVICE_NAME_KEY, deviceName);
  } catch (error) {
    console.warn('Não foi possível guardar o nome do aparelho.', error);
  }
  results.length = 0;
  startedAt = new Date().toISOString();
  p5DrawMs = 0;
  p5DrawCount = 0;
  $('run-static').disabled = true;
  $('run-animated').disabled = true;
  const effectiveMode = TECH === 'image' ? 'static' : mode;
  const note = TECH === 'image' && mode === 'animated' ? ' (imagem mantida estática: referência)' : '';
  $('copy').disabled = true;
  $('analysis-current').textContent = 'Medição em andamento…';
  $('analysis-history').textContent = '';
  for (let index = 0; index < RUNS; index++) {
    status(`Modo ${mode}${note}: aquecimento/medição ${index + 1}/${RUNS}…`);
    results.push(await measureOnce(mode, effectiveMode, index));
  }
  status(`Concluído: ${RUNS} repetições no modo ${mode}${note}.`);
  await renderResults(deviceName, mode);
  $('run-static').disabled = false;
  $('run-animated').disabled = false;
}

async function toggleCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
    cameraStream = null;
    $('camera').srcObject = null;
    $('camera-button').textContent = 'Ligar câmera';
    return;
  }
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    $('camera').srcObject = cameraStream;
    await $('camera').play();
    $('camera-button').textContent = 'Desligar câmera';
    status('Câmera ligada. Mantenha a mesma condição nos três testes.');
  } catch (error) {
    status(`Câmera indisponível (${error.name}); teste seguirá sem câmera.`);
  }
}

async function copyLog() {
  const text = $('log').value;
  if (!text) {
    status('Rode pelo menos um teste antes de copiar os resultados.');
    return;
  }
  try {
    if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard API indisponível.');
    await navigator.clipboard.writeText(text);
    status('Dados e análise copiados para a área de transferência.');
  } catch (error) {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      textarea.remove();
      if (copied) status('Dados e análise copiados para a área de transferência.');
      else {
        $('log').focus();
        $('log').select();
        status('Cópia automática bloqueada pelo navegador. O texto está selecionado para copiar manualmente.');
      }
    } catch (fallbackError) {
      console.error('Falha ao copiar os resultados.', error, fallbackError);
      $('log').focus();
      $('log').select();
      status('Não foi possível copiar automaticamente. O texto está selecionado para copiar manualmente.');
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  $('tech').textContent = TECH === 'p5' ? 'p5.js' : TECH === 'image' ? 'Imagem estática' : 'Fragment shader GLSL';
  $('page-url').textContent = location.href;
  try {
    const savedName = localStorage.getItem(DEVICE_NAME_KEY);
    if (savedName) $('device-label').value = savedName;
  } catch (error) {
    console.warn('Não foi possível recuperar o nome do aparelho salvo.', error);
  }
  $('device-label').addEventListener('input', () => {
    try {
      localStorage.setItem(DEVICE_NAME_KEY, $('device-label').value.trim());
    } catch (error) {
      console.warn('Não foi possível guardar o nome do aparelho.', error);
    }
  });
  $('run-static').addEventListener('click', () => run('static'));
  $('run-animated').addEventListener('click', () => run('animated'));
  $('camera-button').addEventListener('click', toggleCamera);
  $('copy').addEventListener('click', copyLog);
  $('analysis-current').textContent = 'Execute um teste para ver a análise desta página.';
  $('analysis-history').textContent = 'Resultados salvos de outros testes aparecem aqui quando as condições coincidem.';

  try {
    if (!sceneEl.hasLoaded) await new Promise((resolve) => sceneEl.addEventListener('loaded', resolve, { once: true }));
    const ratio = requestedRatio > 0 ? Math.max(1, Math.min(devicePixelRatio, requestedRatio)) : devicePixelRatio;
    sceneEl.renderer.setPixelRatio(ratio);
    sceneEl.resize();
    const preparationStarted = performance.now();
    await buildBackground();
    setMode('static');
    const compilationStarted = performance.now();
    sceneEl.renderer.compile(sceneEl.object3D, sceneEl.camera);
    preparationMetrics = {
      construcaoMs: +(compilationStarted - preparationStarted).toFixed(2),
      compilacaoMateriaisMs: +(performance.now() - compilationStarted).toFixed(2)
    };
    animationFrame = requestAnimationFrame(frameShader);
    $('run-static').disabled = false;
    $('run-animated').disabled = false;
    $('camera-button').disabled = !navigator.mediaDevices?.getUserMedia;
    status('Pronto. Informe o aparelho, ligue a câmera se possível e mantenha as mesmas condições entre páginas.');
  } catch (error) {
    console.error(error);
    status(`Falha ao preparar o cenário: ${error.message}`);
  }
});

window.addEventListener('beforeunload', () => {
  cancelAnimationFrame(animationFrame);
  if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
  if (p5Instance) p5Instance.remove();
  if (background) {
    sceneEl.object3D.remove(background);
    background.geometry.dispose();
    if (background.material.map) background.material.map.dispose();
    background.material.dispose();
  }
});
