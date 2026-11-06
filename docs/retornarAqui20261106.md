# Retomar aqui — a prova no browser das 28 páginas (zonas12)

Passagem interrompida a pedido em **2026-11-06 ~16h**. Nada foi commitado; nada do projecto foi alterado
excepto `docs/PENDENCIAS.md` (a §8, que é o que a tarefa pede).

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
   `transition`. Registar o número de cada uma no §8.1.
2. **Fechar a §8.5-h** (três medições em isolamento + o teste do `git stash`):

   ```powershell
   node tools/regression/seam.mjs gate 0        # 1,48 na varredura — repete sozinho?
   node tools/regression/seam.mjs scene15 3     # 2,79 na varredura — repete sozinho?
   node tools/regression/motion.mjs             # o controlo «sala de ensaio»: 0 navegações?
   git stash push -- assets/previews ; node tools/regression/seam.mjs gate 0 ; git stash pop
   ```

   (a árvore de trabalho tem 51 pares de retratos refeitos e **não commitados**; a hipótese é que o
   `seam` esteja a medir esses retratos novos, ou a falta deles)

3. **Decidir com o autor** o YouTube (b) e o Vimeo (c), e aplicar a correção `[M]` do `links.mjs`.
4. **Aplicar a correção de uma linha (a)** + guarda no `capa.mjs` (nenhum id repetido em `<a-assets>`; a
   malha de cada obra com `naturalWidth > 0`).
5. (Opcional) repetir a ficha do Imgur com sessão/cookies de terceiros.

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
- 150 obras: **142** malhas com imagem (141 capas + 1 imagem padrão em `scene23`·2), **8** pretas —
  exactamente as 8 da §3.
- **152/152** janelas, todas em modo `shader`, todas com retrato e recorte.
- **0** erros e **0** avisos de consola nas 28 páginas.
- Fichas: 11/11 falham como previsto (Canva 200+`ERR_BLOCKED_BY_RESPONSE` / 403; Drive 403; `open?id=` →
  `/view` 403; 401 / 404 / 401). Amostras: p5.js e Instagram funcionam; YouTube (1 de 2) e Vimeo não;
  Imgur carrega o iframe e não desenha a imagem.
