// O painel dos assets: o catálogo do mundo, editável (Fase 7, B4).
//
// Porque existe: até aqui o catálogo era dado do ficheiro — o editor escolhia entre os assets que o
// mundo já tinha e não criava nenhum, e acrescentar uma fotografia obrigava a escrever JSON à mão. A
// limitação estava registada no README desde a Fase 4, e é a última coisa que faltava do §7.
//
// O `id` é pedido só na inserção, como o das dimensões e o das obras: mudá-lo deixaria cada obra,
// cada fundo e cada retrato de porta a apontar para um asset que já não tem esse nome. As regras do
// formato continuam a ser as do validador: o caminho tem de ser relativo à raiz e dentro dela (L12), o
// ficheiro tem de existir (L9) e uma imagem de panorama acima de 2048 px avisa (L14) — o painel não
// inventa uma regra própria, só mostra o que ele disser depois de cada alteração.
import { t } from '../../i18n.js';
import { LANGUAGES, ASSET_KINDS } from '../../scene/schema.js';
import * as preview from '../preview.js';
import { heading, textField, selectField, button, note, debounce } from '../fields.js';

const TYPE_LABEL = {
  image: 'editor.assets.type.image',
  video: 'editor.assets.type.video',
  model: 'editor.assets.type.model'
};

// O mesmo formato de nome que a lei L10 escreve: minúsculas, números e hífenes.
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const typeName = (type) => t(TYPE_LABEL[type] || TYPE_LABEL.image);

// Onde um asset é usado: os fundos (o asset e a reserva de um shader), as obras, e as janelas das
// portas (o retrato e o recorte). Apagar um asset em uso partiria os três em silêncio.
function usersOf(data, id) {
  let count = 0;
  for (const dimension of data.dimensions || []) {
    if (dimension.asset === id || dimension.fallbackAsset === id) count += 1;
  }
  for (const artwork of data.artworks || []) {
    if (artwork.asset === id) count += 1;
  }
  for (const portal of data.portals || []) {
    const axis = portal.window || {};
    if (axis.asset === id || axis.cutout === id) count += 1;
  }
  return count;
}

export function render(host, context) {
  const data = context.world();
  const catalogue = data.assets && typeof data.assets === 'object' ? data.assets : null;

  heading(host, 'editor.assets.title');

  if (!catalogue || Object.keys(catalogue).length === 0) {
    note(host, t('editor.assets.none'));
  }

  for (const [id, asset] of Object.entries(catalogue || {})) {
    host.appendChild(card(id, asset, context, data));
  }

  host.appendChild(insertForm(context, data));
}

function card(id, asset, context, data) {
  const box = document.createElement('details');
  box.className = 'cartao';

  const summary = document.createElement('summary');
  summary.textContent = t('editor.assets.summary', {
    id: id, type: typeName(asset.type), path: asset.path || '—'
  });
  box.appendChild(summary);

  // Qualquer alteração ao catálogo muda o que a cena carrega: o `<a-assets>` é construído a partir
  // dele, por isso o mundo é reconstruído (e não só a entidade) — é a mesma regra das dimensões.
  const apply = debounce(() => context.change({ rebuild: true }));

  textField(box, {
    name: 'asset.' + id + '.path',
    labelKey: 'editor.assets.path',
    value: asset.path || '',
    onChange: (value) => {
      asset.path = value;
      apply();
    }
  });

  selectField(box, {
    name: 'asset.' + id + '.type',
    labelKey: 'editor.assets.type',
    value: asset.type || 'image',
    options: ASSET_KINDS.map((type) => ({ value: type, label: typeName(type) })),
    onChange: (value) => {
      asset.type = value;
      apply();
    }
  });

  // A descrição é texto de conteúdo: por língua, e sem tocar na cena.
  for (const language of LANGUAGES) {
    textField(box, {
      name: 'asset.' + id + '.alt.' + language,
      label: t('editor.assets.altIn', { language: language }),
      value: asset.alt ? asset.alt[language] : '',
      onChange: (value) => {
        if (!asset.alt) asset.alt = {};
        if (value.trim() === '') delete asset.alt[language];
        else asset.alt[language] = value;
        if (Object.keys(asset.alt).length === 0) delete asset.alt;
        context.change();
      }
    });
  }

  const users = usersOf(data, id);
  if (users > 0) {
    note(box, t('editor.assets.inUse', { id: id, count: users }), 'nota bloqueio');
    // O botão existe e está desactivado: um painel que esconde o que não pode fazer deixa o autor a
    // procurar o comando. O `name` é o mesmo do outro ramo para o DOM poder dizer que ele está lá.
    button(box, {
      labelKey: 'editor.assets.delete',
      name: 'asset.' + id + '.delete',
      disabled: true,
      onClick: () => {}
    });
  } else {
    button(box, {
      labelKey: 'editor.assets.delete',
      name: 'asset.' + id + '.delete',
      onClick: async () => {
        delete data.assets[id];
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
  summary.textContent = t('editor.assets.add');
  box.appendChild(summary);

  const id = textField(box, {
    name: 'asset.new.id',
    labelKey: 'editor.assets.id',
    value: '',
    onChange: () => {}
  });

  textField(box, {
    name: 'asset.new.path',
    labelKey: 'editor.assets.path',
    value: '',
    onChange: () => {}
  });

  selectField(box, {
    name: 'asset.new.type',
    labelKey: 'editor.assets.type',
    value: 'image',
    options: ASSET_KINDS.map((value) => ({ value: value, label: typeName(value) })),
    onChange: () => {}
  });

  for (const language of LANGUAGES) {
    textField(box, {
      name: 'asset.new.alt.' + language,
      label: t('editor.assets.altIn', { language: language }),
      value: '',
      onChange: () => {}
    });
  }

  const problem = note(box, '', 'nota erro');

  button(box, {
    labelKey: 'editor.assets.create',
    name: 'asset.new.create',
    onClick: async () => {
      const value = (name) => box.querySelector('[name="' + name + '"]');
      const chosen = value('asset.new.id').value.trim();
      const where = value('asset.new.path').value.trim();
      if (!ID.test(chosen)) {
        problem.textContent = t('editor.assets.idInvalid');
        return;
      }
      if (data.assets && data.assets[chosen]) {
        problem.textContent = t('editor.assets.idTaken', { id: chosen });
        return;
      }
      // O caminho é relativo à raiz do projeto, e não sai dela (a mesma regra da L12).
      if (!where || /^([a-zA-Z]:[\\/]|[\\/])/.test(where) || where.indexOf('..') >= 0) {
        problem.textContent = t('editor.assets.pathOutside');
        return;
      }
      problem.textContent = '';

      const asset = { path: where, type: value('asset.new.type').value };
      const alt = {};
      for (const language of LANGUAGES) {
        const written = value('asset.new.alt.' + language).value.trim();
        if (written) alt[language] = written;
      }
      if (Object.keys(alt).length > 0) asset.alt = alt;

      if (!data.assets) data.assets = {};
      data.assets[chosen] = asset;
      await context.change({ rebuild: true });
      context.rerender();
    }
  });

  return box;
}
