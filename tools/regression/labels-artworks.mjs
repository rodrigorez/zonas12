// A bateria do nome das obras (D40): o mesmo desenho das portas, com a mesma tecla — `#0 · Cidade ao
// entardecer · Cidade 360º · page` (o título do dado; sem título, o id do asset).
//
// O que se mede, nas três salas com obras:
//   · sem a tecla D não há nome nenhum;
//   · com a tecla D há um nome por obra, visível e na árvore, e o texto é o do dado (id · título ou
//     asset · dimensão pelo nome · interacção);
//   · o nome fica **acima** do centro da obra, e não em cima dela;
//   · outra vez D esconde os nomes **e** as caixas de debug das portas (uma tecla, as duas coisas);
//   · no portão, que não tem obras, a tecla não faz nada de mal;
//   · no editor os nomes estão à vista desde o arranque e dizem o mesmo;
//   · dez obras com nome construídas e removidas não deixam textura nem nó;
//   · a consola fica limpa.
//
// Uso, da raiz do projeto: node tools/regression/labels-artworks.mjs
import { serveProject, openBrowser, checks, sleep, ROOT } from './harness.mjs';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const LARGURA = 1200;
const ALTURA = 800;

const PRONTA = `Boolean(window.portalDebug && window.portalDebug.world && document.querySelector('a-scene').renderer)`;

const NOMES = `(() => [...document.querySelectorAll('[data-artwork-id]')].map((element) => {
  const component = element.components['dimensional-material'];
  return {
    id: Number(element.getAttribute('data-artwork-id')),
    label: component.data.label,
    sprite: Boolean(component.labelSprite),
    visible: component.labelSprite ? component.labelSprite.visible : null,
    y: component.labelSprite ? Number(component.labelSprite.position.y.toFixed(2)) : null,
    inTree: component.labelSprite ? Boolean(component.labelSprite.parent) : null
  };
}))()`;

const TECLA_D = `(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true })); return true; })()`;

// As caixas de debug das portas: a mesma tecla mostra-as e esconde-as.
const CAIXAS = `[...document.querySelectorAll('[data-portal-id]')]
  .filter((element) => Boolean(element.components['stencil-portal'].debugBox)).length`;

async function main() {
  const site = await serveProject();
  const browser = await openBrowser({ width: LARGURA, height: ALTURA, camera: true });
  const result = checks();
  const bust = Date.now();

  const evaluate = browser.evaluate;
  const check = result.check;

  const open = async (url) => {
    const before = await evaluate('performance.timeOrigin').catch(() => null);
    await browser.page.send('Page.navigate', { url });
    for (let i = 0; i < 300; i++) {
      try {
        if (await evaluate(`performance.timeOrigin !== ${before} && ${PRONTA}`)) break;
      } catch (error) { /* ainda a navegar */ }
      await sleep(200);
    }
    await sleep(2200);
  };

  try {
    // Os nomes esperados vêm do **dado**, não escritos aqui: o rótulo é `#id · título (ou o asset, sem
    // título) · nome da sala · interacção` (D40). Escritos à mão, mudar um título no `data/obras.tsv`
    // passava a ser uma falha da bateria em vez de uma mudança do dado.
    const esperado = {};
    for (const slug of ['scene1', 'scene2', 'scene3']) {
      const world = JSON.parse(readFileSync(join(ROOT, 'data', 'worlds', slug + '.json'), 'utf8'));
      const sala = (world.world.name && world.world.name.pt) || slug;
      esperado[slug] = (world.artworks || [])
        .slice()
        .sort((one, other) => one.id - other.id)
        .map((artwork) => '#' + artwork.id + ' · ' +
          ((artwork.title && artwork.title.pt) || artwork.asset || '-') + ' · ' +
          sala + ' · ' + artwork.interaction);
    }

    for (const [slug, from] of [['scene1', 'gate'], ['scene2', 'scene1'], ['scene3', 'scene2']]) {
      await open(site.base + '/?scene=' + slug + '&from=' + from + '&bust=' + bust + Math.random());
      const antes = await evaluate(NOMES);
      check(slug + ': sem a tecla D não há nome nenhum',
        antes.length > 0 && antes.every((entry) => entry.sprite === false),
        JSON.stringify(antes.map((entry) => entry.sprite)));
      await evaluate(TECLA_D);
      await sleep(600);
      const depois = await evaluate(NOMES);
      check(slug + ': com a tecla D há um nome por obra, visível e na árvore',
        depois.every((entry) => entry.sprite && entry.visible === true && entry.inTree === true),
        JSON.stringify(depois.map((entry) => entry.label)));
      check(slug + ': os nomes são os do dado',
        JSON.stringify(depois.map((entry) => entry.label)) === JSON.stringify(esperado[slug]),
        JSON.stringify(depois.map((entry) => entry.label)));
      check(slug + ': o nome fica acima do centro da obra',
        depois.every((entry) => entry.y > 1.5), JSON.stringify(depois.map((entry) => entry.y)));
      await evaluate(TECLA_D);
      await sleep(500);
      const apagados = await evaluate(NOMES);
      const caixasDepois = await evaluate(CAIXAS);
      check(slug + ': outra vez D esconde os nomes e as portas também',
        apagados.every((entry) => entry.visible === false) && caixasDepois === 0,
        JSON.stringify({ nomes: apagados.map((entry) => entry.visible), caixas: caixasDepois }));
    }

    // O portão não tem obras: a tecla não pode rebentar (e mostra as caixas das duas portas).
    await open(site.base + '/?bust=' + bust);
    await evaluate(TECLA_D);
    await sleep(400);
    const caixasNoPortao = await evaluate(CAIXAS);
    check('no portão, que não tem obras, a tecla D não faz nada de mal',
      (await evaluate(NOMES)).length === 0 && caixasNoPortao === 2,
      JSON.stringify({ caixas: caixasNoPortao }));

    // O editor: os nomes sem tecla nenhuma.
    await open(site.base + '/editor.html?world=scene2&bust=' + bust);
    const editor = await evaluate(NOMES);
    check('editor: as obras têm nome desde o arranque',
      editor.length === 3 && editor.every((entry) => entry.sprite && entry.visible === true),
      JSON.stringify(editor.map((entry) => entry.label)));
    check('editor: os nomes são os mesmos da exposição',
      JSON.stringify(editor.map((entry) => entry.label)) === JSON.stringify(esperado.scene2),
      JSON.stringify(editor.map((entry) => entry.label)));

    // Criar e destruir obras com nome não deixa textura nem nó atrás.
    const ciclo = await evaluate(`(async () => {
      const artwork = await import('/js/modules/artwork.js');
      const builder = await import('/js/scene/scene-builder.js');
      const schema = await import('/js/scene/schema.js');
      const scene = document.querySelector('a-scene');
      const renderer = scene.renderer;
      const world = await (await fetch('data/worlds/scene2.json')).json();
      const model = world.artworks[0];
      const before = { textures: renderer.info.memory.textures, nodes: scene.object3D.children.length };
      const made = [];
      for (let i = 0; i < 10; i++) {
        const data = builder.withDefaults(model, schema.SCENE.artworks);
        data.id = 99;
        made.push(artwork.createArtwork(data, scene, { label: '#99 · teste · Praia · page', labelAlways: true }));
      }
      await new Promise((done) => setTimeout(done, 700));
      return {
        before: before,
        made: made.length,
        textures: renderer.info.memory.textures,
        sprites: document.querySelectorAll('[data-artwork-id="99"]').length
      };
    })()`);
    await sleep(700);
    check('dez obras com nome foram construídas e desenhadas',
      ciclo.made === 10 && ciclo.sprites === 10 && ciclo.textures > ciclo.before.textures,
      JSON.stringify({ made: ciclo.made, texturas: ciclo.before.textures + ' -> ' + ciclo.textures }));

    const depois = await evaluate(`(async () => {
      const artwork = await import('/js/modules/artwork.js');
      const scene = document.querySelector('a-scene');
      const renderer = scene.renderer;
      [...document.querySelectorAll('[data-artwork-id="99"]')].forEach((element) => artwork.removeArtwork(element));
      await new Promise((done) => setTimeout(done, 500));
      return {
        left: document.querySelectorAll('[data-artwork-id="99"]').length,
        textures: renderer.info.memory.textures,
        nodes: scene.object3D.children.length
      };
    })()`);
    check('e ao removê-las não fica textura nem nó',
      depois.left === 0 && depois.textures <= ciclo.before.textures && depois.nodes === ciclo.before.nodes,
      JSON.stringify({ texturas: depois.textures, nos: ciclo.before.nodes + ' -> ' + depois.nodes }));

    // A consola, com tudo isto (o aviso do raycaster é do A-Frame, não da cena).
    const ruido = browser.console.filter((line) => !/Download the React|DevTools|raycaster/.test(line));
    check('a consola: 0 erros e 0 avisos', ruido.length === 0, ruido.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('D40 (o nome das obras)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
