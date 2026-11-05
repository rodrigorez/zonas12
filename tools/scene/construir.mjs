#!/usr/bin/env node
// O construtor das ondas (D104): abre as salas planeadas na ordem que o grafo permite.
//
// Porque existe: o plano das 27 salas Ã© uma cadeia. Uma sala sÃ³ nasce com duas vizinhas construÃ­das
// (o `new-room` escreve a porta de chegada no destino, e a L24 exige trÃªs portas), e isso faz das
// **ondas** uma propriedade do mapa â€” nÃ£o uma escolha de quem orquestra. Este comando lÃª o plano, e
// para cada onda corre em paralelo as salas que podem nascer juntas; no fim, um sÃ³ `integrar` fecha
// tudo.
//
// O que ele **nÃ£o** faz: as obras, a composiÃ§Ã£o no editor e os retratos. Isso Ã© do autor, sala a sala
// (a spec Ã© `docs/SPEC-NOVA-SALA.md`). Aqui sÃ³ se levantam os esqueletos legais.
//
// Uso, da raiz do projeto:
//   node tools/scene/construir.mjs --seco           diz o que faria
//   node tools/scene/construir.mjs                  a prÃ³xima onda (a primeira que tem salas por construir)
//   node tools/scene/construir.mjs --todas          todas as ondas, atÃ© ao fim do plano
//   node tools/scene/construir.mjs --ondas 1,2      ondas escolhidas
//
// OpÃ§Ãµes:
//   --fundo <mundo>    de que sala se copiam o fundo e a cÃ¢mara (por omissÃ£o `scene1`)
//   --paralelo N       quantos esqueletos ao mesmo tempo (por omissÃ£o 4)
//   --sem-integrar     nÃ£o corre o fecho no fim (Ãºtil para ver o estado a meio)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { basename, join } from 'node:path';
import { ROOT } from '../regression/harness.mjs';
import { FIXTURES } from '../../js/scene/fixtures.js';
import { ENTRY_WORLD } from '../../js/modules/portal-kinds.js';
import { calcularOndas } from './ondas.mjs';

const MUNDOS = join(ROOT, 'data', 'worlds');

function morrer(mensagem, detalhe) {
  console.error('construir: ' + mensagem);
  for (const linha of detalhe || []) console.error('  Â· ' + linha);
  process.exit(1);
}

function lerArgumentos(argv) {
  const opcoes = { seco: false, todas: false, ondas: null, fundo: 'scene1', paralelo: 4, integrar: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--seco') opcoes.seco = true;
    else if (arg === '--todas') opcoes.todas = true;
    else if (arg === '--ondas') opcoes.ondas = String(argv[++i] || '').split(',').map(Number).filter((n) => n > 0);
    else if (arg === '--fundo') opcoes.fundo = argv[++i];
    else if (arg === '--paralelo') opcoes.paralelo = Math.max(1, Number(argv[++i]) || 4);
    else if (arg === '--sem-integrar') opcoes.integrar = false;
    else morrer('argumento desconhecido: ' + arg);
  }
  return opcoes;
}

const opcoes = lerArgumentos(process.argv.slice(2));

// ---- o plano, calculado do mapa e do disco ----
const mapa = JSON.parse(readFileSync(join(ROOT, 'data', 'mapa.json'), 'utf8'));
const salas = [...mapa.salas];

const construidas = new Set();
for (const ficheiro of readdirSync(MUNDOS)) {
  if (!ficheiro.endsWith('.json')) continue;
  const slug = basename(ficheiro, '.json');
  if (FIXTURES.includes(slug) || slug === ENTRY_WORLD) continue;
  construidas.add(slug);
}

const numero = (slug) => Number(String(slug).replace('scene', ''));
const porConstruir = salas.filter((slug) => !construidas.has(slug)).sort((a, b) => numero(a) - numero(b));
if (porConstruir.length === 0) {
  console.log('obra: o plano estÃ¡ construÃ­do â€” nÃ£o hÃ¡ nenhuma sala por abrir');
  process.exit(0);
}

// As ondas vÃªm do mÃ³dulo partilhado (o `mapa.mjs` julga-as com a mesma conta). Uma sala entra numa onda
// quando tem duas vizinhas construÃ­das, e duas vizinhas entre si nunca caem na mesma.
const { ondas, bloqueadas } = calcularOndas({ salas, pares: mapa.pares, construidas });
if (bloqueadas.length > 0) {
  morrer('nÃ£o hÃ¡ ordem de construÃ§Ã£o para ' + bloqueadas.join(', '), [
    'cada uma precisa de duas vizinhas construÃ­das, e nenhuma das que faltam as dÃ¡'
  ]);
}

// ---- que ondas Ã© que esta chamada trata ----
let escolhidas;
if (opcoes.todas) escolhidas = ondas.map((_, indice) => indice);
else if (opcoes.ondas) escolhidas = opcoes.ondas.map((n) => n - 1);
else escolhidas = [0];

for (const indice of escolhidas) {
  if (!ondas[indice]) morrer('a onda ' + (indice + 1) + ' nÃ£o existe â€” o plano tem ' + ondas.length);
}

const plano = escolhidas.map((indice) => ondas[indice]);

console.log('');
console.log('o plano: ' + ondas.length + ' onda(s), ' + porConstruir.length + ' sala(s) por abrir');
for (let i = 0; i < ondas.length; i++) {
  const marca = escolhidas.includes(i) ? '->' : '  ';
  console.log('  ' + marca + ' onda ' + (i + 1) + ': ' + ondas[i].map((passo) => passo.slug).join(', '));
}
console.log('');
console.log('esta chamada: ' + escolhidas.map((i) => 'onda ' + (i + 1)).join(' + ') +
  ' (' + plano.reduce((n, onda) => n + onda.length, 0) + ' sala(s))');

for (const onda of plano) {
  for (const passo of onda) {
    console.log('  ' + passo.slug.padEnd(8) + ' <- ' + passo.destinos.join(', '));
  }
}

if (opcoes.seco) {
  console.log('');
  console.log('seco: nada foi escrito. Sem --seco, cada sala ganha:');
  console.log('  a pasta e o arranque (new-world) e o esqueleto do dado (new-room --so-a-sala)');
  console.log('  e, no fim, um sÃ³ `integrar` fecha todas: o portÃ£o, as chegadas, os anÃ©is e o validador.');
  process.exit(0);
}

// ---- correr ----

function correr(script, argumentos) {
  return new Promise((resolve) => {
    const processo = spawn(process.execPath, [join(ROOT, script), ...argumentos],
      { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
    let saida = '';
    processo.stdout.on('data', (pedaco) => { saida += pedaco; });
    processo.stderr.on('data', (pedaco) => { saida += pedaco; });
    processo.on('close', (codigo) => resolve({ script, argumentos, codigo, saida }));
  });
}

// Em vagas: nunca mais de `--paralelo` ao mesmo tempo. Os esqueletos sÃ£o baratos, mas catorze
// processos de uma vez nÃ£o tornam nada mais rÃ¡pido e enchem o registo de erros de uma vez.
async function emVagas(tarefas, limite) {
  const resultados = [];
  let proximo = 0;
  const trabalhadores = Array.from({ length: Math.min(limite, tarefas.length) }, async () => {
    while (proximo < tarefas.length) {
      const indice = proximo++;
      resultados[indice] = await tarefas[indice]();
    }
  });
  await Promise.all(trabalhadores);
  return resultados;
}

const falhas = [];
const inicio = Date.now();

for (let i = 0; i < plano.length; i++) {
  const onda = plano[i];
  const rotulo = 'onda ' + (escolhidas[i] + 1);
  console.log('');
  console.log('== ' + rotulo + ': ' + onda.map((passo) => passo.slug).join(', ') + ' ==');

  // A pasta primeiro (Ã© o que o `new-room` exige), e sÃ³ depois o esqueleto do dado.
  await emVagas(onda.map((passo) => async () => {
    if (existsSync(join(ROOT, passo.slug, 'index.html'))) return null;
    const resultado = await correr('tools/scene/new-world.mjs', [passo.slug]);
    if (resultado.codigo !== 0) {
      console.log('  FALHOU a pasta de ' + passo.slug);
      for (const linha of resultado.saida.trim().split(/\r?\n/).slice(-4)) console.log('    ' + linha);
    }
    return resultado;
  }), opcoes.paralelo);

  const feitos = await emVagas(onda.map((passo) => async () =>
    correr('tools/scene/new-room.mjs',
      [passo.slug, '--destinos', passo.destinos.join(','), '--so-a-sala', '--fundo', opcoes.fundo])
  ), opcoes.paralelo);

  for (let j = 0; j < onda.length; j++) {
    const resultado = feitos[j];
    const passo = onda[j];
    if (resultado.codigo === 0) {
      const portas = (resultado.saida.match(/(\d+) portas\)/) || [])[1];
      console.log('  ok ' + passo.slug + ' (' + (portas || '?') + ' portas, esqueleto)');
    } else {
      falhas.push(passo.slug);
      console.log('  FALHOU ' + passo.slug);
      for (const linha of resultado.saida.trim().split(/\r?\n/).slice(-6)) console.log('    ' + linha);
    }
  }
}

if (opcoes.integrar) {
  console.log('');
  console.log('== o fecho (integrar) ==');
  const fecho = await correr('tools/scene/integrar.mjs', []);
  const linhas = fecho.saida.trim().split(/\r?\n/);
  const escritas = linhas.filter((linha) => linha.startsWith('escrito:'));
  for (const linha of escritas) console.log('  ' + linha);
  const vermelho = linhas.filter((linha) => /^ *error:/.test(linha) && !/law L9/.test(linha));
  console.log('  ' + escritas.length + ' escrita(s) Â· ' + (vermelho.length === 0
    ? 'nenhum erro que nÃ£o seja a L9 (os retratos, que sÃ£o o passo 7 do guia)'
    : vermelho.length + ' erro(s) â€” ver abaixo'));
  for (const linha of vermelho.slice(0, 12)) console.log('  ' + linha);
  if (vermelho.length > 0) falhas.push('integrar');
}

console.log('');
console.log('levou ' + Math.round((Date.now() - inicio) / 1000) + ' s.');
if (falhas.length > 0) {
  console.error('construir: ' + falhas.length + ' problema(s): ' + falhas.join(', '));
  process.exit(1);
}
console.log('os esqueletos estÃ£o de pÃ© e o fecho estÃ¡ feito. O que falta Ã© do autor, sala a sala:');
console.log('  1. as obras: `data/obras.tsv` e depois node tools/artwork/from-csv.mjs');
console.log('  2. a composiÃ§Ã£o: node tools/server/serve.mjs e ?world=<slug> no editor');
console.log('  3. os retratos, duas passagens: node tools/scene/portrait.mjs --todos (Ã—2)');
console.log('  4. node tools/regression/all.mjs --full e a prova visual');
