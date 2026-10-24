// Pôr do sol no mar — o corpo do fragment shader (o prelúdio vive em js/modules/shaders.js).
//
// Contrato: o corpo escreve `vec3 col`; `uTime`, `vDir`, `az` e `el` vêm do prelúdio; não há
// texturas, samplers, `discard` nem código externo. É este o ficheiro que o validador compila e
// mede antes de a exposição o poder nomear.
export const shader = {
  id: 'por-do-sol',
  name: 'Pôr do sol no mar',
  body: `
      vec3 sky = mix(vec3(0.9, 0.41, 0.33), vec3(0.03, 0.07, 0.18), smoothstep(0.0, 0.9, el));
      float sun = smoothstep(0.12, 0.0, length(vec2(az - 0.4, el - 0.2)));
      sky += vec3(1.0, 0.8, 0.55) * sun;
      float wave = sin(az * 18.0 + uTime * 1.4 + 6.0 / (abs(el) + 0.05)) * 0.5 + 0.5;
      vec3 sea = mix(vec3(0.02, 0.1, 0.18), vec3(0.45, 0.7, 0.75), wave * smoothstep(0.0, -0.3, el) * 0.5);
      col = el > 0.0 ? sky : sea;`
};
