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

---

## 1 · Salas sem nome — 14 **[A]**

O visitante vê o slug. Falta o nome nas duas línguas.

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

## 6 · Retratos desactualizados — 126 pares **[T]**

As **265** imagens de `assets/previews/` (134 retratos + 131 recortes) são todas mais antigas do que
a capa mais recente (`capas-locais` correu às 19:28; o retrato mais novo é das 19:04). Cada retrato de
uma sala contém as **janelas das suas portas**, e cada janela é o retrato da sala vizinha: enquanto não
forem refeitos, as portas mostram as salas com os painéis escuros de então, mesmo que as salas já
estejam boas.

Os pares já não se escrevem à mão — saem do dado, pela mesma leitura que o `portrait.mjs` usa
(`tools/scene/portas-com-retrato.mjs`): **126 pares** (125 com `?from` + 1 de primeira visita).

- [ ] Correção, **duas passagens** (a primeira coze o que lá está, a segunda o que apareceu):

      node tools/scene/retratos-em-vagas.mjs --do-dado --vagas 4 --passagem 1
      node tools/scene/retratos-em-vagas.mjs --do-dado --vagas 4 --passagem 2

- [ ] **Só depois** de §1–§5 estarem fechados — um nome, um shader, uma capa ou um sítio mudam o
      retrato. Custo medido: 4 em paralelo dão 3,66× (200 s para 4 pares); 126 pares são ~1,7 h por
      passagem, ~3,5 h as duas.

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

A camada do browser não tem comando próprio: é abrir `node tools/server/serve.mjs` e olhar
(`http://127.0.0.1:8123/scene<N>/?from=<vizinha>`). Nenhuma bateria substitui a prova visual — foi ela
que apanhou o rate limiting das capas, com o validador a dizer zero, e os painéis pretos da sala 24.
