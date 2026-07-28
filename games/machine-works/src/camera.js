import { TILE_WIDTH, TILE_HEIGHT, ZOOM_MIN, ZOOM_MAX, PAN_FRICTION, PAN_MIN_VELOCITY, PAN_MAX_VELOCITY, CAMERA_EASE } from './constants.js';

// Isometric (2:1 diamond) camera. Position is in tile-space and represents
// the tile currently centered on screen. Handles pan momentum and eased
// zoom/centering so movement never pops.
export class Camera {
  constructor() {
    this.x = 20;
    this.y = 20;
    this.zoom = 1;
    this.targetZoom = 1;
    this.zoomFocal = null; // {sx, sy} screen point to keep fixed while zoom eases in
    this.velocityX = 0; // tile-space units per ms
    this.velocityY = 0;
    this.coasting = false;
    this.centering = false;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  loadState({ x, y, zoom }) {
    this.x = this.targetX = x;
    this.y = this.targetY = y;
    this.zoom = this.targetZoom = zoom;
  }

  serialize() {
    return { x: this.x, y: this.y, zoom: this.zoom };
  }

  tileToScreen(gx, gy, viewW, viewH) {
    const halfW = (TILE_WIDTH / 2) * this.zoom;
    const halfH = (TILE_HEIGHT / 2) * this.zoom;
    const originX = viewW / 2 - (this.x - this.y) * halfW;
    const originY = viewH / 2 - (this.x + this.y) * halfH;
    return {
      x: originX + (gx - gy) * halfW,
      y: originY + (gx + gy) * halfH,
    };
  }

  screenToTile(sx, sy, viewW, viewH) {
    const halfW = (TILE_WIDTH / 2) * this.zoom;
    const halfH = (TILE_HEIGHT / 2) * this.zoom;
    const originX = viewW / 2 - (this.x - this.y) * halfW;
    const originY = viewH / 2 - (this.x + this.y) * halfH;
    const dx = sx - originX;
    const dy = sy - originY;
    const gx = (dx / halfW + dy / halfH) / 2;
    const gy = (dy / halfH - dx / halfW) / 2;
    return { x: gx, y: gy };
  }

  // Pan by a screen-space pixel delta (e.g. from a drag move event).
  panByScreenDelta(dxPx, dyPx) {
    const halfW = (TILE_WIDTH / 2) * this.zoom;
    const halfH = (TILE_HEIGHT / 2) * this.zoom;
    const dGx = (dxPx / halfW + dyPx / halfH) / -2;
    const dGy = (dyPx / halfH - dxPx / halfW) / -2;
    this.x += dGx;
    this.y += dGy;
    this.targetX = this.x;
    this.targetY = this.y;
    this.centering = false;
  }

  setVelocityFromScreenDelta(dxPx, dyPx, dtMs) {
    if (dtMs <= 0) return;
    const halfW = (TILE_WIDTH / 2) * this.zoom;
    const halfH = (TILE_HEIGHT / 2) * this.zoom;
    const dGx = (dxPx / halfW + dyPx / halfH) / -2;
    const dGy = (dyPx / halfH - dxPx / halfW) / -2;
    // Clamp: bursty/coalesced move events can report a very small dtMs for a
    // real screen-space delta, producing an absurd instantaneous velocity.
    this.velocityX = clamp(dGx / dtMs, -PAN_MAX_VELOCITY, PAN_MAX_VELOCITY);
    this.velocityY = clamp(dGy / dtMs, -PAN_MAX_VELOCITY, PAN_MAX_VELOCITY);
  }

  startCoast() {
    this.coasting = Math.abs(this.velocityX) > PAN_MIN_VELOCITY || Math.abs(this.velocityY) > PAN_MIN_VELOCITY;
  }

  centerOnTile(gx, gy) {
    this.targetX = gx;
    this.targetY = gy;
    this.centering = true;
    this.coasting = false;
    this.velocityX = 0;
    this.velocityY = 0;
  }

  zoomAt(factor, sx, sy, viewW, viewH) {
    const before = this.screenToTile(sx, sy, viewW, viewH);
    this.targetZoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, this.targetZoom * factor));
    this.zoom = this.targetZoom; // apply immediately for responsive pinch/scroll
    const after = this.screenToTile(sx, sy, viewW, viewH);
    this.x += before.x - after.x;
    this.y += before.y - after.y;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  update(dtMs) {
    if (this.coasting) {
      this.x += this.velocityX * dtMs;
      this.y += this.velocityY * dtMs;
      this.velocityX *= PAN_FRICTION;
      this.velocityY *= PAN_FRICTION;
      if (Math.abs(this.velocityX) < PAN_MIN_VELOCITY && Math.abs(this.velocityY) < PAN_MIN_VELOCITY) {
        this.coasting = false;
      }
      this.targetX = this.x;
      this.targetY = this.y;
    } else if (this.centering) {
      this.x += (this.targetX - this.x) * CAMERA_EASE;
      this.y += (this.targetY - this.y) * CAMERA_EASE;
      if (Math.abs(this.targetX - this.x) < 0.01 && Math.abs(this.targetY - this.y) < 0.01) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.centering = false;
      }
    }
  }
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
