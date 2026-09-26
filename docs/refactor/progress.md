# Editorial UX refactor — progress log

One entry per phase, appended after the phase is committed.

**How the hashes work.** A commit cannot contain its own hash, so every phase is two commits with the same prefix: `ux(phase-N): <summary>` holds the work, and `ux(phase-N): progress report` holds this entry, which quotes the first commit's hash. `git log --oneline --grep "ux(phase-"` lists both.

Gate for every entry: `npm run verify` (typecheck, design-lint, check-contrast, tests, build) passed before the commit.

---

## Phase 1 — Audit · `e5d771c`

Wrote `docs/refactor/01-audit.md`: route table, 71-item feature inventory, flows, four Mermaid diagrams, component inventory, "before" visual and token inventory, style leaks, the existing health score, 18 conflicts, the plan and 14 questions. Decisions are recorded at the bottom of the audit.

## Phase 2 — Visual foundation · `2e0746c`

Warm paper palette, a `--fs-*` type scale with ten roles (new: `type-figure`, `type-reading`), accent primary button and focus ring, over-target shown in ink and never red, a new `default-font-size` lint rule, and `@theme static`. Fixed: B-1 (chart tooltip), the ChartFrame hidden table overflowing at 375 px, and two styleguide bugs.

## Phase 3 — Navigation · `fab38eb`

Home · Actions · Ask · Profile from one `NAV`; slimmer header with an ink indicator bar; phone bar with 44 px+ targets and safe-area padding; Spending and What-if reached through `SecondaryLinks` and covered by Home through `also`. Pre-phase amendments: canvas `#FBF9F4`, and an ink rule on over-target distribution rows.

## Phase 4 — Landing · `3ef7d28`

**What changed.** `/` is now a server component with three parts: the hero ("Your money. / One clear next step."), one primary CTA that follows the session, and one text link. Then the diagnostic, rebuilt from the frozen `lumpSumFutureValue` at the API's `projection_params` (₹3,500 → ₹10,870), with its assumptions as a margin note. Then the trust line. The specimen, the three-step explainer, the score weights and the capability grid are gone. The corpus claim now lives in one constant (`CORPUS_PHRASE`, `components/ui/trust.tsx`), worded to match the one document actually indexed, and six screens read it. The public header's button is secondary, so each public page has a single primary action. Phase 3 follow-up: the `/spending` off-track list has the ink rule, ink medium text and a direction arrow.

**Files.** `app/page.tsx`, `app/components/{Diagnostic,HeroCta,PublicHeader}.tsx`, `components/ui/{trust,footer,index}.tsx`, `app/layout.tsx`, `app/(auth)/layout.tsx`, `app/(app)/ask/{page,Coach}.tsx`, `app/sources/page.tsx`, `app/(app)/spending/page.tsx`.

**Checked.** At 1280 px, by screenshot: the hero with one primary button, and the margin note in the gutter. By page structure: the diagnostic reads ₹10,870, and exactly one accent-filled control is on the page. At 375 px, by page structure: no horizontal overflow, and the CTA ends at 457 px, inside the first screen.

**Needs a human look.** `/` at 375 px (the capture timed out).

**Deferred.** `CORPUS_PHRASE` goes back to "RBI, SEBI and NCFE publications" once `backend/data_hold/` is ingested. That's backend work, yours.

**Where to see it**
- `/`: two-line serif hero, one green button ("Find my next step", or "Open FinPath" when signed in) and a "How answers are sourced" link; below a hairline, the purchase field with ₹10,870 as the big serif figure and its assumptions in the left margin (≥ 1280 px) or above it (narrower); then the trust line.
- Header on `/` and `/sources`: the button is outlined, not filled.
- `/sources`, `/login`, `/ask`, footer: the corpus description now names SEBI's investor-education programme.
- `/spending`: every "Where you are off track" row has the ink left rule and an arrow.
