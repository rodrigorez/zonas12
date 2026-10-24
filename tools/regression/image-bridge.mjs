// A bateria da travessia entre mundos: a ponte de imagem (D43), o corte sem desvanecimento e sem a
// linha «Carregando…» (D44), e a espera pelo primeiro fotograma da câmara (D45).
//
// O que mede, num Chrome com câmara falsa e um ecrã de telemóvel, a atravessar uma porta a pé:
//   1. o quadro guardado é a imagem que se estava a ver (não um retângulo preto);
//   2. a travessia não tem nenhum fotograma escuro (antes da ponte tinha dois);
//   3. chega ao outro mundo;
//   4. a ponte está na página no primeiro fotograma (antes da 1.ª pintura);
//   5. a ponte sai de uma vez, sem desvanecimento — sempre a opacidade 1 até desaparecer;
//   6. a linha «Carregando…» não aparece quando há ponte a cobrir o ecrã;
//   7. a ponte só sai depois de a câmara ter apresentado um fotograma;
//   8. recarregar a seguir não repete a imagem (a chave é de uso único);
//   9. sem cena (a construção falha), a ponte sai na mesma ao fim da guarda de 10 s.
//
// Uso, da raiz do projeto: node tools/regression/image-bridge.mjs
import { serveProject, openBrowser, checks, sleep } from './harness.mjs';

const PORTA = 4;          // a porta da praia que vai para a cidade (navigate)
const LARGURA = 390;
const ALTURA = 844;

// O que a página que chega regista: se a ponte está lá antes do primeiro fotograma, quando sai, se
// aparece a linha «Carregando…» e quando o vídeo da câmara dá imagem.
const SONDA = `
  window.__trace = [];
  const mark = (name) => window.__trace.push({ t: Math.round(performance.now() * 10) / 10, name: name });
  let frames = 0;
  const tick = () => {
    frames++;
    if (frames === 1) mark('frame 1 ponte=' + Boolean(document.querySelector('.ultimo-quadro')));
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  const getItemOriginal = Storage.prototype.getItem;
  Storage.prototype.getItem = function (key) {
    const value = getItemOriginal.call(this, key);
    if (key === 'zonas12.ultimoQuadro' && value) window.__quadroDaPonte = value;
    return value;
  };
  const watch = setInterval(() => {
    const image = document.querySelector('.ultimo-quadro');
    if (image && !window.__posted) { window.__posted = true; mark('ponte posta opacidade=' + getComputedStyle(image).opacity); }
    if (image && window.__posted === true && Number(getComputedStyle(image).opacity) < 1) { window.__posted = 'a-desvanecer'; mark('ponte a desvanecer'); }
    if (!image && (window.__posted === true || window.__posted === 'a-desvanecer')) { window.__posted = 'fora'; mark('ponte retirada'); }
    const overlay = document.getElementById('loading-overlay');
    if (overlay && getComputedStyle(overlay).display !== 'none' && !window.__overlay) { window.__overlay = true; mark('linha Carregando visível'); }
    const video = document.getElementById('webcam-video');
    if (video && !window.__video) {
      window.__video = true;
      ['playing'].forEach((event) => video.addEventListener(event, () => mark('video ' + event)));
      if (typeof video.requestVideoFrameCallback === 'function') {
        video.requestVideoFrameCallback(() => mark('video frame apresentado'));
      }
    }
  }, 10);
`;

// A assinatura do quadro guardado, medida na página que chega (é lá que ele está).
const ASSINATURA = `
  (async () => {
    const dados = window.__quadroDaPonte;
    if (!dados) return null;
    const image = new Image();
    await new Promise((done, fail) => { image.onload = done; image.onerror = fail; image.src = dados; });
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = Math.round(160 * image.naturalHeight / image.naturalWidth);
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const blocks = [];
    let sum = 0;
    for (let by = 0; by < 4; by++) {
      for (let bx = 0; bx < 4; bx++) {
        let blockSum = 0;
        let count = 0;
        const x0 = Math.floor(bx * canvas.width / 4);
        const x1 = Math.floor((bx + 1) * canvas.width / 4);
        const y0 = Math.floor(by * canvas.height / 4);
        const y1 = Math.floor((by + 1) * canvas.height / 4);
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const at = (y * canvas.width + x) * 4;
            blockSum += 0.299 * pixels[at] + 0.587 * pixels[at + 1] + 0.114 * pixels[at + 2];
            count++;
          }
        }
        blocks.push(blockSum / count);
      }
    }
    for (let i = 0; i < pixels.length; i += 4) {
      sum += 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
    }
    return {
      kilobytes: Math.round(dados.length / 1024),
      tamanho: image.naturalWidth + 'x' + image.naturalHeight,
      mean: sum / (pixels.length / 4),
      blocks: blocks
    };
  })()
`;

// A porta atravessa-se a pé, e a olhar para ela: é assim que um visitante a atravessa, e é o que faz a
// janela encher o ecrã quando ele chega ao plano.
const atravessar = (portalId) => `(async () => {
  const sceneEl = document.querySelector('a-scene');
  const cameraEl = sceneEl.querySelector('a-camera');
  const porta = window.portalDebug.state.portals.find((p) => p.data.id === ${portalId});
  if (!porta) { console.error('a porta ${portalId} não está nesta página'); return; }
  const centro = new THREE.Vector3();
  porta.el.object3D.getWorldPosition(centro);
  const direcao = new THREE.Vector3(0, 0, 1)
    .applyQuaternion(porta.el.object3D.getWorldQuaternion(new THREE.Quaternion()));
  const olhar = Math.atan2(direcao.x, direcao.z);
  const inicio = centro.clone().addScaledVector(direcao, -6);
  const fim = centro.clone().addScaledVector(direcao, 2.5);
  for (let i = 0; i <= 90; i++) {
    const ponto = inicio.clone().lerp(fim, i / 90);
    cameraEl.object3D.position.set(ponto.x, 1.6, ponto.z);
    cameraEl.object3D.rotation.set(0, olhar, 0);
    await new Promise((done) => requestAnimationFrame(done));
  }
})()`;

async function main() {
  const site = await serveProject();
  const browser = await openBrowser({ width: LARGURA, height: ALTURA, dpr: 2, mobile: true, probe: SONDA });
  const result = checks();
  const bust = 'bust=' + Date.now();

  try {
    // ---- o quadro que a ponte guarda é a imagem do ecrã ----
    await browser.goto(site.base + '/scene2/?' + bust);
    await sleep(3000);
    const quadro = await browser.evaluate(`(async () => {
      const brilho = (fonte, largura, altura) => {
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = Math.round(120 * altura / largura);
        const context = canvas.getContext('2d');
        context.drawImage(fonte, 0, 0, canvas.width, canvas.height);
        const dados = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let soma = 0;
        for (let i = 0; i < dados.length; i += 4) soma += 0.299 * dados[i] + 0.587 * dados[i + 1] + 0.114 * dados[i + 2];
        return soma / (dados.length / 4);
      };
      const inicio = performance.now();
      const guardou = window.arrivalFrame.capture();
      const custo = Math.round((performance.now() - inicio) * 10) / 10;
      const dados = sessionStorage.getItem('zonas12.ultimoQuadro');
      if (!guardou || !dados) return { guardou: guardou };
      const image = new Image();
      await new Promise((done, fail) => { image.onload = done; image.onerror = fail; image.src = dados; });
      return {
        guardou: guardou, custo: custo, kilobytes: Math.round(dados.length / 1024),
        tamanho: image.naturalWidth + 'x' + image.naturalHeight,
        brilho: Math.round(brilho(image, image.naturalWidth, image.naturalHeight) * 10) / 10
      };
    })()`);
    result.check('o quadro guardado é a imagem que se estava a ver, não um retângulo preto',
      quadro.guardou === true && quadro.brilho > 60 && quadro.brilho < 255, JSON.stringify(quadro));

    // ---- a travessia, com a amostragem a correr ----
    const amostras = [];
    let sampling = true;
    const started = Date.now();
    const sampler = (async () => {
      while (sampling && Date.now() - started < 9000) {
        const at = Date.now() - started;
        try {
          const shot = await browser.screenshot(0.25);
          amostras.push({ t: at, mean: shot.mean });
        } catch (error) {
          amostras.push({ t: at, failed: error.message });
        }
        await sleep(10);
      }
    })();
    await sleep(150);
    await browser.page.send('Runtime.evaluate', { expression: atravessar(PORTA), awaitPromise: false }, 3000)
      .catch(() => { /* a página vai-se embora */ });
    await sleep(8000);
    sampling = false;
    await sampler;

    const escuros = amostras.filter((item) => !item.failed && item.mean < 6);
    result.check('a travessia não tem nenhum fotograma escuro',
      escuros.length === 0 && amostras.some((item) => !item.failed),
      escuros.length + ' escuro(s) em ' + amostras.filter((item) => !item.failed).length +
      ' amostra(s) — antes da ponte eram 2');

    const mundo = await browser.evaluate('window.portalDebug && window.portalDebug.world');
    result.check('e chegou ao outro mundo', mundo === 'scene1', 'mundo=' + mundo);

    const ponte = await browser.evaluate(ASSINATURA).catch(() => null);
    const trace = JSON.parse(await browser.evaluate('JSON.stringify(window.__trace || [])'));
    const primeiro = trace.find((step) => step.name.indexOf('frame 1') === 0);
    result.check('a ponte já está na página no primeiro fotograma do documento que chega (antes da 1.ª pintura)',
      Boolean(primeiro) && primeiro.name === 'frame 1 ponte=true', primeiro && primeiro.name);

    const desvaneceu = trace.find((step) => step.name === 'ponte a desvanecer');
    const retirada = trace.find((step) => step.name === 'ponte retirada');
    result.check('a ponte sai de uma vez, sem desvanecimento (um corte, não um efeito)',
      Boolean(retirada) && !desvaneceu,
      desvaneceu ? 'houve desvanecimento aos ' + desvaneceu.t + ' ms'
        : 'sai aos ' + (retirada && retirada.t) + ' ms, sempre a opacidade 1');

    const linha = trace.find((step) => step.name === 'linha Carregando visível');
    result.check('na travessia não aparece a linha «Carregando…» (a ponte já preenche o ecrã)',
      !linha, linha ? 'apareceu aos ' + linha.t + ' ms' : 'nunca apareceu');

    // O fotograma de câmara que se viu numa travessia: a ponte saía antes de o <video> ter imagem, e
    // o que estava por baixo do canvas transparente era o preto dele (D45).
    const video = trace.find((step) => step.name === 'video frame apresentado') ||
      trace.find((step) => step.name === 'video playing');
    result.check('a ponte só sai depois de a câmara ter o primeiro fotograma (nada de preto por baixo dela)',
      Boolean(video) && Boolean(retirada) && retirada.t >= video.t,
      video ? 'vídeo aos ' + video.t + ' ms, ponte sai aos ' + (retirada && retirada.t) + ' ms'
        : 'o vídeo nunca deu imagem');

    if (ponte) {
      console.log('');
      console.log('  quadro da ponte: ' + ponte.tamanho + ', ' + ponte.kilobytes + ' kB, brilho ' +
        ponte.mean.toFixed(1));
    }

    // ---- a chave é de uso único ----
    await browser.goto(site.base + '/scene1/?' + bust);
    await sleep(1500);
    const repetida = await browser.evaluate(`({
      ponte: Boolean(document.querySelector('.ultimo-quadro')),
      chave: sessionStorage.getItem('zonas12.ultimoQuadro') !== null
    })`);
    result.check('recarregar a seguir não mostra a ponte outra vez (a chave é lida uma vez e apagada)',
      repetida.ponte === false && repetida.chave === false, JSON.stringify(repetida));
  } finally {
    await browser.close();
  }

  // ---- a guarda: sem cena, a ponte sai na mesma ----
  const guarded = await openBrowser({ width: LARGURA, height: ALTURA, dpr: 2, mobile: true });
  try {
    await guarded.page.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        const fetchOriginal = window.fetch;
        window.fetch = function (request, options) {
          if (String(request).indexOf('data/worlds/') >= 0) {
            return Promise.reject(new Error('os mundos estão bloqueados para o teste da guarda'));
          }
          return fetchOriginal.call(window, request, options);
        };
      `
    });
    await guarded.page.send('Page.navigate', { url: site.base + '/scene2/?' + bust });
    await sleep(2500);
    // Uma ponte semeada à mão: aqui não interessa a imagem, interessa que ela saia.
    await guarded.evaluate(`(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 8; canvas.height = 8;
      const context = canvas.getContext('2d');
      context.fillStyle = '#335577';
      context.fillRect(0, 0, 8, 8);
      sessionStorage.setItem('zonas12.ultimoQuadro', canvas.toDataURL('image/jpeg', 0.5));
      sessionStorage.setItem('zonas12.ultimoQuadroEm', String(Date.now()));
    })()`);
    await guarded.page.send('Page.navigate', { url: site.base + '/scene1/?' + bust });
    await sleep(1800);
    const posted = await guarded.evaluate(`Boolean(document.querySelector('.ultimo-quadro'))`);
    await sleep(10500);
    const gone = await guarded.evaluate(`Boolean(document.querySelector('.ultimo-quadro'))`);
    result.check('sem cena (a construção falha), a ponte sai na mesma ao fim da guarda de 10 s',
      posted === true && gone === false,
      'aos 1,8 s: ' + (posted ? 'posta' : 'ausente') + '; aos 12,3 s: ' + (gone ? 'posta' : 'ausente'));
  } finally {
    await guarded.close();
    await site.close();
  }

  result.report('D43/D44/D45 (a travessia entre mundos)');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
