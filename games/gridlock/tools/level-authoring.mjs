/**
 * tools/level-authoring.mjs — the level design source, and the generator that
 * compiles it into `js/levels.js`.
 *
 * ── Why a topology diagram? ──────────────────────────────────────────────────
 * Every Gridlock maze sits on a 7×7 lattice of junctions spaced three tiles
 * apart (tile x = 3i+1, y = 3j+1), with two-tile corridors between them and
 * 2×2 wall blocks filling the gaps. Designing at that level means each maze is
 * described by a small 13×13 diagram that a human can actually read and edit:
 *
 *     o-o-o     junctions joined by corridors
 *     | |       a missing '-' or '|' walls that corridor off
 *     o o-o
 *
 * The generator expands the diagram to the 21×21 tile map, stamps in the
 * hand-placed spawns, power modules, terminals, gates and secrets, and writes
 * out literal ASCII maps. The shipped `js/levels.js` is plain data with no
 * runtime generation, and stays hand-editable afterwards.
 *
 * Run:  node tools/level-authoring.mjs
 * Then: node tools/validate-levels.mjs
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));

const SIZE = 21;
const NODES = 7;
/** Tile coordinate of lattice column/row `i`. */
const N = (i) => 3 * i + 1;

// ─────────────────────────────────────────────────────────────────────────────
// Level designs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * `over` entries are [x, y, char] using the map legend in js/maze.js:
 *   P player   H/I/N/T/W drones   o power   S terminal
 *   = closed gate   - open gate   ~ retracted bridge   % secret bulkhead
 *   * bonus node (optional)   ' ' bare floor   # wall
 */
const DESIGNS = [
  // ── 1–3: learn to move, learn to be hunted ────────────────────────────────
  {
    name: 'Cold Boot',
    subtitle: 'Siphon online. Drain the grid.',
    hint: 'Swipe or use the arrow keys. Collect every energy node to clear the sector.',
    targetTime: 68,
    topology: [
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
      '|   | | |   |',
      'o-o-o-o-o-o-o',
      '|   | | |   |',
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(2), 'H'],
      [N(0), N(0), 'o'],
      [N(6), N(0), 'o'],
    ],
  },
  {
    name: 'Handshake',
    subtitle: 'The grid notices you.',
    hint: 'Power modules make drones vulnerable for eight seconds. Chain them for bigger scores.',
    targetTime: 72,
    topology: [
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o o o-o-o',
      '|   | | |   |',
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o o-o-o-o-o o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
      '|   | | |   |',
      'o-o-o o o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(3), 'H'],
      [N(0), N(2), 'o'],
      [N(6), N(2), 'o'],
      [N(0), N(0), 'o'],
      [N(6), N(0), 'o'],
    ],
  },
  {
    name: 'Deadlock',
    subtitle: 'It stopped following. It started predicting.',
    hint: 'Interceptors aim at where you are heading. Change direction to break their lead.',
    targetTime: 75,
    topology: [
      'o-o-o-o-o-o-o',
      '| |     | | |',
      'o-o-o-o-o-o-o',
      '|   |   |   |',
      'o-o o-o-o o-o',
      '| | |   | | |',
      'o-o-o-o-o-o-o',
      '| | |   | | |',
      'o-o o-o-o o-o',
      '|   |   |   |',
      'o-o-o-o-o-o-o',
      '| |     | | |',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(2), 'I'],
      [N(0), N(0), 'o'],
      [N(6), N(0), 'o'],
      [N(0), N(6), 'o'],
    ],
  },

  // ── 4–6: Grid Shift arrives ───────────────────────────────────────────────
  {
    name: 'First Rotation',
    subtitle: 'Stop running. Start rewriting.',
    hint: 'Touch a violet terminal to rotate that junction 90°. Fifteen second cooldown — spend it well.',
    targetTime: 78,
    topology: [
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '|   |   |   |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o o o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '|   |   |   |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(1), 'H'],
      [N(3), N(4), 'I'],
      [N(2), N(3), 'S'],
      [N(0), N(0), 'o'],
      [N(6), N(0), 'o'],
      [N(0), N(6), 'o'],
      [N(6), N(6), 'o'],
    ],
    shifts: [{ type: 'rotate', cx: N(2), cy: N(3), size: 5, label: 'Junction Delta' }],
  },
  {
    name: 'Bulkhead',
    subtitle: 'Some doors only open for you.',
    hint: 'Gate terminals seal and unseal routes. Trap a drone behind one and take the sector.',
    targetTime: 80,
    topology: [
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '|   |   |   |',
      'o-o-o-o-o-o-o',
      '|   |   |   |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(1), 'H'],
      [N(1), N(3), 'N'],
      [N(3), N(3), 'S'],
      // Two gates flanking the central junction.
      [N(2) + 1, N(3), '-'],
      [N(2) + 2, N(3), '-'],
      [N(3) + 1, N(3), '-'],
      [N(3) + 2, N(3), '-'],
      [N(0), N(0), 'o'],
      [N(6), N(0), 'o'],
      [N(0), N(6), 'o'],
      [N(6), N(6), 'o'],
    ],
    shifts: [
      {
        type: 'gate',
        label: 'Corridor Seals',
        cells: [
          [N(2) + 1, N(3)],
          [N(2) + 2, N(3)],
          [N(3) + 1, N(3)],
          [N(3) + 2, N(3)],
        ],
      },
    ],
  },
  {
    name: 'Span',
    subtitle: 'Build the road under your feet.',
    hint: 'Bridge terminals extend a temporary walkway. It retracts after seven seconds — do not linger.',
    targetTime: 82,
    topology: [
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o o o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o o o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(0), 'I'],
      [N(0), N(3), 'W'],
      [N(3), N(3), 'S'],
      // Retracted spans bridging the block between columns 1 and 2, row band 2.
      [N(1) + 1, N(2) + 1, '~'],
      [N(1) + 2, N(2) + 1, '~'],
      [N(4) + 1, N(3) + 1, '~'],
      [N(4) + 2, N(3) + 1, '~'],
      [N(0), N(0), 'o'],
      [N(6), N(0), 'o'],
      [N(0), N(6), 'o'],
      [N(6), N(6), 'o'],
    ],
    shifts: [
      {
        type: 'bridge',
        label: 'Span Extend',
        cells: [
          [N(1) + 1, N(2) + 1],
          [N(1) + 2, N(2) + 1],
          [N(4) + 1, N(3) + 1],
          [N(4) + 2, N(3) + 1],
        ],
      },
    ],
  },

  // ── 7–9: two terminals, three drones, first secrets ───────────────────────
  {
    name: 'Crosstalk',
    subtitle: 'Three patrols. Two terminals. One route.',
    hint: 'Secret compartments hide bonus nodes. Watch for bulkheads that do not match the walls.',
    targetTime: 88,
    topology: [
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
      '|   | | |   |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o o o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '|   | | |   |',
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(0), 'H'],
      [N(1), N(3), 'I'],
      [N(5), N(3), 'N'],
      [N(2), N(2), 'S'],
      [N(4), N(4), 'S'],
      [N(0), N(0), 'o'],
      [N(6), N(0), 'o'],
      [N(0), N(6), 'o'],
      [N(6), N(6), 'o'],
    ],
    shifts: [
      { type: 'rotate', cx: N(2), cy: N(2), size: 5, label: 'Junction Alpha' },
      { type: 'rotate', cx: N(4), cy: N(4), size: 5, ccw: true, label: 'Junction Omega' },
    ],
  },
  {
    name: 'Cache Miss',
    subtitle: 'It remembers where you have been.',
    hint: 'Trackers read your recent path. Doubling back is safer than running straight.',
    targetTime: 90,
    topology: [
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '|     | |   |',
      'o-o-o-o-o-o-o',
      '| | |   | | |',
      'o-o-o-o-o-o-o',
      '| | |   | | |',
      'o-o-o-o-o-o-o',
      '|   | |     |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(0), 'H'],
      [N(3), N(3), 'T'],
      [N(0), N(3), 'W'],
      [N(1), N(1), 'S'],
      [N(5), N(5), 'S'],
      [N(1) + 1, N(4) + 1, '~'],
      [N(1) + 2, N(4) + 1, '~'],
      [N(0), N(0), 'o'],
      [N(6), N(0), 'o'],
      [N(0), N(6), 'o'],
      [N(6), N(6), 'o'],
    ],
    shifts: [
      { type: 'rotate', cx: N(1), cy: N(1), size: 5, label: 'Junction Beta' },
      {
        type: 'bridge',
        label: 'Lower Span',
        cells: [
          [N(1) + 1, N(4) + 1],
          [N(1) + 2, N(4) + 1],
        ],
      },
    ],
  },
  {
    name: 'Lockstep',
    subtitle: 'Drop a wall. Buy a second.',
    hint: 'Barrier terminals slam a bulkhead across a corridor. Use one to cut a pursuer off mid-chase.',
    targetTime: 92,
    topology: [
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '|   |   |   |',
      'o-o-o-o-o-o-o',
      '|   |   |   |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(0), 'H'],
      [N(1), N(3), 'I'],
      [N(5), N(3), 'T'],
      [N(3), N(2), 'S'],
      [N(3), N(4), 'S'],
      [N(0), N(2), '-'],
      [N(0), N(0), 'o'],
      [N(6), N(0), 'o'],
      [N(0), N(6), 'o'],
      [N(6), N(6), 'o'],
    ],
    shifts: [
      {
        type: 'barrier',
        label: 'Upper Bulkhead',
        cells: [
          [N(2) + 1, N(2)],
          [N(2) + 2, N(2)],
        ],
      },
      {
        type: 'barrier',
        label: 'Lower Bulkhead',
        cells: [
          [N(3) + 1, N(4)],
          [N(3) + 2, N(4)],
        ],
      },
    ],
  },

  // ── 10–12: sliding walls, secrets, four drones ────────────────────────────
  {
    name: 'Slipstream',
    subtitle: 'Walls that move on your command.',
    hint: 'Sliding walls shunt a whole segment aside — closing one corridor always opens another.',
    targetTime: 95,
    secretPockets: [{ i: 0, j: 3, span: 2, seal: 'up' }],
    topology: [
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '|   | | |   |',
      'o o-o-o-o-o o',
      '|   | | |   |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(0), 'H'],
      [N(1), N(1), 'I'],
      [N(5), N(1), 'N'],
      [N(3), N(3), 'W'],
      // Terminals bind to shifts[] in reading order: (7,4) → (4,7) → (13,13).
      [N(2), N(1), 'S'],
      [N(1), N(2), 'S'],
      [N(4), N(4), 'S'],
      [N(0), N(0), 'o'],
      [N(6), N(0), 'o'],
      [N(6), N(6), 'o'],
    ],
    shifts: [
      { type: 'rotate', cx: N(2), cy: N(2), size: 5, label: 'Junction Sigma' },
      { type: 'reveal', label: 'Breach Seal', cells: 'SECRET_SEAL_0' },
      {
        type: 'slide',
        label: 'Sector Slide',
        cells: [
          [N(2) + 1, N(5) - 1],
          [N(2) + 2, N(5) - 1],
        ],
        dx: 0,
        dy: 1,
      },
    ],
  },
  {
    name: 'Ghost Sector',
    subtitle: 'The map is lying to you.',
    hint: 'Some terminals breach a sealed compartment. Bonus nodes are optional — the clock is not.',
    targetTime: 98,
    secretPockets: [{ i: 5, j: 0, span: 2, seal: 'down' }],
    topology: [
      'o-o-o-o-o-o-o',
      '| | | | |   |',
      'o-o-o-o-o-o-o',
      '| |   |     |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o o o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '|   | |   | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(0), 'H'],
      [N(0), N(3), 'I'],
      [N(6), N(3), 'T'],
      [N(3), N(3), 'N'],
      // Reading order: (16,7) → (4,13) → (13,13).
      [N(5), N(2), 'S'],
      [N(1), N(4), 'S'],
      [N(4), N(4), 'S'],
      [N(0), N(0), 'o'],
      [N(0), N(6), 'o'],
      [N(6), N(6), 'o'],
    ],
    shifts: [
      { type: 'reveal', label: 'Breach Seal', cells: 'SECRET_SEAL_0' },
      {
        type: 'slide',
        label: 'West Slide',
        cells: [
          [N(2) - 1, N(4) + 1],
          [N(2) - 1, N(4) + 2],
        ],
        dx: 1,
        dy: 0,
      },
      { type: 'rotate', cx: N(4), cy: N(4), size: 5, label: 'Junction Kappa' },
    ],
  },
  {
    name: 'Recursion',
    subtitle: 'Every route you open closes another.',
    hint: 'Three terminals, one cooldown. Decide what the maze should look like before you commit.',
    targetTime: 100,
    secretPockets: [{ i: 0, j: 0, span: 2, seal: 'down' }],
    topology: [
      'o-o-o-o-o-o-o',
      '  | | | | | |',
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
      '| | | | |    ',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(0), 'H'],
      [N(1), N(3), 'I'],
      [N(5), N(2), 'N'],
      [N(3), N(4), 'T'],
      // Reading order: (10,4) → (4,7) → (7,10) → (13,10).
      [N(3), N(1), 'S'],
      [N(1), N(2), 'S'],
      [N(2), N(3), 'S'],
      [N(4), N(3), 'S'],
      // Retracted spans, kept clear of both rotation blocks.
      [N(2) + 1, N(0) + 1, '~'],
      [N(2) + 2, N(0) + 1, '~'],
      [N(4) + 1, N(0) + 2, '~'],
      [N(4) + 2, N(0) + 2, '~'],
      [N(0), N(3), 'o'],
      [N(6), N(3), 'o'],
      [N(3), N(5), 'o'],
    ],
    shifts: [
      {
        type: 'bridge',
        label: 'Twin Spans',
        cells: [
          [N(2) + 1, N(0) + 1],
          [N(2) + 2, N(0) + 1],
          [N(4) + 1, N(0) + 2],
          [N(4) + 2, N(0) + 2],
        ],
      },
      { type: 'reveal', label: 'Breach Seal', cells: 'SECRET_SEAL_0' },
      { type: 'rotate', cx: N(2), cy: N(3), size: 5, label: 'Junction West' },
      { type: 'rotate', cx: N(4), cy: N(3), size: 5, ccw: true, label: 'Junction East' },
    ],
  },

  // ── 13–15: everything at once ─────────────────────────────────────────────
  {
    name: 'Cascade',
    subtitle: 'One command. Four walls.',
    hint: 'Cascade terminals fire several reconfigurations at once. Read the whole board first.',
    targetTime: 105,
    secretPockets: [{ i: 3, j: 0, span: 2, seal: 'down' }],
    topology: [
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
      '|   | | |   |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o o o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '|   | | |   |',
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(2), 'H'],
      [N(1), N(1), 'I'],
      [N(5), N(1), 'N'],
      [N(1), N(5), 'T'],
      [N(5), N(5), 'W'],
      // Reading order: (10,4) → (1,10) → (19,10) → (10,13).
      [N(3), N(1), 'S'],
      [N(0), N(3), 'S'],
      [N(6), N(3), 'S'],
      [N(3), N(4), 'S'],
      [N(0), N(0), 'o'],
      [N(6), N(0), 'o'],
      [N(0), N(6), 'o'],
      [N(6), N(6), 'o'],
    ],
    shifts: [
      { type: 'reveal', label: 'Breach Seal', cells: 'SECRET_SEAL_0' },
      { type: 'rotate', cx: N(1), cy: N(3), size: 5, label: 'Junction West' },
      { type: 'rotate', cx: N(5), cy: N(3), size: 5, ccw: true, label: 'Junction East' },
      {
        type: 'combo',
        label: 'Cascade Core',
        parts: [
          { type: 'rotate', cx: N(2), cy: N(4), size: 5 },
          { type: 'rotate', cx: N(4), cy: N(4), size: 5, ccw: true },
        ],
      },
    ],
  },
  {
    name: 'Blackout',
    subtitle: 'Five patrols and nowhere quiet.',
    hint: 'Save a shift for the moment two drones converge. Rotating a junction can split them apart.',
    targetTime: 108,
    secretPockets: [
      { i: 0, j: 3, span: 2, seal: 'down' },
      { i: 5, j: 5, span: 2, seal: 'up' },
    ],
    topology: [
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(0), 'H'],
      [N(2), N(3), 'I'],
      [N(4), N(3), 'N'],
      [N(1), N(5), 'T'],
      [N(4), N(5), 'W'],
      // Reading order: (10,4) → (4,7) → (10,10) → (16,13).
      [N(3), N(1), 'S'],
      [N(1), N(2), 'S'],
      [N(3), N(3), 'S'],
      [N(5), N(4), 'S'],
      [N(2) + 1, N(2), '-'],
      [N(2) + 2, N(2), '-'],
      [N(3) + 1, N(4), '-'],
      [N(3) + 2, N(4), '-'],
      [N(0), N(0), 'o'],
      [N(6), N(0), 'o'],
      [N(0), N(2), 'o'],
      [N(6), N(3), 'o'],
    ],
    shifts: [
      {
        type: 'combo',
        label: 'Gate Cascade',
        parts: [
          {
            type: 'gate',
            cells: [
              [N(2) + 1, N(2)],
              [N(2) + 2, N(2)],
              [N(3) + 1, N(4)],
              [N(3) + 2, N(4)],
            ],
          },
          { type: 'rotate', cx: N(1), cy: N(3), size: 5 },
        ],
      },
      { type: 'reveal', label: 'West Breach', cells: 'SECRET_SEAL_0' },
      { type: 'rotate', cx: N(3), cy: N(3), size: 5, label: 'Junction Core' },
      { type: 'reveal', label: 'East Breach', cells: 'SECRET_SEAL_1' },
    ],
  },
  {
    name: 'Master Hack',
    subtitle: 'Own the maze. Rewrite the pursuit.',
    hint: 'Everything the grid has. Perfect Clear needs no deaths, every secret, and the target time.',
    targetTime: 115,
    secretPockets: [
      { i: 0, j: 0, span: 2, seal: 'down' },
      { i: 5, j: 0, span: 2, seal: 'down' },
    ],
    topology: [
      'o-o-o-o-o-o-o',
      '  |   |   |  ',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
      '| | | | | | |',
      'o-o-o-o-o-o-o',
      '| |   |   | |',
      'o-o-o-o-o-o-o',
    ],
    over: [
      [N(3), N(6), 'P'],
      [N(3), N(2), 'H'],
      [N(1), N(2), 'I'],
      [N(5), N(2), 'N'],
      [N(2), N(4), 'T'],
      [N(4), N(4), 'W'],
      // Reading order: (10,4) → (10,10) → (4,13) → (16,13).
      [N(3), N(1), 'S'],
      [N(3), N(3), 'S'],
      [N(1), N(4), 'S'],
      [N(5), N(4), 'S'],
      [N(0), N(3), 'o'],
      [N(6), N(3), 'o'],
      [N(0), N(6), 'o'],
      [N(6), N(6), 'o'],
    ],
    shifts: [
      {
        type: 'combo',
        label: 'Twin Breach',
        parts: [
          { type: 'reveal', cells: 'SECRET_SEAL_0' },
          { type: 'reveal', cells: 'SECRET_SEAL_1' },
        ],
      },
      {
        type: 'combo',
        label: 'Core Cascade',
        parts: [
          { type: 'rotate', cx: N(2), cy: N(3), size: 5 },
          { type: 'rotate', cx: N(4), cy: N(3), size: 5, ccw: true },
        ],
      },
      {
        type: 'slide',
        label: 'West Slide',
        cells: [
          [N(1) + 1, N(5) - 1],
          [N(1) + 2, N(5) - 1],
        ],
        dx: 0,
        dy: 1,
      },
      { type: 'rotate', cx: N(5), cy: N(3), size: 5, label: 'East Junction' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Compiler
// ─────────────────────────────────────────────────────────────────────────────

/** Expands a 13×13 topology diagram into a 21×21 grid of chars. */
function expandTopology(topology, name) {
  if (topology.length !== 13) throw new Error(`${name}: topology needs 13 lines, got ${topology.length}`);
  topology.forEach((line, k) => {
    if (line.length !== 13) throw new Error(`${name}: topology line ${k} is ${line.length} chars, need 13`);
  });

  const grid = Array.from({ length: SIZE }, () => new Array(SIZE).fill('#'));
  const edges = { h: [], v: [] };

  for (let j = 0; j < NODES; j++) {
    for (let i = 0; i < NODES; i++) {
      grid[N(j)][N(i)] = '.';
      // Horizontal corridor to (i+1, j)
      if (i < NODES - 1 && topology[2 * j][2 * i + 1] === '-') {
        grid[N(j)][N(i) + 1] = '.';
        grid[N(j)][N(i) + 2] = '.';
        edges.h.push([i, j]);
      }
      // Vertical corridor to (i, j+1)
      if (j < NODES - 1 && topology[2 * j + 1][2 * i] === '|') {
        grid[N(j) + 1][N(i)] = '.';
        grid[N(j) + 2][N(i)] = '.';
        edges.v.push([i, j]);
      }
    }
  }
  return { grid, edges };
}

/**
 * Carves a sealed bonus compartment: a run of junctions cut off from the main
 * graph, filled with optional nodes and closed by a breachable bulkhead.
 */
function carveSecret(grid, pocket, index) {
  const { i, j, span, seal } = pocket;
  const cells = [];
  for (let k = 0; k < span; k++) {
    const x = N(i + k);
    const y = N(j);
    grid[y][x] = '*';
    cells.push([x, y]);
    if (k > 0) {
      grid[y][N(i + k) - 1] = '*';
      grid[y][N(i + k) - 2] = '*';
      cells.push([N(i + k) - 1, y], [N(i + k) - 2, y]);
    }
  }

  // Wall off every corridor leaving the pocket, then cut one side back open as
  // a breachable bulkhead that a `reveal` terminal can dissolve.
  //
  // The seal is carved unconditionally — even where the topology had no
  // corridor at all — so a pocket always has exactly one way in. Forgetting
  // that is how you ship a bonus room nobody can reach.
  const sealCells = [];
  const SIDES = {
    up: { dx: 0, dy: -1 },
    down: { dx: 0, dy: 1 },
    left: { dx: -1, dy: 0 },
    right: { dx: 1, dy: 0 },
  };

  for (let k = 0; k < span; k++) {
    const x = N(i + k);
    const y = N(j);
    for (const [name, s] of Object.entries(SIDES)) {
      const ax = x + s.dx;
      const ay = y + s.dy;
      const bx = x + s.dx * 2;
      const by = y + s.dy * 2;
      const inner = ax >= 0 && ay >= 0 && ax < SIZE && ay < SIZE;
      const outer = bx >= 0 && by >= 0 && bx < SIZE && by < SIZE;
      if (!inner) continue;
      if (grid[ay][ax] === '*') continue; // still inside the pocket run

      if (k === 0 && name === seal) {
        if (!outer) throw new Error(`secret pocket seal "${name}" runs off the map at ${x},${y}`);
        grid[ay][ax] = '%';
        grid[by][bx] = '%';
        sealCells.push([ax, ay], [bx, by]);
      } else {
        grid[ay][ax] = '#';
        if (outer) grid[by][bx] = '#';
      }
    }
  }
  if (!sealCells.length) throw new Error(`secret pocket at ${i},${j} has no "${seal}" seal`);

  const xs = cells.map((c) => c[0]);
  const ys = cells.map((c) => c[1]);
  const rect = {
    x: Math.min(...xs),
    y: Math.min(...ys),
    w: Math.max(...xs) - Math.min(...xs) + 1,
    h: Math.max(...ys) - Math.min(...ys) + 1,
    name: `Compartment ${String.fromCharCode(65 + index)}`,
  };
  return { rect, sealCells };
}

function compile(design, number) {
  const label = `Level ${number} (${design.name})`;
  const { grid } = expandTopology(design.topology, label);

  const secrets = [];
  const seals = [];
  (design.secretPockets || []).forEach((pocket, idx) => {
    const { rect, sealCells } = carveSecret(grid, pocket, idx);
    secrets.push(rect);
    seals.push(sealCells);
  });

  for (const [x, y, ch] of design.over || []) {
    if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) throw new Error(`${label}: override out of bounds at ${x},${y}`);
    grid[y][x] = ch;
  }

  // Resolve SECRET_SEAL_n placeholders in the shift definitions.
  const shifts = JSON.parse(JSON.stringify(design.shifts || []));
  const resolveCells = (obj) => {
    if (typeof obj.cells === 'string') {
      const m = /^SECRET_SEAL_(\d+)$/.exec(obj.cells);
      if (!m) throw new Error(`${label}: bad cells reference ${obj.cells}`);
      const seal = seals[Number(m[1])];
      if (!seal) throw new Error(`${label}: no secret pocket ${m[1]} to breach`);
      obj.cells = seal;
    }
    if (obj.parts) obj.parts.forEach(resolveCells);
  };
  shifts.forEach(resolveCells);

  const map = grid.map((row) => row.join(''));
  map.forEach((row, y) => {
    if (row.length !== SIZE) throw new Error(`${label}: row ${y} is ${row.length} wide`);
  });

  return {
    id: `L${String(number).padStart(2, '0')}`,
    number,
    name: design.name,
    subtitle: design.subtitle,
    hint: design.hint,
    width: SIZE,
    height: SIZE,
    map,
    shifts,
    secrets,
    targetTime: design.targetTime,
    rankThresholds: { 'S+': 1.0, S: 1.3, A: 1.7, B: 2.2 },
  };
}

const levels = DESIGNS.map((d, k) => compile(d, k + 1));

// ─────────────────────────────────────────────────────────────────────────────
// Emit js/levels.js
// ─────────────────────────────────────────────────────────────────────────────

const q = (s) => JSON.stringify(s);

const body = levels
  .map((lv) => {
    const mapLines = lv.map.map((r) => `      ${q(r)},`).join('\n');
    const shifts = lv.shifts.length
      ? lv.shifts.map((s) => `      ${JSON.stringify(s)},`).join('\n')
      : null;
    const secrets = lv.secrets.length
      ? lv.secrets.map((s) => `      ${JSON.stringify(s)},`).join('\n')
      : null;
    return `  {
    id: ${q(lv.id)},
    number: ${lv.number},
    name: ${q(lv.name)},
    subtitle: ${q(lv.subtitle)},
    hint: ${q(lv.hint)},
    width: ${lv.width},
    height: ${lv.height},
    targetTime: ${lv.targetTime},
    rankThresholds: ${JSON.stringify(lv.rankThresholds)},
    map: [
${mapLines}
    ],
    shifts: ${shifts ? `[\n${shifts}\n    ]` : '[]'},
    secrets: ${secrets ? `[\n${secrets}\n    ]` : '[]'},
  },`;
  })
  .join('\n');

const out = `/**
 * levels.js — The 15 handcrafted sectors.
 *
 * GENERATED from tools/level-authoring.mjs, which holds the readable topology
 * diagrams these maps were designed with. The maps below are plain data: edit
 * them here for a quick tweak, or edit the authoring file and regenerate.
 *
 * Map legend (see js/maze.js LEGEND):
 *   #  wall              .  energy node        (space) bare floor
 *   o  power module      P  player spawn       S  Grid Shift terminal
 *   H  Hunter drone      I  Interceptor        N  Sentinel
 *   T  Tracker           W  Wanderer
 *   =  closed gate       -  open gate          ~  retracted bridge span
 *   %  secret bulkhead   *  bonus node (optional — not required to clear)
 *
 * Shift terminals are bound to \`shifts[]\` in reading order: the first "S" on
 * the map uses shifts[0], the second uses shifts[1], and so on.
 */

export const LEVELS = [
${body}
];

export const TOTAL_LEVELS = LEVELS.length;

/** @returns {object|undefined} */
export function getLevel(number) {
  return LEVELS[number - 1];
}
`;

const target = resolve(HERE, '../js/levels.js');
writeFileSync(target, out, 'utf8');

console.log(`Wrote ${levels.length} levels to ${target}`);
for (const lv of levels) {
  const nodes = lv.map.join('').split('.').length - 1;
  const bonus = lv.map.join('').split('*').length - 1;
  console.log(
    `  ${lv.id} ${lv.name.padEnd(16)} nodes=${String(nodes).padStart(3)} bonus=${String(bonus).padStart(2)} shifts=${lv.shifts.length} secrets=${lv.secrets.length} target=${lv.targetTime}s`
  );
}
