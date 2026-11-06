#!/usr/bin/env node
// Corre `portrait.mjs` em vagas de N, sobre uma lista de pares.
//
// Porque existe: 61 pares a 183 s cada sao 3,1 h a correr um de cada vez, e a medicao mostrou que 4
// processos ao mesmo tempo levam 200 s em vez de 732 s (3,66x). O `portrait.mjs` ja toma a oficina em
// volta da escrita, e cada par escreve ficheiros diferentes - o paralelismo e so no render, que nao
// disputa nada.
//
// Uso: node tools/scene/retratos-em-vagas.mjs --do-dado [--vagas 4] [--passagem 2]
//      node tools/scene/retratos-em-vagas.mjs <pares.json> [--vagas 4] [--passagem 2]
//
// `--do-dado` lê os pares do próprio dado (`portas-com-retrato.mjs`, a mesma leitura que o
// `portrait.mjs` usa) — é o caminho normal, porque uma lista à mão envelhece a cada porta nova.
// `pares.json` é uma lista de `{ destino, origem }`, para repetir só um subconjunto. As vagas são
// reutilizadas: quando um processo acaba, entra o próximo. Uma falha não para a vaga — é contada no
// fim, para se poder repetir só ela.
import { readFileSync, writeFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { ROOT } from '../regression/harness.mjs';
import { portasDoDado } from './portas-com-retrato.mjs';

const argumentos = process.argv.slice(2);
const doDado = argumentos.includes('--do-dado');
const ficheiro = argumentos.find((arg) => !arg.startsWith('--') && arg.endsWith('.json'));
if (!doDado && !ficheiro) {
  console.error('uso: node tools/scene/retratos-em-vagas.mjs --do-dado [--vagas 4]');
  console.error('     node tools/scene/retratos-em-vagas.mjs <pares.json> [--vagas 4]');
  process.exit(1);
}
const vagas = (() => {
  const indice = argumentos.indexOf('--vagas');
  return indice > 0 ? Math.max(1, Number(argumentos[indice + 1]) || 4) : 4;
})();
const passagem = (() => {
  const indice = argumentos.indexOf('--passagem');
  return indice > 0 ? Number(argumentos[indice + 1]) || 1 : 1;
})();

const pares = doDado
  ? portasDoDado(join(ROOT, 'data', 'worlds')).map((porta) => ({
    destino: porta.destino,
    origem: porta.origem,
    nome: porta.destino + '-de-' + porta.origem,
    direto: porta.direto
  }))
  : JSON.parse(readFileSync(ficheiro, 'utf8'));
if (!Array.isArray(pares) || pares.length === 0) {
  console.error('a lista está vazia');
  process.exit(1);
}

const inicio = Date.now();
let feitos = 0;
const falhas = [];
let proximo = 0;

console.log('');
console.log('passagem ' + passagem + ' · ' + pares.length + ' par(es) · ' + vagas + ' em paralelo');
console.log('');

const correr = (par) => new Promise((resolve) => {
  const pedido = [join(ROOT, 'tools/scene/portrait.mjs'), par.destino, par.origem];
  if (par.direto) pedido.push('--direto');
  const processo = spawn(process.execPath, pedido,
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
  let saida = '';
  processo.stdout.on('data', (pedaco) => { saida += pedaco; });
  processo.stderr.on('data', (pedaco) => { saida += pedaco; });
  processo.on('close', (codigo) => resolve({ par, codigo, saida }));
});

const trabalhadores = Array.from({ length: Math.min(vagas, pares.length) }, async () => {
  while (proximo < pares.length) {
    const par = pares[proximo++];
    const resultado = await correr(par);
    feitos++;
    const segundos = Math.round((Date.now() - inicio) / 1000);
    if (resultado.codigo === 0) {
      console.log('  [' + feitos + '/' + pares.length + '] ok  ' + par.nome + '   (' + segundos + ' s acumulados)');
    } else {
      falhas.push(par.nome);
      console.log('  [' + feitos + '/' + pares.length + '] FALHOU ' + par.nome);
      for (const linha of resultado.saida.trim().split(/\r?\n/).slice(-3)) console.log('        ' + linha);
    }
  }
});

await Promise.all(trabalhadores);

const minutos = Math.round((Date.now() - inicio) / 60000);
console.log('');
console.log('passagem ' + passagem + ' terminada em ' + minutos + ' min · ' + (pares.length - falhas.length) +
  '/' + pares.length + ' feitos');
if (falhas.length > 0) {
  writeFileSync('pares-falhados.json', JSON.stringify(
    pares.filter((par) => falhas.includes(par.nome)), null, 2), 'utf8');
  console.error('falharam ' + falhas.length + ': ' + falhas.join(', '));
  console.error('  (escritos em pares-falhados.json — repita só esses)');
  process.exitCode = 1;
}
