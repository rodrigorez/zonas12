// Mangue — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "mangue",
  name: "Mangue",
  body: `// Mangue: o visitante está dentro do mangue. A água lamacenta em baixo, com as ondulações a correr
// para ele; à volta, os troncos e as raízes de propágulo a subirem da linha da água; em cima, a copa
// fechada, e entre as folhas o céu esverdeado com os feixes de luz a descerem de través.
//
// As contas são todas em \`az\`/\`el\`: sem \`fwidth\` (não há derivadas num fragmento *mediump* sem
// extensão) a espessura de uma linha é fixa, e é isso que faz as raízes longe parecerem mais finas —
// não por acaso, mas porque \`az\` por perto cobre mais ângulo. Os \`smoothstep\` sobem sempre (aresta
// menor primeiro) e um \`1.0 -\` faz o resto: a ordem das arestas invertidas não é definida em GLSL.
float horizonte = -0.05;

// A água: a profundidade é \`1/(horizonte - el)\`, a mesma conta do chão do \`holograma\`, e é ela que
// comprime as ondulações ao longe e as abre aos pés.
float prof = 1.0 / (max(horizonte - el, 0.0) + 0.03);
float r1 = noise(vec2(az * 2.4 + uTime * 0.16, prof * 0.9 - uTime * 0.42));
float fase = prof * 2.3 + uTime * 1.30 + r1 * 4.2 + az * 1.1;
float brilho = sin(fase) * 0.5 + 0.5;
// A lama: castanho-esverdeado escuro, e a crista clareia para um verde-palha.
vec3 aguaCor = mix(vec3(0.022, 0.032, 0.017), vec3(0.135, 0.150, 0.072),
                   smoothstep(0.15, 0.95, brilho));
aguaCor += vec3(0.40, 0.44, 0.24) * pow(brilho, 10.0) * 0.50;
// Junto ao horizonte a água devolve o céu: é o que lhe dá profundidade.
float espelho = 1.0 - smoothstep(0.0, 0.20, horizonte - el);
aguaCor = mix(aguaCor, vec3(0.30, 0.36, 0.22), espelho * 0.45);
// O clarão que atravessa as raízes, partido na superfície.
float coluna = 1.0 - smoothstep(0.05, 0.34, abs(az - 0.35));
aguaCor += vec3(1.00, 0.96, 0.70) * coluna * pow(brilho, 6.0) * 0.45;

// Os troncos: um por sector de \`az\`, cada um com a sua largura, a sua altura e a sua curva, tiradas do
// \`hash\` do índice — é o que faz a floresta não ser uma sebe. O \`afinamento\` só aperta no último terço:
// uma raiz de propágulo é quase da mesma grossura até ao fim, e o que a afina é a distância, não a
// ponta.
float SETORES = 26.0;
float passo = 2.0 * PI / SETORES;
float sector = floor(az / passo + 0.5);
float semente = hash(vec2(sector, 7.3));
float desvio = az - sector * passo;
float curva = desvio + sin(el * 2.6 + semente * 6.283) * 0.030
            + sin(uTime * 0.50 + semente * 6.283) * 0.003;
float largura = 0.008 + semente * 0.013;
float topo = 0.42 + semente * 0.55;
float afinamento = 1.0 - smoothstep(topo - 0.30, topo, el) * 0.25;
// A sapata: junto à água a raiz abre, e é isso que a segura na lama.
afinamento += (1.0 - smoothstep(horizonte, horizonte + 0.10, el)) * 0.45;
float tronco = 1.0 - smoothstep(0.0, largura * afinamento, abs(curva));
tronco *= smoothstep(horizonte - 0.02, horizonte + 0.035, el);
tronco *= 1.0 - smoothstep(topo, topo + 0.05, el);

// Os pneumatóforos: muitos, finos, só na lama rasa. São o que se vê primeiro num mangue.
float PINOS = 88.0;
float passoPino = 2.0 * PI / PINOS;
float indicePino = floor(az / passoPino + 0.5);
float sementePino = hash(vec2(indicePino, 11.0));
float desvioPino = az - indicePino * passoPino;
float pino = 1.0 - smoothstep(0.0, 0.0060, abs(desvioPino));
float alturaPino = 0.020 + sementePino * 0.075;
pino *= smoothstep(horizonte - 0.010, horizonte + 0.012, el);
pino *= 1.0 - smoothstep(alturaPino * 0.55, alturaPino, el - horizonte);
// a sombra que fazem na água, um pouco abaixo do píncaro
pino += (1.0 - smoothstep(0.0, 0.0060, abs(desvioPino)))
      * (1.0 - smoothstep(0.0, 0.035, abs(el - horizonte + alturaPino * 0.45))) * 0.22;

// A copa: duas camadas de ruído, uma grande e uma miúda (as folhas), e os buracos entre elas. O que
// decide o contraste é a janela do \`smoothstep\`: estreita, e a copa fecha-se em manchas.
float folhaGrande = noise(vec2(az * 7.0, el * 10.0 + uTime * 0.06));
float folhaMiuda = noise(vec2(az * 17.0 + uTime * 0.09, el * 26.0));
float copaM = smoothstep(0.42, 0.62, folhaGrande * 0.60 + folhaMiuda * 0.40);
vec3 copaCor = mix(vec3(0.002, 0.008, 0.004), vec3(0.048, 0.135, 0.042), copaM);
// O céu por trás: esverdeado em cima, mais claro no horizonte — onde a luz entra de fora.
vec3 ceuCor = mix(vec3(0.42, 0.50, 0.30), vec3(0.10, 0.20, 0.14),
                  smoothstep(0.10, 1.10, el));
vec3 cima = mix(ceuCor, copaCor, smoothstep(0.02, 0.14, el) * (0.55 + copaM * 0.45));

// Os feixes de luz, a descerem de través entre os troncos.
float feixe = pow(0.5 + 0.5 * sin(az * 4.6 - el * 2.4 + uTime * 0.50), 16.0);
feixe *= smoothstep(horizonte, 0.55, el) * (1.0 - smoothstep(0.80, 1.30, el));

// A composição: água em baixo, copa em cima, a linha da água a separar as duas.
col = mix(aguaCor, cima, smoothstep(horizonte - 0.012, horizonte + 0.012, el));
col = mix(col, vec3(0.016, 0.028, 0.017), clamp(tronco, 0.0, 1.0) * 0.92);
col = mix(col, vec3(0.024, 0.038, 0.022), clamp(pino, 0.0, 1.0) * 0.80);
col += vec3(0.86, 0.92, 0.62) * feixe * 0.32;
col += vec3(0.72, 0.80, 0.46) * (1.0 - smoothstep(0.0, 0.018, abs(el - horizonte))) * 0.18;
// Por cima da cabeça o mangue fecha-se: o tecto é mais escuro do que o resto da copa.
col = mix(col, vec3(0.008, 0.018, 0.010), smoothstep(0.85, 1.50, el) * 0.28);`
};
