# Journey mode — purpose, recipe, and backend event spec

> Companion doc to the prototype's **journey mode** (`?journey=1`). Every transition the dev panel exposes corresponds to a backend event production engineering will need to emit. This doc explains why the mode exists, how to extend it with new journeys, and is the canonical spec for each wired transition (trigger, event name, payload sketch, field deltas, UI surface).
>
> Scope today: **happy-path order lifecycle** (§3 + §4) and **cancellation at QC** with refund-method and supplier-decision forks (§5). Claim and warranty journeys will extend this doc as they ship — see §7 for the recipe, and §6 for how to wire customer-triggered nodes to real UI.

## 1. Purpose

Journey mode is an alternate demo mode for the prototype. The default view shows eight orders side by side, each pre-seeded to a different state — useful for stakeholder reviews where you want to compare card variants at a glance, but it doesn't show the **progression** a real customer experiences over time. Journey mode flips that: a single order replays through one lifecycle, advanced by clicking transitions in a floating dev panel. Same prototype, same components, same data shapes — but one order, one timeline, one decision tree.

Three reasons it exists:

1. **Immersive demo.** Stakeholders see a real customer journey end-to-end — place an order, watch QC happen, see the shipment progress, take delivery, hit a snag and recover. Each transition's UI is rendered by the same card components that production will use, so the demo and the build stay in sync.
2. **Backend-event spec.** Every transition in the dev panel maps 1:1 to a backend event the production system will need to emit. This doc is that spec. Writing a journey forces you to think through (and document) the events behind it, so the prototype doubles as a hand-off artifact for engineering.
3. **Sequential state exercise.** The eight-card demo can leave gaps — states that exist in the data model but aren't exercised by any card. Journey mode catches those by walking through transitions in order; if a card breaks at step 4, you find out before the engineers do.

The two modes are independent: the eight-card demo stays as-is for design review; journey mode is opt-in via the URL.

## 2. How journey mode works (prototype side)

- `?journey=<id>` flips `App.jsx` into journey mode. The eight-card demo is replaced by a single order replayed from the journey's `initialOrder`. The **`Journey mode ×`** chip appears in the header (clicking it exits the mode and clears the URL param). Backward compat: `?journey=1` aliases the first journey (`happy_path`); unknown ids fall back to the first journey.
- The `JourneyDevPanel` (bottom-right of the viewport) shows: a **picker chip row** for switching between journeys, a step counter with a **back chevron** that steps one node back along the visited path, the current node's trigger badge + backend event name, and the **next valid transition(s)** as buttons. Each Next click runs the corresponding node's `apply(order)` and the order flows through the existing rendering pipeline (`InProgressCard` → `OrderCard` → `PastOrderCard` etc.) — no journey-specific branches in the card tree.
- Switching journeys via the picker resets the cursor to the new journey's first node and updates the URL param. The picker row hides itself when only one journey exists (forwards-compat — never the case today).
- No persistence: refresh resets the journey to its first node. URL param survives; the in-memory cursor doesn't.
- Source files: `src/data/journey.js` (`INITIAL_ORDER` + the `JOURNEYS` array), `src/lib/journey.js` (the `useJourney(journeyId)` hook + `advance` / `back` / `reset`), `src/components/JourneyDevPanel.jsx` (the panel + picker), `src/App.jsx` (mode wiring + URL param), `src/components/Header.jsx` (mode badge).

## 3. Transition summary (happy path)

| # | Node id | Trigger | Event | Card after transition |
|---|---|---|---|---|
| 0 | `placed` | customer | `order.created` | `InProgressCard` (created) |
| 1 | `qc_started` | system | `order.quality_check.started` | `InProgressCard` (quality_check) |
| 2 | `shipped_arrived_destination` | system (DHL webhook) | `shipment.arrived_destination` | `OrderCard` (shipped, sub: arrived) |
| 3 | `shipped_cleared_customs` | system (DHL webhook) | `shipment.cleared_customs` | `OrderCard` (shipped, sub: cleared customs) |
| 4 | `shipped_forwarded_to_agent` | system (DHL webhook) | `shipment.forwarded_to_agent` | `OrderCard` (shipped, sub: forwarded) |
| 5 | `shipped_out_for_delivery` | system (DHL webhook) | `shipment.out_for_delivery` | `OrderCard` (shipped, sub: out for delivery) |
| 6 | `delivered` | system (DHL POD) | `shipment.delivered` | `PastOrderCard` (delivered) |

## 4. Per-transition detail (happy path)

Each transition section follows the same structure: **Trigger** · **Event** · **Payload** · **Field deltas** · **UI surface**.

### 4.0 `placed` — order placed

- **Trigger**: customer completes checkout.
- **Event**: `order.created`
- **Payload** (sketch):
  ```json
  {
    "orderId": "JOURNEY-001",
    "customer": { "name": "Andrea Grossi", "email": "andrea@revibe.me", "phone": "+971 50 559 5034" },
    "address": "Ontario Tower, Office 103, Business Bay Dubai",
    "lineItems": [{ "sku": "iphone-13-midnight-128-good", "qty": 1, "unitPrice": 939, "warranty": 90 }],
    "currency": "AED",
    "placedAt": "2026-05-19T10:30:00+04:00",
    "paymentMethod": { "type": "card", "brand": "Visa", "last4": "4242" }
  }
  ```
- **Field deltas**: this is the initial state. All fields in `INITIAL_ORDER` are set at creation. `statusId: 'created'`, `state: 'open'`, `timeline.created` is set, `courier` / `trackingNumber` / `subStatusId` are null.
- **UI surface**: `InProgressCard` rendered in the **In progress** section. Horizontal timeline shows step 1 of 4 active. Banner: brand-purple "On track" with body copy from `STATUS_DESCRIPTIONS.created`.

### 4.1 `qc_started` — quality check started

- **Trigger**: warehouse intake operator marks the device received and assigned to QC.
- **Event**: `order.quality_check.started`
- **Payload** (sketch):
  ```json
  { "orderId": "JOURNEY-001", "startedAt": "2026-05-21T09:18:00+04:00", "lab": "LAB-DXB-01" }
  ```
- **Field deltas**:
  - `statusId: 'created' → 'quality_check'`
  - `timeline.quality_check: null → '21 May · 9:18 AM'`
- **UI surface**: `InProgressCard` still in **In progress**. Horizontal timeline advances to step 2. Banner copy updates to `STATUS_DESCRIPTIONS.quality_check` ("Your device is currently undergoing a 50-point inspection.").

### 4.2 `shipped_arrived_destination` — arrived in destination country

- **Trigger**: DHL webhook reports the package has cleared origin and arrived at the destination-country hub. At this point the courier and AWB are known.
- **Event**: `shipment.arrived_destination`
- **Payload** (sketch):
  ```json
  {
    "orderId": "JOURNEY-001",
    "courier": "DHL Express",
    "trackingNumber": "25193399",
    "trackingUrl": "https://www.dhl.com/track",
    "shippedAt": "2026-05-23T11:02:00+04:00",
    "arrivedAt": "2026-05-24T08:30:00+04:00"
  }
  ```
- **Field deltas**:
  - `statusId: 'quality_check' → 'shipped'`
  - `subStatusId: null → 'arrived_destination'`
  - `courier: null → 'DHL Express'`
  - `trackingNumber: null → '25193399'`
  - `trackingUrl: null → 'https://www.dhl.com/track'`
  - `timeline.shipped: null → '23 May · 11:02 AM'`
  - `subTimeline.arrived_destination: null → '24 May · 8:30 AM'`
- **UI surface**: card swaps to `OrderCard` (auto-expanded as the most-in-flight order). Horizontal timeline advances to step 3. Vertical sub-timeline appears with `arrived_destination` highlighted. `CourierBanner` (DHL strip) appears. Banner copy: "Your package has arrived in the destination country and is awaiting customs clearance."

### 4.3 `shipped_cleared_customs` — cleared customs

- **Trigger**: DHL webhook (customs clearance event).
- **Event**: `shipment.cleared_customs`
- **Payload** (sketch):
  ```json
  { "orderId": "JOURNEY-001", "clearedAt": "2026-05-24T11:15:00+04:00" }
  ```
- **Field deltas**:
  - `subStatusId: 'arrived_destination' → 'cleared_customs'`
  - `subTimeline.cleared_customs: null → '24 May · 11:15 AM'`
- **UI surface**: `OrderCard` updates vertical sub-timeline (advance to step 2 of 4 inside shipped). Banner copy updates to the `cleared_customs` description.

### 4.4 `shipped_forwarded_to_agent` — forwarded to third-party agent

- **Trigger**: DHL webhook (hand-off to last-mile courier).
- **Event**: `shipment.forwarded_to_agent`
- **Payload** (sketch):
  ```json
  { "orderId": "JOURNEY-001", "forwardedAt": "2026-05-24T16:45:00+04:00", "agent": "local-courier-id" }
  ```
- **Field deltas**:
  - `subStatusId: 'cleared_customs' → 'forwarded_to_agent'`
  - `subTimeline.forwarded_to_agent: null → '24 May · 4:45 PM'`
- **UI surface**: sub-timeline advances to step 3 of 4. Banner copy: "Your package has been handed to the local courier for the final mile."

### 4.5 `shipped_out_for_delivery` — out for delivery

- **Trigger**: last-mile courier webhook (driver collected for delivery).
- **Event**: `shipment.out_for_delivery`
- **Payload** (sketch):
  ```json
  { "orderId": "JOURNEY-001", "dispatchedAt": "2026-05-25T07:30:00+04:00" }
  ```
- **Field deltas**:
  - `subStatusId: 'forwarded_to_agent' → 'out_for_delivery'`
  - `subTimeline.out_for_delivery: null → '25 May · 7:30 AM'`
- **UI surface**: sub-timeline advances to step 4 of 4. Banner copy escalates from "On track" to "Arriving today" — `STATUS_DESCRIPTIONS['shipped:out_for_delivery']` swaps lead and body.

### 4.6 `delivered` — delivered

- **Trigger**: last-mile courier POD (proof of delivery).
- **Event**: `shipment.delivered`
- **Payload** (sketch):
  ```json
  { "orderId": "JOURNEY-001", "deliveredAt": "2026-05-25T15:14:00+04:00", "signedBy": "Andrea Grossi" }
  ```
- **Field deltas**:
  - `statusId: 'shipped' → 'delivered'`
  - `state: 'open' → 'close'`
  - `subStatusId: 'out_for_delivery' → null`
  - `timeline.delivered: null → '25 May · 3:14 PM'`
  - `deliveredOn: null → '2026-05-25'`
  - `deliveredOnLong: null → 'Monday, 25 May'`
- **UI surface**: card moves from **In progress** to **Past orders** section and swaps to `PastOrderCard`. Status bubble flips to green (`PackageCheck`). `HistoryThread` renders the prior events (created / QC / shipped / out_for_delivery) as collapsible chips. The "Raise a claim" CTA is intentionally suppressed in journey mode (this happy path doesn't fork into the returns flow).

## 5. Journey: Cancellation at QC

The customer cancels their order during the `quality_check` stage. Two forks make this the prototype's first multi-branch journey:

1. **Customer decision** — the refund method picked inside `CancelOrderSheet` (wallet vs original payment) determines the `refund` object shape, so each method gets its own `cancellation_requested_*` node.
2. **System decision** — the supplier-confirm step decides whether the unit can actually be pulled back from packing. Accepted branches terminate at a `refunded_*` node (the order drops to **Past orders**). The declined branch reverts the order to `state: 'open'` and continues through the standard shipping chain so the `Cancel rejected` chip surfaces in `HistoryThread` on `OrderCard` / `PastOrderCard` — proving the historical event survives across card transitions.

The two refund-method branches converge on a single `cancellation_declined` node — decline outcome is identical regardless of refund method, since no refund is ever issued.

### 5.1 Node graph

```
                         ┌─ cancellation_accepted_wallet ─ refunded_wallet  (terminal)
                         │
placed → qc_started ─────┤   cancellation_requested_wallet
                         │           └────┐
                         │                ├─→ cancellation_declined
                         │           ┌────┘
                         │   cancellation_requested_card
                         │
                         └─ cancellation_accepted_card ─── refunded_card    (terminal)

cancellation_declined → arrived_destination → cleared_customs
                     → forwarded_to_agent → out_for_delivery → delivered
```

### 5.2 Transition summary

| # | Node id | Trigger | Event | Card after transition |
|---|---|---|---|---|
| 0 | `placed` | customer | `order.created` | `InProgressCard` (created) |
| 1 | `qc_started` | system | `order.quality_check.started` | `InProgressCard` (quality_check) |
| 2a | `cancellation_requested_wallet` | customer | `order.cancellation.requested` | `PastOrderCard` refund-hero (requested, warn) |
| 3a | `cancellation_accepted_wallet` | system | `order.cancellation.accepted` | `PastOrderCard` refund-hero (refund_pending, brand) |
| 4a | `refunded_wallet` | system | `order.refund.completed` | `PastOrderCard` refund-hero (refunded, success) → **Past orders** |
| 2b | `cancellation_requested_card` | customer | `order.cancellation.requested` | `PastOrderCard` refund-hero (requested, warn) |
| 3b | `cancellation_accepted_card` | system | `order.cancellation.accepted` | `PastOrderCard` refund-hero (refund_pending, brand) |
| 4b | `refunded_card` | system | `order.refund.completed` | `PastOrderCard` refund-hero (refunded, success) → **Past orders** |
| 5 | `cancellation_declined` | system | `order.cancellation.declined` | `InProgressCard` (back to open, `cancellationRejection` set) |
| 6–10 | `shipped_*` + `delivered` | system | per §4.2–§4.6 | `OrderCard` (shipped sub-statuses) → `PastOrderCard` (delivered) · `HistoryThread` carries the `Cancel rejected` chip |

### 5.3 Per-transition detail

Nodes that reuse a happy-path delta are referenced rather than duplicated. Cancellation-specific nodes are spelled out in full.

#### 5.3.0 `placed`

Same as §4.0.

#### 5.3.1 `qc_started`

Same as §4.1, plus an explicit fork: `next: ['cancellation_requested_wallet', 'cancellation_requested_card']`. The dev panel renders two Next buttons; once the cancel sheet is wired (§6), the customer's refund-method radio picks which one fires.

#### 5.3.2 `cancellation_requested_wallet` — cancellation requested, wallet refund

- **Trigger**: customer completes the `CancelOrderSheet` flow with `method='store_credit'`.
- **Event**: `order.cancellation.requested`
- **Payload** (sketch):
  ```json
  {
    "orderId": "JOURNEY-001",
    "requestedAt": "2026-05-21T11:42:00+04:00",
    "refundMethod": "wallet",
    "cancellationRef": "J0urN1"
  }
  ```
- **Field deltas**:
  - `state: 'open' → 'cancelled'`
  - `cancellationStatusId: null → 'requested'`
  - `cancellationRef: null → 'J0urN1'`
  - `cancellationTimeline.requested: null → '21 May · 11:42 AM'`
  - `refund: null → { subtotal: 1029, amount: 1029, destination: { kind: 'wallet', label: 'Revibe Wallet' }, breakdown: [...] }`
- **UI surface**: card swaps from `InProgressCard` to `PastOrderCard` refund-hero variant (warn-amber `Requested` phase, brand→accent gradient wallet destination chip, `AED 1029` amount, eyebrow `Cancellation · #J0urN1`). Stays in **In progress** (refund hasn't landed).

#### 5.3.3 `cancellation_accepted_wallet` — supplier confirmed, refund queued

- **Trigger**: ops supplier-confirm step (unit hadn't been packed).
- **Event**: `order.cancellation.accepted`
- **Payload** (sketch):
  ```json
  { "orderId": "JOURNEY-001", "acceptedAt": "2026-05-21T13:08:00+04:00" }
  ```
- **Field deltas**:
  - `cancellationStatusId: 'requested' → 'refund_pending'`
  - `cancellationTimeline.refund_pending: null → '21 May · 1:08 PM'`
- **UI surface**: same card; phase flips warn-amber → brand-purple `Refund pending`. Still **In progress**.

#### 5.3.4 `refunded_wallet` — wallet credit landed

- **Trigger**: wallet credit applied (instant for the wallet path).
- **Event**: `order.refund.completed`
- **Payload** (sketch):
  ```json
  { "orderId": "JOURNEY-001", "settledAt": "2026-05-21T13:09:00+04:00", "destination": "wallet" }
  ```
- **Field deltas**:
  - `cancellationStatusId: 'refund_pending' → 'refunded'`
  - `cancellationTimeline.refunded: null → '21 May · 1:09 PM'`
  - `refund.fundsAvailable: null → 'Available now in your wallet'`
- **UI surface**: phase flips brand-purple → success-green `Refunded`. Card drops to **Past orders**. Dev panel: `Journey complete`.

#### 5.3.5 `cancellation_requested_card` — cancellation requested, original-payment refund

- **Trigger**: customer completes `CancelOrderSheet` with `method='original'`.
- **Event**: `order.cancellation.requested`
- **Payload**: same shape as §5.3.2, with `refundMethod: 'card'`.
- **Field deltas**: same as §5.3.2 except `refund: { subtotal: 1029, fee: { label: 'Processing fee', rate: 0.05, amount: 51.45 }, amount: 977.55, destination: { kind: 'card', label: 'Visa', last4: '4242' }, breakdown: [...] }`.
- **UI surface**: same `PastOrderCard` refund-hero variant, but with neutral card destination chip (`Visa •• 4242`), amount **AED 977.55**, and the fee line surfacing in `RefundDetailsSheet` when opened.

#### 5.3.6 `cancellation_accepted_card`

Identical trigger / payload / deltas / UI to §5.3.3.

#### 5.3.7 `refunded_card` — card refund issued

- **Trigger**: payment processor confirms refund issued.
- **Event**: `order.refund.completed`
- **Payload**: same shape as §5.3.4, with `destination: "card"`.
- **Field deltas**:
  - `cancellationStatusId: 'refund_pending' → 'refunded'`
  - `cancellationTimeline.refunded: null → '24 May · 9:30 AM'` (3-day processing gap vs the wallet path's 1-minute settle)
  - `refund.fundsAvailable` **not** set — card-refund ETA copy lives elsewhere; the absence of `fundsAvailable` is the signal that money is in flight at the processor.
- **UI surface**: same as §5.3.4, no `fundsAvailable` subcopy.

#### 5.3.8 `cancellation_declined` — supplier rejected, order resumes

- **Trigger**: ops supplier-confirm step concludes the unit was already packed.
- **Event**: `order.cancellation.declined`
- **Payload** (sketch):
  ```json
  {
    "orderId": "JOURNEY-001",
    "declinedAt": "2026-05-21T16:18:00+04:00",
    "rejectionRef": "CXL-J0urN1",
    "reason": "After review, the supplier confirmed your unit had already been packed and we couldn't pull it back."
  }
  ```
- **Field deltas**:
  - `state: 'cancelled' → 'open'`
  - `cancellationStatusId: 'requested' → undefined` (active phase cleared; the historical trace lives on in `cancellationTimeline`)
  - `cancellationTimeline.rejected: null → '21 May · 4:18 PM'`
  - `cancellationRejection: null → { ref: 'CXL-J0urN1', reason: '...' }`
  - `refund: {…} → undefined` (the refund was never issued)
- **UI surface**: card reverts from `PastOrderCard` refund-hero to `InProgressCard` (still at `statusId: 'quality_check'`). The `Cancel rejected` chip is **not yet visible** here — `InProgressCard` doesn't render `HistoryThread`. It surfaces in the next node (see below).

#### 5.3.9 – 5.3.13 `shipped_*` → `delivered`

Same as §4.2 – §4.6 respectively. The first card transition (`InProgressCard` → `OrderCard` at `shipped_arrived_destination`) is where the `Cancel rejected` chip becomes visible in `HistoryThread`. It survives into `PastOrderCard` once the order delivers, mirroring how layered mocks like order 89499 carry their rejection chip into a later `ClaimCard`.

### 5.4 Open prototype gaps (cancel-at-qc only)

- **`CancelOrderSheet` submit is still a stub.** Step 3's `Cancel order` button calls `onClose()` — it does not yet emit a submit event. Until the wiring in §6 lands, this journey can only be driven from the dev panel (the customer-triggered Next buttons fire `cancellation_requested_wallet` / `cancellation_requested_card` directly).
- **No reverse-cancellation UI path.** The `KeepOrderSheet` button on the refund-hero card is a stub today (see `docs/output/cancellations.md` §9). A future journey could add nodes for `cancellation_reversed` after `cancellation_accepted_*`.
- **No partial refunds in the data shape.** All refund deltas assume a single line-item refund equal to `order.total`. Production may need split refunds (per line item, per shipment) that this journey doesn't exercise.

## 6. Wiring real UI to journey nodes

Journey mode advances by clicking the dev panel today, but the customer-facing prototype carries the actual sheets and cards that production will ship. For journeys to double as an end-to-end demo (and a backend-event spec the front-end can play against), customer-triggered nodes should be driven by the **real UI** in the prototype, not by the dev panel. This section is the recipe for that wiring.

### 6.1 Customer vs system triggers

| Trigger | Source of advance | Examples |
|---|---|---|
| `customer` | Real UI in the prototype (sheet submits, button taps) — calls `journey.advance(nodeId)` | `cancellation_requested_*`, future `claim_submitted` |
| `system` | Stays in the dev panel | `qc_started`, `cancellation_accepted_*`, `shipment.*`, `refund.completed` |

`system` events are courier webhooks, ops decisions, supplier confirms — there's no customer-facing surface that fires them, so the dev panel is the canonical (and only) trigger.

### 6.2 Recommended pattern — callback bubbling + `validNext` gate

Three small edits per customer-triggered node:

1. **Component exposes a submit callback** — e.g. `CancelOrderSheet` adds `onSubmit({ method })` to its props and calls it from Step 3's Cancel button.
2. **Host card passes it through** — `InProgressCard` / `OrderCard` add an optional `onCancelOrder` prop and forward it to the sheet's `onSubmit`.
3. **`App.jsx` maps payload → node id and advances, gated on `validNext()`** — example:

   ```jsx
   const handleCancelOrder = ({ method }) => {
     if (!journeyMode) return                       // future: seed real cancellation state here
     const branch = method === 'store_credit' ? 'wallet' : 'card'
     const target = `cancellation_requested_${branch}`
     if (journey.validNext().some((n) => n.id === target)) {
       journey.advance(target)
     }
   }
   ```

The gate matters: without `validNext().some(...)`, an out-of-sequence submit (cancel sheet opened at `delivered`, claim flow submitted at `placed`) would still append a node and the replay would silently apply the wrong delta.

### 6.3 Worked example — cancel sheet ↔ `cancellation_requested_*`

Current state of `CancelOrderSheet`: `{ order, open, onClose }` props, Step 3 confirm is `onConfirm={onClose}` (pure stub). Refund-method ids inside the sheet are `store_credit` / `original` — map to `wallet` / `card` at the wiring layer.

| Sheet outcome | Journey node fired |
|---|---|
| Step 3 Cancel, `method === 'store_credit'` | `cancellation_requested_wallet` |
| Step 3 Cancel, `method === 'original'` | `cancellation_requested_card` |
| Step 1 / 2 / 3 Keep my order, X, Escape | (no advance — sheet just closes) |

The `Continue to cancel` button on the Step 2 dissuade screen is **not** a submit — it routes to Step 3 confirm. Only Step 3's Cancel button counts as the customer's commitment.

### 6.4 Permissive vs strict dev panel

Two stances; default permissive:

- **Permissive (current)** — the dev panel renders Next buttons for every valid transition, including `customer`-triggered ones. Customer flows can be driven either from the panel (shortcut) or from the real UI (full demo). Useful when iterating quickly.
- **Strict** — hide Next buttons whose node's `trigger === 'customer'` so the only way to advance is through the real surface. Reads cleaner as a backend-spec document (the panel becomes "system event simulator" only), at the cost of slower stakeholder demos.

Switching modes is a `trigger === 'customer' && !showCustomerButtons` filter in `JourneyDevPanel.jsx`'s `nexts` render — a couple of lines. Revisit once 3+ customer-triggered nodes exist across journeys.

### 6.5 Future evolution — event-dispatch

Each node already carries `event: 'order.cancellation.requested'`. The natural evolution is to make the journey listen for *events* instead of *node ids*:

```js
journey.dispatch('order.cancellation.requested', { refundMethod: 'wallet' })
// internally: find a node in validNext() whose event matches AND whose
// optional payload predicate (declared on the node) passes; advance to it.
```

UI handlers stop knowing about node ids:

```jsx
// Before
journey.advance(`cancellation_requested_${branch}`)
// After
journey.dispatch('order.cancellation.requested', { refundMethod: branch })
```

Why this is better:
- The mapping lives **in the journey config**, not in `App.jsx`. Adding a new branch (e.g. `cancellation_requested_gift_card`) only touches `src/data/journey.js`.
- The prototype becomes much closer to a real event-sourced backend simulator — which is the doc's stated second purpose (§1).

Why we haven't done it yet: refactor cost outweighs benefit at one consumer. Hold until 3+ customer-triggered nodes exist across journeys.

## 7. Adding a new journey

The code today (`src/data/journey.js`) holds two journeys — happy path (§3 + §4) and cancellation at QC (§5). The data layer uses a **hybrid architecture**: top-level journeys picked from the dev panel, with optional branches inside each journey. This section is the recipe for adding a third.

### 7.1 Target data shape

```js
// src/data/journey.js (post-refactor)
export const JOURNEYS = [
  {
    id: 'happy_path',
    label: 'Happy path',
    initialOrder: INITIAL_ORDER,
    nodes: [
      { id: 'placed',     label: 'Order placed',           trigger: 'customer', event: 'order.created',                  apply: (o) => o },
      { id: 'qc_started', label: 'Quality check started', trigger: 'system',   event: 'order.quality_check.started',   apply: (o) => ({ ...o, statusId: 'quality_check', /* ... */ }) },
      // ...
    ],
  },
  {
    id: 'cancel_at_placed',
    label: 'Cancellation at placed',
    initialOrder: INITIAL_ORDER,  // can share the same starting order
    nodes: [ /* ... */ ],
  },
]
```

- Each journey is independent: own `initialOrder`, own `nodes` list, own dev-panel session.
- Journeys can share an `initialOrder` constant — most demos start from the same fresh-order shape.
- **Branching inside a journey** is opt-in via a `next: ['nodeIdA', 'nodeIdB']` field on the branch node. The default (omitted) is "next node in the array order", which keeps linear journeys terse:

  ```js
  // Branching example — at `qc_done`, the operator can pass or fail
  { id: 'qc_done', label: 'QC done', trigger: 'system', event: 'qc.evaluated', apply: (o) => o, next: ['qc_passed', 'qc_failed'] },
  { id: 'qc_passed', /* ... */ },
  { id: 'qc_failed', /* ... */ },
  ```

  When `validNext()` returns multiple options, the dev panel renders one Next button per option. This keeps the linear `Next →` UX clean for the common case while supporting forks where they exist.

### 7.2 URL + dev-panel

- URL is `?journey=<journey_id>` (e.g. `?journey=happy_path`, `?journey=cancel_at_qc`). `?journey=1` is kept as a backward-compat alias for the first journey; unknown ids fall back to the first journey too.
- Dev panel renders a **picker chip row** at the top (one chip per journey, active filled brand). Click to switch journeys — the cursor resets to the new journey's first node and the URL param is updated in `replaceState`.
- The panel hides the picker row when only one journey exists (forward-compat — never the case today).

### 7.3 Recipe — add a new top-level journey

1. **Sketch the nodes on paper first.** For each node: id, customer-facing label, trigger (`customer` / `system` / `external`), backend event name, the exact field deltas applied to the order. The node *is* the spec — do this before writing code.
2. **Decide if you need branches.** If multiple paths fork from one node, list the destination node ids; if not, leave nodes linear.
3. **Author the journey config** as an entry in `JOURNEYS`. Reuse the existing `INITIAL_ORDER` constant unless your journey starts from a meaningfully different shape.
4. **Verify card routing.** Journey mode runs the projected order through `App.jsx`'s existing routing tree (`hasActiveClaim` / `isInFlightCancellation` / `statusId` checks etc.). If your transitions land the order in a state no card handles, update the routing too.
5. **Document the journey** here, in this file: add a new top-level section before §7 (e.g. `## 7. Journey: <name>`, renumbering subsequent sections) with a node graph, transition summary table, and per-transition detail (trigger, event, payload, field deltas, UI surface). Mirror the structure of §5 (cancel-at-qc) for branched journeys, or §3 + §4 (happy path) for linear ones.
6. **Update meta docs.** Add a one-line bullet to `CHANGELOG.md` Unreleased. Update `docs/README.md` only if the new journey introduces new feature surfaces (otherwise the existing journey-mode entry covers it).

### 7.4 Recipe — add a branch within an existing journey

1. Add the new node(s) at the appropriate place in the journey's `nodes` array.
2. Add `next: ['existingNextId', 'newBranchNodeId']` to the source node where the fork begins. Both ids must exist in `nodes`.
3. Walk each branch to a sensible terminal node (or rejoin the trunk if the flow converges later — set `next` on the branch's last node to point at the rejoin target).
4. Add the new transitions to this doc under the journey's section.

### 7.5 Worked example — cancellation at placed (sketch)

A paper sketch for a different cancellation journey than the one wired in §5. Pre-QC cancellation: the customer cancels before the warehouse has touched the device, so the order skips the `requested` cancellation sub-status (per `src/lib/statuses.js` — created-stage cancellations go straight to `refund_pending`). Three nodes, all share the happy-path starting order. Contrast with the wired cancel-at-qc journey in §5, which exercises the `requested` phase and forks at supplier-confirm time.

```js
{
  id: 'cancel_at_placed',
  label: 'Cancellation at placed',
  initialOrder: INITIAL_ORDER,
  nodes: [
    {
      id: 'placed',
      label: 'Order placed',
      trigger: 'customer',
      event: 'order.created',
      apply: (o) => o,
    },
    {
      id: 'cancellation_requested',
      label: 'Cancellation requested',
      trigger: 'customer',
      event: 'order.cancellation.requested',
      apply: (o) => ({
        ...o,
        state: 'cancelled',
        cancellationStatusId: 'refund_pending',
        cancellationTimeline: { refund_pending: '19 May · 10:32 AM' },
      }),
    },
    {
      id: 'refunded',
      label: 'Refunded',
      trigger: 'system',
      event: 'order.refund.completed',
      apply: (o) => ({
        ...o,
        cancellationStatusId: 'refunded',
        cancellationTimeline: {
          ...o.cancellationTimeline,
          refunded: '19 May · 2:08 PM',
        },
      }),
    },
  ],
}
```

UI walkthrough (anticipated): the card swaps from `InProgressCard` → `PastOrderCard` in the cancelled-pending variant (red status bubble, "Refund pending" headline, in-flight section) → `PastOrderCard` refunded variant (green bubble, "Refunded", drops to **Past orders**). Card routing reference: §2 of `docs/output/orders.md`; cancellation surface reference: `docs/output/cancellations.md`.

When this journey ships, this sketch graduates into a fully-spec'd section with payloads, deltas, and UI surface notes per transition — same shape as §5.

## 8. Field touch map

All order fields written across the lifecycle, grouped by category. Read this as: "production backend must be able to produce each of these on the order resource."

| Field | Set at node | Type / shape | Notes |
|---|---|---|---|
| `statusId` | placed → delivered | `'created' \| 'quality_check' \| 'shipped' \| 'delivered'` | Drives the horizontal 4-step timeline. Source enum: `src/lib/statuses.js → STATUSES`. |
| `subStatusId` | shipped_* (cleared at delivered) | `'arrived_destination' \| 'cleared_customs' \| 'forwarded_to_agent' \| 'out_for_delivery' \| null` | Only meaningful while `statusId === 'shipped'`. Source enum: `SHIPPING_SUB_STATUSES`. |
| `state` | placed (open) / delivered (close) | `'open' \| 'close' \| 'cancelled'` | Parallel to statusId — controls header chips. `cancelled` is set by a separate cancellation event stream (not in this journey). |
| `timeline.{created,quality_check,shipped,delivered}` | corresponding node | display strings (`'21 May · 9:18 AM'`) | Currently human-formatted; production should store ISO timestamps and format client-side. |
| `subTimeline.{arrived_destination,cleared_customs,forwarded_to_agent,out_for_delivery}` | corresponding node | display strings | Same note as `timeline`. |
| `courier`, `trackingNumber`, `trackingUrl` | shipped_arrived_destination | strings | All three become known together — first event after the AWB is created. |
| `deliveredOn`, `deliveredOnLong` | delivered | `'YYYY-MM-DD'` + long form | Derived in the prototype; could be derived from `timeline.delivered` in production. |
| `delayed` | (not in happy path) | boolean | Flips banner to warn tone with `DELAYED_BODY` copy. Surfaced by a separate "delay detected" event. |
| `statusMessage` | (not in happy path) | string | Overrides banner body only — for ad-hoc ops messages. |

## 9. Mocked vs production

What the prototype fakes that production will need to replace:

- **Timestamps as display strings.** Both `timeline.*` and `subTimeline.*` are pre-formatted (`'24 May · 8:30 AM'`). Production should emit ISO 8601 and format in the client based on the customer's locale and timezone.
- **`trackingUrl` is generic.** The prototype hardcodes `https://www.dhl.com/track`. `CourierBanner` separately hardcodes a known-good test shipment URL (see `CLAUDE.md` Gotchas) — production should template both.
- **No retries / failure events.** This journey is the happy path. Production also needs: customs hold, delivery attempt failed, address invalid, package lost, etc. None are in scope for this doc yet.
- **Sub-status timestamps are independent of the parent.** `subTimeline.arrived_destination` is set independently of `timeline.shipped`. Production should ensure consistency (sub-status timestamps must be ≥ parent status timestamp).

## 10. Open questions for engineering

1. **Event sourcing vs state mutation.** This doc describes the order resource as a single mutable record with timeline fields appended. Is production using event sourcing (immutable log) with the order resource as a projection, or direct mutation? The prototype's `apply(o)` model maps cleanly to either.
2. **Webhook authority.** For shipping sub-statuses, are we trusting DHL's webhook to define our sub-state, or normalising their events into our enum? `SHIPPING_SUB_STATUSES` is a Revibe enum — DHL emits many more granular events.
3. **Delayed detection.** Where does `delayed: true` come from — a SLA timer service, or operator marking? This doc doesn't cover it but it will need a transition node when journey mode grows.
4. **Webhook ordering & idempotency.** What's the contract for out-of-order or duplicate webhook deliveries? The prototype assumes strict linear order with no retries.

## 11. Source code references

- Journey definition: `src/data/journey.js`
- Journey hook: `src/lib/journey.js`
- Dev panel: `src/components/JourneyDevPanel.jsx`
- Wired in: `src/App.jsx` (`journeyMode` state + `?journey=1` URL param) and `src/components/Header.jsx` (mode badge).
- Enum sources: `src/lib/statuses.js` (`STATUSES`, `SHIPPING_SUB_STATUSES`, `ORDER_STATES`, `statusDescription`, `pickActiveOrderId`).
