#!/usr/bin/env node
// As capas remotas passam a viver no projeto (D107).
//
// Porque existe: uma capa remota tem quatro problemas que o `validate` não vê, porque por desenho não
// pergunta nada a um endereço de fora.
//
//   1. **CORS** — a janela da obra é um material WebGL, e o builder pede a imagem com
//      `crossorigin="anonymous"`. Um servidor sem `Access-Control-Allow-Origin` recusa-a: a obra fica
//      preta, sem um erro no dado (medido na obra «SoundRide 3», do Bandcamp).
//   2. **Rate limiting** — o builder pede **todas** as capas ao mesmo tempo, e o
//      `lh3.googleusercontent.com` responde **429** a partir de certo número. Medido: numa sala com 8
//      obras, **5 capas não carregaram**; numa com 5, 3. Os mesmos endereços, um a um, dão 200.
//   3. **Servidores que caem** — um WordPress de terceiro fecha a ligação sem aviso.
//   4. **Endereços que não são imagens** — `imgur.com/a/<id>` é a página do álbum (`text/html`), um
//      `drive.google.com/drive/folders/…` é uma pasta. Não há nada para carregar.
//
// O que faz: lê todos os mundos, descarrega cada capa remota, reduz a `--largura` (1200 por omissão),
// grava em `assets/artworks/capa-<slug>-<id>.jpg` e reescreve o caminho no dado.
//
// **O que NÃO faz: apagar.** Uma capa que não veio fica no dado e é reportada com o que fazer. A
// distinção importa — 8 das 9 medidas não são ficheiros inválidos, são ficheiros do Drive **não
// partilhados** (o Google devolve a página de autenticação, ~900 kB de HTML). Apagá-las seria perder a
// capa para sempre quando o autor a pode resolver em dois cliques. A excepção pede-se à mão, com
// `--tirar <slug>:<id>`.
//
// Uso, da raiz do projeto:
//   node tools/artwork/capas-locais.mjs --check              diz o que faria
//   node tools/artwork/capas-locais.mjs                      descarrega, reduz e escreve
//   node tools/artwork/capas-locais.mjs --largura 1600
//   node tools/artwork/capas-locais.mjs --tirar scene23:2    tira a capa de uma obra (a pedido)
//
// A redução usa o Chrome que os retratos já usam: um só browser para todas as imagens, com o canvas a
// fazer o trabalho. Não há dependência nova — o projeto não tem `package.json`, por decisão.
import { existsSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { writeAtomic } from '../coordination/atomic.mjs';
import { oficina } from '../coordination/locks.mjs';
import { openBrowser, serveProject, ROOT } from '../regression/harness.mjs';
import { FIXTURES } from '../../js/scene/fixtures.js';
import { ENTRY_WORLD } from '../../js/modules/portal-kinds.js';
import { validateScene } from '../../js/scene/validation.js';

const MUNDOS = join(ROOT, 'data', 'worlds');
const PASTA = join(ROOT, 'assets', 'artworks');
const argumentos = process.argv.slice(2);
const CHECK = argumentos.includes('--check');
const largura = (() => {
  const indice = argumentos.indexOf('--largura');
  return indice > 0 ? Math.max(200, Number(argumentos[indice + 1]) || 1200) : 1200;
})();
const aTirar = new Set();
for (let i = 0; i < argumentos.length; i++) {
  if (argumentos[i] === '--tirar' && argumentos[i + 1]) aTirar.add(argumentos[i + 1]);
}

// O que fazer com uma capa que não veio. O recado é a instrução, não o diagnóstico.
const RECADO = {
  privado: 'partilhe o ficheiro no Drive como «qualquer pessoa com o link» e corra outra vez',
  pasta: 'o endereço é uma PASTA do Drive, não um ficheiro — dê o endereço da imagem',
  album: 'o endereço é a página de um álbum, não uma imagem — dê o endereço da imagem',
  erro: 'não foi possível ler agora — tente outra vez'
};

function classificar(url, motivo) {
  if (/\/folders\//.test(url)) return 'pasta';
  if (/imgur\.com\/a\//.test(url)) return 'album';
  if (/imagem|image/i.test(motivo)) {
    return /drive\.google|googleusercontent/.test(url) ? 'privado' : 'pagina';
  }
  return 'erro';
}

const mundos = [];
for (const ficheiro of readdirSync(MUNDOS).filter((nome) => nome.endsWith('.json'))) {
  const slug = ficheiro.replace('.json', '');
  if (FIXTURES.includes(slug) || slug === ENTRY_WORLD) continue;
  const caminho = join(MUNDOS, ficheiro);
  const texto = readFileSync(caminho, 'utf8');
  mundos.push({ slug, caminho, eol: texto.includes('\r\n') ? '\r\n' : '\n', cena: JSON.parse(texto) });
}

const alvos = [];
for (const mundo of mundos) {
  for (const [chave, asset] of Object.entries(mundo.cena.assets || {})) {
    if (!asset.path || !/^https?:\/\//i.test(asset.path)) continue;
    alvos.push({ mundo, chave, id: chave.replace(/^capa-/, ''), url: asset.path });
  }
}

if (alvos.length === 0) {
  console.log('não há capas remotas: nada a fazer');
  process.exit(0);
}

console.log('');
console.log(alvos.length + ' capa(s) remota(s) em ' + new Set(alvos.map((a) => a.mundo.slug)).size + ' mundo(s)');
console.log('alvo: assets/artworks/capa-<sala>-<id>.jpg, com ' + largura + ' px de largura');
console.log('');

// ---- descarregar ----
//
// Uma a uma, de propósito: é o rate limiting que estamos a resolver, e disparar 150 pedidos ao mesmo
// tempo era repetir o problema que a ferramenta existe para fechar.
const descarregadas = [];
const semImagem = [];
for (const alvo of alvos) {
  try {
    const resposta = await fetch(alvo.url, { redirect: 'follow' });
    const tipo = (resposta.headers.get('content-type') || '').toLowerCase();
    if (!resposta.ok) throw new Error('HTTP ' + resposta.status);
    if (!tipo.startsWith('image/')) throw new Error('não é uma imagem (' + tipo + ')');
    const bytes = Buffer.from(await resposta.arrayBuffer());
    if (bytes.length < 1024) throw new Error('ficheiro pequeno demais (' + bytes.length + ' B)');
    alvo.bytes = bytes;
    descarregadas.push(alvo);
  } catch (erro) {
    semImagem.push({ ...alvo, motivo: erro.message, classe: classificar(alvo.url, erro.message) });
  }
}

console.log('descarregadas: ' + descarregadas.length + ' · não guardadas: ' + semImagem.length);
if (semImagem.length > 0) {
  console.log('');
  console.log('NÃO GUARDADAS — ficam como estão no dado, para não se perder a capa:');
  for (const alvo of semImagem) {
    const obra = (alvo.mundo.cena.artworks || []).find((cada) => String(cada.id) === String(alvo.id));
    console.log('');
    console.log('  ' + alvo.mundo.slug + ' ' + alvo.chave + '  «' + (obra ? obra.title.pt : '?') + '»  [' + alvo.classe + ']');
    console.log('    ' + alvo.url);
    console.log('    -> ' + RECADO[alvo.classe]);
  }
  console.log('');
}

// ---- reduzir (um só Chrome para todas) ----
//
// O tamanho medido: 150 capas somam 71,8 MB, e a maioria tem 1600 px para um painel de 4 × 3 m. A
// 1200 px ficam em 15,3 MB — é o que faz a diferença entre um repositório que se clona e um que não.
if (descarregadas.length > 0) {
  console.log('a reduzir com o Chrome…');
  const site = await serveProject();
  const browser = await openBrowser({ width: 900, height: 700 });
  let total = 0;
  try {
    await browser.goto(site.base + '/', 60000).catch(() => { /* a página em si não importa */ });
    for (const alvo of descarregadas) {
      const base64 = alvo.bytes.toString('base64');
      const tipo = /\.png(\?|$)/i.test(alvo.url) ? 'image/png' : 'image/jpeg';
      const resultado = await browser.evaluate(`(async () => {
        const img = new Image();
        img.src = 'data:${tipo};base64,${base64}';
        await img.decode();
        const escala = Math.min(1, ${largura} / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * escala));
        const h = Math.max(1, Math.round(img.naturalHeight * escala));
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        return { dados: canvas.toDataURL('image/jpeg', 0.86).split(',')[1], w, h };
      })()`).catch((erro) => ({ erro: String(erro).slice(0, 120) }));
      if (!resultado || resultado.erro) {
        semImagem.push({ ...alvo, motivo: resultado && resultado.erro, classe: 'erro' });
        continue;
      }
      alvo.jpeg = Buffer.from(resultado.dados, 'base64');
      alvo.dimensao = resultado.w + 'x' + resultado.h;
      total += alvo.jpeg.length;
    }
  } finally {
    await browser.close();
    await site.close();
  }
  const prontas = descarregadas.filter((alvo) => alvo.jpeg);
  console.log('reduzidas: ' + prontas.length + ' · ' + (total / 1024 / 1024).toFixed(1) + ' MB no total');
  for (const alvo of prontas) {
    alvo.destino = 'assets/artworks/capa-' + alvo.mundo.slug + '-' + alvo.id + '.jpg';
    console.log('  ' + alvo.destino.padEnd(46) + alvo.dimensao.padStart(9) + '  ' + Math.round(alvo.jpeg.length / 1024) + ' kB');
  }
}

// ---- reescrever o dado ----
const tocados = new Map();
for (const alvo of descarregadas.filter((cada) => cada.jpeg)) {
  alvo.mundo.cena.assets[alvo.chave].path = alvo.destino;
  tocados.set(alvo.mundo.slug, alvo.mundo);
}
for (const alvo of semImagem) {
  if (!aTirar.has(alvo.mundo.slug + ':' + alvo.id)) continue;
  delete alvo.mundo.cena.assets[alvo.chave];
  const obra = (alvo.mundo.cena.artworks || []).find((cada) => String(cada.id) === String(alvo.id));
  if (obra && obra.asset === alvo.chave) delete obra.asset;
  tocados.set(alvo.mundo.slug, alvo.mundo);
  console.log('  tirada do dado (pedida): ' + alvo.mundo.slug + ' ' + alvo.chave +
    (obra ? ' («' + obra.title.pt + '») — a obra fica com o site' : ''));
}

if (tocados.size === 0) {
  console.log('nada a escrever');
  process.exit(0);
}

if (CHECK) {
  console.log('');
  console.log('mudaria: ' + [...tocados.keys()].sort().join(', ') + ' (nada foi escrito: --check)');
  process.exit(1);
}

mkdirSync(PASTA, { recursive: true });
for (const alvo of descarregadas.filter((cada) => cada.jpeg)) {
  writeAtomic(join(ROOT, alvo.destino), alvo.jpeg);
}

oficina('as capas locais', () => {
  for (const mundo of tocados.values()) {
    const relatorio = validateScene(mundo.cena, { exists: (caminho) => existsSync(join(ROOT, caminho)) });
    if (!relatorio.ok) {
      console.error('  ATENÇÃO: ' + mundo.slug + ' ficaria inválido:');
      for (const erro of relatorio.errors.slice(0, 4)) console.error('    ' + erro);
    }
    const corpo = JSON.stringify(mundo.cena, null, 2).replace(/\n/g, mundo.eol) + mundo.eol;
    writeAtomic(mundo.caminho, corpo);
  }
});

console.log('');
console.log('escrito: ' + descarregadas.filter((cada) => cada.jpeg).length + ' capa(s) em assets/artworks/ e ' +
  tocados.size + ' mundo(s)');
console.log('confirme com: node tools/scene/validate.mjs');
