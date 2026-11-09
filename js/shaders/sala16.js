// sala16 — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala16",
  name: "Depois do Ecrã",
  body: `// Depois do ecrã — o que fica quando a imagem se apaga: varrimento, pixels ainda acesos dentro de um
// retângulo de memória posto à frente de quem entra (azimute -130), e o vazio a ganhar em volta.
  float varrimento = 0.5 + 0.5 * sin(el * 240.0 - uTime * 6.0);
  float pixel = step(0.5, fract(volta * 220.0)) * step(0.5, fract(el * 220.0));
  // O retângulo: fica dentro da volta, para não acabar em cima da emenda da esfera.
  float dentro = step(abs(volta + 0.36), 0.10) * step(abs(el - 0.05), 0.13);
  float semente = hash(vec2(mod(floor(volta * 90.0), 90.0), mod(floor(el * 30.0), 30.0)));
  float resto = dentro * (0.15 + 0.85 * semente) * (0.70 + 0.30 * sin(uTime * 2.0 + semente * 40.0));
  // Fora: quase preto, e a única coisa viva é o varrimento a passar.
  col = vec3(0.008, 0.010, 0.022) + vec3(0.010, 0.018, 0.038) * (1.0 - clamp(el, 0.0, 1.0));
  col += vec3(0.10, 0.45, 0.85) * varrimento * 0.05;
  col += vec3(0.30, 0.75, 1.00) * resto * 0.45;
  col += vec3(0.55, 0.15, 0.85) * pixel * 0.020 * (1.0 - dentro);`
};
