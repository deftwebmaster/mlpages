// Unifies mouse/touch (via Pointer Events) into a small command set:
// tap, doubletap, dragstart/dragmove/dragend, pinch, wheelzoom, longpress.
// Keeps camera/game/ui logic platform-independent.

const TAP_MOVE_THRESHOLD = 6; // px
const LONGPRESS_MS = 480;
const DOUBLETAP_MS = 320;

export class InputController {
  constructor(element, handlers) {
    this.element = element;
    this.handlers = handlers;
    this.pointers = new Map();
    this.dragging = false;
    this.dragPointerId = null;
    this.dragStart = null;
    this.lastPoint = null;
    this.longPressTimer = null;
    this.lastTap = null;
    this.pinch = null;

    element.style.touchAction = 'none';
    element.addEventListener('pointerdown', this.onPointerDown);
    element.addEventListener('pointermove', this.onPointerMove);
    element.addEventListener('pointerup', this.onPointerUp);
    element.addEventListener('pointercancel', this.onPointerUp);
    element.addEventListener('wheel', this.onWheel, { passive: false });
  }

  getRelativePoint(e) {
    const rect = this.element.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  clearLongPress() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  onPointerDown = (e) => {
    try { this.element.setPointerCapture(e.pointerId); } catch { /* not all pointer sources support capture */ }
    const pt = this.getRelativePoint(e);
    this.pointers.set(e.pointerId, pt);

    if (this.pointers.size === 2) {
      this.clearLongPress();
      this.dragging = false;
      const pts = Array.from(this.pointers.values());
      this.pinch = {
        startDist: distance(pts[0], pts[1]),
        center: midpoint(pts[0], pts[1]),
      };
      return;
    }

    if (this.pointers.size === 1) {
      this.dragPointerId = e.pointerId;
      this.dragStart = pt;
      this.lastPoint = pt;
      this.lastMoveTime = performance.now();
      this.dragging = false;
      this.clearLongPress();
      this.longPressTimer = setTimeout(() => {
        this.longPressTimer = null;
        this.handlers.onLongPress?.(pt);
        this.dragPointerId = null; // suppress tap/drag after a long press fires
      }, LONGPRESS_MS);
    }
  };

  onPointerMove = (e) => {
    if (!this.pointers.has(e.pointerId)) return;
    const pt = this.getRelativePoint(e);
    this.pointers.set(e.pointerId, pt);

    if (this.pinch && this.pointers.size === 2) {
      const pts = Array.from(this.pointers.values());
      const dist = distance(pts[0], pts[1]);
      const center = midpoint(pts[0], pts[1]);
      const scaleDelta = dist / this.pinch.startDist;
      this.handlers.onPinch?.({
        scaleDelta,
        cx: center.x,
        cy: center.y,
        dx: center.x - this.pinch.center.x,
        dy: center.y - this.pinch.center.y,
      });
      this.pinch.startDist = dist;
      this.pinch.center = center;
      return;
    }

    if (e.pointerId !== this.dragPointerId) return;
    const now = performance.now();
    const dtMs = Math.max(1, now - this.lastMoveTime);
    this.lastMoveTime = now;
    const dx = pt.x - this.lastPoint.x;
    const dy = pt.y - this.lastPoint.y;
    const totalDx = pt.x - this.dragStart.x;
    const totalDy = pt.y - this.dragStart.y;

    if (!this.dragging && Math.hypot(totalDx, totalDy) > TAP_MOVE_THRESHOLD) {
      this.dragging = true;
      this.clearLongPress();
      this.handlers.onDragStart?.(this.dragStart);
    }

    if (this.dragging) {
      this.handlers.onDragMove?.({ dx, dy, x: pt.x, y: pt.y, dtMs });
    }
    this.lastPoint = pt;
  };

  onPointerUp = (e) => {
    const wasDragPointer = e.pointerId === this.dragPointerId;
    this.pointers.delete(e.pointerId);

    if (this.pinch && this.pointers.size < 2) {
      this.pinch = null;
    }

    if (!wasDragPointer) return;
    this.clearLongPress();

    if (this.dragging) {
      this.handlers.onDragEnd?.();
    } else if (this.dragPointerId !== null) {
      const pt = this.lastPoint;
      const now = performance.now();
      if (this.lastTap && now - this.lastTap.time < DOUBLETAP_MS && distance(pt, this.lastTap.point) < 24) {
        this.handlers.onDoubleTap?.(pt);
        this.lastTap = null;
      } else {
        this.handlers.onTap?.(pt);
        this.lastTap = { time: now, point: pt };
      }
    }

    this.dragging = false;
    this.dragPointerId = null;
  };

  onWheel = (e) => {
    e.preventDefault();
    const pt = this.getRelativePoint(e);
    const factor = Math.pow(1.0015, -e.deltaY);
    this.handlers.onWheelZoom?.({ factor, x: pt.x, y: pt.y });
  };
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
