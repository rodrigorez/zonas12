# Projeto Galeria AR

## Descrição

Este projeto é uma galeria imersiva de realidade aumentada/virtual utilizando A-Frame. Ele permite criar experiências interativas onde os usuários podem explorar ambientes 360º e interagir com obras de arte virtuais através de portais estêncil.

## Estrutura do Projeto

````markdown
zonas12/
├── index.html          o portão: o arranque da raiz (a cena vem de data/worlds/)
├── editor.html         a página de edição (Fase 4): outra entrada, os mesmos módulos (D4)
├── scene1/             sala (a cidade): o mesmo index.html com <base href="../"> (Fase 3B, B7)
│   └── index.html
├── scene2/             sala (a praia)
│   └── index.html
├── scene3/             sala (o céu)
│   └── index.html
├── README.md           documentação principal (fica sempre na raiz)
├── css/
│   ├── style.css       estilos da página, HUD, modal e D-pad
│   └── editor.css      estilos da página de edição
├── js/
│   ├── app.js          arranque: carrega e valida a cena, constrói, e a ponte da interface
│   ├── arrival-frame.js  a ponte de imagem entre mundos (D43): o último quadro de uma página
│   │                   pintado pela página seguinte, antes de ela ter cena
│   ├── editor.js       o arranque da página de edição (a entrada, 14 linhas — D36)
│   ├── i18n.js         o catálogo da interface: `t()`, `?lang=` e a aplicação ao markup (D12)
│   ├── core/           núcleo: estado, registos, stencil, eventos, limites
│   ├── modules/        dimensão, obra, portal e câmara (Fase 2), com as fábricas da Fase 3, e o
│   │                   nome das coisas na vista de debug (`label.js`, Fase 4); a política do shader
│   │                   (`shader-policy.js`) e a lista interna (`shaders.js`, Fase 7)
│   ├── shaders/         um módulo por shader instalado (o corpo do fragment; Fase 7)
│   ├── scene/          a cena em dados: schema, validação, construtor e as regras de desenho
│   └── editor/         o editor (Fase 4): modelo, painéis, pré-visualização, problemas, os
│                       controlos partilhados, as respostas que a página pode dar sobre os
│                       ficheiros e a ponte com o servidor da ferramenta (Fase 5)
├── data/
│   └── worlds/         uma cena por mundo (D24): gate, scene1, scene2, scene3 e o fixture
│                       `example` (o mundo sai do **endereço**: `/` é o portão, `/scene1/` é a
│                       primeira sala; o `?scene=<mundo>` continua a forçar um deles, para os testes)
├── i18n/
│   ├── pt.json         textos da interface: 203 chaves (186 delas do editor), lidas por js/i18n.js
│   └── en.json         as mesmas 203 chaves em inglês (?lang=en); um teste compara as duas
├── docs/
│   └── ROADMAP.md      plano de desenvolvimento (módulos, mundos e página de edição)
├── assets/
│   ├── panoramas/      fundos 360º (2:1, normalizados no B5 da Fase 3B)
│   ├── artworks/       imagens das obras
│   ├── video/          o vídeo usado como obra
│   ├── models/         os modelos GLTF (o do fixture do R9 — D58)
│   └── previews/       os retratos das portas de mundo (um por porta — D46)
├── tools/
│   ├── scene/               validador dos ficheiros de cena (corre a mesma validação que o browser,
│   │                        mais o grafo dos mundos e os arranques), o instrumento das leis
│   │                        (avarias injetadas, uma por lei), o verificador dos arranques (D28), a
│   │                        ferramenta que cria a pasta e o arranque de um mundo novo (D31) e as
│   │                        perguntas ao disco (`disk.mjs`): o asset existe e a imagem mede 2:1
│   ├── server/              o servidor da ferramenta (Fase 5, D48): serve a publicação **e** grava
│   │                        `data/worlds/<slug>.json`, com cópia de segurança; e o seu instrumento
│   ├── migration/           o conversor HTML→JSON da Fase 0 e a migração para o formato v3, ambos
│   │                        com guarda: são o registo das migrações
│   ├── assets/              normalização das imagens (2:1 e teto de 2048 px — lei L14)
│   ├── shader/              o validador e o instalador de shaders (Fase 7): compila, mede a
│   │                        cadência de 20 atualizações/s e recusa o que não cumpre
│   └── regression/          a verificação inteira num comando (`all.mjs`), a varredura de poses
│                            T2/T3, a bateria dos doze testes, as portas e a chegada (T1, T7/T11),
│                            o ciclo build/remove de portais (estes correm na consola do browser,
│                            com uma página da exposição aberta) e as baterias de linha de comando
├── .harness/           fora do repositório (está no .gitignore)
│   ├── dev/            ferramentas retiradas da raiz (não são precisas para o app)
│   │   ├── package.json, package-lock.json   dependências npm (A-Frame vem do CDN)
│   │   ├── node_modules/
│   │   ├── favicon.ico                       vazio, sem uso
│   │   └── vscode-config/settings.json       configuração do editor
│   ├── backups/worlds/  a cópia de cada gravação do editor (Fase 5, D51) — uma por gravação
│   ├── imagenTeste/    capturas de ecrã usadas para diagnosticar problemas
│   └── skills/         harness de skills para IA — índice em .agent/skills_index.md (regra 5)
└── .gitignore
````

## Regras de Organização do Projeto

### 1. Estrutura de Pastas

- A raiz tem só o que é preciso para o projeto funcionar: `index.html`, `editor.html` (a página de
  edição, Fase 4), as pastas dos mundos
  (`scene1/`, `scene2/` e `scene3/`, cada uma com o seu `index.html` — Fase 3B), `css/`, `js/`,
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

- O projeto tem **um** `index.html`, e um por mundo: a raiz (o portão) e as pastas `scene1/`,
  `scene2/` e `scene3/` (Fase 3B, D28; a cidade, a praia e o céu). Os quatro são o **mesmo ficheiro fora da linha do `<base>`**
  — a raiz aponta `href="./"` e as salas `href="../"` — e **não podem divergir**: quem edita um
  edita os quatro, e o verificador do B8 exige que sejam iguais fora dela.
- O `editor.html` é a **outra** entrada do projeto (Fase 4): não é um mundo, não tem slug nem
  `<base>` variável, e a ferramenta que cria a pasta de um mundo novo copia o `index.html` da raiz
  — nunca o `editor.html` (**D31**).
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

## Estado atual do código (v0.0.11)

> **Atualização (2026-10-24, Fase 7 — B9, o rename e a produção):** depois da v0.0.11, o **B9** pôs o
> fundo shader na exposição e o autor **adotou-o como produção** (o ensaio passou no telemóvel fraco e
> no desktop; o A/B nos três aparelhos está por medir — R14/R15 abertos), com `?shader=0` como
> escape para a imagem de reserva. As salas passaram a chamar-se **`scene1`** (a cidade),
> **`scene2`** (a praia) e **`scene3`** (o céu): o nome de conteúdo e as imagens não mudaram, o
> endereço é que sim. Os números desta secção são os da **v0.0.11**; o que o B9 mediu está na §9 do
> roadmap. As secções históricas deste README continuam a citar os nomes e endereços antigos, que é
> onde foram medidos.

Marcado pela branch `v0.0.11`. É o estado depois da **Fase 6** do roadmap — **testes e limpeza** —,
medida em 2026-10-24 e **aceite no telemóvel** no mesmo dia: a automação dos **doze testes** num
comando (`node tools/regression/all.mjs`), a **recusa** da varredura de poses quando a câmara se
mexe, e as pendências **R16** e **R17** fechadas. O que a fase entregou e mediu está em
[docs/ROADMAP.md](docs/ROADMAP.md) §9/§10 e o comando está no passo 3 de «Como Usar». Nenhum
comportamento da exposição mudou — o único ficheiro de produção tocado foi `js/arrival-frame.js`
(a ponte espera pela descodificação da imagem).

A versão anterior é a `v0.0.10` (o fecho da Fase 5 — a **gravação direta**): o servidor da
ferramenta (`tools/server/serve.mjs`) e o botão «Gravar» no editor, com as decisões **D48–D51**;
tudo o que está nesta secção foi medido a **2026-10-23** na versão local (as baterias estão em §10)
e a **2026-10-24** no **telemóvel**, na versão publicada, com os **oito** itens do aceite daquela
fase a passar — portão, travessia entre as três salas sem preto, retratos a casar com a chegada,
D-pad, modal da obra, regresso e desempenho.

Resumo do que existia na v0.0.11: `index.html` (**93 linhas**) e as **3** salas com o **mesmo** ficheiro
(`scene1/`, `scene2/`, `scene3/`, iguais fora da linha do `<base>` — D28), `editor.html` (**95**),
`js/app.js` (**185**), `js/arrival-frame.js` (**144**, a ponte de imagem entre mundos — D43),
`js/editor.js` (**14**, a entrada do editor — D36), `js/editor/`
(**14** ficheiros, **2789** linhas com os painéis e a ponte com o servidor), `js/i18n.js` (**92**),
`js/core/` (7 ficheiros, **219**), `js/modules/` (6 ficheiros, **1425**), `js/scene/` (5 ficheiros,
**1132**), `css/style.css` (105) e `css/editor.css` (**313**), **5** mundos em `data/worlds/` (o
portão, as três salas e o fixture, **1279 linhas** no total e **12** portas), `i18n/pt.json` (**160**
chaves), os **15** assets em `assets/{panoramas,artworks,video,previews}` (**6** deles retratos das
portas, um por porta — D46) e **29** ficheiros em `tools/`
(**6384** linhas — as ferramentas de dados, o servidor da ferramenta e os instrumentos das fases).

O `js/core/` é o **núcleo** (Fase 1 do roadmap): o estado da cena, os registos e as
regras de stencil — a única parte global, porque o stencil é um recurso de toda a cena.
Os **4 módulos** (Fase 2) vivem em `js/modules/`, e o `js/app.js` ficou com o arranque
(carrega e valida a cena, constrói, arranca o driver, e liga os dois botões da interface).
Desde a Fase 4 os módulos têm **dois hosts** — a exposição e a pré-visualização do editor — e por
isso nenhum deles exige a interface da exposição para carregar (pendência **R13**, fechada no B2):

| Módulo | O que governa | Entrada |
| --- | --- | --- |
| `camera.js` | A câmara-jogador (posição, D-pad, limites) e o erro de câmara; é o **único** ficheiro que sabe onde a câmara está — desde a Fase 3 recebe-a do construtor de cena, em vez de a procurar pelo nome | `playerCamera`, `createPlayerCamera`, `startSession`, `setupMobileControls`, `reportCameraError` |
| `artwork.js` | A obra: o material dimensional, o clique e o modal (foco preso, `inert`, Escape) | componentes `dimensional-material` e `open-artwork`; `createArtwork`/`removeArtwork`; `closeArtwork` |
| `dimension.js` | O fundo 360º de uma dimensão (imagem ou vídeo) | componente `dimension-panorama`; `createDimension`/`removeDimension` |
| `portal.js` | A porta: janela (máscara), moldura, caixa de colisão, travessia e caixa de debug — e o **driver de frame** da cena. Desde o B4 da Fase 3B a travessia e a janela são decididas pelos **dois eixos** (`window`/`action`) | componentes `stencil-portal` e `portal-driver`; `createPortal`/`removePortal`; `startFrameDriver` |
| `portal-kinds.js` | A **tabela dos dois eixos**, pura: o que cada `window` mostra e o que cada `action` faz, a matriz das combinações legais, a validação de uma porta e o endereço de um mundo. Corre também em `node` (é ela que o validador lê) | `WINDOW_KINDS`/`ACTION_KINDS`, `isLegalCombination`, `validateDoor`, `worldHref` e `ENTRY_WORLD` |

Cada módulo tem o seu `remove()`, para que criar e destruir conteúdo em ciclo (o que o
editor faz a cada tecla que re-cria uma entidade, e o que o T9 mede) não deixe registos mortos nem
memória agarrada — e desde a Fase 3 cada
módulo tem também a sua **fábrica**, que constrói uma entidade a partir do dado.

O **`js/scene/`** é onde a cena em dados vive, e tem **cinco** ficheiros:

| Ficheiro | O que é |
| --- | --- |
| `schema.js` | A **forma do formato** (v3): campos, tipos, enumerações, as regras dos dois eixos da porta e o catálogo de assets. Puro — não conhece o DOM nem o A-Frame |
| `validation.js` | A forma (lida do schema) e as **leis** que o dado sozinho prova: L1, L4, L5, L9, L10, L11, L12, L13, L14, L15, L16, L17, L18 e L19 (esta última sobre o **grafo** dos mundos, com o `missingArrivals`), mais os **avisos da D30** para o que o esquema aceita e a cena ainda não constrói. É o mesmo módulo que a consola da exposição corre ao arrancar, que `tools/scene/validate.mjs` corre na linha de comando e que o editor corre a cada tecla |
| `arrival.js` | Onde o visitante aparece ao chegar de outro mundo (**L16**): puro e partilhado, para o construtor e o validador não discordarem da geometria |
| `scene-builder.js` | O **único** que conhece o A-Frame: cria o `<a-assets>` (e **espera** que os ficheiros carreguem), a câmara, as dimensões, as obras e os portais, a partir do JSON. Desde o B3 aceita `{ preview: true }` e desliga a navegação (D32) |
| `render-config.js` | As **regras de desenho** do renderer (`ar-config`: `stencil`, `alpha`, `antialias`), registadas uma só vez para os **dois** hosts — a exposição e a pré-visualização do editor (lei **L6**) |

O **`js/editor/`** é o editor (Fase 4), e a entrada é `js/editor.js`:

| Ficheiro | O que é |
| --- | --- |
| `js/editor/index.js` | A composição: a barra (mundo, validar, desfazer, gravar, exportar, importar), o `validateScene` com as respostas que a página pode dar, a marca «alterado», a guarda de saída e o desfazer |
| `js/editor/model.js` | O mundo em memória, o **export byte-estável** (2 espaços e `\n`), os instantâneos do desfazer (**D35**) e o «alterado» |
| `js/editor/panels/` | Os **cinco** painéis — mundo, dimensão, obra, portal e câmara —, cada um com o que §7 do roadmap pede e um formulário de inserção |
| `js/editor/preview.js` | A cena de pré-visualização: `buildScene` mais os `replace…` que re-criam **a entidade** editada (D33) |
| `js/editor/fields.js` | Os controlos partilhados (número, texto com `datalist`, escolha, caixa, vec3, botão, nota) e o `debounce` |
| `js/editor/worlds.js` | O **único** sítio que lê um mundo que não se está a editar — para a **L11** e o mapa da casa; lê e guarda, nunca constrói (L13) |
| `js/editor/assets.js` | As respostas que a página pode dar sobre os ficheiros: o asset existe (**L9**) e a imagem mede 2:1 (**L14**), por `Image` e por `HEAD` |
| `js/editor/problems.js` | Os três números (erros, avisos, por verificar) e uma linha por problema |
| `js/editor/server.js` | A ponte com o servidor da ferramenta (Fase 5): um `HEAD` na raiz lê o cabeçalho `X-Zonas12-Serve` e diz se há quem grave (**D49**); o `PUT` grava o mundo (**D50**) |

A cena está em **`data/worlds/<mundo>.json`** (formato **v3**, descrito no roadmap §6): um catálogo
`assets` onde cada caminho aparece **uma vez**, as dimensões e as obras a apontarem para ele pelo
nome, o texto de conteúdo por língua, o mundo a que o ficheiro pertence (`world.slug`) e a porta
com os **dois eixos** — `window` (o que a janela mostra, com o par de dimensões lá dentro) e
`action` (o que a travessia faz). `?scene=example` carrega o `data/worlds/example.json`.

### O que está implementado

| Área | Estado |
| --- | --- |
| Mundos e endereços | **Um ficheiro por mundo** em `data/worlds/` (D24) e um endereço por sala: a raiz é o portão e `/scene1/`, `/scene2/` e `/scene3/` são as salas, todas servindo o **mesmo** `index.html` (D28). O mundo sai do caminho e o `?scene=<mundo>` força um, para os testes; o validador exige que a pasta seja o `world.slug` |
| Página de edição | `editor.html` (`?world=<slug>`) é uma **ferramenta separada** (D4) que usa os **mesmos** módulos: abre um mundo, edita-o por **cinco painéis** (câmara, dimensão, obra, portal, mundo), mostra a **pré-visualização** com a mesma cena da exposição e exporta o JSON — sem nada escrever em disco (D2). A pasta de um mundo novo é da ferramenta `tools/scene/new-world.mjs` (**D31**) |
| Desfazer, «alterado» e guarda de saída | Editar → desfazer (**50** instantâneos do JSON, **D35**) → exportar; a marca «alterado» e o aviso antes de fechar com alterações que não saíram num ficheiro (**D32**); e a exportação **recusa** um mundo com erros — valida tudo antes de exportar |
| As leis no editor | O editor corre o **mesmo** `validation.js` e responde às duas perguntas que eram só da linha de comando: o asset existe (**L9**) e a imagem mede 2:1 (**L14**). Num mundo saudável o relatório diz `Erros: 0 · Avisos: 0 · Por verificar: 0` |
| Gravação direta | Com o **servidor da ferramenta** (`node tools/server/serve.mjs`) o editor ganha o botão «Gravar»: escreve o mundo em `data/worlds/` com o **mesmo** validador, uma cópia de segurança antes e escrita atómica (**D48–D51**); sem servidor o botão não aparece e o «Exportar» fica como estava |
| Interface por catálogo | Todo o texto da interface — exposição **e** editor — sai de `i18n/pt.json` (**203** chaves) e, em inglês, de `i18n/en.json` (as mesmas **203**), por `data-i18n` no markup ou `t('chave')` no código; `?lang=en` escolhe a língua e uma chave que falte cai no português com **1** aviso |
| Portas de mundo | A travessia de uma porta de mundo **navega** para o endereço do destino e o visitante aparece **atrás** da porta que lá se declara a chegada (`arrivalFrom`), na direcção em que vinha — o regresso é **um passo** (L16/L17/L19). Como cada mundo é uma **página** (D24), a chegada **arranca a exposição sozinha** (`?from=`, D37): o botão «ATIVAR EXPOSIÇÃO» fica para a primeira visita e volta se a câmara for recusada. E a porta que volta ao portão mostra a **realidade ao vivo** pela janela (**D38**): a sala declara uma dimensão `kind: "camera"`, que não desenha nada, e o rectângulo fica transparente sobre o vídeo — vê-se a câmara dos **dois lados**, que é o que a porta mostrava na Fase 3 |
| Dimensões e portais com ID | 512 dimensões e 512 portais de organização; o ID está no dado (`"id"`) e, na cena construída, em `data-dimension`, `data-portal-id`, nas classes e nos nomes dos objetos 3D |
| Grafo de dimensões | Portais bidirecionais entre duas dimensões, com uma **dimensão ativa** global; dentro de cada mundo é o que resta do grafo antigo, e o **grafo de mundos** é conferido pela linha de comando (alcançabilidade a partir do portão) |
| Travessia | Por **colisão com a caixa** do portal (`box`, `boxPosition`, `boxRotation`), no plano do quadro ou na face da caixa (`trigger`) — nunca por distância; o que ela *faz* vem do eixo `action` (ficar, navegar ou nada — D25) |
| Janelas | Uma por portal, com valor de stencil por **dimensão mostrada** (não por portal); portais que mostram o mesmo retrato partilham o valor e a dimensão derivada (D26) — é o que o **fixture** exercita, com duas portas de retrato |
| Fundo 360º | `dimension-panorama` por dimensão (imagem ou vídeo), segue a câmara; a dimensão 0 é a câmara real (canvas transparente) |
| Conteúdo | As obras pertencem à dimensão (o campo `dimension` de cada obra, no JSON); o clique só abre na dimensão ativa |
| Molduras | Barra vermelha à volta do quadro, pertencente à dimensão onde o portal está; o bordo mantém-se fechado mesmo quando cruza a janela de outro portal |
| Modo debug | Tecla `D` mostra a caixa de colisão (sempre igual à usada na deteção) e o **nome de cada porta** e de **cada obra** — o id, o que mostram e para onde levam (D39/D40); tecla `R` roda o portal |

### Modelo de render (ler antes de mexer)

1. `stencil: true` no `<a-scene>` e `sortObjects` ativo no renderer — **é ele que faz valer o
   `renderOrder`**. Quem o fixa é o A-Frame (não o atributo: `sortObjects` não está no schema do
   `renderer`); a linha de `js/app.js` confirma-o (lei **L6**, decisão **D16**).
2. Ordem de desenho: máscaras (1) → panoramas (2; **2.5** para os das janelas) → obras (3)
   → molduras (4) → caixa de debug e nome da porta (10).
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

### Fundos esféricos: imagem e shader

O fundo 360º de produção é o **shader** (Fase 7, ver «Política do fundo shader em produção»); o
panorama continua lá como **imagem de reserva**, e é o que `?shader=0` desenha. O ensaio que
decidiu isto vive em [`teste/shader.html`](teste/shader.html), com cinco fundos GLSL, câmera real,
portais com stencil e ajuste automático do pixelRatio.

#### Formato e tamanho das imagens

- O panorama é equiretangular, com proporção **2:1**; a validação do projeto recusa dimensões que
  não respeitem essa proporção.
- Resoluções encontradas no catálogo atual: `480 × 240` (céu, **18,6 KiB**),
  `1024 × 512` (praia, **620,5 KiB**) e `2048 × 1024` (cidade, **528,1 KiB**). Os tamanhos em
  bytes variam com o conteúdo e a compressão; não se deve inferir qualidade apenas pelo peso.
- O arquivo comprimido não representa toda a memória de renderização: uma textura RGBA expandida
  ocupa aproximadamente **2 MiB** em `1024 × 512` e **8 MiB** em `2048 × 1024` (estimativa de
  `largura × altura × 4`, sem contar overhead do driver/renderer). Para várias esferas, considerar
  também o número de dimensões mantidas carregadas.
- **Ponto de partida recomendado para novos panoramas: `1024 × 512`**, JPEG ou WebP, com qualidade
  visual verificada no headset/celular. Subir para `2048 × 1024` quando o detalhe visível justificar
  o aumento de memória e transferência. `4096 × 2048` não foi testado nesta exposição e não é o
  padrão recomendado para celular.
- Como orçamento inicial, procurar ficar até **500 KiB** em `1024 × 512` e até **1,5 MiB** em
  `2048 × 1024`; são metas de compressão, não limites do validador. Se a imagem apresentar blocos,
  banding ou perda de detalhe, priorizar qualidade visual e medir o carregamento real.
- **Os retratos das portas voltaram ao padrão `2048 × 1024`.** Um retrato não é um panorama: é a
  **vista da chegada** desenhada pela exposição (D46). Enquanto o fundo das salas era um panorama, o
  retrato tinha de o carregar também, e a `2048 × 1024` a costura ficava em **0,54** (acima da meta
  de **0,50**): a exceção do **D47** subiu-o a `3072 × 1536`. Com o **fundo shader** (Fase 7) o céu, o
  mar e o chão passam a ser calculados — iguais dos dois lados do corte — e o retrato só carrega as
  **obras e as portas**: a `2048 × 1024` a costura fica em **0,13 a 0,47** nas seis portas. São **6**
  ficheiros, **772 kB** no total, **8 MiB** de textura cada, e a **L14** deixa de ter o que avisar
  (`validate.mjs`: `Erros: 0 · Avisos: 0` nos seis mundos).
- **Além do retrato, cada porta tem um recorte (D53).** O mesmo desenho, sem o fundo e com
  transparência (`recorte-<porta>.png`, 2:1, **133 a 155 kB** cada): é o que a janela compõe sobre o
  shader **ao vivo** do destino, para a janela animar sem perder as obras e as portas. O retrato
  inteiro fica como reserva — `?shader=0`, ou um driver que recusa o programa.
- A produção configura `THREE.LinearFilter` e desativa mipmaps em
  `js/modules/dimension.js`; manter isso consistente ao trocar ou otimizar a textura e validar a
  qualidade visual antes de alterar o filtro.

#### Resolução e tamanho dos shaders

Um shader não precisa de arquivo panorâmico nem de uma textura equiretangular de 2:1: o fragment
shader calcula a cor por pixel na esfera, em tempo de renderização. O custo depende da quantidade
de pixels do framebuffer (que cresce aproximadamente com o quadrado do pixelRatio), da complexidade
do shader, da câmera e da sobreposição das janelas/objetos. Portanto, sua resolução de saída é a do
renderer — tela × pixelRatio aplicado —, não uma resolução fixa como `1024 × 512`.

No teste, o pixelRatio automático fica entre **1** e o `devicePixelRatio` reportado pelo aparelho.
Começa na memória do dispositivo (se disponível) ou no máximo nativo. O limite aprendido é guardado
por GPU e dimensões da tela por **30 dias**. O parâmetro `?memoria=0` ignora a memória apenas para
ensaios; `?pr=1.5` fixa o valor, `?adapt=0` desliga o ajuste e `?aa=0` desliga antialias antes da
criação do renderer.

| Regra do protótipo | Valor |
| --- | ---: |
| p95 considerado bom para avançar | ≤ 20 ms |
| p95 considerado ruim | > 25 ms |
| Aquecimento inicial | 3 s |
| Janela para estatística de quadros | 2,5 s |
| Intervalo entre decisões | 3 s |
| Descida do pixelRatio | 8%–25%; p95 > 40 ms pode recuar após uma janela, senão exige duas ruins |
| Subida do pixelRatio | +5% após 3 janelas boas, limitada a 95% do último valor que deu problema |
| Desenho por fundo para o governor p5.js | máximo de 6 ms |
| Piso do pixelRatio | 1 |
| Teto do pixelRatio | pixelRatio nativo do aparelho |

Quando o pixelRatio chega a 1, o governor passa a reduzir o número de fundos animados. Em modo
automático, ele ativa fundos visíveis um a um; os modos de teste `estatico` e `tudo` servem para
comparação, não são a política da exposição. O limite `drawMax: 6 ms` é relevante para a variante
p5.js: não mede o custo interno de GPU do shader.

#### Comparação observada de desempenho

| Aparelho e cenário | Resultado observado |
| --- | --- |
| Fraco — PowerVR Rogue GE8320, `411 × 748`, DPR nativo `2,625`, câmera 720p, antialias ligado, shader | Começou em `2,625`, com amostras iniciais de **34–44 fps** e p95 de **33–50 ms**. O ajuste chegou a `2,051` em cerca de 12 s; depois, com cinco fundos animados, ficou em aproximadamente **59–60 fps** e p95 de **16,6 ms**. |
| Mesmo aparelho, visita seguinte com memória | Começou em `1,711` (valor previamente aprendido), chegou a `1,879` e manteve p95 de **16,6 ms** na maioria das amostras, com picos curtos de **33 ms** em mudanças de estado/resolução. |
| Médio — Adreno 630, `411 × 804`, DPR nativo `2,625`, câmera ligada, antialias ligado, shader | Manteve o pixelRatio nativo **2,625**, com cinco fundos animados, cerca de **60 fps** e p95 de **16,7 ms** (uma amostra inicial de 55,7 fps durante o carregamento). |
| Fraco, panorama p5.js animado | Em ensaios anteriores, aproximadamente **4–7 fps**; a geração em canvas e a atualização da textura acrescentavam custo de CPU e transferência para a GPU. |

**Como interpretar os tempos:** os resultados de shader são tempos de quadro da cena inteira, não uma
medição isolada do tempo de execução da GPU. O campo `desenhoMs: 0` dos shaders significa que não
há desenho p5.js medido no CPU; **não** significa que o shader custe zero. Imagens estáticas não
redesenham nem transferem uma nova textura a cada quadro, enquanto shaders calculam os pixels na
GPU durante a renderização. O instrumento [`teste/bench.js`](teste/bench.js) compara imagem estática
com p5.js, mas não inclui um cenário shader equivalente; por isso, os números acima são evidência
prática em aparelhos reais, não um A/B controlado imagem × shader na mesma sessão.

**Decisão atual (2026-10-24):** o shader é a produção; a imagem é a reserva. A medição indica que
shaders GLSL são muito mais adequados que p5.js para animação neste caso, mas não prova que todo
shader será mais rápido que toda imagem: a complexidade do shader e a resolução continuam a
importar — é por isso que o **validador** mede cada shader antes de ele poder ser nomeado, e que a
**escada** do R15 (pixelRatio → 15 fps → quadro parado) fica como rede. Falta a comparação
controlada imagem × shader no mesmo aparelho, cena, câmera, pixelRatio e duração (**R14**).

#### Política do fundo shader em produção

Desde **2026-10-24** o shader é o que a exposição **desenha por omissão** (decisão do autor, depois
de o ensaio passar no telemóvel fraco e no desktop). Cada sala nomeia um `shaderId` da **lista
interna** e mantém o panorama como `fallbackAsset`; `?shader=0` é o escape — constrói a imagem de
reserva, e é o que serve o A/B e o rollback. O mundo de ensaio é `?scene=shader`
(`data/worlds/shader.json`, um fixture fora do grafo).

| Sala | Shader | Reserva |
| --- | --- | --- |
| `scene1` (cidade) | `grade-neon` | `cidade-360` |
| `scene2` (praia) | `por-do-sol` | `praia` |
| `scene3` (céu) | `nuvens` | `skycloud` |

**Enviar um shader** é `node tools/shader/validate.mjs <ficheiro.glsl>` para medir e
`node tools/shader/install.mjs <ficheiro.glsl> --id <id> --name "<nome>"` para instalar. O ficheiro
é o **corpo** do fragment (o prelúdio, com `uTime`, `vDir`, `az`, `el` e `vec3 col`, é da exposição).
O validador compila-o num Chrome sem cabeça, mede as atualizações entregues e **recusa** o que não
sustenta **19 de 20** por segundo (95% do teto), o que não compila ou o que não desenha;
`--force` instala na mesma **quando é só a cadência a falhar** (com o número medido escrito no
módulo) — um corpo que não compila, ou que não pinta nada, é recusado sempre, porque não há ensaio
possível com um fundo preto. Um shader que passe
é `js/shaders/<id>.js` e entra na lista marcada de `js/modules/shaders.js` — o mundo continua a
nomear só o `id`, nunca GLSL.

O instrumento da política é `node tools/regression/shader.mjs` (entra em `all.mjs --full`): mede a
escada sem GPU, a taxa entregue (≤ 20 atualizações/s), o `?shader=0`, o `prefers-reduced-motion`, as
três salas de produção e o painel do editor. O **A/B controlado nos três aparelhos** continua por
registar — é a medição que falta para o R14/R15, e a decisão de produção está tomada com o que foi
observado (funciona no telemóvel fraco e no desktop), não com o A/B.

A integração deve ser gradual e manter o panorama de imagem como fallback explícito de cada fundo.
O shader começa num quadro estático (`uTime` fixo), mede a cena e só então tenta animar; “estático”
significa congelar a saída do shader, não renderizar uma cena sem fundo.

| Estado | Política em produção |
| --- | --- |
| Inicialização | Carregar/compilar o shader e preparar a imagem fallback. Renderizar um quadro estático e recolher uma linha de base antes de animar. O **primeiro fotograma nunca pede mais do que `min(DPR nativo, 2)`** ao aparelho. |
| Animação normal | Tentar no máximo **20 atualizações/renderizações por segundo** (intervalo-alvo de 50 ms). Não executar a animação em cadência maior. |
| Ocioso e sem falhas | Enquanto nada falhou, o pixelRatio **sobe 20% a cada três janelas boas**, até ao DPR nativo — é assim que um aparelho bom chega à resolução nativa em ~30 s. |
| Sobrecarga persistente | Reduzir primeiro o pixelRatio em passos limitados, mantendo o teto no DPR nativo e o piso em `1`; reavaliar após cada alteração. Quando o valor em que se confiava falha, desce-se 20%. |
| Depois da primeira falha | **Bissecção** entre o maior valor que aguentou uma janela inteira e o menor que falhou, e **para** quando os dois estão a menos de 2% um do outro — é assim que a política deixa de oscilar. |
| Ainda sobrecarregado | Reduzir para **15 FPS** (intervalo-alvo de 66,7 ms), sem descer a uma cadência menor. |
| Ainda instável | Parar a animação e manter o último quadro shader estável; se o shader falhar, mostrar a imagem fallback. |

O primeiro fotograma a `min(DPR nativo, 2)` vem de uma medição no telemóvel fraco (Android 10,
PowerVR GE8320, `411 × 748`, DPR `2,63`): a **2,625** a página desenhava **38,7 quadros/s** com um
terço das atualizações atrasadas; a **1,945** desenhava **57,3**. Começar no nativo custava ~15 s de
arrasto até a escada reagir; começar em 2 não custa nada — quem aguenta sobe, quem não aguenta nunca
chega lá. Nesse aparelho a busca do teto **termina aos 27 s**: 2 → 1,6 → 1,8 → 1,9 (falhou) → **1,85**,
onde fica (59,5 quadros/s, cadência de 20/s, 10% de atrasos).

**A política não promete quadros por segundo.** Promete a cadência do shader. No mesmo telemóvel, ao
fim de ~20 minutos aquecido, a cena caiu de 59,5 para **40 quadros/s** com a cadência nos 20,0/s e 10%
de atrasos — e a política **não** desce a resolução por causa disso: perseguir a fluidez num aparelho
quente só a levaria ao piso `1`, com a imagem pior. A fluidez é o que o aparelho der; a cadência é a
promessa.

Os 20/15 FPS e o piso 1 são **valores iniciais de ensaio**, não garantias de fluidez nem limites já
aprovados para todos os aparelhos. No protótipo anterior, reduzir o pixelRatio no PowerVR GE8320
coincidiu com melhora de p95; isso justifica testar a redução antes de baixar a cadência, mas não
prova causalidade nem qualidade visual aceitável em qualquer cena. Não subir automaticamente acima
de 20 FPS. Uma eventual recuperação de resolução deve ser gradual, após várias janelas estáveis,
com teto no último valor conhecido como problemático; guardar uma estimativa local não deve ser
requisito para funcionar.

**Medição correta:** distinguir a cadência-alvo da perda de desempenho. Um intervalo de 50 ms é
esperado a 20 FPS e não deve, sozinho, ser contado como quadro perdido. Medir atualizações entregues,
atrasos em relação ao prazo configurado e janelas consecutivas fora do orçamento. O custo do shader
não pode ser inferido do `drawMs` de p5.js. A validação deve incluir carregamento, compilação,
transições, sobreposição de portais, câmera ligada/desligada e aparelhos fracos; comparar também
com o modo estático sob as mesmas condições. Se o runtime não permitir medir de forma fiável a
entrega do quadro, registar essa limitação em vez de apresentar a cadência solicitada como FPS real.

**Configuração que a cena aceita** (o formato real; a cadência e o pixelRatio são da política, não do mundo):

```json
{
  "kind": "shader",
  "shaderId": "por-do-sol",
  "fallbackAsset": "praia",
  "radius": 500
}
```

O projeto resolve `shaderId` por uma lista interna conhecida; não aceita GLSL, URLs,
expressões ou código fornecidos por cenas/conteúdo. Validar enumerações, tipos e faixas numéricas
na fronteira de carregamento, rejeitar configuração inválida com erro visível e preservar o fundo
de imagem válido como fallback. O asset fallback deve ser validado/carregado antes de substituir
o fundo existente. Capturar falhas de compilação, perda do contexto WebGL e erros de configuração
para trocar para o fallback e registrar diagnóstico; não ocultar a falha com um fundo vazio.

Respeitar `prefers-reduced-motion` iniciando e permanecendo estático, suspender trabalho quando a
página/documento estiver oculto e retomar em estado estático antes de reavaliar. Limitar o pixelRatio
ao intervalo validado `[1, DPR nativo]`, não elevar resolução para além do valor solicitado pelo
aparelho, evitar alocações por quadro e validar a qualidade visual em cada degrau de resolução.
Qualquer memória adaptativa local deve ser validada, expirar, ser apenas uma sugestão inicial e nunca
impedir o fallback ou a inicialização.

**Critério antes de produção:** o shader está em produção desde 2026-10-24 (decisão do autor), com
a escada do R15 como rede: `?shader=0` mostra a imagem de reserva, e o aparelho desce o pixelRatio,
depois para 15 FPS e depois congela o quadro. O **A/B controlado** foi medido em **dois** dos três
aparelhos, no build publicado e com a sonda — no telemóvel fraco o panorama desenha 35% mais pixels e
ainda vai 11% mais depressa que o `grade-neon` (50,4 contra 45,5 quadros/s), e no desktop não há
diferença que se meça. Falta o **terceiro aparelho** para o registo ficar completo; sem ele, o R14/R15
continuam abertos na documentação, com os números que já existem.

#### Comparativo controlado: imagem, shader e p5.js

As páginas da bateria comum são:

- [`teste/shader/index01.htm`](teste/shader/index01.htm)
- [`teste/img/index01.htm`](teste/img/index01.htm)
- [`teste/p5js.htm`](teste/p5js.htm)

Todas usam uma esfera 360º de raio 500 com geometria 64 × 48, uma cena A-Frame transparente,
renderer com stencil, câmera fixa, visual sintético de pôr do sol, resolução de conteúdo
`1024 × 512`, filtragem linear sem mipmaps e o mesmo pixelRatio explícito (por padrão, o DPR nativo;
`?pr=1.5` fixa o mesmo valor em cada página). O antialias também é comum e fica ligado por padrão;
`?aa=0` desliga-o em todas. Não há governor adaptativo nesta bateria: ele poderia escolher valores
diferentes em cada tecnologia e invalidar a comparação. A imagem é um JPEG RGB de **108 476 bytes**;
após descodificação, a textura WebGL usa RGBA. p5.js desenha no canvas RGBA `1024 × 512` e atualiza
a textura a 30 fps. O shader não usa textura de panorama e atualiza `uTime` a 30 fps. O conteúdo
visual é equivalente em tema e paleta, não uma comparação pixel a pixel.

O painel usa a mesma sequência em cada página: **1. Ligar câmera**, **2. Teste 1 — estático**,
**3. Teste 2 — animado** e **4. Copiar dados**. O nome do celular é informado na primeira página e
reutilizado nas outras pelo `localStorage` da mesma origem; se o browser não permitir armazenamento,
será preciso informá-lo de novo. O texto da interface usa cinza RGB **127, 127, 127**.

Cada teste executa **3 repetições**; cada repetição aquece por **5 s** e mede **15 s**. No Teste 1,
as três tecnologias são estáticas. No Teste 2, shader/p5.js animam e a imagem permanece estática
como linha de base. Para cada celular:

1. Use a mesma versão/URL base e o mesmo `?pr=` e `?aa=` nas três páginas.
2. Informe uma identificação curta, por exemplo `V3 GE8320`; a página a salva para as outras
   tecnologias. Ligue a câmera em cada página e mantenha essa condição nos três testes. HTTPS é
   necessário para a câmera em hospedagem remota.
3. Faça o **Teste 1** nas três páginas e depois o **Teste 2** nas três. Mantenha cada página visível,
   não caminhe, não mude de app e evite tocar na tela durante a medição.
4. A análise na própria página mostra a mediana de FPS, p95 e quadros lentos. Ao testar mais de uma
   tecnologia, o histórico local compara automaticamente os resultados do mesmo celular, modo,
   GPU, tamanho de tela, câmera, antialias e pixelRatio. O botão **Copiar dados** copia o JSON e a
   comparação; se o browser bloquear a cópia, seleciona o texto para copiar manualmente. O log inclui URL completa, hora local/UTC de início e fim,
   navegador, modelo reportado quando disponível, GPU, núcleos, memória aproximada, dimensões de
   tela, DPR, pixelRatio aplicado, antialias e dados da câmera. O navegador pode ocultar modelo/GPU;
   o campo de identificação manual é o rótulo confiável do aparelho.
5. Confira a mediana e a dispersão das três repetições; anote quedas térmicas/bateria e não misture
   rodadas com câmera, resolução ou pixelRatio diferentes.

O benchmark mede FPS, quadro médio, p95, máximo e percentagem de quadros acima de 33,4 ms. Também
regista preparação/compilação de materiais, bytes e dimensões da imagem e o tempo CPU de p5.js.
Não mede tempo GPU isolado: `p95` inclui renderer, câmera e composição. Os parâmetros de URL não controlam Android/Chrome, carga térmica, brilho ou
política de energia; por isso, alternar a ordem dos três testes entre aparelhos ajuda a reduzir
viés. Uma rodada leva aproximadamente **1 minuto por página e modo**, contando aquecimento e três
repetições (cerca de 6 minutos por celular para as três tecnologias nos dois modos).

### Verificado nesta versão (medido no browser)

Medido a **2026-10-22**, com **a cache desligada** (medir com uma versão antiga em cache é medir o
código que já não existe — a armadilha que a Fase 3 deixou registada), nas **5** páginas: as quatro
salas e o fixture. É a verificação final da **Fase 4** (bloco B10 de §9 do roadmap), com **três**
instrumentos: a bateria dos **doze testes da §10** (`tools/regression/acceptance.mjs`), a bateria do
**editor** (35 verificações, feitas na própria página) e o instrumento das **leis**
(`tools/scene/laws-selftest.mjs`, por linha de comando).

Desde **2026-10-21** as decisões da fase que dizem respeito ao que se vê — a chegada, o botão, a
transição, a travessia e o retrato das portas (D37 a D47) — têm baterias próprias, **arquivadas** em
`tools/regression/` com os seus resultados ao lado (§10 do roadmap):
`node tools/regression/<bateria>.mjs`. Sem isso, o que o roadmap afirma sobre a travessia só poderia
ser acreditado, não medido.

**A travessia — o salto no corte, nas 6 portas com retrato** (`tools/regression/seam.mjs`, meta
**0,50**, e a referência é que um passo a caminhar muda a imagem em ~1): gate 0 **0,31**, gate 1
**0,23**, scene1 3 **0,32**, scene2 4 **0,31**, scene2 6 **0,41**, scene3 7 **0,27** — **12 de 12**
verificações, contra **5 de 12** com a geometria anterior (0,70 a 1,49). Desde a Fase 7 a chegada é
comparada no **primeiro fotograma depois de a ponte sair**, e não 8 s depois: com fundos animados, o
que se via mais tarde era um instante qualquer da animação e não o corte. E desde o **D54** a câmara
**encosta à janela** no instante da travessia: o que fica no ecrã até a página seguinte pintar é o
destino, não a sala que se deixa. Os três instrumentos que
dizem **porque** está certo também ficaram no repositório: o conversor do retrato volta do cubo com
**0,39** de diferença e deslocamento **0** (`ida-e-volta.mjs`), a ponte a mostrar o mesmo conteúdo
custa **0,00** (`piso-ponte.mjs`) e a ponte e a chegada estão sobrepostas a **dx=0, dy=0**
(`desalinhamento.mjs`).

**A aceitação numa só bateria** (`tools/regression/twelve-tests.mjs`, novo): as cinco páginas, cada
uma com os seis grupos de testes que correm sem interação — **35 de 35** verificações. Sem ele, os
doze testes só se mediam a partir de um script de sessão, e a aceitação da fase não era reproduzível
por quem chegasse depois; a sonda `acceptance.mjs` continua a ser o que corre **dentro** da página, e
o runner é o que a vai lá buscar.

**A exposição — os doze testes, nas 5 páginas**

- **T8** (a consola), com a sonda instalada **antes** da carga: **0** erros, **0** avisos e **0**
  pedidos falhados nas cinco páginas
- **T9** (20 ciclos de criar e destruir portais): o registo e a árvore ficam como estavam — portão
  **2 → 2** (12 nós), cidade **2 → 2**, praia **3 → 3** (18), céu **1 → 1** (6) e fixture **4 → 4**
  (24), com **0** ouvintes de teclado deixados no `document`
- **T4** (a janela): no **portão** o alfa é **255 dentro** e **0 fora**; nas salas, dentro vê-se o
  destino e fora a sala (alfa **255** fora)
- **T5** (duas portas, uma atrás da outra): **0** px da moldura de trás dentro da janela da frente,
  **1 675** px de controlo **fora** dela e **0** de ruído entre dois desenhos iguais — igual nos cinco
- **T6** (o clique na obra): abre o modal com o `path` do catálogo nas **quatro** salas e no fixture
  (no portão não é aplicável: não há obras nessa dimensão)
- **T7/T11** (a chegada), nas três salas: o visitante aparece **exactamente** no ponto que o
  `arrivalPoint` calcula (cidade `[-25, 1.6, -46]`, praia `[-25, 1.6, -81]`, céu `[0, 1.6, -121]`),
  **0** travessias a andar para dentro da sala e **1** a meia volta
- **T10/T12** (o retrato), nas **8** portas de retrato a 12 m e a 30 m: tingir a dimensão derivada
  muda os pixels **dentro** da janela e **nenhum** fora da moldura (portão **0** fora, salas **0**)
- **T2/T3** (varredura de poses), nas cinco: **84** poses (**84** avaliadas, 0 não avaliáveis), **0**
  com o bordo cortado, **0** falhas em **20 686** amostras, **420** controlos a **0**, método válido,
  ~1,0 s. O número de amostras varia com a janela; as falhas é que têm de ser zero
- **O que o visitante vê ao chegar** (pendência **R11**, fechada no B10): à frente do ponto de
  chegada e **dentro do primeiro plano**, cidade **1** de 5 obras, praia **1** de 3 — e o céu, que
  não tinha **nenhuma**, passou a ter **2** de 2

**O editor — 35 de 35** (as três leis que a página sabe responder, o desfazer, a guarda de saída).
Passou a **34 de 35** no B20 (a verificação que exige «Avisos: 0» falhava pelo aviso da **L14** sobre
os retratos grandes do **D47**) e voltou a **35 de 35** na Fase 7, quando os retratos voltaram ao
padrão `2048 × 1024`.

- Os **6** mundos validam com `Erros: 0 · Avisos: 0 · Por verificar: 0` — a **L9** e a **L14**
  deixaram de ser «não verificadas» no browser (o asset existe; a imagem mede 2:1), e a **L14**
  deixou de avisar: com o fundo shader os retratos não carregam o céu nem o mar e cabem no padrão
  (ver «Formato e tamanho das imagens»)
- **Importar→exportar** os 5 mundos sem tocar em nada: **0 diferenças**, byte a byte
- Uma avaria injectada de cada vez: um asset que não existe acusa a **L9** e um retrato no lugar do
  panorama acusa a **L14** (`1226×855`, que não é o 2:1)
- Editar → a marca «alterado» aparece e o **`beforeunload`** é cancelado; **desfazer** devolve o
  ficheiro **byte a byte** e o aviso desaparece; **exportar** com erros é **recusado** (0 ficheiros)
- A pilha do desfazer pára nas **50** alterações (60 feitas, 50 instantâneos, o último volta
  exactamente 50 passos)
- **O céu, editado só pelo editor** (as duas obras movidas para `z = -131`, em frente da chegada):
  o ficheiro que saiu do editor difere do anterior **só nas duas posições**, e a bateria no céu dá
  os mesmos números de antes (T4, T5, T6, T9 `1 → 1`, T10/T12 e T2/T3)

**As leis, na linha de comando:** `node tools/scene/validate.mjs` sai com **0** (5 mundos, **12**
portas, grafo todo alcançável a partir do portão, **L19** sem falhas, **4** arranques iguais fora do
`<base>`), e `node tools/scene/laws-selftest.mjs` dá **21 de 21** avarias detectadas, com o controlo
(nada injectado) **limpo**.

**O que não foi re-medido nesta versão:** a captura no **telemóvel** (390×844) e o D-pad (**4,2 m**
em 250 ms) — os dois são da v0.0.6 e nem a Fase 4 nem a Fase 6 lhes tocaram. O **T1**, que aqui
faltava, passou a ser medido pela verificação da Fase 6 (ver o ponto seguinte).

**A Fase 6 — os testes por um comando (medido a 2026-10-24, e estendido na Fase 7).** Hoje
`node tools/regression/all.mjs` corre o validador, as leis, os doze, as portas/chegada e as duas
línguas, e devolve um código de saída: **5 de 5** baterias em **128,5 s**; com `--full`, as catorze
arquivadas juntam-se e dão **19 de 19** em **718,9 s**.

- **O T1, agora automatizado** (`tools/regression/traversal-tests.mjs`): as **12** portas dos 5
  mundos — **10** navegam uma vez e chegam ao destino com `?from=<origem>`, **2** mudam a dimensão
  uma vez e não navegam (a porta 2 do fixture vive na dimensão 1, e o runner põe a cena nessa
  dimensão antes de a atravessar)
- **O T7/T11, idem:** as **8** chegadas (as 4 páginas com `?from=`) ficam no ponto que o
  `arrivalPoint` calcula, com **0** travessias a andar para dentro e **1** a meia volta
- **O T10/T12 voltou a zero estrito:** **0** px fora da moldura nas 5 páginas. A sangria que a R16
  registou tinha três causas — a aresta antialiased das barras (a régua ganhou 2 px de margem), uma
  textura ainda a assentar (as capturas esperam pela descodificação) e uma **obra em vídeo** a
  mudar entre as duas capturas (a medição pára os vídeos)
- **A varredura de poses recusa** o resultado quando a câmara se mexe (`fault: 'camera'` prova-o):
  `refused`, e não `fail`
- **A travessia:** as **6** portas numa sessão fria a **0** fotogramas escuros, com a costura a
  **0,17–0,41** (meta **0,50**); a ponte passou a esperar pela descodificação da imagem (R17)

**A versão publicada** (<https://rodrigorez.github.io/zonas12/>, o `main` servido pelo GitHub Pages),
medida no browser depois do *push*, com a cache desligada — **7 de 7**:

- o **editor publicado** abre a cidade com a cena construída (**5** malhas) e o relatório em
  `Erros: 0 · Avisos: 0 · Por verificar: 0`; «Desfazer» começa desactivado e a marca «alterado»,
  escondida
- o **portão publicado** passa o **T4** (alfa **0** fora da janela), o **T5** e o **T9** (`2 → 2`,
  12 nós), o **T10/T12** (as **4** portas de retrato, 0 px fora da moldura) e o **T2/T3**
  (**84** poses, **0** falhas)
- o **céu publicado**, aberto com `?from=scene2`, tem as **duas** obras no primeiro plano da chegada
  — o R11 está na versão que o mundo vê

**A chegada por uma porta (D37, o B11).** O autor testou o publicado e viu o ecrã de entrada a
repetir-se em cada portal. Medido antes de mexer, com câmara falsa e a contar os pedidos a
`getUserMedia`: **a câmara só é pedida no portão** (o único mundo com `cameras.real.enabled: true`) e
**nunca** numa mudança de dimensão — o que voltava era o botão, porque cada mundo é uma página. Com a
correção, e medido de novo: **5 de 5** — a primeira visita fica com o botão à espera e **0** pedidos;
uma sala por uma porta entra sozinha (**0** pedidos); o portão por uma porta arranca sozinho com **1**
pedido e stream; e, com a câmara a rejeitar, o botão **volta** com a mensagem. A bateria dos doze
manteve os números no portão, na cidade e no fixture.

**A Fase 7 — o que os documentos prometiam e o código não fazia (fechada a 2026-10-25).** Dez
blocos, cada um com o seu número, e a mesma regra da Fase 6: o que não foi medido não se declara
fechado. O que a fase entregou:

- **B1** — as duas afirmações falsas que restavam no README (com o plano)
- **B2** — o catálogo em duas línguas: `i18n/en.json` com as **203** chaves de `pt.json`, e o
  `tools/regression/i18n.mjs` a comparar chaves, marcadores e frases, mais `?lang=en` na exposição e
  no editor — **9 de 9**. A bateria corre **por omissão**: uma chave nova que entre só no `pt.json` é
  uma frase portuguesa a aparecer a quem abrir em inglês (foi assim que se encontrou o
  `editor.artwork.asset`, em falta desde a Fase 4)
- **B3** — o lote por dimensão: um comando apaga as obras de uma dimensão, a pergunta diz quantas
  são, e o «Desfazer» devolve-as todas juntas — **8 de 8**
- **B4** — o catálogo de assets editável (`id`, `path`, `type`, `alt` por língua), com a **L9** a
  aparecer ao escrever um caminho que não existe e a desaparecer ao corrigi-lo — **10 de 10**
- **B5**/**B6**/**B7** — os quatro valores que a **D30** dava como validados e não construídos:
  dimensão `kind: "color"` (**D56**), `interaction: "link"` a **navegar** (**D57**) e obra
  `kind: "model"` (GLTF) e `"text"` (**D58**). O fixture é `data/worlds/r9.json`, que se abre com
  `?scene=r9` — **6 de 6** na cena e **8 de 8** nos painéis
- **B8** — os portais em movimento (**D59**): `spin` e `orbit`, com o período em segundos, a colisão
  lida do mundo (a travessia acontece onde a porta **está**) e o `prefers-reduced-motion` a pará-los
  — **6 de 6**; e os doze testes com uma porta a rodar no fixture, nos números da Fase 6
- **B9** — o shader em produção, já descrito acima
- **B10** — este fecho

No caminho, três decisões nasceram do telemóvel do autor e não do plano (**D52** o giroscópio,
**D53** a janela ao vivo, **D54**/**D55** a travessia), e a costura das nuvens ficou estável: o destino
passou a ser congelado antes de se medir o corte, porque o quadro da ponte já era capturado com os
shaders parados — comparar com um destino a animar media o tempo que passou, não o corte. De
**0,34–0,56** para **0,41** em duas corridas seguidas.

**O que fica aberto:** o **R14**/**R15**, o A/B do shader nos **três** aparelhos — há dois medidos
(o telemóvel fraco e o desktop) e falta o terceiro.

**A porta do portão mostra a realidade (D38, o B12).** O autor reparou que, na cidade, a porta de onde
veio aparecia só como pórtico. É verdade e era o dado (`window: none` desde a **D29**), mas a
expectativa era outra: ver a **câmara**. Provado primeiro numa sonda — uma sala com uma dimensão
`kind: "camera"` e uma porta `dimension-pair` com ela mostra a câmara dentro da moldura, porque uma
dimensão de câmara não desenha nada e o rectângulo fica transparente sobre o vídeo. Depois, no dado:
a cidade e a praia ganharam essa dimensão e as portas para o portão passaram a mostrá-la, com a
matriz da **L18** a ganhar a exceção «par com a câmara + `navigate` para o mundo de entrada». Medido:
`validate.mjs` **0**, `laws-selftest` **21 de 21** (a avaria nova — uma janela de câmara a navegar
para uma sala — é detectada), capturas nos **dois lados** da porta na cidade e de frente na praia,
a bateria das duas salas a passar (T4, T5, T6, T9 `2 → 2` e `3 → 3`, T10/T12, T2/T3), a consola das 5
páginas com **0** erros e **0** avisos, e o editor em **35 de 35** com importar→exportar
**byte-idêntico** — o painel do portal não reescreve a porta da câmara. As salas passam a **pedir a
câmara** (é o preço de a mostrarem); se for recusada, a janela não tem imagem e a mensagem diz porquê.

**O nome das portas e das obras (D39/D40, os B13 e B14).** Duas perguntas do autor, resolvidas no
mesmo dia: «vamos colocar o nome nos portais» e «… isso para obras também». Com a tecla **D** cada
porta diz `#2 · Cidade 360º ↔ Realidade → Portão` e cada obra diz
`#0 · galeriaFoto1 · Cidade 360º · modal`, tudo tirado do dado e desenhado por **um** sprite
partilhado (`js/modules/label.js`). Medido: **23 de 23** nas portas (0 nomes sem `D`, um por porta
com ela, nos 4 mundos, e 10 portas com nome criadas e destruídas sem deixar textura nem nó), **21 de
21** nas obras (idem, mais o portão sem obras e as obras re-criadas pelo editor), a bateria dos doze
nos 5 mundos com os mesmos números, o editor em **35 de 35** e a consola com **0** erros e **0**
avisos.

Foi esta medição que apanhou um defeito no instrumento: as importações do `acceptance.mjs` eram
absolutas a partir da raiz (`/js/scene/arrival.js`), o que funciona em `127.0.0.1:8123` e dá 404
debaixo de `/zonas12/`. Passaram a relativas ao módulo, e é por isso que a bateria corre agora nos
dois sítios.

### Limitações e decisões assumidas

- **255 dimensões distintas** visíveis ao mesmo tempo (8 bits de stencil); portais por
  dimensão não têm limite.
- Onde uma moldura cruza uma janela, a parte da espessura (0,2 m) que fica **atrás** do
  plano da janela é tapada por ela — a moldura aparece um pouco mais fina aí.
- Uma obra que esteja **à frente** de uma janela desenha-se por cima do conteúdo dela.
- O cursor do A-Frame não leva teste de stencil (é elemento de interface).
- A dimensão 0 não tem conteúdo 3D: dentro das janelas que a mostram vê-se a imagem real
  da câmara (o canvas é transparente).
- **O editor cria assets e apaga obras em lote, desde a Fase 7**: o painel dos assets edita o
  catálogo do mundo (**B4**) e o painel da dimensão apaga as obras de uma dimensão de uma vez
  (**B3**). Um mundo novo continua a começar com o catálogo que se lhe escrever — criar a **pasta**
  de um mundo é da linha de comando (**D31**), e isso não mudou.
- **O que o esquema promete é construído**: obras `kind: "model"` (GLTF) e `"text"`, fundos de
  dimensão `kind: "color"` e `interaction: "link"` a navegar entraram na cena na Fase 7
  (**D56**–**D58**). O aviso do validador que os denunciava saiu com eles, e o editor passou a
  oferecê-los. Uma porta pode andar (**D59**), e o movimento respeita o `prefers-reduced-motion`.
- **A pré-visualização não navega**: atravessar uma porta de mundo dentro do editor não muda de
  página (aviso na consola); o editor serve para arrumar a sala, não para a visitar (**D32**).
- **O editor grava pelo servidor da ferramenta, e só quando ele responde** (**D48–D51**): sem
  servidor, o botão «Gravar» não existe e o caminho é o «Exportar» da **D2** — pôr o ficheiro em
  `data/worlds/` e commitá-lo continua a ser do autor, e é por isso que a marca «alterado» e o
  aviso de saída existem.
- **As salas pedem a câmara** (desde a **D38**): é o preço de a porta do portão a mostrar ao vivo.
  Quem recusar vê a mensagem da câmara e a janela dessa porta sem imagem; o resto da sala não depende
  dela.
- **O botão de entrada nunca aparece com a câmara ligada** (**D41**): ele é a porta para a câmara, não
  um «play». Depois da primeira autorização o browser guarda-a, e a visita seguinte arranca sozinha —
  no telemóvel é o que faz o D-pad aparecer sem mais nenhum toque. Em browsers que não dizem se a
  permissão existe (Safari), o botão continua a ser o gesto que a pede.
- **Ao atravessar um portal não se vê o botão** (**D42**): cada mundo é uma página (D24), e o botão
  está escondido no markup — a decisão de o mostrar é tomada **antes** de a cena carregar. Enquanto os
  assets chegam, o que se vê é «Carregando…» (com a rede de um telemóvel, alguns segundos).
- **Ao atravessar um portal também não se vê um ecrã preto** (**D43**): a página que sai deixa o
  **último quadro** que estava a mostrar e a que chega pinta-o como primeira coisa, antes de ter cena;
  quando o mundo está construído, o quadro sai **de uma vez**, num só fotograma (**D44**), e só depois
  de a câmara ter imagem — porque o que está por baixo da cena é o vídeo dela (**D45**).

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
| Uma página, uma cena, quatro dimensões | **Uma cena por mundo**, com o seu ficheiro (`data/worlds/`) e o seu endereço: a raiz é o portão e `/scene1/`, `/scene2/` e `/scene3/` são as salas — o **mesmo `index.html`**, com o `<base>` a apontar um nível acima |
| O portal ligava duas dimensões (`dimensionA`/`dimensionB`) | O portal tem **dois eixos**: `window` (o que a janela mostra: o par, um retrato ou nada) e `action` (o que a travessia faz: ficar, navegar ou nada) |
| A travessia mudava a dimensão ativa | A **porta de mundo** mostra um **retrato** do destino (uma dimensão derivada, com paralaxe porque a esfera não segue a câmara) e a travessia **navega** para a URL do outro mundo |
| Técnica do stencil | **Igual dentro de cada sala** — as leis L1–L8 e os testes T1–T9 continuam a valer, e a porta de mundo entra na mesma máquina (máscara, moldura, valor de stencil) |

Como o isolamento é por endereço, **nada do outro mundo é lido** pela página de origem: só
atravessam o *slug* do destino (na própria porta) e um parâmetro opcional `?from=<slug>`, que é o
que faz o visitante aparecer **atrás da porta inversa** — com o regresso a um passo, e sem lhe pedir
que ative a exposição outra vez (**D37**: a chegada por uma porta arranca sozinha; o ecrã de entrada
fica para a primeira visita, e volta se a câmara for recusada). A porta por onde se volta ao portão
mostra a **realidade ao vivo** (**D38**): a sala declara uma dimensão `kind: "camera"`, uma dimensão
de câmara não desenha nada, e a janela fica transparente sobre o vídeo — a câmara vê-se dos dois
lados da porta.
`node tools/scene/validate.mjs` confere isso tudo do lado do dado: as leis dos mundos, o **grafo**
(todas as salas alcançáveis a partir do portão e **L19** — toda a porta tem uma chegada no destino,
que é o defeito que a praia teve até ao B7), e os quatro **arranques** (a pasta é o slug, o `<base>`
aponta para a raiz e os quatro são o mesmo ficheiro fora dessa linha — D28). O formato dos dados, as
leis (L9–L19), os testes (T10–T12) e o estado de cada bloco estão em
[docs/ROADMAP.md](docs/ROADMAP.md).

**O que falta na fase:** nada — a fase fechou no B20, com a documentação, o instrumento da aceitação e o marco `v0.0.9`.

**A divisão decidida (D24)** são **quatro mundos**: o portão na raiz (`gate`, com a câmara/AR) e as
salas `scene1`, `scene2` e `scene3` (a cidade, a praia e o céu), uma dimensão cada, com as **8 portas de hoje** a passarem a
navegar — seis com retrato e as duas que voltam para o portão sem janela (não há imagem do portão, e
um retrato emprestado mentiria). O formato **v3** (**D25**) tem os dois eixos na própria porta
(`window {kind, dimensionA, dimensionB, asset, radius}` e `action {kind, target}`); o retrato é uma
**dimensão derivada** na banda reservada da L15 (**D26**) — duas portas que mostrem o mesmo retrato
partilham 1 textura e 1 valor de stencil, e é o **fixture** que o exercita, com duas portas de
retrato; os assets estão divididos por tipo, com os retratos em `assets/previews/` (**D27**, com a
emenda da **D46**: desde o B20 há **um por porta**, com o nome `<destino>-de-<origem>`, porque a
janela passou a mostrar a **vista da chegada**); e o
slug de cada mundo sai do próprio caminho, com os **4 arranques iguais fora da linha do `<base>`**
(**D28**, emendada no B7). A praia, que trazia duas portas iguais para a cidade, ficou com uma e
ganhou o regresso ao portão (**D29**). A tabela de correspondência da migração, os **11 blocos**
(B0–B10) e as metas medidas com o instrumento de cada uma estão na §9 do roadmap.

## A página de edição (Fase 4, fechada em 2026-10-20)

> A fase correu **bloco a bloco** — de B0 (o plano) a B10 (esta documentação) — e cada bloco está em
> [docs/ROADMAP.md](docs/ROADMAP.md) §9 com o que entregou e **mediu**; as decisões que a fecharam
> (D30–D47) estão em §11. O marco é a branch `v0.0.9`.

`editor.html` é uma **ferramenta**, não um mundo: não tem slug, não se publica, e a exposição não a
conhece (a regra da D4, verificada dos dois lados — o editor importa o núcleo, os módulos e a cena, e
nenhum desses ficheiros importa o editor). Abre-se com `?world=<slug>`:

```
http://127.0.0.1:8123/editor.html?world=scene1
```

**O que faz, por painel** (o que §7 do roadmap pede, coluna a coluna):

| Painel | O que se edita |
| --- | --- |
| **Mundo** | O nome do mundo por língua, as portas que **abrem** para outros mundos (com o retrato e o raio), o **mapa da casa** (que diz, porta a porta, se o destino existe e se declara a chegada — L11 e L19) e o bloco «nova sala», que cria a porta e mostra o comando da ferramenta |
| **Dimensão** | O fundo 360º (imagem, vídeo ou câmara), o raio, o nome por língua — com inserir e excluir |
| **Obra** | As obras agrupadas por dimensão: asset, posição, rotação, tamanho, interacção e título por língua — com inserir e excluir |
| **Portal** | A porta inteira: posição, rotação, largura, altura, caixa de colisão, gatilho, moldura, `ownedBy`, os **dois eixos** e a chegada |
| **Câmara** | A posição e a velocidade do jogador, a webcam (como **dado**) e o botão «usar a posição em que estou» |

**O contrato, e as decisões que o fixam:**

- **A mesma cena, o mesmo validador.** A pré-visualização constrói a cena com o `buildScene` da
  exposição e o relatório de problemas sai do `js/scene/validation.js` — não há uma segunda
  validação para divergir. No browser ela responde também às perguntas que eram só da linha de
  comando: o asset existe (**L9**) e a imagem mede 2:1 (**L14**), por `Image` e por `HEAD`.
- **Exportar é o único caminho para o ficheiro** (D2). O texto exportado é **byte-idêntico** ao
  ficheiro quando nada se editou (2 espaços e `\n` no fim), e a exportação **recusa** um mundo com
  erros: o que sai é o que se commita. Avisos não a travam.
- **Desfazer** por instantâneos do JSON (**D35**, até **50**), com `Ctrl+Z` fora dos campos de texto;
  a marca «alterado» e o aviso antes de fechar dizem se o trabalho já saiu num ficheiro (**D32**).
- **A pré-visualização não navega** (**D32**): atravessar uma porta de mundo diz na consola e fica.
- **Editar re-cria a entidade** (**D33**): mover uma obra reconstrói a malha dela, não a cena; a cena
  inteira só é reconstruída quando a estrutura muda (inserir, excluir, trocar de mundo).
- **Não oferece o que a cena não constrói** (**D30**): geometria de modelo, texto 3D, cor de fundo e
  `interaction: "link"` não estão nos formulários, e um ficheiro que os traga mostra-os desactivados
  com a nota da decisão — e o validador avisa.
- **A pasta de um mundo novo é da ferramenta** (**D31**): o editor exporta `data/worlds/<slug>.json`
  e diz o comando; `node tools/scene/new-world.mjs <slug>` cria a pasta e o arranque (o mesmo
  `index.html` com `<base href="../">`).

**O primeiro uso real (B10).** As duas obras do céu estavam **atrás** do visitante que chega da
praia: a chegada é em `z = -121` a olhar para −Z e as obras em `z = -110`. Foram re-arranjadas **no
editor** (posições `[-6, 1.5, -131]` e `[6, 1.5, -131]`, vista na pré-visualização), exportadas e o
ficheiro substituído — e o resultado mediu-se: **0 → 2** obras no primeiro plano da chegada, com a
bateria do céu nos mesmos números de antes e o `validate.mjs` a sair com **0**.

**O botão de entrada segue a câmara (D41, o B15).** Depois do teste no telemóvel, o autor pediu que o
botão «ATIVAR EXPOSIÇÃO» desaparecesse quando a câmara está ativa — mesmo com a câmara fora da vista.
Passou a ser assim e está medido em três instâncias de Chrome, porque o que muda é a permissão:
**7 de 7** — sem permissão a primeira visita fica com o botão e **0** pedidos (a regra do gesto); uma
chegada sem permissão tenta, falha e devolve o botão com a mensagem; com a permissão **já dada** a
visita arranca sozinha (**0** toques, botão fora, câmara ligada), tanto no portão como **numa sala**
onde a câmara só se vê pela janela da porta; e no **telemóvel** (390×844, toque) o botão sai e o
**D-pad entra**. Em Safari, que não responde se a permissão existe, fica a regra do gesto.

**A transição entre portais (D42, o B16).** Um vídeo do autor (`.harness/imagenTeste/botão.mp4`) mostrou
o botão «ATIVAR EXPOSIÇÃO» a aparecer sozinho sobre um ecrã preto ao atravessar um portal — porque o
botão estava visível no markup desde a primeira pintura e só era escondido **depois** de a cena
carregar (que espera por todos os assets). Passou a estar escondido no markup, com a decisão tomada
**antes** do trabalho pesado: a chegada nunca o mostra e vê-se «Carregando…»; a primeira visita
vê-lo **antes** dos assets (botão aos **357 ms**, primeira porta aos **373 ms**). Medido com uma sonda
que anota cada mudança, numa rede de 800 kB/s: **9 de 9**. E a permissão (D41) ganhou um tempo-limite
de **1 s** — sem ele, uma resposta que não chegasse deixava a exposição presa em «Carregando…» (foi o
que se mediu com a rede estrangulada).

**A ponte de imagem entre mundos (D43, o B17).** Um segundo vídeo do autor
(`.harness/imagenTeste/02.mp4`) mostrou, ao atravessar uma porta, a sequência «imagem do mundo que
vou → quadro preto → o mundo» — duas vezes. A causa não era a cena: **cada mundo é uma página (D24)**,
e a página que chega não pinta nada até a cena estar construída; no meio ficava o preto do
`#container-video`. Medido no browser, com fotogramas a cada ~50 ms: **2 amostras escuras** (0,0 e 1,1
de brilho) e a primeira imagem do destino **180 ms** depois. A correção é a única imagem que serve —
a que o visitante já estava a ver: a página que sai guarda o quadro em `sessionStorage`
(`js/arrival-frame.js`, um script **clássico** porque tem de pintar antes da primeira pintura) e a que
chega pinta-o antes de tudo, com o `js/app.js` a desvanecê-lo quando há cena. Medido: **0 amostras
escuras** em 89, o quadro é a imagem do ecrã (**76 kB**, 780×1688, brilho **191,5** num ecrã de
telemóvel), sai aos **746 ms**, e **7 de 7** na bateria do bloco — incluindo a chave de uso único
(recarregar não repete a imagem) e a guarda de **10 s** para uma cena que não chegue. Na **versão
publicada** (GitHub Pages), a mesma travessia a pé: **122** amostras, **0** escuras.

E a travessia não se anuncia (**D44**): o quadro que veio da página anterior sai **de uma vez**, num só
fotograma, e enquanto ele cobre o ecrã não aparece a linha «Carregando…» — os dois sinais que ainda
diziam que algo tinha acontecido (medido: **0** desvanecimentos e **0** linhas na travessia, **8 de 8**).
O que sobra é o que a sala de destino tem e o retrato dela não tinha — as obras que estão em frente da
chegada —, e isso mede-se: **3,94** de diferença entre o quadro e o mundo, contra **2,69** do maior
salto de um passo a caminhar.

E não aparece nenhum fotograma da câmara dentro da travessia (**D45**): o que está por baixo da cena é
o vídeo dela, e duas coisas o mostravam — a ponte saía **58 ms antes** de o `<video>` ter imagem, e o
`resize` da câmara limpava o buffer do canvas. A ponte espera agora também pelo primeiro fotograma
**apresentado** pela câmara (no máximo **3 s**; uma câmara recusada resolve logo), e o `resize` é seguido
de uma renderização imediata (**0,5 a 5,2 ms** sem desenho, dentro do mesmo fotograma).

## A gravação direta (Fase 5, fechada em 2026-10-23)

> O plano, as decisões (**D48–D51**) e o que cada bloco entregou e mediu estão em
> [docs/ROADMAP.md](docs/ROADMAP.md) §9 e §11.

`tools/server/serve.mjs` é o **servidor da ferramenta**: serve a pasta do projeto (o que antes era o
`python -m http.server`) e aceita gravar um mundo. É uma ferramenta, **não** a publicação — o GitHub
Pages não corre Node —, e por isso nada disto muda o que se publica.

```
node tools/server/serve.mjs                  a exposição em http://127.0.0.1:8123/
node tools/server/serve.mjs --port 9000      noutra porta
```

- **Só escuta em `127.0.0.1`** e recusa arrancar noutro endereço: um servidor com uma porta de
  escrita não pode ficar à vista da rede. Confere `Host` e `Origin` em cada pedido de gravação.
- **Não serve o que não se publica**: `.harness/` (onde ficam as cópias de segurança), `.git/`,
  `node_modules/` e o que começa por ponto respondem **403**, e um caminho com `..` também.
- **O editor pergunta-lhe se pode gravar** com um `HEAD` na raiz e o cabeçalho `X-Zonas12-Serve`;
  sem esse cabeçalho (GitHub Pages, `python -m http.server`) o botão «Gravar» **não aparece** e o
  «Exportar» fica exactamente como estava (**D49**). E, como o «Desfazer», o «Gravar» só acende
  quando há o que gravar: gravar duas vezes o mesmo texto deixaria cópias de segurança a mais.
- **O servidor recusa o que o editor recusaria** (**D50**): valida com o **mesmo**
  `js/scene/validation.js` e o disco, e não escreve nada quando o mundo tem erros (**422**), quando o
  `world.slug` não é o do endereço (**400**), quando a `version` não é a do esquema (**400**) ou
  quando o mundo não existe em `data/worlds/` (**404** — gravar **substitui**, não cria: criar um
  mundo continua a ser `node tools/scene/new-world.mjs`, **D31**).
- **Cada gravação deixa uma cópia** do conteúdo anterior em
  `.harness/backups/worlds/<slug>/<AAAAMMDD-HHMMSS-mmm>.json` (**D51**), e a linha de estado do
  editor diz onde ela está. A escrita é atómica (`*.tmp` + `rename`).
- **O que é gravado é o que se exportaria**: o mesmo texto do «Exportar» (2 espaços e `\n` no fim),
  e por isso o `git diff` mostra só o que foi editado.

O instrumento é `node tools/server/selftest.mjs`: **34** verificações contra uma raiz temporária — o
que ele serve, o que recusa servir, o que recusa gravar e o que faz quando grava.

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
| `gate` (o portão, na raiz) | 0 — realidade | Vê-se a câmara | `0 → scene1`, `1 → scene2` — em `x = ∓6`, `z = -8` |
| `scene1` (a cidade) | 0 — cidade 360º | `cidade-360` + 5 obras | `2 → gate`, `3 → scene2` — em `x = ∓25`, `z = -45` |
| `scene2` (a praia) | 0 — praia | `praia` + 3 obras | `4 → scene1`, `5 → gate`, `6 → scene3` — em `x = -25`, `x = 25` e `x = 0`, `z = -80` |
| `scene3` (o céu) | 0 — céu 360º | `skycloud` + 2 obras | `7 → scene2` — em `x = 0`, `z = -120` |

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
- `<script src="js/arrival-frame.js">` no início do `<body>` (D43): é o único script **clássico** do
  projeto, e é de propósito — tem de pintar o último quadro da página anterior **antes** da primeira
  pintura desta, e um módulo só corre depois de carregar a sua árvore de importações.
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

- **A página de edição** (Fase 4): `editor.html` abre um mundo, edita-o por **cinco painéis**,
  mostra a pré-visualização com a mesma cena da exposição, valida com o mesmo módulo e **exporta** o
  JSON — com desfazer (50 passos), marca «alterado», aviso antes de fechar e a exportação a recusar
  um mundo com erros. Não escreve em disco: o ficheiro é do autor (D2)
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
  na linha de comando (`node tools/scene/validate.mjs`) e que o editor corre a cada tecla (Fase 4)
- **Um endereço por mundo** (Fase 3B, B7): a raiz é o portão e as salas são pastas — `/scene1/`,
  `/scene2/`, `/scene3/` — servindo todas o **mesmo `index.html`**; o mundo sai do caminho
- **`?scene=<mundo>`**: força um mundo (`scene1`, `scene2`, `scene3` ou o fixture `example`), para
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
- Pressione a tecla **D** para ativar/desativar o modo debug (mostra a caixa de colisão e o nome de
  cada porta e de cada obra)
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

Durante o desenvolvimento, você pode ativar o modo debug para visualizar a caixa de colisão do portal
e o **nome de cada porta e de cada obra** (tecla **D**):

- A caixa de debug aparece como um wireframe azul semi-transparente (nome `portal-<id>-debug-box`)
- Tem sempre as mesmas dimensões X, Y e Z, posição e rotação que a caixa de colisão (`box`, `boxPosition` e `boxRotation`)
- Serve para ver exatamente onde a travessia dispara (é uma caixa por portal)
- Como o resto da geometria do portal, a caixa de debug é tapada pelas janelas que lhe
  ficam à frente, pela profundidade (não tem teste de stencil próprio)
- Por cima da porta aparece o **nome** dela (`portal-<id>-label`, decisão **D39**): o id, o que a
  janela mostra e para onde a travessia leva, tudo tirado do dado — por exemplo
  `#2 · Cidade 360º ↔ Realidade → Portão` (o par de dimensões, pelos nomes delas) ou
  `#3 · retrato-praia → praia` (o retrato e o mundo de destino, pelo *slug*, que é o nome de um
  mundo — **D28**; o portão é a exceção e tem o nome do catálogo)
- Por cima de cada **obra** aparece o nome dela (`artwork-<id>-label`, decisão **D40**) com a mesma
  forma: `#0 · galeriaFoto1 · Cidade 360º · modal` — o título (quando o dado tem um, **D21**) ou o id
  do asset, a dimensão a que pertence (pelo nome) e o que o clique faz (`modal`, `none` ou `link`,
  que é o campo tal como se escreve no ficheiro)
- O nome é um *sprite* e o texto é pintado **uma vez**: lê-se igual dos **dois lados** da porta, o que
  importa a quem aterra atrás dela, e não custa nada por frame. No editor aparece sempre, sem tecla
  nenhuma; o mesmo sprite serve às portas e às obras (`js/modules/label.js`)
- A consola só avisa se um ID de portal estiver fora do intervalo (`[portal] ID … out of range …`)

## Tecnologias Utilizadas

- **A-Frame 1.8.0**: Framework de realidade aumentada/virtual
- **HTML5/CSS3**: Estrutura e estilo da aplicação
- **JavaScript ES6+**: Lógica da aplicação e componentes personalizados
- **Three.js**: Biblioteca 3D integrada ao A-Frame

## Como Usar

### 1. Executar o Projeto

1. **Sirva a pasta por HTTP** — abrir o `index.html` com duplo clique **já não funciona**:
   a entrada é um módulo ES (`js/app.js`) e os módulos não carregam por `file://`. Na raiz do
   projeto: `node tools/server/serve.mjs` e abra `http://127.0.0.1:8123/`. É o servidor da
   ferramenta (§ «A gravação direta»): serve como o `python -m http.server 8123` e acrescenta o
   «Gravar» ao editor. Sem Node, o `python -m http.server 8123` continua a servir a exposição e o
   editor — só não grava.
2. Clique no botão "ATIVAR EXPOSIÇÃO" — que **só existe enquanto não há câmara**: numa visita
   seguinte, em que o browser já guarda a autorização, a exposição arranca sozinha (decisão **D41**);
   e ao atravessar um portal o botão **não aparece** — a página carrega com a linha «Carregando…»
   (decisão **D42**) e com o último quadro da página anterior por baixo (decisão **D43**)
3. Permita o acesso à câmera quando solicitado (é a dimensão 0, a realidade)
4. Explore o ambiente utilizando o mouse (desktop) ou o D-pad (mobile)

O **endereço escolhe o mundo**: a raiz é o **portão** e cada sala tem a sua pasta —
`http://127.0.0.1:8123/scene1/`, `/scene2/` e `/scene3/`. As três salas servem o **mesmo `index.html`**
da raiz (o `<base>` é que muda), e atravessar uma porta de mundo navega para a pasta do destino.

Quem quiser experimentar sem mexer na exposição pode forçar um mundo com `?scene=`
(`http://127.0.0.1:8123/?scene=example`): carrega o `data/worlds/example.json`, o mundo de ensaio
com duas dimensões e **duas portas de cada tipo** (o par de dimensões ao vivo, atravessável, e o retrato que navega) — `?scene=scene1`, `?scene=scene2` e `?scene=scene3` também
funcionam. E `&from=<mundo>` diz de que mundo se vem, o que faz o visitante aparecer atrás da porta
de chegada: `/scene2/?from=scene1`. O mundo de ensaio do fundo shader (Fase 7, **R14**/**R15**) é
`?scene=shader`, e `&shader=0` mostra a imagem de reserva em vez do shader — em qualquer mundo.

### 2. Personalizar Conteúdo

- Modifique as imagens e vídeos em `assets/{panoramas,artworks,video,previews}/`
- Atualize os caminhos no **catálogo `assets`** do mundo (`data/worlds/<mundo>.json`) — cada
  caminho aparece lá **uma vez**, e as dimensões e as obras apontam para ele pelo nome (D20). O
  catálogo é a única parte que o editor não edita: as dimensões, as obras e as portas editam-se
  nos painéis (passo 6)
- Para acrescentar um **mundo**: `node tools/scene/new-world.mjs <slug>` cria a pasta e o arranque
  (D31), o editor grava (ou exporta) o `data/worlds/<slug>.json`, e a porta que o liga ao portão
  cria-se no painel «Mundo» — com o retrato do destino em `assets/previews/` e o `radius` do retrato
- As imagens têm de ser **2:1** e ficam melhor com 2048 de largura (lei L14); a ferramenta
  `tools/assets/normalize.mjs` corta e reduz sem ampliar
- Valide antes de publicar: `node tools/scene/validate.mjs` (confere todos os mundos e o grafo)

### 3. Correr a verificação (um comando)

Na raiz do projeto, com o Node instalado:

```powershell
node tools/regression/all.mjs
```

Corre, por esta ordem, as baterias que decidem uma alteração e devolve **um** código de saída
(**0** quando tudo passa, **1** quando alguma coisa falha):

| Bateria | O que responde |
| --- | --- |
| `tools/scene/validate.mjs` | os 6 mundos, as leis, o grafo das portas e os arranques |
| `tools/scene/laws-selftest.mjs` | **22** avarias injectadas, todas detectadas, com o controlo limpo |
| `tools/regression/twelve-tests.mjs` | **T2–T12** nas 5 páginas (**35** verificações) |
| `tools/regression/traversal-tests.mjs` | **T1** (as portas) e **T7/T11** (as chegadas) |
| `tools/regression/i18n.mjs` | as duas línguas: chaves, marcadores e `?lang=en` nas duas páginas |

`--full` acrescenta as baterias arquivadas das Fases 4, 5 e 7 — a costura das travessias, a ponte de
imagem, a chegada por uma porta, os rótulos, o botão, a transição, o fundo shader (que mede a política
e as duas páginas com uma), os quatro valores do R9 na cena e nos painéis, o lote por dimensão, o
catálogo de assets e os portais em movimento — cada uma abre um Chrome e juntas somam minutos, por
isso não são o `default`. Com `--full` são **19** baterias.

Cada bateria continua a poder correr sozinha, com os argumentos que ela própria documenta — é o que
se usa quando se está a investigar um número.

O **validador de shaders** (`node tools/shader/validate.mjs --all`) não entra no `all.mjs`: abre um
Chrome e mede cada shader instalado (cadência, compilação, desenho). É o que se corre quando se
instala um shader novo — § «Enviar um shader».

### 4. Correr a varredura de regressão (T2 e T3)

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

A varredura exige a página sem interação: se a câmara sair do sítio durante a medição (um D-pad
preso move-a 0,1 m por fotograma), o veredicto é **`refused`** — a medição não vale, em vez de a
cena parecer partida. Para confirmar as três avarias injectadas de propósito:
`runPoseSweep({ fault: 'bar' })` (uma barra da moldura nunca é desenhada),
`runPoseSweep({ fault: 'stencil' })` (o defeito da lei L3, a moldura levando teste de stencil) e
`runPoseSweep({ fault: 'camera' })` (o D-pad preso, que tem de dar `refused`).

### 5. Correr a bateria da fase (T4–T12)

Na mesma consola, com uma página (portão ou sala) aberta:

```js
(await import('/tools/regression/acceptance.mjs')).runAcceptance()
```

Mede, de uma vez, a **janela** (T4), o **rig das duas portas** (T5: ganha a da frente e a moldura
de trás não invade a janela), o **clique na obra** (T6), o **ciclo de 20 portais** (T9), o
**retrato** (T10 e T12, a duas distâncias) e chama a varredura (T2/T3). Os que precisam de uma porta
ou de uma chegada concreta têm o seu próprio runner desde a Fase 6
(`node tools/regression/traversal-tests.mjs`), e as duas sondas continuam a poder correr-se à mão:

- `walkDoor(<id da porta>)` — o **T1**: atravessa a porta a passo de 0,1 m e diz quantas
  travessias ela fez (as que navegam deixam o registo em `sessionStorage`, porque a página vai
  embora com ele)
- `checkArrival()` — o **T7/T11**: numa página aberta com `?from=<mundo>`, confirma que o visitante
  está onde o `arrivalPoint` calcula, que andar para dentro da sala não dispara nada e que meia
  volta dispara **uma** travessia

O T8 (a consola) mede-se **de fora**, instrumentando `console.error`/`warn` antes da carga: a
bateria lê essa sonda quando ela existe. Os números medidos estão no roadmap §9; os três erros que o
próprio instrumento cometeu primeiro (e as lições) estão na §10.

### 6. Editar um mundo no editor

Com a pasta servida por HTTP (o mesmo servidor do passo 1), abra por exemplo
`http://127.0.0.1:8123/editor.html?world=scene1`:

1. o campo «Mundo» tem a lista derivada do portão (mais o fixture) e o botão «Abrir» carrega o mundo;
   qualquer outro slug pode ser escrito à mão
2. edite nos **cinco painéis**; a linha do topo conta o que o ficheiro tem, e a lista de problemas
   mostra **erros**, **avisos** e o que não foi possível verificar (`Por verificar: 0` num mundo
   saudável, porque a página também sabe se o asset existe e se a imagem mede 2:1)
3. `Ctrl+Z` (ou o botão «Desfazer») volta atrás — até 50 passos; a marca «alterado» diz se o mundo
   ainda não saiu num ficheiro, e a página avisa antes de fechar nesse estado
4. «Validar» volta a perguntar tudo — é o que se usa depois de pôr um ficheiro novo em `assets/`
5. «Gravar» (só existe com o servidor da ferramenta, § «A gravação direta») escreve o mundo em
   `data/worlds/` e diz na linha de estado onde ficou a cópia da versão anterior; «Exportar»
   descarrega `<slug>.json` (**recusa** enquanto houver erros) e é o caminho quando não há servidor —
   ponha-o em `data/worlds/` e corra `node tools/scene/validate.mjs`; o `git diff` deve mostrar só o
   que editou
6. «Importar JSON» faz o mesmo caminho ao contrário: um ficheiro de fora é tratado como um mundo
   aberto (D2/D3)

A pré-visualização **não navega** (D32): atravessar uma porta de mundo dentro do editor diz na
consola e fica onde está — o editor serve para arrumar a sala, não para a visitar.

### 7. Enviar um shader

O ficheiro é o **corpo** do fragment: `uTime`, `vDir`, `az`, `el` e `vec3 col` vêm do prelúdio, e o
corpo só pinta `col` (sem texturas, sem `#`, sem `discard`). Da raiz do projeto:

1. `node tools/shader/validate.mjs meu.glsl` — compila num Chrome sem cabeça e mede a cadência; diz
   **PASSA** ou **RECUSA** (e porquê).
2. `node tools/shader/install.mjs meu.glsl --id meu-shader --name "Meu shader"` — só instala se
   passar: escreve `js/shaders/<id>.js` e acrescenta o id à lista interna.
3. `node tools/scene/validate.mjs` e, no editor, escolha do `shaderId` e da imagem de reserva no
   painel da dimensão.

O mínimo é **19 de 20 atualizações por segundo** (95% do teto); um shader mais pesado é recusado.
`--force` instala-o na mesma para ensaio, com o número medido escrito no módulo — mas um corpo que não
compila, ou que não pinta nada, é recusado sempre. Em qualquer sala, `?shader=0` força a imagem de
reserva.

### 8. Medir num telemóvel (a sonda de campo)

Um telemóvel não tem consola de developer tools, e a decisão do **R14** precisa de números de três
aparelhos. `?sonda=1` acrescenta um painel com o que a página está a fazer — mundo, fundo, modo,
cadência, pixelRatio, atualizações por segundo, **quadros por segundo**, atrasos e os eventos da
escada — e um botão que copia tudo como texto:

```
http://127.0.0.1:8123/scene1/?sonda=1        (ou o endereço de Pages)
```

A linha **quadros** é a do A/B: é o que a página desenhou, independente do teto de 20 do shader, e é
ela que se compara entre a mesma sala com shader e com `?shader=0` no mesmo aparelho. Em cima do painel
está um **resumo de uma linha** (`R scene1 20 1.945 57.3 291 411x748/2.63`), curto o suficiente para
se escrever à mão quando copiar do telemóvel é difícil. Sem o parâmetro não existe painel nenhum: a
exposição não sabe que a sonda existe. O painel não é interface (não sai do catálogo `i18n`): é um
instrumento, como as baterias de `tools/`.

A linha **travessia** (**D55**) diz o que a última porta atravessada fez: de que mundo e porta saiu,
para onde, se encostou à janela, se capturou o quadro, se tapou o ecrã com ele e — se alguma coisa
falhou — o erro. Quem sai escreve-a antes de sair, por isso ela aparece **nas duas páginas**: na de
chegada nomeia a travessia que trouxe o visitante; na de origem, o mesmo registo com o mundo errado é
a prova de que o pedido não saiu. É o que se lê quando «atravessei e continuo a ver a sala de onde
vim».

### 9. No telemóvel, o sensor de orientação

O `look-controls` do A-Frame faz do telemóvel uma janela para a cena: rodar o aparelho roda a vista.
Num aparelho **sem giroscópio** esse sinal vem do acelerómetro e do magnetómetro, com ruído, e a sala
**treme** — foi medido no telemóvel fraco do autor. O `js/modules/orientation.js` mede o ruído nos
primeiros 6 s (o **segundo mais quieto**, para não confundir mão a mexer com sensor mau) e desliga o
magic-window **só onde ele não presta**; a visita continua a poder olhar a arrastar. Num aparelho com
giroscópio nada muda.

```
http://127.0.0.1:8123/scene1/?giroscopio=0     desliga à força (escape, para qualquer aparelho)
```

O que se lê no painel da sonda, na linha `giroscópio`: `ligado · tremor 0.04` num sensor bom,
`desligado · tremor 45.4` num ruidoso. O limite é **0,5** (graus por amostra²) e está em
`ORIENTATION.jitterLimit`.

## Melhorias Planejadas

A **Fase 7** (§9 de [docs/ROADMAP.md](docs/ROADMAP.md)) fechou em **2026-10-25**: os dez blocos estão
feitos e cada um mediu o seu número. O que continua aberto é o **R14**/**R15** — o A/B do shader nos
**três** aparelhos, do qual existem dois.

- **Fundos shader** (**R14**/**R15**, bloco **B9**): em produção desde 2026-10-24 — shader por
  omissão, `?shader=0` para a imagem de reserva, validador em `tools/shader/` e a política
  20 → 15 FPS → estático; falta o **A/B controlado nos três aparelhos**
- **Um fundo 360º em vídeo**: a capacidade **já existe** (`kind: "video"` anima com
  `THREE.VideoTexture`), mas nenhum mundo a usa — falta o asset, não o código

Fora da Fase 7, e sem data:

- **As baterias arquivadas por omissão**: hoje `node tools/regression/all.mjs` corre as cinco que
  decidem uma alteração e deixa as catorze da Fase 4/5/7 atrás de `--full`, porque cada uma abre um
  Chrome; juntá-las num só browser (uma sessão, catorze medições) poria as **19** em minutos

**Fechado na Fase 7:** o catálogo em duas línguas (**B2**), o que o esquema prometia e a cena não
construía — **D56** (fundo de cor), **D57** (`link` a navegar), **D58** (modelo GLTF e texto) —, o
lote por dimensão e o catálogo de assets no editor (**B3**/**B4**), os portais animados (**D59**) e a
verificação dos dois lados da exposição com **19** baterias (§ «Como Usar»).

**Fechado na Fase 4:** a **página de edição** (§ acima), o **retrato do portão** (decidido: não se
faz — a ausência é honesta, **R10**) e a **orientação da chegada** no céu (resolvida por dado: as
duas obras passaram para a frente do visitante, **R11**).

**Fechado na Fase 6:** a **automação dos doze testes** — o T1 e o T7/T11 passaram a correr em
`tools/regression/traversal-tests.mjs`, e a verificação inteira é um comando (§ «Como Usar», passo 3)
—, a **recusa** da varredura de poses com a câmara a mexer, e as pendências **R16** e **R17**.

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
