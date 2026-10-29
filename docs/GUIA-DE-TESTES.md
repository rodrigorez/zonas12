# Guia de testes — a ficha da obra (D62)

Guia objectivo para testar, **no telemóvel e no computador**, o que mudou na Fase 8: a ficha de cada
obra é agora **uma página só** (`obra.html?mundo=<slug>&id=<n>`), desenhada do dado, no desenho das
Zonas 11.

Cada teste diz **o que fazer**, **o que se espera** e **o que enviar** se falhar. Um teste que não dá
para fazer num aparelho está marcado — não é preciso forçar.

> **Para percorrer os blocos 2 a 6 pela ordem em que se fazem**, use o
> [ROTEIRO-DE-TESTE.md](ROTEIRO-DE-TESTE.md): tem a preparação, os passos numerados com o sinal de
> falha de cada um, a folha de registo e o que desfazer no fim. Este ficheiro continua a ser a
> referência de cada teste.

> **Estado do dado hoje (2026-10-28):** o `data/obras.tsv` tem as **44 obras** das oito salas com o
> texto, os créditos e os endereços do autor — a folha é a fonte da verdade (D67), e a única obra sem
> texto é a `scene5` **id 1** («A CASA»), que veio do autor com um ponto final. As capas vivem **todas**
> no Google Drive, servidas por `https://lh3.googleusercontent.com/d/<ID>`; as obras cujo conteúdo é uma
> página (Drive, YouTube, Vimeo, Heyzine ou blogue) têm essa página em `endereço da obra`, e as outras
> são obras de imagem.

---

## 0. Endereços

Publicado (`https://rodrigorez.github.io/zonas12`), que é o mesmo que o telemóvel vê. **Cada linha é o
endereço completo** — é só abrir:

| O que | Endereço completo |
| --- | --- |
| Portão (entrada da exposição, **7 portais e nenhuma obra**) | `https://rodrigorez.github.io/zonas12/` |
| Cidade 360º (7 obras) | `https://rodrigorez.github.io/zonas12/scene1/` |
| Praia (7 obras) | `https://rodrigorez.github.io/zonas12/scene2/` |
| Céu 360º (3 obras, sem câmara) | `https://rodrigorez.github.io/zonas12/scene3/` |
| Noite 360º (6 obras) | `https://rodrigorez.github.io/zonas12/scene4/` |
| Ondas 360º (5 obras) | `https://rodrigorez.github.io/zonas12/scene5/` |
| Becos 360º (5 obras) | `https://rodrigorez.github.io/zonas12/scene6/` |
| Presenças 360º (6 obras) | `https://rodrigorez.github.io/zonas12/scene7/` |
| Imersões 360º (5 obras) | `https://rodrigorez.github.io/zonas12/scene8/` |
| **Ficha de exemplo — completa** (título, autor, sinopse) | `https://rodrigorez.github.io/zonas12/obra.html?mundo=exemplo-ficha&id=0` |
| Ficha de exemplo — **só com título** | `https://rodrigorez.github.io/zonas12/obra.html?mundo=exemplo-ficha&id=1` |
| Ficha de exemplo — **vídeo** | `https://rodrigorez.github.io/zonas12/obra.html?mundo=exemplo-ficha&id=2` |
| Ficha de exemplo — **com site** (YouTube) | `https://rodrigorez.github.io/zonas12/obra.html?mundo=exemplo-ficha&id=3` |
| Ficha de exemplo — **em inglês** | `https://rodrigorez.github.io/zonas12/obra.html?mundo=exemplo-ficha&id=0&lang=en` |
| **Sala** de exemplo (para clicar nas obras) | `https://rodrigorez.github.io/zonas12/?scene=exemplo-ficha` |
| Ficha **de produção** | `https://rodrigorez.github.io/zonas12/obra.html?mundo=scene1&id=0` |

As obras de produção, por mundo: `scene1` → `id=0…6`, `scene2` → `id=0…6`, `scene3` → `id=0…2`,
`scene4` → `id=0…5`, `scene5` → `id=0…4`, `scene6` → `id=0…4`, `scene7` → `id=0…5`,
`scene8` → `id=0…4`. O endereço é sempre `obra.html?mundo=<mundo>&id=<id>`; mudar o
`id` muda a obra, e `&lang=en` é a língua. Todos os `id` das oito salas têm o texto e os créditos do
autor: nenhuma ficha mostra texto provisório.

Sonda de campo (números no ecrã): junta `?sonda=1` a qualquer endereço de sala, por exemplo
`https://rodrigorez.github.io/zonas12/scene1/?sonda=1`.

Ensaio A/B do fundo (**R14**, ~2 minutos por aparelho, bloco 7):
`https://rodrigorez.github.io/zonas12/scene1/?ensaio=1`.

Local (só no computador), com `node tools/server/serve.mjs` a correr: os mesmos caminhos em
`http://127.0.0.1:8123`.

---

## 1. A ficha — computador

| # | O que fazer | O que se espera |
| --- | --- | --- |
| 1.1 | Abrir `/obra.html?mundo=exemplo-ficha&id=0` | Fundo preto; cartão com **«Exemplo da ficha»**; botão laranja **«← Voltar para a exposição»**; a imagem da cidade num cartão; **«Exemplo · cidade ao entardecer»**; **«Autor de exemplo»**; a sinopse em texto justificado (2 linhas, com o recuo da 1.ª linha); outro botão laranja no fundo. O nome do separador é **«Exemplo · cidade ao entardecer — Exemplo da ficha»** |
| 1.2 | Abrir `…&id=1` (só título) | Só três cartões: exposição, imagem, **título**. **Não** há cartão de autor nem de sinopse vazios |
| 1.3 | Abrir a ficha **do vídeo** `https://rodrigorez.github.io/zonas12/obra.html?mundo=scene1&id=2` | Um leitor do YouTube embutido a tocar **sem som**, com o botão azul «Abrir o site da obra» por baixo. A capa vem do **YouTube** (derivada do endereço do vídeo) |
| 1.3b | Ficha **de uma imagem** com a capa bloqueada: DevTools → Network request blocking = `panoramas`, abrir `…/obra.html?mundo=scene1&id=3` | Em vez de um buraco, a imagem padrão **«Capa indisponível · avisar o administrador da galeria»** (D65) |
| 1.4 | Abrir `…&id=3` (com site) | Um vídeo do YouTube a tocar **sem som**, no lugar do cartão; abaixo, o botão azul **«Abrir o site da obra»**. Se aparecer **«Erro de configuração do player de vídeo / Erro 153»**, é falha: envia o endereço e o print |
| 1.5 | Clicar **«Abrir o site da obra»** | Abre o YouTube **numa aba nova**; a ficha fica onde estava |
| 1.6 | Abrir `…&id=0&lang=en` | Interface **e** conteúdo em inglês: «Ficha example», «Back to the exhibition», «Example · city at dusk» |
| 1.7 | Abrir `/obra.html?mundo=exemplo-ficha&id=99` | Uma linha: **«Esta obra não faz parte desta exposição.»** e **um** botão «Voltar». Nada de obra desenhada, nada de imagem quebrada |
| 1.7b | Alargar a janela ao máximo (ou ecrã 2560) e olhar para a imagem | A imagem ocupa **quase toda a largura do cartão** (≈ 90%), não um selo pequeno ao centro |
| 1.8 | Clicar «Voltar» (no teste 1.1) | Cai em **`/?scene=exemplo-ficha`** — a sala de exemplo — e a sala arranca (botão «Ativar exposição» ou já a andar) |
| 1.9 | Abrir `https://rodrigorez.github.io/zonas12/obra.html?mundo=scene1&id=0` e clicar «Voltar» | Cai em **`/scene1/`**, com a cidade construída. Se o browser já tinha permissão de câmara, arranca sozinho; senão mostra «Ativar exposição» (**isso não é defeito**) |
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
| 2.5 | Abrir a ficha de produção `https://rodrigorez.github.io/zonas12/obra.html?mundo=scene4&id=0` | Nome **«Harmonização Doméstica»**, autora **Juliana Garzillo**, o descritivo do autor, e a **capa** da obra — não uma página de erro do browser nem um espaço vazio |
| 2.6 | Tocar em «Voltar» | Volta à sala certa, sem 404 |

## 3. A ficha ligada à exposição

| # | O que fazer | O que se espera |
| --- | --- | --- |
| 3.1 | Telemóvel: abrir `/`, aceitar a câmara, entrar numa sala (atravessar um portal) | A sala construída, com o D-pad de setas ao fundo. O portão tem **três** portas (cidade, praia e noite). Entrar na **Cidade** e ver 7 obras |
| 3.2 | Apontar a cruz do centro a uma obra e **tocar no ecrã** | Abre a **ficha** dessa obra (muda de página). **Não** abre ao fim de 1,5 s só por olhar (isso era um defeito antigo, já corrigido) |
| 3.3 | Computador: o mesmo, com o rato (pousar em cima da obra e clicar) | Igual: abre a ficha |
| 3.4 | Na ficha, tocar em «Voltar» | Volta à sala onde estava |
| 3.5 | Abrir `/?scene=exemplo-ficha` e olhar para a sala | **Quatro** obras em fila: aurora, torre, vídeo (fundo escuro) e a **quarta é a praia — a obra com site**. Se a quarta não aparecer, é falha (era um defeito: obras `site` não eram desenhadas) |
| 3.6 | Tocar na obra da praia (a quarta) | Abre `…id=3`, com o YouTube |
| 3.7 | **Voltar ao ponto (D63):** numa sala, caminhar com o D-pad (ou o teclado) até ficar **de frente para uma obra, longe do início**, e tocar nela | Abre a ficha |
| 3.8 | Clicar «Voltar para a exposição» | Volta **ao sítio onde estava**, com o mesmo olhar — **não** ao início da sala. Se voltar ao princípio, é falha |
| 3.9 | Repetir 3.7/3.8 numa segunda obra, noutro canto da sala | O mesmo: cada obra devolve o visitante ao ponto do clique |
| 3.10 | Fechar o separador, abrir `/scene1/?volta=1` de novo | Começa no **início** da sala (o ponto é de um só regresso; não fica colado) |

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

## 5. A folha das obras (só no computador)

| # | O que fazer | O que se espera |
| --- | --- | --- |
| 5.1 | Preencher **uma** linha de `data/obras.tsv` (ex.: a obra `0` de `scene1`: `nome da obra`, `nomeAutores`, `Descritivo`) | — |
| 5.2 | `node tools/artwork/from-csv.mjs --check` | Lista do que **mudaria** (`obra 0: título`, `autor`, `descritivo`) e **não escreve nada** |
| 5.3 | `node tools/artwork/from-csv.mjs` | Escreve `data/worlds/scene1.json`; a ficha `/obra.html?mundo=scene1&id=0` passa a mostrar o teu texto |
| 5.4 | Pôr no `endereço da imagem` um caminho que não existe | O importador **recusa** («a capa … não existe no projeto») e não escreve nenhum ficheiro |
| 5.5 | Pôr no `endereço da obra` um endereço sem `http` | Recusa («não é um endereço http(s)») |
| 5.6 | Desfazer: `git checkout -- data/worlds/scene1.json data/obras.tsv` | O dado e a folha voltam ao que estavam |

## 6. O editor (só no computador, com o servidor local)

| # | O que fazer | O que se espera |
| --- | --- | --- |
| 6.1 | `node tools/server/serve.mjs` e abrir `/editor.html?world=scene1` | Abre com a cena construída e o relatório `Erros: 0 · Avisos: 0` |
| 6.2 | Painel **Mundo** | Existe o campo **«Google Analytics desta sala (ID)»**, vazio, com a nota «Vazio enquanto a propriedade não existir» |
| 6.3 | Escrever `TESTE` nesse campo | Aparece o problema da lei **L21** (o ID tem de ser `G-XXXXXXX`) |
| 6.4 | Trocar para `G-TESTE123` e gravar | O problema desaparece; o JSON passa a ter `world.analytics.id` |
| 6.5 | Painel **Obra**, botão «abrir a ficha» | Abre `obra.html?mundo=scene1&id=<n>` numa aba nova |

---

## 7. O ensaio A/B do shader (R14) — os três aparelhos

Este bloco não é sobre a ficha: é o número que falta para fechar o **R14** (o fundo shader). A página
mede **sozinha** os dois lados do par — o shader e a imagem — e mostra um bloco só, para copiar.

### 7.0 Antes de começar (a preparação é metade do resultado)

O mesmo endereço tem de ser medido nos três aparelhos: **telemóvel fraco** (o PowerVR), **telemóvel do
Adreno 630** e **computador**. Tudo o resto tem de ser igual, senão compara-se o aparelho e não o shader:

| O quê | Porquê |
| --- | --- |
| A **mesma sala**: `scene1` (Cidade) | o custo do shader depende do que está na sala |
| O aparelho **frio** — fora da carga, sem outras apps abertas | um telemóvel quente baixa a cadência do ecrã e estraga o segundo lado |
| **Ecrã não pode apagar**: pôr o tempo de ecrã em 5 min ou mais | o ecrã a apagar pausa a fase (aparece `pausada`) |
| **Modo de poupança de energia desligado** | baixa a cadência do ecrã |
| **Não trocar de aba** e não mexer no telemóvel | a fase pausa e o ensaio demora mais |
| Mesma **orientação** (vertical) nos dois telemóveis | a resolução medida é a do ecrã |
| Mesmo estado de **`prefers-reduced-motion`** nos três | com «reduzir movimento» ligado o shader fica estático e o A/B compararia outra coisa |
| Abrir numa **aba anónima** (privada) | garante que não está a correr um `ensaio.js` velho em cache |

A aba anónima é o atalho que evita o problema mais chato: depois de uma publicação nova, o browser do
telemóvel pode continuar a usar o JavaScript antigo. Em anónima não há cache, e a sessão do ensaio (a
ligação entre as duas fases) continua a funcionar dentro da mesma aba.

### O ensaio, passo a passo (2 minutos por aparelho)

| # | O que fazer | O que se espera |
| --- | --- | --- |
| 7.1 | Abrir no **computador** — e antes do ensaio grande, fazer o curto de **7.6** para confirmar que o build é o novo: `https://rodrigorez.github.io/zonas12/scene1/?ensaio=1` | Um painel preto no canto: **«ensaio · fase 1/2 (shader) · a aquecer · 55 s»** a descer de segundo a segundo (e depois **«a medir»**). **Não tocar** na página e **não trocar de aba** | 
| 7.2 | Esperar (~2 minutos, sem trocar de aba nem bloquear o ecrã) | A página **recarrega sozinha** (a fase 2, imagem) e o contador volta a descer. Depois aparece o bloco com **«--- fase 1 · shader ---»** e **«--- fase 2 · imagem ---»** |
| 7.3 | Ler a última parte do bloco | **«--- comparação (imagem vs shader) ---»** com `quadros … /s → … /s`, `pior quadro … ms → … ms` e `janelas … s e … s` |
| 7.4 | Tocar em **Copiar** | O botão diz **«copiado»** e o bloco fica no teclado. Colá-lo aqui é o resultado do teste |
| 7.5 | Repetir **7.1–7.4** no **telemóvel fraco** e no **telemóvel do Adreno 630** | O bloco traz o modelo da **GPU** e o ecrã de cada um — é isso que distingue os três registos |
| 7.6 | Em qualquer aparelho, abrir `…/scene1/?ensaio=1&segundos=10&aquecimento=3` | O mesmo, em ~26 s: serve para ver que o protocolo funciona quando não se quer esperar 2 minutos |
| 7.7 | No painel, ler a linha **`pedido`** antes de tudo | Tem de dizer **`45 s de medida · 10 s de aquecimento`**. Se disser `0 s`, ou aparecer `null/s` / `NaN/s` nos quadros, o build está velho: recarregar com `Ctrl+Shift+R` (ou limpar a cache no telemóvel) |
| 7.8 | No fim, ler a linha **`janela`** de cada fase | **`45,0x s (desvio +0,0x s)`** — a janela que passou, não a que se pediu. As duas têm de dar o mesmo (a comparação mostra `janelas 45.00 s e 45.00 s`); se trouxer **`pausada … s`**, a aba esteve escondida nesse tempo e a medida foi pausada (é de propósito) |

O que **conta** no resultado: os **quadros/s** de cada lado e o **pior quadro**, medidos na **mesma
janela** (a linha `janelas` é o que prova que o par é comparável). Num aparelho rápido os dois lados
empatam (o browser desenha ao ritmo do ecrã) — isso **não** é falha, é o resultado desse aparelho; o
número que discrimina passa a ser o pior quadro.

### 7.11 O shader paga-se em nitidez ou em quadros? (o teste que decide)

O autor foi claro sobre o que **não** se faz: «deixaria de ver o shader». O shader é o fundo da obra, e
tirá-lo aos telemóveis antigos mudaria a exposição exactamente para quem mais precisa dela. O que se testa
é a alternativa: **baixar a nitidez em vez de baixar os quadros**, mantendo o shader.

O instrumento tem um parâmetro para isso: `?pr=<n>` **prende o pixelRatio** — o adaptador nasce com o mínimo
igual ao máximo, a escada não tem para onde ir, e o resto do ensaio fica igual.

| # | O que fazer | O que se espera |
| --- | --- | --- |
| 7.11.1 | No **telemóvel fraco**: `…/scene1/?ensaio=1&pr=1` | O bloco diz `pixelRatio 1 (min 1 · max 1)` na fase 1 e `eventos 0` — a escada não mexeu |
| 7.11.2 | Logo a seguir: `…/scene1/?ensaio=1&pr=2.63` (o dpr nativo daquele ecrã) | O mesmo, com `pixelRatio 2.63` |
| 7.11.3 | E outra vez: `…/scene1/?ensaio=1&pr=1` | Serve de controlo: se esta corrida der o mesmo que a 7.11.1, o aparelho não aqueceu entre as duas |
| 7.11.4 | Comparar os **quadros/s da fase 1** entre as duas primeiras corridas | A **fase 2 (imagem) é o controlo térmico**: se ela variar muito entre corridas, o aparelho aqueceu e a comparação não vale — repetir noutro momento |

Como ler o resultado:

- se com `pr=1` os quadros da fase 1 **subirem para perto dos da imagem** → o shader paga-se em nitidez, e a
  resposta é **manter o shader e deixar a escada descer mais depressa** (mais um degrau de política, não uma
  troca de fundo);
- se mesmo com `pr=1` o shader continuar **15% abaixo** → o custo é o fragment por pixel, a resolução não o
  resolve, e a resposta passa a ser **uma variante mais leve do shader** (menos oitavas, menos passos) para
  os aparelhos fracos — a mesma linguagem visual, mais barata;
- em qualquer dos casos, **trocar para a imagem deixa de estar em cima da mesa**: fica só como a rede de
  segurança do R18, que já existe e só dispara quando nem a cadência de recurso se sustenta.
### 7.9 O que se envia, por aparelho

Ao fim de cada aparelho, tocar em **Copiar** e mandar o bloco para si mesmo (WhatsApp para «mensagens a
mim», nota, e-mail) — ou fotografar o ecrã, que serve. São precisos os **três** blocos; três blocos do
mesmo aparelho não fecham o R14, porque o que a pendência pede é o par medido em três hardwares.

Se o **Copiar** não funcionar, a primeira linha do painel (`A/B 45.0 → 48.2 quadros/s · Android 10 ·
Chrome 144`) já identifica o aparelho e os dois números que interessam; o resto lê-se no ecrã.

### 7.10 Se alguma coisa não bater

| O que se vê | O que é | O que fazer |
| --- | --- | --- |
| `pedido 0 s`, ou `null/s` / `NaN/s` nos quadros | build velho em cache | abrir em **aba anónima** ou `Ctrl+Shift+R` no computador |
| O painel demora a aparecer (10–30 s num telemóvel fraco) | está à espera de a cena ficar pronta (`sceneReady`) | esperar; o contador só começa quando há cena para medir |
| `pausada 3.4 s` na linha `janela` | o ecrã apagou ou trocou de aba | o número **continua válido** (a janela foi reposta); se passar de ~5 s, repetir esse aparelho |
| `janelas 45.00 s e 30.00 s` + «o par não é comparável» | uma fase foi interrompida a meio | repetir **Repetir** no mesmo aparelho |
| Os dois lados empatados (~165 → ~165 no computador) | o ecrã manda, não o shader | **não é falha**: é o resultado do aparelho; o que conta passa a ser o **pior quadro** |
| A página recarrega e volta à fase 1 sozinha | a sessão do separador foi perdida (aba fechada, anónima trocada) | repetir numa aba só, sem fechar |

---

## Como reportar

Para cada falha, envia três coisas:

1. **o endereço** (copia da barra do browser, completo);
2. **o que esperavas** e **o que aconteceu** (ou um print);
3. no telemóvel, o **painel da sonda**: `?sonda=1`, tocar em **copiar** e colar aqui. É o que diz o
   `pixelRatio`, os `quadros` e os `atrasos` sem adivinhar.

## O que já se sabe, e não é defeito

- o **portão** tem **3 portais e nenhuma obra** — é a entrada, e as obras estão dentro das salas;
- as obras de produção têm **título, créditos e sinopse do autor** (nenhuma é provisória); as que têm
  `site` embutem uma página (Drive, YouTube ou Vimeo) — é o teste de uma obra cujo conteúdo é uma
  página. A **capa** é a que a folha dá, e se não vier aparece a imagem padrão de aviso;
- **não há medição a correr**: as propriedades GA4 ainda não existem, e sem ID a página não carrega
  script nenhum (é de propósito);
- a ficha é **desenhada pelo browser**: sem JavaScript não mostra a obra (é o preço de ser um ficheiro
  só, a troca que foi pedida);
- **um site que não existe** não dá erro ao browser (o iframe dispara `load` com a página de erro dele em
  ~100 ms). A ficha mede o tempo e trata-o como falha: fica a **capa** com o botão «Abrir o site». É o
  que se vê com um endereço que não exista;
- num telemóvel **com** giroscópio, o olhar volta governado pelo sensor — o **ponto** (posição) é
  restaurado sempre, mas a direcção do olhar pode ser corrigida pelo aparelho no instante seguinte;
- no site publicado o **editor não grava** (gravar precisa do servidor local, que valida e escreve no
  disco).
