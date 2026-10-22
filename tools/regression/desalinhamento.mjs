// A ponte e a chegada estão alinhadas? Procura o deslocamento (dx, dy) que melhor sobrepõe as duas
// imagens da costura. Se houver um deslocamento que baixe muito a diferença, o que falta não é
// conteúdo: é alinhamento — e então sabe-se em que eixo e quanto.
// Run from the project root: node <this file> [ponte.jpg] [chegada.png]
import { serveProject, openBrowser, difference, sleep } from './harness.mjs';

const A = process.argv[2] || 'costura-ponte.jpg';
const B = process.argv[3] || 'costura-chegada.png';

const PROCURAR = (a, b) => `(async () => {
  const carregar = (src) => new Promise((done, fail) => {
    const img = new Image();
    img.onload = () => done(img);
    img.onerror = fail;
    img.src = src;
  });
  const W = 195;
  const H = 422;
  const ler = (img) => {
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const ctx = c.getContext('2d');
    ctx.drawImage(img, 0, 0, W, H);
    const p = ctx.getImageData(0, 0, W, H).data;
    const luma = new Float32Array(W * H);
    for (let i = 0; i < W * H; i++) {
      luma[i] = 0.299 * p[i * 4] + 0.587 * p[i * 4 + 1] + 0.114 * p[i * 4 + 2];
    }
    return luma;
  };
  const ia = await carregar('${a}');
  const ib = await carregar('${b}');
  const la = ler(ia);
  const lb = ler(ib);

  // Só o miolo conta: nas bordas um deslocamento traria pixels que não existem.
  const margem = 12;
  const erro = (dx, dy) => {
    let soma = 0, n = 0;
    for (let y = margem; y < H - margem; y++) {
      for (let x = margem; x < W - margem; x++) {
        soma += Math.abs(la[y * W + x] - lb[(y - dy) * W + (x - dx)]);
        n++;
      }
    }
    return soma / n;
  };

  let melhor = { dx: 0, dy: 0, erro: erro(0, 0) };
  for (let dy = -8; dy <= 8; dy++) {
    for (let dx = -8; dx <= 8; dx++) {
      const e = erro(dx, dy);
      if (e < melhor.erro) melhor = { dx: dx, dy: dy, erro: e };
    }
  }
  const semDeslocar = erro(0, 0);
  // A assinatura 4x4 da ponte deslocada, para comparar com a régua do seam.mjs.
  const blocosDeslocados = () => {
    const blocos = [];
    for (let by = 0; by < 4; by++) {
      for (let bx = 0; bx < 4; bx++) {
        let soma = 0, n = 0;
        const x0 = Math.floor(bx * W / 4), x1 = Math.floor((bx + 1) * W / 4);
        const y0 = Math.floor(by * H / 4), y1 = Math.floor((by + 1) * H / 4);
        for (let y = Math.max(y0, margem); y < Math.min(y1, H - margem); y++) {
          for (let x = Math.max(x0, margem); x < Math.min(x1, W - margem); x++) {
            soma += la[(y - melhor.dy) * W + (x - melhor.dx)];
            n++;
          }
        }
        blocos.push(soma / n);
      }
    }
    return blocos;
  };
  const blocosB = () => {
    const blocos = [];
    for (let by = 0; by < 4; by++) {
      for (let bx = 0; bx < 4; bx++) {
        let soma = 0, n = 0;
        const x0 = Math.floor(bx * W / 4), x1 = Math.floor((bx + 1) * W / 4);
        const y0 = Math.floor(by * H / 4), y1 = Math.floor((by + 1) * H / 4);
        for (let y = Math.max(y0, margem); y < Math.min(y1, H - margem); y++) {
          for (let x = Math.max(x0, margem); x < Math.min(x1, W - margem); x++) {
            soma += lb[y * W + x];
            n++;
          }
        }
        blocos.push(soma / n);
      }
    }
    return blocos;
  };
  return {
    semDeslocar: semDeslocar,
    melhor: melhor,
    blocosDeslocados: blocosDeslocados(),
    blocosChegada: blocosB()
  };
})()`;

async function main() {
  const site = await serveProject();
  const browser = await openBrowser({ width: 640, height: 360, camera: false });
  try {
    await browser.goto(site.base + '/?' + Date.now(), 60000);
    await sleep(1200);
    const r = await browser.evaluate(PROCURAR(A, B), 180000);
    console.log('ponte ' + A + ' / chegada ' + B);
    console.log('');
    console.log('diferença de luma sem deslocar          ' + r.semDeslocar.toFixed(2));
    console.log('melhor deslocamento                     dx=' + r.melhor.dx + ' dy=' + r.melhor.dy +
      ' (média ' + r.melhor.erro.toFixed(2) + ')');
    console.log('  em píxeis do ecrã (imagem a meia largura) dx=' + r.melhor.dx + ' dy=' + r.melhor.dy);
    const salto = difference({ blocks: r.blocosDeslocados }, { blocks: r.blocosChegada });
    console.log('salto da assinatura depois de deslocar  ' + salto.toFixed(2));
  } finally {
    await browser.close();
    await site.close();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
