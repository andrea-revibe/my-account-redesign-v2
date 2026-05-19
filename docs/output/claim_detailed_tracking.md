# Claim detailed tracking

> **Reference tables have moved.** The canonical reference for the sub-status enum (§ 4.1), sub-status copy catalog (§ 5), action-gate copy (§ 6), and SLA placeholders (§ 4.3) now lives in [returns/claim_tracking.md](./returns/claim_tracking.md) § 4. **This file is design history** — the original proposal for the deprecated `Show detailed tracking` disclosure, kept for the trail of reasoning behind two failed iterations.
>
> **Current state.** `ClaimCard` no longer surfaces QC sub-statuses inline. Two iterations both ended up pulled:
> 1. Phase 28: a `Show detailed tracking` disclosure backed by a vertical timeline + `detailedSteps()` / `isStepDelayed()` / `expectedByFor()` helpers (§ 4.3, § 8). Removed in phase 31 — usage data showed customers rarely opened it.
> 2. Phase 31: an always-visible pair of inline callouts above the dot strip when `subStatusId === 'expert_revision'` (past `Reviewing seller's response` + active `Expert inspection`). Removed in phase 33 — competed visually with the dot strip and only fired for a single sub-status.
>
> The `SUB_STATUS_LABELS` copy registry survives in `src/lib/claims.js` for ops reference. The `See detailed tracking` dropdown that ships today is unrelated — it's a courier sub-timeline gated to `claimStatusId === 'in_transit'`, not a QC-sub-flow surface.
>
> Original framing kept below for reference: proposal for surfacing branch-specific sub-steps, per-step ETAs, and customer-action gates inside `ClaimCard`. Designed to reduce two flavours of inbound support call: "I expected this by now" and "I'm waiting on something but didn't realise it was on me."

## 1. Goals

- Cut "where is my claim?" calls by exposing a per-step ETA (`expectedBy`) and a delayed treatment past `expectedBy + buffer`.
- Cut "what am I waiting on?" calls by promoting customer-action gates so they can't be missed, with a visible deadline before auto-cancel.
- Keep the at-a-glance happy-path card identical to today. All new detail is opt-in, behind a secondary disclosure inside the expanded card.

## 2. Non-goals

- Surfacing internal (IS) status names. Only customer-facing (ES) labels appear in the UI.
- Restructuring the seven main parent dots in `CLAIM_STATUSES`. New sub-steps nest under existing parents; the horizontal strip is unchanged.
- Exposing the post-`refunded` seller-credit chain. Customers don't need it.
- Production-accurate SLAs. The numbers in § 4.3 are placeholders for ops to revise (see § 12).

## 3. Design at a glance (current shape — phase 31)

When `ClaimCard` is expanded for a claim with `subStatusId: 'expert_revision'`, the QC sub-flow is surfaced inline above the dot strip — no disclosure, no tap required:

```
┌─ expanded ClaimCard ────────────────────┐
│ [hero with status pill, refund amount]  │
│                                          │
│ CLAIM PROGRESS                          │
│ ┌──────────────────────────────────┐    │
│ │ ✓ Reviewing seller's response  10 May│ ← past sub-status (muted)
│ │   Our team is double-checking…   │    │
│ └──────────────────────────────────┘    │
│ ┌──────────────────────────────────┐    │
│ │ ● Expert inspection              │    │ ← active sub-status (brand)
│ │   Sent to our lab for a closer   │    │
│ │   look. This step takes longer…  │    │
│ └──────────────────────────────────┘    │
│ ●──●──●──●──◉──○──○                     │ ← unchanged 7-dot strip
│ Sub  Pck Col Trn QC  Rdy  Ref           │
│                                          │
│ ⚠ Action needed — pickup didn't go      │ ← inline gate banner (if any)
│   through. Confirm by 18 May.           │   conditional on actionRequired
│   [ Schedule new pickup ]               │
│                                          │
│ [history thread chips]                  │
│ [ View claim details ]  [ ⬇ ]           │
└──────────────────────────────────────────┘
```

The inline notes are always visible (no disclosure). Today the trigger is hardcoded to `subStatusId === 'expert_revision'`; if more QC sub-statuses need surfacing the gate can generalise without touching the rendering.

## 4. Data model

### 4.1 Sub-status enum

Added as an *optional* `claim.subStatusId`. When present, drives the detailed view; when absent, claim is on happy path of its parent.

| `subStatusId` | Parent | Applies to | Source (flow doc node) |
|---|---|---|---|
| `awaiting_documents` | `claim_created` | Issue only | issue n6 / n7 |
| `collection_failed` | `pending_collection` | Both | issue n18 / com n20, n30 |
| `under_revision` | `under_qc` | Both | issue n31 / com n43, n72 |
| `expert_revision` | `under_qc` | Issue + CoM UAE/Other | issue n33–n39 / com n45–n51 |
| `invalid_confirmed` | `under_qc` | Both | issue n41 / com n53 |
| `awaiting_payment` | `under_qc` | Both (post-invalid) | issue n42 / com n54 |
| `ship_back_pending` | `under_qc` | Both (post-payment) | issue n45 / com n57, n76 |
| `ship_back_in_transit` | `under_qc` | Both | issue n49–n51 / com n59–n61, n79 |
| `ship_back_delivered` | `under_qc` | Both — terminal for invalid | issue n53 / com n63, n81 |

The ship-back chain hangs off `under_qc` rather than `ready_for_refund`, because in an invalid-claim outcome the claim never reaches `ready_for_refund` — the parent strip arrests at `under_qc` and the resolution is communicated through the detailed view (acknowledged trade-off — see § 12).

### 4.2 Claim object additions

```js
claim: {
  // ...existing fields...
  subStatusId: 'collection_failed',          // optional, see § 4.1
  detailedTimeline: {                        // optional, same shape as timeline
    collection_failed: { startedAt: '16 May · 8:20 AM',
                         expectedBy:  '16 May · 5:00 PM' },
  },
  actionRequired: {                          // optional, drives § 6 banner
    kind: 'collection_failed',               // matches subStatusId for action gates
    deadline: '18 May · 8:20 AM',
    deadlineLabel: '2 days left',
  },
}
```

Per-step ETAs live in `detailedTimeline[stepId].expectedBy`. For steps that haven't started yet, `expectedBy` is omitted; the UI shows a relative estimate derived from the SLA table.

### 4.3 SLA table (placeholders — for ops revision)

Lives in `src/lib/claims.js` as a constant. The function `expectedByFor(step, claim)` adds `expectedHours` to `startedAt` to produce `expectedBy` for steps that have started but lack an explicit value, and renders a "Usually ~Nd" estimate for future steps. The delayed treatment fires when `now > startedAt + expectedHours + bufferHours`.

| Step | Expected | Buffer | Notes |
|---|---|---|---|
| `claim_created` → `pending_collection` | 1h | 4h | Routing is automated for change-of-mind; Issue may pause at `awaiting_documents`. |
| `awaiting_documents` (Issue only) | 48h | 48h | Customer-action gate; the deadline below comes from `actionRequired.deadline`, not SLA. |
| `pending_collection` → `under_collection` | 24h | 24h | Courier pickup scheduling. |
| `collection_failed` (branch) | n/a | n/a | Customer-action gate; SLA replaced by `actionRequired.deadline`. |
| `under_collection` → `in_transit` | 12h | 12h | Same-day handoff to courier. |
| `in_transit` → `under_qc` | 48h | 48h | Placeholder. Country-aware SLAs deferred to § 12. |
| `under_qc` → `ready_for_refund` | 48h | 48h | Happy-path inspection. |
| `under_revision` (branch) | 48h | 48h | Agent reviewing seller's invalid-claim proof. |
| `expert_revision` (branch) | 120h | 72h | LAB sub-flow — explicitly longer; customers should expect it. |
| `awaiting_payment` (branch) | n/a | n/a | Customer-action gate. |
| `ship_back_pending` → `ship_back_in_transit` | 48h | 24h | After payment received. |
| `ship_back_in_transit` → `ship_back_delivered` | 72h | 48h | Final leg. |
| `ready_for_refund` → `refunded` | 24h | 24h | Automated refund posting. |

> **Placeholder.** Ops to revise. These numbers are guesses based on the operational flow docs, not measured medians. Track current actuals before promoting these to production.

## 5. Sub-step catalog (customer-facing copy)

All copy below is *customer-facing* — the rewrites agreed in brainstorm. Internal (IS) labels never appear in the UI.

| `subStatusId` | Headline | Subline | Tone |
|---|---|---|---|
| `awaiting_documents` | More info needed | "Revibe Quality asked for a clearer photo / longer video." | warn |
| `collection_failed` | Pickup didn't go through | "We couldn't collect on {date}." | warn |
| `under_revision` | Reviewing seller's response | "Our team is double-checking the seller's notes." | brand |
| `expert_revision` | Expert inspection | "Sent to our lab for a closer look. This step takes longer than usual." | brand |
| `invalid_confirmed` | Claim couldn't be approved | "Inspection didn't confirm the issue you reported." | warn |
| `awaiting_payment` | Payment needed to return device | "Cover return shipping to get your device back." | warn |
| `ship_back_pending` | Preparing to send your device back | "Arranging a courier — should be on the way in a day or two." | brand |
| `ship_back_in_transit` | Your device is on the way back | "Tracking will appear here once the courier scans it in." | brand |
| `ship_back_delivered` | Device returned | "Delivered on {date}." | success |

## 6. Action gates

Three gates total. Each fires a promoted banner above the dot strip *and* a more detailed row inside the vertical timeline. The banner always carries: tone-warn treatment, headline, one-line body, deadline countdown, primary CTA. The detailed-timeline row carries fuller context and the secondary CTA (usually "Cancel claim" / "Discuss with support").

### 6.1 `awaiting_documents` (Issue only)

- **Banner headline:** Action needed — documents requested
- **Body:** "{opsName} from Revibe Quality has asked for a clearer photo / longer video."
- **Deadline:** "Reply by {deadline} or the claim will close automatically."
- **Primary CTA:** Reply with documents
- **Secondary CTA:** Close claim

This is the same surface as the existing `DocsRejectedCard` (order 89734). Open question in § 12 — keep both, merge into one, or route via `subStatusId` instead of `docsRejection`?

### 6.2 `collection_failed` (both flows)

- **Banner headline:** Action needed — pickup didn't go through
- **Body:** "Our courier couldn't pick up your device on {failedAt}."
- **Deadline:** "Confirm by {deadline} or the claim will close automatically."
- **Primary CTA:** Schedule new pickup
- **Secondary CTA:** Cancel claim

### 6.3 `awaiting_payment` (both flows, post-invalid)

- **Banner headline:** Action needed — return shipping payment
- **Body:** "Your claim couldn't be approved after inspection. Cover the return shipping fee to get your device sent back."
- **Deadline:** "Pay by {deadline} or your device will not be returned."
- **Primary CTA:** Pay return shipping
- **Secondary CTA:** Discuss with support

## 7. Visualization

### 7.1 Inline gate banner

Renders directly above the dot strip when `claim.actionRequired` is present. Tone-warn (orange), full-width, rounded-card. Single CTA on the banner.

The deadline label uses the existing prototype convention from `claim.docsRejection.timeLeftLabel` ("2 days, 14 hours left") for consistency.

### 7.2 Inline sub-status notes (current shape)

Rendered by the `SubStatusNote` helper inside `src/components/ClaimCard.jsx`, slotted between the `CLAIM PROGRESS` eyebrow and the horizontal dot strip. Today the gate is `claim.subStatusId === 'expert_revision'` — when true, two stacked callouts render:

- **Past `under_revision` row** — `state="past"`, `completedAt` = `claim.detailedTimeline.expert_revision.startedAt`. Muted chrome (`bg-line-2/60`, `border-line`), green success check on the left, day stamp on the right (e.g. "13 May"), subline in `text-muted`. Communicates "the seller-response review step is done."
- **Active `expert_revision` row** — `state="current"`. Brand-tinted chrome (`bg-brand-bg`, `border-brand-bg2`), brand-toned dot, headline in `text-brand` font-bold, subline in `text-ink-2`. Carries the "Sent to our lab for a closer look. This step takes longer than usual." wait signal.

Both rows source headline + subline from `SUB_STATUS_LABELS[subStatusId]` so copy stays single-sourced. No vertical rail, no "Done · {duration}" annotation, no future-step preview — the inline shape deliberately trims everything except the two adjacent sub-statuses that frame the current wait.

### 7.3 Wait signal

Carried entirely in the active row's subline copy ("This step takes longer than usual."). No badge, no chip, no orange ring — the surrounding brand-tinted card already says "this is where you are." The earlier "delayed treatment" (orange ring + elapsed-vs-expected math) was tied to `isStepDelayed()` and was removed alongside the disclosure.

## 8. Claim-type awareness

The detailed-step list is computed by `detailedSteps(claim, order)` in `lib/claims.js`. It returns only the rows applicable to this claim's `type` and (where relevant) `order.country`.

| Behavior | Change-of-mind | Issue |
|---|---|---|
| `awaiting_documents` step before pickup | Never appears | Conditionally appears (when ops requests info) |
| `expert_revision` sub-step | UAE/Other invalid-claim path only; ZA/SA path loops via `under_revision` instead | Always possible (single supplier path) |
| `under_revision` sub-step | Yes (both country tracks) | Yes |
| Ship-back chain | Yes (both country tracks; ZA/SA omits the "ship back under collection" intermediate state) | Yes |

`order.country` is not currently in the data shape but should be added (default `'AE'`) so the function can branch correctly. For the prototype, only `'AE'` and `'ZA'` need to be supported.

## 9. Routing impact

None. `App.jsx` still routes any claim with `hasActiveClaim` to `ClaimCard`, and any `isClaimRefunded` to `ClaimCard` (past). The new view lives entirely inside `ClaimCard`'s expanded state. `DocsRejectedCard` continues to handle `claim.docsRejection` separately (see open question in § 12).

## 10. Mock orders

Two new mocks added to `src/data/orders.js`, slotted within the existing layered-claim cluster, ordered by claim-progression:

1. **`89876` — Change-of-mind, country `AE`.** Parent `pending_collection`, `subStatusId: collection_failed`, `actionRequired.kind: collection_failed` with a 2-day deadline. Routed today to `PickupFailedCard` (see `docs/output/returns/claim_tracking.md` §3.2) rather than `ClaimCard`; the original phase-28 wiring was supplanted in phase 30. Exercises § 6.2 gate.
2. **`89762` — Issue, country `AE`.** Parent `under_qc`, `subStatusId: expert_revision`. No action required, but the LAB sub-flow makes the wait long. Carries `claim.detailedTimeline.under_revision.startedAt` and `claim.detailedTimeline.expert_revision.startedAt`; the latter doubles as the completion timestamp for the past `under_revision` callout. Exercises § 4.1 expert-revision branch and § 7.2 inline sub-status notes — the only mock today that surfaces the QC sub-flow on the card.

Resulting order in `ORDERS` for the claim cluster:

```
... existing non-claim orders ...
89876                            ← pending_collection · collection_failed (PickupFailedCard)
89815                            ← under_qc · happy (no inline notes)
89762                            ← under_qc · expert_revision (inline notes)
89200                            ← refunded
89734                            ← claim_created · docs rejected (DocsRejectedCard)
```

An earlier draft of this spec included a third mock (`89880`, delayed in_transit) to exercise the delayed treatment in the detailed view. It was dropped when the disclosure trigger narrowed to QC deviations; delayed-without-deviation surfacing remains a follow-up (§ 12).

## 11. Doc & changelog updates

Per `CLAUDE.md` § "Doc update protocol", this is a behaviour change touching components, state shape, and routing:

- `docs/output/claim_detailed_tracking.md` — this doc (created; later moved into `docs/output/` when the docs folder was reorganised into `input/` and `output/`).
- `docs/output/returns/claim_tracking.md` — canonical reference for the sub-status enum, sub-status copy, action-gate copy, and SLA placeholders.
- `CHANGELOG.md` — `[Unreleased]` entry naming the feature.
- `CLAUDE.md` — add a "Mental model" bullet for the disclosure pattern (one line) and update "Where things live" if `ClaimCard`'s component children grow into a folder.

## 12. Open questions / future revisions

- **Generalising the inline-notes gate.** Today the trigger is hardcoded to `subStatusId === 'expert_revision'`. Other QC sub-statuses with a non-trivial customer narrative (e.g., `ship_back_pending` / `_in_transit` showing return shipping after an invalid claim) would benefit from the same treatment but need their own data-shape additions (e.g., a `ship_back` tracking link or AWB).
- **Delayed-without-deviation surfacing.** A claim that's late on a happy-path step (e.g., `in_transit` past expected + buffer) currently has no visible signal on the card. The original spec routed this through the (now-removed) vertical timeline's orange-ring treatment. Likely follow-up: a small delayed badge on the active dot in the horizontal strip, or a delayed subline on the hero.
- **SLA accuracy.** All numbers in § 4.3 are placeholders. `CLAIM_SLAS` still ships (it backs the Step 4 "What happens next" timeline in `ClaimFlow`), so ops should still revise these before production rollout.
- **Country-aware transit SLAs.** `in_transit` SLA likely differs domestic vs international. Deferred — for the prototype, one global value suffices.
- **Invalid-claim parent arrest.** ~~When a claim resolves as invalid + shipped back, the seven-dot strip arrests at `under_qc` and there's no equivalent of the old detailed view to communicate the ship-back chain.~~ **Resolved in phase 32** by `InvalidClaimCard` — when inspection determines a claim is invalid the card flips into a dedicated takeover (mirroring `DocsRejectedCard` / `PickupFailedCard`) that surfaces the action gate (pay return shipping), and on `paid` morphs into a fresh-order-style trajectory driven by `claim.invalidClaim.returnShipment` rather than trying to extend `CLAIM_STATUSES`. Trade-off: the seven-dot strip never appears on this path — the customer's mental model is "claim → ship-back order," not "claim with a long ship-back tail," which matches the operational reality better.
- **`DocsRejectedCard` vs `awaiting_documents`.** They cover the same operational state. Three options: (a) keep both, route by `claim.docsRejection` presence; (b) deprecate `DocsRejectedCard` and route everything through `ClaimCard` + `subStatusId: awaiting_documents` + `actionRequired`; (c) merge `claim.docsRejection` into `actionRequired`. Decision deferred — current scope keeps both and treats them as distinct cards. Recommended path is (b) once the new flow is validated.
- **Telemetry hooks.** Production should fire events when (i) an action gate banner is shown, (ii) an action gate CTA is tapped. The original "detailed tracking opened" event is moot now that there's no disclosure.
- **Seller-credit chain.** Hidden, per agreement. If/when it surfaces, it would live in `ClaimDetailsSheet` rather than the card.
