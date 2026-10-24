// Nuvens à deriva — o corpo do fragment shader (o prelúdio vive em js/modules/shaders.js).
//
// Contrato: o corpo escreve `vec3 col`; `uTime`, `vDir`, `az` e `el` vêm do prelúdio; não há
// texturas, samplers, `discard` nem código externo.
export const shader = {
  id: 'nuvens',
  name: 'Nuvens à deriva',
  body: `
      vec2 p = vec2(az * 1.5 + uTime * 0.05, el * 3.0);
      float n = noise(p * 3.0) * 0.6 + noise(p * 6.0 + 3.0) * 0.4;
      vec3 sky = mix(vec3(0.15, 0.5, 0.75), vec3(0.6, 0.85, 1.0), 1.0 - abs(el));
      col = mix(sky, vec3(1.0), smoothstep(0.5, 0.8, n));`
};
