# Pendências — o que falta e o que está mal

> Auditoria de **2026-11-05**, sobre a exposição completa (portão + 27 salas, 152 portas, 150 obras).
> Só o que está por fazer ou fora de spec. O que está correcto não aparece aqui — foi verificado e passa.
>
> **Como se mediu:** três camadas. O **dado** (`validate`, mais uma leitura dos shaders, dos nomes e das
> janelas de cada porta); os **links** (cada `site` e cada capa remota, com a pergunta que o `fetch`
> sozinho não responde — *pode ser embutido num iframe?*); e o **browser** (28 páginas abertas uma a uma,
> a contar as capas que carregaram, as janelas que carregaram e o que a consola disse).
>
> **Para repetir a camada dos links:** `node tools/artwork/links.mjs` (só reporta o que está mal).

---

## 1 · Salas sem nome — 14

O visitante vê o slug. Falta o nome nas duas línguas (`new-room --nome-pt "…" --nome-en "…"`, ou o painel
Mundo do editor; depois `ring`/`azimuths` não são precisos — o nome não mexe em geometria).

- [ ] `scene14`
- [ ] `scene15`
- [ ] `scene16`
- [ ] `scene17`
- [ ] `scene18`
- [ ] `scene19`
- [ ] `scene20`
- [ ] `scene21`
- [ ] `scene22`
- [ ] `scene23`
- [ ] `scene24`
- [ ] `scene25`
- [ ] `scene26`
- [ ] `scene27`

## 2 · Shader repetido — 1 shader em 15 salas

O projecto tem **13 shaders** e 27 salas. Doze estão em uso único; um está em quinze.

- [ ] **`grade-neon`** — `scene1` e **as 14 salas novas** (`scene14`…`scene27`). As salas novas herdaram
      o fundo da `scene1` (é o `--fundo` por omissão do `new-room`). Cada uma precisa do seu shader — ou
      de um panorama —, escolhido no painel Dimensão do editor (fase 2 da spec).

## 3 · Capas que não carregam — 8 obras

Confirmado no browser: a imagem é pedida e fica com `naturalWidth: 0`. Sete são **ficheiros do Drive não
partilhados** (o Google devolve a página de autenticação, não a imagem); um é uma **pasta**.

Depois de partilhar, correr `node tools/artwork/capas-locais.mjs` outra vez (guarda-as no projecto) e
`node tools/artwork/links.mjs` para confirmar.

- [ ] `scene5` · obra **1** «A CASA» — Drive privado
- [ ] `scene16` · obra **1** «Keep Scrolling» — Drive privado
- [ ] `scene16` · obra **5** «Compatibilidad Telepática» — Drive privado
- [ ] `scene18` · obra **2** «Aguja inversa» — o endereço é uma **pasta** (`/drive/folders/`), não um ficheiro
- [ ] `scene19` · obra **1** «Sin Colgar» — Drive privado
- [ ] `scene19` · obra **4** «El Castillo» — Drive privado
- [ ] `scene20` · obra **2** «Paseo la Pechina» — Drive privado
- [ ] `scene25` · obra **2** «Rock Skulls» — Drive privado

### 3.1 · Obra sem capa nenhuma — 1

- [ ] `scene23` · obra **2** «Stoned» — a capa que lá estava era `imgur.com/a/CYQ8tFk`, a **página de um
      álbum**, e foi tirada do dado (não há imagem para vir a ter). A obra tem site; falta a imagem.

## 4 · Sites que respondem mas **não podem ser embutidos** — 9 obras

A ficha mostra a obra num `<iframe>`. Estes recusam-se (`X-Frame-Options` ou `CSP frame-ancestors`), e a
obra abre numa caixa vazia. **Não é um link morto** — é um site que não deixa ser embutido.

- [ ] `scene1` · obra **0** «Entre Pétalas e Silhuetas» — Canva (`canva.link`), `X-Frame-Options: deny`
- [ ] `scene15` · obra **4** «Fuentes Brotantes» — pasta do Drive
- [ ] `scene17` · obra **2** «“Lo que nos estamos comiendo”» — pasta do Drive
- [ ] `scene17` · obra **3** «ENSAYOS DE UN CUERPO EXPANDIDO» — pasta do Drive
- [ ] `scene18` · obra **1** «Cuerpo colectivo» — pasta do Drive
- [ ] `scene18` · obra **4** «Bailando con el sol.... Dibujando poesía» — pasta do Drive
- [ ] `scene22` · obra **4** «Cortina» — Instagram, `X-Frame-Options: DENY`
- [ ] `scene23` · obra **2** «Stoned» — álbum do imgur, `X-Frame-Options: DENY`
- [ ] `scene23` · obra **6** «Despiezar al depredante, 2018» — **corrigível**: o endereço é
      `drive.google.com/open?id=<ID>`, que responde `SAMEORIGIN`; a forma do projecto (D62) é
      `https://drive.google.com/file/d/<ID>/preview`, que **não** manda `X-Frame-Options`. Testado.

## 5 · Sites que devolvem erro — 4 obras

- [ ] `scene8` · obra **3** «CONEXÕES...Entre livros!» — Canva, **HTTP 403**
- [ ] `scene18` · obra **2** «Aguja inversa» — Drive `/preview`, **HTTP 401** (privado)
- [ ] `scene19` · obra **1** «Sin Colgar» — Drive `/preview`, **HTTP 404** (já não existe)
- [ ] `scene20` · obra **2** «Paseo la Pechina» — Drive `/preview`, **HTTP 401** (privado)

**Total de obras distintas com algum problema: 18**, em 12 salas — `scene1`, `5`, `8`, `15`, `16`, `17`,
`18`, `19`, `20`, `22`, `23`, `25`.

## 6 · Retratos desactualizados — 131 ficheiros

Os retratos foram cozidos às **19:04**; as capas passaram a viver no projecto às **19:28**. Todos os
retratos mostram a sala como ela estava antes — nos casos em que as capas falhavam, com **painéis
escuros** (visto no `scene16-de-gate.jpg`).

- [ ] Recozer os retratos, **duas passagens** (~1,8 h a 4 em paralelo).
      **Só depois de §3 e §4 estarem fechados** — senão ficam desactualizados outra vez.
      `node tools/scene/retratos-em-vagas.mjs pares.json --vagas 4`

> Isto é consequência de §3, mas tem custo próprio: enquanto não for refeito, as janelas das portas
> mostram salas com painéis escuros, mesmo que as salas já estejam boas.

## 7 · Portais — sem problemas

Verificados entrada **e** saída nas 152 portas: 49 arestas do mapa ↔ 98 portas de sala + 27 no portão.
Cada saída tem chegada declarada no destino (L19); cada sala tem exactamente uma porta ao portão e 4–5
portas no total (L24/L25); todas as janelas têm retrato e recorte, e os ficheiros carregam no browser.
As 519 verificações de travessia (T1/T7/T11) passam: a porta atravessa-se, chega-se ao destino, a câmara
fica no ponto calculado e olha para dentro.

**Nada a fazer.** A única ressalva é visual e está em §6: a janela de uma porta mostra a sala de destino
— e enquanto os retratos forem de antes, mostra o que havia então.

---

## Como se confirma que ficou resolvido

```
node tools/scene/validate.mjs            # o dado: 0 erros, 0 avisos
node tools/artwork/links.mjs             # os links: só o que está mal
node tools/artwork/from-csv.mjs --check  # a folha das obras e o dado dizem o mesmo
node tools/scene/mapa.mjs --check        # a topologia
```

A camada do browser não tem comando próprio: é abrir `node tools/server/serve.mjs` e olhar. Nenhuma
bateria substitui a prova visual — foi ela que apanhou o rate limiting das capas, com o validador a
dizer zero.
