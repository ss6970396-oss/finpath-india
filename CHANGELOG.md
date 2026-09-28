# Changelog

All notable changes to FinPath India. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). The project isn't versioned yet, so entries are grouped by the body of work and its branch.

## [Unreleased] — Editorial UX refactor (`ux-refactor`)

A calm-editorial redesign ("a quiet library, not a shop"), done in 14 phases against `docs/refactor/BRIEF.md`. Each phase's commits and checks are in `docs/refactor/progress.md`. **No backend changes. No change to the `␟SOURCES␟` contract. `lib/` behaviour and every golden fixture unchanged.**

### Changed

- **The look, on every route.** Warm paper palette (the same 15 token names, new values); a `--fs-*` type scale with ten roles; body text at 16 px and long reading at 17 px / 1.6. Instrument Serif is kept for display and one hero figure per block. The primary button and the focus ring are the accent green. Overspending is shown in ink with a sentence, never red. (Phase 2)
- **Navigation.** Four items (Home · Actions · Ask · Profile) from one `NAV`, shared by a slim desktop header and a phone bottom bar with 44 px targets and safe-area padding. Spending and What-if are reached from Home and Actions. The header search field is removed. (Phase 3)
- **Landing.** A two-line serif hero with one CTA that follows the session, the rebuilt ₹3,500 → ₹10,870 diagnostic, and a trust line that describes the indexed corpus accurately. The specimen and the marketing bands are removed. (Phase 4)
- **Onboarding.** Each step is a real form (Enter advances), with "Step X of 8" and one accent bar, focus on the question, and inline validation instead of a disabled button. Finish goes straight to Home. (Phase 5)
- **Home.** One screen that answers "what should I do next?": a greeting and where you stand, the score with its main driver, the top three actions, this month's figures, an Ask box, and links onward. (Phase 6)
- **Actions (`/plan`).** Every recommendation is an `ActionCard` with a priority word, "~N min", its own destination, and Done with Undo. The header names the next step. (Phases 7, 13b)
- **Ask.**
  - One centred reading column with the composer pinned to the bottom.
  - Answers labelled in words ("Grounded in N sources", "Not from a verified source").
  - Sources in the margin at ≥ 1280 px, and an inspector as a side panel or bottom sheet.
  - Stop keeps the partial answer; failures show as calm notes.
  - `?q=` now prefills the composer instead of sending. (Phase 8)
- **Profile.** Four blocks (Personal, Income and spending, Goals, Security), each with its own Edit, Save and Cancel. (Phase 9)
- **Primitives.** The `quiet` button variant is renamed `ghost`. `Card`, `Metric` and `Notice` replace hand-rolled panels, and `/styleguide` shows every visual export. (Phase 10)
- **Legacy routes** (`/dashboard`, `/counselor`, `/simulator`, `/roadmap`, `/vault`) redirect with **308**, not 307. (Phase 11)
- **Footer.** The Account column follows the session, and every Sign out control lands on `/` with a full reload. (Owner decision)
- **Disclaimer placement.** One per page, written into `CLAUDE.md`; on `/ask` it stays beside the composer. (Owner decision)

### Added

- `ActionCard`, `Notice`, `SectionLabel`, `TrustLine`, `BareTextarea`, and `FooterLink` / `FooterAction` in `@/components/ui`.
- `lib/score.ts` (`scoreDriver`), `lib/action-meta.ts` (the minute values are **DRAFT**), `lib/account-storage.ts`, `lib/safe-next.ts`. All are new pure functions with tests; the suite went from 234 to 267 tests.
- Per-account browser storage (`finpath.*:<userId>`), with a one-time migration of the old global keys. (Phase 9)
- `useRequestSpending()`, `useSignOut()`, `useMediaQuery()`.
- New docs in `docs/refactor/`:
  - `01-audit.md`, `progress.md`, `visual-qa.md`, `a11y-walkthrough.md`;
  - `diagrams.md`, `before-after.md`, `MIGRATION.md`;
  - `14-feature-parity.md`, `screenshots.md`.

### Fixed

- The what-if chart tooltip ignored the step-up slider (B-1).
- A chat generation failure or 429 rendered as a grounded answer (B-2); a network error wiped the partial answer (B-3).
- "Try it with a sample file" appeared to do nothing (B-4). The example month had no way to turn it on, yet was fetched on every route (B-5).
- Legacy redirects were temporary (B-6).
- Profile, plan ticks and the score history leaked between device accounts in one browser (B-7).
- `?next=` was dropped at sign-up (B-8).
- `/plan`, `/spending` and `/sources` had no next step visible on a phone. (13b)

### Performance

- The primitive barrel now tree-shakes (`"sideEffects": ["*.css"]` in `package.json`). The landing page's JavaScript went from **300 to 210 kB gzip**, and the auth pages about the same.
- The Tooltip and Toast providers moved out of the root layout.
- `/api/spending` is fetched only on screens that show figures, once, after the session resolves. Before, it was fetched on every route, and twice on app screens.
- The what-if chart (Recharts) loads on demand: `/what-if` went from **408 to 280 kB gzip**.

### Accessibility

- An accent focus ring on every focus stop; 44 px targets throughout; tab panels focusable with a visible ring.
- Full keyboard walkthrough: skip link, menu, dialogs, sheets, segmented controls. (Phase 12)

### Removed

- `lib/categories.ts` (no importers; it referenced deleted tokens).
- Unused dependencies: `motion`, `tw-animate-css`, `class-variance-authority`, `shadcn`.
- The landing specimen and marketing sections, the onboarding "ready" screen, and the header search field. Each was a recorded decision; `14-feature-parity.md` says where their content went.

### Deferred

- The minute values in `lib/action-meta.ts` await the owner's review.
- Screenshots are listed in `docs/refactor/screenshots.md` but not captured, and the README carries placeholders.
- Phase 15 (new features) is specified in `docs/features/BRIEF.md` and hasn't started.
