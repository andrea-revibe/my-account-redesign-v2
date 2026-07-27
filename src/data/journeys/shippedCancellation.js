
// ----- Stuck-in-transit cancellation journey -----------------------------
// A shipped order that stops moving. Once the shipment has been in transit
// longer than SHIPPED_CANCEL_WINDOW_DAYS (lib/returns.js), markets outside AE
// let the customer cancel it themselves from the delivery hero — everywhere
// else `Cancel order` stays the tooltip stub and support has to do it.
//
// Replay it non-AE to see the live path:
//   ?journey=shipped_cancellation&country=ZA
// Replaying the same journey with `country=AE` is the deliberate contrast —
// identical order, no cancel affordance (`shippedCancellation` in
// lib/countries.js is false there).
//
// Shape of the flow:
//
//   placed → qc_started → shipped (country fork) → shipped_stuck
//     ├─ cancel_shipped_wallet → refunded_shipped_wallet
//     ├─ cancel_shipped_card   → refunded_shipped_card
//     └─ delivered                              (the parcel finally lands)
//
// `shipped_stuck` stamps `promiseBreached`, which is the single flag both the
// cancel gate (`canCancelShipped`) and the cancel terms (`CancelOrderSheet`)
// read: fee waived on the card path, flat AED 100 Wallet bonus on the store
// credit path — the same terms as the late-at-QC cancellation
// (cancellations.md §2.5). It also drops `estimatedDelivery`, because a stalled
// parcel has no honest ETA left to show.
//
// The refund lands on `refund_pending` immediately — no supplier review, no
// customer action. The parcel is recalled from the courier in the background
// (the sheet's confirm step says so), so there's no return leg to model here.
export const SHIPPED_CANCELLATION_NODES = [
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
    next: ['shipped_stuck'],
    apply: (o) => ({
      ...o,
      subStatusId: 'cleared_customs',
      subTimeline: {
        ...(o.subTimeline ?? {}),
        cleared_customs: '24 May · 11:15 AM',
      },
    }),
  },
  // Outbound country fork — SA/Others collapse the four shipping sub-statuses
  // into one "Shipped" step (no detailed tracking; banner copy collapses in
  // lib/statuses.js). country_split.md §6.
  {
    id: 'shipped_simple',
    label: 'Shipped',
    trigger: 'system',
    event: 'shipment.shipped',
    next: ['shipped_stuck'],
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
  // ----- The stall ------------------------------------------------------
  // Day 8 in transit, no courier movement. Stage-agnostic on purpose: it never
  // touches `subStatusId`, so it serves both the granular (AE/ZA) and the
  // collapsed (SA/Others) shipping chain. `event` is unauthored, so it resolves
  // to the silent notification placeholder — the comm copy is the owner's to
  // write.
  {
    id: 'shipped_stuck',
    label: 'Stuck in transit — past cancellation window',
    trigger: 'system',
    event: 'shipment.stuck_in_transit',
    next: ['cancel_shipped_wallet', 'cancel_shipped_card', 'delivered'],
    apply: (o) => ({
      ...o,
      delayed: true,
      promiseBreached: true,
      // A stalled parcel has no credible ETA — drop the promise rather than
      // invent a new one. `estimatedDeliveryLong` survives so the cancel
      // sheet's apology can still name the date we missed.
      estimatedDelivery: null,
      // Country-neutral on purpose: the cancel affordance is country-gated but
      // this node is not, so the banner must not offer a cancellation that AE
      // can't take. The `Cancel order` button is the only thing that speaks to
      // eligibility.
      statusBanner: {
        tone: 'warn',
        lead: 'Delayed in transit',
        body:
          "Your parcel has been with the courier for 8 days without moving. We're chasing them for an update and will let you know as soon as it does.",
      },
    }),
  },
  // ----- Cancellation (wallet) ------------------------------------------
  // Nothing to review and nothing for the customer to do: the request lands
  // straight on `refund_pending` and the parcel is recalled in the background.
  // `statusBanner` is cleared because statusDescription() checks it *before*
  // the cancelled branch — leaving it would keep the amber in-transit banner
  // on a cancelled order.
  {
    id: 'cancel_shipped_wallet',
    label: 'Cancellation in transit — wallet refund',
    trigger: 'customer',
    event: 'order.cancellation.requested',
    next: ['refunded_shipped_wallet'],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      delayed: false,
      statusBanner: null,
      cancellationStatusId: 'refund_pending',
      cancellationRef: 'J0urN2',
      cancellationTimeline: {
        requested: '31 May · 2:12 PM',
        refund_pending: '31 May · 2:12 PM',
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
        refunded: '31 May · 2:13 PM',
      },
      refund: {
        ...o.refund,
        fundsAvailable: 'Available now in your wallet',
      },
    }),
  },
  // ----- Cancellation (original payment) --------------------------------
  // Full total back to the card: the 5% processing fee is waived because the
  // delivery promise is already broken (`promiseBreached`), so `refund` carries
  // no `fee` object.
  {
    id: 'cancel_shipped_card',
    label: 'Cancellation in transit — card refund',
    trigger: 'customer',
    event: 'order.cancellation.requested',
    next: ['refunded_shipped_card'],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      delayed: false,
      statusBanner: null,
      cancellationStatusId: 'refund_pending',
      cancellationRef: 'J0urN2',
      cancellationTimeline: {
        requested: '31 May · 2:12 PM',
        refund_pending: '31 May · 2:12 PM',
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
        refunded: '3 Jun · 9:30 AM',
      },
    }),
  },
  // The non-cancel outcome: the courier finally delivers, late. Keeps the
  // journey honest — the stall isn't automatically a cancellation.
  {
    id: 'delivered',
    label: 'Delivered (late)',
    trigger: 'system',
    event: 'shipment.delivered',
    next: [],
    apply: (o) => ({
      ...o,
      statusId: 'delivered',
      state: 'close',
      subStatusId: null,
      delayed: false,
      statusBanner: null,
      timeline: { ...o.timeline, delivered: '2 Jun · 4:05 PM' },
      deliveredOn: '2026-06-02',
      deliveredOnLong: 'Tuesday, 2 June',
    }),
  },
]
