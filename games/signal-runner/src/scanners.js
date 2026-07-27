/**
 * scanners.js — Timed scanning hazards.
 *
 * Scanners are the game's rhythm instrument: they are lethal on a fixed cycle
 * and always telegraph before they bite. Three patterns ship in the initial
 * release, all driven from lane time so they stay perfectly in sync across
 * pauses, tab switches and frame-rate changes.
 *
 *   sweep    — a beam that travels the lane, preceded by a warning fan.
 *   blink    — the whole lane charges, fires, then goes dark.
 *   segments — alternating columns activate in a checkerboard rhythm.
 *
 * A scanner may also alternate frequency between passes, in which case a
 * player on the matching frequency passes through it untouched.
 */

import { CONFIG, OPPOSITE_POLARITY } from './config.js';
import { mod } from './utils.js';
import { slotCount, slotX, objectSizeAt, hostileToFor } from './laneObjects.js';

function polarityForStep(lane, step) {
  const base = lane.polarity ?? null;
  if (!base) return null;
  if (!lane.alternatePolarity) return base;
  return mod(step, 2) === 0 ? base : OPPOSITE_POLARITY[base];
}

function emit(push, kind, x, w, polarity, lethal, state, intensity, index) {
  const shape = push();
  shape.kind = kind;
  shape.index = index;
  shape.x = x;
  shape.w = w;
  shape.polarity = polarity;
  shape.hostileTo = lethal ? hostileToFor(polarity) : 'none';
  shape.supportFor = 'none';
  shape.blocksFor = 'none';
  shape.state = state;
  shape.intensity = intensity;
  shape.direction = 1;
  return shape;
}

function buildSweep(lane, t, cols, push) {
  const n = slotCount(lane, cols);
  const dir = lane.direction ?? 1;
  const warnLength = lane.warnLength ?? 1.4;
  // One "pass" per full traversal of the wrap period; used for alternation.
  const period = (n * lane.spacing) / Math.max(lane.speed ?? 1, 0.001);

  for (let i = 0; i < n; i++) {
    const size = objectSizeAt(lane, i);
    const x = slotX(lane, i, t, cols);
    const step = Math.floor(t / period + i);
    const polarity = polarityForStep(lane, step);

    if (warnLength > 0) {
      // The warning fan sits ahead of the beam, showing the cells about to be
      // scanned. It is never lethal — it exists purely to be read.
      emit(
        push,
        'scannerWarn',
        dir > 0 ? x + size : x - warnLength,
        warnLength,
        polarity,
        false,
        'charging',
        0.5,
        200 + i,
      );
    }
    emit(push, 'scanner', x, size, polarity, true, 'active', 1, i).direction = dir;
  }
}

function buildBlink(lane, t, cols, push) {
  const cycle = lane.cycle ?? 2.6;
  const duty = lane.duty ?? 0.34;
  const warn = lane.warn ?? CONFIG.scanner.warnRatio * cycle * (1 - duty);
  const phase = mod(t / cycle + (lane.phase ?? 0), 1);
  const step = Math.floor(t / cycle + (lane.phase ?? 0));
  const onStart = 1 - duty;
  const warnStart = Math.max(0, onStart - warn / cycle);
  const polarity = polarityForStep(lane, step);

  const x = lane.from ?? 0;
  const w = (lane.to ?? cols) - x;

  if (phase >= onStart) {
    const through = (phase - onStart) / duty;
    emit(push, 'scanner', x, w, polarity, true, 'active', 1 - through * 0.35, 0);
  } else if (phase >= warnStart) {
    const charge = (phase - warnStart) / Math.max(onStart - warnStart, 1e-4);
    emit(push, 'scannerWarn', x, w, polarity, false, 'charging', charge, 0);
  } else {
    emit(push, 'scannerIdle', x, w, polarity, false, 'idle', 0, 0);
  }
}

function buildSegments(lane, t, cols, push) {
  const cycle = lane.cycle ?? 1.8;
  const duty = lane.duty ?? 0.55;
  const warn = lane.warn ?? CONFIG.scanner.warnRatio * cycle * (1 - duty);
  const phase = mod(t / cycle + (lane.phase ?? 0), 1);
  const step = Math.floor(t / cycle + (lane.phase ?? 0));
  const onStart = 1 - duty;
  const warnStart = Math.max(0, onStart - warn / cycle);
  const stride = lane.stride ?? 2;
  const from = lane.from ?? 0;
  const to = lane.to ?? cols;

  for (let col = from; col < to; col++) {
    // Which columns fire this step alternates, so the safe cells shuffle.
    const firesNow = mod(col + step, stride) === 0;
    const firesNext = mod(col + step + 1, stride) === 0;
    const polarity = polarityForStep(lane, step);

    if (firesNow && phase >= onStart) {
      emit(push, 'scanner', col, 1, polarity, true, 'active', 1, col);
    } else if (firesNext && phase >= warnStart && phase < onStart) {
      const charge = (phase - warnStart) / Math.max(onStart - warnStart, 1e-4);
      emit(push, 'scannerWarn', col, 1, polarityForStep(lane, step + 1), false, 'charging', charge, col);
    } else {
      emit(push, 'scannerIdle', col, 1, polarity, false, 'idle', 0, col);
    }
  }
}

export function buildScannerShapes(lane, t, cols, push) {
  switch (lane.pattern) {
    case 'blink':
      buildBlink(lane, t, cols, push);
      break;
    case 'segments':
      buildSegments(lane, t, cols, push);
      break;
    case 'sweep':
    default:
      buildSweep(lane, t, cols, push);
      break;
  }
}
