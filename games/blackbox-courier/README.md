# Blackbox Courier

**Deliver the payload before the route collapses.**

A high-speed arcade run through a collapsing data tunnel. You pilot a courier craft carrying an
unstable blackbox: the craft moves forward on its own, you steer, and you phase-shift through energy
barriers while the payload degrades around you. Routes are assembled procedurally from handcrafted
sections and are *proved* traversable before they reach you.

Built with vanilla JavaScript, HTML Canvas and the Web Audio API. No frameworks, no build step, no
backend, no dependencies. Runs offline as an installable PWA.

---

## Features

- **Real-time canvas engine** — custom loop, delta-time movement, perspective-projected 2D tunnel.
- **Procedural route assembly** — 14 handcrafted chunk templates combined under compatibility,
  pacing and difficulty rules.
- **Provable safe paths** — every chunk is validated by a reachability sweep before it can spawn;
  the reachable set is carried across chunk joins, so transitions are verified too.
- **Phase-shift mechanic** — a limited resource that opens energy barriers, costs payload stability,
  and never affects solid hazards.
- **Payload stability** — the survival meter, driving both the fail state and the visual degradation
  of the whole presentation.
- **Eight hazard types** — debris, sliding gates, mines, rotors, energy barriers, corruption fields,
  collapsing walls, calibration gates.
- **Near-miss scoring**, clean-section bonuses, a five-step multiplier, and 30-second checkpoints.
- **Object pooling** throughout — a five-minute run performs no sustained allocation.
- **Synthesised audio** — every sound is generated at runtime; there are no audio assets to load.
- **Full PWA** — offline caching, install prompt, maskable icons, portrait standalone display.
- **Accessibility** — reduced-effects mode, reduced-motion support, keyboard play, large touch
  targets, shape-plus-colour hazard coding, text labels on every meter.

## Controls

|                | Touch                                    | Desktop                          |
| -------------- | ---------------------------------------- | -------------------------------- |
| **Steer**      | Drag anywhere in the tunnel              | `←` `→`, `A` `D`, or mouse drag  |
| **Phase**      | Hold the PHASE button, or a second finger | Hold `Space` (or `W` / `↑`)      |
| **Pause**      | Pause button                             | `P` or `Esc`                     |

An alternative "press left / right" touch scheme is available in Settings.

## How it plays

Solid hazards end the run outright. Energy barriers are violet, scan-lined and clearly distinct —
they are the only thing phase passes through, and hitting one un-phased costs stability rather than
the run. Corruption fields drain the payload while you are inside them but are never lethal, so
they are a genuine risk/reward choice. Tunnel walls push you back and cost stability while you
scrape them; only a corridor that closes to narrower than the craft is fatal.

Skill buys survival: clean sections, calibration gates, repair nodes and checkpoints all restore
payload stability, so a precise pilot can outlast the drain far longer than a careless one.

---

## Technical approach

### World space

Everything is positioned in a two-axis world space: `x` is lateral, where the widest corridor spans
`[-1, 1]`; `z` is depth ahead of the craft, which sits permanently at `z = 0`. Hazards spawn far
away at large `z` and travel toward zero. Rendering projects this with `scale = focal / (z + focal)`,
putting the vanishing point on the horizon and the craft's row at scale 1.

Keeping gameplay in abstract units means resizing, rotating or changing device pixel ratio cannot
disturb the simulation — only the projection changes.

### Safe-path validation

`js/generator.js` is the piece worth reading. A chunk is only allowed into the world after a sweep
proves it traversable:

1. Start from the set of lateral positions the craft could occupy entering the chunk.
2. Step through the chunk in small depth slices. Each slice widens the set by how far the craft can
   steer over that depth, then removes everything hazards block, then clips to the tunnel walls.
3. If the set ever empties, the chunk is impossible and is rebuilt.
4. The set that survives to the far end is carried into the *next* chunk — which is what makes joins
   between chunks provably safe rather than merely plausible.

Two details make this sound rather than decorative. Steps are subdivided so a single widening can
never be larger than the narrowest hazard, which stops the reachable set from "jumping over" a
block. And moving hazards are reasoned about using their **swept** extent — every position they
could ever occupy — so timing hazards are conservative by construction and never require the player
to read a phase offset. Sliding gates and rotors are additionally sized so a static lane always
survives at both walls.

The validator assumes only 75% of the craft's top speed (`REACH_SAFETY`), so an accepted route always
leaves headroom rather than demanding frame-perfect steering. In 4,800 generated chunks the fallback
corridor is never needed.

### Collision

Depth tests are swept: an entity's `z` range for a frame is the union of where it was and where it
is, so nothing tunnels past the craft at high speed — verified down to 15 Hz frames at above maximum
run speed. Lateral tests use spans shrunk relative to what is drawn (`COLLISION.forgiveness`), so
visually tight passes are survivable. When several events land in one frame they resolve in a fixed
priority: lethal, stability-zero, damage, collectible, near miss.

### Performance

Obstacles, collectibles, particles and floating labels all come from fixed-capacity pools. The
particle pool recycles the oldest entry when saturated rather than allocating, so its array length is
constant. Chunks recycle their entities as they pass. Gradients are cached and rebuilt only on
resize. The device pixel ratio is capped at 2. HUD text updates at ~11 Hz and meters only when they
move enough to see, so a frame rarely touches layout.

### Long frames

`js/loop.js` splits an oversized frame into sub-steps of at most 1/45 s rather than applying it in
one jump, and discards anything beyond 250 ms as a stall. Combined with pausing on
`visibilitychange`, returning to a backgrounded tab cannot teleport the craft through a hazard.

---

## Project structure

```
index.html               markup for every screen and the HUD
manifest.webmanifest     PWA manifest
sw.js                    service worker (versioned cache, offline shell)
css/styles.css           all interface styling
js/
  main.js                entry point; wires the systems together
  game.js                state machine, run lifecycle, scoring
  loop.js                requestAnimationFrame driver, delta-time handling
  config.js              *** every balance value lives here ***
  world.js               live chunks, entity lifecycle, forward scroll
  generator.js           chunk selection + safe-path validation
  chunks.js              the handcrafted route templates
  obstacles.js           hazard/collectible entities and pools
  collisions.js          swept collision, pickups, near misses
  player.js              movement, phase energy, corridor clamping
  input.js               pointer / keyboard / on-screen control unification
  renderer.js            canvas drawing and screen effects
  particles.js           pooled particles and floating labels
  audio.js               synthesised sound effects and ambience
  storage.js             validated localStorage wrapper
  ui.js                  screens, HUD, toasts, settings
  pwa.js                 service worker registration and install prompt
  utils.js               shared maths and interval-set algebra
tools/
  serve.mjs              zero-dependency static server for local development
  audit.mjs              headless simulation audit (see below)
  make-icons.mjs         generates every PNG procedurally
icons/                   generated app icons and social card
```

## Local development

```bash
node tools/serve.mjs
```

Then open <http://localhost:8123/>. Any static server works — ES modules and the service worker both
refuse to run from `file://`, so opening `index.html` directly will not work.

Regenerate the icons after changing the palette:

```bash
node tools/make-icons.mjs
```

## Verification

The gameplay modules have no browser dependencies, so the whole simulation runs in Node:

```bash
node tools/audit.mjs --runs 12 --seconds 240
```

43 assertions across eight areas: route validity over 4,800 generated chunks (including an
independent re-verification sweep), conservative geometry for moving hazards, long autopiloted runs
with pool-growth limits, frame-rate independence at 30/60/144 Hz, collision reliability at maximum
speed and 15 Hz frames, phase energy rules, corridor clamping, and collision forgiveness. It exits
non-zero on failure and runs in CI before every deploy.

The audit includes a reference autopilot that plans a lane through the corridor ahead. It is
deliberately unsophisticated — its job is to demonstrate that generated routes are survivable, not
to play well.

## Deployment to GitHub Pages

The repository root *is* the site; there is no build step.

1. Push to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. The included workflow (`.github/workflows/deploy.yml`) runs the audit and publishes on every push
   to `main`.

To publish without Actions, set Pages to deploy from the `main` branch root instead.

The game works from a project subdirectory (`https://user.github.io/blackbox-courier/`) with no
changes: every asset path is relative, and the service worker and manifest resolve their scope from
their own URL. `.nojekyll` is included so nothing is filtered on publish.

## PWA notes

- The service worker uses a versioned cache name (`CACHE_VERSION` in `sw.js`). **Bump it on every
  deploy** — old caches are deleted on activate, and a new worker takes over immediately.
- Navigation requests are network-first with the cached shell as fallback; assets are cache-first
  and refreshed in the background. A returning player gets an instant load and the newest build on
  the following visit.
- Install is offered through `beforeinstallprompt` where supported; the button hides itself
  otherwise.
- Everything needed to play is precached, so the first load is the only one that needs a network.

## Balance configuration

All tuning lives in [`js/config.js`](js/config.js) — craft handling, phase drain and recharge,
stability drain and recovery, speed ramp, difficulty tiers, chunk pacing, score and multiplier
values, collision forgiveness, particle caps, audio levels and grade thresholds. Nothing
gameplay-affecting is hard-coded elsewhere.

Grade thresholds are calibrated against representative runs: a first attempt lands around 10k, a
competent two-minute run around 50k, and a strong four-to-five-minute run around 200k.

## Browser support

Modern evergreen browsers: Chrome/Edge 90+, Firefox 90+, Safari 15.4+, and their mobile equivalents.
Requires ES modules, `PointerEvent` and Canvas 2D. The Web Audio API, `navigator.vibrate`, service
workers and `beforeinstallprompt` are all treated as optional and degrade silently.

## Known limitations

- The tunnel is a perspective-projected 2D scene, not true 3D — hazards have depth but no vertical
  dimension.
- The craft moves horizontally only; vertical movement is deliberately out of scope for this
  release.
- Scores are local to the device. There is no account system and no online leaderboard by design.
- Install prompts are Chromium-only; iOS requires the manual "Add to Home Screen" flow.
- The reference autopilot in the audit is not a difficulty oracle — it validates survivability, not
  the balance curve.

## Future ideas

Daily seeded runs, alternative tunnel environments, challenge modifiers, an achievement system, a
shareable score card, local run history, ghost replays, and unlockable visual themes. The seeded
PRNG in `utils.js` already makes deterministic daily routes a small change.

## Licence

MIT.
