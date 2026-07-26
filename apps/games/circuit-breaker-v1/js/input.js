import { areAdjacent } from "./utils.js";

export class InputController {
  constructor(boardElement, handlers) {
    this.boardElement = boardElement;
    this.handlers = handlers;
    this.pointerStart = null;
    this.keyboardCell = { row: 0, column: 0 };
    this.bind();
  }

  bind() {
    this.boardElement.addEventListener("click", (event) => {
      const node = event.target.closest(".node");
      if (!node) return;
      this.handlers.onTap(this.cellFromElement(node));
    });

    this.boardElement.addEventListener("pointerdown", (event) => {
      const node = event.target.closest(".node");
      if (!node) return;
      node.setPointerCapture?.(event.pointerId);
      this.pointerStart = {
        ...this.cellFromElement(node),
        x: event.clientX,
        y: event.clientY
      };
    });

    this.boardElement.addEventListener("pointerup", (event) => {
      if (!this.pointerStart) return;
      const dx = event.clientX - this.pointerStart.x;
      const dy = event.clientY - this.pointerStart.y;
      const threshold = 28;
      if (Math.max(Math.abs(dx), Math.abs(dy)) >= threshold) {
        const direction = Math.abs(dx) > Math.abs(dy)
          ? { row: 0, column: dx > 0 ? 1 : -1 }
          : { row: dy > 0 ? 1 : -1, column: 0 };
        const target = {
          row: this.pointerStart.row + direction.row,
          column: this.pointerStart.column + direction.column
        };
        this.handlers.onSwipe({ row: this.pointerStart.row, column: this.pointerStart.column }, target);
      }
      this.pointerStart = null;
    });

    this.boardElement.addEventListener("keydown", (event) => {
      const node = event.target.closest(".node");
      if (!node) return;
      const cell = this.cellFromElement(node);
      const keyMap = {
        ArrowUp: { row: -1, column: 0 },
        ArrowDown: { row: 1, column: 0 },
        ArrowLeft: { row: 0, column: -1 },
        ArrowRight: { row: 0, column: 1 }
      };

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        this.handlers.onTap(cell);
        return;
      }

      if (keyMap[event.key]) {
        event.preventDefault();
        const delta = keyMap[event.key];
        const next = { row: cell.row + delta.row, column: cell.column + delta.column };
        const nextElement = this.boardElement.querySelector(`[data-row="${next.row}"][data-column="${next.column}"]`);
        if (nextElement) nextElement.focus();
        if (event.shiftKey && areAdjacent(cell, next)) this.handlers.onSwipe(cell, next);
      }
    });
  }

  cellFromElement(element) {
    return {
      row: Number(element.dataset.row),
      column: Number(element.dataset.column)
    };
  }
}
