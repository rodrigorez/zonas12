// Ondas concêntricas — o corpo do fragment shader (o prelúdio vive em js/modules/shaders.js).
//
// Contrato: o corpo escreve `vec3 col`; `uTime`, `vDir`, `az` e `el` vêm do prelúdio; não há
// texturas, samplers, `discard` nem código externo.
export const shader = {
  id: 'ondas',
  name: 'Ondas concêntricas',
  body: `
      float r = length(vec2(az * 0.5, el * 1.2));
      float ring = smoothstep(0.08, 0.0, abs(fract(r * 4.0 - uTime * 0.25) - 0.5) - 0.4);
      col = mix(vec3(0.03, 0.04, 0.16), vec3(0.07, 0.02, 0.23), 1.0 - el);
      col += vec3(0.45, 0.7, 1.0) * ring * (1.0 - clamp(r, 0.0, 1.5) / 1.5);`
};
