# Spec — abrir uma sala nova

> **Estado: aprovada com as três propostas feitas** (2026-11-02). Nada nesta spec foi inventado: cada
> passo é o que o repositório já faz, e cada número citado é um número medido por uma ferramenta que lá
> está. As fases 1–7 têm agora um comando (`tools/scene/new-room.mjs`) e as listas das baterias passaram
> a vir do dado; o que continua à mão é o que a spec diz que continua à mão. A **§9** junta o caso que
> não é uma sala: o **mundo de ensaio** (`scene100`, D84), onde se experimenta o que ainda não entra no
> caminho do visitante.
>
> **Para que serve.** Uma sala nova toca **oito** sítios que não se vêem uns aos outros: a página, o
> dado da sala, o dado do portão, o dado de **cada** sala de destino, a folha das obras, os retratos
> (derivados), as listas de duas baterias e a documentação. Esquecer um deles não dá erro nenhum —
> dá uma exposição que abre e está errada, ou uma bateria verde que **não mediu a sala**. O roteiro
> existe para que o esquecimento seja impossível de confundir com sucesso.
>
> **O que esta spec não é.** Não é o guia do editor (esse vive no `README.md`, § «A página de
> edição»), não é o guia de testes de campo (`docs/GUIA-DE-TESTES.md`) e não decide a arte, os textos
> nem os shaders. Um **shader novo** tem caminho próprio (`tools/shader/validate.mjs`,
> `tools/regression/emenda.mjs`); esta spec só diz quando é que ele entra na ordem.

---

## 1. O que uma sala é, em cinco objetos

| objeto | onde vive | quem o escreve | o que o guarda |
| --- | --- | --- | --- |
| a **página** | `<slug>/index.html` | `tools/scene/new-world.mjs` | `arranques.mjs` — o mesmo ficheiro da raiz, só com `<base href="../">` (D28) |
| o **dado da sala** | `data/worlds/<slug>.json` | o editor (exporta) | `validate.mjs` + as leis L1–L21 |
| as **obras** (texto, capa, site) | `data/obras.tsv` → os mundos | `tools/artwork/from-csv.mjs` | `from-csv --check`, a lei L20 e a ficha |
| as **posições** (dois anéis) | o mesmo JSON | `tools/scene/ring.mjs --aplicar` | L22 e L23 |
| as **portas de mundo** (janela, retrato, chegada, giro, mundo real) | o JSON da sala **e** o de cada destino | o editor + `azimuths.mjs` + `reality.mjs` + `portrait.mjs` | L11, L13, L16, L17, L19, L26, L28 |

O número de hoje, para se saber quando é que um passo ficou a meio: **12 páginas** (o portão e onze
salas), **17 ficheiros de mundo** (as 12 e 5 fixtures, dos quais a sala de ensaio da §9), **50 portas**
nas salas, **57 obras**, **42 retratos** (um par `.jpg` + `.png` por porta com janela de
pré-visualização), **29 leis** e **28 baterias** no `--full`.

---

## 2. As três decisões que se tomam antes de tocar em ficheiros

Nenhuma delas é reversível de graça, e as três mudam o que as fases seguintes fazem.

**D-A · O fundo.** Um shader dos onze (nada a instalar) ou um **panorama** (`kind: "image"`, 2:1,
≤ 2048×1024 — L14). Um shader novo obriga a `tools/shader/install.mjs` **antes** da fase 7 e a
`emenda.mjs` depois.

**D-B · Os destinos.** Três a cinco portas, **uma** ao portão (L24), e o conjunto de destinos
**diferente do de todas as outras salas** (L25). Com onze salas e cinco destinos possíveis em cada
uma, há combinações suficientes — mas a escolha tem de ser verificada, não presumida: `validate.mjs`
recusa, e a mensagem diz qual é a repetida.

**D-C · Quem leva a chegada.** Por cada porta da sala nova que navega para `X`, a sala `X` passa a
precisar de uma porta que se declare a chegada dessa origem (L19) — e **no máximo uma por origem**
(L17). É esta decisão que faz uma sala nova mexer em duas ou três salas que já existiam.

---

## 3. O roteiro, fase a fase

**O atalho.** As fases 1 a 7 têm um comando: `node tools/scene/new-room.mjs <slug> --destinos …`
escreve o esqueleto do dado (as duas dimensões, o fundo com a reserva, as portas nos dois lados, os
assets dos retratos que ainda não existem) e corre os anéis, o giro, os buracos e o validador. As
fases abaixo continuam a ser a referência do que ele faz por baixo — e o que ele **não** faz: as
obras, a composição no editor e os retratos continuam a ser passos à mão.

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

- **Tem de dizer:** ou «a folha não muda nada» (quando já está aplicada), ou a lista do que mudaria,
  saída **0** no `--check`.
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
  ao raio fica dentro da tolerância de 0,5 m. As obras ficam a **40 m** e as portas a **60 m**.
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

- **Tem de dizer:** `0 erradas` na coluna do giro, e nas salas que já estavam `nada a escrever`.
- **Se não disser:** a porta de chegada do destino não está posta (fase 3).

### Fase 6 · Os buracos do mundo real

```
node tools/scene/reality.mjs --aplicar           # sem argumentos: todos
```

Escreve `window.reality` (os retângulos onde o destino mostra a câmara — L28), para que a janela fure o
fundo ao vivo e o visitante veja a **mesma** câmara antes e depois de atravessar.

- **Tem de dizer:** `0 erradas`, e `nada a escrever` no que já estava.
- **Se não disser:** o destino não tem a dimensão `camera`, ou a porta de chegada não está posta.

### Fase 7 · O validador e as leis (a porta de entrada para o resto)

```
node tools/scene/validate.mjs
node tools/scene/laws-selftest.mjs
```

- **Tem de dizer:** `data/worlds/<slug>.json: OK (…)` para cada ficheiro, e as **29 de 29** avarias
  injectadas detectadas com o controlo limpo.
- **O que ainda pode estar vermelho aqui, e só isto:** a **L9**, nos retratos da sala nova — os
  ficheiros são derivados e só nascem na fase 8. Tudo o resto (L19, L22, L24, L25, L26, L28) tem de
  estar limpo **antes** de se gastar GPU. O validador volta a correr no fim da fase 8, e aí é a verde
  completa.
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
  o mesmo retrato saiu com 438, 215 e 378 kB em passagens seguidas). Orçamento de hoje: **387 a 418 s**
  por passagem com 39 retratos.
- **Quando é que isto se repete:** sempre que **mover uma obra** ou uma porta mude o que se vê de
  dentro de uma sala. É o passo que mais se esquece, e não dá erro — dá uma janela com a sala de ontem.

### Fase 9 · As listas das baterias (a armadilha que não avisa) — **fechada**

As duas baterias que medem a exposição página a página liam a lista de páginas **escrita à mão**, e uma
sala que não estivesse nela nunca era medida — a bateria ficava verde sem ter olhado para ela. Desde a
**P1** as duas listas vêm do dado (`tools/regression/paginas.mjs`), por isso não há nada a acrescentar:

| ficheiro | o que passou a fazer |
| --- | --- |
| `tools/regression/paginas.mjs` | deriva as páginas de `data/worlds/` (portão primeiro, salas pelo número, o fixture `example` no fim) |
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
- **Se não disser:** a bateria vermelha diz qual é e porquê. A costura das travessias (D46) é a única
  que pode estar vermelha **de antes** — o número dela tem de ser comparado com o último registo, não
  com zero, e o caso novo tem de ser explicado na documentação.

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
| T11 | o EOL dos ficheiros de dado: cinco são **CRLF** e os outros **LF** — uma ferramenta que reescreva tudo muda o ficheiro inteiro | um diff de 5 000 linhas por uma posição | `new-room.mjs` preserva o EOL de cada ficheiro que toca; um ficheiro novo sai em `\n` |
| T12 | um ficheiro gravado no Windows pode levar **BOM** | um `\ufeff` no início do commit | gravar UTF-8 sem BOM |

---

## 5. Os ficheiros que uma sala nova toca (o registo real da sala 11)

Não é uma previsão: é o commit `08b644f` («A sala 11 entra…»), que é a última sala que entrou.

| ficheiro | o que muda |
| --- | --- |
| `data/worlds/<slug>.json` | novo (+343 linhas na sala 11) |
| `data/worlds/gate.json` | a porta nova (+95) |
| `data/worlds/<cada destino>.json` | a porta de chegada (+59 numa sala) |
| `data/obras.tsv` | as linhas das obras (+5) |
| `<slug>/index.html` | novo (+93) |
| `assets/previews/*.jpg` e `*.png` | os retratos novos **e os das salas vizinhas**, refeitos |
| `js/shaders/<id>.js` + `js/modules/shaders.js` | só se a sala trouxer shader novo |
| `tools/regression/twelve-tests.mjs` | a página na lista (T1) |
| `tools/regression/traversal-tests.mjs` | a rota na lista (T1) |
| `docs/ROADMAP.md`, `README.md`, (`PRE-EXPOSICAO.md`) | o registo e os números |

Nada em `js/scene/` mudou — as leis servem a sala nova sem uma linha de código novo. Quando isso
deixar de ser verdade, é sinal de que a sala está a pedir uma lei, e isso é uma decisão, não um passo.

Desde a **P2**, sete destas linhas são escritas pelo `tools/scene/new-room.mjs` numa só chamada: o dado
da sala (as duas dimensões, o fundo e a reserva, as portas), a porta no portão, a porta de chegada em
cada destino e as entradas de asset dos retratos que ainda não existem. O que fica para o autor é o que
não é aritmética: **as obras na folha**, a **composição** no editor e os **retratos**.

---

## 6. A aceitação: a lista que fecha a sala

Uma sala está pronta quando **todas** estas linhas forem verdade, pela ordem em que se correm:

- [ ] `node tools/artwork/from-csv.mjs --check` sai **0**
- [ ] `node tools/scene/new-world.mjs` já correu e `<slug>/index.html` existe
- [ ] `node tools/scene/new-room.mjs <slug> --destinos …` escreveu o esqueleto e as portas nos dois lados
      (ou as fases 2–3 foram feitas à mão no editor, com o mesmo resultado)
- [ ] o `validate.mjs` diz **OK** no ficheiro novo **e** nos que ele tocou; a **única** coisa vermelha
      admitida aqui é a L9 dos retratos
- [ ] o `laws-selftest.mjs` diz **29 de 29** e o controlo limpo
- [ ] o `ring.mjs` não tem desvios acima de **0,5 m** e a folga L23 passa
- [ ] o `azimuths.mjs` e o `reality.mjs` dizem **0 erradas**
- [ ] há um par de retratos por porta com janela, todos com data de hoje, e o `validate.mjs` volta a
      dizer **OK** sem a L9
- [ ] o `twelve-tests.mjs` diz **«a lista cobre todas as salas do dado (N)»** com o N do validador
- [ ] `node tools/regression/all.mjs --full` dá **28 de 28** (ou a única vermelha é a D46, com o
      número comparado com o último registo)
- [ ] o `README.md` e o `ROADMAP.md` têm os números novos
- [ ] o commit está no `main` e no ramo da versão

E a prova visual, que nenhuma bateria substitui: **entrar pela porta do portão, olhar em volta, sair
pela porta de volta, e voltar a entrar** — é o caminho que o visitante faz e o único que exercita a
chegada, o giro e o retrato ao mesmo tempo.

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
giro, os buracos e o validador. Recusa antes de escrever: o slug, a pasta, o ficheiro que já existe, o
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
4. **O `new-room.mjs` é o atalho das fases 1 a 7**, e a spec continua a explicar o que ele faz por baixo.
5. **Em aberto, para a próxima sala real:** os retratos (duas passagens) e a composição no editor são
   os dois passos que nenhum ensaio cobriu.

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

**O que fica em aberto, e é honesto dizê-lo:** a porta B sobe 5 m em metade do ciclo, e um visitante que
anda pelo chão só a atravessa na parte do ciclo em que a caixa desce até à altura dos olhos — cerca de
**21%** do tempo. Não é um defeito: é o que a experiência pediu para ensaiar (±5 m no eixo vertical), e a
sala existe para isso ser visto e medido antes de decidir se o movimento entra numa sala a sério.

