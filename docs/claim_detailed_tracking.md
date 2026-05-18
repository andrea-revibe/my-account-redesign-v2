# Claim detailed tracking

> Proposal for surfacing branch-specific sub-steps, per-step ETAs, and customer-action gates inside `ClaimCard`. Designed to reduce two flavours of inbound support call: "I expected this by now" and "I'm waiting on something but didn't realise it was on me." Not yet built — implementation follows sign-off on this doc.

## 1. Goals

- Cut "where is my claim?" calls by exposing a per-step ETA (`expectedBy`) and a delayed treatment past `expectedBy + buffer`.
- Cut "what am I waiting on?" calls by promoting customer-action gates so they can't be missed, with a visible deadline before auto-cancel.
- Keep the at-a-glance happy-path card identical to today. All new detail is opt-in, behind a secondary disclosure inside the expanded card.

## 2. Non-goals

- Surfacing internal (IS) status names. Only customer-facing (ES) labels appear in the UI.
- Restructuring the seven main parent dots in `CLAIM_STATUSES`. New sub-steps nest under existing parents; the horizontal strip is unchanged.
- Exposing the post-`refunded` seller-credit chain. Customers don't need it.
- Production-accurate SLAs. The numbers in § 4.3 are placeholders for ops to revise (see § 12).

## 3. Design at a glance

When `ClaimCard` is expanded, a third row appears below the existing horizontal dot strip:

```
┌─ expanded ClaimCard ────────────────────┐
│ [hero with status pill, refund amount]  │
│                                          │
│ CLAIM PROGRESS                          │
│ ●──●──●──●──○──○──○                     │  ← unchanged 7-dot strip
│ Sub  Pck Col Trn QC  Rdy  Ref           │
│                                          │
│ ⚠ Action needed — pickup didn't go      │  ← inline gate banner (if any)
│   through. Confirm by 18 May.           │     conditional on actionRequired
│   [ Schedule new pickup ]               │
│                                          │
│ ▸ Show detailed tracking                │  ← secondary disclosure
│                                          │
│ [history thread chips]                  │
│ [ View claim details ]  [ ⬇ ]           │
└──────────────────────────────────────────┘
```

Tapping **Show detailed tracking** slides open a vertical timeline (§ 7.2) that nests sub-steps under the active parent and shows `expectedBy` per step. Completed parents collapse to a one-line summary; the active parent expands inline; future parents show a relative estimate ("Usually ~2 days").

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

Renders directly above the dot strip when `claim.actionRequired` is present. Tone-warn (orange), full-width, rounded-card. Single CTA on the banner; "Cancel claim" / "Discuss with support" only appears in the detailed view to avoid crowding.

The deadline label uses the existing prototype convention from `claim.docsRejection.timeLeftLabel` ("2 days, 14 hours left") for consistency.

### 7.2 Vertical timeline

**Visibility.** The disclosure is hidden by default and only renders when the claim has an active `subStatusId` whose parent is `under_qc` (`expert_revision`, `under_revision`, `invalid_confirmed`, `awaiting_payment`, `ship_back_*`). Happy-path claims, pre-QC sub-statuses (which surface through the action banner instead), and delayed-without-deviation cases do not render it — the dot strip and any banner already carry enough signal. `shouldShowDetailedTracking(claim)` in `src/lib/claims.js` is the single source of truth for the trigger.

Once triggered, the disclosure renders below the dot strip when expanded. Structure:

- **Past parents** (index `< curIdx`): single line, "✓ {short} · completed in {duration}". Tap to expand a list of past sub-steps with their timestamps. One open at a time, mirroring `HistoryThread`.
- **Current parent** (`= curIdx`): expanded by default. Shows the sub-step the claim is currently on plus any earlier branch sub-steps under this parent, each with `startedAt` and (for current only) `expectedBy`.
- **Future parents** (`> curIdx`): single line, "○ {short} · Usually ~Nd" derived from SLA table.

Spacing and chrome reuse the layered-card history thread conventions (chip-style rows, brand-tone for active, muted for past/future).

### 7.3 Delayed treatment

When `now > startedAt + expectedHours + bufferHours` on the active step, the active sub-step row swaps to:

- An orange ring around the timeline node (consistent with `OrderCard` delayed shipping).
- Subline replaced with: "Taking longer than usual — usually ~{expected}, currently {elapsed}."

The hero status pill in the card stays its base tone — we don't double-signal. Only the detailed-view row turns orange.

### 7.4 Future-step preview

Future parents show "Usually ~Nd" (rounded to days when ≥ 24h, hours otherwise). No absolute date — that would over-promise. Customers see a clear "this should take roughly a week from now" estimate without a specific Tuesday committed.

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

1. **`89876` — Change-of-mind, country `AE`.** Parent `pending_collection`, `subStatusId: collection_failed`, `actionRequired.kind: collection_failed` with a 2-day deadline. Inserted **before** 89815. Exercises § 6.2 gate. The detailed-tracking disclosure does **not** render here — the banner already conveys the gate.
2. **`89762` — Issue, country `AE`.** Parent `under_qc`, `subStatusId: expert_revision`. No action required, but the LAB sub-flow makes the wait long. Inserted **after** 89815, **before** 89200. Exercises § 4.1 expert-revision branch, § 8 claim-type awareness (Issue + LAB), and is the **only** mock that exposes the detailed-tracking disclosure (per § 7.2 trigger).

Resulting order in `ORDERS` for the claim cluster:

```
... existing non-claim orders ...
89876                            ← new (pending_collection · collection_failed · action banner)
89815                            ← existing (under_qc · happy · no disclosure)
89762                            ← new (under_qc · expert_revision · Issue type · disclosure)
89200                            ← existing (refunded)
89734                            ← existing (claim_created · docs rejected → DocsRejectedCard)
```

An earlier draft of this spec included a third mock (`89880`, delayed in_transit) to exercise the delayed treatment in the detailed view. That mock was removed when the disclosure trigger narrowed to QC deviations only (§ 7.2). Delayed-without-deviation surfacing is now a follow-up — see § 12.

## 11. Doc & changelog updates

Per `CLAUDE.md` § "Doc update protocol", this is a behaviour change touching components, state shape, and routing:

- `docs/claim_detailed_tracking.md` — this doc (created).
- `docs/my-account-flow.md` — extend the ClaimCard section with a pointer to this doc and a short note about the disclosure pattern.
- `CHANGELOG.md` — `[Unreleased]` entry naming the feature.
- `CLAUDE.md` — add a "Mental model" bullet for the disclosure pattern (one line) and update "Where things live" if `ClaimCard`'s component children grow into a folder.

## 12. Open questions / future revisions

- **Delayed-without-deviation surfacing.** A claim that's late on a happy-path step (e.g., `in_transit` past expected + buffer) currently has no visible signal on the card, because the detailed-tracking disclosure is hidden for non-QC-deviations (§ 7.2). Likely follow-up: a small delayed treatment on the active dot in the horizontal strip, or a delayed subline on the hero. Out of scope for this iteration.
- **SLA accuracy.** All numbers in § 4.3 are placeholders. Ops to source p50/p90 actuals from production claims and revise before any production rollout.
- **Country-aware transit SLAs.** `in_transit` SLA likely differs domestic vs international. Deferred — for the prototype, one global value suffices.
- **Invalid-claim parent arrest.** When a claim resolves as invalid + shipped back, the seven-dot strip arrests at `under_qc` and the resolution lives only in the detailed view. Considered acceptable for the prototype since this is a rare path; future iterations could add an 8th parent or terminal-state hero.
- **`DocsRejectedCard` vs `awaiting_documents`.** They cover the same operational state. Three options: (a) keep both, route by `claim.docsRejection` presence; (b) deprecate `DocsRejectedCard` and route everything through `ClaimCard` + `subStatusId: awaiting_documents` + `actionRequired`; (c) merge `claim.docsRejection` into `actionRequired`. Decision deferred — current scope keeps both and treats them as distinct cards. Recommended path is (b) once the new flow is validated.
- **Persistence of disclosure state.** Should "Show detailed tracking" stay open across re-renders or always collapse back? Current proposal: per-card local state, not persisted. Matches the rest of the prototype.
- **Telemetry hooks.** Production should fire events when (i) detailed tracking is opened, (ii) an action gate banner is dismissed, (iii) an action gate CTA is tapped. Out of scope for the prototype.
- **Seller-credit chain.** Hidden, per agreement. If/when it surfaces, it would live in `ClaimDetailsSheet` rather than the card.
