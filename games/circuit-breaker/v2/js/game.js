/**
 * Game controller: one authoritative state machine driving one authoritative
 * board model.
 *
 * Turn shape: swap → resolve (match, clear, gravity, refill, repeat) → settle
 * (deadlock check, overload check) → hand control back. Input is only ever
 * enabled in PLAYER_TURN. Every async step is fenced by a run token so a
 * restart can never let an abandoned turn touch the new board.
 */

import { CONFIG, heatForMove } from './config.js';
import { Board } from './board.js';
import { findMatchGroups, groupCells, planSpecials, expandActivations } from './matches.js';
import { evaluateStep, cascadeLabel } from './scoring.js';
import { Heat } from './heat.js';
import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { Tutorial } from './tutorial.js';
import { audio, HAPTIC } from './audio.js';
import { storage } from './storage.js';
import { wait, waitFor, duration, clearAllTimers, formatNumber } from './utils.js';

export const STATE = {
  MENU: 'MENU',
  STARTING: 'STARTING',
  PLAYER_TURN: 'PLAYER_TURN',
  SWAPPING: 'SWAPPING',
  RESOLVING: 'RESOLVING',
  DROPPING: 'DROPPING',
  REFILLING: 'REFILLING',
  RESHUFFLING: 'RESHUFFLING',
  PAUSED: 'PAUSED',
  GAME_OVER: 'GAME_OVER',
};

const ABORTED = Symbol('aborted-turn');

function freshStats() {
  return {
    score: 0,
    validMoves: 0,
    invalidSwaps: 0,
    nodesCleared: 0,
    longestMatch: 0,
    largestCascade: 0,
    specialsCreated: 0,
    specialsActivated: 0,
    peakHeat: CONFIG.STARTING_HEAT,
    totalCooled: 0,
  };
}

export class Game {
  constructor({ dom, onGameOver, onPauseParked }) {
    this.dom = dom;
    this.onGameOver = onGameOver;
    this.onPauseParked = onPauseParked;

    this.board = new Board();
    this.heat = new Heat();
    this.renderer = new Renderer(this.board, dom);
    this.tutorial = new Tutorial({ dom, renderer: this.renderer, board: this.board });
    this.input = new Input(this.board, this.renderer, {
      onSwapRequest: (a, b) => this.attemptSwap(a, b),
      onSelect: () => audio.play('select'),
      onGesture: () => audio.unlock(),
    });
    this.input.attach();

    this.state = STATE.MENU;
    this.runId = 0;
    this.score = 0;
    this.stats = freshStats();
    this.pauseRequested = false;
    this.lastHeatStage = 'stable';
  }

  /* ---------------- state ---------------- */

  setState(next) {
    this.state = next;
    this.dom.game.dataset.state = next;
  }

  get isRunning() {
    return this.state !== STATE.MENU && this.state !== STATE.GAME_OVER;
  }

  get isIdle() {
    return this.state === STATE.PLAYER_TURN || this.state === STATE.PAUSED;
  }

  guard(run) {
    if (run !== this.runId) throw ABORTED;
  }

  /* ---------------- lifecycle ---------------- */

  newGame() {
    this.runId++;
    clearAllTimers();
    this.pauseRequested = false;
    this.setState(STATE.STARTING);

    this.score = 0;
    this.stats = freshStats();
    this.heat.reset();
    this.lastHeatStage = this.heat.stage.key;

    this.board.generate();
    this.renderer.syncTimingVars();
    this.renderer.mount();
    this.renderer.syncAll({ instant: true });
    this.renderer.setDead(false);
    this.renderer.setScore(0, { immediate: true });
    this.renderer.setBest(storage.bestScore);
    this.renderer.setHeat(this.heat, { moveNumber: 0 });
    this.renderer.announce('New run started. System stable.');

    this.input.cursor = null;
    this.input.clearSelection();
    this.setState(STATE.PLAYER_TURN);
    this.input.setEnabled(true);
    this.tutorial.startRun();
  }

  /** Stops the current run's async work without starting a new one. */
  abandon() {
    this.runId++;
    clearAllTimers();
    this.input.setEnabled(false);
    this.pauseRequested = false;
    this.tutorial.hide();
    this.renderer.clearHint();
    this.setState(STATE.MENU);
  }

  pause() {
    if (!this.isRunning || this.state === STATE.PAUSED) return;
    this.pauseRequested = true;
    this.input.setEnabled(false);
    this.tutorial.hide();
    if (this.state === STATE.PLAYER_TURN) this.parkPaused();
  }

  parkPaused() {
    this.setState(STATE.PAUSED);
    this.onPauseParked?.();
  }

  resume() {
    this.pauseRequested = false;
    if (this.state !== STATE.PAUSED) return;
    this.setState(STATE.PLAYER_TURN);
    this.input.setEnabled(true);
    this.tutorial.hintMove();
  }

  /* ---------------- a turn ---------------- */

  async attemptSwap(a, b) {
    if (this.state !== STATE.PLAYER_TURN) return;
    if (!Board.isAdjacent(a, b)) return;
    if (!this.board.at(a.row, a.col) || !this.board.at(b.row, b.col)) return;

    const run = this.runId;
    this.input.setEnabled(false);
    this.setState(STATE.SWAPPING);

    try {
      if (!this.board.swapCreatesMatch(a, b)) {
        this.stats.invalidSwaps++;
        audio.play('invalid');
        audio.buzz(HAPTIC.invalid);
        await this.renderer.animateRejectedSwap(a, b);
        this.guard(run);
        this.setState(STATE.PLAYER_TURN);
        this.input.setEnabled(true);
        if (this.pauseRequested) this.parkPaused();
        return;
      }

      this.board.swap(a, b);
      audio.play('swap');
      await this.renderer.animateSwap(a, b);
      this.guard(run);

      this.stats.validMoves++;
      this.heat.add(heatForMove(this.stats.validMoves));
      this.renderer.setHeat(this.heat, { moveNumber: this.stats.validMoves });
      this.noteHeatStage();

      const turn = await this.resolve(run, [a, b]);
      this.guard(run);
      this.tutorial.onTurnResolved(turn);
      await this.settle(run);
    } catch (err) {
      if (err !== ABORTED) throw err;
    }
  }

  /**
   * Clears every match on the board, then keeps going while gravity and refill
   * create new ones. Returns the shape of the whole turn.
   */
  async resolve(run, originCells) {
    this.setState(STATE.RESOLVING);
    let step = 0;
    let longestMatch = 0;

    for (;;) {
      const groups = findMatchGroups(this.board.grid);
      if (!groups.length) break;

      step++;
      const matched = groupCells(groups);
      const stepLongest = groups.reduce((m, g) => Math.max(m, g.length), 0);
      longestMatch = Math.max(longestMatch, stepLongest);
      this.stats.longestMatch = Math.max(this.stats.longestMatch, stepLongest);
      this.stats.largestCascade = Math.max(this.stats.largestCascade, step);

      // Specials are planned from the match shape *before* anything is cleared.
      const plans = planSpecials(groups, step === 1 ? originCells : []);

      await this.renderer.chargeCells(matched);
      this.guard(run);

      const { cells, activations, keys } = expandActivations(this.board, matched);
      if (activations.length) {
        this.renderer.showBeams(activations);
        audio.play('specialActivate');
        audio.buzz(HAPTIC.bigMatch);
        const extra = cells.filter((c) => !matched.some((m) => m.row === c.row && m.col === c.col));
        await this.renderer.chargeCells(extra);
        this.guard(run);
      }

      const fullLines = this.board.countFullLines(keys);
      const { points, cooling, multiplier } = evaluateStep({
        groups,
        activations: activations.length,
        fullLines,
        clearedCount: cells.length,
        step,
      });

      if (stepLongest >= 5 || activations.length || fullLines) {
        audio.play('matchBig', step);
        audio.buzz(HAPTIC.bigMatch);
      } else {
        audio.play('match', step);
        audio.buzz(HAPTIC.match);
      }
      if (step >= 2) {
        audio.play('cascade', step);
        if (step >= 3) audio.buzz(HAPTIC.cascade);
      }
      this.renderer.flash();

      await this.renderer.dischargeCells(cells);
      this.guard(run);

      const removed = this.board.clearCells(cells);
      this.stats.nodesCleared += removed.length;
      this.stats.specialsActivated += activations.length;

      plans.forEach((plan) => {
        if (this.board.at(plan.row, plan.col)) return; // cell somehow refilled
        this.board.placeNode(plan.row, plan.col, plan.type, plan.special);
        this.stats.specialsCreated++;
      });
      if (plans.length) audio.play('specialCreate');
      this.renderer.syncAll({ instant: true });

      this.score += points;
      this.stats.score = this.score;
      this.renderer.setScore(this.score);
      this.renderer.floatScore(anchorCell(matched), `+${formatNumber(points)}`);

      const cooled = this.heat.cool(cooling);
      this.stats.totalCooled = this.heat.totalCooled;
      this.stats.peakHeat = this.heat.peak;
      this.renderer.setHeat(this.heat, { cooled: cooled > 0 });
      if (cooled > 0) {
        this.renderer.flash('is-cool');
        audio.play('cool');
      }
      this.noteHeatStage();

      const label = cascadeLabel(step);
      if (label) this.renderer.showCombo(`${label} · ×${multiplier.toFixed(1)}`);

      this.setState(STATE.DROPPING);
      const collapse = this.board.collapse();
      this.setState(STATE.REFILLING);
      await this.renderer.animateCollapse(collapse);
      this.guard(run);

      this.setState(STATE.RESOLVING);
      await waitFor('CASCADE_PAUSE');
      this.guard(run);
    }

    if (step > 0) {
      this.renderer.announce(
        `Cleared ${this.stats.nodesCleared} nodes. Score ${formatNumber(this.score)}. Heat ${Math.round(this.heat.value)} percent.`,
      );
    }
    return { cascadeDepth: step, longestMatch };
  }

  /** Post-resolution housekeeping: overload, deadlock, then back to the player. */
  async settle(run) {
    if (this.heat.overloaded) {
      await this.triggerGameOver(run);
      return;
    }

    let guardCount = 0;
    while (!this.board.findPossibleMove() && guardCount++ < 10) {
      this.setState(STATE.RESHUFFLING);
      this.input.setEnabled(false);
      audio.play('deadlock');
      this.renderer.showBanner('GRID DEADLOCK');
      this.renderer.announce('No moves available. Reshuffling the grid.');
      this.renderer.shake();
      await waitFor('DEADLOCK');
      this.guard(run);
      this.board.reshuffle();
      await this.renderer.animateShuffle();
      this.guard(run);
    }

    if (this.pauseRequested) {
      this.parkPaused();
      return;
    }

    this.setState(STATE.PLAYER_TURN);
    this.input.setEnabled(true);
    this.tutorial.hintMove();
  }

  noteHeatStage() {
    const stage = this.heat.stage.key;
    if (stage !== this.lastHeatStage) {
      if (stage === 'critical' || stage === 'overload') {
        audio.play('heatWarning');
        audio.buzz(HAPTIC.critical);
        this.renderer.announce(this.heat.stage.status);
      }
      this.lastHeatStage = stage;
    }
  }

  async triggerGameOver(run) {
    this.setState(STATE.GAME_OVER);
    this.input.setEnabled(false);
    this.tutorial.hide();
    this.renderer.clearHint();
    this.renderer.setHeat(this.heat);
    audio.play('gameOver');
    audio.buzz(HAPTIC.gameOver);

    await this.renderer.surge();
    this.guard(run);
    this.renderer.setDead(true);
    await wait(duration('CASCADE_PAUSE'));
    this.guard(run);

    this.stats.score = this.score;
    this.stats.peakHeat = this.heat.peak;
    this.stats.totalCooled = this.heat.totalCooled;
    const isBest = storage.recordGame(this.stats);
    this.renderer.setBest(storage.bestScore);
    this.renderer.announce(`System overload. Final score ${formatNumber(this.score)}.`);
    this.onGameOver({ ...this.stats, isBest, best: storage.bestScore });
  }
}

function anchorCell(cells) {
  return cells[Math.floor(cells.length / 2)] || cells[0] || { row: 3, col: 3 };
}
