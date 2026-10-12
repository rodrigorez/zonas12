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
    // Criar um grupo para o portal que irá rotacionar
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
    backPlane.rotation.y = Math.PI; // Rotacionar para ficar na parte de trás
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
    
    // Inicializar o ângulo de rotação
    this.rotationAngle = 0;
  },
  tick: function(time, timeDelta) {
    let cam = document.querySelector('a-camera');
    if (!cam || !this.sphereMat) return;
    let camZ = cam.object3D.position.z;
    let portalZ = this.el.object3D.position.z; 
    
    let func = (camZ > portalZ) ? THREE.EqualStencilFunc : THREE.NotEqualStencilFunc;
    this.sphereMat.stencilFunc = func;
    
    if (window.materiaisVirtuais) {
        window.materiaisVirtuais.forEach(mat => mat.stencilFunc = func);
    }
    
    // Rotacionar o portal continuamente
    this.rotationAngle += timeDelta / 1000; // Converter para segundos
    this.portalGroup.rotation.y = this.rotationAngle;
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