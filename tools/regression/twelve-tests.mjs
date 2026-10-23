// A bateria dos doze testes (§10 do roadmap) nas cinco páginas, como bateria de linha de comando.
//
// Porque existe: `tools/regression/acceptance.mjs` é a **sonda** — vive dentro da página e exporta
// `runAcceptance()`, `walkDoor(id)` e `checkWindow(id)`. Sem um runner, os doze testes só se mediam
// a partir de um script de sessão, e a aceitação da Fase 4 deixava de ser reproduzível por quem
// chegasse depois. Este ficheiro é esse runner: levanta o servidor, abre o Chrome, entra em cada
// página e imprime o resultado de cada teste.
//
// O que se verifica, e não só se imprime: `T4` passa, `T5` não deixa nada da moldura de trás dentro
// da janela da frente e tem controlo positivo (sem isso um zero não prova nada), `T6` abre o modal
// onde há obras, `T9` devolve o registo ao que era em 20 ciclos, `T10/T12` não muda **nenhum** pixel
// fora da moldura e `T2/T3` não corta o bordo em 84 poses. O `T8` (a consola) mede-se de fora, com o
// que a página disse enquanto carregava.
//
// O fixture (`example`) já deu uma fuga de 3 759 px fora da moldura no `T10/T12` (porta 1 a 30 m, em
// duas corridas de 2026-10-22) e voltou a dar **16 px** noutra (porta 1 a 12 m, 2026-10-23) — não é
// um defeito estável, é uma medida que sangra quando uma textura ainda está a assentar entre as duas
// capturas; fica registado como **R16** na §14 do roadmap.
//
// Por isso a verificação não é «exactamente zero»: um fio de antialiasing no bordo da moldura dá
// dezenas de píxeis, e exigi-lo tornava a bateria intermitente — que é o pior que uma bateria pode
// ser. O limite é uma **fracção da área da moldura**: até **0,1%** passa e é impresso com o número,
// acima disso falha. Medido: o fio de bordo dá **16 a 23 px** (0,02% da moldura, e aparece também nas
// salas), e o caso dos 3 759 px era **12,6%** — a régua separa os dois com folga de 5× para baixo e
// 126× para cima.
//
// Uso, da raiz do projeto: node tools/regression/twelve-tests.mjs [slug[:from] ...]
// Sem argumentos mede as cinco páginas: o portão, as três salas e o fixture.
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

const PAGINAS = [
  { slug: 'gate', from: null },
  { slug: 'cidade', from: 'gate' },
  { slug: 'praia', from: 'cidade' },
  { slug: 'ceu', from: 'praia' },
  { slug: 'example', from: null }
];

// Quanto da moldura pode mudar sem ser uma fuga (ver o cabeçalho: 0,02% é ruído de bordo, 12,6% é fuga).
const FIO_DE_BORDO = 0.001;

const url = (site, pagina) =>
  site.base + '/?' + ['scene=' + pagina.slug, pagina.from ? 'from=' + pagina.from : null,
    'bust=' + Date.now() + '-' + Math.random()].filter(Boolean).join('&');

const PRONTO = `Boolean(window.portalDebug && window.portalDebug.world && window.portalDebug.state &&
  window.portalDebug.state.portals && document.querySelector('a-scene') &&
  document.querySelector('a-scene').renderer)`;

async function medirPagina(browser, site, pagina) {
  const endereco = new URL('tools/regression/acceptance.mjs', site.base + '/').href;
  const antes = browser.console.length;
  await browser.page.send('Page.navigate', { url: url(site, pagina) });
  for (let i = 0; i < 300; i++) {
    if (await browser.evaluate(PRONTO).catch(() => false)) break;
    await sleep(200);
  }
  await sleep(2500);
  const report = await browser.evaluate(
    `(async () => (await import(${JSON.stringify(endereco)})).runAcceptance())()`, 600000);
  const ruido = browser.console.slice(antes);
  return { report, ruido };
}

function verificar(result, pagina, report, ruido) {
  const testes = report.testes || {};
  const nome = pagina.slug + (pagina.from ? ' (de ' + pagina.from + ')' : '');

  result.check(nome + ' · T8: a consola não diz nada', ruido.length === 0,
    ruido.length ? ruido.slice(0, 3).join(' | ') : '0 erro(s)/aviso(s)');

  const t4 = testes.T4 || {};
  result.check(nome + ' · T4: a janela desenha o destino dentro e mais nada fora',
    t4.passou === true, 'porta=' + t4.porta + ', alfaFora=' + t4.alfaFora);

  const t5 = testes.T5 || {};
  const controlo = t5.molduraDeTrasForaDaJanela > 0 || t5.pixelsForaDaJanela > 0;
  result.check(nome + ' · T5: nada da moldura de trás dentro da frente, e um controlo positivo',
    t5.passou === true && t5.dentroDaJanelaDaFrente === 0 && t5.ruidoNoMesmoDesenho === 0 && controlo,
    'dentro=' + t5.dentroDaJanelaDaFrente + ', controlo=' + t5.molduraDeTrasForaDaJanela +
    ', ruido=' + t5.ruidoNoMesmoDesenho);

  const t6 = testes.T6 || {};
  result.check(nome + ' · T6: o clique na obra abre o modal (ou não há obras aqui)',
    t6.passou === true || t6.aplicavel === false,
    t6.aplicavel === false ? 'não aplicável: ' + t6.porque : 'src=' + t6.src);

  const t9 = testes.T9 || {};
  const igual = t9.antes && t9.depois &&
    t9.antes.portas === t9.depois.portas &&
    t9.antes.nosNaArvore === t9.depois.nosNaArvore &&
    t9.depois.ouvintesDeTecladoNoDocumento === 0 &&
    t9.depois.ouvintesVivosNoDocumento === 0;
  result.check(nome + ' · T9: 20 ciclos devolvem o registo e a árvore ao que eram',
    igual === true, t9.antes ? 'portas ' + t9.antes.portas + '→' + t9.depois.portas +
      ', nós ' + t9.antes.nosNaArvore + '→' + t9.depois.nosNaArvore : 'sem resultado');

  const t10 = testes.T10_T12 || {};
  const entradas = Object.values(t10);
  const areaDaMoldura = (entrada) => {
    const m = entrada.moldura || [0, 0, 0, 0];
    return Math.abs((m[2] - m[0]) * (m[3] - m[1])) || 1;
  };
  const foraDaMoldura = entradas.filter((entrada) =>
    entrada.mudadosForaDaMoldura / areaDaMoldura(entrada) > FIO_DE_BORDO);
  const fio = entradas.filter((entrada) =>
    entrada.mudadosForaDaMoldura > 0 && entrada.mudadosForaDaMoldura / areaDaMoldura(entrada) <= FIO_DE_BORDO);
  const dentro = entradas.every((entrada) => entrada.mudadosDentroDaJanela > 0);
  result.check(nome + ' · T10/T12: a dimensão derivada muda pixels dentro da janela e nenhum fora',
    entradas.length > 0 && dentro && foraDaMoldura.length === 0,
    entradas.length + ' medição(ões), ' + (foraDaMoldura.length
      ? 'fora da moldura: ' + foraDaMoldura.map((entrada) =>
        'porta ' + entrada.porta + ' a ' + entrada.distancia + ' m → ' +
        entrada.mudadosForaDaMoldura + ' px (' +
        (100 * entrada.mudadosForaDaMoldura / areaDaMoldura(entrada)).toFixed(2) + '%)').join('; ')
      : '0 px fora da moldura') +
    (fio.length ? ' — fio de bordo tolerado: ' + fio.map((entrada) =>
      entrada.mudadosForaDaMoldura + ' px a ' + entrada.distancia + ' m').join(', ') : ''));

  const t2 = testes.T2_T3 || {};
  const veredicto = t2.veredicto || {};
  result.check(nome + ' · T2/T3: nenhuma pose com o bordo cortado, e o método é válido',
    t2.passou === true && veredicto.T2 === 'pass' && veredicto.T3 === 'pass' &&
    (t2.poses || {}).withCutBorder === 0 && (t2.controlos || {}).failed === 0,
    t2.poses ? t2.poses.assessed + ' poses, ' + t2.poses.withCutBorder + ' cortadas, ' +
      (t2.amostras || {}).failed + ' falhas em ' + (t2.amostras || {}).assessed + ' amostras' : 'sem resultado');
}

async function main() {
  const escolhidas = process.argv.slice(2).map((argumento) => {
    const [slug, from] = argumento.split(':');
    return { slug, from: from || null };
  });
  const paginas = escolhidas.length ? escolhidas : PAGINAS;
  const site = await serveProject();
  const browser = await openBrowser({ width: 1400, height: 900, camera: true });
  const result = checks();
  try {
    for (const pagina of paginas) {
      const { report, ruido } = await medirPagina(browser, site, pagina);
      verificar(result, pagina, report, ruido);
    }
  } finally {
    await browser.close();
    await site.close();
  }
  const falhadas = result.list.filter((item) => !item.ok);
  result.report('T1–T12 (a aceitação)');
  if (falhadas.length) process.exit(1);
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
