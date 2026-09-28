# Keyboard and target-size walkthrough (Phase 12)

**Date:** 2026-09-28 · **Branch:** `ux-refactor`

## How this was run

A headless Chrome driven over the DevTools protocol against `next dev`, with a throwaway device account in a scratch profile. The walkthrough doesn't depend on the Chrome extension, and it sends real key events: `Input.dispatchKeyEvent`, not `element.focus()`.

1. **Focus order.** On each route, press Tab until focus cycles. At each stop, record the element, its accessible name and its computed outline.
2. **Targets.** At 375 and 1280 px, measure every link, button, input and ARIA widget and list anything under 44 × 44 px (WCAG 2.5.5, §39).
3. **Names.** Flag any control whose accessible name is empty. None were found, before or after.
4. **Interactions.** Test by key alone: the skip link, the account menu, Segmented, a Modal and a Sheet.

To repeat it by hand: start on each route with the address bar focused, press Tab, and check the sequence below. Every stop should show the 2 px pine-green ring.

## Interactions

| Check | Keys | Result |
| --- | --- | --- |
| Skip link | Tab, Enter, Tab | First Tab focuses "Skip to content"; Enter moves to `#main`; the next Tab lands on the first link in the page content, not the nav. |
| Account menu | Enter, ↓, Esc | Opens on Enter; ↓ moves through the items; Esc closes and returns focus to the "Account" button. |
| Segmented (`/what-if`) | → | Moves the selection and focus together ("10 years" → "20 years"). |
| Modal (`/styleguide`) | Enter, Tab ×8, Esc | Focus moves inside; Tab stays trapped; the close button is 44 × 44; Esc closes and focus returns to the trigger. |
| Sheet (`/styleguide`, same component as the `/ask` inspector) | Enter, Tab ×8, Esc | Same as the Modal. |
| Onboarding | Enter | Advances a step, and focus moves to the new step's heading. Checked in Phase 5. |

## What was fixed

| Control | Before | After |
| --- | --- | --- |
| `Button` md (every page) | 40 px tall | 44 px |
| `Button` sm (ActionCard "Undo") | 32 px | 32 px drawn, 44 px hit area via a transparent `::after` |
| Profile "Edit" buttons | `sm`, 32 px | `md`, 44 px |
| `Segmented` | 36 px | 44 px (sm: 44 px hit area) |
| `Tab` | 38 px | 44 px |
| `Slider` (range input) | 16 px box | 44 px box; the track still draws thin |
| Modal close | 24 px | 44 × 44 |
| Sheet close | 38 px (the comment claimed 44) | 44 × 44 |
| Wordmark | 30 px tall | 44 px |
| Header nav "Ask" | 33 px wide | 44 px minimum |
| Account button | 42 px wide | 44 px |
| Public header links ("Trusted sources", "Sign in") | 20 px tall | 44 px |
| Footer links | 17 px tall | 44 × 44 minimum |
| Password reveal | 40 px wide | 44 px |
| Auth links ("Forgotten your password?", "Create an account", "Sign in", "Back to sign in", "Back to the home page") | 17–20 px tall | 44 px |
| `TabPanel` (a tab stop in Base UI) | focusable with no visible ring | accent ring |

## Argued exceptions

- **Inline citation markers `[1]` in coach answers.** They sit inside a sentence, which WCAG 2.5.8 exempts. At 44 px they would break the 17 px reading line they belong to. The same sources are listed, at full size, beside or under the answer.
- **The statement file input** is visually hidden inside `DropZone`. The target is the whole drop-zone label, which is far larger than 44 px and draws the focus ring through `focus-within`.
- **The skip link** is 1 × 1 until focused. When focused it's 44 px tall.
- **The auth screens have no skip link.** Only the wordmark comes before the form.

## Focus order after the fixes (1280 px)

Every stop listed draws the 2 px accent outline. `nextjs-portal` (Next's dev overlay, absent in production) is left out.

### `/home` — 20 stops
1. a “Skip to content”
2. a “FinPath”
3. a “Home”
4. a “Actions”
5. a “Ask”
6. a “Profile”
7. button “Account: Test”
8. a “See your actions”
9. a “Upload a statement for actuals”
10. summary “How the score was built”
11. a “All 8 actions”
12. button “I have paid it in full”
13. button “I have closed them”
14. button “I have set it up”
15. a “Import a statement”
16. button “Use an example month”
17. input “Ask about budgeting, SIPs, credit and more”
18. button “Ask”
19. a “Spending”
20. a “What-if”

### `/plan` — 16 stops
1. a “Skip to content”
2. a “FinPath”
3. a “Home”
4. a “Actions”
5. a “Ask”
6. a “Profile”
7. button “Account: Test”
8. a “Upload a statement for actuals”
9. a “Spending”
10. a “What-if”
11. button “I have paid it in full”
12. button “I have closed them”
13. button “I have set it up”
14. a “Update your buffer”
15. button “Mark as done”
16. a “See what it becomes”

### `/ask` — 13 stops
1. a “Skip to content”
2. a “FinPath”
3. a “Home”
4. a “Actions”
5. a “Ask”
6. a “Profile”
7. button “Account: Test”
8. a “How answers are sourced”
9. button “What is the power of compounding, and why doe”
10. button “How does inflation affect the money I save?”
11. button “What is the difference between saving and inv”
12. button “What should I check before taking a loan or u”
13. textarea “Ask your financial coach a question”

### `/profile` — 13 stops
1. a “Skip to content”
2. a “FinPath”
3. a “Home”
4. a “Actions”
5. a “Ask”
6. a “Profile”
7. button “Account: Test”
8. button “Edit personal”
9. button “Edit income and spending”
10. a “Redo the setup questions”
11. button “Edit goals”
12. button “Sign out”
13. a “How FinPath works”

### `/spending` — 14 stops
1. a “Skip to content”
2. a “FinPath”
3. a “Home”
4. a “Actions”
5. a “Ask”
6. a “Profile”
7. button “Account: Test”
8. a “Upload a statement for actuals”
9. a “See what it becomes”
10. a “Apply to my plan”
11. button[tab] “Statement”
12. div[tabpanel] “The figures above are the ones you entered du”
13. input “Drop your statement here, or choose a fileA C” (hidden)
14. button “Try it with a sample file”

### `/what-if` — 15 stops
1. a “Skip to content”
2. a “FinPath”
3. a “Home”
4. a “Actions”
5. a “Ask”
6. a “Profile”
7. button “Account: Test”
8. a “Upload a statement for actuals”
9. input “Invested each month”
10. input “Increase each year”
11. input “Assumed annual return”
12. button[radio] “10 years”
13. svg[application] “now1y2y3y4y5y6y7y8y9y10y₹0₹20L₹40L₹60L₹80L”
14. a “Set this up in my plan”
15. a “Ask how to start”

### `/` — 13 stops
1. a “Skip to content”
2. a “FinPath”
3. a “Trusted sources”
4. a “Sign in”
5. a “Get started”
6. a “Find my next step”
7. a “How answers are sourced”
8. input “An example purchase, in rupees”
9. a “Home”
10. a “Actions”
11. a “Ask”
12. a “Spending”
13. a “What-if”

### `/login` — 8 stops
1. a “FinPath”
2. input “Email”
3. input “Password”
4. button “Show password”
5. a “Forgotten your password?”
6. button “Sign in”
7. a “Create an account”
8. a “Back to the home page”

### `/signup` — 8 stops
1. a “FinPath”
2. input “Your name”
3. input “Email”
4. input “Password”
5. button “Show password”
6. button “Create account”
7. a “Sign in”
8. a “Back to the home page”

### `/forgot-password` — 5 stops
1. a “FinPath”
2. input “Email”
3. button “Send reset link”
4. a “Back to sign in”
5. a “Back to the home page”

### `/sources` — 10 stops
1. a “Skip to content”
2. a “FinPath”
3. a “Trusted sources”
4. a “Sign in”
5. a “Get started”
6. a “Home”
7. a “Actions”
8. a “Ask”
9. a “Spending”
10. a “What-if”

