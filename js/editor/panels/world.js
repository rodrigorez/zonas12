// The world panel: what a world *is* (its slug and its name) and what it *opens* (the doors to other
// worlds), plus the part of section 7 that only exists at this level — the map of the house.
//
// The folder and the arranque of a new room are not here on purpose (D2/D31): the editor never writes to
// disk, so the panel shows the command that does it and the editor exports the JSON. What the panel does
// create is the **link**: a door in this world that names the new room, with its portrait and radius.
//
// The map is the one place the editor reads a world it is not editing — and it never builds it (L13).
// It answers two questions the exhibition cannot ask: does the file of the destination exist (L11) and
// does the destination say where the visitor comes from (L19). Which rooms exist but nobody reaches is
// **not** answerable here: it needs the folder listing, and that is the command line's job (§7).
import { t, currentLanguage } from '../../i18n.js';
import { LANGUAGES, textIn } from '../../scene/schema.js';
import { missingArrivals } from '../../scene/validation.js';
import * as preview from '../preview.js';
import * as worlds from '../worlds.js';
import { heading, textField, selectField, numberField, button, note, debounce } from '../fields.js';

const NAME = /^[a-z0-9-]+$/;
const START = { radius: 120 };

function imageAssets(data) {
  return Object.entries(data.assets || {})
    .filter(([, asset]) => asset && asset.type === 'image')
    .map(([id]) => id);
}

function worldDoors(data) {
  return (data.portals || []).filter((portal) => (portal.action || {}).kind === 'navigate');
}

// The scenes the map is built from: every world file the editor has read, with **this** world replaced
// by what is in memory — otherwise the graph would describe the file on disk and not what is being
// edited.
function scenesWith(data) {
  const slug = data.world && data.world.slug;
  const others = worlds.graphScenes().filter((scene) => !scene.world || scene.world.slug !== slug);
  return others.concat([data]);
}

export function render(host, context) {
  const data = context.world();
  const language = currentLanguage();

  heading(host, 'editor.world.panelTitle');

  textField(host, {
    name: 'world.slug',
    labelKey: 'editor.world.slug',
    value: (data.world && data.world.slug) || '',
    onChange: (value) => {
      if (!data.world) data.world = {};
      data.world.slug = value.trim();
      context.change();
    }
  });

  for (const code of LANGUAGES) {
    textField(host, {
      name: 'world.name.' + code,
      label: t('editor.world.nameIn', { language: code }),
      value: (data.world && data.world.name ? data.world.name[code] : '') || '',
      onChange: (value) => {
        if (!data.world) data.world = {};
        if (!data.world.name) data.world.name = {};
        if (value.trim() === '') delete data.world.name[code];
        else data.world.name[code] = value;
        if (Object.keys(data.world.name).length === 0) delete data.world.name;
        context.change();
      }
    });
  }

  // D28: the folder is the slug. A file opened as `scene2.json` that says it is `beach` is a mistake the
  // command line reports; the panel says it where the two can be seen together.
  const openedAs = ((context.file() || '').split('/').pop() || '').replace(/\.json$/i, '');
  const declared = data.world && data.world.slug;
  if (openedAs && declared && openedAs !== declared) {
    note(host, t('editor.world.slugMismatch', { file: openedAs, slug: declared }), 'nota bloqueio');
  }

  doors(host, context, data, language);
  graph(host, context, data);
  newRoom(host, context, data);
}

function doors(host, context, data, language) {
  const list = worldDoors(data);
  heading(host, 'editor.world.doors');

  if (list.length === 0) {
    note(host, t('editor.world.noDoors'));
    return;
  }

  for (const portal of list) {
    const box = document.createElement('details');
    box.className = 'cartao';
    const summary = document.createElement('summary');
    summary.textContent = t('editor.world.door', { target: portal.action.target || '—' });
    box.appendChild(summary);

    // What the origin can know about the destination — this is the L11 answer, and it is the only thing
    // the panel reads from another world's file.
    const exists = worlds.exists(portal.action.target);
    if (exists === false) {
      note(box, t('editor.world.missingWorld', { target: portal.action.target }), 'nota erro');
    } else if (exists === true) {
      note(box, t('editor.world.exists'), 'nota bom');
      const arrivalInDestination = (worlds.sceneOf(portal.action.target) || { portals: [] }).portals
        .some((other) => other.arrivalFrom === (data.world && data.world.slug));
      note(box, arrivalInDestination ? t('editor.world.arrival') : t('editor.world.noArrival'),
        arrivalInDestination ? 'nota bom' : 'nota bloqueio');
    }

    textField(box, {
      name: 'world.door.' + portal.id + '.target',
      labelKey: 'editor.portal.target',
      value: portal.action.target || '',
      datalist: 'mundos-portal',
      // Debounced: every keystroke would otherwise rebuild this panel and take the focus with it.
      onChange: debounce(async (value) => {
        portal.action.target = value.trim();
        // The door's entity carries its target: re-create that one door, not the world.
        preview.replacePortal(portal);
        await context.change();
        context.rerender();
      }, 400)
    });

    const windowAxis = portal.window || {};
    selectField(box, {
      name: 'world.door.' + portal.id + '.asset',
      labelKey: 'editor.portal.previewAsset',
      value: windowAxis.asset || '',
      options: [{ value: '', label: t('editor.field.none') }].concat(
        imageAssets(data).concat(windowAxis.asset ? [windowAxis.asset] : [])
          .filter((id, at, all) => all.indexOf(id) === at)
          .map((id) => ({ value: id, label: id }))
      ),
      onChange: async (value) => {
        // The window axis decides which portrait dimensions exist (D26): this one rebuilds.
        portal.window = {
          kind: 'preview',
          asset: value,
          radius: typeof windowAxis.radius === 'number' ? windowAxis.radius : START.radius
        };
        await context.change({ rebuild: true });
        context.rerender();
      }
    });

    numberField(box, {
      name: 'world.door.' + portal.id + '.radius',
      labelKey: 'editor.portal.previewRadius',
      value: typeof windowAxis.radius === 'number' ? windowAxis.radius : START.radius,
      min: 1,
      step: 1,
      onChange: async (value) => {
        if (!portal.window) portal.window = { kind: 'preview', asset: '', radius: value };
        portal.window.radius = value;
        await context.change({ rebuild: true });
      }
    });

    note(box, t('editor.world.doorHint', { name: worlds.nameOf(portal.action.target, language) || portal.action.target }));
    host.appendChild(box);
  }
}

// The map: every door of every world read, and the two questions a page can answer about them.
function graph(host, context, data) {
  heading(host, 'editor.world.graph');

  const scenes = scenesWith(data);
  const gaps = missingArrivals(scenes);
  if (gaps.length === 0) {
    note(host, t('editor.world.noGaps'), 'nota bom');
  } else {
    for (const gap of gaps) {
      // The command line calls this a warning and not an error: the visitor does arrive — just not
      // where somebody chose. The panel says it in the same tone.
      note(host, t('editor.world.gapLine', { from: gap.from, to: gap.to }), 'nota bloqueio');
    }
  }
  note(host, t('editor.world.unreachableNote'));
}

function newRoom(host, context, data) {
  heading(host, 'editor.world.newRoom');
  note(host, t('editor.world.newRoomHint'));

  const box = document.createElement('details');
  box.className = 'cartao inserir';
  const summary = document.createElement('summary');
  summary.textContent = t('editor.world.newRoom');
  box.appendChild(summary);

  const slug = textField(box, {
    name: 'world.new.slug',
    labelKey: 'editor.world.slug',
    value: '',
    onChange: () => {}
  });

  for (const code of LANGUAGES) {
    textField(box, {
      name: 'world.new.name.' + code,
      label: t('editor.world.nameIn', { language: code }),
      value: '',
      onChange: () => {}
    });
  }

  selectField(box, {
    name: 'world.new.asset',
    labelKey: 'editor.portal.previewAsset',
    value: '',
    options: [{ value: '', label: t('editor.field.none') }].concat(
      imageAssets(data).map((id) => ({ value: id, label: id }))
    ),
    onChange: () => {}
  });

  numberField(box, {
    name: 'world.new.radius',
    labelKey: 'editor.portal.previewRadius',
    value: START.radius,
    min: 1,
    step: 1,
    onChange: () => {}
  });

  const command = document.createElement('p');
  command.className = 'nota comando';
  box.appendChild(command);
  const paintCommand = () => {
    const value = slug.input.value.trim() || '<slug>';
    command.textContent = 'node tools/scene/new-world.mjs ' + value;
  };
  slug.input.addEventListener('input', paintCommand);
  paintCommand();

  const problem = note(box, '', 'nota erro');

  button(box, {
    labelKey: 'editor.world.link',
    name: 'world.new.link',
    onClick: async () => {
      const value = (name) => box.querySelector('[name="' + name + '"]');
      const target = slug.input.value.trim();
      if (!NAME.test(target)) {
        problem.textContent = t('editor.world.slugInvalid');
        return;
      }
      if (worldDoors(data).some((portal) => portal.action.target === target)) {
        problem.textContent = t('editor.world.slugTaken', { slug: target });
        return;
      }
      problem.textContent = '';

      const asset = value('world.new.asset').value;
      const radius = Number(value('world.new.radius').value);
      const portal = {
        id: (data.portals || []).reduce((biggest, other) => Math.max(biggest, Number(other.id) || 0), -1) + 1,
        ownedBy: Array.isArray(data.dimensions) && data.dimensions.length > 0 ? data.dimensions[0].id : -1,
        position: [0, 0, -8],
        width: 8,
        height: 10,
        box: [12, 16, 1],
        boxPosition: [0, 8, 0],
        boxRotation: [0, 0, 0],
        trigger: 'plane',
        frame: { color: '#ff0000', thickness: 0.3 },
        window: asset
          ? { kind: 'preview', asset: asset, radius: Number.isFinite(radius) && radius > 0 ? radius : START.radius }
          : { kind: 'none' },
        action: { kind: 'navigate', target: target }
      };

      if (!Array.isArray(data.portals)) data.portals = [];
      data.portals.push(portal);
      await context.change({ rebuild: true });
      context.rerender();
      context.message(t('editor.world.linked', { slug: target }));
    }
  });

  note(box, t('editor.world.folderNote'));
  host.appendChild(box);
}
