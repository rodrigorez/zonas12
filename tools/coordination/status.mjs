#!/usr/bin/env node
// Quem está a escrever nos mundos agora (D96, M1).
//
// Porque existe: com uma trava global, a pergunta «porque é que o meu comando está à espera?» passa a
// ter uma resposta e não um encolher de ombros. Um dono de trava que morreu aparece marcado — é ele que
// o próximo a chegar vai reclamar.
//
// Uso: node tools/coordination/status.mjs
import { emUso, pastaDeEstado } from './locks.mjs';
import { hostname } from 'node:os';

const vivo = (pid) => {
  if (!Number.isInteger(pid)) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
};

const idade = (desde) => {
  const inicio = Date.parse(desde || 0);
  if (!Number.isFinite(inicio)) return '?';
  const segundos = Math.round((Date.now() - inicio) / 1000);
  return segundos < 60 ? `${segundos} s` : `${Math.round(segundos / 60)} min`;
};

console.log(`oficina: ${pastaDeEstado()}`);
const travas = emUso();

if (travas.length === 0) {
  console.log('livre — ninguém está a escrever nos mundos');
  process.exit(0);
}

for (const { nome, dono } of travas) {
  if (!dono) {
    console.log(`${nome}: tomada, sem dono registado (aquisição a meio ou já morta)`);
    continue;
  }
  const morto = dono.host === hostname() && !vivo(dono.pid);
  const estado = morto ? 'DONO MORTO — o próximo a chegar reclama' : 'a trabalhar';
  console.log(`${nome}: ${estado}`);
  console.log(`  quem:     ${dono.agente || '?'} (pid ${dono.pid} em ${dono.host || '?'})`);
  if (dono.motivo) console.log(`  a fazer:  ${dono.motivo}`);
  console.log(`  há:       ${idade(dono.desde)}`);
}
