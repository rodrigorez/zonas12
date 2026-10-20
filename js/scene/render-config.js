// The renderer settings of a scene, as an A-Frame component so that a page opts in with one attribute.
//
// Why it is here and not in the entry point any more: since Fase 4 a scene has **two hosts** — the
// exhibition (js/app.js) and the editor's preview (js/editor/) — and both need exactly these three
// settings. Keeping the component in the exhibition's entry point would have meant writing them a
// second time in the editor, and the drawing rules (law L6) would have had two sources that can
// disagree. It lives in js/scene/ because it is the scene's, not the exhibition's.
AFRAME.registerComponent('ar-config', {
  init: function () {
    this.el.setAttribute('embedded', '');
    this.applyRendererConfig();
    this.el.addEventListener('render-target-loaded', () => this.applyRendererConfig());
  },
  applyRendererConfig: function () {
    const renderer = this.el.renderer;
    if (!renderer) return;

    // Law L6, checked instead of assumed: without `stencil: true` on the <a-scene> the portals have
    // no mask to write, and every window would show nothing — a page that forgets the attribute gets
    // told once, in the console, instead of a scene that quietly does not work.
    const settings = this.el.getAttribute('renderer');
    if (!settings || settings.stencil !== true) {
      console.warn('[scene] the <a-scene> has no stencil: true; the portals will have no window (L6)');
    }

    renderer.setClearColor(0x000000, 0);
    // Confirms what A-Frame 1.8.0 already fixes when it initialises the renderer system
    // (src/systems/renderer.js): with sortObjects false, three ignores the renderOrder and draws in
    // tree order, which only works by accident with a portal. With several, the masks have to be
    // drawn before all the content. (renderOrder: mask 1, panorama 2, artworks 3, frame 4)
    renderer.sortObjects = true;
    // The stencil is cleared to 0 every frame; 0 means "no window here".
    renderer.autoClearStencil = true;
  }
});
