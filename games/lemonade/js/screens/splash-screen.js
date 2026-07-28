import { GAME_TITLE, GAME_SUBTITLE } from '../utils/constants.js';

/**
 * The very first thing a player sees on cold boot — before the new-game form
 * or the loaded save appears. Doubles as visual cover for the async IndexedDB
 * save lookup: the CTA stays disabled until `markReady()` is called, so there
 * is never an artificial delay, just a branded beat instead of a blank flash.
 *
 * Drop an image at assets/images/splash-hero.png to replace the built-in CSS
 * illustration with custom artwork — it's picked up automatically.
 */
export function renderSplashScreen(container, { onContinue }) {
  const root = document.createElement('div');
  root.className = 'splash-screen';
  root.innerHTML = `
    <div class="splash-screen__decor" aria-hidden="true">
      <span class="splash-slice s1">🍋</span>
      <span class="splash-slice s2">🍋</span>
      <span class="splash-slice s3">🍋</span>
      <span class="splash-bubble b1"></span>
      <span class="splash-bubble b2"></span>
      <span class="splash-bubble b3"></span>
    </div>

    <img class="splash-hero-image" alt="" />

    <div class="splash-screen__content">
      <div class="splash-screen__hero-fallback" aria-hidden="true">
        <div class="splash-sun"></div>
        <div class="splash-stand">🍋🧊🥤</div>
      </div>
      <div class="splash-screen__logo bounce-in" aria-hidden="true">🍋</div>
      <h1 class="splash-screen__title">${GAME_TITLE}</h1>
      <p class="splash-screen__subtitle">${GAME_SUBTITLE}</p>
      <p class="splash-screen__tagline">Start with a folding table and a few dollars.<br>Build an empire, one cup at a time.</p>
    </div>

    <button class="btn btn--primary btn--lg splash-screen__cta" id="splash-continue" disabled>
      <span class="splash-cta-label">Loading…</span>
    </button>
  `;
  container.appendChild(root);

  const img = root.querySelector('.splash-hero-image');
  img.addEventListener('load', () => root.classList.add('splash-screen--has-image'), { once: true });
  img.src = './assets/images/splash-hero.png';

  const button = root.querySelector('#splash-continue');
  const label = button.querySelector('.splash-cta-label');
  let ready = false;

  function markReady() {
    ready = true;
    button.disabled = false;
    label.textContent = "Let's Get Squeezing! →";
    button.classList.add('pulse');
  }

  function leave() {
    if (!ready) return;
    root.classList.add('splash-screen--exit');
    setTimeout(() => {
      root.remove();
      onContinue();
    }, 260);
  }

  button.addEventListener('click', leave);

  return { markReady };
}
