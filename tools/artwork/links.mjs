#!/usr/bin/env node
// O que os links das obras fazem, de verdade (D108).
//
// Porque existe: o `validate` não pergunta nada a um endereço remoto — por desenho, porque a exposição
// não pode depender de um servidor alheio para validar o próprio dado. E um `fetch` que responda 200
// ainda não responde à pergunta que interessa: a ficha mostra a obra **num `<iframe>`**, e um site pode
// recusar-se a ser embutido (`X-Frame-Options`, `CSP frame-ancestors`). Nesse caso a obra abre numa
// caixa vazia — sem erro no dado, sem aviso no validador, e só visível a quem abrir a página.
//
// O que verifica, por obra: o `site` (existe? responde? deixa embutir?) e a capa remota (existe? é uma
// imagem?). Uma capa local não se verifica aqui — essa pergunta é do `validate` (L9), que a sabe
// responder sem rede.
//
// As plataformas que o projecto converte para um endereço de embed próprio (`js/scene/platform-embed.js`
// — YouTube, p5.js, Vimeo, OpenProcessing, Shadertoy) são embutíveis por construção: para essas
// verifica-se o endereço do embed, não o original.
//
// Uso, da raiz do projeto:
//   node tools/artwork/links.mjs               todas as salas
//   node tools/artwork/links.mjs scene18       uma sala
//   node tools/artwork/links.mjs --tudo        também lista as que estão bem
//
// Sai com 1 quando encontra algum problema e 0 quando não encontra — é o que o torna utilizável numa
// bateria e num `&&` de shell.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from '../regression/harness.mjs';
import { platformEmbed } from '../../js/scene/platform-embed.js';

const MUNDOS = join(ROOT, 'data', 'worlds');
const argumentos = process.argv.slice(2);
const tudo = argumentos.includes('--tudo');
const pedidas = argumentos.filter((arg) => !arg.startsWith('--'));

const FIXTURES = new Set(['example', 'shader', 'r9', 'exemplo-ficha', 'scene100', 'gate']);

const salas = pedidas.length > 0
  ? pedidas
  : readdirSync(MUNDOS)
    .filter((nome) => nome.endsWith('.json'))
    .map((nome) => nome.replace('.json', ''))
    .filter((slug) => !FIXTURES.has(slug))
    .sort((a, b) => Number(a.replace('scene', '')) - Number(b.replace('scene', '')));

function espiar(url) {
  const controlo = new AbortController();
  const temporizador = setTimeout(() => controlo.abort(), 20000);
  return fetch(url, { redirect: 'follow', signal: controlo.signal })
    .then((resposta) => ({
      estado: resposta.status,
      tipo: (resposta.headers.get('content-type') || '').toLowerCase(),
      xfo: resposta.headers.get('x-frame-options') || '',
      csp: resposta.headers.get('content-security-policy') || ''
    }))
    .catch((erro) => ({ erro: erro.name === 'AbortError' ? 'tempo esgotado (20 s)' : erro.message }))
    .finally(() => clearTimeout(temporizador));
}

// Recusa explícita de iframe. `DENY` e `SAMEORIGIN` recusam sempre — a ficha vive noutro endereço.
function recusaDeEmbed(info) {
  if (info.xfo) {
    const valor = info.xfo.toLowerCase();
    if (valor.includes('deny') || valor.includes('sameorigin')) return 'X-Frame-Options: ' + info.xfo;
  }
  if (info.csp) {
    const achado = /frame-ancestors([^;]*)/i.exec(info.csp);
    if (achado) {
      const valor = achado[1].trim().toLowerCase();
      if (!valor.includes('*') && !valor.includes('http://127.0.0.1') && !valor.includes('http://localhost')) {
        return 'CSP frame-ancestors' + achado[1];
      }
    }
  }
  return null;
}

const problemas = [];
const revistas = [];
const add = (tipo, onde, detalhe) => problemas.push({ tipo, onde, detalhe });

const alvos = [];
for (const slug of salas) {
  const ficheiro = join(MUNDOS, slug + '.json');
  if (!existsSync(ficheiro)) { add('sala inexistente', slug, ficheiro); continue; }
  const cena = JSON.parse(readFileSync(ficheiro, 'utf8'));
  for (const obra of cena.artworks || []) {
    const capa = obra.asset ? (cena.assets || {})[obra.asset] : null;
    alvos.push({
      slug,
      id: obra.id,
      titulo: (obra.title && obra.title.pt) || '?',
      site: obra.site || null,
      embed: obra.site ? platformEmbed(obra.site) : null,
      capa: capa && capa.path ? capa.path : null
    });
  }
}

console.log('');
console.log(salas.length + ' sala(s) · ' + alvos.length + ' obra(s) · a verificar…');

const fila = alvos.slice();
let feitos = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (fila.length > 0) {
    const alvo = fila.shift();
    const onde = alvo.slug + ' · obra ' + alvo.id + ' «' + alvo.titulo + '»';
    feitos++;

    if (alvo.site) {
      const info = await espiar(alvo.site);
      if (info.erro) add('site não responde', onde, alvo.site + ' — ' + info.erro);
      else if (info.estado >= 400) add('site com erro HTTP', onde, alvo.site + ' — HTTP ' + info.estado);
      else if (alvo.embed.platform === 'site') {
        const recusa = recusaDeEmbed(info);
        if (recusa) add('site não pode ser embutido', onde, alvo.site + ' — ' + recusa);
      } else if (alvo.embed.platform === 'youtube') {
        const video = await espiar(alvo.embed.src);
        if (video.erro || video.estado >= 400) {
          add('vídeo do YouTube não abre', onde, alvo.embed.src + ' — ' + (video.erro || 'HTTP ' + video.estado));
        }
      }
    }

    if (alvo.capa && /^https?:\/\//i.test(alvo.capa)) {
      const info = await espiar(alvo.capa);
      if (info.erro) add('capa remota não responde', onde, alvo.capa + ' — ' + info.erro);
      else if (info.estado >= 400) add('capa remota com erro HTTP', onde, alvo.capa + ' — HTTP ' + info.estado);
      else if (!info.tipo.startsWith('image/')) add('capa remota não é imagem', onde, alvo.capa + ' — ' + info.tipo);
    }

    revistas.push(onde);
    if (feitos % 25 === 0) console.log('  … ' + feitos + '/' + alvos.length);
  }
}));

console.log('');
if (problemas.length === 0) {
  console.log('nenhum problema de link em ' + alvos.length + ' obra(s)');
  if (tudo) for (const onde of revistas) console.log('  ok ' + onde);
  process.exit(0);
}

const porTipo = new Map();
for (const p of problemas) porTipo.set(p.tipo, (porTipo.get(p.tipo) || 0) + 1);
console.log('=== PROBLEMAS: ' + problemas.length + ' ===');
for (const [tipo, n] of [...porTipo].sort((a, b) => b[1] - a[1])) console.log('  ' + String(n).padStart(4) + '  ' + tipo);
console.log('');
for (const tipo of [...porTipo.keys()]) {
  console.log('--- ' + tipo + ' ---');
  for (const p of problemas.filter((x) => x.tipo === tipo)) {
    console.log('  ' + p.onde);
    if (p.detalhe) console.log('      ' + p.detalhe);
  }
  console.log('');
}
console.log('a lista viva está em docs/PENDENCIAS.md');
process.exit(1);
