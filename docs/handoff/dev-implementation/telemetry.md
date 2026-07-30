# Telemetry — My Account event catalogue

> **What this is.** The dev-ready metrics list for instrumenting **My Account → Orders**: which events to emit, which properties they carry, which enums they draw from, and the order to build them in. Companion to [`README.md`](./README.md) §6 (stack choice + privacy posture), which points here for the taxonomy — this file is the single source of truth for event names.
>
> **Tool-agnostic.** Destination isn't decided. Every event below is a flat name + flat property bag, so it maps unchanged onto PostHog/Mixpanel/Amplitude (`track(name, props)`), GA4 (`gtag('event', name, props)` — all events stay under 25 params), or a custom `POST /events` into the warehouse. Pick the destination without re-cutting the catalogue.

## 0. The three questions this must answer

Scope was set to three questions. Every event below earns its place against one of them; the priority tiers follow directly.

| # | Question | Primary events |
|---|---|---|
| **Q1** | Which **states** do customers actually land in? Real-world frequency of each card, and especially of the five failure surfaces. | `card_viewed`, `card_expanded` |
| **Q2** | Does self-serve **deflect support contact**? | `cta_clicked` (help slugs) → JOIN Gorgias |
| **Q3** | What do customers **choose at each decision fork**? Cancel vs keep, refund vs repair vs replacement, wallet vs card, pay vs decline. | `decision_resolved` |

**Deliberately out of Tier 1: in-flow drop-off.** Per-step funnel analysis of the returns flow is the single largest chunk of instrumentation (14 steps × view/complete/block) and was *not* selected as a priority. It sits in **Tier 3** (§4) behind one cheap proxy — `claim_flow_ended.last_step` — which gives the drop-off *distribution* for ~5% of the effort of a true funnel. Promote Tier 3 only when a specific step is under suspicion.

---

## 1. The design rule — log the thin thing, JOIN the rest

Events are joinable to production (`customer_id`, `order_id`, `claim_ref`). That is the biggest single effort saver in this document: **anything the server already knows must not be an event property.** It becomes a JOIN at query time.

| Don't log | JOIN from | Why not |
|---|---|---|
| Order value, currency, `paymentSplit`, BNPL provider | `orders` | Static per order; a stale copy in the event stream will disagree with finance |
| `country`, product `category_name`, condition grade | `orders` / product | Static; adds 3 props to every event for zero new information |
| `claim.type`, `claimStatusId`, claim SLA / deadline | `claims` | Already modelled server-side (README §4.5) |
| Courier, AWB, sub-status timestamps | shipment event log | README §4.3 owns this — the authoritative leg history |
| `situation`, `remedy`, reason, issue category/specific, packing choice | `claims` (**persist these on the claim record**) | See §5 — persisting them is cheaper *and* better than logging them |
| Days since delivery, `promiseBreached`, fee waived | derived at query time | Computable from timestamps you already store |

**The one exception — state at time of view.** A JOIN returns the order's *current* state, not the state the customer saw. So `card_viewed` (and only `card_viewed`) carries `card_state`: one short string capturing the resolved stage at impression. Everything else about that order is a JOIN. Without this you cannot answer Q1 at all — reconstructing as-of state from the event log per impression is real analyst work you'd be paying for forever.

### 1.1 Event envelope

Emitted on every event by the choke-point, never by a call site:

| Property | Type | Notes |
|---|---|---|
| `event` | string | Name from the catalogue below. `snake_case`, past tense. |
| `ts` | timestamp | Client clock; server stamps `received_at` too (clock skew is real on mobile). |
| `customer_id` | id | My Account is authenticated — always present. |
| `session_id` | uuid | Client-generated, 30-min inactivity rollover. |
| `order_id` | id \| null | Null for account-level events (`account_viewed`, wallet). |
| `claim_ref` | string \| null | Typed ref (`RET`/`WAR`/`CMP`/`CXL`) when the surface is claim-scoped. |
| `surface` | enum | Which card or sheet the event happened on — see §2.4. |
| `app_version` | string | Needed to segment a release regression. |
| `schema_version` | int | Bump when a property's meaning changes. Cheap now, priceless later. |

### 1.2 Enum discipline — reuse the production string contracts

**Every enum value in this catalogue must be an existing production string, not a new analytics label.** The app already has string contracts for `statusId`, `subStatusId`, `state`, `claimStatusId`, `claim.type` and `country` (the prototype's are indexed in [`docs/code_map.md`](../../code_map.md) → *Coupling the import graph can't see*). If telemetry invents `"in_transit"` where the app says `"shipped"`, every query needs a translation table and the two vocabularies drift within a quarter.

Practical rule for the build: enums live in one shared module that **both** the UI and the `track()` call import. A new status is then one edit, and an unmapped value is a type error rather than a silent `null` in a dashboard.

---

## 2. Tier 1 — the 20% that returns 80%

**Seven events.** This is the complete Tier 1 scope; it answers Q1–Q3 in full.

| # | Event | Fires when | Properties (beyond the envelope) | Answers |
|---|---|---|---|---|
| 1 | `account_viewed` | My Account → Orders loads | `order_count`, `open_count`, `has_active_claim`, `entry` (`direct`/`email`/`whatsapp`/`push`) | Denominator for every rate below; channel attribution of *why* they came |
| 2 | `card_viewed` | A routed card renders (once per card per page view — dedupe by `order_id`, no scroll observer) | `card`, `card_state`, `position`, `auto_expanded`, `is_takeover` | **Q1** — the state-frequency signal |
| 3 | `card_expanded` | Customer taps a card header open | `card`, `card_state` | **Q1** — engagement per state; validates the auto-expand rule |
| 4 | `cta_clicked` | **Any** tracked tap | `cta`, `cta_kind`, `card`, `card_state`, `placement` | **Q2** + all interaction volume |
| 5 | `decision_resolved` | A fork reaches an outcome | `decision`, `outcome`, `context` (small object, §2.3) | **Q3** — highest signal per event in the catalogue |
| 6 | `claim_flow_started` | Returns overlay opens | `entry_surface`, `eligibility` | Flow entry volume; entry-point comparison |
| 7 | `claim_flow_ended` | Overlay closes or submits | `outcome` (`submitted`/`abandoned`), `last_step`, `furthest_step`, `claim_type?` | Completion rate + a free drop-off histogram |

**Why one generic `cta_clicked` instead of ~35 named events.** One instrumented tap event with a `cta` slug is a single wrapper on the shared button primitives (§8) and covers every current *and future* CTA with no new code. Named-per-button events cost ~35 hand-edits, drift as copy changes, and analyse identically in SQL (`WHERE cta = '…'`). The same argument makes `decision_resolved` one event rather than eight.

### 2.1 `card` enum — the surfaces (13)

Mirror the routing taxonomy exactly. Baselines: `hero` · `in_progress` · `order` · `past_order`. Claim family: `claim` · `warranty_claim` · `closed_claim` · `revibe_cancellation`. Failure takeovers (the Q1 payload): `docs_rejected` · `awb_failed` · `pickup_failure` · `reset_failed` · `invalid_claim`.

> ⚠️ **`awb_failed` was missing** from the earlier taxonomy in README §6.3 — it's the fifth takeover card (courier couldn't validate the pickup address, so no airway bill). Omitting it makes an entire failure mode invisible. Corrected here.

`card_state` values: the order's `statusId` (+`subStatusId` while shipped), or the `claimStatusId` for claim-family cards, or the takeover gate kind (`awaiting_documents` · `awb_generation_failed` · `collection_failed` · `awaiting_payment` · `reset_failed`). `is_takeover` is a convenience boolean so the failure-rate query doesn't need to enumerate five card names.

### 2.2 `cta` slug registry

Grouped by `cta_kind`, which is what makes the Q2 query one predicate rather than a hand-maintained list. `placement` disambiguates the same slug on different surfaces (e.g. `keep_order` appears on both the dissuade step and the confirm step of the cancel sheet).

**`kind: help`** — the deflection primitive:
`get_help` · `chat_fab` · `discuss_with_support`

**`kind: action`** — changes state:
`cancel_order` · `confirm_cancel_order` · `keep_order` · `reverse_cancellation` · `raise_claim` · `cancel_claim` · `confirm_cancel_claim` · `keep_claim` · `decline_return` · `pay_return_shipping` · `reply_with_documents` · `add_more_evidence` · `close_claim` · `confirm_pickup_address` · `schedule_new_pickup` · `confirm_new_pickup` · `unlock_device` · `submit_reset_details` · `change_address` · `change_phone` · `move_to_card` · `undo`

**`kind: navigation`** — goes somewhere:
`view_claim_details` · `view_refund_details` · `download_receipt` · `track_package` · `track_this_claim` · `view_airway_bill` · `view_condition_report` · `copy_awb` · `copy_discount_code` · `open_wallet` · `open_order_claim_link`

**`kind: disclosure`** — asks for an explanation (a **leading indicator of a support contact** — pair with Q2):
`learn_more` (the ⓘ status explainer) · `see_detailed_tracking` (+ `leg`: `outbound`/`inbound`/`ship_back`/`return`) · `expand_history_event` · `wallet_info_tooltip` · `bnpl_disclaimer`

### 2.3 `decision` registry — the Q3 forks

Each row is one `decision_resolved` event. The `context` object holds *only* what isn't JOINable and is needed to interpret the outcome.

| `decision` | `outcome` values | `context` | The question it settles |
|---|---|---|---|
| `cancel_order` | `cancelled` · `kept` | `dissuade_shown`, `fee_waived`, `refund_destination`, `status_at_request` | Does the dissuade step work, and what does it cost? |
| `cancellation_reversal` | `reversed` · `left_pending` | `phase` (at-QC / stuck-in-transit) | Do customers change their mind back once review is pending? |
| `cancel_claim` | `cancelled_clean` · `cancelled_ship_back` · `kept` | `claim_stage` | How much of the cancel volume triggers a paid ship-back? |
| `invalid_claim` | `paid` · `declined` | `fee`, `reason` (`invalid`/`cancelled`) | Recovery rate on the pay-to-return-your-device gate |
| `remedy` | `refund` · `repair` · `replacement` | `situation` | Do faulty-device customers want money back or a fix? |
| `refund_method` | `wallet` · `original_payment` | `bonus_offered` | Wallet take-up, and whether the bonus moves it |
| `switch_flow` | `switched` · `not_now` | `tripwire`, `from`, `to` | Is the tripwire catching real misroutes or just annoying people? |
| `wallet_transfer` | `moved_to_card` · `abandoned` | `deduction_applied` | Does the waived-deduction warning stop the transfer? |

### 2.4 `surface` enum

The 13 `card` values, plus the sheets and overlays: `cancel_order_sheet` · `keep_order_sheet` · `cancel_claim_sheet` · `wallet_sheet` · `claim_details_sheet` · `refund_details_sheet` · `claim_flow` · `reset_guide_sheet` · `switch_flow_sheet` · `account_list`.

---

## 3. Tier 2 — add once Tier 1 is live and trusted

Cheap, genuinely useful, but none of them is load-bearing for Q1–Q3. Ship Tier 1, look at it for a month, then add these.

| Event | Fires when | Properties | Why it's worth it |
|---|---|---|---|
| `csat_submitted` | Score tapped on the claim-confirmation screen | `score` (**1–5**), `claim_type` | Satisfaction per claim type. **Note:** the prototype component is named `NpsSurvey` but renders a 1–5 Poor→Excellent scale — that's CSAT, not NPS. Don't ship it as `nps_*`; the scales aren't comparable. |
| `field_edited` | An address/phone edit is saved | `field`, `surface` | Address quality is the root cause of the `awb_failed` and `pickup_failure` surfaces — this closes that loop |
| `filter_applied` | Status filter chip tapped | `filter` | Is the list long enough to need filtering? |
| `proof_slot_filled` | Evidence slot gets a file | `slot`, `media_type` | Proof completeness vs. later rejection — feeds the claim-review agent |
| `notification_entry` | Arrival from an email/WhatsApp deep link | `event_key`, `channel` | Closes the loop from the notifications work onto actual My Account behaviour |

---

## 4. Tier 3 — deferred (do not build yet)

Explicitly parked, recorded so nobody re-derives the list later. Each has a stated unlock condition — that's the difference between "deferred" and "forgotten".

| Deferred | Unlock when |
|---|---|
| `flow_step_viewed` / `flow_step_completed` (true per-step funnel, 14 steps) | `claim_flow_ended.last_step` shows a concentration at one step and you need the within-step detail |
| `validation_blocked` (soft-validation fired — `step`, `field`) | Completion rate is low and you suspect form friction rather than intent |
| `tripwire_shown` (as distinct from the resolved `switch_flow` decision) | Tripwire decline rate looks high and you need the shown-vs-resolved denominator |
| Dwell time, scroll depth, rage clicks, session replay | A specific state is suspected of confusing people and the event data can't say why |

**Sampling:** none, at My Account volumes. Sample only if event cost becomes visible.

---

## 5. Don't build these client-side — the server already knows

The highest-leverage part of this document. Each of these looks like a metric to log and isn't.

1. **Action-gate resolution rate + time-to-resolve** (docs rejected → resubmitted, AWB failed → address confirmed, etc.). Already modelled as `fact_claim_action_gate` in README §4.8, with `opened_at` / `resolved_at` / `outcome` / `breached`. Client telemetry would duplicate it *worse* — it can't see the auto-cancel that fires while the customer is away. Query the fact table.
2. **Cancellation review outcomes** (accepted / declined / reversed). Ops actions, not customer actions. They belong to the order event log. Only the customer's *request* and *reversal* are client events (§2.3).
3. **The claim's own answers** — `situation`, reason, issue category/specific, remedy, packing choice, refund method, reset state. **Persist these as columns on the claim record**, don't log them as event properties. You get: correct joins to outcome (was the claim approved?), no double bookkeeping, retention beyond the analytics tool's window, and free use in ops tooling. Telemetry then only needs the *abandonment* case — the one thing that never becomes a claim row. This is the single biggest scope cut available: it removes most of what a naive per-step tracking plan would log.
4. **Everything in §1's don't-log table.**

---

## 6. Metric definitions

The queries the catalogue is designed to serve. Written against the envelope + JOINs, so they double as acceptance criteria for the instrumentation.

| Metric | Definition |
|---|---|
| **State frequency** (Q1) | `card_viewed` grouped by `card`, `card_state` ÷ distinct `order_id`. The failure-surface slice is `is_takeover = true`. |
| **Failure-surface incidence** (Q1) | distinct orders with a takeover impression ÷ distinct orders with any claim card. Split by `card` for the five gates. |
| **Gate action rate** (Q1) | `cta_clicked` on the gate's primary slug ÷ `card_viewed` of that takeover card, same `order_id`. Low rate = the card isn't landing; pair with `fact_claim_action_gate.outcome` for what happened next. |
| **Support-contact rate** (Q2) | Gorgias tickets opened within 24h of an `account_viewed`, ÷ `account_viewed` sessions. Segment by the `card_state` seen in that session — this is *the* deflection number. |
| **Self-serve deflection** (Q2) | Sessions with a `cta_clicked` of `kind = action` and **no** ticket in 24h ÷ all sessions reaching that state. Compare against the pre-redesign baseline. |
| **Explanation-seeking** (Q2) | `cta_clicked` where `kind = disclosure`, grouped by `card_state`. Ranks which states need better copy or proactive comms — the cheapest ticket-prevention input you'll get. |
| **Cancel-vs-keep** (Q3) | `decision_resolved(cancel_order)`: `kept` ÷ all, split by `dissuade_shown` and `status_at_request`. |
| **Remedy mix** (Q3) | `decision_resolved(remedy)` outcome distribution, split by `situation`. |
| **Wallet take-up** (Q3) | `decision_resolved(refund_method)` = `wallet` ÷ all; then `wallet_transfer` = `moved_to_card` as the leak-back rate. |
| **Claim completion** | `claim_flow_ended(submitted)` ÷ `claim_flow_started`. Abandonment by `last_step` is the free drop-off histogram. |
| **Auto-expand validation** | `card_expanded` rate for cards where `auto_expanded = false`, by `card_state`. High rate on a state ⇒ it should auto-expand. |

---

## 7. PII / consent (D11)

Extends README §6.5. Redact in the choke-point so no call site can leak.

**Never in an event property:** address fields (any of the per-country schemas), phone, email, customer name, payment/card detail, **device passcode** (the reset-failed unlock gate collects one — it must never reach an analytics payload), proof filenames or image bytes, discount codes.

**Safe to send:** `customer_id`, `order_id`, `claim_ref`, and the enums above. Note `claim_ref` and `order_id` are pseudonymous, not anonymous — they re-identify against your own DB by design (that's the point of §1) so the event store inherits the same access controls as production data.

Gate capture on consent per market; decide the posture before instrumenting, not after.

---

## 8. Build order and effort

**The structural advice that determines the cost: instrument the choke-points, not the leaves.** All of Tier 1 lands in ~5 files if the production app funnels cards and buttons through shared components the way the prototype does. If it doesn't, that refactor is the real work — and it's worth doing first, because per-leaf instrumentation decays as soon as someone adds a card variant without an event.

| Step | Where | Unlocks | Rough effort |
|---|---|---|---|
| 1 | `analytics` module — `track()`, envelope, enum module, PII redaction, batch-on-unload | everything | 1 d |
| 2 | Card-routing choke-point → `card_viewed`, `card_expanded` | **Q1** | 0.5 d |
| 3 | `cta` prop on the shared button primitives → `cta_clicked` | **Q2** | 0.5–1 d |
| 4 | The 8 fork handlers → `decision_resolved` | **Q3** | 0.5 d |
| 5 | Flow open/close → `claim_flow_started`, `claim_flow_ended` | completion rate | 0.25 d |
| 6 | Persist the claim's own answers as columns (§5) | removes most step tracking | backend, folds into README §4 |
| | | | **≈ 3 dev-days + QA** |

Add ~2 days if CTAs aren't already centralised in shared button components. Tier 2 is ~1 further day. Tier 3, if ever built, is comparable to all of Tier 1 on its own — which is exactly why it's deferred.

**Validation before you trust a dashboard:** replay one full journey per card family and assert the emitted event sequence. The prototype's journey mode (`?journey=<id>`) enumerates these lifecycles and is the cheapest place to enumerate the expected streams.

---

## 9. Prototype anchors

Where each choke-point exists in this prototype, for devs who want to see the shape before building it in production.

| Hook | Prototype location |
|---|---|
| Card routing (→ `card_viewed`) | `src/App.jsx` routing block; precedence documented in `docs/output/diagrams.md#card-routing` |
| Card enums / `card_state` | `src/lib/statuses.js` (`STATUSES`, `SHIPPING_SUB_STATUSES`, `ORDER_STATES`), `src/lib/claims.js` (`CLAIM_STATUSES`, `WARRANTY_CLAIM_STATUSES`, `actionGateCopy`) |
| Decision forks (→ `decision_resolved`) | `src/App.jsx` (`handleConfirmCancelClaim`, `handleKeepClaim`, `handleConfirmReschedule`, `handleConfirmAddress`, `handleSubmitResetDetails`), `src/components/CancelOrderSheet.jsx`, `StepRemedy.jsx`, `Step5RefundMethod.jsx`, `SwitchFlowSheet.jsx`, `WalletSheet.jsx` |
| Flow start/end + step vocab | `src/components/ClaimFlow/ClaimFlow.jsx`, `flowReducer.js` (`sequenceFor`, `STEP_GROUPS`, `stepError`) |
| CSAT | `src/components/NpsSurvey.jsx` (1–5 scale, misnamed) |
| Help CTAs | `src/components/ChatFab.jsx`, `HeroCard.jsx`, `OrderCard.jsx`, `ReturnShipmentTracking.jsx`, `lib/claims.js` (`actionGateCopy` secondary CTAs) |

**Returns-flow `step` vocabulary** (from `flowReducer.js`, use these verbatim): `situation` · `reason` · `category` · `specific` · `wrongitem` · `compproblem` · `remedy` · `evidence` · `deviceprep` · `packing` · `pickup` · `refund` · `review` · `confirm`.

> ⚠️ The earlier README §6.3 step list **omitted `packing` and `compproblem`** and renamed four others. Renamed steps break the join to the app's own reducer state; use the verbatim list above.

---

## 10. Open questions

1. **Destination** — PostHog vs Mixpanel/Amplitude vs warehouse-only. Doesn't block the catalogue; does block the choke-point's transport. (README §6.1 recommends PostHog.)
2. **Pre-redesign baseline** — is there any current My Account event data? Without a baseline, the deflection metrics (Q2) measure a level, not an improvement. If not, consider instrumenting the *current* My Account first, even partially.
3. **Gorgias join key** — tickets join by customer email/id; confirm the mapping to `customer_id` so Q2 is computable on day one.
4. **`account_viewed.entry`** — requires UTM/deep-link params on the notification links. Coordinate with the notifications work (`docs/artifact/notifications-flow.md`) or the property will always be `direct`.
5. **Consent posture per market** (D11) — decide before instrumenting.
