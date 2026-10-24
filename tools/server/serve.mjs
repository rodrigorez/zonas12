#!/usr/bin/env node
// O servidor da exposição, com uma porta de escrita para o editor (Fase 5, decisão D48).
//
// Porque existe: servir por HTTP já era obrigatório desde a Fase 3 (D1/D2) e a única coisa que
// faltava para o editor deixar de exportar à mão era alguém do outro lado que aceitasse o ficheiro.
// Este ficheiro é esse alguém — **uma ferramenta, não a publicação**: o GitHub Pages não corre Node,
// e por isso o editor continua a saber exportar (D49).
//
// O que ele promete, e é o que o `selftest.mjs` mede:
//   · serve a pasta do projeto como o `python -m http.server` que substitui — a raiz e cada sala
//     resolvem o seu `index.html`;
//   · escuta **só** em `127.0.0.1` (e recusa arrancar noutro endereço): um servidor que grava não
//     pode ficar à vista da rede;
//   · **não serve** o que não se publica — `.harness/` (fora do repositório), `.git/`, o que começa
//     por ponto e `node_modules/` — nem um caminho que saia da raiz;
//   · **diz o que é** em cada resposta, no cabeçalho `X-Zonas12-Serve` — é assim que o editor sabe
//     se pode oferecer o «Gravar» (D49). Perguntar por um endereço que só existe aqui daria um 404
//     na consola de uma página publicada, e uma consola limpa é uma regra do projeto (T8);
//   · `PUT /api/worlds/<slug>` grava o mundo — com o **mesmo** validador do `validate.mjs` e do
//     browser (D50), uma **cópia de segurança** antes (D51) e uma escrita atómica. Um mundo com
//     erros não é gravado; um mundo que não existe não é criado (quem cria mundos é a ferramenta da
//     D31); e um `slug` que não é o do ficheiro é recusado.
//
// Uso, da raiz do projeto: node tools/server/serve.mjs [--port 8123] [--host 127.0.0.1]
import { createServer } from 'node:http';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  statSync,
  writeFileSync
} from 'node:fs';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SCENE_VERSION } from '../../js/scene/schema.js';
import { validateScene } from '../../js/scene/validation.js';
import { diskQuestions } from '../scene/disk.mjs';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(here, '..', '..');

export const DEFAULT_PORT = 8123;
// Os únicos endereços em que este servidor se admite: é uma ferramenta com uma porta de escrita, e o
// que ele grava vai para o repositório.
export const LOOPBACK = ['127.0.0.1', 'localhost', '::1'];

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.glb': 'model/gltf-binary',
  '.ico': 'image/x-icon'
};

const typeOf = (file) => TYPES[extname(file).toLowerCase()] || 'application/octet-stream';

// Um caminho de URL em segmentos, ou `null` quando não se pode servir: um `..` (que sai da raiz) ou
// uma pasta que não se publica. A decisão é tomada **depois** de descodificar, porque `%2e%2e` é o
// mesmo `..` escrito de outra maneira.
function segmentsOf(urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0')) return null;
  const segments = decoded.split('/').filter((segment) => segment !== '' && segment !== '.');
  for (const segment of segments) {
    if (segment === '..') return null;
    if (segment.startsWith('.') || segment === 'node_modules') return null;
  }
  return segments;
}

const send = (response, status, body, headers) => {
  response.writeHead(status, Object.assign({
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  }, headers));
  response.end(body);
};

const sendJson = (response, status, value) =>
  send(response, status, JSON.stringify(value, null, 2) + '\n',
    { 'Content-Type': 'application/json; charset=utf-8' });

// Os mundos que existem no disco (D24: um ficheiro por mundo). É o que a lei L11 pergunta ao
// validar uma porta (o destino existe?) e é o que a rota de escrita confere antes de aceitar um slug.
export function worldsIn(root) {
  const directory = join(root, 'data', 'worlds');
  if (!existsSync(directory)) return [];
  return readdirSync(directory)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.slice(0, -'.json'.length))
    .sort();
}

// `Host` e `Origin` da mesma máquina: o primeiro fecha o *DNS rebinding* (um nome que resolve para
// 127.0.0.1 mas não é o nosso), o segundo fecha uma página de outro sítio a escrever por nós.
function sameOrigin(request, port) {
  const host = String(request.headers.host || '');
  const allowed = new Set(LOOPBACK.map((name) => (name.includes(':') ? `[${name}]` : name) + ':' + port));
  if (!allowed.has(host)) return false;
  const origin = request.headers.origin;
  if (origin && origin !== 'http://' + host) return false;
  return true;
}

async function serveFile(request, response, root, urlPath) {
  const segments = segmentsOf(urlPath);
  if (segments === null) {
    // A resposta é a mesma para um caminho que sai da raiz e para uma pasta que não se publica: não
    // se diz o que existe ali.
    send(response, 403, 'forbidden\n', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  let file = join(root, ...segments);
  // A raiz e cada sala são pastas com o seu `index.html` (D28): `/` e `/scene1/` são páginas.
  if (segments.length === 0 || urlPath.endsWith('/')) {
    file = join(file, 'index.html');
  } else if (existsSync(file) && statSync(file).isDirectory()) {
    // `/scene1` sem a barra: o `index.html` procura os seus ficheiros a partir de `/scene1/`, e o
    // `<base href="../">` resolveria a partir de `/`. Muda-se o endereço.
    response.writeHead(301, { Location: urlPath + '/' });
    response.end();
    return;
  }

  if (!existsSync(file) || !statSync(file).isFile()) {
    send(response, 404, 'not found\n', { 'Content-Type': 'text/plain; charset=utf-8' });
    return;
  }

  response.writeHead(200, {
    'Content-Type': typeOf(file),
    'Content-Length': statSync(file).size,
    // Nada de cache: o ponto de um servidor de desenvolvimento é ver a alteração ao recarregar.
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(file).pipe(response);
}

// ---- a escrita (D50 e D51) ---------------------------------------------------------------------
//
// O que chega é o texto que o editor exportaria: o mesmo que se commitava à mão. O servidor não o
// reformata — grava-o como veio, para o `git diff` mostrar só o que o autor mudou (M3).
const SLUG = /^[a-z0-9-]+$/;
const BODY_LIMIT = 1024 * 1024;

// O nome de uma cópia: a hora local até ao milissegundo, sem caracteres que o Windows recuse.
const stamp = (now = new Date()) => {
  const pad = (value, width = 2) => String(value).padStart(width, '0');
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}-` +
    `${pad(now.getMilliseconds(), 3)}`;
};

const fail = (status, error) => Object.assign(new Error(error), { status });

function readBody(request) {
  return new Promise((ready, refuse) => {
    const chunks = [];
    let size = 0;
    let stopped = false;
    request.on('data', (chunk) => {
      if (stopped) return;
      size += chunk.length;
      if (size > BODY_LIMIT) {
        stopped = true;
        refuse(fail(413, `the request body is larger than ${BODY_LIMIT} bytes`));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (!stopped) ready(Buffer.concat(chunks).toString('utf8'));
    });
    request.on('error', (error) => {
      if (stopped) return;
      stopped = true;
      refuse(error);
    });
  });
}

async function saveWorld(request, response, context, slug) {
  const { root, backups, port } = context;

  if (!sameOrigin(request, port)) {
    sendJson(response, 403, { error: 'not the same origin as the server' });
    return;
  }
  if (!/^application\/json\b/i.test(String(request.headers['content-type'] || ''))) {
    sendJson(response, 415, { error: 'the body has to be JSON (Content-Type: application/json)' });
    return;
  }

  const file = join(root, 'data', 'worlds', slug + '.json');
  if (!existsSync(file)) {
    // Gravar é **substituir** o que está no disco. Criar um mundo é da ferramenta da D31: aqui
    // seria criar um ficheiro que nenhuma pasta e nenhuma porta conhecem.
    sendJson(response, 404, { error: `${slug} is not a world on disk` });
    return;
  }

  const body = await readBody(request);

  let data;
  try {
    data = JSON.parse(body);
  } catch (error) {
    sendJson(response, 400, { error: 'not JSON: ' + error.message });
    return;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    sendJson(response, 400, { error: 'the file does not hold a world object' });
    return;
  }

  // O slug do URL tem de ser o do ficheiro (D28): é isto que impede gravar o mundo A por cima do B.
  const declared = data.world && data.world.slug;
  if (declared !== slug) {
    sendJson(response, 400, {
      error: `the file says it is ${JSON.stringify(declared)} and the address says ${JSON.stringify(slug)}`
    });
    return;
  }
  if (data.version !== SCENE_VERSION) {
    sendJson(response, 400, {
      error: `version ${JSON.stringify(data.version)} is not ${SCENE_VERSION} (D23)`
    });
    return;
  }

  // O mesmo validador do `validate.mjs` e do browser, com as mesmas perguntas ao disco (D50): a
  // regra do export (erros travam, avisos não) passa a ser a regra da gravação.
  const worlds = worldsIn(root);
  const report = validateScene(data, Object.assign(diskQuestions(root), {
    worldExists: (name) => worlds.includes(name)
  }));
  if (report.errors.length > 0) {
    sendJson(response, 422, {
      error: `the world has ${report.errors.length} error(s) and is not written`,
      errors: report.errors,
      warnings: report.warnings
    });
    return;
  }

  // A cópia de segurança **antes** de tocar no ficheiro (D51): o que se perde é o anterior.
  const backup = join(backups, slug, stamp() + '.json');
  mkdirSync(dirname(backup), { recursive: true });
  writeFileSync(backup, readFileSync(file));

  // A escrita atómica: a meio de um mundo truncado é pior do que não gravar.
  const temporary = file + '.tmp';
  writeFileSync(temporary, body);
  renameSync(temporary, file);

  sendJson(response, 200, {
    file: 'data/worlds/' + slug + '.json',
    bytes: Buffer.byteLength(body),
    backup: relative(root, backup).split(sep).join('/'),
    warnings: report.warnings
  });
}

// O cabeçalho que responde «sou a ferramenta, posso gravar» (D49). Vai em **todas** as respostas,
// incluindo os erros: quem pergunta é `HEAD` na raiz da publicação, e o que se lê é o cabeçalho —
// assim uma página publicada não apanha um 404 por perguntar (T8).
export const MARK = 'X-Zonas12-Serve';

// Devolve `true` quando a rota era da API e a resposta já foi dada.
async function handleApi(request, response, context) {
  const { root, urlPath, method } = context;

  const addressed = /^\/api\/worlds\/([^/]+)$/.exec(urlPath);
  if (addressed) {
    let slug = null;
    try {
      slug = decodeURIComponent(addressed[1]);
    } catch {
      slug = null;
    }
    if (slug === null || !SLUG.test(slug)) {
      sendJson(response, 400, {
        error: 'a world is a slug: lower-case letters, digits and hyphens (D28)'
      });
      return true;
    }
    if (method !== 'PUT') {
      send(response, 405, 'method not allowed\n',
        { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'PUT' });
      return true;
    }
    await saveWorld(request, response, context, slug);
    return true;
  }

  if (urlPath.startsWith('/api/')) {
    sendJson(response, 404, { error: 'no such route' });
    return true;
  }

  return false;
}

async function handle(request, response, state) {
  const urlPath = String(request.url || '/').split('?')[0].split('#')[0];
  const method = request.method || 'GET';
  // A marca da ferramenta (D49): uma linha, e vale para tudo o que sai daqui — páginas, ficheiros,
  // erros e a mudança de endereço.
  response.setHeader(MARK, '1');

  const context = { root: state.root, backups: state.backups, port: state.port, urlPath, method };

  if (await handleApi(request, response, context)) return;

  if (method !== 'GET' && method !== 'HEAD') {
    send(response, 405, 'method not allowed\n',
      { 'Content-Type': 'text/plain; charset=utf-8', Allow: 'GET, HEAD' });
    return;
  }

  await serveFile(request, response, state.root, urlPath);
}

// Arranca o servidor e devolve o que é preciso para o parar e para o medir. A porta `0` deixa o
// sistema escolher uma livre — é assim que o `selftest` corre sem disputar a 8123 com quem está a
// trabalhar.
export function startServer(options = {}) {
  const root = resolve(options.root || ROOT);
  const host = options.host || '127.0.0.1';
  if (!LOOPBACK.includes(host)) {
    return Promise.reject(new Error(`refusing to listen on ${host}: this server writes to the ` +
      `repository, so it only listens on ${LOOPBACK.join(', ')} (D48)`));
  }

  const state = {
    root,
    // Fora do repositório e da publicação (D51): o `.harness/` está no `.gitignore` e não é servido.
    backups: resolve(options.backups || join(root, '.harness', 'backups', 'worlds')),
    port: options.port === undefined ? DEFAULT_PORT : options.port
  };
  const server = createServer((request, response) => {
    handle(request, response, state).catch((error) => {
      const status = error.status || 500;
      if (!response.headersSent) sendJson(response, status, { error: error.message });
      else response.destroy();
    });
  });

  return new Promise((ready, fail) => {
    server.once('error', fail);
    server.listen(state.port, host, () => {
      state.port = server.address().port;
      ready({
        url: `http://${host}:${state.port}`,
        host,
        port: state.port,
        root,
        backups: state.backups,
        close: () => new Promise((done) => server.close(done))
      });
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const option = (name, fallback) => {
    const at = args.indexOf('--' + name);
    return at === -1 ? fallback : args[at + 1];
  };

  const server = await startServer({
    port: Number(option('port', DEFAULT_PORT)),
    host: option('host', '127.0.0.1'),
    root: option('root', ROOT)
  });
  console.log(`zonas12: serving ${server.root}`);
  console.log(`         ${server.url}/                          (a exposição, o portão)`);
  console.log(`         ${server.url}/editor.html?world=gate    (o editor)`);
  console.log(`         ${server.url}/api/worlds/<slug>         (PUT: é aqui que o editor grava)`);
  console.log(`         gravações: ${server.backups}`);
  console.log('         Ctrl+C para parar.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error('serve.mjs: ' + error.message);
    process.exit(1);
  });
}
