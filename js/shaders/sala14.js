// sala14 — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala14",
  name: "Sinais Invisíveis",
  body: `// Sinais invisíveis — um céu de escuta: frentes de onda que saem de um ponto à frente de quem entra
// (azimute 180, onde a câmara chega a olhar) e, no chão, o campo de antenas que as recebe.
  vec3 fonte = normalize(vec3(0.0, 0.32, 1.0));
  float ang = acos(clamp(dot(d, fonte), -1.0, 1.0));
  // As frentes: anéis que se afastam da fonte, mais largos à medida que a onda viaja.
  float frente = sin(ang * 30.0 - uTime * 2.2);
  float anel = smoothstep(0.55, 1.0, frente) * (1.0 - smoothstep(0.5, 2.6, ang));
  // A interferência: duas escalas de ruído na direção, uma lenta e uma nervosa.
  float banda = noise3(d * 5.0 + vec3(0.0, uTime * 0.06, 0.0));
  float zumbido = noise3(d * 22.0 - vec3(uTime * 0.10, 0.0, 0.0));
  float ceu = mix(0.010, 0.045, clamp(el, 0.0, 1.0)) + banda * 0.020;
  col = vec3(ceu * 0.55, ceu * 0.95, ceu * 1.90);
  col += vec3(0.05, 0.70, 0.95) * anel * 0.85;
  col += vec3(0.95, 0.45, 0.10) * smoothstep(0.22, 0.0, ang) * (0.25 + 0.55 * zumbido);
  // O chão: as antenas, finas, contadas em voltas inteiras para fecharem na emenda (D82).
  float chao = smoothstep(0.0, -0.07, el);
  float antenas = smoothstep(0.008, 0.0, abs(fract(volta * 44.0) - 0.5) - 0.472);
  col += vec3(0.03, 0.22, 0.30) * antenas * (0.4 + 0.6 * zumbido);
  col = mix(col, vec3(0.012, 0.016, 0.035) + vec3(0.0, 0.020, 0.030) * zumbido, chao * 0.85);`
};
