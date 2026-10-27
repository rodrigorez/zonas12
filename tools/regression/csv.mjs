// O importador da folha (D62/C10), no padrão novo de 2026-10-27 (D67): colunas em português, os três
// créditos em campos próprios e **tabulações** a separar — sem aspas em sítio nenhum.
//
// Porque existe: o autor traz folhas novas, e a única proteção entre uma folha e o dado de produção é o
// importador a recusar. Enquanto isto não fosse medido, a proteção era uma promessa — o primeiro
// `--check` que corri com a folha de exemplo foi **recusado** por um defeito real (uma obra que era um
// "site" e cuja linha tirava o site ficava com `kind: "site"` sem `site`).
//
// O separador é lido do cabeçalho: **tabulação** (o padrão — o que uma folha de cálculo grava como
// «Texto separado por tabulações», e um formato em que nenhum texto português tem o separador dentro de
// si), depois `;` e `,` (compatibilidade). Com `,` uma vírgula dentro de um texto **desloca as colunas
// em silêncio** — não há forma de o detetar, porque a linha fica com o número certo de células; é essa a
// razão de a folha do projeto ter deixado de ser CSV.
//
// E o ficheiro é lido como **bytes**: o Excel em português grava «Texto separado por tabulações» em
// UTF-16LE com BOM, e lido como UTF-8 isso é lixo em cada letra acentuada. O BOM decide a codificação.
//
// O que se mede:
//
//   1. a folha de produção está em dia: `--check` diz «a folha não muda nada» e sai com **0**;
//   2. uma folha que muda texto sai com **1** e lista o que mudaria (é o contrato do `--check`);
//   3. os **três créditos** são campos separados, e uma célula vazia **tira** o crédito;
//   4. a folha separada por tabulação aceita **vírgulas e pontos e vírgulas** em todos os campos, sem
//      aspas — e um `;` solto não é recusado (era o caso do CSV com `;`);
//   4b. o único separador que não pode estar num texto é a **tabulação**: essa linha é recusada (com
//       células a mais), e entre aspas passa a ser texto;
//   5. as folhas antigas continuam a ser lidas: `;` sem aspas e `,` com aspas (e as aspas nunca chegam
//      ao dado);
//   5b. um ficheiro UTF-16LE (Excel) e um UTF-8 com BOM são descodificados — acentos incluídos;
//   6. o cabeçalho é lido mesmo com acentos, maiúsculas ou outro espaçamento (`Endereço da imagem`);
//   7. tirar o site **com** uma imagem de capa devolve a obra a imagem; **sem** ficheiro nenhum é recusado;
//   8. um site sem `http(s)`, uma capa que não existe e uma capa que não é imagem nem vídeo: recusa;
//   9. em nenhum dos casos o `data/worlds/` é tocado.
//
// Uso, da raiz do projeto: node tools/regression/csv.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, checks } from './harness.mjs';
import { readRows, decodeSheet } from '../artwork/from-csv.mjs';

const TEMP = join(ROOT, '.harness', 'csv-selftest');
const CABECALHO = [
  'mundo', 'id', 'nome da obra', 'nomeAutores', 'nomeCoautores', 'nomaColaboradores', 'Descritivo',
  'endereço da imagem', 'endereço da obra'
];

// Corre o importador e devolve o código de saída e tudo o que ele escreveu. Nunca lança: um código 1 é
// uma resposta, não uma falha do teste.
function run(args) {
  try {
    const output = execFileSync(process.execPath, [join(ROOT, 'tools', 'artwork', 'from-csv.mjs'), ...args], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { code: 0, output };
  } catch (error) {
    return { code: error.status === undefined ? -1 : error.status, output: String(error.stdout || '') + String(error.stderr || '') };
  }
}

// Uma folha separada por tabulações (o padrão). `header` pode ser uma lista de nomes, para medir a
// tolerância do cabeçalho.
function sheet(name, rows, header) {
  const text = [header || CABECALHO, ...rows].map((row) => row.join('\t')).join('\n') + '\n';
  const path = join(TEMP, name);
  writeFileSync(path, text, 'utf8');
  return path;
}

// Um ficheiro escrito à mão, letra a letra: é assim que se mede um separador antigo, aspas, ou um BOM.
function raw(name, text, encoding) {
  const path = join(TEMP, name);
  const bytes = Buffer.from(text, encoding === 'utf16le' ? 'utf16le' : 'utf8');
  writeFileSync(path, encoding === 'utf16le'
    ? Buffer.concat([Buffer.from([0xFF, 0xFE]), bytes])
    : encoding === 'utf8-bom' ? Buffer.concat([Buffer.from([0xEF, 0xBB, 0xBF]), bytes]) : bytes);
  return path;
}

// A primeira linha com conteúdo, já em campos — para medir o que o importador leu, e não só o que ele diz.
function firstRow(path) {
  return readRows(decodeSheet(readFileSync(path)).text)[0];
}

// A impressão digital de `data/worlds/`: se ela mudar num `--check`, nada mais interessa.
function worldsFingerprint() {
  const dir = join(ROOT, 'data', 'worlds');
  return readdirSync(dir).sort().map((file) => file + ':' + readFileSync(join(dir, file), 'utf8').length).join('|');
}

function main() {
  const check = checks();
  if (existsSync(TEMP)) rmSync(TEMP, { recursive: true, force: true });
  mkdirSync(TEMP, { recursive: true });

  // ---- 1. a folha de produção está em dia ----
  const antes = worldsFingerprint();
  const atual = run(['--check']);
  check.check('a folha de produção está em dia: `--check` não muda nada e sai com 0',
    atual.code === 0 && /a folha não muda nada/.test(atual.output), JSON.stringify(atual).slice(0, 200));

  // ---- 2 e 3. os três créditos, e o que uma célula vazia faz ----
  const creditos = sheet('creditos.tsv', [[
    'scene1', '1', 'Um título novo', 'Fulano, Beltrana', 'Sicrana', 'Beltrano, Ciclano',
    'Uma descrição nova.', 'assets/artworks/eiffel.jpg', ''
  ]]);
  const mudou = run(['--file', creditos, '--check']);
  check.check('uma folha que muda texto sai com 1 e lista o que mudaria',
    mudou.code === 1 && /obra 1: título/.test(mudou.output) && /obra 1: descritivo/.test(mudou.output),
    mudou.output.trim().split('\n').slice(-3).join(' | '));
  check.check('os três créditos são campos separados (autor, coautor, colaborador)',
    /obra 1: autor/.test(mudou.output) && /obra 1: coautor/.test(mudou.output) && /obra 1: colaborador/.test(mudou.output),
    mudou.output.trim().split('\n').filter((l) => /autor|colaborador/.test(l)).join(' | '));

  const semCreditos = sheet('sem-creditos.tsv', [[
    'scene2', '6', 'A torre, na praia', '', '', 'Texto provisório: uma descrição sem créditos.',
    'assets/artworks/eiffel.jpg', ''
  ]]);
  const limpou = run(['--file', semCreditos, '--check']);
  check.check('uma célula de crédito vazia tira esse crédito do dado',
    /obra 6: sem autor/.test(limpou.output) && /obra 6: sem coautor/.test(limpou.output),
    limpou.output.trim().split('\n').filter((l) => /sem /.test(l)).join(' | '));

  // ---- 4. a folha com tabulações aceita vírgulas **e** pontos e vírgulas, sem aspas ----
  const semAspas = sheet('sem-aspas.tsv', [[
    'scene1', '1', 'Uma torre, ao longe', 'Fulano, Beltrana', 'Sicrana, Beltrano', 'Beltrano, Ciclano',
    'Uma obra feita em 2026; na cidade, ao longe — tudo texto, sem aspas.', 'assets/artworks/eiffel.jpg', ''
  ]]);
  const simples = run(['--file', semAspas, '--check']);
  check.check('uma folha separada por tabulação e sem aspas é lida, com vírgulas e `;` no texto',
    simples.code === 1 && /obra 1: título/.test(simples.output) && /obra 1: autor/.test(simples.output) &&
      /obra 1: descritivo/.test(simples.output) && !/células para/.test(simples.output),
    simples.output.trim().split('\n').filter((l) => /obra 1:/.test(l)).join(' | '));

  const valores = firstRow(semAspas);
  check.check('as aspas nunca chegam ao dado: o autor fica "Fulano, Beltrana", o título fica com a sua vírgula',
    valores.authors === 'Fulano, Beltrana' && valores.title === 'Uma torre, ao longe' &&
      valores.synopsis === 'Uma obra feita em 2026; na cidade, ao longe — tudo texto, sem aspas.' &&
      valores.cells === 9,
    JSON.stringify({ autores: valores.authors, titulo: valores.title, celulas: valores.cells }));

  // ---- 4b. o único separador que não pode estar num texto é a tabulação ----
  const comTab = raw('com-tab.tsv', [
    CABECALHO.join('\t'),
    ['scene1', '1', 'Cidade', 'Fulano', 'Beltrana', '', 'Uma obra\tcom tabulação.', 'assets/artworks/eiffel.jpg', ''].join('\t')
  ].join('\n') + '\n');
  const recusado = run(['--file', comTab, '--check']);
  check.check('uma tabulação a solto dentro de um texto é recusada (a linha fica com células a mais)',
    recusado.code === 1 && /células para 9 colunas/.test(recusado.output) && /aspas/.test(recusado.output),
    recusado.output.trim().split('\n').slice(-2).join(' | '));

  const protegido = raw('com-tab-aspas.tsv', [
    CABECALHO.join('\t'),
    ['scene1', '1', 'Cidade', 'Fulano', 'Beltrana', '', '"Uma obra\tcom tabulação."', 'assets/artworks/eiffel.jpg', ''].join('\t')
  ].join('\n') + '\n');
  const dentro = firstRow(protegido);
  check.check('entre aspas, a tabulação fica texto — e não chega ao dado',
    dentro.synopsis === 'Uma obra\tcom tabulação.' && dentro.cells === 9,
    JSON.stringify({ sinopse: dentro.synopsis, celulas: dentro.cells }));

  // ---- 5. as folhas antigas continuam a ser lidas: `;` sem aspas e `,` com aspas ----
  const comVirgulas = raw('ponto-virgula.csv', [
    'mundo;id;nome da obra;nomeAutores;nomeCoautores;nomaColaboradores;Descritivo;endereço da imagem;endereço da obra',
    'scene1;1;Uma torre, ao longe;Fulano, Beltrana;;;Uma obra feita em 2026; na cidade precisa de aspas.;assets/artworks/eiffel.jpg;'
  ].join('\n') + '\n');
  const antigo = run(['--file', comVirgulas, '--check']);
  check.check('uma folha antiga com `;` continua a ser lida (e o `;` a solto continua a ser recusado)',
    antigo.code === 1 && /células para 9 colunas/.test(antigo.output),
    antigo.output.trim().split('\n').slice(-2).join(' | '));

  // ---- 5. a folha com `,` e aspas continua a ser lida (compatibilidade) ----
  const comAspas = raw('com-aspas.csv', [
    'mundo,id,nome da obra,nomeAutores,nomeCoautores,nomaColaboradores,Descritivo,endereço da imagem,endereço da obra',
    'scene1,1,"Título, com vírgula","Um, Dois",,,"Descrição, com vírgula.",assets/artworks/eiffel.jpg,'
  ].join('\n') + '\n');
  const compat = run(['--file', comAspas, '--check']);
  check.check('uma folha separada por `,` com aspas continua a ser lida (e as aspas saem do valor)',
    compat.code === 1 && /obra 1: autor/.test(compat.output) && firstRow(comAspas).authors === 'Um, Dois',
    compat.output.trim().split('\n').filter((l) => /obra 1:/.test(l)).join(' | '));

  // ---- 5b. a codificação: o Excel grava UTF-16, o Notepad às vezes põe BOM ----
  const linhaExcel = [
    'scene1', '1', 'A torre, ao entardecer', 'Fulano, Beltrana', 'Sicrana', '',
    'Sinopse com acentos: ação, coração, ãõ — e uma vírgula.', 'assets/artworks/eiffel.jpg', ''
  ];
  const excel = raw('excel-utf16.tsv', [CABECALHO.join('\t'), linhaExcel.join('\t')].join('\r\n') + '\r\n', 'utf16le');
  const doExcel = run(['--file', excel, '--check']);
  const lidoExcel = firstRow(excel);
  check.check('um ficheiro UTF-16LE (o «Texto separado por tabulações» do Excel) é lido com os acentos certos',
    doExcel.code === 1 && lidoExcel.title === 'A torre, ao entardecer' &&
      lidoExcel.synopsis === 'Sinopse com acentos: ação, coração, ãõ — e uma vírgula.' &&
      decodeSheet(readFileSync(excel)).encoding === 'UTF-16LE',
    JSON.stringify({ encoding: decodeSheet(readFileSync(excel)).encoding, sinopse: lidoExcel.synopsis }));

  const comBom = raw('utf8-bom.tsv', [CABECALHO.join('\t'), linhaExcel.join('\t')].join('\n') + '\n', 'utf8-bom');
  const doBom = run(['--file', comBom, '--check']);
  check.check('um ficheiro UTF-8 com BOM é lido (o BOM não entra no primeiro nome de coluna)',
    doBom.code === 1 && firstRow(comBom).title === 'A torre, ao entardecer' &&
      firstRow(comBom).world === 'scene1' && !/falta o mundo/.test(doBom.output),
    doBom.output.trim().split('\n').slice(-2).join(' | '));

  // ---- 6. o cabeçalho é comparado sem acentos, sem maiúsculas e sem espaços a mais ----
  const outroCabecalho = [
    'Mundo', 'ID', 'Nome da Obra', 'NOME AUTORES', 'nome coautores', 'noma colaboradores', 'descritivo',
    'Endereço da Imagem', 'endereço da obra'
  ];
  const folgado = sheet('cabecalho.tsv', [[
    'scene1', '1', 'T', 'A', '', '', 'Descrição.', 'assets/artworks/eiffel.jpg', ''
  ]], outroCabecalho);
  const tolerante = run(['--file', folgado, '--check']);
  check.check('o cabeçalho é lido mesmo com acentos, maiúsculas e espaços diferentes',
    tolerante.code === 1 && /obra 1: título/.test(tolerante.output) && /obra 1: descritivo/.test(tolerante.output) &&
      !/não existe no mundo/.test(tolerante.output),
    tolerante.output.trim().split('\n').slice(-2).join(' | '));

  // ---- 7. o site sai, com e sem imagem ----
  const semSite = sheet('sem-site.tsv', [[
    'scene1', '2', 'Vídeo de teste', 'autorB', 'autorC', '', 'Passa a imagem.', 'assets/artworks/eiffel.jpg', ''
  ]]);
  const tirou = run(['--file', semSite, '--check']);
  check.check('tirar o site com uma imagem de capa: a obra volta a ser imagem, sem erro',
    tirou.code === 1 && /obra 2: deixa de ter site/.test(tirou.output) &&
      /obra 2: (passa|volta) a obra "image"/.test(tirou.output) && !/ficaria inválido/.test(tirou.output),
    tirou.output.trim().split('\n').filter((l) => /obra 2:/.test(l)).join(' | '));

  const semNada = sheet('sem-nada.tsv', [[
    'scene1', '2', 'Vídeo de teste', 'autorB', 'autorC', '', 'Sem site e sem capa.', '-', ''
  ]]);
  const vazio = run(['--file', semNada, '--check']);
  check.check('tirar o site sem dar ficheiro: recusa, e a mensagem nomeia a linha e o que falta',
    vazio.code === 1 && /obra 2: esta obra era um "site"/.test(vazio.output) && /diga o que ela passa a ser/.test(vazio.output),
    vazio.output.trim().split('\n').filter((l) => /obra 2:/.test(l)).join(' | '));

  // ---- 8. as três recusas de sempre ----
  const siteMau = sheet('site-mau.tsv', [[
    'scene1', '0', 'T', 'A', '', '', 'Descrição.', 'assets/artworks/eiffel.jpg', 'www.teste.nada'
  ]]);
  const semHttp = run(['--file', siteMau, '--check']);
  check.check('um site que não começa por http(s) é recusado',
    semHttp.code === 1 && /não é um endereço http\(s\)/.test(semHttp.output),
    semHttp.output.trim().split('\n').pop());

  const capaMa = sheet('capa-ma.tsv', [[
    'scene1', '1', 'T', 'A', '', '', 'Descrição.', 'assets/nao-existe.jpg', ''
  ]]);
  const semFicheiro = run(['--file', capaMa, '--check']);
  check.check('uma capa que não existe no projeto é recusada',
    semFicheiro.code === 1 && /não existe no projeto/.test(semFicheiro.output),
    semFicheiro.output.trim().split('\n').pop());

  const capaEstranha = sheet('capa-estranha.tsv', [[
    'scene1', '1', 'T', 'A', '', '', 'Descrição.', 'assets/artworks/eiffel.txt', ''
  ]]);
  const tipoMau = run(['--file', capaEstranha, '--check']);
  check.check('uma capa que não é imagem nem vídeo é recusada',
    tipoMau.code === 1 && /não é uma imagem nem um vídeo conhecido/.test(tipoMau.output),
    tipoMau.output.trim().split('\n').pop());

  // ---- 8b. uma capa remota **sem extensão** é uma imagem (as do Google Drive) ----
  const capaDrive = sheet('capa-drive.tsv', [[
    'scene1', '1', 'T', 'A', '', '', 'Descrição.',
    'https://lh3.googleusercontent.com/d/1dLxHwUJdFCyzI0DKNLij2E5eIn5YJKTx', ''
  ]]);
  const drive = run(['--file', capaDrive, '--check']);
  check.check('uma capa remota sem extensão (Drive) é aceite e entra como imagem',
    drive.code === 1 && /obra 1: capa \(https:\/\/lh3\.googleusercontent\.com\/d\//.test(drive.output) &&
      !/não é uma imagem nem um vídeo/.test(drive.output),
    drive.output.trim().split('\n').filter((l) => /obra 1:/.test(l)).join(' | '));

  const caminhoSemExtensao = sheet('caminho-sem-extensao.tsv', [[
    'scene1', '1', 'T', 'A', '', '', 'Descrição.', 'assets/artworks/eiffel', ''
  ]]);
  const semExtensao = run(['--file', caminhoSemExtensao, '--check']);
  check.check('um caminho do projeto sem extensão continua a ser recusado (aí o ficheiro sabe-se)',
    semExtensao.code === 1 && /não é uma imagem nem um vídeo conhecido/.test(semExtensao.output),
    semExtensao.output.trim().split('\n').pop());

  // ---- 9. nada disto tocou no dado ----
  const depois = worldsFingerprint();
  check.check('nenhum `--check` tocou em `data/worlds/` (uma folha errada não estraga o dado)',
    depois === antes, depois === antes ? 'igual' : 'OS MUNDOS MUDARAM');

  rmSync(TEMP, { recursive: true, force: true });
  check.report('o importador da folha');
  process.exit(check.list.some((item) => !item.ok) ? 1 : 0);
}

main();
