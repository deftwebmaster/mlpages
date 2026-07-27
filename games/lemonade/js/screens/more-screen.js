import { getState } from '../state/game-store.js';
import {
  listSaveSlots, saveToSlot, loadFromSlot, deleteSlot, getActiveSlot, setActiveSlot,
  exportSaveAsJson, importSaveFromJson,
} from '../state/save-manager.js';
import { MILESTONES } from '../data/milestones.js';
import { GAME_TITLE, GAME_SUBTITLE } from '../utils/constants.js';
import { formatMoney, formatDate } from '../utils/format.js';
import { confirmDialog } from '../components/confirm-dialog.js';
import { showToast } from '../components/toast.js';

export function renderMoreScreen(container, { navigate }) {
  const root = document.createElement('div');
  root.className = 'stack';
  container.appendChild(root);

  async function rerender() {
    const state = getState();
    const slots = await listSaveSlots();
    root.innerHTML = buildContent(state, slots);
    wireEvents(state, slots);
  }

  function wireEvents(state, slots) {
    root.querySelector('#nav-achievements').addEventListener('click', () => navigate('/more/achievements'));
    root.querySelector('#nav-settings').addEventListener('click', () => navigate('/more/settings'));

    root.querySelector('#save-now')?.addEventListener('click', async () => {
      await saveToSlot(getActiveSlot(), getState());
      showToast('Game saved.', 'success');
      rerender();
    });

    root.querySelectorAll('[data-switch-slot]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const slot = Number(btn.dataset.switchSlot);
        if (slot === getActiveSlot()) return;
        const existing = slots.find((s) => s.slot === slot);
        const ok = await confirmDialog({
          title: existing?.empty ? 'Start New Save?' : 'Switch Save?',
          message: existing?.empty
            ? `Slot ${slot} is empty. Switching will start a brand-new game there.`
            : `Switch to slot ${slot}: ${existing.businessName} (Day ${existing.day})?`,
          confirmLabel: 'Switch',
        });
        if (!ok) return;
        setActiveSlot(slot);
        window.location.reload();
      });
    });

    root.querySelector('#export-save')?.addEventListener('click', () => {
      const json = exportSaveAsJson(getState());
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.meta.businessName.replace(/\s+/g, '-').toLowerCase()}-day${state.calendar.day}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast('Save exported.', 'success');
    });

    root.querySelector('#import-save')?.addEventListener('click', () => {
      root.querySelector('#import-file').click();
    });
    root.querySelector('#import-file')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = importSaveFromJson(text);
        const ok = await confirmDialog({
          title: 'Import Save?',
          message: `This will overwrite slot ${getActiveSlot()} with the imported save (${imported.meta?.businessName || 'Unknown'}, Day ${imported.calendar?.day || 1}).`,
          confirmLabel: 'Import',
          danger: true,
        });
        if (!ok) return;
        await saveToSlot(getActiveSlot(), imported);
        window.location.reload();
      } catch (err) {
        showToast(err.message || 'Could not import that file.', 'error');
      }
    });

    root.querySelector('#delete-save')?.addEventListener('click', async () => {
      const ok = await confirmDialog({
        title: 'Delete This Save?',
        message: 'This permanently deletes your progress in this slot. This cannot be undone.',
        confirmLabel: 'Delete',
        danger: true,
      });
      if (!ok) return;
      await deleteSlot(getActiveSlot());
      window.location.reload();
    });
  }

  rerender();
  return () => { root.remove(); };
}

function buildContent(state, slots) {
  const nextMilestone = MILESTONES.filter((m) => !state.milestones.completed.includes(m.id));

  return `
    <div class="section-title">More</div>
    <div class="stack--tight">
      <button class="card list-row" style="width:100%;text-align:left;" id="nav-achievements">
        <div class="list-row__icon">🏆</div>
        <div class="list-row__body"><div class="list-row__title">Achievements</div><div class="list-row__subtitle">${state.achievements.earned.length} earned</div></div>
      </button>
      <button class="card list-row" style="width:100%;text-align:left;" id="nav-settings">
        <div class="list-row__icon">⚙️</div>
        <div class="list-row__body"><div class="list-row__title">Settings</div><div class="list-row__subtitle">Sound, theme, tutorial & more</div></div>
      </button>
    </div>

    <div class="section-title">Milestones</div>
    <div class="card stack--tight">
      ${nextMilestone.length ? nextMilestone.slice(0, 3).map((m) => `
        <div class="row row--between"><span>${m.name}</span><span class="card__subtitle">${m.description}</span></div>
      `).join('') : '<div class="card__subtitle">All milestones complete!</div>'}
    </div>

    <div class="section-title">Statistics</div>
    <div class="grid-2">
      ${statTile('Business Value', formatMoney(state.stats.businessValue))}
      ${statTile('Customers Served', state.stats.totalCustomersServed)}
      ${statTile('Employees Hired', state.stats.employeesHired)}
      ${statTile('Locations Owned', state.stats.locationsOwned)}
    </div>

    <div class="section-title">Save Management</div>
    <div class="card stack--tight">
      <div class="card__subtitle">Slot ${getActiveSlot()} · Last day ${formatDate(state.calendar.day)}</div>
      <button class="btn btn--secondary btn--full" id="save-now">Save Now</button>
      <div class="grid-2">
        ${slots.map((s) => `
          <button class="chip" data-switch-slot="${s.slot}" aria-pressed="${s.slot === getActiveSlot()}" style="justify-content:center;">
            ${s.empty ? `Slot ${s.slot}: Empty` : `Slot ${s.slot}: ${s.businessName}`}
          </button>
        `).join('')}
      </div>
      <div class="grid-2">
        <button class="btn btn--secondary" id="export-save">Export Save</button>
        <button class="btn btn--secondary" id="import-save">Import Save</button>
      </div>
      <input type="file" id="import-file" accept="application/json" class="hidden" />
      <button class="btn btn--danger btn--full" id="delete-save">Delete This Save</button>
    </div>

    <div class="card" style="text-align:center;">
      <div style="font-weight:800;">${GAME_TITLE}</div>
      <div class="card__subtitle">${GAME_SUBTITLE}</div>
      <div class="card__subtitle" style="margin-top:8px;">Built as a static, offline-capable PWA.</div>
    </div>
  `;
}

function statTile(label, value) {
  return `<div class="stat-card"><div class="stat-card__label">${label}</div><div class="stat-card__value">${value}</div></div>`;
}
