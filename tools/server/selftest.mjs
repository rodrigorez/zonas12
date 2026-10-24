#!/usr/bin/env node
// O instrumento do servidor da Fase 5 (`tools/server/serve.mjs`, decisão D48).
//
// Porque existe: um servidor que serve a publicação e **grava no repositório** tem de provar o que
// recusa, não só o que faz. Cada verificação abaixo é uma promessa da D48 (não servir o que não se
// publica, não sair da raiz, só responder à mesma origem) ou da D50 (não escrever quando o mundo
// tem erros, não criar mundos, não trocar o slug).
//
// Corre contra uma **raiz temporária**: o servidor arranca com `root` a apontar para uma pasta
// criada aqui dentro, com um mundo mínimo e duas pastas que não se publicam. Nada disto toca no
// repositório — o que também quer dizer que a prova de que ele grava é feita sobre ficheiros que o
// instrumento pode apagar no fim.
//
// Uso, da raiz do projeto: node tools/server/selftest.mjs
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { request } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startServer } from './serve.mjs';
import { checks } from '../regression/harness.mjs';

const SEGREDO = 'não se publica\n';

// Um mundo mínimo e **válido**: uma dimensão de câmara não pede asset nenhum, e sem portas nem obras
// não há lei que se lhe aplique. É o mundo sobre o que as gravações são medidas.
const MUNDO = {
  version: 3,
  world: { slug: 'teste', name: { pt: 'Teste', en: 'Test' } },
  cameras: { player: { position: [0, 1.6, 0], speed: 0.1 }, real: { enabled: false } },
  assets: {},
  dimensions: [{ id: 0, kind: 'camera', name: { pt: 'Realidade', en: 'Reality' } }],
  artworks: [],
  portals: []
};

const text = (value) => JSON.stringify(value, null, 2) + '\n';

// O mesmo mundo com **um** erro: a dimensão nomeia um asset que não está no disco (lei L9). É a
// forma mais curta de pedir ao servidor um mundo que ele tem de recusar — e recusa com o mesmo
// validador que a linha de comando usa.
const MUNDO_COM_ERRO = Object.assign({}, MUNDO, {
  assets: { fundo: { path: 'assets/panoramas/nao-existe.jpg', type: 'image', alt: { pt: 'x', en: 'x' } } },
  dimensions: [{ id: 0, kind: 'image', asset: 'fundo', radius: 50, name: { pt: 'Sala', en: 'Room' } }]
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'zonas12-serve-'));
  mkdirSync(join(root, 'scene1'), { recursive: true });
  mkdirSync(join(root, 'data', 'worlds'), { recursive: true });
  mkdirSync(join(root, '.harness'), { recursive: true });
  mkdirSync(join(root, '.git'), { recursive: true });
  mkdirSync(join(root, 'node_modules'), { recursive: true });
  writeFileSync(join(root, 'index.html'), '<!doctype html><title>raiz</title>\n');
  writeFileSync(join(root, 'scene1', 'index.html'), '<!doctype html><title>sala</title>\n');
  writeFileSync(join(root, 'data', 'worlds', 'teste.json'), text(MUNDO));
  writeFileSync(join(root, '.harness', 'segredo.txt'), SEGREDO);
  writeFileSync(join(root, '.git', 'config'), '[core]\n');
  writeFileSync(join(root, 'node_modules', 'pacote.js'), 'module.exports = 1;\n');
  return root;
}

// Um pedido com o caminho **cru**: `fetch` normaliza `..` antes de o enviar, e o que se quer medir é
// o que o servidor faz com o pedido tal como chega.
function ask(port, path, options = {}) {
  return new Promise((ready, fail) => {
    const req = request({
      host: '127.0.0.1',
      port,
      path,
      method: options.method || 'GET',
      headers: options.headers || {}
    }, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => { body += chunk; });
      response.on('end', () => ready({ status: response.statusCode, headers: response.headers, body }));
    });
    req.on('error', fail);
    if (options.body !== undefined) req.write(options.body);
    req.end();
  });
}

async function main() {
  const root = fixture();
  const result = checks();
  let server = null;

  try {
    server = await startServer({ root, port: 0 });
    const port = server.port;

    // ---- o que se serve ----
    const raiz = await ask(port, '/');
    result.check('/ serve a raiz da publicação', raiz.status === 200 && raiz.body.includes('raiz'),
      'HTTP ' + raiz.status);
    const sala = await ask(port, '/scene1/');
    result.check('/scene1/ resolve o index.html da sala',
      sala.status === 200 && sala.body.includes('sala'), 'HTTP ' + sala.status);
    const semBarra = await ask(port, '/scene1');
    result.check('/scene1 sem a barra mudou de endereço para /scene1/',
      semBarra.status === 301 && semBarra.headers.location === '/scene1/',
      'HTTP ' + semBarra.status + ' → ' + semBarra.headers.location);
    const mundo = await ask(port, '/data/worlds/teste.json');
    result.check('o ficheiro de um mundo é servido como JSON',
      mundo.status === 200 && /application\/json/.test(mundo.headers['content-type'] || ''),
      'HTTP ' + mundo.status + ', ' + mundo.headers['content-type']);
    result.check('nada é guardado em cache (o servidor é para ver a alteração)',
      raiz.headers['cache-control'] === 'no-store' && mundo.headers['cache-control'] === 'no-store',
      'Cache-Control: ' + raiz.headers['cache-control']);
    const faltando = await ask(port, '/nao-existe.html');
    result.check('um ficheiro que não existe é 404', faltando.status === 404, 'HTTP ' + faltando.status);

    // ---- o que não se serve (D48) ----
    const harness = await ask(port, '/.harness/segredo.txt');
    result.check('o .harness/ não é servido', harness.status === 403 && !harness.body.includes('publica'),
      'HTTP ' + harness.status);
    const git = await ask(port, '/.git/config');
    result.check('o .git/ não é servido', git.status === 403, 'HTTP ' + git.status);
    const modulos = await ask(port, '/node_modules/pacote.js');
    result.check('o node_modules/ não é servido', modulos.status === 403, 'HTTP ' + modulos.status);
    const codificado = await ask(port, '/%2e%2e/index.html');
    result.check('um .. descodificado não sai da raiz', codificado.status === 403,
      'HTTP ' + codificado.status);
    const cru = await ask(port, '/../index.html');
    result.check('um .. literal não sai da raiz', cru.status === 403, 'HTTP ' + cru.status);

    // ---- a marca da ferramenta (D49) ----
    result.check('a resposta diz que é a ferramenta (o cabeçalho que o editor lê)',
      raiz.headers['x-zonas12-serve'] === '1', 'X-Zonas12-Serve: ' + raiz.headers['x-zonas12-serve']);
    const cabecalho = await ask(port, '/', { method: 'HEAD' });
    result.check('a pergunta do editor (HEAD na raiz) responde 200 com a marca',
      cabecalho.status === 200 && cabecalho.headers['x-zonas12-serve'] === '1',
      'HTTP ' + cabecalho.status + ', ' + (cabecalho.body === '' ? 'sem corpo' : 'com corpo'));
    result.check('um ficheiro que não existe também leva a marca (a pergunta nunca dá 404)',
      faltando.headers['x-zonas12-serve'] === '1', 'HTTP ' + faltando.status + ' com a marca');

    // ---- o que a mesma origem impede ----
    const outroHost = await ask(port, '/api/worlds/teste', { method: 'PUT', headers: { Host: 'evil.example' } });
    result.check('um Host que não é da máquina é recusado',
      outroHost.status === 403, 'HTTP ' + outroHost.status);
    const outraOrigem = await ask(port, '/api/worlds/teste', {
      method: 'PUT', headers: { Origin: 'http://evil.example' }, body: text(MUNDO)
    });
    result.check('um Origin de outro sítio é recusado',
      outraOrigem.status === 403, 'HTTP ' + outraOrigem.status);

    // ---- o que não é um pedido ----
    const paginaPost = await ask(port, '/', { method: 'POST' });
    result.check('POST num ficheiro é 405', paginaPost.status === 405, 'HTTP ' + paginaPost.status);
    const rota = await ask(port, '/api/outra');
    result.check('uma rota de API que não existe é 404 em JSON',
      rota.status === 404 && /json/.test(rota.headers['content-type'] || ''), 'HTTP ' + rota.status);

    // ---- a escrita: o que ela recusa (D50) ----
    const arquivo = join(root, 'data', 'worlds', 'teste.json');
    const antes = readFileSync(arquivo, 'utf8');
    const put = (slug, body, headers) => ask(port, '/api/worlds/' + slug, {
      method: 'PUT',
      headers: Object.assign({ 'Content-Type': 'application/json' }, headers || {}),
      body
    });

    const naoJson = await put('teste', '{ isto não é json');
    result.check('um corpo que não é JSON é 400', naoJson.status === 400, 'HTTP ' + naoJson.status);
    const versao = await put('teste', text(Object.assign({}, MUNDO, { version: 2 })));
    result.check('uma versão que não é a do esquema é 400', versao.status === 400, 'HTTP ' + versao.status);
    const trocado = await put('teste', text(Object.assign({}, MUNDO, {
      world: Object.assign({}, MUNDO.world, { slug: 'outro' })
    })));
    result.check('um slug que não é o do ficheiro é 400', trocado.status === 400, 'HTTP ' + trocado.status);
    const comErro = await put('teste', text(MUNDO_COM_ERRO));
    result.check('um mundo com erros é 422 (a mesma regra do exportar)', comErro.status === 422,
      'HTTP ' + comErro.status);
    const novo = await put('novo-mundo', text(Object.assign({}, MUNDO, {
      world: Object.assign({}, MUNDO.world, { slug: 'novo-mundo' })
    })));
    result.check('um mundo que não existe não é criado (404, D31)',
      novo.status === 404 && !existsSync(join(root, 'data', 'worlds', 'novo-mundo.json')),
      'HTTP ' + novo.status);
    const comPontos = await put('..%2fteste', text(MUNDO));
    result.check('um slug com .. não escreve nada (M2)', comPontos.status === 400,
      'HTTP ' + comPontos.status);
    const deFora = await put('teste', text(MUNDO), { Origin: 'http://evil.example' });
    result.check('gravar a partir de outro sítio é 403', deFora.status === 403, 'HTTP ' + deFora.status);
    const semTipo = await ask(port, '/api/worlds/teste', { method: 'PUT', body: text(MUNDO) });
    result.check('gravar sem Content-Type JSON é 415', semTipo.status === 415, 'HTTP ' + semTipo.status);
    const leitura = await ask(port, '/api/worlds/teste');
    result.check('ler pela rota de escrita é 405 e diz que o método é PUT',
      leitura.status === 405 && /PUT/.test(String(leitura.headers.allow || '')),
      'HTTP ' + leitura.status + ', Allow: ' + leitura.headers.allow);

    result.check('nenhuma recusa tocou no ficheiro',
      readFileSync(arquivo, 'utf8') === antes, 'o ficheiro está como estava');
    result.check('nenhuma recusa deixou cópia de segurança',
      !existsSync(join(root, '.harness', 'backups', 'worlds', 'teste')), 'sem pasta de cópias');

    // ---- a escrita: o que ela faz (D51, M3 e M5) ----
    const mudado = Object.assign({}, MUNDO, {
      cameras: Object.assign({}, MUNDO.cameras, {
        player: Object.assign({}, MUNDO.cameras.player, { position: [0, 1.7, 0] })
      })
    });
    const enviado = text(mudado);
    const bom = await put('teste', enviado);
    let gravado = null;
    try { gravado = JSON.parse(bom.body); } catch { gravado = null; }
    result.check('gravar responde com o ficheiro, os bytes e a cópia',
      bom.status === 200 && gravado !== null && gravado.file === 'data/worlds/teste.json' &&
      gravado.bytes === Buffer.byteLength(enviado) &&
      /^\.harness\/backups\/worlds\/teste\/.+\.json$/.test(gravado.backup || ''),
      'HTTP ' + bom.status + ', ' + (gravado ? gravado.file + ' ← ' + gravado.backup : '?'));
    result.check('o ficheiro gravado é byte-idêntico ao que foi enviado (M3)',
      readFileSync(arquivo, 'utf8') === enviado, Buffer.byteLength(enviado) + ' bytes');
    result.check('a cópia de segurança tem o conteúdo anterior (M5)',
      gravado !== null && readFileSync(join(root, ...String(gravado.backup).split('/')), 'utf8') === antes,
      'a cópia é o ficheiro de antes');

    const outra = text(Object.assign({}, mudado, {
      cameras: Object.assign({}, mudado.cameras, {
        player: Object.assign({}, mudado.cameras.player, { position: [0, 1.8, 0] })
      })
    }));
    const segunda = await put('teste', outra);
    const copias = existsSync(join(root, '.harness', 'backups', 'worlds', 'teste'))
      ? readdirSync(join(root, '.harness', 'backups', 'worlds', 'teste'))
      : [];
    result.check('a segunda gravação deixa uma segunda cópia',
      segunda.status === 200 && copias.length === 2, copias.length + ' cópia(s)');

    // ---- onde ele se recusa a arrancar (D48) ----
    let recusou = false;
    try {
      await startServer({ root, port: 0, host: '0.0.0.0' });
    } catch (error) {
      recusou = /only listens on/.test(error.message);
    }
    result.check('recusa arrancar fora do loopback', recusou, recusou ? 'recusou 0.0.0.0' : 'aceitou');
  } finally {
    if (server) await server.close();
    rmSync(root, { recursive: true, force: true });
  }

  result.report('o servidor (Fase 5)');
}

main().catch((error) => {
  console.error('selftest failed:', error.message);
  process.exit(1);
});
