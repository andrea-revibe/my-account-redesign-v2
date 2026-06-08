---
status: live
verified_against: fe7f0cd
covers:
  - src/lib/journey.js
  - src/lib/eddSandbox.js
  - src/data/journey.js
  - src/data/journeys
  - src/components/JourneyDevPanel.jsx
  - src/components/EddSandboxPanel.jsx
---

# Journey mode

> Alternate demo for the prototype: `?journey=<id>` replaces the eight-card showcase with a single order replayed through one lifecycle, advanced via the floating `JourneyDevPanel`. Two purposes — immersive end-to-end demo of one customer journey, and the seed for a backend-event spec.

> **Detailed backend spec (event names, payloads, field deltas per transition) is intentionally deferred.** Once the data-warehouse column mapping is done, this doc will be rewritten against real backend columns. Until then it carries only what's needed to keep working on the prototype between sessions.

## Shipped journeys

Source of truth: `src/data/journey.js → JOURNEYS`. Today the array holds seven: `happy_path`, `dynamic_edd`, `cancellation`, `claim_change_of_mind`, `claim_issue`, `claim_warranty`, `claim_compensation`. `?journey=1` aliases the first journey; unknown ids fall back to the first.

The `cancellation` journey forks off `placed` into two cancellation entry points. **Before QC** (`created` stage): no supplier review — the request lands straight on `refund_pending` (a `requested` timestamp is still stamped so the stepper reads Requested ✓ → Pending), with no accepted/declined fork. **At QC** (`quality_check`, via `qc_started`): the request waits on an ops review (accepted vs declined); declined re-merges into the shipping chain. Each entry point forks on refund method (wallet vs card).

Both at-QC `cancellation_requested_*` nodes also fork to `cancellation_kept` — the customer-triggered *Keep my order* reversal, reachable only from `requested` (before the refund is accepted). It flips `state` back to `open`, voids `refund`, clears `cancellationStatusId`, leaves `statusId` (`quality_check`) untouched, and re-merges into the shipping chain so the kept order resumes to delivery. A `cancellationTimeline.reverted` timestamp + `cancellationReversal` marker survive so a `Cancellation reversed` chip shows in the delivered `HistoryThread`. Live-UI wiring: the cancel sheet's `handleCancelOrder` is **stage-aware** — it advances whichever of `cancel_before_qc_${branch}` / `cancellation_requested_${branch}` is in `validNext()`; `handleKeepOrder` (from `KeepOrderSheet`'s `onKeep`) advances `cancellation_kept`. Both are `validNext`-gated.

The warranty journey reuses the pre-claim chain (placed → QC → 4× shipping sub-statuses → delivered) and then submits a `type: 'warranty'` claim with no refund-method fork (Step 5 is skipped on warranty intake). Downstream forks are: pickup-failed loop (rejoins the trunk at `claim_transit_arrived_origin_hub`, same shape as the CoM journey), QC outcome (valid → repair → ship-back → device_returned; invalid → `claim.invalidClaim` set → customer pays → 4× return sub-statuses → delivered, *or* customer declines → terminal). Same convention for customer-triggered nodes: the dev panel surfaces them with the `via UI` chip so the demo can advance regardless of how much of the real surface is wired.

The issue journey is the only one that exercises all three action-needed takeovers in a single graph. Refund-method fork at submit mirrors the CoM journey (`*_wallet` carries the +AED 100 `ISSUE_WALLET_BONUS`; `*_card` carries no restocking fee — issue-branch math in `refundBreakdown`). Both submit nodes branch three ways into [picked_up, pickup_failed, docs_rejected]. `claim_docs_rejected` sets `claim.docsRejection` + `subStatusId: 'awaiting_documents'` + `actionRequired` (issue-flow-specific because change-of-mind has no attachment); `claim_docs_resubmitted` clears the takeover, sets `claim.proofResubmission` for the post-rejection HistoryThread chip, and re-merges into the pickup outcome fork. QC outcome fork mirrors warranty's: valid → refund_issued → refund_credited; invalid → `claim.invalidClaim` → paid (4× return sub-statuses → delivered) or declined.

The CoM journey now exercises the same invalid-claim sub-branch as the issue/warranty journeys (`claim_invalid_confirmed → claim_return_shipping_paid → 4× return sub-statuses → claim_invalid_return_delivered`, or `claim_invalid_declined`). Ops message is damage-on-arrival framing instead of issue's diagnostic framing — change-of-mind has no claimed issue to disprove, so invalidation surfaces when the device arrives damaged or condition-mismatched. The QC outcome fork (and both reset re-merges) now branch to [refund_issued, invalid_confirmed, …] in parity with issue/warranty.

The compensation journey is the simplest claim graph — no pickup / transit / device-prep / packing / reset legs, because the customer keeps the device and nothing is collected. It reuses the pre-claim chain (placed → QC → 4× shipping sub-statuses → delivered), then submits a `type: 'compensation'` claim with `amountPending: true` and no `expectedRefund`. Forks: sub-type at submit (`claim_submitted_shipping_refund` vs `claim_submitted_charger` — no refund-method fork, since the amount is deferred either way); an unclear-evidence loop (`claim_evidence_unclear` sets `claim.docsRejection` and reuses the issue flow's `DocsRejectedCard` takeover, then `claim_evidence_resubmitted` re-merges into review); and the review outcome (`claim_under_review` → `claim_refund_issued`, which *reveals* the amount by dropping `amountPending` and setting a sub-type-aware `expectedRefund`, → `claim_refund_credited`; **or** `claim_invalid_confirmed`, which sets `claim.invalidClaim` with ops copy **only** — no `returnShipping` / `returnShipment` — routing to `InvalidClaimCard` → `CompensationClosedCard` as a terminal with no pay/decline sub-branch). Ops messages are sub-type-aware (read from `o.claim.compensationSubtype` inside `apply`). `handleSubmitClaim` in `App.jsx` maps a compensation submit to `claim_submitted_${compensationSubtype}`.

The other three claim journeys (`claim_change_of_mind`, `claim_issue`, `claim_warranty`) extend their `claim_qc_started` fork with a `claim_reset_failed` branch — fires when the technician tries to wipe the device and Activation Lock is still on. Sets `claim.resetFailed` + `subStatusId: 'reset_failed'` + `actionRequired` (kind `reset_failed`), routing to `ResetFailedCard`. `claim_reset_details_received` (customer-triggered, advances via the dev panel's `via UI` chip — the card's submit is not yet wired to `journey.advance`) clears the takeover, sets `claim.resetUnlock: { at, attempt }`, and forks either back into the QC outcome (success) or into a one-shot retry (`claim_reset_retry_failed → claim_reset_retry_resubmitted`). The retry re-uses the same takeover with updated `opsMessage`, then unconditionally re-merges into the QC outcome on second submission — no third-failure path; production likely needs auto-cancel + return-shipment on a second failure, deferred until ops surfaces real failure-rate data.

`dynamic_edd` is the first **sandbox** journey — `kind: 'sandbox'`, `nodes: []`. There's no node graph to advance; instead, `useEddSandbox` owns four date inputs (today / order / QC / shipped) + an "actual delivered" toggle + a market selector (UAE / ZA / SA), and synthesises an order shape on every change. `App.jsx` swaps `JourneyDevPanel` for `EddSandboxPanel` (date pickers + a debug strip showing stage / elapsed / SLA verdict / message key / initial promise / EDD). The pure EDD model lives in `src/lib/edd.js` (1:1 port of `brief/edd.py` / `EDD_FINAL.xlsx`). Banner copy is injected via a new `order.statusBanner: { tone, lead, body }` field that fully overrides `statusDescription`'s status-driven defaults — the existing `statusMessage` only overrides body.

## Adding a new journey

1. **Sketch the nodes on paper first.** For each: `id`, `label`, `trigger` (`customer` or `system`), `event` (backend event name), and the exact field deltas `apply(order)` applies. The node *is* the spec — do this before writing code.
2. **Decide branching.** Default is linear (next node in the array). For forks, set `next: ['idA', 'idB']` on the source node — both ids must exist in `nodes`. Terminal nodes set `next: []` if they aren't last in the array. For converging branches, point the last node of each branch at the rejoin target's id.
3. **Author the journey config** as an entry in `JOURNEYS`. Reuse `INITIAL_ORDER` unless the journey starts from a meaningfully different shape. For minor overrides (e.g., a different `paymentMethod` so the journey exercises the BNPL disclaimer path — `claim_change_of_mind` does this today with a spread over `INITIAL_ORDER` setting `paymentMethod` to Tabby), spread `INITIAL_ORDER` inline rather than defining a sibling constant.
4. **Verify card routing.** Journey mode runs the projected order through `App.jsx`'s existing routing tree. If transitions land the order in a state no card handles, update routing too.
5. **Update meta docs.** One-line bullet at the top of `CHANGELOG.md` Unreleased.

## Conventions worth not re-discovering

- **Customer vs system triggers.** `customer` nodes should be driven by the real UI (sheet submits, button taps) — `App.jsx` listens for the submit event and calls `journey.advance(nodeId)`. `system` nodes (courier webhooks, ops decisions, supplier confirms) stay on the dev panel — there's no customer-facing surface that fires them.
- **`validNext()` gate is mandatory.** Real-UI handlers must check `journey.validNext().some(n => n.id === target)` before advancing. Without the gate, an out-of-sequence submit (cancel sheet opened at delivered, claim flow submitted at placed) would silently apply the wrong delta.
- **Hybrid architecture.** `JOURNEYS` is an array of top-level journeys (picker chip per journey in the panel). Branching lives *inside* a journey via the `next: [...]` field, not by adding a new top-level journey for every variant.
- **Refund-method branching pattern.** When a customer-triggered node forks on refund method, use sibling nodes (`*_wallet`, `*_card`) that converge later in the chain. Branch suffix maps to the sheet's refund-method value in `App.jsx` (`store_credit → wallet`, `original → card`).
- **Permissive panel (current default).** The dev panel renders Next buttons for `customer`-triggered nodes too, styled outlined with a `via UI` chip — flags that the real surface is the canonical path. Switch to strict (filter `trigger === 'customer'`) once 3+ customer-triggered nodes exist across journeys.
- **Path-based replay.** `useJourney` tracks `path: string[]` rather than a single cursor. Required for branched journeys — applying nodes 0..i in array order would silently misapply deltas as soon as the array contains nodes from unreachable branches.
- **`kind: 'sandbox'` for free-input journeys.** When a journey is parameter-driven (not event-driven), set `kind: 'sandbox'`, leave `nodes: []`, and pair it with a dedicated hook + panel. `App.jsx` calls *both* `useJourney` and the sandbox hook unconditionally (hook rules) and picks one based on `journey.kind`. The sandbox order shape feeds the existing card-routing tree unchanged — no new branches in the rendering pipeline.

## Source files

- `src/data/journey.js` — `INITIAL_ORDER` + `JOURNEYS` array.
- `src/lib/journey.js` — `useJourney(journeyId)` hook (`advance` / `back` / `reset` / `validNext`). Returns `kind: 'replay' | 'sandbox'` so `App.jsx` knows which panel to render.
- `src/lib/edd.js` — pure EDD model (markets, `workdayIntl`, `calculateEdd`, `orderStatus`, message constants). Port of `brief/edd.py`.
- `src/lib/eddSandbox.js` — `useEddSandbox(journey)` hook (date/market inputs → synthesised order with `statusBanner` override).
- `src/components/JourneyDevPanel.jsx` — replay panel (Next buttons + journey picker).
- `src/components/EddSandboxPanel.jsx` — sandbox panel (date inputs + debug strip + journey picker).
- `src/App.jsx` — `journeyMode` + `?journey=<id>` URL param; `handleCancelOrder` / `handleSubmitClaim` (customer-triggered advances; no-op in sandbox).
- `src/lib/statuses.js` — `statusDescription` honours `order.statusBanner` as a full override (used by the sandbox).
- `src/components/Header.jsx` — `Journey mode ×` chip (exits the mode).

## Editing this doc

Bloat-traps that grew the previous version:

| Don't add | Why |
|---|---|
| Per-transition payloads / field deltas / UI-surface notes | This is the backend spec — defer until real-column mapping |
| ASCII node graphs | Branching is in `src/data/journey.js`; redrawing duplicates and drifts |
| Worked-example expansions of wiring patterns | One pattern statement in conventions is enough |
| Per-journey "Open prototype gaps" subsections | Track unfinished work in `CHANGELOG.md` or GitHub issues |
| New top-level §sections per journey | A new convention is one bullet; a new recipe step is one numbered step |

When backend column mapping ships, replace this doc with the real spec.
