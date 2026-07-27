export function isPositiveNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function isNonNegativeNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

export function isValidPrice(price) {
  return isPositiveNumber(price) && price <= 50;
}

export function isValidQuantity(qty, max = 100000) {
  return Number.isInteger(qty) && qty >= 0 && qty <= max;
}

export function assert(condition, message) {
  if (!condition) {
    throw new Error(`Validation failed: ${message}`);
  }
}

export function sanitizeName(name, fallback = 'Player') {
  if (typeof name !== 'string') return fallback;
  const trimmed = name.trim().slice(0, 30);
  return trimmed.length ? trimmed : fallback;
}
