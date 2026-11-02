// Onde é que a janela de uma porta tem de deixar passar o mundo real (D81).
//
// Porque existe: uma porta `dimension-pair` que mostra a dimensão `camera` não desenha nada — o
// visitante vê o **mundo real** através dela porque o canvas do renderer tem `alpha: true` e o
// `<video>` da câmara fica atrás dele. A janela de uma porta de mundo é uma **fotografia** (o retrato
// com o recorte por cima), e uma fotografia não tem câmara lá dentro: na janela via-se o fundo do
// destino através da abertura da porta, e ao chegar via-se a câmara — medido, 0,62 a 1,70 de salto na
// costura (D46) nas quatro portas em que isto acontece.
//
// O que se faz com isto: o fundo ao vivo da janela (`js/modules/dimension.js`) **descarta** os
// fragmentos que caem dentro destes retângulos, e o recorte já é transparente aí, por isso o pixel fica
// com o alfa do canvas e a câmara aparece — a mesma imagem na janela e na chegada.
//
// Puro e partilhado, como o `arrivalPoint` (L16): a ferramenta que escreve o dado
// (`tools/scene/reality.mjs --aplicar`) e a lei que o prova (L28) usam esta conta, e o componente lê o
// que ela escreveu — não há duas geometrias.
//
// O referencial é o do **mundo de destino**: azimute e elevação a partir do ponto de chegada, que é
// exactamente o referencial em que o retrato foi cozido (a câmara do cubo é alinhada com os eixos do
// mundo). É também o referencial em que o shader da esfera vê o `vDir`, medido na janela da porta 7 da
// sala 3 (o retângulo caiu sobre a abertura da porta 5 da sala 2).
import { arrivalPoint } from './arrival.js';

// Quantos buracos o shader sabe descartar (o tamanho do `uniform vec4 uHoles[4]`).
export const REALITY_LIMIT = 4;

// A dimensão em que a página de um mundo começa (`state.activeDimension`, e o editor também escolhe
// `ids[0]`): é ela que decide qual das duas dimensões de um par a porta mostra.
const ACTIVE_DIMENSION = 0;

const DEGREES = Math.PI / 180;

// O olho do visitante, do dado do mundo (a mesma altura com que `arrivalPoint` coloca a chegada).
const eyeHeight = (scene) => {
  const position = scene && scene.cameras && scene.cameras.player && scene.cameras.player.position;
  return Array.isArray(position) && typeof position[1] === 'number' ? position[1] : 1.6;
};

// Os quatro cantos da **abertura** (a máscara, que sobe meia altura: portal.js,
// `maskMesh.position.set(0, h / 2, 0)`), no espaço do mundo.
function apertureCorners(portal) {
  const position = Array.isArray(portal.position) ? portal.position : [0, 0, 0];
  const width = typeof portal.width === 'number' ? portal.width : 12;
  const height = typeof portal.height === 'number' ? portal.height : 16;
  const yaw = Array.isArray(portal.rotation) && typeof portal.rotation[1] === 'number'
    ? portal.rotation[1] * DEGREES
    : 0;
  const right = [Math.cos(yaw), 0, -Math.sin(yaw)];
  const centre = [position[0], position[1] + height / 2, position[2]];
  const corners = [];
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      corners.push([
        centre[0] + right[0] * (width / 2) * sx,
        centre[1] + (height / 2) * sy,
        centre[2] + right[2] * (width / 2) * sx
      ]);
    }
  }
  return corners;
}

// O azimute e a elevação de um ponto visto de outro, em graus — a mesma convenção da cena (θ a partir
// de −Z, `atan2(x, −z)`) e do shader (`az`, `el` no preâmbulo dos fundos).
function angles(from, to) {
  const x = to[0] - from[0];
  const y = to[1] - from[1];
  const z = to[2] - from[2];
  const distance = Math.hypot(x, y, z) || 1;
  return {
    az: Math.atan2(x, -z) / DEGREES,
    el: Math.asin(Math.max(-1, Math.min(1, y / distance))) / DEGREES
  };
}

const round = (value) => Math.round(value * 100) / 100;

// Os retângulos de realidade de um mundo, para quem chega de `fromSlug`. Vazio quando o mundo não tem
// porta de chegada daí (a L19 é que responde a isso) ou quando nenhuma porta mostra a câmara.
export function realityHoles(scene, fromSlug) {
  if (!scene) return [];
  const portals = scene.portals || [];
  const arrivalDoor = portals.find((portal) => portal.arrivalFrom === fromSlug);
  if (!arrivalDoor) return [];
  const place = arrivalPoint(arrivalDoor, eyeHeight(scene)).position;
  const dimensions = scene.dimensions || [];

  const holes = [];
  for (const portal of portals) {
    const window = portal.window || {};
    if (window.kind !== 'dimension-pair') continue;
    // A porta por onde se chega não é buraco nenhum: é a porta que o visitante tem **atrás de si** ao
    // chegar, e ela já não entra na fotografia (D79) — o retrato e o recorte não têm nada lá.
    if (portal.arrivalFrom === fromSlug) continue;
    let shown = null;
    if (ACTIVE_DIMENSION === window.dimensionA) shown = window.dimensionB;
    else if (ACTIVE_DIMENSION === window.dimensionB) shown = window.dimensionA;
    if (shown === null) continue;
    const dimension = dimensions.find((entry) => entry.id === shown);
    if (!dimension || dimension.kind !== 'camera') continue;
    const corners = apertureCorners(portal).map((corner) => angles(place, corner));
    const az = corners.map((corner) => corner.az);
    const el = corners.map((corner) => corner.el);
    holes.push({
      az0: round(Math.min(...az)),
      el0: round(Math.min(...el)),
      az1: round(Math.max(...az)),
      el1: round(Math.max(...el))
    });
  }
  return holes;
}

// Compara dois conjuntos de retângulos com a tolerância do dado redondo (duas casas decimais).
export function sameHoles(one, other) {
  if (!Array.isArray(one) || !Array.isArray(other)) return false;
  if (one.length !== other.length) return false;
  return one.every((hole, i) => ['az0', 'el0', 'az1', 'el1'].every(
    (key) => Math.abs((Number(hole[key]) || 0) - (Number(other[i][key]) || 0)) <= 0.011
  ));
}
