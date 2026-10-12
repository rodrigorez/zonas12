# Projeto Galeria AR

## Descrição

Este projeto é uma galeria imersiva de realidade aumentada/virtual utilizando A-Frame. Ele permite criar experiências interativas onde os usuários podem explorar ambientes 360º e interagir com obras de arte virtuais através de portais estêncil.

## Estrutura do Projeto

````markdown
├── assets/
│   ├── images/
│   └── videos/
├── css/
│   └── style.css
├── js/
│   └── main.js
├── .harness/
│   ├── exclude/ (arquivos excluídos do projeto principal)
│   └── PLANO_ACOES.md (plano de ações do projeto)
├── index.html (versão atual do projeto)
├── portaljerome.html (versão antiga, movida para .harness/exclude)
└── README.md
````

## Regras de Organização do Projeto

### 1. Estrutura de Pastas

- Todos os novos assets (imagens, vídeos, modelos 3D) devem ser colocados em `assets/images/` ou `assets/videos/`
- A pasta `img/` foi removida do projeto. Todos os assets foram migrados para `assets/images/`
- Código JavaScript deve ser colocado em arquivos separados dentro da pasta `js/`
- Código CSS deve ser colocado em arquivos separados dentro da pasta `css/`

### 2. Arquivos HTML

- `index.html` é o arquivo principal do projeto
- Versões antigas ou alternativas devem ser movidas para `.harness/exclude/`
- Arquivos em `.harness/exclude/` são mantidos apenas para referência histórica

### 3. Documentação

- `README.md` contém a documentação principal do projeto
- `PLANO_ACOES.md` foi movido para `.harness/PLANO_ACOES.md`
- Documentação de componentes deve ser adicionada ao README.md

### 4. Regras para Humanos e IA

#### Para Humanos

- Mantenha todos os novos assets na estrutura padronizada `assets/`
- Utilize `index.html` como ponto de entrada principal
- Consulte `.harness/PLANO_ACOES.md` para entender o roadmap do projeto
- Arquivos em `.harness/exclude/` são históricos e não devem ser modificados

#### Para IA

- SEMPRE que adicionar novos assets, use a pasta `assets/images/` ou `assets/videos/`
- NÃO use a pasta `img/` para novos assets
- SEMPRE que criar novos componentes, documente-os no README.md
- NÃO modifique arquivos em `.harness/exclude/`
- SEMPRE que precisar de informações sobre o roadmap, consulte `.harness/PLANO_ACOES.md`

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

Há uma só fonte de verdade — `window.portalAR.dimensaoAtiva`, a dimensão onde o
utilizador está (`js/main.js`). Todos os portais e todo o conteúdo leem daqui, por
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
- `renderer.sortObjects = true` em `config-ar` (`js/main.js`): com `false` o three
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
- O componente `limite-movimento` e a configuração `CONFIG_NAVEGACAO` foram removidos (já não existem no `js/main.js`) **(REMOVIDO)**

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

Tudo é decidido por frame em `gestor-dimensoes` (`js/main.js`), pela colisão com a caixa
e pelo `dimensaoAtiva`:

- **Onde estás**: o conteúdo da tua dimensão desenha em todo o lado onde nenhuma janela
  escreveu (`Equal 0`).
- **O que a janela mostra**: o conteúdo da dimensão do outro lado desenha dentro do
  quadro (`Equal` com o valor daquela dimensão).
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

1. Abra o arquivo `index.html` ou `portaljerome.html` em um navegador moderno
2. Clique no botão "ATIVAR EXPOSIÇÃO"
3. Permita o acesso à câmera quando solicitado
4. Explore o ambiente utilizando o mouse (desktop) ou o D-pad (mobile)

### 2. Personalizar Conteúdo

- Modifique as imagens e vídeos na pasta `assets/`
- Atualize as referências nos arquivos HTML
- Adicione novas "obras" utilizando componentes A-Frame

## Melhorias Planejadas

Consulte o arquivo `PLANO_ACOES.md` para detalhes sobre as melhorias planejadas para o projeto.

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

Este projeto é distribuído sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
