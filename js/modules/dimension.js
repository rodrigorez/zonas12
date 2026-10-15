// The dimension module: a dimension is an ID plus the 360º background that its content sits in.
// One entity per dimension carries this component, and the sphere is the background the visitor
// sees when that dimension is the active one.
//
// It asks the camera where the player is instead of looking for the element itself
// (docs/ROADMAP.md, A5), and it registers and unregisters its sphere with the core, so removing
// a dimension does not leave dead entries behind (A4).
import { state, registerContent, unregisterContent } from '../core/index.js';
import { playerCamera } from './camera.js';

AFRAME.registerComponent('dimension-panorama', {
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
