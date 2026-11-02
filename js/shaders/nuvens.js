// Nuvens à deriva — o corpo do fragment shader (o prelúdio vive em js/modules/shaders.js).
//
// Contrato: o corpo escreve `vec3 col`; `uTime`, `vDir`, `az` e `el` vêm do prelúdio; não há
// texturas, samplers, `discard` nem código externo.
export const shader = {
  id: 'nuvens',
  name: 'Nuvens à deriva',
  body: `
      // O céu lê-se na **direcção** e não em (az, el): o azimute não fecha na volta — salta de +PI para
      // -PI atrás do visitante — e a nuvem saía cortada ao meio naquele meridiano (D82). A deriva é o
      // campo de ruído a andar, e não o azimute a crescer.
      float deriva = uTime * 0.15;
      vec2 anel = azim * 4.5;
      float n = noise3(vec3(anel + vec2(deriva, 0.0), el * 9.0)) * 0.6
              + noise3(vec3(anel * 2.0 + vec2(deriva * 2.0, 3.0), el * 18.0 + 3.0)) * 0.4;
      vec3 sky = mix(vec3(0.15, 0.5, 0.75), vec3(0.6, 0.85, 1.0), 1.0 - abs(el));
      col = mix(sky, vec3(1.0), smoothstep(0.5, 0.8, n));`
};
