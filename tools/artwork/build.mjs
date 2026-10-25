// Gera a ficha de cada obra — uma página estática por obra (D60).
//
// Porque uma ferramenta e não escrita à mão: a ficha é feita de dado que já existe (título, autor,
// sinopse, o ficheiro do catálogo, o site), e escrever N ficheiros à mão é a mesma duplicação que a
// D20 fechou para os endereços — o dado mudava e a página ficava a mentir. A ferramenta lê
// `data/worlds/*.json`, escreve `<mundo>/obras/<id>.html` e regista no ficheiro o **resumo do dado**
// com que o fez: é isso que o validador compara depois para dizer «esta ficha está velha» (lei L20).
//
// Uso, da raiz do projeto:
//
//   node tools/artwork/build.mjs              escreve as fichas que faltam ou mudaram
//   node tools/artwork/build.mjs --force      escreve todas
//   node tools/artwork/build.mjs --check      não escreve; diz quais estão velhas (código 1 se houver)
//
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { artworkPagePath } from '../../js/scene/artwork-page.js';
import { textIn, ORIGIN_LANGUAGE, LANGUAGES } from '../../js/scene/schema.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

// O resumo que fica escrito na ficha: muda quando muda o que a ficha mostra. Não leva o mundo inteiro
// — só o que a página usa (a obra, o nome do mundo, o catálogo dela) —, para uma alteração numa
// dimensão não obrigar a regerar tudo.
export function pageFingerprint(world, artwork) {
  const catalogue = world.assets || {};
  const usados = {};
  if (artwork.asset && catalogue[artwork.asset]) usados[artwork.asset] = catalogue[artwork.asset];
  const resumo = {
    mundo: world.world && world.world.slug,
    nome: world.world && world.world.name,
    obra: {
      id: artwork.id,
      kind: artwork.kind,
      asset: artwork.asset || null,
      title: artwork.title || null,
      author: artwork.author || null,
      synopsis: artwork.synopsis || null,
      text: artwork.text || null,
      site: artwork.site || null
    },
    assets: usados
  };
  return createHash('sha1').update(JSON.stringify(resumo)).digest('hex').slice(0, 16);
}

const escapeHtml = (value) => String(value === null || value === undefined ? '' : value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// O texto de uma linha em todas as línguas, cada uma no seu elemento: a página mostra a pedida e
// esconde as outras sem ir à rede. É o mesmo contrato do `data-i18n` da exposição, resolvido no
// ficheiro porque a ficha é estática.
function porLingua(value, tag, className) {
  const partes = [];
  for (const language of LANGUAGES) {
    const texto = textIn(value, language);
    if (!texto) continue;
    partes.push('        <' + tag + ' class="' + className + '" data-lang="' + language + '">' +
      escapeHtml(texto) + '</' + tag + '>');
  }
  return partes.join('\n');
}

// O meio da obra. Cada tipo mostra o que o ficheiro permite; o `site` é a única coisa que não vem do
// catálogo, e é a que a ficha tenta embutir (D60).
function media(artwork, catalogue, prefix) {
  const asset = artwork.asset ? catalogue[artwork.asset] : null;
  const caminho = asset && asset.path ? prefix + asset.path : null;
  const alt = asset ? (textIn(asset.alt, ORIGIN_LANGUAGE) || '') : '';
  const imagem = caminho
    ? '<img class="meio-imagem" src="' + escapeHtml(caminho) + '" alt="' + escapeHtml(alt) + '">'
    : '';

  if (artwork.kind === 'video' && caminho) {
    return '      <div class="meio">\n' +
      '        <video class="meio-video" controls playsinline preload="metadata">\n' +
      '          <source src="' + escapeHtml(caminho) + '">\n' +
      '        </video>\n' +
      '      </div>';
  }
  if (artwork.kind === 'image' && caminho) {
    return '      <div class="meio">\n        ' + imagem + '\n      </div>';
  }
  if (artwork.kind === 'text') {
    // O texto é o conteúdo: a ficha compõe-no como uma folha, na língua pedida.
    return '      <div class="meio meio-texto">\n' + porLingua(artwork.text, 'p', 'texto-da-obra') + '\n      </div>';
  }
  if (artwork.kind === 'model' && caminho) {
    // Um GLTF mostra-se na própria ficha, com o mesmo A-Frame da exposição (nenhuma dependência nova).
    return '      <div class="meio">\n' +
      '        <a-scene embedded class="meio-modelo" vr-mode-ui="enabled: false">\n' +
      '          <a-entity gltf-model="' + escapeHtml(caminho) + '" rotation="0 25 0"\n' +
      '                    animation="property: rotation; to: 0 385 0; loop: true; dur: 24000; easing: linear"></a-entity>\n' +
      '          <a-entity camera position="0 1 2.4"></a-entity>\n' +
      '          <a-entity light="type: ambient; intensity: 0.9"></a-entity>\n' +
      '          <a-entity light="type: directional; intensity: 0.8" position="1 2 2"></a-entity>\n' +
      '        </a-scene>\n' +
      '      </div>';
  }
  // Uma obra cujo conteúdo é uma **página** (jogo, escultura interactiva, o site da obra): o site fica
  // por cima e a imagem da obra por baixo. Se o site não carregar em 4 s, a imagem é o que se vê — e o
  // botão «Abrir o site» está sempre lá (D60).
  if (artwork.kind === 'site' && artwork.site) {
    return '      <div class="meio meio-site" data-site="' + escapeHtml(artwork.site) + '">\n' +
      '        ' + (imagem || '<div class="meio-imagem meio-vazio" aria-hidden="true"></div>') + '\n' +
      '        <iframe class="meio-site-iframe" title="' +
      escapeHtml(textIn(artwork.title, ORIGIN_LANGUAGE) || '') + '" src="' + escapeHtml(artwork.site) + '"\n' +
      '                loading="lazy" referrerpolicy="no-referrer"' +
      ' sandbox="allow-scripts allow-same-origin allow-popups allow-forms"></iframe>\n' +
      '      </div>';
  }
  return '      <div class="meio">\n        ' + imagem + '\n      </div>';
}

// O nome da obra na ficha: o `title` do dado e, sem ele, o id do asset — não a descrição do ficheiro,
// que é uma legenda («vídeo usado como obra…») e não um título. Uma obra sem `title` fica visível na
// ficha como o que ela é: uma obra ainda por nomear.
function tituloDe(artwork, catalogue) {
  const doDado = textIn(artwork.title, ORIGIN_LANGUAGE);
  if (doDado) return { valor: artwork.title, simples: doDado };
  const nome = artwork.asset || ('#' + artwork.id);
  return { valor: { [ORIGIN_LANGUAGE]: nome }, simples: nome };
}

export function renderArtworkPage(world, artwork) {
  const slug = world.world.slug;
  const catalogue = world.assets || {};
  const prefix = '../../';
  const nome = tituloDe(artwork, catalogue);
  const titulo = nome.simples;
  const nomeDoMundo = textIn(world.world.name, ORIGIN_LANGUAGE) || slug;
  const site = artwork.site || '';
  const marca = pageFingerprint(world, artwork);
  const voltar = 'Voltar para a exposição';

  return `<!DOCTYPE html>
<!-- Gerado por tools/artwork/build.mjs a partir de data/worlds/${slug}.json.
     Não editar à mão: a próxima geração escreve por cima. O dado com que esta ficha foi feita é
     ${marca}. -->
<html lang="pt-BR" data-ficha="${marca}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(titulo)} — ${escapeHtml(nomeDoMundo)}</title>
    <link rel="icon" href="data:,">
    <link rel="stylesheet" href="../../css/obra.css">
  </head>
  <body>
    <main class="ficha">
      <p class="exposicao">${escapeHtml(nomeDoMundo)}</p>

      <a class="voltar" href="../">&larr; ${voltar}</a>

${media(artwork, catalogue, prefix)}

      <h1 class="titulo">
${porLingua(nome.valor, 'span', 'titulo-texto')}
      </h1>

${porLingua(artwork.author, 'p', 'autor')}

${porLingua(artwork.synopsis, 'p', 'sinopse')}

${site ? '      <p class="site"><a class="botao-site" href="' + escapeHtml(site) +
    '" target="_blank" rel="noopener noreferrer">Abrir o site da obra</a></p>\n' : ''}      <a class="voltar rodape" href="../">&larr; ${voltar}</a>
    </main>
    <script src="https://aframe.io/releases/1.8.0/aframe.min.js"></script>
    <script>
      // A língua vem no endereço, como em todo o lado (D12): as duas estão escritas na página e esta
      // linha mostra a pedida. Sem JavaScript a página mostra as duas, que é melhor do que nenhuma.
      (function () {
        var pedida = new URLSearchParams(location.search).get('lang');
        var lingua = pedida === 'en' ? 'en' : 'pt';
        document.documentElement.lang = lingua === 'en' ? 'en' : 'pt-BR';
        document.querySelectorAll('[data-lang]').forEach(function (el) {
          el.hidden = el.getAttribute('data-lang') !== lingua;
        });
      })();

      // O site embutido: se não carregar em 4 s, a imagem da obra (que está por baixo) é o que fica.
      // Um site que **recusa** ser embutido (X-Frame-Options) chega a disparar o evento, e contra isso
      // nenhuma página pode fazer nada — o botão «Abrir o site» está sempre lá, e é a saída.
      (function () {
        var caixa = document.querySelector('.meio-site');
        if (!caixa) return;
        var iframe = caixa.querySelector('iframe');
        var chegou = false;
        iframe.addEventListener('load', function () { chegou = true; caixa.classList.add('carregado'); });
        iframe.addEventListener('error', function () { caixa.classList.add('falhou'); });
        setTimeout(function () { if (!chegou) caixa.classList.add('falhou'); }, 4000);
      })();
    </script>
  </body>
</html>
`;
}

function loadWorlds() {
  const directory = join(root, 'data', 'worlds');
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .map((name) => JSON.parse(readFileSync(join(directory, name), 'utf8')))
    .filter((world) => world && world.world && Array.isArray(world.artworks) && world.artworks.length > 0);
}

function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const check = args.includes('--check');
  const escritas = [];
  const velhas = [];

  for (const world of loadWorlds()) {
    const slug = world.world.slug;
    for (const artwork of world.artworks) {
      const path = artworkPagePath(slug, artwork.id);
      const file = join(root, path);
      const html = renderArtworkPage(world, artwork);
      const existe = existsSync(file);
      const igual = existe && readFileSync(file, 'utf8') === html;
      if (igual && !force) continue;
      if (check) {
        velhas.push(path + (existe ? ' (desactualizada)' : ' (não existe)'));
        continue;
      }
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, html, 'utf8');
      escritas.push(path + (existe ? ' (reescrita)' : ''));
    }
  }

  if (check) {
    if (velhas.length === 0) {
      console.log('fichas de obra: todas em dia');
      return;
    }
    console.log('fichas de obra desactualizadas (' + velhas.length + '):');
    for (const linha of velhas) console.log('  ' + linha);
    console.log('corre `node tools/artwork/build.mjs` para as escrever');
    process.exit(1);
  }

  if (escritas.length === 0) {
    console.log('fichas de obra: nada a escrever (todas em dia)');
    return;
  }
  console.log('fichas de obra escritas (' + escritas.length + '):');
  for (const linha of escritas) console.log('  ' + linha);
}

// O `main` só corre quando este ficheiro é o programa: o validador importa daqui o `pageFingerprint`
// para provar que a ficha está em dia, e importar não pode escrever ficheiros.
const executadoComoPrograma = Boolean(process.argv[1]) &&
  fileURLToPath(import.meta.url).replace(/\\/g, '/') === process.argv[1].replace(/\\/g, '/');

if (executadoComoPrograma) main();
