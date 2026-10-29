// Núcleo — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "nucleo",
  name: "Núcleo",
  body: `// Núcleo: o visitante está dentro da sala de máquinas do «Cérebro» — a estação da peça «Tenho
// sede, preciso pensar». Em baixo, o chão metálico em grelha; em cima, o tecto em grelha, mais
// apagado; à volta, as filas de bastidores escuros com as luzes dos processadores a piscar; ao
// fundo, a coluna de luz fria que pulsa. É o contrário do mangue: ali a matéria, aqui a máquina.
float horizonte = -0.02;

// A conta de perspectiva é a mesma do mangue e do chão do holograma: 1/(horizonte - el) comprime a
// grelha ao longe e abre-a aos pés. O chão e o tecto são a mesma conta, com o sinal trocado.
float chaoD = 1.0 / (max(horizonte - el, 0.0) + 0.010);
float tectoD = 1.0 / (max(el - 0.52, 0.0) + 0.010);

// A grelha do chão: quadrados de 2 m, em coordenadas de mundo (não em \`az\`, senão as linhas
// entortavam ao longe). Sem \`fwidth\` — não há derivadas num fragmento *mediump* sem extensão — a
// espessura é fixa em unidades de \`fract\`, e é o desvanecimento pela distância que impede o padrão
// de vibrar no horizonte.
vec2 chaoP = vec2(sin(az), -cos(az)) * chaoD;
vec2 linhasChao = abs(fract(chaoP * 0.5) - 0.5);
float gradeChao = 1.0 - smoothstep(0.0, 0.030, min(linhasChao.x, linhasChao.y));
gradeChao *= 1.0 - smoothstep(90.0, 320.0, chaoD);
vec3 chaoCor = vec3(0.018, 0.028, 0.036) + vec3(0.10, 0.30, 0.40) * gradeChao * 0.45;
// O reflexo frio que a coluna do fundo deixa no metal molhado de óleo.
float coluna = 1.0 - smoothstep(0.04, 0.55, abs(az));
chaoCor += vec3(0.18, 0.52, 0.70) * coluna * smoothstep(3.0, 16.0, chaoD) * 0.16;

// O tecto: a mesma grelha, mais espaçada e mais apagada, com as condutas a passer por ela.
vec2 tectoP = vec2(sin(az), -cos(az)) * tectoD;
vec2 linhasTecto = abs(fract(tectoP * 0.35) - 0.5);
float gradeTecto = 1.0 - smoothstep(0.0, 0.030, min(linhasTecto.x, linhasTecto.y));
gradeTecto *= 1.0 - smoothstep(60.0, 240.0, tectoD);
vec3 tectoCor = vec3(0.012, 0.017, 0.022) + vec3(0.05, 0.14, 0.18) * gradeTecto * 0.40;

// O fundo da sala: a parede escura e, ao centro, o núcleo — a coluna de luz com as ondas a subir e o
// pulso a descer, que é a imagem da máquina a manter a estação viva.
float centro = 1.0 - smoothstep(0.0, 0.62, abs(az));
float onda = 0.5 + 0.5 * sin(el * 9.0 - uTime * 1.6);
vec3 fundoCor = vec3(0.010, 0.017, 0.024) + vec3(0.06, 0.26, 0.36) * centro * (0.30 + onda * 0.70) * 0.42;

// Os bastidores: um por sector de \`az\`, cada um com a sua altura de luz e o seu ritmo de pisca,
// tirados do \`hash\` do índice — é o que faz a sala não ser um papel de parede.
float SETORES = 20.0;
float passo = 2.0 * PI / SETORES;
float sector = floor(az / passo + 0.5);
float semente = hash(vec2(sector, 3.7));
float desvio = az - sector * passo;
// o corpo do bastidor: mais estreito que o sector, para ficar o corredor entre dois
float corpo = 1.0 - smoothstep(0.052, 0.068, abs(desvio));
corpo *= 1.0 - smoothstep(0.50, 0.56, el);
// as juntas dos módulos, na horizontal
float junta = 1.0 - smoothstep(0.0, 0.004, abs(fract(el * 18.0) - 0.5));
vec3 bastidorCor = vec3(0.008, 0.011, 0.015) + vec3(0.03, 0.05, 0.06) * junta * 0.5;

// As luzes dos processadores: uma rede de pontos dentro do bastidor, cada um com o seu brilho e o
// seu pisca. A maioria é fria (azul-esverdeada); uma em cada seis é âmbar, como numa sala a sério.
float luzColuna = floor((desvio + 0.052) / 0.0130);
float luzFila = floor((el + 0.10) / 0.0300);
float leds = hash(vec2(sector * 7.0 + luzColuna, luzFila));
float celulaX = fract((desvio + 0.052) / 0.0130) - 0.5;
float celulaY = fract((el + 0.10) / 0.0300) - 0.5;
float ponto = 1.0 - smoothstep(0.10, 0.26, length(vec2(celulaX, celulaY)));
float pisca = 0.5 + 0.5 * sin(uTime * (0.8 + leds * 3.4) + leds * 41.0);
float aceso = step(0.48, leds) * smoothstep(0.20, 0.90, pisca);
float led = ponto * aceso * corpo;
vec3 ledCor = mix(vec3(0.20, 0.82, 1.00), vec3(1.00, 0.52, 0.14), step(0.84, leds));

// O fluxo de dados: uma linha que acende a meia altura de cada bastidor e corre para o fundo, cada
// uma com o seu atraso — o que passa entre a máquina e a estação.
float alturaFluxo = -0.04 + semente * 0.44;
float fluxo = 1.0 - smoothstep(0.0, 0.009, abs(el - alturaFluxo));
fluxo *= corpo * step(0.62, fract(uTime * 0.22 + semente));

// A composição: chão em baixo, tecto em cima e a sala no meio — a linha do chão e a do tecto a
// separarem as três.
col = mix(chaoCor, fundoCor, smoothstep(horizonte - 0.006, horizonte + 0.006, el));
col = mix(col, tectoCor, smoothstep(0.52, 0.62, el));
col = mix(col, bastidorCor, clamp(corpo, 0.0, 1.0) * 0.90);
col += ledCor * led * 0.85;
col += vec3(0.30, 0.85, 1.00) * fluxo * 0.22;
// O brilho frio que os bastidores devolvem à coluna do fundo.
col += vec3(0.06, 0.20, 0.26) * centro * (1.0 - smoothstep(0.0, 0.30, abs(el - horizonte))) * 0.20;
// Nos pólos a esfera estica: escurecer é o que esconde a costura em cima e em baixo.
col = mix(col, vec3(0.003, 0.005, 0.007), smoothstep(0.95, 1.45, abs(el)) * 0.45);`
};
