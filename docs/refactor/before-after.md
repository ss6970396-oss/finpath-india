# Before and after (Phase 14)

**Before** is `main` at `c8e3d89`, as recorded in `01-audit.md` §7 before any change. **After** is `ux-refactor` at the end of Phase 14. "Why" names the brief section or recorded decision behind the change.

## Screens

| Screen | Before: what it looked like and did | Now | Why |
| --- | --- | --- | --- |
| `/` landing | Cool off-white. A two-column hero with a bordered specimen panel, then five alternating white and grey bands (how it works, score weights, capability grid, sources, final CTA). **Four ink-filled primary buttons.** | Warm paper. A two-line serif hero ("Your money. / One clear next step.") with one accent CTA that follows the session, and one text link. Then the purchase diagnostic (₹3,500 → **₹10,870** as the serif hero figure, assumptions as a margin note), then the trust line. | Brief Phase 4: one primary, keep the diagnostic as proof, whitespace instead of sections. The diagnostic was rebuilt because it no longer existed (C-10). |
| `/sources` | Public header, a serif title, four ruled sections. **No next step**: no CTA beyond an empty-state link. | The same four sections on paper; the corpus wording matches what is actually indexed (`CORPUS_PHRASE`). The header CTA is the page's one primary (13b). | Brief §1: every screen answers "what next?"; Phase 13's one primary per route; trust copy must be true (C-15). |
| `/login` `/signup` `/forgot-password` | A grey left panel at ≥ 1024 px, the form on the right, an ink primary, a grey note box. `?next=` was lost at sign-up. | A paper split screen and an accent primary. Failures are a critical-ruled `Notice`, not a red box. `?next=` survives sign-up and onboarding, sanitised. All links are 44 px targets. | Phases 2, 9 (B-8), 10, 12. |
| `/onboarding` | An 8-segment ink tick bar, a Continue disabled until valid, and a separate "Your FinPath is ready" screen before Home. | "Step X of 8" with one thin accent bar. Each step is a real form (Enter advances), focus moves to the question, income is validated inline, and Continue is never disabled. Finish goes straight to `/home`. | Brief Phase 5; C-12 dropped the Done screen. |
| `/home` | A serif greeting, the score dial beside three meters, three figures, an Insight with an **ink primary**, three grey action cards, and a projection paragraph with **another primary**. About five phone screens; the next step on the third. | Six sections on hairlines. The greeting has one sentence on where you stand and a link to the fix, **in the first phone screen**. The score has one driver line (meters one tap away). The top three `ActionCard`s have the one primary. Then four tabular figures, an Ask box that prefills `/ask`, and the Spending and What-if links. | Brief Phase 6; `lib/score.ts scoreDriver()` is a new tested function. |
| `/spending` | A distribution bar in ink tints, an off-track list, a **red-bordered** recommended adjustment. Import was hidden in a bottom tab, and "Try it with a sample file" appeared to do nothing (B-4). | The same data. Overspending is ink with an arrow and a sentence, never red. The header states the excess and jumps to the adjustment, so it's visible on a phone (13b). The sample file actually loads, labelled "A sample statement". The import panels use `Card`/`Metric`/`Notice`. | Brief §2.1 (critical only for real problems); Phase 13 (next step on a phone); B-4. |
| `/plan` (now **Actions**) | A vertical timeline with bordered checkbox items; every stage fully expanded; "Now" marked. | Titled "Your actions". Each action is an `ActionCard` with a priority word, "~N min", its own destination, and Done with Undo; exactly one primary (the first open action). The header names the next step and jumps to it (13b). Spending and What-if links sit at the foot. | Brief Phases 3, 7; Phase 13. Minute values are DRAFT (`lib/action-meta.ts`). |
| `/what-if` | Sliders beside a Recharts chart; three figures; an ink primary. The chart tooltip said "Rising 10% a year" whatever the slider said (B-1). Recharts was in the page bundle. | Paper; the scenario figures are `Metric`s (the step-up one is the serif hero); the tooltip follows the slider. The chart loads on demand behind a static placeholder: page JS 408 → 280 kB gzip. | Phases 2, 10, 11; B-1. |
| `/ask` | A serif title, five suggestions (some the corpus doesn't cover), a right-hand "About these answers" rail. Answers under a 24 px serif question, with a **red triangle** for general mode. No Stop. Failures rendered as grounded answers (B-2) and wiped partial text (B-3). | One centred reading column with the composer pinned to the bottom and the disclaimer inside it. Your question sits in a sunken block on the right; answers are on paper at 17 px, labelled in words at the top. Sources are margin notes at ≥ 1280 px and a list below that; the inspector is a side panel or bottom sheet. Stop keeps the partial answer; failures are calm notes with "Ask again"; there are four suggestions from the indexed booklet. `?q=` prefills and doesn't send. | Brief Phase 8; C-9, C-16, Q6; B-2, B-3. |
| `/profile` | One long form of seven ruled sections, a Save that appeared only when dirty, a red Sign out. Read as settings. | Four bordered blocks (Personal, Income and spending, Goals, Security), each with Edit → Save/Cancel, one open at a time; Security is facts only. Storage is per account (B-7). | Brief Phase 9; Q11, Q12. |
| `/styleguide` | Every token and primitive in 30 sections, in the cool palette. | The warm palette, the ten type roles and the `--fs-*` scale, read live, plus every visual export of the barrel (ghost, `Notice`, `SectionLabel`, `ActionCard`, `Menu`, `SkipLink`, …). | Brief Phases 2, 10. |
| 404, error | A serif statement and two buttons, one primary. | Unchanged in structure; paper palette; a session-aware footer. | Phase 2. |
| Legacy routes ×5 | `redirect()`, which sent **307** although the comments said permanent (B-6). | `permanentRedirect()`: **308**. | Phase 11. |

## Shared chrome

| Piece | Before | Now | Why |
| --- | --- | --- | --- |
| Primary nav | Five items (Home, Spending, Plan, What-if, Ask), plus an "Ask a question…" field in the header at ≥ lg. | **Home · Actions · Ask · Profile**, one `NAV` for the header and the phone bar. Spending and What-if are reached from Home and Actions. No header search. | Brief Phase 3; C-1, C-13, Q8. |
| Desktop header | An ink indicator, the search field, the account menu. | Slim, on paper, with a hairline below. The active item is ink plus an indicator bar and `aria-current`. 44 px targets. | Phases 3, 12. |
| Phone bar | The same items. | Four items, 44 px+ targets, labels under icons, safe-area padding. | Phase 3. |
| Footer | Three link groups; the Account group offered **"Sign in" to signed-in students**. | The Account column follows the session (profile, figures, Sign out, or Sign in / Create an account). All three Sign out controls land on `/` with a full reload. | Owner decision. |
| Focus | A `line-strong` outline. | An **accent** 2 px ring on every focus stop (asserted ≥ 3:1 on every ground). Keyboard walkthrough in `a11y-walkthrough.md`. | Phases 2, 12. |
| Performance | Every route shipped the whole primitive barrel (~300 kB gzip on the landing page) and fetched `/api/spending`, twice on app screens. | The barrel tree-shakes (`sideEffects`); the landing page is ~210 kB. `/api/spending` is fetched only where figures show, once, after the session resolves. | Phase 11. |

## Tokens

**Colour**: still fifteen tokens, asserted by `check-contrast`.

| Token | Before | After | Role |
| --- | --- | --- | --- |
| `--color-canvas` | `#fcfcfb` | `#fbf9f4` | the page (paper) |
| `--color-surface` | `#f6f6f4` | `#f4f0e6` | panels on the page |
| `--color-surface-sunken` | `#efefec` | `#ece7db` | inputs, wells, the user's chat turn |
| `--color-ink` | `#2a2a2e` | `#1c1b19` | headings, amounts, primary text |
| `--color-ink-secondary` | `#5a5a62` | `#4f4b44` | supporting text |
| `--color-ink-muted` | `#64646c` | `#5e5a52` | labels, captions, marginalia |
| `--color-ink-disabled` | `#a8a8ae` | `#a8a298` | disabled only |
| `--color-line` | `#e4e4e0` | `#e4ded1` | hairlines and card edges only |
| `--color-line-strong` | `#2a2a2e` | `#1c1b19` | every interactive boundary |
| `--color-accent` | `#1f5f4f` | unchanged | the one primary, progress, links, focus |
| `--color-accent-wash` | `#eef3f1` | `#eaf0e8` | warm-tinted green ground |
| `--color-critical` | `#a34a45` | unchanged | real problems only |
| `--color-critical-wash` | `#f7efee` | `#f6ece6` | |
| `--color-positive` | `#4c5d50` | unchanged | done, on track |
| `--color-positive-wash` | `#f0f2ef` | `#edefe6` | |

The brief proposed `#FAF7F0` for canvas; it was amended to `#FBF9F4` before Phase 3 (progress log). Role changes: the primary button went from ink fill to **accent fill**, the focus ring from `line-strong` to **accent**, and overspending from critical to **ink with a sentence**.

**Type**: a new `--fs-*` scale with ten roles over it.

| Role | Before | After |
| --- | --- | --- |
| `type-hero` | Instrument Serif, clamp 44→76 px | same, now `--fs-hero` |
| `type-display` | Instrument Serif, clamp 36→52 px | same, now `--fs-display` |
| `type-heading` | Instrument Serif 24 px | same, `--fs-heading` (the serif floor) |
| `type-figure` | (none; hero numbers were Inter `text-4xl` / `text-6xl`) | **new**: Instrument Serif, clamp 40→56 px, one hero figure per block |
| `type-subhead` | Inter 600, 16 px | same |
| `type-reading` | (none) | **new**: Inter 17 px / 1.6, for answers and explanations |
| `type-body` | Inter 15 px | **16 px** |
| `type-label` | Inter 13 px | **14 px** |
| `type-eyebrow` | Inter 600, 11 px, uppercase | **12 px** |
| `type-data` | Inter, tabular, inherits | same, with `amount-sm`, `amount-md` and `amount-lg` (14 / 16 / 24) replacing hard-coded `text-*` sizes |

**Layout and motion:**
- The `margin-layout` gutter opens at **1280 px** (was 1024).
- New: `--container-annotated` and the utilities `safe-bottom`, `nav-clearance`, `above-nav`, `gutter-offset`.
- Unchanged: `--container-page`, `--container-prose`, `--container-form`, `--width-gutter`, `--ease-out`, `--dur-*`; radius and shadow stay pinned to 0.

The full list of token additions and renames is in `MIGRATION.md` → Tokens.
