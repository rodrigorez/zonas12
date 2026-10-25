// A ponte de imagem entre dois mundos (D43).
//
// Cada mundo é uma página (D24), por isso atravessar uma porta é navegar: o documento que sai
// desaparece e o que chega só pinta alguma coisa quando a cena está construída. No meio ficava o
// preto do `#container-video` (medido no vídeo do autor: 0,85 s; medido aqui, na mesma máquina:
// 0,15 s) — e é isso que se vê como um piscar entre o mundo que se deixa e o que se vai ver.
//
// Este ficheiro fecha essa janela com a única imagem que serve: a última que o visitante estava a
// ver. A página que sai guarda-a em `sessionStorage` no instante de atravessar (`capture`); a que
// chega pinta-a antes de tudo o resto e o `js/app.js` tira-a quando há cena (`hide`), num só
// fotograma e sem desvanecimento — a travessia não deve dar a ver que houve uma (D44).
//
// É um script **clássico**, e não um módulo, de propósito: um módulo só corre depois de a sua
// árvore de importações estar carregada, e enquanto isso o ecrã já estava preto. Este corre a meio
// do <body>, antes da primeira pintura (é a única razão para a linha no markup).
(function () {
  'use strict';

  const KEY = 'zonas12.ultimoQuadro';
  const AT = 'zonas12.ultimoQuadroEm';
  // O tempo do shader que estava desenhado (D53): a página que chega continua a animação de onde ela
  // ia, e o corte deixa de se ver. É da mesma ponte, com a mesma validade e o mesmo uso único.
  const TIME = 'zonas12.tempoShader';
  // A ponte vale segundos, não minutos: uma imagem mais velha do que isto é de outra visita e mais
  // vale o ecrã de sempre do que um quadro fora de contexto.
  const MAX_AGE = 20000;
  // O quadro é uma transição de umas centésimas de segundo, não uma fotografia: metade da largura
  // de um telemóvel basta, e cabe folgado na quota do `sessionStorage`.
  const WIDTH = 1280;
  const QUALITY = 0.7;
  // Se a cena não chegar (uma cena inválida, um asset que falha), o quadro sai na mesma: uma imagem
  // parada para sempre esconderia o problema em vez de o mostrar.
  const GUARD = 10000;
  // O teto da descodificação: uma imagem que nunca descodifica não pode deixar a ponte no ecrã para
  // sempre. Um segundo e meio é folgado para um quadro de 1280 px e curto para um ecrã errado.
  const DECODE_CEILING = 1500;

  let shown = null;
  let guard = null;
  // O quadro que esta página acabou de guardar (D55): é o mesmo que a página seguinte vai pintar, e
  // serve para o pôr **também** por cima desta cena enquanto ela espera. Uma imagem, dois usos.
  let lastFrame = null;
  let covered = null;
  let coverGuard = null;
  // O instante do shader que a ponte trouxe (D53), lido uma vez em `restore`.
  let bridgedTime = null;
  // A descodificação da imagem que a ponte mostra. `hide()` espera por ela: tirar o quadro antes de
  // ele estar descodificado é mostrar o preto do `#container-video` que a ponte existe para evitar
  // (R17). O `decode()` explícito também pede a descodificação **cedo** — um `<img>` que ainda não
  // teve layout pode ser descodificado só na primeira pintura, que é tarde por definição.
  let decoded = null;

  function decodeEarly(image) {
    if (typeof image.decode !== 'function') return Promise.resolve();
    const ceiling = new Promise((done) => setTimeout(done, DECODE_CEILING));
    return Promise.race([image.decode().catch(() => {}), ceiling]);
  }

  // O mesmo enquadramento do ecrã: o <video> é `object-fit: cover`, e o quadro tem de o imitar.
  function drawCover(context, source, sourceWidth, sourceHeight, width, height) {
    if (!sourceWidth || !sourceHeight) return;
    const scale = Math.max(width / sourceWidth, height / sourceHeight);
    const drawnWidth = sourceWidth * scale;
    const drawnHeight = sourceHeight * scale;
    context.drawImage(source, (width - drawnWidth) / 2, (height - drawnHeight) / 2, drawnWidth, drawnHeight);
  }

  // O que está no ecrã, por baixo e por cima: a câmara (o <video>) e a cena (o canvas), pela ordem em
  // que o CSS as empilha.
  function capture() {
    try {
      const scene = document.querySelector('a-scene');
      const canvas = (scene && scene.canvas) || document.querySelector('canvas');
      if (!canvas || !canvas.width || !canvas.height) return false;
      // O canvas é `alpha: true` e o renderer não guarda o buffer: sem desenhar agora, o que se lê
      // é o vazio do último fotograma composto. Uma renderização explícita, e a leitura logo a
      // seguir, é o que garante uma imagem em vez de um retângulo preto.
      if (scene && scene.renderer && scene.object3D && scene.camera) {
        scene.renderer.render(scene.object3D, scene.camera);
      }
      const scale = Math.min(1, WIDTH / canvas.width);
      const frame = document.createElement('canvas');
      frame.width = Math.round(canvas.width * scale);
      frame.height = Math.round(canvas.height * scale);
      const context = frame.getContext('2d');
      const video = document.getElementById('webcam-video');
      if (video && video.readyState >= 2) {
        drawCover(context, video, video.videoWidth, video.videoHeight, frame.width, frame.height);
      }
      context.drawImage(canvas, 0, 0, frame.width, frame.height);
      const data = frame.toDataURL('image/jpeg', QUALITY);
      lastFrame = data;
      sessionStorage.setItem(KEY, data);
      sessionStorage.setItem(AT, String(Date.now()));
      // O instante do shader vai com o quadro: sem ele a chegada recomeçaria no quadro estático e a
      // animação do destino saltava no corte (medido: 0,98 a 4,39 onde a meta é 0,50).
      const policy = window.portalDebug && window.portalDebug.shader ? window.portalDebug.shader().policy : null;
      if (policy && typeof policy.time === 'number') sessionStorage.setItem(TIME, String(policy.time));
      else sessionStorage.removeItem(TIME);
      return true;
    } catch (error) {
      // Sem quota, sem `sessionStorage` (Safari em navegação privada): a viagem segue sem ponte e a
      // página que chega comporta-se como antes.
      return false;
    }
  }

  // D55: enquanto a página seguinte não chega, o ecrã fica **por cima desta cena** com o quadro do
  // destino — o mesmo que a ponte vai pintar do outro lado. Foi medido no telemóvel do autor: entre
  // atravessar e o destino aparecer passaram **4,7 s**, e nesse tempo o dedo no D-pad (ou o aparelho
  // a rodar) tirava a câmara de dentro da janela em ~100 ms, devolvendo a sala de onde ele vinha.
  // O quadro tapa a cena, mas não o toque (`pointer-events: none`), e sai sozinho no mesmo teto da
  // ponte se a navegação não chegar — uma travessia que falha não pode deixar uma imagem presa.
  function cover() {
    if (!lastFrame || covered) return false;
    const image = document.createElement('img');
    image.className = 'ultimo-quadro ultimo-quadro-acima';
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.src = lastFrame;
    document.body.appendChild(image);
    covered = image;
    coverGuard = setTimeout(removeCover, GUARD);
    return true;
  }

  function removeCover() {
    if (coverGuard) {
      clearTimeout(coverGuard);
      coverGuard = null;
    }
    if (!covered) return;
    const image = covered;
    covered = null;
    if (image.parentNode) image.parentNode.removeChild(image);
  }

  function restore() {
    let data = null;
    let when = 0;
    let tempo = null;
    try {
      data = sessionStorage.getItem(KEY);
      when = Number(sessionStorage.getItem(AT) || 0);
      const guardado = sessionStorage.getItem(TIME);
      tempo = guardado === null ? null : Number(guardado);
      // Lida uma vez e apagada: um recarregamento a seguir não mostra o quadro de uma visita antiga.
      sessionStorage.removeItem(KEY);
      sessionStorage.removeItem(AT);
      sessionStorage.removeItem(TIME);
    } catch (error) {
      return null;
    }
    if (!data || !when || Date.now() - when > MAX_AGE) return null;
    if (Number.isFinite(tempo) && tempo >= 0) bridgedTime = tempo;
    const image = document.createElement('img');
    image.className = 'ultimo-quadro';
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.src = data;
    document.body.appendChild(image);
    decoded = decodeEarly(image);
    return image;
  }

  function hide() {
    removeCover();
    if (guard) {
      clearTimeout(guard);
      guard = null;
    }
    if (!shown) return;
    const image = shown;
    shown = null;
    const remove = function () {
      if (image.parentNode) image.parentNode.removeChild(image);
    };
    // O quadro sai depois de poder ter sido visto, e não antes (R17). Continua a ser um **corte** e
    // não um desvanecimento (D44): as duas imagens são a mesma cena a um passo de distância, e
    // dissolvê-las durante 240 ms vê-se como um efeito — exactamente a «impressão de transição» que
    // a ponte existe para não haver. O que a espera muda é o instante, não a forma de sair.
    if (decoded) decoded.then(remove); else remove();
  }

  shown = restore();
  if (shown) guard = setTimeout(hide, GUARD);

  // O que a página precisa de saber sobre a ponte. `portal.js` chama `capture` antes de navegar e
  // `js/app.js` chama `hide` quando há cena; um hospedeiro sem este ficheiro não parte nada.
  window.arrivalFrame = {
    capture: capture,
    // O quadro do destino por cima da cena que está a sair (D55).
    cover: cover,
    hide: hide,
    element: function () {
      return shown;
    },
    // O tempo do shader que a página que saiu estava a desenhar, ou `null` quando não veio ponte.
    shaderTime: function () {
      return bridgedTime;
    }
  };
})();
