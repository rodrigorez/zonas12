// A ficha de uma obra (D60), medida no browser.
//
// Porque existe: a ficha é uma página **gerada**, e uma página gerada pode estar certa no ficheiro e
// errada no ecrã — um caminho relativo mal contado, uma língua que não esconde a outra, um meio que
// não aparece. Este instrumento abre as fichas do fixture `r9` (uma por tipo) e do `scene1` (a de
// produção) e responde:
//
//   1. cada tipo mostra o meio que promete: imagem, vídeo, modelo (A-Frame), texto, site (iframe);
//   2. o site tem **as três camadas** — o site, a imagem da obra por baixo e o botão para o abrir
//      numa aba nova (é a saída quando o site recusa ser embutido, e nada no browser a pode detetar);
//   3. a língua vem no endereço: `?lang=en` mostra o inglês e esconde o português;
//   4. o «voltar» leva ao mundo a que a obra pertence;
//   5. a página não escreve erros na consola;
//   6. a ficha que a **cena** aponta é a mesma que a ferramenta escreveu (L20, do lado do browser).
//
// Uso, da raiz do projeto:
//
//   node tools/regression/obra.mjs
//
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

const CASOS = [
  { mundo: 'r9', obra: 0, tipo: 'image', espera: '.meio-imagem', completo: true },
  { mundo: 'r9', obra: 1, tipo: 'model', espera: '.meio-modelo', completo: true },
  { mundo: 'r9', obra: 2, tipo: 'text', espera: '.meio-texto', completo: true },
  { mundo: 'r9', obra: 3, tipo: 'site', espera: '.meio-site', completo: true },
  { mundo: 'scene1', obra: 2, tipo: 'video', espera: '.meio-video' },
  { mundo: 'scene1', obra: 0, tipo: 'image', espera: '.meio-imagem' }
];

const abrir = async (browser, url) => {
  await browser.page.send('Page.navigate', { url: url });
  for (let i = 0; i < 200; i++) {
    const pronto = await browser.evaluate('document.readyState === "complete"').catch(() => false);
    if (pronto) break;
    await sleep(100);
  }
  await sleep(400);
};

async function main() {
  const result = checks();
  const site = await serveProject();
  const browser = await openBrowser({ width: 1200, height: 800 });
  const faltam = [];
  try {
    const ruido = browser.console.length;

    for (const caso of CASOS) {
      const url = site.base + '/' + caso.mundo + '/obras/' + caso.obra + '.html?bust=' + Date.now();
      await abrir(browser, url);
      const estado = await browser.evaluate(`(() => {
        const meio = document.querySelector('.meio');
        const voltar = document.querySelector('.voltar');
        const iframe = document.querySelector('.meio-site-iframe');
        const botao = document.querySelector('.botao-site');
        const imagem = document.querySelector('.meio-imagem');
        return {
          meio: meio ? meio.className : null,
          temEspera: Boolean(document.querySelector('${caso.espera}')),
          titulo: (document.querySelector('.titulo') || {}).textContent || '',
          autor: (document.querySelector('.autor') || {}).textContent || '',
          voltar: voltar ? voltar.getAttribute('href') : null,
          iframe: iframe ? iframe.getAttribute('src') : null,
          botao: botao ? botao.getAttribute('href') : null,
          alvoDoBotao: botao ? botao.getAttribute('target') : null,
          imagemAtras: Boolean(imagem),
          temSinopse: Boolean(document.querySelector('.sinopse')),
          ficha: document.documentElement.getAttribute('data-ficha')
        };
      })()`);

      result.check(caso.mundo + ' obra ' + caso.obra + ' (' + caso.tipo + '): a ficha mostra o meio certo',
        estado.temEspera === true, JSON.stringify(estado.meio));
      result.check(caso.mundo + ' obra ' + caso.obra + ': a ficha mostra um nome no cimo',
        (estado.titulo || '').trim().length > 0, (estado.titulo || '').trim().slice(0, 40));
      // O autor e a sinopse são dado do mundo, e os mundos de produção ainda não os têm: a ficha não
      // inventa nenhum (mostra o que há). O fixture prova que, quando existem, aparecem.
      if (caso.completo) {
        result.check(caso.mundo + ' obra ' + caso.obra + ': o autor e a sinopse vêm do dado',
          (estado.autor || '').trim().length > 0 && estado.temSinopse === true,
          'autor=' + (estado.autor || '').trim());
      } else if (!(estado.autor || '').trim()) {
        faltam.push(caso.mundo + ' obra ' + caso.obra);
      }
      result.check(caso.mundo + ' obra ' + caso.obra + ': o «voltar» aponta para a pasta do mundo',
        estado.voltar === '../', String(estado.voltar));
      result.check(caso.mundo + ' obra ' + caso.obra + ': a ficha diz de que dado foi feita (L20)',
        typeof estado.ficha === 'string' && estado.ficha.length === 16, String(estado.ficha));

      if (caso.tipo === 'site') {
        result.check('a ficha de um site tem as três camadas: o site, a imagem e o botão',
          typeof estado.iframe === 'string' && estado.iframe.indexOf('http') === 0 &&
            estado.imagemAtras === true &&
            typeof estado.botao === 'string' && estado.botao.indexOf('http') === 0 &&
            estado.alvoDoBotao === '_blank',
          JSON.stringify({ iframe: estado.iframe, imagem: estado.imagemAtras, botao: estado.botao }));
      }
    }

    // 3. A língua: o mesmo ficheiro, `?lang=en`.
    await abrir(browser, site.base + '/r9/obras/0.html?lang=en&bust=' + Date.now());
    const ingles = await browser.evaluate(`(() => {
      const visivel = (seletor) => Array.from(document.querySelectorAll(seletor))
        .filter((el) => !el.hidden).map((el) => el.textContent.trim());
      return {
        lingua: document.documentElement.lang,
        titulo: visivel('.titulo-texto'),
        autor: visivel('.autor')
      };
    })()`);
    result.check('?lang=en mostra o inglês e esconde o português',
      ingles.lingua === 'en' &&
        ingles.titulo.length === 1 && /Tower at dusk/.test(ingles.titulo[0]) &&
        ingles.autor.length === 1 && /Trial author/.test(ingles.autor[0]),
      JSON.stringify(ingles));

    // 4. O «voltar» navega mesmo para o mundo, e o mundo constrói-se. Numa sala de produção — uma
    // ficha de um fixture não tem pasta para onde voltar (D28: o fixture abre-se com `?scene=`).
    await abrir(browser, site.base + '/scene1/obras/0.html?bust=' + Date.now());
    await browser.evaluate(`document.querySelector('.voltar').click()`).catch(() => {});
    for (let i = 0; i < 200; i++) {
      if (await browser.evaluate('Boolean(window.portalDebug && window.portalDebug.world)').catch(() => false)) break;
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

    if (faltam.length) {
      console.log('  note: fichas sem autor (o dado ainda não tem): ' + faltam.join(', '));
    }

    const erros = browser.console.slice(ruido).filter((line) => /^(error|exception)/.test(line));
    result.check('as fichas não escrevem erros na consola', erros.length === 0,
      erros.join(' | ').slice(0, 240));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('a ficha da obra (D60)');
  process.exit(result.list.some((item) => !item.ok) ? 1 : 0);
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
