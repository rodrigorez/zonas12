// A dimensão de teste: o equivalente de `dimension-panorama` (js/modules/dimension.js), mas o fundo
// esférico vem de um sketch do p5.js em vez de uma imagem. A esfera se regista no núcleo exatamente
// como a original, por isso o stencil e os portais tratam-na como qualquer outra dimensão.
//
// O sketch não corre sozinho: o motor (engine.js) decide quando redesenhar, e a textura só é
// reenviada à GPU quando houve um desenho novo.
import { state, registerContent, unregisterContent } from '../js/core/index.js';
import { playerCamera } from '../js/modules/camera.js';
import { SKETCHES } from './sketches.js';

const STATIC_TIME = 2;

// dimensão -> cena, para o motor perguntar quem existe e quanto custa desenhar
export const scenes = new Map();

AFRAME.registerComponent('p5-dimension', {
  schema: {
    dimension: { type: 'int', default: 0 },
    sketch: { type: 'int', default: 0 },
    radius: { default: 500 },
    width: { default: 1024 }
  },
  init: function () {
    const component = this;
    const definition = SKETCHES[this.data.sketch % SKETCHES.length];
    const width = this.data.width;
    const clock = { t: STATIC_TIME };

    const scene = {
      id: this.data.dimension,
      name: definition.name,
      avgDrawMs: 0,
      draws: 0,
      lastDraw: 0,
      animating: false,
      texture: null,
      p5: null,
      redraw(seconds) {
        clock.t = seconds;
        const started = performance.now();
        this.p5.redraw();
        const cost = performance.now() - started;
        this.avgDrawMs = this.draws === 0 ? cost : this.avgDrawMs * 0.9 + cost * 0.1;
        this.draws++;
        this.texture.needsUpdate = true;
      }
    };
    this.scene = scene;

    this.ready = new Promise((resolve) => {
      new p5((p) => {
        p.setup = () => {
          scene.p5 = p;
          p.pixelDensity(1);
          const canvas = p.createCanvas(width, width / 2);
          canvas.style('display', 'none');
          p.noLoop();
          component.build(scene, canvas.elt);
          resolve();
        };
        p.draw = () => definition.draw(p, clock.t);
      });
    });
  },
  build: function (scene, canvas) {
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    scene.texture = texture;

    // Três desenhos para o custo medido não incluir o aquecimento do JavaScript.
    for (let i = 0; i < 3; i++) scene.redraw(STATIC_TIME);
    scene.draws = 0;

    this.el.setAttribute('data-dimension', this.data.dimension);
    this.material = new THREE.MeshBasicMaterial({
      map: texture, side: THREE.BackSide, depthWrite: false, toneMapped: false,
      stencilWrite: true, stencilWriteMask: 0xFF, stencilFuncMask: 0xFF
    });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(this.data.radius, 64, 48), this.material);
    sphere.name = 'dimension-' + this.data.dimension + '-p5';
    sphere.renderOrder = state.drawOrder.panorama;
    sphere.frustumCulled = false;
    this.el.setObject3D('panorama', sphere);
    registerContent(this.data.dimension, sphere, 'panorama');
    scenes.set(this.data.dimension, scene);
  },
  tick: function () {
    const sphere = this.el.getObject3D('panorama');
    if (!sphere) return;
    const position = playerCamera.position();
    if (position) sphere.position.copy(position);
  },
  remove: function () {
    const sphere = this.el.getObject3D('panorama');
    if (sphere) {
      unregisterContent(this.data.dimension, sphere);
      this.el.removeObject3D('panorama');
      sphere.geometry.dispose();
    }
    if (this.material) {
      this.material.map.dispose();
      this.material.dispose();
      this.material = null;
    }
    scenes.delete(this.data.dimension);
    if (this.scene && this.scene.p5) this.scene.p5.remove();
  }
});

// Cria a entidade de uma dimensão p5 e devolve-a com a promessa de estar pronta.
export function createP5Dimension({ id, sketch, width }, parent) {
  const el = document.createElement('a-entity');
  el.setAttribute('p5-dimension', { dimension: id, sketch, width });
  parent.appendChild(el);
  // A-Frame só inicia o componente quando a entidade carrega, por isso a promessa espera por isso.
  const ready = new Promise((resolve) => {
    el.addEventListener('loaded', () => resolve(el.components['p5-dimension'].ready), { once: true });
  }).then((built) => built);
  return { el, ready };
}
