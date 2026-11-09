// Matéria Frágil — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala21",
  name: "Matéria Frágil",
  body: `// Matéria frágil — porcelana vista de perto: o esmalte com o seu veio, poucos cabelos de crack mas
// longos, e o brilho rasante que o esmalte devolve. Tudo na direção, sem coordenada que salte (D82).
  float esmalte = noise3(d * 3.0);
  float cabelo = abs(noise3(d * 13.0 + vec3(0.0, uTime * 0.015, 0.0)) - 0.5);
  float crack = smoothstep(0.024, 0.006, cabelo);
  float veio = smoothstep(0.05, 0.02, abs(noise3(d * 7.0 + vec3(uTime * 0.01, 0.0, 0.0)) - 0.5));
  vec3 porcelana = vec3(0.38, 0.44, 0.42) * (0.78 + 0.22 * esmalte);
  // O brilho: uma fonte baixa e à esquerda, e o esmalte a responder só de raspão.
  float brilho = pow(max(dot(d, normalize(vec3(0.60, 0.35, -0.70))), 0.0), 10.0);
  col = porcelana + vec3(0.05, 0.13, 0.12) * veio * 0.22;
  col += vec3(0.95, 0.93, 0.85) * brilho * 0.28;
  col -= vec3(0.26, 0.21, 0.18) * crack * 0.85;
  // O chão e o teto escurecem, como a peça a sair da luz.
  col *= 0.70 + 0.30 * smoothstep(-1.10, 0.90, el);`
};
