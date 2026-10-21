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

  let shown = null;
  let guard = null;

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
      sessionStorage.setItem(KEY, frame.toDataURL('image/jpeg', QUALITY));
      sessionStorage.setItem(AT, String(Date.now()));
      return true;
    } catch (error) {
      // Sem quota, sem `sessionStorage` (Safari em navegação privada): a viagem segue sem ponte e a
      // página que chega comporta-se como antes.
      return false;
    }
  }

  function restore() {
    let data = null;
    let when = 0;
    try {
      data = sessionStorage.getItem(KEY);
      when = Number(sessionStorage.getItem(AT) || 0);
      // Lida uma vez e apagada: um recarregamento a seguir não mostra o quadro de uma visita antiga.
      sessionStorage.removeItem(KEY);
      sessionStorage.removeItem(AT);
    } catch (error) {
      return null;
    }
    if (!data || !when || Date.now() - when > MAX_AGE) return null;
    const image = document.createElement('img');
    image.className = 'ultimo-quadro';
    image.alt = '';
    image.setAttribute('aria-hidden', 'true');
    image.src = data;
    document.body.appendChild(image);
    return image;
  }

  function hide() {
    if (guard) {
      clearTimeout(guard);
      guard = null;
    }
    if (!shown) return;
    const image = shown;
    shown = null;
    // Um corte, não um desvanecimento (D44): as duas imagens são a mesma cena a um passo de
    // distância, e dissolvê-las durante 240 ms vê-se como um efeito — exactamente a «impressão de
    // transição» que a ponte existe para não haver. Sai no mesmo fotograma em que o mundo aparece.
    if (image.parentNode) image.parentNode.removeChild(image);
  }

  shown = restore();
  if (shown) guard = setTimeout(hide, GUARD);

  // O que a página precisa de saber sobre a ponte. `portal.js` chama `capture` antes de navegar e
  // `js/app.js` chama `hide` quando há cena; um hospedeiro sem este ficheiro não parte nada.
  window.arrivalFrame = {
    capture: capture,
    hide: hide,
    element: function () {
      return shown;
    }
  };
})();
