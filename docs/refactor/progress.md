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

## Phase 5 — Onboarding · `9471a4e`

**What changed.** Each of the 8 frozen steps is now a real `<form>`, so Enter advances. The serif question heading and the one-line purpose are unchanged. Back keeps every answer, and focus moves to the step heading on each change; the `autoFocus` on fields that used to steal it is gone. Income is validated inline, on blur and on Continue ("Enter your monthly income in rupees."), and focus goes back to the field. Continue is never disabled. `Stepper` is now "Step X of N" plus one thin accent bar. Finish saves exactly as before and goes straight to `/home`; the "Your FinPath is ready" screen is gone. `lib/onboarding.ts` is untouched.

**Files.** `app/onboarding/{page,AmountField}.tsx`, `components/ui/stepper.tsx`.

**Checked.** By screenshot at 1280 px, then by page structure: advancing from step 1 puts focus on the step 2 `h1`; the progress bar reads "Step 2 of 8"; clearing income and pressing Enter keeps you on the step, focuses the field, sets `aria-invalid` and shows the message. Finish wasn't pressed, so your stored profile is unchanged.

**Needs a human look.** `/onboarding` at 375 px, and one full run through to Finish (which rewrites your stored profile).

**Deferred.** B-8 (`?next=` through sign-up and onboarding) moves to Phase 9, which touches the auth forms.

**Where to see it**
- `/onboarding`: "STEP 2 OF 8" above a thin green bar; the heading takes focus on each step; Enter moves forward; an empty income gives an inline message instead of a greyed-out button.
- Finishing lands directly on `/home`; there is no intermediate "ready" screen.

## Phase 6 — Home · `a4f967e`

**What changed.** `/home` is now six sections separated by hairlines:
1. Greeting, plus one plain sentence on where you stand (the biggest opportunity, its figure, a link to the fix).
2. The score, with a driver line such as "Discretionary spending is holding it back most: 0 of 30 points". "Since your last visit" is appended only when a real previous snapshot exists.
3. The top three plan actions; the first carries the only primary button.
4. Four tabular figures.
5. An Ask box that prefills `/ask`.
6. The Spending and What-if links.

The three score meters are still there, one tap away under "How the score was built". The empty state for no spending data offers "Import a statement" or "Use an example month", which restores the example opt-in. New `lib/score.ts` `scoreDriver()` has 8 tests and a golden fixture over the 12 scenarios (242 tests total). Also:
- **B-4 / Q10:** the sample CSV now loads as "A sample statement".
- **Q6:** `?q=` prefills the composer and no longer sends.

**Files.** `app/(app)/home/page.tsx`, `lib/score.ts`, `lib/score.test.ts`, `lib/__fixtures__/golden-score-driver.json`, `app/providers/FinPathProvider.tsx`, `app/components/SourceLine.tsx`, `app/(app)/spending/StatementImport.tsx`, `app/(app)/ask/Coach.tsx`.

**Checked.**
- At 1280 px, by screenshot: section order, standing sentence and driver line.
- By page structure: exactly one primary button ("Start here").
- At 375 px, by page structure: no overflow; the next-step link ends at 230 px, inside the first screen.
- An idle-mutation check ruled out a render loop after one tab stalled.

**Needs a human look.**
- `/home` at 375 px (the capture failed).
- The example-month and sample-statement flows end to end; both need the API running.

**Deferred.** Home still uses the old `ActionCard`, and cards link to `/plan` for now. Phase 7 replaces them with the new card and gives each action its own destination.

**Where to see it**
- `/home`: one sentence under the greeting with a green link to the fix; the serif score with one driver line; "How the score was built" expands the meters; "Your next steps" with one green "Start here"; the "This month" figures; an Ask box.
- `/home` with only onboarding figures: the ink-ruled note offering "Import a statement" or "Use an example month".
- `/spending` → "Try it with a sample file": every page now says "Based on: A sample statement" with "Remove the sample".
- Home → Ask with a question: it arrives in the composer, unsent.

## Phase 7 — ActionCard · `8d1e9f5`

**What changed.** New `components/ui/action-card.tsx`: a one-line title, at most two lines of explanation, priority as a word ("High priority"), "~N min", a link or button action, and a done state (ticked, muted, "Done" plus Undo). Only the card its parent marks primary gets the accent button. New `lib/action-meta.ts`, which opens with a **DRAFT** notice: the minute values need your review. It holds the minutes and the button behaviour per plan action, and `actionPriority()` derives high, medium or low from the plan's own ladder (9 tests, 251 in total). One adapter, `PlanActionCard`, serves both Home and Actions. Ticks persist through `toggleTask` exactly as the old checkboxes did, and the self-attested note is kept. The old `ActionCard` in `insight.tsx` is deleted.

**Files.** `components/ui/{action-card,insight,index}.tsx`, `lib/action-meta.ts`, `lib/action-meta.test.ts`, `app/components/PlanActionCard.tsx`, `app/(app)/{home,plan}/page.tsx`, `app/styleguide/page.tsx`.

**Checked.** By page structure on `/plan`: 8 cards, exactly one primary ("I have paid it in full"), and priorities follow the ladder (debt high, buffer medium, the rest low).

**Needs a human look.** `/plan` and `/home` cards at 1280 and 375 px (the capture timed out).

**Deferred.** Minute values: your review (`lib/action-meta.ts`).

**Where to see it**
- `/plan`: each stage's actions are bordered cards with a priority word, "~N min", the why and a button. Self-attested ones say so. The first open action has the only green button. Ticking shows "Done" with Undo.
- `/home`: the three "Your next steps" cards match the ones on Actions and link to where each fix lives (Spending, What-if, Profile), or record a tick.
- `/styleguide` → "Insight and ActionCard": primary, secondary-with-note and done examples.

## Phase 8 — AI chat · `7e26522`

**What changed.** `/ask` is one centred reading column with the composer pinned to the bottom (above the phone bar). Your questions sit in sunken blocks on the right; answers sit directly on the paper at 17 px, with no bubble. Each answer is labelled at the top in words: "Grounded in N sources", "Not from a verified source" (with the unverified note), or "No verified source for this yet". Sources appear as margin notes beside the answer at ≥ 1280 px and as a compact list under it below that. The inspector is a side panel on wide screens and a bottom sheet on narrow ones. Also:
- **Stop:** you can stop an answer mid-stream; the partial answer is kept and marked as stopped.
- **B-2:** in-stream generation failures and 429s now show as calm notes with "Ask again", not as a "grounded" answer.
- **B-3:** a network error keeps whatever had already streamed.
- **Empty state:** a serif "Ask anything about money", the trust line, and four suggestions taken from the indexed booklet's own chapters. Choosing one fills and focuses the composer.
- **Combined markers:** "[1, 2]" now renders as two citation buttons.
- **New:** `Notice` primitive, `useMediaQuery`, utilities `above-nav` and `gutter-offset`, token `--container-annotated`.

The streaming contract is unchanged.

**Files.** `app/(app)/ask/{Coach,page}.tsx`, `components/ui/{notice,index}.tsx`, `app/components/useMediaQuery.ts`, `app/globals.css`.

**Checked.** Live, against your running backend: one real question (one call to your Gemini key; the repeat was served from the API's answer cache). By page structure:
- The empty state renders, and a suggestion fills and focuses the composer.
- Send turns into Stop while streaming; the answer is grounded with sources in the margin at 1536 px, and 19 citation buttons render.
- `?q=` prefills without sending.
- The inspector is a right-hand panel at 1536 px and a full-width bottom sheet at 375 px.
- At 375 px: no overflow, margin notes hidden, list under the answer.

A screenshot of the empty state at 1280 px looked right.

**Needs a human look.**
- `/ask` with an answer, at 1280 and 375 px. At 375 px the composer may overlap the bottom bar by about 4 px.
- Enter-to-send, which the automation couldn't deliver to a hidden window. The send button and the Enter handler are the same code path as before.

**Deferred.** None.

**Where to see it**
- `/ask` (empty): serif headline, trust line with a "How answers are sourced" link, four suggestions, composer at the bottom.
- `/ask` (after a question): your question in a sunken block on the right; the answer on paper with a "Grounded in N sources" label; numbered sources in the left margin at ≥ 1280 px or listed under the answer on phones; "Read the passages" opens the side panel or bottom sheet; "Stop" appears while it streams.
- Home → Ask with a question: the question waits in the composer.

## Phase 9 — Profile · `41b7f92`

**What changed.** `/profile` is four bordered blocks:
- **Personal:** name and email, read-only because the auth contract can't change them; age is editable.
- **Income and spending:** every declared figure.
- **Goals:** goals plus priority.
- **Security:** facts only, plus Sign out, with no Edit button.

Edit switches a block to an inline form with Save (primary) and Cancel. One block is open at a time, and nothing reaches the scores until Save. Income's Edit is the page's one primary action. Also:
- **Q12 / B-7:** profile, plan ticks and review are now stored per account (`finpath.*:<userId>`). A one-time migration moves the old global keys to the first account that loads or signs in, never on sign-up. 16 new tests (267 total); documented in the new `docs/refactor/MIGRATION.md`.
- **B-8:** `?next=` now survives sign-up, onboarding and the guard's onboarding redirect, and is sanitised by `lib/safe-next.ts`.
- **Plumbing:** the API base moved to `app/providers/api-base.ts` (still imported as `API`) to break an import cycle.

**Files.** `app/(app)/profile/page.tsx`, `lib/{account-storage,persist,safe-next}.ts`, `lib/account-storage.test.ts`, `app/providers/{AuthProvider,FinPathProvider,api-base}.tsx`, `app/(auth)/{login/LoginForm,signup/SignupForm}.tsx`, `app/onboarding/page.tsx`, `app/(app)/layout.tsx`, `docs/refactor/MIGRATION.md`, `CLAUDE.md`.

**Checked.**
- **Your real browser data:** `finpath.profile` and `finpath.review` moved to your account's keys, the legacy keys are gone, and `/home` loaded normally without bouncing to onboarding. An idle-mutation check after a tab stall showed no render loop.
- **`/profile`, by page structure:** Security has no Edit; exactly one primary button (Income's Edit). Opening Goals hides the other Edits and makes Save the only primary; Cancel restores the view. Nothing was saved.
- **Screenshot at 1280 px:** the blocks look right.

**Needs a human look.**
- `/profile` at 375 px.
- A second device account in the same browser: sign up, and confirm it starts clean at onboarding.
- The `?next=` round trip through sign-up.

**Deferred.**
- The small Edit buttons are 32 px tall: Phase 12 (touch targets).
- Two old hyphenated keys (`finpath-profile`, `finpath-roadmap`) in your browser are unused leftovers; safe to clear.

**Where to see it**
- `/profile`: four boxes. Personal shows your name and email with "cannot be changed on this build"; Income lists your figures with a green Edit; Goals lists goals and priority; Security lists where things are stored and a Sign out button.
- Edit any block: it turns into a form with Save and Cancel, and the other Edit buttons disappear until you finish.

## Phase 10 — Component standardisation, part 1 · `15af285`

**What changed.**
- The `quiet` button variant is renamed `ghost`.
- A new `Notice` primitive replaces six hand-rolled alert panels. It is critical only for real errors: sign-in or sign-up failure, and an unreadable file.
- `SectionLabel` replaces the hand-typed section labels on Home, Ask, Profile, the landing page and the Spending/What-if links.
- `BareTextarea` gives the coach's composer the same control styles as `Input`.

`npm run verify` passes (267 tests).

**Not done: stopped at the usage limit.**
- `Card` for `AllowancePrompt` and `SkipReport`.
- `Metric` for the What-if, import-summary and onboarding figure blocks.
- Styleguide coverage of every variant (ghost, Notice, SectionLabel).

**Needs a human look.** `/login` and `/signup` error notices, and `/forgot-password` after a submit.

**Where to see it**
- `/login` with a wrong password: a red-ruled "Not signed in" note, not a red box.
- `/forgot-password` after submitting: calm ink-ruled notes.
- `/spending` with a broken CSV: a red-ruled "That file could not be used" note.

## Phase 10 — Component standardisation, part 2 · `4fa7aaa`

**What changed.** The three items part 1 left open are done.
- **`Card`:** `AllowancePrompt` (filled) and `SkipReport` (outlined) on `/spending`.
- **`Metric`:** the import summary (in a `MetricRow`), the three What-if scenario figures (the step-up one at `xl`, the serif hero) and onboarding's running total.
- **Ledger rule:** two `ledger-rule`s that sat under text with no amount (skipped-row lines, the onboarding welcome list) are now plain `line` hairlines. The rule means "a real number sits here".
- **Styleguide:** it now shows every visual export of the barrel. New: a ButtonLink row, BareTextarea, a "Wordmark, SkipLink and Menu" section, and a "Notice, SectionLabel and TrustLine" section. The exports it doesn't render are non-visual: `buttonClass`, `isNavActive`, `CORPUS_PHRASE`, `TRUST_LINE`, and `SiteFooter`, which every public page renders.

**Files.** `app/(app)/spending/StatementImport.tsx`, `app/(app)/what-if/ScenarioExplorer.tsx`, `app/onboarding/page.tsx`, `app/styleguide/page.tsx`.

**Checked.** The Chrome extension was not connected. Checks used headless Chrome driven over the DevTools protocol, with a throwaway device account in a scratch profile (your browser data is untouched).
- **Styleguide:** new sections by screenshot at 1280 and 375 px; no horizontal overflow at 375 px.
- **Onboarding:** a full run through all 8 steps landed on `/home`.
- **What-if:** the scenario figures by screenshot at 1280 px; no overflow at 375 px.

**Needs a human look.** `/spending` after importing a real file (the allowance prompt and skip report need a statement with a recurring credit and a bad row).

**Where to see it**
- `/styleguide`: "Button" has a Link row; "Input and Select" has the bare textarea; there are two new sections, "Wordmark, SkipLink and Menu" and "Notice, SectionLabel and TrustLine".
- `/what-if`: the three scenario figures, unchanged in look, now drawn by `Metric`.
- `/spending` after an import: the allowance suggestion is a filled card; the skip report is an outlined card with plain hairlines between rows.

## Phase 11 — Performance · `e217162`

**What changed.**
- **Shared baseline.** Every route shipped the whole `@/components/ui` barrel: Dialog, Select, Menu, Slider, DropZone and more on the landing page. `package.json` now declares `"sideEffects": ["*.css"]`, so the barrel's unused re-exports tree-shake. Call sites still import from the barrel, as CLAUDE.md requires.
- **Providers.** `TooltipProvider` and `ToastProvider` moved from the root layout into the `(app)` shell, the only place either is used. The styleguide already mounts its own.
- **B-5, the fetch.** `/api/spending` is now requested only when a screen calls `useRequestSpending()` (the `(app)` shell and the landing diagnostic, which needs the API's rate), and only after the session resolves. Before, the first request went out with the signed-out fallback allowance (1,000) and was thrown away, so every app screen made two calls. Now it makes one, and the auth pages and `/sources` make none.
- **Lazy chart.** `ScenarioChart` (Recharts) loads through `next/dynamic` behind a static `h-80` placeholder. The figures and ChartFrame's data table don't wait for it.
- **B-6.** The five legacy routes use `permanentRedirect` and return 308, confirmed with curl.
- **Deleted.** `lib/categories.ts`: no importers, and it referenced tokens that no longer exist.
- **Q14, dependencies removed:** `motion`, `tw-animate-css`, `class-variance-authority`, `shadcn`. None was imported anywhere. The build passes after removal. `components.json` (shadcn CLI config) is kept; `npx shadcn` doesn't need the package installed.

**Measured** with the Phase 1 method: gzip kB of every `/_next/static/**/*.js` each prerendered page references.

| Route | Before (Phase 1) | Before this phase | After |
| --- | --- | --- | --- |
| `/` | 297.7 | 300.1 | **207.1** |
| `/login` | 304.6 | 306.3 | **206.9** |
| `/signup` | 304.7 | 306.5 | **207.1** |
| `/forgot-password` | 304.3 | 305.8 | **205.7** |
| `/sources` | 305.9 | 307.5 | **198.5** |
| `/onboarding` | 306.2 | 307.8 | **209.5** |
| `/home` | 310.0 | 313.0 | **287.5** |
| `/plan` | 309.2 | 311.5 | **279.7** |
| `/profile` | 307.9 | 309.9 | **282.6** |
| `/ask` | 308.1 | 310.2 | **288.1** |
| `/spending` | 312.9 | 314.5 | **302.1** |
| `/what-if` | 406.8 | 408.3 | **278.3** (+ Recharts on demand) |
| `/styleguide` | 314.0 | 316.9 | 317.7 |
| legacy redirects | 297.7 | 299.3 | **191.0** |

The app routes keep ~80 kB more than the public ones. That's the shell's real interactive layer: the header's Menu, the Toast and Tooltip providers, and Base UI's floating positioning.

**Files.** `package.json`, `package-lock.json`, `app/layout.tsx`, `app/(app)/layout.tsx`, `app/providers/FinPathProvider.tsx`, `app/components/Diagnostic.tsx`, `app/(app)/what-if/ScenarioExplorer.tsx`, the five legacy `page.tsx`, `lib/categories.ts` (deleted), `CLAUDE.md`.

**Checked** against the production build (`next start` on :3100) with headless Chrome:
- **Styles:** they survive the `sideEffects` change on every public, auth and app page (canvas colour, Inter, the accent primary button).
- **API calls:** `/api/spending` requests per page are 0 on `/login`, `/signup`, `/forgot-password` and `/sources`, and 1 each on `/`, `/home` and `/what-if`.
- **Chart:** the Recharts SVG mounts on `/what-if`.
- **Toast:** saving a profile block still shows "Your figures are saved".
- **Redirects:** `/dashboard`, `/counselor` and `/vault` return 308.

**Needs a human look.** `/what-if` on a slow connection, to see the placeholder hand over to the chart. Your backend's CORS allowlist only admits :3000, so on :3100 the data came from the fallback params; the numbers are the same.

**Where to see it**
- DevTools → Network on `/login`: no `/api/spending` request. On `/home`: exactly one, with your own allowance.
- `/what-if`: a plain sunken block for a moment, then the chart.
- `/dashboard` in the address bar: a 308 to `/home`.

## Phase 12 — Accessibility · `5cfd595`

**What changed.**
- **44 px targets.** Every control reaches 44 px.
  - `Button` is 44 px (was 40). `sm` keeps its 32 px look with a 44 px hit area, and Profile's Edit buttons move to full size (the Phase 9 deferral).
  - `Segmented`, `Tab` and the slider's box are 44 px.
  - The Modal close is 44 px (was 24), and so is the Sheet close (38; its comment already claimed 44).
  - The wordmark, the header nav's short "Ask", the account button, the footer links, the public header links, the password reveal, and all five auth-screen text links.
- **Focus.** `TabPanel` is a tab stop in Base UI and had no ring; it now uses the accent ring. Every other stop on every route already drew it.
- **Names.** No control on any route is missing an accessible name, before or after.
- **New doc: `docs/refactor/a11y-walkthrough.md`.** The method, the key-by-key interaction checks, every fix with before and after sizes, the argued exceptions, and the full Tab order of 11 routes.

**Files.** `components/ui/{button,segmented,tabs,slider,modal,sheet,header,footer,password-input}.tsx`, `app/components/{AppHeader,PublicHeader}.tsx`, `app/(auth)/{layout,login/LoginForm,signup/SignupForm,forgot-password/page}.tsx`, `app/(app)/profile/page.tsx`, `docs/refactor/a11y-walkthrough.md`.

**Checked.** Headless Chrome with real key events:
- **Target audit:** 11 routes at 375 and 1280 px; nothing under 44 px left except the argued exceptions.
- **Tab walk:** every route, and every stop draws the ring.
- **Skip link:** the next Tab lands in the content.
- **Account menu:** Enter opens it, ↓ moves, Esc closes it and returns focus.
- **Segmented:** arrow keys move the selection.
- **Modal and Sheet:** focus is trapped inside, Esc closes, and focus returns to the trigger.
- **Screenshots:** `/profile` at 375 px and `/plan` at 1280 px.

**Exceptions** (argued in the doc):
- Inline `[n]` citation markers, which sit inside a sentence (WCAG 2.5.8 exempts them).
- The hidden file input; its label is the target.
- No skip link on the auth screens; only the wordmark comes before the form.

**Needs a human look.** A pass with a real screen reader (NVDA or VoiceOver); nothing here substitutes for one. Also the `/ask` inspector sheet with a real answer (same component as the tested Sheet).

**Where to see it**
- Any page: buttons are slightly taller (44 px). Tab from the address bar and every stop shows the green ring.
- `/profile`: the Edit buttons are full size.
- `/spending` → Tab past "Statement": the tab panel now shows its ring.
- `/login`: "Forgotten your password?" and "Create an account" are comfortable to tap.
