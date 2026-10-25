// The artwork panel: the content of each dimension, grouped by dimension (section 7 of the roadmap).
//
// What it offers follows what the scene builds. During the fase in which the four R9 values were only
// validated, this panel refused `kind: "model"`, `"text"` and `interaction: "link"` and showed a file
// that had one of them selected and disabled (D30). Fase 7 builds the three (B6 and B7), so all of
// them are offered — and the type is now a field of its own, because a `text` work has no asset to
// take it from and a `model` has one, from the catalogue.
import { t, currentLanguage } from '../../i18n.js';
import { textIn, LANGUAGES } from '../../scene/schema.js';
import { artworkPageHref } from '../../scene/artwork-page.js';
import { playerCamera } from '../../modules/camera.js';
import * as preview from '../preview.js';
import { heading, textField, numberField, selectField, button, note, vec3Field, debounce } from '../fields.js';

const KINDS = ['image', 'video', 'model', 'text', 'site'];
const KIND_LABEL = {
  image: 'editor.artwork.kind.image',
  video: 'editor.artwork.kind.video',
  model: 'editor.artwork.kind.model',
  text: 'editor.artwork.kind.text',
  site: 'editor.artwork.kind.site'
};

const INTERACTIONS = ['page', 'modal', 'link', 'none'];
const INTERACTION_LABEL = {
  page: 'editor.artwork.interaction.page',
  modal: 'editor.artwork.interaction.modal',
  none: 'editor.artwork.interaction.none',
  link: 'editor.artwork.interaction.link'
};
// What a new artwork is, before the author changes it: the size and the rotation the worlds in
// data/worlds/ already use, and a place in front of the visitor.
const START = { position: [0, 1.5, -10], rotation: [0, 0, 0], size: [4, 3, 0.1] };

const round = (value) => Math.round(value * 1000) / 1000;

// O catálogo, filtrado pelo tipo de conteúdo que a obra mostra: uma imagem, um vídeo ou um modelo. A
// obra de texto não tem asset, e por isso não pergunta nenhum (D58).
function catalogueAssets(data, kind) {
  if (kind === 'text') return [];
  const wanted = kind === 'video' ? 'video' : (kind === 'model' ? 'model' : 'image');
  return Object.entries(data.assets || {})
    .filter(([, asset]) => asset && asset.type === wanted)
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
    asset: artwork.asset || (artwork.kind === 'text' ? t(KIND_LABEL.text) : '—'),
    interaction: t(INTERACTION_LABEL[artwork.interaction] || INTERACTION_LABEL.none)
  });
  const inCatalogue = artwork.kind === 'text'
    ? true
    : (!!artwork.asset && !!data.assets && Object.prototype.hasOwnProperty.call(data.assets, artwork.asset));
  if (!inCatalogue) summary.classList.add('em-falta');
  box.appendChild(summary);

  if (!inCatalogue) {
    note(box, t('editor.artwork.missing', { asset: artwork.asset || '—' }), 'nota erro');
  }

  const apply = debounce(() => {
    preview.replaceArtwork(artwork, data.assets || {});
    context.change();
  });

  // O tipo de conteúdo (D58): decide o que a obra é e o que os campos abaixo pedem.
  const kindField = selectField(box, {
    name: 'artwork.' + artwork.id + '.kind',
    labelKey: 'editor.artwork.kind',
    value: artwork.kind || 'image',
    options: KINDS.map((kind) => ({ value: kind, label: t(KIND_LABEL[kind]) })),
    onChange: (kind) => {
      artwork.kind = kind;
      // Um tipo mostra um ficheiro, o outro mostra texto: o que deixa de valer sai do dado, para o
      // ficheiro não ficar com as duas coisas e o validador a recusá-lo (as regras do esquema).
      if (kind === 'text') delete artwork.asset;
      else delete artwork.text;
      if (kind === 'text' && !artwork.text) artwork.text = {};
      preview.replaceArtwork(artwork, data.assets || {});
      context.change();
      context.rerender();
    }
  });

  const assetField = selectField(box, {
    name: 'artwork.' + artwork.id + '.asset',
    labelKey: 'editor.artwork.asset',
    value: artwork.asset || '',
    options: [{ value: '', label: t('editor.field.none') }].concat(
      catalogueAssets(data, artwork.kind || 'image').concat(artwork.asset ? [{ id: artwork.asset, type: artwork.kind }] : [])
        .filter((entry, at, all) => all.findIndex((other) => other.id === entry.id) === at)
        .map((entry) => ({ value: entry.id, label: entry.id }))
    ),
    onChange: (value) => {
      if (value) artwork.asset = value;
      else delete artwork.asset;
      // O tipo segue o ficheiro quando o catálogo sabe o que ele é: um `.gltf` é um modelo, um `.mp4`
      // é um vídeo. É o catálogo que sabe, e o validador recusa a obra em que os dois discordam.
      const chosen = value && data.assets ? data.assets[value] : null;
      if (chosen && (chosen.type === 'image' || chosen.type === 'video' || chosen.type === 'model')) {
        artwork.kind = chosen.type;
      }
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

  // O texto de uma obra `kind: "text"` (D58), por língua como o título: é o conteúdo da obra.
  const textFields = LANGUAGES.map((language) => textField(box, {
    name: 'artwork.' + artwork.id + '.text.' + language,
    label: t('editor.artwork.textIn', { language: language }),
    value: artwork.text ? artwork.text[language] : '',
    onChange: (text) => {
      if (!artwork.text) artwork.text = {};
      if (text.trim() === '') delete artwork.text[language];
      else artwork.text[language] = text;
      apply();
    }
  }));

  const syncFields = () => {
    const isText = (artwork.kind || 'image') === 'text';
    assetField.element.hidden = isText;
    textFields.forEach((field) => { field.element.hidden = !isText; });
  };
  syncFields();

  // A ficha da obra (D60): quem a fez e o que ela é, por língua, e o site que a ficha tenta embutir.
  // Sem estes campos a ficha abria sem autor e sem uma linha sobre a obra.
  const authorFields = LANGUAGES.map((language) => textField(box, {
    name: 'artwork.' + artwork.id + '.author.' + language,
    label: t('editor.artwork.authorIn', { language: language }),
    value: artwork.author ? artwork.author[language] : '',
    onChange: (text) => {
      if (!artwork.author) artwork.author = {};
      if (text.trim() === '') delete artwork.author[language];
      else artwork.author[language] = text;
      if (Object.keys(artwork.author).length === 0) delete artwork.author;
      apply();
    }
  }));

  const synopsisFields = LANGUAGES.map((language) => textField(box, {
    name: 'artwork.' + artwork.id + '.synopsis.' + language,
    label: t('editor.artwork.synopsisIn', { language: language }),
    value: artwork.synopsis ? artwork.synopsis[language] : '',
    onChange: (text) => {
      if (!artwork.synopsis) artwork.synopsis = {};
      if (text.trim() === '') delete artwork.synopsis[language];
      else artwork.synopsis[language] = text;
      if (Object.keys(artwork.synopsis).length === 0) delete artwork.synopsis;
      apply();
    }
  }));

  textField(box, {
    name: 'artwork.' + artwork.id + '.site',
    labelKey: 'editor.artwork.site',
    value: artwork.site || '',
    onChange: (value) => {
      if (value.trim()) artwork.site = value.trim();
      else delete artwork.site;
      apply();
    }
  });

  // Abre no browser a ficha que o dado produz — o mesmo caminho que a cena usaria (D60). É o que
  // permite ao autor ver a página sem ir à exposição.
  const mundo = (context.world() && context.world().world && context.world().world.slug) || '';
  button(box, {
    labelKey: 'editor.artwork.openPage',
    name: 'artwork.' + artwork.id + '.page',
    disabled: !mundo,
    onClick: () => {
      if (!mundo) return;
      const href = artworkPageHref(mundo, artwork.id, currentLanguage());
      if (href) window.open(href, '_blank', 'noopener');
    }
  });

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

// As três interacções são construídas desde a Fase 7 (B6): `link` navega para o endereço. O campo do
// endereço só aparece com `link`, que é a única em que ele significa alguma coisa.
function interactionField(box, artwork, context) {
  const options = INTERACTIONS.map((value) => ({ value: value, label: t(INTERACTION_LABEL[value]) }));

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

  const url = textField(box, {
    name: 'artwork.' + artwork.id + '.url',
    labelKey: 'editor.artwork.url',
    value: artwork.url || '',
    onChange: (value) => {
      if (value.trim()) artwork.url = value.trim();
      else delete artwork.url;
      preview.replaceArtwork(artwork, context.world().assets || {});
      context.change();
    }
  });
  url.element.hidden = artwork.interaction !== 'link';
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

  const kind = selectField(box, {
    name: 'artwork.new.kind',
    labelKey: 'editor.artwork.kind',
    value: 'image',
    options: KINDS.map((value) => ({ value: value, label: t(KIND_LABEL[value]) })),
    onChange: () => {}
  });

  const asset = selectField(box, {
    name: 'artwork.new.asset',
    labelKey: 'editor.artwork.asset',
    value: '',
    options: [{ value: '', label: t('editor.field.none') }].concat(
      catalogueAssets(data, 'image').map((entry) => ({ value: entry.id, label: entry.id }))
    ),
    onChange: () => {}
  });

  // A lista de assets segue o tipo escolhido: um modelo não aparece na lista de imagens (D58).
  const syncAssets = () => {
    const wanted = catalogueAssets(data, kind.input.value);
    asset.input.innerHTML = '';
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = t('editor.field.none');
    asset.input.appendChild(blank);
    for (const entry of wanted) {
      const option = document.createElement('option');
      option.value = entry.id;
      option.textContent = entry.id;
      asset.input.appendChild(option);
    }
    asset.element.hidden = kind.input.value === 'text';
  };
  kind.input.addEventListener('change', syncAssets);
  syncAssets();

  const newText = LANGUAGES.map((language) => textField(box, {
    name: 'artwork.new.text.' + language,
    label: t('editor.artwork.textIn', { language: language }),
    value: '',
    onChange: () => {}
  }));

  const syncText = () => {
    const isText = kind.input.value === 'text';
    newText.forEach((field) => { field.element.hidden = !isText; });
  };
  kind.input.addEventListener('change', syncText);
  syncText();

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

  const newUrl = textField(box, {
    name: 'artwork.new.url',
    labelKey: 'editor.artwork.url',
    value: '',
    onChange: () => {}
  });
  newUrl.element.hidden = true;
  const newInteraction = box.querySelector('[name="artwork.new.interaction"]');
  if (newInteraction) {
    newInteraction.addEventListener('change', () => {
      newUrl.element.hidden = newInteraction.value !== 'link';
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
      const chosenKind = value('artwork.new.kind').value;
      const asset = value('artwork.new.asset').value;
      if (chosenKind !== 'text' && !asset) {
        problem.textContent = t('editor.artwork.needsAsset');
        return;
      }
      const artworkText = {};
      for (const language of LANGUAGES) {
        const written = value('artwork.new.text.' + language).value.trim();
        if (written) artworkText[language] = written;
      }
      if (chosenKind === 'text' && Object.keys(artworkText).length === 0) {
        problem.textContent = t('editor.artwork.needsText');
        return;
      }
      problem.textContent = '';

      const artwork = {
        id: nextId(data.artworks),
        dimension: Number(value('artwork.new.dimension').value),
        kind: chosenKind,
        position: ['x', 'y', 'z'].map((axis) => Number(value('artwork.new.position.' + axis).value)),
        rotation: ['x', 'y', 'z'].map((axis) => Number(value('artwork.new.rotation.' + axis).value)),
        size: ['x', 'y', 'z'].map((axis) => Number(value('artwork.new.size.' + axis).value)),
        interaction: value('artwork.new.interaction').value
      };
      if (chosenKind === 'text') artwork.text = artworkText;
      else artwork.asset = asset;
      const linkUrl = value('artwork.new.url').value.trim();
      if (artwork.interaction === 'link' && linkUrl) artwork.url = linkUrl;
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
