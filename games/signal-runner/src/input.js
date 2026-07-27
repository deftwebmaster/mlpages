/**
 * input.js — Swipe, tap, keyboard and pointer handling.
 *
 * Two decisions here matter more than the rest:
 *
 *  1. A swipe fires the moment it crosses the distance threshold, not on
 *     release. Waiting for lift-off adds a chunk of latency you can feel, and
 *     in a game where the world keeps moving that latency reads as unfair.
 *  2. Keyboard auto-repeat is ignored. Holding a direction should not walk you
 *     across the board — every step is meant to be a decision.
 */

import { CONFIG } from './config.js';

const KEY_DIRECTIONS = {
  ArrowUp: [0, -1], KeyW: [0, -1],
  ArrowDown: [0, 1], KeyS: [0, 1],
  ArrowLeft: [-1, 0], KeyA: [-1, 0],
  ArrowRight: [1, 0], KeyD: [1, 0],
};

export class InputManager {
  /**
   * @param {HTMLElement} surface element that receives pointer gestures
   * @param {object} handlers { move, polarity, pause, restart, tap }
   */
  constructor(surface, handlers) {
    this.surface = surface;
    this.handlers = handlers;
    this.enabled = false;

    this.pointerId = null;
    this.startX = 0;
    this.startY = 0;
    this.startTime = 0;
    this.gestureResolved = false;

    this.onPointerDown = this.onPointerDown.bind(this);
    this.onPointerMove = this.onPointerMove.bind(this);
    this.onPointerUp = this.onPointerUp.bind(this);
    this.onPointerCancel = this.onPointerCancel.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onContextMenu = (e) => e.preventDefault();
  }

  attach() {
    const s = this.surface;
    s.addEventListener('pointerdown', this.onPointerDown, { passive: false });
    s.addEventListener('pointermove', this.onPointerMove, { passive: false });
    s.addEventListener('pointerup', this.onPointerUp, { passive: false });
    s.addEventListener('pointercancel', this.onPointerCancel);
    s.addEventListener('pointerleave', this.onPointerCancel);
    s.addEventListener('contextmenu', this.onContextMenu);
    window.addEventListener('keydown', this.onKeyDown);
  }

  detach() {
    const s = this.surface;
    s.removeEventListener('pointerdown', this.onPointerDown);
    s.removeEventListener('pointermove', this.onPointerMove);
    s.removeEventListener('pointerup', this.onPointerUp);
    s.removeEventListener('pointercancel', this.onPointerCancel);
    s.removeEventListener('pointerleave', this.onPointerCancel);
    s.removeEventListener('contextmenu', this.onContextMenu);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  setEnabled(value) {
    this.enabled = value;
    if (!value) this.resetGesture();
  }

  resetGesture() {
    this.pointerId = null;
    this.gestureResolved = false;
  }

  onPointerDown(event) {
    if (!this.enabled || this.pointerId !== null) return;
    this.pointerId = event.pointerId;
    this.startX = event.clientX;
    this.startY = event.clientY;
    this.startTime = performance.now();
    this.gestureResolved = false;
    if (this.surface.setPointerCapture) {
      try {
        this.surface.setPointerCapture(event.pointerId);
      } catch {
        /* capture is a nicety, not a requirement */
      }
    }
    event.preventDefault();
  }

  onPointerMove(event) {
    if (!this.enabled || event.pointerId !== this.pointerId || this.gestureResolved) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);
    const { swipeMinDistance, dominantAxisRatio } = CONFIG.input;

    if (Math.max(absX, absY) < swipeMinDistance) return;

    // Resolve to the dominant axis. A gesture that is genuinely diagonal is
    // ignored rather than guessed at, so an ambiguous flick never moves you
    // somewhere you did not intend.
    if (absX > absY * dominantAxisRatio) {
      this.gestureResolved = true;
      this.handlers.move(dx > 0 ? 1 : -1, 0);
    } else if (absY > absX * dominantAxisRatio) {
      this.gestureResolved = true;
      this.handlers.move(0, dy > 0 ? 1 : -1);
    }
    event.preventDefault();
  }

  onPointerUp(event) {
    if (event.pointerId !== this.pointerId) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    const travelled = Math.hypot(dx, dy);
    const elapsed = performance.now() - this.startTime;

    if (
      this.enabled &&
      !this.gestureResolved &&
      travelled <= CONFIG.input.tapMaxDistance &&
      elapsed < CONFIG.input.swipeMaxTime
    ) {
      this.handlers.tap(event.clientX, event.clientY);
    }
    this.resetGesture();
    event.preventDefault();
  }

  onPointerCancel(event) {
    if (event.pointerId !== this.pointerId) return;
    this.resetGesture();
  }

  onKeyDown(event) {
    // Let the browser own the keyboard while a menu button has focus, so the
    // UI stays operable for keyboard and screen-reader users.
    const tag = event.target && event.target.tagName;
    const inWidget = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
    if (inWidget) return;

    if (event.code === 'Escape' || event.code === 'KeyP') {
      event.preventDefault();
      this.handlers.pause();
      return;
    }

    if (!this.enabled) return;
    if (event.repeat) return; // holding a key must not walk the player

    if (event.code === 'Space') {
      event.preventDefault();
      this.handlers.polarity();
      return;
    }
    if (event.code === 'KeyR') {
      event.preventDefault();
      this.handlers.restart();
      return;
    }
    const dir = KEY_DIRECTIONS[event.code];
    if (dir) {
      event.preventDefault();
      this.handlers.move(dir[0], dir[1]);
    }
  }
}
