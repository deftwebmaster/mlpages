const MAX_DT = 1 / 20; // clamp to avoid huge steps after tab-away

export class GameLoop {
  constructor(updateFn) {
    this.updateFn = updateFn;
    this.running = false;
    this.lastTime = 0;
    this._frame = this._frame.bind(this);
    this.rafId = null;

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseForVisibility();
      }
    });
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.rafId = requestAnimationFrame(this._frame);
  }

  stop() {
    this.running = false;
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  pauseForVisibility() {
    this.onVisibilityPause?.();
  }

  _frame(now) {
    if (!this.running) return;
    let dt = (now - this.lastTime) / 1000;
    this.lastTime = now;
    dt = Math.min(dt, MAX_DT);
    this.updateFn(dt);
    this.rafId = requestAnimationFrame(this._frame);
  }
}
