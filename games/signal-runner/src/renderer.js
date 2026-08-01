/**
 * renderer.js — Canvas drawing. Reads game state, never writes to it.
 *
 * Performance strategy:
 *   - The board (grid, lane beds, walls, safe zones) is drawn once into an
 *     offscreen canvas and blitted each frame. It only changes on resize or
 *     level change, so it has no business being redrawn 60 times a second.
 *   - Gradients are built on resize and cached, not per object per frame.
 *   - shadowBlur is reserved for the player, uplinks and fragments — a
 *     bounded handful of objects. Applying it to every packet is the single
 *     easiest way to drop a phone to 30fps.
 *
 * Readability rule: polarity is never communicated by hue alone. Cyan objects
 * carry a circular mark, violet objects carry a diamond, and hostile traffic
 * keeps its own silhouette regardless of colour.
 */

import { CONFIG, PALETTE, polarityColor, polarityDimColor, POLARITY } from './config.js';
import { clamp, hash01, mod } from './utils.js';
import { ParticleKind } from './particles.js';

const INSET = CONFIG.grid.objectInset;

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  if (ctx.roundRect) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    return;
  }
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.board = document.createElement('canvas');
    this.boardCtx = this.board.getContext('2d');

    this.width = 0;
    this.height = 0;
    this.cell = 20;
    this.originX = 0;
    this.originY = 0;
    this.dpr = 1;
    this.boardDirty = true;
    this.levelKey = null;
    this.reducedEffects = false;
  }

  /**
   * Size the backing store for the device pixel ratio, capped so a 3x phone
   * does not quietly ask for nine times the fill rate.
   */
  resize(cssWidth, cssHeight, level) {
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.ui.maxPixelRatio);
    const w = Math.max(1, Math.floor(cssWidth));
    const h = Math.max(1, Math.floor(cssHeight));
    this.dpr = dpr;
    this.width = w;
    this.height = h;
    this.canvas.width = Math.floor(w * dpr);
    this.canvas.height = Math.floor(h * dpr);
    this.canvas.style.width = `${w}px`;
    this.canvas.style.height = `${h}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.board.width = this.canvas.width;
    this.board.height = this.canvas.height;
    this.boardCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.computeLayout(level);
    this.boardDirty = true;
  }

  computeLayout(level) {
    const cols = level ? level.cols : CONFIG.grid.cols;
    const rows = level ? level.rows : CONFIG.grid.rows;
    const padding = Math.max(4, Math.min(this.width, this.height) * 0.015);
    const usableW = this.width - padding * 2;
    const usableH = this.height - padding * 2;

    // A collapsed or not-yet-laid-out stage would otherwise produce a negative
    // cell size, which Canvas rejects outright (negative arc radii throw).
    const fitW = Math.max(1, Math.floor(usableW / cols));
    const fitH = Math.max(1, Math.floor(usableH / rows));

    // Phones are much taller than a 9x13 board, so fitting square cells to the
    // width leaves a lot of dead space. Rows are allowed to stretch a little to
    // reclaim it — capped well short of anything that would read as distorted,
    // because lane heights are a readability cue.
    this.cellW = Math.min(fitW, fitH * CONFIG.ui.maxCellAspect);
    this.cellH = Math.max(this.cellW, Math.min(fitH, this.cellW * CONFIG.ui.maxCellAspect));
    // Decorative radii, strokes and marks are sized from the smaller dimension
    // so nothing overflows its cell when rows are stretched.
    this.cell = Math.min(this.cellW, this.cellH);

    this.boardW = this.cellW * cols;
    this.boardH = this.cellH * rows;
    this.originX = Math.round((this.width - this.boardW) / 2);
    this.originY = Math.round((this.height - this.boardH) / 2);
  }

  markDirty() {
    this.boardDirty = true;
  }

  px(col) {
    return this.originX + col * this.cellW;
  }

  py(row) {
    return this.originY + row * this.cellH;
  }

  /** Centre of a cell, in pixels. */
  cxOf(col) {
    return this.originX + (col + 0.5) * this.cellW;
  }

  cyOf(row) {
    return this.originY + (row + 0.5) * this.cellH;
  }

  /** Screen coordinates (client space) to a board cell, or null if outside. */
  screenToCell(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left - this.originX;
    const y = clientY - rect.top - this.originY;
    const col = Math.floor(x / this.cellW);
    const row = Math.floor(y / this.cellH);
    return { col, row };
  }

  // --- Static board layer -------------------------------------------------

  drawBoard(level) {
    const ctx = this.boardCtx;
    const { cell } = this;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    // Backdrop
    const bg = ctx.createLinearGradient(0, 0, 0, this.height);
    const tint = level ? level.backgroundVariant : 0;
    bg.addColorStop(0, ['#060a14', '#070c18', '#0a0718', '#060d16', '#0d0712', '#0a0a1c'][tint % 6]);
    bg.addColorStop(1, PALETTE.background);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, this.width, this.height);

    if (!level) return;

    // Board bed
    ctx.fillStyle = PALETTE.panelDeep;
    ctx.fillRect(this.originX, this.originY, this.boardW, this.boardH);

    for (let row = 0; row < level.rows; row++) {
      this.drawLaneBed(ctx, level, level.laneByRow[row], row);
    }

    // Column grid lines sit above the beds so lane edges stay legible.
    ctx.strokeStyle = PALETTE.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let col = 1; col < level.cols; col++) {
      const x = Math.round(this.px(col)) + 0.5;
      ctx.moveTo(x, this.originY);
      ctx.lineTo(x, this.originY + this.boardH);
    }
    ctx.stroke();

    ctx.strokeStyle = PALETTE.gridStrong;
    ctx.beginPath();
    for (let row = 0; row <= level.rows; row++) {
      const y = Math.round(this.py(row)) + 0.5;
      ctx.moveTo(this.originX, y);
      ctx.lineTo(this.originX + this.boardW, y);
    }
    ctx.stroke();

    // Walls
    for (const wall of level.walls) {
      const x = this.px(wall.col);
      const y = this.py(wall.row);
      const ww = this.cellW;
      const wh = this.cellH;
      ctx.fillStyle = '#161d30';
      roundRect(ctx, x + ww * 0.06, y + wh * 0.06, ww * 0.88, wh * 0.88, cell * 0.14);
      ctx.fill();
      ctx.strokeStyle = 'rgba(140,170,210,0.22)';
      ctx.lineWidth = Math.max(1, cell * 0.035);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(140,170,210,0.14)';
      ctx.beginPath();
      for (let i = 1; i < 4; i++) {
        const yy = y + (wh * i) / 4;
        ctx.moveTo(x + ww * 0.16, yy);
        ctx.lineTo(x + ww * 0.84, yy);
      }
      ctx.stroke();
    }

    // Outer frame
    ctx.strokeStyle = 'rgba(90, 130, 190, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(this.originX - 1, this.originY - 1, this.boardW + 2, this.boardH + 2);
  }

  drawLaneBed(ctx, level, lane, row) {
    const { cell, cellW } = this;
    const cellH = this.cellH;
    const x0 = this.originX;
    const y0 = this.py(row);
    const w = this.boardW;

    const from = (lane.from ?? 0) * cellW + x0;
    const to = (lane.to ?? level.cols) * cellW + x0;
    const spanW = to - from;

    switch (lane.type) {
      case 'terminal':
        ctx.fillStyle = '#0c1526';
        ctx.fillRect(x0, y0, w, cellH);
        break;

      case 'safe':
        ctx.fillStyle = PALETTE.safe;
        ctx.fillRect(x0, y0, w, cellH);
        // Calm dotted texture so safe rows read as "rest here" at a glance.
        ctx.fillStyle = 'rgba(120, 170, 220, 0.08)';
        for (let c = 0; c < level.cols; c++) {
          ctx.beginPath();
          ctx.arc(this.cxOf(c), y0 + cellH / 2, cell * 0.05, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case 'platform':
      case 'relay': {
        ctx.fillStyle = '#04060c';
        ctx.fillRect(x0, y0, w, cellH);
        // Solid shoulders either side of a partial-width void.
        if (spanW < w) {
          ctx.fillStyle = PALETTE.safe;
          ctx.fillRect(x0, y0, from - x0, cellH);
          ctx.fillRect(to, y0, x0 + w - to, cellH);
        }
        ctx.strokeStyle = 'rgba(70, 120, 180, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([cell * 0.12, cell * 0.12]);
        ctx.beginPath();
        ctx.moveTo(from, y0 + cellH * 0.5);
        ctx.lineTo(to, y0 + cellH * 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
      }

      case 'packet':
      case 'pulse': {
        ctx.fillStyle = '#0a0f1c';
        ctx.fillRect(x0, y0, w, cellH);
        // Direction is legible from the bed alone, before any traffic arrives.
        ctx.strokeStyle = 'rgba(120, 160, 210, 0.13)';
        ctx.lineWidth = Math.max(1, cell * 0.03);
        ctx.beginPath();
        const dir = lane.direction ?? 1;
        for (let i = 0; i < level.cols * 2; i++) {
          const cx = x0 + (i + 0.5) * (cellW / 2);
          if (cx < from || cx > to) continue;
          ctx.moveTo(cx - dir * cell * 0.08, y0 + cellH * 0.3);
          ctx.lineTo(cx + dir * cell * 0.08, y0 + cellH * 0.5);
          ctx.lineTo(cx - dir * cell * 0.08, y0 + cellH * 0.7);
        }
        ctx.stroke();
        break;
      }

      case 'scanner': {
        ctx.fillStyle = '#0b1020';
        ctx.fillRect(x0, y0, w, cellH);
        ctx.strokeStyle = 'rgba(120, 200, 230, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i <= 6; i++) {
          const yy = Math.round(y0 + (cellH * i) / 6) + 0.5;
          ctx.moveTo(from, yy);
          ctx.lineTo(to, yy);
        }
        ctx.stroke();
        break;
      }

      case 'corruption': {
        ctx.fillStyle = '#140811';
        ctx.fillRect(x0, y0, w, cellH);
        ctx.strokeStyle = 'rgba(255, 60, 110, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < level.cols * 3; i++) {
          const cx = from + (i * spanW) / (level.cols * 3);
          const jitter = hash01(row * 31 + i) * cellH * 0.3;
          ctx.moveTo(cx, y0 + jitter);
          ctx.lineTo(cx + cell * 0.12, y0 + cellH - jitter);
        }
        ctx.stroke();
        break;
      }

      case 'gate': {
        ctx.fillStyle = '#0d1424';
        ctx.fillRect(x0, y0, w, cellH);
        ctx.strokeStyle = 'rgba(150, 180, 220, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, cellH - 1);
        break;
      }

      default:
        break;
    }
  }

  // --- Frame --------------------------------------------------------------

  render(game, alphaTime) {
    const ctx = this.ctx;
    const level = game.level;

    const key = level ? `${level.id}:${this.cellW}x${this.cellH}:${this.width}x${this.height}` : `menu:${this.width}`;
    if (this.boardDirty || key !== this.levelKey) {
      this.computeLayout(level);
      this.drawBoard(level);
      this.levelKey = `${level ? level.id : 'menu'}:${this.cellW}x${this.cellH}:${this.width}x${this.height}`;
      this.boardDirty = false;
    }

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    let shakeX = 0;
    let shakeY = 0;
    if (game.shake > 0 && !this.reducedEffects) {
      const amp = game.shake * this.cell * 0.22;
      shakeX = (hash01(alphaTime * 971) - 0.5) * amp;
      shakeY = (hash01(alphaTime * 331 + 7) - 0.5) * amp;
      ctx.translate(shakeX, shakeY);
    }

    ctx.drawImage(this.board, 0, 0, this.width, this.height);

    if (!level) {
      ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      return;
    }

    // Everything in the world is clipped to the board, so traffic entering and
    // leaving a lane slides cleanly past the edge instead of spilling onto the
    // surrounding chrome.
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.originX, this.originY, this.boardW, this.boardH);
    ctx.clip();

    this.drawLaneAnimation(level, game.worldTime);
    this.drawMoveHints(game);
    this.drawShapes(level, game);
    this.drawCollectibles(level, game);
    this.drawUplinks(level, game);
    this.drawParticles(game.particles);
    this.drawPlayer(game);
    this.drawEdgeTint(game);

    ctx.restore();

    if (game.state === 'STARTING') this.drawCountdown(game);

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    if (game.flash > 0) {
      ctx.fillStyle = `rgba(255, 90, 77, ${game.flash * 0.28})`;
      ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  /** Cheap scrolling rails for void lanes — two strokes per lane, no more. */
  drawLaneAnimation(level, time) {
    if (this.reducedEffects) return;
    const ctx = this.ctx;
    const { cell } = this;
    ctx.save();
    ctx.lineWidth = Math.max(1, cell * 0.03);
    for (const lane of level.lanes) {
      if (!lane.isVoid) continue;
      const y = this.py(lane.row) + this.cellH * 0.5;
      const from = this.px(lane.from ?? 0);
      const to = this.px(lane.to ?? level.cols);
      const speed = (lane.direction ?? 1) * (lane.speed ?? 0) * this.cellW;
      const dash = cell * 0.3;
      ctx.strokeStyle = 'rgba(90, 150, 210, 0.2)';
      ctx.setLineDash([dash, dash]);
      ctx.lineDashOffset = -mod(time * speed, dash * 2);
      ctx.beginPath();
      ctx.moveTo(from, y);
      ctx.lineTo(to, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawMoveHints(game) {
    if (!game.player || game.activeTutorial || this.reducedEffects) return;
    const hints = game.getMoveHints?.() || [];
    if (!hints.length) return;
    const ctx = this.ctx;
    const pulse = 0.65 + Math.sin(game.worldTime * 5) * 0.12;
    ctx.save();
    for (const hint of hints) {
      if (hint.col < 0 || hint.col >= game.level.cols || hint.row < 0 || hint.row >= game.level.rows) continue;
      const cx = this.cxOf(hint.col);
      const cy = this.cyOf(hint.row);
      const radius = this.cell * (hint.ok ? 0.18 : 0.13);
      const colour = hint.uplink ? PALETTE.white : hint.risky ? PALETTE.warning : hint.ok ? polarityColor(game.player.polarity) : 'rgba(255, 90, 77, 0.75)';

      ctx.globalAlpha = hint.ok ? pulse : 0.38;
      ctx.strokeStyle = colour;
      ctx.lineWidth = Math.max(1.5, this.cell * 0.04);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      if (!hint.ok) {
        ctx.beginPath();
        ctx.moveTo(cx - radius * 0.55, cy - radius * 0.55);
        ctx.lineTo(cx + radius * 0.55, cy + radius * 0.55);
        ctx.moveTo(cx + radius * 0.55, cy - radius * 0.55);
        ctx.lineTo(cx - radius * 0.55, cy + radius * 0.55);
        ctx.stroke();
      } else if (hint.uplink) {
        ctx.globalAlpha = 0.26 + pulse * 0.22;
        ctx.fillStyle = colour;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.55, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  drawShapes(level, game) {
    const ctx = this.ctx;
    for (const lane of level.lanes) {
      for (let i = 0; i < lane.shapes.length; i++) {
        const s = lane.shapes[i];
        const x = this.px(s.x);
        const y = this.py(lane.row) + this.cellH * INSET;
        const w = s.w * this.cellW;
        const h = this.cellH * (1 - INSET * 2);
        // Skip anything scrolled fully outside the board.
        if (x + w < this.originX - this.cellW || x > this.originX + this.boardW + this.cellW) continue;

        switch (s.kind) {
          case 'packet': this.drawPacket(ctx, s, x, y, w, h); break;
          case 'pulse': this.drawPulse(ctx, s, x, y, w, h); break;
          case 'corruption': this.drawCorruption(ctx, s, x, y, w, h, game.worldTime); break;
          case 'trail': this.drawTrail(ctx, s, x, y, w, h, game.worldTime); break;
          case 'platform': this.drawPlatform(ctx, s, x, y, w, h); break;
          case 'relay': this.drawRelay(ctx, s, x, y, w, h); break;
          case 'scanner': this.drawScanner(ctx, s, x, y, w, h); break;
          case 'scannerWarn': this.drawScannerWarn(ctx, s, x, y, w, h); break;
          case 'scannerIdle': this.drawScannerIdle(ctx, s, x, y, w, h); break;
          case 'gate': this.drawGate(ctx, s, x, y, w, h); break;
          default: break;
        }
      }
    }
  }

  drawPacket(ctx, s, x, y, w, h) {
    const r = this.cell * 0.16;
    const polar = s.polarity;
    const main = polar ? polarityColor(polar) : PALETTE.hostile;
    const dim = polar ? polarityDimColor(polar) : '#8a2318';

    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, main);
    grad.addColorStop(1, dim);
    ctx.fillStyle = grad;
    roundRect(ctx, x, y, w, h, r);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.28)';
    ctx.lineWidth = Math.max(1, this.cell * 0.03);
    ctx.stroke();

    // Leading marker: shows travel direction without an animation.
    const dir = s.direction >= 0 ? 1 : -1;
    const noseX = dir > 0 ? x + w - this.cell * 0.16 : x + this.cell * 0.16;
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.beginPath();
    ctx.moveTo(noseX, y + h * 0.22);
    ctx.lineTo(noseX + dir * this.cell * 0.1, y + h * 0.5);
    ctx.lineTo(noseX, y + h * 0.78);
    ctx.closePath();
    ctx.fill();

    if (polar) this.drawPolarityMark(ctx, polar, x + w * 0.5 - dir * this.cell * 0.18, y + h * 0.5, this.cell * 0.13);
  }

  drawPulse(ctx, s, x, y, w, h) {
    const active = s.state === 'active';
    const colour = s.polarity ? polarityColor(s.polarity) : PALETTE.warning;
    ctx.globalAlpha = active ? 1 : 0.25 + s.intensity * 0.35;
    const r = this.cell * 0.3;
    if (active) {
      ctx.fillStyle = colour;
      roundRect(ctx, x, y, w, h, r);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      roundRect(ctx, x + w * 0.2, y + h * 0.35, w * 0.6, h * 0.3, r * 0.5);
      ctx.fill();
    } else {
      ctx.strokeStyle = colour;
      ctx.lineWidth = Math.max(1, this.cell * 0.05);
      roundRect(ctx, x, y, w, h, r);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawCorruption(ctx, s, x, y, w, h, time) {
    ctx.fillStyle = PALETTE.corruption;
    const steps = Math.max(3, Math.round(s.w * 4));
    ctx.beginPath();
    // Jagged, unstable silhouette — nothing else on the board looks like this.
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const jitter = (hash01(s.index * 17 + i + Math.floor(time * 12)) - 0.5) * h * 0.35;
      const px = x + t * w;
      if (i === 0) ctx.moveTo(px, y + h * 0.5 + jitter);
      else ctx.lineTo(px, y + (i % 2 ? 0 : h) + jitter * 0.5);
    }
    for (let i = steps; i >= 0; i--) {
      const t = i / steps;
      const jitter = (hash01(s.index * 29 + i + Math.floor(time * 12)) - 0.5) * h * 0.35;
      ctx.lineTo(x + t * w, y + (i % 2 ? h : 0) + jitter * 0.5);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 200, 220, 0.6)';
    ctx.lineWidth = Math.max(1, this.cell * 0.025);
    ctx.stroke();
  }

  drawTrail(ctx, s, x, y, w, h, time) {
    if (w <= 0) return;
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = 'rgba(255, 47, 109, 0.55)';
    ctx.fillRect(x, y + h * 0.18, w, h * 0.64);
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = 'rgba(255, 120, 160, 0.5)';
    ctx.lineWidth = Math.max(1, this.cell * 0.02);
    ctx.beginPath();
    const n = Math.max(2, Math.round(w / (this.cell * 0.25)));
    for (let i = 0; i < n; i++) {
      const px = x + (i / n) * w;
      const j = (hash01(i + Math.floor(time * 10) + s.index) - 0.5) * h * 0.4;
      ctx.moveTo(px, y + h * 0.5 + j);
      ctx.lineTo(px + this.cell * 0.14, y + h * 0.5 - j);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  drawPlatform(ctx, s, x, y, w, h) {
    const colour = s.polarity ? polarityColor(s.polarity) : '#6fd7ff';
    const dim = s.polarity ? polarityDimColor(s.polarity) : '#1d4a63';
    const r = this.cell * 0.14;
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, dim);
    grad.addColorStop(0.5, '#0e1a2c');
    grad.addColorStop(1, dim);
    ctx.fillStyle = grad;
    roundRect(ctx, x, y + h * 0.16, w, h * 0.68, r);
    ctx.fill();

    // Bright top edge doubles as the "this is the surface" affordance.
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(1.5, this.cell * 0.055);
    ctx.beginPath();
    ctx.moveTo(x + r, y + h * 0.16);
    ctx.lineTo(x + w - r, y + h * 0.16);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.16)';
    ctx.lineWidth = Math.max(1, this.cell * 0.02);
    ctx.beginPath();
    for (let i = 1; i < s.w * 2; i++) {
      const px = x + (i * w) / (s.w * 2);
      ctx.moveTo(px, y + h * 0.3);
      ctx.lineTo(px - this.cell * 0.08, y + h * 0.7);
    }
    ctx.stroke();

    if (s.polarity) this.drawPolarityMark(ctx, s.polarity, x + w / 2, y + h * 0.52, this.cell * 0.13);
  }

  drawRelay(ctx, s, x, y, w, h) {
    this.drawPlatform(ctx, s, x, y, w, h);
    if (s.state === 'charging') {
      // Flash before the frequency flips so a switch is always possible.
      const blink = Math.sin(s.intensity * Math.PI * 18) > 0 ? 0.55 : 0.15;
      ctx.globalAlpha = blink;
      ctx.strokeStyle = PALETTE.white;
      ctx.lineWidth = Math.max(1.5, this.cell * 0.05);
      roundRect(ctx, x, y + h * 0.16, w, h * 0.68, this.cell * 0.14);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  drawScanner(ctx, s, x, y, w, h) {
    const colour = s.polarity ? polarityColor(s.polarity) : PALETTE.hostile;
    ctx.globalAlpha = 0.28 + s.intensity * 0.2;
    ctx.fillStyle = colour;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1;

    ctx.fillStyle = colour;
    ctx.fillRect(x, y + h * 0.42, w, h * 0.16);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(x, y + h * 0.47, w, h * 0.06);

    ctx.globalAlpha = 0.35;
    ctx.strokeStyle = colour;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const yy = y + (h * i) / 5;
      ctx.moveTo(x, yy);
      ctx.lineTo(x + w, yy);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    if (s.polarity) this.drawPolarityMark(ctx, s.polarity, x + w / 2, y + h * 0.5, this.cell * 0.14, '#08111c');
  }

  /**
   * A dormant emitter still gets a faint outline. Without it a segment
   * scanner's off phase looks like empty floor, and the player has no way to
   * learn the checkerboard rhythm before standing in it.
   */
  drawScannerIdle(ctx, s, x, y, w, h) {
    if (w <= 0) return;
    const colour = s.polarity ? polarityColor(s.polarity) : PALETTE.warning;
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(1, this.cell * 0.02);
    ctx.setLineDash([this.cell * 0.1, this.cell * 0.12]);
    ctx.strokeRect(x + 1, y + h * 0.36, Math.max(0, w - 2), h * 0.28);
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawScannerWarn(ctx, s, x, y, w, h) {
    if (w <= 0) return;
    const colour = s.polarity ? polarityColor(s.polarity) : PALETTE.warning;
    ctx.globalAlpha = 0.14 + s.intensity * 0.3;
    ctx.fillStyle = colour;
    ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(1, this.cell * 0.025);
    ctx.setLineDash([this.cell * 0.14, this.cell * 0.14]);
    ctx.strokeRect(x + 1, y + 1, Math.max(0, w - 2), h - 2);
    ctx.setLineDash([]);

    // Charge bar: an unambiguous, sound-independent countdown to the beam.
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = colour;
    ctx.fillRect(x, y + h - this.cell * 0.06, w * clamp(s.intensity, 0, 1), this.cell * 0.06);
    ctx.globalAlpha = 1;
  }

  drawGate(ctx, s, x, y, w, h) {
    const { cell } = this;
    const open = s.blocksFor === 'none';
    const colour = s.polarity ? polarityColor(s.polarity) : (open ? '#4d6b8f' : PALETTE.warning);

    // Frame is always drawn so the cell reads as a doorway either way.
    ctx.strokeStyle = 'rgba(160, 190, 230, 0.4)';
    ctx.lineWidth = Math.max(1, cell * 0.03);
    ctx.strokeRect(x + cell * 0.06, y, w - cell * 0.12, h);

    if (open) {
      ctx.globalAlpha = s.state === 'closing' ? 0.85 : 0.4;
      ctx.strokeStyle = s.state === 'closing' ? PALETTE.warning : '#4d6b8f';
      ctx.lineWidth = Math.max(1.5, cell * 0.05);
      ctx.beginPath();
      ctx.moveTo(x + cell * 0.1, y);
      ctx.lineTo(x + cell * 0.1, y + h * 0.2);
      ctx.moveTo(x + w - cell * 0.1, y);
      ctx.lineTo(x + w - cell * 0.1, y + h * 0.2);
      ctx.moveTo(x + cell * 0.1, y + h);
      ctx.lineTo(x + cell * 0.1, y + h * 0.8);
      ctx.moveTo(x + w - cell * 0.1, y + h);
      ctx.lineTo(x + w - cell * 0.1, y + h * 0.8);
      ctx.stroke();
      ctx.globalAlpha = 1;
      return;
    }

    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, colour);
    grad.addColorStop(0.5, s.polarity ? polarityDimColor(s.polarity) : '#7a4410');
    grad.addColorStop(1, colour);
    ctx.fillStyle = grad;
    // Interlocking teeth read as "sealed" much faster than a flat block.
    const teeth = 4;
    for (let i = 0; i < teeth; i++) {
      const th = h / teeth;
      const inset = i % 2 === 0 ? cell * 0.06 : cell * 0.16;
      roundRect(ctx, x + inset, y + i * th + th * 0.08, w - inset * 2, th * 0.84, cell * 0.05);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = Math.max(1, cell * 0.025);
    ctx.strokeRect(x + cell * 0.06, y, w - cell * 0.12, h);

    if (s.polarity) {
      this.drawPolarityMark(ctx, s.polarity, x + w / 2, y + h / 2, cell * 0.15, '#0a1220');
    } else {
      this.drawLockMark(ctx, x + w / 2, y + h / 2, cell * 0.15);
    }

    if (s.state === 'switching') {
      ctx.globalAlpha = Math.sin(s.intensity * Math.PI * 20) > 0 ? 0.7 : 0.2;
      ctx.strokeStyle = PALETTE.white;
      ctx.lineWidth = Math.max(1.5, cell * 0.05);
      ctx.strokeRect(x + cell * 0.06, y, w - cell * 0.12, h);
      ctx.globalAlpha = 1;
    }
  }

  /**
   * Polarity marks: a ring for cyan, a diamond for violet. Shape carries the
   * meaning so the game stays readable without colour vision.
   */
  drawPolarityMark(ctx, polarity, cx, cy, r, colour) {
    ctx.strokeStyle = colour ?? 'rgba(8, 14, 24, 0.85)';
    ctx.fillStyle = colour ?? 'rgba(8, 14, 24, 0.85)';
    ctx.lineWidth = Math.max(1.5, r * 0.42);
    if (polarity === POLARITY.CYAN) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(cx, cy - r);
      ctx.lineTo(cx + r, cy);
      ctx.lineTo(cx, cy + r);
      ctx.lineTo(cx - r, cy);
      ctx.closePath();
      ctx.stroke();
    }
  }

  drawLockMark(ctx, cx, cy, r) {
    ctx.strokeStyle = 'rgba(10, 16, 28, 0.9)';
    ctx.lineWidth = Math.max(1.5, r * 0.4);
    ctx.beginPath();
    ctx.arc(cx, cy - r * 0.25, r * 0.55, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = 'rgba(10, 16, 28, 0.9)';
    ctx.fillRect(cx - r * 0.7, cy - r * 0.25, r * 1.4, r * 1.1);
  }

  drawCollectibles(level, game) {
    const ctx = this.ctx;
    const { cell } = this;
    const t = game.worldTime;
    for (const frag of level.collectibles) {
      if (game.collected.has(frag.id)) continue;
      const cx = this.cxOf(frag.col);
      const cy = this.cyOf(frag.row);
      const spin = t * 2.2 + frag.id;
      const r = cell * (0.19 + Math.sin(t * 3 + frag.id) * 0.02);

      if (!this.reducedEffects) {
        ctx.shadowColor = PALETTE.white;
        ctx.shadowBlur = cell * 0.35;
      }
      ctx.fillStyle = PALETTE.white;
      ctx.beginPath();
      // Four-point shard — a silhouette used by nothing hostile.
      for (let i = 0; i < 8; i++) {
        const angle = spin + (i * Math.PI) / 4;
        const rad = i % 2 === 0 ? r : r * 0.36;
        const px = cx + Math.cos(angle) * rad;
        const py = cy + Math.sin(angle) * rad;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  drawUplinks(level, game) {
    const ctx = this.ctx;
    const { cell } = this;
    for (const uplink of level.uplinks) {
      const cx = this.cxOf(uplink.col);
      const cy = this.cyOf(uplink.row);
      const active = game.uplinkStates[uplink.slot];
      const r = cell * 0.36;
      const pulse = active ? 1 : 0.6 + Math.sin(game.worldTime * 3.4 + uplink.slot) * 0.18;

      ctx.save();
      if (!this.reducedEffects) {
        ctx.shadowColor = active ? PALETTE.cyan : PALETTE.white;
        ctx.shadowBlur = cell * (active ? 0.6 : 0.3) * pulse;
      }

      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();

      if (active) {
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, PALETTE.white);
        grad.addColorStop(1, PALETTE.cyan);
        ctx.fillStyle = grad;
        ctx.fill();
      } else {
        ctx.fillStyle = 'rgba(10, 20, 36, 0.9)';
        ctx.fill();
      }
      ctx.strokeStyle = active ? PALETTE.white : `rgba(242, 247, 255, ${pulse})`;
      ctx.lineWidth = Math.max(1.5, cell * 0.06);
      ctx.stroke();
      ctx.shadowBlur = 0;

      if (active) {
        ctx.strokeStyle = 'rgba(8, 16, 28, 0.85)';
        ctx.lineWidth = Math.max(2, cell * 0.08);
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.35, cy);
        ctx.lineTo(cx - r * 0.08, cy + r * 0.3);
        ctx.lineTo(cx + r * 0.38, cy - r * 0.3);
        ctx.stroke();
      } else {
        ctx.fillStyle = `rgba(242, 247, 255, ${pulse})`;
        ctx.beginPath();
        ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }

  drawParticles(system) {
    const ctx = this.ctx;
    const { cell } = this;
    for (let i = 0; i < system.count; i++) {
      const p = system.items[i];
      const alpha = clamp(p.life / p.maxLife, 0, 1);
      const cx = this.px(p.x);
      const cy = this.py(p.y);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.strokeStyle = p.color;

      if (p.kind === ParticleKind.RING) {
        const grown = (1 - alpha) * p.vx;
        ctx.lineWidth = Math.max(1, cell * 0.06 * alpha);
        ctx.beginPath();
        ctx.arc(cx, cy, grown * cell, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === ParticleKind.SHARD) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(p.seed + (1 - alpha) * 4);
        ctx.fillRect(-p.size * cell, -p.size * cell * 0.4, p.size * cell * 2, p.size * cell * 0.8);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, p.size * cell * (p.kind === ParticleKind.TRAIL ? alpha : 1), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawPlayer(game) {
    const player = game.player;
    if (!player) return;
    const ctx = this.ctx;
    const { cell } = this;
    const cx = this.px(player.centerX);
    const cy = this.py(player.centerY);
    const colour = polarityColor(player.polarity);

    if (player.state === 'DYING') {
      this.drawDyingPlayer(ctx, player, cx, cy, colour);
      return;
    }

    let scale = 1;
    let alpha = 1;
    if (player.state === 'UPLOADING') {
      const p = player.uploadProgress;
      scale = 1 - p * 0.85;
      alpha = 1 - p * 0.6;
      ctx.globalAlpha = alpha;
    }

    // Polarity switch ring
    if (player.polarityFlash > 0 && !this.reducedEffects) {
      const f = player.polarityFlash;
      ctx.globalAlpha = f * 0.7;
      ctx.strokeStyle = colour;
      ctx.lineWidth = Math.max(1, cell * 0.07 * f);
      ctx.beginPath();
      ctx.arc(cx, cy, cell * (0.4 + (1 - f) * 0.7), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha;
    }

    if (player.graceTimer > 0) {
      // Blink during spawn immunity so the state is visible, not just felt.
      ctx.globalAlpha = alpha * (0.45 + Math.sin(player.pulse * 40) * 0.3);
    }

    const r = cell * CONFIG.player.visualRadius * scale;
    const squash = player.squash;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1 / Math.sqrt(squash), squash);

    if (!this.reducedEffects) {
      ctx.shadowColor = colour;
      ctx.shadowBlur = cell * 0.5;
    }

    // Outer ring
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(1.5, cell * 0.055);
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r, 0);
    ctx.closePath();
    ctx.stroke();

    // Core
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.8);
    grad.addColorStop(0, PALETTE.white);
    grad.addColorStop(0.55, colour);
    grad.addColorStop(1, polarityDimColor(player.polarity));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.66);
    ctx.lineTo(r * 0.66, 0);
    ctx.lineTo(0, r * 0.66);
    ctx.lineTo(-r * 0.66, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;

    // Frequency symbol at the core, so polarity is never colour-only.
    ctx.strokeStyle = '#04070e';
    ctx.lineWidth = Math.max(1.5, cell * 0.045);
    ctx.beginPath();
    if (player.polarity === POLARITY.CYAN) {
      ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2);
    } else {
      ctx.moveTo(-r * 0.3, 0);
      ctx.lineTo(r * 0.3, 0);
    }
    ctx.stroke();

    ctx.restore();

    if (player.blockedFlash > 0) {
      ctx.globalAlpha = player.blockedFlash * 4;
      ctx.strokeStyle = PALETTE.hostile;
      ctx.lineWidth = Math.max(1.5, cell * 0.05);
      ctx.beginPath();
      ctx.arc(cx, cy, cell * 0.46, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
  }

  drawDyingPlayer(ctx, player, cx, cy, colour) {
    const { cell } = this;
    const p = player.deathProgress;
    const r = cell * CONFIG.player.visualRadius;
    ctx.globalAlpha = 1 - p;
    ctx.strokeStyle = colour;
    ctx.lineWidth = Math.max(1, cell * 0.05 * (1 - p));
    // Fragment the diamond outward as the signal collapses.
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const push = p * cell * 0.7;
      ctx.save();
      ctx.translate(cx + Math.cos(a) * push, cy + Math.sin(a) * push);
      ctx.rotate(p * 2.4);
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.5);
      ctx.lineTo(r * 0.5, 0);
      ctx.lineTo(0, r * 0.5);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }

  /** Board-edge tint reinforcing the current frequency. */
  drawEdgeTint(game) {
    if (!game.player || this.reducedEffects) return;
    const ctx = this.ctx;
    const colour = game.player.polarity === POLARITY.CYAN
      ? 'rgba(62, 242, 240, '
      : 'rgba(176, 108, 255, ';
    const strength = 0.14 + (game.player.polarityFlash ?? 0) * 0.2;
    const w = this.cellW * 0.5;
    const left = ctx.createLinearGradient(this.originX, 0, this.originX + w, 0);
    left.addColorStop(0, `${colour}${strength})`);
    left.addColorStop(1, `${colour}0)`);
    ctx.fillStyle = left;
    ctx.fillRect(this.originX, this.originY, w, this.boardH);

    const right = ctx.createLinearGradient(
      this.originX + this.boardW, 0, this.originX + this.boardW - w, 0,
    );
    right.addColorStop(0, `${colour}${strength})`);
    right.addColorStop(1, `${colour}0)`);
    ctx.fillStyle = right;
    ctx.fillRect(this.originX + this.boardW - w, this.originY, w, this.boardH);
  }

  drawCountdown(game) {
    const ctx = this.ctx;
    const remaining = Math.max(0, game.startTimer);
    if (remaining <= 0) return;
    const cx = this.originX + this.boardW / 2;
    const cy = this.originY + this.boardH / 2;
    const r = this.cell * 1.05;
    // The countdown may be shorter than a full start delay (respawns use a
    // brief one), so the ring is measured against whatever this one began at.
    const total = Math.max(game.startTimerTotal || CONFIG.world.startDelay, 0.01);
    const remainingRatio = clamp(remaining / total, 0, 1);

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.strokeStyle = 'rgba(62, 242, 240, 0.18)';
    ctx.lineWidth = Math.max(2, this.cell * 0.08);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = PALETTE.cyan;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + remainingRatio * Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = PALETTE.white;
    ctx.font = `600 ${Math.round(this.cell * 0.62)}px ui-monospace, "SF Mono", Menlo, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(Math.ceil(remaining * 2)), cx, cy + 1);
    ctx.restore();
  }
}
