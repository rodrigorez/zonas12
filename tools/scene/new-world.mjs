#!/usr/bin/env node
// Cria a pasta de um mundo e o arranque dentro dela — e nada mais.
//
// Porque é um comando e não um botão do editor: a **D2** diz que o editor nunca escreve em disco (é um
// site estático, gravar é substituir o ficheiro à mão) e a **D14** recusou o manifesto, por isso a pasta
// nem sequer é *vista* de dentro da página. A ferramenta faz o que a página não pode, e o editor exporta
// o JSON — é a **D31**.
//
// O arranque é o **mesmo** `index.html` da raiz com outra linha de `<base>` (D28), e o resultado é
// conferido pelo mesmo verificador que a linha de comando usa (`tools/scene/arranques.mjs`), em vez de
// se confiar em que a cópia ficou bem.
//
// Uso: node tools/scene/new-world.mjs <slug>
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkArranques } from './arranques.mjs';
import { ENTRY_WORLD } from '../../js/modules/portal-kinds.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..', '..');
const slug = (process.argv[2] || '').trim();
const WORLD_NAME = /^[a-z0-9-]+$/;

if (!WORLD_NAME.test(slug)) {
  console.error('uso: node tools/scene/new-world.mjs <slug>   (letras minúsculas, números e hífenes)');
  process.exit(1);
}
if (slug === ENTRY_WORLD) {
  console.error(`${slug} é o mundo de entrada: vive na raiz, não numa pasta (D24).`);
  process.exit(1);
}
if (existsSync(join(root, slug))) {
  console.error(`${slug}/ já existe: a ferramenta não escreve por cima do que lá está.`);
  process.exit(1);
}

const arranque = readFileSync(join(root, 'index.html'), 'utf8');
const BASE_ROOT = /<base\s+href="\.\/"\s*\/?>/i;
if (!BASE_ROOT.test(arranque)) {
  console.error('index.html não tem o <base href="./"> da raiz: sem ele a cópia não sabe a que profundidade está (D28).');
  process.exit(1);
}

mkdirSync(join(root, slug));
writeFileSync(
  join(root, slug, 'index.html'),
  arranque.replace(BASE_ROOT, '<base href="../" />'),
  'utf8'
);

// Os mundos que já têm ficheiro, mais o que acabou de ganhar arranque (ainda sem JSON, e é o editor que
// o vai exportar). Os fixtures não são salas — não têm pasta, e o validador da linha de comando também
// os deixa de fora (a mesma lista de `tools/scene/validate.mjs`).
const FIXTURES = ['example', 'shader', 'r9', 'exemplo-ficha'];
const directory = join(root, 'data', 'worlds');
const slugs = new Set([slug]);
if (existsSync(directory)) {
  for (const name of readdirSync(directory).filter((entry) => entry.endsWith('.json'))) {
    try {
      const scene = JSON.parse(readFileSync(join(directory, name), 'utf8'));
      const declared = (scene.world && scene.world.slug) || basename(name, '.json');
      if (FIXTURES.indexOf(declared) === -1) slugs.add(declared);
    } catch (error) {
      console.error(`${name}: ${error.message}`);
    }
  }
}

const check = checkArranques([...slugs], {
  entry: ENTRY_WORLD,
  read: (relative) => {
    const full = join(root, relative);
    return existsSync(full) ? readFileSync(full, 'utf8') : null;
  }
});

console.log(`criado: ${slug}/index.html (o mesmo arranque da raiz, com <base href="../">)`);
if (check.errors.length > 0) {
  for (const error of check.errors) console.error(`  error: ${error}`);
  process.exit(1);
}
console.log(`arranques: ${check.checked.length} mundos conferidos, o mesmo ficheiro fora da linha do <base>`);
console.log('');
console.log('próximos passos:');
console.log(`  1. no editor: abra ${ENTRY_WORLD}, crie a porta para «${slug}» (painel Mundo) e exporte os dois ficheiros`);
console.log(`  2. em data/worlds/${slug}.json: o mundo novo precisa de uma porta com arrivalFrom: "${ENTRY_WORLD}" (L19)`);
