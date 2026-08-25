# docs/

Project documentation, design records and screenshots. Nothing in here is
imported by the application — it is the paper trail behind it.

## Contents

| File | What it is |
| --- | --- |
| [`FinPath_India_Technical_Architecture.pptx`](./FinPath_India_Technical_Architecture.pptx) | The pitch deck. Describes the **target** architecture — FAISS, OpenAI, LangChain, a CRA React frontend, live account-aggregator data. See "Design vs. implementation" in the [main README](../README.md#design-vs-implementation) for what the prototype substitutes and why. |
| [`audit.md`](./audit.md) | Full repository audit (2026-08-25) — baseline gates, per-file findings, and the risk register. Nothing in application code was changed to produce it. |
| [`design-plan.md`](./design-plan.md) | The design direction the current UI was built from: the eleven-colour palette, the type roles, and the `LedgerRule` primitive. Companion to `audit.md`. |
| [`screenshots/`](./screenshots) | Screenshots used by the main README. |

## Screenshots

| File | Route | Shows |
| --- | --- | --- |
| `screenshots/landing.png` | `/` | The landing page, with the compounding diagnostic running inline. |
| `screenshots/counselor.png` | `/counselor` | A grounded answer with inline `[n]` citations and the Citation Inspector resolving each to its source document and page. |
| `screenshots/dashboard.png` | `/spending` | The spending engine's statement upload. (Named `dashboard` for the route's former name; `/dashboard` is now a redirect.) |

Keep them at the width they were captured, and re-shoot rather than crop when a
layout changes — the README leans on them to show the design system, so a stale
screenshot misrepresents it. Reference them from the main README as
`docs/screenshots/<name>.png`.
