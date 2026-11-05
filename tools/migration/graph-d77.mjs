#!/usr/bin/env node
// O grafo da disposição em dois anéis (D77, Fase 3).
//
// Porque existe: a regra dos 3 a 5 portais por sala — um ao portão e os outros escolhidos **uma vez**
// e gravados no dado — muda doze ficheiros de mundo, cada um com o seu retrato, o seu recorte e o
// nome temático do destino. À mão é a mesma edição repetida doze vezes com nomes pelo meio.
//
// O que faz, e só isto:
//   1. tira as duas portas da aresta cidade ↔ distopia — a cidade ficava com seis portas, uma acima
//      do máximo de cinco;
//   2. acrescenta as seis arestas que faltam (doze portas, ids 38 a 49), cada uma com o
//      `arrivalFrom` do destino, como todas as outras (L19);
//   3. acrescenta ao catálogo de cada mundo de origem o retrato e o recorte do destino novo;
//   4. tira do catálogo o retrato e o recorte que ficaram sem porta;
//   5. dá ao céu a dimensão `camera` que a porta do portão precisa (L18).
//
// Não posiciona nada: quem põe as obras e as portas nos anéis é o `tools/scene/ring.mjs --aplicar`.
//
// Uso: node tools/migration/graph-d77.mjs            (mostra o que mudava, não escreve)
//      node tools/migration/graph-d77.mjs --aplicar  (escreve, preservando o fim de linha do ficheiro)
import { readFileSync, readdirSync } from 'node:fs';
import { writeAtomic } from '../coordination/atomic.mjs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FIXTURES } from '../../js/scene/fixtures.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

// Os fixtures não são salas (D9) — a lista vive em `js/scene/fixtures.js` desde a lei L22.
const apply = process.argv.includes('--aplicar');

// As duas portas que saem: a cidade fica com cinco (gate, praia, becos, imersões, mangue).
const REMOVE = [
  { world: 'scene1', portal: 33 },
  { world: 'scene10', portal: 32 }
];

// As seis arestas que entram, com os ids a seguir ao último que existe (37). Arestas simétricas: uma
// porta em cada ponta, e cada uma declara-se a chegada da outra (L19).
const EDGES = [
  ['scene10', 'scene9', 38],
  ['scene9', 'scene10', 39],
  ['scene5', 'scene6', 40],
  ['scene6', 'scene5', 41],
  ['scene7', 'scene8', 42],
  ['scene8', 'scene7', 43],
  ['scene11', 'scene2', 44],
  ['scene2', 'scene11', 45],
  ['gate', 'scene3', 46],
  ['scene3', 'gate', 47],
  ['scene10', 'scene11', 48],
  ['scene11', 'scene10', 49]
];

const worlds = new Map();
for (const name of readdirSync(join(root, 'data', 'worlds')).filter((entry) => entry.endsWith('.json'))) {
  const text = readFileSync(join(root, 'data', 'worlds', name), 'utf8');
  const scene = JSON.parse(text);
  const slug = (scene.world && scene.world.slug) || basename(name, '.json');
  if (FIXTURES.includes(slug)) continue;
  worlds.set(slug, { file: name, eol: text.includes('\r\n') ? '\r\n' : '\n', scene: scene });
}

// O nome do retrato de um destino é temático (`retrato-cidade`, `retrato-ceu`) e o mesmo em todos os
// mundos que lhe apontam uma porta: lê-se do dado, não se inventa aqui. Calculado antes das remoções,
// senão a distopia perdia o nome ao mesmo tempo que a porta.
function retratoDoDestino(slug) {
  for (const world of worlds.values()) {
    for (const portal of world.scene.portals || []) {
      const target = portal.action && portal.action.target;
      const window = portal.window || {};
      if (target === slug && window.kind === 'preview' && window.asset) return window.asset;
    }
  }
  return null;
}

// O shader do destino, que a janela tem de nomear (D53): a porta desenha, com o retrato por cima, o
// fundo que o outro lado desenha ao vivo.
function shaderDoDestino(slug) {
  const world = worlds.get(slug);
  const dimension = (world.scene.dimensions || []).find((entry) => entry.kind === 'shader');
  return dimension ? dimension.shaderId : null;
}

// A ordem dos campos é a dos portais que já existem.
function novoPortal(origem, destino, id, model) {
  const base = {
    id: id,
    ownedBy: 0,
    position: [0, 0, 0],
    width: model.width,
    height: model.height,
    box: model.box.slice(),
    boxPosition: model.boxPosition.slice(),
    boxRotation: model.boxRotation.slice(),
    trigger: 'plane',
    frame: { color: model.frame.color, thickness: model.frame.thickness }
  };
  if (destino === 'gate') {
    // A porta do portão mostra a câmara (o par de dimensões) e não tem retrato: o portão desenha-se
    // ao vivo, e é a única porta do grafo que não precisa de um asset.
    return Object.assign(base, {
      window: { kind: 'dimension-pair', dimensionA: 0, dimensionB: 1 },
      action: { kind: 'navigate', target: 'gate' },
      arrivalFrom: 'gate'
    });
  }
  return Object.assign(base, {
    window: {
      kind: 'preview',
      asset: retratoDoDestino(destino),
      radius: 120,
      shaderId: shaderDoDestino(destino),
      cutout: 'recorte-' + destino + '-de-' + origem
    },
    action: { kind: 'navigate', target: destino },
    arrivalFrom: destino
  });
}

const removidos = [];
const acrescentados = [];
const assetsPostos = [];
const assetsTirados = [];
const dimensoesPostas = [];
const problemas = [];

for (const { world, portal } of REMOVE) {
  const alvo = worlds.get(world);
  const antes = (alvo.scene.portals || []).length;
  const indice = (alvo.scene.portals || []).findIndex((entry) => entry.id === portal);
  if (indice === -1) {
    problemas.push(`${world}: a porta ${portal} já não está lá`);
    continue;
  }
  const saida = alvo.scene.portals.splice(indice, 1)[0];
  removidos.push(`${world}: porta ${portal} (para ${saida.action && saida.action.target}) — ${antes} → ${alvo.scene.portals.length}`);
}

for (const [origem, destino, id] of EDGES) {
  const alvo = worlds.get(origem);
  if (!alvo) {
    problemas.push(`${origem}: mundo de origem desconhecido`);
    continue;
  }
  if ((alvo.scene.portals || []).some((entry) => entry.id === id)) {
    problemas.push(`${origem}: a porta ${id} já existe`);
    continue;
  }
  const primeiro = (alvo.scene.portals || [])[0];
  const model = {
    width: primeiro.width,
    height: primeiro.height,
    box: primeiro.box,
    boxPosition: primeiro.boxPosition,
    boxRotation: primeiro.boxRotation,
    frame: primeiro.frame
  };
  const portal = novoPortal(origem, destino, id, model);
  alvo.scene.portals = alvo.scene.portals || [];
  alvo.scene.portals.push(portal);
  acrescentados.push(`${origem}: porta ${id} → ${destino} (${alvo.scene.portals.length} portas)`);

  // O catálogo do mundo de origem precisa do retrato e do recorte do destino. Os ficheiros são do
  // `tools/scene/portrait.mjs` (Fase 5): aqui só se declara o nome e o caminho que ele vai escrever.
  if (destino === 'gate') continue;
  const retrato = retratoDoDestino(destino);
  const nome = (worlds.get(destino).scene.world && worlds.get(destino).scene.world.name) || {};
  const pt = nome.pt || destino;
  const en = nome.en || destino;
  alvo.scene.assets = alvo.scene.assets || {};
  if (!alvo.scene.assets[retrato]) {
    alvo.scene.assets[retrato] = {
      path: 'assets/previews/' + destino + '-de-' + origem + '.jpg',
      type: 'image',
      alt: { pt: 'Retrato do mundo ' + pt + ', visto da porta', en: 'Portrait of the ' + en + ' world, seen from the door' }
    };
    assetsPostos.push(`${origem}: ${retrato} → ${alvo.scene.assets[retrato].path}`);
  }
  const chave = 'recorte-' + destino + '-de-' + origem;
  if (!alvo.scene.assets[chave]) {
    alvo.scene.assets[chave] = {
      path: 'assets/previews/' + chave + '.png',
      type: 'image',
      alt: {
        pt: 'Retrato do mundo ' + pt + ', visto da porta (recorte, para a janela ao vivo)',
        en: 'Portrait of the ' + en + ' world, seen from the door (recorte, para a janela ao vivo)'
      }
    };
    assetsPostos.push(`${origem}: ${chave} → ${alvo.scene.assets[chave].path}`);
  }
}

// Depois das remoções: um retrato sem porta é 8 MiB de textura que ninguém carrega.
for (const world of worlds.values()) {
  const usados = new Set();
  for (const portal of world.scene.portals || []) {
    const window = portal.window || {};
    if (window.asset) usados.add(window.asset);
    if (window.cutout) usados.add(window.cutout);
  }
  for (const chave of Object.keys(world.scene.assets || {})) {
    if (!/^(retrato|recorte)-/.test(chave) || usados.has(chave)) continue;
    delete world.scene.assets[chave];
    assetsTirados.push(`${world.scene.world.slug}: ${chave}`);
  }
}

// O céu é a única sala sem dimensão `camera`: a porta do portão mostra o par (o fundo da sala e a
// câmara) e a L18 só aceita essa janela quando ela mostra mesmo a câmara.
const ceu = worlds.get('scene3');
if (ceu && !(ceu.scene.dimensions || []).some((entry) => entry.kind === 'camera')) {
  const ids = (ceu.scene.dimensions || []).map((entry) => entry.id);
  const id = ids.length > 0 ? Math.max.apply(null, ids) + 1 : 0;
  ceu.scene.dimensions.push({ id: id, kind: 'camera', name: { pt: 'Realidade', en: 'Reality' } });
  dimensoesPostas.push(`scene3: dimensões[${id}] camera (Realidade)`);
}

for (const lista of [removidos, acrescentados, assetsPostos, assetsTirados, dimensoesPostas]) {
  for (const linha of lista) console.log('  ' + linha);
}

console.log('');
console.log('o grafo depois da migração:');
const ordem = (slug) => {
  const digits = /(\d+)/.exec(slug);
  return digits ? Number(digits[1]) : -1;
};
const slugs = [...worlds.keys()].sort((a, b) => ordem(a) - ordem(b) || a.localeCompare(b));
for (const slug of slugs) {
  const scene = worlds.get(slug).scene;
  const portas = scene.portals || [];
  const aoPortao = portas.filter((portal) => portal.action && portal.action.target === 'gate').length;
  const veredicto = slug === 'gate' ? '' : (portas.length < 3 || portas.length > 5
    ? '  ← fora de 3 a 5'
    : (aoPortao === 1 ? '  ok' : `  ← ${aoPortao} porta(s) ao portão`));
  console.log(`  ${slug.padEnd(9)} ${String(portas.length).padStart(2)} portas · ${aoPortao} ao portão${veredicto}`);
}

if (problemas.length > 0) {
  for (const problema of problemas) console.error(`  error: ${problema}`);
  process.exit(1);
}

if (!apply) {
  console.log('');
  console.log('nada escrito: `--aplicar` escreve (e o `ring.mjs --aplicar` põe as portas nos anéis).');
  process.exit(0);
}

for (const slug of slugs) {
  const world = worlds.get(slug);
  const texto = JSON.stringify(world.scene, null, 2).replace(/\n/g, world.eol) + world.eol;
  writeAtomic(join(root, 'data', 'worlds', world.file), texto);
}
console.log('');
console.log(`escrito: ${slugs.length} ficheiros de mundo em data/worlds/`);
