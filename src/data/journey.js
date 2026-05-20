// Journey mode — opt-in demo where a single order replays through one
// lifecycle, advanced step-by-step via the JourneyDevPanel. Each node's
// `apply(order)` returns the order's full shape *at that node* (merging onto
// the previous state), so the App can replay from each journey's
// `initialOrder` to any visited node without keeping intermediate copies.
//
// `trigger` / `event` are documentation fields: they're surfaced by the dev
// panel and exported into docs/output/journey_backend_spec.md so the
// prototype doubles as a backend-event spec for production engineering.
//
// Branching: a node may declare `next: [...nodeIds]`. When set, those are
// the legal forward transitions from that node. When omitted, the default
// is "next node in the array order" — keeps linear journeys terse. Terminal
// nodes must explicitly set `next: []` if they aren't last in the array.
//
// Order routing in App.jsx is data-driven — moving statusId / subStatusId /
// state / cancellation* / claim through these nodes is enough to walk the
// order through InProgressCard → OrderCard → PastOrderCard etc. with no
// journey-specific branches in the rendering tree.

export const INITIAL_ORDER = {
  id: 'JOURNEY-001',
  phone: '+971 50 559 5034',
  email: 'andrea@revibe.me',
  address: 'Ontario Tower, Office 103, Business Bay Dubai',
  placedAt: '19/05/2026 10:30 AM',
  placedAtFull: '19 May 2026 · 10:30 AM',
  estimatedDelivery: 'May 25',
  estimatedDeliveryLong: 'Monday, 25 May',
  shipDeadline: 'May 22',
  shipDeadlineFull: 'Friday, 22 May',
  quantity: 1,
  unitPrice: 939,
  subtotal: 939,
  warranty: 90,
  total: 1029,
  currency: 'AED',
  statusId: 'created',
  state: 'open',
  courier: null,
  trackingNumber: null,
  trackingUrl: null,
  customerName: 'Andrea Grossi',
  paymentMethod: { type: 'card', brand: 'Visa', last4: '4242' },
  deviceOs: 'ios',
  timeline: {
    created: '19 May · 10:30 AM',
  },
  product: {
    name: 'iPhone 13',
    variant: 'Midnight · 128 GB · Good',
    image: '/iphone-midnight.png',
  },
}

// ----- Happy-path journey -----------------------------------------------
// Default journey: order placed → QC → shipped (4 sub-statuses) → delivered.
// No branches, no cancellation, no claim.
const HAPPY_PATH_NODES = [
  {
    id: 'placed',
    label: 'Order placed',
    trigger: 'customer',
    event: 'order.created',
    apply: (o) => o,
  },
  {
    id: 'qc_started',
    label: 'Quality check started',
    trigger: 'system',
    event: 'order.quality_check.started',
    apply: (o) => ({
      ...o,
      statusId: 'quality_check',
      timeline: { ...o.timeline, quality_check: '21 May · 9:18 AM' },
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

// ----- Cancellation-at-QC journey ---------------------------------------
// Customer cancels while the device is at quality_check. Two forks:
//   1. Refund method picked at request time (wallet vs original payment).
//      Branched here because each path produces a different `refund` shape
//      (wallet has no fee; card carries the 5% processing fee + ETA gap).
//   2. Ops review at supplier-confirm time (accepted vs declined). Both
//      method branches converge on the same `cancellation_declined` node —
//      decline outcome is identical regardless of refund method (no refund
//      is ever issued).
//
// Accepted branches terminate at the `refunded_*` node (order drops to
// Past orders). Declined branch continues through the standard shipping
// chain so the `Cancel rejected` chip surfaces in HistoryThread on
// OrderCard / PastOrderCard — demonstrating that the historical event
// survives across card transitions.
const CANCEL_AT_QC_NODES = [
  {
    id: 'placed',
    label: 'Order placed',
    trigger: 'customer',
    event: 'order.created',
    apply: (o) => o,
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
    next: ['cancellation_accepted_wallet', 'cancellation_declined'],
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
    next: ['cancellation_accepted_card', 'cancellation_declined'],
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

// ----- Change-of-mind claim journey -------------------------------------
// Order lifecycle through delivery, then customer raises a change-of-mind
// claim and rides the refund pipeline. Two forks:
//   1. Refund method picked in the ClaimFlow (wallet vs original card) —
//      branches at submission because each method produces a different
//      `expectedRefund` shape (wallet 100%, card −10% restocking fee per
//      src/lib/returns.js → refundBreakdown).
//   2. Courier pickup outcome (succeeded vs failed). Failed branch sets
//      `claim.pickupFailure` so the order routes to PickupFailedCard, then
//      `claim_pickup_rescheduled` clears the failure and re-merges into the
//      happy chain at `claim_picked_up`.
//
// Both refund-method branches converge on the same `claim_picked_up` and
// terminate together at `claim_refund_credited`. Card-vs-wallet processing
// delay is elided — the journey models wallet-style instant settle for both
// branches (the cancel_at_qc journey is the canonical example of a
// timestamp-divergent refund path).
const CLAIM_COM_NODES = [
  {
    id: 'placed',
    label: 'Order placed',
    trigger: 'customer',
    event: 'order.created',
    apply: (o) => o,
  },
  {
    id: 'qc_started',
    label: 'Quality check started',
    trigger: 'system',
    event: 'order.quality_check.started',
    apply: (o) => ({
      ...o,
      statusId: 'quality_check',
      timeline: { ...o.timeline, quality_check: '21 May · 9:18 AM' },
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
    next: ['claim_submitted_wallet', 'claim_submitted_card'],
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
  // ----- Claim submission forks (driven by ClaimFlow's refundMethod) ----
  {
    id: 'claim_submitted_wallet',
    label: 'Claim submitted — wallet refund',
    trigger: 'customer',
    event: 'claim.created',
    next: ['claim_picked_up', 'claim_pickup_failed'],
    apply: (o) => ({
      ...o,
      claim: {
        claimRef: 'CMJrn1',
        claimStatusId: 'initiated',
        type: 'change_of_mind',
        submittedAt: '25 May 2026 · 4:02 PM',
        units: 1,
        reason: { value: 'changed_mind', otherText: '' },
        devicePrep: { option: 'reset', os: 'ios' },
        pickupDetails: {
          address: o.address,
          email: o.email,
          phone: o.phone,
        },
        scheduledPickup: {
          courier: 'DHL Express',
          date: 'Wednesday, 27 May',
          slot: '10 AM – 12 PM',
        },
        refundMethod: 'wallet',
        expectedRefund: {
          itemTotal: 939,
          warranty: 90,
          gross: 1029,
          fee: 0,
          net: 1029,
          rate: 0,
        },
        timeline: { initiated: '25 May · 4:02 PM' },
      },
    }),
  },
  {
    id: 'claim_submitted_card',
    label: 'Claim submitted — card refund',
    trigger: 'customer',
    event: 'claim.created',
    next: ['claim_picked_up', 'claim_pickup_failed'],
    apply: (o) => ({
      ...o,
      claim: {
        claimRef: 'CMJrn1',
        claimStatusId: 'initiated',
        type: 'change_of_mind',
        submittedAt: '25 May 2026 · 4:02 PM',
        units: 1,
        reason: { value: 'changed_mind', otherText: '' },
        devicePrep: { option: 'reset', os: 'ios' },
        pickupDetails: {
          address: o.address,
          email: o.email,
          phone: o.phone,
        },
        scheduledPickup: {
          courier: 'DHL Express',
          date: 'Wednesday, 27 May',
          slot: '10 AM – 12 PM',
        },
        refundMethod: 'original',
        expectedRefund: {
          itemTotal: 939,
          warranty: 90,
          gross: 1029,
          fee: 102.9,
          net: 926.1,
          rate: 0.10,
        },
        timeline: { initiated: '25 May · 4:02 PM' },
      },
    }),
  },
  // ----- Happy pickup → transit → QC → refund chain --------------------
  {
    id: 'claim_picked_up',
    label: 'Picked up by courier',
    trigger: 'system',
    event: 'claim.transit.picked_up',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'pickup',
        timeline: { ...o.claim.timeline, pickup: '28 May · 10:14 AM' },
        transitSubStatusId: 'picked_up',
        transitSubTimeline: {
          ...(o.claim.transitSubTimeline ?? {}),
          picked_up: '28 May · 10:14 AM',
        },
      },
    }),
  },
  {
    id: 'claim_transit_arrived_origin_hub',
    label: 'Arrived at origin hub',
    trigger: 'system',
    event: 'claim.transit.arrived_origin_hub',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        transitSubStatusId: 'arrived_origin_hub',
        transitSubTimeline: {
          ...o.claim.transitSubTimeline,
          arrived_origin_hub: '28 May · 1:22 PM',
        },
      },
    }),
  },
  {
    id: 'claim_transit_in_transit',
    label: 'In transit',
    trigger: 'system',
    event: 'claim.transit.in_transit',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        transitSubStatusId: 'in_transit',
        transitSubTimeline: {
          ...o.claim.transitSubTimeline,
          in_transit: '28 May · 5:42 PM',
        },
      },
    }),
  },
  {
    id: 'claim_transit_arrived_revibe_hub',
    label: 'Arrived at Revibe hub',
    trigger: 'system',
    event: 'claim.transit.arrived_revibe_hub',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        transitSubStatusId: 'arrived_revibe_hub',
        transitSubTimeline: {
          ...o.claim.transitSubTimeline,
          arrived_revibe_hub: '29 May · 9:10 AM',
        },
      },
    }),
  },
  {
    id: 'claim_qc_started',
    label: 'Claim quality check started',
    trigger: 'system',
    event: 'claim.qc.started',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'qc',
        timeline: { ...o.claim.timeline, qc: '29 May · 11:00 AM' },
      },
    }),
  },
  {
    id: 'claim_refund_issued',
    label: 'Refund issued',
    trigger: 'system',
    event: 'claim.refund.issued',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'refund_issued',
        timeline: { ...o.claim.timeline, refund_issued: '30 May · 2:18 PM' },
      },
    }),
  },
  {
    id: 'claim_refund_credited',
    label: 'Refund credited',
    trigger: 'system',
    event: 'claim.refund.completed',
    next: [],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'refund_credited',
        timeline: { ...o.claim.timeline, refund_credited: '30 May · 2:19 PM' },
      },
    }),
  },
  // ----- Pickup-failed sub-branch (at the end so default-next routing
  //       in the happy chain isn't disturbed) --------------------------
  {
    id: 'claim_pickup_failed',
    label: 'Pickup failed',
    trigger: 'system',
    event: 'claim.pickup.failed',
    next: ['claim_pickup_rescheduled'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: 'collection_failed',
        pickupFailure: {
          failedAt: '27 May · 8:20 AM',
          autoCancelAt: '31 May · 8:20 AM',
          timeLeftLabel: '3 days, 18 hours left',
          opsName: 'Rashid',
          opsRole: 'DHL Express',
          opsMessage:
            "Hi Andrea — our driver was at your building at 8:20 AM but couldn't reach you on the listed number and there was no answer at the office. Please confirm the address (or add a note for the driver) and we'll dispatch again on the next available slot.",
          nextPickup: {
            awb: '25193520',
            slot: 'Thursday, 28 May · 10 AM – 12 PM',
            courier: 'DHL Express',
          },
        },
        actionRequired: {
          kind: 'collection_failed',
          failedAt: '27 May · 8:20 AM',
        },
      },
    }),
  },
  {
    id: 'claim_pickup_rescheduled',
    label: 'Pickup rescheduled',
    trigger: 'customer',
    event: 'claim.pickup.rescheduled',
    // Re-merges into the transit chain past the (now-redundant)
    // claim_picked_up node — reschedule itself advances claimStatusId to
    // 'pickup' and seeds the picked_up scan so the detailed-tracking
    // dropdown is visible immediately after the customer confirms.
    next: ['claim_transit_arrived_origin_hub'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'pickup',
        subStatusId: undefined,
        pickupFailure: undefined,
        actionRequired: undefined,
        scheduledPickup: {
          courier: 'DHL Express',
          date: 'Thursday, 28 May',
          slot: '10 AM – 12 PM',
        },
        timeline: { ...o.claim.timeline, pickup: '28 May · 10:14 AM' },
        transitSubStatusId: 'picked_up',
        transitSubTimeline: {
          ...(o.claim.transitSubTimeline ?? {}),
          picked_up: '28 May · 10:14 AM',
        },
      },
    }),
  },
]

export const JOURNEYS = [
  {
    id: 'happy_path',
    label: 'Happy path',
    initialOrder: INITIAL_ORDER,
    nodes: HAPPY_PATH_NODES,
  },
  {
    id: 'cancel_at_qc',
    label: 'Cancellation at QC',
    initialOrder: INITIAL_ORDER,
    nodes: CANCEL_AT_QC_NODES,
  },
  {
    id: 'claim_change_of_mind',
    label: 'Change-of-mind claim',
    initialOrder: INITIAL_ORDER,
    nodes: CLAIM_COM_NODES,
  },
]
