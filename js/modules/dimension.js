// The dimension module: a dimension is an ID plus the 360º background that its content sits in.
// One entity per dimension carries this component, and the sphere is the background the visitor
// sees when that dimension is the active one.
//
// It asks the camera where the player is instead of looking for the element itself
// (docs/ROADMAP.md, A5), and it registers and unregisters its sphere with the core, so removing
// a dimension does not leave dead entries behind (A4).
import { state, registerContent, unregisterContent } from '../core/index.js';
import { playerCamera } from './camera.js';

const DIMENSION_COMPONENT = 'dimension-panorama';

// A-Frame's vec3 in the object form needs { x, y, z }: an array there is read as an object with no
// axes and falls back to the default, silently (measured in A-Frame 1.8, utils/coordinates.js
// parse). The data writes vectors as arrays, so the factory translates.
const vector = (value) => ({ x: value[0], y: value[1], z: value[2] });

AFRAME.registerComponent(DIMENSION_COMPONENT, {
  schema: {
    dimension: { type: 'int', default: 0 },
    src: { type: 'selector' },
    radius: { default: 100 },
    followCamera: { type: 'boolean', default: true }
  },
  // A-Frame calls `update` right after `init` (and whenever the attribute changes), so building
  // the sphere here avoids building it twice.
  update: function () { this.build(); },
  build: function () {
    const source = this.data.src;
    if (!source) return;
    this.el.setAttribute('data-dimension', this.data.dimension);
    this.el.classList.add('dimension-' + this.data.dimension);

    const previous = this.el.getObject3D('panorama');
    if (previous) { this.el.removeObject3D('panorama'); previous.geometry.dispose(); }

    // Video (the webcam, for example) has to use VideoTexture: a plain Texture would keep the
    // first frame frozen.
    const isVideo = source.tagName === 'VIDEO';
    const texture = isVideo ? new THREE.VideoTexture(source) : new THREE.Texture(source);
    texture.minFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    if (isVideo) {
      if (source.readyState >= 2) texture.needsUpdate = true;
      else source.addEventListener('loadeddata', () => { texture.needsUpdate = true; });
    } else if (source.complete) {
      texture.needsUpdate = true;
    } else {
      source.onload = () => { texture.needsUpdate = true; };
    }

    const drawOrder = state.drawOrder;
    this.material = new THREE.MeshBasicMaterial({
      map: texture, side: THREE.BackSide, depthWrite: false,
      stencilWrite: true, stencilWriteMask: 0xFF, stencilFuncMask: 0xFF
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(this.data.radius, 64, 64), this.material);
    sphere.name = 'dimension-' + this.data.dimension + '-panorama';
    sphere.renderOrder = drawOrder.panorama;
    sphere.frustumCulled = false;
    this.el.setObject3D('panorama', sphere);
    registerContent(this.data.dimension, sphere, 'panorama');
  },
  tick: function () {
    const sphere = this.el.getObject3D('panorama');
    if (!sphere || !this.data.followCamera) return;
    const position = playerCamera.position();
    if (position) sphere.position.copy(position);
  },
  // The other half of A4. The sphere, its material and its texture are built here by hand, so
  // nobody else releases them: the entity leaving the scene takes the entry out of the registry
  // and gives the GPU memory back.
  remove: function () {
    const sphere = this.el.getObject3D('panorama');
    if (sphere) {
      unregisterContent(this.data.dimension, sphere);
      this.el.removeObject3D('panorama');
      sphere.geometry.dispose();
    }
    if (this.material) {
      if (this.material.map) this.material.map.dispose();
      this.material.dispose();
      this.material = null;
    }
  }
});

// ---- the dimension as data (Fase 3) ----

// Creates the entity of one dimension of the scene data. A dimension of kind `camera` is the
// real world behind dimension 0: it has no 360º background and therefore no entity — the webcam
// is the background.
//
// The element is built detached and only then added to the scene: A-Frame initialises the
// component once, with the attributes already in place, and the sphere is built once (the trap
// law L7 describes).
export function createDimension(dimension, parent) {
  if (!dimension || dimension.kind === 'camera') return null;

  const settings = { dimension: dimension.id };
  if (dimension.asset) settings.src = '#' + dimension.asset;
  if (typeof dimension.radius === 'number') settings.radius = dimension.radius;
  if (typeof dimension.followCamera === 'boolean') settings.followCamera = dimension.followCamera;

  const el = document.createElement('a-entity');
  // The position is not a field of the format: it is what the builder passes for a portrait, whose
  // sphere sits at the door (D26) — the sphere of a declared dimension follows the camera or sits at
  // the origin. It is set before the entity is added, so the component initialises once (law L7).
  if (Array.isArray(dimension.position)) el.setAttribute('position', vector(dimension.position));
  el.setAttribute(DIMENSION_COMPONENT, settings);
  parent.appendChild(el);
  return el;
}

// Removing the entity is enough: the component's remove() above takes the registry entry and the
// GPU memory with it.
export function removeDimension(el) {
  if (el) el.remove();
}
