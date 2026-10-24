// The dimension module: a dimension is an ID plus the 360º background that its content sits in.
// One entity per dimension carries this component, and the sphere is the background the visitor
// sees when that dimension is the active one.
//
// Three backgrounds come out of here, and they share the sphere, the stencil write and the
// registration with the core (so a dimension that leaves takes its GPU memory with it, A4):
//
//   · an image or a video, as a texture (Fase 3);
//   · a shader from the internal list, animated by the cadence policy of R15 — the trial that stays
//     behind `?shader=1` until the A/B on three devices closes R14;
//   · the image fallback of a shader dimension, which is what a `kind: "shader"` world shows when the
//     flag is off, and what a shader swaps to when the context is lost.
//
// It asks the camera where the player is instead of looking for the element itself
// (docs/ROADMAP.md, A5), and it registers and unregisters its sphere with the core, so removing
// a dimension does not leave dead entries behind (A4).
import { state, registerContent, unregisterContent } from '../core/index.js';
import { playerCamera } from './camera.js';
import { VERTEX, shaderById, shadersEnabled } from './shaders.js';
import { shaderPolicy } from './shader-policy.js';

const DIMENSION_COMPONENT = 'dimension-panorama';

// A-Frame's vec3 in the object form needs { x, y, z }: an array there is read as an object with no
// axes and falls back to the default, silently (measured in A-Frame 1.8, utils/coordinates.js
// parse). The data writes vectors as arrays, so the factory translates.
const vector = (value) => ({ x: value[0], y: value[1], z: value[2] });

// What the instruments read: one entry per background built, and the page's policy (if a shader was
// built at all). `teste/` has its own engine; this is what the exhibition exposes.
const backgrounds = [];
let pagePolicy = null;

function textureFrom(source) {
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
  return texture;
}

// The stencil write is what makes the window of a portal possible (laws L2/L6): the background is
// drawn where the mask left value 0. Both materials carry it for the same reason.
const stencilWrite = { stencilWrite: true, stencilWriteMask: 0xFF, stencilFuncMask: 0xFF };

function imageMaterial(texture) {
  return new THREE.MeshBasicMaterial(Object.assign({
    map: texture, side: THREE.BackSide, depthWrite: false
  }, stencilWrite));
}

function shaderMaterial(definition) {
  return new THREE.ShaderMaterial(Object.assign({
    uniforms: { uTime: { value: 2 } },
    vertexShader: VERTEX,
    fragmentShader: definition.fragment,
    side: THREE.BackSide,
    depthWrite: false
  }, stencilWrite));
}

function pixelRatioAdapter(sceneEl) {
  const renderer = sceneEl && sceneEl.renderer;
  if (!renderer) return null;
  return {
    min: 1,
    max: Math.max(1, window.devicePixelRatio || 1),
    get: () => renderer.getPixelRatio(),
    set: (value) => {
      renderer.setPixelRatio(value);
      sceneEl.resize();
    }
  };
}

AFRAME.registerComponent(DIMENSION_COMPONENT, {
  schema: {
    dimension: { type: 'int', default: 0 },
    src: { type: 'selector' },
    radius: { default: 100 },
    followCamera: { type: 'boolean', default: true },
    // The id of a shader of the internal list, or empty for a texture background. The builder sets
    // it only when the trial's flag is open (js/modules/shaders.js).
    shader: { type: 'string', default: '' },
    // The image a shader dimension falls back to: loaded with every other asset before the build, so
    // swapping to it does not wait for the network.
    fallback: { type: 'selector' }
  },
  // A-Frame calls `update` right after `init` (and whenever the attribute changes), so building
  // the sphere here avoids building it twice.
  update: function () { this.build(); },
  build: function () {
    this.release();

    const definition = this.data.shader ? shaderById(this.data.shader) : null;
    const source = this.data.src;
    if (!definition && !source) return;
    this.el.setAttribute('data-dimension', this.data.dimension);
    this.el.classList.add('dimension-' + this.data.dimension);

    if (definition) {
      this.material = shaderMaterial(definition);
      this.shaderActive = true;
      pagePolicy = shaderPolicy(pixelRatioAdapter(this.el.sceneEl));
      this.policy = pagePolicy;
      this.listenForContextLoss();
    } else {
      this.material = imageMaterial(textureFrom(source));
      this.shaderActive = false;
    }

    const sphere = new THREE.Mesh(new THREE.SphereGeometry(this.data.radius, 64, 64), this.material);
    sphere.name = 'dimension-' + this.data.dimension + '-panorama';
    sphere.renderOrder = state.drawOrder.panorama;
    sphere.frustumCulled = false;
    this.sphere = sphere;
    this.el.setObject3D('panorama', sphere);
    registerContent(this.data.dimension, sphere, 'panorama');

    const component = this;
    this.entry = () => ({
      dimension: component.data.dimension,
      requested: component.data.shader ? 'shader' : 'image',
      mode: component.shaderActive ? 'shader' : 'image',
      shaderId: component.shaderActive ? component.data.shader : null
    });
    backgrounds.push(this.entry);
  },
  // The image the shader promised. The asset is already decoded (the builder waits for every asset
  // before it builds anything), so this is a material swap and not a download.
  useFallback: function (reason) {
    const source = this.data.fallback;
    if (!source || !this.sphere) return;
    console.warn('[shader] ' + reason + '; the background falls back to its image');
    const material = imageMaterial(textureFrom(source));
    this.sphere.material = material;
    if (this.material) {
      if (this.material.map) this.material.map.dispose();
      this.material.dispose();
    }
    this.material = material;
    this.policy = null;
    this.shaderActive = false;
  },
  listenForContextLoss: function () {
    const canvas = this.el.sceneEl && this.el.sceneEl.canvas;
    if (!canvas || this.onContextLost) return;
    this.onContextLost = () => this.useFallback('the WebGL context was lost');
    canvas.addEventListener('webglcontextlost', this.onContextLost, false);
  },
  tick: function () {
    const sphere = this.sphere;
    if (!sphere) return;
    if (this.data.followCamera) {
      const position = playerCamera.position();
      if (position) sphere.position.copy(position);
    }
    // The policy is one for the page and decides one frame for every background that asks in it.
    if (this.policy && this.policy.frame(performance.now())) {
      this.material.uniforms.uTime.value = this.policy.time();
    }
  },
  // The other half of A4. The sphere, its material and its texture are built here by hand, so
  // nobody else releases them: the entity leaving the scene takes the entry out of the registry
  // and gives the GPU memory back.
  release: function () {
    if (this.sphere) {
      unregisterContent(this.data.dimension, this.sphere);
      this.el.removeObject3D('panorama');
      this.sphere.geometry.dispose();
      this.sphere = null;
    }
    if (this.material) {
      if (this.material.map) this.material.map.dispose();
      this.material.dispose();
      this.material = null;
    }
    if (this.entry) {
      const at = backgrounds.indexOf(this.entry);
      if (at >= 0) backgrounds.splice(at, 1);
      this.entry = null;
    }
    this.policy = null;
    this.shaderActive = false;
  },
  remove: function () {
    this.release();
    const canvas = this.el.sceneEl && this.el.sceneEl.canvas;
    if (canvas && this.onContextLost) {
      canvas.removeEventListener('webglcontextlost', this.onContextLost, false);
      this.onContextLost = null;
    }
  }
});

// ---- the dimension as data (Fase 3) ----

// Creates the entity of one dimension of the scene data. A dimension of kind `camera` is the
// real world behind dimension 0: it has no 360º background and therefore no entity — the webcam
// is the background.
//
// A `kind: "shader"` dimension is the trial (R14/R15): with the flag open it builds the shader and
// keeps its fallback image ready; with the flag closed it builds the **same image** an image
// dimension would, so production is untouched and the world still shows something.
//
// The element is built detached and only then added to the scene: A-Frame initialises the
// component once, with the attributes already in place, and the sphere is built once (the trap
// law L7 describes).
export function createDimension(dimension, parent) {
  if (!dimension || dimension.kind === 'camera') return null;

  const settings = { dimension: dimension.id };
  const shader = dimension.kind === 'shader' ? shaderById(dimension.shaderId) : null;
  if (shader && shadersEnabled()) {
    settings.shader = shader.id;
    if (dimension.fallbackAsset) settings.fallback = '#' + dimension.fallbackAsset;
  } else if (dimension.kind === 'shader') {
    if (dimension.fallbackAsset) settings.src = '#' + dimension.fallbackAsset;
  } else if (dimension.asset) {
    settings.src = '#' + dimension.asset;
  }
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

// What the instruments read: which backgrounds were built, in which mode, and the page's cadence
// policy. The shader battery asks this instead of guessing from pixels.
export function shaderStatus() {
  return {
    enabled: shadersEnabled(),
    backgrounds: backgrounds.map((entry) => entry()),
    policy: pagePolicy ? pagePolicy.status() : null
  };
}
