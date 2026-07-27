import { getState, setState } from '../state/game-store.js';
import { UPGRADE_CATEGORIES } from '../data/upgrades.js';
import { getOwnedUpgradeByCategory, getNextUpgradeForCategory, purchaseUpgrade, isUpgradeUnlocked } from '../systems/upgrade-system.js';
import { formatMoney } from '../utils/format.js';
import { confirmDialog } from '../components/confirm-dialog.js';
import { showToast } from '../components/toast.js';

const CATEGORY_LABELS = {
  stand: 'Stand', production: 'Production', cooling: 'Cooling', service: 'Service', business: 'Business', logistics: 'Logistics',
};
const CATEGORY_ICONS = {
  stand: '🏗️', production: '🧃', cooling: '🧊', service: '🛎️', business: '📋', logistics: '🚚',
};

export function renderUpgradesScreen(container, { navigate }) {
  const root = document.createElement('div');
  root.className = 'stack';
  container.appendChild(root);

  function rerender() {
    const state = getState();
    root.innerHTML = buildContent(state);
    root.querySelector('#back-btn').addEventListener('click', () => navigate('/business'));
    root.querySelectorAll('[data-buy-upgrade]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const upgrade = btn.dataset.buyUpgrade;
        const cost = Number(btn.dataset.cost);
        const confirmNeeded = state.settings.confirmExpensivePurchases && cost >= 100;
        if (confirmNeeded) {
          const ok = await confirmDialog({
            title: 'Confirm Purchase',
            message: `Buy this upgrade for ${formatMoney(cost)}?`,
            confirmLabel: 'Buy',
          });
          if (!ok) return;
        }
        const result = purchaseUpgrade(state, upgrade);
        setState(() => {});
        if (result.success) showToast('Upgrade purchased!', 'success');
        else showToast(result.reason === 'locked' ? 'Not unlocked yet.' : "Can't afford that yet.", 'error');
        rerender();
      });
    });
  }

  rerender();
  return () => { root.remove(); };
}

function buildContent(state) {
  return `
    <div class="row">
      <button class="icon-btn" id="back-btn" aria-label="Back">←</button>
      <div style="font-weight:800;font-size:1.2rem;">Upgrades</div>
    </div>
    ${UPGRADE_CATEGORIES.map((cat) => categorySection(state, cat)).join('')}
  `;
}

function categorySection(state, category) {
  const current = getOwnedUpgradeByCategory(state, category);
  const next = getNextUpgradeForCategory(state, category);
  const unlocked = next ? isUpgradeUnlocked(state, next) : true;
  const affordable = next ? state.finances.cash >= next.cost : true;

  return `
    <div class="card stack--tight">
      <div class="row"><span style="font-size:1.3rem;">${CATEGORY_ICONS[category]}</span><span class="section-title" style="margin:0;">${CATEGORY_LABELS[category]}</span></div>
      <div class="row row--between">
        <div>
          <div style="font-weight:700;">${current?.name || 'None'}</div>
          <div class="card__subtitle">Current tier</div>
        </div>
      </div>
      ${next ? `
      <div class="row row--between" style="border-top:1px solid var(--border-soft);padding-top:10px;">
        <div>
          <div style="font-weight:700;">${next.name}</div>
          <div class="card__subtitle">${next.description}</div>
          ${!unlocked ? `<div class="badge badge--warning" style="margin-top:4px;">Requires ${next.requirements.reputation} reputation</div>` : ''}
        </div>
        <button class="btn ${unlocked ? 'btn--primary' : 'btn--secondary'} btn--sm" data-buy-upgrade="${next.id}" data-cost="${next.cost}" ${!unlocked ? 'disabled' : ''}>
          ${unlocked ? formatMoney(next.cost, { whole: next.cost >= 100 }) : 'Locked'}
        </button>
      </div>` : `<div class="card__subtitle">Maxed out!</div>`}
    </div>
  `;
}
