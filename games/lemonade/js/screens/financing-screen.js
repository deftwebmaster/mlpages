import { getState, setState } from '../state/game-store.js';
import { createLoan } from '../simulation/economy-model.js';
import { addCash } from '../systems/finance-system.js';
import { formatMoney } from '../utils/format.js';
import { confirmDialog } from '../components/confirm-dialog.js';
import { showToast } from '../components/toast.js';

const LOAN_OFFERS = [
  { label: 'Small Loan', principal: 200, annualRatePct: 10, termDays: 20, minReputation: 0 },
  { label: 'Medium Loan', principal: 800, annualRatePct: 12, termDays: 40, minReputation: 15 },
  { label: 'Large Loan', principal: 2500, annualRatePct: 15, termDays: 60, minReputation: 35 },
];

export function renderFinancingScreen(container, { navigate }) {
  const root = document.createElement('div');
  root.className = 'stack';
  container.appendChild(root);

  function rerender() {
    const state = getState();
    root.innerHTML = buildContent(state);
    root.querySelector('#back-btn').addEventListener('click', () => navigate('/business'));
    root.querySelectorAll('[data-borrow]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const offer = LOAN_OFFERS[Number(btn.dataset.borrow)];
        const ok = await confirmDialog({
          title: `Take the ${offer.label}?`,
          message: `Borrow ${formatMoney(offer.principal)} at ${offer.annualRatePct}% APR, repaid over ${offer.termDays} days (about ${formatMoney((offer.principal * (1 + offer.annualRatePct / 100 * offer.termDays / 365)) / offer.termDays)}/day).`,
          confirmLabel: 'Borrow',
        });
        if (!ok) return;
        setState((s) => {
          const loan = createLoan({ ...offer, startedDay: s.calendar.day });
          s.finances.loans.push(loan);
          addCash(s, offer.principal);
        });
        showToast(`Borrowed ${formatMoney(offer.principal)}.`, 'success');
        rerender();
      });
    });
  }

  rerender();
  return () => { root.remove(); };
}

function buildContent(state) {
  return `
    <div class="row"><button class="icon-btn" id="back-btn" aria-label="Back">←</button><div style="font-weight:800;font-size:1.2rem;">Financing</div></div>

    ${state.finances.loans.length ? `
    <div class="stack--tight">
      <div class="section-title">Active Loans</div>
      ${state.finances.loans.map((loan) => `
        <div class="card">
          <div class="row row--between">
            <div style="font-weight:700;">${formatMoney(loan.remainingPrincipal)} remaining</div>
            <span class="card__subtitle">${loan.daysRemaining} days left</span>
          </div>
          <div class="card__subtitle">${formatMoney(loan.dailyPayment)}/day at ${loan.annualRatePct}% APR</div>
        </div>
      `).join('')}
    </div>` : ''}

    <div class="stack--tight">
      <div class="section-title">Loan Offers</div>
      ${LOAN_OFFERS.map((offer, i) => {
        const eligible = state.reputation.score >= offer.minReputation;
        return `
        <div class="card row row--between" style="${eligible ? '' : 'opacity:0.5;'}">
          <div>
            <div style="font-weight:700;">${offer.label}</div>
            <div class="card__subtitle">${formatMoney(offer.principal)} · ${offer.annualRatePct}% APR · ${offer.termDays} days</div>
            ${!eligible ? `<div class="badge badge--warning" style="margin-top:4px;">Requires ${offer.minReputation} reputation</div>` : ''}
          </div>
          <button class="btn btn--primary btn--sm" data-borrow="${i}" ${eligible ? '' : 'disabled'}>Borrow</button>
        </div>
      `;
      }).join('')}
    </div>
  `;
}
