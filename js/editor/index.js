// The editor's composition: what the toolbar does and in what order a world is opened.
//
// It knows the markup of editor.html and nothing of the scene's internals — the model keeps the
// world, the preview builds it, and the validator says what is wrong with it. The three pieces it
// talks to live next to this file, so the entry point (js/editor.js) stays the few lines of a start.
import { validateScene } from '../scene/validation.js';
import { state } from '../core/index.js';
import { t } from '../i18n.js';
import { setWorld, currentWorld, parseWorld, exportWorld, slugOf, countsOf } from './model.js';
import * as preview from './preview.js';
import * as problems from './problems.js';

// The gate is the world the exhibition starts in (D24), so it is the one the editor opens with.
const START_WORLD = 'gate';
// The fixture of D9 is not a room anybody reaches — it is the world of two dimensions the tests use.
// It is in the list on purpose: it is the cheapest scene to try an edit on.
const FIXTURE_WORLD = 'example';
const WORLD_NAME = /^[a-z0-9-]+$/;

const byId = (id) => document.getElementById(id);

function setStatus(text, kind) {
  const status = byId('estado');
  if (!status) return;
  status.textContent = text || '';
  status.className = kind || '';
}

async function fetchWorld(slug) {
  const file = 'data/worlds/' + slug + '.json';
  const response = await fetch(file);
  if (!response.ok) throw new Error('HTTP ' + response.status);
  return response.json();
}

// The worlds the editor offers. There is no manifest (D14, M5) and a page cannot list a folder, so
// the list is **derived**: the gate plus every world its doors open — which is what a room is — plus
// the fixture. Typing any other slug still works, and is the way to open a world before its door
// exists.
async function fillWorldList() {
  const list = byId('mundos');
  if (!list) return;
  const slugs = new Set([START_WORLD, FIXTURE_WORLD]);
  try {
    const gate = await fetchWorld(START_WORLD);
    for (const portal of gate.portals || []) {
      const action = portal.action || {};
      if (action.kind === 'navigate' && typeof action.target === 'string') slugs.add(action.target);
    }
  } catch (error) {
    // The gate could not be read: the list keeps what it has, and a world can still be opened by slug.
    console.warn('[editor] the list of worlds could not be derived from the gate:', error.message);
  }
  for (const slug of slugs) {
    const option = document.createElement('option');
    option.value = slug;
    list.appendChild(option);
  }
}

function validate() {
  const world = currentWorld();
  if (!world) return null;
  const report = validateScene(world.data);
  problems.show(report);
  return report;
}

// Everything that happens when a world becomes the one being edited, whatever it came from: a file in
// the repository or a file the author dropped on the page. There is one path, so an imported world is
// treated exactly like an opened one (D2/D3).
async function adopt(data, file) {
  setWorld(data, file);
  validate();
  try {
    await preview.show(data);
  } catch (error) {
    setStatus(t('editor.error.build', { message: error.message }), 'erro');
    return;
  }
  const counts = countsOf(data);
  setStatus(t('editor.status.loaded', {
    slug: slugOf(data, file.split('/').pop().replace(/\.json$/i, '')),
    dimensions: counts.dimensions,
    artworks: counts.artworks,
    portals: counts.portals
  }));
  if (window.portalDebug) window.portalDebug.world = slugOf(data, null);
}

async function openWorld(slug) {
  if (!WORLD_NAME.test(slug)) {
    setStatus(t('editor.error.load', { file: slug, message: 'not a world name' }), 'erro');
    return;
  }
  const file = 'data/worlds/' + slug + '.json';
  try {
    await adopt(await fetchWorld(slug), file);
  } catch (error) {
    setStatus(t('editor.error.load', { file: file, message: error.message }), 'erro');
  }
}

// The export is a download, never a write: the page has no access to the repository, and the file is
// what the author puts back in data/worlds/ and commits (D2). The name of the file is the name of the
// world, so the export cannot quietly become `world.json`.
function exportCurrent() {
  const world = currentWorld();
  if (!world) return;
  const text = exportWorld(world.data);
  const name = world.file.split('/').pop() || slugOf(world.data) + '.json';
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus(t('editor.status.exported', { file: name }));
}

async function importFile(file) {
  if (!file) return;
  let data;
  try {
    data = parseWorld(await file.text());
  } catch (error) {
    setStatus(t('editor.error.parse', { message: error.message }), 'erro');
    return;
  }
  await adopt(data, file.name);
}

function bind(id, event, handler) {
  const element = byId(id);
  if (element) element.addEventListener(event, handler);
}

function requestedWorld() {
  const asked = new URLSearchParams(window.location.search).get('world');
  return asked && WORLD_NAME.test(asked) ? asked : START_WORLD;
}

export async function startEditor() {
  // The same handle the console and the instruments use in the exhibition (docs/ROADMAP.md section
  // 10), with one difference that matters: `preview: true` says the navigation is off in this page, so
  // an instrument that builds a scene here does not turn it back on (D32).
  window.portalDebug = { state: state, world: null, preview: true };

  await fillWorldList();

  const input = byId('mundo');
  if (input) input.value = requestedWorld();

  bind('abrir', 'click', () => openWorld((input ? input.value : '').trim()));
  bind('mundo', 'keydown', (event) => {
    if (event.key === 'Enter') openWorld(input.value.trim());
  });
  bind('validar', 'click', () => {
    if (validate()) setStatus(t('editor.status.valid'));
  });
  bind('exportar', 'click', exportCurrent);
  bind('importar', 'change', (event) => importFile(event.target.files && event.target.files[0]));

  await openWorld(requestedWorld());
}
