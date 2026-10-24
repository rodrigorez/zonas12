// The harness of the Fase 4 batteries: a static server for the project, a Chrome without a head that
// has a camera, and the CDP calls they all need.
//
// Why it lives here and not in each battery: the six batteries of the phase (D37, D39, D40, D41, D42
// and D45) began as copies of one another, and six copies of an HTTP server and a CDP client are six
// things that drift. What changes between them is the probe and the checks; what does not change is
// this file.
//
// It is a **Node** script (like tools/scene/validate.mjs), not a browser module like acceptance.mjs:
// these batteries measure what a person sees — pixels, the console, the timeline of a page load — and
// that is seen from outside the page, by taking photographs of it.
//
// Nothing here reads the scene's data or its rules: the batteries ask the page what it is doing
// (`window.portalDebug`) and look at the screen.
import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, extname, dirname, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const CHROME_CANDIDATES = [
  process.env.CHROME,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium'
];

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4', '.glb': 'model/gltf-binary', '.ico': 'image/x-icon'
};

export const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

function chromePath() {
  const found = CHROME_CANDIDATES.find((path) => path && existsSync(path));
  if (!found) throw new Error('Chrome not found: set CHROME to its path');
  return found;
}

// The project as a site. `Range` matters even here: without it Chrome will not seek inside an mp4,
// and the artwork that is a video never gets past its first frame.
export function serveProject() {
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    let path = join(ROOT, decodeURIComponent(url.pathname));
    if (existsSync(path) && statSync(path).isDirectory()) path = join(path, 'index.html');
    if (!existsSync(path) || !statSync(path).isFile()) {
      response.writeHead(404, { 'content-type': 'text/plain' });
      response.end('not found');
      return;
    }
    const total = statSync(path).size;
    const type = TYPES[extname(path).toLowerCase()] || 'application/octet-stream';
    const range = request.headers.range;
    if (range) {
      const found = /bytes=(\d*)-(\d*)/.exec(range);
      const start = found && found[1] ? Number(found[1]) : 0;
      const end = found && found[2] ? Number(found[2]) : total - 1;
      const body = readFileSync(path).subarray(start, end + 1);
      response.writeHead(206, {
        'content-type': type, 'content-length': body.length,
        'content-range': 'bytes ' + start + '-' + end + '/' + total,
        'accept-ranges': 'bytes', 'cache-control': 'no-store'
      });
      response.end(body);
      return;
    }
    const body = readFileSync(path);
    response.writeHead(200, {
      'content-type': type, 'content-length': body.length,
      'accept-ranges': 'bytes', 'cache-control': 'no-store'
    });
    response.end(body);
  });
  return new Promise((done) => {
    server.listen(0, '127.0.0.1', () => {
      done({
        base: 'http://127.0.0.1:' + server.address().port,
        close: () => new Promise((closed) => server.close(closed))
      });
    });
  });
}

// The mean brightness and a 4x4 signature of a PNG screenshot, so that "the screen went black" and
// "the screen changed" are numbers and not opinions. Written out instead of pulling a package: a PNG
// is the zlib of Node plus the filters per line.
export function pngBrightness(buffer) {
  let pos = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat = [];
  while (pos < buffer.length) {
    const length = buffer.readUInt32BE(pos);
    const type = buffer.toString('ascii', pos + 4, pos + 8);
    const data = buffer.subarray(pos + 8, pos + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
    pos += 12 + length;
  }
  if (bitDepth !== 8) throw new Error('PNG with bit depth ' + bitDepth);
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error('PNG with colour type ' + colorType);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);
  let read = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[read++];
    const line = raw.subarray(read, read + stride);
    read += stride;
    const base = y * stride;
    const previous = y > 0 ? base - stride : -1;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? pixels[base + x - channels] : 0;
      const b = previous >= 0 ? pixels[previous + x] : 0;
      const c = previous >= 0 && x >= channels ? pixels[previous + x - channels] : 0;
      let value = line[x];
      if (filter === 1) value += a;
      else if (filter === 2) value += b;
      else if (filter === 3) value += (a + b) >> 1;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        value += pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
      } else if (filter !== 0) throw new Error('PNG filter ' + filter);
      pixels[base + x] = value & 0xff;
    }
  }
  let sum = 0;
  let count = 0;
  let lit = 0;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const at = y * stride + x * channels;
      const luma = 0.299 * pixels[at] + 0.587 * pixels[at + 1] + 0.114 * pixels[at + 2];
      sum += luma;
      count++;
      if (luma > 24) lit++;
    }
  }
  const blocks = [];
  for (let by = 0; by < 4; by++) {
    for (let bx = 0; bx < 4; bx++) {
      let blockSum = 0;
      let blockCount = 0;
      const x0 = Math.floor(bx * width / 4);
      const x1 = Math.floor((bx + 1) * width / 4);
      const y0 = Math.floor(by * height / 4);
      const y1 = Math.floor((by + 1) * height / 4);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const at = y * stride + x * channels;
          blockSum += 0.299 * pixels[at] + 0.587 * pixels[at + 1] + 0.114 * pixels[at + 2];
          blockCount++;
        }
      }
      blocks.push(blockCount ? blockSum / blockCount : 0);
    }
  }
  return { width, height, mean: sum / count, litFraction: lit / count, blocks };
}

// How much two signatures differ, from 0 (the same picture) to 255.
export function difference(one, other) {
  if (!one || !other || !one.blocks || !other.blocks) return null;
  let total = 0;
  for (let i = 0; i < one.blocks.length; i++) total += Math.abs(one.blocks[i] - other.blocks[i]);
  return total / one.blocks.length;
}

// Opens a Chrome, connects to its page and hands back the few things a battery needs. Everything is
// `options` because each battery wants a different Chrome: one with a camera, one without, one on a
// phone screen, one with the network throttled.
export async function openBrowser(options) {
  const settings = options || {};
  const profile = join(tmpdir(), 'zonas-' + randomUUID());
  const flags = [
    '--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile,
    '--no-first-run', '--no-default-browser-check', '--disable-extensions',
    '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required',
    '--window-size=' + (settings.width || 800) + ',' + (settings.height || 600)
  ];
  if (settings.camera !== false) {
    flags.push('--use-fake-device-for-media-stream');
    if (settings.acceptCamera !== false) flags.push('--use-fake-ui-for-media-stream');
  }
  flags.push('about:blank');
  const child = spawn(chromePath(), flags, { stdio: ['ignore', 'ignore', 'ignore'] });

  const readPort = async () => {
    const file = join(profile, 'DevToolsActivePort');
    for (let i = 0; i < 200; i++) {
      if (existsSync(file)) {
        const first = readFileSync(file, 'utf8').split('\n')[0].trim();
        if (first) return first;
      }
      await sleep(100);
    }
    throw new Error('Chrome did not open a debugging port');
  };
  const port = await readPort();

  const target = async () => {
    for (let i = 0; i < 150; i++) {
      const list = await (await fetch('http://127.0.0.1:' + port + '/json/list')).json();
      const page = list.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl);
      if (page) return page;
      await sleep(100);
    }
    throw new Error('Chrome has no page');
  };

  const connect = async (url) => {
    const socket = new WebSocket(url);
    await new Promise((done, fail) => {
      socket.addEventListener('open', () => done(), { once: true });
      socket.addEventListener('error', (event) => fail(new Error('websocket: ' + event.type)), { once: true });
    });
    let id = 0;
    const pending = new Map();
    const listeners = [];
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      if (message.id && pending.has(message.id)) {
        const entry = pending.get(message.id);
        pending.delete(message.id);
        if (message.error) entry.fail(new Error(message.error.message)); else entry.done(message.result);
        return;
      }
      listeners.forEach((listener) => listener(message));
    });
    // Every call has a limit: a screenshot asked for in the middle of a navigation may never answer,
    // and without a limit the battery stops instead of measuring.
    const send = (method, params, limit) => {
      const callId = ++id;
      socket.send(JSON.stringify({ id: callId, method, params: params || {} }));
      const answer = new Promise((done, fail) => pending.set(callId, { done, fail }));
      if (!limit) return answer;
      return Promise.race([
        answer,
        new Promise((done, fail) => setTimeout(() => {
          pending.delete(callId);
          fail(new Error('no answer to ' + method));
        }, limit))
      ]);
    };
    return {
      send,
      on: (listener) => listeners.push(listener),
      close: () => { try { socket.close(); } catch (error) { /* already closed */ } }
    };
  };

  const pageTarget = await target();
  const page = await connect(pageTarget.webSocketDebuggerUrl);
  const version = await (await fetch('http://127.0.0.1:' + port + '/json/version')).json();
  const browser = await connect(version.webSocketDebuggerUrl);

  const evaluate = async (expression, limit) => {
    const result = await page.send('Runtime.evaluate',
      { expression, awaitPromise: true, returnByValue: true }, limit || 30000);
    if (result.exceptionDetails) {
      const details = result.exceptionDetails;
      throw new Error(details.exception ? details.exception.description || details.text : details.text);
    }
    return result.result.value;
  };

  await page.send('Page.enable');
  await page.send('Runtime.enable');
  await page.send('Network.enable');
  // A battery that reads a cached page measures the last build, not this one.
  await page.send('Network.setCacheDisabled', { cacheDisabled: true });
  // Sem barras de deslocamento a pintar por cima do ecrã: uma página que transborda 4 px mostra uma
  // barra cinzenta na borda direita durante meio segundo, e uma assinatura de luminosidade apanha-a
  // como se fosse imagem — o painel não tem barras de deslocamento, e a medição também não.
  await page.send('Emulation.setScrollbarsHidden', { hidden: true });
  // What the page says it is doing wrong. A scene that is fine says nothing (T8), so anything here is
  // a finding — the batteries decide which lines are noise of the browser itself.
  const noise = [];
  page.on((message) => {
    if (message.method === 'Runtime.consoleAPICalled' &&
      (message.params.type === 'error' || message.params.type === 'warning')) {
      noise.push(message.params.type + ': ' + (message.params.args || [])
        .map((arg) => (arg.value === undefined ? arg.description : arg.value)).join(' ').slice(0, 160));
    }
    if (message.method === 'Runtime.exceptionThrown') {
      const details = message.params.exceptionDetails || {};
      noise.push('exception: ' + ((details.exception || {}).description || details.text || ''));
    }
  });
  if (settings.width) {
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: settings.width, height: settings.height,
      deviceScaleFactor: settings.dpr || 1, mobile: Boolean(settings.mobile)
    });
  }
  if (settings.throttle) {
    await page.send('Network.emulateNetworkConditions', {
      offline: false, latency: 100,
      downloadThroughput: 800 * 1024, uploadThroughput: 400 * 1024
    });
  }
  if (settings.probe) await page.send('Page.addScriptToEvaluateOnNewDocument', { source: settings.probe });

  return {
    page,
    evaluate,
    console: noise,
    async grantCamera(origin) {
      await browser.send('Browser.grantPermissions', { origin, permissions: ['videoCapture'] });
    },
    async goto(url, limit) {
      await page.send('Page.navigate', { url });
      const until = Date.now() + (limit || 60000);
      while (Date.now() < until) {
        try {
          if (await evaluate('Boolean(window.portalDebug && window.portalDebug.world)')) return true;
        } catch (error) { /* still navigating */ }
        await sleep(200);
      }
      return false;
    },
    async screenshot(scale) {
      const shot = await page.send('Page.captureScreenshot', {
        format: 'png', captureBeyondViewport: false,
        clip: scale ? {
          x: 0, y: 0, width: settings.width, height: settings.height, scale
        } : undefined
      }, 2500);
      const bytes = Buffer.from(shot.data, 'base64');
      return { bytes, ...pngBrightness(bytes) };
    },
    async close() {
      page.close();
      browser.close();
      child.kill();
      await sleep(300);
    }
  };
}

// The one shape of a battery's result, so that six files do not print six different things.
export function checks() {
  const list = [];
  return {
    list,
    check(name, ok, detail) {
      list.push({ name, ok: Boolean(ok) });
      console.log((ok ? 'ok   ' : 'FAIL ') + name + (detail === undefined ? '' : ' — ' + detail));
      return Boolean(ok);
    },
    report(label) {
      const failed = list.filter((item) => !item.ok);
      console.log('');
      console.log(label + ': ' + (list.length - failed.length) + ' of ' + list.length + ' checks pass');
      if (failed.length) {
        console.log('  failed: ' + failed.map((item) => item.name).join(' | '));
        process.exitCode = 1;
      }
      return failed.length === 0;
    }
  };
}
