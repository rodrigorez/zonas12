// O conversor do retrato é fiel? Passa-se um panorama **conhecido** por esfera -> cubo ->
// equirretangular e compara-se com o original. Se a diferença for pequena, o erro da costura não está
// aqui; se for grande, está, e sabe-se onde.
// Run from the project root: node <this file> [panorama.jpg]
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { serveProject, openBrowser, difference, sleep } from './harness.mjs';

const panorama = process.argv[2] || 'assets/panoramas/cidade-d0-forest.jpg';
const LARGURA = 1024;
const ALTURA = 512;
const FACE = 512;

const TESTE = (panorama, largura, altura, face) => `(async () => {
  const textura = await new THREE.TextureLoader().loadAsync('${panorama}');
  textura.colorSpace = THREE.SRGBColorSpace;
  textura.mapping = THREE.EquirectangularReflectionMapping;

  // A esfera do three, como a app a constrói: raio, BackSide, e a imagem como mapa.
  const cena = new THREE.Scene();
  const esfera = new THREE.Mesh(
    new THREE.SphereGeometry(500, 64, 64),
    new THREE.MeshBasicMaterial({ map: textura, side: THREE.BackSide })
  );
  cena.add(esfera);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(640, 320);
  renderer.toneMapping = THREE.NoToneMapping;

  // 1) o cubo, do centro da esfera
  const alvoCubo = new THREE.WebGLCubeRenderTarget(${face}, {
    generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter
  });
  const cubo = new THREE.CubeCamera(0.1, 4000, alvoCubo);
  cubo.position.set(0, 0, 0);
  cubo.update(renderer, cena);

  // 2) o cubo desdobrado, com a convenção da esfera do three
  const alvo = new THREE.WebGLRenderTarget(${largura}, ${altura}, {
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, format: THREE.RGBAFormat
  });
  const material = new THREE.ShaderMaterial({
    uniforms: { mapa: { value: alvoCubo.texture } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: [
      'uniform samplerCube mapa;',
      'varying vec2 vUv;',
      'void main() {',
      '  float theta = 3.141592653589793 * (1.0 - vUv.y);',
      '  float phi = 6.283185307179586 * vUv.x;',
      '  vec3 direcao = vec3(-cos(phi) * sin(theta), cos(theta), sin(phi) * sin(theta));',
      '  gl_FragColor = vec4(textureCube(mapa, direcao).rgb, 1.0);',
      '}'
    ].join('\\n')
  });
  const desenho = new THREE.Scene();
  desenho.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));
  const ortografica = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  renderer.setRenderTarget(alvo);
  renderer.render(desenho, ortografica);
  const pixels = new Uint8Array(${largura} * ${altura} * 4);
  renderer.readRenderTargetPixels(alvo, 0, 0, ${largura}, ${altura}, pixels);
  renderer.setRenderTarget(null);

  const tela = document.createElement('canvas');
  tela.width = ${largura};
  tela.height = ${altura};
  const contexto = tela.getContext('2d');
  const dados = contexto.createImageData(${largura}, ${altura});
  for (let y = 0; y < ${altura}; y++) {
    const origem = (${altura} - 1 - y) * ${largura} * 4;
    dados.data.set(pixels.subarray(origem, origem + ${largura} * 4), y * ${largura} * 4);
  }
  for (let i = 3; i < dados.data.length; i += 4) dados.data[i] = 255;
  contexto.putImageData(dados, 0, 0);

  // 3) a comparação: o mesmo tamanho, por blocos 4x4
  const assinatura = (fonte, largura, altura) => {
    const c = document.createElement('canvas');
    c.width = 160;
    c.height = Math.round(160 * altura / largura);
    const ctx = c.getContext('2d');
    ctx.drawImage(fonte, 0, 0, c.width, c.height);
    const p = ctx.getImageData(0, 0, c.width, c.height).data;
    const blocos = [];
    for (let by = 0; by < 4; by++) {
      for (let bx = 0; bx < 4; bx++) {
        let soma = 0, n = 0;
        const x0 = Math.floor(bx * c.width / 4), x1 = Math.floor((bx + 1) * c.width / 4);
        const y0 = Math.floor(by * c.height / 4), y1 = Math.floor((by + 1) * c.height / 4);
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const at = (y * c.width + x) * 4;
            soma += 0.299 * p[at] + 0.587 * p[at + 1] + 0.114 * p[at + 2];
            n++;
          }
        }
        blocos.push(soma / n);
      }
    }
    return blocos;
  };

  const original = new Image();
  await new Promise((done, fail) => { original.onload = done; original.onerror = fail; original.src = '${panorama}'; });
  return {
    original: assinatura(original, original.naturalWidth, original.naturalHeight),
    convertido: assinatura(tela, ${largura}, ${altura}),
    imagem: tela.toDataURL('image/jpeg', 0.9),
    tamanhoOriginal: original.naturalWidth + 'x' + original.naturalHeight
  };
})()`;

async function main() {
  const site = await serveProject();
  const browser = await openBrowser({ width: 640, height: 320, camera: false });
  try {
    await browser.goto(site.base + '/praia/?bust=' + Date.now(), 60000);
    await sleep(1500);
    const resultado = await browser.evaluate(TESTE(panorama, LARGURA, ALTURA, FACE), 120000);
    if (!resultado || !resultado.convertido) throw new Error('o teste não correu');
    const salto = difference({ blocks: resultado.original }, { blocks: resultado.convertido });
    console.log('panorama ' + panorama + ' (' + resultado.tamanhoOriginal + ')');
    console.log('diferença média por bloco (original vs convertido): ' + salto.toFixed(2));
    const linhas = [];
    for (let i = 0; i < 16; i++) {
      const diferenca = Math.abs(resultado.original[i] - resultado.convertido[i]);
      if (i % 4 === 0) linhas.push([]);
      linhas[linhas.length - 1].push(diferenca.toFixed(1).padStart(6));
    }
    linhas.forEach((linha) => console.log('   ' + linha.join('')));
    writeFileSync(join(process.cwd(), 'ida-e-volta.jpg'), Buffer.from(resultado.imagem.split(',')[1], 'base64'));
    console.log('escrito ida-e-volta.jpg (o convertido, para se ver)');
  } finally {
    await browser.close();
    await site.close();
  }
}

main().catch((error) => { console.error(error); process.exit(1); });
