#!/usr/bin/env node
// A consolidação das folhas por sala na folha-mãe (D105).
//
// Porque existe: com catorze salas a nascer em paralelo, cada agente escreve **só** a folha da sua sala
// (`data/obras/sceneNN.tsv`) e ninguém toca em `data/obras.tsv` — assim não há um ficheiro partilhado a
// ser reescrito por catorze processos. Mas a folha-mãe é a fonte da verdade do projeto, e uma folha por
// sala que fique só na pasta deixa a mãe a mentir por omissão. Esta ferramenta é o passo do fim: leva
// para a mãe as linhas de cada folha de sala, e não mexe em mais nada.
//
// O que ela garante:
//   · a **ordem das salas que já estavam** na mãe não muda (o `git diff` mostra só o que é novo);
//   · as salas novas entram no fim, por ordem numérica;
//   · uma sala com folha de sala é **substituída** por ela (a folha de sala é a mais recente);
//   · uma folha de sala **vazia** (só o modelo comentado) não apaga nada — não tem linhas, não entra;
//   · o bloco de comentários e o cabeçalho da mãe ficam como estão.
//
// Uso, da raiz do projeto:
//   node tools/artwork/consolidar.mjs --check     diz o que faria (sai com 1 se houver o que mudar)
//   node tools/artwork/consolidar.mjs             escreve data/obras.tsv
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { readRows, decodeSheet } from './from-csv.mjs';
import { writeAtomic } from '../coordination/atomic.mjs';
import { OCUPADO, OFICINA, HERDADA, tomar } from '../coordination/locks.mjs';
import { basename, join } from 'node:path';
import { ROOT } from '../regression/harness.mjs';

const MAE = join(ROOT, 'data', 'obras.tsv');
const PASTA = join(ROOT, 'data', 'obras');
const COLUNAS = ['mundo', 'id', 'nome da obra', 'nomeAutores', 'nomeCoautores', 'nomaColaboradores',
  'Descritivo', 'endereço da imagem', 'endereço da obra'];

const CHECK = process.argv.includes('--check');
const numero = (slug) => Number(String(slug).replace('scene', '')) || 0;

// Uma linha de dados da folha, na ordem canónica das colunas. Vai por TAB e **sem aspas** — o mesmo
// contrato da mãe, e o que faz o texto com vírgulas continuar a ser texto.
function linhaDe(row) {
  return [row.world, row.id, row.title, row.authors, row.coAuthors, row.collaborators,
    row.synopsis, row.cover, row.site].join('\t');
}

const linhasDaMae = readFileSync(MAE, 'utf8').split(/\r?\n/);
const eol = readFileSync(MAE, 'utf8').includes('\r\n') ? '\r\n' : '\n';

// O bloco de comentários e o cabeçalho da mãe, tal e qual: a mãe explica-se a quem a abre, e essa
// explicação não é desta ferramenta.
const cabecalho = [];
const dadosMae = [];
let vistoCabecalho = false;
for (const linha of linhasDaMae) {
  if (!vistoCabecalho && (linha.startsWith('#') || linha.trim() === '')) {
    cabecalho.push(linha);
    continue;
  }
  if (!vistoCabecalho) {
    vistoCabecalho = true;
    cabecalho.push(linha);
    continue;
  }
  if (linha.trim() === '') continue;
  dadosMae.push(linha);
}

// As salas da mãe, na ordem em que lá estão — é isso que mantém o diff pequeno.
const ordemDasSalas = [];
const porSala = new Map();
for (const linha of dadosMae) {
  const mundo = linha.split('\t')[0];
  if (!porSala.has(mundo)) {
    porSala.set(mundo, []);
    ordemDasSalas.push(mundo);
  }
  porSala.get(mundo).push(linha);
}

// As folhas por sala.
const folhas = existsSync(PASTA)
  ? readdirSync(PASTA).filter((nome) => nome.endsWith('.tsv')).map((nome) => join(PASTA, nome)).sort()
  : [];

const novidades = [];
const vazias = [];
for (const ficheiro of folhas) {
  const { text } = decodeSheet(readFileSync(ficheiro));
  const rows = readRows(text).filter((row) => row.world && row.id);
  const sala = basename(ficheiro, '.tsv');
  if (rows.length === 0) {
    vazias.push(sala);
    continue;
  }
  // A folha manda na sua sala: as linhas do ficheiro dizem de que mundo são, e um `mundo` trocado num
  // ficheiro chamado `scene15.tsv` é um erro que se vê agora e não depois de escrever.
  const dentro = new Set(rows.map((row) => row.world));
  if (dentro.size !== 1 || !dentro.has(sala)) {
    console.error('consolidar: ' + ficheiro + ' fala de ' + [...dentro].join(', ') +
      ', e o nome do ficheiro diz ' + sala);
    process.exit(1);
  }
  porSala.set(sala, rows.map(linhaDe));
  if (!ordemDasSalas.includes(sala)) ordemDasSalas.push(sala);
  novidades.push(sala + ' (' + rows.length + ')');
}

const ordenadas = ordemDasSalas.slice().sort((a, b) => {
  // As que já estavam mantêm a posição; as novas vão para o fim por ordem numérica. Comparar pelos
  // dois critérios de uma vez é o que evita reordenar as treze antigas.
  const ia = dadosMae.findIndex((linha) => linha.startsWith(a + '\t'));
  const ib = dadosMae.findIndex((linha) => linha.startsWith(b + '\t'));
  if (ia >= 0 && ib >= 0) return ia - ib;
  if (ia >= 0) return -1;
  if (ib >= 0) return 1;
  return numero(a) - numero(b);
});

const corpo = ordenadas.flatMap((sala) => porSala.get(sala));
const texto = [...cabecalho, ...corpo].join(eol) + eol;
const actual = readFileSync(MAE, 'utf8');

console.log('');
console.log('folhas por sala: ' + folhas.length + ' · com linhas: ' + novidades.length +
  ' · vazias (não entram): ' + vazias.length);
if (vazias.length > 0) console.log('  vazias: ' + vazias.join(', '));
if (novidades.length > 0) console.log('  a consolidar: ' + novidades.join(', '));
console.log('');
console.log('linhas na mãe: ' + dadosMae.length + ' -> ' + corpo.length);

if (texto === actual) {
  console.log('a folha-mãe já tem tudo: nada a fazer');
  process.exit(0);
}

if (CHECK) {
  const antes = new Set(dadosMae);
  const depois = new Set(corpo);
  for (const linha of corpo) {
    if (!antes.has(linha)) console.log('  + ' + linha.split('\t').slice(0, 3).join(' · '));
  }
  for (const linha of dadosMae) {
    if (!depois.has(linha)) console.log('  - ' + linha.split('\t').slice(0, 3).join(' · '));
  }
  console.log('');
  console.log('mudaria data/obras.tsv (nada foi escrito: --check)');
  process.exit(1);
}

const oficinaTomada = (() => {
  try {
    return tomar(OFICINA, { motivo: 'consolidar a folha', esperar: 120 });
  } catch (error) {
    if (error.codigo === OCUPADO) {
      console.error('ocupado: ' + error.message);
      process.exit(OCUPADO);
    }
    throw error;
  }
})();
process.env[HERDADA] = '1';
writeAtomic(MAE, texto);
oficinaTomada.soltar();

console.log('');
console.log('escrito data/obras.tsv');
console.log('confirme com: node tools/artwork/from-csv.mjs --check');
