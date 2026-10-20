// The camera panel: there is one camera, so it has no "insert" and no "delete" (section 7 of the
// roadmap) — only the things the data carries and one button that exists because positioning by
// numbers is tedious: "use the position I am at".
//
// The webcam is **data** here (`cameras.real.enabled`), and the camera itself is never asked for on
// load (D34): the button is the gesture that requests it, and it runs the same `startSession` as the
// exhibition's start button.
//
// Opening a world never rewrites it: the objects a world may leave out (`cameras`, `player`, `real`)
// are created by the first keystroke that needs them, not by the panel being painted.
import { t } from '../../i18n.js';
import { playerCamera, startSession, useRealCamera } from '../../modules/camera.js';
import * as preview from '../preview.js';
import { heading, numberField, vec3Field, checkboxField, button, note, debounce } from '../fields.js';

const round = (value) => Math.round(value * 1000) / 1000;

export function render(host, context) {
  const data = context.world();
  const cameras = data.cameras || {};
  const player = cameras.player || {};
  const real = cameras.real || {};

  const writePlayer = () => {
    if (!data.cameras) data.cameras = {};
    if (!data.cameras.player) data.cameras.player = {};
    return data.cameras.player;
  };
  const writeReal = () => {
    if (!data.cameras) data.cameras = {};
    if (!data.cameras.real) data.cameras.real = { enabled: false };
    return data.cameras.real;
  };

  heading(host, 'editor.camera.title');

  const apply = debounce(() => {
    preview.replaceCamera(writePlayer());
    context.change();
  });

  vec3Field(host, {
    labelKey: 'editor.camera.position',
    value: player.position || [0, 1.6, 0],
    step: 0.1,
    onChange: (values) => { writePlayer().position = values; apply(); }
  });

  numberField(host, {
    labelKey: 'editor.camera.speed',
    value: typeof player.speed === 'number' ? player.speed : 0.1,
    step: 0.01,
    min: 0.001,
    onChange: (value) => { writePlayer().speed = value; apply(); }
  });

  checkboxField(host, {
    labelKey: 'editor.camera.webcam',
    checked: real.enabled === true,
    onChange: (on) => {
      writeReal().enabled = on;
      useRealCamera(on);
      context.change();
    }
  });

  // "Use the position I am at": one reading, no live field. The value ends up in the fields above
  // because the panel is painted again.
  button(host, {
    labelKey: 'editor.camera.useCurrent',
    onClick: () => {
      const where = playerCamera.position();
      if (!where) return;
      writePlayer().position = [round(where.x), round(where.y), round(where.z)];
      context.rerender();
      preview.replaceCamera(writePlayer());
      context.change();
    }
  });

  button(host, {
    labelKey: 'editor.camera.ask',
    onClick: () => startSession()
  });

  note(host, t('editor.camera.hint'));
}
