
// ----- Refused-delivery journey ------------------------------------------
// The happy path with one extra outcome at the door: instead of accepting the
// parcel, the customer turns the courier away. From there the order enters the
// same self-cancellation flow as a stuck-in-transit shipment — the customer
// raises it from the delivery hero's `Cancel order`, it lands on `requested`
// awaiting confirmation, and the refund follows.
//
// Shape of the flow:
//
//   placed → qc_started → shipped (country fork) → out for delivery
//     ├─ delivered                                  (happy path, unchanged)
//     └─ delivery_refused
//          ├─ cancel_shipped_wallet (requested) → accepted → refunded
//          └─ cancel_shipped_card   (requested) → accepted → refunded
//
// Two things make this journey cheap:
//
//   1. The cancellation nodes reuse the `cancel_shipped_*` ids from the
//      stuck-in-transit journey. Ids are journey-scoped, and App.jsx's
//      `handleCancelOrder` advances whichever `cancel_shipped_{branch}` is in
//      validNext, so the real cancel sheet drives this journey with no App
//      change.
//   2. `delivery_refused` never touches `subStatusId`, so the single node
//      serves both the granular (AE/ZA) and the collapsed (SA/Others)
//      shipping chain.
//
// Unlike the stuck-in-transit cancellation, this path is **not** country-gated:
// `canCancelShipped` returns true on `deliveryRefused` before it looks at
// `shippedCancellation`, because that flag is about whether a market can have a
// *moving* parcel recalled by the courier — and a refused parcel is already
// travelling back on its own. So the flow is live under every country; replay
// any of them:
//   ?journey=refused_delivery&country=AE   (granular shipping chain)
//   ?journey=refused_delivery&country=SA   (collapsed chain)
//
// Terms differ from the stuck-in-transit cancellation. Refusal opens the gate
// via `deliveryRefused` rather than `promiseBreached`: the 5% processing fee is
// waived (the customer never took the device) but there's no delay to
// apologise for, so no Wallet bonus and no missed-promise dissuade screen —
// see CancelOrderSheet.
const REFUSED_BANNER = {
  // `danger`, not `warn`: the customer has to decide something (cancel, or ask
  // for another delivery). `warn` is the "we're on it, sit tight" tone the stall
  // uses — HeroCard renders the two differently on purpose.
  tone: 'danger',
  lead: 'Delivery refused',
  // The refusal contradicts the last courier scan rather than continuing it, so
  // it overrides the sub-status headline too (`statusHeadline` in
  // lib/statuses.js) — otherwise the hero reads "Out for delivery" above copy
  // saying the parcel is coming back.
  headline: 'Delivery refused',
  body:
    "You turned the parcel away at the door, so it's on its way back to us. Cancel the order to get your money back, or contact us to arrange another delivery.",
}

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
  // depot reports it. Stage-agnostic on purpose — it never touches
  // `subStatusId`, so it serves both the granular (AE/ZA) and the collapsed
  // (SA/Others) chain, and the order stays `shipped` because the parcel is
  // still in the courier's hands (heading the other way). `event` is
  // unauthored, so it resolves to the silent notification placeholder — the
  // comm copy is the owner's to write.
  {
    id: 'delivery_refused',
    label: 'Delivery refused at the door',
    trigger: 'system',
    event: 'shipment.delivery_refused',
    next: ['cancel_shipped_wallet', 'cancel_shipped_card'],
    apply: (o) => ({
      ...o,
      // Opens the self-cancel gate on the delivery hero (canCancelShipped) and
      // waives the processing fee in the cancel sheet — without claiming a
      // missed delivery promise, which is what `promiseBreached` would do.
      deliveryRefused: true,
      // The promise is spent: the parcel arrived and went back. No honest ETA
      // left to show. `estimatedDeliveryLong` survives for the sheet's copy.
      estimatedDelivery: null,
      statusBanner: REFUSED_BANNER,
    }),
  },
  // ----- Cancellation request (wallet) ----------------------------------
  // Lands on `requested`: the parcel is with the courier and has to get back
  // to us before any money moves — the same review shape as the
  // stuck-in-transit cancellation. `statusBanner` is cleared because
  // statusDescription() checks it *before* the cancelled branch; leaving it
  // would keep the refusal banner on a cancelled order.
  {
    id: 'cancel_shipped_wallet',
    label: 'Cancellation requested after refusal — wallet refund',
    trigger: 'customer',
    event: 'order.cancellation.requested',
    next: ['cancel_shipped_accepted_wallet'],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      statusBanner: null,
      cancellationStatusId: 'requested',
      cancellationRef: 'R3fus3',
      cancellationTimeline: { requested: '25 May · 12:05 PM' },
      // No `bonus`: the fee is waived because the device was never taken, but
      // there's no delay to compensate for.
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
    id: 'cancel_shipped_accepted_wallet',
    label: 'Cancellation accepted — parcel on its way back',
    trigger: 'system',
    event: 'order.cancellation.accepted',
    next: ['refunded_shipped_wallet'],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refund_pending',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refund_pending: '25 May · 4:20 PM',
      },
    }),
  },
  {
    id: 'refunded_shipped_wallet',
    label: 'Wallet refund credited',
    trigger: 'system',
    event: 'order.refund.completed',
    next: [],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refunded',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refunded: '25 May · 4:35 PM',
      },
      refund: {
        ...o.refund,
        fundsAvailable: 'Available now in your wallet',
      },
    }),
  },
  // ----- Cancellation request (original payment) -------------------------
  // Full total back to the card: the 5% processing fee is waived on a refused
  // delivery (`deliveryRefused`), so `refund` carries no `fee` object.
  {
    id: 'cancel_shipped_card',
    label: 'Cancellation requested after refusal — card refund',
    trigger: 'customer',
    event: 'order.cancellation.requested',
    next: ['cancel_shipped_accepted_card'],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      statusBanner: null,
      cancellationStatusId: 'requested',
      cancellationRef: 'R3fus3',
      cancellationTimeline: { requested: '25 May · 12:05 PM' },
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
    id: 'cancel_shipped_accepted_card',
    label: 'Cancellation accepted — parcel on its way back',
    trigger: 'system',
    event: 'order.cancellation.accepted',
    next: ['refunded_shipped_card'],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refund_pending',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refund_pending: '25 May · 4:20 PM',
      },
    }),
  },
  {
    id: 'refunded_shipped_card',
    label: 'Card refund issued',
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
