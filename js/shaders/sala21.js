// Matéria Frágil — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala21",
  name: "Matéria Frágil",
  body: `// Matéria frágil — porcelana vista de perto: o esmalte, os cabelos de crack e o brilho que a percorre.
// A peça está viva: uma luz roda à volta dela, o vidrado assenta devagar e a poeira sobe na luz.
  // A fonte de luz roda uma volta completa em ~22 s e **começa à frente de quem entra**: com a fase a
  // zero a luz nascia atrás do visitante e a sala parecia parada nos primeiros segundos.
  float voltaLuz = uTime * 0.28 + 3.1416;
  vec3 luz = normalize(vec3(sin(voltaLuz), 0.30 + 0.10 * sin(uTime * 0.4), -cos(voltaLuz)));
  // O esmalte e os cabelos mudam de sítio devagar, como um vidrado que ainda está a assentar.
  float esmalte = noise3(d * 3.0 + vec3(0.0, uTime * 0.06, 0.0));
  float cabelo = abs(noise3(d * 13.0 + vec3(uTime * 0.11, uTime * 0.06, 0.0)) - 0.5);
  float crack = smoothstep(0.022, 0.005, cabelo);
  float veio = smoothstep(0.05, 0.02, abs(noise3(d * 7.0 + vec3(0.0, uTime * 0.04, uTime * 0.03)) - 0.5));
  // Dois brilhos: a mancha larga que atravessa a parede e o lampejo apertado do esmalte.
  float brilho = pow(max(dot(d, luz), 0.0), 9.0);
  float lampejo = pow(max(dot(d, luz), 0.0), 60.0);
  float pulso = 0.5 + 0.5 * sin(uTime * 0.9);
  vec3 porcelana = vec3(0.36, 0.42, 0.40) * (0.80 + 0.20 * esmalte);
  col = porcelana + vec3(0.05, 0.13, 0.12) * veio * 0.22;
  col += vec3(0.97, 0.95, 0.88) * (brilho * 0.34 + lampejo * 0.60);
  col -= vec3(0.26, 0.21, 0.18) * crack * 0.85;
  // A poeira do esmalte: pontos finos que sobem devagar, e só se vêem onde a luz passa.
  float po = noise3(d * 34.0 - vec3(0.0, uTime * 0.16, 0.0));
  float poeira = smoothstep(0.88, 1.0, po) * (0.30 + 0.70 * brilho) * (0.65 + 0.35 * pulso);
  col += vec3(0.88, 0.90, 0.86) * poeira * 0.55;
  // O chão e o teto escurecem, como a peça a sair da luz.
  col *= 0.70 + 0.30 * smoothstep(-1.10, 0.90, el);`
};
