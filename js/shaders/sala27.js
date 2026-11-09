// sala27 — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala27",
  name: "Quem Nos Olha",
  body: `// Quem nos olha — um olho no fundo da sala, à frente de quem entra (azimute -171): a íris em anéis,
// a pupila que segue o visitante e, no resto do campo, outros pontos que também olham.
  vec3 olho = normalize(vec3(-0.156, 0.14, 0.988));
  float ang = acos(clamp(dot(d, olho), -1.0, 1.0));
  float esclerotica = smoothstep(0.30, 0.28, ang);
  float iris = smoothstep(0.165, 0.150, ang);
  float aneis = 0.5 + 0.5 * sin(ang * 260.0 - uTime * 0.8);
  // A pupila desloca-se para o lado do campo de onde o visitante olha: o olho segue, devagar.
  vec3 desvio = normalize(olho + vec3(azim.x, 0.0, azim.y) * 0.055);
  float pupila = smoothstep(0.068, 0.055, acos(clamp(dot(d, desvio), -1.0, 1.0)));
  col = vec3(0.010, 0.016, 0.028) + vec3(0.025, 0.045, 0.070) * (1.0 - clamp(el, 0.0, 1.0));
  col += vec3(0.62, 0.68, 0.74) * esclerotica * 0.40;
  col += mix(vec3(0.10, 0.32, 0.52), vec3(0.26, 0.56, 0.70), aneis) * iris * 0.80;
  col = mix(col, vec3(0.006, 0.006, 0.012), pupila);
  // Os outros olhos: pontos vermelhos no resto da sala, a piscar fora de tempo.
  vec2 celula = vec2(mod(floor(volta * 30.0), 30.0), floor(el * 22.0) + 5.0);
  float semente = hash(celula);
  float ponto = smoothstep(0.055, 0.0, length(fract(vec2(volta * 30.0, el * 22.0)) - 0.5));
  col += vec3(0.80, 0.22, 0.22) * ponto * step(0.94, semente) *
    (0.60 + 0.40 * sin(uTime * 1.6 + semente * 20.0));`
};
