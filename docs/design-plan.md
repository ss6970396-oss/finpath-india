# FinPath — Design Plan

**Date:** 2026-08-25
**Companion to:** [`audit.md`](./audit.md)
**Status:** proposed. Not yet implemented — this document is a Checkpoint 1 deliverable.

---

## 1. Visual direction

FinPath should read as **a financial publication that happens to be an
application**. Not a dashboard with editorial flourishes; a document that
computes.

The three references, and what each contributes:

- **A quality financial publication** — the sense that someone decided what
  belongs on the page. Generous margins, a single column of argument, headings
  that are typography rather than decoration.
- **An accounting ledger** — numbers align on a rule. A figure sits on a
  hairline because the hairline means *this is a real number*, arrived at from
  somewhere. Ledgers are the original interface for "where did my money go".
- **A statutory annotation** — the marginal note. Indian financial documents,
  passbooks and gazette notifications carry meaning in the margin: the clause
  reference, the authority, the qualification. That margin is where FinPath
  puts *why it is telling you this*.

What it must not be: a card grid on a grey background with a coloured KPI in
each corner. That is the default output of every AI-assisted build and the
thing §49 asks to be checked against.

The single sentence the whole design serves:

> **A nervous 20-year-old should be able to look at any page for four seconds
> and know what it says about their money, and where that came from.**

---

## 2. Principles

1. **The number is the interface.** Rupee figures get the largest type, the
   tabular face, and the strongest alignment. Everything else is annotation.
2. **Never assert without provenance.** Every claim carries a route back to its
   source — a citation for a regulatory statement, a formula and its inputs for
   a computed one.
3. **Restraint is the trust signal.** Colour is spent on status only. A page
   with no problems on it should be entirely black on off-white.
4. **Description, never character.** "Above your dining target," not "impulse
   spender." (§36.)
5. **Empty is a state, not a failure.** A new user's dashboard is designed, not
   defaulted. Never a fabricated figure standing in for one we don't have.
6. **One responsibility per page.** If a section doesn't serve the page's stated
   purpose, it belongs on another page or nowhere.

---

## 3. Colour system

The thirteen tokens from §11, verbatim, in `app/globals.css`. No twelfth
hex value anywhere else in the tree; `scripts/design-lint.ts` enforces it.

```
--canvas          #FCFCFB      --line            #E4E4E0
--surface         #F6F6F4      --line-strong     #2A2A2E
--surface-sunken  #EFEFEC
                               --critical        #A34A45
--ink             #2A2A2E      --critical-wash   #F7EFEE
--ink-secondary   #5A5A62      --positive        #4C5D50
--ink-muted       #64646C      --positive-wash   #F0F2EF
--ink-disabled    #A8A8AE
```

### 3.1 Measured contrast

Computed, not assumed (WCAG 2.x relative luminance, `npm run check-contrast`
will assert these):

| Foreground | on `canvas` | on `surface` | on `surface-sunken` | Verdict |
| --- | --- | --- | --- | --- |
| `ink` | 13.92 | 13.21 | 12.41 | AA / AAA |
| `ink-secondary` | 6.66 | 6.31 | 5.93 | AA |
| `ink-muted` | 5.71 | 5.42 | 5.09 | AA |
| `critical` | 5.65 | 5.36 | 5.03 | AA |
| `positive` | 6.84 | 6.49 | 6.10 | AA |
| `ink-disabled` | 2.30 | 2.19 | 2.05 | fails 1.4.3 — **disabled only**, which is exempt |
| `line` | 1.24 | 1.18 | 1.11 | fails 1.4.11 — **see below** |

Reversed pairs, for filled controls: `canvas` on `ink` **13.92**, on `critical`
**5.65**, on `positive` **6.84**. All AA.

### 3.2 Two rules that fall out of those measurements

**`--line` may never be the only boundary of an interactive control.** At
1.24:1 it fails WCAG 2.2 SC 1.4.11 (3:1 for UI component boundaries). It is for
dividers, table rules and card edges — decoration, which 1.4.11 exempts. Inputs,
selects, checkboxes and buttons take `--line-strong` (13.92:1). The design-lint
rule cannot catch this, so it is a review item on `/styleguide`.

**`--positive` and `--critical` sit 1.21:1 apart.** They are nearly identical in
luminance, so two chart series in those two colours are indistinguishable in
greyscale and to most colour-deficient viewers. This is not a defect in the
palette — it is the palette telling us what §43 already says: **charts in
FinPath do not encode series by hue.** Series are separated by direct labelling,
position, and an ink-opacity ramp; `positive`/`critical` are reserved for
*status*, where they never appear adjacent to one another and always carry a
word alongside.

### 3.3 What is being given up

The current system has 40 tokens including a six-colour categorical data ramp,
a three-step elevation ramp and a full dark mode with a contrast checker. §11
replaces it with thirteen light-only tokens, no shadows, no radius. This is
recorded as **conflict C-03** in the audit: the deletion of dark mode and of the
categorical ramp is a deliberate product decision, and it removes shipped
functionality. The plan below assumes it is approved.

---

## 4. Typography

`next/font` — two families, self-hosted, no external request.

- **Display: Instrument Serif.** High-contrast, sharp, editorial. Chosen over
  Playfair (too decorative at small sizes) and Bodoni Moda (too fragile for
  short UI headings).
- **UI + data: Inter.** For `font-variant-numeric: tabular-nums`, which every
  amount, percentage, date and count requires.

Six roles. Sizes are a modular scale, so no arbitrary size ever appears in a
component (`text-[13px]` is a design-lint failure — the current tree has ~190
of them):

| Role | Family | Size / line | Use |
| --- | --- | --- | --- |
| `.type-display` | Instrument Serif 400 | clamp(2.25rem → 3.25rem) / 1.1 | Page title, one per page |
| `.type-heading` | Instrument Serif 400 | 1.5rem / 1.25 | Section heading |
| `.type-subhead` | Inter 600 | 1rem / 1.4 | Sub-section, table group |
| `.type-body` | Inter 400 | 0.9375rem / 1.6 | Prose, descriptions |
| `.type-label` | Inter 500 | 0.8125rem / 1.4, +0.01em | Field labels, chips, nav |
| `.type-data` | Inter 500, `tabular-nums` | inherits, tracking -0.01em | **Every numeral** |

Serif is reserved for page titles, section headings and editorial statements.
It never appears in a control, a label, a table cell or a number.

`.type-data` is not optional decoration: a column of rupee figures in
proportional numerals does not align, and a ledger that does not align is not a
ledger.

---

## 5. Spacing, geometry, layout

- **8px scale.** `4` is permitted only for optical adjustment inside a control.
- **Radius: 0.** Every surface, control and badge. The single exception is the
  user avatar, which is a circle. Enforced by design-lint.
- **No shadows.** Depth comes from `--surface` / `--surface-sunken` and from
  `--line`. Never from a drop shadow, a blur, or a gradient.
- **Max content width 1200px**, with a **68ch measure** for prose. A financial
  explanation set at 1200px wide is unreadable regardless of how much whitespace
  surrounds it.
- **Separation by rule and space, not by card.** The current build wraps almost
  everything in a bordered card; the rebuild uses a horizontal rule and vertical
  space, and reserves an actual bordered container for things that genuinely are
  objects (a transaction, a source document, a simulator panel).

---

## 6. The signature element — the marginalia system

FinPath's one distinctive visual device.

### What it is

A left-hand margin column, present on every content surface, in which
annotations sit **beside** the thing they annotate rather than beneath it — the
way a clause reference sits beside a statutory paragraph, or a bank's stamp sits
in the margin of a passbook.

```
┌──────────────┬──────────────────────────────────────────────────┐
│              │                                                  │
│  RBI         │  A savings account must be credited with         │
│  Master      │  interest at quarterly intervals or shorter.     │
│  Direction   │                                                  │
│  p. 14       │                                                  │
│  ─────────   │                                                  │
│              │                                                  │
│  ⌐ 30% of    │  Dining          ₹4,280      ●  above target     │
│    ₹15,000   │  ───────────────────────────────────────────     │
│              │  Transport       ₹1,120      ○  on target        │
│              │  ───────────────────────────────────────────     │
└──────────────┴──────────────────────────────────────────────────┘
```

### Its anatomy

- A fixed **160px** margin column at ≥1024px, `--ink-muted`, `.type-label`.
- Annotations are **right-aligned against the gutter**, so they read as marginal
  notes rather than as a second content column.
- A **1px `--line` rule** runs the full height of the gutter boundary. This is
  the ledger hairline the existing `LedgerRule` component already establishes,
  promoted from a per-row detail to a page-level structure.
- Below 1024px the gutter collapses: annotations move inline, directly above
  the annotated element, still in `--ink-muted` `.type-label`, still preceded by
  a short rule.

### What may go in it, and nothing else

1. A **regulatory citation** — authority, document, page.
2. The **rule or formula** behind a computed figure ("30% of ₹15,000").
3. A **material qualification** — "indicative price, as of Aug 2026".
4. An **as-of date** for anything time-sensitive.

### What may never go in it

Section numbers, decorative quotes, tips, encouragement, repeated navigation, or
anything the reader could not act on. **If the margin is empty, that is correct.**
The device earns its meaning by being uncommon: a page where every paragraph has
a marginal note is a page where the margin means nothing.

### Why this and not something else

It is the one place where FinPath's two hard requirements meet. §34 says no
substantive regulatory claim without a citation, and §54 says the user must be
able to answer "why is FinPath showing me this". Both are demands for
*provenance*, and both are usually satisfied with a footnote or a tooltip —
which hides the answer behind an interaction. Putting provenance in a permanent
margin makes it structural: the page cannot be laid out without deciding where
each claim came from.

---

## 7. Component philosophy

- **One inventory.** Everything in `components/ui/`, exported from one barrel.
  The three overlapping systems in the audit's §5 collapse into it.
- **Primitives are states-complete before a page uses them.** Every primitive
  ships default / hover / focus / disabled / loading / empty / error / mobile,
  and `/styleguide` renders all of them. A page never invents a state inline.
- **No component owns a colour or a size.** Both come from tokens and roles.
  Design-lint enforces it mechanically.
- **Money renders through exactly one component.** `<Money>` is the render
  boundary: it applies `.type-data`, and it attaches the `inrToWords`
  accessible label so a screen reader says "four thousand two hundred eighty
  rupees" rather than "four two eight zero". This already exists and is kept.
- **`LedgerRule` is the compositional unit for anything with an amount.** Label,
  tabular amount, and the hairline the amount rests on. The hairline is never
  drawn as decoration — not under a heading, not as a divider flourish. It means
  "a real number sits here".

---

## 8. Navigation and shell

Seven categories, in this order, from §20:

```
Overview     /app
Spending     /app/spending          Ledger, Import
Simulators   /app/simulator         Step-up, FI age, Stress test, Habits
Counselor    /app/counselor
Plan         /app/plan
Sources      /app/sources
Settings     /app/settings/profile  Data & privacy
```

- **≥1024px:** persistent 240px sidebar. Text labels always; icons are
  supporting, never alone. Active item marked by a 2px `--line-strong` left bar
  **and** `--ink` weight — never by colour alone (§39).
- **768–1023px:** sidebar collapses to a top bar with a menu sheet.
- **<768px:** bottom bar for the five most-used destinations, sheet for the rest.
- Second-level routes (`/app/spending/ledger`) appear as tabs under the page
  header, not as sidebar children — the sidebar stays one level deep.
- Every `/app` page opens with a `PageHeader`: `.type-display` title, one line of
  `.type-body` purpose, and its actions right-aligned.

---

## 9. Dashboard hierarchy

`/app` answers one question: **how am I doing this month, and what next?**

Reading order, top to bottom, single column:

1. **The month, and the health score.** One `.type-display` figure, the band as a
   word, and — in the margin — the rule that produced it.
2. **The ratio that most needs attention.** One ratio, chosen by largest positive
   variance, not all three. Its target in the margin.
3. **Guilt-free remaining**, with the per-day figure beneath it.
4. **The next plan action**, as a single sentence with one link.
5. **The most recent flagged transaction**, as one `LedgerRule`.

Nothing else. No chart. Charts belong on `/app/spending` and the simulators,
where the reader has come to study something.

**When there are no transactions** (§27) items 1–3 are not rendered at all — not
zeroed, not greyed. In their place:

> **You haven't added any transactions yet.**
> FinPath needs a month of spending before it can tell you anything true about it.
> [ Import transactions ]   [ Add a transaction ]

This is finding **F-06** in the audit: with no data the engine legitimately
returns 60 / "Stable", because the unspent-buffer term pays out in full. The
engine is right and must not change; the **UI** withholds the figure.

---

## 10. Onboarding

Three steps, skippable, at `/onboarding` after signup:

1. **Money in.** Monthly allowance or income, and how often it arrives.
2. **About you.** Age, and income source (parents / stipend / part-time / salary).
3. **What you're working towards.** One goal from a short list, or free text.

Each step: one question, one input, a visible "Skip for now". Progress is "Step 2
of 3" in words, not a bar.

**If skipped**, the app enters a clearly-marked example mode: a persistent bar
reading *"You're looking at example figures. [Add your own]"*, and every amount
on the page rendered at reduced emphasis. Example data is never presented as the
user's own — that is the single most damaging thing a financial product can do,
and it is what the product does today by default.

---

## 11. Authentication

Server-side sessions, not JWTs — because §21 requires real logout invalidation
and rotation, and a stateless token cannot be revoked without building the
session table anyway.

- Argon2id password hashing.
- Session id in an **httpOnly, SameSite=Lax, Secure-in-production** cookie;
  opaque random 256-bit value; the row carries `user_id`, `created_at`,
  `expires_at`, `rotated_at`.
- Rotation on privilege change; deletion on logout; expiry enforced server-side
  on every request.
- Double-submit CSRF token for every state-changing request.
- Rate limiting per IP **and** per account on login, signup and password reset.
- One generic failure message: *"That email and password combination didn't
  match."* Same message, same timing, whether the account exists or not.
- Minimum 12 characters, checked against a common-password list. No composition
  rules — they produce `Password1!` and nothing else.
- **Every protected endpoint resolves the user from the session cookie.** No
  endpoint accepts a user id from the client. This is what the §22 test asserts.

Screens: `/login`, `/signup`, `/forgot-password`. Single centred column, max
420px, no illustration, no marketing copy. A login screen that sells is a login
screen that delays.

---

## 12. Counselor UX

The counselor should read as **a research assistant working from a shelf of
documents**, not as a chat app.

- **Two-column at ≥1024px**: conversation left, source panel right. The panel is
  persistent, not a modal — sources are the point, and hiding them behind a click
  says they are an afterthought.
- **Answers are documents, not bubbles.** Left-aligned, full measure, serif
  heading where the model produces one, `.type-body` throughout. No avatar, no
  bubble, no typing indicator with three bouncing dots. The stream itself is the
  progress indicator.
- The **user's question** is the one thing that gets a distinct ground
  (`--surface-sunken`), so the thread is scannable.
- **Streaming** keeps the existing contract exactly: body text, `\n␟SOURCES␟`,
  then the metadata JSON. It works, both ends agree on it, and it is not worth
  the risk of a rewrite. SSE is a possible later change, not a Phase-19 one.
- **Failure preserves the partial answer** and appends the reason, as the current
  implementation already does — then offers Retry. A stream that dies must never
  discard what it already said.
- The **grounded / general** distinction is rendered as a word in the margin
  ("from the corpus" / "not from a verified source"), never as a coloured badge
  alone.

---

## 13. Citation UX

The rule (§34): **no citation, no substantive regulatory claim.**

- Inline markers are `[1]`, `[2]` — `.type-data`, `--ink-secondary`, a real
  `<button>` with an accessible name of "Source 1: {document}, page {n}".
- Activating one scrolls the source panel to that entry and marks it; it does not
  open a modal.
- Each source entry shows: **title · authority · page · the retrieved clause
  verbatim** — and publication / amendment date **where the document states one**.
- Where the document does not state one, the field reads
  **"not stated in the document"**. It is never inferred, never left blank, and
  never filled with a plausible-looking date. `lib/corpus.ts` already carries
  this integrity rule and it is the correct one.
- This is **conflict C-02** in the audit: §34 requires publication and amendment
  dates, and the index holds four columns with no date among them. Resolving it
  needs a `document_meta` table populated by hand from each PDF's front matter —
  new Phase 3 work, not a rendering change.
- When retrieval returns nothing relevant, the answer says so and **no chips are
  rendered**. A citation chip hanging off a refusal is worse than no chip.

---

## 14. Responsive strategy

Designed at **390px**, verified at 375 / 390 / 768 / 1024 / 1280 / 1440.

| Breakpoint | Shell | Margin gutter | Ledger | Simulator |
| --- | --- | --- | --- | --- |
| 375–767 | bottom bar | collapsed inline | stacked rows | inputs above output |
| 768–1023 | top bar + sheet | collapsed inline | stacked rows | inputs above output |
| ≥1024 | 240px sidebar | 160px gutter | table | two columns |

Non-negotiable at 375px: no horizontal page scroll; no text below 12px; every
target ≥44×44; filters in a sheet, never a squeezed toolbar; **the ledger stacks
rather than scrolls sideways** — a table you have to drag is a table you can't
read. Wide content that genuinely cannot stack (a long chart) scrolls inside its
own container, never the body.

---

## 15. Accessibility

WCAG 2.2 AA, verified with axe on `/styleguide`, `/app`,
`/app/spending/ledger`, `/app/counselor`.

- Semantic landmarks; one `h1` per page; heading levels never skipped.
- Focus visible on everything, 2px `--line-strong` at 2px offset — and it must
  survive `radius: 0`, which is where hand-rolled focus styles usually break.
- Status is **never colour alone**: every state carries a word or a glyph.
- Tables: `<caption>`, `<th scope>`, `aria-sort` on sortable headers.
- Charts: `<figure>` + `<figcaption>`, a visually-hidden data table, and
  `role="img"` with a summary label on the SVG.
- Every amount carries `inrToWords` via `<Money>`.
- Errors: `aria-describedby` from the field to its message, `aria-invalid`, and
  focus moved to the first error on submit.
- `prefers-reduced-motion` respected globally (already implemented).

---

## 16. Performance

Landing LCP under 2.5s on throttled 4G.

- `/` is a **Server Component with zero client JavaScript** beyond Next's
  runtime. Today it is `"use client"` and pulls in `ImpulseDiagnostic`, which
  imports the finance library. Both go.
- **No chart code on `/`.** Recharts is dynamically imported, on the four routes
  that draw.
- `/app` pages fetch on the server where the data is not interactive; Client
  Components only where a control needs state (sliders, the ledger's filters,
  the counselor's stream).
- Two font families, `display: swap`, subset to `latin`.
- Drop `sqlalchemy` and `psycopg2-binary` from the backend (audit R-12) and
  `tw-animate-css` from the frontend if the new motion set doesn't need it.

---

## 17. Critique of this plan against the brief

Read back against the prompt, honestly.

**Where the plan is weakest**

1. **The marginalia gutter costs 160px of a 1200px measure.** On a 1024px
   laptop that is a real bite out of the content column. Mitigation: the gutter
   only appears at ≥1024px and content reflows to 68ch regardless, so prose
   measure is unaffected — but a wide ledger will feel tighter than it does
   today. This is the main thing to look at during the §49 visual gate.

2. **"No shadows, no radius, one accent-free palette" can read as unfinished
   rather than as restrained.** The line between editorial and unstyled is
   thinner than the brief acknowledges. The load is carried entirely by
   typography, alignment and whitespace — which means the type scale and the
   ledger alignment have to be *right*, not approximately right. If §49 reads
   the result as bare, the fix is more contrast in the type scale, not the
   reintroduction of colour.

3. **Charts lose hue as an encoding channel** (§3.2), and four spending
   categories still need distinguishing. Direct labelling plus an ink-opacity
   ramp is the plan, and it is genuinely better for accessibility — but it
   constrains chart types hard. A four-series stacked area is effectively off
   the table. Bar and line charts with direct labels are what remain, and that
   is probably correct for this product anyway.

4. **§25 vs. the frozen CSV parser** is unresolved (audit C-01) and this plan
   assumes the browser-side parse survives. If that is rejected, `/app/spending/import`
   is a different design and a much larger piece of work.

5. **§34's date requirement is not satisfiable from the current index**
   (audit C-02). The plan's answer — render "not stated in the document" — is
   honest but is not what §34 asks for, and the gap closes only when the
   `document_meta` work lands.

**Where the plan may be over-reaching**

6. **Three overlapping component systems collapsing into one, plus 17 new
   primitives, plus a new palette, plus real auth, plus a database that does
   not exist yet.** Checkpoint 2 (tokens through `/styleguide`) is a large
   amount of work before anything is visible on a feature page. That ordering is
   correct — but it should be understood as a genuinely long stretch between
   checkpoints, not a quick pass.

**Where the plan is on firm ground**

7. Financial engines are frozen with 338 passing assertions across both
   languages, and both suites are mutation-checked. The riskiest part of a
   rebuild — silently changing what a number means — is the part best defended.
8. The existing codebase already has no raw hex outside `globals.css` and no
   stray `fetch()`. Design-lint and the typed API client are formalising
   discipline that is largely already being kept, so they should surface
   mechanical violations (`rounded-*`, `text-[13px]`) rather than architectural
   ones.
9. `LedgerRule`, `Money`, `DisclaimerNote` and `corpus.ts`'s integrity rule are
   the good bones of the current product and all four survive intact. The
   marginalia system is a promotion of `LedgerRule`'s idea, not a replacement
   for it.
