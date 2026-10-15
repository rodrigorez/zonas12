// --- CORE ---
// The scene state, the registries and the stencil rules live in js/core/ (decision D1).
// This file is the application: the A-Frame components and the bootstrapping. The camera
// module already lives in js/modules/; the dimension, artwork and portal modules follow
// (docs/ROADMAP.md, Fase 2).
import {
  state,
  MAX_PORTALS,
  registerContent,
  registerPortal,
  unregisterPortal,
  applyStencilState,
  syncStencilValues,
  setActiveDimension,
  on
} from './core/index.js';
import { setupMobileControls, reportCameraError } from './modules/camera.js';
import { closeArtwork } from './modules/artwork.js';
import './modules/dimension.js';

// --- DEBUG AND TEST HANDLE ---
// The console and the regression scripts (docs/ROADMAP.md section 10) drive the scene
// through this. The application itself does not use it.
window.portalAR = state;
window.portalDebug = {
  state: state,
  setActiveDimension: setActiveDimension,
  applyStencilState: applyStencilState,
  syncStencilValues: syncStencilValues,
  registerContent: registerContent,
  on: on
};

// Temporary vectors reused in the ticks (avoids allocating per frame).
const _pontoMundo = new THREE.Vector3();
const _pontoCaixa = new THREE.Vector3();

// --- GESTOR DAS DIMENSÕES E JANELAS ---
// Corre uma vez por frame na cena: deteta as travessias e decide que dimensão
// cada janela mostra e com que valor de stencil. Um só sítio decide, para vários
// portais nunca entrarem em desacordo.
AFRAME.registerComponent('gestor-dimensoes', {
  tick: function () {
    let estado = state;
    estado.portals.slice().forEach(function (portal) {
      portal.detetarTravessia();
    });

    let mostradas = [];
    estado.portals.forEach(function (portal) {
      let d = portal.dimensaoMostrada();
      if (d !== null && d !== estado.activeDimension && mostradas.indexOf(d) < 0) mostradas.push(d);
    });
    // The core assigns the stencil values and only reapplies when something changed.
    syncStencilValues(mostradas);
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
    // Confirma o que o A-Frame 1.8.0 já fixa ao inicializar o sistema do renderer
    // (src/systems/renderer.js): com sortObjects a false o three ignora o renderOrder e
    // desenha pela ordem da árvore, o que só funciona por acaso com um portal. Com vários,
    // as máscaras têm de ser desenhadas antes de todo o conteúdo.
    // (renderOrder: máscara 1, panorama 2, obras 3, moldura 4)
    renderer.sortObjects = true;
    // O stencil é limpo a 0 em cada frame; 0 significa "nenhuma janela aqui".
    renderer.autoClearStencil = true;
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
    let estado = state;
    let id = this.data.portalId;
    if (id < 0 || id >= MAX_PORTALS) {
      console.warn('[portal] ID ' + id + ' fora do limite 0..' + (MAX_PORTALS - 1) + '; usa 0.');
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

    registerPortal(this);
    // The core does not know about portals: it announces the stencil changed and every
    // window refreshes itself.
    this._desinscreverEstencil = on('stencil:changed', () => this.atualizarJanela());
    this.atualizarJanela();
  },
  remove: function () {
    if (this._desinscreverEstencil) this._desinscreverEstencil();
    unregisterPortal(this);
  },
  // A dimensão que esta janela mostra agora (null se o portal não diz respeito à
  // dimensão onde se está, ou se pertence a outra dimensão).
  dimensaoMostrada: function () {
    let ativa = state.activeDimension;
    if (this.data.pertenceA >= 0 && ativa !== this.data.pertenceA) return null;
    if (ativa === this.data.dimensaoA) return this.data.dimensaoB;
    if (ativa === this.data.dimensaoB) return this.data.dimensaoA;
    return null;
  },
  criarQuadro: function () {
    let w = this.data.width;
    let h = this.data.height;
    let ordem = state.drawOrder;

    // A máscara escreve o valor do stencil E profundidade no plano da janela. A
    // profundidade é o que resolve duas coisas sem código nenhum: (1) quando duas
    // janelas se sobrepõem no ecrã, ganha a do portal da frente (as de trás falham o
    // teste de profundidade, logo não escrevem stencil); (2) tudo o que pertence à
    // dimensão ativa e está ATRÁS da janela fica tapado por ela, e o que está à
    // frente desenha-se por cima (é o que mantém as molduras inteiras).
    this.maskMat = new THREE.MeshBasicMaterial({
      colorWrite: false, depthWrite: true, side: THREE.DoubleSide,
      stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, stencilRef: 0,
      stencilWriteMask: 0xFF, stencilFuncMask: 0xFF,
      stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.ReplaceStencilOp
    });
    this.maskMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 32, 32), this.maskMat);
    this.maskMesh.name = this.nome + '-mascara';
    this.maskMesh.position.set(0, h / 2, 0);
    this.maskMesh.renderOrder = ordem.mask;
    this.portalGroup.add(this.maskMesh);

    // A moldura é geometria da dimensão onde o portal está. Não leva teste de
    // stencil: quem decide se ela fica à frente ou atrás do conteúdo de uma janela é
    // a profundidade (a máscara das janelas escreve profundidade no plano delas).
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
      peca.renderOrder = ordem.frame;
      this.portalGroup.add(peca);
    });
  },
  // Diz à máscara que valor escrever (o da dimensão que a janela mostra).
  atualizarJanela: function () {
    let estado = state;
    let mostrada = this.dimensaoMostrada();
    this.portalGroup.visible = mostrada !== null;
    if (mostrada === null) { this.maskMat.stencilWrite = false; return; }
    let valor = estado.stencilValues.get(mostrada);
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
    // A caixa de debug é geometria do portal, logo segue a mesma regra da moldura:
    // fica tapada pelas janelas que lhe estão à frente, pela profundidade.
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
    this.debugBox.renderOrder = state.drawOrder.debug;
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

    let ativa = state.activeDimension;
    setActiveDimension(ativa === this.data.dimensaoA ? this.data.dimensaoB : this.data.dimensaoA);
  }
});

// Atalhos de teclado de desenvolvimento: um ouvinte só para a cena inteira, a iterar o
// registo dos portais. Registar um ouvinte por portal (como antes) deixava um ouvinte morto
// por cada portal criado e destruído — e o portal removido ficava vivo na closure, sem poder
// ser recolhido. Criar e destruir portais em ciclo é o teste T9 (docs/ROADMAP.md secção 10).
document.addEventListener('keydown', (evento) => {
  let tecla = evento.key.toLowerCase();
  if (tecla !== 'r' && tecla !== 'd') return;
  state.portals.slice().forEach(function (portal) {
    if (tecla === 'r') portal.portalGroup.rotation.y += Math.PI;
    else portal.toggleDebugMode();
  });
});

// --- TEMPORARY BRIDGE TO THE INTERFACE ---
// index.html still calls these from inline attributes (onclick) and from its own inline
// script. Now that this file is a module, its scope is no longer global, so they have to be
// reachable from window. Removed in Fase 4, when the interface becomes a module with its
// own listeners.
window.fecharObra = closeArtwork;
window.configurarBotoesMobile = setupMobileControls;
window.tratarErroCamera = reportCameraError;
