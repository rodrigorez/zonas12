// O catálogo de assets editável (B4 da Fase 7), medido no editor.
//
// Porque existe: era a última limitação registada do §7 — «o editor não cria assets: escolhe entre os
// que o mundo já tem». A meta M4 pede três coisas, e este instrumento mede-as: criar, alterar e
// remover um asset; os selectores dos outros painéis a acompanhar; **0** erros de consola; e a **L9** a
// avisar quando o ficheiro não existe (e a calar-se quando passa a existir).
//
//   1. o painel lista o catálogo do mundo, com o caminho e o tipo;
//   2. criar um asset que não existe no disco faz a L9 aparecer;
//   3. corrigir o caminho para um ficheiro que existe faz a L9 desaparecer;
//   4. o asset criado aparece nos selectores do painel das obras;
//   5. apagar um asset em uso é recusado, e um sem uso é apagado;
//   6. um identificador inválido é recusado, com a razão;
//   7. a consola fica limpa.
//
// Uso, da raiz do projeto:
//
//   node tools/regression/assets.mjs
//
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

async function main() {
  const result = checks();
  const site = await serveProject();
  const browser = await openBrowser({ width: 1400, height: 900 });
  try {
    const ruido = browser.console.length;
    await browser.goto(site.base + '/editor.html?world=scene1&bust=' + Date.now(), 60000);
    for (let i = 0; i < 150; i++) {
      if (await browser.evaluate('Boolean(window.portalDebug && window.portalDebug.data())').catch(() => false)) break;
      await sleep(200);
    }
    await sleep(3000);

    const catalogo = await browser.evaluate(`(() => ({
      ids: Object.keys(window.portalDebug.data().assets || {}),
      painel: Boolean(document.querySelector('[name^="asset."]')),
      texto: (document.querySelector('[name="asset.cidade-360.path"]') || {}).value || null
    }))()`);
    result.check('o painel lista o catálogo do mundo',
      catalogo.painel === true && catalogo.ids.length > 0,
      JSON.stringify({ ids: catalogo.ids.slice(0, 4), painel: catalogo.painel }));
    result.check('e mostra o caminho de um asset que já existe',
      typeof catalogo.texto === 'string' && catalogo.texto.indexOf('assets/') === 0,
      String(catalogo.texto));

    // 2. criar um asset cujo ficheiro não existe: a L9 tem de aparecer.
    const criado = await browser.evaluate(`(async () => {
      const escrever = (nome, valor) => {
        const campo = document.querySelector('[name="' + nome + '"]');
        campo.value = valor;
        campo.dispatchEvent(new Event('input', { bubbles: true }));
        campo.dispatchEvent(new Event('change', { bubbles: true }));
      };
      escrever('asset.new.id', 'ensaio-do-b4');
      escrever('asset.new.path', 'assets/artworks/nao-existe-ensaio.jpg');
      escrever('asset.new.alt.pt', 'Ensaio do B4');
      const criar = document.querySelector('[name="asset.new.create"]');
      criar.click();
      await new Promise((done) => setTimeout(done, 2500));
      return Object.prototype.hasOwnProperty.call(window.portalDebug.data().assets, 'ensaio-do-b4');
    })()`);
    result.check('criar um asset acrescenta-o ao catálogo', criado === true, String(criado));

    const comFalta = await problemas(browser);
    result.check('a L9 avisa que o ficheiro do asset novo não existe',
      /law L9/.test(comFalta), comFalta.slice(0, 200));

    // 3. O mesmo id, com o caminho de um ficheiro que existe: a L9 cala-se.
    await browser.evaluate(`(async () => {
      const campo = document.querySelector('[name="asset.ensaio-do-b4.path"]');
      campo.value = 'assets/artworks/eiffel.jpg';
      campo.dispatchEvent(new Event('input', { bubbles: true }));
      await new Promise((done) => setTimeout(done, 3000));
      return true;
    })()`);
    const semFalta = await problemas(browser);
    result.check('corrigir o caminho para um ficheiro que existe faz a L9 desaparecer',
      !/law L9/.test(semFalta), semFalta.slice(0, 200));

    // 4. Os selectores dos outros painéis leem o catálogo vivo.
    const noSeletor = await browser.evaluate(`(() => {
      const campos = Array.from(document.querySelectorAll('[name^="artwork."][name$=".asset"]'));
      return campos.some((campo) => Array.from(campo.options).some((option) => option.value === 'ensaio-do-b4'));
    })()`);
    result.check('o asset novo aparece nos selectores das obras', noSeletor === true, String(noSeletor));

    // 5. Apagar: recusado em uso, permitido sem uso.
    const recusado = await browser.evaluate(`(() => {
      const botao = document.querySelector('[name="asset.cidade-360.delete"]');
      return botao ? { existe: true, desactivado: botao.disabled } : { existe: false };
    })()`);
    result.check('um asset em uso não tem botão de excluir',
      recusado.existe === true && recusado.desactivado === true, JSON.stringify(recusado));

    const apagado = await browser.evaluate(`(async () => {
      const botao = document.querySelector('[name="asset.ensaio-do-b4.delete"]');
      if (!botao) return 'sem botao';
      botao.click();
      await new Promise((done) => setTimeout(done, 2500));
      return Object.prototype.hasOwnProperty.call(window.portalDebug.data().assets, 'ensaio-do-b4');
    })()`);
    result.check('um asset sem uso é apagado do catálogo', apagado === false, String(apagado));

    // 6. Um identificador fora do formato é recusado, e a razão aparece no painel.
    const invalido = await browser.evaluate(`(async () => {
      const escrever = (nome, valor) => {
        const campo = document.querySelector('[name="' + nome + '"]');
        if (campo) { campo.value = valor; campo.dispatchEvent(new Event('input', { bubbles: true })); }
      };
      const criar = document.querySelector('[name="asset.new.create"]');
      if (!criar) return { erro: 'sem formulário de inserção' };
      escrever('asset.new.id', 'Ensaio Com Maiusculas');
      escrever('asset.new.path', 'assets/artworks/eiffel.jpg');
      criar.click();
      await new Promise((done) => setTimeout(done, 800));
      const painel = criar.closest('section') || document;
      const avisos = Array.from(painel.querySelectorAll('p'));
      return {
        criado: Object.prototype.hasOwnProperty.call(window.portalDebug.data().assets, 'Ensaio Com Maiusculas'),
        aviso: avisos.map((el) => el.textContent).filter(Boolean).join(' | ')
      };
    })()`);
    result.check('um identificador fora do formato é recusado com a razão',
      invalido && invalido.criado === false && /hífenes|minúsculas/.test(invalido.aviso || ''),
      JSON.stringify(invalido));

    const problemasConsola = browser.console.slice(ruido).filter((line) => /^(error|exception)/.test(line));
    result.check('o painel dos assets não escreve erros na consola', problemasConsola.length === 0,
      problemasConsola.join(' | ').slice(0, 240));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('o catálogo de assets editável (B4)');
  process.exit(result.list.some((item) => !item.ok) ? 1 : 0);
}

// O texto do painel dos problemas, que é onde a L9 e a L14 aparecem.
async function problemas(browser) {
  const texto = await browser.evaluate(`(() => {
    const painel = document.getElementById('problemas');
    return painel ? painel.textContent : '';
  })()`).catch(() => '');
  return texto || '';
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
