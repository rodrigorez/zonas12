// The shape of the scene file: what data/scene.json may contain, version 2.
//
// Why a description instead of code that reads it: four different readers need to agree on the
// format — the scene builder (js/scene/scene-builder.js), the validator (js/scene/validation.js,
// which is also what tools/html-to-scene-json/validate.mjs runs), the converter that writes the
// file (tools/html-to-scene-json/convert.mjs) and, later, the editor (Fase 4). Written once, they
// cannot drift apart.
//
// Because of that this file has to stay pure: no DOM, no A-Frame, no three. It holds data only.
//
// Decisions behind the format (docs/ROADMAP.md, section 11):
//   D20 — one `assets` catalogue: a dimension and an artwork carry only `asset`, and the URL an
//         artwork opens is derived from the catalogue. `url` is left for `interaction: link`.
//   D21 — content text is a map by language (`{ "pt": ..., "en": ... }`), never a plain string.
//   D23 — `version: 2`, and a reader refuses a version it does not know.
//
// What is NOT here:
//   - the laws of the scene (L1, L4, L5, L9, L12 …): they live in validation.js, next to the
//     checks that enforce them, because a law is a decision, not a field;
//   - the values A-Frame falls back to when an attribute is missing: those live in each
//     component's schema (js/modules/). Where a field below is optional, its `default` is what
//     the builder applies, and it matches the component's. What keeps the two from drifting is
//     the converter: it reads the component and writes the value into the JSON.

import { MAX_DIMENSIONS, MAX_PORTALS } from '../core/index.js';

export const SCENE_VERSION = 2;

// Languages of the content text (D12, variant A). Portuguese is the origin language: a text map
// that does not have the requested language falls back to it.
export const LANGUAGES = ['pt', 'en'];
export const ORIGIN_LANGUAGE = 'pt';

export const ASSET_KINDS = ['image', 'video'];
export const DIMENSION_KINDS = ['image', 'video', 'color', 'camera'];
export const CONTENT_KINDS = ['image', 'video', 'model', 'text'];
export const INTERACTIONS = ['modal', 'link', 'none'];
export const TRIGGER_KINDS = ['plane', 'box'];

// A field descriptor:
//   type      'int' | 'number' | 'string' | 'boolean' | 'vec3' | 'text' | 'asset'
//             'object' (with `fields`) | 'array' (with `item`) | 'map' (with `entry`)
//   required  the field has to be present (a field that is not required may be left out, and
//             then `default` applies — see the note above about the component's own defaults)
//   oneOf     the allowed values
//   ref       the field is an id of another entity of the scene ('dimensions', 'portals')
//   id        an id of this kind of entity: unique and inside the range
//   min/max   bounds for a number or an id
//   positive  every part has to be greater than zero
//   default   the value the builder uses when the field is absent
//
// 'text' is a map by language: { "pt": "...", "en": "..." }, with at least one language.
// 'asset' is a key of the `assets` catalogue.

const text = { type: 'text' };
const vec3 = (defaultValue) => (defaultValue === undefined
  ? { type: 'vec3', required: true }
  : { type: 'vec3', default: defaultValue });

export const SCENE = {
  version: { type: 'int', required: true, const: SCENE_VERSION },

  // Where the visitor starts and how fast the on-screen D-pad walks (metres per frame).
  cameras: {
    type: 'object',
    fields: {
      player: {
        type: 'object',
        fields: {
          position: vec3([0, 1.6, 0]),
          speed: { type: 'number', default: 0.1, positive: true }
        }
      },
      // Whether the exhibition shows the real world behind dimension 0 (the webcam). It is
      // required on purpose: the page asks for the camera only when the data says so.
      real: { type: 'object', fields: { enabled: { type: 'boolean', required: true } } }
    }
  },

  // The single place a file path appears (D20). A dimension and an artwork name an entry here.
  assets: {
    type: 'map',
    entry: {
      path: { type: 'string', required: true },
      type: { type: 'enum', oneOf: ASSET_KINDS, required: true },
      // The description a reader (screen reader, search engine) gets for this file. Optional,
      // but a file without one is a warning: it becomes the alt of the <img>/<video> the builder
      // creates, and nobody else can supply it.
      alt: text
    }
  },

  dimensions: {
    type: 'array',
    item: {
      id: { type: 'int', required: true, id: true, max: MAX_DIMENSIONS - 1 },
      // 'camera' is the real world (the webcam behind dimension 0): it has no 360º background.
      kind: { type: 'enum', oneOf: DIMENSION_KINDS, required: true },
      asset: { type: 'asset' },
      name: text,
      // The background is a sphere and it has to be wider than the distance to any portal: a
      // smaller radius puts the background inside the window (law L1).
      radius: { type: 'number', positive: true },
      // A background that follows the camera is what a room looks like from anywhere; the
      // portrait of a world door will be a background that does not follow it (D14).
      followCamera: { type: 'boolean', default: true },
      // Only for `kind: 'color'`: the flat background, when there is no image.
      color: { type: 'string' }
    }
  },

  artworks: {
    type: 'array',
    item: {
      id: { type: 'int', required: true, id: true },
      dimension: { type: 'int', required: true, ref: 'dimensions' },
      kind: { type: 'enum', oneOf: CONTENT_KINDS, required: true },
      // What the artwork shows. The URL of the modal is derived from it (D20): the same file is
      // named once, not twice.
      asset: { type: 'asset', required: true },
      position: vec3(),
      rotation: vec3([0, 0, 0]),
      // The width and the height of the panel, and the thickness of the box behind it.
      size: vec3(),
      interaction: { type: 'enum', oneOf: INTERACTIONS, default: 'none' },
      // Only for `interaction: 'link'`: an external address, which is not an asset.
      url: { type: 'string' },
      // Content text: what this artwork is called, in each language (D21). Optional until the
      // editor (Fase 4) has somewhere to read it.
      title: text
    }
  },

  portals: {
    type: 'array',
    item: {
      id: { type: 'int', required: true, id: true, max: MAX_PORTALS - 1 },
      dimensionA: { type: 'int', required: true, ref: 'dimensions' },
      dimensionB: { type: 'int', required: true, ref: 'dimensions' },
      // The dimension the door stands in: -1 means it shows up in either of the two.
      ownedBy: { type: 'int', required: true, ref: 'dimensions', plusMinusOne: true },
      position: vec3([0, 0, 0]),
      rotation: vec3([0, 0, 0]),
      width: { type: 'number', required: true, positive: true },
      height: { type: 'number', required: true, positive: true },
      // The collision box: it is the only source of the box, and the debug box (key D) uses the
      // same values. Traversal is a collision with it, never a distance.
      box: { type: 'vec3', required: true, positive: true },
      boxPosition: vec3([0, 8, 0]),
      boxRotation: vec3([0, 0, 0]),
      // Where the traversal is detected, always inside the box: 'plane' on the plane of the
      // frame (the change is not noticed) or 'box' on the entry face.
      trigger: { type: 'enum', oneOf: TRIGGER_KINDS, default: 'plane' },
      frame: {
        type: 'object',
        fields: {
          color: { type: 'string', default: '#ff0000' },
          thickness: { type: 'number', default: 0.3, positive: true }
        }
      }
    }
  }
};

// The text of a field in one language, falling back to the origin language when the map does not
// have it. Returns null when there is no text at all, so a caller can tell "not written yet" from
// "written empty".
export function textIn(value, language) {
  if (!value || typeof value !== 'object') return null;
  if (typeof value[language] === 'string') return value[language];
  if (typeof value[ORIGIN_LANGUAGE] === 'string') return value[ORIGIN_LANGUAGE];
  const first = LANGUAGES.find((candidate) => typeof value[candidate] === 'string');
  return first ? value[first] : null;
}
