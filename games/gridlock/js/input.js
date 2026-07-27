/**
 * input.js — Keyboard, swipe and virtual D-pad, normalised to two events:
 * `direction` (a DIR constant) and `action` (a named command).
 *
 * Swipes resolve on movement rather than on release, so a flick registers the
 * instant the intent is unambiguous. The origin resets after each recognised
 * swipe, letting the player chain turns without lifting a finger.
 */

import { DIR } from './config.js';

const KEY_TO_DIR = {
  ArrowUp: DIR.UP,
  ArrowRight: DIR.RIGHT,
  ArrowDown: DIR.DOWN,
  ArrowLeft: DIR.LEFT,
  KeyW: DIR.UP,
  KeyD: DIR.RIGHT,
  KeyS: DIR.DOWN,
  KeyA: DIR.LEFT,
};

const KEY_TO_ACTION = {
  Escape: 'pause',
  KeyP: 'pause',
  Enter: 'confirm',
  Space: 'confirm',
  KeyR: 'retry',
  KeyM: 'mute',
};

/** Pixels of travel before a drag counts as a swipe. */
const SWIPE_THRESHOLD = 22;

export class Input {
  constructor(target) {
    this.target = target;
    this.onDirection = () => {};
    this.onAction = () => {};
    this.onAnyInput = () => {};

    this.heldDirs = [];
    this._touchId = null;
    this._ox = 0;
    this._oy = 0;
    this._dpadRepeat = null;
    this._enabled = true;

    this._bindKeyboard();
    this._bindTouch();
  }

  setEnabled(on) {
    this._enabled = on;
  }

  _emitDir(dir) {
    if (!this._enabled || dir === DIR.NONE) return;
    this.onAnyInput();
    this.onDirection(dir);
  }

  _emitAction(name) {
    this.onAnyInput();
    this.onAction(name);
  }

  _bindKeyboard() {
    window.addEventListener(
      'keydown',
      (e) => {
        if (e.repeat) return;
        const target = e.target;
        // Never swallow typing in a form control.
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

        const dir = KEY_TO_DIR[e.code];
        if (dir !== undefined) {
          e.preventDefault();
          if (!this.heldDirs.includes(dir)) this.heldDirs.push(dir);
          this._emitDir(dir);
          return;
        }
        const action = KEY_TO_ACTION[e.code];
        if (action) {
          e.preventDefault();
          this._emitAction(action);
        }
      },
      { passive: false }
    );

    window.addEventListener('keyup', (e) => {
      const dir = KEY_TO_DIR[e.code];
      if (dir === undefined) return;
      const i = this.heldDirs.indexOf(dir);
      if (i >= 0) this.heldDirs.splice(i, 1);
    });

    window.addEventListener('blur', () => {
      this.heldDirs.length = 0;
    });
  }

  _bindTouch() {
    const el = this.target;

    el.addEventListener(
      'touchstart',
      (e) => {
        const t = e.changedTouches[0];
        this._touchId = t.identifier;
        this._ox = t.clientX;
        this._oy = t.clientY;
        this.onAnyInput();
      },
      { passive: true }
    );

    el.addEventListener(
      'touchmove',
      (e) => {
        if (this._touchId === null) return;
        let t = null;
        for (const c of e.changedTouches) if (c.identifier === this._touchId) t = c;
        if (!t) return;

        const dx = t.clientX - this._ox;
        const dy = t.clientY - this._oy;
        const adx = Math.abs(dx);
        const ady = Math.abs(dy);
        if (Math.max(adx, ady) < SWIPE_THRESHOLD) return;

        // Require a clear dominant axis so a diagonal flick never fires twice.
        if (adx > ady * 1.15) {
          this._emitDir(dx > 0 ? DIR.RIGHT : DIR.LEFT);
        } else if (ady > adx * 1.15) {
          this._emitDir(dy > 0 ? DIR.DOWN : DIR.UP);
        } else {
          return;
        }
        this._ox = t.clientX;
        this._oy = t.clientY;
        e.preventDefault();
      },
      { passive: false }
    );

    const end = () => {
      this._touchId = null;
    };
    el.addEventListener('touchend', end, { passive: true });
    el.addEventListener('touchcancel', end, { passive: true });
  }

  /**
   * Wires a virtual D-pad. Each button carries `data-dir` (u/r/d/l).
   * Holding a button repeats the direction so the buffer stays fresh.
   * @param {HTMLElement} root
   */
  attachDpad(root) {
    const DIRS = { u: DIR.UP, r: DIR.RIGHT, d: DIR.DOWN, l: DIR.LEFT };
    for (const btn of root.querySelectorAll('[data-dir]')) {
      const dir = DIRS[btn.dataset.dir];
      const press = (e) => {
        e.preventDefault();
        btn.classList.add('is-down');
        this._emitDir(dir);
        clearInterval(this._dpadRepeat);
        this._dpadRepeat = setInterval(() => this._emitDir(dir), 110);
      };
      const release = () => {
        btn.classList.remove('is-down');
        clearInterval(this._dpadRepeat);
        this._dpadRepeat = null;
      };
      btn.addEventListener('pointerdown', press);
      btn.addEventListener('pointerup', release);
      btn.addEventListener('pointerleave', release);
      btn.addEventListener('pointercancel', release);
      btn.addEventListener('contextmenu', (e) => e.preventDefault());
    }
  }
}
