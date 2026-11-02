// A emenda da esfera (D82). A pergunta: o fundo shader fecha ao voltar ao ponto de partida, ou vê-se
// uma costura em pé no sítio onde `az` salta de +PI para -PI?
//
// Porque existe um instrumento e não um olho: o defeito é uma diferença de **luminosidade entre duas
// colunas vizinhas**, e não se distingue de uma aresta que o shader queira ter sem a medir ao lado do
// que ele desenha à volta. O banco de ensaio é o mesmo do validador (`tools/shader/measure.mjs`): a
// página do ensaio, um material com o fragment composto pelo preâmbulo, e o `readPixels` do contexto.
// A diferença é a geometria — aqui não há esfera nem câmara. Um quadrado cobre o ecrã e cada pixel vale
// por uma direcção: a coluna do meio é a emenda e as outras são a sua vizinhança, sem perspectiva nem
// oitavo de volta a atrapalhar a conta.
//
// O que se mede, para cada tombo (a elevação) e cada instante:
//   · `salto`    — a descontinuidade na coluna da emenda, em luma (0–255), já sem a rampa do shader;
//   · `pico`     — a maior descontinuidade que a **mesma conta** encontra fora da emenda, na faixa.
// O segundo é a testemunha do primeiro: um shader tem arestas suas (um tijolo, uma linha de grelha, uma
// crista de onda), e o que se pergunta não é se a emenda tem um degrau, é se ela tem um degrau que o
// shader não tem em mais lado nenhum. Um céu liso não pode ter nenhum; um xadrez pode ter muitos.
//
// A bateria traz dois controlos, porque um instrumento que nunca viu o defeito não é um instrumento:
// um corpo com um degrau a sério (`step(0.0, az)`) tem de medir um salto enorme, e um corpo que já
// fecha (`0.5 + 0.5 * sin(az)`, que é contínuo na volta) tem de medir ~0.
//
// Uso, da raiz do projeto:
//   node tools/regression/emenda.mjs           os 11 shaders instalados e os dois controlos
//   node tools/regression/emenda.mjs --tabela  só a tabela, sem veredicto (para ler valores)
//   --de <pasta>                               mede os corpos de outra pasta, com o preâmbulo de agora
//                                              (é assim que se mede o que lá estava antes de uma correcção)
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { serveProject, openBrowser, sleep, checks } from './harness.mjs';
import { SHADERS, fragmentFor } from '../../js/modules/shaders.js';

// A faixa de azimute: 3° para cada lado de 180°. Estreita de propósito — a emenda é uma coluna, e uma
// faixa larga deixaria o `pico` crescer com o que está longe dela.
const MEDIDA = {
  colunas: 256,
  linhas: 48,
  meiaJanela: 3.0,   // graus de azimute para cada lado da emenda
  meiaAltura: 2.5,   // graus de elevação para cada lado do tombo
  lados: 4,          // colunas somadas de cada lado da emenda
  tombos: [-30, -12, 0, 18, 40],
  tempos: [0.0, 1.7, 3.4, 5.1],
  // O degrau máximo, em luma. Abaixo de 1/255 de 255 = 0,4% da escala: é o que o ecrã não mostra,
  // porque dois tons vizinhos com menos de um nível de 8 bits de diferença são o mesmo tom.
  limite: 1.0,
  // E o degrau da emenda pode ser, no máximo, um quarto maior que o maior degrau que o shader já tem
  // na mesma faixa: a partir daí a emenda é a aresta mais dura do sítio onde ela está.
  folga: 1.25
};

// O vertex do banco: `position` de um plano de 2×2 já vem em [-1, 1], por isso o quadrado cobre o ecrã
// e a direcção sai da posição do vértice, interpolada. É a única diferença para o shader da exposição:
// `vDir` aqui vale exactamente o que o corpo espera (um vector unitário), sem esfera pelo meio.
const VERTEX = `varying vec3 vDir;
uniform vec2 uAz;
uniform vec2 uEl;
void main() {
  float az = mix(uAz.x, uAz.y, position.x * 0.5 + 0.5);
  float el = mix(uEl.x, uEl.y, position.y * 0.5 + 0.5);
  vDir = vec3(sin(az) * cos(el), sin(el), -cos(az) * cos(el));
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

// Os controlos, porque um instrumento que nunca viu o defeito não é um instrumento: o primeiro é o
// defeito a nu (um `step` corta ao meio do azimute), o segundo é o defeito que aqui se corrigiu (um
// `sin(az * 1,4)` — uma volta e meia não fecha), e o terceiro é o que está certo (`sin(az)`, que dá a
// volta inteira e por isso se encontra consigo mesmo na emenda).
const CONTROLOS = [
  { id: 'controlo-corte-a-nu', body: 'col = vec3(step(0.0, az));', minimo: 200, maximo: null },
  { id: 'controlo-volta-e-meia', body: 'col = vec3(0.5 + 0.5 * sin(az * 1.4));', minimo: 20, maximo: null },
  { id: 'controlo-volta-inteira', body: 'col = vec3(0.5 + 0.5 * sin(az));', minimo: null, maximo: 1.0 }
];

function bench(payload) {
  return `(async () => {
  const sceneEl = document.querySelector('a-scene');
  const renderer = sceneEl && sceneEl.renderer;
  const three = window.THREE;
  if (!renderer || !three) return { problemas: ['sem renderer/THREE na página'] };

  renderer.setPixelRatio(1);
  renderer.setRenderTarget(null);

  const lista = ${JSON.stringify(payload.shaders.map((entry) => ({ id: entry.id, body: entry.body, fragment: entry.fragment })))};
  const problemas = [];
  if (renderer.debug) {
    renderer.debug.onShaderError = (gl, program, vertexShader, fragmentShader) => {
      const fonte = fragmentShader ? String(gl.getShaderSource(fragmentShader) || '') : '';
      const dono = lista.find((entry) => fonte.indexOf(entry.body) >= 0);
      const log = String(gl.getProgramInfoLog(program) || '').trim();
      problemas.push((dono ? dono.id : 'shader desconhecido') + ': ' + (log || 'não compila'));
    };
  }

  const medida = ${JSON.stringify(MEDIDA)};
  const graus = Math.PI / 180;
  const alvo = new three.WebGLRenderTarget(medida.colunas, medida.linhas,
    { depthBuffer: false, stencilBuffer: false });
  const cena = new three.Scene();
  const camara = new three.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const geometria = new three.PlaneGeometry(2, 2);
  const pixel = new Uint8Array(medida.colunas * medida.linhas * 4);
  const centro = medida.colunas / 2;
  const resultados = [];

  for (const shader of lista) {
    const material = new three.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uAz: { value: new three.Vector2() },
        uEl: { value: new three.Vector2() }
      },
      vertexShader: ${JSON.stringify(VERTEX)},
      fragmentShader: shader.fragment,
      depthTest: false,
      depthWrite: false
    });
    const malha = new three.Mesh(geometria, material);
    cena.add(malha);

    const porTombo = {};
    for (const tombo of medida.tombos) porTombo[tombo] = { salto: 0, pico: 0, tempo: 0 };

    for (const tempo of medida.tempos) {
      material.uniforms.uTime.value = tempo;
      for (const tombo of medida.tombos) {
        material.uniforms.uAz.value.set((180 - medida.meiaJanela) * graus, (180 + medida.meiaJanela) * graus);
        material.uniforms.uEl.value.set((tombo - medida.meiaAltura) * graus, (tombo + medida.meiaAltura) * graus);
        renderer.setRenderTarget(alvo);
        renderer.render(cena, camara);
        renderer.readRenderTargetPixels(alvo, 0, 0, medida.colunas, medida.linhas, pixel);

        let somaSalto = 0;
        let somaPico = 0;
        for (let y = 0; y < medida.linhas; y++) {
          // A luma da linha e a sua soma acumulada: com ela, a média de quaisquer N colunas sai numa
          // subtracção.
          const acumulada = new Float64Array(medida.colunas + 1);
          for (let x = 0; x < medida.colunas; x++) {
            const at = (y * medida.colunas + x) * 4;
            acumulada[x + 1] = acumulada[x] + 0.299 * pixel[at] + 0.587 * pixel[at + 1] + 0.114 * pixel[at + 2];
          }
          const media = (inicio, fim) => (acumulada[fim] - acumulada[inicio]) / (fim - inicio);
          // O degrau com a rampa descontada. Numa ladeira lisa os três passos de N colunas à volta do
          // sítio medido são iguais; o que sobra do passo do meio depois de lhe tirar a média dos
          // vizinhos é a descontinuidade, e não a inclinação. Sem isto, uma rampa suave lia-se como
          // emenda (medido: um seno contínuo acusava 0,89).
          const passo = (k) => {
            const anterior = media(k - 8, k - 4);
            const esquerda = media(k - 4, k);
            const direita = media(k, k + 4);
            const seguinte = media(k + 4, k + 8);
            return Math.abs((direita - esquerda) - ((esquerda - anterior) + (seguinte - direita)) * 0.5);
          };
          somaSalto += passo(centro);
          let pico = 0;
          for (let k = centro + 16; k + 8 <= medida.colunas; k++) pico = Math.max(pico, passo(k));
          for (let k = medida.lados * 2; k <= centro - 16; k++) pico = Math.max(pico, passo(k));
          somaPico += pico;
        }
        const salto = medida.linhas ? somaSalto / medida.linhas : 0;
        const atual = porTombo[tombo];
        if (salto >= atual.salto) {
          atual.salto = salto;
          atual.pico = medida.linhas ? somaPico / medida.linhas : 0;
          atual.tempo = tempo;
        }
      }
    }

    cena.remove(malha);
    material.dispose();
    resultados.push({ id: shader.id, porTombo });
  }

  geometria.dispose();
  alvo.dispose();
  renderer.setRenderTarget(null);
  return { problemas, resultados };
})()`;
}

function linhaDoTempo(porTombo) {
  return MEDIDA.tombos.map((tombo) => {
    const valor = porTombo[tombo];
    return tombo + '° ' + valor.salto.toFixed(2) + '/' + valor.pico.toFixed(2);
  }).join(' · ');
}

function pior(porTombo) {
  return MEDIDA.tombos.reduce((maximo, tombo) => Math.max(maximo, porTombo[tombo].salto), 0);
}

// O degrau que a emenda pode ter naquele tombo: o limite absoluto ou, quando o shader já tem arestas na
// mesma faixa, a maior delas com a folga. Nunca menos que o limite absoluto.
function permitido(porTombo) {
  return MEDIDA.tombos.reduce((maximo, tombo) => Math.max(maximo,
    Math.max(MEDIDA.limite, MEDIDA.folga * porTombo[tombo].pico)), 0);
}

function passa(porTombo) {
  return MEDIDA.tombos.every((tombo) =>
    porTombo[tombo].salto <= Math.max(MEDIDA.limite, MEDIDA.folga * porTombo[tombo].pico));
}

// Os corpos de uma pasta, montados com o preâmbulo de agora. Serve para medir o que lá estava antes de
// uma correcção — e é o único caminho honesto para comparar duas versões: o preâmbulo é o mesmo, por isso
// a diferença que a tabela mostra é a dos corpos.
async function corposDe(pasta) {
  const ficheiros = readdirSync(pasta).filter((nome) => nome.endsWith('.js'));
  const corpos = [];
  for (const nome of ficheiros) {
    const modulo = await import(pathToFileURL(join(pasta, nome)).href);
    const corpo = modulo.shader;
    corpos.push({ id: corpo.id, body: corpo.body, fragment: fragmentFor(corpo.body) });
  }
  return corpos;
}

async function main() {
  const argumentos = process.argv.slice(2);
  const soTabela = argumentos.includes('--tabela');
  const pasta = argumentos.includes('--de') ? argumentos[argumentos.indexOf('--de') + 1] : null;
  const check = checks();
  const site = await serveProject();
  const browser = await openBrowser({ camera: false, width: 800, height: 600 });
  try {
    const ready = await browser.goto(site.base + '/?scene=shader&bust=' + Date.now(), 60000);
    if (!ready) throw new Error('a página do ensaio não carregou');
    await sleep(1500);

    const shaders = pasta
      ? await corposDe(pasta)
      : SHADERS.map((shader) => ({ id: shader.id, body: shader.body, fragment: shader.fragment }));
    const medida = await browser.evaluate(bench({ shaders }), 240000);
    if (!medida || !medida.resultados) throw new Error('o banco não devolveu resultados');
    check.check('o banco compila e desenha os ' + shaders.length + ' shaders',
      (medida.problemas || []).length === 0, JSON.stringify(medida.problemas || []));

    const controlos = await browser.evaluate(bench({
      shaders: CONTROLOS.map((entry) => ({ id: entry.id, body: entry.body, fragment: fragmentFor(entry.body) }))
    }), 60000);
    for (const controlo of CONTROLOS) {
      const resultado = controlos.resultados.find((entry) => entry.id === controlo.id);
      const valor = pior(resultado.porTombo);
      if (controlo.minimo !== null) {
        check.check('o ' + controlo.id + ' mede a emenda', valor >= controlo.minimo,
          'pior ' + valor.toFixed(2) + ' (mínimo ' + controlo.minimo + ')');
      } else {
        check.check('o ' + controlo.id + ' não mede emenda nenhuma', valor <= controlo.maximo,
          'pior ' + valor.toFixed(2) + ' (máximo ' + controlo.maximo + ')');
      }
    }

    console.log('');
    console.log('shader            pior    ' + MEDIDA.tombos.map((tombo) => String(tombo).padStart(4) + '°').join('        '));
    for (const resultado of medida.resultados) {
      const valores = MEDIDA.tombos.map((tombo) => {
        const valor = resultado.porTombo[tombo];
        return (valor.salto.toFixed(2) + '/' + valor.pico.toFixed(2)).padStart(9);
      });
      console.log(resultado.id.padEnd(18) + pior(resultado.porTombo).toFixed(2).padStart(6) + '   ' + valores.join(''));
    }
    console.log('  (salto/pico, em luma; o salto pode ir até ' + MEDIDA.limite.toFixed(2) +
      ' ou a ' + MEDIDA.folga + '× o pico)');
    if (soTabela) return;

    console.log('');
    for (const resultado of medida.resultados) {
      check.check(resultado.id + ': a esfera fecha na emenda',
        passa(resultado.porTombo),
        'pior ' + pior(resultado.porTombo).toFixed(2) + ' até ' + permitido(resultado.porTombo).toFixed(2) +
        ' · ' + linhaDoTempo(resultado.porTombo));
    }
  } finally {
    await browser.close();
    await site.close();
  }
  check.report('a emenda da esfera');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
