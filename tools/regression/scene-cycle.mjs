// R8 e M8: construir e remover um mundo em ciclo, e confirmar que o documento e os registos do núcleo
// voltam ao que eram.
//
// Porque existe: o `buildScene()` devolve um `remove()` desde a Fase 3 e **nada o chamava** — o
// `js/app.js` construía uma vez e deitava fora o resultado. Código de limpeza que ninguém exercita
// apodrece sem se notar (foi assim com o A4 até a Fase 2). O editor é o primeiro sítio que troca de
// cena, e é ele que vai correr isto a cada troca (Fase 4).
//
// Uso, com uma página aberta por HTTP:
//
//   (await import('/tools/regression/scene-cycle.mjs')).runSceneCycle()
//   (await import('/tools/regression/scene-cycle.mjs')).runSceneCycle({ cycles: 5, world: 'example' })
//
// O que conta como «voltar ao que era»: os portais registados, as dimensões (e as entradas de
// conteúdo dentro delas), os valores de stencil, os nós dentro do `<a-scene>`, os ouvintes do
// documento e a dimensão ativa. Se um ciclo deixar algum destes a crescer, o `remove()` está a falhar
// em algum sítio — e é isso que o instrumento responde, ciclo a ciclo, em vez de dizer só «passou».
import { buildScene } from '/js/scene/scene-builder.js';
import { liveListeners } from './acceptance.mjs';

const doisQuadros = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

function retrato(cena, estado) {
  return {
    portais: estado.portals.length,
    dimensoes: Object.keys(estado.dimensions).length,
    entradas: Object.values(estado.dimensions).reduce((total, lista) => total + lista.length, 0),
    valores: estado.stencilValues.size,
    ativa: estado.activeDimension,
    nosNaCena: cena.querySelectorAll('*').length,
    ouvintesNoDocumento: liveListeners(document),
    tecladoNoDocumento: liveListeners(document, 'keydown')
  };
}

function diferencas(antes, depois) {
  return Object.keys(antes)
    .filter((campo) => antes[campo] !== depois[campo])
    .map((campo) => ({ campo: campo, antes: antes[campo], depois: depois[campo] }));
}

async function dadoDoMundo(mundo) {
  const resposta = await fetch('data/worlds/' + mundo + '.json');
  if (!resposta.ok) throw new Error('data/worlds/' + mundo + '.json: HTTP ' + resposta.status);
  return resposta.json();
}

export async function runSceneCycle(options = {}) {
  const ciclos = Number.isInteger(options.cycles) ? options.cycles : 20;
  const cena = options.parent || document.querySelector('a-scene');
  if (!cena) throw new Error('scene-cycle: there is no <a-scene> in this page');
  if (!window.portalDebug) throw new Error('scene-cycle: window.portalDebug is not there — is this the exhibition?');

  const mundo = options.world || window.portalDebug.world;
  const dado = options.data || await dadoDoMundo(mundo);
  const estado = window.portalDebug.state;

  // Duas voltas ao ciclo de desenho antes de medir: o driver de frame é que devolve os valores de
  // stencil ao que a cena que fica mostra, e sem ele a leitura apanha o meio da troca.
  await doisQuadros();
  const antes = retrato(cena, estado);
  const construcoes = [];
  const desvios = [];

  for (let volta = 1; volta <= ciclos; volta++) {
    const construida = await buildScene(dado, { parent: cena, preview: options.preview === true });
    await doisQuadros();
    const durante = retrato(cena, estado);
    construida.remove();
    await doisQuadros();
    const depois = retrato(cena, estado);

    construcoes.push({ volta: volta, durante: durante });
    for (const diferenca of diferencas(antes, depois)) {
      desvios.push({ volta: volta, campo: diferenca.campo, antes: diferenca.antes, depois: diferenca.depois });
    }
  }

  // Um `build` que não constrói nada também passaria o ciclo: o `remove()` não tem o que estragar.
  // Por isso se exige que a primeira construção tenha acrescentado portais ou conteúdo.
  const primeira = construcoes[0] ? construcoes[0].durante : antes;
  const construiu = primeira.portais > antes.portais || primeira.entradas > antes.entradas;
  const relatorio = {
    mundo: mundo,
    ciclos: ciclos,
    antes: antes,
    construcao: { portais: primeira.portais, dimensoes: primeira.dimensoes, entradas: primeira.entradas, nosNaCena: primeira.nosNaCena },
    depois: retrato(cena, estado),
    desvios: desvios,
    construiu: construiu,
    passou: construiu && desvios.length === 0
  };

  console.table([{
    mundo: relatorio.mundo,
    ciclos: relatorio.ciclos,
    construiu: relatorio.construiu ? 'sim' : 'NAO',
    desvios: relatorio.desvios.length,
    passou: relatorio.passou ? 'sim' : 'NAO'
  }]);
  return relatorio;
}
