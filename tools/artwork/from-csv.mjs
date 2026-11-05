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
//     vem da extensão do ficheiro; **um endereço remoto sem extensão é uma imagem** (as capas do Google
//     Drive servem-se de `https://lh3.googleusercontent.com/d/<ID>`, que não tem `.jpg` nenhum). Também
//     aceita **um endereço** (D64): `https://…` — a capa de uma obra cujo conteúdo está num site pode ser
//     a imagem que esse site já serve. Vazio deixa a obra
//     como está; **`-` tira a capa do dado** (D65: a ficha e a sala passam a usar a cadeia — o
//     thumbnail do YouTube, depois a imagem padrão).
import { readFileSync, existsSync } from 'node:fs';
import { writeJson } from '../coordination/atomic.mjs';
import { oficina } from '../coordination/locks.mjs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGUAGES, ORIGIN_LANGUAGE } from '../../js/scene/schema.js';
import { validateScene } from '../../js/scene/validation.js';
import { assignRing, measureRing } from '../../js/scene/ring.js';

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

// O cabeçalho de uma linha, pelas formas comparáveis dos nomes das colunas (D62). Uma coluna que não
// esteja no ficheiro fica a `-1` — é o que faz uma folha sem o `mundo` falhar na primeira linha em vez
// de escrever em todos os mundos.
function mapaDoCabecalho(row) {
  const header = row.map(key);
  const index = {};
  for (const name of COLUMNS) {
    const candidatos = [name, ...(SYNONYMS[name] || [])].map(key);
    const encontrado = candidatos.map((cada) => header.indexOf(cada)).find((at) => at >= 0);
    index[name] = encontrado === undefined ? -1 : encontrado;
  }
  return index;
}

// Que colunas do padrão a folha **não** tem. Existe por causa da folha que o autor manda: ela nasce
// numa folha de cálculo sem a coluna `mundo` (a sala é uma só, e o autor não tem por que a repetir em
// todas as linhas), e o erro que dava — «falta o mundo ou o id» — não dizia qual das duas coisas era.
export function colunasEmFalta(text) {
  for (const row of parseCsv(text, detectSeparator(text))) {
    if ((row[0] || '').trim().startsWith('#')) continue;
    const index = mapaDoCabecalho(row);
    return COLUMNS.filter((name) => index[name] < 0);
  }
  return COLUMNS.slice();
}

// As linhas com conteúdo, já em objectos: os comentários e a linha de cabeçalho ficam de fora.
export function readRows(text) {
  const rows = parseCsv(text, detectSeparator(text));
  const index = {};
  const lines = [];
  let seenHeader = false;
  for (const row of rows) {
    const first = (row[0] || '').trim();
    if (first.startsWith('#')) continue;
    if (!seenHeader) {
      seenHeader = true;
      Object.assign(index, mapaDoCabecalho(row));
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
// A **criação** de uma obra que ainda não existe (D106). Um sala acabada de nascer tem `artworks: []`,
// e a folha só sabia preencher. A forma é a canónica das 55 obras `site` do projeto — dimensão 0,
// `kind` que a linha decide depois, `capa-<id>`, 4 × 3, e `interaction: page` (a obra abre numa página;
// é o que todas as obras do projeto têm). A posição nasce no centro e é posta no anel a seguir: um
// mundo com uma obra em [0, 1.5, 0] seria recusado pela L22.
function novaObra(row) {
  const id = Number(row.id);
  return {
    id,
    dimension: 0,
    kind: 'image',
    asset: 'capa-' + id,
    position: [0, 1.5, 0],
    rotation: [0, 0, 0],
    size: [4, 3, 0.1],
    interaction: 'page'
  };
}

export function applyRow(world, row, { exists, criar = false }) {
  const changes = [];
  const artworks = Array.isArray(world.artworks) ? world.artworks : (world.artworks = []);
  let artwork = artworks.find((item) => String(item.id) === String(row.id));
  if (!artwork) {
    if (!criar) return { error: `obra ${row.id} não existe no mundo ${row.world}` };
    artwork = novaObra(row);
    artworks.push(artwork);
    artworks.sort((a, b) => Number(a.id) - Number(b.id));
    changes.push(`obra ${row.id}: criada`);
  }

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
    // O site de uma obra do Drive é `/file/d/<ID>/preview`, e não `/view` (D62): o `/view` é a **página**
    // do Drive, que se recusa a ser embutida, e a ficha mostra a obra num iframe. As 18 obras do projeto
    // que vivem no Drive usam `preview`; converter aqui é o que faz a diferença entre «a obra abre» e
    // «o iframe fica em branco».
    const site = (() => {
      const drive = /^https?:\/\/(?:drive|docs)\.google\.com\/file\/d\/([A-Za-z0-9_-]+)(?:\/[^?#]*)?/.exec(row.site);
      return drive ? 'https://drive.google.com/file/d/' + drive[1] + '/preview' : row.site;
    })();
    if (site !== row.site) changes.push(`obra ${row.id}: site do Drive convertido para ${site}`);
    if (artwork.site !== site) {
      artwork.site = site;
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
    // O autor cola o endereço que o Drive lhe dá — `…/file/d/<ID>/view?usp=…` —, e esse é uma **página**,
    // não uma imagem: num `<img>` não carrega. O endereço directo do mesmo ficheiro é o
    // `lh3.googleusercontent.com/d/<ID>`, e é esse que o dado guarda (D106). Converter aqui, em vez de
    // pedir ao autor, é a diferença entre «a capa aparece» e «a capa aparece em branco».
    const capa = (() => {
      const drive = /^https?:\/\/(?:drive|docs)\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/.exec(row.cover);
      return drive ? 'https://lh3.googleusercontent.com/d/' + drive[1] : row.cover;
    })();
    if (capa !== row.cover) changes.push(`obra ${row.id}: endereço do Drive convertido para ${capa}`);
    const remota = /^https?:\/\//i.test(capa);
    // A extensão decide o tipo; **um endereço remoto sem extensão é uma imagem** (2026-10-27). É o caso
    // das capas no Google Drive, que se servem do endereço directo `https://lh3.googleusercontent.com/d/<ID>`
    // — uma imagem sem `.jpg` nenhum no caminho. Recusá-la obrigava o autor a alojar as capas noutro
    // sítio por causa de um nome; um caminho do projeto sem extensão continua a ser recusado, porque aí
    // o ficheiro existe (ou não) e sabe-se o que é.
    const type = IMAGE_EXTENSIONS.test(capa) ? 'image'
      : VIDEO_EXTENSIONS.test(capa) ? 'video'
        : (remota ? 'image' : null);
    if (!type) return { error: `obra ${row.id}: a capa "${row.cover}" não é uma imagem nem um vídeo conhecido` };
    // A capa manda no tipo de uma obra que **deixa** de ser um site nesta mesma linha: a célula `site`
    // vazia já correu acima, e o `kind` só pode ser decidido depois de se saber que ficheiro a obra
    // passa a mostrar. Era aqui que o exemplo do projeto era recusado com uma mensagem que falava de
    // um site que a própria linha acabara de tirar.
    if (artwork.site && artwork.kind === 'site' && type !== 'image') {
      return { error: `obra ${row.id}: uma obra com site tem de ter uma imagem de capa (a que fica por baixo do iframe)` };
    }
    // Uma capa remota (D64) não se pergunta ao disco: quem a serve é outro servidor.
    if (!remota && exists(capa) === false) {
      return { error: `obra ${row.id}: a capa "${capa}" não existe no projeto` };
    }
    // A capa que já é a da obra não é uma mudança: é o CSV a dizer o que o dado já diz, e reescrever
    // o catálogo por causa disso daria um asset novo em cada corrida.
    world.assets = world.assets || {};
    const current = artwork.asset ? world.assets[artwork.asset] : null;
    if (!(current && current.path === capa && current.type === type)) {
      const key = `capa-${row.id}`;
      const previous = world.assets[key];
      const titulo = artwork.title && artwork.title[ORIGIN_LANGUAGE];
      const entry = {
        path: capa,
        type,
        alt: (previous && previous.alt) ||
          { [ORIGIN_LANGUAGE]: 'Capa da obra ' + (titulo || row.id) }
      };
      if (!same(previous, entry)) {
        world.assets[key] = entry;
        changes.push(`obra ${row.id}: capa (${capa})`);
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

  // Uma obra que era um site e que a folha deixa sem site **e** sem ficheiro de capa não tem o que
  // mostrar: o `kind` ficaria "site" (ou "image") sem `site` nem `asset` e o mundo inteiro seria
  // recusado pelo validador, com uma mensagem que não diz qual é a linha da folha. Aqui diz-se qual é,
  // e o que falta. O caso do `-` na capa chega aqui com o `kind` já mudado para o da capa que saiu —
  // por isso a pergunta é «ficou com algo para mostrar?», e não «ainda diz site?».
  if (!artwork.site && !artwork.asset) {
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
  const faltam = colunasEmFalta(sheet.text);
  // A folha do autor não tem a coluna `mundo` — a sala vem de fora, do chat. `--mundo` diz qual é, e é
  // isso que faz o formato do autor entrar sem ser editado à mão.
  const mundoPedido = (() => {
    const indice = process.argv.indexOf('--mundo');
    return indice > 0 && process.argv[indice + 1] && !process.argv[indice + 1].startsWith('--')
      ? String(process.argv[indice + 1]).trim()
      : null;
  })();
  const criar = process.argv.includes('--criar');
  if (faltam.includes('mundo')) {
    if (!mundoPedido) {
      console.error('nada foi escrito:');
      console.error('  a folha não tem a coluna "mundo" — diga de que sala é com --mundo <slug>');
      console.error('  (ex.: node tools/artwork/from-csv.mjs --file folha.tsv --mundo scene14 --check)');
      process.exit(1);
    }
    for (const row of rows) row.world = mundoPedido;
  } else if (mundoPedido) {
    const outras = rows.filter((row) => row.world && row.world !== mundoPedido);
    if (outras.length > 0) {
      console.error('nada foi escrito:');
      console.error(`  --mundo ${mundoPedido} contradiz a folha, que fala de ` +
        `${[...new Set(outras.map((row) => row.world))].join(', ')}`);
      process.exit(1);
    }
  }
  const worlds = new Map();
  // O que já estava vermelho em cada mundo **antes** de a folha lhe tocar. A folha recusa-se a
  // **introduzir** uma violação, e não a escrever num mundo que já tinha uma: com os retratos em falta
  // (L9), qualquer gravação era recusada — e os retratos são imagens da sala, por isso têm de vir
  // **depois** das obras, não antes. Sem esta linha de base, o ciclo fechava-se.
  const baseline = new Map();
  const problems = [];
  const touched = new Set();
  // Mundos com uma linha em erro ficam marcados: uma linha que já mutou o objecto antes de desistir
  // deixaria o validador a falar de uma consequência em vez da causa, e a causa já está dita.
  const comErro = new Set();

  for (const row of rows) {
    if (!row.world || !row.id) {
      // A folha do autor chega sem o `mundo` (a sala é uma só, e não se repete a coluna em cada linha).
      // Dizer «falta o mundo» é dizer o que fazer; «falta o mundo ou o id» obrigava a adivinhar.
      problems.push(faltam.includes('mundo')
        ? `linha ${row.line}: falta a coluna "mundo" — acrescente-a como PRIMEIRA coluna, com o slug ` +
          `da sala em todas as linhas (a folha do autor costuma começar no "id")`
        : faltam.includes('id')
          ? `linha ${row.line}: falta a coluna "id" — é o número da obra no editor (0, 1, 2…)`
          : `linha ${row.line}: falta o mundo ou o id`);
      continue;
    }
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
    if (!worlds.has(row.world)) {
      const cena = JSON.parse(readFileSync(file, 'utf8'));
      worlds.set(row.world, cena);
      baseline.set(row.world,
        new Set(validateScene(cena, { exists: (path) => existsSync(join(root, path)) }).errors));
    }
    const result = applyRow(worlds.get(row.world), row, { exists: (path) => existsSync(join(root, path)), criar });
    if (result.error) {
      comErro.add(row.world);
      // Uma obra que não existe é o caso da sala nova: dizer o que fazer vale mais do que o nome da
      // falta. Sem `--criar`, o agente não sabe que a ferramenta a pode criar.
      problems.push(`linha ${row.line}: ${result.error}` +
        (criar ? '' : ' — use --criar para a criar (a sala nova nasce sem obras)'));
    } else if (result.changes.length) {
      touched.add(row.world);
      for (const change of result.changes) console.log('  ' + change);
    }
  }

  // Uma obra criada nasce no centro da sala, e o anel é que a senta (L22) — como as portas. Fazer isto
  // aqui, antes de validar, é o que faz «criar as obras» ser **um** passo e não dois: sem ele o
  // validador recusaria o mundo que a folha acabou de escrever.
  for (const [slug, world] of worlds) {
    if (comErro.has(slug) || !touched.has(slug)) continue;
    const moved = assignRing(world, measureRing(world));
    if (moved > 0) console.log(`  ${slug}: ${moved} objeto(s) postos no anel`);
  }

  // O dado que sai daqui tem de passar as mesmas leis que o resto: escrever primeiro e validar depois
  // seria gravar um mundo que a exposição recusa. Mas só contam as violações **novas** — as que já lá
  // estavam (a L9 dos retratos, enquanto não forem cozinhados) não são desta linha.
  for (const [slug, world] of worlds) {
    if (comErro.has(slug)) continue;
    const report = validateScene(world, { exists: (path) => existsSync(join(root, path)) });
    const antes = baseline.get(slug) || new Set();
    const novas = report.errors.filter((error) => !antes.has(error));
    if (novas.length > 0) {
      problems.push(`o mundo ${slug} ficaria inválido:`);
      for (const error of novas) problems.push('  ' + error);
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
    // A oficina (D96, M1): a folha escreve nos mesmos mundos que o `new-room` e as derivadas.
    oficina('a folha das obras (from-csv)', () => {
      writeJson(join(root, 'data', 'worlds', slug + '.json'), worlds.get(slug));
    });
    console.log('escrito data/worlds/' + slug + '.json');
  }
}

const entry = process.argv[1] ? fileURLToPath(import.meta.url) === join(process.argv[1]) : false;
if (entry) main();
