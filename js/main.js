// --- LÓGICA DO MODAL (JANELA SOBREPOSTA) ---
function fecharObra() {
  document.getElementById('modal-obra').style.display = 'none';
  document.getElementById('iframe-obra').src = "";
}

// --- LIMITES E ESTADO GLOBAL ---
// Cada dimensão e cada portal têm um ID próprio, e esse ID aparece em tudo o que
// lhes pertence: atributos (dimensao-a/dimensao-b/portal-id), `data-dimensao`,
// `data-portal-id`, classes (`dimensao-7`, `portal-3`) e nomes dos objetos 3D.
// Os limites são só de organização; o único recurso físico é o stencil (8 bits),
// que permite 255 janelas abertas ao mesmo tempo.
const LIMITE_DIMENSOES = 512;
const LIMITE_PORTAIS = 512;
const LIMITE_JANELAS = 255;

window.portalAR = {
  // Onde o utilizador está. É a única fonte de verdade: todos os portais e todo o
  // conteúdo leem daqui, por isso vários portais nunca ficam em desacordo.
  dimensaoAtiva: 0,
  // id da dimensão -> materiais (panorama, obras) que lhe pertencem
  dimensoes: Object.create(null),
  // componentes dos portais registados
  portais: [],
  // id da dimensão -> valor de stencil (1..255) da janela que a mostra
  valores: new Map(),
  // evita reaplicar o mesmo estado a cada frame
  assinatura: null,
  // ordem de desenho (com sortObjects = true, o renderOrder manda)
  ordem: { mascara: 1, panorama: 2, obra: 3, moldura: 4, debug: 10 }
};

// Temporários reutilizados nos ticks (evita alocar por frame).
const _pontoMundo = new THREE.Vector3();
const _pontoCaixa = new THREE.Vector3();
const _pontoMascara = new THREE.Vector3();

// Registra um material como conteúdo de uma dimensão.
function registarNaDimensao(idDimensao, material) {
  let estado = window.portalAR;
  let id = Number(idDimensao);
  if (!(id >= 0 && id < LIMITE_DIMENSOES)) {
    console.warn('[dimensao] ID ' + idDimensao + ' fora do limite 0..' + (LIMITE_DIMENSOES - 1) + '; material ignorado.');
    return;
  }
  let lista = estado.dimensoes[id] || (estado.dimensoes[id] = []);
  if (!lista.includes(material)) lista.push(material);
  estado.assinatura = null;
  aplicarEstadoEstencil();
}

// Teste de stencil de cada material, conforme o papel da sua dimensão:
//  0 (dimensão ativa)  -> desenha em todo o lado onde nenhuma janela escreveu
//  1..255 (valor)      -> desenha dentro da janela que mostra essa dimensão
//  sem papel           -> não desenha
function aplicarEstadoEstencil() {
  let estado = window.portalAR;
  let ativa = estado.dimensaoAtiva;
  Object.keys(estado.dimensoes).forEach(function (chave) {
    let id = Number(chave);
    let ref = null;
    if (id === ativa) ref = 0;
    else if (estado.valores.has(id)) ref = estado.valores.get(id);
    estado.dimensoes[chave].forEach(function (mat) {
      mat.stencilWrite = true;
      mat.stencilWriteMask = 0xFF;
      mat.stencilFuncMask = 0xFF;
      mat.stencilFail = THREE.KeepStencilOp;
      mat.stencilZFail = THREE.KeepStencilOp;
      mat.stencilZPass = THREE.KeepStencilOp;
      if (ref === null) {
        mat.stencilFunc = THREE.NeverStencilFunc;
      } else {
        mat.stencilFunc = THREE.EqualStencilFunc;
        mat.stencilRef = ref;
      }
    });
  });
  estado.portais.slice().forEach(function (portal) {
    portal.atualizarJanela();
  });
}

// Muda a dimensão ativa. Quem atravessa um portal chama isto.
function definirDimensaoAtiva(id) {
  let estado = window.portalAR;
  if (estado.dimensaoAtiva === id) return;
  estado.dimensaoAtiva = id;
  estado.assinatura = null;
  console.info('[portal] Dimensao ativa: ' + id);
  aplicarEstadoEstencil();
}

// --- GESTOR DAS DIMENSÕES E JANELAS ---
// Corre uma vez por frame na cena: deteta as travessias e decide que dimensão
// cada janela mostra e com que valor de stencil. Um só sítio decide, para vários
// portais nunca entrarem em desacordo.
AFRAME.registerComponent('gestor-dimensoes', {
  init: function () {
    window.portalAR.valores = new Map();
  },
  tick: function () {
    let estado = window.portalAR;
    estado.portais.slice().forEach(function (portal) {
      portal.detetarTravessia();
    });

    let mostradas = [];
    estado.portais.forEach(function (portal) {
      let d = portal.dimensaoMostrada();
      if (d !== null && d !== estado.dimensaoAtiva && mostradas.indexOf(d) < 0) mostradas.push(d);
    });
    mostradas.sort(function (a, b) { return a - b; });
    if (mostradas.length > LIMITE_JANELAS) {
      console.warn('[portal] ' + mostradas.length + ' janelas excedem o limite do stencil (' + LIMITE_JANELAS + '); as restantes ficam sem janela.');
      mostradas = mostradas.slice(0, LIMITE_JANELAS);
    }

    let assinatura = estado.dimensaoAtiva + '|' + mostradas.join(',');
    if (assinatura !== estado.assinatura) {
      estado.assinatura = assinatura;
      estado.valores = new Map();
      mostradas.forEach(function (d, i) { estado.valores.set(d, i + 1); });
      aplicarEstadoEstencil();
    }

    // Isto corre TODOS os frames: a ordem depende da posição da câmara.
    this.ordenarMascaras();
  },
  // As máscaras são desenhadas da mais distante para a mais próxima. A máscara não
  // escreve profundidade, por isso, se duas se sobrepuserem no ecrã, a última a ser
  // desenhada é a que fica com o stencil. Com esta ordem, é a do portal da frente —
  // sem ela, a máscara de trás sobrescrevia a da frente e a zona de sobreposição
  // mostrava a dimensão errada.
  ordenarMascaras: function () {
    let estado = window.portalAR;
    let camara = document.querySelector('a-camera');
    if (!camara) return;
    camara.object3D.getWorldPosition(_pontoMundo);

    let visiveis = [];
    estado.portais.forEach(function (portal) {
      if (!portal.portalGroup.visible) return;
      portal.maskMesh.getWorldPosition(_pontoMascara);
      portal._distanciaMascara = _pontoMascara.distanceTo(_pontoMundo);
      visiveis.push(portal);
    });
    visiveis.sort(function (a, b) { return b._distanciaMascara - a._distanciaMascara; });
    visiveis.forEach(function (portal, i) {
      portal.maskMesh.renderOrder = estado.ordem.mascara + i * 0.01;
    });
  }
});

AFRAME.registerComponent('config-ar', {
  init: function () {
    this.el.setAttribute('embedded', '');
    this.aplicarConfigRenderer();
    this.el.addEventListener('render-target-loaded', () => this.aplicarConfigRenderer());
  },
  aplicarConfigRenderer: function () {
    let renderer = this.el.renderer;
    if (!renderer) return;
    renderer.setClearColor(0x000000, 0);
    // sortObjects TEM de ser true: com false o three ignora o renderOrder e
    // desenha pela ordem da árvore, o que só funciona por acaso com um portal.
    // Com vários, as máscaras têm de ser desenhadas antes de todo o conteúdo
    // (renderOrder: máscara 1, panorama 2, obras 3, moldura 4).
    renderer.sortObjects = true;
    // O stencil é limpo a 0 em cada frame; 0 significa "nenhuma janela aqui".
    renderer.autoClearStencil = true;
  }
});

AFRAME.registerComponent('cursor-listener', {
  init: function () {
    this.el.setAttribute('class', 'interactable');
  }
});

// --- MODAL DE OBRA ---
AFRAME.registerComponent('abrir-modal', {
  schema: { url: { type: 'string' } },
  init: function () {
    this.el.addEventListener('click', () => {
      if (!this.dimensaoAtual()) return;
      document.getElementById('iframe-obra').src = this.data.url;
      document.getElementById('modal-obra').style.display = 'flex';
    });
  },
  // Só abre obras da dimensão onde se está. Vê-las pela janela do portal não
  // conta. O raycaster não vê o stencil, por isso sem este teste dava para clicar
  // numa obra invisível de outra dimensão.
  dimensaoAtual: function () {
    let atributo = this.el.getAttribute('material-virtual');
    if (!atributo) return true;
    return Number(atributo.dimensao) === window.portalAR.dimensaoAtiva;
  }
});

// --- OBRAS DE UMA DIMENSÃO ---
AFRAME.registerComponent('material-virtual', {
  schema: { dimensao: { type: 'int', default: 0 } },
  init: function () {
    this.el.setAttribute('data-dimensao', this.data.dimensao);
    this.el.classList.add('dimensao-' + this.data.dimensao);
    this.el.addEventListener('loaded', () => this.applyStencil());
    if (this.el.getObject3D('mesh')) this.applyStencil();
  },
  applyStencil: function () {
    let mesh = this.el.getObject3D('mesh');
    if (!mesh) return;
    let ordem = window.portalAR.ordem;
    mesh.traverse((node) => {
      if (node.isMesh && node.material) {
        node.renderOrder = ordem.obra;
        node.name = 'dimensao-' + this.data.dimensao + '-obra';
        registarNaDimensao(this.data.dimensao, node.material);
      }
    });
  }
});

// --- PANORAMA 360º DE UMA DIMENSÃO ---
AFRAME.registerComponent('panorama-dimensao', {
  schema: {
    dimensao: { type: 'int', default: 0 },
    src: { type: 'selector' },
    raio: { default: 100 },
    seguirCamera: { type: 'boolean', default: true }
  },
  // O A-Frame chama `update` logo após o `init` (e sempre que o atributo muda),
  // por isso criar aqui evita construir a esfera duas vezes.
  update: function () { this.criar(); },
  criar: function () {
    let fonte = this.data.src;
    if (!fonte) return;
    this.el.setAttribute('data-dimensao', this.data.dimensao);
    this.el.classList.add('dimensao-' + this.data.dimensao);

    let antigo = this.el.getObject3D('panorama');
    if (antigo) { this.el.removeObject3D('panorama'); antigo.geometry.dispose(); }

    // Vídeo (por exemplo a webcam) tem de usar VideoTexture: uma Texture simples
    // ficaria com o primeiro frame congelado.
    let ehVideo = fonte.tagName === 'VIDEO';
    let textura = ehVideo ? new THREE.VideoTexture(fonte) : new THREE.Texture(fonte);
    textura.minFilter = THREE.LinearFilter;
    textura.generateMipmaps = false;
    if (ehVideo) {
      if (fonte.readyState >= 2) textura.needsUpdate = true;
      else fonte.addEventListener('loadeddata', () => { textura.needsUpdate = true; });
    } else if (fonte.complete) {
      textura.needsUpdate = true;
    } else {
      fonte.onload = () => { textura.needsUpdate = true; };
    }

    let ordem = window.portalAR.ordem;
    this.material = new THREE.MeshBasicMaterial({
      map: textura, side: THREE.BackSide, depthWrite: false,
      stencilWrite: true, stencilWriteMask: 0xFF, stencilFuncMask: 0xFF
    });
    let esfera = new THREE.Mesh(new THREE.SphereGeometry(this.data.raio, 64, 64), this.material);
    esfera.name = 'dimensao-' + this.data.dimensao + '-panorama';
    esfera.renderOrder = ordem.panorama;
    esfera.frustumCulled = false;
    this.el.setObject3D('panorama', esfera);
    registarNaDimensao(this.data.dimensao, this.material);
  },
  tick: function () {
    let esfera = this.el.getObject3D('panorama');
    if (!esfera || !this.data.seguirCamera) return;
    let camara = document.querySelector('a-camera');
    if (camara) esfera.position.copy(camara.object3D.position);
  }
});

// --- PORTAL (A PORTA ENTRE DUAS DIMENSÕES) ---
AFRAME.registerComponent('portal-estencil-dinamico', {
  schema: {
    portalId: { type: 'int', default: 0 },
    // As duas dimensões que este portal liga. Bidirecional: em A mostra B e em B
    // mostra A.
    dimensaoA: { type: 'int', default: 0 },
    dimensaoB: { type: 'int', default: 1 },
    // Dimensão a que a porta pertence (onde ela fica). -1 = aparece em qualquer
    // uma das duas. É isto que permite ter, por exemplo, 7 portas no lado da
    // dimensão 1 e 7 portas no lado da dimensão 2, sem se verem umas às outras.
    pertenceA: { type: 'int', default: -1 },
    width: { default: 12.0 },
    height: { default: 16.0 },
    // Caixa de colisão (X, Y, Z), centro e rotação (graus), no espaço do portal.
    // É a única fonte da caixa: a caixa de debug usa os mesmos valores.
    caixa: { type: 'vec3', default: { x: 12.0, y: 16.0, z: 1.0 } },
    caixaPosicao: { type: 'vec3', default: { x: 0.0, y: 8.0, z: 0.0 } },
    caixaRotacao: { type: 'vec3', default: { x: 0.0, y: 0.0, z: 0.0 } },
    // Onde a travessia é detetada, sempre dentro da caixa: 'plano' no plano do
    // quadro (a troca não se nota) ou 'caixa' na face de entrada.
    gatilho: { type: 'string', default: 'plano', oneOf: ['plano', 'caixa'] }
  },
  init: function () {
    let estado = window.portalAR;
    let id = this.data.portalId;
    if (id < 0 || id >= LIMITE_PORTAIS) {
      console.warn('[portal] ID ' + id + ' fora do limite 0..' + (LIMITE_PORTAIS - 1) + '; usa 0.');
      id = 0;
      this.data.portalId = 0;
    }
    this.nome = 'portal-' + id;
    this.el.setAttribute('data-portal-id', id);
    this.el.classList.add(this.nome);

    this.portalGroup = new THREE.Group();
    this.portalGroup.name = this.nome;
    this.el.setObject3D('portal-mesh', this.portalGroup);

    this.sinalZ = 1;
    this.dentroDaCaixa = false;
    this.travessiaIniciada = false;

    this.configurarCaixa();
    this.criarQuadro();

    document.addEventListener('keydown', (evento) => {
      if (evento.key === 'r' || evento.key === 'R') this.portalGroup.rotation.y += Math.PI;
      if (evento.key === 'd' || evento.key === 'D') this.toggleDebugMode();
    });

    estado.portais.push(this);
    this.atualizarJanela();
  },
  remove: function () {
    let lista = window.portalAR.portais;
    let i = lista.indexOf(this);
    if (i >= 0) lista.splice(i, 1);
    window.portalAR.assinatura = null;
  },
  // A dimensão que esta janela mostra agora (null se o portal não diz respeito à
  // dimensão onde se está, ou se pertence a outra dimensão).
  dimensaoMostrada: function () {
    let ativa = window.portalAR.dimensaoAtiva;
    if (this.data.pertenceA >= 0 && ativa !== this.data.pertenceA) return null;
    if (ativa === this.data.dimensaoA) return this.data.dimensaoB;
    if (ativa === this.data.dimensaoB) return this.data.dimensaoA;
    return null;
  },
  criarQuadro: function () {
    let w = this.data.width;
    let h = this.data.height;
    let ordem = window.portalAR.ordem;

    this.maskMat = new THREE.MeshBasicMaterial({
      colorWrite: false, depthWrite: false, side: THREE.DoubleSide,
      stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, stencilRef: 0,
      stencilWriteMask: 0xFF, stencilFuncMask: 0xFF,
      stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.ReplaceStencilOp
    });
    this.maskMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 32, 32), this.maskMat);
    this.maskMesh.name = this.nome + '-mascara';
    this.maskMesh.position.set(0, h / 2, 0);
    this.maskMesh.renderOrder = ordem.mascara;
    this.portalGroup.add(this.maskMesh);

    let moldura = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    let esp = 0.3;
    let meiaLargura = w / 2;
    let meiaAltura = h / 2;
    let pecas = [
      new THREE.Mesh(new THREE.BoxGeometry(esp, h, 0.2), moldura),
      new THREE.Mesh(new THREE.BoxGeometry(esp, h, 0.2), moldura),
      new THREE.Mesh(new THREE.BoxGeometry(w + 2 * esp, esp, 0.2), moldura),
      new THREE.Mesh(new THREE.BoxGeometry(w + 2 * esp, esp, 0.2), moldura)
    ];
    pecas[0].position.set(-meiaLargura - esp / 2, meiaAltura, 0);
    pecas[1].position.set(meiaLargura + esp / 2, meiaAltura, 0);
    pecas[2].position.set(0, h + esp / 2, 0);
    pecas[3].position.set(0, -esp / 2, 0);
    pecas.forEach((peca, i) => {
      peca.name = this.nome + '-moldura-' + i;
      peca.renderOrder = ordem.moldura;
      this.portalGroup.add(peca);
    });
  },
  // Diz à máscara que valor escrever (o da dimensão que a janela mostra).
  atualizarJanela: function () {
    let estado = window.portalAR;
    let mostrada = this.dimensaoMostrada();
    this.portalGroup.visible = mostrada !== null;
    if (mostrada === null) { this.maskMat.stencilWrite = false; return; }
    let valor = estado.valores.get(mostrada);
    if (valor === undefined) {
      // Sem valor livre no stencil: a janela fica sem efeito em vez de escrever
      // um valor errado (0, que é a dimensão ativa).
      this.maskMat.stencilWrite = false;
      return;
    }
    this.maskMat.stencilWrite = true;
    this.maskMat.stencilRef = valor;
  },
  // A A-Frame chama isto quando o atributo muda; a caixa e a caixa de debug são
  // sempre construídas dos mesmos valores.
  update: function () { this.configurarCaixa(); },
  configurarCaixa: function () {
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
    if (this.debugBox) {
      this.portalGroup.remove(this.debugBox);
      this.debugBox = null;
      this.criarCaixaDebug();
    }
  },
  toggleDebugMode: function () {
    if (this.debugBox) {
      this.portalGroup.remove(this.debugBox);
      this.debugBox = null;
      return;
    }
    this.criarCaixaDebug();
  },
  criarCaixaDebug: function () {
    let caixa = this.data.caixa;
    let pos = this.data.caixaPosicao;
    let rot = this.data.caixaRotacao;
    let cor = new THREE.Color(0x0000FF);
    this.debugBox = new THREE.Mesh(
      new THREE.BoxGeometry(caixa.x, caixa.y, caixa.z),
      new THREE.MeshBasicMaterial({ color: cor, wireframe: true, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    this.debugBox.name = this.nome + '-caixa-debug';
    this.debugBox.position.set(pos.x, pos.y, pos.z);
    this.debugBox.rotation.set(
      THREE.MathUtils.degToRad(rot.x),
      THREE.MathUtils.degToRad(rot.y),
      THREE.MathUtils.degToRad(rot.z)
    );
    this.debugBox.renderOrder = window.portalAR.ordem.debug;
    this.portalGroup.add(this.debugBox);
  },
  // Colisão com a caixa, no espaço do portal (posição e rotação incluídas): não há
  // nenhuma distância global, por isso funciona com o portal deslocado, rodado,
  // em movimento e com vários portais.
  detetarTravessia: function () {
    if (!this.portalGroup.visible) { this.travessiaIniciada = false; return; }
    let camara = document.querySelector('a-camera');
    if (!camara) return;

    this.portalGroup.updateWorldMatrix(true, false);
    camara.object3D.getWorldPosition(_pontoMundo);
    _pontoCaixa.copy(_pontoMundo);
    this.portalGroup.worldToLocal(_pontoCaixa);
    _pontoCaixa.sub(this.caixaCentro).applyQuaternion(this.caixaRotacaoInversa);

    let dentro = (
      Math.abs(_pontoCaixa.x) <= this.caixaMeio.x &&
      Math.abs(_pontoCaixa.y) <= this.caixaMeio.y &&
      Math.abs(_pontoCaixa.z) <= this.caixaMeio.z
    );
    let sinalZ = _pontoCaixa.z < 0 ? -1 : 1;

    if (!this.travessiaIniciada) {
      this.travessiaIniciada = true;
      this.dentroDaCaixa = dentro;
      this.sinalZ = sinalZ;
      return;
    }

    let atravessou;
    if (this.data.gatilho === 'caixa') atravessou = dentro && !this.dentroDaCaixa;
    else atravessou = dentro && sinalZ !== this.sinalZ;

    this.dentroDaCaixa = dentro;
    this.sinalZ = sinalZ;
    if (!atravessou) return;

    let ativa = window.portalAR.dimensaoAtiva;
    definirDimensaoAtiva(ativa === this.data.dimensaoA ? this.data.dimensaoB : this.data.dimensaoA);
  }
});

// --- LÓGICA DE MOVIMENTAÇÃO MOBILE ---
let estadosMovimento = { frente: false, tras: false, esq: false, dir: false };
const VELOCIDADE = 0.1;

function atualizarMovimentoMobile() {
  let cam = document.querySelector('a-camera');
  if (cam) {
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

function mostrarLoading() {
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.id = 'loading-overlay';
  loadingOverlay.innerHTML = 'Carregando...';
  loadingOverlay.style.display = 'flex';
  document.body.appendChild(loadingOverlay);
}

function esconderLoading() {
  const loadingOverlay = document.getElementById('loading-overlay');
  if (loadingOverlay) {
    loadingOverlay.style.display = 'none';
  }
}

function tratarErroCamera(error) {
  console.error('Erro ao acessar a câmera:', error);
  esconderLoading();
  const errorMsg = document.createElement('div');
  errorMsg.className = 'loading-overlay';
  errorMsg.innerHTML = 'Não foi possível acessar a câmera. Por favor, verifique as permissões.';
  errorMsg.style.display = 'flex';
  document.body.appendChild(errorMsg);
  document.getElementById('btn-iniciar').style.display = 'none';
}
