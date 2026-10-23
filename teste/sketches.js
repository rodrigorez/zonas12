// Cinco animações para o ambiente de teste. Cada uma desenha um panorama 2:1 inteiro num canvas do
// p5.js e só depende do tempo `t` (em segundos): quem decide quando redesenhar é o motor
// (engine.js), não o sketch.
const TAU = Math.PI * 2;

// Números pseudo-aleatórios repetíveis: o mesmo panorama em todos os aparelhos.
function seeded(seed) {
  let value = seed;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function gradient(p, stops) {
  const context = p.drawingContext;
  const fill = context.createLinearGradient(0, 0, 0, p.height);
  stops.forEach(([offset, color]) => fill.addColorStop(offset, color));
  context.fillStyle = fill;
  context.fillRect(0, 0, p.width, p.height);
}

const stars = (() => {
  const random = seeded(7);
  return Array.from({ length: 260 }, () => ({ x: random(), y: random() * 0.62, size: 1 + random() * 2, phase: random() * TAU }));
})();

const bubbles = (() => {
  const random = seeded(11);
  return Array.from({ length: 40 }, () => ({ x: random(), y: random(), radius: 10 + random() * 46, speed: 6 + random() * 22, phase: random() * TAU }));
})();

export const SKETCHES = [
  {
    name: 'Pôr do sol no mar',
    draw(p, t) {
      const horizon = p.height * 0.52;
      gradient(p, [[0, '#08122f'], [0.52, '#e66953'], [0.5201, '#1f4f63'], [1, '#041123']]);
      p.noStroke();
      for (let ring = 5; ring >= 0; ring--) {
        p.fill(255, 205, 143, 12 + ring * 2);
        p.circle(p.width * 0.25, horizon - p.height * 0.14, p.height * 0.22 + ring * p.height * 0.06);
      }
      p.fill(255, 224, 165);
      p.circle(p.width * 0.25, horizon - p.height * 0.14, p.height * 0.17);
      p.noFill();
      for (let row = 0; row < 14; row++) {
        const y = horizon + p.height * 0.02 + row * p.height * 0.027;
        p.stroke(180, 220, 221, 90 - row * 4);
        p.strokeWeight(row < 3 ? 2 : 1);
        p.beginShape();
        for (let x = 0; x <= p.width; x += p.width / 128) {
          p.vertex(x, y + Math.sin((x / p.width) * TAU * 2 + t * 1.4 + row * 0.7) * (2 + row * 0.35));
        }
        p.endShape();
      }
    }
  },
  {
    name: 'Noite com aurora',
    draw(p, t) {
      gradient(p, [[0, '#02030c'], [0.6, '#0b1633'], [1, '#050810']]);
      p.noStroke();
      stars.forEach((star, index) => {
        p.fill(255, 255, 255, 120 + 120 * Math.sin(t * 2 + star.phase));
        p.circle(star.x * p.width, star.y * p.height, star.size * (p.width / 1024));
      });
      p.noFill();
      for (let ribbon = 0; ribbon < 5; ribbon++) {
        p.stroke(ribbon % 2 ? 'rgba(120,80,255,0.28)' : 'rgba(60,255,170,0.30)');
        p.strokeWeight(p.height * 0.03);
        p.beginShape();
        for (let x = 0; x <= p.width; x += p.width / 96) {
          const wave = Math.sin((x / p.width) * TAU * 3 + t * 0.6 + ribbon) * p.height * 0.06;
          p.vertex(x, p.height * (0.3 + ribbon * 0.035) + wave);
        }
        p.endShape();
      }
    }
  },
  {
    name: 'Bolhas à deriva',
    draw(p, t) {
      gradient(p, [[0, '#0b5563'], [1, '#021722']]);
      p.noStroke();
      bubbles.forEach((bubble, index) => {
        const x = (bubble.x * p.width + t * bubble.speed * 4) % p.width;
        const y = bubble.y * p.height + Math.sin(t * 0.8 + bubble.phase) * p.height * 0.04;
        const radius = bubble.radius * (p.width / 1024);
        p.fill(150, 255, 240, 34);
        p.circle(x, y, radius * 2);
        p.fill(220, 255, 255, 60);
        p.circle(x - radius * 0.3, y - radius * 0.3, radius * 0.5);
      });
    }
  },
  {
    name: 'Grade neon',
    draw(p, t) {
      const horizon = p.height * 0.5;
      gradient(p, [[0, '#14002b'], [0.5, '#7b1fa2'], [0.5001, '#10001f'], [1, '#000']]);
      p.stroke(255, 60, 200, 200);
      p.strokeWeight(2);
      for (let line = 0; line < 18; line++) {
        const depth = ((line + t * 0.8) % 18) / 18;
        const y = horizon + (p.height - horizon) * depth * depth;
        p.line(0, y, p.width, y);
      }
      p.stroke(60, 230, 255, 170);
      for (let line = -40; line <= 40; line++) {
        p.line(p.width / 2 + line * 6, horizon, p.width / 2 + line * p.width * 0.05, p.height);
      }
    }
  },
  {
    name: 'Ondas concêntricas',
    draw(p, t) {
      gradient(p, [[0, '#070b2a'], [1, '#12063a']]);
      p.noFill();
      for (let center = 0; center < 6; center++) {
        for (let ring = 0; ring < 5; ring++) {
          const phase = (t * 0.3 + ring / 5 + center / 6) % 1;
          p.stroke(120 + center * 20, 200 - center * 15, 255, 220 * (1 - phase));
          p.strokeWeight(3);
          p.circle(((center + 0.5) / 6) * p.width, p.height * (0.35 + 0.3 * ((center % 2) ? 1 : 0)), phase * p.height * 0.9);
        }
      }
    }
  }
];
