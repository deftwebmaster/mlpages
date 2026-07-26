/**
 * requestAnimationFrame driver.
 *
 * Long frames — a backgrounded tab, a slow first paint, a GC pause — are broken
 * into sub-steps rather than applied at once, so a hitch can never teleport the
 * craft through a hazard. Anything beyond `maxCatchUp` is discarded outright.
 */

const MAX_STEP = 1 / 45;      // largest single physics step, seconds
const MAX_CATCH_UP = 0.25;    // frames longer than this are treated as a stall

export class Loop {
  constructor(game) {
    this.game = game;
    this.running = false;
    this.last = 0;
    this.fps = 60;
    this._acc = 0;
    this._frames = 0;
    this._tick = this._tick.bind(this);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this._tick);
  }

  stop() {
    this.running = false;
  }

  /** Discard the elapsed time since the last frame (used when resuming). */
  resync() {
    this.last = performance.now();
  }

  _tick(now) {
    if (!this.running) return;
    requestAnimationFrame(this._tick);

    let dt = (now - this.last) / 1000;
    this.last = now;

    if (!Number.isFinite(dt) || dt <= 0) return;
    if (dt > MAX_CATCH_UP) dt = MAX_STEP;

    // Rolling FPS estimate, used only for diagnostics.
    this._acc += dt;
    this._frames++;
    if (this._acc >= 0.5) {
      this.fps = this._frames / this._acc;
      this._acc = 0;
      this._frames = 0;
    }

    let remaining = dt;
    let guard = 0;
    while (remaining > 0 && guard++ < 8) {
      const step = Math.min(remaining, MAX_STEP);
      this.game.update(step);
      remaining -= step;
    }

    this.game.render(dt);
  }
}
