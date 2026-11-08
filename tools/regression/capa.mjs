// A capa de uma obra, por tentativas (D65), medida no browser com pedidos bloqueados.
//
// O autor pediu a cadeia: buscar a capa ao YouTube; se não der, a capa indicada no CSV (que pode ser um
// endereço ou um ficheiro do projeto, e é opcional); e se nada der, uma imagem padrão que diz que a
// capa tem um problema e que é preciso avisar o administrador da galeria.
//
// O que se mede, com um browser novo por caso (o bloqueio de pedidos do Chrome não se limpa de forma
// fiável na mesma sessão):
//
//   1. com tudo a funcionar, a capa vem do **YouTube** (derivada do endereço do vídeo, sem nada escrito
//      no dado);
//   2. com o YouTube bloqueado, cai na **capa do CSV**;
//   3. com o YouTube e a capa do CSV bloqueados, cai na **imagem padrão** de aviso;
//   4. a imagem padrão está no projeto e carrega (é ela que se vê quando nada funciona);
//   5. na **sala**, a capa resolvida chega à malha da obra: nenhum id de `<a-assets>` se repete, as
//      obras desenham uma imagem descodificada e a obra sem capa desenha a imagem padrão.
//
// Uso, da raiz do projeto:
//
//   node tools/regression/capa.mjs
//
import { serveProject, openBrowser, checks, sleep, ROOT } from './harness.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { youtubeVideoId, youtubeCoverUrl, coverCandidates, DEFAULT_COVER } from '../../js/scene/cover.js';

// A obra de vídeo de produção muda com o dado (a sala 1 passou a ter as obras do autor), por isso o
// caso 1 lê o endereço do ficheiro do mundo em vez de fixar um id de vídeo: o que se mede é a cadeia
// («a capa vem do YouTube»), não um vídeo em particular.
const SALA = JSON.parse(readFileSync(join(ROOT, 'data', 'worlds', 'scene1.json'), 'utf8'));
const OBRA_DE_VIDEO = (SALA.artworks || []).find((artwork) => artwork.kind === 'site' && youtubeVideoId(artwork.site));
const ID_DO_VIDEO = OBRA_DE_VIDEO ? youtubeVideoId(OBRA_DE_VIDEO.site) : null;

// Abre uma ficha com pedidos bloqueados e devolve o que a capa resolveu.
async function comBloqueio(site, caminho, bloqueados) {
  const browser = await openBrowser({ width: 900, height: 900 });
  try {
    await browser.page.send('Network.enable');
    if (bloqueados.length) await browser.page.send('Network.setBlockedURLs', { urls: bloqueados });
    await browser.page.send('Page.navigate', { url: site.base + caminho + '&bust=' + Date.now() });
    for (let i = 0; i < 150; i++) {
      const pronta = await browser.evaluate(
        'Boolean(document.querySelector(".meio-imagem") && document.querySelector(".titulo"))'
      ).catch(() => false);
      if (pronta) break;
      await sleep(100);
    }
    // A troca entre candidatas acontece no `error` do <img>: dá-se tempo a que a cadeia ande.
    for (let i = 0; i < 40; i++) {
      const parada = await browser.evaluate(`(() => {
        const img = document.querySelector('.meio-imagem');
        if (!img) return false;
        const de = img.dataset.capaDe;
        return de === 'youtube' ? img.complete : true;
      })()`).catch(() => true);
      if (parada) break;
      await sleep(150);
    }
    await sleep(500);
    return await browser.evaluate(`(() => {
      const img = document.querySelector('.meio-imagem');
      return {
        de: img ? img.dataset.capaDe : null,
        src: img ? img.getAttribute('src') : null,
        carregada: img ? (img.complete && img.naturalWidth > 0) : null,
        tamanho: img ? [img.naturalWidth, img.naturalHeight] : null
      };
    })()`);
  } finally {
    await browser.close();
  }
}

// O que a **sala** faz com as capas que a cadeia resolveu. Não basta a ficha mostrar a capa certa: a
// obra na sala desenha-a por um `#selector` de `<a-assets>`, e um id repetido faz o A-Frame escolher o
// primeiro do documento. Medido em 2026-11-06: 8 obras pretas, com a cadeia a resolver bem ao lado
// (achado §8.5-a do PENDENCIAS).
async function capasDaSala(site, slug) {
  const browser = await openBrowser({ width: 1280, height: 720 });
  try {
    const construida = await browser.goto(site.base + '/' + slug + '/?from=gate', 120000);
    if (!construida) throw new Error(slug + ' não ficou construída em 120 s');
    await sleep(1200);
    return await browser.evaluate(`(() => {
      const imagens = Array.from(document.querySelectorAll('a-assets [id]'));
      const contagem = {};
      for (const el of imagens) contagem[el.id] = (contagem[el.id] || 0) + 1;
      const duplicados = Object.entries(contagem).filter((par) => par[1] > 1).map((par) => par[0]);
      const obras = Array.from(document.querySelectorAll('[data-artwork-id]')).map((el) => {
        const malha = el.getObject3D('mesh');
        const mapa = malha && malha.material && malha.material.map;
        const imagem = mapa && mapa.image;
        return {
          id: el.getAttribute('data-artwork-id'),
          largura: imagem ? imagem.naturalWidth : 0,
          ficheiro: imagem ? String(imagem.currentSrc || imagem.src || '') : ''
        };
      });
      return { duplicados: duplicados, obras: obras };
    })()`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const result = checks();

  // 0. A cadeia, sem browser: o id sai de qualquer forma de copiar o endereço, e a ordem é a pedida.
  result.check('o id do vídeo sai de watch?v=, youtu.be, embed/ e shorts/',
    youtubeVideoId('https://www.youtube.com/watch?v=Gzegts8LXaI') === 'Gzegts8LXaI' &&
      youtubeVideoId('https://youtu.be/Gzegts8LXaI?t=3') === 'Gzegts8LXaI' &&
      youtubeVideoId('https://www.youtube.com/embed/Gzegts8LXaI?rel=0') === 'Gzegts8LXaI' &&
      youtubeVideoId('https://www.youtube.com/shorts/Gzegts8LXaI') === 'Gzegts8LXaI' &&
      youtubeVideoId('https://exemplo.example/obra') === null,
    'watch / youtu.be / embed / shorts / outro site');
  result.check('o thumbnail é derivado do id',
    youtubeCoverUrl('Gzegts8LXaI') === 'https://i.ytimg.com/vi/Gzegts8LXaI/hqdefault.jpg',
    youtubeCoverUrl('Gzegts8LXaI'));

  const comVideo = coverCandidates(
    { site: 'https://www.youtube.com/watch?v=Gzegts8LXaI', asset: 'capa' },
    { capa: { path: 'assets/artworks/eiffel.jpg', type: 'image' } }
  );
  result.check('a cadeia é YouTube e depois a capa do CSV',
    comVideo.length === 2 && comVideo[0].from === 'youtube' && comVideo[1].from === 'capa' &&
      comVideo[0].src === youtubeCoverUrl('Gzegts8LXaI') && comVideo[1].src === 'assets/artworks/eiffel.jpg',
    JSON.stringify(comVideo));
  const semVideo = coverCandidates({ asset: 'foto' }, { foto: { path: 'assets/artworks/eiffel.jpg', type: 'image' } });
  result.check('sem site de YouTube a cadeia começa na capa do CSV',
    semVideo.length === 1 && semVideo[0].from === 'capa', JSON.stringify(semVideo));
  const semNada = coverCandidates({ site: 'https://exemplo.example/x' }, {});
  result.check('sem site de YouTube e sem capa, a cadeia é vazia (e o padrão entra depois)',
    semNada.length === 0 && DEFAULT_COVER === 'assets/covers/sem-capa.svg', JSON.stringify(semNada));

  const site = await serveProject();
  try {
    // 1. Tudo a funcionar: a capa vem do YouTube.
    const youtube = await comBloqueio(site, '/obra.html?mundo=scene1&id=' + OBRA_DE_VIDEO.id, []);
    result.check('com rede, a capa da obra de vídeo vem do YouTube',
      youtube.de === 'youtube' && new RegExp('i\\.ytimg\\.com/vi/' + ID_DO_VIDEO + '/hqdefault\\.jpg$').test(youtube.src || '') &&
        youtube.carregada === true,
      JSON.stringify(youtube));

    // 2. O YouTube bloqueado: a capa do CSV. (O fixture tem um site do YouTube **e** uma capa.)
    const daCapa = await comBloqueio(site, '/obra.html?mundo=exemplo-ficha&id=3', ['*i.ytimg.com*']);
    result.check('com o YouTube bloqueado, a capa vem do CSV',
      daCapa.de === 'capa' && /praia-d0-praia\.jpg$/.test(daCapa.src || '') && daCapa.carregada === true,
      JSON.stringify(daCapa));

    // 3. Os dois bloqueados: a imagem padrão, que pede para avisar o administrador.
    const padrao = await comBloqueio(site, '/obra.html?mundo=exemplo-ficha&id=3', ['*i.ytimg.com*', '*panoramas*']);
    result.check('sem YouTube e sem capa, aparece a imagem padrão de aviso',
      padrao.de === 'padrao' && /assets\/covers\/sem-capa\.svg$/.test(padrao.src || '') && padrao.carregada === true,
      JSON.stringify(padrao));
    result.check('a imagem padrão diz que a capa tem um problema',
      /sem-capa\.svg$/.test(DEFAULT_COVER), DEFAULT_COVER);

    // 4. A sala: a capa resolvida tem de chegar à **malha** da obra, e não só ao `<a-assets>`. O
    // `scene16` é o caso difícil — sete obras de sítio, três com capa no projeto e quatro com a capa no
    // YouTube por cima de uma do catálogo que falha; é onde os ids colidiam.
    const sala = await capasDaSala(site, 'scene16');
    result.check('scene16 · nenhum id de <a-assets> se repete',
      sala.duplicados.length === 0, sala.duplicados.length ? 'repetidos: ' + sala.duplicados.join(', ') : '0 repetido(s)');
    const pretas = sala.obras.filter((obra) => !(obra.largura > 0));
    result.check('scene16 · as 7 obras desenham uma imagem descodificada',
      sala.obras.length === 7 && pretas.length === 0,
      sala.obras.length + ' obra(s), pretas: ' + (pretas.length ? pretas.map((o) => o.id).join(',') : 'nenhuma'));

    // A `scene23`·2 não tem capa nenhuma no dado: é a única obra que **tem** de desenhar a imagem padrão,
    // e é a prova de que a cadeia corre até ao fim quando não há nada a tentar.
    const semCapa = await capasDaSala(site, 'scene23');
    const stoned = semCapa.obras.find((obra) => obra.id === '2');
    result.check('scene23 · a obra sem capa desenha a imagem padrão, e não um painel preto',
      Boolean(stoned) && stoned.largura > 0 && /sem-capa\.svg$/.test(stoned.ficheiro),
      stoned ? stoned.largura + ' px · ' + stoned.ficheiro.replace(/^.*\//, '') : 'obra 2 não encontrada');
  } finally {
    await site.close();
  }

  result.report('a capa da obra, por tentativas (D65)');
  process.exit(result.list.some((item) => !item.ok) ? 1 : 0);
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
