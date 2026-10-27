# Roadmap — Módulos de construção e página de edição

> **Estado: APROVADO em 2026-10-12.** As decisões estruturais estão fechadas e registadas na
> secção [11](#11-decisões) com data. Nada de código foi implementado: este documento é o
> guia de desenvolvimento, e o `README.md` descreve o que **já** existe.
>
> **Atualização (2026-10-24, Fase 7 — plano):** com a **Fase 6 fechada**, o autor pediu a fase que
> implementa o que ficou documentado e **sem fase**. A **Fase 7** junta, **bloco a bloco**, os sete
> itens do inventário de 2026-10-24: os fundos **shader** (**R14**/**R15** — último bloco e atrás de
> flag), os quatro valores que o esquema valida e a cena ignora (**R9**/**D30**: `model`, `text`,
> `color` e `link` a navegar), a **exclusão em lote** por dimensão, o **`i18n/en.json`** (**160**
> chaves), o **catálogo de assets** no editor e os **portais animados** (§1) — mais o saneamento das
> três afirmações que a documentação deixou para trás. O plano, os blocos **B1–B10**, as metas e a
> aceitação estão em §9. **B1** e **B9** implementados (o B1 veio com o plano); os restantes blocos
> não começaram.
>
> **Atualização (2026-10-24, Fase 7 — B9 em produção e o rename):** o **B9** está implementado e o
> shader passou a ser o **fundo de produção** das três salas, por decisão do autor depois de o
> ensaio passar no telemóvel fraco e no desktop: `scene1` → `grade-neon`, `scene2` → `por-do-sol`,
> `scene3` → `nuvens`, cada uma com o panorama atual como `fallbackAsset` e `?shader=0` como escape.
> A política **20 → 15 FPS → estático** (pixelRatio primeiro, piso **1**) corre em
> `js/modules/shader-policy.js`; a cadência é mantida por um prazo que avança um intervalo, para um
> ecrã rápido não a arredondar para baixo. Há agora um **validador/instalador** de shaders
> (`tools/shader/`): recebe o corpo do fragment, compila, mede as atualizações entregues e **recusa**
> abaixo de **19 de 20** por segundo; `--force` instala para ensaio com o número medido. O **A/B
> controlado nos três aparelhos continua por registar** — a decisão de produção foi tomada com o que
> o autor observou, e é isso que fica escrito; **R14/R15 ficam abertos** até esse registo. Na mesma
> data as salas passaram a chamar-se **`scene1`** (a cidade), **`scene2`** (a praia) e **`scene3`**
> (o céu): o nome de conteúdo e as imagens não mudaram, o endereço é que sim — as secções históricas
> (§9, §11, §13, §14) continuam a citar os nomes e endereços antigos, que é onde foram medidos.
>
> **Atualização (2026-10-24, Fase 6 — FECHADA):** a **Fase 6 (testes e limpeza)** correu
> **bloco a bloco** (B0–B7) e fechou com a verificação medida, não estimada. O **T1** e o
> **T7/T11** deixaram de precisar de uma sessão de trabalho: `tools/regression/traversal-tests.mjs`
> mede as **12** portas e as **8** chegadas (**20 de 20**). O comando único da §9 passou a existir —
> `node tools/regression/all.mjs`, **4 de 4** baterias em **119,3 s**, e **11 de 11** em **551,4 s**
> com `--full`. A varredura de poses passou a **recusar** o resultado quando a câmara se mexe
> (`refused`, e não `fail`), e as duas pendências que viviam dentro dos instrumentos fecharam-se: a
> **R16** (a sangria do T10/T12 era a aresta da moldura, uma textura a assentar **e** uma obra em
> vídeo; a medida voltou a **0 px**) e a **R17** (a ponte espera pela descodificação da imagem, com
> teto de 1,5 s). O plano, os blocos e o que cada um mediu estão em §9; o README ganhou o comando
> único. **No telemóvel, a 2026-10-24, na versão publicada: aceito e validado pelo autor.**
> **Marco: a branch `v0.0.11`.**
>
> **Atualização (2026-10-24, Fase 6 — plano):** a fase foi planeada **antes** de mexer em código,
> com a linha de base re-medida no mesmo dia: `validate` **0**, as leis **21 de 21**, a bateria dos
> doze **35 de 35** nas 5 páginas.
>
> **Atualização (2026-10-23, Fase 5 — fechada):** a **gravação direta** correu **bloco a bloco** e
> cada bloco foi dado por **medido**, como nas fases anteriores. O que a fase entregou: o **servidor
> da ferramenta** (`tools/server/serve.mjs`) que serve a publicação **e** grava
> `data/worlds/<slug>.json`, com o **mesmo** validador (as **mesmas** recusas: erros, versão, slug
> trocado, mundo que não existe), **cópia de segurança** antes de cada gravação e escrita atómica; e
> o botão **«Gravar»** no editor, que só existe quando o servidor responde (o cabeçalho
> `X-Zonas12-Serve`). O «Exportar» da D2 **fica** — é o caminho de qualquer host —, e a D2 passa a
> ter data de emenda: o editor não escreve, a ferramenta escreve. Decisões **D48–D51** (§11); o
> plano, os blocos e o que cada um mediu em §9. **Aceitação medida:** `validate.mjs` **0**, as leis
> **21 de 21**, a bateria dos doze **35 de 35** nos 5 mundos, o servidor **34 de 34**, e o
> `git diff` de uma gravação a mostrar **uma** linha. **Aceite no telemóvel a 2026-10-24**, na versão
> publicada: os **8** itens passaram. **Marco: a branch `v0.0.10`.** O passo seguinte é a **Fase 6**.
>
> **Atualização (2026-10-20, Fase 4 — fechada):** a **página de edição** correu **bloco a bloco**
> (B0–B10, um commit por bloco) e cada bloco foi dado por **medido** — browser e linha de comando —,
> nunca por estimativa: o plano e as sete decisões (**D30–D36**) na §9 e na §11, e «o que o Bn
> entregou e mediu» logo a seguir à tabela de blocos. O que a fase entregou: `editor.html` com
> **cinco painéis** que usam os **mesmos** módulos e o mesmo validador da exposição, a
> pré-visualização que re-cria a entidade editada, o desfazer por instantâneos, a guarda de saída, e
> uma exportação que **valida tudo antes de exportar** — mais as respostas que a página passou a dar
> sobre os ficheiros (**L9** e **L14**), o que levou o «por verificar» do relatório a **0** nos 5
> mundos. O **R9** fechou-se por aviso (**D30**), o **R13** e o **R8** fecharam-se nos B2 e B3, e o
> **R11** foi resolvido no B10 **com o próprio editor** (as duas obras do céu passaram de **0** para
> **2** no primeiro plano de quem chega). **Marco: a branch `v0.0.7`.** O passo seguinte é a
> **Fase 5** (gravação direta), que só se faz se a fricção de exportar incomodar.
>
> **Atualização (2026-10-15):** fecharam-se a **Fase 2** (os 4 módulos) e a **Fase 3**
> (a cena vem de dados), que foi planeada e executada no mesmo dia. A Fase 3 tem decisões
> próprias — **D20** (o catálogo de assets), **D21** (o texto por língua), **D22** (os dois eixos
> do portal ficam na 3B) e **D23** (`version: 2` e `?scene=`) —, o plano com os 9 blocos e as
> medições em §9 e o fecho em §13. O resultado: o `index.html` perdeu as entidades de cena
> (**240 → 82 linhas**), a cena vive em `data/scene.json` (formato v2, validado por
> `js/scene/validation.js`), e o estado foi publicado e testado pelo autor nas **três versões**
> (local, endereço publicado e telemóvel) e marcado como **`v0.0.5`** (ramo `v0.0.5`).
> O próximo passo é a **Fase 3B** (§13).
>
> **Atualização (2026-10-16, Fase 3B — fechada):** a fase correu **bloco a bloco**, um commit por
> bloco, e cada bloco foi dado por **medido** (browser e linha de comando) e nunca por estimativa:
> **B0–B10 feitos** — o plano e a tabela de blocos na §9, as decisões **D24–D29** em §11 e «o que o
> Bn entregou e mediu» logo a seguir à tabela, onde ficaram também as **duas emendas ao plano** (a
> migração dentro do B2 e as leis com o seu dado, no B5) e o achado que virou decisão (a porta que
> faltava na praia, **D29**). O que a fase entregou: **quatro mundos** mais o fixture, cada um com o
> seu ficheiro e o seu **endereço**, com a porta de mundo a mostrar um **retrato** derivado e a
> navegar; a **L19** e o verificador dos **arranques** nas ferramentas; e a bateria de testes
> (T10–T12, T2/T3, T8/T9) medida em cada mundo. **Marco: a branch `v0.0.6`.** O passo seguinte é a
> **Fase 4** (a página de edição, §9) — e ficam três itens do autor em §14 (R10–R12).
>
> **Atualização (2026-10-15, Fase 3B — plano):** a fase seguinte foi planeada **antes** de mexer
> em código e o contrato que a D14 não fixava ficou fechado: **D24** (quatro mundos, uma dimensão
> cada, com as 8 portas de hoje a `navigate`), **D25** (o formato **v3** e os dois eixos dentro do
> eixo), **D26** (o retrato como dimensão derivada), **D27** (os assets da D7 e os retratos) e
> **D28** (o slug de cada mundo — **emendada no B7**: os 4 arranques são iguais **fora da linha do
> `<base>`**, não byte-idênticos). O plano — o que existe hoje, o
> corte, os **11 blocos** e as metas medidas — está na §9, e as decisões em §11. **Nada
> implementado.**
>
> **Atualização (2026-10-15, documentação):** esta revisão alinha o documento com o código depois
> do fecho da Fase 3 — §5.5 e §5.6 com o «como ficou», §7 com o `url` do D20, §8 com as leis que o
> validador verifica hoje, §10 com as lições de método, §13 com os caminhos novos das ferramentas,
> e §14 com as pendências **R8** e **R9**.
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
> **Atualização (2026-10-14):** a lei **L6** foi reescrita pela decisão **D16** (§11) — passou a
> enunciar o **invariante**, porque quem fixa `sortObjects = true` é o A-Frame (medido na fonte,
> na 1.8.0); a única linha de código tocada foi um comentário. A mesma ronda fechou as
> pendências de SEO e de acessibilidade do `index.html` e a **D17** (§11) acrescentou uma
> **quarta passe** ao validador do índice: o *frontmatter* de cada agent, conferido contra o
> disco. A **D18** (§11) fechou a quarentena do harness — mantém-se como referência —, que era o
> último ponto em aberto da Fase 6.
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

**Fora do escopo (por agora):** multiusuário, base de dados remota, autenticação, substituir o
A-Frame, modelo de iluminação/PBR. Os **portais em movimento animado** estavam nesta lista até
2026-10-24, quando a **Fase 7** (§9) os trouxe para dentro do escopo (bloco **B8**).

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

**Fecho de A2 e A3 (2026-10-15).** As duas eram o mesmo defeito: o ouvinte de teclado nascia
dentro do `init` de **cada** portal e nunca era removido. Medido no browser, com portais a serem
criados e destruídos em ciclo (`DOMDebugger.getEventListeners` sobre o `document`): **8**
ouvintes de `keydown` na carga (um por portal), **13** depois de criar e destruir 5 portais e
**14** depois do rig de sobreposição do T5 — um ouvinte morto por cada portal criado, a manter
vivo o portal removido. A correção é o desenho que o T9 pedia: **um** ouvinte para a cena
inteira, a iterar o registo de portais (`js/app.js`), onde já não há nada que se possa acumular.
O comportamento mantém-se igual ao que os 8 ouvintes davam (premir `R` roda todos os portais,
`D` liga/desliga a caixa de debug de todos). Passou a **1** na carga e **1** depois de 6 ciclos
de criação/destruição. A4–A7 continuam abertas.

**Fecho de A4, A5 e A7 (2026-10-15, Fase 2).** As três fecharam com os módulos. **A4:** a obra,
o panorama e o portal ganharam `remove()` e o núcleo um `unregisterContent()`, para que conteúdo
que sai da cena saia do registo — medido a tirar as 5 obras **e** o panorama da dimensão 1: a
chave dela desaparece do registo e sobram `[2, 3]`. **A5:** o `a-camera` passou a existir só em
`js/modules/camera.js`; os outros três sítios pedem a posição (`playerCamera.position()` e
`worldPosition()`). **A7:** a travessia passou a ser do próprio portal (`detectTraversal()`) e a
atribuição de valores ficou no núcleo; o que resta do antigo `gestor-dimensoes` é o driver de
frame, que passou a viver no módulo do portal (decisão **D19**, §11). **O A6 tem decisão tomada**
— o **D20** (§11, 2026-10-15) fecha o campo único `asset` num **catálogo de assets** — e fecha no
dado nos blocos B3 e B4 da Fase 3.
| A8 | `config-ar` | `sortObjects`, `autoClearStencil`, `setClearColor` | É configuração de render: tem de ser única e correr antes de tudo |

> **Nota (Fase 1).** As referências de linha desta tabela são da **v0.0.2**, quando a lógica
> estava toda em `js/main.js`. Depois do passo 1 da Fase 1 esse ficheiro passou a ser
> `js/app.js` (entrada de módulo) e as linhas deslocaram-se; na **Fase 2** cada bloco foi para
> `js/modules/` e os nomes mudaram (D10). A tabela fica como o registo da v0.0.2.

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

**Validação — três passes, não uma (2026-10-13; uma quarta em 2026-10-14, D17).** A primeira versão do validador só fazia
`índice → disco`, e por isso **anunciava que estava tudo bem enquanto o índice omitia
material**: skills inteiras, documentação de apoio e ferramentas. Por construção, uma validação
só nessa direção **nunca** encontra o que não está no índice. O critério passou a ser três
passes:

| Passe | Pergunta | Onde corre |
| :--- | :--- | :--- |
| **1 — direta** (`índice → disco`) | as entradas resolvem? | `validate_skills_index.ps1` |
| **2 — quantidades** | algum número do `Location Map` mente? | idem |
| **3 — inversa** (`disco → índice`) | ficou algo de fora? | idem |
| **4 — frontmatter** (`agent → disco`) | alguma skill citada num `skills:` de agent não existe? | idem |

O código é `.harness/skills/.agent/scripts/validate_skills_index.ps1` e sai com **código 0** só
quando as quatro estão verdes. Fica fora do índice de propósito: o índice é para consultar.

A **passe 2** fecha a lacuna que deixou passar o erro original: o índice declarava números que
ninguém conferia. A **passe 3** é a única que olha para o disco à procura do que **falta**. A
**passe 4** (D17) fecha a última direção que faltava: nada conferia o que um agent afirma **de
si** — um `skills:` a citar uma skill inexistente passava invisível às outras três.

**A lição, registada:** um índice que valida apenas a si próprio não pode detectar o que não
está nele. Foi o que aconteceu — e é a razão de a passe 3 existir. A passe 4 é a variante da
mesma lição: quem só olha para o índice também não vê um ficheiro a mentir sobre si próprio.

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
- **Funções:** `register(kind, item)`, `unregister(kind, item)` (resolve **A4**; o **A3** ficou
  resolvido por um só ouvinte de teclado, em `js/app.js` — §2.1),
  `applyStencilState()` (o único sítio que toca em `stencilFunc/ref`, `depthTest/Write` e
  `renderOrder`), `setActiveDimension(id)` (única porta de entrada).
- **Eventos:** `core:ready`, `dimension:active-changed`, `portal:traversed`,
  `registry:changed`.
- **Não faz:** criar objetos 3D, ler JSON, conhecer o DOM do editor, ler o teclado.

> **Como ficou (2026-10-15, Fase 2).** Os nomes verdadeiros estão em `js/core/index.js`:
> `state`, `registerContent` / `unregisterContent` (resolve o **A4**), `registerPortal` /
> `unregisterPortal`, `applyStencilRule` / `applyStencilState` / `syncStencilValues`,
> `setActiveDimension` e `on` / `off` / `emit`. Dos eventos propostos existem **dois**: o
> `stencil:changed` (é ele que faz cada janela atualizar-se sozinha, sem o núcleo conhecer
> portais) e o `dimension:active-changed`; `core:ready`, `portal:traversed` e `registry:changed`
> **não** existem, porque nada precisou deles. O que a §5.0 promete mantém-se, medido por `grep`:
> nenhum ficheiro de `js/core/` importa de `js/modules/` e nenhum fala com o `document`.

### 5.2 Módulo Dimensão

- **Responsabilidade:** uma dimensão = ID + fundo + lista de conteúdo dela.
- **Campos:** `id` (0…511), `background` (`asset`), `kind` (`image | video | color |
  camera | shader`), `radius`, `followCamera`, `color`, `shaderId` (id da lista interna, só com
  `shader`) e `fallbackAsset` (um asset de imagem, só com `shader`).
- **API:** `create / update / remove / list`.
- **Regras:** ID único; `radius` > distância a qualquer portal (senão o fundo aparece dentro
  da janela — regra medida na v0.0.2); vídeo obriga a `VideoTexture`.
- **Depende de:** núcleo; câmara (se `followCamera`).

> **Como ficou (2026-10-15, Fase 3).** `createDimension(dimension, parent)` e
> `removeDimension(el)` existem; `update` e `list` **não** — quem os vai precisar é o editor
> (Fase 4), e até lá seriam código sem quem o chame. O campo do dado é `asset`, um **nome do
> catálogo** (D20), e é o construtor de cena que cria o `<img>`/`<video>` correspondente e lhe dá
> esse id, para o `src: "#id"` do componente resolver. Uma dimensão de `kind: "camera"` **não tem
> entidade**: o fundo dela é a webcam atrás do canvas.

> **Como ficou (Fase 4, plano de 2026-10-16).** O `update`/`list` da API proposta **não** são
> pedidos nesta fase: o editor **re-cria a entidade** com a `createDimension()` e o `remove()`
> quando um campo muda (**D33**, §11) — uma via só, em vez de duas para a mesma geometria.

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

> **Como ficou (2026-10-15, Fase 3).** `createArtwork(artwork, parent)` e `removeArtwork(el)`. O
> `asset` do dado é um nome do catálogo e o módulo transforma-o no seletor `#id` do material; com
> `interaction: "modal"` **não há** `url` nenhum no dado — o endereço deriva do catálogo (D20, o
> fecho do **A6**) e chega à fábrica já resolvido, porque quem conhece o catálogo é o construtor de
> cena. `url` só existe para `interaction: "link"`. O `title` por língua (D21) é lido pelo editor
> (Fase 4): nenhuma fábrica o usa ainda. E, como na dimensão, o `update`/`list` da API proposta
> **não** é pedido: o editor re-cria a entidade (**D33**, §11).

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

> **Como ficou (2026-10-15, Fase 2).** O componente é `stencil-portal` e o schema tem `id`,
> `dimensionA`, `dimensionB`, `ownedBy`, `width`, `height`, `box`, `boxPosition`, `boxRotation` e
> `trigger` (`plane` / `box`). O `frame {color, thickness}` e o `motion` **não** são campos do
> schema: a moldura é construída no código com a cor e a espessura de que o conversor lê o valor
> para o JSON (Fase 0). Os **dois eixos** (`window` / `action`) são da Fase 3B (decisão **D22**,
> §11, que alinha a §6 e a §11 com esta nota).
> O **A7** está fechado: a travessia é do portal (`detectTraversal()`) e o que resta do antigo
> gestor é o driver de frame, que vive neste módulo (decisão **D19**).

> **Como ficou (2026-10-15, Fase 3).** A moldura passou a ser **dado**: `frameColor` e
> `frameThickness` são campos do schema, com as omissões que o código tinha escritas à mão
> (vermelho, 0,3) — e é de lá que o conversor os lê, o que impede os dois de divergirem. Existem
> `createPortal(portal, parent)` e `removePortal(el)`: as fábricas constroem a entidade
> **desacoplada** e só depois a anexam, para o `init` correr uma vez e a máscara e as quatro
> barras serem construídas uma só vez (é a lei **L7** à escala da cena — medido: **5** filhos no
> grupo).

> **Como ficou (2026-10-15, Fase 3B, bloco B4).** Os **dois eixos** são a forma do dado e as tabelas
> existem: `js/modules/portal-kinds.js` tem os nomes, o que cada entrada significa (`shows`,
> `enters`, `navigates`), a **matriz** das combinações legais, `validateDoor()` — a validação que o
> editor vai reutilizar — e `worldHref()`, o endereço de um mundo a partir de `document.baseURI`
> (D28). O **componente consulta a tabela em dois pontos** (`shownDimension` e `onTraverse`), e a
> `validate` é a tabela que o **validador de dados** corre (L18) — as três coisas de §5.4, com a
> validação do lado de quem lê o dado e não do lado de quem desenha.
>
> **Porque o ficheiro é separado do `portal.js`** (uma nota, porque a D14 dizia «no módulo do
> portal»): o mesmo validador corre em `node` (`tools/scene/validate.mjs`) e **não pode** importar
> `portal.js`, que regista um componente A-Frame ao ser importado. A tabela ficou pura, ao lado do
> módulo, e o módulo acrescenta-lhe o comportamento. A matriz tem **um só dono**: o módulo lê-a para
> a porta se validar e o validador lê-a para a lei L18, e é isso que impede os dois de discordarem.
>
> **O que o bloco descobriu:** a travessia estava presa à **visibilidade da janela**, o que fazia de
> `window: none` + `action: navigate` — legal pela matriz — uma porta que ninguém conseguia
> atravessar. Passou a depender de a porta **estar** onde o visitante está, e a máscara passou a
> esconder-se quando a janela não mostra nada (escreve profundidade, e sem janela tapava o que está
> atrás sem dar nada em troca).

> **Como ficou (Fase 4, plano de 2026-10-16).** O `update`/`list` da API proposta **não** é pedido:
> o editor re-cria a porta (`createPortal` + `removePortal`) quando um campo muda (**D33**, §11), e
> é a mesma via que a fábrica usa no arranque. A validação da porta, essa, continua a ser **uma só**
> — a `validateDoor()` da tabela dos eixos, que o formulário do editor reutiliza.

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

> **Como ficou (2026-10-15, Fase 2).** `js/modules/camera.js` expõe `playerCamera` (com
> `position()`, `worldPosition()` e `setPosition()`), `setupMobileControls()` e
> `reportCameraError()`, e é o **único** ficheiro do projeto que sabe onde a câmara está
> (medido por `grep`). O `enable()` / `disable()` da câmara real **não** existem.

> **Como ficou (2026-10-15, Fase 3).** A câmara passou a vir do dado: `createPlayerCamera(player,
> parent)` constrói o `a-camera` (com o `a-cursor` filho) a partir de `cameras.player` e **entrega
> o elemento ao módulo**, por onde o seletor saiu — era a segunda metade do A5, porque um sítio a
> criar a câmara e outro a procurá-la seriam outra vez dois sítios a saber onde ela está. O passo
> do D-pad vem de `cameras.player.speed`, com a constante do módulo como omissão (é essa que o
> conversor lê, e é o que impede os dois de divergirem). E o `startSession()` é o que era o script
> inline do `index.html`: webcam, D-pad, indicador de carregamento e erro de câmara — e só pede a
> webcam quando `cameras.real.enabled` diz que sim (antes o campo existia no JSON e ninguém o lia).

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
│   ├── editor.js            arranque do editor (a entrada — D36)
│   ├── editor/              modelo, painéis, pré-visualização e exportação (D36)
│   ├── core/                estado, registos, stencil, ordem de desenho, eventos, limites
│   ├── modules/             dimension.js, artwork.js, portal.js, camera.js
│   └── scene/               scene-builder.js, schema.js, validation.js, arrival.js, render-config.js
├── data/                    scene.json + scene-example.json (D13)
│   └── worlds/              um ficheiro por mundo + gate.json — D14 (Fase 3B)
├── i18n/                    pt.json (+ en.json quando houver tradução)
├── assets/{panoramas,artworks,video,previews}/
├── tools/                   ferramentas
│   ├── scene/               validador dos ficheiros de cena
│   ├── migration/           o conversor HTML→JSON da Fase 0, com guarda
│   └── regression/          varredura de poses T2/T3 (corre na consola do browser)
└── .harness/                fora do repositório (está no .gitignore)
    └── skills/              harness de agents/skills — índice em .agent/skills_index.md (§3)
```

> **Onde isto está (2026-10-16, Fase 3B fechada).** Existem: `index.html` (sem entidades de cena) e
> os **4 arranques** — a raiz e as pastas `cidade/`, `praia/` e `ceu/`, com o mesmo ficheiro fora da
> linha do `<base>` —, `css/style.css`, `js/{app.js, core/, modules/, scene/}`, `data/worlds/{gate,
> cidade,praia,ceu,example}.json` (**desde o B6 a cena é um ficheiro por mundo** — o
> `data/scene.json` do mundo único deixou de existir), `i18n/pt.json`,
> `assets/{panoramas,artworks,video,previews}` (divididos por tipo no B5) e
> `tools/{scene, migration, regression, assets}`. **Existem desde o B4 de 2026-10-20:** o
> `editor.html`, o `css/editor.css`, o `js/editor.js` (a entrada) e o `js/editor/` (modelo,
> pré-visualização, problemas). **Por fazer:** os painéis de edição (B5–B8), o `en.json` (quando
> houver tradução) e o **R11** (no B10); o **R10** foi aceite e não se faz.

Nota de nomenclatura: as pastas de **código** são em inglês (D10), e os ficheiros de dados
também: `data/worlds/<slug>.json` é uma sala (ou o portão), e `data/worlds/example.json` é a cena de
exemplo (decisão D13, com o nome do ficheiro a ser o slug do mundo — D28).

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

## 6. Modelo de dados da cena — implementado (formato v3, um ficheiro por mundo)

> **Nota (2026-10-15, Fase 3B, fim do B6).** O formato **v3** está implementado e a cena é um
> **ficheiro por mundo** (`data/worlds/{gate,cidade,praia,ceu}.json`): o `world` por ficheiro, os
> **dois eixos** na porta, as dimensões renumeradas de 0 em cada mundo e os assets de cada mundo
> declarados no seu catálogo. O `data/scene.json` do mundo único deixou de existir — a migração
> está em `tools/migration/worlds.mjs` (bloco B6, §9). Os **endereços** (uma pasta por mundo, com o
> seu arranque) são o bloco seguinte.

> **Estado: implementado em 2026-10-15** (Fase 3). Isto deixou de ser proposta: é o formato que o
> `js/scene/schema.js` descreve, que o `js/scene/validation.js` verifica e que o
> `js/scene/scene-builder.js` constrói. As decisões que o levaram até aqui — o catálogo de assets
> (**D20**), o texto por língua (**D21**) e a versão (**D23**) — estão na §11. O protótipo da
> Fase 0 tinha o `url` do modal em cada obra e nenhum catálogo; é essa a diferença que o v2 veio
> tirar.

```json
{
  "version": 2,
  "cameras": {
    "player": { "position": [0, 1.6, 0], "speed": 0.1 },
    "real": { "enabled": true }
  },
  "assets": {
    "cidade-360": { "path": "assets/panoramas/cidade-d0-forest.jpg", "type": "image",
                    "alt": { "pt": "Panorama 360º da dimensão 1 (cidade)", "en": "360º panorama of dimension 1 (city)" } }
  },
  "dimensions": [
    { "id": 0, "kind": "camera", "name": { "pt": "Realidade", "en": "Reality" } },
    { "id": 1, "kind": "image", "asset": "cidade-360", "radius": 500,
      "name": { "pt": "Cidade 360º", "en": "City 360º" } }
  ],
  "artworks": [
    { "id": 0, "dimension": 1, "kind": "image", "asset": "galeriaFoto1",
      "position": [-44, 1.5, -55], "rotation": [0, 15, 0], "size": [4, 3, 0.1],
      "interaction": "modal" }
  ],
  "portals": [
    { "id": 0, "dimensionA": 0, "dimensionB": 1, "ownedBy": 0,
      "position": [-6, 0, -8], "width": 8, "height": 10,
      "box": [12, 16, 1], "boxPosition": [0, 8, 0], "trigger": "plane",
      "frame": { "color": "#ff0000", "thickness": 0.3 } }
  ]
}
```

**O que o dado não carrega, e porquê:** o campo `url` de uma obra existe **só** para
`interaction: "link"` (uma ligação externa, que não é um asset); com `interaction: "modal"` o
endereço **deriva** do catálogo (D20), e o validador recusa os dois campos juntos. O `title` de
uma obra é opcional: é texto de conteúdo, e quem o lê é o editor (Fase 4).

**Nota (Fase 7):** uma dimensão pode ser `kind: "shader"`, com `shaderId` (id da **lista interna**,
nunca GLSL) e `fallbackAsset` (uma imagem do catálogo) no lugar de `asset` — o exemplo acima
continua válido para os fundos de imagem, que são a reserva. A cadência e o pixelRatio não estão no
dado: são da política (`js/modules/shader-policy.js`). Uma dimensão pode também ser
`kind: "color"`, e aí o fundo é a `color` do dado, sem asset nenhum (D56).

**Nota (Fase 7, obras):** o `kind` de uma obra é campo do dado e decide o que ela é (D58): `image`,
`video` e `model` mostram um ficheiro do catálogo — e um `model` é um GLTF, com o `size` a funcionar
como escala por eixo; `text` **não tem asset** e o conteúdo está no `text`, por língua. Por isso o
`asset` deixou de ser obrigatório em todas: as regras do esquema dizem qual tipo o pede. Uma obra com
`interaction: "link"` **navega** para o seu `url` (D57), em vez de o mostrar no modal.

**Causa/consequência:** passar a dados obrigou a que o `index.html` deixasse de ter entidades (foi
a Fase 3) e que o editor saiba escrever este formato (é a Fase 4). O ganho: criar uma dimensão
deixou de ser «copiar 6 blocos de HTML e não falhar nenhum atributo» — é acrescentar uma entrada à
lista.

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

### Nota (D14, emendada pela D22) — o que os mundos acrescentam ao modelo

O **formato do portal** — os **dois eixos** da §5.4 (`window` e `action`) — migra na **Fase 3B**,
não antes dela: a Fase 3 tem uma obrigação só, a cena passar a vir de dados **sem mudança de
comportamento**, e mudar o formato do portal no mesmo passo duplicaria o diff sem comprar nada
(é a nota de §5.4, de 2026-10-15, que manda — **D22**). Quando migrar, os 8 portais passam a
`dimension-pair` + `enter-window` — **sem mudança de comportamento**, por script, confirmada pelo
validador (**0 diferenças**, como na Fase 0). A ordem do par não interessa nesta combinação, logo
a migração não pode trocar `A` por `B`.

A **forma exacta** dessa migração ficou decidida na **D25** (2026-10-15) e é a que o exemplo
abaixo já escreve: o par muda **para dentro do eixo** (`window {kind, dimensionA, dimensionB}`),
o `action` leva só o `kind` (e o `target` quando navega), e a obrigatoriedade passa a ser
**condicional** — o par só existe com `dimension-pair`, o `target` só com `navigate`.

O que a **Fase 3B** acrescenta ao modelo (nada disto existe ainda):

```json
{
  "version": 3,
  "world": { "slug": "scene2", "name": { "pt": "Praia", "en": "Beach" } },
  "assets": {
    "praia-360": { "path": "assets/panoramas/praia-d0-praia.jpg", "type": "image", "alt": { "pt": "…", "en": "…" } },
    "retrato-cidade": { "path": "assets/previews/praia-to-cidade.jpg", "type": "image", "alt": { "pt": "…", "en": "…" } }
  },
  "dimensions": [
    { "id": 0, "kind": "image", "asset": "praia-360", "radius": 500,
      "name": { "pt": "Praia", "en": "Beach" } }
  ],
  "portals": [
    { "id": 0, "ownedBy": 0,
      "position": [0, 0, -20], "width": 10, "height": 12,
      "box": [12, 16, 1], "boxPosition": [0, 8, 0], "trigger": "plane",
      "window": { "kind": "preview", "asset": "retrato-cidade", "radius": 120 },
      "action": { "kind": "navigate", "target": "scene1" },
      "arrivalFrom": "scene1" }
  ]
}
```

- Cada ficheiro descreve **um mundo** (`world.slug`, e o nome por língua, pela D12), e os ids das
  dimensões são **locais ao mundo** — a dimensão 0 é onde o visitante aparece.
- A **porta de mundo** não tem dados de outro mundo: só o **slug** de destino, o **nome do
  retrato** no catálogo (D20 — um nome, nunca um caminho) e o desempate de chegada
  (`arrivalFrom`, com a lei **L17** a limitar a uma porta de chegada por origem).
- O `?from` que a porta escreve é o **slug do mundo de origem**, que o código já tem: não há
  campo para ele no dado (o `action.from` do exemplo anterior saiu na D25).
- O retrato **não é uma dimensão declarada** do ficheiro: o construtor cria uma **dimensão
  derivada** por par único (`asset`, `radius`), na banda reservada da L15 — é a **D26**.
- O ficheiro do mundo de destino **nunca** é lido pela página de origem — é por isso que não
  há manifesto (variante M5, §11) e que as etiquetas vivem na própria porta.

---

## 7. Funcionalidades da página de edição (por módulo)

| Módulo | Inserir | Alterar | Manutenção | Excluir |
| --- | --- | --- | --- | --- |
| **Mundo** *(D14)* | criar sala: slug, nome por língua, pasta e arranque | etiqueta da porta, retrato, raio do retrato | lista de salas derivada das portas do portão; detetar sala inalcançável e porta para mundo inexistente | bloquear se outra sala apontar para ela (ou remover as portas em cascata, com confirmação) |
| **Dimensão** | ID + tipo de fundo + asset + raio | tipo/asset/raio; ver/editar conteúdo | vista geral com contagem de obras e portais; avisar se o raio é pequeno | bloquear se houver portais/obras a apontar para ela (ou apagar em cascata, com confirmação) |
| **Obra** | escolher dimensão, asset, posição/rotação/tamanho, interação | todos os campos | lista por dimensão; detetar asset em falta; detetar `url` fora do sítio (é só para `interaction: link` — com `modal` o endereço vem do catálogo, D20) | individual e em lote por dimensão |
| **Portal** | `window` + `action`, onde pertence, tamanho, caixa, gatilho | todos os campos, incluindo caixa e moldura | **validar** a combinação legal (§5.4), o destino fora de outras caixas, o valor de stencil; pré-visualizar a travessia | individual; se for o último portal de uma dimensão, avisar |
| **Câmara** | — (é única) | posição inicial, altura, velocidade, webcam on/off | mostrar posição atual; botão "usar a posição atual como inicial" | — (não aplicável) |

**Três notas do plano da Fase 4 (2026-10-16), porque duas linhas desta tabela não se podem
cumprir como estão escritas:**

- **«Mundo» — «pasta e arranque»** não é do editor: sob a **D2** ele **nunca escreve em disco** e,
  sob a **D14**, não há manifesto que lhe diga que pastas existem. A criação da pasta e do arranque
  é de uma **ferramenta** (`tools/scene/new-world.mjs`, **D31**, §11) e o editor mostra o comando.
- **«Dimensão» — o tipo de fundo** só oferece o que a cena **constrói**: `kind: "color"` valida e
  não é construído (é uma das quatro coisas do **R9**), logo o formulário não o oferece e o
  validador **avisa** quem o escrever à mão (**D30**, §11).
- **«Mundo» — «detetar sala inalcançável»** fica na **linha de comando**: descobrir uma sala que
  ninguém alcança exige **listar a pasta** `data/worlds/`, e isso o `fetch` não dá. O editor vê o
  que **alcança a partir do portão** (as portas do `gate` e as portas dessas salas), confere a
  **L11** (o ficheiro do destino existe) e as chegadas (**L17/L19**) — e não constrói nenhum desses
  mundos, que é o que a **L13** proíbe.

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
| L6 | `stencil: true` na cena **e** `sortObjects` ativo no renderer — é ele que faz valer o `renderOrder` | O three **ignora** o `renderOrder` e desenha pela ordem da árvore: tudo o que está organizado por ordem (máscara → panorama → obra → moldura) quebra |
| L7 | Panorama/obra criados só no `update` (A-Frame chama `init` **e** `update`) | O objeto é criado duas vezes (aconteceu com o panorama) |
| L8 | Um só `keydown` para toda a cena | Com um ouvinte por portal, cada portal criado e destruído deixa um ouvinte morto (A3): acumula e mantém o portal removido vivo. **Fechado em 2026-10-15** — passou a haver um só ouvinte, a iterar o registo (§2.1) |
| L9 | Todo o `asset` do JSON existe em disco (inclui o retrato de cada porta de mundo) | Imagem que não aparece (proposta pela D7, registada aqui) |
| L10 | O nome do ficheiro segue `assets/<tipo>/d<N>-<nome>.<ext>` (aviso, não erro) | A pasta deixa de ser pesquisável (proposta pela D7, registada aqui) |
| L11 | A porta de mundo tem `target` de um mundo que existe | Porta que navega para o vazio |
| L12 | Nenhum caminho absoluto a partir da raiz nos dados | Publicado numa subpasta, tudo parte |
| L13 | Nada de pré-visualização de um mundo carregado **ao vivo** | Contradiz a D14: o destino não existe na página de origem |
| L14 | Panoramas (fundo e retrato) **2:1** equirectangular; o padrão 2048×1024 é um **teto, não um alvo** — abaixo dele a imagem custa menos memória e não é defeito | Distorção visível na janela (aspecto errado) e memória imprevisível (medido: 9923×2614 ≈ 99 MB de textura) |
| L15 | IDs declarados `0…447`; `448…511` reservados às dimensões derivadas de pré-visualização | A dimensão derivada é ativada por engano: a câmara fica dentro de um retrato |
| L16 | A chegada fica atrás da porta, afastada mais do que meia profundidade da caixa + margem | Andar em frente ao aparecer dispara travessia (troca em cadeia) |
| L17 | No máximo **uma** porta de chegada por origem, em cada mundo | O visitante aparece num sítio arbitrário |
| L18 | A combinação `window` × `action` é uma das legais (§5.4) | O retrato mente (leva a outro mundo) ou entra-se no retrato |
| L19 | Toda a porta que navega tem, no destino, uma porta que se declara a chegada dessa origem | O visitante chega onde a câmara diz — um sítio que ninguém escolheu — e o regresso fica onde calhar (foi assim que a praia ficou sem caminho para o portão até o B7 o medir: D29) |

As leis **L1–L8** vêm de defeitos medidos. As leis **L9–L18** vêm da D14 (planeamento):
L9 e L10 foram propostas pela D7 e ficam aqui registadas; L11–L18 nascem dos mundos e das
portas de mundo. A **L19** nasce de um defeito **medido** — a primeira porta que o B7 atravessou
(§9) — e é a última a entrar: fecha o que os mundos deixaram em aberto.

**O que está verificado hoje (fim do B8 da Fase 3B).** O `js/scene/validation.js` — o mesmo módulo
que a consola da exposição corre ao arrancar, que `tools/scene/validate.mjs` corre na linha de
comando e que o editor (Fase 4) vai reutilizar — verifica a forma do formato e as leis **L1, L4, L5,
L9, L10, L11, L12, L13, L14, L15, L16, L17 e L18**, cada uma com uma **avaria injetada** que prova
que ela falha quando deve: **17 de 17** no instrumento `tools/scene/laws-selftest.mjs` (§9). A
**L19** é do **grafo** (como a pergunta da alcançabilidade) e não da forma de um ficheiro: precisa do
conjunto todo, e é o `missingArrivals` que a responde — a mesma função que a exposição não pode
correr (D14: cada mundo carrega um ficheiro e nunca vê os outros), razão pela qual o aviso que ela dá
também existe no **runtime**, onde é o visitante que o dispara ao aterrar. As leis
**L2, L3, L6, L7 e L8** são de render (são propriedades do código, não do dado): a **L8** passou a
valer no código em 2026-10-15 (§2.1). As leis dos mundos entraram na **Fase 3B** — **L11, L13, L15,
L16, L17 e L18** no bloco B3, **L10 e L14** no B5 e a **L19** no B8: as que se leem dos **ficheiros**
(um nome, os pixels de uma imagem) ficaram à espera do bloco que mexeu nos ficheiros, pela regra que
o B2 estabeleceu — **uma lei e o dado que a satisfaz entram no mesmo bloco**. A **L14** e a **L9** são
medíveis **só na linha de comando** (a forma de uma imagem, a existência de um ficheiro): o browser
reporta-as como «não verificadas», pelo mesmo caminho que o `options.exists` abriu.

> **Emenda (Fase 4, plano de 2026-10-16).** No **editor** elas passam a ser medíveis **no browser** —
> o ficheiro existe por `fetch` e a forma da imagem por descodificação —, logo o relatório do editor
> cobre o que a linha de comando cobre, **menos** o que exige listar a pasta (uma sala que ninguém
> alcança: é da linha de comando, §7). Na **exposição** nada disto muda: continua a reportá-las como
> «não verificadas».

A **L6** foi reescrita em 2026-10-14 (**D16**): passou a enunciar o **invariante a validar**, e
não a ação — medido na fonte do A-Frame 1.8.0, é o framework que fixa `sortObjects = true` na
inicialização. A lei não nasceu de um defeito diferente; o que mudou foi quem *cria* a garantia.

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

**Ficou por fazer (Fase 2), de propósito:** A4 (`remove` no panorama e nas obras) e A7 (a
travessia passa para o portal). São correções de comportamento, e a Fase 1 não muda
comportamento. **A2/A3 saíram daqui em 2026-10-15**, fora do plano: foram fechados porque o T9
(§10) os mede e o comportamento observado não mudou — premir `R` continua a rodar todos os
portais e `D` continua a ligar/desligar as caixas de todos, que é o que os 8 ouvintes já davam
(ver §2.1).
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

**Estado: concluída em 2026-10-15.** Os quatro módulos existem em `js/modules/`, o `app.js`
ficou só com o arranque (**78 linhas**) e as três decisões que faltavam fechar foram fechadas no
mesmo dia (**D19**, §11).

- **Entregável:** `js/modules/dimension.js`, `artwork.js`, `portal.js`, `camera.js`; `js/app.js`
  fica só com o arranque.
- **Correções incluídas:** A4 (`remove` em todos os módulos), A5 (câmara centralizada),
  A7 (travessia no portal, valores no núcleo). (**A2/A3 já fechados em 2026-10-15** — §2.1.) O
  **A6** não é desta fase: o campo único `asset` (§5.3) é decisão de contrato e vai com a cena a
  vir de dados (Fase 3).
- **Verificação:** regressão completa + **teste novo**: criar e destruir 20 portais em
  ciclo e confirmar que os listeners voltam a 1 e `estado.portais` fica vazio. O T9 já foi
  medido em 2026-10-15 (6 ciclos: **1** ouvinte na carga e **1** no fim, e os portais criados
  não deixam registo).
- **Risco:** regressão de render (é a área mais sensível). Mitigação: uma fase só para
  mover código, sem mudar regras.

#### O corte do `js/app.js`, bloco a bloco

Medido a 2026-10-15, **antes** de mexer. As linhas são um instantâneo de planeamento: depois do
corte deixam de valer — a mesma nota que a §2.1 faz para as referências da v0.0.2.

| Linhas | O que é | Destino |
| --- | --- | --- |
| 1–14 | import do núcleo | `app.js` (fica) |
| 16–72 | modal da obra: Escape, `inert`, foco preso, ouvinte do iframe | `modules/artwork.js` |
| 74–87 | ponte `window.portalAR` / `window.portalDebug` | `app.js` (fica — é a alça dos testes, §10) |
| 91–110 | `gestor-dimensoes` (**A7**) | `modules/portal.js`, como driver de frame |
| 112–131 | `config-ar` → `ar-config` | `app.js` (fica: é o arranque) |
| 133–137 | `cursor-listener` | `modules/artwork.js` |
| 139–161 | `abrir-modal` → `open-artwork` | `modules/artwork.js` |
| 163–184 | `material-virtual` → `dimensional-material` (**A4**) | `modules/artwork.js` |
| 186–239 | `panorama-dimensao` → `dimension-panorama` (**A4**, **A5**) | `modules/dimension.js` |
| 241–454 | `portal-estencil-dinamico` → `stencil-portal` (**A5**, **A7**) | `modules/portal.js` |
| 456–469 | ouvinte único de teclado (`R` / `D`) | `app.js` (fica) |
| 471–514 | movimento mobile e D-pad (**A5**) | `modules/camera.js` |
| 515–537 | loading e erro de câmara | `modules/camera.js` |
| 539–546 | ponte temporária para a interface (`onclick` inline) | `app.js` (fica até à Fase 4) |

#### Blocos de execução

Um bloco por commit — a regra da Fase 1 mantém-se: um componente por commit, para os diffs serem
revistos um a um.

**Correção ao plano (2026-10-15, ao abrir a B2).** Renomear um componente **obriga** a mexer no
`index.html` e nas ferramentas **no mesmo commit**: com o nome antigo no HTML o componente não
existe e o `validate.mjs` passa a contar **0** obras, e o conversor — que lê do código os valores
que lá vivem (caixa, gatilho, moldura, velocidade) — deixa de os encontrar e escreve `null` no
JSON. Logo **cada bloco leva o seu renomeio** (código + HTML + as regexes de `convert.mjs` e
`validate.mjs`) e a **B6** passa a ser a verificação final, em vez de um commit só de renomeios.
O `fromCode` do conversor passou a ler o ponto de entrada **e** todos os módulos, para não voltar
a partir quando o valor seguinte mudar de ficheiro.

| # | Bloco | Fecha |
| --- | --- | --- |
| **B0** | Preparação: fechar §14/R5–R7, branch a partir do estado atual, re-medir a linha de base | — |
| **B1** | `js/modules/camera.js` — `playerCamera`, `realCamera`, D-pad, loading e erro de câmara. Passa a ser o **único** ficheiro que conhece `a-camera` | A5 |
| **B2** | `js/modules/artwork.js` — `dimensional-material` **com `remove()`**, `open-artwork`, o modal e o `cursor-listener` | A4 |
| **B3** | `js/modules/dimension.js` — `dimension-panorama` **com `remove()`**; `followCamera` pede a posição à câmara | A4 |
| **B4** | `js/modules/portal.js` — `stencil-portal`: schema renomeado (`ownedBy`, `box`, `boxPosition`, `trigger`, `frame`), travessia **dentro** do portal, `remove()` completo e os nomes dos objetos 3D em inglês | A4, A7 |
| **B5** | `js/app.js` magro: só o arranque (`ar-config`, o ouvinte único, o driver de frame e as duas pontes). Alvo: **≤100 linhas** | — |
| **B6** | Verificação final das ferramentas e do HTML (cada bloco já leva o seu renomeio — ver acima) | — |
| **B7** | Documentação: README §*Estado atual do código*, §2.1 e §13 deste roadmap | — |

**Feito até agora (2026-10-15):**

| Bloco | O que ficou feito | Medido no browser |
| --- | --- | --- |
| **B0** | Linha de base estática verde e as três decisões de §14 fechadas (**D19**) | `validate.mjs` OK: 4 dimensões, 10 obras, 8 portais |
| **B1** | `js/modules/camera.js`; o `app.js` deixou de conhecer o `a-camera` (faltam os 2 sítios de B3/B4) | 546 → **481** linhas; D-pad anda **4,2 m** em 250 ms (o passo de 0,1 m por frame) |
| **B2** | `js/modules/artwork.js`; o núcleo ganhou `unregisterContent()`; os nomes da obra em inglês | 481 → **371**; tirar as 2 obras da dimensão 3 deixa-a com **1** entrada (o panorama) |
| **B3** | `js/modules/dimension.js`; o panorama ganhou `remove()` e pede a posição à câmara | 371 → **317**; tirar as 5 obras **e** o panorama da dimensão 1 **apaga a chave**; sobra `[2, 3]` |
| **B4** | `js/modules/portal.js`; a travessia passou para o portal, o driver de frame para o módulo (**D19**) e o `remove()` ficou completo | 317 → **77**; travessias mudam a dimensão; **R** roda e **D** liga a caixa; **T9 com 20 ciclos**: 1 ouvinte `keydown` antes e 1 depois, registo de volta a 8 |
| **B5** | `js/app.js` só com o arranque e em inglês (`ar-config`); **B6** verificação final das ferramentas | **78** linhas; os **6** nomes antigos a **0**, o `a-camera` só no módulo da câmara, o núcleo sem conhecer módulos e **3** `remove()` |

Três números que valem para toda a fase: o conversor, regenerado, dá **0 diferenças** no
`data/scene.json` (a garantia da Fase 0); a varredura de poses dá **T2** e **T3** a passar —
**0** de **84** poses com bordo cortado e **0** falhas em **15 708** amostras (o número de
amostras varia com o tamanho da janela; o que não varia são as falhas, que são zero); e o **T1**
foi medido a andar, passo de 0,1 m, pelos **8** portais: **8/8** com **uma só** travessia cada e
sem ping-pong — que é também o **T7**.

#### Metas de sucesso

**(a) Comportamento — nenhum número pode mudar.** Os nove testes são os de §10, e é lá que os
valores vivem; a Fase 2 só lhes acrescenta o ciclo de **20** portais no T9 (o medido em
2026-10-15 foi de 6). Se algum número mexer, é bug — não é tolerância.

**(b) Arquitetura — metas novas, todas mensuráveis.**

| # | Meta | Como se mede | Alvo |
| --- | --- | --- | --- |
| M1 | Os 4 módulos existem | `js/modules/` | 4 ficheiros |
| M2 | `app.js` é só arranque | contagem de linhas | **≤100** (imports, `ar-config`, um ouvinte, o driver e as duas pontes) |
| M3 | A5 fechado | `grep` de `a-camera` em `js/` | **0** fora de `js/modules/camera.js` (os sítios de hoje estão em §2.1) |
| M4 | A4 fechado | `remove()` nos módulos que criam geometria, mais um ciclo de 1 dimensão + 2 obras + 1 portal | **3** `remove()` (obra, dimensão e portal; a câmara não cria objetos 3D, logo não tem o que remover) e registos vazios, sem erros de consola |
| M5 | A7 fechado | leitura do driver e do portal | travessia **só** no portal; atribuição de valores **só** no núcleo |
| M6 | D10 cumprida no que se move | `grep` dos **6** nomes de componente antigos (§5.7) em `js/` e `index.html` | **0** ocorrências |
| M7 | O núcleo continua ignorante | `grep "modules/" js/core/` | **0** |
| M8 | Consola em inglês | leitura | 0 mensagens em português em `console.*` |
| M9 | Ferramentas verdes | `node tools/scene/validate.mjs` | exit **0**, 0 erros, e a conversão campo a campo continua com **0** diferenças (§13) |
| M10 | O instrumento continua vivo | `runPoseSweep()`, mais as duas avarias injetadas | os números de §10; as avarias falham como falhavam |

**(c) Documentação.** O README §*Estado atual do código* (contagens, nomes e a tabela dos 4
módulos) e o §13 deste roadmap passam a apontar a **Fase 3**. As pendências **R3** e **R4** (§14)
continuam abertas: não são desta fase.

#### O que se move com o renomeio (acoplamentos)

| Sítio | Porque não pode ficar para trás |
| --- | --- |
| `tools/regression/pose-sweep.mjs` | Cria o rig com os atributos antigos (`portalId`, `dimensaoA`, `dimensaoB`, `pertenceA`, `caixa`, `caixaPosicao`) e encontra os objetos por `-mascara` e `-moldura-N`. É o **único** instrumento automático que existe (§10) |
| `tools/migration/convert.mjs` e `tools/scene/validate.mjs` *(em 2026-10-15 eram `tools/html-to-scene-json/`; renomeados na B6 — §9)* | Fazem *parsing* do `index.html` pelos quatro nomes de atributos; sem eles o validador conta 0 obras e 0 portais — e mente. O `convert.mjs` vai mais longe: lê do **código** os valores que lá vivem (caixa, gatilho, moldura, velocidade), por isso um valor que mude de ficheiro tem de ser seguido. Depois da Fase 3 ele tem uma **guarda**: se o `index.html` não tiver entidades, recusa correr em vez de escrever um JSON vazio |
| `window.portalAR` / `window.portalDebug` | É a alça da consola e dos scripts de regressão: **não** se renomeia nesta fase |
| Ponte de interface (`window.fecharObra`, `configurarBotoesMobile`, `tratarErroCamera`) | O `index.html` chama-as por atributos inline; ficam até à Fase 4 |
| Ordem de desenho, máscara, profundidade e `sortObjects` | São as leis L2, L3 e L6: a fase **move** código, não muda regras |

### Fase 3 — A cena vem de dados

**Estado: concluída em 2026-10-15.** O plano foi registado **antes** de mexer em código e é o que
está abaixo (o corte, os blocos e as metas); as decisões de contrato que a fase exigia foram
fechadas na mesma altura: **D20** (o campo único `asset`, §5.3), **D21** (o texto por língua, que
fecha o **R4**, §14) e **D23** (a versão do formato e o `?scene=`); a **D22** alinhou os dois eixos
do portal com a Fase 3B. O que cada bloco entregou e mediu está na tabela «Feito até agora», no fim
desta secção.

- **Entregável:** `js/scene/scene-builder.js` + `schema.js` + `validation.js`; o
  `index.html` passa a ter `<a-scene>` sem entidades e a cena é construída de
  `data/scene.json` (com `data/scene-example.json` como fixture/testes).
- **Verificação:** a cena de exemplo comporta-se **igual** à de hoje (T1–T8 sobre o exemplo);
  a conversão campo a campo do JSON confere com os valores que o HTML tinha.
- **Risco:** perder um atributo na conversão. Mitigação: o script da Fase 0 é a fonte da
  conversão e a comparação é automática, não visual.

#### O que existe hoje (medido a 2026-10-15, antes de mexer)

| Item | Valor real |
| --- | --- |
| `index.html` | **240 linhas**: 14 `<a-entity>` (8 portais + 3 dimensões + 3 grupos de obras), 10 `<a-box>`, 1 `<a-camera>`, 5 `<img>` + 1 `<video>` de asset |
| `data/scene.json` | **538 linhas** e **338 valores**; 4 dimensões, 10 obras, 8 portais, 6 assets |
| `js/` | `app.js` **78** linhas; o núcleo **207** (7 ficheiros); os 4 módulos **608** |
| Ferramentas | `convert.mjs` **294** linhas e `validate.mjs` **142** — e as duas leem o `index.html` |
| **Quem lê o JSON** | **Ninguém**: `grep` por `scene.json` ou `fetch(` em `js/` dá **zero**. O dado existe, é validado, e a cena ignora-o — é isto que a fase muda |
| Linha de base | `validate.mjs` OK (4 / 10 / 8, **7** janelas distintas) e o conversor regenerado dá `git status` limpo (**0 diferenças**) |
| Acoplamentos que fecham | **A6** (o mesmo ficheiro em `asset` e em `url`, nas 10 obras), **R4** (o formato por língua documentado e não instanciado) e os valores que vivem no código (`box`, `boxPosition`, `boxRotation`, `trigger`, `frame`, `MOBILE_SPEED`) — o conversor lê-os do `js/` por regex, e a fase **inverte** a direção |

#### O corte do `index.html`, bloco a bloco

O `<a-scene>` está na linha **71** e fecha na **194**: o corpo são as linhas **72–193** (**122
linhas**) e o script inline as **197–238** (**42**). Saem **164 linhas** e ficam **76**.

| Linhas | O que é | Destino |
| --- | --- | --- |
| 74–81 | `<a-assets>`: 5 `<img>` e 1 `<video>` | O catálogo `assets` do JSON (D20); o `scene-builder` enche o `<a-assets>`, que fica vazio no HTML |
| 84–86 | `<a-camera>` e `<a-cursor>` | `cameras.player` no JSON → fábrica em `camera.js`. **A câmara passa a ser entregue ao módulo, que deixa de ter seletor** |
| 93–95 | 3 `dimension-panorama` | `dimensions[]` → `dimension.js` |
| 102–117 | 8 `stencil-portal` | `portals[]` → `portal.js`. A moldura e a caixa passam a vir do dado (`frame` entra no schema do componente) |
| 120–192 | 10 obras em 3 grupos (`z = -60 / -95 / -115`) | `artworks[]` em coordenadas do mundo (o conversor já soma o deslocamento do grupo) → `artwork.js` |
| 197–238 | `iniciarCena`: webcam, D-pad, loading e erro de câmara | `camera.js`, como `startSession()`, **honrando `cameras.real.enabled`** — hoje o campo existe no JSON e ninguém o lê. A ponte `window.iniciarCena` **fica** (é da Fase 4) |
| 71 e 194 | `<a-scene ar-config renderer=… cursor=… raycaster=…>` | **Fica**: é o arranque |

#### Blocos de execução

Um bloco por commit — a regra das fases anteriores mantém-se: o renomeio vai no commit que o
provoca (D10) e cada bloco mede no browser o que fez.

| # | Bloco | Fecha |
| --- | --- | --- |
| **B0** | Linha de base re-medida antes de mexer: T1–T9 e o 0-diferenças (as decisões **D20–D23** estão fechadas em §11) | — |
| **B1** | `js/scene/schema.js`: a forma do JSON — campos, tipos, enumerações (`image/video/color/camera`, `modal/link/none`, `plane/box`), omissões e o catálogo `assets`. **Puro**: sem DOM e sem `AFRAME`; o `node` importa-o e confere que nenhum campo do JSON de hoje ficou por declarar | A6 e o formato do R4 |
| **B2** | `js/scene/validation.js`: a forma (lida do schema) e as leis **L1, L4, L5, L9, L12**, com **uma avaria injetada por verificação** a provar que falha quando deve | uma só implementação da validação |
| **B3** | O conversor escreve o **contrato novo** (`assets`, `url` derivado, campos por língua, `version: 2`), ainda a ler o HTML, **e o `validate.mjs` passa a correr o módulo** — as contagens no HTML morrem com o formato v2, e a conferência de fidelidade passa a ser o 0-diferenças do conversor. A prova: **338 valores, 0 diferenças** | A6 e R4, no dado |
| **B4** | As fábricas nos módulos (`create(data, parent)` / `remove(el)`) e os valores que o JSON já carrega (`frame`, `speed`) a virem do dado. **O HTML ainda governa**: comportamento igual | A6 |
| **B5** | `js/scene/scene-builder.js` e **o corte**: `<a-scene>` sem entidades, o `app.js` a fazer carregar → validar → construir → driver, e `?scene=example` | A6 — o centro da fase |
| **B6** | Ferramentas: a **guarda** do conversor (recusa correr e escrever quando o HTML não tem entidades), o validador sobre o schema partilhado, e a pasta da migração com o nome do que ela é | o conversor deixa de poder destruir o JSON |
| **B7** | Verificação final no browser: T1–T9, consola, varredura de poses (T2/T3) e o ciclo de 20 portais | — |
| **B8** | Documentação: README (§Estrutura, §Estado atual, §Cena atual, §Atributos do portal, §Personalizar Conteúdo, §Melhorias) e roadmap (§9, §13, §14, §2.1, §5.2–5.4, §6) | — |

**Duas regras que o B5 traz, e que não são estilo:**

1. **Construir desacoplado, anexar depois.** A entidade nasce fora da cena, com os atributos todos
   postos, e só no fim é anexada — é a lei **L7** à escala da cena: com o `setAttribute` depois do
   `appendChild`, o `init` **e** o `update` correm e o objeto é construído a dobrar.
2. **A câmara é entregue, não procurada.** O construtor cria o `<a-camera>` e entrega-o ao
   `camera.js`, que deixa de ter seletor: enquanto houver um `querySelector('a-camera')` no
   módulo **e** o construtor a criar, há outra vez dois sítios que sabem onde a câmara está
   (o **A5**, outra vez).

**O que a fase não faz** (e é de propósito): os dois eixos do portal e as tabelas
`WINDOW_KINDS`/`ACTION_KINDS` (**D22**: Fase 3B) · a interface a usar `t('…')` e o catálogo
`i18n` (**R3**: Fase 4) · o editor (`update`/`list` das fábricas, Fase 4) · os mundos e a recarga
(Fase 3B).

**Feito até agora (2026-10-15):**

| Bloco | O que ficou feito | Medido |
| --- | --- | --- |
| **B0** | Linha de base re-medida **antes** de mexer em código (as decisões de contrato já estavam fechadas — **D20–D23**, §11) | T1 **8/8** e T7 **8/8** (uma travessia por portal, sem cadeia) · T2 **0** de **84** poses · T3 **0** falhas em **21 758** amostras e **420** controlos (0 falhas), com o buffer a **1921×847** · T4 alfa **255** dentro da janela e **0** fora dela · T5 **0** px de moldura de trás dentro da janela da frente, com **6 767** px de controlo **fora** dela (a medição não é vazia) · T6 abre **só** na dimensão ativa · T8 **0** erros, **0** avisos e **0** pedidos falhados · T9 **1** ouvinte `keydown` na carga e **1** depois de **20** ciclos, com o registo de volta a **8** · `validate.mjs` OK (4 / 10 / 8, **7** janelas) e o conversor regenerado dá **0** diferenças |
| **B1** | `js/scene/schema.js`: a forma do formato v2 (campos, tipos, enumerações, referências, omissões e o catálogo `assets`), com os limites de id vindos do núcleo. **Puro** | **174** linhas; o `node` importa-o (exit **0**); **0** campos do JSON de hoje por declarar; **0** referências ao DOM, ao A-Frame ou ao `three` |
| **B2** | `js/scene/validation.js`: a forma (lida do schema) e as leis **L1, L4, L5, L9, L12**, com o relatório a dizer o que não pôde verificar e as medidas da cena | O cenário real em v2: **0** erros, **0** avisos, **7** janelas distintas. **17 de 17** avarias injetadas detetadas (uma por verificação: versão desconhecida, `url` numa obra de modal, id repetida, 256 janelas, campo trocado, texto escrito como string, …) |
| **B3** | O JSON passa ao formato v2 — catálogo `assets`, `url` do modal derivado, texto por língua, `version: 2` — e o `validate.mjs` passa a correr o módulo partilhado (as contagens no HTML morrem com o v2) | **190** valores comparados campo a campo com o JSON v1: **0** diferenças não previstas (as mudanças são as decididas: versão, +6 caminhos, +4 nomes, −10 urls); os **10** URLs das obras conferidos contra o catálogo; `validate.mjs` OK nos **2** ficheiros (4 / 10 / 8 / 6 assets, 7 janelas) |
| **B4** | As fábricas nos módulos (`createDimension`/`createArtwork`/`createPortal` + os `remove`) e a moldura do portal como dado (`frameColor`, `frameThickness`) | Criar e destruir 1 dimensão + 2 obras + 1 portal pelo dado: esfera de raio **500** do dado, **3** entradas na dimensão nova, `open-artwork` **só** na obra de modal, portal com **5** filhos no grupo (1 máscara + 4 barras: o `init` correu **uma vez**), moldura **00ff00** de **0,5**; a remover: registo de volta a **8** portais e **[1,2,3]**, **0** sondas na cena, janelas de volta a `[[1,1],[2,2]]`. T2/T3 a passar (0 cortadas, 0 falhas em **21 758**), consola **0/0**, e o conversor regenerado com **0** alterações (os valores da moldura não se moveram) |
| **B5** | `js/scene/scene-builder.js` e **o corte**: o `index.html` perde as entidades (**240 → 82** linhas, saem **164**) e o script inline; o `app.js` carrega → valida → constrói → arranca o driver; `?scene=example` carrega o fixture; o `camera.js` passa a ter o elemento e ganha o `startSession` | A cena toda vinda do dado: T1 **8/8**, T7 **8/8**, T2 **0** de **84**, T3 **0** falhas em **21 752** amostras e **420** controlos, T4 **255** dentro / **0** fora, T5 **0** px dentro da janela da frente com **6 768** px de controlo fora, T6 abre só na ativa, T8 **0/0/0**, T9 **20** ciclos pelos módulos com **1** ouvinte `keydown` antes e **1** depois (**10 → 10** ouvintes no `document`), D-pad **4,2 m** em 250 ms com a velocidade vinda do dado. `?scene=example` dá a mesma cena. **M1** nenhuma marca de entidade no HTML · **M2** **82** linhas · **M3** só o `scene-builder` conhece o DOM/A-Frame · **M4** o núcleo continua a importar só a si |
| **B6** | As ferramentas com o nome do que são: `tools/scene/` (validador) e `tools/migration/` (conversor, o registo da migração), e a **guarda** do conversor | Sem entidades no HTML o conversor **recusa** (exit **1**) e não escreve (`data/` intacto). Com o HTML de B4 (8 portais, 10 obras) a guarda **abre** e o conversor escreve o **mesmo** JSON v2: **0** alterações em `data/` — a mesma prova de fidelidade, repetida a partir de uma revisão do git |
| **B7** | Verificação final da fase, de ponta a ponta, numa sessão limpa | T1 **8/8**, T7 **8/8**, T2 **0** de **84** poses, T3 **0** falhas em **21 752** amostras e **420** controlos (0), T4 **255/0**, T5 **0** dentro com **6 768** de controlo fora, T6 só na dimensão ativa, T8 **0** erros, **0** avisos e **0** pedidos falhados, T9 **20** ciclos com **1** ouvinte `keydown` (**10 → 10** no `document`), D-pad **4,2 m** em 250 ms, e `?scene=example` com os mesmos números |
| **B8** | Documentação: README (§Estrutura, §Estado atual, §Cena atual, §Personalizar Conteúdo, §Como Usar, §Melhorias) e roadmap (§2.1, §5.2–5.4, §6, §9, §13) | — |

**Duas armadilhas de medição, encontradas no B0** (valem para o B7):

1. **O browser tinha o `js/core/index.js` velho em cache** — a página nem o pedia ao servidor e o
   grafo de módulos caía com «does not provide an export named `unregisterContent`». O ficheiro
   no disco e o que o servidor serve estavam certos. Resolve-se desligando a cache
   (`Network.setCacheDisabled`) ou com uma recarga sem cache — sem isso, uma medição pode estar a
   ler **código antigo** sem dar sinal.
2. **A câmara a mexer-se durante a varredura de poses.** Numa sessão em que o botão «ATIVAR
   EXPOSIÇÃO» foi premido e o «avançar» do D-pad ficou preso, a câmara andou **0,1 m por frame**
   (o passo do D-pad) durante toda a medição: a T2 deu **84/84** poses com o bordo cortado e a T3
   **19 323** amostras falhadas — números sem valor nenhum, porque a câmara se move entre os dois
   renders de cada pose. Os **controlos ficaram limpos** (0 falhas), que é justamente o que se
   espera quando os dois renders são o mesmo. A varredura de poses exige **página sem interação e
   câmara parada**; numa recarga limpa, os mesmos 84 poses dão **0** cortadas. *(Fechado na
   **Fase 6**, a 2026-10-24: a varredura deteta que a câmara se mexeu e recusa o resultado —
   veredicto `refused`, §10.)*

#### Metas de sucesso

**(a) Comportamento — nenhum número pode mudar.** Os nove testes são os de §10, e é lá que os
valores vivem.

| # | Teste | Alvo |
| --- | --- | --- |
| T1 + T7 | Travessias dos 8 portais, a andar com passo de 0,1 m | **8/8**, uma só travessia cada, sem ping-pong |
| T2 | Bordo da moldura, varredura de poses | **0** poses com bordo cortado (de **84**) |
| T3 | Contorno da moldura | **0** falhas (~**15 708** amostras) |
| T4 + T5 | Janela do hub e portal de trás | Alfa **0 fora / 255 dentro**; **0 px** da moldura de trás dentro da janela da frente |
| T6 | Clique na obra | Abre **só** na dimensão ativa |
| T8 | Consola | **0** erros e **0** avisos |
| T9 | 20 ciclos de criação/destruição | **1** ouvinte de `keydown` na carga e **1** no fim, com o registo de volta a **8** portais |
| — | D-pad, com o `speed` vindo do dado | **4,2 m** em 250 ms (o valor medido na Fase 2: o dado não pode mexer o número) |

**(b) Arquitetura — metas novas, todas mensuráveis.**

| # | Meta | Como se mede | Alvo |
| --- | --- | --- | --- |
| M1 | O `index.html` perdeu a cena | `grep` no HTML de `stencil-portal=`, `dimension-panorama=`, `dimensional-material=`, `<a-box`, `open-artwork=`, `<a-camera` e `<img>`/`<video>` de asset | **0** em cada |
| M2 | O `index.html` é a página, não a cena | contagem de linhas | **76** medido hoje (alvo **≤ 90**) |
| M3 | `js/scene/` existe e não sabe desenhar | 3 ficheiros, e `AFRAME` só no `scene-builder.js` | **3** ficheiros, **1** com `AFRAME` |
| M4 | O núcleo continua a não conhecer nada | `grep` dos imports de `js/core/` | **0** para `modules/`, `scene/`, DOM e JSON |
| M5 | As leis verificadas | a lista do validador e **uma avaria injetada por lei** (falha quando deve, como a varredura de poses provou para o T2 e o T3) | **L1, L4, L5, L9, L12** e a forma |
| M6 | Uma só implementação da validação | o `validate.mjs` a importar `js/scene/validation.js` | **0** leis duplicadas |
| M7 | O conversor não pode destruir dados | correr depois do corte, sobre um `index.html` sem entidades | sai **1** e não escreve |
| M8 | A prova da migração fica repetível | `git diff <B3> -- data/scene.json` | vazio |

#### Riscos

| Risco | Porquê | O que o fecha |
| --- | --- | --- |
| O `<a-assets>` construído tarde | O `fetch` do JSON é assíncrono, e o `a-scene` pode já ter disparado o `loaded` quando as entidades aparecem | Medir as **6** texturas e a consola no B5; o `dimension.js` já trata o `onload` tardio (é o caminho do `<img>` que ainda não carregou) |
| O flip ser um commit grande | O B5 troca a cena do HTML pelo dado de uma vez | O B3 dá a prova da fidelidade (**0 diferenças**) **antes** e o B4 deixa o HTML a governar até lá; o B5 é de leitura mecânica (só deleções no HTML) |
| Os valores do código passarem a dado | As omissões do schema têm de bater com o que o conversor lê do `js/` | O B3 e o B4 partilham a mesma leitura: se uma omissão divergir, a prova do 0-diferenças quebra |
| O validador deixar de contar no HTML | Passa a validar o JSON, e o `validate.mjs` perde a conferência de contagens | A conferência de fidelidade passa a ser o 0-diferenças do conversor (B3) e o `git diff` do B3 (M8) |
| A ordem de arranque | O driver de frame e a validação passam a correr depois do `fetch` | Medir T8 e T9 no B5; o driver só passa a ter portais para percorrer depois do construtor |

### Fase 3B — Mundos e portas de mundo (D14)

**Estado: plano registado (B0) e linha de base re-medida (B1) em 2026-10-15 — nada de código de
produção tocado.** O plano foi escrito **antes** de
mexer em código, como nas fases anteriores, e as decisões de contrato que a fase exigia foram
fechadas na mesma altura: **D24** (a divisão da cena de hoje em mundos), **D25** (a forma da porta
no formato **v3**), **D26** (o retrato como dimensão derivada), **D27** (a divisão dos assets da
D7 e o nome dos retratos) e **D28** (como cada mundo se identifica). O detalhe de cada uma está na
tabela da §11.

**Porque fica aqui:** um mundo novo só é barato quando a cena vem de dados (Fase 3). Antes
disso, criar uma sala seria copiar blocos de HTML — exactamente o problema que este roadmap
existe para resolver. Fica **antes** da Fase 4 para o editor já nascer com seleção de mundo.

- **Entregável:**
  1. **Uma pasta por mundo**, com o seu arranque (`praia/index.html`, com `<base href="../">`),
     e `data/worlds/` com um ficheiro por mundo (`gate.json` é o portão).
  2. O portal com os **dois eixos** (`window`/`action`, no formato **v3**: o par passa para dentro
     do eixo) e as tabelas `WINDOW_KINDS` e `ACTION_KINDS` no módulo do portal, com a matriz de
     combinações legais (§5.4).
  3. A **porta de mundo**: retrato com paralaxe (dimensão derivada na banda reservada da **L15**,
     com `followCamera: false`) e travessia que navega, com `?from=<slug>` opcional.
  4. A **chegada** atrás da porta inversa (V-d), com o afastamento da L16.
  5. Nas ferramentas: **normalizar os panoramas** ao padrão 2048×1024 (L14), **gerar os
     retratos** e validar o grafo de mundos (porta para mundo inexistente, mundo inalcançável,
     porta sem retrato).
- **Verificação:** as metas da tabela «Metas medidas» abaixo, cada uma com o seu instrumento.
- **Risco:** o retrato a envelhecer e a recarga a quebrar a imersão. Mitigação: L11 (porta sem
  retrato), o passo de geração nas ferramentas, e a chegada atrás da porta — que deixa o
  regresso a um passo. A matriz de combinações legais absorve as leis L13 e L15.

#### O que existe hoje (medido a 2026-10-15, antes de mexer)

| Item | Valor real |
| --- | --- |
| `index.html` | **82** linhas; o `<a-scene>` não tem entidades e o `<a-assets>` está vazio |
| `data/scene.json` | **595** linhas e **265** chaves: 4 dimensões, 10 obras, 8 portais, 6 assets |
| `data/scene-example.json` | **byte-idêntico** ao `scene.json` (mesmo SHA-256): o `?scene=example` é hoje um no-op |
| `js/` | núcleo **206** (7 ficheiros) · módulos **829** (portal 327, camera 214, artwork 177, dimension 111) · `scene/` **631** (schema 176, validation 299, builder 156) · `app.js` **118** |
| Ferramentas | `tools/scene/validate.mjs` **59** · `tools/migration/convert.mjs` **395** (com a guarda do B6 da Fase 3) · `tools/regression/pose-sweep.mjs` **387** |
| Portais | os **8** são `dimensionA`/`dimensionB`/`ownedBy`; **nenhum** tem `window`/`action`. O grafo é uma cadeia: gate → cidade → praia → céu, com a praia a ter 2 portas para a cidade (4 e 5) |
| Assets | tudo em `assets/images/` (**D7 por fazer**): `forest.jpg` **9923×2614** (3,80:1 → **98,9 MB** de textura), `skycloud.jpg` **960×240** (4:1), `praia.jpg` 1024×512 (2:1), `bryan-goff…jpg` 6000×3000 (2:1, **68,7 MB**, é obra), `eiffel.jpg` 1226×855 (obra), vídeo 5,96 MB |
| Banda de ids | `MAX_DIMENSIONS = 512`; a banda reservada da L15 (448…511) dá **64 dimensões derivadas por mundo** e nada a impede hoje |
| Tooling local | node v24.19 · python 3.12 + Pillow 12 (é com isto que se normalizam os panoramas) · sem `ffmpeg`/`magick` |
| Linha de base | a da **v0.0.5** (§10): T1 8/8, T7 8/8, T2 0/84, T3 0 falhas, T4 alfa 255/0, T5 0 px com 6 768 de controlo, T6 OK, T8 0/0/0, T9 1 ouvinte, `validate.mjs` OK (4/10/8, 7 janelas) |

#### A divisão decidida (D24)

Quatro mundos, **uma dimensão cada**, e as **oito portas de hoje** — todas passam a `navigate`,
porque nenhuma sala tem duas dimensões (o fixture, abaixo, é quem mantém a janela ao vivo):

| Mundo | Endereço | Dimensão | Portas (destino) | Retratos distintos |
| --- | --- | --- | --- | --- |
| `gate` (portão) | `/` (a raiz) | d0 — realidade (câmara/AR) | cidade (era o portal 0) · praia (portal 1) | 2 |
| `cidade` | `/cidade/` | cidade + 5 obras | gate (portal 2) · praia (portal 3) | 2 |
| `praia` | `/praia/` | praia + 3 obras | cidade ×2 (portais 4 e 5) · céu (portal 6) | 2 |
| `céu` | `/ceu/` | céu + 2 obras | praia (portal 7) | 1 |

- **O grafo não muda:** a praia continua sem porta para o portão (chega-se lá por cidade), todos
  os mundos são alcançáveis a partir do portão, e as portas 4 e 5 continuam a ser as duas provas
  vivas — agora de que **duas portas para o mesmo mundo partilham o retrato** (1 textura, 1 valor
  de stencil, 1 desenho).
- **A L17 tem justificação medida:** como a praia tem **duas** portas para a cidade, só uma leva
  `arrivalFrom: "cidade"` — é exactamente o desempate que a lei exige e a razão de o campo
  existir.
- **Sem porta de chegada para uma origem, a posição é declarada:** se um mundo não tiver porta com
  `arrivalFrom: <origem>` (e essa origem tiver porta para ele), a chegada usa
  `cameras.player.position` e o validador **avisa** — não é silencioso.
- **O fixture ganha um trabalho:** `data/worlds/example.json` passa a ser o mundo de **duas
  dimensões** com uma porta interna (`dimension-pair` + `enter-window`) e uma porta de mundo, para
  o `?scene=example` continuar a exercitar a janela ao vivo (T1–T9), que a exposição deixa de ter.

#### O corte, ficheiro a ficheiro

| Ficheiro | Agora | Fica |
| --- | --- | --- |
| `js/scene/schema.js` (176) | formato v2 | **v3**: `world {slug, name}`, os dois eixos, `arrivalFrom`, **obrigatoriedade condicional** (o par só com `dimension-pair`, o `target` só com `navigate`) e os ids declarados limitados a **0…447** (L15) |
| `js/scene/validation.js` (299) | L1, L4, L5, L9, L12 | + **L10, L11, L13, L14, L15, L16, L17, L18** e o **grafo de mundos**. A L14 segue o padrão que o `options.exists` já abriu: só a linha de comando sabe medir pixels (`options.imageSize`) e o browser reporta «não verificado» |
| `js/scene/scene-builder.js` (156) | 5 fábricas | + as **dimensões derivadas** dos retratos (centradas na porta, `followCamera: false`) e a **chegada** (`?from` → posição e orientação da câmara) |
| `js/modules/portal.js` (327) | `shownDimension` no par | + `WINDOW_KINDS`/`ACTION_KINDS` (com `shownDimension`, `onTraverse`, `validate`), a matriz da L18 e o `navigate` (**uma só** navegação) |
| `js/modules/dimension.js` (111) | `radius`, `followCamera` | + `position` opcional, para a esfera do retrato nascer na porta **antes** de ser anexada (lei L7) |
| `js/app.js` (118) | `?scene=` | + o slug do mundo (D28) e o `data/worlds/<slug>.json` |
| `index.html` (82) | raiz | a raiz passa a ser o **portão**, e há **4 arranques** (raiz, `cidade/`, `praia/`, `ceu/`), o mesmo ficheiro fora da linha do `<base>` |
| `data/` | 2 ficheiros iguais | `data/worlds/{gate,cidade,praia,ceu}.json` + `example.json` |
| `tools/` | validate, convert, pose-sweep | + o migrador de formato (0 diferenças) e de sentido, + a normalização dos panoramas e a geração dos retratos, + o grafo de mundos e os arranques no `validate.mjs` (e o `tools/scene/arranques.mjs` que ele usa) |

**Armadilha medida no `<base href="../">`:** com a base em `../`, um `?from=…` relativo resolve
para a **raiz** (uma sala navegaria para o portão). Toda a navegação e todo o caminho de dados
têm de ser construídos a partir de **`document.baseURI`**, nunca de `location.pathname`.

#### Blocos de execução

Um bloco por commit — a regra das fases anteriores mantém-se, e cada bloco mede no browser o que
fez.

| # | Bloco | Fecha |
| --- | --- | --- |
| **B0** | O plano e as decisões **D24–D28** registados (§9, §11, §6, §8, §13) — **documentação, sem código** | — |
| **B1** | Linha de base re-medida **antes** de mexer: T1–T9, a varredura de poses, a consola, o `validate.mjs` e as 265 chaves do JSON | — |
| **B2** | **O formato passa a v3, ponta a ponta**: `schema.js` v3 (o `world`, os dois eixos, a obrigatoriedade condicional e os ids declarados até 447), a tabela pura dos eixos (`js/modules/portal-kinds.js`), o migrador por script (`tools/migration/scene-v3.mjs`, com a comparação campo a campo) e o dado migrado, **mais** a fábrica e o componente a lerem o eixo | D22 e D25, no dado |
| **B3** | As **leis dos mundos** que o dado de hoje já satisfaz — L11, L13, L15, L16, L17 e L18 —, mais as regras da forma, o cálculo da chegada (`js/scene/arrival.js`) e o grafo de mundos (`unreachableWorlds`), tudo com **uma avaria injetada por lei** no instrumento novo (`tools/scene/laws-selftest.mjs`) | As leis dos mundos, no dado |
| **B4** | As **duas tabelas** no módulo do portal e `createPortal` a lê-las, com o caminho do par inalterado | Os dois eixos |
| **B5** | D7, **L10 e L14**: os assets mudam para `assets/{panoramas,artworks,video,previews}` (com `git mv`), os panoramas normalizados por **corte ao centro, sem ampliar** (`forest` → 2048×1024, `skycloud` → 480×240), as obras limitadas a 2048 px no lado maior, os retratos gerados e o leitor de pixels da linha de comando | L10, L14 e L9 |
| **B6** | **A separação em mundos**: `data/worlds/*.json`, as dimensões renumeradas por mundo, `cameras.real.enabled` só no portão, as portas a `navigate` com `?from`, a **chegada** (L16) e as dimensões derivadas | D24 e D26 |
| **B7** | As **pastas de mundo** (4 arranques idênticos **fora da linha do `<base>`**, que nas salas é `href="../"`), o slug por `document.baseURI` (D28) e a navegação por porta | O endereço por sala |
| **B8** | Ferramentas: o migrador com guarda, o **grafo de mundos** no validador, a normalização e os retratos, e o verificador «os 4 arranques são iguais fora do `<base>`» e «o nome da pasta é o `world.slug`» — **mais** o fixture a exercitar a partilha da dimensão derivada, que a D29 deixou sem exercício (§9, nota do B7) | As ferramentas da D14 |
| **B9** | Verificação final no browser: T1 por sala, T10–T12, T4/T5/T8 **em cada mundo**, o ciclo portão→sala→portão e o telemóvel | — |
| **B10** | Documentação (README §Estrutura, §Estado, §Cena atual, §Atributos do portal, §Como usar, §Melhorias; roadmap §5.6, §6, §7, §9, §13, §14) e o marco **v0.0.6** | — |

**Uma emenda ao plano, com motivo escrito (2026-10-15, ao abrir o B2).** O plano separava «o esquema
novo» (B2) da «migração do dado» (B3). Não se separam: desde a Fase 3 o `app.js` **lê e valida o
JSON ao arrancar**, logo um B2 só com o `schema.js` v3 e o dado ainda em v2 deixaria a exposição a
recusar a cena entre dois commits. (Na Fase 3 a mesma janela existiu e era inofensiva: ninguém lia o
JSON nessa altura — o corte do `index.html` só chegou no B5.) O B2 passou a ser **o formato v3 ponta
a ponta** — esquema, tabela dos eixos, migrador, dado e a fábrica a ler o eixo —, e as **leis dos
mundos** passaram a B3. O resultado do B1 continua a ser a linha de base: o B2 prova-se por
**0 diferenças** na migração e pelos **mesmos números do B1** no browser.

**Segunda emenda, pela mesma razão (2026-10-15, ao fechar o B3).** O plano dava a L10 e a L14 ao B3
e o instrumento provou outra coisa: as duas **falham no dado de hoje** — a L14 porque `forest.jpg`
(9923×2614) e `skycloud.jpg` (960×240) não são 2:1, a L10 porque os seis ficheiros ainda vivem em
`assets/images/`. Como o **T8 conta avisos** e a consola da exposição é um teste, uma lei que o dado
não satisfaz deixa a fase vermelha. Passam as duas para o **B5**, que é o bloco que mexe nos
ficheiros — e que é onde entra o leitor de pixels. **A regra que fica: uma lei e o dado que a
satisfaz entram no mesmo bloco.** O B3 entregou as leis que o dado já cumpre (L11, L13, L15, L16,
L17 e L18) e o instrumento que prova que elas falham quando devem (15 de 15).

**Feito até agora (2026-10-16):** **B0** — plano e decisões registados (§9, §11, §6, §8, §13), commit
`4c13673`, só documentação; **B1** — linha de base re-medida **antes** de mexer em código, com os
números abaixo; **B2** — o formato v3 ponta a ponta; **B3** — as leis dos mundos no validador e o
instrumento que as prova; **B4** — as duas tabelas com o comportamento de cada eixo; **B5** — os
assets divididos por tipo, normalizados e com os retratos gerados; **B6** — a separação em mundos,
com a chegada atrás da porta; **B7** — cada sala com endereço próprio, e o regresso da praia
fechado (D29); **B8** — as ferramentas: a **L19** no validador e o verificador dos **arranques**;
**B9** — a verificação final no browser, numa bateria só; **B10** — a documentação e o marco
`v0.0.6`; **e depois da fase fechada, os doze testes da §10 corridos como bateria, em cada mundo**
(com um instrumento novo e o T5 re-medido — a nota abaixo).

#### Os doze testes da fase, medidos de uma vez (2026-10-16)

**Porque é que isto existe.** A fase foi medida bloco a bloco, e cada bloco provou o que entregou —
mas os doze testes da §10 nunca tinham sido corridos **como bateria** e **em cada mundo**. O T5, por
exemplo, ficou por re-medir desde a v0.0.5 (pendência R12) e o T1/T7 só existiam na versão de um
mundo só. Ficou um instrumento (`tools/regression/acceptance.mjs`, descrito na §10) que corre a
bateria na página onde ela está aberta — e a bateria foi corrida nas **5** páginas e nas **8** portas
e **9** chegadas do grafo.

| Teste | Medição | Onde |
| --- | --- | --- |
| **T1** | as **8** portas de mundo: **1** travessia cada, para o mundo certo (`?from` correcto); no fixture, a dupla de dimensões dá **1 + 1** | portão, cidade, praia, céu e fixture |
| **T2** | **0** poses com o bordo cortado, de **84** (84 avaliadas, 0 não avaliáveis) | nos **5** mundos |
| **T3** | **0** falhas em **20 554** amostras, **420** controlos a **0**, método válido, ~1,0 s | nos **5** mundos |
| **T4** | no **portão** (fundo transparente): alfa **255 dentro** e **0 fora** da janela; nas **4** salas: dentro vê-se a imagem do destino e fora a sala (`[177,212,242]` contra `[150,159,158]` na cidade) | nos **5** mundos |
| **T5** | **0** px da moldura de trás dentro da janela da frente, **1 657** px de controlo **fora** dela, **0** px de ruído entre dois desenhos iguais — e dentro da janela ganha a dimensão da frente | nos **5** mundos |
| **T6** | o clique abre o modal com o `path` do catálogo (**4** salas); no fixture, a obra da **outra** dimensão **não** abre (a guarda `canInteract` faz o seu trabalho) | cidade, praia, céu e fixture (o portão não tem obras) |
| **T7/T11** | as **9** chegadas: o visitante aparece **exactamente** no ponto que o `arrivalPoint` calcula, **0** travessias a andar para dentro da sala e **1** a voltar — a meia volta é um passo | as 8 arestas + o fixture |
| **T8** | **0** erros, **0** avisos e **0** pedidos falhados nas cinco páginas; **1** ouvinte de `keydown` no `document` e **3** na janela, medidos pelo `DOMDebugger.getEventListeners` | nos **5** mundos |
| **T9** | **20** ciclos de criar/destruir portais: registo e árvore de volta ao mesmo (**12** nós no portão, **24** no fixture), ouvintes de teclado iguais antes e depois, 0 nós deixados | nos **5** mundos |
| **T10** | tingir a dimensão derivada muda os pixels **dentro** da janela (123 088 no portão a 12 m, 190 096 a 30 m) | as **8** portas de retrato |
| **T12** | e **0** pixels mudados **fora da moldura**, a 12 m e a 30 m | as **8** portas de retrato |

**O que a bateria apanhou — e nem tudo foi da cena:**

1. **O T5 fica re-medido e a pendência R12 fecha** (§14). O rig é novo e está escrito no
   instrumento (duas portas de 8×10 m, a da frente a 20 m e a de trás a 30 m deslocada 5 m para o
   lado, para a moldura dela atravessar a janela da frente): **0** px dentro, **1 657** de controlo
   fora. O número de controlo não é comparável com os 6 767 da v0.0.5 — o rig e o buffer são
   outros —, mas a afirmação é a mesma e o controlo continua a provar que a medição não é vazia.
2. **`arrivalFrom` não está no componente da porta.** Vive no ficheiro do mundo e quem o lê é o
   construtor de cena; o instrumento tentava lê-lo da porta em execução e concluía que nenhum mundo
   tinha chegadas. Fica escrito: quem quiser a chegada lê-a do **dado**.
3. **Três erros do próprio instrumento**, todos com a mesma forma — uma medição que dava um número
   plausível e errado: o rectângulo da janela tirado de uma projecção com o `fov` errado (media a
   moldura), a margem de 8 px que contava a **borda da própria janela** como invasão da moldura de
   trás (13 164 px "fora" que eram dentro), e um laço com `NaN` (`Math.abs(vetor - vetor)`) que não
   andava e fazia a chegada passar sem medir nada. Os três foram apanhados pelo mesmo hábito: os
   números tinham de fazer sentido (dentro = 0, controlo ≠ 0), e não tinham.
4. **A sonda da sessão conta chamadas, não ouvintes.** Depois de abrir e fechar o modal, o contador
   dela subia de 1 para 2 e parecia uma fuga; o `DOMDebugger.getEventListeners` — o método que o
   A2/A3 já usava — mostrou **1 antes e 1 depois**, com o DOM a deduplicar o registo repetido. O
   instrumento passou a contar ouvintes **vivos** com a semântica do DOM.
5. **O centro do ecrã tem o botão da exposição por cima.** Um clique no meio do quadro (onde o
   `elementFromPoint` devolve `BUTTON#btn-iniciar`) bate na interface e não no canvas: o
   instrumento aponta a obra fora do centro de propósito. Não é defeito desta fase — a interface é a
   da Fase 4 —, mas fica registado: quem estiver a olhar para a obra pelo centro do ecrã tem de
   desviar o rato.

#### O que o B10 entregou e mediu (2026-10-16)

**A documentação, acertada com o que existe** — e o único bloco da fase sem código, de propósito:
o que ele entrega são os **números medidos** (e não estimados) no `README.md` e a fase dada por
fechada.

| Item | Medição |
| --- | --- |
| Os números do `README.md` | contados ao disco: `index.html` **85** linhas (e as três salas com o mesmo ficheiro), `js/app.js` **139**, `js/core/` 7 ficheiros/**219**, `js/modules/` 5/**1008**, `js/scene/` 4/**1002**, `css/style.css` **96**, `data/worlds/` 5 ficheiros/**1259** linhas com **12** portas, `tools/` 8 ficheiros/**1994** |
| O que a fase mudou no README | §Estado (marca **v0.0.6** e os números), §Estrutura (as pastas dos mundos), §Como usar (os endereços), §O que está implementado (duas linhas novas: mundos e portas de mundo) e §Verificado nesta versão (a bateria do B9) |
| O que a fase mudou no roadmap | o cabeçalho (fase fechada), §6 (o exemplo e o `<base>`), §8 (a **L19**), §9 (os 11 blocos), §10 (o método do T12), §11 (**D24–D29**) e §13–§14 (o resumo e as pendências novas) |
| O que fica aberto, escrito | **R10** (o retrato do portão), **R11** (a orientação da chegada no céu) e **R12** (o T5 por re-medir) — os três em §14, cada um com o motivo e o que o fecha |
| O marco | a branch **`v0.0.6`** cobre a fase **e a sua verificação** — o B10 e a bateria dos doze testes que veio depois (é o último commit da fase, `c3c6577`); a `v0.0.5` fica como estava. Publicar é empurrar o `main`, e quem testa nas três versões é o autor |

#### O que o B9 entregou e mediu (2026-10-16)

**A bateria toda, com a cache desligada** (a armadilha da Fase 3: medir com uma versão antiga em
cache é medir o código que já não existe), nas **5** páginas — as 4 salas e o fixture — e a partir
do **dado**: as chegadas são calculadas com o `arrivalPoint` que o construtor usa, e não com números
escritos à mão.

| Item | Medição |
| --- | --- |
| **T8** e **T9** em cada mundo | **0** erros, **0** avisos e **0** pedidos falhados nas cinco páginas, e **1** ouvinte de `keydown` no `document` em cada (4 no `window`, do A-Frame) |
| **T10** (o retrato), nas **8** portas de retrato | tingir a dimensão derivada muda os pixels **dentro** da janela (verde 157…241) e **nada** fora dela (0, em dois controlos) — em todos os mundos; no **portão**, onde o fundo é a câmara, o alfa é **255 dentro** e **0 fora** (a métrica do **T4**) |
| **T11** (a chegada), nas **8** arestas do grafo | o visitante aparece **exactamente** no ponto calculado a partir do dado (câmara = esperado, nas 8); **0** navegações a andar 3 m para dentro da sala; **1** navegação a voltar, com a URL de volta ao mundo de origem e `?from=<destino>` |
| **T2/T3** (varredura de poses) | no fixture, que é o mundo com duas dimensões: **84** poses (84 avaliadas, 0 não avaliáveis), **15 714** amostras, **0** falhas, **420** controlos a **0**, método válido, 1 034 ms, e a dimensão ativa não mudou |
| O instrumento da varredura | as duas avarias injectadas continuam a ser detectadas: `bar` → 18 de 18 poses com moldura cortada e **1 315** amostras falhadas; `stencil` → **4 567** de 4 568 |
| **T12** (o retrato na moldura) | **16** poses (as 8 portas a 12 m e a 30 m): a mancha do retrato tingido ficou **dentro** do rectângulo esperado em **16 de 16**, com **0** pontos fora |
| O ciclo portão → sala → portão | as duas voltas do portão (para a cidade e para a praia) fecham com **1** navegação por porta — e a da praia é a que a **D29** abriu |
| O telemóvel | a **390×844**: o botão de entrada responde, o D-pad fica visível (`flex/visible`), 0 erros/0 avisos/0 pedidos falhados, e a **câmara real é o fundo** da dimensão 0 — a captura mostra a sala em que se está, com a porta do portão emoldurada a vermelho |
| **A olho** (uma captura por sala) | a cidade mostra a porta **sem janela** (a do portão) ao lado do retrato da praia; a praia mostra os **dois retratos** (cidade e céu) a ladear a porta **sem janela** que a D29 abriu; o céu mostra o retrato da praia. As três salas lêem-se |

**O que a bateria apanhou (e uma lição sobre o próprio instrumento):**

1. **Ao chegar, o visitante fica virado no sentido em que vinha** — o −Z da porta —, e isso é o que
   faz do regresso **um passo** (o mecanismo que o T11 mede). Medido o que se vê: na cidade, **1**
   das 5 obras fica à frente; na praia, **1** de 3; no céu, **0** de 2. O céu já tinha esta
   característica antes da fase (nota do B6) e é o único onde **nenhuma** obra fica à frente de quem
   chega — fica como **item do autor**: se preferir aterrar virado para a sala, é uma linha (a
   orientação da chegada), e é uma decisão dele, não da fase.
2. **A minha primeira caminhada media a travessia, não a entrada.** Pus o visitante a andar na
   direcção do centro da sala em vez da direcção em que ele fica virado, e o resultado foi **1**
   navegação em todas as arestas — que é a resposta **certa** para uma travessia (e provou, de
   passagem, que cada travessia navega uma só vez). O instrumento é que estava a perguntar outra
   coisa; corrigida a direcção, dá **0** a entrar e **1** a voltar. Vale como lembrete: medir a
   coisa certa é metade do trabalho.
3. **O T5 não foi re-medido**, e por uma razão: precisa do rig de **dois** portais e a ordem de
   desenho não mudou na 3B (`drawOrder` e `stencil` são os mesmos). Fica com os números da v0.0.5.

#### O que o B8 entregou e mediu (2026-10-16)

**A L19, a lei que o B7 pediu.** A caminhada do B7 apanhou uma porta da praia sem porta de chegada
no destino (D29) e o aviso veio do **runtime** — o visitante a aterrar. A lei passa a responder o
mesmo **antes** de alguém atravessar: `missingArrivals(scenes)` em `js/scene/validation.js`, com a
mesma forma do `unreachableWorlds` (puro, e separado do `validateScene` porque só a linha de comando
tem o conjunto todo — D14). As portas do **fixture** ficam de fora: ele não faz parte do grafo
(ninguém chega a ele por uma porta) e existe para exercitar mecanismos.

**Os arranques, num módulo próprio.** `tools/scene/arranques.mjs` — com a leitura do disco a entrar
por parâmetro, como o `exists` e o `imageSize` do validador — exige três coisas a cada mundo: que o
arranque exista na pasta do slug, que o `<base>` aponte para a raiz da publicação (ao número de
níveis certo) e que os quatro sejam iguais **fora** dessa linha. O `validate.mjs` é só quem lhe dá o
disco.

| Item | Medição |
| --- | --- |
| `validate.mjs` | os **5** mundos OK e as três linhas novas: `world graph: 4 rooms (+1 fixture), all reachable from gate`, `arrivals: every door has a door saying it is the arrival (L19)` e `arranques: 4 world(s) with an arranque, the same file outside the <base> line` (exit 0) |
| O instrumento das leis | **17 de 17** avarias detetadas, controlo limpo, grafo detetado, **L19** com o defeito do B7 reposto a ser detetado (`gate -> praia`, porta 1) e a exposição com **0** buracos, e as tabelas **20 de 20** |
| O verificador dos arranques | **5 de 5** casos: o controlo (os quatro como estão) e quatro defeitos — uma sala sem arranque, uma sala cujo arranque ficou com o `<base>` da raiz, um arranque sem `<base>` e um arranque com uma palavra mudada |
| O fixture volta a exercitar a D26 | **uma** dimensão derivada (`448`) para **duas** portas de retrato (a 1 e a 3): 1 textura, 1 valor de stencil, 1 desenho; T1/T7 **1 + 1** travessias; T8 **0/0/0**; a porta nova navega **uma** vez (`/praia/?from=example`) |
| A reprodutibilidade | o migrador corrido outra vez: `1 file changed, 31 insertions(+)` — só a porta nova do fixture, mais nada nos cinco ficheiros |

**A D29 tinha custado cobertura e o fixture devolveu-a.** As duas portas duplicadas da praia eram,
no dado, a prova de que o valor de stencil pertence à **dimensão mostrada** e não à porta — e a D29
trocou uma delas pelo regresso ao portão. O fixture ganha uma **quarta** porta com o mesmo retrato
da primeira, e a partilha passa a ser exercitada de propósito (é o que o fixture existe para fazer).
**Nota:** quem sair do fixture pela porta nova aterra na praia **com um aviso** — `?from=example` não
é uma origem conhecida e o runtime diz o que faz (o visitante fica onde a câmara diz). É o
comportamento certo para um mundo de ensaio, e a L19 não o esconde: ela **não olha** para o fixture.

#### O que o B7 entregou e mediu (2026-10-16)

**Os quatro arranques.** A raiz ganhou `<base href="./">` e as salas são **o mesmo ficheiro** com
`href="../"`. O mundo passa a sair do **caminho** e não do parâmetro (D28): `worldFromPath()` lê o
que sobra de `location.pathname` depois do caminho de `document.baseURI` — vazio na raiz, `cidade/`
na pasta da cidade — e o `?scene=<slug>` continua a poder forçar um mundo, para os testes.

| Item | Medição |
| --- | --- |
| As quatro entradas | `/` abre o `gate`, `/cidade/` a `cidade`, `/praia/` a `praia` e `/ceu/` o `ceu` — **0** erros, **0** avisos e **0** pedidos falhados em cada, e **1** ouvinte de `keydown` no `document` em todas as quatro (4 no `window`, do A-Frame, igual nas quatro) |
| Os arranques são o mesmo ficheiro | os **3** das salas têm **um só hash** entre si, e contra a raiz o `git diff --no-index --stat` dá **1 linha mudada**: só o valor do `<base>` |
| A D14 medida na rede | cada página lê **um** ficheiro de mundo — `gate.json`, `cidade.json`, `praia.json`, `ceu.json`, um por página, e **nenhum** outro dado. A praia busca as **6** imagens do seu catálogo, com os tamanhos certos (1024, 480, 1226, 2048 na obra e os retratos 2048 e 480) |
| O percurso das portas | **7** travessias encadeadas — portão → cidade → portão → praia → céu → praia → cidade → portão — com **1** navegação por porta, sem ping-pong, e 0 erros/0 avisos/0 pedidos falhados em todas |
| O regresso da praia (D29) | portão, porta 1 → `/praia/?from=gate` com o visitante em **(25, 1,6, −81)**, atrás da porta 5 — que passou a ser a porta de volta; atravessá-la → `/?from=praia` com o visitante em **(6, 1,6, −9)**, atrás da porta 1 do portão. O ciclo portão → praia → portão são **duas** navegações |
| `validate.mjs` e o selftest | **5** mundos OK e o grafo «4 rooms (+1 fixture), all reachable from gate» (exit 0); **17 de 17** avarias detetadas, controlo limpo (0 erros, 0 avisos), grafo e tabelas a passar |
| O handle de testes | o `portalDebug` passou a dizer **que mundo** a página carregou (`portalDebug.world`): sem isso, «que mundo está aberto» só se media pela impressão digital das portas |

**O que este bloco apanhou, e o que se decidiu por causa disso:**

1. **A praia não tinha regresso ao portão — e foi o instrumento que o disse.** Ao chegar do
   portão, o aviso `no door of this world says it is the arrival from "gate"` apareceu no T8: a
   praia não tinha porta nenhuma a declarar-se a chegada porque **não tinha porta para o portão**.
   A origem estava na cena anterior: os portais **4 e 5 eram a mesma porta duas vezes**
   (`ownedBy: 2`, par `2/1`, lado a lado em ±25). Enquanto eram duas dimensões do mesmo ficheiro
   isso era redundância; com um mundo por dimensão passou a ser **falta de saída**. Decisão do
   autor (**D29**, §11): a porta 5 passa a ser o regresso ao portão, com `window: none` como a da
   cidade (ainda não há imagem do portão). **A prova é do migrador emendado, não da mão:** reposta
   a cena única e corrido outra vez, os **5** ficheiros saem iguais aos que estão em disco **excepto
   a porta 5** — `1 file changed, 4 insertions(+), 5 deletions(-)`.
2. **O `<base>` da D28 não se podia escrever como estava planeado.** «4 arranques byte-idênticos»
   só é verdade com o mesmo `href`, e os caminhos relativos das salas precisam de `../`: com `./`
   numa sala, o `?from=` e o `data/worlds/` resolviam para a raiz. Fica **emendada** (nota em §11):
   os quatro são o **mesmo ficheiro fora dessa linha**, e é isso que o verificador do B8 vai exigir.
3. **A D29 tirou cobertura sem querer, e isso fica escrito.** A prova de que o valor de stencil
   pertence à **dimensão mostrada** e não à porta — duas portas, um retrato, 1 textura, 1 valor, 1
   desenho (D26) — era feita, no dado, pelas **duas** portas duplicadas da praia. Com a 5 a passar a
   porta sem janela, o dado da exposição deixa de ter duas portas a mostrar o mesmo retrato: a
   capacidade continua no código e nas leis, mas deixa de estar **exercitada**. O **fixture** passa
   a exercitá-la no **B8** (é o que ele existe para fazer), e a linha do B8 na tabela leva esta
   emenda.

#### O que o B6 entregou e mediu (2026-10-15)

**A separação, por script** (`tools/migration/worlds.mjs`), com a **tabela de correspondência** que
substitui o «0 diferenças» (uma mudança de sentido não se prova assim): 4 dimensões → 4 mundos,
10 obras → 10 obras, e as **8 portas** com o destino certo — `preview` + `navigate` em sete e
`window: none` na porta da cidade para o portão (a decisão do autor: sem retrato até haver imagem).
O grafo não mudou: a praia continuava sem porta para o portão — **corrigido no B7, com a D29**,
quando essa ausência passou a ter consequência medida — e todos os mundos são alcançáveis.

| Item | Medição |
| --- | --- |
| Os mundos | `gate` (1 dimensão-câmara, 2 portas, **2** imagens), `cidade` (1 + 5 obras, 2 portas, 6), `praia` (1 + 3 obras, 3 portas, 6), `ceu` (1 + 2 obras, 1 porta, 4) e o fixture (2 dimensões, 7 obras, 3 portas) — cada um carrega **só os assets que usa** |
| `validate.mjs` | **OK** nos **5** ficheiros, e o grafo: «4 rooms (+1 fixture), all reachable from gate» (exit 0). A **L11** provada de ponta a ponta: com uma porta para um mundo inexistente, o ficheiro **falha** |
| As dimensões derivadas (D26) | cada retrato é **uma** dimensão na banda 448…511: no portão 448 e 449; e as **duas** portas da praia para a cidade **partilham a 448** — 1 textura, 1 valor de stencil, 1 desenho |
| **T10** (o retrato) | alfa **255** dentro da janela e **0** fora (acima e à esquerda) — a métrica do T4 |
| **T11** (a chegada) | em `praia?from=cidade` o visitante aparece em **(−25, 1,6, −81)** (atrás da porta 4, marcada `arrivalFrom: cidade`); **0** navegações a andar 3 m para dentro; **1** navegação a voltar — o regresso é **um passo** |
| **T1/T7 no fixture** | ida 0→1 e volta 1→0, **1** transição cada, e a porta de mundo com **1** navegação sem mudar a dimensão — **duas janelas vivas ao mesmo tempo** (o par no valor 1 e o retrato no 2), que é para o que o fixture existe |
| **T8** | **0** erros, **0** avisos e **0** pedidos falhados **nos cinco** mundos, com **1** ouvinte de `keydown` em cada |
| **T2/T3** | passam no portão e no fixture: **0** de 84 poses, **0** falhas em 15 714 amostras, 420 controlos a 0 |
| A olho | a sala da praia lê-se: os dois retratos da cidade ladeiam a porta do céu |

**Três coisas que a execução apanhou (e que ficam registadas):**

1. **A conta da chegada tinha o sinal trocado.** O `arrivalPoint()` punha o visitante do lado *de
   fora* do plano da porta — com a porta à frente, a sala do outro lado — e o T11 viu-o: andar para
   dentro disparava **uma navegação** (de volta!). O instrumento quase o escondia: a travessia de uma
   porta que navega **não** muda a dimensão ativa, e a minha primeira versão do T11 só contava
   dimensões. Passou a contar **navegações** também.
2. **O fixture era uma armadilha de sentido único.** A porta do par tinha `ownedBy: 0`, e uma porta
   só existe na dimensão onde está — quem atravessasse para a dimensão 1 ficava sem caminho de
   volta. A cena de onde ele nasceu tinha porta de cada lado; o fixture passou a ter as duas.
3. **O céu tem a chegada virada ao contrário** — e já tinha, antes da fase: a porta está em
   `z = -120` e as obras em `z = -110`, ou seja atrás de quem chega. Não é um defeito da 3B (é o
   retrato da cena original), mas é o primeiro sítio a olhar quando a exposição for revista.

#### O que o B5 entregou e mediu (2026-10-15)

**As decisões do autor neste bloco:** corte **ao centro, sem ampliar** (ampliar não acrescenta
detalhe, só pixels a lembrar) e as obras limitadas a **2048 px no lado maior**. E uma correção à
minha própria regra: a **L14 avisa só acima do padrão** — um panorama abaixo dele custa *menos*
memória e não é defeito (o `praia.jpg`, 2:1 e leve, não pode sujar a consola).

| Item | Medição |
| --- | --- |
| Os painéis | `forest` 9923×2614 (3,80:1) → **2048×1024** (2:1), textura **98,9 → 8 MB**, 528 KB no disco; `skycloud` 960×240 (4:1) → **480×240** (2:1), **0,9 → 0,4 MB**; `praia` 1024×512 (2:1) fica como está |
| As obras | `bryan-goff` 6000×3000 → **2048×1024**, **68,7 → 8 MB**; `eiffel` 1226×855 fica como está (abaixo do limite) |
| Os retratos | **3** gerados do panorama do destino, todos 2:1: cidade 2048×1024, praia 1024×512, céu 480×240 — e declarados no catálogo com `alt` nas duas línguas |
| As pastas (D7) | 6 ficheiros movidos com `git mv` (o histórico segue-os) para `assets/{panoramas,artworks,video}`; `assets/images/` deixou de existir; os **9** assets do catálogo apontam para os caminhos novos, e o `og:image` do `index.html` com eles |
| A ferramenta | `tools/assets/normalize.mjs` (corre no browser: descodificar um JPEG precisa de um descodificador, e o projeto não tem build nem dependências — D1). **Nunca amplia**: diz em cada ficheiro o que era e o que ficou |
| As leis novas | **L10** (o nome do ficheiro) e **L14** (a forma do panorama, com `options.imageSize` na linha de comando e «não verificado» no browser): o instrumento passou a **17 de 17** avarias detetadas |
| `validate.mjs` | **OK** nos dois ficheiros, 9 assets, **sem um único aviso** |
| O browser | T1/T7 **8 de 8**, varredura **0/84** e **0** falhas em **15 714** amostras, **T8 0 erros, 0 avisos, 0 pedidos falhados** — e as **8** imagens carregadas com as formas novas (2048×1024, 2048×1024, 1226×855, 1024×512, 480×240, e os 3 retratos) |
| A olho | a cidade continua a ler-se como paisagem depois do corte ao centro, com as duas janelas a mostrar os outros mundos (verificado numa captura) |

#### O que o B4 entregou e mediu (2026-10-15)

| Item | Medição |
| --- | --- |
| A tabela consultada a correr | `shownDimension` responde pela tabela (`shows`) e `onTraverse` também (`enters`/`navigates`): o par continua a ser o único caminho da cena e dá **8/8** travessias, T4 o **mesmo pixel** (155,164,160,255 dentro, 0 fora), T9 **0** delta de ouvintes, a varredura **0/84** poses com **0** falhas em **15 714** amostras, T8 **0/0/0** — tudo igual ao B1 |
| O **retrato** (`window: preview`) | uma porta com retrato mostra a dimensão derivada que o construtor lhe entregar: `shownDimension()` = **448**, valor de stencil **3** (1 e 2 são das dimensões vivas), esfera registada como conteúdo, grupo visível |
| A **porta de mundo** (`action: navigate`) | atravessar chama `navigate()` **uma só vez**, para o endereço resolvido do destino (`http://127.0.0.1:8123/` para o portão), e **não** muda a dimensão ativa |
| Os endereços | `worldHref('gate', base)` = a raiz; `worldHref('praia', base)` = `…/praia/` — 20 de 20 verificações das tabelas no instrumento, incluindo a matriz completa (5 combinações legais de 9) |
| Um defeito que o instrumento apanhou | a travessia estava presa à **visibilidade da janela**, e uma porta `window: none` + `action: navigate` (legal pela matriz) nunca podia ser atravessada. Passou a depender de a porta **estar** onde o visitante está (`standsHere()`), e a máscara passou a esconder-se quando a janela não mostra nada — ela também escreve profundidade, e sem janela tapava o que está atrás da porta sem dar nada em troca |
| Um erro meu, apanhado pela mesma via | uma chaveta a mais no `portal.js` (o `app.js` deixou de arrancar, sem uma única mensagem visível no resumo do browser): `node --check` de cada módulo passou a ser o primeiro passo antes de medir |

#### O que o B3 entregou e mediu (2026-10-15)

| Item | Medição |
| --- | --- |
| O instrumento (`tools/scene/laws-selftest.mjs`) | **15 de 15** avarias detetadas: 4 da forma (campo desconhecido, campo obrigatório em falta, versão desconhecida, campo que o eixo não leva) e as leis **L1, L4, L5, L9, L11, L12, L13, L15, L16, L17 e L18** |
| O controlo | com nada injetado, o validador **não diz nada** (0 erros, **0 avisos**) — o instrumento não inventa |
| O grafo de mundos | um mundo que ninguém alcança a partir do portão é **detetado** (função pura `unreachableWorlds`) |
| As leis que o dado não cumpre ainda | **L10** (os 6 ficheiros em `assets/images/`) e **L14** (`forest` 9923×2614, `skycloud` 960×240) — movidas para o B5, com o motivo escrito acima |
| Um defeito encontrado ao escrever o caso | o `cameras.real` dizia «obrigatório por propósito» no comentário e **não** no esquema: corrigido (`required: true`), e é o caso 2 do instrumento |
| `validate.mjs` | **OK** nos dois ficheiros, sem avisos, exit 0 |
| O browser | T1/T7 **8 de 8** e T8 **0 erros, 0 avisos, 0 pedidos falhados** — iguais ao B1 |

#### O que o B2 entregou e mediu (2026-10-15)

| Item | Medição |
| --- | --- |
| A migração (`tools/migration/scene-v3.mjs`) | **16** valores movidos para dentro do eixo, **135** comparados, **0** diferenças; e o validador verde no ficheiro escrito |
| A guarda do migrador | a segunda corrida **recusa** (`declares version 3 and this migration reads version 2`) — o ficheiro que ele escreveu é o registo |
| `validate.mjs` | **OK** nos dois ficheiros: 4 dimensões, 10 obras, 8 portais, 6 assets, **7** janelas distintas (o mesmo que no B1) |
| T1/T7 | **8 de 8**, 1 transição por portal, destino certo — igual ao B1 |
| T2/T3 | **0** de **84** poses, **0** falhas em **15 714** amostras, **420** controlos a 0, buffer **1046×608** — igual ao B1 |
| T4 | **255** dentro (155,164,160) e **0** fora — exactamente o mesmo pixel do B1 |
| T6 | o clique abre na dimensão ativa (com o `src` derivado do catálogo) e não abre com a 0 ativa |
| T8 | **0** erros, **0** avisos, **0** pedidos falhados |
| T9 | **1** `keydown` e **0** delta depois de criar e destruir 20 portais, registo de volta a 8, 0 objetos deixados |
| **Armadilha medida (outra vez a cache)** | O browser servia o `portal.js` **antigo** mesmo depois de uma recarga, e a primeira medição parecia boa: a porta lia os eixos errados **sem um único erro de consola**. Só com `Network.clearBrowserCache` + `cacheDisabled` apareceu o erro verdadeiro (uma tabela que eu não tinha importado). É a lição da Fase 3 (§10) a repetir-se: **medir sem cache, sempre** |

#### Linha de base re-medida no B1 (2026-10-15)

Medida no browser, com a cena construída de dados (`?scene=example`, que é hoje o mesmo ficheiro da
exposição), e pela linha de comando. **Nada de código foi tocado** — é o valor a que a fase se
compara bloco a bloco.

| Teste | Medição no B1 | Instrumento |
| --- | --- | --- |
| **T1/T7** | **8 de 8** travessias, **1** transição por portal, destino certo, **0** ping-pong (a andar, passo de 0,2 m ao longo do eixo da caixa) | `setPosition` por passo + `state.activeDimension` por frame |
| **T2** | **0** poses com o bordo cortado, de **84** (84 avaliadas, 0 não avaliáveis) | `tools/regression/pose-sweep.mjs` |
| **T3** | **0** falhas em **15 714** amostras · **420** controlos com **0** falhas · método **válido** · buffer **1046×608** · 1,07 s | idem (o número de amostras depende do tamanho da janela) |
| **Avarias injetadas** | `fault: 'bar'` e `fault: 'stencil'` → T2 **falha** nas duas (o instrumento falha quando deve) | idem |
| **T4** | alfa **255** dentro da janela do hub (155,164,160 — a fotografia da cidade) e **0** fora (acima e à esquerda) | `gl.readPixels`, como na varredura |
| **T6** | com a dimensão 1 ativa o clique **abre** o modal, com o `src` derivado do catálogo (D20); com a dimensão 0 ativa o **mesmo clique não abre**; `fecharObra()` repõe | `page.mouse` + projeção do centro da obra |
| **T8** | **0** erros, **0** avisos, **0** pedidos falhados na carga | `console.error`/`warn` instrumentados + eventos de erro em captura + `fetch` |
| **T9** | **1** `keydown` no `document` na carga (4 no `window`, do A-Frame) e **1** depois de criar e destruir **20** portais em ciclo, com o registo de volta a **8** portas, **0** entidades e **0** nomes `portal-63` deixados e **0** ouvintes acrescentados | contadores em `EventTarget.prototype`, pelas fábricas |
| **`validate.mjs`** | **OK** nos dois ficheiros: 4 dimensões, 10 obras, 8 portais, 6 assets, **7** janelas distintas (exit 0) | `node tools/scene/validate.mjs` |
| **O JSON** | **265** chaves, 595 linhas, `version: 2` | contagem por regex + `ConvertFrom-Json` |

**Não re-medido no B1, de propósito:** o **T5** (a moldura de trás dentro da janela da frente) exige
o rig de dois portais e mede a **ordem de desenho**, que a 3B não muda; fica para o B7, comparado
com os **0 px** (e **6 768** px de controlo) da v0.0.5. Uma observação do instrumento, para não ser
confundida com defeito: fechar o modal **a meio do carregamento** aborta o pedido do `iframe`
(`ERR_ABORTED`) — é o `closeArtwork()` a limpar o `src`, não um pedido falhado da cena (o T8 é
medido na carga, sem interação).

#### Metas medidas (cada uma com o instrumento)

| Meta | Instrumento | Valor a bater |
| --- | --- | --- |
| Migração de formato (B3) | comparação campo a campo do migrador | **0 diferenças** em 8 portais |
| Comportamento preservado (B3) | T1/T7 e a varredura de poses | os números do B1: **8/8**, **0/84** poses, **0** falhas |
| Porta de mundo (T10) | métrica por **alfa**, como o T4 | **255** dentro da moldura e **0** fora dela |
| Chegada (T11) | andar para dentro ao aparecer | **0** travessias em cadeia; **1** navegação por porta |
| Retrato na moldura (T12) | a varredura de poses, apontada à porta | **0** poses com o retrato a sair da moldura (84 poses, controlos a 0) |
| Consola | T8 **em cada um dos 4 mundos** | **0** erros, **0** avisos, **0** pedidos falhados |
| Memória de textura e forma | L14, com um leitor de pixels na linha de comando | **2:1 em todos os panoramas e retratos**; `forest` **98,9 → 8 MB**, `skycloud` **0,9 → 0,4 MB** (corte, sem ampliar) e a obra `bryan-goff` **68,7 → 8 MB**; o aviso é só para o que passa **acima** do padrão de 2048 |
| Grafo de mundos | validador (B8) | **0** portas para mundo inexistente, **0** mundos inalcançáveis, **0** portas sem retrato, **0** ids declarados em 448…511 |
| Leis novas | 8 avarias injetadas (B2) | **8 de 8** detetadas |
| Arranques | verificador das ferramentas | **4** `index.html` byte-idênticos, e cada pasta com o `world.slug` do seu JSON |
| Código | contagem de linhas por ficheiro | o delta medido (o `portal.js` é o que cresce: as duas tabelas) |

**Nota de método — as duas migrações não se provam da mesma maneira.** A migração de **formato**
(B3) prova-se por **0 diferenças**, como a Fase 0: o que se compara são os mesmos valores escritos
de outra maneira. A migração de **sentido** (B6) **não** se pode provar assim — muda o
comportamento de propósito. O que a prova é uma **tabela de correspondência** (portal → porta,
dimensão → dimensão do mundo, obra → obra) mais os testes: T10 (o retrato), T11 (a chegada) e
**uma só** navegação por porta, sem ping-pong, em cada mundo.

#### Riscos desta fase

| Risco | Gravidade | Probabilidade | Mitigação |
| --- | --- | --- | --- |
| **Quatro `index.html` a divergir** | Média | Alta se forem editados à mão | São **o mesmo ficheiro** por construção, fora da linha do `<base>` (D28, emendada no B7) e o B8 traz o verificador que o exige |
| **O retrato a envelhecer** (a sala mudou e o retrato não) | Média | Média | O passo de geração nas ferramentas (B8) e a L11 (porta sem retrato falha a validação) |
| **A recarga a quebrar a imersão** | Média | Certa (é a D14) | A chegada atrás da porta, que deixa o regresso a um passo; o passo seguinte é a Fase 5 |
| **Perder a janela ao vivo na exposição** | Baixa (é a D24) | Certa | O fixture passa a ser o mundo de 2 dimensões (B6) e uma sala com 2 dimensões passa a ser conteúdo barato na Fase 4 |
| **`<base href="../">` a torcer um URL** | Alta | Média | Tudo por `document.baseURI` (medido: `?from=` relativo iria para a raiz) |
| **Medir código antigo pela cache do browser** | Média | Média | A lição da Fase 3: medir sempre com recarga sem cache |
| **A divisão da D7 quebrar URLs publicados** | Baixa | Certa | Aceite: o `git mv` e o catálogo mudam no mesmo commit, e o `og:image` dos 4 arranques com ele |

**O que a fase não faz** (e é de propósito): o `update`/`list` das fábricas e o editor (**Fase 4**,
que traz as pendências **R8** e **R9**) · a interface a ler o catálogo `i18n` (**R3**, Fase 4) · a
gravação direta (Fase 5) · automatizar T1 e T4–T7 (**Fase 6** — na 3B ficam medidos no browser, mais
o T10/T12 pela varredura; **fechado em 2026-10-24**, §9).

### Fase 4 — Página de edição

**Estado: FECHADA em 2026-10-23 — B0 ao B20 entregues e medidos, marco na branch `v0.0.9`.** Como nas fases anteriores, o
plano foi escrito **depois** de medir o que existe e **antes** de mexer em código: a linha de base
está verde (5 mundos, 12 portas, `validate.mjs` exit **0**), o que falta está na tabela abaixo,
**três medições novas** mudaram o plano — uma delas acrescentou um bloco — e as sete decisões que
faltavam ficaram fechadas (**D30–D36**, §11).

- **Entregável:** `editor.html` + `css/editor.css` + `js/editor.js` (a entrada) com o modelo, os
  painéis, a pré-visualização e a exportação em `js/editor/` (**D36**): CRUD por módulo,
  validação (§8), pré-visualização, importar/exportar.
- **D12 aplica-se desde o primeiro ecrã:** todos os rótulos do editor saem do catálogo
  `i18n/pt.json` (`t('editor.…')`) e os campos de texto do conteúdo são **por língua**
  (variante A da §5.7). Fazer o editor só em português "para traduzir depois" era o que a D12
  veio evitar.
- **Verificação:** criar uma dimensão + 2 obras + 1 portal **só pelo editor**, exportar,
  substituir o JSON e ver a cena a funcionar; e a **bateria dos doze testes** (§10) na cena
  editada, na exposição, com os números da linha de base.
- **Risco:** o editor e a exposição divergirem. Mitigação: o editor usa os **mesmos** módulos —
  e essa mitigação tem um **pré-requisito medido no B0** (segunda tabela abaixo): hoje os módulos
  **não** carregam numa página sem a UI da exposição.

#### O que existe hoje (medido em 2026-10-16, no B0)

| Peça | Medido | O que já serve à Fase 4 |
| --- | --- | --- |
| `index.html` e os 3 arranques | **86** linhas cada (o mesmo ficheiro, D28) | a marcação da exposição, que o editor **não** leva (D4) |
| `js/app.js` | **139** | a forma do arranque magro que o `js/editor.js` copia |
| `js/core/` | 7 ficheiros, **219** | `state`, `on`/`emit`, `syncStencilValues`, os registos e os limites — tudo o que o editor lê |
| `js/modules/` | 5 ficheiros, **1008** | as **fábricas** (`createDimension`/`createArtwork`/`createPortal`) e os **`remove()`** que o editor passa a exercitar |
| `js/scene/` | 4 ficheiros, **1002** | `schema.js` (a forma), `validation.js` (forma + L1…L19), `scene-builder.js` (`buildScene().remove()`), `arrival.js` |
| `js/modules/portal-kinds.js` | **92** | a **matriz legal** e o `validateDoor()` que o formulário da porta reutiliza (escritos para isto) |
| `data/worlds/` | 5 ficheiros, **12 portas** | o dado a editar e a prova do *round-trip* |
| `i18n/pt.json` | **5** chaves | quase nada: **nada lê o catálogo** (medido por `grep`; só o comentário em `camera.js:137`) |
| `tools/` | 9 ficheiros, **2664** | o validador, o verificador dos arranques e a bateria dos doze testes |

E o que **não** existe: nenhuma marca de editor no repositório (só comentários a apontá-lo),
nenhum `update`/`list` nas fábricas, nenhuma leitura do catálogo, nenhum `t('…')`, nenhum caminho
de escrita.

#### Três medições novas (B0) — e o que elas mudam no plano

Medidas com a cena a correr, em páginas-sonda servidas por HTTP e apagadas no fim (a árvore ficou
limpa):

| # | O que se mediu | Resultado | O que muda |
| --- | --- | --- | --- |
| 1 | Importar os módulos numa página **sem a UI da exposição** | `js/core/`, `camera.js`, `dimension.js`, `portal.js` e `validation.js` → **OK**; **`artwork.js` → excepção** (`Cannot read properties of null (reading 'addEventListener')`), e com ele o `scene-builder.js`, que o importa | **o editor não consegue hoje montar a cena.** A mitigação do risco («usa os mesmos módulos») ganha um **pré-requisito**: o bloco **B2** |
| 2 | O que o módulo da câmara só faz sentido na exposição | `setupMobileControls()` → **excepção** (sem o D-pad); `reportCameraError()` → **excepção** (sem `#btn-iniciar`, depois de já ter posto a mensagem no ecrã) | duas guardas no **B2** |
| 3 | **R8** — o `remove()` que nunca correu | `buildScene(gate)` + `remove()`, **3 ciclos**: registos de volta a **0** dimensões, **0** entradas e **0** portais, a cena de volta às **3** entidades do A-Frame (as dele) | **o `remove()` funciona** — o R8 passa de risco a meta medida (**20** ciclos no B3) — e os assets são recarregados em cada `build`, o que fixa a **D33** |

Um `grep` encontrou ainda um consumidor da ponte temporária que o documento não mencionava:
`tools/regression/acceptance.mjs:422` chama `window.fecharObra()`. O instrumento passa a importar
`closeArtwork()` no B1, com o **T6 re-medido**.

#### As decisões que faltavam (D30–D36, §11)

| # | Decisão | Escolha |
| --- | --- | --- |
| D30 | **R9** — o esquema declara o que a cena não constrói | O validador **avisa** (é a categoria que já existe) e o editor **não oferece** o que não é construído |
| D31 | **§7 «Mundo» pedia «pasta e arranque»** — impossível sob a D2 | A pasta e o arranque são de uma **ferramenta** (`tools/scene/new-world.mjs`); o editor mostra o comando |
| D32 | A pré-visualização e a navegação | A travessia `navigate` fica **inerte** na pré-visualização (aviso na consola), mais guarda de saída com alterações por gravar |
| D33 | Como a pré-visualização reaplica o que se edita | **Re-criar a entidade editada** (`remove` + fábrica); reconstruir a cena só quando a estrutura muda |
| D34 | A webcam no editor | Só liga por **gesto**, nunca na carga da página |
| D35 | «Desfazer» | **Instantâneos** do JSON em memória (limite ~50) |
| D36 | Estrutura do editor | `js/editor.js` = entrada (≤100 linhas) + `js/editor/` (modelo, painéis, pré-visualização, exportação, problemas) |

#### As decisões do autor (2026-10-20)

| # | Pergunta | Decisão |
| --- | --- | --- |
| **R10** | O retrato do portão existe? | **Aceita-se que não.** As **duas** portas para a realidade (`cidade` 2 e `praia` 5, ambas já `window: none`) ficam assim: é o único caso em que a ausência é honesta — um retrato emprestado mentiria sobre o destino. Se um dia houver a fotografia, são três linhas de catálogo e uma da porta, e o T10 volta a medi-las |
| **R11** | A chegada no céu fica de costas para a sala | **Re-arranjar as duas obras do céu** — é **dado**, não código, e faz-se no **B10** com o **próprio editor**: é o primeiro uso real que se lhe dá, e é o que permite acertar as posições a olho na pré-visualização. O mecanismo (a chegada a olhar no sentido em que se vinha, que faz do regresso um passo) **não** se toca |
| — | Quando se traduz | **Depois do B10**, com o conjunto de chaves estável: o editor acrescenta dezenas de `editor.…` nos B4–B9, e traduzir antes seria traduzir duas vezes. Até lá o `?lang=en` cai no português com **1** aviso |
| — | O painel «Mundo» | **Mantém-se**: a fase fica com os **11** blocos (sem ele o editor só edita mundos que já existem) |
| — | A ordem dos blocos | **Como está**: catálogo (B1) → módulos (B2) → editor. O editor **nasce** a falar pelo catálogo, sem reescrever rótulos |
| — | Marcos de versão | **Uma tag só**, a `v0.0.7`, no **B10** |

#### Blocos de execução

Um bloco por commit, como nas fases anteriores.

| # | Bloco | Fecha | O que se mede |
| --- | --- | --- | --- |
| **B0** | Registar este plano, as decisões D30–D36 e o que existe medido (só documento) | — | `validate.mjs` exit 0; a bateria dos doze; as contagens desta secção |
| **B1** | A interface passa a ler o catálogo: `js/i18n.js` (`t('…')`, `?lang=`, queda para o português, aviso de chave em falta), as chaves novas e **fora a ponte inline** (`onclick`, `window.iniciarCena`/`fecharObra`) | **R3** | 0 textos de interface em código; os 4 arranques iguais fora do `<base>`; `?lang=en` sem `en.json` → português e **1** aviso; T8 limpo; **T6 re-medido** |
| **B2** | Os módulos deixam de exigir a UI da exposição (modal/iframe, D-pad, `#btn-iniciar`, overlay) | — | os 6 imports numa página sem a UI da exposição (hoje: **2** excepções); a exposição com os mesmos números |
| **B3** | Pré-visualização: `buildScene` ganha o modo de pré-visualização (D32) e o editor chama o `remove()` | **R8** | ciclo build/remove ×**20**: registos vazios, **1** ouvinte de teclado, 0 erros |
| **B4** | A casca do editor: `editor.html`, `css/editor.css`, `js/editor.js` e `js/editor/` — escolha do mundo, pré-visualização ao lado, importar/exportar | — | 0 erros e 0 avisos na consola do editor; exportar sem editar dá **0 diferenças** nos 5 mundos |
| **B5** | **Câmara** (única: posição inicial, velocidade, webcam, «usar a posição actual») e **Dimensão** (ID, tipo, asset, raio, aviso da L1, faixa da L15) | §7 | CRUD da dimensão; a L1 avisa antes de exportar; apagar bloqueado com portas ou obras a apontar |
| **B6** | **Obra** (por dimensão: asset, posição/rotação/tamanho, interacção, título por língua; asset em falta; `url` só com `link`) | §7, D21 | 2 obras inseridas pelo editor e vistas na pré-visualização; o `title` por língua no ficheiro exportado |
| **B7** | **Portal**: os dois eixos (só as combinações legais da matriz), caixa, moldura, gatilho, destino fora das caixas (L4), valor de stencil, pré-visualização da travessia | §7 | uma porta por cada combinação legal criada pelo editor; a **L18** impossível de violar pelo formulário |
| **B8** | **Mundo**: slug, nome por língua, etiqueta/retrato/raio da porta; lista de salas **derivada** das portas do portão; porta para mundo inexistente (L11) e chegadas (L17/L19) | §7 | um mundo novo ponta a ponta com a ferramenta da D31; as duas leis a acusar uma avaria injectada |
| **B9** | Transversal: validar tudo antes de exportar (com `exists` e `imageSize` respondidos por `fetch`/descodificação), lista de problemas, desfazer, guarda de saída, e o **aviso do R9** com as avarias novas no `laws-selftest.mjs` | **R9** | as leis de §8 todas no relatório do editor; **17 → N de N** avarias detectadas; importar→exportar **0 diferenças** |
| **B10** | Verificação e documentação: a aceitação abaixo, o README (secção do editor), a tabela de §9, as pendências de §14 e o marco **v0.0.7** | — | **1 dimensão + 2 obras + 1 portal só pelo editor**, exportar, substituir o ficheiro e correr a bateria na cena editada |

Quatro blocos acrescentados depois do fecho, por achados do autor a jogar o publicado:** o
**B11** (a chegada por uma porta não pede licença, **D37**), o **B12** (a porta do portão mostra a
realidade ao vivo, **D38**), o **B13** (o nome de cada porta, **D39**) e o **B14** (o nome de cada
obra, **D40**) — todos com o seu registo abaixo, na mesma ordem e com as medições. O **B15** veio
depois do teste no telemóvel (**D41**: o botão de entrada segue a câmara, não o clique), o **B16**
do vídeo do autor a mostrar o botão a meio de uma transição entre portais (**D42**) e o **B17** de um
segundo vídeo, do ecrã preto no meio da mesma travessia (**D43**). Fecharam a fase o **B18** (a
travessia não se anuncia, **D44**), o **B19** (nenhum fotograma de câmara dentro dela, **D45**) e o
**B20** (o retrato da porta é a vista da chegada, **D46** e **D47**), que levou o salto no corte de
**0,68–13,36** para **0,21–0,40** nas seis portas — contra a meta de **0,50**.

#### O que o B1 entregou e mediu (2026-10-20) — fecha o **R3**

A interface deixou de ter texto escrito em código: cada rótulo é uma **chave** que o catálogo
resolve, e o HTML deixou de ter código dentro dele.

| O que mudou | Medido |
| --- | --- |
| **`js/i18n.js`** (novo, **87** linhas): `t('…')`, `?lang=`, queda para o português, aviso **uma vez** por chave em falta, e `applyTexts()` que lê `data-i18n` (texto), `data-i18n-label` (`aria-label`) e `data-i18n-title` (`title`) | — |
| **`i18n/pt.json`**: **5 → 13** chaves. As **8** novas são `app.heading`, `artwork.dialog`, `artwork.frameTitle`, `controls.group` e os quatro do D-pad | **0** chaves usadas no `js/` em falta |
| Os **4 arranques** passam a levar as chaves e **perdem os `onclick`**; o `app.js` liga os dois botões e as pontes `window.iniciarCena` / `window.fecharObra` **desaparecem** (o `acceptance.mjs` passou a importar `closeArtwork()`) | **0** `onclick` nos 4 HTML · as duas globais `undefined` · os 4 arranques iguais fora do `<base>` (`validate.mjs` exit **0**) |
| `camera.js`: a mensagem de erro da câmara sai do catálogo (`camera.error`) | O texto do `#erro-camera` é **igual** ao do catálogo |
| A regra da §5.7 fica mensurável | **0** literais de interface em `js/` · **0** declarações `content:` em `css/` |

**A bateria, antes e depois do B1** (medida com a cache desligada, à espera da câmara):

| | Portão | Fixture (`?scene=example`) |
| --- | --- | --- |
| T4 (alfa fora) | **0** | **255** (critério por cor: passa) |
| T5 (dentro / moldura de trás fora / ruído) | **0 / 2 319 / 0** | **0 / 2 319 / 0** |
| T6 (clique na obra) | não aplicável (sem obras) | **abre** (`flex`, com `src` do catálogo) e **fecha** (`none`) — agora pelo módulo |
| T9 (20 ciclos) | 2 → **2** portas | 4 → **4** portas |
| T10/T12 (mudados dentro / fora) | **183 457** e **28 539** dentro, **0** fora | **275 425** e **42 903** dentro, **0** fora |
| T2/T3 | **0** de **84** poses · **0** falhas em **24 906** amostras | idem |
| T8 (consola) | **0** erros, **0** avisos, **0** pedidos falhados | idem |

Os números são **os mesmos de antes do B1** — que é o critério. A sala `/cidade/` carrega com o
`<base>` e o catálogo (mundo `cidade`, **2** portas, **0** erros). `?lang=en` sem `en.json` mostra
**português** e dá **1** aviso (`[i18n] i18n/en.json: HTTP 404; showing pt`), mais o **404 da rede**
que nenhum manifesto pode evitar — e é por isso que a tradução só entra quando houver tradução.

**Duas notas de método**, porque custaram duas medições erradas: a primeira leitura do B1 viu
**código da cache** (`window.iniciarCena` ainda existia, e `onclick` ainda no HTML) e a primeira
bateria no fixture correu **antes de a cena estar construída** (T4, T5, T10 e T2 falharam com um
mundo a meio). As duas foram refeitas — cache desligada por `Network.setCacheDisabled` e à espera
do `renderer` e da `a-camera`. É a lição da Fase 3 outra vez, agora com dois sítios onde ela morde.

#### O que o B2 entregou e mediu (2026-10-20) — fecha o **R13**

Os módulos deixaram de exigir a UI da exposição: cada elemento que usam é um **host opcional** — o
modal e o `iframe`, o D-pad, o `#btn-iniciar`, o overlay e o `<video>` da webcam.

| Antes (medido no B0) | Depois |
| --- | --- |
| `artwork.js` rebentava **no import** (`Cannot read properties of null (reading 'addEventListener')`), e com ele o `scene-builder.js` | o ouvinte do `load` do `iframe` passou a ser ligado **na abertura** do modal e não no import — o `iframe` é do host, e um import não tem direito a exigi-lo |
| `setupMobileControls()` e `reportCameraError()` rebentavam sem o D-pad e sem o `#btn-iniciar` | ambos guardados; sem D-pad **não** arranca o ciclo de movimento, e ele corre no máximo uma vez |
| `startSession()` exigia o `#controles-mobile` e o `<video>` | guardados; sem `<video>` avisa e devolve, em vez de rebentar **dentro** da promessa, onde a falha se confundiria com um erro de câmara |

**Medido, numa página com A-Frame e sem a UI da exposição: 16 de 16 verificações OK** — os **8**
imports (o `core`, os **5** módulos e o `scene-builder`), as **três** chamadas que rebentavam, o
`buildScene(gate)` com **2** portas, o `startSession()`, o `remove()` e os registos de volta a **0**.
A meta **M14** fecha: **0** excepções.

E a exposição **não mudou**: a bateria do **portão** e do **fixture** com os mesmos números do B1
(T4 `0` e `255` · T5 `0/2319/0` · T6 `flex → none` · T9 `2→2` e `4→4` · T10 `183 457/28 539` e
`275 425/42 903` com **0** fora · T2/T3 **0** de 84 poses e **0** em **24 906** amostras · T8
limpo); o **D-pad anda 4,2 m em 250 ms**, o mesmo número da Fase 2; e abrir uma obra pelo clique e
fechar com **Escape** continua a funcionar — o `iframe` ganha o ouvinte de teclas na abertura.

**Duas notas que o B2 deixa para os blocos seguintes.** (1) Os avisos novos só aparecem em quem
**não tem** o elemento (`[artwork] this page has no modal`, `[camera] … has no <video>`), e nunca na
exposição — é por isso que o T8 continua limpo. (2) Fica um **contrato** para o editor:
`initI18n()` tem de correr **antes** de qualquer `t('…')`, senão a chave sai crua — foi o que a
sonda mostrou ao chamar `reportCameraError` sem catálogo. Está escrito no `js/i18n.js` e entra no B4.

**Uma terceira nota de método:** deixar o modal **aberto** antes da bateria estraga o T6 — o
instrumento responde `sem zona do ecra livre para apontar`, e a leitura sai `{}` (não uma
regressão). O T6 precisa do ecrã livre.

#### O que o B3 entregou e mediu (2026-10-20) — fecha o **R8**

Duas coisas, e a segunda é a que faltava desde a Fase 3.

1. **A pré-visualização (D32).** `buildScene(scene, { preview: true })` desliga a navegação no módulo
   do portal (`setNavigation`), o construtor **liga-a sempre** numa construção normal, e a porta que
   navega **avisa uma vez** e deixa o visitante onde está. Medido num mundo construído em
   pré-visualização: a porta 1 diz que abre `praia`, a **URL não muda** e aparece **1** aviso
   (`[portal] door 1 opens "praia" and this page is a preview: the traversal stops here (D32)`).
2. **O `remove()` em ciclo, com instrumento.** `tools/regression/scene-cycle.mjs`
   (`runSceneCycle({ cycles, world })`) constrói e remove um mundo **N** vezes e compara o retrato do
   princípio com o do fim de **cada** ciclo: portais, dimensões, entradas de conteúdo, valores de
   stencil, dimensão ativa, nós dentro do `<a-scene>` e ouvintes do documento. Um ciclo que deixe
   qualquer um destes a crescer fica registado com o número da volta e o campo.

**20 ciclos em cada mundo:**

| | Portão | Fixture |
| --- | --- | --- |
| Antes | 2 portais · 2 dimensões · 2 entradas · 2 valores · **18** nós | 4 · 3 · 10 · 2 · **33** |
| Durante a construção | **4** · 2 · **4** · — · **26** | **8** · 3 · **20** · — · **56** |
| Depois dos 20 ciclos | **2 · 2 · 2 · 2 · 18** | **4 · 3 · 10 · 2 · 33** |
| Desvios | **0** | **0** |

O instrumento exige que a construção tenha mesmo **acrescentado** portais ou conteúdo: um `build`
que não construísse nada também passaria (não haveria nada para o `remove()` estragar).

**E o que não podia partir:** a navegação da exposição continua a funcionar — `walkDoor(0)` no portão
levou a página a `/cidade/?from=gate`, e a chegada em `cidade` mediu o ponto calculado, **0**
travessias ao andar para dentro e **1** à meia volta (T7/T11). A bateria do portão dá os mesmos
números do B2 (T4 `0` · T5 `0/2319/0` · T9 `2→2` · T10 `183 457/28 539` e **0** fora · T2/T3 **0** de
84 e **0** em **24 906** · T8 limpo).

**Uma nota sobre os ouvintes:** o instrumento conta os que a própria página registou **depois** de ele
ser importado (é a mesma técnica do `acceptance.mjs`), e o ouvinte único do `app.js` é mais antigo —
daí `0` nas duas colunas. O que o ciclo prova não é o número absoluto: é que **não aparece nenhum a
mais**, em 20 construções e 20 remoções.

#### O que o B4 entregou e mediu (2026-10-20) — a ferramenta existe

`editor.html` + `css/editor.css` + `js/editor.js` (a entrada) e o `js/editor/` da D36. A ferramenta
abre com a cena ao lado, e o caminho `data/worlds/ → ecrã → download` está fechado.

| Peça | O que é |
| --- | --- |
| `editor.html` | A marcação: barra (mundo, validar, exportar, importar), painel de problemas e a cena da pré-visualização. Sem `onclick` (B1) e com as chaves do catálogo |
| `css/editor.css` | Duas colunas, tema escuro, e o botão de VR do A-Frame escondido — é da exposição, não desta ferramenta |
| `js/editor.js` (**15** linhas) | A entrada, com a forma do `app.js`: o `ar-config`, o catálogo, o arranque |
| `js/editor/index.js` (**168**) | A composição: a lista de mundos, abrir, validar, importar, exportar |
| `js/editor/model.js` (**58**) | O mundo em memória, o `parse`, o export estável, o slug e as contagens |
| `js/editor/preview.js` (**41**) | O `buildScene(…, { preview: true })` e o `remove()` da cena anterior |
| `js/editor/problems.js` (**56**) | O relatório do validador: três contagens e uma linha por problema |

**Medido** (editor aberto por HTTP, cache desligada):

- o **`gate`** abre sozinho: **2** portais, **2** dimensões, canvas **998 × 475**, `preview: true`,
  `stencil: true`, **0** erros, **0** avisos e **0** pedidos falhados na consola;
- a lista de mundos tem `gate`, `example`, `cidade` e `praia` — **derivada** das portas do portão (não
  há manifesto, D14), e escrever outro slug continua a funcionar;
- **round-trip**: o export do modelo devolve os **5** mundos **byte a byte iguais** (2 301 · 5 115 ·
  4 903 · 2 765 · 6 879 bytes);
- **exportar** dispara um download chamado `praia.json` com os mesmos **4 903** bytes do ficheiro;
- **importar** um ficheiro com uma obra a menos muda o estado (`obras: 2`) e reconstrói a cena (**5**
  entradas de conteúdo em vez de 6);
- trocar de mundo pelo campo + **Abrir** põe `praia` no ecrã (**3** portais, **3** dimensões);
- **M8 re-medido no editor**: `runSceneCycle()` com **20** ciclos, **0** desvios, a pré-visualização de
  pé e a navegação ainda desligada.

**Um defeito apanhado pela medição, não pelo olho:** a primeira versão da pré-visualização **não
arrancava o driver de frame**, e as janelas ficavam **negras** — medido, `0` valores de stencil e
**alfa 0 dentro** da janela, com o T4 a falhar. Passou a chamar `startFrameDriver()` depois de
construir: o mesmo T4 dá **alfa 255 dentro** e **0 fora**, e o T10/T12 dão **0** px fora da moldura.

**Duas mudanças que a fase obrigou, e que tocam a exposição:**

1. **O `ar-config` saiu do `js/app.js`** para `js/scene/render-config.js`. A cena tem agora **dois
   hosts** e as três regras de desenho (L6) não podem ter duas cópias — o `app.js` passou de **151**
   para **134** linhas. O componente ganhou ainda uma **guarda**: avisa quando o `<a-scene>` não tem
   `stencil: true`, em vez de a cena ficar sem janelas em silêncio.
2. **O `<title>` passou a levar a chave** (`data-i18n="app.title"` na exposição, `editor.title` no
   editor) e o `applyTexts()` deixou de saber qual é o título — cada página diz o seu.

A exposição **não mudou**: a bateria do portão mantém os números do B3 (T4 `0` · T5 `0/2319/0` · T9
`2→2` · T10 `183 457/28 539` com **0** fora · T2/T3 **0** de 84 e **0** em **24 906** · T8 limpo, sem
o aviso do stencil), e os **4** arranques continuam iguais fora do `<base>`.

**Metas medidas neste bloco:** **M1** (os 3 ficheiros), **M2** (**0** literais de interface em `js/`),
**M3** (**0** `content:` nos dois CSS), **M4** (**0** chaves em falta), **M5** (**0** `localStorage`/
escrita em `js/`), **M6** (o editor importa de `core/`, `modules/` e `scene/`), **M7** (**0** imports
do editor na exposição) e **M11** (o *round-trip*).

#### O que o B5 entregou e mediu (2026-10-20) — os painéis de câmara e dimensão

Os primeiros dois painéis da §7, com o caminho de edição que a **D33** fixou: um número muda **uma
entidade**, a estrutura muda o mundo.

| Peça | O que é |
| --- | --- |
| `js/editor/fields.js` | Os controlos partilhados: rótulo do catálogo, `name` = chave do campo, e o *debounce* de **120 ms** que separa «o dado mudou» de «a geometria foi refeita» |
| `js/editor/panels/index.js` | A lista dos painéis, na ordem da §7 |
| `js/editor/panels/camera.js` | A câmara única: posição, velocidade, webcam (dado), «usar a posição atual» e «ligar a câmara» (o gesto da D34) |
| `js/editor/panels/dimension.js` | As quatro colunas da dimensão: inserir, alterar, manter (contagens, L1, L15) e excluir — com o bloqueio da §7 |
| `preview.js` | Ganhou `replaceDimension()` e `replaceCamera()`: **re-criam a entidade** com a fábrica do módulo e o `remove()` que a A4 deixou pronto |

**Medido, ronda a ronda, com a consola da sonda ligada:**

| O que se pediu | Resultado |
| --- | --- |
| Alterar a **velocidade** | `0.1 → 0.25` no dado |
| **«Usar a posição atual»** | Escreve `[3, 1.6, −4]` no dado, nos campos **e** na câmara da cena |
| Ligar/desligar a **webcam** | `cameras.real.enabled` acompanha |
| Alterar o **raio** de 500 para 250 | A esfera **na cena** passa a **250** — a entidade foi refeita, o mundo não (D33) |
| Pôr o raio a **5** | **Erro da L1 em direto**: «radius 5 is not larger than the scene extent (92.2) — law L1», com **Erros: 1** antes de qualquer export |
| **Excluir** uma dimensão com obras e portas | Botão desativado e a razão escrita: «…obras: 3, portais: 3» |
| **Criar** com o id 0 (tomado) | «Já existe uma dimensão com o ID 0.» |
| **Criar** com o id 448 | «O ID tem de ser um número inteiro de 0 a 447.» (a faixa da L15) |
| **Criar** uma dimensão nova | Cartão `#1` na lista e esfera `1:120` na cena |
| **Excluir** essa (nada aponta para ela) | Sai do dado **e** da cena |
| A linha de estado | Acompanha: **1 → 2 → 1** dimensões |

**Abrir não reescreve:** os **5** mundos, abertos e exportados **sem tocar em nada**, saem **byte a
byte iguais** aos ficheiros. Foi esta medição que apanhou o defeito do resto do bloco: a primeira
versão dos painéis **criava** `cameras` e `dimensions` só por ser desenhada, e um mundo sem essas
chaves ganharia duas linhas em branco no export. Passaram a criá-las **a primeira tecla que precise
delas**.

**Consola:** 0 erros e 0 avisos em todas as rondas. A exposição mantém a bateria do B4 (T4 `0` · T5
`0/2319/0` · T9 `20` com `2→2` · T10 `183 457/28 539` com **0** fora · T2/T3 **0** de 84 e **0** em
**24 906**).

Uma nota de âmbito: o painel da dimensão **não oferece** `kind: "color"` (a **D30** decidiu que o
editor não oferece o que a cena não constrói) nem deixa mudar o **id** de uma dimensão existente —
mudá-lo deixaria todas as obras e portas a apontar para um nome que já não existe.

#### O que o B6 entregou e mediu (2026-10-20) — o painel da obra

| Peça | O que é |
| --- | --- |
| `js/editor/panels/artwork.js` | As obras **agrupadas por dimensão** (§7), um cartão por obra (asset, posição, rotação, tamanho, interacção, título por língua, excluir) e o formulário de inserção |
| `preview.replaceArtwork(artwork, catalogue)` | Re-cria **uma** obra e resolve o endereço com o `addressToOpen` do construtor — **exportado**, para o editor não abrir o que a exposição não abriria |
| `createArtwork` | Passou a escrever `data-artwork-id`, como os portais já tinham `data-portal-id`: é o que deixa o editor encontrar a entidade sem depender da ordem do array |

Duas escolhas que a **D30** obrigou:

- **`kind` não é um campo.** Vem do tipo do asset no catálogo (`image`/`video`) — e a validação já
  recusa um `kind` e um `asset` em desacordo, por isso não há dois sítios a dizer o mesmo.
- **`interaction` oferece `modal` e `none`.** Um ficheiro que diga `link` mostra-o **selecionado e
  desativado**, com a nota da D30: não se oferece o que a cena não constrói, mas também não se
  apresenta o ficheiro a dizer outra coisa.

**Medido:**

| O que se pediu | Resultado |
| --- | --- |
| **Inserir 2 obras** pela interface | Entradas de conteúdo **6 → 8**, malhas **3 → 5**, com as posições `[5, 1.5, −50]` e `[−5, 1.5, −50]` **na cena** |
| O **título por língua** no ficheiro exportado | `title: { "pt", "en" }` numa e `{ "pt" }` na outra |
| **Mover** uma obra (x → 8) | A malha vai para `8` — a entidade foi refeita, o mundo não (D33) |
| Passar uma obra a **`none`** | O elemento perde o `open-artwork` (deixa de abrir) e o dado diz `none` |
| **Excluir** uma obra | **4** obras e **4** malhas; a linha de estado acompanha |
| Um ficheiro com **asset em falta** | Cartão marcado + «O asset «nao-existe» não está no catálogo.» + o erro da **L9** no validador, sem erros de consola |

A exposição mantém os números nos dois mundos medidos: portão (T4 `0` · T5 `0/2319/0` · T9 `20` com
`2→2` · T10 `183 457/28 539` com **0** fora · T2/T3 **0** de 84 e **0** em **24 906**) e fixture (T4
`255` · **T6 sim** · T9 `20` com `4→4` · T10 `275 425/42 903` com **0** fora · T2/T3 idem).

**O que ficou por fazer deste painel:** a exclusão **em lote por dimensão** (§7) não entrou — é uma
operação destrutiva e merece a confirmação que a **D35** e o B9 vão trazer.

#### O que o B7 entregou e mediu (2026-10-20) — o painel do portal

| Peça | O que é |
| --- | --- |
| `js/editor/panels/portal.js` | A porta inteira: posição/rotação, largura/altura, caixa (`box`, `boxPosition`, `boxRotation`), gatilho, moldura, `ownedBy`, os **dois eixos**, `arrivalFrom` e excluir — mais o formulário de inserção, que também escolhe os dois eixos |
| `preview.replacePortal(portal)` | Re-cria **uma** porta e **reutiliza** o retrato derivado que ela já tinha: as dimensões derivadas são uma por par único de retrato (D26) e não se podem multiplicar |

**A L18 não se pode violar pelo painel.** As ações oferecidas são perguntadas à **mesma tabela** que a
cena lê (`isLegalCombination`, de `portal-kinds.js`), por isso uma janela só oferece as ações que pode
ter. E quando a janela muda, a travessia é reescrita para a primeira legal **e o painel diz qual**:

> `#0` era `dimension-pair` + `enter-window`; a janela passou a `preview` e a travessia passou a
> `navigate` (alvo `gate`), com a linha a dizer «A travessia passou a «Navegar para outro mundo»: a
> anterior não é legal com esta janela (L18).»

**O valor de stencil não é dado** — é o núcleo que atribui um por dimensão mostrada, 1…255 (lei L5).
O painel diz isso no topo, para o campo não ser procurado onde não existe.

**Medido:**

| O que se pediu | Resultado |
| --- | --- |
| Ações oferecidas por janela | `dimension-pair` → **enter-window, none**; `preview` → **navigate, none** — e nada mais |
| **Uma porta por cada combinação legal**, criada pelo editor | As **5** (`dimension-pair+enter-window`, `dimension-pair+none`, `preview+navigate`, `preview+none`, `none+navigate`), com o validador a **0 erros** |
| Um erro de propósito (5 portas no mesmo sítio) | A **L4** acusou **20** vezes — o painel não esconde as leis, mostra-as ao lado do que se escreve |
| Mudar a janela de uma porta | Travessia reescrita para a legal + a mensagem que diz qual |

A exposição mantém os números (portão: T4 `0` · T5 `0/2319/0` · T9 `2→2` · T10 `183 457/28 539` com
**0** fora · T2/T3 **0** de 84 e **0** em **24 906**; fixture: T4 `255` · **T6 sim** · T9 `4→4` · T10
`275 425/42 903` · T2/T3 idem), e o painel do portal não tocou em código partilhado.

#### O que o B8 entregou e mediu (2026-10-20) — o painel do mundo e a ferramenta da D31

| Peça | O que é |
| --- | --- |
| `js/editor/panels/world.js` | O que um mundo **é** (slug, nome por língua), o que **abre** (as portas para outros mundos, com o retrato e o raio), o **mapa da casa** e o bloco «nova sala» |
| `js/editor/worlds.js` | O único sítio que lê um mundo que não se está a editar — para responder à **L11** e à **L19**. Lê e guarda; **nunca constrói** (L13) |
| `tools/scene/new-world.mjs` | A pasta e o arranque de um mundo novo (D31): o mesmo `index.html` com `<base href="../">`, conferido pelo `checkArranques` |
| `js/editor/index.js` | `validateScene(…, { worldExists })` — a resposta que o browser também pode dar, o que transforma a L11 de «não verificada» em erro a sério |

**A D31 em três medições, todas da ferramenta:**

| Comando | Resultado |
| --- | --- |
| `node tools/scene/new-world.mjs cidade2` | Cria `cidade2/index.html`; **5** arranques conferidos; o ficheiro é **igual** ao da raiz fora do `<base>` |
| o mesmo, outra vez | `cidade2/ já existe: a ferramenta não escreve por cima do que lá está.` (exit **1**) |
| `… Cidade2` e `… gate` | slug inválido e «o portão vive na raiz, não numa pasta» (exit **1**, cada um) |

**No editor, as duas leis a acusar uma avaria injectada:**

| Avaria | O que o editor disse |
| --- | --- |
| Uma porta apontada a `nao-existe` | No cartão da porta: «O ficheiro do destino «nao-existe» não existe (L11)», e no validador: `portals[0]: the world "nao-existe" does not exist — law L11` |
| A chegada de `gate` apagada em `cidade` (a porta passa a dizer `praia`) | O **mapa** acusou `gate → cidade: o destino não declara a chegada` — e voltou ao «bom» quando a chegada foi reposta |
| Uma sala nova ligada pelo painel (`cidade2`, com retrato e raio) | Porta criada (`preview`, `retrato-cidade`, raio `60`), com a mensagem «Porta criada para «cidade2». Arruma-a no painel Portais.» e a **L11** a avisar que o **ficheiro** do mundo ainda não existe (a pasta é da ferramenta; o JSON é o export) |

**Três defeitos apanhados pela medição, e o que cada um ensinou:**

1. Os cartões das portas e o da nova sala eram construídos e **nunca anexados** — a medição viu o título
   e nenhum cartão. Um `appendChild` que falta não faz barulho.
2. O painel comparava o **caminho** do ficheiro (`data/worlds/gate.json`) com o slug e acusava uma
   divergência que não existia — passou a comparar só o nome.
3. O **mapa** não se repintava depois de mudar uma chegada (e repintar a cada tecla tirava o foco do
   campo): as chegadas e os destinos passaram a ter `debounce` **e** repintura.

E uma decisão que a medição obrigou a alinhar com a linha de comando: o **fixture** fica fora do mapa
(`graphScenes()`), tal como o `validate.mjs` já o deixa de fora — senão o editor acusava
`example → praia`, uma porta que a linha de comando não conta e que existe para exercitar mecanismos.

#### O que o B9 entregou e mediu (2026-10-20) — as ferramentas transversais e o **R9** fechado

| Peça | O que é |
| --- | --- |
| `js/editor/assets.js` | As duas perguntas que só a linha de comando sabia responder — o ficheiro existe (**L9**, **L10**) e a imagem mede 2:1 (**L14**) — respondidas na página: um `Image` mede a imagem ao carregá-la (carregar também prova que está lá), e um `HEAD` responde pelos vídeos, que não se descarregam só para saber que existem. Uma resposta em cache poupa o GET por cada tecla; `refresh` volta a perguntar o que faltava |
| `js/editor/model.js` | Desfazer por instantâneos (**D35**): `remember()` guarda o **texto** que o autor estava a ver, até **50**; `isDirty()` compara com os textos que ele **já tem** (o que abriu e os que exportou) |
| `js/editor/index.js` | `exists`/`imageSize` no `validateScene`; o botão «Desfazer» com `Ctrl+Z` (só fora dos campos); a marca «alterado»; a guarda de saída (**D32**); e a exportação que **valida tudo antes de exportar** |
| `js/scene/validation.js` | Os **avisos da D30** — o que o esquema aceita e a cena não constrói: `kind: model\|text` numa obra, `interaction: link`, `kind: color` numa dimensão |
| `tools/scene/laws-selftest.mjs` | Três avarias novas, uma por valor da D30, com `level: 'warning'` |
| `editor.html`, `css/editor.css`, `i18n/pt.json` | O botão «Desfazer», a marca «alterado» e as **5** chaves novas (**149** no catálogo); a nota que dizia «faltam as ferramentas do B9» saiu |

**A bateria do editor — 35 de 35**, numa página servida por HTTP com a cache **desligada**
(`?bust=` e `Network.setCacheDisabled`), das três leis à guarda de saída:

| O que se mediu | Resultado |
| --- | --- |
| Os 5 mundos no editor | `Erros: 0 · Avisos: 0 · Por verificar: 0` — a **L9** e a **L14** deixaram de ser «não verificadas» no browser |
| Importar→exportar os 5 mundos | **0 diferenças**, byte a byte: portão **2 301**, cidade **5 115**, praia **4 903**, céu **2 765**, fixture **6 879** |
| O que o `assets.js` responde | **7** assets da cidade perguntados e todos encontrados; `cidade.jpg` = **2048×1024** (2:1, há o que comparar na L14); um `jpg` que não existe → `false`; um `mp4` que não existe → `false` |
| A **L9** dentro do editor (asset apagado à mão) | `assets.ausente: "assets/previews/nao-existe.jpg" does not exist on disk — law L9` |
| A **L14** dentro do editor (um retrato no lugar do panorama) | `dimensions[0]: "assets/artworks/eiffel.jpg" is 1226×855, which is not the 2:1 of an equirectangular panorama` |
| Uma edição de verdade (a velocidade da câmara, 0,1 → 0,2) | «Desfazer» fica **activo**, a marca «alterado» aparece, e o export difere do ficheiro (mesmos 5 115 bytes, outro conteúdo) |
| A guarda de saída (**D32**) | Com alterações, `beforeunload` é **cancelado**; depois de exportar e depois de desfazer, **não** é |
| Desfazer | O export volta a ser **o ficheiro**, byte a byte; «Desfazer» desactiva-se e a marca desaparece |
| O limite da pilha (**D35**) | 60 alterações → **50** instantâneos, e o último volta exactamente 50 passos atrás (`extra` 59 → **9**) |
| Exportar com erros | Recusa: `Não exportado: 1 erro(s) no mundo…`, **0** ficheiros descarregados, e os erros na lista ao lado |

**As leis na linha de comando:** `tools/scene/laws-selftest.mjs` passou de **17** a **20** casos —
uma avaria por valor da D30 — e dá **20 de 20 detectadas**, com o controlo (nada injectado) **limpo:
0 erros, 0 avisos**, os **5 de 5** arranques e as **20 de 20** combinações dos dois eixos. O
`validate.mjs` continua a sair com **0**.

**A exposição não se mexeu** (a bateria dos doze, medida de novo): no portão o T4 dá **alfa 0** fora
da janela, o T5 **0** px dentro / **1 675** de controlo / **0** de ruído, o T9 **20** voltas
`2 → 2` e o T2/T3 **0** de **84** poses cortadas; no fixture o T4 e o T5 passam com o fundo opaco, o
T6 abre e fecha o modal, o T9 fica `4 → 4` e o T10/T12 não muda **0** px fora da moldura. Os
contadores de *pixels mudados* (124 740 / 19 188 no T10) não são comparáveis com os da v0.0.6
(183 457 / 28 539): dependem da janela do arnês, que aqui é 1400×900 — o que é comparável é a
invariante («0 fora») e o passar de cada teste.

**Três coisas que a medição obrigou a corrigir, e uma que ela descobriu no instrumento:**

1. A primeira versão da marca «alterado» comparava só com o **último** texto guardado: exportar e
   depois desfazer deixava o mundo marcado como alterado mesmo tendo voltado ao ficheiro aberto. Passou
   a comparar com o **conjunto** dos textos que o autor tem na mão.
2. O instantâneo tem de ser tirado **antes** da alteração, e os painéis escrevem no JSON antes de
   chamarem `change()` — por isso `remember()` vive em `context.change()`, o único sítio por onde
   todos passam (verificado: nenhum painel escreve sem chamar `change()`).
3. O `Ctrl+Z` não pode roubar o desfazer do texto que está a ser escrito: com o foco num campo, quem
   trata do `Ctrl+Z` é o browser — o do mundo só age fora dos campos.
4. **O `laws-selftest.mjs` estava a falhar desde o B1 e ninguém tinha visto.** A avaria do arranque
   injectava um espaço depois de `<title>`; o B1 pôs `data-i18n` no `<title>` dos quatro arranques, o
   `replace` deixou de encontrar o texto, o ficheiro injectado passou a ser **igual** ao bom — e o
   caso só se queixava com `the validator did not fail where it should` no fim da lista. Corrigido
   para injectar em `</title>`, que é estável. Um instrumento que não injecta nada também passa: é a
   mesma lição do B3 e do B7, agora do lado das ferramentas.

#### O que o B10 entregou e mediu (2026-10-20) — a aceitação, o README e o marco `v0.0.7`

**O R11, fechado com o próprio editor.** As duas obras do céu estavam **atrás** de quem chega da
praia: a chegada é em `z = -121` a olhar para −Z (o −Z da porta, o sentido em que se vinha) e as obras
estavam em `z = -110`. Foram movidas **no editor** — posição `[-6, 1.5, -131]` e `[6, 1.5, -131]`,
vistas na pré-visualização —, exportadas, e o `data/worlds/ceu.json` substituído pelo que saiu.
A medida, feita com a câmara real da página em `?scene=ceu&from=praia` e o **frustum** dela:

| Sala (chegada de) | Obras no primeiro plano | antes → depois |
| --- | --- | --- |
| cidade (de gate) | **1** de 5 — a da porta, a 9,1 m, em `ndc.x 0.08` | igual |
| praia (de cidade) | **1** de 3 — a da porta, a 10,3 m | igual |
| céu (de praia) | **2** de 2 — a 11,7 m, em `ndc.x ±0.42` | **0 → 2** |

O `git diff` do ficheiro mostra **só** as duas posições (nada de chaves reordenadas nem de campos
perdidos), o `validate.mjs` sai com **0** e a bateria no céu dá **os mesmos números de antes**:
T4 passa com o mesmo alfa, T5 `0 / 1 675 / 0`, T6 abre e fecha o modal da obra da praia, T9
`1 → 1` com 6 nós, T10/T12 com **0** px fora da moldura e T2/T3 `0` de **84** poses.

**A aceitação da fase, item a item:**

| # | O que a fase prometeu | O que se mediu |
| --- | --- | --- |
| 1 | Só pelo editor: 1 dimensão + 2 obras + 1 portal, exportar e substituir o ficheiro | Uma cópia da praia como `sala-teste` foi editada **só pela interface**: o slug mudado no painel, a dimensão **1** criada no formulário (`skycloud`, raio 500), **2** obras (`galeriaFoto1`/`galeriaFoto2`, a 1,5 m de altura e `z = -70`), e a porta **10** no par `0-1` com `enter-window` — depois de cada criação: `dimensões: 2`, `obras: 5`, `portais: 4`, e o relatório em `Erros: 0 · Avisos: 0 · Por verificar: 0`. O export (**6 330** caracteres) foi escrito em `data/worlds/sala-teste.json` e a página **renderiza-o**: T4, T5, T6, T9 `4 → 4` (24 nós), T10/T12 e T2/T3 passam |
| 2 | A cena editada: `validate.mjs` exit **0** e a bateria com os números da linha de base | O céu, editado pelo item acima: `validate.mjs` **0** e a bateria **igual** (tabela do R11) |
| 3 | O que não mudou: a bateria nos 5 mundos e o `checkArranques` | A bateria correu nas **5** páginas (portão, cidade, praia, céu e fixture): passa em todas; os arranques são os **4** e iguais fora do `<base>` |
| 4 | O editor: **0** erros e **0** avisos na consola | Na carga, ao trocar de mundo e ao fim de uma ronda de edições, as cinco páginas dão **0** erros, **0** avisos e **0** pedidos falhados (sonda instalada **antes** da carga — o T8) |
| 5 | O *round-trip*: importar e exportar os 5 mundos → **0** diferenças | Medido no B9 e outra vez com o céu novo: **0 diferenças** byte a byte nos 5 |

**Uma coisa que a aceitação ensinou:** o mundo do exercício (`sala-teste`) **não pode ficar** no
repositório, e o `validate.mjs` é que o diz — sem a pasta (`sala-teste/index.html`) falha a **D28**
(«a pasta de um mundo é o seu slug») e, com ela, o mundo fica **inalcançável** a partir do portão
(nenhuma porta aponta para ele) e as três portas herdadas da praia passam a acusar a **L19** (a
cidade, o portão e o céu não têm uma porta que se declare chegada de `sala-teste`). Um mundo a sério
precisa das três coisas: a pasta e o arranque (`new-world.mjs`, D31), o ficheiro (o editor) e a
porta que o liga ao portão (o painel «Mundo»). Por isso o exercício foi medido e o ficheiro
**apagado**: o repositório fica com os **5** ficheiros que são conteúdo.

**As metas de §9, uma a uma** (as que uma máquina responde foram medidas de novo no B10):

| Meta | Medida no B10 |
| --- | --- |
| M1 os 3 ficheiros do editor | **3** (`editor.html`, `css/editor.css`, `js/editor.js`) |
| M2 zero texto de interface em código | **0** — nenhum literal é um texto do catálogo nem tem acentos (os `id`s e os seletores não contam) |
| M3 zero texto em CSS | **0** `content:` com texto |
| M4 o catálogo cobre o que a interface diz | **86** chaves pedidas entre `t('…')` e `data-i18n*`, **0** em falta (149 no catálogo) |
| M5 o editor não escreve em disco | **0** usos de `fs`/`localStorage`/`indexedDB` |
| M6 o editor usa os mesmos módulos | os **3** grupos (`core/`, `modules/`, `scene/`) |
| M7 a exposição não conhece o editor | **0** menções em `js/core/`, `js/modules/`, `js/scene/` e `js/app.js` |
| M8 **R8** fechado | **0** desvios em 20 ciclos (B3) |
| M9 **R9** fechado | **20 de 20** avarias (B9) |
| M10 a validação é uma só | **1** implementação, importada pelo `index.js` e pelo painel do mundo |
| M11 o ficheiro exportado é estável | **0** diferenças nos 5 mundos (B9 e B10) |
| M12 não se pré-visualiza outro mundo | **1** sítio chama `buildScene`, e é o da pré-visualização |
| M13 as 4 linhas de §7 por módulo | os **5** painéis existem (mundo, dimensão, obra, portal, câmara) |
| M14 os módulos carregam em qualquer host | **16 de 16** verificações (B2) |
| M15 `?lang=` escolhe a língua | português com **1** aviso (B1) |
| M16 as perguntas da linha de comando no browser | `Por verificar: 0` nos 5 mundos (B9) |
| M17 desfazer e guarda de saída | export byte-idêntico depois de desfazer, **50** instantâneos (B9) |

**O que a fase mudou no README:** o §Estado (marca **v0.0.7** e os números das linhas), o §Estrutura
(o `editor.html`, o `js/editor/`, o `js/i18n.js`, o `render-config.js` e as ferramentas novas), as
tabelas dos módulos e do `js/scene/` (o `render-config.js` e a D30), a tabela nova do `js/editor/`, o
§O que está implementado (a página de edição, o desfazer e a guarda, as leis no editor, a interface
por catálogo), o §Verificado nesta versão (a bateria dos doze nas 5 páginas, o T8 e o T7/T11 medidos
de fora, as 35 verificações do editor e o R11), o §Limitações (a D30 e o que o editor **não** faz) e
uma secção nova, §A página de edição, mais o passo 5 do §Como usar.

**A versão publicada, medida depois do `push` (B10).** Com o `main` empurrado, o endereço
<https://rodrigorez.github.io/zonas12/> passou a servir a Fase 4 — e foi medido no browser, com a
cache desligada: **7 de 7**. O **editor publicado** abre a cidade com a cena construída (5 malhas) e
`Erros: 0 · Avisos: 0 · Por verificar: 0`, com o «Desfazer» desactivado e a marca escondida; o
**portão publicado** passa o **T4** (alfa 0 fora), o **T5**, o **T9** `2 → 2` (12 nós), o
**T10/T12** (as 4 portas de retrato, 0 px fora da moldura) e o **T2/T3** (84 poses, 0 falhas); e o
**céu publicado**, aberto com `?from=praia`, tem as **duas** obras no primeiro plano da chegada — o
R11 está na versão que o mundo vê.

**E revelou um defeito no instrumento.** As importações de `tools/regression/acceptance.mjs` eram
absolutas a partir da raiz (`/js/scene/arrival.js`): funcionam em `http://127.0.0.1:8123/` e dão
**404** debaixo de `/zonas12/`, onde a versão publicada vive — o `import` dinâmico rebentava com
`Failed to fetch dynamically imported module`. Passaram a relativas ao próprio módulo
(`../../js/…`) e os comentários de uso a `import('./tools/…')`, relativo à página; a bateria local
manteve os mesmos números e a publicada passou a correr. É a terceira vez na fase que medir a **versão
que o mundo vê** encontra o que medir a cópia local não encontrava.

**Marco: a branch `v0.0.7`.**

#### O que o B11 entregou e mediu (2026-10-20) — a chegada por uma porta não pede licença

Achado **pelo autor**, a testar a versão publicada: «toda vez que entro num portal é pedido para
acionar a câmara». Medido antes de mexer em código, com câmara falsa e permissão automática, a contar
os pedidos a `getUserMedia` por página:

| Onde | Botão «ATIVAR» | Pedidos à câmara |
| --- | --- | --- |
| portão, à chegada (`/`) | visível | **0** |
| portão, depois de carregar o botão | escondido | **1** |
| atravessar a porta 0 → `/cidade/?from=gate` | **visível outra vez** | 0 |
| carregar «ATIVAR» na cidade | escondido | **0** — a cidade é virtual |
| voltar ao portão por uma porta → `/?from=cidade` | **visível** | **1** ao carregar |
| mudar de dimensão sem sair da página (fixture, `dimension-pair` + `enter-window`) | não aparece | **0** |

**A conclusão:** a câmara só é pedida no **portão** (é o único mundo com `cameras.real.enabled: true`)
e **nunca** numa mudança de dimensão; o que se repetia era o **ecrã de entrada** em cada mundo, porque
cada mundo é uma página (D24) e a porta **navega**. Não era regressão da Fase 4: o `btn-iniciar` está
no `index.html` desde a Fase 3 e as portas navegam desde a 3B — o atrito só apareceu agora porque a
3B e a 4 foram publicadas no mesmo dia (acima). E na volta ao portão a câmara é pedida **outra vez**
porque o `MediaStream` não sobrevive a uma página: isso é da plataforma, não do código.

**A correção (D37):** quando a página traz `?from=` — a marca que a porta que navega escreve (D14) —,
a exposição **arranca sozinha**: o botão desaparece, o D-pad aparece e, no portão, a câmara é pedida
uma vez. Se o browser recusar a câmara sem gesto, o botão **volta** com a mensagem que explica (é o
gesto que ele pode estar a exigir). Medido: **5 de 5** — a primeira visita fica com o botão à espera e
**0** pedidos; uma sala por uma porta entra sozinha com o botão escondido e **0** pedidos; o portão por
uma porta arranca com **1** pedido e stream; outra sala, o mesmo sem pedidos; e, com o `getUserMedia`
a rejeitar `NotAllowedError` (a simulação de «o browser quer o gesto»), o botão volta e a mensagem
aparece. A bateria dos doze mantém os números no portão, na cidade e no fixture.

**O que mudou:** `js/modules/camera.js` (`startSession(options)` com `arrival`, e o
`showStartButton()` que a recusa usa) e `js/app.js` (`arrivedFromADoor()` e o arranque automático
depois do construír da cena). Nada no editor, nada no dado, nada na exposição que os testes meçam.

#### O que o B12 entregou e mediu (2026-10-20) — a porta do portão mostra a realidade

Achado pelo autor, a jogar o publicado: ao entrar na cidade e olhar a porta de onde veio, «aparece
somente o pórtico, sem a imagem da câmara, como se fosse transparente». Estava certo, e o que se
via era a **decisão do dado**: a porta de volta ao portão é `window: none` desde a **D29** (o R10
fechou «não há retrato do portão»), porque um retrato emprestado mentiria. Mas o que o autor queria
não é um retrato — é a **realidade ao vivo**, que é o que a porta mostrava na Fase 3, quando o mundo
era uma página só e a dimensão 0 era a câmara.

**A sonda, antes de mexer em código.** Uma cópia da cidade declarada com uma dimensão `kind:
"camera"` (id 1) e a porta de volta com `window: dimension-pair` (0, 1): nas capturas, o interior da
moldura mostrou o **padrão da câmara falsa do Chrome** (verde) por cima do panorama da sala — e o
mecanismo é o que já existia: uma dimensão de câmara **não desenha nada** (`createDimension` devolve
`null`), a máscara escreve stencil **e profundidade** no plano da janela, e o canvas — com `alpha`
— fica transparente ali, deixando passar o `<video>` que está atrás.

**A regra que faltava.** `dimension-pair + navigate` estava fora da matriz da L18 com a razão
escrita («o que o visitante vê pela janela seria mentira»). Deixa de ser mentira quando a dimensão
mostrada é a **câmara** e a porta leva ao **mundo de entrada**: o que se vê é o que espera o
visitante. Ficou em `portal-kinds.js` como uma função que precisa do mundo e não só da porta —
`showsTheCamera(window, dimensions)` e `isLegalDoor(door, dimensions)` —, lida pelo **validador**
(o mesmo `validateDoor`, agora com as dimensões) e pelo **editor**, para que um não aceite o que o
outro recusa.

**O dado:** `cidade` e `praia` passaram a ter a dimensão **1** `kind: "camera"` e
`cameras.real.enabled: true`, e as portas 2 e 5 (as que voltam ao portão) um `window:
dimension-pair` (0, 1) com o `action: navigate` que já tinham. O céu não tem porta para o portão (a
sua porta vai à praia) e ficou como estava.

**Medido:**

| O que | Resultado |
| --- | --- |
| `validate.mjs` | **0** — as duas salas com 2 dimensões, a L18 a aceitar a exceção |
| `laws-selftest.mjs` | **21 de 21** — a avaria nova (uma janela de câmara a navegar para uma **sala**) é detectada, e o controlo continua limpo |
| A imagem, na cidade | captura **de frente**: moldura vermelha com a câmara (verde) por dentro, sobre o panorama da cidade; **de trás**: o mesmo, visto do outro lado |
| A imagem, na praia | captura de frente: idem, sobre o panorama da praia |
| Bateria na cidade e na praia | T4, T5, T6, T9 (`2 → 2` e `3 → 3`, os mesmos nós — a dimensão de câmara não cria entidade), T10/T12 e T2/T3 **passam**. Os contadores de pixels mudaram (T5 `0 / 1 360 / 0`, T2/T3 `19 278` amostras) porque a sala passou a ter câmara e o `scene.resize()` que ela dispara **corrige o aspecto** da câmara: a janela do rig projecta-se 7 % mais pequena (1,72 → 1,85) — a invariante é a mesma |
| Consola (T8), nas 5 páginas | **0** erros, **0** avisos, **0** pedidos falhados (com a câmara concedida, que é o estado de quem visita) |
| A chegada (T7/T11) | passa nas três salas |
| O editor | **35 de 35**: os 5 mundos com `0 / 0 / 0` e **importar→exportar byte-idêntico** — o painel do portal **não** reescreve a porta da câmara (mostra a combinação como vinda do dado, com a nota da D38) |

**O custo, dito:** as salas passam a **pedir a câmara** (é o preço de a mostrarem). Como é a mesma
origem do portão, o browser não volta a perguntar nada a quem já autorizou; e se for recusada, a
janela não tem imagem, a mensagem do erro aparece e o botão da D37 volta. O ecrã de entrada continua
a ser uma vez por página, não por portal.

**O que mudou:** `js/modules/portal-kinds.js` (`showsTheCamera`, `isLegalDoor`, `validateDoor` com as
dimensões), `js/scene/validation.js` (uma linha, a passar as dimensões), `js/editor/panels/portal.js`
(a porta cuja ação vem do dado mostra-a em vez de a reescrever), `data/worlds/{cidade,praia}.json`,
`i18n/pt.json` (a nota nova) e o `laws-selftest.mjs` (a avaria nova).

#### O que o B13 entregou e mediu (2026-10-21) — o nome de cada porta

Pedido do autor, para facilitar o nosso debug: «vamos colocar o nome nos portais, sendo os nomes das
dimensões, mundos ou portão». Uma porta passa a dizer o que é, **tirado do dado** e não escrito no
código:

| Porta | O que diz |
| --- | --- |
| `gate` 0 / 1 | `#0 · retrato-cidade → cidade` · `#1 · retrato-praia → praia` |
| `cidade` 2 / 3 | `#2 · Cidade 360º ↔ Realidade → Portão` · `#3 · retrato-praia → praia` |
| `praia` 4 / 5 / 6 | `#4 · retrato-cidade → cidade` · `#5 · Praia ↔ Realidade → Portão` · `#6 · retrato-ceu → ceu` |
| `ceu` 7 | `#7 · retrato-praia → praia` |

**Como está feito (D39):** o nome é escrito pelo **construtor** — é ele que lê o mundo — e chega ao
componente como um atributo (`label`); o componente só o desenha. A função `portalLabel()` é pura e
exportada, porque o editor re-cria **uma** porta de cada vez (D33) e tem de lhe dar o mesmo nome. As
peças: o id (`#2`), o que a janela mostra (os **nomes** das duas dimensões do par, pela língua; ou o
id do retrato; ou «sem janela») e para onde a travessia leva (o **slug** do mundo — que é o nome de um
mundo, D28 — excepto o portão, que é o mundo de entrada e tem o nome do catálogo; «entra na janela»
para `enter-window`, «sem passagem» para `none`).

**Desenha-se como *sprite*, não como plano:** quem chega aterra **atrás** da porta, e um plano leria
ao contrário desse lado. O sprite é virado à câmara por construção, com o texto pintado **uma vez**
num canvas (nunca por frame), 1,1 m de alto e no máximo 12 m de largo — a largura da porta —, por
cima do topo dela e com a ordem de desenho do debug (10).

**Quando aparece:** na exposição com a tecla **D**, junto da caixa de colisão; no **editor** desde o
arranque (`labels: true`), porque a ferramenta não tem teclas e é lá que se arruma.

**Medido (23 de 23):**

| O que | Resultado |
| --- | --- |
| Sem a tecla `D` | **0** sprites em cada um dos 4 mundos — a vista do visitante não mudou |
| Com `D` | um sprite **visível** por porta, com o texto acima, nos 4 mundos; outra vez `D` esconde-os |
| O editor | os **2** nomes da cidade à vista à chegada, iguais aos da exposição |
| Uma porta com nome, criada e destruída ×10 | o sprite é desenhado (texturas na GPU `10 → 20`) e, ao remover, a árvore volta ao que era e as texturas também (`20 → 10`) — o `remove()` passou a libertar o `map` do material e a **não** libertar a geometria de um sprite (é partilhada, é da three) |
| A consola | **0** erros e **0** avisos com tudo isto |
| A bateria dos doze, nos 5 mundos | passa em todos — a T9 continua `2 → 2`, `3 → 3`, `1 → 1`, `4 → 4` com os mesmos nós (o nome não existe enquanto `D` não é carregada) |
| O editor | **35 de 35**, importar→exportar byte-idêntico |
| `validate.mjs` / `laws-selftest` | **0** / **21 de 21** |

#### O que o B14 entregou e mediu (2026-10-21) — o nome das obras, com a mesma tecla

Pedido do autor, a seguir ao das portas: «vamos colocar isso para obras também». A tecla **D** passa
a mostrar, acima de cada obra, o nome dela:

| Mundo | O que as obras dizem |
| --- | --- |
| cidade | `#0 · galeriaFoto1 · Cidade 360º · modal`, `#1 · galeriaFoto2 …`, `#2 · video …`, `#3 · praia …`, `#4 · skycloud …` |
| praia | `#5 · skycloud · Praia · modal`, `#6 · galeriaFoto2 …`, `#7 · galeriaFoto1 …` |
| céu | `#8 · praia · Céu 360º · modal`, `#9 · cidade-360 · Céu 360º · modal` |

**O que o nome diz:** o **título** quando o dado tem um (D21 — hoje nenhuma obra tem), senão o **id do
asset** (que é o que se edita no ficheiro), a **dimensão pelo nome** e a **interacção** pela palavra do
dado (`modal`, `none`, `link`), porque é essa a palavra que se escreve no JSON. Escrito pelo
**construtor** (`artworkLabel()`, ao lado do `portalLabel()` da D39) e entregue ao componente como
atributo: o componente só desenha.

**Um desenho só para os dois (D40):** a pintura do nome saiu da porta para **`js/modules/label.js`**
(`createLabel`/`disposeLabel`), e portas e obras usam-na — assim o tamanho, a cor, o tipo de letra e o
`renderOrder` não podem divergir. A posição é que é de cada um: a porta põe-no acima do **seu** `height`,
a obra acima do **topo dela** (`size[1] / 2`), que o construtor conhece.

**Medido (21 de 21):**

| O que | Resultado |
| --- | --- |
| Sem a tecla `D` | **0** nomes nas 5, 3 e 2 obras dos três mundos (a vista do visitante não mudou) |
| Com `D` | um nome por obra, **na árvore e visível**, com o texto esperado; e outra vez `D` esconde os nomes **e** as caixas das portas (uma tecla para a vista toda) |
| Onde fica | acima do topo de cada obra (y local **2,45** para obras de 3 m) |
| No **portão**, que não tem obras | a tecla não rebenta: as 2 caixas das portas aparecem na mesma |
| O editor | os 3 nomes da praia à chegada, iguais aos da exposição |
| 10 obras com nome criadas e destruídas | texturas na GPU `13 → 23 → 13` e a árvore de volta ao que era — o `remove()` do componente liberta o material e o `map` do sprite, e não a geometria (é da three, partilhada) |
| A consola | **0** erros e **0** avisos |
| A bateria dos doze, nos 5 mundos | passa em todos (os nomes não existem sem `D`) |
| O editor | **35 de 35**, importar→exportar byte-idêntico |
| `validate.mjs` / `laws-selftest` | **0** / **21 de 21** |

**O que mudou:** `js/modules/label.js` (novo, o desenho partilhado), `js/modules/portal.js` (passa a
usá-lo; a pintura saiu daqui), `js/modules/artwork.js` (`label`/`labelAlways`/`labelY`,
`showLabel`/`toggleLabel`, `toggleArtworkLabels()` e a libertação no `remove()`),
`js/scene/scene-builder.js` (`artworkLabel()` e o repassar de `labels`), `js/editor/preview.js` (o nome
na obra re-criada) e `js/app.js` (a tecla `D` passa a chamar as duas coisas).

#### O que o B15 entregou e mediu (2026-10-21) — o botão de entrada segue a câmara

Pedido do autor, depois de testar no telemóvel («ok, mas um refinamento»): «o botão de ativar a
exposição deve desaparecer quando a câmara estiver ativa, mesmo que a imagem da câmara não estiver na
visão do interator».

**O que estava errado.** O botão seguia o **clique**, não a câmara: aparecia enquanto a câmara não
existisse (certo) mas voltava sempre que a chegada era recusada — e nunca se escondia por si só. Numa
sala a câmara não está à vista (é só a janela da porta que volta ao portão, **D38**), e mesmo assim a
página pedia para «ativar a exposição».

**A regra (D41).** O botão é a **porta para a câmara**, portanto:

1. esconde-se **no instante em que há um stream** (`isCameraActive()`), mesmo que a câmara não esteja
   à vista — quem já tem câmara não tem nada para ativar;
2. **nunca** volta a aparecer com um stream vivo (`showStartButton()` pergunta primeiro);
3. uma visita em que o browser **já tem a permissão** — `permissions.query({name:'camera'})` diz
   `granted` — arranca **sozinha**, sem gesto: a permissão *é* o registo do gesto de uma visita
   anterior. Em browsers que não respondem a essa pergunta (**Safari**, que lança), a resposta é
   `false` e fica a regra do gesto (**D34**, **D37**).

**Medido (7 de 7)**, em três instâncias de Chrome porque o que muda é a permissão:

| Caso | Resultado |
| --- | --- |
| primeira visita, **sem** permissão | botão **visível**, **0** pedidos, sem stream — a regra do gesto mantém-se |
| chegada por uma porta, **sem** permissão | **1** pedido, falha, botão **volta** com a mensagem (o recuo da D37) |
| primeira visita, com a permissão **já dada** | botão **fora**, câmara **ligada** (**1** pedido), overlay fora |
| **numa sala** (câmara só na janela), com a permissão dada | botão **fora**, câmara ligada — é este o caso que o autor descreveu |
| o módulo | `isCameraActive()` **true**, `cameraAlreadyAllowed()` **true**, botão `none` |
| **telemóvel** (390×844, toque, com permissão) | botão **fora**, câmara ligada, **D-pad dentro** |

E o resto não se mexeu: a consola das 5 páginas com **0** erros e **0** avisos, a bateria dos doze a
passar no portão, na cidade e na praia, o `validate.mjs` a **0** e as metas todas.

**O que mudou:** `js/modules/camera.js` (o `stream` do módulo, `isCameraActive()`,
`cameraAlreadyAllowed()`, `hideStartButton()`/`showStartButton()`) e `js/app.js` (o arranque
automático quando a permissão já existe).

#### O que o B16 entregou e mediu (2026-10-21) — o botão não aparece a meio de uma transição

Achado pelo autor, num vídeo da sessão no telemóvel (`.harness/imagenTeste/botão.mp4`, 15,4 s): ao
atravessar um portal, **o botão «ATIVAR EXPOSIÇÃO» aparecia sozinho sobre um ecrã preto**. O vídeo foi
lido fotograma a fotograma (extraídos por um Chrome headless, sem depender de ferramentas externas) e
o fotograma do meio da transição mostra exactamente isso: preto e o botão vermelho.

**A causa, medida e não deduzida:** o botão estava **visível no markup** desde a primeira pintura, e quem
o escondia era o arranque automático da chegada (D37) — mas só **depois** de `initI18n()` e de
`buildFromData()`, que **espera por todos os assets** (segundos num telemóvel). Nessa janela, o
visitante via um ecrã preto com um botão.

**A correção (D42):** o botão está **escondido no markup** (`hidden`) e a decisão passou a ser tomada
**antes** do trabalho pesado:

- a chegada (`?from=`) **nunca** o mostra — e mostra a linha **«Carregando…»** enquanto a cena carrega,
  para o ecrã não ficar vazio;
- a primeira visita vê-o assim que a permissão é consultada, **antes de a cena carregar** (medido:
  botão aos **357 ms**, primeira porta aos **373 ms**);
- um clique durante o carregamento não se perde: espera pela cena (`sceneReady`) e só então arranca.

**E uma armadilha encontrada pelo caminho:** a pergunta `permissions.query({name:'camera'})` da D41,
com a rede estrangulada (CDP), **não respondeu** — e como o arranque a esperava, a exposição ficava na
linha «Carregando…» para sempre. Passou a ser esperada no máximo **1 s**; sem resposta, a visita é
tratada como «não sei» e o botão aparece. Medido com uma sonda que substitui a pergunta por uma
promessa que nunca resolve: botão aos **1 488 ms** (o limite mais a rede), página utilizável.

**Medido (9 de 9)**, com uma sonda instalada antes do documento que anota **cada mudança** (botão,
«Carregando…», primeira porta) e uma rede a **800 kB/s** com 100 ms de latência, em viewport de
390×844:

| Caso | Linha do tempo |
| --- | --- |
| **chegada com permissão** | 888 ms botão fora · **1 516 ms «Carregando…»** · 4 461 ms primeira porta · 5 057 ms nada por cima — **o botão nunca aparece** (0 passos) |
| **primeira visita** | botão aos **357 ms**, cena aos **373 ms** — aparece antes dos assets, e o clique esconde-o |
| **chegada sem permissão** | «Carregando…» aos 404 ms · cena aos 691 ms · câmara recusada · botão volta aos **833 ms** com a mensagem (o recuo da D37) |
| **permissão que nunca responde** | botão aos **1 488 ms** — a página não fica presa |

Sem regressões: a bateria dos doze nos 5 mundos, a consola com **0** erros e **0** avisos nas 5
páginas, o editor em **35 de 35**, as etiquetas em **23 de 23** e **21 de 21**, a D41 em **7 de 7**,
`validate.mjs` **0** e `laws-selftest` **21 de 21**, e as metas todas. Os quatro arranques foram
regenerados a partir da raiz (o `index.html` mudou).

**O que mudou:** `index.html` e os três arranques (`hidden` no botão), `js/app.js` (a decisão antes do
build, o clique que espera, o `showLoading()` na chegada), `js/modules/camera.js` (`showLoading`
exportado, `hideStartButton`/`showStartButton` com o atributo `hidden`, e o tempo-limite da permissão).

#### O que o B17 entregou e mediu (2026-10-22) — a travessia deixou de passar pelo preto

Achado pelo autor, num segundo vídeo (`.harness/imagenTeste/02.mp4`, 25,3 s, 1570×796), depois do B16:
ao atravessar uma porta via-se, **na sequência**, a imagem do mundo para onde ia, a imagem esférica,
**um quadro preto**, outra vez a imagem do mundo, **outro quadro preto**, e só então o mundo. Ele
descreveu-o como acontecendo «com a câmara, com mundos e com dimensões».

**Primeiro foi preciso ler o vídeo.** Não há `ffmpeg` nesta máquina e o primeiro instrumento lia todos
os fotogramas iguais (brilho 88, `currentTime` preso em 0, `readyState` 4): o servidor do arnês não
respondia a `Range`, e sem isso o Chrome não consegue procurar dentro de um mp4. Com o `Range` no
servidor, o vídeo leu-se e a linha do tempo apareceu — **preto dos 11,35 aos 12,1 s** (0,85 s) e outra
vez aos **21,5 s** (uma amostra), exactamente nos dois sítios onde há uma travessia.

**A causa, medida e não deduzida.** Cada mundo é uma página (D24) e **todas** as portas da cidade e da
praia são `navigate` (nenhuma muda de dimensão dentro da página): por isso «câmara, mundos e
dimensões» são o mesmo caso — uma navegação. A página que chega não pinta nada até a cena estar
construída, e no meio ficava o **preto do `#container-video`** (é ele, e não o `body`, que é opaco).
Medido no browser a atravessar a porta 4 da praia a pé, com fotogramas a cada ~50 ms:

| | amostras escuras | primeira imagem do destino |
| --- | --- | --- |
| antes | **2** (brilho **0,0** aos 242 ms e **1,1** aos 325 ms) | aos **403 ms** |
| depois | **0** em 89 amostras | aos **213 ms** |

**A correção (D43) — a ponte de imagem.** A única imagem que serve é a que o visitante já estava a ver:
a página que sai compõe o **último quadro** (o `<video>` da câmara por baixo, o canvas por cima, na
ordem e no enquadramento do CSS) e guarda-o em `sessionStorage`; a página que chega pinta-o **antes de
tudo o resto**, e o `js/app.js` desvanece-o quando há cena. O `js/arrival-frame.js` é o único script
**clássico** do projeto e a única linha de código no markup: um módulo só corre depois de carregar a
sua árvore de importações, e enquanto isso o ecrã já estava preto.

**Medido (7 de 7)**, num ecrã de telemóvel (390×844, `dpr` 2) com câmara falsa:

| Caso | Medição |
| --- | --- |
| o quadro guardado é a imagem do ecrã | **76 kB**, 780×1688, brilho **191,5** (o canvas sozinho é transparente: sem compor o vídeo, a ponte seria preta) |
| a travessia não tem fotograma escuro | **0** em **89** amostras (antes: **2**) |
| a ponte está lá na primeira pintura | `frame 1 ponte=true` — o teste corre dentro do primeiro `requestAnimationFrame`, que precede a pintura |
| desvanece e sai quando há cena | desvanece aos **678 ms**, sai aos **746 ms** |
| a chave é de uso único | recarregar a seguir: sem ponte, chave apagada |
| sem cena (construção falhada) | a ponte sai na mesma ao fim da guarda de **10 s** |
| custo da captura | **43–57 ms** para 780×1688 (uma vez por travessia; o ecrã não muda enquanto decorre) |

Sem regressões: a consola com **0** erros e **0** avisos nas 5 páginas, a bateria dos doze nos 5 mundos
(com o T10/T12 do `example` exactamente nos mesmos números de antes — verificado com e sem a
alteração), o editor em **35 de 35**, a D37 em **5 de 5**, a D41 em **7 de 7**, a D42 em **9 de 9**,
`validate.mjs` **0** e `laws-selftest` **21 de 21**, e as metas todas. Os quatro arranques foram
regenerados a partir da raiz (o `index.html` mudou).

E na **versão publicada** (GitHub Pages, `/zonas12/praia/`, com a cache desligada e o mesmo caminho a
pé pela porta 4): **122** amostras, **0** escuras, a ponte no primeiro fotograma, chegada à cidade —
**4 de 4**. É onde o autor viu o defeito, e é onde ele deixou de existir.

*(A bateria da D37 acusava duas falhas herdadas: era anterior à D41, e esperava o botão à espera numa
primeira visita com a permissão já dada. Foram corrigidas as expectativas, não o código — com e sem
esta alteração o resultado era o mesmo 3 de 5.)*

**O que mudou:** `js/arrival-frame.js` (novo), `index.html` e os três arranques (a linha do script),
`css/style.css` (`.ultimo-quadro`), `js/modules/portal.js` (o `capture()` antes de navegar) e
`js/app.js` (o `hide()` quando há cena).

#### O que o B18 entregou e mediu (2026-10-21) — a travessia não dá a ver que houve uma

O autor testou o B17 e recusou-o: «não deveria ter quadro preto ou outra imagem, deveria ser somente
a imagem que já estava vendo, sem a impressão de transição, isso deveria ser imperceptível». Duas
coisas na ponte do B17 **eram** a transição: o quadro desvanecia-se em **240 ms** e a linha
**«Carregando…»** aparecia por cima dele. Uma dissolução entre duas imagens parecidas lê-se como
efeito, e uma linha a aparecer é exactamente aquilo em que se repara quando o resto não muda.

**A costura, medida.** Foi preciso corrigir o instrumento primeiro: ele atravessava a porta **de
costas** (mexia na posição da câmara e não na rotação), e o quadro guardado era o mundo de onde se
vinha visto de lado, não a janela. Com a câmara a olhar para a porta e a andar 8,5 m até 2,5 m depois
do plano, cada amostra comparada com a anterior por uma assinatura 4×4 de luminosidade:

| O que se compara | Salto |
| --- | --- |
| último ecrã → quadro da ponte | **0,22** (a ponte é, de facto, o ecrã) |
| quadro da ponte → mundo já assente | **3,94** |
| maior salto a caminhar, antes de a janela encher o ecrã | **2,69** |
| a janela a encher o ecrã (o efeito do portal, que é para existir) | **35,13** |

Ou seja: o único salto que sobra é o do tamanho de **um passo de caminhada**, e o que ele mostra é o
que a sala de destino tem e o retrato dela não tinha — em frente da chegada da cidade está a obra 3
(a 9 m), que passa a ver-se (é a R11: a chegada é virada para dentro da sala). Não há como uma
fotografia da página que sai prever os objectos 3D da página que chega.

**A correção (D44):**

- a ponte sai **de uma vez**, no mesmo fotograma em que o mundo aparece — sem `transition` no CSS e
  sem `setTimeout` de remoção: medido, **sempre a opacidade 1** até desaparecer (aos 429 ms);
- a linha «Carregando…» **não aparece** quando há ponte no ecrã (`showLoading()` pergunta-lhe): medido
  na travessia, **nunca apareceu**. Continua a aparecer na primeira visita, onde a ponte não existe e
  o ecrã estaria vazio.

**Medido (8 de 8):** as seis verificações do B17 (o quadro é a imagem do ecrã, **0** fotogramas
escuros, a ponte na primeira pintura, a chave de uso único, a guarda de 10 s, a chegada ao outro
mundo) mais as duas novas (sai num só passo; a linha não aparece).

**O que mudou:** `js/arrival-frame.js` (`hide()` sem desvanecimento e sem `setTimeout`),
`css/style.css` (fora a `transition`), `js/modules/camera.js` (`showLoading()` cala-se quando a ponte
cobre o ecrã) e `js/app.js` (o comentário da ordem).

#### O que o B19 entregou e medido (2026-10-21) — o fotograma de câmara dentro da travessia

O autor viu, no vídeo seguinte, **um fotograma em que a câmara aparece** a meio da travessia, «tanto
no ir como no voltar», e pediu que, se a transição não se puder eliminar, ao menos seja **ordenada**.

**Onde estava, medido.** O que fica por baixo do canvas é o `<video>` da câmara, e o canvas é
`alpha: true` — tudo o que faça o canvas não ter desenho mostra a câmara (ou o preto dela). Duas
janelas, as duas medidas com uma sonda que embrulha `renderer.render` e `cena.resize` e anota cada
fotograma:

| Janela | Antes | Depois |
| --- | --- | --- |
| a ponte saía **antes** de o `<video>` ter imagem | ponte fora aos **442,5 ms**, `video playing` aos **500,1 ms** — **58 ms** com o preto do vídeo por baixo (num telemóvel, mais) | a ponte sai **no mesmo instante** que `loadeddata` (0,1–0,3 ms depois), nos três mundos |
| o `resize` da câmara limpa o buffer do canvas | próxima renderização **6 ms** depois (sub-fotograma por sorte) | `resize` + renderização imediata no mesmo passo: **0,5 a 5,2 ms** sem desenho |

**A correção (D45):**

- `cameraFirstFrame()` (novo, em `js/modules/camera.js`) responde quando a câmara **apresentou** um
  fotograma — `requestVideoFrameCallback`, não `loadeddata`: decodificar não é apresentar, e isso
  mediu-se (numa das passagens publicadas o portão ficou preto segundos com `loadeddata` já disparado).
  Responde também quando a câmara não conta para esta cena, quando é **recusada** (`cameraWillNotShow`,
  para uma chegada não ficar à espera de um fotograma que não vem) ou ao fim de **3 s**. O `js/app.js`
  só tira a ponte depois de a cena ter desenhado **e** de a câmara ter imagem;
- o `resize` da câmara passa a ser seguido de uma renderização **imediata**, para o buffer do canvas
  nunca estar vazio quando o compositor olha para ele.

**Medido (9 de 9):** as seis verificações do B17, as duas do B18 e a nova — *a ponte só sai depois de
a câmara ter o primeiro fotograma* (**video aos 622,3 ms, ponte sai aos 632,5 ms**), e nos três mundos
a ponte sai no mesmo instante que `video playing` (portão **400,7 / 400,7 ms**, cidade **495,5 /
495,3 ms**, praia **449,0 / 448,8 ms**). Sem regressões: a consola com **0** erros e **0** avisos nas
5 páginas (com o T7/T11 a passar nas três chegadas), o editor em **35 de 35**, a D37 em **5 de 5**, a
D41 em **7 de 7**, a D42 em **9 de 9**, `validate.mjs` **0** e `laws-selftest` **21 de 21**.

**O que mudou:** `js/modules/camera.js` (`cameraFirstFrame()`, `cameraWillNotShow()`, o
`FIRST_FRAME_TIMEOUT` de 3 s e a renderização depois do `resize`) e `js/app.js` (a ponte espera pelas
duas coisas).

#### B20 — o retrato da porta é a vista da chegada *(fechado, 2026-10-22)*

**O que motiva.** A travessia deixou de ter preto, linha e fotograma de câmara (B17–B19), mas continua
a ter **um corte**: a janela da porta mostra o **panorama** do destino e a chegada mostra o panorama
**mais as obras e as portas dele** — o que salta é o que a fotografia não tinha. Medido com
`tools/regression/seam.mjs`, nas seis portas com retrato (o salto no corte, e a meta de **0,50**):

| porta | destino | salto no corte (linha de base) |
| --- | --- | --- |
| gate 0 | cidade | **7,54** |
| gate 1 | praia | **2,03** |
| cidade 3 | praia | **2,68** |
| praia 4 | cidade | **4,07** |
| praia 6 | céu | **0,68** |
| céu 7 | praia | **13,36** |

**As decisões (D46 e D47).** O retrato de uma porta de mundo passa a ser **a vista da chegada**: um
equirretangular desenhado pela própria exposição a partir do ponto onde o visitante vai aparecer
(`?from=<origem>` e o `arrivalPoint`, uma só casa para a geometria — L16), com as obras e as portas
do destino lá dentro, e **um por porta**. A esfera onde ele é mostrado passa a estar centrada à
**altura dos olhos** — a mesma de onde o cubo é desenhado.

**O que se mediu, por ordem.**

1. **O conversor está certo.** Um panorama conhecido passado por esfera → cubo → equirretangular
   (`tools/regression/ida-e-volta.mjs`) volta com deslocamento de **0 colunas**, brilho 121,9 contra
   122,4 do original e uma diferença de assinatura de **0,39**. A primeira suspeita — a codificação da
   cor — foi afastada por medida: o instrumento não declara o `colorSpace` da textura, portanto a cor
   entra e sai sem ser descodificada nem recodificada; aplicar o transfero do sRGB «à mão» é que
   punha o brilho em 177,5 e a diferença em dezenas.
2. **A ponte não custa nada.** O mesmo quadro guardado por `arrivalFrame.capture()` e mostrado por
   cima da cena que ele fotografou difere dela em **0,00** (`tools/regression/piso-ponte.mjs`) — o
   JPEG da ponte não é o problema.
3. **Não é desalinhamento.** Procurar o deslocamento que melhor sobrepõe a ponte e a chegada dá
   **dx=0, dy=0** (`tools/regression/desalinhamento.mjs`). O que sobra é conteúdo, não posição.
4. **O centro da esfera era o defeito.** A esfera nascia no `portal.position` — no **chão**, 1,6 m
   abaixo do olho — e o retrato inteiro aparecia deslocado para baixo (~11 px num telemóvel; a faixa
   de cima do ecrã era a que mais sofria, e era a que estava a 3,6–3,9). Varrendo a altura do centro
   na porta 4 da praia: **0 → 1,56**, 0,8 → 1,06, 1,2 → 0,80, 1,5 → 0,61, **1,6 → 0,54**, 1,7 →
   0,47, 2,0 → 0,53. O raio quase não conta (500 dá 0,53 onde 120 dá 0,54) e a variante em que a
   esfera **segue a câmara** foi medida e rejeitada: **25,30 / 7,30 / 1,17** conforme o raio.
5. **E faltava resolução.** A obra nítida é reconstruída duas vezes (cubo → equirretangular), e o
   retrato a 2048×1024 era o gargalo: a 3072 a porta 4 desce a **0,46** e a 4096 a **0,40**. A
   qualidade do JPEG quase não conta (a 4096, 0,85 dá 0,39 e 0,75 dá 0,40) — quem manda é a
   resolução.

**Medido nas seis portas, com o centro à altura dos olhos e um retrato por porta a 3072×1536 q0,70**
(a resolução do **D47**, revista para 3072: ver abaixo):

| porta | destino | antes (centro na porta) | depois | ficheiro |
| --- | --- | --- | --- | --- |
| gate 0 | cidade | 1,38 | **0,31** | `cidade-de-gate.jpg` |
| gate 1 | praia | 0,91 | **0,32** | `praia-de-gate.jpg` |
| cidade 3 | praia | 0,96 | **0,30** | `praia-de-cidade.jpg` |
| praia 4 | cidade | 1,49 | **0,41** | `cidade-de-praia.jpg` |
| praia 6 | céu | 0,70 | **0,17** | `ceu-de-praia.jpg` |
| céu 7 | praia | 1,41 | **0,39** | `praia-de-ceu.jpg` |

*(Medição de 2026-10-20. Em 2026-10-24 os retratos das seis portas foram regerados com os fundos
shader — os ficheiros passaram a `scene1-de-gate.jpg`, `scene2-de-gate.jpg`, `scene2-de-scene1.jpg`,
`scene1-de-scene2.jpg`, `scene3-de-scene2.jpg` e `scene2-de-scene3.jpg`, e o shader é congelado no
tempo estático para o retrato casar com a chegada.)*

**12 de 12 verificações** (antes: 5 de 12, e uma porta com cinco fotogramas escuros). A meta de
**0,50** fica cumprida com **0,09 de margem**; a referência de contexto é que um passo a caminhar
muda a imagem em ~0,9.

**A resolução foi revista no fecho da fase (D47, emenda de 2026-10-23).** A primeira versão do bloco
usava **4096×2048** nas duas portas onde 3072 não chegava à margem (praia 4 e praia 6), com o salto
em 0,40. O ensaio de fundos procedurais que o autor fez em paralelo (**R14**) fixou um orçamento de
imagem para telemóvel — `1024×512` como ponto de partida e **4096×2048 «não recomendado para móvel»
sem nova medição** —, e o retrato a 4096 custa **32 MiB** de textura em vez de 18 MiB: num PowerVR
GE8320 a página da praia ia a **52 MiB** de texturas. Ficou **3072×1536 nos seis**, medido de novo em
duas passagens: **0,17 a 0,41** (o pior salto desceu de 0,41, com mais margem do que os 0,47 medidos
no bloco), o repositório perdeu **~600 kB** e a praia perdeu **14 MiB** de textura.

**O que mudou:** `js/scene/scene-builder.js` (o retrato nasce em `[x, altura do jogador, z]`, com a
altura lida uma só vez do dado da câmara) e `tools/scene/portrait.mjs` (o tamanho, a regra das duas
passagens e o modo `--todos` que desenha as seis). Nos dados mudaram **só os `path`**; os
ids dos retratos ficaram, para as baterias que os nomeiam continuarem válidas. Os três retratos
antigos **ficam** (`praia.jpg` ainda é o do mundo de exemplo). Total em `assets/previews/`: 2,8 MB
(2,0 MB dos seis retratos novos).

**O que fica escrito para o futuro.** O retrato de um mundo **contém as janelas das portas desse
mundo**, que são retratos deles próprios: o mesmo comando deu 438, 215 e 378 kB em passagens
seguidas. A costura não se mexe com isso (0,37 antes e depois de regenerar), mas o ficheiro sim —
por isso a regra é gerar **duas vezes** quando uma sala muda, e está no cabeçalho da ferramenta.

**A consequência aceita (revista na Fase 7).** Como o retrato ficou a **3072×1536**, acima do padrão
de **2048×1024** da **L14**, a lei passava a avisar: **6 avisos** em `tools/scene/validate.mjs` (um
por retrato acima do padrão) e **1 a 2 por mundo** no relatório do editor. A bateria do editor passou
de **35** para **34 de 35**: a que falha é a que exige «Avisos: 0». **Decisão do autor em
2026-10-23: fica assim** — sem padrão próprio na lei; se um dia o shader substituir o fundo, os
retratos voltam a poder ser pequenos e o aviso desaparece por si.

**Emenda de 2026-10-24 (Fase 7, com o fundo shader em produção): foi isso que aconteceu.** Com o
céu, o mar e o chão calculados — iguais dos dois lados do corte —, o retrato deixou de ter de
carregar o panorama e voltou ao padrão: `2048 × 1024`, JPEG q0,85, os seis entre **90 e 172 kB**
(**772 kB** no total, contra 2,0 MB). Medido com a bateria da costura, agora a comparar o **primeiro
fotograma depois de a ponte sair**:

| porta | destino | salto (retrato 3072, imagem de fundo) | salto (retrato 2048, fundo shader) |
| --- | --- | --- | --- |
| gate 0 | scene1 | 0,31 | **0,42** |
| gate 1 | scene2 | 0,32 | **0,19** |
| scene1 3 | scene2 | 0,30 | **0,18** |
| scene2 4 | scene1 | 0,41 | **0,47** |
| scene2 6 | scene3 | 0,17 | **0,13** |
| scene3 7 | scene2 | 0,39 | **0,22** |

**12 de 12**, e agora **reprodutível**: duas passagens seguidas dão exactamente os mesmos seis
números. A porta 4 é a que fica mais perto da meta (0,47): o fundo `grade-neon` tem uma grelha fina
que o retrato, a 2048, suaviza (a média de luminosidade sobe ~0,5 num bloco de 48 px) — mais
resolução foi medida e não comprava nada a 2048 de saída. O `validate.mjs` voltou a `Erros: 0 ·
Avisos: 0` nos seis mundos, e a bateria do editor volta a poder fechar em **35 de 35**.

**Duas lições de instrumento, que custaram a achar.** (1) O `__saiu` da sonda só pode valer depois de
a ponte ter sido **vista**: um documento novo passa os primeiros instantes sem quadro nenhum, e sem
isso a «primeira fotografia depois da ponte» era a página anterior, ainda no ecrã (0,40 virava 2,4 e
depois 67). (2) O Chrome sem cabeça pintava uma **barra de deslocamento** de 4 px na borda direita
enquanto a página assentava (transborda 4 px): a assinatura de luminosidade lia-a como imagem e o
salto subia a **0,55–0,90** conforme a máquina estivesse mais ou menos ocupada. O arnês passou a
esconder as barras (`Emulation.setScrollbarsHidden`) — o painel não tem barras de deslocamento, e a
medição também não.

#### Metas de sucesso

**(a) Comportamento — nenhum número pode mudar.** Os **doze** testes de §10 na exposição, nos 5
mundos, com os valores da v0.0.6 (a bateria é `runAcceptance()` mais `walkDoor(id)` e
`checkArrival()`). Se algum número mexer, é bug. **Medido no B10, nas 5 páginas:** todos os que
correm passam, com o T8 e o T7/T11 medidos de fora; os contadores de *pixels mudados* do T10
dependem da janela do arnês, e o que se compara é o «0 fora da moldura» e o passar de cada teste.

**(b) Arquitetura — metas novas, todas mensuráveis.**

| # | Meta | Como se mede | Alvo |
| --- | --- | --- | --- |
| M1 | Os ficheiros do editor existem | `editor.html`, `css/editor.css`, `js/editor.js` | os **3** |
| M2 | Zero texto de interface em código | `grep` de literais portugueses em `js/` | **0** (só `t('…')`) |
| M3 | Zero texto em CSS | `grep "content:"` em `css/` | **0** |
| M4 | O catálogo cobre o que a interface diz | script: toda a chave `t('…')` existe em `pt.json` | **100%** (fecha o **R3**) |
| M5 | O editor não escreve em disco | `grep` de `fs`/`localStorage`/`writeFile` em `js/` | **0** (D2) |
| M6 | O editor usa os mesmos módulos | `import` de `core/`, `modules/` e `scene/` em `js/editor*` | os **3** grupos (D4/D3) |
| M7 | A exposição não conhece o editor | `grep editor` em `js/core/`, `js/modules/`, `js/scene/` e `js/app.js` | **0** (fora de comentários) — a regra da D4, literal |
| M8 | **R8** fechado | ciclo build/remove ×**20** no editor | registos vazios, **1** ouvinte, 0 erros. **Medido no B3 (2026-10-20)**, no portão e no fixture: **0** desvios em 20 ciclos com `tools/regression/scene-cycle.mjs`, e **re-medido no editor no B4** (ver o registo do B4: `runSceneCycle()` com 20 ciclos, 0 desvios) |
| M9 | **R9** fechado | `laws-selftest.mjs` com uma avaria por valor não construído | **17 → 20 de 20** — medido no B9, com o controlo limpo (0 erros, 0 avisos) |
| M10 | A validação é uma só | `grep` de leis duplicadas no editor | **0** (importa `js/scene/validation.js`) |
| M11 | O ficheiro exportado é estável | importar→exportar os 5 mundos | **0 diferenças** (2 espaços, ordem do `schema.js`, sem campos vazios) |
| M12 | Não se pré-visualiza outro mundo | `grep` de `buildScene` com um ficheiro que não o mundo editado | **0** (L13) |
| M13 | As 4 linhas de §7 por módulo | a tabela do editor | **5** módulos × **4** colunas |
| M14 | Os módulos carregam em qualquer host | importar os 6 numa página sem a UI da exposição | **0** excepções (hoje: **2**) |
| M15 | `?lang=` escolhe a língua | `/?lang=en` sem `en.json` | português, **1** aviso, 0 chaves cruas no ecrã |
| M16 *(B9)* | As perguntas da linha de comando respondidas no browser | `Por verificar` no relatório do editor, nos 5 mundos | **0** — medido no B9 |
| M17 *(B9)* | **Desfazer** e guarda de saída | editar, exportar, desfazer, e o `beforeunload` nos dois estados | export **byte-idêntico** depois de desfazer; **50** instantâneos; a guarda só com alterações — medido no B9 |

#### Aceitação da fase

1. **Só pelo editor:** 1 dimensão + 2 obras + 1 portal, exportar e substituir o ficheiro do mundo.
2. **A cena editada:** `validate.mjs` exit **0** e a bateria dos **doze** com os números da linha
   de base.
3. **O que não mudou:** a bateria nos 5 mundos do `main` e o `checkArranques` (os 4 arranques
   iguais fora do `<base>`).
4. **O editor:** 0 erros e 0 avisos na consola, na carga, ao trocar de mundo e no fim de uma ronda
   de edições.
5. **O *round-trip*:** importar e exportar os 5 mundos sem editar nada → **0 diferenças** (a mesma
   prova das Fases 0 e 3).

#### Riscos da fase

| Risco | Gravidade | Mitigação |
| --- | --- | --- |
| **Os módulos exigirem a UI da exposição** (medido no B0: **2** excepções) | Alta | o **B2** antes de qualquer painel; a **M14** fecha-o |
| O editor e a exposição divergirem | Média | os mesmos módulos (**M6**) e a **M7** (0 imports do editor no núcleo, nos módulos e na cena) |
| A pré-visualização tirar o autor da ferramenta | Média | **D32**: navegação inerte e guarda de saída |
| Reconstruir a cena a cada tecla (os assets recarregam — medido) | Média | **D33**: re-criar **a entidade**; reconstruir só quando a estrutura muda |
| Duas fontes para os rótulos (código e catálogo) | Média | **M2** e **M4**, medidas por script e não por disciplina |
| Exportar por cima do ficheiro errado | Baixa | o nome do ficheiro é o `world.slug`, e o validador já exige que a pasta seja o slug |
| Uma sala inalcançável que o editor não vê | Baixa | fica na linha de comando (sem listagem de pasta por HTTP — nota da §7) |

### Fase 5 — Gravação direta (2026-10-23, **fechada**)

> **O plano foi escrito antes de mexer em código** (B0), como nas fases anteriores. A fase estava
> condicionada a «a fricção de exportar incomodar»; o autor decidiu em **2026-10-23** que incomoda, e
> por isso ela arranca com as suas próprias decisões (**D48–D51**, §11) e com o ponto de partida
> **medido** — não estimado.

- **Entregável:** um servidor local mínimo, `tools/server/serve.mjs` (Node, sem dependências), que
  serve a publicação **e** grava `data/worlds/<slug>.json` — **fora** do que se publica —, com
  **cópia de segurança antes de gravar** e o botão «Gravar» no editor, que só existe quando o
  servidor responde.
- **Verificação:** editar, gravar, recarregar a exposição e ver a alteração.

#### O que existe hoje (medido em 2026-10-23, no B0)

| # | Pergunta | Medição |
| --- | --- | --- |
| 1 | Onde se grava um mundo hoje | **um** sítio: `js/editor/index.js` (`Blob` + `<a download>`, linha 245); o ficheiro é substituído à mão (D2) |
| 2 | Quem escreve em disco no `js/` | **0** — os **9** acertos de armazenamento são todos `sessionStorage` da ponte da D43 (`js/arrival-frame.js`) |
| 3 | O servidor de hoje | `python -m http.server 8123`, citado **1** vez no README: serve ficheiros e **não** aceita escrita |
| 4 | Como o editor lê um mundo | `fetch('data/worlds/<slug>.json')` em **2** sítios (`js/editor/index.js` e `js/editor/worlds.js`) |
| 5 | A barra do editor | **4** botões (Abrir, Desfazer, Validar, Exportar) mais o Importar em etiqueta |
| 6 | O que há para gravar | **5** mundos, **1279** linhas de JSON (**22 454** bytes) |
| 7 | O `tools/` | **24** ficheiros, **5256** linhas (o README dizia 23 e 5098 — ver o B4) |

#### As decisões (D48–D51, §11)

**D48** é o servidor: **um só**, em `tools/server/`, que serve a publicação e grava. **D49** é o
botão: o «Exportar» **fica** (é o caminho que funciona em qualquer host) e o «Gravar» aparece **só**
quando há servidor. **D50** é a recusa: o servidor valida com o **mesmo** `js/scene/validation.js` e
o disco, e não escreve nada quando o mundo tem erros. **D51** é a cópia de segurança: uma por
gravação, em `.harness/backups/worlds/<slug>/`, fora do repositório e da publicação.

#### Blocos de execução

| Bloco | O que entrega | Como se mede |
| --- | --- | --- |
| **B0** | este plano e as **D48–D51** | nada de código |
| **B1 · B2** | `tools/server/serve.mjs`: serve a publicação como o `python -m http.server` (com `/` e `/sala/` a resolverem o `index.html`), diz o que é no cabeçalho `X-Zonas12-Serve` (a resposta à pergunta do editor), recusa `.harness/`, `.git/`, `node_modules/` e caminhos com `..`, escuta **só** em `127.0.0.1`; e `PUT /api/worlds/<slug>` valida com o **mesmo** validador e o disco, recusa versão e slug trocados, recusa erros (**422**) e mundos que não existem (**404**), copia antes de gravar e escreve de forma atómica (`*.tmp` + `rename`) | `tools/server/selftest.mjs`: **34 de 34** — as **5** páginas, os **3** pedidos perigosos, a marca nas respostas e no `HEAD` da raiz, **8** recusas de escrita com **0** bytes e **0** cópias, e **2** gravações com o ficheiro **byte-idêntico** ao enviado e **2** cópias com o conteúdo anterior. *(Os dois blocos correram num commit só: a rota de escrita vive no mesmo ficheiro e mede-se com o mesmo instrumento — ver a nota do B1.)* |
| **B3** | o «Gravar» no editor, ao lado do «Exportar», **só** com servidor (pelo cabeçalho `X-Zonas12-Serve`) e **só quando há alterações**, com o estado a dizer o ficheiro e a cópia; depois de gravar, a marca «alterado» sai e a guarda de saída (D32) cala-se | no browser: com servidor o botão existe, acende quando há o que gravar, grava e a marca sai; sem servidor (`python -m http.server`) o botão **não** aparece, o «Exportar» fica igual e a consola não diz nada |
| **B4** | a aceitação (§ abaixo), o README e o fecho | editar → gravar → recarregar a exposição; `validate.mjs` **0**; a bateria dos doze **35 de 35** |

#### O que o B1 entregou e mediu (2026-10-23)

`tools/server/serve.mjs` (**~330** linhas) e o seu instrumento, `tools/server/selftest.mjs`, a correr
contra uma **raiz temporária** — o instrumento cria um mundo mínimo e as pastas que não se publicam,
mede, e apaga tudo. **34 de 34**, com as recusas medidas pelo caminho **cru** (um `fetch` normaliza
`..` antes de o enviar, e o que se quer medir é o pedido tal como chega). E duas coisas que a medição
obrigou, e que ficam registadas:

- **uma só leitura de imagens.** O `imageSize` da lei **L14** vivia dentro do `tools/scene/validate.mjs`
  e o servidor precisa dele para validar como a linha de comando. Passou a `tools/scene/disk.mjs`
  (`diskQuestions(root)`), importado pelos **dois** — 0 cópias, e o `validate.mjs` continuou a dar o
  mesmo relatório nos 5 mundos (**0** erros, os 6 avisos da L14 da D47 no mesmo sítio);
- **o servidor na exposição a sério**, medido à parte com a raiz verdadeira: `/`, `/cidade/`,
  `/editor.html`, `/js/app.js`, `/data/worlds/praia.json` e um retrato respondem **200** com o tipo
  certo, o `/.harness/dev/package.json` responde **403** e a marca `X-Zonas12-Serve` vem em todas.

#### O que o B3 entregou e mediu (2026-10-23)

O «Gravar» (`js/editor/server.js`, mais **6** chaves no `pt.json` e **11** linhas no `editor.html`) e a
primeira coisa que a medição mudou: a pergunta «há servidor?» era `GET /api/ping`, e um servidor
estático — o `python -m http.server` do README e o GitHub Pages — respondia-lhe **404**, que aparece na
consola como erro. Passou a ser um `HEAD` na raiz e o cabeçalho `X-Zonas12-Serve` (a emenda está na
**D49**), e o `/api/ping` deixou de existir: **uma** resposta para **uma** pergunta. O que se mediu, com
o browser instrumentado a contar `console.error`/`console.warn` **antes** da carga:

| # | O que se mediu | Com o servidor da ferramenta (`:8123`) | Com o `python -m http.server` (`:8124`) |
| --- | --- | --- | --- |
| 1 | O «Gravar» aparece? | **sim**, activo (`hidden=false`, `disabled=false`) | **não** (`hidden=true`), e o «Exportar» está lá |
| 2 | A consola da página | **0** mensagens | **0** mensagens |
| 3 | Editar a posição da câmara (x: 0 → 0,5) | marca «alterado» **visível**, 0 erros / 0 avisos / 0 por verificar | igual, sem gravar |
| 4 | «Gravar» | `Gravado data/worlds/example.json — cópia em .harness/backups/worlds/example/…`, marca **sai**, `isDirty` **false** | — |
| 5 | O ficheiro no disco | `git diff`: **uma** linha (`0` → `0.5`), o resto do mundo byte a byte (**M3**) | — |
| 6 | A cópia de segurança | tem o conteúdo **anterior** (a posição ainda `0`) — **M5** | — |
| 7 | Recarregar a exposição | a câmara do jogador fica em **x = 0,5** (`object3D.position`) | — |

Depois de medido, o fixture voltou ao que era (`git checkout`) e as cópias da medição foram apagadas:
a pasta `.harness/backups/` nasce na primeira gravação a sério.

**A emenda de 2026-10-24 (a aceitação do autor, à mão).** Nas três gravações que o autor fez no
browser, a **terceira não mudava nada** — o ficheiro ficou igual à sua própria cópia (6900 bytes) e
mesmo assim levou mais uma cópia de segurança: **4** cópias para **1** alteração. O botão passou a ser
como o «Desfazer» (D35), que só existe quando há um passo para desfazer: fica **desactivado** quando
o mundo em memória é o que já está no ficheiro (`!isDirty()`). Medido no browser: ao abrir
**inactivo**, depois de uma edição **activo**, depois de gravar **inactivo** outra vez. Custo aceite:
um ficheiro mudado por fora do editor mantém o botão desactivado até haver uma edição — que é a
mesma condição da marca «alterado», e não uma segunda regra a aprender.

#### Metas de sucesso

**(a) Comportamento — nenhum número pode mudar.** A bateria dos **doze** (§10) nas **5** páginas e a
do editor (**35** verificações) ficam com os valores da `v0.0.9`. O que se acrescenta não pode custar
nada ao que já existe.

**(b) Arquitetura — metas novas, todas mensuráveis.**

| # | Meta | Como se mede | Alvo |
| --- | --- | --- | --- |
| M1 | O servidor não publica o que não se publica | `GET /.harness/…`, `/../…` e `/.git/…` | **403** nos três |
| M2 | O servidor não escreve fora de `data/worlds/` | um slug com `..` ou com maiúsculas | **0** ficheiros escritos |
| M3 | Gravar não muda um byte do que não se editou | o texto que o editor exporta contra o ficheiro gravado | **0** diferenças |
| M4 | O servidor recusa o que o editor recusa | mundo com erro, `version: 2`, slug trocado | **3 de 3** recusas, **0** escrita |
| M5 | A cópia de segurança existe antes de gravar | duas gravações seguidas | **2** cópias, a primeira com o conteúdo **anterior** |
| M6 | O editor não regride sem servidor | `python -m http.server 8123` | botão **ausente**, export igual, **0** erros na consola |

#### Aceitação da fase

1. **Só pelo editor e pelo servidor:** abrir o fixture, mudar uma posição, «Gravar», recarregar a
   exposição — a alteração está lá.
2. **O ficheiro:** `node tools/scene/validate.mjs` com **0** e o `git diff` a mostrar **só** a linha
   editada (o texto gravado é o exportado, byte a byte).
3. **A cópia de segurança:** existe uma em `.harness/backups/worlds/<slug>/` com o conteúdo anterior.
4. **Sem servidor:** o editor faz o que fazia na Fase 4 — «Exportar» descarrega e o «Gravar» não
   existe —, com **0** erros na consola.
5. **O que não mudou:** a bateria dos doze nas 5 páginas (**35 de 35**) e a do editor.

#### Riscos da fase

| Risco | Gravidade | Mitigação |
| --- | --- | --- |
| O servidor ficar acessível na rede | Alta | escuta em `127.0.0.1`; `Host` e `Origin` conferidos; o `selftest` prova a recusa |
| Gravar por cima do mundo errado | Média | o slug do URL tem de bater com o `world.slug`, e o ficheiro tem de **já existir** (criar um mundo continua a ser da ferramenta, D31) |
| Perder trabalho com uma escrita a meio | Média | cópia de segurança antes e escrita atómica (`*.tmp` + `rename`) |
| O editor ganhar um caminho que só existe em casa | Média | o botão depende do `ping`; a bateria do editor corre sem servidor (M6) |
| Duas implementações do validador | Baixa | o servidor **importa** `js/scene/validation.js`: **0** cópias |

#### Fecho da fase (2026-10-23)

A aceitação correu item a item, no mesmo dia:

1. **Só pelo editor e pelo servidor** — o fixture aberto em `editor.html?world=example`, a posição da
   câmara mudada de `0` para `0,5`, «Gravar», a exposição recarregada: a câmara do jogador fica em
   **x = 0,5**. A linha de estado diz o ficheiro e a cópia, e a marca «alterado» sai.
2. **O ficheiro** — `node tools/scene/validate.mjs` a **0** e o `git diff` com **uma** linha
   (`0` → `0.5`): o texto gravado é o exportado, byte a byte (**M3**).
3. **A cópia de segurança** — em `.harness/backups/worlds/example/…` com o conteúdo anterior
   (a posição ainda a `0`), escrita antes do ficheiro (**M5**).
4. **Sem servidor** — o mesmo editor servido por `python -m http.server`: o «Gravar» **não aparece**,
   o «Exportar» fica igual e a consola da página tem **0** mensagens (**M6**).
5. **O que não mudou** — a bateria dos doze nas 5 páginas **35 de 35** (T8 a **0** em todas), as leis
   **21 de 21**, o `selftest` do servidor **34 de 34** e o validador a **0** nos 5 mundos.

Depois de medido, o fixture voltou ao que era (`git checkout`) e as cópias da medição foram apagadas.
**No telemóvel, a 2026-10-24**, na versão publicada: os **8** itens do aceite passaram — o portão, a
travessia entre as três salas sem preto, os retratos a casar com a chegada, o D-pad, o modal da obra,
o regresso pela porta e o desempenho. **Marco: a branch `v0.0.10`.**

### Fase 6 — Testes e limpeza
- **Entregável:** os testes de §10 automatizados (o mesmo script que já usamos no browser).
  **Parcialmente feito em 2026-10-15:** o T2 e o T3 (a moldura) estão automatizados em
  `tools/regression/pose-sweep.mjs`, com prova de que o instrumento falha quando deve (§10).
  **Em 2026-10-23, ao fechar a Fase 4, o que faltava deixou de faltar em grande parte:**
  `tools/regression/twelve-tests.mjs` corre nas **5 páginas** e verifica o **T8** (consola), o **T4**
  (a janela), o **T5** (a oclusão, com controlo positivo), o **T6** (o clique), o **T9** (20 ciclos),
  o **T10/T12** (o retrato) e o **T2/T3** (a moldura) — **35 de 35**. Ficam por automatizar o **T1**
  (a construção da cena a partir do dado) e o **T7/T11** (a chegada), que hoje se medem por
  `camera-arrival.mjs` para o caso da D37; o resto dos doze já não depende de uma sessão de trabalho.
- **Limpeza de skills — feita em 2026-10-13** (§3, D15). Apagados: o esqueleto Cline (88 pastas,
  0 ficheiros), as 3 falsas "junções" de descoberta e o `__pycache__`. Mantidos de propósito: os
  **5 repos `.git`** dos vendors (**funcionais** — o `sync-all-vendors.ps1` faz `git pull`
  neles), o `frontend-slides/plugins/` (conteúdo do clone) e o `skills/doc.md` (guia do kit).
  Índice verificado nas **três passes** (ver `🔧 Manutenção`, no próprio índice).
  O que restava decidir sobre `.agent/garbage/` foi **fechado em 2026-10-14 pela D18** (§11):
  **mantém-se como referência** — não se adapta nem se apaga.
- **Verificação:** um comando único verde na `main` — desde 2026-10-24,
  `node tools/regression/all.mjs`.

#### O que existe hoje (medido em 2026-10-24, antes de mexer)

O ponto de partida não é uma estimativa: é o que cada instrumento deu na `main` da `v0.0.10`,
com a árvore limpa e o Chrome a arrancar do zero.

| Teste | Instrumento | Como corre | Estado a 2026-10-24 |
| --- | --- | --- | --- |
| T1 (travessias) | `walkDoor()` em `acceptance.mjs` | na página, chamado pela sessão | **sonda pronta, runner não**: as 12 portas medem-se só à mão |
| T7/T11 (chegada) | `checkArrival()` em `acceptance.mjs` | na página, com `?from=` | **sonda pronta, runner não** |
| T2/T3 (moldura) | `pose-sweep.mjs`, chamado pela bateria | na página | **84 poses, 0 cortadas, 0 falhas em 23 098 amostras** por página |
| T4, T5, T6, T9, T10/T12, T8 | `twelve-tests.mjs` + `acceptance.mjs` | linha de comando, 5 páginas | **35 de 35** |
| As leis | `validate.mjs`, `laws-selftest.mjs` | linha de comando | **0** nos 5 mundos; **21 de 21** avarias |

Os números de hoje, para a fase se comparar com eles: `validate` sai com **0** (5 mundos, 12 portas,
grafo e L19 completos; **6** avisos L14 do D47); `laws-selftest` **21 de 21** com o controlo limpo;
`twelve-tests` **35 de 35** (T5 com **1 909** px de controlo e **0** dentro; T9 de **2→2** a **4→4**
portas; T10/T12 com **0** px fora da moldura, mais **16** px de fio de bordo tolerados no fixture a
12 m; T2/T3 com **84** poses e **0** falhas em **23 098** amostras).

Duas pendências da §14 vivem dentro destes instrumentos e são desta fase: a **R16** (a medida do
T10/T12 já sangrou 3 759 px e 16 px, e ainda se tolera 0,1% da moldura) e a **R17** (a primeira
porta de uma sessão fria conta **5–6** fotogramas escuros no `seam.mjs`). Uma terceira nota está
escrita em §7 e §9: a varredura de poses **reporta como falha** o que é uma câmara a mexer-se — devia
recusar o resultado.

#### As decisões do autor (2026-10-24)

1. **O comando único é `node tools/regression/all.mjs`** — vive ao lado das outras baterias e não
   numa pasta nova (`testes/`), que seria o único sítio do projeto fora de `tools/`.
2. **Por omissão corre o que decide a fase:** o validador, as leis e os arranques (node, segundos),
   a bateria dos doze e as travessias/chegada. As baterias arquivadas da Fase 4/5 abrem um Chrome
   cada uma e ficam atrás de `--full`.
3. **Três pendências entram nesta fase**, porque são todas do instrumento: **R16** (o retrato
   determinístico), **R17** (a ponte espera pela descodificação da imagem) e a **recusa** da
   varredura de poses quando a câmara se mexe. A **R14/R15** (fundos shader) continuam ensaio e não
   são desta fase.

#### Blocos de execução

| Bloco | O que entrega | O que fecha |
| --- | --- | --- |
| **B0** | Este plano, com a linha de base medida antes de mexer | — |
| **B1** | `tools/regression/traversal-tests.mjs`: as **12** portas dos 5 mundos atravessadas a passo de 0,1 m; as que navegam contam **uma** navegação e chegam ao mundo do `action.target`, as de janela contam **uma** mudança de dimensão e **zero** navegações | O **T1** deixa de precisar de sessão |
| **B2** | No mesmo runner, o **T7/T11** de cada página com `?from=`: a câmara no ponto que o `arrivalPoint` calcula, **0** travessias a andar para dentro e **1** a meia volta | O **T7/T11** deixa de precisar de sessão |
| **B3** | `js/arrival-frame.js`: a ponte só se dá por posta depois de `img.decode()`, com teto de tempo; o `hide()` espera por ela em vez de a tirar antes de pintada | **R17** |
| **B4** | `acceptance.mjs`: o T10/T12 espera que as texturas da cena estejam descodificadas (e um fotograma desenhado com elas) antes das duas capturas | **R16** |
| **B5** | `pose-sweep.mjs`: se a câmara sair do sítio durante a varredura, o veredicto é **`refused`** e não `fail` — o resultado é recusado, não atribuído à cena | A nota de §7/§9 |
| **B6** | `tools/regression/all.mjs`: um comando, um veredicto; `--full` acrescenta as baterias arquivadas | A verificação da fase |
| **B7** | README (como correr) e o fecho da fase com os números medidos | — |

#### Metas de sucesso

| # | Meta | Como se mede | Alvo |
| --- | --- | --- | --- |
| M1 | O T1 corre sem sessão de trabalho | `node tools/regression/all.mjs` | **12 de 12** portas, uma travessia cada, destino certo |
| M2 | O T7/T11 corre sem sessão de trabalho | idem | **4** páginas com `?from=`: no sítio calculado, **0** a andar para dentro, **1** a meia volta |
| M3 | A ponte espera pela imagem | `seam.mjs` numa sessão fria, as 6 portas | a **primeira** porta também a **0** escuros |
| M4 | O retrato não sangra | `twelve-tests.mjs`, 4 corridas seguidas | **0** px fora da moldura em todas (sem tolerância) |
| M5 | A varredura recusa a câmara a mexer | avaria injectada que move a câmara | veredicto **`refused`**, com o motivo, e não `fail` |
| M6 | Um comando, um veredicto | `node tools/regression/all.mjs` | sai com **0** quando tudo passa e com **1** quando uma bateria falha |

**Emenda (2026-10-24):** a **M2** fala de **4 páginas**; as chegadas que existem são **8** — cada
porta que navega para um mundo onde há porta de chegada da origem (L19), o que dá *cidade* duas
vezes, *praia* três, *portão* duas e *céu* uma. O runner enumera-as a partir do dado.

#### Aceitação da fase

1. **Do zero:** `node tools/regression/all.mjs` verde na `main`, com o Chrome fechado e a cache
   desligada — é o comando que a §9 prometia.
2. **Os doze testes continuam com os números da `v0.0.10`:** os **35 de 35** das cinco páginas mais
   o **T1** e o **T7/T11**, agora medidos pela mesma bateria.
3. **A ponte:** as **6** portas numa só sessão, com a primeira a **0** escuros — o número que a R17
   deixou em aberto.
4. **O retrato:** `0` px fora da moldura em todas as medições, sem o fio de bordo tolerado.
5. **A varredura:** com a câmara a mexer-se, `refused`; parada, os mesmos **84** poses e **0** falhas.

#### Riscos da fase

| Risco | Gravidade | Mitigação |
| --- | --- | --- |
| A ponte a esperar pela imagem atrasar a travessia | Média | teto de tempo no `decode()`; a costura e os fotogramas escuros medem-se antes e depois |
| Esperar pelas texturas tornar a bateria mais lenta | Baixa | `decode()` de uma imagem já descodificada resolve no mesmo tick; a duração é medida |
| O T1 a navegar deixar o browser num estado estranho | Média | cada porta medida numa página nova; o registo da travessia fica no `sessionStorage`, que a navegação preserva |
| Duas cópias do mesmo instrumento | Baixa | o T1/T7 reutiliza as sondas `walkDoor`/`checkArrival` de `acceptance.mjs`: **0** cópias |

#### O que cada bloco entregou e mediu (2026-10-24)

**B1 e B2 — o T1 e o T7/T11 numa bateria.** O `tools/regression/traversal-tests.mjs` abre cada
mundo, **põe a cena na dimensão da porta** (`ownedBy`), atravessa-a a passo de 0,1 m e lê o registo
que a página que sai deixou no `sessionStorage`. A ordem não é decorativa: a porta 2 do fixture vive
na dimensão 1, e sem a troca o runner diria «0 travessias» de uma porta que não estava na cena
(medido — foi o único vermelho da primeira corrida, 19 de 20). Resultado: **12 de 12** portas —
**10** navegam **uma** vez e chegam ao `action.target` com `?from=<origem>`, **2** mudam a dimensão
**uma** vez e navegam **zero** — e **8 de 8** chegadas exactamente no ponto que o `arrivalPoint`
calcula, com **0** travessias a andar para dentro e **1** a meia volta. **20 de 20** verificações em
**87 s**.

**B3 — R17.** A ponte passou a pedir a descodificação da imagem (`img.decode()`, teto de **1,5 s**) e
o `hide()` espera por ela — o quadro nunca sai antes de poder ter sido visto, e continua a sair num
corte (D44). **Não se reproduziu nesta máquina:** as **6** portas numa só sessão fria deram **0**
fotogramas escuros **antes** e **depois** da mudança, com a mesma costura (0,31 / 0,32 / 0,30 / 0,41
/ 0,17 / 0,39) e **12 de 12** verificações. O número continua a ser medido pelo `seam.mjs`.

**B4 — R16.** A causa não era só a que a pendência supunha, e o instrumento passou a dizer **onde**
mudou (`caixaForaDaMoldura`). Três correções, cada uma com a sua prova:

1. as duas capturas esperam pelas **imagens descodificadas** (`img.decode()`, teto de 3 s) — uma
   textura a assentar muda o ecrã inteiro;
2. o rectângulo da moldura ganhou **2 px para fora** — a aresta antialiased das barras dava **1 a
   22 px**, sempre na linha do bordo (a regra do T5);
3. a medição **pára os vídeos** enquanto compara — o que restava era a **obra em vídeo** do fixture
   e da cidade: a caixa dos pixels mudados (`[179,326,190,352]`) tem a **mesma cor** com a dimensão
   derivada escondida, ou seja, não era o retrato.

Medido depois, em corridas repetidas: **0 px** fora da moldura nas 5 páginas, e o `twelve-tests`
voltou a exigir **exactamente zero** (o limite de 0,1% saiu do runner).

**B5 — a varredura recusa a câmara a mexer.** Se a câmara sai do sítio (mais de **1 mm**), o
veredicto é **`refused`** — `T2` e `T3` ficam `refused`, não `fail` —, com o motivo e a pose. A
terceira avaria injectada, `fault: 'camera'` (o D-pad preso, 0,1 m por pose), dá **`refused` na
primeira pose** e deixa câmara e rig repostos; a mesma página, com a câmara parada, dá os mesmos
**84** poses, **0** cortadas, **0** falhas em **23 098** amostras e **420** controlos a **0**.

**B6 — o comando único.** `node tools/regression/all.mjs` corre o validador, as leis, os doze e as
portas/chegada e devolve **0** ou **1**: **4 de 4** em **119,3 s**. Com `--full`, as sete baterias
arquivadas juntam-se e dão **11 de 11** em **551,4 s** (a costura 97,7 s, a chegada 45,5, a ponte
59,6, os rótulos 48,6 e 49,3, o botão 46,2, a transição 86,3). Cada bateria tem um teto de **25
minutos**: um Chrome que não fecha falha a bateria em vez de travar a verificação.

**B7 — a documentação.** O README ganhou o comando único (§ «Como Usar», passo 3) e a varredura
passou a documentar as **três** avarias; a §10 ficou com os cinco instrumentos; a §14 fechou a
**R16** e a **R17**.

#### Fecho da fase (2026-10-24)

1. **Do zero** — `node tools/regression/all.mjs` verde: **4 de 4** baterias, **119,3 s**; com
   `--full`, **11 de 11** e **551,4 s**.
2. **Os doze testes** — os **35 de 35** das cinco páginas continuam, e o **T1** (**12 de 12**) e o
   **T7/T11** (**8 de 8**) passaram a ser medidos pela mesma verificação, **20 de 20**.
3. **A ponte** — as **6** portas numa só sessão a **0** escuros, antes e depois da mudança do R17.
4. **O retrato** — **0** px fora da moldura nas 5 páginas, com o `twelve-tests` a exigir zero.
5. **A varredura** — `refused` com a câmara a mexer; **84** poses e **0** falhas com ela parada.

O `validate.mjs` sai com **0** (5 mundos, 12 portas, grafo e L19 completos) e as leis dão **21 de
21**, com o controlo limpo.

**No telemóvel, a 2026-10-24, na versão publicada o autor deu a fase como aceite e validada.** Fica
fechada dos dois lados: o que os instrumentos medem e o que quem usa vê. **Marco: a branch
`v0.0.11`** (publicada no `origin` com o `main`).

---

### Fase 7 — O que os documentos prometem e o código não faz (fechada, 2026-10-25)

- **Entregável:** fechar o **inventário de 2026-10-24** — as sete coisas que o README e este
  roadmap documentam (ou pedem em §1 e §7) e que o código não constrói, mais as três afirmações que
  a documentação deixou para trás. A fase existe porque o autor pediu para **implementar o ensaio
  dos fundos shader**, e com ele tudo o que ficou sem fase: os quatro valores que o esquema valida e
  a cena ignora (**R9**/**D30**), a exclusão em lote do editor (§7), o `i18n/en.json`, o catálogo de
  assets no editor e os portais animados (§1).
- **O que não muda:** a produção continua a declarar `kind: "image"`. O **R14**/**R15** continua a
  ser ensaio até o **B9** fechar com o A/B nos três aparelhos; nenhum mundo em `data/worlds/` troca
  de fundo nesta fase sem esse número.
- **Verificação:** `node tools/regression/all.mjs` continua verde com os números da Fase 6
  (**4 de 4**, **119,3 s**; os doze **35 de 35**, as portas **12 de 12**, as chegadas **8 de 8**,
  as leis **21 de 21**, `validate` **0**), e cada bloco mede o seu próprio número, como nas fases
  anteriores.

#### O que existe hoje (medido em 2026-10-24, antes de mexer)

| Item | Medido onde | Estado a 2026-10-24 |
| --- | --- | --- |
| Fundos shader (**R14**/**R15**) | §14; `data/worlds/*.json`; `teste/engine.js` | **0** dimensões `kind: "shader"` nos **5** mundos; o ensaio corre em `teste/` com `fps = 30` e **não** tem a escada de cadência |
| Obra `kind: "model"` / `"text"`, dimensão `kind: "color"`, `interaction: "link"` | `js/scene/schema.js` (39–41); `js/scene/validation.js` | **0** de **17** obras e **0** de **8** dimensões usam esses valores; o validador dá **3** avisos para os **4** valores e o editor não os oferece (**D30**) |
| Exclusão em lote por dimensão | §7 contra `js/editor/` | **0** operações em lote: os **5** painéis (mundo, dimensão, obra, portal, câmara) só excluem **individualmente** |
| `i18n/en.json` | `i18n/` | só `pt.json`, com **160** chaves em `strings`; `?lang=en` cai no português com **1** aviso |
| Catálogo de assets no editor | §7; `js/editor/assets.js` | nenhum painel de assets; o `assets.js` (**3 846 B**) só **confere** se o ficheiro existe e mede a imagem |
| Portais animados | §1 | o dado do portal não tem campo de animação (`box`, `boxPosition`, `boxRotation`, `trigger`, `frame`, `ownedBy`, `window`, `action`, `arrivalFrom`) |
| Documentação desactualizada | README | **3** afirmações falsas na auditoria: «o editor não grava», «o T8 precisa de sonda fora do repositório» e «vídeo 360º como fundo é melhoria». A do **T8** já foi corrigida no **B7** da Fase 6; as outras **duas** no **B1** desta fase, que veio com o plano |

#### As decisões do autor (2026-10-24)

1. **Uma fase só, com os sete itens**, desde que cada um seja um **bloco com o seu número** — a fase
   não junta assuntos no mesmo bloco: o critério continua a ser «um bloco, uma medida».
2. **A D30 é emendada:** os quatro valores que hoje só **avisam** (`model` e `text` de obra, `color`
   de dimensão, `link` a navegar) passam a ser **construídos**. É o que a própria D30 escreveu —
   «implementar geometria de modelo, texto 3D e `link` a navegar é uma fase própria» — e a fase é
   esta.
3. **A §1 é emendada:** «portais em movimento animado (fica para depois)» sai do «fora do escopo» e
   passa a dado da cena.
4. **O editor cresce as duas coisas que §7 pediu e não teve:** a exclusão **em lote por dimensão**
   (a nota do B6 da Fase 4) e o **catálogo de assets** editável (a limitação registada no README).
5. **O `en.json` é tradução integral** das **160** chaves de `pt.json` — sem chaves novas e sem
   tocar no `pt.json`; um teste compara as chaves dos dois ficheiros.
6. **Os fundos shader são o último bloco (B9) e entram atrás de feature flag.** A produção só troca
   `kind: "image"` por `kind: "shader"` se o A/B dos três aparelhos fechar o **R14**; sem esse
   número, o B9 entrega o ensaio e a política **atrás da flag** e o **R14**/**R15** ficam abertos,
   em vez de dados por fechados.
7. Quando a fase fechar, estas decisões entram na §11/§13 numeradas a partir de **D52** — a última
   registada é a **D51**.

#### Blocos de execução

| Bloco | O que entrega | O que fecha |
| --- | --- | --- |
| **B1** | As **duas** afirmações falsas que restavam no README — «o editor não grava» e «vídeo 360º como fundo é melhoria» — corrigidas, e «Melhorias Planejadas» a apontar para esta fase em vez de prometer o que já existe. **Feito com o plano (2026-10-24)** | a documentação desactualizada |
| **B2** | `i18n/en.json` com as chaves de `pt.json` — **164** no dia do plano, **203** no fecho, porque cada bloco seguinte acrescentou as suas; `?lang=en` deixa de cair no português. **Feito em 2026-10-25** — o `tools/regression/i18n.mjs` compara chaves, marcadores e frases, e abre a exposição e o editor em inglês (**9 de 9**) | a lacuna do catálogo |
| **B3** | Editor: **exclusão em lote por dimensão**, com confirmação e **um** instantâneo de desfazer. **Feito em 2026-10-25** — um comando apaga as N obras da dimensão, a pergunta diz quantas são, e o «Desfazer» devolve-as todas juntas (`lote.mjs`, **8 de 8**) | a nota «não entrou» do B6 da Fase 4 |
| **B4** | Editor: **catálogo de assets** editável (`id`, `path`, `type`, `alt` por língua), com a **L9** e a **L14** a medir cada alteração. **Feito em 2026-10-25** — o painel dos assets vem logo depois do mundo (o catálogo é parte do mundo), o `id` só se pergunta na inserção, e apagar um asset em uso é recusado com a contagem (`assets.mjs`, **10 de 10**) | «o editor não cria assets» |
| **B5** | Dimensão `kind: "color"`: fundo plano no renderer, oferecido pelo painel da dimensão. **Feito em 2026-10-25** — a esfera do fundo leva um `MeshBasicMaterial` com a cor do dado, o painel ganha o tipo e o campo da cor, e a lei L1 passa a exigir raio como nos outros fundos | o aviso «no flat background» |
| **B6** | `interaction: "link"` a **navegar** para o endereço, em vez de o mostrar no modal. **Feito em 2026-10-25** — o componente do clique ganhou o modo, o painel oferece a interacção e o campo do endereço | a terceira coisa do **R9** |
| **B7** | Obra `kind: "model"` (GLTF) e `kind: "text"` (texto 3D), com posição/rotação/tamanho como as outras. **Feito em 2026-10-25** — o GLTF vem do catálogo (tipo `model`, `<a-asset-item>`) e o `size` escala-o; o texto é desenhado num canvas e vai para um plano, sem fonte externa | as duas primeiras coisas do **R9** |
| **B8** | Portais com **movimento e rotação animados**, declarados no dado. **Feito em 2026-10-25** — `spin` (roda sobre um eixo) e `orbit` (dá a volta a um círculo e vira-se com ele), com o período em segundos; a colisão continua a ser lida do mundo, por isso a travessia acontece onde a porta **está**; o `prefers-reduced-motion` do visitante pára-as, e uma porta em movimento não pode ser a porta de chegada (`motion.mjs`, **6 de 6**; T4/T9 nas 5 páginas + `example` com uma porta a rodar: **255/0** e **20** ciclos) | o «fica para depois» da §1 |
| **B9** | Fundos shader: o A/B controlado fecha o **R14**; a política **20 → 15 FPS → estático** atrás de flag fecha o **R15**; `kind: "shader"` no esquema com `shaderId` de lista interna, `fallbackAsset` validado e piso de pixelRatio **1** | **R14** e **R15** |
| **B10** | README, §14 e o fecho com o que cada bloco mediu. **Feito em 2026-10-25** — o quadro do fecho está abaixo, com as oito metas e o número de cada uma | a verificação da fase |

**Estado a 2026-10-25 — os dez blocos estão feitos.** O **B9 passou a produção** por decisão do
autor: as três salas correm shader (`scene1` → `grade-neon`, `scene2` → `por-do-sol`, `scene3` →
`nuvens`), com o panorama como `fallbackAsset` e `?shader=0` como escape, o `kind: "shader"` no
esquema com `shaderId` de lista interna, a política `20 → 15 FPS → estático` (piso de pixelRatio
**1**), o fixture `?scene=shader`, o instrumento `tools/regression/shader.mjs` e o
**validador/instalador** `tools/shader/` (compila, mede e recusa abaixo de **19 de 20**
atualizações/s). O **A/B nos três aparelhos não foi registado**, logo **R14/R15 continuam abertos** —
a decisão de produção está tomada com o teste do autor (telemóvel fraco e desktop), e não se declara
fechado o que não foi medido. O que cada bloco mediu está no quadro do fecho, mais abaixo.

O **B2** fechou em 2026-10-25: `i18n/en.json` tem as chaves de `pt.json`, pela mesma ordem, e
`tools/regression/i18n.mjs` (**9 de 9**) prova quatro coisas — as chaves são as mesmas, nenhuma
tradução está vazia, os marcadores `{nome}` batem certo nas duas línguas e as frases traduzidas não
ficaram iguais às portuguesas — e abre a exposição e o editor com `?lang=en` para confirmar a língua
da página e a ausência de avisos do catálogo. A bateria corre **por omissão** no `all.mjs`: uma chave
nova que entre só no `pt.json` é uma frase portuguesa a aparecer a quem abrir em inglês. O rótulo
`editor.dimension.kind.shader` perdeu o «(ensaio)» que já não era verdade desde a produção do B9.

O **B3** e o **B4** fecharam também em 2026-10-25. O lote por dimensão sai como **uma** alteração
(o `change` guarda o texto de antes uma só vez), a pergunta diz quantas obras vão sair, e o «Desfazer»
devolve-as todas — medido no fixture `example`, que tem 5 obras na dimensão 0 e 2 na 1, para que
«apagar esta dimensão» não se confunda com «apagar todas». O catálogo de assets ganhou um painel
próprio: `id` (só na inserção), `path`, `type` (imagem, vídeo, modelo) e `alt` por língua; apagar um
asset que o dado ainda nomeia é recusado com a contagem de usos, e cada alteração faz o validador
voltar a perguntar pelo ficheiro — é assim que a L9 aparece ao escrever um caminho que não existe e
desaparece ao corrigi-lo. Ficou também uma chave que faltava desde a Fase 4 (`editor.artwork.asset`) e
um `portalDebug.data()` no editor: o `state` do núcleo tem o que está construído, e um instrumento que
mede o editor precisa do dado.

O **B5**, o **B6** e o **B7** fecharam em 2026-10-25, com um fixture para os quatro valores (**D56**,
**D57**, **D58**): `data/worlds/r9.json` (abre-se com `?scene=r9`, não é uma sala) tem uma dimensão
`kind: "color"`, uma obra `image`, uma `model` (GLTF de 8 vértices em `assets/models/caixa-r9.gltf`,
com o buffer embutido), uma `text` e uma com `interaction: "link"`. O `tools/regression/r9.mjs`
(**6 de 6**) mede a cena construída — a esfera do fundo com a cor do dado, a malha do GLTF com 8
vértices, o plano do texto com textura de 1239 px, e o clique que **sai** da página — e o
`tools/regression/editor-r9.mjs` (**8 de 8**) mede os painéis: os quatro tipos, as três interacções, o
campo da cor, o endereço só com `link`, o texto só na obra de texto, e **nenhum rótulo é uma chave
crua** (o `editor.artwork.asset` era — faltava no catálogo desde a Fase 4, e ninguém o via porque o
painel das obras só se desenha quando há obras). O `laws-selftest` passou de **21** para **22** avarias
(a D30 deu lugar às leis de cada valor) e o `all.mjs` passou a **19** baterias com `--full`.

O **B8** fechou no mesmo dia: uma porta pode andar (**D59**), com dois tipos declarados no dado
(`spin` e `orbit`), e o movimento respeita o `prefers-reduced-motion` do visitante. A cena que os doze
testes percorrem (`example`) passou a ter uma porta a rodar, e os números da Fase 6 mantiveram-se —
T4 **255/0** fora da moldura e T9 **20** ciclos, nas 5 páginas mais o fixture. Falta o **B10**.

#### Fecho: o que cada bloco mediu (2026-10-25)

| Meta | Como se mediu | Medido |
| --- | --- | --- |
| **M1** nenhuma afirmação falsa no README | leitura das três frases da auditoria | **0** — as duas que restavam caíram no **B1** |
| **M2** as duas línguas dizem o mesmo | `tools/regression/i18n.mjs`, chaves e `?lang=en` | **203 de 203** chaves nas duas, **0** avisos, **9 de 9** verificações |
| **M3** o lote é uma operação | `tools/regression/lote.mjs` no fixture `example` | **1** comando, **1** instantâneo (5 obras de uma vez, as 2 da outra dimensão intactas), **8 de 8** |
| **M4** o catálogo é editável | `tools/regression/assets.mjs` | criar, alterar e remover; a **L9** aparece e desaparece com o caminho; **0** erros de consola; **10 de 10** |
| **M5** os quatro valores do R9 são construídos | `r9.mjs` (a cena) e `editor-r9.mjs` (os painéis), mais `laws-selftest` | fundo `color` com a cor do dado, malha do GLTF com **8** vértices, plano de texto com textura de **1239 px**, o clique a **sair** da página — **6 de 6** e **8 de 8**; avisos do R9 a **0** |
| **M6** os portais animam por dado | T4 e T9 nas 5 páginas com a porta a rodar do `example` | T4 **255/0** (nada fora da moldura), T9 **20** ciclos, portas e nós a voltar ao que eram |
| **M7** o shader não passa de 20 FPS | `shader.mjs` e a sonda de campo | cadência **20/s** com p95 sob a meta; política 20 → 15 → estático medida; **falta o terceiro aparelho** do R14 |
| **M8** a verificação não regride | `node tools/regression/all.mjs --full` | **19 de 19** baterias, **718,9 s**; doze **35/35**, portas **6/6**, costura **12/12**, leis **22/22**, `validate` **0** |

**O que fica aberto, e porquê:** o **R14**/**R15** continuam abertos. A produção do shader foi
decidida com o teste do autor (telemóvel fraco e desktop), mas o A/B controlado pede **três**
aparelhos e o terceiro não estava na mesa — não se declara medido o que não foi medido. O plano da fase
previu-o: «se o A/B não passar, a fase fecha sem produção de shader e o R14/R15 ficam abertos com o
número que faltou». Aqui a produção ficou (por decisão do autor, com o par `shader × imagem` medido em
dois), e o que falta é o terceiro número.


#### Metas de sucesso

| # | Meta | Como se mede | Alvo |
| --- | --- | --- | --- |
| M1 | Nenhuma afirmação falsa no README | `grep` das três frases substituídas | **0** ocorrências |
| M2 | As duas línguas dizem o mesmo | chaves de `pt.json` contra `en.json`, e `?lang=en` | **203 de 203** chaves, **0** avisos |
| M3 | O lote é uma operação | editor: excluir as **4** obras de uma dimensão | **1** comando, **1** instantâneo, `validate` **0** |
| M4 | O catálogo é editável | editor: criar, alterar e remover um asset | os seletores acompanham; **0** erros de consola; **L9**/**L14** a avisar quando o ficheiro falta |
| M5 | Os quatro valores do R9 são construídos | `laws-selftest` e um fixture com os quatro | avisos do R9 a **0**; o fixture constrói o que o nome promete |
| M6 | Os portais animam por dado | T9 (**20** ciclos) e T4 nas 5 páginas | os números da Fase 6 mantêm-se: T4 **255/0**, T9 **20** ciclos |
| M7 | O shader não passa de 20 FPS | os **3** aparelhos do **R14** | **≤ 20** atualizações/s; **15** FPS só sob degradação persistente; estático ao fim |
| M8 | A verificação não regride | `node tools/regression/all.mjs` | **19 de 19** com `--full`, **35 de 35**, **12 de 12**, **22 de 22**, `validate` **0** |

#### Aceitação da fase

1. **A linha de base intacta:** `node tools/regression/all.mjs` verde, com os números da Fase 6
   (**4 de 4**; **35** verificações nos doze, **20** nas portas/chegadas, **21** nas leis).
2. **As duas línguas:** **203 de 203** chaves e nenhum aviso em `?lang=en`.
3. **O que o esquema promete é construído:** um fixture com uma obra `model`, uma obra `text`, uma
   dimensão `color` e um `link` a navegar — medido no browser, não no validador.
4. **O editor:** o lote por dimensão e o catálogo de assets medidos no painel, com **0** erros de
   consola e a L9/L14 a reagirem ao ficheiro que falta.
5. **Os portais animados:** T4, T9 e T2/T3 com os números da Fase 6.
6. **O shader:** o A/B nos **3** aparelhos guardado (JSONs), a cadência **≤ 20 FPS**, e a queda para
   **15 FPS** e para estático só sob degradação persistente. Se o A/B não passar, a fase fecha
   **sem** produção de shader e o **R14**/**R15** ficam abertos com o número que faltou — não se
   declara aceite o que não foi medido.

#### Riscos da fase

| Risco | Gravidade | Mitigação |
| --- | --- | --- |
| Sete assuntos numa fase perderem o critério único | Média | um bloco, uma medida; a aceitação é a de cada bloco mais o `all.mjs` |
| O `model`/`text` não terem arte nem caso de uso (foi o motivo da D30) | Alta | um fixture mínimo por valor, fora de `data/worlds/`; o editor só oferece o que a cena constrói |
| O shader depender de três aparelhos que não estão na mesa | Alta | o B9 entrega o ensaio e a flag; a produção fica bloqueada e registada no **R14** |
| A animação de portais mexer na ordem de desenho (**L6**) | Média | o `renderOrder` não muda: T2/T3 e T9 em cada bloco |
| O `en.json` divergir do `pt.json` | Baixa | um teste compara as chaves; a tradução não acrescenta nem remove nenhuma |
| O catálogo de assets abrir a porta a caminhos fora do sítio | Média | validar `path` contra a raiz do projeto e os tipos de `ASSET_KINDS`; a L9 continua a recusar o que falta |

### Fase 8 — A ficha da obra (2026-10-25)

- **Entregável:** cada obra passa a ter uma **página própria** — a ficha, no modelo do
  `galerias/obra7.html` das Zonas 11 (nome da exposição, «voltar», o meio da obra, título, autor,
  sinopse). Decidido com o autor em 2026-10-25 (**D60**).
- **O que não muda:** a obra continua a ser dado do mundo e nada é escrito à mão por obra; a
  exposição continua estática e sem build (**D1**); a ficha é gerada, e a Lei **L20** impede que ela
  envelheça em silêncio.
- **As decisões do autor:** **um HTML por obra**, gerado pela ferramenta (como as Zonas 11); o clique
  **substitui a página** (a ficha abre no mesmo separador e o «voltar» traz a sala); e o `site` de uma
  obra é **tentado em iframe**, com a imagem da obra como reserva.

| Bloco | O que entrega | O que fecha |
| --- | --- | --- |
| **C1** | O dado: `author`, `synopsis` e `site` por obra (texto por língua os dois primeiros), o tipo `site` no catálogo e em `CONTENT_KINDS`, e a interacção `page` | o que a ficha precisa de saber |
| **C2** | `tools/artwork/build.mjs`: escreve `<slug>/obras/<id>.html` por obra, com o meio por tipo, as duas línguas e o «voltar»; `css/obra.css` | a página que não existe |
| **C3** | O clique na sala: `interaction: "page"` navega para a ficha; as salas de produção passam a usá-la; o T6 passa a medir o endereço da ficha | a ligação sala ↔ ficha |
| **C4** | A lei **L20**: a ficha existe e o resumo com que foi gerada é o do dado de agora | a ficha velha |
| **C5** | `tools/regression/obra.mjs`: os cinco tipos, as três camadas do site, a língua, o «voltar» e a consola | a verificação |
| **C6** | Editor: `author`, `synopsis`, `site` no painel da obra e um botão «abrir a ficha» | o preenchimento |
| **C7** | README, §14 e o fecho | a documentação |

**Metas:** **N1** cada obra tem ficha e ela está em dia (L20 a **0** avarias); **N2** os cinco tipos
mostram o meio que prometem; **N3** o «voltar» cai no mundo da obra; **N4** `?lang=en` diz o mesmo em
inglês; **N5** o `all.mjs --full` continua verde.

**Fecho (2026-10-25):** todos os blocos entregues, e medido: **21** fichas geradas para os **6**
mundos (as do `gate` não existem porque o portão não tem obras), `obra.mjs` **46 de 46**, L20 a
recusar uma ficha velha em `--check`, `validate` a **0** e `all.mjs --full` a **20 de 20** em
**720,7 s**. A ficha do `scene1` mostra o título que existe (o `title` do dado ou, sem ele, o id do
asset): as obras de produção ainda não têm `author`/`synopsis`, e a bateria di-lo em nota em vez de
inventar — é o editor que as preenche (C6).

**A segunda passagem (2026-10-25, a **D61**):** depois de ver as fichas no ecrã, o autor pediu a
identidade das Zonas 11 («a página de obras será com esta») e aí o C2 foi refeito: `css/obra.css`
passou a ser o `obra-template.css` adaptado e o gerador ganhou a tabela das plataformas, as linhas
(`.linha`) e o botão do site. Medido de novo: `obra.mjs` **32 → 46** (a tabela das plataformas
medida sem browser, o meio por `data-meio`, o «voltar» no cimo **e** no fundo, a plataforma escrita na
linha do site), `validate` a **0** e `all.mjs --full` a **20 de 20**. Duas correcções que a medição
obrigou: a classe do cartão repetia a do texto (a sinopse ficava com `text-indent` a dobrar) e o
`.botao-voltar` sendo um `<a>` não centrava o texto como o `<button>` das Zonas 11.

**A terceira passagem (2026-10-25, a **D62**):** o autor pediu «somente 1 arquivo que ao carregar ele
muda o conteúdo» e o dado das obras numa folha de cálculo com o endereço da obra e a capa. O C2 foi
substituído: as **21** fichas geradas e o `tools/artwork/build.mjs` saíram, e entrou `obra.html` com
`js/obra.js`, lendo `?mundo=&id=&lang=`. O que fecha os blocos que ficam:

| Bloco | O que entrega | O que fecha |
| --- | --- | --- |
| **C8** | `obra.html` + `js/obra.js`: uma página que se desenha do mundo, e as 21 fichas antigas apagadas | a ficha como um ficheiro só |
| **C9** | `js/scene/platform-embed.js` (a tabela das plataformas fora do gerador) e `js/scene/analytics.js` (a medição) | uma só forma de embutir e de medir |
| **C10** | `data/obras.csv` + `tools/artwork/from-csv.mjs` (`--check`, valida antes de escrever) | o preenchimento do dado |
| **C11** | Lei **L20** refeita (página única, e a pasta `obras/` proibida) e **L21** (o formato do ID da GA), o campo no painel do mundo e as chaves novas nas duas línguas | a lei e o editor |

**Fecho da terceira passagem, medido:** `obra.mjs` **59 de 59** (a tabela das plataformas, o endereço
e a leitura do endereço, o `page_view` com e sem ID, o script injetado, o meio **pedido** e o
**desenhado**, o «voltar» no cimo e no fundo, a obra que não existe, a consola), `validate` a **0**,
`i18n` a **9 de 9** com **214** chaves por língua, o T6 a apontar para `obra.html?mundo=…&id=…` e o
`all.mjs --full` a **20 de 20** em **731,7 s**. O `from-csv` correu duas vezes seguidas sobre o CSV por
preencher sem escrever nada (é idempotente) e, com o exemplo preenchido, escreveu título, autor,
sinopse e site, transformou uma obra num `site` e voltou atrás com o CSV em branco.

**O exemplo antes do definitivo (`data/obras.exemplo.csv`, `--file`, e o mundo `exemplo-ficha`):** o
autor pediu para ver o formato e a página antes de escrever o texto a sério. Há um CSV de exemplo e um
**mundo de exemplo publicado** (`exemplo-ficha`, um fixture como o `r9`, com quatro obras: uma
completa, uma só com título, uma em vídeo e uma com site) — as duas coisas com o mesmo texto, e
nenhuma delas toca no dado de produção. Apanhou **três** defeitos que nenhuma bateria podia ver, porque
o site do fixture é nosso e perdoa tudo:

- **`referrerpolicy="no-referrer"`** no iframe: o YouTube recusa embutir sem referrer (**erro 153**) e
  a página de erro dele **carrega como se tivesse corrido bem** (o `load` dispara, a capa sai de trás,
  e fica um erro do YouTube à vista). Passou a `strict-origin-when-cross-origin`; a bateria mede o
  atributo, que é a causa — o efeito não é detetável por nenhuma página;
- o **modelo** esperava pelo A-Frame do CDN antes de desenhar o resto: um CDN lento deixava a ficha
  só com o nome da exposição e o «voltar». Agora o meio é a única parte que pode falhar, com um
  limite de **8 s** e a capa como reserva — título, autor e sinopse aparecem sempre;
- uma obra **`kind: "site"` não era desenhada na sala**: o `createArtwork` só dava caixa a `image` e
  `video`, por isso a obra existia no dado, tinha ficha, e não se via nem se clicava na exposição.
  Passou a desenhar a capa, e a bateria do `r9` — que só exigia o elemento — passou a exigir a malha
  (**7 de 7**).

**Riscos:** um site que recusa ser embutido não é detetável pela página (mitigação: a imagem por baixo
e o botão sempre visível, e é isso que a bateria mede; e um embed que exija referrer, como o YouTube,
tem de o receber — foi o erro 153); e a ficha depende do dado do mundo em tempo de execução, por isso
um mundo que não carregue diz «obra não encontrada» em vez de ficar em branco.

**O guia de testes (`docs/GUIA-DE-TESTES.md`).** O autor pediu um guia objectivo para testar notelemóvel e no computador. Escrevê-lo obrigou a verificar cada expectativa no código, e duas não se
cumpriam:

- o **«voltar» de um fixture** (`r9`, `exemplo-ficha`) apontava para `<slug>/`, uma pasta que não
  existe: um 404 na cara do visitante. A ficha pergunta agora ao servidor se a pasta existe (um `HEAD`)
  e, quando não existe, volta por `./?scene=<slug>` — o caminho pelo qual o fixture se abre. Medido:
  `obra.mjs` **60 de 60** (dois dos quais são o «voltar» de uma sala e de um fixture, com o clique a
  construir mesmo a cena);
- **sem rede a ficha ficava em branco**: o catálogo de textos (`i18n/pt.json`) é a primeira coisa que
  ela busca, e uma falha ali deixava a página sem nada escrito. O `obra.html` passa a trazer um **aviso
  de reserva** escrito no ficheiro (que o `js/obra.js` tira do caminho antes de desenhar), e o
  `initI18n` está dentro de um `try`: sem textos, é o aviso que fica; sem o mundo, é a linha «Esta obra
  não faz parte desta exposição» com o «voltar». Bateria nova `ficha-falhas.mjs` — **3 de 3**, com os
  pedidos bloqueados um a um (`/i18n/*`, depois `/data/worlds/*`) e um browser novo por caso, porque o
  bloqueio do Chrome não se limpa de forma fiável na mesma sessão.

O guia tem sete blocos: a ficha no computador (12 testes), a ficha no telemóvel (6), a ficha ligada à
exposição (6), a regressão do que já funcionava (7), o CSV (6), o editor (5) — e, para cada falha, o
que enviar (o endereço, o que se esperava, e o texto da sonda).

**O regresso ao ponto (D63) e o cartão largo.** O autor testou e trouxe três coisas. Duas eram dados
esperados (**o portão tem 2 portais e nenhuma obra**; **a ficha de produção não tem descrição** porque
o `data/obras.csv` está por preencher) e a terceira era um pedido: **voltar ao sítio onde clicou**, e
não ao início do mundo — ver a **D63**. A quarta observação era visual: num ecrã largo a imagem ficava
pequena dentro do cartão. Medido antes de mexer: `--padding: 4vw` cresce com a janela enquanto a coluna
para nos 800 px, por isso a imagem ocupava **71%** do cartão a 2560 px e **91%** a 780. Passou a
`clamp(16px, 4vw, 40px)`: **89–91%** em todas as larguras medidas (420, 480, 780, 1280, 1600, 2560).

Medido: bateria nova `volta.mjs` **7 de 7** (o clique guarda o ponto, o «voltar» pede `?volta=1`, a
posição e o olhar voltam dentro de 0,2 m e 1,5°, o ponto é consumido, e sem ponto a sala começa no
dado), `obra.mjs` **60 de 60**, `ficha-falhas` **3 de 3** e a suíte por omissão **5 de 5**.

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
| T10 *(novo, D14)* | Retrato da porta de mundo | Alfa **255 dentro** e **0 fora** onde o fundo é a câmara (o portão); onde o fundo é a sala, tingir o retrato muda os pixels **dentro** da janela e **nada** fora (medido no B9, §9) |
| T11 *(novo, D14)* | Chegada atrás da porta inversa | **0** travessias em cadeia ao aparecer; andar **na direcção em que o visitante fica virado** não dispara nada, e meia volta dispara **uma** travessia |
| T12 *(novo, D14)* | O retrato não sai da moldura | Poses à frente da porta com o retrato tingido (no B9: **16** poses — as 8 portas a 12 m e a 30 m), **0** pontos mudados fora do rectângulo da abertura |

### Os instrumentos destes testes

Dois correm **na página** (o que se mede é o que está desenhado, e o projeto não tem build nem
dependências — D1) e três correm **de fora**, com um Chrome sem cabeça e o `tools/regression/harness.mjs`:

| Instrumento | O que mede | Como corre |
| --- | --- | --- |
| `tools/regression/pose-sweep.mjs` | **T2** e **T3**: 84 poses em frente de um portal isolado, por diferença entre dois desenhos, com controlos dentro da abertura e três avarias injectadas que provam que ele falha (ou recusa) quando deve | `(await import('/tools/regression/pose-sweep.mjs')).runPoseSweep()` |
| `tools/regression/acceptance.mjs` | A bateria da fase: **T4, T5, T6, T9, T10, T12** de uma vez, mais **T2/T3** (chama a varredura) e **T8** (lê a sonda da sessão). O **T1** e o **T7/T11** medem-se porta a porta e chegada a chegada (`walkDoor`, `checkArrival`) | `(await import('/tools/regression/acceptance.mjs')).runAcceptance()` |
| `tools/regression/twelve-tests.mjs` | **T2–T12** nas **5** páginas, de fora: abre o Chrome, entra em cada página e lê o relatório da sonda | `node tools/regression/twelve-tests.mjs [slug[:from] …]` |
| `tools/regression/traversal-tests.mjs` | **T1** (as 12 portas) e **T7/T11** (as 8 chegadas), com as navegações de página contadas pelo `sessionStorage` | `node tools/regression/traversal-tests.mjs [slug …]` |
| `tools/regression/all.mjs` | A verificação inteira, com um código de saída: validador, leis, doze e portas/chegada (**4** baterias); `--full` acrescenta as sete arquivadas | `node tools/regression/all.mjs [--full]` |

O `acceptance.mjs` nasceu da medição da fase e traz três lições de método escritas no próprio
ficheiro, todas de erros que ele próprio cometeu primeiro:

1. **O rectângulo de uma janela tira-se da máscara** (a geometria do próprio objecto) e não de uma
   projecção paralela: a primeira versão projectou os cantos com o `fov` errado (60 em vez de 80) e
   mediu a moldura em vez da janela.
2. **A câmara de um rig move-se só na posição.** O `look-controls` é dono da rotação e desfaz o que
   lhe for escrito à mão — uma rotação posta por script dura menos de um segundo, e a medição que
   dependa dela mede outra coisa.
3. **Contar chamadas a `addEventListener` não conta ouvintes.** O DOM deduplica registos iguais, e
   a sonda que conta chamadas chegou a dizer 2 onde havia 1. A resposta certa veio do
   `DOMDebugger.getEventListeners` da sessão (o método que o fecho de A2/A3 já usava), e o
   instrumento passou a replicar a semântica do DOM para poder responder sozinho.

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

**Nota (2026-10-15).** Os valores de T2 e T3 desta tabela vêm de uma medição **manual**, e a
mesma medição foi repetida com números diferentes (69, 70 e 236 poses, conforme o documento).
Desde 2026-10-15 há para eles um instrumento repetível — ver «A varredura de poses (T2 e T3)»
abaixo.

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

### A varredura de poses (T2 e T3) — automatizada em 2026-10-15

O T2 e o T3 eram os dois únicos testes desta secção **sem instrumento**: foram medidos à mão três
vezes, com três números diferentes — **69** poses aqui, **70** na verificação da Fase 1 (§9) e
**236** no `README.md` — e nenhum deles se podia repetir. Passaram a ter um instrumento:
`tools/regression/pose-sweep.mjs`, que corre na consola do browser. A Fase 6 já definia a
automação como «o mesmo script que já usamos no browser», e é o que faz sentido num projeto sem
build e sem dependências (D1).

**Como mede.** Põe a câmara longe da cena (x = 200) e move um portal isolado à frente dela, em
**84 poses** (4 distâncias × 7 ângulos × 3 alturas). Em cada pose desenha a cena **duas vezes** —
com as quatro barras da moldura visíveis e escondidas — e a diferença entre os dois renders dá os
pixéis da própria moldura: **presença, não cor**, como manda a lição de método acima. A linha
central de cada barra é projetada e amostrada a cada 3 px: uma amostra falha quando a moldura
está ausente onde teria de estar visível (é o T3). Uma pose falha se tiver ao menos uma amostra
em falta (é o T2). Pontos dentro da abertura são amostrados como **controlo**: se virem
diferença, os dois renders diferem por outra razão e o resultado é **inválido** — não é «passa».

**O que mede, hoje** (2026-10-15):

| Medição | Valor |
| --- | --- |
| Poses avaliadas | **84 de 84** (0 não avaliáveis) |
| Poses com bordo cortado (T2) | **0** |
| Falhas de contorno (T3) | **0** em **11 180** amostras |
| Controlos | **420**, 0 falhas (método válido) |
| Duração | ~1,0 s |
| Efeitos na cena | nenhum: 8 portais, câmara e dimensão repostas, nenhum rig deixado |

**A prova de que o instrumento consegue falhar** (duas avarias injetadas de propósito):

| Avaria | Poses com bordo cortado | Amostras falhadas |
| --- | --- | --- |
| `fault: 'bar'` (uma barra nunca desenhada) | **84 de 84** | **3 212** de 11 180, concentradas na barra afetada (`moldura-0`: 3 212 de 3 312) |
| `fault: 'stencil'` (o defeito da lei L3) | **84 de 84** | **10 072** de 11 180, nas quatro barras |

Nas duas avarias os **controlos continuaram a 0** — o que falhou foi mesmo a moldura.

**A terceira avaria, e a recusa (Fase 6, 2026-10-24).** Uma câmara a mexer-se durante a varredura não
é um defeito da cena: é uma medição que não vale, e a varredura passou a dizê-lo. Se a câmara sai do
sítio onde foi posta (mais de **1 mm**), o veredicto é **`refused`** — `T2` e `T3` ficam `refused`, e
não `fail` —, com o motivo e a pose onde aconteceu. Provado com `fault: 'camera'`, que move a câmara
0,1 m por pose (o passo do D-pad): **`refused` na primeira pose**, câmara e rig repostos; a mesma
página, com a câmara parada, dá os mesmos **84** poses, **0** cortadas e **0** falhas em **23 098**
amostras.

**Limites do instrumento** (escritos para não serem esquecidos): mede a moldura de um portal
**isolado**, não as oito da cena — assim não há oclusão legítima a confundir-se com defeito (a
moldura de trás tapada pela janela da frente é o T5, não uma falha); não mede o **conteúdo** das
janelas (T4 e T5); e exige um browser com **aceleração de GPU** — em render por software
(SwiftShader) o `requestAnimationFrame` afoga-se e a varredura não termina.

**Lição de método (Fase 3).** Três coisas que a medição de 2026-10-15 ensinou, e que valem para
qualquer instrumento deste projeto:

- **A cache do browser faz medir código antigo sem dar sinal nenhum.** O `js/core/index.js` que o
  browser tinha guardado era de uma versão anterior: a página **nem o pedia ao servidor** — o
  ficheiro no disco e o que o servidor serve estavam certos —, e o grafo de módulos caía com
  «does not provide an export named `unregisterContent`». Resolve-se com a cache desligada
  (CDP `Network.setCacheDisabled`) ou com uma recarga sem cache, mas a lição é outra: **um erro
  de consola em código que já não existe no disco é um sintoma de cache**, não um defeito para
  caçar no código.
- **Medir com a câmara a andar dá números que parecem bons.** Numa sessão em que o D-pad ficou
  premido, a varredura deu **84 de 84** poses com o bordo cortado com os **controlos limpos** — que
  é exactamente o que se espera quando os dois renders comparados são o **mesmo** (a câmara mexe-se
  entre eles: a diferença vem do movimento, não da moldura). Numa recarga limpa, os mesmos 84 dão
  **0**. A varredura exige página sem interação e câmara parada; desde a **Fase 6** ela deteta-o e
  **recusa** o resultado (`refused`), em vez de o reportar como falha da cena.
- **Uma medição por diferença precisa de um controlo positivo.** O T5 deu **0 px** à primeira
  tentativa com a porta de trás do **mesmo tamanho** da da frente: ela fica toda tapada pela
  máscara da frente, e um zero desses não prova nada. Com a porta de trás maior, há **6 768 px**
  de moldura desenhada onde ela **não** está tapada e **0** dentro da janela — só aí o zero vale.
  É a mesma regra do T4 (presença/ausência), aplicada à oclusão: **todo o teste que conte «zero»
  precisa de um caso em que o número devesse ser diferente de zero.**

#### Os instrumentos da Fase 4 (arquivados em 2026-10-21)

As seis baterias que mediram a página de edição e a travessia nasceram na pasta da sessão, e um
número que ninguém pode voltar a medir é uma afirmação sem prova. Passaram para o repositório: são
scripts de **Node** que se correm da raiz do projeto, cada um imprime `N of N checks pass` e sai com
código de erro quando falha. Partilham `tools/regression/harness.mjs` — o servidor do projeto, um
Chrome com câmara falsa e as chamadas de CDP que todas precisam (e a leitura de PNG que transforma
«o ecrã ficou preto» num número); cada bateria tem a sua sonda e as suas verificações.

| Ficheiro | Decisões | O que mede | Resultado |
| --- | --- | --- | --- |
| `camera-arrival.mjs` | D37 | chegar por uma porta não pede nada ao visitante, e o botão volta se a câmara for recusada | **5 de 5** |
| `start-button.mjs` | D41 | o botão segue a câmara: sem permissão, com permissão, numa sala e no telemóvel (390×844) | **7 de 7** |
| `transition.mjs` | D42 | o botão não aparece a meio de uma travessia, e uma permissão que nunca responde não trava a página | **9 de 9** |
| `image-bridge.mjs` | D43, D44, D45 | a travessia: **0** fotogramas escuros, a ponte é o ecrã (**0,22**), sai num só passo, sem a linha «Carregando…» e só depois do fotograma da câmara | **9 de 9** |
| `labels-doors.mjs` | D39 | o nome das portas: a tecla D, o editor sem teclas, e dez portas sem deixar textura nem nó | **23 de 23** |
| `labels-artworks.mjs` | D40 | o nome das obras: a mesma tecla, acima do centro, e o editor | **21 de 21** |
| `seam.mjs` | D46, D47 | o salto no corte de cada travessia: a imagem que a ponte pintou contra a que o mundo mostrou | **12 de 12** (0,17 a 0,41 contra a meta de 0,50) |
| `twelve-tests.mjs` | T1–T12 (§10) | a bateria dos doze testes nas cinco páginas, a partir da sonda `acceptance.mjs`: consola, janela, oclusão com controlo positivo, clique, 20 ciclos, o retrato e a varredura de poses | **35 de 35** (7 verificações × 5 páginas) |
| `ida-e-volta.mjs` | D46 | o conversor do retrato é fiel? um panorama conhecido vai por esfera → cubo → equirretangular e é comparado com o original | **0,39** de diferença, deslocamento **0** |
| `piso-ponte.mjs` | D43, D46 | o preço da ponte: o quadro guardado mostrado por cima da cena que ele fotografou | **0,00** |
| `desalinhamento.mjs` | D46 | a ponte e a chegada estão na mesma posição? procura o (dx, dy) que melhor as sobrepõe | **dx=0, dy=0** |

Correm-se com `node tools/regression/<ficheiro>` e precisam de um Chrome instalado (a variável
`CHROME` aponta outro caminho). Não tocam na rede: cada uma levanta o seu servidor em `127.0.0.1` e o
seu Chrome, com uma câmara falsa, e desliga a cache — que é a lição de método acima.

**Uma flutuação conhecida do `seam.mjs`.** Na **primeira** porta de cada sessão, com o cache do
Chrome frio, os fotogramas escuros contam **5 ou 6**; corrida isolada, a mesma porta dá **0** (medido
duas vezes seguidas, 43 e 42 amostras). Não é do B20 nem do retrato — acontecia antes dele — e a
hipótese é a ponte estar no `sessionStorage` antes de o `<img>` que a mostra estar descodificado: o
que se vê por baixo é o `#container-video`. Fica registado para um bloco futuro, com o número medido.

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
| D15 | Harness de skills do projeto | **FECHADA** (2026-10-13) — **emendada no mesmo dia** e pela **D17** (2026-10-14: quatro passes) | **Usar o harness de `.harness/skills/` com um índice único e verificado.** O índice `.agent/skills_index.md` passa a cobrir o **`.agent/` inteiro** (rules, agents, skills, sub-skills, workflows, scripts, ferramentas, vendors, standalone, quarentena) e a declarar a raiz dos caminhos; as entradas são **validadas contra o disco em três passes** — `índice → disco`, **quantidades** e `disco → índice`. O material herdado de outro projeto (`Gabinete`) é **isolado em `.agent/garbage/`** (`project_sync.py`, `update-{3d,audio,layout}.md`) e as referências a `CODEBASE.md` / `ARCHITECTURE.md` / `GABINETE_DESIGN_SYSTEM.md` em ficheiros ativos tornam-se condicionais ou apontam para o índice. Scripts referenciados mas **inexistentes** são removidos. **Limpeza (2026-10-13):** apagados o esqueleto Cline (88 pastas, 0 ficheiros), as 3 falsas "junções" de descoberta e o `__pycache__`; mantidos os 5 repos `.git` dos vendors (**funcionais** — servem o `sync-all-vendors.ps1`), o `frontend-slides/plugins/` (conteúdo do clone) e o `skills/doc.md` (guia do kit). **Custo aceite:** as pastas de descoberta automática dos vendors não existem; recriá-las é um comando quando se quiser |

> **Emenda da D15 (2026-10-13, 3.ª atualização).** A primeira versão do índice foi dada como
> fechada com **uma** passe de validação — e essa passe **não consegue** detectar
> material que *falta* no índice, porque só pergunta se as linhas que existem resolvem. Medido
> ao disco, o índice omitia skills inteiras, documentação de apoio e ferramentas, e descrevia
> como "cópia" um espelho que não tinha um único ficheiro. Corrigido em §3, no
> `skills_index.md` e no `README.md` (regra 5): passou a haver **três** passes, com a inversa a
> olhar para o disco à procura do que falta. **Os números exatos desta auditoria estão em
> `HARNESS_LOG.md`.**

| D16 | A origem da garantia de ordenação (lei **L6**) | **FECHADA** (2026-10-14) | **A lei passa a enunciar o invariante, não a ação.** Medido na fonte do A-Frame 1.8.0 (`src/systems/renderer.js`): `sortObjects` **não** é propriedade do schema e o sistema do `renderer` fixa `renderer.sortObjects = true` e `setOpaqueSort(sortFrontToBack)` na inicialização, «seja qual for a configuração» — logo a garantia é **do framework**, e a linha de `js/app.js` é uma **confirmação** que fica (documenta a intenção e protege contra uma versão que mude a omissão), com o comentário corrigido para citar a medição. `stencil` **é** propriedade do schema (omissão `false`) e continua a ser responsabilidade do projeto. **Custo aceite:** enquanto a omissão não mudar, a linha é redundante — e um leitor pode julgá-la indispensável |
| D17 | Quarta passe de validação (frontmatter dos agents) | **FECHADA** (2026-10-14) | **O `validate_skills_index.ps1` ganha uma quarta passe, `agent → disco`:** lê o `skills:` do *frontmatter* de cada `agents/*.md` e confere cada token contra `skills/{token}/SKILL.md`. **Motivo escrito:** as passes 1–3 olham todas para dentro do índice e, por construção, **não podem** ver um agent a citar uma skill inexistente — foi assim que passou o `refactoring-patterns` do `code-archaeologist` (§14.4 do `HARNESS_LOG.md`), apanhado por auditoria manual e não pelo validador. **Custo aceite:** a regra deixa de ser "três passes" e passa a **quatro** em três ficheiros (este, o `README.md` e o `skills_index.md`) — a repetição que a D15 quis evitar é paga em três linhas |
| D18 | O que fica na quarentena (`.agent/garbage/`) | **FECHADA** (2026-10-14) | **Mantém-se como referência: não se adapta nem se apaga.** Motivo escrito: o `.harness/` **não tem histórico Git**, logo o que se apagar aqui não se recupera (política do §2 do `HARNESS_LOG.md`), e os 6 ficheiros que lá estão têm todos estatuto explícito no `garbage/README.md` — os **originais** do que foi adaptado por cópia (`project_sync.py`, de onde nasceu `.agent/scripts/project_sync.py`), os originais dos workflows adaptados (`update-3d`, `update-layout`), o que **não** foi adaptado por não ter alvo neste projeto (`update-audio`: não há áudio) e o que foi retirado por apontar para outro harness (`update-symlinks.ps1`). **Custo aceite:** 6 ficheiros mortos que a passe 2 do índice continua a contar (`Quarentena`=6) e que nada carrega |
| D19 | As três fronteiras que a Fase 2 tinha em aberto (R5–R7) | **FECHADA** (2026-10-15) | **(1) O driver de frame vive no módulo do portal.** Depois do A7 o `gestor-dimensoes` deixa de existir: é o módulo do portal que percorre `state.portals`, pede a posição do jogador à câmara e passa as dimensões mostradas ao núcleo (`syncStencilValues`) — o núcleo não conhece portais (§5.0) e o `app.js` fica só com o arranque. **(2) O modal da obra e o `cursor-listener` vivem em `js/modules/artwork.js`:** os dois são da obra (§5.3) e o modal é DOM desta aplicação, não do editor (§5.0). **(3) Os *hooks* em português passam a inglês** — `data-dimensao` → `data-dimension`, `dimension-<id>` na classe e `dimension-<id>-<papel>` no nome do objeto 3D: são código e caem na D10. Medido ao disco ao fechar a decisão: o `css/style.css` **não** usa nenhum deles (usa os ids `#modal-obra` e `#btn-frente`), logo o renomeio não arrasta CSS. **Custo aceite:** o README §*Estado atual do código* diz que o ID «aparece nos atributos, em `data-dimensao` …» e passa a ter de ser acertado |
| D20 | O campo único `asset` (**A6**, §5.3) | **FECHADA** (2026-10-15) | **Um catálogo `assets` no JSON, `id → { path, type, alt }`.** A dimensão e a obra guardam só o `asset`; o `url` do modal **deriva** do catálogo e o campo `url` fica reservado a `interaction: link` (ligação externa, que não é um asset). O construtor de cena cria o `<a-assets>` a partir do catálogo, o que **mantém a linha de textura que já existe** (elemento `<img>`/`<video>` mais o `#id`) em vez de a trocar por carregamento por URL — o vídeo obrigaria a refazer a `VideoTexture`. **Custo aceite:** o formato muda e a versão do JSON sobe (D23) |
| D21 | O texto de conteúdo por língua (**R4**, §5.7) | **FECHADA** (2026-10-15) | **O formato da variante A (`{ "pt": …, "en": … }`) entra no esquema, no conversor e no validador, e fica instanciado:** as **4** dimensões ganham `name` e o catálogo de assets ganha `alt` por língua (o da `galeriaFoto2` passa a distinguir-se do da `galeriaFoto1` e o do vídeo é novo — o `<a-assets>` não tinha nenhum). As **10** obras ficam sem `title`: o campo é **opcional** no esquema, pronto para o editor (Fase 4), que é o primeiro sítio que lê texto de conteúdo. **Custo aceite:** 10 pares de texto escritos antes de existir quem os mostre |
| D22 | Em que fase entram os dois eixos do portal | **FECHADA** (2026-10-15) | **Fase 3B.** A §6 e a §11 diziam «agora, antes da Fase 3»; a nota de §5.4 (2026-10-15) e a lista de entregáveis de §9 dizem 3B — fica a nota mais recente. A Fase 3 mantém `dimensionA`/`dimensionB`/`ownedBy` no JSON e a 3B migra o formato por script (**0 diferenças**), que era o risco de troca de `A` por `B` assinalado na §6. **Custo aceite:** o formato do portal fica com uma migração a mais por fazer, e o conversor da Fase 3 não a faz |
| D23 | A versão do formato e como se escolhe a cena | **FECHADA** (2026-10-15) | **`version: 2`** (o catálogo e o texto por língua mudam o formato) e o validador **recusa versões desconhecidas**: sem isso, um JSON do formato antigo passa a ser lido como se fosse novo, em silêncio. O construtor de cena aceita **`?scene=example`** para carregar o `data/scene-example.json`: sem porta de entrada, o fixture da D9 era uma cópia morta. **Custo aceite:** um parâmetro a mais na URL, com um só valor legal |
| D24 | A divisão da cena de hoje em mundos | **FECHADA** (2026-10-15) | **Quatro mundos, uma dimensão cada**: `gate` (a raiz, com a câmara/AR), `cidade`, `praia` e `céu`, com as **8 portas de hoje** — todas passam a `navigate`, porque nenhuma sala tem duas dimensões. O **fixture** (`data/worlds/example.json`) passa a ser o mundo de **duas dimensões** com uma porta interna, para o `dimension-pair` + `enter-window` continuar exercitado (T1–T9). **Custo aceite:** a exposição deixa de ter janelas ao vivo — as portas mostram retratos, que é o que a D14 já previa |
| D25 | Forma da porta no formato v3 | **FECHADA** (2026-10-15) | `version: 3`, e o par muda **para dentro do eixo**: `window {kind, dimensionA, dimensionB, asset, radius}` + `action {kind, target}` + `arrivalFrom` no portal, com **obrigatoriedade condicional** (o par só com `dimension-pair`, o `target` só com `navigate`) e os ids declarados limitados a **0…447** (L15). O `action.from` do exemplo da §6 sai: o `?from` que a porta escreve é o **slug do mundo de origem**, que o código já tem. **Custo aceite:** um leitor v2 deixa de ler o ficheiro — é a regra da D23 |
| D26 | Como o retrato existe na cena | **FECHADA** (2026-10-15) | **Dimensão derivada** (G2-b): o construtor cria uma por par único (`asset`, `radius`), com id na banda **448…511** (L15), `followCamera: false`, a esfera centrada **na porta** (sem isso não há paralaxe) e o yaw vindo da rotação dela. Duas portas para o mesmo mundo, com o mesmo raio, partilham-na — 1 textura, 1 valor de stencil, 1 desenho, que é o que os portais 4 e 5 já provam hoje. O retrato é um **nome do catálogo**, nunca um caminho (D20), ao contrário do exemplo da §6. **Emenda de 2026-10-22 (D47):** a esfera deixa de estar centrada na porta e passa a estar à **altura dos olhos** sobre ela — a paralaxe continua a existir (a esfera não segue a câmara) e a vista através da janela passa a coincidir com a chegada |
| D27 | Divisão dos assets (D7) e nome dos retratos | **FECHADA** (2026-10-15) — **emendada ao fechar o B5** | `assets/{panoramas,artworks,video,previews}` (a divisão por tipo da D7, feita com `git mv`) e `<mundo>-d<N>-<nome>` no nome dos ficheiros. **Emenda:** os retratos são **um por mundo de destino** (`assets/previews/<destino>.jpg`) e não um por par origem→destino, porque a partilha da **D26** («duas portas para o mesmo mundo partilham 1 textura, 1 valor, 1 desenho») só acontece se as portas nomearem **o mesmo asset** — com o nome por par seriam **7** ficheiros e **7** texturas para **4** imagens. O formato continua a deixar uma porta nomear o seu próprio retrato, quando for uma escolha do autor. **Emenda de 2026-10-22 (D46):** os retratos passam a ser **um por porta** (`assets/previews/<destino>-de-<origem>.jpg`), porque a vista através da janela passou a ser a **vista da chegada** e a chegada depende de onde se vem — a partilha da D26 deixou de ser possível sem mentir. Ficam **6** ficheiros para as 6 portas com retrato; os três antigos (`cidade.jpg`, `praia.jpg`, `ceu.jpg`) mantêm-se, e `praia.jpg` continua a ser o do mundo de exemplo |
| D28 | Como cada mundo se identifica | **FECHADA** (2026-10-15) — **emendada ao fechar o B7** | O **slug sai do caminho**: o que sobra de `location.pathname` depois de `document.baseURI` (raiz = `gate`). Assim os **4 arranques são o mesmo ficheiro copiado 4 vezes** — 1 fonte, não 4 — e a verificação das ferramentas exige que o nome da pasta e o `world.slug` do JSON coincidam. **Emenda:** idênticos **fora da linha do `<base>`** (a raiz leva `href="./"`, as salas `href="../"`), porque sem ela os caminhos relativos de uma sala resolvem para a raiz. **Custo aceite:** o nome da pasta *é* o slug, logo é implícito — e é exactamente por isso que passa a ser verificado |
| D29 | A porta que faltava na praia | **FECHADA** (2026-10-16) | A porta **5 da praia** passa a ser o **regresso ao portão**: `window: none` + `action: navigate` com `target: gate` e `arrivalFrom: gate`, espelhando a porta 2 da cidade. **Motivo escrito:** na cena de onde a 3B nasceu os portais **4 e 5 eram a mesma porta duas vezes** (`ownedBy: 2`, par `2/1`); enquanto eram duas dimensões do mesmo ficheiro era redundância, mas com **um mundo por dimensão** passou a ser **falta de saída** — a praia não tinha porta para o portão e, ao chegar de lá, nenhuma porta podia dizer que era a chegada, logo o visitante aparecia onde a câmara dizia e o aviso do T8 disparava. **Medido:** o aviso apareceu na primeira ronda de portas do B7 (`praia?from=gate`), e a correção prova-se pelo **migrador emendado** — reposta a cena única e corrido outra vez, os 5 ficheiros saem iguais aos que estão em disco excepto a porta 5 (`1 file changed, 4 insertions(+), 5 deletions(-)`). **Custo aceite:** a praia perde a simetria esquerda/direita das duas portas para a cidade (fica uma); ganha o regresso directo ao portão, que era o que faltava |
| D30 | **R9** — o esquema valida o que a cena não constrói (`model`/`text` de obra, `color` de dimensão, `interaction: link`) | **FECHADA** (2026-10-16) | **O validador passa a avisar e o editor não oferece o que não é construído.** Motivo escrito: implementar geometria de modelo, texto 3D e `link` a navegar é uma fase própria — nenhum deles tem arte nem caso de uso hoje —, enquanto a alternativa (o editor oferecer campos que a cena ignora) é exactamente o defeito que o **R9** mediu: quem escreve um desses campos vê o validador aceitar e a cena não mudar. O aviso entra na categoria que já existe (a mesma que avisa da dimensão de cor sem cor) e no `tools/scene/laws-selftest.mjs`, com uma avaria por valor. **Custo aceite:** o esquema continua a declarar mais do que constrói — passa a declará-lo **em voz alta**. **Emendada pela Fase 7 (2026-10-24, §9):** os quatro valores passam a ser **construídos** — blocos **B5** (dimensão `color`), **B6** (`link` a navegar) e **B7** (`model` e `text` de obra) —, porque «a fase própria» que esta decisão previa é a Fase 7 |
| D31 | O que o editor faz quando se cria um **mundo** (§7 pedia «slug, nome por língua, **pasta e arranque**») | **FECHADA** (2026-10-16) | **O editor exporta o ficheiro (`data/worlds/<slug>.json`) e mostra o comando; a pasta e o arranque são de uma ferramenta** — `tools/scene/new-world.mjs`, que cria `<slug>/index.html` a partir do arranque da raiz e o confere com o `checkArranques` que já existe. Motivo escrito: a **D2** diz que o editor **nunca escreve em disco** (é um site estático: gravar é substituir o ficheiro à mão) e a **D14** recusou o manifesto (M5) — sem ele, uma pasta nova não é sequer *vista* pelo editor. A ferramenta tem precedente: `tools/assets/normalize.mjs` já escreve ficheiros. **Custo aceite:** criar uma sala passa a ter dois passos (o comando e o ficheiro exportado), e o editor não os faz por si |
| D32 | A pré-visualização e a travessia de uma porta de mundo | **FECHADA** (2026-10-16) | **A acção `navigate` fica inerte na pré-visualização** (o construtor ganha a opção e a porta avisa na consola quem a atravessa) **e há guarda de saída** quando o modelo tem alterações por gravar. Motivo escrito: a pré-visualização é uma caminhada **dentro** da ferramenta, e uma travessia a navegar **sai da página** e leva o trabalho consigo — sem isto, bastava andar em frente para perder meia hora de edição. O `dimension-pair` + `enter-window` continua a funcionar (é o que se está a afinar) e a **L13** continua respeitada: nenhum outro mundo é carregado nem construído. **Custo aceite:** a pré-visualização não prova o caminho entre mundos — isso mede-se na exposição, com `walkDoor` |
| D33 | Como o editor reaplica o que se edita | **FECHADA** (2026-10-16) | **Ao alterar um campo, re-cria-se a entidade editada** (`remove` + a fábrica, com o dado novo); **inserir, excluir, mudar o catálogo de assets ou trocar de mundo reconstroem a cena** (`remove()` + `buildScene`). Motivo escrito, com o que o B0 mediu: (1) um `build` completo reconstrói **todos** os assets, e recarregar imagens a cada tecla é o que a D3 não quer; (2) o `update` por campo **não existe** nos módulos (a §5.2–5.4 prometiam-no para esta fase) e acrescentá-lo seria uma **segunda via** para a mesma geometria — o que a §5.0 quis evitar; (3) a re-criação usa a fábrica e o `remove()` que já existem (**uma** via) e **não mexe na câmara**, logo o autor não perde o sítio onde estava a olhar. **Custo aceite:** o `remove`+`create` passa a ser caminho quente — o que faz do editor o primeiro consumidor do `remove()` e fecha o **R8** |
| D34 | A webcam no editor | **FECHADA** (2026-10-16) | **Só liga por gesto** (o botão da pré-visualização, que escreve o `cameras.real.enabled` do dado) e **nunca na carga da página**. Motivo escrito: o `getUserMedia` exige um gesto na exposição (é o «ATIVAR EXPOSIÇÃO») e pedir a câmara a quem abre o editor para escrever números é o caminho mais curto para uma recusa que fica memorizada no browser. **Custo aceite:** a pré-visualização do portão começa sem a realidade — a dimensão 0 fica transparente até o autor pedir a câmara |
| D35 | O «desfazer» (§7) | **FECHADA** (2026-10-16) | **Instantâneos do JSON em memória**, com limite (~**50**), e não um registo de comandos. Motivo escrito: o modelo é pequeno (o maior mundo tem 5133 bytes), o JSON **é** a verdade (D2) e um instantâneo é a única forma de desfazer que não pode divergir do modelo — um registo de comandos é uma segunda fonte de verdade. **Custo aceite:** o histórico vive só na sessão (recarregar perde-o) e uma ronda longa esquece o princípio |
| D36 | A estrutura do editor e a regra da D4 | **FECHADA** (2026-10-16) | **`js/editor.js` é a entrada** (≤100 linhas, a forma do `app.js`: os imports e o arranque) **e o resto vive em `js/editor/`** — modelo, painéis, pré-visualização, exportação e problemas. Motivo escrito: a §5.6 só previa `js/editor.js` e a D4 escrevia a sua regra verificável a falar de `js/editor/`; a árvore passa a ter as duas coisas e a regra fica **literal** — **0** imports de `js/editor.js` ou de `js/editor/` dentro de `js/core/`, `js/modules/`, `js/scene/` e `js/app.js`. **Custo aceite:** mais uma pasta no `js/`, e o tamanho do editor deixa de ser um só número (mede-se por ficheiro; a meta é a entrada) |

> **Emenda da D28 (2026-10-16) — ao fechar o B7.** A decisão dizia «4 arranques
> **byte-idênticos**, 1 ficheiro copiado 4 vezes», e a execução mostrou que a linha do `<base>`
> não pode ser a mesma: a raiz precisa de `href="./"` e as salas de `href="../"`, senão o
> `?from=<mundo>` e o `data/worlds/<slug>.json` de uma sala resolvem **para a raiz** — a sala
> abria, mas a navegação e o dado vinham do mundo errado. Fica: os quatro são **o mesmo ficheiro
> fora dessa linha**, e a verificação do B8 exige que sejam iguais fora dela (mais o nome da pasta
> igual ao `world.slug`).

> **Emenda da L6 (2026-10-14) — decisão D16.** A lei L6 enunciava a **ação**
> (`renderer.sortObjects = true`) como se fosse ela a criar a garantia. Medido na fonte do
> A-Frame 1.8.0, quem a cria é o framework: o sistema do `renderer` fixa `sortObjects = true`
> na inicialização e a ordenação de opacos respeita `groupOrder` → `renderOrder` → profundidade.
> A lei passa a enunciar o invariante (`stencil: true` na cena e `sortObjects` ativo), o
> `README.md` diz o mesmo e o comentário de `js/app.js` cita a medição.
> **Comportamento inalterado:** a única linha de código tocada é um comentário.

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
| **O `remove` dos módulos (**A4**) não é crítico para mundos** | Ao atravessar uma porta de mundo, a página morre inteira (o **A3** foi fechado em 2026-10-15 — §2.1) |

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

#### Duas migrações

| Migração | Quando | Muda comportamento? |
| --- | --- | --- |
| **De formato** — os 8 portais passam a `window`/`action` | **Fase 3B** (por script) — emendado pela **D22** | **Não** — todos ficam `dimension-pair` + `enter-window` |
| **De sentido** — cidade/praia/céu viram mundos e algumas portas viram `navigate` | **Fase 3B** | **Sim** — é aí que entram a recarga, o `?from` e a chegada |

A migração de formato é feita na **Fase 3B**, pelo conversor, e confirmada pelo validador
(**0 diferenças**, como na Fase 0). Nota de segurança: em `dimension-pair` + `enter-window` a
**ordem do par não interessa**, logo a migração não pode trocar `A` por `B` — que era o risco
assinalado na §6.

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
- O código de edição **não pode** ser importado por `app.js` — regra verificável e, desde a
  **D36** (§11), literal: basta procurar imports de `js/editor.js` **ou** de `js/editor/` dentro de
  `js/core/`, `js/modules/`, `js/scene/` e `js/app.js` (o `js/editor.js` é a **entrada** do editor,
  com os painéis em `js/editor/`).
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

## 13. Resumo — todas as decisões fechadas (2026-10-12 a 2026-10-23)

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
| D15 | Harness de skills | Usar o harness de `.harness/skills/` com **índice único** (`.agent/skills_index.md`, cobrindo todo o `.agent/`) **validado contra o disco em três passes**; **quarentena** em `.agent/garbage/` do material herdado do `Gabinete`; **limpeza** feita (esqueleto Cline, falsas junções e `__pycache__` apagados; os repos `.git` dos vendors mantidos por serem funcionais); **emendada pela D17** com uma quarta passe (`agent → disco`) |
| D16 | Origem da garantia de ordenação (lei L6) | A lei enuncia o invariante (`stencil: true` + `sortObjects` ativo), não a ação: quem fixa `sortObjects = true` é o A-Frame 1.8.0 (medido na fonte); a linha de `js/app.js` fica como confirmação |
| D17 | Quarta passe de validação | O validador do índice passa a conferir o `skills:` de cada agent contra o disco (`agent → disco`) — a direção que as outras três passes não tomavam |
| D18 | Quarentena do harness | Mantém-se como referência (os originais do que foi adaptado, o que não tem alvo e o que foi retirado) — apagar perderia-os, porque o `.harness/` não tem Git |
| D19 | As fronteiras da Fase 2 (R5–R7) | O driver de frame vive no módulo do portal, o modal da obra e o `cursor-listener` na obra, e os *hooks* de HTML passam a inglês |
| D20 | O campo único `asset` (A6) | Um **catálogo `assets`** no JSON (`id → path, type, alt`): a dimensão e a obra guardam só o `asset` e o `url` do modal deriva dele; o campo `url` fica para `interaction: link` |
| D21 | Texto de conteúdo por língua (R4) | `{ pt, en }` no esquema, no conversor e no validador, **já instanciado**: 4 nomes de dimensão e 6 descrições de asset; as 10 obras ficam sem `title` (opcional, para a Fase 4) |
| D22 | Em que fase entram os dois eixos do portal | **Fase 3B** (a nota de §5.4 prevalece sobre a §6 e a §11); a Fase 3 mantém `dimensionA`/`dimensionB`/`ownedBy` no JSON |
| D23 | Versão do formato e escolha da cena | `version: 2`, com o validador a recusar versões desconhecidas; `?scene=example` para carregar o fixture da D9 |
| D24 | A divisão da cena de hoje em mundos | **Quatro mundos, uma dimensão cada**: `gate` na raiz (câmara/AR), `cidade`, `praia` e `céu`, com as **8 portas de hoje** a `navigate`; o fixture passa a ser o mundo de duas dimensões que mantém a janela ao vivo exercitada |
| D25 | Forma da porta no formato v3 | `version: 3`, com o par dentro do eixo: `window {kind, dimensionA, dimensionB, asset, radius}` + `action {kind, target}` + `arrivalFrom`, e **obrigatoriedade condicional** no esquema (ids declarados 0…447) |
| D26 | Como o retrato existe na cena | **Dimensão derivada** por par único (`asset`, `radius`), na banda **448…511** (L15), `followCamera: false` e a esfera centrada na porta; duas portas para o mesmo mundo partilham-na |
| D27 | Divisão dos assets (D7) e nome dos retratos | `assets/{panoramas,artworks,video,previews}` com `git mv`, os retratos em `assets/previews/<destino>.jpg` (**um por mundo de destino** — emenda do B5) e `<mundo>-d<N>-<nome>` nos restantes |
| D28 | Como cada mundo se identifica | O **slug sai do caminho** (`location.pathname` depois de `document.baseURI`; raiz = `gate`), com os **4 arranques idênticos fora da linha do `<base>`** e o nome da pasta e o `world.slug` a serem conferidos |
| D29 | A porta que faltava na praia | A porta 5 da praia passa a **regresso ao portão** (`window: none` + `navigate/gate` + `arrivalFrom: gate`), acabando com a porta duplicada que a cena anterior trazia |
| D30 | O que o esquema valida e a cena não constrói (R9) | O validador **avisa** e o editor **não oferece** o que não é construído: geometria de modelo, texto 3D, cor de fundo e `interaction: link` — **emendada na Fase 7** (2026-10-24, §9): os quatro passam a ser construídos |
| D31 | Criar um mundo no editor | O editor exporta `data/worlds/<slug>.json` e mostra o comando; a **pasta e o arranque** são de `tools/scene/new-world.mjs` (a D2 não deixa o editor escrever em disco) |
| D32 | Pré-visualização e navegação | A travessia `navigate` fica **inerte** na pré-visualização (aviso na consola), mais guarda de saída com alterações por gravar |
| D33 | Como o editor reaplica o que se edita | **Re-criar a entidade** (`remove` + fábrica); reconstruir a cena só quando a estrutura muda — sem `update`/`list` nos módulos (uma via só) |
| D34 | A webcam no editor | Só liga por **gesto** (o botão da pré-visualização), nunca na carga da página |
| D35 | «Desfazer» | **Instantâneos** do JSON em memória (~50), e não um registo de comandos |
| D36 | Estrutura do editor | `js/editor.js` é a **entrada** (≤100 linhas) e o resto vive em `js/editor/` (modelo, painéis, pré-visualização, exportação, problemas); a regra da D4 fica literal |
| D37 | Chegar por uma porta e o ecrã de entrada | A chegada por uma porta (`?from=`) **arranca a exposição sozinha** — `startSession({ arrival: true })`: o botão «ATIVAR EXPOSIÇÃO» fica para a **primeira visita** e volta como **recuo** se a câmara for recusada (o gesto que o browser pode exigir). Cada mundo é uma página (D24) e a porta navega, por isso o ecrã de entrada repetia-se em cada sala mesmo sem câmara nenhuma para pedir |
| D38 | A porta que volta ao portão mostra a realidade | A sala declara uma dimensão `kind: "camera"` e a porta para o portão um `dimension-pair` com ela; a matriz da **L18** ganha a exceção «par com a câmara + `navigate` para o mundo de entrada», porque o que a janela mostra é **exactamente** o que espera o visitante do outro lado. Uma dimensão de câmara **não desenha nada**: o rectângulo da janela fica transparente sobre o vídeo e a realidade vê-se dos **dois lados**. A sala passa a pedir a câmara (o mesmo `real.enabled` do portão), e o editor mostra a combinação como vinda do dado em vez de a reescrever |
| D39 | O nome de cada porta | O nome vive no **dado**: o id, o que a janela mostra (os nomes das dimensões do par, ou o retrato) e para onde leva (o *slug* do mundo — o portão pelo catálogo), escrito pelo construtor num atributo do componente. Desenha-se como **sprite** (lê-se dos dois lados, o que importa a quem aterra atrás dela), com a tecla **D** na exposição e **sempre** no editor, que não tem teclas |
| D40 | O nome de cada obra | O mesmo, com a mesma tecla: `#0 · galeriaFoto1 · Cidade 360º · modal` — o **título** quando o dado tem um (D21), senão o **id do asset** (que é o que se edita no ficheiro), a dimensão pelo **nome** e a interacção pela palavra do dado (`modal`/`none`/`link`). O desenho é um só para portas e obras — `js/modules/label.js` —, para os dois não divergirem em tamanho, cor ou tipo de letra |
| D41 | O botão de entrada segue a câmara | O botão «ATIVAR EXPOSIÇÃO» é a **porta para a câmara**, por isso só existe enquanto não há câmara: esconde-se **no instante em que há um stream** (mesmo que a câmara não esteja à vista — numa sala ela é só a janela da porta) e nunca volta a aparecer com um stream vivo. E uma visita em que o browser **já tem a permissão** (`permissions.query`) arranca sozinha, sem gesto: a permissão *é* o registo do gesto. Em browsers que não respondem a essa pergunta (Safari), fica a regra do gesto (**D34**) |
| D42 | O botão não aparece a meio de uma transição | O botão está **escondido no markup** e só aparece quando a página decidiu que é ele que falta — e a decisão é tomada **antes de a cena carregar**: com `?from=` (chegada) nunca aparece, e na primeira visita aparece antes dos assets. Enquanto carrega, a chegada mostra a linha «Carregando…» em vez de um ecrã preto com um botão por cima (era o que se via no vídeo do autor entre portais). A pergunta da permissão é esperada no máximo **1 s**: uma resposta que não chega não pode travar a exposição |
| D43 | A travessia entre mundos não passa pelo preto | A página que sai guarda o **último quadro** que estava a mostrar (`sessionStorage`) e a que chega pinta-o antes de tudo o resto, desvanecendo-o quando há cena. O quadro é **composto**: o `<video>` da câmara por baixo e o canvas por cima, na ordem e no enquadramento do CSS — o canvas é `alpha: true` e, sem essa composição, a ponte seria um retângulo preto nas salas onde a câmara é o chão da cena. Vive em `js/arrival-frame.js`, e é o único script **clássico** do projeto: tem de correr antes da primeira pintura, e um módulo só corre depois de carregar a sua árvore de importações (que é exactamente a janela que se quer fechar). A chave é de **uso único** (recarregar não repete a imagem) e tem um prazo de **20 s**; uma cena que não chegue ao fim vê a ponte sair na mesma ao fim de **10 s**, para uma imagem parada não esconder um erro |
| D44 | A travessia não dá a ver que houve uma | A ponte não se **desvanece**: sai num só fotograma, quando o mundo já está a ser desenhado — uma dissolução de 240 ms entre duas fotografias do mesmo sítio lê-se como efeito, e o que se quer é que a travessia não se anuncie. E enquanto a ponte cobre o ecrã **não se mostra a linha «Carregando…»**: o ecrã nunca está vazio, e um elemento a aparecer é o sinal mais visível de todos. Medido: o quadro da ponte difere do ecrã em **0,22** (é o ecrã), o mundo difere do quadro em **3,94** — um passo de caminhada (o maior salto a caminhar é **2,69**) —, o que sobra é a obra que está em frente da chegada, que nenhuma fotografia da página anterior pode prever |
| D45 | Nenhum fotograma de câmara dentro da travessia | Tudo o que faça o canvas não ter desenho mostra o que está por baixo dele — o `<video>` da câmara, ou o preto dele. Eram duas janelas: a ponte saía **antes** de o vídeo ter imagem (medido: **58 ms** de preto por baixo, mais num telemóvel) e o `resize` da câmara limpava o buffer do canvas. A ponte passou a esperar **também** pelo primeiro fotograma **apresentado** pela câmara (`cameraFirstFrame()` com `requestVideoFrameCallback` — `loadeddata` não chega: decodificar não é apresentar, e num portão publicado isso deu segundos de preto com o evento já disparado), no máximo **3 s**; uma câmara recusada resolve de imediato, para a chegada não ficar à espera de um fotograma que não vem. O `resize` passou a ser seguido de uma renderização imediata (o canvas fica sem desenho **0,5–5,2 ms**, dentro do mesmo fotograma) |
| D46 | O retrato de uma porta é a vista da chegada | A janela de uma porta de mundo mostrava o **panorama** do destino, e a chegada mostra o panorama **mais as obras e as portas** — o corte era, por isso, uma troca de imagem (medido: **0,68 a 13,36** de salto nas seis portas). O retrato passa a ser um equirretangular desenhado **pela própria exposição** a partir do ponto onde o visitante vai aparecer: `?from=<origem>` deixa o `arrivalPoint` pôr a câmara (uma só casa para a geometria, L16) e a ferramenta desenha seis faces de cubo, convertidas para 3072×1536 (4096×2048 em duas portas — D47). É um **asset derivado** — regera-se quando a sala mudar — e um por porta, não um por destino: a chegada depende de onde se vem (as três portas da praia mostram três vistas). **Fechada em 2026-10-22 com o B20:** com o centro à altura dos olhos e a resolução da D47, o salto ficou em **0,21 a 0,40** nas seis portas (12 de 12 verificações), contra a meta de 0,50. **Emenda de 2026-10-24 (Fase 7):** com fundos animados a chegada passa a ser comparada no **primeiro fotograma depois de a ponte sair** — comparar 8 s depois media a fase da animação, não o corte —, e o salto fica em **0,13 a 0,47**, reprodutível. **Segunda emenda, no mesmo dia (D53):** a janela da porta deixou de ser o retrato parado e passou a desenhar o shader do destino **ao vivo** com o recorte das obras por cima; sozinha, a janela ao vivo levava o salto a **1,0 a 4,4** (os objectos apareciam no corte), e com o recorte voltou a **0,23 a 0,41** — agora com a janela a mexer-se. O instante do shader atravessa na ponte, para a chegada continuar a mesma animação |
| D47 | O retrato nasce à altura dos olhos, e com que tamanho | A esfera do retrato nascia no `portal.position` — no **chão** — e o retrato inteiro aparecia deslocado para baixo (~11 px num telemóvel); era isso a diferença de **3,6–3,9 na faixa de cima** do ecrã. O centro passa a ser `[x, altura do jogador, z]`, com a altura lida **uma só vez** de `cameras.player.position[1]` (L16): não é um campo novo nos dados, e a paralaxe da janela mantém-se porque a esfera continua a não seguir a câmara. Medido na porta 4 da praia: **1,56** com o centro no chão, **0,54** à altura dos olhos, 0,47 a +0,1 m; o raio quase não conta (500 dá 0,53 onde 120 dá 0,54) e a esfera a **seguir a câmara** foi medida e rejeitada (**25,30 / 7,30 / 1,17** conforme o raio). O tamanho do ficheiro (emenda de 2026-10-23, aprovada pelo autor ao fechar a fase): **3072×1536 q0,70 nos seis retratos** — 2560 falha com 0,58, 3072 fica em **0,17 a 0,41** e 4096 daria 0,40; a resolução a mais comprava 0,01 a 0,07 de margem e custava **32 MiB** de textura por retrato em vez de 18 MiB (a praia ia a **52 MiB**), contra o orçamento de imagem do ensaio **R14** (`1024×512` no telemóvel; 4096 «não recomendado para móvel»). A qualidade do JPEG quase não conta (a 4096, 0,85 dá 0,39 e 0,75 dá 0,40); quem manda é a resolução. A consequência aceita é a **L14** a avisar 6 vezes — ver o registo do B20. **Emenda de 2026-10-24 (Fase 7):** com o fundo shader o retrato deixou de carregar o céu e o mar e voltou ao padrão `2048×1024` q0,85 (os seis entre 90 e 172 kB), e os 6 avisos da L14 desapareceram |
| D48 | A gravação direta, e onde ela vive (**emenda da D2**) | **Um servidor local, `tools/server/serve.mjs`**, que serve a publicação **e** as rotas `/api/…`: Node sem dependências, a escutar **só** em `127.0.0.1:8123`, e a substituir o `python -m http.server` no dia-a-dia. **Não entra na publicação** (o GitHub Pages não corre Node) e **não serve** `.harness/`, `.git/` nem caminhos com `..` — o que não se publica não se serve. **Emenda da D2, não revogação:** o editor continua a **não** escrever sozinho; quem escreve é a ferramenta, e só quando o pedido vem de uma página servida por ela (o `Host` e o `Origin` são conferidos) |
| D49 | Gravar é um verbo novo, não um substituto | O «Exportar» da **D2 fica**: é o caminho que funciona em qualquer host, e é o que o GitHub Pages permite. O «Gravar» é um **botão ao lado**, que só existe quando o servidor diz o que é: a ferramenta põe `X-Zonas12-Serve` em **todas** as respostas, o editor faz um `HEAD` na raiz da publicação e lê-o — uma página publicada não traz o cabeçalho e não mostra botão nenhum, e nada no editor muda por isso. *(A primeira versão perguntava `GET /api/ping`; medido no B3, isso deixava um **404 na consola** de qualquer página servida por um host estático — e a consola limpa é uma regra do projeto, T8 —, e por isso a pergunta passou a ser um cabeçalho.)* O que sai por um lado sai igual pelo outro: gravar escreve o **mesmo texto** do export (2 espaços e `\n` final, ordem do ficheiro), para o `git diff` continuar a ser a prova de cada alteração |
| D50 | O servidor recusa o que o editor recusaria | Valida com o **mesmo** `js/scene/validation.js` (uma só implementação) e com o disco (`exists`, `imageSize`, `worldExists`), pela mesma regra do export: **erros travam, avisos não**. Respostas: JSON inválido → **400**; `world.slug` diferente do slug do URL → **400**; `version` diferente da do esquema → **400**; mundo que não existe em `data/worlds/` → **404** (gravar é **substituir**; criar um mundo continua a ser da ferramenta, **D31**); erros de validação → **422** com a lista; em nenhum destes casos se escreve um byte. A escrita é **atómica** (`*.tmp` + `rename`), para uma falha a meio não deixar um ficheiro truncado |
| D51 | Cópia de segurança antes de gravar | Uma por gravação, em `.harness/backups/worlds/<slug>/<AAAAMMDD-HHMMSS-mmm>.json` — **fora** do repositório (`.gitignore`) e da publicação, com o conteúdo **anterior**. A cópia é escrita **antes** do ficheiro do mundo e a resposta devolve-lhe o caminho, que o editor mostra na linha de estado: quem grava sabe sempre de onde pode voltar atrás, e não é o Git a ter de o lembrar |
| D52 | A orientação do telemóvel, e quando não se usa | O `look-controls` do A-Frame aplica os sensores **crus**, e é isso que faz do telemóvel uma janela para a cena. Num aparelho **sem giroscópio** o `beta`/`gamma` vêm do acelerómetro e o `alpha` do magnetómetro, com ruído de alta frequência, e a sala **treme** (medido no telemóvel fraco do autor, 2026-10-24). O `js/modules/orientation.js` mede o **piso de ruído** nos primeiros 6 s — o **segundo mais quieto** da segunda diferença das três componentes, para não confundir mão a mexer com sensor mau — e, acima de **0,5** graus/amostra², desliga o `magicWindowTrackingEnabled`. O que fica é o arrastar (`touchEnabled` não se toca); num aparelho com giroscópio nada muda. `?giroscopio=0` desliga à força. Alternativa recusada: filtro passa-baixo nosso no sensor (melhor em teoria, mas exige quaternion próprio e a permissão de movimento do iOS para um problema que só existe onde o sensor não presta) |
| D53 | A janela de uma porta mostra o destino **ao vivo**, e o que a ponte leva | Com o fundo shader, o retrato do D46 (uma fotografia) passou a ver-se **parado** ao lado de uma sala que anima. A janela de uma porta `preview` passa a desenhar o **shader do destino ao vivo** — o `shaderId` vem no dado e o validador exige que seja o da dimensão 0 do destino — **mais um recorte** do mesmo retrato, com o fundo transparente, que traz as obras e as portas. Sem o recorte a janela animava mas as obras apareciam de repente no corte (medido: **1,0 a 4,4** onde a meta é 0,50); com ele a costura voltou a **0,23 a 0,41** e a janela mexe-se. O instante do shader **viaja com a ponte** (`zonas12.tempoShader`, mesma validade e uso único do quadro): a chegada continua a animação de onde a janela ia. Com `?shader=0` a janela volta a ser o retrato inteiro — o mesmo caminho de reserva da sala. O retrato e o recorte saem do mesmo comando (`tools/scene/portrait.mjs`), para não poderem divergir |
| D54 | A travessia mostra o destino desde o primeiro instante | O que ficava no ecrã entre o clique e a página seguinte pintar era a **sala que se deixava, ainda a animar** — o autor descreveu-o como «vejo o ambiente onde eu estava» antes de o destino aparecer. No instante da travessia o fundo **congela** (o mecanismo do `prefers-reduced-motion`) e a câmara **encosta à janela**, 5 cm do lado de onde vem: a janela é uma máscara no plano da porta, e de lá enche o ecrã — o quadro que fica, e o que a ponte guarda, é o **destino**. Chegar ao centro da janela não serve e foi medido: em cima do plano a máscara não tem área em vista e vê-se a sala outra vez (a ponte dava **67,0** de salto); a 5 cm volta a **0,32**. A direcção do olhar não se toca — quem atravessa já está a olhar para dentro |
| D55 | A travessia deixa registo, e o destino fica no ecrã até ele chegar | O vídeo do autor mostra uma travessia em que o ecrã mostra o destino e, a seguir, a sala de onde ele vinha outra vez — **4,7 s** entre atravessar e o destino aparecer, medidos no vídeo (telemóvel, D-pad a fundo). Três coisas ficaram dessa leitura. **1)** O quadro que a ponte guarda passa a ficar também **por cima da página que sai** (`.ultimo-quadro-acima`, z-index acima da cena): enquanto a página seguinte não pinta, o ecrã mostra o destino, e nem o D-pad nem o sensor tiram o visitante de lá — sem isto, 100 ms de dedo no D-pad chegavam para a câmara sair da janela e voltar a ver-se a sala de origem. **2)** A preparação da travessia (congelar, encostar, capturar) está dentro de um `try` e a saída acontece **sempre**: uma excepção em qualquer das três deixava o visitante preso no mundo que ele já tinha atravessado, sem erro que se visse no telemóvel. **3)** O que ela fez fica escrito em `sessionStorage` (`zonas12.travessia`: de que mundo, que porta, para onde, encosto, captura, ecrã tapado e o erro se houve) e a sonda mostra-o — na página de chegada nomeia a travessia que trouxe o visitante, na de origem o mesmo registo com o mundo errado é a prova de que o pedido não saiu. O `seam` continua a comparar a ponte com o primeiro quadro do destino, por isso a régua do corte não ficou mais fácil |
| D56 | A dimensão `kind: "color"` pinta um fundo liso | Era o primeiro dos quatro valores que a D30 dava como validados e não construídos. A esfera do fundo é a mesma das outras dimensões — o mesmo stencil, o mesmo registo, o mesmo `release` — e o que muda é o material: um `MeshBasicMaterial` com a cor do dado em vez de uma textura. Não há imagem para descodificar nem shader para compilar, por isso não tem reserva nem política de cadência, e o `shaderStatus()` passa a dizer `mode: "color"` e a cor. A lei L1 passa a exigir raio a este fundo como aos outros: sem ele a esfera não tem tamanho e o validador diz porquê. O painel da dimensão oferece o tipo desde o mesmo dia — o que a cena constrói, o painel oferece |
| D57 | Um `interaction: "link"` navega para o endereço | O terceiro valor da D30, e o único que **levava o visitante a sair** da exposição — até aqui o endereço aparecia dentro do modal, o que num quiosque é uma parede. O componente do clique ganhou um modo: `modal` abre a janela da exposição, `link` faz `location.assign` para o endereço do dado. A escolha do modo é do dado (`interaction`), o construtor traduz, e o painel oferece as três interacções com o campo do endereço — que só aparece com `link`, a única em que significa alguma coisa. O `notBuilt` que existia no catálogo saiu: já não há nada a bloquear |
| D58 | Uma obra pode ser um modelo GLTF ou um texto | As duas primeiras coisas da D30, fechadas juntas porque partilham a pergunta «o que é uma obra». O `kind` deixou de ser derivado do asset e passou a ser campo do dado, com regras no esquema: `image`, `video` e `model` pedem um asset do seu tipo; `text` **proíbe** o asset e pede o `text` por língua. O modelo vem do catálogo (`type: "model"`, um `<a-asset-item>`, e o `size` escala-o por eixo — um GLTF não tem «largura em metros»). O texto é desenhado num canvas e aplicado a um plano com transparência: **sem fonte externa**, porque o `text` do A-Frame vai buscar a fonte à rede e a exposição tem de abrir sem rede e com a consola limpa (T8). Um `applyStencil` protegido contra o segundo registo foi preciso: o `model-loaded` chega depois do `loaded`, e registar duas vezes deixaria uma entrada órfã no núcleo (A4) |
| D59 | Uma porta pode andar, e o dado diz como | A §1 dizia «portais em movimento animado (fica para depois)»; a Fase 7 emendou-a. O `motion` do portal tem dois tipos — `spin`, que roda a porta sobre um eixo seu (`axis`, um vetor de 0/1), e `orbit`, que a faz dar a volta a um círculo de `radius` em torno de onde ela está e a vira com o círculo —, e um `period` em segundos por volta. Três promessas antigas continuam verdadeiras, e é isso que a lei e o instrumento provam: a colisão é lida do **mundo** (`portalGroup.worldToLocal` a cada quadro), por isso a travessia acontece onde a porta está e não onde o ficheiro a escreveu; o `prefers-reduced-motion` do visitante pára-a no instante em que está, como pára o shader; e uma porta em movimento **não pode** ser a porta de chegada (`arrivalFrom`) — o ponto de chegada vem do dado estático, e a L16 provaria uma coisa enquanto a cena fazia outra. O relógio é o do A-Frame (`tick(time)`) e não o `performance.now()`: a mesma cena anima o mesmo num quadro lento, e o instrumento pode perguntar «onde está a porta aos 10 s» e obter sempre a mesma resposta |
| D60 | Cada obra tem uma ficha, uma página gerada | O autor descreveu-a e deu o exemplo das Zonas 11 (`galerias/obra7.html`): nome da exposição, botão «voltar», o meio da obra, título, autor, sinopse. Na zonas12 a ficha é **uma página estática por obra**, escrita pela ferramenta `tools/artwork/build.mjs` a partir do mundo — `«<slug>/obras/<id>.html»` —, porque escrever N ficheiros à mão é a duplicação que a D20 fechou para os endereços. Decidiu-se que o clique na sala **substitui a página**: a ficha abre no mesmo separador (`interaction: "page"`, o novo valor por omissão das salas de produção) e o «voltar» traz a exposição, com o endereço derivado num sítio só (`js/scene/artwork-page.js`). O meio depende do `kind`: `image`, `video`, `model` (o GLTF no próprio A-Frame da exposição) e `text` mostram o ficheiro; `site` — o tipo novo, para jogos e esculturas interactivas — **tenta embutir** o site num iframe com a imagem da obra por baixo e o botão «Abrir o site» sempre visível. Um site que recusa ser embutido responde com um erro do browser que nenhuma página consegue detetar, e é por isso que o botão não depende do `load`: é a saída garantida. A lei **L20** compara o resumo que a ficha regista (`data-ficha`) com o dado de agora, para a página não envelhecer em silêncio |
| D61 | A ficha veste a identidade das Zonas 11, com a tabela das plataformas | O autor pediu «a página de obras será com esta» e deu o `galerias/obra7.html`. Copiou-se o **template** — preto absoluto, cartões `#1a1a1a`, acento `#FF5722`, Arial, `clamp()`, uma coluna de `clamp(320px, 90vw, 800px)` e uma linha por assunto — e a **tabela das plataformas** do `platform-detector.js` (YouTube, p5.js, Vimeo, OpenProcessing, Shadertoy), que é o que faz de um endereço colado no editor um meio a funcionar na ficha. Três desvios conscientes: o YouTube leva **`mute=1`** (o `autoplay` sem som é o único que os browsers deixam passar, e o que as Zonas 11 pediam era bloqueado); o **`?from=`** das Zonas 11 **não** se copiou, porque na zonas12 esse parâmetro é a porta de chegada do mundo (`arrival`) e voltar com ele faria a ficha anunciar uma chegada que não houve — o «voltar» é `../`, a pasta do mundo, e é a D28 a dizê-lo; e a classe do cartão não repete a do texto (`.linha` + `data-meio` em vez de `.linha titulo`), senão a `text-indent` da sinopse aplicava-se duas vezes, uma no cartão e outra no parágrafo |
| D62 | Uma ficha só, desenhada ao carregar — e o dado das obras por CSV | O autor pediu «somente 1 arquivo que ao carregar ele muda o conteúdo» e que o dado das obras entrasse por uma **folha de cálculo** com o endereço da obra e a imagem de capa. A D60 (uma página gerada por obra) foi substituída: `obra.html`, na raiz, lê `?mundo=<slug>&id=<n>&lang=xx`, vai buscar `data/worlds/<slug>.json` e desenha a ficha com o desenho da D61. Vinte e um ficheiros e o gerador foram apagados — duas fontes do mesmo conteúdo acabariam por discordar, e é a **L20** que passa a recusá-las (a página única existe, carrega `js/obra.js`, e a pasta `obras/` não voltou). O endereço leva o mundo e a obra na **query** precisamente para cada obra continuar a ser um endereço próprio: a medição (prevista, ainda sem IDs — **uma propriedade GA4 por mundo e uma para o portão**, `world.analytics.id`) precisa de distinguir as obras, e sem isso um ficheiro só apagava as páginas vistas por obra. Quem injeta o script é `js/scene/analytics.js` e não um snippet colado no HTML: **sem ID não acontece nada** (nem pedido, nem consola — o T8 e o offline ficam intactos) e, com ID, sai **um** `page_view` com o título da obra e o endereço sem `lang` nem cache-busting. O dado entra por `data/obras.csv` e por `tools/artwork/from-csv.mjs` (com `--check`), que se recusa a escrever um mundo que não passe as leis. O custo, dito: **sem JavaScript a ficha não mostra a obra** — a troca foi pedida, e é a mesma que a exposição já faz |
| D63 | Voltar da ficha ao **sítio onde se estava**, não ao início do mundo | O autor: «ao clicar no botão sair da obra, volto para um local determinado da cena que é diferente do que eu entrei; gostaria de voltar no ponto onde cliquei na obra». O clique numa obra `page` guarda o **ponto de vista** — posição, olhar (`yaw`/`pitch`) e dimensão activa — em `sessionStorage` (`zonas12.volta`), e o «voltar» da ficha pede o regresso com `?volta=1`. Três decisões dentro desta: a memória é **do separador** e morre com ele (não é uma preferência do visitante, é a memória de um gesto); vale **um** regresso, porque um ponto que fica colado devolve o visitante a um sítio que já não é o que ele deixou (a leitura apaga); e tem prazo de **30 min**, para uma sessão aberta de ontem não saltar para meio de uma sala. Escrever a posição foi o primeiro obstáculo: `object3D.position` **não pega** numa câmara acabada de criar (o componente `position` ainda não inicializou e repõe o dado — a câmara parecia aplicar e voltava a `0, 1.6, 0`); passou a escrever-se pelo **atributo**, e outra vez no `loaded` quando a entidade ainda não carregou. O olhar fica nos objectos do `look-controls` (`yawObject`/`pitchObject`), que é de onde ele o lê a cada movimento — escrever só na rotação da entidade fazia a câmara saltar para a pose antiga ao primeiro arrasto |
| D64 | Um asset pode ser **um endereço**, não só um ficheiro do projeto | O autor escolheu, para a capa de uma obra cujo conteúdo é um vídeo do YouTube, o **thumbnail que o YouTube já serve** (`i.ytimg.com/vi/<id>/maxresdefault.jpg`) em vez de um ficheiro copiado para o repositório. O `assets` já era o sítio único onde um caminho aparece (D20); o que faltava era aceitar que esse caminho seja `https://…`. Três consequências, todas medidas: as perguntas de disco (**L9** existe? **L14** que forma tem? **L10** o nome segue a regra?) deixam de ter resposta deste lado e passam a **nota de não verificado** em vez de erro ou de aviso (um aviso partiria o T8, que exige a consola limpa); a exposição passa a **depender do servidor** que serve o ficheiro — dito na nota; e o importador do CSV aceita uma `capa` remota sem a perguntar ao disco. O `crossorigin="anonymous"` que o construtor já punha nos assets faz o resto: o YouTube responde `Access-Control-Allow-Origin: *`, por isso a textura carrega na sala **e** na ficha (medido: mapa de 1280×720 na malha da obra, e `naturalWidth > 0` na capa da ficha). O recurso é para usar com critério: um asset remoto é uma dependência de rede na exposição |
| D65 | A capa de uma obra **por tentativas**: YouTube → capa do CSV → imagem padrão de aviso | O autor: «podemos fazer um metodo que ele busca a capa do youtube se não conseguir ele faz um fallback para imagem indicada… se nada der certo, ele mostra uma imagem padrão avisando que a capa da obra esta com problema e é necessario avisar o adminstrador da galeria». `js/scene/cover.js` tem a cadeia: (1) o **thumbnail do YouTube**, derivado do próprio endereço do vídeo (`i.ytimg.com/vi/<id>/hqdefault.jpg` — `maxresdefault` não existe para todos os vídeos, `hqdefault` existe), sem ninguém escrever nada no dado; (2) a **capa do CSV**, que é opcional e pode ser um endereço ou um ficheiro do projeto (D64); (3) `assets/covers/sem-capa.svg`, a imagem que diz «Capa indisponível · avisar o administrador da galeria» nas duas línguas. A resolução é feita **a carregar** (`Image` + `onerror`), porque é a única coisa que responde às duas perguntas ao mesmo tempo — «existe?» e «descodifica?» — e um `HEAD` não responde à segunda. A mesma cadeia serve a ficha (`<img>`, com `data-capa-de` a dizer qual ganhou) e a sala (o construtor põe o `<img>` resolvido em `<a-assets>` como `capa-<id>` e a malha usa-o). Duas consequências que a medição impôs: a malha tem de esperar que a imagem esteja descodificada (sem isso a consola diz «Texture marked for update but image is incomplete», apanhado pela D40), e uma célula `capa` com **`-`** tira a capa do dado, para a cadeia poder começar no YouTube sem nada escrito |
| D66 | O A/B do **R14** faz-se numa página só: dois lados, uma recarga, um bloco | O autor escolheu `proximo=ensaio` para o passo seguinte ao fecho da Fase 8. O problema que isto resolve é de **protocolo**, não de código: fechar o R14 exige comparar o shader com a imagem no mesmo aparelho e na mesma sala, e a sonda mostra um lado de cada vez — duas páginas, dois relatórios, três aparelhos. Com `?ensaio=1` (`js/modules/ensaio.js`) a página faz o par sozinha: espera pela cena, aquece **10 s** e mede **45 s** do lado que o endereço diz (o shader, por omissão), guarda o resultado em `sessionStorage` (`zonas12.ensaio`) e **recarrega o mesmo endereço** com `&fase=imagem&shader=0`; a segunda fase mede, junta os dois lados e mostra **um** bloco com botão **Copiar** e outro **Repetir**. O relatório traz, por fase, o fundo (modo e `shaderId`), os quadros/s, o **pior quadro** e quantos passaram do dobro da mediana, a cadência, as atualizações, o pixelRatio com o mínimo e o máximo que a escada visitou, os atrasos e os eventos — mais a comparação dos dois lados, o aparelho e a **GPU** (`WEBGL_debug_renderer_info`), que é o que distingue os três aparelhos. A medição impôs uma linha que a sonda não tinha: numa máquina rápida os quadros ficam presos ao **vsync** e os dois lados empatam (medido no portátil com RTX 4060: **165,3 → 164,3** quadros/s, **−0,6%**, quando os mesmos dois lados num Android fraco deram **45,5** contra **50,4**), portanto o número que discrimina é o pior quadro e os quadros lentos. No fim a sessão fica limpa e o endereço volta a `?ensaio=1`: uma recarga é um ensaio novo, não metade do anterior. A bateria `tools/regression/ensaio.mjs` (**12/12**, em `all.mjs --full`) corre as duas fases em 3 s cada e verifica o que se pode estragar em silêncio: que a recarga chega, que o resumo traz os dois lados e que não sobra nada guardado. **Emenda de 2026-10-27:** o contador, a janela de medida e o divisor dos quadros passaram a sair do **mesmo** `performance.now()` — a janela abre no primeiro quadro desenhado depois do aquecimento, a aba escondida **pausa** a fase (e o tempo escondido vai declarado como `pausada`), e cada fase mostra `janela X s (desvio ±Y s)` com as duas janelas lado a lado na comparação. A bateria passou a **19 de 19** (relógio, janelas e pausa). Ver § R14 |

**D48 a D51 fechadas em 2026-10-23** — a **Fase 5** (a gravação direta), que a Fase 4 tinha deixado
condicionada à fricção de exportar. O que se decidiu, e o que se recusou: **um** servidor de
ferramenta (D48) que serve a publicação e grava, em vez de um serviço à parte; o **«Exportar» fica**
(D49) e o «Gravar» é um botão que só existe com servidor, porque a página publicada tem de continuar
a funcionar inteira; o servidor **recusa com o mesmo validador e a mesma regra do export** (D50) —
e não cria mundos, porque criar um mundo é da ferramenta da D31; e **cada gravação deixa uma cópia**
(D51) em `.harness/backups/worlds/`, fora do repositório e da publicação. A D2 passa a ter data de
emenda: o editor não escreve, a ferramenta escreve. **Executada e medida de B1 a B4** — ver §9.

**Roadmap aprovado em 2026-10-12.**

**D14 fechada em 2026-10-13** — mundos: §11 (efeitos), leis L9–L18 em §8, testes T10–T12 em
§10 e Fase 3B em §9. Planeamento: nada implementado.

**D15 fechada em 2026-10-13, emendada no mesmo dia** — harness de skills: estado medido em §3,
decisão (e emenda) em §11, e a limpeza da Fase 6 em §9. **Reabre e substitui a D8.** A emenda
corrigiu um índice que omitia **13** `SKILL.md` e **75** `.md`, porque o validador só corria
numa direção; passou a exigir **três passes** — a inversa e a das quantidades. Não é código de produção: `.harness/` está fora
do repositório (`.gitignore`), por isso nada disto altera o que se publica.

**D16 fechada em 2026-10-14** — a lei **L6** passa a enunciar o **invariante** de ordenação
(`stencil: true` na cena e `sortObjects` ativo) em vez da **ação** que a criava: medido na fonte
do A-Frame 1.8.0, é o framework que fixa `sortObjects = true` na inicialização e a ordenação de
opacos respeita o `renderOrder`. **Nada de comportamento mudou** — a única linha de código
tocada foi um comentário. Na mesma ronda fecharam-se as pendências de SEO e de acessibilidade do
`index.html` (registo em `HARNESS_LOG.md`).

**D17 fechada em 2026-10-14** — o validador do índice passa a ter **quatro** passes: a nova
pergunta o *frontmatter* de cada agent contra o disco, a única direção que as outras três não
tomavam — e é exatamente a direção em que o `refactoring-patterns` do `code-archaeologist`
passou. Na mesma ronda o `checklist.py` passou a correr as verificações do projeto
(`project_sync.py` — existia, adaptado, e ninguém o chamava) e o `lint_runner.py` deixou de
ficar verde sem verificar nada: em vez de "No linters found" com código 0, parseia os módulos
com o `node`. Registo e medições em `HARNESS_LOG.md`.

**D18 fechada em 2026-10-14** — a quarentena do harness **fica como está**, com o motivo escrito:
sem histórico Git dentro do `.harness/`, apagar é irreversível, e cada um dos 6 ficheiros já tem
estatuto declarado no `garbage/README.md`. Fecha o último ponto que a Fase 6 tinha deixado em
aberto — a Fase 6 passa a ter só os testes de §10 por fazer.

**D20 a D23 fechadas em 2026-10-15** — o contrato da **Fase 3** (plano em §9, registado no mesmo
dia): o **catálogo de assets** (fecho do **A6**), o **texto de conteúdo por língua** (fecho do
**R4**), os **dois eixos do portal** na Fase 3B e o **`version: 2`** com o **`?scene=example`**.
O detalhe de cada uma está na tabela de §11; o A6 e o R4 fecham no dado nos blocos B3 e B4.
Nada implementado.

**D24 a D28 fechadas em 2026-10-15** — o contrato da **Fase 3B** (o plano está em §9, registado no
mesmo dia e **antes** de mexer em código). A **D24** decide o que a D14 não fixava — a divisão
concreta da cena em mundos —, a **D25** diz o que a porta passa a ser no formato **v3**, a **D26**
como o retrato existe (a dimensão derivada da L15), a **D27** onde ficam os assets e os retratos e
a **D28** como cada mundo se identifica. O que a fase vai entregar, bloco a bloco, e as metas
medidas estão na §9. *(D27 emendada ao fechar o B5 e D28 ao fechar o B7; execução de B1 a B10 feita
e medida — ver a nota de 2026-10-16 no topo e os blocos em §9.)*

**D29 fechada em 2026-10-16** — a **porta que faltava na praia**: a porta 5 passa a regresso ao
portão, acabando com a porta duplicada que a cena anterior trazia. Não foi planeada: apareceu
**medida**, no aviso que a primeira ronda de portas do B7 levantou (§9, nota do B7), e é a prova de
que o instrumento vale mais do que a estimativa — a cena anterior tinha a mesma duplicação desde a
Fase 2 e nada a assinalava.

**D30 a D36 fechadas em 2026-10-16** — o contrato da **Fase 4** (a página de edição), escrito no
**B0**: o plano está em §9, foi escrito **antes** de mexer em código e três medições mudaram-no — os
módulos **não** carregam numa página sem a UI da exposição (uma excepção medida, que fez nascer o
bloco **B2**), o `remove()` do construtor de cena **funciona** (o **R8** desce de risco a meta
medida) e reconstruir a cena **recarrega os assets** (o que fixa a **D33**). As decisões fecham o
**R9** (aviso em vez de implementação), o que a §7 pedia e o editor **não pode** fazer (a pasta de um
mundo), a navegação dentro da pré-visualização, a webcam, o desfazer e a estrutura dos ficheiros.
Nada implementado.

**B9 fechado em 2026-10-20** — as ferramentas transversais do editor e, com elas, o **R9**: a
página passou a responder às perguntas que eram só da linha de comando (**L9** e **L14**, por
`Image` e `HEAD`), o que levou o «Por verificar» a **0** nos 5 mundos; há **desfazer** por
instantâneos (**D35**, 50 passos, e desfazer dá o ficheiro de volta byte a byte), a marca
«alterado» com a guarda de saída (**D32**) e a exportação que **valida tudo antes de exportar**;
e o validador passou a **avisar** os quatro valores que o esquema aceita e a cena não constrói
(**D30**), com o `laws-selftest.mjs` em **20 de 20**. A bateria do editor fechou em **35 de 35** e a
exposição ficou com os mesmos invariantes (§9).

**Fase 4 fechada em 2026-10-20** — o **B10** entregou a aceitação da fase, o README e o marco. O
**R11** foi resolvido como estava decidido: as duas obras do céu foram re-arranjadas **com o próprio
editor** (de `z = -110` para `z = -131`, em frente da chegada), o ficheiro exportado substituiu o
antigo com **só** as duas posições mudadas, e a medida passou de **0** para **2** obras no primeiro
plano de quem chega da praia. A aceitação correu item a item: o exercício das quatro operações
(1 dimensão + 2 obras + 1 portal) feito **só pela interface** e o mundo exportado a render (T4, T5,
T6, T9, T10/T12 e T2/T3 a passar), a bateria dos doze nas **5** páginas, o **T8** com **0** erros e
**0** avisos e o **T7/T11** a passar nas três salas, as **35** verificações do editor, o
`validate.mjs` a **0** e as **17** metas de §9 medidas uma a uma. O exercício mostrou ainda o que
faz um mundo ser um mundo: sem a pasta (D28) e sem uma porta que o ligue ao portão, o validador
recusa-o — e por isso o `sala-teste` foi apagado depois de medido. **Marco: a branch `v0.0.7`.**

**B11, no mesmo dia, depois de o autor testar o publicado** — a **chegada por uma porta** deixou de
pedir licença: com `?from=` na URL a exposição arranca sozinha (**D37**), o ecrã de entrada fica para
a primeira visita e volta como recuo se a câmara for recusada. Medido antes de mexer: a câmara só é
pedida no portão e nunca numa mudança de dimensão — o que se repetia era o ecrã de entrada, porque
cada mundo é uma página (D24). **5 de 5** verificações e a bateria dos doze com os mesmos números.

**B12, ainda no mesmo dia** — a **porta que volta ao portão** passou a mostrar a **realidade ao vivo**
pela janela (**D38**): a sala declara uma dimensão `kind: "camera"` e a porta um `dimension-pair` com
ela, e a matriz da L18 ganha a exceção «par com a câmara + `navigate` para o mundo de entrada», que
não mente porque o que a janela mostra é o que espera o visitante. Medido com capturas dos **dois
lados** da porta, na cidade e na praia; `validate.mjs` **0**, `laws-selftest` **21 de 21**, a bateria
das duas salas a passar (com os contadores de pixels a mudarem por o aspecto da câmara passar a ser
corrigido) e o editor em **35 de 35** com o export byte-idêntico.

**B13, no dia seguinte** — o **nome de cada porta** (**D39**), pedido do autor para o nosso debug:
com a tecla `D` a exposição mostra, acima de cada porta, `#2 · Cidade 360º ↔ Realidade → Portão` ou
`#3 · retrato-praia → praia` — o id, o que a janela mostra (os nomes das dimensões, o retrato) e para
onde leva (o *slug* do mundo; o portão pelo catálogo), tudo tirado do dado e escrito pelo construtor.
No editor aparece sem tecla nenhuma. Um *sprite*, para se ler dos dois lados da porta. Medido:
**23 de 23** (0 nomes sem `D`, um por porta com ela nos 4 mundos, o editor desde o arranque, e 10
portas com nome criadas e destruídas sem deixar textura nem nó), a bateria dos doze nos 5 mundos, o
editor em **35 de 35** e a consola com 0 erros e 0 avisos.

**B14, ainda no mesmo dia** — o **nome das obras** (**D40**), com a mesma tecla: acima de cada obra
aparece `#0 · galeriaFoto1 · Cidade 360º · modal` — o título (quando o dado tem um) ou o id do asset, a
dimensão pelo nome e a interacção pela palavra do ficheiro. O desenho do nome passou a ser **um só**
para portas e obras (`js/modules/label.js`), para não divergirem. Medido: **21 de 21** (nome por obra
só com `D`, o editor sem tecla, 10 obras com nome criadas e destruídas sem deixar textura nem nó, a
tecla no portão sem obras), a bateria dos doze nos 5 mundos, o editor em **35 de 35** e a consola com
0 erros e 0 avisos.

**B15, depois do teste no telemóvel** — o botão «ATIVAR EXPOSIÇÃO» passou a **seguir a câmara** e não
o clique (**D41**): esconde-se no instante em que há um stream (mesmo que a câmara não esteja à vista,
como numa sala, onde ela é só a janela da porta) e nunca volta com um stream vivo; e uma visita em que
o browser **já tem a permissão** arranca sozinha, porque a permissão é o registo do gesto. Medido:
**7 de 7** em três instâncias (sem permissão, com permissão, e em emulação de telemóvel 390×844 — onde
o botão sai e o D-pad entra), com a consola e a bateria nos mesmos números.

**B16, a partir de um vídeo do autor** — o botão deixou de aparecer **a meio de uma transição entre
portais** (**D42**): estava visível no markup desde a primeira pintura e só era escondido depois de a
cena carregar. Passou a estar escondido no markup, com a decisão tomada antes do trabalho pesado, e a
chegada mostra «Carregando…» em vez de um ecrã preto. A pergunta da permissão (D41) ganhou um
**tempo-limite de 1 s**, porque uma resposta que não chega travava a exposição. Medido: **9 de 9** com
uma sonda que anota cada mudança numa rede de 800 kB/s (o botão **nunca** aparece numa chegada; na
primeira visita aparece **antes** dos assets), sem regressões na bateria, no editor, nas etiquetas e
nas leis.

**B17, a partir de um segundo vídeo do autor** — a travessia deixou de passar pelo **preto** (**D43**):
lido o vídeo fotograma a fotograma (foi preciso dar `Range` ao servidor do arnês, senão o Chrome não
procura dentro do mp4), o preto estava nos dois sítios onde há uma travessia — 0,85 s e uma amostra.
Cada mundo é uma página (D24) e todas as portas navegam, por isso «câmara, mundos e dimensões» é o
mesmo caso. A página que sai deixa o **último quadro** composto (vídeo + canvas) e a que chega
pinta-o antes de tudo, desvanecendo-o quando há cena (`js/arrival-frame.js`, o único script clássico,
porque tem de correr antes da primeira pintura). Medido: **2 → 0** amostras escuras, o quadro é a
imagem do ecrã (**76 kB**, brilho **191,5**), sai aos **746 ms**, e **7 de 7** na bateria do bloco —
sem regressões no resto. Verificado também na **versão publicada** (GitHub Pages): **122** amostras
numa travessia a pé, **0** escuras.

**B18, no mesmo dia, por recusa do autor** — «não deveria ter… outra imagem… sem a impressão de
transição» (**D44**): a ponte deixou de se desvanecer (sai num fotograma só) e a linha «Carregando…»
deixou de aparecer quando há ponte. Medida a costura com uma assinatura 4×4 de luminosidade, amostra
a amostra: a ponte é o ecrã (**0,22** de diferença), o mundo difere dela em **3,94** — o tamanho de um
passo (o maior a caminhar é **2,69**) —, e o que resta é a obra que está em frente da chegada, que uma
fotografia da página anterior não pode adivinhar. **8 de 8**.

**B19, no mesmo dia, com o segundo vídeo** — o autor viu **um fotograma com a câmara** a meio da
travessia, no ir e no voltar (**D45**). Eram duas janelas para o vídeo aparecer: a ponte saía **58 ms
antes** de o `<video>` ter imagem, e o `resize` da câmara limpava o buffer do canvas. A ponte passou a
esperar também pelo primeiro fotograma **apresentado** pela câmara (no máximo 3 s; recusada resolve
logo) e o `resize` passou a ser seguido de uma renderização imediata — o canvas fica sem desenho **0,5 a
5,2 ms**, dentro do mesmo fotograma. **9 de 9**.

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
| 5 | `i18n/pt.json` com as **5** chaves que já existiam na interface (`app.title`, `app.loading`, `app.start`, `artwork.back`, `camera.error`) | ✅ |
| 6 | Conversor `tools/html-to-scene-json/convert.mjs` *(hoje `tools/migration/convert.mjs`)* | ✅ |
| 7 | Validador `tools/html-to-scene-json/validate.mjs` (contagens, integridade, L1, L4, L5) *(hoje `tools/scene/validate.mjs`, sobre o módulo partilhado: forma + L1, L4, L5, L9, L12 — §8)* | ✅ |
| 8 | `data/scene.json` + `data/scene-example.json` gerados | ✅ |
| 9 | Linha de base medida e registada (§10) | ✅ |

Ficou também corrigida, nesta fase, uma regressão da limpeza da raiz: o `<link rel="icon">`
apontava para um ficheiro que saiu da raiz e o browser passou a pedir `/favicon.ico` (404 na
consola). Passou a `<link rel="icon" href="data:,">`, que não pede nada — a console voltou a
0 erros (T8).

### Fase 2 — concluída em 2026-10-15 (os 4 módulos)

`js/app.js` passou de **546 para 78 linhas** e os quatro módulos vivem em `js/modules/`
(`camera.js`, `artwork.js`, `dimension.js`, `portal.js`), renomeados ao mover (glossário §5.7) e
com os pontos **A4, A5 e A7** de §2.1 fechados no mesmo passo (**A2 e A3** tinham fechado em
2026-10-15). A linha de base de §10 continua a dar os mesmos números e o T9 foi medido com **20**
ciclos de criação/destruição: **1** ouvinte de teclado na carga e **1** no fim, com o registo de
portais de volta a **8** e nada deixado na cena. O conversor, regenerado, dá **0 diferenças** no
`data/scene.json`, e a varredura de poses dá **T2** e **T3** a passar.

**O plano da fase ficou em §9:** o corte do `js/app.js` bloco a bloco, os **8 blocos de execução**
(B0–B7, com o item A que cada um fecha), as **metas de sucesso** (o comportamento de §10 e dez
metas de arquitetura, M1–M10) e a tabela do que cada bloco entregou.

### Fase 3 — concluída em 2026-10-15 (a cena vem de dados)

A cena deixou de estar escrita à mão no `index.html` (**240 → 82 linhas**) e passa a ser construída
de **`data/scene.json`**, no formato **v2**: o catálogo de assets da **D20**, o texto por língua da
**D21** e a versão da **D23** (o detalhe está na tabela da §11). O `js/scene/` tem os três
ficheiros que a fase prometia — `schema.js` (a forma), `validation.js` (a forma e as leis **L1,
L4, L5, L9, L12**, com 17 de 17 avarias injetadas detetadas) e `scene-builder.js` (o único que
conhece o A-Frame) — e o **A6** e o **R4** fecharam **no dado**, com a prova da migração:
**190 valores comparados com o JSON antigo, 0 diferenças não previstas**.

Duas coisas ficaram melhores do que a fase prometia: o **conversor da Fase 0 deixa de poder
correr** (guarda, `tools/migration/`: sem entidades no HTML recusa-se e não escreve — antes,
correr-lo escrevia uma cena vazia por cima da boa) e o **validador passou a ser um só módulo**,
importado pelo browser, pela linha de comando (`tools/scene/`) e, na Fase 4, pelo editor.

Os nove testes de §10 continuam com os mesmos números, medidos no B7 de ponta a ponta (§9), e as
metas de arquitetura M1–M4 fecharam: nenhuma marca de entidade no `index.html`, 82 linhas, o
`AFRAME` só no construtor e o núcleo a importar só a si próprio.

**O que a fase não fez, de propósito:** os dois eixos do portal (ficam na 3B, **D22**), a interface
a ler o catálogo `i18n` (**R3**, Fase 4), o editor — que traz o `update`/`list` das fábricas — e os
mundos.

**Fecho:** publicada no `main` (o GitHub Pages serve o `main`) e **funcional nas três versões
testadas pelo autor em 2026-10-15** — local, a publicada e no telemóvel. Marcada como **`v0.0.5`**
(branch no commit do fecho); a anterior é a `v0.0.4`, do fim da Fase 2.

## Fase 3B — fechada (2026-10-16)

**A fase está feita e medida, bloco a bloco.** A **D14** (§11) foi decidida em 2026-10-13 e o
contrato que faltava fechou-se a 2026-10-15 com **D24–D28**, mais a **D29** que a execução obrigou
(a porta que faltava na praia). O que ficou entregue: **quatro mundos** — `gate` na raiz, com a
câmara/AR, e as salas `scene1`, `scene2` e `scene3` (a cidade, a praia e o céu), uma dimensão cada — mais o **fixture** de duas
dimensões; cada mundo com o seu ficheiro (`data/worlds/<slug>.json`, formato **v3**), o seu
**endereço** e o seu arranque (o mesmo `index.html` fora da linha do `<base>`); as **8 portas de
hoje** (mais a quarta do fixture) a **navegar**, seis com retrato e duas sem janela; o retrato como
**dimensão derivada** na banda da L15; os assets divididos por tipo (D7); a lei **L19** e o
**verificador dos arranques** nas ferramentas; e a bateria de testes — T1/T7, T2/T3, T8/T9, T10,
T11 e T12 — medida em cada mundo (o detalhe de cada bloco, com os números, está na §9). Agora que a
cena vem de dados, criar um mundo é escrever um ficheiro — era exactamente o que faltava para a
fase valer a pena.

**O próximo passo é a Fase 4 (a página de edição, §9)**, que já tem o que precisa: o formato com um
dono único, o validador que corre na consola, na linha de comando e no editor, e os módulos com
fábrica e `remove()`. Antes dela ficam três itens **do autor**, em §14 — o retrato do portão (R10),
a orientação da chegada no céu (R11) e o T5 por re-medir quando o desenho mudar (R12).

---

## 14. Pendências registadas (2026-10-16)

O que fica em aberto depois de a documentação ser alinhada com o código. Cada linha tem o
motivo e o que a fecha. **R5–R7 nasceram do plano da Fase 2 (§9) e foram fechadas no mesmo dia**
(decisão **D19**, §11). **R8 e R9 nasceram da revisão de documentação a seguir ao fecho da
Fase 3** — são as duas coisas que a Fase 3 deixou construídas mas **não exercitadas**. **R10–R12 nasceram do fecho da Fase 3B**: duas decisões que são do autor (o retrato do portão e a orientação
da chegada no céu) e um teste que ficou por re-medir por não haver mudança que o justificasse — esse
**fechou-se a 2026-10-16**, quando a bateria dos doze testes (§9) passou a trazer o rig do **T5**
como instrumento. **R13 nasceu do plano da Fase 4** (§9), medido **antes** de mexer em código: os
módulos **não** carregam numa página sem a UI da exposição.

### R14 — Fundos esféricos procedurais e governor de resolução (**FECHADA em 2026-10-27**)

**Plano:** entra na **Fase 7**, bloco **B9** (§9). O que a fecha é o A/B controlado nos três
aparelhos; a produção foi adotada antes desse registo, por decisão do autor, com a escada do R15 e o
`fallbackAsset` como rede.

**Estado a 2026-10-25 (fecho da Fase 7):** a fase fechou e este número **não**: o par `shader ×
imagem` está medido em **dois** aparelhos (o telemóvel fraco do autor e o desktop — §14, registo do
R14) e falta o **terceiro** (Adreno 630). A fase fechou como o plano previu — com o que foi medido
declarado e o que faltou registado —, e não se dá por fechado um A/B de três com dois. Tudo o resto do
R14 e do R15 está entregue e medido: a política 20 → 15 FPS → estático, o piso de pixelRatio **1**, a
primeira frame a `min(DPR, 2)` com a escada a subir, a bisseção do teto, o validador `tools/shader/` e
a sonda de campo com que o autor lê os números no telemóvel.

**Estado a 2026-10-24 (B9):** o shader é o **fundo de produção** das três salas — `scene1` →
`grade-neon`, `scene2` → `por-do-sol`, `scene3` → `nuvens` —, com o panorama como `fallbackAsset` e
`?shader=0` como escape. O A/B **não foi registado**; a decisão foi tomada com o teste do autor no
telemóvel fraco e no desktop. O `kind: "shader"` está no esquema (`shaderId` de lista interna,
`fallbackAsset` validado), o fixture abre-se com `?scene=shader`, o instrumento
`tools/regression/shader.mjs` mede a política e as páginas (entra em `all.mjs --full`) e
`tools/shader/` valida/instala um shader novo (compila e exige **19 de 20** atualizações/s).

**Fechado o instrumento (2026-10-24):** `node tools/shader/validate.mjs --all` passa nos **5**
shaders instalados (19,8–20,0 atualizações/s, p95 de 6,2 ms). `--force` perdoa **só** a cadência — um
corpo que não compila ou que não desenha nada é recusado sempre, porque um fundo preto não é um
ensaio (era o buraco que o ensaio do instalador apanhou). Um `.glsl` gravado no Windows chega com
**BOM** e é lido sem ele: o BOM é transporte, não é shader, e sem isso a recusa vinha como um erro de
compilação incompreensível. `all.mjs --full` deu **12 de 12 baterias** em **604 s**, com a costura em
**12 de 12** (0,13 a 0,47) e os retratos de volta ao padrão de 2048.

**O A/B no build publicado, lido com a sonda de campo (2026-10-24).** Duas leituras no mesmo
aparelho e no mesmo estado térmico, separadas por ~2 minutos, com `?sonda=1`:

| aparelho (DPR) | fundo | pixelRatio | pixels | quadros/s | cadência |
| --- | --- | --- | --- | --- | --- |
| Android 10, PowerVR (411×748, 2,63) | `grade-neon` | 2,25 | ≈1,56 Mpx | **45,5** | 20,0/s (22% de atrasos) |
| Android 10, PowerVR (411×748, 2,63) | imagem (`?shader=0`) | 2,63 (nativo) | ≈2,10 Mpx | **50,4** | — |
| Windows, desktop (1580×791, 1,17) | `grade-neon` | 1,17 (nativo) | ≈2,16 Mpx | **165** | 20,0/s, 0 atrasos |

O que isto responde: **numa GPU fraca o shader custa fluidez que a política não recupera.** O
panorama desenha **35% mais** pixels e ainda vai **11% mais depressa** — o custo do `grade-neon` não é
resolução, é o fragment por pixel. A política responde com o único recurso que tem (tirar 27% dos
pixels, 2,63 → 2,25) e fica ~10% abaixo da imagem parada, com a cadência de 20/s cumprida. No
desktop não há diferença que se meça: DPR nativo, **0** atrasos, **nenhum** evento da escada.
`prefers-reduced-motion` verificado no build publicado (estático, 0 atualizações) e na bateria.

**O A/B pelo ensaio automático (2026-10-27), primeiro dos três aparelhos.** O autor correu o ensaio no
telemóvel fraco, na variante curta (`?ensaio=1&segundos=10&aquecimento=3`), e as duas janelas saíram
iguais (**9,99 s** e **9,99 s**, desvio **−0,01 s**): o par é comparável.

| aparelho (DPR) | fundo | janela | quadros/s | pior quadro | lentos | pixelRatio | cadência | atrasos |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Android 10, PowerVR GE8320 (411×748, 2,63) | `grade-neon` | 9,99 s | **49,4** (493 quadros) | **132,2 ms** | 54 | **1,6** (de 2 a 1,6, **1** evento) | 20/s → 19,6/s | **71** de 217 |
| idem | imagem (`?shader=0`) | 9,99 s | **55,4** (553 quadros) | **66,1 ms** | 28 | 2,63 (nativo) | — | — |

O que isto diz, e é a mesma conclusão de 2026-10-24 por outro caminho: a imagem vai **12,1% mais
depressa** (49,4 → 55,4) e o pior quadro é **metade** (132 ms contra 66 ms). O detalhe que fecha o
argumento é o pixelRatio: o shader desenhou com **1,6**, ou seja `(1,6 / 2,63)²` ≈ **37%** dos pixels que a
imagem desenhou, e mesmo assim foi mais lento — o custo do `grade-neon` não é resolução, é o fragment por
pixel (≈ **3×** por pixel). A política respondeu como sabe (a escada desceu de 2 para 1,6, o único evento
do ensaio) e ainda assim **71 dos 217** quadros do shader chegaram tarde — 33% da cadência de 20/s, contra
0 na imagem, que não tem cadência. É o aparelho onde o `?shader=0` deixa de ser escape e passa a ser a
escolha razoável.

**A repetição com as 45 s (2026-10-27), e é esta a linha do registo:**

| fundo | janela | quadros/s | pior quadro | lentos (>2× a mediana) | pixelRatio | cadência | atrasos |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `grade-neon` | 44,98 s (−0,02) | **40,7** (1829) | **231,4 ms** | 24 | **2,456** (min 2 · máx **2,625** · **4 eventos**) | 20/s → 19,8/s | **238** de 1054 (22,6%) |
| imagem | 45 s (+0) | **46,9** (2111) | **66,2 ms** | 319 | 2,63 (nativo) | — | — |

A comparação de fundo: **+15,2%** para a imagem (40,7 → 46,9) e o pior quadro do shader **3,5× pior**
(231,4 ms contra 66,2 ms). O veredicto do fraco não mudou com a janela maior (era +12,1% em 10 s), o que
diz que a conclusão é robusta ao tempo de medida.

**As 45 s também mostram o que a corrida curta não podia:** o mesmo aparelho, na mesma sala, desceu de
**49,4 para 40,7 quadros/s** no shader e de **55,4 para 46,9** na imagem — cerca de **18% nos dois lados**.
É o **throttling térmico**: a corrida de 10 s foi um jato a frio, a de 45 s é o que um visitante tem depois
de dois minutos a olhar em volta. É o argumento a favor do protocolo por omissão, e a razão pela qual os
10 s não servem para o registo.

**A escada não converge neste aparelho.** Com 45 s o pixelRatio foi de 2 até **2,625** (o dpr nativo) e
voltou a **2,456**, com **4 eventos** — a procurar. Na corrida de 10 s tinha descido a 1,6 com um evento.
Os **238 atrasos em 1054** (22,6%) dizem o mesmo por outro caminho: a cadência de 20/s cumpre-se **em
média** (19,8/s) mas falha um quinto das vezes, e o estado não é estável — oscila. Numa exposição isto vê-se
como trepidação periódica, não como um fundo liso.

**Uma armadilha na nossa própria linha `lentos`, que estes números expuseram:** 24 no shader contra 319 na
imagem parece dizer que a imagem é pior — e é o contrário, ela vai 15% mais depressa. A razão é que a
contagem é **relativa à mediana de cada lado** (quadros acima do dobro dela): um fundo mais lento tem
medianas maiores e conta menos «lentos» com o mesmo tremor. O rótulo passou a dizer `(>2× a mediana)` e a
comparação avisa que não se compara entre fases; a correção de fundo é reportar **p95/p99** dos intervalos
entre quadros, que são absolutos e comparáveis — fica para depois de o R14 fechar, para não mudar o
instrumento com o registo a meio.

**Segundo aparelho (2026-10-27): ARM Mali-G925-Immortalis MC11 — e é outro, não o Adreno 630.** O autor
correu o ensaio duas vezes seguidas neste telemóvel, na mesma variante curta. As duas corridas dão o
**mesmo veredicto**, o que por si só é a prova de que o instrumento repete:

| corrida | fundo | janela | quadros/s | pior quadro | lentos | pixelRatio | cadência | atrasos |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A | `grade-neon` | 10 s | **60,2** (602) | 16,8 ms | 0 | **2,4** (de 2 a 2,4, 1 evento) | 20/s → 19,8/s | **0** de 205 |
| A | imagem | 9,98 s | **60,0** (599) | 33,2 ms | 0 | 3,25 (nativo) | — | — |
| B | `grade-neon` | 10 s | **60,2** (602) | 16,8 ms | 0 | **2,4** (de 2 a 2,4, 1 evento) | 20/s → 19,7/s | 3 de 201 |
| B | imagem | 9,99 s | **60,2** (602) | 16,7 ms | 0 | 3,25 (nativo) | — | — |

O que isto diz: **aqui o shader é grátis.** Os dois lados ficam presos nos **60/s do ecrã** (60,2 é o mesmo
que 60: são os carimbos do `requestAnimationFrame` a dividir por 10 s), portanto a diferença de −0,3% e de
0% está **abaixo da resolução da medida** — a esta resolução o `grade-neon` cabe no orçamento do quadro com
folga. E a política mostrou-o do lado dela: subiu o pixelRatio de **2 para 2,4** (um evento) em vez de o
descer, ou seja **gastou a folga em resolução**, que é exatamente o que a escada do R15 foi desenhada para
fazer. Os atrasos — 0 numa corrida e 3 de 201 (1,5%) na outra — são ruído; a cadência de 20/s cumpre-se.

Duas lições de método que valem mais do que o número:

- o **pior quadro de 33,2 ms** que a corrida A mostrou do lado da imagem **não se repetiu** na B (16,7 ms):
  era um quadro longo isolado (descodificação, GC), não uma propriedade do fundo. Sem a segunda corrida
  teria ficado escrito no registo como se fosse do panorama;
- num aparelho **saturado no vsync**, os `quadros/s` não distinguem nada — quem discrimina é o **pior
  quadro** e os **atrasos**. E a linha `lentos` (quadros acima do dobro da mediana, ~33 ms a 60 Hz) é
  cega a um único quadro de 33 ms. Fica como candidato a refinar **depois** de o R14 fechar, para não
  mudar o instrumento a meio da campanha.

Este aparelho **não substitui** o Adreno 630: é uma GPU de topo, mais forte do que a média que o R14 pede.
Fica no registo como o extremo de cima — o ponto onde a pergunta deixa de ser «quanto custa» e passa a ser
«quanto é que sobra» — e o médio continua em falta.

**Terceiro aparelho (2026-10-27): Qualcomm Adreno 630 — o médio, e o que faltava.** Com as durações por
omissão e janelas de **45 s** e **44,99 s**:

| fundo | quadros/s | pior quadro | lentos (>2× a mediana) | pixelRatio | cadência | atrasos |
| --- | --- | --- | --- | --- | --- | --- |
| `grade-neon` | **52,1** (2343) | **66,7 ms** | 219 | **2,35** (min 2 · máx 2,4 · 4 eventos) | 20/s → 19,9/s | **112** de 1057 (10,6%) |
| imagem | **54,1** (2433) | **66,7 ms** | 176 | 2,63 (nativo) | — | — |

Aqui o shader custa **3,8%** e o **pior quadro é igual** nos dois lados (66,7 ms) — quer dizer que o
engasgo que este aparelho tem não é do fundo. A cadência de 20/s cumpre-se com **10,6%** de atrasos, contra
22,6% no fraco.

### O R14 está fechado (2026-10-27)

Os **três** aparelhos do R14 — e um quarto de bónus — medidos com o **mesmo instrumento**, o `?ensaio=1`
do D66, com as janelas por omissão e o par dentro da mesma sessão:

| aparelho | GPU | shader | imagem | diferença | pior quadro | atrasos |
| --- | --- | --- | --- | --- | --- | --- |
| telemóvel fraco (2020) | PowerVR Rogue GE8320 | **40,7**/s | **46,9**/s | **+15,2%** | 231,4 → 66,2 ms | **22,6%** |
| telemóvel médio (2019) | Qualcomm Adreno 630 | **52,1**/s | **54,1**/s | **+3,8%** | 66,7 → 66,7 ms | **10,6%** |
| telemóvel forte (2024) | ARM Mali-G925-Immortalis MC11 | **60,2**/s | **60,2**/s | 0% (vsync) | 16,8 → 16,7 ms | 1,5% |
| computador | NVIDIA RTX 4060 | **164,7**/s | **164,1**/s | −0,4% | 24,4 → 24,2 ms | 0% |

**O veredicto, e é o que a Fase 7 tinha prometido medir:** o custo do shader é um **gradiente com a GPU**, e
só o aparelho mais fraco o paga. No médio (Adreno 630) e no forte, o `grade-neon` é indistinguível do
panorama à resolução que a escada escolhe — no forte ela até **sobe** o pixelRatio para gastar a folga. No
fraco custa 15,2% dos quadros, o pior quadro é 3,5× maior e um quinto das atualizações chega tarde, mas a
cadência de 20/s ainda se cumpre **em média** (19,8/s).

A política respondeu como foi desenhada em todos: procurou o teto com passos de 3 s, subiu 20% por três
passos bons e bissectou depois de falhar (2 → 2,625 → 1,6 → 2,456 conforme o aparelho e o tempo de medida).
Duas consequências aceites e registadas: a **procura não termina em 45 s** num aparelho fraco (4 eventos,
estado ainda a mudar) e o `pausada`/`lentos` do relatório existem precisamente para isso não passar por
estável sem se ver.

**O que fica de pé, e porquê:** o shader continua o **fundo de produção** das três salas — foi a decisão do
autor (D-decisão de 2026-10-24) e o A/B confirma-a em três dos quatro aparelhos; o `?shader=0` continua a
ser o escape por sala, e no fraco passa a ser a escolha razoável. A rede que faltava (queda automática num
aparelho fraco) fica como pendência **nova**, decidida com estes números na mão — ver **R18**.

O que falta é o **Adreno 630** (o médio do ensaio de 2026-10-23), que o autor tem. Com o fraco e o forte
medidos, o médio é o que decide a zona cinzenta: no fraco o shader custa **15,2%** dos quadros, um quinto
dos quadros da cadência atrasados e o pior quadro 3,5× maior; no forte não custa **nada** e a escada sobe
a resolução. Falta saber de que lado da linha cai um
aparelho de 2018–2019 — que é o que a maior parte do público traz.

Com o ensaio automático (D66), o que falta passou a ser **um toque em cada aparelho**: abrir
`https://rodrigorez.github.io/zonas12/scene1/?ensaio=1`, esperar ~2 minutos, **Copiar** e colar. O fraco
ficou medido com as durações por omissão; o **médio** (Adreno 630) é o único que nunca foi medido por
este caminho.

O ensaio em `teste/` continua a comparar a arquitetura de panoramas com fundos gerados por shader
GLSL. É **protótipo de medição**, não a política de produção: `js/modules/dimension.js` usa
`dimension-panorama` para as imagens de reserva e o componente do shader para o fundo.
O resumo de implementação, tamanhos e medições também está no README, em «Fundos esféricos: imagem
e shader».

**Como o A/B se recolhe (2026-10-24):** `?sonda=1` (`js/modules/sonda.js`) desenha no ecrã do
telemóvel o que `portalDebug.shader()` responde — fundo, modo, cadência, pixelRatio, atualizações por
segundo, quadros por segundo, atrasos e os eventos da escada — e tem um botão **Copiar** que devolve o
relatório como texto. É o que permite ler os números num aparelho sem consola e juntá-los aos dos
outros dois. Em cima do painel está um **resumo de uma linha** — `R <mundo> <cadência> <pixelRatio>
<quadros> <atrasos> <ecrã>/<dpr>` —, que é o que se escreve à mão quando copiar é difícil. A linha
**quadros** é a medida do A/B: conta o que a página desenhou, sem o teto de 20 do shader, e compara-se
entre a mesma sala com shader e com `?shader=0`. A bateria verifica que o painel só existe com o
parâmetro, que mostra o fundo e a cadência certos, que mede a taxa (19 a 21 por segundo), que conta os
quadros e que o resumo cabe num SMS.

**O ensaio automático (D66, 2026-10-25):** o protocolo passou de dois relatórios a **um toque por
aparelho**. `?ensaio=1` mede o shader (10 s de aquecimento, 45 s de medida), guarda o resultado na
sessão do separador e recarrega sozinho com `&fase=imagem&shader=0`; mede a imagem, junta os dois lados
e mostra um bloco com **Copiar** e **Repetir** — fundo, quadros/s, **pior quadro**, quadros lentos,
cadência, atualizações, pixelRatio com o mínimo e o máximo da escada, atrasos, eventos, aparelho e GPU.
É o mesmo instrumento da sonda, mas dos dois lados e no mesmo estado térmico, que é o que faltava ao
R14 (as duas leituras de 2026-10-24 foram feitas com ~2 minutos de intervalo e escritas à mão). Duas
lições da primeira medição: numa máquina rápida os quadros ficam presos ao vsync e os lados empatam
(165,3 → 164,3 quadros/s no portátil com RTX 4060), portanto o número que discrimina é o **pior
quadro**; e o `?shader=0` da segunda fase não pode ser esquecido — está no relatório, em cada fase,
para um ensaio que corra duas vezes o mesmo lado ser visto e não confundido com um empate.

**A primeira noite de campo (2026-10-27):** o autor abriu o endereço do guia — `?ensaio=1` e
mais nada — e recebeu um relatório com `quadros null/s`, `quadros NaN/s` e `janela 0 s`. A causa era
`Number(null) === 0`: um parâmetro **ausente** lia-se como zero, e uma janela de 0 ms não tem um único
quadro, logo a taxa é `0/0`. A bateria não o apanhou porque todas as suas verificações traziam as
durações escritas — o caminho que o guia manda seguir nunca era exercido. Três defesas: ausente, vazio
ou inválido volta à omissão (o **zero pedido** continua a valer para o aquecimento); a medida tem
mínimo de **2 s** e diz no relatório quando o pedido foi elevado; e o divisor da taxa é o tempo que
**passou**, não o que se pediu, para um `setTimeout` atrasado não inventar um número. O relatório
passou a formatar tudo por uma função que imprime **—** em vez de `null`/`NaN`/`Infinity`, e a
comparação existe sempre — quando falta um lado, diz qual. A bateria ganhou as duas verificações que
faltavam (o endereço nu e os parâmetros vazios) e foi provada contra o defeito reintroduzido: falha
com ele (**588** quadros/s onde deviam ser 55 s de janela) e passa sem ele (**14 de 14**).

**O relógio da fase (2026-10-27, a pedido do autor):** «é possível gerar esse contador de tempo no código
e assim garantimos o ensaio exatamente nos tempos corretos bem como o resultado». Podia, e passou a ser o
mesmo relógio para três coisas que eram três contas: o contador (um laço de `setTimeout(1000)`, que
atrasa e acumula), a janela de medida (um `setTimeout(ms)`, que pode disparar tarde) e o divisor da taxa
(o tempo **pedido**, não o passado). Agora `runPhase()` (em `js/modules/ensaio.js`) lê `performance.now()`
uma vez por pergunta e deriva tudo dele: a janela abre no **primeiro quadro desenhado depois do
aquecimento** (é esse o instante zero), fecha no primeiro relógio que passa do fim, e a taxa divide-se por
esse intervalo. O relatório passou a mostrar, por fase, `janela 45.00 s (desvio +0.00 s)` — o desvio é o
que o relógio de 100 ms deixou escapar — e a comparação mostra as **duas** janelas lado a lado, com aviso
quando não batem. Uma aba **escondida pausa a fase**: `requestAnimationFrame` não corre, o tempo escondido
sai do relógio e aparece como `pausada 2,0 s`; sem isso um visitante que trocasse de aba media 45 s de
shader contra 3 s de imagem, e o A/B dava-lhe um número a favor. Medido na bateria: janela de **3 s** com
desvio **+0,00 s** e **−0,01 s**, e com 2 s de aba escondida a janela continuou **3,08 s** com `pausada 2 s`.

**Formato e orçamento de imagem**

- O panorama equiretangular deve manter a proporção **2:1** (lei L14). Os arquivos atuais medidos
  são: céu `480 × 240`, **18,6 KiB**; praia `1024 × 512`, **620,5 KiB**; cidade `2048 × 1024`,
  **528,1 KiB**.
- O peso do JPEG/WebP é o peso de transferência, não a memória da textura descodificada: em RGBA,
  estimar aproximadamente **2 MiB** para `1024 × 512` e **8 MiB** para `2048 × 1024`, sem overhead
  do driver/renderer; contar também quantas dimensões ficam carregadas.
- Para novos panoramas, usar **`1024 × 512` como ponto de partida para celular** e passar a
  `2048 × 1024` se o detalhe realmente justificar. Não adotar `4096 × 2048` como padrão móvel sem
  nova medição.
- Orçamentos de compressão sugeridos, não limites rígidos: até **500 KiB** para `1024 × 512` e até
  **1,5 MiB** para `2048 × 1024`, em JPEG/WebP após inspeção visual. O peso é dependente do conteúdo;
  os valores encontrados nos assets existentes mostram que dimensões, sozinhas, não predizem bytes.
- A produção usa `THREE.LinearFilter` e `generateMipmaps = false` em `js/modules/dimension.js`;
  manter a decisão coerente com esse material e conferir a imagem no dispositivo antes de mudar.

**Shader: saída e limites medidos**

Shader não usa uma imagem panorâmica 2:1: calcula a cor dos pixels no renderer, cuja saída segue a
área da tela multiplicada pelo pixelRatio aplicado. Não há dimensão de textura fixa recomendada; o
custo cresce aproximadamente com o quadrado do pixelRatio e também depende do shader, da câmera e
da sobreposição/stencil. O protótipo limita o pixelRatio ao intervalo **[1, DPR nativo]**, começa na
memória aprendida ou no DPR nativo e guarda o estado por GPU + dimensões de tela durante **30 dias**.

Parâmetros atuais em `teste/engine.js`: aquecimento de **3 s**, estatística de p95 numa janela de
**2,5 s**, decisão a cada **3 s**, avanço com p95 **≤ 20 ms**, desempenho ruim acima de **25 ms**,
passo de descida de **8%–25%** (p95 > **40 ms** pode causar descida após uma janela; caso contrário,
duas janelas ruins), subida de **5%** após três janelas boas, limitada a **95%** de `badAt`; no
pixelRatio mínimo, o governor recua as animações. `drawMax: 6 ms` é o limite do desenho CPU de p5.js
e não deve ser interpretado como limite do shader.

**Resultados de aparelhos (medidos em outubro de 2026)**

| Dispositivo | Imagem / shader | Resultado |
| --- | --- | --- |
| PowerVR GE8320, `411 × 748`, DPR `2,625`, câmera 720p, antialias ligado | Shader, primeira visita | Partiu de `2,625`; o p95 chegou a `49,6 ms`. O governor baixou para `2,051` em ~12 s; depois manteve cinco fundos animados perto de 59–60 fps, p95 `16,6 ms`. |
| PowerVR GE8320 | Shader, com memória na visita seguinte | Começou em `1,711`, chegou a `1,879`; p95 `16,6 ms` na maioria das amostras e picos curtos de `33 ms` em transições. |
| Adreno 630, `411 × 804`, DPR `2,625`, câmera ligada, antialias ligado | Shader | Manteve DPR nativo `2,625`, cinco fundos, ~60 fps e p95 `16,7 ms`. |
| PowerVR GE8320 | p5.js animado, ensaio anterior | Aproximadamente 4–7 fps; canvas e upload de textura por quadro foram o gargalo observado. |

Os valores do shader são **p95 de quadro da cena inteira**, não tempo isolado da GPU. `desenhoMs: 0`
quer dizer que o protótipo não mede desenho p5.js nesses fundos; não é custo GPU zero. O benchmark
`teste/bench.js` inclui imagem estática e p5.js, mas ainda não tem shader como cenário A/B; as
medições acima foram feitas em execuções/aparelhos reais e não são uma comparação controlada na
mesma sessão. Portanto, a conclusão limitada é que, neste cenário, GLSL animado funcionou muito
melhor que p5.js no aparelho fraco e que o Adreno sustentou DPR nativo; não se conclui que qualquer
shader será sempre mais rápido que qualquer imagem estática.

**Comparativo controlado preparado:** `teste/shader/index01.htm`, `teste/img/index01.htm` e
`teste/p5js.htm` partilham esfera, geometria, visual de referência 2:1 de `1024 × 512`, renderer,
camera fixa, antialias/pixelRatio configuráveis e protocolo de 3 × (5 s aquecimento + 15 s medição).
Há cenário estático para comparação direta e cenário animado, no qual imagem fica como linha de
base. A interface reutiliza o nome do aparelho entre as páginas via `localStorage`, ordena as ações
em ligar câmera → teste estático → teste animado → copiar, mostra análise das medianas e compara
resultados anteriores com condições equivalentes. Os logs incluem hora, URL, identificação do
aparelho, GPU e características que o browser expõe. As instruções completas estão no README,
§ «Comparativo controlado».

**Para fechar R14 antes da produção:** executar as páginas nos três celulares, guardar os JSONs e
comparar as três repetições de cada modo. Repetir com a mesma câmera, pixelRatio e antialias; a
ordem entre tecnologias deve alternar para reduzir o efeito de aquecimento. O benchmark mede o
tempo do quadro total e o desenho CPU p5.js, não tempo GPU isolado. Só depois de revisar os
resultados e os orçamentos de imagem/shader decidir se o modelo de produção aceitará dimensões
`kind: "shader"` e como o editor as configurará.

### R15 — Política adaptativa segura para fundos shader (**FECHADA em 2026-10-27**)

**Plano:** entra na **Fase 7**, bloco **B9** (§9), **depois** do **R14** — a escada 20 → 15 FPS →
estático só vale com o A/B medido, e entra atrás de feature flag.

**Estado a 2026-10-24 (B9):** a política **está em produção** em `js/modules/shader-policy.js`; o que
falta é o registo do A/B nos aparelhos (R14), e por isso a pendência fica aberta. A escada — duas
janelas más para descer, pixelRatio antes da cadência, piso **1**, 15 FPS e depois estático, sem
subir a cadência sozinha — é medida pelo `tools/regression/shader.mjs` (com um relógio em vez de uma
GPU) e pela página real. O **validador** (`tools/shader/validate.mjs`) fecha a porta de entrada: um
shader novo só é instalado se compilar e entregar **19 de 20** atualizações/s. `?shader=0` força a
imagem de reserva em qualquer sala. Detalhes e o formato real estão no README, em «Política do fundo
shader em produção».

**Emenda de 2026-10-24 (medida num telemóvel fraco, Android 10, DPR 2,63):** o primeiro fotograma
passou a pedir **`min(DPR nativo, 2)`** em vez do DPR nativo, e a escada sobe a partir daí. O motivo
está medido: a **2,625** a mesma página desenhava **38,7 quadros/s** com **73 atrasos em 228
atualizações**; a **1,945** desenhava **57,3** — e o custo era só o arranque, porque a escada só
reagia depois de duas janelas de 3 s. Começar em 2 tira esse arranque e não limita ninguém: um
aparelho que aguente sobe até ao nativo em ~30 s (`shader.mjs` verifica as três coisas — arranca em
2 num DPR 3, chega a 3 em 60 s sem degradação, e fica no nativo num DPR 1,17).

**A procura do teto passou a ser uma bissecção (mesma data).** A primeira versão descia 20% e voltava
a subir 5% de cada vez, e por isso continuava a apalpar o teto indefinidamente: no telemóvel, 5
eventos em 117 s, 1,6 → 1,68 → 1,764 → 1,852 (cada evento é um `setPixelRatio`, ou seja uma mudança
de nitidez). Agora a política guarda **o maior valor que aguentou uma janela inteira** e **o menor que
falhou**, e testa o meio: no mesmo perfil de aparelho converge em **27 s** — 2 → 1,6 → 1,8 → 1,9
(falhou) → **1,85** — e cala-se (o `shader.mjs` simula exactamente esse aparelho e exige ≤ 6 eventos,
o último antes dos 60 s, e o valor final entre 1,8 e 1,9). Quando o valor em que se confiava falha, a
confiança desce 20% e a busca recomeça — é o que garante que um aparelho péssimo continua a chegar ao
piso 1 e à cadência de 15 (a escada inteira, sem mudar).

**O que a política *não* promete: quadros por segundo (medido no mesmo telemóvel, 2026-10-24).**
Depois de ~20 minutos de uso o aparelho aqueceu e a cena passou de **59,5** para **40,0 quadros/s** a
1,901 de pixelRatio — com a cadência do shader **intacta** (20,0/s, 356 atrasos em 3 593 = 10%, p95 na
ordem dos 25 ms). A política não reagiu, e é de propósito: ela promete a cadência do shader, e perseguir
os 60 quadros num aparelho quente obrigaria a descer a resolução até ao piso **1**, onde a imagem fica
visivelmente pior para ganhar fluidez que o aparelho já não tem. A decisão do autor (2026-10-24) é
**manter**: a cadência é a promessa, a fluidez é o que o aparelho der. Se um dia se quiser a fluidez
como critério, o sinal já está medido (`p95`), e o custo é o pixelRatio — não há aqui campo por onde
escapar.

**Comportamento pretendido**

1. Manter um asset de imagem válido como fallback de cada fundo shader e prepará-lo antes de trocar
   o fundo existente.
2. Renderizar inicialmente um quadro shader estático (`uTime` fixo), recolher uma linha de base e
   só então tentar animação. Com `prefers-reduced-motion`, manter o fundo estático.
3. Limitar a animação a 20 FPS (50 ms entre atualizações). Diante de degradação persistente, reduzir
   primeiro o pixelRatio em passos medidos, dentro de `[1, DPR nativo]`; reavaliar após cada mudança.
4. Se a degradação persistir no piso de resolução, usar 15 FPS (66,7 ms); se ainda não sustentar o
   orçamento, parar a animação e reter o quadro estável.
5. Em erro de compilação, perda de contexto ou configuração inválida, apresentar a imagem fallback,
   manter um diagnóstico e nunca deixar a dimensão vazia. Ao voltar de uma página oculta, retomar
   inicialmente em estado estático e reavaliar.

Os valores **20 FPS, 15 FPS e pixelRatio mínimo 1** são parâmetros iniciais a validar, não
compromissos de qualidade já demonstrados. A redução do pixelRatio tem evidência promissora no
PowerVR GE8320, mas não isolamos causalidade. O governor não deve confundir a cadência pretendida
com quadros perdidos: a 20 FPS, 50 ms é o intervalo esperado. Instrumentar atualizações entregues
e atrasos contra o prazo; reportar claramente se o browser não permitir medir a entrega real.
`drawMs` de p5.js não mede o custo GPU de shader.

**Fronteiras de segurança e confiabilidade:** selecionar shaders por ID de uma lista interna; nunca
aceitar GLSL/código/URL arbitrário em dados de cena. Validar tipos e limites de todos os parâmetros
ao carregar, com erro visível para configuração inválida. Validar estado salvo localmente, aplicar
expiração e tratá-lo apenas como sugestão inicial. Limitar recursos e alocações por quadro; suspender
trabalho em documentos ocultos. Manter imagem como fallback real carregado, e não como fallback
silencioso para configurações inválidas.

**Critérios de aceite antes de produção**

- Ensaio atrás de feature flag, sem alterar as dimensões atuais nem tornar shader o padrão.
- Testes em aparelhos fraco, médio e forte, com ordem alternada entre tecnologias e mesmas condições
  de câmera, resolução, antialias, cena e duração.
- Confirmar que a cadência animada não excede 20 FPS, que a transição para 15 FPS e para estático
  exige degradação persistente e não oscila, e que a saída estática permanece visível.
- Exercitar fallback para erro de compilação, WebGL/contexto perdido, configuração fora dos limites,
  bloqueio de armazenamento e `prefers-reduced-motion`.
- Verificar qualidade visual nos degraus de pixelRatio, bateria/temperatura e retomada após ocultar
  a página; documentar medições e limites observados antes de propor formato final no schema/editor.

### R16 — A medida do T10/T12 pode sangrar fora da moldura (**FECHADA em 2026-10-24**)

O **T10/T12** tinge a dimensão derivada de um retrato e conta os pixels que mudaram: os que mudam
**dentro** da janela são a prova de que a janela mostra o destino, e os que mudam **fora** da moldura
são um defeito. Na **porta 1 do fixture a 30 m** (`example`), duas corridas de **2026-10-22**
contaram **3 759 px** fora da moldura — iguais com e sem o B20, com a janela e a moldura nas mesmas
coordenadas (`[613,280,771,469]`). Em **2026-10-23** a mesma medida deu **0** em **cinco** corridas,
tanto na árvore do B20 como na anterior: não era um defeito estável e **não era regressão de nenhum
bloco**.

**A hipótese da pendência — «uma textura a assentar» — era só uma parte.** Ao re-medir em
2026-10-24, com o instrumento a dizer **onde** mudou, apareceram três causas, cada uma com a sua
correção:

| Causa | Prova | Correção |
| --- | --- | --- |
| Uma textura ainda a assentar entre as duas capturas | uma imagem por descodificar muda o ecrã inteiro, não uma janela | as duas capturas esperam que as imagens da cena estejam descodificadas (`img.decode()`, teto de **3 s**) |
| A **aresta antialiased** das barras | **1 a 22 px**, sempre na linha do bordo, também nas salas | o rectângulo da moldura ganhou **2 px de margem para fora** (a regra do T5, §10) |
| Uma **obra em vídeo** a meio do ecrã | a caixa dos pixels mudados (`[179,326,190,352]`) tem a **mesma cor** com a dimensão derivada escondida — não é o retrato; o fixture e a cidade têm uma obra em vídeo em `z = -55` | a medição **pára os vídeos** enquanto compara as duas capturas e volta a pô-los a andar no fim |

**Medido depois, em corridas repetidas (2026-10-24):** **0 px** fora da moldura nas 5 páginas, e o
`twelve-tests` voltou a exigir **exactamente zero** — o limite de 0,1% da moldura, que era a emenda
provisória, saiu do runner. O instrumento passou a devolver a caixa dos pixels mudados
(`caixaForaDaMoldura`), para uma próxima vez não ser preciso adivinhar.

### R17 — A primeira porta de uma sessão fria conta fotogramas escuros (**FECHADA em 2026-10-24**)

No `tools/regression/seam.mjs`, a **primeira** porta medida em cada sessão, com o Chrome acabado de
arrancar e a cache fria, contava **5 ou 6** fotogramas escuros na travessia; a mesma porta, medida
isolada e a seguir, contava **0** (medido em 2026-10-22: 0 escuros em 43 e em 42 amostras, duas
vezes seguidas). Não era do retrato nem do B20 — já acontecia antes dele — e a hipótese era a mesma
forma da D45: a ponte está no `sessionStorage` antes de o `<img>` que a mostra estar descodificado, e
o que se vê por baixo é o `#container-video`.

**A correção:** `js/arrival-frame.js` passou a pedir a descodificação da imagem (`img.decode()`) e o
`hide()` **espera por ela** antes de tirar o quadro — o `decode()` explícito também pede a
descodificação cedo, em vez de a deixar para a primeira pintura. O teto é **1,5 s**, para uma imagem
que nunca descodifica não deixar a ponte no ecrã. A saída continua a ser um **corte** e não um
desvanecimento (D44): o que a espera muda é o instante, não a forma.

**Não se reproduziu nesta máquina.** Em 2026-10-24, as **6** portas numa só sessão fria deram **0**
fotogramas escuros **antes** e **depois** da mudança, com a mesma costura (0,31 / 0,32 / 0,30 / 0,41
/ 0,17 / 0,39) e as **12 de 12** verificações a passar. A correção fica em vigor — é a que a
pendência pedia —, e o número continua a ser medido pelo `seam.mjs` em cada travessia.

### R18 — Queda automática para a imagem num aparelho fraco (**FECHADA em 2026-10-27**)

**A pergunta que o R14 deixou aberta.** O A/B fechado mediu o gradiente: no telemóvel fraco o shader custa
**15,2%** dos quadros, o pior quadro é **3,5×** maior (231,4 ms contra 66,2 ms) e **22,6%** das atualizações
da cadência chegam tarde; no médio custa 3,8% com o pior quadro igual; no forte e no computador não custa
nada. E a rede que existia — a escada do R15 até «estático» — **nunca disparava no fraco**, porque lá a
cadência de 20/s se cumpre em média (19,8/s): o degrau final só chegava a quem falhasse também a cadência.

**O que se fez (opção B, decidida pelo autor com estes números).** O último degrau da escada deixou de ser
«congelar» e passou a ser **trocar o fundo pela imagem de reserva**, que já está descarregada e descodificada
e traz as obras e as portas desenhadas nela. A ordem mantém-se a que estava medida — pixelRatio até ao piso
**1**, cadência **20 → 15**, e só então a troca —, com duas janelas más consecutivas em cada degrau. A
política só sabe que **desistiu** (`onGiveUp`, `status().gaveUp`): quem troca é o componente
(`dimensionComponent.useFallback`, que já existia para o shader que não compila e para a perda de contexto).
A troca é **uma vez por página** — um fundo que vai e volta seria pior do que qualquer dos dois lados — e sem
imagem para onde ir o degrau antigo fica: **congelar ainda é melhor do que animar aos soluços**.

**Os dois parâmetros de ensaio**, como `?shader=0` (ferramenta, não interface): `?queda=0` desliga a troca
(fica o congelar de antes) e `?queda=sempre` força-a de imediato, que é a única forma de ver o resultado num
aparelho bom sem esperar que ele degrade.

**Medido** (`tools/regression/queda.mjs`, **11 de 11**, em `all.mjs --full`): um aparelho simulado de 8
quadros/s percorre a escada e desiste com a ordem certa — `desceu pr` ×4 → `15 fps` → `fundo de imagem`;
desiste **uma** vez e não volta a animar (142 atualizações, iguais antes e depois de mais dois minutos de
miséria); um aparelho bom a 60 Hz não desiste em 20 s (zero eventos); sem imagem para trocar, congela
(`estático`) como antes. Na cena de produção com `?queda=sempre`: o fundo passa a `image`, as **5** obras e as
**2** portas continuam lá, a esfera continua no sítio e o shader deixa de animar (0 atualizações novas). Com
`?queda=0` e por omissão num aparelho bom, o shader fica. O `shader.mjs` continua em **13 de 13** (a escada
sem `onGiveUp` congela como sempre) e o `ensaio.mjs` em **19 de 19**.

**O que esta rede é e o que não é — dito com franqueza:** é uma **rede de segurança**, não uma optimização do
aparelho fraco. O PowerVR real **não** desiste, porque a política lhe cumpre a cadência e ele passa os
critérios; o que ele perde é fluidez ao olhar em volta, e isso a escada não mede. Baixar a fasquia para «menos
de 40 quadros/s sustentados → imagem» obrigaria a decidir **o que o visitante de um telefone antigo vê**, e
essa é a pergunta seguinte (registada, com os números do R14 na mão). O `?shader=0` continua a ser a resposta
manual, e a bateria `image-bridge`/`shader` garante que nada disto toca no caminho de um aparelho bom.

**R1 — fechado em 2026-10-15.** Depois de A2/A3 serem fechados, três sítios continuavam a
apontá-los como trabalho da Fase 2: a lei **L8** (§8), o «Ficou por fazer» da Fase 1 e o
«Correções incluídas» da Fase 2 (§9), e o «Próximo passo» (§13). Passaram a apontar o estado
real.

**R2 — fechado em 2026-10-15.** O T2 e o T3 não tinham instrumento, e a mesma medição andava por
três números (69, 70 e 236 poses, conforme o documento). Passaram a ter uma varredura automática
e repetível — `tools/regression/pose-sweep.mjs`, descrita em §10 — com **0** poses com bordo
cortado e **0** falhas em 11 180 amostras, e com duas avarias injetadas que provam que o
instrumento **falha quando deve** (3 212 e 10 072 amostras em falta, nas duas).

**R5, R6 e R7 — fechados em 2026-10-15** (decisão **D19**, §11). Eram as três fronteiras que o
plano da Fase 2 não fixava: quem corre o `syncStencilValues()` por frame depois do A7, onde
vivem o modal da obra e o `cursor-listener`, e se os *hooks* de HTML em português passam a
inglês. Fechadas **antes** de B2 e de B4, como o plano exigia. Ao medi-las ao disco descobriu-se
que a premissa de uma delas estava errada: o `css/style.css` **não** usa `data-dimensao` nem a
classe `interactable` — usa os ids `#modal-obra` e `#btn-frente` —, logo o renomeio não arrasta
CSS nenhum.

**R4 — decidido em 2026-10-15** (decisão **D21**, §11): o formato por língua entra no esquema, no
conversor e no validador e fica **instanciado** — as 4 dimensões ganham `name` e o catálogo de
assets ganha `alt` por língua. O que ele ainda não tem é quem o **mostre**: o texto de conteúdo
só chega à interface na **Fase 4**, e é o editor o primeiro sítio que o lê. O **R3** (o catálogo
`i18n`) continua aberto, e é da mesma fase.

| # | Pendência | Porque fica | O que a fecha |
| --- | --- | --- | --- |
| R3 | **Catálogo `i18n/pt.json` incompleto** | Tem **5** chaves em `strings` (`app.title`, `app.loading`, `app.start`, `artwork.back`, `camera.error`); as strings que a interface ganhou depois — os 4 `aria-label` do D-pad, o `aria-label` do modal e o `title` do iframe — não estão lá. Nada lê o catálogo ainda (é da Fase 4), por isso é inconsistência latente | Juntar as chaves novas ao catálogo na Fase 4, quando a interface passar a usar `t('…')` (a contagem no §13 foi corrigida em 2026-10-15). **Plano registado no B0 de 2026-10-16: fecha no B1 da Fase 4 (§9)**. **FECHADO em 2026-10-20 (B1):** o catálogo tem **13** chaves, a interface lê-as por `data-i18n*`, o `?lang=en` cai no português com **1** aviso — e as duas pontes `window.iniciarCena`/`fecharObra` saíram com os `onclick`. Medido: **0** literais de interface em `js/`, **0** chaves em falta, **0** `onclick` nos 4 arranques |
| R4 | **Feita em 2026-10-15** (decisão **D21**, §11) | O formato por língua estava documentado (§5.7 e §6) e **não instanciado**: as dimensões não tinham nome, as obras não tinham título e nenhum campo do JSON era por língua — nem o conversor nem o validador mencionavam idioma | O `{ pt, en }` entrou no esquema, no conversor e no validador e ficou **instanciado**: 4 nomes de dimensão e 6 descrições de asset (B3, §9). As **10 obras** ficam sem `title` — é opcional, e quem o lê é o editor (Fase 4) |
| R8 | **O `remove()` do construtor de cena nunca correu** | `buildScene()` devolve um `remove()` que tira as portas, as obras, as dimensões, os assets e a câmara — e **nada o chama**: o `js/app.js` faz `await buildScene(data)` e deita fora o resultado (medido por `grep`, é a única chamada). Com ele ficam por exercitar as três funções `remove…` dos módulos e os `remove()` dos componentes que desregistam conteúdo do núcleo. O editor (Fase 4) vai ser o primeiro sítio a trocar de cena. É o mesmo tipo de risco que a **A4** teve até a Fase 2 o fechar: código de limpeza que ninguém exercita apodrece sem se notar | A Fase 4 (troca de cena no editor) ou um teste que construa e remova uma cena e confirme que o documento e os registos do núcleo ficam como estavam. **Medido no B0 de 2026-10-16: o `remove()` funciona** — 3 ciclos do portão deixam os registos vazios e a cena de volta ao que era; fecha no **B3** da Fase 4, com **20** ciclos (§9). **FECHADO em 2026-10-20 (B3):** o instrumento `tools/regression/scene-cycle.mjs` constrói e remove um mundo **20** vezes e compara portais, dimensões, entradas de conteúdo, valores de stencil, dimensão ativa, nós do `<a-scene>` e ouvintes — **0** desvios no portão (2→4→2 portais) e no fixture (4→8→4), com a navegação da exposição a continuar a funcionar (`walkDoor(0)` levou a `/cidade/?from=gate`) |
| R9 | **O esquema declara mais do que a cena constrói** | Quatro coisas **validam** e não são construídas: `kind: "model"` e `"text"` numa obra (o `createArtwork()` ignora o `kind` e faz sempre uma `a-box` com a textura do `asset` — não há geometria de modelo nem texto 3D), `kind: "color"` numa dimensão (o `createDimension()` nunca passa o `color` ao componente — o ficheiro não menciona a palavra, medido por `grep`; o validador só avisa quando a cor **falta**, com «the background will be black») e `interaction: "link"` (o `addressToOpen()` devolve o endereço, mas o `open-artwork` mostra-o no **iframe do modal**, não navega). Medido: quatro variantes da cena da exposição, uma por campo, passam **todas** com 0 erros e 0 avisos — quem escrever um destes campos à mão vê o validador aceitar e a cena não mudar como esperava | Ou a Fase 4 os implementa (e o editor passa a oferecê-los), ou o esquema e o validador passam a **avisar** que esses valores ainda não são construídos — a categoria «aviso» já existe no validador e é onde isto encaixa (é a mesma que avisa da dimensão de cor sem cor). **Decidido no B0 de 2026-10-16 (D30, §11): o validador avisa** e o editor não oferece esses valores; fecha no **B9** da Fase 4 (§9). **FECHADO em 2026-10-20 (B9):** o validador passou a avisar — **3** avisos para os **4** valores (`kind: model\|text` numa obra é um só, `interaction: link` e `kind: color` numa dimensão são os outros dois) —, o `laws-selftest.mjs` cresceu de **17** para **20** casos, um por valor, e dá **20 de 20 avarias detectadas** com o controlo limpo, e nenhum dos quatro valores é oferecido pelo editor (§9, registo do B9) |
| R10 | **Não há retrato do portão** | A porta da cidade para o portão é `window: none` (e, desde a D29, também a da praia), porque não existe imagem da realidade: um retrato emprestado mentiria ao visitante sobre onde a porta leva. É uma decisão do autor, tomada ao fechar o B6 e reusada no B7 | Uma imagem do portão em `assets/previews/gate.jpg` mais as três linhas do catálogo e da porta — o formato e o caminho já a aceitam, e a L19 e o T10 já a mediriam. **FECHADO em 2026-10-20, decisão do autor: aceita-se que não exista.** As duas portas para a realidade ficam `window: none` — é o único caso em que a ausência é honesta, porque um retrato emprestado mentiria sobre o destino. **Nota de 2026-10-20 (D38, §11):** as portas da cidade e da praia para o portão deixaram de ser `window: none` e passaram a mostrar a **câmara ao vivo** por uma janela `dimension-pair` com uma dimensão `kind: "camera"` — não é um retrato, é o que está do outro lado; o R10 continua fechado como «não há retrato do portão» |
| R11 | **No céu, a chegada fica virada para o lado de onde se vem** | Medido no B9 (§9): o visitante aterra virado no sentido em que vinha — o −Z da porta —, o que é **o que faz do regresso um passo** (é o mecanismo, não um defeito). Em cada sala o que fica à frente varia: cidade **1** de 5 obras, praia **1** de 3, céu **0** de 2. O céu já vinha assim da cena anterior (nota do B6); nas outras salas há sempre alguma obra à frente | Uma decisão do autor sobre a orientação da chegada (é a rotação devolvida pelo `arrivalPoint`, em `js/scene/arrival.js`) ou um re-arranjo das obras do céu — o que ele preferir. **DECIDIDO em 2026-10-20: re-arranjar as duas obras do céu**, no **B10** e **com o próprio editor** (é o primeiro uso real que se lhe dá, e é o que permite acertar as posições na pré-visualização). É dado, não código, e o mecanismo da chegada não se toca. **FECHADO em 2026-10-20 (B10):** as duas obras passaram de `z = -110` para `z = -131` (em frente da chegada, que é em `z = -121`) e de `x = ±15` para `x = ±6`, movidas **no editor**, exportadas e o ficheiro substituído; medido com a câmara real e o frustum dela, o céu passou de **0** para **2** obras no primeiro plano da chegada (cidade **1** de 5 e praia **1** de 3 não mudaram), o `validate.mjs` sai com **0** e a bateria no céu dá os mesmos números (o `git diff` do ficheiro mostra só as duas posições) |
| R12 | **O T5 não foi re-medido na Fase 3B** | Precisa do rig de **dois** portais (uma janela a tapar a moldura da outra) e a ordem de desenho **não mudou** na fase: `drawOrder` e as regras de stencil são os mesmos do fecho da Fase 3. Re-medir sem mudança nenhuma não diz nada de novo; o número da v0.0.5 (0 px da moldura de trás dentro da janela da frente, com 6 768 px de controlo) continua a ser o último | **FECHADA em 2026-10-16**, na bateria dos doze testes (§9): o rig passou a viver em `tools/regression/acceptance.mjs` (`checkStackedDoors`), com duas portas de 8×10 m a 20 m e a 30 m (a de trás deslocada 5 m para o lado, para a moldura dela atravessar a janela da frente), e o resultado é **0** px dentro, **1 657** px de controlo fora e **0** de ruído — nos **5** mundos |
| R13 | **Os módulos exigem a UI da exposição** | Medido no **B0 da Fase 4** (§9), com páginas-sonda servidas por HTTP: importar `js/modules/artwork.js` num documento **sem** `#iframe-obra` dá excepção (`Cannot read properties of null (reading 'addEventListener')`) — e com ele o `js/scene/scene-builder.js`, que o importa —, e o `setupMobileControls()` sem o D-pad e o `reportCameraError()` sem o `#btn-iniciar` dão excepção pela mesma razão (o segundo **depois** de já ter posto a mensagem no ecrã). Ninguém notou até aqui porque **só existe um host** — a exposição — e ele tem todos esses elementos; é o mesmo tipo de risco que o R8: acoplamento que só aparece quando **um segundo host** tenta usar o código | A Fase 4 (**B2**, §9), com a meta **M14**: os 6 imports numa página sem a UI da exposição, **0** excepções. **FECHADO em 2026-10-20 (B2):** cada elemento da exposição passou a ser um **host opcional** (o modal e o `iframe`, o D-pad, o `#btn-iniciar`, o overlay e o `<video>`), o ouvinte do `iframe` passou a ligar-se na **abertura** do modal e não no import, e uma página com A-Frame e **sem** essa UI deu **16 de 16** verificações OK (os 8 imports, as 3 chamadas que rebentavam, `buildScene(gate)`, `startSession()` e `remove()`), com a exposição nos mesmos números |
