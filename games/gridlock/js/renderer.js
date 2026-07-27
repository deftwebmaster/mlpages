/**
 * renderer.js — Canvas presentation layer.
 *
 * Two-layer strategy:
 *   • The maze geometry is drawn once into an offscreen canvas and blitted each
 *     frame. It is only rebuilt when the maze actually changes (`maze.version`)
 *     or the viewport resizes — a Grid Shift costs one rebuild, not 60 a second.
 *   • Everything that moves (collectables, entities, particles, overlays) is
 *     drawn live on top.
 *
 * Corridors are drawn as connected rounded "pipes" rather than tile-by-tile
 * walls: each walkable tile stretches toward its walkable neighbours, so the
 * outline closes up automatically and every junction reads at a glance.
 */

import { CFG, COLORS, TILE, DRONE_STATE, isWalkable } from './config.js';
import { clamp, lerp, easeInOut, easeOut, rgba, roundRectPath, TAU, createCanvas } from './utils.js';

export class Renderer {
  /**
   * @param {HTMLCanvasElement} canvas
   */
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.dpr = 1;
    this.tile = 24;
    this.originX = 0;
    this.originY = 0;
    this.width = 0;
    this.height = 0;

    /** @type {import('./maze.js').Maze|null} */
    this.maze = null;
    this.staticCanvas = null;
    this.staticCtx = null;
    /** Pre-shift image of the maze, used to animate rotations. */
    this.prevStatic = null;
    this.prevStaticCtx = null;
    this.staticVersion = -1;

    this.shake = 0;
    this.shakeEnabled = true;
    this.time = 0;
    /** @type {{text:string, sub:string, life:number, max:number, tone:string}|null} */
    this.toast = null;
    this.flash = 0;
    this.flashColor = COLORS.player;
  }

  setMaze(maze) {
    this.maze = maze;
    this.staticVersion = -1;
    this.toast = null;
    this.flash = 0;
    this.shake = 0;
    // The canvas is usually already measured by the time a level loads, and
    // `resize()` short-circuits when the pixel size has not changed — so the
    // new maze has to claim its layout here or it renders at the default scale.
    if (this.width > 0 && this.height > 0) this._layout();
  }

  /**
   * Fits the board to the element box while keeping tiles perfectly square.
   * @returns {boolean} true if anything changed
   */
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    const w = Math.max(1, Math.floor(rect.width * dpr));
    const h = Math.max(1, Math.floor(rect.height * dpr));
    if (w === this.canvas.width && h === this.canvas.height && dpr === this.dpr) return false;

    this.canvas.width = w;
    this.canvas.height = h;
    this.dpr = dpr;
    this.width = w;
    this.height = h;

    if (this.maze) this._layout();
    this.staticVersion = -1;
    return true;
  }

  _layout() {
    const cols = this.maze.width;
    const rows = this.maze.height;
    // A whole number of device pixels per tile keeps the neon outlines crisp.
    this.tile = Math.max(4, Math.floor(Math.min(this.width / cols, this.height / rows)));
    this.originX = Math.floor((this.width - this.tile * cols) / 2);
    this.originY = Math.floor((this.height - this.tile * rows) / 2);
  }

  /** Converts a tile-space point to canvas pixels (tile centres at integers). */
  toScreen(tx, ty) {
    return {
      x: this.originX + (tx + 0.5) * this.tile,
      y: this.originY + (ty + 0.5) * this.tile,
    };
  }

  addShake(amount) {
    if (!this.shakeEnabled) return;
    this.shake = Math.min(1, this.shake + amount);
  }

  showToast(text, sub = '', tone = COLORS.terminal, duration = 1.9) {
    this.toast = { text, sub, life: duration, max: duration, tone };
  }

  addFlash(color, strength = 0.35) {
    this.flash = Math.max(this.flash, strength);
    this.flashColor = color;
  }

  // ── Static maze layer ─────────────────────────────────────────────────────
  _ensureStatic() {
    const maze = this.maze;
    if (this.staticCanvas && this.staticVersion === maze.version) return;

    const needed = !this.staticCanvas || this.staticCanvas.width !== this.width || this.staticCanvas.height !== this.height;
    if (needed) {
      this.staticCanvas = createCanvas(this.width, this.height);
      this.staticCtx = this.staticCanvas.getContext('2d');
      this.prevStatic = createCanvas(this.width, this.height);
      this.prevStaticCtx = this.prevStatic.getContext('2d');
    } else {
      // Keep the outgoing image so a rotation has something to spin.
      this.prevStaticCtx.clearRect(0, 0, this.width, this.height);
      this.prevStaticCtx.drawImage(this.staticCanvas, 0, 0);
    }

    this._drawStatic(this.staticCtx);
    this.staticVersion = maze.version;
  }

  _drawStatic(ctx) {
    const maze = this.maze;
    const T = this.tile;
    ctx.clearRect(0, 0, this.width, this.height);

    // Faint circuit grid behind the maze.
    ctx.save();
    ctx.strokeStyle = rgba(COLORS.wallEdge, 0.22);
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= maze.width; x++) {
      const px = Math.round(this.originX + x * T) + 0.5;
      ctx.moveTo(px, this.originY);
      ctx.lineTo(px, this.originY + maze.height * T);
    }
    for (let y = 0; y <= maze.height; y++) {
      const py = Math.round(this.originY + y * T) + 0.5;
      ctx.moveTo(this.originX, py);
      ctx.lineTo(this.originX + maze.width * T, py);
    }
    ctx.stroke();
    ctx.restore();

    const pad = T * 0.12;
    const stroke = Math.max(1.6, T * 0.085);

    // Three passes build the corridor: a soft halo, a bright edge, then the
    // dark channel punched back out of it. Drawing the *corridors* rather than
    // the walls is what makes every junction close up cleanly.
    ctx.fillStyle = rgba(COLORS.wallEdgeHot, 0.22);
    ctx.beginPath();
    this._traceCorridors(ctx, pad - stroke * 2.2);
    ctx.fill();

    ctx.fillStyle = COLORS.wallEdge;
    ctx.beginPath();
    this._traceCorridors(ctx, pad - stroke);
    ctx.fill();

    ctx.fillStyle = COLORS.floor;
    ctx.beginPath();
    this._traceCorridors(ctx, pad);
    ctx.fill();

    this._drawFixtures(ctx);
  }

  /**
   * Adds every walkable tile to the current path as a rounded rect that grows
   * toward its walkable neighbours, so adjacent tiles fuse into one shape.
   */
  _traceCorridors(ctx, pad) {
    const maze = this.maze;
    const T = this.tile;
    const radius = Math.max(2, T * 0.3 - pad);

    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const t = maze.grid[y * maze.width + x];
        // Gates and bridges keep a corridor footprint even while shut, so the
        // player can read them as doors rather than as solid wall.
        const solid = !isWalkable(t) && t !== TILE.GATE_CLOSED && t !== TILE.BRIDGE_OFF;
        if (solid) continue;

        const openable = (nx, ny) => {
          if (!maze.inBounds(nx, ny)) return false;
          const n = maze.grid[ny * maze.width + nx];
          return isWalkable(n) || n === TILE.GATE_CLOSED || n === TILE.BRIDGE_OFF;
        };

        // Reach *past* the shared edge by the corner radius so neighbouring
        // tiles overlap. Meeting exactly on the boundary would leave a visible
        // pinch at every junction where the two roundings meet.
        const reach = pad + radius;
        let x0 = x * T + pad;
        let x1 = (x + 1) * T - pad;
        let y0 = y * T + pad;
        let y1 = (y + 1) * T - pad;
        if (openable(x - 1, y)) x0 -= reach;
        if (openable(x + 1, y)) x1 += reach;
        if (openable(x, y - 1)) y0 -= reach;
        if (openable(x, y + 1)) y1 += reach;

        roundRectPath(ctx, this.originX + x0, this.originY + y0, x1 - x0, y1 - y0, radius);
      }
    }
  }

  /** Gates, barriers, bridges and secret bulkheads, drawn over the corridors. */
  _drawFixtures(ctx) {
    const maze = this.maze;
    const T = this.tile;

    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const t = maze.grid[y * maze.width + x];
        const px = this.originX + x * T;
        const py = this.originY + y * T;

        switch (t) {
          case TILE.GATE_CLOSED: {
            ctx.fillStyle = rgba(COLORS.gate, 0.9);
            const barW = T * 0.13;
            for (let k = 0; k < 3; k++) {
              ctx.fillRect(px + T * (0.2 + k * 0.25), py + T * 0.12, barW, T * 0.76);
            }
            ctx.strokeStyle = rgba(COLORS.gate, 0.55);
            ctx.lineWidth = Math.max(1, T * 0.05);
            ctx.strokeRect(px + T * 0.1, py + T * 0.1, T * 0.8, T * 0.8);
            break;
          }
          case TILE.GATE_OPEN: {
            ctx.fillStyle = rgba(COLORS.gate, 0.5);
            ctx.fillRect(px + T * 0.06, py + T * 0.06, T * 0.12, T * 0.16);
            ctx.fillRect(px + T * 0.82, py + T * 0.06, T * 0.12, T * 0.16);
            ctx.fillRect(px + T * 0.06, py + T * 0.78, T * 0.12, T * 0.16);
            ctx.fillRect(px + T * 0.82, py + T * 0.78, T * 0.12, T * 0.16);
            break;
          }
          case TILE.BRIDGE_ON: {
            ctx.strokeStyle = rgba(COLORS.bridge, 0.85);
            ctx.lineWidth = Math.max(1, T * 0.06);
            for (let k = 0; k < 3; k++) {
              const o = py + T * (0.25 + k * 0.25);
              ctx.beginPath();
              ctx.moveTo(px + T * 0.12, o);
              ctx.lineTo(px + T * 0.88, o);
              ctx.stroke();
            }
            break;
          }
          case TILE.BRIDGE_OFF: {
            // A visible promise: players should be able to plan around a span
            // before they ever activate the terminal that extends it.
            ctx.strokeStyle = rgba(COLORS.bridge, 0.3);
            ctx.lineWidth = Math.max(1, T * 0.05);
            ctx.setLineDash([T * 0.14, T * 0.12]);
            ctx.strokeRect(px + T * 0.15, py + T * 0.15, T * 0.7, T * 0.7);
            ctx.setLineDash([]);
            break;
          }
          case TILE.BARRIER: {
            ctx.fillStyle = rgba(COLORS.danger, 0.22);
            ctx.fillRect(px + T * 0.08, py + T * 0.08, T * 0.84, T * 0.84);
            ctx.strokeStyle = rgba(COLORS.danger, 0.85);
            ctx.lineWidth = Math.max(1, T * 0.07);
            ctx.beginPath();
            for (let k = -1; k < 3; k++) {
              ctx.moveTo(px + T * (0.1 + k * 0.35), py + T * 0.9);
              ctx.lineTo(px + T * (0.45 + k * 0.35), py + T * 0.1);
            }
            ctx.save();
            ctx.rect(px, py, T, T);
            ctx.clip();
            ctx.stroke();
            ctx.restore();
            break;
          }
          case TILE.SECRET: {
            // Amber seams: the tell that something is hidden behind this wall.
            ctx.strokeStyle = rgba(COLORS.secret, 0.4);
            ctx.lineWidth = Math.max(1, T * 0.06);
            ctx.beginPath();
            ctx.moveTo(px + T * 0.18, py + T * 0.5);
            ctx.lineTo(px + T * 0.82, py + T * 0.5);
            ctx.moveTo(px + T * 0.5, py + T * 0.18);
            ctx.lineTo(px + T * 0.5, py + T * 0.82);
            ctx.stroke();
            ctx.strokeStyle = rgba(COLORS.secret, 0.18);
            ctx.strokeRect(px + T * 0.12, py + T * 0.12, T * 0.76, T * 0.76);
            break;
          }
          default:
            break;
        }
      }
    }
  }

  // ── Frame ─────────────────────────────────────────────────────────────────
  /**
   * @param {number} dt seconds
   * @param {object} scene { maze, player, drones, particles, shift, state }
   */
  draw(dt, scene) {
    const ctx = this.ctx;
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 3.2);
    this.flash = Math.max(0, this.flash - dt * 2.4);
    if (this.toast) {
      this.toast.life -= dt;
      if (this.toast.life <= 0) this.toast = null;
    }

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, this.width, this.height);
    if (!this.maze) return;

    this._ensureStatic();

    const shakeMag = this.shake * this.tile * 0.28;
    const ox = shakeMag ? (Math.random() - 0.5) * shakeMag : 0;
    const oy = shakeMag ? (Math.random() - 0.5) * shakeMag : 0;

    ctx.save();
    ctx.translate(ox, oy);

    const anim = scene.shift ? scene.shift.animation : null;
    const rot = anim && anim.kind === 'rotate' ? anim : null;
    const comboRots = anim && anim.kind === 'combo' ? anim.parts.filter((p) => p.kind === 'rotate') : [];
    const rotations = rot ? [rot] : comboRots;
    const animT = anim ? clamp(anim.t / anim.duration, 0, 1) : 1;

    this._drawMazeLayer(ctx, rotations, animT);
    this._drawCollectables(ctx, rotations, animT);
    this._drawTerminals(ctx, scene, rotations, animT);
    this._drawSecretHints(ctx);

    if (anim && anim.kind !== 'rotate') this._drawTileAnim(ctx, anim, animT);
    if (anim && anim.kind === 'combo') {
      for (const part of anim.parts) if (part.kind !== 'rotate') this._drawTileAnim(ctx, part, animT);
    }

    if (scene.particles) {
      ctx.save();
      ctx.translate(this.originX, this.originY);
      scene.particles.draw(ctx, this.tile);
      ctx.restore();
    }

    for (const drone of scene.drones) this._drawDrone(ctx, drone, rotations, animT, scene);
    this._drawPlayer(ctx, scene.player, rotations, animT);

    ctx.restore();

    this._drawVignette(ctx);
    if (this.flash > 0) {
      ctx.fillStyle = rgba(this.flashColor, this.flash * 0.4);
      ctx.fillRect(0, 0, this.width, this.height);
    }
    this._drawToast(ctx);
  }

  /** Blits the cached maze, spinning any block that is mid-rotation. */
  _drawMazeLayer(ctx, rotations, t) {
    if (!rotations.length) {
      ctx.drawImage(this.staticCanvas, 0, 0);
      return;
    }
    const T = this.tile;
    ctx.drawImage(this.staticCanvas, 0, 0);

    for (const r of rotations) {
      const bx = this.originX + r.x0 * T;
      const by = this.originY + r.y0 * T;
      const size = r.size * T;
      const cx = bx + size / 2;
      const cy = by + size / 2;
      const ease = easeInOut(t);

      // Hide the settled result, then spin the pre-shift image into place.
      ctx.save();
      ctx.fillStyle = COLORS.bg;
      ctx.fillRect(bx, by, size, size);
      ctx.beginPath();
      ctx.rect(bx - T, by - T, size + T * 2, size + T * 2);
      ctx.clip();
      ctx.translate(cx, cy);
      ctx.rotate(r.dir * (Math.PI / 2) * ease);
      ctx.translate(-cx, -cy);
      ctx.drawImage(this.prevStatic, bx, by, size, size, bx, by, size, size);
      ctx.restore();

      // Mechanical sweep line, so the rotation reads as machinery.
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(COLORS.terminal, 0.5 * (1 - t));
      ctx.lineWidth = Math.max(1.5, T * 0.08);
      ctx.strokeRect(bx, by, size, size);
      ctx.restore();
    }
  }

  /**
   * Where a point should be drawn while its block spins. Entities have already
   * been moved to their post-shift tiles, so we rotate them *backwards* by the
   * remaining angle.
   */
  _animPos(tx, ty, rotations, t) {
    if (!rotations.length) return { x: tx, y: ty };
    for (const r of rotations) {
      if (tx < r.x0 || ty < r.y0 || tx >= r.x0 + r.size || ty >= r.y0 + r.size) continue;
      const cx = r.x0 + (r.size - 1) / 2;
      const cy = r.y0 + (r.size - 1) / 2;
      const a = r.dir * (Math.PI / 2) * (easeInOut(t) - 1);
      const dx = tx - cx;
      const dy = ty - cy;
      return { x: cx + dx * Math.cos(a) - dy * Math.sin(a), y: cy + dx * Math.sin(a) + dy * Math.cos(a) };
    }
    return { x: tx, y: ty };
  }

  _drawCollectables(ctx, rotations, t) {
    const maze = this.maze;
    const T = this.tile;
    const pulse = 0.5 + 0.5 * Math.sin(this.time * 3.4);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Energy nodes.
    const nodeR = T * 0.11 + T * 0.02 * pulse;
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        const i = y * maze.width + x;
        const secret = maze.secretNodes[i];
        if (!maze.nodes[i] && !secret) continue;
        const p = this._animPos(x, y, rotations, t);
        const sx = this.originX + (p.x + 0.5) * T;
        const sy = this.originY + (p.y + 0.5) * T;
        const color = secret ? COLORS.secret : COLORS.node;

        ctx.fillStyle = rgba(color, 0.2);
        ctx.beginPath();
        ctx.arc(sx, sy, nodeR * 2.1, 0, TAU);
        ctx.fill();
        ctx.fillStyle = rgba(color, 0.95);
        ctx.beginPath();
        ctx.arc(sx, sy, nodeR, 0, TAU);
        ctx.fill();
      }
    }

    // Power modules.
    for (let y = 0; y < maze.height; y++) {
      for (let x = 0; x < maze.width; x++) {
        if (!maze.powers[y * maze.width + x]) continue;
        const p = this._animPos(x, y, rotations, t);
        const sx = this.originX + (p.x + 0.5) * T;
        const sy = this.originY + (p.y + 0.5) * T;
        const r = T * (0.24 + 0.05 * pulse);

        ctx.fillStyle = rgba(COLORS.power, 0.18);
        ctx.beginPath();
        ctx.arc(sx, sy, r * 2, 0, TAU);
        ctx.fill();

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.time * 1.1);
        // A clean hexagon reads as "component" at any size; a star would turn
        // into an unrecognisable blob once tiles get small on a phone.
        ctx.fillStyle = rgba(COLORS.power, 0.95);
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const a = (k / 6) * TAU;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = rgba('#ffffff', 0.9);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.3, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  _drawTerminals(ctx, scene, rotations, t) {
    const T = this.tile;
    const ready = scene.shift ? scene.shift.ready : true;

    for (const term of this.maze.terminals) {
      const p = this._animPos(term.x, term.y, rotations, t);
      const sx = this.originX + (p.x + 0.5) * T;
      const sy = this.originY + (p.y + 0.5) * T;
      const spent = term.exhausted;
      const alpha = spent ? 0.22 : ready ? 1 : 0.42;
      const color = spent ? COLORS.textDim : ready ? COLORS.terminalReady : COLORS.terminal;
      const spin = this.time * (ready && !spent ? 1.6 : 0.4);
      const r = T * 0.3;

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(sx, sy);

      ctx.fillStyle = rgba(color, 0.14 * alpha);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.9, 0, TAU);
      ctx.fill();

      // Two counter-rotating brackets — reads as "machine you can operate".
      for (const dir of [1, -1]) {
        ctx.save();
        ctx.rotate(spin * dir);
        ctx.strokeStyle = rgba(color, 0.8 * alpha);
        ctx.lineWidth = Math.max(1.2, T * 0.06);
        ctx.beginPath();
        ctx.arc(0, 0, r, -0.7, 0.7);
        ctx.arc(0, 0, r, Math.PI - 0.7, Math.PI + 0.7);
        ctx.stroke();
        ctx.restore();
      }

      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = rgba(color, 0.95 * alpha);
      const d = r * 0.46;
      ctx.fillRect(-d, -d, d * 2, d * 2);
      ctx.restore();
    }
  }

  /** A soft glow over compartments the player has already opened. */
  _drawSecretHints(ctx) {
    const T = this.tile;
    for (const s of this.maze.secrets) {
      if (!s.found) continue;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = rgba(COLORS.secret, 0.05 + 0.03 * Math.sin(this.time * 2));
      ctx.fillRect(this.originX + s.x * T, this.originY + s.y * T, s.w * T, s.h * T);
      ctx.restore();
    }
  }

  /** Non-rotation shift feedback: gates, bridges, barriers, slides, breaches. */
  _drawTileAnim(ctx, anim, t) {
    const T = this.tile;
    const fade = 1 - t;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    if (anim.kind === 'slide') {
      for (const c of anim.cells) {
        const e = easeInOut(t);
        const x = lerp(c.fx, c.tx, e);
        const y = lerp(c.fy, c.ty, e);
        ctx.fillStyle = rgba(COLORS.wallEdgeHot, 0.75);
        roundRectPath2(ctx, this.originX + x * T + T * 0.08, this.originY + y * T + T * 0.08, T * 0.84, T * 0.84, T * 0.18);
        ctx.fill();
      }
      ctx.restore();
      return;
    }

    const colorFor = {
      gate: COLORS.gate,
      bridge: COLORS.bridge,
      barrier: COLORS.danger,
      reveal: COLORS.secret,
    }[anim.kind] || COLORS.terminal;

    for (const c of anim.cells || []) {
      const sx = this.originX + (c.x + 0.5) * T;
      const sy = this.originY + (c.y + 0.5) * T;
      const r = T * (0.3 + easeOut(t) * 0.6);
      ctx.strokeStyle = rgba(colorFor, 0.8 * fade);
      ctx.lineWidth = Math.max(1.5, T * 0.09 * fade);
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = rgba(colorFor, 0.25 * fade);
      ctx.fillRect(this.originX + c.x * T, this.originY + c.y * T, T, T);
    }
    ctx.restore();
  }

  _drawPlayer(ctx, player, rotations, t) {
    if (!player) return;
    const T = this.tile;
    const p = this._animPos(player.px, player.py, rotations, t);
    const sx = this.originX + (p.x + 0.5) * T;
    const sy = this.originY + (p.y + 0.5) * T;

    const dying = !player.alive;
    const death = dying ? clamp(player.deathTimer / CFG.DEATH_FREEZE, 0, 1) : 0;
    const scale = dying ? Math.max(0, 1 - death) : 1;
    if (scale <= 0.02) return;

    const spawnPop = player.spawnTimer > 0 ? easeOut(clamp(1 - player.spawnTimer / 0.4, 0, 1)) : 1;
    const r = T * CFG.PLAYER_RADIUS * scale * spawnPop;
    const pulse = 0.5 + 0.5 * Math.sin(player.pulse * 9);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    // Phase-in: the siphon strobes while it is intangible, so "why didn't that
    // drone kill me?" is answered on screen rather than in the manual.
    if (player.intangible && !dying) {
      ctx.globalAlpha = 0.35 + 0.4 * (0.5 + 0.5 * Math.sin(this.time * 26));
      ctx.strokeStyle = rgba(COLORS.playerCore, 0.5);
      ctx.lineWidth = Math.max(1, T * 0.05);
      ctx.beginPath();
      ctx.arc(sx, sy, r * (1.6 + 0.5 * Math.sin(this.time * 9)), 0, TAU);
      ctx.stroke();
    }

    if (player.powered) {
      // Charged halo, flashing out as the window closes.
      const warn = player.powerRemaining < CFG.POWER_WARN_TIME;
      const a = warn ? 0.25 + 0.25 * Math.sin(this.time * 22) : 0.3;
      ctx.fillStyle = rgba(COLORS.power, a);
      ctx.beginPath();
      ctx.arc(sx, sy, r * 2.3, 0, TAU);
      ctx.fill();
    }

    ctx.fillStyle = rgba(COLORS.player, 0.22);
    ctx.beginPath();
    ctx.arc(sx, sy, r * 2, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(COLORS.player, 0.95);
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, TAU);
    ctx.fill();

    ctx.fillStyle = rgba(COLORS.playerCore, 0.6 + 0.4 * pulse);
    ctx.beginPath();
    ctx.arc(sx, sy, r * (0.34 + 0.14 * pulse), 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  _drawDrone(ctx, drone, rotations, t, scene) {
    const T = this.tile;
    const p = this._animPos(drone.px, drone.py, rotations, t);
    const sx = this.originX + (p.x + 0.5) * T;
    const sy = this.originY + (p.y + 0.5) * T;

    const state = drone.state;
    const returning = state === DRONE_STATE.RETURNING;
    const recovering = state === DRONE_STATE.RECOVERING;
    const frightened = state === DRONE_STATE.FRIGHTENED;

    let body = drone.color;
    if (frightened) {
      const warn = scene.player && scene.player.powerRemaining < CFG.POWER_WARN_TIME;
      body = warn && Math.floor(this.time * 10) % 2 === 0 ? COLORS.frightenedFlash : COLORS.frightened;
    }

    const bob = Math.sin(drone.bob) * T * 0.05;
    const r = T * CFG.DRONE_RADIUS * (recovering ? 0.7 : 1);
    const alpha = returning ? 0.35 : recovering ? 0.55 : 1;

    ctx.save();
    ctx.translate(sx, sy + bob);

    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = rgba(body, 0.18 * alpha);
    ctx.beginPath();
    ctx.arc(0, 0, r * 2, 0, TAU);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Chassis.
    ctx.fillStyle = returning ? rgba(body, 0.18) : rgba(body, 0.95 * alpha);
    ctx.beginPath();
    roundRectPath(ctx, -r, -r, r * 2, r * 2, r * 0.45);
    ctx.fill();

    if (!returning) {
      ctx.strokeStyle = rgba('#ffffff', 0.28 * alpha);
      ctx.lineWidth = Math.max(1, T * 0.035);
      ctx.stroke();
    }

    // Sensor eye, aimed along the direction of travel.
    const look = drone.angle;
    const ex = Math.sin(look) * r * 0.3;
    const ey = -Math.cos(look) * r * 0.3;
    ctx.fillStyle = rgba(frightened ? '#ffffff' : COLORS.bg, 0.92);
    ctx.beginPath();
    ctx.arc(ex, ey, r * 0.44, 0, TAU);
    ctx.fill();
    ctx.fillStyle = rgba(frightened ? COLORS.frightened : '#ffffff', 0.95);
    ctx.beginPath();
    ctx.arc(ex * 1.5, ey * 1.5, r * 0.2, 0, TAU);
    ctx.fill();

    // Alert ring the moment a drone locks on.
    if (state === DRONE_STATE.CHASE && !frightened) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = rgba(COLORS.danger, 0.35 + 0.25 * Math.sin(this.time * 9));
      ctx.lineWidth = Math.max(1, T * 0.05);
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.5, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawVignette(ctx) {
    const g = ctx.createRadialGradient(
      this.width / 2,
      this.height / 2,
      Math.min(this.width, this.height) * 0.32,
      this.width / 2,
      this.height / 2,
      Math.max(this.width, this.height) * 0.72
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, this.width, this.height);
  }

  _drawToast(ctx) {
    if (!this.toast) return;
    const { text, sub, life, max, tone } = this.toast;
    const t = 1 - life / max;
    const rise = easeOut(clamp(t * 4, 0, 1));
    const fade = life < 0.4 ? life / 0.4 : 1;
    const cx = this.width / 2;
    const cy = this.height * 0.5 - this.tile * 1.2 - rise * this.tile * 0.5;
    const scale = this.dpr;

    ctx.save();
    ctx.globalAlpha = fade;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = `700 ${Math.round(20 * scale)}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = rgba('#000000', 0.55);
    const w = ctx.measureText(text).width + 40 * scale;
    roundRectPath2(ctx, cx - w / 2, cy - 24 * scale, w, sub ? 62 * scale : 44 * scale, 10 * scale);
    ctx.fill();

    ctx.fillStyle = tone;
    ctx.fillText(text, cx, cy - (sub ? 6 : 0) * scale);
    if (sub) {
      ctx.font = `500 ${Math.round(13 * scale)}px "Segoe UI", system-ui, sans-serif`;
      ctx.fillStyle = COLORS.textDim;
      ctx.fillText(sub, cx, cy + 18 * scale);
    }
    ctx.restore();
  }
}

/** roundRectPath that also begins the path — convenience for one-off fills. */
function roundRectPath2(ctx, x, y, w, h, r) {
  ctx.beginPath();
  roundRectPath(ctx, x, y, w, h, r);
}
