// The interface catalogue (D12): every label the interface shows comes from i18n/<language>.json,
// never from a literal in the code. Portuguese is the origin language and the fallback — a missing
// translation shows the Portuguese, never a raw key and never an empty box.
//
// The language comes from `?lang=` and from nowhere else, on purpose: a kiosk gets one language per
// address, and two QR codes are two links. There is no switcher and no memory in the browser.
//
// This file is interface only. It knows nothing about the scene, the portals or the editor; the list
// of languages is read from the scene format so that the content and the interface never disagree
// about which languages exist.
import { LANGUAGES, ORIGIN_LANGUAGE } from './scene/schema.js';

const FOLDER = 'i18n/';
const catalogues = new Map();
const warned = new Set();
let current = ORIGIN_LANGUAGE;

// `fetch` is relative to the page's base (D28), so the same call works from the gate and from
// inside a room.
async function fetchCatalogue(language) {
  const response = await fetch(FOLDER + language + '.json');
  if (!response.ok) throw new Error(FOLDER + language + '.json: HTTP ' + response.status);
  const data = await response.json();
  return (data && data.strings) || {};
}

export function languageFromUrl(search) {
  const requested = new URLSearchParams(search === undefined ? window.location.search : search).get('lang');
  return LANGUAGES.includes(requested) ? requested : ORIGIN_LANGUAGE;
}

export function currentLanguage() {
  return current;
}

// Loads the origin catalogue and, when the address asks for another language, that one too. A
// language whose file is not there is not an error: the visitor gets the Portuguese and the console
// says why — the missing translation is a job still to do, not a broken page.
export async function initI18n(language) {
  const requested = LANGUAGES.includes(language) ? language : ORIGIN_LANGUAGE;
  catalogues.set(ORIGIN_LANGUAGE, await fetchCatalogue(ORIGIN_LANGUAGE));
  if (requested !== ORIGIN_LANGUAGE) {
    try {
      catalogues.set(requested, await fetchCatalogue(requested));
    } catch (error) {
      console.warn('[i18n] ' + error.message + '; showing ' + ORIGIN_LANGUAGE);
    }
  }
  current = requested;
  applyTexts();
  return current;
}

// One key, one text. `params` fills `{name}` placeholders, so a whole sentence is one key and a
// translation can reorder its parts (D12, rule 2).
export function t(key, params) {
  const chosen = catalogues.get(current) || {};
  const origin = catalogues.get(ORIGIN_LANGUAGE) || {};
  let text = typeof chosen[key] === 'string' ? chosen[key] : origin[key];
  if (typeof text !== 'string') {
    if (!warned.has(key)) {
      warned.add(key);
      console.warn('[i18n] missing key "' + key + '" in ' + ORIGIN_LANGUAGE);
    }
    return key;
  }
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (whole, name) => (name in params ? String(params[name]) : whole));
}

// Applies the catalogue to the markup. The HTML keeps the Portuguese written by hand as the value
// that exists before this runs (D12, rule 4) and carries the key: `data-i18n` sets the text,
// `data-i18n-label` the aria-label and `data-i18n-title` the title.
export function applyTexts(root) {
  const scope = root || document;
  document.title = t('app.title');
  document.documentElement.lang = current === ORIGIN_LANGUAGE ? 'pt-BR' : current;
  scope.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.getAttribute('data-i18n'));
  });
  scope.querySelectorAll('[data-i18n-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.getAttribute('data-i18n-label')));
  });
  scope.querySelectorAll('[data-i18n-title]').forEach((element) => {
    element.setAttribute('title', t(element.getAttribute('data-i18n-title')));
  });
}
