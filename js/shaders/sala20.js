// Habitar — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala20",
  name: "Habitar",
  body: `// Habitar — um interior visto de dentro, sem nada pendurado na parede: o chão de tábuas em perspectiva,
// a parede de cal com grão fino e uma faixa de luz de porta que atravessa a sala e anda devagar.
// Tudo analítico e de bordo apertado: nada de manchas moles.
//
// A poeira conta-se em células **quadradas em ângulo**: o eixo horizontal vale 2π radianos por volta e o
// vertical 1 radiano por unidade, por isso as colunas têm de ser 2π vezes as linhas (aqui 50 e 8). Com
// 60 colunas e 40 linhas os grãos saíam com o quádruplo da largura — parecia neve.
  // O rodapé é o horizonte: acima é parede, abaixo é chão. A passagem é de dois milímetros de ângulo.
  float chao = smoothstep(0.006, -0.006, el);
  // As tábuas em perspectiva: a profundidade cresce para o horizonte e as juntas convergem nele.
  float profundidade = 1.0 / max(-el, 0.045);
  float eixo = fract(profundidade * 2.6);
  float junta = smoothstep(0.006, 0.0, abs(eixo - 0.5) - 0.476);
  float veio = 0.5 + 0.5 * sin(volta * 30.0 + profundidade * 0.8);
  vec3 madeira = vec3(0.095, 0.066, 0.046) + vec3(0.045, 0.030, 0.018) * veio;
  madeira *= 1.0 - 0.62 * junta;
  madeira += vec3(0.08, 0.065, 0.050) * smoothstep(0.010, 0.0, abs(eixo - 0.5) - 0.490);
  // O chão escurece ao longe: sem isto o horizonte virava uma névoa clara.
  madeira *= 1.0 - 0.45 * smoothstep(0.55, 0.02, -el);
  // A parede de cal, quente e escura, com grão fino e o rodapé como uma linha clara.
  float grao = noise3(d * 26.0);
  vec3 cal = vec3(0.105, 0.084, 0.066) * (0.88 + 0.16 * grao);
  cal += vec3(0.13, 0.12, 0.10) * smoothstep(0.004, 0.0, abs(el - 0.016) - 0.004);
  col = mix(cal, madeira, chao);
  // A faixa de luz que entra pela porta: estreita, e anda à volta da sala.
  float onde = fract(volta * 2.0 + uTime * 0.020);
  float faixa = smoothstep(0.26, 0.06, abs(onde - 0.5));
  float luz = faixa * (0.30 + 0.70 * smoothstep(-0.25, 0.50, el));
  col += vec3(0.38, 0.42, 0.46) * luz * 0.42;
  // A luz que cai no chão: só dentro da faixa, e a passar pelo verniz das tábuas.
  col += vec3(0.26, 0.22, 0.17) * chao * smoothstep(0.55, 1.0, veio) * faixa * 0.55;
  // A poeira: grãos redondos e pequenos a subir, e só se vêem dentro da faixa de luz.
  vec2 grade = vec2(volta * 50.0, el * 8.0 - uTime * 0.20);
  vec2 dentro = fract(grade) - 0.5;
  vec2 emRadianos = vec2(dentro.x * 0.1257, dentro.y * 0.1250);
  vec2 celula = vec2(mod(floor(grade.x), 50.0), floor(grade.y) + 7.0);
  float po = smoothstep(0.014, 0.005, length(emRadianos)) * step(0.88, hash(celula));
  col += vec3(0.85, 0.80, 0.70) * po * luz * 1.6;
  // O teto escurece: a sala fecha-se em cima.
  col *= 0.72 + 0.28 * smoothstep(-0.95, 0.50, el);`
};
