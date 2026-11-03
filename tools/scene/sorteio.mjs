#!/usr/bin/env node
// O movimento das portas de uma sala nova, sorteado e escrito no dado (D87).
//
// Porque existe: a §10 da `docs/SPEC-NOVA-SALA.md` decidiu que o movimento das portas de uma sala nova
// **não é escolha do autor** — é sorteado, para que nenhuma sala se pareça com outra. As regras:
//
//   translação   eixo X ou Y; amplitude = metade da dimensão do eixo; período em [10, 20] s
//   rotação      eixo X, Y ou Z; ângulo 45° ou 90°; período em [10, 20] s (independente)
//   piso         o sorteio repete enquanto o alcance do visitante (lei L29) for < 50% do ciclo
//
// O que o sorteio **não** muda é a pose de repouso: a fase 0 do seno é a pose do dado. É isso que
// mantém a L16 verdadeira, o retrato cozido válido e o `prefers-reduced-motion` com uma sala alcançável.
//
// A conta do alcance vive em `js/scene/reach.js` — a mesma que o validador usa para provar o dado,
// para não haver dois números. Aqui lê-se o disco, imprime-se a tabela e, só com `--aplicar`,
// escreve-se (como o `ring.mjs` e o `azimuths.mjs`).
//
// Uso: node tools/scene/sorteio.mjs <mundo> [--aplicar] [--semente N]
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { alcanceDaPorta, chegadaVarrida, ALCANCE_MINIMO } from '../../js/scene/reach.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const directory = join(root, 'data', 'worlds');

const args = process.argv.slice(2);
const apply = args.includes('--aplicar');
const sementeArg = args.indexOf('--semente');
const semente = sementeArg >= 0 ? Number(args[sementeArg + 1]) : Date.now();
const wanted = args.filter((arg, index) =>
  !arg.startsWith('--') && (sementeArg < 0 || index !== sementeArg + 1));

if (!wanted.length) {
  console.error('diz o mundo: node tools/scene/sorteio.mjs <mundo> [--aplicar] [--semente N]');
  process.exit(1);
}

// Um PRNG pequeno e determinístico (mulberry32): a mesma semente dá sempre a mesma sala, e o número
// fica impresso para se poder repetir. `Math.random` seria mais curto e não se reproduzia.
const aleatorioDe = (valor) => {
  let a = valor >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const EIXOS = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const NOMES = ['X', 'Y', 'Z'];
const PERIODO_MIN = 10;
const PERIODO_MAX = 20;

const worlds = new Map();
const files = new Map();
for (const name of readdirSync(directory).filter((entry) => entry.endsWith('.json'))) {
  const text = readFileSync(join(directory, name), 'utf8');
  const scene = JSON.parse(text);
  const slug = (scene.world && scene.world.slug) || basename(name, '.json');
  worlds.set(slug, scene);
  files.set(slug, { name, eol: text.includes('\r\n') ? '\r\n' : '\n' });
}

// A amplitude sai da porta: metade da largura no eixo X e metade da altura no eixo Y. Uma porta sem
// `width`/`height` não pode ser sorteada — e diz-se, em vez de se inventar um número.
function amplitudeDoEixo(portal, eixo) {
  const valor = eixo === 0 ? portal.width : portal.height;
  return typeof valor === 'number' && valor > 0 ? valor / 2 : null;
}

// Um sorteio completo, com a rejeição da L29. Devolve também quantas tentativas custou, porque é esse
// número que diz se o piso está bem posto (a §10.3 mede 1,33).
function sortear(aleatorio, portal) {
  let tentativas = 0;
  let ultimo = null;
  for (;;) {
    tentativas++;
    const eixoTranslacao = aleatorio() < 0.5 ? 0 : 1;
    const amplitude = amplitudeDoEixo(portal, eixoTranslacao);
    if (amplitude === null) return { erro: 'sem width/height para tirar a amplitude' };
    const eixoRotacao = Math.floor(aleatorio() * 3);
    const angle = aleatorio() < 0.5 ? 45 : 90;
    // Os períodos com uma casa decimal: [10,0 · 20,0] s.
    const period = Math.round((PERIODO_MIN + aleatorio() * (PERIODO_MAX - PERIODO_MIN)) * 10) / 10;
    const rotationPeriod = Math.round((PERIODO_MIN + aleatorio() * (PERIODO_MAX - PERIODO_MIN)) * 10) / 10;
    const motion = {
      kind: 'sway',
      axis: EIXOS[eixoTranslacao],
      amplitude,
      period,
      rotationAxis: EIXOS[eixoRotacao],
      angle,
      rotationPeriod
    };
    const alcance = alcanceDaPorta({ ...portal, motion: motion });
    ultimo = { motion, alcance: alcance.percentagem, tentativas, eixoTranslacao, eixoRotacao, angle };
    if (alcance.percentagem >= ALCANCE_MINIMO) return ultimo;
  }
}

const aleatorio = aleatorioDe(semente);
const pad = (valor, largura) => String(valor).padStart(largura);
const linhas = [];
let aceites = 0;

for (const slug of wanted) {
  const scene = worlds.get(slug);
  if (!scene) {
    console.error('mundo desconhecido: ' + slug + ' (há: ' + [...worlds.keys()].join(', ') + ')');
    process.exit(1);
  }
  const portas = scene.portals || [];
  if (!portas.length) {
    console.error(slug + ' não tem portas — não há nada para sortear');
    process.exit(1);
  }
  console.log('== ' + slug + ' · ' + portas.length + ' porta(s) · semente ' + semente + ' ==');
  let tentativas = 0;
  for (const portal of portas) {
    const sorteio = sortear(aleatorio, portal);
    if (sorteio.erro) {
      console.error('  porta ' + portal.id + ': ' + sorteio.erro);
      process.exit(1);
    }
    const varre = chegadaVarrida({ ...portal, motion: sorteio.motion });
    tentativas += sorteio.tentativas;
    aceites++;
    console.log('  porta ' + pad(portal.id, 3) + ' -> ' +
      (portal.action && portal.action.target ? portal.action.target : (portal.action || {}).kind) +
      ' | translação ' + NOMES[sorteio.eixoTranslacao] + ' ±' + sorteio.motion.amplitude.toFixed(1) +
      ' m (' + sorteio.motion.period.toFixed(1) + ' s)' +
      ' | rotação ' + NOMES[sorteio.eixoRotacao] + ' ±' + sorteio.angle + '° (' +
      sorteio.motion.rotationPeriod.toFixed(1) + ' s)' +
      ' | alcance ' + pad(sorteio.alcance.toFixed(1), 5) + '%' +
      ' | varre a chegada ' + pad(varre.percentagem.toFixed(1), 5) + '%' +
      (sorteio.tentativas > 1 ? ' | ' + sorteio.tentativas + ' tentativas' : ''));
    portal.motion = sorteio.motion;
  }
  linhas.push({ slug, tentativas });
}

const rejeitados = linhas.reduce((soma, linha) => soma + linha.tentativas, 0) - aceites;
console.log('\n' + aceites + ' portas · ' + aceites + ' aceites · ' + rejeitados + ' rejeitados' +
  (aceites ? ' (' + (rejeitados / aceites).toFixed(2) + ' por porta)' : ''));

if (!apply) {
  console.log('ensaio: nada foi escrito (corre com --aplicar para escrever)');
  // A semente vai **na última linha** de propósito: é o que o `new-room.mjs` mostra de cada ferramenta
  // (as últimas linhas), e sem ela o autor não conseguia repetir o sorteio de que gostou. Medido: a
  // primeira versão imprimia a semente só no cabeçalho, e o atalho a deitava fora.
  console.log('semente ' + semente + ' — repete este sorteio com --semente ' + semente);
  process.exit(0);
}

for (const slug of wanted) {
  const file = files.get(slug);
  const texto = JSON.stringify(worlds.get(slug), null, 2).replace(/\n/g, file.eol) + file.eol;
  writeFileSync(join(directory, file.name), texto, 'utf8');
  console.log('escrito data/worlds/' + file.name + ' (fim de linha ' +
    (file.eol === '\r\n' ? 'CRLF' : 'LF') + ')');
}
// A semente, no fim, pela mesma razão do ensaio: é a única maneira de repetir este sorteio.
console.log('semente ' + semente + ' — repete este sorteio com --semente ' + semente);
