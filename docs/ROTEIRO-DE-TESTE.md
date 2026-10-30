# Roteiro de teste — passo a passo

Este é o **roteiro** para percorrer os blocos 2 a 6 do [guia](GUIA-DE-TESTES.md) e a linha `travessia`
da sonda (D55), **pela ordem em que se fazem**, sem saltar entre secções. O guia é a referência (o que
cada teste quer dizer); este ficheiro é o que se segue com o aparelho na mão.

Cada passo diz **o que fazer**, **o que se espera** e **o sinal de falha** — a coisa concreta que, se
acontecer, quer dizer que está mal. Não é preciso forçar nada: um passo que não dê para fazer no
aparelho está marcado.

---

## 0. Antes de começar (10 minutos, uma vez)

| | |
| --- | --- |
| **Aparelhos** | o **telemóvel** (de preferência o fraco, o PowerVR) e o **computador** |
| **Telemóvel** | abrir numa **aba anónima**; tempo de ecrã ≥ 5 min; poupança de energia desligada; na vertical |
| **Computador** | um terminal na raiz do projeto |
| **Servidor local** (só para os blocos 5 e 6) | `node tools/server/serve.mjs` → `http://127.0.0.1:8123` |
| **Repositório limpo** | `git status` tem de estar **vazio**. Os blocos 5 e 6 **escrevem** no repositório, e o passo **B17** desfaz tudo |

Endereços que vão ser usados (publicado = o que o telemóvel vê):

| Nome | Endereço |
| --- | --- |
| Ficha de exemplo, completa | `https://rodrigorez.github.io/zonas12/obra.html?mundo=exemplo-ficha&id=0` |
| Ficha de exemplo, vídeo (ficheiro) | `https://rodrigorez.github.io/zonas12/obra.html?mundo=exemplo-ficha&id=2` |
| Ficha de exemplo, site (YouTube) | `https://rodrigorez.github.io/zonas12/obra.html?mundo=exemplo-ficha&id=3` |
| Sala de exemplo | `https://rodrigorez.github.io/zonas12/?scene=exemplo-ficha` |
| Cidade (7 obras) | `https://rodrigorez.github.io/zonas12/scene1/` |
| Praia (7 obras) | `https://rodrigorez.github.io/zonas12/scene2/` |
| Céu 360º (3 obras) | `https://rodrigorez.github.io/zonas12/scene3/` |
| Noite 360º (6 obras) | `https://rodrigorez.github.io/zonas12/scene4/` |
| Ondas 360º (5 obras) | `https://rodrigorez.github.io/zonas12/scene5/` |
| Becos 360º (5 obras) | `https://rodrigorez.github.io/zonas12/scene6/` |
| Presenças 360º (6 obras) | `https://rodrigorez.github.io/zonas12/scene7/` |
| Imersões 360º (5 obras) | `https://rodrigorez.github.io/zonas12/scene8/` |
| Mangue 360º (4 obras) | `https://rodrigorez.github.io/zonas12/scene9/` |
| Distopia 360º (4 obras) | `https://rodrigorez.github.io/zonas12/scene10/` |
| Memória 360º (5 obras) | `https://rodrigorez.github.io/zonas12/scene11/` |

No computador, os mesmos caminhos em `http://127.0.0.1:8123` (sem `https`), quando o servidor estiver
a correr.

---

## Parte A — Telemóvel (~12 minutos)

### A1. A ficha cabe no ecrã (guia 2.1)

Abra `…/obra.html?mundo=exemplo-ficha&id=0`.

**Esperado:** tudo em retrato, **sem rolar para o lado**; a imagem ocupa a largura do cartão; os dois
botões laranja têm altura de dedo; a sinopse lê-se sem zoom.
**Sinal de falha:** barra de rolagem horizontal, imagem pequena ao centro, ou botão que se tem de
«acertar» com a ponta do dedo.

### A2. O vídeo e o site, mudos (guia 2.2 e 1.3)

Duas fichas, dois caminhos diferentes:

- `…/obra.html?mundo=exemplo-ficha&id=3` — obra **com site** (um vídeo do YouTube): o leitor embutido
  toca **sem som** e o botão azul «Abrir o site da obra» está por baixo;
- `…/obra.html?mundo=exemplo-ficha&id=2` — obra de **vídeo** (ficheiro do projeto): toca sozinha, com os
  controlos do vídeo — não é o leitor do YouTube.

**Sinal de falha:** «Erro de configuração do player / Erro 153» no caso do site, ou um cartão parado.
Nesse caso mande o **endereço** e um print.

### A3. Girar o telemóvel (guia 2.3)

Com a ficha aberta, ponha o aparelho na horizontal.

**Esperado:** continua legível; a coluna alarga mas **não estica a 100%** da largura.
**Sinal de falha:** texto a atravessar o ecrã inteiro, ou a página a saltar para o topo.

### A4. Em inglês (guia 2.4)

Abra `…/obra.html?mundo=exemplo-ficha&id=0&lang=en`.

**Esperado:** interface **e** conteúdo em inglês («Ficha example», «Back to the exhibition»).
**Sinal de falha:** metade em português (é chave que não foi traduzida).

### A5. Uma ficha de produção (guia 2.5)

Abra `…/obra.html?mundo=scene4&id=0`.

**Esperado:** o título **«Harmonização Doméstica»**, a autora **Juliana Garzillo**, o descritivo do autor
e a capa — não uma página de erro do browser. Nenhuma ficha de produção mostra texto provisório.

### A6. Voltar sem 404 (guia 2.6)

Toque em **«Voltar»**.

**Esperado:** cai na **praia** (`/scene2/`), com a sala a construir.
**Sinal de falha:** 404, página em branco, ou cair na raiz sem sala.

### A7. Entrar e abrir uma obra com um toque (guia 3.1 e 3.2)

Abra `https://rodrigorez.github.io/zonas12/`, aceite a câmara, atravesse o portal para a **Cidade**.

**Esperado:** a sala com as **7 obras** e o D-pad de setas ao fundo; aponte a cruz do centro a uma obra
e **toque uma vez** → abre a ficha.
**Sinal de falha:** abre só por olhar 1,5 s (era um defeito antigo), ou o toque não faz nada.

### A8. O ponto de regresso (guia 3.4 e 3.7 a 3.9) — **o passo mais importante**

1. Com o D-pad, caminhe até ficar **de frente para uma obra, longe do início da sala** (uns passos).
2. Toque nela → abre a ficha.
3. Toque em **«Voltar para a exposição»**.

**Esperado:** volta **ao sítio onde estava**, com o mesmo olhar. **Não** ao início da sala.
Repita numa **segunda** obra, noutro canto.
**Sinal de falha:** voltar ao princípio da sala (era o defeito da D63), ou voltar de frente para outra
coisa — nesse caso diga **qual obra** e **onde estava**.

### A9. A travessia, na sonda (D55 — o item 2 da lista)

1. Abra `https://rodrigorez.github.io/zonas12/scene1/?sonda=1`.
2. Caminhe até um portal, encoste e **atravesse**.
3. A página de chegada abre **sem** a sonda (o endereço de chegada é outro). Acrescente `&sonda=1` ao
   endereço e carregue — o registo fica guardado no separador, por isso ele aparece.

**Esperado**, na linha `travessia`:

```
travessia    scene1 porta 3 → scene2 · encosto · captura · ecrã tapado · há 4s
```

O que importa: o **`de`**, a **`porta`**, o **`para`** certo, e a marca **`encosto`**.
**Sinal de falha:** `— (nenhuma nesta sessão)` na página de chegada (o pedido não saiu), ou
`sem preparação` em vez de `encosto · captura · ecrã tapado`.

---

## Parte B — Computador (~15 minutos)

### B1. O rato e a sala de exemplo (guia 3.3, 3.5, 3.6)

Com o rato, pouse em cima de uma obra da Cidade e clique → abre a ficha. Depois abra
`https://rodrigorez.github.io/zonas12/?scene=exemplo-ficha`.

**Esperado:** **quatro** obras em fila — aurora, torre, vídeo (fundo escuro) e, em quarto, a **obra com
site**. Clicar na quarta abre `…id=3`, com o vídeo.
**Sinal de falha:** só três obras (a `site` não desenhada era um defeito).

### B2. O ponto é de um só regresso (guia 3.10)

Abra `/scene1/?volta=1` num separador novo.

**Esperado:** começa no **início** da sala — o ponto guardado não fica colado para sempre.
**Sinal de falha:** aparece no sítio da última obra visitada.

### B3. O botão de entrada e o D-pad (guia 4.1)

Abra `/scene1/` e, se aparecer, carregue em **«Ativar exposição»**.

**Esperado:** a cena arranca; no computador o **D-pad não aparece** (é do telemóvel).
**Sinal de falha:** D-pad no computador, ou cena que não arranca depois do botão.

### B4. A imagem em vez do shader (guia 4.4)

Abra `/scene1/?sonda=1&shader=0`.

**Esperado:** no painel, `fundo image` e `modo sem política (imagem)` — a fotografia, sem animação.
**Sinal de falha:** continuar a dizer `shader`.

### B5. Os nomes das obras (guia 4.5)

Numa sala, carregue na tecla **`D`**.

**Esperado:** o nome de cada obra (`#0 · … · Cidade 360º · page`) e de cada porta. Outra vez em `D`
esconde.

### B6. Inglês na sala (guia 4.6)

Abra `/scene2/?lang=en`.

**Esperado:** interface em inglês, incluindo o nome da sala.

### B7 a B11. A folha (guia 5.1 a 5.6) — escreve no repositório

Confirme primeiro que `git status` está vazio.

1. **B7** — em `data/obras.tsv`, mude **só** a coluna `nome da obra` da linha `scene1` `0` (a primeira obra) para `Teste do autor`.
2. **B8** — `node tools/artwork/from-csv.mjs --check` → lista o que mudaria e **não escreve nada**
   (`git status` continua vazio).
3. **B9** — `node tools/artwork/from-csv.mjs` → escreve; abra `http://127.0.0.1:8123/obra.html?mundo=scene1&id=0`
   e o título é **«Teste do autor»**.
4. **B10** — ponha na coluna `endereço da imagem` um caminho inventado (`assets/nao-existe.jpg`) e
   corra o importador
   outra vez: tem de **recusar**, dizer que a capa não existe, e não escrever.
5. **B11** — desfaça: `git checkout -- data/worlds/scene1.json data/obras.tsv` e `git status` → vazio.

### B12 a B16. O editor (guia 6.1 a 6.5) — escreve no repositório

Com o servidor local a correr:

1. **B12** — abra `http://127.0.0.1:8123/editor.html?world=scene1` → cena construída e
   `Erros: 0 · Avisos: 0`.
2. **B13** — painel **Mundo**: existe o campo «Google Analytics desta sala (ID)», vazio.
3. **B14** — escreva `TESTE` → aparece o problema da lei **L21** (o ID tem de ser `G-XXXXXXX`).
4. **B15** — troque para `G-TESTE123` e **grave** → o problema desaparece e o JSON passa a ter
   `world.analytics.id`.
5. **B16** — painel **Obra**, botão «abrir a ficha» → abre `obra.html?mundo=scene1&id=<n>` noutra aba.

### B17. Desfazer tudo (obrigatório)

```
git checkout -- data/worlds/scene1.json data/obras.tsv
git status
```

**Esperado:** `git status` **vazio**. Se não estiver, **não** feche o terminal sem dizer o que aparece —
um `G-TESTE123` gravado num mundo iria para produção.

---

## Folha de registo

Preencha e mande esta tabela — é o suficiente para eu corrigir o que falhar.

| Passo | Resultado | Nota (só se falhou) |
| --- | --- | --- |
| A1 ficha cabe | ok / falhou | |
| A2 vídeo e site mudos | ok / falhou | |
| A3 girar | ok / falhou | |
| A4 inglês | ok / falhou | |
| A5 ficha de produção | ok / falhou | |
| A6 voltar sem 404 | ok / falhou | |
| A7 toque único abre a ficha | ok / falhou | |
| A8 **ponto de regresso** | ok / falhou | |
| A9 **travessia na sonda** | ok / falhou | |
| B1 rato + sala de exemplo | ok / falhou | |
| B2 um só regresso | ok / falhou | |
| B3 botão e D-pad | ok / falhou | |
| B4 `?shader=0` | ok / falhou | |
| B5 tecla `D` | ok / falhou | |
| B6 `?lang=en` | ok / falhou | |
| B7–B11 CSV | ok / falhou | |
| B12–B16 editor | ok / falhou | |
| B17 árvore limpa | ok / falhou | |

## Se algo falhar, envie

1. **o endereço** completo (copiado da barra);
2. **o que esperava** e **o que aconteceu** (um print resolve);
3. no telemóvel, o **painel da sonda**: abrir o mesmo endereço com `?sonda=1`, tocar em **Copiar** e
   colar. É o que diz o `quadros`, o `pixelRatio` e a `travessia` sem se adivinhar.

## O que **não** é defeito

- o **portão** tem **10 portais e nenhuma obra** — é a entrada;
- as obras têm o **texto e os créditos do autor** (nenhuma é provisória), e as capas vêm do Google
  Drive: a primeira abertura de uma sala pode demorar ~0,9 s mais do que as outras, porque são sete
  idas à rede em paralelo (D68), e isso não é defeito;
- num telemóvel que já deu permissão à câmara, a sala arranca sozinha; noutro, mostra «Ativar
  exposição» — as duas coisas estão certas;
- a ficha abre **no mesmo separador** (é a decisão D60), não numa aba nova;
- a primeira vez que se abre uma sala num aparelho, o `pixelRatio` pode mudar uma ou duas vezes: é a
  política à procura do teto do aparelho. Quedas repetidas com `quadros` muito baixos é que são para
  reportar.
