// O piso da ponte: quanto custa mostrar a ponte com o **mesmo** conteúdo que o mundo?
// Numa página já assente, guarda o quadro (o que o portal.js faz ao atravessar) e mostra-o por cima da
// cena que ele próprio fotografou. A diferença entre os dois é o preço do JPEG e do esticar da imagem
// — não tem nada a ver com a geometria do retrato. É o valor abaixo do qual nenhuma costura pode ir.
// Run from the project root: node <this file> [mundo]
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';

import { serveProject, openBrowser, difference, sleep } from './harness.mjs';

const mundo = process.argv[2] || 'cidade';
const ESCALA = 0.5;

const MOSTRAR = `(async () => {
  if (!window.arrivalFrame) return { erro: 'sem arrivalFrame' };
  const ok = window.arrivalFrame.capture();
  const data = sessionStorage.getItem('zonas12.ultimoQuadro');
  if (!data) return { erro: 'nada guardado' };
  const img = document.createElement('img');
  img.className = 'ultimo-quadro';
  img.alt = '';
  img.src = data;
  document.body.appendChild(img);
  await img.decode();
  await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
  const estilo = getComputedStyle(img);
  return {
    guardado: ok,
    bytes: Math.round(data.length * 0.75),
    caixa: img.getBoundingClientRect().width + 'x' + img.getBoundingClientRect().height,
    ajuste: estilo.objectFit,
    opacidade: estilo.opacity,
    natural: img.naturalWidth + 'x' + img.naturalHeight
  };
})()`;

async function main() {
  const site = await serveProject();
  const browser = await openBrowser({ width: 390, height: 844, dpr: 2, mobile: true });
  try {
    await browser.goto(site.base + '/' + mundo + '/?bust=' + Date.now(), 60000);
    await sleep(3500);
    const mundo1 = await browser.screenshot(ESCALA);
    const info = await browser.evaluate(MOSTRAR, 30000);
    console.log('mundo ' + mundo + ': ' + JSON.stringify(info));
    await sleep(400);
    const mundo2 = await browser.screenshot(ESCALA);
    const comPonte = await browser.screenshot(ESCALA);
    console.log('');
    console.log('o mundo consigo próprio (dois fotogramas seguidos): ' + difference(mundo1, mundo2).toFixed(2));
    console.log('a ponte com o mesmo conteúdo (o piso):             ' + difference(mundo1, comPonte).toFixed(2));
    const blocos = mundo1.blocks.map((valor, i) => Math.abs(valor - comPonte.blocks[i]));
    for (let linha = 0; linha < 4; linha++) {
      console.log('   ' + blocos.slice(linha * 4, linha * 4 + 4).map((v) => v.toFixed(1).padStart(7)).join(''));
    }
    writeFileSync(join(process.cwd(), 'piso-mundo.png'), mundo1.bytes);
    writeFileSync(join(process.cwd(), 'piso-ponte.png'), comPonte.bytes);
  } finally {
    await browser.close();
    await site.close();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
