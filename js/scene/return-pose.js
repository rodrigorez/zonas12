// De onde o visitante veio, quando abre a ficha de uma obra (D63).
//
// O autor reparou no que qualquer visitante repara: abrir uma obra e voltar punha a câmara **no ponto
// de partida do mundo**, e não onde ele estava. A obra pode estar a dez metros dali; voltar ao início
// obriga a caminhar outra vez até ao sítio onde estava a olhar.
//
// O que se guarda é o **ponto de vista**: a posição, o olhar (yaw e pitch) e a dimensão activa —
// porque a obra pode estar na dimensão 1 e voltar para a 0 seria voltar a outro sítio. Fica em
// `sessionStorage`, que é do separador e morre com ele: não é uma preferência, é a memória de um
// gesto. A leitura é **explícita** (`?volta=1`, o que a ficha escreve no «voltar») e tem prazo: uma
// sessão aberta de ontem não devolve ninguém a meio de uma sala.
//
// O mundo é entregue pelo construtor (`setReturnWorld`), como o `setWorld` das portas: este módulo não
// lê o dado nem adivinha o slug a partir do caminho.
export const RETURN_KEY = 'zonas12.volta';
export const RETURN_PARAMETER = 'volta';
const MAX_AGE_MS = 30 * 60 * 1000;

let worldSlug = null;

export function setReturnWorld(slug) {
  worldSlug = typeof slug === 'string' && slug !== '' ? slug : null;
}

// Um ponto de vista, como a câmara o dá: `position` em metros, `yaw`/`pitch` em graus (é o que o
// A-Frame lê e escreve na rotação) e a dimensão em que o visitante estava.
export function rememberPose({ position, yaw, pitch, dimension }) {
  if (!worldSlug) return false;
  if (!Array.isArray(position) || position.length !== 3) return false;
  try {
    sessionStorage.setItem(RETURN_KEY, JSON.stringify({
      world: worldSlug,
      position: [Number(position[0]), Number(position[1]), Number(position[2])],
      yaw: Number(yaw) || 0,
      pitch: Number(pitch) || 0,
      dimension: Number.isInteger(dimension) ? dimension : 0,
      when: Date.now()
    }));
    return true;
  } catch (error) {
    // Um browser que recusa o `sessionStorage` (modo privado antigo) não pode partir a exposição: sem
    // memória, a obra abre-se na mesma e o «voltar» cai onde caía antes.
    return false;
  }
}

// O ponto guardado para **este** mundo, se ainda valer a pena. Lê e apaga: um regresso por cada
// abertura, para uma recarga posterior não saltar para um sítio que já não é o que o visitante deixou.
export function takePose(world) {
  if (typeof world !== 'string' || world === '') return null;
  let saved = null;
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    if (!raw) return null;
    saved = JSON.parse(raw);
  } catch (error) {
    return null;
  }
  forgetPose();
  if (!saved || saved.world !== world) return null;
  if (!Array.isArray(saved.position) || saved.position.length !== 3) return null;
  if (!Number.isFinite(saved.when) || Date.now() - saved.when > MAX_AGE_MS) return null;
  if (saved.position.some((value) => !Number.isFinite(value))) return null;
  return {
    position: saved.position,
    yaw: Number(saved.yaw) || 0,
    pitch: Number(saved.pitch) || 0,
    dimension: Number.isInteger(saved.dimension) ? saved.dimension : 0
  };
}

export function forgetPose() {
  try {
    sessionStorage.removeItem(RETURN_KEY);
  } catch (error) {
    // nada a fazer: não havia memória para esquecer
  }
}

// O que está guardado agora, para a sonda e os instrumentos lerem sem mexer.
export function savedPose() {
  try {
    const raw = sessionStorage.getItem(RETURN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}
