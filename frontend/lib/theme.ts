/**
 * Theme resolution for the Settings triad in Section 6.7: System / Light / Dark.
 *
 * Only one dark token block exists (`.dark` in globals.css). "System" is not a
 * third set of values — it is resolved here to one of the other two, which is
 * why the stylesheet never has to duplicate the palette under a
 * prefers-color-scheme media query.
 */

export type Theme = "system" | "light" | "dark";

export const THEME_KEY = "fp-theme";

/** Runs before first paint in app/layout.tsx. Kept small and dependency-free. */
export const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem("${THEME_KEY}")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export function resolveTheme(theme: Theme): "light" | "dark" {
  if (theme !== "system") return theme;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function readTheme(): Theme {
  if (typeof window === "undefined") return "system";
  try {
    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // Private mode or blocked storage: fall through to the system default.
  }
  return "system";
}

export function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveTheme(theme) === "dark");
  try {
    window.localStorage.setItem(THEME_KEY, theme);
  } catch {
    // Non-fatal: the class is already applied for this session.
  }
  listeners.forEach((notify) => notify());
}

/**
 * localStorage is an external store, so the toggle reads it through
 * useSyncExternalStore rather than copying it into state inside an effect.
 * `storage` covers another tab changing the setting; the listener set covers
 * this one.
 */
const listeners = new Set<() => void>();

export function subscribeTheme(notify: () => void): () => void {
  listeners.add(notify);
  window.addEventListener("storage", notify);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", notify);
  };
}

/** The server has no localStorage; the blocking script settles the real value. */
export function getServerTheme(): Theme {
  return "system";
}
