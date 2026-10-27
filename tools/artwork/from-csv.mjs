// O dado das obras entra por uma folha (TSV, ou CSV com `;`/`,`), e sai daqui para dentro dos mundos
// (D62).
//
// Porque existe: o autor preenche as obras numa folha de cálculo — título, autores, sinopse, a capa e o
// site — e o dado da exposição tem de passar a dizer o mesmo. Escrever à mão em vinte sítios é a
// duplicação que a D20 fechou para os endereços; um `import` de uma folha é a mesma ideia: **uma**
// fonte para preencher, e uma ferramenta que a espalha pelo dado e diz o que mudou.
//
// Uso, da raiz do projeto:
//
//   node tools/artwork/from-csv.mjs             lê data/obras.tsv e escreve nos mundos o que mudou
//   node tools/artwork/from-csv.mjs --check     não escreve: diz o que mudaria (código 1 se houver)
//   node tools/artwork/from-csv.mjs --file data/obras.exemplo.tsv
//                                               usa outra folha (o exemplo, sem tocar na definitiva)
//
// A folha é simples de propósito: uma linha por obra, a primeira coluna o mundo (o slug), a segunda o
// `id` da obra, e o resto o que a ficha mostra. Uma linha que começa por `#` é um comentário, para o
// ficheiro poder explicar-se a quem o abrir. O separador é **detectado**: tabulação (o padrão), `;` ou
// `,`. Com tabulações nenhum texto precisa de aspas — as vírgulas de uma sinopse são só texto.
//
// Regras de conversão, todas ditas em voz alta no relatório:
//
//   - `nome da obra` e `Descritivo` são conteúdo por língua (D12) e entram **só na língua de origem**
//     (português): uma tradução que falte **não** se inventa — a ficha mostra a que existe;
//   - `nomeAutores`, `nomeCoautores` e `nomaColaboradores` são nomes (não traduzem) e a ficha mostra-os
//     em três linhas rotuladas: `Autor:`, `Coautor:`, `Colaborador:`. Uma célula vazia **tira** o
//     crédito: a folha é a fonte da verdade;
//   - `endereço da obra` preenchido faz da obra uma obra `site` (D60): a ficha embute-o e a capa passa a
//     ser a imagem que fica por baixo do iframe. **Vazio tira o site**: a obra volta ao que o ficheiro
//     dela é (imagem, vídeo ou modelo) — é a única forma de desfazer, e é o que faz da folha a fonte da
//     verdade deste campo;
//   - `endereço da imagem` aponta a obra para um asset próprio (`capa-<id>`) com esse caminho, e o tipo
//     vem da extensão do ficheiro. Também aceita **um endereço** (D64): `https://…` — a capa de uma
//     obra cujo conteúdo está num site pode ser a imagem que esse site já serve. Vazio deixa a obra
//     como está; **`-` tira a capa do dado** (D65: a ficha e a sala passam a usar a cadeia — o
//     thumbnail do YouTube, depois a imagem padrão).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGES, ORIGIN_LANGUAGE } from '../../js/scene/schema.js';
import { validateScene } from '../../js/scene/validation.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');
const CHECK = process.argv.includes('--check');

// A folha por omissão é a definitiva; `--file <caminho>` serve para correr um exemplo (o
// `data/obras.exemplo.tsv`) sem tocar no que o autor está a preencher. O caminho é resolvido da raiz
// do projeto — e um caminho **absoluto** também serve, porque é o que uma pessoa cola de uma janela do
// Explorador, e um `join` com um absoluto dá um caminho impossível (`d:\…\d:\…`).
const fileArgument = process.argv.indexOf('--file');
const CSV = fileArgument > 0 && process.argv[fileArgument + 1]
  ? resolve(root, process.argv[fileArgument + 1])
  : join(root, 'data', 'obras.tsv');

// A folha é lida como **bytes** e descodificada aqui, e não com `readFileSync(…, 'utf8')` (2026-10-27):
// o Excel em português grava «Texto (separado por tabulações)» em **UTF-16LE**, e lido como UTF-8 isso
// é lixo em cada letra. O BOM diz qual é; sem BOM, é UTF-8, que é o que o Bloco de Notas e o LibreOffice
// escrevem. O BOM, quando existe, sai do texto: é transporte, não é conteúdo.
export function decodeSheet(buffer) {
  if (buffer.length >= 2 && buffer[0] === 0xFF && buffer[1] === 0xFE) {
    return { text: buffer.subarray(2).toString('utf16le'), encoding: 'UTF-16LE' };
  }
  if (buffer.length >= 2 && buffer[0] === 0xFE && buffer[1] === 0xFF) {
    const swapped = Buffer.from(buffer.subarray(2));
    swapped.swap16();
    return { text: swapped.toString('utf16le'), encoding: 'UTF-16BE' };
  }
  const text = buffer.toString('utf8');
  return { text: text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text, encoding: 'UTF-8' };
}

// As colunas do padrão novo (2026-10-27). O cabeçalho é escrito em português e legível — «nome da obra»,
// «endereço da imagem» —, e é comparado **sem acentos, sem maiúsculas e sem espaços a mais**: uma folha
// que chegue como `Endereço da imagem` ou `endereco da imagem` é a mesma coluna. O `mundo` é a primeira
// coluna e não é decorativa: os `id` **não são únicos** no projeto (o id 0 existe em quatro mundos).
const COLUMNS = [
  'mundo', 'id', 'nome da obra', 'nomeAutores', 'nomeCoautores', 'nomaColaboradores',
  'Descritivo', 'endereço da imagem', 'endereço da obra'
];

// Nomes que também são aceites para a mesma coluna (a grafia do autor, e a variante com «Colaboradores»).
const SYNONYMS = {
  'nomaColaboradores': ['nomeColaboradores'],
  'Descritivo': ['descricao', 'descrição']
};

// A forma comparável de um nome de coluna: sem acentos, sem maiúsculas, sem espaços nem underscores.
const key = (name) => String(name || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[\s_]+/g, '');

const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|avif|gif)$/i;
const VIDEO_EXTENSIONS = /\.(mp4|webm|ogg|mov)$/i;

// Uma folha com aspas: `"um texto, com vírgula"` é uma célula. É o mínimo que uma folha de cálculo
// exporta, e é o que o ficheiro promete a quem o preenche.
//
// O separador **não** está fixo (2026-10-27): a **tabulação** é o padrão — é o formato em que uma folha
// de cálculo grava «Texto separado por tabulações», e com ela **nenhum texto precisa de aspas**, porque
// nem a vírgula nem o ponto e vírgula são separadores. `;` e `,` continuam a ser lidos (compatibilidade),
// e nesses as aspas servem para um texto que tenha o próprio separador dentro de si.
export function parseCsv(text, separator) {
  const split = separator || ',';
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
    if (character === split) { row.push(cell); cell = ''; continue; }
    if (character === '\n') { row.push(cell); rows.push(row); row = []; cell = ''; continue; }
    if (character === '\r') continue;
    cell += character;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((line) => line.length > 1 || (line.length === 1 && line[0].trim() !== ''));
}

// O separador do ficheiro, lido do cabeçalho: a **tabulação** ganha sempre que exista (é o padrão, e um
// texto não tem tabulações por acidente); sem tabulações, ganha o que aparecer mais vezes (e `,` no
// empate, que é o que o Excel em inglês escreve). Um ficheiro só com `;` num texto e sem cabeçalho é
// improvável — quem escreve o cabeçalho escreve os separadores.
export function detectSeparator(text) {
  const line = text.split('\n').map((item) => item.replace(/^\uFEFF/, '')).find((item) => {
    const trimmed = item.trim();
    return trimmed !== '' && !trimmed.startsWith('#');
  }) || '';
  const tabs = (line.match(/\t/g) || []).length;
  if (tabs > 0) return '\t';
  const commas = (line.match(/,/g) || []).length;
  const semicolons = (line.match(/;/g) || []).length;
  return semicolons > commas ? ';' : ',';
}

// As linhas com conteúdo, já em objectos: os comentários e a linha de cabeçalho ficam de fora. O
// cabeçalho é procurado pela forma comparável (`key`), e uma coluna que não esteja no ficheiro vale a
// sua posição no padrão — é o que faz uma folha sem o `mundo` falhar na primeira linha em vez de
// escrever em todos os mundos.
export function readRows(text) {
  const rows = parseCsv(text, detectSeparator(text));
  const index = {};
  const lines = [];
  let seenHeader = false;
  const wanted = (name) => [name, ...(SYNONYMS[name] || [])].map(key);
  for (const row of rows) {
    const first = (row[0] || '').trim();
    if (first.startsWith('#')) continue;
    if (!seenHeader) {
      seenHeader = true;
      const header = row.map(key);
      COLUMNS.forEach((name) => {
        const match = wanted(name).map((candidate) => header.indexOf(candidate)).find((at) => at >= 0);
        index[name] = match === undefined ? -1 : match;
      });
      continue;
    }
    const value = (name) => {
      const at = index[name];
      return at >= 0 ? (row[at] || '').trim() : '';
    };
    lines.push({
      line: lines.length + 1,
      cells: row.length,
      world: value('mundo'),
      id: value('id'),
      title: value('nome da obra'),
      authors: value('nomeAutores'),
      coAuthors: value('nomeCoautores'),
      collaborators: value('nomaColaboradores'),
      synopsis: value('Descritivo'),
      cover: value('endereço da imagem'),
      site: value('endereço da obra')
    });
  }
  return lines;
}

// O texto de um campo por língua, com **só** a língua de origem: o CSV é em português (decisão de
// 2026-10-27) e é a fonte da verdade destes campos, por isso o que houver na outra língua sai.
function originText(text) {
  return text ? { [ORIGIN_LANGUAGE]: text } : null;
}

const same = (one, other) => JSON.stringify(one) === JSON.stringify(other);

// Como cada crédito se chama num relatório que o autor lê (o dado usa os nomes em inglês, como o resto).
const LABEL = { authors: 'autor', coAuthors: 'coautor', collaborators: 'colaborador' };

// Aplica uma linha a um mundo, devolvendo a lista do que mudou (para o relatório, e para um `--check`
// poder dizer o que faria sem tocar em nada).
export function applyRow(world, row, { exists }) {
  const changes = [];
  const artworks = Array.isArray(world.artworks) ? world.artworks : [];
  const artwork = artworks.find((item) => String(item.id) === String(row.id));
  if (!artwork) return { error: `obra ${row.id} não existe no mundo ${row.world}` };

  if (row.title) {
    const title = originText(row.title);
    if (!same(artwork.title, title)) {
      artwork.title = title;
      changes.push(`obra ${row.id}: título`);
    }
  }

  // Os três créditos (2026-10-27): campos **simples** no dado, porque nomes não se traduzem — quem
  // mostra as etiquetas («Autor:», «Coautor:», «Colaborador:») é a ficha, na língua da interface.
  // Uma célula vazia **tira** o crédito: o CSV é a fonte da verdade destes campos.
  for (const [field, column] of [['authors', 'authors'], ['coAuthors', 'coAuthors'], ['collaborators', 'collaborators']]) {
    const value = row[column];
    const current = artwork[field];
    if (!value) {
      if (current) {
        delete artwork[field];
        changes.push(`obra ${row.id}: sem ${LABEL[field]}`);
      }
      continue;
    }
    if (current !== value) {
      artwork[field] = value;
      changes.push(`obra ${row.id}: ${LABEL[field]}`);
    }
  }

  if (row.synopsis) {
    const synopsis = originText(row.synopsis);
    if (!same(artwork.synopsis, synopsis)) {
      artwork.synopsis = synopsis;
      changes.push(`obra ${row.id}: descritivo`);
    }
  }

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
  } else if (artwork.site) {
    // Uma célula `site` vazia **tira** o site: o CSV é a fonte da verdade deste campo (ou a obra é uma
    // página, ou não é). A obra volta ao que o ficheiro dela é — imagem, vídeo ou modelo.
    delete artwork.site;
    changes.push(`obra ${row.id}: deixa de ter site`);
    const asset = artwork.asset ? (world.assets || {})[artwork.asset] : null;
    const type = asset && asset.type ? asset.type : null;
    if (artwork.kind === 'site' && (type === 'image' || type === 'video' || type === 'model')) {
      artwork.kind = type;
      changes.push(`obra ${row.id}: volta a obra "${type}"`);
    }
  }

  if (row.cover === '-') {
    // `-` quer dizer «esta obra não tem capa no CSV»: a cadeia do D65 fica com o thumbnail do YouTube
    // (ou com a imagem padrão, se não houver site). É a forma de tirar uma capa que já estava no dado.
    const key = `capa-${row.id}`;
    if (artwork.asset === key) {
      delete artwork.asset;
      changes.push(`obra ${row.id}: deixa de ter capa no dado`);
    }
    if (world.assets && world.assets[key]) {
      delete world.assets[key];
      changes.push(`obra ${row.id}: catálogo sem "${key}"`);
    }
  } else if (row.cover) {
    const type = IMAGE_EXTENSIONS.test(row.cover) ? 'image' : (VIDEO_EXTENSIONS.test(row.cover) ? 'video' : null);
    if (!type) return { error: `obra ${row.id}: a capa "${row.cover}" não é uma imagem nem um vídeo conhecido` };
    // A capa manda no tipo de uma obra que **deixa** de ser um site nesta mesma linha: a célula `site`
    // vazia já correu acima, e o `kind` só pode ser decidido depois de se saber que ficheiro a obra
    // passa a mostrar. Era aqui que o exemplo do projeto era recusado com uma mensagem que falava de
    // um site que a própria linha acabara de tirar.
    if (artwork.site && artwork.kind === 'site' && type !== 'image') {
      return { error: `obra ${row.id}: uma obra com site tem de ter uma imagem de capa (a que fica por baixo do iframe)` };
    }
    // Uma capa remota (D64) não se pergunta ao disco: quem a serve é outro servidor.
    const remota = /^https?:\/\//i.test(row.cover);
    if (!remota && exists(row.cover) === false) {
      return { error: `obra ${row.id}: a capa "${row.cover}" não existe no projeto` };
    }
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
    // Uma obra **com** site continua a ser um "site" (a capa é a imagem por baixo do iframe); uma obra
    // sem site passa a ser o que a capa é. Era a segunda metade desta regra que faltava: o `kind` nunca
    // saía de "site", e por isso tirar o site no CSV deixava um mundo inválido.
    if (!artwork.site && artwork.kind !== type) {
      artwork.kind = type;
      changes.push(`obra ${row.id}: passa a obra "${type}"`);
    }
  }

  // Uma obra que era um site e que o CSV deixa sem site **e** sem ficheiro de capa não tem o que
  // mostrar: o `kind` ficaria "site" sem `site` e o mundo inteiro seria recusado pelo validador, com
  // uma mensagem que não diz qual é a linha do CSV. Aqui diz-se qual é, e o que falta.
  if (artwork.kind === 'site' && !artwork.site) {
    return {
      error: `obra ${row.id}: esta obra era um "site" e a linha não dá site nem uma imagem/vídeo na capa — `
        + 'diga o que ela passa a ser (uma imagem de capa) ou dê-lhe um site'
    };
  }

  return { changes };
}

function main() {
  if (!existsSync(CSV)) {
    console.error('não encontrei ' + CSV);
    process.exit(1);
  }
  const sheet = decodeSheet(readFileSync(CSV));
  const rows = readRows(sheet.text);
  const worlds = new Map();
  const problems = [];
  const touched = new Set();

  for (const row of rows) {
    if (!row.world || !row.id) { problems.push(`linha ${row.line}: falta o mundo ou o id`); continue; }
    // Uma linha com mais células do que colunas tem um separador a mais lá dentro — o caso clássico é
    // uma descrição com vírgula numa folha separada por vírgulas. Dizer isto é melhor do que deixar os
    // campos escorregar uma coluna e falhar «obra tal não existe».
    if (row.cells > COLUMNS.length) {
      problems.push(`linha ${row.line}: ${row.cells} células para ${COLUMNS.length} colunas — `
        + 'há um separador dentro de um texto (use aspas nesse texto, ou grave a folha '
        + 'com tabulações a separar)');
      continue;
    }
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
    console.log('a folha não muda nada: o dado já diz o mesmo');
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
