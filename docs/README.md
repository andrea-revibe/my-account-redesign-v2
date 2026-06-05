# My Account — Docs

> Internal-demo prototype for the Revibe **My Account → Orders** area. This folder is the living spec for the prototype, organised into **input** (operational source material used to build features) and **output** (UI / feature specs produced from those inputs). For change history see [`../CHANGELOG.md`](../CHANGELOG.md); for repo conventions see [`../CLAUDE.md`](../CLAUDE.md).

## Start here — navigation

[code_map.md](./code_map.md) is the navigation + impact layer for agents: concept→file→line index, the string-contract coupling table, and a generated dependency / blast-radius map (rebuilt by `npm run codemap`). Read it before exploring the tree, then do targeted reads. The per-feature docs below carry the "why"; the code map carries the "where" and "what-breaks-if".

[collaboration_strategy.md](./collaboration_strategy.md) is the roadmap for keeping agent collaboration token-efficient as the codebase grows (P0 code map → P1 file splits → P2 diagrams → P3 slim CLAUDE.md → P4 subagent discipline).

## Backend-mapping context

For a separate LLM / project tasked with mapping this prototype to real backend tables, start here — these two files are self-contained and don't require any other docs to be read first:

| Doc | Purpose |
|---|---|
| [db_explorer_context.md](./db_explorer_context.md) | Self-contained brief: glossary, system map, per-feature requirements (Orders / Cancellations / Returns / Warranties), cross-cutting concerns, validation checklist, consolidated open decisions |
| [db_explorer_system_prompt.md](./db_explorer_system_prompt.md) | System prompt for the mapping agent — task framing, inputs, process, output format, rules (read-only DB, conflict resolution, iteration cadence) |

## Input vs output

```
docs/
├── README.md     ← this file (index)
├── input/        ← operational source specs — what the production system does
└── output/       ← prototype / UI feature specs — what the customer sees
```

- **`input/`** carries operational state machines transcribed from the design/ops team's drawio sources. They describe the production system's actor graph (customer, agent, courier, repair supplier, LAB) — IS (internal) and ES (customer-facing) state labels, country routing, decision points. The prototype is built to match this operational reality. Update an input doc only when the upstream `.drawio` source changes; keep them in lock-step.
- **`output/`** carries the prototype's feature specs: customer-facing UI flows, card layouts, data shapes, UX decisions, mocked-vs-production gaps, open questions. These docs are produced from the inputs and from the design work in the repo. They're the canonical reference for "how this prototype works" and the eventual handoff to production engineering.

The split keeps "source of truth for the operational world" separate from "design decisions for our prototype" — they evolve at different cadences and have different review owners.

## Doc map

Every doc follows the same shape: `Overview → Flow (mermaid) → State models → Data model (tables) → UX decisions → Component map → Mocked vs production → Open questions`.

### Input — operational source

| Doc | Scope |
|---|---|
| [input/return_flow_change_of_mind.md](./input/return_flow_change_of_mind.md) | Operational state machine for change-of-mind returns — country splits (ZA/SA/Other), repair-partner vs seller decision branches, LAB sub-flow, refund chain |
| [input/return_flow_issue.md](./input/return_flow_issue.md) | Operational state machine for issue / wrong-device returns — single supplier path, country-aware AWB creation, LAB sub-flow, ship-back chain |
| [input/return_flow_warranty.md](./input/return_flow_warranty.md) | Operational state machine for warranty returns — shared intake + collection with the Issue flow, repair-and-ship-back tail (seller-valid or LAB-valid), invalid-confirmed customer-paid ship-back |

### Output — feature specs

| Doc | Scope |
|---|---|
| [output/orders.md](./output/orders.md) | Order list, four card baselines (`InProgressCard`, `OrderCard`, `PastOrderCard`, `ClaimCard`), auto-expand, filters, two-tier status model, courier banner, history thread |
| [output/cancellations.md](./output/cancellations.md) | `CancelOrderSheet` (with the dissuade step), `KeepOrderSheet` undo, refund-hero card variants, rejected-cancellation chip, refund / cancellation data fields |
| [output/returns/change_of_mind.md](./output/returns/change_of_mind.md) | UI flow of the change-of-mind returns branch (Steps 1, 2-CoM, 3–7), eligibility, refund math. Links to `input/return_flow_change_of_mind.md` for the operational state machine |
| [output/returns/issue.md](./output/returns/issue.md) | UI flow of the issue / wrong-device branch (Step 1, 2-issue, 3–7), refund math with AED 100 Wallet bonus. Links to `input/return_flow_issue.md` |
| [output/returns/claim_tracking.md](./output/returns/claim_tracking.md) | `ClaimCard` (5-state baseline) + three takeover cards (`DocsRejected`, `PickupFailed`, `InvalidClaim`) + canonical sub-status / action-gate / SLA reference |
| [output/warranties_compensations.md](./output/warranties_compensations.md) | Warranty intake (Step 1 → 7, skips refund-method step) + tracking card (`WarrantyClaimCard` — 6-state repair-and-ship-back pipeline, state-specific heroes, brand-toned tracking dropdown reusing outbound `SHIPPING_SUB_STATUSES`). Plus compensation (still stub) |
| [output/claim_detailed_tracking.md](./output/claim_detailed_tracking.md) | Design history of the deprecated `Show detailed tracking` disclosure. Reference tables have moved to `output/returns/claim_tracking.md` |
| [output/journey_backend_spec.md](./output/journey_backend_spec.md) | Journey mode (`?journey=<id>`) — single-order replays driving prototype components through one lifecycle. Conventions + recipe for adding a journey. Detailed backend-event spec deferred until data-warehouse column mapping. |

## Stack

React 19 + Vite 8 · Tailwind 3 · lucide-react · Inter (Graphik substitute). The mobile frame is **430px wide**; screenshots, tests, and visual checks should use that viewport.

```sh
npm install
npm run dev      # http://localhost:5173 (Vite)
npm run build
```

## Conventions

- **Doc style.** Every per-feature doc has the same section ordering — find what you need by section number, not by Ctrl-F. Each doc is self-contained: it defines its own UX decisions, data fields, and mocked-vs-prod list rather than pointing readers elsewhere.
- **Mermaid diagrams** for flows and state machines. Tables for data fields and decision points. Free text for rationale.
- **Customer-facing language only** in `output/`. Internal (IS) state labels appear only in `input/`.
- **Update both `output/` and `CHANGELOG.md`** when prototype behaviour changes. See doc-update protocol below. Update `input/` only when the upstream `.drawio` source changes.

## Doc update protocol

Triage by change type — don't blanket-update everything:

| Change | Update |
|---|---|
| Order list, cards, auto-expand, status banner, courier tracking | [output/orders.md](./output/orders.md) + `CHANGELOG.md` |
| Cancellation sheet, keep-my-order undo, refund-hero card | [output/cancellations.md](./output/cancellations.md) + `CHANGELOG.md` |
| Change-of-mind returns flow (Steps, eligibility, refund math, change-of-mind specific copy) | [output/returns/change_of_mind.md](./output/returns/change_of_mind.md) + `CHANGELOG.md` |
| Issue / wrong-device returns flow | [output/returns/issue.md](./output/returns/issue.md) + `CHANGELOG.md` |
| `ClaimCard`, takeover cards, sub-status / action gates, SLAs | [output/returns/claim_tracking.md](./output/returns/claim_tracking.md) + `CHANGELOG.md` |
| Warranty / compensation scoping (when wired) | [output/warranties_compensations.md](./output/warranties_compensations.md) + `CHANGELOG.md` |
| Journey mode (`?journey=<id>`), new journeys, branches, real-UI wiring | [output/journey_backend_spec.md](./output/journey_backend_spec.md) (keep slim — see its **Editing this doc** section) + `CHANGELOG.md` |
| Operational state machine (drawio source) | [input/](./input/) + the source `.drawio` file in lock-step |
| User-visible copy / style / microcopy only | `CHANGELOG.md` only |
| Internal refactor, no UX change | Neither |
| New convention, mental model, gotcha | + [`../CLAUDE.md`](../CLAUDE.md) |

For `CHANGELOG.md`, add to the top `[Unreleased]` block — keep bullets to 1–2 sentences; the diff shows what changed, the bullet just names it.

## Source-of-truth files in the codebase

Some behaviour is data-driven and edited in code rather than docs. Pointers:

| Behaviour | Source |
|---|---|
| Status / sub-status / state, banner copy + tone, `pickActiveOrderId` | `src/lib/statuses.js` |
| Eligibility, refund math, fee rate, return window, `generateClaimRef` | `src/lib/returns.js` |
| Claim states, tone, progress index, sub-status copy, SLAs, action-gate copy | `src/lib/claims.js` |
| History thread events (`getHistoryEvents(order, mode)`) | `src/lib/events.js` |
| Issue sub-types + per-sub-issue guidance | `src/components/ClaimFlow/issueSubtypes.js` |
| Mock orders | `src/data/orders.js` |

Edit copy / tone / SLAs in the source files, not in the components.
