// A bateria do nome das portas (D39): o nome vive no dado, é pintado uma vez num sprite, aparece com
// a tecla **D** na exposição e está sempre à vista no editor (que não tem teclas).
//
// O que se mede, nos quatro mundos com portas:
//   · sem a tecla D não há nome nenhum;
//   · com a tecla D há um nome por porta, visível, e o texto é o do dado (id · o que mostra · para onde vai);
//   · outra vez D esconde-os;
//   · no editor estão à vista desde o início e dizem o mesmo;
//   · dez portas com nome construídas e removidas não deixam textura na GPU nem nó na árvore;
//   · a consola fica limpa.
//
// Uso, da raiz do projeto: node tools/regression/labels-doors.mjs
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

const LARGURA = 1200;
const ALTURA = 800;

const PRONTA = `Boolean(window.portalDebug && window.portalDebug.world && document.querySelector('a-scene').renderer)`;

// O que cada porta diz: o texto que o componente recebeu, e se o sprite existe e está visível.
const NOMES = `(() => [...document.querySelectorAll('[data-portal-id]')].map((element) => {
  const component = element.components['stencil-portal'];
  return {
    id: Number(element.getAttribute('data-portal-id')),
    label: component.data.label,
    sprite: Boolean(component.labelSprite),
    visible: component.labelSprite ? component.labelSprite.visible : null
  };
}))()`;

const TECLA_D = `(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', bubbles: true })); return true; })()`;

async function main() {
  const site = await serveProject();
  const browser = await openBrowser({ width: LARGURA, height: ALTURA, camera: true });
  const result = checks();
  const bust = Date.now();

  // Os nomes atalham, para as verificações dizerem o que fazem e não o que o código faz.
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
    // ---- 1. a exposição, sem e com a tecla D ----
    const esperado = {
      gate: ['#0 · retrato-cidade → scene1', '#1 · retrato-praia → scene2'],
      scene1: ['#2 · Cidade 360º ↔ Realidade → Portão', '#3 · retrato-praia → scene2'],
      scene2: ['#4 · retrato-cidade → scene1', '#5 · Praia ↔ Realidade → Portão', '#6 · retrato-ceu → scene3'],
      scene3: ['#7 · retrato-praia → scene2']
    };

    for (const slug of ['gate', 'scene1', 'scene2', 'scene3']) {
      const url = slug === 'gate' ? '/?bust=' : '/?scene=' + slug + '&bust=';
      await open(site.base + url + bust + Math.random());
      const antes = await evaluate(NOMES);
      check(slug + ': sem a tecla D não há nome nenhum',
        antes.every((entry) => entry.sprite === false), JSON.stringify(antes.map((entry) => entry.sprite)));
      await evaluate(TECLA_D);
      await sleep(600);
      const depois = await evaluate(NOMES);
      const textos = depois.map((entry) => entry.label);
      check(slug + ': com a tecla D há um nome por porta, visível',
        depois.every((entry) => entry.sprite && entry.visible === true), JSON.stringify(textos));
      check(slug + ': os nomes são os do dado',
        JSON.stringify(textos) === JSON.stringify(esperado[slug]), JSON.stringify(textos));
      await evaluate(TECLA_D);
      await sleep(400);
      const apagados = await evaluate(NOMES);
      check(slug + ': outra vez D esconde-os',
        apagados.every((entry) => entry.visible === false), JSON.stringify(apagados.map((entry) => entry.visible)));
    }

    // ---- 2. o editor: os nomes sem tecla nenhuma ----
    await open(site.base + '/editor.html?world=scene1&bust=' + bust);
    const editor = await evaluate(NOMES);
    check('editor: os nomes estão à vista desde o início',
      editor.length === 2 && editor.every((entry) => entry.sprite && entry.visible === true), JSON.stringify(editor));
    check('editor: os nomes são os mesmos da exposição',
      JSON.stringify(editor.map((entry) => entry.label)) === JSON.stringify(esperado.scene1),
      JSON.stringify(editor.map((entry) => entry.label)));

    // ---- 3. uma porta com nome não deixa textura nem nó atrás ----
    const ciclo = await evaluate(`(async () => {
      const portal = await import('/js/modules/portal.js');
      const builder = await import('/js/scene/scene-builder.js');
      const schema = await import('/js/scene/schema.js');
      const scene = document.querySelector('a-scene');
      const renderer = scene.renderer;
      const world = await (await fetch('data/worlds/example.json')).json();
      const model = world.portals[0];
      const holder = document.createElement('a-entity');
      holder.setAttribute('id', 'suporte-do-teste');
      scene.appendChild(holder);
      const before = { textures: renderer.info.memory.textures, nodes: scene.object3D.children.length };
      for (let i = 0; i < 10; i++) {
        portal.createPortal(builder.withDefaults(model, schema.SCENE.portals), holder, {
          label: '#99 · teste', labelAlways: true
        });
      }
      await new Promise((done) => setTimeout(done, 600));
      return {
        before: before,
        made: holder.querySelectorAll('[data-portal-id]').length,
        textures: renderer.info.memory.textures
      };
    })()`);
    await sleep(800);
    const vivos = await evaluate(`(() => ({
      nodes: document.querySelector('a-scene').object3D.children.length,
      sprites: document.querySelectorAll('#suporte-do-teste [data-portal-id]').length,
      textures: document.querySelector('a-scene').renderer.info.memory.textures
    }))()`);
    check('dez portas com nome foram construídas e desenhadas',
      ciclo.made === 10 && vivos.sprites === 10 && vivos.textures > ciclo.before.textures,
      JSON.stringify({ made: ciclo.made, sprites: vivos.sprites,
        texturas: ciclo.before.textures + ' -> ' + vivos.textures }));

    const depois = await evaluate(`(async () => {
      const portal = await import('/js/modules/portal.js');
      const scene = document.querySelector('a-scene');
      const renderer = scene.renderer;
      const holder = document.getElementById('suporte-do-teste');
      [...holder.querySelectorAll('[data-portal-id]')].forEach((element) => portal.removePortal(element));
      await new Promise((done) => setTimeout(done, 400));
      return {
        left: holder.querySelectorAll('[data-portal-id]').length,
        textures: renderer.info.memory.textures,
        nodes: scene.object3D.children.length
      };
    })()`);
    check('as dez portas saíram da árvore', depois.left === 0, String(depois.left));
    check('e não deixaram textura na GPU', depois.textures <= ciclo.before.textures,
      'antes ' + ciclo.before.textures + ', no auge ' + vivos.textures + ', depois ' + depois.textures);
    check('nem nó na árvore', depois.nodes === ciclo.before.nodes,
      'antes ' + ciclo.before.nodes + ', depois ' + depois.nodes);
    await evaluate(`(() => {
      const holder = document.getElementById('suporte-do-teste');
      if (holder) holder.remove();
      return true;
    })()`);

    // ---- 4. a consola, com tudo isto ----
    // O que o próprio browser diz não é da cena (o aviso do raycaster do A-Frame é do A-Frame).
    const ruido = browser.console.filter((line) => !/Download the React|DevTools|raycaster/.test(line));
    check('a consola: 0 erros e 0 avisos', ruido.length === 0, ruido.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('D39 (o nome das portas)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
