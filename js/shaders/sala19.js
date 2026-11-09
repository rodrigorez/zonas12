// Memória sob Ataque — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala19",
  name: "Memória sob Ataque",
  body: `// Memória sob ataque — uma imagem a ser comida: fatias que escorregam e apagam, brasas por baixo e
// estática por cima. A estática vive na direção (\`azim\`), e não numa coordenada que salte na emenda.
  float fatia = floor(el * 24.0);
  float semente = hash(vec2(mod(fatia, 24.0), 5.0));
  // Cada fatia tem a sua luz: umas resistem, outras já se apagaram de vez.
  float viva = step(0.42, semente) * (0.55 + 0.45 * sin(uTime * 1.4 + semente * 30.0));
  float faixa = smoothstep(0.10, 0.0, abs(fract(el * 24.0) - 0.5) - 0.44);
  // O que ainda se vê da memória: uma mancha quente cujos bordos se desfazem.
  float mancha = noise3(d * 5.0 + vec3(0.0, uTime * 0.04, 0.0));
  float resto = smoothstep(0.42, 0.80, mancha) * smoothstep(1.20, 0.0, abs(el));
  // A estática: ruído fino, sempre a mexer, mais forte em cima.
  float estatica = noise3(vec3(azim.x * 70.0, azim.y * 70.0, el * 90.0 + uTime * 3.0));
  float ataque = 0.30 + 0.70 * smoothstep(-0.20, 0.90, el);
  col = vec3(0.030, 0.020, 0.020) + vec3(0.32, 0.10, 0.04) * resto;
  col += vec3(1.00, 0.45, 0.10) * smoothstep(0.60, 0.95, resto) * 0.45;
  col += vec3(0.55, 0.50, 0.55) * estatica * 0.13 * ataque;
  // A fatia que já se apagou é mais escura do que o que resta da imagem.
  col *= mix(1.0, 0.35, (1.0 - viva) * faixa * ataque);`
};
