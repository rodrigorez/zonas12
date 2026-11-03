// O T1 e o T7/T11, as duas perguntas que faltavam à bateria dos doze (§10 do roadmap).
//
// Porque existe: `tools/regression/acceptance.mjs` sabe atravessar uma porta (`walkDoor`) e medir
// uma chegada (`checkArrival`), mas nenhum runner as chamava — os dois testes mediam-se a partir de
// um script de sessão, e a aceitação da fase não era reproduzível por quem chegasse depois. Este
// ficheiro é esse runner, como o `twelve-tests.mjs` é o dos outros seis grupos.
//
// Os dois vivem juntos porque precisam da mesma coisa que a página não pode dar sozinha: **contar
// navegações que levam o documento com elas**. A sonda deixa o registo em `sessionStorage` — que a
// navegação preserva — e este runner lê-o do lado de lá.
//
//   T1   atravessar uma porta a passo de 0,1 m conta **uma** travessia: as que navegam levam a
//        página ao mundo do `action.target` (com `?from=`); as de janela mudam a dimensão activa
//        uma vez e não navegam.
//   T7   a chegada não dispara travessias em cadeia: quem aparece à frente da porta inversa fica
//        exactamente no ponto que o `arrivalPoint` calcula, andar para dentro da sala dispara
//        **zero** travessias, e meia volta dispara **uma**.
//   T11  é o mesmo que o T7, na direcção em que o visitante fica virado — é por isso que se medem
//        os dois na mesma caminhada.
//
// Uso, da raiz do projeto:
//
//   node tools/regression/traversal-tests.mjs                    todas as páginas do dado, todas as portas
//   node tools/regression/traversal-tests.mjs scene1             só as portas de um mundo
//
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, serveProject, openBrowser, checks, sleep } from './harness.mjs';
import { paginasDaExposicao, cobertura } from './paginas.mjs';

// A rota de cada página: o portão é a raiz, cada sala é uma pasta (D28) e o fixture vem pelo
// `?scene=` (D9). A lista vem do dado (P1 da `docs/SPEC-NOVA-SALA.md`) — a mesma do `twelve-tests.mjs`,
// pela mesma razão: o que se mede é a exposição que o visitante abre, e uma lista escrita à mão deixa
// uma sala nova de fora sem que ninguém dê por isso.
const LISTA = paginasDaExposicao();
const MUNDOS = LISTA.paginas.map((pagina) => (pagina.cena
  ? { slug: pagina.slug, rota: pagina.rota, cena: pagina.cena }
  : { slug: pagina.slug, rota: pagina.rota }));

// As marcas que as sondas deixam antes de a página se ir embora (ver `acceptance.mjs`).
const MARCA = 'zonas12-aceitacao';
const MARCA_CHEGADA = 'zonas12-aceitacao-chegada';

const PRONTO = `Boolean(window.portalDebug && window.portalDebug.built && window.portalDebug.world && window.portalDebug.state &&
  window.portalDebug.state.portals && document.querySelector('a-scene') &&
  document.querySelector('a-scene').renderer)`;

const dadosDoMundo = (slug) =>
  JSON.parse(readFileSync(join(ROOT, 'data', 'worlds', slug + '.json'), 'utf8'));

function endereco(site, mundo, extra) {
  const parametros = [mundo.cena ? 'scene=' + mundo.cena : null, extra || null,
    'bust=' + Date.now() + '-' + Math.random()].filter(Boolean);
  return site.base + mundo.rota + '?' + parametros.join('&');
}

// Abre uma página pelo endereço e só devolve quando ela está construída. A `timeOrigin` tem de
// mudar: sem isso lê-se o documento anterior, que ainda está a responder.
async function abrirPagina(browser, site, mundo, extra) {
  const antes = await browser.evaluate('performance.timeOrigin').catch(() => 0);
  await browser.page.send('Page.navigate', { url: endereco(site, mundo, extra) });
  for (let i = 0; i < 300; i++) {
    try {
      if (await browser.evaluate(`performance.timeOrigin !== ${antes} && ${PRONTO}`)) break;
    } catch (error) { /* ainda a navegar */ }
    await sleep(200);
  }
  await sleep(2500);
  await browser.evaluate(`(() => {
    sessionStorage.removeItem(${JSON.stringify(MARCA)});
    sessionStorage.removeItem(${JSON.stringify(MARCA_CHEGADA)});
    return true;
  })()`);
}

const sonda = (site) =>
  JSON.stringify(new URL('tools/regression/acceptance.mjs', site.base + '/').href);

const estado = `(() => {
  let marca = null;
  let chegada = null;
  let travessia = null;
  try { marca = JSON.parse(sessionStorage.getItem(${JSON.stringify(MARCA)}) || 'null'); } catch (error) {}
  try { chegada = JSON.parse(sessionStorage.getItem(${JSON.stringify(MARCA_CHEGADA)}) || 'null'); } catch (error) {}
  try { travessia = JSON.parse(sessionStorage.getItem('zonas12.travessia') || 'null'); } catch (error) {}
  return {
    mundo: window.portalDebug && window.portalDebug.world,
    url: location.pathname + location.search,
    dimensao: window.portalDebug && window.portalDebug.state.activeDimension,
    marca: marca,
    chegada: chegada,
    travessia: travessia
  };
})()`;

// T1: uma porta, numa página própria. As de janela respondem na própria chamada; as que navegam
// levam o documento com elas, por isso o resultado vem do `sessionStorage` depois de assentar.
async function medirPorta(browser, site, mundo, porta) {
  await abrirPagina(browser, site, mundo);
  // A porta mede-se **na pose do dado** (D86): numa sala com portas a oscilar, uma caminhada começada a
  // meio de uma oscilação mede a oscilação. O `settleMotion` põe as portas onde o ficheiro as escreve e
  // pára o relógio; nas salas sem movimento não há nada a parar. O que se prova aqui é a porta, e é a
  // `motion.mjs` que prova o movimento.
  await browser.evaluate(
    '(() => { const d = window.portalDebug; if (d && d.settleMotion) d.settleMotion(); else if (d && d.freezeMotion) d.freezeMotion(true); return true; })()'
  ).catch(() => { /* uma página sem o lever */ });
  // A porta só existe na dimensão onde está (`ownedBy`, -1 = nas duas): atravessar uma porta do
  // outro lado de uma janela exige pôr a cena nessa dimensão primeiro. Sem isto, a porta de volta
  // do fixture nunca é atravessada — e o teste diria «0 travessias» de uma porta que não estava lá.
  const chamada = `(async () => {
    const modulo = await import(${sonda(site)});
    const porta = window.portalDebug.state.portals.find((cada) => cada.data.id === ${porta.id});
    const dona = porta && porta.data.ownedBy;
    if (typeof dona === 'number' && dona >= 0 && window.portalDebug.state.activeDimension !== dona) {
      window.portalDebug.setActiveDimension(dona);
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    }
    return modulo.walkDoor(${porta.id});
  })()`;

  if (porta.action.kind !== 'navigate') {
    const resultado = await browser.evaluate(chamada, 180000);
    const depois = await browser.evaluate(estado);
    return { porta: porta.id, resultado: resultado, depois: depois };
  }

  // A navegação destrói o contexto: a chamada não pode ser esperada, e o que se lê a seguir é a
  // página que chegou. A `timeOrigin` é o que distingue a página nova da que ainda está a andar —
  // a antiga também está «pronta» durante os ~0,7 s da caminhada.
  const antes = await browser.evaluate('performance.timeOrigin');
  await browser.page.send('Runtime.evaluate', { expression: chamada, awaitPromise: false }, 5000)
    .catch(() => { /* a página vai-se embora */ });
  for (let i = 0; i < 200; i++) {
    try {
      if (await browser.evaluate(`performance.timeOrigin !== ${antes} && ${PRONTO}`)) break;
    } catch (error) { /* ainda a navegar */ }
    await sleep(200);
  }
  await sleep(1500);
  const depois = await browser.evaluate(estado);
  return { porta: porta.id, resultado: null, depois: depois };
}

// T7/T11: a página que se abre com `?from=` é a que o visitante vê ao atravessar. A sonda confirma
// o ponto de chegada e conta as travessias dos dois sentidos.
async function medirChegada(browser, site, mundo, deOnde) {
  await abrirPagina(browser, site, mundo, 'from=' + deOnde);
  // As portas na **pose do dado** (D86/D91): o que o T7/T11 mede é a geometria da chegada — o ponto, o
  // olhar e os dois sentidos da travessia —, e uma porta a oscilar põe a caixa de colisão a metros do
  // sítio onde o ficheiro a escreve. Medido sem assentar, depois de as salas passarem a oscilar (D91):
  // **33 de 165** verificações perderam a meia volta, porque quem andava atravessava o plano do dado e
  // não estava dentro da caixa onde ela estava. O movimento mede-se na `motion.mjs`.
  await browser.evaluate(
    '(() => { const d = window.portalDebug; if (d && d.settleMotion) d.settleMotion(); else if (d && d.freezeMotion) d.freezeMotion(true); return true; })()'
  ).catch(() => { /* uma página sem o lever */ });
  const chamada = `(async () => {
    const modulo = await import(${sonda(site)});
    return modulo.checkArrival();
  })()`;
  let resultado = null;
  try {
    resultado = await browser.evaluate(chamada, 180000);
  } catch (error) {
    // A meia volta de uma porta de mundo navega se o instrumento não a tiver travado; nesse caso o
    // resultado que ele já escreveu é a resposta.
  }
  if (resultado && resultado.porta !== undefined) return resultado;
  const depois = await browser.evaluate(estado).catch(() => ({ chegada: null }));
  return depois.chegada || { erro: 'sem resultado da chegada em ' + mundo.slug + ' (from=' + deOnde + ')' };
}

function verificarPorta(result, mundo, porta, medida) {
  const nome = mundo.slug + ' · T1: a porta ' + porta.id;
  if (porta.action.kind === 'navigate') {
    const marca = medida.depois.marca || {};
    const chegou = medida.depois.mundo === porta.action.target;
    // D84: a **sala de ensaio** navega *sem* `?from` (`world.carryOrigin: false`) — o destino dela é
    // uma primeira visita, não uma chegada por uma porta. A regra mede-se nos dois sentidos: quem leva
    // a origem tem de a levar na URL, quem não leva tem de não a levar. Sem esta inversão o teste
    // exigia o `?from` a todas as portas e a regra nova nunca seria medida.
    const levaOrigem = (dadosDoMundo(mundo.slug).world || {}).carryOrigin !== false;
    const levou = String(medida.depois.url).indexOf('from=' + mundo.slug) >= 0;
    const voltou = levaOrigem ? levou : !levou;
    result.check(nome + ' (navega para ' + porta.action.target + ') atravessa-se uma vez e chega lá',
      marca.porta === porta.id && marca.navegacoes === 1 && chegou && voltou,
      'travessias=' + marca.navegacoes + ', mundo=' + medida.depois.mundo +
        ', from=' + (levou ? 'sim' : 'não') + (levaOrigem ? '' : ' (esperado não)') +
        ', url=' + medida.depois.url);
    // D55: o registo que a sonda mostra. Sem ele, uma travessia que fica a meio é indistinguível de
    // o visitante não ter chegado à porta — e foi assim que um atravessar sem mudar de página passou
    // por «não aconteceu nada» no telemóvel.
    const registo = medida.depois.travessia || {};
    result.check(nome + ' deixa o registo da travessia para a sonda, já preparado',
      registo.porta === porta.id && registo.para === porta.action.target &&
        registo.encosto === true && registo.captura === true && registo.cobertura === true &&
        !registo.erro,
      JSON.stringify(registo));
    return;
  }
  const janela = medida.resultado || {};
  const lados = String(janela.dimensao || '').split(' -> ');
  const mudou = lados.length === 2 && lados[0] !== lados[1];
  result.check(nome + ' (janela) muda a dimensão uma vez e não navega',
    janela.passou === true && janela.travessiasDeJanela === 1 && janela.navegacoesPedidas === 0 && mudou,
    'travessias=' + janela.travessiasDeJanela + ', navegações=' + janela.navegacoesPedidas +
      ', dimensão ' + (janela.dimensao || '?'));
}

function verificarChegada(result, medida, mundo, deOnde) {
  const nome = mundo.slug + ' (de ' + deOnde + ') · T7/T11: a chegada';
  if (!medida || medida.erro) {
    result.check(nome + ' não dispara travessias em cadeia', false, medida ? medida.erro : 'sem resultado');
    return;
  }
  const dentro = medida.andarParaDentro || {};
  const volta = medida.meiaVolta || {};
  result.check(nome + ' fica no ponto calculado e olha para dentro, não dispara nada a entrar e ' +
    'dispara uma a voltar',
    medida.passou === true,
    'porta=' + medida.porta + ', esperado=' + JSON.stringify(medida.esperado) +
      ', câmara=' + JSON.stringify(medida.camera) +
      ', olhar=' + medida.yaw + '° (esperado ' + medida.yawEsperado + '°)' +
      ', a entrar=' + (dentro.janelas + dentro.navegacoes) +
      ', a voltar=' + (volta.janelas + volta.navegacoes));
}

// As chegadas que existem: cada porta que navega para um mundo onde há uma porta de chegada da
// origem (L19). Sai do dado, e não de uma lista escrita à mão — uma porta nova entra sozinha.
function chegadas() {
  const lista = [];
  const vistos = new Set();
  for (const origem of MUNDOS) {
    const porta = dadosDoMundo(origem.slug);
    for (const cada of porta.portals) {
      if (!cada.action || cada.action.kind !== 'navigate') continue;
      const destino = MUNDOS.find((mundo) => mundo.slug === cada.action.target);
      if (!destino) continue;
      const chegada = dadosDoMundo(destino.slug).portals
        .find((outra) => outra.arrivalFrom === origem.slug);
      if (!chegada) continue;
      const chave = destino.slug + '|' + origem.slug;
      if (vistos.has(chave)) continue;
      vistos.add(chave);
      lista.push({ mundo: destino, deOnde: origem.slug, porta: cada.id, chegada: chegada.id });
    }
  }
  return lista;
}

async function main() {
  const pedidos = process.argv.slice(2);
  const mundos = pedidos.length ? MUNDOS.filter((mundo) => pedidos.includes(mundo.slug)) : MUNDOS;
  if (!mundos.length) {
    console.error('nenhum mundo conhecido em: ' + pedidos.join(', '));
    process.exit(1);
  }

  const site = await serveProject();
  const browser = await openBrowser({ width: 1400, height: 900, camera: true });
  const result = checks();
  // P3 da spec: a lista derivada tem de cobrir todas as salas do dado.
  const coberto = cobertura(LISTA);
  result.check('a lista cobre todas as salas do dado (' + coberto.salas + ')', coberto.ok,
    coberto.deFora.length ? 'de fora: ' + coberto.deFora.join(', ')
      : coberto.ignorados.length ? 'ilegíveis: ' + coberto.ignorados.join(' | ')
        : coberto.paginas + ' páginas medidas');

  try {
    console.log('== T1: as portas, uma a uma ==');
    for (const mundo of mundos) {
      for (const porta of dadosDoMundo(mundo.slug).portals) {
        const medida = await medirPorta(browser, site, mundo, porta);
        verificarPorta(result, mundo, porta, medida);
      }
    }

    console.log('');
    console.log('== T7/T11: a chegada, mundo a mundo ==');
    for (const alvo of chegadas().filter((cada) => mundos.includes(cada.mundo))) {
      const medida = await medirChegada(browser, site, alvo.mundo, alvo.deOnde);
      verificarChegada(result, medida, alvo.mundo, alvo.deOnde);
    }
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('T1 e T7/T11 (as portas e a chegada)');
  process.exit(result.list.some((item) => !item.ok) ? 1 : 0);
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
