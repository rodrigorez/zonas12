// What the page can say about the files a world names.
//
// The validator asks two questions about files — does this path exist (L9, L10) and how big is this
// image (L14) — and it asks them synchronously, because it is pure and knows nothing of the network.
// A page can only answer by going out for the file, so the answers are collected first, in one batch
// per world, and then handed over as two plain functions. A path nobody asked about answers
// `undefined`, which the validator reports as "not verified" instead of guessing.
//
// Two ways of asking, because there are two kinds of file: an image is loaded once and measured as it
// loads (an `Image` that fires `load` also proves the file is there), and anything else — the videos of
// the sky's works — is asked with a `HEAD`, a request for the headers alone. A video can be tens of
// megabytes, and downloading it to learn that it exists would be a good way to make the editor
// unusable.
const answers = new Map();
// A path that has a question in the air is not asked a second time: typing in a field runs the
// validator on every key, and a batch of GETs per key would be a stampede.
const inFlight = new Set();

function measureImage(path) {
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
    // A file that does not decode is a file that never appears (L9), which is the same answer.
    image.onerror = () => resolve(null);
    image.src = path;
  });
}

async function askHeaders(path) {
  try {
    const response = await fetch(path, { method: 'HEAD' });
    if (response.ok) return true;
    if (response.status === 404 || response.status === 403) return false;
    // A static server may refuse `HEAD` without the file being missing. Saying "missing" there would
    // be a false accusation, so the answer stays unknown.
    return undefined;
  } catch (error) {
    return undefined;
  }
}

// Whether a path exists, as the validator wants it: `true`, `false`, or `undefined` for "not looked at".
export function exists(path) {
  const answer = answers.get(path);
  return answer ? answer.exists : undefined;
}

// The shape of an image, or `undefined` when it was not measured (never asked, or not an image).
export function imageSize(path) {
  const answer = answers.get(path);
  return answer && answer.size ? answer.size : undefined;
}

// Collect the answers for every asset the world names. `refresh` asks again the paths that came back
// missing: the author presses "Validar" after adding the file, and the answer has to be able to change
// from "not there" to "there" — but a file that is there stays there for as long as the page lives.
export async function probe(data, options) {
  const refresh = Boolean(options && options.refresh);
  const jobs = [];
  for (const asset of Object.values((data && data.assets) || {})) {
    const path = asset && asset.path;
    if (typeof path !== 'string' || path === '') continue;
    const known = answers.get(path);
    if (known && known.exists) continue;
    if (known && !refresh) continue;
    if (inFlight.has(path)) continue;
    inFlight.add(path);
    jobs.push((async () => {
      try {
        if (asset.type === 'image') {
          const size = await measureImage(path);
          answers.set(path, size ? { exists: true, size: size } : { exists: false });
        } else {
          answers.set(path, { exists: await askHeaders(path) });
        }
      } finally {
        inFlight.delete(path);
      }
    })());
  }
  await Promise.all(jobs);
  return answers;
}

// For the instruments: what the page knows, path by path.
export function known() {
  return new Map(answers);
}
