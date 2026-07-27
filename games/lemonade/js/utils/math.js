export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * clamp(t, 0, 1);
}

export function inverseLerp(a, b, value) {
  if (a === b) return 0;
  return clamp((value - a) / (b - a), 0, 1);
}

// Triangular-ish falloff: 1 at target, decreasing toward 0 at target ± tolerance.
export function proximityScore(value, target, tolerance) {
  if (tolerance <= 0) return value === target ? 1 : 0;
  const distance = Math.abs(value - target);
  return clamp(1 - distance / tolerance, 0, 1);
}

export function roundTo(value, decimals = 2) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function sum(array, selector = (x) => x) {
  return array.reduce((total, item) => total + selector(item), 0);
}

export function average(array, selector = (x) => x) {
  if (!array.length) return 0;
  return sum(array, selector) / array.length;
}

export function weightedAverage(pairs) {
  // pairs: [[value, weight], ...]
  const totalWeight = sum(pairs, (p) => p[1]);
  if (totalWeight === 0) return 0;
  return sum(pairs, (p) => p[0] * p[1]) / totalWeight;
}
