/**
 * game.js — Session orchestration: one level, start to finish.
 *
 * Owns the maze, the entities, the scoring and the run state machine
 * (ready → playing → dying → complete). Everything that needs to reach the UI
 * leaves through `onEvent`, so this module never touches the DOM.
 */

import { CFG, COLORS, RANKS } from './config.js';
import { Maze } from './maze.js';
import { Player } from './player.js';
import { Drone } from './drone.js';
import { ShiftController, shiftLabel } from './shift.js';
import { ParticleSystem, makeEffects } from './particles.js';
import { getLevel, TOTAL_LEVELS } from './levels.js';
import { storage } from './storage.js';
import { audio } from './audio.js';
import { clamp } from './utils.js';

/** Run phases inside a level. */
export const RUN = Object.freeze({
  READY: 'ready',
  PLAYING: 'playing',
  DYING: 'dying',
  COMPLETE: 'complete',
});

export class Game {
  /**
   * @param {import('./renderer.js').Renderer} renderer
   * @param {(name:string, payload?:object)=>void} onEvent
   */
  constructor(renderer, onEvent) {
    this.renderer = renderer;
    this.onEvent = onEvent || (() => {});

    this.particles = new ParticleSystem();
    this.fx = makeEffects(this.particles, COLORS);

    /** @type {Maze|null} */
    this.maze = null;
    /** @type {Player|null} */
    this.player = null;
    /** @type {Drone[]} */
    this.drones = [];
    /** @type {ShiftController|null} */
    this.shift = null;

    this.level = null;
    this.run = RUN.READY;
    this.paused = false;

    this.time = 0;
    this.readyTimer = 0;
    this.freezeTimer = 0;
    this.score = 0;
    this.deaths = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.shiftsUsed = 0;
    this.dronesEaten = 0;
    this.secretsFound = 0;
    this.totalNodes = 0;

    // Global scatter/chase clock, shared by every non-sentinel drone.
    this.phaseIndex = 0;
    this.phaseTimer = 0;
    this.phase = 'patrol';

    /** Set when the level ends; consumed by the results screen. */
    this.result = null;
    /** Accumulates run stats to fold into the profile on completion. */
    this._pendingStats = null;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  /**
   * @param {number} number 1-based level number
   */
  loadLevel(number) {
    const level = getLevel(number);
    if (!level) throw new Error(`No such level: ${number}`);

    this.level = level;
    this.maze = new Maze(level);
    this.player = new Player(this.maze);
    this.shift = new ShiftController(this.maze);

    const speed = Math.min(CFG.DRONE_SPEED_MAX, CFG.DRONE_SPEED + (number - 1) * CFG.DRONE_SPEED_RAMP);
    this.drones = this.maze.droneSpawns.map((spawn, i) => new Drone(this.maze, spawn, i, speed));

    this.particles.clear();
    this.particles.enabled = storage.getSetting('particles') !== false;

    this.totalNodes = this.maze.nodesRemaining;
    this.run = RUN.READY;
    this.paused = false;
    this.time = 0;
    this.readyTimer = CFG.READY_TIME;
    this.freezeTimer = 0;
    this.score = 0;
    this.deaths = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.shiftsUsed = 0;
    this.dronesEaten = 0;
    this.secretsFound = 0;
    this.phaseIndex = 0;
    this.phaseTimer = CFG.PHASE_PATTERN[0];
    this.phase = 'patrol';
    this.result = null;
    this._pendingStats = { nodes: 0, drones: 0, shifts: 0, secrets: 0 };

    this.renderer.setMaze(this.maze);
    this.renderer.showToast(`SECTOR ${String(number).padStart(2, '0')}`, level.name.toUpperCase(), COLORS.player, 1.6);
    this.fx.spawnIn(this.player.tx, this.player.ty);

    this.onEvent('levelLoaded', { level });
    this._emitHud();
  }

  restart() {
    if (this.level) this.loadLevel(this.level.number);
  }

  // ── Input ─────────────────────────────────────────────────────────────────
  handleDirection(dir) {
    if (this.paused || !this.player) return;
    if (this.run === RUN.READY) {
      // Let an eager player pre-load their first turn during the countdown.
      this.player.request(dir);
      return;
    }
    if (this.run !== RUN.PLAYING) return;
    const before = this.player.dir;
    this.player.request(dir);
    if (before !== this.player.dir) audio.play('move');
  }

  // ── Frame ─────────────────────────────────────────────────────────────────
  /**
   * @param {number} dt seconds, already clamped by the caller
   */
  update(dt) {
    if (!this.maze || this.paused) return;

    // The shift animation freezes gameplay so a rotation is legible, but the
    // shift controller itself keeps ticking so the animation can finish.
    if (this.freezeTimer > 0) {
      this.freezeTimer = Math.max(0, this.freezeTimer - dt);
      this.shift.update(dt, this.player);
      this.particles.update(dt);
      return;
    }

    switch (this.run) {
      case RUN.READY:
        this.readyTimer -= dt;
        this.particles.update(dt);
        if (this.readyTimer <= 0) {
          this.run = RUN.PLAYING;
          this.onEvent('levelStarted', { level: this.level });
        }
        return;

      case RUN.DYING:
        this.player.deathTimer += dt;
        this.particles.update(dt);
        if (this.player.deathTimer >= CFG.DEATH_FREEZE) this._respawn();
        return;

      case RUN.COMPLETE:
        this.particles.update(dt);
        return;

      default:
        break;
    }

    this.time += dt;
    this._updatePhase(dt);

    const retraction = this.shift.update(dt, this.player);
    if (retraction.retracted) {
      audio.play('wall');
      for (const c of retraction.cells) this.fx.wallDust(c.x, c.y);
      this.renderer.addShake(0.18);
    }

    this.player.update(dt, (x, y) => this._onPlayerTile(x, y));
    if (this.player.consumeTrailTick()) this.fx.trail(this.player.px, this.player.py);

    const ctx = { player: this.player, phase: this.phase, powerActive: this.player.powered };
    for (const drone of this.drones) {
      const wasFrightened = drone.frightened;
      drone.update(dt, ctx);
      if (drone.justSpotted) audio.play('spotted');
      if (wasFrightened && !this.player.powered) drone.unfrighten();
    }

    if (!this.player.powered && this.combo > 0) this.combo = 0;

    this._checkCollisions();
    this.particles.update(dt);

    audio.setIntensity(this.totalNodes ? 1 - this.maze.nodesRemaining / this.totalNodes : 0);

    if (this.maze.cleared) this._completeLevel();
  }

  /** Alternates the global scatter/chase phases, pausing while powered. */
  _updatePhase(dt) {
    if (this.player.powered) return;
    this.phaseTimer -= dt;
    if (this.phaseTimer > 0) return;
    this.phaseIndex = (this.phaseIndex + 1) % CFG.PHASE_PATTERN.length;
    this.phaseTimer = CFG.PHASE_PATTERN[this.phaseIndex];
    this.phase = this.phaseIndex % 2 === 0 ? 'patrol' : 'chase';
  }

  // ── Player tile events ────────────────────────────────────────────────────
  _onPlayerTile(x, y) {
    const picked = this.maze.collect(x, y);

    if (picked.node) {
      this.score += CFG.SCORE_NODE;
      this._pendingStats.nodes++;
      this.fx.nodeCollect(x, y);
      audio.play('node', { index: this.totalNodes - this.maze.nodesRemaining });
      this._emitHud();
    }
    if (picked.secretNode) {
      this.score += CFG.SCORE_SECRET_NODE;
      this.fx.secretNode(x, y);
      audio.play('secretNode');
      this._emitHud();
    }
    if (picked.power) {
      this.score += CFG.SCORE_POWER;
      this.player.startPower();
      this.combo = 0;
      for (const d of this.drones) d.frighten();
      this.fx.power(x, y);
      audio.play('power');
      this.renderer.addFlash(COLORS.power, 0.28);
      this.renderer.addShake(0.3);
      this.renderer.showToast('OVERLOAD', 'Drones vulnerable', COLORS.power, 1.3);
      this._emitHud();
    }

    const secret = this.maze.undiscoveredSecretAt(x, y);
    if (secret) {
      secret.found = true;
      this.secretsFound++;
      this._pendingStats.secrets++;
      this.score += CFG.SCORE_SECRET;
      this.fx.secretFound(x, y);
      audio.play('secret');
      this.renderer.addFlash(COLORS.secret, 0.3);
      this.renderer.showToast('SECRET FOUND', `+${CFG.SCORE_SECRET}`, COLORS.secret, 1.8);
      if (storage.stats.totalSecrets + this._pendingStats.secrets >= 10) this._award('secret_finder');
      this._emitHud();
    }

    const terminal = this.maze.terminalAt(x, y);
    if (terminal) this._tryShift(terminal);
  }

  _tryShift(terminal) {
    if (terminal.exhausted) return;
    if (!this.shift.ready) {
      // Only nag once per approach, and only if it is nearly charged.
      if (this.shift.cooldown < CFG.SHIFT_COOLDOWN * 0.9) {
        this.renderer.showToast('RECHARGING', `${this.shift.cooldown.toFixed(1)}s`, COLORS.textDim, 0.9);
      }
      return;
    }

    const outcome = this.shift.activate(terminal, this.player, this.drones);
    if (!outcome.ok) {
      audio.play('shiftDenied');
      this.renderer.showToast('SHIFT REFUSED', outcome.reason, COLORS.danger, 1.6);
      return;
    }

    this.shiftsUsed++;
    this._pendingStats.shifts++;
    this.freezeTimer = CFG.SHIFT_ANIM_TIME;

    if (outcome.firstUse) {
      this.score += CFG.SCORE_SHIFT;
      this.renderer.showToast(shiftLabel(terminal.shift).toUpperCase(), `+${CFG.SCORE_SHIFT}`, COLORS.terminal, 1.5);
    } else {
      this.renderer.showToast(shiftLabel(terminal.shift).toUpperCase(), '', COLORS.terminal, 1.1);
    }

    audio.play('shift');
    audio.play('wall');
    this.renderer.addShake(0.55);
    this.renderer.addFlash(COLORS.terminal, 0.25);
    for (let i = 0; i < 5; i++) this.fx.shiftSpark(terminal.x, terminal.y);
    for (const m of outcome.moved || []) this.fx.wallDust(m.to.x, m.to.y);

    this._award('first_shift');
    this._emitHud();
  }

  // ── Collisions ────────────────────────────────────────────────────────────
  _checkCollisions() {
    const catchSq = CFG.CATCH_DISTANCE * CFG.CATCH_DISTANCE;
    for (const drone of this.drones) {
      const dx = drone.px - this.player.px;
      const dy = drone.py - this.player.py;
      if (dx * dx + dy * dy > catchSq) continue;

      if (drone.edible) {
        this._eatDrone(drone);
      } else if (drone.dangerous && !this.player.intangible) {
        this._killPlayer();
        return;
      }
    }
  }

  _eatDrone(drone) {
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this.dronesEaten++;
    this._pendingStats.drones++;

    const points = Math.min(CFG.SCORE_DRONE_MAX, CFG.SCORE_DRONE_BASE * Math.pow(2, this.combo - 1));
    this.score += points;

    drone.consume();
    this.fx.droneExplode(drone.px, drone.py, drone.color);
    audio.play('droneEaten', { index: this.combo - 1 });
    this.renderer.addShake(0.35);
    this.renderer.showToast(`+${points}`, this.combo > 1 ? `COMBO ×${this.combo}` : '', COLORS.frightenedFlash, 1.0);

    if (this.combo >= 4) this._award('combo_master');
    if (storage.stats.totalDrones + this._pendingStats.drones >= 25) this._award('drone_hunter');
    this._emitHud();
  }

  _killPlayer() {
    this.player.alive = false;
    this.player.deathTimer = 0;
    this.deaths++;
    this.combo = 0;
    this.run = RUN.DYING;

    this.fx.playerDeath(this.player.px, this.player.py);
    audio.play('death');
    this.renderer.addShake(1);
    this.renderer.addFlash(COLORS.danger, 0.45);
    this.renderer.showToast('SIPHON LOST', 'Respawning…', COLORS.danger, 1.2);
    storage.streak = 0;
    this._emitHud();
  }

  _respawn() {
    this.player.respawn();
    this.player.spawnTimer = 0.4;
    for (const drone of this.drones) drone.reset();
    this.shift.cooldown = Math.min(this.shift.cooldown, CFG.SHIFT_COOLDOWN * 0.5);
    this.phaseIndex = 0;
    this.phaseTimer = CFG.PHASE_PATTERN[0];
    this.phase = 'patrol';
    this.run = RUN.READY;
    this.readyTimer = CFG.READY_TIME;
    this.fx.spawnIn(this.player.tx, this.player.ty);
    audio.play('respawn');
  }

  // ── Completion ────────────────────────────────────────────────────────────
  _completeLevel() {
    this.run = RUN.COMPLETE;

    const level = this.level;
    const secretsTotal = this.maze.secrets.length;
    const perfect = this.deaths === 0 && this.secretsFound === secretsTotal && this.time <= level.targetTime;
    if (perfect) this.score += CFG.SCORE_PERFECT;

    const rating = this._rating(secretsTotal);
    const rank = RANKS.find((r) => rating >= r.min).key;

    const record = storage.getLevelRecord(level.id);
    const previousBestTime = record.bestTime;
    const previousBestScore = record.bestScore;

    const result = {
      level,
      score: this.score,
      time: this.time,
      deaths: this.deaths,
      bestCombo: this.bestCombo,
      secrets: this.secretsFound,
      secretsTotal,
      shiftsUsed: this.shiftsUsed,
      dronesEaten: this.dronesEaten,
      targetTime: level.targetTime,
      rank,
      rating,
      perfect,
      previousBestTime,
      previousBestScore,
      isLastLevel: level.number >= TOTAL_LEVELS,
      unlockedNext: false,
      newAchievements: [],
    };

    // ── Persist ─────────────────────────────────────────────────────────────
    const improved = storage.saveLevelResult(level.id, result);
    result.improved = improved;

    if (level.number < TOTAL_LEVELS && storage.unlocked < level.number + 1) {
      storage.unlock(level.number + 1);
      result.unlockedNext = true;
    }

    storage.addStats({
      levelsCompleted: 1,
      totalScore: this.score,
      totalDeaths: this.deaths,
      totalNodes: this._pendingStats.nodes,
      totalDrones: this._pendingStats.drones,
      totalShifts: this._pendingStats.shifts,
      totalSecrets: this._pendingStats.secrets,
      bestCombo: this.bestCombo,
      playTime: this.time,
    });

    // ── Achievements ────────────────────────────────────────────────────────
    if (this.deaths === 0) {
      this._award('perfect_escape', result);
      storage.streak++;
      if (storage.streak >= 5) this._award('zero_death_run', result);
    } else {
      storage.streak = 0;
    }
    if (this.time <= level.targetTime * 0.5) this._award('speed_runner', result);
    if (this._allSPlus()) this._award('master_hacker', result);

    audio.play('victory');
    this.renderer.addFlash(COLORS.player, 0.4);
    this.fx.secretFound(this.player.px, this.player.py);

    this.result = result;
    this.onEvent('levelComplete', result);
  }

  /**
   * 0–100 performance rating. Time is the dominant term; deaths and missed
   * secrets each shave a fixed slice so the grade reads intuitively.
   */
  _rating(secretsTotal) {
    const level = this.level;
    const ratio = this.time / level.targetTime;
    const timePenalty = clamp((ratio - 1) * 50, 0, 55);
    const deathPenalty = Math.min(45, this.deaths * 12);
    const secretPenalty = secretsTotal ? (secretsTotal - this.secretsFound) * 10 : 0;
    return clamp(Math.round(100 - timePenalty - deathPenalty - secretPenalty), 0, 100);
  }

  _allSPlus() {
    for (let n = 1; n <= TOTAL_LEVELS; n++) {
      const rec = storage.getLevelRecord(`L${String(n).padStart(2, '0')}`);
      if (rec.rank !== 'S+') return false;
    }
    return true;
  }

  _award(id, result) {
    if (!storage.award(id)) return;
    if (result) result.newAchievements.push(id);
    this.onEvent('achievement', { id });
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  _emitHud() {
    this.onEvent('hud', {
      score: this.score,
      nodes: this.maze.nodesRemaining,
      totalNodes: this.totalNodes,
      deaths: this.deaths,
      combo: this.combo,
      shiftReady: this.shift.ready,
      shiftFraction: this.shift.cooldownFraction,
      secrets: this.secretsFound,
      secretsTotal: this.maze.secrets.length,
      targetTime: this.level.targetTime,
    });
  }

  /** Values the HUD needs every frame rather than on change. */
  liveHud() {
    return {
      time: this.time,
      shiftFraction: this.shift ? this.shift.cooldownFraction : 1,
      shiftReady: this.shift ? this.shift.ready : false,
      power: this.player ? this.player.powerRemaining : 0,
      bridge: this.shift ? this.shift.bridgeTimeRemaining : 0,
      targetTime: this.level ? this.level.targetTime : 0,
      phase: this.phase,
      phaseTimer: this.phaseTimer,
    };
  }

  /** Bundle handed to the renderer each frame. */
  scene() {
    return {
      maze: this.maze,
      player: this.player,
      drones: this.drones,
      particles: this.particles,
      shift: this.shift,
      run: this.run,
    };
  }

  get readyCountdown() {
    return this.run === RUN.READY ? this.readyTimer : 0;
  }
}
