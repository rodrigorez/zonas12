// What is wrong with the world that is open, as the validator says it.
//
// Since Fase 4 the editor runs the **same** validator as the console and the command line — one
// implementation of the laws (docs/ROADMAP.md, section 8) — so this file only *renders* the report:
// three counts and one line per problem, each carrying the law it breaks when the validator names it.
//
// Since B9 the two questions the command line used to answer alone — does the asset exist, what shape
// is the image — are answered here too (js/editor/assets.js, `fetch` and decoding), so the third count
// ("not verified") is 0 in a world the editor can see whole. The export refuses while the first count
// is not 0 (js/editor/index.js).
import { t } from '../i18n.js';

const byId = (id) => document.getElementById(id);

export function clear() {
  const list = byId('problemas');
  if (list) list.replaceChildren();
  const counts = byId('contagens');
  if (counts) counts.textContent = '';
}

export function show(report) {
  const list = byId('problemas');
  const counts = byId('contagens');
  if (!list || !counts) return;
  list.replaceChildren();

  const errors = report.errors || [];
  const warnings = report.warnings || [];
  const skipped = report.skipped || [];

  counts.textContent = [
    t('editor.problems.errors', { count: errors.length }),
    t('editor.problems.warnings', { count: warnings.length }),
    t('editor.problems.skipped', { count: skipped.length })
  ].join(' · ');

  const entries = errors.map((text) => ['erro', text])
    .concat(warnings.map((text) => ['aviso', text]))
    .concat(skipped.map((text) => ['nota', text]));

  if (entries.length === 0) {
    const line = document.createElement('li');
    line.className = 'nota';
    line.textContent = t('editor.problems.clean');
    list.appendChild(line);
    return;
  }

  for (const [kind, text] of entries) {
    const line = document.createElement('li');
    line.className = 'problema ' + kind;
    line.textContent = text;
    list.appendChild(line);
  }
}
