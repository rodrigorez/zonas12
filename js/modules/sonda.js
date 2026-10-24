// A sonda de campo: o que a exposição está a fazer, escrito no ecrã do telemóvel (R14).
//
// Porque existe: o A/B que fecha o R14 tem de ser lido em três aparelhos, e nenhum deles tem consola
// de developer tools. `?sonda=1` acrescenta um painel com o que `portalDebug.shader()` responde —
// mundo, fundo, cadência, pixelRatio, atrasos, eventos da escada — e um botão que copia o relatório
// como texto, para colar onde for preciso (chat, nota, email).
//
// Sem o parâmetro não desenha nada, não mede nada e não toca em nada: a exposição não sabe que ele
// existe. Com o parâmetro, o painel lê o estado a cada meio segundo e é a única coisa que escreve no
// ecrã por cima da cena.
//
// O texto é da **ferramenta** e não da interface: não sai do catálogo `i18n` (D12) porque não é o que
// o visitante lê para usar a peça — é o que se lê para diagnosticar.

const INTERVALO_MS = 500;

const linha = (rotulo, valor) => rotulo.padEnd(13) + valor;

// O aparelho, em duas linhas curtas: o que muda a leitura dos números é a marca/modelo, a versão do
// browser e o ecrã — não vale a pena mandar o `userAgent` inteiro para o relatório.
function aparelho() {
  const ua = navigator.userAgent;
  const sistema = /Android ([0-9.]+)/.exec(ua)
    ? 'Android ' + /Android ([0-9.]+)/.exec(ua)[1]
    : (/iPhone|iPad|iPod/.test(ua) ? 'iOS' : (/Windows/.test(ua) ? 'Windows' : (/Mac OS/.test(ua) ? 'macOS' : 'outro')));
  const browser = /Chrome\/([0-9.]+)/.exec(ua) && !/Edg\//.test(ua)
    ? 'Chrome ' + /Chrome\/([0-9.]+)/.exec(ua)[1].split('.')[0]
    : (/Firefox\/([0-9.]+)/.exec(ua)
      ? 'Firefox ' + /Firefox\/([0-9.]+)/.exec(ua)[1].split('.')[0]
      : (/Version\/([0-9.]+).*Safari/.test(ua) ? 'Safari ' + /Version\/([0-9.]+)/.exec(ua)[1].split('.')[0] : 'outro'));
  return sistema + ' · ' + browser;
}

function eventos(policy) {
  if (!policy || !policy.events || !policy.events.length) return '(nenhum)';
  return policy.events.slice(-4)
    .map((evento) => evento.what + '@' + evento.t + 's' +
      (evento.pixelRatio ? ' pr ' + evento.pixelRatio : ''))
    .join(' · ');
}

function relatorio(estado, taxa, fps) {
  const fundo = (estado.backgrounds || []).find((item) => item.dimension === 0) || {};
  const policy = estado.policy;
  const linhas = [
    'zonas12 · sonda',
    linha('mundo', String(window.portalDebug.world)),
    linha('endereço', location.pathname + location.search),
    linha('fundo', fundo.mode + (fundo.shaderId ? ' · ' + fundo.shaderId : '') +
      (fundo.requested !== fundo.mode ? ' (pedido: ' + fundo.requested + ')' : '')),
    linha('modo', policy ? policy.mode + ' · cadência ' + policy.cadence + '/s' : 'sem política (imagem)'),
    linha('pixelRatio', policy ? String(policy.pixelRatio) : '—'),
    linha('atualizações', taxa === null ? '— (a medir)' : taxa.toFixed(1) + '/s' +
      (policy ? ' · total ' + policy.updates : '')),
    // O número que serve ao A/B: os quadros que a página desenhou, independentemente da cadência. É o
    // que se compara entre `?shader=0` e o shader no mesmo aparelho e na mesma sala.
    linha('quadros', fps === null ? '— (a medir)' : fps.toFixed(1) + '/s'),
    linha('atrasos', policy ? String(policy.late) : '—'),
    linha('eventos', eventos(policy)),
    linha('ecrã', innerWidth + '×' + innerHeight + ' · dpr ' + (Math.round(devicePixelRatio * 100) / 100)),
    linha('reduzido', matchMedia('(prefers-reduced-motion: reduce)').matches ? 'sim' : 'não'),
    linha('aparelho', aparelho())
  ];
  return linhas.join('\n');
}

function copiar(texto, botao) {
  const dizer = (mensagem) => {
    botao.textContent = mensagem;
    setTimeout(() => { botao.textContent = 'Copiar'; }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(texto).then(() => dizer('copiado'), () => dizer('seleciona e copia'));
    return;
  }
  dizer('seleciona e copia');
}

export function startSonda() {
  const querida = new URLSearchParams(location.search).get('sonda');
  if (querida !== '1') return null;

  const painel = document.createElement('div');
  painel.id = 'sonda';
  painel.setAttribute('role', 'log');
  const texto = document.createElement('pre');
  texto.id = 'sonda-texto';
  const botao = document.createElement('button');
  botao.id = 'sonda-copiar';
  botao.type = 'button';
  botao.textContent = 'Copiar';
  const fechar = document.createElement('button');
  fechar.id = 'sonda-fechar';
  fechar.type = 'button';
  fechar.textContent = '×';
  fechar.setAttribute('aria-label', 'fechar a sonda');
  painel.append(texto, botao, fechar);
  document.body.appendChild(painel);

  let amostras = [];
  // Os quadros que a página desenhou, contados aqui e não pela política: é o número que se compara
  // entre o shader e a imagem de reserva (R14), porque a cadência do shader é um teto de projeto e não
  // uma medida do custo.
  let quadros = 0;
  let activa = true;
  const contar = () => {
    if (!activa) return;
    quadros += 1;
    requestAnimationFrame(contar);
  };
  requestAnimationFrame(contar);
  let amostrasQuadros = [];
  const medir = () => {
    const estado = window.portalDebug.shader();
    const atualizacoes = estado.policy ? estado.policy.updates : 0;
    const agora = Date.now();
    // A taxa é a média dos últimos ~2 s e não a diferença de meio segundo: num telemóvel os quadros
    // chegam aos grupos, e uma janela curta mostra 18 e 22 alternados.
    amostras.push({ atualizacoes, em: agora });
    amostrasQuadros.push({ quadros, em: agora });
    while (amostras.length > 2 && agora - amostras[0].em > 2000) amostras.shift();
    while (amostrasQuadros.length > 2 && agora - amostrasQuadros[0].em > 2000) amostrasQuadros.shift();
    let taxa = null;
    let fps = null;
    if (amostras.length > 1) {
      const segundos = (agora - amostras[0].em) / 1000;
      if (segundos >= 0.8) taxa = (atualizacoes - amostras[0].atualizacoes) / segundos;
    }
    if (amostrasQuadros.length > 1) {
      const segundos = (agora - amostrasQuadros[0].em) / 1000;
      if (segundos >= 0.8) fps = (quadros - amostrasQuadros[0].quadros) / segundos;
    }
    texto.textContent = relatorio(estado, taxa, fps);
  };

  medir();
  const relogio = setInterval(medir, INTERVALO_MS);
  botao.addEventListener('click', () => copiar(texto.textContent, botao));
  fechar.addEventListener('click', () => {
    activa = false;
    clearInterval(relogio);
    painel.remove();
  });
  return painel;
}
