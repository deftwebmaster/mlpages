import { CONFIG, UPGRADE_DEFS, UPGRADE_MAX_LEVEL } from './config.js';
import { InputManager } from './input.js';
import { Renderer, Camera, BACKGROUNDS } from './renderer.js';
import { createShip, updateShip, canFire, fireWeapon, damageShip } from './ship.js';
import { createProjectilePool, spawnProjectile, updateProjectiles } from './projectiles.js';
import { updateWreck, applyDamageToWreck } from './wrecks.js';
import { destroyWreck } from './fragmentation.js';
import { SpatialGrid, circleOverlap, wrappedNormal, wrappedDistance } from './collisions.js';
import { createSalvage, updateSalvage, applyTractorBeam } from './tractor.js';
import { createParticlePool, updateParticles, emitThruster, emitImpact, emitExplosion, emitTractorParticle, emitPickup } from './particles.js';
import { getMissionDefs, getMissionDef, buildMissionRuntime } from './missions.js';
import { UI, computeScore, computeRank } from './ui.js';
import { AudioEngine } from './audio.js';
import { loadSave, writeSave } from './storage.js';
import { resolveElastic, speedOf } from './physics.js';
import { wrapDelta, wrapValue, clamp } from './utils.js';
import { drawFrame } from './draw.js';

const EXTRACTION_WARP_DURATION = 0.9;

const STATE = {
  LOADING: 'loading', MENU: 'menu', MISSION_SELECT: 'mission-select', STATISTICS: 'statistics',
  SETTINGS: 'settings', UPGRADES: 'upgrades', BRIEF: 'brief', PLAYING: 'playing', PAUSED: 'paused',
  COMPLETE: 'complete', FAILURE: 'failure',
};

export class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.renderer = new Renderer(this.canvas);
    this.input = new InputManager();
    this.ui = new UI();
    this.audio = new AudioEngine();
    this.save = loadSave();

    this.state = STATE.LOADING;
    this.selectedMissionId = 1;
    this.mission = null;
    this.ship = null;
    this.camera = null;
    this.projectiles = createProjectilePool();
    this.particles = createParticlePool();
    this.events = [];
    this.pendingResult = null;

    this._lastTime = 0;
    this._accumulator = 0;
    this._heartbeatTimer = 0;

    this._bindUIActions();
    this._bindMobileControls();
    window.addEventListener('resize', () => this.renderer.resize());
    this.renderer.resize();

    this.ui.applyAccessibility(this.save.settings);
    this.audio.setSfxVolume(this.save.settings.sfxVolume);
    this.audio.setMusicVolume(this.save.settings.musicVolume);
  }

  boot() {
    let pct = 0;
    const step = () => {
      pct += 20 + Math.random() * 30;
      this.ui.setLoadingProgress(pct, pct > 70 ? 'Priming thrusters…' : 'Calibrating salvage rig…');
      if (pct >= 100) {
        setTimeout(() => this.goToMenu(), 200);
      } else {
        setTimeout(step, 90);
      }
    };
    step();
    requestAnimationFrame((t) => this._loop(t));
  }

  _unlockAudioOnce() {
    if (this._audioUnlocked) return;
    this._audioUnlocked = true;
    this.audio.init();
    this.audio.resume();
    this.audio.startAmbient();
  }

  // ---------------- UI wiring ----------------
  _bindUIActions() {
    document.body.addEventListener('pointerdown', () => this._unlockAudioOnce(), { once: false });

    document.querySelectorAll('[data-action]').forEach(el => {
      el.addEventListener('click', () => this._handleAction(el.dataset.action));
    });

    this.ui.bindSettings(this.save, (settings) => {
      this.save.settings = settings;
      writeSave(this.save);
      this.ui.applyAccessibility(settings);
      this.audio.setSfxVolume(settings.sfxVolume);
      this.audio.setMusicVolume(settings.musicVolume);
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      window.__deferredInstallPrompt = e;
      const btn = document.getElementById('installBtn');
      if (btn) btn.hidden = false;
    });
  }

  _handleAction(action) {
    this.audio.playMenuClick();
    switch (action) {
      case 'new-game':
        this.goToMissionSelect(); break;
      case 'continue': {
        const next = Math.min(this.save.unlockedMissions, 12);
        this.openBrief(next); break;
      }
      case 'mission-select': this.goToMissionSelect(); break;
      case 'upgrades': this.goToUpgrades(); break;
      case 'statistics': this.ui.renderStats(this.save); this.state = STATE.STATISTICS; this.ui.showScreen('screen-statistics'); break;
      case 'settings': this.state = STATE.SETTINGS; this.ui.showScreen('screen-settings'); break;
      case 'back-to-menu': this.goToMenu(); break;
      case 'back-to-mission-select': this.goToMissionSelect(); break;
      case 'launch-mission': this.startMission(this.selectedMissionId); break;
      case 'pause': this.pause(); break;
      case 'resume': this.resume(); break;
      case 'restart-mission': this.ui.hideFailure(); this.startMission(this.selectedMissionId); break;
      case 'quit-to-menu': this.ui.hideComplete(); this.ui.hideFailure(); this.ui.showPause(false); this.goToMenu(); break;
      case 'next-mission': this.ui.hideComplete(); this.openBrief(Math.min(this.selectedMissionId + 1, 12)); break;
      case 'install':
        if (window.__deferredInstallPrompt) { window.__deferredInstallPrompt.prompt(); window.__deferredInstallPrompt = null; }
        break;
    }
  }

  _bindMobileControls() {
    const zone = document.getElementById('joyZone');
    const knob = document.getElementById('joyKnob');
    this.input.bindJoystick(zone, knob);
    const map = [
      ['btnThrust', 'Thrust'], ['btnBrake', 'Brake'], ['btnFire', 'Fire'], ['btnTractor', 'Tractor'],
    ];
    for (const [id, flag] of map) {
      const el = document.getElementById(id);
      this.input.bindButton(el, () => this.input.setMobileFlag(flag, true), () => this.input.setMobileFlag(flag, false));
    }
  }

  goToMenu() {
    this.state = STATE.MENU;
    this.ui.renderMenu(this.save);
    this.ui.showScreen('screen-menu');
  }

  goToMissionSelect() {
    this.state = STATE.MISSION_SELECT;
    this.ui.renderMissionGrid(getMissionDefs(), this.save, (id) => this.openBrief(id));
    this.ui.showScreen('screen-mission-select');
  }

  openBrief(id) {
    this.selectedMissionId = id;
    this.state = STATE.BRIEF;
    this.ui.renderBrief(getMissionDef(id), this.save);
    this.ui.showScreen('screen-brief');
  }

  goToUpgrades() {
    this.state = STATE.UPGRADES;
    this.ui.renderUpgrades(this.save, UPGRADE_DEFS, UPGRADE_MAX_LEVEL, (key) => this.buyUpgrade(key));
    this.ui.showScreen('screen-upgrades');
  }

  buyUpgrade(key) {
    const def = UPGRADE_DEFS[key];
    const level = this.save.upgrades[key] || 0;
    if (level >= UPGRADE_MAX_LEVEL) return;
    const cost = def.costs[level];
    if (this.save.credits < cost) return;
    this.save.credits -= cost;
    this.save.upgrades[key] = level + 1;
    writeSave(this.save);
    this.audio.playPickup();
    this.ui.renderUpgrades(this.save, UPGRADE_DEFS, UPGRADE_MAX_LEVEL, (k) => this.buyUpgrade(k));
  }

  // ---------------- Mission lifecycle ----------------
  startMission(id) {
    const def = getMissionDef(id);
    this.mission = buildMissionRuntime(def);
    this.ship = createShip(this.mission.startX, this.mission.startY, this.save.upgrades);
    this.camera = new Camera(this.mission.worldW, this.mission.worldH);
    this.camera.follow(this.ship, 0);
    this.renderer.generateStars(this.mission.worldW, this.mission.worldH, BACKGROUNDS[def.background].starDensity);
    this.renderer.generateNebula(this.mission.worldW, this.mission.worldH, BACKGROUNDS[def.background]);
    this.projectiles.clear();
    this.particles.clear();
    this.events.length = 0;
    this.grid = new SpatialGrid(160, this.mission.worldW, this.mission.worldH);
    this.extracting = false;
    this.extractionTimer = 0;

    this.state = STATE.PLAYING;
    this.ui.showScreen('screen-game');
    this.renderer.resize();
    this.ui.showPause(false);
    this.ui.hideComplete();
    this.ui.hideFailure();
    this._sessionStart = performance.now();
  }

  pause() {
    if (this.state !== STATE.PLAYING) return;
    this.state = STATE.PAUSED;
    this.ui.showPause(true);
    this.audio.setThruster(false);
    this.audio.setTractor(false);
    this.audio.setHeatAlarm(false);
  }
  resume() {
    if (this.state !== STATE.PAUSED) return;
    this.state = STATE.PLAYING;
    this.ui.showPause(false);
  }

  // ---------------- Main loop ----------------
  _loop(t) {
    requestAnimationFrame((nt) => this._loop(nt));
    if (!this._lastTime) this._lastTime = t;
    let frameDt = (t - this._lastTime) / 1000;
    this._lastTime = t;
    frameDt = Math.min(frameDt, 0.25);

    if (this.state === STATE.PLAYING) {
      this.input.update();
      if (this.input.consumePause()) { this.pause(); }
      this._accumulator += frameDt;
      let steps = 0;
      while (this._accumulator >= CONFIG.PHYSICS.FIXED_DT && steps < CONFIG.PHYSICS.MAX_STEPS) {
        this._tick(CONFIG.PHYSICS.FIXED_DT);
        this._accumulator -= CONFIG.PHYSICS.FIXED_DT;
        steps++;
      }
      this.save.stats.playTimeSec += frameDt;
    } else {
      this.input.update();
      if (this.state === STATE.PAUSED && this.input.consumePause()) this.resume();
    }

    if (this.state === STATE.PLAYING || this.state === STATE.PAUSED) {
      this.camera.follow(this.ship, frameDt);
      updateParticles(this.particles, this.state === STATE.PAUSED ? 0 : frameDt, this.mission.worldW, this.mission.worldH);
      drawFrame(this.renderer, this.camera, this.mission, this.ship, this.projectiles, this.particles, BACKGROUNDS[this.mission.def.background]);
      this.ui.updateHUD(this.mission, this.ship);
      this.ui.drawRadar(this.mission, this.ship);
    }
  }

  _tick(dt) {
    const m = this.mission, ship = this.ship;

    if (this.extracting) {
      this._tickExtraction(dt);
      return;
    }

    updateShip(ship, this.input, dt, m.worldW, m.worldH);
    this.audio.setThruster(ship.thrusting);
    this.audio.setTractor(ship.tractorActive);
    this.audio.setHeatAlarm(ship.heat >= 85);
    if (ship.thrusting) emitThruster(this.particles, ship, dt, false);
    if (ship.braking) emitThruster(this.particles, ship, dt, true);
    if (ship.tractorActive && Math.random() < 0.5) emitTractorParticle(this.particles, ship);

    if (ship.hull / ship.maxHull < 0.25) {
      this._heartbeatTimer -= dt;
      if (this._heartbeatTimer <= 0) {
        this.audio.playHeartbeat();
        this._heartbeatTimer = 0.6;
      }
    } else {
      this._heartbeatTimer = 0;
    }

    if (this.input.fire && canFire(ship)) {
      fireWeapon(ship);
      spawnProjectile(this.projectiles, ship);
      m.shotsFired++;
      this.save.stats.shotsFired++;
      this.audio.playFire();
    }

    updateProjectiles(this.projectiles, dt, m.worldW, m.worldH);
    updateSalvage(m.salvage, dt, m.worldW, m.worldH);
    applyTractorBeam(ship, m.salvage, dt, this.events, m.worldW, m.worldH);

    for (const w of m.wrecks) if (w.alive) updateWreck(w, dt, m.worldW, m.worldH, this.events);

    this._resolveCollisions(dt);
    this._processEvents(dt);

    // combo decay
    if (m.combo.timer > 0) {
      m.combo.timer -= dt;
      if (m.combo.timer <= 0) { m.combo.mult = 1; m.combo.killsInWindow = 0; }
    }

    // cleanup destroyed wrecks (reactor explosion / fragmentation marks alive=false)
    for (let i = m.wrecks.length - 1; i >= 0; i--) {
      if (!m.wrecks[i].alive) m.wrecks.splice(i, 1);
    }
    // cleanup collected salvage
    for (let i = m.salvage.length - 1; i >= 0; i--) {
      if (m.salvage[i].collected) m.salvage.splice(i, 1);
    }

    m.elapsed += dt;
    if (m.timer) {
      m.timeRemaining -= dt;
      if (m.timeRemaining <= 0 && !m.gate.active) {
        this._failMission('Time Expired', 'The extraction window closed before quota was met.');
        return;
      }
      if (m.timeRemaining <= 0 && m.gate.active) {
        this._failMission('Extraction Failed', 'Time ran out before you reached the gate.');
        return;
      }
    }

    if (!m.gate.active && m.cargoCollected >= m.quota) {
      m.gate.active = true;
      this.audio.playExtraction();
    }
    if (m.gate.active) {
      const gateEntity = { x: m.gate.x, y: m.gate.y, radius: m.gate.radius };
      if (circleOverlap(ship, gateEntity, m.worldW, m.worldH)) {
        this.extracting = true;
        this.extractionTimer = EXTRACTION_WARP_DURATION;
        ship.warpProgress = 0;
        this.audio.setThruster(false);
        this.audio.setTractor(false);
        this.audio.setHeatAlarm(false);
        return;
      }
    }

    if (!ship.alive) {
      this._failMission('Salvage Craft Lost', 'Hull integrity reached zero.');
    }
  }

  // Ship spirals into the gate and shrinks before the mission-complete screen appears.
  _tickExtraction(dt) {
    const m = this.mission, ship = this.ship;
    this.extractionTimer -= dt;
    ship.warpProgress = clamp(1 - this.extractionTimer / EXTRACTION_WARP_DURATION, 0, 1);
    ship.angle += dt * 14; // fast spin while warping in

    const dx = wrapDelta(m.gate.x, ship.x, m.worldW);
    const dy = wrapDelta(m.gate.y, ship.y, m.worldH);
    ship.x = wrapValue(ship.x + dx * dt * 5, m.worldW);
    ship.y = wrapValue(ship.y + dy * dt * 5, m.worldH);
    ship.vx = 0; ship.vy = 0;

    if (Math.random() < 0.9) emitTractorParticle(this.particles, ship);

    if (this.extractionTimer <= 0) {
      this.extracting = false;
      this._completeMission();
    }
  }

  _resolveCollisions(dt) {
    const m = this.mission, ship = this.ship;
    this.grid.buildFrom(m.wrecks.filter(w => w.alive));

    // Projectiles vs wrecks
    for (const p of this.projectiles.active) {
      if (p.__hit) continue;
      this.grid.forNear(p.x, p.y, (w) => {
        if (p.__hit || !w.alive) return;
        if (circleOverlap(p, w, m.worldW, m.worldH)) {
          p.__hit = true;
          this.mission.shotsHit++;
          this.save.stats.shotsHit++;
          const destroyed = applyDamageToWreck(w, p.damage, this.events);
          emitImpact(this.particles, p.x, p.y, 5, '#ffd24f');
          this.audio.playImpact();
          if (destroyed) {
            w.alive = false;
            this._registerKill(w);
          }
        }
      });
    }

    // Ship vs wrecks
    for (const w of m.wrecks) {
      if (!w.alive) continue;
      if (circleOverlap(ship, w, m.worldW, m.worldH)) {
        const { nx, ny } = wrappedNormal(ship, w, m.worldW, m.worldH);
        resolveElastic(ship, w, nx, ny);
        if (ship.invuln <= 0) {
          const base = w.def.reactor ? 34 : w.sharp ? 22 : 14;
          damageShip(ship, base);
          this.mission.hullDamageTaken += base;
          emitImpact(this.particles, ship.x, ship.y, 8, '#ff4d4d');
          this.audio.playDamage();
          this.camera.addShake(6);
        }
      }
    }
  }

  _registerKill(wreck) {
    const m = this.mission;
    m.wrecksDestroyedTotal++;
    m.combo.killsInWindow++;
    m.combo.timer = CONFIG.COMBO.WINDOW;
    m.combo.mult = Math.min(CONFIG.COMBO.MAX_MULT, 1 + Math.floor(m.combo.killsInWindow / CONFIG.COMBO.MULT_STEP_KILLS));
    m.largestCombo = Math.max(m.largestCombo, m.combo.mult);
    destroyWreck(wreck, m.wrecks, this.events);
  }

  _processEvents(dt) {
    const m = this.mission, ship = this.ship;
    for (const ev of this.events) {
      switch (ev.type) {
        case 'salvageDrop':
          m.salvage.push(createSalvage(ev.kind, ev.x, ev.y, ev.vx, ev.vy));
          break;
        case 'salvageBurst':
          for (const kind of ev.kinds) {
            const a = Math.random() * Math.PI * 2;
            m.salvage.push(createSalvage(kind, ev.x + Math.cos(a) * 20, ev.y + Math.sin(a) * 20, Math.cos(a) * 60, Math.sin(a) * 60));
          }
          break;
        case 'salvageCollected':
          m.cargoCollected++;
          m.cargoValue += ev.value;
          if (ev.kind === 'rare') m.rareCollected++;
          if (ev.kind === 'blackbox') m.blackboxCollected++;
          this.save.stats.totalSalvage += ev.value;
          emitPickup(this.particles, ev.x, ev.y, ev.kind === 'rare' ? '#c58bff' : ev.kind === 'blackbox' ? '#ff4d4d' : '#4fd8e8');
          this.audio.playPickup();
          break;
        case 'wreckDestroyed':
          emitImpact(this.particles, ev.x, ev.y, Math.round(ev.radius * 0.6), '#8b98a5');
          break;
        case 'fuelExplosion':
          emitExplosion(this.particles, ev.x, ev.y, ev.radius, '#ff9540');
          this.audio.playExplosion(false);
          this.camera.addShake(9);
          if (wrappedDistance(ship, ev, m.worldW, m.worldH) < ev.radius && ship.invuln <= 0) {
            damageShip(ship, 24);
            this.camera.addShake(10);
          }
          break;
        case 'reactorArmed':
          emitImpact(this.particles, ev.x, ev.y, 10, '#ff4d4d');
          break;
        case 'reactorExplosion':
          emitExplosion(this.particles, ev.x, ev.y, ev.radius, '#ff4d4d');
          this.audio.playExplosion(true);
          this.camera.addShake(16);
          m.reactorExplosions++;
          this.save.stats.reactorExplosions++;
          if (wrappedDistance(ship, ev, m.worldW, m.worldH) < ev.radius && ship.invuln <= 0) {
            damageShip(ship, 45);
          }
          break;
        case 'debrisShard':
          emitImpact(this.particles, ev.x, ev.y, 3, '#c58bff');
          break;
      }
    }
    this.events.length = 0;
  }

  // ---------------- End states ----------------
  _completeMission() {
    const m = this.mission, ship = this.ship, def = m.def;
    this.state = STATE.COMPLETE;
    this.audio.setThruster(false);
    this.audio.setTractor(false);
    this.audio.setHeatAlarm(false);
    this.audio.playVictory();

    const optionalDone = def.optional.filter(o => this._checkOptional(o, m, ship)).length;
    const score = computeScore(m, ship) + optionalDone * 300;
    const rank = computeRank(score, def.rank);

    this.save.stats.contractsCompleted++;
    this.save.stats.distanceFlown += ship.distanceFlown;
    this.save.completed[def.id] = true;
    this.save.unlockedMissions = Math.max(this.save.unlockedMissions, Math.min(12, def.id + 1));
    this.save.credits += m.cargoValue;
    const prevScore = this.save.bestScores[def.id] || 0;
    if (score > prevScore) {
      this.save.bestScores[def.id] = score;
      this.save.bestRanks[def.id] = rank;
    }
    writeSave(this.save);

    this.ui.showComplete({
      rank, score, cargoValue: m.cargoValue, hullPct: (ship.hull / ship.maxHull) * 100,
      time: m.elapsed, largestCombo: m.largestCombo, optionalDone, optionalTotal: def.optional.length,
      hasNext: def.id < 12, creditsEarned: m.cargoValue,
    });
  }

  _checkOptional(o, m, ship) {
    switch (o.id) {
      case 'no_damage': return m.hullDamageTaken === 0;
      case 'fast': return o.time ? m.elapsed <= o.time || (m.timer && m.timeRemaining >= o.time) : false;
      case 'all_wrecks': return m.wrecksDestroyedTotal >= m.wrecksTotal;
      case 'no_reactor': return m.reactorExplosions === 0;
      case 'rare_all': return m.rareTotal === 0 || m.rareCollected >= m.rareTotal;
      default: return false;
    }
  }

  _failMission(title, reason) {
    this.state = STATE.FAILURE;
    this.audio.setThruster(false);
    this.audio.setTractor(false);
    this.audio.setHeatAlarm(false);
    writeSave(this.save);
    this.ui.showFailure(title, reason);
  }
}
