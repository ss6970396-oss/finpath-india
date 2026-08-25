# FinPath India

An AI financial-literacy counselor for Indian college students that answers only from regulator-published documents, and says so when it can't.

Roughly 73% of Indian youth lack basic financial literacy, and the apps that reach them first are distribution channels — they surface a fund, a policy, or a credit card, because that is how they earn. FinPath sells nothing: it teaches from RBI, SEBI and NCFE material, cites the page it used, and refuses to answer when the corpus doesn't cover the question.

<!-- SCREENSHOT: landing page, light theme -->

## What it does

- **Retrieval-grounded counselor.** Every answer is generated from chunks retrieved out of the regulator corpus and carries inline `[1]`-style citations resolving to a source document and page number. When the nearest chunk falls outside the relevance threshold the answer is labelled "not from a verified source"; when retrieval returns nothing at all, the endpoint refuses without calling the model.
- **Behavioural nudge engine.** Classifies a month of UPI transactions into Needs / Wants / Savings, and when Wants clears 30% of allowance, projects the excess as a ten-year SIP at 12% p.a. — so the output is "this is ₹X in ten years", not "you overspent".
- **Interactive what-if simulator.** Recomputes the projection per slider drag in the browser, against the server's own rate and horizon constants rather than a hardcoded copy.

<!-- SCREENSHOT: counselor answer showing citation chips -->
<!-- SCREENSHOT: spending dashboard with the nudge fired -->
<!-- SCREENSHOT: what-if simulator -->

## Architecture

```
Next.js 16 (App Router, React 19, Tailwind v4)
        │  POST /api/chat  ── streamed response
        ▼
FastAPI (Python 3.14, uv)
        │
        ├─ 1. embed question ──────────►  Gemini gemini-embedding-001 (768-dim)
        │
        ├─ 2. cosine search (<=>) ─────►  Postgres 17 + pgvector
        │                                 documents(source, page, content, embedding)
        │                                 HNSW cosine index
        │
        ├─ 3. route on nearest distance
        │       ≤ 0.50  → grounded prompt, citations attached
        │       > 0.50  → general prompt, mode "general", no citations
        │       nothing → refuse, model never called
        │
        └─ 4. generate ────────────────►  Gemini gemini-2.5-flash
                │
                ▼
        text  +  "␟SOURCES␟"  +  {mode, top_distance, sources[]}
```

The frontend splits on that sentinel and renders `sources` as citation chips and `mode` as a badge. The delimiter is a shared contract — both ends change together.

`ingest.py` reads the PDFs in `backend/data/`, splits them at 900 characters with 150 overlap, embeds in batches, and writes rows into `documents`. It is resumable and self-throttling.

Ratio, SIP and classification logic lives in `frontend/lib/` as pure functions and runs client-side; an uploaded bank statement is parsed in the browser and never reaches the API.

## Honest constraints

- **Spending data is synthetic.** Real UPI account aggregation via Sahamati / the AA framework requires FIU registration, which an individual project cannot obtain. `/api/spending` generates a plausible month from a merchant-category table on every request — no persistence, no real accounts. The CSV path is the real-data escape hatch: a student can upload their own statement and it is parsed locally.
- **Free-tier API limits shape ingestion.** Embedding runs at `BATCH=20` with a 16-second pause (~75 items/min) to stay under the free-tier rate limit, with backoff on top. Ingesting a large PDF takes minutes, not seconds.
- **The corpus is currently 1 document — 121 chunks across 35 pages** (SEBI's *Financial Education for College Students*). The retrieval threshold `RELEVANCE_MAX_DISTANCE = 0.50` is tuned against that live index using `backend/probe_threshold.py`, and must be re-tuned as documents are added. Coverage is genuinely narrow right now; the refusal path is what keeps that honest rather than hidden.
- **No backend test suite.** Backend changes are verified against `/api/health` and the endpoints by hand.

## Testing

```bash
cd frontend
npm test              # vitest, 234 tests across 4 files
npm run verify        # typecheck + design-lint + check-contrast + test + build
```

- **Vitest suite** covers `lib/` only, in a `node` environment — everything under test is a pure function, so there is nothing to render.
- **Golden fixtures** (`lib/__fixtures__/`) freeze the financial engines: 50/30/20 bucketing, the merchant classifier, compounding, step-up SIPs, and stress tests. Each fixture asserts every scenario is covered *and no more*, so a silently dropped case fails the suite.
- **`design-lint`** lexes the source and rejects colours outside the token file, stray radii and shadows, ad-hoc type sizes, hand-rolled currency formatting, and mock data on a production path. It blanks comments first, so prose describing a rule doesn't trip it.
- **`check-contrast`** parses the literal hex values out of `globals.css` and asserts every rendered pairing against WCAG 2.2 AA, including two documented exemptions asserted *as* exemptions.

## Running it locally

Requires Docker, Python 3.14 with [uv](https://docs.astral.sh/uv/), Node 20+, and a Google Gemini API key.

```bash
# 1. vector store
docker compose up -d db

# 2. backend
cd backend
cp .env.example .env          # then add your GOOGLE_API_KEY
uv sync
uv run python ingest.py       # embed backend/data/*.pdf — takes a few minutes
fastapi dev main.py           # :8000

# 3. frontend (new terminal)
cd frontend
npm install
npm run dev                   # :3000
```

`backend/.env.example` documents both variables; the filled-in `.env` is gitignored:

```
GOOGLE_API_KEY=your-key-here
DATABASE_URL=postgresql+psycopg://finpath:finpath@localhost:5432/finpath
```

The schema is applied automatically on API startup and before every ingest — no manual DDL.

Routes: `/` landing · `/counselor` chat · `/spending` · `/dashboard` · `/simulator` · `/vault` corpus browser · `/roadmap` · `/styleguide` design tokens.

## Disclaimer

Educational content only. Not investment advice. The counselor never names a specific stock, fund, or product — that constraint is enforced in the system prompt on both the grounded and general paths.
