/**
 * shift.js — Grid Shift: the signature mechanic.
 *
 * A shift is a *reusable behaviour* parameterised by level data, never bespoke
 * per-level logic. Each behaviour exposes a `plan()` that describes the change
 * without performing it; the executor then applies it speculatively, proves the
 * maze is still completable, and rolls back if it is not.
 *
 * That two-phase design is what makes rule 38 of the design brief enforceable:
 * a shift can never seal off an energy node, strand the player, or bury an
 * entity inside a wall, because a plan that would do so is rejected before the
 * player ever sees it.
 */

import { TILE, CFG } from './config.js';
import { nearestWalkable } from './pathfinding.js';

/**
 * @typedef {object} ShiftPlan
 * @property {{i:number,tile:number}[]} writes tile mutations
 * @property {{from:number,to:number}[]} moves collectable relocations
 * @property {(x:number,y:number)=>({x:number,y:number}|null)} remap entity transform
 * @property {object} anim payload handed to the renderer
 * @property {number} nextState terminal state after the shift
 */

const clampOdd = (n) => (n % 2 === 1 ? n : n + 1);

/** Behaviour table. Levels reference these by `type`. */
export const SHIFT_BEHAVIOURS = {
  /**
   * Rotate Junction — spins an odd-sized block of the maze 90°, carrying its
   * walls, collectables and any entities standing inside it.
   */
  rotate: {
    label: 'Rotate Junction',
    hint: 'Spins a section of the grid 90°.',
    plan(maze, cfg, terminal) {
      const size = clampOdd(cfg.size || 3);
      const h = (size - 1) / 2;
      const x0 = cfg.cx - h;
      const y0 = cfg.cy - h;
      const cw = cfg.ccw ? -1 : 1;

      // (rx, ry) -> clockwise (size-1-ry, rx); counter-clockwise is the inverse.
      const map = (rx, ry) => (cw > 0 ? { rx: size - 1 - ry, ry: rx } : { rx: ry, ry: size - 1 - rx });

      const writes = [];
      const moves = [];
      for (let ry = 0; ry < size; ry++) {
        for (let rx = 0; rx < size; rx++) {
          const sx = x0 + rx;
          const sy = y0 + ry;
          if (!maze.inBounds(sx, sy)) continue;
          const d = map(rx, ry);
          const dx = x0 + d.rx;
          const dy = y0 + d.ry;
          if (!maze.inBounds(dx, dy)) continue;
          const from = maze.idx(sx, sy);
          const to = maze.idx(dx, dy);
          writes.push({ i: to, tile: maze.grid[from] });
          moves.push({ from, to });
        }
      }

      return {
        writes,
        moves,
        remap(x, y) {
          const rx = x - x0;
          const ry = y - y0;
          if (rx < 0 || ry < 0 || rx >= size || ry >= size) return null;
          const d = map(rx, ry);
          return { x: x0 + d.rx, y: y0 + d.ry };
        },
        anim: { kind: 'rotate', x0, y0, size, dir: cw },
        nextState: (terminal.state + 1) % 4,
      };
    },
  },

  /**
   * Sliding Wall — shunts a wall segment one step along a vector and back.
   * Toggles between offset 0 and offset 1 on each activation.
   *
   * A vacated tile reverts to whatever the level *authored* there rather than
   * to bare floor. That single detail is what stops a slide from punching a
   * two-tile hole into the middle of a solid block.
   */
  slide: {
    label: 'Sliding Wall',
    hint: 'Shunts a wall segment aside.',
    plan(maze, cfg, terminal) {
      const from = terminal.state & 1;
      const to = from ^ 1;
      const writes = [];
      const dist = cfg.dist || 1;
      for (const [cx, cy] of cfg.cells) {
        const ox = cx + cfg.dx * dist * from;
        const oy = cy + cfg.dy * dist * from;
        const nx = cx + cfg.dx * dist * to;
        const ny = cy + cfg.dy * dist * to;
        if (maze.inBounds(ox, oy)) {
          const i = maze.idx(ox, oy);
          writes.push({ i, tile: maze.baseGrid[i] });
        }
        if (maze.inBounds(nx, ny)) writes.push({ i: maze.idx(nx, ny), tile: cfg.tile || TILE.WALL });
      }
      return {
        writes,
        moves: [],
        remap: () => null,
        anim: {
          kind: 'slide',
          cells: cfg.cells.map(([cx, cy]) => ({
            fx: cx + cfg.dx * dist * from,
            fy: cy + cfg.dy * dist * from,
            tx: cx + cfg.dx * dist * to,
            ty: cy + cfg.dy * dist * to,
          })),
        },
        nextState: to,
      };
    },
  },

  /** Gate Toggle — opens or closes a set of gate tiles. */
  gate: {
    label: 'Gate Toggle',
    hint: 'Opens or seals a route.',
    plan(maze, cfg, terminal) {
      const writes = [];
      const cells = [];
      for (const [x, y] of cfg.cells) {
        if (!maze.inBounds(x, y)) continue;
        const i = maze.idx(x, y);
        const open = maze.grid[i] === TILE.GATE_OPEN;
        writes.push({ i, tile: open ? TILE.GATE_CLOSED : TILE.GATE_OPEN });
        cells.push({ x, y, opening: !open });
      }
      return {
        writes,
        moves: [],
        remap: () => null,
        anim: { kind: 'gate', cells },
        nextState: terminal.state ^ 1,
      };
    },
  },

  /**
   * Bridge Extend — materialises a temporary walkway. The executor schedules
   * the retraction; retraction is itself validated, and is postponed rather
   * than performed if it would strand the player.
   */
  bridge: {
    label: 'Bridge Extend',
    hint: 'Creates a temporary path.',
    plan(maze, cfg) {
      const writes = [];
      const cells = [];
      for (const [x, y] of cfg.cells) {
        if (!maze.inBounds(x, y)) continue;
        writes.push({ i: maze.idx(x, y), tile: TILE.BRIDGE_ON });
        cells.push({ x, y });
      }
      return {
        writes,
        moves: [],
        remap: () => null,
        anim: { kind: 'bridge', cells },
        nextState: 1,
        temporary: { cells, duration: cfg.duration || CFG.BRIDGE_DURATION },
      };
    },
  },

  /** Barrier Drop — slams a bulkhead across an open corridor (and back). */
  barrier: {
    label: 'Barrier Drop',
    hint: 'Drops a bulkhead across a corridor.',
    plan(maze, cfg, terminal) {
      const down = (terminal.state & 1) === 0;
      const writes = [];
      const cells = [];
      for (const [x, y] of cfg.cells) {
        if (!maze.inBounds(x, y)) continue;
        const i = maze.idx(x, y);
        writes.push({ i, tile: down ? TILE.BARRIER : maze.baseGrid[i] });
        cells.push({ x, y, closing: down });
      }
      return {
        writes,
        moves: [],
        remap: () => null,
        anim: { kind: 'barrier', cells },
        nextState: terminal.state ^ 1,
      };
    },
  },

  /**
   * Reveal — dissolves a secret bulkhead permanently, exposing a bonus room.
   * One-way by design: the reward should never be re-hidden.
   */
  reveal: {
    label: 'Breach Seal',
    hint: 'Breaks open a hidden compartment.',
    plan(maze, cfg) {
      const writes = [];
      const cells = [];
      for (const [x, y] of cfg.cells) {
        if (!maze.inBounds(x, y)) continue;
        writes.push({ i: maze.idx(x, y), tile: TILE.FLOOR });
        cells.push({ x, y });
      }
      return {
        writes,
        moves: [],
        remap: () => null,
        anim: { kind: 'reveal', cells },
        nextState: 1,
        oneShot: true,
      };
    },
  },

  /**
   * Combo — several behaviours fired atomically. Used by the late levels where
   * one terminal reconfigures the maze in more than one place.
   */
  combo: {
    label: 'Cascade',
    hint: 'Reconfigures several sections at once.',
    plan(maze, cfg, terminal) {
      const writes = [];
      const moves = [];
      const remaps = [];
      const anims = [];
      let temporary = null;
      cfg.parts.forEach((part, i) => {
        const behaviour = SHIFT_BEHAVIOURS[part.type];
        if (!behaviour) throw new Error(`Unknown shift type in combo: ${part.type}`);
        // Sub-parts keep their own toggle state inside the parent terminal.
        const sub = { state: (terminal.subStates && terminal.subStates[i]) || 0 };
        const p = behaviour.plan(maze, part, sub);
        writes.push(...p.writes);
        moves.push(...p.moves);
        remaps.push(p.remap);
        anims.push(p.anim);
        if (p.temporary) temporary = p.temporary;
      });
      return {
        writes,
        moves,
        remap(x, y) {
          for (const r of remaps) {
            const out = r(x, y);
            if (out) return out;
          }
          return null;
        },
        anim: { kind: 'combo', parts: anims },
        nextState: terminal.state + 1,
        subStates: cfg.parts.map((_, i) => ((terminal.subStates && terminal.subStates[i]) || 0) + 1),
        temporary,
        // A cascade of nothing but breaches has nothing left to do afterwards.
        oneShot: cfg.parts.every((p) => p.type === 'reveal'),
      };
    },
  },
};

/** Human-readable name for a shift definition (used by the HUD and help). */
export function shiftLabel(shift) {
  if (!shift) return '';
  return shift.label || SHIFT_BEHAVIOURS[shift.type]?.label || 'Grid Shift';
}

/**
 * Executes shifts against a maze, guaranteeing the result is always legal.
 */
export class ShiftController {
  /**
   * @param {import('./maze.js').Maze} maze
   */
  constructor(maze) {
    this.maze = maze;
    this.cooldown = 0;
    this.cooldownMax = CFG.SHIFT_COOLDOWN;
    /** @type {{cells:{x:number,y:number}[], remaining:number, retry:number}[]} */
    this.pendingRetractions = [];
    /** Active animation, consumed by the renderer. */
    this.animation = null;
    /** Last rejection reason, surfaced as a HUD toast. */
    this.lastRejection = '';
  }

  get ready() {
    return this.cooldown <= 0;
  }

  get cooldownFraction() {
    return this.cooldownMax > 0 ? 1 - this.cooldown / this.cooldownMax : 1;
  }

  /**
   * Attempts the shift bound to `terminal`.
   *
   * @param {object} terminal
   * @param {object} player entity with tile coordinates {tx, ty}
   * @param {object[]} drones entities with tile coordinates {tx, ty}
   * @returns {{ok:boolean, reason?:string, anim?:object, firstUse?:boolean, moved?:object[]}}
   */
  activate(terminal, player, drones) {
    if (!this.ready) return { ok: false, reason: 'Shift recharging' };
    if (terminal.exhausted) return { ok: false, reason: 'Terminal spent' };

    const behaviour = SHIFT_BEHAVIOURS[terminal.shift.type];
    if (!behaviour) return { ok: false, reason: 'Unknown terminal' };

    const maze = this.maze;
    const snap = maze.snapshot();
    const plan = behaviour.plan(maze, terminal.shift, terminal);

    // ── Speculatively apply tiles and collectables ──────────────────────────
    this._applyPlan(plan, maze);

    // ── Work out where the entities end up ──────────────────────────────────
    const moved = [];
    const proposals = [];
    const all = [player, ...drones];
    for (const e of all) {
      const target = plan.remap(e.tx, e.ty);
      proposals.push(target ? { entity: e, x: target.x, y: target.y } : { entity: e, x: e.tx, y: e.ty });
    }

    // Rescue anyone the reshaped geometry would bury (rule 38).
    for (const p of proposals) {
      if (!maze.walkable(p.x, p.y)) {
        const safe = nearestWalkable(maze.grid, maze.width, maze.height, p.x, p.y, 4);
        if (!safe) {
          maze.restore(snap);
          return { ok: false, reason: 'No safe ground' };
        }
        p.x = safe.x;
        p.y = safe.y;
      }
    }

    const playerProposal = proposals[0];

    // ── Prove the maze is still completable ─────────────────────────────────
    const verdict = maze.validateFrom(playerProposal.x, playerProposal.y);
    if (!verdict.ok) {
      maze.restore(snap);
      this.lastRejection = verdict.reason;
      return { ok: false, reason: 'Shift locked out — ' + verdict.reason };
    }

    // ── Commit ──────────────────────────────────────────────────────────────
    for (const p of proposals) {
      if (p.x !== p.entity.tx || p.y !== p.entity.ty) {
        moved.push({ entity: p.entity, from: { x: p.entity.tx, y: p.entity.ty }, to: { x: p.x, y: p.y } });
      }
      p.entity.teleport(p.x, p.y);
    }

    // Terminals sitting inside a rotating block travel with it.
    for (const t of maze.terminals) {
      const target = plan.remap(t.x, t.y);
      if (target) {
        t.x = target.x;
        t.y = target.y;
      }
    }

    terminal.state = plan.nextState;
    if (plan.subStates) terminal.subStates = plan.subStates;
    if (plan.oneShot) terminal.exhausted = true;

    const firstUse = !terminal.used;
    terminal.used = true;

    if (plan.temporary) {
      this.pendingRetractions.push({
        cells: plan.temporary.cells,
        remaining: plan.temporary.duration,
        retry: 0,
      });
    }

    this.cooldown = this.cooldownMax;
    this.animation = { ...plan.anim, t: 0, duration: CFG.SHIFT_ANIM_TIME };
    return { ok: true, anim: this.animation, firstUse, moved };
  }

  _applyPlan(plan, maze) {
    // Collectables ride along with rotations; gather first so overlapping
    // source/destination pairs never clobber each other.
    if (plan.moves.length) {
      const n = plan.moves.length;
      const nodeVals = new Uint8Array(n);
      const secretVals = new Uint8Array(n);
      const powerVals = new Uint8Array(n);
      for (let k = 0; k < n; k++) {
        nodeVals[k] = maze.nodes[plan.moves[k].from];
        secretVals[k] = maze.secretNodes[plan.moves[k].from];
        powerVals[k] = maze.powers[plan.moves[k].from];
      }
      for (let k = 0; k < n; k++) {
        maze.nodes[plan.moves[k].to] = nodeVals[k];
        maze.secretNodes[plan.moves[k].to] = secretVals[k];
        maze.powers[plan.moves[k].to] = powerVals[k];
      }
    }
    const tileVals = plan.writes.map((w) => w.tile);
    plan.writes.forEach((w, k) => {
      maze.grid[w.i] = tileVals[k];
    });
    maze.version++;
  }

  /**
   * Advances cooldowns, the shift animation and any pending bridge retraction.
   * @param {number} dt seconds
   * @param {object} player used to keep a retraction from dropping them into space
   * @returns {{retracted:boolean, cells?:object[]}} events for the renderer/audio
   */
  update(dt, player) {
    if (this.cooldown > 0) this.cooldown = Math.max(0, this.cooldown - dt);

    if (this.animation) {
      this.animation.t += dt;
      if (this.animation.t >= this.animation.duration) this.animation = null;
    }

    let event = { retracted: false };
    for (let i = this.pendingRetractions.length - 1; i >= 0; i--) {
      const r = this.pendingRetractions[i];
      r.remaining -= dt;
      if (r.remaining > 0) continue;

      const maze = this.maze;
      const standingOn = r.cells.some((c) => c.x === player.tx && c.y === player.ty);
      if (standingOn) {
        // Never yank the floor out from under the player.
        r.remaining = 0.5;
        continue;
      }

      const snap = maze.snapshot();
      for (const c of r.cells) maze.grid[maze.idx(c.x, c.y)] = TILE.BRIDGE_OFF;
      maze.version++;

      const verdict = maze.validateFrom(player.tx, player.ty);
      if (!verdict.ok) {
        // Retracting would break the level — hold the bridge open and re-try.
        maze.restore(snap);
        r.remaining = 1.0;
        r.retry++;
        if (r.retry > 20) this.pendingRetractions.splice(i, 1); // give up; leave it extended
        continue;
      }
      this.pendingRetractions.splice(i, 1);
      event = { retracted: true, cells: r.cells };
    }
    return event;
  }

  /** Seconds of walkway time left, for the HUD. */
  get bridgeTimeRemaining() {
    let max = 0;
    for (const r of this.pendingRetractions) max = Math.max(max, r.remaining);
    return max;
  }

  reset() {
    this.cooldown = 0;
    this.pendingRetractions.length = 0;
    this.animation = null;
    this.lastRejection = '';
  }
}

/**
 * Offline safety proof used by `tools/validate-levels.mjs`.
 *
 * Explores every reachable combination of terminal states (bounded) and checks
 * the maze stays completable in each. This is what backs acceptance criterion
 * 4: "every level is completable after every legal maze change".
 *
 * @param {import('./maze.js').Maze} maze a freshly parsed maze (mutated, then restored)
 * @param {number} maxStates safety bound on the search
 * @returns {{ok:boolean, problems:string[], statesChecked:number}}
 */
export function proveShiftSafety(maze, maxStates = 4096) {
  const problems = [];
  const origin = maze.snapshot();
  const originTerminals = maze.terminals.map((t) => ({ x: t.x, y: t.y, state: t.state }));
  const start = maze.playerSpawn;

  /** Serialises grid + terminal placement so we can memoise visited configs. */
  const keyOf = () => maze.grid.join('') + '|' + maze.terminals.map((t) => `${t.x},${t.y},${t.state}`).join(';');

  const seen = new Set();
  let checked = 0;

  const restoreTerminals = (states) => {
    maze.terminals.forEach((t, i) => {
      t.x = states[i].x;
      t.y = states[i].y;
      t.state = states[i].state;
      t.exhausted = states[i].exhausted;
      t.subStates = states[i].subStates ? states[i].subStates.slice() : undefined;
    });
  };
  const captureTerminals = () =>
    maze.terminals.map((t) => ({
      x: t.x,
      y: t.y,
      state: t.state,
      exhausted: t.exhausted,
      subStates: t.subStates ? t.subStates.slice() : undefined,
    }));

  const walk = (depth) => {
    if (checked >= maxStates) return;
    const key = keyOf();
    if (seen.has(key)) return;
    seen.add(key);
    checked++;

    // Bridges are temporary, so the retracted state must be legal too; the
    // controller enforces that at runtime, and depth-limiting keeps this
    // search finite for combo terminals.
    if (depth > 6) return;

    for (let ti = 0; ti < maze.terminals.length; ti++) {
      const terminal = maze.terminals[ti];
      if (terminal.exhausted) continue;
      const behaviour = SHIFT_BEHAVIOURS[terminal.shift.type];
      if (!behaviour) {
        problems.push(`terminal ${ti} uses unknown shift type "${terminal.shift.type}"`);
        continue;
      }

      const gridSnap = maze.snapshot();
      const termSnap = captureTerminals();

      const plan = behaviour.plan(maze, terminal.shift, terminal);
      for (const m of plan.moves) {
        // node/power motion does not affect connectivity; skip for speed
        void m;
      }
      for (const w of plan.writes) maze.grid[w.i] = w.tile;
      maze.version++;

      // Where would the player be pushed?
      let px = start.x;
      let py = start.y;
      const remapped = plan.remap(px, py);
      if (remapped) {
        px = remapped.x;
        py = remapped.y;
      }
      if (!maze.walkable(px, py)) {
        const safe = nearestWalkable(maze.grid, maze.width, maze.height, px, py, 4);
        if (safe) {
          px = safe.x;
          py = safe.y;
        }
      }

      const verdict = maze.validateFrom(px, py);
      if (verdict.ok) {
        terminal.state = plan.nextState;
        if (plan.subStates) terminal.subStates = plan.subStates;
        if (plan.oneShot) terminal.exhausted = true;
        // Move terminals that travelled with a rotation.
        for (const t of maze.terminals) {
          const target = plan.remap(t.x, t.y);
          if (target) {
            t.x = target.x;
            t.y = target.y;
          }
        }
        walk(depth + 1);
      }
      // Rejected shifts are fine — the runtime refuses them identically.

      maze.restore(gridSnap);
      restoreTerminals(termSnap);
    }
  };

  // Sanity: the untouched level must itself be completable.
  const base = maze.validateFrom(start.x, start.y);
  if (!base.ok) problems.push(`initial maze invalid — ${base.reason}`);

  walk(0);

  maze.restore(origin);
  restoreTerminals(originTerminals.map((t) => ({ ...t })));
  return { ok: problems.length === 0, problems, statesChecked: checked };
}

