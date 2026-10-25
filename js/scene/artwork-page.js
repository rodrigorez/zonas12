// Onde vive a ficha de uma obra (D60), derivado num sítio só.
//
// A ficha é uma **página estática por obra** — como as `galerias/obraN.html` das Zonas 11 —, gerada a
// partir do mundo pela ferramenta (`tools/artwork/build.mjs`). Quem a nomeia é este ficheiro: a cena
// (para navegar até ela), a ferramenta (para a escrever) e o validador (para provar que existe e que
// não está velha) têm de concordar sobre o caminho, e a única forma de garantir isso é havê-lo escrito
// uma vez. É a mesma razão da D20 para o endereço de um asset.
//
// O caminho segue a D28 (a pasta é o endereço): a ficha de uma obra vive dentro da pasta do mundo a
// que a obra pertence, em `obras/<id>.html`. Assim `../` a partir da ficha é o mundo, e a ficha
// continua a poder ser servida por qualquer servidor estático, sem saber onde está a raiz.
export const ARTWORK_PAGE_FOLDER = 'obras';

// O caminho da ficha, relativo à raiz do projeto: `scene1/obras/3.html`. Sem barra à frente: quem
// escreve o ficheiro junta-o à raiz, e quem navega junta-o à base da página (D28).
export function artworkPagePath(worldSlug, artworkId) {
  if (typeof worldSlug !== 'string' || worldSlug === '') return null;
  if (!Number.isInteger(artworkId) && typeof artworkId !== 'number') return null;
  return worldSlug + '/' + ARTWORK_PAGE_FOLDER + '/' + artworkId + '.html';
}

// O endereço a que a cena navega. **Não** é relativo à pasta do mundo: as páginas da exposição usam
// `<base href="../">` dentro da sala e `<base href="./">` na raiz, por isso a base é sempre a raiz do
// projeto (é o que faz a porta de mundo funcionar com `worldHref`). O caminho leva o slug por isso, e
// resolve-se contra essa base em qualquer das páginas. A língua vai no endereço, como em todo o lado
// (D12) — a ficha é gerada nas duas e escolhe a que lhe pedirem.
export function artworkPageHref(worldSlug, artworkId, language) {
  const path = artworkPagePath(worldSlug, artworkId);
  if (!path) return null;
  return language ? path + '?lang=' + encodeURIComponent(language) : path;
}

// De onde a ficha volta: a página do mundo a que a obra pertence. `../` a partir de
// `<slug>/obras/<id>.html` é `<slug>/` — o endereço que o visitante conhece.
export const ARTWORK_BACK_HREF = '../';
