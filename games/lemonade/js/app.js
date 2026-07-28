import { initStore, getState, subscribe } from './state/game-store.js';
import { createDefaultState } from './state/default-state.js';
import { getActiveSlot, loadFromSlot, saveToSlot, scheduleAutosave } from './state/save-manager.js';
import { initRouter, registerRoute } from './router.js';
import { mountBottomNav } from './components/bottom-nav.js';
import { initToasts, showToast } from './components/toast.js';
import { initAudio } from './systems/audio-system.js';
import { formatMoney, formatDate, capitalize } from './utils/format.js';
import { getReputationTier } from './systems/progression-system.js';
import { ensureDayBriefing } from './systems/briefing-system.js';
import { WEATHER_TYPES } from './simulation/weather-model.js';
import { GAME_TITLE } from './utils/constants.js';

import { renderSplashScreen } from './screens/splash-screen.js';
import { renderNewGameScreen } from './screens/new-game-screen.js';
import { renderStandScreen } from './screens/stand-screen.js';
import { renderRecipeScreen } from './screens/recipe-screen.js';
import { renderLiveDayScreen } from './screens/live-day-screen.js';
import { renderResultsScreen } from './screens/results-screen.js';
import { renderSuppliesScreen } from './screens/supplies-screen.js';
import { renderBusinessScreen } from './screens/business-screen.js';
import { renderUpgradesScreen } from './screens/upgrades-screen.js';
import { renderStaffScreen } from './screens/staff-screen.js';
import { renderMarketingScreen } from './screens/marketing-screen.js';
import { renderLocationsScreen } from './screens/locations-screen.js';
import { renderFinancingScreen } from './screens/financing-screen.js';
import { renderWholesaleScreen } from './screens/wholesale-screen.js';
import { renderReportsScreen } from './screens/reports-screen.js';
import { renderMoreScreen } from './screens/more-screen.js';
import { renderAchievementsScreen } from './screens/achievements-screen.js';
import { renderSettingsScreen } from './screens/settings-screen.js';

const appRoot = document.getElementById('app');

document.addEventListener('DOMContentLoaded', boot);
if (document.readyState !== 'loading') boot();

async function boot() {
  initToasts();
  initAudio(() => getState()?.settings?.soundEnabled ?? true);
  registerServiceWorker();

  let loadedState = null;

  appRoot.innerHTML = '';
  const splash = renderSplashScreen(appRoot, {
    onContinue: () => {
      if (loadedState) {
        initStore(loadedState);
        startGameShell();
      } else {
        renderOnboarding();
      }
    },
  });

  try {
    loadedState = await loadFromSlot(getActiveSlot());
  } catch (err) {
    console.error('Failed to load save', err);
  }
  splash.markReady();
}

function renderOnboarding() {
  appRoot.innerHTML = '';
  renderNewGameScreen(appRoot, {
    onComplete: (config) => {
      const state = createDefaultState(config);
      initStore(state);
      saveToSlot(getActiveSlot(), state).catch((err) => console.error(err));
      startGameShell();
    },
  });
}

function startGameShell() {
  appRoot.innerHTML = `
    <div class="app-shell">
      <header class="top-bar" id="top-bar"></header>
      <main class="screen-container" id="screen-root"></main>
      <div id="nav-root"></div>
    </div>
  `;

  mountBottomNav(document.getElementById('nav-root'));
  applyTheme();
  renderTopBar();

  subscribe(() => {
    renderTopBar();
    applyTheme();
    scheduleAutosave(getState, getActiveSlot());
  });

  registerAllRoutes();
  initRouter(document.getElementById('screen-root'), '/stand');
}

function applyTheme() {
  const { theme } = getState().settings;
  const root = document.documentElement;
  if (theme === 'light' || theme === 'dark') root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
  document.body.dataset.reducedMotion = String(getState().settings.reducedMotion);
}

function renderTopBar() {
  const state = getState();
  ensureDayBriefing(state);
  const bar = document.getElementById('top-bar');
  if (!bar) return;
  const weather = WEATHER_TYPES[state.today.actualWeather.type] || WEATHER_TYPES.sunny;
  bar.innerHTML = `
    <div>
      <div style="font-weight:800;">${formatDate(state.calendar.day)}</div>
      <div style="font-size:0.75rem;color:var(--text-secondary);">${capitalize(state.calendar.season)} · ${getReputationTier(state.reputation.score)}</div>
    </div>
    <div class="row" style="gap:14px;">
      <span title="Weather" style="font-size:1.3rem;">${weather.icon}</span>
      <span style="font-weight:800;font-size:1.05rem;">${formatMoney(state.finances.cash)}</span>
    </div>
  `;
}

function registerAllRoutes() {
  registerRoute('/stand', renderStandScreen);
  registerRoute('/stand/recipe', renderRecipeScreen);
  registerRoute('/stand/live', renderLiveDayScreen);
  registerRoute('/stand/results', renderResultsScreen);
  registerRoute('/supplies', renderSuppliesScreen);
  registerRoute('/business', renderBusinessScreen);
  registerRoute('/business/upgrades', renderUpgradesScreen);
  registerRoute('/business/staff', renderStaffScreen);
  registerRoute('/business/marketing', renderMarketingScreen);
  registerRoute('/business/locations', renderLocationsScreen);
  registerRoute('/business/financing', renderFinancingScreen);
  registerRoute('/business/wholesale', renderWholesaleScreen);
  registerRoute('/reports', renderReportsScreen);
  registerRoute('/more', renderMoreScreen);
  registerRoute('/more/achievements', renderAchievementsScreen);
  registerRoute('/more/settings', renderSettingsScreen);
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            promptUpdate(registration);
          }
        });
      });
    }).catch((err) => console.error('Service worker registration failed', err));

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  });
}

function promptUpdate(registration) {
  const bar = document.createElement('div');
  bar.style.cssText = 'position:fixed;left:0;right:0;bottom:0;z-index:300;background:var(--color-navy,#2a3642);color:#fff;padding:12px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:14px;';
  bar.innerHTML = `<span>A new version of ${GAME_TITLE} is available.</span>`;
  const btn = document.createElement('button');
  btn.className = 'btn btn--primary btn--sm';
  btn.textContent = 'Update now';
  btn.addEventListener('click', () => {
    registration.waiting?.postMessage('SKIP_WAITING');
    bar.remove();
  });
  bar.appendChild(btn);
  document.body.appendChild(bar);
}

window.addEventListener('error', (e) => {
  console.error('Unhandled error', e.error || e.message);
});
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled rejection', e.reason);
});
