let nextId = 1;

export function createId() {
  nextId += 1;
  return `node-${Date.now().toString(36)}-${nextId.toString(36)}`;
}

export function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export function cellKey(row, column) {
  return `${row},${column}`;
}

export function parseCellKey(key) {
  const [row, column] = key.split(",").map(Number);
  return { row, column };
}

export function areAdjacent(a, b) {
  return Math.abs(a.row - b.row) + Math.abs(a.column - b.column) === 1;
}

export function copyCell(cell) {
  return { row: cell.row, column: cell.column };
}

export function formatNumber(value) {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}
