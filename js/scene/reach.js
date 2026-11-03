// O alcance de uma porta em movimento (D87, lei L29) — uma casa só para a conta.
//
// Porque existe: o sorteio do movimento (tools/scene/sorteio.mjs) tem de recusar um sorteio que deixe
// a porta fora do alcance do visitante, e o validador tem de provar do **dado** que o ficheiro não foi
// editado depois. Duas cópias da conta dariam dois números — a mesma razão por que `arrival.js` e
// `ring.js` existem.
//
// O que se mede: a fracção do ciclo em que o **olho do visitante** (1,6 m) fica dentro da caixa de
// colisão, caminhando de frente para a porta ao longo da normal dela. O modelo é conservador de
// propósito: quem chega de esguelha alcança mais, ninguém alcança menos.
//
// Duas fases, não uma. Com dois períodos independentes (translação e rotação) o movimento não tem um
// ciclo único: o par de fases (φt, φr) percorre o toro. Por isso a amostra é uma grelha 2D — é o que
// a média longa converge a fazer, sem depender de os dois períodos serem comensuráveis.
//
// A conta é a do `js/modules/portal.js`, incluindo a composição de Euler (ordem XYZ) que o A-Frame
// escreve: uma rotação somada no `axis` entra **no espaço do pai** e é composta com a rotação do dado.
// Foi por isso que uma porta virada (com yaw no anel) não tomba sobre o mesmo eixo que uma porta de
// frente — e é por isso que a lei é calculada **por porta**, e não de uma tabela.

const GRAU = Math.PI / 180;
export const OLHO = 1.6;
export const ALCANCE_MINIMO = 50;
const AMOSTRAS_POR_FASE = 30;
const AMOSTRAS_POR_SEMEAR = 24;
const PASSOS = 40;
const PASSO = 0.1;

// A matriz de rotação de um Euler XYZ, como a escreve o three.js (`Matrix4.makeRotationFromEuler`).
// Devolve uma matriz 3x3 em linhas.
export function eulerXYZ(x, y, z) {
  const c1 = Math.cos(x), c2 = Math.cos(y), c3 = Math.cos(z);
  const s1 = Math.sin(x), s2 = Math.sin(y), s3 = Math.sin(z);
  return [
    [c2 * c3, -c2 * s3, s2],
    [c1 * s3 + s1 * s2 * c3, c1 * c3 - s1 * s2 * s3, -s1 * c2],
    [s1 * s3 - c1 * s2 * c3, s1 * c3 + c1 * s2 * s3, c1 * c2]
  ];
}

const aplicar = (m, v) => [
  m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
  m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
  m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]
];
const multiplicar = (a, b) => [0, 1, 2].map((i) =>
  [0, 1, 2].map((j) => a[i][0] * b[0][j] + a[i][1] * b[1][j] + a[i][2] * b[2][j]));
const transposta = (m) => [0, 1, 2].map((i) => [0, 1, 2].map((j) => m[j][i]));

const eixoDa = (vec, padrao) => {
  const valor = Array.isArray(vec) ? vec : padrao;
  return [Number(valor[0]) || 0, Number(valor[1]) || 0, Number(valor[2]) || 0];
};

// A pose do dado e o movimento que ele declara, já em números. Tolerante: um campo que falte cai no
// valor por omissão do esquema, para a lei poder correr sobre um dado a meio de ser escrito.
export function movimentoDaPorta(portal) {
  const motion = (portal && portal.motion) || {};
  if (motion.kind !== 'sway') return null;
  const rotacao = eixoDa(portal.rotation, [0, 0, 0]).map((valor) => valor * GRAU);
  return {
    posicao: eixoDa(portal.position, [0, 0, 0]),
    rotacao,
    caixa: eixoDa(portal.box, [1, 1, 1]),
    caixaEm: eixoDa(portal.boxPosition, [0, 0, 0]),
    altura: typeof portal.height === 'number' ? portal.height : 16,
    eixoTranslacao: eixoDa(motion.axis, [0, 1, 0]),
    amplitude: typeof motion.amplitude === 'number' ? motion.amplitude : 0,
    eixoRotacao: eixoDa(motion.rotationAxis || motion.axis, [0, 1, 0]),
    angulo: (typeof motion.angle === 'number' ? motion.angle : 0) * GRAU
  };
}

// A caixa num instante: centro e meia-extensão no mundo, e a rotação que a orienta. A caixa roda com a
// porta (é a mesma matriz), e o pivô é o centro da porta — a metade da altura, no plano da janela.
//
// **Os eixos são os da porta, não os do mundo.** A oscilação é composta à direita da rotação do dado
// (`R = R_dado · R_oscilação`) e a translação é levada pela rotação do dado. É o que faz uma porta
// virada rodar como uma porta de frente; com os eixos do mundo, a mesma "rotação em X" numa porta de
// yaw −90° girava-a no próprio plano em vez de a tombar — medido, e a razão de metade das portas do
// anel passar a lei sem fazer nada.
export function poseNoInstante(mov, faseTranslacao, faseRotacao) {
  const seno = Math.sin(faseTranslacao * Math.PI * 2);
  const senoRotacao = Math.sin(faseRotacao * Math.PI * 2);
  const pivo = [0, mov.altura / 2, 0];
  const rotacaoDado = eulerXYZ(mov.rotacao[0], mov.rotacao[1], mov.rotacao[2]);
  const rotacaoOscilacao = eulerXYZ(
    senoRotacao * mov.angulo * mov.eixoRotacao[0],
    senoRotacao * mov.angulo * mov.eixoRotacao[1],
    senoRotacao * mov.angulo * mov.eixoRotacao[2]
  );
  const rotacaoAgora = multiplicar(rotacaoDado, rotacaoOscilacao);
  const deslocamento = aplicar(rotacaoDado, [0, 1, 2].map(
    (k) => seno * mov.amplitude * mov.eixoTranslacao[k]));
  const pivoRepouso = aplicar(rotacaoDado, pivo);
  const pivoAgora = aplicar(rotacaoAgora, pivo);
  const posicao = [0, 1, 2].map((k) =>
    mov.posicao[k] + deslocamento[k] + pivoRepouso[k] - pivoAgora[k]);
  const centro = [0, 1, 2].map((k) => posicao[k] + pivoAgora[k]);
  return { rotacao: rotacaoAgora, posicao, centro };
}

const dentroDaCaixa = (mov, pose, ponto) => {
  const local = aplicar(transposta(pose.rotacao), [0, 1, 2].map((k) => ponto[k] - pose.posicao[k]));
  return [0, 1, 2].every((k) => Math.abs(local[k] - mov.caixaEm[k]) <= mov.caixa[k] / 2);
};

// A caminhada do visitante: de 1,5 m antes do centro da porta a 2,5 m depois, ao longo da normal dela,
// com o olho a 1,6 m. A normal sai da rotação do instante — o visitante vai de frente para a porta
// onde ela está, que é o que o T1 faz e o que o público faz.
function alcancaNoInstante(mov, pose) {
  const frente = aplicar(pose.rotacao, [0, 0, 1]);
  for (let passo = 0; passo <= PASSOS; passo++) {
    const d = -1.5 + passo * PASSO;
    const ponto = [
      pose.centro[0] + frente[0] * d,
      OLHO,
      pose.centro[2] + frente[2] * d
    ];
    if (dentroDaCaixa(mov, pose, ponto)) return true;
  }
  return false;
}

// A fracção do ciclo (0 a 100) em que o visitante alcança a porta. Sem movimento declarado, é 100: uma
// porta parada está sempre onde o dado diz.
export function alcanceDaPorta(portal, opcoes = {}) {
  const mov = movimentoDaPorta(portal);
  if (!mov) return { percentagem: 100, amostras: 0, movel: false };
  const n = opcoes.amostras || AMOSTRAS_POR_FASE;
  let dentro = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const pose = poseNoInstante(mov, i / n, j / n);
      if (alcancaNoInstante(mov, pose)) dentro++;
    }
  }
  return { percentagem: (100 * dentro) / (n * n), amostras: n * n, movel: true };
}

// O ponto de chegada (`arrival.js`) fica a meia profundidade da caixa + 0,5 m à frente da porta, na
// pose do **dado**, e não se mexe: é onde o visitante aparece. A caixa em movimento pode passar por
// cima dele. Não é uma lei — a travessia passou a exigir que o visitante ande (D87) —, mas é o número
// que diz quanto trabalho essa exigência tem, e é o que a documentação cita.
export function chegadaVarrida(portal, opcoes = {}) {
  const mov = movimentoDaPorta(portal);
  if (!mov) return { percentagem: 0, amostras: 0 };
  const n = opcoes.amostras || AMOSTRAS_POR_SEMEAR;
  const distancia = mov.caixa[2] / 2 + 0.5;
  const yaw = mov.rotacao[1];
  const chegada = [
    mov.posicao[0] + Math.sin(yaw) * distancia,
    OLHO,
    mov.posicao[2] + Math.cos(yaw) * distancia
  ];
  let dentro = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (dentroDaCaixa(mov, poseNoInstante(mov, i / n, j / n), chegada)) dentro++;
    }
  }
  return { percentagem: (100 * dentro) / (n * n), amostras: n * n };
}
