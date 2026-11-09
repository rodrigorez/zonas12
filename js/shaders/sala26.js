// sala26 — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala26",
  name: "Solidão em Rede",
  body: `// Solidão em rede — nós de luz no escuro, fios que quase se vêem, e um só nó que nunca se apaga:
// o que está à frente de quem entra (azimute -171). A grelha conta-se em voltas inteiras (18).
  vec2 grade = vec2(volta * 18.0, el * 12.0);
  vec2 celula = vec2(mod(floor(grade.x), 18.0), floor(grade.y) + 3.0);
  vec2 centro = fract(grade) - 0.5;
  float semente = hash(celula);
  float no = smoothstep(0.10, 0.02, length(centro));
  float vida = 0.55 + 0.45 * sin(uTime * 0.9 + semente * 30.0);
  col = vec3(0.006, 0.012, 0.028) + vec3(0.018, 0.038, 0.080) * (1.0 - clamp(el, 0.0, 1.0));
  col += vec3(0.50, 0.82, 1.00) * no * step(0.42, semente) * vida * 0.75;
  // Os fios: linhas fracas que ligam as células de uma mesma fila — a rede que existe, mal.
  float fio = smoothstep(0.018, 0.0, abs(centro.y)) * step(0.78, hash(vec2(celula.x, celula.y + 9.0)));
  col += vec3(0.08, 0.20, 0.30) * fio * 0.30;
  // O solitário: um nó mais quente, sempre aceso, à frente da chegada.
  float perto = smoothstep(0.115, 0.0, acos(clamp(dot(d, normalize(vec3(-0.156, 0.02, 0.988))), -1.0, 1.0)));
  col += vec3(1.00, 0.66, 0.34) * perto * 0.75;
  col *= 0.88 + 0.12 * smoothstep(-1.20, 0.60, el);`
};
