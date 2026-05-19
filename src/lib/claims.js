// Single source of truth for the claim-tracking card. Mirrors `lib/returns.js`:
// add a new claim status, copy line, or tone tweak here and the ClaimCard
// picks it up.

import {
  FileText,
  Truck,
  ShieldCheck,
  Receipt,
  CircleDollarSign,
  Check,
  Sparkles,
} from 'lucide-react'

export const CLAIM_STATUSES = [
  {
    id: 'initiated',
    label: 'Claim initiated',
    short: 'Initiated',
    headline: 'Claim initiated',
    icon: FileText,
  },
  {
    id: 'pickup',
    label: 'Pickup',
    short: 'Pickup',
    headline: 'Pickup',
    icon: Truck,
  },
  {
    id: 'qc',
    label: 'Quality Check',
    short: 'QC',
    headline: 'Under Quality Check',
    icon: ShieldCheck,
  },
  {
    id: 'refund_issued',
    label: 'Refund issued',
    short: 'Refund issued',
    headline: 'Refund issued',
    icon: Receipt,
  },
  {
    id: 'refund_credited',
    label: 'Refund credited',
    short: 'Refund credited',
    headline: 'Refund credited',
    icon: CircleDollarSign,
  },
]

// Tone progression: amber while the unit is leaving the customer or being
// verified, brand-purple once we're staging the payout, success-green when
// the money has moved. Matches the conventions used by `PastOrderCard` for
// cancelled-past variants.
export function claimToneFor(claimStatusId) {
  if (claimStatusId === 'refund_credited') return 'success'
  if (claimStatusId === 'refund_issued') return 'brand'
  return 'warn'
}

export function claimProgressIndex(claimStatusId) {
  return CLAIM_STATUSES.findIndex((s) => s.id === claimStatusId)
}

// Courier sub-steps for the device's return journey, surfaced inside the
// `See detailed tracking` dropdown once `claim.transitSubTimeline.picked_up`
// is set (i.e. the courier has scanned the device). Inverse of the outbound
// `SHIPPING_SUB_STATUSES` in lib/statuses.js — the device moves customer
// → origin hub → flight → Revibe hub.
export const CLAIM_TRANSIT_SUB_STATUSES = [
  { id: 'picked_up', label: 'Picked up' },
  { id: 'arrived_origin_hub', label: 'Arrived at origin hub' },
  { id: 'in_transit', label: 'In transit' },
  { id: 'arrived_revibe_hub', label: 'Arrived at Revibe hub' },
]

export function transitSubProgressIndex(transitSubStatusId) {
  return CLAIM_TRANSIT_SUB_STATUSES.findIndex((s) => s.id === transitSubStatusId)
}

export function hasActiveClaim(order) {
  return Boolean(order?.claim) && order.claim.claimStatusId !== 'refund_credited'
}

export function isClaimRefunded(order) {
  return Boolean(order?.claim) && order.claim.claimStatusId === 'refund_credited'
}

// Right-side phase tag in the hero, mirroring the InProgressCard `Zap / On
// track` and PastOrderCard `Hourglass / Receipt / Check` patterns.
export function claimPhaseTag(claimStatusId) {
  switch (claimStatusId) {
    case 'initiated':
      return { label: 'Submitted', Icon: FileText }
    case 'pickup':
      return { label: 'On the way', Icon: Truck }
    case 'qc':
      return { label: 'In review', Icon: ShieldCheck }
    case 'refund_issued':
      return { label: 'Processing', Icon: Receipt }
    case 'refund_credited':
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
// Claim sub-statuses — copy + SLAs
// ────────────────────────────────────────────────────────────────────────

// Spec § 4.3 — placeholder SLAs. Ops to revise with measured p50/p90
// before any production rollout. Keys cover both main statuses and
// branch sub-statuses; gates handled by actionRequired.deadline carry
// no SLA entry on purpose.
export const CLAIM_SLAS = {
  initiated:            { expectedHours:  24, bufferHours:  24 },
  awaiting_documents:   { expectedHours:  48, bufferHours:  48 },
  pickup:               { expectedHours:  60, bufferHours:  48 },
  qc:                   { expectedHours:  48, bufferHours:  48 },
  under_revision:       { expectedHours:  48, bufferHours:  48 },
  expert_revision:      { expectedHours: 120, bufferHours:  72 },
  ship_back_pending:    { expectedHours:  48, bufferHours:  24 },
  ship_back_in_transit: { expectedHours:  72, bufferHours:  48 },
  refund_issued:        { expectedHours:  24, bufferHours:  24 },
}

// Spec § 5 — customer-facing copy for each sub-status.
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
