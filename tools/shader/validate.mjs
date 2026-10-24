#!/usr/bin/env node
// The shader validator (R14/R15): compiles a body against the prelude, measures it in a real WebGL
// context and refuses what cannot keep the cadence.
//
// Uso:
//   node tools/shader/validate.mjs shader.glsl          um ficheiro (o corpo, sem prelúdio)
//   node tools/shader/validate.mjs --id grade-neon      um shader já instalado
//   node tools/shader/validate.mjs --all                todos os instalados
//   --force                                             perdoa a cadência; nunca um erro de compilação
//   --seconds 5                                         duração da medição
//
// O que ele responde, e nesta ordem:
//   1. o corpo obedece ao contrato do prelúdio (só `uTime`, sem texturas, sem #, sem discard…);
//   2. compila e liga no WebGL;
//   3. desenha (os pontos medidos não são pretos);
//   4. entrega pelo menos 19 atualizações por segundo no teto de 20 (o orçamento da política).
// O veredicto é um código de saída: 0 passa, 1 falha.
import { basename, extname } from 'node:path';
import { checkSource, measure, verdict, readBody, LIMITS } from './measure.mjs';
import { SHADERS } from '../../js/modules/shaders.js';

function parseArgs(argv) {
  const options = { force: false, all: false, id: null, seconds: LIMITS.seconds, file: null };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--force') options.force = true;
    else if (arg === '--all') options.all = true;
    else if (arg === '--id') options.id = argv[++i];
    else if (arg === '--seconds') options.seconds = Number(argv[++i]);
    else if (!arg.startsWith('--')) options.file = arg;
  }
  return options;
}

function show(id, name, body, result, forgiven) {
  const state = result.ok ? 'PASSA' : (forgiven ? 'PASSA (--force)' : 'RECUSA');
  console.log('');
  console.log(`── ${id}${name ? ' · ' + name : ''} — ${state} ──`);
  console.log(`  corpo: ${Buffer.byteLength(body, 'utf8')} B`);
  if (result.check) {
    console.log(`  contrato: ${result.check.ok ? 'ok' : 'falhou'}`);
    result.check.errors.forEach((error) => console.log('    · ' + error));
  }
  if (result.measurement) {
    const m = result.measurement;
    console.log(`  compila e liga: ${m.problems && m.problems.length ? 'não' : 'sim'}`);
    (m.problems || []).forEach((problem) => console.log('    · ' + problem));
    console.log(`  atualizações: ${m.updates} em ${m.seconds.toFixed(1)} s → ${m.rate.toFixed(1)}/s ` +
      `(mínimo ${LIMITS.minRate}, teto ${LIMITS.targetFps})`);
    console.log(`  p95 de quadro: ${m.p95.toFixed(1)} ms (${m.frames} quadros)`);
    console.log(`  desenhou: ${m.brightest > 0 ? 'sim' : 'NÃO'} (brilho ${m.brightest})`);
  }
  result.verdict.errors.forEach((error) => console.log('  erro: ' + error));
  result.verdict.warnings.forEach((warning) => console.log('  aviso: ' + warning));
}

// `--force` perdoa a cadência, e só ela: um corpo que não compila ou que não pinta nada continua a
// ser recusado, porque não há ensaio possível com um fundo preto.
function passes(verdictResult, options) {
  return verdictResult.ok || (options.force && verdictResult.fatal.length === 0);
}

async function validateBody(id, name, body, options) {
  const check = checkSource(body);
  if (!check.ok) {
    const result = { ok: false, check, measurement: null, verdict: { ok: false, fatal: check.errors, errors: check.errors, warnings: [] } };
    show(id, name, body, result, false);
    return result;
  }
  const measurement = await measure(body, { seconds: options.seconds });
  const result = verdict(measurement, { seconds: options.seconds });
  const ok = passes(result, options);
  const shown = { ok: result.ok, check, measurement, verdict: result };
  show(id, name, body, shown, ok && !result.ok);
  return Object.assign({ ok }, shown);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.all) {
    let failed = 0;
    for (const shader of SHADERS) {
      const result = await validateBody(shader.id, shader.name, shader.body, options);
      if (!result.ok) failed++;
    }
    console.log('');
    console.log(`${SHADERS.length - failed} de ${SHADERS.length} shader(s) passam`);
    process.exitCode = failed ? 1 : 0;
    return;
  }

  let id;
  let name;
  let body;
  if (options.id) {
    const shader = SHADERS.find((entry) => entry.id === options.id);
    if (!shader) {
      console.error(`validate.mjs: "${options.id}" não está instalado (ids: ${SHADERS.map((entry) => entry.id).join(', ')})`);
      process.exitCode = 1;
      return;
    }
    id = shader.id;
    name = shader.name;
    body = shader.body;
  } else if (options.file) {
    body = readBody(options.file);
    id = basename(options.file, extname(options.file));
    name = null;
    if (/export\s+const\s+shader/.test(body)) {
      console.error('validate.mjs: passa o corpo do fragment (o texto entre o prelúdio e a chave final), ' +
        'não um módulo já instalado — para esse, usa --id.');
      process.exitCode = 1;
      return;
    }
  } else {
    console.error('uso: node tools/shader/validate.mjs <ficheiro.glsl> | --id <id> | --all [--force] [--seconds N]');
    process.exitCode = 1;
    return;
  }

  const result = await validateBody(id, name, body, options);
  if (!result.ok) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
