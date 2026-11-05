# Spec — abrir uma sala nova

> **Estado: aprovada com as três propostas feitas** (2026-11-02), **posta à prova** numa sala
> descartável (2026-11-03, D90) e **levada às doze páginas da exposição** (D91). Nada nesta spec foi
> inventado: cada
> passo é o que o repositório já faz, e cada número citado é um número medido por uma ferramenta que lá
> está. A **fase 1** tem um comando (`tools/scene/new-world.mjs`) e as **fases 3–7** têm outro
> (`tools/scene/new-room.mjs`, que recusa sem a página da fase 1); as listas das baterias passaram a vir
> do dado; e o que continua à mão é
> o que a spec diz que continua à mão. A **§2.1** é o retrato do ponto de chegada — a estética de uma sala
> hoje, que é o que o roteiro tem de produzir. A **§9** junta o caso que
> não é uma sala: o **mundo de ensaio** (`scene100`, D84), onde se experimenta o que ainda não entra no
> caminho do visitante. A **§10** são as regras do **movimento sorteado** de cada porta (D87) — a única
> coisa de uma sala nova que o autor **não** decide — e a **§11** é esse mesmo movimento já **nas salas
> que existem** (D91): o que a medição obrigou a mudar no código, e o que não mudou.

> **Para que serve.** Uma sala nova toca **oito** sítios que não se vêem uns aos outros: a página, o
> dado da sala, o dado do portão, o dado de **cada** sala de destino, a folha das obras, os retratos
> (derivados), o **movimento das portas** (sorteado, §10) e a documentação. Eram **nove** até a P1: as
> listas de duas baterias eram escritas à mão e uma sala fora delas ficava verde sem ser medida — hoje
> vêm do dado (fase 9) e não há nada a acrescentar.
> Esquecer um deles não dá erro nenhum — dá uma exposição que abre e está errada, ou uma bateria verde
> que **não mediu a sala**. O roteiro existe para que o esquecimento seja impossível de confundir com
> sucesso.
>
> **O que esta spec não é.** Não é o guia do editor (esse vive no `README.md`, § «A página de
> edição»), não é o guia de testes de campo (`docs/GUIA-DE-TESTES.md`) e não decide a arte, os textos
> nem os shaders. Um **shader novo** tem caminho próprio (`tools/shader/validate.mjs`,
> `tools/regression/emenda.mjs`); esta spec só diz quando é que ele entra na ordem.

> **Se quem está a abrir a sala é uma IA, o caminho é o [`GUIA-NOVA-SALA.md`](GUIA-NOVA-SALA.md).**
> Não é uma sugestão nem um resumo: é o **mesmo roteiro, operacional** — os comandos por ordem e, em
> cada passo, a **frase** que a ferramenta tem de imprimir e o que fazer quando não a imprime. A
> divisão é esta: **esta spec lê-se para decidir e entender** (as leis, as medições, o porquê de cada
> ordem, as decisões D-A a D-D); **o guia lê-se para executar**. Uma IA que esteja a criar uma página
> nova, uma sala nova ou a mexer nos ficheiros que uma sala toca **começa pelo guia** e só volta aqui
> quando um passo do guia remeter para uma secção desta spec. Saltar o guia não dá erro — dá uma
> exposição que abre e está errada.

---

## 1. O que uma sala é, em seis objetos

| objeto | onde vive | quem o escreve | o que o guarda |
| --- | --- | --- | --- |
| a **página** | `<slug>/index.html` | `tools/scene/new-world.mjs` | `arranques.mjs` — o mesmo ficheiro da raiz, só com `<base href="../">` (D28) |
| o **dado da sala** | `data/worlds/<slug>.json` | o editor (exporta) | `validate.mjs` + as leis L1–L31 |
| as **obras** (texto, capa, site) | `data/obras.tsv` → os mundos | `tools/artwork/from-csv.mjs` | `from-csv --check`, a lei L20 e a ficha |
| as **posições** (dois anéis) | o mesmo JSON | `tools/scene/ring.mjs --aplicar` | L22 e L23 |
| as **portas de mundo** (janela, retrato, chegada, giro, mundo real) | o JSON da sala **e** o de cada destino | o editor + `azimuths.mjs` + `reality.mjs` + `portrait.mjs` | L11, L13, L16, L17, L19, L26, L28 |
| o **movimento das portas** (oscilação) | o mesmo JSON, em cada porta | `tools/scene/sorteio.mjs --aplicar` (sorteado, nunca escolhido — §10) | L29 (o alcance) |

O número de hoje, para se saber quando é que um passo ficou a meio: **14 páginas** (o portão e treze
salas), **19 ficheiros de mundo** (as 14 e 5 fixtures, dos quais a sala de ensaio da §9), **66 portas**
nas catorze páginas — **todas em movimento desde a D91** (§11) —, **67 obras**, **56 retratos** (um par
`.jpg` + `.png` por porta com janela de pré-visualização, contando as três da sala de ensaio), **31 leis**
(L1–L31) e **30 baterias** no `--full`.

E o número que a §10 acrescenta, porque é ele que uma sala nova vai ter de cumprir: **cada porta da
sala nova oscila**, e o sorteio do movimento é rejeitado uma vez em cada três (§10.3).

---

## 2. As decisões que se tomam antes de tocar em ficheiros

Nenhuma delas é reversível de graça, e as quatro mudam o que as fases seguintes fazem.

**D-A · O fundo.** Um shader dos onze (nada a instalar) ou um **panorama** (`kind: "image"`, 2:1,
≤ 2048×1024 — L14). Um shader novo obriga a `tools/shader/install.mjs` **antes** da fase 7 e a
`emenda.mjs` depois.

**D-B · Os destinos.** Três a cinco portas, **uma** ao portão (L24), e o conjunto de destinos
**diferente do de todas as outras salas** (L25). Com doze salas e cinco destinos possíveis em cada
uma, há combinações suficientes — mas a escolha tem de ser verificada, não presumida: `validate.mjs`
recusa, e a mensagem diz qual é a repetida. E há uma segunda conta a fazer **antes**: a sala de destino
ganha a porta de chegada, e se ela já tiver **cinco** portas (o máximo da L24) essa porta não cabe —
foi o que aconteceu à `scene1` na sala 12 (D93).

> **Desde o mapa (D96), esta decisão não se toma por sala — lê-se.** As vinte e sete salas já têm os
> seus destinos escritos em `data/mapa.json`, decididos uma vez com as duas contas acima e testados
> passo a passo. O comando exato sai de `node tools/scene/mapa.mjs --dossie <slug>`, e o que resta ao
> autor é **verificar** (`--sala <slug>`), não escolher. Escolher por conta própria é a única forma de
> uma sala nova contrariar o mapa — e o `mapa.mjs --check` apanha-a depois, quando já custou uma sala.

**D-C · Quem leva a chegada.** Por cada porta da sala nova que navega para `X`, a sala `X` passa a
precisar de uma porta que se declare a chegada dessa origem (L19) — e **no máximo uma por origem**
(L17). É esta decisão que faz uma sala nova mexer em duas ou três salas que já existiam.

**D-D · O movimento — que não é uma decisão.** As portas de uma sala nova **oscilam**, e o sorteio
não é do autor: eixos, amplitudes, ângulos e períodos saem do dado da própria porta e de um sorteio
com rejeição (§10). A única escolha que resta é **não** querer portas em movimento, e essa não existe
no roteiro — o que existe é a possibilidade de voltar a correr o `sorteio.mjs --aplicar` até gostar do
que saiu. (O painel **Portal** do editor mostra e deixa editar estes campos, porque é uma ferramenta e
não uma política; o que o roteiro diz é que **não** se editam à mão — volta-se a sortear. Um valor
escrito à mão não tem quem o defenda: a L29 julga-o, mas nada garante que a sala continue a parecer-se
com uma sala.)

### 2.1 · O ponto de chegada: a estética de uma sala hoje

Tudo o que as fases seguintes produzem tem de dar **isto**. Se uma sala nova não se parecer com esta
tabela, é a tabela que está certa — não é a sala que abre uma excepção.

| o quê | o que uma sala tem hoje | quem o mede |
|---|---|---|
| as obras | um anel de **60 m** de raio, à altura de 1,5 m, passo angular constante a partir do centro (onde o visitante entra) | `ring.mjs`, L22 |
| as portas | um anel **concêntrico de 90 m**, passo constante, e a folga angular da L23 para nenhuma obra tapar uma porta | `ring.mjs`, L23 |
| quantas portas | **3 a 5**, uma delas ao portão com `arrivalFrom` | L24 |
| o fundo | raio **500** (muito acima dos 60 m), e 2:1 quando é panorama | L1, L14 |
| o olho | **1,6 m** — é com ele que o alcance é medido | `reach.js` (`OLHO`) |
| o movimento | **cada** porta oscila: translação num eixo e rotação noutro, amplitude de translação = **metade da dimensão da porta nesse eixo**, rotação de **45° ou 90°** em módulo, **dois períodos** independentes, eixos **da porta** e não do mundo (nas doze páginas da exposição desde a D91 — §11) | §10, `sorteio.mjs` |
| o pivô | o **centro** da porta (`height/2`): o centro só sai do lugar pela translação | `motion.mjs` |
| o alcance | ≥ **50 %** do ciclo, senão o sorteio rejeita e volta a tirar | L29 |
| o repouso | a fase 0 é a pose do dado — é essa pose que os retratos desenham, e é nela que a oscilação começa quando a ponte de chegada sai | §10.5, §11.2, `anchorMotion()` |
| o retrato de cada porta | derivado do destino, a partir da pose de repouso | `portrait.mjs` |
| quem chega | toda a porta tem uma porta que se declara a sua chegada (L19); quem chega sem `?from` é julgado com o azimute **0** da primeira visita | L19, L26, L28 |

E o que **não** é estética, é a ausência dela: uma sala a sério **não é um fixture**. As isenções da
`scene100` (§9) vêm de ela estar em `js/scene/fixtures.js` e fora do grafo; pôr uma sala a sério nessa
lista é apagá-la do grafo, das chegadas e das baterias — o `new-room.mjs` recusa o slug (`é um fixture
de ensaio, não uma sala`).

---

## 3. O roteiro, fase a fase

**O atalho.** A **fase 1** tem um comando — `node tools/scene/new-world.mjs <slug>` — e as **fases 3 a
7** têm outro: `node tools/scene/new-room.mjs <slug> --destinos a,b`. O segundo **exige a página**: sem
`<slug>/index.html` recusa (`a página é da outra ferramenta: node tools/scene/new-world.mjs <slug>`),
para não deixar um mundo no grafo sem endereço.

```
node tools/scene/new-room.mjs <slug> --destinos scene3,scene6 [opções]

  --nome-pt "…"       o nome da sala em português (por omissão, o slug)
  --nome-en "…"       o nome da sala em inglês (por omissão, o slug)
  --fundo <mundo>     de que sala se copiam o fundo e a câmara (por omissão, `scene1`): traz o
                      `shaderId` (ou o panorama) e a imagem de reserva, com o mesmo raio
  --destinos a,b,…    **2 a 4** salas, **sem** o portão — ele entra sempre, e dá as 3 a 5 portas da
                      L24; o conjunto tem de ser diferente do de todas as outras (L25), e isso é
                      verificado **antes** de escrever
  --sem-ferramentas   só escreve o dado: não corre anéis, giro, buracos nem o validador
  --mapa              os destinos vêm de `data/mapa.json` (só os vizinhos que já existem)
  --so-a-sala         a ronda da **autoria** (D102): escreve só o ficheiro da própria sala; o portão,
                      as chegadas e as derivadas ficam para o `integrar.mjs`
```

Escreve o esqueleto do dado (as duas dimensões, o fundo com a reserva, as portas nos dois lados, os
assets dos retratos que ainda não existem) — o que a fase 2 **exportaria** e o que a fase 3 colocaria à
mão —, **sorteia o movimento** de cada porta (fase 6b, e imprime a **semente** na última linha) e corre
os anéis, o giro, os buracos e o validador. As fases abaixo continuam a ser a referência do que ele faz
por baixo — e o que ele **não** faz: as obras, a composição no editor e os retratos continuam a ser
passos à mão.

**Quando há vários agentes ao mesmo tempo (D102), o mesmo roteiro faz-se em duas rondas.** Cada agente
corre `new-room … --so-a-sala` — que escreve **só** `data/worlds/<slug>.json`, o ficheiro que é
exclusivo de quem o cria —, e no fim uma só pessoa (ou um só agente) corre `node
tools/scene/integrar.mjs`, que põe as portas no portão, escreve as chegadas que faltam em cada destino,
corre os anéis/giro/buracos/sorteio **uma vez** e fecha com o validador. O `integrar` é idempotente: a
segunda passagem diz `nada a fazer`, e `--seco` diz o que falta sem escrever (sai com **1** quando há
trabalho pendente — é a bateria do `all.mjs`). Entre as duas rondas a sala é um esqueleto legal mas
**não visitável**: sem porta no portão não se chega lá. O corte é autoria → fecho, e não «salas →
portais» — uma sala sem portas viola a L24, a L19 e a alcançabilidade.

**Quantas salas cabem ao mesmo tempo não é uma escolha (D103).** Uma sala só nasce com **duas**
vizinhas construídas, por isso a construção tem **ondas**: `node tools/scene/mapa.mjs --ondas` imprime
o plano (hoje 10 ondas, no máximo 2 salas em paralelo, e só a `scene14` na primeira), e
`node tools/scene/mapa.mjs --dossie <slug>` dá a folha de um agente com o comando exato — ou diz que a
sala está bloqueada e por que onda espera.

**E as ondas fazem-se sozinhas (D104).** `node tools/scene/construir.mjs` abre a próxima onda,
`--todas` percorre o plano até ao fim, `--seco` diz o que faria. Dentro de cada onda as salas correm em
paralelo e no fim há **um** `integrar`; medido, as catorze salas em **4 s**. Isto levanta os
**esqueletos** — o que fica por fazer é o que é do autor: as obras, a composição no editor e os
retratos, sala a sala.

Cada fase diz **o comando**, **o que ele tem de dizer** e **o que fazer se não disser**. Só se avança
com a fase anterior verde: a fase 8 (retratos) custa minutos de GPU e não se gasta a descobrir um erro
que a fase 7 apanhava em segundos.

### Fase 0 · A folha das obras (antes de tudo o resto)

A **ficha** de cada obra entra pela folha, não pelo editor: `data/obras.tsv` é a **fonte da verdade** do
nome, dos créditos, do descritivo, da capa e do site. As **obras em si** — quantas, e com que `id` —
nascem no editor (fase 2, painel Obra): a folha **preenche** uma obra que já exista com aquele `id`, e
uma linha para uma obra que não existe responde `obra <id> não existe no mundo <slug>`.

```
(editar data/obras.tsv: uma linha por obra, colunas por TABULAÇÃO, `mundo` = o slug novo)
node tools/artwork/from-csv.mjs --check          # mostra o que mudaria, não escreve nada
```

A folha que o autor manda **não** tem a coluna `mundo` (a sala é uma só, e ele não repete o slug em cada
linha) nem o `id` a começar no zero, e os endereços do Drive vêm na forma `/file/d/<ID>/view`, que é uma
**página** e não carrega. As três conversões — `mundo` à esquerda, `id` de 0 a N−1, e
`lh3.googleusercontent.com/d/<ID>` — estão no guia (§4.1), com a mensagem exata que o importador dá
quando a primeira falta: `falta a coluna "mundo" — acrescente-a como PRIMEIRA coluna`.

**A folha vem no chat, e vai direta para a mãe.** O autor manda a folha da sala na conversa; o agente
acrescenta as linhas a `data/obras.tsv` com as três conversões do guia (§4.1) e aplica com
`node tools/artwork/from-csv.mjs`. Não se cria uma pasta `obras/` debaixo de `data/`: a L20 usa esse
nome para acusar as fichas antigas, e `data/obras/` cai na regra (v0.0.35, desfeito na v0.0.36).
