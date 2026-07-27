import { getState, setState } from '../state/game-store.js';
import { simulateTick, applyEventEffectsToSession, getSessionProgress } from '../simulation/day-simulator.js';
import { finalizeDay, prepareAdditionalBatch } from '../systems/day-cycle-system.js';
import { rollDailyEvent, applyEventChoice } from '../simulation/event-model.js';
import { getOwnedUpgradeByCategory } from '../systems/upgrade-system.js';
import { maxCupsFromInventory } from '../systems/inventory-system.js';
import { perCupIngredients } from '../systems/recipe-system.js';
import { createRng } from '../utils/random.js';
import { formatHour, formatMoney } from '../utils/format.js';
import { clamp } from '../utils/math.js';
import { progressBarHtml } from '../components/progress-bar.js';
import { openSheet } from '../components/bottom-sheet.js';
import { openModal } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { WEATHER_TYPES } from '../simulation/weather-model.js';
import { MS_PER_TICK_BASE } from '../utils/constants.js';

const SPEEDS = [0, 1, 2, 4];

export function renderLiveDayScreen(container, { navigate }) {
  const state = getState();
  const session = state.liveDay;

  if (!session) {
    navigate('/stand');
    return () => {};
  }

  let speed = state.settings.defaultSimSpeed || 1;
  let intervalId = null;
  let eventResolvedForRun = false;
  let stopped = false;

  const eventRng = createRng((state.meta.rngSeed + session.day * 104729 + 55) >>> 0);
  if (!session.pendingEvent) {
    const hasElectric = (getOwnedUpgradeByCategory(state, 'production')?.tier ?? 0) >= 3;
    const event = rollDailyEvent(eventRng, {
      day: session.day,
      hasEmployees: state.employees.length > 0,
      hasCompetitors: session.activeCompetitors.length > 0,
      hasElectricEquipment: hasElectric,
    });
    session.pendingEvent = event ? { event, tick: Math.floor(eventRng() * (session.ticksPerDay - 5)) + 3, resolved: false } : null;
  }

  const root = document.createElement('div');
  root.className = 'stack';
  container.appendChild(root);
  root.innerHTML = buildShell();
  wireStaticControls();
  renderDynamic();
  setSpeed(speed);

  function buildShell() {
    const weatherInfo = WEATHER_TYPES[session.weather.type] || WEATHER_TYPES.sunny;
    return `
      <div class="live-scene" id="scene">
        <div class="live-scene__clock" id="clock">${formatHour(session.hours[0])}</div>
        <div style="position:absolute;top:12px;right:12px;font-size:1.6rem;">${weatherInfo.icon} ${session.weather.temperature}°F</div>
        <div class="live-scene__customers" id="customer-layer"></div>
        <div class="live-scene__stand" id="stand-emoji">🍋🪑</div>
      </div>

      <div id="progress-holder">${progressBarHtml(0)}</div>

      <div class="live-stat-row" id="stat-row"></div>

      <div class="speed-controls" id="speed-controls">
        ${['⏸', '1×', '2×', '4×'].map((label, i) => `<button class="chip" data-speed="${SPEEDS[i]}" aria-pressed="${SPEEDS[i] === speed}">${label}</button>`).join('')}
        <button class="chip" id="actions-btn">⚙️ Actions</button>
      </div>

      <div class="card">
        <div class="section-title">Live Feed</div>
        <div class="live-feed" id="live-feed"></div>
      </div>
    `;
  }

  function wireStaticControls() {
    root.querySelectorAll('[data-speed]').forEach((btn) => {
      btn.addEventListener('click', () => setSpeed(Number(btn.dataset.speed)));
    });
    root.querySelector('#actions-btn').addEventListener('click', openActionsSheet);
  }

  function setSpeed(newSpeed) {
    speed = newSpeed;
    root.querySelectorAll('[data-speed]').forEach((btn) => {
      btn.setAttribute('aria-pressed', String(Number(btn.dataset.speed) === speed));
    });
    if (intervalId) clearInterval(intervalId);
    if (speed > 0 && !stopped) {
      intervalId = setInterval(tick, MS_PER_TICK_BASE / speed);
    }
  }

  function tick() {
    if (stopped) return;

    if (session.pendingEvent && !session.pendingEvent.resolved && session.tickIndex >= session.pendingEvent.tick) {
      session.pendingEvent.resolved = true;
      clearInterval(intervalId);
      showEventModal(session.pendingEvent.event);
      return;
    }

    const result = simulateTick(session);
    renderDynamic(result);

    if (result.ended) {
      clearInterval(intervalId);
      stopped = true;
      finishDay();
    }
  }

  function showEventModal(event) {
    openModal({
      title: event.title,
      content: '<p>What do you do?</p>',
      dismissible: false,
      actions: event.choices.map((choice) => ({
        label: choice.label,
        variant: 'secondary',
        onClick: () => {
          applyEventEffectsToSession(session, choice);
          showToast(choice.outcome, 'info');
          setSpeed(speed || 1);
        },
      })),
    });
  }

  function finishDay() {
    setState((s) => {
      const report = finalizeDay(s, session);
      s.lastDayReport = report;
      s.liveDay = null;
    });
    navigate('/stand/results');
  }

  function renderDynamic(result) {
    root.querySelector('#clock').textContent = formatHour(Math.min(session.hours[0] + session.tickIndex * 0.25, session.hours[1]));
    const progressWrap = root.querySelector('#progress-holder');
    progressWrap.innerHTML = progressBarHtml(getSessionProgress(session));

    root.querySelector('#stat-row').innerHTML = [
      statTile('Cash Today', formatMoney(session.totals.revenue)),
      statTile('Cups Left', String(session.cupsAvailable)),
      statTile('Served', String(session.totals.customersServed)),
    ].join('');

    const feed = root.querySelector('#live-feed');
    feed.innerHTML = session.feed.slice(-12).map((f) => `<div class="live-feed__item">${f.text}</div>`).join('') || '<div class="live-feed__item">Waiting for customers…</div>';

    if (result?.arrivals) spawnCustomerAvatar(result);
  }

  function spawnCustomerAvatar(result) {
    const layer = root.querySelector('#customer-layer');
    if (!layer) return;
    const avatar = document.createElement('div');
    avatar.className = 'customer-avatar walk-in';
    avatar.textContent = result.tickEvents?.some((e) => e.type.startsWith('purchased')) ? '🧍‍♂️🥤' : '🧍';
    avatar.style.left = `${10 + Math.random() * 70}%`;
    layer.appendChild(avatar);
    setTimeout(() => avatar.remove(), 1800);
  }

  function statTile(label, value) {
    return `<div class="stat-card"><div class="stat-card__label">${label}</div><div class="stat-card__value">${value}</div></div>`;
  }

  function openActionsSheet() {
    openSheet({
      title: 'Live Decisions',
      render: (body, close) => {
        body.innerHTML = `
          <div class="stack">
            <button class="btn btn--secondary btn--full" id="act-raise">Raise price by $0.25 (now ${formatMoney(session.price)})</button>
            <button class="btn btn--secondary btn--full" id="act-lower">Lower price by $0.25</button>
            <button class="btn btn--accent btn--full" id="act-flash">🔥 Flash Sale (−20% for rest of day)</button>
            <button class="btn btn--secondary btn--full" id="act-prep">🧃 Prepare Another Batch</button>
            <button class="btn btn--secondary btn--full" id="act-extend">⏰ Stay Open Later (+1 hour)</button>
            <button class="btn btn--danger btn--full" id="act-close">🚪 Close Early</button>
          </div>
        `;
        body.querySelector('#act-raise').addEventListener('click', () => {
          session.price = Math.round((session.price + 0.25) * 100) / 100;
          showToast(`Price raised to ${formatMoney(session.price)}`, 'info');
          close();
        });
        body.querySelector('#act-lower').addEventListener('click', () => {
          session.price = Math.max(0.25, Math.round((session.price - 0.25) * 100) / 100);
          showToast(`Price lowered to ${formatMoney(session.price)}`, 'info');
          close();
        });
        body.querySelector('#act-flash').addEventListener('click', () => {
          session.price = Math.max(0.25, Math.round(session.price * 0.8 * 100) / 100);
          session.dayModifier *= 1.1;
          showToast('Flash sale started! Word will spread fast.', 'success');
          close();
        });
        body.querySelector('#act-prep').addEventListener('click', () => {
          close();
          openPrepSheet();
        });
        body.querySelector('#act-extend').addEventListener('click', () => {
          session.ticksPerDay += 4;
          showToast('Staying open an extra hour today.', 'info');
          close();
        });
        body.querySelector('#act-close').addEventListener('click', () => {
          session.closeEarly = session.hours[0] + session.tickIndex * 0.25;
          showToast('Closing up early today.', 'info');
          close();
        });
      },
    });
  }

  function openPrepSheet() {
    const state2 = getState();
    const perCup = perCupIngredients(session.menuItem.id, session.recipe);
    const maxCups = maxCupsFromInventory(state2, perCup);
    let qty = Math.min(20, maxCups);
    openSheet({
      title: 'Prepare Another Batch',
      render: (body, close) => {
        function refresh() {
          body.innerHTML = `
            <div class="stepper">
              <button class="stepper__btn" id="q-minus">−</button>
              <div class="stepper__value">${qty} cups</div>
              <button class="stepper__btn" id="q-plus">+</button>
            </div>
            <div class="card__subtitle" style="text-align:center;margin-bottom:12px;">Max from current inventory: ${maxCups}</div>
            <button class="btn btn--primary btn--full" id="confirm-prep" ${qty <= 0 ? 'disabled' : ''}>Prepare ${qty} Cups</button>
          `;
          body.querySelector('#q-minus').addEventListener('click', () => { qty = Math.max(0, qty - 5); refresh(); });
          body.querySelector('#q-plus').addEventListener('click', () => { qty = Math.min(maxCups, qty + 5); refresh(); });
          body.querySelector('#confirm-prep')?.addEventListener('click', () => {
            setState((s) => {
              const result = prepareAdditionalBatch(s, session, qty);
              if (result.success) {
                session.cupsAvailable += result.cupsAdded;
                session.cupsPreparedTotal += result.cupsAdded;
              }
            });
            showToast(`Prepared ${qty} more cups.`, 'success');
            close();
          });
        }
        refresh();
      },
    });
  }

  return () => {
    stopped = true;
    if (intervalId) clearInterval(intervalId);
    root.remove();
  };
}
