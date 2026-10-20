// A aceitação da Fase 3B num só sítio: os doze testes da §10 do roadmap, cada um a medir o que ele
// promete e a devolver o número que mediu. Corre **na página**, como a varredura de poses
// (tools/regression/pose-sweep.mjs), porque o que se mede é o que está desenhado e o que o A-Frame
// faz com o que está no DOM — e porque o projeto não tem build nem dependências (D1).
//
// Uso, com uma sala (ou o portão) aberta por HTTP:
//
//   (await import('/tools/regression/acceptance.mjs')).runAcceptance()
//
// O que cada teste mede e porquê:
//
//   T1  as portas: atravessar cada uma a passo de 0,1 m conta **uma** travessia, para o destino certo
//   T2  o bordo da moldura não sai cortado, em 84 poses (a varredura de poses)
//   T3  o contorno da moldura fecha, amostra a amostra (idem)
//   T4  a janela: dentro vê-se a outra dimensão, fora vê-se a sala (no portão, fora é transparente)
//   T5  a porta de trás atrás de uma da frente: ganha a da frente, e a moldura de trás não invade
//   T6  o clique na obra abre o modal só na dimensão ativa
//   T7  a chegada não dispara travessias em cadeia, e o regresso é uma só
//   T8  a consola: sem erros nem avisos (lida da sonda da sessão, quando existe)
//   T9  criar e destruir portais em ciclo não deixa ouvintes nem registos para trás
//   T10 o retrato aparece dentro da janela e em nenhum outro sítio
//   T11 a chegada atrás da porta inversa (o mesmo que o T7, na direção em que o visitante fica)
//   T12 o retrato não sai da moldura, a duas distâncias
//
// Duas coisas que este instrumento **não** pode fazer sozinho, e que a sessão que o chama tem de
// juntar: contar as navegações de página (o contexto morre na navegação — por isso o T1 deixa o
// registo em `sessionStorage`) e observar a consola desde antes da carga (o T8).

// The modal is the artwork module's (D19), so the instrument closes it through the module and not
// through a global: the `window.fecharObra` bridge left with the inline attributes in Fase 4.
import { closeArtwork } from '/js/modules/artwork.js';

const MARCA = 'zonas12-aceitacao';
const RUÍDO = 12;

// --- ouvintes vivos ---
//
// Contar as *chamadas* a `addEventListener` não diz quantos ouvintes existem: o DOM deduplica
// registos iguais (mesmo alvo, tipo, função e captura), e a sonda da sessão (que conta chamadas)
// chega a dizer 2 onde há 1. Foi assim que esta bateria quase reportou uma fuga que não existe — a
// resposta certa veio do `DOMDebugger.getEventListeners` da própria sessão (é o método que o
// roadmap já usava para o A2/A3). Aqui replica-se a semântica do DOM com um registo por chave, para
// o instrumento poder responder sozinho à pergunta do T9.
const registos = new Map();

const identidade = (valor) => {
  if (!valor) return 'nulo';
  if (typeof valor === 'function') {
    if (!valor.__zonasId) Object.defineProperty(valor, '__zonasId', { value: 'f' + Math.random().toString(36).slice(2), enumerable: false, configurable: true });
    return valor.__zonasId;
  }
  if (typeof valor === 'object') {
    if (!valor.__zonasId) Object.defineProperty(valor, '__zonasId', { value: 'o' + Math.random().toString(36).slice(2), enumerable: false, configurable: true });
    return valor.__zonasId;
  }
  return String(valor);
};

const chaveDe = (tipo, ouvinte, captura) => tipo + '|' + identidade(ouvinte) + '|' + (captura === true || (captura && captura.capture) ? '1' : '0');

(() => {
  const adicionar = EventTarget.prototype.addEventListener;
  const remover = EventTarget.prototype.removeEventListener;
  EventTarget.prototype.addEventListener = function (tipo, ouvinte, opcoes) {
    const doAlvo = registos.get(this) || new Map();
    registos.set(this, doAlvo);
    doAlvo.set(chaveDe(tipo, ouvinte, opcoes), { tipo, ouvinte });
    return adicionar.call(this, tipo, ouvinte, opcoes);
  };
  EventTarget.prototype.removeEventListener = function (tipo, ouvinte, opcoes) {
    const doAlvo = registos.get(this);
    if (doAlvo) doAlvo.delete(chaveDe(tipo, ouvinte, opcoes));
    return remover.call(this, tipo, ouvinte, opcoes);
  };
})();

// Quantos ouvintes **vivos** tem um alvo, de um tipo (ou de todos).
export function liveListeners(target, type) {
  const doAlvo = registos.get(target);
  if (!doAlvo) return 0;
  if (!type) return doAlvo.size;
  let n = 0;
  for (const entrada of doAlvo.values()) if (entrada.tipo === type) n++;
  return n;
}

// --- medidas comuns ---

function desenhar(sceneEl, camera) {
  sceneEl.renderer.render(sceneEl.object3D, camera);
}

function lerTudo(gl) {
  const w = gl.drawingBufferWidth;
  const h = gl.drawingBufferHeight;
  const buffer = new Uint8Array(w * h * 4);
  gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
  return { buffer, w, h };
}

const cor = (leitura, x, y) => {
  const i = ((leitura.h - 1 - y) * leitura.w + x) * 4;
  return [leitura.buffer[i], leitura.buffer[i + 1], leitura.buffer[i + 2], leitura.buffer[i + 3]];
};

const difere = (a, b) => Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) > RUÍDO;

const proximoFrame = () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));

// O rectângulo de uma abertura, tirado da geometria da própria máscara: é a medida exata da janela,
// e não uma conta paralela que pode discordar dela (a primeira tentativa desta bateria usou uma
// projeção com o fov errado e mediu a moldura em vez da janela).
function rectDeMalhas(malhas, camera, gl, margem = 0) {
  const pontos = [];
  for (const malha of malhas) {
    if (!malha || !malha.geometry) continue;
    const posicao = malha.geometry.attributes.position;
    for (let i = 0; i < posicao.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(posicao, i);
      malha.localToWorld(v);
      v.project(camera);
      pontos.push({ x: (v.x * 0.5 + 0.5) * gl.drawingBufferWidth, y: (-v.y * 0.5 + 0.5) * gl.drawingBufferHeight });
    }
  }
  if (pontos.length === 0) return null;
  const xs = pontos.map((p) => p.x);
  const ys = pontos.map((p) => p.y);
  return {
    x0: Math.ceil(Math.min(...xs)) + margem,
    x1: Math.floor(Math.max(...xs)) - margem,
    y0: Math.ceil(Math.min(...ys)) + margem,
    y1: Math.floor(Math.max(...ys)) - margem,
    bruto: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map((n) => Math.round(n))
  };
}

// A abertura da janela, tirada da geometria da própria máscara. Duas margens, de propósito: a de
// dentro é pequena (1 px, só para não ler o antialiasing da aresta) e a de fora nunca é usada como
// "fora da janela" — uma margem grande ali contaria a própria borda da janela como invasão, que foi
// o erro da primeira versão desta bateria.
function rectDaJanela(porta, camera, gl, margem = 1) {
  const grupo = porta.portalGroup;
  let mascara = null;
  grupo.traverse((node) => { if (node.isMesh && /-mask$/.test(node.name)) mascara = node; });
  return rectDeMalhas([mascara], camera, gl, margem);
}

// O rectângulo de fora da moldura: a união das quatro barras. É por fora disto que nada do retrato
// pode aparecer (é o que o T12 promete).
function rectDaMoldura(porta, camera, gl) {
  return rectDeMalhas(barrasDe(porta), camera, gl, 0);
}

const dentro = (rect, x, y) => x > rect.x0 && x < rect.x1 && y > rect.y0 && y < rect.y1;

// Conta os pixéis que mudam entre dois desenhos, por dentro e por fora de um rectângulo.
function contarMudancas(a, b, rect) {
  let dentroMuda = 0;
  let dentroTotal = 0;
  let foraMuda = 0;
  let foraTotal = 0;
  for (let y = 0; y < a.h; y++) {
    for (let x = 0; x < a.w; x++) {
      const i = (y * a.w + x) * 4;
      const mudou = Math.abs(a.buffer[i] - b.buffer[i]) + Math.abs(a.buffer[i + 1] - b.buffer[i + 1]) + Math.abs(a.buffer[i + 2] - b.buffer[i + 2]) > RUÍDO;
      if (dentro(rect, x, y)) { dentroTotal++; if (mudou) dentroMuda++; } else { foraTotal++; if (mudou) foraMuda++; }
    }
  }
  return { dentroMuda, dentroTotal, foraMuda, foraTotal };
}

// Conta só o que muda **fora** de um rectângulo (é a pergunta do T12: nada do retrato fora da moldura).
function contarFora(a, b, rect) {
  let foraMuda = 0;
  for (let y = 0; y < a.h; y++) {
    for (let x = 0; x < a.w; x++) {
      if (dentro(rect, x, y)) continue;
      const i = (y * a.w + x) * 4;
      if (Math.abs(a.buffer[i] - b.buffer[i]) + Math.abs(a.buffer[i + 1] - b.buffer[i + 1]) + Math.abs(a.buffer[i + 2] - b.buffer[i + 2]) > RUÍDO) foraMuda++;
    }
  }
  return foraMuda;
}

// As barras da moldura de uma porta.
function barrasDe(porta) {
  const barras = [];
  porta.portalGroup.traverse((node) => { if (node.isMesh && /-frame-\d+$/.test(node.name)) barras.push(node); });
  return barras;
}
// O ponto do ecrã onde a porta está, com a câmara posta em frente dela. A câmara é movida **só na
// posição**: o look-controls é dono da rotação e desfaz o que lhe for escrito à mão (medido).
function porAspecto(sceneEl, camera, posicao, raio, altura, desvios) {
  const cameraEl = sceneEl.querySelector('a-camera');
  const canvas = sceneEl.querySelector('canvas');
  const rect = canvas.getBoundingClientRect();
  for (const desvio of desvios) {
    cameraEl.object3D.position.set(posicao[0] + desvio, altura, posicao[2] + raio);
    cameraEl.object3D.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    const v = new THREE.Vector3(posicao[0], altura, posicao[2]).project(camera);
    if (Math.abs(v.x) > 0.75 || Math.abs(v.y) > 0.75) continue;
    const css = { x: Math.round(rect.left + (v.x * 0.5 + 0.5) * rect.width), y: Math.round(rect.top + (-v.y * 0.5 + 0.5) * rect.height) };
    const porCima = document.elementFromPoint(css.x, css.y);
    if (porCima && porCima.tagName === 'CANVAS') return { desvio, css, ndc: [v.x, v.y] };
  }
  return null;
}

const estadoDoModal = () => {
  const modal = document.getElementById('modal-obra');
  return { visivel: getComputedStyle(modal).display, src: document.getElementById('iframe-obra').getAttribute('src') };
};

// --- os testes ---

// A direção da travessia de uma porta: o seu -Z local, em coordenadas do mundo (é o que a chegada
// pressupõe e o que o `arrivalPoint` usa). Sai da matriz da porta, e não do dado, para uma porta
// rodada ser atravessada como o módulo a atravessa.
function eixoDaPorta(porta) {
  const centro = new THREE.Vector3();
  const quaterniao = new THREE.Quaternion();
  porta.portalGroup.getWorldPosition(centro);
  porta.portalGroup.getWorldQuaternion(quaterniao);
  return { centro, direcao: new THREE.Vector3(0, 0, -1).applyQuaternion(quaterniao).normalize() };
}

// O dado da porta no ficheiro do mundo: é lá que vivem campos que o componente não tem, como o
// `arrivalFrom` (quem o lê é o construtor de cena, não a porta em execução).
async function dadoDoMundo(portalId) {
  const resposta = await fetch('data/worlds/' + window.portalDebug.world + '.json');
  const json = await resposta.json();
  return (json.portals || []).find((p) => p.id === portalId) || null;
}

// T1: atravessar uma porta a passo de 0,1 m. As portas de janela mudam a dimensão ativa (contada
// aqui); as que navegam levam a página (contada pela sessão, pelo registo em sessionStorage).
export async function walkDoor(portalId, options = {}) {
  const sceneEl = document.querySelector('a-scene');
  const cameraEl = sceneEl.querySelector('a-camera');
  const state = window.portalDebug.state;
  const porta = state.portals.find((p) => p.data.id === portalId);
  if (!porta) return { porta: portalId, erro: 'nao esta nesta pagina' };

  const contagem = { janelas: 0, navegacoesPedidas: 0 };
  window.portalDebug.on('dimension:active-changed', () => { contagem.janelas++; });
  const navegarOriginal = porta.navigate.bind(porta);
  porta.navigate = function () {
    contagem.navegacoesPedidas++;
    try { sessionStorage.setItem(MARCA, JSON.stringify({ porta: portalId, navegacoes: contagem.navegacoesPedidas, quando: Date.now() })); } catch (error) { /* sem sessionStorage */ }
    return navegarOriginal();
  };

  const antes = state.activeDimension;
  const { centro, direcao } = eixoDaPorta(porta);
  const avanco = options.avanco || 1.5;
  const recuo = options.recuo || 2.5;
  const passo = options.passo || 0.1;
  const inicio = centro.clone().addScaledVector(direcao, -avanco);
  const fim = centro.clone().addScaledVector(direcao, recuo);
  const n = Math.max(2, Math.round((avanco + recuo) / passo));
  for (let i = 0; i <= n; i++) {
    const ponto = inicio.clone().lerp(fim, i / n);
    cameraEl.object3D.position.set(ponto.x, 1.6, ponto.z);
    await proximoFrame();
  }
  await proximoFrame();
  porta.navigate = navegarOriginal;

  return {
    porta: portalId,
    eixo: porta.data.windowKind + '+' + porta.data.actionKind,
    destino: porta.data.target || null,
    dimensao: antes + ' -> ' + state.activeDimension,
    travessiasDeJanela: contagem.janelas,
    navegacoesPedidas: contagem.navegacoesPedidas,
    passou: porta.data.actionKind === 'navigate'
      ? contagem.navegacoesPedidas === 1
      : (contagem.navegacoesPedidas === 0 && contagem.janelas === 1)
  };
}

// T4: a janela mostra a dimensão do outro lado e a sala fica fora dela.
export async function checkWindow(portalId) {
  const sceneEl = document.querySelector('a-scene');
  const cameraEl = sceneEl.querySelector('a-camera');
  const gl = sceneEl.renderer.getContext();
  const camera = cameraEl.components.camera.camera;
  const guardado = cameraEl.object3D.position.clone();
  const porta = window.portalDebug.state.portals.find((p) => p.data.id === portalId);
  if (!porta) return { porta: portalId, erro: 'nao esta nesta pagina' };

  const mundo = new THREE.Vector3();
  porta.el.object3D.getWorldPosition(mundo);
  cameraEl.object3D.position.set(mundo.x, mundo.y + 1.6, mundo.z + 14);
  await proximoFrame();
  const rect = rectDaJanela(porta, camera, gl);
  desenhar(sceneEl, camera);
  const leitura = lerTudo(gl);
  const cx = Math.round((rect.x0 + rect.x1) / 2);
  const cy = Math.round((rect.y0 + rect.y1) / 2);
  const centro = cor(leitura, cx, cy);
  const fora = cor(leitura, Math.round(leitura.w * 0.05), cy);
  cameraEl.object3D.position.copy(guardado);
  await proximoFrame();
  return {
    porta: portalId,
    janela: rect.bruto,
    dentro: centro,
    fora: fora,
    alfaFora: fora[3],
    // O portão tem o fundo transparente (a câmara é a dimensão 0): fora da janela o alfa é 0.
    // Nas salas o fundo é opaco: o que se exige é que dentro e fora sejam coisas diferentes.
    passou: fora[3] === 0 ? centro[3] === 255 && fora[3] === 0 : difere(centro, fora)
  };
}

// T5: uma porta de trás atrás de uma da frente. Ganha a da frente; a moldura de trás não invade a
// janela da frente, e continua a ver-se fora dela (é esse o controlo que prova que a medição não é
// vazia).
export async function checkStackedDoors(options = {}) {
  const sceneEl = document.querySelector('a-scene');
  const cameraEl = sceneEl.querySelector('a-camera');
  const gl = sceneEl.renderer.getContext();
  const camera = cameraEl.components.camera.camera;
  const guardado = cameraEl.object3D.position.clone();
  const site = options.site || { x: 200, y: 1.6, z: 0 };
  const frente = options.frente || { id: 100, x: site.x, z: site.z - 20, width: 8, height: 10 };
  const tras = options.tras || { id: 101, x: site.x + 5, z: site.z - 30, width: 8, height: 10 };

  const criar = (spec) => {
    const el = document.createElement('a-entity');
    el.setAttribute('stencil-portal', `id: ${spec.id}; dimensionA: 0; dimensionB: 1; ownedBy: 0; ` +
      `width: ${spec.width}; height: ${spec.height}; box: 0.1 0.1 0.1; boxPosition: 0 1000 0`);
    el.setAttribute('position', { x: spec.x, y: site.y, z: spec.z });
    sceneEl.appendChild(el);
    return el;
  };

  cameraEl.object3D.position.set(site.x, site.y, site.z);
  const a = criar(frente);
  const b = criar(tras);
  await proximoFrame();
  await proximoFrame();
  await proximoFrame();

  const rect = rectDaJanela(a.components['stencil-portal'], camera, gl);
  const barras = barrasDe(b.components['stencil-portal']);
  const mostrar = (v) => barras.forEach((barra) => { barra.visible = v; });

  mostrar(true);
  await proximoFrame();
  desenhar(sceneEl, camera);
  const comB = lerTudo(gl);
  mostrar(false);
  await proximoFrame();
  desenhar(sceneEl, camera);
  const semB = lerTudo(gl);
  mostrar(true);
  await proximoFrame();
  desenhar(sceneEl, camera);
  const comBAgain = lerTudo(gl);

  const mudancas = contarMudancas(comB, semB, rect);
  const ruido = contarMudancas(comB, comBAgain, rect);
  const centro = cor(comB, Math.round((rect.x0 + rect.x1) / 2), Math.round((rect.y0 + rect.y1) / 2));
  const fora = cor(comB, Math.round(comB.w * 0.05), Math.round((rect.y0 + rect.y1) / 2));

  a.remove();
  b.remove();
  cameraEl.object3D.position.copy(guardado);
  await proximoFrame();

  return {
    dentroDaJanelaDaFrente: mudancas.dentroMuda,
    molduraDeTrasForaDaJanela: mudancas.foraMuda,
    pixelsForaDaJanela: mudancas.foraTotal,
    ruidoNoMesmoDesenho: ruido.dentroMuda + ruido.foraMuda,
    dentro: centro,
    fora: fora,
    passou: mudancas.dentroMuda === 0 && mudancas.foraMuda > 0 && ruido.dentroMuda + ruido.foraMuda === 0
  };
}

// T6: o clique na obra. O rato é simulado no canvas (o cursor do A-Frame lê `clientX`/`clientY`), e o
// que o cursor aponta é lido **antes** do clique — o cursor refaz a interseção por frame, e um clique
// apressado bate no alvo anterior (foi assim que a primeira medição desta bateria mentiu).
export async function checkArtworkClick(options = {}) {
  const sceneEl = document.querySelector('a-scene');
  const canvas = sceneEl.querySelector('canvas');
  const state = window.portalDebug.state;
  const obra = options.obra || 0;
  const dimensao = options.dimensao === undefined ? state.activeDimension : options.dimensao;

  const alvos = [];
  for (const id of Object.keys(state.dimensions)) {
    for (const entrada of state.dimensions[id]) {
      if (entrada.mesh && entrada.mesh.name.indexOf('-artwork') !== -1 && Number(id) === dimensao) alvos.push(entrada.mesh);
    }
  }
  const mesh = alvos[obra];
  if (!mesh) return { aplicavel: false, porque: 'este mundo nao tem obras nesta dimensao' };

  const posicao = new THREE.Vector3();
  mesh.getWorldPosition(posicao);
  const sitio = porAspecto(sceneEl, sceneEl.querySelector('a-camera').components.camera.camera, [posicao.x, 0, posicao.z], 8, 1.6, [4, 5, 3, 6, -4, -5, -3, -6, 7, -7]);
  if (!sitio) return { erro: 'sem zona do ecra livre para apontar' };

  const enviar = (tipo, extra) => canvas.dispatchEvent(new MouseEvent(tipo, Object.assign({ bubbles: true, clientX: sitio.css.x, clientY: sitio.css.y, button: 0 }, extra || {})));
  enviar('mousemove');
  await new Promise((resolve) => setTimeout(resolve, 400));
  const cursor = sceneEl.components.cursor;
  const apontado = cursor && cursor.intersectedEl
    ? {
      tag: cursor.intersectedEl.tagName,
      dimensao: (cursor.intersectedEl.getAttribute('dimensional-material') || {}).dimension,
      url: (cursor.intersectedEl.getAttribute('open-artwork') || {}).url || null
    }
    : null;

  enviar('mousedown');
  await new Promise((resolve) => setTimeout(resolve, 60));
  enviar('mouseup', { buttons: 0 });
  await new Promise((resolve) => setTimeout(resolve, 500));
  const aberto = estadoDoModal();
  closeArtwork();
  await new Promise((resolve) => setTimeout(resolve, 300));
  const fechado = estadoDoModal();

  return {
    obra: mesh.name,
    dimensao: dimensao,
    apontado: apontado,
    modal: aberto.visivel,
    src: aberto.src,
    depoisDeFechar: fechado.visivel,
    passou: aberto.visivel === 'flex' && !!aberto.src && fechado.visivel === 'none'
  };
}

// T7 e T11: a chegada. A câmara fica onde o construtor a pôs (é o que o T11 mede: o ponto vem do
// dado, pelo `arrivalPoint`) e dá-se um passo na direção em que o visitante fica virado — e outra
// meia volta. Andar para dentro não pode disparar nada; voltar dispara uma só.
export async function checkArrival(options = {}) {
  const sceneEl = document.querySelector('a-scene');
  const cameraEl = sceneEl.querySelector('a-camera');
  const state = window.portalDebug.state;
  const parametros = new URLSearchParams(location.search);
  const deOnde = parametros.get('from');

  // O `arrivalFrom` vive no ficheiro do mundo (o componente da porta não o tem): procura-se lá o
  // dado e daqui a porta que lhe corresponde.
  const resposta = await fetch('data/worlds/' + window.portalDebug.world + '.json');
  const json = await resposta.json();
  const dado = (json.portals || []).find((p) => p.arrivalFrom === deOnde);
  const porta = dado ? state.portals.find((p) => p.data.id === dado.id) : null;
  if (!porta) return { erro: 'nenhuma porta diz que e a chegada de ' + deOnde };

  const contagem = { janelas: 0, navegacoesPedidas: 0 };
  window.portalDebug.on('dimension:active-changed', () => { contagem.janelas++; });
  // O pedido de navegação é **contado**, não executado: a meia volta atravessa a porta e levaria a
  // página com ela, deixando a medição a meio. Que a porta navegue mesmo para o mundo certo é o T1
  // que o mede (com a página a mudar de verdade); aqui o que se pergunta é quantas travessias a
  // chegada dispara — zero a andar para dentro, uma a voltar.
  state.portals.forEach((cada) => {
    cada.navigate = function () { contagem.navegacoesPedidas++; };
  });

  const modulo = await import('/js/scene/arrival.js');
  const esperado = modulo.arrivalPoint(dado, options.alturaDosOlhos || 1.6);
  const camera = cameraEl.object3D.position;
  const noSitio = Math.abs(esperado.position[0] - camera.x) < 0.05 && Math.abs(esperado.position[2] - camera.z) < 0.05;

  const { centro, direcao } = eixoDaPorta(porta);
  const andar = async (de, para) => {
    // A distância sai do `distanceTo`: subtrair dois `Vector3` dá um `Vector3`, e o `Math.abs` disso
    // é `NaN` — um laço com `NaN` não corre e o teste passaria sem medir nada (foi o que aconteceu
    // à primeira versão desta função).
    const n = Math.max(2, Math.round(de.distanceTo(para) / 0.1));
    for (let i = 0; i <= n; i++) {
      const ponto = de.clone().lerp(para, i / n);
      cameraEl.object3D.position.set(ponto.x, 1.6, ponto.z);
      await proximoFrame();
    }
    await proximoFrame();
  };

  // O visitante fica virado na direção da travessia (o -Z da porta): andar para dentro da sala é
  // seguir essa direção; voltar é o contrário.
  const dentroDe = centro.clone().addScaledVector(direcao, 1.5);
  const dentroPara = centro.clone().addScaledVector(direcao, 4.5);
  const antes = { janelas: contagem.janelas, navegacoes: contagem.navegacoesPedidas };
  await andar(dentroDe, dentroPara);
  const dentro = { janelas: contagem.janelas - antes.janelas, navegacoes: contagem.navegacoesPedidas - antes.navegacoes };

  const meio = { janelas: contagem.janelas, navegacoes: contagem.navegacoesPedidas };
  await andar(dentroPara, centro.clone().addScaledVector(direcao, -1.5));
  const volta = { janelas: contagem.janelas - meio.janelas, navegacoes: contagem.navegacoesPedidas - meio.navegacoes };

  const resultado = {
    porta: dado.id,
    deOnde: deOnde,
    chegadaNoSitioCalculado: noSitio,
    esperado: esperado.position.map((n) => Number(n.toFixed(2))),
    camera: [Number(camera.x.toFixed(2)), Number(camera.y.toFixed(2)), Number(camera.z.toFixed(2))],
    andarParaDentro: dentro,
    meiaVolta: volta,
    passou: noSitio && dentro.janelas === 0 && dentro.navegacoes === 0 &&
      (volta.janelas + volta.navegacoes) === 1
  };
  // A meia volta de uma porta de mundo navega, e a navegação leva o contexto desta função com ela:
  // o resultado fica também em sessionStorage, para a sessão o poder ler depois de a página assentar.
  try { sessionStorage.setItem(MARCA + '-chegada', JSON.stringify(resultado)); } catch (error) { /* sem sessionStorage */ }
  return resultado;
}

// T9: criar e destruir 20 portais pelas fábricas. Um ouvinte de teclado na carga e outro no fim, o
// registo de volta ao que era e nenhum nó deixado na árvore.
export async function checkPortalCycle(options = {}) {
  const modulo = await import('/js/modules/portal.js');
  const sceneEl = document.querySelector('a-scene');
  const state = window.portalDebug.state;
  const voltas = options.voltas || 20;

  const medir = () => {
    let nos = 0;
    sceneEl.object3D.traverse((o) => { if (o.name && /^portal-\d+/.test(o.name)) nos++; });
    return {
      portas: state.portals.length,
      nosNaArvore: nos,
      ouvintesDeTecladoNoDocumento: liveListeners(document, 'keydown'),
      ouvintesVivosNoDocumento: liveListeners(document)
    };
  };

  const antes = medir();
  const dados = (id) => ({
    id: id, ownedBy: 0, position: [0, 0, -400 - id], width: 4, height: 5, box: [4, 5, 1], boxPosition: [0, 8, 0],
    trigger: 'plane', frame: { color: '#ff0000', thickness: 0.3 },
    window: { kind: 'none' }, action: { kind: 'none' }
  });
  for (let i = 0; i < voltas; i++) {
    const el = modulo.createPortal(dados(300 + i), sceneEl);
    await proximoFrame();
    modulo.removePortal(el);
    await proximoFrame();
  }
  await new Promise((resolve) => setTimeout(resolve, 300));
  const depois = medir();

  return {
    voltas: voltas,
    antes: antes,
    depois: depois,
    passou: antes.portas === depois.portas && antes.nosNaArvore === depois.nosNaArvore &&
      antes.ouvintesDeTecladoNoDocumento === depois.ouvintesDeTecladoNoDocumento &&
      antes.ouvintesVivosNoDocumento === depois.ouvintesVivosNoDocumento
  };
}

// T10 e T12: o retrato. Tingir a dimensão derivada muda os pixels **dentro** da janela e nenhum
// fora dela — o que responde às duas perguntas de uma vez: o retrato está onde tem de estar (T10) e
// não sai da moldura (T12). A duas distâncias, e com um controlo que prova que a medição não é vazia.
export async function checkPortrait(options = {}) {
  const sceneEl = document.querySelector('a-scene');
  const cameraEl = sceneEl.querySelector('a-camera');
  const gl = sceneEl.renderer.getContext();
  const camera = cameraEl.components.camera.camera;
  const guardado = cameraEl.object3D.position.clone();
  const state = window.portalDebug.state;
  const distancias = options.distancias || [12, 30];
  const portas = state.portals.filter((p) => p.data.previewDimension > 0);
  const resultados = [];

  for (const porta of portas) {
    const entradas = state.dimensions[porta.data.previewDimension] || [];
    const entrada = entradas.find((e) => e.material && e.material.map) || entradas[0];
    if (!entrada || !entrada.material) continue;
    const corOriginal = entrada.material.color.getHex();
    const mundo = new THREE.Vector3();
    porta.el.object3D.getWorldPosition(mundo);
    for (const distancia of distancias) {
      cameraEl.object3D.position.set(mundo.x, mundo.y + porta.data.height / 2, mundo.z + distancia);
      await proximoFrame();
      const janela = rectDaJanela(porta, camera, gl);
      const moldura = rectDaMoldura(porta, camera, gl);
      desenhar(sceneEl, camera);
      const antes = lerTudo(gl);
      entrada.material.color.setHex(0xff00ff);
      await proximoFrame();
      desenhar(sceneEl, camera);
      const tingido = lerTudo(gl);
      entrada.material.color.setHex(corOriginal);
      await proximoFrame();
      const dentroDaJanela = contarMudancas(antes, tingido, janela).dentroMuda;
      const foraDaMoldura = contarFora(antes, tingido, moldura || janela);
      resultados.push({
        porta: porta.data.id,
        derivada: porta.data.previewDimension,
        distancia: distancia,
        // T10: o retrato tingido muda os pixéis dentro da janela (o retrato está lá).
        mudadosDentroDaJanela: dentroDaJanela,
        // T12: e não muda nenhum fora da moldura (o retrato não sai de lá).
        mudadosForaDaMoldura: foraDaMoldura,
        janela: janela.bruto,
        moldura: moldura ? moldura.bruto : null,
        passou: dentroDaJanela > 0 && foraDaMoldura === 0
      });
    }
  }
  cameraEl.object3D.position.copy(guardado);
  await proximoFrame();
  return resultados;
}

// T2 e T3: a varredura de poses, que já vive no seu instrumento. Aqui só se chama, para a bateria
// ter os doze testes no mesmo relatório.
export async function checkFrameSweep(options = {}) {
  const modulo = await import('/tools/regression/pose-sweep.mjs');
  const r = await modulo.runPoseSweep(options.sweep || {});
  return {
    poses: r.poses,
    amostras: r.samples,
    controlos: r.controls,
    veredicto: r.verdict,
    ms: Math.round(r.durationMs),
    passou: r.verdict.T2 === 'pass' && r.verdict.T3 === 'pass'
  };
}

// T8: a consola, lida da sonda da sessão (que tem de estar instalada antes da carga). O número de
// ouvintes vem da contagem de **vivos** deste instrumento: a sonda conta chamadas, e o DOM deduplica.
export function checkConsole() {
  const vivos = {
    tecladoNoDocumento: liveListeners(document, 'keydown'),
    ouvintesNoDocumento: liveListeners(document),
    ouvintesNaJanela: liveListeners(window)
  };
  const sonda = window.__probe;
  if (!sonda) return { vivos: vivos, erro: 'sem sonda instalada antes da carga (o T8 mede-se de fora)' };
  return {
    erros: sonda.errors,
    avisos: sonda.warnings,
    pedidosFalhados: sonda.failedRequests,
    chamadasDeTeclado: sonda.keydown,
    vivos: vivos,
    passou: sonda.errors.length === 0 && sonda.warnings.length === 0 && sonda.failedRequests.length === 0
  };
}

// A bateria. Cada teste corre em separado e um erro num não leva os outros com ele.
export async function runAcceptance(options = {}) {
  const quais = options.quais || ['T4', 'T5', 'T6', 'T9', 'T10', 'T12', 'T2', 'T3', 'T8'];
  const relatorio = { mundo: window.portalDebug.world, url: location.pathname + location.search, testes: {} };

  const proteger = async (nome, fn) => {
    try { relatorio.testes[nome] = await fn(); } catch (error) { relatorio.testes[nome] = { erro: String(error && error.message || error) }; }
  };

  if (quais.includes('T8')) relatorio.testes.T8 = checkConsole();
  if (quais.includes('T4')) {
    const state = window.portalDebug.state;
    const porta = state.portals.find((p) => p.data.windowKind === 'preview') || state.portals[0];
    await proteger('T4', () => checkWindow(porta.data.id));
  }
  if (quais.includes('T5')) await proteger('T5', () => checkStackedDoors(options.t5 || {}));
  if (quais.includes('T6')) await proteger('T6', () => checkArtworkClick(options.t6 || {}));
  if (quais.includes('T9')) await proteger('T9', () => checkPortalCycle(options.t9 || {}));
  if (quais.includes('T10') || quais.includes('T12')) await proteger('T10_T12', () => checkPortrait(options.retrato || {}));
  if (quais.includes('T2') || quais.includes('T3')) await proteger('T2_T3', () => checkFrameSweep(options.varredura || {}));

  console.table(Object.entries(relatorio.testes).map(([nome, r]) => ({ teste: nome, passou: r.passou === undefined ? '?' : (r.passou ? 'sim' : 'NAO') })));
  return relatorio;
}
