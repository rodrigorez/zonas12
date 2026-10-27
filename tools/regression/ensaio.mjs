// O ensaio A/B do fundo (R14), medido no browser: as duas fases e o bloco único.
//
// Porque existe: fechar o R14 exige comparar o shader com a imagem **no mesmo aparelho e na mesma
// sala**, e a sonda mostra um lado de cada vez. O `?ensaio=1` faz o par sozinho — mede, recarrega com
// `?shader=0`, mede outra vez e mostra um resumo. O que esta bateria garante é o que se pode estragar
// sem ninguém notar: que a segunda fase **chega a acontecer** (a recarga não se perde), que o resumo
// traz os **dois** lados, e que no fim a sessão fica limpa (uma recarga faz um ensaio novo em vez de
// repetir metade do anterior).
//
// Uso, da raiz do projeto:
//
//   node tools/regression/ensaio.mjs
//
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

// Curto de propósito: o ensaio de campo leva 55 s por fase, mas o que aqui se mede é o *protocolo*
// (medir, recarregar, medir, resumir), não a qualidade do número.
const SEGUNDOS = 3;
const AQUECIMENTO = 1;

const espera = async (browser, expression, tries = 400) => {
  for (let i = 0; i < tries; i++) {
    const ok = await browser.evaluate(expression).catch(() => false);
    if (ok) return true;
    await sleep(150);
  }
  return false;
};

async function main() {
  const result = checks();
  const site = await serveProject();
  const browser = await openBrowser({ width: 1200, height: 800 });
  const url = site.base + '/scene1/?ensaio=1&segundos=' + SEGUNDOS + '&aquecimento=' + AQUECIMENTO + '&bust=' + Date.now();
  try {
    await browser.goto(url, 60000);

    // 1. A primeira fase arranca sozinha e diz o que está a fazer — quem espera 55 s precisa de saber
    //    que a página não encravou.
    const arrancou = await espera(browser, `(() => {
      const curto = document.getElementById('ensaio-resumo');
      return Boolean(curto && /fase 1\\/2 \\(shader\\)/.test(curto.textContent));
    })()`);
    result.check('a fase 1 começa sozinha e anuncia-se (fase 1/2, shader)', arrancou);

    // 1b. O contador **é** o relógio da fase: diz quanto falta (aquecimento + medida) e desce sozinho.
    //     Antes era um laço de `setTimeout(1000)` a par da medida, e por isso podia anunciar uma coisa e
    //     medir outra.
    const relogio = async () => browser.evaluate(`(() => {
      const texto = (document.getElementById('ensaio-resumo') || {}).textContent || '';
      const achado = /· (\\d+) s$/.exec(texto.trim());
      return { texto: texto, segundos: achado ? Number(achado[1]) : null };
    })()`);
    const antes = await relogio();
    await sleep(1600);
    const depois = await relogio();
    result.check('o contador diz o que falta (4 s = 1 de aquecimento + 3 de medida) e desce com o relógio',
      Number.isFinite(antes.segundos) && antes.segundos >= 3 && antes.segundos <= 4 &&
        Number.isFinite(depois.segundos) && depois.segundos < antes.segundos,
      antes.segundos + ' s → ' + depois.segundos + ' s · ' + depois.texto);

    // 2. A primeira fase mede o shader e guarda-o antes de recarregar.
    const primeira = await espera(browser, `(() => {
      try {
        const raw = sessionStorage.getItem('zonas12.ensaio');
        return Boolean(raw && JSON.parse(raw).first);
      } catch (error) { return false; }
    })()`, 600);
    const guardado = await browser.evaluate(`(() => {
      try { return JSON.parse(sessionStorage.getItem('zonas12.ensaio')); } catch (error) { return null; }
    })()`);
    result.check('a fase 1 mede o shader e guarda o resultado na sessão', primeira,
      JSON.stringify(guardado));
    result.check('a medição tem quadros por segundo e o fundo que estava a desenhar',
      Boolean(guardado && guardado.first) &&
        typeof guardado.first.fps === 'number' && guardado.first.fps > 0 &&
        guardado.first.background === 'shader',
      JSON.stringify(guardado && guardado.first ? { fps: guardado.first.fps, fundo: guardado.first.background } : null));

    // 3. A recarga leva o `?shader=0` com ela: é o que faz da segunda fase uma medição da imagem.
    const naSegunda = await espera(browser, `Boolean(location.search.indexOf('fase=imagem') >= 0 &&
      location.search.indexOf('shader=0') >= 0 && document.getElementById('ensaio-resumo'))`, 600);
    result.check('a página recarrega em `fase=imagem&shader=0` (o outro lado do A/B)', naSegunda,
      await browser.evaluate('location.search').catch(() => '?'));

    // 4. A segunda fase mede e o resumo traz os dois lados, com a comparação dos quadros.
    const resumiu = await espera(browser, `(() => {
      const texto = document.getElementById('ensaio-texto');
      return Boolean(texto && /fase 2 · imagem/.test(texto.textContent) && /comparação/.test(texto.textContent));
    })()`, 900);
    const resumo = await browser.evaluate(`(() => {
      const texto = document.getElementById('ensaio-texto');
      const curto = document.getElementById('ensaio-resumo');
      return {
        texto: texto ? texto.textContent : '',
        curto: curto ? curto.textContent : '',
        copiar: Boolean(document.getElementById('ensaio-copiar')),
        repetir: Boolean(document.getElementById('ensaio-repetir')),
        busca: location.search
      };
    })()`);
    result.check('o resumo junta as duas fases e compara os quadros', resumiu, resumo.curto);
    result.check('cada fase traz fundo, quadros, pior quadro e pixelRatio',
      /fase 1 · shader[\s\S]*fundo\s+shader[\s\S]*quadros\s+[0-9.]+\/s[\s\S]*pior quadro[\s\S]*pixelRatio/.test(resumo.texto) &&
        /fase 2 · imagem[\s\S]*fundo\s+image[\s\S]*quadros\s+[0-9.]+\/s[\s\S]*pior quadro/.test(resumo.texto),
      resumo.texto.split('\n').slice(8).join(' | '));
    result.check('a comparação dá o pior quadro dos dois lados (é o que distingue quando o vsync esconde)',
      /comparação[\s\S]*pior quadro\s+[0-9.]+ ms → [0-9.]+ ms/.test(resumo.texto),
      resumo.texto.split('\n').slice(-4).join(' | '));
    result.check('o resumo tem GPU e ecrã (é o que distingue os três aparelhos do R14)',
      /gpu\s+\S/.test(resumo.texto) && /ecrã\s+\d+×\d+ · dpr/.test(resumo.texto),
      resumo.texto.split('\n').filter((item) => /gpu|ecrã/.test(item)).join(' | '));
    result.check('há um botão que copia o bloco inteiro e outro que repete o ensaio',
      resumo.copiar && resumo.repetir);

    // 4b. As duas janelas foram mesmo as pedidas, e o relatório di-lo com o desvio. É a garantia que o
    //     autor pediu: o resultado vale o tempo que diz valer. A tolerância é a do relógio que fecha a
    //     fase (o intervalo de 100 ms) mais uma folga para o `setInterval` atrasado numa máquina cheia.
    const janelas = [...resumo.texto.matchAll(/janela\s+([0-9.]+) s \(desvio ([+-]?[0-9.]+) s/g)]
      .map((achado) => ({ janela: Number(achado[1]), desvio: Number(achado[2]) }));
    result.check('cada fase mede a janela pedida (3 s) e o relatório mostra o desvio',
      janelas.length === 2 &&
        janelas.every((item) => Math.abs(item.janela - SEGUNDOS) <= 0.35) &&
        janelas.every((item) => Math.abs(item.desvio) <= 0.35),
      JSON.stringify(janelas));
    result.check('a comparação mostra as duas janelas lado a lado (um par só vale com o mesmo tempo)',
      /janelas\s+[0-9.]+ s e [0-9.]+ s/.test(resumo.texto) && !/o par não é comparável/.test(resumo.texto),
      (resumo.texto.split('\n').filter((item) => item.indexOf('janelas') >= 0) || [''])[0]);

    // 5. No fim, a sessão está limpa e o endereço volta ao princípio: uma recarga faz um ensaio novo.
    const limpo = await browser.evaluate(`(() => ({
      guardado: sessionStorage.getItem('zonas12.ensaio'),
      busca: location.search
    }))()`);
    result.check('a sessão fica limpa (uma recarga não repete metade do ensaio)', limpo.guardado === null,
      String(limpo.guardado));
    result.check('o endereço volta a `?ensaio=1`, sem `fase` nem `shader`',
      limpo.busca.indexOf('ensaio=1') >= 0 && limpo.busca.indexOf('fase=') < 0 && limpo.busca.indexOf('shader=') < 0,
      limpo.busca);

    // 6. Sem o parâmetro não há painel nenhum: a ferramenta não aparece ao visitante.
    await browser.goto(site.base + '/scene1/?bust=' + Date.now(), 60000);
    await espera(browser, 'Boolean(window.portalDebug && document.querySelector("a-scene"))');
    const semParametro = await browser.evaluate(`Boolean(document.getElementById('ensaio'))`);
    result.check('sem `?ensaio=1` não existe painel', semParametro === false, String(semParametro));

    // 7. O endereço **como está no guia** — `?ensaio=1` e mais nada — tem de anunciar as durações por
    //    omissão (55 s = 10 de aquecimento + 45 de medida) e não zero. Foi este o defeito que o autor
    //    encontrou: `Number(null)` é **0**, por isso um parâmetro ausente lia-se como «mede 0 s» e o
    //    relatório saía com `null/s` e `NaN/s`. As verificações acima passavam porque traziam sempre as
    //    durações escritas — a bateria tinha de exercitar o caminho que o guia manda seguir.
    await browser.goto(site.base + '/scene1/?ensaio=1&bust=' + Date.now(), 60000);
    const anunciado = await espera(browser, `(() => {
      const curto = document.getElementById('ensaio-resumo');
      return Boolean(curto && /fase 1\\/2 \\(shader\\)/.test(curto.textContent));
    })()`);
    const texto = await browser.evaluate('(document.getElementById("ensaio-resumo") || {}).textContent || ""');
    const segundos = Number((/· (\d+) s/.exec(texto) || [])[1]);
    result.check('`?ensaio=1` sozinho anuncia a janela por omissão (55 s), não zero',
      anunciado && Number.isFinite(segundos) && segundos >= 50, texto);

    // 8. E o mesmo com os parâmetros presentes mas vazios (`&segundos=&aquecimento=`), que é o que sai de
    //    um endereço editado à mão.
    await browser.goto(site.base + '/scene1/?ensaio=1&segundos=&aquecimento=&bust=' + Date.now(), 60000);
    const vazio = await espera(browser, `(() => {
      const curto = document.getElementById('ensaio-resumo');
      return Boolean(curto && /· (\\d+) s/.test(curto.textContent || ''));
    })()`);
    const textoVazio = await browser.evaluate('(document.getElementById("ensaio-resumo") || {}).textContent || ""');
    const segundosVazio = Number((/· (\d+) s/.exec(textoVazio) || [])[1]);
    result.check('com `&segundos=&aquecimento=` vazios volta à janela por omissão (não a 0 s)',
      vazio && Number.isFinite(segundosVazio) && segundosVazio >= 50, textoVazio);

    // 9. Uma aba escondida **pausa** a fase, e o tempo escondido vai declarado. Sem isto, um visitante que
    //    trocasse de aba a meio media 3 s de shader e 40 de imagem — com o `requestAnimationFrame` parado,
    //    o segundo lado sairia com poucos quadros e o A/B diria uma mentira com números a favor.
    await browser.goto(site.base + '/scene1/?ensaio=1&segundos=3&aquecimento=1&bust=' + Date.now(), 60000);
    await espera(browser, `(() => {
      const curto = document.getElementById('ensaio-resumo');
      return Boolean(curto && /fase 1\\/2 \\(shader\\)/.test(curto.textContent));
    })()`);
    await sleep(800);
    const esconder = await browser.evaluate(`(() => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
      const texto = (document.getElementById('ensaio-resumo') || {}).textContent || '';
      return (/· (\\d+) s$/.exec(texto.trim()) || [])[1] || null;
    })()`);
    await sleep(2000);
    const durante = await browser.evaluate(`(() => {
      const texto = (document.getElementById('ensaio-resumo') || {}).textContent || '';
      return { segundos: (/· (\\d+) s$/.exec(texto.trim()) || [])[1] || null, texto: texto };
    })()`);
    result.check('com a aba escondida o relógio pára (o contador não desce)',
      esconder !== null && String(durante.segundos) === String(esconder),
      esconder + ' s → ' + durante.segundos + ' s');
    await browser.evaluate(`(() => {
      delete document.visibilityState;
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
      return true;
    })()`);
    const voltou = await espera(browser, `(() => {
      const texto = document.getElementById('ensaio-texto');
      return Boolean(texto && texto.textContent.indexOf('comparação') >= 0);
    })()`, 600);
    const comPausa = await browser.evaluate('(document.getElementById("ensaio-texto") || {}).textContent || ""');
    const janelaComPausa = (/fase 1 · shader[\s\S]*?janela\s+([0-9.]+) s \(desvio ([+-]?[0-9.]+) s · pausada ([0-9.]+) s\)/
      .exec(comPausa) || []);
    result.check('a pausa é declarada e a janela continua a ser a pedida (3 s)',
      voltou && janelaComPausa.length === 4 &&
        Math.abs(Number(janelaComPausa[1]) - SEGUNDOS) <= 0.5 &&
        Number(janelaComPausa[3]) >= 1.5,
      janelaComPausa.length === 4
        ? 'janela ' + janelaComPausa[1] + ' s · pausada ' + janelaComPausa[3] + ' s'
        : (comPausa.split('\n').filter((item) => item.indexOf('janela') >= 0).join(' | ') || '(sem relatório)'));
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('o ensaio A/B do fundo numa página (R14)');
  process.exit(result.list.some((item) => !item.ok) ? 1 : 0);
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
