# FinPath India

An AI financial-literacy counselor for Indian college students that answers only from regulator-published documents, and says so when it can't.

Most Indian students receive no formal financial education before they start earning, and the apps that reach them first are distribution channels — they surface a fund, a policy, or a credit card, because that is how they earn. FinPath sells nothing: it teaches from RBI, SEBI and NCFE material, cites the page it used, and refuses to answer when the corpus doesn't cover the question.

![FinPath India landing page](docs/screenshots/landing.png)
*The landing page runs the diagnostic inline: a ₹3,500 purchase shown as the ₹10,870 it displaces over ten years.*

## What it does

- **Retrieval-grounded counselor.** Every answer is generated from chunks retrieved out of the regulator corpus and carries inline `[1]`-style citations resolving to a source document and page number. When the nearest chunk falls outside the relevance threshold the answer is labelled "not from a verified source"; when retrieval returns nothing at all, the endpoint refuses without calling the model.
- **Behavioural nudge engine.** Classifies a month of UPI transactions into Needs / Wants / Savings, and when Wants clears 30% of allowance, projects the excess as a ten-year SIP at 12% p.a. — so the output is "this is ₹X in ten years", not "you overspent".
- **Interactive what-if simulator.** Recomputes the projection per slider drag in the browser, against the server's own rate and horizon constants rather than a hardcoded copy.

![The counselor answering with inline citations](docs/screenshots/counselor.png)
*Every claim carries an inline `[n]`; the Citation Inspector on the left resolves each one to its source document, page and the exact retrieved passage.*

![The spending engine's statement upload](docs/screenshots/dashboard.png)
*The spending engine accepts a real bank statement — the CSV is parsed in the browser and never reaches the API.*

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

## Design vs. implementation

The project started from a pitch deck —
[`docs/FinPath_India_Technical_Architecture.pptx`](docs/FinPath_India_Technical_Architecture.pptx)
— which describes the target architecture: FAISS for the vector index, OpenAI
for embeddings and generation, LangChain for orchestration, React (CRA) for the
client, and live account-aggregator data for spending.

The working prototype substitutes for each of those, on purpose:

| Deck (target) | Prototype | Why |
| --- | --- | --- |
| FAISS | **pgvector on Postgres 17** | The index needs `(source, page, content)` alongside the vector, and the ingest skip-check is a SQL query. One store with an HNSW cosine index beats a flat file plus a sidecar database, and it survives a restart without a rebuild step. |
| OpenAI | **Google Gemini** (`gemini-embedding-001`, `gemini-2.5-flash`) | A free tier that a student project can actually run on. The cost is a rate limit, which is why `ingest.py` batches and throttles. Both the embedding call and the chat call are one function each — the provider is not spread through the codebase. |
| LangChain | **direct SDK calls** | The whole retrieval path is: embed the question, one `ORDER BY embedding <=> …` query, build a numbered `CONTEXT` block, generate. A framework around four steps would hide the part that matters — the distance threshold that routes between grounded, general and refusal. |
| React (CRA) | **Next.js 16, App Router** | CRA is deprecated. The App Router gives streaming responses a first-class path, and the routes are already the page structure the deck describes. |
| Live AA / Sahamati data | **synthetic transactions + local CSV upload** | Consuming account-aggregator data requires registration as an FIU, which is not open to an individual project. `/api/spending` generates a plausible month from a merchant-category table; the CSV path is the real-data escape hatch, parsed in the browser so a statement never reaches the API. |

These are scoping decisions, not gaps. Each substitution keeps the property the
deck was actually arguing for — grounded retrieval with page-level citations, a
refusal path, and a nudge computed from real spending shape — while removing a
dependency the prototype could not carry. The interfaces are narrow enough that
swapping any one back is a contained change: the vector store is behind
`retrieve()` in `main.py`, the model behind two calls, and the spending shape
behind `/api/spending`'s response contract.

## Honest constraints

- **Spending data is synthetic.** Sahamati / the account-aggregator framework requires FIU registration, which an individual project cannot obtain, so `/api/spending` generates a plausible month from a merchant-category table on every request — no persistence, no real accounts. The CSV upload is the real-data escape hatch, and it is parsed in the browser. See [Design vs. implementation](#design-vs-implementation).
- **Free-tier API limits shape ingestion.** Embedding runs at `BATCH=20` with a 16-second pause (~75 items/min) to stay under the free-tier rate limit, with backoff on top. Ingesting a large PDF takes minutes, not seconds.
- **The corpus is currently 1 document — 121 chunks across 35 pages** (SEBI's *Financial Education for College Students*). The retrieval threshold `RELEVANCE_MAX_DISTANCE = 0.50` is tuned against that live index using `backend/probe_threshold.py`, and must be re-tuned as documents are added. Coverage is genuinely narrow right now; the refusal path is what keeps that honest rather than hidden.

## Engineering

```bash
cd frontend
npm test              # vitest, 234 tests across 4 files
npm run verify        # typecheck + design-lint + check-contrast + test + build
```

- **Vitest suite** (`lib/*.test.ts`, 234 tests across 4 files) covers `lib/` only, in a `node` environment — everything under test is a pure function, so there is nothing to render. `lib/csv.test.ts` is the largest of them: the statement parser handles three amount shapes and two header-matching traps, each regression-tested.
- **Golden fixtures** (`lib/__fixtures__/`) freeze the financial engines against recorded output: 50/30/20 bucketing, the merchant classifier, compounding, step-up SIPs, FI-age, and stress tests. Each fixture asserts every scenario is covered *and no more*, so a silently dropped case fails the suite rather than passing quietly.
- **`npm run design-lint`** (`scripts/design-lint.ts`) lexes the source and rejects colours outside the token file, stray radii and shadows, ad-hoc type sizes, hand-rolled currency formatting, and mock data on a production path. It blanks comments first, so prose describing a rule doesn't trip it.
- **`npm run check-contrast`** (`scripts/check-contrast.mjs`) parses the literal hex values out of `globals.css` and asserts every rendered pairing against WCAG 2.2 AA in both themes, including two documented exemptions asserted *as* exemptions.

`npm run verify` chains all four behind a typecheck and a production build, and
is the gate a change has to pass. The backend has no test suite — backend
changes are verified against `/api/health` and the two endpoints by hand.

Design records and screenshots live in [`docs/`](docs/) — see
[`docs/README.md`](docs/README.md).

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

Routes: `/` landing · `/counselor` chat · `/spending` engine · `/simulator` · `/vault` corpus browser · `/roadmap` · `/styleguide` design tokens.

## Disclaimer

Educational content only. Not investment advice. The counselor never names a specific stock, fund, or product — that constraint is enforced in the system prompt on both the grounded and general paths.
