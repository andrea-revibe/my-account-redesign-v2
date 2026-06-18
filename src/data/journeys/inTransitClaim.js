// ----- Raise-a-claim-before-delivery branch -----------------------------
// Shared decorator that grafts the "claim from the in-flight hero" branch onto
// any claim journey, so the four claim journeys (change-of-mind, issue,
// warranty, compensation) all expose it identically.
//
// The hero shows at EVERY in-transit shipment stage, so the branch hangs off
// each of them (the four granular shipped sub-statuses + the collapsed
// `shipped_simple`), beside that stage's normal onward edge. Flow: the customer
// taps "Raise a claim" → ClaimFlow → submit advances the stage's
// `claim_raised_in_transit__<stage>` node. That is a SILENT step — the order is
// unchanged, so it stays on the hero while an agent confirms in the background
// whether the item actually arrived. The verdict is then a state in the
// sequence:
//
//   • claim_delivery_confirmed__<submit>  → one step that flips the order to
//     delivered AND seeds the claim at `initiated`, by composing the journey's
//     own `delivered` apply with its existing `claim_submitted_*` apply, then
//     rejoining that submission node's downstream pipeline. Shared across all
//     entry stages; one per submission variant, so the wallet/card (and
//     compensation subtype) fork is preserved.
//   • claim_delivery_unconfirmed__<stage> → no claim; returns to the same
//     in-transit stage the claim was raised from so the order keeps progressing
//     — it does NOT jump to delivered.
//
// The new `claim.delivery_check.*` events are intentionally unauthored, so they
// resolve to `silent` notifications (the confirmation is invisible to the
// customer); the confirmed branch reuses each journey's `claim.created` intake.

// Every in-transit shipment stage the hero can be raised from. Granular legs
// (AE/ZA) + the collapsed simple leg (SA/Others). Stages a given journey
// doesn't define are dropped, so this is safe to pass wholesale.
export const IN_TRANSIT_ENTRY_STAGES = [
  'shipped_arrived_destination',
  'shipped_cleared_customs',
  'shipped_forwarded_to_agent',
  'shipped_out_for_delivery',
  'shipped_simple',
]

const CONFIRMED_PREFIX = 'claim_delivery_confirmed__'
const RAISED_PREFIX = 'claim_raised_in_transit__'
const UNCONFIRMED_PREFIX = 'claim_delivery_unconfirmed__'

export function withInTransitClaim(nodes, { entryStageIds, submitNodeIds }) {
  const delivered = nodes.find((n) => n.id === 'delivered')
  const entries = entryStageIds.filter((id) => nodes.some((n) => n.id === id))

  const confirmedId = (submitId) => CONFIRMED_PREFIX + submitId

  const widened = nodes.map((n, i) => {
    if (!entries.includes(n.id)) return n
    // Preserve the stage's existing onward edge (explicit `next`, or the
    // array-successor default) and add the claim branch beside it.
    const base = Array.isArray(n.next)
      ? n.next
      : i + 1 < nodes.length
        ? [nodes[i + 1].id]
        : []
    return { ...n, next: [...base, RAISED_PREFIX + n.id] }
  })

  const confirmedNodes = submitNodeIds.map((submitId) => {
    const submit = nodes.find((n) => n.id === submitId)
    return {
      id: confirmedId(submitId),
      label:
        'Agent confirmed delivery — ' +
        submit.label.replace(/^Claim submitted — /, ''),
      trigger: 'system',
      event: 'claim.created',
      next: submit.next,
      apply: (o) => submit.apply(delivered.apply(o)),
    }
  })

  const stageNodes = entries.flatMap((stageId) => [
    {
      id: RAISED_PREFIX + stageId,
      label: 'Claim raised — confirming delivery',
      trigger: 'customer',
      event: 'claim.delivery_check.requested',
      next: [...submitNodeIds.map(confirmedId), UNCONFIRMED_PREFIX + stageId],
      apply: (o) => o,
    },
    {
      id: UNCONFIRMED_PREFIX + stageId,
      label: 'Agent could not confirm — still in transit',
      trigger: 'system',
      event: 'claim.delivery_check.unconfirmed',
      next: [stageId],
      apply: (o) => o,
    },
  ])

  return [...widened, ...confirmedNodes, ...stageNodes]
}
