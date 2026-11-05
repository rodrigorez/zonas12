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
//   --esperar N          segundos que aceita esperar pela oficina (por omissão 120; 0 = não espera)
//   --mapa               os destinos vêm de `data/mapa.json` (o plano), não do que se escreve aqui:
//                        só entram os que já existem, porque uma porta para uma sala que ainda não
//                        nasceu é a L11. É a forma de o juiz ser também o porteiro (D96)
//   --so-a-sala          a ronda da **autoria** (D102): escreve só `data/worlds/<slug>.json` e não
//                        toca no portão, nos destinos nem nas derivadas que reescrevem todos os mundos.
//                        É o que permite a vários agentes autorarem salas ao mesmo tempo, cada um no
//                        seu ficheiro. O fecho — portão, chegadas, anéis, validador — é o
//                        `node tools/scene/integrar.mjs`, uma vez, no fim.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { writeAtomic, writeJson } from '../coordination/atomic.mjs';
import { OCUPADO, OFICINA, HERDADA, tomar } from '../coordination/locks.mjs';
import { basename, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from '../regression/harness.mjs';
import { FIXTURES, isFixture } from '../../js/scene/fixtures.js';
import { ENTRY_WORLD } from '../../js/modules/portal-kinds.js';
import {
  proximoId, portaDeChegada, portaDeVoltaAoPortao, portaNoPortao, portaParaDestino, retrato, shaderDoFundo
} from './portas.mjs';

const MUNDOS = join(ROOT, 'data', 'worlds');
const NOME = /^[a-z0-9-]+$/;

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
  writeAtomic(mundo.ficheiro, corpo);
}

function lerArgumentos(argv) {
  const opcoes = { slug: null, nomePt: null, nomeEn: null, fundo: 'scene1', destinos: null, ferramentas: true, esperar: 120 };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--nome-pt') opcoes.nomePt = argv[++i];
    else if (arg === '--nome-en') opcoes.nomeEn = argv[++i];
    else if (arg === '--fundo') opcoes.fundo = argv[++i];
    else if (arg === '--destinos') opcoes.destinos = String(argv[++i] || '').split(',').map((s) => s.trim()).filter(Boolean);
    else if (arg === '--sem-ferramentas') opcoes.ferramentas = false;
    else if (arg === '--esperar') opcoes.esperar = Number(argv[++i]);
    else if (arg === '--mapa') opcoes.mapa = true;
    else if (arg === '--so-a-sala') opcoes.soASala = true;
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
// A ronda da autoria (D102): só o ficheiro da própria sala, zero escritas partilhadas.
const soASala = opcoes.soASala === true;
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

// ---- a oficina (D96, M1): toma-se **antes de ler**, e não antes de escrever ----
//
// A diferença foi medida. Travar só a escrita deixa a corrida toda de pé: dois processos leem a
// `scene10` com quatro portas, os dois concluem que cabe, o primeiro escreve e o segundo escreve por
// cima do primeiro com o que tinha lido — e uma porta desaparece (2 de 3 tentativas, e a `scene1` do
// portão ficou com catorze em vez de quinze). O que precisa de ser atómico é o par ler→escrever.
//
// O custo é a espera, e é pequena: a secção crítica inteira — ler, validar, escrever a sala, a porta do
// portão, cada destino, e as quatro derivadas sobre todos os mundos — mede 0,1 a 0,2 s por derivada.
const oficinaTomada = soASala ? { soltar() {} } : (() => {
  try {
    return tomar(OFICINA, { motivo: 'new-room ' + slug, esperar: opcoes.esperar });
  } catch (error) {
    if (error.codigo === OCUPADO) {
      console.error('ocupado: ' + error.message);
      console.error('  outro agente está a criar ou a escrever uma sala — repete daqui a pouco (não é erro)');
      console.error('  para ver quem: node tools/coordination/status.mjs');
      process.exit(OCUPADO);
    }
    throw error;
  }
})();
// Os filhos desta ferramenta correm já dentro da secção crítica: não voltam a tomá-la. Com
// `--so-a-sala` não há secção crítica nenhuma para herdar — o `sorteio` toma a dele.
if (!soASala) process.env[HERDADA] = '1';

const existentes = salas();
const porSlug = new Map(existentes.map((sala) => [sala.slug, sala]));
const fundo = porSlug.get(opcoes.fundo);
if (!fundo) morrer('a sala de onde se copia o fundo não existe: ' + opcoes.fundo, ['salas: ' + existentes.map((s) => s.slug).join(', ')]);

// ---- os destinos: do mapa, quando o mapa os tem (D96) ----
//
// O mapa é o plano de 27 salas. Ler os destinos dele *aqui* é o que faz dele um **porteiro** e não um
// juiz que chega tarde: um `--destinos` copiado à mão pode ser legal (passa a L24 e a L25) e estar
// errado em relação ao plano — e nesse caso o `mapa.mjs` só reclama depois de a sala estar escrita.
//
// Só entram os vizinhos que **já existem**: uma porta para uma sala que ainda não nasceu é a L11, e o
// plano tem vizinhos que só nascem mais tarde. Esses chegam sozinhos, quando nascerem.
if (opcoes.mapa) {
  if (opcoes.destinos && opcoes.destinos.length > 0) {
    morrer('--mapa e --destinos não se misturam', [
      'ou os destinos vêm do plano (--mapa), ou são escritos aqui (--destinos) — as duas coisas dariam duas fontes'
    ]);
  }
  const ficheiroDoMapa = join(ROOT, 'data', 'mapa.json');
  if (!existsSync(ficheiroDoMapa)) {
    morrer('não há data/mapa.json: sem o plano, os destinos têm de ser escritos com --destinos');
  }
  const plano = JSON.parse(readFileSync(ficheiroDoMapa, 'utf8'));
  if (!Array.isArray(plano.salas) || !plano.salas.includes(slug)) {
    morrer('a sala ' + slug + ' não está no mapa', [
      'o plano tem ' + ((plano.salas || []).length) + ' salas; um plano que não cobre a exposição mente',
      'acrescente-a a data/mapa.json primeiro (o `mapa.mjs` julga-a)'
    ]);
  }
  const vizinhos = (plano.pares || [])
    .filter((par) => par.includes(slug))
    .map((par) => (par[0] === slug ? par[1] : par[0]))
    .sort();
  const existentesHoje = vizinhos.filter((alvo) => porSlug.has(alvo));
  const porNascer = vizinhos.filter((alvo) => !porSlug.has(alvo));
  if (existentesHoje.length < 2) {
    morrer('o mapa dá menos de dois vizinhos que já existam para ' + slug, [
      'o plano: ' + (vizinhos.join(', ') || '(nenhum)'),
      'já existem: ' + (existentesHoje.join(', ') || '(nenhum)'),
      'por nascer: ' + (porNascer.join(', ') || '(nenhum)'),
      'a L24 precisa de três a cinco portas, e o portão conta: sem dois vizinhos, a sala não abre'
    ]);
  }
  console.log('mapa: ' + slug + ' → ' + existentesHoje.join(', ') +
    (porNascer.length > 0 ? ' (por nascer: ' + porNascer.join(', ') + ')' : ''));
  opcoes.destinos = existentesHoje;
}

if (!opcoes.destinos || opcoes.destinos.length === 0) {
  // O conjunto de destinos é a decisão D-B da spec: a ferramenta não a inventa, mostra as que existem.
  morrer('falta --destinos (ou --mapa, que os lê do plano)', [
    'a decisão D-B: três a cinco portas, uma delas ao portão (L24), e o conjunto diferente de todos (L25)',
    'salas e os destinos que cada uma já tem:',
    ...existentes.map((sala) => '  ' + sala.slug.padEnd(10) + (sala.destinos.join(', ') || '(nenhum)')),
    'exemplo: --destinos scene3,scene6   (com o portão, dá três portas)',
    'ou:      --mapa                    (os destinos do plano, data/mapa.json)'
  ]);
}

const destinos = [...new Set(opcoes.destinos)];
if (destinos.includes(ENTRY_WORLD)) morrer('o portão entra sozinho (é a porta de volta, L24): tire-o de --destinos');
if (destinos.length < 2 || destinos.length > 4) morrer('com a porta do portão, uma sala tem três a cinco portas (L24): --destinos leva 2 a 4 salas');
for (const destino of destinos) {
  // L30: um mundo de ensaio existe em disco, por isso não é "um destino que não existe" — é um
  // destino que a exposição não usa. Dizer a mesma frase para os dois casos manda o autor procurar
  // um ficheiro que lá está.
  if (isFixture(destino)) {
    morrer('o destino é um mundo de ensaio, não uma sala: ' + destino, [
      'a L30 recusa: um mundo de ensaio abre-se pelo endereço e nunca se entra nele pela exposição'
    ]);
  }
  if (!porSlug.has(destino)) morrer('o destino não existe: ' + destino);
  if (destino === slug) morrer('uma sala não tem uma porta para si própria');
}

// L24 no destino, antes de escrever: a porta de chegada tem de **caber**. Cada destino ganha uma porta,
// e uma sala não passa de cinco — foi o que travou a `scene1` na sala 12 (D93). A conta faz-se aqui e não
// no fim: o validador só corre depois de a sala nova e as vizinhas estarem escritas, e a esta altura
// "não cabe" já custou nove ficheiros mexidos e uma sala a violar uma lei.
const MAX_PORTAS = 5;
const cheias = destinos
  .map((destino) => ({ slug: destino, portas: (porSlug.get(destino).cena.portals || []).length }))
  .filter((cada) => cada.portas >= MAX_PORTAS);
if (cheias.length > 0) {
  morrer('a L24 recusa: ' + (cheias.length === 1 ? 'o destino já tem' : 'estes destinos já têm') +
    ' cinco portas, e a chegada desta sala não cabe', [
    ...cheias.map((cada) => '  ' + cada.slug + ': ' + cada.portas + ' portas'),
    'escolha outro destino, ou liberte uma porta dessas salas primeiro (L24: uma sala tem três a cinco)',
    'o mapa sabe os lugares livres: node tools/scene/mapa.mjs --grafo'
  ]);
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
for (const destino of destinos) Object.assign(assetsDaSala, retrato(destino, slug, porSlug.get(destino).cena));

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
salaNova.portals.push(portaDeVoltaAoPortao(0));

// As outras portas: cada uma mostra o destino (retrato + recorte) e declara a chegada dessa origem.
destinos.forEach((destino, indice) => {
  salaNova.portals.push(portaParaDestino({
    id: indice + 1,
    destino,
    cenaDoDestino: porSlug.get(destino).cena,
    slug
  }));
});

// ---- as salas que a sala nova toca ----
//
// Com `--so-a-sala` (a ronda da autoria, D96), nada disto é escrito: a sala nasce sozinha, e as portas
// do portão e dos destinos são a ronda do fecho (`integrar.mjs`). É o que faz a autoria de catorze
// salas em paralelo não tocar num único ficheiro partilhado.
const tocados = [];

if (!soASala) {
  // O portão ganha a porta para a sala nova, com o retrato dela (é a porta por onde o visitante entra).
  const portao = lerMundo(ENTRY_WORLD);
  if (!portao) morrer('não encontrei ' + ENTRY_WORLD + '.json: sem a porta do portão a sala não é alcançável');
  const idPortao = proximoId(portao.cena);
  portao.cena.assets = portao.cena.assets || {};
  Object.assign(portao.cena.assets, retrato(slug, ENTRY_WORLD, salaNova));
  portao.cena.portals = portao.cena.portals || [];
  portao.cena.portals.push(portaNoPortao({ slug, cenaDaSala: salaNova, id: idPortao }));
  tocados.push(portao);

  // Cada destino ganha a porta de chegada da sala nova (L19).
  for (const destino of destinos) {
    const mundo = lerMundo(destino);
    const id = proximoId(mundo.cena);
    mundo.cena.assets = mundo.cena.assets || {};
    Object.assign(mundo.cena.assets, retrato(slug, destino, salaNova));
    mundo.cena.portals = mundo.cena.portals || [];
    mundo.cena.portals.push(portaDeChegada({ slug, cenaDaSala: salaNova, destino, id }));
    tocados.push(mundo);
  }
}

// ---- escrever (dentro da oficina, D96/M1) ----
//
// Tudo o que esta ferramenta faz daqui para baixo escreve em ficheiros partilhados: a sala nova, o
// portão, cada destino, e depois as quatro derivadas — que reescrevem **todos** os mundos. Dois
// `new-room` ao mesmo tempo perdiam uma porta em duas de três tentativas (medido); a trava é o que
// fecha isso. E custa segundos: medido, as quatro derivadas somam 0,1 a 0,2 s.
//
// Os filhos recebem `ZONAS_TRAVA_OFICINA=1`: já estão dentro da secção crítica do pai, e tentar tomá-la
// outra vez seria ficarem à espera de si próprios.
const correr = (rotulo, script, argumentos, mostrar = 4) => {
  const inicio = Date.now();
  const resultado = spawnSync(process.execPath, [join(ROOT, script), ...argumentos], {
    cwd: ROOT,
    encoding: 'utf8',
    env: Object.assign({}, process.env, { ZONAS_TRAVA_OFICINA: '1' })
  });
  const segundos = ((Date.now() - inicio) / 1000).toFixed(1);
  const saida = (resultado.stdout || '') + (resultado.stderr || '');
  const falhou = resultado.status !== 0;
  console.log('');
  console.log('── ' + rotulo + ' — ' + (falhou ? 'FALHOU' : 'ok') + ' (' + segundos + ' s) ──');
  const linhas = saida.split(/\r?\n/).filter((linha) => linha.trim());
  for (const linha of falhou ? linhas.slice(-12) : linhas.slice(-mostrar)) console.log('  ' + linha);
  return !falhou;
};

// ---- escrever ----

// Atómica: um `new-room` morto a meio não deixa a sala nova truncada (D96, M0).
writeJson(join(MUNDOS, slug + '.json'), salaNova);
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
//
// Ficam dentro da secção crítica de propósito: reescrevem **todos** os mundos.
if (opcoes.ferramentas && soASala) {
  // A ronda da autoria (D102) escreve **só** o ficheiro da própria sala: o portão e as chegadas ficam
  // para o `integrar`. Só o movimento é desta ronda, porque é da própria porta e não muda com as
  // vizinhas. As outras três derivadas mexem no anel da sala (e o anel muda com cada vizinha que nasce),
  // por isso correriam duas vezes sem ganho.
  //
  // O validador fica vermelho por construção em L24/L25 (faltam portas), L19 (faltam chegadas nos
  // destinos), L26 (o anel ainda não foi distribuído) e L9 (faltam retratos). É o esperado: quem fecha
  // é o `integrar`.
  const sorteio = correr('o movimento das portas (sorteio --aplicar)', 'tools/scene/sorteio.mjs',
    [slug, '--aplicar', '--semente', String(Date.now() % 100000)], 8);
  if (!sorteio) {
    console.error('');
    console.error('new-room: o sorteio falhou — o dado está escrito, corrija o que ele disse e volte a correr.');
    process.exitCode = 1;
  }
} else if (opcoes.ferramentas) {
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

oficinaTomada.soltar();

if (soASala) {
  console.log('');
  console.log('--so-a-sala: esta ronda é só a autoria. O portão, as chegadas nos destinos, os anéis e o');
  console.log('  validador completo ficam para o fecho: node tools/scene/integrar.mjs');
  console.log('  Até lá a sala é um esqueleto legal (4 de 5 portas, L24/L25 verdes) e o validador acusa');
  console.log('  L19, L24/L25, L26 e L9 — é o esperado.');
} else {
  console.log('');
  console.log('próximos passos (a spec é `docs/SPEC-NOVA-SALA.md`):');
  console.log('  1. as obras: as linhas na folha `data/obras.tsv` e depois node tools/artwork/from-csv.mjs');
  console.log('  2. o editor: ?world=' + slug + ' — compor a sala e exportar (o esqueleto já traz as portas)');
  console.log('  3. os retratos, sempre duas passagens: node tools/scene/portrait.mjs --todos (×2)');
  console.log('  4. o validador outra vez (os retratos fecham a L9) e node tools/regression/all.mjs --full');
}
