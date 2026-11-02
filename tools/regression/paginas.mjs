// As páginas da exposição, **lidas do dado** (P1 da `docs/SPEC-NOVA-SALA.md`).
//
// Porque existe: as duas baterias que medem a exposição página a página — o T1/T7/T11
// (`traversal-tests.mjs`) e os T2–T12 (`twelve-tests.mjs`) — tinham a lista escrita à mão. Uma sala
// nova que não entrasse nessa lista **nunca era medida**, e a bateria ficava verde sem ter olhado para
// ela: o único passo da spec que falhava em silêncio. O dado sabe quais são as páginas (um mundo por
// ficheiro em `data/worlds/`, menos os fixtures), e o mesmo ficheiro que a exposição carrega é o que se
// lê aqui.
//
// O que continua a ser uma escolha, e não uma derivação, está nomeado em `CHEGADAS`: com que origem
// cada sala é aberta. Por omissão chega-se **do portão** (é o caminho que o visitante faz); duas salas
// são abertas por outra origem de propósito, porque é a única maneira de estes testes exercitarem uma
// chegada que não seja a do portão.
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { ROOT } from './harness.mjs';
import { FIXTURES } from '../../js/scene/fixtures.js';
import { ENTRY_WORLD } from '../../js/modules/portal-kinds.js';

// As chegadas deliberadas: uma sala que se abre por uma porta que não é a do portão.
const CHEGADAS = { scene2: 'scene1', scene3: 'scene2' };

// Os fixtures que estas baterias abrem (os outros três têm as suas próprias: o `shader` é do ensaio do
// fundo, o `r9` dos quatro valores e o `exemplo-ficha` da ficha). Não têm pasta: abrem-se na página da
// raiz, com `?scene=`.
//
// O `example` é o fixture de sempre; a `scene100` é a **sala de ensaio** (D84) e é aberta aqui de
// propósito — é o único caminho por onde se entra nela, porque nenhuma porta do projeto lá chega. Se
// não estivesse nesta lista, a sala que só se alcança por fora ficava a única página da exposição que
// nenhuma bateria mede.
const FIXTURES_ABERTOS = ['example', 'scene100'];

// O primeiro deles, para quem só quer "o fixture" (é o `example`, o que tem as fichas e as portas de
// ensaio).
const FIXTURE_ABERTO = FIXTURES_ABERTOS[0];

// A ordem em que se lê a exposição: o portão primeiro e as salas pelo número (o mesmo `order` que o
// `tools/scene/ring.mjs` usa para ler o dado).
function numeroDoSlug(slug) {
  const digitos = /(\d+)/.exec(slug);
  return digitos ? Number(digitos[1]) : -1;
}

export function paginasDaExposicao() {
  const pasta = join(ROOT, 'data', 'worlds');
  const salas = [];
  const ignorados = [];
  for (const nome of readdirSync(pasta).filter((entrada) => entrada.endsWith('.json'))) {
    let cena;
    try {
      cena = JSON.parse(readFileSync(join(pasta, nome), 'utf8'));
    } catch (error) {
      // Um ficheiro que não abre não pode desaparecer da lista em silêncio (P3): fica registado aqui e
      // as baterias dizem-no em voz alta.
      ignorados.push(nome + ': ' + error.message);
      continue;
    }
    const slug = (cena.world && cena.world.slug) || basename(nome, '.json');
    if (FIXTURES.includes(slug)) continue;
    salas.push({ slug, cena });
  }
  salas.sort((a, b) => {
    if (a.slug === ENTRY_WORLD) return -1;
    if (b.slug === ENTRY_WORLD) return 1;
    const numeroA = numeroDoSlug(a.slug);
    const numeroB = numeroDoSlug(b.slug);
    if (numeroA !== numeroB) {
      if (numeroA < 0) return 1;
      if (numeroB < 0) return -1;
      return numeroA - numeroB;
    }
    return a.slug.localeCompare(b.slug);
  });

  const paginas = [];
  for (const { slug, cena } of salas) {
    const chegadas = (cena.portals || [])
      .map((portal) => portal.arrivalFrom)
      .filter((valor) => typeof valor === 'string');
    const pedida = CHEGADAS[slug];
    const doPortao = chegadas.includes(ENTRY_WORLD);
    paginas.push({
      slug,
      rota: slug === ENTRY_WORLD ? '/' : '/' + slug + '/',
      cena: null,
      from: slug === ENTRY_WORLD ? null
        : pedida && chegadas.includes(pedida) ? pedida
          : doPortao ? ENTRY_WORLD
            : chegadas[0] || null
    });
  }
  for (const fixture of FIXTURES_ABERTOS) {
    paginas.push({ slug: fixture, rota: '/', cena: fixture, from: null });
  }

  return { paginas, salas: salas.map((sala) => sala.slug), ignorados };
}

// A rede de segurança da P3: a lista derivada tem de conter **todas** as salas do dado. Se um dia a
// derivação passar a filtrar por engano (uma condição a mais, um slug que não casa), esta conta é a que
// o diz — em vez de a bateria ficar verde por ter medido menos páginas.
export function cobertura(lista) {
  const deFora = lista.salas.filter((slug) => !lista.paginas.some((pagina) => pagina.slug === slug));
  const dasSalas = lista.paginas.filter((pagina) => !FIXTURES_ABERTOS.includes(pagina.slug)).length;
  return {
    salas: lista.salas.length,
    paginas: dasSalas,
    deFora,
    ignorados: lista.ignorados,
    ok: deFora.length === 0 && lista.ignorados.length === 0 && dasSalas === lista.salas.length
  };
}
