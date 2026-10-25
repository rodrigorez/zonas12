// O ensaio dos quatro valores do R9 (B5/B6/B7 da Fase 7), medido no browser e não no validador.
//
// Porque existe: durante três fases a documentação prometeu quatro coisas que o esquema aceitava e a
// cena ignorava — obra `kind: "model"` e `"text"`, dimensão `kind: "color"` e `interaction: "link"`.
// Um validador verde não prova nada sobre elas; o que prova é a cena construída: um fundo liso na
// esfera de fundo, uma malha de modelo, um plano com texto, e um clique que **sai** da página.
//
//   1. o fundo da dimensão 0 é liso e tem a cor do dado (nenhuma textura, nenhum shader);
//   2. a obra `model` tem malha depois de o GLTF carregar, e está registada no núcleo;
//   3. a obra `text` é um plano com textura desenhada e o texto da língua pedida;
//   4. a obra com `interaction: "link"` navega para o endereço em vez de abrir o modal;
//   5. a consola não tem erros nem avisos (T8) — a cena nova não pode trazer ruído.
//
// Uso, da raiz do projeto:
//
//   node tools/regression/r9.mjs
//
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

const PRONTO = `Boolean(window.portalDebug && window.portalDebug.state &&
  document.querySelector('a-scene') && document.querySelector('a-scene').renderer)`;

async function main() {
  const result = checks();
  const site = await serveProject();
  const browser = await openBrowser({ width: 1100, height: 800 });
  try {
    const ruido = browser.console.length;
    await browser.goto(site.base + '/?scene=r9&bust=' + Date.now(), 60000);
    await sleep(4000);

    const cena = await browser.evaluate(`(() => {
      const estado = window.portalDebug.state;
      const plano = estado.panoramas ? estado.panoramas[0] : null;
      const malha = (id) => {
        const el = document.querySelector('[data-artwork-id="' + id + '"]');
        if (!el) return null;
        const object = el.getObject3D('mesh');
        if (!object) return null;
        let vertices = 0;
        let materiais = 0;
        object.traverse((node) => {
          if (!node.isMesh) return;
          materiais += 1;
          vertices += node.geometry && node.geometry.attributes.position
            ? node.geometry.attributes.position.count : 0;
        });
        return { nome: object.name, vertices: vertices, materiais: materiais };
      };
      const etiqueta = (id) => {
        const el = document.querySelector('[data-artwork-id="' + id + '"]');
        const mapa = el && el.getObject3D('mesh') && el.getObject3D('mesh').material
          ? el.getObject3D('mesh').material.map : null;
        return mapa ? { mapa: true, w: mapa.image ? mapa.image.width : 0 } : { mapa: false };
      };
      return {
        fundo: window.portalDebug.shader().backgrounds,
        modelo: malha(1),
        texto: malha(2),
        texturaDoTexto: etiqueta(2),
        imagem: malha(0),
        ligacao: Boolean(document.querySelector('[data-artwork-id="3"]')),
        plano: plano === null ? null : true
      };
    })()`);

    const fundo = (cena.fundo || []).find((entry) => entry.dimension === 0) || {};
    result.check('a dimensão 0 é um fundo liso com a cor do dado',
      fundo.mode === 'color' && fundo.color === '#101a2c',
      JSON.stringify(fundo));

    result.check('a obra `model` tem a malha do GLTF (vértices e material)',
      cena.modelo !== null && cena.modelo.vertices > 0 && cena.modelo.materiais > 0,
      JSON.stringify(cena.modelo));

    result.check('a obra `text` é um plano com a textura desenhada',
      cena.texto !== null && cena.texto.vertices === 4 && cena.texturaDoTexto.mapa === true,
      JSON.stringify({ malha: cena.texto, textura: cena.texturaDoTexto }));

    result.check('a obra `image` continua a ser a caixa de sempre',
      cena.imagem !== null && cena.imagem.vertices > 0, JSON.stringify(cena.imagem));

    await cliqueLigacao(result, browser);

    const ruidoDepois = browser.console.slice(ruido);
    const problemas = ruidoDepois.filter((line) => /^(error|warning|exception)/.test(line));
    result.check('a cena do ensaio não escreve nada na consola', problemas.length === 0,
      problemas.join(' | ').slice(0, 260));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('os quatro valores do R9 (B5/B6/B7)');
  process.exit(result.list.some((item) => !item.ok) ? 1 : 0);
}

// O clique de uma obra `interaction: "link"`: navega para o endereço. A navegação leva o documento
// com ela, por isso o resultado lê-se do lado de lá (a `timeOrigin` tem de mudar).
async function cliqueLigacao(result, browser) {
  const antes = await browser.evaluate('performance.timeOrigin');
  await browser.evaluate(`(() => {
    const el = document.querySelector('[data-artwork-id="3"]');
    const componente = el && el.components['open-artwork'];
    if (!componente) return 'sem componente';
    el.emit('click', {}, false);
    return 'clicado em ' + componente.data.mode;
  })()`).catch(() => 'a página foi-se');
  for (let i = 0; i < 60; i++) {
    await sleep(200);
    const mudou = await browser.evaluate(`performance.timeOrigin !== ${antes}`).catch(() => true);
    if (mudou) break;
  }
  const depois = await browser.evaluate('location.href').catch(() => null);
  result.check('a obra com `interaction: "link"` navega para o endereço',
    typeof depois === 'string' && depois.indexOf('rodrigorez.github.io/zonas12') >= 0,
    String(depois));
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
