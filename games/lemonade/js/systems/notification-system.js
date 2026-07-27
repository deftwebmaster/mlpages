// Lightweight pub/sub for cross-cutting toast/alert messages. Kept separate
// from game-store since notifications are ephemeral UI events, not save data.

const listeners = new Set();

export function notify(message, type = 'info') {
  const event = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, message, type };
  for (const listener of listeners) listener(event);
  return event;
}

export function onNotify(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
