// Depois do Ecrã — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala16",
  name: "Depois do Ecrã",
  body: `// Depois do ecrã — o tubo a apagar-se: o varrimento, o tremor dos pixels e o vazio. Sem nada em
// quadro: o que sobra de uma imagem é a luz que ela deixou no vidro.
  float varrimento = 0.5 + 0.5 * sin(el * 240.0 - uTime * 6.0);
  float pixel = step(0.5, fract(volta * 220.0)) * step(0.5, fract(el * 220.0));
  col = vec3(0.008, 0.010, 0.022) + vec3(0.010, 0.018, 0.038) * (1.0 - clamp(el, 0.0, 1.0));
  col += vec3(0.10, 0.45, 0.85) * varrimento * 0.07;
  col += vec3(0.55, 0.15, 0.85) * pixel * 0.022;
  // O último traço: uma linha fina que desce o vidro e volta, como o feixe de um tubo a colapsar.
  float colapso = smoothstep(0.006, 0.0, abs(el - (0.75 - mod(uTime * 0.16, 1.9))));
  col += vec3(0.65, 0.85, 1.00) * colapso * 0.35;`
};
