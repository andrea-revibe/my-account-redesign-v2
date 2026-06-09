---
status: live
verified_against: c2ca086
covers:
  - src/App.jsx
  - src/lib/claims.js
  - src/lib/statuses.js
  - src/components/ClaimFlow/ClaimFlow.jsx
---

# Cross-cutting diagrams

> The **connective** diagrams — the control flow that spans more than one component or flow and so can't be read off a single file. Read the relevant one *before* planning a change that crosses flows; one diagram read replaces reconstructing the path from `App.jsx` + `lib/claims.js` + the data files. Per-flow diagrams live in their own feature docs ([orders.md](./orders.md), [returns/](./returns/), [warranties_compensations.md](./warranties_compensations.md)); this doc only carries the cross-cutting set. Linked from [`../code_map.md`](../code_map.md).

These are hand-maintained — there's no generator. When routing precedence, a claim pipeline, or the submit→render path changes, update the matching diagram here (see the doc-update protocol in [`../../CLAUDE.md`](../../CLAUDE.md)).

---

## Card routing

**Read before:** touching the routing precedence in `App.jsx`, adding a card variant, or adding a takeover flag. **Source:** `src/App.jsx` — `isOpen` L50–56, in-progress ladder L289–350, past ladder L359–389.

`App.jsx` routes in **two stages**, not one flat precedence list. First `isOpen(order)` partitions the filtered orders into the *In progress* and *Past* sections; then a precedence ladder inside each section picks the card. In journey mode the list is a single replayed order (`projectedOrders = [activeOrderFromJourney]`) routed through the *same* ladder. Each takeover branch in code is guarded by `hasActiveClaim(o) && o.claim?.X` — a takeover claim is always active, so what matters is the ladder order.

```mermaid
flowchart TD
  start(["order in filtered list"]) --> isOpen{"isOpen(order)?"}
  isOpen -- "NOT isReturnDelivered AND (hasActiveClaim · OR not-cancelled & not-delivered · OR in-flight cancellation)" --> IP[["In progress section"]]
  isOpen -- "else (incl. isReturnDelivered)" --> PAST[["Past orders section"]]

  IP --> ip1{"claim.docsRejection?"}
  ip1 -- yes --> DocsRejectedCard
  ip1 -- no --> ip2{"claim.pickupFailure?"}
  ip2 -- yes --> PickupFailedCard
  ip2 -- no --> ip3{"claim.resetFailed?"}
  ip3 -- yes --> ResetFailedCard
  ip3 -- no --> ip4{"claim.invalidClaim?"}
  ip4 -- yes --> InvalidClaimCard
  ip4 -- no --> ip5{"claim.type == 'warranty'?"}
  ip5 -- yes --> WCI["WarrantyClaimCard"]
  ip5 -- no --> ip6{"hasActiveClaim?"}
  ip6 -- yes --> CCI["ClaimCard"]
  ip6 -- no --> ip7{"in-flight cancellation?"}
  ip7 -- yes --> POK["PastOrderCard (onKeep)"]
  ip7 -- no --> ip8{"statusId created / quality_check?"}
  ip8 -- yes --> InProgressCard
  ip8 -- no --> OrderCard

  PAST --> p0{"isReturnDelivered?"}
  p0 -- yes --> ICP["InvalidClaimCard (delivered → green)"]
  p0 -- no --> p1{"isWarrantyDelivered?"}
  p1 -- yes --> WCP["WarrantyClaimCard"]
  p1 -- no --> p2{"isClaimRefunded?"}
  p2 -- yes --> CCP["ClaimCard"]
  p2 -- no --> POC["PastOrderCard (onRaiseClaim)"]
```

The first four in-progress branches are the **takeover cards** — they supersede `ClaimCard` / `WarrantyClaimCard` while the claim is blocked on a single customer action, ordered chronologically in the pipeline. Full prose tree: [orders.md](./orders.md) §2.

---

## Claim lifecycle

**Read before:** changing a claim pipeline, adding a claim state, or wiring a new takeover. **Source:** `src/lib/claims.js` — `CLAIM_STATUSES`·18, `COMPENSATION_CLAIM_STATUSES`·64, `WARRANTY_CLAIM_STATUSES`·201, terminal predicates `hasActiveClaim`·137 / `isClaimRefunded`·145 / `isWarrantyDelivered`·151. Takeover seeded states: `src/data/orders/claims.js`.

All four pipelines on one canvas, tone-classed **warn → brand → success** (matching the card tone helpers), with the four takeover detours annotated by trigger flag + the claim state they're seeded at.

```mermaid
flowchart LR
  classDef warn fill:#fef3c7,stroke:#d97706,color:#111
  classDef brand fill:#ede9fe,stroke:#7c3aed,color:#111
  classDef done fill:#dcfce7,stroke:#16a34a,color:#111
  classDef takeover fill:#fee2e2,stroke:#dc2626,color:#111

  subgraph REFUND["Refund · CLAIM_STATUSES · ClaimCard"]
    direction LR
    r1["initiated"]:::warn --> r2["pickup"]:::warn --> r3["qc"]:::warn --> r4["refund_issued"]:::brand --> r5["refund_credited"]:::done
  end
  subgraph COMP["Compensation · COMPENSATION_CLAIM_STATUSES · ClaimCard (no pickup)"]
    direction LR
    c1["initiated"]:::warn --> c3["qc"]:::warn --> c4["refund_issued"]:::brand --> c5["refund_credited"]:::done
  end
  subgraph WARR["Warranty · WARRANTY_CLAIM_STATUSES · WarrantyClaimCard"]
    direction LR
    w1["initiated"]:::warn --> w2["pickup"]:::warn --> w3["qc"]:::warn --> w4["under_repair"]:::brand --> w5["ship_back"]:::brand --> w6["device_returned"]:::done
  end

  r1 -. "docsRejection (@initiated)" .-> T1["DocsRejectedCard"]:::takeover
  r1 -. "pickupFailure (@initiated)" .-> T2["PickupFailedCard"]:::takeover
  r3 -. "resetFailed (@qc)" .-> T3["ResetFailedCard"]:::takeover
  r3 -. "invalidClaim (@qc)" .-> T4["InvalidClaimCard"]:::takeover
  c3 -. "invalidClaim (compensation @qc)" .-> T5["InvalidClaimCard → CompensationClosedCard"]:::takeover
```

Notes:
- **In progress vs Past.** `hasActiveClaim` keeps a claim in the *In progress* section until its terminal state — `refund_credited` (refund/compensation) or `device_returned` (warranty) — which flips it to *Past* via `isClaimRefunded` / `isWarrantyDelivered`.
- **Compensation reuses the refund status ids** (`initiated` / `qc` / `refund_issued` / `refund_credited`) minus the pickup leg, so the tone/phase helpers apply unchanged.
- **Projection invariant.** A freshly-submitted claim always lands on `initiated` (see [Returns data-flow](#returns-data-flow)). Every post-`initiated` state and all four takeovers are reachable only via hand-seeded mocks in `data/orders/*` — see each `docs/output/*.md` "Mocked vs production" list. Spec: [returns/claim_tracking.md](./returns/claim_tracking.md), [warranties_compensations.md](./warranties_compensations.md).

---

## Returns data-flow

**Read before:** changing how a submitted claim reaches a card, the undo, or the track-to-expand behaviour. **Source:** `src/App.jsx` — `handleSubmitClaim`·171, projection·199–207, `UndoSnackbar` wiring·417, `handleTrackClaim`·193; `src/components/ClaimFlow/ClaimFlow.jsx` (`onSubmitClaim`).

The coupling here is a **runtime projection**, not an import: the seeded claim is stitched onto the order at render time. This is the path most likely to confuse, because no import edge connects `ClaimFlow` to the card that ends up rendering.

```mermaid
flowchart TD
  A["ClaimFlow overlay — user completes steps"] -->|"handlePrimary → onSubmitClaim(orderId, claim); seed always claimStatusId:'initiated'"| B{"journeyMode?"}
  B -- "yes (replay)" --> J["journey.advance('claim_submitted_*') — no submittedClaims write"]
  B -- "no" --> C["App.setSubmittedClaims({...prev, [orderId]: claim}) + setRecentSubmit"]
  C --> D["projectedOrders = ORDERS.map(o => submittedClaims[o.id] ? {...o, claim} : o)  (App.jsx ~L204)"]
  D --> E["isOpen(o) re-partitions → order enters In-progress section"]
  E --> F["Card-routing ladder → ClaimCard / WarrantyClaimCard (or a takeover card if the claim carries a takeover flag)"]
  C --> G["UndoSnackbar (8s) — Undo deletes submittedClaims[orderId] → order reverts to PastOrderCard"]
  F --> H["Step 7 'Track this return' → onTrackClaim → setAutoOpenClaim → matched card mounts expanded"]
```

`submittedClaims` is in-session only (cleared on refresh — there's no backend). Card selection at node **F** follows the [Card routing](#card-routing) ladder.
