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

O portal é uma "janela entre duas dimensões": o quadro vermelho troca o que se vê dentro e fora dele, conforme a posição da câmera em relação ao portal. O portal funciona como um interruptor que muda o estado quando atravessado.

| Posição | Fundo do ecrã | Dentro do quadro vermelho |
| --- | --- | --- |
| **Fora** do portal | Câmera (realidade) | Dimensão do portal (imagem 360º) + obras |
| **Dentro** do portal | Dimensão do portal (imagem 360º) | Câmera (realidade) |

Atravessar o portal é mudar de dimensão; as obras ficam acessíveis na dimensão interior.

Requisitos técnicos (não remover, o portal deixa de funcionar):

- `renderer="...; stencil: true"` no `<a-scene>`: a partir do three r184 o buffer de stencil **não é criado por omissão**, e sem ele o portal desenha tudo em todo o lado (perde-se a troca de dimensões)
- `renderer.sortObjects = false` em `config-ar` (`js/main.js`): o A-Frame 1.4.2 forçava este valor; no 1.8.x fica `true`, o que desenha as obras antes da máscara do portal e as faz falhar o teste de stencil
- A ordem de desenho depende dos `renderOrder`: máscara (1) → esfera 360º (2) → moldura (3)

### Recursos Recentes

- **Sistema de Detecção 3D**: Implementado sistema de bounding box 3D para detecção precisa de colisão
- **Interruptor Inteligente**: Portal funciona como interruptor que muda estado ao ser atravessado
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
- Limites e tempos ficam em `CONFIG_NAVEGACAO` (`js/main.js`), num único sítio, e podem ser sobrepostos por atributo: `limite-movimento="maxX: 60; minX: -60"` **(COMPONENTE DESATIVADO)**

**Nota**: O sistema antigo de limitação de movimento foi removido para evitar barreiras invisíveis que impediam a navegação fluida. O portal agora funciona com detecção 3D precisa sem restrições artificiais.

### 5. Feedback de Carregamento / Erro de Câmera

- Aviso em faixa no topo do ecrã, que **não cobre** a cena 3D (o portal mantém-se sempre visível)
- Mostra "Carregando..." ao iniciar e, se a câmera não estiver acessível, a mensagem de permissões

### 6. Controles do Portal

- Pressione a tecla **R** para girar o portal 180 graus e alternar entre os lados
- Pressione a tecla **D** para ativar/desativar o modo debug (mostra bounding box de colisão)
- O lado frontal mostra a dimensão com imagem panorâmica e moldura vermelha
- O lado traseiro é transparente com apenas um retângulo vermelho visível

### Funcionamento do Portal

O portal agora funciona como um interruptor inteligente:

- **Atravessar o portal**: Muda o estado da dimensão (uma única vez)
- **Permanecer na nova dimensão**: Até decidir voltar atravessando novamente
- **Sem oscilações**: Sistema estável com cooldown de 500ms entre transições

### 7. Modo Debug

Durante o desenvolvimento, você pode ativar o modo debug para visualizar a bounding box de colisão do portal:

- A caixa de debug aparece como um wireframe azul semi-transparente (1 metro de profundidade)
- Ela mostra exatamente onde o sistema detecta colisões com o portal
- Útil para verificar se a detecção de colisão está funcionando corretamente
- Logs de debug mostram apenas informações relevantes quando o estado muda

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
