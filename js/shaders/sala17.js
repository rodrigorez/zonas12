// sala17 — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala17",
  name: "Corpo como Território",
  body: `// Corpo como território — uma membrana vista de muito perto: o tecido, as veias e os poros, numa
// pulsação lenta que engrossa as veias e abre as covas.
  float pulso = 0.5 + 0.5 * sin(uTime * 0.7);
  float membrana = noise3(d * 8.0 + vec3(0.0, pulso * 0.25, 0.0));
  float veias = abs(noise3(d * 17.0 + vec3(pulso * 0.20, 0.0, 0.0)) - 0.5);
  float filamento = smoothstep(0.055, 0.0, veias);
  // Os poros: uma cova por célula, só nas células que a sorte escolheu (índice fechado com \`mod\`, D82).
  vec2 celula = vec2(mod(floor(volta * 60.0), 60.0), floor(el * 60.0));
  float cova = smoothstep(0.40, 0.0, length(fract(vec2(volta * 60.0, el * 60.0)) - 0.5));
  float poro = cova * step(0.78, hash(celula));
  col = vec3(0.075, 0.022, 0.040) + vec3(0.10, 0.035, 0.025) * membrana;
  col += vec3(0.60, 0.20, 0.14) * filamento * 0.55;
  col -= vec3(0.030, 0.010, 0.010) * poro;
  // O sangue por baixo: mais escuro para o chão, mais quente para o alto.
  col = mix(col * 0.45, col, 0.5 + 0.5 * clamp(el, -1.0, 1.0));`
};
