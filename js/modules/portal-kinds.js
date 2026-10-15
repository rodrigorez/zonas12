// The two axes of a portal, as data: what the window shows and what the traversal does
// (docs/ROADMAP.md, section 5.4, decision D14).
//
// Why the names and the legal matrix live in a file of their own instead of inside portal.js: the
// same table has to be read by code that never touches a browser. The data validator
// (js/scene/validation.js) also runs in node (tools/scene/validate.mjs) and cannot import
// portal.js, which registers an A-Frame component the moment it is imported — in node that is
// `AFRAME is not defined`. So this file stays pure (no DOM, no A-Frame, no three) and portal.js
// adds the behaviour of each entry on top of it.
//
// Each entry says what the axis means in the vocabulary of the data:
//   shows      'pair'    the window shows the dimension of the pair that is not the active one
//              'preview' the window shows the portrait the entry names (D26)
//              'nothing' the window shows nothing
//   navigates  the traversal leaves this world, and the action carries a `target` slug

export const WINDOW_KINDS = ['dimension-pair', 'preview', 'none'];
export const ACTION_KINDS = ['enter-window', 'navigate', 'none'];

export const WINDOWS = {
  'dimension-pair': { shows: 'pair', summary: 'the two dimensions of the door, live' },
  preview: { shows: 'preview', summary: 'a portrait of the world the door leads to' },
  none: { shows: 'nothing', summary: 'a window that shows nothing' }
};

export const ACTIONS = {
  'enter-window': { navigates: false, summary: 'stay in the dimension the window shows' },
  navigate: { navigates: true, summary: 'open the world the target names' },
  none: { navigates: false, summary: 'a window with no passage' }
};

// The legal combinations of section 5.4, and the reason of each "no":
//   dimension-pair + navigate   the window shows a dimension of THIS world while the traversal
//                               leaves it: what the visitor sees through it would be a lie (L13);
//   preview + enter-window      it would walk into the portrait, which is a dimension derived in
//                               the reserved band of the ids (L15);
//   none + none                 a door with neither window nor destination has no function.
// The table of section 5.4 did not spell out `none` + `enter-window`, and it is out for the same
// reason as `none` + `none`: there is no window to walk into.
//
// One source on purpose: the module reads this matrix for the door's own `validate` and the data
// validator reads it for law L18, so the two can never disagree about what is legal.
const LEGAL = {
  'dimension-pair': ['enter-window', 'none'],
  preview: ['navigate', 'none'],
  none: ['navigate']
};

export function isLegalCombination(windowKind, actionKind) {
  return (LEGAL[windowKind] || []).includes(actionKind);
}
