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

// Reused vectors: the driver and the collision run every frame and must not allocate.
const _worldPoint = new THREE.Vector3();
const _boxPoint = new THREE.Vector3();

AFRAME.registerComponent('stencil-portal', {
  schema: {
    id: { type: 'int', default: 0 },
    // The two dimensions this portal links. Bidirectional: in A it shows B and in B it shows A.
    dimensionA: { type: 'int', default: 0 },
    dimensionB: { type: 'int', default: 1 },
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
    trigger: { type: 'string', default: 'plane', oneOf: ['plane', 'box'] }
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

    this.configureBox();
    this.buildFrame();

    registerPortal(this);
    // The core does not know about portals: it announces the stencil changed and every window
    // refreshes itself.
    this.unsubscribeStencil = on('stencil:changed', () => this.refreshWindow());
    this.refreshWindow();
  },
  remove: function () {
    if (this.unsubscribeStencil) this.unsubscribeStencil();
    unregisterPortal(this);
    // The mask, the frame and the debug box are built here by hand, so nobody else releases
    // them: without this the geometry and the materials of a removed portal stay alive.
    this.portalGroup.children.slice().forEach(function (child) {
      if (child.geometry) child.geometry.dispose();
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach(function (material) {
        if (material) material.dispose();
      });
    });
  },
  // The dimension this window shows right now (null if the portal has nothing to do with the
  // dimension the visitor is in, or if it belongs to another dimension).
  shownDimension: function () {
    const active = state.activeDimension;
    if (this.data.ownedBy >= 0 && active !== this.data.ownedBy) return null;
    if (active === this.data.dimensionA) return this.data.dimensionB;
    if (active === this.data.dimensionB) return this.data.dimensionA;
    return null;
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
    const frameMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
    const thickness = 0.3;
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
  // Tells the mask which value to write (the one of the dimension the window shows).
  refreshWindow: function () {
    const dimension = this.shownDimension();
    this.portalGroup.visible = dimension !== null;
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
  // from the same values.
  update: function () { this.configureBox(); },
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
      return;
    }
    this.buildDebugBox();
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

    const active = state.activeDimension;
    setActiveDimension(active === this.data.dimensionA ? this.data.dimensionB : this.data.dimensionA);
  }
});

// One pass per frame for the whole scene: every portal detects its own traversal and the core
// decides what each window shows. A single place decides, so several portals never disagree.
AFRAME.registerComponent('portal-driver', {
  tick: function () {
    state.portals.slice().forEach(function (portal) {
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
