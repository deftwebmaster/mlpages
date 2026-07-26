import { Storage } from '../storage/Storage.js';
import { loadManifest, loadLevelById } from '../level/Level.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor(game, pwa) {
    this.game = game;
    this.pwa = pwa;
    this.manifest = [];
    this.currentMissionId = null;
    this.playStartedAt = 0;

    this.screens = {
      loading: $('screen-loading'),
      menu: $('screen-menu'),
      missionSelect: $('screen-mission-select'),
      settings: $('screen-settings'),
      statistics: $('screen-statistics'),
      playing: $('screen-playing'),
    };
    this.overlays = {
      pause: $('overlay-pause'),
      complete: $('overlay-complete'),
      failed: $('overlay-failed'),
    };

    this.game.setHooks({
      onMissionComplete: (stats) => this.showComplete(stats),
      onMissionFailed: (reason) => this.showFailed(reason),
      onHudUpdate: (hud) => this.updateHud(hud),
      onPlanningChange: (overlay) => this.updatePlanningUi(overlay),
    });

    this._wireButtons();
    window.addEventListener('resize', () => this.game.handleResize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.game.handleResize(), 50));
    if (window.ResizeObserver) {
      new ResizeObserver(() => this.game.handleResize()).observe($('board-wrap'));
    }
  }

  async init() {
    this.manifest = await loadManifest();
    const save = Storage.getSave();
    if (!save.unlockedMissionIds.length) {
      Storage.unlockMission(this.manifest[0].id);
    }
    this._applySettingsToInputs();
    this.showScreen('menu');
  }

  showScreen(name) {
    for (const key of Object.keys(this.screens)) {
      this.screens[key].hidden = key !== name;
    }
  }

  hideOverlays() {
    for (const key of Object.keys(this.overlays)) this.overlays[key].hidden = true;
  }

  _wireButtons() {
    $('btn-play').addEventListener('click', () => this.playCurrentOrFirst());
    $('btn-mission-select').addEventListener('click', () => this.openMissionSelect());
    $('btn-settings').addEventListener('click', () => this.openSettings());
    $('btn-statistics').addEventListener('click', () => this.openStatistics());
    $('btn-install').addEventListener('click', () => this.pwa?.promptInstall());

    $('btn-mission-select-back').addEventListener('click', () => this.showScreen('menu'));
    $('btn-settings-back').addEventListener('click', () => this.showScreen('menu'));
    $('btn-statistics-back').addEventListener('click', () => this.showScreen('menu'));

    $('setting-sound').addEventListener('change', (e) => this._updateSetting('sound', e.target.checked));
    $('setting-music').addEventListener('change', (e) => this._updateSetting('music', e.target.checked));
    $('setting-haptics').addEventListener('change', (e) => this._updateSetting('haptics', e.target.checked));
    $('setting-reduced-motion').addEventListener('change', (e) => this._updateSetting('reducedMotion', e.target.checked));
    $('btn-reset-progress').addEventListener('click', () => {
      if (window.confirm('Reset all progress? This clears unlocked missions, stars, and statistics.')) {
        Storage.resetProgress();
        this._applySettingsToInputs();
        this.game.applySettings(Storage.getSave().settings);
      }
    });

    $('btn-pause').addEventListener('click', () => { this.game.pause(); this.overlays.pause.hidden = false; });
    $('btn-resume').addEventListener('click', () => { this.overlays.pause.hidden = true; this.game.resume(); });
    $('btn-pause-restart').addEventListener('click', () => { this.overlays.pause.hidden = true; this.game.restart(); this.game.resume(); });
    $('btn-pause-menu').addEventListener('click', () => { this.hideOverlays(); this.game.pause(); this._recordPlayTime(); this.showScreen('menu'); });

    $('btn-undo').addEventListener('click', () => this.game.undoMove());
    $('btn-restart').addEventListener('click', () => this.game.restart());
    $('btn-plan-execute').addEventListener('click', () => this.game.executePlanning());
    $('btn-plan-cancel').addEventListener('click', () => this.game.cancelPlanning());

    $('btn-next-mission').addEventListener('click', () => this.playNextMission());
    $('btn-complete-restart').addEventListener('click', () => { this.hideOverlays(); this.game.restart(); });
    $('btn-complete-menu').addEventListener('click', () => { this.hideOverlays(); this._recordPlayTime(); this.showScreen('menu'); });

    $('btn-failed-restart').addEventListener('click', () => { this.hideOverlays(); this.game.restart(); });
    $('btn-failed-menu').addEventListener('click', () => { this.hideOverlays(); this._recordPlayTime(); this.showScreen('menu'); });
  }

  _updateSetting(key, value) {
    Storage.updateSettings({ [key]: value });
    this.game.applySettings(Storage.getSave().settings);
  }

  _applySettingsToInputs() {
    const s = Storage.getSave().settings;
    $('setting-sound').checked = s.sound;
    $('setting-music').checked = s.music;
    $('setting-haptics').checked = s.haptics;
    $('setting-reduced-motion').checked = s.reducedMotion;
  }

  async playCurrentOrFirst() {
    const save = Storage.getSave();
    const id = save.currentMissionId || this.manifest[0].id;
    await this.startMission(id);
  }

  async playNextMission() {
    this.hideOverlays();
    const idx = this.manifest.findIndex((m) => m.id === this.currentMissionId);
    const next = this.manifest[idx + 1];
    if (next) {
      await this.startMission(next.id);
    } else {
      this._recordPlayTime();
      this.showScreen('menu');
    }
  }

  async startMission(id) {
    this.hideOverlays();
    const level = await loadLevelById(id);
    this.currentMissionId = id;
    Storage.setCurrentMission(id);
    this.game.loadLevel(level);
    $('hud-mission-name').textContent = level.name;
    this.playStartedAt = performance.now();
    this.showScreen('playing');
    this.game.handleResize();
  }

  _recordPlayTime() {
    if (this.playStartedAt) {
      Storage.addPlayTime(performance.now() - this.playStartedAt);
      this.playStartedAt = 0;
    }
  }

  updateHud(hud) {
    if (!hud) return;
    $('hud-mission-name').textContent = hud.missionName || '';
    $('hud-move-count').textContent = `${hud.moveCount} moves`;
    const pkg = $('hud-package-status');
    pkg.textContent = hud.packageCollected ? 'Package Retrieved' : 'Package';
    pkg.classList.toggle('collected', hud.packageCollected);
    $('btn-undo').disabled = !hud.canUndo;
  }

  updatePlanningUi(overlay) {
    const banner = $('planning-banner');
    const execBtn = $('btn-plan-execute');
    const cancelBtn = $('btn-plan-cancel');
    if (!overlay || !overlay.active) {
      banner.hidden = true;
      execBtn.hidden = true;
      cancelBtn.hidden = true;
      return;
    }
    execBtn.hidden = false;
    cancelBtn.hidden = false;
    banner.hidden = false;
    if (overlay.dangerTile) {
      banner.textContent = describeDanger(overlay.dangerReason);
      banner.classList.add('danger');
    } else {
      banner.textContent = 'Planning route — release or press Execute';
      banner.classList.remove('danger');
    }
  }

  showComplete(stats) {
    $('complete-moves').textContent = `Moves used: ${stats.moves}${stats.targetMoves ? ` (target ${stats.targetMoves})` : ''}`;
    const save = Storage.getSave();
    const best = save.bestMoves[this.currentMissionId];
    $('complete-best').textContent = best != null ? `Best moves: ${best}` : '';
    $('complete-stars').innerHTML = starsHtml(stats.stars);

    const idx = this.manifest.findIndex((m) => m.id === this.currentMissionId);
    const next = this.manifest[idx + 1];
    $('btn-next-mission').hidden = !next;
    if (next) Storage.unlockMission(next.id);

    this.overlays.complete.hidden = false;
  }

  showFailed(reason) {
    $('failed-reason').textContent = `Detected By: ${describeDanger(reason)}`;
    this.overlays.failed.hidden = false;
  }

  openMissionSelect() {
    const save = Storage.getSave();
    const grid = $('mission-grid');
    grid.innerHTML = '';
    this.manifest.forEach((m, i) => {
      const unlocked = i === 0 || save.unlockedMissionIds.includes(m.id);
      const btn = document.createElement('button');
      btn.className = 'mission-card';
      btn.type = 'button';
      btn.disabled = !unlocked;
      const stars = save.bestStars[m.id] || 0;
      btn.innerHTML = `<span class="mission-name">${i + 1}. ${m.name}</span><span class="mission-stars">${unlocked ? starsHtml(stars) : 'Locked'}</span>`;
      if (unlocked) btn.addEventListener('click', () => this.startMission(m.id));
      grid.appendChild(btn);
    });
    this.showScreen('missionSelect');
  }

  openSettings() {
    this._applySettingsToInputs();
    this.showScreen('settings');
  }

  openStatistics() {
    const s = Storage.getSave().statistics;
    const list = $('stats-list');
    const minutes = Math.floor(s.playTimeMs / 60000);
    const rows = [
      ['Missions Completed', s.missionsCompleted],
      ['Total Moves', s.totalMoves],
      ['Total Restarts', s.totalRestarts],
      ['Best Runs', s.bestRuns],
      ['Perfect Missions', s.perfectMissions],
      ['Play Time', `${minutes} min`],
      ['Detection Count', s.detectionCount],
    ];
    list.innerHTML = rows.map(([label, value]) =>
      `<div class="stat-row"><dt>${label}</dt><dd>${value}</dd></div>`).join('');
    this.showScreen('statistics');
  }
}

function starsHtml(count) {
  let out = '';
  for (let i = 0; i < 3; i++) out += `<span class="${i < count ? 'lit' : ''}">★</span>`;
  return out;
}

function describeDanger(reason) {
  if (!reason) return 'Unknown';
  if (reason.type === 'camera') return 'Security Camera';
  if (reason.type === 'contact') return 'Guard (direct contact)';
  return 'Guard';
}
