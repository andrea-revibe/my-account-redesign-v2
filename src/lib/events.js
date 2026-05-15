// Derives a layered order's past-event list for the HistoryThread chip
// row on ClaimCard and the cancelled refund-state PastOrderCard.
//
// Each event is `{ id, kind, status, tone, title, timestamp, detail?,
// message?, ref? }`. All resolved events use neutral tone so the thread
// reads as a calm record — even cancel-rejected, which is historical
// context by the time the user sees it.
//
// Modes:
//   'claim'        — active claim is the hero, so it's excluded. Includes
//                    order placed, cancellation events (if any), delivery.
//   'cancellation' — active refund is the hero. Past events: placed,
//                    plus the cancellation request once the order has
//                    moved past `requested` (refund_pending / refunded).
//                    In `requested` the request itself is the hero, so
//                    only `placed` survives as background context.
//   'delivered'    — delivery is the active hero (DeliveredOrderCard).
//                    Past events: placed only. Cancel-rejected can't
//                    occur on this card (rejected-then-delivered orders
//                    layer into a ClaimCard once a return is raised).
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
    const requestedDate = c.requested ? c.requested.split(' · ')[0] : null
    return {
      id: 'evt-cancel-rejected',
      kind: 'cancellation',
      status: 'rejected',
      tone: 'neutral',
      title: 'Cancellation rejected',
      timestamp: c.rejected,
      detail: requestedDate ? `Requested ${requestedDate}` : undefined,
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

function buildProofResubmissionEvent(order) {
  const pr = order.claim?.proofResubmission
  if (!pr) return null
  const n = pr.fileCount
  return {
    id: 'evt-proof-resubmitted',
    kind: 'evidence',
    status: 'resubmitted',
    tone: 'neutral',
    title: 'Evidence resubmitted',
    timestamp: pr.at,
    detail: `${n} new file${n === 1 ? '' : 's'} sent`,
  }
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
    const proofResub = buildProofResubmissionEvent(order)
    if (proofResub) events.push(proofResub)
  } else if (mode === 'cancellation') {
    if (order.cancellationStatusId !== 'requested') {
      const cancellation = buildCancellationEvent(order)
      if (cancellation) events.push(cancellation)
    }
  } else if (mode === 'delivered') {
    // Delivery is the active hero; only `placed` survives as background.
  }

  return events
}
