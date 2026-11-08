# Plano de acção — fechar as pendências

> Medição de **2026-11-08**, sobre `main` = `8e7a568` (árvore limpa, em sincronia com o `origin`).
> Este documento não substitui a `docs/PENDENCIAS.md`: lê-a, confirma-a com números de hoje e ordena
> o que falta por **quem** consegue fechar cada coisa. Nada de código foi alterado nesta passagem — o
> único ficheiro escrito é este.

## Como se lê

| Marca | Quer dizer |
|---|---|
| **[A]** | depende do autor: um ficheiro partilhado, uma partilha, um nome, uma decisão |
| **[M]** | mecânico: sabe-se o ficheiro, a linha e o valor |
| **[T]** | trabalho de máquina: mede-se em horas |

---

## 1 · O que o documento diz que falta — e o estado medido hoje

| § | Pendência | Estado | Prova (comando e número) |
|---|---|---|---|
| 1 | 14 nomes de sala | ⬜ aberto | `world.name.pt = world.name.en = "scene<N>"` nas 14 (`scene14`…`scene27`) |
| 2 | shader repetido | ⬜ aberto | 13 shaders; `grade-neon` em **15** salas; a dimensão diz «Cidade 360º» nas 14 novas |
| 3 | capas que não carregam | ⬜ aberto | `capas-locais.mjs --check` → **8 remotas em 6 mundos, 0 guardadas** |
| 3.1 | obra sem capa | ⬜ aberto | `scene23`·2 «Stoned» não tem a chave de capa no dado |
| 4 | sites não embutíveis | ⬜ aberto | `links.mjs` → **7** (6 pastas do Drive + a Canva da `scene1`·0) |
| 5 | sites com erro HTTP | ⬜ **cresceu: 4 → 9** | `links.mjs` → 5 Vimeo novos (**403** na página, **401** no player) + Canva + 3 Drive |
| 6 | retratos desactualizados | ⬜ aberto | 126 pares, **0** ficheiros em falta; a idade não é medível num checkout (mtime de todos = 17:06) |
| 6.1 | órfãos em `assets/previews/` | ⬜ aberto | os 13 existem; a lista segura continua a ser **10** (guardar `ceu`, `cidade`, `praia`) |
| 7 | portais | ✅ **sem problemas** | `validate` 0/0 · `mapa --check` OK (27 salas · 49 arestas · 152 portas · 304 retratos) · `integrar --seco` «nada a fazer» |
| 8.5-a | 8 painéis pretos | ✅ **feito** | `js/scene/scene-builder.js:313` (`capa-resolvida-<id>`) + 3 guardas no `capa.mjs` |
| 8.5-c | `links.mjs` cego ao embed | 🟡 **meio** | o `platformEmbed` já é importado, mas só o **YouTube** é espiado no endereço do embed |
| 8.5-d | a ficha esconde a capa | ⬜ aberto | não existe `frameable` em `js/scene/platform-embed.js` nem em `js/obra.js` |
| 8.5-h | a 18.ª falha da `seam` | ⬜ aberto | o check dos escuros (`seam.mjs:358`) corre **antes** da excepção da câmara (`seam.mjs:361`) |
| 8.5-h | `motion` 43/44 | 🟢 **causa provada** | ver §2-a |
| 8.7 | 9 baterias arquivadas | ✅ **medidas hoje, todas verdes** | ver §2-c |
| 8.9 | publicação | ✅ em sincronia | `main` = `origin/main` = `8e7a568`; o site responde **200** em `/scene14/`, `/scene27/`, `/docs/PENDENCIAS.md` |

**Núcleo, hoje:** `validate` 0/0 · `from-csv --check` 0 · `csv` 22/22 · `mapa --check` OK ·
`integrar --seco` «nada a fazer». O único vermelho é o `links.mjs` — **24 problemas em 21 obras**,
que é a soma das §3, §4, §5 e da amostra do YouTube.

---

## 2 · Dois achados desta medição

### a) `motion.mjs` — a bateria anda exactamente na guarda do D91

O controlo «a atravessar o plano, a porta leva-o» move a câmara **1 cm por passo**, e a guarda do
`detectTraversal` (`js/modules/portal.js:543`) é `distanceTo > 0.01` — estritamente **mais** de 1 cm.
Medido numa sonda na sala de ensaio (`?scene=scene100`, porta 1, `portal.navigate` substituído):

| Passo por quadro | a atravessar o plano | ao lado do plano |
|---|---|---|
| **1 cm** (o da bateria) | **0** navegações · `andou` = **0** em 200 passos | 0 — vacuamente verde |
| **2 cm** | **1** navegação · `andou` = 199 | **0** — o D91 funciona |

Não é a travessia nem a cena: é o passo do instrumento. Corrigir o passo fecha a bateria sem tocar
no código da exposição.

### b) A hipótese da §6 está **provada**, não presumida

Refizeram-se os **5 retratos de destino `scene1`** (5 vagas, 3 min) e mediu-se a mesma porta:

```
gate 0 → scene1   salto no corte   1,49  →  0,25    (meta ≤ 0,50)    3/3 checks pass
```

Os ficheiros foram repostos (`git checkout -- assets/previews`) — a árvore ficou limpa. As **17
portas vermelhas da `seam` são os retratos velhos**: o trabalho da §6 fá-las cair, e não é preciso
suspeitar do `reality.js`/`dimension.js` para as explicar.

### c) As 9 baterias arquivadas que nunca tinham corrido

`ordem-da-janela` **54/54** · `emenda` **17/17** · `orientation` **6/6** · `camera-arrival` **5/5** ·
`image-bridge` **9/9** · `labels-artworks` **21/21** · `labels-doors` **23/23** · `start-button`
**7/7** · `transition` **9/9** — todas exit **0**. O item 1 da §8.7 fecha-se aqui.

---

## 3 · Fase 0 — o que não depende de ninguém (≈meio dia, fecha 6 pendências)

| # | Correção | Ficheiro |
|---|---|---|
| 0.1 | passo de **2 cm** nos controlos (b) e (c), com o porquê da guarda escrito ao lado | `tools/regression/motion.mjs` (linhas 454–472) |
| 0.2 | não julgar o **fotograma escuro** quando o destino é `kind: "camera"` — a excepção passa para antes do check | `tools/regression/seam.mjs:358` |
| 0.3 | `frameable: false` nas entradas que recusam (Canva, pastas do Drive, `open?id=`) e a ficha marca `falhou` de imediato | `js/scene/platform-embed.js`, `js/obra.js` (`drawMedium`) |
| 0.4 | `links.mjs` passa a espiar `platformEmbed(site).src` em **todas** as plataformas — é o que torna o Vimeo 401 visível | `tools/artwork/links.mjs` |
| 0.5 | apagar os **10** órfãos seguros (manter `ceu.jpg`, `cidade.jpg`, `praia.jpg`) | `assets/previews/` |
| 0.6 | guarda da publicação: um `publicado.mjs` que pergunta ao site, sala a sala (200), e uma linha no README | `tools/regression/publicado.mjs`, `README.md` |

Provas de cada uma: `motion` **44/44** · `seam` sem o falso escuro · `obra.mjs` e `ficha-falhas.mjs`
a continuarem verdes com `frameable` · `validate` + `mapa --check` + `regression/assets.mjs` 10/10
depois dos órfãos · `publicado.mjs` a dar 28/28 no site actual.

---

## 4 · Fase 1 — o autor (caminho crítico de tudo o resto)

### 4.1 · Nomes das 14 salas **[A]**

Pauta pronta — o contexto de cada sala são as obras que ela tem montadas. Respostas parciais
servem: aplica-se o que vier, o passo é idempotente.

| Sala | Obras | Primeiras obras (contexto para nomear) |
|---|---|---|
| `scene14` | 5 | What Reaches the Listener · Cançó de nodrir i destrossa a 4 veus · dissonância/solitud |
| `scene15` | 5 | ecos del abismo · SoundRide 3 · Bajo (Y) Sobre el Mismo Cielo |
| `scene16` | 7 | Keep Scrolling · HEY JELLY · Retro Hoy |
| `scene17` | 6 | Circuiti · “Lo que nos estamos comiendo” · ENSAYOS DE UN CUERPO EXPANDIDO |
| `scene18` | 5 | Cuerpo colectivo · Aguja inversa · Transmut^re |
| `scene19` | 6 | Sin Colgar · Quiero dejar mi nombre… · Borrador para una horda de amazonas |
| `scene20` | 7 | Vulnerables · Paseo la Pechina · Silena |
| `scene21` | 6 | encarne, encarnada · El cielo llora y yo bebo · Los caminos del agua |
| `scene22` | 5 | Artemisa · Ábaco de mariposas · Nuevo día |
| `scene23` | 6 | PERFILADORA DE EXCLUSIÓN · Stoned · Un dato cualquiera |
| `scene24` | 8 | Líneas de horizonte · Un fluir cálido · La arquitectura del murmullo |
| `scene25` | 7 | Pincéis de pedra · Rock Skulls · Next Station |
| `scene26` | 5 | Conexión Perdida · ¿Quieres? · Vivienda a la fuga |
| `scene27` | 5 | Mientras miras · Poéticas de un corazón roto · EU |

Depois: `integrar.mjs` (o nome entra na descrição que as vizinhas dão à janela, D46).

### 4.2 · Shaders **[A]** — 14 salas

Uma de duas decisões, por sala: (a) um corpo `.glsl` novo → `install.mjs <ficheiro> --id sala<N>
--name "…"` e `dimensions[0].shaderId` passa a `sala<N>`; ou (b) `dimensions[0]` com `kind: "image"`
e `asset: "cidade-360"`. **Em qualquer dos casos, o nome da dimensão** (hoje «Cidade 360º» nas 15)
**tem de acompanhar** — o editor agrupa as obras por esse nome.

### 4.3 · Capas a partilhar **[A]** — coluna «endereço da imagem»

Partilhar cada ficheiro («qualquer pessoa com o link») e depois `node tools/artwork/capas-locais.mjs`.

| Obra | Ficheiro / ID | Passa a |
|---|---|---|
| `scene5`·1 «A CASA» | `1Wiwi2jVhrQgMaTCyPEIt4k9Kb_TiGMuD` | `assets/artworks/capa-scene5-1.jpg` |
| `scene16`·1 «Keep Scrolling» | `1NULh7nyycbPZyxiJ3Qs3Py0Nr174AgqT` | `…/capa-scene16-1.jpg` |
| `scene16`·5 «Compatibilidad Telepática» | `1eWQSpkeE9RN35EBoecil9cLTyjf26lpn` | `…/capa-scene16-5.jpg` |
| `scene19`·1 «Sin Colgar» | `1Buy0uXcfsW-LNURIneQkicatTqdkjefh` | `…/capa-scene19-1.jpg` |
| `scene19`·4 «El Castillo» | `17lS1rchDbt80u6SreRYSVTM3OqU5yvuf` | `…/capa-scene19-4.jpg` |
| `scene20`·2 «Paseo la Pechina» | `1VUfnddeAxrwNwMrJvh0F3J0i8iagnHuv` | `…/capa-scene20-2.jpg` |
| `scene25`·2 «Rock Skulls» | `1y6GnHoGnw5Zrus_-oyKzWFJPOXyFaMr1` | `…/capa-scene25-2.jpg` |
| `scene18`·2 «Aguja inversa» | hoje uma **pasta** (`1ImKm8RL…`) — usar o ficheiro do sítio `14ed9wS0SID931ulihXmC3T-6Kni6ayrK` | `…/capa-scene18-2.jpg` |
| `scene23`·2 «Stoned» | **não tem capa** — o endereço é um álbum (`imgur.com/a/CYQ8tFk`) | o endereço da imagem da peça |

### 4.4 · Sítios a corrigir **[A]** (e um **[M]** já escrito)

| Sala·obra | O que está lá | Correção |
|---|---|---|
| `scene23`·6 | `open?id=1r5LWKir…` (**[M]**) | `drive.google.com/file/d/1r5LWKir5qNXZo_ETAIj-olN0Dy7SbwQw/preview` — medido 200, sem `X-Frame-Options` |
| `scene15`·4 | pasta `1-qcEKHk-…` | o ficheiro que interessa (`/file/d/<ID>/preview`) ou `kind: "image"` |
| `scene17`·2 | pasta `12wsK8DX…` | idem |
| `scene17`·3 | pasta `1a0V0nBq…` (conta `u/1`) | idem |
| `scene18`·1 | pasta `1Tp3dejS…` | idem |
| `scene18`·4 | pasta `1z_1S9EJ…` | idem |
| `scene1`·0 | Canva (`deny`; `/view?embed` dá 403) | `kind: "image"` com a capa e o texto, ou outro alojamento |
| `scene4`·0 | Vimeo `1231840976` — player **401** | tornar incorporável (Privacy → *Anywhere*) ou trocar |
| `scene17`·5 | Vimeo `925370538` — página **403** | idem |
| `scene17`·6 | Vimeo `1231276725` — página **403** | idem |
| `scene19`·2 | Vimeo `1230703565` — página **403** | idem |
| `scene19`·3 | Vimeo `1231786379` — página **403** | idem |
| `scene8`·3 | Canva — **403** | imagem ou outro alojamento |
| `scene18`·2 | Drive `/preview` — **401** | resolve-se com a partilha da capa (é o mesmo ficheiro) |
| `scene20`·2 | Drive `/preview` — **401** | resolve-se com a partilha da capa (é o mesmo ficheiro) |
| `scene19`·1 | Drive `/preview` — **404**: o ficheiro **já não existe** | endereço novo da peça, ou tirar o sítio e deixar a obra como imagem |
| `scene1`·1 «Golens Transgênicos» | YouTube `63faPpyHonk` recusa a incorporação | activar «Permitir incorporação» no YouTube Studio (a célula não muda) |
| `scene23`·2 «Stoned» | álbum do Imgur desenha o iframe e não a imagem | decidir: sessão/cookies de terceiros ou tratar como avaria |

**São 21 obras distintas em 11 salas.** As que se fecham com uma só partilha estão assinaladas.

---

## 5 · Fase 2 — aplicar o que o autor entregar **[M]**

O caminho é sempre o mesmo (D62) — a folha é a fonte da verdade:

```sh
# 1. a folha passa a dizer o valor certo
# 2. a folha de produção (scene1…13) ou da sala (scene14…27)
node tools/artwork/from-csv.mjs                                  # data/obras.tsv
node tools/artwork/from-csv.mjs --file data/folha-scene16.tsv --mundo scene16
# 3. as capas locais, quando os ficheiros forem partilhados
node tools/artwork/capas-locais.mjs
# 4. o nome da sala nas descrições das vizinhas
node tools/scene/integrar.mjs
# 5. as provas
node tools/scene/validate.mjs
node tools/artwork/from-csv.mjs --check
node tools/regression/csv.mjs
node tools/scene/mapa.mjs --check
node tools/scene/integrar.mjs --seco
node tools/artwork/links.mjs                       # 24 → 0
```

Saltar o passo 1 é o erro que já custou 75 capas: o `from-csv` seguinte reverte o dado para o que a
folha diz, **sem erro nenhum**.

---

## 6 · Fase 3 — retratos **[T]** (~1 h 15)

Só depois da §4 estar aplicada: um nome, um shader, uma capa ou um sítio mudam o retrato.

```sh
node tools/scene/retratos-em-vagas.mjs --do-dado --vagas 10 --passagem 1
node tools/scene/retratos-em-vagas.mjs --do-dado --vagas 10 --passagem 2
node tools/scene/retratos-em-vagas.mjs --do-dado --vagas 10 --passagem 3
```

126 pares · 10 vagas · ~22 min por passagem. A **terceira** passagem não é zelo: os 51 pares do lote
definitivo (commit `c782b89`) ficam com janelas que mostram retratos ainda por refazer, e só a
passagem extra sobre eles os assenta.

---

## 7 · Fase 4 — provas e publicação **[T]**

| Comando | O que tem de dar |
|---|---|
| `node tools/regression/seam.mjs` | **402/402** (hoje 384/402: 17 portas são a §6, a 18.ª é a §3-0.2) |
| `node tools/regression/motion.mjs` | **44/44** (hoje 43/44: a §2-a) |
| `node tools/regression/all.mjs --full` | **31/31**, exit 0 |
| `medir-paginas.mjs` (28 páginas) | **150/150** malhas · **152/152** janelas · **0** erros |
| `node tools/artwork/links.mjs` | **0** |
| `node tools/artwork/capas-locais.mjs --check` | **0** remotas |
| `node tools/regression/publicado.mjs` | **28/28** no site, depois de avançar o `main` |

Publicar = avançar o `main` para a versão e `git push origin main`. Sem isso, o repositório e o site
separam-se em silêncio — foi o que aconteceu entre 2026-11-04 e 2026-11-08.

---

## 8 · Resumo, por quem fecha

| Fase | Marca | Quem | Tempo | Fecha |
|---|---|---|---|---|
| 0 | **[M]** | nós | ~meio dia | §6.1, §8.5-c, §8.5-d, §8.5-h (2), §8.9 |
| 1 | **[A]** | autor | a decisão é dele | §1, §2, §3, §3.1, §4, §5, §8.5-b, §8.5-f |
| 2 | **[M]** | nós | ~1 h | aplica a Fase 1 |
| 3 | **[T]** | máquina | ~1 h 15 | §6 |
| 4 | **[T]** | máquina | ~4 h | as provas e a publicação |

A ordem é obrigatória: **0 → 1 → 2 → 3 → 4**. A Fase 0 pode começar hoje; a Fase 1 é a única coisa
que não se resolve aqui.
