# Warranties & compensations — coming soon

> Two of the three remaining unwired entries on the returns flow's Step 1 (`Use my warranty` and `Request compensation`). Stubbed in the prototype with an inline `not part of this build` note. This doc captures scope, divergence from the wired branches, and the hook-in points for when these are built out.

## 1. Status

Both branches are **not wired** today. From [returns/change_of_mind.md](./returns/change_of_mind.md) and [returns/issue.md](./returns/issue.md), Step 1's full option set is:

| Step 1 option | Sub-options | Status |
|---|---|---|
| `I changed my mind` | — | **Wired** — see [returns/change_of_mind.md](./returns/change_of_mind.md) |
| `Something's wrong with my device` | `Return for a refund or replacement` | **Wired** — see [returns/issue.md](./returns/issue.md) |
| `Something's wrong with my device` | `Use my warranty` | **Stub** — covered here |
| `Request compensation` | shipping refund / faulty accessory — keep the item | **Stub** — covered here |

Selecting a stubbed option renders an inline `not part of this build` note instead of setting a `claimType`. `canAdvance` requires `change_of_mind` or `issue`, so neither stubbed option can advance past Step 1.

## 2. Warranty (repair-and-return)

### 2.1 Scope

The customer's device is faulty but within warranty. The flow should:

1. Pick up the device.
2. Repair (under warranty) at the supplier.
3. Ship the repaired unit back to the customer.

No money changes hands. The customer keeps the same physical unit (or an identical replacement).

### 2.2 Divergence from the issue branch

| Aspect | Issue branch | Warranty branch |
|---|---|---|
| Refund math | `gross + AED 100 bonus` (Wallet) or `gross` (original payment) | **No refund** |
| Step 5 — refund method | Two refund cards | Hidden — replaced by warranty terms confirm or repair-vs-replace preference |
| Step 6 — review | Refund block | Replaced by "Expected return date" block |
| Step 7 — confirmation | Refund timeline | Repaired-device return timeline |
| Claim card | Tracks toward `refunded` terminal | Tracks toward `device_returned` terminal — a new claim status not currently in `CLAIM_STATUSES` |

The biggest open question is what the post-`under_qc` chain looks like. Issue claims branch into either `ready_for_refund → refunded` (valid) or `invalid_confirmed → ship-back` (invalid). Warranty claims would likely have:

- **Valid warranty case** → `repair_in_progress` → `ship_back_pending` → `ship_back_in_transit` → `ship_back_delivered` (terminal).
- **Out-of-warranty case** → similar to today's invalid-claim chain (`InvalidClaimCard` takeover — customer pays return shipping if they want the device back).

### 2.3 Hook-in points

- `flowReducer.js` would gain a third `claimType` value (`'warranty'`).
- Step 2 would gain a warranty branch (proof of warranty / serial number / purchase date — much of this is already on the order).
- Steps 3–4 are reusable as-is (device prep + pickup details).
- Step 5 needs a new variant (terms confirmation or repair-vs-replace preference).
- Step 6 needs a new summary section + a "Submit warranty request" CTA copy variant.
- Step 7 needs a new next-steps list (repair timeline, no refund destination).
- `lib/claims.js` needs a new claim type label (`claimTypeLabel('warranty')`).
- `CLAIM_STATUSES` likely gains `repair_in_progress` and a `device_returned` terminal — or warranty piggybacks the existing `under_qc` sub-status chain.

### 2.4 UX considerations

- The customer's mental model is "ship the device to repair, get it back". Not "claim and get a refund". Step 7's next-steps language and the card's hero copy should reflect that.
- Sending a device back for warranty repair is a different commitment from sending it back for a refund — the customer can't switch to a replacement device the way they can on the issue branch. Worth thinking about whether the device-prep step's framing changes.
- The warranty branch may not need an attachment slot (the issue is presumed under warranty). The picker logic from `issueSubtypes.js` could still be reused for diagnostic context.

## 3. Compensation (shipping refund / faulty accessory)

### 3.1 Scope

The customer reports a problem but **keeps the device**. Likely sub-cases:

- **Shipping refund** — courier delay, damaged packaging, or a duplicate ship-fee charge. Customer gets the shipping amount back (or a goodwill credit).
- **Faulty accessory** — the device is fine but a bundled accessory (cable, adapter, case) is defective. Customer gets a partial refund or a replacement accessory.

### 3.2 Divergence from the wired branches

| Aspect | Wired branches | Compensation branch |
|---|---|---|
| Device pickup | Always required (Step 4) | **Not required** — the customer keeps the device |
| Device prep (Step 3) | Required (factory reset or credentials) | **Not required** |
| Refund math | Computed on `gross` | Computed on a sub-amount (shipping fee, accessory price) |
| Operational flow | Country routing → collection → QC → refund | Goes straight to `ready_for_refund` (or to an agent-review state) |

This is the simplest of the three stubbed branches *structurally* — it skips Steps 3 and 4 entirely — but the hardest to scope, because the compensation amount and approval rules are case-by-case.

### 3.3 Hook-in points

- `flowReducer.js` would gain a `'compensation'` claim type.
- Step 2 needs a compensation sub-type picker (likely a flat list: shipping refund / damaged packaging / faulty accessory / other) similar to `issueSubtypes.js`.
- Step 2 needs an evidence section similar to the issue branch (description + attachment).
- Steps 3 and 4 are **skipped** by the reducer — the flow jumps from Step 2 to Step 5.
- Step 5 needs a compensation-specific refund-method card (wallet vs original payment, but with a smaller `gross`).
- Step 6 + Step 7 are reusable with copy tweaks.
- A new operational sub-flow doc would live in `docs/input/return_flow_compensation.md` (drawio source pending).

### 3.4 UX considerations

- Compensation amount is often unknown at submission — it needs an agent to assess. Step 5 may need to communicate "expected within X days, amount to be confirmed by support" rather than a precise figure.
- For faulty-accessory cases, customers may prefer a **replacement accessory** over a partial refund. Step 5 could carry a replace-or-refund choice.
- The submission shouldn't promise instant refund timing (unlike the wired Wallet path), because the agent review adds latency.

## 4. Data model

No new fields required to *stub* these branches — Step 1 just renders an inline note. When wired, the `claim` shape would extend:

| New field | Type | Used by |
|---|---|---|
| `claim.type` | `'warranty' | 'compensation'` (in addition to `'change_of_mind'` / `'issue'`) | All surfaces routing on claim type |
| `claim.warrantyDetails` *(warranty only)* | `{ serialNumber, purchaseDate, scope }` | Step 2 warranty intake |
| `claim.compensationDetails` *(compensation only)* | `{ subtype, description, attachmentName, amountClaimed }` | Step 2 compensation intake |
| `claim.expectedRefund` | (existing shape) | Reused; for warranty the `net` would be `0` and the UI would suppress the refund row |

`CLAIM_STATUSES` likely gains `repair_in_progress` and a `device_returned` terminal for the warranty branch; the compensation branch can likely reuse `under_qc` → `ready_for_refund` → `refunded` as-is.

## 5. Open questions

- **Single warranty branch or sub-branched?** Warranty coverage varies (manufacturer's warranty / Revibe Care add-on / extended warranty). The flow could collapse to one branch with the source determined backend-side, or split at Step 2 like the change-of-mind / issue divergence.
- **Compensation approval gate.** Whether the agent review is a hard gate (claim doesn't even reach `pending_collection` without it) or a soft gate (the claim moves forward and the agent intervenes for fraud detection).
- **Replace vs refund on faulty accessory.** Does the customer choose, or does the agent dictate based on stock?
- **Pickup-less claims and `pickupDetails`.** The compensation branch skips Step 4. Does `claim.pickupDetails` stay as a required field on the claim object (filled with the order's defaults so the operational flow is uniform), or does it become optional? Cleaner shape vs ops-pipeline uniformity — pick one.
- **History thread on a compensation claim.** With no pickup or device prep, the history is shorter. The `HistoryThread` mode may need a `'compensation'` variant.
- **Faulty-accessory routing.** Operationally, a faulty cable may need to be shipped back for verification; in practice ops may waive that for low-value items. The flow needs a policy decision on the cutoff.
