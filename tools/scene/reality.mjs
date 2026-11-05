#!/usr/bin/env node
// Os buracos do mundo real, escritos no dado (D81).
//
// Porque existe: uma porta `dimension-pair` que mostra a dimensão `camera` não desenha nada — o
// visitante vê o **mundo real** através dela porque o `<video>` da câmara fica atrás do canvas do
// renderer. A janela de uma porta de mundo é uma fotografia, e nela esse sítio ficava com o fundo do
// destino: via-se o céu onde ao chegar se vê a câmara. Medido na porta 7 da sala 3, **0,72** de salto
// (e 1,70 na porta 9 da sala 4) onde a meta é 0,50.
//
// A conta vive em `js/scene/reality.js` (`realityHoles`) — a mesma que a lei L28 usa para provar o
// dado. Aqui lê-se o disco, imprime-se a tabela e, só com `--aplicar`, escreve-se.
//
// Uso: node tools/scene/reality.mjs [--aplicar] [mundo...]
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { writeAtomic } from '../coordination/atomic.mjs';
import { oficina } from '../coordination/locks.mjs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { realityHoles, sameHoles } from '../../js/scene/reality.js';
import { FIXTURES } from '../../js/scene/fixtures.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');

const args = process.argv.slice(2);
const apply = args.includes('--aplicar');
const wanted = args.filter((arg) => !arg.startsWith('--'));

const directory = join(root, 'data', 'worlds');
if (!existsSync(directory)) {
  console.error('data/worlds/ não existe — os buracos medem-se no dado, e o dado não está aqui');
  process.exit(1);
}

const worlds = new Map();
const files = new Map();
for (const name of readdirSync(directory).filter((entry) => entry.endsWith('.json'))) {
  const text = readFileSync(join(directory, name), 'utf8');
  const scene = JSON.parse(text);
  const slug = (scene.world && scene.world.slug) || basename(name, '.json');
  worlds.set(slug, scene);
  files.set(slug, { name: name, eol: text.includes('\r\n') ? '\r\n' : '\n', written: false });
}

// As páginas que esta ferramenta olha: as salas e os mundos cujas portas navegam sem origem
// (`carryOrigin: false`) — a sala de ensaio. Esses não têm porta de chegada no destino, mas têm janelas
// e portanto buracos a calcular: o que entra na fotografia é o que se vê da **pose de uma primeira
// visita** (D89). Um fixture sem essa marca continua de fora.
const rooms = [...worlds.keys()]
  .filter((slug) => !FIXTURES.includes(slug) ||
    Boolean(worlds.get(slug).world && worlds.get(slug).world.carryOrigin === false))
  .filter((slug) => wanted.length === 0 || wanted.includes(slug));

const formatar = (holes) => (holes.length === 0 ? '—'
  : holes.map((hole) => '[' + [hole.az0, hole.el0, hole.az1, hole.el1].join(', ') + ']').join(' '));

let pairs = 0;
let withHoles = 0;
let semChegada = 0;
console.log('porta               vai para   buracos (az0, el0, az1, el1)');
for (const slug of rooms) {
  const scene = worlds.get(slug);
  for (const portal of scene.portals || []) {
    const axis = portal.window || {};
    const action = portal.action || {};
    if (axis.kind !== 'preview' || action.kind !== 'navigate') continue;
    pairs += 1;
    const destino = worlds.get(action.target);
    if (!destino) {
      console.log((slug + ' ' + portal.id).padEnd(19) + String(action.target).padEnd(11) + '  (destino desconhecido)');
      continue;
    }
    // Uma porta de uma sala que navega **sem origem** (D84) não tem porta de chegada no destino — mas
    // tem janela, e os buracos contam-se na mesma: o que entra na fotografia é o que se vê da pose de
    // uma primeira visita (D89). É a L19 que responde pelas salas a que falta a chegada.
    const primeiraVisita = Boolean(scene.world && scene.world.carryOrigin === false);
    if (!primeiraVisita && !(destino.portals || []).some((door) => door.arrivalFrom === slug)) {
      semChegada += 1;
      console.log((slug + ' ' + portal.id).padEnd(19) + String(action.target).padEnd(11) +
        '  (sem porta de chegada — a L19 responde)');
      continue;
    }
    const holes = realityHoles(destino, slug);
    if (holes.length > 0) withHoles += 1;
    const current = Array.isArray(axis.reality) ? axis.reality : [];
    const muda = !sameHoles(current, holes);
    if (muda) {
      if (holes.length === 0) delete portal.window.reality;
      else portal.window.reality = holes;
      files.get(slug).written = true;
    }
    console.log((slug + ' ' + portal.id).padEnd(19) + String(action.target).padEnd(11) + '  ' +
      formatar(holes) + (muda ? '  → escreve' : ''));
  }
}

console.log('');
console.log(pairs + ' porta(s) de retrato, ' + withHoles + ' com o mundo real à vista, ' +
  semChegada + ' sem porta de chegada');

if (!apply) {
  const changes = [...files.entries()].filter(([, file]) => file.written).map(([slug]) => slug);
  console.log(changes.length === 0 ? 'o dado já diz o mesmo — nada a escrever'
    : 'mudaria: ' + changes.join(', ') + ' (nada foi escrito: --aplicar)');
  process.exit(0);
}

for (const [slug, file] of files) {
  if (!file.written) continue;
  // A oficina (D96, M1) — a mesma razão do `azimuths`: os ficheiros são partilhados.
  oficina('os buracos do mundo real (reality --aplicar)', () => {
    const text = JSON.stringify(worlds.get(slug), null, 2).replace(/\n/g, file.eol) + file.eol;
    writeAtomic(join(directory, file.name), text);
  });
}
const written = [...files.entries()].filter(([, file]) => file.written).map(([slug]) => slug);
console.log(written.length === 0 ? 'nada a escrever' : 'escrito: ' + written.join(', '));
