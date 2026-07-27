/**
 * main.js — Bootstrap, game loop and glue.
 *
 * The loop runs gameplay on a fixed timestep and renders once per animation
 * frame. Fixed-step integration keeps movement, collision and AI decisions
 * identical whether the device is running at 60, 90 or 120 Hz, while rendering
 * stays as smooth as the display allows.
 */

import { CFG, STATE } from './config.js';
import { Renderer } from './renderer.js';
import { Game, RUN } from './game.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { storage } from './storage.js';
import { audio } from './audio.js';
import { TOTAL_LEVELS } from './levels.js';

const canvas = document.getElementById('board');
const renderer = new Renderer(canvas);

let state = STATE.LOADING;
let installPrompt = null;
let lastTime = 0;
let accumulator = 0;
let rafId = 0;

// ── Wiring ──────────────────────────────────────────────────────────────────
const ui = new UI({
  onStart: (levelNumber) => startLevel(levelNumber),
  onPause: () => pause(),
  onResume: () => resume(),
  onRetry: () => {
    ui.hidePause();
    ui.hideResult();
    startLevel(game.level.number);
  },
  onQuit: () => quitToMenu(),
  onNext: () => {
    const next = Math.min(TOTAL_LEVELS, game.level.number + 1);
    ui.hideResult();
    startLevel(next);
  },
  onSettingChange: (name, value) => applySetting(name, value),
  onReset: () => quitToMenu(),
  onInstall: () => promptInstall(),
  onAnyClick: () => audio.unlock(),
});

const game = new Game(renderer, handleGameEvent);

const input = new Input(canvas);
input.attachDpad(document.getElementById('dpad'));
input.onAnyInput = () => audio.unlock();
input.onDirection = (dir) => {
  if (state !== STATE.PLAYING) return;
  game.handleDirection(dir);
  haptic(6);
};
input.onAction = (action) => {
  switch (action) {
    case 'pause':
      if (state === STATE.PLAYING) pause();
      else if (state === STATE.PAUSED) resume();
      else if (ui.current !== 'menu' && ui.current !== 'game') ui.back();
      break;
    case 'retry':
      if (state === STATE.PLAYING || state === STATE.PAUSED) {
        ui.hidePause();
        startLevel(game.level.number);
      }
      break;
    case 'confirm':
      if (state === STATE.LEVEL_COMPLETE) {
        ui.hideResult();
        startLevel(Math.min(TOTAL_LEVELS, game.level.number + (game.result?.isLastLevel ? 0 : 1)));
      } else if (state === STATE.PAUSED) {
        resume();
      } else if (ui.current === 'menu') {
        startLevel(Math.min(storage.unlocked, TOTAL_LEVELS));
      }
      break;
    case 'mute': {
      const next = !storage.getSetting('sound');
      storage.setSetting('sound', next);
      storage.setSetting('music', next);
      ui.syncSettings();
      applySetting('sound', next);
      applySetting('music', next);
      ui.toast(next ? 'Audio on' : 'Audio muted');
      break;
    }
    default:
      break;
  }
};

// ── Game events ─────────────────────────────────────────────────────────────
function handleGameEvent(name, payload) {
  switch (name) {
    case 'hud':
      ui.updateHud(payload);
      break;
    case 'levelLoaded':
      ui.setSector(payload.level);
      break;
    case 'levelComplete':
      state = STATE.LEVEL_COMPLETE;
      audio.stopMusic();
      haptic([18, 60, 30]);
      ui.showResult(payload);
      break;
    case 'achievement':
      ui.achievementToast(payload.id);
      haptic(24);
      break;
    default:
      break;
  }
}

// ── Flow ────────────────────────────────────────────────────────────────────
function startLevel(number) {
  ui.hidePause();
  ui.hideResult();
  ui.show('game', { remember: false });
  // Layout must settle before the renderer measures the canvas box.
  renderer.resize();
  game.loadLevel(number);
  renderer.resize();
  game.paused = false;
  state = STATE.PLAYING;
  audio.unlock();
  if (storage.getSetting('music')) audio.startMusic();
}

function pause() {
  if (state !== STATE.PLAYING) return;
  state = STATE.PAUSED;
  game.paused = true;
  audio.stopMusic();
  ui.showPause(game.level);
}

function resume() {
  if (state !== STATE.PAUSED) return;
  ui.hidePause();
  game.paused = false;
  state = STATE.PLAYING;
  lastTime = performance.now();
  accumulator = 0;
  if (storage.getSetting('music')) audio.startMusic();
}

function quitToMenu() {
  ui.hidePause();
  ui.hideResult();
  game.paused = true;
  state = STATE.MENU;
  audio.stopMusic();
  ui.show('menu', { remember: false });
}

function applySetting(name, value) {
  switch (name) {
    case 'sound':
      audio.setSfxEnabled(value);
      break;
    case 'music':
      audio.setMusicEnabled(value);
      if (value && state === STATE.PLAYING) audio.startMusic();
      break;
    case 'particles':
      game.particles.enabled = value;
      if (!value) game.particles.clear();
      break;
    case 'screenShake':
      renderer.shakeEnabled = value;
      break;
    case 'dpad':
      ui.applyDpadPreference();
      break;
    default:
      break;
  }
}

function haptic(pattern) {
  if (!storage.getSetting('hapticFeedback')) return;
  if (navigator.vibrate) navigator.vibrate(pattern);
}

// ── Loop ────────────────────────────────────────────────────────────────────
function frame(now) {
  rafId = requestAnimationFrame(frame);

  let dt = (now - lastTime) / 1000;
  lastTime = now;
  if (!isFinite(dt) || dt < 0) dt = 0;
  // A long stall (tab switch, GC pause) must never teleport anything.
  dt = Math.min(dt, CFG.MAX_FRAME_DT);

  if (state === STATE.PLAYING) {
    accumulator += dt;
    let steps = 0;
    while (accumulator >= CFG.FIXED_STEP && steps < 8) {
      game.update(CFG.FIXED_STEP);
      accumulator -= CFG.FIXED_STEP;
      steps++;
      if (game.run === RUN.COMPLETE) break;
    }
    if (steps === 8) accumulator = 0; // fell behind; drop the backlog
    ui.updateLiveHud(game.liveHud());
  } else if (state === STATE.LEVEL_COMPLETE || state === STATE.PAUSED) {
    // Keep particles and the shift animation alive under the overlay.
    game.particles.update(dt);
  }

  if (state === STATE.PLAYING || state === STATE.PAUSED || state === STATE.LEVEL_COMPLETE) {
    // Measuring every frame costs one layout read but makes the board immune to
    // size changes that fire no resize event: orientation locks, PWA chrome
    // appearing, the address bar collapsing, or the tab being laid out late.
    renderer.resize();
    renderer.draw(dt, game.scene());
  }
}

// ── Responsive ──────────────────────────────────────────────────────────────
const onResize = () => {
  renderer.resize();
  ui.applyDpadPreference();
};
window.addEventListener('resize', onResize);
window.addEventListener('orientationchange', () => setTimeout(onResize, 180));
if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);

document.addEventListener('visibilitychange', () => {
  if (document.hidden && state === STATE.PLAYING) pause();
});

// Stop the page itself from scrolling or bouncing behind the board.
document.addEventListener(
  'touchmove',
  (e) => {
    if (e.target.closest('.sheet-body, .level-grid')) return;
    e.preventDefault();
  },
  { passive: false }
);

// ── PWA ─────────────────────────────────────────────────────────────────────
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  installPrompt = e;
  ui.showInstallButton(true);
});

window.addEventListener('appinstalled', () => {
  installPrompt = null;
  ui.showInstallButton(false);
  ui.toast('Gridlock installed', 'It now runs offline from your home screen.');
});

async function promptInstall() {
  if (!installPrompt) {
    ui.toast('Already installed, or unsupported', 'Use your browser menu → Add to Home Screen.');
    return;
  }
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  ui.showInstallButton(false);
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol === 'file:') return; // no SW without http(s)
  try {
    // Relative path keeps this working from a GitHub Pages project subpath.
    const reg = await navigator.serviceWorker.register('sw.js');
    reg.addEventListener('updatefound', () => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener('statechange', () => {
        if (sw.state === 'installed' && navigator.serviceWorker.controller) {
          ui.toast('Update ready', 'Restart Gridlock to load the new version.');
        }
      });
    });
  } catch {
    // Offline support is a bonus, never a requirement to play.
  }
}

// ── Boot ────────────────────────────────────────────────────────────────────
function boot() {
  ui.syncSettings();
  audio.setSfxEnabled(storage.getSetting('sound') !== false);
  audio.setMusicEnabled(storage.getSetting('music') !== false);
  renderer.shakeEnabled = storage.getSetting('screenShake') !== false;
  game.particles.enabled = storage.getSetting('particles') !== false;

  storage.addStats({ sessions: 1 });

  state = STATE.MENU;
  ui.show('menu', { remember: false });

  lastTime = performance.now();
  rafId = requestAnimationFrame(frame);

  registerServiceWorker();
}

// A frame of breathing room so the loading screen is seen rather than flashed.
if (document.readyState === 'complete') setTimeout(boot, 240);
else window.addEventListener('load', () => setTimeout(boot, 240));

// Expose a tiny handle for debugging without leaking internals into globals.
window.__gridlock = { game, renderer, ui, storage, stop: () => cancelAnimationFrame(rafId) };
