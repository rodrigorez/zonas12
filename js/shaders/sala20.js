// Habitar — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala20",
  name: "Habitar",
  body: `// Habitar — um interior: a parede quente, a luz fria de uma janela de quatro vidros à frente de quem
// entra (azimute 135), o chão com a luz caída e o teto em sombra.
  float parede = noise3(d * 2.0);
  vec3 cor = mix(vec3(0.100, 0.070, 0.050), vec3(0.185, 0.130, 0.092), parede);
  // A janela: dois vidros em largura, dois em altura, e os caixilhos a separá-los.
  float dentro = step(abs(volta - 0.375), 0.105) * step(abs(el - 0.09), 0.125);
  float caixilho = step(0.030, abs(fract(volta * 8.0) - 0.5)) * step(0.030, abs(fract(el * 6.0) - 0.5));
  col = cor + vec3(0.40, 0.50, 0.68) * dentro * (0.35 + 0.65 * caixilho) * 0.85;
  // A luz que cai no chão, em diagonal; o teto fica com o que sobra.
  float chao = smoothstep(0.0, -0.12, el);
  float manta = smoothstep(0.45, 1.0, cos(el * 3.0 + volta * 6.2831 * 2.0));
  col = mix(col, vec3(0.070, 0.058, 0.046) + vec3(0.26, 0.23, 0.19) * manta * 0.30, chao);
  // O teto: mais escuro, e a sala fecha-se em cima.
  col *= 0.66 + 0.34 * smoothstep(-0.90, 0.45, el);`
};
