// Normalises the images of the exhibition and derives the portraits of the world doors (Fase 3B,
// block B5 — docs/ROADMAP.md section 9).
//
// Why: a sphere only unwraps an equirectangular image of 2:1 (law L14), and the panoramas of the
// exhibition were not made for one — `forest.jpg` is 9923×2614 (3,80:1), which costs 98,9 MB of
// texture, and `skycloud.jpg` is 960×240 (4:1). The rule applied here, decided by the author:
// **crop the centre, never scale up** — scaling up adds no detail, only pixels to remember.
//
// Why in the browser and not in node: decoding a JPEG needs a decoder, the project has no build and
// no dependencies (D1), and the browser is where the pixels are — the same reason the pose sweep
// lives there (tools/regression/pose-sweep.mjs). A canvas crops and scales, and the result comes out
// as a data URL: `runNormalize({ download: true })` saves every file with the name it has to have,
// and `normalizeOne(job)` gives one back for a caller that writes files itself.
//
// Usage, with the exhibition open over HTTP:
//   (await import('/tools/assets/normalize.mjs')).runNormalize()
//
// The jobs below are the record of this migration, the same way the converter of Fase 0 keeps its
// own (tools/migration/convert.mjs): the files that only change folder are not here — a `git mv`
// touches no pixel.

// The standard of a panorama (law L14): 2:1 equirectangular. The width is a ceiling, not a target:
// an image below it costs less memory and is not a defect.
export const PANORAMA = { ratio: 2, standardWidth: 2048 };

// The longest side an artwork may keep. It is a 4×3 m panel seen from a few metres, and the same
// file is what the modal shows — 2048 px is more than both need, and 6000×3000 cost 68,7 MB.
export const ARTWORK_MAX_SIDE = 2048;

export const JOBS = [
  // The panoramas, cropped to 2:1 and scaled down to what the standing width says.
  { what: 'cidade 360º', from: 'assets/images/forest.jpg', to: 'assets/panoramas/cidade-d0-forest.jpg', ratio: 2, width: 2048 },
  { what: 'céu 360º', from: 'assets/images/skycloud.jpg', to: 'assets/panoramas/ceu-d0-skycloud.jpg', ratio: 2, width: 480 },
  // The artworks, bounded by the longest side. `eiffel.jpg` (1226×855) is already below it and is
  // not here: it only changes folder.
  { what: 'obra (cidade)', from: 'assets/images/bryan-goff-IuyhXAia8EA-unsplash.jpg', to: 'assets/artworks/cidade-d0-bryan-goff.jpg', maxSide: ARTWORK_MAX_SIDE },
  // The portraits of the worlds, derived from the panorama of the destination (D14: what is seen
  // through the window is what is seen after crossing).
  { what: 'retrato da cidade', from: 'assets/panoramas/cidade-d0-forest.jpg', to: 'assets/previews/cidade.jpg', ratio: 2, width: 2048 },
  { what: 'retrato da praia', from: 'assets/panoramas/praia-d0-praia.jpg', to: 'assets/previews/praia.jpg', ratio: 2, width: 1024 },
  { what: 'retrato do céu', from: 'assets/panoramas/ceu-d0-skycloud.jpg', to: 'assets/previews/ceu.jpg', ratio: 2, width: 480 }
];

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('could not load ' + path));
    image.src = path + '?normalize=' + Date.now();
  });
}

// The centre crop of an image to a ratio, and then the scale down to a width. Never scales up: when
// the crop is already narrower than the asked width, the crop is what comes out.
function cropScale(image, job) {
  const source = { x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight };

  if (job.ratio) {
    const current = source.width / source.height;
    if (current > job.ratio) {
      source.width = Math.round(source.height * job.ratio);
      source.x = Math.round((image.naturalWidth - source.width) / 2);
    } else if (current < job.ratio) {
      source.height = Math.round(source.width / job.ratio);
      source.y = Math.round((image.naturalHeight - source.height) / 2);
    }
  }

  let width = source.width;
  let height = source.height;
  if (job.width && job.width < source.width) {
    width = job.width;
    height = Math.round(source.height * (job.width / source.width));
  }
  if (job.maxSide && Math.max(source.width, source.height) > job.maxSide) {
    const scale = job.maxSide / Math.max(source.width, source.height);
    width = Math.round(source.width * scale);
    height = Math.round(source.height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const context = canvas.getContext('2d');
  context.drawImage(image, source.x, source.y, source.width, source.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function megabytes(bytes) {
  return Math.round((bytes / 1048576) * 10) / 10;
}

// One job: loads, crops, scales and gives the result back as a data URL, with what it was and what
// it became. The caller decides what to do with it (a download, or writing a file).
export async function normalizeOne(job) {
  const image = await loadImage(job.from);
  const canvas = cropScale(image, job);
  const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
  const before = { width: image.naturalWidth, height: image.naturalHeight };
  const after = { width: canvas.width, height: canvas.height };
  return {
    what: job.what,
    from: job.from,
    to: job.to,
    before,
    after,
    shape: Math.round((after.width / after.height) * 100) / 100,
    ratioBefore: Math.round((before.width / before.height) * 100) / 100,
    textureMBBefore: megabytes(before.width * before.height * 4),
    textureMBAfter: megabytes(after.width * after.height * 4),
    changed: before.width !== after.width || before.height !== after.height,
    dataUrl
  };
}

// Every job in turn. With `download: true` it saves each file with the name it must have (the
// browser writes them to its download folder, and a human moves them into the project).
export async function runNormalize(options = {}) {
  const results = [];
  for (const job of JOBS) {
    const result = await normalizeOne(job);
    results.push(result);
    if (options.download) {
      const link = document.createElement('a');
      link.href = result.dataUrl;
      link.download = result.to.split('/').pop();
      document.body.appendChild(link);
      link.click();
      link.remove();
      // One at a time: a browser ignores a second download started in the same instant.
      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }
  console.table(results.map((r) => ({
    file: r.to,
    was: r.before.width + '×' + r.before.height + ' (' + r.ratioBefore + ':1)',
    now: r.after.width + '×' + r.after.height + ' (' + r.shape + ':1)',
    textureMB: r.textureMBBefore + ' → ' + r.textureMBAfter,
    changed: r.changed
  })));
  return results;
}
