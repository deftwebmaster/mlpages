/** Entry point: builds the systems, wires them together, and starts the loop. */

import { Renderer } from './renderer.js';
import { Input } from './input.js';
import { UI } from './ui.js';
import { Game, STATE } from './game.js';
import { Loop } from './loop.js';
import { initStorage } from './storage.js';
import * as store from './storage.js';
import { initAudio, unlockAudio } from './audio.js';
import { registerServiceWorker, setupInstall, promptInstall } from './pwa.js';

function boot() {
  initStorage();

  const canvas = document.getElementById('game-canvas');
  const stage = document.getElementById('stage');
  const renderer = new Renderer(canvas);

  let game; // referenced by the input hooks below

  const input = new Input(stage, {
    toWorldX: (clientX) => renderer.toWorldX(clientX),
    onPause: () => {
      if (!game) return;
      if (game.state === STATE.PLAYING || game.state === STATE.PAUSED || game.state === STATE.STARTING) {
        game.togglePause();
      }
    },
    onAnyInput: () => unlockAudio(),
  });

  const ui = new UI({
    start: () => {
      unlockAudio();
      game.start();
      loop.resync();
    },
    backToMenu: () => {
      if (game.state === STATE.PAUSED || game.state === STATE.PLAYING) game.quitToMenu();
      else game.toMenu();
    },
    togglePause: () => game.togglePause(),
    resume: () => {
      game.resume();
      loop.resync();
    },
    confirmRestart: () =>
      ui.confirm('Abandon this delivery and restart?', () => {
        game.start();
        loop.resync();
      }),
    confirmQuit: () => ui.confirm('Abandon this delivery and return to the menu?', () => game.quitToMenu()),
    setSetting: (k, v) => game.setSetting(k, v),
    replayTutorial: () => game.replayTutorial(),
  });

  game = new Game({ renderer, input, ui });
  input.attachPhaseButton(ui.el.phaseBtn);

  const loop = new Loop(game);

  /* Layout ------------------------------------------------------------ */

  const onResize = () => {
    // Lock the stage to the visual viewport so mobile browser chrome and the
    // on-screen keyboard cannot push the play area out of view.
    const vv = window.visualViewport;
    const h = vv ? vv.height : window.innerHeight;
    document.documentElement.style.setProperty('--app-height', `${Math.round(h)}px`);
    game.onResize();
  };
  window.addEventListener('resize', onResize);
  window.addEventListener('orientationchange', () => setTimeout(onResize, 120));
  if (window.visualViewport) window.visualViewport.addEventListener('resize', onResize);
  onResize();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) game.onVisibilityHidden();
    else loop.resync();
  });

  /* PWA --------------------------------------------------------------- */

  setupInstall((available) => ui.setInstallAvailable(available));
  ui.el.installBtn.addEventListener('click', async () => {
    const ok = await promptInstall();
    if (ok) ui.setInstallAvailable(false);
  });
  registerServiceWorker();

  /* Go ---------------------------------------------------------------- */

  initAudio();
  document.body.classList.remove('is-loading');
  ui.hideAll();
  game.toMenu();
  loop.start();

  // Keep the meters honest if the browser restores a cached page.
  window.addEventListener('pageshow', () => {
    ui.syncSettings();
    ui.refreshMenuStats();
    loop.resync();
  });

  if (store.get('reducedEffects')) document.body.classList.add('reduced-effects');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
