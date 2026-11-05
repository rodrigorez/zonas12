#!/usr/bin/env node
// O mapa das portas da galeria — o "balcão" da exposição (D96).
//
// Porque existe: uma sala nova decide **três a cinco destinos**, e a L24 (portas por sala) e a L25
// (conjuntos de destinos diferentes) só se julgam em conjunto. Hoje essa conta vive dentro do
// `new-room`, corre depois de o comando estar escrito, e não vê o que outro agente está a fazer.
// Aqui o mapa é o **dado**: o que está reservado está escrito, e quem chega a seguir lê-o em vez de
// adivinhar. A topologia é engenharia da galeria; o nome, o fundo, as obras e a composição ficam com
// o autor de cada sala.
//
// Uso:
//   node tools/scene/mapa.mjs                  julga o mapa e diz o que está mal (por omissão)
//   node tools/scene/mapa.mjs --grafo          a adjacência de cada sala e a ordem de construção
//   node tools/scene/mapa.mjs --sala scene20   o que é desta sala — e o que não é
//
// Sai com 0 quando o mapa serve, e com 1 quando alguma lei o recusa.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ENTRY_WORLD } from '../../js/modules/portal-kinds.js';
import { FIXTURES } from '../../js/scene/fixtures.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const ficheiroMapa = join(root, 'data', 'mapa.json');
const mundos = join(root, 'data', 'worlds');

const args = process.argv.slice(2);
const pedeGrafo = args.includes('--grafo');
const indiceSala = args.indexOf('--sala');
const soSala = indiceSala === -1 ? null : args[indiceSala + 1];

const MIN_PORTAS = 3;
const MAX_PORTAS = 5;
const SLUG = /^[a-z0-9-]+$/;

const erros = [];
const avisos = [];
const err = (mensagem) => erros.push(mensagem);
const warn = (mensagem) => avisos.push(mensagem);

// ---- o mapa ----

if (!existsSync(ficheiroMapa)) {
  console.error('mapa: data/mapa.json não existe — sem ele não há topologia, só salas soltas');
  process.exit(1);
}
const mapa = JSON.parse(readFileSync(ficheiroMapa, 'utf8'));

if (mapa.versao !== 1) err(`mapa: versão ${JSON.stringify(mapa.versao)} — este leitor lê a 1`);
if (!Array.isArray(mapa.salas) || mapa.salas.length === 0) err('mapa: "salas" tem de ser uma lista com pelo menos uma sala');
if (!Array.isArray(mapa.pares)) err('mapa: "pares" tem de ser uma lista de pares');

const salas = Array.isArray(mapa.salas) ? mapa.salas : [];
const pares = Array.isArray(mapa.pares) ? mapa.pares : [];

// ---- o que existe no disco ----

const construidas = new Map();
for (const nome of readdirSync(mundos).filter((entrada) => entrada.endsWith('.json'))) {
  const cena = JSON.parse(readFileSync(join(mundos, nome), 'utf8'));
  const slug = (cena.world && cena.world.slug) || nome.replace('.json', '');
  if (FIXTURES.includes(slug) || slug === ENTRY_WORLD) continue;
  construidas.set(slug, cena);
}

// ---- os vizinhos que o mapa declara ----

const vizinhos = new Map(salas.map((slug) => [slug, new Set()]));
const vistos = new Set();
for (const par of pares) {
  if (!Array.isArray(par) || par.length !== 2) {
    err(`mapa: o par ${JSON.stringify(par)} não é um par de duas salas`);
    continue;
  }
  const [a, b] = par;
  for (const ponta of [a, b]) {
    if (typeof ponta !== 'string' || !SLUG.test(ponta)) {
      err(`mapa: "${ponta}" não é um slug válido (letras minúsculas, números e hífenes)`);
    } else if (FIXTURES.includes(ponta)) {
      err(`mapa: "${ponta}" é um mundo de ensaio — law L30 (um ensaio não entra na exposição)`);
    } else if (ponta === ENTRY_WORLD) {
      err(`mapa: o portão não se declara aqui — a porta ao portão é uma por sala (law L24) e é implícita`);
    } else if (!vizinhos.has(ponta)) {
      err(`mapa: "${ponta}" aparece num par e não está na lista de "salas"`);
    }
  }
  if (a === b) err(`mapa: "${a}" não tem uma porta para si própria`);
  const chave = a < b ? a + '|' + b : b + '|' + a;
  if (vistos.has(chave)) err(`mapa: a aresta ${a}—${b} está repetida`);
  vistos.add(chave);
  if (vizinhos.has(a) && vizinhos.has(b) && a !== b) {
    vizinhos.get(a).add(b);
    vizinhos.get(b).add(a);
  }
}

const portas = (slug) => 1 + vizinhos.get(slug).size;
const conjunto = (slug) => [ENTRY_WORLD, ...vizinhos.get(slug)].sort().join(' + ');

// Quantas portas a sala tem **hoje**, no dado. Uma aresta do mapa são duas portas — uma em cada sala —
// e a que falta nasce quando a vizinha for construída. Por isso uma sala pode estar pronta e ainda não
// estar completa; é esse o estado que este número mostra.
const portasNoDado = (slug) => {
  const cena = construidas.get(slug);
  if (!cena) return 0;
  const navegam = (cena.portals || [])
    .map((portal) => (portal.action || {}).target)
    .filter((alvo) => typeof alvo === 'string' && alvo !== ENTRY_WORLD);
  return 1 + navegam.length;
};
const estado = (slug) => {
  if (!construidas.has(slug)) return 'planeada';
  const hoje = portasNoDado(slug);
  const plano = portas(slug);
  if (hoje === plano) return 'completa';
  if (hoje < plano) return `em obra (${plano - hoje} por vir)`;
  return `acima do plano (+${hoje - plano})`;
};

// ---- as leis ----

// L24: uma sala tem três a cinco portas, e a do portão entra na conta.
for (const slug of salas) {
  const n = portas(slug);
  if (n < MIN_PORTAS || n > MAX_PORTAS) {
    err(`${slug}: ${n} porta(s) no mapa — law L24 (uma sala tem três a cinco, ou deixa de ser sala)`);
  }
}

// L25: duas salas não têm o mesmo conjunto de destinos.
const porConjunto = new Map();
for (const slug of salas) {
  const chave = conjunto(slug);
  if (!porConjunto.has(chave)) porConjunto.set(chave, []);
  porConjunto.get(chave).push(slug);
}
for (const [chave, lista] of porConjunto) {
  if (lista.length > 1) {
    err(`${lista.join(' e ')} têm o mesmo conjunto de destinos (${chave}) — law L25 (o mesmo corredor em duas salas)`);
  }
}

// O mapa e o disco não podem discordar sobre o que **já existe**. Uma aresta para uma sala planeada é
// uma porta que ainda não nasceu — não é discordância, é a obra por fazer, e conta-se à parte.
let pendentes = 0;
for (const [slug, cena] of construidas) {
  if (!vizinhos.has(slug)) {
    err(`${slug} existe em data/worlds/ e não está no mapa — um mapa que não cobre a exposição mente`);
    continue;
  }
  const noDado = new Set((cena.portals || [])
    .map((portal) => (portal.action || {}).target)
    .filter((alvo) => typeof alvo === 'string' && alvo !== ENTRY_WORLD));
  const noMapa = vizinhos.get(slug);
  for (const alvo of noDado) {
    if (!noMapa.has(alvo)) err(`${slug}: o dado tem uma porta para "${alvo}" que o mapa não declara`);
  }
  for (const alvo of noMapa) {
    if (noDado.has(alvo)) continue;
    if (construidas.has(alvo)) {
      err(`${slug}: o mapa declara "${alvo}" e o dado não tem essa porta (as duas salas já existem)`);
    } else {
      pendentes++;
    }
  }
}

// L11: um destino tem de existir — construído, ou planeado neste mapa.
for (const slug of salas) {
  if (!construidas.has(slug) && !vizinhos.has(slug)) err(`${slug}: planeada e sem lugar no mapa`);
}

// A ordem de construção: o `new-room` acrescenta a porta de chegada ao destino, por isso uma sala só
// pode nascer quando **dois** dos seus vizinhos já existem (o mínimo da L24). O resto das portas
// chegam quando as salas seguintes nascerem — é a mesma operação vista do outro lado.
//
// A ordem vem em **ondas**: cada onda é o conjunto de salas que pode nascer ao mesmo tempo, e é isso
// que decide quantos agentes conseguem trabalhar em paralelo. A onda não é uma escolha — é a altura do
// grafo. Um mapa em cadeia dá uma sala por onda, por muito que se queira catorze.
const ordem = [];
const ondas = [];
const prontas = new Set(construidas.keys());
const porConstruir = salas.filter((slug) => !construidas.has(slug));
let mudou = true;
while (mudou) {
  mudou = false;
  const onda = [];
  // A onda inteira é decidida contra o mesmo retrato do disco: as salas que nascem **juntas** não se
  // vêem umas às outras. Sem isto, a segunda sala da lista já contava com a primeira e todas cabiam na
  // primeira onda — que é precisamente a ilusão que este relatório existe para desfazer.
  for (const slug of porConstruir) {
    if (prontas.has(slug)) continue;
    const existentes = [...vizinhos.get(slug)].filter((alvo) => prontas.has(alvo) &&
      !onda.some((passo) => passo.slug === alvo));
    if (existentes.length >= 2) onda.push({ slug, destinos: existentes });
  }
  if (onda.length > 0) {
    for (const passo of onda) {
      prontas.add(passo.slug);
      ordem.push(passo);
    }
    ondas.push(onda);
    mudou = true;
  }
}
const ondaDe = new Map();
ondas.forEach((onda, indice) => { for (const passo of onda) ondaDe.set(passo.slug, indice + 1); });
const bloqueadas = porConstruir.filter((slug) => !prontas.has(slug));
if (bloqueadas.length > 0) {
  err(`não há ordem de construção para ${bloqueadas.join(', ')} — cada uma precisa de dois vizinhos já ` +
    `construídos, e nenhum deles existe (o \`new-room\` escreve a porta de chegada no destino)`);
}

// A simulação: o mapa pode estar certo no fim e errado **pelo caminho**. Cada passo da ordem tem de
// deixar todas as salas construídas dentro da L24 (3 a 5 portas) e com conjuntos de destinos distintos
// (L25) — senão o `validate` fica vermelho a meio da obra e ninguém sabe se a culpa é da sala nova ou
// da antiga. As portas que faltam a uma sala chegam-lhe quando as vizinhas nascerem: é a mesma aresta
// vista do outro lado.
const tem = new Map(salas.map((slug) => [slug, new Set()]));
for (const [slug, cena] of construidas) {
  for (const portal of cena.portals || []) {
    const alvo = (portal.action || {}).target;
    if (typeof alvo === 'string' && alvo !== ENTRY_WORLD) tem.get(slug).add(alvo);
  }
}
const aDecorrer = new Set(construidas.keys());
const passoPortas = (slug) => 1 + tem.get(slug).size;
const julgarPasso = () => {
  const problemas = [];
  for (const slug of aDecorrer) {
    const n = passoPortas(slug);
    if (n < MIN_PORTAS || n > MAX_PORTAS) problemas.push(`${slug} com ${n} porta(s) — law L24`);
  }
  const vistos = new Map();
  for (const slug of aDecorrer) {
    const chave = [ENTRY_WORLD, ...tem.get(slug)].sort().join(' + ');
    if (vistos.has(chave)) problemas.push(`${vistos.get(chave)} e ${slug} com o mesmo conjunto (${chave}) — law L25`);
    vistos.set(chave, slug);
  }
  return problemas;
};
const passos = [];
let passosOk = julgarPasso().length === 0;
for (const passo of ordem) {
  for (const destino of passo.destinos) {
    tem.get(destino).add(passo.slug);
    tem.get(passo.slug).add(destino);
  }
  aDecorrer.add(passo.slug);
  const problemas = julgarPasso();
  if (problemas.length > 0) passosOk = false;
  passos.push({ slug: passo.slug, problemas });
}
if (!passosOk) {
  for (const passo of passos.filter((cada) => cada.problemas.length > 0)) {
    err(`a obra de ${passo.slug} deixaria a exposição inválida: ${passo.problemas.join(' · ')}`);
  }
}

// ---- o plano em ondas: quantos agentes cabem, e porquê -------------------------------------------
//
// O utilizador quer catorze agentes a abrir catorze salas ao mesmo tempo. A resposta não está na
// ferramenta: está no grafo. Uma sala só nasce com dois vizinhos construídos (L24), e isso faz das
// ondas uma propriedade do mapa — não uma escolha de quem orquestra. Este relatório diz, sem rodeios,
// quantas salas cabem em cada onda e quantas são obrigatoriamente uma de cada vez.
if (args.includes('--ondas')) {
  const hoje = ondas[0] || [];
  console.log('');
  console.log('o plano em ' + ondas.length + ' onda(s) — cada onda é um grupo que pode nascer ao mesmo tempo');
  console.log('');
  for (let i = 0; i < ondas.length; i++) {
    const onda = ondas[i];
    console.log('onda ' + (i + 1) + ' (' + onda.length + ' sala' + (onda.length === 1 ? '' : 's') + '): ' +
      onda.map((passo) => passo.slug).join(', '));
    for (const passo of onda) {
      console.log('    ' + passo.slug + ' <- ' + passo.destinos.join(', '));
    }
  }
  const maior = ondas.reduce((n, onda) => Math.max(n, onda.length), 0);
  console.log('');
  console.log('paralelismo máximo: ' + maior + ' sala(s) por onda');
  console.log('as que podem nascer agora: ' + (hoje.length === 0 ? 'nenhuma' : hoje.map((p) => p.slug).join(', ')));
  if (hoje.length < ondas[0]?.length) console.log('  (o mapa mudou desde a última vez que correu)');
  console.log('');
  console.log('para abrir mais frentes é preciso mais arestas em `data/mapa.json` — cada aresta nova');
  console.log('liga uma sala planeada a uma construída, e cada uma custa uma porta em cada ponta (L24: 5).');
  console.log('');
  if (erros.length > 0) {
    for (const mensagem of erros) console.error(`  error: ${mensagem}`);
    process.exit(1);
  }
  process.exit(0);
}

// ---- o dossiê: o que cada agente recebe, e o que lhe é defeso ----

// Com um agente por sala, o mapa não chega: cada agente precisa da sua folha — o que constrói, o que
// já está decidido, e em que ficheiros a operação dele escreve. A folha diz também **em que onda** a
// sala cabe, porque é isso que decide se ela pode nascer agora ou se tem de esperar por uma vizinha.
const pedeDossie = args.includes('--dossie');
const indiceDossie = args.indexOf('--dossie');
const alvoDossie = indiceDossie !== -1 && args[indiceDossie + 1] && !args[indiceDossie + 1].startsWith('--')
  ? args[indiceDossie + 1]
  : null;

if (pedeDossie) {
  const escolhidas = alvoDossie ? ordem.filter((passo) => passo.slug === alvoDossie) : ordem;
  if (escolhidas.length === 0) {
    console.error(`mapa: "${alvoDossie}" não está por construir (o dossiê é para as salas planeadas)`);
    process.exit(1);
  }
  for (const passo of escolhidas) {
    const onda = ondaDe.get(passo.slug);
    const naMesmaOnda = (ondas[onda - 1] || []).filter((cada) => cada.slug !== passo.slug);
    // Aqui fala-se do **disco de hoje**, e não da simulação: a simulação diz em que onda a sala cabe,
    // mas o comando só pode usar vizinhas que já existem. Confundir as duas coisas dava folhas que
    // mandavam um agente correr um `--destinos` com salas que ainda não nasceram (L11).
    const hojeDisponiveis = [...vizinhos.get(passo.slug)].filter((alvo) => construidas.has(alvo)).sort();
    const faltam = [...vizinhos.get(passo.slug)].filter((alvo) => !construidas.has(alvo)).sort();
    const podeAgora = hojeDisponiveis.length >= 2;
    console.log('');
    console.log(`═══ ${passo.slug} · onda ${onda} de ${ondas.length} ═══`);
    console.log(`  portas no mapa:  ${portas(passo.slug)} (1 ao portão + ${vizinhos.get(passo.slug).size} vizinhos)`);
    console.log(`  vizinhas no mapa:  ${[...vizinhos.get(passo.slug)].sort().join(', ')}`);
    console.log(`  existem hoje:      ${hojeDisponiveis.join(', ') || '(nenhuma)'}`);
    if (faltam.length > 0) {
      console.log(`  faltam nascer:     ${faltam.join(', ')} — a porta é escrita por elas quando nascerem`);
    }
    if (podeAgora) {
      console.log('  pode nascer agora: sim — tem duas vizinhas construídas (o mínimo da L24)');
      if (naMesmaOnda.length > 0) {
        console.log(`  nasce ao mesmo tempo que: ${naMesmaOnda.map((cada) => cada.slug).join(', ')}`);
      } else {
        console.log('  nasce sozinha nesta onda — é a única sala que pode nascer ao mesmo tempo que ela');
      }
      console.log('');
      console.log(`  1. node tools/scene/new-world.mjs ${passo.slug}`);
      console.log(`  2. node tools/scene/new-room.mjs ${passo.slug} --destinos ${hojeDisponiveis.join(',')} --so-a-sala`);
      console.log('');
      console.log('  escreve em:');
      console.log(`    data/worlds/${passo.slug}.json   (novo — e SÓ este ficheiro)`);
      console.log('');
      console.log('  e o fecho, uma vez, quando a onda (ou a ronda) acabar:');
      console.log('    node tools/scene/integrar.mjs');
      console.log('      data/worlds/gate.json      (+1 porta)');
      for (const alvo of hojeDisponiveis) console.log(`      data/worlds/${alvo}.json   (+1 porta, +2 assets de retrato)`);
      console.log('      e, por baixo, o anel · o giro · o mundo real · o sorteio — sobre TODOS os mundos');
      console.log('');
      console.log('  em paralelo: as salas da mesma onda podem correr juntas — cada uma escreve só o seu');
      console.log('    ficheiro (--so-a-sala). O fecho é que é um de cada vez (a oficina serializa-o).');
    } else {
      const precisas = ondas[onda - 2] || [];
      const vizinhasQueFaltam = precisas.filter((cada) => vizinhos.get(passo.slug).has(cada.slug));
      console.log('  pode nascer agora: NÃO — tem ' + hojeDisponiveis.length +
        ' vizinha(s) construída(s) e a L24 exige duas.');
      if (vizinhasQueFaltam.length > 0) {
        console.log('    espera por: ' + vizinhasQueFaltam.map((cada) => cada.slug).join(', ') +
          ` (onda ${onda - 1})`);
      }
      console.log('    não há comando para esta sala hoje — dar-lhe um obrigaria a inventar destinos');
      console.log('    que o mapa não tem (a L25 recusaria, e a L11 também).');
    }
    console.log('');
    console.log('  o que já está decidido: as portas acima — não se mudam (é o mapa, não o gosto).');
    console.log('  o que é do autor: o nome pt/en, o fundo, as obras, a composição e os retratos.');
  }
  console.log('');
  if (erros.length > 0) {
    for (const mensagem of erros) console.error(`  error: ${mensagem}`);
    process.exit(1);
  }
  process.exit(0);
}

// ---- o relatório ----

const totalPortas = salas.reduce((n, slug) => n + portas(slug), 0) + salas.length;
const livres = salas.reduce((n, slug) => n + (MAX_PORTAS - portas(slug)), 0);
const aMudar = salas.filter((slug) => construidas.has(slug) &&
  [...vizinhos.get(slug)].some((alvo) => !construidas.has(alvo)));

console.log(`mapa: data/mapa.json — ${salas.length} sala(s), ${pares.length} aresta(s)`);
console.log(`construídas: ${construidas.size} · planeadas: ${porConstruir.length}`);
console.log(`portas: ${salas.reduce((n, slug) => n + portas(slug), 0)} nas salas + ${salas.length} no portão ` +
  `= ${totalPortas} · retratos (par .jpg + .png): ${totalPortas * 2}`);
console.log(`lugares livres no mapa: ${livres}`);
console.log(`arestas pendentes (a porta nasce com a sala planeada): ${pendentes}`);
if (aMudar.length > 0) {
  console.log(`salas prontas que ainda ganham porta: ${aMudar.join(', ')}`);
}
const conta = { completa: 0, obra: 0, planeada: 0 };
for (const slug of salas) {
  const e = estado(slug);
  if (e === 'completa') conta.completa++;
  else if (e === 'planeada') conta.planeada++;
  else conta.obra++;
}
console.log(`estado: ${conta.completa} completa(s) · ${conta.obra} em obra · ${conta.planeada} planeada(s)`);
console.log(`obra: ${passosOk ? `os ${ordem.length} passo(s) da ordem deixam a exposição válida em cada passo` : 'um passo da ordem viola uma lei'}`);
console.log('');

if (soSala) {
  if (!vizinhos.has(soSala)) {
    console.error(`mapa: "${soSala}" não está no mapa`);
    process.exit(1);
  }
  const estadoSala = estado(soSala);
  console.log(`${soSala} — ${estadoSala}`);
  console.log(`  portas:    ${portas(soSala)} no mapa (1 ao portão + ${vizinhos.get(soSala).size} vizinhos)` +
    (construidas.has(soSala) ? ` · ${portasNoDado(soSala)} no dado` : ''));
  console.log(`  destinos:  ${[...vizinhos.get(soSala)].sort().join(', ')}`);
  console.log(`  conjunto:  ${conjunto(soSala)}`);
  console.log(`  lugar:     ${MAX_PORTAS - portas(soSala)} porta(s) por ocupar`);
  if (construidas.has(soSala)) {
    const porVir = [...vizinhos.get(soSala)].filter((alvo) => !construidas.has(alvo)).sort();
    console.log('  o dado já tem estas portas — a sala não decide nada, só mantém');
    if (porVir.length > 0) {
      console.log(`  atenção:   ganha ${porVir.length} porta(s) quando ${porVir.join(', ')} nascer(em)`);
    }
  } else {
    const entao = ordem.find((passo) => passo.slug === soSala);
    console.log(`  constrói:  node tools/scene/new-room.mjs ${soSala} --destinos ${entao ? entao.destinos.join(',') : '…'}`);
    console.log('             (as restantes portas chegam quando as salas vizinhas nascerem)');
  }
  console.log('');
  console.log('o que é do autor (nome, fundo, obras, composição) não está aqui — este mapa só decide portas');
} else if (pedeGrafo) {
  console.log('sala       estado                 hoje/plano  vizinhos');
  for (const slug of salas) {
    const hoje = construidas.has(slug) ? String(portasNoDado(slug)) : '—';
    console.log(`${slug.padEnd(10)} ${estado(slug).padEnd(22)} ${(hoje + '/' + portas(slug)).padStart(10)}   ` +
      `${[...vizinhos.get(slug)].sort().join(', ')}`);
  }
  console.log('');
  console.log('hoje = portas que o dado tem · plano = portas que o mapa reserva');
  console.log('');
  console.log(`ordem de construção (${ordem.length} sala(s) nova(s)):`);
  for (const passo of ordem) {
    const onda = ondaDe.get(passo.slug);
    console.log(`  onda ${String(onda).padEnd(2)} new-room ${passo.slug.padEnd(8)} --destinos ${passo.destinos.join(',')}`);
  }
}

for (const aviso of avisos) console.log(`  warning: ${aviso}`);
if (erros.length > 0) {
  for (const mensagem of erros) console.error(`  error: ${mensagem}`);
  console.error(`mapa: ${erros.length} problema(s) — a topologia não serve`);
  process.exit(1);
}
// A linha das ondas fica **sob a bateria**: o `--check` do `all.mjs` corre este comando, e um mapa que
// deixe de ter ordem de construção tem de aparecer, não de ficar bonito no relatório.
if (ondas.length > 0) {
  const maior = ondas.reduce((n, onda) => Math.max(n, onda.length), 0);
  console.log(`ondas: ${ondas.length} · paralelismo máximo: ${maior} sala(s) · ` +
    `pode nascer agora: ${(ondas[0] || []).map((passo) => passo.slug).join(', ')}`);
}
console.log('mapa: OK');
