// Águas correntes — installed by tools/shader/install.mjs.
//
// O corpo do fragment (o prelúdio vive em js/modules/shaders.js): escreve `vec3 col`, usa
// `uTime`/`az`/`el` e não lê texturas nem código externo.
export const shader = {
  id: "aguas",
  name: "Águas correntes",
  body: `// Água corrente: um rio largo, com o céu pálido em cima e a superfície em baixo. \`az\` dá a volta
// completa (−PI…+PI) e \`el\` sobe; a esfera é o mundo inteiro, por isso a corrente se fecha em anel em
// vez de ter margens.
//
// As ondas são **faixas paralelas ao horizonte**, e não riscas em volta do visitante: vistas de baixo,
// perto do horizonte elas são finas e comprimem-se, aos pés abrem-se. Duas camadas de ruído dobram o
// traçado e partem a crista, e é o ruído — com \`uTime\` dentro — que faz a superfície caminhar.
//
// Os smoothstep sobem sempre (aresta menor primeiro) e um \`1.0 -\` faz o resto: a ordem das arestas
// invertidas não é definida em GLSL, e há drivers que a leem ao contrário.
float horizonte = -0.03;
float ceu = smoothstep(horizonte - 0.012, horizonte + 0.012, el);
float prof = horizonte - el;
float dist = 1.0 / (prof + 0.05);

// Duas camadas de ruído: a de trás dobra o traçado, a da frente parte a crista.
float r1 = noise(vec2(az * 2.2 + uTime * 0.30, dist * 0.55 - uTime * 0.55));
float r2 = noise(vec2(az * 7.0 - uTime * 0.25, dist * 1.6 + uTime * 0.90));

// A fase corre para o visitante (\`dist\`) e é dobrada pelo ruído. O \`az\` entra pouco de propósito: uma
// onda que corresse só em \`az\` desenhava riscas verticais, que é o que uma superfície não faz.
float fase = dist * 2.6 + uTime * 1.8 + r1 * 5.0 + az * 1.4;
float faixa = sin(fase) * 0.5 + 0.5;
float faixa2 = sin(fase * 2.7 - uTime * 1.1 + r2 * 4.0) * 0.5 + 0.5;
float brilho = faixa * 0.62 + faixa2 * 0.38;

// A água: verde-azul fundo, e a crista clareia.
vec3 aguaCor = mix(vec3(0.012, 0.075, 0.11), vec3(0.06, 0.32, 0.40), smoothstep(0.15, 0.95, brilho));
aguaCor += vec3(0.30, 0.62, 0.68) * pow(brilho, 6.0) * 0.6;

// O sol, a 0,45 rad da origem: a coluna reflectida parte-se nas ondas.
float coluna = 1.0 - smoothstep(0.03, 0.22, abs(az - 0.45));
float brilhoSol = pow(0.5 + 0.5 * sin(fase * 1.7 + uTime * 1.3 + r2 * 6.0), 10.0);
aguaCor += vec3(1.0, 0.94, 0.75) * coluna * (0.18 + brilhoSol * 1.6);

// Junto ao horizonte a água é um espelho: quanto mais rasante o olhar, mais ela devolve o céu.
float espelho = 1.0 - smoothstep(0.0, 0.16, prof);
aguaCor = mix(aguaCor, vec3(0.55, 0.72, 0.82), espelho * 0.55);

// A espuma: as cristas que se encontram, mais visíveis perto dos pés.
float espuma = smoothstep(0.90, 1.0, brilho) * smoothstep(0.4, 1.5, dist);
aguaCor += vec3(0.78, 0.90, 0.93) * espuma * 0.35;

// O céu: azul alto a desmaiar para o horizonte, com as nuvens a passar devagar.
vec3 ceuCor = mix(vec3(0.68, 0.82, 0.90), vec3(0.20, 0.42, 0.68), smoothstep(horizonte, 1.2, el));
float nuvem = noise(vec2(az * 1.7 + uTime * 0.04, el * 5.0));
ceuCor = mix(ceuCor, vec3(0.96, 0.97, 1.0),
             smoothstep(0.56, 0.86, nuvem) * smoothstep(horizonte, 0.18, el) * 0.85);

col = mix(aguaCor, ceuCor, ceu);`
};
