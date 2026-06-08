
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
export const CLAIM_COMPENSATION_NODES = [
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
    next: ['claim_under_review', 'claim_evidence_unclear', 'claim_cancelled'],
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
    next: ['claim_under_review', 'claim_evidence_unclear', 'claim_cancelled'],
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
    next: ['claim_refund_issued', 'claim_invalid_confirmed', 'claim_cancelled'],
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
  // ----- Customer-cancelled terminal — reachable from both submitted
  //       nodes and from "under review" (compensation has no shipment
  //       leg, so it stays cancellable until the refund is issued).
  //       Strips the claim so the order reverts to its delivered
  //       PastOrderCard (re-raisable). --------------------------------
  {
    id: 'claim_cancelled',
    label: 'Claim cancelled by customer',
    trigger: 'customer',
    event: 'claim.cancelled',
    next: [],
    apply: (o) => ({ ...o, claim: undefined }),
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
