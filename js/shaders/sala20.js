// Habitar — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala20",
  name: "Habitar",
  body: `// Habitar — um interior visto de dentro, sem nada pendurado na parede: o chão de tábuas em perspectiva,
// a parede de cal com grão fino e uma faixa de luz de porta que atravessa a sala e anda devagar.
//
// **O chão conta-se em coordenadas de mundo, não em \`volta\`.** Duas razões, as duas medidas:
//   · as juntas de uma tábua são rectas no plano do chão, e em \`volta\`/\`profundidade\` o que sai são
//     arcos à volta do visitante — um lago, não um soalho;
//   · \`sin(volta * 30.0)\` não fecha na emenda da esfera (D82): 30 não é um número inteiro de voltas, e
//     ficava uma costura vertical no chão, exactamente à frente de quem entra. \`sin(az)\`/\`cos(az)\` não
//     têm esse problema porque dão a volta inteira.
  // O rodapé é o horizonte: acima é parede, abaixo é chão.
  float chao = smoothstep(0.006, -0.006, el);
  // A distância ao chão, em alturas de olho: a projecção do plano é \`1/tan(-el)\` (a cotangente), e não
  // \`1/(-el)\` — com o \`1/(-el)\` as rectas do soalho entortavam e convergiam nos pés do visitante.
  float profundidade = 1.0 / max(tan(-el), 0.045);
  vec2 chaoP = vec2(sin(az), -cos(az)) * profundidade;
  // As tábuas: uma junta a cada 0,45 alturas no sentido do olhar, e travessas a cada 1,1.
  float aoLongo = smoothstep(0.470, 0.500, abs(fract(chaoP.x * 2.2) - 0.5));
  float aTravessar = smoothstep(0.455, 0.500, abs(fract(chaoP.y * 0.9) - 0.5));
  float junta = max(aoLongo, aTravessar);
  float veio = noise(vec2(chaoP.x * 1.8, chaoP.y * 9.0));
  // Ao longe as células ficam mais pequenas do que um pixel: sem este desvanecimento o horizonte
  // enchia-se de moiré — grão onde devia haver soalho. O corte é cedo (3 a 9 alturas de olho) porque é
  // exactamente aí que o detalhe deixa de ser resolúvel.
  float longe = smoothstep(3.0, 9.0, profundidade);
  veio = mix(veio, 0.5, longe);
  junta *= 1.0 - longe;
  vec3 madeira = vec3(0.095, 0.066, 0.046) + vec3(0.048, 0.032, 0.019) * veio;
  madeira *= 1.0 - 0.55 * junta;
  // A aresta da tábua apanha luz: uma linha clara do lado de dentro da junta.
  madeira += vec3(0.07, 0.055, 0.042) * smoothstep(0.430, 0.470, abs(fract(chaoP.x * 2.2) - 0.5)) * (1.0 - junta);
  // O chão escurece ao longe: sem isto o horizonte virava uma névoa clara.
  madeira *= 1.0 - 0.45 * smoothstep(0.55, 0.02, -el);
  // A parede de cal, quente e escura, com grão fino e o rodapé como uma linha clara.
  float grao = noise3(d * 26.0);
  vec3 cal = vec3(0.105, 0.084, 0.066) * (0.88 + 0.16 * grao);
  cal += vec3(0.13, 0.12, 0.10) * smoothstep(0.004, 0.0, abs(el - 0.016) - 0.004);
  col = mix(cal, madeira, chao);
  // A faixa de luz que entra pela porta: estreita, e anda à volta da sala (duas por volta, inteiro).
  float onde = fract(volta * 2.0 + uTime * 0.020);
  float faixa = smoothstep(0.26, 0.06, abs(onde - 0.5));
  float luz = faixa * (0.30 + 0.70 * smoothstep(-0.25, 0.50, el));
  col += vec3(0.38, 0.42, 0.46) * luz * 0.42;
  // A luz que cai no chão: só dentro da faixa, e a passar pelo verniz das tábuas.
  col += vec3(0.26, 0.22, 0.17) * chao * smoothstep(0.55, 1.0, veio) * faixa * 0.55;
  // A poeira: grãos redondos e pequenos a subir, em células quadradas em ângulo (50 colunas, 8 linhas:
  // o eixo horizontal vale 2π radianos por volta e o vertical 1 por unidade), e só à luz da faixa.
  vec2 grade = vec2(volta * 50.0, el * 8.0 - uTime * 0.20);
  vec2 desvio = fract(grade) - 0.5;
  vec2 emRadianos = vec2(desvio.x * 0.1257, desvio.y * 0.1250);
  vec2 celula = vec2(mod(floor(grade.x), 50.0), floor(grade.y) + 7.0);
  float po = smoothstep(0.014, 0.005, length(emRadianos)) * step(0.88, hash(celula));
  col += vec3(0.85, 0.80, 0.70) * po * luz * 1.6;
  // O teto escurece: a sala fecha-se em cima.
  col *= 0.72 + 0.28 * smoothstep(-0.95, 0.50, el);`
};
