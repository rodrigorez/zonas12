#!/usr/bin/env node
// O giro do retrato de cada porta de mundo, escrito no dado (D78).
//
// Porque existe: a janela de uma porta mostra o fundo do destino **ao vivo** (D53), e esse fundo é
// ancorado ao azimute do mundo de destino — mas a janela está no mundo de origem. As duas vistas (a
// de quem olha pela porta e a de quem chega) estão separadas por um giro, e é esse giro que a esfera
// do retrato tem de rodar, senão o que se vê pela porta está girado em relação ao que se vê ao chegar.
// Medido na porta 38 da sala 10, sem o giro: **27,79** de salto no corte, com a meta em 0,50.
//
// A conta vive em `js/scene/ring.js` (`portraitTurn`, sobre os ângulos do anel) — a mesma que a lei
// L26 usa para provar o dado. Aqui lê-se o disco, imprime-se a tabela e, só com `--aplicar`, escreve-se.
//
// Uso: node tools/scene/azimuths.mjs [--aplicar] [mundo...]
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { portraitTurn, ringCoordinates } from '../../js/scene/ring.js';
import { FIXTURES } from '../../js/scene/fixtures.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

const args = process.argv.slice(2);
const apply = args.includes('--aplicar');
const wanted = args.filter((arg) => !arg.startsWith('--'));

const directory = join(root, 'data', 'worlds');
if (!existsSync(directory)) {
  console.error('data/worlds/ não existe — o giro mede-se no dado, e o dado não está aqui');
  process.exit(1);
}

// Todas as páginas, fixtures incluídos: uma porta de fixture não entra na exposição, mas o fixture
// pode ser o **destino** de outra coisa e a tabela diz isso em vez de o esconder.
const worlds = new Map();
const files = new Map();
for (const name of readdirSync(directory).filter((entry) => entry.endsWith('.json'))) {
  const text = readFileSync(join(directory, name), 'utf8');
  const scene = JSON.parse(text);
  const slug = (scene.world && scene.world.slug) || basename(name, '.json');
  worlds.set(slug, scene);
  files.set(slug, { name: name, eol: text.includes('\r\n') ? '\r\n' : '\n', written: false });
}

// Onde cada mundo recebe quem vem de outro: o ângulo do anel da porta que diz `arrivalFrom`.
const arrivals = new Map();
for (const [slug, scene] of worlds) {
  for (const portal of scene.portals || []) {
    if (!portal.arrivalFrom) continue;
    arrivals.set(portal.arrivalFrom + ' → ' + slug, ringCoordinates(portal.position).angle);
  }
}

const round = (value) => Math.round(value * 10) / 10;
const pad = (value, width) => String(value).padStart(width);

const rooms = [...worlds.keys()]
  .filter((slug) => !FIXTURES.includes(slug))
  .filter((slug) => wanted.length === 0 || wanted.includes(slug));

let pairs = 0;
let missing = 0;
console.log('porta               vai para   az saída   az chegada    giro   no dado');
for (const slug of rooms) {
  const scene = worlds.get(slug);
  for (const portal of scene.portals || []) {
    const axis = portal.window || {};
    const action = portal.action || {};
    // Só as janelas de retrato: uma `dimension-pair` mostra as dimensões da própria sala, e a `none`
    // não mostra nada — nenhuma das duas tem fundo de outro mundo para rodar.
    if (axis.kind !== 'preview' || action.kind !== 'navigate') continue;
    pairs += 1;
    const from = ringCoordinates(portal.position).angle;
    const arrival = arrivals.get(slug + ' → ' + action.target);
    if (typeof arrival !== 'number') {
      missing += 1;
      console.log((slug + ' ' + portal.id).padEnd(19) + String(action.target).padEnd(11) +
        pad(round(from).toFixed(1), 10) + pad('—', 13) + pad('—', 8) + '  (sem porta de chegada)');
      continue;
    }
    const turn = portraitTurn(from, arrival);
    const current = typeof axis.azimuth === 'number' ? axis.azimuth : null;
    const escrito = current === null ? '—' : String(current);
    const muda = current !== turn;
    if (muda) {
      portal.window.azimuth = turn;
      files.get(slug).written = true;
    }
    console.log((slug + ' ' + portal.id).padEnd(19) + String(action.target).padEnd(11) +
      pad(round(from).toFixed(1), 10) + pad(round(arrival).toFixed(1), 12) + pad(turn.toFixed(1), 8) +
      '   ' + escrito + (muda ? (current === null ? ' → escreve' : ' → ' + turn) : ''));
  }
}

console.log('');
console.log(pairs + ' porta(s) de retrato, ' + missing + ' sem porta de chegada');
if (missing > 0) {
  // Uma porta de fixture não conta; uma sala sem porta de chegada é a L19 a falhar, e o validador di-lo.
  console.log('(a lei L19 responde pelas que faltam)');
}

if (!apply) {
  const changes = [...files.entries()].filter(([, file]) => file.written).map(([slug]) => slug);
  console.log(changes.length === 0 ? 'o dado já diz o mesmo — nada a escrever'
    : 'mudaria: ' + changes.join(', ') + ' (nada foi escrito: --aplicar)');
  process.exit(0);
}

for (const [slug, file] of files) {
  if (!file.written) continue;
  const text = JSON.stringify(worlds.get(slug), null, 2).replace(/\n/g, file.eol) + file.eol;
  writeFileSync(join(directory, file.name), text, 'utf8');
}
const written = [...files.entries()].filter(([, file]) => file.written).map(([slug]) => slug);
console.log(written.length === 0 ? 'nada a escrever' : 'escrito: ' + written.join(', '));
