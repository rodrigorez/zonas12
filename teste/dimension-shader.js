// Dimensão cujo fundo é um fragment shader. Regista-se no núcleo como `dimension-panorama`, e o
// motor (engine.js) só atualiza `uTime`: o desenho acontece na GPU, a cada quadro, só onde o
// stencil deixa. `continuous` diz ao motor para atualizar o tempo em todo quadro.
import { state, registerContent, unregisterContent } from '../js/core/index.js';
import { playerCamera } from '../js/modules/camera.js';
import { scenes } from './dimension-p5.js';
import { SHADERS, VERTEX } from './shaders.js';

const STATIC_TIME = 2;

AFRAME.registerComponent('shader-dimension', {
  schema: { dimension: { type: 'int', default: 0 }, shader: { type: 'int', default: 0 }, radius: { default: 500 } },
  init: function () {
    const definition = SHADERS[this.data.shader % SHADERS.length];
    this.material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: STATIC_TIME } },
      vertexShader: VERTEX, fragmentShader: definition.fragment,
      side: THREE.BackSide, depthWrite: false
    });
    const material = this.material;
    scenes.set(this.data.dimension, {
      id: this.data.dimension, name: definition.name, avgDrawMs: 0, draws: 0, lastDraw: 0,
      animating: false, continuous: true,
      redraw(seconds) { material.uniforms.uTime.value = seconds; }
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(this.data.radius, 48, 32), this.material);
    sphere.renderOrder = state.drawOrder.panorama;
    sphere.frustumCulled = false;
    this.el.setObject3D('panorama', sphere);
    registerContent(this.data.dimension, sphere, 'panorama');
  },
  tick: function () {
    const sphere = this.el.getObject3D('panorama');
    const position = sphere && playerCamera.position();
    if (position) sphere.position.copy(position);
  },
  remove: function () {
    const sphere = this.el.getObject3D('panorama');
    if (sphere) {
      unregisterContent(this.data.dimension, sphere);
      this.el.removeObject3D('panorama');
      sphere.geometry.dispose();
    }
    this.material.dispose();
    scenes.delete(this.data.dimension);
  }
});

export function createShaderDimension({ id, shader }, parent) {
  const el = document.createElement('a-entity');
  el.setAttribute('shader-dimension', { dimension: id, shader });
  parent.appendChild(el);
  return el;
}
