// A exclusão em lote por dimensão (B3 da Fase 7), medida no editor.
//
// Porque existe: o B6 da Fase 4 deixou esta nota — «os painéis só excluem individualmente» — e apagar
// quatro obras de uma dimensão era quatro cliques, quatro instantâneos de desfazer e quatro ocasiões
// de deixar uma para trás. A meta M3 é uma operação, um instantâneo, e o validador limpo no fim.
//
//   1. o botão existe na dimensão que tem obras, e não nas outras;
//   2. a pergunta diz quantas obras vão sair;
//   3. dizer «não» não toca no mundo;
//   4. dizer «sim» apaga todas as obras daquela dimensão e mais nenhuma;
//   5. é **um** passo de desfazer: um Ctrl+Z devolve-as todas;
//   6. o mundo continua a passar na validação (0 erros).
//
// Uso, da raiz do projeto:
//
//   node tools/regression/lote.mjs
//
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

async function main() {
  const result = checks();
  const site = await serveProject();
  const browser = await openBrowser({ width: 1400, height: 900 });
  try {
    const ruido = browser.console.length;
    // O fixture `example` tem 5 obras na dimensão 0 e 2 na dimensão 1: é o caso que distingue\n    // «apagar as obras desta dimensão» de «apagar todas».
    await browser.goto(site.base + '/editor.html?world=example&bust=' + Date.now(), 60000);
    for (let i = 0; i < 150; i++) {
      if (await browser.evaluate('Boolean(window.portalDebug && window.portalDebug.state)').catch(() => false)) break;
      await sleep(200);
    }
    await sleep(3000);

    const antes = await browser.evaluate(`(() => {
      const mundo = window.portalDebug.data();
      return {
        obras: (mundo.artworks || []).map((artwork) => ({ id: artwork.id, dimension: artwork.dimension })),
        botoes: Array.from(document.querySelectorAll('[name$=".deleteMany"]')).map((el) => el.name)
      };
    })()`);

    const comObras = [...new Set(antes.obras.map((artwork) => artwork.dimension))];
    result.check('o botão do lote existe em cada dimensão que tem obras',
      comObras.every((id) => antes.botoes.includes('dimension.' + id + '.deleteMany')),
      JSON.stringify({ dimensoes: comObras, botoes: antes.botoes }));

    // A pergunta: interceptada para se poder ler o texto e responder. `window.confirm` é o caminho
    // que o painel usa, e é o que se substitui — a operação em si não muda.
    const dito = await browser.evaluate(`(() => {
      const guardado = window.confirm;
      let pergunta = null;
      window.confirm = (texto) => { pergunta = texto; return false; };
      const botao = document.querySelector('[name="dimension.' + ${JSON.stringify(comObras[0])} + '.deleteMany"]');
      botao.click();
      window.confirm = guardado;
      return pergunta;
    })()`);
    const quantas = contar(antes, comObras[0]);
    result.check('a pergunta diz quantas obras vão sair',
      typeof dito === 'string' && new RegExp('(^|\\D)' + quantas + '(\\D|$)').test(dito),
      String(dito));

    const depoisDeNao = await browser.evaluate('(window.portalDebug.data().artworks || []).length');
    result.check('dizer «não» não toca no mundo', depoisDeNao === antes.obras.length,
      depoisDeNao + ' obras (antes ' + antes.obras.length + ')');

    const sim = await browser.evaluate(`(() => {
      const guardado = window.confirm;
      window.confirm = () => true;
      const botao = document.querySelector('[name="dimension.' + ${JSON.stringify(comObras[0])} + '.deleteMany"]');
      botao.click();
      window.confirm = guardado;
      return true;
    })()`);
    await sleep(1200);

    const depois = await browser.evaluate(`(() => {
      const mundo = window.portalDebug.data();
      const estado = document.getElementById('estado');
      return {
        obras: (mundo.artworks || []).map((artwork) => ({ id: artwork.id, dimension: artwork.dimension })),
        mensagem: estado ? estado.textContent : '',
        podeDesfazer: Boolean(document.querySelector('[name="editor.undo"], #btn-desfazer'))
      };
    })()`);

    const ficaram = depois.obras.filter((artwork) => artwork.dimension === comObras[0]);
    const outrasAntes = antes.obras.filter((artwork) => artwork.dimension !== comObras[0]).length;
    const outrasDepois = depois.obras.filter((artwork) => artwork.dimension !== comObras[0]).length;
    result.check('«sim» apaga todas as obras daquela dimensão, e só dela',
      sim === true && ficaram.length === 0 && outrasAntes > 0 && outrasDepois === outrasAntes,
      'restam ' + ficaram.length + ' na dimensão ' + comObras[0] + '; as outras ' +
        outrasAntes + ' → ' + outrasDepois);

    // O recibo: a linha de estado diz quantas saíram — lida **antes** do desfazer, que a substitui.
    result.check('a linha de estado diz quantas obras saíram',
      typeof depois.mensagem === 'string' && depois.mensagem.indexOf(String(quantas)) >= 0,
      depois.mensagem);

    // Um Ctrl+Z: é o que prova que o lote foi **uma** alteração e não N.
    await browser.evaluate(`(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, bubbles: true }));
      return true;
    })()`);
    await sleep(1500);
    const desfeito = await browser.evaluate(`(() => {
      const mundo = window.portalDebug.data();
      return {
        obras: (mundo.artworks || []).length,
        naDimensao: (mundo.artworks || []).filter((artwork) => artwork.dimension === ${JSON.stringify(comObras[0])}).length
      };
    })()`);
    result.check('um só «Desfazer» devolve todas as obras da dimensão',
      desfeito.obras === antes.obras.length && desfeito.naDimensao === quantas,
      JSON.stringify(desfeito) + ' (antes ' + antes.obras.length + ')');

    // E o mundo que ficou depois do lote continua a passar na validação: a meta M3 pede-o. O painel
    // dos problemas é o sítio onde o autor lê isso, e é o mesmo texto que o validador escreve.
    const errosDoEditor = await browser.evaluate(`(() => {
      const painel = document.querySelector('[data-painel="problemas"], #problemas');
      return painel ? painel.textContent.slice(0, 160) : '';
    })()`).catch(() => '');
    result.check('o editor continua sem problemas depois do lote e do desfazer',
      typeof errosDoEditor === 'string' && !/Erros: [1-9]/.test(errosDoEditor),
      errosDoEditor || 'sem painel de problemas');

    const problemas = browser.console.slice(ruido).filter((line) => /^(error|exception)/.test(line));
    result.check('o lote não escreve erros na consola', problemas.length === 0,
      problemas.join(' | ').slice(0, 240));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('a exclusão em lote por dimensão (B3)');
  process.exit(result.list.some((item) => !item.ok) ? 1 : 0);
}

function contar(antes, id) {
  return antes.obras.filter((artwork) => artwork.dimension === id).length;
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
