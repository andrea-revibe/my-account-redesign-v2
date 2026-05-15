// Derives a layered order's past-event list for the HistoryThread chip
// row on ClaimCard and the cancelled refund-state PastOrderCard.
//
// Each event is `{ id, kind, status, tone, title, timestamp, detail?,
// message?, ref? }`. Resolved events default to neutral tone so the thread
// reads as a calm record; only an explicit `cancellation/rejected` keeps a
// danger tone (the rejection is the one historical event that genuinely
// signals something went sideways and should still stand out).
//
// Modes:
//   'claim'        — active claim is the hero, so it's excluded. Includes
//                    order placed, cancellation events (if any), delivery.
//   'cancellation' — active refund (refund_pending/refunded) is the hero,
//                    so we just include the placed event + cancellation
//                    request as background context.
//
// An order can opt out of derivation by supplying its own `events: [...]`
// array (same shape). When that's present we use it verbatim and just
// filter out the active one.

function pickActiveId(order, mode) {
  if (mode === 'claim') return 'evt-claim-active'
  if (mode === 'cancellation') return 'evt-refund-active'
  return null
}

function buildPlacedEvent(order) {
  if (!order.timeline?.created) return null
  return {
    id: 'evt-placed',
    kind: 'order',
    status: 'completed',
    tone: 'neutral',
    title: 'Order placed',
    timestamp: order.timeline.created,
    detail: `${order.product.name} · ${order.product.variant}`,
  }
}

function buildCancellationEvent(order) {
  const c = order.cancellationTimeline
  if (!c) return null
  if (c.rejected) {
    return {
      id: 'evt-cancel-rejected',
      kind: 'cancellation',
      status: 'rejected',
      tone: 'danger',
      title: 'Cancellation rejected',
      timestamp: c.rejected,
      detail: c.requested ? `Requested ${c.requested}` : undefined,
      message: order.cancellationRejection?.reason,
      ref: order.cancellationRejection?.ref || order.cancellationRef,
    }
  }
  if (c.requested) {
    return {
      id: 'evt-cancel-requested',
      kind: 'cancellation',
      status: 'requested',
      tone: 'neutral',
      title: 'Cancellation requested',
      timestamp: c.requested,
      ref: order.cancellationRef,
    }
  }
  return null
}

function buildDeliveryEvent(order) {
  if (!order.timeline?.delivered) return null
  const courier = order.courier ? ` · ${order.courier}` : ''
  return {
    id: 'evt-delivered',
    kind: 'delivery',
    status: 'delivered',
    tone: 'neutral',
    title: 'Delivered',
    timestamp: order.timeline.delivered,
    detail: `Signed for at door${courier}`,
  }
}

export function getHistoryEvents(order, mode = 'claim') {
  if (Array.isArray(order.events)) {
    const activeId = pickActiveId(order, mode)
    return order.events.filter((e) => e.id !== activeId)
  }

  const events = []
  const placed = buildPlacedEvent(order)
  if (placed) events.push(placed)

  if (mode === 'claim') {
    const cancellation = buildCancellationEvent(order)
    if (cancellation) events.push(cancellation)
    const delivery = buildDeliveryEvent(order)
    if (delivery) events.push(delivery)
  } else if (mode === 'cancellation') {
    const cancellation = buildCancellationEvent(order)
    if (cancellation) events.push(cancellation)
  }

  return events
}
