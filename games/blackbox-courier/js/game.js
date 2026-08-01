/**
 * Game controller: the explicit state machine, run lifecycle, scoring and the
 * per-frame ordering of every subsystem.
 *
 * All authoritative state lives here or in the systems it owns; the renderer
 * only ever reads it.
 */

import { STABILITY, PHASE, SCORE, CHECKPOINT, FX, COLORS, PLAYER, HAPTICS, CONTRACTS } from './config.js';
import { World } from './world.js';
import { Player } from './player.js';
import { Particles } from './particles.js';
import { CollisionSystem } from './collisions.js';
import { T } from './obstacles.js';
import { clamp, makeRng, vibrate, prefersReducedMotion } from './utils.js';
import * as store from './storage.js';
import * as audio from './audio.js';

export const STATE = {
  LOADING: 'LOADING',
  MENU: 'MENU',
  STARTING: 'STARTING',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  TRANSITION: 'TRANSITION',
  GAME_OVER: 'GAME_OVER',
  SETTINGS: 'SETTINGS',
  HELP: 'HELP',
};

const TUTORIAL_STEPS = [
  { id: 'steer', text: 'DRAG TO STEER' },
  { id: 'collect', text: 'COLLECT DATA FRAGMENTS' },
  { id: 'phase', text: 'HOLD PHASE TO CROSS ENERGY BARRIERS' },
  { id: 'stability', text: 'KEEP THE PAYLOAD STABLE' },
];

const formatPlain = (n) => Math.floor(n).toLocaleString('en-US');

export class Game {
  constructor({ renderer, input, ui }) {
    this.renderer = renderer;
    this.input = input;
    this.ui = ui;

    this.rng = makeRng((Date.now() ^ 0x9e3779b9) >>> 0);
    this.world = new World(this.rng);
    this.player = new Player();
    this.particles = new Particles();
    this.collisions = new CollisionSystem();

    this.state = STATE.LOADING;
    this.timeScale = 1;
    this.reducedEffects = false;

    this.run = this._blankRun();
    this._renderState = {
      world: this.world,
      player: this.player,
      particles: this.particles,
      stability: 100,
      glitch: 0,
      speed: 0,
      speedRatio: 0,
      distanceZ: 0,
      phaseAmount: 0,
      criticalPulse: 0,
      showPlayer: false,
      wallHot: false,
    };

    this.applySettings();
  }

  _blankRun() {
    return {
      score: 0,
      multiplier: SCORE.multiplierStart,
      multBase: SCORE.multiplierStart,
      maxMultiplier: SCORE.multiplierStart,
      stability: STABILITY.start,
      distance: 0,
      time: 0,
      fragments: 0,
      nearMisses: 0,
      phasePasses: 0,
      cleanSections: 0,
      checkpoints: 0,
      damageEvents: 0,
      invuln: 0,
      nextCheckpointAt: CHECKPOINT.intervalSeconds,
      fragStreak: 0,
      bestFragStreak: 0,
      contract: this._currentContract(),
      contractProgress: '',
      contractComplete: false,
      contractRewarded: false,
      committed: false,
      cause: '—',
      player: this.player,
    };
  }

  /* ------------------------------------------------------------------ *
   * Settings
   * ------------------------------------------------------------------ */

  applySettings() {
    this.reducedEffects = !!store.get('reducedEffects') || prefersReducedMotion();
    this.renderer.setReduced(this.reducedEffects);
    this.particles.setReduced(this.reducedEffects);
    document.body.classList.toggle('reduced-effects', this.reducedEffects);
    this.input.setMode(store.get('controlMode'));
    document.body.dataset.controlMode = store.get('controlMode');
    audio.setSound(!!store.get('sound'));
    audio.setMusic(!!store.get('music'));
  }

  setSetting(key, value) {
    store.set(key, value);
    this.applySettings();
    if (key === 'music') {
      if (value && this.state === STATE.PLAYING) audio.startDrone();
      else if (!value) audio.stopDrone();
    }
    audio.sfx.menu();
  }

  /* ------------------------------------------------------------------ *
   * Lifecycle
   * ------------------------------------------------------------------ */

  toMenu() {
    this.state = STATE.MENU;
    this.input.setEnabled(false);
    this.timeScale = 1;
    audio.stopPhaseLoop();
    audio.stopWarning();
    audio.stopDrone();
    this.ui.hideAll();
    this.ui.setHudVisible(false);
    this.ui.tutorial('');
    this.ui.show('menu');
    this.ui.refreshMenuStats();
  }

  start() {
    audio.unlockAudio();
    // Restarting mid-run still banks whatever the abandoned run achieved.
    if (this.run.time > 0 && (this.state === STATE.PLAYING || this.state === STATE.PAUSED || this.state === STATE.STARTING)) {
      this._commitRunStats(false);
    }
    this.player.reset();
    this.particles.clear();
    this.world.reset(0);
    this.run = this._blankRun();
    this._updateContractProgress();
    this._summary = null;
    this.renderer.shake = 0;
    this.renderer.flash = 0;

    this.tutorialActive = !store.get('tutorialDone');
    this.tutorialStep = 0;
    this.tutorialTimer = 0;

    this.world.ensureAhead(0);

    this.state = STATE.STARTING;
    this.startTimer = FX.startCountdown;
    this.input.setEnabled(true);
    this.ui.hideAll();
    this.ui.setHudVisible(true);
    this.ui.setStatus('', '');
    this.ui.updateHud(this.run, performance.now());
    audio.sfx.start();
    audio.startDrone();
  }

  togglePause() {
    if (this.state === STATE.PLAYING || this.state === STATE.STARTING) this.pause();
    else if (this.state === STATE.PAUSED) this.resume();
  }

  pause() {
    if (this.state !== STATE.PLAYING && this.state !== STATE.STARTING) return;
    this._resumeState = this.state;
    this.state = STATE.PAUSED;
    this.input.setEnabled(false);
    audio.stopPhaseLoop();
    audio.suspendAudio();
    this.ui.show('pause', true);
  }

  resume() {
    if (this.state !== STATE.PAUSED) return;
    this.ui.hide('pause');
    this.ui.hide('settings');
    this.ui.hide('confirm');
    this.state = this._resumeState || STATE.PLAYING;
    this.input.setEnabled(true);
    audio.resumeAudio();
  }

  quitToMenu() {
    this._commitRunStats(false);
    this.toMenu();
  }

  /* ------------------------------------------------------------------ *
   * Frame
   * ------------------------------------------------------------------ */

  update(dt) {
    this.ui.tickToast(dt);

    switch (this.state) {
      case STATE.STARTING:
        this._updateStarting(dt);
        break;
      case STATE.PLAYING:
        this._updatePlaying(dt);
        break;
      case STATE.TRANSITION:
        this._updateTransition(dt);
        break;
      default:
        break;
    }

    this._syncRenderState();
  }

  render(dt) {
    this.renderer.render(this._renderState, dt);
  }

  _updateStarting(dt) {
    this.input.sample();
    this.startTimer -= dt;
    // The last beat reads GO rather than a number.
    if (this.startTimer <= 0) this.ui.countdown('');
    else this.ui.countdown(this.startTimer > 0.35 ? String(Math.ceil(this.startTimer - 0.35)) : 'GO');
    // The route already scrolls during the countdown so the first hazard is read.
    this.world.update(dt * 0.55, 0, 1);
    this.particles.update(dt, this.world.speed * 0.55);
    if (this.startTimer <= 0) {
      this.ui.countdown('');
      this.state = STATE.PLAYING;
      if (this.tutorialActive) this._advanceTutorial('steer');
    }
  }

  _updatePlaying(dt) {
    const run = this.run;
    run.time += dt;
    if (run.invuln > 0) run.invuln = Math.max(0, run.invuln - dt);

    this.input.sample();

    // 1. World scroll
    const dz = this.world.update(dt, run.time, 1);
    run.distance += dz;

    // 2. Player
    const corridor = this.world.wallAt(0);
    this.player.update(dt, this.input, corridor, {
      onPhaseStart: () => {
        audio.sfx.phaseOn();
        audio.startPhaseLoop();
        vibrate(store.get('haptics') ? HAPTICS.phase : 0);
        this.particles.ring(this.player.x, 0, [168, 120, 255], 18, 0.4);
      },
      onPhaseStop: () => {
        audio.sfx.phaseOff();
        audio.stopPhaseLoop();
      },
      onPhaseEmpty: () => {
        audio.sfx.phaseEmpty();
        audio.stopPhaseLoop();
        this.ui.toast('PHASE DEPLETED', 'violet');
      },
    });

    // 3. Collisions, resolved in priority order below.
    const res = this.collisions.resolve(this.world, this.player, dt, run.invuln);

    if (this.player.crushed) {
      this._die('TUNNEL COLLAPSE');
      return;
    }
    if (res.lethal) {
      this._die(this._causeFor(res.lethalType));
      return;
    }

    // 4. Stability
    let drain = STABILITY.baseDrain * dt;
    drain += this.player.phaseStabilityCost(dt);
    if (res.inCorruption) drain += STABILITY.corruptionDrain * dt;
    if (this.player.scraping !== 0) {
      drain += STABILITY.scrapeDrain * dt;
      const c = this.world.chunkAt(0);
      if (c) c.scraped = true;
      if (Math.random() < 12 * dt) {
        this.particles.burst(this.player.x, 0, 2, [255, 154, 60], { speed: 0.7, life: 0.3, size: 2.4 });
      }
    }
    run.stability -= drain;

    if (res.damage > 0) this._takeDamage(res.damage);

    if (run.stability <= 0) {
      run.stability = 0;
      this._die('PAYLOAD LOST');
      return;
    }

    // 5. Pickups
    for (const p of res.collected) this._collect(p);

    // 6. Calibration gates
    for (const g of res.calibrations) {
      run.stability = Math.min(STABILITY.max, run.stability + STABILITY.calibrationGate);
      this._addScore(SCORE.calibration, 'CALIBRATED', COLORS.green, g.x);
      audio.sfx.calibration();
      this.renderer.addFlash('rgba(77,255,176,0.35)', 0.3);
      this.particles.ring(g.x, 0, [77, 255, 176], 30, 0.6);
    }

    // 7. Near misses
    for (const h of res.nearMisses) {
      run.nearMisses++;
      this.run.multBase = Math.min(SCORE.multiplierMax, this.run.multBase + SCORE.multPerNearMiss);
      this._addScore(SCORE.nearMiss, 'NEAR MISS', COLORS.orange, h.x);
      audio.sfx.nearMiss();
      vibrate(store.get('haptics') ? HAPTICS.nearMiss : 0);
      this.particles.burst(this.player.x, 1, 5, [255, 154, 60], { speed: 0.6, life: 0.35, size: 2.6 });
    }
    if (res.phasePasses > 0) run.phasePasses += res.phasePasses;

    // 8. Chunk completion
    for (const chunk of this.world.newlyTraversed()) this._resolveChunk(chunk);

    // 9. Checkpoints
    if (run.time >= run.nextCheckpointAt) {
      run.nextCheckpointAt += CHECKPOINT.intervalSeconds;
      this._checkpoint();
    }

    // 10. Multiplier
    this._updateMultiplier(dt);
    this._checkContract();

    // 11. Distance score
    run.score += (dz / 10) * SCORE.perDistanceUnit * run.multiplier;

    // 12. Particles and feedback
    if (!this.reducedEffects) {
      this.particles.trail(this.player.x, 0, this.rng, this.player.phased, PLAYER.trailRate * dt);
    }
    this.particles.update(dt, this.world.speed);

    this._updateStatus();
    this._updateTutorial(dt);

    audio.updateAudioState(
      clamp((this.world.speed - 27) / 40, 0, 1),
      1 - run.stability / 100,
      this.player.phaseAmount
    );
    if (run.stability < 25) audio.startWarning();
    else audio.stopWarning();

    this.ui.updateHud(run, performance.now());
  }

  _updateTransition(dt) {
    this.deathTimer -= dt;
    const u = clamp(1 - this.deathTimer / FX.deathSlowTime, 0, 1);
    this.timeScale = 1 - (1 - FX.deathSlowFactor) * u;
    this.world.update(dt, this.run.time, this.timeScale * 0.6);
    this.particles.update(dt * this.timeScale, this.world.speed * this.timeScale);

    if (this.deathTimer <= -FX.resultsDelay + FX.deathSlowTime) {
      this.state = STATE.GAME_OVER;
      this.ui.setHudVisible(false);
      this.ui.showResults(this._summary);
      audio.sfx.gameOver();
    }
  }

  /* ------------------------------------------------------------------ *
   * Run events
   * ------------------------------------------------------------------ */

  _causeFor(type) {
    switch (type) {
      case T.MINE: return 'MINE DETONATION';
      case T.GATE: return 'GATE IMPACT';
      case T.ROTOR: return 'ROTOR STRIKE';
      case T.COLLAPSER: return 'CRUSHED';
      case T.CALIBRATION: return 'GATE IMPACT';
      default: return 'DEBRIS IMPACT';
    }
  }

  _collect(p) {
    const run = this.run;
    if (p.type === 'fragment') {
      run.fragments++;
      run.fragStreak++;
      run.bestFragStreak = Math.max(run.bestFragStreak, run.fragStreak);
      run.multBase = Math.min(SCORE.multiplierMax, run.multBase + SCORE.multPerFragment);
      const bonus = SCORE.fragment;
      run.score += bonus * run.multiplier;
      audio.sfx.fragment(Math.min(12, Math.floor(run.fragStreak / 3)));
      this.particles.burst(p.x, 0, this.reducedEffects ? 3 : 7, [63, 242, 255], {
        speed: 0.55, life: 0.4, size: 2.6,
      });
      this.renderer.addFlash('rgba(63,242,255,0.18)', 0.12);
    } else if (p.type === 'repair') {
      run.stability = Math.min(STABILITY.max, run.stability + STABILITY.repairNode);
      run.score += SCORE.repair * run.multiplier;
      audio.sfx.repair();
      this.particles.ring(p.x, 0, [77, 255, 176], 22, 0.5);
      this.particles.label(p.x, 0, `+${STABILITY.repairNode}% PAYLOAD`, COLORS.green);
    } else {
      this.player.addPhaseEnergy(45);
      audio.sfx.repair();
      this.particles.ring(p.x, 0, [168, 120, 255], 22, 0.5);
      this.particles.label(p.x, 0, '+PHASE', COLORS.violetHot);
    }
  }

  _takeDamage(amount) {
    const run = this.run;
    run.stability -= amount;
    run.damageEvents++;
    run.invuln = STABILITY.invulnAfterHit;
    run.fragStreak = 0;
    run.multBase = Math.max(SCORE.multiplierStart, run.multBase * SCORE.multDamagePenalty);
    audio.sfx.damage();
    vibrate(store.get('haptics') ? HAPTICS.damage : 0);
    this.renderer.addShake(11);
    this.renderer.addFlash('rgba(255,61,94,0.35)', 0.45);
    this.particles.burst(this.player.x, 0, this.reducedEffects ? 6 : 16, [255, 61, 94], {
      speed: 1.1, life: 0.55, size: 3.4,
    });
    this.ui.toast(`-${Math.round(amount)}% PAYLOAD`, 'red');
  }

  _resolveChunk(chunk) {
    const run = this.run;
    const total = chunk.fragTotal;
    const ratio = total === 0 ? 1 : chunk.fragTaken / total;
    const clean = !chunk.damaged && !chunk.corrupted && !chunk.scraped && ratio >= 0.7;
    if (!clean) return;

    run.cleanSections++;
    run.stability = Math.min(STABILITY.max, run.stability + STABILITY.cleanSection);
    run.multBase = Math.min(SCORE.multiplierMax, run.multBase + SCORE.multPerCleanChunk);
    run.score += SCORE.perfectChunk * run.multiplier;
    this.ui.toast('CLEAN TRANSIT', 'green');
  }

  _checkpoint() {
    const run = this.run;
    run.checkpoints++;
    run.stability = Math.min(STABILITY.max, run.stability + STABILITY.checkpoint);
    run.score += SCORE.checkpoint * run.multiplier;
    this.world.triggerCheckpointSlow();
    audio.sfx.checkpoint();
    vibrate(store.get('haptics') ? HAPTICS.checkpoint : 0);
    this.renderer.pulseZoom(0.06);
    this.renderer.addFlash('rgba(63,242,255,0.28)', 0.35);
    this.particles.burst(this.player.x, 4, this.reducedEffects ? 8 : 26, [63, 242, 255], {
      speed: 1.4, life: 0.7, size: 3,
    });
    this.ui.toast(`CHECKPOINT ${run.checkpoints} — ${Math.round(run.distance)}m`, 'cyan');
  }

  _addScore(points, label, color, x) {
    this.run.score += points * this.run.multiplier;
    this.particles.label(x ?? this.player.x, 0, label, color);
  }

  _updateMultiplier(dt) {
    const run = this.run;
    run.multBase = Math.max(SCORE.multiplierStart, run.multBase - SCORE.multDecay * dt);
    if (run.stability < SCORE.multResetStability) run.multBase = SCORE.multiplierStart;

    const speedRatio = clamp((this.world.speed - 27) / 37, 0, 1);
    const bonus = speedRatio * SCORE.multSpeedBonus + (this.player.phased ? PHASE.multiplierBonus : 0);
    run.multiplier = clamp(run.multBase + bonus, SCORE.multiplierStart, SCORE.multiplierMax);
    run.maxMultiplier = Math.max(run.maxMultiplier, run.multiplier);
  }

  _currentContract() {
    const idx = Math.floor(store.get('activeContract')) % CONTRACTS.length;
    return CONTRACTS[idx] || CONTRACTS[0];
  }

  _contractValue(contract) {
    const run = this.run;
    switch (contract.kind) {
      case 'checkpoints': return run.checkpoints;
      case 'bestFragStreak': return run.bestFragStreak;
      case 'cleanSections': return run.cleanSections;
      case 'nearMisses': return run.nearMisses;
      case 'phasePasses': return run.phasePasses;
      case 'maxMultiplier': return run.maxMultiplier;
      case 'stableTime': return run.stability >= contract.stability ? run.time : 0;
      default: return 0;
    }
  }

  _formatContractProgress(contract, value) {
    if (contract.kind === 'maxMultiplier') {
      return `${Math.min(value, contract.target).toFixed(2)}x/${contract.target.toFixed(2)}x`;
    }
    if (contract.kind === 'stableTime') {
      return `${Math.min(Math.floor(value), contract.target)}s/${contract.target}s`;
    }
    return `${Math.min(Math.floor(value), contract.target)}/${contract.target}`;
  }

  _updateContractProgress() {
    const run = this.run;
    if (!run.contract) return;
    const value = this._contractValue(run.contract);
    run.contractProgress = this._formatContractProgress(run.contract, value);
  }

  _checkContract() {
    const run = this.run;
    if (!run.contract || run.contractComplete) {
      this._updateContractProgress();
      return;
    }
    const value = this._contractValue(run.contract);
    run.contractProgress = this._formatContractProgress(run.contract, value);
    if (value < run.contract.target) return;

    run.contractComplete = true;
    run.contractProgress = this._formatContractProgress(run.contract, run.contract.target);
    run.score += run.contract.reward * run.multiplier;
    audio.sfx.checkpoint();
    this.renderer.addFlash('rgba(77,255,176,0.25)', 0.32);
    this.particles.ring(this.player.x, 0, [77, 255, 176], this.reducedEffects ? 16 : 34, 0.72);
    this.ui.toast('CONTRACT COMPLETE', 'green');
  }

  _updateStatus() {
    const run = this.run;
    if (run.stability < 25) this.ui.setStatus('PAYLOAD CRITICAL', 'bad');
    else if (this.player.scraping !== 0) this.ui.setStatus('HULL CONTACT', 'warn');
    else if (this.player.phaseEnergy < PHASE.minActivation) this.ui.setStatus('PHASE OFFLINE', 'violet');
    else if (this._barrierAhead()) this.ui.setStatus('ENERGY BARRIER AHEAD', 'violet');
    else this.ui.setStatus('', '');
  }

  _barrierAhead() {
    for (const { h } of this.world.allHazards()) {
      if (h.type === T.BARRIER && h.z > 0 && h.z < 46) return true;
    }
    return false;
  }

  _die(cause) {
    if (this.state !== STATE.PLAYING) return;
    const run = this.run;
    run.cause = cause;
    this.state = STATE.TRANSITION;
    this.deathTimer = FX.deathSlowTime;
    this.input.setEnabled(false);
    this.player.alive = false;

    audio.stopPhaseLoop();
    audio.stopWarning();
    audio.stopDrone();
    audio.sfx.crash();
    vibrate(store.get('haptics') ? HAPTICS.gameOver : 0);
    this.renderer.addShake(FX.shakeMaxPixels);
    this.renderer.addFlash('rgba(255,61,94,0.5)', 0.6);
    this.particles.debris(this.player.x, 0, this.reducedEffects ? 10 : 34, [63, 242, 255]);
    this.particles.burst(this.player.x, 0, this.reducedEffects ? 12 : 40, [255, 61, 94], {
      speed: 1.8, life: 0.9, size: 4,
    });

    this._summary = this._commitRunStats(true);
    this._renderState.showPlayer = false;
  }

  _commitRunStats(finished) {
    const run = this.run;
    if (run.committed) return this._summary || this._buildSummary(false);
    run.committed = true;
    const newBest = store.bumpMax('bestScore', Math.floor(run.score));
    store.bumpMax('bestDistance', Math.floor(run.distance));
    store.bumpMax('bestCheckpoint', run.checkpoints);
    store.bumpMax('bestStreak', run.bestFragStreak);
    store.bumpMax('bestMultiplier', Number(run.maxMultiplier.toFixed(2)));
    if (finished) store.add('totalRuns', 1);
    store.add('totalDistance', Math.floor(run.distance));
    store.add('totalFragments', run.fragments);
    store.add('totalNearMisses', run.nearMisses);
    store.add('totalCleanSections', run.cleanSections);
    store.add('totalPlayTime', Math.floor(run.time));
    if (run.contractComplete && !run.contractRewarded) {
      run.contractRewarded = true;
      store.add('totalContracts', 1);
      store.set('activeContract', (Math.floor(store.get('activeContract')) + 1) % CONTRACTS.length);
    }

    if (this.tutorialActive && run.time > 12) store.set('tutorialDone', true);

    return this._buildSummary(newBest);
  }

  _buildSummary(newBest) {
    const run = this.run;
    return {
      score: Math.floor(run.score),
      newBest,
      distance: run.distance,
      time: run.time,
      fragments: run.fragments,
      bestFragStreak: run.bestFragStreak,
      nearMisses: run.nearMisses,
      phasePasses: run.phasePasses,
      cleanSections: run.cleanSections,
      checkpoints: run.checkpoints,
      maxMultiplier: run.maxMultiplier,
      stability: run.stability,
      cause: run.cause,
      contractLabel: run.contract?.label || '',
      contractReward: run.contract?.reward || 0,
      contractProgress: run.contractProgress || '',
      contractComplete: run.contractComplete,
      highlights: this._summaryHighlights(run),
    };
  }

  _summaryHighlights(run) {
    const highlights = [
      ['CHAIN', formatPlain(run.bestFragStreak)],
      ['PEAK MULT', run.maxMultiplier.toFixed(2) + 'x'],
      ['PAYLOAD', Math.max(0, Math.round(run.stability)) + '%'],
    ];
    if (run.checkpoints > 0) highlights[0] = ['CHECKPOINTS', formatPlain(run.checkpoints)];
    if (run.nearMisses >= 3) highlights[1] = ['NEAR MISSES', formatPlain(run.nearMisses)];
    if (run.damageEvents === 0 && run.time > 10) highlights[2] = ['DAMAGE', 'NONE'];
    return highlights;
  }

  /* ------------------------------------------------------------------ *
   * Tutorial
   * ------------------------------------------------------------------ */

  replayTutorial() {
    store.set('tutorialDone', false);
    this.ui.toast('TUTORIAL RE-ARMED', 'cyan');
  }

  _advanceTutorial(id) {
    const idx = TUTORIAL_STEPS.findIndex((s) => s.id === id);
    if (idx < this.tutorialStep) return;
    this.tutorialStep = idx;
    this.ui.tutorial(TUTORIAL_STEPS[idx].text);
    this.tutorialTimer = 3.2;
  }

  _updateTutorial(dt) {
    if (!this.tutorialActive) return;
    this.tutorialTimer -= dt;
    if (this.tutorialTimer <= 0) this.ui.tutorial('');

    if (this.tutorialStep === 0 && this.run.fragments >= 1) this._advanceTutorial('collect');
    else if (this.tutorialStep === 1 && this._barrierAhead()) this._advanceTutorial('phase');
    else if (this.tutorialStep === 2 && this.run.stability < 92) this._advanceTutorial('stability');
    else if (this.tutorialStep === 3 && this.tutorialTimer <= 0) {
      this.tutorialActive = false;
      store.set('tutorialDone', true);
    }
  }

  /* ------------------------------------------------------------------ *
   * Render state
   * ------------------------------------------------------------------ */

  _syncRenderState() {
    const s = this._renderState;
    const run = this.run;
    const playing = this.state === STATE.PLAYING || this.state === STATE.STARTING || this.state === STATE.PAUSED;

    s.stability = run.stability;
    s.speed = this.world.speed;
    s.speedRatio = clamp((this.world.speed - 20) / 46, 0, 1);
    s.distanceZ = this.world.distanceZ;
    s.phaseAmount = this.player.phaseAmount;
    s.showPlayer = playing;
    s.wallHot = this.player.scraping !== 0;

    const damage = clamp(1 - run.stability / 100, 0, 1);
    s.glitch = playing || this.state === STATE.TRANSITION
      ? Math.pow(damage, FX.glitchCurve) * FX.glitchMax
      : 0;
    s.criticalPulse = run.stability < 25 && playing
      ? 0.5 + 0.5 * Math.sin(performance.now() / 160)
      : 0;
  }

  /* ------------------------------------------------------------------ *
   * Environment
   * ------------------------------------------------------------------ */

  onVisibilityHidden() {
    if (this.state === STATE.PLAYING || this.state === STATE.STARTING) this.pause();
    audio.suspendAudio();
  }

  onResize() {
    this.renderer.resize();
  }
}
