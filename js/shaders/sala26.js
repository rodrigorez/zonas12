// Solidão em Rede — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala26",
  name: "Solidão em Rede",
  body: `// Solidão em rede — nós de luz a **subir** no escuro, em duas camadas (a de trás mais lenta e mais
// fraca), fios quase invisíveis e um só nó que nunca se apaga, à frente de quem entra (azimute -171).
//
// As células têm de ser **quadradas em ângulo**: o eixo horizontal (\`volta\`) vale 2π radianos por
// volta, o vertical (\`polar\`) vale 1 radiano por unidade. Por isso o número de colunas é 2π vezes o de
// linhas — com 18 colunas e 9 linhas a célula saía com o triplo da largura e os nós eram elipses.
  float polar = acos(clamp(d.y, -1.0, 1.0));
  // Camada de trás: células de ~19°, mais lenta e mais apagada.
  vec2 gradeB = vec2(volta * 19.0 + 3.0, polar * 3.0 + uTime * 0.16);
  vec2 dentroB = fract(gradeB) - 0.5;
  vec2 radB = vec2(dentroB.x * 0.3307, dentroB.y * 0.3333);
  vec2 celulaB = vec2(mod(floor(gradeB.x), 19.0), floor(gradeB.y));
  float noB = smoothstep(0.055, 0.020, length(radB)) * step(0.52, hash(celulaB));
  // Camada da frente: células de ~12,7°, a subir depressa, e é a que traz os fios.
  vec2 grade = vec2(volta * 28.0, polar * 4.5 + uTime * 0.50);
  vec2 dentro = fract(grade) - 0.5;
  vec2 emRadianos = vec2(dentro.x * 0.2244, dentro.y * 0.2222);
  vec2 celula = vec2(mod(floor(grade.x), 28.0), floor(grade.y));
  float semente = hash(celula);
  // Núcleo aceso e halo à volta: um nó de luz lê-se melhor com os dois do que com um disco mole.
  float nucleo = smoothstep(0.014, 0.004, length(emRadianos));
  float halo = smoothstep(0.048, 0.010, length(emRadianos)) * 0.35;
  float no = nucleo + halo;
  float vida = 0.55 + 0.45 * sin(uTime * 0.9 + semente * 30.0);
  col = vec3(0.006, 0.012, 0.028) + vec3(0.018, 0.038, 0.080) * (1.0 - clamp(el, 0.0, 1.0));
  col += vec3(0.55, 0.85, 1.00) * no * step(0.40, semente) * vida * 0.90;
  col += vec3(0.22, 0.40, 0.55) * noB * 0.30;
  // Os fios: linhas fracas que ligam as células de uma mesma fila — a rede que existe, mal.
  float fio = smoothstep(0.007, 0.0, abs(emRadianos.y)) * step(0.76, hash(vec2(celula.x, celula.y + 9.0)));
  col += vec3(0.08, 0.20, 0.30) * fio * 0.30;
  // O solitário: um nó mais quente, sempre aceso, parado à frente da chegada — é o que não sobe.
  float perto = smoothstep(0.115, 0.0, acos(clamp(dot(d, normalize(vec3(-0.156, 0.02, 0.988))), -1.0, 1.0)));
  col += vec3(1.00, 0.66, 0.34) * perto * 0.75;
  col *= 0.88 + 0.12 * smoothstep(-1.20, 0.60, el);`
};
