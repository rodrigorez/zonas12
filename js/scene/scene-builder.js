// Builds the exhibition from data — the file this phase exists for.
//
// It is the only file of js/scene/ that knows A-Frame: the schema describes the format, the
// validator checks it, and each module knows its own component. What lives here is the order of
// the build, the defaults the data may leave out, and the two things the data does not carry
// resolved: the address an artwork opens (D20: it comes from the assets catalogue) and the
// language of the text (D21).
//
// The order is not arbitrary:
//   1. the assets, because a dimension and an artwork name them by selector (`#id`) — the element
//      has to exist before the component that looks for it;
//   2. the camera, because the panorama follows it and the portal collision asks it where the
//      visitor is;
//   3. the dimensions, then the artworks, then the portals.

import { SCENE, ORIGIN_LANGUAGE, textIn } from './schema.js';
import { createPlayerCamera, useRealCamera } from '../modules/camera.js';
import { createDimension, removeDimension } from '../modules/dimension.js';
import { createArtwork, removeArtwork } from '../modules/artwork.js';
import { createPortal, removePortal } from '../modules/portal.js';

// Fills in the defaults the schema declares, so that the rest of this file — and the factories —
// can read a field without asking whether it was written. An object that is not there stays
// absent: the defaults belong to the fields of an object, not to the object itself.
export function withDefaults(data, node) {
  const fields = (node && node.fields) || (node && node.item) || (node && node.entry) || {};
  const out = Object.assign({}, data);
  for (const [name, field] of Object.entries(fields)) {
    if (out[name] === undefined && field.default !== undefined) out[name] = field.default;
  }
  return out;
}

export async function buildScene(scene, options = {}) {
  const parent = options.parent || document.querySelector('a-scene');
  if (!parent) throw new Error('scene-builder: there is no <a-scene> to build into');
  const language = options.language || ORIGIN_LANGUAGE;
  const catalogue = scene.assets || {};
  const cameras = scene.cameras || {};

  const elements = {
    assets: createAssets(catalogue, parent, language),
    camera: null,
    dimensions: [],
    artworks: [],
    portals: []
  };

  // The assets first, and loaded before anything else is built: this is the wait A-Frame does by
  // itself for entities written by hand (its <a-assets> holds the scene until its children have
  // loaded), and the builder creates them after the page has loaded, so it has to do it here. A
  // texture built from an image that has not decoded yet is a warning in the console (test T8)
  // and a black panel on the screen.
  await Promise.all(elements.assets.map(waitForAsset));

  const player = withDefaults(cameras.player || {}, SCENE.cameras.fields.player);
  elements.camera = createPlayerCamera(player, parent);
  useRealCamera(cameras.real ? cameras.real.enabled === true : false);

  for (const dimension of scene.dimensions || []) {
    const el = createDimension(withDefaults(dimension, SCENE.dimensions), parent);
    if (el) elements.dimensions.push(el);
  }

  for (const artwork of scene.artworks || []) {
    const data = withDefaults(artwork, SCENE.artworks);
    data.url = addressToOpen(data, catalogue);
    elements.artworks.push(createArtwork(data, parent));
  }

  for (const portal of scene.portals || []) {
    elements.portals.push(createPortal(withDefaults(portal, SCENE.portals), parent));
  }

  return {
    elements,
    // The counterpart of the build: the editor (Fase 4) will want to take one scene down and put
    // another one up, and every module already knows how to release what it created (A4).
    remove() {
      elements.portals.forEach(removePortal);
      elements.artworks.forEach(removeArtwork);
      elements.dimensions.forEach(removeDimension);
      elements.assets.forEach((asset) => { if (asset.pause) asset.pause(); asset.remove(); });
      if (elements.camera) elements.camera.remove();
      elements.portals = [];
      elements.artworks = [];
      elements.dimensions = [];
      elements.assets = [];
      elements.camera = null;
    }
  };
}

// What an artwork opens, if it opens anything: an external address when `interaction` is `link`,
// and otherwise the file the catalogue has for its asset (D20 — the artwork names the asset once
// and the address derives from it, here, in one place).
function addressToOpen(artwork, catalogue) {
  if (artwork.interaction === 'link') return artwork.url || null;
  if (artwork.interaction !== 'modal') return null;
  const asset = catalogue[artwork.asset];
  return asset && asset.path ? asset.path : null;
}

// The <a-assets> entries, from the catalogue: one place holds a path, so one place creates them.
// The id of an entry is the id the data uses, and it becomes the `#id` selector a dimension and
// an artwork point at.
function createAssets(catalogue, parent, language) {
  const container = parent.querySelector('a-assets') || parent.appendChild(document.createElement('a-assets'));
  const created = [];

  for (const [id, asset] of Object.entries(catalogue)) {
    const isVideo = asset.type === 'video';
    const el = document.createElement(isVideo ? 'video' : 'img');
    el.setAttribute('id', id);
    el.setAttribute('src', asset.path);
    el.setAttribute('crossorigin', 'anonymous');

    const description = textIn(asset.alt, language);
    // A <video> has no alt: the description of a video goes on the title.
    if (description) el.setAttribute(isVideo ? 'title' : 'alt', description);

    if (isVideo) {
      el.setAttribute('autoplay', '');
      el.setAttribute('loop', '');
      el.setAttribute('muted', '');
    }

    container.appendChild(el);
    created.push(el);
  }

  return created;
}

// One asset, loaded. Never rejects: an asset that fails resolves too, so one broken file cannot
// stop the whole scene from being built — the console and the validator are what report it.
function waitForAsset(el) {
  return new Promise((resolve) => {
    const done = () => resolve();
    if (el.tagName === 'VIDEO') {
      // HAVE_CURRENT_DATA: there is a frame to paint, which is what a texture needs.
      if (el.readyState >= 2) done();
      else {
        el.addEventListener('loadeddata', done, { once: true });
        el.addEventListener('error', done, { once: true });
      }
      return;
    }
    if (el.complete && el.naturalWidth > 0) done();
    else {
      el.addEventListener('load', done, { once: true });
      el.addEventListener('error', done, { once: true });
    }
  });
}
