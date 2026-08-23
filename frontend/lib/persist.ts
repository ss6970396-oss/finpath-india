/**
 * localStorage-backed state for useSyncExternalStore.
 *
 * Reading persisted state inside an effect and calling setState causes a
 * cascading render and, worse, a hydration mismatch: the server has no
 * storage to read. useSyncExternalStore solves both — it renders the server
 * snapshot during hydration, then re-reads once mounted.
 *
 * getSnapshot must be referentially stable between reads or React re-renders
 * forever, so the parsed value is cached against the raw string.
 */

export type Store<T> = {
  subscribe: (onChange: () => void) => () => void;
  get: () => T;
  getServer: () => T;
  set: (value: T) => void;
};

export function createPersistedStore<T>(key: string, fallback: T): Store<T> {
  let cachedRaw: string | null | undefined;
  let cachedValue: T = fallback;
  const listeners = new Set<() => void>();

  function emit() {
    for (const l of listeners) l();
  }

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      // Another tab writing the same key should update this one too.
      window.addEventListener("storage", onChange);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onChange);
      };
    },

    get() {
      try {
        const raw = localStorage.getItem(key);
        if (raw !== cachedRaw) {
          cachedRaw = raw;
          cachedValue = raw ? (JSON.parse(raw) as T) : fallback;
        }
        return cachedValue;
      } catch {
        // unavailable or corrupt storage — behave as if unset
        return fallback;
      }
    },

    getServer() {
      return fallback;
    },

    set(value) {
      try {
        const raw = JSON.stringify(value);
        localStorage.setItem(key, raw);
        cachedRaw = raw;
      } catch {
        // not persisted; the session still works
        cachedRaw = undefined;
      }
      cachedValue = value;
      emit();
    },
  };
}
