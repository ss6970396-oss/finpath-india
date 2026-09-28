# FinPath India — Phase 15: New Features Brief

This is one phase that adds six features. It runs as a single continuous piece of work, but it is split into ordered steps, each with its own verified commit, so that a usage limit or context reset never loses finished work.

Every feature must be visible and usable in the running website at http://localhost:3000. A step that only adds code no screen uses is not done.

---

## 0. Preconditions — check before starting

1. Phases 1–14 of `docs/refactor/BRIEF.md` are committed. Check `docs/refactor/progress.md` and `git log`. If any refactor phase is unfinished, **stop and tell me**; do not start this brief.
2. Create branch `features` from the latest commit of `ux-refactor` (or `main`, if `ux-refactor` has been merged).
3. Read, in order: `/CLAUDE.md`, `frontend/AGENTS.md`, `docs/refactor/BRIEF.md` (its design rules in Phase 2 apply to every new screen), `docs/refactor/01-audit.md`, `docs/refactor/progress.md`, `backend/main.py`, `backend/ingest.py`, `backend/nudge.py`.
4. Create `docs/features/progress.md`. After every step, append: step number, commit hash, what changed, where to see it, and anything deferred.

---

## 1. Rules for the whole phase

**Carried over from the refactor brief:**
- All design rules from the refactor brief's Phase 2 apply: warm paper palette, Instrument Serif only for display and one hero figure per block, Inter for everything else, one primary button per screen, color only for meaning, no decoration, calm copy with no exclamation marks.
- Existing `frontend/lib/` functions and golden fixtures stay frozen. New logic goes in **new** pure functions in `lib/`, each with Vitest tests.
- Currency only through Money and `lib/format.ts`. Tokens only from `globals.css`.
- No fabricated data on production paths. Any fixed number (fee rates, tax slabs, time values) lives in one typed config file with a source comment.
- The primary nav stays at four items (Home · Actions · Ask · Profile). New screens are reached through the "Also in FinPath" links, action cards, and the new Tools hub described below.

**What's different from the refactor brief:**
- **Limited backend changes are allowed**, only where a step below says so. The `␟SOURCES␟` response contract must not change. New request fields must be optional, with defaults that keep today's behaviour.
- **pytest may be added as a backend dev dependency** (`uv add --dev pytest`). No other new dependencies, frontend or backend, without asking me.

**Every step ends with:**
1. `npm run verify` passing in `frontend/`.
2. For steps that touch the backend: `uv run pytest` passing in `backend/`, and a manual check against `/api/health` and the affected endpoint.
3. A commit: `feat(15.N): <summary>`.
4. An entry in `docs/features/progress.md`, including a "Where to see it" list.

**Stop and ask only if:** a required source document or official figure is missing (steps 15.4 and 15.5 say exactly when), or verify fails and fixing it would require changing frozen logic, golden fixtures, the response contract, or adding a dependency. Otherwise keep going through every step.

**Browser checks:** if a browser tool is available, check each new screen at 375px and 1280px. If a capture fails, check by page structure and list the route under "needs a human look" in the progress entry.

---

## Step 15.1 — Backend groundwork

Needed before the AI features (15.4 and 15.6) can be trusted.

1. **Retrieval errors vs. real refusals.** In `/api/chat`, a failure inside retrieval (embedding rate limit, database error) must no longer become `hits = []` and the "I don't have a verified source" refusal. Return a clear, calm error message instead ("FinPath is busy right now — try again in a minute"), through the existing error path, not tagged as `grounded`.
2. **Input limits.** Add `max_length` to the chat message field (for example, 2,000 characters) and cap the in-memory query cache at a fixed number of entries (for example, 256, dropping the oldest).
3. **Ingest the held documents.** Move the PDFs in `backend/data_hold/` into `backend/data/` and run `uv run python ingest.py` (it is resumable and self-throttling; leave its batching alone). Then run `probe_threshold.py` with a spread of questions and adjust the grounded/general distance threshold only if the evidence supports it. Record the before/after threshold and the probe results in the progress entry.
4. **Tests.** Add `backend/tests/` with pytest cases that mock the Gemini embed and generate calls and cover: a grounded answer, a general answer, a retrieval failure (must not produce the refusal), and an over-length message (rejected).
5. **Trust line.** Once the new documents are indexed, update the trust line on the landing page and the Ask empty state so it names exactly the regulators whose documents are now in the index. Check `/api/health` for the document count before writing it.
6. Update `CLAUDE.md` where it describes retrieval routing, the corpus, and the absence of backend tests.

---

## Step 15.2 — Surface the four hidden calculations

The audit found four tested calculations with no screen: FI age, stress test, habits, and price equivalents. Use the existing functions unchanged; this step is UI only.

- **Price equivalents** → on `/spending`, next to each discretionary category and in the "Recommended adjustment" block: one plain line such as "₹1,200 on food delivery = about 4 days of mess meals." Use only the equivalence items the existing function already defines. If the user has set none, show nothing rather than defaults.
- **Stress test** → a new section on `/what-if` titled "What if your money stopped?", letting the student choose how many months of income stop, and showing in one sentence how long their savings last and what runs out first.
- **FI age** → a new section on `/what-if`: the estimated financial-independence age as the section's one serif hero figure, the assumptions listed in small text underneath, and a clear note that it's an estimate, not a promise.
- **Habits** → on `/spending`, below the category rows: the habit findings the existing function produces, each as an `ActionCard` whose action links to the relevant plan step.
- Every new block answers "what should I do next?" with one action or link.

---

## Step 15.3 — Tools hub and "No-cost EMI" truth checker

**Tools hub.** Create `/tools`: a simple page listing the new tools (EMI checker, Scam check, First-salary planner, Money letter), each as a short entry with one line of explanation and a link. Add "Tools" to the "Also in FinPath" link block on Home and Actions, and to the footer. Home stays marked in the nav while on any `/tools/*` page, matching Spending and What-if.

**EMI checker at `/tools/emi`.**

Purpose: show a student the real cost of an EMI, "no-cost EMI", BNPL or pay-later offer.

- **Inputs:** item price, number of monthly instalments, the monthly instalment amount (if the offer states one), processing fee, any upfront discount lost by choosing EMI, and whether GST applies to the fee and the interest component (default: yes, at the rate in the config).
- **Logic:** a new pure function in `lib/emi.ts` that returns the total amount paid, the extra paid over the upfront price (in rupees and as a percentage), and the effective annual interest rate, computed as an IRR on the actual cash flows (use a bounded bisection or Newton method; no new dependency).
- **Config:** `lib/emi-config.ts` holds the GST rate on financial services, with a source comment linking an official government source. Take the value only from an official source (CBIC or the GST Council); do not rely on memory. If you cannot confirm it from an official page, stop and ask me.
- **Tests:** a genuinely zero-interest case (effective rate ≈ 0), a no-cost EMI with a processing fee (rate > 0), a lost-discount case, and edge cases (one instalment, zero fee).
- **Screen:** the extra amount as the serif hero figure ("You pay ₹1,480 more than the price"), the effective annual rate beneath it in plain words, a small breakdown table in tabular numbers, and a one-line "What to do": ask for the upfront price, compare it with the total, check the fee.
- **Home or Actions:** if the plan contains any debt or EMI-related step, link it to this tool.

---

## Step 15.4 — "Is this a scam?" check

**Corpus check first.** Look through `backend/data/` after step 15.1 for regulator material on frauds and scams (fake investment tips, task scams, illegal lending apps, KYC and OTP fraud). If there is none, **stop and ask me** to download an official fraud-awareness document from the RBI or SEBI website. Do not download documents yourself, and do not build the feature on general model knowledge.

**Backend (allowed change):** add an optional `task` field to the chat request, with values `"chat"` (default) and `"scam_check"`. For `scam_check`, use a separate system prompt that:
- names the warning signs present in the pasted message, each backed by an inline `[n]` citation from the retrieved context;
- says clearly when the context doesn't cover the kind of message pasted;
- never tells the user a message is definitely safe;
- ends with the official next steps the context supports (for example, reporting channels named in the documents).

Retrieval, routing, the streaming contract and the grounded/general labelling stay exactly as they are. Add pytest cases for the new task value.

**Frontend at `/tools/scam-check`:**
- A textarea with the label "Paste the message, offer or link text".
- **Privacy before sending:** before anything leaves the browser, mask runs of 6 or more digits (OTPs, account numbers, phone numbers) and email addresses, and show the user the masked version they're about to send. Put the masking in a new pure function in `lib/` with tests.
- The same streaming, citation and mode-badge rendering as `/ask`. Reuse the existing parser and components; do not copy them.
- A permanent note: "FinPath points out warning signs from regulator material. It can't confirm a message is safe."
- Link to it from `/ask`'s empty state as one of the suggested actions.

---

## Step 15.5 — First-salary planner at `/tools/first-salary`

Purpose: help a student heading into placements understand a CTC offer.

- **Inputs:** annual CTC, and the parts of it that aren't monthly cash (for example, joining bonus, variable pay, employer PF contribution, gratuity), with short plain explanations of each.
- **Tax:** use only the income-tax rules for a clearly named financial year, taken from an official source (incometax.gov.in or the Union Budget documents), stored in `lib/tax-rules.ts` with the financial year, the source URL and the date you checked it. If you can't confirm the current slabs from an official page, **stop and ask me** for the source. Do not use tax figures from memory.
- **Logic:** a new pure function that gives the estimated monthly in-hand pay, then a first budget using the existing plan and budgeting functions, an emergency-fund target, and a starting SIP amount. Reuse existing `lib/` functions wherever they already do the job.
- **Tests:** fixed example offers with hand-checked expected results, recorded as a new golden fixture.
- **Screen:** the monthly in-hand figure as the serif hero figure, then "Where it could go" using `ActionCard`s for the first three steps, and a clearly visible line stating the financial year and that the result is an estimate for planning, not tax advice.

---

## Step 15.6 — Answers in Hindi and Telugu

**Backend (allowed change):** add an optional `language` field to the chat request: `"en"` (default), `"hi"` or `"te"`. The system prompt tells the model to write the answer in that language, while keeping the `[n]` citation markers, the refusal behaviour and the grounded/general rules exactly as they are. Source snippets stay in their original English.

**Retrieval check:** run `probe_threshold.py` with the same set of questions written in English, Hindi and Telugu. If Hindi or Telugu questions get systematically worse retrieval distances (so they wrongly fall into general mode), add one step that translates the question into English for retrieval only, and record the evidence in the progress entry. If they don't, change nothing.

Add pytest cases for the new field.

**Frontend:**
- A language choice (English · हिन्दी · తెలుగు) in the `/ask` composer area, remembered per account through the existing persistence layer, and applied to `/tools/scam-check` as well.
- The interface text itself stays in English in this step. Only the answers change language.
- Make sure Inter, or a system fallback, renders Devanagari and Telugu correctly. If Inter's `next/font` subsets don't include them, add the needed subset or fall back to system fonts. Do not add a third font family.

---

## Step 15.7 — Monthly money letter at `/letter`

A one-page, newspaper-style summary of the student's month, generated entirely in the browser from their own data. No AI call.

- **Logic:** a new pure function in `lib/letter.ts` that takes the month's spending and plan data and returns: a headline sentence, the one number that mattered most this month, what went well, what went over, and the single action for next month (taken from the existing plan ranking). Tests cover a normal month, a month with no data, and a month where everything stayed on target.
- **Screen:** the headline in Instrument Serif, a short dateline ("September 2026 · Your money letter"), the key number as the hero figure, two short paragraphs in 17px reading text, and the next action as an `ActionCard`. It should read like the front page of a small newspaper.
- **Month switcher** if data for more than one month exists.
- **Print:** a print stylesheet so "Print" or "Save as PDF" from the browser gives a clean single page with no nav.
- **Empty state:** "Your first letter appears after a month of spending data," with the one action to import a statement or use the example month.
- Link from Home, below the progress summary: "Read this month's letter."

---

## Step 15.8 — Finish

1. **README:** add each new feature to the features section with one sentence each, and update the architecture notes for the new request fields (`task`, `language`) and the new backend tests.
2. **`CHANGELOG.md`:** a Phase 15 section.
3. **`docs/refactor/screenshots.md`:** add the new screens (route, viewport, state).
4. **`/styleguide`:** add any new components or variants created in this phase.
5. **Final visual pass:** every new route at 375px and 1280px: paper palette, one primary button, next step visible without scrolling on a phone, no sideways scroll.
6. **Final report**, containing:
   - every step with its commit hash;
   - the list of things I must do myself (for example, verifying `lib/action-meta.ts`, checking the GST and tax sources you recorded, any document you asked me to download);
   - anything deferred.

---

## Definition of done

- Steps 15.1–15.8 are committed, each with verify (and pytest, where relevant) passing.
- All existing golden fixtures pass unchanged; new golden fixtures exist for the salary planner.
- The `␟SOURCES␟` contract is unchanged, and existing chat requests with no new fields behave exactly as before.
- Every new feature is reachable from the site and works at http://localhost:3000.
- Every fixed figure used by a new feature has a recorded official source.
