// The panels, in the order the roadmap lists them (section 7). Each one renders into its own section so
// that a panel that has nothing to say stays invisible, and the composition is one list.
import * as cameraPanel from './camera.js';
import * as dimensionPanel from './dimension.js';
import * as artworkPanel from './artwork.js';
import * as portalPanel from './portal.js';
import * as worldPanel from './world.js';

// The order of section 7 of the roadmap: what the world is, what it is made of, and the camera.
const PANELS = [worldPanel, dimensionPanel, artworkPanel, portalPanel, cameraPanel];

// `context` is the small contract between a panel and the editor:
//   world()                  the data being edited
//   change({ rebuild })      validate again, and rebuild the scene when the structure changed (D33)
//   rerender()               paint the panels again (a value was set by a button, or the shape changed)
export function renderAll(context) {
  const host = document.getElementById('paineis');
  if (!host) return;
  host.replaceChildren();
  for (const panel of PANELS) {
    const section = document.createElement('section');
    section.className = 'painel';
    panel.render(section, context);
    host.appendChild(section);
  }
}
