# Guia de testes — a ficha da obra (D62)

Guia objectivo para testar, **no telemóvel e no computador**, o que mudou na Fase 8: a ficha de cada
obra é agora **uma página só** (`obra.html?mundo=<slug>&id=<n>`), desenhada do dado, no desenho das
Zonas 11.

Cada teste diz **o que fazer**, **o que se espera** e **o que enviar** se falhar. Um teste que não dá
para fazer num aparelho está marcado — não é preciso forçar.

> **Estado do dado hoje:** as obras de produção ainda não têm título, autor nem sinopse, por isso a
> ficha delas mostra **o id do asset** (ex.: `galeriaFoto1`) como nome. Isso **não** é defeito: é o
> `data/obras.csv` por preencher. Para ver a ficha completa há o mundo de **exemplo**.

---

## 0. Endereços

Publicado (`https://rodrigorez.github.io/zonas12`), que é o mesmo que o telemóvel vê:

| O que | Caminho a juntar ao endereço publicado |
| --- | --- |
| Portão (entrada da exposição) | `/` |
| Cidade 360º | `/scene1/` |
| Praia | `/scene2/` |
| Céu 360º | `/scene3/` |
| **Ficha de exemplo — completa** | `/obra.html?mundo=exemplo-ficha&id=0` |
| Ficha de exemplo — só título | `/obra.html?mundo=exemplo-ficha&id=1` |
| Ficha de exemplo — vídeo | `/obra.html?mundo=exemplo-ficha&id=2` |
| Ficha de exemplo — **com site** | `/obra.html?mundo=exemplo-ficha&id=3` |
| Ficha de exemplo — em inglês | `/obra.html?mundo=exemplo-ficha&id=0&lang=en` |
| Sala de exemplo (para clicar nas obras) | `/?scene=exemplo-ficha` |
| Ficha **de produção** (sem metadados) | `/obra.html?mundo=scene1&id=0` (obras: `scene1` 0–4, `scene2` 5–7, `scene3` 8–9) |
| Sonda de campo (números no ecrã) | junta `?sonda=1` a qualquer endereço de sala |

Local (só no computador), com `node tools/server/serve.mjs` a correr: os mesmos caminhos em
`http://127.0.0.1:8123`.

---

## 1. A ficha — computador

| # | O que fazer | O que se espera |
| --- | --- | --- |
| 1.1 | Abrir `/obra.html?mundo=exemplo-ficha&id=0` | Fundo preto; cartão com **«Exemplo da ficha»**; botão laranja **«← Voltar para a exposição»**; a imagem da cidade num cartão; **«Exemplo · cidade ao entardecer»**; **«Autor de exemplo»**; a sinopse em texto justificado (2 linhas, com o recuo da 1.ª linha); outro botão laranja no fundo. O nome do separador é **«Exemplo · cidade ao entardecer — Exemplo da ficha»** |
| 1.2 | Abrir `…&id=1` (só título) | Só três cartões: exposição, imagem, **título**. **Não** há cartão de autor nem de sinopse vazios |
| 1.3 | Abrir `…&id=2` (vídeo) | Um leitor de vídeo com barra de tempo (dá para dar play). Nada de imagem de capa |
| 1.4 | Abrir `…&id=3` (com site) | Um vídeo do YouTube a tocar **sem som**, no lugar do cartão; abaixo, o botão azul **«Abrir o site da obra»**. Se aparecer **«Erro de configuração do player de vídeo / Erro 153»**, é falha: envia o endereço e o print |
| 1.5 | Clicar **«Abrir o site da obra»** | Abre o YouTube **numa aba nova**; a ficha fica onde estava |
| 1.6 | Abrir `…&id=0&lang=en` | Interface **e** conteúdo em inglês: «Ficha example», «Back to the exhibition», «Example · city at dusk» |
| 1.7 | Abrir `/obra.html?mundo=exemplo-ficha&id=99` | Uma linha: **«Esta obra não faz parte desta exposição.»** e **um** botão «Voltar». Nada de obra desenhada, nada de imagem quebrada |
| 1.8 | Clicar «Voltar» (no teste 1.1) | Cai em **`/?scene=exemplo-ficha`** — a sala de exemplo — e a sala arranca (botão «Ativar exposição» ou já a andar) |
| 1.9 | Abrir `/obra.html?mundo=scene1&id=0` e clicar «Voltar» | Cai em **`/scene1/`**, com a cidade construída. Se o browser já tinha permissão de câmara, arranca sozinho; senão mostra «Ativar exposição» (**isso não é defeito**) |
| 1.10 | DevTools → **Network → Network request blocking**, acrescentar o padrão `data/worlds`, recarregar a ficha | Aparece **«Esta obra não faz parte desta exposição.»** com **um** botão «Voltar» (e não um ecrã em branco). Na consola pode haver um aviso — a página não pode ficar vazia |
| 1.11 | Trocar o padrão bloqueado por `i18n`, recarregar | Aparece o **aviso escrito na própria página**: «Esta obra não faz parte desta exposição, ou a página não a conseguiu carregar. Volte ao início: exposição.» — sem cartões e com o link para a raiz |
| 1.12 | Limpar os padrões bloqueados e recarregar | A ficha volta ao normal (teste 1.1) |

## 2. A ficha — telemóvel (Android + Chrome)

| # | O que fazer | O que se espera |
| --- | --- | --- |
| 2.1 | Abrir `/obra.html?mundo=exemplo-ficha&id=0` | Tudo encaixa em retrato, **sem rolar na horizontal**; a imagem ocupa a largura do cartão; os dois botões laranja têm altura de dedo (≥ 48 px); o texto da sinopse legível sem zoom |
| 2.2 | Abrir `…&id=3` | O YouTube toca **sem som** (mudo forçado); o botão azul existe e abre o site numa aba nova |
| 2.3 | Girar o telemóvel para horizontal | A ficha continua legível (a coluna alarga até 800 px, não estica a 100%) |
| 2.4 | Abrir `…&id=0&lang=en` | Inglês em todo o lado, como no computador |
| 2.5 | Abrir a ficha de produção `/obra.html?mundo=scene2&id=5` | Nome da obra = **`skycloud`** (o id do asset) — é o estado actual do dado |
| 2.6 | Tocar em «Voltar» | Volta à sala certa, sem 404 |

## 3. A ficha ligada à exposição

| # | O que fazer | O que se espera |
| --- | --- | --- |
| 3.1 | Telemóvel: abrir `/`, aceitar a câmara, entrar numa sala (atravessar um portal) | A sala construída, com o D-pad de setas ao fundo. Entrar na **Cidade** e ver 5 obras |
| 3.2 | Apontar a cruz do centro a uma obra e **tocar no ecrã** | Abre a **ficha** dessa obra (muda de página). **Não** abre ao fim de 1,5 s só por olhar (isso era um defeito antigo, já corrigido) |
| 3.3 | Computador: o mesmo, com o rato (pousar em cima da obra e clicar) | Igual: abre a ficha |
| 3.4 | Na ficha, tocar em «Voltar» | Volta à sala onde estava |
| 3.5 | Abrir `/?scene=exemplo-ficha` e olhar para a sala | **Quatro** obras em fila: aurora, torre, vídeo (fundo escuro) e a **quarta é a praia — a obra com site**. Se a quarta não aparecer, é falha (era um defeito: obras `site` não eram desenhadas) |
| 3.6 | Tocar na obra da praia (a quarta) | Abre `…id=3`, com o YouTube |

## 4. Regressão rápida (o que já funcionava e não pode partir)

| # | O que fazer | O que se espera |
| --- | --- | --- |
| 4.1 | Telemóvel: `/` e escolher um portal | A câmara é pedida **uma vez**; com «Ativar exposição» a cena arranca e o D-pad aparece. No computador o D-pad **não** aparece |
| 4.2 | Atravessar um portal | Do outro lado vê-se **a sala de destino** — não a sala de onde se veio (D55) |
| 4.3 | Abrir `/scene1/?sonda=1` e olhar para o painel | `fundo` diz `shader · …`, `modo animating`, `atualizações ≈ 20/s`, `quadros ≥ 30`. Depois de atravessar um portal aparece uma linha **`travessia`** com `de`, `porta`, `para` e `encosto: true` |
| 4.4 | Abrir `/scene1/?sonda=1&shader=0` | `fundo image` e `modo sem política (imagem)`: o fundo passa a ser a fotografia, sem animação |
| 4.5 | Computador: carregar em **`D`** numa sala | Aparece o nome de cada obra (`#0 · … · Cidade 360º · page`) e de cada porta. Carregar outra vez esconde |
| 4.6 | Abrir `/scene2/?lang=en` | Interface em inglês (o nome da sala também) |
| 4.7 | Telemóvel fraco: ficar 2 minutos numa sala com `?sonda=1` | `quadros` mantém-se acima de ~25; `pixelRatio` pode subir e descer uma vez e depois estabiliza (a política procura o tecto do aparelho). Quedas repetidas com `quadros < 20` são para reportar |

## 5. O CSV (só no computador)

| # | O que fazer | O que se espera |
| --- | --- | --- |
| 5.1 | Preencher **uma** linha de `data/obras.csv` (ex.: `scene1,0`, título, autor, sinopse) | — |
| 5.2 | `node tools/artwork/from-csv.mjs --check` | Lista do que **mudaria** (`obra 0: título`, `autor`, `sinopse`) e **não escreve nada** |
| 5.3 | `node tools/artwork/from-csv.mjs` | Escreve `data/worlds/scene1.json`; a ficha `/obra.html?mundo=scene1&id=0` passa a mostrar o teu texto |
| 5.4 | Pôr na `capa` um caminho que não existe | O importador **recusa** («a capa … não existe no projeto») e não escreve nenhum ficheiro |
| 5.5 | Pôr em `site` um endereço sem `http` | Recusa («não é um endereço http(s)») |
| 5.6 | Desfazer: `git checkout -- data/worlds/scene1.json` | O dado volta ao que estava |

## 6. O editor (só no computador, com o servidor local)

| # | O que fazer | O que se espera |
| --- | --- | --- |
| 6.1 | `node tools/server/serve.mjs` e abrir `/editor.html?world=scene1` | Abre com a cena construída e o relatório `Erros: 0 · Avisos: 0` |
| 6.2 | Painel **Mundo** | Existe o campo **«Google Analytics desta sala (ID)»**, vazio, com a nota «Vazio enquanto a propriedade não existir» |
| 6.3 | Escrever `TESTE` nesse campo | Aparece o problema da lei **L21** (o ID tem de ser `G-XXXXXXX`) |
| 6.4 | Trocar para `G-TESTE123` e gravar | O problema desaparece; o JSON passa a ter `world.analytics.id` |
| 6.5 | Painel **Obra**, botão «abrir a ficha» | Abre `obra.html?mundo=scene1&id=<n>` numa aba nova |

---

## Como reportar

Para cada falha, envia três coisas:

1. **o endereço** (copia da barra do browser, completo);
2. **o que esperavas** e **o que aconteceu** (ou um print);
3. no telemóvel, o **painel da sonda**: `?sonda=1`, tocar em **copiar** e colar aqui. É o que diz o
   `pixelRatio`, os `quadros` e os `atrasos` sem adivinhar.

## O que já se sabe, e não é defeito

- as obras de produção mostram o **id do asset** como nome — falta preencher o CSV;
- **não há medição a correr**: as propriedades GA4 ainda não existem, e sem ID a página não carrega
  script nenhum (é de propósito);
- a ficha é **desenhada pelo browser**: sem JavaScript não mostra a obra (é o preço de ser um ficheiro
  só, a troca que foi pedida);
- no site publicado o **editor não grava** (gravar precisa do servidor local, que valida e escreve no
  disco).
