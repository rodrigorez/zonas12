// As plataformas de mídia que a ficha sabe embutir (D61), num sítio só.
//
// As Zonas 11 traziam esta tabela no `platform-detector.js`, a correr no browser à carga da página.
// Aqui é um módulo: a ficha (D62) usa-o ao desenhar, e os instrumentos usam-no fora do browser para
// provar a tabela sem abrir nada. A lista é a mesma — YouTube, o editor do p5.js, Vimeo,
// OpenProcessing e Shadertoy —, e o que não for nenhuma delas é embutido tal e qual, que é o que a
// referência faz no fim: nunca se inventa um embed que o site não serve.
//
// `mute=1` no YouTube em vez do `autoplay=1` sozinho da referência: um vídeo com som não arranca
// sozinho em nenhum browser moderno, e o resultado seria um retângulo preto à espera de um clique.
export const MEDIA_ALLOW = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';

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
  }
];

// A plataforma de um endereço: `{ platform, src, allow, fullscreen }`. Sem plataforma conhecida,
// `platform: 'site'` e o endereço tal e qual.
export function platformEmbed(url) {
  const target = String(url || '');
  for (const platform of PLATFORMS) {
    for (const pattern of platform.patterns) {
      const found = target.match(pattern);
      if (found) {
        return {
          platform: platform.id,
          src: platform.embed(found[1], target),
          allow: MEDIA_ALLOW,
          fullscreen: true
        };
      }
    }
  }
  return { platform: 'site', src: target, allow: '', fullscreen: true };
}
