// Tiny event bus: the core announces what changed and whoever cares subscribes.
// Deliberately small - this is how the core stays ignorant of portals, of the editor and
// of the DOM. `on` returns the function that unsubscribes.
const listeners = new Map();

export function on(type, handler) {
  let set = listeners.get(type);
  if (!set) { set = new Set(); listeners.set(type, set); }
  set.add(handler);
  return function off() { set.delete(handler); };
}

export function off(type, handler) {
  const set = listeners.get(type);
  if (set) set.delete(handler);
}

export function emit(type, detail) {
  const set = listeners.get(type);
  if (!set) return;
  for (const handler of [...set]) handler(detail);
}
