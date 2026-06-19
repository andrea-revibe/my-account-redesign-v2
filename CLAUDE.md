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
- `src/lib/` — sources of truth (`statuses` / `returns` / `claims` / `events` / `edd` / `eddSandbox` / `journey` / `devices` / `countries` / `wallet`). Use the *Where is X* table in `code_map.md` to land on the right one.
- **Guided reset (Step 3 device prep)** — `src/lib/devices.js` maps `category_name` → two dimensions (`os`, `device`) that select one of five guide variants in `ResetGuideSheet`; the OS-ambiguous `Tablet` is the only manual input (Step 3 Apple/Android chooser). Full spec incl. variants/frames/remote route: `docs/output/returns/guided_reset.md`.
- `brief/` — source screenshots + design-system reference. `docs/` — see `docs/README.md` for the per-feature doc map (`input/` operational specs, `output/` UI specs).

## Mental models

**This section is the always-on context tax — keep it lean.** A line earns a place here only if all three hold: it's **cross-task** (applies regardless of which feature you touch), it's a **trap** (the model gets it wrong without it), and it's **not discoverable** from `code_map.md` + one targeted read. Feature *mechanics* fail the last test — they live in `docs/output/*`; here they get at most a one-line pointer carrying the single non-obvious claim. Open the linked doc when a task touches that feature; don't re-summarize it here.

**Cross-cutting invariants** (the traps that apply to most card/flow work):

- **Card routing.** `App.jsx` picks one of eight cards by precedence: claim takeovers (`docsRejection → pickupFailure → resetFailed → invalidClaim`) → `WarrantyClaimCard` (sibling, not takeover) → `hasActiveClaim` (`ClaimCard`, incl. active compensation) → past (`isWarrantyDelivered` / `isClaimRefunded`) → baselines (`InProgressCard` / `OrderCard` / `PastOrderCard`). Full tree: `docs/output/diagrams.md#card-routing` + `orders.md` §2.
- **Two-tier status.** `created → quality_check → shipped → delivered` drives the horizontal timeline; while `shipped`, `subStatusId` drives the vertical sub-timeline (no `delivered` sub-status). `orders.md` §4.
- **`state` is parallel to `statusId`.** `state` (`open`/`close`/`cancelled`) controls header chips independent of progression; a cancelled order keeps the `statusId` it had at cancellation. Override: `delivered` always shows a green chip.
- **Status banner tone.** `statusDescription(order)` resolves: cancelled → red; `delayed` → orange; else `STATUS_DESCRIPTIONS[statusId]`. `statusMessage` overrides body only; `statusBanner` overrides the whole banner. Full table: `orders.md` §4.5.
- **Auto-expand.** All collapsed by default; only `pickActiveOrderId`'s most-in-flight order auto-expands, and only when `!showHero`. Delivered / `created` / `quality_check` / `ClaimCard` never participate. `orders.md` §5.2.
- **Whole header is the tap target.** Chevrons on `OrderCard` / `InProgressCard` are decorative.
- **Returns soft validation.** Continue/Submit is **never disabled**; clicking with a required field missing dispatches `ATTEMPT` and `stepError(state)` lights the first unmet field (`InlineError`) instead of advancing. Reducer-owned, cleared by every step-changing action.

**Feature pointers** (one line — open the doc for mechanics):

- **Claim pipeline.** 5 states `initiated → pickup → qc → refund_issued → refund_credited`, tone warn→brand→success; `hasActiveClaim` until `refund_credited`. Compensation = parallel 4-state chain (minus Pickup). `claim_tracking.md` §1 + `warranties_compensations.md` §3.5.
- **Warranty pipeline.** Sibling (`claim.type === 'warranty'` → `WarrantyClaimCard`): 6 states with a repair tail (`under_repair → ship_back → device_returned`) replacing the refund chain — device returns, no money moves. `warranties_compensations.md` §2.
- **Returns flow.** Overlay from `Raise a claim` on a delivered `PastOrderCard`; one `useReducer`, string-key steps walking `STEP_SEQUENCES[claimType]`. **Trap:** the shared `'reason'` step is the authoritative router (`routeForReason`) — a mismatch opens `SwitchFlowSheet` (no "continue anyway") so a faulty device never proceeds down the change-of-mind track. `change_of_mind.md`, `issue.md`, `warranties_compensations.md` §2–3.
- **Cancel claim.** `canCancelClaim(claim)` gates a `Cancel claim` footer through `initiated`/`pickup`/`qc`. **Fork:** `cancelNeedsShipBack(claim)` → clean revert (pre-pickup + all compensation; strips to `PastOrderCard`, undoable) vs ship-back (device collected → `invalidClaim` gate, `reason: 'cancelled'`). `claim_tracking.md` §2.8.
- **Invalid-claim ship-back.** `InvalidClaimCard` = "device at Revibe, pay return shipping," keyed by `claim.invalidClaim`; `.reason` discriminates `'invalid'` (QC verdict) vs `'cancelled'` (cancel post-collection). `claim_tracking.md` §3.3.
- **Detailed claim tracking.** Inside `ClaimCard` expanded: `ClaimActionBanner` gate, Initiated scheduled-pickup strip, opt-in `See detailed tracking` dropdown (gated on `claim.transitSubTimeline.picked_up`). `claim_tracking.md` §2.2–2.3.
- **Reset-failed iCloud unlink.** `ResetFailedCard` takes over (danger) on Activation Lock until iCloud unlink + passcode; states `action_needed → submitted`, iOS-only copy. `claim_tracking.md` §3.4.
- **History thread.** On layered cards, past events render as compact chips under the hero; tap expands one inline. Derived in `lib/events.js`. `orders.md` §6.
- **Journey mode.** Opt-in demo (`?journey=<id>`) replaying an order via `JourneyDevPanel`; multi-journey + branching in `JOURNEYS` / `node.next`. Replay panels stack a `JourneyNotificationPanel`; copy is event-keyed data in `data/notifications/*` — one event → one copy unless `variantBy` selects a `variants` set by an order field. Each entry has a coverage `status` (`live`/`new`/`changed`/`missing`/`silent`-default) → badge + roll-up. `journey_backend_spec.md`.
- **Sandbox journeys.** Parameter-driven journey variant (`kind: 'sandbox'`, `nodes: []`) with `useEddSandbox` / `EddSandboxPanel`; injects `order.statusBanner` only for SLA-divergence messages. `journey_backend_spec.md`.
- **Country split.** Orthogonal dimension, not a journey/component fork: `order.country` (`AE`/`ZA`/`SA`/`Others`, default AE) → `countryConfig` flags (`lib/countries.js`) gate shared cards; sequence forks use per-edge `next` country tags (`{id,countries}`) filtered in `validNext`; `CountryPicker` / `?country=` selects it. `country_split.md`.
- **Order↔claim linkage.** Every claim card wraps in shared `OrderClaimLink` — a one-open accordion pairing the real order half (top) and the claim/cancellation half (bottom) on a measured connector rail; the collapsed half is a `View ▸` compact row (tapping flips the accordion), and refs render typed via `formatClaimRef` (`RET`/`WAR`/`CMP`/`CXL`). `OriginalOrderSheet` is retired — the expanded `PastOrderCard` is the only order surface. `claim_tracking.md` §10.
- **Revibe Wallet.** `GreetRow` pill / card wallet chip → `WalletSheet`; `lib/wallet.js` ledger = seed (`data/wallet.js`) + live refund (`journeyMode ? projectedOrders : []`), live pinned above seed. **Trap:** Move-to-card re-applies the waived deduction (zero for Revibe/compensation), latest refund only — funds-gated, no cascade, undoable. `wallet.md`.

## Subagent discipline

- **Explore sparingly, seed it narrow.** `code_map.md` + targeted reads answer most "where is X". Spawn an `Explore`/`Plan` agent only for genuinely-unknown locations or broad sweeps — and when you do, **paste the relevant `code_map.md` rows into its prompt** (Module index lines, consumers, coupling rows) so it starts from a narrow frontier instead of re-discovering the structure.
- **Plan agents state blast radius.** Before proposing a multi-file change, look the target up in `code_map.md`'s *Shared-core consumers (blast radius)* + string-contract coupling tables and **list the affected files in the plan**. A `lib/` or `data/` signature change touches every consumer listed there.
- **Freshness is a command, not a sweep.** `npm run freshness` regenerates `code_map.md` and reports which `docs/output/*` docs have source changes since their `verified_against` marker. Run it weekly / ad-hoc; re-verify only the flagged docs and bump their marker. Don't audit docs that aren't flagged.

## Conventions

- Default to **no comments**. Only write one when the *why* isn't obvious from the code.
- Component state stays in the component unless multiple components need it; lift to `App.jsx` and pass down (see filter state).
- Reuse `WalletInfoTooltip` (exports `REVIBE_WALLET_ICON`) anywhere "Revibe Wallet" is named — don't re-roll the tooltip.
- Reuse `ProductSummary` (`tone="light" | "hero"`, exports `REVIBE_CARE_ICON`) anywhere a product line-item (thumbnail · name · variant · Revibe Care callout · price breakdown) is shown — don't re-roll the row or re-declare the Care icon. It owns the row but not the expand chevron (the card owns the tap target). Design: `docs/handoff/product-summary/design.md`.
- Reuse `Timeline` (`src/components/Timeline.jsx`) for **every** step/milestone timeline — there is exactly one. Props `{ orientation: 'horizontal'|'vertical', tone: 'brand'|'warn'|'success'|'danger', steps:[{id,label,short?,shortLabel?}], currentIndex, stamps, dense, onDark, complete, frozen, toneForStep }`. States: completed (`i<currentIndex`) = filled tone dot + check; current = hollow toned ring + a ¾ pulsing "in-transit" connector; future = grey hollow; reaching the last step renders it completed (no pulse). `onDark` = white palette for `HeroCard`'s gradient; `complete` = force all-done; `frozen` = a stopped marker (cancelled point, solid dot, no pulse/¾); `toneForStep(i,state)` = per-step tone (the cancellation danger-chain → success `refunded` terminal). Don't re-roll a dot strip anywhere. Design: `docs/handoff/timeline/design.md`; pulse keyframes (`timelinePulse`/`timelineConnPulse`, motion-reduce-safe) live in `tailwind.config.js`.
- Reuse `ReturnShipmentTracking` (`src/components/ReturnShipmentTracking.jsx`, props `{ ship }` where `ship` has `{ courier, awb, subStatusId, subTimeline }`) for the **return leg** (Revibe → customer) `See detailed tracking` dropdown — it's the single source of truth shared by `WarrantyClaimCard`'s ship-back (`claim.shipBack`) and `InvalidClaimCard`'s paid state (`claim.invalidClaim.returnShipment`). It also exports the reusable `CourierStrip` (DHL chip + courier + copyable AWB); the milestone rows inside it render via the shared `Timeline` (vertical, `dense`). Don't re-roll either. The inbound leg (customer → Revibe) is a separate neutral-chrome dropdown that uses `CLAIM_TRANSIT_SUB_STATUSES` (also a `dense` vertical `Timeline`) and is gated to the pre-return window.
- Reuse `OrderClaimLink` (`src/components/OrderClaimLink.jsx`, props `{ order, defaultOpen, children }`) to give any claim-card-family member its order linkage — wrap each `<article>` return; it owns the order↔claim accordion (order half + claim half + connector rail + compact rows), so don't re-roll them. Render every claim ref through `formatClaimRef(claim)` (`lib/claims.js`) — never hardcode a `RET-` prefix (the takeover-card eyebrows used to). Design: handoff bundle `Order-Claim ID Pairing`; spec `claim_tracking.md` §10.
- Reuse `RefundSplitRows` (`src/components/RefundSplitRows.jsx`, props `{ order, net, showTotal?, caption?, onDark?, className? }`) anywhere a refund amount renders on the **original-payment** path — it shows the card-portion + gift-card (store-credit) destination rows for a split-paid order (`order.paymentSplit = { card, giftCard }`) and renders nothing otherwise, so drop it in unconditionally. Split math is `refundDestinations(order, net)` in `lib/returns.js`; the gift-card portion returns to the Wallet (`lib/wallet.js`). Don't re-roll the rows. Spec: `orders.md` §7.1, `wallet.md`.
- **Notification copy is owner-only.** Never add, edit, or remove entries in `src/data/notifications/*` (the customer-facing WhatsApp/email strings) — only Andrea touches that content. You may wire a node to a new `event` (an unauthored event resolves to a `silent` notification); leave authoring the copy to the owner.
- New status / sub-status / state? Edit `src/lib/statuses.js` only — timeline, banner, header, chips are data-driven from there.
- Tailwind: prefer custom tokens (`brand`, `accent`, `success`, `progress`, `chip-*`, `searchBg`, `ink`, `muted`, `line`, `surface`) over arbitrary values. Slash-opacity (`bg-brand/10`) works on every token.
- "Need a screenshot for verification" → there's no checked-in harness; write a throwaway playwright script at viewport 430×N, `deviceScaleFactor: 2`, or verify manually in the running dev server.

## Gotchas

- **Tailwind name collisions.** `text-{name}` maps to either a fontSize or a color; defining `colors.page` and `fontSize.page` together silently produces white text. We've removed `colors.page`; don't reintroduce it. Same risk applies for any new token name.
- **Prototype links.** `CourierBanner` hardcodes the DHL Express tracking URL to a known-good test shipment (`tracking-id=3392654392`). Don't template it on `order.trackingNumber` — the demo orders have placeholder numbers that won't resolve.
- **Many things are visual placeholders.** Search, profile menu, language toggle, "Download receipt" — all decorative. (The Wallet pill is now live — derived balance + `WalletSheet`; see `wallet.md`.) "Raise a claim" is wired for all four real branches (`change_of_mind`, `issue`, `warranty`, `compensation`). Submit seeds an in-session claim on the order (cleared on refresh, undoable via `UndoSnackbar`) — there's no backend, and seeding always lands on `initiated`. The `WarrantyClaimCard` has two hand-seeded mocks (89610 / 89580) exercising the `under_repair` / `ship_back` heroes; compensation has three (89630 under review, 89605 refunded, 89572 closed-invalid) for the surfaces submit-time seeding can't reach. Per-feature mocked-vs-prod lists in each `docs/output/*.md`.

## Doc update protocol

Triage by change type — don't blanket-update everything:

| Change | Update |
|---|---|
| Order list, cards, auto-expand, status banner, courier tracking | `docs/output/orders.md` + `CHANGELOG.md` |
| Cancellation sheet, keep-my-order undo, refund-hero card | `docs/output/cancellations.md` + `CHANGELOG.md` |
| Change-of-mind returns flow | `docs/output/returns/change_of_mind.md` + `CHANGELOG.md` |
| Issue / wrong-device returns flow | `docs/output/returns/issue.md` + `CHANGELOG.md` |
| `ClaimCard`, takeover cards, sub-status / action gates, SLAs | `docs/output/returns/claim_tracking.md` + `CHANGELOG.md` |
| Guided reset — `lib/devices.js` mapping, `ResetGuideSheet` variants, `Step3DevicePrep` | `docs/output/returns/guided_reset.md` + `CHANGELOG.md` |
| Warranty / compensation scoping (when wired) | `docs/output/warranties_compensations.md` + `CHANGELOG.md` |
| Journey mode (`?journey=<id>`), new journeys, branches, real-UI wiring | `docs/output/journey_backend_spec.md` (keep slim — see its **Editing this doc** section) + `CHANGELOG.md` |
| Country split — `lib/countries.js` flags, country-gated cards, `CountryPicker`, per-edge journey `next` country tags | `docs/output/country_split.md` + `CHANGELOG.md` |
| Revibe Wallet — `lib/wallet.js` ledger/deduction math, `data/wallet.js` seed, `WalletSheet`, `GreetRow` pill, Move-to-card | `docs/output/wallet.md` + `CHANGELOG.md` |
| Operational state machine (drawio source) | `docs/input/return_flow_*.md` + the `.drawio` source file in lock-step |
| User-visible copy / style / microcopy only | `CHANGELOG.md` only |
| Internal refactor, no UX change | Neither |
| New/moved/renamed file or export, changed imports | run `npm run codemap` (regenerates `docs/code_map.md`); add a curated row if it's a new concept or string contract |
| New convention, mental model, or gotcha | + this file (`CLAUDE.md`) — **as a one-line pointer, not a paragraph.** A mental model gets the non-obvious claim/trap + a `docs/output/*` link; the mechanics live in the doc. Adding a line means checking whether an existing one can collapse (apply the cross-task / trap / not-discoverable test in the Mental models intro). `npm run freshness` flags and fails if any bullet exceeds one line or the section blows its char budget. |

Full doc map and conventions: `docs/README.md`. For `CHANGELOG.md`, add to the top `## Unreleased` block — flat bullets, one line per material change (no Added/Changed/Removed sub-buckets). The diff and the per-feature doc carry the detail; the bullet just names the change. (You don't roll these up — releases happen via git merge outside this loop; `/doc-compact` later uses `git blame` to move committed bullets into dated sections and `npm run freshness` flags when that's overdue.) Update repo `README.md` only if "Where things live" or "Scope reminder" needs adjustment.
