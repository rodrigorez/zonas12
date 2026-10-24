// Noite com aurora — o corpo do fragment shader (o prelúdio vive em js/modules/shaders.js).
//
// Contrato: o corpo escreve `vec3 col`; `uTime`, `vDir`, `az` e `el` vêm do prelúdio; não há
// texturas, samplers, `discard` nem código externo.
export const shader = {
  id: 'noite-aurora',
  name: 'Noite com aurora',
  body: `
      vec2 g = vec2(az, el) * 60.0;
      float star = step(0.985, hash(floor(g))) * (0.6 + 0.4 * sin(uTime * 2.0 + hash(floor(g)) * 30.0));
      float band = sin(az * 4.0 + uTime * 0.6 + sin(az * 2.0) * 2.0) * 0.12 + 0.35;
      float aur = smoothstep(0.14, 0.0, abs(el - band));
      col = mix(vec3(0.01, 0.02, 0.06), vec3(0.04, 0.08, 0.2), 1.0 - el);
      col += star * step(0.0, el);
      col += vec3(0.2, 1.0, 0.65) * aur * 0.7;`
};
