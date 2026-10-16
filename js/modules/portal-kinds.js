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
//   enters     the traversal changes the dimension the visitor is in (stays in this world)
//   navigates  the traversal leaves this world, and the action carries a `target` slug

export const WINDOW_KINDS = ['dimension-pair', 'preview', 'none'];
export const ACTION_KINDS = ['enter-window', 'navigate', 'none'];

export const WINDOWS = {
  'dimension-pair': { shows: 'pair', summary: 'the two dimensions of the door, live' },
  preview: { shows: 'preview', summary: 'a portrait of the world the door leads to' },
  none: { shows: 'nothing', summary: 'a window that shows nothing' }
};

export const ACTIONS = {
  'enter-window': { enters: true, navigates: false, summary: 'stay in the dimension the window shows' },
  navigate: { enters: false, navigates: true, summary: 'open the world the target names' },
  none: { enters: false, navigates: false, summary: 'a window with no passage' }
};

// The world of the root page (D24): the gate. It is the only world whose address is not its slug —
// the root serves it — and that is why `navigate` has to know which one it is.
export const ENTRY_WORLD = 'gate';

// The address of a world, from the base of the deployment (the page passes `document.baseURI`, which
// is what makes the same code work from the root and from inside a room — D28).
export function worldHref(slug, base) {
  return new URL(slug === ENTRY_WORLD ? './' : slug + '/', base).href;
}

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

// What a door needs beyond the shape of its data — the third thing each entry of the table offers
// (section 5.4). Each problem says what is wrong and which law it breaks, so the data validator can
// report it as it is and the editor (Fase 4) can show the message to whoever is writing the door.
//
// `door` is the portal as it is written in the data (window and action included).
export function validateDoor(door) {
  const problems = [];
  const axisWindow = (door && door.window) || {};
  const axisAction = (door && door.action) || {};

  if (axisWindow.kind && axisAction.kind && !isLegalCombination(axisWindow.kind, axisAction.kind)) {
    problems.push({
      message: `the window "${axisWindow.kind}" with the action "${axisAction.kind}" is not one of ` +
        `the legal combinations`,
      law: 'law L18 (the portrait would lie, or the visitor would walk into the portrait)'
    });
  }
  if (axisWindow.kind === 'dimension-pair') {
    const { dimensionA, dimensionB } = axisWindow;
    if (Number.isInteger(dimensionA) && dimensionA === dimensionB) {
      problems.push({
        message: `the pair links dimension ${dimensionA} to itself: the window would show the ` +
          `dimension the visitor is standing in`,
        law: 'law of the format (§5.4)'
      });
    }
  }
  return problems;
}
