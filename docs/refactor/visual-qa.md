# Visual QA pass (Phase 13)

**Date:** 2026-09-28 · **Branch:** `ux-refactor` · **Brief:** `BRIEF.md`, Phase 13

Every route in the route table (`01-audit.md` §1) at **375 × 812** (a phone, emulated as mobile) and **1280 × 900**, against `npm run dev`.

## How it was checked

The Chrome extension wasn't connected. Every check ran in headless Chrome over the DevTools protocol, with a throwaway device account in a scratch profile. It measured the rendered page with computed styles, not by reading source, and took a screenshot of the first screen of every route at 375 px. Those were read by eye for the next-step column.

| Check | How it was decided |
| --- | --- |
| **Paper palette** | The `body` background is `--color-canvas`. **Every** colour actually rendered (text, background, every drawn border, SVG fill and stroke, charts included) is compared with the 15 tokens, read live from `:root`. Anything else is a leak: old cool-greys, pure white, pure black, Tailwind defaults. |
| **Two type roles** | Every text node's family is Inter or Instrument Serif, and no Instrument Serif text is under 24 px (the brief's floor). |
| **One primary** | Visible controls with the accent-filled variant, **counted even when disabled**. |
| **Next step on a phone** | At 375 px, the screen's next step sits above the fold. On app screens the fold is the top of the fixed bottom bar (749 px); on others it's the viewport (812 px). |
| **No leftovers** | No gradients, shadows, rounded corners (the avatar excepted), images, decorative SVG (only lucide icons, the score arc and charts), and no sideways scroll. |
| **Three text sizes** | Running-text sizes only: reading, body, label, eyebrow, subhead, data text. Headings, the page title and figures are excluded (see the note under the table). Kept from the first Phase 13 pass, now at both widths. |

## Fixed in this pass

| Route | Problem found | Fix |
| --- | --- | --- |
| `/plan` | At 375 px the first screen held the title, the progress meter and the "Also in FinPath" links. The live stage started at the fold and its action wasn't visible. | The header now names the next action ("Your next step: Pay your card's full statement balance, not the minimum. Go to it ↓"), jumping to the live card. "Also in FinPath" moved to the foot of the page, where Home already has it. |
| `/spending` | The recommended adjustment, the screen's next step, sat two screens down at 375 px. | When there is an excess, the header states it in the brief's own voice ("₹28,800 went to discretionary spending this month — ₹23,400 above your 30% line. See the adjustment ↓") and jumps to the adjustment. In ink, never red. |
| `/sources` | No primary at all: the header's CTA was secondary, and the page has no action of its own. | `PublicHeader` takes `primary`, which `/sources` alone passes. The landing page and the 404 keep their own primary and a secondary header button. |

Both jumps were followed at 375 px, and each lands with the target's primary button fully on screen.

## Results

42 route × viewport × state checks, **all passing**. On `/` and `/sources` the header CTA follows the session, so both states were checked.

| Route | State | Width | Paper palette | Type roles | One primary | Next step visible on a phone (375) | No leftovers | Text sizes (px) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/home` | signed in | 375 | ✅ | ✅ | ✅ 1 | ✅ “See your actions →” under the greeting (the primary sits in Your next steps, below) | ✅ | ✅ 16 · 14 · 12 |
| `/spending` | signed in | 375 | ✅ | ✅ | ✅ 1 | ✅ “See the adjustment ↓” in the header (added in 13b); jumps to the primary | ✅ | ✅ 16 · 14 · 12 |
| `/plan` | signed in | 375 | ✅ | ✅ | ✅ 1 | ✅ “Your next step: … Go to it ↓” in the header (added in 13b); jumps to the live card | ✅ | ✅ 16 · 14 · 12 |
| `/what-if` | signed in | 375 | ✅ | ✅ | ✅ 1 | ✅ the first slider — this screen’s step is to move it | ✅ | ✅ 16 · 14 · 12 |
| `/ask` | signed in | 375 | ✅ | ✅ | ✅ 1 (disabled until you type) | ✅ the composer, pinned above the phone bar | ✅ | ✅ 17 · 14 · 12 |
| `/profile` | signed in | 375 | ✅ | ✅ | ✅ 1 | ✅ Income’s Edit (the primary) | ✅ | ✅ 16 · 14 · 12 |
| `/onboarding` | signed in | 375 | ✅ | ✅ | ✅ 1 | ✅ Continue (the primary) | ✅ | ✅ 16 · 14 · 12 |
| `/styleguide` | signed in | 375 | ✅ | ✅ | 8 (exempt) | n/an/a: the review surface, which shows every variant on purpose | ✅ | — |
| `/dashboard` → 308 `/home` | signed in | 375 | ✅ | ✅ | ✅ 1 | ✅ “See your actions →” under the greeting (the primary sits in Your next steps, below) | ✅ | ✅ 16 · 14 · 12 |
| `/counselor` → 308 `/ask` | signed in | 375 | ✅ | ✅ | ✅ 1 (disabled until you type) | ✅ the composer, pinned above the phone bar | ✅ | ✅ 17 · 14 · 12 |
| `/simulator` → 308 `/what-if` | signed in | 375 | ✅ | ✅ | ✅ 1 | ✅ the first slider — this screen’s step is to move it | ✅ | ✅ 16 · 14 · 12 |
| `/roadmap` → 308 `/plan` | signed in | 375 | ✅ | ✅ | ✅ 1 | ✅ “Your next step: … Go to it ↓” in the header (added in 13b); jumps to the live card | ✅ | ✅ 16 · 14 · 12 |
| `/vault` → 308 `/sources` | signed in | 375 | ✅ | ✅ | ✅ 1 | ✅ the header CTA, primary on this page since 13b | ✅ | ✅ 16 · 14 |
| `/` | signed in | 375 | ✅ | ✅ | ✅ 1 | ✅ the hero CTA (the primary) | ✅ | ✅ 17 · 14 · 12 |
| `/sources` | signed in | 375 | ✅ | ✅ | ✅ 1 | ✅ the header CTA, primary on this page since 13b | ✅ | ✅ 16 · 14 |
| `/no-such-page` | signed in | 375 | ✅ | ✅ | ✅ 1 | ✅ Go to Home (the primary) | ✅ | ✅ 16 · 14 · 12 |
| `/home` | signed in | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 · 12 |
| `/spending` | signed in | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 · 12 |
| `/plan` | signed in | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 · 12 |
| `/what-if` | signed in | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 · 12 |
| `/ask` | signed in | 1280 | ✅ | ✅ | ✅ 1 (disabled until you type) | — | ✅ | ✅ 17 · 14 · 12 |
| `/profile` | signed in | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 · 12 |
| `/onboarding` | signed in | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 · 12 |
| `/styleguide` | signed in | 1280 | ✅ | ✅ | 8 (exempt) | — | ✅ | — |
| `/dashboard` → 308 `/home` | signed in | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 · 12 |
| `/counselor` → 308 `/ask` | signed in | 1280 | ✅ | ✅ | ✅ 1 (disabled until you type) | — | ✅ | ✅ 17 · 14 · 12 |
| `/simulator` → 308 `/what-if` | signed in | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 · 12 |
| `/roadmap` → 308 `/plan` | signed in | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 · 12 |
| `/vault` → 308 `/sources` | signed in | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 |
| `/` | signed in | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 17 · 14 · 12 |
| `/sources` | signed in | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 |
| `/no-such-page` | signed in | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 · 12 |
| `/` | signed out | 375 | ✅ | ✅ | ✅ 1 | ✅ the hero CTA (the primary) | ✅ | ✅ 17 · 14 · 12 |
| `/sources` | signed out | 375 | ✅ | ✅ | ✅ 1 | ✅ the header CTA, primary on this page since 13b | ✅ | ✅ 16 · 14 |
| `/login` | signed out | 375 | ✅ | ✅ | ✅ 1 | ✅ Sign in (the primary) | ✅ | ✅ 16 · 14 |
| `/signup` | signed out | 375 | ✅ | ✅ | ✅ 1 | ✅ Create account (the primary) | ✅ | ✅ 16 · 14 |
| `/forgot-password` | signed out | 375 | ✅ | ✅ | ✅ 1 | ✅ Send reset link (the primary) | ✅ | ✅ 16 · 14 |
| `/` | signed out | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 17 · 14 · 12 |
| `/sources` | signed out | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 |
| `/login` | signed out | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 |
| `/signup` | signed out | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 |
| `/forgot-password` | signed out | 1280 | ✅ | ✅ | ✅ 1 | — | ✅ | ✅ 16 · 14 |

**On the size rule.** "At most three text sizes per screen, not counting the hero figure" is applied to running text. Two things are excluded:
- **Display roles** (the page title, section headings, the serif hero figure). Every screen has a display title, so counting it would leave room for only two text sizes, which the approved screens never had.
- **Figures in `type-data` at `amount-lg`** (24 px): the four "This month" figures on `/home`, the scenario amounts on `/what-if`, the import summary. They're numerals in the figure role, not text. `/home`'s "0 of 8" is one of these; it is a `Metric` beside three `Money` figures of the same size.

Counted this way, every screen uses at most three running-text sizes at both widths.

## Codebase leak search (step 3)

| Search | Result |
| --- | --- |
| Raw hex outside `globals.css` | **None**, excluding test fixtures and `#anchor` links |
| Default Tailwind palette classes (`text-gray-*`, `bg-slate-*`, `bg-white`, …) | **None** |
| Default Tailwind font sizes (`text-sm`, `text-2xl`, …) | **None**. The `default-font-size` design-lint rule has enforced this since Phase 2. |
| Literal `fontSize` in JS props | **None** |
| Raw `uppercase` outside `type-eyebrow` | **None** in markup. Only prose in comments and styleguide captions. |
| Arbitrary `[…]` values | 9, all layout: grid templates (`what-if`, `select`), `calc()` widths and heights (`modal`, `sheet`), a `has-[:focus-visible]` selector (`choice`), and a transition property list (`sheet`). None is a colour, radius, shadow or type size, which matches how `01-audit.md` §8 classed them. **Not changed.** |
| Inline `style` | 8, all data-driven geometry: distribution segment widths, progress fill and target marker, the stepper bar, the score dial's width, styleguide swatches and bars. **Not changed.** |
| `npm run design-lint` | Passes; the baseline is empty. |

Nothing needed fixing. The palette, font and decoration checks above confirm it on the rendered pages too.

## Could not check

- **The route error boundary (`app/error.tsx`).** Triggering it means making a route throw, which needs a code change. It is unchanged since `main`, uses the same tokens, and has one primary ("Try again").
- **`/ask` with real answers.** Every question costs a call to your Gemini key. The empty state and the composer were checked here; answers were checked live in Phase 8.
- **Real devices and other engines.** Only Chrome was used, emulating a phone. Safari on iOS (safe-area insets, the sticky composer) and Firefox are unchecked.
- **The "N" disc in the corner of every screenshot** is Next's dev-mode indicator. It isn't in the production build.
