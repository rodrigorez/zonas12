// As travas da oficina (D96, M1): uma secção crítica curta para tudo o que escreve no projeto.
//
// **Porque uma trava e não uma por ficheiro.** Os escritores deste projeto não escrevem um ficheiro:
// o `new-room` escreve a sala nova, o portão e cada destino, e depois corre quatro ferramentas que
// reescrevem **todos** os mundos. Uma trava por ficheiro deixaria a porta aberta exactamente onde dói —
// dois processos a reescrever o portão ao mesmo tempo perdem uma porta (medido: 2 de 3 tentativas).
// Uma trava global é mais grosseira e é a única honesta: a secção crítica é o **conjunto**, não o nó.
//
// **E porque é que isso não mata o paralelismo.** O que demora numa sala são as duas horas de autoria —
// compor, escolher obras, escrever textos — e essas passam-se a editar o ficheiro da própria sala, que
// mais ninguém toca. A parte que precisa da trava são segundos: medido, as quatro derivadas somam
// 0,1 a 0,2 s por sala. Catorze salas em série custam menos de meio minuto de espera no total.
//
// **Como se toma.** `mkdir` é atómico em NTFS e em POSIX: ou cria, ou falha com `EEXIST`. É a primitiva
// certa — o Node não tem `flock`, e um ficheiro de trava escrito com `writeFileSync` teria ele próprio
// a corrida que vem resolver.
//
// **Quando é que uma trava é de um processo morto.** Um `SIGKILL` não corre manipuladores de saída, por
// isso a trava fica. A pergunta certa não é «há quanto tempo» — é «o dono ainda existe». Nesta máquina,
// `process.kill(pid, 0)` responde. O `ttl` fica como rede para o caso de o pid ter sido reciclado ou de o
// dono estar noutra máquina.
//
// O estado vive em `<git-common-dir>/zonas-run/` e **não** em `.harness/`: o `.harness/` é um directório
// diferente por *worktree*, e duas sessões em worktrees distintos não se veriam — que é precisamente o
// caso que a D96 existe para cobrir. O `git-common-dir` é o único sítio partilhado por todos.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { hostname } from 'node:os';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// O código de saída de «ocupado»: não é erro, é «repete». O mesmo `EX_TEMPFAIL` do sysexits.
export const OCUPADO = 75;

let cacheEstado = null;

export function pastaDeEstado() {
  if (cacheEstado) return cacheEstado;
  let comum;
  try {
    comum = execFileSync('git', ['rev-parse', '--git-common-dir'], { cwd: RAIZ, encoding: 'utf8' }).trim();
  } catch {
    throw new Error('não sei onde é o .git: as travas precisam do `git-common-dir` para se verem entre worktrees');
  }
  cacheEstado = join(isAbsolute(comum) ? comum : resolve(RAIZ, comum), 'zonas-run');
  return cacheEstado;
}

const pastaDasTravas = () => join(pastaDeEstado(), 'locks');

// Quem sou eu, para o registo. Uma sessão de agente passa `ZONAS_AGENTE`; sem isso, o pid serve.
export function quemSou() {
  return process.env.ZONAS_AGENTE || `${hostname()}:${process.pid}`;
}

const agora = () => new Date().toISOString();

function dormir(milissegundos) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milissegundos);
}

function escreverDono(pasta, dono) {
  writeFileSync(join(pasta, 'dono.json'), JSON.stringify(dono, null, 2) + '\n', 'utf8');
}

function lerDono(pasta) {
  try {
    return JSON.parse(readFileSync(join(pasta, 'dono.json'), 'utf8'));
  } catch {
    return null;
  }
}

// O pid ainda existe? `EPERM` é «existe e não é meu» — vivo, portanto.
function vivo(pid) {
  if (!Number.isInteger(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

// A pasta existe mas ainda não tem `dono.json`: a aquisição está a meio. Só é de reclamar se já passou
// tempo suficiente para ninguém poder estar entre o `mkdir` e o `writeFile`.
const AQUISICAO_EM_CURSO = 5;

function podeReclamar(pasta, dono, ttlPedido) {
  if (!dono) {
    try {
      const idade = (Date.now() - statSync(pasta).mtimeMs) / 1000;
      return idade > AQUISICAO_EM_CURSO;
    } catch {
      return true;
    }
  }
  if (dono.host === hostname() && !vivo(dono.pid)) return true;
  const desde = Date.parse(dono.batida || dono.desde || 0);
  if (!Number.isFinite(desde)) return true;
  const ttl = (dono.ttl || ttlPedido || 600) * 2;
  return (Date.now() - desde) / 1000 > ttl;
}

function descrever(dono) {
  if (!dono) return 'sem dono registado';
  const desde = Date.parse(dono.desde || 0);
  const segundos = Number.isFinite(desde) ? Math.round((Date.now() - desde) / 1000) : '?';
  return `${dono.agente || dono.pid}` + (dono.motivo ? ` — ${dono.motivo}` : '') + ` (há ${segundos} s)`;
}

// Toma a trava `nome`. Síncrona de propósito: as ferramentas do projeto são síncronas e uma API
// assíncrona obrigaria a colorir meio `new-room` sem ganho nenhum.
//
// `esperar`: segundos que aceita ficar à espera (por omissão 120). `--esperar 0` desiste logo.
// `ttl`: segundos ao fim dos quais a trava é de quem chegar, se o dono não der sinal de vida.
export function tomar(nome, opcoes = {}) {
  const esperar = opcoes.esperar === undefined ? 120 : Number(opcoes.esperar);
  const ttl = opcoes.ttl === undefined ? 600 : Number(opcoes.ttl);
  const pasta = join(pastaDasTravas(), nome);
  mkdirSync(pastaDasTravas(), { recursive: true });
  const comeco = Date.now();
  let avisou = false;
  let espera = 25;

  for (;;) {
    let tomou = false;
    try {
      mkdirSync(pasta, { recursive: false });
      tomou = true;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
    }

    if (tomou) {
      escreverDono(pasta, {
        nome,
        agente: quemSou(),
        pid: process.pid,
        host: hostname(),
        motivo: opcoes.motivo || '',
        ttl,
        desde: agora(),
        batida: agora()
      });
      const trava = {
        nome,
        pasta,
        batida() {
          const dono = lerDono(pasta);
          if (dono && dono.pid === process.pid) escreverDono(pasta, Object.assign(dono, { batida: agora() }));
        },
        soltar() {
          const dono = lerDono(pasta);
          // Só o dono solta: quem reclamou uma trava de um morto não apaga a do seguinte.
          if (dono && dono.pid !== process.pid) return false;
          rmSync(pasta, { recursive: true, force: true });
          return true;
        }
      };
      process.once('exit', () => trava.soltar());
      return trava;
    }

    const dono = lerDono(pasta);
    if (podeReclamar(pasta, dono, ttl)) {
      console.log(`trava ${nome}: o dono anterior desapareceu (${descrever(dono)}) — a reclamar`);
      rmSync(pasta, { recursive: true, force: true });
      continue;
    }

    const decorrido = (Date.now() - comeco) / 1000;
    if (decorrido >= esperar) {
      const erro = new Error(`a oficina está ocupada: ${nome} — ${descrever(dono)}`);
      erro.codigo = OCUPADO;
      erro.dono = dono;
      throw erro;
    }
    if (!avisou) {
      console.log(`trava ${nome}: à espera de ${descrever(dono)}`);
      avisou = true;
    }
    dormir(espera + Math.floor(Math.random() * 25));
    espera = Math.min(espera * 2, 400);
  }
}

// O atalho: toma, corre, solta — e solta mesmo que `fn` atire.
export function comTrava(nome, fn, opcoes = {}) {
  const trava = tomar(nome, opcoes);
  try {
    return fn(trava);
  } finally {
    trava.soltar();
  }
}

// O que está tomado agora, para o `status.mjs` e para quem ficou à espera.
export function emUso() {
  const pasta = pastaDasTravas();
  if (!existsSync(pasta)) return [];
  return readdirSync(pasta, { withFileTypes: true })
    .filter((entrada) => entrada.isDirectory())
    .map((entrada) => ({ nome: entrada.name, dono: lerDono(join(pasta, entrada.name)) }));
}

// ---- a porta única: `oficina` ----
//
// O nome da secção crítica de tudo o que escreve nos mundos. Uma só, e de propósito: os escritores não
// escrevem um ficheiro, escrevem o conjunto (ver o cabeçalho).
export const OFICINA = 'oficina';

// A herança. O `new-room` toma a oficina e depois **chama** o `ring`, o `azimuths`, o `reality` e o
// `sorteio`. Se cada filho tentasse tomar a mesma trava, ficavam os dois a olhar um para o outro até ao
// fim dos tempos. O pai marca o ambiente e o filho sabe que já está dentro da secção crítica.
export const HERDADA = 'ZONAS_TRAVA_OFICINA';

export const dentroDaOficina = () => process.env[HERDADA] === '1';

// Corre `fn` com a oficina tomada — ou directamente, se já estamos dentro dela.
// Se a oficina estiver ocupada e o tempo de espera acabar, diz o que fazer e sai com 75 — excepto com
// `sairNoOcupado: false`, que é o caso de quem **não pode** morrer: o servidor da ferramenta.
export function oficina(motivo, fn, opcoes = {}) {
  if (dentroDaOficina()) return fn(null);
  const sair = opcoes.sairNoOcupado !== false;
  let trava;
  try {
    trava = tomar(OFICINA, Object.assign({ motivo }, opcoes));
  } catch (error) {
    if (error.codigo === OCUPADO && sair) {
      console.error(`ocupado: ${error.message}`);
      console.error('  outro agente está a escrever nos mundos — repete daqui a pouco (não é erro)');
      console.error('  para ver quem: node tools/coordination/status.mjs');
      process.exit(OCUPADO);
    }
    throw error;
  }
  try {
    return fn(trava);
  } finally {
    trava.soltar();
  }
}
