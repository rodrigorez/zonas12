// Murmúrio e Matéria — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala24",
  name: "Murmúrio e Matéria",
  body: `// Murmúrio e matéria — a espiral da concha a enrolar-se e a poeira a flutuar na luz do fim da tarde.
// A espiral soma voltas inteiras ao ângulo polar, por isso fecha na emenda (D82).
  float polar = acos(clamp(d.y, -1.0, 1.0));
  float espiral = sin(polar * 14.0 + volta * 6.2831 * 3.0 - uTime * 0.45);
  float banda = smoothstep(0.86, 1.0, espiral) * smoothstep(3.0, 0.6, polar);
  // O fundo: sépia, mais claro junto ao horizonte e mais fundo no zénite.
  float ceu = mix(0.16, 0.035, clamp(polar * 0.9, 0.0, 1.0));
  col = vec3(ceu * 1.00, ceu * 0.72, ceu * 0.45);
  // A poeira: duas escalas de ruído muito finas a andar devagar.
  float po = noise3(d * 26.0 + vec3(0.0, uTime * 0.10, uTime * 0.04));
  float poeira = smoothstep(0.80, 0.97, po);
  // O murmúrio: um tremor de baixa frequência que atravessa a sala.
  float murmuro = 0.5 + 0.5 * sin(polar * 5.0 - uTime * 1.1 + volta * 6.2831);
  col += vec3(0.85, 0.65, 0.35) * banda * 0.45;
  col += vec3(0.95, 0.88, 0.70) * poeira * 0.55 * murmuro;
  // O chão: mais escuro, e o centro da espiral a fechar-se.
  col *= 0.55 + 0.45 * smoothstep(-1.10, 0.70, el);`
};
