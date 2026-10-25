// O editor com os quatro valores do R9 (B5/B6/B7 da Fase 7), medido nos painéis.
//
// Porque existe: construir a cena não é o mesmo que o autor conseguir editá-la. O painel da obra
// passou a oferecer os quatro tipos e o endereço de uma ligação, o da dimensão passou a oferecer a cor,
// e um campo que aparece sem o dado certo (ou um rótulo sem chave) só se vê a abrir a ferramenta.
//
//   1. o painel da obra oferece os quatro tipos e as três interacções;
//   2. a obra de texto mostra os campos do texto e esconde o do asset;
//   3. a obra com `link` mostra o endereço;
//   4. o painel da dimensão tem o campo da cor, visível na dimensão `color` e escondido nas outras;
//   5. nenhum rótulo é uma chave crua (o `editor.artwork.asset` era, e ninguém dava por isso).
//
// Uso, da raiz do projeto:
//
//   node tools/regression/editor-r9.mjs
//
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

const PRONTO = `Boolean(window.portalDebug && document.querySelector('#painel-obras, [data-panel="artworks"]'))`;

async function main() {
  const result = checks();
  const site = await serveProject();
  const browser = await openBrowser({ width: 1400, height: 900 });
  try {
    const ruido = browser.console.length;
    await browser.goto(site.base + '/editor.html?world=r9&bust=' + Date.now(), 60000);
    for (let i = 0; i < 150; i++) {
      if (await browser.evaluate(`Boolean(window.portalDebug && window.portalDebug.state)`).catch(() => false)) break;
      await sleep(200);
    }
    await sleep(2500);

    const paineis = await browser.evaluate(`(() => {
      const valores = (nome) => {
        const campo = document.querySelector('[name="' + nome + '"]');
        return campo ? Array.from(campo.options).map((option) => option.value) : null;
      };
      const escondido = (nome) => {
        const campo = document.querySelector('[name="' + nome + '"]');
        if (!campo) return null;
        const caixa = campo.closest('label') || campo.parentElement;
        return Boolean(caixa && (caixa.hidden || caixa.style.display === 'none'));
      };
      const rotulos = Array.from(document.querySelectorAll('label span, label')).map((el) => el.textContent.trim());
      const crus = rotulos.filter((texto) => /^(editor|artwork|portal|app|controls)\\.[a-z]/.test(texto));
      return {
        tipos: valores('artwork.2.kind'),
        interaccoes: valores('artwork.3.interaction'),
        textoVisivel: !escondido('artwork.2.text.pt'),
        assetDoTextoEscondido: escondido('artwork.2.asset'),
        assetDaImagemVisivel: !escondido('artwork.0.asset'),
        urlVisivel: !escondido('artwork.3.url'),
        urlDaImagemEscondido: escondido('artwork.0.url'),
        corDaDimensaoVisivel: !escondido('dimension.0.color'),
        tiposDaDimensao: valores('dimension.0.kind'),
        rotulosCrus: crus
      };
    })()`).catch((error) => ({ erro: error.message }));

    result.check('o painel da obra oferece os quatro tipos',
      Array.isArray(paineis.tipos) && paineis.tipos.join(',') === 'image,video,model,text',
      JSON.stringify(paineis.tipos));
    result.check('e as três interacções, com a ligação incluída',
      Array.isArray(paineis.interaccoes) && paineis.interaccoes.join(',') === 'modal,link,none',
      JSON.stringify(paineis.interaccoes));
    result.check('a obra de texto mostra o texto e esconde o asset',
      paineis.textoVisivel === true && paineis.assetDoTextoEscondido === true,
      JSON.stringify({ texto: paineis.textoVisivel, asset: paineis.assetDoTextoEscondido }));
    result.check('a obra de imagem continua a mostrar o asset e a esconder o texto',
      paineis.assetDaImagemVisivel === true, String(paineis.assetDaImagemVisivel));
    result.check('a obra com ligação mostra o endereço, e a de imagem não',
      paineis.urlVisivel === true && paineis.urlDaImagemEscondido === true,
      JSON.stringify({ ligacao: paineis.urlVisivel, imagem: paineis.urlDaImagemEscondido }));
    result.check('a dimensão color mostra a cor e o painel oferece o tipo',
      paineis.corDaDimensaoVisivel === true &&
        Array.isArray(paineis.tiposDaDimensao) && paineis.tiposDaDimensao.includes('color'),
      JSON.stringify({ cor: paineis.corDaDimensaoVisivel, tipos: paineis.tiposDaDimensao }));
    result.check('nenhum rótulo do editor é uma chave crua',
      Array.isArray(paineis.rotulosCrus) && paineis.rotulosCrus.length === 0,
      JSON.stringify(paineis.rotulosCrus));

    const problemas = browser.console.slice(ruido).filter((line) => /^(error|exception|warning)/.test(line));
    result.check('o editor do fixture não escreve na consola', problemas.length === 0,
      problemas.join(' | ').slice(0, 240));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('o editor com os quatro valores do R9 (B5/B6/B7)');
  process.exit(result.list.some((item) => !item.ok) ? 1 : 0);
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
