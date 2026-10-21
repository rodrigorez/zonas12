// The portal panel: the two axes of a door, the geometry that makes it one, and the four columns of
// section 7 of the roadmap.
//
// **L18 cannot be broken from here.** The actions the panel offers are asked of the same table the
// scene reads (js/modules/portal-kinds.js, `isLegalCombination`), so a window kind only ever offers the
// actions it can have. Changing the window rewrites the action to the first legal one and says so —
// instead of leaving the file with a combination the validator would refuse.
//
// **The stencil value is not data.** The core assigns one per *shown dimension* (1…255, law L5) while
// the visitor walks; what the data decides is which dimension each window shows. The note at the top of
// the panel says so, because a missing field is the kind of thing an author goes looking for.
//
// A change of the window axis **rebuilds** the world: it is the axis that decides which portrait
// dimensions exist (one per unique portrait, D26). Everything else re-creates just that door (D33).
import { t, currentLanguage } from '../../i18n.js';
import { textIn, LANGUAGES } from '../../scene/schema.js';
import {
  WINDOW_KINDS, ACTION_KINDS, isLegalCombination, validateDoor
} from '../../modules/portal-kinds.js';
import * as preview from '../preview.js';
import { heading, textField, numberField, selectField, button, note, vec3Field, debounce } from '../fields.js';

const WINDOW_LABEL = {
  'dimension-pair': 'editor.portal.window.dimension-pair',
  preview: 'editor.portal.window.preview',
  none: 'editor.portal.window.none'
};
const ACTION_LABEL = {
  'enter-window': 'editor.portal.action.enter-window',
  navigate: 'editor.portal.action.navigate',
  none: 'editor.portal.action.none'
};
const TRIGGER_LABEL = {
  plane: 'editor.portal.trigger.plane',
  box: 'editor.portal.trigger.box'
};

// What a new door is, before the author touches it: the size and the box the worlds already use.
const START = {
  position: [0, 0, -8],
  rotation: [0, 0, 0],
  width: 8,
  height: 10,
  box: [12, 16, 1],
  boxPosition: [0, 8, 0],
  boxRotation: [0, 0, 0],
  trigger: 'plane',
  color: '#ff0000',
  thickness: 0.3,
  radius: 120
};

const legalActions = (windowKind) => ACTION_KINDS.filter((kind) => isLegalCombination(windowKind, kind));

function worlds() {
  const options = [...document.querySelectorAll('#mundos option')].map((option) => option.value);
  return options.length > 0 ? options : ['gate'];
}

function dimensionsOf(data) {
  return Array.isArray(data.dimensions) ? data.dimensions : [];
}

function imageAssets(data) {
  return Object.entries(data.assets || {})
    .filter(([, asset]) => asset && asset.type === 'image')
    .map(([id]) => id);
}

function nextId(portals) {
  return (portals || []).reduce((biggest, portal) => Math.max(biggest, Number(portal.id) || 0), -1) + 1;
}

// The window a new door gets: the pair if there are two dimensions to join, otherwise a portrait if
// there is an image to show, otherwise nothing — and never a combination the table refuses.
function startWindow(data) {
  const dimensions = dimensionsOf(data);
  if (dimensions.length >= 2) {
    return { kind: 'dimension-pair', dimensionA: dimensions[0].id, dimensionB: dimensions[1].id };
  }
  const assets = imageAssets(data);
  if (assets.length > 0) return { kind: 'preview', asset: assets[0], radius: START.radius };
  return { kind: 'none' };
}

export function render(host, context) {
  const data = context.world();
  const portals = Array.isArray(data.portals) ? data.portals : [];

  // The list a door may name is the one the toolbar derives from the gate; it is created before the
  // fields that point at it, so the `list` attribute always resolves.
  const known = document.createElement('datalist');
  known.id = 'mundos-portal';
  for (const slug of worlds()) {
    const option = document.createElement('option');
    option.value = slug;
    known.appendChild(option);
  }
  host.appendChild(known);

  heading(host, 'editor.portal.title');
  note(host, t('editor.portal.stencilNote'));

  if (portals.length === 0) note(host, t('editor.portal.none'));

  for (const portal of portals) host.appendChild(card(portal, context, data));
  host.appendChild(insertForm(context, data));
}

function card(portal, context, data) {
  const box = document.createElement('details');
  box.className = 'cartao';

  const axisWindow = portal.window || { kind: 'none' };
  const axisAction = portal.action || { kind: 'none' };
  const summary = document.createElement('summary');
  summary.textContent = t('editor.portal.summary', {
    id: portal.id,
    window: t(WINDOW_LABEL[axisWindow.kind] || WINDOW_LABEL.none),
    action: t(ACTION_LABEL[axisAction.kind] || ACTION_LABEL.none)
  });
  box.appendChild(summary);

  // What the table asks of this door beyond the shape (a pair to itself, a combination that is not
  // legal): the same list the validator reports, shown where the door is being written.
  for (const problem of validateDoor(portal)) {
    note(box, problem.message + ' — ' + problem.law, 'nota bloqueio');
  }

  const applyGeometry = debounce(() => {
    preview.replacePortal(portal);
    context.change();
  });

  vec3Field(box, {
    name: 'portal.' + portal.id + '.position',
    labelKey: 'editor.portal.position',
    value: portal.position || START.position,
    step: 0.5,
    onChange: (values) => { portal.position = values; applyGeometry(); }
  });

  vec3Field(box, {
    name: 'portal.' + portal.id + '.rotation',
    labelKey: 'editor.portal.rotation',
    value: portal.rotation || START.rotation,
    step: 5,
    onChange: (values) => { portal.rotation = values; applyGeometry(); }
  });

  numberField(box, {
    name: 'portal.' + portal.id + '.width',
    labelKey: 'editor.portal.width',
    value: typeof portal.width === 'number' ? portal.width : START.width,
    min: 0.1,
    step: 0.5,
    onChange: (value) => { portal.width = value; applyGeometry(); }
  });

  numberField(box, {
    name: 'portal.' + portal.id + '.height',
    labelKey: 'editor.portal.height',
    value: typeof portal.height === 'number' ? portal.height : START.height,
    min: 0.1,
    step: 0.5,
    onChange: (value) => { portal.height = value; applyGeometry(); }
  });

  vec3Field(box, {
    name: 'portal.' + portal.id + '.box',
    labelKey: 'editor.portal.box',
    value: portal.box || START.box,
    step: 0.5,
    onChange: (values) => { portal.box = values; applyGeometry(); }
  });

  vec3Field(box, {
    name: 'portal.' + portal.id + '.boxPosition',
    labelKey: 'editor.portal.boxPosition',
    value: portal.boxPosition || START.boxPosition,
    step: 0.5,
    onChange: (values) => { portal.boxPosition = values; applyGeometry(); }
  });

  vec3Field(box, {
    name: 'portal.' + portal.id + '.boxRotation',
    labelKey: 'editor.portal.boxRotation',
    value: portal.boxRotation || START.boxRotation,
    step: 5,
    onChange: (values) => { portal.boxRotation = values; applyGeometry(); }
  });

  selectField(box, {
    name: 'portal.' + portal.id + '.trigger',
    labelKey: 'editor.portal.trigger',
    value: portal.trigger || START.trigger,
    options: ['plane', 'box'].map((kind) => ({ value: kind, label: t(TRIGGER_LABEL[kind]) })),
    onChange: (value) => { portal.trigger = value; applyGeometry(); }
  });

  const frame = portal.frame || {};
  textField(box, {
    name: 'portal.' + portal.id + '.frameColor',
    labelKey: 'editor.portal.frameColor',
    value: typeof frame.color === 'string' ? frame.color : START.color,
    onChange: (value) => {
      if (!portal.frame) portal.frame = {};
      portal.frame.color = value;
      applyGeometry();
    }
  });

  numberField(box, {
    name: 'portal.' + portal.id + '.frameThickness',
    labelKey: 'editor.portal.frameThickness',
    value: typeof frame.thickness === 'number' ? frame.thickness : START.thickness,
    min: 0.01,
    step: 0.05,
    onChange: (value) => {
      if (!portal.frame) portal.frame = {};
      portal.frame.thickness = value;
      applyGeometry();
    }
  });

  const dimensions = dimensionsOf(data);
  selectField(box, {
    name: 'portal.' + portal.id + '.ownedBy',
    labelKey: 'editor.portal.ownedBy',
    value: String(typeof portal.ownedBy === 'number' ? portal.ownedBy : -1),
    options: [{ value: '-1', label: t('editor.portal.ownedBy.any') }].concat(
      dimensions.map((dimension) => ({
        value: String(dimension.id),
        label: t('editor.artwork.dimensionOption', {
          id: dimension.id,
          name: textIn(dimension.name, currentLanguage()) || ''
        })
      }))
    ),
    onChange: (value) => { portal.ownedBy = Number(value); applyGeometry(); }
  });

  windowAxis(box, portal, context, data);
  actionAxis(box, portal, context);

  textField(box, {
    name: 'portal.' + portal.id + '.arrivalFrom',
    labelKey: 'editor.portal.arrivalFrom',
    value: portal.arrivalFrom || '',
    onChange: (value) => {
      if (value.trim() === '') delete portal.arrivalFrom;
      else portal.arrivalFrom = value.trim();
      // It is read when the visitor arrives, not when the door is drawn: no entity to re-create.
      context.change();
    }
  });

  button(box, {
    labelKey: 'editor.portal.delete',
    name: 'portal.' + portal.id + '.delete',
    onClick: async () => {
      const index = data.portals.indexOf(portal);
      if (index >= 0) data.portals.splice(index, 1);
      await context.change({ rebuild: true });
      context.rerender();
    }
  });

  return box;
}

// The first axis. Any change here rebuilds the world: it is the axis that decides which portrait
// dimensions exist (D26), and a portrait is a dimension like any other.
function windowAxis(box, portal, context, data) {
  if (!portal.window) portal.window = { kind: 'none' };
  const axis = portal.window;
  const dimensions = dimensionsOf(data);

  selectField(box, {
    name: 'portal.' + portal.id + '.window.kind',
    labelKey: 'editor.portal.window',
    value: axis.kind,
    options: WINDOW_KINDS.map((kind) => ({ value: kind, label: t(WINDOW_LABEL[kind]) })),
    onChange: async (kind) => {
      if (kind === axis.kind) return;
      let fellBack = false;
      if (kind === 'dimension-pair') {
        const ids = dimensions.map((dimension) => dimension.id);
        // The pair has to join two **different** dimensions (the table says so); with fewer than two
        // the panel says it instead of writing a door that shows the dimension the visitor is in.
        if (ids.length < 2) {
          portal.window = { kind: 'none' };
          fellBack = true;
        } else {
          portal.window = { kind: kind, dimensionA: ids[0], dimensionB: ids[1] };
        }
      } else if (kind === 'preview') {
        const assets = imageAssets(data);
        portal.window = assets.length > 0
          ? { kind: kind, asset: assets[0], radius: START.radius }
          : { kind: 'none' };
        fellBack = assets.length === 0;
      } else {
        portal.window = { kind: 'none' };
      }

      const windowNow = portal.window.kind;
      const rewritten = enforceLegalAction(portal);
      const adjustment = rewritten
        ? t('editor.portal.actionAdjusted', { action: t(ACTION_LABEL[portal.action.kind]) })
        : null;
      await context.change({ rebuild: true });
      context.rerender();
      // After the change, not before: the counts line is rewritten by `change()`, and a note written
      // first would be lost under it.
      if (fellBack) context.message(t('editor.portal.windowFellBack', { window: t(WINDOW_LABEL[windowNow]) }));
      else if (adjustment) context.message(adjustment);
    }
  });

  if (axis.kind === 'dimension-pair') {
    for (const key of ['dimensionA', 'dimensionB']) {
      selectField(box, {
        name: 'portal.' + portal.id + '.window.' + key,
        labelKey: key === 'dimensionA' ? 'editor.portal.pairA' : 'editor.portal.pairB',
        value: String(axis[key]),
        options: dimensions.map((dimension) => ({
          value: String(dimension.id),
          label: t('editor.artwork.dimensionOption', {
            id: dimension.id,
            name: textIn(dimension.name, currentLanguage()) || ''
          })
        })),
        onChange: async (value) => {
          axis[key] = Number(value);
          enforceLegalAction(portal);
          await context.change({ rebuild: true });
          context.rerender();
        }
      });
    }
  }

  if (axis.kind === 'preview') {
    selectField(box, {
      name: 'portal.' + portal.id + '.window.asset',
      labelKey: 'editor.portal.previewAsset',
      value: axis.asset || '',
      options: [{ value: '', label: t('editor.field.none') }].concat(
        imageAssets(data).concat(axis.asset ? [axis.asset] : [])
          .filter((id, at, all) => all.indexOf(id) === at)
          .map((id) => ({ value: id, label: id }))
      ),
      onChange: async (value) => {
        if (value) axis.asset = value;
        else delete axis.asset;
        await context.change({ rebuild: true });
        context.rerender();
      }
    });

    numberField(box, {
      name: 'portal.' + portal.id + '.window.radius',
      labelKey: 'editor.portal.previewRadius',
      value: typeof axis.radius === 'number' ? axis.radius : START.radius,
      min: 1,
      step: 1,
      onChange: debounce(async (value) => {
        axis.radius = value;
        await context.change({ rebuild: true });
      }, 400)
    });
  }
}

// The second axis. The options are the ones the table allows for this window (L18), so there is no
// way to pick an illegal pair from the panel.
function actionAxis(box, portal, context) {
  if (!portal.action) portal.action = { kind: 'none' };
  const windowKind = (portal.window || {}).kind || 'none';

  selectField(box, {
    name: 'portal.' + portal.id + '.action.kind',
    labelKey: 'editor.portal.action',
    value: portal.action.kind,
    options: legalActions(windowKind).map((kind) => ({ value: kind, label: t(ACTION_LABEL[kind]) })),
    onChange: (kind) => {
      portal.action = { kind: kind };
      if (kind === 'navigate' && !portal.action.target) portal.action.target = worlds()[0];
      preview.replacePortal(portal);
      context.change();
      context.rerender();
    }
  });

  if (portal.action.kind === 'navigate') {
    textField(box, {
      name: 'portal.' + portal.id + '.action.target',
      labelKey: 'editor.portal.target',
      value: portal.action.target || '',
      datalist: 'mundos-portal',
      onChange: (value) => {
        portal.action.target = value.trim();
        preview.replacePortal(portal);
        context.change();
      }
    });
  }
}

// Changing the window may leave the action illegal. The door is rewritten to the first legal one and
// the panel says which — the alternative is a file the validator refuses a second later.
function enforceLegalAction(portal) {
  const windowKind = (portal.window || {}).kind || 'none';
  const action = portal.action || {};
  if (action.kind && isLegalCombination(windowKind, action.kind)) return false;
  const allowed = legalActions(windowKind);
  portal.action = { kind: allowed[0] };
  if (portal.action.kind === 'navigate') portal.action.target = worlds()[0];
  return true;
}

function insertForm(context, data) {
  const box = document.createElement('details');
  box.className = 'cartao inserir';
  const summary = document.createElement('summary');
  summary.textContent = t('editor.portal.add');
  box.appendChild(summary);

  const dimensions = dimensionsOf(data);
  const draft = {
    id: nextId(data.portals),
    position: START.position.slice(),
    rotation: START.rotation.slice(),
    width: START.width,
    height: START.height,
    box: START.box.slice(),
    ownedBy: dimensions.length > 0 ? dimensions[0].id : -1,
    window: startWindow(data),
    action: { kind: legalActions(startWindow(data).kind)[0] },
    arrivalFrom: ''
  };
  if (draft.action.kind === 'navigate') draft.action.target = worlds()[0];

  // The fields are painted from the draft, so changing the window (which changes which fields make
  // sense, and which actions are legal) repaints the axes without throwing away what was typed.
  const body = document.createElement('div');
  box.appendChild(body);

  const paint = () => {
    body.replaceChildren();

    numberField(body, {
      name: 'portal.new.id',
      labelKey: 'editor.dimension.id',
      value: draft.id,
      min: 0,
      step: 1,
      onChange: (value) => { draft.id = value; }
    });

    vec3Field(body, {
      name: 'portal.new.position',
      labelKey: 'editor.portal.position',
      value: draft.position,
      step: 0.5,
      onChange: (values) => { draft.position = values; }
    });

    numberField(body, {
      name: 'portal.new.width',
      labelKey: 'editor.portal.width',
      value: draft.width,
      min: 0.1,
      step: 0.5,
      onChange: (value) => { draft.width = value; }
    });

    numberField(body, {
      name: 'portal.new.height',
      labelKey: 'editor.portal.height',
      value: draft.height,
      min: 0.1,
      step: 0.5,
      onChange: (value) => { draft.height = value; }
    });

    vec3Field(body, {
      name: 'portal.new.box',
      labelKey: 'editor.portal.box',
      value: draft.box,
      step: 0.5,
      onChange: (values) => { draft.box = values; }
    });

    selectField(body, {
      name: 'portal.new.ownedBy',
      labelKey: 'editor.portal.ownedBy',
      value: String(draft.ownedBy),
      options: [{ value: '-1', label: t('editor.portal.ownedBy.any') }].concat(
        dimensions.map((dimension) => ({
          value: String(dimension.id),
          label: t('editor.artwork.dimensionOption', {
            id: dimension.id,
            name: textIn(dimension.name, currentLanguage()) || ''
          })
        }))
      ),
      onChange: (value) => { draft.ownedBy = Number(value); }
    });

    // First axis, exactly as the card has it: the window kind decides which fields exist.
    selectField(body, {
      name: 'portal.new.window.kind',
      labelKey: 'editor.portal.window',
      value: draft.window.kind,
      options: WINDOW_KINDS.map((kind) => ({ value: kind, label: t(WINDOW_LABEL[kind]) })),
      onChange: (kind) => {
        draft.window = windowOf(kind, data);
        if (!isLegalCombination(draft.window.kind, draft.action.kind)) {
          draft.action = { kind: legalActions(draft.window.kind)[0] };
          if (draft.action.kind === 'navigate') draft.action.target = worlds()[0];
        }
        paint();
      }
    });

    if (draft.window.kind === 'dimension-pair') {
      for (const key of ['dimensionA', 'dimensionB']) {
        selectField(body, {
          name: 'portal.new.window.' + key,
          labelKey: key === 'dimensionA' ? 'editor.portal.pairA' : 'editor.portal.pairB',
          value: String(draft.window[key]),
          options: dimensions.map((dimension) => ({
            value: String(dimension.id),
            label: t('editor.artwork.dimensionOption', {
              id: dimension.id,
              name: textIn(dimension.name, currentLanguage()) || ''
            })
          })),
          onChange: (value) => { draft.window[key] = Number(value); }
        });
      }
    }

    if (draft.window.kind === 'preview') {
      selectField(body, {
        name: 'portal.new.window.asset',
        labelKey: 'editor.portal.previewAsset',
        value: draft.window.asset || '',
        options: [{ value: '', label: t('editor.field.none') }].concat(
          imageAssets(data).map((id) => ({ value: id, label: id }))
        ),
        onChange: (value) => { draft.window.asset = value; }
      });

      numberField(body, {
        name: 'portal.new.window.radius',
        labelKey: 'editor.portal.previewRadius',
        value: draft.window.radius,
        min: 1,
        step: 1,
        onChange: (value) => { draft.window.radius = value; }
      });
    }

    // Second axis: only the actions this window allows (L18).
    selectField(body, {
      name: 'portal.new.action.kind',
      labelKey: 'editor.portal.action',
      value: draft.action.kind,
      options: legalActions(draft.window.kind).map((kind) => ({ value: kind, label: t(ACTION_LABEL[kind]) })),
      onChange: (kind) => {
        draft.action = { kind: kind };
        if (kind === 'navigate') draft.action.target = worlds()[0];
        paint();
      }
    });

    if (draft.action.kind === 'navigate') {
      textField(body, {
        name: 'portal.new.action.target',
        labelKey: 'editor.portal.target',
        value: draft.action.target || '',
        datalist: 'mundos-portal',
        onChange: (value) => { draft.action.target = value.trim(); }
      });
    }

    textField(body, {
      name: 'portal.new.arrivalFrom',
      labelKey: 'editor.portal.arrivalFrom',
      value: draft.arrivalFrom,
      datalist: 'mundos-portal',
      onChange: (value) => { draft.arrivalFrom = value.trim(); }
    });

    const problem = note(body, '', 'nota erro');

    button(body, {
      labelKey: 'editor.portal.create',
      name: 'portal.new.create',
      onClick: async () => {
        if (!Number.isInteger(draft.id) || draft.id < 0) {
          problem.textContent = t('editor.portal.idInvalid');
          return;
        }
        if ((data.portals || []).some((portal) => portal.id === draft.id)) {
          problem.textContent = t('editor.dimension.idTaken', { id: draft.id });
          return;
        }
        if (draft.window.kind === 'dimension-pair' && draft.window.dimensionA === draft.window.dimensionB) {
          problem.textContent = t('editor.portal.pairNeedsTwo');
          return;
        }
        if (draft.action.kind === 'navigate' && !draft.action.target) {
          problem.textContent = t('editor.portal.targetNeeded');
          return;
        }
        problem.textContent = '';

        const portal = {
          id: draft.id,
          ownedBy: draft.ownedBy,
          position: draft.position.slice(),
          width: draft.width,
          height: draft.height,
          box: draft.box.slice(),
          boxPosition: START.boxPosition.slice(),
          boxRotation: START.boxRotation.slice(),
          trigger: START.trigger,
          frame: { color: START.color, thickness: START.thickness },
          window: windowOf(draft.window.kind, data, draft.window),
          action: { kind: draft.action.kind }
        };
        if (draft.action.kind === 'navigate') portal.action.target = draft.action.target;
        if (draft.arrivalFrom) portal.arrivalFrom = draft.arrivalFrom;

        if (!Array.isArray(data.portals)) data.portals = [];
        data.portals.push(portal);
        await context.change({ rebuild: true });
        context.rerender();
      }
    });
  };

  paint();
  return box;
}

// A window of one kind, with the fields that kind needs — the only place that decides "what a preview
// needs", so the insert form and the card cannot drift.
function windowOf(kind, data, from) {
  const dimensions = dimensionsOf(data);
  if (kind === 'dimension-pair') {
    const ids = dimensions.map((dimension) => dimension.id);
    const source = from && from.kind === 'dimension-pair' ? from : null;
    return {
      kind: kind,
      dimensionA: source ? source.dimensionA : (ids[0] !== undefined ? ids[0] : 0),
      dimensionB: source ? source.dimensionB : (ids[1] !== undefined ? ids[1] : 0)
    };
  }
  if (kind === 'preview') {
    const assets = imageAssets(data);
    const source = from && from.kind === 'preview' ? from : null;
    return {
      kind: kind,
      asset: source ? source.asset : (assets.length > 0 ? assets[0] : ''),
      radius: source ? source.radius : START.radius
    };
  }
  return { kind: 'none' };
}