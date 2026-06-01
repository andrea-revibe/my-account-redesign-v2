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
    label: 'Claim submitted — original payment method refund',
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
    next: ['claim_refund_issued', 'claim_invalid_confirmed', 'claim_reset_failed'],
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
  // ----- Invalid-claim sub-branch (change-of-mind flavoured ops message —
  //       damage-on-arrival / condition mismatch, since CoM has no
  //       claimed issue to disprove). Setting `claim.invalidClaim`
  //       routes to InvalidClaimCard which manages its own internal
  //       action_needed → paid / declined state. The journey advances
  //       through the same outcomes via customer-triggered nodes the
  //       dev panel surfaces with the `via UI` chip. Structurally
  //       identical to the issue/warranty invalid sub-branches. --------
  {
    id: 'claim_invalid_confirmed',
    label: 'Inspection — invalid claim confirmed',
    trigger: 'system',
    event: 'claim.inspection.invalid_confirmed',
    next: ['claim_return_shipping_paid', 'claim_invalid_declined'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: 'invalid_confirmed',
        actionRequired: {
          kind: 'awaiting_payment',
          deadline: '6 Jun · 4:18 PM',
          deadlineLabel: '7 days left',
        },
        invalidClaim: {
          determinedAt: '30 May · 4:18 PM',
          autoCancelAt: '6 Jun · 4:18 PM',
          timeLeftLabel: '7 days left',
          opsName: 'Marwa',
          opsRole: 'Revibe Quality',
          opsMessage:
            "Hi Andrea — when the device arrived for inspection we found visible damage that wasn't disclosed at submission (a hairline screen crack and a small dent near the camera bump). Under our change-of-mind policy we can only refund devices returned in the condition they were sold in, so we can't approve this claim. To get the device back we'll need you to cover return shipping — otherwise it returns to circulation.",
          returnShipping: {
            amount: 35,
            currency: 'AED',
          },
          returnShipment: {
            courier: 'DHL Express',
            estimatedDelivery: 'Jun 8',
            estimatedDeliveryLong: 'Monday, 8 June',
            currentStatusId: 'created',
            timeline: {
              created: '31 May · 11:00 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_return_shipping_paid',
    label: 'Customer paid return shipping',
    trigger: 'customer',
    event: 'claim.return_shipping.paid',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        actionRequired: undefined,
        invalidClaim: {
          ...o.claim.invalidClaim,
          paidAt: '31 May · 9:45 AM',
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            currentStatusId: 'shipped',
            subStatusId: null,
            subTimeline: {},
            timeline: {
              ...o.claim.invalidClaim.returnShipment.timeline,
              quality_check: '31 May · 2:30 PM',
              shipped: '1 Jun · 9:15 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_arrived_destination',
    label: 'Return — arrived in destination country',
    trigger: 'system',
    event: 'claim.return_shipment.arrived_destination',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            subStatusId: 'arrived_destination',
            subTimeline: {
              ...(o.claim.invalidClaim.returnShipment.subTimeline ?? {}),
              arrived_destination: '3 Jun · 8:30 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_cleared_customs',
    label: 'Return — cleared customs',
    trigger: 'system',
    event: 'claim.return_shipment.cleared_customs',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            subStatusId: 'cleared_customs',
            subTimeline: {
              ...o.claim.invalidClaim.returnShipment.subTimeline,
              cleared_customs: '3 Jun · 11:15 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_forwarded_to_agent',
    label: 'Return — forwarded to third-party agent',
    trigger: 'system',
    event: 'claim.return_shipment.forwarded_to_agent',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            subStatusId: 'forwarded_to_agent',
            subTimeline: {
              ...o.claim.invalidClaim.returnShipment.subTimeline,
              forwarded_to_agent: '3 Jun · 4:45 PM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_out_for_delivery',
    label: 'Return — out for delivery',
    trigger: 'system',
    event: 'claim.return_shipment.out_for_delivery',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            subStatusId: 'out_for_delivery',
            subTimeline: {
              ...o.claim.invalidClaim.returnShipment.subTimeline,
              out_for_delivery: '8 Jun · 7:30 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_delivered',
    label: 'Unrepaired device delivered to customer',
    trigger: 'system',
    event: 'claim.return_shipment.delivered',
    next: [],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            currentStatusId: 'delivered',
            subStatusId: null,
            timeline: {
              ...o.claim.invalidClaim.returnShipment.timeline,
              delivered: '8 Jun · 11:42 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_declined',
    label: 'Customer declined — claim closed',
    trigger: 'customer',
    event: 'claim.declined',
    next: [],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        actionRequired: undefined,
        invalidClaim: {
          ...o.claim.invalidClaim,
          declinedAt: '31 May · 9:45 AM',
        },
      },
    }),
  },
  // ----- Reset-failed sub-branch. Triggered at QC when the technician
  //       tries to wipe the device and Activation Lock is still on.
  //       Setting `claim.resetFailed` routes the order to ResetFailedCard.
  //       The customer submits unlink confirmation + passcode; on first
  //       attempt the journey can either continue (success) or loop once
  //       through `claim_reset_retry_failed` (wrong info). After the
  //       second submission the journey re-merges into the QC outcome
  //       fork (refund_issued or invalid_confirmed). ----------------------
  {
    id: 'claim_reset_failed',
    label: 'Reset failed — device still locked',
    trigger: 'system',
    event: 'claim.reset.failed',
    next: ['claim_reset_details_received'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: 'reset_failed',
        actionRequired: {
          kind: 'reset_failed',
          deadline: '1 Jun · 11:32 AM',
          deadlineLabel: '2 days, 22 hours left',
        },
        resetFailed: {
          failedAt: '29 May · 11:32 AM',
          autoCancelAt: '1 Jun · 11:32 AM',
          timeLeftLabel: '2 days, 22 hours left',
          opsName: 'Marwa',
          opsRole: 'Revibe Quality',
          opsMessage:
            "Hi Andrea — when we tried to wipe the device, Activation Lock was still on so we couldn't go further. Please remove it from your iCloud account at iCloud.com (Find My → All Devices → Erase, then Remove from Account) and send us the device passcode so we can complete the reset and resume the quality check.",
        },
      },
    }),
  },
  {
    id: 'claim_reset_details_received',
    label: 'Unlock details received',
    trigger: 'customer',
    event: 'claim.reset.details_received',
    // Forks: success path re-merges into the QC outcome (refund_issued or
    // invalid_confirmed), failure path loops once through
    // claim_reset_retry_failed.
    next: ['claim_refund_issued', 'claim_invalid_confirmed', 'claim_reset_retry_failed'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: undefined,
        actionRequired: undefined,
        resetFailed: undefined,
        resetUnlock: {
          at: '29 May · 12:48 PM',
          attempt: 1,
        },
      },
    }),
  },
  {
    id: 'claim_reset_retry_failed',
    label: 'Reset retry failed — still locked',
    trigger: 'system',
    event: 'claim.reset.retry_failed',
    next: ['claim_reset_retry_resubmitted'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: 'reset_failed',
        actionRequired: {
          kind: 'reset_failed',
          deadline: '2 Jun · 9:14 AM',
          deadlineLabel: '2 days, 20 hours left',
        },
        resetFailed: {
          failedAt: '30 May · 9:14 AM',
          autoCancelAt: '2 Jun · 9:14 AM',
          timeLeftLabel: '2 days, 20 hours left',
          opsName: 'Marwa',
          opsRole: 'Revibe Quality',
          opsMessage:
            "Hi Andrea — thanks for the details, but the device is still showing Activation Lock when we try the wipe. Could you double-check that you signed in to iCloud.com with the same Apple ID that's on this device, and that you tapped Remove from Account at the end of the Erase flow? If your passcode might have a typo, please re-enter it.",
          attempt: 2,
        },
        resetUnlock: undefined,
      },
    }),
  },
  {
    id: 'claim_reset_retry_resubmitted',
    label: 'Updated unlock details received',
    trigger: 'customer',
    event: 'claim.reset.retry_resubmitted',
    next: ['claim_refund_issued', 'claim_invalid_confirmed'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: undefined,
        actionRequired: undefined,
        resetFailed: undefined,
        resetUnlock: {
          at: '30 May · 10:22 AM',
          attempt: 2,
        },
      },
    }),
  },
]

// ----- Warranty claim journey -------------------------------------------
// Order lifecycle through delivery, then customer raises a warranty claim
// (battery / not_working scope) and rides the warranty pipeline. Three
// forks:
//   1. Courier pickup outcome (succeeded vs failed). Failed branch sets
//      `claim.pickupFailure` so the order routes to PickupFailedCard, then
//      `claim_pickup_rescheduled` clears the failure and re-merges into the
//      transit chain at `claim_transit_arrived_origin_hub`. Same shape as
//      the CoM journey's pickup-failed branch.
//   2. QC outcome (valid vs invalid). Valid → seller repair → ship-back →
//      device_returned (warranty terminal). Invalid → `claim.invalidClaim`
//      routes to InvalidClaimCard, then customer pays for return shipping
//      or declines.
//   3. Invalid-confirmed outcome (paid vs declined). Paid → return-shipment
//      delivered (no refund, unrepaired unit ships back to the customer).
//      Declined → terminal "Claim closed, no refund."
//
// No refund-method fork: warranty intake skips Step 5, so the claim has no
// `refundMethod` / `expectedRefund` fields. Cf. `CLAIM_COM_NODES` which
// branches on refund method at submit.
const CLAIM_WARRANTY_NODES = [
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
    next: ['claim_submitted_warranty'],
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
  // ----- Warranty claim submitted (customer-triggered via ClaimFlow) ----
  {
    id: 'claim_submitted_warranty',
    label: 'Warranty claim submitted',
    trigger: 'customer',
    event: 'claim.created',
    next: ['claim_picked_up', 'claim_pickup_failed'],
    apply: (o) => ({
      ...o,
      claim: {
        claimRef: 'WrJrn1',
        claimStatusId: 'initiated',
        type: 'warranty',
        submittedAt: '25 May 2026 · 4:02 PM',
        units: 1,
        issueScope: 'not_working',
        issueSubtypeId: 'battery',
        issueDetails: {
          description:
            'Battery drains in under 4 hours of light use, even after a factory reset.',
          attachmentName: 'IMG_0710.jpg',
        },
        // Shape parity with the refund-flow mocks — warranty intake
        // doesn't collect a reason field, but ClaimDetailsSheet reads
        // it defensively in shared rows.
        reason: { value: 'other', otherText: '' },
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
        timeline: { initiated: '25 May · 4:02 PM' },
        // Placeholder repair window — refined once QC completes and the
        // claim advances to `under_repair`. Matches `buildClaim`'s
        // initial-submit shape (expectedCompletionFor('warranty')).
        repairWindow: {
          expectedComplete: 'Mon, 8 Jun',
          expectedCompleteLong: 'Monday, 8 June',
          note: "We'll confirm the exact repair window after inspection.",
        },
      },
    }),
  },
  // ----- Happy pickup → transit → QC → repair → ship-back → returned ---
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
    next: ['claim_under_repair', 'claim_invalid_confirmed', 'claim_reset_failed'],
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
    id: 'claim_under_repair',
    label: 'Under repair',
    trigger: 'system',
    event: 'claim.repair.started',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'under_repair',
        timeline: { ...o.claim.timeline, under_repair: '30 May · 2:12 PM' },
        // Sharpen the placeholder repair window now that QC has cleared
        // and the seller has committed to a fix. Mirrors mock 89610.
        repairWindow: {
          expectedComplete: 'Mon, 8 Jun',
          expectedCompleteLong: 'Monday, 8 June',
          note: 'Battery replacement — typically wraps up within 7–10 days.',
        },
      },
    }),
  },
  {
    id: 'claim_ship_back_created',
    label: 'Ship-back AWB created',
    trigger: 'system',
    event: 'claim.ship_back.created',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'ship_back',
        timeline: { ...o.claim.timeline, ship_back: '8 Jun · 11:05 AM' },
        shipBack: {
          courier: 'DHL Express',
          awb: '25193620',
          estimatedDelivery: 'Jun 12',
          estimatedDeliveryLong: 'Friday, 12 June',
          subStatusId: null,
          subTimeline: {},
        },
      },
    }),
  },
  {
    id: 'claim_ship_back_arrived_destination',
    label: 'Ship-back arrived in destination country',
    trigger: 'system',
    event: 'claim.ship_back.arrived_destination',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        shipBack: {
          ...o.claim.shipBack,
          subStatusId: 'arrived_destination',
          subTimeline: {
            ...o.claim.shipBack.subTimeline,
            arrived_destination: '10 Jun · 8:30 AM',
          },
        },
      },
    }),
  },
  {
    id: 'claim_ship_back_cleared_customs',
    label: 'Ship-back cleared customs',
    trigger: 'system',
    event: 'claim.ship_back.cleared_customs',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        shipBack: {
          ...o.claim.shipBack,
          subStatusId: 'cleared_customs',
          subTimeline: {
            ...o.claim.shipBack.subTimeline,
            cleared_customs: '10 Jun · 11:15 AM',
          },
        },
      },
    }),
  },
  {
    id: 'claim_ship_back_forwarded_to_agent',
    label: 'Ship-back forwarded to third-party agent',
    trigger: 'system',
    event: 'claim.ship_back.forwarded_to_agent',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        shipBack: {
          ...o.claim.shipBack,
          subStatusId: 'forwarded_to_agent',
          subTimeline: {
            ...o.claim.shipBack.subTimeline,
            forwarded_to_agent: '11 Jun · 4:45 PM',
          },
        },
      },
    }),
  },
  {
    id: 'claim_ship_back_out_for_delivery',
    label: 'Ship-back out for delivery',
    trigger: 'system',
    event: 'claim.ship_back.out_for_delivery',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        shipBack: {
          ...o.claim.shipBack,
          subStatusId: 'out_for_delivery',
          subTimeline: {
            ...o.claim.shipBack.subTimeline,
            out_for_delivery: '12 Jun · 7:30 AM',
          },
        },
      },
    }),
  },
  {
    id: 'claim_device_returned',
    label: 'Device returned',
    trigger: 'system',
    event: 'claim.device.returned',
    next: [],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'device_returned',
        timeline: { ...o.claim.timeline, device_returned: '12 Jun · 3:14 PM' },
        shipBack: {
          ...o.claim.shipBack,
          deliveredOn: '2026-06-12',
          deliveredOnLong: 'Friday, 12 June',
        },
      },
    }),
  },
  // ----- Pickup-failed sub-branch (placed at the end so default-next
  //       routing in the happy chain isn't disturbed) ------------------
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
  // ----- Invalid-claim sub-branch (LAB Inspector decision = Invalid in
  //       the operational diagram). Setting `claim.invalidClaim` routes
  //       the order to InvalidClaimCard which manages its own internal
  //       action_needed → paid / declined state. The journey advances
  //       through the same outcomes via customer-triggered nodes that
  //       the dev panel surfaces with the `via UI` chip. ---------------
  {
    id: 'claim_invalid_confirmed',
    label: 'Inspection — invalid claim confirmed',
    trigger: 'system',
    event: 'claim.inspection.invalid_confirmed',
    next: ['claim_return_shipping_paid', 'claim_invalid_declined'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        // Pre-takeover sub-status for ops surfaces; the card itself reads
        // from claim.invalidClaim.
        subStatusId: 'invalid_confirmed',
        actionRequired: {
          kind: 'awaiting_payment',
          deadline: '6 Jun · 4:18 PM',
          deadlineLabel: '7 days left',
        },
        invalidClaim: {
          determinedAt: '30 May · 4:18 PM',
          autoCancelAt: '6 Jun · 4:18 PM',
          timeLeftLabel: '7 days left',
          opsName: 'Marwa',
          opsRole: 'Revibe Quality',
          opsMessage:
            "Hi Andrea — our technicians ran a full battery diagnostic and the cell health came back at 92%, within the spec we ship at. Standby drain and load tests were also within range. We weren't able to reproduce the issue you described, so we can't approve the warranty claim. To get the device back we'll need you to cover return shipping — otherwise the unit returns to circulation.",
          returnShipping: {
            amount: 35,
            currency: 'AED',
          },
          // Pre-seeded shipment shape so the card has something to render
          // when its internal demo state flips to `paid`. Mirrors the
          // 12345 mock in src/data/orders.js.
          returnShipment: {
            courier: 'DHL Express',
            estimatedDelivery: 'Jun 8',
            estimatedDeliveryLong: 'Monday, 8 June',
            currentStatusId: 'created',
            timeline: {
              created: '31 May · 11:00 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_return_shipping_paid',
    label: 'Customer paid return shipping',
    trigger: 'customer',
    event: 'claim.return_shipping.paid',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        actionRequired: undefined,
        invalidClaim: {
          ...o.claim.invalidClaim,
          paidAt: '31 May · 9:45 AM',
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            currentStatusId: 'shipped',
            // No sub-status yet — the courier hasn't scanned anything past
            // dispatch. Subsequent nodes set subStatusId + subTimeline so
            // the PaidShipBackCard's detailed-tracking dropdown can drill
            // through the outbound sub-statuses just like a normal order.
            subStatusId: null,
            subTimeline: {},
            timeline: {
              ...o.claim.invalidClaim.returnShipment.timeline,
              quality_check: '31 May · 2:30 PM',
              shipped: '1 Jun · 9:15 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_arrived_destination',
    label: 'Return — arrived in destination country',
    trigger: 'system',
    event: 'claim.return_shipment.arrived_destination',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            subStatusId: 'arrived_destination',
            subTimeline: {
              ...(o.claim.invalidClaim.returnShipment.subTimeline ?? {}),
              arrived_destination: '3 Jun · 8:30 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_cleared_customs',
    label: 'Return — cleared customs',
    trigger: 'system',
    event: 'claim.return_shipment.cleared_customs',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            subStatusId: 'cleared_customs',
            subTimeline: {
              ...o.claim.invalidClaim.returnShipment.subTimeline,
              cleared_customs: '3 Jun · 11:15 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_forwarded_to_agent',
    label: 'Return — forwarded to third-party agent',
    trigger: 'system',
    event: 'claim.return_shipment.forwarded_to_agent',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            subStatusId: 'forwarded_to_agent',
            subTimeline: {
              ...o.claim.invalidClaim.returnShipment.subTimeline,
              forwarded_to_agent: '3 Jun · 4:45 PM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_out_for_delivery',
    label: 'Return — out for delivery',
    trigger: 'system',
    event: 'claim.return_shipment.out_for_delivery',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            subStatusId: 'out_for_delivery',
            subTimeline: {
              ...o.claim.invalidClaim.returnShipment.subTimeline,
              out_for_delivery: '8 Jun · 7:30 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_delivered',
    label: 'Unrepaired device delivered to customer',
    trigger: 'system',
    event: 'claim.return_shipment.delivered',
    next: [],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            currentStatusId: 'delivered',
            subStatusId: null,
            timeline: {
              ...o.claim.invalidClaim.returnShipment.timeline,
              delivered: '8 Jun · 11:42 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_declined',
    label: 'Customer declined — claim closed',
    trigger: 'customer',
    event: 'claim.declined',
    next: [],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        actionRequired: undefined,
        invalidClaim: {
          ...o.claim.invalidClaim,
          declinedAt: '31 May · 9:45 AM',
        },
      },
    }),
  },
  // ----- Reset-failed sub-branch. Same shape as the change-of-mind /
  //       issue journeys but re-merges into the warranty QC outcome
  //       (under_repair + invalid_confirmed). Setting `claim.resetFailed`
  //       routes the order to ResetFailedCard; one retry loop is allowed
  //       before the second submission re-enters the QC fork. ---------
  {
    id: 'claim_reset_failed',
    label: 'Reset failed — device still locked',
    trigger: 'system',
    event: 'claim.reset.failed',
    next: ['claim_reset_details_received'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: 'reset_failed',
        actionRequired: {
          kind: 'reset_failed',
          deadline: '1 Jun · 11:32 AM',
          deadlineLabel: '2 days, 22 hours left',
        },
        resetFailed: {
          failedAt: '29 May · 11:32 AM',
          autoCancelAt: '1 Jun · 11:32 AM',
          timeLeftLabel: '2 days, 22 hours left',
          opsName: 'Marwa',
          opsRole: 'Revibe Quality',
          opsMessage:
            "Hi Andrea — when we tried to wipe the device, Activation Lock was still on so we couldn't go further. Please remove it from your iCloud account at iCloud.com (Find My → All Devices → Erase, then Remove from Account) and send us the device passcode so we can complete the reset and resume the quality check.",
        },
      },
    }),
  },
  {
    id: 'claim_reset_details_received',
    label: 'Unlock details received',
    trigger: 'customer',
    event: 'claim.reset.details_received',
    next: ['claim_under_repair', 'claim_invalid_confirmed', 'claim_reset_retry_failed'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: undefined,
        actionRequired: undefined,
        resetFailed: undefined,
        resetUnlock: {
          at: '29 May · 12:48 PM',
          attempt: 1,
        },
      },
    }),
  },
  {
    id: 'claim_reset_retry_failed',
    label: 'Reset retry failed — still locked',
    trigger: 'system',
    event: 'claim.reset.retry_failed',
    next: ['claim_reset_retry_resubmitted'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: 'reset_failed',
        actionRequired: {
          kind: 'reset_failed',
          deadline: '2 Jun · 9:14 AM',
          deadlineLabel: '2 days, 20 hours left',
        },
        resetFailed: {
          failedAt: '30 May · 9:14 AM',
          autoCancelAt: '2 Jun · 9:14 AM',
          timeLeftLabel: '2 days, 20 hours left',
          opsName: 'Marwa',
          opsRole: 'Revibe Quality',
          opsMessage:
            "Hi Andrea — thanks for the details, but the device is still showing Activation Lock when we try the wipe. Could you double-check that you signed in to iCloud.com with the same Apple ID that's on this device, and that you tapped Remove from Account at the end of the Erase flow? If your passcode might have a typo, please re-enter it.",
          attempt: 2,
        },
        resetUnlock: undefined,
      },
    }),
  },
  {
    id: 'claim_reset_retry_resubmitted',
    label: 'Updated unlock details received',
    trigger: 'customer',
    event: 'claim.reset.retry_resubmitted',
    next: ['claim_under_repair', 'claim_invalid_confirmed'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: undefined,
        actionRequired: undefined,
        resetFailed: undefined,
        resetUnlock: {
          at: '30 May · 10:22 AM',
          attempt: 2,
        },
      },
    }),
  },
]

// ----- Issue / wrong-device claim journey -------------------------------
// Order lifecycle through delivery, then customer raises an Issue claim
// (battery scope) and rides the refund pipeline. The distinguishing
// branches vs the change-of-mind journey are:
//   1. Refund-method fork at submit: wallet (+AED 100 bonus per
//      ISSUE_WALLET_BONUS) vs original-payment (no restocking fee on the
//      issue branch). Both branches converge on the same downstream nodes.
//   2. DocsRejected branch — issue-flow specific because Step 2 requires
//      an attachment. Setting `claim.docsRejection` (+ subStatusId +
//      actionRequired) routes the order to DocsRejectedCard. After the
//      customer resubmits, `claim.proofResubmission` is set so the
//      HistoryThread carries the "Evidence resubmitted" chip when the
//      claim later moves to pickup. Re-merges into the pickup-outcome
//      fork. Operational reference: issue n4 → n6 → n7 in
//      docs/input/return_flow_issue.md.
//   3. Courier pickup outcome (succeeded vs failed). Same shape as the
//      CoM and warranty journeys.
//   4. QC outcome (valid vs invalid). Valid → refund_issued →
//      refund_credited (terminal). Invalid → `claim.invalidClaim` routes
//      to InvalidClaimCard with the issue-flavoured ops message. The
//      paid / declined sub-branches mirror the warranty journey's
//      invalid-claim chain.
//
// Issue subtype seeded as `battery` (from issueSubtypes.NOT_WORKING_SUBTYPES)
// so the ops dialogue can quote a concrete diagnostic ("cell health 92%").
const CLAIM_ISSUE_NODES = [
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
  // ----- Issue claim submitted (customer-triggered via ClaimFlow). Forks
  //       on refund method: wallet carries the +AED 100 bonus chip,
  //       original payment carries no fee (issue branch). Both converge
  //       on the same downstream nodes via shared `next` targets. -------
  {
    id: 'claim_submitted_wallet',
    label: 'Issue claim submitted — wallet refund',
    trigger: 'customer',
    event: 'claim.created',
    next: ['claim_picked_up', 'claim_pickup_failed', 'claim_docs_rejected'],
    apply: (o) => ({
      ...o,
      claim: {
        claimRef: 'IsJrn1',
        claimStatusId: 'initiated',
        type: 'issue',
        submittedAt: '25 May 2026 · 4:02 PM',
        units: 1,
        issueScope: 'not_working',
        issueSubtypeId: 'battery',
        issueDetails: {
          category: 'battery',
          description:
            'Battery drops from 100% to under 30% in about four hours of light use, even after a factory reset. Battery Health shows the capacity.',
          attachmentName: 'IMG_0710.jpg',
        },
        // Shape parity with the refund-flow mocks — issue intake skips the
        // change-of-mind reason picker, but ClaimDetailsSheet reads it
        // defensively for shared rows.
        reason: { value: 'other', otherText: '' },
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
          bonus: 100,
          net: 1129,
          rate: 0,
        },
        timeline: { initiated: '25 May · 4:02 PM' },
      },
    }),
  },
  {
    id: 'claim_submitted_card',
    label: 'Issue claim submitted — card refund',
    trigger: 'customer',
    event: 'claim.created',
    next: ['claim_picked_up', 'claim_pickup_failed', 'claim_docs_rejected'],
    apply: (o) => ({
      ...o,
      claim: {
        claimRef: 'IsJrn1',
        claimStatusId: 'initiated',
        type: 'issue',
        submittedAt: '25 May 2026 · 4:02 PM',
        units: 1,
        issueScope: 'not_working',
        issueSubtypeId: 'battery',
        issueDetails: {
          category: 'battery',
          description:
            'Battery drops from 100% to under 30% in about four hours of light use, even after a factory reset. Battery Health shows the capacity.',
          attachmentName: 'IMG_0710.jpg',
        },
        reason: { value: 'other', otherText: '' },
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
          fee: 0,
          bonus: 0,
          net: 1029,
          rate: 0,
        },
        timeline: { initiated: '25 May · 4:02 PM' },
      },
    }),
  },
  // ----- Happy pickup → transit → QC chain (shared with the docs-resubmitted
  //       and pickup-rescheduled re-merge targets). ----------------------
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
    next: ['claim_refund_issued', 'claim_invalid_confirmed', 'claim_reset_failed'],
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
  // ----- Docs-rejected sub-branch (issue-specific). Setting
  //       `claim.docsRejection` routes the order to DocsRejectedCard.
  //       Resubmission clears the takeover, sets `proofResubmission`
  //       (surfaces the "Evidence resubmitted" chip in HistoryThread on
  //       the next ClaimCard view), and re-merges into the pickup
  //       outcome fork. -------------------------------------------------
  {
    id: 'claim_docs_rejected',
    label: 'Documents rejected by Quality',
    trigger: 'system',
    event: 'claim.documents.rejected',
    next: ['claim_docs_resubmitted'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: 'awaiting_documents',
        actionRequired: {
          kind: 'awaiting_documents',
          deadline: '29 May · 11:18 AM',
          deadlineLabel: '2 days, 14 hours left',
        },
        docsRejection: {
          rejectedAt: '26 May · 11:18 AM',
          autoCancelAt: '29 May · 11:18 AM',
          timeLeftLabel: '2 days, 14 hours left',
          opsName: 'Marwa',
          opsRole: 'Revibe Quality',
          opsMessage:
            "Hi Andrea — thanks for the report. The Battery Health screenshot you sent is cropped and the capacity percentage isn't visible. Could you reshoot the full Settings → Battery → Battery Health screen, including the percentage line near the top? A short clip showing the drain over a few minutes would help too.",
          previous: [
            { name: 'IMG_0710.jpg', size: '2.4 MB', kind: 'image', tag: 'Cropped' },
            { name: 'IMG_0711.jpg', size: '2.1 MB', kind: 'image', tag: 'Blurry' },
          ],
        },
      },
    }),
  },
  {
    id: 'claim_docs_resubmitted',
    label: 'Evidence resubmitted',
    trigger: 'customer',
    event: 'claim.documents.resubmitted',
    // Re-merges into the pickup outcome fork — customer can still hit a
    // failed-pickup downstream of a resubmitted-evidence chapter.
    next: ['claim_picked_up', 'claim_pickup_failed'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: undefined,
        actionRequired: undefined,
        docsRejection: undefined,
        proofResubmission: {
          at: '27 May · 10:42 AM',
          fileCount: 3,
        },
      },
    }),
  },
  // ----- Pickup-failed sub-branch (placed after the docs branch so the
  //       happy chain's default-next routing isn't disturbed). ----------
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
    // Re-merges into the transit chain past `claim_picked_up` — reschedule
    // itself advances claimStatusId to 'pickup' and seeds the picked_up
    // scan so the detailed-tracking dropdown is visible immediately.
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
  // ----- Invalid-claim sub-branch (issue-flavoured ops message; LAB /
  //       expert_revision sub-flow intentionally skipped per design
  //       choice — no inline surface today). Setting `claim.invalidClaim`
  //       routes to InvalidClaimCard which manages its own internal
  //       action_needed → paid / declined state. The journey advances
  //       through the same outcomes via customer-triggered nodes the
  //       dev panel surfaces with the `via UI` chip. -------------------
  {
    id: 'claim_invalid_confirmed',
    label: 'Inspection — invalid claim confirmed',
    trigger: 'system',
    event: 'claim.inspection.invalid_confirmed',
    next: ['claim_return_shipping_paid', 'claim_invalid_declined'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        // Pre-takeover sub-status for ops surfaces; the card itself reads
        // from claim.invalidClaim.
        subStatusId: 'invalid_confirmed',
        actionRequired: {
          kind: 'awaiting_payment',
          deadline: '6 Jun · 4:18 PM',
          deadlineLabel: '7 days left',
        },
        invalidClaim: {
          determinedAt: '30 May · 4:18 PM',
          autoCancelAt: '6 Jun · 4:18 PM',
          timeLeftLabel: '7 days left',
          opsName: 'Marwa',
          opsRole: 'Revibe Quality',
          opsMessage:
            "Hi Andrea — our technicians ran a full battery diagnostic and the cell health came back at 92%, within the spec we ship at. Standby drain and load tests were also within range. We weren't able to reproduce the issue you described, so we can't approve the claim. To get the device back we'll need you to cover return shipping — otherwise the unit returns to circulation.",
          returnShipping: {
            amount: 35,
            currency: 'AED',
          },
          // Pre-seeded shipment shape so the card has something to render
          // when its internal demo state flips to `paid`. Mirrors mock 89940.
          returnShipment: {
            courier: 'DHL Express',
            estimatedDelivery: 'Jun 8',
            estimatedDeliveryLong: 'Monday, 8 June',
            currentStatusId: 'created',
            timeline: {
              created: '31 May · 11:00 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_return_shipping_paid',
    label: 'Customer paid return shipping',
    trigger: 'customer',
    event: 'claim.return_shipping.paid',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        actionRequired: undefined,
        invalidClaim: {
          ...o.claim.invalidClaim,
          paidAt: '31 May · 9:45 AM',
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            currentStatusId: 'shipped',
            subStatusId: null,
            subTimeline: {},
            timeline: {
              ...o.claim.invalidClaim.returnShipment.timeline,
              quality_check: '31 May · 2:30 PM',
              shipped: '1 Jun · 9:15 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_arrived_destination',
    label: 'Return — arrived in destination country',
    trigger: 'system',
    event: 'claim.return_shipment.arrived_destination',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            subStatusId: 'arrived_destination',
            subTimeline: {
              ...(o.claim.invalidClaim.returnShipment.subTimeline ?? {}),
              arrived_destination: '3 Jun · 8:30 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_cleared_customs',
    label: 'Return — cleared customs',
    trigger: 'system',
    event: 'claim.return_shipment.cleared_customs',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            subStatusId: 'cleared_customs',
            subTimeline: {
              ...o.claim.invalidClaim.returnShipment.subTimeline,
              cleared_customs: '3 Jun · 11:15 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_forwarded_to_agent',
    label: 'Return — forwarded to third-party agent',
    trigger: 'system',
    event: 'claim.return_shipment.forwarded_to_agent',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            subStatusId: 'forwarded_to_agent',
            subTimeline: {
              ...o.claim.invalidClaim.returnShipment.subTimeline,
              forwarded_to_agent: '3 Jun · 4:45 PM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_out_for_delivery',
    label: 'Return — out for delivery',
    trigger: 'system',
    event: 'claim.return_shipment.out_for_delivery',
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            subStatusId: 'out_for_delivery',
            subTimeline: {
              ...o.claim.invalidClaim.returnShipment.subTimeline,
              out_for_delivery: '8 Jun · 7:30 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_return_delivered',
    label: 'Unrepaired device delivered to customer',
    trigger: 'system',
    event: 'claim.return_shipment.delivered',
    next: [],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          ...o.claim.invalidClaim,
          returnShipment: {
            ...o.claim.invalidClaim.returnShipment,
            currentStatusId: 'delivered',
            subStatusId: null,
            timeline: {
              ...o.claim.invalidClaim.returnShipment.timeline,
              delivered: '8 Jun · 11:42 AM',
            },
          },
        },
      },
    }),
  },
  {
    id: 'claim_invalid_declined',
    label: 'Customer declined — claim closed',
    trigger: 'customer',
    event: 'claim.declined',
    next: [],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        actionRequired: undefined,
        invalidClaim: {
          ...o.claim.invalidClaim,
          declinedAt: '31 May · 9:45 AM',
        },
      },
    }),
  },
  // ----- Reset-failed sub-branch. Same shape as the change-of-mind /
  //       warranty journeys but re-merges into the issue QC outcome
  //       (refund_issued + invalid_confirmed). Setting `claim.resetFailed`
  //       routes the order to ResetFailedCard; one retry loop is allowed
  //       before the second submission re-enters the QC fork. ---------
  {
    id: 'claim_reset_failed',
    label: 'Reset failed — device still locked',
    trigger: 'system',
    event: 'claim.reset.failed',
    next: ['claim_reset_details_received'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: 'reset_failed',
        actionRequired: {
          kind: 'reset_failed',
          deadline: '1 Jun · 11:32 AM',
          deadlineLabel: '2 days, 22 hours left',
        },
        resetFailed: {
          failedAt: '29 May · 11:32 AM',
          autoCancelAt: '1 Jun · 11:32 AM',
          timeLeftLabel: '2 days, 22 hours left',
          opsName: 'Marwa',
          opsRole: 'Revibe Quality',
          opsMessage:
            "Hi Andrea — when we tried to wipe the device, Activation Lock was still on so we couldn't go further. Please remove it from your iCloud account at iCloud.com (Find My → All Devices → Erase, then Remove from Account) and send us the device passcode so we can complete the reset and resume the quality check.",
        },
      },
    }),
  },
  {
    id: 'claim_reset_details_received',
    label: 'Unlock details received',
    trigger: 'customer',
    event: 'claim.reset.details_received',
    next: ['claim_refund_issued', 'claim_invalid_confirmed', 'claim_reset_retry_failed'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: undefined,
        actionRequired: undefined,
        resetFailed: undefined,
        resetUnlock: {
          at: '29 May · 12:48 PM',
          attempt: 1,
        },
      },
    }),
  },
  {
    id: 'claim_reset_retry_failed',
    label: 'Reset retry failed — still locked',
    trigger: 'system',
    event: 'claim.reset.retry_failed',
    next: ['claim_reset_retry_resubmitted'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: 'reset_failed',
        actionRequired: {
          kind: 'reset_failed',
          deadline: '2 Jun · 9:14 AM',
          deadlineLabel: '2 days, 20 hours left',
        },
        resetFailed: {
          failedAt: '30 May · 9:14 AM',
          autoCancelAt: '2 Jun · 9:14 AM',
          timeLeftLabel: '2 days, 20 hours left',
          opsName: 'Marwa',
          opsRole: 'Revibe Quality',
          opsMessage:
            "Hi Andrea — thanks for the details, but the device is still showing Activation Lock when we try the wipe. Could you double-check that you signed in to iCloud.com with the same Apple ID that's on this device, and that you tapped Remove from Account at the end of the Erase flow? If your passcode might have a typo, please re-enter it.",
          attempt: 2,
        },
        resetUnlock: undefined,
      },
    }),
  },
  {
    id: 'claim_reset_retry_resubmitted',
    label: 'Updated unlock details received',
    trigger: 'customer',
    event: 'claim.reset.retry_resubmitted',
    next: ['claim_refund_issued', 'claim_invalid_confirmed'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: undefined,
        actionRequired: undefined,
        resetFailed: undefined,
        resetUnlock: {
          at: '30 May · 10:22 AM',
          attempt: 2,
        },
      },
    }),
  },
]

// ----- Compensation claim journey ---------------------------------------
// Order lifecycle through delivery, then customer raises a compensation
// claim (keep-the-device, refund-only). Structurally the simplest claim
// journey — no pickup / transit / device-prep / packing / reset legs,
// because nothing is collected. Three distinguishing forks:
//   1. Sub-type fork at submit: `shipping_refund` (overcharged shipping)
//      vs `charger` (faulty bundled charger). This is the meaningful
//      compensation divergence — sub-type drives the evidence + the
//      support ops copy. No refund-method fork (compensation defers the
//      amount either way, so wallet vs original wouldn't diverge).
//   2. Unclear-evidence loop. Support can't read the proof and asks for a
//      reshoot — sets `claim.docsRejection` (+ subStatusId +
//      actionRequired), which routes to the existing `DocsRejectedCard`
//      takeover ("We need clearer evidence"). `claim_evidence_resubmitted`
//      clears it, sets `proofResubmission`, and re-merges into review.
//      Same takeover the issue journey reuses; compensation Step 2 also
//      requires an attachment, so the path is coherent.
//   3. Review outcome: valid → refund_issued (the amount is *revealed*
//      here — `amountPending` drops, `expectedRefund` is set) →
//      refund_credited (terminal). Invalid → `claim.invalidClaim` set with
//      ops copy *only* (no returnShipping / returnShipment — nothing was
//      shipped, so nothing comes back) → routes to InvalidClaimCard, which
//      short-circuits to CompensationClosedCard. Terminal — no pay/decline
//      sub-branch, unlike the refund/warranty invalid path.
//
// Ops messages are sub-type-aware (read from o.claim.compensationSubtype
// inside apply) so the charger and shipping-refund demos read distinctly.
const CLAIM_COMPENSATION_NODES = [
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
    next: ['claim_submitted_shipping_refund', 'claim_submitted_charger'],
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
  // ----- Compensation submitted (customer-triggered via ClaimFlow). Forks
  //       on sub-type. Both branches carry `amountPending: true` and no
  //       `expectedRefund` — the figure is confirmed by support later, at
  //       `claim_refund_issued`. Both target the same downstream nodes. --
  {
    id: 'claim_submitted_shipping_refund',
    label: 'Compensation submitted — shipping refund',
    trigger: 'customer',
    event: 'claim.created',
    next: ['claim_under_review', 'claim_evidence_unclear'],
    apply: (o) => ({
      ...o,
      claim: {
        claimRef: 'CpJrn1',
        claimStatusId: 'initiated',
        type: 'compensation',
        submittedAt: '25 May 2026 · 4:02 PM',
        units: 1,
        compensationSubtype: 'shipping_refund',
        issueDetails: {
          description:
            'I was charged AED 30 for shipping, but this order qualified for free delivery. Attaching the order confirmation showing the charge.',
          attachmentName: 'order_confirmation.png',
        },
        // Shape parity with the refund-flow mocks — compensation intake
        // skips the reason picker, but ClaimDetailsSheet reads it
        // defensively for shared rows.
        reason: { value: 'other', otherText: '' },
        refundMethod: 'wallet',
        amountPending: true,
        timeline: { initiated: '25 May · 4:02 PM' },
      },
    }),
  },
  {
    id: 'claim_submitted_charger',
    label: 'Compensation submitted — faulty charger',
    trigger: 'customer',
    event: 'claim.created',
    next: ['claim_under_review', 'claim_evidence_unclear'],
    apply: (o) => ({
      ...o,
      claim: {
        claimRef: 'CpJrn1',
        claimStatusId: 'initiated',
        type: 'compensation',
        submittedAt: '25 May 2026 · 4:02 PM',
        units: 1,
        compensationSubtype: 'charger',
        issueDetails: {
          description:
            "The charger that came in the box doesn't charge the phone — tried two outlets and the original cable. Video attached showing it plugged in with no response.",
          attachmentName: 'charger_test.mov',
        },
        reason: { value: 'other', otherText: '' },
        refundMethod: 'original',
        amountPending: true,
        timeline: { initiated: '25 May · 4:02 PM' },
      },
    }),
  },
  // ----- Review → refund chain (shared by both sub-types and the
  //       evidence-resubmitted re-merge). ------------------------------
  {
    id: 'claim_under_review',
    label: 'Under review',
    trigger: 'system',
    event: 'claim.review.started',
    next: ['claim_refund_issued', 'claim_invalid_confirmed'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'qc',
        timeline: { ...o.claim.timeline, qc: '28 May · 10:12 AM' },
      },
    }),
  },
  {
    id: 'claim_refund_issued',
    label: 'Refund issued',
    trigger: 'system',
    event: 'claim.refund.issued',
    // The amount is confirmed by support here — drop the `amountPending`
    // marker and set `expectedRefund` (sub-type-aware figure). Before this
    // node every customer-facing surface reads "To be confirmed".
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'refund_issued',
        amountPending: undefined,
        expectedRefund:
          o.claim.compensationSubtype === 'charger'
            ? { itemTotal: 120, warranty: 0, gross: 120, fee: 0, net: 120, rate: 0 }
            : { itemTotal: 30, warranty: 0, gross: 30, fee: 0, net: 30, rate: 0 },
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
  // ----- Unclear-evidence sub-branch. Support can't read the proof and
  //       asks for a reshoot. Reuses the issue flow's `DocsRejectedCard`
  //       takeover (routed first in App.jsx on `claim.docsRejection`).
  //       Resubmission clears the takeover, sets `proofResubmission` for
  //       the post-rejection HistoryThread chip, and re-merges into
  //       review. ------------------------------------------------------
  {
    id: 'claim_evidence_unclear',
    label: 'Support needs clearer evidence',
    trigger: 'system',
    event: 'claim.evidence.unclear',
    next: ['claim_evidence_resubmitted'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: 'awaiting_documents',
        actionRequired: {
          kind: 'awaiting_documents',
          deadline: '29 May · 11:18 AM',
          deadlineLabel: '2 days, 14 hours left',
        },
        docsRejection: {
          rejectedAt: '26 May · 11:18 AM',
          autoCancelAt: '29 May · 11:18 AM',
          timeLeftLabel: '2 days, 14 hours left',
          opsName: 'Yousef',
          opsRole: 'Revibe Quality',
          opsMessage:
            o.claim.compensationSubtype === 'charger'
              ? "Hi Andrea — thanks for the clip, but it's too dark to tell whether this is the charger that shipped with the phone. Could you reshoot in good light showing the Revibe charger and cable together with the phone's charging screen?"
              : 'Hi Andrea — thanks for the report. The order confirmation you attached is cropped and the shipping line isn’t visible. Could you resend the full confirmation showing the AED 30 shipping charge and the order number?',
          previous: [
            {
              name: o.claim.issueDetails.attachmentName,
              size: '2.4 MB',
              kind: o.claim.issueDetails.attachmentName.endsWith('.mov')
                ? 'video'
                : 'image',
              tag: o.claim.compensationSubtype === 'charger' ? 'Too dark' : 'Cropped',
            },
          ],
        },
      },
    }),
  },
  {
    id: 'claim_evidence_resubmitted',
    label: 'Evidence resubmitted',
    trigger: 'customer',
    event: 'claim.evidence.resubmitted',
    next: ['claim_under_review'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: undefined,
        actionRequired: undefined,
        docsRejection: undefined,
        proofResubmission: {
          at: '27 May · 10:42 AM',
          fileCount: 2,
        },
      },
    }),
  },
  // ----- Invalid verdict → CompensationClosedCard. Unlike the
  //       refund/warranty invalid path there is no return-shipping gate:
  //       nothing was collected, so `claim.invalidClaim` carries the ops
  //       message only (no returnShipping / returnShipment). The claim
  //       stays on `claimStatusId: 'qc'` (still "active") so it routes to
  //       InvalidClaimCard, which short-circuits to CompensationClosedCard.
  //       Terminal. -------------------------------------------------------
  {
    id: 'claim_invalid_confirmed',
    label: 'Review — claim not approved',
    trigger: 'system',
    event: 'claim.review.invalid_confirmed',
    next: [],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        invalidClaim: {
          determinedAt: '30 May · 3:50 PM',
          opsName: 'Yousef',
          opsRole: 'Revibe Quality',
          opsMessage:
            o.claim.compensationSubtype === 'charger'
              ? "Hi Andrea — thanks for the clip. The charger in the video looks like a third-party unit, not the one that shipped with the phone, so we weren't able to confirm a fault on the supplied accessory. You keep your device; if you can send a photo of the original Revibe charger and its cable, we'll happily take another look."
              : 'Hi Andrea — looking at the order, the AED 30 was an express-delivery upgrade selected at checkout, which falls outside the free standard-shipping promo. The charge is correct, so we can’t issue a shipping refund. You keep your device — reach out to support if you think this is a mistake.',
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
  // Sandbox journey — no node graph. Inputs (market + four dates) live in
  // useEddSandbox; the dev panel branches on `kind: 'sandbox'` and renders
  // EddSandboxPanel instead of the Next-button JourneyDevPanel. See
  // src/lib/edd.js for the underlying model.
  {
    id: 'dynamic_edd',
    label: 'Dynamic EDD',
    kind: 'sandbox',
    initialOrder: INITIAL_ORDER,
    nodes: [],
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
    initialOrder: {
      ...INITIAL_ORDER,
      paymentMethod: { type: 'bnpl', provider: 'tabby', brand: 'Tabby' },
    },
    nodes: CLAIM_COM_NODES,
  },
  {
    id: 'claim_issue',
    label: 'Issue / wrong-device claim',
    initialOrder: INITIAL_ORDER,
    nodes: CLAIM_ISSUE_NODES,
  },
  {
    id: 'claim_warranty',
    label: 'Warranty claim',
    initialOrder: INITIAL_ORDER,
    nodes: CLAIM_WARRANTY_NODES,
  },
  {
    id: 'claim_compensation',
    label: 'Compensation claim',
    initialOrder: INITIAL_ORDER,
    nodes: CLAIM_COMPENSATION_NODES,
  },
]
