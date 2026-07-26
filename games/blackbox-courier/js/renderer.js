/**
 * Canvas renderer.
 *
 * 2D canvas with a perspective-inspired projection: everything is positioned in
 * world (x, z) and scaled by focal / (z + focal), which puts the vanishing point
 * on the horizon and the craft's row at scale 1.
 *
 * The renderer is stateless with respect to gameplay — it reads the world and
 * draws it, and never mutates authoritative state.
 */

import { WORLD, VIEW, COLORS, PARTICLES, FX } from './config.js';
import { T } from './obstacles.js';
import { KINDS } from './particles.js';
import { clamp, lerp } from './utils.js';

const { KIND_DOT, KIND_SPARK, KIND_RING, KIND_SHARD } = KINDS;

/** Depth samples used to build the tunnel silhouette. */
const WALL_SAMPLES = 28;
/** The tunnel is drawn past the craft so the corridor reaches the screen edge. */
const NEAR_Z = -8;

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    this.w = 0;
    this.h = 0;
    this.dpr = 1;
    this.reduced = false;
    this.shake = 0;
    this.shakeX = 0;
    this.shakeY = 0;
    this.flash = 0;
    this.flashColor = COLORS.cyan;
    this.zoom = 1;
    this._streaks = [];
    this._order = [];
    this._spans = [];
    this._time = 0;
    this._contextLost = false;

    canvas.addEventListener('contextlost', (e) => {
      e.preventDefault();
      this._contextLost = true;
    });
    canvas.addEventListener('contextrestored', () => {
      this._contextLost = false;
      this._buildCaches();
    });

    this._initStreaks();
    this.resize();
  }

  setReduced(v) {
    this.reduced = v;
    this._initStreaks();
  }

  _initStreaks() {
    const n = this.reduced ? PARTICLES.streaksReduced : PARTICLES.streaks;
    this._streaks.length = 0;
    for (let i = 0; i < n; i++) {
      this._streaks.push({
        x: (Math.random() * 2 - 1) * 1.35,
        z: Math.random() * WORLD.viewDepth,
        len: 6 + Math.random() * 22,
      });
    }
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(1, Math.round(rect.width));
    const cssH = Math.max(1, Math.round(rect.height));
    this.dpr = Math.min(window.devicePixelRatio || 1, VIEW.maxPixelRatio);
    this.canvas.width = Math.round(cssW * this.dpr);
    this.canvas.height = Math.round(cssH * this.dpr);
    this.w = cssW;
    this.h = cssH;
    this.rect = rect;

    this.cx = cssW * 0.5;
    this.hw = cssW * VIEW.halfWidthAtPlayer;
    this.hy = cssH * VIEW.horizonY;
    this.py = cssH * VIEW.playerY;
    this._buildCaches();
  }

  _buildCaches() {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    g.addColorStop(0, '#050914');
    g.addColorStop(0.35, COLORS.deep);
    g.addColorStop(1, COLORS.void);
    this.bgGradient = g;

    const v = ctx.createRadialGradient(
      this.cx, this.py * 0.72, this.w * 0.15,
      this.cx, this.py * 0.72, this.w * 0.95
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(0.62, 'rgba(0,0,0,0.28)');
    v.addColorStop(1, 'rgba(0,0,0,0.82)');
    this.vignette = v;

    const hz = ctx.createRadialGradient(this.cx, this.hy, 0, this.cx, this.hy, this.w * 0.5);
    hz.addColorStop(0, 'rgba(63,242,255,0.30)');
    hz.addColorStop(0.4, 'rgba(40,120,200,0.10)');
    hz.addColorStop(1, 'rgba(0,0,0,0)');
    this.horizonGlow = hz;
  }

  /* ---------------------------------------------------------------- *
   * Projection
   * ---------------------------------------------------------------- */

  scaleAt(z) {
    return WORLD.focal / Math.max(2, z + WORLD.focal);
  }

  sx(x, z) {
    return this.cx + x * this.hw * this.scaleAt(z);
  }

  sy(z) {
    return this.hy + (this.py - this.hy) * this.scaleAt(z);
  }

  /**
   * Screen client-x → world x at the craft's depth. The canvas rect is cached
   * from the last resize: reading it per pointer-move would force a layout on
   * every touch sample.
   */
  toWorldX(clientX) {
    return (clientX - this.rect.left - this.cx) / this.hw;
  }

  addShake(amount) {
    if (this.reduced) return;
    this.shake = Math.min(FX.shakeMaxPixels, this.shake + amount);
  }

  addFlash(color, amount = 0.5) {
    this.flashColor = color;
    this.flash = Math.max(this.flash, this.reduced ? amount * 0.35 : amount);
  }

  pulseZoom(amount = 0.05) {
    if (this.reduced) return;
    this.zoom = 1 + amount;
  }

  /* ---------------------------------------------------------------- *
   * Frame
   * ---------------------------------------------------------------- */

  render(state, dt) {
    if (this._contextLost) return;
    const ctx = this.ctx;
    this._time += dt;

    this.shake = Math.max(0, this.shake - this.shake * FX.shakeDecay * dt);
    this.flash = Math.max(0, this.flash - dt * 2.6);
    this.zoom = lerp(this.zoom, 1, Math.min(1, dt * 5));

    if (this.shake > 0.05) {
      this.shakeX = (Math.random() * 2 - 1) * this.shake;
      this.shakeY = (Math.random() * 2 - 1) * this.shake * 0.7;
    } else {
      this.shakeX = this.shakeY = 0;
    }

    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    ctx.fillStyle = this.bgGradient;
    ctx.fillRect(0, 0, this.w, this.h);

    ctx.save();
    if (this.zoom !== 1 || this.shakeX || this.shakeY) {
      ctx.translate(this.cx + this.shakeX, this.py + this.shakeY);
      ctx.scale(this.zoom, this.zoom);
      ctx.translate(-this.cx, -this.py);
    }

    const glitch = state.glitch || 0;
    this._drawBackdrop(state, glitch);
    this._drawTunnel(state, glitch);
    this._drawStreaks(state, dt);
    this._drawEntities(state);
    this._drawParticles(state);
    if (state.showPlayer) this._drawPlayer(state);
    this._drawLabels(state);

    ctx.restore();

    if (glitch > 0.06 && !this.reduced) this._applyGlitch(glitch);

    ctx.fillStyle = this.vignette;
    ctx.fillRect(0, 0, this.w, this.h);

    if (state.criticalPulse > 0) this._drawCriticalEdge(state.criticalPulse);
    if (this.flash > 0.003) {
      ctx.globalAlpha = Math.min(0.6, this.flash);
      ctx.fillStyle = this.flashColor;
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.globalAlpha = 1;
    }

    ctx.restore();
  }

  /* ---------------------------------------------------------------- *
   * Layers
   * ---------------------------------------------------------------- */

  _drawBackdrop(state, glitch) {
    const ctx = this.ctx;
    ctx.fillStyle = this.horizonGlow;
    ctx.fillRect(0, 0, this.w, this.h * 0.7);

    // Sparse background data motes give the void some parallax.
    const n = this.reduced ? 10 : 26;
    ctx.fillStyle = 'rgba(63,242,255,0.20)';
    const drift = (state.distanceZ || 0) * 0.4;
    for (let i = 0; i < n; i++) {
      const seed = i * 127.1;
      const x = ((Math.sin(seed) * 0.5 + 0.5) * this.w * 1.6 - this.w * 0.3 + drift * (0.2 + (i % 4) * 0.1)) % (this.w * 1.6) - this.w * 0.3;
      const y = this.hy * (0.15 + ((i * 37) % 100) / 130);
      const s = 1 + (i % 3) * 0.6;
      ctx.fillRect(x, y, s, s);
    }

    if (glitch > 0.25) {
      ctx.globalAlpha = (glitch - 0.25) * 0.25;
      ctx.fillStyle = COLORS.red;
      ctx.fillRect(0, 0, this.w, this.h * 0.22);
      ctx.globalAlpha = 1;
    }
  }

  _drawTunnel(state, glitch) {
    const ctx = this.ctx;
    const world = state.world;
    const far = WORLD.viewDepth;

    // Sample the corridor from far to near once and reuse for every pass.
    const L = [];
    const R = [];
    for (let i = 0; i <= WALL_SAMPLES; i++) {
      const z = far + (NEAR_Z - far) * (i / WALL_SAMPLES);
      const w = world.wallAt(Math.max(0, z));
      const wob = glitch > 0.2 ? Math.sin(this._time * 7 + z * 0.12) * glitch * 0.02 : 0;
      L.push([this.sx(w.l + wob, z), this.sy(z), z, w.l]);
      R.push([this.sx(w.r + wob, z), this.sy(z), z, w.r]);
    }

    // Outside-the-corridor fill: the "walls".
    ctx.fillStyle = 'rgba(4,7,16,0.94)';
    ctx.beginPath();
    ctx.moveTo(0, this.hy);
    for (const p of L) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(0, this.h);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(this.w, this.hy);
    for (const p of R) ctx.lineTo(p[0], p[1]);
    ctx.lineTo(this.w, this.h);
    ctx.closePath();
    ctx.fill();

    // Depth rings.
    const spacing = far / VIEW.depthRings;
    const offset = (state.distanceZ || 0) % spacing;
    ctx.lineWidth = 1;
    for (let i = VIEW.depthRings; i >= -3; i--) {
      const z = i * spacing - offset;
      if (z < NEAR_Z || z > far) continue;
      const w = world.wallAt(Math.max(0, z));
      const y = this.sy(z);
      const a = clamp(1 - z / far, 0, 1);
      ctx.strokeStyle = `rgba(31,77,134,${(0.12 + a * 0.5).toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(this.sx(w.l, z), y);
      ctx.lineTo(this.sx(w.r, z), y);
      ctx.stroke();
    }

    // Longitudinal lane guides.
    ctx.strokeStyle = 'rgba(23,48,86,0.75)';
    ctx.lineWidth = 1;
    for (const f of [-0.5, 0, 0.5]) {
      ctx.beginPath();
      for (let i = 0; i < L.length; i++) {
        const z = L[i][2];
        const w = world.wallAt(Math.max(0, z));
        const x = (w.l + w.r) / 2 + ((w.r - w.l) / 2) * f;
        const px = this.sx(x, z);
        const py = this.sy(z);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Glowing corridor edges.
    const edge = (pts, dir) => {
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        if (i === 0) ctx.moveTo(pts[i][0], pts[i][1]);
        else ctx.lineTo(pts[i][0], pts[i][1]);
      }
      ctx.strokeStyle = state.wallHot ? COLORS.orange : COLORS.cyan;
      ctx.lineWidth = 2.2;
      ctx.globalAlpha = 0.9;
      ctx.stroke();
      ctx.globalAlpha = 0.22;
      ctx.lineWidth = 7;
      ctx.stroke();
      ctx.globalAlpha = 1;
      // Wall ribs, brighter close in.
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i += 2) {
        const [x, y, z] = pts[i];
        const a = clamp(1 - z / WORLD.viewDepth, 0, 1) * 0.5;
        if (a < 0.03) continue;
        ctx.strokeStyle = `rgba(63,242,255,${a.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + dir * this.w * 0.06 * (0.3 + a), y);
        ctx.stroke();
      }
    };
    edge(L, -1);
    edge(R, 1);
  }

  _drawStreaks(state, dt) {
    if (state.speedRatio < 0.02) return;
    const ctx = this.ctx;
    const intensity = clamp(state.speedRatio, 0, 1);
    ctx.lineCap = 'round';
    for (const s of this._streaks) {
      s.z -= state.speed * dt * (1.5 + intensity);
      if (s.z < -6) {
        s.z += WORLD.viewDepth;
        s.x = (Math.random() * 2 - 1) * 1.35;
        s.len = 6 + Math.random() * 22;
      }
      const z0 = s.z;
      const z1 = s.z + s.len;
      if (z1 > WORLD.viewDepth) continue;
      const a = clamp(1 - z0 / WORLD.viewDepth, 0, 1) * 0.42 * intensity;
      if (a < 0.02) continue;
      ctx.strokeStyle = `rgba(120,200,255,${a.toFixed(3)})`;
      ctx.lineWidth = 1 + this.scaleAt(z0) * 1.6;
      ctx.beginPath();
      ctx.moveTo(this.sx(s.x, z1), this.sy(z1));
      ctx.lineTo(this.sx(s.x, z0), this.sy(z0));
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  }

  _drawEntities(state) {
    const order = this._order;
    order.length = 0;
    for (const { h } of state.world.allHazards()) {
      if (h.z > WORLD.viewDepth + 8 || h.zFar < -6) continue;
      order.push(h);
    }
    for (const { p } of state.world.allPickups()) {
      if (p.z > WORLD.viewDepth + 8 || p.z < -6) continue;
      order.push(p);
    }
    order.sort((a, b) => b.z - a.z);

    for (const e of order) {
      if (e.type === 'fragment' || e.type === 'repair' || e.type === 'phase') this._drawPickup(e, state);
      else this._drawHazard(e, state);
    }
  }

  _drawHazard(h, state) {
    const ctx = this.ctx;
    switch (h.type) {
      case T.CORRUPTION:
        this._drawCorruption(h);
        break;
      case T.BARRIER:
        this._drawBarrier(h, state);
        break;
      case T.MINE:
        this._drawMine(h);
        break;
      case T.ROTOR:
        this._drawRotor(h);
        break;
      case T.CALIBRATION:
        this._drawCalibration(h);
        break;
      case T.COLLAPSER:
        this._drawCollapser(h);
        break;
      case T.GATE:
        this._drawSlab(h, h.x, h.halfW, COLORS.orange, '#3a1d08', true);
        break;
      default:
        this._drawSlab(h, h.x, h.halfW, '#7fa6d8', '#131e33', false);
        break;
    }
    ctx.globalAlpha = 1;
  }

  /** A solid block drawn as a near face plus connecting sides. */
  _drawSlab(h, x, halfW, stroke, fill, warning) {
    const ctx = this.ctx;
    const zN = Math.max(h.z, -3);
    const zF = Math.max(h.zFar, -2.5);
    const sN = this.scaleAt(zN);
    const sF = this.scaleAt(zF);
    const yN = this.sy(zN);
    const yF = this.sy(zF);
    const hN = Math.max(6, 46 * sN);
    const hF = Math.max(4, 46 * sF);
    const xNL = this.sx(x - halfW, zN);
    const xNR = this.sx(x + halfW, zN);
    const xFL = this.sx(x - halfW, zF);
    const xFR = this.sx(x + halfW, zF);

    ctx.beginPath();
    ctx.moveTo(xFL, yF - hF);
    ctx.lineTo(xFR, yF - hF);
    ctx.lineTo(xNR, yN - hN);
    ctx.lineTo(xNR, yN);
    ctx.lineTo(xNL, yN);
    ctx.lineTo(xNL, yN - hN);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Near face highlight.
    ctx.beginPath();
    ctx.rect(xNL, yN - hN, xNR - xNL, hN);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();

    if (warning && xNR - xNL > 14) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(xNL, yN - hN, xNR - xNL, hN);
      ctx.clip();
      ctx.strokeStyle = 'rgba(255,154,60,0.55)';
      ctx.lineWidth = 3;
      const step = 12;
      for (let sx = xNL - hN; sx < xNR + hN; sx += step) {
        ctx.beginPath();
        ctx.moveTo(sx, yN);
        ctx.lineTo(sx + hN, yN - hN);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  _drawBarrier(h, state) {
    const ctx = this.ctx;
    const z = Math.max(h.z, -2);
    const s = this.scaleAt(z);
    const y = this.sy(z);
    const hgt = Math.max(8, 58 * s);
    const xl = this.sx(h.x - h.halfW, z);
    const xr = this.sx(h.x + h.halfW, z);
    const passable = state.phaseAmount > 0.4;

    const grad = ctx.createLinearGradient(0, y - hgt, 0, y);
    if (passable) {
      grad.addColorStop(0, 'rgba(212,180,255,0.12)');
      grad.addColorStop(0.5, 'rgba(168,120,255,0.30)');
      grad.addColorStop(1, 'rgba(212,180,255,0.12)');
    } else {
      grad.addColorStop(0, 'rgba(168,120,255,0.22)');
      grad.addColorStop(0.5, 'rgba(212,180,255,0.62)');
      grad.addColorStop(1, 'rgba(168,120,255,0.22)');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(xl, y - hgt, xr - xl, hgt);

    // Scanlines mark the plane as energy rather than matter.
    ctx.strokeStyle = passable ? 'rgba(212,180,255,0.28)' : 'rgba(234,246,255,0.5)';
    ctx.lineWidth = 1;
    const rows = 5;
    for (let i = 0; i <= rows; i++) {
      const yy = y - hgt + (hgt * i) / rows + ((this._time * 26) % (hgt / rows));
      if (yy > y) continue;
      ctx.beginPath();
      ctx.moveTo(xl, yy);
      ctx.lineTo(xr, yy);
      ctx.stroke();
    }

    ctx.strokeStyle = passable ? COLORS.violetHot : COLORS.violet;
    ctx.lineWidth = 2.4;
    ctx.strokeRect(xl, y - hgt, xr - xl, hgt);
  }

  _drawMine(h) {
    const ctx = this.ctx;
    const z = Math.max(h.z + h.depth * 0.5, -2);
    const s = this.scaleAt(z);
    const cx = this.sx(h.x, z);
    const cy = this.sy(z) - 22 * s;
    const rOuter = h.radius * this.hw * s;
    const rCore = rOuter * 0.5;
    const pulse = 0.5 + 0.5 * Math.sin(h.pulse);

    ctx.beginPath();
    ctx.arc(cx, cy, rOuter * (0.9 + pulse * 0.18), 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,154,60,${(0.3 + pulse * 0.4).toFixed(2)})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, rCore, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,61,94,${(0.6 + pulse * 0.4).toFixed(2)})`;
    ctx.fill();
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Spokes make mines readable as hazards at small scale.
    ctx.strokeStyle = `rgba(255,154,60,${(0.35 + pulse * 0.35).toFixed(2)})`;
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + h.pulse * 0.4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * rCore, cy + Math.sin(a) * rCore);
      ctx.lineTo(cx + Math.cos(a) * rOuter, cy + Math.sin(a) * rOuter);
      ctx.stroke();
    }
  }

  _drawRotor(h) {
    const ctx = this.ctx;
    const z = Math.max(h.z + h.depth * 0.5, -2);
    const s = this.scaleAt(z);
    const cx = this.sx(h.x, z);
    const cy = this.sy(z) - 24 * s;
    const half = (h.length * 0.5) * this.hw * s;
    const dx = Math.cos(h.angle) * half;
    const dy = Math.sin(h.angle) * half * 0.32;

    ctx.strokeStyle = 'rgba(255,154,60,0.22)';
    ctx.lineWidth = Math.max(6, 22 * s);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - dx, cy - dy);
    ctx.lineTo(cx + dx, cy + dy);
    ctx.stroke();

    ctx.strokeStyle = COLORS.orange;
    ctx.lineWidth = Math.max(3, 12 * s);
    ctx.beginPath();
    ctx.moveTo(cx - dx, cy - dy);
    ctx.lineTo(cx + dx, cy + dy);
    ctx.stroke();
    ctx.lineCap = 'butt';

    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(3, 10 * s), 0, Math.PI * 2);
    ctx.fillStyle = '#2a1608';
    ctx.fill();
    ctx.strokeStyle = COLORS.orange;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  _drawCollapser(h) {
    const ctx = this.ctx;
    const w = h.halfW * 2 * h.grow;
    if (w > 0.004) {
      const x0 = h.side < 0 ? -1 : 1 - w;
      const x1 = h.side < 0 ? -1 + w : 1;
      this._drawSlab(h, (x0 + x1) / 2, (x1 - x0) / 2, COLORS.red, '#2a0a12', true);
    }
    // Telegraph: the full closure footprint drawn as an outline before it shuts.
    if (h.grow < 0.98) {
      const fw = h.halfW * 2;
      const x0 = h.side < 0 ? -1 : 1 - fw;
      const x1 = h.side < 0 ? -1 + fw : 1;
      const z = Math.max(h.z, -2);
      const s = this.scaleAt(z);
      const y = this.sy(z);
      const hgt = Math.max(6, 46 * s);
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = `rgba(255,61,94,${(0.25 + 0.4 * (1 - h.grow)).toFixed(2)})`;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(this.sx(x0, z), y - hgt, this.sx(x1, z) - this.sx(x0, z), hgt);
      ctx.setLineDash([]);
    }
  }

  _drawCalibration(h) {
    const ctx = this.ctx;
    const z = Math.max(h.z, -2);
    const s = this.scaleAt(z);
    const y = this.sy(z);
    const hgt = Math.max(8, 54 * s);

    const blockHalf = (h.halfW - h.gap) / 2;
    const blockOffset = (h.halfW + h.gap) / 2;
    this._drawSlab(h, h.x - blockOffset, blockHalf, '#3ff2ff', '#0a2030', false);
    this._drawSlab(h, h.x + blockOffset, blockHalf, '#3ff2ff', '#0a2030', false);

    const gl = this.sx(h.x - h.gap, z);
    const gr = this.sx(h.x + h.gap, z);
    const pulse = 0.5 + 0.5 * Math.sin(this._time * 5);
    ctx.strokeStyle = `rgba(77,255,176,${(0.55 + pulse * 0.45).toFixed(2)})`;
    ctx.lineWidth = 3;
    ctx.strokeRect(gl, y - hgt, gr - gl, hgt);
    ctx.fillStyle = `rgba(77,255,176,${(0.05 + pulse * 0.08).toFixed(2)})`;
    ctx.fillRect(gl, y - hgt, gr - gl, hgt);
  }

  _drawCorruption(h) {
    const ctx = this.ctx;
    const zN = Math.max(h.z, -3);
    const zF = Math.min(h.zFar, WORLD.viewDepth);
    if (zF <= zN) return;
    const steps = 8;
    ctx.save();
    for (let i = 0; i < steps; i++) {
      const z0 = zN + ((zF - zN) * i) / steps;
      const z1 = zN + ((zF - zN) * (i + 1)) / steps;
      const y0 = this.sy(z1);
      const y1 = this.sy(z0);
      const xl0 = this.sx(h.x - h.halfW, z1);
      const xr0 = this.sx(h.x + h.halfW, z1);
      const xl1 = this.sx(h.x - h.halfW, z0);
      const xr1 = this.sx(h.x + h.halfW, z0);
      const a = 0.06 + 0.08 * (1 - i / steps) + 0.04 * Math.sin(this._time * 6 + i);
      ctx.fillStyle = `rgba(255,61,94,${a.toFixed(3)})`;
      ctx.beginPath();
      ctx.moveTo(xl0, y0);
      ctx.lineTo(xr0, y0);
      ctx.lineTo(xr1, y1);
      ctx.lineTo(xl1, y1);
      ctx.closePath();
      ctx.fill();
    }
    // Edge posts so the boundary is unambiguous.
    ctx.strokeStyle = 'rgba(255,61,94,0.55)';
    ctx.lineWidth = 2;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(this.sx(h.x + side * h.halfW, zF), this.sy(zF));
      ctx.lineTo(this.sx(h.x + side * h.halfW, zN), this.sy(zN));
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawPickup(p, state) {
    const ctx = this.ctx;
    const z = Math.max(p.z, -2);
    const s = this.scaleAt(z);
    const cx = this.sx(p.x, z);
    const cy = this.sy(z) - (20 + Math.sin(p.bob) * 3) * s;
    const r = Math.max(2.2, 13 * s);
    const spin = p.spin;

    if (p.type === 'fragment') {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(spin);
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.lineTo(r * 0.72, 0);
      ctx.lineTo(0, r);
      ctx.lineTo(-r * 0.72, 0);
      ctx.closePath();
      ctx.fillStyle = 'rgba(63,242,255,0.30)';
      ctx.fill();
      ctx.strokeStyle = COLORS.cyan;
      ctx.lineWidth = Math.max(1, 2 * s);
      ctx.stroke();
      ctx.restore();
    } else if (p.type === 'repair') {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(Math.sin(spin) * 0.3);
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = Math.cos(a) * r * 1.15;
        const py = Math.sin(a) * r * 1.15;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(77,255,176,0.24)';
      ctx.fill();
      ctx.strokeStyle = COLORS.green;
      ctx.lineWidth = Math.max(1, 2 * s);
      ctx.stroke();
      // Cross glyph: shape-coded as well as colour-coded.
      ctx.beginPath();
      ctx.moveTo(-r * 0.55, 0);
      ctx.lineTo(r * 0.55, 0);
      ctx.moveTo(0, -r * 0.55);
      ctx.lineTo(0, r * 0.55);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(spin * 0.6);
      ctx.beginPath();
      ctx.roundRect
        ? ctx.roundRect(-r * 0.55, -r, r * 1.1, r * 2, r * 0.4)
        : ctx.rect(-r * 0.55, -r, r * 1.1, r * 2);
      ctx.fillStyle = 'rgba(168,120,255,0.3)';
      ctx.fill();
      ctx.strokeStyle = COLORS.violetHot;
      ctx.lineWidth = Math.max(1, 2 * s);
      ctx.stroke();
      ctx.restore();
    }
  }

  _drawParticles(state) {
    const ctx = this.ctx;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const p of state.particles.pool) {
      if (!p.active) continue;
      if (p.z > WORLD.viewDepth || p.z < -8) continue;
      const s = this.scaleAt(Math.max(p.z, -4));
      const x = this.sx(p.x, Math.max(p.z, -4));
      const y = this.sy(Math.max(p.z, -4)) - p.rise * s - 18 * s;
      const a = clamp(p.life / p.maxLife, 0, 1);
      const size = Math.max(0.6, p.size * s * (0.5 + a * 0.8));
      ctx.fillStyle = `rgba(${p.r},${p.g},${p.b},${(a * 0.85).toFixed(3)})`;
      if (p.kind === KIND_RING) {
        ctx.strokeStyle = `rgba(${p.r},${p.g},${p.b},${(a * 0.7).toFixed(3)})`;
        ctx.lineWidth = Math.max(1, 3 * s);
        ctx.beginPath();
        ctx.arc(x, y, p.size * s * (1 + (1 - a) * 2.6), 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === KIND_SHARD) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(p.rot);
        ctx.fillRect(-size * 0.5, -size * 0.22, size, size * 0.44);
        ctx.restore();
      } else if (p.kind === KIND_SPARK) {
        ctx.fillRect(x - size * 0.5, y - size * 0.5, size, size);
      } else {
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  _drawLabels(state) {
    const ctx = this.ctx;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const l of state.particles.labels) {
      if (!l.active) continue;
      const z = Math.max(l.z, -3);
      const s = this.scaleAt(z);
      const a = clamp(l.life / l.maxLife, 0, 1);
      const size = Math.max(9, 17 * s * l.scale);
      ctx.font = `600 ${size}px "Segoe UI", system-ui, sans-serif`;
      ctx.globalAlpha = a;
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, this.sx(l.x, z), this.sy(z) - 24 * s - l.rise * s);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  _drawPlayer(state) {
    const ctx = this.ctx;
    const p = state.player;
    const x = this.sx(p.x, 0);
    const y = this.py;
    const unit = this.hw * p.visualRadius;
    const phase = p.phaseAmount;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-p.bank * 0.5);

    // Engine bloom.
    const bloom = ctx.createRadialGradient(0, unit * 0.6, 0, 0, unit * 0.6, unit * 3.4);
    bloom.addColorStop(0, phase > 0.2 ? 'rgba(168,120,255,0.45)' : 'rgba(63,242,255,0.42)');
    bloom.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bloom;
    ctx.fillRect(-unit * 3.4, -unit * 3.4, unit * 6.8, unit * 6.8);

    ctx.globalAlpha = 1 - phase * 0.45;

    // Fins.
    ctx.beginPath();
    ctx.moveTo(-unit * 1.55, unit * 1.5);
    ctx.lineTo(-unit * 0.5, unit * 0.05);
    ctx.lineTo(-unit * 0.5, unit * 1.5);
    ctx.closePath();
    ctx.moveTo(unit * 1.55, unit * 1.5);
    ctx.lineTo(unit * 0.5, unit * 0.05);
    ctx.lineTo(unit * 0.5, unit * 1.5);
    ctx.closePath();
    ctx.fillStyle = phase > 0.2 ? 'rgba(168,120,255,0.55)' : 'rgba(27,143,168,0.75)';
    ctx.fill();

    // Hull.
    ctx.beginPath();
    ctx.moveTo(0, -unit * 2.3);
    ctx.lineTo(unit * 0.95, unit * 0.9);
    ctx.lineTo(unit * 0.42, unit * 1.55);
    ctx.lineTo(-unit * 0.42, unit * 1.55);
    ctx.lineTo(-unit * 0.95, unit * 0.9);
    ctx.closePath();
    ctx.fillStyle = phase > 0.2 ? 'rgba(30,16,58,0.72)' : 'rgba(9,22,40,0.94)';
    ctx.fill();
    ctx.strokeStyle = phase > 0.2 ? COLORS.violetHot : COLORS.cyan;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Payload core.
    const coreR = unit * 0.5;
    const core = ctx.createRadialGradient(0, unit * 0.1, 0, 0, unit * 0.1, coreR * 2.2);
    const stab = clamp(state.stability / 100, 0, 1);
    core.addColorStop(0, '#ffffff');
    core.addColorStop(0.35, stab > 0.5 ? COLORS.violetHot : COLORS.orange);
    core.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, unit * 0.1, coreR * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Central energy line.
    ctx.beginPath();
    ctx.moveTo(0, -unit * 1.9);
    ctx.lineTo(0, unit * 1.2);
    ctx.strokeStyle = 'rgba(234,246,255,0.85)';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    ctx.globalAlpha = 1;

    // Phase distortion halo.
    if (phase > 0.02) {
      const t = this._time * 9;
      for (let i = 0; i < 3; i++) {
        const rr = unit * (2.0 + i * 0.7 + Math.sin(t + i) * 0.16);
        ctx.beginPath();
        ctx.arc(0, unit * 0.1, rr, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(168,120,255,${(phase * (0.4 - i * 0.11)).toFixed(3)})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
    ctx.restore();

    // Wall contact spark.
    if (p.scraping !== 0) {
      const w = state.world.wallAt(0);
      const wx = this.sx(p.scraping < 0 ? w.l : w.r, 0);
      ctx.fillStyle = `rgba(255,154,60,${(0.4 + Math.random() * 0.4).toFixed(2)})`;
      ctx.fillRect(wx - 3, y - 14 - Math.random() * 10, 6, 20);
    }
  }

  /**
   * Horizontal slice displacement, sampled from the canvas itself. Cheap
   * compared with a filter, and it never hides hazards for long.
   */
  _applyGlitch(intensity) {
    const ctx = this.ctx;
    const slices = Math.min(6, 1 + Math.floor(intensity * 6));
    for (let i = 0; i < slices; i++) {
      if (Math.random() > 0.35 + intensity * 0.4) continue;
      const sy = Math.random() * this.h;
      const sh = 4 + Math.random() * 26 * intensity;
      const dx = (Math.random() * 2 - 1) * 18 * intensity;
      ctx.drawImage(
        this.canvas,
        0, sy * this.dpr, this.canvas.width, sh * this.dpr,
        dx, sy, this.w, sh
      );
    }
    if (intensity > 0.45) {
      ctx.globalAlpha = (intensity - 0.45) * 0.35;
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(this.canvas, -3, 0, this.w, this.h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
  }

  _drawCriticalEdge(amount) {
    const ctx = this.ctx;
    const g = ctx.createLinearGradient(0, 0, 0, this.h);
    const a = (0.16 + 0.2 * amount).toFixed(3);
    g.addColorStop(0, `rgba(255,61,94,${a})`);
    g.addColorStop(0.22, 'rgba(255,61,94,0)');
    g.addColorStop(0.78, 'rgba(255,61,94,0)');
    g.addColorStop(1, `rgba(255,61,94,${a})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.w, this.h);
  }
}
