// O motor do teste: decide, quadro a quadro, quais fundos animam e quais ficam parados. Funciona
// sozinho (modo `auto`) e deixa dois modos de comparação: tudo parado e tudo animado.
//
// Só anima o que se vê: a dimensão ativa e as que as janelas dos portais mostram. Uma dimensão
// sem janela nunca é desenhada pelo stencil, por isso nunca é redesenhada.
//
// Os limites são os acordados com as medições de dois celulares (um fraco, em que a animação
// derrubou o desempenho a 4–7 fps, e um forte, que sustentou 60 fps).
import { state } from '../js/core/index.js';
import { scenes } from './dimension-p5.js';

export const LIMITS = {
  p95Ok: 20,     // ms: com o p95 até aqui, há folga para animar mais um fundo
  p95Bad: 25,    // ms: acima disto, recua um fundo
  drawMax: 6     // ms: um sketch que custa mais do que isto a desenhar nem é tentado
};

const WINDOW_MS = 2500;      // janela em que o tempo de quadro é medido
const STEP_MS = 3000;        // intervalo entre decisões
const WARMUP_MS = 3000;      // espera inicial, com tudo parado
const BACKOFF_START = 15000; // depois de recuar, espera antes de tentar de novo
const BACKOFF_MAX = 120000;
const SAMPLE_MS = 2000;      // intervalo do registo de amostras
const MAX_LOG = 600;

export function createEngine({ fps = 30 } = {}) {
  const interval = 1000 / fps;
  const times = [];
  const samples = [];
  const events = [];
  let mode = 'auto';
  let level = 0;
  let running = false;
  let startedAt = 0;
  let lastStep = 0;
  let lastSample = 0;
  let blockedUntil = 0;
  let backoff = BACKOFF_START;

  const current = { fps: 0, p95: 0, drawMs: 0, visible: 0, animated: 0, level: 0, mode };

  function visibleScenes() {
    const ids = [state.activeDimension, ...[...state.stencilValues.keys()].sort((a, b) => a - b)];
    return [...new Set(ids)].map((id) => scenes.get(id)).filter(Boolean);
  }

  function frameStats(now) {
    while (times.length && now - times[0] > WINDOW_MS) times.shift();
    if (times.length < 12) return null;
    const deltas = [];
    for (let i = 1; i < times.length; i++) deltas.push(times[i] - times[i - 1]);
    deltas.sort((a, b) => a - b);
    const average = (times[times.length - 1] - times[0]) / (times.length - 1);
    return { fps: 1000 / average, p95: deltas[Math.min(deltas.length - 1, Math.floor(deltas.length * 0.95))] };
  }

  function note(what, stats, extra) {
    events.push(Object.assign({
      t: +((performance.now() - startedAt) / 1000).toFixed(1), what, level,
      p95: stats ? +stats.p95.toFixed(1) : null
    }, extra));
  }

  function govern(now, stats, visible) {
    lastStep = now;
    if (!stats) return;
    if (level > visible.length) level = visible.length;

    if (level > 0 && stats.p95 > LIMITS.p95Bad) {
      level--;
      times.length = 0;
      blockedUntil = now + backoff;
      backoff = Math.min(backoff * 2, BACKOFF_MAX);
      note('recuou', stats);
      return;
    }
    if (stats.p95 <= LIMITS.p95Ok && level < visible.length && now >= blockedUntil) {
      const candidate = visible[level];
      if (candidate.avgDrawMs > LIMITS.drawMax) {
        blockedUntil = now + backoff;
        note('recusou: desenho caro', stats, { scene: candidate.name, drawMs: +candidate.avgDrawMs.toFixed(2) });
        return;
      }
      level++;
      times.length = 0;
      note('avancou', stats, { scene: candidate.name });
    }
  }

  function tick(now) {
    if (!running) return;
    requestAnimationFrame(tick);
    times.push(now);

    const visible = visibleScenes();
    const stats = frameStats(now);
    if (mode === 'auto' && now - startedAt > WARMUP_MS && now - lastStep >= STEP_MS) govern(now, stats, visible);

    const allowed = mode === 'estatico' ? 0 : mode === 'tudo' ? visible.length : Math.min(level, visible.length);
    scenes.forEach((scene) => { scene.animating = false; });
    let drawCost = 0;
    visible.slice(0, allowed).forEach((scene) => {
      scene.animating = true;
      drawCost += scene.avgDrawMs;
      if (now - scene.lastDraw >= interval - 1) {
        scene.lastDraw = now;
        scene.redraw(now / 1000);
      }
    });

    Object.assign(current, {
      fps: stats ? stats.fps : 0, p95: stats ? stats.p95 : 0,
      drawMs: allowed ? drawCost : 0, visible: visible.length,
      animated: Math.min(allowed, visible.length), level, mode
    });
    if (now - lastSample >= SAMPLE_MS && stats) {
      lastSample = now;
      samples.push({
        t: +((now - startedAt) / 1000).toFixed(1), mode, animados: current.animated, visiveis: visible.length,
        fps: +stats.fps.toFixed(1), p95: +stats.p95.toFixed(1), desenhoMs: +drawCost.toFixed(2)
      });
      if (samples.length > MAX_LOG) samples.shift();
    }
  }

  return {
    current,
    start() {
      if (running) return;
      running = true;
      startedAt = lastStep = lastSample = performance.now();
      requestAnimationFrame(tick);
    },
    stop() { running = false; },
    setMode(next) {
      mode = next;
      level = 0;
      times.length = 0;
      blockedUntil = 0;
      backoff = BACKOFF_START;
      events.push({ t: +((performance.now() - startedAt) / 1000).toFixed(1), what: 'modo: ' + next });
    },
    snapshot() {
      return {
        limites: LIMITS, fpsDosFundos: fps,
        fundos: [...scenes.values()].map((scene) => ({ dimensao: scene.id, nome: scene.name, desenhoMs: +scene.avgDrawMs.toFixed(2) })),
        eventos: events, amostras: samples
      };
    }
  };
}
