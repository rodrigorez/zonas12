// Paisagens Sonoras — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala15",
  name: "Paisagens Sonoras",
  body: `// Paisagens sonoras — um horizonte que é uma forma de onda: o céu diz o espectro em barras de duas
// cores, o chão devolve o marulho. As barras contam-se em voltas inteiras (36) para fecharem (D82).
  float celula = floor(volta * 36.0);
  float semente = hash(vec2(mod(celula, 36.0), 1.0));
  float altura = 0.04 + 0.30 * semente * (0.72 + 0.28 * sin(uTime * 1.1 + semente * 24.0));
  float dentro = smoothstep(0.44, 0.38, abs(fract(volta * 36.0) - 0.5));
  float barra = dentro * step(0.0, el) * smoothstep(altura, altura - 0.02, el);
  // O céu crepuscular: azul que clareia para o horizonte e escurece para o zénite.
  float ceu = mix(0.22, 0.03, clamp(el * 0.9, 0.0, 1.0));
  col = vec3(ceu * 0.30, ceu * 0.52, ceu * 1.25);
  col += mix(vec3(0.85, 0.35, 0.75), vec3(0.55, 0.85, 1.00), semente) * barra * 0.85;
  // O chão: a mesma informação, agora como marulho que se mexe devagar.
  float chao = smoothstep(0.0, -0.05, el);
  float marulho = noise3(d * 14.0 + vec3(0.0, uTime * 0.25, 0.0));
  col = mix(col, vec3(0.010, 0.025, 0.055) + vec3(0.05, 0.20, 0.28) * smoothstep(0.55, 0.85, marulho), chao * 0.92);
  // Uma linha de horizonte nítida, para a paisagem ter chão.
  col += vec3(0.30, 0.50, 0.70) * smoothstep(0.010, 0.0, abs(el));`
};
