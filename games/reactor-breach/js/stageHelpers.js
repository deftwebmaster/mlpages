// Shared layout helpers for authoring stage data. Grids are fully
// deterministic/handcrafted per stage — these just remove boilerplate
// arithmetic, they do not randomize gameplay.
export const CHAMBER = { width: 480, height: 800 };

const MARGIN_X = 26;
const PLAY_WIDTH = CHAMBER.width - MARGIN_X * 2;

export function colX(col, cols) {
  const cellW = PLAY_WIDTH / cols;
  return MARGIN_X + cellW * (col + 0.5);
}

export function rowY(row, startY = 96, rowH = 27) {
  return startY + row * rowH;
}

export function cellWidth(cols, gapRatio = 0.14) {
  const cellW = PLAY_WIDTH / cols;
  return cellW * (1 - gapRatio);
}

// cellFn(row, col) => null | { type, ...overrides }
export function buildGrid(rows, cols, cellFn, opts = {}) {
  const out = [];
  const startY = opts.startY ?? 96;
  const rowH = opts.rowH ?? 27;
  const width = opts.width ?? cellWidth(cols);
  const height = opts.height ?? 18;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const def = cellFn(r, c);
      if (!def) continue;
      const id = def.id || `r${r}c${c}`;
      out.push({
        id,
        row: r,
        column: c,
        width,
        height,
        x: colX(c, cols),
        y: rowY(r, startY, rowH),
        ...def,
        id
      });
    }
  }
  return out;
}

export function tutorialPrompt(id, text, opts = {}) {
  return { id, text, ...opts };
}
