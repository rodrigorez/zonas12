#!/usr/bin/env node
// O ensaio das 27 portas do portão em dois anéis (proposta D96.1) — escrito na `scene100`, a sala de
// ensaio da D84, para não se tocar em nenhuma sala da exposição.
//
// Porque existe: a L24 obriga a uma porta ao portão em cada sala, por isso o portão acaba com uma
// porta por sala — 13 hoje, 27 no fim. A 90 m, 27 portas num anel dão **13,33°** de passo e **12,9 m**
// de folga entre bordas (contra 27,69° e 35,1 m hoje): deixa de ser uma sala e passa a ser uma
// vedação. Dois anéis concêntricos resolvem — mas só se **nenhuma porta esconder outra**, e isso é
// geometria, não gosto. É o que este ensaio mede, antes de a L22 mudar.
//
// O que ele escreve: `data/worlds/scene100.json` e mais nada. Todas as portas mostram o **mesmo
// retrato** (o que já existe, `retrato-scene3`), de propósito: o que se mede é o espaço e a leitura à
// distância, não a variedade das imagens — e assim não se gera um único retrato novo.
//
// Uso:
//   node tools/scene/ensaio-dois-aneis.mjs                 só mede (não escreve)
//   node tools/scene/ensaio-dois-aneis.mjs --aplicar       escreve a scene100
//   ... --salas 27 --interior 90 --exterior 180 --desvio meia-passo|nenhum

import { existsSync, readFileSync } from 'node:fs';
import { writeAtomic } from '../coordination/atomic.mjs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const ficheiro = join(root, 'data', 'worlds', 'scene100.json');

const args = process.argv.slice(2);
const aplicar = args.includes('--aplicar');
const numero = (nome, omissao) => {
  const indice = args.indexOf('--' + nome);
  if (indice === -1) return omissao;
  const valor = Number(args[indice + 1]);
  return Number.isFinite(valor) ? valor : omissao;
};
const SALAS = numero('salas', 27);
const R1 = numero('interior', 90);
const R2 = numero('exterior', 180);
const desvio = args.includes('--desvio') ? args[args.indexOf('--desvio') + 1] : 'meia-passo';

// As medidas do portão de hoje, que são a referência do ensaio.
const LARGURA = 8;
const ALTURA = 10;

// A porta que sai do ensaio para o portão (a D84: a sala de ensaio só se sai para o projeto), mais uma
// por sala. As duas metades ficam iguais quando o número é par — é o caso mais apertado, e por isso o
// que se ensaia.
const TOTAL = SALAS + 1;
const interior = Math.ceil(TOTAL / 2);
const exterior = TOTAL - interior;

const DEG = Math.PI / 180;
const passo = (n) => 360 / n;
const corda = (raio, passoGraus) => 2 * raio * Math.sin((passoGraus / 2) * DEG);
const ocupa = (raio) => 2 * Math.atan((LARGURA / 2) / raio) / DEG;
const normalizar = (graus) => ((graus % 360) + 360) % 360;
const distanciaAngular = (a, b) => {
  const d = Math.abs(normalizar(a) - normalizar(b));
  return d > 180 ? 360 - d : d;
};

// ---- a geometria dos dois anéis ----

const faseExterior = desvio === 'meia-passo' ? passo(exterior) / 2 : 0;

const lugares = [];
for (let i = 0; i < interior; i++) lugares.push({ anel: 'interior', raio: R1, angulo: i * passo(interior) });
for (let i = 0; i < exterior; i++) lugares.push({ anel: 'exterior', raio: R2, angulo: i * passo(exterior) + faseExterior });

// A folga de cada porta exterior à porta interior mais próxima — é a conta que a estética depende.
const angulosInteriores = lugares.filter((l) => l.anel === 'interior').map((l) => l.angulo);
const piorExterior = lugares
  .filter((l) => l.anel === 'exterior')
  .reduce((pior, l) => Math.max(pior, Math.min(...angulosInteriores.map((a) => distanciaAngular(l.angulo, a)))), 0);

// ---- o relatório ----

const linha = (rotulo, raio, n, valorPasso) => {
  const ch = corda(raio, valorPasso);
  const oc = ocupa(raio);
  return {
    anel: rotulo,
    portas: n,
    raio: raio + ' m',
    passo: valorPasso.toFixed(2) + '°',
    corda: ch.toFixed(1) + ' m',
    folga: (ch - LARGURA).toFixed(1) + ' m',
    'porta ocupa': oc.toFixed(2) + '°',
    'passo/porta': (valorPasso / oc).toFixed(2) + '×'
  };
};

console.table([
  linha('referência (hoje: 13 a 90 m)', R1, 13, passo(13)),
  linha('interior', R1, interior, passo(interior)),
  linha('exterior', R2, exterior, passo(exterior))
]);

const precisa = (ocupa(R1) + ocupa(R2)) / 2;
console.log('');
console.log(`ensaio: ${TOTAL} portas (${SALAS} salas + a porta do portão) em dois anéis — ` +
  `${interior} a ${R1} m e ${exterior} a ${R2} m, desvio ${desvio}`);
console.log(`pior caso exterior↔interior: ${piorExterior.toFixed(2)}° ` +
  `(precisa ${precisa.toFixed(2)}° para as janelas não se tocarem) — ` +
  (piorExterior >= precisa ? 'nenhuma porta esconde outra' : 'HÁ SOBREPOSIÇÃO'));
console.log(`folga entre bordas no anel interior: ${(corda(R1, passo(interior)) - LARGURA).toFixed(1)} m` +
  ` · no exterior: ${(corda(R2, passo(exterior)) - LARGURA).toFixed(1)} m`);
console.log(`fundo do ensaio: 500 m — o anel exterior a ${R2} m cabe dentro dele (L1)`);

if (!aplicar) {
  console.log('');
  console.log('nada foi escrito. Para escrever a scene100:');
  console.log('  node tools/scene/ensaio-dois-aneis.mjs --aplicar');
  process.exit(0);
}

// ---- o mundo de ensaio ----

if (!existsSync(ficheiro)) {
  console.error('ensaio-dois-aneis: data/worlds/scene100.json não existe (a sala de ensaio é da D84)');
  process.exit(1);
}
const anterior = readFileSync(ficheiro, 'utf8');
const eol = anterior.includes('\r\n') ? '\r\n' : '\n';
const cena = JSON.parse(anterior);

// O mesmo retrato para todas as portas: o que já existe, com o shader e o recorte que a D53 exige
// (a janela desenha o fundo do destino ao vivo, e o destino é a `scene3`).
const RETRATO = { asset: 'retrato-scene3', shaderId: 'nuvens', cutout: 'recorte-scene3-de-scene100', destino: 'scene3' };

// Uma oscilação por porta, determinística (sem sorteio): o ensaio tem de ser reproduzível.
const oscilacao = (id) => ({
  kind: 'sway',
  axis: id % 3 === 1 ? [0, 1, 0] : [1, 0, 0],
  amplitude: 4 + (id % 2),
  period: 14.5 + (id % 5) * 0.9,
  rotationAxis: [0, 1, 0],
  angle: id % 4 === 0 ? 90 : 45,
  rotationPeriod: 12.1 + (id % 3) * 2.1
});

const portas = lugares.map((lugar, indice) => {
  const radianos = lugar.angulo * DEG;
  const posicao = [
    Math.round(lugar.raio * Math.sin(radianos) * 100) / 100,
    0,
    Math.round(-lugar.raio * Math.cos(radianos) * 100) / 100
  ];
  const rodagem = [0, Math.round(-lugar.angulo * 100) / 100, 0];
  // A porta 0 é a saída do ensaio (D84): mostra as duas dimensões e volta ao portão.
  const saida = indice === 0;
  return {
    id: indice,
    ownedBy: 0,
    position: posicao,
    width: LARGURA,
    height: ALTURA,
    box: [12, 16, 1],
    boxPosition: [0, 8, 0],
    boxRotation: [0, 0, 0],
    trigger: 'plane',
    frame: { color: saida ? '#33cc99' : '#ff0000', thickness: 0.3 },
    window: saida
      ? { kind: 'dimension-pair', dimensionA: 0, dimensionB: 1 }
      : { kind: 'preview', asset: RETRATO.asset, radius: 120, shaderId: RETRATO.shaderId, cutout: RETRATO.cutout },
    action: { kind: 'navigate', target: saida ? 'gate' : RETRATO.destino },
    rotation: rodagem,
    motion: oscilacao(indice)
  };
});

// Um só par de assets: o retrato e o recorte que todas as portas partilham.
cena.assets = {
  'fundo-100': cena.assets['fundo-100'],
  [RETRATO.asset]: cena.assets[RETRATO.asset],
  [RETRATO.cutout]: cena.assets[RETRATO.cutout]
};
cena.portals = portas;

writeAtomic(ficheiro, JSON.stringify(cena, null, 2).replace(/\n/g, eol) + eol);

console.log('');
console.log(`escrito: data/worlds/scene100.json (${portas.length} portas, ${interior} + ${exterior})`);
console.log('');
console.log('próximos passos (o ensaio não fica válido sem estes dois):');
console.log('  node tools/scene/azimuths.mjs --aplicar scene100');
console.log('  node tools/scene/reality.mjs --aplicar scene100');
console.log('  node tools/scene/validate.mjs');
console.log('e, para olhar: http://127.0.0.1:8123/?scene=scene100');
