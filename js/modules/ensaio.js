// O ensaio automático do A/B do shader (R14/R15): um toque por aparelho, dois lados, um bloco.
//
// Porque existe: fechar o R14 exige comparar, **no mesmo aparelho e na mesma sala**, o fundo shader com
// o fundo de imagem — e a sonda mostra um lado de cada vez. Fazer isso à mão é abrir duas páginas,
// esperar, copiar dois relatórios e juntá-los; em três aparelhos, é uma conversa por aparelho.
//
// Com `?ensaio=1` a página faz o par sozinha:
//
//   1. espera pela cena, aquece e mede o lado que o endereço diz (o shader, por omissão);
//   2. guarda o resultado na sessão do separador e **recarrega** o mesmo endereço com `&fase=imagem&shader=0`;
//   3. mede o segundo lado, junta os dois e mostra **um** bloco de texto, com um botão que o copia.
//
// O que se mede é o que decide: os **quadros por segundo** que a página desenhou (o custo real), a
// cadência que a política cumpriu, o pixelRatio (e o mínimo e o máximo que a escada visitou), os
// atrasos e quantas vezes a escada mexeu. É o mesmo número da sonda, mas dos dois lados e num sítio só.
//
// Durações: `?ensaio=1&segundos=30&aquecimento=5` (por omissão 45 s de medida e 10 s de aquecimento,
// ~2 minutos por aparelho). O texto é da ferramenta, não da interface (D12) — não sai do catálogo.
const KEY = 'zonas12.ensaio';
const SAMPLE_MS = 250;
// De quanto em quanto o relógio da fase olha para o tempo: é o que atualiza o contador e o que fecha a
// janela, portanto o desvio máximo entre a janela pedida e a medida é este intervalo.
const TICK_MS = 100;
// Uma janela curta não mede nada: em 0 ms não há um único quadro e a taxa é `0/0`. O relatório mostrou
// `null/s` e `NaN/s` na primeira vez que o autor abriu o endereço sem durações explícitas, e a causa era
// `Number(null) === 0` — o parâmetro ausente lia-se como zero. Duas defesas: ausente/vazio/inválido volta
// ao valor por omissão (o zero **pedido** continua a valer para o aquecimento), e a medida tem um mínimo.
const MIN_MEASURE_MS = 2000;

const seconds = (value, fallback, minimum = 0) => {
  if (value === null || value === undefined || String(value).trim() === '') return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return fallback;
  return Math.max(minimum, number * 1000);
};

const shortDevice = () => {
  const ua = navigator.userAgent;
  const system = /Android ([0-9.]+)/.exec(ua) ? 'Android ' + /Android ([0-9.]+)/.exec(ua)[1]
    : (/iPhone|iPad|iPod/.test(ua) ? 'iOS' : (/Windows/.test(ua) ? 'Windows' : (/Mac OS/.test(ua) ? 'macOS' : 'outro')));
  const browser = /Chrome\/([0-9.]+)/.exec(ua) && !/Edg\//.test(ua) ? 'Chrome ' + /Chrome\/([0-9.]+)/.exec(ua)[1].split('.')[0]
    : (/Firefox\/([0-9.]+)/.exec(ua) ? 'Firefox ' + /Firefox\/([0-9.]+)/.exec(ua)[1].split('.')[0]
      : (/Version\/([0-9.]+).*Safari/.test(ua) ? 'Safari ' + /Version\/([0-9.]+)/.exec(ua)[1].split('.')[0] : 'outro'));
  return system + ' · ' + browser;
};

// A GPU é o que distingue os três aparelhos do ensaio (o fraco, o médio Adreno 630 e o desktop) — e é
// a primeira coisa que se perde quando o relatório é escrito à mão.
const gpuName = () => {
  try {
    const scene = document.querySelector('a-scene');
    const gl = scene && scene.renderer ? scene.renderer.getContext() : null;
    if (!gl) return '—';
    const extension = gl.getExtension('WEBGL_debug_renderer_info');
    return extension ? String(gl.getParameter(extension.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
  } catch (error) {
    return '—';
  }
};

const state = () => (window.portalDebug && window.portalDebug.shader ? window.portalDebug.shader() : null);

// Espera que a cena exista e desenhe: medir antes disso mede o carregamento, não o fundo.
function sceneReady(timeoutMs = 60000) {
  return new Promise((resolve) => {
    const started = Date.now();
    const check = () => {
      const scene = document.querySelector('a-scene');
      if (scene && scene.renderer && state()) { resolve(true); return; }
      if (Date.now() - started > timeoutMs) { resolve(false); return; }
      setTimeout(check, 200);
    };
    check();
  });
}

// ---- a fase: um relógio, três usos ----
//
// O contador no ecrã, a janela de medida e o divisor da taxa saem **todos** do mesmo `performance.now()`.
// Antes eram três contas diferentes — a contagem decrescente num laço de `setTimeout(1000)` (que atrasa e
// acumula), a medida num `setTimeout(ms)` (que pode disparar tarde) e a taxa a dividir pelo tempo que se
// tinha *pedido* —, por isso o painel podia anunciar uma coisa e o resultado ser outra. Agora não: o que
// se lê é o que se mediu, e o relatório diz quanto a janela real se afastou da pedida.
//
// Uma aba **escondida** pausa a fase. Um `requestAnimationFrame` que não corre contaria zero quadros, e o
// A/B compararia 45 s de shader com 3 s de ecrã ligado na imagem — que é a forma mais fácil de obter um
// número bonito e falso. O tempo escondido sai do relógio e vai declarado no relatório.
function runPhase({ warmupMs, measureMs, onTick }) {
  return new Promise((resolve) => {
    const startedAt = performance.now();
    let hiddenAt = document.visibilityState === 'hidden' ? startedAt : null;
    let pausedMs = 0;
    let frames = 0;
    let lastFrameAt = 0;
    // Quando o primeiro quadro da janela foi desenhado: é o princípio da janela de medida, e não o fim
    // do aquecimento no papel — assim o divisor é o intervalo em que os quadros foram mesmo contados.
    let measuringAt = null;
    let lastSampleAt = -1;
    let done = false;
    const gaps = [];
    const samples = [];

    const elapsedAt = (now) => now - startedAt - pausedMs - (hiddenAt === null ? 0 : now - hiddenAt);
    const elapsed = () => elapsedAt(performance.now());
    const visible = () => document.visibilityState !== 'hidden';

    const sample = () => {
      const now = state();
      samples.push(now && now.policy ? {
        updates: now.policy.updates || 0,
        pixelRatio: now.policy.pixelRatio,
        late: now.policy.late || 0,
        cadence: now.policy.cadence,
        mode: now.policy.mode,
        // Uma desistência a meio da fase (R18) troca o fundo medido: o relatório tem de o dizer, senão
        // a fase 1 aparecia como «imagem» sem explicação.
        gaveUp: Boolean(now.policy.gaveUp),
        events: (now.policy.events || []).length
      } : null);
    };

    const onVisibility = () => {
      const now = performance.now();
      if (document.visibilityState === 'hidden') {
        if (hiddenAt === null) hiddenAt = now;
        return;
      }
      if (hiddenAt === null) return;
      pausedMs += now - hiddenAt;
      hiddenAt = null;
      // O intervalo entre dois quadros não atravessa a pausa: senão o «pior quadro» era o tempo em que a
      // aba esteve escondida, que não é um quadro lento — é um quadro que não foi pedido.
      lastFrameAt = 0;
    };
    document.addEventListener('visibilitychange', onVisibility);

    const finish = () => {
      if (done) return;
      done = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      const total = elapsed();
      const windowMs = Math.max(0, total - (measuringAt === null ? warmupMs : measuringAt));
      const divisors = Math.max(0.001, windowMs / 1000);
      const valid = samples.filter(Boolean);
      const first = valid[0] || null;
      const last = valid[valid.length - 1] || null;
      const ratios = valid.map((item) => item.pixelRatio).filter((item) => typeof item === 'number');
      const backgrounds = state() ? state().backgrounds || [] : [];
      const background = backgrounds.find((item) => item.dimension === 0) || {};
      const sorted = gaps.slice().sort((a, b) => a - b);
      const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
      const worst = sorted.length ? sorted[sorted.length - 1] : null;
      resolve({
        requestedMs: measureMs,
        warmupMs: warmupMs,
        // A janela que **passou**, com dois usos: o relatório mostra-a e a taxa divide-se por ela.
        windowMs: windowMs,
        pausedMs: pausedMs,
        frames: frames,
        fps: Math.round((frames / divisors) * 10) / 10,
        worstFrameMs: worst === null ? null : Math.round(worst * 10) / 10,
        slowFrames: median === null ? null : gaps.filter((gap) => gap > median * 2).length,
        background: background.mode || '—',
        shader: background.shaderId || null,
        mode: last ? last.mode : null,
        cadence: last ? last.cadence : null,
        // Sem política (fundo de imagem) não há atualizações a contar: fica «—», não zero.
        updatesPerSecond: first && last && last.updates > first.updates
          ? Math.round(((last.updates - first.updates) / divisors) * 10) / 10
          : null,
        updates: last ? last.updates : null,
        pixelRatio: last ? last.pixelRatio : null,
        pixelRatioMin: ratios.length ? Math.min(...ratios) : null,
        pixelRatioMax: ratios.length ? Math.max(...ratios) : null,
        gaveUp: samples.some((item) => item && item.gaveUp),
        late: last ? last.late : null,
        events: last ? last.events : 0
      });
    };

    // Os quadros desenhados — o custo real —, contados só dentro da janela e só com a aba visível. O
    // primeiro quadro depois do aquecimento **abre** a janela: é ele o instante zero.
    const frame = (now) => {
      if (done) return;
      if (visible()) {
        const ms = elapsedAt(now);
        if (measuringAt === null && ms >= warmupMs) measuringAt = ms;
        if (measuringAt !== null) {
          frames += 1;
          if (lastFrameAt) gaps.push(now - lastFrameAt);
          lastFrameAt = now;
        }
      }
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    const timer = setInterval(() => {
      if (done) return;
      const ms = elapsed();
      if (measuringAt !== null && lastSampleAt < 0) {
        sample();
        lastSampleAt = ms;
      } else if (measuringAt !== null && ms - lastSampleAt >= SAMPLE_MS) {
        sample();
        lastSampleAt = ms;
      }
      if (onTick) {
        onTick({
          measuring: measuringAt !== null,
          // O que falta para o resultado: o contador conta o que o relógio diz que falta, não o que um
          // laço de `setTimeout` ia somando.
          left: Math.max(0, Math.ceil((warmupMs + measureMs - ms) / 1000)),
          elapsed: ms
        });
      }
      if (ms >= warmupMs + measureMs) finish();
    }, TICK_MS);
  });
}

const line = (label, value) => label.padEnd(13) + value;

// Um número do relatório: `null`, `NaN` e `Infinity` não são resultados, são a ausência dele — e um
// relatório que os imprime (foi o que aconteceu com a janela de 0 s) faz perder a viagem.
const value = (number, casas = 1) => (typeof number === 'number' && Number.isFinite(number)
  ? String(Math.round(number * Math.pow(10, casas)) / Math.pow(10, casas))
  : '—');

// A janela de uma fase, com o desvio e o tempo em que a aba esteve escondida: é o que prova que os dois
// lados do A/B foram medidos pelo mesmo tempo, no mesmo aparelho.
const windowLine = (result) => {
  const drift = Math.round(((result.windowMs - result.requestedMs) / 1000) * 100) / 100;
  return value(result.windowMs / 1000, 2) + ' s (desvio ' + (drift >= 0 ? '+' : '') + value(drift, 2) + ' s' +
    (result.pausedMs >= 100 ? ' · pausada ' + value(result.pausedMs / 1000, 1) + ' s' : '') + ')';
};

function phaseReport(title, result) {
  if (!result) return [title, '  (sem medição)'];
  return [
    title,
    '  ' + line('fundo', (result.background || '—') + (result.shader ? ' · ' + result.shader : '') +
      (result.gaveUp ? ' (desistiu: o shader parou a meio da fase)' : '')),
    '  ' + line('janela', windowLine(result)),
    '  ' + line('quadros', value(result.fps) + '/s' + (result.frames ? ' · ' + result.frames + ' quadros' : '')),
    '  ' + line('pior quadro', (result.worstFrameMs === null ? '—' : value(result.worstFrameMs) + ' ms') +
      (result.slowFrames === null ? '' : ' · lentos ' + result.slowFrames + ' (>2× a mediana)')),
    '  ' + line('cadência', (result.cadence === null ? '—' : result.cadence + '/s') +
      (result.mode ? ' · ' + result.mode : '')),
    '  ' + line('atualizações', (result.updatesPerSecond === null ? '—' : value(result.updatesPerSecond) + '/s') +
      (result.updates === null ? '' : ' · total ' + result.updates)),
    '  ' + line('pixelRatio', (result.pixelRatio === null ? '—' : String(result.pixelRatio)) +
      (result.pixelRatioMin === null ? '' : ' (min ' + result.pixelRatioMin + ' · max ' + result.pixelRatioMax + ')')),
    '  ' + line('atrasos', result.late === null ? '—' : String(result.late)),
    '  ' + line('eventos', String(result.events))
  ];
}

// A comparação existe **sempre**: um ensaio a que falta um lado é um resultado (e diz-se porquê), não
// uma secção que desaparece sem explicação.
function summary(first, second) {
  const lines = ['--- comparação (imagem vs shader) ---'];
  const read = (result) => Boolean(result) && Number.isFinite(result.fps);
  if (!read(first) || !read(second)) {
    lines.push('  sem par: ' + (!read(first) ? 'a fase 1 (shader) não deixou números' : 'a fase 2 (imagem) não deixou números'));
    return lines;
  }
  const delta = first.fps > 0 ? Math.round(((second.fps - first.fps) / first.fps) * 1000) / 10 : null;
  lines.push('  quadros      ' + value(first.fps) + '/s → ' + value(second.fps) + '/s' +
    (delta === null ? '' : '  (' + (delta >= 0 ? '+' : '') + delta + '%)'));
  if (Number.isFinite(first.worstFrameMs) && Number.isFinite(second.worstFrameMs)) {
    lines.push('  pior quadro  ' + value(first.worstFrameMs) + ' ms → ' + value(second.worstFrameMs) + ' ms');
  }
  if (Number.isFinite(first.slowFrames) && Number.isFinite(second.slowFrames)) {
    // Cada lado é contado contra a **sua** mediana, por isso esta linha não se compara entre fases: um
    // fundo mais lento tem medianas maiores e conta menos «lentos» com o mesmo tremor. Foi medido:
    // 24 no shader contra 319 na imagem num aparelho onde a imagem ia 15% mais depressa.
    lines.push('  lentos       ' + first.slowFrames + ' → ' + second.slowFrames + ' (cada lado contra a sua mediana)');
  }
  // As duas janelas uma ao lado da outra: um A/B só vale se os dois lados foram medidos pelo mesmo tempo.
  const equal = Math.abs(first.windowMs - second.windowMs) <= 1000;
  lines.push('  janelas      ' + value(first.windowMs / 1000, 2) + ' s e ' + value(second.windowMs / 1000, 2) + ' s' +
    (equal ? '' : '  (<- diferente: o par não é comparável, repetir)'));
  return lines;
}

function copyText(text, button) {
  const say = (message) => {
    button.textContent = message;
    setTimeout(() => { button.textContent = 'Copiar'; }, 1600);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => say('copiado'), () => say('seleciona e copia'));
    return;
  }
  say('seleciona e copia');
}

function panel() {
  const box = document.createElement('div');
  box.id = 'ensaio';
  box.setAttribute('role', 'log');
  const short = document.createElement('div');
  short.id = 'ensaio-resumo';
  const text = document.createElement('pre');
  text.id = 'ensaio-texto';
  const copy = document.createElement('button');
  copy.id = 'ensaio-copiar';
  copy.type = 'button';
  copy.textContent = 'Copiar';
  const repeat = document.createElement('button');
  repeat.id = 'ensaio-repetir';
  repeat.type = 'button';
  repeat.textContent = 'Repetir';
  box.append(short, text, copy, repeat);
  document.body.appendChild(box);
  return { box, short, text, copy, repeat };
}

function readStored() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

export function startEnsaio() {
  const parameters = new URLSearchParams(location.search);
  if (parameters.get('ensaio') !== '1') return null;

  // Aquecimento e medida: o primeiro aceita 0 (um ensaio curto quer medir já), o segundo tem mínimo —
  // uma janela de 0 ms produz `0/0`, que é como o relatório do autor saiu com `null/s` e `NaN/s`.
  const warmupMs = seconds(parameters.get('aquecimento'), 10000);
  const requested = parameters.get('segundos');
  const measureMs = seconds(requested, 45000, MIN_MEASURE_MS);
  const clamped = requested !== null && String(requested).trim() !== '' && measureMs !== Number(requested) * 1000;
  const phase = parameters.get('fase') === 'imagem' ? 'imagem' : 'shader';
  const ui = panel();

  const tick = (message) => { ui.short.textContent = message; };

  sceneReady().then(async (ready) => {
    if (!ready) {
      ui.text.textContent = 'zonas12 · ensaio\n  a cena não ficou pronta em 60 s: sem medição';
      return;
    }
    const result = await runPhase({
      warmupMs: warmupMs,
      measureMs: measureMs,
      onTick: (progress) => tick('ensaio · fase ' + (phase === 'shader' ? '1/2 (shader)' : '2/2 (imagem)') +
        (progress.measuring ? ' · a medir · ' : ' · a aquecer · ') + progress.left + ' s')
    });
    result.phase = phase;

    if (phase === 'shader') {
      try {
        sessionStorage.setItem(KEY, JSON.stringify({ first: result }));
      } catch (error) {
        // sem sessão não há segunda fase; diz-se, em vez de ficar em silêncio
        ui.text.textContent = 'zonas12 · ensaio\n  o browser recusou a sessão: a segunda fase não pode ser guardada';
        return;
      }
      const next = new URLSearchParams(location.search);
      next.set('ensaio', '1');
      next.set('fase', 'imagem');
      next.set('shader', '0');
      tick('ensaio · fase 1 medida · a passar para a imagem…');
      location.replace(location.pathname + '?' + next.toString());
      return;
    }

    const stored = readStored();
    const first = stored ? stored.first : null;
    try { sessionStorage.removeItem(KEY); } catch (error) { /* nada a limpar */ }

    const lines = [
      'zonas12 · ensaio A/B do fundo',
      line('sala', String(window.portalDebug.world)),
      line('aparelho', shortDevice()),
      line('gpu', gpuName()),
      line('ecrã', innerWidth + '×' + innerHeight + ' · dpr ' + (Math.round(devicePixelRatio * 100) / 100)),
      line('pedido', Math.round(measureMs / 1000) + ' s de medida · ' + Math.round(warmupMs / 1000) + ' s de aquecimento' +
        (clamped ? ' (pedido ' + String(requested) + ' s, mínimo ' + (MIN_MEASURE_MS / 1000) + ' s)' : '')),
      line('reduzido', matchMedia('(prefers-reduced-motion: reduce)').matches ? 'sim' : 'não'),
      '',
      ...phaseReport('--- fase 1 · shader ---', first),
      '',
      ...phaseReport('--- fase 2 · imagem ---', result),
      '',
      ...summary(first, result)
    ];
    if (!first) lines.push('  (a fase 1 não chegou a esta página: ensaio incompleto)');

    ui.text.textContent = lines.join('\n');
    ui.short.textContent = first && Number.isFinite(first.fps) && Number.isFinite(result.fps)
      ? 'A/B ' + value(first.fps) + ' → ' + value(result.fps) + ' quadros/s · ' + shortDevice()
      : 'A/B incompleto';
    ui.copy.addEventListener('click', () => copyText(ui.text.textContent, ui.copy));
    ui.repeat.addEventListener('click', () => {
      const clean = new URLSearchParams(location.search);
      clean.delete('fase');
      clean.delete('shader');
      location.replace(location.pathname + '?' + clean.toString());
    });

    // Depois do resumo, o endereço volta ao princípio: uma recarga faz o ensaio de novo, em vez de
    // medir a segunda fase outra vez.
    const clean = new URLSearchParams(location.search);
    clean.delete('fase');
    clean.delete('shader');
    history.replaceState(null, '', location.pathname + '?' + clean.toString());
  });

  return ui.box;
}
