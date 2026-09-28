# Diagrams — FinPath after the editorial refactor (Phase 14)

Five Mermaid diagrams, drawn from the code at the end of the refactor. The "before" versions of the last three are in `01-audit.md` §5; the notes under each diagram say what changed.

1. [Repository workflow](#1-repository-workflow)
2. [User journey](#2-user-journey)
3. [Component dependency graph](#3-component-dependency-graph)
4. [State flow](#4-state-flow)
5. [API flow](#5-api-flow)

---

## 1. Repository workflow

How a change moves through the repo: the three deployables, the gate every phase passed, and the branch and commit shape the refactor used.

```mermaid
flowchart TD
  subgraph REPO["finpath/"]
    FE["frontend/ — Next.js 16, React 19, Tailwind v4"]
    BE["backend/ — FastAPI + Gemini, managed with uv"]
    DC["docker-compose.yml — Postgres 17 + pgvector"]
    DOCS["docs/refactor/ — brief, audit, progress, QA, migration"]
  end

  DATA["backend/data/*.pdf"] -->|"uv run python ingest.py"| DC
  BE -->|"retrieve: cosine distance"| DC
  FE -->|"lib/api.ts, API base from api-base.ts"| BE

  subgraph GATE["npm run verify (frontend/)"]
    direction LR
    T1["typecheck"] --> T2["design-lint"] --> T3["check-contrast"] --> T4["vitest: 267 tests"] --> T5["next build"]
  end

  MAIN["main"] -->|"branch"| UX["ux-refactor"]
  UX --> EDIT["change code for phase N"]
  EDIT --> GATE
  GATE -->|"fails"| EDIT
  GATE -->|"passes"| C1["commit: ux(phase-N): summary"]
  C1 --> C2["commit: ux(phase-N): progress report, quoting C1's hash"]
  C2 -->|"next phase"| EDIT
  UX -->|"after Phase 14"| FEAT["features: Phase 15, docs/features/BRIEF.md"]
```

Each phase is two commits because a commit can't contain its own hash: the work first, then the progress entry that cites it. `git log --oneline --grep "ux(phase-"` lists both.

---

## 2. User journey

The path a student takes, with the one next step each screen offers.

```mermaid
flowchart TD
  L["/ landing: hero + diagnostic"] -->|"Find my next step"| SU["/signup"]
  L -->|"Sign in"| LI["/login"]
  L -->|"How answers are sourced"| SRC["/sources"]
  LI -->|"Forgotten password"| FP["/forgot-password"]
  SU --> OB["/onboarding: 8 steps"]
  LI -->|"not onboarded"| OB
  OB -->|"Finish"| H
  LI -->|"onboarded"| H

  subgraph APP["(app) shell: guard, header nav, phone bar"]
    H["/home: where you stand"] -->|"See your actions"| PL["/plan: the live card"]
    H -->|"Ask box, prefilled"| AS["/ask"]
    H -->|"Also in FinPath"| SP["/spending"]
    H -->|"Also in FinPath"| WI["/what-if"]
    SP -->|"See what it becomes"| WI
    WI -->|"Set this up in my plan"| PL
    WI -->|"Ask how to start"| AS
    PL -->|"Change my priorities"| PR["/profile"]
    AS -->|"Read the passages"| SHEET["source panel or sheet"]
  end

  PR -->|"Sign out"| L
  D["legacy: /dashboard /counselor /simulator /roadmap /vault"] -. "308" .-> APP
```

Not drawn, to keep the lines readable:
- Every app route bounces to `/login?next=…` without a session, and `?next=` survives sign-up and onboarding.
- `/spending` can import a statement or load the sample in place.
- An Actions card ticks to Done with Undo.
- Every Sign out control does a full load of `/`.

**Changed since the audit's route diagram (§5.1):**
- Onboarding goes straight to Home; the Done screen is gone.
- The header search is gone; Home's Ask box prefills `/ask` without sending.
- Spending and What-if are reached from Home and Actions, not the nav.
- The legacy routes are 308, not 307.
- Every Sign out lands on `/`.

---

## 3. Component dependency graph

```mermaid
flowchart LR
  RL["app/layout.tsx"] --> AP["AuthProvider"] --> FPR["FinPathProvider"]
  AP --> AUTH["lib/auth: device or http"]
  AP --> MIG["lib/account-storage: one-time migration"]
  FPR --> PERS["lib/persist: createScopedStore"]
  FPR --> ONB["lib/onboarding: deriveBudget"]
  FPR --> FIN["lib/finance: ratios, healthScore, guiltFree"]
  FPR --> APIL["lib/api"] --> BASE["providers/api-base"]

  APPL["(app)/layout: guard"] --> TTP["Tooltip + Toast providers"]
  APPL --> AH["AppHeader"] & MN["MobileNav"] & SF["SiteFooter"]
  APPL --> RS["useRequestSpending"] --> FPR
  AH & MN --> NAV["nav.ts: NAV, 4 items"]
  SF --> FA["FooterAccount"]
  AH & FA & PROF["/profile"] --> SO["useSignOut"]

  HOME["/home"] --> UP["usePlan"] --> PLANL["lib/plan: buildPlan, biggestOpportunity"]
  PLANP["/plan"] --> UP
  HOME --> SD["lib/score: scoreDriver"]
  HOME & PLANP --> PAC["PlanActionCard"] --> AC["ActionCard"]
  PAC --> AM["lib/action-meta: minutes, DRAFT"]
  HOME & PLANP --> SEC["SecondaryLinks"]
  HOME & PLANP & SPEND["/spending"] & WHAT["/what-if"] --> SL["SourceLine"]
  SPEND --> SI["StatementImport"] --> CSV["lib/csv: in the browser only"]
  SI --> CARD["Card, Metric, Notice"]
  WHAT --> DYN["next/dynamic"] -.-> SC["ScenarioChart: Recharts, loaded on demand"]
  LAND["/ landing"] --> DIAG["Diagnostic"] --> RS
  ASK["/ask: Coach"] --> CIT["Citation"] & SPN["SourcePanel"] & SH["Sheet"] & NOT["Notice"] & MQ["useMediaQuery"]

  ALL["every screen"] --> BAR["@/components/ui barrel, tree-shaken via sideEffects"] --> MONEY["Money"] --> FMT["lib/format + lib/money"]
```

**Changed since audit §5.2:**
- The Tooltip and Toast providers moved from the root layout into the `(app)` shell.
- New: `ActionCard`, `Notice`, `SectionLabel`, `TrustLine`, `FooterAccount`, `useSignOut`, `useRequestSpending`, `lib/score`, `lib/action-meta`, `lib/account-storage`, `lib/safe-next`.
- `ScenarioChart` loads on demand.
- The barrel tree-shakes.

---

## 4. State flow

```mermaid
flowchart TD
  subgraph LS["localStorage, scoped per account"]
    K1["finpath.profile:userId"]
    K2["finpath.plan:userId"]
    K3["finpath.review:userId"]
    K4["finpath.accounts + finpath.session"]
  end
  OLD["legacy global keys"] -->|"migrateLegacyKeys: once, first account, never on sign-up"| LS

  K4 --> SES["AuthProvider: status loading, resolved"]
  SES -->|"userId"| K1 & K2 & K3
  K1 --> PROF["profile"] --> DB["deriveBudget"]

  UPL["uploaded statement or sample: memory only"] --> RES
  REQ["useRequestSpending: app shell, landing"] -->|"after session resolves, once"| EX["/api/spending: memory"]
  EX -->|"only if opted in"| RES
  DB --> RES{"precedence: upload, then example if opted in, then declared"}
  RES --> TA["totals + allowance + source label"]
  TA --> RAT["ratios"] & HS["healthScore"] & GF["guiltFree"]
  RAT & TA & K2 & PROF --> BP["buildPlan, biggestOpportunity"]
  HS --> HOMEW["/home: recordReview"] --> K3
  PAGES["Actions cards"] -->|"toggleTask"| K2
  PROFILE["/profile blocks, onboarding"] -->|"saveProfile on Save only"| K1
  SOUT["useSignOut"] -->|"full load of /: memory cleared"| UPL
```

**Changed since audit §5.3:**
- Storage keys are per account, with a one-time migration.
- The example month is fetched only when a screen asks and the session has resolved.
- The sample file is labelled as its own source.
- Sign out reloads the page, so an uploaded statement can't survive into the next session in the same tab.

---

## 5. API flow

The backend is unchanged by the refactor; the diffstat for `backend/` since `main` is empty. What changed is which screens call it, and when.

```mermaid
sequenceDiagram
  participant S as App screen or landing
  participant C as Coach (/ask)
  participant R as /sources
  participant A as FastAPI
  participant P as pgvector
  participant G as Gemini

  Note over S: nothing is fetched until useRequestSpending() and a resolved session
  S->>A: GET /api/spending?allowance=declared income
  A-->>S: month + projection_params (once per session)

  R->>A: GET /api/sources
  A-->>R: indexed documents

  C->>A: POST /api/chat {message}
  alt cached question
    A-->>C: cached answer + ␟SOURCES␟ meta
  else retrieval
    A->>P: embed + ORDER BY distance LIMIT 5
    alt no hits or DB down
      A-->>C: NO_SOURCE_REPLY + ␟SOURCES␟{grounded, null, []}
    else nearest chunk beyond 0.50
      A->>G: GENERAL_PROMPT
      G-->>A: stream
      A-->>C: text + ␟SOURCES␟{general, d, []}
    else grounded
      A->>G: SYSTEM_PROMPT + CONTEXT
      G-->>A: stream
      A-->>C: text with [n] + ␟SOURCES␟{grounded, d, sources}
    end
  end
  Note over C: Stop cancels the reader and keeps the partial answer
  Note over C,A: generation error or 429: shown as a calm Notice with Ask again, not as a grounded answer
  Note over S,A: on any failure, describeApiFailure probes /api/health before blaming the server
```

**Changed since audit §5.4:** only the client side. `/api/spending` has left the auth pages and `/sources` and is called once per app screen instead of twice. Stop, the kept partial answer, and the calm failure notice (B-2, B-3) are frontend. The `␟SOURCES␟` contract is unchanged.
