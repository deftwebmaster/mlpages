import { createInitialState } from './GameState.js';
import { simulateTurn } from './TurnEngine.js';
import { computeGuardCone, computeCameraCone } from './Vision.js';
import { UndoStack } from './Undo.js';
import { AnimationRegistry } from '../render/Animation.js';
import { ParticleSystem } from '../render/Particles.js';
import { Renderer } from '../render/Renderer.js';
import { Input } from '../input/Input.js';
import { PlanningMode } from '../planning/PlanningMode.js';
import { bfsShortestPath } from '../planning/Path.js';
import { AudioEngine } from '../audio/Audio.js';
import { Storage } from '../storage/Storage.js';
import { GAME_STATUS, ANIM_MS, COLORS, DIRECTIONS } from '../utils/constants.js';
import { easeOutQuad } from '../utils/helpers.js';

export class Game {
  constructor(canvas, boardWrap) {
    this.canvas = canvas;
    this.boardWrap = boardWrap;
    this.renderer = new Renderer(canvas);
    this.animation = new AnimationRegistry();
    this.particles = new ParticleSystem();
    this.audio = new AudioEngine();
    this.undo = new UndoStack();

    this.level = null;
    this.state = null;
    this.planning = null;
    this.status = 'idle'; // idle | playing | paused | failed | complete
    this.inputLocked = false;
    this.moveQueue = [];
    this.displayPositions = new Map();
    this.doorAnimValues = {};
    this.cones = { guardCones: new Map(), cameraCones: new Map() };

    this.restartsThisMission = 0;
    this.detectionsThisMission = 0;
    this.missionStartTime = 0;

    this.hooks = {
      onMissionComplete: null,
      onMissionFailed: null,
      onHudUpdate: null,
      onPlanningChange: null,
      onMessage: null,
    };

    const settings = Storage.getSave().settings;
    this.audio.setEnabled(settings.sound);
    this.audio.setMusicEnabled(settings.music);
    this.hapticsEnabled = settings.haptics;
    this.animation.setReducedMotion(settings.reducedMotion);

    this.input = new Input(canvas, this.renderer, {
      isPlayerTile: (x, y) => this.state && this.state.player.x === x && this.state.player.y === y,
      onMove: (dir) => this.attemptMove(dir),
      onTapTile: (x, y) => this.handleTapTile(x, y),
      onDragStart: () => this.enterPlanning(),
      onDragTile: (x, y) => this.dragPlanningTile(x, y),
      onDragEnd: () => this.executePlanning(),
      onCancelPlanning: () => this.cancelPlanning(),
      onExecutePlanning: () => this.executePlanning(),
    });

    this._lastFrameTime = performance.now();
    requestAnimationFrame(this._loop.bind(this));
  }

  setHooks(hooks) {
    this.hooks = { ...this.hooks, ...hooks };
  }

  applySettings(settings) {
    this.audio.setEnabled(settings.sound);
    this.audio.setMusicEnabled(settings.music);
    this.hapticsEnabled = settings.haptics;
    this.animation.setReducedMotion(settings.reducedMotion);
  }

  loadLevel(level) {
    this.level = level;
    this.planning = new PlanningMode(level);
    this.restartsThisMission = 0;
    this.detectionsThisMission = 0;
    this._resetToInitial();
    this.status = 'playing';
    this.missionStartTime = performance.now();
    this.handleResize();
  }

  restart() {
    if (!this.level) return;
    this.restartsThisMission += 1;
    Storage.recordRestart();
    this._resetToInitial();
    this.status = 'playing';
    this._emitHud();
  }

  _resetToInitial() {
    this.state = createInitialState(this.level);
    this.undo.reset();
    this.moveQueue = [];
    this.animation.clear();
    this.particles.clear();
    this.displayPositions.clear();
    this.doorAnimValues = {};
    this.planning?.cancel();
    this._syncDisplayPositions();
    this._recomputeCones();
    this._emitHud();
  }

  _syncDisplayPositions() {
    this.displayPositions.set('player', { x: this.state.player.x, y: this.state.player.y });
    for (const g of this.state.guards) {
      this.displayPositions.set(`guard:${g.id}`, { x: g.x, y: g.y });
    }
  }

  _recomputeCones() {
    const guardCones = new Map();
    const cameraCones = new Map();
    for (const guard of this.state.guards) {
      guardCones.set(guard.id, computeGuardCone(guard, this.level.guardDefsById[guard.id], this.level, this.state.doors));
    }
    for (const camera of this.state.cameras) {
      cameraCones.set(camera.id, computeCameraCone(camera, this.level.cameraDefsById[camera.id], this.level, this.state.doors));
    }
    this.cones = { guardCones, cameraCones };
  }

  handleResize() {
    if (!this.level) return;
    const rect = this.boardWrap.getBoundingClientRect();
    this.renderer.resize(this.level, rect.width, rect.height);
  }

  pause() {
    if (this.status === 'playing') this.status = 'paused';
  }

  resume() {
    if (this.status === 'paused') this.status = 'playing';
  }

  canUndo() {
    return this.undo.canUndo();
  }

  undoMove() {
    if ((this.status !== 'playing' && this.status !== 'failed') || this.inputLocked) return;
    const prev = this.undo.pop();
    if (!prev) return;
    this.status = 'playing';
    this.state = prev;
    this.moveQueue = [];
    this.animation.clear();
    this.particles.clear();
    this._syncDisplayPositions();
    this._recomputeCones();
    this._emitHud();
    this._message('Rewound one turn.');
  }

  // ---- movement ----

  attemptMove(dir) {
    if (this.status !== 'playing' || this.inputLocked || this.planning?.active) return;
    this._runTurn(dir);
  }

  handleTapTile(x, y) {
    if (this.status !== 'playing' || this.inputLocked) return;
    const player = this.state.player;
    if (x === player.x && y === player.y) return;
    const dx = Math.abs(x - player.x), dy = Math.abs(y - player.y);
    if (dx + dy === 1) {
      const dir = dx === 1 ? (x > player.x ? 'E' : 'W') : (y > player.y ? 'S' : 'N');
      this.attemptMove(dir);
      return;
    }
    const path = bfsShortestPath(this.level, this.state.doors, player, { x, y });
    if (path && path.length) {
      const safePath = this._safePrefixForPath(path);
      if (!safePath.length) {
        this._message('That route is exposed on the next turn.', 'danger');
        return;
      }
      this.moveQueue = safePath;
      if (safePath.length < path.length) {
        this._message('Route trimmed before a detection tile.', 'warning');
      } else {
        this._message(`Route queued: ${safePath.length} moves.`);
      }
      this._advanceQueue();
    }
  }

  _safePrefixForPath(path) {
    const safe = [];
    let probe = this.state;
    for (const dir of path) {
      const result = simulateTurn(probe, this.level, dir);
      if (!result.valid || result.state.status === GAME_STATUS.FAILED) break;
      safe.push(dir);
      probe = result.state;
      if (probe.status === GAME_STATUS.COMPLETE) break;
    }
    return safe;
  }

  _advanceQueue() {
    if (this.status !== 'playing' || this.inputLocked) return;
    const next = this.moveQueue.shift();
    if (next) this._runTurn(next, true);
  }

  _runTurn(dir, fromQueue = false) {
    const previous = this.state;
    const result = simulateTurn(previous, this.level, dir);
    if (!result.valid) {
      this.moveQueue = [];
      this._message('Blocked.', 'warning');
      return;
    }
    this.undo.push(previous);
    this.state = result.state;
    this._commitAnimatedTurn(previous, result, fromQueue);
  }

  _commitAnimatedTurn(previousState, result, fromQueue) {
    this.inputLocked = true;
    this._recomputeCones();
    this._emitHud();

    const moveDur = ANIM_MS.MOVE;
    this.animation.start('player', {
      from: { x: previousState.player.x, y: previousState.player.y },
      to: { x: result.state.player.x, y: result.state.player.y },
      duration: moveDur,
      easing: easeOutQuad,
      onUpdate: (v) => this.displayPositions.set('player', v),
      onComplete: () => this._afterTurnAnimation(result, fromQueue),
    });

    for (const guard of result.state.guards) {
      const prevGuard = previousState.guards.find((g) => g.id === guard.id);
      if (!prevGuard) continue;
      this.animation.start(`guard:${guard.id}`, {
        from: { x: prevGuard.x, y: prevGuard.y },
        to: { x: guard.x, y: guard.y },
        duration: moveDur,
        easing: easeOutQuad,
        onUpdate: (v) => this.displayPositions.set(`guard:${guard.id}`, v),
      });
    }

    for (const event of result.events) {
      this._handleEvent(event, result);
    }
  }

  _handleEvent(event, result) {
    switch (event.type) {
      case 'move':
        this.audio.move();
        break;
      case 'doorOpen':
      case 'doorClose': {
        this.audio.door();
        const target = event.type === 'doorOpen' ? 1 : 0;
        const current = this.doorAnimValues[event.doorId] ?? (target === 1 ? 0 : 1);
        this.animation.start(`door:${event.doorId}`, {
          from: current, to: target, duration: ANIM_MS.DOOR,
          onUpdate: (v) => { this.doorAnimValues[event.doorId] = v; },
          onComplete: () => { delete this.doorAnimValues[event.doorId]; },
        });
        break;
      }
      case 'keycard':
        this.audio.pickup();
        break;
      case 'cameraRotate':
        this.audio.camera();
        break;
      case 'collected': {
        this.audio.pickup();
        const [px, py] = this.renderer.toPx(this.level.package.pos[0], this.level.package.pos[1]);
        this.particles.burst(px, py, { color: COLORS.violet, count: 12 });
        this._haptic(15);
        break;
      }
      case 'detected': {
        this.detectionsThisMission += 1;
        Storage.recordDetection();
        break;
      }
      case 'complete':
        break;
      default:
        break;
    }
  }

  _afterTurnAnimation(result, fromQueue) {
    this.inputLocked = false;

    if (result.state.status === GAME_STATUS.FAILED) {
      this.moveQueue = [];
      this.status = 'failed';
      const [px, py] = this.renderer.toPx(result.state.player.x, result.state.player.y);
      this.particles.flash(px, py, COLORS.red);
      this.audio.detection();
      this._haptic(60);
      this.hooks.onMissionFailed?.(result.state.detectionReason);
      return;
    }

    if (result.state.status === GAME_STATUS.COMPLETE) {
      this.moveQueue = [];
      this.status = 'complete';
      const [px, py] = this.renderer.toPx(this.level.extraction.pos[0], this.level.extraction.pos[1]);
      this.particles.burst(px, py, { color: COLORS.cyan, count: 18, speed: 2 });
      this.audio.missionComplete();
      this._haptic([10, 40, 10]);
      const stats = this._computeMissionStats();
      Storage.recordMissionResult(this.level.id, stats);
      this.hooks.onMissionComplete?.(stats);
      return;
    }

    if (fromQueue && this.moveQueue.length) {
      this._advanceQueue();
    }
  }

  _computeMissionStats() {
    const moves = this.state.moveCount;
    const target = this.level.targetMoves;
    const usedUndo = this.undo.hasUsedUndo;
    let stars = 1;
    if (target && moves <= target) stars = 2;
    if (target && moves <= target && !usedUndo) stars = 3;
    return {
      stars, moves, usedUndo,
      restarts: this.restartsThisMission,
      detections: this.detectionsThisMission,
      targetMoves: target,
    };
  }

  _haptic(pattern) {
    if (!this.hapticsEnabled) return;
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  // ---- planning mode ----

  enterPlanning() {
    if (this.status !== 'playing' || this.inputLocked) return;
    this.planning.begin(this.state);
    this.hooks.onPlanningChange?.(this.planning.getOverlay());
  }

  dragPlanningTile(x, y) {
    if (!this.planning?.active) return;
    if (this.planning.tryExtend(x, y)) {
      this.hooks.onPlanningChange?.(this.planning.getOverlay());
    }
  }

  executePlanning() {
    if (!this.planning?.active) return;
    const chain = this.planning.executableChain;
    const overlay = this.planning.getOverlay();
    const wasCut = this.planning.dangerIndex != null;
    this.planning.cancel();
    this.hooks.onPlanningChange?.({ active: false });

    if (!chain.length) return;

    // Replay the already-simulated states turn-by-turn through the normal
    // animation pipeline — guarantees Execute matches manual replay exactly.
    this._executeChain(chain, 0, wasCut ? overlay.dangerReason : null);
  }

  _executeChain(chain, index, cutoffReason) {
    if (index >= chain.length) {
      if (cutoffReason) {
        // Planning halted before a guaranteed detection; nothing further to do —
        // player remains safely at the last planned tile.
      }
      return;
    }
    const previous = index === 0 ? this.state : chain[index - 1].state;
    const result = chain[index];
    this.undo.push(previous);
    this.state = result.state;
    this.inputLocked = true;
    this._recomputeCones();
    this._emitHud();

    const moveDur = ANIM_MS.MOVE;
    this.animation.start('player', {
      from: { x: previous.player.x, y: previous.player.y },
      to: { x: result.state.player.x, y: result.state.player.y },
      duration: moveDur,
      easing: easeOutQuad,
      onUpdate: (v) => this.displayPositions.set('player', v),
      onComplete: () => {
        this.inputLocked = false;
        if (result.state.status === GAME_STATUS.FAILED || result.state.status === GAME_STATUS.COMPLETE) {
          this._afterTurnAnimation(result, false);
        } else {
          this._executeChain(chain, index + 1, cutoffReason);
        }
      },
    });
    for (const guard of result.state.guards) {
      const prevGuard = previous.guards.find((g) => g.id === guard.id);
      if (!prevGuard) continue;
      this.animation.start(`guard:${guard.id}`, {
        from: { x: prevGuard.x, y: prevGuard.y },
        to: { x: guard.x, y: guard.y },
        duration: moveDur,
        easing: easeOutQuad,
        onUpdate: (v) => this.displayPositions.set(`guard:${guard.id}`, v),
      });
    }
    for (const event of result.events) this._handleEvent(event, result);
  }

  cancelPlanning() {
    if (!this.planning?.active) return;
    this.planning.cancel();
    this.hooks.onPlanningChange?.({ active: false });
  }

  getMoveHints() {
    if (!this.state || this.status !== 'playing' || this.inputLocked || this.planning?.active) return [];
    const hints = [];
    for (const [dir, delta] of Object.entries(DIRECTIONS)) {
      const x = this.state.player.x + delta.x;
      const y = this.state.player.y + delta.y;
      const result = simulateTurn(this.state, this.level, dir);
      if (!result.valid) continue;
      hints.push({
        x,
        y,
        dir,
        danger: result.state.status === GAME_STATUS.FAILED,
        complete: result.state.status === GAME_STATUS.COMPLETE,
        collect: result.events.some((event) => event.type === 'collected'),
      });
    }
    return hints;
  }

  _message(text, tone = 'info') {
    this.hooks.onMessage?.({ text, tone });
  }

  // ---- hud/loop ----

  _emitHud() {
    this.hooks.onHudUpdate?.({
      missionName: this.level?.name,
      moveCount: this.state?.moveCount ?? 0,
      packageCollected: this.state?.packageCollected ?? false,
      exitActive: this.state?.exitActive ?? false,
      canUndo: this.undo.canUndo(),
      targetMoves: this.level?.targetMoves,
      status: this.status,
    });
  }

  _loop(now) {
    const dt = now - this._lastFrameTime;
    this._lastFrameTime = now;
    requestAnimationFrame(this._loop.bind(this));

    if (this.status === 'idle' || !this.level) return;

    this.animation.tick(dt);
    this.particles.tick(dt / 1000);

    if (this.status !== 'paused') {
      this.renderer.render({
        level: this.level,
        state: this.state,
        displayPositions: this.displayPositions,
        cones: this.cones,
        particles: this.particles,
        planning: this.planning?.active ? this.planning.getOverlay() : null,
        moveHints: this.getMoveHints(),
        timeMs: now,
        doorAnim: this.doorAnimValues,
      });
    }
  }
}
