# Plano de acção — fechar as pendências

> Medição de **2026-11-08**, sobre `main` = `8e7a568` (árvore limpa, em sincronia com o `origin`).
> Este documento não substitui a `docs/PENDENCIAS.md`: lê-a, confirma-a com números de hoje e ordena
> o que falta por **quem** consegue fechar cada coisa.
>
> **Estado a 2026-11-08, fim do dia: a Fase 0 está feita** (§3) — seis correcções mecânicas, todas
> provadas com o instrumento que as julga, mais um achado novo (§4.4, o Instagram da `scene22`·4).
> O registo com os números está na §9 da `docs/PENDENCIAS.md`.
>
> **E a §1 e a §2 também: as 14 salas têm nome e fundo próprio** (§4.1, §4.2) — os nomes escolhidos
> sobre a análise das 80 obras e os catorze shaders escritos a partir deles, instalados a 20,0/s e
> provados na cena. O que resta da Fase 1 são as capas e os sítios.

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
| 1 | 14 nomes de sala | ✅ **feito (Fase 1)** | escolhidos pelo autor e escritos; a ficha e o `<title>` dizem «Corpo como Território», «Solidão em Rede»… |
| 2 | shader repetido | ✅ **feito (Fase 1)** | 14 corpos novos (`sala14`…`sala27`), 27 shaders, `grade-neon` só na `scene1`; `shader/validate --all` 27/27 a 20,0/s |
| 3 | capas que não carregam | ⬜ aberto | `capas-locais.mjs --check` → **8 remotas em 6 mundos, 0 guardadas** |
| 3.1 | obra sem capa | ⬜ aberto | `scene23`·2 «Stoned» não tem a chave de capa no dado |
| 4 | sites não embutíveis | ⬜ aberto | `links.mjs` → **8** (6 pastas do Drive, a Canva da `scene1`·0 e o Instagram da `scene22`·4) |
| 5 | sites com erro HTTP | ⬜ **cresceu: 4 → 9** | `links.mjs` → 5 Vimeo novos (**403** na página, **401** no player) + Canva + 3 Drive |
| 6 | retratos desactualizados | ⬜ aberto | 126 pares, **0** ficheiros em falta; a idade não é medível num checkout (mtime de todos = 17:06) |
| 6.1 | órfãos em `assets/previews/` | ✅ **feito (Fase 0)** | 265 → **255** ficheiros, 616 kB; `validate` 0/0, `mapa` OK, `assets.mjs` 10/10 |
| 7 | portais | ✅ **sem problemas** | `validate` 0/0 · `mapa --check` OK (27 salas · 49 arestas · 152 portas · 304 retratos) · `integrar --seco` «nada a fazer» |
| 8.5-a | 8 painéis pretos | ✅ **feito** | `js/scene/scene-builder.js:313` (`capa-resolvida-<id>`) + 3 guardas no `capa.mjs` |
| 8.5-c | `links.mjs` cego ao embed | ✅ **feito (Fase 0)** | espia `platformEmbed(site).src` em todas as plataformas; diz para onde o pedido seguiu |
| 8.5-d | a ficha esconde a capa | ✅ **feito (Fase 0)** | `frameable: false` (Canva, pastas do Drive, `open?id=`) + a caixa nasce `falhou` |
| 8.5-h | a 18.ª falha da `seam` | ✅ **feito (Fase 0)** | `scene3 47 → gate` **1/1**; os escuros da câmara ficam ditos, não julgados |
| 8.5-h | `motion` 43/44 | ✅ **feito (Fase 0)** | era o passo da bateria (1 cm = a guarda do D91) → **44/44** |
| 8.7 | 9 baterias arquivadas | ✅ **medidas, todas verdes** | ver §2-c |
| 8.9 | publicação | ✅ **em sincronia, e agora com guarda** | `publicado.mjs`: **28 salas + 33 ficheiros** de acordo; provada a falhar com 1 byte a mais |

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

## 3 · Fase 0 — o que não depende de ninguém ✅ **feita a 2026-11-08**

| # | Correção | Ficheiro | Prova |
|---|---|---|---|
| 0.1 | passo de **2 cm** nos controlos (b) e (c), com o porquê da guarda escrito ao lado | `tools/regression/motion.mjs` | `motion` **44/44**, exit 0 (era 43/44) |
| 0.2 | não julgar o **fotograma escuro** quando a chegada é a câmara | `tools/regression/seam.mjs` | `seam scene3 47` **1/1**, exit 0 |
| 0.3 | `frameable: false` (Canva, pastas do Drive, `open?id=`) e a caixa `falhou` de imediato | `js/scene/platform-embed.js`, `js/obra.js` | `obra` **82/82** · `ficha-falhas` **3/3** · `capa` **12/12** |
| 0.4 | `links.mjs` espia `platformEmbed(site).src` em todas as plataformas | `tools/artwork/links.mjs` | apanha o Vimeo (5 obras) e o Instagram da `scene22`·4 |
| 0.5 | apagar os **10** órfãos seguros (mantidos `ceu`, `cidade`, `praia`) | `assets/previews/` | 265 → 255 · `validate` 0/0 · `mapa` OK · `assets` 10/10 |
| 0.6 | guarda da publicação, sala a sala, página **e** dado | `tools/regression/publicado.mjs`, `README.md` | **28 salas + 33 ficheiros** de acordo; provada a falhar |

O registo com os números completos está na **§9 da `docs/PENDENCIAS.md`**.

---

## 4 · Fase 1 — o autor (caminho crítico de tudo o resto)

### 4.1 · Nomes das 14 salas **[A]** ✅ **feito a 2026-11-08**

A pauta das 14 salas foi analisada obra a obra, com **três propostas por sala** (o «porquê» de cada uma),
e o autor escolheu. Escritos, provados e registados na **§1 da `docs/PENDENCIAS.md`**, que traz a tabela
completa:

| Sala | Nome PT | Nome EN |
|---|---|---|
| `scene14` | Sinais Invisíveis | Invisible Signals |
| `scene15` | Paisagens Sonoras | Soundscapes |
| `scene16` | Depois do Ecrã | After the Screen |
| `scene17` | Corpo como Território | Body as Territory |
| `scene18` | Sombras e Raízes | Shadows and Roots |
| `scene19` | Memória sob Ataque | Memory Under Attack |
| `scene20` | Habitar | Dwelling |
| `scene21` | Matéria Frágil | Fragile Matter |
| `scene22` | Ciclos | Cycles |
| `scene23` | Sociedades de Controlo | Control Societies |
| `scene24` | Murmúrio e Matéria | Murmur and Matter |
| `scene25` | Arcade Crítico | Critical Arcade |
| `scene26` | Solidão em Rede | Networked Loneliness |
| `scene27` | Quem Nos Olha | Who Watches Us |

O `integrar.mjs` ganhou o passo que faltava: acertar o `alt` do retrato que cada vizinha mostra (a única
cópia do nome fora do ficheiro da própria sala) — 252 descrições, mais o inglês de 13 mundos antigos.
E, pela §6, **os retratos destas 14 salas passam a ter de ser refeitos** no lote final.

### 4.2 · Shaders **[A]** — 14 salas ✅ **feito a 2026-11-08**

Os catorze corpos foram escritos **a partir do nome de cada sala** (a sala e o seu fundo dizem a mesma
coisa), instalados e medidos um a um — todos a **20,0/s** com `p95` de 6,2–6,3 ms — e ligados ao dado
(`shaderId` + nome da dimensão). O `grade-neon` ficou só na `scene1`: 13 → **27** shaders.

| Sala | Shader | O que desenha |
|---|---|---|
| `scene14` | `sala14` Sinais Invisíveis | frentes de onda de um ponto à frente da chegada, interferência, antenas no chão |
| `scene15` | `sala15` Paisagens Sonoras | barras de espectro no céu, marulho no chão |
| `scene16` | `sala16` Depois do Ecrã | varrimento, vazio e um retângulo de pixels acesos |
| `scene17` | `sala17` Corpo como Território | membrana com veias, poros e pulsação |
| `scene18` | `sala18` Sombras e Raízes | húmus, raízes a subir, lua fria |
| `scene19` | `sala19` Memória sob Ataque | fatias a apagar, brasas, estática |
| `scene20` | `sala20` Habitar | parede quente, janela de quatro vidros, luz no chão |
| `scene21` | `sala21` Matéria Frágil | esmalte de porcelana com cabelos de crack |
| `scene22` | `sala22` Ciclos | a lua a passar por todas as fases |
| `scene23` | `sala23` Sociedades de Controlo | células que vigiam, feixe, código de barras, retículo |
| `scene24` | `sala24` Murmúrio e Matéria | a espiral da concha e a poeira |
| `scene25` | `sala25` Arcade Crítico | blocos de três cores, linhas de tubo, vinheta |
| `scene26` | `sala26` Solidão em Rede | nós de luz e um nó que nunca se apaga |
| `scene27` | `sala27` Quem Nos Olha | um olho com íris em anéis e pupila que segue |

Três coisas que esta passagem teve de resolver, e que o documento não previa:

1. **O elemento focal de cada fundo foi medido, não adivinhado.** A orientação em que a câmara chega a
   olhar varia por sala (180°, 171°, 165°, 149°, −135°) e um olho ou uma lua postos a −Z ficavam atrás
   do visitante. Lida no browser, sala a sala, e escrita no corpo.
2. **O `integrar.mjs` não fazia o 4.º passo** (o `window.shaderId` das 60 janelas, D53) — respondia
   `nada a fazer` com o `validate` a recusar. Passou a acertá-lo, com a leitura do `new-room`.
3. **O T4 da aceitação compara dois pixels**: uma paleta quantizada pode dar-lhes a mesma cor e reprovar
   sem haver defeito (aconteceu na `scene25`, e passou ao segundo pixel noutra corrida). O fundo dela
   ganhou um gradiente lento em azimute — que é também a luz desigual do tubo — e a bateria ficou
   211/211.

Pela §6, **os retratos destas 14 salas têm agora duas razões para serem refeitos** (o nome e o fundo).

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
| **`scene22`·4 «Cortina»** | o embed do Instagram responde 200 + `DENY` e manda para o **login**; a ficha mostra a página de erro do Chrome | imagem em vez de site, ou um endereço que sirva o embed sem sessão |

**São 22 obras distintas em 12 salas.** As que se fecham com uma só partilha estão assinaladas.

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
| `node tools/regression/seam.mjs` | **402/402** (hoje 384/402: as 17 portas são a §6; a 18.ª, a da câmara, já está fechada) |
| `node tools/regression/motion.mjs` | **44/44** ✅ (fechada na Fase 0) |
| `node tools/regression/all.mjs --full` | **31/31**, exit 0 |
| `medir-paginas.mjs` (28 páginas) | **150/150** malhas · **152/152** janelas · **0** erros |
| `node tools/artwork/links.mjs` | **0** (hoje 25 problemas em 22 obras) |
| `node tools/artwork/capas-locais.mjs --check` | **0** remotas (hoje 8) |
| `node tools/regression/publicado.mjs` | **28 salas + 33 ficheiros** de acordo, depois de avançar o `main` |

Publicar = avançar o `main` para a versão e `git push origin main`. Sem isso, o repositório e o site
separam-se em silêncio — foi o que aconteceu entre 2026-11-04 e 2026-11-08.

---

## 8 · Resumo, por quem fecha

| Fase | Marca | Quem | Tempo | Fecha |
|---|---|---|---|---|
| 0 | **[M]** | nós | ✅ **feita** | §6.1, §8.5-c, §8.5-d, §8.5-h (2), §8.9 |
| 1 | **[A]** | autor | em curso — **1.1 (nomes) e 1.2 (shaders) feitos** | §3, §3.1, §4, §5, §8.5-b, §8.5-f, §8.5-d bis |
| 2 | **[M]** | nós | ~1 h | aplica a Fase 1 |
| 3 | **[T]** | máquina | ~1 h 15 | §6 |
| 4 | **[T]** | máquina | ~4 h | as provas e a publicação |

A ordem é obrigatória: ~~0~~ → **1** → 2 → 3 → 4. A Fase 0, a §1 e a §2 estão fechadas; o que resta da
Fase 1 são as capas (9 obras) e os sítios (17 obras).
