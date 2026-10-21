// Regression sweep for T2 and T3 (docs/ROADMAP.md, section 10).
//
// T2 asks: over a sweep of poses, does any pose show a cut frame border?
// T3 asks: does the frame contour close, sample by sample?
//
// Why this runs in the page and not in a Node runner: what is measured is the rendered frame,
// and that only exists in the WebGL drawing buffer. The project has no build and no
// dependencies (decision D1), and section 10 of the roadmap defines the automation as "the same
// script we already use in the browser". Load the scene over HTTP and run, from the console:
//
//   (await import('./tools/regression/pose-sweep.mjs')).runPoseSweep()
//
// Method, per pose: the frame is rendered twice, with the four bars visible and hidden, and the
// difference between the two renders gives the frame's own pixels - presence, not colour, which
// is the rule section 10 fixed after the T4 and T5 measurements. The centre line of each bar is
// projected and sampled every few pixels: a sample fails when the frame is missing where it has
// to be visible. Points inside the opening are sampled as a control - if the control sees a
// difference, the two renders differ for a reason other than the frame (noise, an animated
// texture) and the result is not valid.
//
// The pose is the relative transform between the camera and a portal, so the camera is parked far
// from the scene and an isolated portal is moved in front of it: no other window can cover the
// frame and no other geometry can be mistaken for it. The portal is a real one - same component,
// same mask, same pipeline as the portals of the scene.
//
// Options (all optional):
//   distances, angles, heights   pose grid (metres, degrees, metres)
//   stepPx, tolerancePx, marginPx   sampling and tolerance (pixels)
//   minSamplesPerPose            below this, the pose is reported as not assessable
//   fault                        null | 'stencil' | 'bar' - injects a defect on purpose, so the
//                                sweep can be shown to fail when the frame is cut

const RIG = {
  portalId: 63,
  width: 8,
  height: 10,
  // Parked far from every other portal. Nothing else is in this line of sight, so the only
  // window that can act on the frame is the rig's own.
  site: { x: 200, y: 1.6, z: 0 }
};

const DEFAULTS = {
  distances: [14, 20, 28, 38],
  angles: [-60, -40, -20, 0, 20, 40, 60],
  heights: [-2, 0, 2],
  stepPx: 3,
  tolerancePx: 1,
  marginPx: 4,
  minSamplesPerPose: 12,
  fault: null
};

const BAR_NAME = /-frame-\d+$/;
const MASK_NAME = /-mask$/;

function nextFrame() {
  return new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
}

export async function runPoseSweep(options = {}) {
  const cfg = { ...DEFAULTS, ...options };

  const sceneEl = document.querySelector('a-scene');
  const cameraEl = document.querySelector('a-camera');
  const cameraComponent = cameraEl && cameraEl.components ? cameraEl.components.camera : null;
  if (!sceneEl || !sceneEl.renderer || !cameraComponent || !window.portalDebug) {
    throw new Error('pose-sweep: the scene is not ready - needs a-scene with a renderer, a-camera with the camera component, and window.portalDebug. Serve the page over HTTP and let it load, then run again.');
  }

  const renderer = sceneEl.renderer;
  const gl = renderer.getContext();
  const camera = cameraComponent.camera;
  const state = window.portalDebug.state;

  const width = () => gl.drawingBufferWidth;
  const height = () => gl.drawingBufferHeight;

  const render = () => renderer.render(sceneEl.object3D, camera);

  const read = (x, y, w, h) => {
    const buffer = new Uint8Array(w * h * 4);
    gl.readPixels(x, height() - (y + h), w, h, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
    return buffer;
  };

  const project = (point) => {
    const p = point.clone().project(camera);
    return { x: (p.x * 0.5 + 0.5) * width(), y: (-p.y * 0.5 + 0.5) * height(), z: p.z };
  };

  const savedCameraPosition = cameraEl.object3D.position.clone();
  const savedDimension = state.activeDimension;

  const rig = document.createElement('a-entity');
  rig.setAttribute('data-regression-rig', '');
  // The collision box is parked far away on purpose: the sweep must not traverse the portal,
  // and the box plays no part in how the frame is drawn.
  rig.setAttribute(
    'stencil-portal',
    `id: ${RIG.portalId}; dimensionA: 0; dimensionB: 1; ownedBy: 0; ` +
      `width: ${RIG.width}; height: ${RIG.height}; box: 0.1 0.1 0.1; boxPosition: 0 1000 0`
  );
  sceneEl.appendChild(rig);
  await nextFrame();

  const portal = rig.components['stencil-portal'];
  if (!portal) {
    rig.remove();
    throw new Error('pose-sweep: the rig portal did not initialise');
  }
  // A previous run that did not finish (an error thrown outside the finally, or a reload that
  // kept the entity) would leave a second rig drawing over the frame, and every sample would
  // then read the wrong portal's pixels. Better to fail loudly than to measure the wrong thing.
  const leakedRigs = document.querySelectorAll('[data-regression-rig]');
  if (leakedRigs.length > 1) {
    rig.remove();
    throw new Error('pose-sweep: ' + leakedRigs.length + ' rigs are in the scene, expected 1 - reload the page');
  }

  const bars = portal.portalGroup.children.filter((child) => BAR_NAME.test(child.name));
  const mask = portal.portalGroup.children.find((child) => MASK_NAME.test(child.name));
  if (bars.length !== 4 || !mask) {
    rig.remove();
    throw new Error(`pose-sweep: expected 4 bars and 1 mask, found ${bars.length} bars`);
  }

  const barVisibleBefore = bars.map((bar) => bar.visible);
  let restoreMaterials = () => {};

  // A bar that the fault takes out of the frame for good. It stays in the group (so its world
  // matrix keeps being updated and the samples stay where the bar really is) but is never drawn,
  // in either of the two renders.
  const setBarsVisible = (visible) => bars.forEach((bar) => {
    bar.visible = bar.userData.faultHidden ? false : visible;
  });

  // The centre line of a bar, in world space: a bar is a box, so its centre line runs along its
  // longest axis, at the centre of the two thin axes. Derived from the geometry, so changing the
  // frame size or thickness does not invalidate the sweep.
  const barCenterLine = (bar) => {
    if (!bar.geometry.boundingBox) bar.geometry.computeBoundingBox();
    const box = bar.geometry.boundingBox;
    const size = new THREE.Vector3();
    box.getSize(size);
    const axes = ['x', 'y', 'z'];
    const long = axes.reduce((best, axis) => (size[axis] > size[best] ? axis : best), 'x');
    const thin = axes.filter((axis) => axis !== long).map((axis) => size[axis]);
    const inset = 0.5 * Math.max(...thin);
    const half = size[long] / 2 - inset;
    const from = new THREE.Vector3();
    const to = new THREE.Vector3();
    from[long] = -half;
    to[long] = half;
    return [from.applyMatrix4(bar.matrixWorld), to.applyMatrix4(bar.matrixWorld)];
  };

  const sampleBar = (bar) => {
    const [from, to] = barCenterLine(bar);
    const a = project(from);
    const b = project(to);
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const steps = Math.max(2, Math.round(length / cfg.stepPx));
    const points = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      points.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    }
    return points;
  };

  // Points that are certainly not the frame: the corners of the opening, pulled towards its
  // centre, plus the centre itself.
  const controlPoints = () => {
    if (!mask.geometry.boundingBox) mask.geometry.computeBoundingBox();
    const box = mask.geometry.boundingBox;
    const corners = [
      [box.min.x, box.min.y], [box.max.x, box.min.y],
      [box.max.x, box.max.y], [box.min.x, box.max.y]
    ].map(([x, y]) => project(new THREE.Vector3(x, y, 0).applyMatrix4(mask.matrixWorld)));
    const centre = corners.reduce(
      (sum, corner) => ({ x: sum.x + corner.x / 4, y: sum.y + corner.y / 4 }),
      { x: 0, y: 0 }
    );
    const inward = 0.35;
    return [centre, ...corners.map((corner) => ({
      x: centre.x + (corner.x - centre.x) * inward,
      y: centre.y + (corner.y - centre.y) * inward
    }))];
  };

  const onScreen = (point) => (
    point.x >= cfg.marginPx && point.x <= width() - cfg.marginPx &&
    point.y >= cfg.marginPx && point.y <= height() - cfg.marginPx
  );

  const injectFault = () => {
    if (cfg.fault === 'bar') {
      const hidden = bars[0];
      hidden.userData.faultHidden = true;
      return () => { hidden.userData.faultHidden = false; };
    }
    if (cfg.fault === 'stencil') {
      // The frame is drawn only where the stencil holds the value of the dimension the window
      // shows. Outside the window the stencil is 0, so the whole frame is discarded: this is the
      // defect of law L3 (a stencil test on active-dimension geometry), which is what T2 and T3
      // exist to catch.
      const shown = state.stencilValues.get(portal.data.dimensionB);
      if (shown === undefined) {
        throw new Error('pose-sweep: the core did not assign a stencil value to dimension ' + portal.data.dimensaoB);
      }
      const saved = bars.map((bar) => {
        const material = bar.material;
        const before = {
          stencilWrite: material.stencilWrite,
          stencilFunc: material.stencilFunc,
          stencilRef: material.stencilRef,
          stencilFail: material.stencilFail,
          stencilZFail: material.stencilZFail,
          stencilZPass: material.stencilZPass
        };
        material.stencilWrite = true;
        material.stencilFunc = THREE.EqualStencilFunc;
        material.stencilRef = shown;
        material.stencilFail = THREE.KeepStencilOp;
        material.stencilZFail = THREE.KeepStencilOp;
        material.stencilZPass = THREE.KeepStencilOp;
        material.needsUpdate = true;
        return { material, before };
      });
      return () => saved.forEach(({ material, before }) => {
        Object.assign(material, before);
        material.needsUpdate = true;
      });
    }
    return () => {};
  };

  const result = {
    viewport: { buffer: [width(), height()], css: [window.innerWidth, window.innerHeight] },
    config: cfg,
    durationMs: 0,
    poses: { total: 0, assessed: 0, skipped: 0, withCutBorder: 0 },
    samples: { assessed: 0, failed: 0 },
    controls: { assessed: 0, failed: 0 },
    // Per bar, so a failure shows which side of the frame it came from.
    bars: bars.map((bar) => ({ name: bar.name, samples: 0, failed: 0 })),
    failures: [],
    dimensionChanged: false
  };

  let started = 0;

  try {
    started = performance.now();
    restoreMaterials = injectFault();
    cameraEl.object3D.position.set(RIG.site.x, RIG.site.y, RIG.site.z);
    window.portalDebug.setActiveDimension(0);
    await nextFrame();

    for (const distance of cfg.distances) {
      for (const angle of cfg.angles) {
        for (const heightOffset of cfg.heights) {
          result.poses.total++;

          rig.setAttribute('position', { x: RIG.site.x, y: heightOffset, z: -distance });
          rig.setAttribute('rotation', { x: 0, y: angle, z: 0 });
          await nextFrame();
          portal.portalGroup.updateWorldMatrix(true, true);

          const samples = bars
            .flatMap((bar, barIndex) => sampleBar(bar).map((point) => ({ ...point, barIndex })))
            .filter(onScreen);
          const controls = controlPoints().filter(onScreen);
          if (samples.length < cfg.minSamplesPerPose) {
            result.poses.skipped++;
            continue;
          }
          result.poses.assessed++;

          const all = [...samples, ...controls];
          const minX = Math.max(0, Math.floor(Math.min(...all.map((p) => p.x)) - cfg.marginPx));
          const maxX = Math.min(width(), Math.ceil(Math.max(...all.map((p) => p.x)) + cfg.marginPx));
          const minY = Math.max(0, Math.floor(Math.min(...all.map((p) => p.y)) - cfg.marginPx));
          const maxY = Math.min(height(), Math.ceil(Math.max(...all.map((p) => p.y)) + cfg.marginPx));
          const regionWidth = maxX - minX;
          const regionHeight = maxY - minY;
          if (regionWidth <= 0 || regionHeight <= 0) {
            result.poses.skipped++;
            result.poses.assessed--;
            continue;
          }

          setBarsVisible(true);
          render();
          const withFrame = read(minX, minY, regionWidth, regionHeight);
          setBarsVisible(false);
          render();
          const withoutFrame = read(minX, minY, regionWidth, regionHeight);
          setBarsVisible(true);

          const differs = (point) => {
            // gl.readPixels returns rows bottom-up, so the row for a screen y is (bottom - 1 - y):
            // reading them top-down silently compares the wrong pixels.
            const px = Math.round(point.x) - minX;
            const py = (minY + regionHeight - 1) - Math.round(point.y);
            for (let dy = -cfg.tolerancePx; dy <= cfg.tolerancePx; dy++) {
              for (let dx = -cfg.tolerancePx; dx <= cfg.tolerancePx; dx++) {
                const x = px + dx;
                const y = py + dy;
                if (x < 0 || y < 0 || x >= regionWidth || y >= regionHeight) continue;
                const i = (y * regionWidth + x) * 4;
                if (withFrame[i] !== withoutFrame[i] ||
                    withFrame[i + 1] !== withoutFrame[i + 1] ||
                    withFrame[i + 2] !== withoutFrame[i + 2] ||
                    withFrame[i + 3] !== withoutFrame[i + 3]) {
                  return true;
                }
              }
            }
            return false;
          };

          let poseFailures = 0;
          for (const sample of samples) {
            const tally = result.bars[sample.barIndex];
            tally.samples++;
            result.samples.assessed++;
            if (!differs(sample)) {
              result.samples.failed++;
              tally.failed++;
              poseFailures++;
            }
          }
          let controlFailures = 0;
          for (const control of controls) {
            result.controls.assessed++;
            if (differs(control)) {
              result.controls.failed++;
              controlFailures++;
            }
          }

          if (poseFailures > 0) {
            result.poses.withCutBorder++;
            result.failures.push({ distance, angle, heightOffset, samples: samples.length, failed: poseFailures, controlFailures });
          }
        }
      }
    }

    result.dimensionChanged = state.activeDimension !== savedDimension;
  } finally {
    result.durationMs = Math.round(performance.now() - started);
    restoreMaterials();
    setBarsVisible(true);
    bars.forEach((bar, i) => { bar.visible = barVisibleBefore[i]; });
    rig.remove();
    cameraEl.object3D.position.copy(savedCameraPosition);
    window.portalDebug.setActiveDimension(savedDimension);
    await nextFrame();
  }

  const methodValid = result.controls.failed === 0 && result.controls.assessed > 0;
  result.verdict = {
    method: methodValid ? 'valid' : 'invalid',
    T2: methodValid && result.poses.withCutBorder === 0 ? 'pass' : 'fail',
    T3: methodValid && result.samples.failed === 0 ? 'pass' : 'fail'
  };

  console.log('[pose-sweep] T2 and T3, ' + result.poses.total + ' poses (' + result.poses.assessed +
    ' assessed, ' + result.poses.skipped + ' not assessable)');
  console.table([{
    'poses with cut border (T2)': result.poses.withCutBorder,
    'border failures (T3)': result.samples.failed,
    'samples assessed': result.samples.assessed,
    'control failures': result.controls.failed,
    'method': result.verdict.method,
    'T2': result.verdict.T2,
    'T3': result.verdict.T3
  }]);
  if (result.failures.length) console.log('[pose-sweep] failures', result.failures);
  console.table(result.bars.map((bar) => ({ bar: bar.name, samples: bar.samples, failed: bar.failed })));
  if (result.dimensionChanged) console.warn('[pose-sweep] the active dimension changed during the sweep');

  return result;
}
