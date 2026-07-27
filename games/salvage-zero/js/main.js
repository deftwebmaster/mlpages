import { Game } from './game.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch((e) => console.warn('SW registration failed', e));
  });
}

const game = new Game();
game.boot();
