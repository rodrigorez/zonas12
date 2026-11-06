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
├── scene4/             sala (a noite)
│   └── index.html
├── scene5/             sala (as ondas)
│   └── index.html
├── scene6/             sala (os becos)
│   └── index.html
├── scene7/             sala (as presenças)
│   └── index.html
├── scene8/             sala (as imersões)
│   └── index.html
├── scene9/             sala (o mangue)
│   └── index.html
├── scene10/            sala (as distopias)
│   └── index.html
├── scene11/            sala (a memória)
│   └── index.html
├── scene12/            sala (os tesouros)
│   └── index.html
├── scene13/            sala (as realidades)
│   └── index.html
├── README.md           documentação principal (fica sempre na raiz)
├── css/
│   ├── style.css       estilos da página, HUD, modal e D-pad
│   ├── editor.css      estilos da página de edição
│   └── obra.css        estilos da ficha da obra (D62)
├── js/
│   ├── app.js          arranque: carrega e valida a cena, constrói, e a ponte da interface
│   ├── arrival-frame.js  a ponte de imagem entre mundos (D43): o último quadro de uma página
│   │                   pintado pela página seguinte, antes de ela ter cena
│   ├── editor.js       o arranque da página de edição (a entrada, 15 linhas — D36)
│   ├── i18n.js         o catálogo da interface: `t()`, `?lang=` e a aplicação ao markup (D12)
│   ├── core/           núcleo: estado, registos, stencil, eventos, limites
│   ├── modules/        dimensão, obra, portal e câmara (Fase 2), com as fábricas da Fase 3, e o
│   │                   nome das coisas na vista de debug (`label.js`, Fase 4); a política do shader
│   │                   (`shader-policy.js`) e a lista interna (`shaders.js`, Fase 7)
│   ├── shaders/         um módulo por shader instalado (o corpo do fragment; Fase 7)
│   ├── scene/          a cena em dados: schema, validação, construtor, os dois anéis (D77), a
│   │                   chegada (L16), o mundo real que a janela deixa passar (D81) e as regras de
│   │                   desenho
│   └── editor/         o editor (Fase 4): modelo, painéis, pré-visualização, problemas, os
│                       controlos partilhados, as respostas que a página pode dar sobre os
│                       ficheiros e a ponte com o servidor da ferramenta (Fase 5)
├── data/
│   ├── mapa.json       o mapa das portas da galeria (D96): as **27 salas** e as **49 arestas**, julgadas
│   │                   pela L24 e pela L25 **antes** de existir uma sala. É a fonte da decisão D-B —
│   │                   os destinos de uma sala nova leem-se, não se escolhem (`tools/scene/mapa.mjs`)
│   └── worlds/         uma cena por mundo (D24): gate, scene1, scene2, scene3, scene4, scene5,
│                       scene6, scene7, scene8, scene9, scene10, scene11, scene12 e scene13, mais os
│                       fixtures (`example`,
│                       `exemplo-ficha`, `r9`, `shader` e a sala de ensaio `scene100` — D84; o mundo sai do
│                       **endereço**: `/` é o portão, `/scene1/` é a
│                       primeira sala; o `?scene=<mundo>` continua a forçar um deles, para os testes)
├── i18n/
│   ├── pt.json         textos da interface: 222 chaves (199 delas do editor), lidas por js/i18n.js
│   └── en.json         as mesmas 222 chaves em inglês (?lang=en); um teste compara as duas
├── docs/
│   ├── ROADMAP.md      plano de desenvolvimento (módulos, mundos e página de edição), com as
│   │                   decisões (D1…) e as leis (L1…L31)
│   ├── SPEC-NOVA-SALA.md  o roteiro para abrir uma sala nova (D83): doze fases, doze armadilhas e
│   │                   a lista de aceitação
│   ├── GUIA-DE-TESTES.md  a ficha da obra e o ensaio A/B do shader nos três aparelhos
│   ├── ROTEIRO-DE-TESTE.md  o roteiro de teste de campo
│   └── PRE-EXPOSICAO.md   o que falta antes de abrir ao público
├── teste/               páginas de ensaio fora da exposição: o ensaio dos fundos GLSL
│                        (`shader.html`), o banco de motores e as esferas de comparação
├── assets/
│   ├── panoramas/      fundos 360º (2:1, normalizados no B5 da Fase 3B)
│   ├── artworks/       imagens das obras
│   ├── video/          o vídeo usado como obra
│   ├── models/         os modelos GLTF (o do fixture do R9 — D58)
│   ├── covers/         a capa de aviso, quando nenhuma das tentativas dá (D65)
│   └── previews/       os retratos das portas de mundo (um por porta — D46)
├── tools/
│   ├── coordination/        a **oficina** (D96): a escrita atómica (`atomic.mjs`), a trava que deixa
│   │                        **vários agentes** trabalhar sem se apagarem (`locks.mjs`), quem está a
│   │                        escrever agora (`status.mjs`) — estado em `<git-common-dir>/zonas-run/`,
│   │                        que é o único sítio que todos os worktrees vêem
│   ├── scene/               validador dos ficheiros de cena (corre a mesma validação que o browser,
│   │                        mais o grafo dos mundos e os arranques), o instrumento das leis
│   │                        (avarias injetadas, uma por lei), o verificador dos arranques (D28), a
│   │                        ferramenta que cria a pasta e o arranque de um mundo novo (D31), a que
│   │                        escreve o esqueleto de uma sala dos dois lados (D83), o que **sorteia o
│   │                        movimento** das portas de uma sala nova (D87), as que põem as
│   │                        obras e as portas nos anéis (D77), o giro dos retratos (D78) e os buracos
│   │                        do mundo real (D81), a que desenha os retratos das portas (D46), o
│   │                        **mapa das portas** — o balcão que julga as 27 salas e imprime o dossiê de
│   │                        cada uma (D96) —, o ensaio dos **anéis do portão** (D97) e as
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
  (`scene1/`, `scene2/`, `scene3/`, `scene4/`, `scene5/`, `scene6/`, `scene7/`, `scene8/`, `scene9/`, `scene10/`, `scene11/`, `scene12/` e `scene13/`, cada uma com o seu `index.html` — Fase 3B), `css/`, `js/`,
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

- O projeto tem **um** `index.html` na raiz (o portão) e um por mundo — hoje **onze** pastas,
  `scene1/` a `scene11/` (Fase 3B, D28). São todos o **mesmo ficheiro fora da linha do `<base>`** —
  a raiz aponta `href="./"` e as salas `href="../"` — e **não podem divergir**: quem edita um edita
  todos, e o verificador dos arranques (`tools/scene/arranques.mjs`, corrido pelo `new-world.mjs` e
  pelo `validate.mjs`) exige que sejam iguais fora dela.
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
- `docs/` tem os restantes documentos de trabalho: a **[spec de uma sala nova](docs/SPEC-NOVA-SALA.md)**
  (o roteiro para abrir uma cena, com as armadilhas e a lista de aceitação — D83), o
  **[guia de uma sala nova](docs/GUIA-NOVA-SALA.md)** (o mesmo caminho, operacional: os comandos por
  ordem e a frase que cada um tem de dizer), o
  [guia de testes](docs/GUIA-DE-TESTES.md) (a ficha da obra e o ensaio A/B do shader nos três
  aparelhos), o [roteiro de teste](docs/ROTEIRO-DE-TESTE.md) e o
  [que falta antes de abrir ao público](docs/PRE-EXPOSICAO.md).
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
- **SEMPRE que a tarefa for criar uma sala ou uma página nova, siga o
  [`docs/GUIA-NOVA-SALA.md`](docs/GUIA-NOVA-SALA.md) do princípio ao fim** — os comandos por ordem e,
  em cada passo, a frase que a ferramenta tem de imprimir. A
  [`docs/SPEC-NOVA-SALA.md`](docs/SPEC-NOVA-SALA.md) é a **razão** das coisas (as leis, as medições, as
  decisões D-A a D-D) e abre-se quando o guia remete para uma secção dela. Saltar o guia não dá erro
  nenhum: dá uma exposição que abre e está errada
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
>
> **E a passe 4 (2026-10-14, decisão D17).** As passes 1–3 olham todas **para dentro do
> índice**: só vêem o que o índice diz saber. Nada conferia o *frontmatter* de um agent contra o
> disco — um token a apontar para uma skill inexistente era invisível às três, e foi assim que
> passou o `refactoring-patterns` do `code-archaeologist`. A passe 4 percorre `agent → disco`, a
> direção que nenhuma das outras toma.

A mesma informação vive em `docs/ROADMAP.md` (§3, decisões **D15** e **D17**). Os três ficheiros andam juntos,
**sem se repetirem**: `README.md` (a regra) → `docs/ROADMAP.md` (o porquê) →
`skills_index.md` (o inventário, único dono dos números) + `HARNESS_LOG.md` (a história).

## Estado atual do código (v0.0.45)

> **Atualização (2026-11-01, a costura das travessias — D78):** a costura (D46) estava vermelha e o autor
> pediu para a fechar. Apareceram **quatro** causas. A primeira era um defeito de sempre: a **chegada
> ignorava a direcção** — o `look-controls` zerava o `rotation` que o `arrivalPoint` calcula, e o
> visitante aterrava sempre a olhar a **−Z**; nas sete salas cuja porta de chegada está em frente via a
> própria porta a tapar o ecrã (era esse o «quadro verde» das portas do portão). As outras três: o **giro
> do retrato** de cada porta, porque o fundo da janela é ancorado ao azimute do mundo de destino e a
> janela está no mundo de origem (**L26**, `portraitTurn` em `js/scene/ring.js`, `window.azimuth` escrito
> nas **39** portas por `tools/scene/azimuths.mjs`); o **instante** do fundo, que ia 0,25 s à frente da
> ponte (`anchor` na política do shader, ancorado no `js/app.js` antes de a ponte sair); e o **recorte**,
> que escondia as janelas das portas do destino e ficava com um buraco em cada uma. A chegada passou a
> ser provada na direcção (**L27**, no T7/T11) e o instrumento da costura passou a medir **duas** coisas:
> a imagem no mesmo instante (**≤ 0,50**) e o instante do corte (**≤ 1 quadro de fundo**). Medido: 27,79
> → **0,29**, 13,90 → **0,10**, 45,61 → **2,11** e 1,26 → **0,27**, com **0 ms** de salto de tempo; a
> bateria inteira dá **119 de 128** (era **111**), com **oito** portas ainda entre **0,58 e 2,29** — as
> janelas das portas do destino, dentro do recorte, são uma fotografia parada e ao chegar são a coisa
> viva. Duas lições de instrumento: o **T5** contava com a câmara a olhar a −Z por acidente (era o
> defeito que o alimentava) e o **T10/T12** passou a esconder a esfera em vez de tingir o `uTime`, que
> deixou de mudar pixéis com o giro. Os 39 retratos foram refeitos, duas passagens. Decisão **D78** (§11
> do roadmap).
>
> **Atualização (2026-11-01, a tira vermelha dentro da janela — D79):** o autor viu uma tira vermelha a
> dividir a imagem dentro de duas portas do portão. Não era a moldura — as barras eram caixas com 0,2 m de
> profundidade e cheguei a pôr a moldura plana, mas o artefacto não era esse e a moldura voltou a ser como
> estava. Era o **quadro da porta por onde se chega**: fica a ~1 m da câmara do retrato e tem 10x12 m, e
> ocupava metade da fotografia de cada retrato — a janela mostrava-o de lado. O `tools/scene/portrait.mjs`
> passa a esconder essa porta enquanto desenha o cubo, e os 39 retratos foram refeitos: os recortes passam
> de **398 kB** de média para **57 kB**, a porta 0 do portão vai de **2,11 → 0,28** e a costura de **119 →
> 123 de 128**. Decisão **D79** (§11 do roadmap).
>
> **Atualização (2026-11-02, a ordem da janela — D80):** o autor viu a obra que está *dentro* de uma porta
> desenhada por cima da obra que está na sala dele. A ordem que a política do stencil decide já estava
> certa — o recorte em `drawOrder.panorama`, as obras da sala em `drawOrder.artwork` — e não chegava: o
> recorte era um material **`transparent`**, e o three.js desenha todos os materiais transparentes
> **depois de toda a geometria opaca**, onde o `renderOrder` deixa de contar. O recorte passa a **opaco com
> `alphaTest: 0.5`** (o alfa do retrato cozido é 99,5% transparente e 0,3–0,4% opaco) e ganha o lugar
> **`drawOrder.cutout = 2.5`**: depois do fundo da janela, antes das obras da sala. A medição precisou de
> um instrumento novo, `tools/regression/ordem-da-janela.mjs`, porque a sobreposição que o defeito pede é
> uma coincidência do mundo (a obra em frente da janela **e** conteúdo do destino naquele sítio): a bateria
> **constrói-a** — encosta uma obra a 3 m de uma porta com janela de shader e põe a câmara a 1,2 m dela — e
> mede a coisa **e** o controlo positivo, que é o mesmo material posto em `transparent`. Medido: **0 px**
> do recorte sobre a obra nas **11 salas**, contra **12 870 a 36 863 px** no controlo, **22 de 22**; os
> doze continuam **91 de 91** e a costura **123 de 128**, com os mesmos cinco casos vermelhos e nenhum
> deslocamento. Decisão **D80** (§11 do roadmap).
>
> **Atualização (2026-11-02, o mundo real atrás da porta — D81):** com a D80 fechada ficaram quatro casos
> na costura, todos com a mesma causa: a porta `dimension-pair` que mostra a dimensão `camera` não
> desenha nada — vê-se o **mundo real** através dela porque o renderer tem `alpha: true` e o `<video>` da
> câmara fica atrás do canvas. A janela de uma porta de mundo é uma fotografia, e nela esse sítio ficava
> com o *fundo do destino*: o céu onde ao chegar se vê a câmara (medido **0,72 / 1,70 / 0,76 / 0,62**).
> Uma fotografia da câmara não existe, e não deve existir — a câmara de quem olha não é um asset —, por
> isso o que se fura é o **fundo ao vivo**: o preâmbulo dos shaders descarta os fragmentos que caem nos
> retângulos de `window.reality`, o pixel fica com o alfa do canvas e aparece a **mesma** câmara da
> página, na janela e na chegada. A conta é uma só (`js/scene/reality.js`), o dado é escrito por
> `tools/scene/reality.mjs --aplicar` (**28** portas) e provado pela **lei L28**, com a avaria injectada a
> ser detectada. Medido nas quatro portas: **0,14 / 0,20 / 0,29 / 0,30** (meta 0,50). A costura passou a
> **não comparar os blocos onde o mundo real está**: um fotograma de câmara não é uma imagem e cada página
> abre o seu stream — verde contra preto media **2,34** onde a geometria dá **0,28**. Os blocos ignorados
> saem do mesmo retângulo do dado, projectado com a câmara da chegada, e o resto da janela continua a ser
> julgado. Decisão **D81** (§11 do roadmap).
>
> **Atualização (2026-11-02, a emenda da esfera — D82):** o autor fotografou os onze fundos shader e pediu
> um estudo da costura que se vê em vários deles — a emenda que um shader desenhado numa esfera tem sempre
> entre o lado esquerdo e o direito. A causa é uma só, em quatro disfarces: `az = atan(d.x, −d.z)` é um
> **serrilhado** (salta de +PI para −PI atrás do visitante), e tudo o que o use como linha recta se corta
> ali — os sectores de um tronco, as colunas de um fichário, a fase de uma onda, as células de uma
> estrela. Medido antes da correcção: **56,63** em `aguas`, **35,68** em `nuvens`, **32,78** em `mangue`,
> **3,81** em `fichario`, **2,68** em `nucleo`. O preâmbulo passou a oferecer as três ferramentas, numa
> casa só para todos os corpos: **`volta`** (o azimute em voltas, −0,5 a +0,5), **`azim`** (o par `d.xz`,
> contínuo em toda a volta) e **`noise3`** (o ruído lido na direcção, que não tem coordenada que salte).
> Com elas, quatro regras: o ruído orgânico (`nuvens`, `aguas`, `mangue`) lê-se na **direcção**; os
> padrões (os 26 sectores do `mangue`, os 20 do `nucleo`, as 24 gavetas do `fichario`, os 69 tijolos por
> volta do `becos`, as estrelas) contam-se em **voltas inteiras** e o índice da célula fecha com `mod`;
> os múltiplos de `az` dentro de um seno são **inteiros** (era o mais escondido: `fase * 2,7` punha 5,4
> voltas em `az`); e o chão de `holograma` e de `grade-neon` passa a ser contado em **coordenadas de
> mundo**, como já era o do `nucleo`. A distância a um meridiano (o sol de `por-do-sol`, a coluna de
> `aguas` e de `mangue`) é agora a da **volta mais curta**. Instrumento novo,
> `tools/regression/emenda.mjs`: não há esfera nem câmara — um quadrado em que cada pixel vale por uma
> direcção, a emenda na coluna do meio, o degrau medido **com a rampa descontada** e comparado com o maior
> degrau que o shader já tem na mesma faixa, em cinco elevações e quatro instantes, com três controlos
> (um corte a nu **255,00**, a volta e meia que se corrigiu **243,00**, a volta inteira que já fechava
> **0,83**). Medido depois: **0,20 · 0,22 · 2,10 · 0,12 · 0,18** — nove dos onze abaixo de **0,25**, e os
> dois que não ficam (`holograma` **2,79**, `mangue` **2,10**) ficam dentro do que o próprio shader
> desenha na mesma faixa. Os **39 retratos** foram refeitos, duas passagens, e o validador dos shaders dá
> **11 de 11** com a cadência intacta (19,8–20,0 atualizações/s). A verificação completa dá **27 de 28**
> baterias em **2 735,7 s**; a que falta é a costura das travessias (**D46**), que já estava vermelha e
> continua em **124 de 128** — o mesmo total de antes, com duas portas agora em **0,56–0,58**, logo acima
> da meta de 0,50: o fundo mudou de desenho e o retrato e a vista ao vivo já não casam ao mesmo pixel.
> Decisão **D82** (§11 do roadmap).
>
> **Atualização (2026-11-02, o roteiro de uma sala nova — D83):** o autor pediu uma spec — um roteiro que
> desse «total confiança de termos as próximas cenas em funcionamento correto» — antes de sincronizar
> versões. Nasceu o [docs/SPEC-NOVA-SALA.md](docs/SPEC-NOVA-SALA.md): o que uma sala é nos seus objetos,
> as três decisões que se tomam antes de tocar em ficheiros, **doze fases** com comando e condição de
> aceitação, as **doze armadilhas** com o número que cada uma custou, os ficheiros que uma sala toca (o
> registo real da sala 11, 35 ficheiros) e a lista que fecha uma sala. A validação da spec encontrou um
> buraco a sério: as duas baterias que medem a exposição página a página tinham a lista de páginas
> **escrita à mão**, e uma sala fora dela ficava **verde sem ser medida**. Ficou fechado em três peças:
> as listas passam a vir do dado (`tools/regression/paginas.mjs`, com as chegadas deliberadas numa linha
> só); cada bateria verifica «a lista cobre todas as salas do dado (N)» antes de medir; e o
> `tools/scene/new-room.mjs` escreve o esqueleto de uma sala dos **dois lados** (a sala, o portão e cada
> destino, com as portas, os retratos e os assets que ainda não existem) e corre os anéis, o giro, os
> buracos e o validador. O ensaio, com uma sala criada só pelo comando: **13 salas alcançáveis**, todas
> as chegadas (L19), os conjuntos distintos (L25), os giros (L26) e os buracos (L28) certos, o validador
> verde em tudo menos a L9 dos retratos, e a sala medida pelos T2–T12 **sem uma linha de código a mais**
> — **8 de 8**. Duas emendas que o ensaio obrigou: as fases 4 a 6 correm sobre **todos** os mundos (só
> nos tocados, a L26 rebentava em sete portas de quatro salas intocadas) e a fase 7 admite a L9 vermelha
> até os retratos nascerem. Medido: os doze **92 de 92** (era 91) e as portas **157 de 157** (era 156) —
> o `+1` de cada é a verificação de cobertura. Decisão **D83** (§11 do roadmap).
>
> **Atualização (2026-11-02, a sala de ensaio — D84):** o autor pediu que a spec fosse **validada com
> uma funcionalidade nova**: uma sala onde se experimenta o movimento das portas sem o pôr no caminho do
> visitante. Nasceu a **`scene100`**, um **fixture** com dado (`data/worlds/scene100.json`) e sem pasta —
> é um fixture, e não uma lei nova, que a torna possível: o validador e o `validation.js` já dispensam
> os fixtures das leis da disposição (L19, L22, L24, L25, L26, L28), pelo que a sala está **fora do
> grafo** sem que nenhum outro mundo mude. Duas regras só dela: **só se sai, nunca se entra** (nenhuma
> porta do projeto aponta para lá; as quatro dela apontam para o portão e para as salas 3, 6 e 9) e as
> portas dela **navegam sem `?from`** — um campo novo no dado, `world.carryOrigin: false`, aplicado no
> sítio único onde o `js/modules/portal.js` escreve a URL, o que faz do destino uma **primeira visita**
> (pose por omissão, sem porta de chegada). Os retratos dessas portas são a **primeira visita**:
> `tools/scene/portrait.mjs` ganhou `--direto` e deixou de ter a lista de pares escrita à mão — os pares
> passaram a sair do dado (cada porta `preview` que navega, na convenção `<destino>-de-<origem>`), o que
> trouxe os três pares novos sem uma linha a mais. A bateria das portas inverteu a expectativa para
> `carryOrigin: false` (exige que o `from=` **não** esteja lá — sem isso a regra nova nunca seria
> medida) e a das páginas passou a abrir a sala de ensaio por `?scene=scene100`. Medido: `validate`
> **OK** (4 portas, 7 assets, 4 janelas distintas), os retratos de **39 → 42**, os doze **99 de 99** (era
> 92 — a página nova medida de ponta a ponta). Decisão **D84** (§11) e §9 da spec. O **movimento** veio
> a seguir, com a autorização do autor (D85): as três portas oscilam ±5 m e ±90°, uma em cada eixo, e a
> bateria dos portais em movimento passou a medir isso — **13 de 13**, com a amplitude em cada eixo, a
> meia oscilação de **10,00 s** e a porta do portão parada como controlo. A rotação roda **sobre o centro
> da porta** (D86): rodar sobre a base prendia-a ao chão e a ±90° atirava-a para fora da moldura — medido,
> com o pivô na base o centro sai **8,49 m** do lugar, e com o pivô no centro sai **0,000 m**.
>
> **Atualização (2026-11-02, o movimento sorteado das salas novas — D87):** o autor quis que as portas de
> uma sala nova **não escolhessem** o movimento. As regras ficaram escritas na spec (§10, com a fase 6b no
> roteiro) **antes** de serem usadas: translação em X ou Y com **metade da dimensão do eixo**, rotação em
> X, Y ou Z com **45° ou 90°**, dois períodos independentes em **[10, 20] s**, e o sorteio **repetido**
> enquanto a lei nova — **L29**, o alcance do visitante ao longo do ciclo — não passar. Quatro coisas
> apareceram e todas mudaram a conta: **os eixos são os da porta e não os do mundo** (com os do mundo,
> metade das portas do anel passava a lei sem oscilar: 12 de 12 contra 8 de 12); **o alcance mede-se no
> par de fases** (dois períodos percorrem um toro — um ciclo só dava 58,4% onde o toro dá 48,0%);
> **a caixa varre o visitante parado** (chega a 10,01 m para dentro da sala, e 3 dos 8 sorteios legais
> punham-no dentro dela entre 10,4% e 36,5% do ciclo, com a travessia a disparar pelo cruzamento do
> plano — passou a exigir que ele **ande**); e **o retrato tem de ser cozido com as portas assentes**
> (`settleMotion`), senão a janela mostra uma pose e a chegada outra. Medido: **8 das 12 combinações
> passam** (rejeita **1 em 3**), **1,504 tentativas por porta**, translação **X 49,9% · Y 50,1%**,
> rotação **X 0,0%** (nunca sai) **· Y 50,0% · Z 50,0%**, ângulo **45° 49,9% · 90° 50,1%**. A sala de
> ensaio foi refeita com o sorteio — quatro portas, alcances **100 / 100 / 65,3 / 60,0%**, e a do portão
> deixou de ser o controlo parado (as quatro oscilam; o controlo passou a ser «assentes, estão onde o
> ficheiro as põe»). As leis passam a **31 de 31**, os portais em movimento a **16 de 16**, os doze
> **99 de 99** e o i18n **9 de 9** (224 chaves); e a verificação completa, `all.mjs --full`, dá **27 de
> 28** baterias, com a única vermelha a ser a costura (**D46**), como antes. Decisão
> **D87** (§11 do roadmap).
>
> **Atualização (2026-11-02, as portas sem chegada — D89):** a verificação da documentação encontrou o
> único ponto onde o dado afirmava mais do que o repositório provava: as três portas da sala de ensaio
> navegam **sem `?from`** (`carryOrigin: false`), e sem porta de chegada no destino não havia segundo
> termo para a conta do giro — a **L26** saltava-as em silêncio, e a **L28** também. Ficou dito **o que é
> uma primeira visita**: o azimute é **0 por construção** (`FIRST_VISIT_AZIMUTH`; `cameras.player` não
> tem rotação e a câmara nasce a olhar para −Z), e as duas leis passam a julgar essas janelas, com as
> ferramentas a percorrê-las (`3 de primeira visita`) e **duas** avarias novas no autoteste. O dado já
> estava certo, por isso **nada foi recozido**: `validate` **0**, as leis **31 de 31**, o `azimuths` e o
> `reality` a dizerem `nada a escrever`. Fica por medir a **costura** destas portas, e está escrito.
> A verificação completa, `all.mjs --full`, dá **27 de 28** baterias em **2 863,0 s**, com a única
> vermelha a ser a costura (**D46**). Decisão **D89** (§11 do roadmap).
>
> **Atualização (2026-11-03, o roteiro posto à prova numa sala descartável — D90):** a pergunta foi
> «a documentação orienta a criação de uma sala nova sob esta estética?», e a resposta não foi dada a
> ler: o **roteiro foi corrido à letra**, numa sala `sala-teste` criada e **apagada a seguir**
> (fase 1 com `new-world.mjs`, depois o atalho com `--destinos scene5,scene7`). O guia **produz** a
> estética nova — **3 portas** (o portão e duas), as três a oscilar, eixos e ângulos sorteados
> (Y ±6 m/Y ±45°, Y ±6 m/Z ±90°, X ±5 m/Z ±45°), alcances **60,0 / 61,8 / 100 %**, nenhuma a varrer o
> ponto de chegada, semente `12048` na última linha — e o validador a seguir diz **13 salas alcançáveis**
> com a L19, a L25, a L26, a L28 e a D53 verdes, **só a L9 vermelha** nos dez retratos que ninguém
> cozinhou, que é exactamente o que a fase 7 admite. O ensaio desmentiu a documentação em **quatro**
> pontos, e todos fechados: (1) «as fases 1 a 7 têm um comando» era **falso** — o `new-room.mjs` exige a
> página (`a página é da outra ferramenta: … new-world.mjs`) e não compõe a sala, portanto é o atalho das
> fases **3 a 7** e a fase 1 é outro comando; (2) a **linha de comando completa** nunca estava escrita
> (`--nome-pt`, `--nome-en`, `--fundo`, `--sem-ferramentas`, os **2 a 4** destinos, a recusa do portão
> em `--destinos` e a L25 verificada antes de escrever); (3) a **estética de uma sala não tinha um sítio
> único** — passou a ter a **§2.1**, com o que cada número é e quem o mede; (4) faltava dizer que uma
> sala a sério **não é um fixture** (as isenções da `scene100` vêm da lista em `js/scene/fixtures.js`,
> e pôr lá uma sala apaga-a do grafo). Nada no código mudou — só a spec, e o ensaio não deixou rasto.
> A mesma passagem acertou as **versões**: o README chamava «v0.0.23» a um estado que a `v0.0.23` não
> tem (a branch pára em `50ca29c`, antes da sala de ensaio), e o resumo passou a ser o da **v0.0.24**,
> remedido ficheiro a ficheiro (§ «Estado atual do código»).
> Decisão **D90** (§11 do roadmap).
>
> **Atualização (2026-11-03, a décima segunda sala e os anéis a 60 m — D93):** o autor entregou as
> **quatro** pílulas da série «#TesorosdelArchivo» que faltavam (`Movimiento estudiantil de 1968`,
> `Colección Rafael Carrasco y Puente`, `Revolución Mexicana` e `Fondo Rodolfo Brito Foucher`, todas de
> **Cuikis · AHUNAM**) e a exposição passa a ter **doze salas**: `scene12` (**Tesouros 360º**, com o
> shader **novo** `deposito`, o décimo segundo da lista interna — o depósito do arquivo: as prateleiras
> de caixas de cartão com a etiqueta e a fenda do puxador, a lâmpada quente pendurada com o halo e o
> pó, a faixa pintada do corredor e o varrimento da lanterna). O sorteio das portas ficou com a semente
> **1793747954927** (**4 aceites, 3 rejeitados**, alcances **60,0% · 61,8% · 61,8% · 100%**). A sala
> tem **três destinos** — `scene6`, `scene9`, `scene10` —, e não os quatro que se tentaram primeiro: a
> `scene1` foi recusada por **duas** leis, e as duas medições dizem porquê. (1) A **L23** pedia **4,86°**
> de folga e a sala 1 só tinha **4,29°** com sete obras de 4 m e uma sexta porta — e 4,29° é o **teto**
> que `clearanceCeiling` dá para 7 obras × 6 portas, ou seja o óptimo de `bestPhase` já era curto. Daí
> a decisão de autor que muda o projeto inteiro: os dois anéis passam de **40 m / 60 m** para **60 m /
> 90 m** (a mesma proporção 2:3), e a folga pedida desce a **3,91°** — abaixo do teto com **0,38°** de
> margem. Medido: `ring --aplicar` põe **121 objetos** nos anéis e dá **13 ok, 0 justo, 0 falhas**.
> (2) Mesmo com a geometria resolvida, a **L24** limita a sala a **cinco portas** e a `scene1` já as
> tinha: a sexta fazia dela um átrio. Ficaram **três destinos**, e a `scene1` volta às **cinco**.
> Como o anel de todos os mundos se moveu, **nada ficou por refazer**: o giro (L26) e os buracos do
> mundo real (L28) voltaram a correr sobre os **13 mundos**, e os **49 retratos** (46 nas treze páginas
> e 3 na sala de ensaio) foram cozidos **duas passagens** — o número de portas com retrato subiu de
> **42** para **49** por causa das quatro portas de chegada e das três da sala nova. O dado tem agora
> **58 portas** nas treze páginas (o portão com **doze**), **61 obras**, **18** ficheiros de mundo e
> **101** ficheiros em `assets/previews/` (49 retratos + 49 recortes + 3 panoramas). O `validate.mjs`
> fecha **OK nos 18 ficheiros**, as leis **31 de 31** e os doze **106 de 106**. A verificação inteira,
> `all.mjs --full`, deu **25 de 28** em **3 350,7 s**: a costura (**D46**, agora **142 de 150** — eram
> **125 de 128** com 3 vermelhos —, com cinco saltos no corte entre **0,72 e 2,44**), a `shader.mjs`
> (dois quadros tardios, **23 de 23** sozinha) e o `assets.mjs`, que passou a esperar pela condição em vez
> de 2,5 s fixos e dá **10 de 10**. Decisão **D93** (§11 do roadmap).
>
> **Atualização (2026-11-04, a décima terceira sala — D95):** o autor entregou **seis** obras de animação
> digital — *video mapping*, realidade aumentada e realidade virtual — e pediu a `scene13`
> (**Realidades 360º**) montada pelo guia, com um **fundo novo** do tema: nasce o **`projecao`**, o
> décimo terceiro shader da lista interna, e é o **visitante dentro da cúpula de um mapping** — vinte
> painéis por volta e cinco filas, cada um com a sua moldura escura e o seu conteúdo a correr lá dentro,
> o chão da plateia a apanhar a luz, e o feixe do projector a varrer de baixo para cima com a franja
> cromática e o pó a acender-se quando passa. A emenda da esfera (D82) fecha por construção: a coluna
> conta-se em **voltas** com meio passo de deslocamento, para que a costura caia no **meio** de um painel
> e não numa moldura, e o índice leva `mod` (medido: pior salto **0,31** de luma). O `install.mjs` mediu
> **19,8 a 20,0 atualizações/s** e **p95 de 6,2 ms**, e o `emenda.mjs` deu **17 de 17**. A primeira
> versão foi **brilhante demais** para a casa (brilho medido **200**, painéis a 0,8 quando os outros
> fundos vivem entre 0,03 e 0,25) e o pó saía em nódoas do tamanho de um painel: afinou-se a cúpula
> (escurece para o zénite), baixou-se o brilho para **131** e o pó passou a grão fino — e os **quatro**
> retratos que mostram a sala (o do portão e os de `scene5`, `scene7` e `scene8`) foram **recozidos**,
> duas passagens, porque a janela tem de mostrar o que se vê ao chegar. A sala tem **três destinos** —
> `scene5`, `scene7`, `scene8` —, escolhidos pelo que a
> tabela da §0 do guia deixava em aberto: os três passam de **3 para 4 portas** e nenhum fica cheio, e o
> conjunto não repete o de nenhuma sala (L25). O sorteio do movimento ficou com a semente **72587**:
> **8 portas** (as quatro da sala nova e a de chegada em cada destino mais a do portão), **8 aceites**,
> **5 rejeitados** (0,63 por porta) e **21 já oscilavam (intocadas)** — a `--sem-movimento` da D94, a
> fazer o que devia. Alcances **68,0 · 100,0 · 60,0 · 60,0 · 65,3 · 100,0 · 65,3 · 100,0 %**, todos acima
> do mínimo de 50, e só duas portas varrem o ponto de chegada (**36,5%** e **16,7%** do ciclo). A troca
> do fundo arrastou **quatro** janelas que ainda declaravam `holograma` (as do portão e das três salas que
> apontam para a 13): a lei que compara o `shaderId` da janela com o da sala de destino apanhou-as antes
> de qualquer retrato ser cozido. E o guia teve de ser lido fora de ordem — o importador da folha recusa
> escrever um mundo com a L9 aberta, portanto os **56 retratos** (53 nas catorze páginas e 3 na sala de
> ensaio) foram cozidos **antes** das seis linhas da folha; como as duas passagens não dependem de texto
> nem de `kind`, nada ficou desactualizado (o `ring`/`azimuths`/`reality` a seguir disseram `nada a
> escrever`). Números: **14 páginas**, **19 ficheiros de mundo**, **66 portas** nas catorze páginas (o
> portão com **treze**), **67 obras**, **56 retratos** e **115** ficheiros em `assets/previews/`.
> Decisão **D95** (§11 do roadmap).
>
> **Atualização (2026-11-03, o movimento das portas entra nas doze páginas — D91):** o autor perguntou se
> a spec, seguida, deixava trazer o movimento sorteado às **11 salas e ao portão**. A resposta foi medida
> antes de se tocar em nada, e depois fez-se só o que a medição exigiu. As doze páginas têm **50 portas**
> (**11** no portão, **39** nas salas) e **todas são de duas mãos** — `arrivalFrom` igual ao destino,
> medido **50 de 50** —, portanto não existe «mexer só nas de saída»: ou todas oscilam ou nenhuma.
> Sorteio aplicado com a semente **20261103**: **50 aceites, 32 rejeitados** (0,64 por porta), translação
> **X 22 · Y 28**, rotação **Y 27 · X 4 · Z 19**, ângulo **45° 22 · 90° 28**, alcance **51,6% a 100,0%**
> (22 a 100%), e **25 das 50** portas põem a caixa sobre o ponto de chegada em algum instante (10,4 a
> 36,5% do ciclo). A medição obrigou a **duas** correcções no código e a uma nos instrumentos: (1) a
> travessia passa a ser decidida entre o ponto **de agora e o do quadro anterior**, ambos lidos na caixa
> de agora — antes, uma porta a rodar trocava o sinal do plano **sem ninguém ter cruzado**, e simulado
> sobre este dado dava **2,7%** das chegadas a disparar uma travessia não pedida, com **quatro portas
> entre 26% e 40%** (todas em Y); agora é 0 por construção; (2) a oscilação **começa quando a ponte de
> chegada sai** (`anchorMotion()`, ao lado do `anchorShaders` da D78) — sem isso o relógio da cena
> começava no carregamento e a porta já tinha andado metros por baixo da ponte; (3) o `seam.mjs` e o
> T7/T11 passam a **assentar as portas** antes de medir geometria (sem isso, **33 de 165** verificações
> perdiam a meia volta). **Nada foi recozido**: a pose de repouso é a pose em que os 42 retratos já
> estavam cozidos, portanto a imagem seria igual e não se gastou GPU (um lote de 39 pares custa 800–820 s,
> medido). A `motion.mjs` foi de **16 para 19** verificações (a âncora — **10,57 m → 0,0e+0 m**; a andar
> ao lado do plano com a porta a varrer — **0 navegações**; a atravessar o plano — **1**, o controlo; e
> as 5 portas da `scene1` a oscilar no ecrã). O comando, para repetir o sorteio:
> `node tools/scene/sorteio.mjs gate scene1 … scene11 --aplicar --semente 20261103`; o que ficou escrito
> e medido está na §11 da [spec](docs/SPEC-NOVA-SALA.md). Decisão **D91** (§11 do roadmap).
>
> **Atualização (2026-10-30, a disposição em dois anéis — feita):** as obras e as portas deixaram as
> filas e passaram a dois círculos com o centro no ponto onde o visitante entra — as obras a **40 m**, as
> portas a **60 m** —, e cada sala passou a ter **três a cinco portas**, uma delas de volta ao portão e
> as outras escolhidas uma vez e gravadas no dado. O grafo fica com **50 portas** nas doze páginas (o
> portão com **onze**, uma por mundo) e **39 retratos de porta**, todos refeitos depois da mudança; o céu
> ganhou a dimensão `camera` que a porta do portão pedia. A **chegada** passou a ser à **frente** da
> porta, virada ao centro, porque com as obras por dentro do anel a sala está do lado para onde a porta
> olha. Quatro leis novas — **L22** (os dois anéis), **L23** (a folga entre eles), **L24** (três a cinco
> portas, uma ao portão) e **L25** (nenhuma sala com o mesmo conjunto de destinos) — e duas peças novas:
> `js/scene/ring.js` (a conta) e `tools/scene/ring.mjs` (o instrumento que a mede e que escreve o dado).
> O que foi medido com tudo isto: `node tools/regression/all.mjs --full` — **25 de 26 baterias** em
> **2300,2 s**, com o dado **0**, as leis **29 de 29**, os doze **91 de 91** nas 13 páginas e as portas
> **156 de 156**. A que falta é a **costura das travessias** (**D46**), que está vermelha **desde antes
> do anel**: medida no v0.0.16, deu **3,4 a 17,3** onde a meta é **0,50**. Decisão **D77** (§11 do
> roadmap).
>
> **Atualização (2026-10-29, a décima primeira sala):** o autor entregou as **cinco pílulas de conteúdo**
> do AHUNAM — a série «#TesorosdelArchivo»: a Colección Ricardo Salazar Ahumada, «Los presidentes y la
> Universidad» e os fundos Heriberto Jara Corona, Ignacio García Téllez e Ezequiel A. Chávez — e a
> exposição passou a ter **onze salas** — `scene11` (**Memória 360º**, com o shader **novo** `fichario` —
> a sala dos catálogos: o chão em grelha, a parede inteira de gavetas com a etiqueta e o puxador, a
> lâmpada fria de mesa no tecto e o pó a passar dentro dela; a reserva é o panorama da praia). As **57
> obras** das onze salas estão na folha `data/obras.tsv`, e o portão passou a **dez portas** (`-54 · -42 ·
> -30 · -18 · -6 · +6 · +18 · +30 · +42 · +54`, recuadas de `z = -36` para `z = -40`: dez caixas de 12 m
> medem 120 m, e a razão é a de 3 m por metro da D70). A sala nova liga-se de volta à **noite** (portão →
> memória, noite ↔ memória), e a porta da noite fica a `x = +38`, no vão entre as obras de `+30` e `+50`.
> O grafo passa a **12 salas** (mais os quatro fixtures) com **46 portas** e **30 retratos de porta**
> (D46), e a bateria dos doze passa a medir **13 páginas**. Decisão **D76** (§11 do roadmap). O que foi
> medido: `validate` **0**, as leis **22 de 22**, o importador **21 de 21**, os doze **91 de 91** nas **13
> páginas**, as portas **126 de 126**, o shader **51 de 51** e o i18n **9 de 9** — **6 de 6 baterias**.
>
> **Atualização (2026-10-29, a décima sala):** o autor entregou as quatro peças da sala 10 e a exposição
> passou a ter **dez salas** — `scene10` (**Distopia 360º**, com o shader **novo** `nucleo` — a sala de
> máquinas do «Cérebro»: o chão e o tecto em grelha, as filas de bastidores com as luzes dos
> processadores a piscar, o fluxo de dados a correr para o fundo e a coluna do núcleo a pulsar; a
> reserva é o panorama da praia). As **52 obras** das dez salas estão na folha `data/obras.tsv`, e o
> portão passou a **nove portas** (`-48 · -36 · -24 · -12 · 0 · +12 · +24 · +36 · +48`, recuadas de
> `z = -32` para `z = -36`: nove caixas de 12 m medem 108 m, e a razão é a de 3 m por metro da D70). A
> sala nova liga-se de volta à **cidade** (portão → distopia, cidade ↔ distopia), e a porta da cidade
> fica a `x = -75`, no fim esquerdo da fila. O grafo passa a **11 salas** (mais os quatro fixtures) com
> **42 portas** e **27 retratos de porta** (D46), e a bateria dos doze passa a medir **12 páginas**.
> Decisão **D75** (§11 do roadmap). O que foi medido: `validate` **0**, as leis **22 de 22**, o
> importador **21 de 21**, os doze **84 de 84** nas **12 páginas**, as portas **114 de 114**, o shader
> **51 de 51** e o i18n **9 de 9** — **6 de 6 baterias**.
>
> **Atualização (2026-10-29, a nona sala):** o autor entregou as quatro peças da sala 9 e a exposição
> passou a ter **nove salas** — `scene9` (**Mangue 360º**, com o shader **novo** `mangue` — a água
> lamacenta com as ondulações a correr para o visitante, os troncos e as raízes de propágulo a subirem
> da linha da água, os pneumatóforos na lama rasa e a copa fechada com os feixes de luz a descer; a
> reserva é o panorama da praia). As **48 obras** das nove salas estão na folha `data/obras.tsv`, e o
> portão passou a **oito portas** (`-42 · -30 · -18 · -6 · +6 · +18 · +30 · +42`, recuadas de `z = -28`
> para `z = -32`: oito caixas de 12 m medem 96 m, e a razão é a de 3 m por metro da D70). A sala nova
> liga-se de volta à **cidade** (portão → mangue, cidade ↔ mangue), e a porta da cidade fica a `x = +75`,
> no fim direito da fila. O grafo passa a **10 salas** (mais os quatro fixtures) com **38 portas** e **24
> retratos de porta** (D46), e a bateria dos doze passa a medir **11 páginas**. Decisão **D74** (§11 do
> roadmap). O que foi medido: `validate` **0**, as leis **22 de 22**, o importador **21 de 21**, os doze
> **77 de 77** nas **11 páginas**, as portas **102 de 102**, o shader **51 de 51** e o i18n **9 de 9** —
> **6 de 6 baterias**.
>
> **Atualização (2026-10-28, a oitava sala):** o autor entregou as cinco obras da sala 8 e a exposição
> passou a ter **oito salas** — `scene8` (**Imersões 360º**, com o shader **novo** `holograma` — a grelha
> de meridianos e paralelos em volta do visitante, o chão em perspectiva e uma faixa de varrimento a
> subir; a reserva é o panorama da praia). As **44 obras** das oito salas estão na folha
> `data/obras.tsv`, e o portão passou a **sete portas** (`-36 · -24 · -12 · 0 · +12 · +24 · +36`,
> recuadas de `z = -24` para `z = -28`: sete caixas de 12 m medem 84 m, e a razão é a de 3 m por metro
> da D70). A sala nova liga-se de volta à **cidade** (portão → imersões, cidade ↔ imersões), e a porta
> da cidade fica a `x = -50`, no vão entre as obras de `-60` e `-40`. O grafo passa a **9 salas** (mais
> os quatro fixtures) com **34 portas** e **21 retratos de porta** (D46), e a bateria dos doze passa a
> medir **10 páginas**. Decisão **D73** (§11 do roadmap). O que foi medido: `validate` **0**, as leis
> **22 de 22**, o importador **21 de 21**, os doze **70 de 70** nas **10 páginas**, as portas **90 de
> 90**, o shader **51 de 51** e o i18n **9 de 9** — **6 de 6 baterias**.
>
> **Atualização (2026-10-28, a sétima sala):** o autor entregou as seis obras da sala 7 e a exposição
> passou a ter **sete salas** — `scene7` (**Presenças 360º**, com o shader **novo** `aguas` — água
> corrente: faixas paralelas ao horizonte, duas camadas de ruído a dobrar o traçado e o sol partido na
> superfície; a reserva é o panorama da praia). As **39 obras** das sete salas estão na folha
> `data/obras.tsv`, e o portão passou a **seis portas** (`-30 · -18 · -6 · +6 · +18 · +30`, recuadas de
> `z = -20` para `z = -24`: seis caixas de 12 m medem 72 m, e a 24 m o campo de visão apanha 72 m). A
> sala nova liga-se de volta ao **céu** (portão → presenças, céu ↔ presenças), e a porta do céu fica a
> `x = -40`, fora da sombra das três obras. A obra «Efeito vermelho» traz o **mesmo ficheiro** na capa
> e no «endereço da obra», e esse endereço responde **404**: fica obra de **imagem**, sem site (o
> critério da D70). O grafo passa a **8 salas** (mais os quatro fixtures) com **30 portas** e **18
> retratos de porta** (D46), e a bateria dos doze passa a medir **9 páginas**. Decisão **D72** (§11 do
> roadmap). O que foi medido: `validate` **0**, as leis **22 de 22**, o importador **21 de 21**, os
> doze **63 de 63** nas **9 páginas**, as portas **78 de 78**, o shader **51 de 51** e o i18n **9 de 9**.
>
> **Atualização (2026-10-28, a sexta sala):** o autor entregou as cinco obras da sala 6 e a exposição
> passou a ter **seis salas** — `scene6` (**Becos 360º**, com o shader **novo** `becos`; a reserva é o
> panorama da cidade). As **33 obras** das seis salas estão na folha `data/obras.tsv`, e o portão
> passou a **cinco portas** (`-24 · -12 · 0 · +12 · +24`, recuadas de `z = -14` para `z = -20` para o
> campo de visão apanhar as cinco), com o ramo **cidade ↔ becos** a segurar a sala nova: o beco são as
> ruas da cidade. Duas obras da folha («Tanto a falar, mas continuo sem voz.» e «Becos singulares
> 2023») trazem **duas imagens** e nenhum site — a segunda entra como a página da obra (o visualizador
> do Drive em `/preview`), que é o que a folha chama «endereço da obra». O grafo passa a **7 salas**
> (mais os quatro fixtures) com **26 portas** e **15 retratos de porta** (D46), e a bateria dos doze
> passa a medir **8 páginas**. Decisão **D71** (§11 do roadmap).
>
> **Atualização (2026-10-27, a quinta sala):** o autor entregou as cinco obras da sala 5 e a exposição
> passou a ter **cinco salas** — `scene5` (as ondas, com o shader **`ondas`**, que existia na lista
> interna desde a Fase 7 e nunca tinha sido nomeado por um mundo; a reserva é o panorama da praia). As
> **28 obras** das cinco salas estão na folha `data/obras.tsv` com o texto e os créditos do autor, e a
> sala 5 vive em `data/worlds/scene5.json` com a pasta e o arranque da D28. O **portão** passou a
> **quatro portas** (`-18 · -6 · +6 · +18`, a `z = -14`), e o circuito ganhou o ramo **noite ↔ ondas**:
> portão → ondas, e ondas ↔ noite. A sala 5 é a única das cinco com a porta do portão **no eixo**
> (`x = 0`), e é por isso que a fila das obras está nos tens ímpares (`x = -50 … +30`): a sombra de uma
> porta de 10 de largura mede `±5,6` no plano das obras, e a obra do centro ficaria inteiramente atrás
> dela. O grafo passa a **6 salas** (mais os quatro fixtures) com **22 portas** e **12 retratos de
> porta** (D46), e a bateria dos doze passa a medir **7 páginas**. Decisão **D70** (§11 do roadmap). A
> única obra sem texto é a `scene5` **id 1** («A CASA»), que o autor entregou com um ponto final.
>
> **Atualização (2026-10-27, as quatro salas e o texto do autor):** o autor entregou as folhas das
> salas 2, 3 e 4 e a exposição passou a ter **quatro salas** — `scene1` (a cidade), `scene2` (a praia),
> `scene3` (o céu) e **`scene4`** (a noite, com o shader `noite-aurora`). As **23 obras** das quatro
> salas estão na folha `data/obras.tsv` com o texto, os créditos e os endereços do autor (nenhuma sala
> fica com texto provisório), e as capas das quatro vivem no **Google Drive**. A sala 4 é um mundo
> novo (pasta, `data/worlds/scene4.json` e o arranque da D28), e o **portão** passou a ter **três
> portas** (`-14 · 0 · +14`): cidade, praia e noite. O circuito fecha-se — portão → cidade → praia ↔
> céu ↔ noite —, e a sala 3 deixou de ser um beco sem saída. O grafo dos mundos passa a **5 salas**
> (mais os quatro fixtures) com **18 portas** e **9 retratos de porta** (D46), e a bateria dos doze
> passa a medir **6 páginas** (**42** verificações), com as portas e as chegadas a **42** também.
> Decisão **D69** (§11 do roadmap). Os números das secções seguintes são os da **v0.0.11**, onde foram
> medidos.
>
> **Atualização (2026-10-24, Fase 7 — B9, o rename e a produção):** depois da v0.0.11, o **B9** pôs o
> fundo shader na exposição e o autor **adotou-o como produção** (o ensaio passou no telemóvel fraco e
> no desktop; o A/B nos três aparelhos fechou a **2026-10-27** — ver «Critério antes de produção»), com
> `?shader=0` como
> escape para a imagem de reserva. As salas passaram a chamar-se **`scene1`** (a cidade),
> **`scene2`** (a praia) e **`scene3`** (o céu): o nome de conteúdo e as imagens não mudaram, o
> endereço é que sim. Os números desta secção são os da **v0.0.11**; o que o B9 mediu está na §9 do
> roadmap. As secções históricas deste README continuam a citar os nomes e endereços antigos, que é
> onde foram medidos.

Marcado pela branch `v0.0.16`. É o estado depois das **onze salas**: as folhas das salas 2 a 11
entraram com o texto do autor (**57 obras**), as **salas 4** (a noite), **5** (as ondas), **6**
(os becos), **7** (as presenças), **8** (as imersões), **9** (o mangue), **10** (as distopias) e **11**
(a memória) passaram a existir como mundos,
o portão ficou com
**dez portas** e o circuito fechou-se (portão → cidade → praia ↔ céu ↔ noite ↔ ondas, com cidade ↔
becos, céu ↔ presenças, cidade ↔ imersões, cidade ↔ mangue, cidade ↔ distopia e noite ↔ memória). As
decisões **D69** a **D76**
(§11 do roadmap) guardam o porquê de cada
geometria e o que cada bateria mediu. Nada do que o visitante já conhecia mudou de comportamento: as
obras das salas 1 a 10 são as mesmas, a sala 2 tem as mesmas portas e as salas 4 a 10 ganham só a porta
nova da noite, e as notas abaixo continuam a valer.

A **v0.0.45** é a **D107**, e nasceu de uma prova visual que contradisse o validador: o `validate`
dizia **zero** e a sala 24 mostrava **5 de 8 painéis pretos**.

**Quatro causas, todas invisíveis ao validador** — porque, por desenho, ele não pergunta nada a um
endereço de fora. A primeira é **CORS**: a janela da obra é um material WebGL e o builder pede a
imagem com `crossorigin="anonymous"`; o Bandcamp não manda esse cabeçalho e recusa. A segunda é
**rate limiting**: o builder pede **todas** as capas ao mesmo tempo e o `lh3.googleusercontent.com`
responde **429** a partir de certo número — os mesmos endereços, um a um, dão 200. A terceira são
servidores de terceiros que caem. A quarta são endereços que não são imagens: `imgur.com/a/…` é a
página de um álbum, `drive.google.com/drive/folders/…` é uma pasta.

**A correção é guardar as capas dentro do projeto.** O `capas-locais.mjs` descarrega uma a uma,
reduz a 1200 px com um só Chrome e reescreve o caminho. Medido: **150 → 141 guardadas**, **71,8 MB →
15,3 MB**, e a sala 24 passou de 3 para **8 de 8**. Fecha as quatro causas de uma vez, e as capas
deixam de depender de um servidor alheio — que este README já dizia ser um objetivo.

O **que falta e o que está mal** vive numa lista à parte, para se ir riscando: [`docs/PENDENCIAS.md`](docs/PENDENCIAS.md). É o resultado de um pente fino em três camadas — o dado, os links e o browser —, e só lá está o que está por fazer.

**O que não se apaga, e porquê.** Nove capas não vieram, e oito não são ficheiros inválidos: são
ficheiros do Drive **não partilhados**. O Google devolve a página `Sign in - Google Accounts`,
900 kB de HTML. Distinguir isso de «imagem partida» é o que impede a ferramenta de apagar uma capa
que se resolve em dois cliques — ficam no dado, com o recado: *partilhe como «qualquer pessoa com o
link»*. Só a do imgur foi tirada, a pedido: não há imagem nenhuma para vir a ter.

O que fica por fazer, e é teu: as **sete capas privadas** (`scene5` «A CASA», `scene16` «Keep
Scrolling» e «Compatibilidad Telepática», `scene19` «Sin Colgar» e «El Castillo», `scene20`
«Paseo la Pechina», `scene25` «Rock Skulls») e a **pasta do Drive** de `scene18` «Aguja
inversa». Corra outra vez o `capas-locais.mjs` depois de as partilhar.

A **v0.0.37** é a **D106**, e fecha o fluxo que o autor pediu: **colar o TSV no chat e a sala nascer
com as obras.**

**Três coisas deixaram de ser trabalho de quem escreve a folha.** `--mundo <slug>` diz de que sala é
(a folha do autor não tem a coluna `mundo` — a sala vem do chat). `--criar` **cria** a obra que ainda
não existe, com a forma canónica das 55 obras `site` do projeto, e o anel senta-a na mesma passagem —
criar as obras é um passo, não dois. E os endereços do Drive, que o autor cola como
`…/file/d/<ID>/view` e que são **páginas** e não carregam num `<img>`, passam a
`lh3.googleusercontent.com/d/<ID>` no próprio importador, com a conversão dita no relatório.

**E a validação passou a ser por linha de base.** O importador recusava gravar um mundo que não
ficasse limpo — e nenhum dos 27 fica, por causa da L9 dos retratos. Mas os retratos são **imagens da
sala**: têm de vir **depois** das obras, senão fotografam a sala vazia. Com a regra antiga o ciclo
fechava-se. Agora recusa só as violações **novas**, e a bateria da folha voltou a **21 de 21**.

Medido num `git worktree` com o TSV da sala 12 colado tal e qual: 4 obras criadas, 4 capas
convertidas, sentadas a 45°, e o `validate` da sala **sem um erro que não fosse a L9**.

**Duas notas que valem mais do que a versão.** A primeira é o custo real dos retratos: **185 s por
par**, medidos duas vezes seguidas nesta máquina sem GPU — os 72 pares em falta seriam ~3 h 40 por
passagem, e não os 11 min do registo de 2026-11-03. O guia passou a mandar medir **um** par antes de
planear uma ronda. A segunda é um dano que eu próprio fiz e reparei: a v0.0.36 truncou esta
`docs/SPEC-NOVA-SALA.md` de 1053 para 202 linhas, porque um `replace` meu apanhou o parágrafo errado.
Está restaurada, e a lição ficou no commit: cirurgia em documentos precisa de contar linhas.

A **v0.0.36** desfaz uma decisão da v0.0.35, e vale a pena dizer porquê: **o validador tinha razão e eu
não.**

A v0.0.35 deu a cada sala a sua folha de obras em `data/obras/`, para catorze agentes não reescreverem
o mesmo ficheiro. A pasta colidia com a **L20**, que procura uma pasta chamada `obras` debaixo de cada
pasta de topo para acusar as fichas antigas (D60):

```
error: data/obras/ ainda existe — a ficha antiga (D60) foi substituída por obra.html (D62);
       duas fontes acabam por discordar (L20)
```

O `validate` passou a ter **um** erro que não era a L9. Não é um falso positivo da lei: é exatamente a
lei a fazer o seu trabalho — duas fontes do mesmo conteúdo acabam por discordar. E a premissa também
já não valia: o autor manda as folhas **uma a uma no chat**, e um agente de cada vez não tem com quem
competir por `data/obras.tsv`.

A pasta e o consolidador saíram. Do que ficou: a folha do autor entra pelo chat e vai direta para a
mãe, com as três conversões que o guia já descrevia — o `mundo` à esquerda, o `id` de 0 a N−1, e os
endereços do Drive de `/file/d/<ID>/view` (uma página) para `lh3…/d/<ID>` (uma imagem). E o
importador continua a nomear a coluna em falta. O `validate` voltou aos **144** erros de L9 e a mais
nenhum.

A **v0.0.35** é a **D105**, e fecha o último ficheiro partilhado da linha de montagem: a folha das
obras.

**O problema.** O autor entrega as obras numa folha — `id`, nome, autores, descritivo, a capa e o
site — e essa folha virava **uma** `data/obras.tsv` com as 27 salas. Com catorze agentes a trabalhar
ao mesmo tempo, isso era catorze processos a reescrever o mesmo ficheiro: exactamente o que a D96
existe para impedir.

**A saída (e o beco que ela tinha).** A primeira tentativa deu a cada sala a sua folha,
`data/obras/sceneNN.tsv`, com um consolidador a levá-las para a mãe no fim — e o teste correu bem: um
diff de **+2 linhas**, idempotente. Mas o validador recusou-a por outra razão, e tinha razão: a **L20**
procura uma pasta chamada `obras` debaixo de cada pasta de topo para acusar as fichas antigas (D60), e
`data/obras/` cai na regra — `data/obras/ ainda existe — a ficha antiga (D60) foi substituída por
obra.html (D62)`. Uma folha por sala não vale uma lei vermelha. A v0.0.36 desfez a pasta e o
consolidador: o autor manda a folha **no chat**, e o agente acrescenta as linhas a `data/obras.tsv`
com as três conversões — um agente de cada vez não tem com quem competir pelo ficheiro.

**E a folha do autor não entra como está.** Três conversões, todas mecânicas: o `mundo` como primeira
coluna (a folha do autor é de uma sala só, e não repete o slug), o `id` de **0** a N−1 (o `id` é o
número da obra no editor, e a quarta obra é a `3`), e os endereços do Drive de
`/file/d/<ID>/view` — que é uma **página** e não carrega — para `lh3.googleusercontent.com/d/<ID>`.
A tabela está no guia (§4.1), com o erro exacto de cada uma.

**Duas correcções que a folha de exemplo revelou.** O importador dizia `falta o mundo ou o id` quando
a coluna `mundo` não existia; passou a dizer **qual** é: `falta a coluna "mundo" — acrescente-a como
PRIMEIRA coluna`. E a SPEC afirmava que «as obras entram pela folha, não pelo editor» — falso: a folha
**preenche** a ficha de uma obra que o editor criou, e uma linha para uma obra inexistente responde
`obra 0 não existe no mundo scene14`. Agora diz isso, e diz a ordem da linha de montagem:
**composição → retratos → folha → validate** (a folha não grava enquanto a L9 estiver vermelha).

A **v0.0.34** é o **primeiro marco da exposição completa**: as **27 salas existem** no dado. O
`construir.mjs --todas` correu em **5 segundos** e o juiz fechou em `mapa: OK` — 27 salas, 49 arestas,
**152 portas**, 0 arestas pendentes, nenhuma sala em obra.

**E é um marco honesto, não uma exposição pronta.** O que existe são os **esqueletos**: as duas
dimensões, o fundo copiado, as portas nos dois lados, os assets dos retratos que ainda não foram
cozinhados e o movimento sorteado. Falta, sala a sala, o que é do autor — as obras, a composição e os
retratos. Por isso o `validate` está **vermelho**, e por uma só razão: a **L9**, os retratos que ainda
não existem (28 ficheiros). É o mesmo estado que o guia descreve entre a ronda do fecho e o passo 7,
agora nas catorze salas de uma vez. **Nenhuma outra lei está vermelha.**

E ficou uma decisão por tomar, registada para não se perder: com a L24 no teto de cinco portas, o
plano são **10 ondas** e no máximo duas salas em paralelo. Subir a lei para sete portas por sala poria
as catorze na primeira onda — mas sete portas é um átrio, não uma sala, e o autor ainda não decidiu se
quer trocar a exposição por velocidade. `abrir-mapa.mjs --teto 7` mostra o que mudaria.

A **v0.0.33** é a **D104**: o plano das ondas passa a ser **executável**. A v0.0.32 disse quantas salas
cabem em paralelo; esta diz como se abrem, e prova-o.

**A pergunta do autor era «dá para manter o mapa e abrir só o bloco 14–27?».** A resposta medida é
**não** — e o motivo não é o protocolo, é a L24. No plano final as treze salas construídas ficam
**todas** com cinco portas, que é o teto: `abrir-mapa.mjs --teto` mostra 0 lugares livres com teto 5,
13 com teto 6 (faltam 3) e 26 com teto 7 (aí cabia). Abrir o mapa obrigaria a subir a lei ou a tirar
portas já construídas no disco — e as arestas que ligariam as salas novas umas às outras não ajudam,
porque nenhuma dessas salas existe ainda.

**A cadeia, então, faz-se sozinha.** `tools/scene/construir.mjs` lê o mapa, calcula as ondas e, dentro de
cada uma, abre as salas em paralelo (`new-world` + `new-room --so-a-sala`) e faz **um** `integrar` no
fim. Medido num `git worktree`: as **catorze** salas nasceram em **4 segundos**, o fecho fez 43
escritas, e o resultado passou o juiz — `mapa: OK`, 27 salas completas, **152 portas** como o plano
previa, 0 arestas pendentes, e nenhum erro que não fosse a **L9** (os retratos, que são trabalho do
autor, sala a sala).

**Um bug real, apanhado pelo próprio juiz.** A primeira versão punha `scene22` e `scene23` na mesma
onda — e elas são **vizinhas**. A porta entre as duas é escrita pela que nasce depois, e nenhuma das
duas "via" a outra a tempo: o mapa declarava uma aresta que ninguém criava, e o `--check` acusou
`o mapa declara "scene23" e o dado não tem essa porta`. A correção é a regra que faltava — uma onda é
um **conjunto independente** —, e vive em `tools/scene/ondas.mjs`, para o juiz e o orquestrador não
terem duas cópias da mesma conta. O `--check` ganhou também a verificação de **cobertura**: toda a
aresta do mapa tem de ser escrita por alguma onda.

**O plano real não são catorze em paralelo: são dez ondas.** 1, 1, 1, 1, 2, 2, 2, 2, 1, 1 — no máximo
duas salas ao mesmo tempo. Hoje pode nascer só a `scene14`. Mas o tempo de máquina deixa de ser o
problema: são 4 segundos. O que resta é o trabalho do autor — as obras, a composição e os retratos,
sala a sala.

A **v0.0.32** é a **D103**, e nasceu de uma pergunta que parecia de engenharia e era de topologia:
*quantos agentes cabem, de facto, a abrir as catorze salas que faltam?*

**A fila já não faltava.** A D102 fechou-a sem lhe dar esse nome: a ronda da autoria escreve só o
ficheiro da sua sala, e o `integrar.mjs` consome **todos** os pedidos pendentes de uma vez. Medido
antes desta versão: **seis** agentes em paralelo, cada um com três destinos, escreveram 24 portas
sem tocar no portão nem em nenhuma sala partilhada, e um único `integrar` fechou as seis em **1 s**
com zero erros que não fossem a L9. Não há trabalho de fila a fazer — há trabalho de **grafo**.

**A resposta está no mapa, e não é a que se queria.** Uma sala só nasce com duas vizinhas
construídas (o `new-room` escreve a porta de chegada no destino, e a L24 exige três portas). O mapa
das 27 salas é uma **cadeia**: hoje só a `scene14` tem duas vizinhas no disco (a `scene10` e a
`scene11`); todas as outras têm uma ou nenhuma. O plano em ondas dá **9 ondas** e um paralelismo
máximo de **2 salas** — 1, 1, 1, 1, 2, 2, 2, 2, 2. Catorze agentes não podem abrir catorze salas ao
mesmo tempo: é o grafo que o impede, não a ferramenta.

**O que esta versão traz é o instrumento que diz a verdade sobre isso.** `mapa.mjs --ondas` imprime
o plano em ondas, o paralelismo máximo e o que pode nascer hoje. O `--dossie` foi **corrigido**:
ainda dizia «um de cada vez, nenhum outro agente corre `new-room`» — falso desde a v0.0.31 — e
mandava um agente correr `--destinos` com salas que ainda não existem, porque lia os destinos da
simulação e não do disco. Agora cada folha diz em que onda a sala cabe, o que existe hoje, o que
falta nascer, e **não dá comando nenhum** a uma sala bloqueada: dar-lhe um obrigaria a inventar
destinos que o mapa não tem, e a L25 recusaria.

**A estrada aberta, se o autor a quiser:** dezasseis arestas novas em `data/mapa.json` — ligar cada
sala planeada a duas construídas — punham as catorze na primeira onda. Cabe na L24 (as treze salas
de hoje têm 25 portas de folga e as arestas custam 16), mas custa 32 portas novas e 16 pares de
retratos: é uma decisão da exposição, não da ferramenta.

A **v0.0.31** é a **D102**: as **duas rondas** que tornam o paralelismo útil e não apenas seguro. A
v0.0.30 provou que a oficina impede a perda; esta versão responde ao que faltava — *catorze agentes à
espera uns dos outros não é catorze agentes a trabalhar.*

**O corte é autoria → fecho, e não «salas → portais».** A ideia de deixar os portais para uma segunda
ronda parece a certa e não é: uma sala sem portas viola a L24 (sem porta ao portão), a L19 (os destinos
não declaram a chegada) e a alcançabilidade, e a segunda ronda teria de fazer exatamente o mesmo
trabalho. O que se pode separar sem perder nada é o que é **exclusivo de um ficheiro** do que é
**partilhado por todos**.

**A ronda da autoria — `new-room --so-a-sala`.** Escreve **só** `data/worlds/<slug>.json`; não toca no
portão, não toca nos destinos, não corre as derivadas que reescrevem todos os mundos, e nem sequer toma
a oficina (não há nada para serializar: o ficheiro é exclusivo de quem o cria). Só o **movimento** das
portas é sorteado aqui, porque é da própria porta e não muda com as vizinhas. Medido num `git worktree`:
dois agentes em paralelo, com a `scene3` e a `scene6` em comum nos destinos, mudaram **dois ficheiros e
mais nenhum** — o portão, a `scene3` e a `scene6` ficaram intactos. É contenção **zero**, e não
«contenção curta».

**A ronda do fecho — `integrar.mjs`.** Lê todos os mundos, calcula o que falta a cada um (a porta no
portão de cada sala que não a tem; a porta de chegada em cada destino que ainda não declara de onde o
visitante vem), escreve **só** os mundos que mudam, e corre os anéis, o giro, os buracos, o sorteio —
agora só nas portas que esta ronda escreveu, para não mexer no movimento de salas já vistas — e o
validador, **uma vez** e não uma vez por sala. A conta da L19 é feita sobre `arrivalFrom` e não sobre o
par de portas: assim uma sala que já tem porta para a vizinha não ganha uma segunda ao lado da primeira.

**É idempotente, e é isso que a torna segura.** Correr outra vez diz `nada a fazer`, e uma ronda
interrompida é só repetir o comando. Medido: dois agentes em `--so-a-sala`, um `integrar`, 8 portas
escritas, e **0 erros que não fossem a L9** (os retratos, que são o passo 7 do guia); a segunda
passagem não mexeu em nada.

**E a construção das portas saiu para uma casa só** (`tools/scene/portas.mjs`). Uma porta tem quatro
bocados que têm de concordar — o `target`, o `arrivalFrom`, o retrato e o recorte —, e a partir do
momento em que duas ferramentas os escrevem, duas cópias seriam duas verdades.

A **v0.0.30** é o **M1 e o M2 da D96**, e existe para responder a uma pergunta só: *podem vários agentes
criar salas ao mesmo tempo?* Medido antes desta versão, **não**: em três tentativas de dois `new-room` em
paralelo, duas perderam uma porta inteira e a terceira deixou uma sala com seis. Agora pode.

**A oficina** (`tools/coordination/locks.mjs`). Uma trava só — não uma por ficheiro — porque os
escritores deste projeto não escrevem um ficheiro: escrevem o conjunto (a sala, o portão, cada destino e
depois as quatro derivadas, que reescrevem todos os mundos). `mkdir` como primitiva, porque é atómico; o
dono em `dono.json` com pid e motivo; e a pergunta certa para saber se a trava é de um morto é **«o dono
ainda existe»** (`process.kill(pid, 0)`), não «há quanto tempo» — um `SIGKILL` não corre manipuladores de
saída. O estado vive em `<git-common-dir>/zonas-run/` e não em `.harness/`: o `.harness/` é um directório
diferente por *worktree*, e duas sessões em worktrees distintos não se veriam.

**O detalhe que decidiu tudo: a trava tem de ser tomada antes de LER, não antes de escrever.** A primeira
versão travava só a escrita e continuava a perder portas — dois processos liam a `scene10` com quatro
portas, os dois concluíam que cabia, e o segundo escrevia por cima do primeiro. O que precisa de ser
atómico é o par **ler→escrever**. Medido depois: três tentativas com destinos em conflito — **nenhuma
perda**, o segundo processo é recusado pela L24 com a sala e o número; e duas tentativas com destinos
independentes — **as duas entram**, o portão vai a 15 e as quatro chegadas ficam.

**Os filhos herdam a secção crítica.** O `new-room` toma a oficina e *chama* o `ring`, o `azimuths`, o
`reality` e o `sorteio`. Se cada um tentasse tomar a mesma trava, ficavam à espera de si próprios; o pai
marca `ZONAS_TRAVA_OFICINA=1` e os filhos correm dentro dela. Todos os escritores a tomam: as cinco
ferramentas de cena, a folha, os retratos, o instalador de shaders — e o **«Gravar» do editor**, que
espera e responde **503** com o motivo em vez de escrever por cima.

**O juiz passou a porteiro.** O `new-room --mapa` lê os destinos de `data/mapa.json` — só os vizinhos que
**já existem**, porque uma porta para uma sala que ainda não nasceu é a L11 — e recusa `--mapa` junto de
`--destinos` (duas fontes dariam duas verdades).

**E dois instrumentos entraram no `all.mjs`:** o `mapa.mjs` (o único que julga a topologia antes de uma
sala existir) e o `selftest.mjs` do servidor — que estava vermelho **desde a L24** porque o mundo de
ensaio dele tinha zero portas, e que ninguém via por não estar em bateria nenhuma. Passou a **34 de 34**.

O que ficou por fazer nesta versão — e que a **v0.0.31** fechou — era o **integrador**. A oficina
serializa a escrita, que é o que impede a perda; a fila é o que evita que catorze agentes esperem uns
pelos outros no momento errado.

A **v0.0.29** fechou a armadilha nº 1 do guia, encontrada numa auditoria da criação de salas: o
`new-room` **nunca contava as portas do destino**. Levar a porta de chegada a uma sala já com cinco não
era recusado — a ferramenta escrevia a sala nova, o portão e os destinos, corria as quatro derivadas
sobre todos os mundos, e só no fim o validador dizia `the world has 6 door(s) — law L24`. Nove ficheiros
mexidos, uma sala a violar uma lei, e a causa enterrada no meio dos erros da L9 (os retratos que ainda
não existem). Agora a conta faz-se **antes de escrever**, com a sala e o número no aviso, e o caminho
para os lugares livres (`mapa.mjs --grafo`).

A mesma auditoria mediu o resto, num `git worktree` isolado: **8 das 9 recusas certas** (slug, fixture,
portão, pasta, dado existente, contagem de destinos, destino inexistente, L25 com a sala culpada
nomeada) e o caminho de sucesso a produzir uma sala estruturalmente correta — 10 erros, **todos L9**,
zero estruturais. E mediu o que ainda **não** está resolvido: dois `new-room` em paralelo. Em **três**
tentativas, **duas perderam uma porta inteira** (o portão ficou sem a porta da sala nova, e a sala
tornou-se inalcançável) e a terceira deixou a `scene10` com **seis** portas. A escrita atómica impediu o
pior — nenhum ficheiro truncado, nenhum `.tmp` órfão — mas a perda de trabalho é real, e é o que o
**M1/M2 da D96** existe para fechar. **Até lá: um `new-room` de cada vez.**

A **v0.0.28** é o **M0 da D96**: a escrita atómica deixa de ser uma excepção do `serve.mjs` e passa a ser
a regra de **todas** as ferramentas que escrevem. O módulo novo é `tools/coordination/atomic.mjs` —
um temporário **ao lado** do destino, `fsync`, e `rename` com três tentativas (o Windows falha
transitoriamente com o ficheiro aberto pelo antivírus ou pelo indexador). O `pid` e um sufixo aleatório
no nome do temporário fazem com que dois processos a escrever o mesmo ficheiro não partilhem o
temporário — o caso que a D96 estuda. Dezasseis ferramentas passaram a usá-lo: `new-room`,
`new-world`, `ring`, `azimuths`, `reality`, `sorteio`, `portrait`, `from-csv`, `ensaio-dois-aneis`,
`install` dos shaders, as quatro da migração e o `serve.mjs` (que já fazia isto à mão desde a D51).

**Medido, matando o processo a meio.** Dez execuções de `sorteio.mjs --aplicar` sobre a `scene100`,
mortas com `SIGKILL` em instantes diferentes: **6 deixaram o original intacto, 4 completaram a escrita,
0 corromperam**. O `.tmp` órfão que uma delas deixou é a prova de que a escrita estava a meio — e o
destino não tinha sido tocado. Uma escrita forçada pelo `ring.mjs` sobre a `scene2` perturbada devolveu
o ficheiro **byte a byte igual** ao commitado.

> **O achado que esta versão trouxe, e que não era dela.** Ao passar o `serve.mjs` para o módulo,
> descobriu-se que a **gravação do editor estava a devolver HTTP 500 desde que o `fixture:` foi
> acrescentado**: o ficheiro usava `isFixture` sem o importar. O `tools/server/selftest.mjs` — o único
> instrumento dessa rota — também está vermelho desde a **L24** (o mundo de ensaio dele chama-se
> `teste` e tem zero portas, e uma sala precisa de três a cinco). Nenhum dos dois apareceu antes porque
> **essa bateria não está no `all.mjs`**. O import foi corrigido aqui, porque estava no bloco que esta
> versão altera; o auto-teste fica por acertar, e entra na bateria, na próxima iteração.

Resumo do que existe na v0.0.27 (medido em 2026-11-04): `index.html` (**93 linhas**) e as **treze**
salas com o **mesmo** ficheiro (`scene1/` a `scene13/`, iguais fora da linha do `<base>` — D28),
`editor.html` (**96**), `js/app.js` (**276**), `js/arrival-frame.js` (**204**, a ponte de imagem entre
mundos — D43), `js/editor.js` (**15**, a entrada do editor — D36), `js/editor/` (**15** ficheiros,
**3566** linhas), `js/i18n.js` (**93**), `js/core/` (7 ficheiros, **234**), `js/modules/` (11
ficheiros, **3554**), `js/scene/` (14 ficheiros, **2614**), `js/shaders/` (13 ficheiros, **865**),
`css/` (3 ficheiros: **142** + **314** + **253**), **19** ficheiros em `data/worlds/` (**11697** linhas,
**76 portas**, das quais **66** nas catorze páginas), o **mapa** `data/mapa.json` (**27** salas e **49**
arestas — D96), as **67 obras** na folha, os **115** ficheiros em `assets/previews/` (**59** retratos e
**56** recortes) e **59** ficheiros em `tools/` (**14212** linhas).

A **v0.0.27** não constrói uma sala: fecha a **engenharia da galeria**. Quatro coisas, e nenhuma delas
se vê na exposição.

**A L30** — um mundo de ensaio nunca é usado pela exposição: nenhuma porta navega para um fixture e
nenhuma se declara chegada dele. A lista é a de `js/scene/fixtures.js` (uma casa só), e as duas
ferramentas que a podiam contornar passaram a recusá-la **com o motivo certo** (o `new-world` já não
cria pasta a um fixture, o `new-room` já não diz «o destino não existe» de um mundo que está no disco).

**O mapa** (`data/mapa.json`) — as **27 salas** e as **49 arestas**, decididas uma vez em vez de sala a
sala, com as duas contas da D-B feitas em conjunto. O `tools/scene/mapa.mjs` julga-o (L24, L25, L11,
acordo com o disco, ordem de construção) e **simula os 14 passos da obra**, cada um julgado — o mapa podia
estar certo no fim e errado pelo caminho. As treze salas prontas entram como **restrição fixa**: a
`scene1` já estava cheia e as outras doze tinham exactamente **um** lugar cada, que é onde entram as
doze arestas novas. O comando `--dossie` imprime a folha de cada agente (o que constrói, o que já está
decidido, em que ficheiros escreve) — é ele que substitui, no trabalho manual, a trava que ainda não
existe.

**O ensaio dos anéis** (`tools/scene/ensaio-dois-aneis.mjs` + `scene100` com **28 portas**) — a prova de
que o portão aguenta o crescimento, e um resultado que **contrariou** a proposta. Com 28 portas (14 + 14)
a folga entre dois anéis é **12,86°** e passa; com **27** não há reparto de dois anéis que chegue — o
melhor (12 + 15) tem m.m.c. 60, logo um teto de **3,00°** contra os **3,82°** de que as janelas precisam,
**qualquer que seja o raio exterior** (medido de 120 a 200 m). Três anéis de nove a 90/180/270 m dão
**13,33°**. Daí nasceu a **L31**, com uma busca sobre os repartos (`ringPlan`) porque a igualdade também
falha nos números ímpares: 23 portas em 6+6+6+5 dão 3,00°, e em 8+5+5+5 dão 4,50°.

O que esta versão **não** tem: o protocolo de escrita concorrente (D96) está **desenhado e não
construído** — zero linhas de travas, admissão, integrador ou escrita atómica. E foi a falta dele que
produziu o incidente registado abaixo.

> **O incidente que a v0.0.27 registou (2026-11-04, 21:38).** O commit `8f1ba97` («A sala 13 entra…»)
> foi feito **por caminhos** enquanto outro agente trabalhava no mesmo *working tree*: levou o
> `README.md` e o `docs/ROADMAP.md` **com a documentação da L30** e deixou de fora o **código** dela
> (`js/scene/validation.js`, `tools/scene/laws-selftest.mjs`, `new-room.mjs`, `new-world.mjs`). Quem
> fizesse checkout daquele commit ficaria com a documentação a prometer 30 leis, o validador a verificar
> 29 e o auto-teste a reportar 31 — três números para o mesmo facto. Não se perdeu trabalho; ficou
> **mal atribuído**. É a justificação datada do **M0** da D96, e não se apaga.

Resumo do que existe na v0.0.26 (medido em 2026-11-04): `index.html` (**92 linhas**) e as **treze**
salas com o **mesmo** ficheiro (`scene1/` a `scene13/`, iguais fora da linha do `<base>` — D28),
`editor.html` (**96**), `js/app.js` (**276**), `js/arrival-frame.js` (**204**, a ponte de imagem entre
mundos — D43), `js/editor.js` (**15**, a entrada do editor — D36), `js/editor/` (**15** ficheiros,
**3566** linhas com os painéis e a ponte com o servidor), `js/i18n.js` (**93**), `js/core/` (7 ficheiros,
**234**), `js/modules/` (11 ficheiros, **3541**), `js/scene/` (14 ficheiros, **2579** — o `reach.js` é o
último, D87), `js/shaders/`
(13 ficheiros, **848** — o `projecao.js` é o último, D95), `css/` (**3** ficheiros: `style.css` **142**,
`editor.css` **314** e `obra.css` **253**), **19** ficheiros em `data/worlds/` (o portão, as treze salas e
os cinco fixtures, **10150 linhas** no total e **76 portas**, das quais **66** nas catorze páginas da
exposição), as **67 obras** na folha `data/obras.tsv`, os **115** ficheiros em `assets/previews/`
(**56** retratos e **56** recortes, um par por porta, mais os três panoramas — D46) e **57** ficheiros em
`tools/` (**13476** linhas). O que esta versão entregou:

A **v0.0.26** leva a **décima terceira sala** (D95) — `scene13` (**Realidades 360º**, com o shader novo
**`projecao`**, a cúpula de um *video mapping*) —, com **seis** obras de animação digital, RA e RV e
**três** destinos (`scene5`, `scene7`, `scene8`); o sorteio do movimento ficou com a semente `72587`.
Antes dela, a mesma versão levou a **décima segunda sala** (D93) — `scene12` (**Tesouros 360º**, com o shader novo
**`deposito`**) — e, com ela, a decisão que muda a geometria de todas as páginas: os dois anéis passam de
**40 m / 60 m** para **60 m / 90 m**, porque a única combinação que a tabela do `ring.mjs` não tinha (7
obras × 6 portas) ficava acima do teto da L23. Como o anel de todos os mundos se moveu, o giro (L26) e os
buracos do mundo real (L28) voltaram a correr nos **13 mundos** e os **49 retratos** foram cozidos duas
passagens. A prova visual, feita no servidor local, apanhou depois o que nenhuma lei via (**D94**): a
porta que o portão ganhou para a sala 12 **não oscilava**, porque o roteiro só sorteava o mundo novo e
as portas acrescentadas a mundos que já existem nasciam paradas. O `sorteio.mjs` ganhou
`--sem-movimento` (só as portas que ainda não oscilam), o `new-room.mjs` passou a sortear também os
mundos que tocou, e a bateria do movimento exige agora `motion: sway` em **cada** porta da exposição
(**58 de 58**). A **v0.0.25** levou o **movimento sorteado das portas às doze páginas** (D91): as **50**
portas do portão e das onze salas passaram a oscilar, com os eixos, as amplitudes, os ângulos e os dois
períodos tirados do mesmo sorteio que serve uma sala nova (semente `20261103`). Duas correcções no
runtime foram precisas para isso — a travessia passou a ser decidida pelo **segmento do visitante**
entre dois quadros e a oscilação passou a **começar quando a ponte de chegada sai** (`anchorMotion`) —,
e nenhum retrato foi refeito. A **v0.0.24** pôs a **spec de uma sala nova em uso**: a **sala de ensaio**
(D84), a **oscilação** das suas portas (D85), a rotação sobre o **centro da porta** (D86), o **movimento
sorteado** com a lei nova **L29** (D87), a verificação da **documentação contra o método** (D88), as
**portas sem chegada** julgadas pela L26 e pela L28 (D89) e o **roteiro posto à prova** numa sala
descartável (D90). A **v0.0.23** foi a **spec** e a derivação das listas das baterias (D83). Antes dela,
a **v0.0.22** fechou a **emenda da esfera** (D82): o preâmbulo dos shaders ganhou `volta`,
`azim` e `noise3`, os onze fundos foram
reexcritos para não terem costura e os 39 retratos foram refeitos. A **v0.0.21** fechou o **mundo real
atrás da porta** (D81) e a **v0.0.20** a **ordem da janela** (D80). O detalhe medido de cada uma está
nos blocos datados acima e em [docs/ROADMAP.md](docs/ROADMAP.md) §11.

Resumo do que existe na v0.0.16: `index.html` (**93 linhas**) e as **11** salas com o **mesmo** ficheiro
(`scene1/`, `scene2/`, `scene3/`, `scene4/`, `scene5/`, `scene6/`, `scene7/`, `scene8/`, `scene9/`, `scene10/` e `scene11/`, iguais fora da linha do `<base>` — D28),
`editor.html` (**96**), `js/app.js` (**252**), `js/arrival-frame.js` (**204**, a ponte de imagem entre
mundos — D43), `js/editor.js` (**15**, a entrada do editor — D36), `js/editor/` (**15** ficheiros,
**3494** linhas com os painéis e a ponte com o servidor), `js/i18n.js` (**93**), `js/core/` (7 ficheiros,
**226**), `js/modules/` (11 ficheiros, **3288**), `js/scene/` (10 ficheiros, **1773**), `js/shaders/`
(11 ficheiros, **539**), `css/style.css` (**142**) e `css/editor.css` (**314**), **16** ficheiros em
`data/worlds/` (o portão, as onze salas e os quatro fixtures, **6000 linhas** no total e **46**
portas), `i18n/pt.json` (**219** chaves), as **57 obras** na folha `data/obras.tsv`, os **63** ficheiros
em `assets/previews/` (**30** retratos e **30** recortes, um par por porta, mais os três panoramas — D46)
e **48** ficheiros em `tools/` (**10501** linhas). O que a versão anterior entregou:

A **v0.0.11** é o estado depois da **Fase 6** do roadmap — **testes e limpeza** —,
medida em 2026-10-24 e **aceite no telemóvel** no mesmo dia: a automação dos **doze testes** num
comando (`node tools/regression/all.mjs`), a **recusa** da varredura de poses quando a câmara se
mexe, e as pendências **R16** e **R17** fechadas. O que a fase entregou e mediu está em
[docs/ROADMAP.md](docs/ROADMAP.md) §9/§10 e o comando está no passo 3 de «Como Usar». Nenhum
comportamento da exposição mudou — o único ficheiro de produção tocado foi `js/arrival-frame.js`
(a ponte espera pela descodificação da imagem).

E antes dela a `v0.0.10` (o fecho da Fase 5 — a **gravação direta**): o servidor da
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
| `portal.js` | A porta: janela (máscara), moldura, caixa de colisão, travessia e caixa de debug — e o **driver de frame** da cena. Desde o B4 da Fase 3B a travessia e a janela são decididas pelos **dois eixos** (`window`/`action`); a origem que a travessia leva no `?from` é decidida pelo mundo (`setWorld`, `carryOrigin` — D84); o movimento tem três tipos (`spin`, `orbit` e `sway`, D59/**D85**) e `settleMotion()` devolve as portas à pose do dado para os instrumentos que medem geometria | componentes `stencil-portal` e `portal-driver`; `createPortal`/`removePortal`; `startFrameDriver` |
| `portal-kinds.js` | A **tabela dos dois eixos**, pura: o que cada `window` mostra e o que cada `action` faz, a matriz das combinações legais, a validação de uma porta e o endereço de um mundo. Corre também em `node` (é ela que o validador lê) | `WINDOW_KINDS`/`ACTION_KINDS`, `isLegalCombination`, `validateDoor`, `worldHref` e `ENTRY_WORLD` |

Cada módulo tem o seu `remove()`, para que criar e destruir conteúdo em ciclo (o que o
editor faz a cada tecla que re-cria uma entidade, e o que o T9 mede) não deixe registos mortos nem
memória agarrada — e desde a Fase 3 cada
módulo tem também a sua **fábrica**, que constrói uma entidade a partir do dado.

O **`js/scene/`** é onde a cena em dados vive, e tem **treze** ficheiros:

| Ficheiro | O que é |
| --- | --- |
| `schema.js` | A **forma do formato** (v3): campos, tipos, enumerações, as regras dos dois eixos da porta e o catálogo de assets. Puro — não conhece o DOM nem o A-Frame |
| `validation.js` | A forma (lida do schema) e as **leis** que o dado sozinho prova: L1, L4, L5, L9, L10, L11, L12, L13, L14, L15, L16, L17, L18, L20, L21, L22 (os dois anéis), L23 (a folga entre eles), L24 (três a cinco portas, uma ao portão), L28 (os buracos do mundo real, `realityWindows`), **L30** (um mundo de ensaio nunca é usado pela exposição — D96) e **L31** (acima de vinte portas, anéis concêntricos com o reparto procurado — D97); e, sobre o **grafo** dos mundos, a L19 (`missingArrivals`), a L25 (`repeatedDestinations`) e a L26 (`portraitTurns`, o giro do retrato de cada porta). A **L27** (a chegada põe a câmara no ponto e na direcção) não é do dado: prova-se na bateria T7/T11 e a **L29** (o alcance de uma porta que oscila) no `reach.js`. Um fixture (D9) é dispensado das leis da disposição por uma opção — e pelo próprio slug, que é como a bateria do shader o valida. É o mesmo módulo que a consola da exposição corre ao arrancar, que `tools/scene/validate.mjs` corre na linha de comando e que o editor corre a cada tecla |
| `ring.js` | A **disposição em anéis** (D77) e o **plano de anéis do portão** (L31, D97 — o `ringPlan`, com a busca do reparto mais equilibrado): os lugares das obras e das portas a partir de um raio e de uma fase, a folga entre os dois anéis e o teto que a mede (`bestPhase`, `clearanceCeiling`); o **giro do retrato** de uma porta de mundo (`portraitTurn`, D78), que é a conta que o dado guarda e a L26 prova; e o azimute de uma **primeira visita** (`FIRST_VISIT_AZIMUTH`, D89) — 0 por construção, para a L26 poder julgar uma porta que não tem chegada. Puro; é a mesma conta que escreve o dado (`tools/scene/ring.mjs --aplicar`, `tools/scene/azimuths.mjs --aplicar`) e a que as leis L22, L23 e L26 verificam |
| `reality.js` | Onde a janela de uma porta tem de deixar passar o **mundo real** (D81): os retângulos (azimute e elevação) em que o destino mostra a dimensão `camera` — os que o preâmbulo dos shaders descarta e a L28 recalcula. Puro; é a conta que escreve o dado (`tools/scene/reality.mjs --aplicar`) |
| `fixtures.js` | Os **mundos que não são salas** (D9): a lista que a página, a linha de comando e o editor leem para não pedirem anéis nem três a cinco portas a um banco de ensaio. A **sala de ensaio** `scene100` é o quinto (D84) — é esta lista que a põe fora do grafo |
| `arrival.js` | Onde o visitante aparece ao chegar de outro mundo (**L16**): puro e partilhado, para o construtor e o validador não discordarem da geometria |
| `reach.js` | O **alcance** de uma porta em movimento (**L29**, D87): a fracção do ciclo em que o olho do visitante fica dentro da caixa, medida sobre o par de fases dos dois períodos. Puro; é a conta que o `sorteio.mjs` usa para recusar um sorteio e a que o validador corre para provar o dado |
| `scene-builder.js` | O **único** que conhece o A-Frame: cria o `<a-assets>` (e **espera** que os ficheiros carreguem), a câmara, as dimensões, as obras e os portais, a partir do JSON. Desde o B3 aceita `{ preview: true }` e desliga a navegação (D32) |
| `render-config.js` | As **regras de desenho** do renderer (`ar-config`: `stencil`, `alpha`, `antialias`), registadas uma só vez para os **dois** hosts — a exposição e a pré-visualização do editor (lei **L6**) |
| `artwork-page.js` | Onde vive a **ficha de uma obra** (D60/D62): um só nome, para a cena, a ficha e o editor não discordarem do endereço |
| `cover.js` | A **capa** de uma obra, por tentativas (D65): a do vídeo, a que a folha indica, a do projeto, e uma de aviso no fim |
| `platform-embed.js` | As **plataformas** que a ficha sabe embutir (D61), num sítio só — usada no browser e pelos instrumentos |
| `return-pose.js` | **De onde o visitante veio**, para o «voltar» da ficha o pôr no mesmo ponto e com o mesmo olhar (D63) |
| `analytics.js` | A **medição** de uma sala no Google Analytics (D62/L21), com o ID no dado do mundo; é o único ficheiro que fala com a GA |

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
| Mundos e endereços | **Um ficheiro por mundo** em `data/worlds/` (D24) e um endereço por sala: a raiz é o portão e `/scene1/` a `/scene13/` são as salas, todas servindo o **mesmo** `index.html` (D28). O mundo sai do caminho e o `?scene=<mundo>` força um, para os testes; o validador exige que a pasta seja o `world.slug` |
| Página de edição | `editor.html` (`?world=<slug>`) é uma **ferramenta separada** (D4) que usa os **mesmos** módulos: abre um mundo, edita-o por **cinco painéis** (câmara, dimensão, obra, portal, mundo), mostra a **pré-visualização** com a mesma cena da exposição e exporta o JSON — sem nada escrever em disco (D2). A pasta de um mundo novo é da ferramenta `tools/scene/new-world.mjs` (**D31**) |
| Desfazer, «alterado» e guarda de saída | Editar → desfazer (**50** instantâneos do JSON, **D35**) → exportar; a marca «alterado» e o aviso antes de fechar com alterações que não saíram num ficheiro (**D32**); e a exportação **recusa** um mundo com erros — valida tudo antes de exportar |
| As leis no editor | O editor corre o **mesmo** `validation.js` e responde às duas perguntas que eram só da linha de comando: o asset existe (**L9**) e a imagem mede 2:1 (**L14**). Num mundo saudável o relatório diz `Erros: 0 · Avisos: 0 · Por verificar: 0` |
| Gravação direta | Com o **servidor da ferramenta** (`node tools/server/serve.mjs`) o editor ganha o botão «Gravar»: escreve o mundo em `data/worlds/` com o **mesmo** validador, uma cópia de segurança antes e escrita atómica (**D48–D51**); sem servidor o botão não aparece e o «Exportar» fica como estava |
| Interface por catálogo | Todo o texto da interface — exposição **e** editor — sai de `i18n/pt.json` (**222** chaves) e, em inglês, de `i18n/en.json` (as mesmas **222**), por `data-i18n` no markup ou `t('chave')` no código; `?lang=en` escolhe a língua e uma chave que falte cai no português com **1** aviso |
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

**A esfera fecha na volta (D82).** `az = atan(d.x, −d.z)` é um serrilhado — salta de +PI para −PI
atrás do visitante —, e um padrão contado em `az` corta-se ali a direito. Foi o que se viu em vários
dos onze fundos, e é o que a bateria [`tools/regression/emenda.mjs`](tools/regression/emenda.mjs)
mede em cada um (o degrau na coluna da emenda, em cinco elevações e quatro instantes, com três
controlos): **15 de 15** na v0.0.24. O preâmbulo dá as três ferramentas para não a ter — `volta`,
`azim` e `noise3` — e as regras estão no passo «Enviar um shader».

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
  **obras e as portas**: a `2048 × 1024` a costura fica em **0,13 a 0,47** nas portas medidas. Com as
  **onze salas** são **30** ficheiros, **3868 kB** no total (**83 a 188 kB** cada), **8 MiB** de textura
  cada, e a **L14** deixa de ter o que avisar
  (`validate.mjs`: `Erros: 0 · Avisos: 0` nos dezasseis ficheiros de mundo).
- **Além do retrato, cada porta tem um recorte (D53).** O mesmo desenho, sem o fundo e com
  transparência (`recorte-<porta>.png`, 2:1, **114 a 145 kB** cada): é o que a janela compõe sobre o
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

**Decisão atual (2026-10-24, confirmada pelo A/B a 2026-10-27):** o shader é a produção; a imagem é a
reserva. A medição indica que shaders GLSL são muito mais adequados que p5.js para animação neste caso,
mas não prova que todo shader será mais rápido que toda imagem: a complexidade do shader e a resolução
continuam a importar — é por isso que o **validador** mede cada shader antes de ele poder ser nomeado, e
que a **escada** do R15 (pixelRatio → 15 fps → quadro parado) fica como rede. A comparação controlada
imagem × shader no mesmo aparelho, cena, câmera, pixelRatio e duração (**R14**) foi feita e está na
tabela de «Critério antes de produção»: o custo é um gradiente com a GPU, e só o aparelho mais fraco o
paga.

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
| `scene4` (noite) | `noite-aurora` | `skycloud` |
| `scene5` (ondas) | `ondas` | `praia` |
| `scene6` (becos) | `becos` | `cidade-360` |
| `scene7` (presenças) | `aguas` | `praia` |
| `scene8` (imersões) | `holograma` | `praia` |
| `scene9` (mangue) | `mangue` | `praia` |
| `scene10` (distopia) | `nucleo` | `praia` |
| `scene11` (memória) | `fichario` | `praia` |
| `scene12` (tesouros) | `deposito` | `praia` |
| `scene13` (realidades) | `projecao` | `praia` |

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
quatro salas de produção e o painel do editor. A escada persegue dois alvos desde 2026-10-27: a cadência
de **20/s** e um **chão de 45 quadros/s** (`minFps`) — abaixo dele, e enquanto houver resolução para
baixar, a janela conta como má, porque é isso que se sente ao olhar em volta. O **A/B controlado nos três
aparelhos** está registado desde **2026-10-27** (§ «Critério antes de produção», com a tabela dos quatro
aparelhos): no médio e no forte o shader é indistinguível do panorama, e no fraco custa 15,2% dos quadros
— resolvido em **nitidez** e não em quadros, o que manteve o shader em todas as salas (**R18**).

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
depois para 15 FPS e depois congela o quadro. O **A/B controlado** foi **fechado em 2026-10-27** nos
três aparelhos, com o mesmo instrumento (`?ensaio=1`) e as duas fases na mesma sessão:

| aparelho | GPU | shader | imagem | diferença | pior quadro |
| --- | --- | --- | --- | --- | --- |
| telemóvel fraco | PowerVR Rogue GE8320 | 40,7/s | 46,9/s | **+15,2%** | 231,4 → 66,2 ms |
| telemóvel médio | Qualcomm Adreno 630 | 52,1/s | 54,1/s | **+3,8%** | 66,7 → 66,7 ms |
| computador | NVIDIA RTX 4060 | 164,7/s | 164,1/s | −0,4% | 24,4 → 24,2 ms |

O custo do shader é um **gradiente com a GPU** e só o aparelho mais fraco o paga: aí são 15,2% dos
quadros e um pior quadro 3,5× maior, com 22,6% das atualizações da cadência atrasadas. No médio o pior
quadro é **igual** ao do panorama; no desktop não há diferença que se meça. Um quarto aparelho
(Mali-G925, de 2024) fica preso nos 60/s do ecrã dos dois lados, ou seja o shader é grátis onde há
folga. A queda automática para a imagem num aparelho que não sustente o shader está feita (**R18**): o
último degrau da escada troca o fundo em vez de congelar, com `?queda=0` para desligar e `?queda=sempre`
para ver o resultado.

**E o shader paga-se em nitidez, não em quadros** (medido a 2026-10-27 no telemóvel fraco, com o
pixelRatio preso por `?pr=`): o **mesmo shader**, no mesmo aparelho e na mesma sala, desenha **60,2**
quadros/s a `pr=1` (cadência cumprida, **4** atrasos em 1047) e **40,8** a `pr=2,63` — onde nem a
cadência se sustenta e a escada congela. E não é calor: na corrida do nativo a fase da **imagem** deu
59,9 quadros/s, portanto o aparelho estava saudável. É por isso que o fundo continua a ser o **shader em
todas as salas**: o que se gasta é resolução. A escada passou a perseguir um **chão de 45 quadros/s**
(`SHADER_POLICY.minFps`), que é o que se sente ao olhar em volta, e assenta no último pixelRatio que
provou aguentar — em vez de rastejar mudando a nitidez.

**Confirmado no aparelho, no build publicado:** o mesmo PowerVR saiu de **40,7** para **58,7** quadros/s
(**+44%**), com os atrasos de **22,6%** para **5,7%** e o pixelRatio a assentar em **1,95** depois de
quatro mudanças de nitidez. E, com a escada livre, o shader ficou **mais fluido do que o próprio
panorama** nesse aparelho (58,7 contra 48,6 — a imagem desenha a 2,63 nativo): o fundo de **reserva** é
ali o mais lento dos dois, o que fica registado como a próxima pergunta e não como uma mudança feita.

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

> **Atualização (2026-11-04, a décima terceira sala — D95):** o que esta versão mediu, com
> `node tools/regression/all.mjs --full`: **27 de 28** baterias em **3 504,8 s**, com a **única**
> vermelha a ser a **costura** (D46) — e é a vermelha que a spec admite. O dado **0,4 s** (os **19**
> ficheiros de mundo **OK**), as leis **31 de 31** com o controlo limpo, o importador da folha **21 de
> 21**, a cena **113 de 113** (T2–T12) em **126,5 s**, as portas e as chegadas **213 de 213** em
> **1 072,2 s** (eram **165** antes desta sala), os portais em movimento **20 de 20**, as duas línguas
> **9 de 9**, o fundo shader **69,1 s** (a política **18 de 18**, o dado **10 de 10**, a página **23 de
> 23**), a ordem da janela **26 de 26**, a emenda da esfera **17 de 17** (o `projecao` entra com
> **0,31** de pior salto), a chegada por uma porta **5 de 5**, a ponte de imagem **9 de 9**, os rótulos
> das obras **21 de 21** e das portas **23 de 23**, e o resto como estava. A **costura** deu **170 de
> 172**, com dois vermelhos que se explicam: a chegada ao portão vindo da `scene3` dá **3 fotogramas
> escuros em 89** amostras, e um corte em `scene6 → scene1` ficou **5 ms** acima do quadro (55 ms para
> um orçamento de 50). Nenhuma das duas é da sala nova — a primeira já tinha aparecido na corrida
> anterior —, e é o que a D46 continua a dever.
> **Atualização (2026-11-04, a porta parada do portão — D94):** a prova visual da sala 12 no servidor
> local (`node tools/server/serve.mjs`) encontrou o que nenhuma lei via: a porta que o **portão** ganhou
> para a sala 12 **não oscilava**. Não era defeito da sala — era do roteiro: a fase 3 acrescenta portas a
> mundos que já existiam (a do portão e a de chegada em cada destino) e a fase 6b só sorteava o mundo
> **novo**. A L29 também não podia vê-lo (mede o alcance de uma porta que oscila; uma porta parada
> alcança-se sempre). Fechado em três sítios: `sorteio.mjs --sem-movimento` (sorteia só as portas que
> ainda não oscilam, para não re-sortear o que já foi visto), o `new-room.mjs` a sortear **também os
> mundos que tocou**, e a `motion.mjs` com a verificação **14** (`motion: sway` em cada porta das páginas
> da exposição — **58 de 58**; a bateria passou de **19** para **20 de 20**). Medido: as quatro portas
> novas oscilam (alcance **100%**, a varrer a chegada entre **0 e 16,7%** do ciclo, semente
> `1793824526884`) e nenhum retrato foi refeito, porque a pose de repouso não mudou.
>
> **Atualização (2026-11-03, os números da v0.0.26, com a décima segunda sala e os anéis a 60 m — D93):**
> o que esta versão mediu, com `node tools/regression/all.mjs --full`: o dado **0** (os 18 ficheiros de
> mundo **OK**), as leis **31 de 31** com o controlo limpo, o importador da folha **21 de 21**, os doze
> testes **106 de 106** com a cobertura em **13 páginas**, as portas e as chegadas **165 de 165**, os
> portais em movimento **19 de 19**, o i18n **9 de 9**, a ordem da janela **22 de 22**, a emenda da
> esfera **16 de 16** (o `deposito` entra com **0,13** de pior salto) e a costura das travessias
> **142 de 150** — vermelha desde antes do anel (**D46**), com cinco saltos no corte entre **0,72 e
> 2,44**. Na corrida de **28 baterias** ficaram **3 vermelhas** em **3 350,7 s**: a costura; a
> `shader.mjs`, que falhou por **dois** quadros tardios e passa **23 de 23** repetida sozinha; e o
> `assets.mjs`, que decidia por relógio (2,5 s fixos) e passou a esperar pela condição — **10 de 10**.
> O detalhe por bateria está em §10 do [roadmap](docs/ROADMAP.md). O texto abaixo é o registo da
> **v0.0.25** e ficou como estava.
>
> **Atualização (2026-11-03, os números da v0.0.25, com o movimento nas doze páginas — D91):** o que
> esta versão mediu, com `node tools/regression/all.mjs --full`: o dado **0**, as leis **31 de 31** com o
> controlo limpo, o importador da folha **21 de 21**, os doze testes **99 de 99** nas páginas que o dado
> declara (catorze, com a sala de ensaio), as portas e as chegadas **165 de 165**, os portais em
> movimento **19 de 19** (os quatro da sala de ensaio com o eixo, a amplitude, o ângulo e **os dois
> períodos** do sorteio, mais a âncora da D91, a caminhada ao lado do plano e as cinco portas da `scene1`
> a oscilar), o i18n **9 de 9**, a ordem da janela **22 de 22**, a emenda da esfera **15 de 15** e a
> costura das travessias **125 de 128** — vermelha desde antes do anel (**D46**), com os mesmos casos na
> casa dos **0,5**. Na corrida de **28 baterias** ficaram **2 vermelhas** em **2 757,8 s**: a costura,
> que já estava, e a `shader.mjs`, que falhou por **um** quadro fora do orçamento (`late=1` em 158) e
> passa **23 de 23** quando repetida sozinha — um soluço da máquina, não do dado. O detalhe por bateria
> está em §10 do [roadmap](docs/ROADMAP.md). O texto abaixo é o registo da **Fase 4** e ficou como
> estava.

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

#### A exposição — os doze testes, nas 5 páginas

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
  — **6 de 6**; e os doze testes com uma porta a rodar no fixture, nos números da Fase 6. Desde a
  **D84**/**D85** a mesma bateria mede a **oscilação** (`sway`) na sala de ensaio, desde a **D87** o
  **movimento sorteado** de todas as portas e desde a **D91** as portas das **doze páginas da
  exposição** — **19 de 19**
- **B9** — o shader em produção, já descrito acima
- **B10** — este fecho

No caminho, três decisões nasceram do telemóvel do autor e não do plano (**D52** o giroscópio,
**D53** a janela ao vivo, **D54**/**D55** a travessia), e a costura das nuvens ficou estável: o destino
passou a ser congelado antes de se medir o corte, porque o quadro da ponte já era capturado com os
shaders parados — comparar com um destino a animar media o tempo que passou, não o corte. De
**0,34–0,56** para **0,41** em duas corridas seguidas.

**O que ficou aberto nesta fase:** o **R14**/**R15**, que fechou depois, a **2026-10-27**, com o A/B do
shader medido nos **três** aparelhos (mais um quarto) e a queda automática num aparelho fraco fechada
como **R18**.

**A Fase 8 — a ficha de cada obra (2026-10-25).** O autor descreveu a página de obra que queria e deu
o exemplo das Zonas 11; ficou decidido em **D60**: **uma página estática por obra**, gerada pela
ferramenta a partir do mundo, em `<mundo>/obras/<id>.html` — que a **D62** trocou depois por **uma
página só** (mais adiante). O clique numa obra passa a abrir essa
ficha **no mesmo separador** (`interaction: "page"`), e o «voltar» traz a exposição. O meio depende do
tipo: imagem, vídeo, modelo (o GLTF no próprio A-Frame) e texto mostram o ficheiro; e o tipo novo
`site` — para jogos e esculturas interactivas — **tenta embutir** o site, com a imagem da obra por
baixo e o botão «Abrir o site» sempre visível.

O que se mediu: `obra.mjs` **46 de 46** (os cinco tipos, as três camadas do `site`, a tabela das
plataformas, `?lang=en`, o «voltar» a cair na sala certa, a consola limpa), a lei **L20** a recusar uma
ficha velha, o `validate` a **0** e o `all.mjs --full` a **20 de 20**. O rótulo de cada obra passou a
dizer `page`.

**A ficha veste as Zonas 11 (D61).** Depois de ver as primeiras fichas no ecrã, o autor pediu «a
página de obras será com esta» e deu o `galerias/obra7.html`: o `css/obra.css` passou a ser o
`obra-template.css` das Zonas 11 adaptado (preto, cartões `#1a1a1a`, acento `#FF5722`, Arial,
`clamp()`, uma coluna de `clamp(320px, 90vw, 800px)` e uma linha por assunto) e o gerador ganhou a
**tabela das plataformas** do `platform-detector.js` — um endereço de YouTube, p5.js, Vimeo,
OpenProcessing ou Shadertoy é embutido no `embed` que a plataforma serve; um endereço desconhecido
passa tal e qual, sem se inventar um embed que o site não dá. Três desvios conscientes: o YouTube leva
**`mute=1`** (com som, o `autoplay` é bloqueado e a Zonas 11 ficavam com o cartão parado); o
**`?from=`** das Zonas 11 **não** se copiou, porque na zonas12 esse parâmetro é a **porta de chegada**
do mundo e voltar com ele faria a ficha anunciar uma chegada que não houve — o «voltar» é `../`, a
pasta do mundo (D28); e a classe do cartão deixou de repetir a do texto (`.linha` + `data-meio`, em
vez de `.linha titulo`), senão a `text-indent` da sinopse aplicava-se duas vezes. A bateria cresceu de
**32** para **46** verificações, e duas delas apanharam defeitos reais: a sinopse com o recuo a dobrar
e o `.botao-voltar` (um `<a>`) sem o texto centrado que o `<button>` das Zonas 11 tinha por omissão.

Duas coisas que esta fase corrigiu e que não se viam: o endereço da ficha tem de levar o **slug**
(as páginas usam `<base href="../">` dentro da sala, por isso a base é sempre a raiz — o mesmo truque
da porta de mundo), e o cursor do A-Frame, que num telemóvel **se funde por omissão**: quem olhasse
para uma obra durante 1,5 s abria-a sem tocar em nada. Com o modal isso era uma janela; com a ficha
seria uma mudança de página, portanto o `fuse` passou a `false` e a obra abre só a um toque.

**A ficha é uma página só (D62).** Depois de a ficha estar no ar, o autor pediu duas coisas: o dado
das obras entra por uma **folha** — TSV, com tabulações — (título, autores, sinopse, o endereço da obra e a **capa**), e a ficha
passa a ser **um ficheiro** que muda o conteúdo ao carregar em vez de vinte e um HTML gerados. O que
existe agora:

- **`obra.html`** na raiz — lê `?mundo=<slug>&id=<n>&lang=pt|en`, vai buscar o mundo e desenha a
  ficha com o mesmo desenho das Zonas 11. Cada obra continua a ser **um endereço próprio**, que é o
  que a medição precisa para distinguir as obras no relatório;
- **`node tools/artwork/from-csv.mjs`** — lê `data/obras.tsv` e escreve nos mundos o que mudou, com
  `--check` para ver sem escrever e `--file <caminho>` para correr uma folha de teste (aceita o caminho
  da raiz do projeto ou absoluto). A folha é de **2026-10-27** (D67): nove colunas em **português**
  separadas por **tabulação** e **sem aspas** — três créditos (`nomeAutores`, `nomeCoautores`,
  `nomaColaboradores`) que a ficha mostra como `Autor:`/`Coautor:`/`Colaborador:` com as etiquetas da
  interface. A tabulação é o que faz nenhum texto precisar de aspas (vírgulas e `;` são texto), e o
  leitor continua a aceitar `;` e `,` para as folhas antigas; um ficheiro gravado pelo Excel em
  «Texto separado por tabulações» (**UTF-16**) é descodificado pelo BOM. Recusa
  escrever um mundo que não passe as leis; a imagem passa a ser um asset próprio da obra (`capa-<id>`),
  e um `endereço da obra` preenchido faz dela uma obra `site`; uma célula `endereço da obra` vazia tira
  o site e a obra volta a ser o que a imagem der — e se a linha não disser o que ela passa a ser, o
  importador **recusa** em vez de deixar a obra invisível. As folhas de teste vivem em
  [`data/csv/`](data/csv/LEIA-ME.md), com um **MODELO.tsv** que é a folha de produção copiada;
- **a medição** (`js/scene/analytics.js`) — o autor vai ter **uma propriedade GA4 por mundo** e uma
  para o portão, e o ID mora no dado (`world.analytics.id`). Enquanto não houver IDs **não acontece
  nada**: nem script, nem pedido, nem linha na consola — é o que mantém o T8 e o funcionamento
  offline. Com um ID, a página vista sai **uma vez**, com o título da obra e o endereço que a
  identifica (sem a língua nem o cache-busting), e o script é injetado por este módulo, não colado no
  HTML — uma só forma de medir.

Medido: `obra.mjs` **59 de 59** (a tabela das plataformas, o endereço e a leitura do endereço, o
`page_view` com e sem ID, o script injetado, o meio pedido e o desenhado, o «voltar», a obra que não
existe, a consola), `validate` a **0** com a lei **L20** a olhar para a página única e a **L21** para o
formato do ID, o T6 a apontar para `obra.html?mundo=…&id=…` e o `all.mjs --full` a **20 de 20** em
**731,7 s**.

**O exemplo que o autor pediu (antes do texto definitivo).** `data/obras.exemplo.tsv` traz as dez obras
com texto de exemplo — uma com os **três créditos**, uma só com autor, uma sem créditos, uma em vídeo
e uma com vários autores na mesma célula —, nas quatro salas (com os `id` que elas têm hoje), e
corre-se com `--file`, sem tocar na folha a sério:

```sh
node tools/artwork/from-csv.mjs --file data/obras.exemplo.tsv
```

O mesmo texto vive num **mundo de exemplo publicado**, `exemplo-ficha` (`data/worlds/exemplo-ficha.json`,
um fixture como o `r9`), para se ver a ficha no telemóvel sem mexer no dado de produção:
`obra.html?mundo=exemplo-ficha&id=0` — e `1` só com autor, `2` vídeo, `3` sem créditos.

Foi este exemplo que apanhou **três** defeitos que as baterias não podiam ver, porque o site do fixture
é nosso e perdoa tudo:

- o `iframe` levava **`referrerpolicy="no-referrer"`**, e o YouTube recusa embutir sem referrer (erro
  **153**). A página de erro do YouTube **carrega como se tivesse corrido bem** — o `load` dispara, a
  capa sai de trás e o visitante fica a olhar para um erro do YouTube. Passou a
  `strict-origin-when-cross-origin`, e a bateria mede o atributo (é a causa, já que o efeito não é
  detetável);
- o **modelo** desenhava-se com o A-Frame do CDN **antes** do resto da ficha: se o CDN demorasse, a
  página morria a meio e ficava só com o nome da exposição e o «voltar». Agora o meio é a única parte
  que pode falhar, tem um limite de **8 s**, e uma falha cai na capa — o título, o autor e a sinopse
  aparecem sempre. A bateria passou a medir as duas coisas em separado: o meio que a obra **pede** e o
  que foi **desenhado**;
- e o pior: uma obra **`kind: "site"` não era desenhada na sala**. O `createArtwork` só dava caixa a
  `image` e `video`, por isso uma obra que é uma página existia no dado, aparecia na ficha e **não se
  via nem se clicava** na exposição. Passou a desenhar a **capa** (o `asset` dela é, por lei, uma
  imagem), e a bateria do `r9` — que só verificava que o elemento existia — passou a exigir a malha:
  **7 de 7**.

**Onde ver a ficha.** O endereço é sempre o mesmo, com o mundo e a obra na query. Há dois sítios para
olhar, e o segundo é o que mostra a página **como ela vai ficar** depois de o dado estar preenchido:

| O que se vê | Endereço |
| --- | --- |
| **produção** (o dado ainda não tem título nem sinopse, por isso o nome é o do asset) | `obra.html?mundo=scene1&id=0` — obras `scene1` 0–4, `scene2` 5–7, `scene3` 8–9 |
| **exemplo em cheio** (o fixture `exemplo-ficha`, com texto de exemplo) | `obra.html?mundo=exemplo-ficha&id=0` — `1` só com título, `2` vídeo, `3` com site |
| o mesmo, em inglês | junta `&lang=en` |

Publicado ou local: `https://rodrigorez.github.io/zonas12/obra.html?mundo=exemplo-ficha&id=0`, ou com
`node tools/server/serve.mjs` a servir em `http://127.0.0.1:8123/`. O mundo `exemplo-ficha` vive em
`data/worlds/exemplo-ficha.json` e é um **fixture**, como o `r9`: não tem porta nem pasta, abre-se
também com `?scene=exemplo-ficha`, e o validador sabe que não é uma sala (não entra no grafo nem nos
arranques). As capturas ficam em `.harness/imagenTeste/exemplo-ficha/`, fora do repositório.

**O guia de testes:** [docs/GUIA-DE-TESTES.md](docs/GUIA-DE-TESTES.md) — sete blocos com o que fazer, o
que se espera e o que enviar se falhar, com todos os endereços para telemóvel e computador —, o
**[roteiro passo a passo](docs/ROTEIRO-DE-TESTE.md)** para os percorrer pela ordem certa, e a
**[lista de pré-exposição](docs/PRE-EXPOSICAO.md)** com o que falta antes de abrir ao público.

**A capa por tentativas (D65).** O autor pediu o método: buscar a capa ao YouTube; se não der, a capa
indicada na folha (opcional, local ou num endereço); e se nada der, uma imagem padrão a pedir para avisar
o administrador. Ficou em `js/scene/cover.js`, com as três tentativas e a mesma cadeia na **ficha** e na
**sala**:

| Tentativa | De onde vem | Quando falha |
| --- | --- | --- |
| 1 | `i.ytimg.com/vi/<id>/hqdefault.jpg`, derivado do `site` quando é YouTube | não é YouTube, ou não carrega |
| 2 | o `endereço da imagem` da folha (endereço ou ficheiro do projeto) | está vazia, ou não carrega |
| 3 | `assets/covers/sem-capa.svg` — «Capa indisponível · avisar o administrador da galeria» | — |

A troca acontece no `onerror` do `<img>`: é o único sinal que responde às duas perguntas ao mesmo tempo
(existe? descodifica?). Uma célula `capa` com **`-`** tira a capa do dado — é assim que a obra de vídeo
fica sem nada escrito e a cadeia começa no YouTube.

Duas correções que a medição impôs: a malha da sala tem de **esperar** que a imagem esteja descodificada
(sem isso a consola dizia «Texture marked for update but image is incomplete» — apanhado pela D40), e o
`data-capa-de` em cada `<img>` diz qual tentativa ganhou, que é o que o instrumento lê.

Medido: bateria nova `capa.mjs` **9 de 9** — o id sai de `watch?v=`, `youtu.be`, `embed/` e `shorts/`; a
ordem das tentativas; e, no browser com pedidos bloqueados, **YouTube** com rede, **capa da folha** com o
YouTube bloqueado e **imagem padrão** com os dois bloqueados —, e o resto: `obra.mjs` **71 de 71**,
`D40` **21 de 21**, `r9` **7 de 7**, `volta.mjs` **7 de 7**, `ficha-falhas` **3 de 3**, suíte por omissão
**5 de 5**.

**A folha a funcionar de ponta a ponta.** O autor pediu para ver o circuito a trabalhar, e ele está
preenchido com texto **provisório**: as dez obras de produção passaram a ter nome e **três créditos**
(autor, coautor, colaborador — vários nomes na mesma célula, separados por vírgulas) e descritivo.
**Uma** delas — a do vídeo, `scene1` obra 2 — tem `endereço da obra`: um vídeo do YouTube, para
exercitar o caminho de uma obra cujo conteúdo é uma página, e **nenhuma imagem no dado** (`-`), para a
cadeia do D65 começar no thumbnail do YouTube. O caminho, que é o que fica para o texto definitivo:

```sh
# 1. editar data/obras.tsv (nome, créditos, descritivo, endereço da imagem, endereço da obra)
node tools/artwork/from-csv.mjs --check   # 2. o que mudaria, sem escrever
node tools/artwork/from-csv.mjs           # 3. escreve nos mundos
node tools/scene/validate.mjs             # 4. as leis do dado, depois de escrever
```

Uma **célula `endereço da obra` vazia tira o site** e a obra volta ao que o ficheiro dela é (imagem,
vídeo ou modelo): é a única forma de desfazer, e é o que faz da folha a fonte da verdade desse campo. Foi
assim que os `testeX.nada` de uma primeira passagem saíram quando o autor passou a querer só uma obra
com site.

Do mesmo passo saíram quatro correções:

- **um site que não existe não dava erro**: o browser dispara o `load` do iframe com a **página de erro
  dele** em ~100 ms (medido: 97–136 ms, contra 623 ms de uma página real), e a ficha mostrava o «site
  não encontrado» do Chrome em vez da capa. Passou a haver um limite (`INSTANT_LOAD_MS`, 250 ms): abaixo
  dele o site conta como falhado e é a **capa** que fica, com o botão «Abrir o site» sempre presente;
- **um asset remoto** (D64): as leis de disco (L9, L14, L10) passaram a dizer «não verificado» em vez de
  recusarem, e o importador aceita uma `capa` que é um endereço;
- **uma obra com site tem de ter capa de imagem** (a lei já o dizia): a obra do vídeo tem o thumbnail;
- a bateria **D40** tinha os nomes esperados escritos à mão e o `obra.mjs` tinha o **tipo** de cada obra
  escrito à mão (`tipo: 'image'`). Mudar a folha era uma falha dos instrumentos em vez de uma mudança do
  dado: ambos passaram a ler o `data/worlds/<slug>.json`.

Medido: `validate` **0**, `obra.mjs` **71 de 71** (incluindo «a capa do site carrega» — um ficheiro do
projeto ou um endereço remoto), `D40` **21 de 21**, `volta.mjs` **7 de 7**, `ficha-falhas` **3 de 3** e a
suíte por omissão **5 de 5**. Na sala, a textura remota também carrega (mapa de **1280×720** na malha da
obra, consola limpa).

**Voltar ao sítio onde se estava (D63).** Abrir uma obra e voltar punha a câmara no **início do mundo**:
quem estava de frente para uma obra, a três metros, tinha de caminhar outra vez até lá. Agora o clique
guarda o ponto de vista — **posição, olhar e dimensão** — e o «voltar» da ficha devolve-o (`?volta=1`).
A memória é do separador, vale **um** regresso e tem prazo de 30 minutos: não é uma preferência, é a
memória de um gesto. Medido: `volta.mjs` **7 de 7** — o ponto é guardado no clique, devolvido dentro de
0,2 m e 1,5°, consumido no regresso, e sem ponto a sala começa onde o dado diz. Escrever a posição tinha
uma armadilha: `object3D.position` **não pega** numa câmara acabada de criar (o componente `position`
repõe o dado), por isso a escrita passou a ser pelo atributo.

Do mesmo teste do autor saiu uma correção de desenho: num ecrã largo a imagem ficava pequena dentro do
cartão (`--padding: 4vw` crescia com a janela, a coluna parava nos 800 px). Com
`clamp(16px, 4vw, 40px)` a imagem passou a ocupar **89–91%** do cartão em todas as larguras medidas,
contra **71%** a 2560 px antes.

O que isto custa, dito: **sem JavaScript a ficha não mostra a obra**. Antes cada ficha era HTML
pronto; agora é desenhada do dado, como a própria exposição (que também não existe sem JavaScript).
Foi uma troca pedida pelo autor e está registada na decisão.

**O roteiro de teste (2026-10-27).** O guia por números não se seguia com o aparelho na mão, e o autor
pediu um **roteiro passo a passo**: `docs/ROTEIRO-DE-TESTE.md` tem a preparação (aba anónima, ecrã sem
apagar, servidor local, árvore limpa), **nove passos no telemóvel** e **dezassete no computador**, cada
um com o **sinal de falha** concreto, uma folha de registo e o que **desfazer** no fim — os blocos do
A folha e o editor escrevem no repositório, e um ID de Analytics de teste gravado iria para produção.
Percorrido pelo autor e **dado por bom, sem falhas reportadas**, incluindo o **ponto de regresso** (A8)
e a linha **`travessia`** da sonda com `encosto` (A9). Escrever o roteiro corrigiu três coisas no
próprio guia: o `v=8` que eu citava não existe em código nenhum, a ficha da praia já não tem «site
falso», e `id=3` é a obra **com site** enquanto `id=2` é a de **vídeo**.

**A fase fecha a 2026-10-27.** O que fica por fazer **não é a fase**: é o **conteúdo** que só o autor
tem — o texto definitivo da folha, a saída da obra de vídeo de laboratório e a conferência das capas — e
um item técnico da Fase 7 (o teto de pixelRatio do panorama). Os quatro estão escritos, com o que cada
um exige e como se sabe que ficou feito, em [docs/PRE-EXPOSICAO.md](PRE-EXPOSICAO.md). Separar as duas
coisas é de propósito: uma fase que fica aberta à espera de texto deixa de poder dizer **com que
números** fechou.

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
- Uma obra que esteja **à frente** de uma janela tapa-a: o recorte da janela é opaco (`alphaTest`) e
  desenha-se **antes** das obras da sala (**D80**). Era o contrário até à v0.0.20 — o conteúdo da janela
  passava por cima da obra que estava à frente dela, porque um material `transparent` é desenhado depois
  de toda a geometria opaca e o `renderOrder` deixa de contar.
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
> (D24–D29) estão em §11. O `?scene=<mundo>` continua a existir para os testes, e as quatro salas têm
> endereço próprio. O marco é a branch `v0.0.6`.

Um **mundo** é um conjunto fechado de dimensões, com as suas portas e o seu conteúdo, e tem o seu
próprio ficheiro em `data/worlds/`. O **portão** é o mundo de entrada, com a câmara/AR, e tem uma
porta para cada sala. Dentro de uma sala só se navega pelas dimensões dessa sala.

| Antes (Fase 3) | Agora (Fase 3B) |
| --- | --- |
| Uma página, uma cena, quatro dimensões | **Uma cena por mundo**, com o seu ficheiro (`data/worlds/`) e o seu endereço: a raiz é o portão e `/scene1/`, `/scene2/`, `/scene3/`, `/scene4/`, `/scene5/`, `/scene6/`, `/scene7/` e `/scene8/` são as salas — o **mesmo `index.html`**, com o `<base>` a apontar um nível acima |
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
que é o defeito que a praia teve até ao B7), e os cinco **arranques** (a pasta é o slug, o `<base>`
aponta para a raiz e os cinco são o mesmo ficheiro fora dessa linha — D28). O formato dos dados, as
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

```text
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

```text
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
| `gate` (o portão, na raiz) | 0 — realidade | Vê-se a câmara | `0 → scene1`, `1 → scene2`, `2 → scene4`, `3 → scene5`, `14 → scene6`, `18 → scene7`, `22 → scene8`, `26 → scene9` — em `x = -42`, `-30`, `-18`, `-6`, `6`, `18`, `30` e `42`, `z = -32` |
| `scene1` (a cidade) | 0 — cidade 360º | `cidade-360` + 7 obras | `2 → gate`, `3 → scene2`, `17 → scene6`, `25 → scene8`, `29 → scene9` — em `x = -25`, `25`, `50`, `-50` e `75`, `z = -45` |
| `scene2` (a praia) | 0 — praia | `praia` + 7 obras | `4 → scene1`, `5 → gate`, `6 → scene3` — em `x = -19`, `0` e `19`, `z = -80` |
| `scene3` (o céu) | 0 — céu 360º | `skycloud` + 3 obras | `7 → scene2`, `10 → scene4`, `20 → scene7` — em `x = -40`, `0` e `20`, `z = -120` |
| `scene4` (a noite) | 0 — noite 360º | `skycloud` + 6 obras | `8 → gate`, `9 → scene3`, `13 → scene5` — em `x = -19`, `19` e `0`, `z = -80` |
| `scene5` (as ondas) | 0 — ondas 360º | `praia` (reserva) + 5 obras | `11 → gate`, `12 → scene4` — em `x = 0` e `19`, `z = -80` |
| `scene6` (os becos) | 0 — becos 360º | `cidade-360` (reserva) + 5 obras | `15 → gate`, `16 → scene1` — em `x = 0` e `19`, `z = -80` |
| `scene7` (as presenças) | 0 — presenças 360º | `praia` (reserva) + 6 obras | `21 → gate`, `19 → scene3` — em `x = 0` e `19`, `z = -80` |
| `scene8` (as imersões) | 0 — imersões 360º | `praia` (reserva) + 5 obras | `23 → gate`, `24 → scene1` — em `x = 0` e `19`, `z = -80` |
| `scene9` (o mangue) | 0 — mangue 360º | `praia` (reserva) + 4 obras | `27 → gate`, `28 → scene1` — em `x = 0` e `19`, `z = -80` |

O grafo das portas leva cada uma a um **mundo**, e não a uma dimensão do mesmo ficheiro (excepto a
porta 5, trocada no B7 — ver abaixo):

```text
gate   ⇄ cidade   (portas 0 e 2)      gate  ⇄ praia  (portas 1 e 5)
cidade ⇄ praia    (portas 3 e 4)      praia ⇄ céu    (portas 6 e 7)
gate   ⇄ noite    (portas 2 e 8)      céu   ⇄ noite  (portas 10 e 9)
gate   ⇄ ondas    (portas 3 e 11)     noite ⇄ ondas  (portas 13 e 12)
gate   ⇄ becos    (portas 14 e 15)    cidade ⇄ becos (portas 17 e 16)
gate   ⇄ presenças (portas 18 e 21)   céu   ⇄ presenças (portas 20 e 19)
gate   ⇄ imersões (portas 22 e 23)    cidade ⇄ imersões (portas 25 e 24)
gate   ⇄ mangue   (portas 26 e 27)    cidade ⇄ mangue   (portas 29 e 28)
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

A cidade, a praia e a noite têm **regresso directo** ao portão — `cidade → gate` (porta 2),
`praia → gate` (porta 5) e `noite → gate` (porta 8); o céu regressa pela praia (porta 7), porque não
tem porta própria para o portão. E cada porta é **bidirecional**: atravessar no sentido contrário é a
mesma porta. A que marca `arrivalFrom` é por onde se chega a esse mundo (uma por origem — lei L17), e a
chegada é **atrás** dela, virada para dentro da sala — o que faz do regresso um passo. As posições foram
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
`http://127.0.0.1:8123/scene1/`, `/scene2/`, `/scene3/`, `/scene4/`, `/scene5/`, `/scene6/`,
`/scene7/`, `/scene8/`, `/scene9/`, `/scene10/`, `/scene11/`, `/scene12/` e `/scene13/`. As treze salas
servem o **mesmo
`index.html`** da raiz (o `<base>` é que muda), e atravessar uma porta de mundo navega para a pasta do
destino.

Quem quiser experimentar sem mexer na exposição pode forçar um mundo com `?scene=`
(`http://127.0.0.1:8123/?scene=example`): carrega o `data/worlds/example.json`, o mundo de ensaio
com duas dimensões e **duas portas de cada tipo** (o par de dimensões ao vivo, atravessável, e o retrato que navega) — `?scene=scene1`, `?scene=scene2`, `?scene=scene3`, `?scene=scene4`, `?scene=scene5`, `?scene=scene6`, `?scene=scene7`, `?scene=scene8`, `?scene=scene9`, `?scene=scene10`, `?scene=scene11`, `?scene=scene12` e `?scene=scene13` também
funcionam. E `&from=<mundo>` diz de que mundo se vem, o que faz o visitante aparecer atrás da porta
de chegada: `/scene2/?from=scene1`. O mundo de ensaio do fundo shader (Fase 7, **R14**/**R15**) é
`?scene=shader`, e `&shader=0` mostra a imagem de reserva em vez do shader — em qualquer mundo.

A **sala de ensaio** (D84) é `?scene=scene100`, e é o único caminho para lá: nenhuma porta do projeto
aponta para ela. As **quatro** portas dela levam ao portão e às salas 3, 6 e 9, e levam **sem
`?from`** — o destino abre como uma primeira visita. Três delas **oscilam** (D85): a A em X, a B em Y e a
C em Z, com translação de **±5 m** e rotação de **±90°** num período de **20 s**, e cada uma roda sobre o
**centro da porta** e não sobre a base (D86) — a do portão fica parada, como controlo. É onde se
experimenta o que ainda não entra no caminho do visitante.

### 2. Personalizar Conteúdo

- Modifique as imagens e vídeos em `assets/{panoramas,artworks,video,previews}/`
- Atualize os caminhos no **catálogo `assets`** do mundo (`data/worlds/<mundo>.json`) — cada
  caminho aparece lá **uma vez**, e as dimensões e as obras apontam para ele pelo nome (D20). O
  catálogo é a única parte que o editor não edita: as dimensões, as obras e as portas editam-se
  nos painéis (passo 6)
- Para acrescentar um **mundo**: **siga o [`docs/GUIA-NOVA-SALA.md`](docs/GUIA-NOVA-SALA.md)** — é o
  caminho obrigatório, com os comandos por ordem e a frase que cada um tem de imprimir (a
  [`docs/SPEC-NOVA-SALA.md`](docs/SPEC-NOVA-SALA.md) é a razão das coisas e abre-se quando o guia
  remete para lá). O primeiro passo é `node tools/scene/new-world.mjs <slug>`, que cria a pasta e o
  arranque (D31); depois `node tools/scene/new-room.mjs <slug> --destinos <salas>` — o atalho das fases
  **3 a 7**, que exige a pasta da fase 1 e recusa sem ela — escreve o esqueleto do dado nos dois lados
  (as dimensões, o fundo, as portas, os assets dos retratos), **sorteia o movimento** de cada porta e
  corre os anéis, o giro, os buracos do mundo real e o validador. O que fica para o autor é o que não é
  aritmética: as obras na folha, a composição no editor e os retratos (duas passagens)
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
| `tools/scene/validate.mjs` | os ficheiros de mundo (o portão, as treze salas e os cinco fixtures), as leis **L1–L30**, o grafo das portas e os arranques |
| `tools/scene/laws-selftest.mjs` | **35** avarias injectadas, todas detectadas, com o controlo limpo — a L29 e a L30 entram com a avaria **e** com o seu controlo negativo |
| `tools/scene/mapa.mjs` | o **mapa das portas** (D96): as 27 salas contra a L24 e a L25, o acordo com o disco e os 14 passos da obra, cada um julgado; `--grafo`, `--dossie` (a folha de um agente) e `--ondas` (quantas salas cabem em paralelo, e porquê — D103/D104). Desde a v0.0.30 está no `all.mjs` |
| `tools/scene/construir.mjs` | o **orquestrador das ondas** (D104): abre as salas planeadas na ordem que o grafo permite, em paralelo dentro de cada onda, e fecha tudo com **um** `integrar`. `--seco`, `--todas`, `--ondas 1,2`. Só levanta esqueletos: as obras, a composição e os retratos são do autor |
| `tools/scene/ondas.mjs` | a conta das ondas, numa casa só: a sala precisa de duas vizinhas construídas, e duas vizinhas **entre si** nunca caem na mesma onda (a porta entre elas é escrita pela que nasce depois) |
| `tools/scene/abrir-mapa.mjs` | o que seria preciso para abrir mais frentes: `--seco` diz quantas arestas faltam, `--teto N` diz se um limite de portas por sala as faria caber. Não muda a L24 |
| `tools/scene/integrar.mjs` | o **fecho da ronda** (D102): põe as portas no portão e as chegadas que faltam em cada destino, corre os anéis, o giro, os buracos, o sorteio (só nas portas novas) e o validador **uma vez**. Idempotente: a segunda passagem diz `nada a fazer`. `--seco` diz o que faria |
| `tools/coordination/status.mjs` | quem está a escrever nos mundos agora, e se o dono da trava está morto (o próximo a chegar reclama-a) |
| `tools/server/selftest.mjs` | a **gravação do editor** por HTTP: origem, tipo, versão, validação, cópia de segurança e escrita atómica. Ficou de fora das baterias desde a D48 — e foi assim que a gravação passou meses a devolver 500. Entrou no `all.mjs` na v0.0.30 |
| `tools/scene/sorteio.mjs` | o movimento **sorteado** das portas de uma sala nova (D87): ensaio por omissão, `--aplicar` para escrever, `--semente N` para repetir a mesma sala |
| `tools/scene/ensaio-dois-aneis.mjs` | o ensaio dos **anéis do portão** (D97) na `scene100`: mede o passo, a corda e a folga de cada anel e, com `--aplicar`, escreve as 28 portas do ensaio |
| `tools/regression/twelve-tests.mjs` | **T2–T12** nas páginas do **dado** — **113** verificações, uma delas a cobertura da lista (que cresce com as salas: 99 com doze, 113 com treze) |
| `tools/regression/traversal-tests.mjs` | **T1** (as portas) e **T7/T11** (as chegadas) — as 66 portas das catorze páginas, **261** verificações; aceita mundos no argumento (`traversal-tests.mjs scene13` mede 67 s em vez de 1210 s) |
| `tools/regression/i18n.mjs` | as duas línguas: chaves, marcadores e `?lang=en` nas duas páginas |

`--full` acrescenta as baterias arquivadas das Fases 4, 5, 7 e 8 — a costura das travessias, a ponte
de imagem, a chegada por uma porta, os rótulos, o botão, a transição, o fundo shader (que mede a
política e as duas páginas com uma), os quatro valores do R9 na cena e nos painéis, o lote por
dimensão, o catálogo de assets, os portais em movimento, a ficha das obras, o **ensaio A/B do fundo**
(`ensaio.mjs`, D66), a **queda para a imagem** (`queda.mjs`, R18), a **ordem da janela**
(`ordem-da-janela.mjs`, D80) e a **emenda da esfera** (`emenda.mjs`, D82) — cada uma abre um Chrome e
juntas somam minutos, por isso não são o `default`. Com `--full` são **28** baterias.

Os instrumentos de linha de comando que **não** entram no `all.mjs` são os que escrevem no
repositório: `node tools/artwork/from-csv.mjs` lê `data/obras.tsv` e escreve nos mundos o dado das
obras (nome, créditos, descritivo, imagem e site) — com `--file` corre outra folha, e é assim que se vê
o exemplo (`data/obras.exemplo.tsv`) sem tocar na definitiva —, `node tools/artwork/capas-locais.mjs` guarda as capas remotas dentro do projeto (D107: reduz a 1200 px e reescreve o caminho; uma capa que não venha fica no dado, reportada), `node tools/artwork/links.mjs` diz o que cada site e cada capa remota fazem de verdade — se respondem **e** se deixam ser embutidos no iframe da ficha (D108; só reporta o que está mal), `node tools/scene/new-world.mjs
<slug>` cria a pasta e o arranque de um mundo, `node tools/scene/new-room.mjs <slug> --destinos …`
escreve o esqueleto de uma sala nova, as portas que ela pede **e o movimento sorteado de cada porta**
(ver [`docs/SPEC-NOVA-SALA.md`](docs/SPEC-NOVA-SALA.md)), `node tools/scene/ring.mjs --aplicar` põe as obras
e as portas nos dois anéis (D77) e `node tools/scene/portrait.mjs --todos` desenha os retratos das
portas (duas passagens, e cada uma abre um Chrome por porta; `--direto` desenha a **primeira visita**, que
é o que mostra uma porta da sala de ensaio — D84). Os pares saem do dado, não de uma lista à mão.

As duas baterias que medem a exposição **página a página** (os T2–T12 e o T1/T7/T11) tiram a lista de
páginas do **dado** (`tools/regression/paginas.mjs`): uma sala nova entra sozinha, e a bateria verifica
«a lista cobre todas as salas do dado (N)» antes de medir — foi assim que uma sala deixou de poder
ficar verde por não estar numa lista escrita à mão. Os **fixtures abertos** também estão nomeados lá
(`FIXTURES_ABERTOS`): o `example` e a sala de ensaio `scene100`, que nenhuma porta do projeto alcança.

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
corpo só pinta `col` (sem texturas, sem `#`, sem `discard`). O prelúdio dá mais três coisas, e são as
que fazem a esfera **fechar** na volta (D82): `volta` (o azimute em voltas, −0,5 a +0,5), `azim` (o par
`d.xz`, seno e cosseno do azimute, contínuo em toda a volta) e `noise3` (o ruído lido na direcção).
`az` é um serrilhado — salta de +PI para −PI atrás do visitante —, por isso um padrão conta-se em
**voltas inteiras** (com o índice da célula a fechar em `mod(indice, N)`), um seno leva `az` por um
**inteiro** (`sin(az * 18.0)` fecha, `sin(az * 1.4)` corta), o ruído orgânico lê-se em `noise3` com
`azim`, e um chão lê-se em `vec2(sin(az), -cos(az)) * 1/(horizonte - el)`. Quem duvidar mede:
`node tools/regression/emenda.mjs`. Da raiz do projeto:

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

```text
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

### 8b. O ensaio A/B de uma vez (`?ensaio=1`)

A sonda mostra **um** lado do par shader × imagem. Fechar o **R14** exige os dois, no mesmo aparelho e
na mesma sala — e três aparelhos. `?ensaio=1` faz o par sozinho e devolve **um** bloco:

```text
https://rodrigorez.github.io/zonas12/scene1/?ensaio=1
```

A página aquece 10 s, mede 45 s do shader, guarda o resultado na sessão do separador, **recarrega
sozinha** com `?fase=imagem&shader=0`, mede a imagem e junta os dois lados. O painel diz em que fase
está e quanto falta; no fim tem **Copiar** (o bloco inteiro) e **Repetir**. Leva ~2 minutos por
aparelho e não precisa de consola nem de tocar em nada.

O bloco traz, por fase: fundo (modo e `shaderId`), **janela** (a que passou, com o desvio em relação à
pedida e o tempo em que a aba esteve escondida), **quadros/s**, **pior quadro** e quantos passaram do
dobro da mediana, cadência, atualizações, pixelRatio (com o mínimo e o máximo que a escada visitou),
atrasos e eventos — mais a comparação dos dois lados, com as **duas janelas** lado a lado, o aparelho e a
**GPU**. As durações mudam-se no endereço: `?ensaio=1&segundos=30&aquecimento=5` (a medida tem um
**mínimo de 2 s**, senão não há um único quadro a contar).

O contador no ecrã, a janela de medida e o divisor dos quadros saem **todos do mesmo relógio**
(`performance.now()`): o que o painel anuncia é o que se mede. O desvio entre a janela pedida e a medida
fica escrito no relatório (medido: **+0,00 s** e **−0,01 s** em 3 s, com um relógio que fecha a fase de
100 em 100 ms). E uma aba **escondida pausa a fase** — um `requestAnimationFrame` que não corre contaria
zero quadros, e o A/B compararia 45 s de shader com 3 s de ecrã ligado na imagem; o tempo escondido sai
da conta e aparece como `pausada`. Se as duas janelas saírem diferentes, a comparação diz que o par não é
comparável e pede para repetir.

Porque o **pior quadro** e não só os quadros: numa máquina rápida o browser desenha ao ritmo do ecrã e
os dois lados empatam (medido num portátil com RTX 4060: **165,3 → 164,3** quadros/s), o que não quer
dizer que o shader seja grátis — quer dizer que ainda sobra. Num Android fraco os mesmos dois lados dão
**45,5** contra **50,4**. É a diferença entre «não se mede» e «não custa».

### 9. No telemóvel, o sensor de orientação

O `look-controls` do A-Frame faz do telemóvel uma janela para a cena: rodar o aparelho roda a vista.
Num aparelho **sem giroscópio** esse sinal vem do acelerómetro e do magnetómetro, com ruído, e a sala
**treme** — foi medido no telemóvel fraco do autor. O `js/modules/orientation.js` mede o ruído nos
primeiros 6 s (o **segundo mais quieto**, para não confundir mão a mexer com sensor mau) e desliga o
magic-window **só onde ele não presta**; a visita continua a poder olhar a arrastar. Num aparelho com
giroscópio nada muda.

```text
http://127.0.0.1:8123/scene1/?giroscopio=0     desliga à força (escape, para qualquer aparelho)
```

O que se lê no painel da sonda, na linha `giroscópio`: `ligado · tremor 0.04` num sensor bom,
`desligado · tremor 45.4` num ruidoso. O limite é **0,5** (graus por amostra²) e está em
`ORIENTATION.jitterLimit`.

## Melhorias Planejadas

A **Fase 7** (§9 de [docs/ROADMAP.md](docs/ROADMAP.md)) fechou em **2026-10-25**: os dez blocos estão
feitos e cada um mediu o seu número. O **R14**/**R15** (o A/B do shader nos três aparelhos) fechou em
**2026-10-27**, com os três medidos e um quarto de bónus. A **Fase 8** (a ficha da obra) fechou no mesmo
dia — o que falta para abrir ao público é **conteúdo**, e está listado em
[docs/PRE-EXPOSICAO.md](docs/PRE-EXPOSICAO.md).

- **Fundos shader** (**R14**/**R15**, bloco **B9**): **fechado** — shader em produção desde 2026-10-24,
  `?shader=0` para a imagem de reserva, validador em `tools/shader/`, política 20 → 15 FPS → estático, e
  o A/B medido nos três aparelhos (§ «Critério antes de produção»)
- **Queda automática para a imagem** (**R18**): **fechada** — o último degrau da escada troca o fundo pela
  imagem em vez de congelar; `?queda=0` desliga, `?queda=sempre` força, e `queda.mjs` mede os dois lados
- **O shader nos telemóveis antigos**: **resolvido** — o autor pôs de fora **tirar o shader** a quem tem
  um aparelho fraco (é o fundo da obra), e a experiência com `?pr=<n>` mostrou que não é preciso: o mesmo
  shader desenha **60,2** quadros/s a `pr=1` e **40,8** a `pr=2,63` no mesmo aparelho, com a fase da
  imagem a 59,9 a provar que não era calor. O shader fica em todas as salas e a escada passou a perseguir
  um **chão de 45 quadros/s**, gastando resolução (ver «Critério antes de produção»)

Fora da Fase 7, e sem data:

- **As baterias arquivadas por omissão**: hoje `node tools/regression/all.mjs` corre as seis que
  decidem uma alteração e deixa as vinte da Fase 4/5/7/8 atrás de `--full`, porque cada uma abre um
  Chrome; juntá-las num só browser (uma sessão, vinte medições) poria as **26** em minutos

**Fechado na Fase 7:** o catálogo em duas línguas (**B2**), o que o esquema prometia e a cena não
construía — **D56** (fundo de cor), **D57** (`link` a navegar), **D58** (modelo GLTF e texto) —, o
lote por dimensão e o catálogo de assets no editor (**B3**/**B4**), os portais animados (**D59**) e a
verificação dos dois lados da exposição com **26** baterias (§ «Como Usar»).

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
