import { formatMoney, formatSignedMoney } from '../utils/format.js';

export function currencyHtml(amount, { whole = false, signed = false, className = '' } = {}) {
  const text = signed ? formatSignedMoney(amount) : formatMoney(amount, { whole });
  const tone = amount > 0 ? 'positive' : amount < 0 ? 'negative' : '';
  return `<span class="${className} ${signed ? tone : ''}">${text}</span>`;
}
