#!/usr/bin/env node
// Confere data/scene.json contra index.html: contagens, integridade referencial e as
// leis da cena que vieram de bugs reais (docs/ROADMAP.md, seccao 8).
//
// Este validador e estatico (nao abre o browser). A conferencia campo a campo contra a
// cena a correr e feita a parte, no browser, porque so la se sabe o que o A-Frame
// construiu de facto.
//
// Uso: node tools/html-to-scene-json/validate.mjs

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

const html = readFileSync(join(root, 'index.html'), 'utf8');
const cena = JSON.parse(readFileSync(join(root, 'data', 'scene.json'), 'utf8'));

const erros = [];
const avisos = [];
const err = (m) => erros.push(m);
const aviso = (m) => avisos.push(m);

const contar = (regexp) => (html.match(regexp) || []).length;

// ---------------------------------------------------------------- contagens

// 1 obra = 1 elemento com dimensional-material; 1 portal = 1 componente; 1 dimensao com
// fundo = 1 entidade dimension-panorama.
const nObras = contar(/dimensional-material="/g);
const nPortais = contar(/portal-estencil-dinamico="/g);
const nPanoramas = contar(/dimension-panorama="/g);
const nUrls = contar(/open-artwork="/g);

if (nObras !== cena.artworks.length) err(`artworks: HTML has ${nObras}, JSON has ${cena.artworks.length}`);
if (nPortais !== cena.portals.length) err(`portals: HTML has ${nPortais}, JSON has ${cena.portals.length}`);

const dimComFundo = cena.dimensions.filter((d) => d.kind !== 'camera').length;
if (nPanoramas !== dimComFundo) err(`dimensions with background: HTML has ${nPanoramas}, JSON has ${dimComFundo}`);

const obrasComUrl = cena.artworks.filter((a) => a.url).length;
if (nUrls !== obrasComUrl) err(`artworks with url: HTML has ${nUrls}, JSON has ${obrasComUrl}`);

// ---------------------------------------------------------------- assets

const declarados = new Set();
for (const m of html.matchAll(/<(img|video)\s+id="([^"]+)"\s+src="([^"]+)"/g)) {
  if (m[2] !== 'webcam-video') declarados.add(m[2]);
}

const usadosPorDimensoes = cena.dimensions.map((d) => d.asset).filter(Boolean);
const usadosPorObras = cena.artworks.map((a) => a.asset);
for (const id of [...usadosPorDimensoes, ...usadosPorObras]) {
  if (!declarados.has(id)) err(`asset "${id}" is used in the JSON but not declared in <a-assets>`);
}
const semUso = [...declarados].filter((id) => !usadosPorDimensoes.includes(id) && !usadosPorObras.includes(id));
if (semUso.length) aviso(`assets declared and never used: ${semUso.join(', ')}`);

// ---------------------------------------------------------------- integridade

const idsDimensoes = new Set(cena.dimensions.map((d) => d.id));

for (const obra of cena.artworks) {
  if (!idsDimensoes.has(obra.dimension)) err(`artwork ${obra.id} points to dimension ${obra.dimension}, which does not exist`);
}
if (new Set(cena.artworks.map((a) => a.id)).size !== cena.artworks.length) err('artworks: duplicated id');
if (new Set(cena.portals.map((p) => p.id)).size !== cena.portals.length) err('portals: duplicated id');
if (new Set(cena.dimensions.map((d) => d.id)).size !== cena.dimensions.length) err('dimensions: duplicated id');

for (const p of cena.portals) {
  if (p.dimensionA === p.dimensionB) err(`portal ${p.id}: dimensionA === dimensionB (${p.dimensionA})`);
  if (!idsDimensoes.has(p.dimensionA)) err(`portal ${p.id}: dimensionA ${p.dimensionA} does not exist`);
  if (!idsDimensoes.has(p.dimensionB)) err(`portal ${p.id}: dimensionB ${p.dimensionB} does not exist`);
  if (![p.dimensionA, p.dimensionB, -1].includes(p.ownedBy)) err(`portal ${p.id}: ownedBy ${p.ownedBy} is neither A, B nor -1`);
  if (!Array.isArray(p.box) || p.box.length !== 3) err(`portal ${p.id}: box is missing`);
  if (p.trigger !== 'plane' && p.trigger !== 'box') err(`portal ${p.id}: trigger "${p.trigger}" is not plane/box`);
  if (p.box.some((v) => !(v > 0))) err(`portal ${p.id}: box has a non-positive side`);
}

// ---------------------------------------------------------------- L1: raio do fundo

// O fundo da dimensao ativa segue a camara, por isso o raio tem de ser maior do que a
// distancia a qualquer portal (senao o fundo aparece dentro da janela). Como a posicao
// da camara varia, usa-se a extensao da cena como limite superior.
const pontos = [...cena.portals.map((p) => p.position), ...cena.artworks.map((a) => a.position)];
const extensao = Math.max(...pontos.map((p) => Math.hypot(p[0], p[1], p[2])));
for (const d of cena.dimensions) {
  if (d.kind === 'camera') continue;
  if (typeof d.radius !== 'number') err(`dimension ${d.id}: background without radius`);
  else if (d.radius <= extensao) {
    err(`dimension ${d.id}: radius ${d.radius} is not larger than the scene extent (${extensao.toFixed(1)}) - L1`);
  }
}

// ---------------------------------------------------------------- L4: chegada dentro de outra caixa

// Ao atravessar um portal chega-se ao centro da caixa dele. Se esse ponto cair dentro
// da caixa de outro portal, ha trocas em cadeia (ping-pong entre dimensoes).
// Nota: assume portais sem rotacao (no cenario atual e o caso).
function dentroDaCaixa(ponto, portal) {
  const centro = [
    portal.position[0] + portal.boxPosition[0],
    portal.position[1] + portal.boxPosition[1],
    portal.position[2] + portal.boxPosition[2]
  ];
  const meio = portal.box.map((v) => v / 2);
  return [0, 1, 2].every((i) => Math.abs(ponto[i] - centro[i]) <= meio[i]);
}

for (const p of cena.portals) {
  for (const q of cena.portals) {
    if (q.id === p.id) continue;
    const chegada = [p.position[0], 1.6, p.position[2]];   // olhos de quem chega
    if (dentroDaCaixa(chegada, q)) {
      err(`portal ${p.id}: arriving there falls inside the box of portal ${q.id} (L4 - chain crossings)`);
    }
  }
}

// ---------------------------------------------------------------- L5: janelas distintas

const pares = new Set();
for (const p of cena.portals) {
  const destino = p.ownedBy === p.dimensionA ? p.dimensionB : p.dimensionA;
  pares.add(p.ownedBy + '->' + destino);
}
if (pares.size > 255) err(`too many distinct visible dimensions at once: ${pares.size} (L5, stencil limit is 255)`);
avisos.push(`info: ${pares.size} distinct dimension windows in this scene (limit 255)`);

// ---------------------------------------------------------------- relatorio

console.log(`checked data/scene.json against index.html`);
console.log(`  dimensions ${cena.dimensions.length}, artworks ${cena.artworks.length}, portals ${cena.portals.length}`);
for (const a of avisos) console.log('  note: ' + a);
if (erros.length) {
  console.error(`FAILED with ${erros.length} error(s):`);
  for (const e of erros) console.error('  - ' + e);
  process.exit(1);
}
console.log('OK');
