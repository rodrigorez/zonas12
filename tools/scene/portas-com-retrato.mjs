// As portas que têm retrato, lidas do **dado** (D84): uma entrada por porta `preview` que navega, com
// o mundo de destino, o mundo de origem e se essa origem leva o `?from` (as salas levam; a sala de
// ensaio não — `world.carryOrigin: false`).
//
// Vive aqui, e não dentro do `portrait.mjs`, porque duas ferramentas precisam dela: quem desenha os
// retratos (`portrait.mjs`) e quem os reparte por vagas (`retratos-em-vagas.mjs`). Duas cópias da mesma
// leitura seriam duas verdades — a mesma razão que juntou o `disk.mjs` e o `fixtures.js`.
//
// A lista esteve escrita à mão (39 pares) e teria de crescer à mão com cada porta nova — a mesma lição
// que a P1 da spec (D83) deixou nas baterias. O que continua a ser uma regra está aqui: só se desenha o
// que segue a convenção `<destino>-de-<origem>.jpg`, porque é essa a porta que a janela mostra; um
// fixture que aponte para um panorama antigo (o `example` aponta para `praia.jpg`) fica de fora em vez
// de ser substituído por um retrato.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export const CONVENCAO = /(^|\/)previews\/[a-z0-9-]+-de-[a-z0-9-]+\.jpg$/;

// `pasta` é a dos mundos (`data/worlds`). Devolve os pares por ordem estável, para que duas corridas
// seguidas desenhem pela mesma ordem e um registo de falhas se possa comparar com o anterior.
export function portasDoDado(pasta) {
  const portas = [];
  const vistas = new Set();
  for (const nome of readdirSync(pasta).filter((entrada) => entrada.endsWith('.json'))) {
    const cena = JSON.parse(readFileSync(join(pasta, nome), 'utf8'));
    const origem = (cena.world && cena.world.slug) || nome.replace(/\.json$/, '');
    const direto = Boolean(cena.world && cena.world.carryOrigin === false);
    for (const portal of cena.portals || []) {
      const janela = portal.window || {};
      const acao = portal.action || {};
      if (janela.kind !== 'preview' || acao.kind !== 'navigate') continue;
      const retrato = (cena.assets && cena.assets[janela.asset] && cena.assets[janela.asset].path) || null;
      if (!retrato || !CONVENCAO.test(retrato)) continue;
      const chave = origem + '>' + acao.target;
      if (vistas.has(chave)) continue;
      vistas.add(chave);
      portas.push({ destino: acao.target, origem, direto, retrato });
    }
  }
  return portas.sort((a, b) => a.destino.localeCompare(b.destino) || a.origem.localeCompare(b.origem));
}
