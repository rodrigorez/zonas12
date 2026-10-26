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

const seconds = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number * 1000 : fallback;
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

// Uma janela de medida: conta os quadros desenhados e amostra a política. Devolve só números — é o que
// vai para o relatório e o que se compara.
function measure(ms) {
  return new Promise((resolve) => {
    let frames = 0;
    let active = true;
    // O intervalo entre quadros, e não só a contagem: numa máquina rápida o browser desenha ao ritmo do
    // ecrã e os dois lados do A/B empatam (medido: 165 → 164,7 quadros/s num portátil com RTX 4060), o
    // que não quer dizer que o shader seja grátis — quer dizer que ainda sobra. O que distingue é o
    // **pior** quadro e quantos passaram do dobro da mediana: é aí que um telemóvel fraco se vê.
    const gaps = [];
    let lastFrameAt = 0;
    const count = (now) => {
      if (!active) return;
      frames += 1;
      if (lastFrameAt) gaps.push(now - lastFrameAt);
      lastFrameAt = now;
      requestAnimationFrame(count);
    };
    requestAnimationFrame(count);

    const samples = [];
    const sample = () => {
      const now = state();
      if (now && now.policy) {
        samples.push({
          updates: now.policy.updates || 0,
          pixelRatio: now.policy.pixelRatio,
          late: now.policy.late || 0,
          cadence: now.policy.cadence,
          mode: now.policy.mode,
          events: (now.policy.events || []).length
        });
      } else {
        samples.push(null);
      }
    };
    sample();
    const timer = setInterval(sample, SAMPLE_MS);

    setTimeout(() => {
      active = false;
      clearInterval(timer);
      const valid = samples.filter(Boolean);
      const first = valid[0] || null;
      const last = valid[valid.length - 1] || null;
      const ratios = valid.map((item) => item.pixelRatio).filter((value) => typeof value === 'number');
      const backgrounds = state() ? state().backgrounds || [] : [];
      const background = backgrounds.find((item) => item.dimension === 0) || {};
      const sorted = gaps.slice().sort((a, b) => a - b);
      const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : null;
      const worst = sorted.length ? sorted[sorted.length - 1] : null;
      const slow = median === null ? null : gaps.filter((gap) => gap > median * 2).length;
      resolve({
        seconds: Math.round(ms / 1000),
        fps: Math.round((frames / (ms / 1000)) * 10) / 10,
        worstFrameMs: worst === null ? null : Math.round(worst * 10) / 10,
        slowFrames: slow,
        frames: frames,
        background: background.mode || '—',
        shader: background.shaderId || null,
        mode: last ? last.mode : null,
        cadence: last ? last.cadence : null,
        // Sem política (fundo de imagem) não há atualizações a contar: fica «—», não zero.
        updatesPerSecond: first && last && last.updates > first.updates
          ? Math.round(((last.updates - first.updates) / (ms / 1000)) * 10) / 10
          : null,
        updates: last ? last.updates : null,
        pixelRatio: last ? last.pixelRatio : null,
        pixelRatioMin: ratios.length ? Math.min(...ratios) : null,
        pixelRatioMax: ratios.length ? Math.max(...ratios) : null,
        late: last ? last.late : null,
        events: last ? last.events : 0
      });
    }, ms);
  });
}

const line = (label, value) => label.padEnd(13) + value;

function phaseReport(title, result) {
  if (!result) return [title, '  (sem medição)'];
  return [
    title,
    '  ' + line('fundo', result.background + (result.shader ? ' · ' + result.shader : '')),
    '  ' + line('quadros', result.fps + '/s'),
    '  ' + line('pior quadro', (result.worstFrameMs === null ? '—' : result.worstFrameMs + ' ms') +
      (result.slowFrames === null ? '' : ' · lentos ' + result.slowFrames)),
    '  ' + line('cadência', (result.cadence === null ? '—' : result.cadence + '/s') +
      (result.mode ? ' · ' + result.mode : '')),
    '  ' + line('atualizações', (result.updatesPerSecond === null ? '—' : result.updatesPerSecond + '/s') +
      (result.updates === null ? '' : ' · total ' + result.updates)),
    '  ' + line('pixelRatio', (result.pixelRatio === null ? '—' : String(result.pixelRatio)) +
      (result.pixelRatioMin === null ? '' : ' (min ' + result.pixelRatioMin + ' · max ' + result.pixelRatioMax + ')')),
    '  ' + line('atrasos', result.late === null ? '—' : String(result.late)),
    '  ' + line('eventos', String(result.events))
  ];
}

function summary(first, second) {
  const lines = [];
  if (first && second && first.fps && second.fps) {
    const delta = Math.round(((second.fps - first.fps) / first.fps) * 1000) / 10;
    lines.push('--- comparação (imagem vs shader) ---');
    lines.push('  quadros      ' + first.fps + '/s → ' + second.fps + '/s  (' +
      (delta >= 0 ? '+' : '') + delta + '%)');
    if (first.worstFrameMs !== null && second.worstFrameMs !== null) {
      lines.push('  pior quadro  ' + first.worstFrameMs + ' ms → ' + second.worstFrameMs + ' ms');
    }
    if (first.slowFrames !== null && second.slowFrames !== null) {
      lines.push('  lentos       ' + first.slowFrames + ' → ' + second.slowFrames);
    }
  }
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

  const warmupMs = seconds(parameters.get('aquecimento'), 10000);
  const measureMs = seconds(parameters.get('segundos'), 45000);
  const phase = parameters.get('fase') === 'imagem' ? 'imagem' : 'shader';
  const ui = panel();

  const tick = (message) => { ui.short.textContent = message; };

  sceneReady().then(async (ready) => {
    if (!ready) {
      ui.text.textContent = 'zonas12 · ensaio\n  a cena não ficou pronta em 60 s: sem medição';
      return;
    }
    // A contagem decrescente cobre a fase inteira (aquecimento + medida) e corre **em paralelo** com a
    // medição: em série, cada fase levava o dobro do tempo (medido: 100 s em vez de 55 s).
    const total = Math.round((warmupMs + measureMs) / 1000);
    const countdown = (async () => {
      for (let left = total; left > 0; left--) {
        tick('ensaio · fase ' + (phase === 'shader' ? '1/2 (shader)' : '2/2 (imagem)') +
          ' · a aquecer/medir · ' + left + ' s');
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    })();
    await new Promise((resolve) => setTimeout(resolve, warmupMs));
    const result = await measure(measureMs);
    await countdown;
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
      line('janela', Math.round(measureMs / 1000) + ' s (aquecimento ' + Math.round(warmupMs / 1000) + ' s)'),
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
    ui.short.textContent = first && result
      ? 'A/B ' + first.fps + ' → ' + result.fps + ' quadros/s · ' + shortDevice()
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
