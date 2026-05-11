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

- `src/App.jsx` — page composition; owns filter state (`activeStatus`, `activeRange`) and computes `activeId` for the auto-expand rule.
- `src/components/` — one component per file. `OrderCard` contains its own sub-components (`SummaryHeader`, `ProductRow`, `OrderIdRow`).
- `src/data/orders.js` — five mock orders covering all states. Optional fields: `delayed: true` triggers the warn-tone status banner; `statusMessage: '…'` overrides the banner body.
- `src/lib/statuses.js` — single source of truth: top-level `STATUSES`, `SHIPPING_SUB_STATUSES`, `ORDER_STATES`, header chip overrides, status-banner copy + tone, `pickActiveOrderId(orders)`, and the `statusHeadline` / `statusSubline` / `statusIconFor` helpers.
- `brief/` — source screenshots and the design-system reference.
- `docs/my-account-flow.md` — living doc of the orders flow (product + eng audience).
- `CHANGELOG.md` — change history, phase by phase.

## Mental models worth knowing

**Two-tier status.** Top-level progression (`created → quality_check → shipped → delivered`) drives the horizontal timeline. While `statusId === 'shipped'`, the order also carries a `subStatusId` that drives the vertical sub-timeline. There is intentionally no `delivered` sub-status.

**`state` is parallel to `statusId`.** `state` (`open` / `close` / `cancelled`) controls header chips and is independent of progression — a cancelled order keeps the `statusId` it had at cancellation. Override: when `statusId === 'delivered'`, `OrderCard` renders a green "Delivered" chip regardless of `state`.

**Status banner tone resolution** (in `statusDescription(order)`):
1. `state === 'cancelled'` → red "Refund in progress"
2. `delayed === true` → orange "Taking longer than expected" (body keyed by `statusId`)
3. otherwise → look up `STATUS_DESCRIPTIONS[statusId]` (or `shipped:{subStatusId}` when shipped)
4. `statusMessage` always overrides the body string only

The leading phrase describes **condition** (`On track`, `Arriving today`, `All done`), never the process step — that's already in the card header.

**Auto-expand rule.** Everything collapses by default. `pickActiveOrderId(orders)` returns the id of the single most-in-flight order (highest `progressIndex × 10 + subProgressIndex`); `App.jsx` passes `defaultExpanded` to that one card only. Returns `null` when nothing is in flight.

**`OrderCard` tap target.** The whole collapsed header — including the status banner — is one button. The chevron is decorative.

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
- **Many things are visual placeholders.** Search field, store-credits card, profile menu, language toggle, "Download receipt", "Raise a claim" — all decorative. See `docs/my-account-flow.md` § "Mocked vs production gap" for the full list before assuming something is wired up.

## Doc update protocol

When you change behavior the user sees, update in this order:
1. **`docs/my-account-flow.md`** — the named section that's now stale (see § "How to keep this doc current").
2. **`CHANGELOG.md`** — add to the top `[Unreleased]` block.
3. **`README.md`** — only if "Where things live" or "Scope reminder" needs adjustment.
4. **CLAUDE.md** (this file) — only if conventions, mental models, or gotchas changed.
