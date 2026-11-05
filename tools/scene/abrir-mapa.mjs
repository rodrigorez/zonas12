#!/usr/bin/env node
// Abrir o bloco das salas novas (D104): mais arestas de **entrada**, sem tocar no que já está decidido.
//
// Porque existe: o plano das 27 salas é uma **cadeia**. Uma sala só nasce com duas vizinhas
// construídas (o `new-room` escreve a porta de chegada no destino, e a L24 exige três portas), e as
// salas 15 a 27 têm hoje uma ou nenhuma vizinha no disco. Isso dá nove ondas e um paralelismo máximo
// de duas salas — catorze agentes não têm onde trabalhar.
//
// O que esta ferramenta faz, e o que **não** faz:
//   - não remove nem altera uma única aresta das que já existem: o mapa decidido fica como está;
//   - só **acrescenta** arestas entre uma sala **nova** (a partir da 14) e uma sala **construída**,
//     que é a única forma de a nova chegar a duas vizinhas na primeira onda. Uma aresta entre duas
//     salas novas não serve para nada: nenhuma delas existe ainda;
//   - distribui as portas novas pelas construídas em roda, para nenhuma ficar no limite da L24.
//
// Uso, da raiz do projeto:
//   node tools/scene/abrir-mapa.mjs --seco     diz o que faria (e não escreve)
//   node tools/scene/abrir-mapa.mjs            escreve `data/mapa.json`
//
// Depois: `node tools/scene/mapa.mjs --check` (o juiz) e `node tools/scene/mapa.mjs --ondas`.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { writeJson } from '../coordination/atomic.mjs';
import { OCUPADO, OFICINA, HERDADA, tomar } from '../coordination/locks.mjs';
import { basename, join } from 'node:path';
import { ROOT } from '../regression/harness.mjs';
import { FIXTURES } from '../../js/scene/fixtures.js';
import { ENTRY_WORLD } from '../../js/modules/portal-kinds.js';
import { arestasCobertas, calcularOndas } from './ondas.mjs';

const MUNDOS = join(ROOT, 'data', 'worlds');
const FICHEIRO = join(ROOT, 'data', 'mapa.json');
const MAX_PORTAS = 5;
const MIN_VIZINHAS = 2;

function morrer(mensagem, detalhe) {
  console.error('abrir-mapa: ' + mensagem);
  for (const linha of detalhe || []) console.error('  · ' + linha);
  process.exit(1);
}

const seco = process.argv.includes('--seco');

const mapa = JSON.parse(readFileSync(FICHEIRO, 'utf8'));
const salas = [...mapa.salas];
const pares = mapa.pares.map(([a, b]) => [a, b]);

const vizinhos = new Map(salas.map((slug) => [slug, new Set()]));
for (const [a, b] of pares) {
  vizinhos.get(a).add(b);
  vizinhos.get(b).add(a);
}

// Quem já existe no disco — as fixtures ficam de fora (L30).
const construidas = new Set();
for (const ficheiro of readdirSync(MUNDOS)) {
  if (!ficheiro.endsWith('.json')) continue;
  const slug = basename(ficheiro, '.json');
  if (FIXTURES.includes(slug) || slug === ENTRY_WORLD) continue;
  construidas.add(slug);
}

const numero = (slug) => Number(String(slug).replace('scene', ''));
const planeadas = salas.filter((slug) => !construidas.has(slug)).sort((a, b) => numero(a) - numero(b));
const prontas = salas.filter((slug) => construidas.has(slug)).sort((a, b) => numero(a) - numero(b));

if (planeadas.length === 0) morrer('não há salas planeadas por construir: o mapa já está aberto');

// A porta ao portão é obrigatória (L24) e não conta para este limite — aqui contam os vizinhos.
const portas = (slug) => 1 + vizinhos.get(slug).size;
const folga = (slug) => MAX_PORTAS - portas(slug);

// A roda das construídas: só entram as que ainda têm lugar. Percorrer sempre a mesma ordem é o que
// distribui as portas novas em vez de as empilhar nas primeiras.
const roda = prontas.slice();
let ponteiro = 0;

const acrescentadas = [];
const semLugar = [];

// O relatório do teto vem **antes** da abertura: ele responde a «quanto é que a L24 teria de subir»,
// e essa pergunta faz-se justamente quando a abertura falha.
if (process.argv.includes('--teto')) {
  const indice = process.argv.indexOf('--teto');
  const teto = Number(process.argv[indice + 1]);
  const graus = new Map();
  for (const [a, b] of mapa.pares) {
    graus.set(a, (graus.get(a) || 0) + 1);
    graus.set(b, (graus.get(b) || 0) + 1);
  }
  const portasNoPlano = (slug) => 1 + (graus.get(slug) || 0);
  const acima = prontas.filter((slug) => portasNoPlano(slug) > teto);
  const folgaComTeto = prontas.reduce((n, slug) => n + Math.max(0, teto - portasNoPlano(slug)), 0);
  let precisa = 0;
  for (const nova of planeadas) {
    precisa += Math.max(0, MIN_VIZINHAS - [...vizinhos.get(nova)].filter((alvo) => construidas.has(alvo)).length);
  }
  console.log('');
  console.log('com um teto de ' + teto + ' portas por sala:');
  console.log('  salas construídas acima do teto: ' + (acima.length === 0 ? 'nenhuma' : acima.join(', ')));
  console.log('  folga total nas construídas: ' + folgaComTeto);
  console.log('  arestas de entrada em falta: ' + precisa);
  console.log('  ' + (precisa <= folgaComTeto
    ? 'CABE — com este teto, as ' + planeadas.length + ' salas cabem na primeira onda'
    : 'NAO CABE — faltam ' + (precisa - folgaComTeto) + ' lugar(es)'));
  process.exit(0);
}

for (const nova of planeadas) {
  let faltam = MIN_VIZINHAS - [...vizinhos.get(nova)].filter((alvo) => construidas.has(alvo)).length;
  while (faltam > 0) {
    // A próxima construída da roda que não seja já vizinha e que ainda tenha lugar.
    let escolhida = null;
    for (let passo = 0; passo < roda.length; passo++) {
      const candidata = roda[(ponteiro + passo) % roda.length];
      if (vizinhos.get(nova).has(candidata)) continue;
      if (folga(candidata) <= 0) continue;
      escolhida = candidata;
      ponteiro = (ponteiro + passo + 1) % roda.length;
      break;
    }
    if (!escolhida) {
      semLugar.push(nova);
      break;
    }
    vizinhos.get(nova).add(escolhida);
    vizinhos.get(escolhida).add(nova);
    pares.push([nova, escolhida].sort((a, b) => numero(a) - numero(b)));
    acrescentadas.push([escolhida, nova]);
    faltam--;
  }
}

if (semLugar.length > 0) {
  // A folga que conta é a do **plano final**, não a do disco: o mapa já promete às salas construídas
  // as portas que as vizinhas planeadas lhes vão escrever. Somar arestas acima disso viola a L24.
  const cheias = prontas.filter((slug) => folga(slug) <= 0);
  morrer('não há lugar para ' + semLugar.length + ' sala(s) nova(s) — ' + cheias.length + ' de ' +
    prontas.length + ' salas construídas já estão no teto da L24 (5 portas)', [
    'no plano final, estas salas ficam com ' + MAX_PORTAS + ' portas: ' + cheias.join(', '),
    'uma das salas já no limite: ' + cheias[0] + ' tem ' + [...vizinhos.get(cheias[0])].sort().join(', '),
    '',
    'não é o protocolo que trava: é a L24. Para abrir, é preciso escolher uma destas:',
    '  · aceitar a cadeia (o `--ondas` mostra as ondas que o mapa já permite), ou',
    '  · subir o teto de portas por sala — ver `node tools/scene/abrir-mapa.mjs --teto 6`, ou',
    '  · tirar arestas prontas<->prontas, que estão construídas no disco e não se podem tirar'
  ]);
}

// Quanto teto seria preciso para todas as planeadas nascerem na primeira onda. É um relatório, não uma
// alteração: quem muda a L24 é o autor, e a lei tem uma razão (acima de cinco portas a sala deixa de
// ser uma sala e passa a ser um átrio).

console.log('');
console.log('salas construídas: ' + prontas.length + ' · planeadas: ' + planeadas.length);
console.log('arestas que o mapa já tinha: ' + mapa.pares.length);
console.log('arestas novas: ' + acrescentadas.length + ' (todas entre uma planeada e uma construída)');
console.log('');
for (const [pronta, nova] of acrescentadas) {
  console.log('  ' + pronta.padEnd(8) + ' <-> ' + nova.padEnd(8) +
    '   (' + pronta + ' fica com ' + portas(pronta) + ' portas, ' + nova + ' com ' + portas(nova) + ')');
}
console.log('');
console.log('portas por sala construída:');
for (const slug of prontas) {
  console.log('  ' + slug.padEnd(8) + portas(slug) + ' de ' + MAX_PORTAS + (folga(slug) === 0 ? '  (cheia)' : ''));
}

const ordenado = salas.slice().sort();
const paresFinais = pares
  .map(([a, b]) => [a, b])
  .sort((x, y) => (numero(x[0]) - numero(y[0])) || (numero(x[1]) - numero(y[1])));

if (seco) {
  console.log('');
  console.log('seco: nada foi escrito. Sem --seco, `data/mapa.json` passa a ter ' +
    paresFinais.length + ' arestas.');
  // Confirma que a ordenação não perdeu nem inventou salas.
  if (ordenado.length !== salas.length) morrer('a lista de salas mudou de tamanho — não é para acontecer');
  process.exit(0);
}

const oficinaTomada = (() => {
  try {
    return tomar(OFICINA, { motivo: 'abrir-mapa', esperar: 120 });
  } catch (error) {
    if (error.codigo === OCUPADO) {
      console.error('ocupado: ' + error.message);
      process.exit(OCUPADO);
    }
    throw error;
  }
})();
process.env[HERDADA] = '1';

// O mapa é LF e indentação de 2 — o mesmo que os ficheiros de mundo, e o que o `git diff` mostra bem.
writeJson(FICHEIRO, { ...mapa, pares: paresFinais }, { eol: '\n' });
oficinaTomada.soltar();

console.log('');
console.log('escrito data/mapa.json: ' + mapa.pares.length + ' -> ' + paresFinais.length + ' arestas');
console.log('agora o juiz: node tools/scene/mapa.mjs --check');
