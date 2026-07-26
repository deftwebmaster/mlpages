/**
 * Rendering layer.
 *
 * The DOM mirrors the board model and nothing more: one element per live node,
 * keyed by node id, positioned with a CSS transform driven by --row/--col. All
 * movement is therefore a transform transition, which keeps falls and swaps
 * smooth without ever making the DOM the source of truth.
 */

import { CONFIG, NODE_TYPES, SPECIAL, SPECIAL_NAMES, heatForMove } from './config.js';
import { duration, reflow, wait, waitFor, reducedMotion, formatNumber } from './utils.js';

const TYPE_INFO = new Map(NODE_TYPES.map((t) => [t.id, t]));
const MAX_SPARKS = 54;

export class Renderer {
  constructor(board, dom) {
    this.board = board;
    this.dom = dom;
    this.els = new Map();      // node id -> element
    this.exiting = new Set();  // ids mid-discharge, exempt from sync cleanup
    this.cells = [];
    this.displayedScore = 0;
    this.scoreRaf = 0;
    this.selected = null;
    this.cursor = null;
  }

  /* ---------------- setup ---------------- */

  mount() {
    const { boardGrid, nodes } = this.dom;
    document.documentElement.style.setProperty('--cols', String(this.board.cols));
    document.documentElement.style.setProperty('--rows', String(this.board.rows));
    this.syncTimingVars();

    boardGrid.textContent = '';
    this.cells = [];
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        boardGrid.appendChild(cell);
        this.cells.push(cell);
      }
    }
    nodes.textContent = '';
    this.els.clear();
    this.exiting.clear();
  }

  /** Keeps CSS transition durations aligned with the JS-side timing. */
  syncTimingVars() {
    const root = document.documentElement.style;
    root.setProperty('--t-swap', `${duration('SWAP')}ms`);
    root.setProperty('--t-charge', `${duration('CHARGE')}ms`);
    root.setProperty('--t-discharge', `${duration('DISCHARGE')}ms`);
    root.setProperty('--t-fall', `${duration('FALL')}ms`);
  }

  /* ---------------- node elements ---------------- */

  createElement(node) {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'node';
    el.tabIndex = -1;
    el.dataset.id = String(node.id);
    const core = document.createElement('span');
    core.className = 'node-core';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'node-sym');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    svg.appendChild(use);
    core.appendChild(svg);
    el.appendChild(core);
    el._use = use;
    this.els.set(node.id, el);
    this.dom.nodes.appendChild(el);
    return el;
  }

  applyNode(el, node, { instant = false } = {}) {
    const info = TYPE_INFO.get(node.type) || NODE_TYPES[0];
    if (el.dataset.type !== node.type) {
      el.dataset.type = node.type;
      el._use.setAttribute('href', `#sym-${info.symbol}`);
    }
    if (node.special) {
      if (el.dataset.special !== node.special) el.dataset.special = node.special;
    } else if (el.dataset.special) {
      delete el.dataset.special;
    }
    el.dataset.row = String(node.row);
    el.dataset.col = String(node.col);
    const specialText = node.special ? `, ${SPECIAL_NAMES[node.special] || 'special'}` : '';
    el.setAttribute('aria-label',
      `${info.name} node${specialText}, row ${node.row + 1}, column ${node.col + 1}`);
    this.place(el, node.row, node.col, instant);
  }

  place(el, row, col, instant = false) {
    if (instant) {
      el.classList.add('is-instant');
      el.style.setProperty('--row', String(row));
      el.style.setProperty('--col', String(col));
      reflow(el);
      el.classList.remove('is-instant');
    } else {
      el.style.setProperty('--row', String(row));
      el.style.setProperty('--col', String(col));
    }
  }

  /** Rebuilds/refreshes every element from the model. */
  syncAll({ instant = false } = {}) {
    const live = new Set();
    this.board.forEachNode((node) => {
      live.add(node.id);
      let el = this.els.get(node.id);
      if (!el) {
        el = this.createElement(node);
        this.applyNode(el, node, { instant: true });
      } else {
        this.applyNode(el, node, { instant });
      }
    });
    this.els.forEach((el, id) => {
      if (!live.has(id) && !this.exiting.has(id)) {
        el.remove();
        this.els.delete(id);
      }
    });
  }

  elementAt(row, col) {
    const node = this.board.at(row, col);
    return node ? this.els.get(node.id) : null;
  }

  /* ---------------- geometry ---------------- */

  /** Cell centres relative to the FX layer, measured from the backdrop grid. */
  geometry() {
    const host = this.dom.fx.getBoundingClientRect();
    const first = this.cells[0];
    if (!first) return null;
    const rect = first.getBoundingClientRect();
    const last = this.cells[this.cells.length - 1].getBoundingClientRect();
    const cols = this.board.cols;
    const rows = this.board.rows;
    const strideX = cols > 1 ? (last.left - rect.left) / (cols - 1) : rect.width;
    const strideY = rows > 1 ? (last.top - rect.top) / (rows - 1) : rect.height;
    return {
      x0: rect.left - host.left,
      y0: rect.top - host.top,
      w: rect.width,
      h: rect.height,
      strideX,
      strideY,
    };
  }

  centreOf(geo, row, col) {
    return {
      x: geo.x0 + col * geo.strideX + geo.w / 2,
      y: geo.y0 + row * geo.strideY + geo.h / 2,
    };
  }

  /* ---------------- selection / hints ---------------- */

  setSelected(cell) {
    if (this.selected) this.selected.classList.remove('is-selected');
    this.selected = null;
    if (!cell) return;
    const el = this.elementAt(cell.row, cell.col);
    if (el) {
      el.classList.add('is-selected');
      this.selected = el;
    }
  }

  setCursor(cell) {
    if (this.cursor) this.cursor.classList.remove('is-cursor');
    this.cursor = null;
    if (!cell) return;
    const el = this.elementAt(cell.row, cell.col);
    if (el) {
      el.classList.add('is-cursor');
      this.cursor = el;
    }
  }

  showHint(cells) {
    this.clearHint();
    cells.forEach(({ row, col }) => {
      const el = this.elementAt(row, col);
      if (el) el.classList.add('is-hint');
    });
  }

  clearHint() {
    this.dom.nodes.querySelectorAll('.is-hint').forEach((el) => el.classList.remove('is-hint'));
  }

  /* ---------------- movement ---------------- */

  /** Animates two nodes into each other's cells. The model has already swapped. */
  async animateSwap(a, b) {
    const nodeA = this.board.at(a.row, a.col);
    const nodeB = this.board.at(b.row, b.col);
    const elA = nodeA && this.els.get(nodeA.id);
    const elB = nodeB && this.els.get(nodeB.id);
    [elA, elB].forEach((el) => el && el.classList.add('is-swapping'));
    if (elA) this.applyNode(elA, nodeA);
    if (elB) this.applyNode(elB, nodeB);
    await waitFor('SWAP');
    [elA, elB].forEach((el) => el && el.classList.remove('is-swapping'));
  }

  /**
   * Invalid swap: show the move, hold, then put both nodes back. The model is
   * expected to be back in its original arrangement by the time this resolves.
   */
  async animateRejectedSwap(a, b) {
    const nodeA = this.board.at(a.row, a.col);
    const nodeB = this.board.at(b.row, b.col);
    const elA = nodeA && this.els.get(nodeA.id);
    const elB = nodeB && this.els.get(nodeB.id);
    [elA, elB].forEach((el) => el && el.classList.add('is-swapping'));
    if (elA) this.place(elA, b.row, b.col);
    if (elB) this.place(elB, a.row, a.col);
    await waitFor('SWAP');
    await waitFor('INVALID_HOLD');
    if (elA) this.place(elA, a.row, a.col);
    if (elB) this.place(elB, b.row, b.col);
    [elA, elB].forEach((el) => el && el.classList.add('is-reject'));
    await waitFor('SWAP');
    [elA, elB].forEach((el) => {
      if (!el) return;
      el.classList.remove('is-swapping');
      el.classList.remove('is-reject');
    });
  }

  async chargeCells(cells) {
    cells.forEach(({ row, col }) => {
      const el = this.elementAt(row, col);
      if (el) el.classList.add('is-charging');
    });
    await waitFor('CHARGE');
  }

  /** Fades out the given cells and returns once they are gone visually. */
  async dischargeCells(cells) {
    const geo = this.geometry();
    const ids = [];
    cells.forEach(({ row, col }) => {
      const node = this.board.at(row, col);
      if (!node) return;
      const el = this.els.get(node.id);
      if (!el) return;
      ids.push(node.id);
      this.exiting.add(node.id);
      el.classList.remove('is-charging');
      el.classList.add('is-discharging');
      el.style.pointerEvents = 'none';
    });
    if (geo) this.sparks(geo, cells);
    await waitFor('DISCHARGE');
    ids.forEach((id) => {
      const el = this.els.get(id);
      if (el) el.remove();
      this.els.delete(id);
      this.exiting.delete(id);
    });
  }

  sparks(geo, cells) {
    if (!CONFIG.FEATURES.particles || reducedMotion()) return;
    const perCell = cells.length > 14 ? 2 : 4;
    let budget = MAX_SPARKS;
    const frag = document.createDocumentFragment();
    for (const cell of cells) {
      const node = this.board.at(cell.row, cell.col);
      const tint = node ? `var(--n-${node.type})` : 'var(--cyan)';
      const { x, y } = this.centreOf(geo, cell.row, cell.col);
      for (let i = 0; i < perCell && budget > 0; i++, budget--) {
        const spark = document.createElement('i');
        spark.className = 'spark';
        const angle = Math.random() * Math.PI * 2;
        const dist = geo.w * (0.35 + Math.random() * 0.7);
        spark.style.left = `${x}px`;
        spark.style.top = `${y}px`;
        spark.style.color = tint;
        spark.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
        spark.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
        spark.style.setProperty('--dur', `${360 + Math.random() * 260}ms`);
        spark.addEventListener('animationend', () => spark.remove(), { once: true });
        frag.appendChild(spark);
      }
      if (budget <= 0) break;
    }
    this.dom.fx.appendChild(frag);
  }

  /** Discharge effects: beams for Line Breakers, shockwaves for Bombs and Cores. */
  showBlasts(activations) {
    if (!activations.length) return;
    const geo = this.geometry();
    if (!geo) return;
    const frag = document.createDocumentFragment();

    activations.forEach(({ row, col, special, type }) => {
      const { x, y } = this.centreOf(geo, row, col);

      if (special === SPECIAL.LINE_H || special === SPECIAL.LINE_V) {
        const beam = document.createElement('i');
        beam.className = special === SPECIAL.LINE_V ? 'beam beam-v' : 'beam';
        if (special === SPECIAL.LINE_V) {
          beam.style.left = `${x - geo.w * 0.18}px`;
          beam.style.top = '0px';
          beam.style.width = `${geo.w * 0.36}px`;
          beam.style.height = '100%';
        } else {
          beam.style.top = `${y - geo.h * 0.18}px`;
          beam.style.left = '0px';
          beam.style.height = `${geo.h * 0.36}px`;
          beam.style.width = '100%';
        }
        beam.addEventListener('animationend', () => beam.remove(), { once: true });
        frag.appendChild(beam);
        return;
      }

      // Bomb: a shockwave the size of its 3x3. Wildcard: one that swallows the board.
      const wave = document.createElement('i');
      wave.className = special === SPECIAL.WILDCARD ? 'blast blast-wild' : 'blast';
      const size = special === SPECIAL.WILDCARD
        ? Math.max(geo.strideX, geo.strideY) * this.board.cols * 1.5
        : geo.strideX * 3.1;
      wave.style.left = `${x}px`;
      wave.style.top = `${y}px`;
      wave.style.width = `${size}px`;
      wave.style.height = `${size}px`;
      if (special !== SPECIAL.WILDCARD) wave.style.color = `var(--n-${type})`;
      wave.addEventListener('animationend', () => wave.remove(), { once: true });
      frag.appendChild(wave);
    });

    this.dom.fx.appendChild(frag);
  }

  /** Animates gravity and refill together: everything slides into its new row. */
  async animateCollapse({ falls, spawns }) {
    const touched = [];

    spawns.forEach(({ node, spawnRow, col }) => {
      let el = this.els.get(node.id);
      if (!el) el = this.createElement(node);
      el.dataset.type = node.type;
      const info = TYPE_INFO.get(node.type) || NODE_TYPES[0];
      el._use.setAttribute('href', `#sym-${info.symbol}`);
      this.place(el, spawnRow, col, true);
      el.classList.add('is-spawning');
      touched.push(el);
    });

    if (!falls.length && !spawns.length) return;

    // One flush, then let every transform transition run together.
    reflow(this.dom.nodes);

    falls.forEach(({ node }) => {
      const el = this.els.get(node.id);
      if (el) {
        this.applyNode(el, node);
        touched.push(el);
      }
    });
    spawns.forEach(({ node }) => {
      const el = this.els.get(node.id);
      if (el) this.applyNode(el, node);
    });

    await waitFor('FALL');
    touched.forEach((el) => {
      el.classList.remove('is-spawning');
      if (!reducedMotion()) {
        el.classList.add('is-landed');
        setTimeout(() => el.classList.remove('is-landed'), 200);
      }
    });
  }

  /** Reshuffle: every node glides to its new home. */
  async animateShuffle() {
    this.dom.nodes.querySelectorAll('.node').forEach((el) => el.classList.add('is-swapping'));
    this.syncAll();
    await waitFor('FALL');
    this.dom.nodes.querySelectorAll('.node').forEach((el) => el.classList.remove('is-swapping'));
  }

  /* ---------------- feedback ---------------- */

  floatScore(cell, text) {
    const geo = this.geometry();
    if (!geo) return;
    const { x, y } = this.centreOf(geo, cell.row, cell.col);
    const el = document.createElement('span');
    el.className = 'float-score';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.addEventListener('animationend', () => el.remove(), { once: true });
    this.dom.fx.appendChild(el);
  }

  showCombo(text) {
    const el = this.dom.combo;
    el.textContent = text;
    el.classList.remove('is-on');
    reflow(el);
    el.classList.add('is-on');
  }

  showBanner(text) {
    const el = this.dom.banner;
    el.textContent = text;
    el.classList.remove('is-on');
    reflow(el);
    el.classList.add('is-on');
  }

  flash(kind = '') {
    const el = this.dom.flash;
    el.className = 'board-flash';
    reflow(el);
    el.classList.add('is-flash');
    if (kind) el.classList.add(kind);
    setTimeout(() => { el.className = 'board-flash'; }, 400);
  }

  async surge() {
    const el = this.dom.flash;
    el.className = 'board-flash is-surge';
    this.shake();
    await waitFor('OVERLOAD');
    el.className = 'board-flash';
  }

  shake() {
    if (reducedMotion()) return;
    const { board } = this.dom;
    board.classList.remove('is-shake');
    reflow(board);
    board.classList.add('is-shake');
    setTimeout(() => board.classList.remove('is-shake'), 340);
  }

  setDead(on) {
    this.dom.board.classList.toggle('is-dead', !!on);
  }

  /* ---------------- HUD ---------------- */

  /** Rolls the score display up to `target` rather than snapping. */
  setScore(target, { immediate = false } = {}) {
    const el = this.dom.score;
    cancelAnimationFrame(this.scoreRaf);
    // A hidden tab produces no frames, so roll only when we know frames will come.
    if (immediate || reducedMotion() || document.hidden) {
      this.displayedScore = target;
      el.textContent = formatNumber(target);
      return;
    }
    if (target > this.displayedScore) {
      el.classList.remove('is-bump');
      reflow(el);
      el.classList.add('is-bump');
    }
    const from = this.displayedScore;
    const delta = target - from;
    if (delta === 0) return;
    const span = Math.min(700, 220 + Math.abs(delta) * 0.5);
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / span);
      const eased = 1 - (1 - p) ** 3;
      this.displayedScore = from + delta * eased;
      el.textContent = formatNumber(this.displayedScore);
      if (p < 1) {
        this.scoreRaf = requestAnimationFrame(tick);
      } else {
        this.displayedScore = target;
        el.textContent = formatNumber(target);
      }
    };
    this.scoreRaf = requestAnimationFrame(tick);
  }

  setBest(value) {
    this.dom.best.textContent = formatNumber(value);
    this.dom.menuBest.textContent = formatNumber(value);
  }

  /**
   * `moveNumber` is the count of valid moves made so far; the readout shows what
   * the *next* move will cost, and flashes when the ramp steps up.
   */
  setHeat(heat, { cooled = false, moveNumber = null } = {}) {
    if (moveNumber !== null) this.moveNumber = moveNumber;
    const nextRate = heatForMove((this.moveNumber || 0) + 1);
    if (nextRate !== this.shownRate) {
      const rateEl = this.dom.heatRate;
      rateEl.textContent = `+${nextRate}/MOVE`;
      if (this.shownRate !== undefined) {
        rateEl.classList.remove('is-bump');
        reflow(rateEl);
        rateEl.classList.add('is-bump');
      }
      this.shownRate = nextRate;
    }

    const pct = Math.round(heat.value);
    const stage = heat.stage;
    this.dom.heatFill.style.width = `${Math.max(1.5, heat.value)}%`;
    this.dom.heatValue.textContent = `${pct}%`;
    this.dom.heatStatus.textContent = stage.status;
    this.dom.game.dataset.heat = stage.key;
    this.dom.heatTrack.setAttribute('aria-valuenow', String(pct));
    if (cooled) {
      const fill = this.dom.heatFill;
      fill.classList.remove('is-cooling');
      reflow(fill);
      fill.classList.add('is-cooling');
      setTimeout(() => fill.classList.remove('is-cooling'), 460);
    }
  }

  announce(text) {
    this.dom.live.textContent = text;
  }

  async pause(name) {
    await waitFor(name);
  }

  static async idle(ms) {
    await wait(ms);
  }
}
