// O comando único da verificação (roadmap §9, Fase 6): uma bateria, um veredicto.
//
// Porque existe: cada instrumento do projeto já corre sozinho (`node tools/scene/validate.mjs`,
// `node tools/regression/twelve-tests.mjs`, …), mas a aceitação de uma fase era uma lista de
// comandos que cada um tinha de lembrar por ordem. Este ficheiro é a lista — e o que ele devolve é
// um código de saída: **0** quando tudo passa, **1** quando alguma coisa falha, para poder ser o
// `npm test` deste projeto (que não tem `package.json`, D1).
//
// O que corre por omissão são as três camadas que decidem uma fase:
//   · o dado — o validador dos mundos e as leis com as avarias injectadas (node, segundos);
//   · a cena — os doze testes (T2–T12) nas 5 páginas;
//   · as portas — o T1 e o T7/T11, que precisam de navegações de página.
//
// As baterias arquivadas (a costura, a ponte, os rótulos, o botão, a transição — Fases 4 e 5 — e o
// fundo shader da Fase 7) abrem um Chrome cada uma e somam minutos: ficam atrás de `--full`, que é o
// que se corre antes de publicar.
//
// Uso, da raiz do projeto:
//
//   node tools/regression/all.mjs            a verificação da fase (minutos)
//   node tools/regression/all.mjs --full     a mesma coisa mais as baterias arquivadas
//
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { ROOT } from './harness.mjs';

const NUCLEO = [
  { nome: 'o dado: os 6 mundos, as leis, o grafo e os arranques', script: 'tools/scene/validate.mjs' },
  { nome: 'as leis: 21 avarias injectadas e o controlo limpo', script: 'tools/scene/laws-selftest.mjs' }
];

const CENA = [
  { nome: 'a cena: os doze testes (T2–T12) nas 5 páginas', script: 'tools/regression/twelve-tests.mjs' },
  { nome: 'as portas: o T1 e a chegada (T7/T11)', script: 'tools/regression/traversal-tests.mjs' }
];

const ARQUIVADAS = [
  // Fase 7 (B9): a política do shader sem GPU e as duas páginas com uma. Abre um Chrome, como as
  // outras desta lista.
  { nome: 'o fundo shader (R14/R15)', script: 'tools/regression/shader.mjs' },
  { nome: 'a costura das travessias (D46)', script: 'tools/regression/seam.mjs' },
  { nome: 'a chegada por uma porta (D37)', script: 'tools/regression/camera-arrival.mjs' },
  { nome: 'a ponte de imagem (D43)', script: 'tools/regression/image-bridge.mjs' },
  { nome: 'os rótulos das obras (D40)', script: 'tools/regression/labels-artworks.mjs' },
  { nome: 'os rótulos das portas (D39)', script: 'tools/regression/labels-doors.mjs' },
  { nome: 'o botão de entrada (D41)', script: 'tools/regression/start-button.mjs' },
  { nome: 'a transição (D42)', script: 'tools/regression/transition.mjs' }
];

// 25 minutos por bateria: nesta máquina a mais lenta (os doze) leva ~10, e uma bateria que não
// termina em 25 não está a medir — está pendurada.
const LIMITE_MS = 25 * 60 * 1000;

function correr(bateria) {
  const inicio = Date.now();
  console.log('');
  console.log('── ' + bateria.nome + ' ──');
  // O limite é uma rede, não uma expectativa: a bateria mais lenta (os doze, nas 5 páginas) leva
  // uns 10 minutos nesta máquina. Sem ele, um Chrome que não fecha trava a verificação para sempre.
  const processo = spawnSync(process.execPath, [join(ROOT, bateria.script)],
    { cwd: ROOT, stdio: 'inherit', timeout: LIMITE_MS });
  const expirou = processo.signal === 'SIGTERM' || processo.error !== undefined;
  if (expirou) console.log('  (sem fim depois de ' + Math.round(LIMITE_MS / 60000) + ' min: interrompida)');
  return {
    ...bateria,
    falhou: expirou || processo.status !== 0,
    ms: Date.now() - inicio,
    codigo: processo.status
  };
}

function main() {
  const completo = process.argv.includes('--full');
  const baterias = completo ? [...NUCLEO, ...CENA, ...ARQUIVADAS] : [...NUCLEO, ...CENA];
  console.log('zonas12 — a verificação' + (completo ? ' (com as baterias arquivadas)' : '') +
    ': ' + baterias.length + ' bateria(s)');
  if (!completo) console.log('  (as baterias arquivadas das Fases 4, 5 e 7 ficam atrás de --full)');

  const resultados = [];
  for (const bateria of baterias) resultados.push(correr(bateria));

  console.log('');
  console.log('== resumo ==');
  for (const resultado of resultados) {
    const tempo = (resultado.ms / 1000).toFixed(1).padStart(5) + ' s';
    console.log((resultado.falhou ? 'FAIL ' : 'ok   ') + tempo + '  ' + resultado.nome);
  }

  const falhadas = resultados.filter((resultado) => resultado.falhou);
  const total = (resultados.reduce((soma, resultado) => soma + resultado.ms, 0) / 1000).toFixed(1);
  console.log('');
  if (falhadas.length) {
    console.log(falhadas.length + ' de ' + resultados.length + ' baterias falharam (' + total +
      ' s): ' + falhadas.map((resultado) => resultado.script).join(', '));
    process.exit(1);
  }
  console.log(resultados.length + ' de ' + resultados.length + ' baterias passaram (' + total + ' s)');
}

main();
