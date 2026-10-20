// The world being edited, in memory (D2: the editor never writes to disk — it exports a file).
//
// One world at a time (D14), and the JSON is the truth: the panels read from here and write here, and
// what leaves through the export (`editor.export`) is what is here. Keeping it in one object is also
// what makes "desfazer" possible later (D35) — a snapshot is a copy of this.
let current = null;

// What was opened: the parsed world and the name of the file it came from. The name is what the
// export downloads, so a file opened as `praia.json` does not come back as `world.json`.
export function setWorld(data, file) {
  current = { data: data, file: file };
  return current;
}

export function currentWorld() {
  return current;
}

export function close() {
  current = null;
}

// A world file, read from text. Throws with the reason, because the caller shows it: a file that is
// not JSON is the most common mistake of a hand-edited export.
export function parseWorld(text) {
  const data = JSON.parse(text);
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new Error('the file does not hold a world object');
  }
  return data;
}

// The exported text, byte-stable: two spaces and a newline at the end, which is what the worlds in
// data/worlds/ already are — so exporting a world that was not touched gives back the same file.
// The key order is the order in the file, because JSON.parse keeps it.
export function exportWorld(data) {
  return JSON.stringify(data, null, 2) + '\n';
}

// The slug the world says it is (D24/D28), falling back to the file name when a hand-written file
// forgets it — the validator is what reports the omission.
export function slugOf(data, fallback) {
  const slug = data && data.world && data.world.slug;
  if (typeof slug === 'string' && slug.length > 0) return slug;
  return fallback || 'world';
}

// How much there is of each thing: the line the editor shows when a world opens, and the number a
// panel will put next to its list.
export function countsOf(data) {
  return {
    dimensions: ((data && data.dimensions) || []).length,
    artworks: ((data && data.artworks) || []).length,
    portals: ((data && data.portals) || []).length,
    assets: Object.keys((data && data.assets) || {}).length
  };
}
