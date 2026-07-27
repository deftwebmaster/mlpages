import { getState, setState } from '../state/game-store.js';
import {
  generateApplicants, hireEmployee, fireEmployee, assignShift, getRole,
} from '../systems/employee-system.js';
import { EMPLOYEE_TRAITS } from '../data/employees.js';
import { createRng, makeSeed } from '../utils/random.js';
import { formatMoney } from '../utils/format.js';
import { openSheet } from '../components/bottom-sheet.js';
import { confirmDialog } from '../components/confirm-dialog.js';
import { showToast } from '../components/toast.js';

const SHIFTS = [
  { id: 'closed', label: 'Off' },
  { id: 'morning', label: 'AM' },
  { id: 'afternoon', label: 'PM' },
  { id: 'full', label: 'Full' },
];

export function renderStaffScreen(container, { navigate }) {
  const root = document.createElement('div');
  root.className = 'stack';
  container.appendChild(root);

  function rerender() {
    const state = getState();
    root.innerHTML = buildContent(state);
    root.querySelector('#back-btn').addEventListener('click', () => navigate('/business'));
    root.querySelector('#hire-btn')?.addEventListener('click', () => openHireSheet(state, rerender));

    root.querySelectorAll('[data-shift-emp]').forEach((select) => {
      select.addEventListener('change', () => {
        assignShift(state, select.dataset.shiftEmp, select.value);
        setState(() => {});
        rerender();
      });
    });
    root.querySelectorAll('[data-fire]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const ok = await confirmDialog({ title: 'Let go?', message: 'This employee will be released immediately.', confirmLabel: 'Fire', danger: true });
        if (!ok) return;
        fireEmployee(state, btn.dataset.fire);
        setState(() => {});
        showToast('Employee let go.', 'info');
        rerender();
      });
    });
  }

  rerender();
  return () => { root.remove(); };
}

function buildContent(state) {
  const dailyCost = state.employees.reduce((sum, e) => sum + e.wage * ({ closed: 0, morning: 0.5, afternoon: 0.5, full: 1 }[e.shift] || 0), 0);
  return `
    <div class="row row--between">
      <div class="row"><button class="icon-btn" id="back-btn" aria-label="Back">←</button><div style="font-weight:800;font-size:1.2rem;">Staff</div></div>
      <button class="btn btn--primary btn--sm" id="hire-btn">+ Hire</button>
    </div>

    <div class="card row row--between">
      <span class="card__subtitle">Today's scheduled wages</span>
      <span style="font-weight:800;">${formatMoney(dailyCost)}</span>
    </div>

    <div class="stack--tight">
      ${state.employees.length ? state.employees.map(employeeRow).join('') : `<div class="empty-state"><div class="icon">🧑‍🍳</div><p>No employees yet. Hire your first team member!</p></div>`}
    </div>
  `;
}

function employeeRow(e) {
  const role = getRole(e.roleId);
  const trait = EMPLOYEE_TRAITS.find((t) => t.id === e.trait);
  return `
    <div class="card stack--tight">
      <div class="row row--between">
        <div>
          <div style="font-weight:700;">${e.name} · ${role?.name}</div>
          <div class="card__subtitle">${formatMoney(e.wage)}/shift ${trait ? `· ${trait.label}` : ''}</div>
        </div>
        <button class="icon-btn" data-fire="${e.id}" aria-label="Fire">✕</button>
      </div>
      <div class="row row--between">
        <span class="card__subtitle">Morale ${Math.round(e.morale * 100)}% · Exp ${Math.round(e.experience)}</span>
      </div>
      <select data-shift-emp="${e.id}" style="width:100%;padding:10px;border-radius:10px;background:var(--bg-card-alt);">
        ${SHIFTS.map((s) => `<option value="${s.id}" ${s.id === e.shift ? 'selected' : ''}>${s.label}</option>`).join('')}
      </select>
    </div>
  `;
}

function openHireSheet(state, rerender) {
  const rng = createRng(makeSeed());
  const applicants = generateApplicants(rng, state, 3);
  openSheet({
    title: 'Applicants',
    render: (body, close) => {
      if (!applicants.length) {
        body.innerHTML = '<div class="empty-state card__subtitle">No roles available to hire yet.</div>';
        return;
      }
      body.innerHTML = applicants.map((a) => {
        const role = getRole(a.roleId);
        const trait = EMPLOYEE_TRAITS.find((t) => t.id === a.trait);
        return `
        <div class="card stack--tight" style="margin-bottom:10px;">
          <div class="row row--between">
            <div>
              <div style="font-weight:700;">${a.name} · ${role?.name}</div>
              <div class="card__subtitle">${formatMoney(a.wage)}/shift ${trait ? `· ${trait.label}` : ''}</div>
            </div>
            <button class="btn btn--primary btn--sm" data-hire="${a.id}">Hire</button>
          </div>
        </div>
      `;
      }).join('');
      body.querySelectorAll('[data-hire]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const applicant = applicants.find((a) => a.id === btn.dataset.hire);
          hireEmployee(state, applicant);
          setState(() => {});
          showToast(`${applicant.name} joined the team!`, 'success');
          close();
          rerender();
        });
      });
    },
  });
}
