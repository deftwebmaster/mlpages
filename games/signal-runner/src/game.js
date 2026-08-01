/**
 * game.js — Game state machine, level lifecycle, scoring and progression.
 *
 * Authoritative state lives here and nowhere else. The renderer reads from it
 * and never writes to it; the UI drives it through explicit methods rather
 * than reaching into fields. One explicit `state` value replaces what would
 * otherwise be a scatter of booleans.
 */

import { CONFIG } from './config.js';
import { prepareLevel } from './levelLoader.js';
import { getLevelDefinition, LEVEL_COUNT } from './levels.js';
import { updateWorld } from './lanes.js';
import { Player, PlayerState, MOVE_OK, MOVE_BUSY } from './player.js';
import {
  queryHazards,
  makeHazardResult,
  isOffBoard,
  blockReason,
} from './collisions.js';
import { ParticleSystem } from './particles.js';
import { AudioEngine, vibrate } from './audio.js';
import { polarityColor, PALETTE } from './config.js';
import { clamp } from './utils.js';
import * as storage from './storage.js';

export const GameState = {
  LOADING: 'LOADING',
  MENU: 'MENU',
  LEVEL_SELECT: 'LEVEL_SELECT',
  STARTING: 'STARTING',
  PLAYING: 'PLAYING',
  PLAYER_MOVING: 'PLAYER_MOVING',
  PLAYER_DYING: 'PLAYER_DYING',
  UPLOADING: 'UPLOADING',
  PAUSED: 'PAUSED',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  SETTINGS: 'SETTINGS',
  HELP: 'HELP',
  STATS: 'STATS',
  TRANSITION: 'TRANSITION',
};

/** States in which the world simulation advances. */
const SIMULATING = new Set([
  GameState.STARTING,
  GameState.PLAYING,
  GameState.PLAYER_MOVING,
  GameState.PLAYER_DYING,
  GameState.UPLOADING,
]);

const DEATH_LABELS = {
  packet: 'Security packet',
  pulse: 'Pulse stream',
  corruption: 'Corruption',
  trail: 'Corruption trail',
  scanner: 'Security scan',
  gate: 'Encryption gate',
  fall: 'Signal lost to empty space',
  phased: 'Wrong frequency — phased through',
  carried: 'Carried off the network',
};

export class Game {
  constructor() {
    this.settings = storage.loadSettings();
    this.progress = storage.loadProgress();
    this.stats = storage.loadStats();
    this.tutorialState = storage.loadTutorialState();

    this.audio = new AudioEngine(this.settings);
    this.particles = new ParticleSystem();
    this.particles.reducedEffects = this.settings.reducedEffects;

    this.state = GameState.LOADING;
    this.previousState = GameState.MENU;
    this.level = null;
    this.player = null;

    this.worldTime = 0;
    this.levelTime = 0;
    this.startTimer = 0;
    this.startTimerTotal = CONFIG.world.startDelay;
    this.shake = 0;
    this.flash = 0;

    this.uplinkStates = [];
    this.uplinkPulse = [];
    this.collected = new Set();
    this.nearMissAwarded = new Set();
    this.nearMissChain = 0;
    this.bestNearMissChain = 0;

    this.score = 0;
    this.deaths = 0;
    this.runFragments = 0;
    this.lastDeathCause = null;

    this.activeTutorial = null;
    this.tutorialTimer = 0;
    this.pendingMove = null;
    this.pendingPolarity = false;

    this.trailTimer = 0;
    this.sessionStart = performance.now();
    this.basePlayTime = this.stats.playTime;

    this.events = {};
    this.hazards = makeHazardResult();

    /** Consumers (UI) subscribe here rather than the game importing the DOM. */
    this.listeners = {
      stateChange: [],
      levelComplete: [],
      tutorial: [],
      toast: [],
      hudDirty: [],
    };
  }

  on(event, fn) {
    this.listeners[event].push(fn);
    return () => {
      const list = this.listeners[event];
      const i = list.indexOf(fn);
      if (i >= 0) list.splice(i, 1);
    };
  }

  emit(event, payload) {
    for (const fn of this.listeners[event]) fn(payload);
  }

  setState(next) {
    if (this.state === next) return;
    this.previousState = this.state;
    this.state = next;
    this.emit('stateChange', next);
  }

  get isSimulating() {
    return SIMULATING.has(this.state);
  }

  // --- Level lifecycle ----------------------------------------------------

  isUnlocked(id) {
    return id <= this.progress.unlocked;
  }

  startLevel(id) {
    const definition = getLevelDefinition(id);
    if (!definition) return false;

    this.level = prepareLevel(definition);
    this.player = new Player(this.level, 'cyan');
    this.uplinkStates = this.level.uplinks.map(() => false);
    this.uplinkPulse = this.level.uplinks.map(() => 0);
    this.collected = new Set();
    this.nearMissAwarded = new Set();
    this.nearMissChain = 0;
    this.bestNearMissChain = 0;

    this.worldTime = 0;
    this.levelTime = 0;
    this.beginCountdown(CONFIG.world.startDelay);
    this.score = 0;
    this.deaths = 0;
    this.runFragments = 0;
    this.lastDeathCause = null;
    this.shake = 0;
    this.flash = 0;
    this.particles.clear();
    this.activeTutorial = null;
    this.pendingMove = null;
    this.pendingPolarity = false;

    updateWorld(this.level, 0);
    this.setState(GameState.STARTING);
    this.emit('hudDirty');
    this.queueTutorial({ type: 'start' });
    return true;
  }

  restartLevel() {
    if (!this.level) return;
    this.startLevel(this.level.id);
  }

  nextLevel() {
    if (!this.level) return false;
    const next = this.level.id + 1;
    if (next > LEVEL_COUNT || !this.isUnlocked(next)) return false;
    return this.startLevel(next);
  }

  exitToMenu() {
    this.level = null;
    this.player = null;
    this.particles.clear();
    this.setState(GameState.MENU);
  }

  pause() {
    if (!this.isSimulating) return;
    this.setState(GameState.PAUSED);
  }

  resume() {
    if (this.state !== GameState.PAUSED) return;
    // Resume into the countdown so the player is never dropped straight back
    // into a hazard they cannot react to.
    this.beginCountdown(Math.max(this.startTimer, 0.45));
    this.setState(GameState.STARTING);
  }

  togglePause() {
    if (this.state === GameState.PAUSED) this.resume();
    else if (this.isSimulating) this.pause();
  }

  // --- Input entry points -------------------------------------------------

  /**
   * Input is queued, not applied immediately.
   *
   * Events arrive at arbitrary points between frames. Acting on them the
   * instant they fire would resolve the move against whatever the world
   * looked like at the *previous* update, so the same swipe could succeed or
   * kill you depending on where in the frame it landed. Queuing and draining
   * at a fixed point in the update order makes a given input at a given world
   * time always mean the same thing. The cost is at most one frame of latency.
   */
  requestMove(dx, dy) {
    if (!this.player || !this.isSimulating) return;
    this.dismissTutorial();
    if (this.state === GameState.STARTING) return;
    // Latest intent wins — an older queued direction is never what the player
    // wants by the time the next frame arrives.
    this.pendingMove = { dx, dy };
  }

  requestPolarity() {
    if (!this.player || !this.isSimulating) return;
    this.dismissTutorial();
    this.pendingPolarity = true;
  }

  /** Drain queued input. Called once per frame, after the world has advanced. */
  consumeInput() {
    if (this.pendingPolarity) {
      this.pendingPolarity = false;
      if (this.player.requestPolaritySwitch()) {
        this.stats.polaritySwitches++;
        const colour = polarityColor(this.player.polarity);
        this.particles.ring(this.player.centerX, this.player.centerY, colour, 1.5, 0.34);
        this.audio.polarity(this.player.polarity);
        vibrate(CONFIG.haptics.switch, this.settings);
        this.emit('hudDirty');
        this.emit('toast', `${this.player.polarity.toUpperCase()} FREQUENCY`);
      }
    }

    const move = this.pendingMove;
    if (!move) return;
    this.pendingMove = null;

    const before = this.player.highestRow;
    const result = this.player.requestMove(this.level, move.dx, move.dy, this.uplinkStates);

    if (result === MOVE_OK) {
      this.stats.moves++;
      if (move.dy < 0) this.stats.forwardMoves++;
      this.audio.move();
      this.setState(GameState.PLAYER_MOVING);
    } else if (result !== MOVE_BUSY) {
      this.audio.blocked_();
      if (result === 'gate') this.emit('toast', 'FREQUENCY MISMATCH');
      else if (result === 'uplinkDone') this.emit('toast', 'UPLINK ALREADY ONLINE');
      else this.emit('toast', 'ROUTE BLOCKED');
    }
    if (before !== this.player.highestRow) this.emit('hudDirty');
  }

  /** Tap-to-move: only adjacent cells, so a stray tap cannot teleport you. */
  requestTapCell(col, row) {
    if (!this.player || !this.isSimulating) return;
    const dx = col - Math.round(this.player.x);
    const dy = row - this.player.row;
    if (Math.abs(dx) + Math.abs(dy) !== 1) return;
    this.requestMove(dx, dy);
  }

  // --- Simulation ---------------------------------------------------------

  update(dt) {
    this.audio.updateMusic();

    if (!this.isSimulating || !this.level) {
      this.particles.update(dt);
      return;
    }

    if (this.state === GameState.STARTING) {
      this.startTimer -= dt;
      // The world keeps turning during the countdown so the player can read
      // the lane rhythms before they are allowed to commit.
      this.advanceWorld(dt);
      this.particles.update(dt);
      if (this.startTimer <= 0) this.setState(GameState.PLAYING);
      return;
    }

    const scale = this.currentTimeScale();
    this.levelTime += dt;
    this.advanceWorld(dt * scale);

    // Input resolves against the world as it is *now*, not as it was last frame.
    if (this.state === GameState.PLAYING || this.state === GameState.PLAYER_MOVING) {
      this.consumeInput();
    }

    if (this.state === GameState.PLAYER_DYING) {
      this.player.update(this.level, dt, this.uplinkStates, this.events);
      this.updateEffects(dt);
      if (this.player.deathTimer <= 0) this.respawn();
      return;
    }

    if (this.state === GameState.UPLOADING) {
      this.player.update(this.level, dt, this.uplinkStates, this.events);
      this.updateEffects(dt);
      if (this.player.uploadTimer <= 0) this.finishUpload();
      return;
    }

    this.player.update(this.level, dt, this.uplinkStates, this.events);

    // Collision priority: lethal, then unsupported, then uplink, collectible,
    // near miss. Resolved in exactly this order, every frame.
    if (this.resolveLethal()) return;
    if (this.resolveSupport()) return;
    if (this.resolveUplink()) return;
    this.resolveCollectibles();
    this.resolveNearMisses();

    this.setState(this.player.motion.moving ? GameState.PLAYER_MOVING : GameState.PLAYING);
    this.updateEffects(dt);
    this.updateTutorial(dt);
  }

  currentTimeScale() {
    if (this.state === GameState.PLAYER_DYING) return CONFIG.world.deathTimeScale;
    if (this.state === GameState.UPLOADING) return CONFIG.world.uploadTimeScale;
    if (this.activeTutorial) return CONFIG.tutorial.timeScale;
    return 1;
  }

  /** Start a pre-play countdown; the renderer reads the total for its ring. */
  beginCountdown(seconds) {
    this.startTimer = seconds;
    this.startTimerTotal = seconds;
  }

  advanceWorld(dt) {
    this.worldTime += dt;
    updateWorld(this.level, this.worldTime);
  }

  resolveLethal() {
    if (this.player.graceTimer > 0) {
      // Nothing was queried this frame, so the near-miss buffer must not be
      // read as if it were current.
      this.hazards.nearCount = 0;
      return false;
    }
    queryHazards(
      this.level,
      this.player.centerX,
      this.player.centerY,
      CONFIG.player.radius,
      this.player.polarity,
      this.hazards,
    );
    if (!this.hazards.lethal) return false;
    this.kill(this.hazards.lethal.kind);
    return true;
  }

  resolveSupport() {
    if (this.events.carriedOff || isOffBoard(this.level, this.player.centerX)) {
      this.kill('carried');
      return true;
    }
    if (this.events.fell) {
      this.kill(this.events.phasedOut ? 'phased' : 'fall');
      return true;
    }
    if (this.events.attached) {
      this.audio.land();
    }
    return false;
  }

  resolveUplink() {
    if (!this.events.settled) return false;
    const slot = this.player.motion.enteredUplink;
    if (slot < 0 || this.uplinkStates[slot]) return false;

    this.player.beginUpload();
    this.setState(GameState.UPLOADING);
    this.addScore(CONFIG.score.uplink);
    this.stats.uplinksActivated++;
    this.audio.uplink();
    vibrate(CONFIG.haptics.uplink, this.settings);
    this.particles.ring(this.player.centerX, this.player.centerY, PALETTE.white, 2.4, 0.6);
    this.particles.burst(this.player.centerX, this.player.centerY, 18, PALETTE.white, 2.6);
    this.emit('hudDirty');
    return true;
  }

  finishUpload() {
    const slot = this.player.motion.enteredUplink;
    if (slot >= 0) {
      this.uplinkStates[slot] = true;
      this.uplinkPulse[slot] = 1;
    }
    if (this.uplinkStates.every(Boolean)) {
      this.completeLevel();
      return;
    }
    this.respawn(false);
    this.emit('toast', `UPLINK ${this.uplinkStates.filter(Boolean).length}/${this.uplinkStates.length} ONLINE`);
  }

  resolveCollectibles() {
    const r = CONFIG.player.radius + 0.22;
    const px = this.player.centerX;
    const py = this.player.centerY;
    for (const frag of this.level.collectibles) {
      if (this.collected.has(frag.id)) continue;
      const dx = px - (frag.col + 0.5);
      const dy = py - (frag.row + 0.5);
      if (dx * dx + dy * dy > r * r) continue;
      this.collected.add(frag.id);
      this.runFragments++;
      this.stats.fragmentsCollected++;
      this.addScore(CONFIG.score.fragment);
      this.audio.fragment();
      this.particles.burst(frag.col + 0.5, frag.row + 0.5, 10, PALETTE.white, 2.0);
      this.emit('hudDirty');
    }
  }

  resolveNearMisses() {
    let scored = 0;
    for (let i = 0; i < this.hazards.nearCount; i++) {
      const key = this.hazards.near[i];
      if (this.nearMissAwarded.has(key)) continue;
      this.nearMissAwarded.add(key);
      this.addScore(CONFIG.score.nearMiss);
      scored++;
      this.audio.nearMiss();
      vibrate(CONFIG.haptics.nearMiss, this.settings);
      this.particles.burst(this.player.centerX, this.player.centerY, 4, PALETTE.warning, 1.4);
    }
    if (!scored) return;
    this.nearMissChain += scored;
    this.bestNearMissChain = Math.max(this.bestNearMissChain, this.nearMissChain);
    if (this.nearMissChain === 1) this.emit('toast', `NEAR MISS +${CONFIG.score.nearMiss}`);
    else this.emit('toast', `NEAR MISS CHAIN ${this.nearMissChain}X`);
    this.emit('hudDirty');
  }

  addScore(amount) {
    this.score += amount;
    this.emit('hudDirty');
  }

  kill(cause) {
    if (!this.player.beginDeath(cause)) return;
    this.setState(GameState.PLAYER_DYING);
    this.deaths++;
    this.lastDeathCause = cause;
    this.nearMissChain = 0;
    this.stats.deaths++;
    this.stats.deathsByCause[cause] = (this.stats.deathsByCause[cause] ?? 0) + 1;

    const colour = polarityColor(this.player.polarity);
    if (cause === 'fall' || cause === 'phased' || cause === 'carried') {
      this.particles.spray(this.player.centerX, this.player.centerY, 16, colour, 0, 1, 2.0);
      this.audio.fall();
    } else {
      this.particles.burst(this.player.centerX, this.player.centerY, 22, colour, 3.0);
      this.particles.burst(this.player.centerX, this.player.centerY, 10, PALETTE.hostile, 2.0);
      this.audio.impact();
    }
    if (!this.settings.reducedEffects) this.shake = 0.55;
    this.flash = 0.4;
    vibrate(CONFIG.haptics.death, this.settings);
    this.emit('toast', DEATH_LABELS[cause] ?? 'Signal lost');
    this.emit('hudDirty');
  }

  respawn(countDeath = true) {
    const polarity = this.player.polarity;
    this.pendingMove = null;
    this.pendingPolarity = false;
    this.player.reset(this.level, polarity);
    this.nearMissAwarded.clear();
    this.nearMissChain = 0;
    this.audio.respawn();
    this.particles.ring(this.player.centerX, this.player.centerY, polarityColor(polarity), 1.2, 0.3);
    // A short countdown after every respawn keeps restarts fast without ever
    // dropping the player into a hazard mid-frame.
    this.beginCountdown(countDeath ? 0.35 : 0.45);
    this.setState(GameState.STARTING);
    this.emit('hudDirty');
  }

  completeLevel() {
    const record = this.progress.levels[this.level.id];
    const clean = this.deaths === 0;
    const fast = this.levelTime <= this.level.targetTime;

    this.addScore(CONFIG.score.levelComplete);
    if (clean) this.addScore(CONFIG.score.cleanSignal);
    if (fast) this.addScore(CONFIG.score.lowLatency);

    const result = {
      levelId: this.level.id,
      levelName: this.level.name,
      time: this.levelTime,
      targetTime: this.level.targetTime,
      score: this.score,
      deaths: this.deaths,
      fragments: this.runFragments,
      totalFragments: this.level.collectibles.length,
      nearMissChain: this.bestNearMissChain,
      badges: { connected: true, clean, lowLatency: fast },
      previousBestTime: record.bestTime,
      previousBestScore: record.bestScore,
      newBestTime: record.bestTime === null || this.levelTime < record.bestTime,
      newBestScore: this.score > record.bestScore,
      isFinalLevel: this.level.id === LEVEL_COUNT,
    };

    record.completed = true;
    record.badges.connected = true;
    if (clean) record.badges.clean = true;
    if (fast) record.badges.lowLatency = true;
    if (result.newBestTime) record.bestTime = this.levelTime;
    if (result.newBestScore) record.bestScore = this.score;
    record.bestFragments = Math.max(record.bestFragments, this.runFragments);

    this.progress.unlocked = Math.max(
      this.progress.unlocked,
      Math.min(LEVEL_COUNT, this.level.id + 1),
    );

    this.stats.levelsCompleted++;
    if (clean) this.stats.cleanBadges++;
    if (fast) this.stats.latencyBadges++;
    this.stats.currentStreak = clean ? this.stats.currentStreak + 1 : 0;
    this.stats.bestStreak = Math.max(this.stats.bestStreak, this.stats.currentStreak);

    this.persist();

    this.player.state = PlayerState.COMPLETE;
    this.audio.complete();
    vibrate(CONFIG.haptics.complete, this.settings);
    this.particles.ring(this.player.centerX, this.player.centerY, PALETTE.white, 4, 0.9);
    this.particles.burst(this.player.centerX, this.player.centerY, 30, PALETTE.cyan, 3.4);

    this.setState(GameState.LEVEL_COMPLETE);
    this.emit('levelComplete', result);
  }

  // --- Effects and tutorial ----------------------------------------------

  updateEffects(dt) {
    this.particles.update(dt);
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 2.2);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt * 2.6);
    for (let i = 0; i < this.uplinkPulse.length; i++) {
      if (this.uplinkPulse[i] > 0) this.uplinkPulse[i] = Math.max(0, this.uplinkPulse[i] - dt);
    }

    if (this.settings.reducedEffects) return;
    this.trailTimer -= dt;
    if (this.trailTimer <= 0 && this.player.state !== PlayerState.DYING) {
      this.trailTimer = CONFIG.particles.trailInterval;
      this.particles.trail(
        this.player.centerX,
        this.player.centerY,
        polarityColor(this.player.polarity),
      );
    }
  }

  queueTutorial(trigger) {
    if (!this.level) return;
    for (const prompt of this.level.tutorialPrompts) {
      if (this.tutorialState.seen[`${this.level.id}:${prompt.id}`]) continue;
      if (prompt.trigger.type !== trigger.type) continue;
      if (trigger.type === 'row' && prompt.trigger.row !== trigger.row) continue;
      this.activeTutorial = prompt;
      this.tutorialTimer = CONFIG.tutorial.autoDismiss;
      this.emit('tutorial', prompt);
      return;
    }
  }

  updateTutorial(dt) {
    if (this.activeTutorial) {
      this.tutorialTimer -= dt;
      if (this.tutorialTimer <= 0) this.dismissTutorial();
      return;
    }
    this.queueTutorial({ type: 'row', row: this.player.row });
  }

  dismissTutorial() {
    if (!this.activeTutorial) return;
    this.tutorialState.seen[`${this.level.id}:${this.activeTutorial.id}`] = true;
    storage.saveTutorialState(this.tutorialState);
    this.activeTutorial = null;
    this.emit('tutorial', null);
  }

  /** Replaying tutorials from the Help screen. */
  clearTutorialHistory() {
    this.tutorialState = { seen: {} };
    storage.saveTutorialState(this.tutorialState);
  }

  // --- Settings and persistence ------------------------------------------

  updateSetting(key, value) {
    this.settings[key] = value;
    storage.saveSettings(this.settings);
    if (key === 'reducedEffects') this.particles.reducedEffects = value;
    if (key === 'music') this.audio.setMusicEnabled(value);
    if (key === 'sound' && !value) this.audio.setMusicEnabled(false);
    if (key === 'sound' && value && this.settings.music) this.audio.setMusicEnabled(true);
  }

  persist() {
    const sessionSeconds = (performance.now() - this.sessionStart) / 1000;
    this.stats.playTime = Math.round(this.basePlayTime + sessionSeconds);
    storage.saveProgress(this.progress);
    storage.saveStats(this.stats);
  }

  resetProgress() {
    storage.resetAll();
    this.progress = storage.loadProgress();
    this.stats = storage.loadStats();
    this.tutorialState = storage.loadTutorialState();
  }

  // --- Derived values for the HUD ----------------------------------------

  get uplinksActive() {
    return this.uplinkStates.filter(Boolean).length;
  }

  get elapsed() {
    return this.levelTime;
  }

  get switchCooldownRatio() {
    if (!this.player) return 0;
    return clamp(this.player.switchCooldown / CONFIG.polarity.cooldown, 0, 1);
  }

  get objectiveText() {
    if (!this.level || !this.player) return 'READY';
    if (this.state === GameState.STARTING) return 'READ THE LANES';
    if (this.state === GameState.PLAYER_DYING) return 'REBOOTING SIGNAL';
    if (this.state === GameState.UPLOADING) return 'UPLINKING';
    if (this.uplinkStates.every(Boolean)) return 'NETWORK CLEAR';
    return `REACH UPLINK ${this.uplinksActive + 1}/${this.uplinkStates.length}`;
  }

  getMoveHints() {
    if (!this.level || !this.player || !this.isSimulating) return [];
    if (this.state === GameState.PLAYER_DYING || this.state === GameState.UPLOADING) return [];
    const baseCol = Math.round(this.player.x);
    const baseRow = this.player.row;
    return [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ].map(({ dx, dy }) => {
      const col = baseCol + dx;
      const row = baseRow + dy;
      const reason = blockReason(this.level, row, col, this.player.polarity, this.uplinkStates);
      const lane = this.level.laneByRow[row];
      return {
        col,
        row,
        dx,
        dy,
        ok: !reason,
        reason,
        risky: !reason && !!lane?.isVoid,
        uplink: !reason && lane?.type === 'terminal',
      };
    });
  }
}

export { LEVEL_COUNT, DEATH_LABELS };
