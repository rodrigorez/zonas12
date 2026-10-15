#!/usr/bin/env node
// Phase 0 of the roadmap (docs/ROADMAP.md): converts the hand-written scene in index.html
// into data/scene.json.
//
// Why a script: converting 8 portals and 10 artworks by hand invited swapped fields
// (dimensaoA -> dimensionA, caixa -> box, pertenceA -> ownedBy). The script does the
// conversion once, repeatably, and tools/scene/validate.mjs checks it.
//
// Fase 3 turned this file from "the tool that writes the scene" into "the record of one
// migration": the scene comes from the data and index.html no longer has the entities (block B5
// took them out), so this script cannot reproduce the scene any more. The guard below refuses to
// run at all in that case, and the JSON the migration produced is in git (commit ecf82c7) — it is
// the source of truth from then on.
//
// The format it writes is version 2 — what changed from version 1, and why:
//   D20 — one `assets` catalogue. A dimension and an artwork carry only `asset`, and the URL the
//         modal opens is derived from the catalogue, so the same file is named once instead of
//         twice (that duplication was open point A6).
//   D21 — content text is a map by language. The Portuguese of an asset description is read from
//         the HTML; the English and the names of the dimensions are authored content, and they
//         live in CONTENT below because this script is the only source of the migration.
//   D23 — `version: 2` (from js/scene/schema.js, so the number has one home).
//
// Reads:
//   index.html    the scene entities (assets, camera, dimensions, portals, artworks)
//   js/           values that still live in the code (box, trigger, frame, speed): the entry
//                 point plus every module, because Fase 2 moved them out of the entry point
// Writes:
//   data/scene.json           the exhibition scene
//   data/scene-example.json   the same scene, kept as example/fixture (D9)
//
// Usage: node tools/migration/convert.mjs

import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENE_VERSION } from '../../js/scene/schema.js';

// Content the HTML does not carry: the name of each dimension and the English of each asset
// description (the Portuguese of the descriptions is read from the `alt` of the <img>). This is
// the migration's own record (D21); from Fase 4 on, the text is written in the editor.
const CONTENT = {
  dimensionNames: {
    0: { pt: 'Realidade', en: 'Reality' },
    1: { pt: 'Cidade 360º', en: 'City 360º' },
    2: { pt: 'Praia', en: 'Beach' },
    3: { pt: 'Céu 360º', en: 'Sky 360º' }
  },
  assetEnglish: {
    'cidade-360': '360º panorama of dimension 1 (city)',
    praia: '360º panorama of dimension 2 (beach)',
    skycloud: '360º panorama of dimension 3 (sky)',
    galeriaFoto1: 'Photograph used as an artwork in dimensions 1 and 2',
    galeriaFoto2: 'Photograph of the Eiffel Tower used as an artwork in dimensions 1 and 2',
    video: 'Video used as an artwork in dimension 1'
  },
  // Texto que o HTML nao tem: o <a-assets> nao da alt ao video, e os dois alt das fotografias
  // sao o mesmo texto — e o autor distinguiu-os ao confirmar o texto (D21).
  assetPortuguese: {
    video: 'Vídeo usado como obra na dimensão 1',
    galeriaFoto2: 'Fotografia da Torre Eiffel usada como obra nas dimensões 1 e 2'
  }
};

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

const warnings = [];
const warn = (message) => warnings.push(message);

const html = readFileSync(join(root, 'index.html'), 'utf8');

// ---- the guard ----
// The scene comes from the data since Fase 3 and index.html no longer has the entities: this
// script cannot reproduce it any more, and running it would write an empty JSON over the good one.
// So it refuses, before reading anything else — the tool stopping is the honest behaviour, and the
// JSON that came out of the migration is in git (commit ecf82c7). To change the scene from here
// on: edit data/scene.json (or use the editor, Fase 4) and check it with tools/scene/validate.mjs.
const sceneEntities =
  (html.match(/stencil-portal="/g) || []).length +
  (html.match(/dimensional-material="/g) || []).length +
  (html.match(/dimension-panorama="/g) || []).length;
if (sceneEntities === 0) {
  console.error('convert.mjs: index.html has no scene entities (stencil-portal, dimensional-material,');
  console.error('dimension-panorama). The scene comes from the data: edit data/scene.json and check it with');
  console.error('`node tools/scene/validate.mjs`. Nothing was written.');
  process.exit(1);
}

// The entry point and every module, in a stable order. The values read below from the code
// (box, trigger, frame, player speed) left the entry point in Fase 2.
const codeFiles = ['js/app.js'];
const modulesDir = join(root, 'js', 'modules');
if (existsSync(modulesDir)) {
  for (const name of readdirSync(modulesDir).sort()) {
    if (name.endsWith('.js')) codeFiles.push('js/modules/' + name);
  }
}
const code = codeFiles.map((relative) => ({
  relative,
  text: readFileSync(join(root, relative), 'utf8')
}));

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

// Reads a value that still lives in the code. Fails loudly instead of inventing one.
function fromCode(regexp, label) {
  for (const file of code) {
    const m = file.text.match(regexp);
    if (m) return m;
  }
  warn(`could not read "${label}" from ${codeFiles.join(' + ')} - the JSON will miss it`);
  return null;
}

// A-Frame attribute list -> { chave: valor }. Usado nos atributos compostos,
// por exemplo: "dimension: 1; src: #cidade-360; radius: 500;"
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

// A descricao por lingua (D21): o portugues vem do `alt` do HTML, o ingles da tabela do
// conteudo. Devolve `undefined` quando nao ha texto nenhum, para o campo ficar ausente do JSON
// em vez de aparecer vazio.
function text(portuguese, english) {
  const map = {};
  if (portuguese) map.pt = portuguese;
  if (english) map.en = english;
  return Object.keys(map).length ? map : undefined;
}

const assets = new Map();   // id -> { path, type, description }
for (const tag of tags(html)) {
  const id = attr(tag, 'id');
  const src = attr(tag, 'src');
  if (!id || !src) continue;
  const description = attr(tag, 'alt');
  if (tag.startsWith('<img')) assets.set(id, { path: src, type: 'image', description });
  else if (tag.startsWith('<video') && id !== 'webcam-video') assets.set(id, { path: src, type: 'video', description });
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

  if (tag.startsWith('<a-box') && attr(tag, 'dimensional-material') !== null) {
    const dim = componentes(attr(tag, 'dimensional-material'));
    const asset = (attr(tag, 'src') || '').replace('#', '');
    const own = attrVec3(tag, 'position') || [0, 0, 0];
    const off = offsetAtual();
    // O URL que o modal abre. Com o catalogo (D20) ele deriva do `asset`, e por isso nao entra
    // no JSON — mas o script confere que os dois coincidem, porque era essa a duplicacao (A6)
    // que a Fase 3 veio tirar: se divergirem, a conversao nao e fiel.
    const url = (attr(tag, 'open-artwork') || '').replace(/^url:\s*/, '').trim();
    const derived = (assets.get(asset) || {}).path;
    if (url && derived && url !== derived) {
      warn(`artwork ${artworks.length}: the modal opens "${url}" but asset "${asset}" is "${derived}" (A6)`);
    }
    const size = [
      round(attr(tag, 'width') ?? 1),
      round(attr(tag, 'height') ?? 1),
      round(attr(tag, 'depth') ?? 0.1)
    ];
    artworks.push({
      id: artworks.length,
      dimension: round(dim.dimension),
      kind: assetType(asset) || 'image',
      asset,
      position: [round(off[0] + own[0]), round(off[1] + own[1]), round(off[2] + own[2])],
      rotation: (attrVec3(tag, 'rotation') || [0, 0, 0]).map(round),
      size,
      // `interaction: modal` e o suficiente: o URL vem do catalogo (D20). `url` fica reservado a
      // `interaction: link`, uma ligacao externa que a cena de hoje nao tem.
      interaction: url ? 'modal' : 'none'
    });
    continue;
  }

  if (tag.startsWith('<a-entity')) {
    const panorama = attr(tag, 'dimension-panorama');
    const portal = attr(tag, 'stencil-portal');

    if (panorama !== null) {
      const c = componentes(panorama);
      const asset = (c.src || '').replace('#', '');
      dimensions.push({
        id: round(c.dimension),
        kind: assetType(asset) || 'image',
        asset,
        name: CONTENT.dimensionNames[round(c.dimension)],
        radius: round(c.radius)
      });
      continue;
    }

    if (portal !== null) {
      const c = componentes(portal);
      const pos = attrVec3(tag, 'position') || [0, 0, 0];
      portals.push({
        id: round(c.id),
        dimensionA: round(c.dimensionA),
        dimensionB: round(c.dimensionB),
        ownedBy: round(c.ownedBy ?? -1),
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

const schemaBox = fromCode(
  /box:\s*\{\s*type:\s*'vec3',\s*default:\s*\{\s*x:\s*([\d.]+),\s*y:\s*([\d.]+),\s*z:\s*([\d.]+)\s*\}/,
  'portal box size (box)');
const schemaBoxPos = fromCode(
  /boxPosition:\s*\{\s*type:\s*'vec3',\s*default:\s*\{\s*x:\s*([\d.]+),\s*y:\s*([\d.]+),\s*z:\s*([\d.]+)\s*\}/,
  'portal box position (boxPosition)');
const schemaBoxRot = fromCode(
  /boxRotation:\s*\{\s*type:\s*'vec3',\s*default:\s*\{\s*x:\s*([\d.]+),\s*y:\s*([\d.]+),\s*z:\s*([\d.]+)\s*\}/,
  'portal box rotation (boxRotation)');
const schemaTrigger = fromCode(/trigger:\s*\{\s*type:\s*'string',\s*default:\s*'([^']+)'/, 'portal trigger (trigger)');
const schemaFrameColour = fromCode(
  /frameColor:\s*\{\s*type:\s*'string',\s*default:\s*'(#[0-9A-Fa-f]{6})'/,
  'frame colour (frameColor)');
const schemaFrameThickness = fromCode(
  /frameThickness:\s*\{\s*type:\s*'number',\s*default:\s*([\d.]+)/,
  'frame thickness (frameThickness)');
const playerSpeed = fromCode(/const MOBILE_SPEED = ([\d.]+);/, 'player speed (MOBILE_SPEED)');

const vec = (m) => (m ? [round(m[1]), round(m[2]), round(m[3])] : null);

// Code and JSON use the same words now (D10): the schema default is already 'plane' or 'box'.
const trigger = schemaTrigger ? schemaTrigger[1] : null;

for (const portal of portals) {
  portal.box = vec(schemaBox);
  portal.boxPosition = vec(schemaBoxPos);
  portal.boxRotation = vec(schemaBoxRot);
  portal.trigger = trigger;
  portal.frame = {
    color: schemaFrameColour ? schemaFrameColour[1].toLowerCase() : null,
    thickness: schemaFrameThickness ? round(schemaFrameThickness[1]) : null
  };
}

// A dimensao 0 (a realidade / a imagem da camara) nao tem entidade de panorama,
// mas existe: os portais apontam para ela. Acrescenta-se com kind "camera".
const ids = new Set(dimensions.map((d) => d.id));
for (const portal of portals) {
  for (const id of [portal.dimensionA, portal.dimensionB]) {
    if (!ids.has(id)) {
      ids.add(id);
      dimensions.push({ id, kind: 'camera', name: CONTENT.dimensionNames[id] });
    }
  }
}

dimensions.sort((a, b) => a.id - b.id);
portals.sort((a, b) => a.id - b.id);

// ---------------------------------------------------------------- saida

// O catalogo de assets (D20): a unica casa de um caminho. A ordem e a do HTML, para o diff da
// conversao ser estavel.
const catalogue = {};
for (const [id, asset] of assets) {
  catalogue[id] = {
    path: asset.path,
    type: asset.type,
    alt: text(CONTENT.assetPortuguese[id] || asset.description, CONTENT.assetEnglish[id])
  };
}

const cena = {
  version: SCENE_VERSION,
  cameras: {
    player: { position: playerPosition ? playerPosition.map(round) : null, speed: playerSpeed ? round(playerSpeed[1]) : null },
    real: { enabled: realCameraEnabled }
  },
  assets: catalogue,
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

console.log(`scene written (version ${SCENE_VERSION}):`);
console.log(`  dimensions : ${dimensions.length}  (${dimensions.map((d) => d.id + ':' + d.kind).join(', ')})`);
console.log(`  artworks   : ${artworks.length}`);
console.log(`  portals    : ${portals.length}  (${portals.map((p) => p.id + ':' + p.dimensionA + '<->' + p.dimensionB).join(', ')})`);
console.log(`  assets     : ${assets.size}  (unused: ${semUso.length ? semUso.join(', ') : 'none'})`);
console.log(`  catalogue  : ${Object.keys(catalogue).length} paths, ` +
  `${Object.values(catalogue).filter((asset) => asset.alt).length} with a description (D20)`);
console.log(`  files      : data/scene.json, data/scene-example.json`);

if (semFicheiro.length) console.error(`ERROR: asset ids used but not declared: ${semFicheiro.join(', ')}`);
if (warnings.length) {
  console.error('WARNINGS:');
  for (const w of warnings) console.error('  - ' + w);
}
process.exit(semFicheiro.length ? 1 : 0);
