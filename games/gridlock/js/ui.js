/**
 * ui.js — Screens, HUD and overlays.
 *
 * The DOM is treated as a slow output device: values are cached and written
 * only when they actually change, and per-frame updates are limited to the two
 * readouts that genuinely need it (the clock and the shift meter).
 */

import { LEVELS, TOTAL_LEVELS } from './levels.js';
import { storage, ACHIEVEMENTS, rankValue } from './storage.js';
import { formatScore, formatTime } from './utils.js';
import { CFG, DIR } from './config.js';

const SCREENS = ['loading', 'menu', 'levels', 'settings', 'stats', 'help', 'game'];

const ACHIEVEMENT_GLYPHS = {
  first_shift: '⟳',
  perfect_escape: '◇',
  drone_hunter: '⌁',
  combo_master: '⚡',
  secret_finder: '◈',
  zero_death_run: '✦',
  speed_runner: '»',
  master_hacker: '★',
};

/** Circumference of the shift meter arc (r = 19). */
const ARC = 2 * Math.PI * 19;

export class UI {
  /**
   * @param {Record<string, Function>} handlers
   */
  constructor(handlers) {
    this.h = handlers;
    this.current = 'loading';
    this.history = [];

    this.el = {
      screens: Object.fromEntries(SCREENS.map((n) => [n, document.getElementById(`screen-${n}`)])),
      continueBtn: document.getElementById('btn-continue'),
      continueSub: document.getElementById('continue-sub'),
      menuProgress: document.getElementById('menu-progress'),
      briefingTitle: document.getElementById('briefing-title'),
      briefingCopy: document.getElementById('briefing-copy'),
      briefingTarget: document.getElementById('briefing-target'),
      briefingRecord: document.getElementById('briefing-record'),
      briefingRank: document.getElementById('briefing-rank'),
      installBtn: document.getElementById('btn-install'),
      levelGrid: document.getElementById('level-grid'),
      levelsMeta: document.getElementById('levels-meta'),
      statGrid: document.getElementById('stat-grid'),
      achievementList: document.getElementById('achievement-list'),

      score: document.getElementById('hud-score'),
      time: document.getElementById('hud-time'),
      nodes: document.getElementById('hud-nodes'),
      deaths: document.getElementById('hud-deaths'),
      secrets: document.getElementById('hud-secrets'),
      sector: document.getElementById('hud-sector'),
      shiftMeter: document.getElementById('shift-meter'),
      shiftArc: document.getElementById('shift-arc'),
      combo: document.getElementById('combo-badge'),
      powerBar: document.getElementById('power-bar'),
      powerFill: document.querySelector('#power-bar i'),
      missionTarget: document.getElementById('mission-target'),
      missionDeaths: document.getElementById('mission-deaths'),
      missionSecrets: document.getElementById('mission-secrets'),
      swipeCue: document.getElementById('swipe-cue'),
      threatChip: document.getElementById('threat-chip'),
      phase: document.getElementById('hud-phase'),
      phaseTime: document.getElementById('hud-phase-time'),
      dpad: document.getElementById('dpad'),

      pause: document.getElementById('overlay-pause'),
      pauseSector: document.getElementById('pause-sector'),
      complete: document.getElementById('overlay-complete'),
      toasts: document.getElementById('toasts'),
    };

    /** Last written values, so we can skip no-op DOM writes. */
    this._cache = {};
    this._swipeTimer = 0;

    this._bindActions();
    this._bindSettings();
    this.el.shiftArc.style.strokeDasharray = String(ARC);
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  show(name, { remember = true } = {}) {
    if (!SCREENS.includes(name)) return;
    if (remember && this.current !== name && this.current !== 'loading') {
      this.history.push(this.current);
      if (this.history.length > 8) this.history.shift();
    }
    for (const key of SCREENS) {
      const el = this.el.screens[key];
      const active = key === name;
      el.hidden = !active;
      el.classList.toggle('is-active', active);
    }
    this.current = name;

    if (name === 'menu') this.refreshMenu();
    if (name === 'levels') this.renderLevels();
    if (name === 'stats') this.renderStats();
  }

  back() {
    const prev = this.history.pop();
    this.show(prev && prev !== 'game' ? prev : 'menu', { remember: false });
  }

  _bindActions() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      this.h.onAnyClick?.(action);

      switch (action) {
        case 'continue': this.h.onStart?.(Math.min(storage.unlocked, TOTAL_LEVELS)); break;
        case 'levels': this.show('levels'); break;
        case 'help': this.show('help'); break;
        case 'stats': this.show('stats'); break;
        case 'settings': this.show('settings'); break;
        case 'install': this.h.onInstall?.(); break;
        case 'back': this.back(); break;
        case 'pause': this.h.onPause?.(); break;
        case 'resume': this.h.onResume?.(); break;
        case 'retry': this.h.onRetry?.(); break;
        case 'quit': this.h.onQuit?.(); break;
        case 'next': this.h.onNext?.(); break;
        case 'reset': this._confirmReset(btn); break;
        default: break;
      }
    });

    this.el.levelGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.level-card');
      if (!card || card.classList.contains('is-locked')) return;
      this.h.onStart?.(Number(card.dataset.level));
    });
  }

  _confirmReset(btn) {
    if (btn.dataset.armed === '1') {
      storage.resetAll();
      btn.dataset.armed = '0';
      btn.textContent = 'Reset all progress';
      this.syncSettings();
      this.refreshMenu();
      this.toast('Progress cleared', 'Every sector is locked again.');
      this.h.onReset?.();
      return;
    }
    btn.dataset.armed = '1';
    btn.textContent = 'Tap again to confirm';
    setTimeout(() => {
      if (btn.dataset.armed !== '1') return;
      btn.dataset.armed = '0';
      btn.textContent = 'Reset all progress';
    }, 4000);
  }

  // ── Settings ──────────────────────────────────────────────────────────────
  _bindSettings() {
    for (const input of document.querySelectorAll('[data-setting]')) {
      input.addEventListener('change', () => {
        storage.setSetting(input.dataset.setting, input.checked);
        this.h.onSettingChange?.(input.dataset.setting, input.checked);
      });
    }
    for (const group of document.querySelectorAll('[data-setting-group]')) {
      group.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-value]');
        if (!btn) return;
        const name = group.dataset.settingGroup;
        storage.setSetting(name, btn.dataset.value);
        this.syncSettings();
        this.h.onSettingChange?.(name, btn.dataset.value);
      });
    }
  }

  syncSettings() {
    for (const input of document.querySelectorAll('[data-setting]')) {
      input.checked = storage.getSetting(input.dataset.setting) !== false;
    }
    for (const group of document.querySelectorAll('[data-setting-group]')) {
      const value = storage.getSetting(group.dataset.settingGroup);
      for (const btn of group.querySelectorAll('button[data-value]')) {
        btn.classList.toggle('is-on', btn.dataset.value === value);
      }
    }
    this.applyDpadPreference();
  }

  /** 'auto' shows the pad on touch-primary devices only. */
  applyDpadPreference() {
    const mode = storage.getSetting('dpad');
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    this.el.dpad.hidden = mode === 'off' || (mode === 'auto' && !coarse);
  }

  // ── Menu ──────────────────────────────────────────────────────────────────
  refreshMenu() {
    const cleared = LEVELS.filter((l) => storage.getLevelRecord(l.id).rank).length;
    const next = Math.min(storage.unlocked, TOTAL_LEVELS);
    const level = LEVELS[next - 1];
    const rec = storage.getLevelRecord(level.id);
    this.el.continueSub.textContent = `Sector ${String(next).padStart(2, '0')} · ${LEVELS[next - 1].name}`;
    this.el.screens.menu.querySelector('.btn-label').textContent = cleared > 0 ? 'Continue' : 'Start';
    this.el.menuProgress.textContent = `${cleared} / ${TOTAL_LEVELS} sectors cleared`;
    this.el.briefingTitle.textContent = `Sector ${String(next).padStart(2, '0')} · ${level.name}`;
    this.el.briefingCopy.textContent = level.hint || level.subtitle || 'Drain every node and keep the drones guessing.';
    this.el.briefingTarget.textContent = formatTime(level.targetTime);
    this.el.briefingRecord.textContent = isFinite(rec.bestTime) ? formatTime(rec.bestTime) : '--';
    this.el.briefingRank.textContent = rec.rank || '--';
  }

  showInstallButton(show) {
    this.el.installBtn.hidden = !show;
  }

  // ── Level select ──────────────────────────────────────────────────────────
  renderLevels() {
    const frag = document.createDocumentFragment();
    let medals = 0;

    for (const level of LEVELS) {
      const rec = storage.getLevelRecord(level.id);
      const locked = !storage.isUnlocked(level.number);
      if (rec.perfect) medals++;

      const card = document.createElement('button');
      card.className = 'level-card' + (locked ? ' is-locked' : '');
      card.dataset.level = String(level.number);
      card.disabled = locked;

      const time = isFinite(rec.bestTime) ? formatTime(rec.bestTime) : '—';
      const best = rec.bestScore ? formatScore(rec.bestScore) : '—';

      card.innerHTML = `
        <span class="num">SECTOR ${String(level.number).padStart(2, '0')}</span>
        <span class="name">${locked ? 'Locked' : escapeHtml(level.name)}</span>
        <span class="meta">${locked ? `Clear sector ${String(level.number - 1).padStart(2, '0')}` : `${time} · ${best}`}</span>
        ${rec.rank ? `<span class="rank rank-${cssRank(rec.rank)}">${rec.rank}</span>` : ''}
        ${rec.perfect ? '<span class="perfect" title="Perfect Clear">◆</span>' : ''}
      `;
      frag.appendChild(card);
    }

    this.el.levelGrid.replaceChildren(frag);
    this.el.levelsMeta.textContent = `${medals} perfect clear${medals === 1 ? '' : 's'}`;
  }

  // ── Statistics ────────────────────────────────────────────────────────────
  renderStats() {
    const s = storage.stats;
    const best = LEVELS.reduce((acc, l) => {
      const r = storage.getLevelRecord(l.id);
      return acc + (r.bestScore || 0);
    }, 0);
    const ranked = LEVELS.map((l) => storage.getLevelRecord(l.id).rank).filter(Boolean);
    const topRank = ranked.length
      ? ranked.reduce((a, b) => (rankValue(b) > rankValue(a) ? b : a))
      : '—';

    const tiles = [
      ['Sectors cleared', `${LEVELS.filter((l) => storage.getLevelRecord(l.id).rank).length} / ${TOTAL_LEVELS}`],
      ['Best score total', formatScore(best)],
      ['Nodes drained', formatScore(s.totalNodes)],
      ['Drones eliminated', formatScore(s.totalDrones)],
      ['Grid Shifts fired', formatScore(s.totalShifts)],
      ['Secrets found', formatScore(s.totalSecrets)],
      ['Best combo', `×${s.bestCombo || 0}`],
      ['Deaths', formatScore(s.totalDeaths)],
      ['Time in the grid', formatClock(s.playTime)],
      ['Highest rank', topRank],
    ];

    this.el.statGrid.replaceChildren(
      ...tiles.map(([label, value]) => {
        const tile = document.createElement('div');
        tile.className = 'stat-tile';
        tile.innerHTML = `<b>${escapeHtml(String(value))}</b><span>${escapeHtml(label)}</span>`;
        return tile;
      })
    );

    this.el.achievementList.replaceChildren(
      ...ACHIEVEMENTS.map((a) => {
        const earned = storage.hasAchievement(a.id);
        const row = document.createElement('div');
        row.className = 'achievement' + (earned ? ' is-earned' : '');
        row.innerHTML = `
          <span class="mark">${ACHIEVEMENT_GLYPHS[a.id] || '◦'}</span>
          <span><b>${escapeHtml(a.name)}</b><small>${escapeHtml(a.desc)}</small></span>
        `;
        return row;
      })
    );
  }

  // ── HUD ───────────────────────────────────────────────────────────────────
  /** Called only when a value actually changes. */
  updateHud(d) {
    this._set('score', this.el.score, formatScore(d.score));
    this._set('nodes', this.el.nodes, String(d.nodes));
    this._set('deaths', this.el.deaths, String(d.deaths));
    this._set('secrets', this.el.secrets, `${d.secrets}/${d.secretsTotal}`);
    this._set('missionSecrets', this.el.missionSecrets, `SECRETS ${d.secrets}/${d.secretsTotal}`);
    this.el.missionSecrets.dataset.state = d.secretsTotal === 0 || d.secrets === d.secretsTotal ? 'done' : '';
    this.el.missionDeaths.dataset.state = d.deaths === 0 ? 'done' : 'fail';
    this.el.missionDeaths.textContent = d.deaths === 0 ? 'NO DEATHS' : `${d.deaths} DEATH${d.deaths === 1 ? '' : 'S'}`;

    if (this._cache.combo !== d.combo) {
      this._cache.combo = d.combo;
      this.el.combo.hidden = d.combo < 1;
      if (d.combo >= 1) {
        this.el.combo.textContent = `COMBO ×${d.combo}`;
        // Restart the pop animation.
        this.el.combo.style.animation = 'none';
        void this.el.combo.offsetWidth;
        this.el.combo.style.animation = '';
      }
    }
  }

  /** Called every frame — deliberately tiny. */
  updateLiveHud(d) {
    const time = formatTime(d.time);
    if (this._cache.time !== time) {
      this._cache.time = time;
      this.el.time.textContent = time;
    }

    const offset = Math.round(ARC * (1 - d.shiftFraction) * 10) / 10;
    if (this._cache.arc !== offset) {
      this._cache.arc = offset;
      this.el.shiftArc.style.strokeDashoffset = String(offset);
    }
    if (this._cache.shiftReady !== d.shiftReady) {
      this._cache.shiftReady = d.shiftReady;
      this.el.shiftMeter.classList.toggle('is-ready', d.shiftReady);
    }

    const powered = d.power > 0;
    if (this._cache.powered !== powered) {
      this._cache.powered = powered;
      this.el.powerBar.hidden = !powered;
    }
    if (powered) {
      this.el.powerFill.style.transform = `scaleX(${Math.max(0, d.power / CFG.POWER_DURATION)})`;
    }

    if (d.targetTime) {
      this._set('missionTarget', this.el.missionTarget, `TARGET ${formatTime(d.targetTime)}`);
      const targetState = d.time <= d.targetTime ? 'done' : d.time <= d.targetTime * 1.15 ? 'warn' : 'fail';
      this.el.missionTarget.dataset.state = targetState;
    }

    const phase = d.phase === 'chase' ? 'CHASE' : 'PATROL';
    this._set('phase', this.el.phase, phase);
    this._set('phaseTime', this.el.phaseTime, `${Math.ceil(Math.max(0, d.phaseTimer || 0))}s`);
    this.el.threatChip.dataset.phase = d.phase || 'patrol';
  }

  setSector(level) {
    this._set('sector', this.el.sector, String(level.number).padStart(2, '0'));
    this._set('missionTarget', this.el.missionTarget, `TARGET ${formatTime(level.targetTime)}`);
    this._cache.time = null;
    this._cache.combo = null;
    this.el.combo.hidden = true;
    this.el.powerBar.hidden = true;
  }

  _set(key, el, value) {
    if (this._cache[key] === value) return;
    this._cache[key] = value;
    el.textContent = value;
  }

  // ── Overlays ──────────────────────────────────────────────────────────────
  showPause(level) {
    this.el.pauseSector.textContent = `Sector ${String(level.number).padStart(2, '0')} — ${level.name}`;
    this.el.pause.hidden = false;
  }

  hidePause() {
    this.el.pause.hidden = true;
  }

  hideResult() {
    this.el.complete.hidden = true;
  }

  /**
   * @param {object} r the result object produced by Game._completeLevel
   */
  showResult(r) {
    const $ = (id) => document.getElementById(id);
    const rank = $('result-rank');
    rank.textContent = r.rank;
    rank.className = `rank-badge rank-${cssRank(r.rank)}`;

    $('result-title').textContent = r.perfect ? 'Perfect Clear' : 'Sector Clear';
    $('result-sub').textContent = `Sector ${String(r.level.number).padStart(2, '0')} — ${r.level.name}`;
    $('result-score').textContent = formatScore(r.score);
    $('result-time').textContent = formatTime(r.time);
    $('result-deaths').textContent = String(r.deaths);
    $('result-combo').textContent = `×${r.bestCombo}`;
    $('result-secrets').textContent = `${r.secrets}/${r.secretsTotal}`;
    $('result-best').textContent = isFinite(r.previousBestTime) ? formatTime(Math.min(r.previousBestTime, r.time)) : formatTime(r.time);

    const flags = [];
    if (r.perfect) flags.push(['flag-gold', 'Perfect Clear +1000']);
    if (r.improved?.time && isFinite(r.previousBestTime)) flags.push(['flag-cyan', 'New best time']);
    if (r.improved?.score && r.previousBestScore > 0) flags.push(['flag-cyan', 'New high score']);
    if (r.deaths === 0 && !r.perfect) flags.push(['flag-green', 'No deaths']);
    if (r.unlockedNext) flags.push(['flag-green', `Sector ${String(r.level.number + 1).padStart(2, '0')} unlocked`]);
    if (r.time <= r.level.targetTime) flags.push(['flag-cyan', 'Under target time']);

    $('result-flags').replaceChildren(
      ...flags.map(([cls, text]) => {
        const el = document.createElement('span');
        el.className = `flag ${cls}`;
        el.textContent = text;
        return el;
      })
    );

    const timeDelta = Math.round(r.time - r.level.targetTime);
    document.getElementById('rating-panel').replaceChildren(
      statChip('Pace', timeDelta <= 0 ? `${Math.abs(timeDelta)}s under` : `${timeDelta}s over`),
      statChip('Rating', `${Math.round(r.rating)} / 100`),
      statChip('Shifts', String(r.shiftsUsed))
    );
    document.getElementById('result-coach').textContent = coachLine(r);

    const nextBtn = $('btn-next');
    nextBtn.hidden = r.isLastLevel;
    if (r.isLastLevel) {
      $('result-title').textContent = r.perfect ? 'Grid Owned' : 'Final Sector Clear';
    }

    this.el.complete.hidden = false;
  }

  // ── Toasts ────────────────────────────────────────────────────────────────
  toast(title, sub = '', ms = 3200) {
    const el = document.createElement('div');
    el.className = 'toast';
    // Title and subtitle share a column so long achievement text wraps neatly.
    el.innerHTML = `<span><b>${escapeHtml(title)}</b>${sub ? `<small>${escapeHtml(sub)}</small>` : ''}</span>`;
    this.el.toasts.appendChild(el);
    setTimeout(() => {
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 320);
    }, ms);
  }

  achievementToast(id) {
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (a) this.toast(`Achievement — ${a.name}`, a.desc);
  }

  pulseDirection(dir) {
    const map = { [DIR.UP]: 'u', [DIR.RIGHT]: 'r', [DIR.DOWN]: 'd', [DIR.LEFT]: 'l' };
    const value = map[dir];
    if (!value || !this.el.swipeCue) return;
    clearTimeout(this._swipeTimer);
    this.el.swipeCue.hidden = false;
    this.el.swipeCue.dataset.dir = value;
    this.el.swipeCue.style.animation = 'none';
    void this.el.swipeCue.offsetWidth;
    this.el.swipeCue.style.animation = '';
    this._swipeTimer = setTimeout(() => {
      this.el.swipeCue.hidden = true;
    }, 430);
  }
}

// ── helpers ─────────────────────────────────────────────────────────────────
/**
 * Rank names go straight into `class="rank-S+"`; the stylesheet escapes the
 * plus in its selector (`.rank-S\+`), so nothing needs escaping here.
 */
const cssRank = (rank) => rank;

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

function formatClock(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}

function statChip(label, value) {
  const el = document.createElement('div');
  el.innerHTML = `<span>${escapeHtml(label)}</span><b>${escapeHtml(value)}</b>`;
  return el;
}

function coachLine(r) {
  if (r.perfect) return 'Clean route, every secret, target pace. That sector is owned.';
  if (r.deaths > 0) return 'Biggest rank gain: route around drone pressure before grabbing the final nodes.';
  if (r.secrets < r.secretsTotal) return 'Strong clear. Hunt the amber seams to push this sector toward Perfect.';
  if (r.time > r.level.targetTime) return 'No survival problem here. The next upgrade is a tighter opening route.';
  return 'Solid clear. A cleaner combo route can still push the score higher.';
}
