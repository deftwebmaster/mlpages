import { wrapDelta, randRange, clamp } from './utils.js';

// Background theme palettes — subtle parallax starfields, no external images.
export const BACKGROUNDS = {
  earth_orbit:      { name: 'Earth Orbit',       sky: '#050a12', tint: '#1a3a5c', starDensity: 1.0, accent: '#2b5c8a' },
  dead_station:     { name: 'Dead Station',      sky: '#07070a', tint: '#26262e', starDensity: 0.8, accent: '#3a3a45' },
  asteroid_graveyard:{ name: 'Asteroid Graveyard',sky: '#080604', tint: '#3a2a1a', starDensity: 0.9, accent: '#5c4326' },
  shipyard:         { name: 'Shipyard',          sky: '#050810', tint: '#20304a', starDensity: 0.7, accent: '#4fd8e8' },
  jovian_orbit:      { name: 'Jovian Orbit',      sky: '#0a0705', tint: '#5c3a1a', starDensity: 1.1, accent: '#c58650' },
  nebula_edge:      { name: 'Nebula Edge',       sky: '#08040c', tint: '#3a1a5c', starDensity: 1.3, accent: '#8b4fd8' },
};

export class Camera {
  constructor(worldW, worldH) {
    this.x = worldW / 2;
    this.y = worldH / 2;
    this.worldW = worldW;
    this.worldH = worldH;
    this.shake = 0;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  follow(target, dt) {
    this.x = target.x;
    this.y = target.y;
    if (this.shake > 0) {
      this.shake = Math.max(0, this.shake - dt * 3.2);
      const s = this.shake;
      this.shakeOffsetX = randRange(-s, s);
      this.shakeOffsetY = randRange(-s, s);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
    }
  }

  addShake(amount) {
    this.shake = Math.min(18, this.shake + amount);
  }

  // World -> screen, using shortest toroidal delta so wrapping is seamless near seams.
  toScreen(wx, wy, screenW, screenH) {
    const dx = wrapDelta(wx, this.x, this.worldW);
    const dy = wrapDelta(wy, this.y, this.worldH);
    return {
      x: screenW / 2 + dx - this.shakeOffsetX,
      y: screenH / 2 + dy - this.shakeOffsetY,
      dx, dy,
    };
  }

  isVisible(wx, wy, radius, screenW, screenH) {
    const p = this.toScreen(wx, wy, screenW, screenH);
    return p.x > -radius - 40 && p.x < screenW + radius + 40 && p.y > -radius - 40 && p.y < screenH + radius + 40;
  }
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.stars = [];
    this.nebula = [];
    this.reducedMotion = false;
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = w;
    this.height = h;
  }

  generateStars(worldW, worldH, density = 1) {
    this.stars = [];
    const layers = [
      { count: 90 * density, speed: 0.15, size: [0.6, 1.2], alpha: 0.35 },
      { count: 60 * density, speed: 0.35, size: [0.9, 1.8], alpha: 0.55 },
      { count: 34 * density, speed: 0.6, size: [1.2, 2.4], alpha: 0.85 },
    ];
    for (const layer of layers) {
      for (let i = 0; i < layer.count; i++) {
        this.stars.push({
          x: Math.random() * worldW,
          y: Math.random() * worldH,
          size: randRange(layer.size[0], layer.size[1]),
          alpha: layer.alpha * randRange(0.6, 1),
          speed: layer.speed,
        });
      }
    }
  }

  generateNebula(worldW, worldH, theme) {
    this.nebula = [];
    const count = 7;
    for (let i = 0; i < count; i++) {
      this.nebula.push({
        x: Math.random() * worldW,
        y: Math.random() * worldH,
        radius: randRange(220, 480),
        alpha: randRange(0.05, 0.13),
        speed: 0.06,
        color: theme.accent,
      });
    }
  }

  drawNebula(camera) {
    const ctx = this.ctx;
    for (const n of this.nebula) {
      const dx = wrapDelta(n.x, camera.x * n.speed + n.x * (1 - n.speed), camera.worldW);
      const dy = wrapDelta(n.y, camera.y * n.speed + n.y * (1 - n.speed), camera.worldH);
      const px = this.width / 2 + dx;
      const py = this.height / 2 + dy;
      if (px < -n.radius || px > this.width + n.radius || py < -n.radius || py > this.height + n.radius) continue;
      const g = ctx.createRadialGradient(px, py, 0, px, py, n.radius);
      g.addColorStop(0, hexAlphaColor(n.color, n.alpha));
      g.addColorStop(1, hexAlphaColor(n.color, 0));
      ctx.fillStyle = g;
      ctx.fillRect(px - n.radius, py - n.radius, n.radius * 2, n.radius * 2);
    }
  }

  clear(bgTheme) {
    const ctx = this.ctx;
    const theme = bgTheme || BACKGROUNDS.earth_orbit;
    const g = ctx.createLinearGradient(0, 0, 0, this.height);
    g.addColorStop(0, theme.sky);
    g.addColorStop(1, mixHex(theme.sky, theme.tint, 0.35));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  drawStars(camera) {
    const ctx = this.ctx;
    for (const s of this.stars) {
      // Parallax: stars use a fraction of the camera's motion via wrapDelta scaled by (1-speed)
      const dx = wrapDelta(s.x, camera.x * s.speed + s.x * (1 - s.speed), camera.worldW);
      const dy = wrapDelta(s.y, camera.y * s.speed + s.y * (1 - s.speed), camera.worldH);
      const px = this.width / 2 + dx;
      const py = this.height / 2 + dy;
      if (px < -4 || px > this.width + 4 || py < -4 || py > this.height + 4) continue;
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = '#eef4f8';
      ctx.fillRect(px, py, s.size, s.size);
    }
    ctx.globalAlpha = 1;
  }

  begin() {
    this.ctx.save();
  }
  end() {
    this.ctx.restore();
  }
}

export function mixHex(a, b, t) {
  const pa = hexToRgb(a), pb = hexToRgb(b);
  const r = Math.round(lerp(pa.r, pb.r, t));
  const g = Math.round(lerp(pa.g, pb.g, t));
  const bl = Math.round(lerp(pa.b, pb.b, t));
  return `rgb(${r},${g},${bl})`;
}
function lerp(a, b, t) { return a + (b - a) * t; }
function hexAlphaColor(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}
