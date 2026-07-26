// Translates raw keyboard/pointer input into high-level game intents.
// Supports: arrow keys, tap-adjacent-tile, tap-distant-tile (auto-path),
// swipe, and press-and-hold-or-drag-from-player-tile to enter Planning Mode.

const HOLD_MS = 260;
const TAP_MAX_DIST = 10; // px of pointer movement still considered a "tap"
const SWIPE_MIN_DIST = 18;

const KEY_TO_DIR = {
  ArrowUp: 'N', ArrowDown: 'S', ArrowLeft: 'W', ArrowRight: 'E',
  w: 'N', s: 'S', a: 'W', d: 'E',
};

export class Input {
  constructor(canvas, renderer, callbacks) {
    this.canvas = canvas;
    this.renderer = renderer;
    this.cb = callbacks; // { onMove, onTapTile, onDragStart, onDragTile, onDragEnd, onDragCancel, onUndo, onRestart, onCancelPlanning }
    this.pointerActive = false;
    this.startPx = null;
    this.startTile = null;
    this.startedOnPlayer = false;
    this.holdTimer = null;
    this.planningStarted = false;
    this.lastTile = null;

    this._onPointerDown = this.onPointerDown.bind(this);
    this._onPointerMove = this.onPointerMove.bind(this);
    this._onPointerUp = this.onPointerUp.bind(this);
    this._onKeyDown = this.onKeyDown.bind(this);

    canvas.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
    window.addEventListener('keydown', this._onKeyDown);
  }

  destroy() {
    this.canvas.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerUp);
    window.removeEventListener('keydown', this._onKeyDown);
    clearTimeout(this.holdTimer);
  }

  pixelToTile(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const t = this.renderer.tileSize;
    return { x: Math.floor(x / t), y: Math.floor(y / t) };
  }

  onPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return;
    this.pointerActive = true;
    this.startPx = { x: e.clientX, y: e.clientY };
    this.startTile = this.pixelToTile(e.clientX, e.clientY);
    this.lastTile = this.startTile;
    this.startedOnPlayer = !!this.cb.isPlayerTile?.(this.startTile.x, this.startTile.y);
    this.planningStarted = false;

    if (this.startedOnPlayer) {
      clearTimeout(this.holdTimer);
      this.holdTimer = setTimeout(() => {
        if (this.pointerActive && this.startedOnPlayer && !this.planningStarted) {
          this.planningStarted = true;
          this.cb.onDragStart?.();
        }
      }, HOLD_MS);
    }
  }

  onPointerMove(e) {
    if (!this.pointerActive) return;
    const tile = this.pixelToTile(e.clientX, e.clientY);
    const dist = Math.hypot(e.clientX - this.startPx.x, e.clientY - this.startPx.y);

    if (this.startedOnPlayer && !this.planningStarted && dist > TAP_MAX_DIST) {
      this.planningStarted = true;
      clearTimeout(this.holdTimer);
      this.cb.onDragStart?.();
    }

    if (this.planningStarted) {
      if (!this.lastTile || tile.x !== this.lastTile.x || tile.y !== this.lastTile.y) {
        this.lastTile = tile;
        this.cb.onDragTile?.(tile.x, tile.y);
      }
    }
  }

  onPointerUp(e) {
    if (!this.pointerActive) return;
    this.pointerActive = false;
    clearTimeout(this.holdTimer);

    if (this.planningStarted) {
      this.cb.onDragEnd?.();
      this.planningStarted = false;
      return;
    }

    const dist = Math.hypot(e.clientX - this.startPx.x, e.clientY - this.startPx.y);
    const endTile = this.pixelToTile(e.clientX, e.clientY);

    if (dist <= TAP_MAX_DIST) {
      this.cb.onTapTile?.(endTile.x, endTile.y);
    } else if (dist >= SWIPE_MIN_DIST) {
      const dx = e.clientX - this.startPx.x;
      const dy = e.clientY - this.startPx.y;
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : (dy > 0 ? 'S' : 'N');
      this.cb.onMove?.(dir);
    }
  }

  onKeyDown(e) {
    if (e.repeat) return;
    if (e.key === 'Escape') { this.cb.onCancelPlanning?.(); return; }
    if (e.key === 'Enter') { this.cb.onExecutePlanning?.(); return; }
    const dir = KEY_TO_DIR[e.key];
    if (dir) {
      e.preventDefault();
      this.cb.onMove?.(dir);
    }
  }
}
