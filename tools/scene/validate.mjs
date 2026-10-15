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
import { validateScene, unreachableWorlds } from '../../js/scene/validation.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

// O mundo de entrada é o portão, que é a página da raiz (D24). É dele que se parte para saber se
// alguma sala ficou sem caminho.
const ENTRY_WORLD = 'gate';

// Um caminho absoluto já é erro de L12; não vale a pena perguntar ao disco por ele.
const exists = (assetPath) => (/^([a-zA-Z]:[\\/]|[\\/])/.test(assetPath) ? undefined : existsSync(join(root, assetPath)));

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

const options = { exists };
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
  const unreachable = unreachableWorlds(validated, ENTRY_WORLD);
  console.log(`world graph: ${worlds.size} worlds, ` +
    (unreachable.length ? 'unreachable: ' + unreachable.join(', ') : 'all reachable from ' + ENTRY_WORLD));
  if (unreachable.length) failed++;
}

if (failed) {
  console.error(`${failed} file(s) failed`);
  process.exit(1);
}
