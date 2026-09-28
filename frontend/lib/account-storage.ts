/**
 * Per-account browser storage, and the one-time migration into it.
 *
 * THE BUG THIS FIXES (audit B-7). The declared profile, the plan's ticks
 * and the review snapshot were stored under global keys —
 * `finpath.profile`, `finpath.plan`, `finpath.review` — so a second device
 * account in the same browser inherited the first account's figures, its
 * ticked actions and its score history, and skipped onboarding entirely.
 *
 * Each of those keys is now suffixed with the signed-in account's id:
 * `finpath.profile:<userId>`.
 *
 * THE MIGRATION. Data written before this change sits under the bare keys
 * and belongs to whoever was using the browser. The first account to be
 * RESOLVED OR SIGNED IN after the upgrade claims it: each legacy key is
 * copied to that account's scoped key (unless the account already has its
 * own) and the legacy key is removed, so it can be claimed exactly once.
 * A brand-new account created by SIGN-UP never claims it — a new account
 * is a new person, and handing them a stranger's figures is the bug.
 *
 * Everything here takes its storage as a parameter, so it is testable in
 * Node and cannot touch `localStorage` during a server render.
 */

/** The subset of the Web Storage API this module needs. */
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** The keys that hold one account's own data. */
export const ACCOUNT_KEYS = [
  "finpath.profile",
  "finpath.plan",
  "finpath.review",
] as const;

export type AccountKey = (typeof ACCOUNT_KEYS)[number];

/** `finpath.profile` + `abc` -> `finpath.profile:abc`. */
export function scopedKey(base: string, userId: string): string {
  return `${base}:${userId}`;
}

/**
 * Move legacy unscoped data into `userId`'s keys. Idempotent: once the
 * legacy keys are gone, running it again does nothing. Never overwrites
 * data the account already has. Returns the base keys that were copied.
 */
export function migrateLegacyKeys(
  storage: StorageLike,
  userId: string,
  keys: readonly string[] = ACCOUNT_KEYS,
): string[] {
  const moved: string[] = [];
  for (const base of keys) {
    const legacy = storage.getItem(base);
    if (legacy === null) continue;
    const target = scopedKey(base, userId);
    if (storage.getItem(target) === null) {
      storage.setItem(target, legacy);
      moved.push(base);
    }
    // Removed either way: legacy data is claimed exactly once, so a later
    // account in the same browser can never pick it up.
    storage.removeItem(base);
  }
  return moved;
}

/** Best-effort wrapper for the browser: storage can throw (private mode). */
export function migrateInBrowser(userId: string): string[] {
  try {
    return migrateLegacyKeys(window.localStorage, userId);
  } catch {
    return [];
  }
}
