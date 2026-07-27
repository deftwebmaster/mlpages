import { CONFIG } from './config.js';
import { CHAMBER } from './stageHelpers.js';
import { getStage, getAllStages, STAGE_COUNT } from './stages.js';
import { LoadedStage } from './stageLoader.js';
import { Renderer } from './renderer.js';
import { UIManager } from './ui.js';
import { InputManager } from './input.js';
import { audio } from './audio.js';
import { GameLoop } from './loop.js';
import { updateCorruption, handleDestruction } from './componentBehaviors.js';
import { Component } from './components.js';
import { ScoreTracker } from './scoring.js';
import {
  isPrimaryObjectiveComplete,
  evaluateSecondaryObjectives,
  primaryObjectiveLabel
} from './objectives.js';
import { computeRank, computeMedals } from './scoring.js';
import {
  loadSave,
  recordStageResult,
  updateStats,
  markTutorialSeen,
  updateSettings
} from './storage.js';
import { initPwa, promptInstall } from './pwa.js';

const STATES = {
  LOADING: 'LOADING',
  MENU: 'MENU',
  STAGE_SELECT: 'STAGE_SELECT',
  STAGE_INTRO: 'STAGE_INTRO',
  READY: 'READY',
  PLAYING: 'PLAYING',
  ORB_LOST: 'ORB_LOST',
  BOSS_TRANSITION: 'BOSS_TRANSITION',
  PAUSED: 'PAUSED',
  STAGE_COMPLETE: 'STAGE_COMPLETE',
  STAGE_FAILED: 'STAGE_FAILED',
  SETTINGS: 'SETTINGS',
  HELP: 'HELP',
  STATS: 'STATS'
};

const ROUTE_KEYS = { 1: 'deflector', 2: 'orb', 3: 'reactorControl' };

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.renderer = new Renderer(this.ctx);
    this.input = new InputManager(canvas);
    this.input.setLogicalSize(CHAMBER.width, CHAMBER.height);

    this.ui = new UIManager({
      onAction: (action, meta) => this.handleAction(action, meta),
      onSettingChange: (key, val) => this.handleSettingChange(key, val),
      onMobileLaunch: () => (this.input.launchRequested = true),
      onMobileCatch: () => (this.input.catchRequested = true)
    });

    this.state = STATES.LOADING;
    this.overlayReturnState = STATES.MENU;
    this.loaded = null;
    this.currentStageId = 1;
    this.orbLostTimer = 0;
    this.readyTimer = 0;
    this.pendingTutorials = [];
    this.activeTutorialTimer = 0;
    this.hudAccumulator = 0;
    this.wasPlayingBeforeHidden = false;
    this.runStats = null;

    this.loop = new GameLoop((dt) => this.update(dt));
    this.loop.onVisibilityPause = () => {
      if (this.state === STATES.PLAYING) this._goPaused();
    };

    this._resize = this._resize.bind(this);
    window.addEventListener('resize', this._resize);
    window.addEventListener('orientationchange', this._resize);
    this._resize();

    this._unlockAudioOnce = () => {
      audio.unlock();
      audio.startMusic();
      document.removeEventListener('pointerdown', this._unlockAudioOnce);
      document.removeEventListener('keydown', this._unlockAudioOnce);
    };
    document.addEventListener('pointerdown', this._unlockAudioOnce);
    document.addEventListener('keydown', this._unlockAudioOnce);

    initPwa({ onInstallAvailable: (avail) => this.ui.showInstallButton(avail) });

    this.ui.syncSettingsUI();
  }

  start() {
    this.loop.start();
    setTimeout(() => this._goMenu(), 500);
  }

  _resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, CONFIG.canvas.maxPixelRatio);
    this.canvas.width = Math.round(CHAMBER.width * dpr);
    this.canvas.height = Math.round(CHAMBER.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // ---------------------------------------------------------------- actions
  handleAction(action, meta) {
    audio.play('menu');
    switch (action) {
      case 'newgame':
        this.currentStageId = 1;
        this._goStageIntro(1);
        break;
      case 'continue':
        this.currentStageId = loadSave().highestUnlockedStage;
        this._goStageIntro(this.currentStageId);
        break;
      case 'stageselect':
        this.overlayReturnState = STATES.STAGE_SELECT;
        this.ui.buildStageGrid();
        this._setState(STATES.STAGE_SELECT);
        break;
      case 'selectStage':
        this._goStageIntro(meta.stageId);
        break;
      case 'stats':
        this.ui.buildStats();
        this._pushOverlay(STATES.STATS, 'stats');
        break;
      case 'settings':
        this.ui.syncSettingsUI();
        this._pushOverlay(STATES.SETTINGS, 'settings');
        break;
      case 'help':
        this._pushOverlay(STATES.HELP, 'help');
        break;
      case 'menu':
        this._goMenu();
        break;
      case 'back':
        this._popOverlay();
        break;
      case 'install':
        promptInstall();
        break;
      case 'start':
        this._beginStage(this.currentStageId);
        break;
      case 'pause':
        if (this.state === STATES.PLAYING) this._goPaused();
        break;
      case 'resume':
        this._resumeFromPause();
        break;
      case 'restart':
        this._beginStage(this.currentStageId);
        break;
      case 'retry':
        this._beginStage(this.currentStageId);
        break;
      case 'next':
        this._goStageIntro(this.currentStageId + 1);
        break;
      case 'selectChannel':
        if (this.loaded) {
          this.loaded.routing.select(meta.channel);
          updateStats({ routingChanges: 1 });
        }
        break;
      default:
        break;
    }
  }

  handleSettingChange(key, val) {
    if (key === 'reducedEffects' && this.loaded) this.loaded.particles.clear();
  }

  _pushOverlay(state, screenName) {
    this.previousState = this.state;
    this._setState(state, false);
    this.ui.pushOverlay(screenName);
  }

  _popOverlay() {
    this.ui.popOverlay();
    this._setState(this.previousState || STATES.MENU, false);
  }

  // ---------------------------------------------------------------- flow
  _goMenu() {
    this.ui.updateMenu();
    this._setState(STATES.MENU);
  }

  _goStageIntro(stageId) {
    const stage = getStage(stageId);
    if (!stage) return this._goMenu();
    this.currentStageId = stageId;
    this.ui.showStageIntro(stage);
    this._setState(STATES.STAGE_INTRO);
  }

  _beginStage(stageId) {
    const stage = getStage(stageId);
    if (!stage) return;
    this.loaded = new LoadedStage(stage, CHAMBER.width, CHAMBER.height);
    const save = loadSave();
    this.charges = save.settings.assist ? Infinity : stage.containmentCharges ?? CONFIG.containmentChargesDefault;
    this.runStats = {
      elapsedTime: 0,
      orbsLostThisStage: 0,
      energyCollected: 0,
      energyMissed: 0,
      energyTotalAvailable: this.loaded.components.reduce((sum, c) => sum + c.energyValue(), 0),
      maxCombo: 0,
      shieldUsed: false,
      multiOrbUsed: false,
      volatileChainCount: 0,
      secondaryResults: {},
      coreStabilized: false
    };
    this.scoreTracker = new ScoreTracker();
    this.pendingTutorials = (stage.tutorialPrompts || []).filter((t) => !save.tutorialSeen[t.id]);
    this.activeTutorialTimer = 0;
    audio.setMusicIntensity(stage.isBoss ? 0.8 : 0.3);
    this.ui.setRoutingVisible(!!stage.powerRoutingRules?.enabled !== false && this.loaded.routing.enabled);
    this._setState(STATES.READY);
    this.readyTimer = 0.15;
  }

  _restartCurrentStage() {
    this._beginStage(this.currentStageId);
  }

  _goPaused() {
    this.previousState = STATES.PLAYING;
    this._setState(STATES.PAUSED, false);
    this.ui.pushOverlay('pause');
    audio.ctx?.suspend?.();
  }

  _resumeFromPause() {
    this.ui.popOverlay();
    this._setState(STATES.PLAYING, false);
    audio.ctx?.resume?.();
  }

  _setState(state, resetOverlayVisibility = true) {
    this.state = state;
    const playingLike = state === STATES.PLAYING || state === STATES.READY || state === STATES.ORB_LOST;
    this.ui.setGameplayUiVisible(playingLike);
    this.ui.setRoutingVisible(playingLike && !!this.loaded?.routing.enabled);
    if (resetOverlayVisibility) {
      const screenMap = {
        LOADING: 'loading',
        MENU: 'menu',
        STAGE_SELECT: 'stageSelect',
        STAGE_INTRO: 'stageIntro',
        STAGE_COMPLETE: 'stageComplete',
        STAGE_FAILED: 'stageFailed'
      };
      if (screenMap[state]) {
        this.ui.hideAllOverlays();
        this.ui.showScreen(screenMap[state]);
      } else if (playingLike) {
        this.ui.hideAllOverlays();
        this.ui.showScreen(null);
      }
    }
  }

  // ---------------------------------------------------------------- update
  update(dt) {
    audio.update(dt);
    if (this.state === STATES.READY) {
      this.readyTimer -= dt;
      if (this.readyTimer <= 0) this._setState(STATES.PLAYING, false);
      this._render();
      return;
    }
    if (this.state !== STATES.PLAYING) {
      if (this.state !== STATES.PAUSED) this._render();
      return;
    }

    this._updatePlaying(dt);
    this._render();
  }

  _updatePlaying(dt) {
    const loaded = this.loaded;
    const flags = this.input.consumeFrameFlags();
    if (flags.pauseRequested) return this._goPaused();
    if (flags.restartRequested) return this._restartCurrentStage();

    const moveAxis = this.input.computeMoveAxis();
    loaded.deflector.update(dt, moveAxis, this.input.pointerX, this.input.pointerActive);

    if (flags.routeSelectRequested) loaded.routing.select(ROUTE_KEYS[flags.routeSelectRequested]);
    if (flags.cycleRequested) loaded.routing.cycle(flags.cycleRequested);

    const heldOrbs = loaded.orbManager.orbs.filter((o) => o.held);
    if (flags.launchRequested) {
      if (heldOrbs.length > 0) {
        for (const o of heldOrbs) loaded.orbManager.launch(o, loaded.deflector, 0);
        audio.play('launch');
      } else {
        const tier = loaded.abilities.activate(loaded.routing.selected, loaded.routing, this._world());
        if (tier) updateStats({ abilitiesActivated: 1 });
      }
    }
    if (flags.catchRequested) {
      if (!loaded.deflector.holding && loaded.deflector.catchCharges > 0) {
        loaded.deflector.tryStartCatch();
      }
    }

    const world = this._world();

    for (const c of loaded.components) {
      c.update(dt, loaded.abilities.getTimeScale());
      if (c.typeDef.isCorruption) {
        updateCorruption(c, dt, { onCorruptionSpread: (node) => this._spreadCorruption(node) });
      }
    }

    loaded.shields.update(dt);
    loaded.routing.update(dt);
    loaded.abilities.update(dt);

    const { lostOrbs } = loaded.orbManager.update(dt, world);
    if (lostOrbs.length && loaded.orbManager.count() === 0) {
      this._handleFinalOrbLost();
      return;
    }

    const packetResult = loaded.energyPackets.update(dt, loaded.deflector, world);
    if (packetResult.collected > 0) {
      loaded.routing.addEnergy(packetResult.collected);
      this.runStats.energyCollected += packetResult.collected;
      updateStats({ energyCollected: packetResult.collected });
    }
    if (packetResult.missed > 0) {
      this.runStats.energyMissed += packetResult.missed;
      updateStats({ energyMissed: packetResult.missed });
    }

    loaded.powerUps.update(dt, loaded.deflector, world);
    loaded.hazards.update(dt, world);
    loaded.particles.update(dt);
    this.scoreTracker.update(dt);
    if (loaded.deflector.shieldActive) this.runStats.shieldUsed = true;

    if (loaded.boss) loaded.boss.update(dt, world);

    this.runStats.elapsedTime += dt;
    this.runStats.maxCombo = Math.max(this.runStats.maxCombo, this.scoreTracker.maxCombo);
    this.renderer.updateShake(dt);

    this._updateTutorial(dt);
    this._checkObjectives();
    this._updateHud();
  }

  _world() {
    const loaded = this.loaded;
    return {
      deflector: loaded.deflector,
      components: loaded.components,
      orbManager: loaded.orbManager,
      shields: loaded.shields,
      hazards: loaded.hazards,
      connectionGraph: loaded.connectionGraph,
      routing: loaded.routing,
      abilities: loaded.abilities,
      particles: loaded.particles,
      audio,
      gravityWells: loaded.hazards.gravityWells,
      orbs: loaded.orbManager.orbs,
      stats: this.runStats,
      haptics: (kind) => this._haptic(kind),
      onComponentDestroyed: (comp) => this._onComponentDestroyed(comp),
      onComponentHit: (comp) => this._onComponentHit(comp),
      onShieldReflect: () => {},
      onVolatileChain: () => {
        this.runStats.volatileChainCount += 1;
        updateStats({ volatileChains: 1 });
      },
      onMagneticCatch: () => updateStats({ magneticCatches: 1 }),
      onDeflectorHit: () => {},
      onHazardImpact: (chargeLost) => {
        if (chargeLost) this._loseCharge();
      },
      onAbilityActivated: () => {},
      onScore: (n) => this._addScore(n),
      onBossPhaseComplete: () => {},
      onBossDefeated: () => this._handleBossDefeated(),
      onBossOverloadFailed: () => this._handleStageFailed(),
      onBossCoreToggle: () => {},
      onContainmentPulse: () => {}
    };
  }

  _haptic(kind) {
    const save = loadSave();
    if (!save.settings.haptics || !navigator.vibrate) return;
    const pattern = CONFIG.haptics[kind];
    if (pattern) navigator.vibrate(pattern);
  }

  _addScore(n) {
    this.scoreTracker.add(n);
  }

  _onComponentDestroyed(comp) {
    const points = this.scoreTracker.add(comp.scoreValue());
    this.scoreTracker.registerHit();
    this.loaded.energyPackets.spawnFromComponent(comp);
    this.loaded.powerUps.maybeDrop(comp);
    updateStats({ componentsDestroyed: 1 });
    if (comp.type === 'structural') updateStats({ structuralDestroyed: 1 });
    if (comp.typeDef.isShieldNode) updateStats({ shieldNodesDestroyed: 1 });
    handleDestruction(comp, { ...this._world(), chainDepth: 0 });
  }

  _onComponentHit(comp) {
    this.scoreTracker.add(10);
    this.scoreTracker.registerHit();
  }

  _spreadCorruption(node) {
    const targets = node.behaviorConfig.spreadTargets;
    if (!targets || !targets.length) return;
    const target = targets.shift();
    const newNode = new Component({
      id: `${node.id}_spread_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'corruption',
      x: target.x,
      y: target.y,
      width: node.width,
      height: node.height,
      hitPoints: 2,
      objectiveTag: node.objectiveTag,
      behaviorConfig: { spreadInterval: node.behaviorConfig.spreadInterval, spreadTargets: [] }
    });
    this.loaded.components.push(newNode);
    this.loaded.connectionGraph.byId.set(newNode.id, newNode);
    this.loaded.particles.burst(target.x, target.y, 10, { color: '#ff4d6d', minSpeed: 30 });
  }

  _handleFinalOrbLost() {
    this._loseCharge();
    this.runStats.orbsLostThisStage += 1;
    updateStats({ orbsLost: 1 });
    this.scoreTracker.resetCombo();
    audio.play('orbLoss');
    this._haptic('orbLoss');
    this.renderer.triggerShake(6, 0.3, loadSave().settings);
    if (this.charges <= 0) {
      this._handleStageFailed();
      return;
    }
    this._setState(STATES.ORB_LOST, false);
    this.loaded.orbManager.spawnHeldOrb(this.loaded.deflector);
    this._setState(STATES.READY, false);
    this.readyTimer = 0.6;
  }

  _loseCharge() {
    if (this.charges === Infinity) return;
    this.charges = Math.max(0, this.charges - 1);
  }

  _updateTutorial(dt) {
    if (!this.pendingTutorials.length) return;
    if (this.activeTutorialTimer <= 0) {
      const t = this.pendingTutorials[0];
      this.ui.showTutorial(t.text);
      this.activeTutorialTimer = 3.2;
      markTutorialSeen(t.id);
    } else {
      this.activeTutorialTimer -= dt;
      if (this.activeTutorialTimer <= 0) {
        this.pendingTutorials.shift();
        this.ui.hideTutorial();
      }
    }
  }

  _checkObjectives() {
    const stage = this.loaded.stage;
    const complete = isPrimaryObjectiveComplete(
      stage,
      this.loaded.components,
      this.runStats,
      this.loaded.boss
    );
    if (complete) this._handleStageComplete();
  }

  _handleBossDefeated() {
    updateStats({ bossesDefeated: 1 });
    this._handleStageComplete();
  }

  _handleStageComplete() {
    if (this.state !== STATES.PLAYING) return;
    const stage = this.loaded.stage;
    evaluateSecondaryObjectives(stage, this.loaded.components, this.runStats, this.runStats.secondaryResults);
    this.runStats.score = this.scoreTracker.score;
    this.runStats.chargesRemaining = this.charges === Infinity ? (stage.containmentCharges ?? 3) : this.charges;
    this.runStats.time = this.runStats.elapsedTime;
    let rank = computeRank(stage, this.runStats, true);
    if (loadSave().settings.assist) {
      const order = ['C', 'B', 'A', 'S', 'S+'];
      if (order.indexOf(rank) > order.indexOf('A')) rank = 'A';
    }
    const medals = computeMedals(stage, this.runStats, true);
    const result = {
      score: this.runStats.score,
      time: this.runStats.time,
      chargesRemaining: this.runStats.chargesRemaining,
      maxCombo: this.runStats.maxCombo,
      rank,
      medals,
      completed: true,
      secondaryDone: Object.entries(this.runStats.secondaryResults).filter(([, v]) => v).map(([k]) => k)
    };
    recordStageResult(stage.id, result);
    updateStats({ playTimeSeconds: Math.round(this.runStats.elapsedTime), highestCombo: this.runStats.maxCombo });
    if (rank === 'S+') updateStats({ sPlusRanks: 1 });
    audio.play('stageComplete');
    this.renderer.triggerShake(4, 0.4, loadSave().settings);
    this.ui.showStageComplete(result, stage);
    this._setState(STATES.STAGE_COMPLETE, false);
  }

  _handleStageFailed() {
    if (this.state === STATES.STAGE_FAILED) return;
    const stage = this.loaded.stage;
    const record = loadSave().stageRecords[stage.id];
    const result = { score: this.scoreTracker.score, time: this.runStats.elapsedTime, bestScore: record?.bestScore || 0 };
    audio.play('warning');
    this.ui.showStageFailed(result);
    this._setState(STATES.STAGE_FAILED, false);
  }

  _updateHud() {
    this.hudAccumulator += 1;
    if (this.hudAccumulator % 3 !== 0) return;
    const stage = this.loaded.stage;
    this.ui.updateHUD({
      score: this.scoreTracker.score,
      comboMultiplier: this.scoreTracker.comboMultiplier,
      charges: this.charges === Infinity ? (stage.containmentCharges ?? 3) : this.charges,
      maxCharges: stage.containmentCharges ?? CONFIG.containmentChargesDefault,
      objectiveText: primaryObjectiveLabel(stage),
      boss: this.loaded.boss
        ? { label: this.loaded.boss.def.label, progress: this.loaded.boss.progress() }
        : null
    });
    this.ui.updateRouting(this.loaded.routing);
  }

  _render() {
    this.ctx.clearRect(0, 0, CHAMBER.width, CHAMBER.height);
    if (!this.loaded) return;
    const settings = loadSave().settings;
    this.renderer.render(this.loaded, {
      reducedMotion: settings.reducedMotion,
      scanActive: this.loaded.abilities.isScanActive(),
      coreExposed: this.loaded.boss ? this.loaded.boss.phaseIndex === this.loaded.boss.def.phases.length - 1 : false
    });
  }
}
