// Fichário — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "fichario",
  name: "Fichário",
  body: `// Fichário: o visitante está na sala dos catálogos do arquivo — a parede inteira feita de gavetas de
// fichas, cada uma com a sua etiqueta e o seu puxador, e uma lâmpada fria de mesa por cima. É a sala
// do que está guardado à espera de ser encontrado: em baixo o mosaico do chão, à volta as gavetas, em
// cima o tecto escuro, e o pó a passar devagar dentro da luz.
float horizonte = -0.02;
// O topo do fichário: acima disto é tecto. A parede de gavetas vai do chão até aqui.
float topo = 0.60;

// O chão — a conta de perspectiva do mangue e do núcleo (1/(horizonte - el) comprime ao longe e abre
// aos pés), com as linhas em coordenadas de mundo para não entortarem ao longe.
float chaoD = 1.0 / (max(horizonte - el, 0.0) + 0.010);
vec2 chaoP = vec2(sin(az), -cos(az)) * chaoD;
vec2 linhasChao = abs(fract(chaoP * 0.5) - 0.5);
float gradeChao = 1.0 - smoothstep(0.0, 0.025, min(linhasChao.x, linhasChao.y));
gradeChao *= 1.0 - smoothstep(70.0, 280.0, chaoD);
vec3 chaoCor = vec3(0.024, 0.028, 0.032) + vec3(0.17, 0.20, 0.23) * gradeChao * 0.30;

// As gavetas: vinte e quatro por volta. A parede é um cilindro, por isso passos iguais em \`az\` são
// arcos iguais — a perspectiva sai da própria geometria e não de mais uma conta.
float colunas = 24.0;
float passo = 2.0 * PI / colunas;
float coluna = floor(az / passo + 0.5);
float desvioX = az - coluna * passo;
// Sete filas entre o chão e o topo do fichário.
float filas = 7.0;
float altura = (topo - horizonte) / filas;
float vertical = (el - horizonte) / altura;
float fila = floor(vertical);
float desvioY = fract(vertical) - 0.5;

// Cada gaveta com o seu tom: é o \`hash\` da coluna e da fila que impede a parede de ser papel de
// parede. \`u\` e \`v\` são a posição **dentro** da gaveta (de -0,5 a +0,5), para as medidas da etiqueta
// e do puxador serem as mesmas em qualquer ponto da volta.
float u = desvioX / passo;
float v = desvioY;
float semente = hash(vec2(coluna, fila));
float face = (1.0 - smoothstep(0.40, 0.44, abs(u))) * (1.0 - smoothstep(0.40, 0.44, abs(v)));
vec3 gavetaCor = mix(vec3(0.038, 0.046, 0.052), vec3(0.108, 0.124, 0.134), semente);

// A etiqueta: um cartão claro no alto da gaveta, com o comprimento que o \`hash\` lhe dá, e uma linha
// de tinta por dentro — é o que se lê de longe e o que faz a parede parecer escrita.
float largura = 0.14 + semente * 0.08;
float etiqueta = (1.0 - smoothstep(largura, largura + 0.030, abs(u))) *
  (1.0 - smoothstep(0.020, 0.038, abs(v - 0.200)));
float tinta = (1.0 - smoothstep(0.006, 0.014, abs(v - 0.200))) *
  (1.0 - smoothstep(largura * 0.60, largura * 0.80, abs(u)));

// O puxador: uma barra de latão por baixo da etiqueta.
float puxador = (1.0 - smoothstep(0.010, 0.020, abs(v + 0.140))) *
  (1.0 - smoothstep(0.075, 0.105, abs(u)));

// A aresta de cima da gaveta, onde a luz da lâmpada bate primeiro: é o que dá relevo a uma parede que,
// sem ela, era uma lista de caixas.
float aresta = smoothstep(0.28, 0.42, v) * face;

// As gavetas que ficaram abertas: a face recolhe para a sombra e o vão de cima acende, que é a luz da
// sala a entrar na ficha. Uma em cada dezasseis, para a parede não ficar aos quadrados certos.
float aberta = step(0.94, semente);
float vao = smoothstep(0.24, 0.42, abs(v)) * (1.0 - smoothstep(0.44, 0.50, abs(v)));

// A lâmpada fria de mesa: o painel no tecto, o halo que ele deixa na parede e o piscar curto de um
// tubo que já não é novo. Sem isto a sala é uma fotografia; com isto é uma sala.
float painel = (1.0 - smoothstep(0.14, 0.30, abs(az))) * (1.0 - smoothstep(0.60, 0.74, abs(el - 0.64)));
float halo = (1.0 / (1.0 + az * az * 6.5)) * (0.80 + 0.20 * smoothstep(horizonte, topo, el));
// O tubo respira devagar — três senos de períodos que não se dividem, para a sala nunca ficar dois
// instantes com a mesma luz (era o defeito medido: um só seno tem sempre um instante que repete o
// outro, e a janela de uma porta deixava de mudar) — e por cima o piscar curto do arranque.
float respira = 0.90 + 0.06 * sin(uTime * 0.63) + 0.05 * sin(uTime * 1.31 + 1.7) + 0.04 * sin(uTime * 2.90 + 0.4);
float cintila = respira + 0.04 * sin(uTime * 4.10) * sin(uTime * 2.70 + 0.7);
// E a luz a escorrer pela parede: duas ondas de alturas diferentes a subir devagar, que é o que dá
// vida à gaveta que está à altura dos olhos — sem elas o meio da sala (o que uma janela de porta
// mostra a trinta metros) ficava parado, por mais que o tubo piscasse.
float escorre = (0.55 + 0.45 * sin(el * 7.0 - uTime * 1.1 + az * 0.6)) *
  (0.75 + 0.25 * sin(el * 3.1 + uTime * 0.7));

// O varrimento: a luz a procurar uma ficha ao longo da parede, uma volta a cada vinte e dois segundos.
float posicao = -PI + 2.0 * PI * fract(uTime * 0.045);
float diferenca = mod(az - posicao + PI, 2.0 * PI) - PI;
float varrimento = 1.0 - smoothstep(0.05, 0.80, abs(diferenca));

// O pó: pontos que sobem devagar dentro do halo. São pequenos, mas são o que dá a profundidade entre a
// parede e o visitante.
vec2 poeira = vec2(az * 5.0, el * 11.0) + vec2(uTime * 0.045, -uTime * 0.030);
vec2 celulaPoeira = fract(poeira) - 0.5;
float pontoPoeira = 1.0 - smoothstep(0.05, 0.11, length(celulaPoeira));
float temPoeira = step(0.90, hash(floor(poeira) + 0.5));
float poeiraBrilho = pontoPoeira * temPoeira * halo;

// A composição da parede: o fundo escuro da ranhura, a face da gaveta por cima, o cartão, o latão, o
// vão aberto e a luz que passa — tudo somado antes de a parede encontrar o chão e o tecto.
vec3 paredeCor = vec3(0.010, 0.012, 0.015) + gavetaCor * face;
paredeCor += vec3(0.52, 0.58, 0.62) * etiqueta * 0.62;
paredeCor -= vec3(0.30, 0.34, 0.36) * etiqueta * tinta * 0.55;
paredeCor += vec3(0.42, 0.33, 0.18) * puxador * 0.60;
paredeCor += vec3(0.16, 0.20, 0.23) * aresta * 0.35;
paredeCor += vec3(0.10, 0.13, 0.16) * aberta * vao * 0.55;
paredeCor *= 0.72 + 0.68 * halo * cintila;
paredeCor += vec3(0.055, 0.075, 0.090) * halo * escorre * 0.60;
paredeCor += vec3(0.30, 0.40, 0.48) * varrimento * face * 0.30;

// O tecto: a laje escura em grelha — a mesma conta de perspectiva do chão, com o sinal trocado —, o
// painel aceso e a mancha fria que ele espalha.
float tectoD = 1.0 / (max(el - topo, 0.0) + 0.012);
vec2 tectoP = vec2(sin(az), -cos(az)) * tectoD;
vec2 linhasTecto = abs(fract(tectoP * 0.4) - 0.5);
float gradeTecto = 1.0 - smoothstep(0.0, 0.030, min(linhasTecto.x, linhasTecto.y));
gradeTecto *= 1.0 - smoothstep(50.0, 220.0, tectoD);
vec3 tectoCor = vec3(0.014, 0.018, 0.022) + vec3(0.045, 0.062, 0.074) * gradeTecto * 0.55;
tectoCor += vec3(0.020, 0.028, 0.034) * smoothstep(topo, 1.0, el);
tectoCor += vec3(0.58, 0.68, 0.76) * painel * cintila * 0.90;
tectoCor += vec3(0.06, 0.09, 0.11) * (1.0 / (1.0 + az * az * 5.0)) * smoothstep(topo, 0.90, el) * cintila;

col = mix(chaoCor, paredeCor, smoothstep(horizonte - 0.006, horizonte + 0.006, el));
col = mix(col, tectoCor, smoothstep(topo - 0.02, topo + 0.04, el));
// A mancha da lâmpada no chão, à frente do visitante, e o pó dentro dela.
col += vec3(0.10, 0.14, 0.17) * (1.0 / (1.0 + az * az * 6.0)) *
  (1.0 - smoothstep(0.0, 26.0, chaoD)) * cintila * 0.55;
col += vec3(0.55, 0.66, 0.74) * poeiraBrilho * 0.35;
// Nos pólos a esfera estica: escurecer é o que esconde a costura em cima e em baixo.
col = mix(col, vec3(0.004, 0.006, 0.008), smoothstep(0.95, 1.45, abs(el)) * 0.45);`
};
