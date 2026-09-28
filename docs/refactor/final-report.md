# Final report — editorial UX refactor

**Date:** 2026-09-28 · **Branch:** `ux-refactor`, from `main` @ `c8e3d89` · **Brief:** `docs/refactor/BRIEF.md`, Phases 1–14

The three items the brief asks for are below: the Phase 1 feature checklist ticked with where each feature lives, the before/after bundle sizes, and what is deferred or still needs your decision. The definition of done comes first.

## Definition of done

| Criterion | Status | Evidence |
| --- | --- | --- |
| `npm run verify` passes | ✅ | Typecheck, design-lint, check-contrast (15 tokens), **267 tests**, build: passed on the final commit and before every phase commit. |
| All golden fixtures pass unchanged | ✅ | `git diff main..HEAD -- frontend/lib/__fixtures__` shows **one file added** (`golden-score-driver.json`, for the new `scoreDriver`) and **none modified**. The only modified `lib/` file is `persist.ts`, **+72 lines, 0 removed** (the additive `createScopedStore`); `categories.ts` was deleted as unused. |
| Every Phase 1 feature ticked | ✅ | 71 of 71 below: 66 present (8 of them in a changed form by decision), 3 replaced and 2 removed by recorded decisions, none lost. |
| No backend changes | ✅ | `git diff --stat main..HEAD -- backend` is empty. The `␟SOURCES␟` contract is unchanged. |
| Every route shows the warm paper palette and the two type roles | ✅ | `visual-qa.md`: 42 route × viewport × state checks, measured from computed styles. Every rendered colour is one of the 15 tokens, and only Inter and Instrument Serif are used. |
| Every screen passes "what should I do next?" on a 375 px phone | ✅ | `visual-qa.md`. `/plan`, `/spending` and `/sources` failed at first and were fixed in Phase 13b. |

## Phase commits

Each phase is a work commit plus a progress-report commit (`git log --oneline --grep "ux(phase-"`).

| Phase | Work commit |
| --- | --- |
| 1 Audit | `e5d771c` |
| 2 Visual foundation | `2e0746c` |
| 3 Navigation | `fab38eb` |
| 4 Landing | `3ef7d28` |
| 5 Onboarding | `9471a4e` |
| 6 Home | `a4f967e` |
| 7 ActionCard | `8d1e9f5` |
| 8 AI chat | `7e26522` |
| 9 Profile | `41b7f92` |
| 10 Standardisation | `15af285`, `4fa7aaa` |
| 11 Performance | `e217162` |
| 12 Accessibility | `5cfd595` |
| 13 Visual QA | `a2e12b3`, then `93c28b6` (13b, as specified) |
| 14 Deliverables | `09d7f60`, then `80869f5` (14b) |
| Owner decisions | `4ac6523` |

## 1. The Phase 1 feature checklist

Generated from `14-feature-parity.md`, which also records how each mark was established. Status key:
- **✅ live:** asserted in headless Chrome in the Phase 14 run.
- **✅ Pn:** checked live in phase n.
- **✅ code:** present in code, but it needs a state the run couldn't create honestly.
- **↻:** changed by a recorded decision.
- **✗:** removed by a recorded decision.

**Public and trust**

| # | Feature | Status | Where it lives now |
| --- | --- | --- | --- |
| 1 | Landing explains the product; CTA; session-aware header | ✅ live | `/`: "Find my next step". The header shows Sign in / Get started when signed out and Open FinPath when signed in. The CTA follows the session (Phase 4). |
| 2 | Landing specimen preview | ✗ | Removed in Phase 4 (§11 plan, approved). The rebuilt diagnostic (₹3,500 → ₹10,870, labelled as an example) is now the landing's one worked example. |
| 3 | How the score is weighted (40/30/15/15) | ✅ live, moved | `/sources#method` → "The health score" ("Forty points for the savings rate…"). It left the landing in Phase 4. |
| 4 | `/sources` live library with loading, error and empty states | ✅ live | `/sources` lists `collegestudents` from `/api/sources`. |
| 5 | How an answer is put together, `#method`, what FinPath won't do | ✅ live | `/sources` |
| 6 | `DisclaimerNote` variants | ✅ live | Advice: `/home`, the footer, under the coach composer. Projection: the landing diagnostic and `/what-if`. Example: `/home` when the example month is on. See the Phase 13 note on per-answer and per-stage placement. |
| 7 | Skip-to-content on every shell | ✅ live | Public and app shells. Auth screens: none by design, since only the wordmark comes before the form (`a11y-walkthrough.md`). |

**Accounts**

| # | Feature | Status | Where it lives now |
| --- | --- | --- | --- |
| 8 | Sign up: name, email, a password of 10+ characters, PBKDF2 verifier | ✅ live | `/signup`. `lib/auth.ts` is unchanged. |
| 9 | Sign in with `?next=`; generic failure; not onboarded → onboarding | ✅ P9 | `LoginForm.tsx`, `lib/safe-next.ts`. B-8 carries `next` through sign-up and onboarding too. |
| 10 | Forgot password never reveals an account; device-mode notice | ✅ live | `/forgot-password` |
| 11 | `DeviceAccountNote` on auth screens and in the account menu | ✅ live | Auth screens ("this browser"); the account menu's note. |
| 12 | Route guard: `/login?next=`, `/onboarding`, waits for resolved | ✅ live | Signed out, `/home` → `/login?next=%2Fhome`. `app/(app)/layout.tsx` |
| 13 | Sign out (menu and `/profile`) | ✅ live | The account menu, and `/profile` → Security |

**Onboarding**

| # | Feature | Status | Where it lives now |
| --- | --- | --- | --- |
| 14 | Eight steps, "Step X of 8" | ✅ live | `/onboarding`. A full 8-step run reached `/home` in Phases 10–14. |
| 15 | Running totals under each step | ✅ P10 | `Running` → `Metric` in `app/onboarding/page.tsx` |
| 16 | Income is the only blocker, and says why; Back keeps answers; "Leave for now" | ✅ live, P5 | Validated inline instead of by a disabled button (Phase 5). |
| 17 | Focus moves to the step heading | ✅ P5 | `app/onboarding/page.tsx` |
| 18 | `completedAt` only on Finish; no per-keystroke draft | ✅ P5 | `lib/onboarding.ts` is unchanged. |
| 19 | Completion summary screen | ✗ | Removed by C-12. Finish goes straight to `/home`, where the greeting and standing sentence carry the summary. |

**Home**

| # | Feature | Status | Where it lives now |
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

**Spending**

| # | Feature | Status | Where it lives now |
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

**Plan (now labelled Actions)**

| # | Feature | Status | Where it lives now |
| --- | --- | --- | --- |
| 40 | Actions-completed meter | ✅ live | `/plan` |
| 41 | 4-stage ladder, exactly one "Now" | ✅ live | `/plan` |
| 42 | Per-stage progress and `measure` sentence | ✅ live | "Measured against the balances you declared." |
| 43 | Tickable actions persisted, self-attested disclosure | ✅ live | A tick writes `finpath.plan:<userId>` and shows Done with Undo. "Nothing in your figures can confirm this one…" |
| 44 | Invest → What-if; why this order; your priority; change it | ✅ live | `/plan` |

**What-if**

| # | Feature | Status | Where it lives now |
| --- | --- | --- | --- |
| 45 | Three sliders, 10/20/30 horizon | ✅ live | `/what-if` |
| 46 | Opens on `?monthly=`, else savings, else 20%; rate from `projection_params` | ✅ live | `?monthly=2500` opens at ₹2,500 |
| 47 | Chart in `ChartFrame` with insight, assumptions, data table | ✅ live | The chart loads on demand since Phase 11; the table renders without it. |
| 48 | Three-scenario comparison, gain and delay sentence, CTAs | ✅ live | `Metric`s since Phase 10 |

**Ask**

| # | Feature | Status | Where it lives now |
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

**Profile**

| # | Feature | Status | Where it lives now |
| --- | --- | --- | --- |
| 58 | Account block: name, email, figures last updated | ✅ live | Personal block |
| 59 | Edit every declared figure, with running totals and buffer target | ✅ live, ↻ | Income and spending block → Edit (Phase 9: per-block editing) |
| 60 | Goals (many), priority (one) | ✅ live | Goals block |
| 61 | Local draft until Save; Discard | ↻ | Phase 9: each block has its own Save and Cancel, and nothing reaches the scores until Save. |
| 62 | Storage notes (device vs backend mode) | ✅ live | Security block |
| 63 | Links to Sources and Redo setup | ✅ live | "Redo the setup questions" and the sources link |

**Chrome and system**

| # | Feature | Status | Where it lives now |
| --- | --- | --- | --- |
| 64 | Header nav, search field, account menu | ✅ live, ↻ | The nav is Home · Actions · Ask · Profile; the menu has Profile and figures, Update your figures, Sources and methodology, the device note and Sign out. The search field was removed by C-13. |
| 65 | Phone bottom bar with the same items | ✅ live | Fixed to the bottom at 375 px; the same four. |
| 66 | Footer: three groups, disclaimer, no-products line | ✅ live | `SiteFooter` |
| 67 | Legacy redirects ×5 | ✅ P11 | 308 permanent since Phase 11 (B-6) |
| 68 | 404, and a route error boundary with a digest | ✅ live / code | `/no-such-page` renders the 404. `app/error.tsx` is unchanged. |
| 69 | Toasts | ✅ live | "Sample statement loaded"; "Your figures are saved" (Phase 11) |
| 70 | `/styleguide` | ✅ live | Every visual primitive since Phase 10 |
| 71 | Example month, opt-in | ✅ live | B-5: "Use an example month" on Home, labelled by `SourceLine` |

## 2. Bundle sizes, before and after

The same method both times: gzip size of every `/_next/static/**/*.js` that each prerendered page references. Before is Phase 1 on `main`; after is the final commit.

| Route | Before (kB gzip) | After (kB gzip) | Change |
| --- | --- | --- | --- |
| `/` | 297.7 | 209.5 | −88.2 (−30%) |
| `/sources` | 305.9 | 200.3 | −105.6 (−35%) |
| `/login` | 304.6 | 208.3 | −96.3 (−32%) |
| `/signup` | 304.7 | 208.5 | −96.2 (−32%) |
| `/forgot-password` | 304.3 | 207.2 | −97.1 (−32%) |
| `/onboarding` | 306.2 | 210.9 | −95.3 (−31%) |
| `/home` | 310.0 | 289.2 | −20.8 (−7%) |
| `/plan` | 309.2 | 281.5 | −27.7 (−9%) |
| `/profile` | 307.9 | 284.2 | −23.7 (−8%) |
| `/ask` | 308.1 | 289.8 | −18.3 (−6%) |
| `/spending` | 312.9 | 303.8 | −9.1 (−3%) |
| `/what-if` | **406.8** | **280.0** | −126.8 (−31%); Recharts now loads on demand |
| `/styleguide` | 314.0 | 319.0 | +5.0 (it shows more primitives) |
| legacy redirects, `/_not-found` | 297.7 | 192.4 | −105.3 (−35%) |

Most of the drop comes from the barrel tree-shaking once `package.json` declared `"sideEffects": ["*.css"]` (Phase 11). App routes keep about 80 kB more than public ones: that's the shell's menu, toast, tooltip and Base UI positioning, all of which it uses. The final numbers are about 2 kB above Phase 11's, because of the footer's session-aware column and `useSignOut`.

## 3. Deferred, and what needs your decision

**Needs you:**
1. **`lib/action-meta.ts` minute values.** They're marked DRAFT; you said you'd edit them yourself.
2. **Screenshots.** Thirty captures are listed in `screenshots.md`. The README holds five placeholders, and three stale PNGs wait to be deleted after recapture.
3. **The trust line and the corpus.** Only the SEBI-guided college booklet is indexed, so the trust line says exactly that, not "RBI, SEBI and NCFE". The brief's wording comes back once `backend/data_hold/` is ingested, which is Phase 15, step 15.1.

**Not checked by me** (listed in `visual-qa.md` and `a11y-walkthrough.md`):
- A real screen-reader pass (NVDA or VoiceOver).
- Safari on iOS (safe-area insets, the sticky composer) and Firefox.
- `/ask` with real answers after Phase 8. Each question costs a Gemini call on your key.
- `app/error.tsx`, which needs a route to throw. It is unchanged since `main`.

**Decided and closed:**
- Disclaimer: one per page, and in `CLAUDE.md`.
- The footer's Account column follows the session.
- Sign out lands on `/` everywhere.

**Next:** Phase 15 (`docs/features/BRIEF.md`) is not started. Its precondition, Phases 1–14 committed, is now met.
