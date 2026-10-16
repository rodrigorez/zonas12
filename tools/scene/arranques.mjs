// Os arranques de cada mundo (D28): uma pasta por sala, com o mesmo `index.html` dentro.
//
// Porque existe: desde a Fase 3B cada mundo tem o seu endereço — `/` é o portão e `/<slug>/` é uma
// sala — e os quatro ficheiros são **o mesmo**, fora da linha do `<base>`. É isso que faz deles 1
// ficheiro copiado 4 vezes (e não 4 ficheiros a divergir sem ninguém dar por isso), e é o `<base>`
// que distingue a raiz de uma sala: é ele que resolve `js/app.js`, `data/worlds/<slug>.json` e
// `assets/…`, que no dado estão escritos a partir da raiz da publicação.
//
// O que se exige não é um conteúdo: é que existam, que o `<base>` de cada um aponte para a raiz e
// que sejam iguais fora dele. Quem edita um, edita os quatro.
//
// A leitura do disco entra por parâmetro (`read`), como o `exists` e o `imageSize` do validador:
// assim o instrumento prova que falha quando deve (tools/scene/laws-selftest.mjs) sem mexer em
// ficheiros a sério. Uso: node tools/scene/validate.mjs (é lá que isto é chamado com o disco real).
export const BASE_LINE = /<base\s+href="([^"]*)"\s*\/?>/i;

// O mesmo ficheiro sem a linha do `<base>`: é o que se compara entre arranques.
export const withoutBase = (text) => text.replace(BASE_LINE, '<base>');

// O `<base>` que um arranque tem de ter: a raiz da publicação, à profundidade da pasta dele.
export const expectedBase = (depth) => (depth === 0 ? './' : '../'.repeat(depth));

// `slugs` são os mundos a conferir (o portão incluído, o fixture de fora) e `entry` é o mundo que
// mora na raiz. Devolve os arranques lidos e os erros, um por defeito, todos eles razões.
export function checkArranques(slugs, options) {
  const entry = options.entry;
  const read = options.read;
  const checked = [];
  const errors = [];

  for (const slug of slugs) {
    const relative = slug === entry ? 'index.html' : `${slug}/index.html`;
    const depth = relative.split('/').length - 1;
    const text = read(relative);
    if (text === null || text === undefined) {
      errors.push(`${relative} is not there: the folder of a world is its slug, and the arranque ` +
        `inside it is the same index.html as the root (D28)`);
      continue;
    }
    const found = BASE_LINE.exec(text);
    if (!found) {
      const folder = relative.split('/').slice(0, -1).join('/') || '.';
      errors.push(`${relative} has no <base>: its relative paths would resolve inside "${folder}/" ` +
        `and nothing would load (D28)`);
      continue;
    }
    if (found[1] !== expectedBase(depth)) {
      errors.push(`${relative} has <base href="${found[1]}"> and needs href="${expectedBase(depth)}": ` +
        `the root of the publication is ${depth} level(s) above this arranque (D28)`);
      continue;
    }
    checked.push({ slug: slug, relative: relative, text: withoutBase(text) });
  }

  const reference = checked[0];
  for (const arranque of checked.slice(1)) {
    if (arranque.text !== reference.text) {
      errors.push(`${arranque.relative} is not the same file as ${reference.relative} outside the ` +
        `<base> line: the arranques are one file copied per world, and a change in one is a change ` +
        `in all of them (D28)`);
    }
  }

  return { checked: checked, errors: errors };
}
