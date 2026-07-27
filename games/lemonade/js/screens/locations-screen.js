import { getState, setState } from '../state/game-store.js';
import { LOCATIONS, getLocation } from '../data/locations.js';
import { acquireLocation, setCurrentLocation, setManagementMode, getAvailableLocations } from '../systems/location-system.js';
import { formatMoney } from '../utils/format.js';
import { showToast } from '../components/toast.js';
import { confirmDialog } from '../components/confirm-dialog.js';

export function renderLocationsScreen(container, { navigate }) {
  const root = document.createElement('div');
  root.className = 'stack';
  container.appendChild(root);

  function rerender() {
    const state = getState();
    root.innerHTML = buildContent(state);
    root.querySelector('#back-btn').addEventListener('click', () => navigate('/business'));

    root.querySelectorAll('[data-select-loc]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setCurrentLocation(state, btn.dataset.selectLoc);
        setState(() => {});
        rerender();
      });
    });
    root.querySelectorAll('[data-mode]').forEach((select) => {
      select.addEventListener('change', () => {
        setManagementMode(state, select.dataset.mode, select.value);
        setState(() => {});
        rerender();
      });
    });
    root.querySelectorAll('[data-acquire]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const location = getLocation(btn.dataset.acquire);
        const ok = await confirmDialog({
          title: `Open ${location.name}?`,
          message: `This location charges ${formatMoney(location.dailyFee)}/day in fees whenever you operate there.`,
          confirmLabel: 'Open Location',
        });
        if (!ok) return;
        const result = acquireLocation(state, location.id);
        setState(() => {});
        if (result.success) showToast(`${location.name} is now open!`, 'success');
        rerender();
      });
    });
  }

  rerender();
  return () => { root.remove(); };
}

function buildContent(state) {
  const owned = state.locations.ownedIds.map((id) => getLocation(id));
  const available = getAvailableLocations(state);
  const locked = LOCATIONS.filter((loc) => !state.locations.ownedIds.includes(loc.id) && !available.includes(loc));

  return `
    <div class="row"><button class="icon-btn" id="back-btn" aria-label="Back">←</button><div style="font-weight:800;font-size:1.2rem;">Locations</div></div>

    <div class="section-title">Your Locations</div>
    <div class="stack--tight">
      ${owned.map((loc) => `
        <div class="card stack--tight">
          <div class="row row--between">
            <div>
              <div style="font-weight:700;">${loc.name} ${loc.id === state.locations.currentId ? '<span class="badge badge--success">Active</span>' : ''}</div>
              <div class="card__subtitle">${loc.tagline} · ${formatMoney(loc.dailyFee)}/day</div>
            </div>
            ${loc.id !== state.locations.currentId ? `<button class="btn btn--secondary btn--sm" data-select-loc="${loc.id}">Run Here</button>` : ''}
          </div>
          ${owned.length > 1 ? `
          <select data-mode="${loc.id}" style="width:100%;padding:10px;border-radius:10px;background:var(--bg-card-alt);">
            <option value="personal" ${state.locations.perLocation[loc.id]?.managementMode === 'personal' ? 'selected' : ''}>Personally managed</option>
            <option value="employee" ${state.locations.perLocation[loc.id]?.managementMode === 'employee' ? 'selected' : ''}>Employee managed</option>
            <option value="closed" ${state.locations.perLocation[loc.id]?.managementMode === 'closed' ? 'selected' : ''}>Temporarily closed</option>
          </select>` : ''}
        </div>
      `).join('')}
    </div>

    ${available.length ? `
    <div class="section-title" style="margin-top:12px;">Available to Open</div>
    <div class="stack--tight">
      ${available.map((loc) => `
        <div class="card row row--between">
          <div>
            <div style="font-weight:700;">${loc.name}</div>
            <div class="card__subtitle">${loc.tagline}</div>
            <div class="card__subtitle">${formatMoney(loc.dailyFee)}/day fee</div>
          </div>
          <button class="btn btn--primary btn--sm" data-acquire="${loc.id}">Open</button>
        </div>
      `).join('')}
    </div>` : ''}

    ${locked.length ? `
    <div class="section-title" style="margin-top:12px;">Locked</div>
    <div class="stack--tight">
      ${locked.map((loc) => `
        <div class="card" style="opacity:0.5;">
          <div style="font-weight:700;">🔒 ${loc.name}</div>
          <div class="card__subtitle">Requires ${loc.unlockRequirement.reputation} reputation & ${formatMoney(loc.unlockRequirement.cash, { whole: true })} cash</div>
        </div>
      `).join('')}
    </div>` : ''}
  `;
}
