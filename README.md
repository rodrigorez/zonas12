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

### 1. Portal Estêncil Dinâmico

O portal é uma **janela entre dimensões**: o quadro vermelho mostra a dimensão do outro lado e, ao atravessá-lo, troca-se de dimensão. Quem deteta a travessia é uma **caixa de colisão**, calculada no espaço do portal — não há nenhuma posição nem distância fixa no mundo.

| Estado | Fora do quadro vermelho | Dentro do quadro vermelho |
| --- | --- | --- |
| **1 — Mundo real** | Câmera (realidade) | Dimensão do portal (esfera 360º + obras) |
| **2 — Portal** | Dimensão do portal (esfera 360º + obras) | Câmera (realidade) |

O quadro é a janela: perto do portal a janela cresce até preencher o ecrã, por isso ao atravessar a dimensão seguinte passa a ocupar tudo.

O fundo da dimensão do portal vem do `src` do portal, que pode ser uma imagem **ou um vídeo** (por exemplo a imagem da câmara): um vídeo é usado como `THREE.VideoTexture`, para animar. Sem `src`, a dimensão do portal fica sem fundo 3D e vê-se a câmara.

A travessia é detetada pela colisão com a caixa, sempre dentro dela:

- **Atravessar** o plano do quadro: passa para a dimensão seguinte
- **Estar** dentro da caixa sem atravessar: não muda nada
- **Atravessar outra vez** (ao voltar): volta à dimensão anterior

Com 2 dimensões isto é uma alternância: atravessar → dimensão 2; atravessar de novo → dimensão 1.

Como tudo é calculado no espaço do portal (`worldToLocal` + a rotação da caixa), o portal pode estar **deslocado, rodado ou em movimento** — a travessia acompanha-o sempre (`js/main.js`, `tick`).

Requisitos técnicos (não remover, o portal deixa de funcionar):

- `renderer="...; stencil: true"` no `<a-scene>`: a partir do three r184 o buffer de stencil **não é criado por omissão**, e sem ele o portal desenha tudo em todo o lado (perde-se a troca de dimensões)
- `renderer.sortObjects = false` em `config-ar` (`js/main.js`): o A-Frame 1.4.2 forçava este valor; no 1.8.x fica `true`, o que desenha as obras antes da máscara do portal e as faz falhar o teste de stencil
- A ordem de desenho depende dos `renderOrder`: máscara (1) → esfera 360º (2) → moldura (3)
- A dimensão atual usa `THREE.NotEqualStencilFunc`, a seguinte `THREE.EqualStencilFunc` e as restantes `THREE.NeverStencilFunc` (`aplicarEstado`)
- A máscara do quadro (`stencilFunc: Always`, `stencilZPass: Replace`) é quem escreve o stencil; é ela que faz a janela funcionar

#### Caixa de colisão e caixa de debug

A caixa é declarada no atributo do portal (`js/main.js`, schema do componente) e é a **única** fonte da sua geometria — a caixa de debug é construída com exatamente os mesmos valores, pelo que nunca pode divergir:

| Atributo | Significado | Omissão |
| --- | --- | --- |
| `caixa` | Tamanho X, Y, Z | `12 16 1` |
| `caixaPosicao` | Centro da caixa (espaço do portal) | `0 8 0` |
| `caixaRotacao` | Rotação da caixa, em graus | `0 0 0` |
| `gatilho` | Onde a travessia dispara: `plano` (plano central da caixa) ou `caixa` (face de entrada) | `plano` |
| `dimensoes` | Dimensões que este portal percorre, por ordem | `0, 1` |

Exemplo: `portal-estencil-dinamico="src: #cidade-360; caixa: 12 16 1; caixaPosicao: 0 8 0;"`

**Porquê `plano` por omissão:** a máscara do quadro só escreve o stencil quando está à frente da câmara, ou seja, o quadro só é uma janela de um dos lados. A troca de dimensão tem de acontecer no plano do quadro, que é o plano central da caixa — é o único ponto em que a troca não se nota. Com `gatilho: caixa` (face de entrada, meia espessura antes do quadro) fica-se ~0,55 m com a dimensão errada durante a travessia, com a caixa por omissão.

#### Escalar para outras dimensões

As dimensões vivem em `window.dimensoes` (`js/main.js`): cada índice é uma dimensão e guarda os materiais que lhe pertencem.

- `dimensoes[0]` é o mundo real (não desenha nada)
- `dimensoes[1]` é a dimensão do projeto (esfera 360º + obras), governada pelo portal que declara `dimensoes: 0, 1`
- Cada obra declara a sua dimensão com `material-virtual="dimensao: 1"` (omissão `1`)

Registar materiais num índice novo cria uma dimensão nova. Para um portal a percorrer mais do que duas, basta acrescentá-las à lista dele: `dimensoes: 0, 1, 2` — atravessar cicla 0 → 1 → 2 → 0, com o quadro a mostrar sempre a dimensão seguinte (cada dimensão a mais precisa do seu próprio conteúdo).

#### Vários portais (um bit de stencil por portal)

Cada portal ocupa um **bit do stencil** (`window.portais`, `reservarBit`): escreve a máscara do seu quadro e testa os materiais das suas dimensões só com esse bit. Assim a janela de um portal não se mistura com a dos outros, e portais diferentes podem estar em dimensões diferentes ao mesmo tempo.

- Um portal percorre as dimensões que declara: `dimensoes: 0, 1` (mundo real ↔ dimensão 1) ou, por exemplo, `dimensoes: 0, 2` para outro portal
- A esfera 360º do portal é registada na **segunda** dimensão da lista, que é a que ele dá acesso
- O portal só mexe nos materiais das dimensões que governa; cada material fica marcado com o bit desse portal (`stencilRef` e `stencilFuncMask`)

Exemplo com dois portais independentes:

```html
<a-entity position="0 0 -5"  portal-estencil-dinamico="src: #cidade-360; dimensoes: 0, 1"></a-entity>
<a-entity position="0 0 -30" portal-estencil-dinamico="src: #praia;       dimensoes: 0, 2"></a-entity>
```

Limites desta abordagem (o stencil tem 8 bits, logo até 8 portais):

- **Um material pertence a um só portal**: a dimensão que o portal A governa não pode ser governada pelo portal B (um material só testa um bit). Se dois portais partilharem a mesma dimensão, o último a aplicar o estado ganha.
- **Fundos 360º sobrepostos**: cada portal tem a sua esfera de raio 100. Se dois portais estiverem visíveis ao mesmo tempo e ambos desenharem o fundo, ganha o que for desenhado por último (a ordem depende dos `renderOrder`). Numa cena com vários portais convém ajustar o `renderOrder` de cada fundo ou dar a cada dimensão a sua própria geometria.
- **Até 8 portais**: o stencil tem 8 bits. Um 9.º portal avisa na consola e reutiliza o bit 1, o que estraga o 1.º portal.
- **Dimensão sem portal fica escondida**: conteúdo registado com `material-virtual="dimensao: N"` numa dimensão que nenhum portal declara em `dimensoes` fica invisível (e a consola avisa), em vez de aparecer em todas as dimensões.

#### Obras: clique só na dimensão atual

O estêncil esconde a obra, mas o raycaster do A-Frame continua a apanhá-la (não vê o stencil nem `object3D.visible`). Por isso o `abrir-modal` só abre se a dimensão da obra for a **dimensão atual** do portal (`NotEqualStencilFunc`): vê-la pela janela, de fora, não chega — é preciso estar dentro da dimensão.

### Recursos Recentes

- **Janela entre Dimensões**: o quadro vermelho mostra a dimensão atual por fora e a seguinte por dentro, nos dois sentidos
- **Travessia por Colisão com a Caixa**: sem debounce, sem cooldown e sem distância; calculada no espaço do portal, por isso funciona com portais deslocados, rodados e em movimento
- **Um Bit de Stencil por Portal**: portais independentes, cada um com a sua janela e as suas dimensões (`dimensoes`); até 8 portais
- **Fundo por Portal com Vídeo**: o `src` do portal aceita vídeo (usado como `VideoTexture`), por exemplo a imagem da câmara
- **Obras só na Dimensão Atual**: clicar numa obra doutra dimensão já não abre o modal
- **Dimensão sem Portal Fica Escondida**: com aviso na consola, em vez de aparecer em todas as dimensões
- **Caixa de Debug Igual à Real**: a caixa de debug é desenhada com a mesma dimensão, posição e rotação da caixa de colisão
- **Sem Barreiras Invisíveis**: Removido sistema antigo de limites que causava colisões fantasmas

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

- Pressione a tecla **R** para girar o portal 180 graus e alternar entre os lados
- Pressione a tecla **D** para ativar/desativar o modo debug (mostra a área do portal)
- O lado frontal mostra a dimensão com imagem panorâmica e moldura vermelha
- O lado traseiro é transparente com apenas um retângulo vermelho visível

### Funcionamento do Portal

A travessia é detetada pela colisão com a caixa, sempre dentro dela (`js/main.js`, `tick`):

- **Estado 1 (mundo real)**: fora do quadro vê-se a câmara; dentro do quadro vê-se a dimensão do portal (`Equal`)
- **Estado 2 (portal)**: fora do quadro vê-se a dimensão do portal; dentro do quadro vê-se a câmara (`NotEqual`)
- **Sem piscas**: a troca de estado acontece no plano central da caixa, exatamente onde a máscara do quadro muda de lado, por isso não há frames com a dimensão errada (com `gatilho: caixa` há, ver acima)

### 7. Modo Debug

Durante o desenvolvimento, você pode ativar o modo debug para visualizar a caixa de colisão do portal:

- A caixa de debug aparece como um wireframe azul semi-transparente
- Tem sempre as mesmas dimensões X, Y e Z, posição e rotação que a caixa de colisão (`caixa`, `caixaPosicao` e `caixaRotacao`)
- Serve para ver exatamente onde o interruptor dispara
- Logs de debug mostram apenas informações relevantes quando a dimensão muda (`>>> PORTAL: DIMENSÃO 2 DE 2 <<<`)

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
