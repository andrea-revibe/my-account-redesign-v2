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

For architectural rationale (chrome families, why certain choices), start at `docs/README.md` and follow into the per-feature doc. This is just the map.

- `src/App.jsx` — page composition; owns filter state and `claimFlowOrderId`. Routes orders to one of seven cards (see Card routing).
- `src/components/` — one component per file. `InProgressCard`, `OrderCard`, `PastOrderCard`, `ClaimCard` are the four baseline order-card variants; `DocsRejectedCard`, `PickupFailedCard`, and `InvalidClaimCard` are takeover variants that supersede `ClaimCard` when the claim is blocked on a single customer action (re-upload evidence / confirm new pickup / pay return shipping after an invalid claim). `ClaimDetailsSheet` is `ClaimCard`'s details sheet. `ClaimActionBanner` is a private child of `ClaimCard` rendered inside its expanded state when `claim.actionRequired` is set; the `See detailed tracking` dropdown (rendered when `claim.transitSubTimeline?.picked_up` is set) is a private helper inside `ClaimCard.jsx` itself. See `docs/output/returns/claim_tracking.md`. `WalletInfoTooltip` is shared anywhere "Revibe Wallet" is named — reuse it; it exports `REVIBE_WALLET_ICON`.
- `src/components/ClaimFlow/` — seven-step returns flow with two wired branches. `ClaimFlow.jsx` mounts conditionally (no `open` prop — unmounting is what resets state). `flowReducer.js` owns the state shape + per-step `canAdvance`. Details in `docs/output/returns/change_of_mind.md` and `docs/output/returns/issue.md`.
- `src/data/orders.js` — mock orders. Field documentation lives in `docs/output/orders.md` §7 (top-level + status + tracking + timeline + product), `docs/output/cancellations.md` §7 (cancellation + refund), and `docs/output/returns/claim_tracking.md` §5 (claim object).
- `src/lib/statuses.js` — single source of truth: statuses, sub-statuses, header chips, banner copy/tone, `pickActiveOrderId`.
- `src/lib/returns.js` — single source of truth for returns: eligibility, refund math, fee rate, `ISSUE_WALLET_BONUS`, window, `generateClaimRef`.
- `src/lib/claims.js` — single source of truth for `ClaimCard`: states, tone, copy helpers, `hasActiveClaim` / `isClaimRefunded`. Also hosts `CLAIM_TRANSIT_SUB_STATUSES` + `transitSubProgressIndex` (driving the `See detailed tracking` dropdown when `claim.transitSubTimeline?.picked_up` is set), `SUB_STATUS_LABELS` (customer-facing copy registry for each sub-status — kept for ops/internal references and any future inline surface), `CLAIM_SLAS` (SLA placeholders, used by the Step 4 "What happens next" timeline), and `actionGateCopy` (banner copy for the three action gates).
- `src/lib/events.js` — `getHistoryEvents(order, mode)` drives the `HistoryThread` on layered cards.
- `brief/` — source screenshots + design-system reference.
- `docs/` — see `docs/README.md` for the per-feature doc map. Split into `docs/input/` (operational state-machine specs transcribed from drawio source) and `docs/output/` (prototype / UI feature specs).
- `CHANGELOG.md` — change history, phase by phase.

## Mental models

One-liners. Expand each in the linked per-feature doc if you need the why.

- **Card routing.** `App.jsx` picks in order: `claim.docsRejection` → `DocsRejectedCard`; `claim.pickupFailure` → `PickupFailedCard`; `claim.invalidClaim` → `InvalidClaimCard`; `hasActiveClaim` → `ClaimCard` (In Progress); `isClaimRefunded` → `ClaimCard` (Past); else by `statusId`/`state`: `InProgressCard` (created/QC), `OrderCard` (shipped + in-flight cancelled), `PastOrderCard` (delivered without a claim, or cancelled-and-refunded). The first three are takeover cards — they replace `ClaimCard`'s surface while the claim is blocked on a single customer action and auto-cancels (or auto-closes) if ignored. Full tree in `docs/output/orders.md` §2.
- **Two-tier status.** `created → quality_check → shipped → delivered` drives the horizontal timeline. While `shipped`, `subStatusId` drives the vertical sub-timeline. No `delivered` sub-status. See `docs/output/orders.md` §4.
- **`state` is parallel to `statusId`.** `state` (`open`/`close`/`cancelled`) controls header chips, independent of progression. Cancelled orders keep the `statusId` they had at cancellation. Override: `delivered` always renders a green Delivered chip regardless of `state`.
- **Status banner tone resolution** (in `statusDescription(order)`):
  1. `state === 'cancelled'` → red "Refund in progress"
  2. `delayed === true` → orange "Taking longer than expected" (`OrderCard` only — `InProgressCard` keeps brand-purple for delayed QC, intentional product decision)
  3. otherwise → `STATUS_DESCRIPTIONS[statusId]` (or `shipped:{subStatusId}`)
  4. `statusMessage` overrides body only
- **Auto-expand.** Everything collapses by default. `pickActiveOrderId` returns the single most-in-flight order; only that card auto-expands. Delivered never expands. `ClaimCard` does not currently participate. See `docs/output/orders.md` §5.2.
- **Whole header is the tap target.** Chevrons on `OrderCard` / `InProgressCard` are decorative.
- **Returns flow.** Overlay launched from `Raise a claim` on the delivered `PastOrderCard`. State in one `useReducer`; no session persistence (closing unmounts). Two wired branches (`change_of_mind`, `issue`) diverge at Step 2; Steps 3–7 are shared. Eligibility + refund math in `src/lib/returns.js`. Chrome is deliberately checkout-style, **not** the order-card chrome family. See `docs/output/returns/change_of_mind.md` and `docs/output/returns/issue.md`.
- **History thread.** On layered cards (`ClaimCard`, cancelled `PastOrderCard` in `refund_pending` / `refunded`, `DeliveredOrderCard`), past events render as compact chips under the active hero; tapping a chip expands its detail inline (one open at a time). Derived in `src/lib/events.js` from `timeline` / `cancellationTimeline` / `cancellationRejection`. The active event lives in the hero and is excluded from the thread. Chip click handlers `stopPropagation` because the card header is one big tap target. See `docs/output/orders.md` §6.
- **Claim pipeline.** 5 states: `initiated` → `pickup` → `qc` → `refund_issued` → `refund_credited`. Tone progression warn (initiated/pickup/qc) → brand (refund_issued) → success (refund_credited). `hasActiveClaim` returns true while `claimStatusId !== 'refund_credited'`. Consolidated from 7 states in May 2026 — see `docs/output/returns/claim_tracking.md` §1.
- **Detailed claim tracking.** Two layers inside `ClaimCard`'s expanded state. `ClaimActionBanner` is the always-visible inline gate when `claim.actionRequired` is set (collection failed, missing documents, return-shipping payment). The Initiated-state hero carries a **scheduled-pickup strip** (CalendarClock + `scheduledPickup.date` + `scheduledPickup.slot`, MapPin + `pickupDetails.address`) — surfaces the courier window Revibe assigned alongside the address the customer submitted, only while `claimStatusId === 'initiated'`. `See detailed tracking` is an opt-in dropdown rendered between the dot strip and the history thread once `claim.transitSubTimeline.picked_up` is set — mirrors the outbound `HeroCard` dropdown in the light palette and uses the inverse-journey stops in `CLAIM_TRANSIT_SUB_STATUSES` (`picked_up` → `arrived_origin_hub` → `in_transit` → `arrived_revibe_hub`), with the current stop set by `claim.transitSubStatusId` and timestamps from `claim.transitSubTimeline`. Canonical reference: `docs/output/returns/claim_tracking.md` §2.2 + §2.3 + §4. Design history: `docs/output/claim_detailed_tracking.md`.
- **Invalid-claim ship-back.** When inspection determines a claim can't be approved, `InvalidClaimCard` takes over (danger tone) until the customer pays return shipping. Three internal demo states managed in-component: `action_needed` → `paid` (renders a fresh-order-style ETA hero + 4-step horizontal timeline driven by `claim.invalidClaim.returnShipment` — eyebrow becomes "Return from Claim RET-X" so lineage stays visible) or `declined` (muted "Claim closed — no refund" terminal with a warn-toned reversal CTA copy-locked to "I changed my mind and will pay for the shipment fee"). Inline edit mode on the delivery-details card via a "Change delivery details" button styled like `InProgressCard`'s "Change details". See `docs/output/returns/claim_tracking.md` §3.3.

## Conventions

- Default to **no comments**. Only write one when the *why* isn't obvious from the code.
- Component state stays in the component unless multiple components need it; lift to `App.jsx` and pass down (see filter state).
- New status / sub-status / state? Edit `src/lib/statuses.js` only — timeline, banner, header, chips are data-driven from there.
- Tailwind: prefer custom tokens (`brand`, `accent`, `success`, `progress`, `chip-*`, `searchBg`, `ink`, `muted`, `line`, `surface`) over arbitrary values. Slash-opacity (`bg-brand/10`) works on every token.
- "Need a screenshot for verification" → playwright at viewport 430×N, `deviceScaleFactor: 2`, `_snap.mjs` at the repo root.

## Gotchas

- **Tailwind name collisions.** `text-{name}` maps to either a fontSize or a color; defining `colors.page` and `fontSize.page` together silently produces white text. We've removed `colors.page`; don't reintroduce it. Same risk applies for any new token name.
- **Prototype links.** `CourierBanner` hardcodes the DHL Express tracking URL to a known-good test shipment (`tracking-id=3392654392`). Don't template it on `order.trackingNumber` — the demo orders have placeholder numbers that won't resolve.
- **Date filter is plumbed but inert.** All mock orders fall inside "Last 30 days," so the range dropdown has no visible effect.
- **Many things are visual placeholders.** Search, Wallet pill balance, profile menu, language toggle, "Download receipt" — all decorative. "Raise a claim" IS wired (launches the returns flow), but the warranty and compensation branches on Step 1 are stubbed and Step 6's submit doesn't persist. Per-feature mocked-vs-prod lists in each `docs/output/*.md`.

## Doc update protocol

Triage by change type — don't blanket-update everything:

| Change | Update |
|---|---|
| Order list, cards, auto-expand, status banner, courier tracking | `docs/output/orders.md` + `CHANGELOG.md` |
| Cancellation sheet, keep-my-order undo, refund-hero card | `docs/output/cancellations.md` + `CHANGELOG.md` |
| Change-of-mind returns flow | `docs/output/returns/change_of_mind.md` + `CHANGELOG.md` |
| Issue / wrong-device returns flow | `docs/output/returns/issue.md` + `CHANGELOG.md` |
| `ClaimCard`, takeover cards, sub-status / action gates, SLAs | `docs/output/returns/claim_tracking.md` + `CHANGELOG.md` |
| Warranty / compensation scoping (when wired) | `docs/output/warranties_compensations.md` + `CHANGELOG.md` |
| Operational state machine (drawio source) | `docs/input/return_flow_*.md` + the `.drawio` source file in lock-step |
| User-visible copy / style / microcopy only | `CHANGELOG.md` only |
| Internal refactor, no UX change | Neither |
| New convention, mental model, or gotcha | + this file (`CLAUDE.md`) |

Full doc map and conventions: `docs/README.md`. For `CHANGELOG.md`, add to the top `## Unreleased` block — flat bullets, one line per material change (no Added/Changed/Removed sub-buckets). The diff and the per-feature doc carry the detail; the bullet just names the change. Update repo `README.md` only if "Where things live" or "Scope reminder" needs adjustment.
