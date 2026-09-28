# Feature parity — the Phase 1 inventory, ticked (Phase 14)

**Date:** 2026-09-28 · **Branch:** `ux-refactor` · **Checklist:** `01-audit.md` §2, 71 items

Every item from the Phase 1 inventory, with where it lives now and how that was established.

| Mark | Meaning |
| --- | --- |
| **✅ live** | Asserted in the Phase 14 run: headless Chrome against `next dev`, with a throwaway device account. 62 assertions, all passing. |
| **✅ Pn** | Checked live in the named phase's run and untouched since, or touched only by a later phase that re-checked it. |
| **✅ code** | Present in code, but not exercised live, because it needs a state the run couldn't create honestly: a Gemini call, a malformed file, a second visit on another day. The file is named. |
| **↻** | Changed on purpose, by a recorded decision. Where it went is stated. |
| **✗** | Removed on purpose, by a recorded decision. Where its content went is stated. |

**Result:** 66 items present (✅); 8 of them now take a different form by a recorded decision (✅ ↻). 3 more were replaced outright by a decision (↻: 28, 55, 61), and 2 were removed by a decision (✗: 2, 19). **Nothing was lost without a decision.**

## Public and trust

| # | Item | Now | Where |
| --- | --- | --- | --- |
| 1 | Landing explains the product; CTA; session-aware header | ✅ live | `/`: "Find my next step". The header shows Sign in / Get started when signed out and Open FinPath when signed in. The CTA follows the session (Phase 4). |
| 2 | Landing specimen preview | ✗ | Removed in Phase 4 (§11 plan, approved). The rebuilt diagnostic (₹3,500 → ₹10,870, labelled as an example) is now the landing's one worked example. |
| 3 | How the score is weighted (40/30/15/15) | ✅ live, moved | `/sources#method` → "The health score" ("Forty points for the savings rate…"). It left the landing in Phase 4. |
| 4 | `/sources` live library with loading, error and empty states | ✅ live | `/sources` lists `collegestudents` from `/api/sources`. |
| 5 | How an answer is put together, `#method`, what FinPath won't do | ✅ live | `/sources` |
| 6 | `DisclaimerNote` variants | ✅ live | Advice: `/home`, the footer, under the coach composer. Projection: the landing diagnostic and `/what-if`. Example: `/home` when the example month is on. See the Phase 13 note on per-answer and per-stage placement. |
| 7 | Skip-to-content on every shell | ✅ live | Public and app shells. Auth screens: none by design, since only the wordmark comes before the form (`a11y-walkthrough.md`). |

## Accounts

| # | Item | Now | Where |
| --- | --- | --- | --- |
| 8 | Sign up: name, email, a password of 10+ characters, PBKDF2 verifier | ✅ live | `/signup`. `lib/auth.ts` is unchanged. |
| 9 | Sign in with `?next=`; generic failure; not onboarded → onboarding | ✅ P9 | `LoginForm.tsx`, `lib/safe-next.ts`. B-8 carries `next` through sign-up and onboarding too. |
| 10 | Forgot password never reveals an account; device-mode notice | ✅ live | `/forgot-password` |
| 11 | `DeviceAccountNote` on auth screens and in the account menu | ✅ live | Auth screens ("this browser"); the account menu's note. |
| 12 | Route guard: `/login?next=`, `/onboarding`, waits for resolved | ✅ live | Signed out, `/home` → `/login?next=%2Fhome`. `app/(app)/layout.tsx` |
| 13 | Sign out (menu and `/profile`) | ✅ live | The account menu, and `/profile` → Security |

## Onboarding

| # | Item | Now | Where |
| --- | --- | --- | --- |
| 14 | Eight steps, "Step X of 8" | ✅ live | `/onboarding`. A full 8-step run reached `/home` in Phases 10–14. |
| 15 | Running totals under each step | ✅ P10 | `Running` → `Metric` in `app/onboarding/page.tsx` |
| 16 | Income is the only blocker, and says why; Back keeps answers; "Leave for now" | ✅ live, P5 | Validated inline instead of by a disabled button (Phase 5). |
| 17 | Focus moves to the step heading | ✅ P5 | `app/onboarding/page.tsx` |
| 18 | `completedAt` only on Finish; no per-keystroke draft | ✅ P5 | `lib/onboarding.ts` is unchanged. |
| 19 | Completion summary screen | ✗ | Removed by C-12. Finish goes straight to `/home`, where the greeting and standing sentence carry the summary. |

## Home

| # | Item | Now | Where |
| --- | --- | --- | --- |
| 20 | Time-of-day greeting with first name | ✅ live | `/home` |
| 21 | `SourceLine` with its way out | ✅ live | "Based on: …" plus "Upload a statement for actuals" |
| 22 | Score dial, band word, caption | ✅ live | `/home` → Money health score |
| 23 | Breakdown meters with points | ✅ live, ↻ | One tap away under "How the score was built" (Phase 6). The driver line shows the part holding the score back. |
| 24 | "Since your last review", only with a real snapshot | ✅ code | `app/(app)/home/page.tsx`. It needs a second visit with a changed score, so it wasn't exercised. |
| 25 | Money in; discretionary vs target; guilt-free plus per day | ✅ live | `/home` → This month |
| 26 | Biggest opportunity, one finding with a link | ✅ live | The standing sentence under the greeting |
| 27 | Next 3 actions, N of M, link to the plan | ✅ live | "Your next steps" with `ActionCard`s and "All N actions" |
| 28 | Long-term consequence block → What-if, Spending | ↻ | Phase 6: replaced by the Spending and What-if links (`SecondaryLinks`) at the foot of Home. The projection lives on `/what-if`, which carries the projection disclaimer. |

## Spending

| # | Item | Now | Where |
| --- | --- | --- | --- |
| 29 | Distribution bar and legend table | ✅ live | `/spending` → Where the money went |
| 30 | Money-in note for credits | ✅ live | With the sample statement loaded |
| 31 | Off-track list | ✅ live | Ink rule and arrow, never red (Phases 3–4) |
| 32 | Recommended adjustment → `/what-if?monthly=` and `/plan`, or "nothing needs cutting" | ✅ live | `/spending` |
| 33 | Import: drop zone, parsed in browser, privacy note, toast | ✅ live | `DropZone` on `/spending` |
| 34 | Try it with a sample file | ✅ live, ↻ | B-4: it now actually loads, labelled "A sample statement". |
| 35 | Remove the uploaded statement | ✅ live | "Remove the sample" (and the same control for your own file) |
| 36 | File errors; magnitudes-only note; skipped-rows report | ✅ code | `StatementImport.tsx`: a critical `Notice`, a neutral `Notice`, and `SkipReport` on `Card` (Phase 10). The parsing behind them is covered by `lib/csv.test.ts`. |
| 37 | Allowance suggestion: accept or dismiss | ✅ code | `AllowancePrompt` on `Card` (Phase 10). By design, it never fires for the sample file. |
| 38 | Rows waiting on you; full ledger with show all / fewer | ✅ live | With the sample loaded |
| 39 | "How this is calculated" tab | ✅ live | `/spending` tabs |

## Plan (now labelled Actions)

| # | Item | Now | Where |
| --- | --- | --- | --- |
| 40 | Actions-completed meter | ✅ live | `/plan` |
| 41 | 4-stage ladder, exactly one "Now" | ✅ live | `/plan` |
| 42 | Per-stage progress and `measure` sentence | ✅ live | "Measured against the balances you declared." |
| 43 | Tickable actions persisted, self-attested disclosure | ✅ live | A tick writes `finpath.plan:<userId>` and shows Done with Undo. "Nothing in your figures can confirm this one…" |
| 44 | Invest → What-if; why this order; your priority; change it | ✅ live | `/plan` |

## What-if

| # | Item | Now | Where |
| --- | --- | --- | --- |
| 45 | Three sliders, 10/20/30 horizon | ✅ live | `/what-if` |
| 46 | Opens on `?monthly=`, else savings, else 20%; rate from `projection_params` | ✅ live | `?monthly=2500` opens at ₹2,500 |
| 47 | Chart in `ChartFrame` with insight, assumptions, data table | ✅ live | The chart loads on demand since Phase 11; the table renders without it. |
| 48 | Three-scenario comparison, gain and delay sentence, CTAs | ✅ live | `Metric`s since Phase 10 |

## Ask

| # | Item | Now | Where |
| --- | --- | --- | --- |
| 49 | Suggested questions when empty | ✅ live | Four, taken from the indexed booklet's chapters (C-16) |
| 50 | Streamed answer against the `␟SOURCES␟` contract | ✅ P8 | The parser in `Coach.tsx` is unchanged. Checked live against your backend in Phase 8. |
| 51 | `[n]` markers → `Citation` buttons | ✅ P8 | 19 rendered in Phase 8. "[1, 2]" now splits into two. |
| 52 | Sources + "View sources" → `SourcePanel` sheet | ✅ P8, ↻ | Renamed "Read the passages". A side panel at ≥ 1280 px, a bottom sheet below. Sources also sit in the margin (≥ 1280 px) or a list. |
| 53 | Grounded / general badges + `UnverifiedNote` | ✅ P8, ↻ | Text labels with a glyph, not a red badge (C-4) |
| 54 | Error state with the 429 text and "Ask again" | ✅ code, ↻ | B-2 and B-3: a calm `Notice`; the partial answer is kept |
| 55 | `?q=` asks automatically, once | ↻ | Q6: `?q=` now prefills and never sends (asserted live: no `/api/chat` request). The header search was removed (C-13); Home's Ask box is the entry. |
| 56 | Enter sends, Shift+Enter new line, `aria-live` | ✅ code | `Coach.tsx`. Enter wasn't pressed live because it would spend a Gemini call. |
| 57 | "About these answers" rail and `/sources` link; disclaimer under composer | ✅ live, ↻ | The rail became the trust line with "How answers are sourced" (C-9). The disclaimer under the composer is unchanged. |

## Profile

| # | Item | Now | Where |
| --- | --- | --- | --- |
| 58 | Account block: name, email, figures last updated | ✅ live | Personal block |
| 59 | Edit every declared figure, with running totals and buffer target | ✅ live, ↻ | Income and spending block → Edit (Phase 9: per-block editing) |
| 60 | Goals (many), priority (one) | ✅ live | Goals block |
| 61 | Local draft until Save; Discard | ↻ | Phase 9: each block has its own Save and Cancel, and nothing reaches the scores until Save. |
| 62 | Storage notes (device vs backend mode) | ✅ live | Security block |
| 63 | Links to Sources and Redo setup | ✅ live | "Redo the setup questions" and the sources link |

## Chrome and system

| # | Item | Now | Where |
| --- | --- | --- | --- |
| 64 | Header nav, search field, account menu | ✅ live, ↻ | The nav is Home · Actions · Ask · Profile; the menu has Profile and figures, Update your figures, Sources and methodology, the device note and Sign out. The search field was removed by C-13. |
| 65 | Phone bottom bar with the same items | ✅ live | Fixed to the bottom at 375 px; the same four. |
| 66 | Footer: three groups, disclaimer, no-products line | ✅ live | `SiteFooter` |
| 67 | Legacy redirects ×5 | ✅ P11 | 308 permanent since Phase 11 (B-6) |
| 68 | 404, and a route error boundary with a digest | ✅ live / code | `/no-such-page` renders the 404. `app/error.tsx` is unchanged. |
| 69 | Toasts | ✅ live | "Sample statement loaded"; "Your figures are saved" (Phase 11) |
| 70 | `/styleguide` | ✅ live | Every visual primitive since Phase 10 |
| 71 | Example month, opt-in | ✅ live | B-5: "Use an example month" on Home, labelled by `SourceLine` |

**Engines with no UI** (`lifestyleCreep`, `runway` + `SHOCKS`, `HABITS`, `equivalents`, `isImpulse`): still in `lib/`, untouched and still unsurfaced (Q13).

## Found along the way (not fixed; pre-existing)

- **The footer's Account group shows "Sign in" to a signed-in student.** It has been there since before the refactor (`components/ui/footer.tsx`). `SiteFooter` is a server-safe primitive with no session, so fixing it means passing the session in from each shell. That's small, but it's a behaviour change I didn't want to slip into a documentation phase.
- **`DisclaimerNote` placement vs CLAUDE.md:** see the Phase 13 report.
