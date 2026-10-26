// O dado das obras entra por um CSV, e sai daqui para dentro dos mundos (D62).
//
// Porque existe: o autor preenche as obras numa folha de cálculo — título, autor, sinopse, o site e a
// capa — e o dado da exposição tem de passar a dizer o mesmo. Escrever à mão em vinte sítios é a
// duplicação que a D20 fechou para os endereços; um `import` de uma folha é a mesma ideia: **uma**
// fonte para preencher, e uma ferramenta que a espalha pelo dado e diz o que mudou.
//
// Uso, da raiz do projeto:
//
//   node tools/artwork/from-csv.mjs             lê data/obras.csv e escreve nos mundos o que mudou
//   node tools/artwork/from-csv.mjs --check     não escreve: diz o que mudaria (código 1 se houver)
//
// O CSV é simples de propósito: uma linha por obra, a primeira coluna o mundo (o slug), a segunda o
// `id` da obra, e o resto o que a ficha mostra. Uma linha que começa por `#` é um comentário, para o
// ficheiro poder explicar-se a quem o abrir.
//
// Regras de conversão, todas ditas em voz alta no relatório:
//
//   - `titulo_pt`/`titulo_en`, `sinopse_pt`/`sinopse_en` são conteúdo por língua (D12): uma tradução
//     que falte **não** se inventa — fica a que existe e o relatório diz qual falta;
//   - `autor` é uma linha só e vai para as duas línguas (é um nome, não uma frase);
//   - `site` preenchido faz da obra uma obra `site` (D60): a ficha embute-o e a capa passa a ser a
//     imagem que fica por baixo do iframe;
//   - `capa` preenchida aponta a obra para um asset próprio (`capa-<id>`) com esse caminho, e o tipo
//     vem da extensão do ficheiro. Vazio deixa a obra como está — é o que permite preencher só os
//     textos e não tocar em nenhuma imagem.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGES, ORIGIN_LANGUAGE } from '../../js/scene/schema.js';
import { validateScene } from '../../js/scene/validation.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const CSV = join(root, 'data', 'obras.csv');
const CHECK = process.argv.includes('--check');

const COLUMNS = ['mundo', 'id', 'titulo_pt', 'titulo_en', 'autor', 'sinopse_pt', 'sinopse_en', 'site', 'capa'];
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif|gif)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)$/i;

// Um CSV com aspas: `"um texto, com vírgula"` é uma célula. É o mínimo que uma folha de cálculo
// exporta, e é o que o ficheiro promete a quem o preenche.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const character = text[i];
    if (quoted) {
      if (character === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (character === '"') quoted = false;
      else cell += character;
      continue;
    }
    if (character === '"') { quoted = true; continue; }
    if (character === ',') { row.push(cell); cell = ''; continue; }
    if (character === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    if (character === '\r') continue;
    cell += character;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((line) => line.length > 1 || (line.length === 1 && line[0].trim() !== ''));
}

// As linhas com conteúdo, já em objectos: os comentários e a linha de cabeçalho ficam de fora.
export function readRows(text) {
  const rows = parseCsv(text);
  const index = {};
  const lines = [];
  let seenHeader = false;
  for (const row of rows) {
    const first = (row[0] || '').trim();
    if (first.startsWith('#')) continue;
    if (!seenHeader) {
      seenHeader = true;
      COLUMNS.forEach((name) => { index[name] = row.findIndex((cell) => cell.trim() === name); });
      for (const name of COLUMNS) {
        if (index[name] < 0) index[name] = COLUMNS.indexOf(name);
      }
      continue;
    }
    const value = (name) => ((row[index[name]] || '').trim());
    lines.push({
      line: lines.length + 1,
      world: value('mundo'),
      id: value('id'),
      title: pickLanguage(value('titulo_pt'), value('titulo_en')),
      author: value('autor'),
      synopsis: pickLanguage(value('sinopse_pt'), value('sinopse_en')),
      site: value('site'),
      cover: value('capa')
    });
  }
  return lines;
}

// Uma linha por língua, e nenhuma inventada: o que falta fica em falta.
function pickLanguage(origin, other) {
  const value = {};
  if (origin) value[ORIGIN_LANGUAGE] = origin;
  const second = LANGUAGES.find((code) => code !== ORIGIN_LANGUAGE);
  if (other && second) value[second] = other;
  return Object.keys(value).length ? value : null;
}

const same = (one, other) => JSON.stringify(one) === JSON.stringify(other);

// Aplica uma linha a um mundo, devolvendo a lista do que mudou (para o relatório, e para um `--check`
// poder dizer o que faria sem tocar em nada).
export function applyRow(world, row, { exists }) {
  const changes = [];
  const artworks = Array.isArray(world.artworks) ? world.artworks : [];
  const artwork = artworks.find((item) => String(item.id) === String(row.id));
  if (!artwork) return { error: `obra ${row.id} não existe no mundo ${row.world}` };

  if (row.title && !same(artwork.title, row.title)) {
    artwork.title = row.title;
    changes.push(`obra ${row.id}: título`);
  }
  if (row.author) {
    const author = {};
    for (const code of LANGUAGES) author[code] = row.author;
    if (!same(artwork.author, author)) {
      artwork.author = author;
      changes.push(`obra ${row.id}: autor`);
    }
  }
  if (row.synopsis && !same(artwork.synopsis, row.synopsis)) {
    artwork.synopsis = row.synopsis;
    changes.push(`obra ${row.id}: sinopse`);
  }

  const missing = row.synopsis && LANGUAGES.filter((code) => !row.synopsis[code]);
  if (missing && missing.length) changes.push(`obra ${row.id}: sinopse sem tradução (${missing.join(', ')})`);

  if (row.site) {
    if (!/^https?:\/\//i.test(row.site)) return { error: `obra ${row.id}: o site "${row.site}" não é um endereço http(s)` };
    if (artwork.site !== row.site) {
      artwork.site = row.site;
      changes.push(`obra ${row.id}: site`);
    }
    if (artwork.kind !== 'site') {
      artwork.kind = 'site';
      changes.push(`obra ${row.id}: passa a obra "site"`);
    }
  }

  if (row.cover) {
    const type = IMAGE_EXTENSIONS.test(row.cover) ? 'image' : (VIDEO_EXTENSIONS.test(row.cover) ? 'video' : null);
    if (!type) return { error: `obra ${row.id}: a capa "${row.cover}" não é uma imagem nem um vídeo conhecido` };
    if (artwork.kind === 'site' && type !== 'image') {
      return { error: `obra ${row.id}: uma obra com site tem de ter uma imagem de capa (a que fica por baixo do iframe)` };
    }
    if (exists(row.cover) === false) return { error: `obra ${row.id}: a capa "${row.cover}" não existe no projeto` };
    // A capa que já é a da obra não é uma mudança: é o CSV a dizer o que o dado já diz, e reescrever
    // o catálogo por causa disso daria um asset novo em cada corrida.
    world.assets = world.assets || {};
    const current = artwork.asset ? world.assets[artwork.asset] : null;
    if (!(current && current.path === row.cover && current.type === type)) {
      const key = `capa-${row.id}`;
      const previous = world.assets[key];
      const titulo = artwork.title && artwork.title[ORIGIN_LANGUAGE];
      const entry = {
        path: row.cover,
        type,
        alt: (previous && previous.alt) ||
          { [ORIGIN_LANGUAGE]: 'Capa da obra ' + (titulo || row.id) }
      };
      if (!same(previous, entry)) {
        world.assets[key] = entry;
        changes.push(`obra ${row.id}: capa (${row.cover})`);
      }
      if (artwork.asset !== key) {
        artwork.asset = key;
        changes.push(`obra ${row.id}: passa a usar o asset "${key}"`);
      }
    }
    if (artwork.kind !== 'site' && artwork.kind !== type) {
      artwork.kind = type;
      changes.push(`obra ${row.id}: passa a obra "${type}"`);
    }
  }

  return { changes };
}

function main() {
  if (!existsSync(CSV)) {
    console.error('não encontrei ' + CSV);
    process.exit(1);
  }
  const rows = readRows(readFileSync(CSV, 'utf8'));
  const worlds = new Map();
  const problems = [];
  const touched = new Set();

  for (const row of rows) {
    if (!row.world || !row.id) { problems.push(`linha ${row.line}: falta o mundo ou o id`); continue; }
    const file = join(root, 'data', 'worlds', row.world + '.json');
    if (!existsSync(file)) { problems.push(`linha ${row.line}: o mundo "${row.world}" não existe`); continue; }
    if (!worlds.has(row.world)) worlds.set(row.world, JSON.parse(readFileSync(file, 'utf8')));
    const result = applyRow(worlds.get(row.world), row, { exists: (path) => existsSync(join(root, path)) });
    if (result.error) problems.push(`linha ${row.line}: ${result.error}`);
    else if (result.changes.length) {
      touched.add(row.world);
      for (const change of result.changes) console.log('  ' + change);
    }
  }

  // O dado que sai daqui tem de passar as mesmas leis que o resto: escrever primeiro e validar depois
  // seria gravar um mundo que a exposição recusa.
  for (const [slug, world] of worlds) {
    const report = validateScene(world, { exists: (path) => existsSync(join(root, path)) });
    if (!report.ok) {
      problems.push(`o mundo ${slug} ficaria inválido:`);
      for (const error of report.errors) problems.push('  ' + error);
    }
  }

  if (problems.length) {
    console.error('nada foi escrito:');
    for (const problem of problems) console.error('  ' + problem);
    process.exit(1);
  }

  if (touched.size === 0) {
    console.log('o CSV não muda nada: o dado já diz o mesmo');
    return;
  }
  if (CHECK) {
    console.log('mudaria: ' + [...touched].join(', ') + ' (nada foi escrito: --check)');
    process.exit(1);
  }
  for (const slug of touched) {
    writeFileSync(join(root, 'data', 'worlds', slug + '.json'),
      JSON.stringify(worlds.get(slug), null, 2) + '\n', 'utf8');
    console.log('escrito data/worlds/' + slug + '.json');
  }
}

const entry = process.argv[1] ? fileURLToPath(import.meta.url) === join(process.argv[1]) : false;
if (entry) main();
