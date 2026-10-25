// The dimension panel: the four things section 7 of the roadmap asks of a dimension — insert, change,
// maintain, delete.
//
// What it offers follows what the scene builds (D30 revisada na Fase 7): `kind: "shader"` (B9) e
// `kind: "color"` (B5) são construídos pelo renderer e por isso aparecem aqui. O id é perguntado só
// na inserção, porque mudá-lo deixaria cada obra e cada porta a apontar para uma dimensão que já não
// tem esse nome.
//
// Every edit writes the model first and then applies it: a geometry change re-creates **that entity**
// (D33), and a change of structure (insert, delete) rebuilds the scene, because the ids in the rest of
// the file stop matching.
import { t } from '../../i18n.js';
import { LANGUAGES } from '../../scene/schema.js';
import { SHADERS } from '../../modules/shaders.js';
import * as preview from '../preview.js';
import { heading, textField, numberField, selectField, colorField, button, note, debounce } from '../fields.js';

// Law L15: 448…511 belong to the portraits the builder derives, so a declared dimension may not use
// them — the camera would end up inside a portrait.
const DECLARED_MAX = 447;

const KINDS = ['image', 'video', 'shader', 'color', 'camera'];
const KIND_LABEL = {
  image: 'editor.dimension.kind.image',
  video: 'editor.dimension.kind.video',
  shader: 'editor.dimension.kind.shader',
  color: 'editor.dimension.kind.color',
  camera: 'editor.dimension.kind.camera'
};

const kindName = (kind) => t(KIND_LABEL[kind] || KIND_LABEL.image);

function countArtworks(artworks) {
  const counts = {};
  for (const artwork of artworks || []) {
    if (typeof artwork.dimension === 'number') counts[artwork.dimension] = (counts[artwork.dimension] || 0) + 1;
  }
  return counts;
}

// A door belongs to a dimension and may link two of them: deleting any of the three breaks the door.
function countPortals(portals) {
  const counts = {};
  const add = (id) => { if (typeof id === 'number') counts[id] = (counts[id] || 0) + 1; };
  for (const portal of portals || []) {
    add(portal.ownedBy);
    const axis = portal.window || {};
    add(axis.dimensionA);
    add(axis.dimensionB);
  }
  return counts;
}

// The catalogue, filtered by what the kind of background can use.
function catalogueFor(data, kind) {
  const wanted = kind === 'video' ? 'video' : 'image';
  return Object.entries(data.assets || {})
    .filter(([, asset]) => asset && asset.type === wanted)
    .map(([id]) => id);
}

function firstFreeId(dimensions) {
  const taken = new Set((dimensions || []).map((dimension) => dimension.id));
  for (let id = 0; id <= DECLARED_MAX; id++) if (!taken.has(id)) return id;
  return DECLARED_MAX;
}

export function render(host, context) {
  const data = context.world();
  // Read, never write: a world without a `dimensions` list is a broken file, not one to be fixed by
  // looking at it (the validator is what says so). The list is created only by an insert.
  const dimensions = Array.isArray(data.dimensions) ? data.dimensions : [];

  heading(host, 'editor.dimension.title');

  const artworks = countArtworks(data.artworks);
  const portals = countPortals(data.portals);

  if (dimensions.length === 0) note(host, t('editor.dimension.none'));

  for (const dimension of dimensions) {
    host.appendChild(card(dimension, context, data, artworks, portals));
  }

  host.appendChild(insertForm(context, data));
}

function card(dimension, context, data, artworks, portals) {
  const box = document.createElement('details');
  box.className = 'cartao';
  box.open = data.dimensions.length === 1;

  const summary = document.createElement('summary');
  summary.textContent = t('editor.dimension.summary', {
    id: dimension.id,
    kind: kindName(dimension.kind),
    artworks: artworks[dimension.id] || 0,
    portals: portals[dimension.id] || 0
  });
  box.appendChild(summary);

  const geometry = debounce(() => {
    preview.replaceDimension(dimension);
    context.change();
  });

  // The name is content text, so it is per language (D21). Writing it changes no geometry: the scene
  // has nothing to rebuild, and the validator is the one that says a name is missing.
  for (const language of LANGUAGES) {
    textField(box, {
      name: 'dimension.' + dimension.id + '.name.' + language,
      label: t('editor.dimension.nameIn', { language: language }),
      value: dimension.name ? dimension.name[language] : '',
      onChange: (text) => {
        if (!dimension.name) dimension.name = {};
        if (text.trim() === '') delete dimension.name[language];
        else dimension.name[language] = text;
        if (Object.keys(dimension.name).length === 0) delete dimension.name;
        context.change();
      }
    });
  }

  const assetField = selectField(box, {
    name: 'dimension.' + dimension.id + '.asset',
    labelKey: 'editor.dimension.asset',
    value: dimension.asset || '',
    options: [{ value: '', label: t('editor.field.none') }].concat(
      // The asset the file already names is offered even if the catalogue has none of that type: a
      // panel is not the place to make a value disappear.
      catalogueFor(data, dimension.kind).concat(dimension.asset ? [dimension.asset] : [])
        .filter((id, at, all) => all.indexOf(id) === at)
        .map((id) => ({ value: id, label: id }))
    ),
    onChange: (value) => {
      if (value) dimension.asset = value;
      else delete dimension.asset;
      geometry();
    }
  });

  const radiusField = numberField(box, {
    name: 'dimension.' + dimension.id + '.radius',
    labelKey: 'editor.dimension.radius',
    // What the scene applies when the file says nothing is the component's default (100 m); showing it
    // is honest, and it is only written to the file if the author touches the field.
    value: dimension.radius === undefined ? 100 : dimension.radius,
    min: 1,
    step: 1,
    onChange: (value) => { dimension.radius = value; geometry(); }
  });

  // The two fields of a shader background (R14/R15). The shader is chosen by id from the internal
  // list — GLSL never comes from the file — and the fallback is an image of the catalogue: what the
  // visitor sees while the trial's flag is closed.
  const shaderField = selectField(box, {
    name: 'dimension.' + dimension.id + '.shaderId',
    labelKey: 'editor.dimension.shader',
    value: dimension.shaderId || '',
    options: [{ value: '', label: t('editor.field.none') }].concat(
      SHADERS.map((entry) => ({ value: entry.id, label: entry.name }))
    ),
    onChange: (value) => {
      if (value) dimension.shaderId = value;
      else delete dimension.shaderId;
      geometry();
    }
  });

  const fallbackField = selectField(box, {
    name: 'dimension.' + dimension.id + '.fallbackAsset',
    labelKey: 'editor.dimension.fallback',
    value: dimension.fallbackAsset || '',
    options: [{ value: '', label: t('editor.field.none') }].concat(
      catalogueFor(data, 'image').concat(dimension.fallbackAsset ? [dimension.fallbackAsset] : [])
        .filter((id, at, all) => all.indexOf(id) === at)
        .map((id) => ({ value: id, label: id }))
    ),
    onChange: (value) => {
      if (value) dimension.fallbackAsset = value;
      else delete dimension.fallbackAsset;
      geometry();
    }
  });

  // O fundo liso (D56): a cor, quando o tipo é `color` e não há imagem para mostrar.
  const colorFieldBox = colorField(box, {
    name: 'dimension.' + dimension.id + '.color',
    labelKey: 'editor.dimension.color',
    value: dimension.color || '#101018',
    onChange: (value) => { dimension.color = value; geometry(); }
  });

  const assetBox = assetField.element;
  const radiusBox = radiusField.element;
  const shaderBox = shaderField.element;
  const fallbackBox = fallbackField.element;
  const colorBox = colorFieldBox.element;
  const onlyWhenBackground = () => {
    const shader = dimension.kind === 'shader';
    const camera = dimension.kind === 'camera';
    const flat = dimension.kind === 'color';
    assetBox.hidden = camera || shader || flat;
    radiusBox.hidden = camera;
    shaderBox.hidden = !shader;
    fallbackBox.hidden = !shader;
    colorBox.hidden = !flat;
  };
  onlyWhenBackground();

  selectField(box, {
    name: 'dimension.' + dimension.id + '.kind',
    labelKey: 'editor.dimension.kind',
    value: dimension.kind,
    options: KINDS.map((kind) => ({ value: kind, label: kindName(kind) })),
    onChange: (kind) => {
      dimension.kind = kind;
      // A camera dimension has no sphere, so the two fields above stop applying: repaint the panel and
      // re-create the entity (which for `camera` is no entity at all).
      preview.replaceDimension(dimension);
      context.change();
      context.rerender();
    }
  });

  const pointingArtworks = artworks[dimension.id] || 0;
  const pointingPortals = portals[dimension.id] || 0;

  // B3 (Fase 7): a exclusão em lote por dimensão, que era a nota «não entrou» do B6 da Fase 4. Sai
  // como **uma** alteração — o `change` guarda o texto de antes uma só vez, por isso o «Desfazer»
  // devolve as N obras juntas e não uma de cada vez. A pergunta é a do browser: uma operação
  // destrutiva merece um «sim» explícito, e a contagem vai na pergunta para não haver surpresa.
  if (pointingArtworks > 0) {
    button(box, {
      labelKey: 'editor.dimension.deleteMany',
      name: 'dimension.' + dimension.id + '.deleteMany',
      onClick: async () => {
        const alvo = (data.artworks || []).filter((artwork) => artwork.dimension === dimension.id);
        if (alvo.length === 0) return;
        const pergunta = t('editor.dimension.deleteManyConfirm', {
          count: alvo.length, id: dimension.id
        });
        if (typeof window.confirm === 'function' && !window.confirm(pergunta)) return;
        data.artworks = data.artworks.filter((artwork) => artwork.dimension !== dimension.id);
        await context.change({ rebuild: true });
        context.rerender();
        // A linha de estado é onde o autor já está a olhar (é o mesmo sítio dos outros avisos do
        // editor), e dizer quantas obras saíram é o recibo da operação.
        context.message(t('editor.dimension.deleteManyDone', {
          count: alvo.length, id: dimension.id
        }));
      }
    });
  }

  if (pointingArtworks > 0 || pointingPortals > 0) {
    note(box, t('editor.dimension.blockedBy', {
      id: dimension.id,
      artworks: pointingArtworks,
      portals: pointingPortals
    }), 'nota bloqueio');
    button(box, { labelKey: 'editor.dimension.delete', disabled: true, onClick: () => {} });
  } else {
    button(box, {
      labelKey: 'editor.dimension.delete',
      name: 'dimension.' + dimension.id + '.delete',
      onClick: async () => {
        const at = data.dimensions.indexOf(dimension);
        if (at >= 0) data.dimensions.splice(at, 1);
        await context.change({ rebuild: true });
        context.rerender();
      }
    });
  }

  return box;
}

function insertForm(context, data) {
  const box = document.createElement('details');
  box.className = 'cartao inserir';
  const summary = document.createElement('summary');
  summary.textContent = t('editor.dimension.add');
  box.appendChild(summary);

  numberField(box, {
    name: 'dimension.new.id',
    labelKey: 'editor.dimension.id',
    value: firstFreeId(data.dimensions),
    min: 0,
    max: DECLARED_MAX,
    step: 1,
    onChange: () => {}
  });

  const kind = selectField(box, {
    name: 'dimension.new.kind',
    labelKey: 'editor.dimension.kind',
    value: 'image',
    options: KINDS.map((value) => ({ value: value, label: kindName(value) })),
    onChange: () => {}
  });

  const asset = selectField(box, {
    name: 'dimension.new.asset',
    labelKey: 'editor.dimension.asset',
    value: '',
    options: [{ value: '', label: t('editor.field.none') }].concat(
      catalogueFor(data, 'image').map((id) => ({ value: id, label: id }))
    ),
    onChange: () => {}
  });

  const shader = selectField(box, {
    name: 'dimension.new.shaderId',
    labelKey: 'editor.dimension.shader',
    value: '',
    options: [{ value: '', label: t('editor.field.none') }].concat(
      SHADERS.map((entry) => ({ value: entry.id, label: entry.name }))
    ),
    onChange: () => {}
  });

  const fallback = selectField(box, {
    name: 'dimension.new.fallbackAsset',
    labelKey: 'editor.dimension.fallback',
    value: '',
    options: [{ value: '', label: t('editor.field.none') }].concat(
      catalogueFor(data, 'image').map((id) => ({ value: id, label: id }))
    ),
    onChange: () => {}
  });

  const color = colorField(box, {
    name: 'dimension.new.color',
    labelKey: 'editor.dimension.color',
    value: '#101018',
    onChange: () => {}
  });

  // What a kind needs changes what is asked: one background per kind (the rules of the format say the
  // same, so the panel is not inventing a rule of its own).
  const syncFields = () => {
    const isShader = kind.input.value === 'shader';
    const isCamera = kind.input.value === 'camera';
    const isFlat = kind.input.value === 'color';
    asset.element.hidden = isShader || isCamera || isFlat;
    shader.element.hidden = !isShader;
    fallback.element.hidden = !isShader;
    color.element.hidden = !isFlat;
    radius.element.hidden = isCamera;
  };

  const radius = numberField(box, {
    name: 'dimension.new.radius',
    labelKey: 'editor.dimension.radius',
    value: 100,
    min: 1,
    step: 1,
    onChange: () => {}
  });

  kind.input.addEventListener('change', syncFields);
  syncFields();

  for (const language of LANGUAGES) {
    textField(box, {
      name: 'dimension.new.name.' + language,
      label: t('editor.dimension.nameIn', { language: language }),
      value: '',
      onChange: () => {}
    });
  }

  const problem = note(box, '', 'nota erro');

  button(box, {
    labelKey: 'editor.dimension.create',
    name: 'dimension.new.create',
    onClick: async () => {
      const value = (name) => box.querySelector('[name="' + name + '"]');
      const id = Number(value('dimension.new.id').value);
      if (!Number.isInteger(id) || id < 0 || id > DECLARED_MAX) {
        problem.textContent = t('editor.dimension.idInvalid', { max: DECLARED_MAX });
        return;
      }
      if (data.dimensions.some((dimension) => dimension.id === id)) {
        problem.textContent = t('editor.dimension.idTaken', { id: id });
        return;
      }
      problem.textContent = '';

      const dimension = { id: id, kind: kind.input.value };
      if (dimension.kind !== 'camera') {
        const metres = Number(radius.input.value);
        if (Number.isFinite(metres) && metres > 0) dimension.radius = metres;
      }
      if (dimension.kind === 'shader') {
        if (shader.input.value) dimension.shaderId = shader.input.value;
        if (fallback.input.value) dimension.fallbackAsset = fallback.input.value;
      } else if (dimension.kind === 'color') {
        dimension.color = color.input.value;
      } else if (dimension.kind !== 'camera') {
        if (asset.input.value) dimension.asset = asset.input.value;
      }
      const name = {};
      for (const language of LANGUAGES) {
        const text = value('dimension.new.name.' + language).value.trim();
        if (text) name[language] = text;
      }
      if (Object.keys(name).length > 0) dimension.name = name;

      if (!Array.isArray(data.dimensions)) data.dimensions = [];
      data.dimensions.push(dimension);
      await context.change({ rebuild: true });
      context.rerender();
    }
  });

  return box;
}
