// Becos de tijolo — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "becos",
  name: "Becos de tijolo",
  body: `// Um beco em volta: paredes de tijolo dos dois lados, uma faixa estreita de céu em cima e o
      // asfalto molhado por baixo, com as lâmpadas de sódio a marcar o ritmo da rua. \`az\` dá a
      // volta completa (−PI…+PI) e \`el\` sobe; a esfera é o mundo inteiro, por isso o beco se fecha
      // em anel em vez de ter uma saída.
      //
      // Os smoothstep sobem sempre (aresta menor primeiro) e um \`1.0 -\` faz o resto: a ordem das
      // arestas invertidas não é definida em GLSL, e há drivers que a leem ao contrário.
      float parede = (1.0 - smoothstep(0.26, 0.38, el)) * smoothstep(-0.34, -0.22, el);
      float ceu = smoothstep(0.26, 0.38, el);
      float chao = 1.0 - smoothstep(-0.36, -0.22, el);

      // Tijolo: fiadas de ~0,038 rad, cada uma deslocada meia tijolo em relação à de baixo. \`junta\`
      // vale 0 na argamassa e 1 no tijolo, com as bordas suavizadas por dois smoothstep por eixo.
      float fiada = floor((el + 1.0) * 26.0);
      vec2 bloco = vec2(az * 11.0 + mod(fiada, 2.0) * 0.5, (el + 1.0) * 26.0);
      vec2 dentro = fract(bloco);
      float junta = smoothstep(0.0, 0.10, dentro.x) * (1.0 - smoothstep(0.90, 1.0, dentro.x))
                  * smoothstep(0.0, 0.14, dentro.y) * (1.0 - smoothstep(0.86, 1.0, dentro.y));
      float tom = hash(vec2(fiada, floor(bloco.x)));
      vec3 tijolo = mix(vec3(0.10, 0.055, 0.038), vec3(0.20, 0.11, 0.07), tom) * mix(0.35, 1.0, junta);

      // O beco também tem vãos de porta: quatro por volta, uns com luz lá dentro e outros não.
      float vao = (1.0 - smoothstep(0.06, 0.10, abs(fract(az / (2.0 * PI) * 4.0 + 0.5) - 0.5) * 1.4))
                * smoothstep(-0.34, -0.28, el) * (1.0 - smoothstep(0.05, 0.11, el));
      float aceso = step(0.5, hash(vec2(floor(az / (2.0 * PI) * 4.0 + 0.5), 7.0)));

      // As lâmpadas: seis à volta, à altura de 0,10 rad. \`perto\` é 0 debaixo da lâmpada e 1 a meio
      // caminho para a seguinte — a mesma conta serve para o halo e para a poça no chão.
      float volta = az / (2.0 * PI) * 6.0;
      float perto = abs(fract(volta + 0.5) - 0.5) * 2.0;
      float lampada = (1.0 - smoothstep(0.05, 0.085, perto)) * (1.0 - smoothstep(0.022, 0.05, abs(el - 0.09)));
      float nucleo = (1.0 - smoothstep(0.0, 0.022, perto)) * (1.0 - smoothstep(0.008, 0.02, abs(el - 0.09)));
      float luzParede = (1.0 - smoothstep(0.0, 0.55, perto)) * (1.0 - smoothstep(0.10, 0.34, abs(el - 0.08)));
      // A lâmpada de sódio tremula (e é o que faz o fundo mexer: um beco parado parece uma fotografia).
      vec3 luz = vec3(1.0, 0.58, 0.2) * (0.86 + 0.14 * sin(uTime * 2.7 + perto * 9.0));

      // O céu que sobra entre os telhados, com algumas estrelas.
      vec3 noite = mix(vec3(0.035, 0.05, 0.11), vec3(0.004, 0.008, 0.025), smoothstep(0.35, 1.0, el));
      noite += vec3(0.7) * step(0.997, hash(floor(vec2(az * 70.0, el * 70.0)))) * smoothstep(0.40, 0.8, el);

      // O asfalto: escuro, com a poça a espelhar a lâmpada mais próxima.
      float poco = (1.0 - smoothstep(0.1, 0.55, perto)) * smoothstep(-0.62, -0.40, el) *
                   (0.8 + 0.2 * sin(el * 40.0 - uTime * 1.9 + az * 6.0));
      vec3 asfalto = mix(vec3(0.010, 0.010, 0.015), vec3(0.035, 0.035, 0.05),
                         hash(floor(vec2(az * 34.0, el * 34.0))));

      // A luz da rua é fraca: o tijolo vê-se pelo que a lâmpada lhe dá, e o resto é a noite.
      float ambiente = 0.22 + 0.20 * smoothstep(-0.34, 0.26, el);
      vec3 paredeCor = tijolo * ambiente + tijolo * luz * luzParede * 2.2;

      col = mix(noite, paredeCor, parede);
      col = mix(col, col * 0.3 + luz * 0.10 * aceso, vao);
      col = mix(col, asfalto * 0.6 + luz * (luzParede * 0.35 + poco * 0.9) * asfalto * 6.0, chao);
      col += luz * (lampada * 1.2 + nucleo * 2.6);`
};
