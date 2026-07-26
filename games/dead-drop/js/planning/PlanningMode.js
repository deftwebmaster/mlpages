import { simulateTurn } from '../core/TurnEngine.js';
import { computeGuardCone, computeCameraCone } from '../core/Vision.js';
import { isAdjacent, directionBetween } from './Path.js';
import { isPassable } from '../board/Board.js';
import { GAME_STATUS } from '../utils/constants.js';

// Drag-to-preview "Planning Mode": builds a candidate move sequence and, for
// each tile added, calls the exact same simulateTurn the real game uses to
// produce a chain of ghosted future states. Never touches real game state —
// only reads it — until the caller commits via Game.executePlan().
export class PlanningMode {
  constructor(level) {
    this.level = level;
    this.active = false;
    this.baseState = null;
    this.tiles = [];
    this.chain = [];
    this.dangerIndex = null;
    this.dangerReason = null;
  }

  begin(realState) {
    this.active = true;
    this.baseState = realState;
    this.tiles = [{ x: realState.player.x, y: realState.player.y }];
    this.chain = [];
    this.dangerIndex = null;
    this.dangerReason = null;
  }

  currentState() {
    return this.chain.length ? this.chain[this.chain.length - 1].state : this.baseState;
  }

  tryExtend(x, y) {
    if (!this.active) return false;
    const last = this.tiles[this.tiles.length - 1];
    if (last.x === x && last.y === y) return false;

    if (this.tiles.length >= 2) {
      const prev = this.tiles[this.tiles.length - 2];
      if (prev.x === x && prev.y === y) {
        this.tiles.pop();
        this.chain.pop();
        if (this.dangerIndex != null && this.dangerIndex >= this.chain.length) {
          this.dangerIndex = null;
          this.dangerReason = null;
        }
        return true;
      }
    }

    if (this.dangerIndex != null) return false;
    if (!isAdjacent(last, { x, y })) return false;

    const state = this.currentState();
    if (!isPassable(this.level, this.level.doorLookup, state.doors, x, y)) return false;

    const dir = directionBetween(last, { x, y });
    const result = simulateTurn(state, this.level, dir);
    if (!result.valid) return false;

    this.tiles.push({ x, y });
    this.chain.push(result);

    if (result.state.status === GAME_STATUS.FAILED) {
      this.dangerIndex = this.chain.length - 1;
      this.dangerReason = result.state.detectionReason;
    }
    return true;
  }

  hasPlan() {
    return this.tiles.length > 1;
  }

  // Steps safe to commit (excludes the fatal step, if any — Execute never
  // walks the player onto a guaranteed-detection tile).
  get executableChain() {
    if (this.dangerIndex != null) return this.chain.slice(0, this.dangerIndex);
    return this.chain;
  }

  cancel() {
    this.active = false;
    this.baseState = null;
    this.tiles = [];
    this.chain = [];
    this.dangerIndex = null;
    this.dangerReason = null;
  }

  getOverlay() {
    const safeChainLen = this.dangerIndex != null ? this.dangerIndex : this.chain.length;
    const pathTiles = this.tiles.slice(0, safeChainLen + 1);
    const lastSafeState = safeChainLen > 0 ? this.chain[safeChainLen - 1].state : this.baseState;

    const ghostGuards = lastSafeState.guards.map((g) => ({ x: g.x, y: g.y, facing: g.facing }));
    const ghostCones = [
      ...lastSafeState.guards.map((g) =>
        computeGuardCone(g, this.level.guardDefsById[g.id], this.level, lastSafeState.doors)),
      ...lastSafeState.cameras.map((c) =>
        computeCameraCone(c, this.level.cameraDefsById[c.id], this.level, lastSafeState.doors)),
    ];

    let dangerTile = null;
    if (this.dangerIndex != null) {
      dangerTile = this.tiles[this.dangerIndex + 1];
    }

    return {
      active: this.active,
      pathTiles,
      ghostGuards,
      ghostCones,
      dangerTile,
      dangerReason: this.dangerReason,
    };
  }
}
