// A ficha quando lhe falta o que ela precisa (D62), medido no browser com pedidos bloqueados.
//
// Porque existe: a ficha é **desenhada ao carregar**, a partir de dois ficheiros que vêm da rede — o
// catálogo de textos (`i18n/pt.json`) e o mundo (`data/worlds/<slug>.json`). Uma página assim pode
// ficar **em branco** quando um deles não chega, e um ecrã em branco é o pior resultado possível: o
// visitante não sabe se espera, se volta, ou se a exposição está partida. Este instrumento bloqueia um
// pedido de cada vez e responde:
//
//   1. sem o catálogo de textos, fica o **aviso escrito no `obra.html`** (nunca um ecrã vazio);
//   2. sem o mundo, a ficha diz **«Esta obra não faz parte desta exposição»** e dá o «voltar»;
//   3. com tudo no sítio, o aviso sai do caminho e a obra desenha-se.
//
// Cada caso abre um browser novo: o bloqueio de pedidos do Chrome não se limpa de forma fiável na mesma
// sessão, e um instrumento que depende disso mede o que não quer.
//
// Uso, da raiz do projeto:
//
//   node tools/regression/ficha-falhas.mjs
//
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

// Abre a ficha com os pedidos que casam com `bloqueados` cortados, e devolve o que o visitante vê.
async function comBloqueio(site, caminho, bloqueados) {
  const browser = await openBrowser({ width: 900, height: 900 });
  try {
    await browser.page.send('Network.enable');
    if (bloqueados.length) await browser.page.send('Network.setBlockedURLs', { urls: bloqueados });
    await browser.page.send('Page.navigate', { url: site.base + caminho + '&bust=' + Date.now() });
    for (let i = 0; i < 150; i++) {
      const pronto = await browser.evaluate(
        'document.readyState === "complete" && Boolean(document.body && document.body.innerText.trim())'
      ).catch(() => false);
      if (pronto) break;
      await sleep(100);
    }
    await sleep(1200);
    return await browser.evaluate(`({
      texto: document.body ? document.body.innerText.trim() : '',
      titulo: (document.querySelector('.titulo') || {}).textContent || '',
      aviso: document.body ? document.body.innerText.indexOf('não a conseguiu carregar') >= 0 : false,
      voltar: document.querySelectorAll('.botao-voltar').length
    })`);
  } finally {
    await browser.close();
  }
}

async function main() {
  const result = checks();
  const site = await serveProject();
  try {
    const semTextos = await comBloqueio(site, '/obra.html?mundo=exemplo-ficha&id=0', ['*/i18n/*']);
    result.check('sem o catálogo de textos, fica o aviso escrito na página (nunca um ecrã em branco)',
      semTextos.aviso === true && /exposi/i.test(semTextos.texto) && semTextos.voltar === 0,
      JSON.stringify(semTextos));

    const semMundo = await comBloqueio(site, '/obra.html?mundo=exemplo-ficha&id=0', ['*/data/worlds/*']);
    result.check('sem o mundo, a ficha diz que a obra não faz parte e dá o «voltar»',
      /não faz parte desta exposição/.test(semMundo.texto) && semMundo.voltar === 1 && semMundo.aviso === false,
      JSON.stringify(semMundo));

    const normal = await comBloqueio(site, '/obra.html?mundo=exemplo-ficha&id=0', []);
    result.check('com tudo no sítio, o aviso sai e a ficha desenha-se',
      /Exemplo · cidade/.test(normal.titulo) && normal.aviso === false && normal.voltar === 2,
      JSON.stringify({ titulo: normal.titulo, aviso: normal.aviso, voltar: normal.voltar }));
  } finally {
    await site.close();
  }

  result.report('a ficha quando falta o que ela precisa (D62)');
  process.exit(result.list.some((item) => !item.ok) ? 1 : 0);
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
