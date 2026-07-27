import { clamp } from './utils.js';

// Normalized input state consumed by deflector / game / ui.
export class InputManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.keys = new Set();
    this.pointerActive = false;
    this.pointerX = null; // logical canvas-space x
    this.lastPointerClientX = null;
    this.moveAxis = 0; // -1..1 from keyboard
    this.launchRequested = false;
    this.catchRequested = false;
    this.routeSelectRequested = null; // 1,2,3
    this.cycleRequested = null; // 'left' | 'right'
    this.pauseRequested = false;
    this.restartRequested = false;
    this._launchLatch = false;
    this._catchLatch = false;
    this._touchStartX = null;
    this._touchMoveThreshold = 3;
    this.logicalWidth = 480;
    this.logicalHeight = 800;
    this.mobileButtons = { launch: false, catchHold: false };

    this._bind();
  }

  setLogicalSize(w, h) {
    this.logicalWidth = w;
    this.logicalHeight = h;
  }

  _toLogicalX(clientX) {
    const rect = this.canvas.getBoundingClientRect();
    const relX = clamp((clientX - rect.left) / rect.width, 0, 1);
    return relX * this.logicalWidth;
  }

  _bind() {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
      if (e.code === 'Space') {
        if (!this._launchLatch) {
          this.launchRequested = true;
          this._launchLatch = true;
        }
        e.preventDefault();
      }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        if (!this._catchLatch) {
          this.catchRequested = true;
          this._catchLatch = true;
        }
      }
      if (e.code === 'Digit1') this.routeSelectRequested = 1;
      if (e.code === 'Digit2') this.routeSelectRequested = 2;
      if (e.code === 'Digit3') this.routeSelectRequested = 3;
      if (e.code === 'KeyQ') this.cycleRequested = 'left';
      if (e.code === 'KeyE') this.cycleRequested = 'right';
      if (e.code === 'KeyP' || e.code === 'Escape') this.pauseRequested = true;
      if (e.code === 'KeyR') this.restartRequested = true;
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
      if (e.code === 'Space') this._launchLatch = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this._catchLatch = false;
    });

    this.canvas.addEventListener(
      'pointerdown',
      (e) => {
        this.pointerActive = true;
        this.pointerX = this._toLogicalX(e.clientX);
        this._touchStartX = e.clientX;
        if (e.button === 0) this.launchRequested = true;
        if (e.button === 2) this.catchRequested = true;
        e.preventDefault();
      },
      { passive: false }
    );
    this.canvas.addEventListener(
      'pointermove',
      (e) => {
        if (!this.pointerActive && e.pointerType === 'mouse') {
          this.pointerX = this._toLogicalX(e.clientX);
          return;
        }
        if (!this.pointerActive) return;
        if (
          this._touchStartX !== null &&
          Math.abs(e.clientX - this._touchStartX) < this._touchMoveThreshold &&
          e.pointerType !== 'mouse'
        ) {
          return;
        }
        this.pointerX = this._toLogicalX(e.clientX);
        e.preventDefault();
      },
      { passive: false }
    );
    const endPointer = (e) => {
      this.pointerActive = false;
      this._touchStartX = null;
    };
    this.canvas.addEventListener('pointerup', endPointer);
    this.canvas.addEventListener('pointercancel', endPointer);
    this.canvas.addEventListener('pointerleave', () => {
      if (this._touchStartX !== null) {
        this.pointerActive = false;
      }
    });
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Prevent page scroll on touch within canvas.
    this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  }

  bindMobileButton(el, kind) {
    if (!el) return;
    const start = (e) => {
      e.preventDefault();
      if (kind === 'launch') this.launchRequested = true;
      if (kind === 'catch') this.catchRequested = true;
    };
    el.addEventListener('pointerdown', start, { passive: false });
  }

  computeMoveAxis() {
    let axis = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) axis -= 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) axis += 1;
    this.moveAxis = axis;
    return axis;
  }

  consumeFrameFlags() {
    const out = {
      launchRequested: this.launchRequested,
      catchRequested: this.catchRequested,
      routeSelectRequested: this.routeSelectRequested,
      cycleRequested: this.cycleRequested,
      pauseRequested: this.pauseRequested,
      restartRequested: this.restartRequested
    };
    this.launchRequested = false;
    this.catchRequested = false;
    this.routeSelectRequested = null;
    this.cycleRequested = null;
    this.pauseRequested = false;
    this.restartRequested = false;
    return out;
  }
}
