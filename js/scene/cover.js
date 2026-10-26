// A capa de uma obra, por tentativas (D65).
//
// O autor: «podemos fazer um metodo que ele busca a capa do youtube se não conseguir ele faz um fallback
// para imagem indicada, que pode estar hospedada em um site por exemplo, ou na pasta de assets do
// projeto, mas isso é opcional no csv, se nada der certo, ele mostra uma imagem padrão avisando que a
// capa da obra esta com problema e é necessario avisar o adminstrador da galeria».
//
// A cadeia é esta, por ordem:
//
//   1. **o thumbnail do YouTube**, quando o site da obra é um vídeo do YouTube — derivado do próprio
//      endereço, sem ninguém escrever nada no dado (`i.ytimg.com/vi/<id>/hqdefault.jpg`, que existe
//      para todos os vídeos; `maxresdefault` não existe para todos);
//   2. **a capa do CSV**, que é opcional e pode ser um ficheiro do projeto ou um endereço (D64);
//   3. a **imagem padrão** que diz que a capa tem um problema e que é preciso avisar o administrador.
//
// A resolução é feita a carregar: quem usa a cadeia tenta a primeira, e no erro passa à seguinte. É o
// único caminho honesto — um `HEAD` não garante que a imagem descodifica, e o `onerror` de um `<img>` é
// a única coisa que sabe as duas coisas ao mesmo tempo.
export const DEFAULT_COVER = 'assets/covers/sem-capa.svg';

// O id de um vídeo do YouTube, de qualquer das formas que as pessoas copiam: `watch?v=`, `youtu.be/`,
// `embed/`, `shorts/`. Devolve `null` quando não é YouTube — e aí a cadeia começa na capa do CSV.
export function youtubeVideoId(url) {
  const value = String(url || '');
  const patterns = [
    /(?:youtube\.com|youtube-nocookie\.com)\/watch\?(?:[^#]*&)?v=([A-Za-z0-9_-]{6,})/,
    /(?:youtube\.com|youtube-nocookie\.com)\/embed\/([A-Za-z0-9_-]{6,})/,
    /(?:youtube\.com)\/shorts\/([A-Za-z0-9_-]{6,})/,
    /youtu\.be\/([A-Za-z0-9_-]{6,})/
  ];
  for (const pattern of patterns) {
    const found = value.match(pattern);
    if (found) return found[1];
  }
  return null;
}

// `qdefault` (480×360) é o thumbnail mais pequeno que existe para todos os vídeos; `hqdefault` é
// 480×360 também, mas com a barra preta quando o vídeo é 4:3. Fica o `hqdefault`, que é o que o YouTube
// usa nas listas. Quem quiser melhor define a capa no CSV (a segunda tentativa).
export function youtubeCoverUrl(videoId) {
  return 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg';
}

// As candidatas, por ordem, sem repetir: `[{ src, from }]`. `from` diz de onde veio, para a ficha e os
// instrumentos poderem dizer qual ganhou.
export function coverCandidates(artwork, catalogue) {
  const candidates = [];
  const seen = new Set();
  const add = (src, from) => {
    if (typeof src !== 'string' || src === '' || seen.has(src)) return;
    seen.add(src);
    candidates.push({ src: src, from: from });
  };

  const videoId = artwork && artwork.site ? youtubeVideoId(artwork.site) : null;
  if (videoId) add(youtubeCoverUrl(videoId), 'youtube');

  const asset = artwork && artwork.asset ? (catalogue || {})[artwork.asset] : null;
  if (asset && asset.type === 'image') add(asset.path, 'capa');

  return candidates;
}

// A mesma cadeia, resolvida no browser: devolve a primeira que carrega, ou a imagem padrão.
// `Image` e não `fetch`: a pergunta é «descodifica?», e é isso que um <img> responde.
export function resolveCover(candidates, timeoutMs = 6000) {
  const list = Array.isArray(candidates) ? candidates.slice() : [];
  list.push({ src: DEFAULT_COVER, from: 'padrao' });
  let index = 0;
  return new Promise((resolve) => {
    const next = () => {
      if (index >= list.length) {
        resolve({ src: DEFAULT_COVER, from: 'padrao' });
        return;
      }
      const candidate = list[index++];
      const image = new Image();
      let settled = false;
      const done = (loaded) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (loaded) resolve(candidate);
        else next();
      };
      const timer = setTimeout(() => done(false), timeoutMs);
      image.onload = () => done(image.naturalWidth > 0);
      image.onerror = () => done(false);
      image.src = candidate.src;
    };
    next();
  });
}
