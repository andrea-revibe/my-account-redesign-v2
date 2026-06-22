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
    short: 'Quality Check',
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

// Compensation pipeline — a 4-state refund chain for claims where the
// customer keeps the device (shipping refund / faulty charger). No pickup
// leg: the evidence is reviewed remotely, then the refund is issued. Reuses
// the refund status ids (`initiated` / `qc` / `refund_issued` /
// `refund_credited`) so `claimToneFor` / `claimPhaseTag` apply unchanged;
// only the labels differ (Submitted / Under review). Routed to ClaimCard,
// which swaps in this list for the dot timeline when `claim.type ===
// 'compensation'`. See docs/output/warranties_compensations.md §3.
export const COMPENSATION_CLAIM_STATUSES = [
  {
    id: 'initiated',
    label: 'Claim submitted',
    short: 'Submitted',
    headline: 'Claim submitted',
    icon: FileText,
  },
  {
    id: 'qc',
    label: 'Under review',
    short: 'Review',
    headline: 'Under review',
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

// The status list backing a claim's progress timeline + headline. Warranty
// has its own dedicated functions (warrantyClaim*); refund and compensation
// both flow through the ClaimCard, so this resolver picks the right list.
export function claimStatusesFor(claim) {
  return claim?.type === 'compensation'
    ? COMPENSATION_CLAIM_STATUSES
    : CLAIM_STATUSES
}

// Plain-language stage definitions surfaced by the `StatusExplainer` inline
// "Learn more" accordion under a claim card's status chip. Refund and
// compensation share status ids but read differently (compensation keeps the
// device and skips pickup), so each gets its own map. Basic copy — tune freely.
export const CLAIM_EXPLANATIONS = {
  initiated:
    "We've received your claim and our team is reviewing it. We will get back to you if needed.",
  pickup:
    'Your device has been picked up and is on its way to us. We will notify you as soon as it arrives.',
  qc: "We have received your device and our quality control team is now inspecting it. We will update you as soon as the review is complete.",
  refund_issued:
    'Your claim has been approved and your payment is being processed.',
  refund_credited:
    'Your cancellation is complete and your refund has been issued. Funds can take up to 10 business days to appear depending on your payment method.',
}

export const COMPENSATION_EXPLANATIONS = {
  initiated:
    "We've received your compensation request our team is reviewing it. We will get back to you if needed.",
  qc: 'Our team is reviewing your request and the evidence you provided. We will update you as soon as the review is complete.',
  refund_issued:
    'Your compensation has been approved and your refund is being processed.',
  refund_credited:
    'Your compensation is complete and your payment has been issued. Funds can take up to 10 business days to appear depending on your payment method.',
}

// Resolves the stage definition for a refund / compensation claim — warranty
// has its own (`warrantyClaimExplanation`). Returns null when none exists.
export function claimExplanation(claim) {
  const map =
    claim?.type === 'compensation' ? COMPENSATION_EXPLANATIONS : CLAIM_EXPLANATIONS
  return map[claim?.claimStatusId] ?? null
}

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

// Progress chain for a claim whose device ships *back* to the customer
// instead of being refunded — an invalid / wrong-device verdict (or a
// post-collection cancel). Keeps the refund chain's head (initiated →
// pickup → qc) and swaps the refund tail (refund_issued / refund_credited)
// for the return shipment's Shipped → Delivered, so it reads with the same
// tail as a warranty ship-back. Used by InvalidClaimCard's paid surface.
export const RETURN_CLAIM_STATUSES = [
  CLAIM_STATUSES[0], // initiated
  CLAIM_STATUSES[1], // pickup
  CLAIM_STATUSES[2], // qc
  { id: 'shipped', label: 'Shipped', short: 'Shipped', headline: 'On its way back', icon: Truck },
  { id: 'delivered', label: 'Delivered', short: 'Delivered', headline: 'Delivered', icon: CheckCircle2 },
]

// Current step in RETURN_CLAIM_STATUSES, driven by the return shipment's
// order-style status id. The device cleared the claim's head (initiated →
// pickup → qc) before any return leg exists, so the only live steps are the
// shipped leg (created / quality_check / shipped all sit on it) and the
// delivered terminal.
export function returnClaimProgressIndex(returnShipment) {
  return returnShipment?.currentStatusId === 'delivered' ? 4 : 3
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
// is in-flight and surfaces in "In progress". A `closure` flag (Revibe
// rejected the claim, see `isClaimClosed`) is terminal regardless of the
// underlying `claimStatusId`, so it never counts as active.
export function hasActiveClaim(order) {
  if (!order?.claim) return false
  if (order.claim.closure) return false
  if (order.claim.type === 'warranty') {
    return order.claim.claimStatusId !== 'device_returned'
  }
  return order.claim.claimStatusId !== 'refund_credited'
}

export function isClaimRefunded(order) {
  return Boolean(order?.claim) && order.claim.claimStatusId === 'refund_credited'
}

// Terminal: Revibe closed the claim without accepting it (outside the return
// window, ineligible, evidence insufficient, couldn't reproduce, duplicate).
// The customer keeps the device and no refund is issued. Drives the
// `ClosedClaimCard` Past-orders surface and the Claims-filter `Closed` bucket.
// `claim.closure` carries the reason + attributed ops note (see §3 of
// docs/output/returns/claim_tracking.md). This is distinct from a customer's
// own cancel (which strips the claim or ships the device back).
export function isClaimClosed(order) {
  return Boolean(order?.claim?.closure)
}

// Reason → customer-facing copy for a Revibe claim closure. Edit copy here,
// not in `ClosedClaimCard`; the card maps each reason to a glyph locally.
export const CLAIM_CLOSURE_REASONS = {
  outside_window: {
    label: 'Outside return window',
    headline: 'Claim closed — return window passed',
    subline:
      'This order is past the return window, so we weren’t able to accept the claim. You keep your device.',
  },
  not_eligible: {
    label: 'Not eligible',
    headline: 'Claim closed — not eligible',
    subline:
      'This item isn’t eligible for the claim you raised, so no refund will be issued. You keep your device.',
  },
  evidence_insufficient: {
    label: 'Evidence insufficient',
    headline: 'Claim closed — we couldn’t verify the issue',
    subline:
      'The photos and details we received weren’t enough to confirm the issue, so we couldn’t approve the claim. You keep your device.',
  },
  not_reproduced: {
    label: 'Issue not reproduced',
    headline: 'Claim closed — issue not reproduced',
    subline:
      'Our technicians couldn’t reproduce the issue you described, so we couldn’t approve the claim. You keep your device.',
  },
  duplicate: {
    label: 'Duplicate claim',
    headline: 'Claim closed — duplicate request',
    subline:
      'This matches another claim already on file, so we closed it as a duplicate. You keep your device.',
  },
  other: {
    label: 'Claim closed',
    headline: 'Claim closed — no refund',
    subline:
      'We reviewed your claim and couldn’t approve it, so no refund will be issued. You keep your device.',
  },
}

export function closureCopyFor(claim) {
  const reason = claim?.closure?.reason
  return CLAIM_CLOSURE_REASONS[reason] || CLAIM_CLOSURE_REASONS.other
}

// Whether the customer can still cancel a submitted claim — the whole
// window before anything terminal happens. Cancellable while the claim is
// `initiated` / `pickup` / `qc`; locked once the refund is issued
// (`refund_issued` / `refund_credited`) or the warranty enters repair
// (`under_repair` onward). Compensation has no `pickup`, so this resolves to
// `initiated` / `qc` for it — unchanged from before. Drives the baseline
// ClaimCard / WarrantyClaimCard footer affordance; the action-needed
// takeover cards expose Cancel regardless. Whether the cancel is a clean
// revert or a pay-return-shipping flow is decided by `cancelNeedsShipBack`.
const CANCELLABLE_STATUSES = ['initiated', 'pickup', 'qc']
export function canCancelClaim(claim) {
  if (!claim) return false
  return CANCELLABLE_STATUSES.includes(claim.claimStatusId)
}

// Once a device claim leaves `initiated` the unit is in the courier's hands
// or already at Revibe, so cancelling can't just revert to delivered — the
// customer must pay return shipping to get the device back (same surface +
// machinery as an invalid verdict; see `InvalidClaimCard`). Pre-pickup
// device claims and all compensation claims (the customer keeps the device)
// cancel cleanly. This is the single switch every cancel surface reads.
export function cancelNeedsShipBack(claim) {
  if (!claim || claim.type === 'compensation') return false
  return claim.claimStatusId !== 'initiated'
}

// Builds the `invalidClaim`-shaped ship-back gate for a customer-cancelled
// claim whose device is already with Revibe. `reason: 'cancelled'` switches
// only the copy in `InvalidClaimCard`; the fee card, delivery details,
// paid-state return-shipment tracking, and the journey return chain are all
// reused verbatim from the invalid-verdict path (every return node spreads
// `...claim.invalidClaim`, so `reason` survives). Amounts/dates mirror the
// invalid mock for consistency — hand-written, like the rest of the proto.
export function cancelReturnGate(order) {
  const currency = order?.currency || 'AED'
  return {
    reason: 'cancelled',
    requestedAt: '30 May · 4:18 PM',
    autoCancelAt: '6 Jun · 4:18 PM',
    timeLeftLabel: '7 days left',
    returnShipping: { amount: 35, currency },
    returnShipment: {
      courier: 'DHL Express',
      estimatedDelivery: 'Jun 8',
      estimatedDeliveryLong: 'Monday, 8 June',
      currentStatusId: 'created',
      timeline: { created: '31 May · 11:00 AM' },
    },
  }
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

// Terminal for an invalid / wrong-device verdict (or a post-collection
// cancel): the un-refunded device has been shipped back and delivered to the
// customer. The claim's own `claimStatusId` stays at `qc` (no refund leg), so
// this reads the return shipment instead. Drives the same "drop to Past +
// success tone" treatment as `isWarrantyDelivered`.
export function isReturnDelivered(order) {
  return order?.claim?.invalidClaim?.returnShipment?.currentStatusId === 'delivered'
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
  const step = claimStatusesFor(claim).find((s) => s.id === claim.claimStatusId)
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
    short: 'Quality Check',
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
    short: 'Shipped',
    headline: 'On its way back',
    icon: PackageCheck,
  },
  {
    id: 'device_returned',
    label: 'Delivered',
    short: 'Delivered',
    headline: 'Delivered',
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

// Plain-language stage definitions for the warranty pipeline, surfaced by the
// `StatusExplainer` "Learn more" accordion. Repair-and-return tail, so no
// money-movement copy. Basic copy — tune freely.
export const WARRANTY_EXPLANATIONS = {
  initiated:
    "We've received your warranty claim. Next we'll arrange to collect the device for repair.",
  pickup:
    'Our courier is collecting the device so our team can inspect and repair it.',
  qc: "We've received the device and are diagnosing the fault before starting the repair.",
  under_repair:
    "Our technicians are repairing your device. We'll ship it back as soon as it's fixed.",
  ship_back:
    'Your repaired device has left Revibe and is on its way back to you.',
  device_returned:
    'Your repaired device has been delivered. Thanks for your patience!',
}

export function warrantyClaimExplanation(claim) {
  return WARRANTY_EXPLANATIONS[claim?.claimStatusId] ?? null
}

// Ship-back tracking reuses the standard outbound SHIPPING_SUB_STATUSES
// from lib/statuses.js so a warranty return reads with the same
// milestones as any normal outgoing order (arrived in destination
// country → cleared customs → forwarded to third-party agent → out for
// delivery). No warranty-specific sub-status export needed.

// Labels duplicated from Step2Reason so the ClaimCard summary stays readable
// without a lib → component import. Keep in sync with REASONS there. Only the
// genuine change-of-mind reasons can reach a submitted claim — the faulty /
// wrong-item reasons redirect into the issue flow and never persist here.
export const REASON_LABELS = {
  no_fit: "Didn't suit my needs",
  expectations: "Didn't meet my expectations",
  better_option: 'Found a better option elsewhere',
  not_needed: 'No longer needed',
  arrived_late: 'Arrived too late',
  mistake: 'Ordered by mistake',
  changed_mind: 'Changed my mind',
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
  if (claim?.devicePrep?.neverSetUp) return 'Not set up — no reset needed'
  if (claim?.devicePrep?.option === 'reset') return 'Factory reset confirmed'
  if (claim?.devicePrep?.option === 'credentials')
    return 'Unlinked + passcode shared'
  return 'Not provided'
}

export const CLAIM_TYPE_LABELS = {
  change_of_mind: 'Change of mind',
  issue: 'Issue',
  warranty: 'Warranty',
  compensation: 'Compensation',
}

export function claimTypeLabel(typeOrClaim) {
  const type =
    typeof typeOrClaim === 'string' ? typeOrClaim : typeOrClaim?.type
  return CLAIM_TYPE_LABELS[type] || 'Claim'
}

// Typed claim-ref format: a self-describing prefix by claim type + the
// uppercased bare ref (e.g. `Ib4nP9` change-of-mind → `RET-IB4NP9`). The
// stored `claim.claimRef` is an inconsistent random string — sometimes bare
// (`Ib4nP9`), sometimes already prefixed without a dash (`RETrXc1`) — so we
// strip any leading type prefix before re-prefixing, making the format the
// single source of truth at display time.
export const CLAIM_REF_PREFIXES = {
  change_of_mind: 'RET',
  issue: 'RET',
  warranty: 'WAR',
  compensation: 'CMP',
  cancellation: 'CXL',
}

export function formatClaimRef(claimOrRef, type) {
  const raw =
    typeof claimOrRef === 'string' ? claimOrRef : claimOrRef?.claimRef
  if (!raw) return ''
  const claimType = type ?? (typeof claimOrRef === 'object' ? claimOrRef?.type : undefined)
  const prefix = CLAIM_REF_PREFIXES[claimType] || 'CLM'
  const bare = raw.replace(/^(RET|WAR|CMP|CXL|RETURN)-?/i, '').toUpperCase()
  return `${prefix}-${bare}`
}

// Every claim type submits proof (issue/warranty/compensation require an
// attachment in ClaimFlow Step 2) except change-of-mind, which has nothing to
// review. Drives the divergent `claim.created` intake notification.
export function claimRequiresProof(typeOrClaim) {
  const type =
    typeof typeOrClaim === 'string' ? typeOrClaim : typeOrClaim?.type
  return type !== 'change_of_mind'
}

export function refundMethodLabel(claim, order) {
  if (claim?.refundMethod === 'wallet') return 'Revibe Wallet'
  if (claim?.refundMethod === 'original') {
    const pm = order?.paymentMethod
    if (pm?.type === 'bnpl') return pm.brand || 'Buy now, pay later'
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
