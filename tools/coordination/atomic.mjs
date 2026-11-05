// A escrita atómica num sítio só (D96, M0).
//
// Porque existe: hoje dezoito ficheiros de `tools/` escrevem com `writeFileSync`, que trunca o destino
// antes de escrever o conteúdo novo. Um processo morto a meio — um agente cancelado, um `Ctrl+C`, uma
// máquina que reinicia — deixa o `data/worlds/<slug>.json` cortado ao meio, e um JSON truncado não abre
// a exposição. O `serve.mjs` já fazia isto desde a D51 (`*.tmp` + `rename`); o problema era ser o único.
//
// O que faz: escreve num ficheiro temporário **ao lado** do destino, força-o para o disco (`fsync`) e só
// então troca os dois com um `rename` — que é atómico. Quem lê o ficheiro vê o antigo ou o novo, nunca
// uma mistura.
//
// O `pid` e um sufixo aleatório no nome do temporário não são decoração: dois processos a escrever o
// mesmo ficheiro ao mesmo tempo (o caso que a D96 estuda) deixam de partilhar o temporário.
//
// O fim de linha não é decidido aqui: quem chama passa o texto já com o EOL do ficheiro (cinco dos
// ficheiros de mundo são CRLF, e reescrevê-los a LF mudava o ficheiro inteiro num diff). Há dois ajudantes
// para isso, porque essa conta estava copiada em quatro ferramentas.
import { closeSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeSync } from 'node:fs';
import { dirname } from 'node:path';

// O `rename` no Windows pode falhar por instantes com o ficheiro aberto por outro processo — o
// antivírus, o indexador da pesquisa, um editor a olhar. Três tentativas cobrem o caso medido.
const ATTEMPTS = 3;
const WAIT_MS = 50;
const TRANSIENT = ['EPERM', 'EBUSY', 'EACCES'];

function sleep(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

function renameWithRetry(from, to) {
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      renameSync(from, to);
      return;
    } catch (error) {
      if (!TRANSIENT.includes(error.code) || attempt === ATTEMPTS) throw error;
      sleep(WAIT_MS);
    }
  }
}

// Escreve `data` (texto ou Buffer) em `file`, de forma atómica. Devolve os bytes escritos.
export function writeAtomic(file, data, options = {}) {
  const encoding = options.encoding || 'utf8';
  const buffer = Buffer.isBuffer(data) ? data : Buffer.from(String(data), encoding);
  mkdirSync(dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}-${Math.random().toString(36).slice(2, 8)}.tmp`;

  let handle;
  try {
    handle = openSync(temporary, 'wx');
    writeSync(handle, buffer);
    // Sem isto o `rename` pode chegar ao disco antes do conteúdo, e o ficheiro novo nasce vazio.
    fsyncSync(handle);
  } catch (error) {
    if (handle !== undefined) closeSync(handle);
    rmSync(temporary, { force: true });
    throw error;
  }
  closeSync(handle);

  try {
    renameWithRetry(temporary, file);
  } catch (error) {
    rmSync(temporary, { force: true });
    throw error;
  }
  return buffer.length;
}

// O `\r\n` ou `\n` que o ficheiro já usa. Para quem tem de preservá-lo — e não adivinhá-lo.
export function fileEol(text) {
  return text.includes('\r\n') ? '\r\n' : '\n';
}

// O mesmo, lido do destino: `\n` quando o ficheiro ainda não existe (é o que o editor exporta).
export function eolOf(file) {
  try {
    return fileEol(readFileSync(file, 'utf8'));
  } catch {
    return '\n';
  }
}

// Um JSON com a indentação e o EOL que o projeto usa (2 espaços, e o do ficheiro).
export function formatJson(value, eol) {
  const newline = eol || '\n';
  return JSON.stringify(value, null, 2).replace(/\n/g, newline) + newline;
}

// O atalho que substitui `writeFileSync(file, JSON.stringify(scene, null, 2) + '\n', 'utf8')`.
export function writeJson(file, value, options = {}) {
  return writeAtomic(file, formatJson(value, options.eol), { encoding: 'utf8' });
}

// A cópia de segurança antes de tocar no original (D51). Quem chama decide **quando** — ela é a rede, não
// o mecanismo: a escrita atómica é que garante que o original nunca fica a meio.
export function backupTo(file, destination) {
  return writeAtomic(destination, readFileSync(file));
}
