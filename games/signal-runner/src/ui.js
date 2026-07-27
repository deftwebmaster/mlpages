/**
 * ui.js — DOM screens, HUD and the bridge between them and the Game.
 *
 * The HUD is written from a throttled tick rather than from the render loop:
 * touching the DOM every frame is the classic way to make a Canvas game
 * stutter, and nothing here needs 60Hz precision. The canvas owns everything
 * that must feel instant; the DOM owns everything that must be readable.
 */

import { GameState } from './game.js';
import { CONFIG, POLARITY } from './config.js';
import { LEVELS, LEVEL_COUNT } from './levels.js';
import { formatTime, formatScore } from './utils.js';
import * as storage from './storage.js';

const $ = (id) => document.getElementById(id);

const BADGE_META = [
  { key: 'connected', cls: 'b-connected', label: 'CONNECTED' },
  { key: 'clean', cls: 'b-clean', label: 'CLEAN SIGNAL' },
  { key: 'lowLatency', cls: 'b-latency', label: 'LOW LATENCY' },
];

export class UI {
  constructor(game) {
    this.game = game;
    this.screenStack = [];
    this.hudTimer = 0;
    this.toastTimer = 0;
    this.lastHud = {};

    this.el = {
      hud: $('hud'),
      controls: $('controls'),
      levelNum: $('hudLevelNum'),
      levelName: $('hudLevelName'),
      time: $('hudTime'),
      score: $('hudScore'),
      uplinks: $('hudUplinks'),
      fragments: $('hudFragments'),
      toast: $('toast'),
      tutorial: $('tutorial'),
      tutorialText: $('tutorialText'),
      polarityBtn: $('polarityBtn'),
      polarityName: $('polarityName'),
      polarityCooldown: $('polarityCooldown'),
      levelList: $('levelList'),
      updateBanner: $('updateBanner'),
      installBtn: $('btnInstall'),
    };

    this.screens = {
      menu: $('screen-menu'),
      levels: $('screen-levels'),
      pause: $('screen-pause'),
      complete: $('screen-complete'),
      settings: $('screen-settings'),
      help: $('screen-help'),
      stats: $('screen-stats'),
    };

    this.bindButtons();
    this.bindGame();
    this.syncSettings();
  }

  // --- Screen management --------------------------------------------------

  showScreen(name) {
    for (const [key, node] of Object.entries(this.screens)) {
      node.hidden = key !== name;
    }
    this.current = name;
    const active = name ? this.screens[name] : null;
    if (active) {
      // Move focus to the panel so keyboard and screen-reader users land in
      // the dialog rather than behind it.
      const target = active.querySelector('button:not([disabled])');
      if (target) target.focus({ preventScroll: true });
    }
  }

  hideScreens() {
    for (const node of Object.values(this.screens)) node.hidden = true;
    this.current = null;
  }

  openScreen(name) {
    if (this.current && this.current !== name) this.screenStack.push(this.current);
    this.showScreen(name);
  }

  goBack() {
    const previous = this.screenStack.pop();
    if (previous) this.showScreen(previous);
    else if (this.game.level) this.showScreen('pause');
    else this.showScreen('menu');
  }

  // --- Wiring -------------------------------------------------------------

  bindButtons() {
    const g = this.game;
    const click = (id, fn) => {
      const node = $(id);
      if (node) node.addEventListener('click', () => { g.audio.menu(); fn(); });
    };

    click('btnStart', () => {
      const target = Math.min(g.progress.unlocked, LEVEL_COUNT);
      this.startLevel(target);
    });
    click('btnLevels', () => { this.renderLevelList(); this.openScreen('levels'); });
    click('btnSettings', () => this.openScreen('settings'));
    click('btnHelp', () => this.openScreen('help'));
    click('btnStats', () => { this.renderStats(); this.openScreen('stats'); });

    click('pauseBtn', () => g.togglePause());
    click('restartBtn', () => g.restartLevel());
    click('btnResume', () => g.resume());
    click('btnRestart', () => { this.screenStack.length = 0; g.restartLevel(); });
    click('btnPauseSettings', () => this.openScreen('settings'));
    click('btnPauseLevels', () => { this.renderLevelList(); this.openScreen('levels'); });
    click('btnPauseMenu', () => { this.screenStack.length = 0; g.exitToMenu(); });

    click('btnNext', () => {
      if (!g.nextLevel()) { this.renderLevelList(); this.openScreen('levels'); }
    });
    click('btnRetry', () => g.restartLevel());
    click('btnCompleteLevels', () => { this.renderLevelList(); this.openScreen('levels'); });

    click('btnReplayTutorials', () => {
      g.clearTutorialHistory();
      this.toast('TUTORIALS RESET');
    });
    click('btnResetProgress', () => this.confirmReset());

    for (const node of document.querySelectorAll('[data-back]')) {
      node.addEventListener('click', () => { g.audio.menu(); this.goBack(); });
    }

    this.el.polarityBtn.addEventListener('click', () => g.requestPolarity());
    $('tutorialDismiss').addEventListener('click', () => g.dismissTutorial());

    this.bindToggle('setSound', 'sound');
    this.bindToggle('setMusic', 'music');
    this.bindToggle('setHaptics', 'haptics');
    this.bindToggle('setReduced', 'reducedEffects');
  }

  bindToggle(id, key) {
    const node = $(id);
    if (!node) return;
    node.addEventListener('click', () => {
      const next = !this.game.settings[key];
      this.game.updateSetting(key, next);
      node.setAttribute('aria-checked', String(next));
      this.game.audio.menu();
      if (key === 'reducedEffects') this.onReducedEffectsChange?.(next);
    });
  }

  syncSettings() {
    const map = {
      setSound: 'sound', setMusic: 'music',
      setHaptics: 'haptics', setReduced: 'reducedEffects',
    };
    for (const [id, key] of Object.entries(map)) {
      const node = $(id);
      if (node) node.setAttribute('aria-checked', String(this.game.settings[key]));
    }
    const note = $('storageNote');
    if (note) {
      note.textContent = storage.isPersistent()
        ? 'Progress is saved on this device only.'
        : 'Storage is unavailable — progress will not survive a reload.';
    }
  }

  confirmReset() {
    const btn = $('btnResetProgress');
    if (btn.dataset.armed === '1') {
      this.game.resetProgress();
      btn.dataset.armed = '0';
      btn.textContent = 'RESET ALL PROGRESS';
      this.updateMenuSummary();
      this.toast('PROGRESS ERASED');
      return;
    }
    // Two-step rather than a modal: destructive, but not worth a dialog.
    btn.dataset.armed = '1';
    btn.textContent = 'TAP AGAIN TO CONFIRM';
    setTimeout(() => {
      if (btn.dataset.armed !== '1') return;
      btn.dataset.armed = '0';
      btn.textContent = 'RESET ALL PROGRESS';
    }, 4000);
  }

  bindGame() {
    const g = this.game;

    g.on('stateChange', (state) => this.onStateChange(state));
    g.on('levelComplete', (result) => this.renderComplete(result));
    g.on('toast', (text) => this.toast(text));
    g.on('hudDirty', () => { this.hudTimer = 0; });
    g.on('tutorial', (prompt) => {
      if (!prompt) {
        this.el.tutorial.hidden = true;
        return;
      }
      this.el.tutorialText.textContent = prompt.text;
      this.el.tutorial.hidden = false;
    });
  }

  onStateChange(state) {
    const playing = state === GameState.PLAYING
      || state === GameState.PLAYER_MOVING
      || state === GameState.PLAYER_DYING
      || state === GameState.UPLOADING
      || state === GameState.STARTING;

    this.el.hud.hidden = !playing && state !== GameState.PAUSED;
    this.el.controls.hidden = !playing && state !== GameState.PAUSED;

    if (playing) {
      this.hideScreens();
      this.screenStack.length = 0;
      this.updateHud(true);
    } else if (state === GameState.PAUSED) {
      this.renderPause();
      this.showScreen('pause');
    } else if (state === GameState.MENU) {
      this.updateMenuSummary();
      this.showScreen('menu');
    }
  }

  startLevel(id) {
    if (!this.game.isUnlocked(id)) return;
    this.screenStack.length = 0;
    this.hideScreens();
    this.game.startLevel(id);
  }

  // --- HUD ----------------------------------------------------------------

  tick(dt) {
    this.hudTimer -= dt;
    if (this.hudTimer <= 0) {
      this.hudTimer = CONFIG.ui.hudInterval;
      this.updateHud(false);
    }
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.el.toast.classList.remove('show');
    }
    this.updatePolarityButton();
  }

  updateHud(force) {
    const g = this.game;
    if (!g.level || this.el.hud.hidden) return;
    const last = this.lastHud;

    const num = String(g.level.id).padStart(2, '0');
    if (force || last.num !== num) {
      this.el.levelNum.textContent = num;
      this.el.levelName.textContent = g.level.name.toUpperCase();
      last.num = num;
    }

    const time = formatTime(g.elapsed);
    if (time !== last.time) { this.el.time.textContent = time; last.time = time; }

    const score = formatScore(g.score);
    if (score !== last.score) { this.el.score.textContent = score; last.score = score; }

    const uplinks = `${g.uplinksActive}/${g.uplinkStates.length}`;
    if (uplinks !== last.uplinks) { this.el.uplinks.textContent = uplinks; last.uplinks = uplinks; }

    const frags = `${g.runFragments}/${g.level.collectibles.length}`;
    if (frags !== last.frags) { this.el.fragments.textContent = frags; last.frags = frags; }
  }

  updatePolarityButton() {
    const g = this.game;
    if (!g.player || this.el.controls.hidden) return;
    const cyan = g.player.polarity === POLARITY.CYAN;
    const btn = this.el.polarityBtn;
    const wanted = cyan ? 'is-cyan' : 'is-violet';
    if (!btn.classList.contains(wanted)) {
      btn.classList.toggle('is-cyan', cyan);
      btn.classList.toggle('is-violet', !cyan);
      this.el.polarityName.textContent = cyan ? 'CYAN' : 'VIOLET';
      btn.setAttribute(
        'aria-label',
        `Current frequency ${cyan ? 'cyan' : 'violet'}. Switch to ${cyan ? 'violet' : 'cyan'}.`,
      );
    }
    // The cooldown bar drains left to right; cheap transform, no layout.
    this.el.polarityCooldown.style.transform = `scaleX(${g.switchCooldownRatio.toFixed(3)})`;
  }

  toast(text) {
    if (!text) return;
    this.el.toast.textContent = text;
    this.el.toast.classList.add('show');
    this.toastTimer = 1.8;
  }

  // --- Screens ------------------------------------------------------------

  updateMenuSummary() {
    const p = this.game.progress;
    $('menuScore').textContent = formatScore(storage.totalScore(p));
    $('menuBadges').textContent = `${storage.totalBadges(p)}/${LEVEL_COUNT * 3}`;
    $('menuFragments').textContent = formatScore(storage.totalFragments(p));
  }

  renderLevelList() {
    const g = this.game;
    const list = this.el.levelList;
    list.textContent = '';

    for (const def of LEVELS) {
      const record = g.progress.levels[def.id];
      const unlocked = g.isUnlocked(def.id);

      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = `level-item${unlocked ? '' : ' locked'}`;
      btn.disabled = !unlocked;

      const num = document.createElement('span');
      num.className = 'num';
      num.textContent = String(def.id).padStart(2, '0');

      const body = document.createElement('span');
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = unlocked ? def.name.toUpperCase() : 'LOCKED';
      const meta = document.createElement('span');
      meta.className = 'meta';
      // Kept short deliberately: this wraps to two lines on a 320px phone and
      // the list becomes hard to scan.
      meta.textContent = unlocked
        ? (record.completed
          ? `${formatTime(record.bestTime)} · ${formatScore(record.bestScore)} PTS · TGT ${formatTime(def.targetTime)}`
          : `${def.description}`)
        : `Complete level ${def.id - 1} to unlock`;
      body.append(name, document.createElement('br'), meta);

      const badges = document.createElement('span');
      badges.className = 'badges';
      for (const meta2 of BADGE_META) {
        const b = document.createElement('span');
        b.className = `badge ${meta2.cls}${record.badges[meta2.key] ? ' earned' : ''}`;
        b.title = meta2.label;
        badges.append(b);
      }

      btn.append(num, body, badges);
      btn.addEventListener('click', () => { g.audio.menu(); this.startLevel(def.id); });
      li.append(btn);
      list.append(li);
    }
  }

  renderPause() {
    const g = this.game;
    if (!g.level) return;
    $('pauseSummary').textContent =
      `${g.level.name.toUpperCase()} · ${g.uplinksActive}/${g.uplinkStates.length} UPLINKS · ${formatTime(g.elapsed)}`;
  }

  renderComplete(result) {
    $('completeEyebrow').textContent = result.isFinalLevel
      ? 'NETWORK CLEARED'
      : 'LEVEL COMPLETE';
    $('completeName').textContent = result.levelName.toUpperCase();

    const badges = $('completeBadges');
    badges.textContent = '';
    for (const meta of BADGE_META) {
      const earned = result.badges[meta.key];
      const li = document.createElement('li');
      if (earned) li.className = 'earned';
      const dot = document.createElement('span');
      dot.className = `badge ${meta.cls}${earned ? ' earned' : ''}`;
      li.append(dot, document.createTextNode(meta.label));
      badges.append(li);
    }

    $('resultTime').textContent = formatTime(result.time);
    $('resultBest').textContent = result.newBestTime
      ? `${formatTime(result.time)} NEW`
      : formatTime(result.previousBestTime);
    $('resultDeaths').textContent = String(result.deaths);
    $('resultFragments').textContent = `${result.fragments}/${result.totalFragments}`;
    $('resultScore').textContent = `${formatScore(result.score)}${result.newBestScore ? ' · BEST' : ''}`;

    const next = $('btnNext');
    next.disabled = result.isFinalLevel || !this.game.isUnlocked(result.levelId + 1);
    next.textContent = result.isFinalLevel ? 'ALL LEVELS CLEARED' : 'NEXT LEVEL';

    this.showScreen('complete');
    this.updateMenuSummary();
  }

  renderStats() {
    const s = this.game.stats;
    const p = this.game.progress;
    const grid = $('statsGrid');
    grid.textContent = '';

    const topCause = Object.entries(s.deathsByCause)
      .sort((a, b) => b[1] - a[1])[0];

    const rows = [
      ['LEVELS CLEARED', `${Object.values(p.levels).filter((l) => l.completed).length}/${LEVEL_COUNT}`],
      ['TOTAL SCORE', formatScore(storage.totalScore(p))],
      ['BADGES', `${storage.totalBadges(p)}/${LEVEL_COUNT * 3}`],
      ['UPLINKS', formatScore(s.uplinksActivated)],
      ['FRAGMENTS', formatScore(s.fragmentsCollected)],
      ['SIGNALS LOST', formatScore(s.deaths)],
      ['FREQUENCY SWITCHES', formatScore(s.polaritySwitches)],
      ['PLAY TIME', formatTime(s.playTime)],
      ['CLEAN STREAK', `${s.bestStreak}`],
      ['MOST COMMON LOSS', topCause ? topCause[0].toUpperCase() : '—'],
    ];

    for (const [label, value] of rows) {
      const div = document.createElement('div');
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      div.append(dt, dd);
      grid.append(div);
    }
  }

  // --- PWA hooks ----------------------------------------------------------

  showInstallButton(onInstall) {
    this.el.installBtn.hidden = false;
    this.el.installBtn.onclick = () => { this.game.audio.menu(); onInstall(); };
  }

  hideInstallButton() {
    this.el.installBtn.hidden = true;
  }

  showUpdateBanner(onReload) {
    this.el.updateBanner.hidden = false;
    $('btnReload').onclick = onReload;
  }
}
