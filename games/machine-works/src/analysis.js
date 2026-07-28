import { COLORS } from './constants.js';
import { MACHINE_STATES } from '../entities/machine.js';

// Pure overlay-color logic for Analysis Mode (Milestone 5) — kept separate
// from src/renderer.js so "what a color means" stays independent of "how
// a diamond gets drawn," matching the spec's module boundary.

// Spec Part 6 utilization thresholds: below 40% blue, above 95% orange,
// blocked machines red. The 40-95% middle band reads as healthy (green),
// mirroring the belt heatmap's "green = healthy flow" language.
export function machineUtilizationColor(ratio, state) {
  if (state === MACHINE_STATES.WAITING_FOR_OUTPUT || state === MACHINE_STATES.POWER_LOSS) {
    return COLORS.red;
  }
  if (ratio < 0.4) return COLORS.cyan; // "blue" tier — closest cool accent in the existing palette
  if (ratio > 0.95) return COLORS.orange;
  return COLORS.green;
}

// Spec Part 6 belt congestion heatmap: blue (low) -> green (healthy) ->
// yellow (busy) -> orange (near capacity) -> red (severe bottleneck).
export function beltCongestionColor(ratio) {
  if (ratio < 0.2) return COLORS.cyan;
  if (ratio < 0.5) return COLORS.green;
  if (ratio < 0.75) return COLORS.amber;
  if (ratio < 0.95) return COLORS.orange;
  return COLORS.red;
}
