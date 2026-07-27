const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const currencyFormatterWhole = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('en-US');
const percentFormatter = new Intl.NumberFormat('en-US', { style: 'percent', maximumFractionDigits: 0 });

export function formatMoney(amount, { whole = false } = {}) {
  const value = Number.isFinite(amount) ? amount : 0;
  return whole ? currencyFormatterWhole.format(value) : currencyFormatter.format(value);
}

export function formatSignedMoney(amount) {
  const value = Number.isFinite(amount) ? amount : 0;
  const sign = value > 0 ? '+' : '';
  return `${sign}${formatMoney(value)}`;
}

export function formatNumber(value) {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatPercent(value) {
  return percentFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatHour(hour24) {
  const h = Math.floor(hour24);
  const m = Math.round((hour24 - h) * 60);
  const period = h >= 12 ? 'PM' : 'AM';
  let displayHour = h % 12;
  if (displayHour === 0) displayHour = 12;
  return `${displayHour}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDate(day) {
  const week = Math.floor((day - 1) / 7) + 1;
  return `Week ${week}, Day ${day}`;
}

export function clampText(text, max) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}
