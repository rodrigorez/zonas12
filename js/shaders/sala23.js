// Sociedades de Controlo — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala23",
  name: "Sociedades de Controlo",
  body: `// Sociedades de controlo — a sala como um sensor: a grelha de células que vigiam, o feixe que varre
// uma volta inteira, o código de barras do chão e o retículo em cima de quem entra (azimute -165).
  float feixe = smoothstep(0.055, 0.0, abs(fract(volta - uTime * 0.07 + 0.5) - 0.5));
  // As células: cada uma acende ao seu ritmo, e a coluna fecha com \`mod\` (D82).
  float celula = mod(floor(volta * 40.0), 40.0);
  float linha = floor(el * 40.0);
  float semente = hash(vec2(celula, linha));
  float vigia = step(0.90, semente) * (0.45 + 0.55 * sin(uTime * 2.4 + semente * 30.0));
  // A grelha: as linhas que separam as células, contadas do mesmo sítio.
  float malha = smoothstep(0.010, 0.0, abs(fract(volta * 40.0) - 0.5) - 0.480) +
                smoothstep(0.010, 0.0, abs(fract(el * 40.0) - 0.5) - 0.480);
  col = vec3(0.012, 0.016, 0.023) + vec3(0.030, 0.042, 0.058) * (1.0 - clamp(el, 0.0, 1.0));
  col += vec3(0.14, 0.30, 0.42) * malha * 0.10;
  col += vec3(0.70, 0.85, 0.95) * vigia * 0.28;
  col += vec3(0.35, 0.55, 0.72) * feixe * 0.22;
  // O chão: o código de barras que a máquina lê, e a linha vermelha da leitura a passar por ele.
  float chao = smoothstep(0.0, -0.07, el);
  float barras = step(0.45, fract(volta * 60.0)) * step(0.62, hash(vec2(mod(floor(volta * 60.0), 60.0), 9.0)));
  float leitura = smoothstep(0.026, 0.0, abs(fract(el * 12.0 - uTime * 0.35) - 0.5) - 0.464);
  col = mix(col, vec3(0.010, 0.013, 0.019) + vec3(0.06, 0.07, 0.08) * barras, chao * 0.88);
  col += vec3(0.85, 0.12, 0.10) * leitura * chao * 0.55;
  // O retículo: um alvo que não se cansa de estar em cima de quem olha.
  float alvo = acos(clamp(dot(d, normalize(vec3(-0.259, 0.06, 0.966))), -1.0, 1.0));
  col += vec3(1.00, 0.20, 0.15) * smoothstep(0.009, 0.0, abs(alvo - 0.15)) * 0.75;`
};
