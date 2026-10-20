// The editor's entry point — the exhibition's sibling (D4). Nothing here is imported by the
// exhibition, and the rule is checked from the other side: js/core/, js/modules/, js/scene/ and
// js/app.js import nothing from js/editor/.
//
// What it does is what js/app.js does, in the same order: the renderer settings are registered, the
// catalogue runs first (every label is a key, D12), and then the editor starts. The worlds it edits
// are the same files the exhibition serves (data/worlds/), and it never writes to disk (D2).
import './scene/render-config.js';
import { initI18n, languageFromUrl } from './i18n.js';
import { startEditor } from './editor/index.js';

initI18n(languageFromUrl())
  .then(() => startEditor())
  .catch((error) => console.error('[editor] the editor could not start:', error));
