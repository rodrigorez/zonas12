// As perguntas que só o disco responde, num sítio só (Fase 3, leis L9 e L14; Fase 5, D50).
//
// Porque existe: o validador (`js/scene/validation.js`) sabe perguntar se um asset existe e que
// forma tem a imagem, mas não pode ir ao disco — é o mesmo módulo que corre no browser. Quem
// responde é o host, e desde a Fase 5 há **dois** hosts de linha de comando: o `validate.mjs` e o
// servidor que grava (`tools/server/serve.mjs`). Duas cópias de um leitor de cabeçalhos JPEG seriam
// duas respostas que podem divergir sobre o mesmo ficheiro.
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const ROOT = resolve(here, '..', '..');

// A forma de uma imagem, lida do cabeçalho do ficheiro e sem a descodificar (lei L14). Só JPEG e
// PNG, que é o que os panoramas são.
function imageSizeIn(root, assetPath) {
  const full = join(root, assetPath);
  if (!existsSync(full)) return null;
  const buffer = readFileSync(full);

  // PNG: o tamanho está no IHDR, logo a seguir à assinatura.
  if (buffer.length > 24 && buffer.toString('ascii', 1, 4) === 'PNG') {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  // JPEG: percorrem-se os marcadores até um início de quadro (SOF), que traz o tamanho.
  if (buffer.length > 4 && buffer[0] === 0xFF && buffer[1] === 0xD8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xFF) { offset++; continue; }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      // SOF0…SOF15, tirando os marcadores que não são quadros (DHT, JPG, DAC).
      if (marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      if (length < 2) break;
      offset += 2 + length;
    }
  }
  return null;
}

// O par que o validador aceita em `options`, para uma raiz do projeto. Um caminho absoluto já é erro
// de L12; não vale a pena perguntar ao disco por ele.
export function diskQuestions(root = ROOT) {
  return {
    exists: (assetPath) => (/^([a-zA-Z]:[\\/]|[\\/])/.test(assetPath)
      ? undefined
      : existsSync(join(root, assetPath))),
    imageSize: (assetPath) => imageSizeIn(root, assetPath)
  };
}
