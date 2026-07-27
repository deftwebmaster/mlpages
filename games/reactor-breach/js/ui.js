import { getAllStages, getStage } from './stages.js';
import { getStageRecord, loadSave, updateSettings } from './storage.js';
import { formatTime } from './utils.js';

const $ = (sel) => document.querySelector(sel);
const $all = (sel) => Array.from(document.querySelectorAll(sel));

export class UIManager {
  constructor(callbacks) {
    this.cb = callbacks;
    this.screens = {};
    $all('.screen').forEach((el) => (this.screens[el.id.replace('screen-', '')] = el));
    this.hud = $('#hud');
    this.routingPanel = $('#routingPanel');
    this.mobileControls = $('#mobileControls');
    this.tutorialEl = $('#tutorialPrompt');
    this._bindGlobalActions();
    this._bindSettings();
    this._bindRouting();
    this._bindMobileButtons();
    this.currentOverlayStack = [];
  }

  _bindGlobalActions() {
    document.body.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      this.cb.onAction?.(action, btn);
    });
    $('#pauseBtn').addEventListener('click', () => this.cb.onAction?.('pause'));
  }

  _bindSettings() {
    $all('[data-setting]').forEach((el) => {
      el.addEventListener('change', () => {
        const key = el.dataset.setting;
        const value = el.type === 'checkbox' ? el.checked : el.value;
        updateSettings({ [key]: value });
        this.cb.onSettingChange?.(key, value);
      });
    });
  }

  _bindRouting() {
    $all('.channel-meter').forEach((el) => {
      el.addEventListener('click', () => {
        this.cb.onAction?.('selectChannel', { channel: el.dataset.channel });
      });
    });
  }

  _bindMobileButtons() {
    const launch = $('#btnLaunch');
    const catchBtn = $('#btnCatch');
    launch.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.cb.onMobileLaunch?.();
    });
    catchBtn.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      this.cb.onMobileCatch?.();
    });
  }

  syncSettingsUI() {
    const s = loadSave().settings;
    for (const el of $all('[data-setting]')) {
      const key = el.dataset.setting;
      if (el.type === 'checkbox') el.checked = !!s[key];
      else el.value = s[key];
    }
  }

  showScreen(name) {
    for (const key of Object.keys(this.screens)) {
      this.screens[key].classList.toggle('hidden', key !== name);
    }
  }

  pushOverlay(name) {
    this.currentOverlayStack.push(name);
    this.screens[name].classList.remove('hidden');
  }

  popOverlay() {
    const name = this.currentOverlayStack.pop();
    if (name) this.screens[name].classList.add('hidden');
    return this.currentOverlayStack[this.currentOverlayStack.length - 1] || null;
  }

  hideAllOverlays() {
    this.currentOverlayStack = [];
  }

  setGameplayUiVisible(visible) {
    this.hud.classList.toggle('hidden', !visible);
    this.mobileControls.classList.toggle('hidden', !visible || !this._touchLikely());
  }

  _touchLikely() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }

  setRoutingVisible(visible) {
    this.routingPanel.classList.toggle('hidden', !visible);
  }

  updateMenu() {
    const save = loadSave();
    $('#menuContinue').classList.toggle('hidden', save.highestUnlockedStage <= 1);
  }

  showInstallButton(show) {
    $('#menuInstall').classList.toggle('hidden', !show);
  }

  buildStageGrid() {
    const grid = $('#stageGrid');
    grid.innerHTML = '';
    const save = loadSave();
    for (const stage of getAllStages()) {
      const record = getStageRecord(stage.id);
      const locked = stage.id > save.highestUnlockedStage;
      const card = document.createElement('button');
      card.className = 'stage-card' + (locked ? ' locked' : '') + (stage.isBoss ? ' boss' : '');
      card.disabled = locked;
      card.innerHTML = `
        <div class="num">${stage.isBoss ? 'BOSS' : 'STAGE'} ${stage.id}</div>
        <div class="name">${locked ? '???' : stage.name}</div>
        <div class="rank">${record.bestRank ? 'Rank ' + record.bestRank : ''}</div>
        <div class="medals">
          <span class="medal ${record.medals.breach ? 'earned' : ''}"></span>
          <span class="medal ${record.medals.stable ? 'earned' : ''}"></span>
          <span class="medal ${record.medals.control ? 'earned' : ''}"></span>
        </div>`;
      if (!locked) {
        card.addEventListener('click', () => this.cb.onAction?.('selectStage', { stageId: stage.id }));
      }
      grid.appendChild(card);
    }
  }

  showStageIntro(stage) {
    $('#introNum').textContent = (stage.isBoss ? 'BOSS CHAMBER ' : 'CHAMBER ') + stage.id;
    $('#introName').textContent = stage.name;
    $('#introSubtitle').textContent = stage.subtitle || '';
    $('#introPrimary').textContent = stage.primaryObjective?.label || 'Breach the reactor chamber';
    const list = $('#introSecondary');
    list.innerHTML = '';
    for (const sec of stage.secondaryObjectives || []) {
      const li = document.createElement('li');
      li.textContent = sec.label;
      list.appendChild(li);
    }
    this.showScreen('stageIntro');
  }

  updateHUD(state) {
    $('#hudScore').textContent = Math.floor(state.score).toLocaleString();
    const comboEl = $('#hudCombo');
    if (state.comboMultiplier > 1) {
      comboEl.textContent = `x${state.comboMultiplier}`;
      comboEl.classList.remove('hidden');
    } else {
      comboEl.classList.add('hidden');
    }
    const chargesEl = $('#hudCharges');
    if (chargesEl.childElementCount !== state.maxCharges) {
      chargesEl.innerHTML = '';
      for (let i = 0; i < state.maxCharges; i++) {
        const d = document.createElement('span');
        d.className = 'charge';
        chargesEl.appendChild(d);
      }
    }
    Array.from(chargesEl.children).forEach((el, i) => {
      el.classList.toggle('lost', i >= state.charges);
    });
    $('#hudObjective').textContent = state.objectiveText || '';

    const bossBar = $('#hudBossBar');
    if (state.boss) {
      bossBar.classList.remove('hidden');
      $('#hudBossLabel').textContent = state.boss.label;
      $('#hudBossFill').style.width = `${Math.round(state.boss.progress * 100)}%`;
    } else {
      bossBar.classList.add('hidden');
    }
  }

  updateRouting(routing) {
    for (const ch of ['deflector', 'orb', 'reactorControl']) {
      const meter = document.querySelector(`.channel-meter[data-channel="${ch}"]`);
      meter.classList.toggle('selected', routing.selected === ch);
      meter.classList.toggle('ready', routing.tierReached[ch] > 0);
      const fill = document.querySelector(`[data-fill="${ch}"]`);
      fill.style.width = `${Math.min(100, (routing.energy[ch] / routing.capacity) * 100)}%`;
      const tierEl = document.querySelector(`[data-tier="${ch}"]`);
      tierEl.textContent = routing.tierReached[ch] > 0 ? `T${routing.tierReached[ch]} READY` : '';
    }
  }

  showTutorial(text) {
    this.tutorialEl.textContent = text;
    this.tutorialEl.classList.remove('hidden');
  }

  hideTutorial() {
    this.tutorialEl.classList.add('hidden');
  }

  showStageComplete(result, stage) {
    $('#completeTitle').textContent = stage.isBoss ? 'Boss Destroyed' : 'Chamber Breached';
    $('#completeRank').textContent = result.rank;
    const grid = $('#completeStats');
    grid.innerHTML = '';
    const rows = [
      ['Score', result.score.toLocaleString()],
      ['Time', formatTime(result.time)],
      ['Charges Remaining', result.chargesRemaining],
      ['Max Combo', `x${result.maxCombo}`]
    ];
    for (const [label, val] of rows) {
      grid.insertAdjacentHTML('beforeend', `<span class="label">${label}</span><span>${val}</span>`);
    }
    const medalRow = $('#completeMedals');
    medalRow.innerHTML = '';
    for (const [key, label] of [['breach', 'B'], ['stable', 'S'], ['control', 'C']]) {
      medalRow.insertAdjacentHTML(
        'beforeend',
        `<span class="medal-badge ${result.medals[key] ? 'earned' : ''}" title="${label}">${label}</span>`
      );
    }
    $('#btnNextStage').classList.toggle('hidden', stage.id >= 18);
    this.showScreen('stageComplete');
  }

  showStageFailed(result) {
    const grid = $('#failedStats');
    grid.innerHTML = '';
    const rows = [
      ['Score', result.score.toLocaleString()],
      ['Time', formatTime(result.time)],
      ['Best Score', result.bestScore?.toLocaleString() ?? '-']
    ];
    for (const [label, val] of rows) {
      grid.insertAdjacentHTML('beforeend', `<span class="label">${label}</span><span>${val}</span>`);
    }
    this.showScreen('stageFailed');
  }

  buildStats() {
    const s = loadSave().stats;
    const el = $('#statsContent');
    const rows = [
      ['Stages Completed', s.stagesCompleted],
      ['Play Time', formatTime(s.playTimeSeconds)],
      ['Components Destroyed', s.componentsDestroyed],
      ['Shield Nodes Destroyed', s.shieldNodesDestroyed],
      ['Volatile Chains', s.volatileChains],
      ['Energy Collected', s.energyCollected],
      ['Abilities Activated', s.abilitiesActivated],
      ['Magnetic Catches', s.magneticCatches],
      ['Bosses Defeated', s.bossesDefeated],
      ['Highest Combo', s.highestCombo],
      ['S+ Ranks', s.sPlusRanks]
    ];
    el.innerHTML = rows.map(([l, v]) => `<div class="stat-row"><span>${l}</span><span>${v}</span></div>`).join('');
  }
}
