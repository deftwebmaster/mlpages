/**
 * Player input: tap-to-swap, swipe-to-swap, mouse, and keyboard.
 *
 * Input is gated by a single `enabled` flag that the game state machine owns, so
 * taps arriving mid-animation are dropped rather than queued.
 */

import { CONFIG } from './config.js';
import { Board } from './board.js';
import { clamp } from './utils.js';

export class Input {
  constructor(board, renderer, handlers) {
    this.board = board;
    this.renderer = renderer;
    this.handlers = handlers; // { onSwapRequest, onSelect, onDeselect, onGesture }
    this.enabled = false;
    this.selected = null;
    this.cursor = null;
    this.pointer = null;
  }

  attach() {
    const layer = this.renderer.dom.nodes;
    layer.addEventListener('pointerdown', this.onPointerDown, { passive: true });
    layer.addEventListener('pointermove', this.onPointerMove, { passive: true });
    layer.addEventListener('pointerup', this.onPointerUp);
    layer.addEventListener('pointercancel', this.onPointerCancel);
    layer.addEventListener('contextmenu', (e) => e.preventDefault());
    if (CONFIG.FEATURES.keyboard) {
      layer.addEventListener('keydown', this.onKeyDown);
      layer.addEventListener('focus', this.onFocus);
      layer.addEventListener('blur', this.onBlur);
    }
  }

  setEnabled(on) {
    this.enabled = !!on;
    if (!on) {
      this.pointer = null;
      this.clearSelection();
    }
  }

  clearSelection() {
    this.selected = null;
    this.renderer.setSelected(null);
  }

  /* ---------------- pointer ---------------- */

  cellFromEvent(event) {
    const el = event.target instanceof Element ? event.target.closest('.node') : null;
    if (!el || el.dataset.row === undefined) return null;
    const row = Number(el.dataset.row);
    const col = Number(el.dataset.col);
    if (!Number.isInteger(row) || !Number.isInteger(col)) return null;
    return { row, col };
  }

  onPointerDown = (event) => {
    if (!this.enabled) return;
    const cell = this.cellFromEvent(event);
    if (!cell) return;
    this.handlers.onGesture?.();
    this.pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      cell,
      acted: false,
    };
  };

  onPointerMove = (event) => {
    const p = this.pointer;
    if (!this.enabled || !p || p.acted || event.pointerId !== p.id) return;
    const dx = event.clientX - p.x;
    const dy = event.clientY - p.y;
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < CONFIG.SWIPE_THRESHOLD_PX) return;

    // Too diagonal to read as a direction — wait for a clearer gesture.
    const ratio = CONFIG.SWIPE_AXIS_RATIO;
    let target = null;
    if (ax > ay * ratio) {
      target = { row: p.cell.row, col: p.cell.col + (dx > 0 ? 1 : -1) };
    } else if (ay > ax * ratio) {
      target = { row: p.cell.row + (dy > 0 ? 1 : -1), col: p.cell.col };
    } else {
      return;
    }

    p.acted = true;
    if (this.board.at(target.row, target.col)) {
      this.clearSelection();
      this.handlers.onSwapRequest(p.cell, target);
    }
  };

  onPointerUp = (event) => {
    const p = this.pointer;
    this.pointer = null;
    if (!this.enabled || !p || p.acted || event.pointerId !== p.id) return;
    const cell = this.cellFromEvent(event) || p.cell;
    // Treat as a tap only if the finger stayed near the node it started on.
    this.tap(Math.abs(event.clientX - p.x) + Math.abs(event.clientY - p.y) < 24 ? p.cell : cell);
  };

  onPointerCancel = () => {
    this.pointer = null;
  };

  tap(cell) {
    if (!this.board.at(cell.row, cell.col)) return;
    const current = this.selected;
    if (!current) {
      this.select(cell);
      return;
    }
    if (current.row === cell.row && current.col === cell.col) {
      this.clearSelection();
      this.handlers.onDeselect?.();
      return;
    }
    if (Board.isAdjacent(current, cell)) {
      this.clearSelection();
      this.handlers.onSwapRequest(current, cell);
      return;
    }
    this.select(cell);
  }

  select(cell) {
    this.selected = cell;
    this.renderer.setSelected(cell);
    this.handlers.onSelect?.(cell);
  }

  /* ---------------- keyboard ---------------- */

  onFocus = () => {
    if (!this.cursor) {
      this.cursor = {
        row: Math.floor(this.board.rows / 2),
        col: Math.floor(this.board.cols / 2),
      };
    }
    this.renderer.setCursor(this.cursor);
  };

  onBlur = () => {
    this.renderer.setCursor(null);
  };

  onKeyDown = (event) => {
    if (!CONFIG.FEATURES.keyboard) return;
    const moves = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
      w: [-1, 0], s: [1, 0], a: [0, -1], d: [0, 1],
    };
    const move = moves[event.key];

    if (move) {
      event.preventDefault();
      if (!this.enabled) return;
      this.cursor = this.cursor || { row: 3, col: 3 };
      this.cursor = {
        row: clamp(this.cursor.row + move[0], 0, this.board.rows - 1),
        col: clamp(this.cursor.col + move[1], 0, this.board.cols - 1),
      };
      this.renderer.setCursor(this.cursor);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!this.enabled || !this.cursor) return;
      this.handlers.onGesture?.();
      this.tap(this.cursor);
      return;
    }

    if (event.key === 'Escape' && this.selected) {
      event.preventDefault();
      this.clearSelection();
    }
  };
}
