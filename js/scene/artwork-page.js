// Onde vive a ficha de uma obra (D60, refeita na D62), derivado num sítio só.
//
// A ficha é **uma página só** — `obra.html`, na raiz do projeto —, que se desenha ao carregar a partir
// do mundo e da obra que o endereço pede. Antes eram vinte e um ficheiros gerados; o autor pediu um
// único ficheiro que muda o conteúdo ao carregar. Quem o nomeia é este ficheiro: a cena (para navegar
// até ele), a ficha (para ler o que lhe pediram) e o editor (para o abrir) têm de concordar sobre o
// endereço, e a única forma de garantir isso é havê-lo escrito uma vez. É a mesma razão da D20 para o
// endereço de um asset.
//
// O endereço leva o mundo e a obra: `obra.html?mundo=scene1&id=3&lang=pt`. Leva o **slug** porque na
// exposição a base é sempre a raiz do projeto (as salas usam `<base href="../">`), e leva-os na
// **query** e não no caminho porque é isso que faz de cada obra um endereço próprio — e, portanto,
// uma página vista própria na medição de cada exposição (D62).
export const ARTWORK_PAGE_FILE = 'obra.html';

// O caminho relativo à raiz do projeto, com a língua quando ela é pedida (D12): é o que a cena
// resolve contra a base da página, e o que o editor abre numa aba.
export function artworkPageHref(worldSlug, artworkId, language) {
  if (typeof worldSlug !== 'string' || worldSlug === '') return null;
  if (!Number.isInteger(artworkId)) return null;
  const parameters = new URLSearchParams();
  parameters.set('mundo', worldSlug);
  parameters.set('id', String(artworkId));
  if (language) parameters.set('lang', String(language));
  return ARTWORK_PAGE_FILE + '?' + parameters.toString();
}

// O que a ficha lê do endereço (`?mundo=&id=&lang=`), já validado: `{ world, id, language }`, ou
// `null` quando o endereço não nomeia uma obra. Um `id` que não é um inteiro não é um id — a ficha
// diz «obra não encontrada» em vez de desenhar a obra zero.
export function artworkPageRequest(search) {
  const parameters = new URLSearchParams(String(search || ''));
  const world = parameters.get('mundo');
  const rawId = parameters.get('id');
  if (typeof world !== 'string' || !/^[a-z0-9-]+$/.test(world)) return null;
  if (rawId === null || !/^\d+$/.test(rawId)) return null;
  const language = parameters.get('lang');
  return {
    world,
    id: Number(rawId),
    language: language === 'en' ? 'en' : (language === 'pt' ? 'pt' : null)
  };
}

// De onde a ficha volta: a pasta do mundo a que a obra pertence. A ficha vive na raiz, por isso é o
// slug e uma barra — o endereço que o visitante conhece (D28). Sem mundo, a raiz, que é o portão. É uma
// **candidata**: um fixture (`r9`, `exemplo-ficha`) não tem pasta, e a ficha pergunta ao servidor se
// ela existe antes de a usar (`backTarget`, em js/obra.js) — se não existir, volta por `?scene=<slug>`.
export function artworkBackHref(worldSlug) {
  if (typeof worldSlug !== 'string' || !/^[a-z0-9-]+$/.test(worldSlug)) return './';
  return worldSlug + '/';
}

// A ficha anterior (D60) escrevia uma página por obra em `<slug>/obras/<id>.html`, e a D62 apagou-as:
// duas fontes do mesmo conteúdo acabariam por discordar. Este nome fica aqui para o validador poder
// provar que a pasta antiga não voltou.
export const LEGACY_ARTWORK_FOLDER = 'obras';
