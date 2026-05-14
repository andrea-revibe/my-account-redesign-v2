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

export function refundMethodLabel(claim, order) {
  if (claim?.refundMethod === 'wallet') return 'Revibe Wallet'
  if (claim?.refundMethod === 'original') {
    const pm = order?.paymentMethod
    if (pm) return `${pm.brand || 'Card'} •• ${pm.last4 || '0000'}`
    return 'Original payment method'
  }
  return 'Not selected'
}
