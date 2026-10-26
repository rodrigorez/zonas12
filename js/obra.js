// A ficha da obra (D60) desenhada ao carregar — uma página só (D62).
//
// O autor pediu «somente 1 arquivo que ao carregar ele muda o conteudo»: em vez de vinte e um HTML
// gerados, `obra.html` lê do endereço **qual** mundo e **qual** obra (`?mundo=scene1&id=3&lang=pt`),
// vai buscar `data/worlds/<mundo>.json` e desenha a ficha com o mesmo desenho das Zonas 11 (D61) — o
// nome da exposição, o «voltar», o meio da obra, o título, o autor e a sinopse. O endereço continua a
// ser **de cada obra**, que é o que a medição precisa (D62): `?mundo=…&id=…` distingue as obras, e é
// esse o endereço que a GA guarda.
//
// Nada aqui é dado de outro sítio: o título, o autor, a sinopse, o site e a capa vêm do mundo, e a
// língua vem do endereço (D12). Sem JavaScript a página não mostra a obra — é o preço de um ficheiro
// só, e é o mesmo preço que a exposição já paga (a sala também é construída do dado).
import { textIn, ORIGIN_LANGUAGE } from './scene/schema.js';
import { platformEmbed } from './scene/platform-embed.js';
import { artworkPageRequest, artworkBackHref } from './scene/artwork-page.js';
import { startAnalytics, pageLocation } from './scene/analytics.js';
import { initI18n, t, languageFromUrl } from './i18n.js';

const AFRAME_VERSION = '1.8.0';
const SITE_LOAD_TIMEOUT = 4000;
const host = document.getElementById('ficha');
const request = artworkPageRequest(window.location.search);

// O que a ficha é, para os instrumentos: `mundo`, `id`, `kind`, o meio que a obra pediu (`planned`) e
// o que foi desenhado (`medium` — diferente quando o meio falhou e ficou a capa). A bateria lê isto em
// vez de adivinhar pelo desenho, e um endereço inválido diz-se aqui em vez de dar um erro na consola.
window.obraDebug = { request: request, world: null, artworkId: null, kind: null, medium: null, planned: null };

function row(className) {
  const element = document.createElement('div');
  element.className = className;
  host.appendChild(element);
  return element;
}

function backLink(worldSlug) {
  const link = document.createElement('a');
  link.className = 'botao-voltar';
  link.href = artworkBackHref(worldSlug);
  link.textContent = '← ' + t('artwork.page.back');
  host.appendChild(link);
  return link;
}

function assetPath(world, artwork) {
  const asset = artwork.asset && world.assets ? world.assets[artwork.asset] : null;
  return asset && asset.path ? asset : null;
}

function coverImage(world, artwork, language) {
  const asset = assetPath(world, artwork);
  if (!asset || asset.type !== 'image') return null;
  const image = document.createElement('img');
  image.className = 'meio-imagem';
  image.src = asset.path;
  image.alt = textIn(asset.alt, language) || '';
  return image;
}

// O nome da obra: o `title` do dado e, sem ele, o id do asset — nunca a legenda do ficheiro, que é uma
// descrição («vídeo usado como obra…») e não um título. Uma obra por nomear mostra o que é.
function titleOf(artwork) {
  const named = textIn(artwork.title, ORIGIN_LANGUAGE);
  if (named) return artwork.title;
  return { [ORIGIN_LANGUAGE]: artwork.asset || ('#' + artwork.id) };
}

// O A-Frame vem do CDN, como na exposição. Se não chegar (rede lenta, CDN em baixo), a ficha **não**
// pode ficar sem o resto: há um limite e há um meio de reserva.
const AFRAME_TIMEOUT = 8000;

function loadAframe() {
  if (window.AFRAME) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://aframe.io/releases/' + AFRAME_VERSION + '/aframe.min.js';
    const timer = setTimeout(() => reject(new Error('A-Frame não carregou em ' + AFRAME_TIMEOUT + ' ms')), AFRAME_TIMEOUT);
    script.onload = () => { clearTimeout(timer); resolve(); };
    script.onerror = () => { clearTimeout(timer); reject(new Error('A-Frame não carregou')); };
    document.head.appendChild(script);
  });
}

async function drawMedium(world, artwork, language) {
  const asset = assetPath(world, artwork);
  const kind = artwork.kind;

  if (kind === 'site' && artwork.site) {
    const embed = platformEmbed(artwork.site);
    const box = row('linha meio meio-site');
    box.setAttribute('data-meio', 'site');
    box.setAttribute('data-site', artwork.site);
    box.setAttribute('data-platform', embed.platform);
    box.appendChild(coverImage(world, artwork, language) || (() => {
      const empty = document.createElement('div');
      empty.className = 'meio-imagem meio-vazio';
      empty.setAttribute('aria-hidden', 'true');
      return empty;
    })());
    const frame = document.createElement('iframe');
    frame.className = 'meio-site-iframe';
    frame.title = textIn(artwork.title, ORIGIN_LANGUAGE) || '';
    frame.src = embed.src;
    frame.loading = 'lazy';
    // Sem `referrerpolicy="no-referrer"`: o YouTube recusa embutir sem referrer (erro 153, uma página
    // de erro que carrega como se tivesse corrido bem e nenhuma página consegue detetar). O defeito
    // apareceu no primeiro exemplo com um site a sério; o `strict-origin-when-cross-origin` que os
    // browsers usam por omissão manda só a origem, que é tudo o que o embed precisa.
    frame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-forms allow-presentation');
    if (embed.allow) frame.setAttribute('allow', embed.allow);
    if (embed.fullscreen) frame.setAttribute('allowfullscreen', '');
    // A imagem fica por baixo e só sai de lá quando o site carrega. Um site que **recusa** ser
    // embutido dispara o `load` na mesma, e contra isso nenhuma página pode fazer nada — o botão
    // «Abrir o site» é a saída e está sempre lá.
    frame.addEventListener('load', () => box.classList.add('carregado'));
    frame.addEventListener('error', () => box.classList.add('falhou'));
    setTimeout(() => { if (!box.classList.contains('carregado')) box.classList.add('falhou'); }, SITE_LOAD_TIMEOUT);
    box.appendChild(frame);
    return 'site';
  }

  if (kind === 'video' && asset && asset.type === 'video') {
    const box = row('linha meio');
    box.setAttribute('data-meio', 'video');
    const video = document.createElement('video');
    video.className = 'meio-video';
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    const source = document.createElement('source');
    source.src = asset.path;
    video.appendChild(source);
    box.appendChild(video);
    return 'video';
  }

  if (kind === 'model' && asset) {
    await loadAframe();
    const box = row('linha meio');
    box.setAttribute('data-meio', 'model');
    const scene = document.createElement('a-scene');
    scene.setAttribute('embedded', '');
    scene.className = 'meio-modelo';
    scene.setAttribute('vr-mode-ui', 'enabled: false');
    scene.innerHTML =
      '<a-entity gltf-model="' + asset.path + '" rotation="0 25 0"' +
      ' animation="property: rotation; to: 0 385 0; loop: true; dur: 24000; easing: linear"></a-entity>' +
      '<a-entity camera position="0 1 2.4"></a-entity>' +
      '<a-entity light="type: ambient; intensity: 0.9"></a-entity>' +
      '<a-entity light="type: directional; intensity: 0.8" position="1 2 2"></a-entity>';
    box.appendChild(scene);
    return 'model';
  }

  if (kind === 'text') {
    const box = row('linha meio meio-texto');
    box.setAttribute('data-meio', 'text');
    const paragraph = document.createElement('p');
    paragraph.className = 'texto-da-obra';
    paragraph.textContent = textIn(artwork.text, language) || '';
    box.appendChild(paragraph);
    return 'text';
  }

  const box = row('linha meio');
  const cover = coverImage(world, artwork, language);
  if (cover) {
    box.setAttribute('data-meio', 'image');
    box.appendChild(cover);
    return 'image';
  }
  box.setAttribute('data-meio', 'none');
  return 'none';
}

function notFound(worldName, slug) {  if (worldName) {
    const exhibition = row('linha exposicao');
    exhibition.textContent = worldName;
  }
  const box = row('linha');
  const paragraph = document.createElement('p');
  paragraph.className = 'sinopse';
  paragraph.textContent = t('artwork.page.notFound');
  box.appendChild(paragraph);
  backLink(slug);
  document.title = t('artwork.page.notFound');
}

// O meio de reserva, quando o que a obra pedia não pôde ser desenhado: a capa, se for uma imagem, e
// nada se nem isso houver. É o que impede um modelo sem A-Frame de deixar a ficha em branco.
function fallbackMedium(world, artwork, language) {
  const box = row('linha meio');
  const cover = coverImage(world, artwork, language);
  if (cover) {
    box.setAttribute('data-meio', 'image');
    box.appendChild(cover);
    return 'image';
  }
  box.setAttribute('data-meio', 'none');
  return 'none';
}

async function start() {
  const language = await initI18n(request ? request.language || languageFromUrl() : languageFromUrl());
  if (!request) {
    notFound(null, null);
    return;
  }

  let world;
  try {
    const response = await fetch('data/worlds/' + request.world + '.json');
    if (!response.ok) throw new Error('data/worlds/' + request.world + '.json: HTTP ' + response.status);
    world = await response.json();
  } catch (error) {
    console.warn('[obra] ' + error.message);
    notFound(null, request.world);
    return;
  }

  const worldName = textIn(world.world && world.world.name, language) || request.world;
  const artwork = (world.artworks || []).find((item) => item.id === request.id);
  if (!artwork) {
    notFound(worldName, request.world);
    return;
  }

  const title = textIn(titleOf(artwork), language);
  const author = textIn(artwork.author, language);
  const synopsis = textIn(artwork.synopsis, language);

  const exhibition = row('linha exposicao');
  exhibition.textContent = worldName;

  backLink(request.world);

  // O meio é a única parte que pode falhar (o A-Frame vem do CDN). Uma falha aqui não pode levar o
  // resto da ficha com ela: a obra fica com a capa e a página diz o nome, o autor e a sinopse.
  window.obraDebug.planned = artwork.kind;
  let medium;
  try {
    medium = await drawMedium(world, artwork, language);
  } catch (error) {
    console.warn('[obra] ' + (error && error.message ? error.message : error));
    medium = fallbackMedium(world, artwork, language);
  }

  const titleRow = row('linha');
  const titleText = document.createElement('span');
  titleText.className = 'titulo';
  titleText.textContent = title;
  titleRow.appendChild(titleText);

  if (author) {
    const authorRow = row('linha');
    const authorText = document.createElement('p');
    authorText.className = 'autor';
    authorText.textContent = author;
    authorRow.appendChild(authorText);
  }

  if (synopsis) {
    const synopsisRow = row('linha');
    const synopsisText = document.createElement('p');
    synopsisText.className = 'sinopse';
    synopsisText.textContent = synopsis;
    synopsisRow.appendChild(synopsisText);
  }

  if (artwork.site) {
    const link = document.createElement('a');
    link.className = 'botao-site';
    link.href = artwork.site;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = t('artwork.page.openSite');
    host.appendChild(link);
  }

  backLink(request.world);

  document.title = title + ' — ' + worldName;
  window.obraDebug.world = request.world;
  window.obraDebug.artworkId = request.id;
  window.obraDebug.kind = artwork.kind;
  window.obraDebug.medium = medium;

  // A página vista é enviada aqui, com o título da obra e o endereço que a identifica (D62). Sem ID
  // no mundo, não acontece nada — é o estado de hoje, enquanto as propriedades não existem.
  window.obraDebug.analytics = startAnalytics({
    id: world.analytics && world.analytics.id,
    title: title + ' — ' + worldName,
    location: pageLocation(window.location.href, ['mundo', 'id'])
  });
}

start().catch((error) => console.error('[obra] ' + (error && error.message ? error.message : error)));
