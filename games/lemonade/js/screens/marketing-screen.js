import { getState, setState } from '../state/game-store.js';
import { getAvailableCampaigns, launchCampaign } from '../systems/marketing-system.js';
import { getCampaign } from '../data/marketing.js';
import { formatMoney } from '../utils/format.js';
import { progressBarHtml } from '../components/progress-bar.js';
import { showToast } from '../components/toast.js';
import { confirmDialog } from '../components/confirm-dialog.js';

export function renderMarketingScreen(container, { navigate }) {
  const root = document.createElement('div');
  root.className = 'stack';
  container.appendChild(root);

  function rerender() {
    const state = getState();
    root.innerHTML = buildContent(state);
    root.querySelector('#back-btn').addEventListener('click', () => navigate('/business'));
    root.querySelectorAll('[data-launch]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const campaign = getCampaign(btn.dataset.launch);
        const ok = await confirmDialog({
          title: 'Launch Campaign?',
          message: `${campaign.name} costs ${formatMoney(campaign.cost)} and runs ${campaign.durationDays} day(s).`,
          confirmLabel: 'Launch',
        });
        if (!ok) return;
        const result = launchCampaign(state, campaign.id);
        setState(() => {});
        if (result.success) showToast(`${campaign.name} is live!`, 'success');
        else showToast("Can't afford that campaign yet.", 'error');
        rerender();
      });
    });
  }

  rerender();
  return () => { root.remove(); };
}

function buildContent(state) {
  const available = getAvailableCampaigns(state);
  return `
    <div class="row"><button class="icon-btn" id="back-btn" aria-label="Back">←</button><div style="font-weight:800;font-size:1.2rem;">Marketing</div></div>

    <div class="card">
      <div class="row row--between" style="margin-bottom:6px;">
        <span class="section-title" style="margin:0;">Brand Awareness</span>
        <span class="card__subtitle">${Math.round(state.reputation.brandAwareness)}/100</span>
      </div>
      ${progressBarHtml(state.reputation.brandAwareness / 100)}
    </div>

    ${state.marketing.activeCampaigns.length ? `
    <div class="stack--tight">
      <div class="section-title">Active Campaigns</div>
      ${state.marketing.activeCampaigns.map((active) => {
        const c = getCampaign(active.id);
        return `<div class="card row row--between">
          <div>
            <div style="font-weight:700;">${c.name}</div>
            <div class="card__subtitle">${active.daysRemaining} day(s) remaining${active.flopped ? ' · underperforming' : ''}</div>
          </div>
        </div>`;
      }).join('')}
    </div>` : ''}

    <div class="stack--tight">
      <div class="section-title">Available Campaigns</div>
      ${available.length ? available.map((c) => `
        <div class="card row row--between">
          <div>
            <div style="font-weight:700;">${c.name}</div>
            <div class="card__subtitle">${c.description}</div>
            <div class="card__subtitle">${c.durationDays} day(s) · Reach ${Math.round(c.reach * 100)}%</div>
          </div>
          <button class="btn btn--primary btn--sm" data-launch="${c.id}">${formatMoney(c.cost)}</button>
        </div>
      `).join('') : '<div class="empty-state card__subtitle">No new campaigns available right now.</div>'}
    </div>
  `;
}
