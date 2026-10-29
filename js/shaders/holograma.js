// Holograma — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "holograma",
  name: "Holograma",
  body: `// Holograma: um mundo feito de linhas. O visitante está **dentro** da grelha — meridianos e paralelos
// a fecharem-se em anel em volta dele —, o chão afasta-se em perspectiva e uma faixa de varrimento
// sobe devagar, como um scanner.
//
// As linhas contam-se em \`az\` e em \`el\`, não em pixels: sem \`fwidth\` (e não há derivadas num
// fragmento *mediump* sem extensão) a espessura é fixa, e por isso os paralelos ficam mais juntos ao
// pé do horizonte — que é exactamente o que uma grelha em perspectiva faz.
//
// Os smoothstep sobem sempre (aresta menor primeiro) e um \`1.0 -\` faz o resto: a ordem das arestas
// invertidas não é definida em GLSL, e há drivers que a leem ao contrário.

// A malha da esfera: 24 meridianos e 12 paralelos. A conta de \`az\` fecha no fim da volta (2PI), e a de
// \`el\` nos dois polos (PI).
float mer = abs(fract(az / (2.0 * PI) * 24.0 + 0.5) - 0.5);
float par = abs(fract(el / PI * 12.0 + 0.5) - 0.5);
float linhaMer = 1.0 - smoothstep(0.0, 0.028, mer);
float linhaPar = 1.0 - smoothstep(0.0, 0.028, par);

// O chão: a mesma malha projectada. A profundidade é 1/|el| (o piso é o plano de baixo), e é ela que
// faz as linhas convergirem; o \`uTime\` corre na direcção do afastamento, para a grelha caminhar sob os
// pés em vez de ficar colada.
float prof = 1.0 / max(-el, 0.02);
float gx = abs(fract(az * 2.6 * prof * 0.10) - 0.5);
float gz = abs(fract(prof * 0.55 - uTime * 0.30) - 0.5);
float linhaChao = 1.0 - smoothstep(0.0, 0.055, gx);
linhaChao = max(linhaChao, 1.0 - smoothstep(0.0, 0.055, gz));
// O chão só existe abaixo do horizonte, e desvanece longe (é a distância que o apaga, não uma cor).
float piso = smoothstep(0.0, -0.03, el) + 1.0 - smoothstep(0.0, 0.03, -el);
linhaChao *= clamp(piso, 0.0, 1.0) * (1.0 - smoothstep(6.0, 26.0, prof));

// O varrimento: uma faixa horizontal que sobe e desce, com o núcleo muito mais claro que a cauda.
float faixa = sin(el * 3.2 - uTime * 1.15) * 0.5 + 0.5;
float nucleo = pow(faixa, 26.0);

// As cores: azul-noite no fundo, turquesa nas linhas, e o varrimento a acender o que atravessa.
vec3 fundo = mix(vec3(0.030, 0.055, 0.080), vec3(0.006, 0.014, 0.030), smoothstep(-0.5, 1.0, el));
vec3 linha = vec3(0.10, 0.58, 0.70);
float malha = max(linhaMer, linhaPar) * 0.55 + linhaChao * 0.55;
col = fundo + linha * malha;
col += vec3(0.34, 0.92, 1.00) * nucleo * (0.20 + malha * 0.90);

// O horizonte, onde o chão encontra a esfera: um traço aceso que segura a composição.
col += vec3(0.18, 0.74, 0.86) * (1.0 - smoothstep(0.0, 0.022, abs(el))) * 0.30;`
};
