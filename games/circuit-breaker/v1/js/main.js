/**
 * Entry point: screens, menus, settings, and the wiring between the DOM and the
 * game controller.
 */

import { Game, STATE } from './game.js';
import { audio } from './audio.js';
import { storage } from './storage.js';
import { initPWA, promptInstall } from './pwa.js';
import { setReducedEffects, reducedMotion, onMotionChange, formatNumber } from './utils.js';

const $ = (id) => document.getElementById(id);

const app = $('app');

const dom = {
  app,
  game: $('screen-game'),
  board: $('board'),
  boardGrid: $('board-grid'),
  nodes: $('board-nodes'),
  fx: $('board-fx'),
  flash: $('board-flash'),
  combo: $('combo'),
  banner: $('board-banner'),
  score: $('hud-score'),
  best: $('hud-best'),
  menuBest: $('menu-best'),
  heatFill: $('heat-fill'),
  heatValue: $('heat-value'),
  heatStatus: $('heat-status'),
  heatTrack: $('heat-track'),
  live: $('live-region'),
  tutorial: $('tutorial'),
  tutorialText: $('tutorial-text'),
  tutorialClose: $('tutorial-close'),
};

const overlays = {
  pause: $('overlay-pause'),
  help: $('overlay-help'),
  over: $('overlay-over'),
  confirm: $('overlay-confirm'),
};

let confirmAction = null;
let lastFocus = null;

/* ---------------------------------------------------------------------------
   Screens and overlays
   --------------------------------------------------------------------------- */

function showScreen(name) {
  app.dataset.screen = name;
}

function openOverlay(el, focusTarget) {
  lastFocus = document.activeElement;
  el.hidden = false;
  const panel = el.querySelector('.panel');
  if (panel) panel.scrollTop = 0;
  // preventScroll keeps a long panel (Help) from opening scrolled to its button.
  (focusTarget || el.querySelector('button'))?.focus({ preventScroll: true });
}

function closeOverlay(el) {
  el.hidden = true;
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  lastFocus = null;
}

function toast(message, actionLabel, action) {
  const el = $('toast');
  el.textContent = message;
  if (actionLabel && action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = actionLabel;
    btn.addEventListener('click', action);
    el.appendChild(btn);
  }
  el.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { el.hidden = true; el.textContent = ''; }, actionLabel ? 12000 : 3400);
}

/* ---------------------------------------------------------------------------
   Game
   --------------------------------------------------------------------------- */

const game = new Game({
  dom,
  onGameOver: (result) => showGameOver(result),
  onPauseParked: () => {
    if (overlays.pause.hidden && overlays.confirm.hidden) {
      openOverlay(overlays.pause, $('btn-resume'));
    }
  },
});

function startGame() {
  closeAllOverlays();
  showScreen('game');
  game.newGame();
  refreshMenuStats();
}

function closeAllOverlays() {
  Object.values(overlays).forEach((el) => { el.hidden = true; });
  lastFocus = null;
}

function showGameOver(result) {
  $('final-score').textContent = formatNumber(result.score);
  $('final-best').textContent = formatNumber(result.best);
  $('stat-moves').textContent = formatNumber(result.validMoves);
  $('stat-cascade').textContent = result.largestCascade > 1 ? `x${result.largestCascade}` : '—';
  $('stat-match').textContent = result.longestMatch ? formatNumber(result.longestMatch) : '—';
  $('stat-cleared').textContent = formatNumber(result.nodesCleared);
  $('new-best').classList.toggle('hidden', !result.isBest);
  refreshMenuStats();
  openOverlay(overlays.over, $('btn-reboot'));
}

function refreshMenuStats() {
  dom.menuBest.textContent = formatNumber(storage.bestScore);
  dom.best.textContent = formatNumber(storage.bestScore);
  const games = storage.gamesPlayed;
  $('menu-games').textContent = games
    ? `${formatNumber(games)} run${games === 1 ? '' : 's'} · ${formatNumber(storage.lifetimeScore)} lifetime`
    : 'No runs logged';
}

function goToMenu() {
  game.abandon();
  closeAllOverlays();
  showScreen('menu');
  refreshMenuStats();
}

function askConfirm(title, body, action) {
  $('confirm-title').textContent = title;
  $('confirm-body').textContent = body;
  confirmAction = action;
  overlays.pause.hidden = true;
  openOverlay(overlays.confirm, $('btn-confirm-yes'));
}

/* ---------------------------------------------------------------------------
   Settings toggles
   --------------------------------------------------------------------------- */

const toggleGroups = {
  sound: [$('toggle-sound-menu'), $('toggle-sound-pause')],
  haptics: [$('toggle-haptics-menu'), $('toggle-haptics-pause')],
  motion: [$('toggle-motion-menu'), $('toggle-motion-pause')],
};

function paintToggle(name, on) {
  toggleGroups[name].forEach((el) => el && el.setAttribute('aria-checked', String(!!on)));
}

function initSettings() {
  audio.init();
  paintToggle('sound', audio.soundEnabled);
  paintToggle('haptics', audio.hapticsEnabled);

  const reduced = storage.reducedEffects;
  setReducedEffects(reduced);
  app.classList.toggle('reduced-fx', reduced);
  paintToggle('motion', reduced || reducedMotion());

  if (!audio.hapticsSupported) {
    toggleGroups.haptics.forEach((el) => el && el.classList.add('hidden'));
  }

  toggleGroups.sound.forEach((el) => el && el.addEventListener('click', () => {
    audio.setSound(!audio.soundEnabled);
    paintToggle('sound', audio.soundEnabled);
    if (audio.soundEnabled) audio.play('button');
  }));

  toggleGroups.haptics.forEach((el) => el && el.addEventListener('click', () => {
    audio.setHaptics(!audio.hapticsEnabled);
    paintToggle('haptics', audio.hapticsEnabled);
    if (audio.hapticsEnabled) audio.buzz(14);
  }));

  toggleGroups.motion.forEach((el) => el && el.addEventListener('click', () => {
    const next = !storage.reducedEffects;
    storage.reducedEffects = next;
    setReducedEffects(next);
    app.classList.toggle('reduced-fx', next);
    paintToggle('motion', next || reducedMotion());
    game.renderer.syncTimingVars();
    audio.play('button');
  }));

  onMotionChange(() => {
    game.renderer.syncTimingVars();
    paintToggle('motion', storage.reducedEffects || reducedMotion());
  });
}

/* ---------------------------------------------------------------------------
   Buttons
   --------------------------------------------------------------------------- */

function clickSound(el, handler) {
  el.addEventListener('click', (event) => {
    audio.unlock();
    audio.play('button');
    handler(event);
  });
}

function initButtons() {
  clickSound($('btn-start'), startGame);

  clickSound($('btn-help'), () => {
    storage.helpSeen = true;
    openOverlay(overlays.help, $('btn-help-close'));
  });
  clickSound($('btn-help-close'), () => closeOverlay(overlays.help));

  clickSound($('btn-pause'), () => {
    if (!game.isRunning) return;
    game.pause();
    openOverlay(overlays.pause, $('btn-resume'));
  });

  clickSound($('btn-resume'), () => {
    closeOverlay(overlays.pause);
    game.resume();
  });

  clickSound($('btn-restart'), () => {
    askConfirm('RESTART RUN?', 'The current run ends now. Your score is only kept if it beats your best.', startGame);
  });

  clickSound($('btn-quit'), () => {
    askConfirm('ABANDON RUN?', 'The current run ends now. Your score is only kept if it beats your best.', goToMenu);
  });

  clickSound($('btn-confirm-yes'), () => {
    const action = confirmAction;
    confirmAction = null;
    overlays.confirm.hidden = true;
    action?.();
  });

  clickSound($('btn-confirm-no'), () => {
    confirmAction = null;
    overlays.confirm.hidden = true;
    if (game.state === STATE.PAUSED) openOverlay(overlays.pause, $('btn-resume'));
  });

  clickSound($('btn-reboot'), startGame);
  clickSound($('btn-over-menu'), goToMenu);

  clickSound($('btn-install'), async () => {
    const accepted = await promptInstall();
    if (accepted) $('btn-install').classList.add('hidden');
  });

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (!overlays.confirm.hidden) { $('btn-confirm-no').click(); return; }
    if (!overlays.help.hidden) { closeOverlay(overlays.help); return; }
    if (!overlays.pause.hidden) { $('btn-resume').click(); return; }
    if (game.state === STATE.PLAYER_TURN) $('btn-pause').click();
  });
}

/* ---------------------------------------------------------------------------
   Visibility: leaving the app parks the run behind the pause overlay.
   --------------------------------------------------------------------------- */

function initVisibility() {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    if (!game.isRunning || game.state === STATE.PAUSED) return;
    game.pause();
    if (overlays.over.hidden && overlays.confirm.hidden) {
      overlays.pause.hidden = false;
    }
  });
}

/* ---------------------------------------------------------------------------
   Boot
   --------------------------------------------------------------------------- */

function boot() {
  initSettings();
  initButtons();
  initVisibility();
  refreshMenuStats();

  initPWA({
    onInstallAvailable: (available) => {
      $('btn-install').classList.toggle('hidden', !available);
    },
    onUpdateReady: (apply) => {
      toast('A new build is installed.', 'RESTART', apply);
    },
  });

  // Nothing to preload, and the stylesheet is already applied, so hand over to
  // the menu immediately. Deferring this to a frame callback would let a
  // background tab (where frames may never come) sit on the loading screen —
  // or fire late and clobber a screen the player has already moved on from.
  showScreen('menu');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
