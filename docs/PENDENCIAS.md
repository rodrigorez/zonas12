# Pendências — o que falta, e a correção de cada coisa

> Auditoria de **2026-11-06**, sobre a exposição completa (portão + 27 salas, 152 portas, 150 obras).
> Só o que está por fazer ou fora de spec. Cada linha traz a **correção**: o ficheiro, a célula e o
> valor exacto — não uma indicação de princípio.
>
> **Como se mediu:** três camadas. O **dado** (`validate`, mais uma leitura dos shaders, dos nomes e das
> janelas de cada porta); os **links** (cada `site` e cada capa remota, com a pergunta que o `fetch`
> sozinho não responde — *pode ser embutido num iframe?*); e o **browser** (28 páginas abertas uma a
> uma, a contar as capas que carregaram, as janelas que carregaram e o que a consola disse).

## Como se lê

| Marca | Quer dizer |
|---|---|
| **[A]** | precisa de uma coisa que só o autor tem: um ficheiro partilhado, uma imagem, um nome, uma escolha |
| **[M]** | mecânico: um valor que se sabe, num sítio que se sabe |
| **[T]** | trabalho de máquina: mede-se em horas, não em decisões |

**O caminho de qualquer correção de link** (`[A]` e `[M]`) é sempre o mesmo, e é a regra da D62 — a
folha é a fonte da verdade, e o dado é o que ela diz depois de importada:

```sh
# 1. a folha passa a dizer o valor certo (a linha da obra, a coluna indicada)
# 2. o dado passa a dizer o mesmo que a folha
node tools/artwork/from-csv.mjs --file data/folha-scene16.tsv --mundo scene16
#    (ou `node tools/artwork/from-csv.mjs` para a folha de produção, `data/obras.tsv`)
# 3. a folha e o dado concordam?
node tools/artwork/from-csv.mjs --file data/folha-scene16.tsv --mundo scene16 --check   # 0
# 4. o endereço responde e deixa-se embutir?
node tools/artwork/links.mjs
```

Saltar o passo 1 é o erro que já custou 75 capas: o `from-csv` seguinte reverte o dado para o que a
folha diz, **sem erro nenhum**. A bateria `csv.mjs` passou a vigiar as 14 folhas por isso (§0).

---

## 0 · Fechado nesta passagem — não é para fazer

- [x] **As folhas das salas 14–27 diziam o contrário do dado.** 83 linhas em 14 folhas, das quais **75
      capas** que já viviam no projecto e que a folha ainda dava por remotas. O `capas-locais` guardou
      as capas em `assets/artworks/` e escreveu o caminho no dado, mas ninguém escreveu o caminho na
      folha — o `from-csv` seguinte devolvia as 75 a remotas, calado. As folhas passaram a espelhar o
      dado (capa **e** sítio) e, na `scene23`, a capa da obra 2 ficou **vazia** em vez de apontar para
      um álbum. As 15 folhas (14 salas + produção) dão `--check` **0**.
      *Guarda:* a bateria `csv.mjs` ganhou a verificação «as 14 folhas das salas dizem o mesmo que o
      dado» — provada a falhar, nomeando o ficheiro, quando uma célula é mudada à mão. 22/22.
- [x] **Instagram e o álbum do Imgur passaram a ser embutíveis.** As páginas normais mandam
      `X-Frame-Options: DENY`; as formas de embutir — `/p/<código>/embed` e `/a/<código>/embed` —
      respondem **200** e não recusam o iframe (medido, D109). Entraram na tabela das plataformas
      (`js/scene/platform-embed.js`), que a ficha e o `links.mjs` já liam. Duas obras fecharam sem tocar
      no dado, e a auditoria passou de 21 para **19** problemas.
- [x] **Os retratos do lote definitivo estão refeitos, duas passagens — 51 pares, 50 desactualizados
      → 0 dentro do lote.** Os destinos `scene2, 3, 4, 6, 7, 9, 10, 11, 12, 13` não têm pendência
      aberta em cima, por isso este trabalho não se repete. Os outros **75 pares** continuam na §6,
      com a razão escrita lá: o destino deles muda quando a §2 e a §3–§5 fecharem.
      *Guarda:* `mapa --check` conta os mesmos 304 pares, `validate` 0/0, e a `seam.mjs` dá **0,10 a
      0,32** em cinco portas (meta 0,50), duas delas do lote que falta.

---

## Verificação independente de 2026-11-06 — o que foi medido, e nada escrito

Passagem **só de leitura**, feita antes de qualquer correção: a bateria que o fim deste documento manda
correr foi corrida outra vez, e três números do documento foram medidos de novo. **Nenhum ficheiro do
projecto foi alterado** — esta secção é o registo, e as provas ficam ditas para não se repetirem.

| Comando | Resultado medido |
|---|---|
| `node tools/scene/validate.mjs` | 0 erros, 0 avisos, exit **0** |
| `node tools/artwork/links.mjs` | `PROBLEMAS: 19` — 8 capas, 7 não embutíveis, 4 HTTP; exit **1** |
| `node tools/artwork/from-csv.mjs --check` | a folha de produção diz o mesmo que o dado, exit **0** |
| `node tools/regression/csv.mjs` | `22 of 22 checks pass` |
| `node tools/scene/mapa.mjs --check` | 27 salas · 49 arestas · 152 portas · `mapa: OK` |
| `node tools/scene/integrar.mjs --seco` | `seco: nada a fazer`, exit **0** |

A §7 confirma-se: nas 152 portas não há nada a fazer.

### O que esta passagem corrige ao documento

- [x] **A §6 diz 126 pares desactualizados; são 125.** Medido par a par, pela mesma leitura do
      `portas-com-retrato.mjs`: a capa mais recente é de **05/11 19:28**, e **125** dos 126 retratos são
      mais antigos do que ela. O único fresco é `gate > scene1` (**06/11 00:33**, refeito na auditoria).
      Zero pares com ficheiro em falta — o problema é a idade, como a §6 diz.
- [x] **A lista da §6.1 não pode ser apagada à letra: 3 dos 13 ficheiros têm de ficar.** Provado por
      remoção e reposição: com `praia.jpg` fora do lugar, o validador falha com
      `assets.retrato-praia: "assets/previews/praia.jpg" does not exist on disk — law L9`, em
      `data/worlds/example.json` (exit **1**) — é o mundo de ensaio que lá aponta. `ceu.jpg` e
      `cidade.jpg` não são pedidos por nenhuma porta, mas o `tools/assets/normalize.mjs` declara os três
      como «the record of what the door showed before» e volta a gerá-los. **A lista segura são 10
      ficheiros** (5 `.jpg` + 5 `.png`, ~616 kB), e é segura: com eles fora, `validate` 0/0,
      `mapa --check` OK e `regression/assets.mjs` **10/10**. Tudo foi reposto; `assets/previews/` está
      com os **265** ficheiros. **A §6.1 não foi reescrita** — fica como está, com esta ressalva.
- [x] **O `from-csv` nunca escreve `world.name`.** Lido no `applyRow`: só toca em `world.artworks` e
      `world.assets`. É o que torna os nomes da §1 seguros de escrever no JSON, sem risco de reversão
      pela folha — ao contrário da capa e do sítio, que é a folha que manda.
- [x] **A correção `[M]` da §4 continua verdadeira, medida hoje por `curl`**: a forma `/file/d/…/preview`
      da `scene23`·6 responde **200** e não manda `X-Frame-Options`; o `open?id=…` que lá está responde
      com `X-Frame-Options: SAMEORIGIN`. A célula pode ser mudada como está escrito.

### O que esta passagem conferiu, sem escrever no dado

- [x] **§1 — o estado por sala, lido do JSON.** As 14 salas (`scene14`…`scene27`) têm `world.name.pt` =
      `world.name.en` = slug. Seis delas — `scene14`, `21`, `22`, `24`, `26`, `27` — não têm mais nada
      pendente: falta-lhes só o nome e o shader.
- [x] **§2 — os shaders, contados do dado.** São **13** shaders para 27 salas: doze em uso único e o
      `grade-neon` em **15** (`scene1` e as 14 novas). **Não existe um único `.glsl` no projecto** — o
      corpo de cada shader vive em `js/shaders/<id>.js`, que é o que o `install.mjs` grava. E nenhuma
      ferramenta impõe a unicidade: `validate`, `shader.mjs` e `shader/validate.mjs` não a verificam,
      por isso a §2 é escolha do autor, não uma lei quebrada.
- [x] **§3 e §5 — os 17 itens, um a um.** `capas-locais --check` conta **8 capas remotas em 6 mundos**
      (`scene5`, `16`, `18`, `19`, `20`, `25`), 0 descarregadas. A `scene23`·2 «Stoned» não tem sequer
      a chave `capa-2` no dado: está sem capa, e não só com a célula vazia.
- [x] **Que folha manda em cada obra**: `scene1`…`scene13` vêm de `data/obras.tsv`; só as `scene14`…`27`
      têm `data/folha-scene<N>.tsv`. Uma correção numa sala antiga importa-se **sem** `--file`/`--mundo`.
- [x] **O `links.mjs` aceita salas como argumento** — `node tools/artwork/links.mjs scene23` —, o que
      deixa verificar um item sem esperar pelos 150.

### Segunda passagem, mesmo dia — o que a §2 precisa para poder ser ensaiada

Os shaders foram medidos e as ferramentas lidas, sem instalar nada e sem escrever um único `.glsl`.

| O que | Resultado medido |
|---|---|
| `node tools/shader/validate.mjs --all` | `13 de 13 shader(s) passam`, 20,0/s cada, exit **0** |
| o browser que a medição usa | `C:\Program Files\Google\Chrome\Application\chrome.exe` presente; `$env:CHROME` vazio |
| `SHADER_IDS` | derivado do registo — um `shaderId` novo sem `install` é erro do `validate` |

- [x] **O ensaio de um shader não escreve no projecto.** `validate.mjs <ficheiro.glsl>` mede um corpo
      solto e só lê o ficheiro; o `install.mjs` não tem `--check` nem outro modo seco, e é o único que
      escreve (`js/shaders/<id>.js` e os dois blocos marcados do registo). É isto que deixa o autor
      experimentar sem sujar o repositório. Ordem obrigatória: **instalar antes de escrever o
      `shaderId`**, porque o enum do esquema vem do registo.
- [x] **Os limites do corpo, lidos no `measure.mjs`**: 8192 B, 5 s de medição a 800×600, tecto de 20
      actualizações por segundo e mínimo de **19**; `--force` perdoa só a cadência, nunca a compilação.
      O `--id` tem de casar `^[a-z][a-z0-9-]*$`; os 13 ids actuais deixam `sala14`…`sala27` livres.
- [x] **O contrato do preâmbulo, lido:** o corpo recebe `vDir`, `uTime`, `az`, `el`, `volta`, `azim`,
      `PI`, `hash`, `noise`, `hash3`, `noise3` e os buracos de realidade (`uHoles`, já aplicados) — e
      preenche `vec3 col`. Não declara nada disso.
- [x] **Um passo em falta na §2, medido no dado:** nas **12** salas antigas a dimensão tem o nome do
      próprio fundo (`Ondas 360º`, `Becos 360º`, `Memória 360º`, `Imersões 360º`…); nas **15** do
      `grade-neon` está tudo em `Cidade 360º`, o nome que veio do `--fundo scene1`. Como o
      `js/editor/panels/artwork.js` agrupa as obras por esse nome, trocar o shader de uma sala sem
      trocar o nome da dimensão deixa o editor a chamar «Cidade 360º» a um fundo que já não é.
      **A §2 não foi reescrita** — fica com esta nota, como a da §6.1.
- [x] **O que esta passagem não correu**: nenhum `install.mjs`, nenhum `.glsl` escrito, nenhuma sala
      com `shaderId` mudado, e o `regression/shader.mjs` **não** foi corrido — o número que o ROADMAP
      dá não foi reconfirmado aqui.

---

## 1 · Salas sem nome — 14 **[A]**

O visitante vê o slug. Falta o nome nas duas línguas.

**Feito nesta passagem (2026-11-06), sem escrever no dado** — o nome é do autor, e os nomes não vieram:

- [x] **Estado medido, ficheiro a ficheiro.** `world.name.pt` = `world.name.en` = slug em todas as 14
      (`scene14`…`scene27`). Árvore de trabalho limpa antes de começar (`v0.0.49`, `git status` vazio).
- [x] **Pauta das 14 salas preparada e entregue ao autor**, uma linha por sala, com as obras que cada
      uma tem montadas (o contexto com que se nomeia), mais duas colunas vazias — `Nome PT`, `Nome EN`.
- [ ] **Nada foi escrito.** Sem os 14 pares pt/en: nenhum `world.name` foi tocado, o `integrar.mjs` não
      foi corrido, e a bateria de provas (`validate`, `integrar --seco`, `mapa --check`, `i18n`, `csv`)
      não foi executada porque o dado não mudou. O trabalho retoma no primeiro item abaixo, quando a
      pauta voltar preenchida. Respostas parciais servem: aplicam-se as salas que vierem e as outras
      ficam como estão (o passo é idempotente).

- [ ] `scene14` … `scene27` (as 14 salas novas)
- [ ] Correção: em `data/worlds/scene<N>.json`, o bloco `world.name`:

      "name": { "pt": "<o nome em português>", "en": "<the name in English>" }

- [ ] Depois: `node tools/scene/integrar.mjs` — o nome de uma sala entra na descrição que as salas
      **vizinhas** dão à janela que a mostra (`portas.mjs`, D46); sem isto os vizinhos ficam a dizer o
      nome antigo. Não mexe em geometria e é idempotente.

## 2 · Shader repetido — 1 shader em 15 salas **[A]** + **[T]** + **[M]**

O projecto tem **13 shaders** para 27 salas: doze estão em uso único e o `grade-neon` está em quinze
(`scene1` **e** as 14 salas novas, que herdaram o fundo da `scene1` — é o `--fundo` por omissão do
`new-room`). Não há shader livre: repetir é a única forma de ficar como está.

- [ ] Correção, por sala — quatro passos, dos quais só o primeiro é do autor:
      1. escrever o corpo do shader num `.glsl` (**sem** preâmbulo: `uTime`, `vDir`, `az`, `el` e
         `vec3 col` vêm do `js/modules/shaders.js`);
      2. `node tools/shader/install.mjs sala14.glsl --id sala14 --name "…"` — grava `js/shaders/sala14.js`
         e regista-o entre os marcadores `// shaders:list` do registo. **Mede** o corpo: recusa o que não
         compila, o que não pinta nada, e o que não sustenta 19 atualizações por segundo no teto de 20
         (`--force` só vence a cadência, e fica com o número medido escrito ao lado);
      3. em `data/worlds/scene14.json`, `dimensions[0].shaderId` passa a `"sala14"` (o `kind` fica
         `shader`, o `fallbackAsset` fica);
      4. `node tools/scene/integrar.mjs` — a janela ao vivo de quem aponta para a sala nomeia o shader
         que o destino desenha (D53). E depois §6, porque o fundo mudou.
- [ ] Alternativa legal e imediata, se o shader não vier: `dimensions[0]` com `kind: "image"` e
      `asset: "cidade-360"` — mas então as quinze salas partilham o mesmo **panorama**, que é o mesmo
      problema com outra roupa.

## 3 · Capas que não carregam — 8 obras **[A]** → **[M]**

Confirmado no browser: a imagem é pedida e fica com `naturalWidth: 0`. Sete são **ficheiros do Drive
não partilhados** (o Google devolve a página de autenticação, não a imagem); um é uma **pasta**.

- [ ] **Partilhar cada ficheiro** («qualquer pessoa com o link»), neste endereço, e depois
      `node tools/artwork/capas-locais.mjs` para o guardar no projecto:

| Sala | Obra | Nome | Ficheiro a partilhar | Célula «endereço da imagem» passa a |
|---|---|---|---|---|
| `scene5` | 1 | A CASA | `drive.google.com/file/d/1Wiwi2jVhrQgMaTCyPEIt4k9Kb_TiGMuD/view` | `assets/artworks/capa-scene5-1.jpg` |
| `scene16` | 1 | Keep Scrolling | `…/d/1NULh7nyycbPZyxiJ3Qs3Py0Nr174AgqT/view` | `assets/artworks/capa-scene16-1.jpg` |
| `scene16` | 5 | Compatibilidad Telepática | `…/d/1eWQSpkeE9RN35EBoecil9cLTyjf26lpn/view` | `assets/artworks/capa-scene16-5.jpg` |
| `scene19` | 1 | Sin Colgar | `…/d/1Buy0uXcfsW-LNURIneQkicatTqdkjefh/view` | `assets/artworks/capa-scene19-1.jpg` |
| `scene19` | 4 | El Castillo | `…/d/17lS1rchDbt80u6SreRYSVTM3OqU5yvuf/view` | `assets/artworks/capa-scene19-4.jpg` |
| `scene20` | 2 | Paseo la Pechina | `…/d/1VUfnddeAxrwNwMrJvh0F3J0i8iagnHuv/view` | `assets/artworks/capa-scene20-2.jpg` |
| `scene25` | 2 | Rock Skulls | `…/d/1y6GnHoGnw5Zrus_-oyKzWFJPOXyFaMr1/view` | `assets/artworks/capa-scene25-2.jpg` |

> O ficheiro a partilhar é o **mesmo** que já está na célula «endereço da imagem» da folha, na forma
> `drive.google.com/file/d/<ID>/view`. O `<ID>` da tabela já é o da folha — não há nada a descobrir.
> A `scene20`·2 é o caso em que a capa e o sítio são **o mesmo ficheiro**: partilhá-lo fecha as duas
> pendências (§5) de uma vez.

- [ ] `scene18` · obra **2** «Aguja inversa» — a célula é uma **pasta**
      (`drive.google.com/drive/folders/1ImKm8RLT0sIDATymCmkMuMAsbHOwv2h2`), e uma pasta não é imagem.
      O sítio desta obra já é um **ficheiro** (`14ed9wS0SID931ulihXmC3T-6Kni6ayrK`), mas está privado
      (HTTP 401). Correção: partilhar esse ficheiro e pôr na célula «endereço da imagem»
      `drive.google.com/file/d/14ed9wS0SID931ulihXmC3T-6Kni6ayrK/view` — a mesma partilha fecha a
      capa **e** o sítio.

### 3.1 · Obra sem capa nenhuma — 1 **[A]**

- [ ] `scene23` · obra **2** «Stoned» — a célula está **vazia de propósito**: o que lá estava era
      `imgur.com/a/CYQ8tFk`, a **página de um álbum**, que nunca foi uma imagem. Correção: o endereço
      da imagem (a fotografia da peça, ou um ficheiro partilhado). O **sítio** desta obra já está
      resolvido — o álbum passou a ser embutido por código (§0).

## 4 · Sites que respondem mas **não podem ser embutidos** — 7 obras **[A]**, 1 **[M]**

A ficha mostra a obra num `<iframe>`. Estes recusam-se (`X-Frame-Options` ou `CSP frame-ancestors`) e a
obra abre numa caixa vazia. **Não são links mortos** — são sites que não deixam ser embutidos.

- [ ] `scene23` · obra **6** «Despiezar al depredante, 2018» — **[M], correção já escrita.**
      A célula «endereço da obra» diz `drive.google.com/open?id=1r5LWKir5qNXZo_ETAIj-olN0Dy7SbwQw&usp=drive_fs`,
      que responde **307** com `SAMEORIGIN`. Passa a
      `https://drive.google.com/file/d/1r5LWKir5qNXZo_ETAIj-olN0Dy7SbwQw/preview`, que responde **200**
      sem `X-Frame-Options` (medido; a `/preview` é a forma do projecto desde a D62).

- [ ] Cinco são **pastas do Drive**, e uma pasta não tem `preview`. Correção: dar o **ficheiro** que
      interessa dentro da pasta (`/file/d/<ID>/preview`), ou — se a obra é o conjunto — trocar a obra
      para `kind: "image"` com uma capa e o texto.

| Sala | Obra | Nome | Pasta que está lá |
|---|---|---|---|
| `scene15` | 4 | Fuentes Brotantes | `1-qcEKHk-7HHnGeFC6n5Y5vggtrAzbJDp` |
| `scene17` | 2 | “Lo que nos estamos comiendo” | `12wsK8DX6Zi49ZUfsjzBIjVvskfgx1M4A` |
| `scene17` | 3 | ENSAYOS DE UN CUERPO EXPANDIDO | `1a0V0nBqBx6_EyAjytNNCzCFlr8F9onZT` (conta `u/1`) |
| `scene18` | 1 | Cuerpo colectivo | `1Tp3dejS2awOgHr0s0n8JzJrZ6EKd9t55` |
| `scene18` | 4 | Bailando con el sol… Dibujando poesía | `1z_1S9EJGRiMrab73fvUhENF7BtU5ECGL` |

- [ ] `scene1` · obra **0** «Entre Pétalas e Silhuetas» — Canva (`canva.link/owpkwgtoa1hh1lb` →
      `canva.com/design/DAHR8eLWalc/…`), `X-Frame-Options: deny`. A forma de embutir da Canva
      (`/view?embed`) responde **403** a quem não tem a sessão da Canva (medido), por isso **não há
      correção de endereço**: ou a peça passa a `kind: "image"` com a capa grande e o texto, ou vai para
      um alojamento que sirva iframe.

## 5 · Sites que devolvem erro — 4 obras **[A]**

- [ ] `scene8` · obra **3** «CONEXÕES...Entre livros!» — Canva, **HTTP 403**. Mesma conclusão da
      `scene1`·0: a Canva não serve a peça a quem não tem sessão. Trocar por imagem/outro alojamento.
- [ ] `scene18` · obra **2** «Aguja inversa» — Drive `/preview`, **HTTP 401** (privado).
      Resolve-se com a partilha de §3 (é o mesmo ficheiro).
- [ ] `scene19` · obra **1** «Sin Colgar» — Drive `/preview`, **HTTP 404**: o ficheiro **já não existe**.
      A capa desta obra é *outro* ficheiro (`1Buy0uXcfsW-LNURIneQkicatTqdkjefh`, privado). Correção:
      partilhar a capa (§3) e dar o endereço novo da peça, ou tirar o sítio e deixar a obra como imagem.
- [ ] `scene20` · obra **2** «Paseo la Pechina» — Drive `/preview`, **HTTP 401** (privado).
      Resolve-se com a partilha de §3 (é o mesmo ficheiro).

**Total de obras distintas com algum problema: 17**, em 11 salas — `scene1`, `5`, `8`, `15`, `16`, `17`,
`18`, `19`, `20`, `23`, `25`.

## 6 · Retratos desactualizados — 75 pares por refazer **[T]**

As **265** imagens de `assets/previews/` (134 retratos + 131 recortes) eram todas mais antigas do que
a capa mais recente (`capas-locais` correu às 19:28; o retrato mais novo era das 19:04). Cada retrato de
uma sala contém as **janelas das suas portas**, e cada janela é o retrato da sala vizinha: enquanto não
forem refeitos, as portas mostram as salas com os painéis escuros de então, mesmo que as salas já
estejam boas.

Os pares já não se escrevem à mão — saem do dado, pela mesma leitura que o `portrait.mjs` usa
(`tools/scene/portas-com-retrato.mjs`): **126 pares**, **125 com `?from` + 1 `--direto`** (o da sala de
ensaio, `scene100 > scene3`, que se desenha da pose por omissão e não de uma porta de chegada). Medido
par a par — cada retrato contra o `data/worlds/<destino>.json`, as capas locais desse destino e o
módulo do shader que ele desenha —, os desactualizados eram **125 de 126**, não 126: o único fresco era
`gate > scene1` (06/11 00:33). Zero pares com ficheiro em falta.

### Feito nesta passagem (2026-11-06) — o lote definitivo, 51 pares, duas passagens

O documento manda refazer os retratos **só depois** de §1–§5 fechados. Não estão, e não vão fechar por
espera; por isso correu-se o lote que nenhuma pendência aberta toca e o resto ficou aberto aqui em
baixo. Decisão tomada explicitamente com quem pediu: **51 pares**, não 126.

| | Medido nesta máquina (16 processadores lógicos, 15,6 GB) |
|---|---|
| calibração, `portrait.mjs scene10 scene11` | **185 s**; os dois ficheiros escritos, jpg **2048×1024**, 143 kB |
| vagas, medidas num lote pequeno | 4 → 50 s/par (medida anterior: 200 s para 4 pares); 6 → **46 s/par** (370 s para 8); **10 → 19 s/par** (189 s para 10) |
| vagas usadas | **10**. A escala é quase linear porque cada render continua a ~190 s sozinho ou com dez: o limite é a latência de cada retrato, não a CPU |
| passagem 1 | **51/51 em 1108 s** (18 min, ~21,7 s/par), zero falhas |
| passagem 2 | **51/51 em 1109 s** (18 min), zero falhas — não houve falhas a repetir |
| idade do lote | **50 de 51 desactualizados antes → 0 depois**, medido par a par |

| Prova | Resultado |
|---|---|
| `node tools/scene/mapa.mjs --check` | 152 portas · **retratos (par .jpg + .png): 304** · `mapa: OK` |
| `node tools/scene/validate.mjs` | **0 erros, 0 avisos**, exit **0** |
| `node tools/regression/seam.mjs`, 5 portas: `scene10 38`, `scene3 7`, `scene19 2` (lote definitivo) e `scene16 2`, `scene19 3` (lote que falta) | salto no corte **0,10 · 0,10 · 0,16 · 0,32 · 0,31** (meta ≤ 0,50), **0 fotogramas escuros** em 57–95 amostras, 3/3 em cada |
| browser — `scene10/?from=scene9`, janela da porta 48 | mostra a sala 11 (a parede de gavetas, as obras e as portas dela), que é o que o retrato `scene11-de-scene10.jpg` diz |
| `git status` | **102 ficheiros, todos em `assets/previews/`** (51 jpg + 51 png), nenhum noutra pasta; `assets/previews/` continua com **265** ficheiros, os 13 órfãos intactos |

- [ ] **Os 75 pares que faltam — 17 salas de destino.** É o que resta da §6, e o motivo é o que a §3
      já dizia: o destino destes retratos muda quando a §2 (o shader) ou a §3–§5 (a capa, o sítio)
      fecharem, por isso o trabalho refaz-se. Contas: **50** pares têm destino com link aberto, **65**
      têm destino no `grade-neon`, a união dá **75**. Nenhum é `--direto` — esse já foi no definitivo.

| Sala de destino | Pares | Vizinhas que a mostram |
|---|---|---|
| `scene1` | 5 | gate, scene2, scene6, scene8, scene9 |
| `scene5` | 5 | gate, scene4, scene6, scene13, scene20 |
| `scene8` | 5 | gate, scene1, scene7, scene13, scene23 |
| `scene14` | 5 | gate, scene10, scene11, scene15, scene25 |
| `scene15` | 5 | gate, scene12, scene14, scene16, scene26 |
| `scene16` | 5 | gate, scene13, scene15, scene17, scene27 |
| `scene17` | 5 | gate, scene2, scene16, scene18, scene27 |
| `scene18` | 4 | gate, scene3, scene17, scene19 |
| `scene19` | 4 | gate, scene4, scene18, scene20 |
| `scene20` | 4 | gate, scene5, scene19, scene21 |
| `scene21` | 4 | gate, scene6, scene20, scene22 |
| `scene22` | 4 | gate, scene7, scene21, scene23 |
| `scene23` | 4 | gate, scene8, scene22, scene24 |
| `scene24` | 4 | gate, scene9, scene23, scene25 |
| `scene25` | 4 | gate, scene14, scene24, scene26 |
| `scene26` | 4 | gate, scene15, scene25, scene27 |
| `scene27` | 4 | gate, scene16, scene17, scene26 |

- [ ] Correção quando chegar a altura, **duas passagens** (a primeira coze o que lá está, a segunda o
      que apareceu):

      node tools/scene/retratos-em-vagas.mjs --do-dado --vagas 10 --passagem 1
      node tools/scene/retratos-em-vagas.mjs --do-dado --vagas 10 --passagem 2

      `--do-dado` desenha os **126** — 22 min a mais por passagem do que só os 75, e deixa-os todos
      convergentes de uma vez. Quem quiser só os 75 gera a lista complementar (o mesmo script desta
      passagem, com o filtro ao contrário) e passa o ficheiro em vez de `--do-dado`.

- [ ] **Só depois** de §1–§5 estarem fechados — um nome, um shader, uma capa ou um sítio mudam o
      retrato. Contas para essa ronda, à taxa de 19 s/par medida hoje: 75 pares a 10 vagas são 8 rondas
      de ~190 s ≈ **25 min por passagem**.

> **Nota de convergência, para quem fechar isto.** Um lote parcial fica correcto nos ficheiros, mas as
> janelas dentro dele mostram retratos que ainda não foram refeitos — é por isso que estes 51, se
> medidos pelo conteúdo das suas janelas, ainda não estão «convergentes». Quando os 75 correrem, o lote
> final precisa de **uma passagem extra sobre estes 51** para assentar: três passagens, não duas, e
> ~**1 h 15** no total. Disse-se aqui em vez de o esconder.

### 6.1 · Ficheiros órfãos em `assets/previews/` — 13 **[M]**

Nenhuma porta os pede: sobraram de salas que mudaram de sítio ou de topologia. Ocupam ~1,1 MB em jpg
(mais os cinco recortes).

- [ ] Apagar `ceu.jpg`, `cidade.jpg`, `praia.jpg`, `scene12-de-scene14.jpg`, `scene15-de-scene13.jpg`,
      `scene16-de-scene12.jpg`, `scene6-de-scene100.jpg`, `scene9-de-scene100.jpg`
- [ ] Apagar `recorte-scene12-de-scene14.png`, `recorte-scene15-de-scene13.png`,
      `recorte-scene16-de-scene12.png`, `recorte-scene6-de-scene100.png`, `recorte-scene9-de-scene100.png`

> Verificado na mesma passagem: **nenhum** dos 126 pares declarados tem ficheiro em falta (126 jpg +
> 126 recortes, todos presentes). O que está mal não é a cobertura — é a idade.

## 7 · Portais — sem problemas

Verificados entrada **e** saída nas 152 portas: 49 arestas do mapa ↔ 98 portas de sala + 27 no portão.
Cada saída tem chegada declarada no destino (L19); cada sala tem exactamente uma porta ao portão e 4–5
portas no total (L24/L25); todas as janelas têm retrato e recorte, e os ficheiros existem. As 519
verificações de travessia (T1/T7/T11) passam: a porta atravessa-se, chega-se ao destino, a câmara fica
no ponto calculado e olha para dentro.

**Nada a fazer.** A única ressalva é visual e está em §6: a janela de uma porta mostra a sala de
destino — e enquanto os retratos forem de antes, mostra o que havia então.

---

## Como se confirma que ficou resolvido

```sh
node tools/scene/validate.mjs                 # o dado: 0 erros, 0 avisos
node tools/artwork/links.mjs                  # 19 -> 0 (só reporta o que está mal)
node tools/artwork/from-csv.mjs --check       # a folha de produção e o dado dizem o mesmo (0)
node tools/regression/csv.mjs                 # 22/22 — inclui as 14 folhas das salas
node tools/scene/mapa.mjs --check             # a topologia
node tools/scene/integrar.mjs --seco          # não há portas por fechar (0)
```

A camada do browser **tem comando desde 2026-11-06**: as **28 páginas** do dado (o portão + 27 salas,
derivadas dos ficheiros de mundo por `tools/regression/paginas.mjs`, `cobertura().ok` = **true**)
abrem-se uma a uma no Chrome do `harness.mjs` — o mesmo das baterias —, e de cada uma saem três números:
as capas que a **malha** desenha, as janelas com retrato e recorte, e os erros de consola desta origem.
O script vive fora do repositório (`%TEMP%\zonas-medicao\medir-paginas.mjs`); o comando, a tabela página
a página e os achados estão na **§8**. Medido: **142/150** malhas com imagem, **152/152** janelas,
**0** erros de consola. Nenhuma bateria substitui a prova visual — foi ela que apanhou o rate limiting
das capas, com o validador a dizer zero, e os painéis pretos da sala 24; e foi ela, nesta passagem, que
viu **8 painéis pretos** numa exposição em que o `<a-assets>` dizia **144** capas carregadas (§8.5-a).

---

## 8 · A prova no browser — as 28 páginas, medidas uma a uma (2026-11-06)

Esta secção é o registo de uma passagem que **só mediu e documentou**. Nada foi reparado: cada achado
entra aqui com a correção escrita — ficheiro, célula, valor —, e é outra passagem que o fecha. Nenhum
ficheiro do projecto — dado, folhas, `assets/`, código — foi alterado, e nada foi commitado; a única
coisa escrita é este documento, que é o que a passagem pede.

### 8.1 · As duas camadas que têm comando — e o número de cada linha

| Comando | Veredicto | Tempo |
|---|---|---|
| `node tools/regression/all.mjs` | **9 de 9** baterias passaram, exit **0** | 1 995,2 s |
| `node tools/regression/all.mjs --full` | **interrompida** (a pedido): **22 de 31** baterias completaram, e **2 delas estão vermelhas** — `motion` 43/44 e `seam` 384/402 → **§8.5-h** | — |

As linhas de cada bateria, para a próxima passagem ter com que comparar:

| Bateria | Linha |
|---|---|
| o dado (`validate`) | **33** ficheiros de mundo `OK` · 0 erros · 0 avisos |
| as leis (`laws-selftest`) | **20 de 20** |
| o mapa (`mapa`) | 27 salas · 49 arestas · **152** portas (125 nas salas + 27 no portão) · 304 retratos · `mapa: OK` |
| o fecho (`integrar --seco`) | `seco: nada a fazer` |
| o servidor (`selftest`) | **34 de 34** |
| o importador da folha (`csv`) | **22 de 22** |
| a cena (`twelve-tests`, T2–T12) | **211 de 211** |
| as portas (`traversal-tests`, T1 e T7/T11) | **519 de 519** |
| as duas línguas (`i18n`, B2) | **9 de 9** |
| as 13 arquivadas que correram (`--full`) | **11 verdes** — `shader` 18/18 · 10/10 · 23/23, `r9` 7/7, `editor-r9` 8/8, `lote` 8/8, `assets` 10/10, `obra` 82/82, `ficha-falhas` 3/3, `volta` 7/7, `capa` 9/9, `ensaio` 19/19, `queda` 6/6 · 8/8 — e **2 vermelhas**: `motion` **43 de 44**, `seam` **384 de 402** (§8.5-h) |

> **Um verde destas duas não é aceitação**, e esta passagem é a prova: as duas deram exit 0 na mesma
> exposição em que oito obras estão pretas no browser (a §8.5-a explica por que nenhuma delas as vê).

### 8.2 · A terceira camada: o comando, o método e a tabela

`cobertura(paginasDaExposicao()).ok` = **true** — 28 salas, 0 fora da lista, 0 ficheiros ignorados. A
lista não é escrita à mão: sai dos ficheiros de `data/worlds/` (menos os fixtures), e cada sala chega
por uma porta que o dado declara.

O medidor (fora do repositório, com `ZONAS_ROOT` e `ZONAS_OUT` apontados para a raiz e para uma pasta
de resultados):

    node %TEMP%\zonas-medicao\medir-paginas.mjs            # as 28
    node %TEMP%\zonas-medicao\medir-paginas.mjs scene16    # uma só

O que ele faz, por página: abre a rota com o `from` do dado, espera `portalDebug.built` (escrito quando
as capas chegaram, D68) e mais 1,5 s, confirma que o `loading-overlay` saiu, e conta:

- **capas** — a imagem que a **malha** da obra desenha (`getObject3D('mesh').material.map.image`), e não
  o `<img>` que ficou no `<a-assets>`. A diferença é a §8.5-a, e é ela que faz o número certo;
- **janelas** — uma por porta: o **retrato** (`fallback` da dimensão) e o **recorte** (`cutout`) com
  `naturalWidth > 0`, mais o `mode` que a dimensão diz (`shader` / `image` / `color`);
- **erros** — `Runtime.consoleAPICalled` (`error`) e `Runtime.exceptionThrown` cujo ficheiro é desta
  origem. Avisos contados à parte; nenhum.

Condições da medição: Chrome sem cabeça a 1280×720, cache desligada, **uma página de cada vez** (o
`lh3.googleusercontent.com` responde 429 a pedidos em paralelo, e media-se o rate limiting em vez da
exposição), câmara falsa do Chrome (`--use-fake-device-for-media-stream`, a mesma das baterias).

| Página | Capas (malha) | Janelas | Erros | Notas |
|---|---|---|---|---|
| `/ (portão)` | 0/0 | 27/27 | 0 | — |
| `/scene1/` | 7/7 | 5/5 | 0 | — |
| `/scene2/` | 7/7 | 5/5 | 0 | — |
| `/scene3/` | 3/3 | 5/5 | 0 | — |
| `/scene4/` | 6/6 | 5/5 | 0 | — |
| `/scene5/` | 4/5 | 5/5 | 0 | **1 preta**: obra 1 |
| `/scene6/` | 5/5 | 5/5 | 0 | — |
| `/scene7/` | 6/6 | 5/5 | 0 | — |
| `/scene8/` | 5/5 | 5/5 | 0 | — |
| `/scene9/` | 4/4 | 5/5 | 0 | — |
| `/scene10/` | 4/4 | 5/5 | 0 | — |
| `/scene11/` | 5/5 | 5/5 | 0 | — |
| `/scene12/` | 4/4 | 5/5 | 0 | — |
| `/scene13/` | 6/6 | 5/5 | 0 | — |
| `/scene14/` | 5/5 | 5/5 | 0 | — |
| `/scene15/` | 5/5 | 5/5 | 0 | — |
| `/scene16/` | 5/7 | 5/5 | 0 | **2 pretas**: obras 1, 5 |
| `/scene17/` | 6/6 | 5/5 | 0 | — |
| `/scene18/` | 4/5 | 4/4 | 0 | **1 preta**: obra 2 |
| `/scene19/` | 4/6 | 4/4 | 0 | **2 pretas**: obras 1, 4 |
| `/scene20/` | 6/7 | 4/4 | 0 | **1 preta**: obra 2 |
| `/scene21/` | 6/6 | 4/4 | 0 | — |
| `/scene22/` | 5/5 | 4/4 | 0 | — |
| `/scene23/` | 6/6 | 4/4 | 0 | obra 2 sem capa (desenha a imagem padrão) |
| `/scene24/` | 8/8 | 4/4 | 0 | — |
| `/scene25/` | 6/7 | 4/4 | 0 | **1 preta**: obra 2 |
| `/scene26/` | 5/5 | 4/4 | 0 | — |
| `/scene27/` | 5/5 | 4/4 | 0 | — |

**TOTAL · 28 páginas · 142/150 malhas com imagem · 152/152 janelas · 0 erros da exposição.**

As 152 janelas são as 152 portas (125 nas salas + 27 no portão), e **todas** estão em modo `shader`, ou
seja: nenhuma caiu para a imagem de reserva nesta máquina, e todas têm retrato **e** recorte no disco. O
`0` de erros não é um filtro complacente — é o mesmo que o T8 mediu nas 28 páginas dentro do `all.mjs`
(`0 erro(s)/aviso(s)` em cada uma), contado aqui por outro caminho.

Duas notas de leitura das imagens, para não se confundirem com achados:

- **A sala 19 chega com metade do ecrã ocupado por um padrão verde com um cronómetro.** Não é defeito:
  é a porta de chegada, que mostra a dimensão `camera` (`scene19` porta 0, `window.dimensionB = 1`,
  `kind: "camera"`) — o mundo real através dela (D81). Num aparelho com câmara é o próprio visitante; no
  Chrome das baterias é o padrão do dispositivo falso;
- **Os caixilhos vermelhos ao longe são as portas**, e dentro delas o retrato do destino. As obras são os
  painéis pequenos ao nível dos olhos; é neles que se lê uma capa preta.

### 8.3 · Previsão vs encontrado — o que bateu certo e o que não bateu

| Previsto (o pedido desta passagem) | Encontrado | Veredicto |
|---|---|---|
| **8** capas a falhar — `scene5`·1, `scene16`·1, `scene16`·5, `scene18`·2, `scene19`·1, `scene19`·4, `scene20`·2, `scene25`·2 | as **mesmas 8**, uma a uma, com `0×0` na textura da malha | **bateu certo** |
| **141** de 150 capas a carregar | **141** capas + **1** imagem padrão = 142 malhas com imagem | **bateu certo** |
| **1** obra sem capa — `scene23`·2 «Stoned» | desenha `assets/covers/sem-capa.svg` (1280×720), não fica preta | **bateu certo** |
| **152** janelas a carregar | **152/152**, todas com retrato e recorte, todas em `shader` | **bateu certo** |
| 0 erros de consola na exposição | 0 nas 28 páginas, e 0 avisos | **bateu certo** |

**O número que não bateu foi o do instrumento, não o da exposição.** Contadas as `<img>` de
`<a-assets>` — que é o que «contar as imagens do mundo com `naturalWidth > 0`» dá, e foi a primeira
medição desta passagem —, o resultado é **144/150**: três das oito capas «perdidas» *carregam*, porque
o primeiro degrau da cadeia do D65 (o thumbnail do YouTube) as salva em `scene16`·1, `scene16`·5 e
`scene19`·4. Só que **nenhuma dessas três chega à malha**: em `<a-assets>` ficam duas `<img>` com o
mesmo `id` (`capa-1`, uma do catálogo e outra resolvida) e a primeira ganha — a do catálogo, que é a
partida. Medida na malha, a previsão do documento é **exacta**, e o `144` era o retrato de um bug
(§8.5-a).

Fica registado, sem apagar a frase antiga da §3: a §3 diz «a imagem é pedida e fica com
`naturalWidth: 0`», e isso continua verdade para o que a obra desenha; o que a §3 não sabia é que a
alternativa resolvida (thumbnail ou imagem padrão) existe no DOM e **não é usada**.

### 8.4 · As fichas — as 11 que se previa falharem, e as amostras das plataformas

Dezasseis fichas abertas em `obra.html?mundo=<slug>&id=<id>`, um screenshot por cada. O estado do
`<iframe>` foi lido onde ele se decide — o documento que o browser navegou dentro da moldura
(`Network.responseReceived`, `recurso: Document`) e o `net::…` de recusa —, não pela classe da caixa
(§8.5-d explica por que a classe não serve).

| Ficha | Previsto | Medido no browser |
|---|---|---|
| `scene1`·0 «Entre Pétalas e Silhuetas» | falhar (Canva, `X-Frame-Options: deny`) | **falha** — o documento devolve 200 e o pedido morre em `net::ERR_BLOCKED_BY_RESPONSE`; a caixa mostra a página de erro do Chrome |
| `scene8`·3 «CONEXÕES...Entre livros!» | falhar (Canva, 403) | **falha** — HTTP **403** |
| `scene15`·4 «Fuentes Brotantes» | falhar (pasta do Drive) | **falha** — HTTP **403** |
| `scene17`·2 «“Lo que nos estamos comiendo”» | falhar (pasta do Drive) | **falha** — HTTP **403** |
| `scene17`·3 «ENSAYOS DE UN CUERPO EXPANDIDO» | falhar (pasta do Drive) | **falha** — HTTP **403** |
| `scene18`·1 «Cuerpo colectivo» | falhar (pasta do Drive) | **falha** — HTTP **403** |
| `scene18`·4 «Bailando con el sol…» | falhar (pasta do Drive) | **falha** — HTTP **403** |
| `scene23`·6 «Despiezar al depredante, 2018» | falhar (`open?id=` com `SAMEORIGIN`) | **falha** — o `open?id=` redirecciona a `/file/d/…/view` e responde **403** |
| `scene18`·2 «Aguja inversa» | falhar (401) | **falha** — HTTP **401** |
| `scene19`·1 «Sin Colgar» | falhar (404) | **falha** — HTTP **404** |
| `scene20`·2 «Paseo la Pechina» | falhar (401) | **falha** — HTTP **401** |
| `scene1`·1 «Golens Transgênicos» (amostra YouTube) | funcionar | **NÃO funciona** — 200, mas o player diz «Vídeo indisponível · A reprodução em outros sites foi desactivada pelo proprietário do vídeo» → **§8.5-b** |
| `scene9`·1 «Guaiamundo» (2.ª amostra YouTube) | — | **funciona** — vídeo a tocar, 21:00 |
| `scene4`·0 «Harmonização Doméstica» (amostra Vimeo) | funcionar | **NÃO funciona** — `player.vimeo.com/video/1231840976` responde **401**; caixa preta com o spinner do player → **§8.5-c** |
| `scene25`·1 «Pincéis de pedra» (amostra p5.js) | funcionar | **funciona** — o sketch «Dune collar» desenha-se |
| `scene22`·4 «Cortina» (amostra Instagram) | funcionar | **funciona** — `/p/DO8PeaMDZ07/embed` com a peça à vista |
| `scene23`·2 «Stoned» (amostra álbum Imgur) | funcionar | **iframe carrega** (`/a/CYQ8tFk/embed`, 200), mas a imagem do álbum não apareceu em 8 s — a caixa fica escura → **§8.5-f** |

**As 11 previstas falham todas**, e a ficha mostra o que se esperava: nenhuma delas dá erro de consola
(0 em todas as 16), e o botão «Abrir o site» continua a ser a saída.

**Duas das amostras que «tinham de funcionar» não funcionam** — o YouTube e o Vimeo. Não são links
mortos nem páginas em baixo: são dois casos que o `links.mjs` não pode ver, e é isso que os torna
achados (§8.5-b, §8.5-c).

**Faltam duas plataformas na amostra, e não por falha da passagem.** Contadas as 138 obras `site` da
exposição: **78** caem em `site` (embutidas tal e qual), **37** no YouTube, **16** no p5.js, **5** no
Vimeo, **1** no Instagram e **1** no álbum do Imgur. **Não existe uma única obra em OpenProcessing nem
em Shadertoy** — as duas entradas da tabela (`js/scene/platform-embed.js`) só são exercitadas pelo teste
sem browser do `obra.mjs`, com endereços de exemplo.

### 8.5 · Achados novos — com a correção escrita, e por fazer
#### a) **[M] O `<img>` da capa resolvida usa o mesmo `id` do asset do catálogo — e a malha fica com o do catálogo**

`js/scene/scene-builder.js`, função `resolveCovers`, **linha 309**. É uma linha:

```diff
-    const id = 'capa-' + artwork.id;
+    const id = 'capa-resolvida-' + artwork.id;
```

O id sai de ali para `covers.set(artwork.id, id)` e daí para `createArtwork(...)` como
`derived.coverId`, que escreve `src: '#' + textureId` — por isso a malha passa a apontar para a `<img>`
resolvida. **Mais nada no projecto escreve `capa-<id>`**: só `tools/artwork/from-csv.mjs:235`, que é a
chave do **catálogo** (é dado, e não se move).

A prova, medida em `scene16`:

| O que | Valor |
|---|---|
| ids em `<a-assets>` | 23 elementos, **16 distintos** — `capa-1`×2, `capa-2`×2 … `capa-7`×2 |
| `document.getElementById('capa-1')` | `https://lh3.googleusercontent.com/d/1NULh7nyycbPZyxiJ3Qs3Py0Nr174AgqT` (o **catálogo**, primeiro no documento) |
| a segunda `<img>` `capa-1` | `https://i.ytimg.com/vi/iS5AADCuXE8/hqdefault.jpg`, `data-capa-de="youtube"` |
| a textura da malha da obra 1 | o **primeiro**: `naturalWidth: 0` → **preto** |

A contraprova é a `scene23`·2: é a única obra **sem** asset no catálogo com esse id, e é a única cuja
malha desenha a imagem padrão (`assets/covers/sem-capa.svg`, 1280×720). Ou seja: a cadeia do D65 corre
inteira e resolve; o resultado é que é atropelado quando o id colide.

Efeito medido: **8 painéis pretos** — exactamente as 8 obras da §3. Sem esta linha, cinco delas passam a
mostrar «Capa indisponível · avisar o administrador da galeria» (o que o D65 promete e hoje só acontece
numa obra) e três passam a mostrar o thumbnail do YouTube.

*Guarda sugerida:* em `tools/regression/capa.mjs`, duas verificações novas — (1) nenhum `id` repetido em
`<a-assets>`; (2) a malha de cada obra tem `material.map.image.naturalWidth > 0`, salvo a obra declarada
sem capa.

> **CORRIGIDO em 2026-11-08, na branch `v0.0.50`** — a linha foi mudada e as três guardas entraram no
> `capa.mjs`. Medido depois, com o mesmo instrumento: **150/150** malhas com imagem, **152/152** janelas,
> **0** erros (antes: 142/150, com as 8 pretas). Das oito, **5** passaram a mostrar a imagem padrão e
> **3** o thumbnail do YouTube — os números que esta alínea previa. A guarda foi provada a falhar: com o
> id antigo de volta, o `capa.mjs` dá **10 de 12**, nomeando os 7 ids repetidos e as obras **1 e 5** da
> `scene16` como pretas. Detalhe e provas na **§8.8**.

#### b) **[A] `scene1`·1 «Golens Transgênicos» — o vídeo recusa ser embutido**

O documento manda provar «uma do YouTube». Esta é a que calhou na amostra, e falha: a ficha devolve
**200** e o player escreve «Vídeo indisponível — A reprodução em outros sites foi desactivada pelo
proprietário do vídeo». Não é HTTP, é uma escolha de quem publicou o vídeo, e por isso o `links.mjs`
(que vê 200) nunca a poderá ver.

*Correção:* o autor activa **«Permitir incorporação»** no YouTube Studio para o vídeo `63faPpyHonk` — a
célula da folha não muda —, ou troca o endereço por outro vídeo. Uma segunda amostra (`scene9`·1
«Guaiamundo») toca sem problema, por isso o achado é «**pelo menos uma** das 37», e não «as 37»: as
outras 35 não foram abertas.

#### c) **[A] `scene4`·0 «Harmonização Doméstica» — o embed do Vimeo responde 401**

O endereço da obra (`vimeo.com/1231840976`) responde 200; o que vai para o `<iframe>`
(`player.vimeo.com/video/1231840976?autoplay=1&muted=1&color=FF5722`) responde **401**, e a caixa fica
preta com o spinner do player.

*Correção do dado [A]:* o autor torna o vídeo incorporável (Vimeo → Privacy → «Where can this be
embedded» → *Anywhere*), ou troca o sítio da obra.

*Correção do instrumento [M], e é a que interessa para o futuro:* `tools/artwork/links.mjs` verifica o
endereço da **obra**, mas quem desenha é `platformEmbed(site).src` (`js/scene/platform-embed.js`). Passa
a pedir **esse** endereço — o `platformEmbed` já é importado pelo `obra.mjs`, e a tabela é a mesma — e a
aplicar-lhe o teste de status/`X-Frame-Options`/`frame-ancestors`. Sem isso, um domínio que responde
bem na página e mal no embed fica invisível para o único instrumento que olha para links.

#### d) **[M] A ficha marca como «carregado» um site que recusou — e esconde a capa por baixo**

Das 11 fichas que falham, **7** ficaram com a classe `carregado` (`scene1`·0, `scene8`·3, `scene15`·4,
`scene18`·2, `scene19`·1, `scene20`·2, `scene23`·6) e só **4** com `falhou`. Em `css/obra.css`,
`.meio-site.carregado > iframe { opacity: 1 }` põe a moldura por cima da capa; `.meio-site.falhou >
iframe { opacity: 0 }` deixa a capa à vista. A heurística de `js/obra.js` — `INSTANT_LOAD_MS = 250` —
assume que um site que recusa dispara o `load` depressa; mediu-se o contrário, e o visitante fica a ver
a página de erro do Chrome (o rectângulo cinzento com o ícone de página partida) em vez da capa da obra
ou do aviso «Capa indisponível».

*Correção [M]:* em `js/scene/platform-embed.js`, marcar `frameable: false` nas entradas que recusam
(Canva, pastas do Drive, `open?id=`) e, em `js/obra.js` (`drawMedium`), marcar a caixa `falhou` de
imediato quando `embed.frameable === false` — a capa fica à vista e o botão «Abrir o site» continua a
ser a saída. A tabela é uma só, e o `links.mjs` da alínea c passa a usá-la também.

#### e) **Informativo — duas plataformas da amostra não têm obra nenhuma**

Não há obras em **OpenProcessing** nem em **Shadertoy** na exposição (contagem em §8.4). A amostra de 7
plataformas que o pedido descreve é, na realidade, de **5**. As duas entradas continuam provadas pelo
teste sem browser do `obra.mjs` (`TABELA`), com endereços de exemplo — mas nunca por uma obra real.

#### f) **`scene23`·2 «Stoned» — o álbum do Imgur carrega o iframe e não mostra a imagem**

O `/a/CYQ8tFk/embed` responde **200** e não manda `X-Frame-Options` (o §0 confirma); no browser a
moldura desenha a interface do Imgur (logo, setas, miniaturas) mas a imagem do álbum não apareceu em
8 s — a caixa fica escura. O álbum existe (`https://imgur.com/a/CYQ8tFk` responde 200 e declara
`og:image = i.imgur.com/tIl3qaA.jpeg`), por isso não é endereço morto. **Fica por decidir**: repetir num
browser com sessão e cookies de terceiros antes de tratar como avaria. O que não muda é a §3.1: a obra
continua sem capa própria e a malha mostra a imagem padrão.

#### g) **Um número da §4 muda; a conclusão dela não**

A §4 diz que o `open?id=…` da `scene23`·6 responde **307** com `SAMEORIGIN` (medido por `curl`). Dentro
do `<iframe>`, o pedido segue para `/file/d/1r5LWKir5qNXZo_ETAIj-olN0Dy7SbwQw/view?usp=drive_fs` e
responde **403**. Continua a não se deixar embutir, e a correção `[M]` que lá está escrita — passar a
`https://drive.google.com/file/d/<ID>/preview` — não muda.

#### h) **[T] `all.mjs --full` não está verde: a `seam.mjs` tem 17 portas acima da meta e a `motion.mjs` perde o controlo**

Duas baterias arquivadas reprovaram, e é a primeira vez que esta passagem o mede:

| Bateria | Linha | O que falhou |
|---|---|---|
| `seam.mjs` (D46) | **384 de 402** | **17 portas** com salto no corte acima de **0,50** — de 0,53 a **2,79** —, mais **1** travessia com fotograma escuro (`scene3` 47 → `gate`, 6 escuros em 99 amostras) |
| `motion.mjs` (B8) | **43 de 44** | o controlo «sala de ensaio · a atravessar o plano, a porta leva-o»: **0 navegações** |

As 17 portas, com o salto medido (meta 0,50):

    gate 0 → scene1        1,48      scene2 0 → scene17     1,26
    gate 22 → scene8       1,01      scene23 3 → scene8     0,53
    scene1 25 → scene8     1,52      scene24 1 → scene25    0,54
    scene13 1 → scene5     0,55      scene27 3 → scene26    0,73
    scene14 3 → scene15    0,72      scene3 0 → scene18     1,55
    scene14 4 → scene25    0,81      scene4 13 → scene5     1,24
    scene15 3 → scene16    2,79      scene6 41 → scene5     0,85
    scene18 1 → scene17    0,74      scene7 42 → scene8     0,73
                                     scene9 28 → scene1     0,59

Isto **contradiz o registo das passagens anteriores**, que fixa «a `seam.mjs` dá **0,10 a 0,32** em cinco
portas (meta 0,50)». A frase antiga fica; ao lado vai o medido: aquelas cinco portas eram uma amostra, e
a varredura completa — a que o `--full` corre, uma entrada por porta do dado, 402 verificações — tem
**17** acima da meta.

**A causa mais provável é a §6**, e é para confirmar antes de se tratar como regressão: o `seam.mjs`
compara exatamente o retrato que a janela mostra com a sala ao vivo, e há **125 pares de retratos
desactualizados** no disco (dos quais 51 foram refeitos e ficaram no commit `c782b89`, branch
`bkp20261106`, a 2026-11-06). Duas portas reprovadas — `scene15` 3 → `scene16` (**2,79**) e
`scene4` 13 → `scene5` (**1,24**) — são de salas com retratos no lote que falta.

**CONFIRMADO em 2026-11-08** — as três medições em isolamento reproduzem os valores da varredura
(`gate 0` = **1,48**, `scene15 3` = **2,79**, `motion` = **43/44**), e a pertença ao lote resolve a
hipótese sem ambiguidade: das 17 portas, **0** têm o retrato entre os 51 refeitos e **17** têm retrato
do lote antigo (`scene8-de-gate.jpg` e `scene5-de-scene13.jpg` de 04/11 21:38, `scene16-de-scene15.jpg`
de 05/11 18:20, …). A `seam` vermelha **é a §6 a aparecer numa medição**, não código partido — e o
«0,10 a 0,32 em cinco portas» das passagens anteriores continua verdadeiro: aquelas cinco eram do lote
fresco. A previsão fica escrita para se poder cobrar: quando os 75 pares da §6 forem refeitos, estas 17
caem abaixo de 0,50.

**A 18.ª falha não é da exposição, é da bateria.** `scene3 47 → gate` chega ao portão, cuja única
dimensão é `kind: "camera"` — a chegada mostra o mundo real, e os «5 escuros em 78 amostras» são o
arranque do dispositivo de câmara do Chrome. O `seam.mjs` já sabe que a porta «leva à câmara» e por isso
não julga o **salto**; tem de aplicar a mesma excepção ao **fotograma escuro**. Correção `[M]`, uma
condição a mais, e nada muda para o visitante.

**O `motion.mjs` continua por explicar** e é o único vermelho sem causa: o controlo «com a porta assente e
a câmara a atravessar o plano» devia navegar e dá **0 navegações** — o que torna vacuamente verdes as duas
verificações vizinhas («parado não leva» / «ao lado não leva»). É defeito real na travessia (D91) ou no
próprio controlo; exige a sua passagem.

*Como confirmar, na próxima passagem* (não feito aqui, e é o primeiro item de quem retomar):

1. `node tools/regression/seam.mjs gate 0` e `node tools/regression/seam.mjs scene15 3` — correr
   **em isolamento** (uma porta, sem as outras 151) e ver se os valores de 1,48 e 2,79 se repetem. Se
   não se repetirem, a bateria tem ruído e não um defeito;
2. com a mesma porta, comparar a árvore de trabalho com a versão commitada dos retratos
   (`git stash push -- assets/previews` e voltar a medir, `git stash pop` a seguir) — se o salto voltar
   a ≤ 0,50 com os ficheiros antigos, o que está mal é o **novo** retrato, e o §6 precisa de ser lido ao
   contrário;
3. o controlo da `motion.mjs` («0 navegações») falha no mesmo dia e na mesma máquina — pode ser o mesmo
   ruído, ou o fixture `scene100`; medir sozinho, como em (1), antes de escrever uma correção.

**Correção quando se souber qual é** — as duas hipóteses, por ordem de probabilidade:

- **se for o retrato**: refazer o par (`.jpg` + `recorte-*.png`) da porta, com o mesmo comando do §6
  (`node tools/scene/retratos-em-vagas.mjs --do-dado --vagas 10`), e voltar a correr a `seam.mjs` nessa
  porta;
- **se for a sala**: o salto mede a diferença entre duas imagens do **mesmo** instante; um salto de 2,79
  numa porta cujo maior passo a caminhar é 8,41 quer dizer que a janela mostra outra coisa que não a
  sala — é o caso do D46 a voltar, e a correção é no `js/scene/reality.js`/`dimension.js` (o recorte e o
  shader da janela), não no retrato.

### 8.6 · O que fica por fazer, e por quem

| Achado | Correção | Marca | Quem |
|---|---|---|---|
| §8.5-h · `seam` 17 portas | nenhuma — é a §6; refazer os 75 pares | **[T]** | máquina |
| §8.5-h · `seam` 18.ª (fotograma escuro no portão) | não julgar os escuros quando o destino é `kind: "camera"` | **[M]** | mecânico |
| §8.5-h · `motion` 1 controlo | apurar se é a travessia (D91) ou o controlo | **[T]** | máquina |
| ~~§8.5-a · 8 painéis pretos~~ | **feito** na `v0.0.50` (2026-11-08) — 1 linha + 3 guardas no `capa.mjs` | **[M]** | — |
| §8.5-b · YouTube `scene1`·1 | activar «Permitir incorporação» (`63faPpyHonk`) | **[A]** | autor |
| §8.5-c · Vimeo `scene4`·0 | tornar o vídeo incorporável | **[A]** | autor |
| §8.5-c · `links.mjs` cego ao embed | verificar `platformEmbed(site).src` | **[M]** | mecânico |
| §8.5-d · a ficha esconde a capa | `frameable: false` na tabela das plataformas | **[M]** | mecânico |
| §3 · as 8 capas | partilhar os ficheiros e `capas-locais.mjs` | **[A]** | autor |
| §4 · as 7 não embutíveis | ficheiro em vez de pasta / imagem em vez de site | **[A]** | autor |
| §5 · as 4 com erro HTTP | partilhar ou trocar o endereço | **[A]** | autor |
| §6 · os 75 retratos | duas passagens de `retratos-em-vagas.mjs` | **[T]** | máquina |

As provas visuais desta passagem — **14 imagens de página** (as 7 salas com problema, a ampliação do
centro de 6 delas e uma com os rótulos das obras) e **21 de ficha** (as 16 da tabela, mais cinco com
espera maior) — ficaram **fora do repositório**, como o script: não entram no `git`, e não há nada
commitado.

**Nada foi reparado nesta passagem.** O que ela entrega é a medida: `all.mjs` com **exit 0** e o número
de cada linha, as 28 páginas com capas/janelas/erros contados, as 11 fichas e as plataformas provadas, e
seis achados com a correção escrita — três deles invisíveis a todas as baterias. Fica também a dívida
declarada: **`all.mjs --full` não deu exit 0** (§8.5-h), e é o primeiro item de quem retomar (§8.7).

### 8.7 · O que esta passagem não chegou a fazer (para quem retomar)

A passagem foi **interrompida a pedido**, a meio do `all.mjs --full`. O que falta, por ordem:

1. **acabar o `--full`** — as 9 baterias arquivadas que ainda não correram (`ordem-da-janela` D80 estava a
   começar, depois `emenda`, `orientation`, `camera-arrival`, `image-bridge`, `labels-artworks`,
   `labels-doors`, `start-button`, `transition`) e registar o número de cada uma;
2. **fechar a §8.5-h** — as três medições em isolamento (`seam.mjs gate 0`, `seam.mjs scene15 3`,
   `motion`), e o teste do `git stash` sobre `assets/previews/`;
3. **decidir as duas amostras que falham** (§8.5-b YouTube, §8.5-c Vimeo) com o autor, e aplicar a
   correção `[M]` do `links.mjs` para deixar de ser cego ao endereço do embed;
4. **a correção de uma linha da §8.5-a**, com a guarda no `capa.mjs` — é a única que fecha um defeito
   visível (8 painéis pretos) sem depender de nada que só o autor tem.

Os instrumentos desta passagem — `medir-paginas.mjs`, `medir-fichas.mjs`, `fichas-lista.json`,
`capturar.mjs`, `capturar-recorte.mjs`, `capturar-ficha.mjs`, `sondar-obras.mjs` — vivem fora do
repositório (`%TEMP%\zonas-medicao\`), como o pedido manda, e é de lá que se volta a correr.

---

### 8.8 · Segunda passagem, 2026-11-08 — a correção da §8.5-a, e o que ela mudou

Branch **`v0.0.50`**, saída da `bkp20261106`. É a única coisa reparada até hoje nesta matéria; tudo o
resto da §8 continua como estava medido.

### 8.8.1 · O que foi mudado

| Ficheiro | Mudança |
|---|---|
| `js/scene/scene-builder.js` | o `<img>` da capa resolvida passa a ter id **`capa-resolvida-<id>`** (era `capa-<id>`, o mesmo do asset do catálogo), com o porquê escrito ao lado |
| `tools/regression/capa.mjs` | três verificações novas, medidas **na sala** e não na ficha: nenhum id repetido em `<a-assets>` · as 7 obras da `scene16` desenham imagem descodificada · a `scene23`·2 desenha a imagem padrão |

Não foi preciso mexer no dado, nas folhas nem em `assets/`: a chave `capa-<id>` continua a ser a do
catálogo (`from-csv.mjs`), e a malha passa a apontar para a `<img>` resolvida pela cadeia do D65.

### 8.8.2 · Antes e depois, com o mesmo instrumento

| Medida (28 páginas, `medir-paginas.mjs`) | 2026-11-06, antes | 2026-11-08, depois |
|---|---|---|
| malhas da obra com imagem descodificada | **142/150** | **150/150** |
| obras a desenhar a imagem padrão | 1 (`scene23`·2) | **6** — as 5 sem capa válida e sem thumbnail, mais a `scene23`·2 |
| obras a desenhar o thumbnail do YouTube | 0 das que falhavam | **3** (`scene16`·1, `scene16`·5, `scene19`·4) |
| janelas com retrato e recorte | 152/152 | **152/152** |
| erros de consola da exposição | 0 | **0** |

As 8 obras que estavam pretas — `scene5`·1, `scene16`·1, `scene16`·5, `scene18`·2, `scene19`·1,
`scene19`·4, `scene20`·2, `scene25`·2 — passaram todas a mostrar **o que o D65 promete**: 5 a imagem
«Capa indisponível · avisar o administrador da galeria» e 3 o thumbnail do vídeo. Os painéis continuam a
denunciar a falta da capa (§3) — o que acabou foi o painel **preto**, que não dizia nada.

### 8.8.3 · As baterias, corridas depois da mudança

| Comando | Resultado |
|---|---|
| `node tools/scene/validate.mjs` | exit **0**, 28 mundos com arranque, L28 e D53 sem erro |
| `node tools/regression/capa.mjs` | **12 de 12** (9 antigas + 3 novas), exit **0** |
| `node tools/regression/capa.mjs` **com o id antigo de volta** | **10 de 12**, exit **1** — «repetidos: capa-1 … capa-7» e «pretas: 1,5». A guarda vê o defeito |
| `node tools/regression/twelve-tests.mjs` | **211 de 211**, exit **0** |
| `node tools/regression/obra.mjs` | **82 de 82**, exit **0** |
| `medir-paginas.mjs` (28 páginas) | **150/150** · **152/152** · **0** erros |

A prova visual: o painel da `scene16` que era um retângulo preto mostra agora o thumbnail do vídeo, e a
ficha da `scene5`·1 mostra a imagem padrão com «Capa indisponível · Avisar o administrador da galeria».
As imagens ficam fora do repositório, com as da §8.

### 8.8.4 · O que continua aberto

Nada disto foi tocado: a `seam` (17 portas da §6 + a 18.ª da câmara), o `motion`, as 9 baterias
arquivadas que nunca correram, as decisões do autor (§8.5-b YouTube, §8.5-c Vimeo) e as pendências das
§3, §4 e §5. A lista viva é a §8.6.





