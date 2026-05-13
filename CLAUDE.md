# CLAUDE.md

Internal-demo prototype for the Revibe **My Account → Orders** area. Used to evaluate UX/visual changes before specifying them for production. Not a real product.

## Where to work

App code lives at the repo root.

```sh
npm install
npm run dev      # http://localhost:5173 (Vite)
npm run build
```

The mobile frame is **430px wide**. Screenshots, tests, and visual checks should use that viewport.

## Stack

React 19 + Vite 8 · Tailwind 3 · lucide-react · Inter (Graphik substitute)

## Where things live

- `src/App.jsx` — page composition; owns filter state (`activeStatus`, `activeRange`) and computes `activeId` for the auto-expand rule. Routes orders to one of three cards (see Mental models → "Card routing"). Also owns `claimFlowOrderId` and conditionally mounts `<ClaimFlow />` above the account view.
- `src/components/` — one component per file. `OrderCard` contains its own sub-components (`SummaryHeader`, `ProductRow`, `OrderIdRow`). `InProgressCard` and `PastOrderCard` (delivered + cancelled-past variants) carry the newer "refund-hero family" chrome — share a left accent strip + `Order · #id` eyebrow + state pill row + tinted hero block + compact product row, differing in tone/headline/footer per state. `WalletInfoTooltip` is shared: anywhere "Revibe Wallet" is named (credits pill in `GreetRow`, refund option + confirm-step destination in `CancelOrderSheet`, refund option in `Step7RefundMethod`), reuse it instead of building another tooltip — it exports `REVIBE_WALLET_ICON` too.
- `src/components/ClaimFlow/` — the nine-step change-of-mind returns flow. Mounted conditionally by `App.jsx` (no `open` prop — conditional render is what resets state, since the brief forbids session persistence). `ClaimFlow.jsx` is the overlay shell; `flowReducer.js` owns the state shape + per-step `canAdvance` validation; one `StepN*.jsx` file per step. Visual chrome is deliberately checkout-style (white surface, segmented progress bar, sticky brand-purple action bar, line-bordered selection cards) — distinct from the order-card chrome family so the user feels they've entered a different *mode*. See Mental models → "Returns flow".
- `src/data/orders.js` — seven mock orders covering all states. Optional fields: `delayed: true` triggers the warn-tone status banner (`OrderCard` only — `InProgressCard` ignores it for the hero, see Mental models); `statusMessage: '…'` overrides the banner body; `estimatedDeliveryLong` / `deliveredOnLong` give the hero its long-form date headline. Returns-flow-only fields (`deliveredOn`, `unitPrice`, `paymentMethod`, `deviceOs`) are populated on the delivered iPhone 13 (`89657`) only — the one eligible order — and absent on the rest (which fall into "Not eligible" naturally).
- `src/lib/statuses.js` — single source of truth: top-level `STATUSES`, `SHIPPING_SUB_STATUSES`, `ORDER_STATES`, header chip overrides, status-banner copy + tone, `pickActiveOrderId(orders)`, and the `statusHeadline` / `statusSubline` / `statusIconFor` helpers.
- `src/lib/returns.js` — single source of truth for the returns flow: `eligibilityFor`, `groupOrdersByEligibility`, `refundBreakdown`, `generateClaimRef`, and formatting helpers. Edit eligibility rules / fee rate / window here.
- `brief/` — source screenshots and the design-system reference.
- `docs/my-account-flow.md` — living doc of the orders flow (product + eng audience).
- `CHANGELOG.md` — change history, phase by phase.

## Mental models worth knowing

**Card routing.** Three card components, picked in `App.jsx`:
- `InProgressCard` — non-cancelled `created` / `quality_check`. Brand-purple chrome, `Delivery by` ETA hero, `Cancel order` + `Change details` actions.
- `OrderCard` — non-cancelled `shipped`; in-flight cancelled mid-fulfilment. Older chrome (status icon + headline + sub-timeline + courier banner).
- `PastOrderCard` — `statusId === 'delivered'` (delivered branch, no expand) and `state === 'cancelled' && cancellationStatusId === 'refunded'` (cancelled-past refund-hero variant). Same component, two render branches based on `order.state`.

**Two-tier status.** Top-level progression (`created → quality_check → shipped → delivered`) drives the horizontal timeline. While `statusId === 'shipped'`, the order also carries a `subStatusId` that drives the vertical sub-timeline. There is intentionally no `delivered` sub-status.

**`state` is parallel to `statusId`.** `state` (`open` / `close` / `cancelled`) controls header chips and is independent of progression — a cancelled order keeps the `statusId` it had at cancellation. Override: when `statusId === 'delivered'`, `OrderCard` renders a green "Delivered" chip regardless of `state`.

**Status banner tone resolution** (in `statusDescription(order)`):
1. `state === 'cancelled'` → red "Refund in progress"
2. `delayed === true` → orange "Taking longer than expected" (body keyed by `statusId`)
3. otherwise → look up `STATUS_DESCRIPTIONS[statusId]` (or `shipped:{subStatusId}` when shipped)
4. `statusMessage` always overrides the body string only

The leading phrase describes **condition** (`On track`, `Arriving today`, `All done`), never the process step — that's already in the card header.

**Delayed QC keeps brand-purple in `InProgressCard`.** The `delayed: true` → warn tone above is honoured by `OrderCard` (shipped) but **not** by `InProgressCard` (created/QC). For QC, the hero stays brand-purple even when delayed; the only delay signal is the right-side tag swapping `Zap`/"On track" for `Clock`/"Taking longer than expected" (still brand-coloured) and the body sentence pulling delay-flavored copy from `DELAYED_BODY[statusId]`. Product decision — warn-amber felt overly alarming for a normal QC slowdown.

**Auto-expand rule.** Everything collapses by default. `pickActiveOrderId(orders)` returns the id of the single most-in-flight order (highest `progressIndex × 10 + subProgressIndex`); `App.jsx` passes `defaultExpanded` to that one card only. Returns `null` when nothing is in flight. The delivered card never expands (no chevron, no body); auto-expand only applies to `InProgressCard` / `OrderCard` / `PastOrderCard`'s cancelled branch.

**Whole header is the tap target.** On `OrderCard` and `InProgressCard`, the whole collapsed header — including the status banner / hero block — is one button. The chevron is decorative.

**Returns flow.** Nine-step overlay (`src/components/ClaimFlow/`) launched from the `Raise a claim` button on the delivered `PastOrderCard`. State lives in a single `useReducer` in `ClaimFlow.jsx`; per-step validation is `canAdvance(state, order)` in `flowReducer.js`. Three things to know: (1) **No session persistence** — closing the overlay unmounts the component (`App.jsx` renders it conditionally, not via an `open` prop), so reopening always starts fresh. (2) **Entry pre-seeds state** — `initialState(orderId)` lands the user at Step 2 with the originating order pre-selected and `claimType: 'change_of_mind'`; passing `null` (e.g. from a future top-level entry) starts at Step 1. (3) **Eligibility, refund math, and fee rate all live in `src/lib/returns.js`** — change them there, not in the step components. The flow's chrome is deliberately checkout-style and does NOT use the order-card chrome family (no accent strips, no eyebrows, no tinted hero blocks except the Step 5 warn callout). See `docs/my-account-flow.md` § 2.7.

## Conventions

- Default to **no comments**. Only write one when the *why* isn't obvious from the code (a hidden constraint, a non-trivial reason for an override).
- Component state stays in the component unless multiple components need it; lift to `App.jsx` and pass down (see filter state).
- New status / sub-status / state? Edit `src/lib/statuses.js` only. The timeline, banner, header, and chips are all data-driven from there.
- Tailwind: prefer the custom tokens (`brand`, `accent`, `success`, `progress`, `chip-*`, `searchBg`, `ink`, `muted`, `line`, `surface`) over arbitrary values. Slash-opacity (`bg-brand/10`) works on every token.
- "Need a screenshot for verification" → use the playwright snippet pattern from prior turns: viewport 430×N, `deviceScaleFactor: 2`, `_snap.mjs` at the repo root (must be inside the project so the `playwright` import resolves).

## Gotchas

- **Tailwind name collisions.** `text-{name}` maps to either a fontSize or a color; defining `colors.page` and `fontSize.page` together silently produces white text. We've removed `colors.page`; don't reintroduce it. Same risk applies for any new token name.
- **Prototype links.** `CourierBanner` hardcodes the DHL Express tracking URL to a known-good test shipment (`tracking-id=3392654392`). Don't template it on `order.trackingNumber` — the demo orders have placeholder numbers that won't resolve.
- **Date filter is plumbed but inert with current data.** All five mock orders fall inside "Last 30 days," so chip and range changes filter the list visibly only for the status chips, not the range dropdown.
- **Many things are visual placeholders.** Search field, Revibe Wallet pill (balance hardcoded; only the info tooltip is interactive), profile menu, language toggle, "Download receipt" — all decorative. "Raise a claim" on the delivered card IS wired (launches the returns flow), but the four non-change-of-mind branches on Step 1 are stubbed, and Step 8's submit doesn't persist. See `docs/my-account-flow.md` § "Mocked vs production gap" for the full list before assuming something is wired up.

## Doc update protocol

When you change behavior the user sees, update in this order:
1. **`docs/my-account-flow.md`** — the named section that's now stale (see § "How to keep this doc current").
2. **`CHANGELOG.md`** — add to the top `[Unreleased]` block.
3. **`README.md`** — only if "Where things live" or "Scope reminder" needs adjustment.
4. **CLAUDE.md** (this file) — only if conventions, mental models, or gotchas changed.
