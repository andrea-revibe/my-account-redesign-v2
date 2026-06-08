# CLAUDE.md

Internal-demo prototype for the Revibe **My Account → Orders** area. Used to evaluate UX/visual changes before specifying them for production. Not a real product.

## Read first — `docs/code_map.md`

Before exploring the tree, read [`docs/code_map.md`](docs/code_map.md). It is the navigation + impact layer: a concept→file→line index (so you can do one targeted read instead of a fan-out search), a string-contract table (the coupling no import graph shows), and a generated dependency/blast-radius map. Locate what you need there, then read the specific slice. Regenerate the generated half with `npm run codemap` after structural changes. Prefer it over spawning an Explore agent for anything it already answers.

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

`docs/code_map.md` is the map: the *Module index* lists every export with its line, the *Where is X* table routes a concept to its module, and the coupling table holds the string contracts. Locate code there; the per-feature `docs/output/*` docs carry the "why". This section keeps only the top-level shape and the one mapping that has no other home.

- `src/App.jsx` — page composition + routing to one of eight cards (precedence in the **Card routing** model below). Owns filter state, the in-session `submittedClaims` map projected over `ORDERS`, and journey-mode state from `?journey=<id>`.
- `src/components/` — one component per file: four baseline order cards (`InProgressCard` / `OrderCard` / `PastOrderCard` / `ClaimCard`), four claim takeover cards (`DocsRejected` / `PickupFailed` / `ResetFailed` / `InvalidClaim`), `WarrantyClaimCard`, the returns flow under `ClaimFlow/`, and shared pieces. Per-card behaviour: `docs/output/returns/claim_tracking.md` + `warranties_compensations.md`.
- `src/data/` — thin barrels: mock orders (`orders/*`) and journey definitions (`journeys/*`). Field shapes: `orders.md` §7, `cancellations.md` §7, `claim_tracking.md` §5.
- `src/lib/` — sources of truth (`statuses` / `returns` / `claims` / `events` / `edd` / `eddSandbox` / `journey` / `devices`). Use the *Where is X* table in `code_map.md` to land on the right one.
- **Guided-reset device mapping** — `src/lib/devices.js` (canonical home, no separate doc). Two dimensions off `product.category_name ?? order.category_name` (falling back to `order.deviceOs`): `osForCategory` / `deviceOsForOrder` resolve `os` (`ios | android`, the iCloud-vs-Google split); `deviceTypeForCategory` / `deviceTypeForOrder` resolve the finer `device` (`iphone | ipad | mac | android` + the ambiguous `tablet`) that selects the guide's copy/steps/mocks/frame. Production categories: `iPhone` → iphone/ios, `Macbook` → mac/ios, `Samsung phone` → android, `Tablet` → **`tablet`** (OS-ambiguous — iPads + Android tablets share one category; `isOsAmbiguous(order)` true). The **only** manual input is Step 3's Apple/Android chooser for the ambiguous `Tablet` (preselects Apple/iPad), which sets `device` directly: Apple → `ipad`, Android → **`android_tablet`** (a dedicated tablet variant of the Samsung guide in `ResetGuideSheet`, rendered in the wide `MiniTablet` frame, distinct from `android` = Samsung phone). `Laptop` (Windows, distinct from `Macbook`) has no guide yet and falls back to the iPhone guide.
- `brief/` — source screenshots + design-system reference. `docs/` — see `docs/README.md` for the per-feature doc map (`input/` operational specs, `output/` UI specs).

## Mental models

One-liners. Expand each in the linked per-feature doc if you need the why.

- **Journey mode.** Opt-in alternate demo (`?journey=<id>`) replacing the eight-card showcase with one order replayed through a lifecycle via the floating `JourneyDevPanel`; multi-journey + branching live in the `JOURNEYS` array and `node.next: [...]`. Recipe + conventions: `docs/output/journey_backend_spec.md`.
- **Sandbox journeys.** Parameter-driven (not event-driven) journey variant: `kind: 'sandbox'` + `nodes: []`, paired with its own hook + panel (`useEddSandbox` / `EddSandboxPanel`), feeding the unchanged card-routing tree. Injects banner copy via `order.statusBanner: { tone, lead, body }` (a full override of `statusDescription`, unlike `statusMessage` which overrides body only). First example `dynamic_edd`. See `journey_backend_spec.md`.
- **Card routing.** `App.jsx` picks one of eight cards by precedence: four claim takeovers (`docsRejection` → `pickupFailure` → `resetFailed` → `invalidClaim`, chronological in the pipeline) → active warranty (`WarrantyClaimCard`) → `hasActiveClaim` (`ClaimCard`, also active compensation) → past variants (`isWarrantyDelivered` / `isClaimRefunded`) → status/state baselines (`InProgressCard` / `OrderCard` / `PastOrderCard`). Takeovers replace the baseline surface while a claim is blocked on one customer action; `WarrantyClaimCard` is a sibling, not a takeover. Full tree: `docs/output/diagrams.md#card-routing` + `orders.md` §2.
- **Two-tier status.** `created → quality_check → shipped → delivered` drives the horizontal timeline; while `shipped`, `subStatusId` drives the vertical sub-timeline (no `delivered` sub-status). `docs/output/orders.md` §4.
- **`state` is parallel to `statusId`.** `state` (`open`/`close`/`cancelled`) controls header chips independent of progression; a cancelled order keeps the `statusId` it had at cancellation. Override: `delivered` always shows a green Delivered chip.
- **Status banner tone resolution.** `statusDescription(order)` resolves tone in order: cancelled → red "Refund in progress"; `delayed` → orange "Taking longer than expected" (`OrderCard` only — delayed QC stays brand-purple); else `STATUS_DESCRIPTIONS[statusId]`. `statusMessage` overrides body only. Full table: `orders.md` §4.5.
- **Auto-expand.** Everything collapses by default; only `pickActiveOrderId`'s single most-in-flight order auto-expands, and only when no hero shows above it (`!showHero`). Delivered and `created`/`quality_check` never auto-expand; `ClaimCard` doesn't participate. `orders.md` §5.2.
- **Whole header is the tap target.** Chevrons on `OrderCard` / `InProgressCard` are decorative.
- **Returns flow.** Overlay launched from `Raise a claim` on a delivered `PastOrderCard`; one `useReducer`, no session persistence (closing unmounts). Four wired branches diverging at Step 2: `change_of_mind` / `issue` 8 steps, `warranty` 7 (skips refund-method), `compensation` 5 (skips device prep / packing / pickup, amount deferred, no ack gate) — driven by `visibleStepCount(claimType)` step-skips in `flowReducer.js`. **Flow-wide soft validation: the Continue/Submit button is never disabled** — clicking with a required input missing dispatches `ATTEMPT` and `stepError(state)` lights up the first unmet field inline (`InlineError`) instead of advancing; the flag is reducer-owned, cleared by every step-changing action. Submit calls `onSubmitClaim(orderId, claim)` to seed an in-session claim (cleared on refresh; undoable via `UndoSnackbar`). Checkout-style chrome, not the order-card family. See `docs/output/returns/change_of_mind.md`, `issue.md`, and `warranties_compensations.md` §2–3.
- **History thread.** On layered cards, past events render as compact chips under the active hero; tapping one expands its detail inline (one open at a time). Derived in `src/lib/events.js`; chip handlers `stopPropagation` because the header is one big tap target. `docs/output/orders.md` §6.
- **Claim pipeline.** 5 states `initiated → pickup → qc → refund_issued → refund_credited`, tone warn → brand → success; `hasActiveClaim` true until `refund_credited`. Compensation is a parallel 4-state chain (same ids minus Pickup), so tone/phase/predicate helpers apply unchanged. `docs/output/returns/claim_tracking.md` §1 + `warranties_compensations.md` §3.5.
- **Detailed claim tracking.** Inside `ClaimCard`'s expanded state: `ClaimActionBanner` (always-visible gate when `claim.actionRequired` is set), an Initiated-state scheduled-pickup strip (`scheduledPickup` + `pickupDetails.address`), and an opt-in `See detailed tracking` dropdown rendered once `claim.transitSubTimeline.picked_up` is set (`CLAIM_TRANSIT_SUB_STATUSES`). `docs/output/returns/claim_tracking.md` §2.2–2.3 + §4.
- **Invalid-claim ship-back.** `InvalidClaimCard` takes over (danger tone) until the customer pays return shipping; in-component states `action_needed → paid | declined`. A compensation invalid short-circuits to `CompensationClosedCard` (no ship-back gate). `docs/output/returns/claim_tracking.md` §3.3.
- **Reset-failed iCloud unlink.** `ResetFailedCard` takes over (danger tone) when QC hits Activation Lock, until the customer unlinks iCloud + shares their passcode; in-component states `action_needed → submitted` (copy is iOS-only). Submit is component-local — journey mode advances `claim_reset_details_received` via the dev panel, with a one-shot retry loop modelled. `docs/output/returns/claim_tracking.md` §3.4.
- **Warranty pipeline.** Sibling of the refund pipeline (`claim.type === 'warranty'` → `WarrantyClaimCard`). 6 states with a repair-and-ship-back tail (`under_repair → ship_back → device_returned`) replacing the refund chain — same device returns, no money moves; tone warn → brand → success. State-specific heroes; the `See detailed tracking` dropdown (gated on `claim.shipBack?.awb`) reuses outbound `SHIPPING_SUB_STATUSES`. `docs/output/warranties_compensations.md` §2; operational source `docs/input/return_flow_warranty.md`.

## Subagent discipline

- **Explore sparingly, seed it narrow.** `code_map.md` + targeted reads answer most "where is X". Spawn an `Explore`/`Plan` agent only for genuinely-unknown locations or broad sweeps — and when you do, **paste the relevant `code_map.md` rows into its prompt** (Module index lines, consumers, coupling rows) so it starts from a narrow frontier instead of re-discovering the structure.
- **Plan agents state blast radius.** Before proposing a multi-file change, look the target up in `code_map.md`'s *Shared-core consumers (blast radius)* + string-contract coupling tables and **list the affected files in the plan**. A `lib/` or `data/` signature change touches every consumer listed there.
- **Freshness is a command, not a sweep.** `npm run freshness` regenerates `code_map.md` and reports which `docs/output/*` docs have source changes since their `verified_against` marker. Run it weekly / ad-hoc; re-verify only the flagged docs and bump their marker. Don't audit docs that aren't flagged.

## Conventions

- Default to **no comments**. Only write one when the *why* isn't obvious from the code.
- Component state stays in the component unless multiple components need it; lift to `App.jsx` and pass down (see filter state).
- Reuse `WalletInfoTooltip` (exports `REVIBE_WALLET_ICON`) anywhere "Revibe Wallet" is named — don't re-roll the tooltip.
- New status / sub-status / state? Edit `src/lib/statuses.js` only — timeline, banner, header, chips are data-driven from there.
- Tailwind: prefer custom tokens (`brand`, `accent`, `success`, `progress`, `chip-*`, `searchBg`, `ink`, `muted`, `line`, `surface`) over arbitrary values. Slash-opacity (`bg-brand/10`) works on every token.
- "Need a screenshot for verification" → playwright at viewport 430×N, `deviceScaleFactor: 2`, `_snap.mjs` at the repo root.

## Gotchas

- **Tailwind name collisions.** `text-{name}` maps to either a fontSize or a color; defining `colors.page` and `fontSize.page` together silently produces white text. We've removed `colors.page`; don't reintroduce it. Same risk applies for any new token name.
- **Prototype links.** `CourierBanner` hardcodes the DHL Express tracking URL to a known-good test shipment (`tracking-id=3392654392`). Don't template it on `order.trackingNumber` — the demo orders have placeholder numbers that won't resolve.
- **Date filter is plumbed but inert.** All mock orders fall inside "Last 30 days," so the range dropdown has no visible effect.
- **Many things are visual placeholders.** Search, Wallet pill balance, profile menu, language toggle, "Download receipt" — all decorative. "Raise a claim" is wired for all four real branches (`change_of_mind`, `issue`, `warranty`, `compensation`). Submit seeds an in-session claim on the order (cleared on refresh, undoable via `UndoSnackbar`) — there's no backend, and seeding always lands on `initiated`. The `WarrantyClaimCard` has two hand-seeded mocks (89610 / 89580) exercising the `under_repair` / `ship_back` heroes; compensation has three (89630 under review, 89605 refunded, 89572 closed-invalid) for the surfaces submit-time seeding can't reach. Per-feature mocked-vs-prod lists in each `docs/output/*.md`.

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
| Journey mode (`?journey=<id>`), new journeys, branches, real-UI wiring | `docs/output/journey_backend_spec.md` (keep slim — see its **Editing this doc** section) + `CHANGELOG.md` |
| Operational state machine (drawio source) | `docs/input/return_flow_*.md` + the `.drawio` source file in lock-step |
| User-visible copy / style / microcopy only | `CHANGELOG.md` only |
| Internal refactor, no UX change | Neither |
| New/moved/renamed file or export, changed imports | run `npm run codemap` (regenerates `docs/code_map.md`); add a curated row if it's a new concept or string contract |
| New convention, mental model, or gotcha | + this file (`CLAUDE.md`) |

Full doc map and conventions: `docs/README.md`. For `CHANGELOG.md`, add to the top `## Unreleased` block — flat bullets, one line per material change (no Added/Changed/Removed sub-buckets). The diff and the per-feature doc carry the detail; the bullet just names the change. Update repo `README.md` only if "Where things live" or "Scope reminder" needs adjustment.
