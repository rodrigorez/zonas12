// The editor's composition: what the toolbar does and in what order a world is opened.
//
// It knows the markup of editor.html and nothing of the scene's internals — the model keeps the
// world, the preview builds it, and the validator says what is wrong with it. The three pieces it
// talks to live next to this file, so the entry point (js/editor.js) stays the few lines of a start.
import { validateScene } from '../scene/validation.js';
import { state, setActiveDimension } from '../core/index.js';
import { t } from '../i18n.js';
import {
  setWorld,
  currentWorld,
  parseWorld,
  exportWorld,
  slugOf,
  countsOf,
  remember,
  canUndo,
  undo,
  isDirty,
  markSaved
} from './model.js';
import * as assets from './assets.js';
import * as preview from './preview.js';
import * as problems from './problems.js';
import * as panels from './panels/index.js';
import * as server from './server.js';
import * as worlds from './worlds.js';

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

// The worlds the editor offers. There is no manifest (D14, M5) and a page cannot list a folder, so the
// list is **derived** by js/editor/worlds.js: the gate plus every world its doors open — which is what
// a room is — plus the fixture. Typing any other slug still works, and is the way to open a world
// before its door exists.
async function fillWorldList() {
  const list = byId('mundos');
  if (!list) return;
  let slugs = [];
  try {
    slugs = await worlds.refresh();
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
  // `worldExists` is the answer the command line gives (L11) and the page can give too, because the
  // editor reads the files: without it the law is reported as "not verified" and a door to nowhere
  // looks fine. A slug that has not been looked for yet answers `undefined`, never a false accusation.
  // `exists` and `imageSize` are the same story for the files of a world (L9, L14): js/editor/assets.js
  // asks once and answers from what it found, so the two laws stop being "not verified" in the editor.
  const report = validateScene(world.data, {
    worldExists: (slug) => worlds.exists(slug),
    exists: assets.exists,
    imageSize: assets.imageSize
  });
  problems.show(report);
  return report;
}

// Before validating, make sure every question the validator will ask has an answer: the worlds this
// one points at (L11) and the files it names (L9, L14). `refresh` asks again the files that came back
// missing, which is what the "Validar" button is for — the author has just put them there.
async function revalidate(options) {
  const world = currentWorld();
  if (!world) return;
  const targets = ((world.data.portals) || [])
    .map((portal) => (portal.action || {}).target)
    .filter((target) => typeof target === 'string' && WORLD_NAME.test(target));
  await Promise.all([
    worlds.ensure(targets),
    assets.probe(world.data, { refresh: Boolean(options && options.refresh) })
  ]);
  return validate();
}

function refreshStatus() {
  const world = currentWorld();
  if (!world) return;
  const counts = countsOf(world.data);
  setStatus(t('editor.status.loaded', {
    slug: slugOf(world.data, world.file.split('/').pop().replace(/\.json$/i, '')),
    dimensions: counts.dimensions,
    artworks: counts.artworks,
    portals: counts.portals
  }));
}

// The two marks of the toolbar: «Desfazer» is only offered when there is a step to undo, and
// «alterado» says whether the world in memory is a text the author already has (D32/D35).
//
// «Gravar» (Fase 5) has three conditions and all are about what it can honestly do: there has to be
// a server answering (D49), the world has to have come from `data/worlds/` (D50) — saving
// **replaces** a file, and a world opened from a dropped file has nowhere to be replaced — and there
// has to be something to save. Without the last one, clicking it twice writes the same text twice
// and leaves a second backup for nothing; it is the same rule as «Desfazer», which is only offered
// when there is a step to undo (D35).
function saveableSlug() {
  const world = currentWorld();
  if (!world || !world.file || !world.file.startsWith('data/worlds/')) return null;
  return world.file.split('/').pop().replace(/\.json$/i, '');
}

function updateToolbar() {
  const button = byId('desfazer');
  if (button) button.disabled = !canUndo();
  const marker = byId('alterado');
  if (marker) marker.hidden = !isDirty();
  const save = byId('gravar');
  if (save) save.disabled = !server.canSave() || saveableSlug() === null || !isDirty();
}

// One step back: the world is replaced by the snapshot and everything that was built from it is built
// again. Undoing is a structural change by definition — the snapshot may have other dimensions, other
// works — so the scene is rebuilt instead of re-created entity by entity (D33).
async function undoLast() {
  if (!currentWorld()) return;
  if (!undo()) {
    setStatus(t('editor.undo.empty'));
    return;
  }
  const world = currentWorld();
  try {
    await preview.show(world.data);
  } catch (error) {
    setStatus(t('editor.error.build', { message: error.message }), 'erro');
    return;
  }
  ensureActiveDimension(world.data);
  await revalidate();
  panels.renderAll(panelContext());
  refreshStatus();
  updateToolbar();
  setStatus(t('editor.undo.done'));
}

// Where the visitor stands is a dimension id, and a world may stop having it after a deletion. The
// exhibition always starts at 0 and never faces this; the editor does, and a preview pointing at a
// dimension that no longer exists is a black screen with no explanation.
function ensureActiveDimension(data) {
  const ids = (data.dimensions || []).map((dimension) => dimension.id);
  if (ids.length > 0 && ids.indexOf(state.activeDimension) === -1) setActiveDimension(ids[0]);
}

// The contract a panel works against: the data, a way to say what changed, and a way to repaint. A
// geometry change re-creates the entity itself (D33) and only needs the validator to look again; a
// change of structure rebuilds the scene, because the ids in the rest of the file stop matching.
function panelContext() {
  return {
    world: () => currentWorld() && currentWorld().data,
    async change(options) {
      const world = currentWorld();
      if (!world) return;
      // The snapshot of what the author was looking at before this change (D35). It goes in before
      // anything else, so a change that fails to build is still a change that can be undone.
      remember();
      updateToolbar();
      if (options && options.rebuild) {
        try {
          await preview.show(world.data);
        } catch (error) {
          setStatus(t('editor.error.build', { message: error.message }), 'erro');
          return;
        }
        ensureActiveDimension(world.data);
      }
      await revalidate();
      // The line at the top counts what the file has, so it has to follow an insert or a deletion;
      // leaving it saying "dimensões: 1" next to two cards is the kind of quiet lie this project
      // spends its measurements avoiding.
      refreshStatus();
    },
    // A panel may need to say something that is not a count (a door whose action had to change to stay
    // legal, for instance). It goes to the same line, which is where the author is already looking.
    message: (text) => setStatus(text),
    // The name of the file the world was read from — the panel compares it with the slug (D28).
    file: () => (currentWorld() ? currentWorld().file : ''),
    rerender: () => panels.renderAll(panelContext())
  };
}

// Everything that happens when a world becomes the one being edited, whatever it came from: a file in
// the repository or a file the author dropped on the page. There is one path, so an imported world is
// treated exactly like an opened one (D2/D3).
async function adopt(data, file) {
  setWorld(data, file);
  try {
    await preview.show(data);
  } catch (error) {
    setStatus(t('editor.error.build', { message: error.message }), 'erro');
    return;
  }
  ensureActiveDimension(data);
  await revalidate();
  panels.renderAll(panelContext());
  refreshStatus();
  updateToolbar();
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
//
// "Validar tudo antes de exportar" (B9): what leaves here is what gets committed, so a world with
// errors is not offered as a download — the counts and the list are on the screen next to the refusal.
// Warnings do not stop it: they are the things the validator knows and the author may have decided to
// live with (D30). The files are asked again first, because the author has just put them in place.
async function exportCurrent() {
  const world = currentWorld();
  if (!world) return;
  const report = await revalidate({ refresh: true });
  if (report && report.errors.length > 0) {
    setStatus(t('editor.error.exportBlocked', { count: report.errors.length }), 'erro');
    return;
  }
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
  // The author now has the file: the guard of D32 has nothing to warn about until the next edit.
  markSaved();
  updateToolbar();
  setStatus(t('editor.status.exported', { file: name }));
}

// Gravar é o irmão do exportar (Fase 5, D48/D49): sai o **mesmo** texto — o `exportWorld` — e o que
// decide é o mesmo juízo, porque um mundo com erros não sai por nenhum dos dois caminhos. O servidor
// repete a validação do lado dele (D50) e deixa uma cópia antes de gravar (D51); o caminho da cópia
// vai para a linha de estado, que é onde o autor a vai procurar se precisar de voltar atrás.
async function saveCurrent() {
  const world = currentWorld();
  if (!world) return;
  const slug = saveableSlug();
  if (slug === null) {
    setStatus(t('editor.error.saveNotFromDisk'), 'erro');
    return;
  }
  const report = await revalidate({ refresh: true });
  if (report && report.errors.length > 0) {
    setStatus(t('editor.error.saveBlocked', { count: report.errors.length }), 'erro');
    return;
  }
  try {
    const answer = await server.save(slug, exportWorld(world.data));
    // The world is now the file the exhibition reads: the guard of D32 has nothing to warn about
    // until the next edit, exactly as after an export.
    markSaved();
    updateToolbar();
    setStatus(t('editor.status.saved', { file: answer.file, backup: answer.backup }));
  } catch (error) {
    setStatus(t('editor.error.saveFailed', { file: world.file, message: error.message }), 'erro');
  }
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

  // A pergunta da D49, antes de a barra mostrar o que quer que seja: uma página servida por um host
  // estático recebe **404** e o «Gravar» nunca aparece — o «Exportar» que sempre existiu fica igual.
  await Promise.all([server.probe(), fillWorldList()]);
  const gravar = byId('gravar');
  if (gravar) gravar.hidden = !server.canSave();

  const input = byId('mundo');
  if (input) input.value = requestedWorld();

  bind('abrir', 'click', () => openWorld((input ? input.value : '').trim()));
  bind('mundo', 'keydown', (event) => {
    if (event.key === 'Enter') openWorld(input.value.trim());
  });
  bind('validar', 'click', async () => {
    await revalidate({ refresh: true });
    setStatus(t('editor.status.valid'));
  });
  bind('desfazer', 'click', undoLast);
  bind('gravar', 'click', saveCurrent);
  bind('exportar', 'click', exportCurrent);
  bind('importar', 'change', (event) => importFile(event.target.files && event.target.files[0]));

  // The keyboard's undo belongs to the text being typed while a field has the focus; the world's undo
  // is what applies when the author is looking at the scene.
  window.addEventListener('keydown', (event) => {
    const key = (event.key || '').toLowerCase();
    if (key !== 'z' || !(event.ctrlKey || event.metaKey) || event.shiftKey || event.altKey) return;
    const active = document.activeElement;
    if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) return;
    event.preventDefault();
    undoLast();
  });

  // The guard of D32: a page that is closed with changes that were never exported loses them, and the
  // editor cannot write to the repository to have saved them (D2). The warning is all it can give.
  window.addEventListener('beforeunload', (event) => {
    if (!isDirty()) return;
    event.preventDefault();
    event.returnValue = '';
  });

  await openWorld(requestedWorld());
}
