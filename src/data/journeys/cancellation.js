
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
    next: [
      'cancel_before_qc_wallet',
      'cancel_before_qc_card',
      'order_late',
      'qc_started',
      'revibe_cancel_unavailable',
      'revibe_cancel_price',
      'revibe_cancel_address',
    ],
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
  // ----- Late + past-promise branch (before QC) -------------------------
  // The order has blown its SLA at the `created` stage AND is past the
  // initial delivery promise the customer saw at checkout. `delayed` +
  // `statusBanner` give InProgressCard the same "Taking longer than usual"
  // amber treatment the Dynamic EDD sandbox produces for `order_late`.
  // `promiseBreached` is the single flag the CancelOrderSheet reads to waive
  // the card processing fee and add the AED 100 Wallet bonus. Production
  // would derive it from the EDD model (currentStageSlaStatus === late AND
  // today > initialPromise) rather than stamping it.
  {
    id: 'order_late',
    label: 'Order late — past delivery promise',
    trigger: 'system',
    event: 'order.sla.breached',
    next: ['cancel_late_before_qc_wallet', 'cancel_late_before_qc_card'],
    apply: (o) => ({
      ...o,
      delayed: true,
      promiseBreached: true,
      estimatedDelivery: 'May 28',
      estimatedDeliveryLong: 'Thursday, 28 May',
      statusBanner: {
        tone: 'warn',
        lead: 'Taking longer than usual',
        body:
          "Your order is taking a little longer than usual to start. We're working to move your order forward.",
      },
    }),
  },
  {
    id: 'cancel_late_before_qc_wallet',
    label: 'Late cancellation before QC — wallet refund + bonus',
    trigger: 'customer',
    event: 'order.cancellation.requested',
    next: ['refunded_late_before_qc_wallet'],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      cancellationStatusId: 'refund_pending',
      cancellationRef: 'J0urN2',
      cancellationTimeline: {
        requested: '28 May · 9:10 AM',
        refund_pending: '28 May · 9:10 AM',
      },
      refund: {
        subtotal: 1029,
        bonus: 100,
        amount: 1129,
        destination: { kind: 'wallet', label: 'Revibe Wallet' },
        breakdown: [
          { label: 'iPhone 13', amount: 939 },
          { label: 'Revibe Care', amount: 90 },
        ],
      },
    }),
  },
  {
    id: 'refunded_late_before_qc_wallet',
    label: 'Wallet refund + bonus credited',
    trigger: 'system',
    event: 'order.refund.completed',
    next: [],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refunded',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refunded: '28 May · 9:11 AM',
      },
      refund: {
        ...o.refund,
        fundsAvailable: 'Available now in your wallet',
      },
    }),
  },
  {
    id: 'cancel_late_before_qc_card',
    label: 'Late cancellation before QC — card refund (no fee)',
    trigger: 'customer',
    event: 'order.cancellation.requested',
    next: ['refunded_late_before_qc_card'],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      cancellationStatusId: 'refund_pending',
      cancellationRef: 'J0urN2',
      cancellationTimeline: {
        requested: '28 May · 9:10 AM',
        refund_pending: '28 May · 9:10 AM',
      },
      // Promise breached → the 5% processing fee is waived (no `fee` object).
      refund: {
        subtotal: 1029,
        amount: 1029,
        destination: { kind: 'card', label: 'Visa', last4: '4242' },
        breakdown: [
          { label: 'iPhone 13', amount: 939 },
          { label: 'Revibe Care', amount: 90 },
        ],
      },
    }),
  },
  {
    id: 'refunded_late_before_qc_card',
    label: 'Card refund issued (no fee)',
    trigger: 'system',
    event: 'order.refund.completed',
    next: [],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refunded',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refunded: '31 May · 9:30 AM',
      },
    }),
  },
  {
    id: 'qc_started',
    label: 'Quality check started',
    trigger: 'system',
    event: 'order.quality_check.started',
    next: [
      'cancellation_requested_wallet',
      'cancellation_requested_card',
      'qc_late',
      'revibe_cancel_unavailable',
      'revibe_cancel_price',
      'revibe_cancel_address',
    ],
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
  // ----- Late + past-promise branch (at QC) -----------------------------
  // Same breach, reached at the `quality_check` stage. Because the promise
  // is already broken, the request is honored straight through (no
  // accepted/declined fork — there's nothing to push back on); the customer
  // can still reverse it via `cancellation_kept` while it's `requested`.
  {
    id: 'qc_late',
    label: 'QC late — past delivery promise',
    trigger: 'system',
    event: 'order.sla.breached',
    next: ['cancellation_late_requested_wallet', 'cancellation_late_requested_card'],
    apply: (o) => ({
      ...o,
      delayed: true,
      promiseBreached: true,
      estimatedDelivery: 'May 28',
      estimatedDeliveryLong: 'Thursday, 28 May',
      statusBanner: {
        tone: 'warn',
        lead: 'Taking longer than usual',
        body:
          "Quality check is taking longer than usual. We're working to move your order forward.",
      },
    }),
  },
  {
    id: 'cancellation_late_requested_wallet',
    label: 'Late cancellation requested — wallet refund + bonus',
    trigger: 'customer',
    event: 'order.cancellation.requested',
    next: ['cancellation_late_accepted_wallet', 'cancellation_kept'],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      cancellationStatusId: 'requested',
      cancellationRef: 'J0urN3',
      cancellationTimeline: { requested: '28 May · 11:42 AM' },
      refund: {
        subtotal: 1029,
        bonus: 100,
        amount: 1129,
        destination: { kind: 'wallet', label: 'Revibe Wallet' },
        breakdown: [
          { label: 'iPhone 13', amount: 939 },
          { label: 'Revibe Care', amount: 90 },
        ],
      },
    }),
  },
  {
    id: 'cancellation_late_accepted_wallet',
    label: 'Cancellation accepted',
    trigger: 'system',
    event: 'order.cancellation.accepted',
    next: ['refunded_late_wallet'],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refund_pending',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refund_pending: '28 May · 1:08 PM',
      },
    }),
  },
  {
    id: 'refunded_late_wallet',
    label: 'Wallet refund + bonus credited',
    trigger: 'system',
    event: 'order.refund.completed',
    next: [],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refunded',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refunded: '28 May · 1:09 PM',
      },
      refund: {
        ...o.refund,
        fundsAvailable: 'Available now in your wallet',
      },
    }),
  },
  {
    id: 'cancellation_late_requested_card',
    label: 'Late cancellation requested — card refund (no fee)',
    trigger: 'customer',
    event: 'order.cancellation.requested',
    next: ['cancellation_late_accepted_card', 'cancellation_kept'],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      cancellationStatusId: 'requested',
      cancellationRef: 'J0urN3',
      cancellationTimeline: { requested: '28 May · 11:42 AM' },
      refund: {
        subtotal: 1029,
        amount: 1029,
        destination: { kind: 'card', label: 'Visa', last4: '4242' },
        breakdown: [
          { label: 'iPhone 13', amount: 939 },
          { label: 'Revibe Care', amount: 90 },
        ],
      },
    }),
  },
  {
    id: 'cancellation_late_accepted_card',
    label: 'Cancellation accepted',
    trigger: 'system',
    event: 'order.cancellation.accepted',
    next: ['refunded_late_card'],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refund_pending',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refund_pending: '28 May · 1:08 PM',
      },
    }),
  },
  {
    id: 'refunded_late_card',
    label: 'Card refund issued (no fee)',
    trigger: 'system',
    event: 'order.refund.completed',
    next: [],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refunded',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refunded: '31 May · 9:30 AM',
      },
    }),
  },
  {
    id: 'cancellation_declined',
    label: 'Cancellation declined',
    trigger: 'system',
    event: 'order.cancellation.declined',
    // Outbound country fork (shared shipping chain): AE/ZA walk the granular
    // sub-statuses; SA/Others collapse to a single `shipped_simple` step.
    // country_split.md §6.
    next: [
      { id: 'shipped_arrived_destination', countries: ['AE', 'ZA'] },
      { id: 'shipped_simple', countries: ['SA', 'Others'] },
    ],
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
    next: [
      { id: 'shipped_arrived_destination', countries: ['AE', 'ZA'] },
      { id: 'shipped_simple', countries: ['SA', 'Others'] },
    ],
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
  // Outbound country fork — SA/Others collapse the four shipping sub-statuses
  // into one "Shipped" step (no detailed tracking; banner copy collapses in
  // lib/statuses.js). AE/ZA walk the granular chain. Reached from both the
  // declined and kept cancellation branches. country_split.md §6.
  {
    id: 'shipped_simple',
    label: 'Shipped',
    trigger: 'system',
    event: 'shipment.shipped',
    next: ['delivered'],
    apply: (o) => ({
      ...o,
      statusId: 'shipped',
      subStatusId: null,
      courier: 'DHL Express',
      trackingNumber: '25193399',
      trackingUrl: 'https://www.dhl.com/track',
      timeline: { ...o.timeline, shipped: '23 May · 11:02 AM' },
    }),
  },
  // ----- Revibe-initiated cancellation (Revibe cancels, customer never asked) -
  // Three terminal nodes, one per reason, reachable from BOTH `placed`
  // (created stage) and `qc_started` (quality_check stage). The dev panel
  // surfaces them through a grouped "Cancelled by Revibe" picker (keyed on the
  // `revibe` field) rather than as plain Next buttons.
  //
  // They are deliberately stage-agnostic: `apply` never touches `statusId` or
  // `timeline`, so the order keeps whatever stage its predecessor set (created
  // from `placed`, quality_check from `qc_started`). This lets a single node
  // per reason serve both entry points — no per-stage duplication.
  //
  // Terminal + always `refunded`: a Revibe cancellation is a full, instant,
  // no-fee refund (the 5% processing fee is customer-initiated only — see
  // cancellations.md §7.5), so there's no requested→pending journey and no
  // keep-my-order reversal. Routes straight to RevibeCancellationCard in Past
  // orders via App.jsx's `cancellationInitiator === 'revibe'` branch.
  {
    id: 'revibe_cancel_unavailable',
    label: 'Cancelled by Revibe — item unavailable',
    trigger: 'system',
    event: 'order.cancellation.revibe_initiated',
    revibe: { reason: 'item_unavailable', label: 'Item not available' },
    next: [],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      cancellationInitiator: 'revibe',
      cancellationReason: 'item_unavailable',
      cancellationStatusId: 'refunded',
      cancellationRef: 'RVB-J0urN1',
      reBuyOffer: { amount: 50, code: 'COMEBACK50', expiresAt: '30 Jun 2026' },
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refunded: '21 May · 2:40 PM',
      },
      refund: {
        subtotal: 1029,
        amount: 1029,
        destination: { kind: 'card', label: 'Visa', last4: '4242' },
        breakdown: [
          { label: 'iPhone 13', amount: 939 },
          { label: 'Revibe Care', amount: 90 },
        ],
      },
    }),
  },
  {
    id: 'revibe_cancel_price',
    label: 'Cancelled by Revibe — wrong pricing',
    trigger: 'system',
    event: 'order.cancellation.revibe_initiated',
    revibe: { reason: 'price_error', label: 'Wrong pricing' },
    next: [],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      cancellationInitiator: 'revibe',
      cancellationReason: 'price_error',
      cancellationStatusId: 'refunded',
      cancellationRef: 'RVB-J0urN2',
      reBuyOffer: { amount: 50, code: 'COMEBACK50', expiresAt: '30 Jun 2026' },
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refunded: '21 May · 2:40 PM',
      },
      // Wallet refund variant — surfaces the brand→accent gradient chip.
      refund: {
        subtotal: 1029,
        amount: 1029,
        destination: { kind: 'wallet', label: 'Revibe Wallet' },
        breakdown: [
          { label: 'iPhone 13', amount: 939 },
          { label: 'Revibe Care', amount: 90 },
        ],
        fundsAvailable: 'Available now in your wallet',
      },
    }),
  },
  {
    id: 'revibe_cancel_address',
    label: 'Cancelled by Revibe — undeliverable address',
    trigger: 'system',
    event: 'order.cancellation.revibe_initiated',
    revibe: { reason: 'undeliverable_address', label: 'Undeliverable address' },
    next: [],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      cancellationInitiator: 'revibe',
      cancellationReason: 'undeliverable_address',
      cancellationStatusId: 'refunded',
      cancellationRef: 'RVB-J0urN3',
      reBuyOffer: { amount: 50, code: 'COMEBACK50', expiresAt: '30 Jun 2026' },
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refunded: '21 May · 2:40 PM',
      },
      refund: {
        subtotal: 1029,
        amount: 1029,
        destination: { kind: 'card', label: 'Visa', last4: '4242' },
        breakdown: [
          { label: 'iPhone 13', amount: 939 },
          { label: 'Revibe Care', amount: 90 },
        ],
      },
    }),
  },
]
