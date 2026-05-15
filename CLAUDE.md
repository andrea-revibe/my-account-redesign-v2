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

For architectural rationale (chrome families, why certain choices), see `docs/my-account-flow.md`. This is just the map.

- `src/App.jsx` — page composition; owns filter state and `claimFlowOrderId`. Routes orders to one of four cards (see Card routing).
- `src/components/` — one component per file. `InProgressCard`, `OrderCard`, `PastOrderCard`, `ClaimCard` are the four order-card variants. `ClaimDetailsSheet` is `ClaimCard`'s details sheet. `WalletInfoTooltip` is shared anywhere "Revibe Wallet" is named — reuse it; it exports `REVIBE_WALLET_ICON`.
- `src/components/ClaimFlow/` — seven-step change-of-mind returns flow. `ClaimFlow.jsx` mounts conditionally (no `open` prop — unmounting is what resets state). `flowReducer.js` owns the state shape + per-step `canAdvance`. Details in `docs/my-account-flow.md` § 2.7.
- `src/data/orders.js` — mock orders. Optional fields (`delayed`, `statusMessage`, `claim`, returns-flow-only fields) documented in `docs/my-account-flow.md` § 4.
- `src/lib/statuses.js` — single source of truth: statuses, sub-statuses, header chips, banner copy/tone, `pickActiveOrderId`.
- `src/lib/returns.js` — single source of truth for returns: eligibility, refund math, fee rate, window.
- `src/lib/claims.js` — single source of truth for `ClaimCard`: states, tone, copy helpers, `hasActiveClaim` / `isClaimRefunded`.
- `brief/` — source screenshots + design-system reference.
- `docs/my-account-flow.md` — living doc of the orders flow (product + eng).
- `CHANGELOG.md` — change history, phase by phase.

## Mental models

One-liners. Expand each in `docs/my-account-flow.md` if you need the why.

- **Card routing.** `App.jsx` picks in order: `hasActiveClaim` → `ClaimCard` (In Progress); `isClaimRefunded` → `ClaimCard` (Past); else by `statusId`/`state`: `InProgressCard` (created/QC), `OrderCard` (shipped + in-flight cancelled), `PastOrderCard` (delivered without a claim, or cancelled-and-refunded).
- **Two-tier status.** `created → quality_check → shipped → delivered` drives the horizontal timeline. While `shipped`, `subStatusId` drives the vertical sub-timeline. No `delivered` sub-status.
- **`state` is parallel to `statusId`.** `state` (`open`/`close`/`cancelled`) controls header chips, independent of progression. Cancelled orders keep the `statusId` they had at cancellation. Override: `delivered` always renders a green Delivered chip regardless of `state`.
- **Status banner tone resolution** (in `statusDescription(order)`):
  1. `state === 'cancelled'` → red "Refund in progress"
  2. `delayed === true` → orange "Taking longer than expected" (`OrderCard` only — `InProgressCard` keeps brand-purple for delayed QC, intentional product decision)
  3. otherwise → `STATUS_DESCRIPTIONS[statusId]` (or `shipped:{subStatusId}`)
  4. `statusMessage` overrides body only
- **Auto-expand.** Everything collapses by default. `pickActiveOrderId` returns the single most-in-flight order; only that card auto-expands. Delivered never expands.
- **Whole header is the tap target.** Chevrons on `OrderCard` / `InProgressCard` are decorative.
- **Returns flow.** Overlay launched from `Raise a claim` on the delivered `PastOrderCard`. State in one `useReducer`; no session persistence (closing unmounts). Pre-seeded to `change_of_mind` so Step 1 advances straight to Step 2. Eligibility + refund math in `src/lib/returns.js`. Chrome is deliberately checkout-style, **not** the order-card chrome family.
- **History thread.** On layered cards (`ClaimCard`, cancelled `PastOrderCard` in `refund_pending` / `refunded`), past events render as compact chips under the active hero; tapping a chip expands its detail inline (one open at a time). Derived in `src/lib/events.js` from `timeline` / `cancellationTimeline` / `cancellationRejection`. The active event lives in the hero and is excluded from the thread. Chip click handlers `stopPropagation` because the card header is one big tap target.

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
- **Many things are visual placeholders.** Search, Wallet pill balance, profile menu, language toggle, "Download receipt" — all decorative. "Raise a claim" IS wired (launches the returns flow), but the four non-change-of-mind branches on Step 1 are stubbed and Step 6's submit doesn't persist. Full list: `docs/my-account-flow.md` § "Mocked vs production gap".

## Doc update protocol

Triage by change type — don't blanket-update everything:

| Change | Update |
|---|---|
| Behaviour change (new component, state shape, eligibility/refund logic, status logic, routing) | `docs/my-account-flow.md` + `CHANGELOG.md` |
| User-visible copy / style / microcopy only | `CHANGELOG.md` only |
| Internal refactor, no UX change | Neither |
| New convention, mental model, or gotcha | + this file (`CLAUDE.md`) |

For `docs/my-account-flow.md`, edit the named section that's now stale (see § "How to keep this doc current"). For `CHANGELOG.md`, add to the top `[Unreleased]` block — keep bullets to 1–2 sentences; the diff shows what changed, the bullet just names it. Update `README.md` only if "Where things live" or "Scope reminder" needs adjustment.
