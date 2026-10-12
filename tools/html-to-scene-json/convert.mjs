#!/usr/bin/env node
// Fase 0 do roadmap (docs/ROADMAP.md): converte a cena escrita a mao em index.html
// para data/scene.json.
//
// Porque existe um script: converter 8 portais e 10 obras a mao convidava a trocar
// campos (dimensaoA -> dimensionA, caixa -> box, pertenceA -> ownedBy). O script faz a
// conversao uma vez, de forma repetivel, e tools/html-to-scene-json/validate.mjs
// confere o resultado.
//
// Le:
//   index.html    entidades da cena (assets, camara, dimensoes, portais, obras)
//   js/main.js    valores que ainda vivem no codigo (caixa, gatilho, moldura, velocidade)
// Escreve:
//   data/scene.json           cena da exposicao
//   data/scene-example.json   a mesma cena, mantida como exemplo/fixture (D9)
//
// Uso: node tools/html-to-scene-json/convert.mjs

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

const warnings = [];
const warn = (message) => warnings.push(message);

const html = readFileSync(join(root, 'index.html'), 'utf8');
const js = readFileSync(join(root, 'js', 'main.js'), 'utf8');

// ---------------------------------------------------------------- helpers

function attr(tag, name) {
  const m = tag.match(new RegExp(name + '="([^"]*)"'));
  return m ? m[1] : null;
}

function vec3(text) {
  if (text === null) return null;
  const parts = text.trim().split(/\s+/).map(Number);
  return parts.length === 3 && parts.every(Number.isFinite) ? parts : null;
}

function attrVec3(tag, name) {
  return vec3(attr(tag, name));
}

function round(value, decimals = 4) {
  return Number(Number(value).toFixed(decimals));
}

// Le um valor que ainda vive no codigo (js/main.js). Falha alto em vez de inventar.
function fromCode(regexp, label) {
  const m = js.match(regexp);
  if (!m) {
    warn(`could not read "${label}" from js/main.js - the JSON will miss it`);
    return null;
  }
  return m;
}

// A-Frame attribute list -> { chave: valor }. Usado nos atributos compostos,
// por exemplo: "dimensao: 1; src: #cidade-360; raio: 500;"
function componentes(text) {
  const out = {};
  if (!text) return out;
  for (const parte of text.split(';')) {
    const i = parte.indexOf(':');
    if (i < 0) continue;
    const chave = parte.slice(0, i).trim();
    const valor = parte.slice(i + 1).trim();
    if (chave) out[chave] = valor;
  }
  return out;
}

// Todas as tags do ficheiro, ja sem comentarios (uma tag pode ocupar varias linhas).
function tags(source) {
  const limpo = source.replace(/<!--[\s\S]*?-->/g, '');
  const lista = [];
  let i = 0;
  for (;;) {
    const start = limpo.indexOf('<', i);
    if (start < 0) break;
    const end = limpo.indexOf('>', start);
    if (end < 0) break;
    lista.push(limpo.slice(start, end + 1));
    i = end + 1;
  }
  return lista;
}

// ---------------------------------------------------------------- assets

const assets = new Map();   // id -> { path, type }
for (const tag of tags(html)) {
  const id = attr(tag, 'id');
  const src = attr(tag, 'src');
  if (!id || !src) continue;
  if (tag.startsWith('<img')) assets.set(id, { path: src, type: 'image' });
  else if (tag.startsWith('<video') && id !== 'webcam-video') assets.set(id, { path: src, type: 'video' });
}

const assetType = (id) => (assets.get(id) || {}).type || null;

// ---------------------------------------------------------------- cena

const dimensions = [];
const artworks = [];
const portals = [];
let playerPosition = null;
let realCameraEnabled = false;

// Posicao acumulada dos grupos <a-entity position="..."> que envolvem as obras:
// no HTML as obras estao em coordenadas do grupo (z = -60, -95, -115), no JSON
// ficam em coordenadas do mundo.
const stack = [];
const offsetAtual = () =>
  stack.reduce((acc, o) => [acc[0] + o[0], acc[1] + o[1], acc[2] + o[2]], [0, 0, 0]);

for (const tag of tags(html)) {
  if (tag.startsWith('</a-entity')) { stack.pop(); continue; }

  if (tag.startsWith('<a-camera')) {
    playerPosition = attrVec3(tag, 'position');
    continue;
  }

  if (tag.startsWith('<video') && attr(tag, 'id') === 'webcam-video') {
    realCameraEnabled = true;
    continue;
  }

  if (tag.startsWith('<a-box') && attr(tag, 'material-virtual') !== null) {
    const dim = componentes(attr(tag, 'material-virtual'));
    const asset = (attr(tag, 'src') || '').replace('#', '');
    const own = attrVec3(tag, 'position') || [0, 0, 0];
    const off = offsetAtual();
    const url = (attr(tag, 'abrir-modal') || '').trim();
    const size = [
      round(attr(tag, 'width') ?? 1),
      round(attr(tag, 'height') ?? 1),
      round(attr(tag, 'depth') ?? 0.1)
    ];
    artworks.push({
      id: artworks.length,
      dimension: round(dim.dimensao),
      kind: assetType(asset) || 'image',
      asset,
      position: [round(off[0] + own[0]), round(off[1] + own[1]), round(off[2] + own[2])],
      rotation: (attrVec3(tag, 'rotation') || [0, 0, 0]).map(round),
      size,
      interaction: url ? 'modal' : 'none',
      url: url ? url.replace(/^url:\s*/, '') : null
    });
    continue;
  }

  if (tag.startsWith('<a-entity')) {
    const panorama = attr(tag, 'panorama-dimensao');
    const portal = attr(tag, 'portal-estencil-dinamico');

    if (panorama !== null) {
      const c = componentes(panorama);
      const asset = (c.src || '').replace('#', '');
      dimensions.push({
        id: round(c.dimensao),
        kind: assetType(asset) || 'image',
        asset,
        radius: round(c.raio)
      });
      continue;
    }

    if (portal !== null) {
      const c = componentes(portal);
      const pos = attrVec3(tag, 'position') || [0, 0, 0];
      portals.push({
        id: round(c.portalId),
        dimensionA: round(c.dimensaoA),
        dimensionB: round(c.dimensaoB),
        ownedBy: round(c.pertenceA ?? -1),
        position: pos.map(round),
        width: round(c.width),
        height: round(c.height)
      });
      continue;
    }

    // Grupo sem componente propria: empilha o deslocamento das obras que contem.
    stack.push(attrVec3(tag, 'position') || [0, 0, 0]);
  }
}

// ------------------------------------------------- valores que vivem no codigo

const schemaCaixa = fromCode(
  /caixa:\s*\{\s*type:\s*'vec3',\s*default:\s*\{\s*x:\s*([\d.]+),\s*y:\s*([\d.]+),\s*z:\s*([\d.]+)\s*\}/,
  'portal box size (caixa)');
const schemaCaixaPos = fromCode(
  /caixaPosicao:\s*\{\s*type:\s*'vec3',\s*default:\s*\{\s*x:\s*([\d.]+),\s*y:\s*([\d.]+),\s*z:\s*([\d.]+)\s*\}/,
  'portal box position (caixaPosicao)');
const schemaCaixaRot = fromCode(
  /caixaRotacao:\s*\{\s*type:\s*'vec3',\s*default:\s*\{\s*x:\s*([\d.]+),\s*y:\s*([\d.]+),\s*z:\s*([\d.]+)\s*\}/,
  'portal box rotation (caixaRotacao)');
const schemaGatilho = fromCode(/gatilho:\s*\{\s*type:\s*'string',\s*default:\s*'([^']+)'/, 'portal trigger (gatilho)');
const corMoldura = fromCode(/let moldura = new THREE\.MeshBasicMaterial\(\{\s*color:\s*0x([0-9A-Fa-f]{6})/, 'frame colour');
const espMoldura = fromCode(/let esp = ([\d.]+);/, 'frame thickness');
const velocidade = fromCode(/const VELOCIDADE = ([\d.]+);/, 'player speed (VELOCIDADE)');

const vec = (m) => (m ? [round(m[1]), round(m[2]), round(m[3])] : null);

// O codigo usa 'plano'/'caixa'; o JSON usa 'plane'/'box' (D10).
const gatilho = schemaGatilho
  ? ({ plano: 'plane', caixa: 'box' }[schemaGatilho[1]] || schemaGatilho[1])
  : null;

for (const portal of portals) {
  portal.box = vec(schemaCaixa);
  portal.boxPosition = vec(schemaCaixaPos);
  portal.boxRotation = vec(schemaCaixaRot);
  portal.trigger = gatilho;
  portal.frame = {
    color: corMoldura ? '#' + corMoldura[1].toLowerCase() : null,
    thickness: espMoldura ? round(espMoldura[1]) : null
  };
}

// A dimensao 0 (a realidade / a imagem da camara) nao tem entidade de panorama,
// mas existe: os portais apontam para ela. Acrescenta-se com kind "camera".
const ids = new Set(dimensions.map((d) => d.id));
for (const portal of portals) {
  for (const id of [portal.dimensionA, portal.dimensionB]) {
    if (!ids.has(id)) { ids.add(id); dimensions.push({ id, kind: 'camera' }); }
  }
}

dimensions.sort((a, b) => a.id - b.id);
portals.sort((a, b) => a.id - b.id);

// ---------------------------------------------------------------- saida

const cena = {
  version: 1,
  cameras: {
    player: { position: playerPosition ? playerPosition.map(round) : null, speed: velocidade ? round(velocidade[1]) : null },
    real: { enabled: realCameraEnabled }
  },
  dimensions,
  artworks,
  portals
};

const destino = join(root, 'data');
mkdirSync(destino, { recursive: true });
const texto = JSON.stringify(cena, null, 2) + '\n';
for (const nome of ['scene.json', 'scene-example.json']) {
  writeFileSync(join(destino, nome), texto, 'utf8');
}

// ---------------------------------------------------------------- relatorio

const usados = new Set([
  ...dimensions.map((d) => d.asset).filter(Boolean),
  ...artworks.map((a) => a.asset)
]);
const semUso = [...assets.keys()].filter((id) => !usados.has(id));
const semFicheiro = [...usados].filter((id) => !assets.has(id));

console.log('scene written:');
console.log(`  dimensions : ${dimensions.length}  (${dimensions.map((d) => d.id + ':' + d.kind).join(', ')})`);
console.log(`  artworks   : ${artworks.length}`);
console.log(`  portals    : ${portals.length}  (${portals.map((p) => p.id + ':' + p.dimensionA + '<->' + p.dimensionB).join(', ')})`);
console.log(`  assets     : ${assets.size}  (unused: ${semUso.length ? semUso.join(', ') : 'none'})`);
console.log(`  files      : data/scene.json, data/scene-example.json`);

if (semFicheiro.length) console.error(`ERROR: asset ids used but not declared: ${semFicheiro.join(', ')}`);
if (warnings.length) {
  console.error('WARNINGS:');
  for (const w of warnings) console.error('  - ' + w);
}
process.exit(semFicheiro.length ? 1 : 0);
