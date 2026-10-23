AFRAME.registerComponent('p5-panorama', {
  init: function () {
    if (typeof p5 !== 'function') {
      throw new Error('p5.js não foi carregado; verifique a ligação à internet.');
    }

    const component = this;
    const status = document.getElementById('teste-info');
    const sketch = function (p) {
      p.setup = function () {
        p.pixelDensity(1);
        p.createCanvas(1024, 512);
        p.frameRate(30);
        status.textContent = 'Fundo gerado em p5.js · arraste para olhar · use WASD para mover';
        component.createPanorama(p);
      };

      p.draw = function () {
        const horizon = p.height * 0.52;
        const skyTop = p.color(8, 18, 48);
        const skyBottom = p.color(230, 105, 83);
        const seaTop = p.color(31, 79, 99);
        const seaBottom = p.color(4, 17, 35);

        for (let y = 0; y < p.height; y++) {
          const amount = y < horizon
            ? y / horizon
            : (y - horizon) / (p.height - horizon);
          p.stroke(p.lerpColor(y < horizon ? skyTop : seaTop, y < horizon ? skyBottom : seaBottom, amount));
          p.line(0, y, p.width, y);
        }
        p.noStroke();
        p.noStroke();
        const sunX = p.width * 0.97;
        for (let ring = 5; ring >= 0; ring--) {
          p.fill(255, 205, 143, 12 + ring * 2);
          p.circle(sunX, horizon - 72, 112 + ring * 30);
        }
        p.fill(255, 224, 165);
        p.circle(sunX, horizon - 72, 88);

        p.noFill();
        for (let row = 0; row < 14; row++) {
          const y = horizon + 10 + row * 14;
          const phase = p.frameCount * 0.045 + row * 0.7;
          p.stroke(180, 220, 221, 90 - row * 4);
          p.strokeWeight(row < 3 ? 2 : 1);
          p.beginShape();
          for (let x = 0; x <= p.width; x += 8) {
            const angle = (x / p.width) * p.TWO_PI;
            const wave = Math.sin(angle * 2 + phase) * (2 + row * 0.35);
            p.vertex(x, y + wave);
          }
          p.endShape();
        }
      };
    };

    this.sketch = new p5(sketch);
  },

  createPanorama: function (p) {
    const texture = new THREE.CanvasTexture(p.canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;

    this.material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      depthWrite: false,
      toneMapped: false
    });

    const sphere = new THREE.Mesh(new THREE.SphereGeometry(500, 64, 48), this.material);
    sphere.name = 'panorama-p5-generative';
    sphere.frustumCulled = false;
    this.el.setObject3D('panorama', sphere);
  },

  tick: function () {
    if (this.material && this.material.map) this.material.map.needsUpdate = true;
  },

  remove: function () {
    if (this.sketch) {
      this.sketch.remove();
      this.sketch = null;
    }
    const sphere = this.el.getObject3D('panorama');
    if (sphere) {
      this.el.removeObject3D('panorama');
      sphere.geometry.dispose();
    }
    if (this.material) {
      this.material.map.dispose();
      this.material.dispose();
      this.material = null;
    }
  }
});
