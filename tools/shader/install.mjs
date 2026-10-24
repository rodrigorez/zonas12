#!/usr/bin/env node
// The shader installer (R14/R15): takes a fragment **body**, validates it and, only if it passes,
// writes it to js/shaders/<id>.js and adds the id to the internal list.
//
// Uso:
//   node tools/shader/install.mjs meu.glsl --id meu-shader --name "Meu shader"
//   node tools/shader/install.mjs meu.glsl --id meu-shader --name "Meu shader" --force
//
// O corpo não traz o prelúdio: `uTime`, `vDir`, `az`, `el` e `vec3 col` vêm de
// js/modules/shaders.js. O que o validador mede é o que a exposição vai correr: se não sustentar
// 19 atualizações por segundo no teto de 20, a instalação é recusada. `--force` instala na mesma
// **quando é só a cadência a falhar** (um corpo que não compila, ou que não pinta nada, é recusado
// sempre), e o módulo fica com o aviso e o número medido — não é um aceite silencioso.
//
// O ficheiro instalado é a fonte de verdade a partir daí; o `.glsl` foi só o transporte.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { ROOT } from '../regression/harness.mjs';
import { checkSource, measure, verdict, readBody, LIMITS } from './measure.mjs';

const ID = /^[a-z][a-z0-9-]*$/;
const REGISTRY = join(ROOT, 'js', 'modules', 'shaders.js');

function parseArgs(argv) {
  const options = { id: null, name: null, force: false, file: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--force') options.force = true;
    else if (arg === '--id') options.id = argv[++i];
    else if (arg === '--name') options.name = argv[++i];
    else if (!arg.startsWith('--')) options.file = arg;
  }
  return options;
}

// `grade-neon` -> `gradeNeon`; the registry imports a binding, not a string.
function identifierOf(id) {
  return id.split('-').map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1))).join('');
}

function moduleText(id, name, body, forced) {
  const escaped = body.trim()
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
  const warning = forced
    ? `// ATENÇÃO: instalado com --force; a validação não atingiu o mínimo de ${LIMITS.minRate} ` +
      `atualizações/s. Isto é ensaio, não é um aceite de desempenho.\n`
    : '';
  return `// ${name} — installed by tools/shader/install.mjs.\n` +
    `//\n` +
    `// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve \`vec3 col\`, usa\n` +
    `// \`uTime\`/\`az\`/\`el\` e não lê texturas nem código externo.\n` +
    warning +
    `export const shader = {\n` +
    `  id: ${JSON.stringify(id)},\n` +
    `  name: ${JSON.stringify(name)},\n` +
    `  body: \`${escaped}\`\n` +
    `};\n`;
}

// The two marked blocks of js/modules/shaders.js are the only thing this tool edits. The list is
// rebuilt with its commas in the right place, so adding an id never leaves a trailing comma.
function register(id) {
  const text = readFileSync(REGISTRY, 'utf8');
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const identifier = identifierOf(id);

  if (text.includes(`from '../shaders/${id}.js'`)) {
    return { changed: false, identifier };
  }

  const importLine = `import { shader as ${identifier} } from '../shaders/${id}.js';`;
  const withImport = text.replace(
    /(\/\/ shaders:imports end)/,
    `${importLine}${eol}$1`
  );
  if (withImport === text) throw new Error('não encontrei o marcador "shaders:imports end"');

  const listPattern = /(\/\/ shaders:list begin)([\s\S]*?)(\/\/ shaders:list end)/;
  const found = listPattern.exec(withImport);
  if (!found) throw new Error('não encontrei o marcador "shaders:list end"');
  const current = found[2].split(/\r?\n/)
    .map((line) => line.trim().replace(/,$/, ''))
    .filter(Boolean);
  if (!current.includes(identifier)) current.push(identifier);
  const list = current.map((entry, index) => `  ${entry}${index === current.length - 1 ? '' : ','}`).join(eol);
  const updated = withImport.replace(listPattern,
    `$1${eol}${list}${eol}  $3`);
  writeFileSync(REGISTRY, updated, 'utf8');
  return { changed: true, identifier };
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.file) {
    console.error('uso: node tools/shader/install.mjs <ficheiro.glsl> --id <id> --name "<nome>" [--force]');
    process.exitCode = 1;
    return;
  }
  const id = options.id || basename(options.file, extname(options.file));
  if (!ID.test(id)) {
    console.error(`install.mjs: "${id}" não serve de id (minúsculas, dígitos e hífen, a começar por letra)`);
    process.exitCode = 1;
    return;
  }
  const name = options.name || id;
  const body = readBody(options.file);

  const check = checkSource(body);
  if (!check.ok) {
    console.error(`install.mjs: ${id} não obedece ao contrato:`);
    check.errors.forEach((error) => console.error('  · ' + error));
    process.exitCode = 1;
    return;
  }

  console.log(`a validar ${id} (${Buffer.byteLength(body, 'utf8')} B) num Chrome sem cabeça…`);
  const measurement = await measure(body);
  const result = verdict(measurement);
  console.log(`  compila: ${measurement.problems && measurement.problems.length ? 'não' : 'sim'}`);
  (measurement.problems || []).forEach((problem) => console.log('    · ' + problem));
  console.log(`  atualizações: ${measurement.updates} em ${measurement.seconds.toFixed(1)} s → ` +
    `${measurement.rate.toFixed(1)}/s (mínimo ${LIMITS.minRate}, teto ${LIMITS.targetFps})`);
  console.log(`  p95: ${measurement.p95.toFixed(1)} ms; brilho medido: ${measurement.brightest}`);
  result.errors.forEach((error) => console.log('  erro: ' + error));
  result.warnings.forEach((warning) => console.log('  aviso: ' + warning));

  if (!result.ok && !(options.force && result.fatal.length === 0)) {
    console.error(`\n${id} NÃO foi instalado. Corrige o shader` +
      (result.fatal.length ? ' (o que falhou não se perdoa com --force).' : ', ou usa --force para o ensaio.'));
    process.exitCode = 1;
    return;
  }

  const file = join(ROOT, 'js', 'shaders', id + '.js');
  const replaced = existsSync(file);
  writeFileSync(file, moduleText(id, name, body, !result.ok), 'utf8');
  const registry = register(id);

  console.log('');
  console.log(`${replaced ? 'substituído' : 'instalado'}: js/shaders/${id}.js`);
  console.log(`registo: ${registry.changed ? 'acrescentado' : 'já lá estava'} (${registry.identifier})`);
  if (!result.ok) console.log('AVISO: instalado com --force — a cadência não passou.');
  console.log('');
  console.log('A seguir:');
  console.log('  node tools/scene/validate.mjs');
  console.log('  node tools/regression/shader.mjs');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
