# Projeto Galeria AR

## Descrição

Este projeto é uma galeria imersiva de realidade aumentada/virtual utilizando A-Frame. Ele permite criar experiências interativas onde os usuários podem explorar ambientes 360º e interagir com obras de arte virtuais através de portais estêncil.

## Estrutura do Projeto

````markdown
zonas12/
├── index.html          ponto de entrada: a página (a cena vem de data/scene.json)
├── README.md           documentação principal (fica sempre na raiz)
├── css/
│   └── style.css       estilos da página, HUD, modal e D-pad
├── js/
│   ├── app.js          arranque: carrega e valida a cena, constrói, e a ponte da interface
│   ├── core/           núcleo: estado, registos, stencil, eventos, limites
│   ├── modules/        dimensão, obra, portal e câmara (Fase 2), com as fábricas da Fase 3
│   └── scene/          a cena em dados: schema, validação e construtor (Fase 3)
├── data/
│   ├── scene.json          a exposição, no formato v2
│   └── scene-example.json  a mesma cena, como fixture (?scene=example)
├── i18n/
│   └── pt.json         textos da interface (5 chaves; nada os lê ainda — Fase 4)
├── docs/
│   └── ROADMAP.md      plano de desenvolvimento (módulos + página de edição)
├── assets/
│   └── images/         panoramas 360º, fotos e vídeo usados na cena
├── tools/
│   ├── scene/               validador dos ficheiros de cena (corre a mesma validação que o browser)
│   ├── migration/           o conversor HTML→JSON da Fase 0, com guarda: é o registo da migração
│   └── regression/          varredura de poses T2/T3 (corre na consola do browser)
├── .harness/           fora do repositório (está no .gitignore)
│   ├── dev/            ferramentas retiradas da raiz (não são precisas para o app)
│   │   ├── package.json, package-lock.json   dependências npm (A-Frame vem do CDN)
│   │   ├── node_modules/
│   │   ├── favicon.ico                       vazio, sem uso
│   │   └── vscode-config/settings.json       configuração do editor
│   ├── imagenTeste/    capturas de ecrã usadas para diagnosticar problemas
│   └── skills/         harness de skills para IA — índice em .agent/skills_index.md (regra 5)
└── .gitignore
````

## Regras de Organização do Projeto

### 1. Estrutura de Pastas

- A raiz tem só o que é preciso para o projeto funcionar: `index.html`, `css/`, `js/`,
  `data/`, `i18n/`, `assets/`, `README.md` e `.gitignore`.
- Documentação de planeamento (roadmap, decisões) fica em `docs/`; ferramentas de
  construção (o validador da cena, o conversor e a varredura de regressão) em `tools/`.
- A cena da exposição vive em `data/scene.json`; o `index.html` não tem entidades de cena.
  Os textos da interface ficam em `i18n/` (hoje só o `pt.json`).
- Todos os assets (imagens, vídeos) ficam em `assets/images/`.
- Código JavaScript em arquivos separados dentro de `js/`.
- Código CSS em arquivos separados dentro de `css/`.
- Tudo o que **não** é essencial para o projeto funcionar (ferramentas de
  desenvolvimento, versões antigas, capturas de ecrã, planos) vai para `.harness/`, que
  está no `.gitignore` e por isso não entra no repositório.

### 2. Arquivos HTML

- `index.html` é o único arquivo do projeto.
- Versões antigas ou alternativas devem ser movidas para `.harness/`.
- Arquivos em `.harness/` são mantidos apenas para referência histórica.

### 3. Documentação

- `README.md`, na raiz, contém a documentação principal: arquitetura, atributos, limites,
  requisitos técnicos e o estado atual do código.
- O plano de desenvolvimento (roadmap, decisões em curso) fica em `docs/ROADMAP.md`.
- Documentação de componentes novos deve ser acrescentada ao `README.md`.

### 4. Regras para Humanos e IA

#### Para Humanos

- Mantenha todos os novos assets na estrutura `assets/images/`
- Utilize `index.html` como ponto de entrada principal
- Mantenha a raiz limpa: o que não é essencial vai para `.harness/`
- Arquivos em `.harness/` são históricos e não devem ser modificados
  **(exceção: `skills/` é material ativo e mantém-se atualizado — regra 5)**

#### Para IA

- SEMPRE use `assets/images/` para novos assets
- SEMPRE documente componentes novos no `README.md`
- NUNCA ponha na raiz nada que não seja preciso para o projeto funcionar
- NÃO modifique o material **histórico** de `.harness/` (`dev/`, `imagenTeste/`) — o
  `.harness/skills/` é ferramenta ativa e mantém-se atualizado (regra 5)
- SEMPRE procure skills primeiro no `.harness/skills/.agent/skills_index.md` e só depois no
  caminho que a linha indica (regra 5)
- SEMPRE atualize o `skills_index.md` na mesma alteração em que mexe no harness (regra 5)
- Ao mexer no render (stencil/profundidade), leia primeiro *Requisitos técnicos* e
  *Estado atual do código* neste README

### 5. Skills do projeto (busca obrigatória)

Sempre que forem pedidas **skills** — ou quando a tarefa pedir uma competência que o harness
já cobre — a busca é **obrigatoriamente nesta ordem**:

1. Abrir **`.harness/skills/.agent/skills_index.md`** — é o **índice único** e cobre todo o
   `.agent/` (rules, agents, skills, sub-skills, workflows, scripts, ferramentas, vendors,
   standalone e quarentena).
2. Identificar no índice a skill/agent/workflow pretendido (pelos *triggers*) e **ir ao
   caminho que a linha indica** (`SKILL.md`, `{name}.md`, `{cmd}.md`, `{name}.py`, ou o caminho
   completo em 📄 *Standalone files*).
3. **Só se o índice não tiver** o que se procura é que se faz busca livre (`grep`/`glob`).

O índice é a **única porta de entrada** do harness: não se faz `list_dir` às cegas nas
subpastas "para ver o que há". Para isso ser verdade, ele tem de estar **completo** — e são as
passes **2** e **3** da validação que garantem isso.

> **Divisão de responsabilidades — não repetir números.** O `skills_index.md` é o **único dono
> das quantidades**; o `HARNESS_LOG.md` guarda a história (quarentena, remoções, medições);
> este README tem a **regra**; o `docs/ROADMAP.md` tem o **porquê** (D15). Se um número mudar,
> muda-se **num sítio só**.
>
> **Língua — uma regra só (D10).** No índice, **prosa em português** e **identificadores em
> inglês**: nomes de skills/agents/scripts, caminhos, comandos e as palavras-chave da coluna
> *Gatilhos* (são chaves de correspondência, não texto). Nenhuma célula mistura as duas — a
> regra está declarada no cabeçalho do `skills_index.md`.

#### Manter atualizado (obrigatório)

Quem acrescentar, remover, mover ou renomear **qualquer** item do harness tem de **atualizar
o índice na mesma alteração**. O índice e esta regra andam juntos — um índice a mentir é pior
do que não ter índice.

- Se a camada é nova, ganha **linha própria no `📍 Location Map`** — e **nenhum número** fica em
  nota de cabeçalho.
- O que sai de cena vai para o `HARNESS_LOG.md`, **com o motivo** — o registo não se apaga.
- Antes de dar a alteração por fechada, correr o script de validação — sai com **código 0** só
  quando as quatro passes estão verdes:

```powershell
powershell -File .harness/skills/.agent/scripts/validate_skills_index.ps1
```

| Passe | Pergunta | Tem de dar |
| :--- | :--- | :--- |
| **1 — direta** (`índice → disco`) | as entradas que tenho resolvem? | `missing=0` |
| **2 — quantidades** | algum número do `Location Map` mente? | `wrong=0` |
| **3 — inversa** (`disco → índice`) | ficou algo de fora do índice? | `unlisted=0` |
| **4 — frontmatter** (`agent → disco`) | alguma skill citada por um agent não existe? | `bad=0` |

> **Só a passe 1 não chega.** Ela pergunta *"as linhas que tenho resolvem?"* e, por construção,
> **nunca** encontra o que não está no índice — foi essa assimetria que deixou passar skills
> inteiras. A passe 2 existe porque este número mentiu três vezes; e apanhou uma mentira nova
> **minutos** depois de ela ser escrita.

> **E a passe 4 (2026-10-14, decisão D17).** As passes 1–3 olham todas **para dentro do
> índice**: só vêem o que o índice diz saber. Nada conferia o *frontmatter* de um agent contra o
> disco — um token a apontar para uma skill inexistente era invisível às três, e foi assim que
> passou o `refactoring-patterns` do `code-archaeologist`. A passe 4 percorre `agent → disco`, a
> direção que nenhuma das outras toma.

A mesma informação vive em `docs/ROADMAP.md` (§3, decisões **D15** e **D17**). Os três ficheiros andam juntos,
**sem se repetirem**: `README.md` (a regra) → `docs/ROADMAP.md` (o porquê) →
`skills_index.md` (o inventário, único dono dos números) + `HARNESS_LOG.md` (a história).

## Estado atual do código (v0.0.5)

Marcado pela branch `v0.0.5` e **publicado** em <https://rodrigorez.github.io/zonas12/> (o GitHub
Pages serve o `main`). É o estado depois da **Fase 3** do roadmap (a cena vem de dados), testado
pelo autor em 2026-10-15 nas **três** versões — local, a publicada e no telemóvel. A versão
anterior é a `v0.0.4` (o estado da Fase 2), marcada pela branch com o mesmo nome. Resumo do que
existe hoje: `index.html` (**82 linhas**),
`js/app.js` (**117**), `js/core/` (7 ficheiros, **207**), `js/modules/` (4 ficheiros, **825**),
`js/scene/` (**3 ficheiros**, 628), `css/style.css` (96), `data/scene.json` (a cena, **594
linhas**), `data/scene-example.json` (o fixture), `i18n/pt.json` e as ferramentas em `tools/`.

O `js/core/` é o **núcleo** (Fase 1 do roadmap): o estado da cena, os registos e as
regras de stencil — a única parte global, porque o stencil é um recurso de toda a cena.
Os **4 módulos** (Fase 2) vivem em `js/modules/`, e o `js/app.js` ficou com o arranque
(carrega e valida a cena, constrói, arranca o driver, e a ponte temporária para a interface):

| Módulo | O que governa | Entrada |
| --- | --- | --- |
| `camera.js` | A câmara-jogador (posição, D-pad, limites) e o erro de câmara; é o **único** ficheiro que sabe onde a câmara está — desde a Fase 3 recebe-a do construtor de cena, em vez de a procurar pelo nome | `playerCamera`, `createPlayerCamera`, `startSession`, `setupMobileControls`, `reportCameraError` |
| `artwork.js` | A obra: o material dimensional, o clique e o modal (foco preso, `inert`, Escape) | componentes `dimensional-material` e `open-artwork`; `createArtwork`/`removeArtwork`; `closeArtwork` |
| `dimension.js` | O fundo 360º de uma dimensão (imagem ou vídeo) | componente `dimension-panorama`; `createDimension`/`removeDimension` |
| `portal.js` | A porta: janela (máscara), moldura, caixa de colisão, travessia e caixa de debug — e o **driver de frame** da cena | componentes `stencil-portal` e `portal-driver`; `createPortal`/`removePortal`; `startFrameDriver` |

Cada módulo tem o seu `remove()`, para que criar e destruir conteúdo em ciclo (o que o
editor vai fazer) não deixe registos mortos nem memória agarrada — e desde a Fase 3 cada
módulo tem também a sua **fábrica**, que constrói uma entidade a partir do dado.

O **`js/scene/`** é onde a cena em dados vive, e tem só três ficheiros:

| Ficheiro | O que é |
| --- | --- |
| `schema.js` | A **forma do formato**: campos, tipos, enumerações, omissões e o catálogo de assets. Puro — não conhece o DOM nem o A-Frame |
| `validation.js` | A forma (lida do schema) e as **leis** que o dado sozinho prova: L1, L4, L5, L9 e L12. É o mesmo módulo que a consola da exposição corre ao arrancar, que `tools/scene/validate.mjs` corre na linha de comando e que o editor vai reutilizar |
| `scene-builder.js` | O **único** dos três que conhece o A-Frame: cria o `<a-assets>` (e **espera** que os ficheiros carreguem), a câmara, as dimensões, as obras e os portais, a partir do JSON |

A cena está em **`data/scene.json`** (formato **v2**, descrito no roadmap §6): um catálogo
`assets` onde cada caminho aparece **uma vez**, as dimensões e as obras a apontarem para ele pelo
nome, e o texto de conteúdo por língua. `?scene=example` carrega o `data/scene-example.json`.

### O que está implementado

| Área | Estado |
| --- | --- |
| Dimensões e portais com ID | 512 dimensões e 512 portais de organização; o ID está no dado (`"id"`) e, na cena construída, em `data-dimension`, `data-portal-id`, nas classes e nos nomes dos objetos 3D |
| Grafo de dimensões | Portais bidirecionais entre duas dimensões, com uma **dimensão ativa** global; a cena tem 4 dimensões e 8 portais |
| Travessia | Por **colisão com a caixa** do portal (`box`, `boxPosition`, `boxRotation`), no plano do quadro ou na face da caixa (`trigger`) — nunca por distância |
| Janelas | Uma por portal, com valor de stencil por **dimensão mostrada** (não por portal); portais que mostram o mesmo destino partilham o valor |
| Fundo 360º | `dimension-panorama` por dimensão (imagem ou vídeo), segue a câmara; a dimensão 0 é a câmara real (canvas transparente) |
| Conteúdo | As obras pertencem à dimensão (o campo `dimension` de cada obra, no JSON); o clique só abre na dimensão ativa |
| Molduras | Barra vermelha à volta do quadro, pertencente à dimensão onde o portal está; o bordo mantém-se fechado mesmo quando cruza a janela de outro portal |
| Modo debug | Tecla `D` mostra a caixa de colisão (sempre igual à usada na deteção); tecla `R` roda o portal |

### Modelo de render (ler antes de mexer)

1. `stencil: true` no `<a-scene>` e `sortObjects` ativo no renderer — **é ele que faz valer o
   `renderOrder`**. Quem o fixa é o A-Frame (não o atributo: `sortObjects` não está no schema do
   `renderer`); a linha de `js/app.js` confirma-o (lei **L6**, decisão **D16**).
2. Ordem de desenho: máscaras (1) → panoramas (2; **2.5** para os das janelas) → obras (3)
   → molduras (4) → caixa de debug (10).
3. A **máscara** de cada portal escreve o valor do stencil (`Replace`) **e profundidade** no
   plano da janela.
4. Quem pertence à **dimensão ativa** não tem teste de stencil: a profundidade decide — o
   que está atrás de uma janela fica tapado por ela, o que está à frente desenha-se por
   cima. Vale para o panorama, as obras, a moldura e a caixa de debug.
5. Quem pertence a uma **dimensão vista por uma janela** usa `Equal` com o valor dela e
   `depthTest: false` (o mundo do outro lado da janela não conta com a profundidade dela).
6. Uma dimensão **sem janela** usa `Never` e não se desenha.
7. O raio do panorama de uma dimensão tem de ser maior do que a distância a qualquer
   portal (`radius: 500` em `data/scene.json`); sem isso o fundo aparece dentro da janela.

### Verificado nesta versão (medido no browser)

Medido a 2026-10-15, com a cena **construída de dados** — é a verificação final da Fase 3 (o B7 de
§9 do roadmap):

- **8/8** travessias — medidas a andar, passo de 0,1 m: cada portal faz **uma só** travessia, para
  a dimensão certa, sem ping-pong (cobre o T1 e o T7)
- Moldura: **0** poses com o bordo cortado (de **84**) e **0** falhas no contorno (**21 752**
  amostras, 420 controlos) — pela varredura automática (`tools/regression/pose-sweep.mjs`);
  antes da correção do stencil eram 110 poses cortadas em 360. O número de amostras varia com o
  tamanho da janela; as falhas é que têm de ser zero
- **1** ouvinte de `keydown` na cena, na carga **e** depois de criar e destruir **20** portais em
  ciclo (pelas fábricas dos módulos), com o registo a voltar às **8** portas e **10** ouvintes no
  `document` antes e **10** depois (T9)
- Janela do hub: alfa **255** dentro e **0** fora dela (T4) · **0** px de moldura de trás dentro da
  janela da frente, com **6 768** px de controlo **fora** dela (T5, medido por diferença e com
  margem — é o controlo que prova que a medição não é vazia)
- Clique na obra abre só na dimensão ativa (T6)
- O D-pad anda **4,2 m** em 250 ms, com a velocidade vinda do dado (`cameras.player.speed`)
- Consola sem erros, sem avisos e sem pedidos falhados (T8)
- `?scene=example` carrega o fixture e dá a mesma cena e os mesmos números

### Limitações e decisões assumidas

- **255 dimensões distintas** visíveis ao mesmo tempo (8 bits de stencil); portais por
  dimensão não têm limite.
- Onde uma moldura cruza uma janela, a parte da espessura (0,2 m) que fica **atrás** do
  plano da janela é tapada por ela — a moldura aparece um pouco mais fina aí.
- Uma obra que esteja **à frente** de uma janela desenha-se por cima do conteúdo dela.
- O cursor do A-Frame não leva teste de stencil (é elemento de interface).
- A dimensão 0 não tem conteúdo 3D: dentro das janelas que a mostram vê-se a imagem real
  da câmara (o canvas é transparente).
- **O formato aceita mais do que a cena constrói.** Obras de `kind: "model"` ou `"text"` e fundos
  de dimensão `kind: "color"` **passam a validação** mas ainda não são construídos (uma obra sai
  sempre como painel com a textura do `asset`), e `interaction: "link"` abre o endereço **dentro
  do modal** em vez de navegar. São campos que existem para o editor (Fase 4) — pendência **R9**
  do roadmap.

## Mundos e portas de mundo — planeado, não implementado

> ⚠️ **Nada desta secção existe no código.** É planeamento aprovado em **2026-10-13**
> (decisão **D14**, registada em [docs/ROADMAP.md](docs/ROADMAP.md), §11). Fica aqui para o
> conceito não viver só no roadmap.

Um **mundo** é o que hoje é a cena inteira: um conjunto fechado de dimensões, com os seus
portais internos e o seu conteúdo. Passa a haver **um endereço por mundo** (`/praia/`) e um
**portão** — o mundo de entrada, na raiz, com a câmara/AR — com uma porta para cada sala.
Dentro de uma sala só se navega pelas dimensões dessa sala.

| Hoje | Planeado |
| --- | --- |
| Uma página, uma cena, quatro dimensões | Uma **pasta por mundo**, com o seu próprio JSON e o seu arranque `index.html` |
| O portal liga duas dimensões (`dimensionA`/`dimensionB`) | O portal passa a ter **dois eixos**: `window` (o que a janela mostra) e `action` (o que a travessia faz) |
| A travessia muda a dimensão ativa | A **porta de mundo** mostra um **retrato** do destino (imagem panorâmica, com paralaxe) e a travessia **navega para a URL** e recarrega a página |
| Técnica do stencil | **Igual dentro de cada sala** — as leis L1–L8 e os testes T1–T8 continuam a valer |

Como o isolamento é por endereço, **nada do outro mundo é lido** pela página de origem: só
atravessam o *slug* do destino, um parâmetro opcional `?from=<slug>` e a imagem do retrato.
O formato dos dados, as leis novas (L9–L18), os testes (T10–T12) e a fase de execução
(**Fase 3B**) estão em [docs/ROADMAP.md](docs/ROADMAP.md).

## Funcionalidades Principais

### 1. Dimensões e Portais (arquitetura modular)

O projeto é um **grafo de dimensões** ligadas por portais. Há dois tipos de objeto,
cada um com o seu **ID próprio**, e esse ID aparece em tudo o que lhe pertence:

| Objeto | IDs | Onde aparece o ID |
| --- | --- | --- |
| **Dimensão** | `0..511` | No dado (`"id": 7`) e, na cena construída, em `dimension: 7` (componente), `data-dimension`, classe `dimension-7` e nome dos objetos 3D (`dimension-7-panorama`, `dimension-7-artwork`) |
| **Portal** | `0..511` | No dado (`"id": 3`) e, na cena construída, em `id: 3` (componente), `data-portal-id`, classe `portal-3` e nome dos objetos 3D (`portal-3-mask`, `portal-3-frame-0`, `portal-3-debug-box`) |

**Cada portal é um módulo independente**: tem as suas duas dimensões, a sua caixa de
colisão, o seu `trigger`, a sua caixa de debug e a sua geometria. Não partilha estado
com os outros portais.

#### O estado: a dimensão ativa

Há uma só fonte de verdade — `window.portalAR.activeDimension` (`js/core/state.js`), a
dimensão onde o utilizador está. Todos os portais e todo o conteúdo leem daqui, por
isso vários portais nunca ficam em desacordo:

- **Dimensão ativa** (onde estás): o conteúdo dela é desenhado em todo o lado onde
  nenhuma janela escreveu.
- **Dimensão mostrada por uma janela**: o conteúdo dela só é desenhado dentro dessa janela.
- **Dimensões que não estão em jogo**: não são desenhadas.

#### O portal é a porta

Um portal liga **duas** dimensões (`dimensionA` e `dimensionB`), de forma **bidirecional**:

| Onde estás | O quadro mostra |
| --- | --- |
| `dimensionA` | `dimensionB` |
| `dimensionB` | `dimensionA` |

Atravessar o portal (pela caixa de colisão) muda a **dimensão ativa** para o outro lado.

O `ownedBy` (opcional) diz em que dimensão é que a porta fica. Sem ele, a porta
aparece em qualquer uma das duas. É isto que permite ter, por exemplo, **7 portas do
lado da dimensão 1 e 7 portas do lado da dimensão 2**: cada grupo só se vê na sua
dimensão.

#### Cenários que esta arquitetura permite

| Cenário | Como se escreve |
| --- | --- |
| Dimensão central que dá acesso a todas | Um portal por destino: `dimensionA: 0; dimensionB: N`, todos na dimensão central |
| 7 portais da dimensão 1 para a 2 | 7 portais `dimensionA: 1; dimensionB: 2; ownedBy: 1` |
| 7 portais da dimensão 2 para a 1 | 7 portais `dimensionA: 1; dimensionB: 2; ownedBy: 2` |
| **Vários portais no mesmo sítio para o mesmo destino** | N portais iguais com `ownedBy` da dimensão deles (ex.: 2 portais de 2 → 1) |
| **Uma dimensão com portais para destinos diferentes** | Ex.: `ownedBy: 2` com 2 portais `dimensionB: 1` e 1 portal `dimensionB: 3` |
| Atravessar para "qualquer" outra dimensão | Um portal entre as duas; atravessar em qualquer sentido |
| Vários portais a mostrar dimensões diferentes no mesmo ecrã | Cada **dimensão mostrada** recebe um valor de stencil próprio |

Exemplo — uma central (0) com dois destinos, e conteúdo nas dimensões:

```json
{
  "dimensions": [
    { "id": 1, "kind": "image", "asset": "cidade-360", "radius": 500 },
    { "id": 2, "kind": "image", "asset": "praia", "radius": 500 }
  ],
  "portals": [
    { "id": 0, "dimensionA": 0, "dimensionB": 1, "ownedBy": 0, "position": [-10, 0, -12] },
    { "id": 1, "dimensionA": 0, "dimensionB": 2, "ownedBy": 0, "position": [10, 0, -12] }
  ],
  "artworks": [
    { "id": 0, "dimension": 1, "kind": "image", "asset": "praia",
      "position": [0, 1.5, -30], "size": [4, 3, 0.1], "interaction": "modal" }
  ]
}
```

Os outros campos (`width`, `height`, `box`, `boxPosition`, `trigger`, `frame`) têm omissões — o
roadmap §6 tem o formato completo e `js/scene/schema.js` é a descrição que manda.

#### Cena atual (`data/scene.json`)

O `data/scene.json` monta **4 dimensões**. As dimensões 0, 1 e 2 formam um grafo completo (2
portais cada uma, um para cada uma das outras); a **dimensão 2 tem 3 portais** — dois para
a dimensão 1 e um para a dimensão 3 — e a dimensão 3 volta à 2.

| Dimensão | Conteúdo | Portais (id: liga para onde) |
| --- | --- | --- |
| **0** (realidade / hub) | Vê-se a câmara | `0 → 1`, `1 → 2` — em `x = ∓6`, `z = -8` |
| **1** (cidade 360º) | `#cidade-360` + 5 obras | `2 → 0`, `3 → 2` — em `x = ∓25`, `z = -45` |
| **2** (praia) | `#praia` + 3 obras | `4 → 1`, `5 → 1` e `6 → 3` — em `x = -25`, `x = 25` e `x = 0`, `z = -80` |
| **3** (céu 360º) | `#skycloud` + 2 obras | `7 → 2` — em `x = 0`, `z = -120` |

Cada portal tem `ownedBy` igual à sua dimensão, por isso dentro de uma dimensão só se
vêem os portais dela. As travessias são todas bidirecionais (o mesmo portal serve de ida
e de volta):

```
0 ⇄ 1 (portal 0)      0 ⇄ 2 (portal 1)
1 ⇄ 0 (portal 2)      1 ⇄ 2 (portal 3)
2 ⇄ 1 (portal 4)      2 ⇄ 1 (portal 5)      2 ⇄ 3 (portal 6)
3 ⇄ 2 (portal 7)
```

Os portais 4 e 5 (os dois que vão da dimensão 2 para a 1) são a prova de que **o valor de
stencil pertence à dimensão mostrada, não ao portal**: ambos escrevem o mesmo valor e
ambas as janelas mostram a dimensão 1 ao mesmo tempo, junto com a janela do portal 6 (que
mostra a dimensão 3). Na dimensão 2 há então 3 janelas no ecrã com 2 valores de stencil.

Como a dimensão 2 não tem portal direto para a 0 (é o que esta cena pede), o regresso ao
hub faz-se por `2 → 1 → 0` (portais 4 ou 5 e depois o portal 2).

As posições foram escolhidas para que o ponto onde se chega (o portal atravessado) nunca
caia dentro da caixa de outro portal — sem isso haveria trocas em cadeia ao chegar.

#### Atributos do portal

Estes são os **campos do dado** (`portals[]` em `data/scene.json`) e as suas omissões — que são,
ao mesmo tempo, as do componente (`js/modules/portal.js`); o conversor lê as do componente e
escreve-as no JSON, que é o que impede os dois de divergirem:

| Campo | Significado | Omissão |
| --- | --- | --- |
| `id` | ID do portal | (obrigatório) |
| `dimensionA`, `dimensionB` | As duas dimensões que a porta liga | (obrigatórios) |
| `ownedBy` | Dimensão onde a porta fica (`-1` = qualquer das duas) | (obrigatório) |
| `width`, `height` | Tamanho do quadro | (obrigatórios) |
| `box` | Tamanho X, Y, Z da caixa de colisão | (obrigatório) |
| `boxPosition` | Centro da caixa (espaço do portal) | `0 8 0` |
| `boxRotation` | Rotação da caixa, em graus | `0 0 0` |
| `trigger` | Onde a travessia dispara: `plane` (plano do quadro) ou `box` (face de entrada) | `plane` |
| `frame` | `color` e `thickness` da moldura | `#ff0000`, `0.3` |
| `position`, `rotation` | Onde a porta está e para onde olha | `0 0 0` |

A caixa é a **única** fonte da sua geometria: a caixa de debug usa exatamente os mesmos
valores (`box`, `boxPosition`, `boxRotation`), pelo que nunca pode divergir.

**Porquê `plane` por omissão:** a máscara só escreve o stencil quando está à frente da
câmara, ou seja, o quadro só é uma janela de um dos lados. A troca tem de acontecer no
plano do quadro, que é o plano central da caixa — é o único ponto em que a troca não se
nota. Com `trigger: box` fica-se ~0,55 m com a dimensão errada durante a travessia.

#### Conteúdo: pertence à dimensão, não ao portal

- Uma **dimensão** tem o seu fundo 360º: `kind` (`image`, `video`, `color` ou `camera`), `asset` (o
  nome no catálogo) e `radius`. O fundo de `kind: "video"` anima (`THREE.VideoTexture`), e
  `kind: "camera"` não tem entidade nenhuma: é a imagem real da câmara.
- Uma **obra** pertence a uma dimensão pelo campo `dimension` — é ela que decide o clique, e o
  `js/modules/artwork.js` é quem o consulta.

Assim, várias portas que mostram a mesma dimensão mostram **o mesmo mundo** (mesmo
panorama, mesmas obras).

#### Limites

- **512 dimensões** e **512 portais** (IDs de organização).
- **Portais por dimensão: os que quiser.** O valor de stencil é da **dimensão mostrada**,
  não do portal: dois portais da dimensão 2 que mostrem a dimensão 1 escrevem o mesmo
  valor e as duas janelas funcionam ao mesmo tempo (é o caso dos portais 4 e 5).
- **255 janelas ao mesmo tempo**: o stencil tem 8 bits e cada **dimensão diferente**
  visível ao mesmo tempo precisa de um valor. Se houver mais, a consola avisa e as
  restantes ficam sem janela (sem estragar as outras). O que conta para este limite é o
  número de dimensões mostradas em simultâneo, não o número de portais.
- Uma dimensão sem conteúdo 3D mostra a câmara (o canvas é transparente). É o caso da
  dimensão 0.

#### Requisitos técnicos (não remover, o portal deixa de funcionar)

- `renderer="...; stencil: true"` no `<a-scene>`: a partir do three r184 o buffer de
  stencil **não é criado por omissão**.
- `<script type="module" src="js/app.js">`: a entrada é um módulo ES (D1 do roadmap), por
  isso o projeto tem de ser servido por HTTP.
- `renderer.sortObjects` ativo (`ar-config`, em `js/app.js`): com `false` o three
  **ignora o `renderOrder`** e desenha pela ordem da árvore — o que só funciona por acaso
  com um portal. Com vários, as máscaras têm de ser desenhadas antes de todo o conteúdo.
  **Quem fixa o valor é o A-Frame** (1.8.0, `src/systems/renderer.js`, na inicialização e
  «seja qual for a configuração»); a linha do projeto confirma-o e fica — lei **L6**,
  decisão **D16**.
- Ordem de desenho (`renderOrder`): máscara (1) → panorama (2) → obras (3) → moldura (4).
  O conteúdo de uma dimensão vista por uma janela (panorama 2, obras 2.5) sai **antes**
  das obras da dimensão ativa (3), para as obras que estão à frente da janela poderem
  desenhar-se por cima do conteúdo dela.
- **As máscaras escrevem profundidade** (`depthWrite: true`, além do stencil). É isto que
  resolve duas coisas, sem código por frame:
  1. Quando duas janelas se sobrepõem no ecrã, ganha a do **portal da frente**: a máscara
     de trás falha o teste de profundidade e, com `stencilZFail: Keep`, não escreve
     stencil.
  2. Tudo o que pertence à **dimensão ativa** e está **atrás** de uma janela fica tapado
     por ela; o que está **à frente** desenha-se por cima. É o que mantém a moldura de um
     portal completa quando ela cruza a janela de outro portal (ou a sua própria) e a
     esconde quando o portal está claramente atrás.
- O stencil é limpo a 0 em cada frame: **0 = nenhuma janela aqui**, `1..255` = valor da
  janela que mostra essa dimensão.
- A máscara (`stencilFunc: Always`, `stencilZPass: Replace`) escreve o valor da dimensão
  que a janela mostra.
- **Cada material segue o papel da sua dimensão** (`applyStencilState`):
  - **dimensão ativa**: **sem teste de stencil** — quem manda é a profundidade (item
    anterior). Vale para o panorama, as obras, **a moldura do portal e a caixa de debug**.
  - **dimensão vista por uma janela**: `Equal` com o valor dessa janela e
    `depthTest: false` (o mundo da janela está "do outro lado" dela, a profundidade da
    máscara não conta para ele).
  - **dimensão sem janela**: `Never`, não desenha.
- **O raio do panorama de uma dimensão tem de ser maior do que a distância a qualquer
  portal** (`radius: 500` em `data/scene.json`): o fundo da dimensão ativa tem de estar sempre
  atrás do plano das janelas, senão apareceria dentro delas.
- `portal-driver` (no módulo do portal, ligado à cena no arranque) é o único que decide:
  percorre os portais a cada frame, cada um deteta a sua própria travessia e o núcleo
  atribui os valores de stencil.

#### Obras: clique só na dimensão onde estás

O estêncil esconde a obra, mas o raycaster do A-Frame continua a apanhá-la (não vê o
stencil nem `object3D.visible`). Por isso o `open-artwork` só abre se a dimensão da obra
for a **dimensão ativa**: vê-la pela janela não conta.

### Recursos Recentes

- **A Cena Vem de Dados** (Fase 3): a exposição (dimensões, obras, portais, câmara) vive em
  `data/scene.json`, não em entidades escritas à mão no `index.html` — que passou de 240 para
  **82 linhas** e deixou de ter cena nenhuma dentro
- **Catálogo de Assets**: cada caminho de ficheiro aparece **uma vez**, no catálogo `assets`, e
  as dimensões e as obras apontam para ele pelo nome (o modal deriva daí o seu endereço)
- **Texto por Língua no Dado**: os nomes das dimensões e as descrições dos assets são
  `{ "pt": "…", "en": "…" }` — acrescentar uma língua é acrescentar um campo
- **Validação da Cena**: o mesmo módulo (`js/scene/validation.js`) corre na consola ao arrancar,
  na linha de comando (`node tools/scene/validate.mjs`) e vai correr no editor (Fase 4)
- **`?scene=example`**: carrega o `data/scene-example.json`, para experimentar sem tocar na cena
  da exposição
- **Grafo de Dimensões**: portais bidirecionais entre duas dimensões (qualquer par), com
  uma dimensão ativa global — permite a central que dá acesso a todas
- **IDs em Tudo**: cada dimensão e cada portal tem um ID — no dado e, na cena construída, nos
  atributos, classes, `data-*` e nomes dos objetos 3D
- **Tracejo por Colisão com a Caixa**: sem debounce, sem cooldown e sem distância;
  calculada no espaço do portal, por isso funciona com portais deslocados, rodados e em
  movimento, e com muitos portais ao mesmo tempo
- **Portais Pertencem a uma Dimensão**: `ownedBy` separa os portais de cada lado
- **Conteúdo por Dimensão**: panorama (imagem ou vídeo) e obras pertencem à dimensão, por
  isso várias portas mostram o mesmo mundo
- **Obras só na Dimensão Ativa**: clicar numa obra doutra dimensão não abre o modal
- **Caixa de Debug Igual à Real**: a caixa de debug é desenhada com a mesma dimensão,
  posição e rotação da caixa de colisão
- **Sem Barreiras Invisíveis**: Removido sistema antigo de limites que causava colisões
  fantasmas

### 2. Controles Mobile

- Sistema de navegação por D-pad para dispositivos móveis
- Movimentação intuitiva com base na rotação da câmera

### 3. Modal Externo

- Abre conteúdo em iframe ao clicar nas "obras"
- Permite integração com conteúdos externos (vídeos, áudios, páginas web)

### 4. Limitação de Movimento

- Sistema de estados para controlar movimentação do usuário **(REMOVIDO)**
- Impede que o usuário saia do ambiente virtual **(REMOVIDO)**
- O componente `limite-movimento` e a configuração `CONFIG_NAVEGACAO` foram removidos (já não existem no `js/app.js`) **(REMOVIDO)**

**Nota**: O sistema antigo de limitação de movimento foi removido para evitar barreiras invisíveis que impediam a navegação fluida. O portal agora funciona com detecção 3D precisa sem restrições artificiais.

### 5. Feedback de Carregamento / Erro de Câmera

- Aviso em faixa no topo do ecrã, que **não cobre** a cena 3D (o portal mantém-se sempre visível)
- Mostra "Carregando..." ao iniciar e, se a câmera não estiver acessível, a mensagem de permissões

### 6. Controles do Portal

- Pressione a tecla **R** para girar o portal 180 graus (a janela continua a funcionar
  nos dois sentidos, porque a máscara é de face dupla)
- Pressione a tecla **D** para ativar/desativar o modo debug (mostra a caixa de colisão)
- A moldura vermelha marca a porta; dentro dela vê-se a dimensão do outro lado

### Funcionamento do Portal

Tudo é decidido por frame: `portal-driver` (`js/modules/portal.js`) percorre os portais para
que cada um detete a sua própria travessia e o núcleo (`js/core/stencil.js`) atribui os valores
de stencil e decide o que cada material desenha, a partir da colisão com a caixa e de
`state.activeDimension`:

- **Onde estás**: o conteúdo da tua dimensão desenha-se em todo o lado **excepto** onde uma
  janela está *à frente* (é a profundidade que decide, não o stencil).
- **O que a janela mostra**: o conteúdo da dimensão do outro lado desenha dentro do quadro
  (`Equal` com o valor daquela dimensão, sem contar com a profundidade da máscara).
- **Sem piscas**: a troca acontece no plano central da caixa, exatamente onde a máscara
  muda de lado, por isso não há frames com a dimensão errada (com `trigger: box` há,
  ver acima).
- **Vários portais**: cada janela que mostra uma dimensão diferente recebe um valor de
  stencil próprio, por isso portais com destinos diferentes coexistem no mesmo ecrã.

### 7. Modo Debug

Durante o desenvolvimento, você pode ativar o modo debug para visualizar a caixa de colisão do portal:

- A caixa de debug aparece como um wireframe azul semi-transparente (nome `portal-<id>-debug-box`)
- Tem sempre as mesmas dimensões X, Y e Z, posição e rotação que a caixa de colisão (`box`, `boxPosition` e `boxRotation`)
- Serve para ver exatamente onde a travessia dispara (é uma caixa por portal)
- Como o resto da geometria do portal, a caixa de debug é tapada pelas janelas que lhe
  ficam à frente, pela profundidade (não tem teste de stencil próprio)
- A consola só avisa se um ID de portal estiver fora do intervalo (`[portal] ID … out of range …`)

## Tecnologias Utilizadas

- **A-Frame 1.8.0**: Framework de realidade aumentada/virtual
- **HTML5/CSS3**: Estrutura e estilo da aplicação
- **JavaScript ES6+**: Lógica da aplicação e componentes personalizados
- **Three.js**: Biblioteca 3D integrada ao A-Frame

## Como Usar

### 1. Executar o Projeto

1. **Sirva a pasta por HTTP** — abrir o `index.html` com duplo clique **já não funciona**:
   a entrada é um módulo ES (`js/app.js`) e os módulos não carregam por `file://`. Na raiz
   do projeto, por exemplo: `python -m http.server 8123`, e abra
   `http://127.0.0.1:8123/index.html`
2. Clique no botão "ATIVAR EXPOSIÇÃO"
3. Permita o acesso à câmera quando solicitado (é a dimensão 0, a realidade)
4. Explore o ambiente utilizando o mouse (desktop) ou o D-pad (mobile)

Quem quiser experimentar sem mexer na cena da exposição pode abrir
`http://127.0.0.1:8123/index.html?scene=example`: carrega o `data/scene-example.json` (a mesma
cena, como ficheiro de ensaio).

### 2. Personalizar Conteúdo

- Modifique as imagens e vídeos na pasta `assets/`
- Atualize os caminhos no **catálogo `assets`** de `data/scene.json` — cada caminho aparece lá
  **uma vez**, e as dimensões e as obras apontam para ele pelo nome (D20)
- Acrescente dimensões, obras e portais às listas do mesmo ficheiro (o roadmap §6 tem o formato, e
  `js/scene/schema.js` é a descrição que manda)
- Valide antes de publicar: `node tools/scene/validate.mjs`

### 3. Correr a varredura de regressão (T2 e T3)

Com a cena aberta e carregada, cole na consola do browser:

```js
(await import('/tools/regression/pose-sweep.mjs')).runPoseSweep()
```

Passa por **84 poses** em frente de um portal isolado e responde a duas perguntas: alguma pose
mostra o **bordo da moldura cortado** (T2) e o **contorno da moldura fecha**, amostra a amostra
(T3)? Cada pose é medida por **diferença** entre dois renders (moldura visível e escondida), e
pontos dentro da abertura servem de **controlo**: se o controlo acusar diferença, o resultado é
inválido (avisou que os dois renders diferem por outra razão). Leva cerca de 1 segundo e devolve
`verdict.T2`, `verdict.T3` e `verdict.method`.

Para confirmar que o instrumento consegue mesmo falhar, há duas avarias injetadas de propósito:
`runPoseSweep({ fault: 'bar' })` (uma barra da moldura nunca é desenhada) e
`runPoseSweep({ fault: 'stencil' })` (o defeito da lei L3, a moldura levando teste de stencil).

## Melhorias Planejadas

- **A página de edição** (Fase 4 do roadmap): inserir, alterar e excluir por módulo, com validação,
  pré-visualização e importar/exportar — usando os **mesmos** módulos e o mesmo esquema
- **Mundos com endereço próprio e portas de mundo** (Fase 3B): um ficheiro por sala, e a porta de
  mundo a navegar com um retrato do destino
- Portais com movimento e rotação animados, definidos na cena
- Mais conteúdo por dimensão (vídeo 360º como fundo, por exemplo)
- Automatizar as restantes medições de §10 do roadmap — a moldura (T2 e T3) já é automática
  (`tools/regression/pose-sweep.mjs`); as travessias (T1, T7), o clique (T6) e as janelas
  (T4, T5) continuam a ser medidos à mão no browser

## Requisitos do Sistema

- Navegador moderno com suporte a WebXR
- Câmera (para dispositivos móveis)
- Conexão à internet (para carregar assets externos)

## Contribuição

Para contribuir com o projeto, siga estas etapas:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto é distribuído sob a licença MIT.
