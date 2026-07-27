---
status: live
verified_against: c2cd56d
covers:
  - src/data/journeys
  - src/data/journey.js
  - src/data/notifications
  - src/lib/notifications.js
---

# Notifications flow

> **What this doc is.** The customer-notification *strategy* layered over the journeys in [`journey_backend_spec.md`](../output/journey_backend_spec.md): for every backend `event` a journey fires, **which channels notify the customer — mobile push, email, WhatsApp — and why.** It is the output of a channel-strategy discussion, so it also records where we deliberately stay **silent**, and where today's coverage differs from the target (the `Δ` markers).
>
> **Boundary.** `journey_backend_spec.md` owns the *mechanism* (how an event resolves to copy → the `JourneyNotificationPanel`). This doc owns the *policy* (which channel fires when). Events are named by their real `event` strings so the two stay in lockstep. Copy itself is authored by the owner in `src/data/notifications/*` — this doc never quotes message text, only decides the trigger + channel.
>
> **Push is a forward-looking proposal.** The prototype's notification model today has only two channel fields — `whatsapp` and `email` (confirmed across `src/data/notifications/*` and `notificationFor`). **No `push` field exists yet.** Every `Push ✓` below is a *decision on paper*; wiring push into the data shape and the preview panel is deliberately out of scope for this doc (see [§7](#7-what-would-change-in-code-not-in-this-pass)).

---

## Source of truth — the 15 official return-flow emails

The change-of-mind, issue, and warranty return journeys have a **confirmed email flow: 15 official emails** (collected 2026-07-17, stored under `emails/1–15.jpg`). These are the authoritative *Current* state for those journeys; the interactive comparison [`notifications-flow.html`](./notifications-flow.html) embeds each one (tap a node to view the real email). Order/shipment and compensation email sets are not yet collected, so those journeys stay a draft.

**Two open items** carried into the matrix:
- **Current WhatsApp is pending confirmation** — email is confirmed from the screenshots; some steps may already send WhatsApp. Shown email-only until confirmed.
- **Push is a proposal** — no `push` field exists in the system yet.

### The 15 emails → events (+ channel recommendation)

| # | Email | → event (nearest) | Today | Proposed add |
|---|---|---|---|---|
| 1 | Form Received | `claim.created` | Email | +WhatsApp |
| 2 | Pending Collection | `claim.documents.accepted` (CoM folds into `claim.created`) | Email | +WhatsApp +Push |
| 3 | Under Collection *(courier on the way + AWB)* | `claim.awb.generated` | Email | +WhatsApp +Push |
| 4 | Collection Failed | `claim.pickup.failed` | Email | +WhatsApp +Push |
| 5 | In Transit | `claim.transit.picked_up` | Email | +WhatsApp |
| 6 | Under QC | `claim.qc.started` | Email | +WhatsApp |
| 7 | Under Revision | `claim.qc.started` *(folded)* | Email | consolidate |
| 8 | Expert Revision | `claim.qc.started` *(folded)* | Email | consolidate |
| 9 | Invalid Claim Confirmed | `claim.inspection.invalid_confirmed` | Email | +WhatsApp +Push |
| 10 | To Ship Back | `claim.ship_back.created` | Email | +WhatsApp |
| 11 | Shipped Back Under Collection | `claim.ship_back.created` *(folded)* | Email | consolidate |
| 12 | Shipped Back | `claim.ship_back.out_for_delivery` | Email | +WhatsApp +Push |
| 13 | Delivered | `claim.device.returned` | Email | +WhatsApp +Push |
| 14 | Ready for Refund | `claim.refund.issued` *(CoM / issue only)* | Email | +WhatsApp +Push |
| 15 | Refunded | `claim.refund.completed` *(CoM / issue only)* | Email | +WhatsApp +Push |

**Channel logic (point 1).** Email stays everywhere (the record). Add **WhatsApp** broadly — high open-rate, conversational, primary wherever the customer must act. Add **Push** on the waited-on / action / money moments (courier on the way, out for delivery, verdict, refund). Two **over-communication flags**: the review cluster (#6 → #7 → #8 = three "we're reviewing" touches → consolidate to one customer-facing beat, keep the internal escalations email-only or in-app) and the return-leg prep pair (#10 + #11 → one beat). Warranty uses none of the refund emails (#14/#15) — it repairs and returns the device.

**Gaps — steps with no email today that should notify (point 2).**
- `claim.documents.rejected` / `claim.evidence.unclear` — **resubmit needed** → Email + WhatsApp + Push (claim stalls).
- `claim.documents.resubmitted` — received → WhatsApp ack.
- `claim.pickup.rescheduled` — **new collection confirmed** → Email + WhatsApp + Push (closes the failed-collection loop).
- `claim.awb.failed` — **confirm address** → Email + WhatsApp + Push (blocks pickup).
- `claim.reset.failed` / `claim.reset.retry_failed` — **device still locked** → Email + WhatsApp + Push (blocks QC); `claim.reset.details_received` → WhatsApp ack.
- `claim.cancelled` / `claim.declined` — → Email + WhatsApp.
- `claim.repair.started` — **warranty "under repair"** has no email → Email + WhatsApp.

> The generic channel-role model and per-event matrix below still stand — the emails simply pin the *Current* column for the three return journeys. Where an official email exists, that step's "today" is Email (not the earlier prototype-derived draft).

---

## 1. The three channels

| Channel | Its job | Strengths | When it is *wrong* |
|---|---|---|---|
| **Push** *(new)* | The glanceable nudge back into the app — announces a status change the moment it happens and drives a tap into the live tracker. | Real-time, zero-cost, high-immediacy. | As the **sole** channel for anything the customer must keep (money, receipts) or act on with a document — push is ephemeral and easily dismissed. |
| **Email** | The durable record — confirmations, receipts, refund/settlement proof, and any action carrying an attachment or paper trail. | Permanent, forwardable, the channel finance/support point back to. | For every micro-step — inbox fatigue erodes the whole channel. Reserve it for confirmations, money, terminals, and actions. |
| **WhatsApp** | The conversation + action rail — two-way, in the customer's primary messenger. Primary for anything the customer must *act* on, plus the headline progress beats. | Highest open rate, two-way (a stalled claim gets unstuck here). | For silent logistics noise — over-messaging trains the customer to mute the thread. |

**Primary-channel rule for actions:** when the customer must *do* something, **WhatsApp is primary** (two-way), push is the nudge, and email is the record. The in-app takeover card (`DocsRejectedCard`, `PickupFailedCard`, `ResetFailedCard`, `AwbFailedCard`, `InvalidClaimCard`) is always the surface the notifications point *to*.

---

## 2. Selection rules (event class → channels)

Every event is tagged with exactly one **class**; the class sets the default channel mix. The matrix in §4–6 applies these rules row by row and flags any deviation.

| Class | Push | Email | WhatsApp | What it means |
|---|:--:|:--:|:--:|---|
| **Confirmation** | — | ✓ | ✓ | A thing is now true and recorded (order placed, claim opened). Email = the receipt. |
| **Progress** | — | — | ✓ | Something moved, no action needed. WhatsApp keeps them informed without inbox cost. |
| **Progress — waited-on** | ✓ | — | ✓ | A beat the customer is actively waiting on (out for delivery, picked up). Push earns its place here. |
| **Terminal / high-value** | ✓ | ✓ | ✓ | The outcome moment (delivered, device returned, refund credited). Worth all three. |
| **Action-needed** | ✓ | ✓ | ✓ | The claim stalls until the customer acts. All three, **WhatsApp primary**; email is the record of *what* was asked. |
| **Settlement / money** | ✓ | ✓ | ✓ | Money moved. Push (they wait on it) + email (the record) + WhatsApp. |
| **Logistics micro-step** | — | — | — | Customs scans, hub hops, label generation. Visible only in the in-app tracker. |
| **Background / ops** | — | — | — | Invisible internal beats (SLA-breach detection, ops approvals, delivery checks). Some surface as an in-app banner, none as push/email. |

**Applied defaults** (the four decisions from the kickoff, resolved to the recommended option):
1. **Push cadence** — push fires only on *waited-on* progress beats (out-for-delivery, shipped, picked-up), terminals, actions, and money — **not** every progress milestone.
2. **Surface currently-silent beats** — `order.refund.completed`, `claim.awb.failed`, `claim.repair.started` are promoted from silent to notified.
3. **Compensation verdicts** — `claim.review.invalid_confirmed` and `claim.evidence.unclear` are treated as customer-facing (notified), not silent.
4. **Country split** — recorded briefly ([§6.4](#64-country-split-fewer-beats-for-saothers)); SA/Others collapse shipping legs, so those journeys fire fewer progress notifications.

---

## 3. Reading the matrix

- **Channels:** `✓` = notify on that channel · `—` = silent on that channel. Every `Push ✓` is net-new (see the banner above).
- **Today** = current coverage in `src/data/notifications/*`, graded by the existing `status` model: `live` (authored WA+Email) · `missing` (placeholder marker, no copy) · `silent` (no entry at all).
- **Δ** = how the proposal differs from today, and therefore the work it implies:
  - **`+push`** — add push to an already-authored comm (needs the push data-model, §7).
  - **`−email`** — trim email from a mid-flow progress beat (inbox fatigue).
  - **`author`** — currently silent/missing; the owner needs to write copy.
  - *no marker* — proposal matches today.
- Events are grouped to mirror the code's own factoring (a shared spine + per-journey deltas), **not** repeated once per journey. `claim.*` beats shared by change-of-mind / issue / warranty are listed once in §6.1.

---

## 4. Shared order + shipment spine

Fires identically in **all six** node journeys (`happy_path`, `cancellation`, and the four claim journeys) — the `placed → delivered` chain.

| Event | Trigger (plain language) | Push | Email | WA | Class | Today → Δ |
|---|---|:--:|:--:|:--:|---|---|
| `order.created` | Order placed & confirmed | — | ✓ | ✓ | Confirmation | live |
| `order.quality_check.started` | Device handed to Revibe QC / inspection begun | — | — | ✓ | Progress | live · **Δ −email** |
| `shipment.arrived_destination` | Shipped via DHL, arrived in destination country (`{trackingNumber}`) | — | — | ✓ | Progress | live · **Δ −email** |
| `shipment.cleared_customs` | Cleared customs | — | — | — | Logistics | silent |
| `shipment.forwarded_to_agent` | Handed to local delivery agent | — | — | — | Logistics | silent |
| `shipment.out_for_delivery` | Out for delivery today | ✓ | — | ✓ | Progress — waited | live · **Δ +push, −email** |
| `shipment.delivered` | Delivered (`{deliveredOnLong}`) | ✓ | ✓ | ✓ | Terminal | live · **Δ +push** |
| `shipment.shipped` | *(SA / Others)* Order shipped — single collapsed leg | ✓ | — | ✓ | Progress — waited | **silent · Δ author** *(gap — the collapsed-country equivalent of arrived+out-for-delivery has no copy)* |

---

## 5. Cancellation journey (`order.*` cancellation domain)

Covers the before-QC / at-QC / late-breached / Revibe-initiated / keep-order-revert branches.

| Event | Trigger | Push | Email | WA | Class | Today → Δ |
|---|---|:--:|:--:|:--:|---|---|
| `order.cancellation.requested` | Customer requests cancellation (fires at `created` or `quality_check` stage — `variantBy: statusId`) | — | ✓ | ✓ | Settlement | live † |
| `order.cancellation.accepted` | Ops approves the at-QC cancellation | — | — | — | Background / ops | silent *(customer already heard at request + will hear at refund)* |
| `order.cancellation.declined` | Ops declines → order resumes to delivery | ✓ | ✓ | ✓ | Action / verdict | live · **Δ +push** |
| `order.cancellation.reverted` | Customer un-cancels via *Keep my order* | — | ✓ | ✓ | Confirmation | **silent · Δ author** *(confirm the order is back on)* |
| `order.cancellation.revibe_initiated` | **Revibe** cancels — item unavailable / price error / undeliverable address (`variantBy: cancellationReason`, 3 apology variants) | ✓ | ✓ | ✓ | Action / apology | live · **Δ +push** *(unexpected → high-salience)* |
| `order.refund.completed` | Refund funds settled to card / Wallet | ✓ | ✓ | ✓ | Settlement / terminal | **silent · Δ author** *(customers wait on money)* |
| `order.sla.breached` | Delivery promise breached (running late) | — | — | — | Background → in-app banner | silent *(surfaces as the amber `statusBanner`; see §6.5 for the proactive-apology candidate)* |

† **Coverage quirk to fix when authoring.** `order.cancellation.requested` resolves to `live` because `notificationStatus` reads only the **top-level** `entry.status`. Its `created`-stage variant carries a `status:'missing'` marker *inside* the variant — which is never read, so the created-stage email gap is invisible to the roll-up. To count that gap, the marker must move to the top-level entry.

---

## 6. Claim journeys

### 6.1 Shared claim beats — change-of-mind · issue · warranty

These fire (with the same `event`, hence the same copy) across the three device-return journeys. Per-journey exceptions are called out in §6.2.

| Event | Trigger | Push | Email | WA | Class | Today → Δ |
|---|---|:--:|:--:|:--:|---|---|
| `claim.created` | Claim opened & received (`variants`: `proof` = "we're reviewing it" / `no_proof` = pickup coming) | — | ✓ | ✓ | Confirmation | live |
| `claim.documents.accepted` | *(issue / warranty)* Proof accepted → pickup being arranged | — | — | ✓ | Progress | live · **Δ −email** |
| `claim.documents.rejected` | *(issue / warranty)* Proof unclear — **resubmit needed** → `DocsRejectedCard` | ✓ | ✓ | ✓ | Action-needed | **missing · Δ author** |
| `claim.documents.resubmitted` | Customer re-sent proof → re-reviewing | — | — | ✓ | Progress (ack) | **missing · Δ author** |
| `claim.awb.generated` | Airway bill generated for pickup | — | — | — | Logistics | silent |
| `claim.awb.failed` | Courier couldn't validate pickup address — **confirm address** → `AwbFailedCard` | ✓ | ✓ | ✓ | Action-needed | **silent · Δ author** *(blocks pickup)* |
| `claim.awb.address_submitted` | Customer confirmed address → regenerating label | — | — | — | Background | silent *(in-app card confirms; picked-up beat follows)* |
| `claim.transit.picked_up` | Device collected by courier | ✓ | — | ✓ | Progress — waited | live · **Δ +push, −email** |
| `claim.transit.arrived_origin_hub` | At origin hub | — | — | — | Logistics | silent |
| `claim.transit.in_transit` | In transit to Revibe | — | — | — | Logistics | silent |
| `claim.transit.arrived_revibe_hub` | Arrived at Revibe hub | — | — | — | Logistics | silent |
| `claim.pickup.failed` | Courier missed pickup — **reschedule** → `PickupFailedCard` | ✓ | ✓ | ✓ | Action-needed | live · **Δ +push** |
| `claim.pickup.rescheduled` | Customer confirmed a new pickup slot | — | — | ✓ | Progress (ack) | **missing · Δ author** |
| `claim.reset.failed` | Device still locked (Activation Lock) — **unlock + submit details** → `ResetFailedCard` | ✓ | ✓ | ✓ | Action-needed | **missing · Δ author** |
| `claim.reset.details_received` | Customer submitted unlock details → retrying within 24 h | — | — | ✓ | Progress (ack) | **missing · Δ author** |
| `claim.reset.retry_failed` | Still locked after retry — **act again** → `ResetFailedCard` (2nd attempt) | ✓ | ✓ | ✓ | Action-needed | **missing · Δ author** |
| `claim.reset.completed` | Device unlocked, QC resumes | — | — | — | Background | silent *(candidate — see §6.5)* |
| `claim.qc.started` | Device under quality check | — | — | ✓ | Progress | live · **Δ −email** |
| `claim.inspection.invalid_confirmed` | QC verdict: claim invalid — **pay return shipping or decline** → `InvalidClaimCard` | ✓ | ✓ | ✓ | Verdict + Action | live · **Δ +push** |
| `claim.ship_back.created` | Device being shipped back to customer *(repair-return **and** invalid/cancel paid-return — unified family)* | ✓ | — | ✓ | Progress — waited | live · **Δ +push, −email** |
| `claim.ship_back.arrived_destination` | Return leg — arrived in country | — | — | — | Logistics | silent |
| `claim.ship_back.cleared_customs` | Return leg — cleared customs | — | — | — | Logistics | silent |
| `claim.ship_back.forwarded_to_agent` | Return leg — with local agent | — | — | — | Logistics | silent |
| `claim.ship_back.out_for_delivery` | Return leg — out for delivery | — | — | — | Logistics | silent |
| `claim.device.returned` | Device delivered back to customer *(NSYS condition report attached)* | ✓ | ✓ | ✓ | Terminal | live · **Δ +push** |
| `claim.refund.issued` | Refund approved / issued | ✓ | ✓ | ✓ | Settlement | live · **Δ +push** |
| `claim.refund.completed` | Refund credited to card / Wallet | ✓ | ✓ | ✓ | Settlement / terminal | live · **Δ +push** |
| `claim.cancelled` | Customer cancelled the claim *(clean-revert **and** post-collection ship-back both fire this event; the ship-back leg is then covered by `claim.ship_back.*`)* | — | ✓ | ✓ | Confirmation | **missing · Δ author** |
| `claim.declined` | Customer declined the invalid-claim return *(reversal window stays open)* | — | ✓ | ✓ | Action / confirmation | **missing · Δ author** |

### 6.2 Per-journey deltas

- **Change-of-mind** — no proof, so it **skips** `claim.documents.accepted`; the `no_proof` variant of `claim.created` already says "pickup coming." Everything else in §6.1 applies.
- **Issue** — adds the two-beat proof intake (`claim.created` proof variant → `claim.documents.accepted`) and the docs-rejected detour. `claim.inspection.invalid_confirmed` copy is battery/diagnostic-framed.
- **Warranty** — same proof intake + docs detour, **no refund-method fork**, and the valid path is **repair → ship-back** instead of refund:

  | Event | Trigger | Push | Email | WA | Class | Today → Δ |
  |---|---|:--:|:--:|:--:|---|---|
  | `claim.repair.started` | Device under repair | — | — | ✓ | Progress | **missing · Δ author** |

  The warranty valid path then reuses the unified `claim.ship_back.created → claim.device.returned` family from §6.1 (repaired unit back, no money moves). Its invalid path reuses `claim.inspection.invalid_confirmed` + the paid-return chain.

### 6.3 Compensation journey (review-only — nothing collected)

No pickup / transit / AWB / reset legs. Compensation is a **proof** claim, so `claim.created` uses the `proof` variant ("we're reviewing it").

| Event | Trigger | Push | Email | WA | Class | Today → Δ |
|---|---|:--:|:--:|:--:|---|---|
| `claim.created` | Compensation claim opened (`proof` variant; subtype = shipping-refund / accessory) | — | ✓ | ✓ | Confirmation | live |
| `claim.review.started` | Agent review begun | — | — | — | Background | silent *(redundant with the `proof`-variant `claim.created`)* |
| `claim.evidence.unclear` | Evidence unclear — **resubmit needed** → `DocsRejectedCard` | ✓ | ✓ | ✓ | Action-needed | **silent · Δ author** |
| `claim.evidence.resubmitted` | Customer re-sent evidence → re-reviewing | — | — | ✓ | Progress (ack) | **silent · Δ author** |
| `claim.review.invalid_confirmed` | Verdict: claim invalid, no refund — closed (no return shipment) | ✓ | ✓ | ✓ | Verdict | **silent · Δ author** |
| `claim.refund.issued` | Compensation approved — amount revealed | ✓ | ✓ | ✓ | Settlement | live · **Δ +push** |
| `claim.refund.completed` | Compensation credited | ✓ | ✓ | ✓ | Settlement / terminal | live · **Δ +push** |

### 6.4 In-transit "raise a claim from the in-flight hero" graft (all four claim journeys)

The customer can open a claim before the order is delivered; an agent confirms delivery in the background. **These are deliberately invisible to the customer** — the only comm the customer sees is the normal `claim.created` once the confirmed branch seeds the claim.

| Event | Trigger | Push | Email | WA | Class | Today → Δ |
|---|---|:--:|:--:|:--:|---|---|
| `claim.delivery_check.requested` | Agent asked to confirm delivery | — | — | — | Background | silent *(deliberate)* |
| `claim.delivery_check.unconfirmed` | Delivery not yet confirmed → order keeps progressing | — | — | — | Background | silent *(deliberate)* |
| `claim.created` *(via confirmed branch)* | Delivery confirmed → claim seeded | — | ✓ | ✓ | Confirmation | live *(reuses §6.1 `claim.created`)* |

### 6.5 Country split — fewer beats for SA / Others

`order.country` collapses each multi-step shipment leg into a single step for **SA** and **Others** (the outbound leg, the return leg, and the warranty ship-back). Consequence for this policy:

- The outbound leg fires **`shipment.shipped`** (one waited-on progress beat) instead of `shipment.arrived_destination` + the granular `shipment.*` chain — so SA/Others customers get one shipping notification, not two-plus.
- The return leg / warranty ship-back collapse to `claim.ship_back.created → claim.device.returned` with the four silent transit milestones dropped entirely.
- No channel *rule* changes by country — the same class defaults apply; there are simply fewer rows in play. AE / ZA see the granular chain (§4, §6.1); SA / Others see the collapsed equivalents.

---

## 7. Deltas from today — the work this implies

Push is proposed everywhere but exists nowhere yet, and several beats need copy. Three buckets:

**A. Copy to author** *(currently `silent` or `missing` — owner writes the message text)*
`shipment.shipped` · `order.cancellation.reverted` · `order.refund.completed` · `claim.documents.rejected` · `claim.documents.resubmitted` · `claim.awb.failed` · `claim.pickup.rescheduled` · `claim.reset.failed` · `claim.reset.details_received` · `claim.reset.retry_failed` · `claim.repair.started` · `claim.cancelled` · `claim.declined` · `claim.evidence.unclear` · `claim.evidence.resubmitted` · `claim.review.invalid_confirmed` *(≈16 events)*.

**B. Push to add** *(existing authored comms gain a push channel — blocked on §7 data-model work)*
`shipment.out_for_delivery` · `shipment.delivered` · `order.cancellation.declined` · `order.cancellation.revibe_initiated` · `claim.transit.picked_up` · `claim.pickup.failed` · `claim.inspection.invalid_confirmed` · `claim.ship_back.created` · `claim.device.returned` · `claim.refund.issued` · `claim.refund.completed` — plus every newly-authored **action** and **money** beat from bucket A.

**C. Email to trim** *(drop email from mid-flow progress beats to protect the channel)*
`order.quality_check.started` · `shipment.arrived_destination` · `shipment.out_for_delivery` · `claim.documents.accepted` · `claim.transit.picked_up` · `claim.qc.started` · `claim.ship_back.created`.

### What would change in code (NOT in this pass)

This doc is decisions only. Making push real later means: (1) add a `push` field to the entry shape in `src/data/notifications/*` alongside `whatsapp` / `email`; (2) have `notificationFor` (`src/lib/notifications.js`) return it; (3) add a **Push** toggle to `JourneyNotificationPanel`. The `status` / coverage model and the `event`-keyed lookup are unaffected.

### Deliberate silences worth a second look

Recorded here so they're a *choice*, not an oversight:
- **`order.sla.breached`** — a proactive "your order is running late" apology (WhatsApp/email) would likely cut support contacts. Kept in-app-only (amber banner) for now; flagged as a future candidate.
- **`claim.reset.completed`** — "device unlocked, inspection resuming" could reassure after a reset-failed detour; currently folded into the resumed QC state silently.
- **`claim.review.started` / `order.cancellation.accepted`** — intentionally silent because an adjacent comm already covers the beat (the `proof`-variant `claim.created`; the cancellation request + refund comms respectively).

---

## 8. Related docs

- [`journey_backend_spec.md`](../output/journey_backend_spec.md) — the journeys, node graphs, the notification *mechanism* (event → copy → panel), coverage `status` model, and `variants` / `variantBy`.
- [`country_split.md`](../output/country_split.md) — how SA / Others collapse the shipment legs (§6.4 here).
- `src/data/notifications/*` — the authored copy (owner-only). `src/lib/notifications.js` — the lookup + `{token}` interpolation.
