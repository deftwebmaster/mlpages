export function statCardHtml({ label, value, tone = '' }) {
  return `
    <div class="stat-card">
      <div class="stat-card__label">${label}</div>
      <div class="stat-card__value ${tone}">${value}</div>
    </div>
  `;
}
