// --- LÓGICA DO MODAL (JANELA SOBREPOSTA) ---
function fecharObra() {
  document.getElementById('modal-obra').style.display = 'none';
  document.getElementById('iframe-obra').src = "";
}

AFRAME.registerComponent('abrir-modal', {
  schema: { url: { type: 'string' } },
  init: function () {
    this.el.addEventListener('click', () => {
      document.getElementById('iframe-obra').src = this.data.url;
      document.getElementById('modal-obra').style.display = 'flex';
    });
  }
});

// --- CONFIGURAÇÃO GLOBAL ---
// Dimensões do portal: dimensoes[m] guarda os materiais da dimensão m.
// O índice 0 é o mundo real (nada 3D é desenhado, vê-se a câmara por baixo do
// canvas transparente) e o índice 1 é a dimensão do portal (esfera 360º + obras).
// Registar materiais num índice novo cria uma dimensão nova, e o interruptor do
// portal passa a percorrer todas (ver aplicarEstado/tick).
window.dimensoes = [];

// Regista um material numa dimensão e aplica logo o estado atual do portal, para
// uma obra registada mais tarde nunca aparecer na dimensão errada.
function registarNaDimensao(dimensao, material) {
  if (!window.dimensoes[dimensao]) window.dimensoes[dimensao] = [];
  if (!window.dimensoes[dimensao].includes(material)) window.dimensoes[dimensao].push(material);
  let portalEl = document.querySelector('[portal-estencil-dinamico]');
  let portal = portalEl && portalEl.components['portal-estencil-dinamico'];
  if (portal) portal.aplicarEstado();
}

AFRAME.registerComponent('config-ar', {
  init: function () {
    this.el.setAttribute('embedded', '');
    // O renderer já existe neste ponto (a-scene cria-o em connectedCallback).
    this.aplicarConfigRenderer();
    this.el.addEventListener('render-target-loaded', () => this.aplicarConfigRenderer());
  },
  aplicarConfigRenderer: function () {
    let renderer = this.el.renderer;
    if (!renderer) return;
    renderer.setClearColor(0x000000, 0);
    // O A-Frame 1.4.2 forçava sortObjects = false. No 1.8.x fica o default do
    // three (true), o que reordena o desenho e faz as obras serem desenhadas
    // antes da máscara do portal, falhando o teste de stencil. Repomos o
    // comportamento original. O buffer de stencil é pedido no atributo
    // renderer="stencil: true" do index.html.
    renderer.sortObjects = false;
  }
});

AFRAME.registerComponent('cursor-listener', {
  init: function () {
    // Adiciona classe para raycaster funcionar corretamente
    this.el.setAttribute('class', 'interactable');
  }
});

// --- OBRAS SUJEITAS AO ESTADO DO PORTAL ---
AFRAME.registerComponent('material-virtual', {
  // Dimensão a que a obra pertence (0 = mundo real, 1 = dimensão do portal).
  schema: { dimensao: { default: 1 } },
  init: function () {
    this.el.addEventListener('loaded', () => this.applyStencil());
    if (this.el.getObject3D('mesh')) this.applyStencil();
  },
  applyStencil: function() {
    let mesh = this.el.getObject3D('mesh');
    if (!mesh) return;
    mesh.traverse((node) => {
      if (node.isMesh && node.material) {
        let mat = node.material;
        mat.stencilWrite = true;
        mat.stencilRef = 1;
        mat.stencilWriteMask = 0xFF;
        mat.stencilFuncMask = 0xFF;
        mat.stencilFail = THREE.KeepStencilOp;
        mat.stencilZFail = THREE.KeepStencilOp;
        mat.stencilZPass = THREE.KeepStencilOp;
        registarNaDimensao(this.data.dimensao, mat);
      }
    });
  }
});

// Temporários reutilizados no tick do portal (evita alocar por frame).
const _pontoMundo = new THREE.Vector3();
const _pontoCaixa = new THREE.Vector3();

// --- PORTAL ESTÊNCIL PERFEITO ---
AFRAME.registerComponent('portal-estencil-dinamico', {
  schema: {
    src: { type: 'selector' },
    width: { default: 12.0 },
    height: { default: 16.0 },
    // Caixa de colisão (X, Y, Z), centro e rotação (em graus), no espaço do portal.
    // É a única fonte da caixa: a caixa de debug é desenhada com estes mesmos
    // valores, pelo que as duas têm sempre a mesma dimensão, posição e rotação.
    caixa: { type: 'vec3', default: { x: 12.0, y: 16.0, z: 1.0 } },
    caixaPosicao: { type: 'vec3', default: { x: 0.0, y: 8.0, z: 0.0 } },
    caixaRotacao: { type: 'vec3', default: { x: 0.0, y: 0.0, z: 0.0 } },
    // Onde a travessia é detetada, sempre dentro da caixa:
    //  - 'plano': no plano central da caixa, que é onde a máscara do quadro muda
    //    de lado — a troca de dimensão não se nota;
    //  - 'caixa': na face de entrada da caixa, que fica antes do quadro — a troca
    //    acontece antes do quadro e vê-se a dimensão errada até o atravessar.
    gatilho: { type: 'string', default: 'plano', oneOf: ['plano', 'caixa'] }
  },
  init: function () {
    let el = this.el; let w = this.data.width; let h = this.data.height;
    // Criar um grupo para o portal que pode ser rotacionado manualmente
    this.portalGroup = new THREE.Group();
    el.setObject3D('portal-mesh', this.portalGroup);

    // Interruptor de dimensões: o estado avança quando a câmara atravessa a caixa
    // de colisão (ver o tick). Tudo é calculado no espaço do portal, por isso
    // segue o portal mesmo que este se mova ou rode.
    this.estadoAtual = 0;
    this.dimensoes = window.dimensoes;
    this.dentroDaCaixa = false;   // colisão no frame anterior
    this.sinalZ = 1;              // de que lado do plano central a câmara estava
    this.travessiaIniciada = false;

    // Caixa de colisão, no espaço do portal. Os mesmos valores alimentam a caixa
    // de debug (ver configurarCaixa/criarCaixaDebug).
    this.configurarCaixa();

    // Criar o lado frontal do portal (dimensão)
    let frontGroup = new THREE.Group();
    
    let maskGeo = new THREE.PlaneGeometry(w, h, 32, 32);
    let maskMat = new THREE.MeshBasicMaterial({
      colorWrite: false, depthWrite: false, side: THREE.DoubleSide,
      stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, stencilRef: 1,
      stencilWriteMask: 0xFF, stencilFuncMask: 0xFF,
      stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.ReplaceStencilOp
    });

    let maskMesh = new THREE.Mesh(maskGeo, maskMat);
    maskMesh.position.set(0, h/2, 0); maskMesh.renderOrder = 1; frontGroup.add(maskMesh);

    let imgEl = this.data.src;
    if (!imgEl) imgEl = document.querySelector('#cidade-360'); 
    let texture = new THREE.Texture(imgEl);
    texture.minFilter = THREE.LinearFilter; texture.generateMipmaps = false;
    if (imgEl && imgEl.complete) { texture.needsUpdate = true; } 
    else if (imgEl) { imgEl.onload = () => { texture.needsUpdate = true; }; }

    let sphereGeo = new THREE.SphereGeometry(100, 64, 64);
    this.sphereMat = new THREE.MeshBasicMaterial({ 
      map: texture, side: THREE.BackSide, depthWrite: false,
      stencilWrite: true, stencilRef: 1, stencilWriteMask: 0xFF, stencilFuncMask: 0xFF,
      stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp
    });
    
    let sphere = new THREE.Mesh(sphereGeo, this.sphereMat);
    sphere.position.set(0, h/2, 0); sphere.renderOrder = 2; 
    sphere.frustumCulled = false; frontGroup.add(sphere);

    // A esfera 360º é o conteúdo da dimensão do portal (índice 1).
    registarNaDimensao(1, this.sphereMat);
    this.aplicarEstado();

    let molduraMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    let esp = 0.3; let halfW = w / 2; let halfH = h / 2;
    
    let leftF  = new THREE.Mesh(new THREE.BoxGeometry(esp, h, 0.2), molduraMat); leftF.position.set(-halfW - esp/2, halfH, 0);
    let rightF = new THREE.Mesh(new THREE.BoxGeometry(esp, h, 0.2), molduraMat); rightF.position.set( halfW + esp/2, halfH, 0);
    let topF   = new THREE.Mesh(new THREE.BoxGeometry(w + 2*esp, esp, 0.2), molduraMat); topF.position.set(0, h + esp/2, 0);
    let bottomF= new THREE.Mesh(new THREE.BoxGeometry(w + 2*esp, esp, 0.2), molduraMat); bottomF.position.set(0, -esp/2, 0);

    let frameGroup = new THREE.Group();
    frameGroup.add(leftF, rightF, topF, bottomF);
    frameGroup.children.forEach(c => { c.renderOrder = 3; });
    frontGroup.add(frameGroup);
    
    // Posicionar o lado frontal
    frontGroup.position.set(0, 0, 0);
    this.portalGroup.add(frontGroup);

    // Criar o lado traseiro do portal (apenas transparente)
    let backGroup = new THREE.Group();
    
    // Criar um plano transparente para o lado traseiro
    let backPlaneGeo = new THREE.PlaneGeometry(w, h);
    let backPlaneMat = new THREE.MeshBasicMaterial({ 
      color: 0x000000, 
      transparent: true, 
      opacity: 0.0,  // Totalmente transparente
      side: THREE.DoubleSide 
    });
    let backPlane = new THREE.Mesh(backPlaneGeo, backPlaneMat);
    backPlane.position.set(0, h/2, 0);
    backGroup.add(backPlane);
    
    // Posicionar o lado traseiro (virado para trás)
    backGroup.position.set(0, 0, 0);
    backGroup.rotation.y = Math.PI; // Rotacionar 180 graus para ficar na parte de trás
    this.portalGroup.add(backGroup);
    
    // Inicializar o ângulo de rotação
    this.portalGroup.rotation.y = 0; // Começa com o lado frontal visível
    
    // Adicionar controles para girar o portal manualmente
    document.addEventListener('keydown', (event) => {
      if (event.key === 'r' || event.key === 'R') {
        // Girar 180 graus quando pressionar 'R'
        this.portalGroup.rotation.y += Math.PI;
      }
      // Tecla 'd' para alternar modo debug
      if (event.key === 'd' || event.key === 'D') {
        this.toggleDebugMode();
      }
    });
  },
  
  // O A-Frame chama isto sempre que o atributo muda (também logo após o init).
  update: function() {
    this.configurarCaixa();
  },

  // Lê a caixa de colisão do atributo. É o único sítio onde a caixa é montada, de
  // modo que a colisão e a caixa de debug nunca podem divergir.
  configurarCaixa: function() {
    let caixa = this.data.caixa;
    let pos = this.data.caixaPosicao;
    let rot = this.data.caixaRotacao;

    this.caixaMeio = new THREE.Vector3(caixa.x / 2, caixa.y / 2, caixa.z / 2);
    this.caixaCentro = new THREE.Vector3(pos.x, pos.y, pos.z);
    this.caixaRotacaoInversa = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(rot.x),
      THREE.MathUtils.degToRad(rot.y),
      THREE.MathUtils.degToRad(rot.z)
    )).invert();

    // Se a caixa de debug estiver visível, é refeita com os novos valores.
    if (this.debugBox) {
      this.portalGroup.remove(this.debugBox);
      this.debugBox = null;
      this.criarCaixaDebug();
    }
  },

  // Função para alternar modo debug
  toggleDebugMode: function() {
    if (this.debugBox) {
      this.portalGroup.remove(this.debugBox);
      this.debugBox = null;
      return;
    }
    this.criarCaixaDebug();
  },

  // Caixa de debug: mesma dimensão X, Y, Z, posição e rotação da caixa de colisão.
  criarCaixaDebug: function() {
    let caixa = this.data.caixa;
    let pos = this.data.caixaPosicao;
    let rot = this.data.caixaRotacao;

    let debugBoxGeo = new THREE.BoxGeometry(caixa.x, caixa.y, caixa.z);
    let debugBoxMat = new THREE.MeshBasicMaterial({
      color: 0x0000FF, // Azul
      wireframe: true,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide
    });
    this.debugBox = new THREE.Mesh(debugBoxGeo, debugBoxMat);
    this.debugBox.position.set(pos.x, pos.y, pos.z);
    this.debugBox.rotation.set(
      THREE.MathUtils.degToRad(rot.x),
      THREE.MathUtils.degToRad(rot.y),
      THREE.MathUtils.degToRad(rot.z)
    );
    this.debugBox.renderOrder = 10; // Renderizar por cima de outros elementos
    this.portalGroup.add(this.debugBox);
  },

  // Fora do quadro desenha-se a dimensão atual; dentro do quadro desenha-se a
  // dimensão seguinte — é a "janela" entre dimensões. A máscara só escreve o
  // stencil quando está à frente da câmara, por isso o lado do plano decide o que
  // o quadro mostra, e nada disto depende da posição no código.
  // Escalável: com N dimensões registadas o quadro mostra sempre a seguinte.
  aplicarEstado: function() {
      let atual = this.estadoAtual;
      let seguinte = (atual + 1) % window.dimensoes.length;
      window.dimensoes.forEach((materiais, dimensao) => {
          let func = dimensao === atual ? THREE.NotEqualStencilFunc
                   : dimensao === seguinte ? THREE.EqualStencilFunc
                   : THREE.NeverStencilFunc;
          materiais.forEach(mat => { mat.stencilFunc = func; });
      });
  },

  tick: function() {
      let cam = document.querySelector('a-camera');
      if (!cam || !this.sphereMat) return;

      // Colisão com a caixa do portal, no espaço do portal (posição e rotação da
      // caixa incluídas). A caixa de debug é desenhada com a mesma configuração.
      this.portalGroup.updateWorldMatrix(true, false);
      cam.object3D.getWorldPosition(_pontoMundo);
      _pontoCaixa.copy(_pontoMundo);
      this.portalGroup.worldToLocal(_pontoCaixa);
      _pontoCaixa.sub(this.caixaCentro).applyQuaternion(this.caixaRotacaoInversa);

      let dentroDaCaixa = (
          Math.abs(_pontoCaixa.x) <= this.caixaMeio.x &&
          Math.abs(_pontoCaixa.y) <= this.caixaMeio.y &&
          Math.abs(_pontoCaixa.z) <= this.caixaMeio.z
      );

      // Travessia detetada pela colisão com a caixa, no espaço do portal: não há
      // nenhuma distância global nem posição fixa, por isso funciona com o portal
      // em movimento e com vários portais.
      if (!this.travessiaIniciada) {
          // Primeiro tick: alinha o estado com o lado onde a câmara está, sem
          // contar como travessia.
          this.travessiaIniciada = true;
          this.dentroDaCaixa = dentroDaCaixa;
          this.sinalZ = _pontoCaixa.z < 0 ? -1 : 1;
          this.estadoAtual = this.sinalZ < 0 ? 1 : 0;
          this.aplicarEstado();
          return;
      }

      let sinalZ = _pontoCaixa.z < 0 ? -1 : 1;
      let atravessou;
      if (this.data.gatilho === 'caixa') {
          // Entrada na caixa (fora -> dentro).
          atravessou = dentroDaCaixa && !this.dentroDaCaixa;
      } else {
          // Travessia do plano central da caixa, contando só dentro dela.
          atravessou = dentroDaCaixa && sinalZ !== this.sinalZ;
      }
      this.dentroDaCaixa = dentroDaCaixa;
      this.sinalZ = sinalZ;

      if (atravessou) {
          this.estadoAtual = (this.estadoAtual + 1) % this.dimensoes.length;
          this.aplicarEstado();
          console.log(`>>> PORTAL: DIMENSÃO ${this.estadoAtual + 1} DE ${this.dimensoes.length} <<<`);
      }
  }
});

// --- LÓGICA DE MOVIMENTAÇÃO MOBILE ---
let estadosMovimento = { frente: false, tras: false, esq: false, dir: false };
const VELOCIDADE = 0.1;

function atualizarMovimentoMobile() {
  let cam = document.querySelector('a-camera');
  if (cam) {
    // Obtém o ângulo atual para o qual o utilizador está a olhar
    let angle = cam.object3D.rotation.y;
    
    if (estadosMovimento.frente) {
      cam.object3D.position.x -= Math.sin(angle) * VELOCIDADE;
      cam.object3D.position.z -= Math.cos(angle) * VELOCIDADE;
    }
    if (estadosMovimento.tras) {
      cam.object3D.position.x += Math.sin(angle) * VELOCIDADE;
      cam.object3D.position.z += Math.cos(angle) * VELOCIDADE;
    }
    if (estadosMovimento.esq) {
      cam.object3D.position.x -= Math.cos(angle) * VELOCIDADE;
      cam.object3D.position.z += Math.sin(angle) * VELOCIDADE;
    }
    if (estadosMovimento.dir) {
      cam.object3D.position.x += Math.cos(angle) * VELOCIDADE;
      cam.object3D.position.z -= Math.sin(angle) * VELOCIDADE;
    }
  }
  requestAnimationFrame(atualizarMovimentoMobile);
}

// Regista os eventos táteis nos botões
function configurarBotoesMobile() {
  const associarBotao = (id, direcao) => {
    let btn = document.getElementById(id);
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); estadosMovimento[direcao] = true; });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); estadosMovimento[direcao] = false; });
    btn.addEventListener('mousedown', (e) => { estadosMovimento[direcao] = true; });
    btn.addEventListener('mouseup', (e) => { estadosMovimento[direcao] = false; });
    btn.addEventListener('mouseleave', (e) => { estadosMovimento[direcao] = false; });
  };

  associarBotao('btn-frente', 'frente');
  associarBotao('btn-tras', 'tras');
  associarBotao('btn-esq', 'esq');
  associarBotao('btn-dir', 'dir');
  
  atualizarMovimentoMobile();
}

// Função para mostrar indicador de carregamento
function mostrarLoading() {
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.id = 'loading-overlay';
  loadingOverlay.innerHTML = 'Carregando...';
  loadingOverlay.style.display = 'flex';
  document.body.appendChild(loadingOverlay);
}

// Função para esconder indicador de carregamento
function esconderLoading() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
}

// Função para tratar erros de acesso à câmera
function tratarErroCamera(error) {
  console.error('Erro ao acessar a câmera:', error);
  esconderLoading();
  
  // Mostrar mensagem de erro ao usuário
  const errorMsg = document.createElement('div');
  errorMsg.className = 'loading-overlay';
  errorMsg.innerHTML = 'Não foi possível acessar a câmera. Por favor, verifique as permissões.';
  errorMsg.style.display = 'flex';
  document.body.appendChild(errorMsg);
  
  // Esconder botão de início
  document.getElementById('btn-iniciar').style.display = 'none';
}