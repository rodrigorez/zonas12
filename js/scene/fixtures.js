// Os mundos que não são salas (D9): ficheiros de ensaio, abertos com `?scene=<slug>` (ou por
// `obra.html?mundo=…`), que não têm pasta própria, não entram no grafo e não obedecem às leis da
// exposição — não têm anéis, não têm três a cinco portas nem uma ao portão, e um ensaio não se mede
// em visitas.
//
// `scene100` é a **sala de ensaio** (D84): existe para medir portais, só se sai dela para o projeto
// e nunca se entra nela a partir do projeto — é a lista que garante as duas coisas, porque é ela que
// a tira do grafo. As suas portas navegam **sem** `?from` (`world.carryOrigin: false`), e é por isso
// que nenhuma sala precisa de uma porta de chegada dela.
//
// Porque existe: a lista estava copiada em quatro ferramentas (`validate.mjs`, `new-world.mjs`,
// `ring.mjs` e a migração do grafo), e a lei dos dois anéis precisa dela **também no browser** — o
// `example` abre-se na mesma página que uma sala, e um aviso dele na consola seria o T8 a falhar.
export const FIXTURES = ['example', 'shader', 'r9', 'exemplo-ficha', 'scene100'];

export const isFixture = (slug) => FIXTURES.includes(slug);
