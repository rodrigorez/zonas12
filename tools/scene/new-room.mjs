#!/usr/bin/env node
// O esqueleto de uma sala nova, escrito no dado (P2 da `docs/SPEC-NOVA-SALA.md`).
//
// Porque existe: uma sala nova não é um ficheiro, são **cinco**: o dado da sala, a porta no portão, a
// porta de chegada em cada destino, as entradas de asset dos retratos que ainda não existem e as
// posições que a regra dos dois anéis impõe. Fazer isso à mão em cada sala é copiar a mesma aritmética
// — e é onde nascem os erros que o validador só apanha depois (L19 sem par, L24 com duas portas ao
// portão, L25 com o conjunto repetido, L9 com um retrato que ninguém vai cozinhar).
//
// O que ele **não** faz: compor a sala. Não escolhe obras, não posiciona nada à mão, não desenha
// retratos. Deixa o esqueleto de pé — câmaras, as duas dimensões, o fundo, as portas com a chegada e os
// assets dos retratos — e, no fim, corre as ferramentas que já sabem o resto (anéis, giro, buracos do
// mundo real, validador). A composição continua a ser no editor.
//
// Uso, da raiz do projeto:
//   node tools/scene/new-world.mjs <slug>                       (primeiro a pasta e o arranque)
//   node tools/scene/new-room.mjs <slug> --destinos scene3,scene6 [opções]
//
// Opções:
//   --nome-pt "…"        o nome da sala em português (por omissão, o slug)
//   --nome-en "…"        o nome da sala em inglês (por omissão, o slug)
//   --fundo <mundo>      de que sala se copia o fundo e a câmara (por omissão, `scene1`): traz o
//                        `shaderId` (ou o panorama) e a imagem de reserva, com o mesmo raio
//   --destinos a,b,c     as salas para onde as portas levam, **sem** o portão (que entra sempre, L24).
//                        Obrigatório: é a decisão D-B da spec, e a L25 é verificada antes de escrever
//   --sem-ferramentas    só escreve o dado; não corre anéis, giro, buracos nem o validador
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../regression/harness.mjs';
import { FIXTURES, isFixture } from '../../js/scene/fixtures.js';
import { ENTRY_WORLD } from '../../js/modules/portal-kinds.js';
import { RING } from '../../js/scene/ring.js';

const MUNDOS = join(ROOT, 'data', 'worlds');
const NOME = /^[a-z0-9-]+$/;

// A caixa e a moldura de uma porta: as mesmas de todas as salas (12 m de caixa, 16 de altura, 1 de
// espessura). A prova de que a caixa é 12 m está em `tools/scene/ring.mjs` — é a largura que a L23 usa
// para medir a folga entre os dois anéis.
const CAIXA = { box: [12, 16, 1], boxPosition: [0, 8, 0], boxRotation: [0, 0, 0] };

// Uma porta na ordem em que o dado a guarda (a mesma dos ficheiros que o editor exporta, para o diff
// de uma exportação futura ser só o que mudou).
function porta({ id, position, width, height, window, target, arrivalFrom }) {
  return {
    id,
    ownedBy: 0,
    position,
    width,
    height,
    box: CAIXA.box.slice(),
    boxPosition: CAIXA.boxPosition.slice(),
    boxRotation: CAIXA.boxRotation.slice(),
    trigger: 'plane',
    frame: { color: '#ff0000', thickness: 0.3 },
    window,
    action: { kind: 'navigate', target },
    arrivalFrom,
    rotation: [0, 0, 0]
  };
}

function morrer(mensagem, detalhe) {
  console.error('new-room: ' + mensagem);
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
  // O mesmo que o editor exporta: 2 espaços e um `\n` no fim — e o EOL que o ficheiro já tinha (cinco
  // dos ficheiros de mundo são CRLF, e reescrevê-los a LF mudava o ficheiro inteiro num diff).
  const corpo = JSON.stringify(mundo.cena, null, 2).replace(/\n/g, mundo.eol) + mundo.eol;
  writeFileSync(mundo.ficheiro, corpo, 'utf8');
}

function lerArgumentos(argv) {
  const opcoes = { slug: null, nomePt: null, nomeEn: null, fundo: 'scene1', destinos: null, ferramentas: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--nome-pt') opcoes.nomePt = argv[++i];
    else if (arg === '--nome-en') opcoes.nomeEn = argv[++i];
    else if (arg === '--fundo') opcoes.fundo = argv[++i];
    else if (arg === '--destinos') opcoes.destinos = String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--sem-ferramentas') opcoes.ferramentas = false;
    else if (!arg.startsWith('--') && !opcoes.slug) opcoes.slug = arg;
    else morrer('argumento desconhecido: ' + arg);
  }
  return opcoes;
}

// As salas do dado, para se poder escolher destinos e ver o conjunto que cada uma já tem (L25).
function salas() {
  const lista = [];
  for (const nome of readdirSync(MUNDOS).filter((entrada) => entrada.endsWith('.json'))) {
    const cena = JSON.parse(readFileSync(join(MUNDOS, nome), 'utf8'));
    const slug = (cena.world && cena.world.slug) || basename(nome, '.json');
    if (FIXTURES.includes(slug)) continue;
    const destinos = (cena.portals || [])
      .map((portal) => (portal.action || {}).target)
      .filter((alvo) => typeof alvo === 'string')
      .sort();
    lista.push({ slug, cena, destinos });
  }
  return lista.sort((a, b) => a.slug.localeCompare(b.slug));
}

const opcoes = lerArgumentos(process.argv.slice(2));
const slug = opcoes.slug;
if (!slug) morrer('falta o slug', ['uso: node tools/scene/new-room.mjs <slug> --destinos scene3,scene6']);
if (!NOME.test(slug)) morrer('o slug tem de ser letras minúsculas, números e hífenes: ' + slug);
if (slug === ENTRY_WORLD) morrer(ENTRY_WORLD + ' é o mundo de entrada e já existe');
if (isFixture(slug)) morrer(slug + ' é um fixture de ensaio, não uma sala');

const pasta = join(ROOT, slug);
if (!existsSync(join(pasta, 'index.html'))) {
  morrer('a pasta da sala não existe', [
    'a página é da outra ferramenta: node tools/scene/new-world.mjs ' + slug,
    'e depois volte a este comando'
  ]);
}
if (existsSync(join(MUNDOS, slug + '.json'))) {
  morrer('data/worlds/' + slug + '.json já existe: esta ferramenta não escreve por cima');
}

const existentes = salas();
const porSlug = new Map(existentes.map((sala) => [sala.slug, sala]));
const fundo = porSlug.get(opcoes.fundo);
if (!fundo) morrer('a sala de onde se copia o fundo não existe: ' + opcoes.fundo, ['salas: ' + existentes.map((s) => s.slug).join(', ')]);

if (!opcoes.destinos || opcoes.destinos.length === 0) {
  // O conjunto de destinos é a decisão D-B da spec: a ferramenta não a inventa, mostra as que existem.
  morrer('falta --destinos (a decisão D-B: três a cinco portas, uma delas ao portão)', [
    'salas e os destinos que cada uma já tem (L25: o conjunto novo tem de ser diferente de todos):',
    ...existentes.map((sala) => '  ' + sala.slug.padEnd(10) + (sala.destinos.join(', ') || '(nenhum)')),
    'exemplo: --destinos scene3,scene6   (com o portão, dá três portas)'
  ]);
}

const destinos = [...new Set(opcoes.destinos)];
if (destinos.includes(ENTRY_WORLD)) morrer('o portão entra sozinho (é a porta de volta, L24): tire-o de --destinos');
if (destinos.length < 2 || destinos.length > 4) morrer('com a porta do portão, uma sala tem três a cinco portas (L24): --destinos leva 2 a 4 salas');
for (const destino of destinos) {
  if (!porSlug.has(destino)) morrer('o destino não existe: ' + destino);
  if (destino === slug) morrer('uma sala não tem uma porta para si própria');
}

// L25 antes de escrever: o conjunto {portão + destinos} não pode ser o de outra sala.
const conjunto = [ENTRY_WORLD, ...destinos].sort();
const repetido = existentes.find((sala) => sala.destinos.length === conjunto.length &&
  sala.destinos.every((alvo, indice) => alvo === conjunto[indice]));
if (repetido) {
  morrer('a L25 recusa: o conjunto {' + conjunto.join(', ') + '} é o mesmo da sala ' + repetido.slug, [
    'escolha outro destino: a exposição não pode ter duas salas com o mesmo corredor'
  ]);
}

// ---- o dado da sala nova ----

const shaderDoFundo = (cena) => {
  const dimensao = (cena.dimensions || []).find((cada) => cada.id === 0) || {};
  return dimensao.kind === 'shader' ? dimensao.shaderId : null;
};

const retrato = (destino, origem) => ({
  [`retrato-${destino}`]: {
    path: 'assets/previews/' + destino + '-de-' + origem + '.jpg',
    type: 'image',
    alt: {
      pt: 'Retrato do mundo ' + (porSlug.get(destino) ? nomePt(porSlug.get(destino).cena) : destino) + ', visto da porta',
      en: 'Portrait of the ' + (porSlug.get(destino) ? nomeEn(porSlug.get(destino).cena) : destino) + ' world, seen from the door'
    }
  },
  [`recorte-${destino}-de-${origem}`]: {
    path: 'assets/previews/recorte-' + destino + '-de-' + origem + '.png',
    type: 'image',
    alt: {
      pt: 'Retrato do mundo ' + (porSlug.get(destino) ? nomePt(porSlug.get(destino).cena) : destino) + ', visto da porta (recorte, para a janela ao vivo)',
      en: 'Portrait of the ' + (porSlug.get(destino) ? nomeEn(porSlug.get(destino).cena) : destino) + ' world, seen from the door (cutout, for the live window)'
    }
  }
});

function nomePt(cena) { return (cena.world && cena.world.name && cena.world.name.pt) || 'mundo'; }
function nomeEn(cena) { return (cena.world && cena.world.name && cena.world.name.en) || 'world'; }

function proximoId(cena) {
  const usados = (cena.portals || []).map((portal) => portal.id);
  let id = 0;
  while (usados.includes(id)) id++;
  return id;
}

const fundoCena = fundo.cena;
const dimensaoFundo = (fundoCena.dimensions || []).find((cada) => cada.id === 0) || {};
const nomeDaDimensao = dimensaoFundo.name || { pt: 'Fundo', en: 'Background' };
// A imagem de reserva vem com a sala de onde se copiou o fundo: é o que o `?shader=0` mostra, e uma
// reserva que não exista em disco é a L9 a falhar.
const assetsDaSala = {};
if (dimensaoFundo.fallbackAsset && fundoCena.assets && fundoCena.assets[dimensaoFundo.fallbackAsset]) {
  assetsDaSala[dimensaoFundo.fallbackAsset] =
    JSON.parse(JSON.stringify(fundoCena.assets[dimensaoFundo.fallbackAsset]));
}
for (const destino of destinos) Object.assign(assetsDaSala, retrato(destino, slug));

const salaNova = {
  version: 3,
  world: {
    slug,
    name: { pt: opcoes.nomePt || slug, en: opcoes.nomeEn || slug }
  },
  cameras: JSON.parse(JSON.stringify(fundoCena.cameras ||
    { player: { position: [0, 1.6, 0], speed: 0.1 }, real: { enabled: true } })),
  assets: assetsDaSala,
  dimensions: [
    {
      id: 0,
      kind: dimensaoFundo.kind || 'shader',
      ...(dimensaoFundo.shaderId ? { shaderId: dimensaoFundo.shaderId } : {}),
      ...(dimensaoFundo.fallbackAsset ? { fallbackAsset: dimensaoFundo.fallbackAsset } : {}),
      ...(dimensaoFundo.kind === 'image' && dimensaoFundo.asset ? { asset: dimensaoFundo.asset } : {}),
      name: { pt: nomeDaDimensao.pt, en: nomeDaDimensao.en },
      // O fundo tem de ser maior do que o anel das portas (L1). As outras salas usam 500 m: o dobro da
      // distância a que uma porta fica, com folga para a esfera não entrar na janela.
      radius: typeof dimensaoFundo.radius === 'number' ? dimensaoFundo.radius : 500
    },
    { id: 1, kind: 'camera', name: { pt: 'Realidade', en: 'Reality' } }
  ],
  artworks: [],
  portals: []
};

// A porta de volta ao portão: a única que mostra a **câmara** (dimensão 1) e a única que se declara
// chegada do portão (L24 + L19). A janela `dimension-pair` é o que faz o visitante ver o mundo real
// através dela; os buracos dessa janela são escritos depois pelo `reality.mjs` (L28).
salaNova.portals.push(porta({
  id: 0,
  position: [0, 0, RING.portals.radius],
  width: 10,
  height: 12,
  window: { kind: 'dimension-pair', dimensionA: 0, dimensionB: 1 },
  target: ENTRY_WORLD,
  arrivalFrom: ENTRY_WORLD
}));

// As outras portas: cada uma mostra o destino (retrato + recorte) e declara a chegada dessa origem.
destinos.forEach((destino, indice) => {
  const cenaDestino = porSlug.get(destino).cena;
  salaNova.portals.push(porta({
    id: indice + 1,
    position: [0, 0, 0],
    width: 10,
    height: 12,
    window: {
      kind: 'preview',
      asset: 'retrato-' + destino,
      radius: 120,
      ...(shaderDoFundo(cenaDestino) ? { shaderId: shaderDoFundo(cenaDestino) } : {}),
      cutout: 'recorte-' + destino + '-de-' + slug
    },
    target: destino,
    arrivalFrom: destino
  }));
});

// ---- as salas que a sala nova toca ----

const tocados = [];

// O portão ganha a porta para a sala nova, com o retrato dela (é a porta por onde o visitante entra).
const portao = lerMundo(ENTRY_WORLD);
if (!portao) morrer('não encontrei ' + ENTRY_WORLD + '.json: sem a porta do portão a sala não é alcançável');
const idPortao = proximoId(portao.cena);
portao.cena.assets = portao.cena.assets || {};
Object.assign(portao.cena.assets, retrato(slug, ENTRY_WORLD));
portao.cena.portals = portao.cena.portals || [];
portao.cena.portals.push(porta({
  id: idPortao,
  position: [0, 0, 0],
  width: 8,
  height: 10,
  window: {
    kind: 'preview',
    asset: 'retrato-' + slug,
    radius: 120,
    ...(shaderDoFundo(salaNova) ? { shaderId: shaderDoFundo(salaNova) } : {}),
    cutout: 'recorte-' + slug + '-de-' + ENTRY_WORLD
  },
  target: slug,
  arrivalFrom: slug
}));
tocados.push(portao);

// Cada destino ganha a porta de chegada da sala nova (L19).
for (const destino of destinos) {
  const mundo = lerMundo(destino);
  const id = proximoId(mundo.cena);
  mundo.cena.assets = mundo.cena.assets || {};
  Object.assign(mundo.cena.assets, retrato(slug, destino));
  mundo.cena.portals = mundo.cena.portals || [];
  mundo.cena.portals.push(porta({
    id,
    position: [0, 0, 0],
    width: 10,
    height: 12,
    window: {
      kind: 'preview',
      asset: 'retrato-' + slug,
      radius: 120,
      ...(shaderDoFundo(salaNova) ? { shaderId: shaderDoFundo(salaNova) } : {}),
      cutout: 'recorte-' + slug + '-de-' + destino
    },
    target: slug,
    arrivalFrom: slug
  }));
  tocados.push(mundo);
}

// ---- escrever ----

writeFileSync(join(MUNDOS, slug + '.json'), JSON.stringify(salaNova, null, 2) + '\n', 'utf8');
for (const mundo of tocados) escreverMundo(mundo);

console.log('escrito: data/worlds/' + slug + '.json (2 dimensões, ' + salaNova.portals.length + ' portas)');
for (const mundo of tocados) {
  console.log('escrito: data/worlds/' + mundo.slug + '.json (+1 porta, +2 assets de retrato)');
}

// ---- as ferramentas que sabem o resto (anéis, giro, buracos do mundo real, validador) ----
//
// Corre-se sobre **todos** os mundos, e não só sobre os que esta sala toca: uma porta nova muda o
// número de lugares do anel dessa sala, e o anel distribui os lugares por igual (L22) — por isso
// **todas** as portas dessa sala mudam de sítio, e com elas o giro de todas as portas que apontam para
// ela. Medido: com os anéis a correr só nos mundos tocados, o validador acusou a L26 em sete portas de
// quatro salas que não tinham sido tocadas. Nas 12 páginas de hoje as três ferramentas são
// **idempotentes** (correm e dizem «nada a fazer»), por isso correr sobre tudo não custa nada nem move
// o que já estava certo.
const correr = (rotulo, script, argumentos, mostrar = 4) => {
  const inicio = Date.now();
  const resultado = spawnSync(process.execPath, [join(ROOT, script), ...argumentos], { cwd: ROOT, encoding: 'utf8' });
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  const saida = (resultado.stdout || '') + (resultado.stderr || '');
  const falhou = resultado.status !== 0;
  console.log('');
  console.log('── ' + rotulo + ' — ' + (falhou ? 'FALHOU' : 'ok') + ' (' + segundos + ' s) ──');
  const linhas = saida.split(/\r?\n/).filter((linha) => linha.trim());
  for (const linha of falhou ? linhas.slice(-12) : linhas.slice(-mostrar)) console.log('  ' + linha);
  return !falhou;
};

if (opcoes.ferramentas) {
  const aneis = correr('os dois anéis (ring --aplicar)', 'tools/scene/ring.mjs', ['--aplicar']);
  const giro = correr('o giro dos retratos (azimuths --aplicar)', 'tools/scene/azimuths.mjs', ['--aplicar']);
  const buracos = correr('os buracos do mundo real (reality --aplicar)', 'tools/scene/reality.mjs', ['--aplicar']);
  // O movimento das portas, sorteado (D87): depois dos anéis, porque a amplitude sai da própria porta, e
  // antes do validador, porque a L29 tem de estar verde para a sala passar. A semente fica impressa —
  // é ela que repete a mesma sala —, e por isso esta chamada mostra mais linhas do que as outras: a
  // semente é a **última** linha, e a lista de portas é o que o autor quer ler.
  //
  // `--sem-movimento` e os mundos tocados na mesma chamada: as portas que esta ferramenta acrescentou ao
  // portão e a cada destino nascem **paradas**, e sem isto ficavam paradas para sempre — medido na sala
  // 12, em que a porta do portão não oscilava (as nove portas que já lá estavam foram deixadas como
  // estavam, que é o que se quer: o movimento delas já foi visto e já foi medido).
  const sorteio = correr('o movimento das portas (sorteio --aplicar)', 'tools/scene/sorteio.mjs',
    [slug, ...tocados.map((mundo) => mundo.slug), '--aplicar', '--sem-movimento',
      '--semente', String(Date.now() % 100000)], 8);
  const validador = correr('o validador', 'tools/scene/validate.mjs', []);
  if (!aneis || !giro || !buracos || !sorteio || !validador) {
    console.error('');
    console.error('new-room: uma das ferramentas falhou — o dado está escrito, corrija o que ela disse e');
    console.error('  volte a correr a mesma ferramenta (não é preciso criar a sala outra vez).');
    console.error('  Enquanto os retratos não existirem, a L9 vai continuar vermelha: é a fase 8 da spec.');
    process.exitCode = 1;
  }
}

console.log('');
console.log('próximos passos (a spec é `docs/SPEC-NOVA-SALA.md`):');
console.log('  1. as obras: as linhas na folha `data/obras.tsv` e depois node tools/artwork/from-csv.mjs');
console.log('  2. o editor: ?world=' + slug + ' — compor a sala e exportar (o esqueleto já traz as portas)');
console.log('  3. os retratos, sempre duas passagens: node tools/scene/portrait.mjs --todos (×2)');
console.log('  4. o validador outra vez (os retratos fecham a L9) e node tools/regression/all.mjs --full');
