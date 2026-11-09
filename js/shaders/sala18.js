// Sombras e Raízes — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "sala18",
  name: "Sombras e Raízes",
  body: `// Sombras e raízes — o chão de um cultivo visto de perto: sulcos nítidos a convergir para o horizonte,
// pedras, raízes finas e curtas a subir e a abanar devagar, e sombras largas a deslizar por cima. A lua
// tem bordo definido e crateras, mas não ilumina nada.
  float chao = smoothstep(0.006, -0.006, el);
  float profundidade = 1.0 / max(-el, 0.05);
  // O céu: índigo fundo, mais escuro em cima.
  float ceu = mix(0.038, 0.010, clamp(el, 0.0, 1.2));
  col = vec3(ceu * 0.70, ceu * 1.00, ceu * 1.55);
  // A lua: halo, disco de bordo definido e as crateras.
  float angLua = acos(clamp(dot(d, normalize(vec3(-0.156, 0.20, 0.988))), -1.0, 1.0));
  col += vec3(0.10, 0.13, 0.20) * smoothstep(0.40, 0.106, angLua);
  col += vec3(0.62, 0.68, 0.78) * smoothstep(0.108, 0.100, angLua);
  col -= vec3(0.12, 0.12, 0.14) * smoothstep(0.098, 0.078, angLua) * smoothstep(0.45, 0.75, noise3(d * 70.0));
  // As raízes: grossas na base, finas em cima (como uma raiz a erguer-se), a abanar mais quanto mais
  // sobem, e a apagar-se antes do zénite.
  float coluna = floor(volta * 14.0);
  float semente = hash(vec2(mod(coluna, 14.0), 3.0));
  float abano = sin(el * 5.0 + semente * 20.0 + uTime * 0.45) * 0.26 * smoothstep(0.0, 0.55, el);
  float raio = mix(0.013, 0.0035, smoothstep(0.0, 0.50, el));
  float raiz = smoothstep(raio, 0.0, abs(fract(volta * 14.0) - 0.5 - abano));
  float forca = smoothstep(-0.08, 0.05, el) * (1.0 - smoothstep(0.20, 0.62, el)) * (0.30 + 0.70 * semente);
  col += vec3(0.42, 0.62, 0.34) * raiz * forca;
  // A terra: sulcos em perspectiva e pedras irregulares de bordo nítido (ruído, não células — em
  // coordenadas de perspectiva uma célula redonda saía esticada).
  float sulco = smoothstep(0.007, 0.0, abs(fract(profundidade * 3.0) - 0.5) - 0.472);
  float pedras = smoothstep(0.75, 0.81, noise3(vec3(azim.x * 110.0, azim.y * 110.0, profundidade * 1.0)));
  vec3 terra = vec3(0.052, 0.040, 0.028) + vec3(0.045, 0.034, 0.022) * noise3(d * 24.0);
  terra *= 1.0 - 0.45 * sulco;
  terra += vec3(0.085, 0.070, 0.052) * pedras;
  col = mix(col, terra, chao);
  // As sombras: bandas largas a deslizar pelo chão, e um resto de penumbra na parede.
  float sombra = smoothstep(0.55, 0.95, sin(volta * 6.2831 * 3.0 + el * 2.5 + uTime * 0.22));
  col *= 1.0 - 0.45 * sombra * (0.30 + 0.70 * chao);
  // O zénite escurece, como numa noite sem lua alta.
  col *= 0.80 + 0.20 * smoothstep(-0.60, 0.90, el);`
};
