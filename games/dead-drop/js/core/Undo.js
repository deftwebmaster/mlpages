import { deepClone } from '../utils/helpers.js';

// Full-snapshot undo stack. The board is tiny (10x10, a handful of entities)
// so a full structuredClone per turn is cheap — no need for diffing/structural
// sharing here; simplicity wins over premature optimization.
export class UndoStack {
  constructor() {
    this.stack = [];
    this.hasUsedUndo = false;
  }

  push(state) {
    this.stack.push(deepClone(state));
  }

  canUndo() {
    return this.stack.length > 0;
  }

  pop() {
    if (!this.canUndo()) return null;
    this.hasUsedUndo = true;
    return this.stack.pop();
  }

  reset() {
    this.stack = [];
    this.hasUsedUndo = false;
  }
}
