// Arcade Crítico — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala25",
  name: "Arcade Crítico",
  body: `// Arcade crítico — a sala como um jogo antigo: blocos grandes, cor saturada e as linhas do tubo.
// As cores saem de uma paleta de três, escolhidas ao acaso por célula (com \`mod\` na emenda, D82).
  vec2 grade = vec2(volta * 32.0, el * 20.0);
  vec2 celula = vec2(mod(floor(grade.x), 32.0), floor(grade.y) + 11.0);
  float semente = hash(celula);
  // O relevo do jogo: um bloco só existe se a célula e a sua coluna quiserem.
  float coluna = hash(vec2(celula.x, 2.0));
  float bloco = step(0.55, semente) * step(0.35, coluna);
  vec3 tinta = semente < 0.34
    ? vec3(0.95, 0.15, 0.55)
    : (semente < 0.67 ? vec3(0.10, 0.85, 0.95) : vec3(0.98, 0.80, 0.15));
  float pisca = 0.55 + 0.45 * sin(uTime * 2.0 + semente * 20.0);
  col = vec3(0.020, 0.010, 0.050) + tinta * bloco * pisca * 0.60;
  // A luz do tubo não é igual em toda a volta: um gradiente lento em azimute o diz (e separa duas
  // colunas da mesma cor, que a paleta de três deixaria iguais).
  col *= 0.78 + 0.22 * (0.5 + 0.5 * cos(volta * 6.2831 + 1.0));
  // As linhas do tubo e a vinheta: o ecrã tem bordos.
  col *= 0.80 + 0.20 * (0.5 + 0.5 * sin(el * 180.0));
  float vinheta = length(vec2(volta * 1.2, el * 0.8));
  col *= 1.0 - 0.50 * smoothstep(0.60, 1.55, vinheta);
  // A marca do jogo: uma linha de base acesa no chão.
  col += vec3(0.10, 0.85, 0.95) * smoothstep(0.02, 0.0, abs(el + 0.35)) * 0.35;`
};
