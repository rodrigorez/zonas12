# Roadmap — Módulos de construção e página de edição

> **Estado: APROVADO em 2026-10-12.** As decisões estruturais estão fechadas e registadas na
> secção [11](#11-decisões) com data. Nada de código foi implementado: este documento é o
> guia de desenvolvimento, e o `README.md` descreve o que **já** existe.
>
> **Atualização (2026-10-13):** a decisão **D14 — mundos e portas de mundo** foi fechada e
> registada em §11, com as leis novas L9–L18 (§8), os testes T10–T12 (§10) e a **Fase 3B**
> (§9). É planeamento: nada dela está implementado.
>
> **Atualização (2026-10-13, 2.ª):** a decisão **D15 — harness de skills do projeto** foi
> fechada e registada em §11. A **D8 foi reaberta e substituída**: `.harness/skills/` **já não
> está vazia** (skills locais e de 5 vendors, todas indexadas) e o material herdado de outro
> projeto foi posto em quarentena — ver §3. O `.harness/` está fora do repositório
> (`.gitignore`), por isso isto não mexe em código de produção.
>
> **Atualização (2026-10-13, 3.ª):** auditoria do harness **ao disco** corrigiu o índice. O
> índice omitia skills inteiras (incluindo `3d-games`, `vr-ar` e `web-games`), documentação de
> apoio e ferramentas; dava como "cópia" um espelho que não tinha um único ficheiro; e chamava
> "junções" a pastas vulgares. A causa era o validador só fazer
> `índice → disco`. Passou a ter **três passes**, todas obrigatórias — ver §3. Na mesma ronda
> **limpou-se** o que era vazio de facto: o esqueleto Cline, as falsas
> "junções" e o `__pycache__`. Ficaram de propósito os repos `.git` dos
> vendors, que **são funcionais** (servem o `sync-all-vendors.ps1`). Nada disto é código de
> produção — e os números desta auditoria estão em `HARNESS_LOG.md`, não aqui.
>
> **Como usar:** escolher a fase seguinte na secção [9](#9-fases-de-execução), executá-la, e
> só a dar como fechada quando o **critério de verificação** dela passar. Uma fase de cada
> vez; cada decisão nova entra na secção 11 com data.

---

## 1. Objetivo e escopo

**Objetivo:** passar de uma cena escrita à mão em `index.html` para **módulos independentes**
(dimensão, obra, portal, câmara) alimentados por **dados**, e acrescentar uma **segunda
página** de criação/manutenção com inserir, alterar e excluir para cada módulo.

**Dentro do escopo:** separar o `js/main.js` atual em núcleo + 4 módulos; descrever a cena em
dados; construir `editor.html` com CRUD; validar com as medições que já usamos; e, depois
disso, **mundos com endereço próprio e portas de mundo** (D14, §11).

**Fora do escopo (por agora):** multiusuário, base de dados remota, autenticação, portais em
movimento animado (fica para depois), substituir o A-Frame, modelo de iluminação/PBR.

---

## 2. Estado de partida (medido, não estimado)

| Item | Valor real |
| --- | --- |
| `js/main.js` | **586 linhas**, um ficheiro só |
| `index.html` | 183 linhas, com as entidades todas escritas à mão |
| `css/style.css` | 74 linhas |
| Componentes A-Frame registados | 7: `gestor-dimensoes`, `config-ar`, `cursor-listener`, `abrir-modal`, `material-virtual`, `panorama-dimensao`, `portal-estencil-dinamico` |
| Estado partilhado | objeto global `window.portalAR` (`dimensaoAtiva`, `dimensoes`, `portais`, `valores`, `assinatura`, `ordem`) |
| Dimensões / portais na cena | 4 / 8 |
| Obras | 10 (5 na dimensão 1, 3 na 2, 2 na 3) |
| Assets | 5 imagens + 1 vídeo, todos em `assets/images/` |

### 2.1 Pontos de acoplamento que a modularização tem de resolver

Cada linha abaixo é um sítio concreto do código de hoje que impede os módulos de serem
independentes. São factos verificados por leitura do ficheiro.

| # | Onde | Problema | Consequência |
| --- | --- | --- | --- |
| A1 | `registarNaDimensao()` + `aplicarEstadoEstencil()` | O estado de stencil é **global**: para decidir o que um material desenha é preciso conhecer **todas** as dimensões | Um módulo isolado não se pode governar sozinho: precisa de um núcleo que veja a cena toda |
| A2 | `js/main.js:341` | `document.addEventListener('keydown')` é criado **dentro do `init` de cada portal** | Com 8 portais há 8 listeners: premir `R` roda **todos** os portais, `D` liga a caixa de debug em todos |
| A3 | `js/main.js:349` | O `remove` do portal tira-o da lista mas **não remove o listener** de teclado | Qualquer criação/eliminação dinâmica (o objetivo do editor) **acumula** listeners — bug garantido no editor |
| A4 | `material-virtual`, `panorama-dimensao` | **Não têm `remove`** | Eliminar uma dimensão deixa entradas mortas em `estado.dimensoes` (materiais já destruídos continuam a ser configurados) |
| A5 | `js/main.js:290, 480, 521` | `document.querySelector('a-camera')` em 3 sítios | O panorama, a travessia e o movimento mobile **conhecem o seletor** da câmara; trocar a câmara obriga a mexer em 3 módulos |
| A6 | `index.html` obras | `src="#skycloud"` (id do asset) **e** `abrir-modal="url: assets/images/skycloud.jpg"` (caminho) | O mesmo recurso está escrito duas vezes; um editor tem de manter os dois em sincronia |
| A7 | `gestor-dimensoes.tick()` | Deteta travessias **e** atribui valores de stencil | Duas responsabilidades no mesmo sítio; a travessia é do portal, a atribuição é do núcleo |
| A8 | `config-ar` | `sortObjects`, `autoClearStencil`, `setClearColor` | É configuração de render: tem de ser única e correr antes de tudo |

> **Nota (Fase 1).** As referências de linha desta tabela são da **v0.0.2**, quando a
> lógica estava toda em `js/main.js`. Depois do passo 1 da Fase 1 esse ficheiro passou a
> ser `js/app.js` (entrada de módulo) e as linhas deslocaram-se; a Fase 2 leva cada bloco
> para `js/modules/`.

**Leitura destes factos:** o pedido de "4 módulos independentes" é possível, mas **não é
possível sem um núcleo**. A alternativa (módulos verdadeiramente autónomos) obrigaria a
duplicar a lógica de stencil em cada um, e a primeira coisa a divergir seria a ordem de
desenho — exatamente a família de bugs que passámos a semana a corrigir.

---

## 3. Skills do projeto — resolvido (D8 reaberta → D15)

**O que se decidiu.** O harness de `.harness/skills/` passa a ser **material ativo do projeto**,
com um **índice único** (`skills_index.md`) como porta de entrada obrigatória. A **D8** — que
dizia "não se usa nenhuma skill do projeto" — foi reaberta e substituída pela **D15**.

**Porque a D8 caiu.** A D8 partia de uma premissa medida em 2026-10-12: `.harness/skills/` tinha
**89 pastas vazias e 0 ficheiros** — não havia nada para ler, e "não usar nada" era a única
escolha honesta. Essa premissa **deixou de ser verdade**: a pasta foi depois preenchida com um
harness completo (rules, agents, skills, workflows, scripts e 5 vendors). Não fazia sentido
manter a decisão de não usar nada quando passou a haver o que usar.

**Onde estão os detalhes — este documento não os repete.**

| Preciso de… | Onde |
| :--- | :--- |
| A **regra de busca** (obrigatória) e como manter | `README.md`, regra 5 |
| O **inventário** e **todas as quantidades** | `.harness/skills/.agent/skills_index.md` → `📍 Location Map` |
| A **história**: quarentena, remoções, medições | `.harness/skills/.agent/HARNESS_LOG.md` |
| A **decisão** e o seu custo | §11 (D15) e §13 |

> **Divisão de responsabilidades (P2).** As quantidades do harness vivem **num sítio só** — no
> `📍 Location Map` do índice. Este roadmap, o `README.md` e o índice andam juntos, mas **sem
> repetirem números**: foi a repetição que obrigava a editar três ficheiros cada vez que uma
> contagem mudava.

**Regra de busca (obrigatória).** Sempre que forem pedidas **skills**, a busca faz-se nesta
ordem: **(1)** abrir `.harness/skills/.agent/skills_index.md`; **(2)** ir ao caminho que a linha
indica; **(3)** só se o índice não tiver o que se procura é que se faz busca livre
(`grep`/`glob`). O índice é a **única porta de entrada** — não se percorrem as subpastas às
cegas. A regra está replicada no `README.md` (regra 5) para quem não lê o roadmap.

**Validação — três passes, não uma (2026-10-13).** A primeira versão do validador só fazia
`índice → disco`, e por isso **anunciava que estava tudo bem enquanto o índice omitia
material**: skills inteiras, documentação de apoio e ferramentas. Por construção, uma validação
só nessa direção **nunca** encontra o que não está no índice. O critério passou a ser três
passes:

| Passe | Pergunta | Onde corre |
| :--- | :--- | :--- |
| **1 — direta** (`índice → disco`) | as entradas resolvem? | `validate_skills_index.ps1` |
| **2 — quantidades** | algum número do `Location Map` mente? | idem |
| **3 — inversa** (`disco → índice`) | ficou algo de fora? | idem |

O código é `.harness/skills/.agent/scripts/validate_skills_index.ps1` e sai com **código 0** só
quando as três estão verdes. Fica fora do índice de propósito: o índice é para consultar.

A **passe 2** fecha a lacuna que deixou passar o erro original: o índice declarava números que
ninguém conferia. A **passe 3** é a única que olha para o disco à procura do que **falta**.

**A lição, registada:** um índice que valida apenas a si próprio não pode detectar o que não
está nele. Foi o que aconteceu — e é a razão de a passe 3 existir.

**O que isto resolve.** O harness deixa de ser um bloqueio e passa a ser utilizável — incluindo
as três sub-skills mais próximas de A-Frame (`3d-games`, `web-games` e `vr-ar`), que estavam
invisíveis porque o índice só listava a skill-mãe. A lista completa está no `skills_index.md`.

**Peso, quarentena e o `.gitignore`.** O material herdado de outro projeto (`Gabinete`) está
isolado em `.agent/garbage/` e o que foi removido está registado com motivo. `.harness/` está no
`.gitignore` (linha 1): **nada** do harness — nem o índice, nem o log — existe num clone ou no
GitHub, e a regra de busca vale **só nesta máquina**. As medições de peso e a razão pela qual os
5 repos `.git` dos vendors **não** se apagam estão em `HARNESS_LOG.md` §7 e §4.

**Decisão:** D8 **reaberta e substituída** pela **D15** (§11).

---

## 4. Decisões estruturais (opções com causa e consequência)

### D1. Como se escrevem os módulos

| Opção | Como funciona | Ganhos | Perdas / consequências |
| --- | --- | --- | --- |
| **1A. ES Modules nativos** (recomendada) | `js/core/*.js` e `js/modules/*.js` com `import`/`export`; `<script type="module">` | Dependências explícitas (é o ponto do pedido); sem globais; o browser já sabe; zero build | **Abrir o `index.html` com duplo clique (file://) deixa de funcionar** (CORS): passa a ser obrigatório servir por HTTP — é o que já fazemos em todos os testes |
| 1B. Scripts + namespace | `js/modules/portal.js` define `window.PortalAR.Portal = {...}`; `<script>` na ordem | Continua a funcionar por `file://`; zero build | Ordem dos `<script>` passa a ser contrato implícito; sem análise estática; é o estado atual com outro nome |
| 1C. Bundler + TypeScript | `esbuild`/`vite` a partir de `src/`, gera um `dist/app.js` único | Tipos (contratos verificados em tempo de compilação); **o bundle único volta a funcionar por `file://`**; um só ficheiro a publicar | Dependências npm e passo de build **de volta à raiz** (contradiz a limpeza que fizemos); mais uma coisa para instalar/atualizar |

**Recomendação: 1A.** O objetivo declarado é escalar com módulos independentes — e o
`import` é o que torna as dependências visíveis e impossíveis de contornar.

**A D2 já pagou o custo do 1A.** Com o JSON decidido (D2), o `index.html` passa a fazer
`fetch('data/scene.json')`, e o `fetch` **já não funciona por `file://`**. Ou seja: a
exposição passa a exigir HTTP de qualquer maneira, e o único senão do 1A deixa de existir.
Sobra o ganho (dependências explícitas) sem custo adicional.

Consequência prática para a Fase 0/1: o README tem de deixar de dizer que "abrir o ficheiro
directamente também funciona" e passar a indicar o comando de servidor. Se **abrir sem
servidor** for ainda assim requisito rígido, então a D2 tem de ser reaberta — as duas
decisões estão ligadas.

Se houver resistência ao 1A, a alternativa é 1B (scripts + namespace), **não** 1C: meter
build no projeto agora é peso sem retorno imediato.

### D2. Onde vive o dado que o editor edita

| Opção | Como funciona | Ganhos | Perdas / consequências |
| --- | --- | --- | --- |
| **2A. JSON no projeto + importar/exportar** (recomendada para a 1.ª fase) | `data/scene.json` é a verdade; o editor carrega, edita em memória e **descarrega** o ficheiro; o `index.html` lê o JSON | Site continua **100% estático**; funciona no GitHub Pages; o ficheiro está versionado (dá para ver o diff de uma alteração e reverter) | Gravar exige **substituir o ficheiro à mão** (fricção em cada alteração); o editor não "grava sozinho" |
| 2B. `localStorage` | O editor grava no browser; a app lê de lá | CRUD imediato, zero servidor, zero ficheiros | O dado **fica preso a um browser** (não viaja, não versiona); testar no telemóvel vê outra cena; limpar dados do browser apaga a exposição |
| 2C. Servidor local com escrita | Pequeno servidor (`node`/`python`) expõe `GET/POST/PUT/DELETE` e escreve `data/scene.json` no disco | CRUD real com "Gravar", sem passos manuais; continua a poder ser estático no que se publica (o servidor só serve o editor) | Mais um processo para arrancar; um servidor **a escrever no repositório** é risco (acidentes apagam a cena) → exige cópias de segurança e um endpoint de "exportar" |
| 2D. Base de dados | SQLite/Postgres atrás de uma API | Muitos utilizadores, histórico, consultas | Incompatível com o estado atual (site estático); peso enorme para uma exposição |

**Recomendação: 2A agora, 2C depois** se a fricção de gravar incomodar. A razão é
estratégica: com 2A o JSON versionado torna-se a "prova" de cada alteração e podemos sempre
voltar atrás; com 2B perdemos isso e arriscamos perder a cena; com 2C ganhamos conforto mas
introduzimos algo que escreve no repositório — só vale a pena quando 2A já estiver estável.

### D3. Como o editor "vê" a cena

| Opção | Como funciona | Ganhos | Perdas / consequências |
| --- | --- | --- | --- |
| **3A. Formulários + pré-visualização** (recomendada) | Tabelas por módulo com campos numéricos e pré-visualização da cena ao lado (mesma cena, num painel) | Precisão (valores exatos, repetíveis); rápido de construir; validação fácil; funciona bem no telemóvel | Posicionar arrastando não existe: para acertar posições há mais idas e voltas |
| 3B. WYSIWYG 3D (manipuladores) | Arrastar/rodar os objetos na cena (gizmos) | Muito melhor para posicionar | Muito mais trabalho (raycasting, transform controls, modos de interação); risco de mexer sem querer; difícil no telemóvel |
| 3C. Inspector do A-Frame | Usar `Ctrl+Alt+I` (inspector oficial) para posicionar e depois copiar | Zero trabalho de construção | É ferramenta de programador, não de utilizador; escreve HTML, não o nosso JSON; não tem CRUD nem validação |

**Recomendação: 3A**, com uma nota: enquanto 3A não existe, o inspector do A-Frame resolve o
posicionamento fino — serve de apoio, não de base. Se 3A se revelar lento para posicionar,
podemos acrescentar **um** manipulador de posição (arrastar só no plano do chão), que é a
parte que dá mais dor de cabeça a afinar à mão.

### D4. Estrutura da segunda página

| Opção | Como funciona | Ganhos | Perdas / consequências |
| --- | --- | --- | --- |
| **4A. `editor.html` separado, mesmos módulos** (recomendada) | Página própria que importa o **núcleo e os 4 módulos** e monta a cena a partir do JSON | Não duplica lógica: o que o editor pré-visualiza é a **mesma** cena da exposição; obriga o JSON a ser a única verdade | Exige a Fase 3 (tirar a cena do HTML) antes de valer a pena |
| 4B. Modo dentro da mesma página (`?modo=editor`) | A mesma página com uma barra de edição | Um só ficheiro; nada a sincronizar | Código de edição (que só o curador usa) viaja no bundle da exposição; risco de deixar o modo ligado em público |
| 4C. Editor como projeto à parte | App separada que gera o JSON | Isolamento total | Duas cópias do modelo de dados e da validação → vão divergir |

**Recomendação: 4A.** O ganho ("o que vejo no editor é a cena real") só existe porque
partilha os módulos; a 4B contamina a exposição com código de edição, e a 4C duplica o que
mais precisa de ser único (a validação).

### D5. O que é o "módulo da câmara"

Há **dois** conceitos de câmara neste projeto e vale a pena não os misturar:

| Conceito | O que é hoje | O que faria no módulo |
| --- | --- | --- |
| **Câmara-jogador** | `<a-camera>` com `look-controls` + `wasd-controls`; D-pad no telemóvel; `VELOCIDADE = 0.1`; `atualizarMovimentoMobile()` | Posição/altura/rotação, velocidade, limites, teclado + toque; é quem "anda" |
| **Câmara-real (AR)** | `<video id="webcam-video">` no fundo (CSS) + `getUserMedia` no arranque + `tratarErroCamera()` | Ligar/desligar a webcam, estados de erro, e ser o fundo da **dimensão 0** |

**Opções:** (a) só câmara-jogador; (b) só câmara-real; (c) as duas, com duas secções claras
dentro do mesmo módulo.

**Recomendação: (c)**, mantendo-as separadas internamente: são independentes (o jogador
podia andar sem webcam e a webcam podia existir sem movimento) mas ambas são "a câmara" do
ponto de vista de quem usa o editor.

---

## 5. Contratos propostos dos módulos

Nomes e campos são **proposta** (a rever na Fase 0). Pela decisão D10, os identificadores
estão em **inglês**; a documentação e os textos da interface ficam em português.

### 5.0 Porquê um núcleo (e o que ele não é)

Medido no código de hoje: **≈120 linhas das 586 (≈20%) já são um núcleo** — só não têm nome
nem fronteira. A Fase 1 não cria nada de novo: **move, nomeia e fecha**.

| O que | Onde estava na v0.0.2 | Linhas |
| --- | --- | --- |
| Limites (512 / 512 / 255) | `js/main.js:13-15` | 3 |
| Estado partilhado (`window.portalAR`) | `js/main.js:17-31` | 15 |
| `registarNaDimensao()` | `js/main.js:39-65` | 27 |
| `definirEstencil()` | `js/main.js:66-90` | 25 |
| `aplicarEstadoEstencil()` | `js/main.js:91-125` | 35 |
| `definirDimensaoAtiva()` | `js/main.js:127-138` | 12 |
| Atribuição de valores do `gestor-dimensoes` | `js/main.js:145-168` | ~20 |

Os restantes **~80%** são os 4 módulos — e esses passam a ser independentes **uns dos
outros** (não de todos).

#### As três razões (com provas deste projeto)

1. **O stencil é global por natureza.** `aplicarEstadoEstencil()` tem de percorrer todas as
   dimensões para distribuir valores. Um portal isolado não sabe que valor escrever sem saber
   quem mais está a ser mostrado. Não é escolha de arquitetura: é o que o buffer de 8 bits
   obriga.
2. **A dimensão ativa tem de ter uma só verdade.** O bug original do flicker nasceu de
   **duas** fontes de verdade: a máscara trocava no plano do quadro e um booleano trocava na
   borda da caixa — 0,10 m com a dimensão errada. Duas fontes, o bug outra vez.
3. **A ordem de desenho é uma decisão única.** máscara (1) → panorama (2 / **2.5** nas
   janelas) → obras (3) → moldura (4). Se cada módulo escolhesse o seu `renderOrder`, voltava
   o bordo da moldura cortado (110 poses de 360, medido).

#### Direção das dependências

```
        index.html            editor.html
             │                    │
   ┌─────────┴────────┬───────────┴─────────┐
dimensão            obra                portal          câmara
   └─────────┬────────┴─────────┬─────────┘
             │   todos dependem de
          NÚCLEO  ────────────────► não depende de nenhum módulo
```

#### O que o núcleo nunca faz (é isto que o mantém pequeno)

- criar objetos 3D (é dos módulos)
- ler JSON (é do construtor de cena)
- conhecer o DOM do editor
- ler o teclado
- falar com o `document` (nem `querySelector('a-camera')`)

Ganho de escala: um módulo novo (um 5.º tipo de conteúdo) entra sem tocar nos outros quatro —
regista-se no núcleo e pronto.

#### A alternativa sem núcleo, e porque não a escolhemos

Existe arquitetura sem stencil partilhado: cada portal desenha a sua dimensão para uma textura
própria (*render-to-texture*) e aplica-a no quadro.

| | Ganhos | Custos |
| --- | --- | --- |
| *Render-to-texture* por portal | Portais independentes no render; desaparece o acoplamento da ordem das máscaras | **N portais a mostrar a mesma dimensão = N desenhos** (hoje os portais 4 e 5 partilham um valor e um desenho); portal dentro de portal exige render recursivo; **continua a precisar de um registo partilhado** (o núcleo ficaria menor, não desaparecia); deita fora o modelo medido esta semana |

**Decisão (D11): manter o stencil partilhado e o núcleo.** Trocávamos ~120 linhas que existem
e funcionam por um render mais caro e mais arriscado — e no fim continuaria a haver núcleo.

### 5.1 Núcleo (`js/core/`)

O único sítio que conhece a cena toda.

- **Estado:** `activeDimension`, registos por tipo (`dimensions`, `artworks`, `portals`,
  `cameras`), `stencilValues` (dimensão → valor), `drawOrder`.
- **Funções:** `register(kind, item)`, `unregister(kind, item)` (resolve A3/A4),
  `applyStencilState()` (o único sítio que toca em `stencilFunc/ref`, `depthTest/Write` e
  `renderOrder`), `setActiveDimension(id)` (única porta de entrada).
- **Eventos:** `core:ready`, `dimension:active-changed`, `portal:traversed`,
  `registry:changed`.
- **Não faz:** criar objetos 3D, ler JSON, conhecer o DOM do editor, ler o teclado.

### 5.2 Módulo Dimensão

- **Responsabilidade:** uma dimensão = ID + fundo + lista de conteúdo dela.
- **Campos:** `id` (0…511), `background` (`asset`), `kind` (`image | video | color |
  camera`), `radius`, `followCamera`, `color`.
- **API:** `create / update / remove / list`.
- **Regras:** ID único; `radius` > distância a qualquer portal (senão o fundo aparece dentro
  da janela — regra medida na v0.0.2); vídeo obriga a `VideoTexture`.
- **Depende de:** núcleo; câmara (se `followCamera`).

### 5.3 Módulo Obra

- **Responsabilidade:** item de conteúdo de uma dimensão, opcionalmente clicável.
- **Campos:** `id`, `dimension`, `kind` (`image | video | model | text`), `asset`,
  `position`, `rotation`, `scale` / `size`, `interaction` (`modal | link | none`), `url`,
  `title`.
- **API:** `create / update / remove / list` + `canInteract(artwork)`.
- **Nota (A6):** hoje o mesmo ficheiro aparece em dois sítios (`src="#id"` e a URL do
  modal). O modelo deve ter **um** campo `asset`; o resto deriva. Consequência: migrar as
  **10 obras** atuais.
- **Regras:** clique só na dimensão ativa (já implementado); ver pela janela não conta.

### 5.4 Módulo Portal

- **Responsabilidade:** a porta — janela (valor de stencil), moldura, caixa de deteção,
  travessia, rotação.
- **Campos:** `id`, `ownedBy` (era `pertenceA`), `width`, `height`, `box {x,y,z}`,
  `boxPosition`, `boxRotation`, `trigger` (`plane | box`), `frame {color, thickness}`,
  `rotation`, `motion` (reservado), mais os **dois eixos** da D14:
  `window {kind, …}` (o que a janela mostra) e `action {kind, …}` (o que a travessia faz).
- **API:** `create / update / remove / list`; emite `portal:traversed {id, from, to}`.
- **Regras:** `ownedBy ∈ {dimensão, -1}`; o ponto de chegada **não pode** cair dentro da
  caixa de outro portal (senão há trocas em cadeia — medido); ≤255 dimensões distintas
  visíveis ao mesmo tempo; a combinação de `window` com `action` tem de ser uma das legais
  (L18).
- **Depende de:** núcleo (valor de stencil), câmara (posição do jogador).

#### Os dois eixos do portal (D14)

O portal deixou de ser um tipo e passou a ser a **combinação de dois eixos independentes** — o
que a janela mostra e o que a passagem faz. É isto que permite a porta de mundo, uma janela
sem passagem ou, no futuro, um teleporte, sem inventar um caso por combinação.

| Eixo | Valores | Tabela |
| --- | --- | --- |
| **`window`** | `dimension-pair` (o par do portal interno) · `preview` (o retrato de outro mundo) · `none` | `WINDOW_KINDS` |
| **`action`** | `enter-window` (fica na dimensão que a janela mostra) · `navigate` (muda a URL) · `none` | `ACTION_KINDS` |

Cada entrada da tabela expõe três coisas: `shownDimension` (que dimensão o núcleo regista como
mostrada), `onTraverse` (o que fazer ao atravessar) e `validate` (as leis daquele caso).
**Acrescentar um uso é acrescentar uma entrada** — o componente do portal e o núcleo não
mudam. As tabelas vivem no **módulo do portal**, nunca no núcleo (a D11 mantém-se).

| Combinação | Legal? | Porquê |
| --- | --- | --- |
| `dimension-pair` + `enter-window` | ✅ | O portal de hoje |
| `preview` + `navigate` | ✅ | A porta de mundo |
| qualquer + `none` | ✅ | A janela sem passagem (um "espia") |
| `dimension-pair` + `navigate` | ❌ | Mostraria uma dimensão deste mundo mas levaria a outro: o retrato mentiria (L13) |
| `preview` + `enter-window` | ❌ | Seria entrar no retrato: cai na banda reservada (L15) |
| `none` + `none` | ❌ | Porta sem função (aviso no editor) |

Nota: em `dimension-pair` + `enter-window` a **ordem do par não interessa** — a dimensão
mostrada é sempre a que não é a ativa. É isso que torna a migração dos 8 portais insensível a
trocas de `A`/`B`.

### 5.5 Módulo Câmara

- **`playerCamera`:** posição, altura, velocidade, `look-controls`, `wasd-controls`,
  D-pad, limites.
- **`realCamera`:** webcam (`getUserMedia`), estados (a pedir, ativa, erro), fundo da
  dimensão 0.
- **API:** `position()`, `setPosition(p)`, `enable()`, `disable()`.
- **Ganho imediato:** resolve A5 — deixa de haver `document.querySelector('a-camera')`
  espalhado por 3 sítios.

### 5.6 Estrutura-alvo do repositório

Resultado das decisões D1 (ES Modules), D4 (`editor.html`), D6 (`docs/` + `tools/`), D7
(assets por tipo) e D10 (nomes em inglês):

```text
zonas12/
├── index.html               exposição: só marcação + <script type="module" src="js/app.js">
├── editor.html              ferramenta de edição
├── README.md                documentação (o que existe hoje)
├── docs/ROADMAP.md          plano e decisões (este ficheiro)
├── css/{style.css, editor.css}
├── js/
│   ├── app.js               arranque da exposição
│   ├── editor.js            arranque do editor
│   ├── core/                estado, registos, stencil, ordem de desenho, eventos, limites
│   ├── modules/             dimension.js, artwork.js, portal.js, camera.js
│   └── scene/               scene-builder.js, schema.js, validation.js
├── data/                    scene.json + scene-example.json (D13)
│   └── worlds/              um ficheiro por mundo + gate.json — D14 (Fase 3B)
├── i18n/                    pt.json (+ en.json quando houver tradução)
├── assets/{panoramas,artworks,video}/
├── tools/                   conversor HTML→JSON, processamento de assets
└── .harness/                fora do repositório (está no .gitignore)
    └── skills/              harness de agents/skills — índice em .agent/skills_index.md (§3)
```

Nota de nomenclatura: as pastas de **código** são em inglês (D10), e os ficheiros de dados
também: `data/scene.json` é a exposição e `data/scene-example.json` é a cena de exemplo
(decisão D13).

Nota (D14, a partir da Fase 3B): passa a haver **uma pasta por mundo** com o seu arranque —
`praia/index.html`, `cidade/index.html` — e, em `data/worlds/`, **um ficheiro por mundo**
(o mundo de entrada é `gate.json`). O `index.html` da raiz passa a ser o portão. Cada pasta de
mundo traz o `<base href="../">` no seu arranque, para os caminhos dos assets e dos dados
funcionarem tanto em raiz como em subpasta. Nada disto existe ainda.

### 5.7 Idiomas: código, interface e documentação

São três coisas diferentes, com três regras diferentes (decisões D10 e D12):

| O quê | Regra | Onde vive |
| --- | --- | --- |
| **Código** — identificadores, comentários, mensagens de consola, chaves do JSON, nomes de pastas | **inglês** | `js/`, `data/`, `tools/` |
| **Interface** — botões, rótulos, avisos, ecrãs do editor | **traduzível**, com o português como língua de origem | catálogo em `i18n/` |
| **Documentação** — README, ROADMAP, comentários no HTML | **português** | `README.md`, `docs/` |

#### Glossário de identificadores (PT → EN)

Fixa-se na Fase 0. É o que impede três traduções para a mesma coisa.

| Hoje (PT) | Código (EN) | Rótulo de interface (PT, no catálogo) |
| --- | --- | --- |
| dimensão | `dimension` | Dimensão |
| obra | `artwork` | Obra |
| portal | `portal` | Portal |
| câmara | `camera` | Câmara |
| travessia | `traversal` | — |
| janela (do portal) | `window` | Porta / Janela |
| máscara | `mask` | — |
| moldura | `frame` | Moldura |
| caixa (de colisão) | `box` | — |
| gatilho | `trigger` | — |
| valor de stencil | `stencilValue` | — |
| panorâmica / fundo 360º | `panorama` / `background` | Fundo |
| pertença (a que dimensão pertence) | `ownedBy` | — |
| abrir obra (modal) | `openArtwork` | — |
| mundo | `world` | — |
| portão (o mundo de entrada) | `gate` | Portão |
| porta de mundo | `world-portal` | Porta |
| passagem (o que a travessia faz) | `action` | — |
| retrato (pré-visualização de outro mundo) | `preview` | Janela |
| chegada | `arrival` | — |
| desempate da porta de chegada | `arrivalFrom` | — |

#### Nomes dos componentes A-Frame

Aparecem no HTML, por isso contam como código:

| Hoje | Proposto |
| --- | --- |
| `gestor-dimensoes` | `dimension-manager` |
| `portal-estencil-dinamico` | `stencil-portal` |
| `panorama-dimensao` | `dimension-panorama` |
| `material-virtual` | `dimensional-material` |
| `abrir-modal` | `open-artwork` |
| `config-ar` | `ar-config` |
| `cursor-listener` | `cursor-listener` (já em inglês) |
| — | `world-portal` (novo na Fase 3B, D14: a mesma máquina, outro comportamento) |

#### Regras da interface traduzível (para não haver reescrita depois)

1. **Nenhum texto de interface escrito em código.** Sempre por chave:
   `t('editor.artwork.title')`, nunca `"Título da obra"` dentro de um `.js`.
2. **Nada de frases montadas por concatenação.** Uma frase é **uma** chave inteira
   (`t('portal.dimensionChanged')` com parâmetros), senão a ordem das palavras quebra noutra
   língua — e a ordem em inglês não é a ordem em português.
3. **Zero texto em `css/`** (nada de `content: "..."`).
4. **No HTML, o mínimo:** só os textos que têm de existir antes de o JavaScript correr
   ("Carregando...", "ATIVAR EXPOSIÇÃO"). Contam como **valores de origem do português**, e
   o catálogo tem de ter a mesma chave — senão há dois textos para o mesmo sítio.
5. **A língua de origem é o português.** Uma tradução em falta mostra o português (nunca uma
   chave crua nem vazio).
6. **Avisos em desenvolvimento:** se faltar uma chave, avisar na consola (em inglês, porque é
   código) em vez de falhar em silêncio.

#### D12 — onde vivem os textos traduzíveis

| Variante | Como funciona | Ganhos | Perdas / consequências |
| --- | --- | --- | --- |
| **A. Catálogo para a interface + campos por idioma nos dados** (recomendada) | `i18n/pt.json` tem tudo o que é da aplicação; o conteúdo (títulos das obras, nomes das dimensões) tem `title: { "pt": "…", "en": "…" }` | Acrescentar uma língua = 1 ficheiro de catálogo + 1 campo nos dados; o editor continua a exportar **um** ficheiro (coerente com a D2) | O JSON da cena cresce com o número de línguas; o editor tem de mostrar os campos por idioma |
| B. Tudo no catálogo, incluindo o conteúdo | O JSON só tem chaves (`titleKey: "artwork.0.title"`) e o texto está no catálogo | JSON pequeno e estável; quem traduz não toca nos dados | **Duas fontes de verdade** para editar uma obra; "exportar" deixa de ser suficiente (contradiz a D2); acrescentar uma obra mexe em 2 ficheiros |
| C. Só a interface traduzível | O conteúdo fica na língua da exposição | Simples; nada a fazer nos dados | Numa exposição com duas línguas, o título da obra não acompanha |

**Recomendação: A** — mantém o "um ficheiro exportado" da D2 e deixa a tradução do conteúdo
onde ela é editada.

#### Como o utilizador escolhe a língua

| Variante | Ganhos | Perdas |
| --- | --- | --- |
| **`?lang=en` na URL** (recomendada) | Sem UI nova; dá para ter dois QR codes (um por língua) ou um quiosque por língua | Não há como trocar sem recarregar |
| Deteção do browser + memória | Zero configuração | Imprevisível num quiosque (a língua do sistema manda) |
| Seletor visível na página | Explícito e trocável | Ocupa espaço e é mais uma peça de interface |
| Campo `language` nos dados | Fixo por exposição, bom para quiosques dedicados | Não serve exposições bilingues no mesmo sítio |

Começar por `?lang=`, com português como omissão: resolve o caso real (duas línguas, dois
acessos) sem construir interface nenhuma. As outras variantes podem acrescentar-se depois —
desde que as 6 regras acima estejam cumpridas.

---

## 6. Modelo de dados da cena (proposta)

```json
{
  "version": 1,
  "cameras": {
    "player": { "position": [0, 1.6, 0], "speed": 0.1, "height": 1.6 },
    "real": { "enabled": true }
  },
  "dimensions": [
    { "id": 0, "kind": "camera", "radius": 500 },
    { "id": 1, "kind": "image", "asset": "cidade-360", "radius": 500 }
  ],
  "artworks": [
    { "id": 0, "dimension": 1, "asset": "galeriaFoto1",
      "position": [-44, 1.5, 5], "rotation": [0, 15, 0], "size": [4, 3],
      "interaction": "modal", "title": { "pt": "Aurora", "en": "Aurora" } }
  ],
  "portals": [
    { "id": 0, "ownedBy": 0,
      "position": [-6, 0, -8], "width": 8, "height": 10,
      "box": [12, 16, 1], "boxPosition": [0, 8, 0], "trigger": "plane",
      "window": { "kind": "dimension-pair", "dimensions": [0, 1] },
      "action": { "kind": "enter-window" } }
  ]
}
```

**Causa/consequência:** passar a dados obriga a que o `index.html` deixe de ter entidades
escritas à mão (Fase 3) e que o editor saiba escrever este formato. O ganho é que criar uma
dimensão deixa de ser "copiar 6 blocos de HTML e não falhar nenhum atributo".

**Nota (D10 + D9):** as chaves são em inglês (é código); os **valores** que aparecem ao
utilizador (títulos de obras, nomes de dimensões) ficam em português. O `"id"` do asset
(`cidade-360`) continua em português porque é o nome que já existe no `index.html` — renomear
assets obriga a mexer nos ficheiros e não traz ganho; fica permitido misturar.

**Nota (D12):** o texto de **conteúdo** é um mapa por língua (`"title": { "pt": …, "en": … }`),
não uma string — é a variante A da §5.7. Também aqui a **Fase 3 fecha o formato**: mudar
depois obriga a reconverter o JSON. O texto de **interface** não entra aqui: vive no catálogo
`i18n/`.

**Consequência para a migração:** ao converter a cena atual para este JSON é preciso
reescrever os 8 portais e as 10 obras com os nomes novos de atributos
(`dimensaoA` → `dimensionA`, `caixa` → `box`, `pertenceA` → `ownedBy`, …). É trabalho
mecânico mas **com risco de troca de campo**: por isso a conversão tem de ser feita por um
script que lê o `index.html` e escreve o JSON, e não à mão.

### Nota (D14) — o que os mundos acrescentam ao modelo

O **formato do portal** já muda agora, antes da Fase 3, para os **dois eixos** (§5.4):
`window` (o que a janela mostra) e `action` (o que a travessia faz). Os 8 portais atuais
migram para `dimension-pair` + `enter-window` — **sem mudança de comportamento**, por script,
confirmada pelo validador (**0 diferenças**, como na Fase 0). A ordem do par não interessa
nesta combinação, logo a migração não pode trocar `A` por `B`.

O que a **Fase 3B** acrescenta ao modelo (nada disto existe ainda):

```json
{
  "world": { "slug": "praia", "name": { "pt": "Praia", "en": "Beach" } },
  "portals": [
    { "id": 4, "ownedBy": 0,
      "position": [-25, 0, -80], "width": 10, "height": 12,
      "box": [12, 16, 1], "boxPosition": [0, 8, 0], "trigger": "plane",
      "window": { "kind": "preview", "asset": "panoramas/d1-cidade.jpg", "radius": 120 },
      "action": { "kind": "navigate", "target": "cidade", "from": "cidade" },
      "arrivalFrom": "cidade" }
  ]
}
```

- Cada ficheiro descreve **um mundo** (`world.slug`, e o nome por língua, pela D12).
- A **porta de mundo** não tem dados de outro mundo: só o **slug** de destino, a imagem do
  retrato e o desempate de chegada (`arrivalFrom`).
- O ficheiro do mundo de destino **nunca** é lido pela página de origem — é por isso que não
  há manifesto (variante M5, §11) e que as etiquetas vivem na própria porta.

---

## 7. Funcionalidades da página de edição (por módulo)

| Módulo | Inserir | Alterar | Manutenção | Excluir |
| --- | --- | --- | --- | --- |
| **Mundo** *(D14)* | criar sala: slug, nome por língua, pasta e arranque | etiqueta da porta, retrato, raio do retrato | lista de salas derivada das portas do portão; detetar sala inalcançável e porta para mundo inexistente | bloquear se outra sala apontar para ela (ou remover as portas em cascata, com confirmação) |
| **Dimensão** | ID + tipo de fundo + asset + raio | tipo/asset/raio; ver/editar conteúdo | vista geral com contagem de obras e portais; avisar se o raio é pequeno | bloquear se houver portais/obras a apontar para ela (ou apagar em cascata, com confirmação) |
| **Obra** | escolher dimensão, asset, posição/rotação/tamanho, interação | todos os campos | lista por dimensão; detetar asset em falta; detetar `url` vazia com `interacao: modal` | individual e em lote por dimensão |
| **Portal** | `window` + `action`, onde pertence, tamanho, caixa, gatilho | todos os campos, incluindo caixa e moldura | **validar** a combinação legal (§5.4), o destino fora de outras caixas, o valor de stencil; pré-visualizar a travessia | individual; se for o último portal de uma dimensão, avisar |
| **Câmara** | — (é única) | posição inicial, altura, velocidade, webcam on/off | mostrar posição atual; botão "usar a posição atual como inicial" | — (não aplicável) |

Transversal a todos: **escolher o mundo a editar** (um de cada vez, D14), **importar/exportar
JSON**, **validar tudo** antes de exportar, **desfazer**, e uma lista de problemas (ex.: "o
portal 3 chega dentro da caixa do portal 5", "a sala `ceu` não tem porta de volta").

---

## 8. As leis da cena (validação obrigatória — vêm de bugs já corrigidos)

Estas regras não são estilo: cada uma corresponde a um defeito real medido nesta semana.
O editor deve impedi-las **antes** de exportar.

| # | Lei | O que acontece se for violada |
| --- | --- | --- |
| L1 | `raio` do fundo > distância a qualquer portal | O fundo da dimensão ativa aparece **dentro** das janelas |
| L2 | A máscara da janela escreve **profundidade** | Com janelas sobrepostas ganha a de trás → mostra a dimensão errada |
| L3 | Quem pertence à dimensão ativa **não** leva teste de stencil | O bordo da moldura fica **cortado** (110 poses de 360, medido) |
| L4 | Ponto de chegada fora das caixas dos outros portais | Trocas em cadeia ao chegar (ping-pong entre dimensões) |
| L5 | ≤255 dimensões distintas visíveis ao mesmo tempo | Aviso na consola e janelas sem efeito (o valor de stencil não existe) |
| L6 | `renderer.sortObjects = true` e `stencil: true` | O three **ignora** o `renderOrder`; tudo o que está organizado por ordem quebra |
| L7 | Panorama/obra criados só no `update` (A-Frame chama `init` **e** `update`) | O objeto é criado duas vezes (aconteceu com o panorama) |
| L8 | Um só `keydown` para toda a cena | Hoje há um por portal: `R` roda todos, `D` liga a debug em todos (A2) |
| L9 | Todo o `asset` do JSON existe em disco (inclui o retrato de cada porta de mundo) | Imagem que não aparece (proposta pela D7, registada aqui) |
| L10 | O nome do ficheiro segue `assets/<tipo>/d<N>-<nome>.<ext>` (aviso, não erro) | A pasta deixa de ser pesquisável (proposta pela D7, registada aqui) |
| L11 | A porta de mundo tem `target` de um mundo que existe | Porta que navega para o vazio |
| L12 | Nenhum caminho absoluto a partir da raiz nos dados | Publicado numa subpasta, tudo parte |
| L13 | Nada de pré-visualização de um mundo carregado **ao vivo** | Contradiz a D14: o destino não existe na página de origem |
| L14 | Panoramas (fundo e retrato) 2048×1024, 2:1 equirectangular | Distorção visível na janela e memória imprevisível (medido: 9923×2614 ≈ 99 MB de textura) |
| L15 | IDs declarados `0…447`; `448…511` reservados às dimensões derivadas de pré-visualização | A dimensão derivada é ativada por engano: a câmara fica dentro de um retrato |
| L16 | A chegada fica atrás da porta, afastada mais do que meia profundidade da caixa + margem | Andar em frente ao aparecer dispara travessia (troca em cadeia) |
| L17 | No máximo **uma** porta de chegada por origem, em cada mundo | O visitante aparece num sítio arbitrário |
| L18 | A combinação `window` × `action` é uma das legais (§5.4) | O retrato mente (leva a outro mundo) ou entra-se no retrato |

As leis **L1–L8** vêm de defeitos medidos. As leis **L9–L18** vêm da D14 (planeamento):
L9 e L10 foram propostas pela D7 e ficam aqui registadas; L11–L18 nascem dos mundos e das
portas de mundo. **Nenhuma delas está implementada.**

---

## 9. Fases de execução

Cada fase tem um critério de verificação **medido no browser**, como temos feito.

### Fase 0 — Congelar o contrato *(sem código de produção)*

**Estado: concluída em 2026-10-12.** O que ficou feito está em §13.
- **Entregável:**
  1. Este ROADMAP com as decisões fechadas (§11), o **glossário PT→EN** oficial (§5.7) e as
     **regras da interface traduzível** aceites.
  2. A lista de testes de regressão (§10) aceite como critério de aceitação.
  3. `i18n/pt.json` com as chaves que já existem (o "Carregando...", o "ATIVAR EXPOSIÇÃO", as
     mensagens de erro da câmara) — o catálogo nasce aqui, não na Fase 4.
  4. `data/scene-example.json` — a cena atual **convertida para JSON** (feita por script que lê
     o `index.html`, não à mão), com o esquema acordado, incluindo o formato do texto de
     conteúdo por língua.
  5. Uma cópia da cena atual em `data/scene.json` (a exposição).
- **Verificação:** os testes de regressão passam **antes** de mexer (linha de base); e o JSON
  convertido, ao ser reaplicado, dá os mesmos valores que o HTML (comparar campo a campo).
- **Porquê agora:** o JSON é o contrato de que tudo o resto depende (núcleo, módulos,
  editor). Descobrir um erro no esquema depois dos módulos prontos custa muito mais.

### Fase 1 — Núcleo, sem mudar comportamento

**Estado: concluída em 2026-10-13.** Feita em dois passos, cada um com a linha de base a
passar: (1) `js/main.js` → `js/app.js`, carregado como módulo ES; (2) extração do núcleo.

| O que | Onde ficou |
| --- | --- |
| Limites (512 / 512 / 255) | `js/core/limits.js` |
| Estado da cena | `js/core/state.js` |
| Barramento de eventos | `js/core/events.js` |
| Stencil (`applyStencilRule`, `applyStencilState`, `syncStencilValues`) | `js/core/stencil.js` |
| Registos (`registerContent`, `registerPortal`, `unregisterPortal`) | `js/core/registry.js` |
| Dimensão ativa (`setActiveDimension`) | `js/core/active-dimension.js` |
| API pública do núcleo | `js/core/index.js` |

`js/app.js` passou de 607 para 485 linhas. O núcleo **deixou de conhecer portais**:
anuncia `stencil:changed` e cada janela atualiza-se sozinha. Verificado com a cena a
correr: os mesmos números da linha de base (8/8 travessias, 0 cortes de bordo em 70
poses, alfa 0/255/0 no hub, contribuição da moldura de trás 0 px, clique só na dimensão
ativa, 0 erros de consola).

**Ficou por fazer (Fase 2), de propósito:** A2/A3 (um único `keydown` para a cena toda, e
removê-lo no `remove`), A4 (`remove` no panorama e nas obras) e A7 (a travessia passa para
o portal). São correções de comportamento, e a Fase 1 não muda comportamento.
- **Entregável:** `js/core/` com estado, registos, `applyStencilState()`,
  `setActiveDimension()` e eventos. O arranque (`js/app.js`) passa a chamar o núcleo.
- **D10 aplica-se aqui:** o código que se move é **renomeado ao mover** (glossário da Fase 0)
  e as mensagens de consola passam a inglês. Um componente por commit, para os diffs serem
  revistos um a um.
- **Verificação:** **zero** diferença visual e funcional: 8/8 travessias, 0 poses com bordo
  cortado, contorno fechado, clique só na dimensão ativa, consola limpa. Se algo mudar, é bug.
- **Risco:** o núcleo ser "o main.js com outro nome". Mitigação: nenhuma função pode
  conhecer `document.querySelector('a-camera')`.

### Fase 2 — Os 4 módulos
- **Entregável:** `js/modules/dimension.js`, `artwork.js`, `portal.js`, `camera.js`; `js/app.js`
  fica só com o arranque (`config-ar`).
- **Correções incluídas:** A2/A3 (um único `keydown`), A4 (`remove` em todos os módulos),
  A5 (câmara centralizada), A7 (travessia no portal, valores no núcleo).
- **Verificação:** regressão completa + **teste novo**: criar e destruir 20 portais em
  ciclo e confirmar que os listeners voltam a 1 e `estado.portais` fica vazio.
- **Risco:** regressão de render (é a área mais sensível). Mitigação: uma fase só para
  mover código, sem mudar regras.

### Fase 3 — A cena vem de dados
- **Entregável:** `js/scene/scene-builder.js` + `schema.js` + `validation.js`; o
  `index.html` passa a ter `<a-scene>` sem entidades e a cena é construída de
  `data/scene.json` (com `data/scene-example.json` como fixture/testes).
- **Verificação:** a cena de exemplo comporta-se **igual** à de hoje (T1–T8 sobre o exemplo);
  a conversão campo a campo do JSON confere com os valores que o HTML tinha.
- **Risco:** perder um atributo na conversão. Mitigação: o script da Fase 0 é a fonte da
  conversão e a comparação é automática, não visual.

### Fase 3B — Mundos e portas de mundo (D14)

**Porque fica aqui:** um mundo novo só é barato quando a cena vem de dados (Fase 3). Antes
disso, criar uma sala seria copiar blocos de HTML — exactamente o problema que este roadmap
existe para resolver. Fica **antes** da Fase 4 para o editor já nascer com seleção de mundo.

- **Entregável:**
  1. **Uma pasta por mundo**, com o seu arranque (`praia/index.html`, com `<base href="../">`),
     e `data/worlds/` com um ficheiro por mundo (`gate.json` é o portão).
  2. O portal com os **dois eixos** (`window`/`action`) e as tabelas `WINDOW_KINDS` e
     `ACTION_KINDS` no módulo do portal, com a matriz de combinações legais (§5.4).
  3. A **porta de mundo**: retrato com paralaxe (`followCamera: false`) e travessia que
     navega, com `?from=<slug>` opcional.
  4. A **chegada** atrás da porta inversa (V-d), com o afastamento da L16.
  5. Nas ferramentas: **normalizar os panoramas** ao padrão 2048×1024 (L14), **gerar os
     retratos** e validar o grafo de mundos (porta para mundo inexistente, mundo inalcançável,
     porta sem retrato).
- **Verificação:** a migração de formato confere campo a campo (**0 diferenças**) e a cena de
  exemplo continua a dar os números da linha de base (§10) **antes** de a separação em mundos
  acontecer; depois da separação, T1 corre por sala, as travessias de porta de mundo fazem
  **uma só** navegação (sem ping-pong), T10–T12 passam e a consola fica limpa em cada mundo.
- **Risco:** o retrato a envelhecer e a recarga a quebrar a imersão. Mitigação: L11 (porta sem
  retrato), o passo de geração nas ferramentas, e a chegada atrás da porta — que deixa o
  regresso a um passo. A matriz de combinações legais absorve as leis L13 e L15.

### Fase 4 — Página de edição
- **Entregável:** `editor.html` + `css/editor.css` + `js/editor.js`: CRUD por módulo,
  validação (§8), pré-visualização, importar/exportar.
- **D12 aplica-se desde o primeiro ecrã:** todos os rótulos do editor saem do catálogo
  `i18n/pt.json` (`t('editor.…')`) e os campos de texto do conteúdo são **por língua**
  (variante A da §5.7). Fazer o editor só em português "para traduzir depois" era o que a D12
  veio evitar.
- **Verificação:** criar uma dimensão + 2 obras + 1 portal **só pelo editor**, exportar,
  substituir o JSON e ver a cena a funcionar; e os 9 testes de regressão na cena editada.
- **Risco:** o editor e a exposição divergirem. Mitigação: o editor usa os **mesmos** módulos.

### Fase 5 — Gravação direta *(só se a fricção de 2A incomodar)*
- **Entregável:** servidor local mínimo que lê/grava `data/scene.json`, **fora** do que se
  publica; endpoint de exportar; cópia de segurança antes de gravar.
- **Verificação:** editar, gravar, recarregar a exposição e ver a alteração.

### Fase 6 — Testes e limpeza
- **Entregável:** os testes de §10 automatizados (o mesmo script que já usamos no browser).
- **Limpeza de skills — feita em 2026-10-13** (§3, D15). Apagados: o esqueleto Cline (88 pastas,
  0 ficheiros), as 3 falsas "junções" de descoberta e o `__pycache__`. Mantidos de propósito: os
  **5 repos `.git`** dos vendors (**funcionais** — o `sync-all-vendors.ps1` faz `git pull`
  neles), o `frontend-slides/plugins/` (conteúdo do clone) e o `skills/doc.md` (guia do kit).
  Índice verificado nas **três passes** (ver `🔧 Manutenção`, no próprio índice).
  Resta só decidir se o conteúdo de `.agent/garbage/` é adaptado ao projeto ou apagado de vez.
- **Verificação:** `npm test`-like (ou `node testes/regressao.mjs`) verde na `main`.

---

## 10. Testes de regressão (a rede de segurança)

Estes já foram medidos manualmente; passam a ser o critério de aceitação de qualquer fase.

| # | Teste | Esperado |
| --- | --- | --- |
| T1 | Travessias dos 8 portais (a andar, passo 0,1 m) | 8/8 corretas |
| T2 | Bordo da moldura, varredura de poses | 0 poses com bordo cortado |
| T3 | Contorno da moldura fecha | 0 falhas de bordo |
| T4 | Janelas no hub (portal 0/1) | dentro vê a outra dimensão, fora é transparente |
| T5 | Portal de trás atrás de um da frente | ganha o da frente; moldura de trás não invade a janela |
| T6 | Clique na obra | abre só na dimensão ativa |
| T7 | Chegada a cada portal | sem trocas em cadeia |
| T8 | Consola | sem erros nem avisos |
| T9 *(novo)* | Criar/destruir portais em ciclo | 1 listener de teclado, registos limpos |
| T10 *(novo, D14)* | Retrato da porta de mundo | Alfa **0 fora** da moldura e **255 dentro** (métrica por alfa, como T4) |
| T11 *(novo, D14)* | Chegada atrás da porta inversa | **0** travessias em cadeia ao aparecer; andar para dentro da sala não dispara nada |
| T12 *(novo, D14)* | Varredura de poses à volta da porta | **0** poses com o retrato a sair da moldura (como T2) |

### Linha de base medida (2026-10-12, Fase 0)

Medido com a cena a correr, **antes** de mexer em qualquer código. É o valor a que cada
fase se compara.

| # | Teste | Linha de base |
| --- | --- | --- |
| T1 | Travessias dos 8 portais | 8/8 corretas |
| T2 | Bordo da moldura cortado | 0 poses em 69 testadas |
| T3 | Contorno da moldura fecha | 0 falhas em 956 amostras |
| T4 | Janela no hub (portal 0) | **alfa**: 0 fora, 255 no centro (métrica por alfa, não por cor) |
| T5 | Portal de trás atrás de um da frente | contribuição da moldura de trás **dentro** da janela da frente: **0 px** (medido por diferença, com margem de 3 px) |
| T6 | Clique na obra | abre na dimensão ativa; não abre noutra |
| T7 | Chegada aos portais | 1 troca por travessia (sem ping-pong) |
| T8 | Consola | 0 erros, 0 avisos, 0 pedidos falhados |
| — | Conversão HTML→JSON (validação campo a campo) | **161 campos** comparados, **0 diferenças** |

**Lição de método (Fase 1).** Duas destas medições eram frágeis e foram corrigidas:

- **T4** comparava a **cor exata** de um panorama fotográfico — que muda com o texel
  amostrado. Passou a comparar **alfa** (0 fora, 255 dentro), que é o que o teste quer
  provar.
- **T5** contava pixels vermelhos **sem margem** e apanhava uma **coluna de 1 px** da
  moldura do próprio portal, exatamente na aresta do polígono da janela — deu 509 px numa
  execução e 0 noutra, sem qualquer diferença no render. Passou a medir por **diferença**
  (com a moldura de trás visível e escondida) e com **margem de 3 px**: contribuição 0.

Regra para a automação (Fase 6): medir **presença/ausência** ou **diferença entre dois
estados**, nunca valores absolutos de cor, e dar margem às fronteiras geométricas.

---

## 11. Decisões

> As decisões fechadas ficam registadas aqui com data, para o roadmap servir de histórico.
> Uma decisão fechada só se reabre com motivo escrito.

| # | Decisão | Estado | Escolha |
| --- | --- | --- | --- |
| D1 | Formato dos módulos | **FECHADA** (2026-10-12) | **ES Modules nativos com `import`/`export`, sem build.** Custo aceite: passar a servir por HTTP (já obrigatório pela D2) |
| D2 | Onde vive o dado do editor | **FECHADA** (2026-10-12) | **JSON no projeto (`data/scene.json`) + botões Importar/Exportar.** Site 100% estático, o ficheiro fica versionado. Consequência aceite: gravar exige substituir o ficheiro à mão |
| D3 | Como o editor vê a cena | **FECHADA** (2026-10-12) | **Formulários/tabelas por módulo + pré-visualização da cena ao lado.** Sem manipuladores 3D |
| D4 | Estrutura da segunda página | **FECHADA** (2026-10-12) | **`editor.html` separado**, a importar o núcleo e os 4 módulos. A exposição (`index.html`) não leva código de edição |
| D5 | O que é o módulo da câmara | **FECHADA** (2026-10-12) | **As duas**: câmara-jogador (posição, movimento, controles) e câmara-real (webcam/AR), em secções separadas do mesmo módulo |
| D6 | Onde vivem a documentação de planeamento e as ferramentas | **FECHADA** (2026-10-12) | **`docs/` para o roadmap e `tools/` para o script de assets**, ambos versionados. A raiz mantém só o essencial (`index.html`, `README.md`, `css/`, `js/`, `assets/`) |
| D7 | Organização dos assets | **FECHADA** (2026-10-12) | **Separar por tipo** (`assets/panoramas/`, `assets/artworks/`, `assets/video/`) + prefixo `d<N>-` no nome do ficheiro, na variante **organizativa (P1)**: o prefixo diz onde o ficheiro mora; quem o usa está no JSON |
| D8 | Skills do projeto vazias | **REABERTA E SUBSTITUÍDA** pela D15 (2026-10-13) | Motivo escrito: **a premissa caiu** — a pasta não estava vazia (tem skills locais e de 5 vendors; quantidades em `📍 Location Map`). A escolha de "não se usa nenhuma skill do projeto" deixou de se justificar |
| D9 | A cena atual é conteúdo real ou demo | **FECHADA** (2026-10-12) | **É demonstração, mas fica no repositório como cena de exemplo** (serve de teste e de montra) |
| D10 | Idioma do código | **FECHADA** (2026-10-12) | **Inglês no código** (identificadores, comentários, mensagens de consola, chaves do JSON); **português na documentação e nos textos da interface** |
| D11 | Arquitetura de render | **FECHADA** (2026-10-12) | **Manter o stencil partilhado e o núcleo.** Não migrar para *render-to-texture* por portal (ver §5.0) |
| D12 | Idiomas | **FECHADA** (2026-10-12) | **Código em inglês, documentação em português, interface preparada para vários idiomas** (catálogo em `i18n/`, português como língua de origem). Variante confirmada: **A** — catálogo para a interface + **campos por idioma nos dados**; língua escolhida por `?lang=`, com português por omissão |
| D13 | Nome dos ficheiros de dados | **FECHADA** (2026-10-12) | **`data/scene.json`** (a exposição) e **`data/scene-example.json`** (a cena de exemplo/fixture) — inglês, coerente com a D10 |
| D14 | Mundos e portas de mundo | **FECHADA** (2026-10-13) | **Um endereço por mundo, com recarga de página** (`/praia/`, pasta por sala, arranque com `<base href="../">`); o **portão é um mundo** (o de entrada, com a câmara/AR); a **porta de mundo** mostra um retrato estático do destino **com paralaxe** e a travessia **navega** (`?from=<slug>` opcional); a chegada é **atrás da porta inversa** (V-d); o portal passa a ter **dois eixos** — `window` e `action` — com **tabelas de comportamentos** no módulo do portal; **sem manifesto** (M5) e **sem dados de outro mundo** a atravessar a fronteira |
| D15 | Harness de skills do projeto | **FECHADA** (2026-10-13) — **emendada no mesmo dia** | **Usar o harness de `.harness/skills/` com um índice único e verificado.** O índice `.agent/skills_index.md` passa a cobrir o **`.agent/` inteiro** (rules, agents, skills, sub-skills, workflows, scripts, ferramentas, vendors, standalone, quarentena) e a declarar a raiz dos caminhos; as entradas são **validadas contra o disco em três passes** — `índice → disco`, **quantidades** e `disco → índice`. O material herdado de outro projeto (`Gabinete`) é **isolado em `.agent/garbage/`** (`project_sync.py`, `update-{3d,audio,layout}.md`) e as referências a `CODEBASE.md` / `ARCHITECTURE.md` / `GABINETE_DESIGN_SYSTEM.md` em ficheiros ativos tornam-se condicionais ou apontam para o índice. Scripts referenciados mas **inexistentes** são removidos. **Limpeza (2026-10-13):** apagados o esqueleto Cline (88 pastas, 0 ficheiros), as 3 falsas "junções" de descoberta e o `__pycache__`; mantidos os 5 repos `.git` dos vendors (**funcionais** — servem o `sync-all-vendors.ps1`), o `frontend-slides/plugins/` (conteúdo do clone) e o `skills/doc.md` (guia do kit). **Custo aceite:** as pastas de descoberta automática dos vendors não existem; recriá-las é um comando quando se quiser |

> **Emenda da D15 (2026-10-13, 3.ª atualização).** A primeira versão do índice foi dada como
> fechada com **uma** passe de validação — e essa passe **não consegue** detectar
> material que *falta* no índice, porque só pergunta se as linhas que existem resolvem. Medido
> ao disco, o índice omitia skills inteiras, documentação de apoio e ferramentas, e descrevia
> como "cópia" um espelho que não tinha um único ficheiro. Corrigido em §3, no
> `skills_index.md` e no `README.md` (regra 5): passou a haver **três** passes, com a inversa a
> olhar para o disco à procura do que falta. **Os números exatos desta auditoria estão em
> `HARNESS_LOG.md`.**

### Efeitos da D14 na execução

**Decidido:** a casa passa a ter **um endereço por sala**. Um *mundo* é o que hoje é a cena
inteira (dimensões + obras + portais + uma só dimensão ativa); o **portão** é o mundo de
entrada, com a câmara/AR, e tem uma porta para cada sala. Cada sala tem o seu endereço
(`/praia/`) e atravessar uma **porta de mundo** recarrega a página.

#### O que isto resolve de graça

| Efeito | Porquê |
| --- | --- |
| **Isolamento garantido por construção** | Cada carregamento traz só o JSON do seu mundo: o outro nunca existe em memória |
| **O núcleo não muda** | O singleton de `state` continua a valer: cada recarga é uma instância nova. A **D11 não é reaberta** |
| **O limite dos 255 valores de stencil passa a ser por mundo** | Era a única limitação física (L5) |
| **O `remove` dos módulos (A3/A4) não é crítico para mundos** | Ao atravessar uma porta de mundo, a página morre inteira |

#### O retrato da porta de mundo (o que substitui a janela ao vivo)

Com recarga de página, a janela **não pode** mostrar o outro mundo ao vivo — ele não existe na
página de origem. O quadro passa a ser um **retrato estático**, uma imagem panorâmica declarada
na própria porta, com **paralaxe**:

- **Mecanismo:** a imagem do destino numa esfera **que não segue a câmara**
  (`followCamera: false` — o interruptor **já existe** no `panorama-dimensao`). Dá paralaxe
  real, não muda nenhuma lei de render, e entra pela mesma máquina da janela (máscara com
  stencil + profundidade, conteúdo com `depthTest: false`).
- **O raio é um botão artístico:** raio grande = mundo "longe" e pouca paralaxe; pequeno =
  mundo "perto" e paralaxe forte. Regra: `radius` maior do que ~3× a distância do visitante à
  porta (senão a superfície da esfera cai à frente do plano da porta e a paralaxe inverte) e
  menor do que o raio do fundo da sala.
- **A orientação sai da chegada**, não de um campo novo: o que se vê pela janela é o que se vê
  ao atravessar.
- **O retrato é autoral:** por ser uma imagem declarada, pode ser o fundo do destino, um
  teaser, uma versão antiga ou um desenho — desde que respeite a forma do fundo (L14).
- **A pré-visualização é uma dimensão derivada** (G2-b): o construtor de cena cria-a na banda
  reservada `448…511` (L15), com `followCamera: false`, e o núcleo **não precisa de saber**.
  Duas portas para o mesmo mundo partilham-na: 1 textura, 1 valor, 1 desenho — o que os
  portais 4 e 5 já provam hoje.

#### O que atravessa a fronteira do mundo

**Só um slug.** Nada mais:

| O que | Como |
| --- | --- |
| **O endereço** | `/praia/` — a pasta da sala, com o seu arranque |
| **A origem** | `?from=<slug>`, opcional (é o que permite escolher a porta de chegada) |
| **Uma imagem** | O retrato, que é um ficheiro declarado na porta de origem |

O JSON do mundo de destino **nunca** é lido pela página de origem. É a razão da variante **M5**
(sem manifesto): a etiqueta e o retrato vivem na própria porta. As leis L11 e L13 guardam isso.

#### Os dois eixos do portal

O portal passa a ser a combinação de `window` (o que a janela mostra) com `action` (o que a
travessia faz), com as tabelas `WINDOW_KINDS` e `ACTION_KINDS` no **módulo do portal** — nunca
no núcleo. A matriz de combinações legais está na §5.4; o componente consulta a tabela em três
pontos (`shownDimension`, `onTraverse`, `validate`), e a `validate` é a que o editor reutiliza
na Fase 4. Acrescentar um uso passa a ser acrescentar uma entrada.

#### Duas migrações, e só uma agora

| Migração | Quando | Muda comportamento? |
| --- | --- | --- |
| **De formato** — os 8 portais passam a `window`/`action` | **agora** (por script) | **Não** — todos ficam `dimension-pair` + `enter-window` |
| **De sentido** — cidade/praia/céu viram mundos e algumas portas viram `navigate` | **Fase 3B** | **Sim** — é aí que entram a recarga, o `?from` e a chegada |

A migração de formato é feita pelo conversor e confirmada pelo validador (**0 diferenças**,
como na Fase 0). Nota de segurança: em `dimension-pair` + `enter-window` a **ordem do par não
interessa**, logo a migração não pode trocar `A` por `B` — que era o risco assinalado na §6.

#### O que a D14 obriga a acrescentar às ferramentas

- **Normalizar os panoramas** ao padrão **2048×1024 equirectangular (2:1)**. Os panoramas
  atuais estão fora do padrão, **medido**: `forest.jpg` 9923×2614 (3,80:1, ~99 MB de textura) e
  `skycloud.jpg` 960×240 (4:1). A memória depende dos **pixels**, não do tamanho do ficheiro
  (`praia.jpg` tem 0,61 MB e custa 2 MB de textura).
- **Gerar o retrato** de cada porta de mundo, no padrão.
- **Validar o grafo de mundos:** porta para mundo inexistente · ficheiro de mundo que ninguém
  alcança · porta de mundo sem retrato.

#### O que continua igual (e é a parte que sai ganhadora)

Os portais internos, o stencil, a ordem de desenho e as leis **L1–L8 não mudam**. Dentro de
cada sala, a técnica toda continua válida — é isso que faz dos mundos uma fase, e não uma
reescrita.

### Efeitos da D7 na execução

**Decidido:** separar por **tipo**, com **prefixo de dimensão** no nome do ficheiro.

```
assets/panoramas/d1-forest.jpg
assets/panoramas/d2-praia.jpg
assets/artworks/d1-aurora.jpg
assets/video/d1-tour.mp4
```

**Convenção proposta:** `assets/<tipo>/d<N>-<nome>.<ext>`, em minúsculas e sem espaços.

#### O problema a decidir: 5 de 6 ficheiros servem mais do que uma dimensão

Medido na cena atual:

| Ficheiro | Usado em |
| --- | --- |
| `forest.jpg` | panorama da dimensão **1** + obra da dimensão **3** |
| `bryan-goff-…jpg` (`galeriaFoto1`) | obra das dimensões **1 e 2** |
| `eiffel.jpg` (`galeriaFoto2`) | obra das dimensões **1 e 2** |
| `praia.jpg` | panorama da dimensão **2** + obra das dimensões **1 e 3** |
| `skycloud.jpg` | panorama da dimensão **3** + obra das dimensões **1 e 2** |
| `compequicolor1024vr.mp4` | obra da dimensão **1** |

Ou seja: um nome como `d2-praia.jpg` **mentiria** em duas das três utilizações. Há três
formas de conviver com isto:

| Variante | Como funciona | Ganhos | Perdas / consequências |
| --- | --- | --- | --- |
| **P1. Prefixo organizativo** | O nome leva a dimensão *principal* (onde o ficheiro "mora"); o JSON continua a ser a **verdade** sobre quem o usa | Zero duplicação; a pasta fica legível; nada quebra quando um ficheiro passa a ser usado noutra dimensão | O prefixo pode "mentir"; a validação só pode **avisar** ("este ficheiro é usado na dimensão 3 e o nome diz 2"), nunca garantir |
| **P2. Prefixo obrigatório** | Cada utilização tem o seu ficheiro físico (`artworks/d1-praia.jpg` **e** `artworks/d3-praia.jpg`, mesmos bytes) | A regra é sempre verdadeira; dá para encontrar tudo de uma dimensão sem abrir o JSON; apagar uma dimensão é apagar uma pasta | **Duplicação já hoje**: 5 dos 6 ficheiros teriam de ser copiados (o vídeo tem 6 MB, a floresta 3,2 MB); trocar uma imagem obriga a trocar N cópias; repositório maior; históricos de `git` divergentes |
| **P3. Prefixo só para ficheiros novos** | O que existe mantém o nome; o que se acrescenta segue a convenção | Zero retrabalho agora | A pasta fica **mista para sempre**; quem procura por `d3-*` não encontra o que já lá estava |

**Recomendação: P1** — **decidido.** O prefixo serve para uma pessoa se orientar numa pasta
com dezenas de ficheiros, e para isso o "onde mora" chega. A P2 compra uma regra mais forte
ao preço de duplicar 6 MB de conteúdo e de criar uma obrigação de manutenção em várias
cópias — e a única coisa que a P2 dá de garantia (saber quem usa o quê) o **JSON já dá de
forma exata**.

Consequência aceite com a P1: quando um ficheiro passar a ser usado por outra dimensão, o
**nome não muda** (só o JSON). A validação avisa, não bloqueia. Registado para não gerar
confusão futura: *"o prefixo é uma pista, o JSON é a lei"*.

#### O editor não pode renomear ficheiros (consequência da D2)

Como o editor não escreve em disco, o prefixo tem de ser aplicado por quem põe o ficheiro no
projeto. Duas formas:

| Variante | Como funciona | Ganhos | Perdas |
| --- | --- | --- | --- |
| **R1. Script de processamento** *(a ideia que levantaram)* | Uma pasta de entrada (ex.: `.harness/inbox/`) e um script lê o JSON (ou um nome já prefixado) e **copia para o destino certo com o nome certo**; avisa de repetidos e de assets em falta | Um passo só; nomes sempre coerentes; pode detetar assets órfãos e ficheiros sem uso | Mais uma ferramenta a manter; se não for versionada, só quem a tem a pode usar |
| **R2. Nome à mão** | Quem acrescenta o ficheiro nomeia-o já no formato | Zero ferramenta | Depende da disciplina; um `praia.jpg` sem prefixo entra e ninguém nota |

**Recomendação: R1** — o script fica **versionado** em `tools/` (decisão D6): é ferramenta de
construção da exposição, não lixo de desenvolvimento, e quem entrar no projeto tem de poder
usá-la. R2 fica como plano B se a ferramenta se revelar mais trabalho do que poupança.

#### Consequências a não esquecer

- Renomear os ficheiros atuais obriga a atualizar: o `src` dos 6 assets em `<a-assets>`, os
  10 `abrir-modal="url: …"`, o `material-virtual="src: #id"` (que usa o **id**, não o
  caminho — esse não muda) e as referências no README.
- O `id` do asset (`#praia`) é **independente** do nome do ficheiro: pode ficar como está
  (D10 permite manter nomes em português para ids já existentes).
- Acrescentadas à validação (§8) duas regras novas:
  **L9** — todo o `asset` do JSON existe em disco (inclui o retrato de cada porta de mundo);
  **L10** — o nome do ficheiro segue a convenção (aviso, não erro).

### Efeitos da D12 na execução

- Surge uma pasta nova, `i18n/`, com o **português como língua de origem**:
  `i18n/pt.json` (e `i18n/en.json` quando houver tradução). Formato plano de chaves
  (`"editor.artwork.title": "Título da obra"`).
- **A Fase 4 (editor) passa a incluir a tradução desde o início.** Fazer o editor em
  português "para depois traduzir" seria reescrever todos os rótulos e os formulários — é
  exatamente o que a D12 pretende evitar. Custo agora: mínimo (uma chamada `t()` em vez de um
  literal). Custo depois: reescrever tudo.
- **A Fase 2 (módulos) só tem uma obrigação:** os módulos **não** contêm texto de interface.
  As mensagens de consola são técnica (inglês) e não passam pelo catálogo.
- **A Fase 3 (dados)** tem de decidir já o formato do texto do conteúdo (`title: { pt, en }`),
  porque o conversor gera o JSON: mudar depois obriga a reconverter.
- **O A-Frame e a interface existente ficam com texto em português no HTML** (o "ATIVAR
  EXPOSIÇÃO", o "Carregando..."). Pela regra 4 da §5.7, contam como **valores de origem do
  português** e o catálogo tem de ter a mesma chave — não se inventa um segundo texto.
- **Custo aceite:** um pouco mais de cerimónia (chave + catálogo em vez de texto direto) em
  troca de não haver reescrita quando entrar a segunda língua.
- **Não afeta o JavaScript dos módulos**: nenhum módulo faz `t('...')` — quem mostra texto é
  a interface (`editor.js`, e o arranque da exposição). Os módulos expõem **estado**, não
  frases.

### Efeitos da D10 na execução

O código que existe hoje é todo em português. Esta decisão obriga a um **glossário** (para
não haver três traduções para a mesma coisa) e a um **método** de renomeação.

**O glossário de identificadores (PT→EN) e os nomes novos dos componentes A-Frame estão na
§5.7** — fonte única —, junto com as regras da interface traduzível.

**Método: renomear ao mover, não numa fase própria.** Como a Fase 1 e a Fase 2 já tocam em
todas as linhas (mover para o núcleo e para os módulos), renomear no mesmo passo evita dois
passos sobre os mesmos ficheiros e evita um estado meio-traduzido a viver semanas.
A salvaguarda é a mesma de sempre: os testes da §10 correm **a cada** passo, e nomes não
alteram comportamento.

| Opção | Ganhos | Perdas |
| --- | --- | --- |
| **Renomear ao mover** (recomendado) | Um passo só por linha; nada meio-traduzido; diffs maiores mas cada um coberto por testes | Diffs maiores (mais difícil ver "só moveu") — mitiga-se movendo **um** componente por commit |
| Mover primeiro, renomear depois | Cada commit faz uma coisa só (mais fácil de revisar) | Duas passagens pelas mesmas linhas; o estado misto dura até ao fim |
| Não renomear o que existe | Zero risco imediato | Fica misto **para sempre** (a pior opção a longo prazo, e contradiz a decisão) |

**Consequências a não esquecer:**
- As **chaves do JSON mudam para inglês** (§6 já refletido), o que altera o `data/scene.json`.
- Os **atributos no HTML** mudam (`dimensaoA` → `dimensionA`, `caixa` → `box`, …) e com eles
  a cena de exemplo — a migração da Fase 3 tem de os converter.
- As **mensagens de consola** passam a inglês (`[portal] Active dimension: 2`) — afeta os
  testes que hoje procuram `[portal] Dimensao ativa: 2`.
- A **interface** (botões, "Carregando...", erro de câmara) e a **documentação**
  (README, ROADMAP) ficam em português — não se traduzem.
- Comentários no código: inglês. Comentários na documentação: português.

### Efeitos da D9 na execução

- Passa a haver **dois** ficheiros com papéis distintos:

  | Ficheiro | Papel | Quem o lê |
  | --- | --- | --- |
  | `data/scene-example.json` | **Fixture**: a cena atual (4 dimensões, 8 portais, 10 obras). É a referência dos testes (§10) e a montra | testes de regressão; botão "carregar exemplo" no editor |
  | `data/scene.json` | A cena da exposição (começa como cópia fiel do exemplo) | `index.html` |

- Ganho: pode-se substituir ou limpar a cena real sem perder a referência que os testes
  precisam. **Perda a vigiar:** os dois podem divergir — mitigação: um teste que valida o
  exemplo (T1–T8 correm sobre `scene-example.json`).
- A migração (Fase 3) continua a ter de ser **fiel**: os T1–T8 só valem se a cena de exemplo
  se comportar exatamente como hoje (8/8 travessias, 0 cortes de bordo, etc.).
- Isto dá conteúdo concreto à Fase 6: os testes correm contra a fixture, não contra a cena
  que estiver em uso.
- Consequência no editor: um botão explícito "Carregar exemplo" (e não carregar o exemplo em
  silêncio quando o ficheiro da exposição falta — isso esconderia erros de caminho).

### Efeitos da D5 na execução

- `js/modules/camera.js` tem **duas partes com ciclos de vida independentes**:
  `camara-jogador` (estado desde o arranque) e `camara-real` (só liga quando o utilizador
  autoriza). Nenhuma pode depender da outra para funcionar.
- Resolve o acoplamento A5: os 3 `querySelector('a-camera')` (`js/main.js:290`, `480`, `521`)
  desaparecem; o panorama, a travessia e o movimento passam a pedir a posição ao módulo.
- A `camara-jogador` passa a ter **posição inicial nos dados** (`camaras.jogador.posicao`),
  o que é editável no editor — hoje está fixa em `<a-camera position="0 1.6 0">`.
- A `camara-real` mantém o que já existe e funciona: pedido de permissão no arranque
  (`iniciarCena`), `tratarErroCamera()` quando falha, e o `<video>` por trás da cena.
  Passa a ter estado explícito (a pedir / ativa / erro) em vez de mostrar/ocultar divs soltos.
- Consequência: no editor, o painel da câmara só tem 4 campos e um botão — não há
  "inserir" nem "excluir" (é única). Isso fica registado na §7.

### Efeitos da D4 na execução

- A Fase 3 (cena a partir de dados) passa a ser **pré-requisito** do editor: sem isso, o
  editor não tem cena para pré-visualizar. Ordem das fases mantém-se.
- Passa a haver dois pontos de entrada, ambos finos: `js/app.js` (exposição) e
  `js/editor.js` (editor). `index.html` e `editor.html` só têm a marcação e uma tag de
  script cada.
- O código de edição **não pode** ser importado por `app.js` — regra verificável (basta
  procurar imports de `js/editor/` dentro de `js/modules/` e `js/core/`).
- O `editor.html` não leva a UI de exposição (botão "ATIVAR EXPOSIÇÃO", D-pad, modal de
  obra): é uma ferramenta, não um modo de exibição.

### Efeitos da D3 na execução

- A pré-visualização usa **o núcleo e os módulos a sério** (não uma imitação): o painel de
  pré-visualização monta a cena com o mesmo construtor da exposição. É isto que garante que
  "o que vejo no editor" é a cena real.
- Cada campo do formulário escreve no modelo e **reaplica** o estado (registo + stencil),
  para o efeito ser visível na hora.
- Como não há manipuladores, o posicionamento fino faz-se por números: o formulário deve
  mostrar a **posição atual da câmara** com um botão "usar como posição do portal/obra"
  — é o que evita a maior parte das tentativas e erros.
- Enquanto o editor não existir, o **inspector do A-Frame** (`Ctrl+Alt+I`) serve de apoio
  para descobrir coordenadas; não é dependência.
- Consequência a aceitar: afinar rotações "a olho" continua a ser por valores. Se doer
  demasiado, acrescenta-se **um** manipulador (arrastar no plano do chão) como incremento
  isolado — a D3 fica fechada na forma "formulários", e o incremento não a reabre.

### Efeitos da D1 na execução

- Estrutura de ficheiros passa a ser **modular de verdade**: cada módulo declara os seus
  `import`, e o núcleo é importado por todos. Nada de `window.PortalAR.*`.
- O `index.html` passa a ter **uma** tag de script: `<script type="module" src="js/app.js">`.
  A ordem dos `<script>` deixa de ser contrato implícito.
- O `js/main.js` de 586 linhas é **dividido**, não reescrito: na Fase 1 e 2 o código move-se
  em pedaços, com a regressão (§10) a validar cada passo.
- Consequência a documentar no README: **abrir `index.html` por `file://` deixa de
  funcionar**; passa a haver um comando de servidor (`python -m http.server 8123`).
- O `config-ar` (que hoje corre em `init` do componente) tem de ser aplicado **antes** de
  qualquer módulo desenhar: passa a ser o primeiro `import` do arranque, e não um atributo
  da cena. É o tipo de detalhe que só se descobre quando falha — fica registado.

### Efeitos da D2 na execução

- O editor **nunca escreve em disco**: carrega `data/scene.json` (via `fetch`) e descarrega o
  resultado por *download*; a pessoa substitui o ficheiro e faz `commit`.
- Como não há escrita, **a Fase 5 (servidor) sai do caminho crítico** e passa a ser apenas
  uma comodidade futura, se a fricção incomodar.
- Passa a haver um requisito de *ferramenta*: ao gravar, os **diffs do JSON** são a prova de
  cada alteração — por isso o JSON tem de ser estável e legível (chaves ordenadas, indentação
  de 2 espaços, sem campos vazios), senão cada gravação gera ruído no `git diff`.
- O `index.html` passa a depender de `fetch('data/scene.json')` → **obriga a servir por HTTP**
  (reforça a D1: o custo do `file://` já existe de qualquer forma).
- O editor tem de ter, além de CRUD: **"Exportar"**, **"Importar"** e **"Validar"**
  (as leis da §8). Sem validação, exportar torna-se a forma mais fácil de estragar a cena.

---

## 12. Riscos transversais

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Regressão de render ao modularizar | Média | Alto (é o coração do projeto) | Fase 1 e 2 sem mudar regras; T1–T8 a cada passo |
| Editor e exposição divergirem | Média | Alto | Partilhar os módulos (D4 opção 4A) |
| Perder a cena ao gravar | Baixa | Alto | Fase 0/2A: JSON versionado + exportar antes de gravar; cópia antes de qualquer escrita |
| Crescimento do `js/app.js` outra vez | Média | Médio | Regra: `js/app.js` só com o arranque e os componentes; revisão no fim de cada fase |
| Complexidade do editor atrasar a exposição | Média | Médio | O editor não bloqueia a exposição: a Fase 3 entrega valor mesmo sem Fase 4 |
| Retrato da porta de mundo a envelhecer | Média | Médio | L11 (porta sem retrato) + passo de geração nas ferramentas; o campo `preview.asset` torna a troca uma mudança de campo, não de código |
| Assets fora do padrão (9923×2614, 960×240) | **Alta — já acontece** | Médio | Normalizar ao padrão 2048×1024 na Fase 3B (L14); a memória depende dos pixels, não do ficheiro |
| Recarga de página a perder o percurso | Alta | Baixo/Médio | A permissão da câmara é **por origem** (não volta a ser pedida); a chegada atrás da porta deixa o regresso a um passo |

---

## 13. Resumo — todas as decisões fechadas (2026-10-12 · D14 e D15 em 2026-10-13)

| # | Decisão | Escolha |
| --- | --- | --- |
| D1 | Formato dos módulos | ES Modules nativos, sem build |
| D2 | Dados | JSON no projeto + Importar/Exportar |
| D3 | Editor | Formulários + pré-visualização |
| D4 | Página | `editor.html` separado, a importar os mesmos módulos |
| D5 | Câmara | As duas: jogador + real |
| D6 | Documentação e ferramentas | `docs/ROADMAP.md` + `tools/` (versionados) |
| D7 | Assets | Por tipo (`panoramas/artworks/video`) + prefixo `d<N>-` **organizativo** (P1) |
| D8 | Skills vazias | **Reaberta e substituída pela D15** (a pasta não estava vazia — medido em §3) |
| D9 | Cena atual | Demonstração, mantida como cena de exemplo |
| D10 | Idioma | Código em inglês; documentação e interface em português |
| D11 | Arquitetura de render | Stencil partilhado + núcleo (sem *render-to-texture*) |
| D12 | Idiomas | Código em inglês, docs em português, interface traduzível (catálogo `i18n/`, PT como origem) |
| D13 | Ficheiros de dados | `data/scene.json` + `data/scene-example.json` |
| D14 | Mundos e portas de mundo | Um endereço por mundo (com recarga); o portão é um mundo de entrada; a porta de mundo é um retrato com paralaxe + navegação (`?from=` opcional); o portal passa a ter dois eixos (`window`/`action`) com tabelas de comportamentos no módulo |
| D15 | Harness de skills | Usar o harness de `.harness/skills/` com **índice único** (`.agent/skills_index.md`, cobrindo todo o `.agent/`) **validado contra o disco em três passes**; **quarentena** em `.agent/garbage/` do material herdado do `Gabinete`; **limpeza** feita (esqueleto Cline, falsas junções e `__pycache__` apagados; os repos `.git` dos vendors mantidos por serem funcionais) |

**Roadmap aprovado em 2026-10-12.**

**D14 fechada em 2026-10-13** — mundos: §11 (efeitos), leis L9–L18 em §8, testes T10–T12 em
§10 e Fase 3B em §9. Planeamento: nada implementado.

**D15 fechada em 2026-10-13, emendada no mesmo dia** — harness de skills: estado medido em §3,
decisão (e emenda) em §11, e a limpeza da Fase 6 em §9. **Reabre e substitui a D8.** A emenda
corrigiu um índice que omitia **13** `SKILL.md` e **75** `.md`, porque o validador só corria
numa direção; passou a exigir **três passes** — a inversa e a das quantidades. Não é código de produção: `.harness/` está fora
do repositório (`.gitignore`), por isso nada disto altera o que se publica.

### O que fica decidido, em uma frase

O código passa a **ES Modules em inglês** (núcleo + 4 módulos), a cena passa a viver em
**`data/scene.json`** (com uma cena de exemplo versionada para testes), os assets organizam-se
por tipo com prefixo de dimensão organizativo, e o **`editor.html`** é uma ferramenta
separada, de formulários, que usa os mesmos módulos e exporta o JSON — sem nada a escrever em
disco.

### Fase 0 — concluída em 2026-10-12

| # | Item | Estado |
| --- | --- | --- |
| 1 | Glossário PT→EN (§5.7) e as 6 regras da interface traduzível | ✅ |
| 2 | Testes de regressão (§10) aceites como critério de aceitação | ✅ |
| 3 | Variante da D12 confirmada (**A**) e `?lang=` para a língua | ✅ |
| 4 | Nome dos ficheiros de dados decidido (D13) | ✅ |
| 5 | `i18n/pt.json` com as 6 chaves que já existem na interface | ✅ |
| 6 | Conversor `tools/html-to-scene-json/convert.mjs` | ✅ |
| 7 | Validador `tools/html-to-scene-json/validate.mjs` (contagens, integridade, L1, L4, L5) | ✅ |
| 8 | `data/scene.json` + `data/scene-example.json` gerados | ✅ |
| 9 | Linha de base medida e registada (§10) | ✅ |

Ficou também corrigida, nesta fase, uma regressão da limpeza da raiz: o `<link rel="icon">`
apontava para um ficheiro que saiu da raiz e o browser passou a pedir `/favicon.ico` (404 na
consola). Passou a `<link rel="icon" href="data:,">`, que não pede nada — a console voltou a
0 erros (T8).

### Próximo passo: Fase 2 (os 4 módulos)

Dividir `js/app.js` em `js/modules/dimension.js`, `artwork.js`, `portal.js` e `camera.js`,
renomeando ao mover (glossário §5.7) e corrigindo, no mesmo passo, os pontos A2, A3, A4,
A5 e A7 de §2.1. A linha de base de §10 tem de continuar a dar os mesmos números, mais o
T9 (criar e destruir portais em ciclo: 1 listener de teclado e registos limpos).
