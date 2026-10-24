// O retrato de uma porta de mundo, desenhado pela prÃ³pria exposiÃ§Ã£o (D46).
//
// Porque existe: a janela de uma porta de mundo mostrava o **panorama** do destino, e a chegada a esse
// destino mostra o panorama **mais as obras e as portas dele**. O que se via ao atravessar era, por
// isso, uma imagem diferente da que estava no ecrÃ£ â€” medido: o salto no corte ia de **0,68 a 13,36**
// nas seis portas com retrato.
//
// O que faz: abre o mundo de destino com `?from=<origem>`, deixa o `arrivalPoint` pÃ´r a cÃ¢mara onde o
// visitante vai aparecer (uma sÃ³ casa para a geometria â€” L16), desenha seis faces de cubo a partir
// dali e converte-as numa equirretangular 2:1 â€” com as obras e as portas lÃ¡ dentro, porque sÃ£o a
// cena. O ficheiro Ã© o retrato que a porta vai mostrar, e Ã© por isso que atravessar deixa de mudar a
// imagem.
//
// O retrato Ã© um **asset derivado**: regere-o quando a sala mudar (mover uma obra muda o retrato das
// portas que a mostram). E regere-o **duas vezes**: o retrato de um mundo contÃ©m as janelas das
// portas desse mundo, que sÃ£o retratos deles prÃ³prios â€” a primeira passagem cozinha o que lÃ¡ estava,
// a segunda o que lÃ¡ ficou. Medido, o mesmo retrato saiu com 438, 215 e 378 kB em passagens seguidas;
// a costura nÃ£o se mexe com isso (0,37 antes e depois), mas o ficheiro sim.
//
// A esfera onde o retrato Ã© mostrado fica centrada Ã  **altura dos olhos** (D47), que Ã© a altura de
// onde este cubo Ã© desenhado â€” Ã© o que faz a imagem atravÃ©s da porta ser a imagem da chegada.
//
// Uso, da raiz do projeto:
//   node tools/scene/portrait.mjs --todos
//   node tools/scene/portrait.mjs <mundo> <origem> [ficheiro]
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { serveProject, openBrowser, ROOT, sleep } from '../regression/harness.mjs';

// O tamanho da imagem. Enquanto o fundo era um panorama, quem mandava era a resoluÃ§Ã£o: medido na
// porta mais difÃ­cil (praia 4 â†’ cidade), 2560x1280 deixava a costura em **0,58** (falhava a meta de
// 0,50) e 3072x1536 em **0,41 a 0,47**. Com o shader como fundo isso deixa de existir â€” o cÃ©u, o mar
// e o chÃ£o sÃ£o calculados e chegam exatos â€”, e o retrato sÃ³ carrega as obras e as portas. Fica o
// tamanho padrÃ£o das imagens do projeto (2048x1024, lei L14): 8 MiB de textura por retrato em vez de
// 18, que Ã© o que um PowerVR GE8320 (o aparelho fraco do ensaio de 2026-10) agradece.
//
// A qualidade do JPEG quase nÃ£o conta (0,85 dava 0,39 e 0,75 dava 0,40 a 4096); quem mandava era a
// resoluÃ§Ã£o.
const TAMANHO = { largura: 2048, altura: 1024, face: 1536, qualidade: 0.85 };

// As seis portas com retrato, como (mundo de destino, mundo de origem): Ã© o par que diz de onde a
// cÃ¢mara parte para desenhar a chegada. `--todos` desenha as seis.
const PORTAS = [
  ['scene1', 'gate'],
  ['scene2', 'gate'],
  ['scene2', 'scene1'],
  ['scene1', 'scene2'],
  ['scene3', 'scene2'],
  ['scene2', 'scene3']
];

const todos = process.argv[2] === '--todos';
const mundo = todos ? null : process.argv[2];
const origem = todos ? null : process.argv[3];
if (!todos && (!mundo || !origem)) {
  console.error('uso: node tools/scene/portrait.mjs <mundo> <origem> [ficheiro]');
  console.error('     node tools/scene/portrait.mjs --todos');
  console.error('exemplo: node tools/scene/portrait.mjs scene1 scene2');
  process.exit(1);
}

// O desenho, dentro da pÃ¡gina: cubo a partir da cÃ¢mara de chegada, e o cubo desdobrado.
const DESENHAR = (largura, altura, face, qualidade) => `(async () => {
  const cena = document.querySelector('a-scene');
  const renderer = cena.renderer;
  const camera = cena.camera;
  const cena3d = cena.object3D;
  if (!renderer || !camera || !cena3d) return { erro: 'sem renderer ou cÃ¢mara' };

  // O cursor Ã© interface, nÃ£o paisagem: nÃ£o entra no retrato.
  const cursor = document.querySelector('a-cursor');
  if (cursor) cursor.setAttribute('visible', false);

  const posicao = new THREE.Vector3();
  camera.getWorldPosition(posicao);

  // O fundo da cena Ã© transparente (alpha 0); num retrato isso seria preto, e uma imagem opaca Ã© o
  // que o visitante vÃª.
  renderer.setClearColor(0x000000, 1);

  const alvoCubo = new THREE.WebGLCubeRenderTarget(${face}, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
  });
  const cubo = new THREE.CubeCamera(0.1, 4000, alvoCubo);
  cubo.position.copy(posicao);
  // O retrato tem de casar com o primeiro quadro do destino: o shader comeÃ§a congelado no tempo
  // estÃ¡tico da polÃ­tica (2), e Ã© esse o instante que o retrato guarda.
  cena3d.traverse((object) => {
    if (object.material && object.material.uniforms && object.material.uniforms.uTime) {
      object.material.uniforms.uTime.value = 2;
    }
  });
  cubo.update(renderer, cena3d);

  const alvo = new THREE.WebGLRenderTarget(${largura}, ${altura}, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat
  });
  const material = new THREE.ShaderMaterial({
    uniforms: { mapa: { value: alvoCubo.texture } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    // A convenÃ§Ã£o da esfera do three (SphereGeometry com phi 0..2Ï€ e theta 0..Ï€, uv = (u, 1-v)):
    // o topo da imagem olha para cima, e a coluna 0 para -X. A cor sai como estÃ¡: o render target do
    // three jÃ¡ entrega sRGB, e codificar outra vez (medido) estraga a imagem toda â€” 47,8 de costura.
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
  const quadrado = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  const desenho = new THREE.Scene();
  desenho.add(quadrado);
  const camaraDoDesenho = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  renderer.setRenderTarget(alvo);
  renderer.render(desenho, camaraDoDesenho);
  const pixels = new Uint8Array(${largura} * ${altura} * 4);
  renderer.readRenderTargetPixels(alvo, 0, 0, ${largura}, ${altura}, pixels);
  renderer.setRenderTarget(null);
  renderer.setClearColor(0x000000, 0);

  const tela = document.createElement('canvas');
  tela.width = ${largura};
  tela.height = ${altura};
  const contexto = tela.getContext('2d');
  const dados = contexto.createImageData(${largura}, ${altura});
  // O readback comeÃ§a na linha de baixo; a imagem comeÃ§a em cima.
  for (let y = 0; y < ${altura}; y++) {
    const origem = (${altura} - 1 - y) * ${largura} * 4;
    dados.data.set(pixels.subarray(origem, origem + ${largura} * 4), y * ${largura} * 4);
  }
  for (let i = 3; i < dados.data.length; i += 4) dados.data[i] = 255;
  contexto.putImageData(dados, 0, 0);
  return { imagem: tela.toDataURL('image/jpeg', ${qualidade}), posicao: [posicao.x, posicao.y, posicao.z] };
})()`;

async function gerar(mundo, origem, destino) {
  const tamanho = TAMANHO;
  const site = await serveProject();
  const browser = await openBrowser({ width: 1280, height: 800, camera: true });
  try {
    const url = site.base + '/' + mundo + '/?from=' + origem + '&bust=' + Date.now();
    const pronta = await browser.goto(url, 90000);
    if (!pronta) throw new Error('a cena de ' + mundo + ' nÃ£o ficou pronta');
    // A cena sÃ³ estÃ¡ construÃ­da quando as portas existem: o `world` Ã© escrito antes do build.
    for (let i = 0; i < 240; i++) {
      if (await browser.evaluate('Boolean(window.portalDebug.state.portals.length)').catch(() => false)) break;
      await sleep(250);
    }
    await sleep(2500);
    // O `?from=` tem de ter posto a cÃ¢mara no sÃ­tio: se nÃ£o pÃ´s, o mundo nÃ£o tem porta de chegada
    // para esta origem e o retrato sairia do lugar errado.
    const chegada = await browser.evaluate(`(() => {
      const cena = document.querySelector('a-scene');
      const camera = cena.camera;
      const posicao = new THREE.Vector3();
      camera.getWorldPosition(posicao);
      return { mundo: window.portalDebug.world, posicao: [posicao.x, posicao.y, posicao.z] };
    })()`);
    console.log('mundo ' + mundo + ' a chegar de ' + origem + ': cÃ¢mara em [' +
      chegada.posicao.map((valor) => Math.round(valor * 100) / 100).join(', ') + ']');

    const desenho = await browser.evaluate(
      DESENHAR(tamanho.largura, tamanho.altura, tamanho.face, tamanho.qualidade), 120000);
    if (!desenho || !desenho.imagem) throw new Error('o desenho falhou: ' + JSON.stringify(desenho));

    const bytes = Buffer.from(desenho.imagem.split(',')[1], 'base64');
    const caminho = join(ROOT, destino);
    mkdirSync(join(ROOT, 'assets', 'previews'), { recursive: true });
    writeFileSync(caminho, bytes);
    console.log('escrito ' + destino + ': ' + tamanho.largura + 'x' + tamanho.altura + ', ' +
      Math.round(bytes.length / 1024) + ' kB');
  } finally {
    await browser.close();
    await site.close();
  }
}

async function main() {
  if (todos) {
    for (const [de, de_origem] of PORTAS) {
      await gerar(de, de_origem, join('assets', 'previews', de + '-de-' + de_origem + '.jpg'));
    }
    return;
  }
  await gerar(mundo, origem, process.argv[4] || join('assets', 'previews', mundo + '-de-' + origem + '.jpg'));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
