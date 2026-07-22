import { esc, titleCase } from "./dom.js";

/**
 * Metrics where a high score is bad news for the people living there. They get
 * the danger ramp so a wall of bars reads at a glance instead of requiring the
 * reader to remember which way each axis points.
 */
const INVERTED_METRICS = new Set([
  "inequality",
  "environmentalrisk",
  "volatility",
  "secrecy",
  "civilianrisk",
  "institutionalrisk",
  "escalationrisk",
  "intensity",
  "corruption",
  "unrest",
  "casualtyrisk",
  "failurerisk",
  "vulnerability",
  "obsolescencerisk",
  "risk"
]);

/**
 * Metrics counted as risk read "worse as they climb"; the rest read "better".
 * Keys arrive in several shapes across modules (`environmentalRisk`,
 * `"Public Approval"`, `civilian_risk`), so compare on a flattened form.
 */
export function metricPolarity(key) {
  const normalized = String(key).toLowerCase().replace(/[^a-z]/g, "");
  return INVERTED_METRICS.has(normalized) ? "risk" : "benefit";
}

function bandFor(key, value) {
  const effective = metricPolarity(key) === "risk" ? 100 - value : value;
  if (effective >= 67) return "high";
  if (effective >= 34) return "mid";
  return "low";
}

export function metricLabel(key) {
  return titleCase(String(key).replace(/([A-Z])/g, " $1").replace(/[-_]+/g, " ").trim());
}

/**
 * Renders 0-100 stats as labelled meters. Every module with a `metrics` object
 * uses this so a settlement, a character, and a conflict all read the same way.
 *
 * @param {Record<string, number>} stats
 * @param {{ columns?: number, compact?: boolean }} [options]
 */
export function renderMetricBars(stats, options = {}) {
  const entries = Object.entries(stats || {}).filter(([, value]) => Number.isFinite(Number(value)));
  if (!entries.length) return "";
  const { columns = 1, compact = false } = options;
  const rows = entries.map(([key, rawValue]) => {
    const value = Math.max(0, Math.min(100, Math.round(Number(rawValue))));
    const band = bandFor(key, value);
    const polarity = metricPolarity(key);
    return `
      <div class="bar-row" data-band="${band}" data-polarity="${polarity}">
        <span class="bar-label">${esc(metricLabel(key))}</span>
        <span class="bar-track" role="img" aria-label="${esc(metricLabel(key))}: ${value} out of 100, ${polarity === "risk" ? "lower is better" : "higher is better"}">
          <span class="bar-fill" style="width:${value}%"></span>
        </span>
        <span class="bar-value">${value}</span>
      </div>`;
  });
  return `<div class="stat-bars${compact ? " stat-bars-compact" : ""}"${columns > 1 ? ` style="--metric-columns:${columns}"` : ""}>${rows.join("")}</div>`;
}
