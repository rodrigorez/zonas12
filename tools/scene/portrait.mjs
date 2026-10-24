// O retrato de uma porta de mundo, desenhado pela própria exposição (D46).
//
// Porque existe: a janela de uma porta de mundo mostrava o **panorama** do destino, e a chegada a esse
// destino mostra o panorama **mais as obras e as portas dele**. O que se via ao atravessar era, por
// isso, uma imagem diferente da que estava no ecrã — medido: o salto no corte ia de **0,68 a 13,36**
// nas seis portas com retrato.
//
// O que faz: abre o mundo de destino com `?from=<origem>`, deixa o `arrivalPoint` pôr a câmara onde o
// visitante vai aparecer (uma só casa para a geometria — L16), desenha seis faces de cubo a partir
// dali e converte-as numa equirretangular 2:1 — com as obras e as portas lá dentro, porque são a
// cena. O ficheiro é o retrato que a porta vai mostrar, e é por isso que atravessar deixa de mudar a
// imagem.
//
// O retrato é um **asset derivado**: regere-o quando a sala mudar (mover uma obra muda o retrato das
// portas que a mostram). E regere-o **duas vezes**: o retrato de um mundo contém as janelas das
// portas desse mundo, que são retratos deles próprios — a primeira passagem cozinha o que lá estava,
// a segunda o que lá ficou. Medido, o mesmo retrato saiu com 438, 215 e 378 kB em passagens seguidas;
// a costura não se mexe com isso (0,37 antes e depois), mas o ficheiro sim.
//
// A esfera onde o retrato é mostrado fica centrada à **altura dos olhos** (D47), que é a altura de
// onde este cubo é desenhado — é o que faz a imagem através da porta ser a imagem da chegada.
//
// Uso, da raiz do projeto:
//   node tools/scene/portrait.mjs --todos
//   node tools/scene/portrait.mjs <mundo> <origem> [ficheiro]
import { join } from 'node:path';
import { writeFileSync, mkdirSync } from 'node:fs';
import { serveProject, openBrowser, ROOT, sleep } from '../regression/harness.mjs';

// O tamanho da imagem. Medido na porta mais difícil (praia 4 → cidade), com o centro do retrato já à
// altura dos olhos (D47): 2560x1280 deixa a costura em **0,58** (falha a meta de 0,50), 3072x1536 em
// **0,41 a 0,47** e 4096x2048 em **0,40**. A faixa do 3072 é real: o ficheiro não é estável entre
// passagens (ver acima), e o que a costura herda é o que lá estava.
//
// Fica **3072x1536**, e não 4096: a resolução a mais comprava 0,01 a 0,07 de margem e custava 32 MiB
// de textura por retrato em vez de 18 MiB — num PowerVR GE8320 (o aparelho fraco que o ensaio de
// 2026-10 mediu) a praia ia a **52 MiB** de texturas. O orçamento de imagem do ensaio (1024x512 no
// telemóvel, 4096 «não recomendado para móvel») aponta no mesmo sentido. Com o shader como fundo,
// esta decisão deixa de existir: a costura do céu e do mar passa a ser exata e o retrato só carrega
// as obras e as portas.
//
// A qualidade do JPEG quase não conta (0,85 dá 0,39 e 0,75 dá 0,40 a 4096); quem manda é a resolução.
const TAMANHO = { largura: 3072, altura: 1536, face: 1536, qualidade: 0.7 };

// As seis portas com retrato, como (mundo de destino, mundo de origem): é o par que diz de onde a
// câmara parte para desenhar a chegada. `--todos` desenha as seis.
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

// O desenho, dentro da página: cubo a partir da câmara de chegada, e o cubo desdobrado.
const DESENHAR = (largura, altura, face, qualidade) => `(async () => {
  const cena = document.querySelector('a-scene');
  const renderer = cena.renderer;
  const camera = cena.camera;
  const cena3d = cena.object3D;
  if (!renderer || !camera || !cena3d) return { erro: 'sem renderer ou câmara' };

  // O cursor é interface, não paisagem: não entra no retrato.
  const cursor = document.querySelector('a-cursor');
  if (cursor) cursor.setAttribute('visible', false);

  const posicao = new THREE.Vector3();
  camera.getWorldPosition(posicao);

  // O fundo da cena é transparente (alpha 0); num retrato isso seria preto, e uma imagem opaca é o
  // que o visitante vê.
  renderer.setClearColor(0x000000, 1);

  const alvoCubo = new THREE.WebGLCubeRenderTarget(${face}, {
    generateMipmaps: true,
    minFilter: THREE.LinearMipmapLinearFilter
  });
  const cubo = new THREE.CubeCamera(0.1, 4000, alvoCubo);
  cubo.position.copy(posicao);
  cubo.update(renderer, cena3d);

  const alvo = new THREE.WebGLRenderTarget(${largura}, ${altura}, {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat
  });
  const material = new THREE.ShaderMaterial({
    uniforms: { mapa: { value: alvoCubo.texture } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    // A convenção da esfera do three (SphereGeometry com phi 0..2π e theta 0..π, uv = (u, 1-v)):
    // o topo da imagem olha para cima, e a coluna 0 para -X. A cor sai como está: o render target do
    // three já entrega sRGB, e codificar outra vez (medido) estraga a imagem toda — 47,8 de costura.
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
  // O readback começa na linha de baixo; a imagem começa em cima.
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
    if (!pronta) throw new Error('a cena de ' + mundo + ' não ficou pronta');
    // A cena só está construída quando as portas existem: o `world` é escrito antes do build.
    for (let i = 0; i < 240; i++) {
      if (await browser.evaluate('Boolean(window.portalDebug.state.portals.length)').catch(() => false)) break;
      await sleep(250);
    }
    await sleep(2500);
    // O `?from=` tem de ter posto a câmara no sítio: se não pôs, o mundo não tem porta de chegada
    // para esta origem e o retrato sairia do lugar errado.
    const chegada = await browser.evaluate(`(() => {
      const cena = document.querySelector('a-scene');
      const camera = cena.camera;
      const posicao = new THREE.Vector3();
      camera.getWorldPosition(posicao);
      return { mundo: window.portalDebug.world, posicao: [posicao.x, posicao.y, posicao.z] };
    })()`);
    console.log('mundo ' + mundo + ' a chegar de ' + origem + ': câmara em [' +
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
