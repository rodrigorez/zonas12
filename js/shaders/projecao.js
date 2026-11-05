// Projeção — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "projecao",
  name: "Projeção",
  body: `// Projeção: o visitante está **dentro** da cúpula de um video mapping. Vinte painéis por volta e
// cinco filas de altura, cada um com a sua moldura escura e o seu conteúdo a correr lá dentro; em
// baixo, o chão da plateia a apanhar a luz que cai dos painéis; à volta, o feixe do projector a varrer
// a cúpula de baixo para cima, com a franja cromática nas bordas e o pó a acender-se quando passa.
//
// É a sala das realidades fabricadas: nada aqui é paisagem — é tudo superfície projectada, e o que
// muda é o que lá está a ser projectado.

// O horizonte da plateia. Abaixo dele é o chão (a mesma conta de perspectiva do núcleo e do fichário);
// acima, a cúpula. São duas superfícies e um traço aceso entre as duas.
float horizonte = -0.10;

// ── o chão ──────────────────────────────────────────────────────────────────────────────────────────
// \`1/(horizonte - el)\` comprime as juntas ao longe e abre-as aos pés. As juntas contam-se em
// **coordenadas de mundo** e não em \`az\`: uma grelha contada em \`az\` não fecha na volta e abre uma
// costura em leque atrás do visitante (D82).
float chaoD = 1.0 / (max(horizonte - el, 0.0) + 0.010);
vec2 chaoP = vec2(sin(az), -cos(az)) * chaoD;
vec2 juntas = abs(fract(chaoP * 0.30) - 0.5);
// Sem \`fwidth\` (não há derivadas num fragmento *mediump* sem extensão) a espessura é fixa; é o
// desvanecimento pela distância que impede o padrão de vibrar no horizonte.
float grade = 1.0 - smoothstep(0.0, 0.020, min(juntas.x, juntas.y));
grade *= 1.0 - smoothstep(40.0, 200.0, chaoD);
vec3 chaoCor = vec3(0.020, 0.018, 0.030) + vec3(0.16, 0.14, 0.22) * grade * 0.22;
// A poça de luz que o projector deixa no chão, do lado de onde ele aponta.
float poco = 1.0 - smoothstep(0.5, 3.0, abs(chaoP.x));
chaoCor += vec3(0.42, 0.30, 0.46) * poco * (1.0 - smoothstep(2.0, 26.0, chaoD)) * 0.20;

// ── a cúpula ───────────────────────────────────────────────────────────────────────────────────────
// As colunas contam-se em **voltas** e com meio passo de deslocamento: assim a emenda (onde \`volta\`
// salta de +0.5 para -0.5) cai no **meio** de um painel, e não numa moldura — o painel que atravessa a
// costura recebe um só tom, porque o índice leva \`mod\` e o interior é contínuo dos dois lados (D82).
float colunas = 20.0;
float voltaCol = volta * colunas + 0.5;
float indice = mod(floor(voltaCol), colunas);
float dentroCol = fract(voltaCol) - 0.5;

// As filas: a primeira começa no horizonte e a última acaba no topo da cúpula. Acima do topo é a coroa
// do zénite, que não tem painel.
float filas = 5.0;
float topo = 1.42;
float altura = (topo - horizonte) / filas;
float vertical = (el - horizonte) / altura;
float fila = floor(vertical);
float dentroFila = fract(vertical) - 0.5;

// A moldura escura entre painéis: uma faixa em cada borda da célula, e o painel a acabar antes dela.
float molduraCol = smoothstep(0.43, 0.485, abs(dentroCol));
float molduraFila = smoothstep(0.40, 0.455, abs(dentroFila));
float moldura = max(molduraCol, molduraFila);

// O tom e a fase de cada painel vêm do seu **índice inteiro**: é o que faz o painel da emenda ser um
// painel e não dois. \`fila\` pode sair negativa fora da cúpula, e \`mod\` fecha-a na volta certa.
float semente = hash(vec2(indice, mod(fila, filas)) + vec2(11.3, 5.7));

// Dentro do painel, o conteúdo projectado: uma banda diagonal que corre, com a velocidade e a direcção
// que a semente do painel lhe deu. É o «filme» de cada superfície.
float fase = dentroCol * 2.6 + dentroFila * 1.8 + semente * 6.2831;
float banda = 0.5 + 0.5 * sin(fase * 2.0 + uTime * (0.45 + 0.55 * semente));

// E uma onda que atravessa a cúpula inteira, duas voltas por revolução: como dois é inteiro, ela
// encontra-se consigo mesma na emenda.
float onda = 0.5 + 0.5 * sin(volta * 2.0 * PI * 2.0 - uTime * 0.9);

vec3 quente = vec3(0.95, 0.36, 0.52);
vec3 frio = vec3(0.22, 0.62, 0.95);
vec3 corPainel = mix(quente, frio, semente);
float brilho = (0.10 + 0.30 * banda) * (0.50 + 0.60 * onda);

// A estrutura da cúpula é também a cor das frestas: o que não é painel é o andaime escuro por trás.
vec3 estrutura = vec3(0.026, 0.022, 0.038);
// O painel escurece para o zénite: o projector aponta para baixo e o que está alto apanha menos luz.
float ateTopo = smoothstep(horizonte, topo * 0.75, el);
vec3 cupulaCor = estrutura + corPainel * brilho * (1.0 - moldura) * (0.34 + 0.26 * (1.0 - ateTopo));
// O painel recorta-se no topo e no fundo: \`dentroCupula\` é 0 na coroa do zénite e na linha da plateia.
float dentroCupula = smoothstep(-0.06, 0.02, vertical) * (1.0 - smoothstep(filas - 0.04, filas + 0.02, vertical));

// ── o feixe do projector ───────────────────────────────────────────────────────────────────────────
// Sobe e desce devagar; o núcleo é branco-quente e o halo é violeta. A franja cromática são três
// bandas deslocadas — o vermelho abre de um lado, o azul do outro —, o suficiente para a borda do
// feixe parecer lente e não fita.
float centro = horizonte + 0.20 + 0.78 * (0.5 + 0.5 * sin(uTime * 0.32));
float distFeixe = abs(el - centro);
float nucleoFeixe = 1.0 - smoothstep(0.0, 0.050, distFeixe);
float haloFeixe = 1.0 - smoothstep(0.0, 0.165, distFeixe);
vec3 feixe = vec3(0.98, 0.92, 0.80) * nucleoFeixe * 0.70;
feixe += vec3(0.50, 0.26, 0.70) * haloFeixe * 0.16;
feixe += vec3(0.42, 0.06, 0.26) * (1.0 - smoothstep(0.0, 0.075, abs(el - centro - 0.030))) * 0.16;
feixe += vec3(0.06, 0.12, 0.52) * (1.0 - smoothstep(0.0, 0.075, abs(el - centro + 0.030))) * 0.16;
// O feixe não atravessa o chão: é a mesma máscara do horizonte que o corta.
feixe *= 1.0 - smoothstep(horizonte - 0.02, horizonte + 0.02, el);

// ── a composição ──────────────────────────────────────────────────────────────────────────────────
vec3 base = estrutura + (cupulaCor - estrutura) * dentroCupula +
  vec3(0.040, 0.030, 0.075) * smoothstep(topo, 1.55, el);
// O chão entra por baixo do horizonte, e o feixe por cima de tudo o que está acima dele.
float noChao = 1.0 - smoothstep(horizonte - 0.02, horizonte + 0.02, el);
col = mix(base, chaoCor, noChao);
col += feixe;

// O pó em suspensão: só se vê onde o feixe passa, e é o que dá volume ao ar da sala. Conta-se na
// direcção (e não em \`az\`/\`el\`, que teriam a costura do \`az\`) e é **fino** — a 26 unidades eram
// nódoas do tamanho de um painel, e pó é grão.
float po = noise3(d * 240.0 + vec3(0.0, uTime * 1.30, 0.0));
col += vec3(0.95, 0.88, 0.80) * smoothstep(0.86, 1.0, po) * (0.02 + 0.28 * haloFeixe);

// O traço aceso onde a cúpula encontra a plateia — o que segura a composição e diz onde é o chão.
col += vec3(0.34, 0.20, 0.50) * (1.0 - smoothstep(0.0, 0.018, abs(el - horizonte))) * 0.55;`
};
