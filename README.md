# Projeto Galeria AR

## Descrição

Este projeto é uma galeria imersiva de realidade aumentada/virtual utilizando A-Frame. Ele permite criar experiências interativas onde os usuários podem explorar ambientes 360º e interagir com obras de arte virtuais através de portais estêncil.

## Estrutura do Projeto

````markdown
zonas12/
├── index.html          o portão: o arranque da raiz (a cena vem de data/worlds/)
├── cidade/             sala: o mesmo index.html com <base href="../"> (Fase 3B, B7)
│   └── index.html
├── praia/
│   └── index.html
├── ceu/
│   └── index.html
├── README.md           documentação principal (fica sempre na raiz)
├── css/
│   └── style.css       estilos da página, HUD, modal e D-pad
├── js/
│   ├── app.js          arranque: carrega e valida a cena, constrói, e a ponte da interface
│   ├── core/           núcleo: estado, registos, stencil, eventos, limites
│   ├── modules/        dimensão, obra, portal e câmara (Fase 2), com as fábricas da Fase 3
│   └── scene/          a cena em dados: schema, validação e construtor (Fase 3)
├── data/
│   └── worlds/         uma cena por mundo (D24): gate, cidade, praia, ceu e o fixture `example`
│                       (o mundo sai do **endereço**: `/` é o portão, `/cidade/` é a cidade; o
│                       `?scene=<mundo>` continua a forçar um deles, para os testes)
├── i18n/
│   └── pt.json         textos da interface (5 chaves; nada os lê ainda — Fase 4)
├── docs/
│   └── ROADMAP.md      plano de desenvolvimento (módulos + página de edição)
├── assets/
│   ├── panoramas/      fundos 360º (2:1, normalizados no B5 da Fase 3B)
│   ├── artworks/       imagens das obras
│   ├── video/          o vídeo usado como obra
│   └── previews/       os retratos das portas de mundo (um por mundo de destino — D27)
├── tools/
│   ├── scene/               validador dos ficheiros de cena (corre a mesma validação que o browser,
│   │                        mais o grafo dos mundos e os arranques), o instrumento das leis
│   │                        (avarias injetadas, uma por lei) e o verificador dos arranques (D28)
│   ├── migration/           o conversor HTML→JSON da Fase 0 e a migração para o formato v3, ambos
│   │                        com guarda: são o registo das migrações
│   ├── assets/              normalização das imagens (2:1 e teto de 2048 px — lei L14)
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

- A raiz tem só o que é preciso para o projeto funcionar: `index.html`, as pastas dos mundos
  (`cidade/`, `praia/` e `ceu/`, cada uma com o seu `index.html` — Fase 3B), `css/`, `js/`,
  `data/`, `i18n/`, `assets/`, `README.md` e `.gitignore`.
- Documentação de planeamento (roadmap, decisões) fica em `docs/`; ferramentas de
  construção (o validador da cena, o conversor e a varredura de regressão) em `tools/`.
- A cena vive em `data/worlds/` — um ficheiro por mundo (D24) — e o `index.html` não tem entidades de cena.
  Os textos da interface ficam em `i18n/` (hoje só o `pt.json`).
- Todos os assets ficam em `assets/`, separados por tipo: `panoramas/` (fundos 360º), `artworks/`
  (imagens das obras), `video/` e `previews/` (os retratos das portas de mundo).
- Código JavaScript em arquivos separados dentro de `js/`.
- Código CSS em arquivos separados dentro de `css/`.
- Tudo o que **não** é essencial para o projeto funcionar (ferramentas de
  desenvolvimento, versões antigas, capturas de ecrã, planos) vai para `.harness/`, que
  está no `.gitignore` e por isso não entra no repositório.

### 2. Arquivos HTML

- O projeto tem **um** `index.html`, e um por mundo: a raiz (o portão) e as pastas `cidade/`,
  `praia/` e `ceu/` (Fase 3B, D28). Os quatro são o **mesmo ficheiro fora da linha do `<base>`**
  — a raiz aponta `href="./"` e as salas `href="../"` — e **não podem divergir**: quem edita um
  edita os quatro, e o verificador do B8 exige que sejam iguais fora dela.
- Um arranque novo segue a mesma regra: a pasta é o **slug do mundo** (`data/worlds/<slug>.json`) e
  o `<base>` é que distingue a raiz das salas.
- Versões antigas ou alternativas devem ser movidas para `.harness/`.
- Arquivos em `.harness/` são mantidos apenas para referência histórica.

### 3. Documentação

- `README.md`, na raiz, contém a documentação principal: arquitetura, atributos, limites,
  requisitos técnicos e o estado atual do código.
- O plano de desenvolvimento (roadmap, decisões em curso) fica em `docs/ROADMAP.md`.
- Documentação de componentes novos deve ser acrescentada ao `README.md`.

### 4. Regras para Humanos e IA

#### Para Humanos

- Mantenha todos os novos assets na estrutura `assets/{panoramas,artworks,video,previews}/`
- Utilize `index.html` como ponto de entrada principal
- Mantenha a raiz limpa: o que não é essencial vai para `.harness/`
- Arquivos em `.harness/` são históricos e não devem ser modificados
  **(exceção: `skills/` é material ativo e mantém-se atualizado — regra 5)**

#### Para IA

- SEMPRE use `assets/{panoramas,artworks,video,previews}/` para novos assets, com o nome em
  minúsculas e hífenes (`<mundo>-d<N>-<nome>.<ext>`, e `<destino>.jpg` nos retratos)
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

## Estado atual do código (v0.0.6)

Marcado pela branch `v0.0.6`. É o estado depois da **Fase 3B** do roadmap — os **mundos** e as
**portas de mundo** (D14), fechados bloco a bloco com o que cada um entregou e mediu em
[docs/ROADMAP.md](docs/ROADMAP.md) §9. Tudo o que está nesta secção foi medido a **2026-10-16** na
versão local (a bateria está em §9); **por testar pelo autor** nas outras duas — a publicada (o
GitHub Pages serve o `main`, em <https://rodrigorez.github.io/zonas12/>, e publicar é empurrar o
`main`) e no telemóvel, que é como as versões anteriores foram dadas por fechadas. A versão anterior
é a `v0.0.5` (o estado depois da Fase 3), marcada pela branch com o mesmo nome.

Resumo do que existe hoje: `index.html` (**85 linhas**) e as **3** salas com o **mesmo** ficheiro
(`cidade/`, `praia/`, `ceu/`, iguais fora da linha do `<base>` — D28), `js/app.js` (**139**),
`js/core/` (7 ficheiros, **219**), `js/modules/` (5 ficheiros, **1008**), `js/scene/`
(4 ficheiros, **1002**), `css/style.css` (96), **5** mundos em `data/worlds/` (o portão, as três
salas e o fixture, **1259 linhas** no total e **12** portas), `i18n/pt.json`, os **9** assets em
`assets/{panoramas,artworks,video,previews}` e as **8** ferramentas em `tools/` (**1994** linhas).

O `js/core/` é o **núcleo** (Fase 1 do roadmap): o estado da cena, os registos e as
regras de stencil — a única parte global, porque o stencil é um recurso de toda a cena.
Os **4 módulos** (Fase 2) vivem em `js/modules/`, e o `js/app.js` ficou com o arranque
(carrega e valida a cena, constrói, arranca o driver, e a ponte temporária para a interface):

| Módulo | O que governa | Entrada |
| --- | --- | --- |
| `camera.js` | A câmara-jogador (posição, D-pad, limites) e o erro de câmara; é o **único** ficheiro que sabe onde a câmara está — desde a Fase 3 recebe-a do construtor de cena, em vez de a procurar pelo nome | `playerCamera`, `createPlayerCamera`, `startSession`, `setupMobileControls`, `reportCameraError` |
| `artwork.js` | A obra: o material dimensional, o clique e o modal (foco preso, `inert`, Escape) | componentes `dimensional-material` e `open-artwork`; `createArtwork`/`removeArtwork`; `closeArtwork` |
| `dimension.js` | O fundo 360º de uma dimensão (imagem ou vídeo) | componente `dimension-panorama`; `createDimension`/`removeDimension` |
| `portal.js` | A porta: janela (máscara), moldura, caixa de colisão, travessia e caixa de debug — e o **driver de frame** da cena. Desde o B4 da Fase 3B a travessia e a janela são decididas pelos **dois eixos** (`window`/`action`) | componentes `stencil-portal` e `portal-driver`; `createPortal`/`removePortal`; `startFrameDriver` |
| `portal-kinds.js` | A **tabela dos dois eixos**, pura: o que cada `window` mostra e o que cada `action` faz, a matriz das combinações legais, a validação de uma porta e o endereço de um mundo. Corre também em `node` (é ela que o validador lê) | `WINDOW_KINDS`/`ACTION_KINDS`, `isLegalCombination`, `validateDoor`, `worldHref` e `ENTRY_WORLD` |

Cada módulo tem o seu `remove()`, para que criar e destruir conteúdo em ciclo (o que o
editor vai fazer) não deixe registos mortos nem memória agarrada — e desde a Fase 3 cada
módulo tem também a sua **fábrica**, que constrói uma entidade a partir do dado.

O **`js/scene/`** é onde a cena em dados vive, e tem **quatro** ficheiros:

| Ficheiro | O que é |
| --- | --- |
| `schema.js` | A **forma do formato** (v3): campos, tipos, enumerações, as regras dos dois eixos da porta e o catálogo de assets. Puro — não conhece o DOM nem o A-Frame |
| `validation.js` | A forma (lida do schema) e as **leis** que o dado sozinho prova: L1, L4, L5, L9, L10, L11, L12, L13, L14, L15, L16, L17, L18 e L19 (esta última sobre o **grafo** dos mundos, com o `missingArrivals`). É o mesmo módulo que a consola da exposição corre ao arrancar, que `tools/scene/validate.mjs` corre na linha de comando e que o editor vai reutilizar |
| `arrival.js` | Onde o visitante aparece ao chegar de outro mundo (**L16**): puro e partilhado, para o construtor e o validador não discordarem da geometria |
| `scene-builder.js` | O **único** dos três que conhece o A-Frame: cria o `<a-assets>` (e **espera** que os ficheiros carreguem), a câmara, as dimensões, as obras e os portais, a partir do JSON |

A cena está em **`data/worlds/<mundo>.json`** (formato **v3**, descrito no roadmap §6): um catálogo
`assets` onde cada caminho aparece **uma vez**, as dimensões e as obras a apontarem para ele pelo
nome, o texto de conteúdo por língua, o mundo a que o ficheiro pertence (`world.slug`) e a porta
com os **dois eixos** — `window` (o que a janela mostra, com o par de dimensões lá dentro) e
`action` (o que a travessia faz). `?scene=example` carrega o `data/worlds/example.json`.

### O que está implementado

| Área | Estado |
| --- | --- |
| Mundos e endereços | **Um ficheiro por mundo** em `data/worlds/` (D24) e um endereço por sala: a raiz é o portão e `/cidade/`, `/praia/` e `/ceu/` são as salas, todas servindo o **mesmo** `index.html` (D28). O mundo sai do caminho e o `?scene=<mundo>` força um, para os testes; o validador exige que a pasta seja o `world.slug` |
| Portas de mundo | A travessia de uma porta de mundo **navega** para o endereço do destino e o visitante aparece **atrás** da porta que lá se declara a chegada (`arrivalFrom`), na direcção em que vinha — o regresso é **um passo** (L16/L17/L19) |
| Dimensões e portais com ID | 512 dimensões e 512 portais de organização; o ID está no dado (`"id"`) e, na cena construída, em `data-dimension`, `data-portal-id`, nas classes e nos nomes dos objetos 3D |
| Grafo de dimensões | Portais bidirecionais entre duas dimensões, com uma **dimensão ativa** global; dentro de cada mundo é o que resta do grafo antigo, e o **grafo de mundos** é conferido pela linha de comando (alcançabilidade a partir do portão) |
| Travessia | Por **colisão com a caixa** do portal (`box`, `boxPosition`, `boxRotation`), no plano do quadro ou na face da caixa (`trigger`) — nunca por distância; o que ela *faz* vem do eixo `action` (ficar, navegar ou nada — D25) |
| Janelas | Uma por portal, com valor de stencil por **dimensão mostrada** (não por portal); portais que mostram o mesmo retrato partilham o valor e a dimensão derivada (D26) — é o que o **fixture** exercita, com duas portas de retrato |
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
   portal (`radius: 500` em `data/worlds/<mundo>.json`); sem isso o fundo aparece dentro da janela.

### Verificado nesta versão (medido no browser)

Medido a **2026-10-16**, com **a cache desligada** (medir com uma versão antiga em cache é medir o
código que já não existe — a armadilha que a Fase 3 deixou registada), nas **5** páginas: as quatro
salas e o fixture. É a verificação final da **Fase 3B** (bloco B9 de §9 do roadmap); os números
anteriores, da v0.0.5, ficam em §9.

- **T8/T9, em cada mundo**: **0** erros, **0** avisos e **0** pedidos falhados nas cinco páginas, e
  **1** ouvinte de `keydown` no `document` em cada (4 no `window`, do A-Frame)
- **T10** (o retrato), nas **8** portas de retrato: tingir a dimensão derivada muda os pixels
  **dentro** da janela e **nada** fora dela (0, em dois controlos). No **portão**, onde o fundo é a
  câmara, o alfa é **255 dentro** e **0 fora** — a métrica do T4
- **T11** (a chegada), nas **8** arestas do grafo de mundos: o visitante aparece **exactamente** no
  ponto que o `arrivalPoint` calcula a partir do dado; **0** navegações a andar 3 m para dentro da
  sala e **1** a voltar, com a URL de volta ao mundo de origem
- **T2/T3** (varredura de poses, no fixture — o mundo que tem duas dimensões): **84** poses (**84**
  avaliadas, 0 não avaliáveis), **0** com o bordo cortado, **0** falhas no contorno em **15 714**
  amostras, **420** controlos a **0**, método válido, 1,03 s — e as duas avarias injectadas
  continuam a ser detectadas (`bar`: 1 315 amostras falhadas; `stencil`: 4 567 de 4 568). O número
  de amostras varia com o tamanho da janela; as falhas é que têm de ser zero
- **T12** (o retrato na moldura): **16** poses (as 8 portas a 12 m e a 30 m) e em **todas** a mancha
  do retrato tingido ficou dentro do rectângulo esperado, com **0** pontos fora
- O **ciclo portão → sala → portão** fecha nas duas salas, com **1** navegação por porta
- No **telemóvel** (390×844): o botão de entrada responde, o D-pad fica visível e a **câmara real** é
  o fundo da dimensão 0 (a captura mostra a sala em que se está, com a porta emoldurada)
- A olho, uma captura por sala: a cidade mostra a porta **sem janela** (a do portão) ao lado do
  retrato da praia; a praia mostra os **dois retratos** a ladear a porta **sem janela** (a que
  voltou ao portão na D29); o céu mostra o retrato da praia
- O D-pad anda **4,2 m** em 250 ms, com a velocidade vinda do dado (`cameras.player.speed`) *(da v0.0.5)*
- Clique na obra abre só na dimensão ativa (T6) *(da v0.0.5)*
- **T5** (ordem de desenho) **não foi re-medido** na 3B: precisa do rig de dois portais, e a ordem de
  desenho não mudou na fase — os números (0 px da moldura de trás dentro da janela da frente, com
  **6 768** px de controlo) são os da v0.0.5

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

## Mundos e portas de mundo (Fase 3B, fechada em 2026-10-16)

> A fase correu **bloco a bloco** — de B0 (o plano) a B10 (esta documentação) — e cada bloco está em
> [docs/ROADMAP.md](docs/ROADMAP.md) §9 com o que entregou e **mediu**; as decisões que a fecharam
> (D24–D29) estão em §11. O `?scene=<mundo>` continua a existir para os testes, e as três salas têm
> endereço próprio. O marco é a branch `v0.0.6`.

Um **mundo** é um conjunto fechado de dimensões, com as suas portas e o seu conteúdo, e tem o seu
próprio ficheiro em `data/worlds/`. O **portão** é o mundo de entrada, com a câmara/AR, e tem uma
porta para cada sala. Dentro de uma sala só se navega pelas dimensões dessa sala.

| Antes (Fase 3) | Agora (Fase 3B) |
| --- | --- |
| Uma página, uma cena, quatro dimensões | **Uma cena por mundo**, com o seu ficheiro (`data/worlds/`) e o seu endereço: a raiz é o portão e `/cidade/`, `/praia/` e `/ceu/` são as salas — o **mesmo `index.html`**, com o `<base>` a apontar um nível acima |
| O portal ligava duas dimensões (`dimensionA`/`dimensionB`) | O portal tem **dois eixos**: `window` (o que a janela mostra: o par, um retrato ou nada) e `action` (o que a travessia faz: ficar, navegar ou nada) |
| A travessia mudava a dimensão ativa | A **porta de mundo** mostra um **retrato** do destino (uma dimensão derivada, com paralaxe porque a esfera não segue a câmara) e a travessia **navega** para a URL do outro mundo |
| Técnica do stencil | **Igual dentro de cada sala** — as leis L1–L8 e os testes T1–T9 continuam a valer, e a porta de mundo entra na mesma máquina (máscara, moldura, valor de stencil) |

Como o isolamento é por endereço, **nada do outro mundo é lido** pela página de origem: só
atravessam o *slug* do destino (na própria porta) e um parâmetro opcional `?from=<slug>`, que é o
que faz o visitante aparecer **atrás da porta inversa** — com o regresso a um passo.
`node tools/scene/validate.mjs` confere isso tudo do lado do dado: as leis dos mundos, o **grafo**
(todas as salas alcançáveis a partir do portão e **L19** — toda a porta tem uma chegada no destino,
que é o defeito que a praia teve até ao B7), e os quatro **arranques** (a pasta é o slug, o `<base>`
aponta para a raiz e os quatro são o mesmo ficheiro fora dessa linha — D28). O formato dos dados, as
leis (L9–L19), os testes (T10–T12) e o estado de cada bloco estão em
[docs/ROADMAP.md](docs/ROADMAP.md).

**O que falta na fase:** a documentação com o marco (**B10**).

**A divisão decidida (D24)** são **quatro mundos**: o portão na raiz (`gate`, com a câmara/AR) e as
salas `cidade`, `praia` e `ceu`, uma dimensão cada, com as **8 portas de hoje** a passarem a
navegar — seis com retrato e as duas que voltam para o portão sem janela (não há imagem do portão, e
um retrato emprestado mentiria). O formato **v3** (**D25**) tem os dois eixos na própria porta
(`window {kind, dimensionA, dimensionB, asset, radius}` e `action {kind, target}`); o retrato é uma
**dimensão derivada** na banda reservada da L15 (**D26**) — duas portas que mostrem o mesmo retrato
partilham 1 textura e 1 valor de stencil, e é o **fixture** que o exercita, com duas portas de
retrato; os assets estão divididos por tipo, com os retratos em `assets/previews/` (**D27**); e o
slug de cada mundo sai do próprio caminho, com os **4 arranques iguais fora da linha do `<base>`**
(**D28**, emendada no B7). A praia, que trazia duas portas iguais para a cidade, ficou com uma e
ganhou o regresso ao portão (**D29**). A tabela de correspondência da migração, os **11 blocos**
(B0–B10) e as metas medidas com o instrumento de cada uma estão na §9 do roadmap.

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

Um portal liga **duas** dimensões — o par vive dentro do eixo `window` da porta
(`"window": { "kind": "dimension-pair", "dimensionA": 0, "dimensionB": 1 }`) —, de forma
**bidirecional**:

| Onde estás | O quadro mostra |
| --- | --- |
| `window.dimensionA` | `window.dimensionB` |
| `window.dimensionB` | `window.dimensionA` |

Atravessar o portal (pela caixa de colisão) muda a **dimensão ativa** para o outro lado: é o que o
eixo `action` diz dele, com `enter-window` — "fica na dimensão que a janela mostra".

O `ownedBy` (opcional) diz em que dimensão é que a porta fica. Sem ele, a porta
aparece em qualquer uma das duas. É isto que permite ter, por exemplo, **7 portas do
lado da dimensão 1 e 7 portas do lado da dimensão 2**: cada grupo só se vê na sua
dimensão.

#### Cenários que esta arquitetura permite

| Cenário | Como se escreve |
| --- | --- |
| Dimensão central que dá acesso a todas | Um portal por destino: `window.dimensionA: 0; window.dimensionB: N`, todos na dimensão central |
| 7 portais da dimensão 1 para a 2 | 7 portais `window.dimensionA: 1; window.dimensionB: 2; ownedBy: 1` |
| 7 portais da dimensão 2 para a 1 | 7 portais `window.dimensionA: 1; window.dimensionB: 2; ownedBy: 2` |
| **Vários portais no mesmo sítio para o mesmo destino** | N portais iguais com `ownedBy` da dimensão deles (ex.: 2 portais de 2 → 1) |
| **Uma dimensão com portais para destinos diferentes** | Ex.: `ownedBy: 2` com 2 portais `window.dimensionB: 1` e 1 portal `window.dimensionB: 3` |
| Atravessar para "qualquer" outra dimensão | Um portal entre as duas; atravessar em qualquer sentido |
| Vários portais a mostrar dimensões diferentes no mesmo ecrã | Cada **dimensão mostrada** recebe um valor de stencil próprio |

Exemplo — uma central (0) com dois destinos, e conteúdo nas dimensões:

```json
{
  "version": 3,
  "world": { "slug": "gate", "name": { "pt": "Portão", "en": "Gate" } },
  "dimensions": [
    { "id": 1, "kind": "image", "asset": "cidade-360", "radius": 500 },
    { "id": 2, "kind": "image", "asset": "praia", "radius": 500 }
  ],
  "portals": [
    { "id": 0, "ownedBy": 0, "position": [-10, 0, -12],
      "window": { "kind": "dimension-pair", "dimensionA": 0, "dimensionB": 1 },
      "action": { "kind": "enter-window" } },
    { "id": 1, "ownedBy": 0, "position": [10, 0, -12],
      "window": { "kind": "dimension-pair", "dimensionA": 0, "dimensionB": 2 },
      "action": { "kind": "enter-window" } }
  ],
  "artworks": [
    { "id": 0, "dimension": 1, "kind": "image", "asset": "praia",
      "position": [0, 1.5, -30], "size": [4, 3, 0.1], "interaction": "modal" }
  ]
}
```

Os outros campos (`width`, `height`, `box`, `boxPosition`, `trigger`, `frame`) têm omissões — o
roadmap §6 tem o formato completo e `js/scene/schema.js` é a descrição que manda.

#### Os mundos e as suas portas

A cena é **um ficheiro por mundo** em `data/worlds/`. Cada mundo tem uma dimensão (a sua sala) e as
portas que dele saem; o portão não tem conteúdo 3D — vê-se a câmara.

| Mundo | Dimensão | Conteúdo | Portas (id: para onde) |
| --- | --- | --- | --- |
| `gate` (o portão, na raiz) | 0 — realidade | Vê-se a câmara | `0 → cidade`, `1 → praia` — em `x = ∓6`, `z = -8` |
| `cidade` | 0 — cidade 360º | `cidade-360` + 5 obras | `2 → gate`, `3 → praia` — em `x = ∓25`, `z = -45` |
| `praia` | 0 — praia | `praia` + 3 obras | `4 → cidade`, `5 → gate`, `6 → céu` — em `x = -25`, `x = 25` e `x = 0`, `z = -80` |
| `ceu` | 0 — céu 360º | `skycloud` + 2 obras | `7 → praia` — em `x = 0`, `z = -120` |

O grafo das portas é o que era — as oito, nos mesmos sítios —, mas cada uma leva agora a um
**mundo**, e não a uma dimensão do mesmo ficheiro (excepto a porta 5, trocada no B7 — ver abaixo):

```
gate   ⇄ cidade   (portas 0 e 2)      gate  ⇄ praia  (portas 1 e 5)
cidade ⇄ praia    (portas 3 e 4)      praia ⇄ céu    (portas 6 e 7)
```

A porta **5** era a **segunda porta da praia para a cidade** — uma duplicação que vinha da cena
anterior (mesmo `ownedBy`, mesmo par de dimensões) — e passou a ser o **regresso ao portão**
(decisão **D29**): enquanto eram duas dimensões do mesmo ficheiro, a duplicação era só
redundância; com **um mundo por dimensão** passou a ser **falta de saída**, e ao chegar do portão
não havia porta nenhuma para declarar a chegada. O `git diff` do migrador emendado é a prova
(1 ficheiro, só a porta 5), e está registado na §9 do roadmap. **Consequência assumida:** deixou de
haver, no dado da exposição, duas portas a mostrar o mesmo retrato — a partilha da dimensão
derivada (D26: 1 textura, 1 valor de stencil, 1 desenho) continua a valer no código, mas deixou de
estar **exercitada**; o **fixture** passou a exercitá-la no B8 (uma quarta porta, com o mesmo
retrato da primeira).

Todas as salas têm **regresso directo** ao portão — `cidade → gate` (porta 2) e `praia → gate`
(porta 5) — e cada porta é **bidirecional**: atravessar no sentido contrário é a mesma porta. A que
marca `arrivalFrom` é por onde se chega a esse mundo (uma por origem — lei L17), e a chegada é
**atrás** dela, virada para dentro da sala — o que faz do regresso um passo. As posições foram
escolhidas para que o ponto de chegada nunca caia dentro da caixa de outra porta — sem isso haveria
trocas em cadeia ao chegar.

#### Atributos do portal

Estes são os **campos do dado** (`portals[]` em `data/worlds/<mundo>.json`) e as suas omissões — que são,
ao mesmo tempo, as do componente (`js/modules/portal.js`); o conversor lê as do componente e
escreve-as no JSON, que é o que impede os dois de divergirem:

| Campo | Significado | Omissão |
| --- | --- | --- |
| `id` | ID do portal | (obrigatório) |
| `window` | O **primeiro eixo** (D14): `kind` — `dimension-pair`, `preview` ou `none` — e, com o par, as duas dimensões que a porta liga (`dimensionA`, `dimensionB`) | (obrigatório) |
| `action` | O **segundo eixo**: `kind` — `enter-window`, `navigate` ou `none` — e, com `navigate`, o `target` (o mundo de destino) | (obrigatório) |
| `ownedBy` | Dimensão onde a porta fica (`-1` = qualquer das duas) | (obrigatório) |
| `arrivalFrom` | O mundo de origem para o qual esta porta é a porta de chegada | (opcional) |
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
  portal** (`radius: 500` em `data/worlds/<mundo>.json`): o fundo da dimensão ativa tem de estar sempre
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
  `data/worlds/`, um ficheiro por mundo, não em entidades escritas à mão no `index.html` — que
  passou de 240 para **82 linhas** e deixou de ter cena nenhuma dentro
- **Mundos e portas de mundo** (Fase 3B): cada sala é um mundo com o seu ficheiro e a sua porta,
  a porta de mundo mostra um **retrato** do destino (com paralaxe) e a travessia **muda de
  endereço**; a chegada é atrás da porta inversa, com o regresso a um passo
- **Catálogo de Assets**: cada caminho de ficheiro aparece **uma vez**, no catálogo `assets`, e
  as dimensões e as obras apontam para ele pelo nome (o modal deriva daí o seu endereço)
- **Texto por Língua no Dado**: os nomes das dimensões e as descrições dos assets são
  `{ "pt": "…", "en": "…" }` — acrescentar uma língua é acrescentar um campo
- **Validação da Cena**: o mesmo módulo (`js/scene/validation.js`) corre na consola ao arrancar,
  na linha de comando (`node tools/scene/validate.mjs`) e vai correr no editor (Fase 4)
- **Um endereço por mundo** (Fase 3B, B7): a raiz é o portão e as salas são pastas — `/cidade/`,
  `/praia/`, `/ceu/` — servindo todas o **mesmo `index.html`**; o mundo sai do caminho
- **`?scene=<mundo>`**: força um mundo (`cidade`, `praia`, `ceu` ou o fixture `example`), para
  experimentar sem tocar no portão da exposição; `&from=<mundo>` diz de que mundo se vem
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
   `http://127.0.0.1:8123/`
2. Clique no botão "ATIVAR EXPOSIÇÃO"
3. Permita o acesso à câmera quando solicitado (é a dimensão 0, a realidade)
4. Explore o ambiente utilizando o mouse (desktop) ou o D-pad (mobile)

O **endereço escolhe o mundo**: a raiz é o **portão** e cada sala tem a sua pasta —
`http://127.0.0.1:8123/cidade/`, `/praia/` e `/ceu/`. As três salas servem o **mesmo `index.html`**
da raiz (o `<base>` é que muda), e atravessar uma porta de mundo navega para a pasta do destino.

Quem quiser experimentar sem mexer na exposição pode forçar um mundo com `?scene=`
(`http://127.0.0.1:8123/?scene=example`): carrega o `data/worlds/example.json`, o mundo de ensaio
com duas dimensões e **duas portas de cada tipo** (o par de dimensões ao vivo, atravessável, e o retrato que navega) — `?scene=cidade`, `?scene=praia` e `?scene=ceu` também
funcionam. E `&from=<mundo>` diz de que mundo se vem, o que faz o visitante aparecer atrás da porta
de chegada: `/praia/?from=cidade`.

### 2. Personalizar Conteúdo

- Modifique as imagens e vídeos em `assets/{panoramas,artworks,video,previews}/`
- Atualize os caminhos no **catálogo `assets`** do mundo (`data/worlds/<mundo>.json`) — cada
  caminho aparece lá **uma vez**, e as dimensões e as obras apontam para ele pelo nome (D20)
- Acrescente dimensões, obras e portais às listas do mesmo ficheiro (o roadmap §6 tem o formato, e
  `js/scene/schema.js` é a descrição que manda)
- Para acrescentar um **mundo**, escreva `data/worlds/<slug>.json` (e, com o B7, a pasta com o
  mesmo nome); para o ligar ao portão, acrescente uma porta ao `gate.json` — com o retrato do
  destino em `assets/previews/` e o `radius` do retrato
- As imagens têm de ser **2:1** e ficam melhor com 2048 de largura (lei L14); a ferramenta
  `tools/assets/normalize.mjs` corta e reduz sem ampliar
- Valide antes de publicar: `node tools/scene/validate.mjs` (confere todos os mundos e o grafo)

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
- **Um retrato para o portão** (item do autor, medido em §9): a porta da cidade para o portão é
  `window: none` porque não há imagem do portão; o caminho e o formato já a aceitam
- **A orientação da chegada** (item do autor): o visitante chega virado no sentido em que vinha — o
  que faz do regresso **um passo** —, e no **céu** nenhuma das duas obras fica à frente dele. Se o
  autor preferir aterrar virado para a sala, é a rotação da chegada (`js/scene/arrival.js`)
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
