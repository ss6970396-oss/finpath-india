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

There is **no test suite** — no pytest, no vitest/jest, no test files. Verify backend changes against `/api/health` and the two endpoints; verify frontend changes with `npx tsc --noEmit` and `npx next build`.

`backend/.env` holds `GOOGLE_API_KEY` and `DATABASE_URL`, loaded via `python-dotenv`. `db.ensure_schema()` runs automatically on API startup and before every ingest, so no manual DDL is needed.

## Architecture

### The RAG path

`ingest.py` reads the RBI / SEBI / NCFE PDFs in `backend/data/`, splits them (900 chars, 150 overlap), embeds via `gemini-embedding-001` at 768 dimensions, and writes `(source, page, content, embedding)` rows into `documents`. It is resumable — it skips any `source` already present — and self-throttles (`BATCH=20`, `PAUSE=16`) to stay under the embedding rate limit. Leave both behaviours alone.

`/api/chat` retrieves before it generates: `retrieve()` embeds the question with the same model and dimensionality, then orders `documents` by cosine distance (`<=>`, matching the HNSW index). The hits become a numbered `CONTEXT` block; the system prompt forbids answering from anything else and requires inline `[1]`-style citations.

**The streaming contract is shared with the frontend and both ends must change together:** the body is the model's text, then `\n␟SOURCES␟`, then `json.dumps([{n, source, page}])`. `app/counselor/page.tsx` splits on that sentinel and renders the tail as citation chips. `SOURCES_DELIM` in `main.py` is the backend half.

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

- `/` — dark landing page, uses `app/components/HeroAnimation.tsx` (pure SVG + CSS keyframes, no JS)
- `/counselor` — streaming chat against `/api/chat`
- `/dashboard` — nudge engine UI: category cards, amber alert, recharts `AreaChart`, What-If slider

The backend URL `http://localhost:8000` is hardcoded in both `counselor/page.tsx` and `dashboard/page.tsx` — there is no env var, so changing hosts means editing both. CORS on the backend is `allow_origins=["*"]`.

`app/layout.tsx` sets a dark body (`bg-slate-950 text-slate-100`), but `/counselor` and `/dashboard` are still the pre-redesign light theme (`bg-slate-50`, white cards). Elements without an explicit text colour inherit light text and render white-on-white. Set colours explicitly when editing those two pages.

## Conventions

- Backend deps go through `uv add`, never bare `pip` — `uv.lock` is committed.
- Frontend UI primitives come from shadcn (`components/ui/`, alias `@/`); icons from `lucide-react`.
- `frontend/CLAUDE.md` imports `frontend/AGENTS.md`, which is **generated and re-added by `next dev`**. Do not delete it from a diff; commit it with your work to keep the tree clean. It requires reading `node_modules/next/dist/docs/` before writing Next.js code, since Next 16 has breaking changes (async request APIs, Turbopack default, `next lint` removed, `middleware` → `proxy`).
- Python version is inconsistent: root `.python-version` says 3.12, `backend/.python-version` says 3.14, and `pyproject.toml` requires `>=3.14`. The backend one wins for backend work.
- The root `data/` directory is empty; the real corpus lives in `backend/data/`.
