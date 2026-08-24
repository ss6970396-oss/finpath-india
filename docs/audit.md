# FinPath — Repository Audit

**Date:** 2026-08-25
**Branch inspected:** `design-system-overhaul` @ `e3bbf3a`
**Scope:** every tracked file. Nothing in application code was modified to produce this document.

---

## 0. Baseline health

Measured before any change, so regressions later are attributable.

| Gate | Command | Result |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | **0 errors** |
| Lint | `npx eslint app components lib` | **0 problems** |
| Frontend tests (pre-existing) | `npx vitest run` | **42 passed** (`lib/csv.test.ts`, `lib/api.test.ts`) |
| Frontend tests (with golden freeze) | `npx vitest run` | **203 passed** |
| Backend tests | `uv run pytest` | **135 passed** (new; there was no suite) |
| Production build | `npx next build` | not yet run — see §9 risk R-09 |

The repository is in good order for its size. It is small (~9,000 lines of first-party
source), consistently commented, and has no raw hex colours outside `globals.css` and no
`fetch()` outside `lib/api.ts`. The problems below are almost all *absences* — auth, a
user model, persistence — rather than rot.

---

## 1. Repository architecture

```
finpath/
├─ backend/                 FastAPI + Gemini + pgvector       (5 modules, 780 lines)
│  ├─ main.py               API surface, RAG chat, prompts
│  ├─ nudge.py              50/30/20 rule engine + SIP projection
│  ├─ db.py                 psycopg connection, schema bootstrap
│  ├─ ingest.py             PDF -> chunks -> embeddings
│  ├─ probe_threshold.py    tuning aid for RELEVANCE_MAX_DISTANCE
│  ├─ schema.sql            ONE table: documents
│  ├─ data/                 1 PDF, indexed
│  └─ data_hold/            5 PDFs, NOT indexed
├─ frontend/                Next.js 16 App Router              (~8,200 lines)
│  ├─ app/                  8 routes, all client-rendered
│  ├─ app/components/       page-level components (8 files)
│  ├─ components/finpath/   design-system components (7 files)
│  ├─ components/ui/        generated shadcn primitives (8 files)
│  └─ lib/                  pure logic + formatting (14 files)
└─ docker-compose.yml       pgvector/pgvector:pg17
```

**Architectural observation.** The frontend has *three* parallel component
systems that overlap heavily: `app/components/ui.tsx` (a hand-rolled
Card/Label/Pill/Button/Meter/Empty set), `components/finpath/` (the documented
design-system set), and `components/ui/` (generated shadcn). Pages import from
all three. `Card` exists twice with different APIs; `Empty` and `EmptyState`
are two implementations of one idea. Consolidating these into the single
`components/ui/` inventory the rebuild specifies is the largest mechanical
change in the frontend.

**Rendering.** Every page under `app/` is `"use client"`. There is no Server
Component data fetching anywhere — the root layout mounts `FinPathProvider`,
which is a client context that fetches `/api/spending` in a `useEffect`. This
is the root cause of the landing-page performance risk (§14) and it is why no
page can be server-rendered with the user's data.

---

## 2. Existing routes

| Route | File | Purpose | Auth | Verdict |
| --- | --- | --- | --- | --- |
| `/` | `app/page.tsx` | Landing. Imports `ImpulseDiagnostic`, which imports Recharts-adjacent finance code and renders an interactive calculator. | none | **Rebuild** — §37 forbids chart code on the landing page |
| `/counselor` | `app/counselor/page.tsx` | Streaming RAG chat, citation chips, source drawer | none | **Refactor** — move under `/app`, keep the streaming contract |
| `/spending` | `app/spending/page.tsx` | Health score, ratios, ledger, CSV upload — all in one 519-line page | none | **Split** into `/app`, `/app/spending`, `/app/spending/ledger`, `/app/spending/import` |
| `/simulator` | `app/simulator/page.tsx` | Four simulators stacked in one 603-line page | none | **Split** into four routes per §31 |
| `/vault` | `app/vault/page.tsx` | Corpus listing from `/api/sources` | none | **Refactor** -> `/app/sources` |
| `/roadmap` | `app/roadmap/page.tsx` | Task checklist, persisted to `localStorage` | none | **Refactor** -> `/app/plan`, persist server-side |
| `/style-guide` | `app/style-guide/page.tsx` | Token/type/primitive review surface | none | **Rebuild** -> `/styleguide` on the new tokens |
| `/dashboard` | `app/dashboard/page.tsx` | 6-line `redirect()` to `/spending` | none | **Delete** — the rebuild gives `/app` a real dashboard |

**Missing entirely:** `/login`, `/signup`, `/forgot-password`, `/onboarding`,
`/legal`, `/app/settings/profile`, `/app/settings/data`,
`/app/sources/[docId]`, and the four split simulator routes. That is 13 new
routes.

---

## 3. Financial engines — inventory and freeze status

All are **frozen** as of this audit. See §3.5 for what that means in practice.

### 3.1 50/30/20 — `frontend/lib/finance.ts` + `frontend/lib/csv.ts`

| Function | File:line | Role |
| --- | --- | --- |
| `RULE` | `lib/finance.ts:17` | `{needs: 0.5, wants: 0.3, savings: 0.2}` |
| `ratios` | `lib/finance.ts:29` | Bucket totals as a share of **allowance**, not of spend |
| `variance` | `lib/finance.ts:41` | Signed deviation from target |
| `healthScore` | `lib/finance.ts:70` | 0–100: savings 40 / wants 30 / needs 15 / buffer 15 |
| `guiltFree` | `lib/finance.ts:130` | Safe-to-spend, remaining, per-day |
| `classify` | `lib/csv.ts:307` | Merchant -> `Needs`/`Wants`/`Savings`/`Uncategorised` |
| `parseStatement` | `lib/csv.ts:426` | CSV -> `ParsedTxn[]` |

Bucket aggregation itself has **no home in `lib/`** — it is written inline
inside `app/providers/FinPathProvider.tsx:186-215`. Extracting it is an action
item (A-04); the golden fixtures were frozen against a mirror of it in
`lib/__fixtures__/bucket.ts` precisely so the extraction can be verified.

### 3.2 Compounding / SIP — `frontend/lib/sip.ts` + `backend/nudge.py`

`sipFutureValue` (TS) and `sip_future_value` (Python) are the same annuity-due
formula written twice, deliberately: the What-If slider recomputes per drag, so
a round trip per tick is out. Constants live only in `nudge.py` and reach the
client as `projection_params`. That contract works and should survive.

### 3.3 Step-up / FI-age / stress test — `frontend/lib/finance.ts`

| Function | File:line | Role |
| --- | --- | --- |
| `stepUpSeries` | `:175` | SIP with an annual contribution increase |
| `flatSeries` | `:200` | Flat SIP, via the shared annuity helper |
| `delayedSeries` | `:214` | Cost of starting late |
| `lifestyleCreep` | `:253` | FI age via 25× annual overhead (4% SWR), searched year by year |
| `runway` | `:322` | Days of fixed costs survived after a shock |
| `SHOCKS` | `:350` | Three shock definitions |

### 3.4 RAG retrieval — `backend/main.py`

`retrieve()` embeds at 768 dimensions and orders by pgvector `<=>` cosine
distance. `RELEVANCE_MAX_DISTANCE = 0.50` routes three ways (grounded /
general / refuse). This is behaviour, not arithmetic, and is preserved as-is.

### 3.5 The freeze

| Artefact | Contents |
| --- | --- |
| `frontend/lib/__fixtures__/scenarios.ts` | The 12 required 50/30/20 scenarios, as statements |
| `frontend/lib/__fixtures__/bucket.ts` | Aggregation mirror; delete once A-04 lands |
| `frontend/lib/__fixtures__/golden-503020.json` | Parse + totals + ratios + variance + health + guilt-free, per scenario |
| `frontend/lib/__fixtures__/golden-classify.json` | 39 merchant classifications |
| `frontend/lib/__fixtures__/golden-compounding.json` | 120 SIP points, 56 lump-sum points, 2 projections |
| `frontend/lib/__fixtures__/golden-stepup.json` | 24 step-up series, 2 flat, 4 delayed |
| `frontend/lib/__fixtures__/golden-fi-age.json` | 48 FI-age cases |
| `frontend/lib/__fixtures__/golden-stress-test.json` | 96 runway cases across 4 shock states |
| `frontend/lib/golden.test.ts` | 161 assertions over the above |
| `backend/tests/fixtures/golden_nudge.json` | Constants, 120 SIP points, 3 projections, 8 `analyse` feeds |
| `backend/tests/test_golden_nudge.py` | 135 assertions over the above |

Amounts are integers already (every engine rounds). Ratios, shares and
per-day figures are frozen at **two decimal places**.

**Both suites were mutation-checked**, so they are not vacuous:

- `WANTS_THRESHOLD 0.30 -> 0.31` in `nudge.py` -> **11 backend failures**
- `RULE.wants 0.3 -> 0.31` in `finance.ts` -> **13 frontend failures**

Both mutations were reverted; `git diff` on both files is empty.

---

## 4. Hardcoded values

### 4.1 Financial constants that are correct where they are

These are *the* source of truth and should stay, though the rebuild routes
them to the client rather than duplicating them.

| Value | File:line | Purpose |
| --- | --- | --- |
| `0.5 / 0.3 / 0.2` | `lib/finance.ts:17` | The 50/30/20 rule |
| `0.12` | `nudge.py:81` | `SIP_ANNUAL_RATE` |
| `10` | `nudge.py:82` | `PROJECTION_YEARS` |
| `0.30` | `nudge.py:83` | `WANTS_THRESHOLD` |
| `0.04` | `lib/finance.ts:259` | Safe withdrawal rate (default arg) |
| `40/30/15/15`, `0.1` | `lib/finance.ts:78-89` | Health-score weights and buffer target |
| `0.5` | `lib/csv.ts:604` | `ALLOWANCE_SHARE` |
| `0.50` | `main.py:56` | `RELEVANCE_MAX_DISTANCE` — tuned, not guessed |
| `768` | `main.py:28`, `schema.sql:19`, `ingest.py` | Embedding dimension (three places, by design) |

### 4.2 Hardcoded values that must move to the user profile

| Value | File:line | Current purpose | Keep? | New source |
| --- | --- | --- | --- | --- |
| `15000` | `FinPathProvider.tsx:51` | `PROFILES.student.allowance` | No | user profile |
| `21` | `FinPathProvider.tsx:53` | `PROFILES.student.age` | No | user profile |
| `60000` | `FinPathProvider.tsx:58` | `PROFILES.early.allowance` | No | user profile |
| `25` | `FinPathProvider.tsx:60` | `PROFILES.early.age` | No | user profile |
| `"₹15,000 / month"` | `FinPathProvider.tsx:50` | Profile subtitle, hand-formatted | No | derived from profile via `formatINR` |
| `"₹60,000 / month"` | `FinPathProvider.tsx:57` | Profile subtitle, hand-formatted | No | derived from profile via `formatINR` |
| `15000` | `FinPathProvider.tsx:166` | Fallback allowance for a "custom" profile | No | onboarding value |
| `22` | `FinPathProvider.tsx:168` | Fallback age for a "custom" profile | No | onboarding value |
| `1000` | `FinPathProvider.tsx:166` | Minimum allowance clamp | Yes | move to a named constant |
| `15000` | `ProfileSwitcher.tsx:34` | Custom-allowance input default | No | user profile |
| `1000` | `ProfileSwitcher.tsx:100` | Input `min` | Yes | shared constant |
| `12000` | `main.py:369` | `/api/spending` default `allowance` query param | No | authenticated user's profile |
| `profile.allowance * 12` | `simulator/page.tsx:298` | Default annual income for FI-age | No | profile income |
| `profile.allowance * 1.5` | `simulator/page.tsx:307` | Default liquid emergency fund | No | profile / user input |
| `1500` | `simulator/page.tsx:62` | Fallback monthly SIP when no excess | Partly | derive from profile; keep a floor |
| `20` | `simulator/page.tsx:63` | Default horizon (years) | Yes | named constant |
| `0.1` | `simulator/page.tsx:64` | Default annual step-up | Yes | named constant |
| `0.2` | `simulator/page.tsx:299` | Default invest share | Yes | named constant (matches `RULE.savings`) |
| `3500` | `ImpulseDiagnostic.tsx:14` | Default impulse amount | No | leave the field empty |
| `[1500, 3500, 8000, 15000]` | `ImpulseDiagnostic.tsx:11` | Preset chips | Partly | scale from the user's allowance |
| `0.12` / `10` | `ImpulseDiagnostic.tsx:9-10` | **Local copies** of `SIP_ANNUAL_RATE` / `PROJECTION_YEARS` | **No** | `projection_params` — see F-04 |
| `0.12 / 10 / 0.3` | `simulator/page.tsx:56-58` | Fallback `projection_params` when the API is down | Partly | keep, but flag the reading as unverified |

### 4.3 Hardcoded slider bounds (UI, not financial truth)

`simulator/page.tsx`: `500`/`50000` (monthly SIP, :177,:185), `180000`/`2500000`/`10000`
(annual income, :298-300), `200000`/`1000` (liquid fund, :424-425). These are
presentation limits. They should become named constants and, where a bound sits
below the user's own figure, scale from the profile instead of clamping it.

### 4.4 Reference prices presented as indicative

`lib/finance.ts:415-422` — `goldPerGram: 7400`, `niftyIndexUnit: 24500`,
`domesticFlight: 5500`, `monthHostelMess: 3000`. The file is explicit that these
are static reference values and not market data, and the UI labels them as
indicative. **Keep, but they need a stated as-of date** — an unlabelled gold
price in a financial-literacy product reads as current. See A-11.

### 4.5 Shock amounts

`lib/finance.ts:378` (`25000`, medical deductible) and `:385` (`55000`, laptop).
These are scenario definitions, not user data. Keep; surface them as editable
assumptions on `/app/simulator/stress-test` per §31.

### 4.6 Mock / synthetic data in production paths

| Location | What it is | Disposition |
| --- | --- | --- |
| `backend/nudge.py:6-30` `MERCHANTS` | Merchant table used to synthesise a month of UPI activity | **Delete from the request path.** Keep as a seed/demo fixture only |
| `backend/nudge.py:33` `generate()` | Fabricates a month of transactions per request, deliberately pushing Wants to ~45% so the alert fires | **Delete from the request path** |
| `backend/main.py:367` `/api/spending` | Returns `analyse(generate(...))` — fresh fabricated data on **every** request, no persistence | **Rewrite** to read the authenticated user's transactions |
| `lib/csv.ts:660` `SAMPLE_CSV` | Downloadable template | **Keep** — clearly a template, not presented as the user's data |

This is the single largest correctness problem in the product as it stands:
**every number on `/spending` today is invented by the server.** §53 requires it
gone.

---

## 5. Component inventory

### 5.1 `app/components/` — page-level

| Component | Lines | Classification | Note |
| --- | --- | --- | --- |
| `ui.tsx` (`Figure`, `Card`, `CardHead`, `Label`, `Pill`, `Button`, `Meter`, `Empty`) | 232 | **Replace** | Duplicates `components/ui/` and `components/finpath/states.tsx` |
| `GlobalHeader.tsx` | 153 | **Replace** | Becomes the app shell header + public header |
| `GlobalFooter.tsx` | 54 | **Refactor** | Keep; re-skin, add `/legal` |
| `CommandPalette.tsx` | 229 | **Refactor** | Genuinely good; re-point at the new routes |
| `CitationInspector.tsx` | 186 | **Refactor** | Becomes `SourcePanel` (§17) |
| `StatementUpload.tsx` | 371 | **Replace** | Becomes the `/app/spending/import` 6-step flow (§30) |
| `ImpulseDiagnostic.tsx` | 169 | **Refactor** | Move off the landing page (§37); drop its local rate constants |
| `ProfileSwitcher.tsx` | 119 | **Delete** | A profile *switcher* is a demo affordance. Replaced by the real authenticated profile |

### 5.2 `components/finpath/` — design system

| Component | Lines | Classification | Note |
| --- | --- | --- | --- |
| `LedgerRule.tsx` (+ `LedgerList`) | 94 | **Keep, re-skin** | The product's signature primitive. Feeds directly into the marginalia system (§16) |
| `Money.tsx` | 43 | **Keep, extend** | Already the render boundary for amounts and carries `inrToWords` for a11y |
| `DisclaimerNote.tsx` | 51 | **Keep** | Compliance copy in exactly one place |
| `states.tsx` (`EmptyState`, `ErrorState`, `LockedState`, `Skeleton`, `LoadingSkeleton`, `OfflineBar`) | 209 | **Refactor** | Move to `components/ui/`; `Skeleton` must lose its shimmer (§42) |
| `AppShell.tsx` | 162 | **Replace** | Rebuild as the sidebar shell (§20) |
| `ThemeToggle.tsx` | 81 | **Delete** | §11: no dark mode |
| `index.ts` | 21 | **Refactor** | Barrel moves to `components/ui/` |

### 5.3 `components/ui/` — generated shadcn

`avatar`, `badge`, `button`, `card`, `input`, `progress`, `scroll-area`,
`separator`. All **refactor**: each carries `rounded-*` and `dark:` variants
that the new design-lint rule rejects. Missing against §17: `Select`, `Table`,
`Metric`, `ProgressMeter`, `Modal`, `Sheet`, `Tooltip`, `Tabs`, `Citation`,
`SourcePanel`, `Toast`, `Header`, `Sidebar`, `PageHeader`, `EmptyState`,
`LoadingState`, `ErrorState` — **17 new primitives**.

### 5.4 `lib/`

| Module | Classification | Note |
| --- | --- | --- |
| `finance.ts` | **Keep — frozen** | Financial engines |
| `sip.ts` | **Keep — frozen** | Financial engines |
| `csv.ts` | **Keep — frozen**, extend | Parser stays; §30 adds mapping/preview around it |
| `money.ts` | **Refactor** | See §6 |
| `format.ts` | **Refactor** | Becomes the §14 surface |
| `api.ts` | **Refactor** | Excellent error reporting; needs a typed endpoint layer on top (§40) |
| `persist.ts` | **Refactor** | Keep for UI preferences only; financial state moves to the DB |
| `theme.ts` | **Delete** | §11: no dark mode |
| `categories.ts` | **Refactor** | Re-point at the new tokens |
| `tags.ts` | **Refactor** | See F-03 |
| `corpus.ts` | **Keep** | Its integrity rule (never invent a citation field) is exactly right |
| `utils.ts` | **Keep** | `cn()` |

---

## 6. Formatting

Formatting is already better centralised than most codebases: `lib/money.ts`
owns the `Intl.NumberFormat` instances and there are **no raw hex colours and no
stray `fetch()`**. The gaps are specific.

| Requirement (§14) | Today | Gap |
| --- | --- | --- |
| `formatINR()` | `formatINR(rupees, showPaise?)` in `money.ts:40` | Name differs; takes rupees, not paise |
| `formatCompactINR()` | `formatINRCompact()` in `money.ts:132` | **Emits `₹5k`** for 1,000–99,999. §14 forbids the K form; only L and Cr are allowed |
| `formatPercent()` | `formatPct(fraction, digits=0)` in `money.ts:46` | Unsigned and 0 dp. §14 wants `+4.2%` — signed, 1 dp |
| `formatDate()` -> `04 Aug 2026` | `shortDate()` in `format.ts:18` returns `04 Aug` | **No year.** Missing |
| `formatMonth()` -> `Aug 2026` | — | **Missing** |
| Integer paise storage | `toPaise`/`toRupees` exist at `money.ts:13,18` and are **called by nothing** | The paise doctrine in the file header was never implemented. Every amount in the app is a float rupee |

Inline formatting to route through the utilities:

| Location | What |
| --- | --- |
| `ImpulseDiagnostic.tsx:35,117` | `(RATE * 100).toFixed(0)` |
| `ImpulseDiagnostic.tsx:109,124` | `mult.toFixed(1)` |
| `ImpulseDiagnostic.tsx:149` | `e.value.toFixed(e.digits)` (quantities) |
| `counselor/page.tsx:44` | `health.documents.toLocaleString("en-IN")` |
| `vault/page.tsx:37` | `(b / (1024 * 1024)).toFixed(1) + " MB"` |
| `FinPathProvider.tsx:50,57` | `"₹15,000 / month"` typed by hand |

---

## 7. API

Base URL resolves from `NEXT_PUBLIC_API_URL`, defaulting to
`http://127.0.0.1:8000` (`FinPathProvider.tsx:13`). *(The project `CLAUDE.md`
states the URL is hardcoded in two pages with no env var — that is stale; the
env var exists and every call goes through `lib/api.ts`.)*

| Method | Path | Request | Response | Auth today | Auth needed |
| --- | --- | --- | --- | --- | --- |
| GET | `/health` | — | `{status, service, documents}` or `{status:"degraded", detail}` | none | none (probe) |
| GET | `/api/health` | — | same | none | none |
| POST | `/api/chat` | `{message: string}` | `text/plain` stream: model text, then `\n␟SOURCES␟`, then `{mode, top_distance, sources[]}` | **none** | **required** |
| GET | `/api/spending` | `?allowance=int(1000..1000000)&months=1` | `{allowance, totals, spent, wants_pct, triggered, monthly_excess, projection[], ten_year_value, projection_params, transactions[]}` | **none** | **required**; `allowance` comes from the session, not the query |
| GET | `/api/sources` | — | `{documents[], total_chunks, indexed_files}` | none | required (or keep public) |
| GET | `/api/source/{name}` | filename | `application/pdf` | none | required |

CORS is `allow_origins=[...]` with `allow_methods=["*"]`, `allow_headers=["*"]`
and **`allow_credentials=True`** — the explicit origin list is already correct
for cookie auth, and the committed comment explains why. *(`CLAUDE.md` says CORS
is `["*"]`; also stale.)*

**Endpoints the rebuild must add:** `POST /api/auth/signup`, `POST /api/auth/login`,
`POST /api/auth/logout`, `GET /api/auth/session`, `POST /api/auth/forgot-password`,
`GET|PATCH /api/profile`, `POST /api/onboarding`, `GET|POST /api/transactions`,
`POST /api/transactions/import`, `GET /api/plan`, `PATCH /api/plan/{id}`,
`GET /api/export`, `DELETE /api/account`.

---

## 8. Authentication, authorization, database

**There is none.** Stated plainly because it is the largest gap:

- `schema.sql` defines exactly one table, `documents` (id, source, page, content, embedding).
  There is **no user table, no session table, no transaction table, no profile table.**
- No password hashing, no cookies, no sessions, no CSRF, no rate limiting.
- No FastAPI dependency guards any endpoint.
- "Identity" today is `PROFILES` — two hardcoded personas in a `localStorage`
  key (`finpath-profile`), switchable from a dropdown by anyone.
- Roadmap progress persists to `localStorage` under `finpath-roadmap`.
- **Uploaded statements are held in React state only** (`FinPathProvider`
  `useState`), so they survive client-side navigation and vanish on refresh.

The one thing this accidentally gets right: because uploads never leave the
browser, there is currently no server-side financial data to leak. §25 requires
that discipline be *preserved* when parsing moves server-side — parse, persist
the derived transactions, discard the raw file.

**Secrets.** `backend/.env` and `frontend/.env.local` are untracked and have
never been committed (`git log --all -- backend/.env` is empty). `GOOGLE_API_KEY`
is read server-side only and never reaches the client. Good.

---

## 9. Technical risks

| ID | Risk | Severity |
| --- | --- | --- |
| **R-01** | No authentication or authorization of any kind. Every endpoint is open. | **Critical** |
| **R-02** | `/api/spending` fabricates its data. Every figure the product shows a student today is invented. | **Critical** |
| **R-03** | No user, session or transaction tables. The entire persistence layer is new work, not a migration. | **High** |
| **R-04** | Prompt injection: `retrieve()` output is interpolated into the user-turn prompt as `CONTEXT:\n{context}` with no fencing. A crafted passage in an ingested PDF could carry instructions. §33 requires clear separation. | **High** |
| **R-05** | The RAG corpus is **one PDF** (`backend/data/collegestudents.pdf`). Five more sit unindexed in `data_hold/`. §34's citation rule is only as good as the corpus behind it. | **High** |
| **R-06** | `RELEVANCE_MAX_DISTANCE = 0.50` was tuned against an index built from that one PDF. Ingesting the other five **invalidates the tuning**; `probe_threshold.py` must be re-run. | **Medium** |
| **R-07** | `frontend/lib/csv.ts` runs in the browser. Moving parsing server-side per §25 puts 674 lines of frozen, heavily-tested parser on the wrong side of the language boundary. See the conflict in §11. | **High** |
| **R-08** | Three overlapping component systems; `Card` and the empty-state pattern each exist twice with different APIs. | **Medium** |
| **R-09** | `npx next build` has not been run in this audit. All other gates pass. | **Low** |
| **R-10** | `backend/main.py` carries an **uncommitted working-tree change** that adds an unbounded in-memory response cache to `/api/chat` and strips most explanatory comments from the file. It is not mine and I have not touched it. It must be resolved before the rebuild builds on that file. | **Medium** |
| **R-11** | Python version is inconsistent: root `.python-version` says 3.12, `backend/.python-version` says 3.14, `pyproject.toml` requires `>=3.14`. | **Low** |
| **R-12** | `psycopg2-binary` **and** `psycopg[binary]` **and** `sqlalchemy` are all declared dependencies; only `psycopg` v3 is imported. Dead weight, and SQLAlchemy's presence will invite a second DB access path. | **Low** |

---

## 10. Findings — defects discovered during the freeze

These were found by generating the golden fixtures and reading what came back.
**None have been fixed.** Each changes financial output, so each needs approval
under §3.

| ID | Finding | Evidence |
| --- | --- | --- |
| **F-01** | **The SIP mirror disagrees at a 0% rate, and both halves are wrong.** `sipFutureValue(m, y, 0)` returns **`NaN`** (silently, 20 frozen cases). `sip_future_value(m, y, 0)` **raises `ZeroDivisionError`**. `stepUpSeries` handles `r === 0` correctly with an explicit branch, which is what the other two are missing. Not reachable from today's UI (the rate is always 0.12 from `projection_params`), but any rate control exposes it. | `golden-compounding.json`, `golden_nudge.json` |
| **F-02** | **`ratios()` returns nonsense when allowance is 0.** The divide-by-zero guard substitutes `1`, so ₹3,000 of Needs against a ₹0 allowance yields a ratio of **3000** — rendered, that is "300000%". `healthScore` is unaffected because its clamps absorb it. | `golden-503020.json` scenario `02-zero-income` |
| **F-03** | **The frontend and backend classify the same merchants differently.** `Local Kirana` is **Needs** in `nudge.py` and **Wants** in `csv.ts` (via the `Food` tag). `Spotify Premium` is **Needs** in `csv.ts` (via the `Sub` tag) while `Netflix` is **Wants** (via pattern) — two subscriptions, opposite buckets. | `golden-classify.json`, `nudge.py:8-30` |
| **F-04** | `ImpulseDiagnostic.tsx:9-10` keeps **local copies** of the SIP rate and horizon (`0.12`, `10`) with a comment saying they mirror `nudge.py`. This is the exact duplication `projection_params` exists to prevent. | `ImpulseDiagnostic.tsx:9` |
| **F-05** | **A refund inflates income and does not reduce spend.** A ₹1,250 Myntra purchase followed by a ₹1,250 Myntra refund leaves Wants at ₹1,250 and raises income to ₹16,250. | `golden-503020.json` scenario `08-refund` |
| **F-06** | **A user with no data scores 60 / "Stable".** With zero transactions the buffer term pays out in full. Same for a month that is 100% Uncategorised. Engine-correct, but §27 forbids showing it — the **UI** must withhold the score when there is no data. No engine change needed. | `golden-503020.json` scenarios `04`, `05` |
| **F-07** | Ratios above 1.0 render as e.g. **1667%** (`11-large-transaction`). A presentation problem, not an engine one. | `golden-503020.json` scenario `11` |
| **F-08** | `toPaise` / `toRupees` are **dead code**. `money.ts`'s header asserts an integer-paise discipline that no call site implements. | §6 |

---

## 11. Conflicts requiring a decision

Raised rather than guessed, per §3 and §50.

### C-01 — §25 (parse CSVs server-side) vs. the frozen parser

`lib/csv.ts` is 674 lines of TypeScript, is the most-tested code in the repo,
and is explicitly frozen. §25 requires uploaded CSVs to be parsed server-side
and the raw file discarded. Those cannot both hold without either porting the
parser to Python (a rewrite of frozen code — forbidden by §3) or keeping the
parse in the browser.

**Recommendation:** parse in the browser exactly as today, POST only the
*derived transactions* (never the file), and never write the raw CSV to disk or
to the database. This satisfies §25's actual intent — data minimisation, no raw
statement retained — with a stronger guarantee than server-side parsing offers,
because the file never leaves the device at all. Needs your explicit approval,
because it is a literal deviation from §30's "parse server-side".

### C-02 — §34 (every source exposes a publication and amendment date) vs. the index

`schema.sql` stores four columns: `source`, `page`, `content`, `embedding`.
There is no publication date, no amendment date, no circular number, and
`lib/corpus.ts` carries an explicit integrity rule against inventing them.

**Recommendation:** add a `document_meta` table populated **by hand from each
PDF's own front matter** during ingest, and render "not stated in the document"
where a date genuinely is not there. Do not synthesise. This is new work in
Phase 3, not a UI change.

### C-03 — §11's palette vs. the existing design system

The current system is a considered 40-token set with a dark mode, a contrast
checker (`scripts/check-contrast.mjs`), split brand/status/categorical ramps,
and a documented rationale for each split. §11 replaces it with a 13-token
light-only set and forbids shadows and rounding — which removes the elevation
ramp, the categorical data ramp (used by charts), and dark mode.

I will implement §11 as specified. Two consequences to flag:

1. **Charts lose their categorical palette.** §11 has no `data-1..6`. Four
   spending categories must be distinguished by something other than hue —
   §43's "do not rely only on color" pushes the same way. Plan: direct labels,
   ordering, and a single ink ramp. This is a real design constraint, not a
   problem, but it changes what the charts can look like.
2. **Dark mode is deleted**, including `lib/theme.ts`, `ThemeToggle`, the
   blocking script in `layout.tsx`, and every `dark:` variant. This is a
   deliberate product decision on your part; confirming it explicitly because
   it removes shipped functionality.

### C-04 — the uncommitted `backend/main.py` change (R-10)

The working tree has a 137-line-deletion / 51-line-addition change to
`backend/main.py` that adds an unbounded in-memory `/api/chat` response cache and
removes most of the file's explanatory comments. I did not make it and have not
touched it. Options: keep it, revert it, or keep the cache and restore the
comments. The rebuild will heavily modify this file, so it should be settled
first.

---

## 12. Action items

| ID | Action | Phase |
| --- | --- | --- |
| A-01 | Resolve C-01 through C-04 | **now** |
| A-02 | Replace the 40-token system with the §11 palette; delete dark mode | 05–06 |
| A-03 | `lib/format.ts` -> the five §14 functions; drop the `k` branch from compact; add integer-paise storage | 07 |
| A-04 | Extract bucket aggregation out of `FinPathProvider` into `lib/finance.ts`; delete `lib/__fixtures__/bucket.ts` and re-point the golden test | 07 |
| A-05 | `scripts/design-lint.ts` + `npm run design-lint`; expect ~112 `rounded-*`, ~190 arbitrary font sizes, 9 `dark:` and 8 `shadow-*` hits on first run | 08 |
| A-06 | Consolidate three component systems into `components/ui/`; add the 17 missing primitives | 10 |
| A-07 | User / session / profile / transaction tables; real auth; the §22 authorization test | 12–14 |
| A-08 | Delete `nudge.generate()` from the request path; `/api/spending` reads real transactions | 12–14 |
| A-09 | Fence retrieved content in the prompt so it cannot read as instructions (R-04) | 29 |
| A-10 | Ingest `data_hold/`, then re-run `probe_threshold.py` and re-tune `RELEVANCE_MAX_DISTANCE` (R-05, R-06) | 30 |
| A-11 | Give `REFERENCE` prices a visible as-of date | 33 |
| A-12 | Drop `psycopg2-binary` and `sqlalchemy`; align `.python-version` (R-11, R-12) | any |
| A-13 | Add Playwright and axe; there is no E2E or a11y tooling today | 46 |
