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

Verified against `frontend/app/` — every directory holding a `page.tsx`:

- `/` — landing page
- `/counselor` — streaming chat against `/api/chat`
- `/spending` — the spending engine; this is the page the old "dashboard" became
- `/simulator`, `/vault`, `/roadmap` — the rest of the pre-spec build
- `/styleguide` — every design token, type role and primitive on one page. One word, no hyphen.
- `/dashboard` — **not a page.** It is a `redirect()` to `/spending` kept so old links resolve.

`app/components/` and `app/providers/` hold no `page.tsx` and are not routes.

The API base lives in exactly one place — `API` in `app/providers/FinPathProvider.tsx`, which reads `NEXT_PUBLIC_API_URL` and falls back to `http://127.0.0.1:8000`. Do not re-derive a base URL at a call site. CORS on the backend is an explicit allowlist (`ALLOWED_ORIGINS` in `main.py`: localhost and 127.0.0.1 on :3000), not `["*"]` — a new frontend origin has to be added there.

### Design system

`frontend/app/globals.css` is the whole system, and it is closed: **eleven colour variables, and no twelfth may be added.** Six roles (`paper`, `surface`, `rule`, `ink`, `ink-muted`, `accent` + `accent-weak`) and two semantics (`warn`, `danger`, each with a `-weak` tint). `warn` renders only when a rule has actually fired — never as emphasis. No gradients, no blur backdrops, no accent stripes, nothing rounded past `--radius-lg` (10px), and exactly two shadows.

Dark mode re-points those same eleven variables under a single `.dark` class. There is no second palette and no `prefers-color-scheme` block: `lib/theme.ts` resolves System → light/dark in a blocking script in `app/layout.tsx`, so the stylesheet never duplicates the values. `ThemeToggle` reads the setting through `useSyncExternalStore` — do not copy it into state inside an effect, the lint rule rejects it.

Type roles are utilities, not ad-hoc sizes: `display-xl/lg/md`, `body-lg`, `body-base`, `label-ui`, `caption`, `overline-ui`, `amount-xl`, `amount`. Three of those are renamed from the design spec because Tailwind already owns the plain name — `overline` is a text-decoration utility, so the role is `overline-ui`; likewise `label-ui` and `body-base`. Fonts are Newsreader (display), IBM Plex Sans + Devanagari (UI), IBM Plex Mono (every numeral, always tabular).

`components/ui/` is generated shadcn code that reads its own semantic names (`--color-primary`, `--color-muted`, …). Those are bridged onto the eleven tokens in the `@theme inline` block, so a regenerated primitive cannot smuggle in a colour. Note the one trap: shadcn's `accent` means "subtle hover ground" while ours means the brand green, so the primitives use `muted` for hover instead — check any newly added primitive for `bg-accent`.

**`/styleguide` is the review surface.** It reads each token's resolved value out of the DOM, so it proves what the utilities actually compile to rather than restating the source. Check a visual change there in both themes before checking it on a feature page.

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

`components/finpath/` is the application component set; import from the `@/components/finpath` barrel, never from the individual files. The primitive everything money-related composes from is `LedgerRule` — label, tabular amount, and a 1px hairline the amount rests on. That hairline is the product's signature and carries meaning ("this is a real number"), so **never draw a rule as decoration** — not under a heading, not as a divider flourish.

`lib/money.ts` is the only place rupees are formatted (`en-IN` grouping, never a rounded-off `1.2L` outside a chart axis) and it carries `inrToWords` for the accessible label every amount needs. `lib/format.ts` is a thin shorthand over it — do not add a second implementation there.

Compliance copy lives in `DisclaimerNote` and is never retyped at a call site. It is required on every counsellor answer, the simulator, every goal card, every nudge, and the dashboard hero.

## Conventions

- Backend deps go through `uv add`, never bare `pip` — `uv.lock` is committed.
- Frontend UI primitives come from shadcn (`components/ui/`, alias `@/`); icons from `lucide-react`.
- `frontend/CLAUDE.md` imports `frontend/AGENTS.md`, which is **generated and re-added by `next dev`**. Do not delete it from a diff; commit it with your work to keep the tree clean. It requires reading `node_modules/next/dist/docs/` before writing Next.js code, since Next 16 has breaking changes (async request APIs, Turbopack default, `next lint` removed, `middleware` → `proxy`).
- Python version is inconsistent: root `.python-version` says 3.12, `backend/.python-version` says 3.14, and `pyproject.toml` requires `>=3.14`. The backend one wins for backend work.
- The root `data/` directory is empty; the real corpus lives in `backend/data/`.
