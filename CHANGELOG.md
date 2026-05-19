# Changelog

Internal demo project. One line per material change, newest at the top. Phase headings preserved for git/PR cross-reference; for the full "why" check the corresponding commit message or the per-feature doc in `docs/output/`.

## Unreleased

- `ClaimCard` gains a `See detailed tracking` dropdown when `claim.claimStatusId === 'in_transit'` (light-palette mirror of the outbound `HeroCard` dropdown). Powered by `CLAIM_TRANSIT_SUB_STATUSES` + `transitSubProgressIndex` in `src/lib/claims.js`; reads `claim.transitSubStatusId` / `claim.transitSubTimeline`. Mock 89815 moved from `under_qc` to `in_transit` to exercise it.
- Inline `expert_revision` sub-status notes removed from `ClaimCard` (along with `SubStatusNote` + `shortDay` helpers). `SUB_STATUS_LABELS` registry kept in `src/lib/claims.js` for ops reference. Mock 89762 reset to a plain `under_qc` Issue-claim baseline.
- Docs split into `docs/input/` (operational drawio specs) + `docs/output/` (UI feature specs); mega-doc `docs/my-account-flow.md` retired. Design-history doc `claim_detailed_tracking.md` demoted to `docs/output/` with a banner pointing at the canonical reference in `docs/output/returns/claim_tracking.md` §4.

## Phase 32 — invalid-claim takeover + ship-back

- `InvalidClaimCard` takeover (third after `DocsRejectedCard` / `PickupFailedCard`) routed via `claim.invalidClaim`. Danger hero (ops message + 7-day countdown) → on `Pay` flips to a brand-toned fresh-order trajectory (eyebrow rewrites to `Return from Claim RET-X`, 4-step horizontal timeline driven by `claim.invalidClaim.returnShipment.timeline`); on `Decline` flips to a muted "Claim closed — device not returned" terminal with a copy-locked reversal CTA.
- Mock 89940 (iPhone 11 Pro, battery claim, cell health 92%, awaiting return-shipping payment). `App.jsx` routing checks `invalidClaim` between `pickupFailure` and the generic `hasActiveClaim` fallback.

## Phase 31 — expert-revision surfaced inline, detailed-tracking disclosure removed

- `Show detailed tracking` disclosure on `ClaimCard` replaced with an always-visible pair of inline callouts above the dot strip when `subStatusId === 'expert_revision'` (past `Reviewing seller's response` + active `Expert inspection`). Copy sourced from `SUB_STATUS_LABELS`.
- `ClaimDetailedTimeline` + helpers (`shouldShowDetailedTracking`, `applicableSubStatuses`, `expectedByFor`, `isStepDelayed`, `detailedSteps`, `CLAIM_SUB_STATUSES`, `DEMO_NOW`, `parseDisplayDate`) deleted. `CLAIM_SLAS` + `SUB_STATUS_LABELS` survive.

## Phase 30 — pickup-failed card aligned with docs-rejected

- `PickupFailedCard` takeover (mirrors `DocsRejectedCard` chrome). Danger hero w/ courier message + countdown → on confirm flips to a warn-toned `Pickup rescheduled · New AWB created` state. Routes via new `claim.pickupFailure` field; mock 89876 rerouted off the inline `collection_failed` banner.

## Phase 29 — returns Step 4 process timeline + confirmation

- Step 4 of `ClaimFlow` gains a 7-row "What happens next" timeline (durations from `CLAIM_SLAS.expectedHours`) plus a required `pickupConfirmed` checkbox; Continue gated on both contact fields + confirmation. Old brand-tinted courier-pickup banner at the top of the step removed.

## Phase 28 — detailed claim tracking + action gates

- `ClaimActionBanner` (warn-toned inline gate above the dot strip when `claim.actionRequired` is set; three kinds: `awaiting_documents`, `collection_failed`, `awaiting_payment` — copy from `actionGateCopy()`).
- `ClaimDetailedTimeline` behind a `Show detailed tracking` disclosure inside `ClaimCard` (gated on `shouldShowDetailedTracking`); 9-entry sub-status catalog + SLA table added to `lib/claims.js`. New optional `claim.subStatusId` / `claim.detailedTimeline` / `claim.actionRequired` fields + `order.country`.
- Mocks 89876 (CoM, `collection_failed`) and 89762 (Issue, `expert_revision`) seeded.

## Phase 27 — history thread → minimalistic timeline

- `HistoryThread` horizontal chip row replaced with a vertical timeline (small tone-coloured glyphs on a thin rail), collapsed by default behind a `History · N earlier events` chevron toggle.
- Cancel-rejected event harmonised to `neutral` tone (was `danger`); `CircleSlash` glyph; rejection-reason copy tightened.
- Thread also rendered on `DeliveredOrderCard` (single `Order placed` row, new `'delivered'` mode in `getHistoryEvents`) and on cancelled `requested` cards.

## Phase 26 — evidence-resubmitted history chip

- New `evidence` event kind + `Evidence resubmitted` chip (UploadCloud, neutral) in `HistoryThread`. Driven by optional `claim.proofResubmission: { at, fileCount }`; wired on mock 89815.

## Phase 25 — documents-rejected card

- `DocsRejectedCard` (danger hero w/ ops free-text message + 3-day countdown, `Your last attempt` collapse with per-file red tags, single combined upload zone, 280-char note field, gated `Resubmit for review`; flips to warn-toned `Back under review` on submit).
- Routes via new `claim.docsRejection` field (mirrors `cancellationRejection` shape). Mock 89734 seeded.

## Phase 24 — claim type picker restructure

- Step 2 sub-issue picker (issue path) replaces flat 7-item category list with two expandable scopes (`Device not working as expected` — 15 items, `I received the wrong device` — 4 items). Per-selection inline guidance panel (`Try this first` / `What we need`). New `issueScope` + `issueSubtypeId` reducer fields; catalogue at `src/components/ClaimFlow/issueSubtypes.js`.
- Step 1 restructured into three top-level cards w/ one nested accordion: `Return an item` (CoM, top), non-selectable `Something's wrong with my device` expander revealing `Return for a refund or replacement` (issue) + `Use my warranty` (stub), `Request compensation` (stub). Damaged-in-transit / missing-items / other tiles gone.

## Phase 23 — history thread on layered cards

- `HistoryThread` component (horizontal chip row of past events w/ inline detail panel — one open at a time). Used in expanded `ClaimCard` and cancelled `PastOrderCard` (refund_pending / refunded). `getHistoryEvents(order, mode)` in `src/lib/events.js` derives the chip list.
- Optional `cancellationTimeline.rejected` + `cancellationRejection: { ref, reason }` fields. Layered mocks 89815 (cancel-rejected → delivered → under-QC claim) and 89200 (same path, refunded).
- `ClaimCard`'s `Original order — Delivered {date}` trace replaced by the history thread.

## Phase 22 — cancelled-card cleanup

- `RefundHero` eyebrow now reads `Cancellation · #{cancellationRef}` (parallel to `ClaimCard`'s `Claim · {type}`); expanded-section header `Refund progress` → `Cancellation progress`. New `cancellationRef` seeded `'4BTb2x'` on all cancelled mocks.
- `cancellationStepsFor` no longer hides `requested` on the created path — both paths render the same three steps (canonical labels via new `shortLabel` field on `CANCELLATION_STATUSES`).
- `FulfilmentTrace` row removed from expanded cancelled `PastOrderCard` (all three phases).

## Phase 21 — returns issue branch math + Step 6 polish + packing gate

- Issue-aware refund math: `refundBreakdown(order, units, method, claimType)` — issue + wallet adds flat `ISSUE_WALLET_BONUS` (AED 100), issue + card has no restocking fee. CoM math unchanged.
- Step 6 gains an `Issue` section (replaces `Reason` when `claimType === 'issue'`) + a required packing-confirmation gate above Submit (claim-type-aware copy; fixes the legacy bug where the form submitted with "I have not done the necessary testing" ticked).
- Step 5 cards branch on `claimType` (Issue + Wallet renders an accent `+AED 100 bonus` chip; Issue + original drops the breakdown table and −10% fee row).

## Phase 20 — returns issue branch skeleton

- Returns flow now branches on `claimType` at Step 2 (`Step2IssueDetails`: category dropdown + required description + fake attachment). New `issueDetails` reducer field; `canAdvance` requires all three for the issue branch. Step 1 `Faulty product` tile is in-scope; non-CoM tiles remain stubs.
- `claimTypeLabel()` + `CLAIM_TYPE_LABELS` (`Change of mind` / `Issue`) surfaced on Step 7, `ClaimCard` hero eyebrow, `ClaimDetailsSheet`. `Step 1` no longer auto-selects a claim type on entry; sticky-bar `Skip` scoped to CoM only.

## Phase 19 — review wallet treatment + ref + claim details polish

- Step 6 review refund row now mirrors Step 5's wallet treatment (icon + `Revibe Wallet` label + `WalletInfoTooltip`).
- `generateClaimRef()` returns a fixed `IXipP8` for screenshot stability.
- `ClaimDetailsSheet` drops the `Units` row.

## Phase 18 — refund-timeline anchor parity

- Step 5 + Step 7 refund-timeline copy anchored to `once return is complete` (fixes the implicit ambiguity that the clock starts at submit). Step 5 original-payment card drops the ETA pill chrome in favour of plain `Clock` icon + inline text.

## Phase 17 — Step 5 refund picker aligned with cancellation

- Step 5 cards visually + behaviourally mirror the cancellation sheet (`Recommended` pill removed from wallet; success-green tagline; inline breakdown table on original-payment).
- `refundBreakdown` now refunds Revibe Care (10% fee applies to warranty-inclusive gross). Eligible iPhone 13 refund: AED 939 → 1,029 wallet / 845.10 → 926.10 card.

## Phase 16 — Step 4 → pickup address & contact

- Step 4 of returns flow is now `Pickup address & contact` (was `How will you return it?`). Three method options gone — courier pickup is the only supported path. Three contact-field rows w/ bottom-sheet edit pattern; `canAdvance` requires all three.
- State slice renamed `returnMethod` → `pickupDetails: { address, email, phone }`. New `email` field seeded on every order. File renamed `Step4ReturnMethod.jsx` → `Step4PickupDetails.jsx`. `ClaimDetailsSheet`'s `Return method` row → three rows.

## Phase 15 — returns-flow simplification (9 → 7 steps)

- Old Step 2 (order selection) + Step 3 (product & quantity) removed — the delivered card is product-specific, so the item being returned is already named by the entry point. Flow is now `Claim type → Reason → Device prep → Return method → Refund method → Review → Confirmation`; always starts at Step 1.
- `Step6Review` (renamed from `Step8Review`) gains a read-only `Item` block (the item being returned is shown at the top of the review as context). `units` pinned at `1` in the reducer; `canAdvance(state, order)` second arg dropped.
- Step files renumbered to match new position; `groupOrdersByEligibility` kept (unused) for the eventual top-level entry.

## Phase 14 — claim-tracking card

- `ClaimCard` (fourth card type) tracks a submitted return through 7 states. Refund-hero family chrome; tone shifts amber → brand → success across the states (`claimToneFor`). 7-step horizontal dot timeline; `Original order — Delivered {date}` trace line; two-action footer.
- `ClaimDetailsSheet` bottom sheet (Summary + Refund cards). `src/lib/claims.js` is single source of truth (`CLAIM_STATUSES`, `claimToneFor`, `claimProgressIndex`, `claimPhaseTag`, `hasActiveClaim`, `isClaimRefunded`, plus summary-label helpers).
- `App.jsx` routes claim-carrying orders to `ClaimCard` (in_progress section for active; past for refunded; excluded from `delivered` chip count). Seeded claim on `89219` (`under_qc`); `89657` kept claim-less so the `Raise a claim` button on `PastOrderCard` has somewhere to launch.

## Phase 13 — cancel-flow polish + keep-my-order undo

- `KeepOrderSheet` lets a customer reverse an in-flight cancellation (brand-tinted hero w/ `RotateCcw` icon; on `refund_pending` adds a strip noting the pending refund will be cancelled). New `I want to keep my order` CTA on cancelled `PastOrderCard` (gated to `requested` / `refund_pending`).
- `CancelOrderSheet` names the card on the original-payment refund option (`back to Visa •• 4242` style) driven by new `paymentMethod` on in-flight orders. Dissuade fee-waiver sentence anchors on delivery, not shipping.

## Phase 12 — change-of-mind returns flow

- `ClaimFlow` overlay (9-step, checkout-style chrome, single `useReducer`, no session persistence — closing unmounts). Wired from `PastOrderCard`'s `Raise a claim`; `App.jsx` owns `claimFlowOrderId`.
- `src/lib/returns.js` — `eligibilityFor`, `groupOrdersByEligibility`, `refundBreakdown`, `generateClaimRef`, `RETURN_WINDOW_DAYS` (10), `RESTOCKING_FEE_RATE` (10%). Mock 89657 seeded w/ returns-flow fields (`deliveredOn`, `paymentMethod`, `deviceOs`); other orders fall into "Not eligible" naturally.
- Step 5 device prep is the operational keystone (factory-reset radio + iPhone/Android tabs + required confirmation, or credentials radio + fields + encryption disclosure). Refund math visible on Step 7 (wallet full vs original − 10% restocking). Step 9 generates ref + Copy button. Non-CoM tiles on Step 1 stubbed.

## Phase 11 — in-progress card + delivered card refresh

- `InProgressCard` (new component for non-cancelled `created` + `quality_check`) shares the refund-hero chrome family. `w-1` brand-purple accent strip; `Order · #id` eyebrow; state pill on its own row; brand-purple gradient hero; expanded body adds horizontal timeline w/ date+time under each reached dot + `Order details` collapse + Cancel/Change-details actions.
- `DeliveredOrderCard` rebuilt to match the refunded card's chrome (success-green accent strip + tinted hero w/ `Delivered on` headline). No longer expands.
- Delayed `quality_check` no longer flips the hero to warn-amber — stays brand-purple by design decision (delay surfaced subtly via tag swap + body copy). `OrderCard` is now reached only by shipped non-cancelled + in-flight cancelled-mid-fulfilment orders.

## Phase 10 — cancelled past orders redesign

- Refund-hero treatment in `PastOrderCard` for cancelled orders (warn / brand / success accent per phase). Hero leads with the refund amount + destination chip (gradient brand→accent for wallet, neutral for card). 3-step numbered dot stepper for refund progress; dimmed fulfilment trace ending in red ✕ at the cancel point.
- `refund` object seeded on all three cancelled mocks (subtotal / amount / destination / breakdown; card refunds also carry the 5% processing fee).
- `RefundDetailsSheet` bottom sheet (line items → subtotal → fee → total). `App.jsx` past-orders rendering simplified to a single `PastOrderCard` component.

## Phase 9 — cancellation take-rate dissuade

- Three-step `CancelOrderSheet` for original-payment + `created` orders (Select → Dissuade → Confirm): centered delivery-promise hero, neutral info strip about availability, soft-green strip promising fee waiver if Revibe misses the ship deadline. Wallet/non-created paths stay two-step.
- New `shipDeadline` / `shipDeadlineFull` fields on 89712. Confirm-step nudge trimmed (drops the wallet pitch since Dissuade carries it).

## Phase 8 — Revibe Wallet rebrand

- "Store credit" → "Revibe Wallet" everywhere in the cancellation flow. New `WalletInfoTooltip` component + `REVIBE_WALLET_ICON` constant (shared anywhere the wallet is named). Wallet icon + `i` tooltip on the `GreetRow` credits pill and the confirm-step destination line.
- Wallet refund option restyled (Recommended pill replaced by a green emphasis tagline).

## Phase 7 — Revibe Care + order-number eyebrow

- `Warranty` renamed to `Revibe Care` everywhere it surfaces (OrderCard / HeroCard / PastOrderCard / cancellation sheet breakdown). Field `order.warranty` unchanged; only copy + RE_CARE logo are new.
- Order number moved out of the product strip subtitle and into a top `Order · #id` eyebrow on `OrderCard`. Tiny `TOTAL` caption above the bold amount in the product strip (OrderCard + HeroCard) so it's unambiguous the figure is `Product + Revibe Care`.

## Phase 6 — cancellation flow

- `CancelOrderSheet` (two-step bottom sheet wired to the `Cancel order` button on `created` orders). Step 1: order-summary breakdown + two refund options (Store credit w/ Recommended pill, vs Original payment w/ 5% processing fee explicit). Step 2: confirm + danger-filled CTA. Confirmation does not yet persist (option A from planning).
- `subtotal` + `warranty` fields seeded on every mock order; `+ Warranty` line on `OrderCard` + `HeroCard` product strips. `slideUp` + `fadeIn` keyframes added.

## Phase 5 — post-handoff iteration

- Hero card gains a secondary action row (`Cancel order` w/ "you cannot cancel" tooltip + `Raise a claim`) and a "Delivery by [date]" subtitle under the status headline.
- `Change order details` action (programmatically opens the `<details>` collapse) replaces `Get help` on in-progress order cards; edit pills now surface on `quality_check` too. Delivered `PastOrderCard` gains a `Raise a claim` pill alongside `Download receipt`.
- In-progress timeline dedup (removes the double dot-timeline from collapsed → expanded). Cancelled past orders no longer render an action area.

## Phase 4 — My Account redesign handoff

- `HeroCard` (full-bleed purple→magenta gradient at the top of the list for the single most-in-flight order; light-on-dark dot timeline; primary `Track package` + ghost `Help`). Detailed-tracking expand visible only while shipped (courier strip + restyled sub-timeline).
- `PastOrderCard` (compact one-row card for delivered + cancelled). `GreetRow` (page title + count + gradient credits pill, replaces `StoreCreditsCard`). Section labels (`In progress` / `Other open orders` / `Past orders`). Chip count badges on `OrderFilters`. "Delivery by [date]" eta block in collapsed `OrderCard` for in-progress states. `Order details` collapse w/ delivery address + phone + order date + edit pills.
- Top chrome condensed (single sticky `Header` + `GreetRow` + search-inline `OrderFilters`). Brand palette extended (`brand-bg`, `brand-bg2`, `success-bg`, `warn`, `warn-bg`, `danger`, `danger-bg`, `line-2`, `ink-2`, `bg-hero-gradient`, `bg-credits-pill`, `slideDown`, `heroPulse`). Card radius 16 → 18px; button radius 8 → 10px. `In progress` chip renamed `Open`.

## Phase 3

- `StatusBanner` (tinted box w/ tone-coloured leading phrase + sentence describing the current step; four tones brand / success / warn / danger). `statusDescription(order)` resolves `cancelled → delayed → status defaults`; `order.statusMessage` overrides body. New optional `delayed` + `statusMessage` fields.
- `pickActiveOrderId(orders)` returns the single most-in-flight order id (highest `progressIndex × 10 + subProgressIndex`); auto-expand replaces auto-collapse (everything collapsed by default; only the most-in-flight card auto-expands). Delivered chip is green (overrides `state: 'close'`).
- Order filter chips actually filter the list; date-range dropdown plumbed (visibly inert today — all mocks fall inside every range); empty state added.
- `StoreCreditsCard` redesigned (gradient amount, single-line voucher row); `OrderFilters` flattened; `CourierBanner` track URL hardcoded to a known-good DHL test shipment (`tracking-id=3392654392`). `colors.page` token removed to fix a `text-page` color/font-size collision that had been making the "Orders" heading white-on-white.
- `CLAUDE.md` added at the repo root.

## Phase 2

- Two-tier status model: top-level `STATUSES` unchanged; new `SHIPPING_SUB_STATUSES` (`arrived_destination → cleared_customs → forwarded_to_agent → out_for_delivery`) apply only while `statusId === 'shipped'`.
- `ShippingSubTimeline` (vertical sub-timeline inside `OrderCard` while shipped). `CourierBanner` (carrier headline + `Track order` CTA, visible while shipped/delivered). Mock orders now cover every top-level stage plus a cancelled-at-QC order. Optional `estimatedDelivery` field; `statusHeadline` / `statusSubline` / `statusIconFor` / `subProgressIndex` helpers added.
- Collapsed `OrderCard` rebuilt in Noon-summary style (status icon + headline + chip + chevron + product + total + order id). `StatusTimeline` filled with brand colour for reached stages. Auto-collapse delivered + cancelled by default. Courier across all mocks switched Quiqup → DHL. `docs/my-account-flow.md` created.

## [0.1.0] — 2026-05-01 — phase 1 baseline

- React + Vite + Tailwind 3 + lucide-react scaffold. Mock orders + canonical status model (`src/lib/statuses.js`, `src/data/orders.js`).
- Account-home + order-list components: `PromoBar`, `Header`, `SearchBar`, `FiltersRow`, `StoreCreditsCard`, `OrderFilters`, `OrderCard`, `StatusTimeline`, `OrderSummary`, `ChatFab`.
- Inter via Google Fonts (Graphik substitute); local Revibe logo + product image in `public/`; `brief/design-system.md` updated.
