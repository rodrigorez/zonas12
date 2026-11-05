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

Cada fase diz **o comando**, **o que ele tem de dizer** e **o que fazer se não disser**. Só se avança
com a fase anterior verde: a fase 8 (retratos) custa minutos de GPU e não se gasta a descobrir um erro
que a fase 7 apanhava em segundos.

### Fase 0 · A folha das obras (antes de tudo o resto)

As obras entram pela folha, não pelo editor: `data/obras.tsv` é a **fonte da verdade** do nome, dos
créditos, do descritivo, da capa e do site.

```
(editar data/obras.tsv: uma linha por obra, colunas por TABULAÇÃO, `mundo` = o slug novo)
node tools/artwork/from-csv.mjs --check          # mostra o que mudaria, não escreve nada
```

- **Tem de dizer:** ou `a folha não muda nada: o dado já diz o mesmo` (quando já está aplicada, saída
  **0**), ou a lista do que mudaria e, no fim, `mudaria: <mundos> (nada foi escrito: --check)` — que
  **sai 1**.
- **O código de saída do `--check`:** **1 quando há o que mudar, 0 quando não há.** Aqui o 1 quer dizer
  «há trabalho», não «avaria» — a avaria diz-se pelo texto (`nada foi escrito:` com as linhas por
  baixo: TAB a faltar, coluna a mais, URL inválida, mundo inexistente). É por isso que a fase 0 se lê
  pela **frase**, e que a fase 3 confirma com um `--check` a sair **0** depois de aplicar.
- **A conferência só vale depois de o mundo existir** (§3, fase 2): uma linha da folha para um mundo
  que ainda não está no disco faz o importador responder `linha N: o mundo "<slug>" não existe`. Por
  isso a folha **escreve-se** cedo (é a fonte da verdade) mas **aplica-se** depois da fase 2 — e é
  assim que uma linha escrita cedo demais se reconhece.
- **Se não disser:** a folha está mal formada (TAB a faltar, coluna a mais, URL inválida). O
  importador recusa e diz a linha.
- `from-csv.mjs` **sem** `--check` só depois de as obras existirem no mundo com o `id` certo (§3, fase 2).

### Fase 1 · A pasta e o arranque

```
node tools/scene/new-world.mjs <slug>
```

- **Tem de dizer:** `criado: <slug>/index.html` e `arranques: N mundos conferidos`.
- **Se não disser:** o slug tem maiúsculas/acentos (`^[a-z0-9-]+$`), ou a pasta já existe, ou o
  `index.html` da raiz perdeu o `<base href="./">`.

### Fase 2 · O mundo no editor

> **O atalho dispensa esta fase** e não a substitui: o `new-room.mjs` escreve o **dado** que a
> exportação produziria (e as chegadas da fase 3), mas não escolhe as obras nem compõe a sala. Quem usa
> o atalho volta ao editor só para compor — e exporta então por cima do esqueleto.

Abrir o editor e construir a sala (a cópia de uma sala vizinha é o caminho normal — o editor exporta,
a ferramenta não inventa a sala):

1. **Painel Mundo** — o nome por língua (`pt` e `en`, os dois) e o `slug`.
2. **Painel Dimensão** — a `0`: o shader com a sua `fallbackAsset` (ou o panorama), e o **raio**
   (as outras salas usam `500`, muito acima dos 60 m do anel das portas — L1).
   A `1`: `kind: "camera"`, a dimensão do mundo real (é ela que a janela da porta mostra).
3. **Painel Obra** — as obras desta sala, com os `id` que a folha usa (0, 1, 2… **não se mudam**).
4. **Painel Portal** — três a cinco portas, uma delas com `action.target: "gate"` e
   `arrivalFrom: "gate"`; as outras com o retrato, o raio da janela e o destino decidido em D-B.
5. **Painel Mundo → exportar** — o `data/worlds/<slug>.json`. A exportação **recusa** um mundo com
   erros; avisos não a travam.

E, no **portão**, a porta para a sala nova: painel **Mundo → «nova sala»**, que cria a porta com a
janela, o retrato e o raio, e mostra o comando da fase 1 (o editor nunca escreve em disco — D2).

- **Tem de dizer:** a exportação escreve o texto sem erro; o mapa da casa do painel Mundo deixa de
  assinalar a sala nova.
- **Se não disser:** ler a mensagem do painel — é a mesma lei que o `validate.mjs` há-de dar na fase 7.

### Fase 3 · O dado no disco, e as salas que a sala nova toca

1. Colocar os ficheiros exportados (`data/worlds/<slug>.json` e `data/worlds/gate.json`).
2. Abrir **cada** sala de destino escolhida em D-C e acrescentar-lhe a porta com
   `arrivalFrom: "<slug>"` (o caminho de volta que a L19 exige), e exportar **essa** também.
3. Aplicar a folha: `node tools/artwork/from-csv.mjs`.

- **Tem de dizer:** o importador escreve nos mundos e sai **0**.
- **Se não disser:** a folha tem uma obra com um `id` que não existe no mundo, ou uma linha que tira o
  site e a imagem ao mesmo tempo (recusado).

### Fase 4 · Os dois anéis

```
node tools/scene/ring.mjs --posicoes <slug>      # só lê: mostra onde a regra poria as obras e as portas
node tools/scene/ring.mjs --aplicar               # sem argumentos: **todos** os mundos
```

- **Tem de dizer:** a folga entre os anéis chega (L23), cada anel tem passos iguais (L22) e o desvio
  ao raio fica dentro da tolerância de 0,5 m. As obras ficam a **60 m** e as portas a **90 m** (D93; eram
  40 e 60 até a sala 12). No fim: `13 mundo(s) · 12 com anel de obras · 13 ok, 0 justo(s), 0 falha(s)` e
  `o dado: 13 de 13 em anel (nada a fazer)` — é esta a frase de hoje.
- **Porque em todos e não só nos que a sala toca:** uma porta nova muda o número de lugares do anel
  dessa sala, e o anel distribui os lugares por igual (L22) — **todas** as portas dessa sala mudam de
  sítio. Medido no ensaio da spec: com os anéis a correr só nos mundos tocados, o validador acusou a
  L26 em **sete** portas de **quatro** salas que ninguém tinha tocado. Nas 12 páginas de hoje as três
  ferramentas são **idempotentes** — correm sobre tudo e dizem «nada a fazer» —, por isso correr sobre
  tudo não custa nada.
- **Se não disser:** uma obra é mais larga do que a folga permite — a mensagem diz quantos graus são
  precisos e quantos há. Só nesse caso se mexe na largura da obra ou no número delas.

### Fase 5 · O giro de cada retrato

```
node tools/scene/azimuths.mjs --aplicar          # sem argumentos: todos
```

Escreve `window.azimuth` em cada porta de mundo (L26): sem ele, o que se vê pela janela está girado em
relação ao que se vê ao chegar (medido antes da correcção: **27,79** de salto, com a meta em 0,50).

- **Tem de dizer:** `49 porta(s) de retrato, 0 sem porta de chegada, 3 de primeira visita` e
  `o dado já diz o mesmo — nada a escrever` (é esta a frase do ensaio, e o mesmo vale com `--aplicar`:
  `nada a escrever`). As **3 de primeira visita** são as portas da sala de ensaio, que não têm porta de
  chegada porque navegam sem origem (D84/D89).
- **Se não disser:** se contar portas **sem porta de chegada**, a porta de chegada do destino não está
  posta (fase 3) — e é a L19 que a aponta.

### Fase 6 · Os buracos do mundo real

```
node tools/scene/reality.mjs --aplicar           # sem argumentos: todos
```

Escreve `window.reality` (os retângulos onde o destino mostra a câmara — L28), para que a janela fure o
fundo ao vivo e o visitante veja a **mesma** câmara antes e depois de atravessar.

- **Tem de dizer:** `49 porta(s) de retrato, 34 com o mundo real à vista, 0 sem porta de chegada` e
  `o dado já diz o mesmo — nada a escrever` (é esta a frase do ensaio).
- **Se não disser:** o destino não tem a dimensão `camera`, ou a porta de chegada não está posta.

### Fase 6b · O movimento das portas (sorteado, e medido)

```
node tools/scene/sorteio.mjs <slug>                 # ensaio: diz o que sortearia, não escreve
node tools/scene/sorteio.mjs <slug> --aplicar       # escreve no dado
node tools/scene/sorteio.mjs <slug> --aplicar --semente 99   # o mesmo sorteio outra vez
node tools/scene/sorteio.mjs <slug…> --aplicar --sem-movimento
                                                    # só as portas que ainda não oscilam
```

Aceita **vários mundos numa só chamada** (`gate scene1 … scene11`), e foi assim que as doze páginas da
exposição foram sorteadas na D91 (§11) — uma semente, uma passagem, a mesma ordem de portas.

`--sem-movimento` é para as portas **que a fase 3 acrescenta a mundos que já existiam** — a do portão e
a de chegada em cada destino, que nascem paradas: ele sorteia só essas e deixa as outras como estão, com
a linha `já oscila — fica como está`. Foi o que faltou na sala 12 (D93): a porta do portão para a sala
nova ficou parada e **nenhuma lei a julgava** (a L29 mede o alcance de uma porta *que oscila*), e foi um
olho humano a ver. Hoje o `new-room.mjs` chama esta ferramenta com os mundos que tocou e com esta opção,
e a bateria do movimento exige `motion: sway` em **todas** as portas das páginas da exposição.

Sorteia, **por porta**, o eixo e a amplitude da translação, o eixo e o ângulo da rotação e os dois
períodos (a §10 tem as regras e o porquê), e **repete o sorteio enquanto o alcance do visitante (a
L29) for menor do que 50% do ciclo**. A porta que volta ao portão entra no sorteio como as outras: a
D59 deixou de proibir uma porta de chegada em movimento, porque a chegada lê a **pose de repouso**, que
é a do dado (§10).

- **Tem de dizer:** uma linha por porta com o eixo, a amplitude, o ângulo, os dois períodos e o
  **alcance medido**; no fim, `N portas · N aceites · M rejeitados`; e, na **última linha**, a
  `semente` que gerou este sorteio.
- **A semente é o que fica.** O sorteio não é uma escolha do autor (§2, D-D), mas **repetir** um
  sorteio é: é para isso que a semente é impressa. Quem gostar do que saiu guarda-a (ela vai para o
  commit, na mensagem); quem quiser outra sala corre outra vez sem `--semente`.
- **Se não disser:** a porta não tem `width`/`height` (a amplitude sai delas), a sala tem menos de
  três portas (L24), ou um dos períodos saiu fora de `[10, 20]`.
- **Porque é antes da fase 7:** a L29 é uma lei como as outras — um sorteio que não a passa não se
  escreve, e o validador da fase 7 volta a calculá-la do dado para provar que o ficheiro não foi
  editado à mão depois.

### Fase 7 · O validador e as leis (a porta de entrada para o resto)

```
node tools/scene/validate.mjs
node tools/scene/laws-selftest.mjs
```

- **Tem de dizer:** `data/worlds/<slug>.json: OK (…)` para cada ficheiro, e as **35 de 35** avarias
  injectadas detectadas com o controlo limpo.
- **O que ainda pode estar vermelho aqui, e só isto:** a **L9**, nos retratos da sala nova — os
  ficheiros são derivados e só nascem na fase 8. Tudo o resto (L19, L22, L24, L25, L26, L28 e a **L29**,
  que é a que o sorteio da fase 6b tem de passar) tem de estar limpo **antes** de se gastar GPU. O
  validador volta a correr no fim da fase 8, e aí é a verde completa.
- **Se não disser:** **não se avança**. As mensagens citam a lei e a lei está explicada na §8 do
  `ROADMAP`.

### Fase 8 · Os retratos (derivados, e sempre duas passagens)

```
node tools/scene/portrait.mjs --todos
node tools/scene/portrait.mjs --todos      # a segunda passagem, sempre
```

- **Tem de dizer:** um par `assets/previews/<destino>-de-<origem>.jpg` e
  `recorte-…png` por porta com janela, e nenhum erro de página.
- **Porquê duas vezes:** o retrato de uma sala contém as **janelas das portas dessa sala**, que são
  retratos deles próprios. A primeira passagem cozinha o que lá estava, a segunda o que ficou (medido:
  o mesmo retrato saiu com 438, 215 e 378 kB em passagens seguidas). Orçamento: **387 a 418 s** por
  passagem com **39** retratos (medido a 2026-11-01); com os **49** de hoje (D93) são ~25% mais, e a
  passagem passou a **assentar as portas** antes de desenhar (§10.5), o que não muda o tempo.
- **O que mudou na D87:** o retrato é a imagem da **pose de repouso** — a que o visitante vê ao chegar.
  Se as portas do destino oscilarem e o `settleMotion` não for chamado, a fotografia sai num instante
  arbitrário e a janela deixa de mostrar o que a chegada mostra. O `portrait.mjs` chama-o sozinho; o
  que não se pode é tirá-lo de lá.
- **Quando é que isto se repete:** sempre que **mover uma obra** ou uma porta mude o que se vê de
  dentro de uma sala. É o passo que mais se esquece, e não dá erro — dá uma janela com a sala de ontem.

### Fase 9 · As listas das baterias (a armadilha que não avisa) — **fechada**

As duas baterias que medem a exposição página a página liam a lista de páginas **escrita à mão**, e uma
sala que não estivesse nela nunca era medida — a bateria ficava verde sem ter olhado para ela. Desde a
**P1** as duas listas vêm do dado (`tools/regression/paginas.mjs`), por isso não há nada a acrescentar:

| ficheiro | o que passou a fazer |
| --- | --- |
| `tools/regression/paginas.mjs` | deriva as páginas de `data/worlds/` (portão primeiro, salas pelo número, e os **fixtures abertos** no fim: o `example` e a sala de ensaio `scene100`) |
| `tools/regression/twelve-tests.mjs` | `PAGINAS` = a derivação, e uma verificação de cobertura |
| `tools/regression/traversal-tests.mjs` | `MUNDOS` = a derivação, e a mesma verificação de cobertura |

- **Tem de dizer:** a verificação **«a lista cobre todas as salas do dado (N)»**, com o mesmo N do
  `validate.mjs`, e a contagem de páginas uma acima da de ontem.
- **Se não disser:** a derivação filtrou a mais (ou um ficheiro não abre) — a mensagem nomeia a sala que
  ficou de fora. É a **P3** a falar.
- As chegadas que são uma escolha e não uma derivação estão nomeadas numa linha só do `paginas.mjs`
  (`CHEGADAS`): hoje o `scene2` abre-se vindo do `scene1` e o `scene3` vindo do `scene2`, para os testes
  exercitarem uma chegada que não seja a do portão.

### Fase 10 · A verificação inteira

```
node tools/regression/all.mjs            # a verificação da fase (minutos)
node tools/regression/all.mjs --full     # a mesma mais as arquivadas (as 28)
```

- **Tem de dizer:** `28 de 28 baterias passaram` e o tempo total.
- **O que se aceita hoje:** **27 de 28**, com a única vermelha a ser a **costura das travessias**
  (**D46**), vermelha desde antes do anel. O número dela tem de ser **comparado com o último registo**,
  não com zero, e o caso novo tem de ser explicado na documentação. Qualquer outra vermelha é uma
  paragem.
- **O último registo (2026-11-03, D93):** **3 de 28** vermelhas em **3 350,7 s** — a costura, a
  `shader.mjs` e o **catálogo de assets** (`assets.mjs`). As duas últimas não são do dado. A
  `shader.mjs` falhou por **dois** quadros fora do orçamento (`late=2` em 165, e o resumo deixa de casar
  com a forma que a bateria exige) e passa **23 de 23** quando repetida sozinha. O `assets.mjs` decidia
  por **relógio**: esperava **2,5 s** fixos pelo editor redesenhar os painéis, e a validação de um
  mundo com 21 assets (sete deles remotos, um `fetch` por asset) leva **1 a 3 s** — ora passava, ora o
  campo do asset novo ainda não existia e o passo seguinte rebentava com
  `Cannot set properties of null`. A bateria passou a esperar pela **condição** (até 12 s), que é o que
  ela queria medir; e passa **10 de 10**. A **costura** deu **140 de 150** numa passagem e **142 de 150**
  na seguinte (eram **125 de 128**, com **3** vermelhos, no registo da D91): os vermelhos são da mesma
  família de sempre — **cinco** saltos no corte acima de 0,50 (**0,72 · 1,06 · 1,44 · 1,49 · 2,44**, e
  não «na casa dos 0,5» como antes), **dois** instantes de corte acima de um quadro e **um** fotograma
  escuro intermitente —, e nenhum deles é um caso novo de comportamento: são as portas que a mudança de
  raio moveu e que a costura já vigiava. O número de verificações subiu de **128 para 150** porque a
  exposição passou de 50 para 58 portas. Um soluço da máquina não é um defeito do dado, mas também não
  se escreve «28 de 28»: repete-se a bateria e diz-se o que ela deu. **A D46 continua aberta**, e o que
  ela pede agora está escrito: perceber porque é que uma sala maior (60/90 m) agrava o salto, quando o
  retrato e a chegada são cozidos da **mesma** pose.
- **Se não disser:** a bateria vermelha diz qual é e porquê.

### Fase 11 · A documentação e a versão

1. `docs/ROADMAP.md`: um bloco de atualização no cabeçalho (o que mudou e **o que foi medido**) e, se
   houver decisão nova, uma linha na §11.
2. `README.md`: o número de salas/portas/obras/retratos e a linha da bateria nova, quando houver.
3. `docs/PRE-EXPOSICAO.md`, se a sala trouxer conteúdo que falte ao público.
4. Commit em português, narrativo, com o trailer `Co-authored-by`; `main` e o ramo da versão
   (`v0.0.NN`).

---

## 4. As armadilhas, e o que cada uma custou

| # | armadilha | o número que a prova | o que a evita |
| --- | --- | --- | --- |
| T1 | a sala não entra nas listas das baterias e fica **verde sem ser medida** | o caso da sala 11: as listas foram escritas à mão e a bateria não a via | **fechada pela P1** — as listas vêm do dado, com a verificação de cobertura da P3 |
| T2 | os retratos são **derivados** e envelhecem quando uma obra se move | a janela de uma porta mostrava a sala de ontem | fase 8, duas passagens |
| T3 | a porta por onde se chega **não entra na fotografia** (D79) — se entrar, ocupa metade do retrato | os recortes caíram de 398 kB para 57 kB de média | `portrait.mjs` já a esconde; não desactivar |
| T4 | duas salas com o **mesmo conjunto** de destinos (L25) | a mensagem diz qual é a repetida | decisão D-B antes de exportar, e o `new-room.mjs` recusa antes de escrever |
| T5 | a chegada **dentro da caixa** de outra porta, ou a menos de meia profundidade (L4, L16) | o visitante aparece dentro de uma parede | `ring.mjs` ancora o anel na **porta de chegada** (fica no lugar mais próximo do azimute 0); não a mover à mão |
| T6 | o **giro** do retrato (L26) e os **buracos** do mundo real (L28) são contas, não gostos | 27,79 e 0,72 a 1,70 de salto na costura | `azimuths.mjs` e `reality.mjs`, fases 5 e 6 — **em todos os mundos**, não só nos tocados |
| T7 | o **fundo** tem de ser maior do que o anel (L1) e 2:1 quando é panorama (L14) | um fundo dentro da janela | raio `500`; reserva 2048×1024 |
| T8 | os `id` **448–511** são das dimensões derivadas de pré-visualização (L15) | o editor recusa | dimensões `0` e `1`, como todas |
| T9 | o texto das obras vem **da folha**, e os `id` não se mudam | a ficha deixa de dizer o que a obra é | fase 0 e `from-csv --check` |
| T10 | o shader novo tem de **fechar na emenda** (D82) | 56,63 de degrau em `aguas` antes da correcção | `validate.mjs --all` e `emenda.mjs` |
| T11 | o EOL dos ficheiros de dado **não é o mesmo em todos**: hoje **doze são CRLF** (o portão e as onze salas) e **cinco são LF** (os fixtures) — uma ferramenta que reescreva tudo muda o ficheiro inteiro | um diff de 5 000 linhas por uma posição | `ring.mjs`, `azimuths.mjs`, `reality.mjs`, `sorteio.mjs` e `new-room.mjs` preservam o EOL de cada ficheiro que tocam; um ficheiro novo sai em `\n` |
| T12 | um ficheiro gravado no Windows pode levar **BOM** | um `\ufeff` no início do commit | gravar UTF-8 sem BOM |

As armadilhas do movimento das portas são **T13 a T17**, na §10.7 — ficam lá porque só existem desde a
D87, e é lá que as regras que as evitam estão escritas.

---

## 5. Os ficheiros que uma sala nova toca (o registo real da sala 11)

Não é uma previsão: é o commit `08b644f` («A sala 11 entra…»), que é a última sala que entrou.

| ficheiro | o que muda |
| --- | --- |
| `data/worlds/<slug>.json` | novo (+343 linhas na sala 11) — e, desde a D87, o `motion` de cada porta |
| `data/worlds/gate.json` | a porta nova (+95) |
| `data/worlds/<cada destino>.json` | a porta de chegada (+59 numa sala) |
| `data/obras.tsv` | as linhas das obras (+5) |
| `<slug>/index.html` | novo (+93) |
| `assets/previews/*.jpg` e `*.png` | os retratos novos **e os das salas vizinhas**, refeitos |
| `js/shaders/<id>.js` + `js/modules/shaders.js` | só se a sala trouxer shader novo |
| ~~`tools/regression/twelve-tests.mjs`~~ | **já não** — a lista de páginas vem do dado (P1, fase 9) |
| ~~`tools/regression/traversal-tests.mjs`~~ | **já não** — a rota vem do dado (P1, fase 9) |
| `docs/ROADMAP.md`, `README.md`, (`PRE-EXPOSICAO.md`) | o registo e os números |

Nada em `js/scene/` mudou — as leis servem a sala nova sem uma linha de código novo — e a **D87 não
abriu excepção**: a L29 e o `reach.js` entraram **uma vez**, para todas as salas. Quando uma sala
precisar de uma lei que não existe, é sinal de que está a pedir uma lei, e isso é uma decisão, não um
passo.

Desde a **P2**, sete destas linhas são escritas pelo `tools/scene/new-room.mjs` numa só chamada (com a
página da fase 1 já no sítio — ele exige-a): o dado
da sala (as duas dimensões, o fundo e a reserva, as portas), a porta no portão, a porta de chegada em
cada destino, as entradas de asset dos retratos que ainda não existem — e, desde a D87, o **movimento
sorteado** de cada porta. O que fica para o autor é o que não é aritmética: **as obras na folha**, a
**composição** no editor e os **retratos**.

---

## 6. A aceitação: a lista que fecha a sala

Uma sala está pronta quando **todas** estas linhas forem verdade, pela ordem em que se correm:

- [ ] a folha `data/obras.tsv` já tem as linhas da sala, e o `node tools/artwork/from-csv.mjs --check`
      diz `mudaria: <slug> (nada foi escrito: --check)` — sai **1**, e aqui o 1 é «há trabalho»
- [ ] `node tools/scene/new-world.mjs` já correu e `<slug>/index.html` existe
- [ ] `node tools/scene/new-room.mjs <slug> --destinos …` escreveu o esqueleto e as portas nos dois lados
      (ou as fases 2–3 foram feitas à mão no editor, com o mesmo resultado)
- [ ] `node tools/artwork/from-csv.mjs` escreveu as obras nos mundos, e o `--check` seguinte sai **0**
      (`a folha não muda nada: o dado já diz o mesmo`)
- [ ] o `validate.mjs` diz **OK** no ficheiro novo **e** nos que ele tocou; a **única** coisa vermelha
      admitida aqui é a L9 dos retratos
- [ ] o `laws-selftest.mjs` diz **35 de 35** e o controlo limpo
- [ ] o `ring.mjs` não tem desvios acima de **0,5 m** e a folga L23 passa
- [ ] o `azimuths.mjs` e o `reality.mjs` dizem `nada a escrever` (e, na primeira vez, escrevem e voltam
      a dizer o mesmo) — a frase de cada um está na fase 5 e na fase 6
- [ ] o `sorteio.mjs <slug>` escreveu um `motion` em **cada** porta e todas passam a **L29** (o alcance
      ≥ 50% do ciclo), com os dois períodos em `[10, 20] s` — §10
- [ ] há um par de retratos por porta com janela, **desenhados com as portas assentes**
      (`settleMotion`), todos com data de hoje, e o `validate.mjs` volta a dizer **OK** sem a L9
- [ ] o `twelve-tests.mjs` diz **«a lista cobre todas as salas do dado (N)»** com o N do validador
- [ ] o `traversal-tests.mjs` prova que **parado o visitante não é levado** pela porta em movimento e
      que **a andar ao lado do plano também não** — e que a atravessar o plano é (o controlo, D91)
- [ ] `node tools/regression/all.mjs --full` dá **30 de 30** (ou a única vermelha é a D46, com o
      número comparado com o último registo — e uma bateria que falhou por um quadro tardio repete-se
      antes de se escrever o resultado)
- [ ] o `README.md` e o `ROADMAP.md` têm os números novos
- [ ] o commit está no `main` e no ramo da versão
- [ ] a **prova visual** foi feita — e está registada abaixo, com a data

E a prova visual, que nenhuma bateria substitui: **entrar pela porta do portão, olhar em volta, sair
pela porta de volta, e voltar a entrar** — é o caminho que o visitante faz e o único que exercita a
chegada, o giro e o retrato ao mesmo tempo.

> **Feita (2026-11-03, o autor):** as **doze páginas** publicadas no GitHub foram percorridas à mão,
> com as **50 portas a oscilar** — o portão e as onze salas, o caminho completo de cada porta (entrar,
> olhar em volta, sair pela porta de volta, voltar a entrar) —, e o resultado foi **sucesso**. É a
> primeira vez que a estética da §2.1 e o movimento da §10/§11 passam por um olho humano em todas as
> salas ao mesmo tempo; as baterias medem o que sabem medir, isto mede o resto.
>
> **Feita (2026-11-04, a sala 13 — D95):** a `scene13` foi aberta no servidor local
> (`node tools/server/serve.mjs`) e percorrida pelo caminho do visitante. O que se viu: a **cúpula de
> painéis** do `projecao` — vinte colunas com moldura escura, o tom a mudar de painel para painel, o
> chão da grelha a apanhar a poça de luz e o pó fino a acender-se —, **seis obras** pequenas ao longe
> (os 4 m a 60 m) e as **quatro portas** de 10 m a 90 m, com a moldura vermelha; ao rodar a vista, a
> esfera **fecha sem costura visível**. As duas fotografias a **quatro segundos** de distância mostram a
> mesma porta **rodada** (oscila). A porta do portão tem a janela de duas dimensões e mostra a câmara
> (esta máquina tem o sensor ligado, e é o que se vê dentro da moldura); a de `scene7` mostra o fundo
> `aguas` ao vivo, e as outras duas os retratos dos destinos. Ao atravessar para `/?from=scene13`
> vê-se o **portão com treze portas** — e a travessia das quatro portas da sala está medida pelo T1
> (**8 de 8**, o giro e a chegada incluídos).

---

## 7. As três propostas — feitas

Deixaram de ser propostas. Ficam aqui com o que cada uma se tornou, porque a terceira mudou de forma
ao ser feita.

**P1 · As listas das baterias lêem o dado. Feita.** `tools/regression/paginas.mjs` deriva as páginas de
`data/worlds/` e as duas baterias (`twelve-tests.mjs`, `traversal-tests.mjs`) passam a usá-la. O que
continua a ser uma escolha está nomeado numa linha (`CHEGADAS`), e não espalhado por duas listas. Prova:
uma sala de ensaio criada de propósito foi medida pelos T2–T12 **sem uma única linha de código a mais**
— 8 de 8 verificações, incluindo os 84 poses e os 23 098 amostras do T2/T3.

**P2 · `tools/scene/new-room.mjs`. Feita.** Escreve o esqueleto (câmaras, dimensão `0` com o fundo e a
reserva copiados de uma sala que existe, dimensão `1` camera, o raio, a porta do portão com a janela da
câmara, as portas dos destinos com o retrato e o recorte, e as entradas de asset dos retratos que ainda
não existem) **nos dois lados** — a sala nova, o portão e cada destino — e depois corre os anéis, o
giro, os buracos, o **sorteio do movimento** (D87, com a semente impressa) e o validador. Recusa antes
de escrever: o slug (e o slug de um **fixture**, que não é uma sala), a pasta, o ficheiro que já existe, o
destino que não existe, o número de portas da L24 e o conjunto repetido da L25 (que a spec põe como
armadilha T4). Prova: a mesma sala de ensaio, criada só com o comando, ficou com **13 salas
alcançáveis**, todas as chegadas (L19), os conjuntos distintos (L25), os giros certos (L26) e os buracos
certos (L28) — e o `validate.mjs` a verde em tudo menos a L9 dos retratos, como a fase 7 prevê.

**P3 · A cobertura. Feita, com outra forma.** Como aviso do validador seria código morto: com as listas
derivadas do dado, «um mundo fora de todas as listas» deixou de ser possível. O que passou a existir é
a rede do outro lado — a derivação declara as salas que ficaram de fora e as baterias verificam
**«a lista cobre todas as salas do dado (N)»**, com o mesmo N do validador. É o que falha se a
derivação filtrar a mais, ou se um ficheiro de mundo deixar de abrir.

**O que fica por fazer, e é honesto dizê-lo:** a sala de ensaio provou o caminho, mas não provou os
**retratos** (não se gastaram 14 minutos de GPU num ensaio) nem a composição no editor. Esses dois
passos continuam a ser os que a spec não automatiza — e são os que a próxima sala real vai exercitar.

---

## 8. O que fica registado desta validação

1. **A ordem das fases** ficou como proposta, com uma emenda que o ensaio obrigou: as fases 4 a 6 correm
   sobre **todos** os mundos (medido: só nos tocados, a L26 rebentava em sete portas de quatro salas).
2. **A fase 7 admite uma única coisa vermelha** — a L9 dos retratos —, e o validador volta a correr
   depois da fase 8. Sem essa emenda, a ordem «barato primeiro» seria impossível.
3. **A fase 9 deixou de ser manual** (P1 + P3).
4. **O `new-room.mjs` é o atalho das fases 3 a 7** (a fase 1 é o `new-world.mjs`, e o atalho recusa
   sem ela), e a spec continua a explicar o que ele faz por baixo.
5. **Em aberto, para a próxima sala real:** os retratos (duas passagens) e a composição no editor são
   os dois passos que nenhum ensaio cobriu.
6. **A fase 6b entrou depois da D87** — o movimento é sorteado, não escolhido —, e com ela a **L29**: um
   sorteio que deixe a porta fora do alcance do visitante não se escreve.
7. **A verificação de 2026-11-02** (a documentação contra o método) corrigiu **onze** pontos de
   coerência — contagens de leis e de avarias, frases de ferramentas, o que a fase 5 e a fase 6 mandavam
   esperar, a nota da sala de ensaio, a semente do sorteio — e fechou o único buraco que encontrou: as
   portas de uma sala **sem chegada** passaram a ser julgadas pela L26 e pela L28 (D89). Fica por medir
   a **costura** dessas portas, e está escrito na §9.
8. **A verificação de 2026-11-03** correu o roteiro **à letra**, numa sala descartável (`sala-teste`,
   apagada a seguir): o guia produz a estética nova — 3 portas, todas a oscilar, alcances de 60,0 %,
   61,8 % e 100 %, nenhuma a varrer a chegada, e o validador verde em tudo menos a L9, como a fase 7
   admite. O ensaio desmentiu a documentação em quatro pontos, e fechou-os: o «atalho das fases 1 a 7»
   era **falso** (o comando exige a página da fase 1 e recusa sem ela, e não compõe a sala), a linha de
   comando completa (`--nome-pt`, `--nome-en`, `--fundo`, `--sem-ferramentas`, os 2 a 4 destinos) não
   estava escrita, a estética de uma sala não tinha um sítio único (§2.1) e faltava o aviso de que uma
   sala a sério **não** é um fixture.
9. **O movimento deixou de ser só das salas novas** (D91, §11): as doze páginas da exposição têm hoje as
   **50 portas a oscilar**. Isso não mudou nenhum passo do roteiro — o que uma sala nova faz é o mesmo
   —, mudou o **runtime** (a travessia e a âncora da oscilação) e o que os instrumentos têm de fazer
   antes de medir geometria: **assentar as portas**.
10. **A verificação de 2026-11-03 (a segunda)** pôs a spec ao lado do estado do repositório e corrigiu
    **dez** pontos, todos de coerência e nenhum de método: os **sítios** de uma sala nova passaram de
    nove a **oito** (as listas das baterias deixaram de ser um sítio quando a P1 as derivou do dado); a
    contagem da §1 ganhou o que a D87 e a D91 lhe deviam (**50 portas nas doze páginas**, **29 leis
    L1–L29**); a **fase 6b** passou a dizer que o `sorteio.mjs` aceita **vários mundos numa só chamada**;
    a **fase 10** ganhou o último registo medido (2 de 28, com a `shader.mjs` a falhar por um quadro
    tardio e a passar sozinha); a **§6** passou a exigir as três provas da travessia (parado, a andar ao
    lado, a atravessar); o **T11** dizia «cinco são CRLF e os outros LF» e o repositório tem o contrário
    (**doze CRLF**, os das páginas, e **cinco LF**, os fixtures — medido); a §9 avisa que a bateria já
    não tem 16 verificações, tem **19**; a §10.2 passou a dizer que o repouso no instante da chegada é
    uma **âncora** e não uma esperança; a §10.3 avisa que «a rotação em X nunca sai» vale para a **porta
    padrão de 10×12** (nas de 8×10 do portão saíram 4 em 50); e a **§10.4** foi reescrita, porque
    descrevia o primeiro fecho da travessia (D87) como se fosse o único — hoje há um segundo (D91), e é
    ele que fecha o caso de quem **anda**.
11. **A sala 12 pôs a spec à prova outra vez, e a prova mudou um número da estética** (D93). Duas coisas
    que a spec não previa aconteceram, e ficam escritas porque voltam a acontecer: (a) o **anel** pode
    recusar a porta de uma sala nova — a `scene1` já estava no **teto** de `clearanceCeiling` (4,29° para
    7 obras × 6 portas) e a folga pedida era 4,86°; a resposta não foi encolher obras, foi **subir os
    dois raios** (40/60 → 60/90 m), o que desce a folga pedida a 3,91° e vale para as salas que ainda
    não existem; (b) **o destino pode estar cheio** — a L24 limita a cinco portas, e uma sala com cinco
    não pode receber a chegada de mais ninguém. A §2 (D-B) passa a mandar contar as portas do destino
    **antes** de fixar os destinos. O resto do roteiro funcionou à letra: 13 mundos, 49 retratos em duas
    passagens, as leis **31 de 31** e os doze **106 de 106**.
12. **E a prova visual apanhou o que nenhuma lei apanha** (D93, a mesma sessão). O autor percorreu as
    páginas no servidor local e viu uma coisa que estava certa no dado e errada para o visitante: a
    porta que o portão ganhou para a sala 12 **não oscilava**. A causa não era a sala — era o roteiro: a
    fase 3 acrescenta portas a mundos que já existiam, e a fase 6b só sorteava o mundo **novo**. A L29
    não podia ver isto (mede o alcance de uma porta que oscila; uma porta parada alcança-se sempre), e a
    bateria do movimento media a `scene1` e a sala de ensaio, não «todas». Ficou fechado em três sítios:
    o `sorteio.mjs` ganhou `--sem-movimento` (só as portas que ainda não oscilam, para não re-sortear o
    que já foi visto), o `new-room.mjs` passou a correr o sorteio **também nos mundos que tocou**, e a
    `motion.mjs` passou a exigir `motion: sway` em **cada** porta das páginas da exposição (**58 de 58**,
    era **19 de 19** verificações na bateria, agora **20 de 20**). Medido depois do conserto: as quatro
    portas novas oscilam (alcance **100%** nas quatro, a varrer a chegada entre **0 e 16,7%** do ciclo,
    semente `1793824526884`) e **nenhuma** porta da exposição nasce parada.

---

## 9. Um mundo de ensaio — a `scene100` (D84)

O ensaio que a §7 descreve foi apagado. A **sala de ensaio** é o mesmo exercício, mas fica no projeto:
uma sala onde se experimenta o que ainda não se quer no caminho do visitante — e o primeiro que lá se
experimenta é o **movimento das portas**.

**O que ela é.** Um mundo como os outros em tudo o que o dado diz (dimensões, câmaras, portas, fundo,
janelas), e diferente em duas coisas: **não tem pasta** e **não está no grafo**. É um **fixture**
(`js/scene/fixtures.js`), e é isso, e não uma lei nova, que a torna possível:

| o que a lei pede | porque não se aplica |
| --- | --- |
| L19 (quem chega tem porta de chegada) | o `validate.mjs` calcula as chegadas sobre as salas **sem** os fixtures |
| L25 (destinos diferentes dos das outras salas) | a mesma lista, `rooms = validated.filter(!FIXTURES.includes(slug))` |
| L26 (giro de cada retrato) e L28 (buracos) | idem |
| L22/L24 (dois anéis, 3 a 5 portas com uma ao portão) | `js/scene/validation.js` salta o bloco inteiro quando `fixture` |

Não foi preciso mudar nenhuma lei, e nenhum outro mundo foi tocado: um fixture já estava fora do grafo
(o `example` tem portas que navegam desde a D9). A `scene100` só passou a estar na lista.

**As duas regras que ela tem a mais.**

1. **Só se sai, nunca se entra.** Nenhuma porta do projeto aponta para `scene100`; as quatro portas dela
   apontam para fora (o portão e as salas 3, 6 e 9). Chega-se lá escrevendo o endereço — a bateria abre-a
   por `?scene=scene100` (`tools/regression/paginas.mjs`, `FIXTURES_ABERTOS`).
2. **As portas dela entram no destino sem `?from`** (`world.carryOrigin: false`). O `?from=` que uma
   porta escreve é o que faz a página de destino **arrancar sozinha e pôr a câmara na porta de chegada**
   (D37); sem ele o destino é uma **primeira visita** — botão de arranque (ou o arranque automático, se
   a câmara já tiver permissão) e a pose por omissão do mundo. É a regra que isola o ensaio: o destino
   não precisa de saber que a sala de ensaio existe, e nenhuma porta do projeto ganha uma chegada a mais.

O campo vive no dado (`world.carryOrigin`, booleano, por omissão `true`), o `scene-builder.js` passa-o ao
`portal.js`, e é o `portal.js` que o aplica no sítio único onde a URL é escrita — não há uma segunda
cópia da regra.

**Os retratos de uma porta sem `?from`.** `tools/scene/portrait.mjs --direto` desenha a **primeira
visita**: abre o mundo de destino **sem** `?from` e a câmara fica na pose por omissão (`cameras.player`),
que é exactamente o que o visitante vê ao entrar por uma porta da sala de ensaio. E os pares deixaram de
estar escritos à mão: `PORTAS` passou a ser **derivada do dado** (cada porta `preview` que navega, com o
retrato na convenção `<destino>-de-<origem>`), o que trouxe os três pares da `scene100` sem uma linha a
mais e deixou de fora o `example` (que aponta para um panorama antigo, não para um retrato).

**O que as baterias medem nela.** A T1 atravessa as quatro portas e, para `carryOrigin: false`, inverte a
expectativa: em vez de exigir `from=scene100` na URL de destino, exige que ele **não** esteja lá — sem
essa inversão a regra nova nunca seria medida (o teste ficava vermelho por ela estar certa). Os T2–T12
medem a página como qualquer outra, porque a lista vem do dado.

**O movimento (D85), feito depois da aprovação da sala parada.** Três das quatro portas oscilam — a
**A** em X, a **B** em Y e a **C** em Z —, cada uma com translação de **±5 m** e rotação de **±90°**, em
fase e com um período de **20 s**. O terceiro tipo de movimento entrou no mesmo sítio que os outros dois
(`motion.kind` ganhou `sway`, com `amplitude` em metros e `angle` em graus, sem omissões: quem escreve
`sway` diz os dois números); o `js/modules/portal.js` anima-o a partir da pose do dado, e o
`prefers-reduced-motion` do visitante continua a pará-lo como pára o shader.

**A rotação é sobre o centro da porta (D86).** A primeira versão rodava a entidade sobre a sua origem —
a base, onde o ficheiro põe a porta —, e a ±90° isso lê-se como um defeito: a janela sai da moldura de
colisão e a porta parece atirada para o lado, porque a base fica presa ao chão e o resto descreve um arco
de meia altura de raio. A animação passou a usar um **pivô**: `pos = base + amplitude + R_base·p − R(t)·p`,
com `p` o centro da porta no espaço da entidade (a metade da altura, no plano da janela). O centro fica
parado e só a translação o move; os 12 m de altura deixam de contar como braço de alavanca. A caixa de
colisão não dá o centro: ela é maior de propósito (é uma folga), e o que roda é o objecto.

O que se mede — e como — é a parte que a sala existe para ensinar:

| o que | onde | medido |
| --- | --- | --- |
| o **centro da porta** oscila a amplitude pedida no seu eixo, e fica parado nos outros dois | `tools/regression/motion.mjs` (a secção da sala de ensaio) | **5,000 m** e **90,00°** nas três, com os outros eixos a **0,000** e o desvio à pose do dado a **0,000** |
| o período | a mesma bateria, pela meia oscilação (o cruzamento do centro, onde a curva é inclinada e a amostra de 120 ms custa menos) | **10,00 s** nas três (**20 s** de período) |
| a rotação é mesmo sobre o centro | a mesma bateria, por um **controlo positivo**: a mesma porta rodada de 90° **sobre a base** | com o pivô na base o centro sai **8,49 m**; com o pivô no centro sai **0,000 m** |
| a porta que não declara movimento não se mexe | a mesma bateria (o controlo) | **0,0000 m** e **0,0000 rad** |
| `freezeMotion` pára a oscilação onde ela está | a mesma bateria | igual **1,5 s** depois |

A bateria dos portais em movimento passa de **6 de 6** a **13 de 13**. Três correcções que a oscilação
obrigou, e que valem para lá dela:

1. **A medida passou a ser a do centro** (`portal.centreWorld()`): medir a origem da entidade mede o arco
   que ela descreve para manter o centro parado — a ±90° são 6 m. É a mesma razão por que o controlo
   existe: uma medida que não distingue os dois pivôs não prova nada.
2. **A caminhada do T1 sobe com a porta e assenta as portas antes de andar** (`acceptance.mjs`,
   `traversal-tests.mjs`): a porta B tem a caixa 5 m acima do chão em metade do ciclo, e um passo a 1,6 m
   atravessava o vazio — medido, a porta 2 não era atravessada. E uma caminhada começada a meio de uma
   oscilação mede a oscilação: o T1 passou a usar o `settleMotion` (as portas na pose do dado), como já
   faziam os T2–T12.
3. **Os instrumentos que fotografam a sala assentam as portas** (`portalDebug.settleMotion()`), que é o
   que a #2 também usa: medir pixéis numa janela que roda entre o instante em que a câmara é posta e o
   instante em que se lê é medir o movimento. Medido antes: **142 800 px** «fora da moldura» e o
   retângulo da janela a não fechar; com as portas na pose do dado, o T4 e o T10/T12 voltam a fechar
   (**0 px** fora) e a sala é medida de ponta a ponta como qualquer outra.

**O que a sala de ensaio mostrou, e que a §10 transformou em regras:** a porta B sobe 5 m em metade do
ciclo, e um visitante que anda pelo chão só a alcança em **60,4%** do tempo (medido; a primeira conta
que aqui esteve, 21%, estava errada). É o número que justifica o piso da L29.

> **Nota (D87) — esta secção é o registo do primeiro ensaio, não o estado de hoje.** Depois de a D86
> fechar, o autor mandou que o movimento das portas de uma sala nova fosse **sorteado** (§10), e a
> `scene100` foi **refeita pelo sorteio** (semente 99): hoje as **quatro** portas oscilam — nenhuma
> fica parada como controlo —, com amplitudes de 5,0 e 6,0 m, ângulos de 45° e 90°, e **dois períodos
> por porta** (10,0 a 19,7 s) em vez dos 20 s iguais de então. O controlo mudou com ela: deixou de ser
> «a porta que não declara movimento não se mexe» e passou a ser «**assentes, as portas estão
> exactamente onde o ficheiro as põe**» — que é a invariante de que dependem a L16, o retrato e o
> `prefers-reduced-motion`. Os números de hoje estão na §10.8 e no `sorteio.mjs`; a bateria que os mede
> já não tem **16** verificações, tem **19** (§11.4).

**O buraco que esta sala abriu — e que a D89 fechou.** Uma porta de uma sala com `carryOrigin: false`
não tem **porta de chegada** no destino — é a regra que a isola —, e sem chegada não havia par
`(from, arrival)` para a conta do giro (L26). Até à D89 isso queria dizer que o `azimuths.mjs` não lhe
tocava (só percorria as salas), a L26 não a julgava, e o `window.azimuth` das três portas da `scene100`
era o que a construção escrevera **sem ninguém o provar**. O mesmo valia para os buracos do mundo real
(L28).

Ficou fechado assim:

| peça | o que passou a fazer |
| --- | --- |
| `js/scene/ring.js` | `FIRST_VISIT_AZIMUTH = 0` — o azimute com que um destino abre numa primeira visita. **Não é uma omissão**: o esquema de `cameras.player` só tem `position` e `speed`, e a câmara nasce sempre a olhar para **−Z** |
| **L26** | para uma porta de um mundo com `carryOrigin: false` usa esse 0 como segundo termo da conta, e diz no erro que é uma primeira visita |
| **L28** | passou a julgar as mesmas janelas (o que entra na fotografia é o que se vê da pose de uma primeira visita) |
| `azimuths.mjs` e `reality.mjs` | percorrem também esses mundos, e a linha diz `(primeira visita)` / o total diz `3 de primeira visita` |
| `laws-selftest.mjs` | a lei deixa de ser só um caso: **duas** avarias novas — uma porta rodada 30° (L26) e um buraco inventado (L28) —, ambas detectadas |

Medido: `azimuths.mjs` diz `42 porta(s) de retrato, 0 sem porta de chegada, 3 de primeira visita` e
`o dado já diz o mesmo — nada a escrever` — os valores do dado (90° · 0° · −90°) já eram os da conta,
por isso **os retratos da sala não mudaram** e não houve nada a recozer. É o resultado que se quer de
uma correcção de lei: provar o que já estava certo, sem tocar no que já estava feito.

**O que continua por medir, e é honesto dizê-lo:** a **costura** destas portas. O instrumento
(`seam.mjs`) compara o que se vê pela janela com o que se vê **ao chegar**, e a chegada de uma porta sem
`?from` é uma página nova em pose por omissão — não há `?from` para pedir, e o instrumento ainda não sabe
abrir o destino assim. É o único número que a sala de ensaio afirma sem medir.

---

## 10. O movimento das portas, sorteado na construção (D87)

Uma sala nova não escolhe o movimento das portas: **sorteia-o**. É a única coisa do roteiro que não é
decisão do autor — e é de propósito, porque o que se quer é que nenhuma sala se pareça com a outra.

### 10.1 As regras

| | translação | rotação |
| --- | --- | --- |
| eixo | **X ou Y** (os da porta) | **X, Y ou Z** (os da porta) |
| amplitude | **metade da dimensão do eixo** (porta 10×12 → X 5,0 m · Y 6,0 m; porta 8×10 → 4,0 · 5,0) | **45° ou 90°**, em módulo, a oscilar entre +A e −A |
| período | sorteado em **[10, 20] s** | sorteado em **[10, 20] s**, independente do da translação |

Quatro coisas que as regras dizem e não são óbvias:

- **Os eixos são os da porta, não os do mundo.** A oscilação é composta à direita da rotação do dado
   (`R = R_dado · R_oscilação`) e a translação é levada por ela. Com os eixos do mundo, a mesma «rotação
   em X» numa porta de yaw −90° girava-a no próprio plano em vez de a tombar — medido: **12 de 12**
   combinações passavam a lei (metade das portas do anel não oscilava de facto), contra **8 de 12** com
   a conta certa. É também o que torna os números da §10.3 os mesmos para qualquer porta,
   independentemente do lado do anel em que ela está.
- **Z não entra na translação.** A porta é um plano: metade da espessura da caixa dá **0,5 m** — um
   tremor invisível. Z faz sentido na rotação, e lá está.
- **A amplitude sai da porta, não de uma tabela.** Uma porta de 8×10 dá 4,0 e 5,0; a de 10×12 dá 5,0
   e 6,0. É por isso que a lei da §10.3 é calculada **por porta**.
- **O período 10–20 s é «a velocidade de hoje como mínimo, o dobro como máximo»**, lido no período:
   dá 1,57 a 3,14 m/s (X), 1,88 a 3,77 m/s (Y), 14,1 a 28,3 °/s (45°) e 28,3 a 56,5 °/s (90°). Quem
   quiser a **velocidade** constante tem de derivar o período da amplitude (`T = 2π·A/v`); o roteiro
   usa o período, porque é o que o dado guarda e o que os instrumentos medem.

### 10.2 O que o sorteio **não** muda

A **pose de repouso** — a fase 0 do seno — é a pose do dado, seja qual for o sorteio. Daí saem três
coisas que já estavam certas e continuam:

- a **L16** (a chegada põe a câmara à frente da porta) continua verdadeira: no instante da chegada a
  porta está onde o ficheiro diz. **Desde a D91 isso não é uma esperança, é uma âncora**: o relógio da
  oscilação começa quando a ponte de chegada sai (`anchorMotion()`, §11.2), e não no carregamento da
  página — sem ela a porta já tinha andado metros por baixo da ponte;
- o **retrato cozido** continua válido: foi desenhado na pose de repouso (ver 10.5), e é essa que o
  visitante vê ao chegar;
- o **`prefers-reduced-motion`** deixa a sala **alcançável**: congela na fase 0, que é a pose do dado.

É esta invariante que permite a **D59 deixar de proibir uma porta de chegada em movimento**. A lei
antiga existia porque «o dado descreve onde a porta estava quando o ficheiro foi escrito» — e continua
a ser verdade: a diferença é que agora o repouso é *o* sítio da chegada, e não um instante perdido.

### 10.3 A lei nova — L29, o alcance

> **L29 · uma porta em movimento é alcançável em pelo menos metade do ciclo.**

O alcance é a percentagem do ciclo em que o **visitante** — olho a 1,6 m, a caminhar de frente para a
porta ao longo da normal dela, 1,5 m antes até 2,5 m depois — tem o olho dentro da caixa de colisão.

- **Uma casa só para a conta:** `js/scene/reach.js`. O sorteio usa-a para recusar, o validador para
  provar o dado, e o instrumento para medir. Três cópias dariam três números.
- **O modelo é conservador de propósito:** o visitante chega de frente e em linha recta. Quem chega de
  esguelha alcança mais; ninguém alcança menos.

Medido, com a porta padrão (10×12, caixa 12×16×1), sobre o **par de fases** — dois períodos
independentes fazem o movimento percorrer um toro, e não um ciclo só:

| translação | rotação | 45° | 90° | |
| --- | --- | --- | --- | --- |
| X | X | 40,0% | **20,0%** | rejeitado nos dois |
| X | Y | 100% | 100% | passa |
| X | Z | 100% | 100% | passa |
| Y | X | 48,0% | **26,2%** | rejeitado nos dois |
| Y | Y | 60,0% | 60,0% | passa |
| Y | Z | 65,3% | 61,8% | passa |

**Passam 8 das 12 combinações** — rejeita-se **1 sorteio em 3**, que é o que se decidiu. (As primeiras
duas versões desta conta deram «1 em 4» e «1 em 3» por razões erradas: a primeira tinha Z na
translação e um ciclo só; a segunda lia os eixos no espaço do mundo em vez do espaço da porta. A conta
que fica é esta, e é a do `reach.js` — a mesma que o validador corre.)

O que sai depois da rejeição, medido em **200 000 sorteios**: **1,504 tentativas por porta** (teórico
12/8 = 1,5); translação **X 49,9% · Y 50,1%**; rotação **X 0,0% · Y 50,0% · Z 50,0%**; ângulo
**45° 49,9% · 90° 50,1%**. Duas consequências que valem a pena saber antes de ver a sala:

- **a porta nunca tomba sobre a largura** (rotação em X): é a única combinação que a L29 recusa em
  qualquer ângulo **na porta padrão de 10×12**, e por isso a que não sai nunca numa sala nova. As portas
  **rodopiam** (Y) ou **giram no próprio plano** (Z) — nunca caem para a frente.
- a translação e o ângulo saem **meio a meio**; o eixo da rotação também, entre Y e Z.

> **O número acima é da porta padrão (10×12).** As portas do **portão** medem **8×10** — amplitude de
> translação de 4 m em vez de 5 — e a L29 aceita ali **10 das 12** combinações, incluindo duas com
> rotação em X: no sorteio das doze páginas (D91, §11.1) saíram **4 portas em 50** com rotação em X. O
> que não muda é a razão: é a combinação que custa mais alcance, e a que sai menos.

### 10.4 A armadilha que a lei não apanha — e o que a fecha

O ponto de chegada fica a **1,0 m** à frente da porta (`arrival.js`), e a caixa de colisão mede
12×16×1: rodada, ela varre muito para dentro da sala — medido, até **7,42 m a 45° e 10,01 m a 90°**
quando roda no plano vertical (eixo X), **4,60 / 6,02 m** quando rodopia (Y), e **nada** quando gira no
próprio plano (Z). Consequência: **3 dos 8 sorteios que passam a L29 põem o visitante parado dentro da
caixa** — 16,7% e 10,4% do ciclo nos da translação em X, **36,5%** no `Y + Y a 90°` — e a travessia
dispara pelo **cruzamento do plano**, não pelo movimento dele. Sem correcção, **um em cada três
sorteios bons apanha o visitante parado e leva-o pela porta**.

**O primeiro fecho (D87): a câmara tem de se ter deslocado** desde o quadro anterior (mais de 1 cm; a
60 fps um passo normal anda ~2,7 cm). Um visitante **parado** nunca é levado — e isso é o que a
`motion.mjs` e a `traversal-tests.mjs` provam numa sala cujo sorteio varre a chegada.

**O segundo fecho (D91): o cruzamento é do visitante, não da porta.** «Ter-se deslocado» não chega a
quem **anda**: o sinal do plano era lido só no ponto de agora, e uma porta a rodar trocava-lhe o sinal
sem ninguém ter cruzado nada. Medido sobre o sorteio das doze páginas (chegar, 2 s parado, 4 s a andar a
1,4 m/s, 32 fases de entrada por porta, 60 amostras/s): **2,7% das chegadas** disparavam uma travessia
não pedida, com **quatro portas entre 26% e 40%** (todas com rotação em Y). A regra de hoje lê **os dois
pontos** — o de agora e o do quadro anterior — com a caixa **deste** quadro: como o mesmo plano se aplica
aos dois, o que a porta andou desloca-os por igual e **não muda a diferença entre eles**, portanto só o
passo do visitante pode trocar o sinal. A prova são três verificações da `motion.mjs`: parado (**0**
navegações), a andar 24 cm **ao lado** do plano com a porta a varrer uma volta inteira (**0**), e a
atravessar o plano com a porta assente (**1** — o controlo, sem o qual as duas primeiras passariam numa
cena sem travessia).

### 10.5 O retrato tem de ser desenhado com as portas **assentes**

`tools/scene/portrait.mjs` já congelava o shader; agora tem de **assentar as portas** antes de
desenhar (`portalDebug.settleMotion()`). Sem isso o retrato coze as portas na fase em que estavam
— que é arbitrária, porque a página do destino esteve aberta dezenas de segundos — e o retrato deixa de
ser a imagem que o visitante vê ao chegar. Com o `settleMotion`, o retrato é a pose de repouso, que é
exactamente o instante da chegada. É a peça que faz a §10.2 valer também para a janela.

### 10.6 O que a construção faz

1. `node tools/scene/sorteio.mjs <slug>` — ensaio, não escreve, e imprime a **semente**.
2. `node tools/scene/sorteio.mjs <slug> --aplicar` — escreve `motion` em cada porta.
3. Se o sorteio não agradar, corre outra vez: **outra semente, outra sala**. Se agradar, guarda a
   semente que a última linha imprimiu — é ela que o repete (`--semente N`), e é ela que vai na
   mensagem do commit.
4. Os retratos, depois, com as portas assentes (fase 8 do roteiro).

O `new-room.mjs` faz os passos 1 e 2 sozinho, com uma semente do relógio, e mostra-a: quem criar a sala
pelo atalho recebe a sala já sorteada e o número para a repetir.

O bloco que entra no dado, por porta:

```json
"motion": {
  "kind": "sway",
  "axis": [1, 0, 0], "amplitude": 5, "period": 12.1,
  "rotationAxis": [0, 0, 1], "angle": 90, "rotationPeriod": 13.9
}
```

### 10.7 As armadilhas desta fase

| # | a armadilha | o número que custou |
| --- | --- | --- |
| **T13** | **A caixa varre o visitante** | 3 dos 8 sorteios, **10,4% a 36,5%** do ciclo; a caixa chega a **10,01 m** para dentro da sala. Fecha-se com a travessia a exigir que o **visitante** cruze o plano — o sinal tem de mudar entre **dois** pontos, e não porque a porta andou (§10.4, D87 e D91) |
| **T14** | **A rotação sobre a largura (X) é a que custa o alcance** | 20,0% a 90° e 40,0% a 45°; como os dois ficam abaixo do piso, **essa combinação nunca sai** (0,0% dos sorteios) |
| **T15** | **Metade da altura enterra a porta** | a base vai de **−6 m a +18 m**; o alcance cai a 58,6% |
| **T16** | **O retrato coze a fase em que as portas estavam** | sem `settleMotion`, a janela mostra uma pose e a chegada outra |
| **T17** | **O instrumento caminha à altura da porta, não à do visitante** | o T1 caminha a `1,6 + max(0, altura)` — **6,6 m** na porta B — e fica verde numa porta que o público não alcança. A L29 é que mede o visitante |

### 10.8 O que uma sala nova ganha, e o que não muda

Fica com **todas** as portas em movimento — uma delas a de volta ao portão, como as outras: a D59
relaxada não distingue. O sorteio é da **construção** de uma sala, não uma passagem a cada
carregamento (a razão está no fim desta secção).

> **Nota (D91).** Até 2026-11-03 esta secção dizia também que as **11 salas e o portão não eram
> tocados** — «as suas portas continuam paradas, e os seus 42 retratos continuam válidos». A decisão do
> autor foi a contrária: o movimento entrou nas **doze páginas**, e a **§11** conta o que isso custou e
> o que teve de mudar no código. O que continua verdade é a segunda metade: os **42 retratos não foram
> refeitos**, porque a pose de repouso é exactamente a pose em que eles já estavam cozidos.

**Porquê na construção e não a cada carregamento.** Sortear a cada carregamento é possível (o sorteio
corre uma vez, no `buildScene`, e não custa um quadro) e a pose de repouso seria a mesma — mas
sacrificava três coisas: um defeito relatado por um visitante **não se reproduz**; as leis deixam de
poder provar a sala (só o gerador); e o editor mostra outra sala de cada vez que abre. Escrito no
dado, o número é medível, reproduzível e o mesmo para todos. Quem quiser ver a sala a mudar tem o
`--aplicar` a cada passagem.

---

## 11. O movimento nas salas que já existem (D91)

A pergunta do autor foi se a spec — seguida — deixava trazer o movimento às **11 salas e ao portão**,
respeitando o que já está montado. A resposta foi medida antes de se tocar em qualquer ficheiro, e o
que se seguiu foi só o que a medição exigiu.

### 11.1 O dado

As doze páginas têm **50 portas**: **11 no portão** (todas para as salas) e **39 nas salas**. E — o
facto que decide tudo o resto — **as 50 são de duas mãos**: em cada uma, `arrivalFrom` é igual ao
`action.target` (medido: **50 de 50**). Não há, portanto, «a porta que se sai» separada da «porta por
onde se chega»: mexer numa é mexer na outra, e não existe a opção de deixar as portas de chegada
paradas.

```
node tools/scene/sorteio.mjs gate scene1 scene2 scene3 scene4 scene5 scene6 scene7 scene8 scene9 \
     scene10 scene11 --aplicar --semente 20261103
```

Medido, com a semente que ficou no dado (**20261103**): **50 portas, 50 aceites, 32 rejeitados**
(**0,64** por porta — a porta padrão de 10×12 custa **0,50** em teoria, 12 tentativas para 8
combinações legais, e as do portão, mais pequenas, aceitam 10 das 12); translação **X 22 · Y 28**;
rotação **Y 27 · X 4 · Z 19**;
ângulo **45° 22 · 90° 28**; alcance de **51,6%** a **100,0%** (22 portas a 100%, as outras em 51,6 ·
60,0 · 61,8 · 65,3 · 68,0%); e **25 das 50** portas põem a caixa sobre o ponto de chegada em algum
instante do ciclo (10,4 · 11,8 · 13,0 · 16,7 · 36,5% dele). O dado cresceu **850 linhas** nos doze
ficheiros, e **nenhum** outro campo mudou.

### 11.2 O que a medição obrigou a mudar no código

**1. A travessia passou a ser do visitante, não da porta.** O sinal do plano era lido só no ponto de
agora: uma porta a rodar trocava-lhe o sinal **sem ninguém ter cruzado nada**, e quem estivesse a andar
por perto era levado. Medido com a máquina de estados do `detectTraversal` sobre o dado publicado
(chegar, 2 s parado, 4 s a andar a 1,4 m/s; 32 fases de entrada por porta, 60 amostras/s):
**2,7% das chegadas** disparavam uma travessia não pedida, e **quatro portas** entre **26% e 40%** —
todas com rotação em Y (o portão, `gate` p2 e as `scene2` p6, `scene4` p8, `scene5` p12). A correcção:
os **dois** pontos — o de agora e o do quadro anterior — são lidos com a caixa **deste** quadro, e o
cruzamento é a troca de sinal entre eles. Como o mesmo plano se aplica aos dois, o que a porta andou
desloca-os por igual e não muda a diferença: só o passo do visitante pode trocar o sinal.

**2. A oscilação começa quando a ponte de chegada sai** (`anchorMotion()`, no `app.js`, ao lado do
`anchorShaders` da D78). Sem isto o relógio da cena começava no carregamento da página, a porta já
tinha andado metros por baixo da ponte, e o corte mostrava o salto que a ponte existe para esconder —
o retrato é a pose de repouso e a cena tinha outra.

**3. Os instrumentos assentam as portas antes de medir geometria.** O `seam.mjs` passou a chamar
`settleMotion()` (o `freezeShaders` congela o movimento **onde ele está**, e onde ele está já não é a
pose do retrato) e o T7/T11 da `traversal-tests.mjs` também: sem isso, **33 de 165** verificações
perdiam a meia volta, porque quem andava atravessava o plano do **dado** e a caixa já estava noutro
sítio. O movimento mede-se na `motion.mjs`; aqui mede-se a geometria.

### 11.3 O que **não** mudou

- os **42 retratos** (39 portas com retrato nas doze páginas, mais as 3 da sala de ensaio): a pose de
  repouso é a pose em que estavam cozidos, portanto a imagem seria **igual** e não se gastou um minuto
  de GPU (a fase 8 custa **800–820 s** por lote de 39 pares — medido nos registos);
- a **L16** (o ponto de chegada é o da pose do dado), a **L22/L23** (os anéis), a **L17** (que já
  aceitava `sway` desde a D87), os buracos do mundo real (o `window.reality` roda com a janela), o i18n,
  o editor e a geometria de tudo;
- o **piso da L29**: ficou nos **50%**, como nas salas novas — é a decisão do autor, e é ela que deixa
  metade das portas passável só 60–67% do ciclo (a translação em Y levanta a porta).

### 11.4 O que a bateria passou a medir

A `motion.mjs` foi de **16** para **19** verificações na D91, e para **20** na D93. As novas, e a que
mudou de sentido:

| # | verificação | o que ela prova |
| --- | --- | --- |
| 11 | **a âncora põe a oscilação a começar na pose do dado** | depois de as portas andarem, `anchorMotion()` devolve-as ao ficheiro: medido **10,57 m → 0,0e+0 m** |
| 12 | **a andar ao lado do plano, a porta não o leva** | a câmara anda 24 cm ao lado enquanto a porta varre uma volta inteira: **0 navegações** |
| 12b | **a atravessar o plano, a porta leva-o** (controlo) | com a porta assente: **1 navegação** — sem este controlo, as duas de cima passavam numa cena sem travessia |
| 13 | **as doze páginas · as 5 portas da `scene1` oscilam no ecrã** | a L29 prova o dado; esta prova que o dado chega à cena |
| 14 | **todas as portas da exposição oscilam** (D93) | lê o dado das páginas e exige `motion: sway` em cada porta — hoje **58 de 58**. A porta que a fase 3 acrescenta a um mundo que já existe nasce **parada**, e nenhuma lei a julgava: a L29 mede o alcance de uma porta que oscila, e uma porta parada alcança-se sempre |

---
