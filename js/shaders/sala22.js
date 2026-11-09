// Ciclos — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala22",
  name: "Ciclos",
  body: `// Ciclos — a lua e a sua fase, à frente de quem entra (azimute -171): um disco que se enche e se
// esvazia em ~22 s, com as órbitas a rodar por trás. A sombra é um segundo disco que atravessa o
// primeiro. Mesmo na lua nova o disco não desaparece: fica a luz da terra, para a sala nunca ficar vazia.
  vec3 alvo = normalize(vec3(-0.156, 0.22, 0.988));
  float ang = acos(clamp(dot(d, alvo), -1.0, 1.0));
  float fase = fract(uTime * 0.045);
  vec3 luz = normalize(vec3(sin(fase * 6.2831), 0.15, -cos(fase * 6.2831)));
  float lua = smoothstep(0.26, 0.24, ang);
  // O disco da sombra anda de um lado ao outro: quando está em cima, é lua nova.
  vec3 centroSombra = normalize(alvo + luz * (sin(fase * 6.2831) * 0.50));
  float sombra = smoothstep(0.26, 0.24, acos(clamp(dot(d, centroSombra), -1.0, 1.0)));
  float face = clamp(lua - sombra, 0.0, 1.0);
  // O céu nocturno e as órbitas: anéis finos, contados em ângulo, a rodar devagar.
  float ceu = mix(0.014, 0.004, clamp(el, 0.0, 1.2));
  col = vec3(ceu * 0.70, ceu * 1.05, ceu * 1.80);
  float orla = smoothstep(0.90, 1.0, sin(ang * 5.0 - uTime * 0.35));
  col += vec3(0.14, 0.22, 0.36) * orla * 0.10 * (1.0 - lua);
  // A face iluminada e, no resto do disco, a luz que a terra lhe devolve.
  col += vec3(0.85, 0.88, 0.95) * face * 0.90;
  col += vec3(0.16, 0.20, 0.30) * lua * 0.22;
  // O chão: um anel de sombra que acompanha a fase, para a sala ter chão.
  float chao = smoothstep(0.0, -0.10, el);
  col = mix(col, vec3(0.006, 0.009, 0.020) + vec3(0.03, 0.04, 0.08) * (1.0 - face), chao);`
};
