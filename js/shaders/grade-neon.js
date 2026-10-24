// Grade neon — o corpo do fragment shader (o prelúdio vive em js/modules/shaders.js).
//
// Contrato: o corpo escreve `vec3 col`; `uTime`, `vDir`, `az` e `el` vêm do prelúdio; não há
// texturas, samplers, `discard` nem código externo.
export const shader = {
  id: 'grade-neon',
  name: 'Grade neon',
  body: `
      vec3 sky = mix(vec3(0.48, 0.12, 0.64), vec3(0.08, 0.0, 0.17), clamp(el * 2.0, 0.0, 1.0));
      float depth = 1.0 / max(-el, 0.02);
      vec2 grid = vec2(az * 6.0 * depth * 0.12, depth + uTime * 2.0);
      vec2 line = smoothstep(0.04, 0.0, abs(fract(grid) - 0.5) - 0.46);
      float g = max(line.x, line.y) * smoothstep(0.0, -0.15, el);
      col = el > 0.0 ? sky : vec3(0.04, 0.0, 0.08) + vec3(1.0, 0.25, 0.8) * g;`
};
