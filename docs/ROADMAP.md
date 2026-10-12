# Roadmap — Módulos de construção e página de edição

> **Estado: PROPOSTA.** As decisões já fechadas estão registadas na secção
> [11](#11-decisões) com data. As que continuam em aberto estão identificadas como tal.
> Nada foi implementado: nenhum ficheiro de código foi criado ou alterado por este plano.
> Este documento é o guia de desenvolvimento; o `README.md` descreve o que **já** existe.

---

## 1. Objetivo e escopo

**Objetivo:** passar de uma cena escrita à mão em `index.html` para **módulos independentes**
(dimensão, obra, portal, câmara) alimentados por **dados**, e acrescentar uma **segunda
página** de criação/manutenção com inserir, alterar e excluir para cada módulo.

**Dentro do escopo:** separar o `js/main.js` atual em núcleo + 4 módulos; descrever a cena em
dados; construir `editor.html` com CRUD; validar com as medições que já usamos.

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

**Leitura destes factos:** o pedido de "4 módulos independentes" é possível, mas **não é
possível sem um núcleo**. A alternativa (módulos verdadeiramente autónomos) obrigaria a
duplicar a lógica de stencil em cada um, e a primeira coisa a divergir seria a ordem de
desenho — exatamente a família de bugs que passámos a semana a corrigir.

---

## 3. Skills do projeto — bloqueio registado (D8)

Pediram para usar as skills em `.harness/skills`. **A pasta está vazia:**

```
.harness/skills/cline/global-skills/skills/   89 pastas, 0 ficheiros
   ├── plan-writing/          (sem SKILL.md)
   ├── brainstorming/         (sem SKILL.md)
   ├── architecture/          (sem SKILL.md)
   └── ... 46 outras          (todas vazias)
```

Também verifiquei alternativas: `~/.cline/data` não tem pasta `skills`;
`~/Documents/Cline/Rules` e `~/Documents/Cline/Workflows` estão vazias; a extensão Cline
traz só `create-pull-request`.

**Consequência:** não usei nenhuma skill do projeto porque não existe conteúdo para ler —
seria inventar. Este documento foi escrito com prática geral de planeamento
(problema → opções → causa/consequência → recomendação → critério de verificação).

**Decisão (D8): deixar como está por agora.** Nada é removido nem reposto. Fica registado
como dívida: se no futuro se quiser usar skills deste projeto, o conteúdo tem de ser
trazido de onde existe (não está nesta máquina, ao que foi possível verificar).

---

## 4. Decisões estruturais (opções com causa e consequência)

### D1. Como se escrevem os módulos

| Opção | Como funciona | Ganhos | Perdas / consequências |
| --- | --- | --- | --- |
| **1A. ES Modules nativos** (recomendada) | `js/nucleo/*.js` e `js/modulos/*.js` com `import`/`export`; `<script type="module">` | Dependências explícitas (é o ponto do pedido); sem globais; o browser já sabe; zero build | **Abrir o `index.html` com duplo clique (file://) deixa de funcionar** (CORS): passa a ser obrigatório servir por HTTP — é o que já fazemos em todos os testes |
| 1B. Scripts + namespace | `js/modulos/portal.js` define `window.PortalAR.Portal = {...}`; `<script>` na ordem | Continua a funcionar por `file://`; zero build | Ordem dos `<script>` passa a ser contrato implícito; sem análise estática; é o estado atual com outro nome |
| 1C. Bundler + TypeScript | `esbuild`/`vite` a partir de `src/`, gera um `dist/app.js` único | Tipos (contratos verificados em tempo de compilação); **o bundle único volta a funcionar por `file://`**; um só ficheiro a publicar | Dependências npm e passo de build **de volta à raiz** (contradiz a limpeza que fizemos); mais uma coisa para instalar/atualizar |

**Recomendação: 1A.** O objetivo declarado é escalar com módulos independentes — e o
`import` é o que torna as dependências visíveis e impossíveis de contornar.

**A D2 já pagou o custo do 1A.** Com o JSON decidido (D2), o `index.html` passa a fazer
`fetch('data/cena.json')`, e o `fetch` **já não funciona por `file://`**. Ou seja: a
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
| **2A. JSON no projeto + importar/exportar** (recomendada para a 1.ª fase) | `data/cena.json` é a verdade; o editor carrega, edita em memória e **descarrega** o ficheiro; o `index.html` lê o JSON | Site continua **100% estático**; funciona no GitHub Pages; o ficheiro está versionado (dá para ver o diff de uma alteração e reverter) | Gravar exige **substituir o ficheiro à mão** (fricção em cada alteração); o editor não "grava sozinho" |
| 2B. `localStorage` | O editor grava no browser; a app lê de lá | CRUD imediato, zero servidor, zero ficheiros | O dado **fica preso a um browser** (não viaja, não versiona); testar no telemóvel vê outra cena; limpar dados do browser apaga a exposição |
| 2C. Servidor local com escrita | Pequeno servidor (`node`/`python`) expõe `GET/POST/PUT/DELETE` e escreve `data/cena.json` no disco | CRUD real com "Gravar", sem passos manuais; continua a poder ser estático no que se publica (o servidor só serve o editor) | Mais um processo para arrancar; um servidor **a escrever no repositório** é risco (acidentes apagam a cena) → exige cópias de segurança e um endpoint de "exportar" |
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

### 5.1 Núcleo (`js/nucleo/`)

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
- **Campos:** `id`, `dimensionA`, `dimensionB`, `ownedBy` (era `pertenceA`), `width`,
  `height`, `box {x,y,z}`, `boxPosition`, `boxRotation`, `trigger` (`plane | box`),
  `frame {color, thickness}`, `rotation`, `motion` (reservado).
- **API:** `create / update / remove / list`; emite `portal:traversed {id, from, to}`.
- **Regras:** `dimensionA ≠ dimensionB`; ambas existem; `ownedBy ∈ {A, B, -1}`; o ponto de
  chegada **não pode** cair dentro da caixa de outro portal (senão há trocas em cadeia —
  medido); ≤255 dimensões distintas visíveis ao mesmo tempo.
- **Depende de:** núcleo (valor de stencil), câmara (posição do jogador).

### 5.5 Módulo Câmara

- **`playerCamera`:** posição, altura, velocidade, `look-controls`, `wasd-controls`,
  D-pad, limites.
- **`realCamera`:** webcam (`getUserMedia`), estados (a pedir, ativa, erro), fundo da
  dimensão 0.
- **API:** `position()`, `setPosition(p)`, `enable()`, `disable()`.
- **Ganho imediato:** resolve A5 — deixa de haver `document.querySelector('a-camera')`
  espalhado por 3 sítios.

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
      "interaction": "modal", "title": "Aurora" }
  ],
  "portals": [
    { "id": 0, "dimensionA": 0, "dimensionB": 1, "ownedBy": 0,
      "position": [-6, 0, -8], "width": 8, "height": 10,
      "box": [12, 16, 1], "boxPosition": [0, 8, 0], "trigger": "plane" }
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

**Consequência para a migração:** ao converter a cena atual para este JSON é preciso
reescrever os 8 portais e as 10 obras com os nomes novos de atributos
(`dimensaoA` → `dimensionA`, `caixa` → `box`, `pertenceA` → `ownedBy`, …). É trabalho
mecânico mas **com risco de troca de campo**: por isso a conversão tem de ser feita por um
script que lê o `index.html` e escreve o JSON, e não à mão.

---

## 7. Funcionalidades da página de edição (por módulo)

| Módulo | Inserir | Alterar | Manutenção | Excluir |
| --- | --- | --- | --- | --- |
| **Dimensão** | ID + tipo de fundo + asset + raio | tipo/asset/raio; ver/editar conteúdo | vista geral com contagem de obras e portais; avisar se o raio é pequeno | bloquear se houver portais/obras a apontar para ela (ou apagar em cascata, com confirmação) |
| **Obra** | escolher dimensão, asset, posição/rotação/tamanho, interação | todos os campos | lista por dimensão; detetar asset em falta; detetar `url` vazia com `interacao: modal` | individual e em lote por dimensão |
| **Portal** | A, B, onde pertence, tamanho, caixa, gatilho | todos os campos, incluindo caixa e moldura | **validar** A≠B, destino fora de outras caixas, valor de stencil; pré-visualizar a travessia | individual; se for o último portal de uma dimensão, avisar |
| **Câmara** | — (é única) | posição inicial, altura, velocidade, webcam on/off | mostrar posição atual; botão "usar a posição atual como inicial" | — (não aplicável) |

Transversal a todos: **importar/exportar JSON**, **validar tudo** antes de exportar,
**desfazer**, e uma lista de problemas (ex.: "o portal 3 chega dentro da caixa do portal 5").

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

---

## 9. Fases de execução

Cada fase tem um critério de verificação **medido no browser**, como temos feito.

### Fase 0 — Congelar o contrato *(sem código de produção)*
- **Entregável:**
  1. Este ROADMAP com as decisões fechadas (§11) e o **glossário PT→EN** fixado (§11/D10).
  2. A lista de testes de regressão (§10) aceite como critério de aceitação.
  3. `data/cena-exemplo.json` — a cena atual **convertida para JSON** (feita por script que lê
     o `index.html`, não à mão), com o esquema acordado.
  4. Uma cópia da cena atual em `data/cena.json` (a exposição).
- **Verificação:** os testes de regressão passam **antes** de mexer (linha de base); e o JSON
  convertido, ao ser reaplicado, dá os mesmos valores que o HTML (comparar campo a campo).
- **Porquê agora:** o JSON é o contrato de que tudo o resto depende (núcleo, módulos,
  editor). Descobrir um erro no esquema depois dos módulos prontos custa muito mais.

### Fase 1 — Núcleo, sem mudar comportamento
- **Entregável:** `js/core/` com estado, registos, `applyStencilState()`,
  `setActiveDimension()` e eventos. O `main.js` passa a chamar o núcleo.
- **D10 aplica-se aqui:** o código que se move é **renomeado ao mover** (glossário da Fase 0)
  e as mensagens de consola passam a inglês. Um componente por commit, para os diffs serem
  revistos um a um.
- **Verificação:** **zero** diferença visual e funcional: 8/8 travessias, 0 poses com bordo
  cortado, contorno fechado, clique só na dimensão ativa, consola limpa. Se algo mudar, é bug.
- **Risco:** o núcleo ser "o main.js com outro nome". Mitigação: nenhuma função pode
  conhecer `document.querySelector('a-camera')`.

### Fase 2 — Os 4 módulos
- **Entregável:** `js/modulos/dimensao.js`, `obra.js`, `portal.js`, `camara.js`; `main.js`
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
  `data/cena.json` (com `data/cena-exemplo.json` como fixture/testes).
- **Verificação:** a cena de exemplo comporta-se **igual** à de hoje (T1–T8 sobre o exemplo);
  a conversão campo a campo do JSON confere com os valores que o HTML tinha.
- **Risco:** perder um atributo na conversão. Mitigação: o script da Fase 0 é a fonte da
  conversão e a comparação é automática, não visual.

### Fase 4 — Página de edição
- **Entregável:** `editor.html` + `css/editor.css` + `js/editor.js`: CRUD por módulo,
  validação (§8), pré-visualização, importar/exportar.
- **Verificação:** criar uma dimensão + 2 obras + 1 portal **só pelo editor**, exportar,
  substituir o JSON e ver a cena a funcionar; e os 8 testes de regressão na cena editada.
- **Risco:** o editor e a exposição divergirem. Mitigação: o editor usa os **mesmos** módulos.

### Fase 5 — Gravação direta *(só se a fricção de 2A incomodar)*
- **Entregável:** servidor local mínimo que lê/grava `data/cena.json`, **fora** do que se
  publica; endpoint de exportar; cópia de segurança antes de gravar.
- **Verificação:** editar, gravar, recarregar a exposição e ver a alteração.

### Fase 6 — Testes e limpeza
- **Entregável:** os testes de §10 automatizados (o mesmo script que já usamos no browser);
  remover as 89 pastas vazias de skills (ou repô-las).
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

---

## 11. Decisões

> As decisões fechadas ficam registadas aqui com data, para o roadmap servir de histórico.
> Uma decisão fechada só se reabre com motivo escrito.

| # | Decisão | Estado | Escolha |
| --- | --- | --- | --- |
| D1 | Formato dos módulos | **FECHADA** (2026-10-12) | **ES Modules nativos com `import`/`export`, sem build.** Custo aceite: passar a servir por HTTP (já obrigatório pela D2) |
| D2 | Onde vive o dado do editor | **FECHADA** (2026-10-12) | **JSON no projeto (`data/cena.json`) + botões Importar/Exportar.** Site 100% estático, o ficheiro fica versionado. Consequência aceite: gravar exige substituir o ficheiro à mão |
| D3 | Como o editor vê a cena | **FECHADA** (2026-10-12) | **Formulários/tabelas por módulo + pré-visualização da cena ao lado.** Sem manipuladores 3D |
| D4 | Estrutura da segunda página | **FECHADA** (2026-10-12) | **`editor.html` separado**, a importar o núcleo e os 4 módulos. A exposição (`index.html`) não leva código de edição |
| D5 | O que é o módulo da câmara | **FECHADA** (2026-10-12) | **As duas**: câmara-jogador (posição, movimento, controles) e câmara-real (webcam/AR), em secções separadas do mesmo módulo |
| D6 | Onde vivem a documentação de planeamento e as ferramentas | **FECHADA** (2026-10-12) | **`docs/` para o roadmap e `tools/` para o script de assets**, ambos versionados. A raiz mantém só o essencial (`index.html`, `README.md`, `css/`, `js/`, `assets/`) |
| D7 | Organização dos assets | **FECHADA** (2026-10-12) | **Separar por tipo** (`assets/panoramas/`, `assets/artworks/`, `assets/video/`) + prefixo `d<N>-` no nome do ficheiro, na variante **organizativa (P1)**: o prefixo diz onde o ficheiro mora; quem o usa está no JSON |
| D8 | Skills do projeto vazias | **FECHADA** (2026-10-12) | **Deixar como está por agora** (não se mexe). Registado como dívida: as 89 pastas vazias ficam, e não se usa nenhuma skill do projeto |
| D9 | A cena atual é conteúdo real ou demo | **FECHADA** (2026-10-12) | **É demonstração, mas fica no repositório como cena de exemplo** (serve de teste e de montra) |
| D10 | Idioma do código | **FECHADA** (2026-10-12) | **Inglês no código** (identificadores, comentários, mensagens de consola, chaves do JSON); **português na documentação e nos textos da interface** |

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
- Vale a pena acrescentar à validação (§8) duas regras novas:
  **L9** — todo o `asset` do JSON existe em disco; **L10** — o nome do ficheiro segue a
  convenção (aviso, não erro).

### Efeitos da D10 na execução

O código que existe hoje é todo em português. Esta decisão obriga a um **glossário** (para
não haver três traduções para a mesma coisa) e a um **método** de renomeação.

**Glossário proposto (a fixar na Fase 0):**

| Hoje (PT) | Código (EN) | Texto de interface (PT) |
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
| abrir modal | `openArtwork` | — |

**Nomes dos componentes A-Frame** (aparecem no HTML, por isso contam como código):

| Hoje | Proposto |
| --- | --- |
| `gestor-dimensoes` | `dimension-manager` |
| `portal-estencil-dinamico` | `stencil-portal` |
| `panorama-dimensao` | `dimension-panorama` |
| `material-virtual` | `dimensional-material` |
| `abrir-modal` | `open-artwork` |
| `config-ar` | `ar-config` |
| `cursor-listener` | `cursor-listener` (já em inglês) |

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
- As **chaves do JSON mudam para inglês** (§6 já refletido), o que altera o `data/cena.json`.
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
  | `data/cena-exemplo.json` | **Fixture**: a cena atual (4 dimensões, 8 portais, 10 obras). É a referência dos testes (§10) e a montra | testes de regressão; botão "carregar exemplo" no editor |
  | `data/cena.json` | A cena da exposição (começa como cópia fiel do exemplo) | `index.html` |

- Ganho: pode-se substituir ou limpar a cena real sem perder a referência que os testes
  precisam. **Perda a vigiar:** os dois podem divergir — mitigação: um teste que valida o
  exemplo (T1–T8 correm sobre `cena-exemplo.json`).
- A migração (Fase 3) continua a ter de ser **fiel**: os T1–T8 só valem se a cena de exemplo
  se comportar exatamente como hoje (8/8 travessias, 0 cortes de bordo, etc.).
- Isto dá conteúdo concreto à Fase 6: os testes correm contra a fixture, não contra a cena
  que estiver em uso.
- Consequência no editor: um botão explícito "Carregar exemplo" (e não carregar o exemplo em
  silêncio quando o ficheiro da exposição falta — isso esconderia erros de caminho).

### Efeitos da D5 na execução

- `js/modulos/camara.js` tem **duas partes com ciclos de vida independentes**:
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
  procurar imports de `js/editor/` dentro de `js/modulos/` e `js/nucleo/`).
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

- O editor **nunca escreve em disco**: carrega `data/cena.json` (via `fetch`) e descarrega o
  resultado por *download*; a pessoa substitui o ficheiro e faz `commit`.
- Como não há escrita, **a Fase 5 (servidor) sai do caminho crítico** e passa a ser apenas
  uma comodidade futura, se a fricção incomodar.
- Passa a haver um requisito de *ferramenta*: ao gravar, os **diffs do JSON** são a prova de
  cada alteração — por isso o JSON tem de ser estável e legível (chaves ordenadas, indentação
  de 2 espaços, sem campos vazios), senão cada gravação gera ruído no `git diff`.
- O `index.html` passa a depender de `fetch('data/cena.json')` → **obriga a servir por HTTP**
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
| Crescimento do `main.js` outra vez | Média | Médio | Regra: `main.js` só com o arranque; revisão no fim de cada fase |
| Complexidade do editor atrasar a exposição | Média | Médio | O editor não bloqueia a exposição: a Fase 3 entrega valor mesmo sem Fase 4 |

---

## 13. Resumo — todas as decisões fechadas (2026-10-12)

| # | Decisão | Escolha |
| --- | --- | --- |
| D1 | Formato dos módulos | ES Modules nativos, sem build |
| D2 | Dados | JSON no projeto + Importar/Exportar |
| D3 | Editor | Formulários + pré-visualização |
| D4 | Página | `editor.html` separado, a importar os mesmos módulos |
| D5 | Câmara | As duas: jogador + real |
| D6 | Documentação e ferramentas | `docs/ROADMAP.md` + `tools/` (versionados) |
| D7 | Assets | Por tipo (`panoramas/artworks/video`) + prefixo `d<N>-` **organizativo** (P1) |
| D8 | Skills vazias | Deixar como está (dívida registada) |
| D9 | Cena atual | Demonstração, mantida como cena de exemplo |
| D10 | Idioma | Código em inglês; documentação e interface em português |

### O que fica decidido, em uma frase

O código passa a **ES Modules em inglês** (núcleo + 4 módulos), a cena passa a viver em
**`data/cena.json`** (com uma cena de exemplo versionada para testes), os assets organizam-se
por tipo com prefixo de dimensão organizativo, e o **`editor.html`** é uma ferramenta
separada, de formulários, que usa os mesmos módulos e exporta o JSON — sem nada a escrever em
disco.

### Próximo passo (Fase 0, ainda sem código de produção)

1. Fixar o **glossário PT→EN** (§11/D10) — é o que impede três traduções para a mesma coisa.
2. Aceitar a lista de **testes de regressão** (§10) como critério de aceitação de cada fase.
3. Escrever o **conversor** `tools/html-to-scene-json/` (lê o `index.html`, escreve o JSON) e
   gerar `data/cena-exemplo.json`.
4. Validar o JSON convertido contra o HTML, **campo a campo**, com a cena a funcionar como hoje.

Só depois disto começa a Fase 1 (núcleo).
