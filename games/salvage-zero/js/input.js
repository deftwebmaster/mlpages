// Unified input state polled once per frame by ship.js / game.js.
// Supports desktop keyboard and mobile touch (virtual joystick + buttons).

export class InputManager {
  constructor() {
    this.rotate = 0;   // -1..1
    this.thrust = false;
    this.brake = false;
    this.fire = false;
    this.tractor = false;
    this.pausePressed = false; // edge-triggered, consumed by game.js

    this._keys = new Set();
    this._joystickActive = false;
    this._joystickId = null;
    this._joystickOrigin = { x: 0, y: 0 };
    this._joystickRotate = 0;

    this._bindKeyboard();
  }

  _bindKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      this._keys.add(e.key.toLowerCase());
      if (e.key === 'Escape') this.pausePressed = true;
    }, { passive: false });
    window.addEventListener('keyup', (e) => {
      this._keys.delete(e.key.toLowerCase());
    });
    window.addEventListener('blur', () => this._keys.clear());
  }

  bindJoystick(zoneEl, knobEl) {
    const maxRadius = 52;
    const start = (e) => {
      if (this._joystickId !== null) return;
      const touch = e.changedTouches ? e.changedTouches[0] : e;
      this._joystickId = touch.identifier ?? 'mouse';
      const rect = zoneEl.getBoundingClientRect();
      this._joystickOrigin = { x: touch.clientX, y: touch.clientY };
      this._joystickActive = true;
      knobEl.style.transition = 'none';
      e.preventDefault();
    };
    const move = (e) => {
      if (!this._joystickActive) return;
      const touches = e.changedTouches ? Array.from(e.changedTouches) : [e];
      const touch = touches.find(t => (t.identifier ?? 'mouse') === this._joystickId);
      if (!touch) return;
      let dx = touch.clientX - this._joystickOrigin.x;
      let dy = touch.clientY - this._joystickOrigin.y;
      const mag = Math.hypot(dx, dy);
      if (mag > maxRadius) {
        dx = dx / mag * maxRadius;
        dy = dy / mag * maxRadius;
      }
      knobEl.style.transform = `translate(${dx}px, ${dy}px)`;
      this._joystickRotate = Math.max(-1, Math.min(1, dx / maxRadius));
      e.preventDefault();
    };
    const end = (e) => {
      const touches = e.changedTouches ? Array.from(e.changedTouches) : [e];
      const touch = touches.find(t => (t.identifier ?? 'mouse') === this._joystickId);
      if (!touch && e.type !== 'mouseup') return;
      this._joystickActive = false;
      this._joystickId = null;
      this._joystickRotate = 0;
      knobEl.style.transition = 'transform 0.12s ease-out';
      knobEl.style.transform = 'translate(0px, 0px)';
    };

    zoneEl.addEventListener('touchstart', start, { passive: false });
    zoneEl.addEventListener('touchmove', move, { passive: false });
    zoneEl.addEventListener('touchend', end, { passive: false });
    zoneEl.addEventListener('touchcancel', end, { passive: false });
    zoneEl.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
  }

  bindButton(el, onDown, onUp) {
    const down = (e) => { e.preventDefault(); onDown(); };
    const up = (e) => { e.preventDefault(); onUp(); };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up, { passive: false });
    el.addEventListener('touchcancel', up, { passive: false });
    el.addEventListener('mousedown', down);
    el.addEventListener('mouseup', up);
    el.addEventListener('mouseleave', up);
  }

  update() {
    const k = this._keys;
    let rotate = 0;
    if (k.has('a') || k.has('arrowleft')) rotate -= 1;
    if (k.has('d') || k.has('arrowright')) rotate += 1;
    if (this._joystickActive) rotate = this._joystickRotate;
    this.rotate = rotate;

    this.thrust = this._mobileThrust || k.has('w') || k.has('arrowup');
    this.brake = this._mobileBrake || k.has('s') || k.has('arrowdown');
    this.fire = this._mobileFire || k.has(' ');
    this.tractor = this._mobileTractor || k.has('shift');
  }

  consumePause() {
    const v = this.pausePressed;
    this.pausePressed = false;
    return v;
  }

  setMobileFlag(name, value) {
    this['_mobile' + name] = value;
  }
}
