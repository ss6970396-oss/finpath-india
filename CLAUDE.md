# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

FinPath India — an AI financial-literacy counselor for Indian college students. Two deployables plus a vector store:

- `frontend/` — Next.js 16 (App Router, React 19, Tailwind v4, shadcn)
- `backend/` — FastAPI, Google Gemini, managed with `uv`
- `docker-compose.yml` — pgvector/Postgres 17, the RAG index

## Commands

All backend commands must run **from `backend/`** — `main.py` uses flat imports (`from nudge import ...`) and `ingest.py` globs `data/*.pdf` relative to the working directory.

```bash
# database (from repo root)
docker compose up -d db

# backend
cd backend
uv sync
fastapi dev main.py          # dev server on :8000, reload enabled
uv run python ingest.py      # embed backend/data/*.pdf into pgvector

# frontend
cd frontend
npm run dev                  # :3000, Turbopack
npm run build
npx eslint app               # `next lint` was REMOVED in Next 16
npx tsc --noEmit
```

The **backend has no test suite** — no pytest, no test files. Verify backend changes against `/api/health` and the two endpoints.

The frontend has Vitest, covering `lib/` only:

```bash
cd frontend
npm test                     # vitest run
npm run test:watch
```

`vitest.config.mts` must keep the `.mts` extension — as `.ts` it loads as CommonJS and Vite warns on every run. The suite is `environment: "node"` and `include: ["lib/**/*.test.ts"]` on purpose: everything under test is a pure function, and a jsdom environment would only invite tests that assert on rendering instead of on logic. Verify frontend changes with `npm test`, `npx tsc --noEmit` and `npx next build`.

`backend/.env` holds `GOOGLE_API_KEY` and `DATABASE_URL`, loaded via `python-dotenv`. `db.ensure_schema()` runs automatically on API startup and before every ingest, so no manual DDL is needed.

## Architecture

### The RAG path

`ingest.py` reads the RBI / SEBI / NCFE PDFs in `backend/data/`, splits them (900 chars, 150 overlap), embeds via `gemini-embedding-001` at 768 dimensions, and writes `(source, page, content, embedding)` rows into `documents`. It is resumable — it skips any `source` already present — and self-throttles (`BATCH=20`, `PAUSE=16`) to stay under the embedding rate limit. Leave both behaviours alone.

`/api/chat` retrieves before it generates: `retrieve()` embeds the question with the same model and dimensionality, then orders `documents` by cosine distance (`<=>`, matching the HNSW index). The hits become a numbered `CONTEXT` block; the system prompt forbids answering from anything else and requires inline `[1]`-style citations.

**The streaming contract is shared with the frontend and both ends must change together:** the body is the model's text, then `\n␟SOURCES␟`, then `json.dumps({mode, top_distance, sources})` — where `mode` is `"grounded" | "general"`, `top_distance` is the cosine distance of the nearest chunk (or `null` when retrieval never ran), and `sources` is a list of `{n, source, page, snippet}`. `app/counselor/page.tsx` splits on that sentinel, renders `sources` as citation chips and `mode` as a badge; it still accepts a bare array tail for compatibility. `SOURCES_DELIM` and `_meta_payload()` in `main.py` are the backend half.

Retrieval routes the request three ways:

- nearest chunk within `RELEVANCE_MAX_DISTANCE` → grounded path, `SYSTEM_PROMPT`, citations attached
- nearest chunk beyond it → the corpus does not cover the question, so `GENERAL_PROMPT` answers from the model's own knowledge with `mode: "general"` and an empty source list; the frontend shows an amber "not from a verified source" badge and no chips. The general prompt keeps every other guardrail — no named stocks or funds, education only, under 180 words, no invented figures.
- retrieval returned nothing at all (empty index or DB down) → still a flat refusal, not a general answer: an outage is not the same as a question the corpus does not cover, and falling back would hide it

`RELEVANCE_MAX_DISTANCE` is tuned against the live index, not guessed — `backend/probe_threshold.py` prints the top distance for covered, adjacent and unrelated questions and is how to re-tune it after ingesting more of the corpus. Financial questions the corpus only half-covers deliberately stay on the grounded path, where the model's own `NO_SOURCE_REPLY` refusal handles them.

Two deliberate refusal paths, both emitting an empty source list so no chips hang off a non-answer:

- retrieval returns nothing or the DB is unreachable → the endpoint refuses without calling the chat model at all
- the model itself answers `NO_SOURCE_REPLY` → `_is_refusal()` catches it (tolerating a curly apostrophe) and drops the sources

### Database access

`db.py` owns the connection. `DATABASE_URL` comes from `.env`, with a fallback matching docker-compose.

Note `_libpq_url()`: `.env` carries the SQLAlchemy form `postgresql+psycopg://…`, which `psycopg.connect()` cannot parse — it fails with a confusing `missing "=" ...`. The helper strips the dialect suffix. Keep it if you touch that code.

`schema.sql` is idempotent and is the only place the table shape is defined: the `vector` extension, `documents`, a `source` index for ingest's skip check, and an HNSW cosine index. `db.ensure_schema()` applies it from the FastAPI lifespan hook and from the top of `ingest.main()`. It must run before `register_vector()`, which raises if the `vector` type does not yet exist.

A DB failure at startup is logged and swallowed so `/api/health` and `/api/spending` keep working. `CONNECT_TIMEOUT` is 5s — without it libpq waits indefinitely and a chat request hangs for minutes instead of refusing.

The embedding dimension 768 appears in `schema.sql`, `EMBED_DIM` in `main.py`, and `ingest.py`. Changing it means changing all three and re-ingesting.

### Nudge engine (`backend/nudge.py`)

Fully working and independent of the LLM. `generate()` synthesises a month of UPI transactions from a merchant-category table, deliberately pushing Wants to ~45% of allowance so the rule fires. `analyse()` applies the rule (Wants > 30% of allowance → `triggered`) and projects the excess as a monthly SIP at 12% p.a. over 10 years. `/api/spending` returns `analyse(generate())` — fresh random data on every request, no persistence.

`SIP_ANNUAL_RATE`, `PROJECTION_YEARS` and `WANTS_THRESHOLD` in `nudge.py` are the single source of truth. They are echoed to the client as `projection_params` in the `/api/spending` payload.

The What-If slider needs to recompute per drag, so a round trip per tick is out and `frontend/lib/sip.ts` mirrors the formula. It deliberately **hardcodes no constants** — it takes them from `projection_params`. The dashboard also uses the server's own `projection` array whenever the slider sits at the default, so the local mirror only runs for hypotheticals. Change the rate in `nudge.py` and both sides follow.

If you edit either implementation, keep `sip_future_value` and `sipFutureValue` in step — they are annuity-due (contribution at the start of each month) and agree to the rupee.

### Frontend routes

The app is split into three shells, each a route group with its own chrome:

**Public** — `app/page.tsx` (landing) and `app/sources/page.tsx`. `PublicHeader` +
`SiteFooter`. No session required.

**`(auth)`** — `/login`, `/signup`, `/forgot-password`. Split-screen layout,
branding left and form right; the panel is dropped rather than stacked below
1024px.

**`(app)`** — `/home`, `/spending`, `/plan`, `/what-if`, `/ask`, `/profile`.
`app/(app)/layout.tsx` holds the ROUTE GUARD: no session → `/login?next=…`;
session but `isComplete(profile)` false → `/onboarding`. It waits for
`status === "resolved"` before deciding, which is why `AuthProvider.status` is
three-valued — a boolean would bounce a signed-in user on every hard reload.
The guard is routing, not authorisation; server-side enforcement arrives with
`NEXT_PUBLIC_AUTH_MODE=backend`.

`/onboarding` sits outside `(app)` (it would otherwise guard itself into a
loop) and requires only a session.

Legacy paths are kept as `redirect()` pages so old links resolve:
`/dashboard`→`/home`, `/counselor`→`/ask`, `/simulator`→`/what-if`,
`/roadmap`→`/plan`, `/vault`→`/sources`.

`/styleguide` is the review surface — every token, type role and primitive on
one page, with the token values read out of the DOM so it proves what the
utilities compile to. Check a visual change there before a feature page.

Primary navigation is five items, defined once in `app/components/nav.ts`:
Home, Spending, Plan, What-if, Ask. The desktop header and the phone bottom
bar render the SAME five — a navigation that changes shape between devices
teaches two mental models. Internal subsystem names never appear as labels
(no "Nudge Simulator", no "AI Counselor", no "Spending Engine").

The API base lives in exactly one place — `API` in
`app/providers/FinPathProvider.tsx`, which reads `NEXT_PUBLIC_API_URL` and
falls back to `http://127.0.0.1:8000`. Do not re-derive a base URL at a call
site, and route every request through `lib/api.ts` (`design-lint` fails on a
bare `fetch(`). CORS on the backend is an explicit allowlist
(`ALLOWED_ORIGINS` in `main.py`), not `["*"]`.

### Authentication (`frontend/lib/auth.ts`)

**The backend exposes no auth routes.** `lib/auth.ts` therefore defines the
contract and ships two implementations of it:

- `createHttpAuth(base)` — the real one. POSTs to `${API}/api/auth/*` with
  `credentials: "include"`, so the credential is an HttpOnly cookie the page
  cannot read and no token is ever put in localStorage. Selected by
  `NEXT_PUBLIC_AUTH_MODE=backend`. Turn it on the day those routes exist; no
  screen changes.
- `createDeviceAuth()` — the default. Accounts live in THIS BROWSER. It never
  stores a password: a random salt plus a PBKDF2-SHA-256 verifier (210,000
  iterations) via WebCrypto. It ships zero seeded accounts. **It is not
  secure**, and every auth screen says so through `DeviceAccountNote`.

Both refuse to leak account existence: an unknown email does the same
derivation work and returns the same message, and a reset request always
resolves.

### The declared profile (`frontend/lib/onboarding.ts`)

The eight-step wizard writes one `FinancialProfile`. `deriveBudget()` maps it
into **exactly the shape the frozen engines already take** — a bucket-total
map plus an allowance — so the health score, ratios, guilt-free envelope and
projections are computed by the same code for a declared profile, a parsed
statement and the generated example. That is what keeps onboarding real
rather than decorative.

Essentials → Needs, lifestyle → Wants, `monthlySavings` → Savings, and
`Uncategorised: 0`. Debt is deliberately NOT a bucket: the balances collected
are stocks, and adding a stock to a month of flows would either invent an
instalment or double-count one. It drives the plan instead.

`completedAt` is written only on the final step. A draft persisted per
keystroke would let someone who abandoned at step 3 into a dashboard scoring
an income with no expenses — a 100/100 built from unanswered questions.

### Where the numbers come from (§28)

`FinPathProvider` resolves one of three sources, in precedence order, and
names it:

1. `statement` — an uploaded file, parsed in the browser. Actuals.
2. `declared` — the onboarding profile. The student's own estimate.
3. `example` — the API's generated month. **Opt-in, never silently on.**

`SOURCE_LABEL` is the only wording for these, and `<SourceLine />` renders it
on every page that shows a figure. A projection built from an example month
and one built from a real statement look identical and mean entirely
different things.

`reviewStore` holds one snapshot of the health score, written by `/home` on
each visit. It is the only history the product has, and "since your last
review" appears only when a genuine prior snapshot exists.

### The plan (`frontend/lib/plan.ts`)

`buildPlan()` returns four ordered stages — debt → buffer → invest → wealth —
with **exactly one ever in `"attention"`**. `priority` reorders only the two
middle stages; debt is always first and compounding always last. Every stage
carries a `measure` string stating in words how its progress was read,
including "Self-attested — nothing in your statement can confirm a cleared
balance." A progress bar without its stated source is a claim the product
cannot back.

`biggestOpportunity()` returns exactly ONE finding, in planner order. A list
of five opportunities is a list of none.

`/home` and `/plan` both derive through `app/components/usePlan.ts`, so they
cannot disagree. `emergencyFund` and `debtTotal` are nullable on purpose:
passing 0 for "not declared" would silently upgrade "we have no idea" into
"you owe nothing".

### Design system

`frontend/app/globals.css` is the whole system and it is closed.

**Fifteen colour tokens. No sixteenth.** Three grounds (`canvas`, `surface`,
`surface-sunken`), four inks (`ink`, `ink-secondary`, `ink-muted`,
`ink-disabled`), two rules (`line`, `line-strong`), one accent
(`accent`, `accent-wash`) and two statuses (`critical`, `positive`, each with
a wash). `npm run check-contrast` FAILS THE BUILD if the palette grows, and
asserts a WCAG ratio for every pair.

Two splits carry most of the meaning:

- `--line` is 1.24:1 and draws dividers, table rules and card edges ONLY.
  Every interactive boundary — input, select, checkbox, button, focus ring —
  takes `--line-strong` (13.92:1), because WCAG 2.2 SC 1.4.11 exempts
  decorative boundaries and not control boundaries.
- `--accent` is a deep pine green at 7.28:1 on canvas, which means it is
  legible **as text**. That is the constraint that stops it becoming
  decoration. It is never a status colour — `critical` and `positive` own
  that job, and they always travel with a word and a glyph because they sit
  only 1.21:1 apart in luminance.

Radius is zero everywhere and every `--radius-*` and `--shadow-*` token is
pinned to 0, so a `rounded-md` that slips past the linter is inert rather
than visible. The one rounded element in the product is the avatar, via the
`avatar` utility. **There is no dark mode** and no `prefers-color-scheme`
block; `design-lint` fails on any `dark:` variant.

**Eight type roles**, and a component may use nothing else — an arbitrary
size (`text-[13px]`) is a design-lint failure: `type-hero` (landing headline,
one per site), `type-display`, `type-heading`, `type-subhead`, `type-body`,
`type-label`, `type-eyebrow` (metadata only, the one uppercase role), and
`type-data` for EVERY numeral, always tabular. Fonts are Instrument Serif
(display, single weight) and Inter (everything else including numerals),
self-hosted through `next/font`.

`ledger-rule` is the product's signature: the 1px hairline an amount rests
on. It CARRIES MEANING — "a real number sits here, and it came from
somewhere" — so **never draw it as decoration**, not under a heading and not
as a divider flourish.

`margin-layout` / `margin-note` are the marginalia system: a fixed gutter for
a citation, the rule behind a figure, or an as-of date. An empty margin is
correct; the device earns its meaning by being uncommon.

`enter` (4px, 200ms, once) is the only entrance animation in the product.
Loading placeholders are static blocks — no shimmer.

### The statement parser (`frontend/lib/csv.ts`)

Runs entirely in the browser; an uploaded statement never reaches the API. It is the most-tested code in the repo (`lib/csv.test.ts`) — change it with the suite, not by eye.

**Three amount shapes**, resolved from the header row: a single signed column; a Debit/Credit pair (`amount = credit − debit`, and a row is valid if *either* cell parses, so a credit-only row with a blank debit is fine); or an amount column plus a Dr/Cr type column. When both an amount column and a type column are present the typed shape wins — otherwise the type column would be silently ignored and every debit would read as income.

Two header-matching traps, both fixed and both regression-tested:

- Aliases shorter than `MIN_FUZZY_ALIAS` (4) are matched **exactly, never as a substring**. `"cr"` is a legitimate alias for the Credit column and also sits inside `"Des-cr-iption"`, which bound Description as the Credit column on essentially every signed-amount file.
- A `Dr/Cr` header is excluded from Debit/Credit matching, or it gets bound as the Debit column.

**A single unsigned column is ambiguous** — either a signed ledger with no credits this month, or a spend-only export of magnitudes. The convention is decided by the file: a signed column is only read as signed if it carries a negative *somewhere*, otherwise `magnitudesOnly` is set and every row is money out. Without this, a spend-only export (our own template included) parses as all income and no spend.

**Income is not spend.** Credits are excluded from every bucket and therefore from the denominator the 30% Wants rule measures against. They surface as the "Money in" row and, when a recurring credit clears `ALLOWANCE_SHARE` of monthly income, as an allowance *suggestion* — `detectAllowance` never writes the profile, the student has to accept it.

**`Uncategorised` is a real bucket, not a failure.** The residual of `classify()` is Uncategorised, never Wants: defaulting it to Wants meant the 30% rule was policing the parser's ignorance as much as the student's spending. Only `rule`- and `user`-assigned rows count toward it. Uncategorised money is still excluded from the three ratios but **included** in `healthScore`'s spent total and deducted in `guiltFree` — it left the account, so treating it as unspent buffer would flatter the score. `tagFor` keeps its "Shopping" fallback for display; category decisions must use `knownTagFor`, which returns null.

### Frontend components

`frontend/components/ui/` is the complete primitive inventory. **Import from
the `@/components/ui` barrel, never from an individual file**, so the
inventory stays one reviewable surface and `/styleguide` can prove it is
complete. `components/finpath/` and `app/components/ui.tsx` are gone.

`lib/money.ts` is the money layer: integer `Paise` with a brand, becoming a
rupee number in exactly two places — `lib/format.ts` (and through it
`<Money>`) and `toEngineRupees`, the single documented crossing point into
the float-rupee engines. `lib/format.ts` is the only place a number becomes a
string; `design-lint` fails on a bare `Intl.`, a `.toFixed(` or a hand-typed
`₹`.

Compliance copy lives in `DisclaimerNote` (`components/ui/disclaimer.tsx`)
and is never retyped at a call site — one edit changes the wording, one grep
audits it. It is required on every coach answer, every projection, every plan
stage and the `/home` hero.

### Gates

```bash
cd frontend
npm run verify   # typecheck + design-lint + check-contrast + test + build
npx eslint app components lib
```

`design-lint.baseline.json` is **empty**, which is the §53 end state: nothing
outside `app/globals.css` introduces a colour, a radius, a shadow or an
arbitrary size. It may only ever shrink. A permanent, argued exception uses
`// design-lint-allow: <rule> — <reason>` on the offending line; the reason is
mandatory and a bare allow is itself a failure.

## Conventions

- Backend deps go through `uv add`, never bare `pip` — `uv.lock` is committed.
- Frontend UI primitives are hand-built in `components/ui/` (alias `@/`) on Base UI (`@base-ui/react`) for anything with real interaction semantics — Select, Tabs, Dialog, Menu, Field, Toast, Tooltip. Icons come from `lucide-react`, one stroke weight, pinned in `globals.css`. Charts are Recharts, always wrapped in `ChartFrame` so no plot ships without its insight, its assumptions and an accessible data table.
- `frontend/CLAUDE.md` imports `frontend/AGENTS.md`, which is **generated and re-added by `next dev`**. Do not delete it from a diff; commit it with your work to keep the tree clean. It requires reading `node_modules/next/dist/docs/` before writing Next.js code, since Next 16 has breaking changes (async request APIs, Turbopack default, `next lint` removed, `middleware` → `proxy`).
- Python version is inconsistent: root `.python-version` says 3.12, `backend/.python-version` says 3.14, and `pyproject.toml` requires `>=3.14`. The backend one wins for backend work.
- The root `data/` directory is empty; the real corpus lives in `backend/data/`.
