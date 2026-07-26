import { CONFIG } from "./config.js";
import { cellKey, parseCellKey } from "./utils.js";

export function findMatchGroups(board) {
  const groups = [];

  for (let row = 0; row < CONFIG.rows; row += 1) {
    let start = 0;
    while (start < CONFIG.columns) {
      const node = board[row][start];
      if (!node) {
        start += 1;
        continue;
      }
      let end = start + 1;
      while (end < CONFIG.columns && board[row][end]?.type === node.type) end += 1;
      if (end - start >= 3) {
        groups.push({
          type: node.type,
          orientation: "row",
          cells: Array.from({ length: end - start }, (_, index) => ({ row, column: start + index }))
        });
      }
      start = end;
    }
  }

  for (let column = 0; column < CONFIG.columns; column += 1) {
    let start = 0;
    while (start < CONFIG.rows) {
      const node = board[start][column];
      if (!node) {
        start += 1;
        continue;
      }
      let end = start + 1;
      while (end < CONFIG.rows && board[end][column]?.type === node.type) end += 1;
      if (end - start >= 3) {
        groups.push({
          type: node.type,
          orientation: "column",
          cells: Array.from({ length: end - start }, (_, index) => ({ row: start + index, column }))
        });
      }
      start = end;
    }
  }

  return groups;
}

export function getMatchedCells(groups) {
  const matched = new Map();
  for (const group of groups) {
    for (const cell of group.cells) {
      matched.set(cellKey(cell.row, cell.column), cell);
    }
  }
  return matched;
}

export function findSpecialActivations(board, matchedCells) {
  const activations = [];
  for (const cell of matchedCells.values()) {
    const node = board[cell.row][cell.column];
    if (node?.specialType === "line") {
      activations.push({ ...cell, direction: node.direction });
    }
  }
  return activations;
}

export function expandLineBreakerCells(matchedCells, activations) {
  const expanded = new Map(matchedCells);
  for (const activation of activations) {
    if (activation.direction === "row") {
      for (let column = 0; column < CONFIG.columns; column += 1) {
        expanded.set(cellKey(activation.row, column), { row: activation.row, column });
      }
    } else {
      for (let row = 0; row < CONFIG.rows; row += 1) {
        expanded.set(cellKey(row, activation.column), { row, column: activation.column });
      }
    }
  }
  return expanded;
}

export function chooseSpecialCreation(groups, movedCell, cascadeDepth) {
  const straightFour = groups.find((group) => group.cells.length === 4 && (group.orientation === "row" || group.orientation === "column"));
  if (!straightFour) return null;

  let placement = null;
  if (movedCell && cascadeDepth === 0) {
    placement = straightFour.cells.find((cell) => cell.row === movedCell.row && cell.column === movedCell.column) || null;
  }
  if (!placement) placement = centerCell(straightFour.cells);

  return {
    row: placement.row,
    column: placement.column,
    type: straightFour.type,
    specialType: "line",
    direction: straightFour.orientation
  };
}

export function scoreGroups(groups, uniqueCount, activationCount, lineClearCount, cascadeDepth) {
  let base = 0;
  let longest = 0;
  for (const group of groups) {
    const length = group.cells.length;
    longest = Math.max(longest, length);
    if (length === 3) base += CONFIG.scoring.match3;
    if (length === 4) base += CONFIG.scoring.match4;
    if (length >= 5) base += CONFIG.scoring.match5 + (length - 5) * CONFIG.scoring.additionalNode;
  }
  if (!base && uniqueCount > 0) base = CONFIG.scoring.match3;
  base += activationCount * CONFIG.scoring.specialActivation;
  base += lineClearCount * CONFIG.scoring.lineClear;

  const multiplier = CONFIG.scoring.cascadeBase + cascadeDepth * CONFIG.scoring.cascadeIncrement;
  return {
    points: Math.round(base * multiplier),
    multiplier,
    longest
  };
}

export function coolingForResolution(groups, activationCount, cascadeDepth, clearedCount) {
  let cooling = 0;
  for (const group of groups) {
    if (group.cells.length === 4) cooling += CONFIG.heat.match4Cooling;
    if (group.cells.length >= 5) cooling += CONFIG.heat.match5Cooling;
  }
  if (cascadeDepth === 1) cooling += CONFIG.heat.firstCascadeCooling;
  if (cascadeDepth > 1) cooling += CONFIG.heat.additionalCascadeCooling;
  if (activationCount > 0) cooling += CONFIG.heat.specialCooling * activationCount;
  if (clearedCount >= 14 || cascadeDepth >= 3) cooling += CONFIG.heat.largeChainCooling;
  return cooling;
}

function centerCell(cells) {
  const averageRow = cells.reduce((sum, cell) => sum + cell.row, 0) / cells.length;
  const averageColumn = cells.reduce((sum, cell) => sum + cell.column, 0) / cells.length;
  return [...cells].sort((a, b) => {
    const distanceA = Math.abs(a.row - averageRow) + Math.abs(a.column - averageColumn);
    const distanceB = Math.abs(b.row - averageRow) + Math.abs(b.column - averageColumn);
    return distanceA - distanceB || a.row - b.row || a.column - b.column;
  })[0];
}

export function matchedCellsToArray(cells) {
  return [...cells.keys()].map(parseCellKey);
}
