// O importador do CSV (D62/C10): o que ele aceita, o que recusa, e — o mais importante — que um
// `--check` **não escreve nada** e que uma folha errada não estraga o dado.
//
// Porque existe: o autor vai trazer folhas novas, e a única proteção entre uma folha e o dado de
// produção é o importador a recusar. Enquanto isto não fosse medido, a proteção era uma promessa: o
// primeiro `--check` que corri com a folha de exemplo do projeto foi **recusado** por um defeito real
// — uma obra que era um "site" e cuja linha tirava o site ficava com `kind: "site"` sem `site`, e o
// mundo inteiro era recusado com uma mensagem que não dizia qual era a linha (ver `applyRow`).
//
// O que se mede:
//
//   1. a folha de produção está em dia: `--check` diz «o CSV não muda nada» e sai com **0**;
//   2. uma folha que muda texto sai com **1** e lista o que mudaria (é o contrato do `--check`);
//   3. tirar o site **com** uma imagem de capa: a obra volta a ser imagem, e o mundo fica válido;
//   4. tirar o site **sem** dar ficheiro nenhum: recusa, e a mensagem nomeia a linha e o que falta;
//   5. um site sem `http(s)`, uma capa que não existe e uma capa que não é imagem nem vídeo: recusa;
//   6. um texto com vírgula dentro de aspas continua a ser **uma** célula;
//   7. em nenhum dos casos o `data/worlds/` é tocado.
//
// Uso, da raiz do projeto: node tools/regression/csv.mjs
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, checks } from './harness.mjs';

const TEMP = join(ROOT, '.harness', 'csv-selftest');
const CABECALHO = 'mundo,id,titulo_pt,titulo_en,autor,sinopse_pt,sinopse_en,site,capa';

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

function sheet(name, lines) {
  const path = join(TEMP, name);
  writeFileSync(path, [CABECALHO, ...lines].join('\n') + '\n', 'utf8');
  return path;
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
    atual.code === 0 && /o CSV não muda nada/.test(atual.output), JSON.stringify(atual).slice(0, 200));

  // ---- 2. uma folha que muda texto: código 1 e a lista ----
  const texto = sheet('texto.csv', [
    'scene1,0,"Um título novo","A new title","Fulano, Beltrana","Uma sinopse nova.","A new synopsis.",,assets/artworks/cidade-d0-bryan-goff.jpg'
  ]);
  const mudanca = run(['--file', texto, '--check']);
  check.check('uma folha que muda texto sai com 1 e lista o que mudaria (é o contrato do `--check`)',
    mudanca.code === 1 && /obra 0: título/.test(mudanca.output) && /obra 0: autor/.test(mudanca.output),
    mudanca.output.trim().split('\n').slice(-3).join(' | '));

  // ---- 6 (o mesmo caso): a vírgula dentro das aspas é uma só célula ----
  check.check('um autor com vírgula dentro de aspas conta como um autor só',
    /obra 0: autor/.test(mudanca.output) && !/linha \d+: .*colunas/.test(mudanca.output),
    mudanca.output.trim().split('\n').filter((l) => /autor/.test(l)).join(' | '));

  // ---- 3. tirar o site **com** uma imagem de capa ----
  const semSite = sheet('sem-site.csv', [
    'scene1,2,"Vídeo de teste","Test video","autorB","Passa a imagem.","Becomes an image.",,assets/artworks/eiffel.jpg'
  ]);
  const tirou = run(['--file', semSite, '--check']);
  check.check('tirar o site com uma imagem de capa: a obra volta a ser imagem, sem erro',
    tirou.code === 1 && /obra 2: deixa de ter site/.test(tirou.output) &&
      /obra 2: passa a obra "image"/.test(tirou.output) && !/ficaria inválido/.test(tirou.output),
    tirou.output.trim().split('\n').filter((l) => /obra 2:/.test(l)).join(' | '));

  // ---- 4. tirar o site **sem** dar ficheiro nenhum ----
  const semNada = sheet('sem-nada.csv', [
    'scene1,2,"Vídeo de teste","Test video","autorB","Sem site e sem capa.","No site, no cover.",,-'
  ]);
  const vazio = run(['--file', semNada, '--check']);
  check.check('tirar o site sem dar ficheiro: recusa, e a mensagem nomeia a linha e o que falta',
    vazio.code === 1 && /obra 2: esta obra era um "site"/.test(vazio.output) && /diga o que ela passa a ser/.test(vazio.output),
    vazio.output.trim().split('\n').filter((l) => /obra 2:/.test(l)).join(' | '));

  // ---- 5. as três recusas de sempre ----
  const siteMau = sheet('site-mau.csv', [
    'scene1,0,"T","T","A","S.","S.",www.teste.nada,assets/artworks/eiffel.jpg'
  ]);
  const semHttp = run(['--file', siteMau, '--check']);
  check.check('um site que não começa por http(s) é recusado',
    semHttp.code === 1 && /não é um endereço http\(s\)/.test(semHttp.output),
    semHttp.output.trim().split('\n').pop());

  const capaMa = sheet('capa-ma.csv', [
    'scene1,1,"T","T","A","S.","S.",,assets/nao-existe.jpg'
  ]);
  const semFicheiro = run(['--file', capaMa, '--check']);
  check.check('uma capa que não existe no projeto é recusada',
    semFicheiro.code === 1 && /não existe no projeto/.test(semFicheiro.output),
    semFicheiro.output.trim().split('\n').pop());

  const capaEstranha = sheet('capa-estranha.csv', [
    'scene1,1,"T","T","A","S.","S.",,assets/artworks/eiffel.txt'
  ]);
  const tipoMau = run(['--file', capaEstranha, '--check']);
  check.check('uma capa que não é imagem nem vídeo é recusada',
    tipoMau.code === 1 && /não é uma imagem nem um vídeo conhecido/.test(tipoMau.output),
    tipoMau.output.trim().split('\n').pop());

  // ---- 7. nada disto tocou no dado ----
  const depois = worldsFingerprint();
  check.check('nenhum `--check` tocou em `data/worlds/` (uma folha errada não estraga o dado)',
    depois === antes, depois === antes ? 'igual' : 'OS MUNDOS MUDARAM');

  rmSync(TEMP, { recursive: true, force: true });
  check.report('o importador do CSV');
  process.exit(check.list.some((item) => !item.ok) ? 1 : 0);
}

main();
