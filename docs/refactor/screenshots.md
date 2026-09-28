# Screenshots to capture (Phase 14)

The capture list for the refactored product. **No images were generated**: these are for you to take by hand from `npm run dev` at http://localhost:3000, and save to `docs/screenshots/` under the file name given.

## How to capture

- **Viewports:** 375 × 812 (a phone; use the browser's device toolbar) and 1280 × 800 (a laptop). Capture at 2× device pixel ratio.
- **The first screen only** unless the row says "full page". The brief's test is what a student sees before scrolling.
- **Account:** a fresh device account that has finished onboarding with plausible student figures, for example ₹18,000 income. Don't use real figures of your own, since the images are published in the README.
- **Hide Next's dev indicator** (the "N" disc, bottom-left) or capture from `npm run build && npm start`.
- **Stale images:** `landing.png`, `counselor.png` and `dashboard.png` in `docs/screenshots/` show the pre-refactor design. The README no longer references them. Delete them once the rows marked **README** are captured.

## The list

| # | File | Route | Viewport | State | What must be visible |
| --- | --- | --- | --- | --- | --- |
| 1 | `landing-1280.png` **README** | `/` | 1280 | signed out | The two-line serif hero, the one green "Find my next step", the "How answers are sourced" link, the paper background |
| 2 | `landing-375.png` | `/` | 375 | signed out | The hero and the CTA inside the first screen |
| 3 | `diagnostic-1280.png` | `/` (scroll to the diagnostic) | 1280 | signed out, the default ₹3,500 | ₹10,870 as the serif figure, the assumptions as a margin note in the left gutter, the projection disclaimer |
| 4 | `sources-1280.png` | `/sources` | 1280 | signed out | The library with the indexed booklet, the green "Get started" in the header (this page's one primary) |
| 5 | `login-1280.png` | `/login` | 1280 | signed out | The split screen: statement left, form right, one green "Sign in", the device-account note |
| 6 | `login-error-375.png` | `/login` | 375 | a wrong password submitted | The critical-ruled "Not signed in" note, not a red box |
| 7 | `onboarding-375.png` | `/onboarding` (press Continue once) | 375 | step 2, income | "STEP 2 OF 8", the thin accent bar, the serif question, the running total |
| 8 | `onboarding-error-375.png` | `/onboarding` | 375 | step 2 with income cleared and Enter pressed | The inline message "Enter your monthly income in rupees." and the field outlined |
| 9 | `home-375.png` | `/home` | 375 | declared figures only | The greeting, the standing sentence and "See your actions →" in the first screen |
| 10 | `home-1280.png` **README** | `/home` | 1280, full page | declared figures only | All six sections: greeting, score with its driver line, three ActionCards (one green), This month figures, the Ask box, Also in FinPath |
| 11 | `home-empty-1280.png` | `/home` (scroll to "This month") | 1280 | declared only, with no spending data | The note offering "Import a statement" or "Use an example month" |
| 12 | `home-example-375.png` | `/home` | 375 | "Use an example month" pressed | "Based on: An example month" and the example disclaimer |
| 13 | `plan-375.png` | `/plan` | 375 | nothing ticked | "Your next step: … Go to it ↓" in the first screen |
| 14 | `plan-1280.png` | `/plan` | 1280, full page | the first action ticked | The ladder, one "Now" stage, cards with priority and "~N min", the ticked card showing Done and Undo |
| 15 | `spending-375.png` | `/spending` | 375 | declared, discretionary above 30% | "₹… went to discretionary spending this month — ₹… above your 30% line. See the adjustment ↓" |
| 16 | `spending-sample-1280.png` **README** | `/spending` | 1280, full page | "Try it with a sample file" pressed | "Based on: A sample statement", the distribution in ink tints, off-track rows with arrows (no red), the adjustment with ₹ as the serif figure, "Rows waiting on you" |
| 17 | `spending-error-1280.png` | `/spending` → Statement tab | 1280 | an unreadable file dropped | The critical-ruled "That file could not be used" note |
| 18 | `what-if-1280.png` **README** | `/what-if` | 1280 | default values | The sliders, the three chart lines, the three scenario figures with the step-up one as the serif hero |
| 19 | `what-if-375.png` | `/what-if` | 375 | default values | The first slider inside the first screen |
| 20 | `ask-empty-375.png` | `/ask` | 375 | empty | "Ask anything about money", the trust line, four suggestions, the composer and disclaimer above the phone bar |
| 21 | `ask-grounded-1280.png` **README** | `/ask` | 1280 | after "What is the power of compounding…" (one Gemini call) | Your question in a sunken block on the right, "Grounded in N sources", the answer at 17 px with `[n]` markers, numbered sources in the left margin |
| 22 | `ask-grounded-375.png` | `/ask` | 375 | the same answer | The sources listed under the answer instead of in the margin |
| 23 | `ask-inspector-1280.png` | `/ask` → "Read the passages" | 1280 | the inspector open | The side panel with the verbatim passage and page |
| 24 | `ask-inspector-375.png` | `/ask` → "Read the passages" | 375 | the inspector open | The same inspector as a bottom sheet |
| 25 | `ask-general-1280.png` | `/ask` | 1280 | a question the corpus doesn't cover | "Not from a verified source" in words with its glyph, no source list |
| 26 | `profile-1280.png` | `/profile` | 1280 | viewing | The four blocks, Income's Edit as the one green button, Security with no Edit |
| 27 | `profile-edit-375.png` | `/profile` → Edit income and spending | 375 | editing | The inline form with Save (green) and Cancel, and the other Edit buttons hidden |
| 28 | `footer-signed-in-1280.png` | any app page, scrolled to the bottom | 1280 | signed in | The Account column: Your profile, Update your figures, Sign out |
| 29 | `styleguide-palette-1280.png` | `/styleguide` | 1280 | top | The 15 colour tokens and the type scale, read live |
| 30 | `not-found-375.png` | `/no-such-page` | 375 | any | The serif statement and one green "Go to Home" |

Rows 21–25 need the backend and Gemini: each fresh question is one call on your key, and a repeated question is served from the API's cache.

## Used by the README

| README section | File | Caption |
| --- | --- | --- |
| Top of the page | `landing-1280.png` | The landing page: one next step, and the diagnostic that shows a ₹3,500 purchase as the ₹10,870 it displaces over ten years. |
| What it does → coach | `ask-grounded-1280.png` | A grounded answer: every claim carries an inline `[n]`, and the sources sit in the margin beside it. |
| What it does → spending | `spending-sample-1280.png` | Spending from a statement parsed in the browser. The file never reaches the API. |
| What it does → what-if | `what-if-1280.png` | The what-if explorer, recomputed on every slider move from the server's own rate and horizon. |
| What it does → home | `home-1280.png` | Home answers one question: what to do next. |

The README holds an HTML-comment placeholder for each of these. Replace each placeholder with its image once captured.
