import { getState } from '../state/game-store.js';
import { isFeatureUnlocked } from '../systems/progression-system.js';
import { getMilestone } from '../data/milestones.js';

export function renderBusinessScreen(container, { navigate }) {
  const root = document.createElement('div');
  root.className = 'stack';
  const state = getState();

  const cards = [
    { id: 'upgrades', icon: '🛠️', title: 'Upgrades', subtitle: 'Stand, production, cooling, service & more', feature: 'upgrades', path: '/business/upgrades' },
    { id: 'staff', icon: '🧑‍🍳', title: 'Staff', subtitle: 'Hire, schedule, and train your team', feature: 'employees', path: '/business/staff' },
    { id: 'marketing', icon: '📣', title: 'Marketing', subtitle: 'Run campaigns to grow brand awareness', feature: 'marketing', path: '/business/marketing' },
    { id: 'locations', icon: '📍', title: 'Locations', subtitle: 'Expand where you sell', feature: 'core', path: '/business/locations' },
    { id: 'financing', icon: '🏦', title: 'Financing', subtitle: 'Loans to fuel growth', feature: 'core', path: '/business/financing' },
    { id: 'wholesale', icon: '🏭', title: 'Wholesale', subtitle: 'Bottle lemonade and fulfill contracts', feature: 'bottling', path: '/business/wholesale' },
  ];

  root.innerHTML = `
    <div class="section-title">Business</div>
    <div class="stack">
      ${cards.map((c) => {
        const unlocked = isFeatureUnlocked(state, c.feature);
        return `
        <button class="card list-row" style="width:100%;text-align:left;${unlocked ? '' : 'opacity:0.5;'}" data-path="${c.path}" ${unlocked ? '' : 'disabled'}>
          <div class="list-row__icon" style="font-size:1.6rem;">${unlocked ? c.icon : '🔒'}</div>
          <div class="list-row__body">
            <div class="list-row__title">${c.title}</div>
            <div class="list-row__subtitle">${unlocked ? c.subtitle : lockedReason(c.feature)}</div>
          </div>
        </button>
      `;
      }).join('')}
    </div>
  `;

  root.querySelectorAll('[data-path]:not([disabled])').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.path));
  });

  container.appendChild(root);
  return () => root.remove();
}

function lockedReason(feature) {
  const milestone = getMilestoneMap()[feature];
  return milestone ? `Unlocks: ${milestone.description}` : 'Not yet available';
}

function getMilestoneMap() {
  return {
    marketing: getMilestone('milestone-marketing'),
    upgrades: getMilestone('milestone-upgrades'),
    employees: getMilestone('milestone-employees'),
    bottling: getMilestone('milestone-bottling'),
  };
}
