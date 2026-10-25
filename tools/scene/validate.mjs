#!/usr/bin/env node
// Confere os ficheiros da cena contra a forma do formato e as leis da cena (docs/ROADMAP.md,
// secao 8).
//
// O trabalho todo vive em js/scene/validation.js — o mesmo módulo que a consola da exposição
// corre ao arrancar e que o editor (Fase 4) vai reutilizar. Aqui só se lê o disco, se respondem as
// perguntas que só a linha de comando pode responder (o ficheiro do asset existe? que forma tem a
// imagem? que mundos existem?) e se escreve o relatório.
//
// Já não confere contra o index.html: desde a Fase 3 a cena vem dos dados, e a fidelidade da
// conversão foi provada pelo conversor, campo a campo, contra o último JSON do formato anterior
// (190 valores, 0 diferenças não previstas) — a partir daí o JSON é a verdade. A migração para o
// formato 3 (Fase 3B, bloco B2) provou-se da mesma maneira, pelo tools/migration/scene-v3.mjs.
//
// Uso: node tools/scene/validate.mjs [ficheiro...]
//      (por omissão: os mundos de data/worlds/ quando existem, senão
//       data/scene.json e data/scene-example.json)

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateScene, unreachableWorlds, missingArrivals } from '../../js/scene/validation.js';
import { checkArranques } from './arranques.mjs';
import { diskQuestions } from './disk.mjs';
import { ENTRY_WORLD } from '../../js/modules/portal-kinds.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

// O mundo de entrada é o portão (D24), e é dele que se parte para saber se alguma sala ficou sem
// caminho. O nome vem da tabela dos eixos, que é onde ele já vive para a porta de mundo navegar.
//
// O fixture (D9) não é uma sala: é um ficheiro de ensaio que se abre com `?scene=example`, e ninguém
// chega a ele por uma porta — por isso fica fora do grafo, e não é reportado como inalcançável. O
// `shader` é o ensaio da Fase 7 (R14/R15): abre-se com `?scene=shader` e mede a cadência do fundo,
// não é um mundo que se visite.
const FIXTURES = ['example', 'shader'];

// Um caminho absoluto já é erro de L12; não vale a pena perguntar ao disco por ele.
const exists = (assetPath) => (/^([a-zA-Z]:[\\/]|[\\/])/.test(assetPath) ? undefined : existsSync(join(root, assetPath)));

// A forma de uma imagem, lida do cabeçalho do ficheiro e sem a descodificar (lei L14). Só JPEG e
// PNG, que é o que os panoramas são. Vive em `disk.mjs` desde a Fase 5: o servidor que grava
// pergunta-lhe o mesmo, e uma segunda cópia seria uma segunda resposta sobre o mesmo ficheiro.
const { imageSize } = diskQuestions(root);

// Os mundos que existem: um ficheiro por mundo em data/worlds/ (D24). Sem a pasta, a lei L11 e o
// grafo ficam por verificar — e é isso que se diz, em vez de se dar como bom.
function loadWorlds() {
  const directory = join(root, 'data', 'worlds');
  const worlds = new Map();
  if (!existsSync(directory)) return worlds;
  for (const name of readdirSync(directory).filter((entry) => entry.endsWith('.json'))) {
    const scene = JSON.parse(readFileSync(join(directory, name), 'utf8'));
    const slug = (scene.world && scene.world.slug) || basename(name, '.json');
    worlds.set(slug, { file: 'data/worlds/' + name, scene });
  }
  return worlds;
}

const worlds = loadWorlds();
const files = process.argv.length > 2
  ? process.argv.slice(2)
  : (worlds.size > 0 ? [...worlds.values()].map((world) => world.file) : ['data/scene.json', 'data/scene-example.json']);

const options = { exists, imageSize };
if (worlds.size > 0) options.worldExists = (slug) => worlds.has(slug);

let failed = 0;
const validated = [];

for (const file of files) {
  let scene;
  try {
    scene = JSON.parse(readFileSync(resolve(root, file), 'utf8'));
  } catch (error) {
    console.error(`${file}: ${error.message}`);
    failed++;
    continue;
  }

  validated.push(scene);

  const report = validateScene(scene, options);
  const counts = report.summary
    ? `${report.summary.dimensions} dimensions, ${report.summary.artworks} artworks, ` +
      `${report.summary.portals} portals, ${report.summary.assets} assets, ` +
      `${report.summary.distinctWindows} distinct windows`
    : 'nothing to measure';
  console.log(`${file}: ${report.ok ? 'OK' : 'FAILED'} (${counts})`);
  for (const note of report.skipped) console.log(`  note: ${note}`);
  for (const warning of report.warnings) console.log(`  warning: ${warning}`);
  for (const error of report.errors) console.error(`  error: ${error}`);
  if (!report.ok) failed++;
}

// O grafo: todas as salas têm de ser alcançáveis a partir do portão (D14). Vale a pena só quando
// há mais do que um mundo — com um ficheiro só não há grafo nenhum.
if (worlds.size > 1) {
  const rooms = validated.filter((scene) => !FIXTURES.includes(scene.world.slug));
  const unreachable = unreachableWorlds(rooms, ENTRY_WORLD);
  console.log(`world graph: ${rooms.length} rooms` +
    (worlds.size > rooms.length ? ` (+${worlds.size - rooms.length} fixture)` : '') +
    (unreachable.length ? ', unreachable: ' + unreachable.join(', ') : `, all reachable from ${ENTRY_WORLD}`));
  if (unreachable.length) failed++;

  // L19: uma porta que navega tem, no destino, uma porta que se declara a chegada dessa origem. O
  // aviso é o mesmo que a exposição dá ao aterrar; aqui é dito antes de alguém a atravessar. As
  // portas do fixture ficam de fora: ele não faz parte do grafo (ninguém chega a ele por uma porta)
  // e existe para exercitar os mecanismos — o que ele navega chega a uma sala com `?from=example`,
  // onde o comportamento é o do runtime. Um aviso, e não um erro, porque o visitante chega: só não
  // chega ao sítio escolhido por ninguém.
  const gaps = missingArrivals(rooms);
  console.log('arrivals: ' + (gaps.length === 0
    ? `every door has a door saying it is the arrival (L19)`
    : `${gaps.length} door(s) without an arrival to land behind (L19)`));
  for (const gap of gaps) {
    console.log(`  warning: ${gap.from} -> ${gap.to}: portals[${gap.portals.join(', ')}] and no door of ` +
      `"${gap.to}" says it is the arrival from "${gap.from}" — the visitor starts where the camera says`);
  }

  // D53: a janela de uma porta de mundo que desenha o fundo do destino **ao vivo** tem de nomear o
  // shader que o destino desenha. Um shader trocado aqui não é um detalhe: a porta passaria a mentir
  // sobre a sala do outro lado, e é a única coisa que ela promete.
  const desencontros = [];
  const silenciosas = [];
  for (const scene of rooms) {
    for (const portal of scene.portals || []) {
      const janela = portal.window || {};
      const alvo = portal.action && portal.action.target;
      if (janela.kind !== 'preview' || !alvo) continue;
      const destino = rooms.find((outro) => outro.world.slug === alvo);
      if (!destino) continue;
      const dimensao = (destino.dimensions || []).find((entrada) => entrada.id === 0) || {};
      if (!janela.shaderId) {
        if (dimensao.kind === 'shader') {
          silenciosas.push(`${scene.world.slug} portas[${portal.id}]: a janela mostra o retrato "${janela.asset}" ` +
            `e "${alvo}" desenha "${dimensao.shaderId}" — a janela fica parada (D53)`);
        }
        continue;
      }
      if (dimensao.kind !== 'shader') {
        desencontros.push(`${scene.world.slug} portas[${portal.id}]: a janela desenha "${janela.shaderId}" ` +
          `mas "${alvo}" não tem shader (dimensão 0 é "${dimensao.kind}")`);
        continue;
      }
      if (dimensao.shaderId !== janela.shaderId) {
        desencontros.push(`${scene.world.slug} portas[${portal.id}]: a janela desenha "${janela.shaderId}" ` +
          `e "${alvo}" desenha "${dimensao.shaderId}"`);
      }
    }
  }
  console.log('windows: ' + (desencontros.length === 0
    ? 'every live window names the shader its destination draws (D53)'
    : `${desencontros.length} window(s) naming another shader (D53)`));
  for (const desencontro of desencontros) console.error(`  error: ${desencontro}`);
  if (desencontros.length) failed++;
  for (const silenciosa of silenciosas) console.log(`  warning: ${silenciosa}`);
}

// ---- os arranques (D28) ----
//
// O trabalho todo vive em tools/scene/arranques.mjs: aqui só se diz onde está o disco. Só a linha de
// comando pode perguntar isto — a página não sabe que ficheiros existem ao lado dela. O fixture
// fica de fora: é um ficheiro de ensaio, abre-se com `?scene=example` e não tem endereço.
if (worlds.size > 0) {
  const slugs = [...worlds.keys()].filter((slug) => !FIXTURES.includes(slug));
  const report = checkArranques(slugs, {
    entry: ENTRY_WORLD,
    read: (relative) => (existsSync(resolve(root, relative)) ? readFileSync(resolve(root, relative), 'utf8') : null)
  });
  console.log(`arranques: ${report.checked.length} world(s) with an arranque` +
    (report.errors.length ? '' : ', the same file outside the <base> line'));
  for (const error of report.errors) console.error(`  error: ${error}`);
  if (report.errors.length) failed++;
}

if (failed) {
  console.error(`${failed} file(s) failed`);
  process.exit(1);
}
