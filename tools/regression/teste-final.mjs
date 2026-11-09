#!/usr/bin/env node
// A rotina de teste final: uma passagem pelo browser, com servidor local, que **mede e escreve** o
// CSV da exposição inteira — 28 salas, 152 portas (ida e volta) e 150 obras.
//
// Porque existe: cada bateria do projeto responde a uma pergunta e diz «passou»; nenhuma delas deixa
// um registo que se possa ler obra a obra, porta a porta, e importar para uma folha. Esta é a que
// junta as perguntas num só lugar e escreve o que mediu, incluindo o que está mal. Ela **não**
// substitui as outras: reaproveita-as (o `harness.mjs` para o servidor e o Chrome, e as sondas do
// `acceptance.mjs` para atravessar uma porta e medir a chegada), e o que ela acrescenta é a cobertura
// — todas as portas nas duas direções e todas as fichas — e o CSV.
//
// O que mede, por nível (a mesma ordem do CSV):
//
//   Portão   a sala de entrada: o fundo, a consola, as obras (nenhuma) e as 27 portas que saem dela
//   Portal   por cada porta: **ida** (atravessar leva ao destino com `?from=`), a chegada (ponto e
//            olhar do dado, nada dispara ao entrar, uma travessia ao voltar) e **volta** (a porta
//            inversa regressa à origem) — as duas direções do mesmo par, medidas na mesma passagem
//   Sala     o fundo próprio (id, cadência), a consola, as malhas das obras com a capa carregada,
//            e as portas que a ligam às vizinhas e ao portão
//   Obra     a ficha de cada uma: abre, a capa carrega, o meio é o do tipo, o título, o autor e a
//            sinopse estão lá, e o site responde o que responde (o resto é a coluna `site`)
//
// O CSV sai em `docs/TESTE-FINAL.csv` (ou `--csv=<caminho>`), com uma linha por objeto e a ordem
// fixa portão → portal → sala → obra dentro de cada sala.
//
// Uso, da raiz do projeto:
//
//   node tools/regression/teste-final.mjs                 a exposição inteira (~20 min)
//   node tools/regression/teste-final.mjs --so=scene20    uma sala (para ver o formato)
//   node tools/regression/teste-final.mjs --desde=170     retoma na linha 170 do CSV
//   node tools/regression/teste-final.mjs --fase=portas   só as portas, juntando ao CSV que existe
//   node tools/regression/teste-final.mjs --sem-rede      não pergunta nada aos sites das obras
//
// Sai com 0 quando não há nenhuma linha `FALHA`, 1 quando há — é o que o torna utilizável numa
// bateria. As `ATENÇÃO` não fazem falhar: são o que funciona e merece olho.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ROOT, serveProject, openBrowser, sleep } from './harness.mjs';
import { paginasDaExposicao } from './paginas.mjs';
import { platformEmbed } from '../../js/scene/platform-embed.js';

// ---------------------------------------------------------------- argumentos

const argumentos = process.argv.slice(2);
const opcao = (nome, falta) => {
  const achado = argumentos.find((arg) => arg.startsWith('--' + nome + '='));
  return achado ? achado.slice(nome.length + 3) : falta;
};
const SO = opcao('so', null);
const DESDE = Number(opcao('desde', '0')) || 0;
const CSV = opcao('csv', join(ROOT, 'docs', 'TESTE-FINAL.csv'));
const CAPTURAS = opcao('capturas', null);
const SEM_REDE = argumentos.includes('--sem-rede');
// O endereço que vai na coluna `url`: o publicado, para o autor poder clicar; a medição corre no
// servidor local, mas um `127.0.0.1:<porta>` morre com a corrida.
const BASE = opcao('base', 'https://rodrigorez.github.io/zonas12');
// `--fase=portas` refaz só a passagem das portas e junta o resultado ao CSV que já existe: uma
// correção de instrumento não obriga a medir as 150 fichas outra vez.
const FASE = opcao('fase', 'todas');

// ---------------------------------------------------------------- o dado

const LISTA = paginasDaExposicao();
const PAGINAS = LISTA.paginas.filter((pagina) => !pagina.cena);
const DADOS = new Map(PAGINAS.map((pagina) => [pagina.slug, JSON.parse(
  readFileSync(join(ROOT, 'data', 'worlds', pagina.slug + '.json'), 'utf8'))]));
const ORDEM = new Map(PAGINAS.map((pagina, indice) => [pagina.slug, indice]));
const paginaDe = (slug) => PAGINAS.find((pagina) => pagina.slug === slug);

// Os pares de portas: cada porta que navega e a porta inversa do destino. Conta-se **uma vez** por
// par (o lado de slug menor), porque as duas direções se medem juntas: atravessar a da origem e,
// chegando, atravessar a de volta. São 76 pares para as 152 portas.
const PARES = [];
for (const pagina of PAGINAS) {
  for (const porta of DADOS.get(pagina.slug).portals) {
    if (!porta.action || porta.action.kind !== 'navigate') continue;
    const destino = porta.action.target;
    if (!(pagina.slug < destino)) continue;
    const volta = DADOS.get(destino).portals.find((cada) => cada.action && cada.action.target === pagina.slug);
    PARES.push({ origem: pagina.slug, destino: destino, ida: porta, volta: volta || null });
  }
}
PARES.sort((a, b) => (ORDEM.get(a.origem) - ORDEM.get(b.origem)) || (a.ida.id - b.ida.id));

// ---------------------------------------------------------------- o CSV

const COLUNAS = ['ordem', 'nivel', 'sala', 'sala_nome', 'item', 'item_nome', 'ligacao',
  'ida', 'volta', 'shader', 'capa', 'clique', 'ficha', 'texto', 'site', 'estado', 'observacao',
  'gravidade', 'url', 'evidencia', 'medido_em'];

const campo = (valor) => {
  const texto = valor === null || valor === undefined ? '' : String(valor);
  return /[",;\n\r]/.test(texto) ? '"' + texto.replace(/"/g, '""') + '"' : texto;
};

const nomeDaSala = (slug) => {
  const mundo = DADOS.get(slug) || { world: {} };
  return (mundo.world && mundo.world.name && (mundo.world.name.pt || mundo.world.name.en)) || slug;
};

// A ordem pedida: portão primeiro, e dentro de cada sala as portas, depois a sala, depois as obras.
function linhasOrdenadas(registos) {
  const linhas = [];
  for (const pagina of PAGINAS) {
    const slug = pagina.slug;
    const portas = registos.portas.filter((registro) => registro.sala === slug);
    portas.sort((a, b) => a.porta - b.porta);
    const sala = registos.salas.find((registro) => registro.sala === slug);
    // No portão a linha da sala vem primeiro: é a porta de entrada da exposição, e as 27 portas que
    // saem dela são o que se lê a seguir. Nas salas é ao contrário — chega-se pela porta, e a sala é
    // o que essas portas ligam.
    if (slug === 'gate' && sala) linhas.push(sala);
    linhas.push(...portas);
    if (slug !== 'gate' && sala) linhas.push(sala);
    const obras = registos.obras.filter((registro) => registro.sala === slug);
    obras.sort((a, b) => a.obra - b.obra);
    linhas.push(...obras);
  }
  return linhas.map((linha, indice) => Object.assign({}, linha, { ordem: indice + 1 }));
}

function escreverCsv(registos) {
  const linhas = linhasOrdenadas(registos).filter((linha) => linha.ordem > DESDE);
  const texto = [COLUNAS.join(',')]
    .concat(linhas.map((linha) => COLUNAS.map((coluna) => campo(linha[coluna])).join(',')))
    .join('\n') + '\n';
  writeFileSync(CSV, texto, 'utf8');
  return linhas;
}

// O contrário do `campo`, para o `--fase=portas` poder ler o CSV da corrida anterior.
function lerLinha(linha) {
  const campos = [];
  let atual = '';
  let dentro = false;
  for (let i = 0; i < linha.length; i++) {
    const letra = linha[i];
    if (dentro) {
      if (letra === '"' && linha[i + 1] === '"') { atual += '"'; i++; }
      else if (letra === '"') dentro = false;
      else atual += letra;
    } else if (letra === '"') dentro = true;
    else if (letra === ',') { campos.push(atual); atual = ''; }
    else atual += letra;
  }
  campos.push(atual);
  return campos;
}

// As linhas de um CSV já escrito, com os nomes das colunas (as `Portão`/`Sala`/`Obra` ficam nos seus
// registos; as de portal voltam a ser medidas, é para isso que o `--fase=portas` existe).
function lerCsv(ficheiro) {
  const registos = { salas: [], portas: [], obras: [] };
  let texto;
  try {
    texto = readFileSync(ficheiro, 'utf8');
  } catch (error) {
    return registos;
  }
  const linhas = texto.split('\n').filter((linha) => linha !== '');
  const cabecalho = lerLinha(linhas[0]);
  for (const linha of linhas.slice(1)) {
    const campos = lerLinha(linha);
    const registo = {};
    cabecalho.forEach((coluna, indice) => { registo[coluna] = campos[indice]; });
    if (registo.nivel === 'Portal') {
      registo.porta = Number(registo.porta);
      registos.portas.push(registo);
      continue;
    }
    if (registo.nivel === 'Obra') {
      registo.obra = Number(registo.obra);
      registos.obras.push(registo);
    } else {
      registos.salas.push(registo);
    }
  }
  return registos;
}

// ---------------------------------------------------------------- o browser

const PRONTO = 'Boolean(window.portalDebug && window.portalDebug.built && window.portalDebug.world && '
  + 'window.portalDebug.state && window.portalDebug.state.portals && document.querySelector("a-scene") '
  + '&& document.querySelector("a-scene").renderer)';

const endereco = (site, pagina, extra) => {
  const parametros = [pagina.cena ? 'scene=' + pagina.cena : null, extra || null,
    'bust=' + Date.now() + '-' + Math.random().toString(36).slice(2)].filter(Boolean);
  return site.base + pagina.rota + '?' + parametros.join('&');
};

async function abrirSala(browser, site, pagina, extra) {
  const antes = await browser.evaluate('performance.timeOrigin').catch(() => 0);
  await browser.page.send('Page.navigate', { url: endereco(site, pagina, extra) });
  for (let i = 0; i < 300; i++) {
    try {
      if (await browser.evaluate('performance.timeOrigin !== ' + antes + ' && ' + PRONTO)) break;
    } catch (error) { /* ainda a navegar */ }
    await sleep(200);
  }
  // As marcas das sondas ficam para trás quando se atravessa uma porta; uma página medida com marcas
  // antigas não é a página que o visitante abre (é o que o `traversal-tests` também limpa).
  await browser.evaluate('(() => { try { sessionStorage.removeItem("zonas12-aceitacao");'
    + ' sessionStorage.removeItem("zonas12-aceitacao-chegada"); } catch (error) {} return true; })()')
    .catch(() => {});
  await sleep(1200);
  return true;
}

async function abrirFicha(browser, url) {
  await browser.page.send('Page.navigate', { url });
  for (let i = 0; i < 200; i++) {
    try {
      const pronto = await browser.evaluate('(() => { const f = document.querySelector("#ficha"); '
        + 'return Boolean(f && (f.querySelector(".titulo") || f.querySelector(".sinopse"))); })()');
      if (pronto) break;
    } catch (error) { /* ainda a navegar */ }
    await sleep(150);
  }
  await sleep(600);
  return true;
}

const sonda = (site) => JSON.stringify(new URL('tools/regression/acceptance.mjs', site.base + '/').href);

// A prova visual de uma linha que falhou: o que estava no ecrã no momento. Só com `--capturas=<pasta>`,
// porque um PNG por falha dentro do repositório é peso que ninguém quer.
async function capturar(browser, nome) {
  if (!CAPTURAS) return null;
  try {
    mkdirSync(CAPTURAS, { recursive: true });
    const imagem = await browser.screenshot();
    const ficheiro = join(CAPTURAS, nome.replace(/[^\w.\-]+/g, '_') + '.png');
    writeFileSync(ficheiro, imagem.bytes);
    return ficheiro;
  } catch (error) {
    return null;
  }
}

// ---------------------------------------------------------------- medir uma sala

async function medirSala(browser) {
  const leitura = '(() => {'
    + ' const d = window.portalDebug;'
    + ' if (!d || !d.state) return { erro: "sem portalDebug" };'
    + ' const activa = d.state.activeDimension;'
    + ' const lista = d.state.dimensions[activa] || [];'
    + ' const obras = [];'
    + ' for (const entrada of lista) {'
    + '   const m = entrada.mesh;'
    + '   if (!m || !m.el || m.name.indexOf("-artwork") === -1) continue;'
    + '   const art = m.el.getAttribute("open-artwork") || {};'
    + '   const mapa = m.material && m.material.map;'
    + '   const img = mapa && mapa.image;'
    + '   obras.push({ id: m.el.getAttribute("data-artwork-id"), modo: art.mode || null,'
    + '     url: art.url || null,'
    + '     capa: Boolean(img && img.complete && (img.naturalWidth || img.width) > 0),'
    + '     largura: img ? (img.naturalWidth || img.width || 0) : 0 });'
    + ' }'
    + ' const s = d.shader();'
    + ' const minhas = (s.backgrounds || []).filter((b) => b.dimension === activa);'
    + ' return { mundo: d.world, activa: activa, titulo: document.title,'
    + '   shader: minhas.length ? minhas[0] : null, politica: s.policy,'
    + '   obras: obras, portas: d.state.portals.length,'
    + '   quadros: (window.portalDebug.state.timeline || 0) };'
    + '})()';
  const antes = await browser.evaluate(leitura);
  if (antes.erro) return antes;
  const inicio = Date.now();
  await sleep(2000);
  const updates = await browser.evaluate('window.portalDebug.shader().policy.updates').catch(() => null);
  const segundos = Math.max(0.5, (Date.now() - inicio) / 1000);
  return Object.assign(antes, {
    actualizacoes: updates === null ? null : updates - antes.politica.updates,
    segundos: segundos
  });
}

// O clique numa obra da sala (T6), pela sonda que já sabe apontar o rato ao sítio certo do ecrã.
async function medirClique(browser, site, indice) {
  const chamada = '(async () => { const modulo = await import(' + sonda(site) + ');'
    + ' return modulo.checkArtworkClick({ obra: ' + indice + ' }); })()';
  return browser.evaluate(chamada, 60000).catch((erro) => ({ erro: String(erro && erro.message || erro) }));
}

// ---------------------------------------------------------------- atravessar uma porta

async function atravessar(browser, site, porta) {
  const antes = await browser.evaluate('performance.timeOrigin');
  const chamada = '(async () => {'
    + ' const modulo = await import(' + sonda(site) + ');'
    + ' const estado = window.portalDebug;'
    + ' if (estado.settleMotion) estado.settleMotion(); else if (estado.freezeMotion) estado.freezeMotion(true);'
    + ' const porta = estado.state.portals.find((cada) => cada.data.id === ' + porta.id + ');'
    + ' const dona = porta && porta.data.ownedBy;'
    + ' if (typeof dona === "number" && dona >= 0 && estado.state.activeDimension !== dona) {'
    + '   estado.setActiveDimension(dona);'
    + '   await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));'
    + ' }'
    + ' return modulo.walkDoor(' + porta.id + ');'
    + '})()';
  await browser.page.send('Runtime.evaluate', { expression: chamada, awaitPromise: false }, 8000)
    .catch(() => { /* a página vai-se embora com a navegação */ });
  let navegou = false;
  for (let i = 0; i < 200; i++) {
    try {
      if (await browser.evaluate('performance.timeOrigin !== ' + antes + ' && ' + PRONTO)) { navegou = true; break; }
    } catch (error) { /* a meio da navegação */ }
    await sleep(200);
  }
  if (!navegou) {
    // Sem navegação: ou a porta não atravessou, ou atravessou para o mesmo mundo. O registo da
    // caminhada diz qual dos dois (a sonda deixa-o em `sessionStorage` antes de navegar).
    await sleep(800);
  } else {
    await sleep(1500);
  }
  const estado = await browser.evaluate('(() => { const p = new URLSearchParams(location.search);'
    + ' let marca = null; try { marca = JSON.parse(sessionStorage.getItem("zonas12-aceitacao") || "null"); } catch (e) {}'
    + ' return { mundo: window.portalDebug.world, from: p.get("from"),'
    + '   caminho: location.pathname + location.search, marca: marca }; })()').catch(() => null);
  return { navegou: navegou, estado: estado };
}

// A chegada (T7/T11), na página que acabou de abrir com `?from=`. A sonda substitui o `navigate` de
// todas as portas por um contador — restaurar a seguir é o que permite continuar a andar de porta em
// porta na mesma página. O `settleMotion` antes é o que o `traversal-tests` faz e pelo mesmo motivo
// (D91): sem ele a meia volta conta 0, 1 ou 2 conforme o instante, porque quem anda atravessa o plano
// do dado e não o da porta onde ela está.
async function medirChegada(browser, site) {
  await browser.evaluate('(() => { const d = window.portalDebug; if (d && d.settleMotion) d.settleMotion(); '
    + 'else if (d && d.freezeMotion) d.freezeMotion(true); return true; })()').catch(() => { /* sem o lever */ });
  const chamada = '(async () => {'
    + ' const modulo = await import(' + sonda(site) + ');'
    + ' const portas = window.portalDebug.state.portals;'
    + ' const guardados = portas.map((porta) => [porta, porta.navigate]);'
    + ' try { return await modulo.checkArrival(); }'
    + ' finally { guardados.forEach((par) => { par[0].navigate = par[1]; }); }'
    + '})()';
  return browser.evaluate(chamada, 120000).catch((erro) => ({ erro: String(erro && erro.message || erro) }));
}

// ---------------------------------------------------------------- a ficha de uma obra

async function medirFicha(browser) {
  return browser.evaluate('(() => {'
    + ' const ficha = document.querySelector("#ficha");'
    + ' if (!ficha) return { erro: "sem #ficha" };'
    + ' const texto = (seletor) => { const el = ficha.querySelector(seletor); return el ? el.textContent.trim() : null; };'
    + ' const meio = ficha.querySelector("[data-meio]");'
    + ' const img = ficha.querySelector("img");'
    + ' const link = ficha.querySelector(".botao-site");'
    + ' const frame = ficha.querySelector("iframe");'
    + ' const caixa = ficha.querySelector(".meio-site");'
    + ' return {'
    + '   titulo: texto(".titulo"), exposicao: texto(".exposicao"),'
    + '   autores: Array.from(ficha.querySelectorAll(".autor")).map((el) => el.textContent.trim()),'
    + '   sinopse: texto(".sinopse"),'
    + '   meio: meio ? meio.getAttribute("data-meio") : null,'
    + '   plataforma: caixa ? caixa.getAttribute("data-platform") : null,'
    + '   recusa: caixa ? caixa.getAttribute("data-recusa") : null,'
    + '   classes: caixa ? caixa.className : null,'
    + '   embed: frame ? frame.getAttribute("src") : null,'
    + '   siteHref: link ? link.getAttribute("href") : null,'
    + '   capa: img ? { completa: Boolean(img.complete && img.naturalWidth > 0),'
    + '     de: img.getAttribute("data-capa-de"), largura: img.naturalWidth || 0 } : null,'
    + '   tituloDoDocumento: document.title,'
    + '   debug: window.obraDebug ? { mundo: window.obraDebug.world,'
    + '     obra: window.obraDebug.artworkId, tipo: window.obraDebug.kind,'
    + '     meio: window.obraDebug.medium } : null'
    + ' }; })()').catch((erro) => ({ erro: String(erro && erro.message || erro) }));
}

// O que o endereço do site responde, de fora do browser — pela **mesma ordem de perguntas** do
// `links.mjs` (o único instrumento que olha para links), para o CSV não dizer uma coisa e ele outra:
// primeiro o estado HTTP, depois a tabela das plataformas (`frameable: false`), e só quando a
// plataforma é desconhecida é que os cabeçalhos do `<iframe>` decidem. Nas plataformas conhecidas
// (YouTube, Vimeo, Drive…) o que a ficha desenha é outro endereço, e é esse que se pergunta.
async function espiarUrl(url) {
  const controlo = new AbortController();
  const temporizador = setTimeout(() => controlo.abort(), 15000);
  try {
    const resposta = await fetch(url, { redirect: 'follow', signal: controlo.signal });
    return {
      estado: resposta.status,
      final: resposta.url,
      tipo: (resposta.headers.get('content-type') || '').toLowerCase(),
      xfo: resposta.headers.get('x-frame-options') || '',
      csp: resposta.headers.get('content-security-policy') || ''
    };
  } catch (erro) {
    return { erro: erro.name === 'AbortError' ? 'tempo esgotado' : erro.message };
  } finally {
    clearTimeout(temporizador);
  }
}

function recusaPelosCabecalhos(info) {
  if (info.xfo) {
    const valor = info.xfo.toLowerCase();
    if (valor.includes('deny') || valor.includes('sameorigin')) return 'X-Frame-Options: ' + info.xfo;
  }
  if (info.csp) {
    const achado = /frame-ancestors([^;]*)/i.exec(info.csp);
    if (achado) {
      const valor = achado[1].trim().toLowerCase();
      if (!valor.includes('*') && !valor.includes('http://127.0.0.1') && !valor.includes('http://localhost')) {
        return 'CSP frame-ancestors' + achado[1];
      }
    }
  }
  return null;
}

async function espiarSite(url) {
  if (!url) return { estado: 'sem site' };
  if (SEM_REDE) return { estado: 'nao perguntado' };
  const embed = platformEmbed(url);
  const pagina = await espiarUrl(url);
  if (pagina.erro) return { estado: 'sem resposta (' + pagina.erro + ')' };
  if (/accounts\.login|\/login|signin/i.test(pagina.final || '')) {
    return { estado: 'login (nao embutivel)', final: pagina.final };
  }
  if (pagina.estado >= 400) return { estado: 'HTTP ' + pagina.estado, final: pagina.final };
  if (embed.frameable === false) {
    return { estado: 'nao embutivel: ' + (embed.motivo || 'tabela das plataformas'), final: pagina.final };
  }
  if (embed.platform === 'site') {
    const recusa = recusaPelosCabecalhos(pagina);
    return { estado: recusa ? 'recusa iframe (' + recusa + ')' : 'HTTP ' + pagina.estado, final: pagina.final };
  }
  if (embed.src && embed.src !== url) {
    const dentro = await espiarUrl(embed.src);
    if (dentro.erro) return { estado: 'sem resposta no embed (' + dentro.erro + ')' };
    if (dentro.estado >= 400) return { estado: 'HTTP ' + dentro.estado + ' no embed', final: dentro.final };
    const recusa = recusaPelosCabecalhos(dentro);
    if (recusa) return { estado: 'recusa iframe no embed (' + recusa + ')' };
  }
  return { estado: 'HTTP ' + pagina.estado, final: pagina.final };
}

// ---------------------------------------------------------------- as três passagens

const registos = { salas: [], portas: [], obras: [] };
const agora = () => new Date().toISOString().slice(0, 19);

async function passagemSalas(browser, site) {
  for (const pagina of PAGINAS) {
    const slug = pagina.slug;
    if (SO && SO !== slug) continue;
    const mundo = DADOS.get(slug);
    const nome = nomeDaSala(slug);
    browser.console.length = 0;
    await abrirSala(browser, site, pagina);
    const medicao = await medirSala(browser);
    // O clique de cada obra (T6), na mesma visita à sala: a malha tem de abrir a ficha certa. Custa
    // ~2 s por obra e poupa uma segunda passagem por todas as salas.
    for (let indice = 0; indice < (medicao.obras || []).length; indice++) {
      const medida = medicao.obras[indice];
      const clique = await medirClique(browser, site, indice);
      medida.clique = Boolean(clique && !clique.erro && ((clique.modo === 'page'
        && typeof clique.url === 'string' && clique.url.indexOf('id=' + medida.id) >= 0) || clique.passou));
      medida.cliqueDetalhe = clique && clique.erro ? 'erro: ' + clique.erro
        : (clique && clique.apontado ? (clique.apontado.url || clique.apontado.tag) : null);
    }
    // Uma passagem só das salas continua a servir às obras: o clique de cada obra é o mesmo, e a linha
    // da obra (que pode vir do CSV, num `--fase=salas`) fica com ele.
    for (const medida of (medicao.obras || [])) {
      const linha = registos.obras.find((registro) => registro.sala === slug
        && Number(((/(\d+)\s*$/.exec(registro.item) || [])[1]) || NaN) === Number(medida.id));
      if (!linha) continue;
      linha.clique = medida.clique === true ? 'OK' : (medida.clique === false ? 'FALHA' : 'por medir');
      if (medida.clique === false) {
        linha.observacao = (linha.observacao ? linha.observacao + ' · ' : '') + 'a obra nao abriu a ficha pelo clique';
        if (linha.estado === 'OK') { linha.estado = 'FALHA'; linha.gravidade = 'bloqueia'; }
      }
    }
    const ruido = browser.console.slice(0, 6);

    const declarado = mundo.dimensions && mundo.dimensions[0] ? mundo.dimensions[0] : {};
    const shaderMedido = medicao.shader || {};
    const cadencia = medicao.politica ? medicao.politica.cadence : null;
    const taxa = typeof medicao.actualizacoes === 'number'
      ? Math.round((medicao.actualizacoes / medicao.segundos) * 10) / 10 : null;
    const anima = typeof taxa === 'number' && taxa > 0;
    const obras = medicao.obras || [];
    const comCapa = obras.filter((obra) => obra.capa).length;
    const problemas = [];

    // O nome em inglês só existe num sítio que o visitante vê: a ficha, com `?lang=en`.
    let nomeEmIngles = null;
    const primeira = mundo.artworks && mundo.artworks[0];
    if (primeira) {
      await abrirFicha(browser, site.base + '/obra.html?mundo=' + slug + '&id=' + primeira.id
        + '&lang=en&bust=' + Date.now());
      nomeEmIngles = await browser.evaluate('(() => { const el = document.querySelector("#ficha .exposicao");'
        + ' return el ? el.textContent.trim() : null; })()').catch(() => null);
    }

    if (!medicao.shader && slug !== 'gate') problemas.push('sem fundo shader medido nesta dimensao');
    if (medicao.shader && declarado.shaderId && shaderMedido.shaderId !== declarado.shaderId) {
      problemas.push('o fundo nao e o do dado (' + shaderMedido.shaderId + ' vs ' + declarado.shaderId + ')');
    }
    if (!anima && slug !== 'gate') problemas.push('o fundo nao animou em 2 s');
    if (comCapa < obras.length) problemas.push((obras.length - comCapa) + ' obra(s) sem capa carregada');
    const semClique = obras.filter((obra) => obra.clique === false);
    if (semClique.length) problemas.push(semClique.length + ' obra(s) nao abrem a ficha pelo clique');
    if (ruido.length) problemas.push('consola: ' + ruido[0].slice(0, 90));
    if (!mundo.world || !mundo.world.name || !mundo.world.name.pt) problemas.push('sem nome em portugues');
    if (!mundo.world || !mundo.world.name || !mundo.world.name.en) problemas.push('sem nome em ingles');
    else if (nomeEmIngles !== null && nomeEmIngles !== mundo.world.name.en) {
      problemas.push('a ficha em ingles diz "' + nomeEmIngles + '" e o dado "' + mundo.world.name.en + '"');
    }

    const vizinhas = mundo.portals.map((porta) => porta.action && porta.action.target).filter(Boolean);
    const portao = vizinhas.filter((alvo) => alvo === 'gate').length;

    const estado = problemas.length ? 'FALHA' : 'OK';

    registos.salas.push({
      nivel: slug === 'gate' ? 'Portão' : 'Sala',
      sala: slug, sala_nome: nome, item: 'sala', item_nome: nome,
      ligacao: vizinhas.length + ' porta(s): ' + vizinhas.join(', ') + (portao ? ' (' + portao + ' ao portao)' : ''),
      ida: 'N/A', volta: 'N/A',
      shader: slug === 'gate' && !medicao.shader
        ? 'N/A (no portao o fundo e a camara, nao um shader)'
        : (shaderMedido.shaderId || '?') + ' · ' + taxa + '/s (teto ' + cadencia + ')'
          + (medicao.politica && medicao.politica.late ? ' · ' + medicao.politica.late + ' atrasadas' : ''),
      capa: obras.length ? comCapa + '/' + obras.length + ' malhas com capa' : 'N/A (sem obras)',
      clique: 'N/A', ficha: 'N/A', texto: 'N/A', site: 'N/A',
      estado: estado,
      observacao: problemas.join(' · '),
      gravidade: problemas.length ? 'bloqueia' : '—',
      url: BASE + pagina.rota,
      evidencia: 'medirSala + consola da sessao · ' + (nomeEmIngles === null ? 'ficha em ingles nao lida' : 'ficha em ingles: ' + nomeEmIngles),
      medido_em: agora(),
      obrasMedidas: obras, ruido: ruido
    });
    escreverCsv(registos);
    console.log('  sala ' + (ORDEM.get(slug) + 1) + '/' + PAGINAS.length + ' · ' + slug + ' · '
      + estado + ' · ' + obras.length + ' obra(s) · ' + (shaderMedido.shaderId || '?') + ' ' + taxa + '/s');
  }
}

// O que a chegada mediu, em português de gente: o quê e por quanto falhou.
function descreverChegada(chegada) {
  if (!chegada || chegada.erro) return 'sem medicao (' + ((chegada && chegada.erro) || '?') + ')';
  const partes = [];
  partes.push('ponto ' + (chegada.chegadaNoSitioCalculado ? 'certo'
    : 'fora (' + JSON.stringify(chegada.camera) + ' vs ' + JSON.stringify(chegada.esperado) + ')'));
  partes.push('olhar ' + (chegada.chegadaOrientada ? 'certo'
    : 'fora (' + chegada.yaw + ' vs ' + chegada.yawEsperado + ')'));
  partes.push('a entrar ' + chegada.andarParaDentro.navegacoes + ' travessia(s)');
  partes.push('a voltar ' + chegada.meiaVolta.navegacoes + ' travessia(s)');
  return partes.join(', ');
}

// A chegada logo a seguir a uma travessia: se a primeira leitura não der o que a bateria dá (a guarda
// de «acabou de chegar» é sensível ao tempo), recarrega-se a página pelo `?from=` e mede-se outra vez —
// que é exactamente o caminho do `traversal-tests`. Se à segunda também falhar, é falha.
async function chegadaComRetry(browser, site, pagina, deOnde) {
  const primeira = await medirChegada(browser, site);
  if (primeira && primeira.passou) return { medida: primeira, repetida: false };
  await abrirSala(browser, site, pagina, 'from=' + deOnde);
  const segunda = await medirChegada(browser, site);
  return { medida: segunda && !segunda.erro ? segunda : primeira, repetida: true };
}

async function passagemPortas(browser, site) {
  let feitos = 0;
  for (const par of PARES) {
    if (SO && par.origem !== SO) continue;
    feitos++;
    const { origem, destino, ida, volta } = par;
    browser.console.length = 0;

    // ida: da sala de origem, atravessar a porta
    await abrirSala(browser, site, paginaDe(origem));
    const idaMedida = await atravessar(browser, site, ida);
    let chegadaIda = null;
    let repetidaIda = false;
    if (idaMedida.navegou) {
      const leitura = await chegadaComRetry(browser, site, paginaDe(destino), origem);
      chegadaIda = leitura.medida;
      repetidaIda = leitura.repetida;
    }

    // volta: já na sala de destino, atravessar a porta inversa
    let voltaMedida = null;
    let chegadaVolta = null;
    let repetidaVolta = false;
    if (volta) {
      voltaMedida = await atravessar(browser, site, volta);
      if (voltaMedida.navegou) {
        const leitura = await chegadaComRetry(browser, site, paginaDe(origem), destino);
        chegadaVolta = leitura.medida;
        repetidaVolta = leitura.repetida;
      }
    }

    const idaOk = idaMedida.navegou && idaMedida.estado && idaMedida.estado.mundo === destino
      && idaMedida.estado.from === origem;
    const voltaOk = Boolean(voltaMedida && voltaMedida.navegou && voltaMedida.estado
      && voltaMedida.estado.mundo === origem && voltaMedida.estado.from === destino);
    const chegadaOk = Boolean(chegadaIda && chegadaIda.passou);
    const chegadaVoltaOk = Boolean(chegadaVolta && chegadaVolta.passou);

    const shaderDestino = DADOS.get(destino).dimensions && DADOS.get(destino).dimensions[0]
      ? DADOS.get(destino).dimensions[0].shaderId : null;
    const shaderOrigem = DADOS.get(origem).dimensions && DADOS.get(origem).dimensions[0]
      ? DADOS.get(origem).dimensions[0].shaderId : null;
    const janelaDa = (slug, id) => DADOS.get(slug).portals.find((cada) => cada.id === id) || null;
    const nomeia = (porta, shader) => {
      const nomeado = Boolean(porta && porta.window && porta.window.shaderId);
      return shader ? nomeado && porta.window.shaderId === shader : !nomeado;
    };
    const janelaOk = nomeia(janelaDa(origem, ida.id), shaderDestino);
    const janelaVoltaOk = volta ? nomeia(janelaDa(destino, volta.id), shaderOrigem) : true;

    // Duas linhas por par: a porta de cada lado, com a sua própria leitura. As duas direções foram
    // medidas na mesma passagem (atravessar a daqui e, chegando, atravessar a de lá), por isso a
    // `volta` de uma é a `ida` da outra — e o CSV fica com as 152 portas, não com 76 pares.
    const observacoesIda = [];
    if (!idaOk) observacoesIda.push('a ida nao chegou ao destino com ?from=' + origem);
    if (chegadaIda && !chegadaIda.passou) observacoesIda.push('a chegada: ' + descreverChegada(chegadaIda));
    if (!voltaOk) observacoesIda.push('a volta pela porta ' + (volta ? volta.id : '?') + ' de ' + destino
      + ' nao regressou a origem');
    if (!janelaOk) observacoesIda.push('a janela da porta nao nomeia o shader do destino (' + shaderDestino + ')');

    const observacoesVolta = [];
    if (!voltaOk) observacoesVolta.push('a ida nao chegou ao destino com ?from=' + destino);
    if (chegadaVolta && !chegadaVolta.passou) observacoesVolta.push('a chegada: ' + descreverChegada(chegadaVolta));
    if (!idaOk) observacoesVolta.push('a volta pela porta ' + ida.id + ' de ' + origem
      + ' nao regressou a origem');
    if (!janelaVoltaOk) observacoesVolta.push('a janela da porta nao nomeia o shader do destino (' + shaderOrigem + ')');

    const estadoIda = (idaOk && voltaOk && chegadaOk) ? (observacoesIda.length ? 'ATENÇÃO' : 'OK') : 'FALHA';
    const estadoVolta = (voltaOk && idaOk && chegadaVoltaOk) ? (observacoesVolta.length ? 'ATENÇÃO' : 'OK') : 'FALHA';
    const prova = (estadoIda === 'FALHA' || estadoVolta === 'FALHA')
      ? await capturar(browser, 'porta-' + origem + '-' + ida.id) : null;

    registos.portas.push({
      nivel: 'Portal', sala: origem, sala_nome: nomeDaSala(origem),
      item: 'porta ' + ida.id, item_nome: destino,
      ligacao: origem + ' → ' + destino,
      ida: idaOk ? 'OK' : 'FALHA',
      volta: voltaOk ? 'OK' : 'FALHA',
      shader: (shaderDestino || '?') + (janelaOk ? ' · janela nomeia' : ' · janela nao nomeia'),
      capa: 'N/A', clique: 'N/A', ficha: 'N/A', texto: 'N/A', site: 'N/A',
      estado: estadoIda,
      observacao: observacoesIda.join(' · '),
      gravidade: estadoIda === 'FALHA' ? 'bloqueia' : (estadoIda === 'ATENÇÃO' ? 'incomoda' : '—'),
      url: BASE + paginaDe(destino).rota + '?from=' + origem,
      evidencia: (chegadaIda && !chegadaIda.erro
        ? 'chegada ' + JSON.stringify(chegadaIda.camera) + ' (esperado ' + JSON.stringify(chegadaIda.esperado) + ')'
        : 'atravessar') + (prova ? ' · captura ' + prova : ''),
      medido_em: agora(),
      porta: ida.id, destino: destino
    });
    if (volta) {
      registos.portas.push({
        nivel: 'Portal', sala: destino, sala_nome: nomeDaSala(destino),
        item: 'porta ' + volta.id, item_nome: origem,
        ligacao: destino + ' → ' + origem,
        ida: voltaOk ? 'OK' : 'FALHA',
        volta: idaOk ? 'OK' : 'FALHA',
        shader: (shaderOrigem || '?') + (janelaVoltaOk ? ' · janela nomeia' : ' · janela nao nomeia'),
        capa: 'N/A', clique: 'N/A', ficha: 'N/A', texto: 'N/A', site: 'N/A',
        estado: estadoVolta,
        observacao: observacoesVolta.join(' · '),
        gravidade: estadoVolta === 'FALHA' ? 'bloqueia' : (estadoVolta === 'ATENÇÃO' ? 'incomoda' : '—'),
        url: BASE + paginaDe(origem).rota + '?from=' + destino,
        evidencia: (chegadaVolta && !chegadaVolta.erro
          ? 'chegada ' + JSON.stringify(chegadaVolta.camera) + ' (esperado ' + JSON.stringify(chegadaVolta.esperado) + ')'
          : 'atravessar')
          + (repetidaVolta ? ' · chegada medida outra vez' : '') + (prova ? ' · captura ' + prova : ''),
        medido_em: agora(),
        porta: volta.id, destino: origem
      });
    }
    escreverCsv(registos);
    const estado = estadoIda === 'FALHA' || estadoVolta === 'FALHA' ? 'FALHA'
      : (estadoIda === 'ATENÇÃO' || estadoVolta === 'ATENÇÃO' ? 'ATENÇÃO' : 'OK');
    if (feitos % 5 === 0 || estado === 'FALHA') {
      console.log('  porta ' + feitos + '/' + PARES.length + ' · ' + origem + ' → ' + destino + ' · ' + estado);
    }
  }
}

async function passagemObras(browser, site) {
  let feitas = 0;
  for (const pagina of PAGINAS) {
    const slug = pagina.slug;
    if (SO && SO !== slug) continue;
    const mundo = DADOS.get(slug);
    for (const obra of mundo.artworks) {
      feitas++;
      browser.console.length = 0;
      const url = site.base + '/obra.html?mundo=' + slug + '&id=' + obra.id
        + '&bust=' + Date.now() + '-' + Math.random().toString(36).slice(2);
      await abrirFicha(browser, url);
      let ficha = await medirFicha(browser);
      // A capa remota tem uma cadeia por tentativas (D65) e a de reserva entra depois: uma leitura
      // imediata apanha o `<img>` ainda a caminho e chamaria «sem capa» ao que só está lento.
      for (let tentativa = 0; tentativa < 3 && !(ficha.capa && ficha.capa.completa); tentativa++) {
        await sleep(1200);
        ficha = await medirFicha(browser);
      }
      const siteDoDado = obra.site || null;
      const embed = siteDoDado ? platformEmbed(siteDoDado) : null;
      const espia = await espiarSite(siteDoDado);
      const ruido = browser.console.slice(0, 6);
      const titulo = (obra.title && (obra.title.pt || obra.title.en)) || null;
      const observacoes = [];

      const capaOk = Boolean(ficha.capa && ficha.capa.completa);
      if (!capaOk) observacoes.push('a capa nao carregou na ficha');
      if (ficha.capa && ficha.capa.de === 'padrao') observacoes.push('a capa e a imagem de reserva');
      const meioOk = Boolean(ficha.meio) && (!siteDoDado || ficha.meio === 'site');
      if (!meioOk) observacoes.push('o meio desenhado (' + ficha.meio + ') nao e o do tipo ' + obra.kind);
      const tituloOk = Boolean(ficha.titulo) && (!titulo || ficha.titulo === titulo);
      if (!tituloOk) observacoes.push('titulo na ficha difere do dado');
      const autoresOk = obra.authors ? (ficha.autores || []).some((linha) => linha.indexOf(obra.authors) >= 0) : (ficha.autores || []).length === 0;
      if (!autoresOk) observacoes.push('autor nao aparece na ficha');
      const sinopseOk = Boolean(ficha.sinopse) && Boolean(obra.synopsis && obra.synopsis.pt);
      if (!sinopseOk) observacoes.push('sinopse ausente');
      const exposicaoOk = ficha.exposicao === nomeDaSala(slug);
      if (!exposicaoOk) observacoes.push('a ficha nao diz o nome da sala (' + ficha.exposicao + ')');
      const linkOk = siteDoDado ? ficha.siteHref === siteDoDado : !ficha.siteHref;
      if (!linkOk) observacoes.push('o botao do site nao aponta para o dado');
      if (embed && embed.frameable === false) observacoes.push('o embed recusa ser embutido (' + embed.motivo + '): a capa fica a vista');
      if (ficha.recusa) observacoes.push('caixa do site nasce falhada (' + ficha.recusa + ')');
      if (/login|recusa|nao embutivel|sem resposta|HTTP 4|HTTP 5|tempo esgotado/.test(espia.estado)) {
        observacoes.push('site: ' + espia.estado);
      }
      if (ruido.length) observacoes.push('consola: ' + ruido[0].slice(0, 90));

      const medidaDaSala = (registos.salas.find((registro) => registro.sala === slug) || {}).obrasMedidas || [];
      const irma = medidaDaSala.find((cada) => String(cada.id) === String(obra.id));
      const cliqueOk = irma ? irma.clique : null;
      if (cliqueOk === false) observacoes.push('a obra nao abriu a ficha pelo clique'
        + (irma && irma.cliqueDetalhe ? ' (' + irma.cliqueDetalhe + ')' : ''));

      const problemasDeFicha = !capaOk || !meioOk || !tituloOk || !autoresOk || !sinopseOk || !linkOk
        || cliqueOk === false;
      const estado = problemasDeFicha ? 'FALHA' : (observacoes.length ? 'ATENÇÃO' : 'OK');
      const gravidade = problemasDeFicha ? 'bloqueia' : (observacoes.length ? 'incomoda' : '—');
      const prova = estado === 'FALHA' ? await capturar(browser, 'obra-' + slug + '-' + obra.id) : null;

      registos.obras.push({
        nivel: 'Obra', sala: slug, sala_nome: nomeDaSala(slug),
        item: 'obra ' + obra.id, item_nome: titulo || obra.asset || ('#' + obra.id),
        ligacao: siteDoDado ? (embed ? embed.platform : 'site') + ' · ' + siteDoDado.replace(/^https?:\/\//, '').split(/[/?]/)[0] : (obra.kind + ' · sem site'),
        ida: 'N/A', volta: 'N/A',
        shader: 'N/A',
        capa: capaOk ? 'OK' + (ficha.capa && ficha.capa.largura ? ' (' + ficha.capa.largura + 'px)' : '') : 'FALHA',
        clique: cliqueOk === true ? 'OK' : (cliqueOk === false ? 'FALHA' : 'por medir'),
        ficha: meioOk ? 'OK (' + ficha.meio + ')' : 'FALHA',
        texto: (tituloOk && autoresOk && sinopseOk) ? 'OK' : 'FALHA',
        site: espia.estado,
        estado: estado,
        observacao: observacoes.join(' · '),
        gravidade: gravidade,
        url: BASE + '/obra.html?mundo=' + slug + '&id=' + obra.id,
        evidencia: 'obraDebug meio=' + (ficha.debug ? ficha.debug.meio : '?')
          + (ficha.tituloDoDocumento ? ' · <title> ' + ficha.tituloDoDocumento : '')
          + (irma && irma.cliqueDetalhe ? ' · clique ' + irma.cliqueDetalhe : '')
          + (prova ? ' · captura ' + prova : ''),
        medido_em: agora(),
        obra: obra.id, kind: obra.kind
      });
      escreverCsv(registos);
      if (feitas % 10 === 0 || estado === 'FALHA') {
        console.log('  obra ' + feitas + ' · ' + slug + ' #' + obra.id + ' · ' + estado
          + ' · capa ' + (capaOk ? 'ok' : 'FALHA') + ' · ' + espia.estado);
      }
    }
  }
}

// ---------------------------------------------------------------- a corrida

async function main() {
  console.log('');
  console.log('teste final · ' + PAGINAS.length + ' pagina(s) · ' + (PARES.length * 2) + ' porta(s) · '
    + PAGINAS.reduce((soma, pagina) => soma + DADOS.get(pagina.slug).artworks.length, 0) + ' obra(s)'
    + (SO ? ' · so ' + SO : '') + (SEM_REDE ? ' · sem rede' : ''));
  console.log('  o CSV: ' + CSV);
  const site = await serveProject();
  const browser = await openBrowser({ camera: false, width: 1280, height: 800 });
  try {
    if (FASE !== 'todas') {
      const anteriores = lerCsv(CSV);
      registos.salas = FASE === 'salas' ? [] : anteriores.salas;
      registos.portas = FASE === 'portas' ? [] : anteriores.portas;
      registos.obras = FASE === 'obras' ? [] : anteriores.obras;
      console.log('  so a fase ' + FASE + ' · o resto vem do CSV (' + registos.salas.length + ' sala(s), '
        + registos.portas.length + ' porta(s), ' + registos.obras.length + ' obra(s))');
    }
    if (FASE === 'todas' || FASE === 'salas') {
      console.log('1/3 · as salas (fundo, consola, capas e o clique em cada obra)');
      await passagemSalas(browser, site);
    }
    if (FASE === 'todas' || FASE === 'portas') {
      console.log('2/3 · as portas (ida e volta)');
      await passagemPortas(browser, site);
    }
    if (FASE === 'todas' || FASE === 'obras') {
      console.log('3/3 · as fichas das obras');
      await passagemObras(browser, site);
    }
  } finally {
    await browser.close();
    site.close();
  }
  const linhas = escreverCsv(registos);
  const conta = (valor) => linhas.filter((linha) => linha.estado === valor).length;
  console.log('');
  console.log('linhas: ' + linhas.length + ' · OK ' + conta('OK') + ' · ATENÇÃO ' + conta('ATENÇÃO')
    + ' · FALHA ' + conta('FALHA') + ' · N/A ' + conta('N/A'));
  for (const linha of linhas.filter((registro) => registro.estado === 'FALHA')) {
    console.log('  FALHA ' + linha.nivel + ' ' + linha.sala + ' ' + linha.item + ' · ' + linha.observacao);
  }
  console.log('');
  console.log('o CSV ficou em ' + CSV);
  process.exit(conta('FALHA') > 0 ? 1 : 0);
}

await main();
