/**
 * DOM layer: screens, HUD, toasts and settings.
 *
 * The HUD is DOM rather than canvas so it stays crisp, selectable by assistive
 * technology, and cheap to update. Text is refreshed on a timer and meters only
 * when they move enough to be visible, so a frame rarely touches layout.
 */

import { formatScore, formatDistance, formatTime } from './utils.js';
import { STABILITY, GRADES } from './config.js';
import * as store from './storage.js';

const $ = (id) => document.getElementById(id);

export class UI {
  constructor(hooks) {
    this.hooks = hooks;
    this.el = {
      screens: document.querySelectorAll('.screen'),
      loading: $('screen-loading'),
      menu: $('screen-menu'),
      help: $('screen-help'),
      settings: $('screen-settings'),
      pause: $('screen-pause'),
      results: $('screen-results'),
      confirm: $('screen-confirm'),

      hud: $('hud'),
      score: $('hud-score'),
      mult: $('hud-mult'),
      distance: $('hud-distance'),
      stabFill: $('stability-fill'),
      stabValue: $('stability-value'),
      stabLabel: $('stability-label'),
      phaseFill: $('phase-fill'),
      phaseValue: $('phase-value'),
      status: $('hud-status'),
      phaseBtn: $('btn-phase'),
      pauseBtn: $('btn-pause'),
      toast: $('toast'),
      countdown: $('countdown'),
      tutorial: $('tutorial'),

      menuBest: $('menu-best'),
      menuBestDistance: $('menu-best-distance'),
      menuRuns: $('menu-runs'),
      installBtn: $('btn-install'),

      resGrade: $('res-grade'),
      resScore: $('res-score'),
      resBest: $('res-best'),
      resNewBest: $('res-newbest'),
      resStats: $('res-stats'),

      statsList: $('stats-list'),
    };

    this._lastText = 0;
    this._lastStab = -1;
    this._lastPhase = -1;
    this._toastTimer = 0;
    this._pendingConfirm = null;

    this._bind();
    this.refreshMenuStats();
    this.syncSettings();
  }

  _bind() {
    const on = (id, fn) => {
      const el = $(id);
      if (el) el.addEventListener('click', fn);
    };

    on('btn-start', () => this.hooks.start());
    on('btn-help', () => this.show('help'));
    on('btn-settings', () => {
      this.renderStats();
      this.show('settings');
    });
    on('btn-help-back', () => this.hooks.backToMenu());
    // Settings can be reached from the menu or layered over a paused run;
    // "back" has to return to whichever opened it.
    on('btn-settings-back', () => {
      if (this._settingsOverlay) this.hide('settings');
      else this.hooks.backToMenu();
    });
    on('btn-help-tutorial', () => this.hooks.replayTutorial());

    on('btn-pause', () => this.hooks.togglePause());
    on('btn-resume', () => this.hooks.resume());
    on('btn-restart', () => this.hooks.confirmRestart());
    on('btn-pause-settings', () => {
      this.renderStats();
      this.show('settings', true);
    });
    on('btn-quit', () => this.hooks.confirmQuit());

    on('btn-retry', () => this.hooks.start());
    on('btn-menu', () => this.hooks.backToMenu());

    on('btn-confirm-yes', () => {
      const fn = this._pendingConfirm;
      this._pendingConfirm = null;
      this.hide('confirm');
      if (fn) fn();
    });
    on('btn-confirm-no', () => {
      this._pendingConfirm = null;
      this.hide('confirm');
    });

    on('btn-reset-progress', () => {
      this.confirm('Erase all saved scores and statistics?', () => {
        store.resetProgress();
        this.refreshMenuStats();
        this.renderStats();
      });
    });

    for (const input of document.querySelectorAll('[data-setting]')) {
      input.addEventListener('change', () => {
        const key = input.dataset.setting;
        const value = input.type === 'checkbox' ? input.checked : input.value;
        this.hooks.setSetting(key, value);
      });
    }
  }

  /* ------------------------------------------------------------------ */

  show(name, overlay = false) {
    const el = this.el[name];
    if (!el) return;
    if (name === 'settings') this._settingsOverlay = overlay;
    if (!overlay) {
      for (const s of this.el.screens) s.classList.remove('is-visible');
    }
    el.classList.add('is-visible');
    const focusable = el.querySelector('button, [href], input, select');
    if (focusable) setTimeout(() => focusable.focus({ preventScroll: true }), 30);
  }

  hide(name) {
    const el = this.el[name];
    if (el) el.classList.remove('is-visible');
  }

  hideAll() {
    for (const s of this.el.screens) s.classList.remove('is-visible');
  }

  setHudVisible(v) {
    this.el.hud.classList.toggle('is-visible', v);
    this.el.hud.setAttribute('aria-hidden', v ? 'false' : 'true');
  }

  confirm(message, onYes) {
    $('confirm-text').textContent = message;
    this._pendingConfirm = onYes;
    this.show('confirm', true);
  }

  /* ------------------------------------------------------------------ */

  /** Called every frame during the countdown; only re-animates on a change. */
  countdown(text) {
    const el = this.el.countdown;
    if (text === this._countdownText) return;
    this._countdownText = text;
    if (!text) {
      el.classList.remove('is-visible');
      return;
    }
    el.textContent = text;
    el.classList.remove('is-visible');
    // Force reflow so the animation restarts for each count.
    void el.offsetWidth;
    el.classList.add('is-visible');
  }

  toast(text, tone = 'cyan') {
    const el = this.el.toast;
    el.textContent = text;
    el.dataset.tone = tone;
    el.classList.remove('is-visible');
    void el.offsetWidth;
    el.classList.add('is-visible');
    this._toastTimer = 1.4;
  }

  tutorial(text) {
    const el = this.el.tutorial;
    if (!text) {
      el.classList.remove('is-visible');
      return;
    }
    el.textContent = text;
    el.classList.add('is-visible');
  }

  tickToast(dt) {
    if (this._toastTimer > 0) {
      this._toastTimer -= dt;
      if (this._toastTimer <= 0) this.el.toast.classList.remove('is-visible');
    }
  }

  /* ------------------------------------------------------------------ */

  updateHud(run, now) {
    const stab = Math.max(0, run.stability);
    if (Math.abs(stab - this._lastStab) > 0.35) {
      this._lastStab = stab;
      this.el.stabFill.style.transform = `scaleX(${(stab / 100).toFixed(4)})`;
      this.el.stabValue.textContent = Math.ceil(stab) + '%';
      const state = STABILITY.states.find((s) => stab > s.min) || STABILITY.states[STABILITY.states.length - 1];
      this.el.stabLabel.textContent = state.label;
      this.el.stabFill.dataset.tone = state.tone;
      this.el.hud.dataset.stability = state.tone;
    }

    const ph = run.player.phaseEnergy;
    if (Math.abs(ph - this._lastPhase) > 0.6) {
      this._lastPhase = ph;
      this.el.phaseFill.style.transform = `scaleX(${(ph / 100).toFixed(4)})`;
      this.el.phaseValue.textContent = Math.ceil(ph) + '%';
      this.el.phaseFill.dataset.low = ph < 10 ? 'true' : 'false';
      this.el.phaseBtn.classList.toggle('is-empty', ph < 10);
    }

    // Numeric readouts do not need 60 Hz.
    if (now - this._lastText > 90) {
      this._lastText = now;
      this.el.score.textContent = formatScore(run.score);
      this.el.mult.textContent = run.multiplier.toFixed(2) + '×';
      this.el.distance.textContent = formatDistance(run.distance);
      this.el.mult.dataset.hot = run.multiplier >= 2.5 ? 'true' : 'false';
    }

    this.el.phaseBtn.classList.toggle('is-active', run.player.phased);
  }

  setStatus(text, tone) {
    const el = this.el.status;
    if (el.textContent !== text) {
      el.textContent = text;
      el.dataset.tone = tone || '';
      el.classList.toggle('is-visible', !!text);
    }
  }

  /* ------------------------------------------------------------------ */

  refreshMenuStats() {
    this.el.menuBest.textContent = formatScore(store.get('bestScore'));
    this.el.menuBestDistance.textContent = formatDistance(store.get('bestDistance'));
    this.el.menuRuns.textContent = formatScore(store.get('totalRuns'));
  }

  renderStats() {
    const rows = [
      ['Best score', formatScore(store.get('bestScore'))],
      ['Best distance', formatDistance(store.get('bestDistance'))],
      ['Furthest checkpoint', formatScore(store.get('bestCheckpoint'))],
      ['Total runs', formatScore(store.get('totalRuns'))],
      ['Total distance', formatDistance(store.get('totalDistance'))],
      ['Fragments collected', formatScore(store.get('totalFragments'))],
      ['Near misses', formatScore(store.get('totalNearMisses'))],
      ['Clean sections', formatScore(store.get('totalCleanSections'))],
      ['Time in transit', formatTime(store.get('totalPlayTime'))],
    ];
    this.el.statsList.innerHTML = rows
      .map(([k, v]) => `<div class="stat-row"><span>${k}</span><b>${v}</b></div>`)
      .join('');
  }

  showResults(summary) {
    const grade = GRADES.find((g) => summary.score >= g.min) || GRADES[GRADES.length - 1];
    this.el.resGrade.textContent = grade.label;
    this.el.resGrade.dataset.tone = grade.tone;
    this.el.resScore.textContent = formatScore(summary.score);
    this.el.resBest.textContent = formatScore(store.get('bestScore'));
    this.el.resNewBest.classList.toggle('is-visible', summary.newBest);

    const rows = [
      ['Distance', formatDistance(summary.distance)],
      ['Time', formatTime(summary.time)],
      ['Fragments', formatScore(summary.fragments)],
      ['Near misses', formatScore(summary.nearMisses)],
      ['Clean sections', formatScore(summary.cleanSections)],
      ['Checkpoints', formatScore(summary.checkpoints)],
      ['Peak multiplier', summary.maxMultiplier.toFixed(2) + '×'],
      ['Payload remaining', Math.max(0, Math.round(summary.stability)) + '%'],
      ['Cause', summary.cause],
    ];
    this.el.resStats.innerHTML = rows
      .map(([k, v]) => `<div class="stat-row"><span>${k}</span><b>${v}</b></div>`)
      .join('');
    this.show('results');
  }

  syncSettings() {
    for (const input of document.querySelectorAll('[data-setting]')) {
      const key = input.dataset.setting;
      if (input.type === 'checkbox') input.checked = !!store.get(key);
      else if (store.get(key) !== undefined) input.value = store.get(key);
    }
  }

  setInstallAvailable(v) {
    this.el.installBtn.hidden = !v;
  }
}
