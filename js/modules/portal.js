// The portal module: the door between two dimensions — its window (the stencil mask), its
// frame, its collision box, the traversal and the debug box. This is also where the per-frame
// driver lives, because the core does not know about portals (docs/ROADMAP.md, decision D19
// and section 5.0).
//
// It asks the camera where the player is (A5), it detects its own traversal (A7) and it takes
// its entry out of the registry when it leaves the scene (A4).
import {
  state,
  MAX_PORTALS,
  registerPortal,
  unregisterPortal,
  syncStencilValues,
  setActiveDimension,
  on
} from '../core/index.js';
import { playerCamera } from './camera.js';
import { createLabel, disposeLabel } from './label.js';
import {
  WINDOW_KINDS,
  ACTION_KINDS,
  WINDOWS,
  ACTIONS,
  worldHref
} from './portal-kinds.js';

const PORTAL_COMPONENT = 'stencil-portal';

// The world this page serves (D24). A door that navigates writes it into `?from`, and the world on
// the other side uses it to pick the door the visitor appears behind. The builder hands it over
// (the module never reads the data) — the same shape as `useRealCamera` in the camera module.
let worldSlug = null;

export function setWorld(slug) {
  worldSlug = typeof slug === 'string' ? slug : null;
}

// Whether a door may leave the page (D32). The exhibition navigates; the editor's preview does not —
// a walk inside the tool must not take the work away with it. The builder hands this over too, for
// the same reason it hands over the world: the module never reads the data.
let navigationEnabled = true;

export function setNavigation(enabled) {
  navigationEnabled = enabled !== false;
}

// A última travessia, para a sonda de campo (D55). Fica em `sessionStorage` porque é o único
// armazenamento que a navegação leva consigo e que a página seguinte consegue ler: a memória do
// módulo morre com o documento que atravessou.
const TRAVERSAL_KEY = 'zonas12.travessia';

function recordTraversal(record) {
  try {
    sessionStorage.setItem(TRAVERSAL_KEY, JSON.stringify(record));
  } catch (error) {
    // Sem armazenamento (modo privado de alguns browsers) não há registo — e não é motivo para
    // deixar de atravessar.
  }
}

// O que a última travessia registou, ou `null` quando não houve nenhuma. A sonda mostra-o: na página
// de chegada ele diz que a travessia foi pedida e há quanto tempo; na página de origem, que o pedido
// não chegou a sair — a diferença entre os dois é a resposta ao defeito.
export function traversalRecord() {
  try {
    return JSON.parse(sessionStorage.getItem(TRAVERSAL_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

// Reused vectors: the driver and the collision run every frame and must not allocate.
const _worldPoint = new THREE.Vector3();
const _boxPoint = new THREE.Vector3();

// Os instrumentos e o `prefers-reduced-motion` precisam de parar o movimento das portas (D59): uma
// captura que compara dois instantes não pode ter uma porta a andar pelo meio. Fica aqui, no módulo,
// porque é o módulo que anima — quem pergunta não tem de conhecer as portas uma a uma.
let motionFrozen = false;

// O visitante que pediu menos movimento fica com as portas paradas (D59), como fica com o shader: é o
// mesmo pedido do sistema, e uma porta a andar à volta da sala é exactamente o que ele pediu para não
// ver. Lido uma vez, à carga do módulo: o `prefers-reduced-motion` de uma página não muda a meio.
if (typeof window !== 'undefined' && typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  motionFrozen = true;
}

export function freezeMotion(frozen) {
  motionFrozen = frozen !== false;
  return motionFrozen;
}

// A-Frame's vec3 in the object form of setAttribute needs { x, y, z }: an array there is read as
// an object with no axes and falls back to the default, silently (measured in A-Frame 1.8,
// utils/coordinates.js parse). The data writes vectors as arrays, so the factories below
// translate — and this is the only place that knows the difference.
const vector = (value) => ({ x: value[0], y: value[1], z: value[2] });

AFRAME.registerComponent(PORTAL_COMPONENT, {
  schema: {
    id: { type: 'int', default: 0 },
    // The two axes of the door (D14), as data: what the window shows and what the traversal does.
    // The kinds and the combinations that are legal live in ./portal-kinds.js; here they only
    // choose which behaviour runs.
    windowKind: { type: 'string', default: 'dimension-pair', oneOf: WINDOW_KINDS },
    actionKind: { type: 'string', default: 'enter-window', oneOf: ACTION_KINDS },
    // The two dimensions this portal links. Bidirectional: in A it shows B and in B it shows A.
    // Only read when the window is a 'dimension-pair' (D25).
    dimensionA: { type: 'int', default: 0 },
    dimensionB: { type: 'int', default: 1 },
    // The dimension the builder derived for the portrait of this door (D26), in the reserved band
    // of the ids. -1 = the door has no portrait to show.
    previewDimension: { type: 'int', default: -1 },
    // Only read when the action is 'navigate': the slug of the world on the other side (D14).
    target: { type: 'string', default: '' },
    // The dimension the door belongs to (where it stands). -1 = it shows up in either of the
    // two. This is what allows, for example, 7 doors on the side of dimension 1 and 7 doors on
    // the side of dimension 2 without them seeing each other.
    ownedBy: { type: 'int', default: -1 },
    width: { default: 12.0 },
    height: { default: 16.0 },
    // Collision box (X, Y, Z), centre and rotation (degrees), in the space of the portal. It is
    // the only source of the box: the debug box uses the same values.
    box: { type: 'vec3', default: { x: 12.0, y: 16.0, z: 1.0 } },
    boxPosition: { type: 'vec3', default: { x: 0.0, y: 8.0, z: 0.0 } },
    boxRotation: { type: 'vec3', default: { x: 0.0, y: 0.0, z: 0.0 } },
    // Where the traversal is detected, always inside the box: 'plane' on the plane of the
    // frame (the change is not noticed) or 'box' on the entry face.
    trigger: { type: 'string', default: 'plane', oneOf: ['plane', 'box'] },
    // The frame is geometry of this component, but its colour and thickness are data (Fase 3).
    // The defaults are exactly what the code used to write by hand, so a scene written by hand
    // (the HTML, before the builder) keeps looking the same — and the converter reads them from
    // here, which is what keeps the two from drifting.
    frameColor: { type: 'string', default: '#ff0000' },
    frameThickness: { type: 'number', default: 0.3 },
    // The name of the door, for the debug view (D39). It is written by the builder from the data —
    // the names of the dimensions it links, the world it opens — so the component never reads the
    // scene: it only draws what it is given.
    label: { type: 'string', default: '' },
    // Whether the name starts visible. The exhibition shows it with the debug key; the editor's
    // preview, which has no key of its own, shows it from the start (it is a tool, D3).
    labelAlways: { type: 'boolean', default: false },
    // O movimento animado (D59). Vazio é uma porta parada, que é o que quase todas são.
    motionKind: { type: 'string', default: '', oneOf: ['', 'spin', 'orbit'] },
    motionPeriod: { type: 'number', default: 20 },
    motionAxis: { type: 'vec3', default: { x: 0, y: 1, z: 0 } },
    motionRadius: { type: 'number', default: 0 }
  },
  init: function () {
    let id = this.data.id;
    if (id < 0 || id >= MAX_PORTALS) {
      console.warn('[portal] ID ' + id + ' out of range 0..' + (MAX_PORTALS - 1) + '; using 0.');
      id = 0;
      this.data.id = 0;
    }
    this.portalName = 'portal-' + id;
    this.el.setAttribute('data-portal-id', id);
    this.el.classList.add(this.portalName);

    this.portalGroup = new THREE.Group();
    this.portalGroup.name = this.portalName;
    this.el.setObject3D('portal-mesh', this.portalGroup);

    this.zSign = 1;
    this.insideBox = false;
    this.traversalStarted = false;
    this.navigating = false;

    this.configureBox();
    this.buildFrame();

    registerPortal(this);
    // The core does not know about portals: it announces the stencil changed and every window
    // refreshes itself.
    this.unsubscribeStencil = on('stencil:changed', () => this.refreshWindow());
    this.refreshWindow();
    if (this.data.labelAlways) this.showLabel(true);
  },
  remove: function () {
    if (this.unsubscribeStencil) this.unsubscribeStencil();
    unregisterPortal(this);
    // The mask, the frame, the debug box and the label are built here by hand, so nobody else
    // releases them: without this the geometry and the materials of a removed portal stay alive.
    this.portalGroup.children.slice().forEach(function (child) {
      // A sprite shares its geometry with every other sprite in the scene (it is three's own): only
      // the material and the texture of the label belong to this door.
      if (child.isSprite) {
        disposeLabel(child);
        return;
      }
      if (child.geometry) child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(function (material) {
        if (!material) return;
        if (material.map) material.map.dispose();
        material.dispose();
      });
    });
  },
  // The dimension this window shows right now, asked of the table (D14): null when the axis shows
  // nothing, when the door belongs to another dimension, or when the pair has nothing to do with
  // the dimension the visitor is in.
  shownDimension: function () {
    const axis = WINDOWS[this.data.windowKind];
    if (!axis || axis.shows === 'nothing') return null;
    const active = state.activeDimension;
    if (this.data.ownedBy >= 0 && active !== this.data.ownedBy) return null;
    if (axis.shows === 'pair') {
      if (active === this.data.dimensionA) return this.data.dimensionB;
      if (active === this.data.dimensionB) return this.data.dimensionA;
      return null;
    }
    // A portrait: the dimension the builder derived (D26) and handed to this door.
    return this.data.previewDimension >= 0 ? this.data.previewDimension : null;
  },
  buildFrame: function () {
    const w = this.data.width;
    const h = this.data.height;
    const drawOrder = state.drawOrder;

    // The mask writes the stencil value AND depth on the plane of the window. Depth is what
    // solves two things with no code at all: (1) when two windows overlap on screen, the one of
    // the portal in front wins (the ones behind fail the depth test, so they write no stencil);
    // (2) everything that belongs to the active dimension and is BEHIND the window is hidden by
    // it, and what is in front draws over it (which is what keeps the frames whole).
    this.maskMat = new THREE.MeshBasicMaterial({
      colorWrite: false, depthWrite: true, side: THREE.DoubleSide,
      stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, stencilRef: 0,
      stencilWriteMask: 0xFF, stencilFuncMask: 0xFF,
      stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.ReplaceStencilOp
    });
    this.maskMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h, 32, 32), this.maskMat);
    this.maskMesh.name = this.portalName + '-mask';
    this.maskMesh.position.set(0, h / 2, 0);
    this.maskMesh.renderOrder = drawOrder.mask;
    this.portalGroup.add(this.maskMesh);

    // The frame is geometry of the dimension the portal stands in. It takes no stencil test:
    // depth is what decides whether it stays in front of or behind the content of a window (the
    // mask of the windows writes depth on their plane).
    const frameMaterial = new THREE.MeshBasicMaterial({ color: this.data.frameColor });
    const thickness = this.data.frameThickness;
    const halfWidth = w / 2;
    const halfHeight = h / 2;
    const bars = [
      new THREE.Mesh(new THREE.BoxGeometry(thickness, h, 0.2), frameMaterial),
      new THREE.Mesh(new THREE.BoxGeometry(thickness, h, 0.2), frameMaterial),
      new THREE.Mesh(new THREE.BoxGeometry(w + 2 * thickness, thickness, 0.2), frameMaterial),
      new THREE.Mesh(new THREE.BoxGeometry(w + 2 * thickness, thickness, 0.2), frameMaterial)
    ];
    bars[0].position.set(-halfWidth - thickness / 2, halfHeight, 0);
    bars[1].position.set(halfWidth + thickness / 2, halfHeight, 0);
    bars[2].position.set(0, h + thickness / 2, 0);
    bars[3].position.set(0, -thickness / 2, 0);
    bars.forEach((bar, i) => {
      bar.name = this.portalName + '-frame-' + i;
      bar.renderOrder = drawOrder.frame;
      this.portalGroup.add(bar);
    });
  },
  // Whether the door stands in the dimension the visitor is in. It is what decides that it exists
  // (that it collides) and it does not depend on what the window shows: a door with no window still
  // takes the visitor somewhere — `none` + `navigate` is a legal combination (section 5.4).
  standsHere: function () {
    return this.data.ownedBy < 0 || this.data.ownedBy === state.activeDimension;
  },
  // Tells the mask which value to write (the one of the dimension the window shows). The mask is the
  // window itself, so with nothing to show there is no mask: it writes depth as well, and a mask
  // left there without a window would hide what is behind the door showing nothing in exchange.
  refreshWindow: function () {
    this.portalGroup.visible = this.standsHere();

    const dimension = this.shownDimension();
    this.maskMesh.visible = dimension !== null;
    if (dimension === null) { this.maskMat.stencilWrite = false; return; }
    const value = state.stencilValues.get(dimension);
    if (value === undefined) {
      // No free stencil value: the window has no effect instead of writing a wrong value (0,
      // which is the active dimension).
      this.maskMat.stencilWrite = false;
      return;
    }
    this.maskMat.stencilWrite = true;
    this.maskMat.stencilRef = value;
  },
  // A-Frame calls this when the attribute changes; the box and the debug box are always built
  // from the same values. O movimento (D59) parte sempre da pose do dado: guardar a base aqui é o
  // que faz `tick` animar **em torno** da porta que o ficheiro descreve e não à volta de si mesma.
  update: function () {
    this.configureBox();
    this.basePosition = this.el.object3D.position.clone();
    this.baseRotation = this.el.object3D.rotation.clone();
  },
  // O movimento animado (D59): uma volta completa a cada `motionPeriod` segundos. O relógio é o do
  // A-Frame (`time`, em ms) e não o `performance.now()` — assim a mesma cena anima o mesmo com um
  // quadro lento, e a bateria pode perguntar «onde está a porta aos 10 s» e obter sempre o mesmo.
  //
  // O `prefers-reduced-motion` do visitante e o `freezeMotion` dos instrumentos param o movimento no
  // **instante em que estão**: a porta fica onde está, como o shader fica no quadro em que estava.
  animate: function (time) {
    const kind = this.data.motionKind;
    if (!kind || motionFrozen || this.data.motionPeriod <= 0) return;
    const period = this.data.motionPeriod * 1000;
    const phase = (time % period) / period;
    if (!this.basePosition) {
      this.basePosition = this.el.object3D.position.clone();
      this.baseRotation = this.el.object3D.rotation.clone();
    }
    const base = this.baseRotation;
    if (kind === 'spin') {
      // A volta aplica-se sobre o eixo escolhido, somada à rotação do dado.
      const axis = this.data.motionAxis;
      const turn = phase * Math.PI * 2;
      this.el.object3D.rotation.set(
        base.x + turn * axis.x,
        base.y + turn * axis.y,
        base.z + turn * axis.z
      );
      return;
    }
    const radius = this.data.motionRadius;
    const angle = phase * Math.PI * 2;
    this.el.object3D.position.set(
      this.basePosition.x + Math.cos(angle) * radius,
      this.basePosition.y,
      this.basePosition.z + Math.sin(angle) * radius
    );
    // Vira-se com o círculo: a janela olha sempre para fora do centro que ela descreve.
    this.el.object3D.rotation.set(base.x, base.y + angle, base.z);
  },
  configureBox: function () {
    const box = this.data.box;
    const position = this.data.boxPosition;
    const rotation = this.data.boxRotation;
    this.boxHalf = new THREE.Vector3(box.x / 2, box.y / 2, box.z / 2);
    this.boxCenter = new THREE.Vector3(position.x, position.y, position.z);
    this.boxRotationInverse = new THREE.Quaternion().setFromEuler(new THREE.Euler(
      THREE.MathUtils.degToRad(rotation.x),
      THREE.MathUtils.degToRad(rotation.y),
      THREE.MathUtils.degToRad(rotation.z)
    )).invert();
    if (this.debugBox) {
      this.portalGroup.remove(this.debugBox);
      this.debugBox = null;
      this.buildDebugBox();
    }
  },
  // Turns the door around its own axis. Used by the `R` key.
  rotate: function () {
    this.portalGroup.rotation.y += Math.PI;
  },
  toggleDebugMode: function () {
    if (this.debugBox) {
      this.portalGroup.remove(this.debugBox);
      this.debugBox = null;
      // In the editor's preview the names stay: they are the reason the view exists (D39).
      this.showLabel(this.data.labelAlways === true);
      return;
    }
    this.buildDebugBox();
    this.showLabel(true);
  },
  buildDebugBox: function () {
    const box = this.data.box;
    const position = this.data.boxPosition;
    const rotation = this.data.boxRotation;
    // The debug box is geometry of the portal, so it follows the same rule as the frame: the
    // windows in front of it hide it, by depth.
    this.debugBox = new THREE.Mesh(
      new THREE.BoxGeometry(box.x, box.y, box.z),
      new THREE.MeshBasicMaterial({ color: 0x0000FF, wireframe: true, transparent: true, opacity: 0.8, side: THREE.DoubleSide })
    );
    this.debugBox.name = this.portalName + '-debug-box';
    this.debugBox.position.set(position.x, position.y, position.z);
    this.debugBox.rotation.set(
      THREE.MathUtils.degToRad(rotation.x),
      THREE.MathUtils.degToRad(rotation.y),
      THREE.MathUtils.degToRad(rotation.z)
    );
    this.debugBox.renderOrder = state.drawOrder.debug;
    this.portalGroup.add(this.debugBox);
  },
  // The name of the door, above it, for whoever is debugging (D39). A sprite and not a plane: the
  // visitor who arrives lands **behind** the door, and a plane would read mirrored from there —
  // a sprite always faces the camera, so the name reads the same from either side.
  showLabel: function (visible) {
    if (visible && !this.labelSprite && this.data.label) this.buildLabel();
    if (this.labelSprite) this.labelSprite.visible = visible;
  },
  buildLabel: function () {
    this.labelSprite = createLabel(this.data.label, {
      name: this.portalName + '-label',
      maxWidth: this.data.width
    });
    // Above the door, on its own plane: the height of the door is what says where the top is.
    this.labelSprite.position.set(0, this.data.height + this.labelSprite.scale.y * 0.8, 0);
    this.portalGroup.add(this.labelSprite);
  },
  // Collision with the box, in the space of the portal (position and rotation included): there
  // is no global distance, so it works with the portal moved, rotated, in motion and with
  // several portals.
  detectTraversal: function () {
    if (!this.portalGroup.visible) { this.traversalStarted = false; return; }
    const worldPoint = playerCamera.worldPosition(_worldPoint);
    if (!worldPoint) return;

    this.portalGroup.updateWorldMatrix(true, false);
    _boxPoint.copy(worldPoint);
    this.portalGroup.worldToLocal(_boxPoint);
    _boxPoint.sub(this.boxCenter).applyQuaternion(this.boxRotationInverse);

    const inside = (
      Math.abs(_boxPoint.x) <= this.boxHalf.x &&
      Math.abs(_boxPoint.y) <= this.boxHalf.y &&
      Math.abs(_boxPoint.z) <= this.boxHalf.z
    );
    const zSign = _boxPoint.z < 0 ? -1 : 1;

    if (!this.traversalStarted) {
      this.traversalStarted = true;
      this.insideBox = inside;
      this.zSign = zSign;
      return;
    }

    let crossed;
    if (this.data.trigger === 'box') crossed = inside && !this.insideBox;
    else crossed = inside && zSign !== this.zSign;

    this.insideBox = inside;
    this.zSign = zSign;
    if (!crossed) return;

    this.onTraverse();
  },
  // What crossing this door does, asked of the table (D14): adding a use is adding an entry there,
  // not a case here.
  onTraverse: function () {
    const action = ACTIONS[this.data.actionKind] || ACTIONS['enter-window'];
    if (action.navigates) { this.navigate(); return; }
    if (!action.enters) return;

    const active = state.activeDimension;
    setActiveDimension(active === this.data.dimensionA ? this.data.dimensionB : this.data.dimensionA);
  },
  // The world door: this page goes away and the other one arrives (D14). One navigation and only
  // one — the frame driver keeps running until the new document takes over, and a second call would
  // fight with the first.
  navigate: function () {
    // D32: in a preview the navigation is inert. The door says so **once**, because walking into it
    // is the author testing the door, not a defect.
    if (!navigationEnabled) {
      if (!this.warnedPreview) {
        this.warnedPreview = true;
        console.warn('[portal] door ' + this.data.id + ' opens "' + this.data.target +
          '" and this page is a preview: the traversal stops here (D32)');
      }
      return;
    }
    if (this.navigating) return;
    this.navigating = true;
    const url = new URL(worldHref(this.data.target, document.baseURI));
    // The only thing that crosses the boundary, besides the address, is the slug of this world: the
    // destination uses it to choose which door the visitor appears behind (law L17).
    if (worldSlug) url.searchParams.set('from', worldSlug);
    // O registo da travessia (sonda). Quem sai escreve-o um instante antes de sair e quem chega lê-o:
    // é a única prova que fica de uma travessia, porque o documento que a pediu já não existe quando
    // se quer saber o que ela fez. Sem ele, um aparelho que atravessa e não muda de página não deixa
    // rasto nenhum — e o defeito não se distingue de o visitante não ter chegado à porta.
    // D54: o que fica no ecrã até a página seguinte pintar é o **destino**, não a sala que se deixa.
    // No instante da travessia o fundo congela (o mesmo mecanismo do `prefers-reduced-motion`) e a
    // câmara **encosta à janela** — 5 cm do lado de onde vem, porque a janela é uma máscara no plano
    // da porta: de lá ela enche o ecrã e o que se vê é o outro lado. Sem isto, o visitante via a sala
    // de origem a animar durante a espera, e era isso que ele descrevia como «vejo o ambiente onde
    // eu estava» antes de o destino aparecer.
    // A preparação está dentro de um `try`: um erro a congelar ou a capturar não pode deixar o
    // visitante preso no mundo que ele já atravessou. O passo que conta — sair da página — acontece
    // sempre; o que falhou fica escrito no registo para a sonda o mostrar.
    const registo = {};
    try {
      if (window.portalDebug && typeof window.portalDebug.freezeShaders === 'function') {
        window.portalDebug.freezeShaders();
      }
      const centro = new THREE.Vector3();
      this.el.object3D.getWorldPosition(centro);
      const frente = new THREE.Vector3(0, 0, 1)
        .applyQuaternion(this.el.object3D.getWorldQuaternion(new THREE.Quaternion()));
      const onde = playerCamera.worldPosition(new THREE.Vector3());
      const lado = onde
        ? (Math.sign((onde.x - centro.x) * frente.x + (onde.z - centro.z) * frente.z) || 1)
        : 1;
      registo.encosto = Boolean(playerCamera.enterWindow({
        x: centro.x + frente.x * lado * 0.05,
        z: centro.z + frente.z * lado * 0.05
      }));
      // The image bridge (D43): this page leaves the last frame it is showing for the one that
      // arrives, which paints it before it has a scene. `js/arrival-frame.js` is a classic script
      // because it has to run before the first paint and a module cannot — so it is reached through
      // the window, and a host without it navigates exactly as before.
      if (window.arrivalFrame) {
        registo.captura = Boolean(window.arrivalFrame.capture());
        // ...e o mesmo quadro fica por cima desta cena enquanto ela espera (D55): a ponte só existe
        // do outro lado, e a espera medida num telemóvel foi de 4,7 s.
        registo.cobertura = Boolean(window.arrivalFrame.cover());
      }
    } catch (error) {
      registo.erro = (error && error.message) || String(error);
    }
    recordTraversal({
      de: worldSlug || '',
      porta: this.data.id,
      para: this.data.target || '',
      encosto: registo.encosto === true,
      captura: registo.captura === true,
      cobertura: registo.cobertura === true,
      erro: registo.erro || '',
      em: Date.now()
    });
    window.location.assign(url.href);
  }
});

// One pass per frame for the whole scene: every portal detects its own traversal and the core
// decides what each window shows. A single place decides, so several portals never disagree.
AFRAME.registerComponent('portal-driver', {
  tick: function (time) {
    state.portals.slice().forEach(function (portal) {
      // O movimento vem antes da colisão: a caixa é lida do mundo, por isso a porta é detectada onde
      // ela **está** neste quadro e não onde o ficheiro a escreveu (D59).
      portal.animate(time);
      portal.detectTraversal();
    });

    const shown = [];
    state.portals.forEach(function (portal) {
      const dimension = portal.shownDimension();
      if (dimension !== null && dimension !== state.activeDimension && shown.indexOf(dimension) < 0) {
        shown.push(dimension);
      }
    });
    // The core assigns the stencil values and only reapplies when something changed.
    syncStencilValues(shown);
  }
});

// Starts the driver on the scene. The entry point calls it while bootstrapping; from then on it
// runs once per frame, inside the render loop.
export function startFrameDriver() {
  const scene = document.querySelector('a-scene');
  if (scene) scene.setAttribute('portal-driver', '');
}

// ---- the portal as data (Fase 3) ----

// Creates the entity of one portal of the scene data (docs/ROADMAP.md, section 5.4). This is the
// only place that knows how the data's fields are spelled on the component: the two axes become
// `windowKind`/`actionKind` (and, for the pair, the two dimensions), and `frame {color,
// thickness}` becomes two fields. A field the data does not have is left out so the component's
// own default applies.
//
// The element is built detached and added at the end, so A-Frame initialises the component once
// with everything in place — the mask and the four bars are built once (law L7).
export function createPortal(portal, parent, derived = {}) {
  const windowAxis = portal.window || {};
  const actionAxis = portal.action || {};
  const settings = {
    id: portal.id,
    ownedBy: portal.ownedBy,
    windowKind: windowAxis.kind,
    actionKind: actionAxis.kind,
    width: portal.width,
    height: portal.height,
    box: vector(portal.box)
  };
  // The pair is the only kind that carries two dimensions of its own (D25).
  if (windowAxis.kind === 'dimension-pair') {
    settings.dimensionA = windowAxis.dimensionA;
    settings.dimensionB = windowAxis.dimensionB;
  }
  // What the door's own data does not carry: the portrait's dimension is derived by the builder
  // (D26), and the destination is only read when the action navigates.
  if (typeof derived.previewDimension === 'number') settings.previewDimension = derived.previewDimension;
  if (actionAxis.kind === 'navigate' && typeof actionAxis.target === 'string') settings.target = actionAxis.target;
  // The name it shows in the debug view (D39) is written by the builder, from the world's data.
  if (typeof derived.label === 'string' && derived.label) settings.label = derived.label;
  if (derived.labelAlways) settings.labelAlways = true;
  if (portal.boxPosition) settings.boxPosition = vector(portal.boxPosition);
  if (portal.boxRotation) settings.boxRotation = vector(portal.boxRotation);
  if (portal.trigger) settings.trigger = portal.trigger;
  if (portal.frame) {
    if (portal.frame.color) settings.frameColor = portal.frame.color;
    if (typeof portal.frame.thickness === 'number') settings.frameThickness = portal.frame.thickness;
  }
  // O movimento animado (D59). Os valores que o dado não escrever ficam com os defaults do componente
  // (uma volta em 20 s, no eixo vertical), e o `radius` só existe em `orbit`.
  if (portal.motion && portal.motion.kind) {
    settings.motionKind = portal.motion.kind;
    if (typeof portal.motion.period === 'number') settings.motionPeriod = portal.motion.period;
    if (portal.motion.axis) settings.motionAxis = vector(portal.motion.axis);
    if (typeof portal.motion.radius === 'number') settings.motionRadius = portal.motion.radius;
  }

  const el = document.createElement('a-entity');
  el.setAttribute('position', vector(portal.position));
  if (portal.rotation) el.setAttribute('rotation', vector(portal.rotation));
  el.setAttribute(PORTAL_COMPONENT, settings);
  parent.appendChild(el);
  return el;
}

// Removing the entity is enough: the component's remove() above disposes the geometry, the
// materials and the registry entry.
export function removePortal(el) {
  if (el) el.remove();
}
