// ----- Refused-delivery journey ------------------------------------------
// The happy path with one extra outcome at the door: instead of accepting the
// parcel, the customer turns the courier away. The refusal scan does the rest —
// it cancels the order automatically and starts a refund. The customer never
// asks for the cancellation and never picks a refund method.
//
// Shape of the flow:
//
//   placed → qc_started → shipped (country fork) → out for delivery
//     ├─ delivered                                  (happy path, unchanged)
//     └─ delivery_refused        ← stamps the cancellation itself
//          ├─ refused_cancel_accepted  (SA)  → refused_refunded
//          └─ refused_refunded         (rest)
//
// The market fork is the `refusalReview` flag (lib/countries.js), read both by
// the refusal node's `apply` and by the guards on its outgoing edges:
//
//   SA    (refusalReview) → Cancellation requested → Refund pending → Refunded
//   rest                  → Refund pending → Refunded
//
// SA's extra step is local ops signing off on the cancellation. It carries no
// stated timeframe on purpose — nothing is being recalled, so there's no
// courier window to quote. Outside SA there's nothing to sign off, so the
// `Requested` step is dropped from the timeline entirely rather than shown
// pre-completed (`cancellationStepsFor` in lib/statuses.js returns two steps).
//
// `delivery_refused` never touches `subStatusId`, so the single node serves both
// the granular (AE/ZA) and the collapsed (SA/Others) shipping chain. Replay any
// market:
//   ?journey=refused_delivery&country=AE   (granular chain, 2 refund steps)
//   ?journey=refused_delivery&country=SA   (collapsed chain, 3 refund steps)
//
// Terms: full refund to the **original payment method**, no deductions — the 5%
// processing fee is waived (the customer never took the device) and there's no
// Wallet bonus, because there's no broken delivery promise to apologise for.
// There is no store-credit option: the customer made no choice here, so we
// don't get to move their money somewhere they didn't pick.
import { countryConfig } from '../../lib/countries'

export const REFUSED_DELIVERY_NODES = [
  {
    id: 'placed',
    label: 'Order placed',
    trigger: 'customer',
    event: 'order.created',
    next: ['qc_started'],
    apply: (o) => o,
  },
  {
    id: 'qc_started',
    label: 'Quality check started',
    trigger: 'system',
    event: 'order.quality_check.started',
    // Outbound country fork (shared shipping chain): AE/ZA walk the granular
    // sub-statuses; SA/Others collapse to a single `shipped_simple` step.
    // country_split.md §6.
    next: [
      { id: 'shipped_arrived_destination', countries: ['AE', 'ZA'] },
      { id: 'shipped_simple', countries: ['SA', 'Others'] },
    ],
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
    next: ['shipped_cleared_customs'],
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
    next: ['shipped_forwarded_to_agent'],
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
    next: ['shipped_out_for_delivery'],
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
    // The fork this journey exists for: the courier arrives and the parcel is
    // either taken or turned away.
    next: ['delivered', 'delivery_refused'],
    apply: (o) => ({
      ...o,
      subStatusId: 'out_for_delivery',
      subTimeline: {
        ...(o.subTimeline ?? {}),
        out_for_delivery: '25 May · 7:30 AM',
      },
    }),
  },
  // Outbound country fork — SA/Others collapse the four shipping sub-statuses
  // into one "Shipped" step (no detailed tracking; banner copy collapses in
  // lib/statuses.js). Carries the same accept/refuse fork at the door.
  {
    id: 'shipped_simple',
    label: 'Shipped',
    trigger: 'system',
    event: 'shipment.shipped',
    next: ['delivered', 'delivery_refused'],
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
  // ----- The refusal ------------------------------------------------------
  // Courier scan, not an in-app action: the customer refused at the door, the
  // depot reports it, and we cancel on their behalf. Stage-agnostic on purpose
  // — it never touches `subStatusId`, so it serves both the granular (AE/ZA)
  // and the collapsed (SA/Others) chain.
  //
  // This node collapses the refusal and the cancellation into one step: there
  // is no intermediate "Delivery refused" hero asking the customer to cancel,
  // so the first thing they see is the cancellation card. `statusBanner` is
  // therefore never set — `statusDescription()` checks it *before* the cancelled
  // branch, so a banner here would mask the cancellation copy.
  //
  // `event` stays the courier scan (`shipment.delivery_refused`, unauthored ⇒
  // silent). One node fires one event, so there is no separate
  // `order.cancellation.*` comm on the entry step — if the customer needs a
  // "we've cancelled your order" message, that wants its own node.
  {
    id: 'delivery_refused',
    label: 'Delivery refused at the door',
    trigger: 'system',
    event: 'shipment.delivery_refused',
    // Guards mirror the `apply` fork below: SA stops at `requested` for local
    // ops sign-off, every other market is already on `refund_pending`.
    next: [
      {
        id: 'refused_cancel_accepted',
        when: (o) => countryConfig(o).refusalReview,
      },
      { id: 'refused_refunded', when: (o) => !countryConfig(o).refusalReview },
    ],
    apply: (o) => {
      const review = countryConfig(o).refusalReview
      const at = '25 May · 12:05 PM'
      return {
        ...o,
        // Still read by the refusal-specific copy: the cancellation banner,
        // the ⓘ explainer (`cancellation_<phase>_refused`), the SA caveat row,
        // and the two-step timeline fork.
        deliveryRefused: true,
        // The promise is spent: the parcel arrived and went back. No honest ETA
        // left to show.
        estimatedDelivery: null,
        state: 'cancelled',
        // Deliberately NOT `cancellationInitiator: 'revibe'` — that field routes
        // to RevibeCancellationCard (App.jsx), which is a settled, instant,
        // no-timeline surface. This cancellation has a refund journey to walk,
        // so it belongs on the refund-hero PastOrderCard.
        cancellationRef: 'R3fus3',
        cancellationStatusId: review ? 'requested' : 'refund_pending',
        cancellationTimeline: review
          ? { requested: at }
          : { refund_pending: at },
        // Original payment method, nothing deducted: no `fee` (waived — the
        // device was never taken) and no `bonus` (no delay to compensate for).
        refund: {
          subtotal: 1029,
          amount: 1029,
          destination: {
            kind: 'card',
            label: o.paymentMethod?.brand ?? 'Visa',
            last4: o.paymentMethod?.last4 ?? '4242',
          },
          breakdown: [
            { label: 'iPhone 13', amount: 939 },
            { label: 'Revibe Care', amount: 90 },
          ],
        },
      }
    },
  },
  // ----- Local ops sign-off (SA only) -------------------------------------
  // Only reachable where `refusalReview` is on. Nothing is being recalled — the
  // parcel turned around on its own — so this is our confirmation to give, not
  // the courier's to attempt, and it can't fail: there is no declined branch.
  {
    id: 'refused_cancel_accepted',
    label: 'Cancellation signed off — refund started',
    trigger: 'system',
    event: 'order.cancellation.accepted',
    next: ['refused_refunded'],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refund_pending',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refund_pending: '25 May · 4:20 PM',
      },
    }),
  },
  // ----- Refund issued ----------------------------------------------------
  {
    id: 'refused_refunded',
    label: 'Refund issued to the original payment method',
    trigger: 'system',
    event: 'order.refund.completed',
    next: [],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refunded',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refunded: '29 May · 9:30 AM',
      },
    }),
  },
]
