// As plataformas de mídia que a ficha sabe embutir (D61), num sítio só.
//
// As Zonas 11 traziam esta tabela no `platform-detector.js`, a correr no browser à carga da página.
// Aqui é um módulo: a ficha (D62) usa-o ao desenhar, e os instrumentos usam-no fora do browser para
// provar a tabela sem abrir nada. A lista é a mesma — YouTube, o editor do p5.js, Vimeo,
// OpenProcessing e Shadertoy —, mais duas que o autor trouxe e que **servem** um embed: o Instagram
// (`/p/<código>/embed` responde 200 e não manda `X-Frame-Options`) e o álbum do Imgur
// (`/a/<código>/embed` responde 200 e o CSP não traz `frame-ancestors`); as páginas normais de ambos
// mandam `DENY`, e é por isso que sem estas duas entradas a ficha abria uma caixa vazia. O que não for
// nenhuma delas é embutido tal e qual, que é o que a referência faz no fim: nunca se inventa um embed
// que o site não serve.
//
// `mute=1` no YouTube em vez do `autoplay=1` sozinho da referência: um vídeo com som não arranca
// sozinho em nenhum browser moderno, e o resultado seria um retângulo preto à espera de um clique.
export const MEDIA_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

// Os endereços que **não se deixam embutir**, medidos (§8.5-d do PENDENCIAS): a Canva manda
// `X-Frame-Options: deny` e o seu `/view?embed` responde 403 a quem não tem sessão; uma **pasta** do
// Drive não tem `preview` e responde 403; e o `open?id=` do Drive redirecciona para `/view`, que
// responde 403 dentro de um `<iframe>`. A lista é de padrões, e não de obras: a mesma plataforma serve
// um ficheiro partilhado (`/file/d/<ID>/preview`) e não serve uma pasta, por isso quem decide é o
// endereço.
const REFUSES = [
  { padrao: /canva\.(com|link)\//i, motivo: 'a Canva responde `X-Frame-Options: deny` (e o `/view?embed` dá 403 sem sessão)' },
  { padrao: /drive\.google\.com\/drive\/(u\/\d+\/)?folders\//i, motivo: 'é uma pasta do Drive: uma pasta não tem `/preview`' },
  { padrao: /drive\.google\.com\/open\?id=/i, motivo: 'o `open?id=` do Drive redirecciona para `/view`, que recusa o iframe' }
];

// Porque é que este endereço não se deixa embutir, ou `null` se nada se souber contra ele. Quem
// desenha a ficha (D62) e quem mede os links (`links.mjs`) fazem a mesma pergunta, para não haver duas
// verdades sobre o mesmo endereço.
export function embedRefusal(url) {
  const target = String(url || '');
  for (const recusa of REFUSES) {
    if (recusa.padrao.test(target)) return recusa.motivo;
  }
  return null;
}

export const PLATFORMS = [
  {
    id: 'youtube',
    patterns: [/youtu\.be\/([^?&/]+)/, /youtube\.com\/watch\?v=([^&]+)/, /youtube\.com\/embed\/([^?&/]+)/],
    embed: (id) => 'https://www.youtube.com/embed/' + id + '?controls=1&autoplay=1&mute=1&rel=0'
  },
  {
    id: 'p5js',
    patterns: [/editor\.p5js\.org\/.*\/full\/([^?&/]+)/],
    embed: (id, url) => url
  },
  {
    id: 'vimeo',
    patterns: [/vimeo\.com\/([0-9]+)(?:\/[a-zA-Z0-9]+)?/, /player\.vimeo\.com\/video\/([0-9]+)/],
    embed: (id) => 'https://player.vimeo.com/video/' + id + '?autoplay=1&muted=1&color=FF5722'
  },
  {
    id: 'openprocessing',
    patterns: [/openprocessing\.org\/sketch\/([0-9]+)/],
    embed: (id) => 'https://openprocessing.org/sketch/' + id + '/embed/'
  },
  {
    id: 'shadertoy',
    patterns: [/shadertoy\.com\/view\/([a-zA-Z0-9]+)/],
    embed: (id) => 'https://shadertoy.com/embed/' + id + '?gui=false&paused=false'
  },
  {
    id: 'instagram',
    patterns: [/instagram\.com\/(?:p|reel|tv)\/([^?&/]+)/],
    embed: (id) => 'https://www.instagram.com/p/' + id + '/embed'
  },
  {
    id: 'imgur',
    patterns: [/imgur\.com\/a\/([^?&/]+)/, /imgur\.com\/gallery\/([^?&/]+)/],
    embed: (id) => 'https://imgur.com/a/' + id + '/embed'
  }
];

// A plataforma de um endereço: `{ platform, src, allow, fullscreen, frameable, motivo }`. Sem
// plataforma conhecida, `platform: 'site'` e o endereço tal e qual. `frameable: false` é uma medida e
// não uma opinião: o endereço está na lista dos que recusam o `<iframe>`, e `motivo` diz porquê — a
// ficha usa-o para deixar a capa à vista em vez da página de erro do browser.
export function platformEmbed(url) {
  const target = String(url || '');
  const recusa = embedRefusal(target);
  for (const platform of PLATFORMS) {
    for (const pattern of platform.patterns) {
      const found = target.match(pattern);
      if (found) {
        return {
          platform: platform.id,
          src: platform.embed(found[1], target),
          allow: MEDIA_ALLOW,
          fullscreen: true,
          frameable: !recusa,
          motivo: recusa
        };
      }
    }
  }
  return { platform: 'site', src: target, allow: '', fullscreen: true, frameable: !recusa, motivo: recusa };
}
