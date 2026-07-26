import { CONFIG } from "./config.js";
import { createId, randomItem } from "./utils.js";
import { findMatchGroups } from "./matches.js";

export class BoardModel {
  constructor() {
    this.board = [];
  }

  createNode(typeId = randomItem(CONFIG.nodeTypes).id, overrides = {}) {
    return {
      id: createId(),
      type: typeId,
      specialType: null,
      direction: null,
      ...overrides
    };
  }

  generate() {
    let attempts = 0;
    do {
      this.board = Array.from({ length: CONFIG.rows }, () => Array.from({ length: CONFIG.columns }, () => null));
      for (let row = 0; row < CONFIG.rows; row += 1) {
        for (let column = 0; column < CONFIG.columns; column += 1) {
          this.board[row][column] = this.createNode(this.safeRandomType(row, column));
        }
      }
      attempts += 1;
    } while ((findMatchGroups(this.board).length > 0 || !this.hasPossibleMove()) && attempts < 250);
    return this.board;
  }

  safeRandomType(row, column) {
    const blocked = new Set();
    if (column >= 2 && this.board[row]?.[column - 1]?.type === this.board[row]?.[column - 2]?.type) {
      blocked.add(this.board[row][column - 1].type);
    }
    if (row >= 2 && this.board[row - 1]?.[column]?.type === this.board[row - 2]?.[column]?.type) {
      blocked.add(this.board[row - 1][column].type);
    }
    const available = CONFIG.nodeTypes.map((type) => type.id).filter((type) => !blocked.has(type));
    return randomItem(available.length ? available : CONFIG.nodeTypes.map((type) => type.id));
  }

  getCell(row, column) {
    if (!this.isInside(row, column)) return null;
    return this.board[row][column];
  }

  isInside(row, column) {
    return row >= 0 && row < CONFIG.rows && column >= 0 && column < CONFIG.columns;
  }

  swap(a, b) {
    const first = this.board[a.row][a.column];
    this.board[a.row][a.column] = this.board[b.row][b.column];
    this.board[b.row][b.column] = first;
  }

  wouldSwapMatch(a, b) {
    this.swap(a, b);
    const hasMatch = findMatchGroups(this.board).length > 0;
    this.swap(a, b);
    return hasMatch;
  }

  hasPossibleMove() {
    for (let row = 0; row < CONFIG.rows; row += 1) {
      for (let column = 0; column < CONFIG.columns; column += 1) {
        const current = { row, column };
        const neighbors = [
          { row: row + 1, column },
          { row, column: column + 1 }
        ];
        for (const neighbor of neighbors) {
          if (!this.isInside(neighbor.row, neighbor.column)) continue;
          if (this.wouldSwapMatch(current, neighbor)) return true;
        }
      }
    }
    return false;
  }

  removeCells(cells, specialCreation) {
    for (const cell of cells) {
      this.board[cell.row][cell.column] = null;
    }
    if (specialCreation) {
      this.board[specialCreation.row][specialCreation.column] = this.createNode(specialCreation.type, {
        specialType: specialCreation.specialType,
        direction: specialCreation.direction
      });
    }
  }

  applyGravityAndRefill() {
    const newCells = [];
    for (let column = 0; column < CONFIG.columns; column += 1) {
      const stack = [];
      for (let row = CONFIG.rows - 1; row >= 0; row -= 1) {
        const node = this.board[row][column];
        if (node) stack.push(node);
      }
      for (let row = CONFIG.rows - 1; row >= 0; row -= 1) {
        this.board[row][column] = stack.shift() || null;
      }
      for (let row = 0; row < CONFIG.rows; row += 1) {
        if (!this.board[row][column]) {
          this.board[row][column] = this.createNode();
          newCells.push({ row, column });
        }
      }
    }
    return newCells;
  }

  reshuffle() {
    const nodes = this.board.flat().filter(Boolean);
    let attempts = 0;
    do {
      const types = nodes.map((node) => node.type).sort(() => Math.random() - 0.5);
      for (let row = 0; row < CONFIG.rows; row += 1) {
        for (let column = 0; column < CONFIG.columns; column += 1) {
          const node = this.board[row][column];
          node.type = types.pop() || randomItem(CONFIG.nodeTypes).id;
          node.specialType = null;
          node.direction = null;
        }
      }
      attempts += 1;
    } while ((findMatchGroups(this.board).length > 0 || !this.hasPossibleMove()) && attempts < 250);

    if (attempts >= 250) this.generate();
  }

  findSuggestedMove() {
    for (let row = 0; row < CONFIG.rows; row += 1) {
      for (let column = 0; column < CONFIG.columns; column += 1) {
        const current = { row, column };
        const neighbors = [
          { row: row + 1, column },
          { row, column: column + 1 },
          { row: row - 1, column },
          { row, column: column - 1 }
        ];
        for (const neighbor of neighbors) {
          if (!this.isInside(neighbor.row, neighbor.column)) continue;
          if (this.wouldSwapMatch(current, neighbor)) return [current, neighbor];
        }
      }
    }
    return null;
  }
}
