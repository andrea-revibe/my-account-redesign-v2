// Top-level fulfilment progression. Always 4 steps in the horizontal
// timeline regardless of how shipping decomposes underneath. `short` is the
// label used under the compact dot timelines on collapsed cards and the hero.
export const STATUSES = [
  { id: 'created', label: 'Order placed', short: 'Placed' },
  { id: 'quality_check', label: 'Quality check', short: 'Quality Check' },
  { id: 'shipped', label: 'Shipped', short: 'Shipped' },
  { id: 'delivered', label: 'Delivered', short: 'Delivered' },
]

// Sub-statuses that apply only while the order is in the `shipped` stage.
// "delivered" is intentionally NOT here — when the package is delivered,
// the order transitions to the top-level `delivered` stage instead.
import {
  Plane,
  ShieldCheck,
  ArrowRightLeft,
  Truck,
  Package,
  PackageCheck,
  XCircle,
  Hourglass,
  Wallet,
  CircleDollarSign,
} from 'lucide-react'

// Sub-statuses that apply only while `state === 'cancelled'`. The `requested`
// step only fires on the quality_check path — at QC the supplier still needs
// to confirm the unit isn't already packed. created cancellations skip
// straight to `refund_pending` because nothing is in motion yet.
export const CANCELLATION_STATUSES = [
  {
    id: 'requested',
    label: 'Requested',
    headline: 'Cancellation requested',
    icon: Hourglass,
  },
  {
    id: 'refund_pending',
    label: 'Refund pending',
    headline: 'Refund pending',
    icon: Wallet,
  },
  {
    id: 'refunded',
    label: 'Refunded',
    headline: 'Refunded',
    icon: CircleDollarSign,
  },
]

export const SHIPPING_SUB_STATUSES = [
  {
    id: 'arrived_destination',
    label: 'Arrived in destination country',
    icon: Plane,
  },
  {
    id: 'cleared_customs',
    label: 'Cleared customs',
    icon: ShieldCheck,
  },
  {
    id: 'forwarded_to_agent',
    label: 'Forwarded to third-party agent',
    icon: ArrowRightLeft,
  },
  {
    id: 'out_for_delivery',
    label: 'Out for delivery',
    icon: Truck,
  },
]

// Header / summary states. Independent of the progression — an order can be
// "open" while at quality_check or "cancelled" while shipped.
export const ORDER_STATES = {
  open: { label: 'Open', chip: null, summaryClass: 'text-ink' },
  close: {
    label: 'Close',
    chip: { text: 'Close', bg: 'bg-chip-warn', fg: 'text-chip-warnInk' },
    summaryClass: 'text-ink',
  },
  cancelled: {
    label: 'Cancelled',
    chip: { text: 'Cancelled', bg: 'bg-red-100', fg: 'text-chip-danger' },
    summaryClass: 'text-chip-danger',
  },
}

export function progressIndex(currentStatusId) {
  const i = STATUSES.findIndex((s) => s.id === currentStatusId)
  return i === -1 ? STATUSES.length - 1 : i
}

export function subProgressIndex(currentSubStatusId) {
  const i = SHIPPING_SUB_STATUSES.findIndex((s) => s.id === currentSubStatusId)
  return i // -1 if not provided — caller handles
}

export function cancellationProgressIndex(currentCancellationStatusId) {
  const i = CANCELLATION_STATUSES.findIndex(
    (s) => s.id === currentCancellationStatusId,
  )
  return i // -1 if not provided
}

// Cancelled orders carry their fulfilment `statusId` frozen at the cancel
// point. The created-stage cancellation path skips the `requested` phase
// because there's no supplier check needed (nothing's been pulled yet).
export function cancellationStepsFor(order) {
  if (order.statusId === 'created') {
    return CANCELLATION_STATUSES.filter((s) => s.id !== 'requested')
  }
  return CANCELLATION_STATUSES
}

// Returns the status banner shown at the top of an expanded order card:
// a tinted box with a colored leading phrase and an explanatory sentence.
// Defaults are status-driven; `order.delayed` flips the tone to warn and
// swaps the lead/body; `order.statusMessage` overrides the body text only
// (mirrors how a backend would inject ad-hoc updates without changing the
// underlying status).
export function statusDescription(order) {
  if (order.state === 'cancelled') {
    const phase = order.cancellationStatusId
    if (phase === 'requested') {
      return {
        tone: 'danger',
        lead: 'Cancellation requested',
        body:
          order.statusMessage ??
          "We're confirming with the supplier that this unit hasn't been packed yet. This usually takes a few hours.",
      }
    }
    if (phase === 'refunded') {
      return {
        tone: 'success',
        lead: 'Refund complete',
        body:
          order.statusMessage ??
          'Your refund has been issued. Funds may take a few business days to land depending on your payment method.',
      }
    }
    // refund_pending or unspecified — the historical default.
    return {
      tone: 'danger',
      lead: 'Refund pending',
      body:
        order.statusMessage ??
        'Your cancellation has been accepted. Your refund is being processed and will land shortly.',
    }
  }

  if (order.delayed) {
    return {
      tone: 'warn',
      lead: 'Taking longer than expected',
      body: order.statusMessage ?? DELAYED_BODY[order.statusId] ?? DELAYED_BODY.default,
    }
  }

  const base = STATUS_DESCRIPTIONS[descriptionKey(order)] ?? STATUS_DESCRIPTIONS.created
  return {
    tone: base.tone,
    lead: base.lead,
    body: order.statusMessage ?? base.body,
  }
}

function lastTimelineEntry(map) {
  if (!map) return null
  const keys = Object.keys(map)
  return keys.length ? map[keys[keys.length - 1]] : null
}

function descriptionKey(order) {
  if (order.statusId === 'shipped' && order.subStatusId) {
    return `shipped:${order.subStatusId}`
  }
  return order.statusId
}

// Leading phrases describe the *condition* (on track / arriving today / all
// done / refund in progress), not the process step — that way they don't
// repeat the headline already shown in the card header.
const STATUS_DESCRIPTIONS = {
  created: {
    tone: 'brand',
    lead: 'On track',
    body:
      "We've received your order and it's on its way to our quality lab for inspection.",
  },
  quality_check: {
    tone: 'brand',
    lead: 'On track',
    body: 'Your device is currently undergoing a 50-point inspection.',
  },
  shipped: {
    tone: 'brand',
    lead: 'On track',
    body: 'Your package is on its way to the destination country.',
  },
  'shipped:arrived_destination': {
    tone: 'brand',
    lead: 'On track',
    body:
      'Your package has arrived in the destination country and is awaiting customs clearance.',
  },
  'shipped:cleared_customs': {
    tone: 'brand',
    lead: 'On track',
    body:
      'Your package cleared customs and is being forwarded to the local delivery partner.',
  },
  'shipped:forwarded_to_agent': {
    tone: 'brand',
    lead: 'On track',
    body: 'Your package has been handed to the local courier for the final mile.',
  },
  'shipped:out_for_delivery': {
    tone: 'brand',
    lead: 'Arriving today',
    body: 'Your package is with the courier and will be delivered today.',
  },
  delivered: {
    tone: 'success',
    lead: 'All done',
    body: 'Your order has been delivered. Enjoy your device!',
  },
}

const DELAYED_BODY = {
  quality_check:
    'The inspection process is taking a bit longer than expected. Please hang tight.',
  shipped:
    'Your package is delayed in transit. We\'ll update you as soon as the courier provides new information.',
  default:
    "We've hit a small delay on this order. We'll update you as soon as we have more information.",
}

// Picks the single "most in-flight" order to auto-expand by default — the
// non-delivered, non-cancelled order furthest along the fulfilment pipeline
// (sub-status counts as a finer-grained tiebreaker within `shipped`). Returns
// null when nothing in the list is in flight (e.g. only delivered orders).
export function pickActiveOrderId(orders) {
  const inFlight = orders.filter(
    (o) => o.statusId !== 'delivered' && o.state !== 'cancelled',
  )
  if (inFlight.length === 0) return null
  const rank = (o) =>
    progressIndex(o.statusId) * 10 + Math.max(0, subProgressIndex(o.subStatusId))
  const sorted = [...inFlight].sort((a, b) => rank(b) - rank(a))
  return sorted[0].id
}

// Headline shown in the collapsed-card header. Sub-status takes precedence
// while shipping so the customer sees "Out for delivery" instead of "Shipped".
export function statusHeadline(order) {
  if (order.state === 'cancelled') {
    const phase = CANCELLATION_STATUSES.find(
      (s) => s.id === order.cancellationStatusId,
    )
    return phase ? phase.headline : 'Cancelled'
  }
  if (order.statusId === 'delivered') return 'Delivered'
  if (order.statusId === 'shipped') {
    const sub = SHIPPING_SUB_STATUSES.find((s) => s.id === order.subStatusId)
    if (sub) return sub.label
    return 'Shipped'
  }
  const top = STATUSES.find((s) => s.id === order.statusId)
  return top ? top.label : 'Order'
}

// Smaller line under the headline — most recent timeline timestamp,
// phrased to fit the state.
export function statusSubline(order) {
  if (order.state === 'cancelled') {
    const ts =
      order.cancellationTimeline?.[order.cancellationStatusId] ??
      lastTimelineEntry(order.cancellationTimeline) ??
      lastTimelineEntry(order.timeline)
    return ts ? `Updated ${ts}` : null
  }
  if (order.statusId === 'delivered' && order.timeline?.delivered) {
    return order.timeline.delivered
  }
  if (order.statusId === 'shipped') {
    // Forward-looking ETA wins when DHL provides it; otherwise fall back
    // to the most recent sub-status timestamp.
    if (order.estimatedDelivery) return `Delivery by ${order.estimatedDelivery}`
    const ts = order.subTimeline?.[order.subStatusId] || order.timeline?.shipped
    return ts ? `Updated ${ts}` : null
  }
  if (order.statusId === 'quality_check' && order.timeline?.quality_check) {
    return `Since ${order.timeline.quality_check}`
  }
  if (order.statusId === 'created' && order.timeline?.created) {
    return order.timeline.created
  }
  return null
}

// Icon + colour scheme for the status bubble in the collapsed-card header.
// Cancelled goes red, delivered green, everything in-progress is brand purple.
export function statusIconFor(order) {
  if (order.state === 'cancelled') {
    if (order.cancellationStatusId === 'refunded') {
      return { Icon: CircleDollarSign, bg: 'bg-green-50', fg: 'text-success' }
    }
    if (order.cancellationStatusId === 'refund_pending') {
      return { Icon: Wallet, bg: 'bg-red-50', fg: 'text-chip-danger' }
    }
    if (order.cancellationStatusId === 'requested') {
      return { Icon: Hourglass, bg: 'bg-red-50', fg: 'text-chip-danger' }
    }
    return { Icon: XCircle, bg: 'bg-red-50', fg: 'text-chip-danger' }
  }
  if (order.statusId === 'delivered') {
    return { Icon: PackageCheck, bg: 'bg-green-50', fg: 'text-success' }
  }
  if (order.statusId === 'shipped') {
    return { Icon: Truck, bg: 'bg-brand/10', fg: 'text-brand' }
  }
  if (order.statusId === 'quality_check') {
    return { Icon: ShieldCheck, bg: 'bg-brand/10', fg: 'text-brand' }
  }
  return { Icon: Package, bg: 'bg-brand/10', fg: 'text-brand' }
}
