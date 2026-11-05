// As ondas da construção (D104), numa casa só.
//
// Porque existe: o `mapa.mjs` julga as ondas e o `obra.mjs` executa-as. Duas cópias da mesma conta
// seriam duas verdades — e a primeira divergência seria invisível, porque as duas pareceriam certas.
//
// A regra, e a armadilha que ela fecha:
//   · uma sala só entra numa onda quando tem **duas** vizinhas já construídas (o `new-room` escreve a
//     porta de chegada no destino, e a L24 exige três portas);
//   · duas salas **vizinhas entre si** não podem nascer na mesma onda. A porta entre elas é escrita
//     por aquela que nasce depois, e nenhuma das duas "vê" a outra a tempo: a aresta ficava órfã no
//     mapa e o `--check` acusava `o mapa declara "scene23" e o dado não tem essa porta`. Foi assim que
//     este módulo nasceu — a onda 9 do plano tinha `scene22` e `scene23`, que são vizinhas.

export function vizinhosDe(salas, pares) {
  const vizinhos = new Map(salas.map((slug) => [slug, new Set()]));
  for (const [a, b] of pares) {
    if (vizinhos.has(a)) vizinhos.get(a).add(b);
    if (vizinhos.has(b)) vizinhos.get(b).add(a);
  }
  return vizinhos;
}

// `construidas` pode vir como Set (o `obra.mjs`) ou como Map slug->cena (o `mapa.mjs`, que precisa do
// dado): os dois querem dizer a mesma coisa, e um `new Set(Map)` daria um conjunto de pares — vazio de
// slugs. Foi esse detalhe que fez o plano dizer «não há ordem de construção» para as 27 salas.
export function calcularOndas({ salas, pares, construidas, minimo = 2 }) {
  const vizinhos = vizinhosDe(salas, pares);
  const prontas = construidas instanceof Map ? new Set(construidas.keys()) : new Set(construidas);
  const restantes = salas.filter((slug) => !prontas.has(slug));
  const ondas = [];

  while (restantes.length > 0) {
    const onda = [];
    const naOnda = new Set();
    for (const slug of restantes) {
      const existentes = [...vizinhos.get(slug)].filter((alvo) => prontas.has(alvo));
      if (existentes.length < minimo) continue;
      // O conjunto independente: uma vizinha na mesma onda deixaria a aresta por escrever.
      if ([...vizinhos.get(slug)].some((alvo) => naOnda.has(alvo))) continue;
      onda.push({ slug, destinos: existentes });
      naOnda.add(slug);
    }
    if (onda.length === 0) return { ondas, vizinhos, bloqueadas: restantes };
    for (const passo of onda) {
      prontas.add(passo.slug);
      restantes.splice(restantes.indexOf(passo.slug), 1);
    }
    ondas.push(onda);
  }
  return { ondas, vizinhos, bloqueadas: [] };
}

// As arestas que a construção por ondas **escreve**. Cada aresta é escrita uma vez: pela sala que
// nasce em segundo lugar. Uma aresta do mapa que não esteja aqui é uma porta que ninguém vai criar.
export function arestasCobertas(ondas) {
  const cobertas = new Set();
  const chave = (a, b) => (a < b ? a + '|' + b : b + '|' + a);
  for (const onda of ondas) {
    for (const passo of onda) {
      for (const destino of passo.destinos) cobertas.add(chave(passo.slug, destino));
    }
  }
  return { cobertas, chave };
}
