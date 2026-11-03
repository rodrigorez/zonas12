// Depósito — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "deposito",
  name: "Depósito",
  body: `// Depósito: onde o arquivo guarda o que ainda não está à vista — prateleiras de caixas de cartão,
// cada uma com a sua etiqueta e o seu puxador, e uma lâmpada quente pendurada ao centro. É a outra
// metade do fichário: lá as gavetas do que se procura, aqui as caixas do que ainda não se abriu.
float horizonte = -0.05;
// O topo da estante: acima disto é a laje do tecto.
float topo = 0.58;

// O chão de cimento — a conta de perspectiva do fichário (1/(horizonte - el) comprime ao longe e
// abre aos pés), com as juntas em coordenadas de mundo e a faixa pintada do corredor ao meio.
float chaoD = 1.0 / (max(horizonte - el, 0.0) + 0.010);
vec2 chaoP = vec2(sin(az), -cos(az)) * chaoD;
vec2 juntas = abs(fract(chaoP * 0.35) - 0.5);
float gradeChao = 1.0 - smoothstep(0.0, 0.018, min(juntas.x, juntas.y));
gradeChao *= 1.0 - smoothstep(50.0, 240.0, chaoD);
float faixa = (1.0 - smoothstep(0.03, 0.07, abs(abs(chaoP.x) - 3.40))) *
  (1.0 - smoothstep(6.0, 80.0, chaoD));
vec3 chaoCor = vec3(0.032, 0.030, 0.027) + vec3(0.19, 0.18, 0.16) * gradeChao * 0.26;
chaoCor += vec3(0.30, 0.22, 0.10) * faixa * 0.22;

// As estantes: dezoito vãos por volta. O vão conta-se em **voltas** e fecha com \`mod\` (D82): a caixa
// que atravessa a emenda era duas meias caixas de tons diferentes, e a costura via-se.
float vaos = 18.0;
float passo = 2.0 * PI / vaos;
float vaoVolta = volta * vaos + 0.5;
float vao = mod(floor(vaoVolta), vaos);
// \`u\` é a posição **dentro** do vão (de -0,5 a +0,5), para as medidas da etiqueta e do puxador serem
// as mesmas em qualquer ponto da volta.
float u = fract(vaoVolta) - 0.5;

// Cinco prateleiras entre o chão e o topo; \`abaixo\` conta de 0 (a tábua) a 1 (a de cima do vão).
float filas = 5.0;
float altura = (topo - horizonte) / filas;
float vertical = (el - horizonte) / altura;
float fila = floor(vertical);
float abaixo = fract(vertical);

// O montante de metal entre vãos, a tábua de baixo de cada prateleira e a boca do vão — o que fica
// escuro quando a caixa não chega lá acima.
float montante = smoothstep(0.440, 0.470, abs(u));
float dentro = 1.0 - smoothstep(0.395, 0.435, abs(u));
float tabua = 1.0 - smoothstep(0.070, 0.110, abaixo);

// A caixa: uma por célula, com a altura que o \`hash\` lhe dá — é o que faz a estante parecer cheia sem
// ser uma grelha. Uma em cada dezasseis células está vazia (a caixa saiu para consulta), e o vão
// escuro é o que dá a medida do que lá estava.
float semente = hash(vec2(vao, fila));
float topos = 0.42 + 0.34 * semente;
float vazia = step(0.94, hash(vec2(vao + 7.0, fila + 2.0)));
float caixa = step(0.110, abaixo) * (1.0 - smoothstep(topos, topos + 0.020, abaixo));
float face = caixa * dentro * (1.0 - vazia);

// O cartão: tons castanhos que o \`hash\` separa, e algumas caixas de papelão claro que quebram a
// parede de castanho.
vec3 cartao = mix(vec3(0.255, 0.205, 0.150), vec3(0.375, 0.300, 0.215),
  hash(vec2(vao + 3.0, fila + 1.0)));
cartao = mix(cartao, vec3(0.400, 0.395, 0.370), step(0.86, semente) * 0.75);

// A etiqueta: um cartão claro no alto da caixa, com o comprimento que o \`hash\` lhe dá, e as duas
// linhas de tinta.
float centro = 0.110 + (topos - 0.110) * 0.55;
float largura = 0.12 + 0.10 * hash(vec2(vao + 11.0, fila + 5.0));
float etiqueta = (1.0 - smoothstep(largura, largura + 0.025, abs(u))) *
  (1.0 - smoothstep(0.035, 0.055, abs(abaixo - centro)));
float tinta = (1.0 - smoothstep(0.006, 0.012, abs(abs(abaixo - centro) - 0.012))) *
  (1.0 - smoothstep(largura * 0.55, largura * 0.75, abs(u)));

// O puxador — a fenda por onde se puxa a caixa — e a aresta de cima, onde a lâmpada bate primeiro.
float puxador = (1.0 - smoothstep(0.010, 0.020, abs(abaixo - (centro - 0.075)))) *
  (1.0 - smoothstep(0.045, 0.070, abs(u)));
float aresta = smoothstep(topos - 0.070, topos, abaixo) * face;

// A lâmpada quente pendurada: o painel no tecto, o halo na estante e a respiração do filamento. Três
// senos de períodos que não se dividem, para a sala nunca ficar dois instantes com a mesma luz — um
// só seno tem sempre um instante que repete o outro, e a janela de uma porta deixava de mudar.
float painel = (1.0 - smoothstep(0.10, 0.24, abs(az))) *
  (1.0 - smoothstep(0.58, 0.72, abs(el - 0.62)));
float halo = (1.0 / (1.0 + az * az * 5.5)) * (0.78 + 0.22 * smoothstep(horizonte, topo, el));
float respira = 0.90 + 0.06 * sin(uTime * 0.71) + 0.05 * sin(uTime * 1.37 + 1.7) +
  0.04 * sin(uTime * 2.63 + 0.4);
float cintila = respira + 0.035 * sin(uTime * 3.90) * sin(uTime * 2.45 + 0.7);
// E a luz a escorrer pela estante: duas ondas de alturas diferentes a subir devagar, que é o que dá
// vida à prateleira que está à altura dos olhos — sem elas o meio da sala (o que uma janela de porta
// mostra a trinta metros) ficava parado, por mais que a lâmpada piscasse.
float escorre = (0.55 + 0.45 * sin(el * 6.0 - uTime * 0.9 + az * 1.3)) *
  (0.75 + 0.25 * sin(el * 2.7 + uTime * 0.6));

// O varrimento: alguém a procurar uma caixa com uma lanterna, uma volta a cada vinte e seis segundos.
float posicao = -PI + 2.0 * PI * fract(uTime * 0.038);
float diferenca = mod(az - posicao + PI, 2.0 * PI) - PI;
float varrimento = 1.0 - smoothstep(0.04, 0.70, abs(diferenca));

// O pó: pontos que sobem devagar dentro do halo e dão profundidade entre a estante e o visitante. A
// coluna conta-se em voltas inteiras (28 por volta) para o pó não saltar na emenda.
vec2 poeira = vec2(volta * 28.0, el * 10.0) + vec2(uTime * 0.040, -uTime * 0.026);
vec2 celulaPoeira = fract(poeira) - 0.5;
float pontoPoeira = 1.0 - smoothstep(0.0025, 0.0120, dot(celulaPoeira, celulaPoeira));
float temPoeira = step(0.90, hash(vec2(mod(floor(poeira.x), 28.0), floor(poeira.y)) + 0.5));
float poeiraBrilho = pontoPoeira * temPoeira * halo;

// A composição da estante: o vão escuro, o cartão, a etiqueta, a tinta, a fenda, a aresta, a tábua e
// o montante — tudo somado antes de a parede encontrar o chão e o tecto.
vec3 paredeCor = vec3(0.010, 0.009, 0.008);
paredeCor += cartao * face;
paredeCor += vec3(0.46, 0.42, 0.34) * etiqueta * face * 0.52;
paredeCor -= vec3(0.30, 0.27, 0.22) * tinta * face * 0.50;
paredeCor -= vec3(0.10, 0.09, 0.08) * puxador * face * 0.70;
paredeCor += vec3(0.30, 0.25, 0.18) * aresta * 0.30;
paredeCor += vec3(0.115, 0.115, 0.110) * tabua * 0.55;
paredeCor += vec3(0.075, 0.070, 0.062) * montante * 0.45;
paredeCor *= 0.70 + 0.70 * halo * cintila;
paredeCor += vec3(0.16, 0.115, 0.060) * halo * escorre * 0.55;
paredeCor += vec3(0.30, 0.24, 0.14) * varrimento * (face + tabua * 0.6) * 0.30;

// O tecto: a laje de cimento em grelha — a mesma conta do chão, com o sinal trocado —, o cabo da
// lâmpada, o painel aceso e a mancha quente que ele espalha.
float tectoD = 1.0 / (max(el - topo, 0.0) + 0.012);
vec2 tectoP = vec2(sin(az), -cos(az)) * tectoD;
vec2 juntasTecto = abs(fract(tectoP * 0.30) - 0.5);
float gradeTecto = 1.0 - smoothstep(0.0, 0.025, min(juntasTecto.x, juntasTecto.y));
gradeTecto *= 1.0 - smoothstep(40.0, 200.0, tectoD);
vec3 tectoCor = vec3(0.016, 0.014, 0.012) + vec3(0.055, 0.050, 0.042) * gradeTecto * 0.50;
float cabo = (1.0 - smoothstep(0.010, 0.022, abs(az))) * smoothstep(0.62, 1.10, el);
tectoCor += vec3(0.10, 0.09, 0.07) * cabo * 0.80;
tectoCor += vec3(1.00, 0.78, 0.48) * painel * cintila * 0.95;
tectoCor += vec3(0.20, 0.13, 0.06) * (1.0 / (1.0 + az * az * 4.0)) *
  smoothstep(topo, 0.92, el) * cintila * 0.90;

col = mix(chaoCor, paredeCor, smoothstep(horizonte - 0.006, horizonte + 0.006, el));
col = mix(col, tectoCor, smoothstep(topo - 0.02, topo + 0.04, el));
// A mancha da lâmpada no chão, à frente do visitante, e o pó dentro dela.
col += vec3(0.16, 0.11, 0.055) * (1.0 / (1.0 + az * az * 5.0)) *
  (1.0 - smoothstep(0.0, 24.0, chaoD)) * cintila * 0.55;
col += vec3(0.75, 0.62, 0.42) * poeiraBrilho * 0.35;
// Nos pólos a esfera estica: escurecer é o que esconde a costura em cima e em baixo.
col = mix(col, vec3(0.004, 0.004, 0.003), smoothstep(0.95, 1.45, abs(el)) * 0.45);`
};
