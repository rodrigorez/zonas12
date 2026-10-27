// A ficha de uma obra (D60/D62), medida no browser.
//
// Porque existe: a ficha é **uma página que se desenha ao carregar** — `obra.html?mundo=<slug>&id=<n>`
// —, e uma página assim pode estar certa no dado e errada no ecrã: um meio que não aparece, uma
// língua que não muda, um endereço que não volta para a sala. Este instrumento abre a ficha de cada
// tipo (o fixture `r9` tem os cinco, o `scene1` tem o vídeo) e responde:
//
//   1. cada tipo mostra o meio que promete: imagem, vídeo, modelo (A-Frame), texto, site (iframe);
//   2. o site tem **as três camadas** — o site, a imagem da obra por baixo e o botão para o abrir
//      numa aba nova (é a saída quando o site recusa ser embutido, e nada no browser a pode detetar);
//   3. a língua vem no endereço: `?lang=en` mostra o inglês;
//   4. o «voltar» leva à pasta do mundo da obra, no cimo e no fundo;
//   5. um endereço que não nomeia uma obra diz isso, e não desenha a obra zero;
//   6. a página não escreve erros na consola;
//   7. a tabela das plataformas (herdada do zonas11) põe cada endereço no embed certo;
//   8. a medição (D62): sem ID no mundo **não acontece nada**; com um ID, a página vista sai uma vez,
//      com o título da obra e o endereço que a identifica.
//
// Uso, da raiz do projeto:
//
//   node tools/regression/obra.mjs
//
import { serveProject, openBrowser, checks, sleep, ROOT } from './harness.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { platformEmbed } from '../../js/scene/platform-embed.js';
import { measurementIdWellFormed, gtagScriptUrl, pageLocation, startAnalytics } from '../../js/scene/analytics.js';
import { artworkPageHref, artworkPageRequest, artworkBackHref } from '../../js/scene/artwork-page.js';

// O tipo de cada obra vem do **dado** (o `data/obras.tsv` muda-o: uma obra com `site` passa a ser uma
// obra `site`). Escrito à mão aqui, mudar o CSV era uma falha do instrumento em vez de uma mudança do
// dado — a mesma lição da bateria D40.
function kindOf(worldSlug, artworkId) {
  const world = JSON.parse(readFileSync(join(ROOT, 'data', 'worlds', worldSlug + '.json'), 'utf8'));
  const artwork = (world.artworks || []).find((item) => item.id === artworkId);
  return artwork ? artwork.kind : null;
}

// Os cinco meios e duas obras de produção. `pasta` diz se o mundo tem pasta própria (uma sala) ou é
// um fixture (que se abre por `?scene=`).
const CASOS = [
  { mundo: 'r9', obra: 0, completo: true, pasta: false },
  { mundo: 'r9', obra: 1, completo: true, pasta: false },
  { mundo: 'r9', obra: 2, completo: true, pasta: false },
  { mundo: 'r9', obra: 3, completo: true, pasta: false },
  { mundo: 'exemplo-ficha', obra: 0, completo: true, creditos: 3, pasta: false },
  { mundo: 'exemplo-ficha', obra: 2, completo: true, pasta: false },
  { mundo: 'scene1', obra: 2, pasta: true },
  { mundo: 'scene1', obra: 0, pasta: true }
].map((caso) => Object.assign({ tipo: kindOf(caso.mundo, caso.obra) }, caso));

// A tabela das plataformas, medida sem browser: cada endereço tem de cair na plataforma certa e no
// `src` que ela serve. Sem plataforma conhecida, o endereço passa tal e qual — nunca se inventa um
// embed que o site não dá.
const TABELA = [
  { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', plataforma: 'youtube', espera: 'youtube.com/embed/dQw4w9WgXcQ' },
  { url: 'https://youtu.be/dQw4w9WgXcQ', plataforma: 'youtube', espera: 'youtube.com/embed/dQw4w9WgXcQ' },
  { url: 'https://vimeo.com/76979871', plataforma: 'vimeo', espera: 'player.vimeo.com/video/76979871' },
  { url: 'https://editor.p5js.org/fulano/full/AbC123', plataforma: 'p5js', espera: 'editor.p5js.org/fulano/full/AbC123' },
  { url: 'https://openprocessing.org/sketch/1234567', plataforma: 'openprocessing', espera: 'openprocessing.org/sketch/1234567/embed/' },
  { url: 'https://www.shadertoy.com/view/XsXXDn', plataforma: 'shadertoy', espera: 'shadertoy.com/embed/XsXXDn' },
  { url: 'https://exemplo.example/obra/index.html', plataforma: 'site', espera: 'exemplo.example/obra/index.html' }
];

const abrir = async (browser, url) => {
  await browser.page.send('Page.navigate', { url: url });
  for (let i = 0; i < 200; i++) {
    const pronto = await browser.evaluate('document.readyState === "complete"').catch(() => false);
    if (pronto) break;
    await sleep(100);
  }
  // A ficha desenha-se depois de ler o mundo e de desenhar o meio: espera-se pelo nome da obra (ou
  // pela linha de «não existe»), que é o que diz que a página acabou de se desenhar.
  for (let i = 0; i < 120; i++) {
    const pronta = await browser.evaluate(
      'Boolean(window.obraDebug && (document.querySelector(".titulo") || document.querySelector(".sinopse")))'
    ).catch(() => false);
    if (pronta) break;
    await sleep(100);
  }
  await sleep(350);
  // A capa por baixo do site pode ser um endereço remoto (D64: o thumbnail do YouTube, ou uma imagem
  // no Google Drive) e chega depois de a página estar desenhada: espera-se por ela, até 5 s. O que se
  // mede a seguir é se ela **carregou** — uma capa que não carrega continua a falhar, só demora 5 s.
  for (let i = 0; i < 50; i++) {
    const capa = await browser.evaluate(`(() => {
      const imagem = document.querySelector('.meio-imagem');
      if (!imagem) return 'sem-capa';
      return imagem.complete ? (imagem.naturalWidth > 0 ? 'carregada' : 'falhou') : 'a-carregar';
    })()`).catch(() => 'sem-capa');
    if (capa !== 'a-carregar') break;
    await sleep(100);
  }
};

// A medição, sem browser: `startAnalytics` só fala com `window` e `document`, e aqui eles são de
// mentira. É o que permite provar o contrato — um `page_view`, com o título e o endereço — sem rede e
// sem tocar no dado, porque as propriedades da GA ainda não existem.
function measurement(result) {
  const fake = () => {
    const calls = [];
    const scripts = [];
    const win = {};
    win.gtag = function gtag() { calls.push(Array.prototype.slice.call(arguments)); };
    const element = {};
    Object.defineProperty(element, 'src', {
      set(value) { scripts.push(value); },
      get() { return scripts[scripts.length - 1]; }
    });
    const doc = { createElement: () => element, head: { appendChild: () => {} } };
    return { window: win, document: doc, calls, scripts };
  };

  const original = { window: globalThis.window, document: globalThis.document };
  const withId = fake();
  let comId;
  let semId;
  let primeiro = 0;
  globalThis.window = withId.window;
  globalThis.document = withId.document;
  try {
    comId = startAnalytics({ id: 'G-ABC123', title: 'Torre — Cidade', location: 'https://exemplo/obra.html?mundo=scene1&id=3' });
    primeiro = withId.calls.length;
    semId = startAnalytics({ id: '', title: 'x', location: 'y' });
  } finally {
    globalThis.window = original.window;
    globalThis.document = original.document;
  }
  result.check('a medição: com um ID, a página vista sai uma vez, com o título e o endereço da obra',
    comId.started === true && primeiro === 1 &&
      withId.calls[0][0] === 'event' && withId.calls[0][1] === 'page_view' &&
      withId.calls[0][2].page_title === 'Torre — Cidade' &&
      withId.calls[0][2].page_location === 'https://exemplo/obra.html?mundo=scene1&id=3',
    JSON.stringify(withId.calls));
  result.check('a medição: e sem ID não acontece nada (nem chamada, nem script)',
    semId.started === false && withId.calls.length === primeiro && withId.scripts.length === 0,
    JSON.stringify({ started: semId, calls: withId.calls.length, scripts: withId.scripts.length }));

  // Com um ID e sem snippet na página, o script é injetado pelo próprio módulo — uma só forma de medir.
  const injected = fake();
  delete injected.window.gtag;
  globalThis.window = injected.window;
  globalThis.document = injected.document;
  try {
    startAnalytics({ id: 'G-XYZ789', title: 't', location: 'l' });
  } finally {
    globalThis.window = original.window;
    globalThis.document = original.document;
  }
  result.check('a medição: sem snippet na página, o script da GA é injetado com o ID do mundo',
    injected.scripts.length === 1 && injected.scripts[0] === gtagScriptUrl('G-XYZ789'),
    JSON.stringify(injected.scripts));

  result.check('a medição: um ID que não é GA4 é recusado',
    measurementIdWellFormed('G-ABC123') === true &&
      measurementIdWellFormed('UA-12345-1') === false &&
      measurementIdWellFormed('') === false &&
      measurementIdWellFormed(undefined) === false,
    'G-ABC123 / UA-12345-1 / vazio');

  const daObra = pageLocation('https://exemplo/zonas12/obra.html?mundo=scene1&id=3&lang=pt&bust=99', ['mundo', 'id']);
  result.check('a medição: o endereço guardado é o da obra, sem a língua nem o cache-busting',
    daObra === 'https://exemplo/zonas12/obra.html?mundo=scene1&id=3', daObra);
  const daSala = pageLocation('https://exemplo/zonas12/scene1/?from=scene2&lang=en', []);
  result.check('a medição: o endereço de uma sala é a pasta, sem parâmetros',
    daSala === 'https://exemplo/zonas12/scene1/', daSala);
}

async function main() {
  const result = checks();

  // 0. O endereço da ficha: escrito num sítio só, e lido de volta pelo mesmo sítio.
  result.check('o endereço da ficha leva o mundo e a obra',
    artworkPageHref('scene1', 3, 'pt') === 'obra.html?mundo=scene1&id=3&lang=pt',
    artworkPageHref('scene1', 3, 'pt'));
  const pedido = artworkPageRequest('?mundo=scene1&id=3&lang=en');
  result.check('e a ficha lê-o de volta',
    Boolean(pedido) && pedido.world === 'scene1' && pedido.id === 3 && pedido.language === 'en',
    JSON.stringify(pedido));
  result.check('um endereço que não nomeia uma obra não é uma obra',
    artworkPageRequest('?mundo=scene1') === null &&
      artworkPageRequest('?mundo=scene1&id=abc') === null &&
      artworkPageRequest('?mundo=../x&id=1') === null &&
      artworkPageRequest('') === null,
    'sem id · id não numérico · mundo inválido · vazio');
  result.check('o «voltar» é a pasta do mundo',
    artworkBackHref('scene1') === 'scene1/' && artworkBackHref(null) === './',
    artworkBackHref('scene1') + ' / ' + artworkBackHref(null));

  for (const linha of TABELA) {
    const embed = platformEmbed(linha.url);
    result.check('a tabela das plataformas: ' + linha.plataforma,
      embed.platform === linha.plataforma && embed.src.indexOf(linha.espera) >= 0,
      JSON.stringify(embed).slice(0, 140));
  }

  measurement(result);

  const site = await serveProject();
  const browser = await openBrowser({ width: 1200, height: 800 });
  const faltam = [];
  try {
    const ruido = browser.console.length;

    for (const caso of CASOS) {
      const href = artworkPageHref(caso.mundo, caso.obra, 'pt');
      await abrir(browser, site.base + '/' + href + '&bust=' + Date.now());
      const estado = await browser.evaluate(`(() => {
        const meio = document.querySelector('[data-meio]');
        const voltar = document.querySelector('.botao-voltar');
        const iframe = document.querySelector('.meio-site-iframe');
        const botao = document.querySelector('.botao-site');
        const imagem = document.querySelector('.meio-imagem');
        return {
          meio: meio ? meio.getAttribute('data-meio') : null,
          plataforma: meio ? meio.getAttribute('data-platform') : null,
          referencia: iframe ? iframe.getAttribute('referrerpolicy') : null,
          exposicao: (document.querySelector('.exposicao') || {}).textContent || '',
          titulo: (document.querySelector('.titulo') || {}).textContent || '',
          autor: (document.querySelector('.autor') || {}).textContent || '',
          creditos: Array.from(document.querySelectorAll('.autor')).map((linha) => linha.textContent.trim()),
          temSinopse: Boolean(document.querySelector('.sinopse')),
          voltar: voltar ? voltar.getAttribute('href') : null,
          iframe: iframe ? iframe.getAttribute('src') : null,
          iframePermite: iframe ? iframe.getAttribute('allowfullscreen') !== null : null,
          botao: botao ? botao.getAttribute('href') : null,
          alvoDoBotao: botao ? botao.getAttribute('target') : null,
          imagemAtras: Boolean(imagem),
          imagemCarregada: imagem ? (imagem.complete && imagem.naturalWidth > 0) : null,
          imagemRemota: imagem ? String(imagem.getAttribute('src') || '').indexOf('http') === 0 : null,
          botoesVoltar: document.querySelectorAll('.botao-voltar').length,
          medicao: window.obraDebug ? window.obraDebug.analytics : null,
          pedido: window.obraDebug ? window.obraDebug.planned : null,
          desenhado: window.obraDebug ? window.obraDebug.medium : null,
          scripts: document.querySelectorAll('script[src*="googletagmanager"]').length
        };
      })()`);

      const onde = caso.mundo + ' obra ' + caso.obra;
      // O que a obra **pede** é o que a ficha tem de decidir; o que é desenhado pode ser a capa quando
      // o meio não pôde ser (o A-Frame vem do CDN) — e aí a página continua inteira, que é o contrato.
      result.check(onde + ' (' + caso.tipo + '): a ficha decide o meio que a obra pede',
        estado.pedido === caso.tipo, String(estado.pedido));
      result.check(onde + ' (' + caso.tipo + '): e desenha-o (ou a capa, se o meio falhar)',
        estado.meio === caso.tipo || (caso.tipo === 'model' && estado.meio === 'none'),
        JSON.stringify({ dom: estado.meio, desenhado: estado.desenhado }));
      result.check(onde + ': a ficha diz a exposição e o nome da obra',
        (estado.exposicao || '').trim().length > 0 && (estado.titulo || '').trim().length > 0,
        JSON.stringify({ exposicao: estado.exposicao.trim(), titulo: estado.titulo.trim() }));
      // Os créditos e a sinopse são dado do mundo: o fixture prova que, quando existem, aparecem com a
      // etiqueta do seu papel (D67). As obras de produção têm hoje texto provisório, mas têm-no.
      if (caso.completo) {
        result.check(onde + ': os créditos e a sinopse vêm do dado, com a etiqueta do papel',
          /^Autor:/.test((estado.autor || '').trim()) && estado.temSinopse === true,
          'creditos=' + (estado.autor || '').trim());
      } else if (!(estado.autor || '').trim()) {
        faltam.push(onde);
      }
      // Os três créditos (D67): uma linha por papel, com a etiqueta de cada um, e nenhuma inventada.
      if (caso.creditos) {
        const linhas = estado.creditos || [];
        result.check(onde + ': os três créditos dão três linhas — Autor, Coautor, Colaborador',
          linhas.length === caso.creditos && /^Autor: /.test(linhas[0]) && /^Coautor: /.test(linhas[1]) &&
            /^Colaborador: /.test(linhas[2]), JSON.stringify(linhas));
      }
      result.check(onde + ': o «voltar» volta ao mundo, ao sítio de onde se saiu, no cimo e no fundo',
        estado.voltar === (caso.pasta ? caso.mundo + '/?volta=1' : './?scene=' + caso.mundo + '&volta=1') &&
          estado.botoesVoltar === 2,
        JSON.stringify({ href: estado.voltar, botoes: estado.botoesVoltar }));
      result.check(onde + ': sem ID no mundo, a página não carrega medição nenhuma',
        Boolean(estado.medicao) && estado.medicao.started === false && estado.scripts === 0,
        JSON.stringify({ medicao: estado.medicao, scripts: estado.scripts }));

      if (caso.tipo === 'site') {
        result.check('a ficha de um site tem as três camadas: o site, a imagem e o botão',
          typeof estado.iframe === 'string' && estado.iframe.indexOf('http') === 0 &&
            estado.iframePermite === true &&
            estado.imagemAtras === true &&
            typeof estado.botao === 'string' && estado.botao.indexOf('http') === 0 &&
            estado.alvoDoBotao === '_blank',
          JSON.stringify({ iframe: estado.iframe, imagem: estado.imagemAtras, botao: estado.botao }));
        result.check('e o endereço passou pela tabela das plataformas',
          typeof estado.plataforma === 'string' && estado.plataforma.length > 0,
          'plataforma=' + estado.plataforma);
        // A capa por baixo do site tem de **carregar**: pode ser um ficheiro do projeto ou um endereço
        // (D64 — o thumbnail do próprio vídeo, servido pelo YouTube, é o caso que existe hoje).
        result.check('a capa do site carrega (ficheiro do projeto ou endereço remoto)',
          estado.imagemCarregada === true,
          JSON.stringify({ remota: estado.imagemRemota, carregada: estado.imagemCarregada }));
        // O YouTube recusa embutir sem referrer (erro 153) e a página de erro carrega como se tivesse
        // corrido bem — nada no browser a distingue. O que se pode medir é a causa: o atributo.
        result.check('o site embutido leva um referrer (o YouTube recusa embutir sem ele)',
          estado.referencia !== 'no-referrer', String(estado.referencia));
      }
    }

    // 3. A língua: o mesmo endereço, `?lang=en`. O conteúdo é português (o CSV é a única fonte e é em
    // português, D67); o que muda é a **interface** — e as etiquetas dos créditos são interface.
    await abrir(browser, site.base + '/' + artworkPageHref('r9', 0, 'en') + '&bust=' + Date.now());
    const ingles = await browser.evaluate(`(() => ({
      lingua: document.documentElement.lang,
      titulo: (document.querySelector('.titulo') || {}).textContent || '',
      autor: (document.querySelector('.autor') || {}).textContent || ''
    }))()`);
    result.check('?lang=en muda a interface — e a etiqueta do crédito é inglesa com o nome como está',
      ingles.lingua === 'en' && /Tower at dusk/.test(ingles.titulo) && /^Author:/.test(ingles.autor.trim()),
      JSON.stringify(ingles));

    // 3b. O endereço resolve para a raiz a partir de dentro de uma sala (D28): as salas usam
    // `<base href="../">`, e é isso que faz o mesmo href servir em qualquer página da exposição.
    await abrir(browser, site.base + '/scene1/?bust=' + Date.now());
    const resolvido = await browser.evaluate(
      `new URL(${JSON.stringify(artworkPageHref('scene1', 0, 'pt'))}, document.baseURI).pathname`
    );
    result.check('o endereço da ficha resolve para a raiz, a partir de dentro de uma sala',
      /\/obra\.html$/.test(resolvido), resolvido);

    // 4. Um endereço que não nomeia uma obra: diz isso, e manda de volta.

    await abrir(browser, site.base + '/obra.html?mundo=scene1&id=999&bust=' + Date.now());
    const perdida = await browser.evaluate(`({
      meio: Boolean(document.querySelector('[data-meio]')),
      texto: (document.querySelector('.sinopse') || {}).textContent || '',
      voltar: document.querySelectorAll('.botao-voltar').length
    })`);
    result.check('uma obra que não existe diz que não existe, e não desenha nada',
      perdida.meio === false && perdida.texto.length > 0 && perdida.voltar === 1,
      JSON.stringify(perdida));

    // 5. O «voltar» navega mesmo para a sala, e a sala constrói-se.
    await abrir(browser, site.base + '/' + artworkPageHref('scene1', 0, 'pt') + '&bust=' + Date.now());
    await browser.evaluate(`document.querySelector('.botao-voltar').click()`).catch(() => {});
    for (let i = 0; i < 200; i++) {
      const pronta = await browser.evaluate(
        'Boolean(window.portalDebug && window.portalDebug.built && window.portalDebug.world && document.querySelector("a-scene") && document.querySelector("a-scene").renderer)'
      ).catch(() => false);
      if (pronta) break;
      await sleep(150);
    }
    const voltou = await browser.evaluate(`({
      mundo: window.portalDebug ? window.portalDebug.world : null,
      url: location.pathname,
      cena: Boolean(document.querySelector('a-scene') && document.querySelector('a-scene').renderer)
    })`);
    result.check('o «voltar» da ficha cai no mundo a que a obra pertence',
      voltou.mundo === 'scene1' && /\/scene1\/$/.test(voltou.url) && voltou.cena === true,
      JSON.stringify(voltou));

    // 6. O mesmo num fixture, que **não tem pasta**: o «voltar» tem de voltar por `?scene=`, e não
    // dar 404 (foi o furo que o guia de testes apanhou).
    await abrir(browser, site.base + '/' + artworkPageHref('r9', 0, 'pt') + '&bust=' + Date.now());
    await browser.evaluate(`document.querySelector('.botao-voltar').click()`).catch(() => {});
    for (let i = 0; i < 200; i++) {
      const pronta = await browser.evaluate(
        'Boolean(window.portalDebug && window.portalDebug.built && window.portalDebug.world === "r9" && document.querySelector("a-scene") && document.querySelector("a-scene").renderer)'
      ).catch(() => false);
      if (pronta) break;
      await sleep(150);
    }
    const voltouFixture = await browser.evaluate(`({
      mundo: window.portalDebug ? window.portalDebug.world : null,
      busca: location.search,
      cena: Boolean(document.querySelector('a-scene') && document.querySelector('a-scene').renderer)
    })`);
    result.check('o «voltar» de um fixture volta por ?scene=, e não a um 404',
      voltouFixture.mundo === 'r9' && /scene=r9/.test(voltouFixture.busca) && voltouFixture.cena === true,
      JSON.stringify(voltouFixture));

    if (faltam.length) {
      console.log('  note: obras sem autor (o dado ainda não tem): ' + faltam.join(', '));
    }

    const erros = browser.console.slice(ruido).filter((line) => /^(error|exception)/.test(line));
    result.check('a ficha não escreve erros na consola', erros.length === 0,
      erros.join(' | ').slice(0, 240));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('a ficha da obra (D62)');
  process.exit(result.list.some((item) => !item.ok) ? 1 : 0);
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
