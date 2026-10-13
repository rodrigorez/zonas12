# Projeto Galeria AR

## Descrição

Este projeto é uma galeria imersiva de realidade aumentada/virtual utilizando A-Frame. Ele permite criar experiências interativas onde os usuários podem explorar ambientes 360º e interagir com obras de arte virtuais através de portais estêncil.

## Estrutura do Projeto

````markdown
zonas12/
├── index.html          ponto de entrada: a cena A-Frame
├── README.md           documentação principal (fica sempre na raiz)
├── css/
│   └── style.css       estilos da página, HUD, modal e D-pad
├── js/
│   ├── app.js          entrada do módulo: componentes, movimento, carregamento
│   └── core/           núcleo: estado, registos, stencil, eventos, limites
├── docs/
│   └── ROADMAP.md      plano de desenvolvimento (módulos + página de edição)
├── assets/
│   └── images/         panoramas 360º, fotos e vídeo usados na cena
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
  `assets/`, `README.md` e `.gitignore`.
- Documentação de planeamento (roadmap, decisões) fica em `docs/`; ferramentas de
  construção (ex.: processamento de assets) em `tools/`.
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

1. Abrir **`.harness/skills/.agent/skills_index.md`** — é o índice único e cobre todo o
   `.agent/` (rules, agents, skills, sub-skills, workflows, scripts, ferramentas, vendors,
   standalone e quarentena).
2. Identificar no índice a skill/agent/workflow pretendido (pelos *triggers*) e **ir ao
   caminho que a linha indica** (`SKILL.md`, `{name}.md`, `{cmd}.md`, `{name}.py`, ou o caminho
   completo em 📄 *Standalone files*).
3. **Só se o índice não tiver** o que se procura é que se faz busca livre (`grep`/`glob`).

O índice é a **única porta de entrada** do harness: não se faz `list_dir` às cegas nas
subpastas "para ver o que há". Para isso ser verdade, o índice tem de estar **completo** — e é
a **passe inversa** da validação que garante isso (ver abaixo).

> ⚠️ **Medido em 2026-10-13:** o índice estava incompleto. Faltavam **13** `SKILL.md` — entre
> eles `3d-games`, `vr-ar` e `web-games`, os mais úteis a este projeto — e **75** `.md` de
> referência; e descrevia como "cópia" o espelho Cline, que tinha **43 pastas e 0 ficheiros**.
> A causa foi o validador só perguntar *"as minhas linhas resolvem?"*, nunca o contrário.
> (O esqueleto Cline e as falsas "junções" já foram **apagados** — ver 🗑️ *Garbage* no índice.)

#### Manter atualizado (obrigatório)

Quem acrescentar, remover, mover ou renomear **qualquer** item do harness tem de **atualizar
o índice na mesma alteração**. O índice e esta regra andam juntos — um índice a mentir é pior
do que não ter índice.

- Acrescentar/remover linhas **e** ajustar as **quantidades** no `📍 Location Map`
  (e as notas de cabeçalho das secções).
- O que sai de cena vai para a secção `🗑️ Garbage` do índice, **com motivo** — o registo não
  se apaga.
- Antes de dar a alteração por fechada, correr **os dois comandos** que estão no fim do
  `skills_index.md` (secção `🔧 Manutenção`):
  - **passe direta** (`índice → disco`): todas as entradas resolvem — `em falta=0`;
  - **passe inversa** (`disco → índice`): nenhum `SKILL.md` fica de fora — `ausentes=0` — e as
    contagens declaradas (`reference docs`, `skill tooling`, `shared data`, `vendor SKILL.md`,
    `cline`, `repos .git`) batem com o disco.

> **Só a passe direta não chega.** Ela pergunta *"as linhas que tenho resolvem?"* e, por
> construção, **nunca** encontra o que não está no índice. Foi essa assimetria que produziu o
> erro de 2026-10-13.

A mesma informação vive em `docs/ROADMAP.md` (§3, decisão D15). Os três ficheiros andam
juntos: `README.md` (esta regra) → `docs/ROADMAP.md` (o porquê e o histórico) →
`skills_index.md` (o inventário e a validação).

## Estado atual do código (v0.0.3)

Marcado pela branch `v0.0.3`. Resumo do que existe hoje: `index.html` (213 linhas),
`js/app.js` (485 linhas), `js/core/` (7 ficheiros), `css/style.css` (84 linhas),
`assets/images/`, `data/scene.json`, `i18n/pt.json` e as ferramentas em `tools/`.

O `js/app.js` é a **entrada do módulo** (`<script type="module">`). O `js/core/` é o
**núcleo** (Fase 1 do roadmap): o estado da cena, os registos e as regras de stencil —
a única parte global, porque o stencil é um recurso de toda a cena. Os 4 módulos
(dimensão, obra, portal, câmara) são a Fase 2.

### O que está implementado

| Área | Estado |
| --- | --- |
| Dimensões e portais com ID | 512 dimensões e 512 portais de organização; o ID aparece nos atributos, em `data-dimensao`, `data-portal-id`, nas classes e nos nomes dos objetos 3D |
| Grafo de dimensões | Portais bidirecionais entre duas dimensões, com uma **dimensão ativa** global; a cena tem 4 dimensões e 8 portais |
| Travessia | Por **colisão com a caixa** do portal (`caixa`, `caixaPosicao`, `caixaRotacao`), no plano do quadro ou na face da caixa (`gatilho`) — nunca por distância |
| Janelas | Uma por portal, com valor de stencil por **dimensão mostrada** (não por portal); portais que mostram o mesmo destino partilham o valor |
| Fundo 360º | `panorama-dimensao` por dimensão (imagem ou vídeo), segue a câmara; a dimensão 0 é a câmara real (canvas transparente) |
| Conteúdo | As obras pertencem à dimensão (`material-virtual="dimensao: N"`); o clique só abre na dimensão ativa |
| Molduras | Barra vermelha à volta do quadro, pertencente à dimensão onde o portal está; o bordo mantém-se fechado mesmo quando cruza a janela de outro portal |
| Modo debug | Tecla `D` mostra a caixa de colisão (sempre igual à usada na deteção); tecla `R` roda o portal |

### Modelo de render (ler antes de mexer)

1. `renderer.sortObjects = true` e `stencil: true` no `<a-scene>`.
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
   portal (`raio: 500` no `index.html`).

### Verificado nesta versão (medido no browser)

- **8/8** travessias da cena atual, sem trocas em cadeia ao chegar
- **0** poses (de 236) com o bordo da moldura cortado (era 110 antes da correção)
- Contorno da moldura fecha: 0 falhas de bordo em 8 poses (hub e dimensões 1, 2 e 3)
- 0 px de moldura dentro da própria janela; moldura de trás escondida pela janela da frente
- Clique na obra abre só na dimensão ativa
- Consola sem erros nem avisos

### Limitações e decisões assumidas

- **255 dimensões distintas** visíveis ao mesmo tempo (8 bits de stencil); portais por
  dimensão não têm limite.
- Onde uma moldura cruza uma janela, a parte da espessura (0,2 m) que fica **atrás** do
  plano da janela é tapada por ela — a moldura aparece um pouco mais fina aí.
- Uma obra que esteja **à frente** de uma janela desenha-se por cima do conteúdo dela.
- O cursor do A-Frame não leva teste de stencil (é elemento de interface).
- A dimensão 0 não tem conteúdo 3D: dentro das janelas que a mostram vê-se a imagem real
  da câmara (o canvas é transparente).

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
| O portal liga duas dimensões (`dimensaoA`/`dimensaoB`) | O portal passa a ter **dois eixos**: `window` (o que a janela mostra) e `action` (o que a travessia faz) |
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
| **Dimensão** | `0..511` | `panorama-dimensao="dimensao: 7"`, `material-virtual="dimensao: 7"`, `data-dimensao`, classe `dimensao-7`, nome dos objetos 3D (`dimensao-7-panorama`, `dimensao-7-obra`) |
| **Portal** | `0..511` | `portal-estencil-dinamico="portalId: 3; ..."`, `data-portal-id`, classe `portal-3`, nome dos objetos 3D (`portal-3-mascara`, `portal-3-moldura-0`, `portal-3-caixa-debug`) |

**Cada portal é um módulo independente**: tem as suas duas dimensões, a sua caixa de
colisão, o seu `gatilho`, a sua caixa de debug e a sua geometria. Não partilha estado
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

Um portal liga **duas** dimensões (`dimensaoA` e `dimensaoB`), de forma **bidirecional**:

| Onde estás | O quadro mostra |
| --- | --- |
| `dimensaoA` | `dimensaoB` |
| `dimensaoB` | `dimensaoA` |

Atravessar o portal (pela caixa de colisão) muda a **dimensão ativa** para o outro lado.

O `pertenceA` (opcional) diz em que dimensão é que a porta fica. Sem ele, a porta
aparece em qualquer uma das duas. É isto que permite ter, por exemplo, **7 portas do
lado da dimensão 1 e 7 portas do lado da dimensão 2**: cada grupo só se vê na sua
dimensão.

#### Cenários que esta arquitetura permite

| Cenário | Como se escreve |
| --- | --- |
| Dimensão central que dá acesso a todas | Um portal por destino: `dimensaoA: 0; dimensaoB: N`, todos na dimensão central |
| 7 portais da dimensão 1 para a 2 | 7 portais `dimensaoA: 1; dimensaoB: 2; pertenceA: 1` |
| 7 portais da dimensão 2 para a 1 | 7 portais `dimensaoA: 1; dimensaoB: 2; pertenceA: 2` |
| **Vários portais no mesmo sítio para o mesmo destino** | N portais iguais com `pertenceA` da dimensão deles (ex.: 2 portais de 2 → 1) |
| **Uma dimensão com portais para destinos diferentes** | Ex.: `pertenceA: 2` com 2 portais `dimensaoB: 1` e 1 portal `dimensaoB: 3` |
| Atravessar para "qualquer" outra dimensão | Um portal entre as duas; atravessar em qualquer sentido |
| Vários portais a mostrar dimensões diferentes no mesmo ecrã | Cada **dimensão mostrada** recebe um valor de stencil próprio |

Exemplo — uma central (0) com dois destinos, e conteúdo nas dimensões:

```html
<a-entity panorama-dimensao="dimensao: 1; src: #cidade-360"></a-entity>
<a-entity panorama-dimensao="dimensao: 2; src: #praia"></a-entity>

<a-entity position="-10 0 -12" portal-estencil-dinamico="portalId: 0; dimensaoA: 0; dimensaoB: 1"></a-entity>
<a-entity position=" 10 0 -12" portal-estencil-dinamico="portalId: 1; dimensaoA: 0; dimensaoB: 2"></a-entity>

<a-box position="0 1.5 -30" material-virtual="dimensao: 1" abrir-modal="url: assets/images/praia.jpg"></a-box>
```

#### Cena atual (`index.html`)

O `index.html` monta **4 dimensões**. As dimensões 0, 1 e 2 formam um grafo completo (2
portais cada uma, um para cada uma das outras); a **dimensão 2 tem 3 portais** — dois para
a dimensão 1 e um para a dimensão 3 — e a dimensão 3 volta à 2.

| Dimensão | Conteúdo | Portais (id: liga para onde) |
| --- | --- | --- |
| **0** (realidade / hub) | Vê-se a câmara | `0 → 1`, `1 → 2` — em `x = ∓6`, `z = -8` |
| **1** (cidade 360º) | `#cidade-360` + 5 obras | `2 → 0`, `3 → 2` — em `x = ∓25`, `z = -45` |
| **2** (praia) | `#praia` + 3 obras | `4 → 1`, `5 → 1` e `6 → 3` — em `x = -25`, `x = 25` e `x = 0`, `z = -80` |
| **3** (céu 360º) | `#skycloud` + 2 obras | `7 → 2` — em `x = 0`, `z = -120` |

Cada portal tem `pertenceA` igual à sua dimensão, por isso dentro de uma dimensão só se
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

| Atributo | Significado | Omissão |
| --- | --- | --- |
| `portalId` | ID do portal | `0` |
| `dimensaoA`, `dimensaoB` | As duas dimensões que a porta liga | `0` e `1` |
| `pertenceA` | Dimensão onde a porta fica (`-1` = qualquer das duas) | `-1` |
| `width`, `height` | Tamanho do quadro | `12`, `16` |
| `caixa` | Tamanho X, Y, Z da caixa de colisão | `12 16 1` |
| `caixaPosicao` | Centro da caixa (espaço do portal) | `0 8 0` |
| `caixaRotacao` | Rotação da caixa, em graus | `0 0 0` |
| `gatilho` | Onde a travessia dispara: `plano` (plano do quadro) ou `caixa` (face de entrada) | `plano` |

A caixa é a **única** fonte da sua geometria: a caixa de debug usa exatamente os mesmos
valores (`caixa`, `caixaPosicao`, `caixaRotacao`), pelo que nunca pode divergir.

**Porquê `plano` por omissão:** a máscara só escreve o stencil quando está à frente da
câmara, ou seja, o quadro só é uma janela de um dos lados. A troca tem de acontecer no
plano do quadro, que é o plano central da caixa — é o único ponto em que a troca não se
nota. Com `gatilho: caixa` fica-se ~0,55 m com a dimensão errada durante a travessia.

#### Conteúdo: pertence à dimensão, não ao portal

- `panorama-dimensao="dimensao: 7; src: #imagem"` — o fundo 360º da dimensão 7. O `src`
  aceita imagem **ou vídeo**; um vídeo é usado como `THREE.VideoTexture`, por isso anima
  (por exemplo a imagem da câmara: `src: #webcam-video`).
- `material-virtual="dimensao: 7"` — uma obra que pertence à dimensão 7.

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
- `renderer.sortObjects = true` em `config-ar` (`js/app.js`): com `false` o three
  **ignora o `renderOrder`** e desenha pela ordem da árvore — o que só funciona por acaso
  com um portal. Com vários, as máscaras têm de ser desenhadas antes de todo o conteúdo.
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
- **Cada material segue o papel da sua dimensão** (`aplicarEstadoEstencil`):
  - **dimensão ativa**: **sem teste de stencil** — quem manda é a profundidade (item
    anterior). Vale para o panorama, as obras, **a moldura do portal e a caixa de debug**.
  - **dimensão vista por uma janela**: `Equal` com o valor dessa janela e
    `depthTest: false` (o mundo da janela está "do outro lado" dela, a profundidade da
    máscara não conta para ele).
  - **dimensão sem janela**: `Never`, não desenha.
- **O raio do panorama de uma dimensão tem de ser maior do que a distância a qualquer
  portal** (`raio: 500` no `index.html`): o fundo da dimensão ativa tem de estar sempre
  atrás do plano das janelas, senão apareceria dentro delas.
- `gestor-dimensoes` (na cena) é o único que decide: deteta as travessias e atribui os
  valores de stencil por frame.

#### Obras: clique só na dimensão onde estás

O estêncil esconde a obra, mas o raycaster do A-Frame continua a apanhá-la (não vê o
stencil nem `object3D.visible`). Por isso o `abrir-modal` só abre se a dimensão da obra
for a **dimensão ativa**: vê-la pela janela não conta.

### Recursos Recentes

- **Grafo de Dimensões**: portais bidirecionais entre duas dimensões (qualquer par), com
  uma dimensão ativa global — permite a central que dá acesso a todas
- **IDs em Tudo**: cada dimensão e cada portal tem um ID que aparece nos atributos,
  classes, `data-*` e nomes dos objetos 3D
- **Tracejo por Colisão com a Caixa**: sem debounce, sem cooldown e sem distância;
  calculada no espaço do portal, por isso funciona com portais deslocados, rodados e em
  movimento, e com muitos portais ao mesmo tempo
- **Portais Pertencem a uma Dimensão**: `pertenceA` separa os portais de cada lado
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

Tudo é decidido por frame: `gestor-dimensoes` (`js/app.js`) deteta as travessias e o
núcleo (`js/core/stencil.js`) atribui os valores de stencil e decide o que cada material
desenha, a partir da colisão com a caixa e de `state.activeDimension`:

- **Onde estás**: o conteúdo da tua dimensão desenha-se em todo o lado **excepto** onde uma
  janela está *à frente* (é a profundidade que decide, não o stencil).
- **O que a janela mostra**: o conteúdo da dimensão do outro lado desenha dentro do quadro
  (`Equal` com o valor daquela dimensão, sem contar com a profundidade da máscara).
- **Sem piscas**: a troca acontece no plano central da caixa, exatamente onde a máscara
  muda de lado, por isso não há frames com a dimensão errada (com `gatilho: caixa` há,
  ver acima).
- **Vários portais**: cada janela que mostra uma dimensão diferente recebe um valor de
  stencil próprio, por isso portais com destinos diferentes coexistem no mesmo ecrã.

### 7. Modo Debug

Durante o desenvolvimento, você pode ativar o modo debug para visualizar a caixa de colisão do portal:

- A caixa de debug aparece como um wireframe azul semi-transparente (nome `portal-<id>-caixa-debug`)
- Tem sempre as mesmas dimensões X, Y e Z, posição e rotação que a caixa de colisão (`caixa`, `caixaPosicao` e `caixaRotacao`)
- Serve para ver exatamente onde a travessia dispara (é uma caixa por portal)
- Como o resto da geometria do portal, a caixa de debug é tapada pelas janelas que lhe
  ficam à frente, pela profundidade (não tem teste de stencil próprio)
- A consola regista apenas as mudanças relevantes (`[portal] Dimensao ativa: 2`)

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

### 2. Personalizar Conteúdo

- Modifique as imagens e vídeos na pasta `assets/`
- Atualize as referências nos arquivos HTML
- Adicione novas "obras" utilizando componentes A-Frame

## Melhorias Planejadas

- Portais com movimento e rotação animados, definidos na cena
- Mais conteúdo por dimensão (vídeo 360º como fundo, por exemplo)
- Um gestor de portais que crie as janelas a partir de uma descrição da cena (uma lista de
  dimensões e portais), em vez de entidades escritas à mão no `index.html`
- Testes automáticos das travessias e das janelas (o que hoje é medido à mão no browser)

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
