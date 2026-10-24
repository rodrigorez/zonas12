// A orientação do telemóvel (D52): o `look-controls` do A-Frame faz do aparelho uma janela para a
// cena, mas aplica os sensores **crus**. Num aparelho **sem giroscópio** o Android deriva o `beta` e o
// `gamma` do acelerómetro e o `alpha` do magnetómetro, e esse ruído chega ao ecrã como tremor — o
// visitante vê a sala a tremer em vez de a ver parada.
//
// O que este módulo faz: mede o ruído do sensor nos primeiros segundos e **desliga o magic-window só
// onde ele não presta**. A visita continua a poder olhar a arrastar (o `touchEnabled` não se toca), e
// num aparelho com giroscópio nada muda.
//
// A medição é o **segundo mais quieto** dos primeiros seis, e não a média: quando a página abre o
// visitante está a mexer no telemóvel, por isso a pergunta não é «está quieto?» — é «qual é o piso de
// ruído deste sensor?». Ruído é de alta frequência (muda de amostra para amostra); movimento de mão
// não é. A segunda diferença separa os dois: um giroscópio fundido dá valores quase constantes, um
// acelerómetro sozinho salta graus entre amostras.

export const ORIENTATION = {
  listenMs: 6000,       // quanto tempo se observa antes de decidir
  quietWindowMs: 1000,  // o segundo mais quieto é o que conta
  minSamples: 20,       // abaixo disto não há dados para decidir
  jitterLimit: 0.5      // graus por amostra² — medido em telemóvel sem giroscópio; ver o README
};

let vigia = null;

const axis = (value) => (typeof value === 'number' && Number.isFinite(value) ? value : 0);

// O piso de ruído: para cada janela de 1 s, a média de |Δ²| das três componentes; o mínimo das janelas.
// `null` quando há amostras a menos para dizer alguma coisa.
export function noiseFloor(samples, settings) {
  const options = Object.assign({}, ORIENTATION, settings || {});
  if (!samples || samples.length < options.minSamples) return null;
  let melhor = null;
  for (let inicio = 0; inicio < samples.length; inicio++) {
    const fim = samples[inicio].t + options.quietWindowMs;
    let soma = 0;
    let contagem = 0;
    for (let i = inicio + 2; i < samples.length && samples[i].t <= fim; i++) {
      const anterior = samples[i - 2];
      const meio = samples[i - 1];
      const atual = samples[i];
      soma += Math.abs(atual.a - 2 * meio.a + anterior.a) +
        Math.abs(atual.b - 2 * meio.b + anterior.b) +
        Math.abs(atual.g - 2 * meio.g + anterior.g);
      contagem += 1;
    }
    if (contagem < 8) continue;
    const valor = soma / contagem;
    if (melhor === null || valor < melhor) melhor = valor;
  }
  return melhor;
}

// O que os instrumentos e a sonda leem.
export function orientationStatus() {
  return vigia ? vigia.status() : { tracking: null, jitter: null, samples: 0, reason: 'sem medição' };
}

function disableTracking(cameraEl, reason) {
  const componente = cameraEl.components['look-controls'];
  if (!componente) return false;
  if (componente.data.magicWindowTrackingEnabled === false) return true;
  cameraEl.setAttribute('look-controls',
    Object.assign({}, componente.data, { magicWindowTrackingEnabled: false }));
  return true;
}

// Liga a vigilância a uma câmara já criada. Devolve um acesso ao estado; não desenha nada e não diz
// nada ao visitante — o tremor, esse, desaparece.
export function startOrientationWatch(cameraEl, options) {
  const settings = Object.assign({}, ORIENTATION, options || {});
  const estado = { tracking: null, jitter: null, samples: 0, reason: 'a medir' };

  const terminar = () => ({ status: () => Object.assign({}, estado) });

  if (!cameraEl || !cameraEl.components || !cameraEl.components['look-controls']) {
    estado.reason = 'sem look-controls';
    vigia = terminar();
    return vigia;
  }

  const forçado = new URLSearchParams(location.search).get('giroscopio');
  if (forçado === '0') {
    disableTracking(cameraEl, '?giroscopio=0');
    estado.tracking = false;
    estado.reason = '?giroscopio=0';
    vigia = terminar();
    return vigia;
  }

  if (typeof DeviceOrientationEvent === 'undefined') {
    estado.reason = 'sem sensor de orientação';
    vigia = terminar();
    return vigia;
  }

  const amostras = [];
  const aoOrientar = (evento) => {
    if (evento.alpha === null && evento.beta === null && evento.gamma === null) return;
    amostras.push({
      t: performance.now(),
      a: axis(evento.alpha), b: axis(evento.beta), g: axis(evento.gamma)
    });
  };

  window.addEventListener('deviceorientation', aoOrientar);
  setTimeout(() => {
    window.removeEventListener('deviceorientation', aoOrientar);
    estado.samples = amostras.length;
    estado.jitter = noiseFloor(amostras, settings);
    if (estado.jitter === null) {
      // Sem eventos não se decide nada: num desktop não há sensor, e desligar o que não existe não
      // muda nada — mas dizer «desliguei» seria mentira.
      estado.tracking = true;
      estado.reason = 'sem amostras';
      return;
    }
    if (estado.jitter > settings.jitterLimit) {
      disableTracking(cameraEl, 'sensor ruidoso');
      estado.tracking = false;
      estado.reason = 'sensor ruidoso';
      return;
    }
    estado.tracking = true;
    estado.reason = 'sensor estável';
  }, settings.listenMs);

  vigia = terminar();
  return vigia;
}
