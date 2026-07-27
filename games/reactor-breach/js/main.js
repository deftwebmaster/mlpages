import { Game } from './game.js';

const canvas = document.getElementById('gameCanvas');
const game = new Game(canvas);
game.start();

if (window.location.protocol === 'file:') {
  console.warn('Reactor Breach: service workers require http(s) — offline caching is disabled under file://');
}
