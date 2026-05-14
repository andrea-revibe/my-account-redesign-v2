# Changelog

Internal demo project. Format roughly follows [Keep a Changelog](https://keepachangelog.com/).

## [Unreleased] — phase 18 (refund-timeline anchor parity)

### Changed

- **Step 5 + Step 7 refund-timeline copy anchored to `once return is complete`.** Both refund cards (Step 5) and both timeline strings (Step 7) now end in the same phrase verbatim — fixes the implicit ambiguity that the card clock starts at submit.
- **Step 5 original-payment card: dropped the ETA pill chrome** in favour of plain `Clock` icon + inline text, matching the wallet card's treatment. `whitespace-nowrap` on both lines keeps them single-line at 430px.

### Notes

- `docs/my-account-flow.md` § 2.7 updated for the new wording + dropped pill.

## [Unreleased] — phase 17 (Step 5 refund picker aligned with cancellation)

### Changed

- **Step 5 refund picker visually + behaviourally mirrors the cancellation sheet.** Wallet card: `Recommended` pill removed, success-green tagline carries the recommendation. Original-payment card: inline breakdown table (`Product` + `Revibe Care` when present + `Subtotal` + red `Restocking fee (10%)`) below the headline, ETA pill underneath.
- **`refundBreakdown(order, units, method)` in `src/lib/returns.js` now refunds Revibe Care.** Return shape: `{ itemTotal, warranty, gross, fee, net, rate }` with `gross = itemTotal + warranty`; the 10% fee applies to warranty-inclusive gross. Bumps the eligible iPhone 13 (`89657`) refund: AED 939 → 1,029 wallet, 845.10 → 926.10 card.

### Notes

- Seeded claim on `89219` `expectedRefund` recomputed to `{ itemTotal: 519, warranty: 60, gross: 579, fee: 57.9, net: 521.1, rate: 0.10 }`. `ClaimCard` / `ClaimDetailsSheet` read fields directly — no component changes.
- `docs/my-account-flow.md` § 2.7 (Step 5 + refund math) updated.

## [Unreleased] — phase 16 (Step 4 → pickup address & contact)

### Changed

- **Step 4 of the returns flow is now `Pickup address & contact`** instead of `How will you return it?`. The three method options (Courier pickup, Drop-off, In-store) are gone — courier pickup is the only supported path today, so the step instead surfaces the three contact fields the courier needs: delivery address, email, and phone. Each row shows the seeded value from the order and opens a single-field bottom sheet on tap for editing; the bottom-sheet pattern matches `CancelOrderSheet` / `ClaimDetailsSheet`. A brand-tinted `Courier pickup · Pickup within 2 business days` banner sits above the rows so the method is still made explicit. `canAdvance` for the step now requires all three fields non-empty.
- **State slice renamed `returnMethod` → `pickupDetails`.** Shape was `{ id, address }`, now `{ address, email, phone }`. The reducer's `SET_RETURN_METHOD` action is renamed to `SET_PICKUP_DETAILS`. `initialState(orderId)` now imports `ORDERS` so it can pre-seed the slice from `order.address` / `order.email` / `order.phone`.
- **`Step6Review`'s `Return method` section → `Pickup details`.** Replaced the single-line method label with three icon-prefixed rows (address / email / phone). The `Edit` link still jumps back to Step 4 via `GO_TO_STEP`.
- **`ClaimDetailsSheet`'s `Return method` row → three rows (`Pickup address` / `Pickup email` / `Pickup phone`).** `RETURN_METHOD_LABELS` removed from `src/lib/claims.js` (was only consumed here and by the now-removed Step6 local map).

### Added

- **`email` field on every order in `src/data/orders.js`.** Set to `andrea.grossi@example.com` for all eight orders so the new Step 4 has a real value to display. Documented alongside `phone` and `address` in `docs/my-account-flow.md` § 4.1.

### Renamed

- `Step4ReturnMethod.jsx` → `Step4PickupDetails.jsx`. `ClaimFlow.jsx` import + step-router updated.

### Notes

- The seeded claim on order `89219` was updated from `returnMethod: { id: 'courier', address }` to `pickupDetails: { address, email, phone }` so it stays consistent with the new shape — the `ClaimCard` for that order keeps rendering the same way.
- `docs/my-account-flow.md` § 2.7 / § 4.1 / § 4.8 / § 5.1 updated.

## [Unreleased] — phase 15 (returns-flow simplification)

### Changed

- **Returns flow is now seven steps instead of nine.** Old Step 2 (order selection) and Step 3 (product & quantity) are gone — the flow now goes `Claim type → Reason → Device prep → Return method → Refund method → Review → Confirmation`. Rationale: the delivered card is product-specific (the future multi-product order shape will render one delivered card per product line — see `docs/my-account-flow.md` § 8 "Multi-item orders"), so the item being returned is already named by the entry point. Order selection and per-line quantity inside the flow were re-asking a question the user had implicitly already answered.
- **The flow always starts at Step 1.** Previously `initialState(initialOrderId)` started the user at Step 2 (order picker) when an order was passed in, and only fell back to Step 1 for a hypothetical top-level entry. Now Step 1 is always shown; the `claimType` is still pre-seeded to `'change_of_mind'` from a delivered-card entry so confirming Step 1 lands the user directly on the reason step.
- **`Step6Review` (renamed from `Step8Review`) gains a read-only `Item` block.** Since there's no longer an explicit order/product step the user can `Edit` back to, the item being returned is shown at the top of the review as context, not as an editable section. The remaining five `Section` blocks (Reason / Device preparation / Return method / Refund) still expose per-section `Edit` links via `GO_TO_STEP`.

### Removed

- **`Step2OrderSelection.jsx` and `Step3ProductQuantity.jsx`.** Deleted. Their state in the reducer (`SET_ORDER`, `SET_UNITS` actions) is also gone — `units` stays in state pinned at `1` so `refundBreakdown(order, units, method)` keeps its multi-unit-ready signature. The `groupOrdersByEligibility` helper in `src/lib/returns.js` is currently unused but kept for the eventual top-level "Return an item" entry (§ 8).
- **`canAdvance(state, order)` second argument.** The only branch that read `order` was Step 3's quantity check. Signature is now `canAdvance(state)`.

### Renamed

- Step files renumbered to match their new position: `Step4Reason → Step2Reason`, `Step5DevicePrep → Step3DevicePrep`, `Step6ReturnMethod → Step4ReturnMethod`, `Step7RefundMethod → Step5RefundMethod`, `Step8Review → Step6Review`, `Step9Confirmation → Step7Confirmation`. Default export names updated to match. The number in `StepN*.jsx` is intended to track the step's position in the flow, per the convention noted in `CLAUDE.md`.

### Docs

- **`docs/my-account-flow.md` § 2.7** rewritten for the seven-step shape: nine → seven, step-by-step list reflects the new sequence, `Mount + state` paragraph updated to note that the flow always starts at Step 1 and that the entry-point card is product-specific. The "Step 5 device-prep warn callout" reference becomes "Step 3"; the "Step 8 submit advances to Step 9" reference becomes "Step 6 → Step 7". § 4.7 and § 4.8 step-number references updated (`paymentMethod` Step 7 → Step 5; `deviceOs` Step 5 → Step 3; `claim.returnMethod` Step 6 → Step 4; `claim.units` reframed as always-1-today). § 5.1 file tree updated. § 7 / § 8 step-number references updated; "Multi-item orders" entry reframed to reflect that partial-quantity returns are not currently supported.

## [Unreleased] — phase 14 (claim-tracking card)

### Added

- **`ClaimCard` component** (`src/components/ClaimCard.jsx`) — fourth card type in the orders list. Tracks a submitted return through seven states: `claim_created → pending_collection → under_collection → in_transit → under_qc → ready_for_refund → refunded`. Shares the refund-hero family chrome (left accent strip, `Order · #{id}` eyebrow, state pill, tinted hero block, compact product row, expand-on-tap) with `InProgressCard` and `PastOrderCard`. Tone shifts amber → brand-purple → success-green across the seven states (driven by `claimToneFor` in `src/lib/claims.js`): the first five states stay warn-amber, `ready_for_refund` flips to brand-purple to match the "active processing" feel of `refund_pending`, and `refunded` flips to success-green. The hero leads with the status headline, the claim ref (`RET-XXXXXXXX`) and most-recent timeline timestamp on one line, then a divider, then an `Expected refund` / `Refunded` block with destination chip and net amount. The destination chip uses the brand→accent gradient when the refund is wallet-bound (echoes the `GreetRow` credits pill) and a neutral chip when it goes back to the original card. Expanded body adds a 7-step horizontal dot timeline (filled in tone colour for reached steps, with date/time under each reached dot), a small `Original order — Delivered {date}` trace line so the customer keeps context that delivery itself completed, and a two-action footer (`View claim details` + icon-only `Download receipt`).
- **`ClaimDetailsSheet` component** (`src/components/ClaimDetailsSheet.jsx`) — bottom sheet opened by `ClaimCard`'s `View claim details` action. Carries two cards: **Summary** (read-only set of choices captured during the returns flow — reason, units, device preparation masked to `Factory reset confirmed` / `Credentials provided`, return method with pickup address shown underneath when courier, refund destination with `Includes 10% restocking fee` sub-copy when original-payment, submitted timestamp); and **Refund** (`Expected refund` / `Refunded` row + net amount; on original-payment refunds also shows a `Gross ... · Restocking fee − ...` sub-line so the math is visible). Mirrors `RefundDetailsSheet`'s chrome (`bg-black/45` scrim, `slideUp` panel, `Escape` to close, body-scroll lock). The summary lived inline inside the expanded card in an earlier draft; pulling it into the sheet keeps the expanded body focused on progress + order context, with the full breakdown one tap away.
- **`src/lib/claims.js`** — single source of truth for the claim card. Exports `CLAIM_STATUSES` (the ordered 7-step list with `id` / `label` / `short` / `headline` / `icon` per step), `claimToneFor(id)` (`'warn' | 'brand' | 'success'`), `claimProgressIndex(id)`, `claimPhaseTag(id)` (icon + label for the right-side hero tag — `Submitted` / `Awaiting pickup` / `Collected` / `On the way` / `In review` / `Processing` / `Complete`), `claimStatusHeadline(claim)`, `claimStatusSubline(claim)` (most recent timeline timestamp), `hasActiveClaim(order)` / `isClaimRefunded(order)` (used by `App.jsx` for section routing + filter counts), and the summary-label helpers (`REASON_LABELS`, `RETURN_METHOD_LABELS`, `reasonText`, `devicePrepText`, `refundMethodLabel`). The summary labels are duplicated from `Step8Review`'s local constants on purpose so `ClaimCard` doesn't pull from `ClaimFlow/` and the two stay independently editable.
- **`claim` field on order `89219` (Google Pixel 6)** — single hand-seeded claim in `under_qc` state for design review. The shape mirrors what `ClaimFlow`'s Step 8 submit will eventually write back: `{ claimRef, claimStatusId, type: 'change_of_mind', submittedAt, units, reason, devicePrep, returnMethod, refundMethod, expectedRefund: { gross, fee, net, rate }, timeline }`. Six additional delivered orders carrying claims in the other six states were drafted and removed at user request — only the `under_qc` card is rendered today. The full 7-state design walk-through can be reconstructed by reattaching `claim` objects to other delivered orders in `src/data/orders.js`. See `docs/my-account-flow.md` § 4.8 for the field schema.

### Changed

- **`App.jsx` routes claim-carrying orders to `ClaimCard`.** Two new helpers from `src/lib/claims.js` — `hasActiveClaim` and `isClaimRefunded` — drive both the section routing and the filter counts. An order with `hasActiveClaim(o)` is added to `isOpen` (counts toward the `in_progress` chip, lives in the **In progress** section); an order with `isClaimRefunded(o)` lives in **Past orders**. Both states are *excluded* from the `delivered` chip count (the underlying order's `statusId` is still `delivered`, but the visible card has shifted to claim-tracking mode). The render loop branches first on `hasActiveClaim` / `isClaimRefunded` so the claim card replaces the delivered card; existing routing for in-flight cancellations and in-progress orders is unchanged.
- **Delivered iPhone 13 (`89657`) is preserved as the no-claim eligible order.** Now that delivered orders can carry a claim, `89657` is the one delivered card kept claim-less so the `Raise a claim` button on `PastOrderCard` still has an order to launch the returns flow against. All other delivered demo orders either carry an in-flight cancellation or (in `89219`'s case) a claim.

### Notes

- `ClaimCard` does not yet participate in the auto-expand rule (`pickActiveOrderId` in `src/lib/statuses.js`). Fulfilment in-flight orders win the auto-expand slot; claim cards collapse by default. Extension hook: import `claimProgressIndex` from `src/lib/claims.js` and fold it into the rank function. Deferred until a customer-research pass tells us whether users want their active claim opened on land.
- No new filter chip was added for claims — they fold into `in_progress` / `delivered` per the rules above. Revisit if more than one or two claim cards routinely show at once.
- Submission persistence still missing. Step 9 of `ClaimFlow` generates a claim ref and ends; the prototype's `order.claim` data is hand-seeded. Wiring submit → `claim` object → API is a single integration point but out of scope for this iteration.

## [Unreleased] — phase 13 (cancel-flow polish + keep-my-order undo)

### Added

- **`KeepOrderSheet` component** (`src/components/KeepOrderSheet.jsx`) — single-step bottom sheet that lets a customer reverse an in-flight cancellation. Header (`Keep your order?` + `#id`), a brand-tinted hero card with a `RotateCcw` icon and the line *"Your {product name} will continue through fulfilment as if it was never cancelled."*, plus — only on `refund_pending` — a neutral info-tone strip noting that the pending refund (amount + destination) will be cancelled. Footer pairs an outlined `No, continue cancellation` with a brand-filled `Yes, keep my order`. Matches `CancelOrderSheet`'s chrome (`bg-black/45` scrim, `slideUp` panel, `Escape` to close, body-scroll lock). Submit is a stub — both buttons close the sheet, no state mutation (see §7 of `docs/my-account-flow.md`).
- **`I want to keep my order` CTA on cancelled-in-flight `PastOrderCard`s.** A new full-width brand-purple primary button sits **above** the `View refund details` / `Download receipt` action row inside the expanded body of the cancelled refund-hero card, gated on `cancellationStatusId === 'requested' || cancellationStatusId === 'refund_pending'`. The `refunded` past-orders branch never shows the button — once the refund has landed, the undo affordance is gone. Clicking the CTA opens `KeepOrderSheet`.
- **`paymentMethod` on in-flight orders `89712` and `89510`.** The created iPhone 12 now carries `{ type: 'card', brand: 'Visa', last4: '4242' }`; the delayed quality-check iPhone 11 carries `{ type: 'card', brand: 'Mastercard', last4: '8210' }`. Previously only the delivered order `89657` carried `paymentMethod` (for the returns flow); the field is now also consumed by `CancelOrderSheet` so the original-payment refund option can name the card the money is going back to.

### Changed

- **`CancelOrderSheet` names the card on the original-payment refund option.** The amount line on Step 1's `Original payment method` card now reads `{currency} {amount} back to {brand} •• {last4}` (e.g. `AED 806.55 back to Visa •• 4242`), driven by `order.paymentMethod`. Falls back to `back to your card` when `paymentMethod` is absent so non-populated orders still render. Step 3 (Confirm) mirrors the change: the `back to your …` destination line under the headline amount now reads `back to your {brand} •• {last4}` instead of the generic `back to your original payment method`. Wallet path is unchanged.
- **Dissuade step's fee-waiver sentence anchors on delivery, not shipping.** The success-tone shield strip on Step 2 now reads *"If we don't **deliver** by {order.estimatedDeliveryLong}, the {fee} processing fee is waived."* (was *"If we don't ship by {shipDeadlineFull}…"*). Falls back to `estimatedDelivery` when the long form is absent. The `shipDeadline*` fields are no longer read by the cancel UI; the data is left in place for now in case a hybrid sentence ("ship within 3 working days, deliver by …") returns in a later phase. The local helper variable was renamed `shipDeadlineFull → deliveryDeadlineFull` to match.

### Notes

- Keep-my-order submit is a prototype stub by design — the order shape today has no transition to flip `state` back from `cancelled` to `open`, and `cancellationStatusId` / `cancellationTimeline` would need clean teardown rules. Tracked in §7 of `docs/my-account-flow.md`.
- The button only surfaces on `requested` and `refund_pending` cards because at `refunded` the money has already left the company; reversal there is a different business operation (re-charging the customer) and out of scope for this demo.

## [Unreleased] — phase 12 (change-of-mind returns flow)

### Added

- **`ClaimFlow` overlay** (`src/components/ClaimFlow/`) — full-screen mobile flow for raising a change-of-mind return claim, mounted above the account view via `App.jsx`. Nine-step structure: 1) Claim type — 2) Order picker — 3) Product & quantity — 4) Reason (optional) — 5) Device preparation (gated) — 6) Return method — 7) Refund method — 8) Review & submit — 9) Confirmation. State lives in a single `useReducer` (`flowReducer.js`) and resets every time the overlay opens — no session persistence by design. Each step has its own component file plus shared `ProgressBar`, `StickyActionBar`, and `StepHeading`. The flow uses a checkout-style visual chrome — quiet white surface, segmented top progress bar, sticky bottom action bar with the primary brand-purple button, line-bordered cards that gain a `border-brand bg-brand-bg/30` treatment when selected — deliberately distinct from the order-card chrome family so the user feels they've entered a different *mode* without leaving the design system.
- **`src/lib/returns.js`** — single source of truth for return eligibility, refund math, and formatting. Exports `RETURN_WINDOW_DAYS` (10), `RESTOCKING_FEE_RATE` (10%), `eligibilityFor(order, today)` (returns `{ eligible, reason, untilDate }` keyed on cancellation state, delivery status, and the 10-day window), `groupOrdersByEligibility(orders, today)` (Step 2's eligible/ineligible split), `refundBreakdown(order, units, method)` (gross/fee/net for wallet vs original-payment), and `generateClaimRef()` (e.g. `RET-A4B7K9P2` for the confirmation screen). Eligibility prefers the new `deliveredOn` ISO field on the order and falls back to parsing `order.timeline.delivered` if absent.
- **Returns-flow fields on the delivered mock order `89657`.** `deliveredOn: '2026-05-08'` (5 days before the prototype's "today" of 2026-05-13, inside the 10-day window so the happy path lights up), `unitPrice: 939`, `paymentMethod: { type: 'card', brand: 'Visa', last4: '4242' }` (for Step 7's original-payment card label), and `deviceOs: 'ios'` (seeds Step 5's OS tabs to iPhone). The `placedAt` / timeline timestamps were shifted forward so the delivery date is consistent with the new `deliveredOn` (placed 3 May, delivered 8 May). All other orders fall into "Not eligible" naturally — open orders show "Not yet delivered", cancelled-past orders show "Cancelled before delivery" or "Already refunded".
- **Entry point on `PastOrderCard`.** The previously-decorative `Raise a claim` button on the delivered card now calls `onRaiseClaim(order.id)`. `App.jsx` owns the entry state (`claimFlowOrderId`) and mounts `<ClaimFlow />` only while non-null, so reopening the flow gets a fresh state tree. When launched from a specific order, the reducer's `initialState(initialOrderId)` pre-seeds `claimType: 'change_of_mind'`, `orderId`, and `step: 2` so the user lands at the order picker with their order pre-selected — they can still back-step to Step 1 to change the claim type.
- **Step 5 device preparation is the operational keystone.** Two stacked radio cards: A) `I've factory reset the device` (recommended pill, success-tone) with an `iPhone` / `Android` OS-tabs control, a collapsible numbered reset instructions list per OS, and a required `I confirm this device has been factory reset` checkbox; B) `Provide unlock credentials` with the same OS-tabs control and `Apple ID` / `Google account email` + password fields (with show/hide toggle) plus the encryption-disclosure note. `canAdvance(state)` returns false until one full option is completed — the only step in the flow that gates the Continue button on a non-trivial input shape. A small `If you leave this flow, you'll need to start over` hint sits below to make abandonment cost visible.
- **Refund math is visible on Step 7.** Two stacked refund cards built off `refundBreakdown(order, units, method)`. Wallet card: full amount in `text-[22px]` tabular-nums, success-tone `Recommended` pill, `Available in your wallet within 1 hour`. Original-payment card: net amount with the gross shown struck-through and the 10% fee broken out explicitly (e.g. `AED 939` struck-through · `−AED 93.90 (10% restocking fee)`). Both reuse `WalletInfoTooltip` and the shared `REVIBE_WALLET_ICON` so the wallet treatment matches the rest of the app.
- **Step 8 Review surfaces an inline `Edit` link per section** that dispatches `GO_TO_STEP` to jump back to the originating step. Device-prep is masked to `Factory reset confirmed` / `Credentials provided` — credentials are never shown in plain text. The refund block shows the final net the user will receive in tabular-nums for visual finality.
- **Step 9 Confirmation generates `claim ref` with `Copy` button**, an expected-refund block keyed to the chosen method's timeline (`Available in your wallet within 1 hour` vs `Returns to your card in 5–10 business days`), and a device-prep reinforcement line (`You confirmed the device is factory reset` / `Thanks for providing your credentials`). Two equal-weight footer buttons: `Track this return` (stub) + `Back to my account` (closes the overlay).
- **Out-of-scope claim types on Step 1 are tappable but stubbed.** Selecting `Faulty product`, `Damaged in transit`, `Missing items`, or `Other` doesn't advance — it surfaces a small inline note: *"That flow isn't part of this build yet — in production this would route to the legacy claims form."* The list still establishes the entry-screen pattern so the other branches can plug in cleanly later.

### Changed

- **`App.jsx` now mounts `ClaimFlow` conditionally** above the account view (`{claimFlowOrderId !== null && <ClaimFlow ... />}`). Conditional render rather than an always-mounted `open` prop so reducer state resets cleanly on each open — important because the flow explicitly forbids session persistence.
- **`PastOrderCard.PastButton` accepts `onClick`** and renders as a real `type="button"`. The component's signature on `PastOrderCard` itself also gains an `onRaiseClaim` prop that's threaded down to the `Raise a claim` button. `Download receipt` stays decorative.

### Notes

- The flow is wired only from the delivered-card entry point. The cancelled-past `PastOrderCard` variant doesn't surface `Raise a claim` (it never did), and there's no top-level "Return an item" entry yet — when the design calls for one, drop it into `GreetRow` or `OrderFilters` and pass `null` as `initialOrderId` to land on Step 1 with no order pre-selected (the reducer's `initialState(null)` handles that branch).
- Eligibility is intentionally lenient: only the delivered iPhone 13 (`89657`) lights up as eligible today. To demo the partial-return stepper, raise `89657.quantity` above 1 — `Step3ProductQuantity` already renders a stepper when `order.quantity > 1` and falls back to a `Returning 1 of 1` confirmation otherwise.
- The submission is a stub — `dispatch({ type: 'SUBMIT', ... })` just generates a ref string and advances to Step 9. No persistence, no API call.

## [Unreleased] — phase 11 (in-progress card alignment + delivered card refresh)

### Added

- **`InProgressCard` component** (`src/components/InProgressCard.jsx`) — dedicated card for non-cancelled `created` + `quality_check` orders, sharing the chrome family established by the cancelled-past refund-hero card so the in-progress, delivered, and refunded cards now read as one consistent set. A `w-1` left brand-purple accent strip carries the in-flight tone (constant brand purple regardless of `delayed` — see Changed below). A small uppercase `Order · #{id}` eyebrow sits at the very top, then the state pill on its own row (`Order placed` for `created`, `Quality check` for `quality_check`, with `Package` / `ShieldCheck` icons), then a brand-purple gradient hero block (`from-brand-bg to-brand-bg2`) carrying `Delivery by` eyebrow + `On track` tag with `Zap` icon on top, the big `text-[26px]` headline using `order.estimatedDeliveryLong || estimatedDelivery`, the status body sentence (`statusDescription(order).body`), and a `Delivering to [Home]` chip below. Compact product row underneath with image / name / variant / Revibe Care / total / chevron. Expanded body adds a horizontal `Timeline` dot row (Placed → QC → Shipped → Delivered) where each reached step shows the date + time it entered that stage on two lines below the label (sourced from `order.timeline[stepId]`); the `Order details` collapse with delivery address / phone / order date and `Change address` / `Change phone number` pills; and a `Cancel order` (danger outline) + `Change details` (brand outline) action row. The cancel button still opens the existing `CancelOrderSheet`. Auto-expand parity with the previous `OrderCard` is preserved — `App.jsx` passes the same `defaultExpanded={!showHero && o.id === activeId}` it always did.
- **`estimatedDeliveryLong` field on in-progress mock orders.** `89712` and `89510` now carry `estimatedDeliveryLong: 'Monday, 4 May'` next to the existing short-form `estimatedDelivery: 'May 4'`. The hero falls back to the short form when the long form is absent. Mirrors the `placedAt` / `placedAtFull` and `shipDeadline` / `shipDeadlineFull` pattern: a short machine-ish form and a pre-formatted long form, so the component never has to do weekday arithmetic.
- **`deliveredOnLong` field on the delivered mock order.** `89657` now carries `deliveredOnLong: 'Wednesday, 15 April'` for the new delivered-card hero. Same fallback pattern: the hero falls back to the date part of `order.timeline.delivered` (split on ` · `) when absent.

### Changed

- **`DeliveredOrderCard` in `PastOrderCard.jsx` rebuilt to match the refunded card's chrome family.** The old single-row product summary is replaced with: `w-1` left success-green strip; `Order · #{id}` eyebrow; success-tinted `Delivered` state pill (`PackageCheck` icon); a success-gradient hero block (`from-success-bg to-[#d4f0e3]`) carrying `Delivered on` eyebrow, `Complete` tag with checkmark, `text-[26px]` `deliveredOnLong` headline, and a `Delivered to [Home]` chip; a compact product row that surfaces the Revibe Care line + total on the right (the obvious differences from the refunded card, which leads with money and omits both); and the existing `Download receipt` + `Raise a claim` chip-style footer kept verbatim, separated by a top dashed border. The card no longer expands — there's no chevron and no expanded body.
- **`App.jsx` routes `created` and `quality_check` non-cancelled orders through `InProgressCard` instead of `OrderCard`.** The `inFlight.map(...)` ternary now branches three ways: in-flight cancellations → `PastOrderCard`; created/quality_check → `InProgressCard`; everything else (i.e. shipped) → `OrderCard`. `OrderCard` is therefore no longer the entry point for created/quality_check rendering.
- **Delayed `quality_check` orders no longer flip the in-progress hero to warn-amber.** Per design feedback, the QC card should stay brand-purple throughout even when `delayed: true`. The hero gradient, headline color, accent strip, and state pill are all hardcoded brand-purple in `InProgressCard`. The delay signal is preserved in two subtler ways: the right-side tag swaps to `Clock` icon + `Taking longer than expected` (still rendered in brand-purple, not warn) and the body sentence uses the existing `DELAYED_BODY[statusId]` copy. The full warn-amber treatment still exists for `OrderCard`'s shipped cards via `statusDescription` — the change applies only to the new `InProgressCard` chrome.
- **The redundant header timestamp on the in-progress card is gone.** `OrderCard`'s `SummaryHeader` showed `#id · placedAtShort` next to the status icon. The new `InProgressCard` drops this entirely — the order ID lives in the `Order · #id` eyebrow and the placed date is surfaced inside the expanded `Order details` → `Order date` row. No collapsed surface for placed date, mirroring the cancelled card.

### Notes

- `OrderCard` is now reached only by shipped non-cancelled orders and (still) by in-flight cancelled orders that are mid-fulfilment with `state === 'cancelled'`. Created and quality_check go to `InProgressCard`; delivered and past cancelled go to `PastOrderCard`. Three card components, three states.
- The `Timeline` label (replacing `Full timeline`) is shorter to leave room for the date + time text under each step. The vertical full timeline that lived in `OrderCard`'s expanded body for created/QC is intentionally not ported — its content has been merged into the dates-under-dots horizontal timeline.
- The hardcoded "Home" destination chip (both in-progress and delivered hero blocks) is decorative — there is no `addressLabel` field on the order shape today. If real address-label data lands ("Home" / "Office" / etc.), thread it from `order.addressLabel` and fall back to "Home" when absent.

## [Unreleased] — phase 10 (cancelled past orders redesign)

### Added

- **Refund-hero treatment for cancelled past orders in `PastOrderCard`.** The component now branches internally on `order.state`: delivered renders the unchanged one-row summary + `Download receipt` / `Raise a claim` footer; cancelled (`requested` / `refund_pending` / `refunded`) renders a dedicated compact card that leads with the refund as the visual hero. A `w-1` left accent strip carries the phase tone (warn amber for `requested`, brand purple for `refund_pending`, success green for `refunded`) — a deliberate departure from the all-red in-flight cancellation treatment so a completed refund reads as positive rather than alarming. The collapsed view stacks a small uppercase `Order · #{id}` eyebrow (mirroring the `OrderCard` eyebrow pattern), the phase pill, the hero block (refund amount in `text-[28px]` tabular-nums + destination chip — gradient brand→accent for wallet, neutral for card), and the product row. Expanded view adds a 3-step numbered dot stepper for refund progress (created-path cancellations skip `requested`, mirroring `cancellationStepsFor`); each reached/current step shows the timestamp it entered that phase below its label (from `order.cancellationTimeline[step.id]`), upcoming steps show the label only. Followed by a dimmed fulfilment trace ending in a red ✕ at the cancel point, and a two-action footer (`View refund details` + icon-only `Download receipt`). Always collapsed by default; no auto-expand.
- **`refund` object on each cancelled mock order in `src/data/orders.js`.** `89499` (requested) → wallet destination; `89321` (refund_pending) → card destination (Visa ••4242); `89150` (refunded) → wallet destination with `fundsAvailable: 'Available now in your wallet'`. Each carries `subtotal`, `amount` (net), `destination`, and a `breakdown` array of `{ label, amount }` summing to `subtotal`. Card refunds also carry `fee: { label, rate, amount }` — the 5% processing fee applied at cancellation time, mirroring the `CancelOrderSheet` rate. The hero `refund.amount` reflects the **net** post-fee figure (e.g. `89321` shows AED 331.55, not the gross 349). Wallet refunds have no fee — `subtotal === amount`. `fundsAvailable` is only populated on the refunded order — `requested` and `refund_pending` make no ETA promise.
- **`RefundDetailsSheet` component** (`src/components/RefundDetailsSheet.jsx`) — bottom sheet opened by the `View refund details` button on the expanded cancelled past card. Strictly the money math: line items (from `refund.breakdown`) → subtotal → fee (shown only when present, with `label (rate%)` and a danger-toned negative value) → total refund (tone-coloured to match the phase). Matches `CancelOrderSheet`'s chrome (`bg-black/45` scrim, `slideUp` panel, `Escape` to close, body-scroll lock). Tone uses the same `toneFor` mapping (warn / brand / success per cancellation phase).

### Changed

- **Past-orders rendering in `App.jsx` simplified to a single component.** The ternary that routed cancelled past orders back through the full `OrderCard` (with its in-flight chrome, status banner, sub-timeline, courier banner, and order summary) is gone. The block is now `{past.map((o) => <PastOrderCard key={o.id} order={o} />)}`; `PastOrderCard` handles both delivered and cancelled branches internally.

### Removed

- **Inline `RefundBreakdown` block from the expanded cancelled past card.** The breakdown is now the sole content of `RefundDetailsSheet`, so the inline block was redundant. Expansion now shows: refund progress stepper, fulfilment trace, two-action footer.

### Notes

- `CancellationSubTimeline` is unchanged — it's still used by the in-flight `OrderCard` when `state === 'cancelled'` but the order is mid-fulfilment. Only past-order cancellation rendering moved.
- The icon-only `Download receipt` button next to `View refund details` is still decorative (matching the existing pattern).

## [Unreleased] — phase 9 (cancellation take-rate dissuade)

### Added

- **Dissuade step in `CancelOrderSheet`** — a new middle step (`step === 'dissuade'`) that fires only when the user picks `Original payment method` AND the order is at `statusId === 'created'`. Three-block body: a centered hero card with the delivery promise (*"You're on track to receive your {product} by Monday, 4 May"*), a neutral info-tone strip warning that the item *may not be available to reorder later*, and a soft-green success-tone strip with `ShieldCheck` icon promising that *"If we don't ship by {shipDeadlineFull}, the {currency} {fee} processing fee is waived."* Footer carries two chunky 52px buttons: brand-filled `Keep my order` and outlined `Continue to cancel` that turns red on hover (`hover:bg-danger-bg hover:text-danger hover:border-danger`). For wallet refunds and non-created statuses the flow is unchanged.
- **`shipDeadline` + `shipDeadlineFull` on `created` order `89712`** — pre-formatted strings (`"May 1"` / `"Friday, 1 May"`) for the latest acceptable ship date per the 1–3 working-day SLA. Mirrors the `placedAt` / `placedAtFull` pattern so the component never has to do working-day arithmetic. Only populated on the created order because the dissuade step only fires at `created`.
- **`formatDeliveryDate(estimatedDelivery, placedAt)` helper in `CancelOrderSheet`** — parses the short `"May 4"` form using the year from `placedAt` and emits `Monday, 4 May` via `Intl.DateTimeFormat`. Used for the dissuade hero; also tolerates the existing `shipDeadlineFull` field as a pre-baked override.

### Changed

- **Flow shape for the original-payment + created path is now three steps:** Select → Dissuade → Confirm. Wallet and non-created paths keep the existing two-step flow (Select → Confirm). The order of escalation now matches the order of finality — the danger-filled `Cancel order` button on Confirm is the actual final action, instead of an earlier-screen commitment followed by a quiet text-link gate.
- **Confirm-step nudge copy trimmed for the original-payment path.** Was *"You're giving up {fee} to the processing fee. Choose Revibe Wallet for the full amount, instantly."* Now: *"You're giving up {fee} to the processing fee."* Dropping the wallet pitch removes the double-nudge (Dissuade already had the wallet alternative in an earlier draft). The wallet-path info strip is unchanged.
- **`Continue` on the Select step now routes by gate** — to Dissuade when `method === 'original' && statusId === 'created'`, otherwise straight to Confirm. **`Back` on Confirm mirrors the same gate** so the user retraces their actual path.

### Removed

- **Switch-to-Revibe-Wallet button on the dissuade step** (from an earlier draft that included it as a tertiary action). It overrode the method the user explicitly picked on Select and created a back-routing loop. The wallet alternative is still surfaced on Select (option 1, with the green "Full refund · available instantly" emphasis).

## [Unreleased] — phase 8 (Revibe Wallet rebrand)

### Added

- **`WalletInfoTooltip` component** (`src/components/WalletInfoTooltip.jsx`) — shared tap-to-toggle tooltip used wherever "Revibe Wallet" is named. Exports the wallet icon constant (`REVIBE_WALLET_ICON`, `account.revibe.me/assets/icons/home/ic_wallet.svg`) and a default-exported component with `align` (`'center' | 'left' | 'right'`), `iconClassName` (so the `i` can be themed for light or dark backgrounds), and `stopPropagation` props. Tooltip body is `whitespace-normal` to wrap even when an ancestor sets `whitespace-nowrap` (e.g. the credits pill). Dismisses on outside click. Tooltip copy is verbatim: *"Store credits can be used to purchase items on Revibe. Credits can be used on any product and are combinable with any payment method. See more on credits terms & conditions."* — with `terms & conditions` rendered as a placeholder link.
- **Wallet icon + info `i` on the `GreetRow` credits pill.** The top-of-page pill now reads `[wallet icon] Revibe Wallet · AED 384 [i]` instead of `● AED 384`. The pill's outer element switched from `<button>` to `<div>` so the nested info button is valid HTML; the wallet glyph is white-tinted (`filter: brightness(0) invert(1)`) to read on the gradient background. The tooltip is right-anchored under the pill so it stays inside the 430px viewport.
- **Wallet icon + info `i` on the confirm step's destination line.** When the user picked the wallet option, the `back to your …` line inside the amount card now renders `[icon] Revibe Wallet [i]`. On the original-payment-method path the line is unchanged.

### Changed

- **"Store credit" → "Revibe Wallet" everywhere in the cancellation flow.** Both `CancelOrderSheet` steps: option title, amount line ("back to your Revibe Wallet"), confirm-step destination, and the info banner copy. Phrases that previously read *"Store credit stays on Revibe."* / *"Choose Store credit for the full amount, instantly."* now read *"Revibe Wallet credit stays on Revibe."* / *"Choose Revibe Wallet for the full amount, instantly."*. The internal method id (`method === 'store_credit'`) is unchanged.
- **Wallet refund option restyled.** The `Recommended` pill is gone. The detail line (`Full refund · available instantly`) is now the visual emphasis: `text-success font-semibold` (green) instead of `text-muted`. Goal: keep the recommendation signal but anchor it on the concrete benefit rather than a meta-label.
- **`RefundOption` outer element switched from `<button>` to `<div role="button">`.** Lets it nest the info-icon button (the wallet option's `WalletInfoTooltip`) as valid HTML. Keyboard activation (Enter / Space) preserved via `onKeyDown`.



### Changed

- **`Warranty` renamed to `Revibe Care` everywhere it surfaces.** OrderCard / HeroCard / PastOrderCard product strips and the cancellation sheet's line-item breakdown all read `Revibe Care` now, prefixed with the Revibe RE_CARE logo (`cdn.shopify.com/.../Revibe_logo_RE_CARE_Color_copy.png`) at ~14px next to the amount. The underlying `order.warranty` field is unchanged so the order shape stays backwards-compatible — only the user-facing copy and the icon are new.
- **Order number moved out of the product strip and into a card eyebrow.** On `OrderCard`, the collapsed subtitle no longer reads `{variant} · #{id}` — `· #{id}` is dropped and the order number now sits in a small uppercase `Order · #{id}` eyebrow at the very top of the card. This mirrors the hero card's `Active order · #{id}` eyebrow pattern, and lets the product strip read as a clean three-line breakdown (Product / Revibe Care / Total) without competing metadata. `PastOrderCard` is unchanged — its `#{id}` already shares a line with the placed-date and there's no visual ambiguity to resolve.
- **`TOTAL` caption above the bold amount in the product strip.** A tiny `TOTAL` label (uppercase, tracked, muted on light / 70% opacity on hero) now sits above the bold price on `OrderCard` and `HeroCard`. Goal: make it unambiguous that the bold figure is the sum of Product + Revibe Care, not the line price of the device alone. `PastOrderCard` skips the caption because nothing else on its row reads as a price.

## [Unreleased] — phase 6 (cancellation flow)

### Added

- **`CancelOrderSheet`** — two-step bottom sheet wired to the `Cancel order` button on `created` orders. Step 1 shows an order-summary card with a line-item breakdown (`Product` + `Warranty` if present + `Total`) and two refund options as radio cards: `Store credit` (recommended pill, full refund, instant) and `Original payment method` (total minus a 5% processing fee, refunded to the card in 5–10 business days, fee shown explicitly). Step 2 confirms the chosen amount and destination and exposes a danger-filled `Cancel order` CTA. Dismissible via scrim, X, `Escape`, or `Back`/`Keep order`. Confirmation does not yet persist a state change — the sheet just closes (option A from planning).
- **`subtotal` + `warranty` fields on every demo order.** All five mock orders now carry a `subtotal` + `warranty` split (e.g. iPhone 12: 779 + 70 = 849; iPhone 7: 209 + 30 = 239). The fields remain optional in the order shape; rendering paths skip the warranty row/line when the field is absent.
- **`+ Warranty {amount}` line on the product strip.** Both `OrderCard` (collapsed header strip) and `HeroCard` (frosted strip on the dark gradient) render a third line beneath the variant — `text-muted` on the light cards, `opacity-60` on the hero — when `order.warranty` is present. PastOrderCard is intentionally untouched (different one-row layout).
- **`slideUp` + `fadeIn`** keyframes / animation utilities in `tailwind.config.js`, used by the sheet's panel and scrim respectively.

### Changed

- **`OrderCard`'s `Cancel order` button** is now wired up on `created` orders only (opens the sheet). On `quality_check` it remains a visual stub pending its own design pass. The internal `SecondaryBtn` helper now accepts `onClick` and sets `type="button"` so it can be safely placed inside other interactive contexts.
- **Confirm-cancellation copy + amount card.** The shared warn-tone strip (`This can't be undone. Your order won't be processed.`) is replaced with a neutral info-tone strip (`border-line` / `bg-line-2` / `Info` icon) and method-specific copy. `Store credit`: *"Store credit stays on Revibe. It won't be paid out to your bank account."* `Original payment method`: *"You're giving up {currency} {fee} to the processing fee. Choose Store credit for the full amount, instantly."* The original-payment amount card also carries a small breakdown line (`Total {currency} {total} · −{currency} {fee} fee`) between the headline figure and the destination. Goal: reduce wrong-method regret at the final confirm.

## [Unreleased] — phase 5 (post-handoff iteration)

### Added

- **Hero card secondary action row.** Beneath the primary `Track package` + `Get help` CTAs, the hero now carries a second row of two same-sized ghost buttons (`bg-white/[.12]` / white border, white text, matching the `Get help` style): `Cancel order` + `Raise a claim`. Tapping `Cancel order` toggles a small dark tooltip — *"You cannot cancel the order at this stage"* — centered above the button and dismissing on outside-click. Cancellation eligibility logic is prototype-only.
- **"Delivery by [date]" subtitle in the hero.** Renders directly under the status headline ("Out for delivery") when `order.estimatedDelivery` is present. Data-driven, follows the same pattern as the in-card eta block.
- **`Change order details` action on in-progress order cards.** Replaces `Get help` on `created` + `quality_check` cards. Clicking it programmatically opens the `<details>` collapse (via ref) so `Change address` + `Change phone number` are immediately visible.
- **Edit pills on `quality_check`.** `canEdit` now covers all in-progress states (was `created`-only), so the quality-check expanded view also surfaces `Change address` + `Change phone number` pills inside Order details.
- **Past-delivered "Raise a claim" pill.** Delivered `PastOrderCard` now renders both `Download receipt` **and** `Raise a claim`, right-aligned with a small gap.

### Changed

- **`MessageSquareText` → `Headphones` for hero help button.** Reads more clearly as "contact a person" and visually pairs with the `Truck` icon on Track package. Label also tightened from "Help" to "Get help" to match the rest of the app.
- **Shipped order `estimatedDelivery`** updated from `'Wed, 29 Apr'` to `'May 4'` so the new hero ETA subtitle reads sensibly given the prototype's current date.
- **`STATUSES.quality_check.short`** renamed `QC` → `Quality Check` so the dot-timeline label is fully spelled out under both the hero and the shipped OrderCard's main-card timeline.
- **Hero ETA subtitle bumped** from `text-[14px] font-semibold` to match the headline (`text-[22px] font-bold tracking-[-0.02em]`), so "Delivery by [date]" reads as a paired second line of the title rather than a sub-eyebrow.
- **`Change order details` button restyled** outline-purple (`bg-surface text-brand border-brand`) via a new `variant="outline"` prop on `PrimaryBtn`. Visually distinguishes it from the filled-purple `Get help` used on shipped cards.
- **Cancel-order tooltip width fixed** at `w-[180px]` with `whitespace-normal` + `text-center` so it wraps to two lines and stays inside the hero section's `overflow-hidden` clip even when centered above the Cancel order button.
- **In-progress timeline dedup.** For `created` and `quality_check` orders, the in-card dot timeline (`DotBar`) no longer renders above the product strip — the same progression was being shown twice. The four-step Full timeline now sits **above** Order details / Cancel / Change order details inside the expanded view. Shipped orders are unchanged: in-card dot timeline + Full timeline at the bottom.

### Removed

- **"Raise a claim" on cancelled past orders.** Cancelled `PastOrderCard` no longer renders an action area at all (no border-top, no button row).

## [Unreleased] — phase 4 (My Account redesign handoff)

### Added

- **`HeroCard`** — full-bleed gradient (purple → magenta) hero pulled to the top of the orders list for the single most-in-flight order. Live "Active order · #id" eyebrow with a pulsing green dot, status headline, frosted product strip, light-on-dark dot timeline, and a primary "Track package" / ghost "Help" CTA pair.
- **Detailed-tracking expand inside `HeroCard`.** Visible only while `statusId === 'shipped'`. Renders a DHL courier strip (badge, courier name, tracking number, copy-to-clipboard) and the vertical sub-timeline restyled for the dark gradient.
- **`PastOrderCard`** — compact one-row card for delivered + cancelled orders, with a status pill, placement date, order id, total, and a single contextual action (`Download receipt` for delivered, `Raise a claim` for cancelled).
- **`GreetRow`** — "My orders" page title + count line + tight gradient credits pill, replacing the old full-width `StoreCreditsCard`.
- **Section labels** — `In progress` / `Other open orders` / `Past orders` headings with item counts, so delivered/cancelled history sits below the live list instead of mixed in.
- **Chip count badges** — each status chip in `OrderFilters` now carries a small numeric badge (computed from the date-range-filtered set).
- **"Delivery by [date]" eta block** in the collapsed `OrderCard` header for `created` and `quality_check` orders. Large headline + a muted sentence (colored "On track" / "Taking longer than expected" lead phrase + body), placed above the dot timeline.
- **Order details collapse** inside expanded `OrderCard` — `<details>` block with delivery address, phone number, and order date. While `statusId === 'created'`, the card also exposes subtle pill buttons for `Change address` and `Change phone number`.
- **`placedAtFull`** field on every mock order — long-form date used inside the Order details collapse.
- **`STATUSES[].short`** — short labels (`Placed / QC / Shipped / Delivered`) used by the compact dot timelines.

### Changed

- **Top chrome condensed.** The four-row stack (`PromoBar + Header + SearchBar + FiltersRow`) collapses into a single sticky `Header` (menu / logo / search / bell / avatar) plus the new `GreetRow` and a search-inline `OrderFilters` row.
- **`OrderCard` rebuilt.** Collapsed view: status badge + headline + chevron → eta block (in-progress only) → dot timeline → product strip with price. Expanded body: status banner → shipping sub-timeline (when shipped) → courier card → Order details collapse → Cancel/Receipt + Get help action row → full timeline.
- **Header action buttons.** Old "Download receipt / Raise a claim" pair replaced with state-aware actions: `Cancel order` (red ghost) for in-progress orders, `Receipt` for past orders, paired with a primary `Get help`.
- **"In progress" chip** renamed to **"Open"** to match the chip label set used in the design.
- **Page background** is now the warm off-white `canvas` token (`#f7f5fb`) so cards feel elevated without shadows.
- **Brand palette extended.** Added nested tokens: `brand-bg`, `brand-bg2`, `success-bg`, `warn`, `warn-bg`, `danger`, `danger-bg`, `line-2`, `ink-2`. Plus `bg-hero-gradient` / `bg-credits-pill` background-image utilities and `slideDown` / `heroPulse` keyframe animations.
- **Card radius** bumped from 16px to 18px; button radius from 8px to 10px to match the prototype.
- **Status headline copy.** `STATUSES.created` is now `Order placed` and `STATUSES.quality_check` is now `Quality check` (was `Order created` / `At quality check`), matching the design.

### Removed

- **`PromoBar`, `SearchBar`, `FiltersRow`, `StoreCreditsCard`, `StatusBanner`, `OrderSummary`, `CourierBanner`** components — superseded by the new `Header` / `GreetRow` / `OrderFilters` / `HeroCard` / `OrderCard` / `PastOrderCard` set. Their behaviors are folded into the new components.
- **`fontSize.page` token** (only ever used by `text-page` on the old "Orders" heading; no longer needed).

## [Unreleased] — phase 3

### Added

- **`StatusBanner`** — tinted box rendered inside the always-visible card header (above the product row). A colored leading phrase describes *condition* (`On track`, `Arriving today`, `All done`, `Refund in progress`, `Taking longer than expected`) and a sentence describes the current step. Four tones: brand / success / warn / danger.
- **`statusDescription(order)`** in `src/lib/statuses.js` — returns `{ tone, lead, body }` resolved in this order: cancelled state → delayed flag → status defaults. `order.statusMessage` overrides the body string in any branch.
- New optional order fields: `delayed: true` flips the banner to the warn tone with a delay-flavored body keyed by `statusId`; `statusMessage: '…'` overrides the banner body. The iPhone 11 quality-check order is marked `delayed: true` for the demo.
- **`pickActiveOrderId(orders)`** in `src/lib/statuses.js` — returns the id of the single most-in-flight order (highest `progressIndex × 10 + subProgressIndex`, in-flight only). Returns `null` when nothing is in flight.
- **Order filter chips** (`All / In progress / Delivered / Cancelled`) actually filter the rendered list. State is owned by `App.jsx`; `OrderFilters` is now controlled.
- **Date-range dropdown** with four presets (`Last 30 days / 3 months / 1 year / All time`), open/close, click-outside-to-close, active-option checkmark. Plumbed to `App.jsx` and applied via `placedAt` parsing — visibly inert today because all mock orders fall inside every range.
- **Empty state** in the order list when filters yield zero results.
- **"Need help with delivery?"** secondary CTA inside `CourierBanner`, soft-filled (`bg-brand/10 text-brand`), links to DHL customer service.
- **CLAUDE.md** at the repo root — collaboration guide for future sessions.

### Changed

- **Auto-expand replaces auto-collapse.** Everything collapses by default; `App.jsx` auto-expands only the single most-in-flight card via `pickActiveOrderId`. Old `isCollapsedByDefault` removed.
- **Delivered chip is green.** When `statusId === 'delivered'`, `OrderCard` overrides the data's `state: 'close'` chip and renders a green "Delivered" pill instead of the orange "Close" one.
- **`StoreCreditsCard` redesigned.** AED amount now renders with a purple→magenta gradient (`from-[rgb(115,65,186)] to-accent`, `bg-clip-text`). Voucher row collapsed to a single line: code + clipboard icon button. Info button removed. Section spacing tightened.
- **`OrderFilters` flattened.** Card wrapper dropped; search field + range dropdown side-by-side; status chip row underneath.
- **`CourierBanner` "Track order"** URL hardcoded to a known-good DHL Express test shipment (`tracking-id=3392654392`) so the demo always lands on a real tracking page.
- **"Raise a claim"** outlined-purple on delivered orders (matches "Download receipt"); muted gray on every other state.
- **"Orders" heading** now renders correctly. Removed the unused `colors.page` token from `tailwind.config.js` to fix a `text-page` color/font-size collision that had been making the heading white-on-white.

### Removed

- **"Change address" button + its help icon.** Customer-service contact for delivery now lives in the new "Need help with delivery?" CTA inside `CourierBanner`.
- **`isCollapsedByDefault`** in `src/lib/statuses.js` — superseded by `pickActiveOrderId`.

## [Unreleased] — phase 2

### Added

- **Two-tier status model.** Top-level `STATUSES` (`created → quality_check → shipped → delivered`) is unchanged; new `SHIPPING_SUB_STATUSES` (`arrived_destination → cleared_customs → forwarded_to_agent → out_for_delivery`) apply only while `statusId === 'shipped'`. All four sub-statuses render in order today — international/domestic branching is parked.
- **`ShippingSubTimeline`** — vertical sub-timeline rendered inside `OrderCard` only while `statusId === 'shipped'`. Pattern adapted from Noon's tracking screen; colours kept in Revibe palette.
- **`CourierBanner`** — visible while `statusId` is `shipped` or `delivered`. Carrier headline, explanatory sentence about contacting the courier, primary "Track order" CTA. Uses a filled brand-purple button — first filled CTA in the app, deliberately so the action stands out.
- Mock orders now cover every top-level stage plus a cancelled order: `created`, `quality_check`, `shipped` (with sub-status `out_for_delivery` and an `estimatedDelivery` ETA), `delivered`, and a cancelled-at-QC order.
- New helpers in `src/lib/statuses.js`: `isCollapsedByDefault`, `statusHeadline`, `statusSubline`, `statusIconFor`, `subProgressIndex`. The collapsed-card header is driven by these so new statuses stay in sync.
- **`estimatedDelivery`** field on the order shape (optional — DHL doesn't always provide it). When present on a shipped order the collapsed-card subline reads "Delivery by [date]"; absent, it falls back to "Updated [timestamp]".
- `docs/my-account-flow.md` — living documentation of the orders flow for product + engineering audiences (Mermaid diagrams, data model, extension points, mocked-vs-production gap).

### Changed

- **Collapsed card rebuilt** in Noon-summary style: status icon + headline + state chip + chevron, divider, product image with name/variant/total, divider, order ID. The chip is now visible at-a-glance, so cancelled orders read as cancelled even when collapsed.
- **`StatusTimeline` filled with brand colour** for reached stages (circles + 2px connectors). The current step's label is bold so it stands out without changing the dot treatment.
- **Auto-collapse** delivered + cancelled orders by default, wired through `isCollapsedByDefault` in `App.jsx`.
- **Expanded body deduped** — dropped the inline `ProductBlock` and the "Date & Time" + "Total Amount" detail rows since the new header carries them.
- **`OrderSummary`** no longer renders the courier as a hyperlink (the `CourierBanner` owns that); replaced with a static "Carrier" row that hides when the order has no carrier yet.
- **"Change address"** hidden on delivered and cancelled orders. "Download receipt" and "Raise a claim" stay visible at every stage.
- Courier across all mock orders switched from Quiqup to **DHL**.
- README rewritten — replaced the Vite starter boilerplate with a project-specific overview.

### Known trade-offs

- `OrderCard` is tall when fully expanded for shipped orders (header + banner + horizontal timeline + vertical sub-timeline + summary). Acceptable for phase 2; flag for review if real users complain.
- All shipping sub-statuses always render, even on shipments that wouldn't realistically clear customs. Intentional for the demo; see `docs/my-account-flow.md` § 8.

## [0.1.0] — 2026-05-01 — phase 1 baseline

### Added

- React + Vite + Tailwind 3 + lucide-react scaffold inside `order-redesign/`.
- Mock orders + canonical status model in `src/lib/statuses.js`, `src/data/orders.js`.
- Account-home + order-list components: `PromoBar`, `Header`, `SearchBar`, `FiltersRow`, `StoreCreditsCard`, `OrderFilters`, `OrderCard` (inline-expandable), `StatusTimeline`, `OrderSummary`, `ChatFab`.
- Local copies of Revibe logo + sample product image in `public/`.
- Inter loaded via Google Fonts as a Graphik substitute.
- `brief/design-system.md` updated with values inferred from the source screenshots.

### Removed

- Duplicate top-level `package.json`, `node_modules`, Tailwind/PostCSS configs that lived above `order-redesign/`.
- Vite/React starter assets and demo CSS.
