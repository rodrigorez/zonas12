# Guia — abrir a próxima sala

> **O que é.** O passo a passo que abre uma sala, com os comandos que **hoje** existem, a frase que
> cada um tem de dizer e o que fazer quando não a diz. É o irmão operacional da
> [`SPEC-NOVA-SALA.md`](SPEC-NOVA-SALA.md): a spec explica **porquê** (as leis, as medições, as
> decisões D-A a D-D, a §10 do movimento sorteado); este guia diz **o que teclar, por que ordem, e o
> que deve aparecer no ecrã**. Quando os dois discordarem, manda a spec — e este guia é que está a
> envelhecer.
>
> **A regra que dá sentido ao resto.** Uma sala nova toca **oito sítios** que não se vêem uns aos
> outros (a página, o dado da sala, o dado do portão, o dado de cada destino, a folha das obras, os
> retratos, o movimento das portas e a documentação). Esquecer um não dá erro: dá uma exposição que
> abre e está errada, ou uma bateria verde que não olhou para a sala. Por isso cada passo abaixo tem
> uma frase de sucesso — **um passo sem a sua frase é um passo que não aconteceu**.
>
> **Os números das frases crescem.** Hoje (**2026-11-04**, com a D94 no método e a D95 nos números):
> **14 páginas** (o portão e treze salas), **19 ficheiros de mundo**, **66 portas**, **67 obras**,
> **56 retratos**, **30 leis** (L1–L30) e **28 baterias** no `--full`. O `14 mundo(s)`, o `56 porta(s)`
> e o `(14)` do «a lista cobre todas as salas do dado» sobem a cada sala — o que não muda é a **forma**
> da frase.
>
> **Nada aqui é novo.** Todos os comandos deste guia existem no repositório e são os que a spec manda
> correr; nenhum passo pede uma ferramenta que ainda não esteja escrita.
>
> **Este documento manda no caminho.** Quem (humano ou IA) estiver a criar uma sala ou uma página
> segue **este** guia do princípio ao fim; a [`SPEC-NOVA-SALA.md`](SPEC-NOVA-SALA.md) é a **razão** das
> coisas (as leis, as medições, as decisões D-A a D-D) e abre-se quando um passo daqui remeter para
> uma secção dela. A indicação está repetida onde uma IA olha primeiro: no `README.md` § «Regras para
> Humanos e IA» e no `ROADMAP.md` (§ «Como usar» e §9).

---

## 0. Antes de tocar em ficheiros: as quatro decisões

| | a decisão | o que fixa | a lei que a julga |
| --- | --- | --- | --- |
| **D-A** | **o fundo** | um shader dos que existem (nada a instalar) ou um panorama (`kind: "image"`, 2:1, ≤ 2048×1024) | L1, L14 |
| **D-B** | **os destinos** | três a cinco portas, **uma** ao portão, e o conjunto diferente do de todas as outras salas | L24, L25 |
| **D-C** | **quem leva a chegada** | cada destino ganha a porta que se declara a chegada desta sala — no máximo uma por origem | L19, L17 |
| **D-D** | o movimento | **não é uma decisão**: sorteia-se, e a única escolha é voltar a sortear | L29 |

Um shader **novo** tem caminho próprio (`tools/shader/install.mjs` antes, `tools/regression/emenda.mjs`
depois) e não é este guia. Um fundo **copiado** de uma sala que existe é o caminho normal: `--fundo`.

### A conta que se faz primeiro (L24 + L25)

Duas contas, e ambas antes de escrever, porque as duas se pagam caro depois:

1. **A sala nova** terá `destinos + 1` portas (o portão entra sempre) — e o `--destinos` leva **2 a
   4** salas.
2. **Cada destino** ganha a porta de chegada, e uma sala **não passa de cinco portas** (L24). Se um
   destino já tiver cinco, a porta não cabe — foi o que aconteceu à `scene1` na sala 12 (D93).

Como se lê o número de portas de um destino, com o validador:

```
node tools/scene/validate.mjs
```

e, em cada linha, o terceiro número:

```
data/worlds/scene5.json: OK (2 dimensions, 5 artworks, 4 portals, 12 assets, 4 distinct windows)
                                                  ^^^^^^^^^ 4 portas → cabe mais uma
```

O retrato deste dia (reconte com o comando acima antes de decidir — isto envelhece):

| sala | portas | lugares livres |
| --- | --- | --- |
| `scene1` | **5** | **0 — não pode receber nenhuma porta de chegada** |
| `scene2`, `scene3`, `scene4`, `scene5`, `scene6`, `scene7`, `scene8`, `scene9`, `scene10`, `scene11`, `scene12`, `scene13` | 4 | 1 |

E a L25: o conjunto `{portão + destinos}` tem de ser diferente do de todas as salas. Há **1 066**
conjuntos ainda livres (de **1 079** possíveis — dois, três ou quatro destinos entre as treze salas) —
mas a escolha verifica-se, não se presume: o `new-room` recusa antes de escrever e diz qual é a sala
repetida.

---

## 1. A pasta e o arranque

```
node tools/scene/new-world.mjs <slug>
```

- **Escreve:** `<slug>/index.html` — o mesmo arranque da raiz, só com `<base href="../">` (D28).
- **Tem de dizer:**

  ```
  criado: <slug>/index.html (o mesmo arranque da raiz, com <base href="../">)
  arranques: N mundos conferidos, o mesmo ficheiro fora da linha do <base>
  ```

- **Se não disser:** o slug tem maiúsculas/acentos (só `^[a-z0-9-]+$`), a pasta já existe (a
  ferramenta não escreve por cima), ou o `index.html` da raiz perdeu o `<base href="./">`.

---

## 2. O dado, as portas e o movimento (o atalho das fases 3 a 7)

```
node tools/scene/new-room.mjs <slug> --destinos scene5,scene7 --nome-pt "…" --nome-en "…" [--fundo scene1]
```

| opção | o que faz |
| --- | --- |
| `--destinos a,b` | **2 a 4** salas, **sem** o portão (ele entra sozinho). Obrigatório. |
| `--nome-pt` / `--nome-en` | o nome da sala nas duas línguas. **Sem isto a sala aparece com o slug.** |
| `--fundo <salas>` | de que sala se copiam o fundo, a câmara e a imagem de reserva (por omissão `scene1`) |
| `--sem-ferramentas` | só escreve o dado: não corre anéis, giro, buracos, sorteio nem validador |

- **Escreve:** o dado da sala, a porta no **portão** e a porta de **chegada em cada destino** — e
  corre por baixo os dois anéis, o giro dos retratos, os buracos do mundo real, o **sorteio do
  movimento** e o validador.
- **O sorteio cobre também os mundos que ele tocou** (`--sem-movimento`): as portas que o `new-room`
  acrescenta ao portão e a cada destino nascem **paradas**, e uma porta parada passa a L29 sem a
  exercitar — ela alcança-se sempre. Por isso o sorteio cobre a sala nova **e** esses mundos, e nas
  portas que já oscilavam imprime `já oscila — fica como está` (o movimento delas já foi visto e já foi
  medido — D94). Se acrescentar uma porta de chegada **à mão**, é esta a opção que a põe a oscilar
  (passo 6).
- **Tem de dizer:**

  ```
  escrito: data/worlds/<slug>.json (2 dimensões, N portas)
  escrito: data/worlds/gate.json (+1 porta, +2 assets de retrato)
  escrito: data/worlds/<cada destino>.json (+1 porta, +2 assets de retrato)

  ── os dois anéis (ring --aplicar) — ok (X s) ──
  ── o giro dos retratos (azimuths --aplicar) — ok (X s) ──
  ── os buracos do mundo real (reality --aplicar) — ok (X s) ──
  ── o movimento das portas (sorteio --aplicar) — ok (X s) ──
  ── o validador — FALHOU (X s) ──

  próximos passos (a spec é `docs/SPEC-NOVA-SALA.md`):
  ```

  e, dentro do bloco do sorteio, as portas antigas do portão e dos destinos com
  `porta N -> … | já oscila — fica como está`, e o total a fechar com
  `… · N já oscilavam (intocadas)`. As linhas completas (eixo, amplitude, ângulo, os dois períodos, o
  alcance) são as da sala nova.

- **A única vermelha esperada é o validador, e por uma só razão: a L9.** Os retratos ainda não
  existem — nascem no passo 7 —, e as linhas de erro dizem
  `assets.retrato-…: "assets/previews/…" does not exist on disk — law L9 (an image that never
  appears)`. Vai estar vermelha **em todos os ficheiros tocados**, não só na sala nova: o portão e
  cada destino também ganharam um retrato que ainda não existe. Qualquer **outra** vermelha aqui é
  uma paragem; confirme que é só isso:

  ```
  node tools/scene/validate.mjs
  ```

- **Guarde a semente.** A última linha do bloco do sorteio é
  `semente N — repete este sorteio com --semente N`. É ela que repete esta sala e é ela que vai na
  mensagem do commit.
- **Se não disser:**
  - `a L25 recusa: o conjunto {…} é o mesmo da sala sceneN` — escolha outro destino (esta avisa
    **antes** de escrever);
  - `o destino não existe` / `uma sala não tem uma porta para si própria` / `o portão entra sozinho`;
  - `<slug> é um fixture de ensaio, não uma sala` — a sala de ensaio (`scene100`) vive fora do grafo
    e pôr lá uma sala a sério é apagá-la das chegadas e das baterias;
  - `a pasta da sala não existe` — falta o passo 1 (a ferramenta recusa sem a página).

---

## 3. A composição, no editor

```
node tools/server/serve.mjs
```

e abra `http://127.0.0.1:8123/editor.html?world=<slug>`.

1. **Painel Mundo** — o nome em `pt` e em `en` (se não passou `--nome-pt`/`--nome-en`) e o slug.
2. **Painel Dimensão** — a `0` é o fundo herdado do `--fundo` (troque aqui se quiser outro; o raio
   fica nos 500 — L1) e a `1` é `kind: "camera"` (é ela que a janela da porta ao portão mostra).
3. **Painel Obra** — as obras desta sala, com os `id` que a folha vai usar (0, 1, 2… **não se
   mudam**; é por eles que o passo 4 encontra a obra).
4. **Painel Portal** — as portas **já lá estão** e não se movem à mão: o anel é que manda (L22/L23).
   O movimento também não se edita à mão: volta-se a sortear (passo 6).
5. **Gravar** (com o servidor) ou **Exportar** → `data/worlds/<slug>.json`.

- **Tem de dizer:** a lista de problemas sem **erros**, e a linha do topo com a contagem que se
  espera (portas, obras, assets).
- **Se não disser:** a mensagem do painel é a mesma lei que o `validate.mjs` vai dar — e no passo 8
  tem de estar limpa.

> **A exportação vem antes da folha.** O editor tem em memória a versão do ficheiro que abriu; se
> exportar **depois** do passo 4, apaga os textos, os créditos e as capas que a folha escreveu. Se
> tiver de voltar ao editor mais tarde, recarregue a página (Ctrl+F5) antes de exportar.

---

## 4. A folha das obras

`data/obras.tsv` é a fonte da verdade do nome, dos créditos, do descritivo, da capa e do site.

1. Acrescente **uma linha por obra** (colunas por TABULAÇÃO, `mundo` = o slug novo).
2. Confira: `node tools/artwork/from-csv.mjs --check`
3. Aplique: `node tools/artwork/from-csv.mjs`
4. Confirme que já não há nada a fazer: `node tools/artwork/from-csv.mjs --check`

- **Tem de dizer:**
  - no passo 2, a lista `  <slug>.artworks[i].… ← …` e, no fim,
    `mudaria: <slug> (nada foi escrito: --check)`;
  - no passo 3, `escrito data/worlds/<slug>.json`;
  - no passo 4, `a folha não muda nada: o dado já diz o mesmo`.
- **Atenção ao código de saída:** o `--check` **sai 1 quando há o que mudar** (é o código dele:
  «código 1 se houver») — isso não é um erro, é a resposta «há trabalho». A saída **0** é a do passo 4
  e a da linha de aceitação, quando já não há nada a escrever.
- **Se não disser:**
  - `obra <id> não existe no mundo <slug>` — a obra não está no mundo com esse `id`; volte ao passo 3;
  - `o mundo "<slug>" não existe` — a linha da folha foi escrita antes de a sala existir; a folha só
    se aplica depois do passo 2;
  - `<n> células para <m> colunas` — falta uma TAB dentro de um texto (use aspas nesse texto);
  - `o mundo <slug> ficaria inválido:` — o importador valida o que ia escrever; a lista abaixo é a
    mesma lei que o validador daria. **A L9 cai sempre aqui** enquanto os retratos do passo 7 não
    existirem, e o importador recusa escrever: nesse caso a ordem inverte-se — os dois `--todos` do
    passo 7 primeiro, a folha depois. Nada precisa de ser recozido por causa disso, porque o texto e o
    `kind` não entram na imagem que o retrato guarda (D95).

> **A folha vem antes do passo 5, e os retratos podem vir antes da folha.** Depois de a folha escrever,
> o anel e o giro são recalculados no passo 5 e é isso que os retratos do passo 7 cozem. Se a L9
> obrigar a inverter (retratos antes da folha), confirme no fim que o passo 5 diz `nada a escrever` —
> se ele escrever, os retratos são de antes da mudança e voltam a cozer-se.

---

## 5. Os anéis, o giro e os buracos — outra vez

Compor mudou as obras, e o anel distribui as obras por igual (L22): **todas** as obras da sala mudam
de sítio. As três ferramentas são **idempotentes** — quando não há nada a fazer, dizem-no.

```
node tools/scene/ring.mjs --aplicar
node tools/scene/azimuths.mjs --aplicar
node tools/scene/reality.mjs --aplicar
```

- **Tem de dizer:**

  ```
  14 mundo(s) · 13 com anel de obras · 14 ok, 0 justo(s), 0 falha(s)
  o dado: 13 de 13 em anel (nada a fazer)

  N porta(s) de retrato, 0 sem porta de chegada, 3 de primeira visita
  o dado já diz o mesmo — nada a escrever

  N porta(s) de retrato, N com o mundo real à vista, 0 sem porta de chegada
  o dado já diz o mesmo — nada a escrever
  ```

- **Porque em todos e não só nos que a sala toca:** uma porta nova muda o número de lugares do anel
  dessa sala, e o anel distribui os lugares por igual — **todas** as portas dessa sala mudam de
  sítio, e com elas o giro de todas as portas que apontam para ela. Medido: correr só nos mundos
  tocados deixou a L26 a rebentar em **sete** portas de **quatro** salas que ninguém tinha tocado.
- **Se não disser:** `justo(s)` na folga da L23 (uma obra é larga demais — a mensagem diz quantos
  graus são precisos e quantos há), ou `N sem porta de chegada` (a porta de chegada do destino não
  está posta — é a L19, e quem a põe é o passo 2).

---

## 6. O movimento das portas (já foi sorteado; aqui é como se repete)

O passo 2 já sorteou o `motion` de **cada** porta — as da sala nova e as que ele acrescentou ao portão
e aos destinos. Volte a correr isto se acrescentou uma porta **à mão** a um mundo que já existe, se
mexeu nas dimensões de uma porta (a amplitude sai delas) ou se o ficheiro perdeu o `motion`.

```
node tools/scene/sorteio.mjs <slug>                              # ensaio: diz o que sortearia
node tools/scene/sorteio.mjs <slug> --aplicar                    # escreve no dado
node tools/scene/sorteio.mjs <slug> --aplicar --semente 99       # o mesmo sorteio outra vez
node tools/scene/sorteio.mjs gate <slug> --aplicar --sem-movimento
                                                                 # só as portas paradas
```

- **`--sem-movimento` é o que se usa ao acrescentar uma porta a um mundo que já existe** — a de chegada
  num destino, ou a do portão. Sem ele, o sorteio refaz **todas** as portas desse mundo, e isso muda o
  movimento de portas que o público já viu e que os retratos já mediram. Com ele, quem já oscila
  recebe `já oscila — fica como está` e o total fecha com `· N já oscilavam (intocadas)`.
- **Tem de dizer:** uma linha por porta com o eixo, a amplitude, o ângulo, os dois períodos e o
  **alcance medido**, depois `N portas · N aceites · M rejeitados (X por porta)` e, na última linha,
  `semente N — repete este sorteio com --semente N`.
- **Não se edita o `motion` à mão.** O painel **Portal** do editor mostra e deixa editar estes campos
  porque é uma ferramenta, não uma política: um valor escrito à mão passa a L29 (que só julga o
  alcance) mas não tem quem o defenda. Não gostou do sorteio? Volte a sortear.
- **Se não disser:** a porta não tem `width`/`height` (a amplitude sai delas), a sala tem menos de
  três portas (L24), ou um dos períodos saiu fora de `[10, 20] s`.

---

## 7. Os retratos — duas passagens, sempre

```
node tools/scene/portrait.mjs --todos
node tools/scene/portrait.mjs --todos      # a segunda, sempre
```

- **Escreve:** um par por porta com janela — `assets/previews/<destino>-de-<origem>.jpg` (o retrato,
  que é também a reserva do `?shader=0`) e `recorte-….png` (o que a janela compõe sobre o shader ao
  vivo). São os que faltavam para fechar a L9 do passo 2.
- **Tem de dizer:** por cada retrato, `mundo <destino> a chegar de <origem>: câmara em [x, y, z]` e
  depois `escrito assets/previews/<destino>-de-<origem>.jpg: 2048x1024, N kB` mais a linha do
  `recorte-…png`.
- **Porquê duas vezes:** o retrato de uma sala contém as **janelas das portas dessa sala**, que são
  retratos deles próprios. A primeira passagem cozinha o que lá estava, a segunda o que ficou.
- **Quantos são:** os 56 de hoje mais **`2N + 1`** para uma sala com `N` destinos — a sala nova mostra
  os `N` destinos, o portão ganha um e cada destino ganha um (com dois destinos, 54 pares; com
  quatro, 58).
- **Quanto custa:** ~10 s por retrato na máquina da spec (medido: **387 a 418 s** por passagem com
  **39** retratos), portanto ~9 min por passagem com 54; numa máquina mais rápida medi **6,2 s** por
  retrato (~11 min as duas passagens). É o passo mais caro da sala, e o que mais se esquece.
- **Se não disser:** `a cena de <mundo> não ficou pronta` (a página não construiu em 90 s — veja se o
  mundo abre no browser), ou o desenho falha com o JSON do que faltou.

---

## 8. O validador outra vez (a L9 fecha)

```
node tools/scene/validate.mjs
```

- **Tem de dizer:** `data/worlds/<slug>.json: OK (…)` e o mesmo para o portão e para cada destino
  tocado, **sem nenhuma linha da L9**, e no fim `arranques: N world(s) with an arranque, …`.
- **Se não disser:** algum par de retratos não nasceu — a mensagem diz qual é o caminho que falta.

---

## 9. A verificação inteira

```
node tools/regression/all.mjs --full
```

- **Tem de dizer:** `28 de 28 baterias passaram (X s)`.
- **O que é admissível, e só isto:** o registo da D93 fechou com **3 de 28** vermelhas — a costura e
  duas que falharam por um quadro tardio (a `shader.mjs` e o `assets.mjs`) e passam sozinhas quando
  repetidas. Uma bateria que falha por um quadro tardio **repete-se**, e escreve-se o que deu: nunca se
  escreve «28 de 28» sem se ter visto.
- **Se não disser:** a bateria vermelha diz qual é e porquê; o registo do que cada uma mede está no
  `ROADMAP` § «A verificação».

---

## 10. A prova visual (nenhuma bateria a substitui)

**Entrar pela porta do portão, olhar em volta, sair pela porta de volta, e voltar a entrar** — é o
caminho que o visitante faz e o único que exercita a chegada, o giro e o retrato ao mesmo tempo.

- A sala parece-se com a tabela da §2.1 da spec: obras a 60 m, portas a 90 m, o fundo longe.
- **Ao atravessar, a imagem não muda**: o que a janela mostrava é o que se vê ao chegar (é para isso
  que o retrato existe).
- As portas oscilam, e a de volta ao portão também.
- Registe a data e o que viu — é o que fica escrito na spec (§6) e no `ROADMAP`.

---

## 11. O registo e o commit

- **`README.md`** — os números novos (§ «Estado atual do código»), o endereço `/<slug>/` e o
  `?scene=<slug>` na lista dos endereços.
- **`docs/ROADMAP.md`** — a decisão nova (D94, D95…): o que se mediu, o número que custou, a
  **semente** do sorteio.
- **`docs/SPEC-NOVA-SALA.md`** — se algum número da §1 (páginas, ficheiros, portas, obras, retratos)
  mudou, e o registo da prova visual da §6.
- **O commit** — no ramo da sala (`sala-13`), e depois no `main` **e** no ramo da versão (hoje
  `v0.0.26`). A mensagem leva a semente: é ela que torna o sorteio repetível.

---

## A folha de aceitação (para copiar)

Na ordem em que se correm. Uma linha sem a sua frase é uma linha que não passou.

- [ ] `node tools/scene/new-world.mjs <slug>` — `criado: …` e `arranques: N mundos conferidos`
- [ ] `node tools/scene/new-room.mjs <slug> --destinos …` — os `escrito:`, os quatro blocos `ok` e o
      validador a falhar **só** na L9; a **semente** guardada
- [ ] o editor: a sala composta, sem erros, exportada para `data/worlds/<slug>.json`
- [ ] `node tools/artwork/from-csv.mjs --check` — `mudaria: <slug>` (sai **1**)
- [ ] `node tools/artwork/from-csv.mjs` — `escrito data/worlds/<slug>.json`
- [ ] `node tools/artwork/from-csv.mjs --check` — `a folha não muda nada` (sai **0**)
- [ ] `node tools/scene/ring.mjs --aplicar` — `N ok, 0 justo(s), 0 falha(s)`
- [ ] `node tools/scene/azimuths.mjs --aplicar` — `… 0 sem porta de chegada` e `nada a escrever`
- [ ] `node tools/scene/reality.mjs --aplicar` — `… 0 sem porta de chegada` e `nada a escrever`
- [ ] `node tools/scene/validate.mjs` — **OK** no ficheiro novo e nos tocados; a L9 é a única vermelha
      admissível **aqui**
- [ ] `node tools/scene/laws-selftest.mjs` — `33 of 33 faults detected` e `control … clean`
- [ ] `node tools/scene/portrait.mjs --todos` **duas vezes** — um par por porta com janela
- [ ] `node tools/scene/validate.mjs` — **OK em todos, sem L9 nenhuma**
- [ ] `node tools/regression/all.mjs --full` — `28 de 28` (ou a vermelha repetida e explicada)
- [ ] a prova visual: entrar, olhar em volta, sair pela porta de volta, voltar a entrar
- [ ] `README.md` e `ROADMAP.md` com os números novos e a semente
- [ ] o commit no ramo da sala, no `main` e no ramo da versão

---

## As armadilhas (o que falha sem avisar)

| # | a armadilha | como se vê | o que fazer |
| --- | --- | --- | --- |
| 1 | **Um destino já com cinco portas** | o `new-room` **escreve** e só no fim o validador diz `6 door(s) — law L24` | desfazer: `git checkout -- data/worlds` repõe os ficheiros que já existiam, e o ficheiro e a pasta da sala nova apagam-se à mão (são novos). Depois escolher outro destino — a conta faz-se antes, com a tabela da §0 |
| 2 | **Os retratos esquecidos** | nada: o validador mede a **existência** do retrato, não a idade dele; a janela mostra a sala de ontem | os dois `--todos` do passo 7. É o que se esquece mais vezes |
| 3 | **Exportar do editor depois da folha** | os textos, os créditos e as capas da folha desaparecem do ficheiro | exportar **antes** do passo 4; se voltar ao editor, Ctrl+F5 primeiro |
| 4 | **Sem `--nome-pt`/`--nome-en`** | nada: a bateria das duas línguas passa, porque o slug é o mesmo nas duas | a sala aparece com o slug nos rótulos. Escrever os dois nomes |
| 5 | **A semente não guardada** | a sala fica, mas ninguém a sabe refazer | copiar a última linha do bloco do sorteio para a mensagem do commit |
| 6 | **O `motion` editado à mão** | a L29 só julga o alcance; nada garante que a sala continue a parecer uma sala | voltar a sortear (passo 6) |
| 7 | **Uma sala a sério em `js/scene/fixtures.js`** | nada falha — e a sala sai do grafo, das chegadas e das baterias | nunca; é o que a `scene100` é, e por isso o `new-room` recusa o slug de um fixture |
| 8 | **Correr os anéis só nos mundos tocados** | a L26 rebenta em portas de salas que ninguém tocou (medido: 7 portas de 4 salas) | sem argumentos: as três ferramentas correm sobre tudo e são idempotentes |
| 9 | **A porta de chegada em duas salas para a mesma origem** | a L17 recusa | uma só porta por origem em cada destino |
| 10 | **Uma porta acrescentada à mão fica parada** | **nada** — a L29 mede o alcance de uma porta *que oscila*, e uma porta parada alcança-se sempre (100%) | `sorteio.mjs <mundo> --aplicar --sem-movimento`. Foi o que aconteceu à porta do portão para a sala 12 (D94): foi um olho humano a ver, não uma lei |
| 11 | **O fundo trocado *depois* do `new-room`** (o shader novo da sala) | `error: gate portas[N]: a janela desenha "holograma" e "scene13" desenha "projecao"` — as janelas de quem aponta para a sala ficaram com o `shaderId` que ela tinha quando a porta nasceu | pôr o `shaderId` novo em cada janela que aponta para a sala (o portão **e** cada destino), **antes** do passo 7: o retrato compõe a janela com o fundo que ela declara |

---

## Quanto custa

Medido a **2026-11-03**, nesta máquina (o tempo do autor — os passos 3 e 11 — não se mede):

| passo | tempo |
| --- | --- |
| 1–2 — a pasta, o dado, as portas, os anéis, o giro, os buracos, o sorteio, o validador | **~5 s** |
| 4 — a folha | ~2 s |
| 5 — os três (idempotentes) | < 1 s |
| 7 — os retratos, duas passagens (54 pares com dois destinos) | **~11 min** (a spec orça ~20 min: 387–418 s por passagem de 39) |
| 9 — `all.mjs --full` | **56 min** (registo da D93: 3 350,7 s) |
| | **~1 h, quase toda em dois passos** |

O que o passo 9 mede, por bateria (as seis do gate núcleo, medidas aqui: 1 160 s no total): o dado
0,4 s · as leis 0,7 s · a folha 1,6 s · a cena (T2–T12) 119 s · **as portas (T1 e T7/T11) 969 s** · as
duas línguas 69 s. As outras 22 abrem um Chrome cada uma e são o resto do `--full`.

Os dois passos caros (7 e 9) são os únicos onde há tempo a recuperar sem perder uma verificação — mas
não com os comandos que existem hoje, e este guia não inventa comandos.

---

## O que este guia não cobre

- **A arte, os textos e os shaders.** Um **shader novo** tem caminho próprio: `tools/shader/install.mjs`
  antes e `tools/regression/emenda.mjs` depois; aqui só se diz quando é que ele entra na ordem.
- **O editor em pormenor** — esse guia é o `README.md`, § «A página de edição».
- **Os testes de campo** (o telemóvel, a ficha da obra, o ensaio A/B) — `docs/GUIA-DE-TESTES.md` e
  `docs/ROTEIRO-DE-TESTE.md`.
- **As leis, uma a uma** — `docs/ROADMAP.md` §8; e o **porquê** de cada passo deste guia está na
  [`SPEC-NOVA-SALA.md`](SPEC-NOVA-SALA.md).
