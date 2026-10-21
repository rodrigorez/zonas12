// The artwork panel: the content of each dimension, grouped by dimension (section 7 of the roadmap).
//
// Two things it deliberately does **not** offer (D30): `kind: "model"` and `"text"` are validated and
// not built by the scene, and `interaction: "link"` validates and does not navigate — the modal shows
// the address instead. A file that already has one of them shows it, selected and disabled, with a
// note: a panel may refuse to create what does not work, but it may not pretend the file says
// something else.
//
// `kind` is not a field either: it comes from the type of the asset in the catalogue (`image` or
// `video`), which is the one place that knows what a file is — and the validator already refuses an
// artwork whose kind and asset disagree.
import { t, currentLanguage } from '../../i18n.js';
import { textIn, LANGUAGES } from '../../scene/schema.js';
import { playerCamera } from '../../modules/camera.js';
import * as preview from '../preview.js';
import { heading, textField, numberField, selectField, button, note, vec3Field, debounce } from '../fields.js';

const INTERACTIONS = ['modal', 'none'];
const INTERACTION_LABEL = {
  modal: 'editor.artwork.interaction.modal',
  none: 'editor.artwork.interaction.none',
  link: 'editor.artwork.interaction.link'
};
// What a new artwork is, before the author changes it: the size and the rotation the worlds in
// data/worlds/ already use, and a place in front of the visitor.
const START = { position: [0, 1.5, -10], rotation: [0, 0, 0], size: [4, 3, 0.1] };

const round = (value) => Math.round(value * 1000) / 1000;

function catalogueAssets(data) {
  return Object.entries(data.assets || {})
    .filter(([, asset]) => asset && (asset.type === 'image' || asset.type === 'video'))
    .map(([id, asset]) => ({ id: id, type: asset.type }));
}

function nextId(artworks) {
  return (artworks || []).reduce((biggest, artwork) => Math.max(biggest, Number(artwork.id) || 0), -1) + 1;
}

export function render(host, context) {
  const data = context.world();
  const artworks = Array.isArray(data.artworks) ? data.artworks : [];
  const dimensions = Array.isArray(data.dimensions) ? data.dimensions : [];

  heading(host, 'editor.artwork.title');

  if (artworks.length === 0) note(host, t('editor.artwork.none'));

  const language = currentLanguage();
  const groups = dimensions.map((dimension) => ({
    id: dimension.id,
    label: textIn(dimension.name, language)
      ? t('editor.artwork.group', { id: dimension.id, name: textIn(dimension.name, language), count: artworks.filter((artwork) => artwork.dimension === dimension.id).length })
      : t('editor.artwork.groupNoName', { id: dimension.id, count: artworks.filter((artwork) => artwork.dimension === dimension.id).length }),
    items: artworks.filter((artwork) => artwork.dimension === dimension.id)
  }));

  // An artwork that points at a dimension nobody declares is a broken file; the validator says so, and
  // the panel shows it rather than hiding it behind a filter.
  const orphans = artworks.filter(
    (artwork) => !dimensions.some((dimension) => dimension.id === artwork.dimension)
  );
  if (orphans.length > 0) {
    groups.push({ id: null, label: t('editor.artwork.ungrouped'), items: orphans });
  }

  for (const group of groups) {
    if (group.items.length === 0) continue;
    const box = document.createElement('details');
    box.className = 'cartao';
    const summary = document.createElement('summary');
    summary.textContent = group.label;
    box.appendChild(summary);
    for (const artwork of group.items) box.appendChild(card(artwork, context, data, dimensions));
    host.appendChild(box);
  }

  host.appendChild(insertForm(context, data, dimensions));
}

function card(artwork, context, data, dimensions) {
  const box = document.createElement('details');
  box.className = 'cartao';

  const summary = document.createElement('summary');
  summary.textContent = t('editor.artwork.summary', {
    id: artwork.id,
    asset: artwork.asset || '—',
    interaction: t(INTERACTION_LABEL[artwork.interaction] || INTERACTION_LABEL.none)
  });
  const inCatalogue = !!artwork.asset && !!data.assets && Object.prototype.hasOwnProperty.call(data.assets, artwork.asset);
  if (!inCatalogue) summary.classList.add('em-falta');
  box.appendChild(summary);

  if (!inCatalogue) {
    note(box, t('editor.artwork.missing', { asset: artwork.asset || '—' }), 'nota erro');
  }

  const apply = debounce(() => {
    preview.replaceArtwork(artwork, data.assets || {});
    context.change();
  });

  selectField(box, {
    name: 'artwork.' + artwork.id + '.asset',
    labelKey: 'editor.artwork.asset',
    value: artwork.asset || '',
    options: [{ value: '', label: t('editor.field.none') }].concat(
      catalogueAssets(data).concat(artwork.asset ? [{ id: artwork.asset, type: artwork.kind }] : [])
        .filter((entry, at, all) => all.findIndex((other) => other.id === entry.id) === at)
        .map((entry) => ({ value: entry.id, label: entry.id }))
    ),
    onChange: (value) => {
      if (value) artwork.asset = value;
      else delete artwork.asset;
      // The kind follows the file: the catalogue is what knows whether it is an image or a video.
      const chosen = value && data.assets ? data.assets[value] : null;
      if (chosen && (chosen.type === 'image' || chosen.type === 'video')) artwork.kind = chosen.type;
      apply();
    }
  });

  vec3Field(box, {
    name: 'artwork.' + artwork.id + '.position',
    labelKey: 'editor.artwork.position',
    value: artwork.position || START.position,
    step: 0.5,
    onChange: (values) => { artwork.position = values; apply(); }
  });

  vec3Field(box, {
    name: 'artwork.' + artwork.id + '.rotation',
    labelKey: 'editor.artwork.rotation',
    value: artwork.rotation || START.rotation,
    step: 5,
    onChange: (values) => { artwork.rotation = values; apply(); }
  });

  vec3Field(box, {
    name: 'artwork.' + artwork.id + '.size',
    labelKey: 'editor.artwork.size',
    value: artwork.size || START.size,
    step: 0.1,
    onChange: (values) => { artwork.size = values; apply(); }
  });

  interactionField(box, artwork, context);

  for (const language of LANGUAGES) {
    textField(box, {
      name: 'artwork.' + artwork.id + '.title.' + language,
      label: t('editor.artwork.titleIn', { language: language }),
      value: artwork.title ? artwork.title[language] : '',
      onChange: (text) => {
        if (!artwork.title) artwork.title = {};
        if (text.trim() === '') delete artwork.title[language];
        else artwork.title[language] = text;
        if (Object.keys(artwork.title).length === 0) delete artwork.title;
        context.change();
      }
    });
  }

  button(box, {
    labelKey: 'editor.artwork.delete',
    name: 'artwork.' + artwork.id + '.delete',
    onClick: async () => {
      const index = data.artworks.indexOf(artwork);
      if (index >= 0) data.artworks.splice(index, 1);
      await context.change({ rebuild: true });
      context.rerender();
    }
  });

  return box;
}

// `modal` and `none` are the two the scene builds. A file that says `link` keeps saying it — the
// option is shown, selected and disabled, so nobody reads the panel as "this artwork does nothing".
function interactionField(box, artwork, context) {
  const notBuilt = artwork.interaction === 'link';
  const options = INTERACTIONS.map((value) => ({ value: value, label: t(INTERACTION_LABEL[value]) }));
  if (notBuilt) options.push({ value: 'link', label: t(INTERACTION_LABEL.link) });

  const field = selectField(box, {
    name: 'artwork.' + artwork.id + '.interaction',
    labelKey: 'editor.artwork.interaction',
    value: artwork.interaction || 'none',
    options: options,
    onChange: (value) => {
      artwork.interaction = value;
      if (value !== 'link') delete artwork.url;
      preview.replaceArtwork(artwork, context.world().assets || {});
      context.change();
      context.rerender();
    }
  });
  if (notBuilt) field.input.disabled = true;
  if (notBuilt) note(box, t('editor.artwork.notBuilt'), 'nota bloqueio');
  return field;
}

function insertForm(context, data, dimensions) {
  const box = document.createElement('details');
  box.className = 'cartao inserir';
  const summary = document.createElement('summary');
  summary.textContent = t('editor.artwork.add');
  box.appendChild(summary);

  if (dimensions.length === 0) {
    note(box, t('editor.artwork.needsDimension'), 'nota bloqueio');
    return box;
  }

  selectField(box, {
    name: 'artwork.new.dimension',
    labelKey: 'editor.artwork.dimension',
    value: String(dimensions[0].id),
    options: dimensions.map((dimension) => ({
      value: String(dimension.id),
      label: t('editor.artwork.dimensionOption', { id: dimension.id, name: textIn(dimension.name, currentLanguage()) || '' })
    })),
    onChange: () => {}
  });

  selectField(box, {
    name: 'artwork.new.asset',
    labelKey: 'editor.artwork.asset',
    value: '',
    options: [{ value: '', label: t('editor.field.none') }].concat(
      catalogueAssets(data).map((entry) => ({ value: entry.id, label: entry.id }))
    ),
    onChange: () => {}
  });

  const position = vec3Field(box, {
    name: 'artwork.new.position',
    labelKey: 'editor.artwork.position',
    value: START.position,
    step: 0.5,
    onChange: () => {}
  });

  vec3Field(box, {
    name: 'artwork.new.rotation',
    labelKey: 'editor.artwork.rotation',
    value: START.rotation,
    step: 5,
    onChange: () => {}
  });

  vec3Field(box, {
    name: 'artwork.new.size',
    labelKey: 'editor.artwork.size',
    value: START.size,
    step: 0.1,
    onChange: () => {}
  });

  selectField(box, {
    name: 'artwork.new.interaction',
    labelKey: 'editor.artwork.interaction',
    value: 'modal',
    options: INTERACTIONS.map((value) => ({ value: value, label: t(INTERACTION_LABEL[value]) })),
    onChange: () => {}
  });

  for (const language of LANGUAGES) {
    textField(box, {
      name: 'artwork.new.title.' + language,
      label: t('editor.artwork.titleIn', { language: language }),
      value: '',
      onChange: () => {}
    });
  }

  button(box, {
    labelKey: 'editor.camera.useCurrent',
    name: 'artwork.new.useCurrent',
    onClick: () => {
      const where = playerCamera.position();
      if (!where) return;
      position.set([round(where.x), round(where.y), round(where.z)]);
      const field = box.querySelector('[name="artwork.new.position"]');
      if (field) field.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  const problem = note(box, '', 'nota erro');

  button(box, {
    labelKey: 'editor.artwork.create',
    name: 'artwork.new.create',
    onClick: async () => {
      const value = (name) => box.querySelector('[name="' + name + '"]');
      const asset = value('artwork.new.asset').value;
      if (!asset) {
        problem.textContent = t('editor.artwork.needsAsset');
        return;
      }
      problem.textContent = '';

      const catalogue = data.assets || {};
      const artwork = {
        id: nextId(data.artworks),
        dimension: Number(value('artwork.new.dimension').value),
        kind: catalogue[asset] && catalogue[asset].type === 'video' ? 'video' : 'image',
        asset: asset,
        position: ['x', 'y', 'z'].map((axis) => Number(value('artwork.new.position.' + axis).value)),
        rotation: ['x', 'y', 'z'].map((axis) => Number(value('artwork.new.rotation.' + axis).value)),
        size: ['x', 'y', 'z'].map((axis) => Number(value('artwork.new.size.' + axis).value)),
        interaction: value('artwork.new.interaction').value
      };
      const title = {};
      for (const language of LANGUAGES) {
        const text = value('artwork.new.title.' + language).value.trim();
        if (text) title[language] = text;
      }
      if (Object.keys(title).length > 0) artwork.title = title;

      if (!Array.isArray(data.artworks)) data.artworks = [];
      data.artworks.push(artwork);
      await context.change({ rebuild: true });
      context.rerender();
    }
  });

  return box;
}
