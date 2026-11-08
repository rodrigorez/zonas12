# Retomar aqui — a prova no browser das 28 páginas (zonas12)

Passagem interrompida a pedido em **2026-11-06 ~16h**; retomada e continuada em **2026-11-08**.

> **Actualização de 2026-11-08 — leia primeiro.** A correção `[M]` dos 8 painéis pretos (§8.5-a) **está
> feita**, na branch **`v0.0.50`** (saída da `bkp20261106`): uma linha em `js/scene/scene-builder.js` e
> três guardas novas no `tools/regression/capa.mjs`. Medido depois: **150/150** malhas com imagem (era
> 142/150), 152/152 janelas, 0 erros; `capa.mjs` **12/12** e `twelve-tests` **211/211**. A causa do
> vermelho da `--full` também ficou apurada — **é a §6**, não código partido (ver §8.5-h do PENDENCIAS).
> O que continua por fazer está em baixo, actualizado.
>
> **Publicado.** O `main` estava parado em **2026-11-04** — o site só tinha 13 salas (`scene14`…`scene27`
> davam 404). Foi avançado em **fast-forward** para a `v0.0.50` (`23d8279`) e o Pages reconstruiu. Medido
> no ar: **150/150** obras com imagem, **152/152** janelas, **0** erros (PENDENCIAS §8.9).



## O que já está feito (e onde está escrito)

| Camada | Estado |
|---|---|
| `node tools/regression/all.mjs` | **9 de 9**, exit **0**, 1 995,2 s. Números por bateria em `docs/PENDENCIAS.md` §8.1 |
| `node tools/regression/all.mjs --full` | **interrompido**: 22 de 31 baterias completaram, **2 vermelhas** (`motion` 43/44, `seam` 384/402). §8.5-h |
| As 28 páginas | medidas uma a uma; tabela completa em §8.2. **142/150** malhas com imagem · **152/152** janelas · **0** erros de consola |
| As fichas | 16 abertas (as 11 previstas + 5 amostras de plataforma); tabela em §8.4. As 11 falham como previsto; **YouTube e Vimeo falham onde deviam funcionar** |
| Documentação | `docs/PENDENCIAS.md`: parágrafo final de «Como se confirma» substituído + **§8 completa** (§8.1 a §8.7) |

### Os achados (todos com a correção escrita no §8.5)

- **a) [M]** `js/scene/scene-builder.js:309` — o `<img>` da capa resolvida usa o **mesmo id** do asset do
  catálogo (`capa-<id>`), e a malha fica com o do catálogo → **8 painéis pretos**. Correção: uma linha,
  `'capa-resolvida-' + artwork.id`. É a única que fecha um defeito visível sem depender do autor.
- **b) [A]** `scene1`·1 «Golens Transgênicos» — o YouTube recusa a incorporação (200 + «Vídeo
  indisponível»).
- **c) [A]** `scene4`·0 «Harmonização Doméstica» — `player.vimeo.com/…` responde **401**. E **[M]**:
  `links.mjs` verifica o endereço da obra, não `platformEmbed(site).src` — é cego a este caso.
- **d) [M]** a ficha marca 7 dos 11 sites recusados como `carregado` e esconde a capa (`obra.css`).
  Correção: `frameable: false` em `platform-embed.js`.
- **e)** não há obras em OpenProcessing nem em Shadertoy (a amostra de 7 plataformas é, na realidade, de 5).
- **f)** o álbum do Imgur carrega o iframe e não mostra a imagem em 8 s (por decidir).
- **h) [T]** `all.mjs --full` não está verde: `seam` com 17 portas acima de 0,50 (0,53 a 2,79) + 1
  fotograma escuro; `motion` perde o controlo («0 navegações»).

## O que falta

1. **Acabar o `--full`** — faltam 9 baterias: `ordem-da-janela` (D80, estava a começar), `emenda` (D82),
   `orientation`, `camera-arrival`, `image-bridge`, `labels-artworks`, `labels-doors`, `start-button`,
   `transition`. Registar o número de cada uma no §8.1. (Não é preciso repetir o núcleo: as 9 do núcleo
   correm-se pelo `all.mjs` sem `--full` e já deram 9/9.)
2. ~~**Fechar a §8.5-h**~~ — **a causa está apurada em 2026-11-08**: das 17 portas, **0** têm retrato do
   lote refeito e **17** têm retrato antigo → é a §6 (retratos por refazer), não regressão. A 18.ª falha
   («fotograma escuro») é o `seam` a julgar o portão, que é `kind: "camera"` — correção `[M]` no
   `seam.mjs`. **Falta só o `motion`**, o único vermelho sem causa (o controlo «a atravessar o plano, a
   porta leva-o» dá 0 navegações, o que torna as duas verificações vizinhas vacuamente verdes).
3. **Decidir com o autor** o YouTube (b) e o Vimeo (c), e aplicar a correção `[M]` do `links.mjs`
   (verificar `platformEmbed(site).src`, não o endereço da obra).
4. ~~**Aplicar a correção de uma linha (a)**~~ — **feito na `v0.0.50`** (2026-11-08), com as três guardas
   no `capa.mjs` e provada a falhar com o defeito de volta (10/12).
5. (Opcional) repetir a ficha do Imgur com sessão/cookies de terceiros.
6. **Os 75 pares de retratos da §6** — duas passagens de `retratos-em-vagas.mjs`. É o que faz cair as 17
   portas da `seam`.

## Os instrumentos (fora do repositório)

Em `%TEMP%\zonas-medicao\` — com uma cópia no estado desta sessão, em
`c:\Users\rodri\.copilot\session-state\77cb000e-3178-4ec0-bde0-9c78fb92d10e\files\prova-browser\scripts\`:

| Ficheiro | Para quê |
|---|---|
| `medir-paginas.mjs` | as 28 páginas: capas (na malha), janelas, consola. `node medir-paginas.mjs [slug]` |
| `medir-fichas.mjs` | as fichas de `fichas-lista.json`: meio, iframe, capa, consola |
| `capturar.mjs` / `capturar-recorte.mjs` / `capturar-ficha.mjs` | screenshots (página, recorte ampliado, ficha com espera) |
| `sondar-obras.mjs` | o que cada malha desenha + screenshot com os rótulos (tecla D) |

Todas precisam de `$env:ZONAS_ROOT` (a raiz do projecto) e `$env:ZONAS_OUT` (a pasta de resultados).

## As provas visuais

Fora do repositório, no estado desta sessão:
`c:\Users\rodri\.copilot\session-state\77cb000e-3178-4ec0-bde0-9c78fb92d10e\files\prova-browser\` —
**14 imagens de página** (as 7 salas com problema + 6 recortes do centro + 1 com os rótulos das obras) e
**21 de ficha** (as 16 da tabela + 5 com espera maior), em `…\prova-browser\fichas\`.

## O que ficou medido, para não se repetir

- `cobertura(paginasDaExposicao()).ok` = **true** (28 salas, 0 fora, 0 ignorados).
- 150 obras: **142** malhas com imagem em 2026-11-06 e **150** depois da correção da `v0.0.50`
  (2026-11-08); as **8** que estavam pretas eram exatamente as 8 da §3.
- **152/152** janelas, todas em modo `shader`, todas com retrato e recorte.
- **0** erros e **0** avisos de consola nas 28 páginas.
- Fichas: 11/11 falham como previsto (Canva 200+`ERR_BLOCKED_BY_RESPONSE` / 403; Drive 403; `open?id=` →
  `/view` 403; 401 / 404 / 401). Amostras: p5.js e Instagram funcionam; YouTube (1 de 2) e Vimeo não;
  Imgur carrega o iframe e não desenha a imagem.
- `seam` 384/402 e `motion` 43/44 — a `seam` é a §6, o `motion` está por explicar.

## Estado do git

| | |
|---|---|
| `bkp20261106` | instantâneo de 2026-11-06 (`c782b89`). **Não commitar mais nela** |
| `v0.0.50` | a correção dos 8 painéis + esta documentação (`23d8279`), no `origin` |
| `main` | avançado em fast-forward até à `v0.0.50` — **é o que o GitHub Pages publica** |
| `v0.0.49` | a versão anterior a tudo isto (`85b97ec`) |
