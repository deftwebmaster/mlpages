/**
 * loop.js — requestAnimationFrame driver.
 *
 * Two responsibilities beyond calling update and render:
 *
 *  1. Clamping delta time. Coming back from a backgrounded tab hands you a
 *     delta measured in seconds, which would teleport every hazard across the
 *     board in a single frame. The clamp makes that impossible.
 *  2. Sub-stepping. A slow frame is split into several bounded steps so
 *     collision detection cannot tunnel through a hazard, which keeps
 *     behaviour consistent between a 120Hz phone and a struggling laptop.
 */

import { CONFIG } from './config.js';

export class GameLoop {
  constructor(update, render) {
    this.update = update;
    this.render = render;
    this.running = false;
    this.lastTime = 0;
    this.rafId = 0;
    this.frame = this.frame.bind(this);

    this.fps = 60;
    this.fpsAccumulator = 0;
    this.fpsFrames = 0;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = 0;
  }

  /** Call after any pause so the first frame back does not see a huge gap. */
  resetClock() {
    this.lastTime = performance.now();
  }

  frame(now) {
    if (!this.running) return;
    this.rafId = requestAnimationFrame(this.frame);

    let delta = (now - this.lastTime) / 1000;
    this.lastTime = now;

    // Guard against negative or absurd deltas from clock changes and tab
    // restoration. Anything over a quarter second is treated as a stall and
    // simply skipped rather than simulated.
    if (!Number.isFinite(delta) || delta < 0) delta = 0;
    if (delta > 0.25) delta = CONFIG.world.maxDelta;

    this.fpsAccumulator += delta;
    this.fpsFrames++;
    if (this.fpsAccumulator >= 0.5) {
      this.fps = this.fpsFrames / this.fpsAccumulator;
      this.fpsAccumulator = 0;
      this.fpsFrames = 0;
    }

    const maxStep = CONFIG.world.maxDelta;
    let remaining = delta;
    let guard = 0;
    while (remaining > 0 && guard < 8) {
      const step = Math.min(remaining, maxStep);
      this.update(step);
      remaining -= step;
      guard++;
    }

    this.render(delta);
  }
}
