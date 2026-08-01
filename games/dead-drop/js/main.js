import { Game } from './core/Game.js';
import { UI } from './ui/UI.js';
import { PWA } from './pwa/PWA.js';
import { Storage } from './storage/Storage.js';

function applyOsMotionPreferenceOnFirstRun() {
  const hasSave = localStorage.getItem('dead-drop-save-v1');
  if (!hasSave && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    Storage.updateSettings({ reducedMotion: true });
  }
}

async function boot() {
  applyOsMotionPreferenceOnFirstRun();

  const canvas = document.getElementById('board-canvas');
  const boardWrap = document.getElementById('board-wrap');
  const game = new Game(canvas, boardWrap);
  window.__DD_GAME__ = game;

  const pwa = new PWA();
  pwa.register();

  const ui = new UI(game, pwa);
  await ui.init();

  // Unlock audio context on first user gesture (browser autoplay policy).
  const unlockAudio = () => { game.audio.resume(); };
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });
}

boot();
