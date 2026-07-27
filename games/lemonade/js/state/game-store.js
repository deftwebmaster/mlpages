// Single authoritative in-memory game state. Systems mutate it via setState();
// screens read it via getState() and re-render in response to subscribe().
// Kept intentionally framework-free per the project's vanilla-JS requirement.

let state = null;
const listeners = new Set();
let notifyScheduled = false;

export function initStore(initialState) {
  state = initialState;
  scheduleNotify();
}

export function getState() {
  return state;
}

/**
 * @param {(state: object) => object|void} updater Mutate state in place, or
 *   return a new object to replace it entirely.
 * @param {{ silent?: boolean }} [options] Pass silent:true to skip notifying
 *   subscribers (used for high-frequency live-day internals).
 */
export function setState(updater, options = {}) {
  const result = updater(state);
  if (result !== undefined) state = result;
  if (!options.silent) scheduleNotify();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function scheduleNotify() {
  if (notifyScheduled) return;
  notifyScheduled = true;
  queueMicrotask(() => {
    notifyScheduled = false;
    for (const listener of listeners) listener(state);
  });
}
