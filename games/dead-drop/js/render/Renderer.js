import { TILE, COLORS, DIRECTIONS } from '../utils/constants.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.tileSize = 32;
    this.dpr = window.devicePixelRatio || 1;
  }

  resize(level, containerWidth, containerHeight) {
    this.dpr = window.devicePixelRatio || 1;
    const dim = Math.max(level.width, level.height);
    const available = Math.max(64, Math.floor(Math.min(containerWidth, containerHeight)));
    this.tileSize = Math.max(8, Math.floor(available / dim));
    const boardWidth = this.tileSize * level.width;
    const boardHeight = this.tileSize * level.height;
    this.canvas.style.width = `${boardWidth}px`;
    this.canvas.style.height = `${boardHeight}px`;
    this.canvas.width = Math.round(boardWidth * this.dpr);
    this.canvas.height = Math.round(boardHeight * this.dpr);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  toPx(gx, gy) {
    const t = this.tileSize;
    return [gx * t + t / 2, gy * t + t / 2];
  }

  render(frame) {
    const { level, state, displayPositions, cones, particles, planning, timeMs, doorAnim } = frame;
    const ctx = this.ctx;
    const t = this.tileSize;
    ctx.clearRect(0, 0, level.width * t, level.height * t);

    this.drawTerrain(level, state, doorAnim || {});
    this.drawVisionCones(cones.guardCones, COLORS.orange);
    this.drawVisionCones(cones.cameraCones, COLORS.orange);
    this.drawObjectives(level, state, timeMs);
    this.drawKeycards(level, state);
    this.drawCameraMounts(level, state);
    this.drawGuards(level, state, displayPositions);
    this.drawPlayer(state, displayPositions);
    if (particles) particles.draw(ctx, t);
    if (planning && planning.active) this.drawPlanningOverlay(level, planning);
  }

  drawTerrain(level, state, doorAnim) {
    const ctx = this.ctx;
    const t = this.tileSize;
    for (let y = 0; y < level.height; y++) {
      for (let x = 0; x < level.width; x++) {
        const tile = level.grid[y][x];
        const px = x * t, py = y * t;
        if (tile === TILE.WALL) {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(px, py, t, t);
          ctx.strokeStyle = COLORS.wallEdge;
          ctx.lineWidth = 1;
          ctx.strokeRect(px + 0.5, py + 0.5, t - 1, t - 1);
          continue;
        }
        ctx.fillStyle = (x + y) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
        ctx.fillRect(px, py, t, t);

        if (tile === TILE.DOOR || tile === TILE.LOCKED_DOOR) {
          this.drawDoor(level, state, x, y, tile === TILE.LOCKED_DOOR, doorAnim);
        } else if (tile === TILE.SWITCH) {
          this.drawSwitch(level, state, x, y);
        } else if (tile === TILE.VENT) {
          ctx.strokeStyle = COLORS.textDim;
          ctx.lineWidth = 1;
          for (let i = -1; i <= 1; i++) {
            ctx.beginPath();
            ctx.moveTo(px + t * 0.25, py + t * 0.5 + i * t * 0.15);
            ctx.lineTo(px + t * 0.75, py + t * 0.5 + i * t * 0.15);
            ctx.stroke();
          }
        } else if (tile === TILE.DECORATION) {
          ctx.fillStyle = COLORS.gridLine;
          ctx.beginPath();
          ctx.arc(px + t * 0.5, py + t * 0.5, t * 0.06, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  findDoorState(level, state, x, y) {
    const doorId = level.doorLookup.get(`${x},${y}`);
    return doorId ? state.doors[doorId] : null;
  }

  drawDoor(level, state, x, y, isLockedTile, doorAnim) {
    const ctx = this.ctx;
    const t = this.tileSize;
    const doorId = level.doorLookup.get(`${x},${y}`);
    const door = this.findDoorState(level, state, x, y);
    const open = door ? door.open : false;
    const locked = door ? door.locked : isLockedTile;
    const px = x * t, py = y * t;
    // 0 = fully closed visual, 1 = fully open visual; animated via doorAnim map, else snaps.
    const amount = doorId && doorAnim && doorAnim[doorId] != null ? doorAnim[doorId] : (open ? 1 : 0);

    const closedInset = t * 0.06;
    const openInset = t * 0.08;
    const inset = closedInset + (openInset - closedInset) * amount;
    const size = t * 0.88 - (t * 0.88 - t * 0.84) * amount;

    ctx.fillStyle = lerpColor(locked ? '#4a2a2e' : COLORS.doorClosed, COLORS.doorOpen, amount);
    ctx.fillRect(px + inset, py + inset, size, size);
    ctx.strokeStyle = amount > 0.5 ? COLORS.cyanDim : (locked ? COLORS.red : COLORS.orange);
    ctx.lineWidth = amount > 0.5 ? 1 : 2;
    ctx.strokeRect(px + inset, py + inset, size, size);

    if (locked && amount < 0.5) {
      ctx.fillStyle = COLORS.red;
      ctx.beginPath();
      ctx.arc(px + t * 0.5, py + t * 0.55, t * 0.08, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(px + t * 0.44, py + t * 0.38, t * 0.12, t * 0.16);
    }
  }

  drawSwitch(level, state, x, y) {
    const ctx = this.ctx;
    const t = this.tileSize;
    const sw = level.switches.find((s) => s.pos[0] === x && s.pos[1] === y);
    let on = false;
    if (sw) on = sw.linkedDoorIds.some((id) => state.doors[id]?.open);
    const px = x * t, py = y * t;
    ctx.fillStyle = on ? COLORS.switchOn : COLORS.switchOff;
    ctx.beginPath();
    ctx.arc(px + t * 0.5, py + t * 0.5, t * 0.16, 0, Math.PI * 2);
    ctx.fill();
    if (on) {
      ctx.strokeStyle = COLORS.cyanDim;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px + t * 0.5, py + t * 0.5, t * 0.24, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  drawObjectives(level, state, timeMs) {
    const ctx = this.ctx;
    const t = this.tileSize;
    if (level.package && !state.packageCollected) {
      const [x, y] = level.package.pos;
      const [cx, cy] = this.toPx(x, y);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, t * 0.6);
      glow.addColorStop(0, COLORS.violetDim);
      glow.addColorStop(1, 'rgba(185,139,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x * t, y * t, t, t);
      ctx.fillStyle = COLORS.violet;
      ctx.fillRect(cx - t * 0.18, cy - t * 0.13, t * 0.36, t * 0.26);
      ctx.strokeStyle = '#e6d9ff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(cx - t * 0.18, cy - t * 0.13, t * 0.36, t * 0.26);
      ctx.beginPath();
      ctx.moveTo(cx - t * 0.08, cy - t * 0.13);
      ctx.lineTo(cx - t * 0.08, cy - t * 0.2);
      ctx.lineTo(cx + t * 0.08, cy - t * 0.2);
      ctx.lineTo(cx + t * 0.08, cy - t * 0.13);
      ctx.stroke();
    }
    if (level.extraction) {
      const [x, y] = level.extraction.pos;
      const [cx, cy] = this.toPx(x, y);
      const active = state.exitActive;
      const pulse = 0.5 + 0.5 * Math.sin(timeMs / (active ? 260 : 900));
      const size = t * (0.62 + (active ? pulse * 0.06 : 0));
      ctx.strokeStyle = active ? COLORS.cyan : COLORS.textDim;
      ctx.globalAlpha = active ? 0.55 + pulse * 0.45 : 0.5;
      ctx.lineWidth = active ? 3 : 2;
      ctx.strokeRect(cx - size / 2, cy - size / 2, size, size);
      ctx.globalAlpha = 1;
      if (active) {
        ctx.fillStyle = COLORS.cyanDim;
        ctx.fillRect(cx - size / 2 + 2, cy - size / 2 + 2, size - 4, size - 4);
      }
    }
  }

  drawKeycards(level, state) {
    const ctx = this.ctx;
    const t = this.tileSize;
    for (const kc of level.keycards) {
      if (state.keycardsCollected[kc.id]) continue;
      const [x, y] = kc.pos;
      const [cx, cy] = this.toPx(x, y);
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, t * 0.5);
      glow.addColorStop(0, COLORS.violetDim);
      glow.addColorStop(1, 'rgba(185,139,255,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(x * t, y * t, t, t);

      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = COLORS.violet;
      ctx.strokeStyle = '#e6d9ff';
      ctx.lineWidth = 1.2;
      const w = t * 0.34, h = t * 0.2;
      roundRect(ctx, -w / 2, -h / 2, w, h, t * 0.05);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#1a0f2a';
      ctx.beginPath();
      ctx.arc(-w * 0.22, 0, t * 0.045, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawCameraMounts(level, state) {
    const ctx = this.ctx;
    const t = this.tileSize;
    for (const camera of state.cameras) {
      const [cx, cy] = this.toPx(camera.x, camera.y);
      const camDef = level.cameraDefsById[camera.id];
      const facing = camDef.sequence[camera.sequenceIndex % camDef.sequence.length];
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(facingToRad(facing));
      ctx.fillStyle = COLORS.panelBlueGrayLight;
      ctx.beginPath();
      ctx.moveTo(0, -t * 0.22);
      ctx.lineTo(t * 0.16, t * 0.14);
      ctx.lineTo(-t * 0.16, t * 0.14);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = COLORS.orange;
      ctx.beginPath();
      ctx.arc(0, -t * 0.16, t * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawGuards(level, state, displayPositions) {
    const ctx = this.ctx;
    const t = this.tileSize;
    for (const guard of state.guards) {
      const disp = displayPositions.get(`guard:${guard.id}`) || { x: guard.x, y: guard.y };
      const [cx, cy] = this.toPx(disp.x, disp.y);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(facingToRad(guard.facing));

      ctx.fillStyle = 'rgba(255,154,60,0.25)';
      ctx.beginPath();
      ctx.ellipse(0, t * 0.28, t * 0.22, t * 0.08, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COLORS.orange;
      ctx.beginPath();
      ctx.moveTo(0, -t * 0.26);
      ctx.lineTo(t * 0.2, 0);
      ctx.lineTo(0, t * 0.26);
      ctx.lineTo(-t * 0.2, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#3a2313';
      ctx.beginPath();
      ctx.arc(0, -t * 0.05, t * 0.1, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#fff3e6';
      ctx.beginPath();
      ctx.moveTo(0, -t * 0.26);
      ctx.lineTo(t * 0.07, -t * 0.1);
      ctx.lineTo(-t * 0.07, -t * 0.1);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  }

  drawPlayer(state, displayPositions) {
    const ctx = this.ctx;
    const t = this.tileSize;
    const disp = displayPositions.get('player') || { x: state.player.x, y: state.player.y };
    const [cx, cy] = this.toPx(disp.x, disp.y);

    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, t * 0.55);
    glow.addColorStop(0, COLORS.cyanDim);
    glow.addColorStop(1, 'rgba(63,224,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(cx - t * 0.55, cy - t * 0.55, t * 1.1, t * 1.1);

    ctx.fillStyle = COLORS.cyan;
    ctx.beginPath();
    ctx.arc(cx, cy, t * 0.22, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(facingToRad(state.player.facing));
    ctx.fillStyle = '#04252b';
    ctx.beginPath();
    ctx.moveTo(0, -t * 0.3);
    ctx.lineTo(t * 0.09, -t * 0.14);
    ctx.lineTo(-t * 0.09, -t * 0.14);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawVisionCones(coneMap, color) {
    if (!coneMap) return;
    const ctx = this.ctx;
    const t = this.tileSize;
    for (const cone of coneMap.values()) {
      for (const key of cone) {
        const [x, y] = key.split(',').map(Number);
        const [cx, cy] = this.toPx(x, y);
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, t * 0.62);
        grad.addColorStop(0, hexToRgba(color, 0.34));
        grad.addColorStop(1, hexToRgba(color, 0.05));
        ctx.fillStyle = grad;
        ctx.fillRect(x * t, y * t, t, t);
      }
    }
  }

  drawPlanningOverlay(level, planning) {
    const ctx = this.ctx;
    const t = this.tileSize;
    const { pathTiles, dangerTile } = planning;

    ctx.save();
    ctx.strokeStyle = COLORS.cyan;
    ctx.fillStyle = COLORS.cyan;
    ctx.lineWidth = Math.max(2, t * 0.06);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    for (let i = 0; i < pathTiles.length - 1; i++) {
      const [ax, ay] = this.toPx(pathTiles[i].x, pathTiles[i].y);
      const [bx, by] = this.toPx(pathTiles[i + 1].x, pathTiles[i + 1].y);
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      drawArrowHead(ctx, ax, ay, bx, by, t * 0.14);
    }

    for (const g of planning.ghostGuards || []) {
      const [gx, gy] = this.toPx(g.x, g.y);
      ctx.globalAlpha = 0.45;
      ctx.fillStyle = COLORS.orange;
      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(facingToRad(g.facing));
      ctx.beginPath();
      ctx.moveTo(0, -t * 0.22);
      ctx.lineTo(t * 0.17, 0);
      ctx.lineTo(0, t * 0.22);
      ctx.lineTo(-t * 0.17, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (planning.ghostCones) {
      ctx.globalAlpha = 1;
      for (const cone of planning.ghostCones) {
        for (const key of cone) {
          const [x, y] = key.split(',').map(Number);
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = COLORS.orange;
          ctx.fillRect(x * t, y * t, t, t);
        }
      }
    }

    if (dangerTile) {
      ctx.globalAlpha = 0.5 + 0.3 * Math.sin(Date.now() / 120);
      ctx.fillStyle = COLORS.red;
      ctx.fillRect(dangerTile.x * t, dangerTile.y * t, t, t);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = COLORS.red;
      ctx.lineWidth = 2;
      ctx.strokeRect(dangerTile.x * t + 1, dangerTile.y * t + 1, t - 2, t - 2);
    }

    ctx.restore();
  }
}

function drawArrowHead(ctx, ax, ay, bx, by, size) {
  const angle = Math.atan2(by - ay, bx - ax);
  ctx.save();
  ctx.translate(bx, by);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-size, -size * 0.6);
  ctx.lineTo(-size, size * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function facingToRad(facing) {
  const angles = { N: 0, E: Math.PI / 2, S: Math.PI, W: -Math.PI / 2 };
  return angles[facing] ?? 0;
}

function lerpColor(hexA, hexB, t) {
  const a = hexToRgbTuple(hexA);
  const b = hexToRgbTuple(hexB);
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function hexToRgbTuple(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.substring(0, 2), 16), parseInt(h.substring(2, 4), 16), parseInt(h.substring(4, 6), 16)];
}

function hexToRgba(hex, alpha) {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
