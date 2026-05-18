// Single source of truth for the claim-tracking card. Mirrors `lib/returns.js`:
// add a new claim status, copy line, or tone tweak here and the ClaimCard
// picks it up.

import {
  FileText,
  PackageOpen,
  Truck,
  Plane,
  ShieldCheck,
  Receipt,
  CircleDollarSign,
  Hourglass,
  Check,
  Sparkles,
} from 'lucide-react'

export const CLAIM_STATUSES = [
  {
    id: 'claim_created',
    label: 'Claim created',
    short: 'Submitted',
    headline: 'Claim created',
    icon: FileText,
  },
  {
    id: 'pending_collection',
    label: 'Pending collection',
    short: 'Pickup',
    headline: 'Pending collection',
    icon: Hourglass,
  },
  {
    id: 'under_collection',
    label: 'Under collection',
    short: 'Collected',
    headline: 'Under collection',
    icon: PackageOpen,
  },
  {
    id: 'in_transit',
    label: 'In transit',
    short: 'Transit',
    headline: 'In transit',
    icon: Plane,
  },
  {
    id: 'under_qc',
    label: 'Under Quality Check',
    short: 'QC',
    headline: 'Under Quality Check',
    icon: ShieldCheck,
  },
  {
    id: 'ready_for_refund',
    label: 'Ready for Refund',
    short: 'Ready',
    headline: 'Ready for refund',
    icon: Receipt,
  },
  {
    id: 'refunded',
    label: 'Refunded',
    short: 'Refunded',
    headline: 'Refunded',
    icon: CircleDollarSign,
  },
]

// Tone progression: amber while the unit is leaving the customer or being
// verified, brand-purple once we're staging the payout, success-green when
// the money has moved. Matches the conventions used by `PastOrderCard` for
// cancelled-past variants.
export function claimToneFor(claimStatusId) {
  if (claimStatusId === 'refunded') return 'success'
  if (claimStatusId === 'ready_for_refund') return 'brand'
  return 'warn'
}

export function claimProgressIndex(claimStatusId) {
  return CLAIM_STATUSES.findIndex((s) => s.id === claimStatusId)
}

export function hasActiveClaim(order) {
  return Boolean(order?.claim) && order.claim.claimStatusId !== 'refunded'
}

export function isClaimRefunded(order) {
  return Boolean(order?.claim) && order.claim.claimStatusId === 'refunded'
}

// Right-side phase tag in the hero, mirroring the InProgressCard `Zap / On
// track` and PastOrderCard `Hourglass / Receipt / Check` patterns.
export function claimPhaseTag(claimStatusId) {
  switch (claimStatusId) {
    case 'claim_created':
      return { label: 'Submitted', Icon: FileText }
    case 'pending_collection':
      return { label: 'Awaiting pickup', Icon: Hourglass }
    case 'under_collection':
      return { label: 'Collected', Icon: PackageOpen }
    case 'in_transit':
      return { label: 'On the way', Icon: Plane }
    case 'under_qc':
      return { label: 'In review', Icon: ShieldCheck }
    case 'ready_for_refund':
      return { label: 'Processing', Icon: Receipt }
    case 'refunded':
      return { label: 'Complete', Icon: Check }
    default:
      return { label: '', Icon: Sparkles }
  }
}

export function claimStatusHeadline(claim) {
  const step = CLAIM_STATUSES.find((s) => s.id === claim.claimStatusId)
  return step ? step.headline : 'Claim'
}

export function claimStatusSubline(claim) {
  const ts = claim.timeline?.[claim.claimStatusId]
  if (ts) return `Updated ${ts}`
  return null
}

// Labels duplicated from Step6Review so the ClaimCard summary stays
// readable without importing from the flow components.
export const REASON_LABELS = {
  no_fit: "Didn't suit my needs",
  better_option: 'Found a better option elsewhere',
  changed_mind: 'Changed my mind',
  mistake: 'Ordered by mistake',
  other: 'Other',
}

export function reasonText(claim) {
  if (!claim?.reason?.value) return 'Not provided'
  if (claim.reason.value === 'other' && claim.reason.otherText?.trim()) {
    return claim.reason.otherText.trim()
  }
  return REASON_LABELS[claim.reason.value] || 'Not provided'
}

export function devicePrepText(claim) {
  if (claim?.devicePrep?.option === 'reset') return 'Factory reset confirmed'
  if (claim?.devicePrep?.option === 'credentials') return 'Credentials provided'
  return 'Not provided'
}

export const CLAIM_TYPE_LABELS = {
  change_of_mind: 'Change of mind',
  issue: 'Issue',
}

export function claimTypeLabel(typeOrClaim) {
  const type =
    typeof typeOrClaim === 'string' ? typeOrClaim : typeOrClaim?.type
  return CLAIM_TYPE_LABELS[type] || 'Claim'
}

export function refundMethodLabel(claim, order) {
  if (claim?.refundMethod === 'wallet') return 'Revibe Wallet'
  if (claim?.refundMethod === 'original') {
    const pm = order?.paymentMethod
    if (pm) return `${pm.brand || 'Card'} •• ${pm.last4 || '0000'}`
    return 'Original payment method'
  }
  return 'Not selected'
}

// ────────────────────────────────────────────────────────────────────────
// Detailed claim tracking — see docs/claim_detailed_tracking.md
// ────────────────────────────────────────────────────────────────────────

// Prototype runs against fixed mock dates. Real "now" would diverge from
// the demo dataset, so everything that compares against time uses this
// reference unless an override is passed in.
export const DEMO_NOW = new Date('2026-05-18T14:30:00')

const PROTO_YEAR = 2026
const MONTH_INDEX = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

// '13 May · 10:30 AM' → Date. Mirrors the display format used in
// `timeline` / `detailedTimeline` entries in src/data/orders.js.
export function parseDisplayDate(str) {
  if (!str) return null
  const m = /^(\d{1,2})\s+(\w{3})\s+·\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/.exec(
    String(str).trim()
  )
  if (!m) return null
  const month = MONTH_INDEX[m[2]]
  if (month == null) return null
  let hour = Number(m[3])
  if (m[5] === 'PM' && hour !== 12) hour += 12
  if (m[5] === 'AM' && hour === 12) hour = 0
  return new Date(PROTO_YEAR, month, Number(m[1]), hour, Number(m[4]))
}

// Spec § 4.3 — placeholder SLAs. Ops to revise with measured p50/p90
// before any production rollout. Keys cover both main statuses and
// branch sub-statuses; gates handled by actionRequired.deadline carry
// no SLA entry on purpose.
export const CLAIM_SLAS = {
  claim_created:        { expectedHours:   1, bufferHours:   4 },
  awaiting_documents:   { expectedHours:  48, bufferHours:  48 },
  pending_collection:   { expectedHours:  24, bufferHours:  24 },
  under_collection:     { expectedHours:  12, bufferHours:  12 },
  in_transit:           { expectedHours:  48, bufferHours:  48 },
  under_qc:             { expectedHours:  48, bufferHours:  48 },
  under_revision:       { expectedHours:  48, bufferHours:  48 },
  expert_revision:      { expectedHours: 120, bufferHours:  72 },
  ship_back_pending:    { expectedHours:  48, bufferHours:  24 },
  ship_back_in_transit: { expectedHours:  72, bufferHours:  48 },
  ready_for_refund:     { expectedHours:  24, bufferHours:  24 },
}

// Spec § 4.1 — sub-status catalog. `skipCountries` encodes the CoM ZA/SA
// variant where invalid-claim escalations loop via `under_revision`
// instead of the LAB sub-flow.
export const CLAIM_SUB_STATUSES = [
  { id: 'awaiting_documents',   parent: 'claim_created',      types: ['issue'] },
  { id: 'collection_failed',    parent: 'pending_collection', types: ['issue', 'change_of_mind'] },
  { id: 'under_revision',       parent: 'under_qc',           types: ['issue', 'change_of_mind'] },
  { id: 'expert_revision',      parent: 'under_qc',           types: ['issue', 'change_of_mind'], skipCountries: ['ZA', 'SA'] },
  { id: 'invalid_confirmed',    parent: 'under_qc',           types: ['issue', 'change_of_mind'] },
  { id: 'awaiting_payment',     parent: 'under_qc',           types: ['issue', 'change_of_mind'] },
  { id: 'ship_back_pending',    parent: 'under_qc',           types: ['issue', 'change_of_mind'] },
  { id: 'ship_back_in_transit', parent: 'under_qc',           types: ['issue', 'change_of_mind'] },
  { id: 'ship_back_delivered',  parent: 'under_qc',           types: ['issue', 'change_of_mind'] },
]

// Spec § 5 — customer-facing copy for each sub-status. Tones drive the
// row treatment in the detailed view.
export const SUB_STATUS_LABELS = {
  awaiting_documents: {
    headline: 'More info needed',
    subline: 'Revibe Quality asked for a clearer photo or longer video.',
    tone: 'warn',
  },
  collection_failed: {
    headline: 'Pickup didn’t go through',
    subline: 'We couldn’t collect on the scheduled date.',
    tone: 'warn',
  },
  under_revision: {
    headline: 'Reviewing seller’s response',
    subline: 'Our team is double-checking the seller’s notes.',
    tone: 'brand',
  },
  expert_revision: {
    headline: 'Expert inspection',
    subline: 'Sent to our lab for a closer look. This step takes longer than usual.',
    tone: 'brand',
  },
  invalid_confirmed: {
    headline: 'Claim couldn’t be approved',
    subline: 'Inspection didn’t confirm the issue you reported.',
    tone: 'warn',
  },
  awaiting_payment: {
    headline: 'Payment needed to return device',
    subline: 'Cover return shipping to get your device back.',
    tone: 'warn',
  },
  ship_back_pending: {
    headline: 'Preparing to send your device back',
    subline: 'Arranging a courier — should be on the way in a day or two.',
    tone: 'brand',
  },
  ship_back_in_transit: {
    headline: 'Your device is on the way back',
    subline: 'Tracking will appear here once the courier scans it in.',
    tone: 'brand',
  },
  ship_back_delivered: {
    headline: 'Device returned',
    subline: 'Delivered.',
    tone: 'success',
  },
}

// True when the claim genuinely deviates inside the QC parent — the only
// case where the vertical timeline adds something the dot strip and
// action banner don't already cover. Pre-QC sub-statuses (e.g. collection
// failed) are surfaced via the action banner; happy-path claims have
// nothing extra to show. See docs/claim_detailed_tracking.md § 7.2.
export function shouldShowDetailedTracking(claim) {
  if (!claim?.subStatusId) return false
  const sub = CLAIM_SUB_STATUSES.find((s) => s.id === claim.subStatusId)
  return sub?.parent === 'under_qc'
}

// Sub-statuses that apply to the given claim — filters by type and country.
export function applicableSubStatuses(claim, order) {
  const type = claim?.type || 'change_of_mind'
  const country = order?.country || 'AE'
  return CLAIM_SUB_STATUSES.filter((s) => {
    if (!s.types.includes(type)) return false
    if (s.skipCountries?.includes(country)) return false
    return true
  })
}

// Computes the "expected by" Date for a step that has started. Falls
// back to `claim.timeline` for main statuses; reads `detailedTimeline`
// for sub-statuses.
export function expectedByFor(stepId, claim) {
  const sla = CLAIM_SLAS[stepId]
  if (!sla) return null
  const startedStr =
    claim?.detailedTimeline?.[stepId]?.startedAt ||
    claim?.timeline?.[stepId]
  const startedAt = parseDisplayDate(startedStr)
  if (!startedAt) return null
  return new Date(startedAt.getTime() + sla.expectedHours * 3600 * 1000)
}

// Spec § 7.3 — delayed when now > startedAt + expected + buffer.
export function isStepDelayed(stepId, claim, now = DEMO_NOW) {
  const sla = CLAIM_SLAS[stepId]
  if (!sla) return false
  const startedStr =
    claim?.detailedTimeline?.[stepId]?.startedAt ||
    claim?.timeline?.[stepId]
  const startedAt = parseDisplayDate(startedStr)
  if (!startedAt) return false
  const cutoff = new Date(
    startedAt.getTime() + (sla.expectedHours + sla.bufferHours) * 3600 * 1000
  )
  return now > cutoff
}

// Spec § 7.2 — full vertical-timeline row tree. One row per main parent;
// each carries the applicable sub-step rows nested underneath. Component
// decides chrome (past collapsed / current expanded / future preview).
export function detailedSteps(claim, order, now = DEMO_NOW) {
  if (!claim) return []
  const curIdx = claimProgressIndex(claim.claimStatusId)
  const applicableSubs = applicableSubStatuses(claim, order)

  return CLAIM_STATUSES.map((mainStep, i) => {
    let state = 'future'
    if (i < curIdx) state = 'past'
    else if (i === curIdx) state = 'current'

    const startedAt = claim.timeline?.[mainStep.id] || null
    const nextStep = CLAIM_STATUSES[i + 1]
    const completedAt = nextStep ? claim.timeline?.[nextStep.id] || null : null

    const subSteps = applicableSubs
      .filter((s) => s.parent === mainStep.id)
      .map((s) => {
        const subStarted = claim.detailedTimeline?.[s.id]?.startedAt || null
        const isCurrent = state === 'current' && claim.subStatusId === s.id
        if (!subStarted && !isCurrent) return null
        return {
          id: s.id,
          ...SUB_STATUS_LABELS[s.id],
          state: isCurrent ? 'current' : 'past',
          startedAt: subStarted,
          expectedBy: isCurrent ? expectedByFor(s.id, claim) : null,
          isDelayed: isCurrent ? isStepDelayed(s.id, claim, now) : false,
        }
      })
      .filter(Boolean)

    return {
      id: mainStep.id,
      short: mainStep.short,
      label: mainStep.label,
      headline: mainStep.headline,
      state,
      startedAt,
      completedAt,
      expectedBy: state === 'current' ? expectedByFor(mainStep.id, claim) : null,
      expectedRelativeHours:
        state === 'future' ? CLAIM_SLAS[mainStep.id]?.expectedHours ?? null : null,
      isDelayed: state === 'current' ? isStepDelayed(mainStep.id, claim, now) : false,
      subSteps,
    }
  })
}

// '16 May · 8:20 AM' → '16 May'. Used by gate-banner copy.
function dayPart(displayDate) {
  if (!displayDate) return ''
  const idx = displayDate.indexOf(' · ')
  return idx > 0 ? displayDate.slice(0, idx) : displayDate
}

// Spec § 6 — copy + CTAs for the three customer-action gates.
export function actionGateCopy(actionRequired) {
  if (!actionRequired) return null
  const base = {
    tone: 'warn',
    deadline: actionRequired.deadline || null,
    deadlineLabel: actionRequired.deadlineLabel || null,
  }
  switch (actionRequired.kind) {
    case 'awaiting_documents':
      return {
        ...base,
        headline: 'Action needed — documents requested',
        body: 'Revibe Quality has asked for a clearer photo or longer video before we can pick up your device.',
        primaryCta: 'Reply with documents',
        secondaryCta: 'Close claim',
      }
    case 'collection_failed':
      return {
        ...base,
        headline: 'Action needed — pickup didn’t go through',
        body: `Our courier couldn’t pick up your device${
          actionRequired.failedAt ? ' on ' + dayPart(actionRequired.failedAt) : ''
        }.`,
        primaryCta: 'Schedule new pickup',
        secondaryCta: 'Cancel claim',
      }
    case 'awaiting_payment':
      return {
        ...base,
        headline: 'Action needed — return shipping payment',
        body: 'Your claim couldn’t be approved after inspection. Cover the return shipping fee to get your device sent back.',
        primaryCta: 'Pay return shipping',
        secondaryCta: 'Discuss with support',
      }
    default:
      return null
  }
}
