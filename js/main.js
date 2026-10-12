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
window.materiaisVirtuais = [];

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

// --- OBRAS SUJEITAS AO ESTÊNCIL ---
AFRAME.registerComponent('material-virtual', {
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
        if (!window.materiaisVirtuais.includes(mat)) window.materiaisVirtuais.push(mat);
      }
    });
  }
});

// --- CONFIGURAÇÃO DE NAVEGAÇÃO ---
// Fonte única destes valores: para alterar os limites, muda aqui.
// Cada valor pode também ser sobreposto por atributo no HTML, por exemplo:
// <a-camera limite-movimento="maxX: 60; minX: -60">
const CONFIG_NAVEGACAO = {
  portalZ: -5,          // posição Z do portal
  minX: -20,            // limite lateral esquerdo
  maxX: 20,             // limite lateral direito
  minZ: -80,            // profundidade máxima permitida
  tempoTrava: 10000,    // bloqueio após sair do portal (ms)
  entradaOffset: -1,    // portalZ + isto = z a partir do qual passa a "dentro"
  saidaOffset: 1.5,     // portalZ + isto = z a partir do qual passa a "saiu"
  barreiraOffset: 0.5   // portalZ + isto = z da barreira enquanto está "saiu"
};

// --- MÁQUINA DE ESTADOS (TRAVA 10s) ---
AFRAME.registerComponent('limite-movimento', {
  schema: {
    portalZ: { default: CONFIG_NAVEGACAO.portalZ },
    minX: { default: CONFIG_NAVEGACAO.minX },
    maxX: { default: CONFIG_NAVEGACAO.maxX },
    minZ: { default: CONFIG_NAVEGACAO.minZ },
    tempoTrava: { default: CONFIG_NAVEGACAO.tempoTrava },
    entradaOffset: { default: CONFIG_NAVEGACAO.entradaOffset },
    saidaOffset: { default: CONFIG_NAVEGACAO.saidaOffset },
    barreiraOffset: { default: CONFIG_NAVEGACAO.barreiraOffset }
  },
  init: function () { this.estado = 'inicio'; },
  tick: function () {
    let pos = this.el.object3D.position;
    let zPortal = this.data.portalZ;
    
    if (this.estado === 'inicio' && pos.z < (zPortal + this.data.entradaOffset)) {
      this.estado = 'dentro';
    }
    if (this.estado === 'dentro' && pos.z > (zPortal + this.data.saidaOffset)) {
      this.estado = 'saiu';
      setTimeout(() => { if (this.estado === 'saiu') this.estado = 'inicio'; }, this.data.tempoTrava);
    }

    if (pos.x < this.data.minX) pos.x = this.data.minX;
    if (pos.x > this.data.maxX) pos.x = this.data.maxX;
    
    if (this.estado === 'saiu') {
       let barreiraSegura = zPortal + this.data.barreiraOffset;
       if (pos.z < barreiraSegura) pos.z = barreiraSegura;
    } else {
       if (pos.z < this.data.minZ) pos.z = this.data.minZ;
    }
  }
});

// --- PORTAL ESTÊNCIL PERFEITO ---
AFRAME.registerComponent('portal-estencil-dinamico', {
  schema: { src: { type: 'selector' }, width: { default: 12.0 }, height: { default: 16.0 } },
  init: function () {
    let el = this.el; let w = this.data.width; let h = this.data.height;
    // Criar um grupo para o portal que pode ser rotacionado manualmente
    this.portalGroup = new THREE.Group();
    el.setObject3D('portal-mesh', this.portalGroup);

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

    // Criar o lado traseiro do portal (transparente com retângulo vermelho)
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
    
    // Criar o retângulo vermelho no lado traseiro
    let redRectGeo = new THREE.BoxGeometry(w - 2, h - 2, 0.1);
    let redRectMat = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    let redRect = new THREE.Mesh(redRectGeo, redRectMat);
    redRect.position.set(0, h/2, -0.05); // Um pouco atrás do plano
    backGroup.add(redRect);
    
    // Posicionar o lado traseiro (virado para trás)
    backGroup.position.set(0, 0, 0);
    backGroup.rotation.y = Math.PI; // Rotacionar 180 graus para ficar na parte de trás
    this.portalGroup.add(backGroup);
    
    // Criar caixa de debug (wireframe) para visualizar a bounding box de colisão
    // Visível apenas durante desenvolvimento/debug
    let debugMode = false; // Mudar para true para ativar debug
    if (debugMode) {
      let portalDepth = 0.1;
      let debugBoxGeo = new THREE.BoxGeometry(w, h, portalDepth);
      let debugBoxMat = new THREE.MeshBasicMaterial({ 
        color: 0x00FF00, 
        wireframe: true,
        transparent: true,
        opacity: 0.5
      });
      let debugBox = new THREE.Mesh(debugBoxGeo, debugBoxMat);
      debugBox.position.set(0, h/2, 0);
      debugBox.renderOrder = 10; // Renderizar por cima de outros elementos
      this.portalGroup.add(debugBox);
    }
    
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
  
  // Função para alternar modo debug
  toggleDebugMode: function() {
    // Remover caixa de debug existente se houver
    if (this.debugBox) {
      this.portalGroup.remove(this.debugBox);
      this.debugBox = null;
      return;
    }
    
    // Criar nova caixa de debug mais visível com profundidade 3D
    let w = this.data.width || 12.0;
    let h = this.data.height || 16.0;
    let portalDepth = 1.0; // Profundidade 3D realista
    
    // Criar wireframe azul mais proeminente
    let debugBoxGeo = new THREE.BoxGeometry(w, h, portalDepth);
    let debugBoxMat = new THREE.MeshBasicMaterial({ 
      color: 0x0000FF, // Azul
      wireframe: true,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide
    });
    this.debugBox = new THREE.Mesh(debugBoxGeo, debugBoxMat);
    this.debugBox.position.set(0, h/2, 0);
    this.debugBox.renderOrder = 10; // Renderizar por cima de outros elementos
    this.portalGroup.add(this.debugBox);
  },
  tick: function() {
      let cam = document.querySelector('a-camera');
      if (!cam || !this.sphereMat) return;
      
      // Obter posições da câmera e do portal
      let camPos = cam.object3D.position;
      let portalPos = this.el.object3D.position;
      
      // Dimensões do portal (agora com profundidade mais realista)
      let portalWidth = this.data.width || 12.0;
      let portalHeight = this.data.height || 16.0;
      let portalDepth = 1.0; // Profundidade realista para detecção 3D (1 metro)
      
      // Calcular limites da bounding box 3D do portal
      let portalLeft = portalPos.x - (portalWidth / 2);
      let portalRight = portalPos.x + (portalWidth / 2);
      let portalBottom = portalPos.y;
      let portalTop = portalPos.y + portalHeight;
      let portalFront = portalPos.z - (portalDepth / 2);
      let portalBack = portalPos.z + (portalDepth / 2);
      
      // Verificar colisão 3D entre câmera e bounding box do portal
      // A câmera é tratada como um ponto para simplificação
      let isCameraInPortalBounds = (
          camPos.x >= portalLeft && camPos.x <= portalRight &&
          camPos.y >= portalBottom && camPos.y <= portalTop &&
          camPos.z >= portalFront && camPos.z <= portalBack
      );
      
      // Console.log para debug (pode ser removido)
      // console.log(`Camera: (${camPos.x.toFixed(2)}, ${camPos.y.toFixed(2)}, ${camPos.z.toFixed(2)})`);
      // console.log(`Portal bounds: X[${portalLeft.toFixed(2)}, ${portalRight.toFixed(2)}], Y[${portalBottom.toFixed(2)}, ${portalTop.toFixed(2)}], Z[${portalFront.toFixed(2)}, ${portalBack.toFixed(2)}]`);
      // console.log(`Inside portal: ${isCameraInPortalBounds}`);
      
      // Determinar a função stencil com base na colisão 3D
      let func;
      if (isCameraInPortalBounds) {
          // Se a câmera está dentro da bounding box do portal, mostrar a dimensão do portal
          func = THREE.EqualStencilFunc;
      } else {
          // Se a câmera não está dentro da bounding box do portal, mostrar a câmera real
          func = THREE.NotEqualStencilFunc;
      }
      
      this.sphereMat.stencilFunc = func;
      
      if (window.materiaisVirtuais) {
          window.materiaisVirtuais.forEach(mat => mat.stencilFunc = func);
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