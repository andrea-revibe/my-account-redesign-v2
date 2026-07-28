
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
//     ├─ cancel_shipped_wallet   (requested)
//     │    ├─ cancel_shipped_accepted_wallet → refunded_shipped_wallet
//     │    ├─ cancel_shipped_declined ─┐
//     │    └─ cancellation_kept ───────┤
//     ├─ cancel_shipped_card     (requested)
//     │    ├─ cancel_shipped_accepted_card   → refunded_shipped_card
//     │    ├─ cancel_shipped_declined ─┤
//     │    └─ cancellation_kept ───────┤
//     └─ delivered  ←──────────────────┘       (the parcel finally lands)
//
// `shipped_stuck` stamps `promiseBreached`, which is the single flag both the
// cancel gate (`canCancelShipped`) and the cancel terms (`CancelOrderSheet`)
// read: fee waived on the card path, flat AED 100 Wallet bonus on the store
// credit path — the same terms as the late-at-QC cancellation
// (cancellations.md §2.5). It also drops `estimatedDelivery`, because a stalled
// parcel has no honest ETA left to show.
//
// The request lands on `requested`, not `refund_pending`: the parcel is already
// with the courier, so the recall has to be confirmed before any money moves —
// the same review shape as the at-QC cancellation, with a different reason for
// it (courier recall, not supplier packing). Accepted → `refund_pending`;
// declined → the order returns to `open` and continues to a late delivery, with
// the rejection surviving as a HistoryThread chip. There's still no return leg:
// the recall happens server-side, the customer never handles the box.
//
// The stall banner is restored on every path that hands the order back (declined
// / kept), so a reopened order never sits on the hero with no explanation.
const STUCK_BANNER = {
  tone: 'warn',
  lead: 'Delayed in transit',
  body:
    "Your parcel has been with the courier for 8 days without moving. We're chasing them for an update and will let you know as soon as it does.",
}

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
      statusBanner: STUCK_BANNER,
    }),
  },
  // ----- Cancellation request (wallet) ----------------------------------
  // Lands on `requested`, awaiting the courier recall verdict. `statusBanner`
  // is cleared because statusDescription() checks it *before* the cancelled
  // branch — leaving it would keep the amber in-transit banner on a cancelled
  // order. (The requested card renders no banner at all; the 48h promise lives
  // in the StatusExplainer copy + the requested refund hero's caveat row.)
  {
    id: 'cancel_shipped_wallet',
    label: 'Cancellation requested in transit — wallet refund + bonus',
    trigger: 'customer',
    event: 'order.cancellation.requested',
    next: [
      'cancel_shipped_accepted_wallet',
      'cancel_shipped_declined',
      'cancellation_kept',
    ],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      delayed: false,
      statusBanner: null,
      cancellationStatusId: 'requested',
      cancellationRef: 'J0urN2',
      cancellationTimeline: { requested: '31 May · 2:12 PM' },
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
  // The courier confirmed the parcel is coming back — inside the 48h the sheet
  // and the explainer promise.
  {
    id: 'cancel_shipped_accepted_wallet',
    label: 'Cancellation accepted — parcel recalled',
    trigger: 'system',
    event: 'order.cancellation.accepted',
    next: ['refunded_shipped_wallet'],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refund_pending',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refund_pending: '31 May · 4:40 PM',
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
  // ----- Cancellation request (original payment) -------------------------
  // Full total back to the card: the 5% processing fee is waived because the
  // delivery promise is already broken (`promiseBreached`), so `refund` carries
  // no `fee` object.
  {
    id: 'cancel_shipped_card',
    label: 'Cancellation requested in transit — card refund',
    trigger: 'customer',
    event: 'order.cancellation.requested',
    next: [
      'cancel_shipped_accepted_card',
      'cancel_shipped_declined',
      'cancellation_kept',
    ],
    apply: (o) => ({
      ...o,
      state: 'cancelled',
      delayed: false,
      statusBanner: null,
      cancellationStatusId: 'requested',
      cancellationRef: 'J0urN2',
      cancellationTimeline: { requested: '31 May · 2:12 PM' },
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
    label: 'Cancellation accepted — parcel recalled',
    trigger: 'system',
    event: 'order.cancellation.accepted',
    next: ['refunded_shipped_card'],
    apply: (o) => ({
      ...o,
      cancellationStatusId: 'refund_pending',
      cancellationTimeline: {
        ...o.cancellationTimeline,
        refund_pending: '31 May · 4:40 PM',
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
  // ----- Declined (shared by both refund branches) -----------------------
  // The recall failed — the decline outcome is identical whichever refund
  // method was picked, because no refund was ever issued. The order returns to
  // `open` at the stage it paused at (still `shipped`, still stalled), so the
  // delivery hero takes over again; `promiseBreached` survives, which means
  // `canCancelShipped` lets the customer ask again if it stays stuck.
  // `cancellationRejection` + the `rejected` stamp survive as the history chip
  // that shows up once the parcel finally lands (lib/events.js).
  {
    id: 'cancel_shipped_declined',
    label: 'Cancellation declined — parcel could not be recalled',
    trigger: 'system',
    event: 'order.cancellation.declined',
    next: ['delivered'],
    apply: (o) => ({
      ...o,
      state: 'open',
      delayed: true,
      cancellationStatusId: undefined,
      cancellationTimeline: {
        ...o.cancellationTimeline,
        rejected: '1 Jun · 10:15 AM',
      },
      cancellationRejection: {
        ref: 'CXL-J0urN2',
        reason:
          "The parcel was already too far along its route for the courier to pull it back, so we couldn't cancel the order.",
      },
      // Refund was never issued — clear the in-flight refund object.
      refund: undefined,
      statusBanner: {
        tone: 'warn',
        lead: 'Cancellation not possible',
        body:
          "The courier couldn't stop your parcel, so your order is still on its way. Once it arrives you have 10 days to return it.",
      },
    }),
  },
  // ----- Reversed by the customer ----------------------------------------
  // The `I want to keep my order` undo on the requested refund-hero card. The
  // id is deliberately the same as the at-QC journey's node: ids are
  // journey-scoped, and App.jsx's `handleKeepOrder` advances `cancellation_kept`
  // by name, so reusing it wires the CTA with no App change. Restores the stall
  // banner — the parcel is still stuck, nothing about that changed.
  {
    id: 'cancellation_kept',
    label: 'Cancellation reversed — order kept',
    trigger: 'customer',
    event: 'order.cancellation.reverted',
    next: ['delivered'],
    apply: (o) => ({
      ...o,
      state: 'open',
      delayed: true,
      cancellationStatusId: undefined,
      cancellationTimeline: {
        ...o.cancellationTimeline,
        reverted: '31 May · 3:05 PM',
      },
      cancellationReversal: {
        ref: 'CXL-J0urN2',
        reason:
          'You reversed the cancellation — we told the courier to keep the parcel moving to you.',
      },
      refund: undefined,
      statusBanner: STUCK_BANNER,
    }),
  },
  // The non-cancel outcome: the courier finally delivers, late. Keeps the
  // journey honest — the stall isn't automatically a cancellation. Also the
  // terminal for both hand-back paths above.
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
