/**
 * gates.js — Encryption gates.
 *
 * A gate occupies a single cell and cycles deterministically. Gates are the
 * one hazard that primarily *blocks* rather than kills: you cannot step into a
 * closed gate at all. Standing in a gate cell when it slams shut is fatal,
 * which is what makes a gate row a timing problem rather than a wall.
 *
 * Three cycle modes:
 *   toggle   — open, then closed, on a fixed duty cycle.
 *   polarity — alternates between cyan-only and violet-only.
 *   static   — permanently keyed to one frequency.
 */

import { CONFIG, OPPOSITE_POLARITY } from './config.js';
import { mod } from './utils.js';
import { hostileToFor } from './laneObjects.js';

function gateCells(lane) {
  if (Array.isArray(lane.cells)) return lane.cells;
  return [];
}

export function buildGateShapes(lane, t, cols, push) {
  const cells = gateCells(lane);
  const cycle = lane.cycle ?? 2.4;
  const duty = lane.duty ?? 0.5;
  const phaseStep = lane.phaseStep ?? 0;
  const warn = lane.warn ?? CONFIG.scanner.warnRatio * cycle * duty;
  const mode = lane.mode ?? 'toggle';
  const base = lane.polarity ?? 'cyan';

  for (let i = 0; i < cells.length; i++) {
    const entry = cells[i];
    const col = typeof entry === 'number' ? entry : entry.col;
    const localPhase = (typeof entry === 'object' && entry.phase != null)
      ? entry.phase
      : (lane.phase ?? 0) + i * phaseStep;

    // A cell may override the lane frequency, so a single row can offer a
    // cyan door and a violet door side by side.
    const cellBase = (typeof entry === 'object' && entry.polarity) || base;

    const phase = mod(t / cycle + localPhase, 1);
    const step = Math.floor(t / cycle + localPhase);

    const shape = push();
    shape.kind = 'gate';
    shape.index = col;
    shape.x = col;
    shape.w = 1;
    shape.supportFor = 'none';
    shape.direction = 1;
    shape.intensity = phase;

    if (mode === 'static') {
      shape.polarity = cellBase;
      shape.blocksFor = hostileToFor(cellBase);
      shape.hostileTo = shape.blocksFor;
      shape.state = 'keyed';
      continue;
    }

    if (mode === 'polarity') {
      const polarity = mod(step, 2) === 0 ? cellBase : OPPOSITE_POLARITY[cellBase];
      shape.polarity = polarity;
      shape.blocksFor = hostileToFor(polarity);
      shape.hostileTo = shape.blocksFor;
      // Flag the last slice of the cycle so a player mid-cell can see the
      // frequency about to flip and switch in time.
      shape.state = phase > 1 - warn / cycle ? 'switching' : 'keyed';
      continue;
    }

    // toggle
    const closed = phase < duty;
    shape.polarity = lane.polarity ?? null;
    if (closed) {
      shape.blocksFor = 'both';
      shape.hostileTo = 'both';
      shape.state = 'closed';
    } else {
      shape.blocksFor = 'none';
      shape.hostileTo = 'none';
      shape.state = phase > 1 - warn / cycle ? 'closing' : 'open';
    }
  }
}

