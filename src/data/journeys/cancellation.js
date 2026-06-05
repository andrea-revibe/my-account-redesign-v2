
// ----- Cancellation journey ---------------------------------------------
// One journey, two cancellation entry points off `placed`:
//
//   A. Before QC (created stage). No supplier review is needed — nothing is
//      packed yet — so the request lands straight on `refund_pending` (we
//      still stamp a `requested` timestamp so the stepper reads Requested ✓
//      → Pending). No accepted/declined fork. Forks only on refund method.
//
//   B. At QC (quality_check stage, via `qc_started`). Current behaviour:
//      the request waits on an ops review (accepted vs declined). Both
//      method branches converge on the same `cancellation_declined` node —
//      the decline outcome is identical regardless of refund method (no
//      refund is ever issued).
//
// Each entry point forks on refund method (wallet vs original payment),
// because each path produces a different `refund` shape (wallet has no fee;
// card carries the 5% processing fee + ETA gap).
//
// Accepted / before-QC branches terminate at a `refunded_*` node (order
// drops to Past orders). The at-QC declined branch continues through the
// standard shipping chain so the `Cancel rejected` chip surfaces in
// HistoryThread on OrderCard / PastOrderCard — demonstrating that the
// historical event survives across card transitions.
export const CANCELLATION_NODES = [
  {
    id: 'placed',
    label: 'Order placed',
    trigger: 'customer',
    event: 'order.created',
    next: ['cancel_before_qc_wallet', 'cancel_before_qc_card', 'qc_started'],
    apply: (o) => o,
  },
  {
    id: 'cancel_before_qc_wallet',
    label: 'Cancellation before QC — wallet refund',
    trigger: 'customer',
    event: 'order.cancellation.requested',
    next: ['refunded_before_qc_wallet'],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      cancellationStatusId: 'refund_pending',
      cancellationRef: 'J0urN0',
      cancellationTimeline: {
        requested: '20 May · 8:24 AM',
        refund_pending: '20 May · 8:24 AM',
      },
      refund: {
        subtotal: 1029,
        amount: 1029,
        destination: { kind: 'wallet', label: 'Revibe Wallet' },
        breakdown: [
          { label: 'iPhone 13', amount: 939 },
          { label: 'Revibe Care', amount: 90 },
        ],
      },
    }),
  },
  {
    id: 'refunded_before_qc_wallet',
    label: 'Wallet refund credited',
    trigger: 'system',
    event: 'order.refund.completed',
    next: [],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refunded',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refunded: '20 May · 8:25 AM',
      },
      refund: {
        ...o.refund,
        fundsAvailable: 'Available now in your wallet',
      },
    }),
  },
  {
    id: 'cancel_before_qc_card',
    label: 'Cancellation before QC — card refund',
    trigger: 'customer',
    event: 'order.cancellation.requested',
    next: ['refunded_before_qc_card'],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      cancellationStatusId: 'refund_pending',
      cancellationRef: 'J0urN0',
      cancellationTimeline: {
        requested: '20 May · 8:24 AM',
        refund_pending: '20 May · 8:24 AM',
      },
      refund: {
        subtotal: 1029,
        fee: { label: 'Processing fee', rate: 0.05, amount: 51.45 },
        amount: 977.55,
        destination: { kind: 'card', label: 'Visa', last4: '4242' },
        breakdown: [
          { label: 'iPhone 13', amount: 939 },
          { label: 'Revibe Care', amount: 90 },
        ],
      },
    }),
  },
  {
    id: 'refunded_before_qc_card',
    label: 'Card refund issued',
    trigger: 'system',
    event: 'order.refund.completed',
    next: [],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refunded',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refunded: '23 May · 9:30 AM',
      },
    }),
  },
  {
    id: 'qc_started',
    label: 'Quality check started',
    trigger: 'system',
    event: 'order.quality_check.started',
    next: ['cancellation_requested_wallet', 'cancellation_requested_card'],
    apply: (o) => ({
      ...o,
      statusId: 'quality_check',
      timeline: { ...o.timeline, quality_check: '21 May · 9:18 AM' },
    }),
  },
  {
    id: 'cancellation_requested_wallet',
    label: 'Cancellation requested — wallet refund',
    trigger: 'customer',
    event: 'order.cancellation.requested',
    next: ['cancellation_accepted_wallet', 'cancellation_declined', 'cancellation_kept'],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      cancellationStatusId: 'requested',
      cancellationRef: 'J0urN1',
      cancellationTimeline: { requested: '21 May · 11:42 AM' },
      refund: {
        subtotal: 1029,
        amount: 1029,
        destination: { kind: 'wallet', label: 'Revibe Wallet' },
        breakdown: [
          { label: 'iPhone 13', amount: 939 },
          { label: 'Revibe Care', amount: 90 },
        ],
      },
    }),
  },
  {
    id: 'cancellation_accepted_wallet',
    label: 'Cancellation accepted',
    trigger: 'system',
    event: 'order.cancellation.accepted',
    next: ['refunded_wallet'],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refund_pending',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refund_pending: '21 May · 1:08 PM',
      },
    }),
  },
  {
    id: 'refunded_wallet',
    label: 'Wallet refund credited',
    trigger: 'system',
    event: 'order.refund.completed',
    next: [],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refunded',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refunded: '21 May · 1:09 PM',
      },
      refund: {
        ...o.refund,
        fundsAvailable: 'Available now in your wallet',
      },
    }),
  },
  {
    id: 'cancellation_requested_card',
    label: 'Cancellation requested — card refund',
    trigger: 'customer',
    event: 'order.cancellation.requested',
    next: ['cancellation_accepted_card', 'cancellation_declined', 'cancellation_kept'],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      cancellationStatusId: 'requested',
      cancellationRef: 'J0urN1',
      cancellationTimeline: { requested: '21 May · 11:42 AM' },
      refund: {
        subtotal: 1029,
        fee: { label: 'Processing fee', rate: 0.05, amount: 51.45 },
        amount: 977.55,
        destination: { kind: 'card', label: 'Visa', last4: '4242' },
        breakdown: [
          { label: 'iPhone 13', amount: 939 },
          { label: 'Revibe Care', amount: 90 },
        ],
      },
    }),
  },
  {
    id: 'cancellation_accepted_card',
    label: 'Cancellation accepted',
    trigger: 'system',
    event: 'order.cancellation.accepted',
    next: ['refunded_card'],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refund_pending',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refund_pending: '21 May · 1:08 PM',
      },
    }),
  },
  {
    id: 'refunded_card',
    label: 'Card refund issued',
    trigger: 'system',
    event: 'order.refund.completed',
    next: [],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refunded',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refunded: '24 May · 9:30 AM',
      },
    }),
  },
  {
    id: 'cancellation_declined',
    label: 'Cancellation declined',
    trigger: 'system',
    event: 'order.cancellation.declined',
    next: ['shipped_arrived_destination'],
    apply: (o) => ({
      ...o,
      state: 'open',
      cancellationStatusId: undefined,
      cancellationTimeline: {
        ...o.cancellationTimeline,
        rejected: '21 May · 4:18 PM',
      },
      cancellationRejection: {
        ref: 'CXL-J0urN1',
        reason:
          "After review, the supplier confirmed your unit had already been packed and we couldn't pull it back.",
      },
      // Refund was never issued — clear the in-flight refund object.
      refund: undefined,
    }),
  },
  {
    id: 'cancellation_kept',
    label: 'Cancellation reversed — order kept',
    trigger: 'customer',
    event: 'order.cancellation.reverted',
    // Only reachable from `requested` (before the refund is accepted). The
    // customer reverses their own cancellation: state flips back to open,
    // the in-flight refund is voided, and statusId is left untouched
    // (quality_check) so the order resumes exactly where it paused. A
    // `reverted` timestamp + `cancellationReversal` marker survive so the
    // event shows as a history chip once the order is delivered — parallel
    // to how the declined branch keeps its rejection trace.
    next: ['shipped_arrived_destination'],
    apply: (o) => ({
      ...o,
      state: 'open',
      cancellationStatusId: undefined,
      cancellationTimeline: {
        ...o.cancellationTimeline,
        reverted: '21 May · 12:05 PM',
      },
      cancellationReversal: {
        ref: 'CXL-J0urN1',
        reason: 'You reversed the cancellation — fulfilment resumed where it left off.',
      },
      refund: undefined,
    }),
  },
  {
    id: 'shipped_arrived_destination',
    label: 'Arrived in destination country',
    trigger: 'system',
    event: 'shipment.arrived_destination',
    apply: (o) => ({
      ...o,
      statusId: 'shipped',
      subStatusId: 'arrived_destination',
      courier: 'DHL Express',
      trackingNumber: '25193399',
      trackingUrl: 'https://www.dhl.com/track',
      timeline: { ...o.timeline, shipped: '23 May · 11:02 AM' },
      subTimeline: {
        ...(o.subTimeline ?? {}),
        arrived_destination: '24 May · 8:30 AM',
      },
    }),
  },
  {
    id: 'shipped_cleared_customs',
    label: 'Cleared customs',
    trigger: 'system',
    event: 'shipment.cleared_customs',
    apply: (o) => ({
      ...o,
      subStatusId: 'cleared_customs',
      subTimeline: {
        ...(o.subTimeline ?? {}),
        cleared_customs: '24 May · 11:15 AM',
      },
    }),
  },
  {
    id: 'shipped_forwarded_to_agent',
    label: 'Forwarded to third-party agent',
    trigger: 'system',
    event: 'shipment.forwarded_to_agent',
    apply: (o) => ({
      ...o,
      subStatusId: 'forwarded_to_agent',
      subTimeline: {
        ...(o.subTimeline ?? {}),
        forwarded_to_agent: '24 May · 4:45 PM',
      },
    }),
  },
  {
    id: 'shipped_out_for_delivery',
    label: 'Out for delivery',
    trigger: 'system',
    event: 'shipment.out_for_delivery',
    apply: (o) => ({
      ...o,
      subStatusId: 'out_for_delivery',
      subTimeline: {
        ...(o.subTimeline ?? {}),
        out_for_delivery: '25 May · 7:30 AM',
      },
    }),
  },
  {
    id: 'delivered',
    label: 'Delivered',
    trigger: 'system',
    event: 'shipment.delivered',
    next: [],
    apply: (o) => ({
      ...o,
      statusId: 'delivered',
      state: 'close',
      subStatusId: null,
      timeline: { ...o.timeline, delivered: '25 May · 3:14 PM' },
      deliveredOn: '2026-05-25',
      deliveredOnLong: 'Monday, 25 May',
    }),
  },
]
