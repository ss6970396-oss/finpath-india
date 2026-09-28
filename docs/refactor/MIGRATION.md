# Migration notes — editorial UX refactor

What changes for anyone upgrading a checkout, a deployed build, or a browser that has used FinPath before: storage, routes and behaviour, components, deleted files, tokens and dependencies. `14-feature-parity.md` says where each of the 71 Phase 1 features lives now.

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

---

## Routes and behaviour

**No URL changed.** Every path that resolved before still resolves.

| Route | What changed |
| --- | --- |
| `/dashboard`, `/counselor`, `/simulator`, `/roadmap`, `/vault` | Now **308 permanent** (`permanentRedirect`), was 307. Caches and search engines will now remember the new target. |
| `/plan` | Labelled **Actions** in the nav and titled "Your actions". The URL is unchanged. |
| `/ask?q=…` | **Prefills the composer and no longer sends.** Anything that linked here expecting an automatic answer now needs the student to press Enter. |
| `/onboarding` | Finish goes straight to `/home`. The "Your FinPath is ready" screen is gone. |
| `/` | The specimen, the three-step explainer, the score weights and the capability grid are gone. The weights live at `/sources#method`. There's a new client island, the purchase diagnostic. |
| `/spending` | "Try it with a sample file" now loads the sample, labelled "A sample statement". Before, it only previewed it. |
| `/home` | "Use an example month" is the only way to turn on the generated month (`source: "example"`), and it's always labelled. |

**Navigation:** Home · Actions · Ask · Profile, from one `NAV` in `app/components/nav.ts`. Spending and What-if moved out of the nav and are reached from Home and Actions (`SecondaryLinks`). The header's "Ask a question…" field was removed.

**API traffic:** `/api/spending` used to be requested on every route, including landing, auth and 404, and twice per app screen. Now it's requested only by the `(app)` shell and the landing diagnostic, only after the session resolves, and once. A deployment behind a strict rate limit sees fewer calls.

## Components

Everything is still imported from the `@/components/ui` barrel.

| Change | Detail |
| --- | --- |
| **New** `ActionCard` (`action-card.tsx`) | Replaces the old `ActionCard` that lived in `insight.tsx`. The props differ: `title`, `explanation`, `priority`, `estimatedMinutes`, `action`, `done`, `primary`. Its data comes from `lib/action-meta.ts`, and the minute values are marked DRAFT for review. |
| **New** `Notice` | A calm inline note, `neutral` or `critical`. It replaces six hand-rolled alert panels. |
| **New** `SectionLabel` | The uppercase `type-eyebrow` section heading. |
| **New** `TrustLine`, `CORPUS_PHRASE`, `TRUST_LINE` (`trust.tsx`) | The one wording of what the corpus is. |
| **New** `BareTextarea` | The coach's composer, with the same control styles as `Input`. |
| **Renamed** Button variant `quiet` → **`ghost`** | Any external code passing `variant="quiet"` must change it. |
| **Resized** `Button` | `md` is 44 px tall (was 40). `sm` still draws at 32 px, with a 44 px hit area. `Segmented`, `Tab`, the `Slider` box and the Modal and Sheet close buttons are all 44 px. |
| **Moved** `TooltipProvider`, `ToastProvider` | From the root layout into the `(app)` shell. A new page outside `(app)` that calls `useToast()` must mount its own `ToastProvider`, as `/styleguide` does. |
| **New** `useRequestSpending()` (`FinPathProvider`) | A screen that shows `/api/spending` figures outside the `(app)` shell must call it, or `data` stays null and `loading` stays true. |
| **New** app-level files | `app/components/{Diagnostic,HeroCta,PlanActionCard,SecondaryLinks}.tsx`, `app/components/useMediaQuery.ts`, `app/providers/api-base.ts` |
| **New** `lib/` files | `score.ts` (`scoreDriver`), `action-meta.ts`, `account-storage.ts`, `safe-next.ts`, each with tests. `lib/plan.ts`, `lib/finance.ts`, `lib/csv.ts` and `lib/onboarding.ts` are unchanged. |

## Deleted files

| File | Why |
| --- | --- |
| `frontend/lib/categories.ts` | It had no importers, and it referenced `--color-data-*`, `ink-faint` and `rule-strong`, tokens that no longer existed. |

The old `ActionCard` export in `components/ui/insight.tsx` was removed as well. `Insight` itself stays.

## Tokens

**Colour** stays at fifteen tokens, and the palette moved to warm paper. `npm run check-contrast` asserts every pairing, and a new assertion checks the accent focus ring on every ground.

| Token | Before | After |
| --- | --- | --- |
| `--color-canvas` | `#fcfcfb` | `#fbf9f4` |
| `--color-surface` | `#f6f6f4` | `#f4f0e6` |
| `--color-surface-sunken` | `#efefec` | `#ece7db` |
| `--color-ink` | `#2a2a2e` | `#1c1b19` |
| `--color-ink-secondary` | `#5a5a62` | `#4f4b44` |
| `--color-ink-muted` | `#64646c` | `#5e5a52` |
| `--color-ink-disabled` | `#a8a8ae` | `#a8a298` |
| `--color-line` | `#e4e4e0` | `#e4ded1` |
| `--color-line-strong` | `#2a2a2e` | `#1c1b19` |
| `--color-accent` | `#1f5f4f` | unchanged |
| `--color-accent-wash` | `#eef3f1` | `#eaf0e8` |
| `--color-critical` / `-wash` | `#a34a45` / `#f7efee` | unchanged / `#f6ece6` |
| `--color-positive` / `-wash` | `#4c5d50` / `#f0f2ef` | unchanged / `#edefe6` |

**Roles of colour:**
- The primary button is now an **accent fill**; it was ink.
- The focus ring is **accent**; it was `line-strong`.
- Overspending renders in ink with a sentence, never in critical.

**Type**: a new `--fs-*` scale, and ten roles over it.

| Role | Before | After |
| --- | --- | --- |
| `type-body` | 15 px | **16 px** |
| `type-label` | 13 px | **14 px** |
| `type-eyebrow` | 11 px | **12 px** |
| `type-reading` | (none) | **new**, 17 px / 1.6, for answers and explanations |
| `type-figure` | (none) | **new**, Instrument Serif, clamp 40→56 px. One hero figure per block, never in a column. |
| `Money` sizes | hard-coded | `amount-sm`, `amount-md` and `amount-lg` utilities; `xl` is `type-figure` |

**Layout:**
- The `margin-layout` gutter opens at **1280 px** (was 1024).
- New: `--container-annotated`.
- New utilities: `safe-bottom`, `nav-clearance`, `above-nav`, `gutter-offset`.
- `--radius-*` and `--shadow-*` stay pinned to 0.

## Dependencies and build

- **Removed:** `motion`, `tw-animate-css`, `class-variance-authority`, `shadcn`. None was imported. `components.json` (the shadcn CLI config) is kept.
- **Added to `package.json`:** `"sideEffects": ["*.css"]`. It is what lets the barrel tree-shake, taking the landing page from 300 to 207 kB gzip. A module that must run code on import has to be added to that list.
- **Run `npm install`** after pulling, so `node_modules` loses the four packages.
