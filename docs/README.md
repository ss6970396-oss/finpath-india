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
| [`refactor/`](./refactor) | The editorial UX refactor: `BRIEF.md`, the Phase 1 audit, the per-phase progress log, the visual QA pass, the accessibility walkthrough, diagrams, before/after, migration notes, feature parity, and the screenshot capture list. |
| [`features/`](./features) | `BRIEF.md` for Phase 15, the new-features phase. |

## Screenshots

The capture list, with route, viewport and state for each image, is [`refactor/screenshots.md`](./refactor/screenshots.md). The README holds a placeholder for each image it uses.

`landing.png`, `counselor.png` and `dashboard.png` show the design **before** the editorial refactor and are no longer referenced. Delete them once their replacements are captured.

Keep them at the width they were captured, and re-shoot rather than crop when a
layout changes — the README leans on them to show the design system, so a stale
screenshot misrepresents it. Reference them from the main README as
`docs/screenshots/<name>.png`.
