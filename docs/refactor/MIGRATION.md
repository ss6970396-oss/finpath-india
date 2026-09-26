# Migration notes — editorial UX refactor

What changes for anyone upgrading a checkout, a deployed build, or a browser that has used FinPath before. Phase 14 extends this file with routes, components, deleted files and tokens.

---

## Browser storage is now per account (Phase 9)

### What changed

The declared profile, the plan's ticked actions and the one review snapshot used to live under global `localStorage` keys. Every device account in the same browser read and wrote the same three keys, so a second account inherited the first account's figures, its ticks and its score history, and skipped onboarding (audit B-7).

They are now scoped by the signed-in account's id:

| Before | After |
| --- | --- |
| `finpath.profile` | `finpath.profile:<userId>` |
| `finpath.plan` | `finpath.plan:<userId>` |
| `finpath.review` | `finpath.review:<userId>` |

These are unchanged: `finpath.accounts` (the device accounts and their PBKDF2 verifiers) and `finpath.session`. Uploaded statements are still never written to storage.

### The one-time migration

`lib/account-storage.ts` `migrateLegacyKeys()` runs from `AuthProvider`:

- **when an existing session resolves on load.** A student who was signed in when the new build shipped keeps their data with no action.
- **on sign-in.** A student who was signed out claims the data the next time they sign in.

For each of the three legacy keys that exists:

1. It is copied to the account's scoped key, unless that account already has its own value there. Existing scoped data is never overwritten.
2. The legacy key is deleted, whether or not it was copied.

So legacy data is claimed **exactly once**, by the first account resolved or signed in after the upgrade. Running it again does nothing.

**Sign-up never migrates.** A brand-new account is a new person, and handing it whatever the browser held before is exactly the bug being fixed.

### Edge cases worth knowing

- **Several accounts shared one browser before the upgrade.** Their data was already mixed together under the global keys. There was no record of whose figures were whose, so the first account in after the upgrade gets all of it. The others start clean and go through onboarding.
- **Older unrelated keys.** Keys with a hyphen, `finpath-profile` and `finpath-roadmap`, come from a pre-rebuild version and have not been read by any code for several releases. The migration doesn't touch them; a browser that has them can clear them safely.
- **Private windows or blocked storage.** The migration is best-effort and silently does nothing. The session still works for that tab, as it did before.

### Tests

`frontend/lib/account-storage.test.ts`:
- migration moves all keys and removes the originals
- data is claimed once, so a second account gets nothing
- running it twice changes nothing
- it never overwrites existing scoped data
- it does nothing without legacy data
- it leaves the accounts and session keys alone
- the per-account store keeps two accounts apart
- a new account reads the fallback
- signed out, the store neither reads nor writes
- the store returns stable references
- the store reads data the migration wrote

The file also covers `safeNext`.

### For developers

- `lib/persist.ts` gains `createScopedStore(base, fallback)`, with `getFor(scope)` and `setFor(scope, value)`. `createPersistedStore` is unchanged.
- `FinPathProvider` reads the session from `AuthProvider`. To avoid a circular import, the API base moved into `app/providers/api-base.ts`; `FinPathProvider` still re-exports it as `API`, and call sites don't change.
- `hasCompletedProfile(userId)` (in `FinPathProvider`) lets the sign-in form route correctly in the same event that established the session.

## `?next=` is carried through sign-up and onboarding (Phase 9, B-8)

`/login?next=/plan` → "Create an account" → sign-up → onboarding → `/plan`. The route guard's redirect to onboarding carries `next` too. Every `next` passes through `lib/safe-next.ts` `safeNext()`, which accepts only same-site paths and rejects other origins, protocol-relative `//`, backslash tricks, and the auth and onboarding pages themselves, which would loop.
