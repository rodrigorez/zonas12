#!/usr/bin/env node
// A exposição **publicada**, perguntada no ar (PENDENCIAS §8.9).
//
// Porque existe: todas as baterias medem o disco, e o `main` é o que o GitHub Pages serve. Entre
// 2026-11-04 e 2026-11-08 o `main` ficou parado quatro dias e o site publicou **13** salas em vez de
// 28 — `scene14`, `scene20` e `scene27` respondiam 404 — com **todas** as baterias verdes, porque
// nenhuma delas pergunta ao site. Publicar é avançar o `main`; isto diz se o que está no ar é o de cá.
//
// O que verifica, e são duas perguntas diferentes:
//   · a página de cada sala responde 200 (a sala existe no site, não só no repositório);
//   · o `data/worlds/<slug>.json` que o site serve é **igual** ao do repositório — o caso que os 404
//     não apanham: uma versão publicada que responde 200 e diz outra coisa.
//
// Uso, da raiz do projeto:
//   node tools/regression/publicado.mjs            as salas e o dado
//   node tools/regression/publicado.mjs --tudo     lista também o que está bem
//   ZONAS_PUBLICADO=https://exemplo/ node …        outro endereço (um ensaio local, por exemplo)
//
// Sai com 1 quando alguma página não responde 200 ou quando um ficheiro de mundo publicado não é igual
// ao do repositório, e 0 quando o site concorda com o repositório — é o que o torna utilizável numa
// bateria e num `&&` de shell.
//
// Não entra no `all.mjs`: precisa de rede, e o Pages leva alguns minutos a reconstruir depois do
// *push*. Uma bateria que depende de um servidor alheio é a mesma dependência que a P1 tirou do dado.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './harness.mjs';
import { paginasDaExposicao } from './paginas.mjs';

const BASE = (process.env.ZONAS_PUBLICADO || 'https://rodrigorez.github.io/zonas12').replace(/\/+$/, '');
const tudo = process.argv.slice(2).includes('--tudo');

// A cache do CDN do Pages é por URL: um parâmetro único por corrida pede sempre a versão de agora. Sem
// isto, um site acabado de publicar era dado por desactualizado (ou por actualizado) pelo acaso da
// cache — e o instrumento media a cache, não a publicação.
const cacheBuster = '?verificacao=' + Date.now();

function pedir(caminho) {
  const controlo = new AbortController();
  const temporizador = setTimeout(() => controlo.abort(), 20000);
  return fetch(BASE + caminho + cacheBuster, { redirect: 'follow', signal: controlo.signal })
    .then(async (resposta) => ({
      estado: resposta.status,
      corpo: await resposta.text()
    }))
    .catch((erro) => ({ erro: erro.name === 'AbortError' ? 'tempo esgotado (20 s)' : erro.message }))
    .finally(() => clearTimeout(temporizador));
}

// A comparação é de **conteúdo**, não de bytes: neste Windows o `git` faz o checkout com CRLF e o site
// serve o que está no objecto do `git`, com LF — medido, uma sala de 15 kB dava 650 B de diferença que
// era só isso. O que se pergunta é «o site diz o mesmo que o repositório», e a resposta não pode
// depender do fim de linha de cada máquina.
const semCR = (texto) => texto.replace(/\r\n/g, '\n');

const problemas = [];
const add = (tipo, onde, detalhe) => problemas.push({ tipo, onde, detalhe });

const lista = paginasDaExposicao();
// As páginas das salas: os fixtures abrem-se na raiz (`/?scene=`), e a raiz é medida uma vez, com o
// portão — que é a página por onde o visitante entra.
const salas = lista.paginas.filter((pagina) => pagina.cena === null);

console.log('');
console.log('publicado: ' + BASE);
console.log(salas.length + ' sala(s) · a verificar a página e o dado de cada uma…');

for (const sala of salas) {
  const pagina = await pedir(sala.rota);
  if (pagina.erro) {
    add('página não responde', sala.slug, sala.rota + ' — ' + pagina.erro);
  } else if (pagina.estado !== 200) {
    add('página não responde', sala.slug, sala.rota + ' — HTTP ' + pagina.estado);
  } else if (tudo) {
    console.log('  ok ' + sala.rota);
  }

  // O dado: é ele que diz o que a sala desenha. Comparado byte a byte, porque «responde 200» ainda não
  // quer dizer «é esta versão».
  const remoto = await pedir('/data/worlds/' + sala.slug + '.json');
  const local = readFileSync(join(ROOT, 'data', 'worlds', sala.slug + '.json'), 'utf8');
  if (remoto.erro) {
    add('dado não responde', sala.slug, '/data/worlds/' + sala.slug + '.json — ' + remoto.erro);
  } else if (remoto.estado !== 200) {
    add('dado não responde', sala.slug, '/data/worlds/' + sala.slug + '.json — HTTP ' + remoto.estado);
  } else if (semCR(remoto.corpo) !== semCR(local)) {
    add('dado publicado não é o do repositório', sala.slug,
      '/data/worlds/' + sala.slug + '.json — ' + semCR(local).length + ' B no repositório, ' +
        semCR(remoto.corpo).length + ' B no ar');
  }
}

// Os fixtures e os ficheiros que não são salas também são servidos, e um deles em falta é a mesma
// avaria (o `arranques` lê-os). Mede-se a pasta toda, não só as 27 salas.
const ficheiros = readdirSync(join(ROOT, 'data', 'worlds')).filter((nome) => nome.endsWith('.json'));
const foraDasSalas = ficheiros.filter((nome) => !salas.some((sala) => sala.slug + '.json' === nome));
for (const nome of foraDasSalas) {
  const remoto = await pedir('/data/worlds/' + nome);
  const local = readFileSync(join(ROOT, 'data', 'worlds', nome), 'utf8');
  if (remoto.erro || remoto.estado !== 200) {
    add('dado não responde', nome.replace('.json', ''),
      '/data/worlds/' + nome + ' — ' + (remoto.erro || 'HTTP ' + remoto.estado));
  } else if (semCR(remoto.corpo) !== semCR(local)) {
    add('dado publicado não é o do repositório', nome.replace('.json', ''),
      '/data/worlds/' + nome + ' — ' + local.length + ' B no repositório, ' + remoto.corpo.length + ' B no ar');
  }
}

console.log('');
if (problemas.length === 0) {
  console.log('o site publicado está de acordo com o repositório: ' + salas.length + ' sala(s) e ' +
    ficheiros.length + ' ficheiro(s) de mundo');
  process.exit(0);
}

const porTipo = new Map();
for (const problema of problemas) porTipo.set(problema.tipo, (porTipo.get(problema.tipo) || 0) + 1);
console.log('=== PROBLEMAS: ' + problemas.length + ' ===');
for (const [tipo, numero] of [...porTipo].sort((a, b) => b[1] - a[1])) {
  console.log('  ' + String(numero).padStart(4) + '  ' + tipo);
}
console.log('');
for (const tipo of porTipo.keys()) {
  console.log('--- ' + tipo + ' ---');
  for (const problema of problemas.filter((cada) => cada.tipo === tipo)) {
    console.log('  ' + problema.onde);
    if (problema.detalhe) console.log('      ' + problema.detalhe);
  }
  console.log('');
}
console.log('publicar = avançar o `main` e `git push origin main`; o Pages reconstrói em minutos.');
process.exit(1);
