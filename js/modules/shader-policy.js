// The cadence policy of a shader background (docs/ROADMAP.md §14, R15).
//
// What it promises, in the order the README documents: the animation never runs faster than 20
// updates per second; under **persistent** degradation the pixelRatio comes down first, inside
// `[1, the device's own]`; only at the floor does the cadence fall to 15 and then to a still frame.
// It never goes back up on its own — no oscillation — and `prefers-reduced-motion` keeps it still
// from the start.
//
// Why a separate file: the decisions are a function of samples, so the instrument drives them with
// a clock instead of a GPU, and the exhibition drives them with the frames A-Frame hands it. One
// list of numbers, one state machine, two ways of feeding it.
//
// The measurement follows R15's warning: an interval of 50 ms at 20 FPS is the **expected** cadence,
// not a lost frame. What counts is how many updates were delivered in the window and how late they
// were against their deadline; a slow scene shows as fewer delivered updates and a longer tail of
// frame times.

export const SHADER_POLICY = {
  targetFps: 20,
  fallbackFps: 15,
  minPixelRatio: 1,
  staticTime: 2,           // the `uTime` of the still frame — a scene that is visible, not a black one
  warmupMs: 3000,          // still frame first: this is the baseline, before any animation
  stepMs: 3000,            // one decision per step, after a full window of samples
  severeMs: 90,            // a frame time this long is degradation on its own (one step, no waiting)
  deliveredFraction: 0.85, // below this share of the cadence, the scene did not sustain it
  lateToleranceMs: 20,     // an update later than its deadline by this much is a late update
  lateFraction: 0.25,      // more late updates than this in a step is degradation
  badToStepDown: 2,        // persistent means two consecutive bad steps
  goodToStepUp: 3,         // three good steps before the pixelRatio is allowed back up
  ratioStep: 0.2,          // a reduction of 20% of the current ratio, towards the floor of 1
  ratioRecovery: 0.05,     // and 5% back, never reaching the value that already went badly
  // The first frame never asks the device for more than this (measured on the weak phone: at the
  // native 2.625 the page drew 38.7 frames/s with a third of the updates late; at 1.945 it drew 57.3).
  // The ladder climbs from here up to the device's own DPR, so the ceiling is still the device's.
  firstRatio: 2,
  // While nothing has ever gone badly, the climb is quick (20% per three good steps) — the ceiling is
  // unknown and there is no reason to take a minute and a half to find it. After the first bad step the
  // cautious 5% applies, under the value that failed.
  ratioClimb: 0.2
};

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createPolicy(options) {
  const settings = options || {};
  const defaults = Object.assign({}, SHADER_POLICY, settings.policy || {});
  let resolution = settings.resolution || null;
  const clock = settings.clock || (() => performance.now());
  const startedAt = clock();

  let cadence = settings.reducedMotion === true ? 0 : defaults.targetFps;
  let ratio = resolution
    ? clamp(Math.min(resolution.max, defaults.firstRatio), resolution.min, resolution.max)
    : defaults.minPixelRatio;
  // The first frame has to be the one the policy says it is: the renderer is born at the device's DPR.
  if (resolution && Math.abs(resolution.get() - ratio) > 0.001) resolution.set(ratio);
  let badAt = 0;
  let badSteps = 0;
  let goodSteps = 0;
  let hidden = false;
  let frozen = settings.reducedMotion === true;
  let started = false;
  let animateFrom = frozen ? Infinity : startedAt + defaults.warmupMs;
  let lastStepAt = animateFrom;
  let lastFrameAt = 0;
  let lastUpdateAt = animateFrom;
  // The cadence is kept by a deadline that advances by one interval, not by "50 ms since the last
  // frame": a display faster than the cadence would otherwise round every update up to the next
  // frame (at 165 Hz, 20/s became 18.4/s). Late frames advance the deadline and skip the missed
  // slots, so an update never comes in bursts.
  let nextUpdateAt = animateFrom;
  let cadenceChanged = false;
  let decision = false;
  let animationTime = defaults.staticTime;

  // Per step: how many updates were delivered, how many were late, and the frame times observed.
  let delivered = 0;
  let late = 0;
  let frameTimes = [];

  const events = [];
  const totals = { updates: 0, late: 0 };

  function note(what, detail) {
    events.push(Object.assign({ t: +((clock() - startedAt) / 1000).toFixed(1), what }, detail));
  }

  function percentiles() {
    if (frameTimes.length < 12) return null;
    const sorted = frameTimes.slice().sort((a, b) => a - b);
    return { p95: sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] };
  }

  function resetStep() {
    delivered = 0;
    late = 0;
    frameTimes = [];
  }

  // The ladder. The pixel ratio is the first lever because the cost grows with the square of the
  // ratio, and the measurement of the weak phone pointed that way; the cadence only falls when there
  // is nothing left to give.
  function step(stats) {
    const expected = cadence;
    const share = expected === 0 ? 0 : delivered / (defaults.stepMs / 1000) / expected;
    const lateShare = delivered ? late / delivered : 0;
    const severe = stats.p95 > defaults.severeMs;
    const bad = severe || share < defaults.deliveredFraction || lateShare > defaults.lateFraction;

    if (!bad) {
      badSteps = 0;
      goodSteps += 1;
      if (resolution && goodSteps >= defaults.goodToStepUp && ratio < resolution.max - 0.001) {
        const ceiling = badAt ? Math.min(resolution.max, badAt * 0.95) : resolution.max;
        if (ratio < ceiling - 0.001) {
          ratio = Math.min(ceiling, ratio * (1 + (badAt ? defaults.ratioRecovery : defaults.ratioClimb)));
          resolution.set(ratio);
          goodSteps = 0;
          note('subiu pr', { pixelRatio: +ratio.toFixed(3), p95: +stats.p95.toFixed(1) });
        }
      }
      return;
    }

    goodSteps = 0;
    badSteps += 1;
    if (badSteps < defaults.badToStepDown && !severe) return;
    badSteps = 0;

    if (resolution && ratio > resolution.min + 0.001) {
      badAt = ratio;
      ratio = Math.max(resolution.min, ratio * (1 - defaults.ratioStep));
      resolution.set(ratio);
      note('desceu pr', { pixelRatio: +ratio.toFixed(3), p95: +stats.p95.toFixed(1) });
      return;
    }
    if (cadence === defaults.targetFps) {
      cadence = defaults.fallbackFps;
      cadenceChanged = true;
      note('15 fps', { p95: +stats.p95.toFixed(1) });
      return;
    }
    if (cadence === defaults.fallbackFps) {
      cadence = 0;
      frozen = true;
      decision = false;
      note('estático');
    }
  }

  // One call per rendered frame, whatever the number of backgrounds: the decision is the policy's, and
  // every shader of the scene obeys the same answer in the same frame.
  function frame(now) {
    if (hidden) return false;
    // A scene with two shader backgrounds calls this twice per frame: anything this close is the
    // same frame, and the decision is shared.
    if (now - lastFrameAt < 1) return decision;
    const previous = lastFrameAt;
    lastFrameAt = now;
    if (previous) {
      frameTimes.push(now - previous);
      if (frameTimes.length > 600) frameTimes.shift();
    }

    if (frozen) return false;
    if (!started) {
      if (now < animateFrom) return false;
      // The still frame is the baseline: the animation starts counting from here, so no decision is
      // taken over a window that was mostly still.
      started = true;
      lastStepAt = now;
      lastUpdateAt = now;
      nextUpdateAt = now + 1000 / Math.min(cadence, defaults.targetFps);
      resetStep();
    }

    if (now - lastStepAt >= defaults.stepMs) {
      const stats = percentiles();
      if (stats) step(stats);
      resetStep();
      lastStepAt = now;
      if (cadenceChanged) {
        cadenceChanged = false;
        nextUpdateAt = now + 1000 / Math.min(cadence, defaults.targetFps);
      }
      if (!cadence) return false;
    }

    const interval = 1000 / Math.min(cadence, defaults.targetFps);
    if (now < nextUpdateAt) {
      decision = false;
      return false;
    }
    const deadline = nextUpdateAt;
    nextUpdateAt += interval;
    if (now - nextUpdateAt >= interval) nextUpdateAt = now + interval;
    const howLate = now - deadline;
    delivered += 1;
    totals.updates += 1;
    if (howLate > defaults.lateToleranceMs) {
      late += 1;
      totals.late += 1;
    }
    animationTime += (now - lastUpdateAt) / 1000;
    lastUpdateAt = now;
    decision = true;
    return true;
  }

  return {
    frame,
    time: () => animationTime,
    setReducedMotion(reduced) {
      if (!reduced) return; // the preference is respected from the start and kept
      cadence = 0;
      frozen = true;
      decision = false;
      note('prefers-reduced-motion');
    },
    setHidden(value) {
      hidden = Boolean(value);
      if (hidden) {
        decision = false;
        return;
      }
      // Back from a hidden page: the first frame is static again, and the ladder is re-evaluated
      // from there (R15).
      started = false;
      animateFrom = clock() + defaults.warmupMs;
      lastStepAt = animateFrom;
      lastUpdateAt = animateFrom;
      nextUpdateAt = animateFrom;
      lastFrameAt = 0;
      resetStep();
      badSteps = 0;
      goodSteps = 0;
      note('voltou visível');
    },
    useResolution(adapter) {
      if (!adapter) return;
      resolution = adapter;
      ratio = clamp(adapter.get(), adapter.min, adapter.max);
    },
    status() {
      return {
        mode: frozen || !started ? 'static' : 'animating',
        cadence,
        pixelRatio: +ratio.toFixed(3),
        updates: totals.updates,
        late: totals.late,
        events: events.slice(-20)
      };
    }
  };
}

// ---- the page's policy ----
//
// One policy for the whole scene: two shader backgrounds must not both decide the pixelRatio, and
// the frame is one. It is created when the first shader background is built, with the scene's
// renderer as its resolution lever, and it reads the two preferences that belong to the page.
let pagePolicy = null;

export function shaderPolicy(resolution) {
  if (pagePolicy) {
    if (resolution) pagePolicy.useResolution(resolution);
    return pagePolicy;
  }
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  pagePolicy = createPolicy({ resolution, reducedMotion });
  if (typeof window !== 'undefined' && window.matchMedia) {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (query.addEventListener) {
      query.addEventListener('change', (event) => pagePolicy.setReducedMotion(event.matches));
    }
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => pagePolicy.setHidden(document.hidden));
  }
  return pagePolicy;
}
