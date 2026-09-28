# FinPath India — Editorial UX Refactor Brief

You have full local access to this repository. This brief covers two things at once: a UX and workflow refactor, and a visual direction ("calm editorial"). Every change must be visible in the running website at http://localhost:3000. A phase that only produces documents, or changes code that no rendered screen uses, is not done.

---

## 0. Context — read before doing anything

**Stack:** Next.js 16 (App Router, React 19), Tailwind v4 with all design tokens in `frontend/app/globals.css` (there is no tailwind.config), shadcn / @base-ui primitives in `frontend/components/ui/`, pure business logic in `frontend/lib/`, FastAPI backend in `backend/`. There is no Vite, no `src/main`, no `App.tsx`.

**Read these first, in this order, and follow them:**
1. `/CLAUDE.md`
2. `frontend/AGENTS.md` — Next 16 has breaking changes. Before writing any Next-specific code (routing, layouts, server/client components, metadata, fonts), read the relevant guide in `frontend/node_modules/next/dist/docs/`.
3. `docs/design-plan.md` and `docs/audit.md` — earlier design decisions. Where this brief conflicts with them, this brief wins, but list every conflict in the audit so I can confirm.
4. `frontend/app/globals.css` (the token file and its comments), `frontend/app/layout.tsx` (fonts), `frontend/app/components/nav.ts`, `frontend/components/ui/index.ts`, `frontend/lib/format.ts`, `frontend/scripts/design-lint.ts`, `frontend/scripts/check-contrast.mjs`.

**What already exists — refine it, don't replace it.** The current design already has editorial foundations: Instrument Serif (display) + Inter (UI) self-hosted through `next/font`, a deep green accent, square corners, no shadows, no gradients, a margin gutter token (`--width-gutter`), `en-IN` currency formatting in `lib/format.ts`, and components such as `margin-note`, `citation`, `provenance` and `source-panel`. The site is light-only by an explicit decision in `globals.css`. This refactor keeps all of that. What changes: the neutrals become warm paper tones, typography roles get stricter, the layout and information hierarchy are rebuilt screen by screen, and the navigation and flows are simplified.

---

## 1. North star

FinPath should feel like a quiet library, not a shop. Other apps students use are storefronts: glossy, dark, full of gradients and offers, because they earn by selling a product. FinPath sells nothing and shows its sources, so it should look like a well-made textbook or the personal-finance section of a good newspaper: warm paper, clear type, numbers given room, and sources in the margin.

When a design decision isn't covered below, choose the option a careful editor would choose: less decoration, more clarity, and a visible source.

Every screen must answer one question within the first screenful on a 375px phone: **"What should I do next?"**

---

## 2. Hard constraints (apply to every phase)

- **Backend is out of scope.** Do not modify anything in `backend/`. Do not change any `/api/*` request or response shape, and never change the `␟SOURCES␟` streaming contract used by the chat.
- **Business logic is frozen.** Do not change the behaviour or output of functions in `frontend/lib/`. All golden fixtures in `lib/__fixtures__/` must pass unchanged. If a change seems to require editing a fixture, stop and ask me. New pure functions may be added (see Phase 7) with their own tests.
- **No feature may disappear.** Every route that exists today stays reachable, either directly or through a redirect.
- **Trust features stay visible:** inline `[n]` citations, the citation inspector, the grounded/general mode badge, the "not from a verified source" label, the educational disclaimer, and in-browser CSV parsing (a statement never reaches the API).
- **No fabricated data.** Never hardcode mock numbers on a production path (design-lint enforces this). If a field I ask for has no real data source (for example, estimated completion time), define it in one typed config file, tell me, and do not invent values anywhere else.
- **Currency** is formatted only through the existing Money component and `lib/format.ts` helpers (`en-IN` grouping: ₹1,50,000, never ₹150,000).
- **Tokens are the only source of visual values.** Change colors, fonts, spacing and sizes by editing tokens in `globals.css`, never with raw values in components. Do not add entries to `design-lint.baseline.json` to make lint pass. List every token you add, rename or change.
- **Fonts:** keep exactly two families, Instrument Serif and Inter, loaded through `next/font`. No external font requests, no third family.
- **Light-only.** Do not add a dark theme. This is an existing decision, and it fits the paper aesthetic.
- **No new npm dependencies** without asking me first.
- **Branch and commits:** work on branch `ux-refactor`. Make one commit per phase with the message `ux(phase-N): <summary>`.
- **Gate:** `npm run verify` (typecheck + design-lint + check-contrast + tests + build) must pass at the end of every phase. Never commit a phase that fails it.

---

## 3. Workflow

- **Phase 1 is read-only.** Write the audit, then STOP and wait for my approval before changing any code.
- **Phase 2 comes next and changes the whole site at once** (tokens and typography), so the new look is visible on every route before the screen-by-screen work begins.
- After approval, work through the phases in order. At the end of each phase:
  1. Run `npm run verify`.
  2. Commit.
  3. Report in 3–6 lines: what changed, files touched, anything deferred.
  4. Add a **"Where to see it"** list: each affected route, and what I should notice there (for example, "`/home` — score dial now sits alone above the fold; the old charts are gone").
- If you have a browser tool available, open each affected route at 375px and 1280px wide and check it yourself before reporting. If you don't, say so, and make the "Where to see it" list precise enough for me to check by hand.
- Stop and ask whenever you hit a decision this brief doesn't settle. Do not guess on product decisions.

---

## Phase 1 — Audit (no code changes)

Read every file in `frontend/app`, `frontend/components`, `frontend/lib`, `frontend/app/providers`, and `frontend/scripts`. Read `backend/main.py` and `backend/nudge.py` only to document the API contracts.

Write `docs/refactor/01-audit.md` containing:

1. **Route table:** route, file, public or authenticated, data sources, what the user can do there, and whether it's in the nav.
2. **Feature inventory:** a numbered checklist of every user-facing capability. This becomes the acceptance checklist at the end.
3. **Duplicate or legacy routes:** `/dashboard` vs `/home`, `/counselor` vs `/ask`, `/simulator` vs `/what-if`, and any others. Find out which are live and which are legacy, and propose keep, redirect, or merge for each. Delete nothing.
4. **Flows:** authentication (`AuthProvider`, `lib/auth.ts`), onboarding (`lib/onboarding.ts`), state (`FinPathProvider`, `lib/persist.ts`), and API (`lib/api.ts` → backend).
5. **Mermaid diagrams:** routes and navigation, component dependencies, state flow, API flow.
6. **Component inventory:** every primitive in `components/ui`, where it is used, and any duplicates or one-off styles in pages.
7. **Current visual inventory:** for each route, a short description of what the screen looks like today and what the user's next step is (or "unclear"). Record the current value of every color, font and size token in a table. This is the "before" for `before-after.md`.
8. **Style leaks:** every raw hex value, arbitrary Tailwind value (`[…]`), default Tailwind palette class (`text-gray-*`, `bg-slate-*` and so on) and inline style found outside `globals.css`.
9. **Health score:** whether a score or health calculation already exists in `lib/`. If it does, document it. If it doesn't, propose a formula built only from existing lib outputs, with each input explained in one plain sentence.
10. **Conflicts:** every point where this brief conflicts with `design-plan.md`, `nav.ts` comments, `globals.css` comments, or the lint rules.
11. **Implementation plan:** file-level changes per phase, plus open questions.

Then STOP.

---

## Phase 2 — Visual foundation (implemented, whole site)

Apply the editorial direction through tokens and base styles, so every route changes at once.

### 2.1 Color: warm paper

Remap the existing token **names** to warm values. Keep the names so components don't need to change. Starting values (the light palette has been pre-checked against WCAG AA; `check-contrast` is the final judge, so adjust in small steps if any pairing fails and tell me what you changed):

| Existing token | Role | Proposed value |
| --- | --- | --- |
| `--color-canvas` | the page (paper) | `#FAF7F0` |
| `--color-surface` | panels on the page | `#F4F0E6` |
| `--color-surface-sunken` | inputs, wells, the user's chat turn | `#ECE7DB` |
| `--color-ink` | headings, amounts, primary text | `#1C1B19` |
| `--color-ink-secondary` | supporting text | `#4F4B44` |
| `--color-ink-muted` | labels, captions, marginalia | `#5E5A52` |
| `--color-ink-disabled` | disabled only | warm grey, keep its current contrast role |
| `--color-line` | hairline rules, card edges | `#E4DED1` |
| `--color-line-strong` | interactive boundaries | same as `--color-ink` |
| `--color-accent` | primary actions, progress, focus | keep the existing deep green |
| `--color-accent-wash` | accent backgrounds | warm-tinted green wash |
| `--color-critical` / `-wash` | real warnings and errors only | keep, warm the wash if needed |
| `--color-positive` / `-wash` | completed, on track | keep, warm the wash if needed |

Color rules:
- The page is paper-colored everywhere. Nothing is pure white (`#FFFFFF`) or pure black.
- The accent is used only for the one primary action on a screen, progress, links, and focus rings. Never for decoration.
- Critical color appears only for real problems. Overspending is information, not an error, so show it with ink and a clear sentence, not red panels.
- Never rely on color alone. Every badge, status and amount direction also has a word, a sign (+/−) or an icon.

### 2.2 Typography: two families, strict roles

- **Instrument Serif (display):** page titles, section headlines, the landing hero, and hero figures (the big rupee numbers). It ships one weight and is a display face, so never use it for paragraphs, labels, buttons, or anything smaller than 24px.
- **Inter (everything else):** body, UI, buttons, inputs, labels, tables, chat answers.
- **Body text:** at least 16px. Long reading text (counselor answers, explanations) at 17px with about 1.6 line-height, capped at the existing `--container-prose` width.
- **Section labels:** Inter, small, uppercase, slightly letter-spaced, in `--color-ink-muted`, like a newspaper section header.
- **Numbers:** every amount rendered through Money uses `tabular-nums` so columns align.
- At most three text sizes per screen, not counting the hero figure. Define the scale once as tokens.

### 2.3 Layout, rules and space

- Square corners and no shadows stay (existing decision).
- Separate sections with hairline rules (`--color-line`) and whitespace, the way a newspaper separates stories. Use bordered blocks only for things the user acts on (action cards, inputs, the chat composer).
- Generous vertical rhythm from the existing spacing scale. When unsure, add space rather than a border.
- On wide screens (≥1280px), use the margin gutter (`--width-gutter`) for margin notes and citations. Below that, they move inline under the paragraph they belong to.

### 2.4 Icons, imagery, motion, copy

- **Icons:** lucide only, and only where they do a job (nav items, functional buttons). No decorative icons, illustrations, mascots, stock photos, or emoji.
- **Motion:** only short opacity and position transitions using the existing `--dur-*` and `--ease-out` tokens. Respect `prefers-reduced-motion`.
- **Copy voice:** plain, second person, calm. No exclamation marks, no hype ("supercharge", "unlock"), no shame ("you wasted"). Money facts are stated neutrally: "₹4,200 went to wants this month — ₹600 above your 30% line."
- **Logo:** the wordmark stays small in the header. No oversized logos anywhere.

### 2.5 Apply it

- Update tokens in `globals.css`, keeping and updating its explanatory comments.
- Fix every style leak listed in the audit so no screen keeps the old cool-grey look.
- Update `/styleguide` so it shows the new palette, type roles and spacing.
- "Where to see it": every route, with a one-line note of the most visible change.

---

## Phase 3 — Navigation

Proposed target: **Home · Actions · AI · Profile**. Confirm this mapping in the audit before implementing:

- Home → `/home`
- Actions → `/plan` (label change only)
- AI → `/ask`
- Profile → `/profile`

Spending and What-if leave the primary nav but must stay reachable, through action cards and a clearly visible secondary link on Home and Actions. Update the rationale comment in `nav.ts` to match.

- **One source of truth:** a single `NAV` definition shared by desktop and mobile.
- **Desktop:** a slim header on the paper background with a hairline rule below it. Small wordmark on the left, nav links next to it, profile menu on the right.
- **Mobile:** a bottom bar on the paper background with a hairline rule above it, 44×44px touch targets, labels under icons, and safe-area insets.
- **Active item:** `aria-current="page"`, ink-colored text plus an underline or indicator bar. Never color alone.

---

## Phase 4 — Landing

- **Hero:** "Your money." / "One clear next step." set in Instrument Serif, large, with wide margins of empty paper around it.
- **One primary CTA** in the accent color: signup/onboarding for logged-out users, `/home` for logged-in users. At most one secondary text link.
- **Keep the inline diagnostic** (₹3,500 → ₹10,870 over ten years). It is the product's proof. Make the result figure the visual hero of the section, in Instrument Serif, with the explanation in small Inter underneath and its source shown as a margin note.
- **Trust line:** one short sentence stating that answers come from RBI, SEBI and NCFE publications and that FinPath sells nothing.
- Remove large graphics and decorative sections. Whitespace replaces them.

---

## Phase 5 — Onboarding

- `lib/onboarding.ts` logic and its validation stay unchanged. Reuse `components/ui/stepper.tsx`.
- **Steps:** one or two questions per step, with the question as a serif headline and a one-line explanation of why FinPath asks.
- **Progress:** always show "Step X of N" plus a thin accent-colored progress bar.
- **Navigation:** Back keeps previous answers. Enter advances.
- **Validation:** inline, on blur and on Next, in plain words ("Enter your monthly allowance in rupees").
- **Focus:** on each step change, move focus to the step heading.
- **Persistence:** answers are saved exactly as they are today.
- **Finish:** the last step leads straight to Home, where the first action card is already waiting.

---

## Phase 6 — Home (the primary screen)

Sections, in this order, separated by hairline rules:

1. **Greeting:** the user's name in Instrument Serif, plus one plain sentence summarising where they stand this month.
2. **Money Health Score** (`score-dial`): the number as the hero figure, and one line underneath naming what drives it. If a new formula was approved in Phase 1, it goes in `lib/` as a pure function with unit tests and a golden fixture.
3. **Top 3 priority actions,** using `ActionCard`, ranked by the existing plan logic. The first card holds the screen's one primary button.
4. **Progress summary:** a few figures in tabular numbers with short labels. No decorative charts.
5. **AI entry:** a single input ("Ask about budgeting, SIPs, credit…") that opens `/ask` with the question prefilled.
6. Secondary links to Spending and What-if.

Design empty states for a brand-new user and for a user with no spending data. Each empty state names the one next step (for example, "Import a statement or use sample data to see your spending"). Remove everything else from this screen.

---

## Phase 7 — ActionCard

Create `components/ui/action-card.tsx` and export it from `index.ts`. Props:

- `title` (Inter, medium weight, one line)
- `explanation` (at most two lines, `--color-ink-secondary`)
- `priority` (`high | medium | low`), shown as a small badge with a text label, not just color
- `estimatedMinutes` (shown as "~5 min")
- `action` (`{ label, href }` or `{ label, onClick }`)
- optional `done` state (ticked, muted, button replaced by "Done")

Style: paper surface, 1px `--color-line` border, square corners, no shadow, generous padding. Only the card marked primary by its parent uses the accent button; the others use secondary buttons.

Use it on Home, Actions, and everywhere recommendations appear. Delete the old recommendation markup once every usage has been replaced.

---

## Phase 8 — AI chat

Keep all existing behaviour and give it a ChatGPT-like structure with the editorial look:

- **Layout:** a single centered reading column (`--container-prose`) and a composer fixed to the bottom.
- **Turns:** the user's messages sit in `--color-surface-sunken` blocks aligned right. Answers sit directly on the paper as plain reading text (Inter 17px), with no bubble around them.
- **Composer:** 1px border, Enter sends, Shift+Enter adds a new line, and a Stop button appears while an answer is streaming.
- **Empty state:** a serif headline ("Ask anything about money"), the trust line, and four suggested prompts taken only from topics the indexed corpus actually covers (check `backend/data/`).
- **Citations:** inline `[n]` markers stay. On ≥1280px, each source appears as a margin note in the gutter next to its answer. Below that, sources appear as a compact list under the answer. The citation inspector opens as a side panel on desktop and a bottom sheet on mobile.
- **Mode badge:** keep "grounded" and "not from a verified source" labels, written as text, visible at the top of each answer.
- **Errors:** keep the rate-limit and failure messages, restyled as calm inline notes, not red panels.
- **Screen readers:** streamed text goes in an `aria-live="polite"` region.

---

## Phase 9 — Profile

- **Sections:** Personal, Income, Goals, Security, each a bordered block with a section label and an Edit button.
- **Editing:** Edit switches the block to inline editing with Save (primary) and Cancel.
- **Fields:** only fields that already exist. If a section has little real data (Security, given the local device-account auth in `lib/auth.ts`), show what exists honestly and tell me. Do not invent features.

---

## Phase 10 — Component standardization

- **Scope:** Button (primary, secondary, ghost, and their disabled and loading states), Input, Select, Card, Badge, section label, spacing, and the type roles from Phase 2.
- **Clean-up:** replace one-off styles in pages with these primitives and remove the duplicates.
- **Styleguide:** `/styleguide` shows every primitive, every variant, and the palette and type roles.

---

## Phase 11 — Performance

- **Baseline:** record the per-route sizes from `next build` before and after.
- **Server components:** use them wherever there is no interactivity.
- **Lazy loading:** load chart and heavy client code lazily.
- **Duplicate API calls:** deduplicate repeated calls, such as `/api/spending` being fetched from several places.
- **Memoization:** add `memo` / `useMemo` only where you can show a real re-render problem.
- **Unused code:** delete a file only after a search proves it is unused, and list every deleted file.

---

## Phase 12 — Accessibility (WCAG 2.2 AA)

- **Focus:** a visible accent-colored focus ring, plus a skip-to-content link.
- **Keyboard:** every flow (landing → signup → onboarding → home → action → AI → profile) works with keyboard only. Document the walkthrough.
- **Labels:** every control has a label, and icon-only buttons have `aria-label`.
- **Touch and motion:** 44×44px touch targets, and `prefers-reduced-motion` is respected.
- **Contrast:** `check-contrast` passes for every pairing in the new palette.

---

## Phase 13 — Visual QA pass

1. Run `npm run dev` and visit every route in the route table at 375px and 1280px wide.
2. For each route, confirm:
   - the warm paper palette and the two type roles are applied;
   - there is exactly one primary button;
   - the next step is visible without scrolling on a phone;
   - no old cool-grey surfaces, pure white, or leftover decorative elements remain.
3. Search the codebase once more for style leaks (raw hex, arbitrary values, default Tailwind palette classes) and fix anything found.
4. Write `docs/refactor/visual-qa.md`: a checklist with one row per route and viewport, the result, and anything you could not check yourself.

---

## Phase 14 — Deliverables

In `docs/refactor/`:

- **Diagrams (Mermaid):** repository workflow, user journey, component dependency graph, state flow, API flow.
- **`before-after.md`:** one row per screen (what it looked like and did before, what it is now, and why), plus a before/after token table.
- **`MIGRATION.md`:** route changes and redirects, renamed components, deleted files, and token changes.
- **`screenshots.md`:** the list of screenshots to capture (route, viewport, state such as empty or filled). Update the README screenshot placeholders to match. Do not generate images.

At the repository root:

- **`CHANGELOG.md`.**

Final report:

- The Phase 1 feature checklist, with every item ticked and the place it now lives.
- The before/after bundle sizes.
- Anything deferred, and anything that still needs my decision.

---

## Definition of done

- `npm run verify` passes.
- All golden fixtures pass unchanged.
- Every feature in the Phase 1 inventory is ticked.
- There are no backend changes.
- Every route shows the warm paper palette and the two type roles when I run the site locally.
- Every screen passes the "what should I do next?" test on a 375px phone.
