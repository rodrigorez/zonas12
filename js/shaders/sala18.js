// sala18 — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala18",
  name: "Sombras e Raízes",
  body: `// Sombras e raízes — um chão de húmus que se vê mal, raízes a subir e uma lua baixa à frente de quem
// entra (azimute -171). As raízes contam-se em voltas inteiras para fecharem na emenda (D82).
  float altura = el + 1.57;
  float ceu = mix(0.030, 0.010, clamp(el, 0.0, 1.2));
  col = vec3(ceu * 0.70, ceu * 1.00, ceu * 1.45);
  // As raízes: filamentos verticais que se torcem devagar, mais fortes junto ao chão.
  float coluna = floor(volta * 22.0);
  float semente = hash(vec2(mod(coluna, 22.0), 7.0));
  float desvio = sin(altura * 2.2 + semente * 18.0 + uTime * 0.25) * 0.35;
  float fibra = smoothstep(0.045, 0.0, abs(fract(volta * 22.0) - 0.5 - desvio * 0.10));
  float forca = smoothstep(0.0, -0.30, el) * (0.35 + 0.65 * semente);
  col += vec3(0.26, 0.42, 0.22) * fibra * forca * (1.0 - smoothstep(0.10, 1.30, el));
  // A terra: quase preta, com o ruído do húmus por baixo.
  float chao = smoothstep(0.0, -0.08, el);
  float humus = noise3(d * 14.0);
  col = mix(col, vec3(0.035, 0.028, 0.020) + vec3(0.07, 0.05, 0.03) * humus, chao);
  // A lua: um disco frio, parado, que não muda a luz da sala.
  float lua = smoothstep(0.13, 0.11, acos(clamp(dot(d, normalize(vec3(-0.156, 0.20, 0.988))), -1.0, 1.0)));
  col += vec3(0.50, 0.57, 0.68) * lua * 0.40;`
};
