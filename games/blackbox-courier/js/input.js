/**
 * Input aggregation.
 *
 * Produces a small, render-agnostic snapshot each frame:
 *   steerTarget : desired world-x, or null when not pointer-steering
 *   steerAxis   : -1..1 keyboard/side-press axis
 *   phaseHeld   : phase-shift request
 *
 * Pointer, keyboard and on-screen button sources are unified so that no part of
 * the game needs to know which device it is running on.
 */

const KEY_LEFT = new Set(['ArrowLeft', 'a', 'A']);
const KEY_RIGHT = new Set(['ArrowRight', 'd', 'D']);
const KEY_PHASE = new Set([' ', 'Spacebar', 'Shift', 'w', 'W', 'ArrowUp']);
const KEY_PAUSE = new Set(['p', 'P', 'Escape']);

export class Input {
  /**
   * @param {HTMLElement} surface element that receives steering pointers
   * @param {object} hooks { toWorldX(clientX), onPause(), onAnyInput() }
   */
  constructor(surface, hooks) {
    this.surface = surface;
    this.hooks = hooks;

    this.steerTarget = null;
    this.steerAxis = 0;
    this.phaseHeld = false;
    /** 'drag' | 'sides' */
    this.mode = 'drag';
    this.enabled = false;

    this._keyLeft = false;
    this._keyRight = false;
    this._keyPhase = false;
    this._btnPhase = false;
    this._sidePress = 0;
    /** pointerId of the finger currently steering. */
    this._steerPointer = null;
    /** pointerIds of extra fingers, which act as a phase gesture. */
    this._extraPointers = new Set();

    this._bind();
  }

  _bind() {
    const s = this.surface;
    const opts = { passive: false };

    s.addEventListener('pointerdown', (e) => this._onDown(e), opts);
    s.addEventListener('pointermove', (e) => this._onMove(e), opts);
    s.addEventListener('pointerup', (e) => this._onUp(e), opts);
    s.addEventListener('pointercancel', (e) => this._onUp(e), opts);
    s.addEventListener('pointerleave', (e) => this._onUp(e), opts);
    s.addEventListener('contextmenu', (e) => e.preventDefault());

    window.addEventListener('keydown', (e) => this._onKey(e, true));
    window.addEventListener('keyup', (e) => this._onKey(e, false));
    window.addEventListener('blur', () => this.releaseAll());
  }

  /** Wire the on-screen phase button (hold to phase). */
  attachPhaseButton(btn) {
    const down = (e) => {
      e.preventDefault();
      this._btnPhase = true;
      btn.classList.add('is-held');
      this.hooks.onAnyInput?.();
    };
    const up = (e) => {
      e.preventDefault();
      this._btnPhase = false;
      btn.classList.remove('is-held');
    };
    btn.addEventListener('pointerdown', down);
    btn.addEventListener('pointerup', up);
    btn.addEventListener('pointercancel', up);
    btn.addEventListener('pointerleave', up);
    // Keyboard activation of the button must not double as a click-through.
    btn.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') down(e);
    });
    btn.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.key === 'Enter') up(e);
    });
  }

  _onDown(e) {
    if (!this.enabled) return;
    // HUD controls opt out of steering so tapping Phase does not yank the craft.
    if (e.target instanceof Element && e.target.closest('[data-no-steer]')) return;
    e.preventDefault();
    this.hooks.onAnyInput?.();
    if (this._steerPointer === null) {
      this._steerPointer = e.pointerId;
      try {
        this.surface.setPointerCapture(e.pointerId);
      } catch {
        /* capture is best-effort */
      }
      this._applyPointer(e);
    } else {
      // A second finger is the "phase" gesture on touch devices.
      this._extraPointers.add(e.pointerId);
    }
  }

  _onMove(e) {
    if (!this.enabled) return;
    if (e.pointerId !== this._steerPointer) return;
    e.preventDefault();
    this._applyPointer(e);
  }

  _onUp(e) {
    if (e.pointerId === this._steerPointer) {
      this._steerPointer = null;
      this.steerTarget = null;
      this._sidePress = 0;
      try {
        this.surface.releasePointerCapture(e.pointerId);
      } catch {
        /* nothing captured */
      }
    }
    this._extraPointers.delete(e.pointerId);
  }

  _applyPointer(e) {
    if (this.mode === 'sides') {
      // Only sampled on down/move of a single finger, so the layout read is cheap.
      const rect = this.surface.getBoundingClientRect();
      this._sidePress = e.clientX < rect.left + rect.width / 2 ? -1 : 1;
      this.steerTarget = null;
    } else {
      this.steerTarget = this.hooks.toWorldX(e.clientX);
    }
  }

  _onKey(e, down) {
    if (KEY_PAUSE.has(e.key)) {
      if (down && !e.repeat) this.hooks.onPause?.();
      return;
    }
    if (KEY_LEFT.has(e.key)) {
      this._keyLeft = down;
      if (down) e.preventDefault();
    } else if (KEY_RIGHT.has(e.key)) {
      this._keyRight = down;
      if (down) e.preventDefault();
    } else if (KEY_PHASE.has(e.key)) {
      // Space must not scroll or re-trigger focused buttons during play.
      if (this.enabled) e.preventDefault();
      this._keyPhase = down;
    } else {
      return;
    }
    if (down) this.hooks.onAnyInput?.();
  }

  /** Recompute the derived snapshot. Called once per frame before the update. */
  sample() {
    const keyAxis = (this._keyRight ? 1 : 0) - (this._keyLeft ? 1 : 0);
    this.steerAxis = keyAxis !== 0 ? keyAxis : this._sidePress;
    if (keyAxis !== 0) this.steerTarget = null;
    this.phaseHeld =
      this.enabled && (this._keyPhase || this._btnPhase || this._extraPointers.size > 0);
  }

  releaseAll() {
    this._keyLeft = this._keyRight = this._keyPhase = false;
    this._btnPhase = false;
    this._sidePress = 0;
    this._steerPointer = null;
    this._extraPointers.clear();
    this.steerTarget = null;
    this.steerAxis = 0;
    this.phaseHeld = false;
  }

  setEnabled(on) {
    this.enabled = on;
    if (!on) this.releaseAll();
  }

  setMode(mode) {
    this.mode = mode === 'sides' ? 'sides' : 'drag';
    this.releaseAll();
  }
}
