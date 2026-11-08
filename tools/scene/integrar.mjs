#!/usr/bin/env node
// O fecho de uma ronda de autoria (D102): as portas que faltam, os anéis, os retratos, o validador.
//
// Porque existe: com `new-room --so-a-sala` um agente autoriza a sala dele sem tocar num ficheiro
// partilhado — e por isso o mundo fica, de propósito, incompleto: o portão ainda não tem porta para
// ela, os destinos ainda não declaram a chegada, o anel não foi distribuído e a L9 não tem retratos.
// Esta ferramenta é a outra metade: lê **todos** os mundos, calcula o que falta a cada um, escreve só
// os que mudam, e corre as quatro derivadas **uma vez** — e não uma vez por sala.
//
// É idempotente: correr duas vezes seguidas não muda nada na segunda. É isso que a torna segura de
// repetir depois de uma ronda interrompida.
//
// Uso, da raiz do projeto:
//   node tools/scene/integrar.mjs [opções]
//
// Opções:
//   --esperar N          segundos que aceita esperar pela oficina (por omissão 120; 0 = não espera)
//   --sem-ferramentas    só escreve as portas que faltam; não corre anéis, giro, buracos, sorteio
//                        nem o validador
//   --seco               diz o que faria e não escreve nada (sai com 1 se houver trabalho pendente) — é
//                        a bateria do `all.mjs`, e não toma a oficina porque não escreve
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { writeAtomic } from '../coordination/atomic.mjs';
import { OCUPADO, OFICINA, HERDADA, tomar } from '../coordination/locks.mjs';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../regression/harness.mjs';
import { FIXTURES } from '../../js/scene/fixtures.js';
import { ENTRY_WORLD } from '../../js/modules/portal-kinds.js';
import { portaDeChegada, portaNoPortao, proximoId, retrato } from './portas.mjs';

const MUNDOS = join(ROOT, 'data', 'worlds');

function morrer(mensagem, detalhe) {
  console.error('integrar: ' + mensagem);
  for (const linha of detalhe || []) console.error('  · ' + linha);
  process.exit(1);
}

function lerMundo(slug) {
  const ficheiro = join(MUNDOS, slug + '.json');
  if (!existsSync(ficheiro)) return null;
  const texto = readFileSync(ficheiro, 'utf8');
  return { slug, ficheiro, texto, eol: texto.includes('\r\n') ? '\r\n' : '\n', cena: JSON.parse(texto) };
}

function escreverMundo(mundo) {
  const corpo = JSON.stringify(mundo.cena, null, 2).replace(/\n/g, mundo.eol) + mundo.eol;
  writeAtomic(mundo.ficheiro, corpo);
}

function lerArgumentos(argv) {
  const opcoes = { ferramentas: true, esperar: 120, seco: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--sem-ferramentas') opcoes.ferramentas = false;
    else if (arg === '--esperar') opcoes.esperar = Number(argv[++i]);
    else if (arg === '--seco') opcoes.seco = true;
    else morrer('argumento desconhecido: ' + arg);
  }
  return opcoes;
}

const opcoes = lerArgumentos(process.argv.slice(2));

// ---- a oficina (D96, M1): antes de ler ----
//
// Esta ferramenta reescreve vários mundos de uma vez e depois corre derivadas que reescrevem todos. Se
// lesse fora da trava, dois `integrar` ao mesmo tempo perderiam trabalho um do outro — é a mesma
// corrida ler→escrever que o `new-room` já pagou para aprender.
// `--seco` não escreve nada, por isso não toma a oficina: é a bateria que o `all.mjs` corre, e uma
// bateria que falha porque outro agente estava a escrever seria um falso alarme.
const oficinaTomada = opcoes.seco ? { soltar() {} } : (() => {
  try {
    return tomar(OFICINA, { motivo: 'integrar', esperar: opcoes.esperar });
  } catch (error) {
    if (error.codigo === OCUPADO) {
      console.error('ocupado: ' + error.message);
      console.error('  outro agente está a escrever — repita daqui a pouco (não é erro)');
      console.error('  para ver quem: node tools/coordination/status.mjs');
      process.exit(OCUPADO);
    }
    throw error;
  }
})();
if (!opcoes.seco) process.env[HERDADA] = '1';

// ---- ler tudo ----
//
// As fixtures ficam de fora: são mundos de ensaio e não fazem parte da exposição (L30 é o primo desta
// regra do outro lado). O portão entra, mas não como sala: ele não tem chegada a declarar.
const mundos = new Map();
for (const nome of readdirSync(MUNDOS).filter((entrada) => entrada.endsWith('.json'))) {
  const slug = basename(nome, '.json');
  if (FIXTURES.includes(slug)) continue;
  const mundo = lerMundo(slug);
  if (mundo) mundos.set(slug, mundo);
}
if (!mundos.has(ENTRY_WORLD)) morrer('não encontrei ' + ENTRY_WORLD + '.json: sem portão não há exposição');

const tocados = new Set();
const notas = [];

const mudou = (mundo) => {
  tocados.add(mundo.slug);
  mundo.cena.assets = mundo.cena.assets || {};
  mundo.cena.portals = mundo.cena.portals || [];
};

// ---- as portas do portão (L24/L19 de entrada) ----
//
// Uma sala sem porta no portão não é alcançável: a exposição é um grafo que começa no portão, e quem
// não tem porta ali só se visita sabendo o endereço. É a primeira coisa que a ronda do fecho põe.
const portao = mundos.get(ENTRY_WORLD);
const noPortao = new Set((portao.cena.portals || [])
  .map((portal) => (portal.action || {}).target)
  .filter((alvo) => typeof alvo === 'string'));

for (const [slug, mundo] of mundos) {
  if (slug === ENTRY_WORLD || noPortao.has(slug)) continue;
  const id = proximoId(portao.cena);
  mudou(portao);
  Object.assign(portao.cena.assets, retrato(slug, ENTRY_WORLD, mundo.cena));
  portao.cena.portals.push(portaNoPortao({ slug, cenaDaSala: mundo.cena, id }));
  noPortao.add(slug);
  notas.push('portão: +1 porta para ' + slug);
}

// ---- as chegadas que faltam (L19) ----
//
// Para cada porta A→B, o mundo B tem de declarar de onde o visitante vem. Não é preciso uma porta nova
// quando B já tem uma porta para A: essa porta já se declara chegada de A, e é isso que a L19 lê. Por
// isso a conta é feita sobre `arrivalFrom` e não sobre o par de portas — assim correr duas vezes não
// acrescenta uma segunda porta ao lado da primeira.
for (const [origem, mundo] of mundos) {
  for (const portal of mundo.cena.portals || []) {
    const action = portal.action || {};
    if (action.kind !== 'navigate' || typeof action.target !== 'string') continue;
    const destino = action.target;
    if (destino === origem) continue;
    const alvo = mundos.get(destino);
    // Uma porta para um mundo que ainda não existe é a L11, e não desta ferramenta: fica dita, não
    // consertada — quem cria a sala é que decide se a porta deve esperar ou desaparecer.
    if (!alvo) {
      notas.push('por criar: ' + origem + ' tem porta para ' + destino + ', que ainda não existe (L11)');
      continue;
    }
    const declarado = (alvo.cena.portals || [])
      .some((cada) => cada.arrivalFrom === origem);
    if (declarado) continue;
    const id = proximoId(alvo.cena);
    mudou(alvo);
    Object.assign(alvo.cena.assets, retrato(origem, destino, mundo.cena));
    alvo.cena.portals.push(portaDeChegada({ slug: origem, cenaDaSala: mundo.cena, destino, id }));
    notas.push(destino + ': +1 porta de chegada de ' + origem);
  }
}

// ---- o nome de cada sala, nas descrições das janelas que a mostram (D46) ----
//
// O `alt` de um retrato é escrito uma vez, quando a porta nasce (`portas.mjs`), com o nome que o destino
// tinha **nesse dia** — e até esta passagem esse nome era o slug. Nomear uma sala depois deixava o
// vizinho a dizer «Retrato do mundo scene14» a quem ouve a página: é a única cópia do nome de uma sala
// que vive no ficheiro de outra, e por isso é a única que o fecho tem de acertar. O resto (o rótulo da
// porta, a ficha, o editor) lê `world.name` do destino na hora e já não guarda nada.
//
// A frase vem de `retrato()` e não é reescrita aqui: duas cópias do mesmo texto seriam duas verdades, e
// a origem tira-se do próprio caminho (`<destino>-de-<origem>.jpg`), que é a convenção do D46.
const nomeadas = new Set();
for (const mundo of mundos.values()) {
  for (const [id, asset] of Object.entries(mundo.cena.assets || {})) {
    if (!asset || typeof asset !== 'object' || !asset.alt) continue;
    const achado = /^retrato-([a-z0-9-]+)$/.exec(id) || /^recorte-([a-z0-9-]+)-de-[a-z0-9-]+$/.exec(id);
    if (!achado) continue;
    const sala = mundos.get(achado[1]);
    const caminho = /([a-z0-9-]+)-de-([a-z0-9-]+)\.(?:jpg|png)$/i.exec(asset.path || '');
    if (!sala || !caminho) continue;
    const canonico = retrato(achado[1], caminho[2], sala.cena)[id];
    if (!canonico || !canonico.alt) continue;
    if (asset.alt.pt === canonico.alt.pt && asset.alt.en === canonico.alt.en) continue;
    Object.assign(asset.alt, canonico.alt);
    mudou(mundo);
    nomeadas.add(mundo.slug);
  }
}
if (nomeadas.size) {
  notas.push('nomes: as descrições das janelas acertadas em ' + nomeadas.size + ' mundo(s)');
}

// ---- escrever ----

if (opcoes.seco) {
  for (const nota of notas) console.log('faria: ' + nota);
  console.log(notas.length
    ? 'seco: ' + tocados.size + ' mundo(s) mudariam — falta fechar uma ronda de autoria'
    : 'seco: nada a fazer');
  // Sai com 1 quando há trabalho pendente: é assim que o `all.mjs` o usa como bateria. Nada foi
  // escrito, por isso o código é a única coisa que uma máquina pode ler.
  process.exit(notas.length ? 1 : 0);
}

for (const slug of tocados) escreverMundo(mundos.get(slug));
for (const nota of notas) console.log('escrito: ' + nota);
if (!tocados.size) console.log('nada a fazer: as portas e as chegadas já estão todas escritas');

// ---- as derivadas, uma vez ----
//
// Corre-se sobre todos os mundos porque é assim que elas funcionam: uma porta nova muda o número de
// lugares do anel de uma sala, e o anel distribui os lugares por igual (L22) — logo **todas** as portas
// dessa sala mudam de sítio, e com elas o giro de todas as portas que apontam para ela.
const correr = (rotulo, script, argumentos, mostrar = 4) => {
  const resultado = spawnSync(process.execPath, [join(ROOT, script), ...argumentos],
    { cwd: ROOT, encoding: 'utf8' });
  const linhas = ((resultado.stdout || '') + (resultado.stderr || '')).trim().split(/\r?\n/);
  const falhou = resultado.status !== 0;
  console.log('');
  console.log((falhou ? 'FALHOU ' : 'ok ') + rotulo);
  for (const linha of linhas.slice(falhou ? -12 : -mostrar)) console.log('  ' + linha);
  return !falhou;
};

let tudo = true;
if (opcoes.ferramentas) {
  // O sorteio vem depois dos anéis (a amplitude sai da própria porta) e antes do validador (a L29 tem
  // de estar verde). E só é preciso nas portas que esta ronda escreveu — as que já existiam foram
  // sorteadas quando nasceram, e voltar a sortear mudaria o movimento de salas já vistas e medidas.
  const novas = [...tocados];
  const aneis = correr('os dois anéis (ring --aplicar)', 'tools/scene/ring.mjs', ['--aplicar']);
  const giro = correr('o giro dos retratos (azimuths --aplicar)', 'tools/scene/azimuths.mjs', ['--aplicar']);
  const buracos = correr('os buracos do mundo real (reality --aplicar)', 'tools/scene/reality.mjs', ['--aplicar']);
  const sorteio = novas.length
    ? correr('o movimento das portas (sorteio --aplicar)', 'tools/scene/sorteio.mjs',
      [...novas, '--aplicar', '--sem-movimento', '--semente', String(Date.now() % 100000)], 8)
    : true;
  const validador = correr('o validador', 'tools/scene/validate.mjs', []);
  tudo = aneis && giro && buracos && sorteio && validador;
}

oficinaTomada.soltar();

console.log('');
if (!tudo) {
  console.error('integrar: uma das ferramentas falhou — o dado está escrito, corrija o que ela disse e');
  console.error('  volte a correr este comando (é idempotente). Enquanto os retratos não existirem, a L9');
  console.error('  vai continuar vermelha: é a fase 8 da spec.');
  process.exitCode = 1;
} else {
  console.log('a exposição está fechada. O que falta, se faltar, é autoria:');
  console.log('  1. as obras: as linhas na folha `data/obras.tsv` e depois node tools/artwork/from-csv.mjs');
  console.log('  2. o editor: ?world=<slug> — compor a sala e exportar');
  console.log('  3. os retratos, sempre duas passagens: node tools/scene/portrait.mjs --todos (×2)');
  console.log('  4. node tools/scene/mapa.mjs --check e node tools/regression/all.mjs --full');
}
