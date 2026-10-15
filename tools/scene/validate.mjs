#!/usr/bin/env node
// Confere os ficheiros da cena contra a forma do formato e as leis da cena (docs/ROADMAP.md,
// secao 8).
//
// O trabalho todo vive em js/scene/validation.js — o mesmo módulo que a consola da exposição
// corre ao arrancar e que o editor (Fase 4) vai reutilizar. Aqui só se lê o disco, se responde à
// única pergunta que só a linha de comando pode responder (o ficheiro do asset existe?) e se
// escreve o relatório.
//
// Já não confere contra o index.html: desde a Fase 3 a cena vem dos dados, e a fidelidade da
// conversão foi provada pelo conversor, campo a campo, contra o último JSON do formato anterior
// (190 valores, 0 diferenças não previstas) — a partir daí o JSON é a verdade.
//
// Uso: node tools/scene/validate.mjs [ficheiro...]
//      (por omissão: data/scene.json e data/scene-example.json)

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateScene } from '../../js/scene/validation.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

const files = process.argv.length > 2 ? process.argv.slice(2) : ['data/scene.json', 'data/scene-example.json'];

// Um caminho absoluto já é erro de L12; não vale a pena perguntar ao disco por ele.
const exists = (assetPath) => (/^([a-zA-Z]:[\\/]|[\\/])/.test(assetPath) ? undefined : existsSync(join(root, assetPath)));

let failed = 0;

for (const file of files) {
  let scene;
  try {
    scene = JSON.parse(readFileSync(resolve(root, file), 'utf8'));
  } catch (error) {
    console.error(`${file}: ${error.message}`);
    failed++;
    continue;
  }

  const report = validateScene(scene, { exists });
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

if (failed) {
  console.error(`${failed} file(s) failed`);
  process.exit(1);
}
