// A construção das portas de um mundo, numa casa só (D96, M3).
//
// Porque existe: uma porta de mundo tem quatro bocados que têm de concordar — o `target`, o
// `arrivalFrom`, o retrato que a janela mostra e o recorte que a janela ao vivo precisa (D53) — e ainda
// o `shaderId` do fundo que ela desenha. Esses bocados nasciam dentro do `new-room`; a partir do momento
// em que duas ferramentas os escrevem (`new-room` na ronda da autoria, `integrar` na ronda do fecho),
// duas cópias seriam duas verdades. É a mesma razão do `disk.mjs` e do `fixtures.js`.
//
// Puro: constrói objectos, não toca no disco e não lê ficheiros.
import { RING } from '../../js/scene/ring.js';

// A caixa de colisão. É a mesma das portas todas do projeto: a travessia decide-se por ela, e uma caixa
// diferente numa porta nova é uma porta que o visitante atravessa sem querer.
export const CAIXA = { box: [12, 16, 1], boxPosition: [0, 8, 0], boxRotation: [0, 0, 0] };

export const nomePt = (cena) => (cena && cena.world && cena.world.name && cena.world.name.pt) || 'mundo';
export const nomeEn = (cena) => (cena && cena.world && cena.world.name && cena.world.name.en) || 'world';

// O shader do fundo (dimensão 0), ou `null` quando a sala tem uma imagem. É o que a janela de quem aponta
// para esta sala tem de nomear (D53: «a janela ao vivo nomeia o shader que o destino desenha»).
export function shaderDoFundo(cena) {
  const dimensao = ((cena && cena.dimensions) || []).find((cada) => cada.id === 0) || {};
  return dimensao.kind === 'shader' ? dimensao.shaderId : null;
}

export function proximoId(cena) {
  const usados = ((cena && cena.portals) || []).map((portal) => portal.id);
  let id = 0;
  while (usados.includes(id)) id++;
  return id;
}

// As duas entradas de asset que um retrato precisa: a imagem (a reserva) e o recorte (a janela ao vivo).
// O nome segue a regra D46: `assets/previews/<destino>-de-<origem>.jpg`.
export function retrato(destino, origem, cenaDoDestino) {
  const pt = nomePt(cenaDoDestino);
  const en = nomeEn(cenaDoDestino);
  return {
    [`retrato-${destino}`]: {
      path: 'assets/previews/' + destino + '-de-' + origem + '.jpg',
      type: 'image',
      alt: { pt: 'Retrato do mundo ' + pt + ', visto da porta', en: 'Portrait of the ' + en + ' world, seen from the door' }
    },
    [`recorte-${destino}-de-${origem}`]: {
      path: 'assets/previews/recorte-' + destino + '-de-' + origem + '.png',
      type: 'image',
      alt: {
        pt: 'Retrato do mundo ' + pt + ', visto da porta (recorte, para a janela ao vivo)',
        en: 'Portrait of the ' + en + ' world, seen from the door (cutout, for the live window)'
      }
    }
  };
}

export function porta({ id, position, width, height, window, target, arrivalFrom }) {
  return {
    id,
    ownedBy: 0,
    position,
    width,
    height,
    box: CAIXA.box.slice(),
    boxPosition: CAIXA.boxPosition.slice(),
    boxRotation: CAIXA.boxRotation.slice(),
    trigger: 'plane',
    frame: { color: '#ff0000', thickness: 0.3 },
    window,
    action: { kind: 'navigate', target },
    arrivalFrom,
    rotation: [0, 0, 0]
  };
}

// A porta que o **portão** ganha para uma sala nova: é por onde o visitante entra, e mostra o retrato
// dela (8 × 10 — mais pequena que as das salas, porque o portão tem uma por sala, L24).
export function portaNoPortao({ slug, cenaDaSala, id }) {
  const shader = shaderDoFundo(cenaDaSala);
  return porta({
    id,
    position: [0, 0, 0],
    width: 8,
    height: 10,
    window: {
      kind: 'preview',
      asset: 'retrato-' + slug,
      radius: 120,
      ...(shader ? { shaderId: shader } : {}),
      cutout: 'recorte-' + slug + '-de-gate'
    },
    target: slug,
    arrivalFrom: slug
  });
}

// A porta que um **destino** ganha para declarar a chegada da sala nova (L19): mostra o retrato da sala
// nova, e é atrás dela que o visitante aparece ao atravessar.
export function portaDeChegada({ slug, cenaDaSala, destino, id }) {
  const shader = shaderDoFundo(cenaDaSala);
  return porta({
    id,
    position: [0, 0, 0],
    width: 10,
    height: 12,
    window: {
      kind: 'preview',
      asset: 'retrato-' + slug,
      radius: 120,
      ...(shader ? { shaderId: shader } : {}),
      cutout: 'recorte-' + slug + '-de-' + destino
    },
    target: slug,
    arrivalFrom: slug
  });
}

// A porta que a **sala nova** ganha para voltar ao portão: a única que mostra a câmara (dimensão 1) e a
// única que se declara chegada do portão. Com `dimensionA: 0` o visitante vê o fundo, com `dimensionB: 1`
// vê o mundo real — é o que a janela `dimension-pair` faz.
export function portaDeVoltaAoPortao(id) {
  return porta({
    id,
    position: [0, 0, RING.portals.radius],
    width: 10,
    height: 12,
    window: { kind: 'dimension-pair', dimensionA: 0, dimensionB: 1 },
    target: 'gate',
    arrivalFrom: 'gate'
  });
}

// A porta que a **sala nova** ganha para um destino: mostra o retrato do destino, com o shader e o
// recorte dele (o recorte é `<destino>-de-<sala>`, porque é a vista a partir daqui).
export function portaParaDestino({ id, destino, cenaDoDestino, slug }) {
  const shader = shaderDoFundo(cenaDoDestino);
  return porta({
    id,
    position: [0, 0, 0],
    width: 10,
    height: 12,
    window: {
      kind: 'preview',
      asset: 'retrato-' + destino,
      radius: 120,
      ...(shader ? { shaderId: shader } : {}),
      cutout: 'recorte-' + destino + '-de-' + slug
    },
    target: destino,
    arrivalFrom: destino
  });
}
