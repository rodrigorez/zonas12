// As duas línguas dizem o mesmo (meta M2 da Fase 7, bloco B2).
//
// Porque existe: `?lang=en` caía no português porque `i18n/en.json` não existia, e a documentação
// prometia duas línguas. Um catálogo traduzido à mão envelhece mal — a chave nova entra no `pt.json`
// e não no `en.json`, e o defeito só aparece a quem abrir a exposição em inglês. Este instrumento
// compara os dois ficheiros e abre as duas páginas em inglês, para que a falta apareça aqui.
//
//   1. as chaves são as mesmas, pela mesma ordem, e nenhum valor está vazio;
//   2. os marcadores `{nome}` de cada chave são os mesmos nas duas línguas (uma tradução que perca um
//      marcador mostra a frase com o número em falta e ninguém dá por isso);
//   3. `?lang=en` na exposição: a página diz que é inglesa, mostra inglês e não avisa de chave nenhuma;
//   4. `?lang=en` no editor: idem, e os painéis abrem sem avisos do catálogo.
//
// Uso, da raiz do projeto:
//
//   node tools/regression/i18n.mjs
//
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, serveProject, openBrowser, checks, sleep } from './harness.mjs';

const ORIGEM = 'pt';
const OUTRA = 'en';

const catalogo = (lingua) =>
  JSON.parse(readFileSync(join(ROOT, 'i18n', lingua + '.json'), 'utf8')).strings;

const marcadores = (texto) => (String(texto).match(/\{\w+\}/g) || []).sort().join(',');

async function main() {
  const result = checks();
  const pt = catalogo(ORIGEM);
  const en = catalogo(OUTRA);
  const chavesPt = Object.keys(pt);
  const chavesEn = Object.keys(en);

  checkKeys(result, pt, en, chavesPt, chavesEn);

  const site = await serveProject();
  const browser = await openBrowser({ width: 1280, height: 860 });
  try {
    await expositionInEnglish(result, browser, site);
    await editorInEnglish(result, browser, site);
  } finally {
    await browser.close();
    await site.close();
  }

  result.report('i18n: as duas línguas (B2)');
  process.exit(result.list.some((item) => !item.ok) ? 1 : 0);
}

function checkKeys(result, pt, en, chavesPt, chavesEn) {
  const faltam = chavesPt.filter((key) => !(key in en));
  const sobram = chavesEn.filter((key) => !(key in pt));
  result.check(OUTRA + '.json tem exactamente as chaves de ' + ORIGEM + '.json',
    faltam.length === 0 && sobram.length === 0,
    'faltam ' + faltam.length + (faltam.length ? ': ' + faltam.slice(0, 4).join(', ') : '') +
      ' · sobram ' + sobram.length + (sobram.length ? ': ' + sobram.slice(0, 4).join(', ') : ''));

  const vazias = chavesPt.filter((key) => typeof en[key] !== 'string' || en[key].trim() === '');
  result.check('nenhuma tradução está vazia', vazias.length === 0, vazias.slice(0, 4).join(', '));

  const marcadoresErrados = chavesPt.filter((key) =>
    key in en && marcadores(pt[key]) !== marcadores(en[key]));
  result.check('os marcadores {nome} de cada chave são os mesmos nas duas línguas',
    marcadoresErrados.length === 0, marcadoresErrados.slice(0, 4).join(', '));

  // Uma tradução que deixe uma frase em português é a mesma falta, mais difícil de ver. Não se exige
  // que todas as frases mudem (há chaves que são só formato: «#{id} · {asset} · {interaction}»), mas
  // as que mudam de língua natural mudam de palavras.
  const formato = /^[#{}\w.·→−\s()-]+$/;
  const iguais = chavesPt.filter((key) => key in en && pt[key] === en[key] && !formato.test(pt[key]));
  result.check('as frases traduzidas não ficaram iguais às portuguesas',
    iguais.length === 0, iguais.slice(0, 4).join(', '));
}

async function expositionInEnglish(result, browser, site) {
  const url = site.base + '/?lang=' + OUTRA + '&bust=' + Date.now();
  const ruido = browser.console.length;
  await browser.goto(url, 60000);
  await sleep(2500);

  const estado = await browser.evaluate(`(() => {
    const titulo = document.querySelector('title');
    const botao = document.getElementById('btn-iniciar') || document.querySelector('[data-i18n="app.start"]');
    return {
      lingua: document.documentElement.lang,
      titulo: titulo ? titulo.textContent : null,
      botao: botao ? botao.textContent.trim() : null
    };
  })()`);
  result.check('?lang=' + OUTRA + ' faz a página dizer que é inglesa',
    estado.lingua === OUTRA, JSON.stringify(estado));
  result.check('e o texto do botão vem do catálogo inglês',
    typeof estado.botao === 'string' && /ACTIVATE EXHIBITION/.test(estado.botao), estado.botao);
  const i18nRuido = browser.console.slice(ruido).filter((line) => /\[i18n\]/.test(line));
  result.check('sem avisos do catálogo na exposição', i18nRuido.length === 0, i18nRuido.join(' | '));
}

async function editorInEnglish(result, browser, site) {
  const url = site.base + '/editor.html?lang=' + OUTRA + '&world=gate&bust=' + Date.now();
  const ruido = browser.console.length;
  await browser.goto(url, 60000);
  await sleep(4000);

  const estado = await browser.evaluate(`(() => {
    const paineis = Array.from(document.querySelectorAll('[data-i18n]'))
      .map((element) => element.textContent.trim()).filter(Boolean);
    return {
      lingua: document.documentElement.lang,
      titulo: (document.title || '').trim(),
      paineis: paineis.slice(0, 6)
    };
  })()`).catch((error) => ({ erro: error.message }));
  result.check('o editor em ' + OUTRA + ' também é inglês',
    estado.lingua === OUTRA,
    JSON.stringify(estado).slice(0, 200));
  const i18nRuido = browser.console.slice(ruido).filter((line) => /\[i18n\]/.test(line));
  result.check('sem avisos do catálogo no editor', i18nRuido.length === 0, i18nRuido.join(' | '));
}

main().catch((error) => { console.error('harness failed:', error.message); process.exit(1); });
