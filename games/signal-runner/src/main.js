/**
 * main.js — Composition root. Builds the pieces, wires them, starts the loop.
 *
 * Nothing in here contains game rules; it exists to connect modules that
 * deliberately do not know about each other.
 */

import { Game, GameState } from './game.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { InputManager } from './input.js';
import { GameLoop } from './loop.js';
import { registerServiceWorker, setupInstallPrompt } from './pwa.js';
import { isReducedMotionPreferred } from './utils.js';
import { hasStoredSettings } from './storage.js';

const canvas = document.getElementById('game');
const stage = document.getElementById('stage');

const game = new Game();
const renderer = new Renderer(canvas);
const ui = new UI(game);
window.__SIGNAL_GAME__ = game;

// Respect the OS-level motion preference on first run, but never override a
// choice the player has already made in Settings.
if (isReducedMotionPreferred() && !hasStoredSettings()) {
  game.updateSetting('reducedEffects', true);
  ui.syncSettings();
}
renderer.reducedEffects = game.settings.reducedEffects;
ui.onReducedEffectsChange = (value) => { renderer.reducedEffects = value; };

// Declared before the listeners below so nothing can reference it too early.
const loop = new GameLoop(
  (dt) => {
    game.update(dt);
    ui.tick(dt);
  },
  () => {
    renderer.render(game, performance.now() / 1000);
  },
);

// --- Input ------------------------------------------------------------------

const input = new InputManager(stage, {
  move: (dx, dy) => game.requestMove(dx, dy),
  polarity: () => game.requestPolarity(),
  pause: () => game.togglePause(),
  restart: () => game.restartLevel(),
  tap: (clientX, clientY) => {
    const cell = renderer.screenToCell(clientX, clientY);
    game.requestTapCell(cell.col, cell.row);
  },
});
input.attach();

for (const btn of document.querySelectorAll('[data-move]')) {
  btn.addEventListener('click', () => {
    const [dx, dy] = btn.dataset.move.split(',').map(Number);
    game.requestMove(dx, dy);
  });
}

game.on('stateChange', (state) => {
  const active = state === GameState.PLAYING
    || state === GameState.PLAYER_MOVING
    || state === GameState.STARTING
    || state === GameState.UPLOADING
    || state === GameState.PLAYER_DYING;
  input.setEnabled(active);
  if (state === GameState.PLAYING || state === GameState.STARTING) loop.resetClock();
});

// Audio can only be created inside a user gesture, so unlock on the first one
// of any kind and then stop listening.
const unlockAudio = () => {
  game.audio.unlock();
  if (game.settings.music) game.audio.setMusicEnabled(true);
};
for (const type of ['pointerdown', 'keydown', 'touchstart']) {
  window.addEventListener(type, unlockAudio, { once: true, passive: true });
}

// --- Sizing -----------------------------------------------------------------

function resize() {
  const rect = stage.getBoundingClientRect();
  renderer.resize(rect.width, rect.height, game.level);
}

if ('ResizeObserver' in window) {
  new ResizeObserver(resize).observe(stage);
} else {
  window.addEventListener('resize', resize);
}
window.addEventListener('orientationchange', () => setTimeout(resize, 120));

// A level change alters the grid dimensions, so the cached board must go.
game.on('stateChange', (state) => {
  if (state === GameState.STARTING) {
    renderer.markDirty();
    resize();
  }
});

// --- Lifecycle --------------------------------------------------------------

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Auto-pause, never auto-resume: coming back to a running board you
    // cannot see is how you lose a run you were not playing.
    if (game.isSimulating) game.pause();
    game.audio.suspend();
  } else {
    game.audio.resume();
    loop.resetClock();
  }
});

window.addEventListener('blur', () => {
  if (game.isSimulating) game.pause();
});

window.addEventListener('pagehide', () => game.persist());
window.addEventListener('beforeunload', () => game.persist());

// --- Boot -------------------------------------------------------------------

resize();
game.setState(GameState.MENU);
ui.updateMenuSummary();
ui.showScreen('menu');
loop.start();

registerServiceWorker((activate) => ui.showUpdateBanner(activate));
setupInstallPrompt(ui);
