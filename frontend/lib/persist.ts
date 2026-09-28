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

/* --------------------------------------------------------- per account */

export type ScopedStore<T> = {
  subscribe: (onChange: () => void) => () => void;
  /** The value for one account. `null` (signed out) reads the fallback. */
  getFor: (scope: string | null) => T;
  getServer: () => T;
  /** Writes for one account. Writing with no account is a no-op. */
  setFor: (scope: string | null, value: T) => void;
};

/**
 * A persisted value per signed-in account: `base:<scope>` in localStorage.
 *
 * Same contract as createPersistedStore, with the key chosen at read time
 * rather than at creation, so the store can follow whoever is signed in
 * without being rebuilt. getFor must return a referentially stable value
 * for unchanged storage, so the parsed value is cached per scope against
 * its raw string. See lib/account-storage.ts for why the scope exists.
 */
export function createScopedStore<T>(base: string, fallback: T): ScopedStore<T> {
  const cache = new Map<string, { raw: string | null; value: T }>();
  const listeners = new Set<() => void>();
  const keyFor = (scope: string) => `${base}:${scope}`;

  function emit() {
    for (const l of listeners) l();
  }

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      window.addEventListener("storage", onChange);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onChange);
      };
    },

    getFor(scope) {
      if (!scope) return fallback;
      try {
        const raw = localStorage.getItem(keyFor(scope));
        const hit = cache.get(scope);
        if (hit && hit.raw === raw) return hit.value;
        const value = raw ? (JSON.parse(raw) as T) : fallback;
        cache.set(scope, { raw, value });
        return value;
      } catch {
        return fallback;
      }
    },

    getServer() {
      return fallback;
    },

    setFor(scope, value) {
      if (!scope) return;
      let raw: string | null = null;
      try {
        raw = JSON.stringify(value);
        localStorage.setItem(keyFor(scope), raw);
      } catch {
        // not persisted; the session still works
      }
      cache.set(scope, { raw, value });
      emit();
    },
  };
}
