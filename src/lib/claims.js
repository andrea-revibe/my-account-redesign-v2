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
  CheckCircle2,
  Sparkles,
  Wrench,
  PackageCheck,
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

// Terminal state differs by claim type: refund flows land on
// `refund_credited`, warranty flows land on `device_returned`. Anything else
// is in-flight and surfaces in "In progress".
export function hasActiveClaim(order) {
  if (!order?.claim) return false
  if (order.claim.type === 'warranty') {
    return order.claim.claimStatusId !== 'device_returned'
  }
  return order.claim.claimStatusId !== 'refund_credited'
}

export function isClaimRefunded(order) {
  return Boolean(order?.claim) && order.claim.claimStatusId === 'refund_credited'
}

// Warranty equivalent of `isClaimRefunded` — true once the repaired device
// has been delivered back to the customer (warranty terminal).
export function isWarrantyDelivered(order) {
  return (
    Boolean(order?.claim) &&
    order.claim.type === 'warranty' &&
    order.claim.claimStatusId === 'device_returned'
  )
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

// ────────────────────────────────────────────────────────────────────────
// Warranty pipeline — 6-state customer-facing chain.
// ────────────────────────────────────────────────────────────────────────
//
// Warranty claims share the head of the refund pipeline (initiated →
// pickup → qc) but swap the refund tail (refund_issued → refund_credited)
// for a repair-and-ship-back tail (under_repair → ship_back →
// device_returned). The customer doesn't see seller-vs-LAB distinction —
// both routes render the same "Under repair" surface.
//
// Operational source: docs/input/return_flow_warranty.md.

export const WARRANTY_CLAIM_STATUSES = [
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
    id: 'under_repair',
    label: 'Under repair',
    short: 'Repair',
    headline: 'Under repair',
    icon: Wrench,
  },
  {
    id: 'ship_back',
    label: 'On the way back',
    short: 'Ship back',
    headline: 'On its way back',
    icon: PackageCheck,
  },
  {
    id: 'device_returned',
    label: 'Device returned',
    short: 'Returned',
    headline: 'Device returned',
    icon: CheckCircle2,
  },
]

// Tone progression: warn (amber) while the device is leaving the customer
// or being verified, brand (purple) once Revibe is doing the work
// (repairing + shipping back), success (green) when the device is home.
export function warrantyClaimToneFor(claimStatusId) {
  if (claimStatusId === 'device_returned') return 'success'
  if (claimStatusId === 'under_repair' || claimStatusId === 'ship_back') {
    return 'brand'
  }
  return 'warn'
}

export function warrantyClaimProgressIndex(claimStatusId) {
  return WARRANTY_CLAIM_STATUSES.findIndex((s) => s.id === claimStatusId)
}

export function warrantyClaimPhaseTag(claimStatusId) {
  switch (claimStatusId) {
    case 'initiated':
      return { label: 'Submitted', Icon: FileText }
    case 'pickup':
      return { label: 'On the way', Icon: Truck }
    case 'qc':
      return { label: 'In review', Icon: ShieldCheck }
    case 'under_repair':
      return { label: 'Repair in progress', Icon: Wrench }
    case 'ship_back':
      return { label: 'Coming back', Icon: Truck }
    case 'device_returned':
      return { label: 'Complete', Icon: Check }
    default:
      return { label: '', Icon: Sparkles }
  }
}

export function warrantyClaimStatusHeadline(claim) {
  const step = WARRANTY_CLAIM_STATUSES.find((s) => s.id === claim.claimStatusId)
  return step ? step.headline : 'Warranty claim'
}

export function warrantyClaimStatusSubline(claim) {
  const ts = claim.timeline?.[claim.claimStatusId]
  if (ts) return `Updated ${ts}`
  return null
}

// Ship-back tracking reuses the standard outbound SHIPPING_SUB_STATUSES
// from lib/statuses.js so a warranty return reads with the same
// milestones as any normal outgoing order (arrived in destination
// country → cleared customs → forwarded to third-party agent → out for
// delivery). No warranty-specific sub-status export needed.

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
  warranty: 'Warranty',
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
  // Warranty-tail placeholders — see WARRANTY_CLAIM_STATUSES above.
  // Repair is the long pole; ship-back mirrors a normal outbound leg.
  under_repair:         { expectedHours: 168, bufferHours:  72 },
  ship_back:            { expectedHours:  96, bufferHours:  24 },
}

// Sums the per-step `expectedHours` across the relevant pipeline,
// adds it to `today`, and returns the projected completion date in the
// same shape as `claim.repairWindow.expectedComplete{,Long}` so the
// Step 4 / Step 6 surfaces and the WarrantyClaimCard speak one language.
// Steps without an SLA entry (e.g. terminal states like refund_credited
// or device_returned) contribute 0 — they're instant once the prior
// step lands.
export function expectedCompletionFor(claimType, today = new Date()) {
  const steps =
    claimType === 'warranty' ? WARRANTY_CLAIM_STATUSES : CLAIM_STATUSES
  const hours = steps.reduce(
    (sum, s) => sum + (CLAIM_SLAS[s.id]?.expectedHours || 0),
    0,
  )
  const target = new Date(today.getTime() + hours * 60 * 60 * 1000)
  // Build the strings explicitly so the output matches the existing
  // `repairWindow.expectedComplete{,Long}` shape ("Monday, 14 May" and
  // "Mon, 14 May") regardless of locale CLDR formatting quirks.
  const weekdayLong = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(target)
  const weekdayShort = new Intl.DateTimeFormat('en-GB', { weekday: 'short' }).format(target)
  const monthLong = new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(target)
  const monthShort = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(target)
  const day = target.getDate()
  return {
    long: `${weekdayLong}, ${day} ${monthLong}`,
    short: `${weekdayShort}, ${day} ${monthShort}`,
    hours,
    date: target,
  }
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
  reset_failed: {
    headline: 'Device still linked to iCloud',
    subline: 'We couldn’t wipe the device — Activation Lock is still on.',
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
    case 'reset_failed':
      return {
        ...base,
        headline: 'Action needed — device still linked to iCloud',
        body: 'Activation Lock is still on, so we can’t wipe the device. Remove it from your iCloud account and share your passcode so we can complete the reset.',
        primaryCta: 'Unlock device',
        secondaryCta: 'Cancel claim',
      }
    default:
      return null
  }
}
