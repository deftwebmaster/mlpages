/**
 * levels.js — The twelve handcrafted networks.
 *
 * This file is pure data. The engine never branches on a level id; anything
 * a level needs to express, it expresses through the schema below. Adding a
 * thirteenth level means appending an object here and nothing else.
 *
 * Grid convention: row 0 is the terminal row at the top, row 12 is the spawn
 * row at the bottom. Column 0 is the left edge. "Forward" is decreasing row.
 *
 * Every level in this file has been proved completable by
 * `npm run validate`, which searches for an actual route to each uplink
 * using the same motion and collision code the game runs.
 */

// --- Lane authoring helpers -------------------------------------------------
// These exist purely to keep the level tables readable; they emit plain
// objects with no behaviour attached.

const packet = (row, direction, speed, spacing, size, offset = 0, extra = {}) => ({
  row, type: 'packet', direction, speed, spacing, size, offset, ...extra,
});

const platform = (row, direction, speed, spacing, size, offset = 0, extra = {}) => ({
  row, type: 'platform', direction, speed, spacing, size, offset, ...extra,
});

const relay = (row, direction, speed, spacing, size, offset = 0, extra = {}) => ({
  row, type: 'relay', direction, speed, spacing, size, offset, cycle: 2.4, ...extra,
});

const pulse = (row, direction, speed, spacing, size, offset = 0, extra = {}) => ({
  row, type: 'pulse', direction, speed, spacing, size, offset, ...extra,
});

const corruption = (row, direction, speed, spacing, size, offset = 0, extra = {}) => ({
  row, type: 'corruption', direction, speed, spacing, size, offset, trail: 0.6, ...extra,
});

const scanner = (row, pattern, extra = {}) => ({
  row, type: 'scanner', pattern, ...extra,
});

const gate = (row, cells, extra = {}) => ({
  row, type: 'gate', cells, ...extra,
});

const safe = (row) => ({ row, type: 'safe' });

/** Solid cells — used to funnel routes through specific gate doors. */
const wallRow = (row, cols) => cols.map((col) => ({ row, col }));

// --- Levels -----------------------------------------------------------------

export const LEVELS = [
  {
    id: 1,
    name: 'First Contact',
    description: 'A quiet corner of the network. Learn to move and to wait.',
    targetTime: 26,
    difficulty: 1,
    backgroundVariant: 0,
    playerStart: { row: 12, col: 4 },
    uplinks: [{ col: 4 }],
    lanes: [
      safe(1),
      packet(2, -1, 1.4, 6, 2, 0),
      safe(3),
      packet(4, 1, 1.2, 6, 2, 3),
      safe(5),
      safe(6),
      packet(7, -1, 1.6, 7, 2, 1),
      safe(8),
      packet(9, 1, 1.3, 6, 1, 2),
      safe(10),
      safe(11),
    ],
    collectibles: [
      { row: 5, col: 2 },
      { row: 8, col: 7 },
    ],
    tutorialPrompts: [
      { id: 'move', trigger: { type: 'start' }, text: 'SWIPE UP TO ADVANCE\nThe network keeps moving while you decide.' },
      { id: 'packets', trigger: { type: 'row', row: 10 }, text: 'AVOID SECURITY PACKETS\nWait in the gaps. There is no rush.' },
    ],
  },

  {
    id: 2,
    name: 'Cross Traffic',
    description: 'Lanes running both ways, at speeds that will not agree with each other.',
    targetTime: 34,
    difficulty: 1,
    backgroundVariant: 0,
    playerStart: { row: 12, col: 4 },
    uplinks: [{ col: 4 }],
    lanes: [
      safe(1),
      packet(2, -1, 2.2, 5, 2, 0),
      packet(3, 1, 1.6, 6, 2, 2),
      packet(4, -1, 2.8, 7, 1, 4),
      safe(5),
      packet(6, 1, 2.0, 5, 2, 1),
      packet(7, -1, 1.4, 6, 3, 3),
      packet(8, 1, 2.6, 7, 2, 0),
      safe(9),
      packet(10, -1, 1.8, 6, 1, 2),
      safe(11),
    ],
    collectibles: [
      { row: 5, col: 1 },
      { row: 9, col: 7 },
      { row: 3, col: 6 },
    ],
    tutorialPrompts: [
      { id: 'stack', trigger: { type: 'start' }, text: 'STACKED LANES\nRead two rows ahead before you commit.' },
    ],
  },

  {
    id: 3,
    name: 'Data Stream',
    description: 'The floor runs out. Ride the stream or lose the signal.',
    targetTime: 44,
    difficulty: 2,
    backgroundVariant: 1,
    playerStart: { row: 12, col: 4 },
    uplinks: [{ col: 4 }],
    lanes: [
      safe(1),
      platform(2, 1, 1.6, 5, 3, 0),
      safe(3),
      platform(4, -1, 1.8, 5, 3, 2),
      platform(5, 1, 1.4, 6, 3, 1),
      safe(6),
      packet(7, -1, 1.8, 6, 2, 0),
      safe(8),
      platform(9, 1, 1.5, 5, 3, 3),
      safe(10),
      safe(11),
    ],
    collectibles: [
      { row: 5, col: 7 },
      { row: 8, col: 1 },
    ],
    tutorialPrompts: [
      { id: 'platforms', trigger: { type: 'row', row: 10 }, text: 'LAND ON MOVING DATA PLATFORMS\nEmpty space will not hold your signal.' },
      { id: 'carried', trigger: { type: 'row', row: 5 }, text: 'DO NOT RIDE TOO FAR\nBeing carried off the network ends the run.' },
    ],
  },

  {
    id: 4,
    name: 'Dual Frequency',
    description: 'Two frequencies, two sets of doors. Match the colour or stay out.',
    targetTime: 44,
    difficulty: 2,
    backgroundVariant: 2,
    playerStart: { row: 12, col: 4 },
    uplinks: [{ col: 4 }],
    lanes: [
      safe(1),
      packet(2, -1, 1.5, 6, 2, 1),
      safe(3),
      gate(4, [{ col: 2, polarity: 'cyan' }, { col: 6, polarity: 'violet' }], { mode: 'static' }),
      safe(5),
      safe(6),
      packet(7, 1, 1.7, 6, 2, 2),
      safe(8),
      gate(9, [{ col: 3, polarity: 'violet' }, { col: 5, polarity: 'cyan' }], { mode: 'static' }),
      safe(10),
      safe(11),
    ],
    walls: [...wallRow(4, [0, 1, 3, 4, 5, 7, 8]), ...wallRow(9, [0, 1, 2, 4, 6, 7, 8])],
    collectibles: [
      { row: 5, col: 6 },
      { row: 8, col: 2 },
    ],
    tutorialPrompts: [
      { id: 'polarity', trigger: { type: 'row', row: 10 }, text: 'SWITCH FREQUENCY TO MATCH THE GATE\nTap the frequency button, or press SPACE.' },
    ],
  },

  {
    id: 5,
    name: 'Phase Traffic',
    description: 'Traffic carries a frequency now. Match it and pass straight through.',
    targetTime: 48,
    difficulty: 3,
    backgroundVariant: 2,
    playerStart: { row: 12, col: 4 },
    uplinks: [{ col: 4 }],
    lanes: [
      safe(1),
      packet(2, -1, 2.0, 5, 2, 0, { polarity: 'cyan' }),
      packet(3, 1, 2.0, 5, 2, 2, { polarity: 'violet' }),
      safe(4),
      packet(5, 1, 1.8, 4, 1, 0, { polarities: ['cyan', 'violet'] }),
      safe(6),
      packet(7, -1, 2.2, 6, 2, 1, { polarity: 'violet' }),
      packet(8, 1, 1.6, 6, 2, 3, { polarity: 'cyan' }),
      safe(9),
      packet(10, -1, 1.8, 6, 2, 0),
      safe(11),
    ],
    collectibles: [
      { row: 4, col: 7 },
      { row: 6, col: 1 },
      { row: 9, col: 4 },
    ],
    tutorialPrompts: [
      { id: 'phase', trigger: { type: 'row', row: 9 }, text: 'MATCHING FREQUENCY PASSES THROUGH\nOrange traffic ignores frequency entirely.' },
    ],
  },

  {
    id: 6,
    name: 'Scan Cycle',
    description: 'Security is sweeping. Everything here warns you before it fires.',
    targetTime: 54,
    difficulty: 3,
    backgroundVariant: 3,
    playerStart: { row: 12, col: 4 },
    uplinks: [{ col: 4 }],
    lanes: [
      safe(1),
      scanner(2, 'blink', { cycle: 3.0, duty: 0.3, warn: 0.85 }),
      safe(3),
      scanner(4, 'sweep', { direction: 1, speed: 3.0, spacing: 9, size: 2, warnLength: 1.6 }),
      safe(5),
      scanner(6, 'segments', { cycle: 2.2, duty: 0.45, stride: 2 }),
      safe(7),
      packet(8, -1, 1.8, 6, 2, 0),
      safe(9),
      scanner(10, 'blink', { cycle: 2.6, duty: 0.28, phase: 0.5, warn: 0.7 }),
      safe(11),
    ],
    collectibles: [
      { row: 3, col: 7 },
      { row: 7, col: 1 },
    ],
    tutorialPrompts: [
      { id: 'scan', trigger: { type: 'row', row: 11 }, text: 'WATCH THE SCAN CYCLE\nA charging beam is safe. A lit beam is not.' },
    ],
  },

  {
    id: 7,
    name: 'Relay Transfer',
    description: 'Relay platforms change frequency underneath you. Change with them.',
    targetTime: 62,
    difficulty: 4,
    backgroundVariant: 1,
    playerStart: { row: 12, col: 4 },
    uplinks: [{ col: 4 }],
    lanes: [
      safe(1),
      platform(2, 1, 1.6, 5, 3, 0),
      safe(3),
      relay(4, -1, 1.5, 5, 3, 0, { cycle: 2.6, polarity: 'cyan', stagger: 1 }),
      safe(5),
      relay(6, 1, 1.4, 5, 3, 2, { cycle: 3.0, polarity: 'violet', stagger: 1 }),
      safe(7),
      packet(8, -1, 2.0, 6, 2, 1),
      safe(9),
      platform(10, 1, 1.5, 5, 3, 2),
      safe(11),
    ],
    collectibles: [
      { row: 5, col: 7 },
      { row: 7, col: 1 },
      { row: 3, col: 4 },
    ],
    tutorialPrompts: [
      { id: 'relay', trigger: { type: 'row', row: 5 }, text: 'RELAYS FLIP FREQUENCY\nSwitch while riding or fall through.' },
    ],
  },

  {
    id: 8,
    name: 'Encryption Grid',
    description: 'Three sealed rows, two uplinks, and one narrow rhythm through it all.',
    targetTime: 78,
    difficulty: 4,
    backgroundVariant: 3,
    playerStart: { row: 12, col: 4 },
    uplinks: [{ col: 2 }, { col: 6 }],
    lanes: [
      safe(1),
      gate(2, [1, 3, 5, 7], { mode: 'toggle', cycle: 2.4, duty: 0.5, phaseStep: 0.25 }),
      safe(3),
      packet(4, -1, 2.0, 6, 2, 0),
      gate(5, [{ col: 2 }, { col: 4 }, { col: 6 }], {
        mode: 'polarity', cycle: 2.4, phaseStep: 0.34, polarity: 'cyan',
      }),
      safe(6),
      packet(7, 1, 1.8, 6, 2, 2),
      gate(8, [2, 4, 6], { mode: 'toggle', cycle: 2.0, duty: 0.45, phaseStep: 0.5 }),
      safe(9),
      packet(10, -1, 1.6, 7, 2, 1),
      safe(11),
    ],
    walls: [
      ...wallRow(2, [0, 2, 4, 6, 8]),
      ...wallRow(5, [0, 1, 3, 5, 7, 8]),
      ...wallRow(8, [0, 1, 3, 5, 7, 8]),
    ],
    collectibles: [
      { row: 3, col: 7 },
      { row: 6, col: 1 },
      { row: 9, col: 4 },
    ],
    tutorialPrompts: [
      { id: 'gates', trigger: { type: 'start' }, text: 'TWO UPLINKS\nActivate one and you respawn to fetch the next.' },
    ],
  },

  {
    id: 9,
    name: 'Corrupted Channel',
    description: 'Corruption does not just hit you. It poisons the ground behind it.',
    targetTime: 80,
    difficulty: 5,
    backgroundVariant: 4,
    playerStart: { row: 12, col: 4 },
    uplinks: [{ col: 2 }, { col: 6 }],
    lanes: [
      safe(1),
      corruption(2, -1, 2.0, 7, 2, 0, { trail: 0.6 }),
      safe(3),
      packet(4, 1, 2.2, 6, 2, 3),
      safe(5),
      corruption(6, 1, 1.8, 8, 2, 2, { trail: 0.9 }),
      safe(7),
      platform(8, -1, 1.6, 5, 3, 1),
      safe(9),
      corruption(10, 1, 2.4, 8, 1, 4, { trail: 0.5 }),
      safe(11),
    ],
    collectibles: [
      { row: 5, col: 7 },
      { row: 7, col: 1 },
      { row: 9, col: 6 },
    ],
    tutorialPrompts: [
      { id: 'corruption', trigger: { type: 'row', row: 11 }, text: 'CORRUPTION LEAVES A TRAIL\nThe smear behind it is just as lethal.' },
    ],
  },

  {
    id: 10,
    name: 'Split Route',
    description: 'The network forks. One side is quicker, the other is survivable.',
    targetTime: 84,
    difficulty: 5,
    backgroundVariant: 4,
    playerStart: { row: 12, col: 4 },
    uplinks: [{ col: 1 }, { col: 7 }],
    lanes: [
      safe(1),
      packet(2, -1, 2.2, 5, 2, 0, { from: 0, to: 4 }),
      packet(3, 1, 2.0, 5, 2, 1, { from: 5, to: 9 }),
      safe(4),
      platform(5, 1, 1.6, 5, 3, 0, { from: 0, to: 4 }),
      safe(6),
      scanner(7, 'blink', { from: 4, to: 9, cycle: 2.6, duty: 0.32, warn: 0.8 }),
      corruption(8, 1, 2.0, 7, 1, 0, { from: 0, to: 5, trail: 0.5 }),
      safe(9),
      packet(10, -1, 1.8, 6, 2, 2),
      safe(11),
    ],
    collectibles: [
      { row: 4, col: 2 },
      { row: 6, col: 1 },
      { row: 6, col: 7 },
      { row: 9, col: 8 },
    ],
    tutorialPrompts: [
      { id: 'split', trigger: { type: 'start' }, text: 'THE NETWORK FORKS\nHazards cover half a row at a time here.' },
    ],
  },

  {
    id: 11,
    name: 'Signal Storm',
    description: 'Everything at once, and three uplinks to carry home.',
    targetTime: 115,
    difficulty: 6,
    backgroundVariant: 5,
    playerStart: { row: 12, col: 4 },
    uplinks: [{ col: 1 }, { col: 4 }, { col: 7 }],
    lanes: [
      safe(1),
      packet(2, -1, 2.2, 4, 1, 0, { polarities: ['cyan', 'violet'] }),
      platform(3, 1, 1.7, 5, 3, 1),
      safe(4),
      gate(5, [1, 3, 5, 7], { mode: 'polarity', cycle: 2.6, phaseStep: 0.25, polarity: 'cyan' }),
      safe(6),
      scanner(7, 'sweep', {
        direction: -1, speed: 3.2, spacing: 10, size: 2, warnLength: 1.8,
        polarity: 'cyan', alternatePolarity: true,
      }),
      relay(8, 1, 1.5, 5, 3, 0, { cycle: 2.6, polarity: 'violet', stagger: 1 }),
      safe(9),
      packet(10, -1, 2.4, 6, 2, 3),
      safe(11),
    ],
    walls: [...wallRow(5, [0, 2, 4, 6, 8])],
    collectibles: [
      { row: 4, col: 0 },
      { row: 6, col: 8 },
      { row: 9, col: 4 },
      { row: 1, col: 4 },
    ],
    tutorialPrompts: [
      { id: 'storm', trigger: { type: 'start' }, text: 'THREE UPLINKS\nEvery system in the network is live.' },
    ],
  },

  {
    id: 12,
    name: 'Final Uplink',
    description: 'No new tricks. Just all of them, tightened.',
    targetTime: 130,
    difficulty: 6,
    backgroundVariant: 5,
    playerStart: { row: 12, col: 4 },
    uplinks: [{ col: 1 }, { col: 4 }, { col: 7 }],
    lanes: [
      safe(1),
      scanner(2, 'segments', { cycle: 2.0, duty: 0.5, stride: 2 }),
      packet(3, 1, 2.6, 6, 2, 0),
      relay(4, -1, 1.6, 5, 3, 1, { cycle: 2.6, polarity: 'cyan', stagger: 1 }),
      safe(5),
      corruption(6, 1, 2.2, 8, 2, 2, { trail: 0.7 }),
      gate(7, [{ col: 2 }, { col: 4 }, { col: 6 }], {
        mode: 'polarity', cycle: 2.4, phaseStep: 0.34, polarity: 'violet',
      }),
      platform(8, 1, 1.8, 5, 3, 3),
      packet(9, -1, 2.0, 5, 2, 1, { polarity: 'cyan' }),
      packet(10, 1, 2.2, 6, 2, 4),
      safe(11),
    ],
    walls: [...wallRow(7, [0, 1, 3, 5, 7, 8])],
    collectibles: [
      { row: 5, col: 0 },
      { row: 5, col: 8 },
      { row: 11, col: 4 },
      { row: 1, col: 7 },
    ],
    tutorialPrompts: [
      { id: 'final', trigger: { type: 'start' }, text: 'FINAL UPLINK\nCarry the signal home.' },
    ],
  },
];

export function getLevelDefinition(id) {
  return LEVELS.find((l) => l.id === id) ?? null;
}

export const LEVEL_COUNT = LEVELS.length;
