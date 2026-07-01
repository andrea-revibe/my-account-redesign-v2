
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
//      claim later moves to pickup. Re-merges into the proof-accepted
//      beat. Operational reference: issue n4 → n6 → n7 in
//      docs/input/return_flow_issue.md.
//   3. Proof-accepted intake beat — because Step 2 carries proof, the
//      background review must pass before pickup, so submit → proof
//      accepted (pending-collection notification) → pickup outcome. The
//      change-of-mind journey skips this (no proof → pickup directly).
//   4. Courier pickup outcome (succeeded vs failed). Same shape as the
//      CoM and warranty journeys.
//   4. QC outcome (valid vs invalid). Valid → refund_issued →
//      refund_credited (terminal). Invalid → `claim.invalidClaim` routes
//      to InvalidClaimCard with the issue-flavoured ops message. The
//      paid / declined sub-branches mirror the warranty journey's
//      invalid-claim chain.
//
// Issue subtype seeded as `battery` (from issueSubtypes.NOT_WORKING_SUBTYPES)
// so the ops dialogue can quote a concrete diagnostic ("cell health 92%").
export const CLAIM_ISSUE_NODES = [
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
    // Outbound country fork: detailed-tracking markets (AE/ZA) walk the four
    // shipping sub-statuses; SA/Others collapse to a single `shipped_simple`
    // step. country_split.md §6.
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
  // Outbound country fork — SA/Others collapse the four shipping sub-statuses
  // into one "Shipped" step (no detailed tracking; banner copy collapses in
  // lib/statuses.js). AE/ZA walk the granular chain. country_split.md §6.
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
  // ----- Issue claim submitted (customer-triggered via ClaimFlow). Forks
  //       on refund method: wallet carries the +AED 100 bonus chip,
  //       original payment carries no fee (issue branch). Both converge
  //       on the same downstream nodes via shared `next` targets. -------
  {
    id: 'claim_submitted_wallet',
    label: 'Issue claim submitted — wallet refund',
    trigger: 'customer',
    event: 'claim.created',
    next: ['claim_proof_accepted', 'claim_docs_rejected', 'claim_cancelled'],
    apply: (o) => ({
      ...o,
      claim: {
        claimRef: 'IsJrn1',
        claimStatusId: 'initiated',
        type: 'issue',
        submittedAt: '25 May 2026 · 4:02 PM',
        units: 1,
        issueScope: 'not_working',
        issueSubtypeId: 'battery_drain',
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
    next: ['claim_proof_accepted', 'claim_docs_rejected', 'claim_cancelled'],
    apply: (o) => ({
      ...o,
      claim: {
        claimRef: 'IsJrn1',
        claimStatusId: 'initiated',
        type: 'issue',
        submittedAt: '25 May 2026 · 4:02 PM',
        units: 1,
        issueScope: 'not_working',
        issueSubtypeId: 'battery_drain',
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
  // ----- Proof accepted. Background proof review passed — the customer
  //       hears "courier will be in touch" (the same pending-collection
  //       message change-of-mind gets at claim.created, one beat later).
  //       Notification beat only; no card-state change. The docs-resubmitted
  //       re-merge also routes through here. ------------------------------
  {
    id: 'claim_proof_accepted',
    label: 'Proof accepted',
    trigger: 'system',
    event: 'claim.documents.accepted',
    next: ['claim_awb_generated', 'claim_awb_failed', 'claim_cancelled'],
    apply: (o) => o,
  },
  // ----- Airway-bill (shipping label) generation. The AWB must be created
  //       before a courier pickup can be booked, so it sits between proof
  //       acceptance and pickup. Happy path: claim_awb_generated stamps the
  //       AWB onto scheduledPickup (which is what surfaces the ClaimCard
  //       pickup strip). Failure path: claim_awb_failed → claim_need_address
  //       (AwbFailedCard) → back through claim_awb_generated once the customer
  //       confirms the address. ---------------------------------------------
  {
    id: 'claim_awb_generated',
    label: 'Airway bill created',
    trigger: 'system',
    event: 'claim.awb.generated',
    // Also the re-merge target for the need-address detour: clears the failure
    // and stamps the AWB, then hands off to the pickup gate (success / failed).
    next: ['claim_picked_up', 'claim_pickup_failed'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'initiated',
        awbFailure: undefined,
        actionRequired: undefined,
        subStatusId: undefined,
        scheduledPickup: {
          courier: 'DHL Express',
          date: 'Wednesday, 27 May',
          slot: '10 AM – 12 PM',
          awb: '25193540',
        },
      },
    }),
  },
  {
    id: 'claim_awb_failed',
    label: 'Airway bill couldn’t be created',
    trigger: 'system',
    event: 'claim.awb.failed',
    next: ['claim_need_address'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        // No AWB → no bookable pickup; drop any pre-set pickup window.
        scheduledPickup: undefined,
        awbFailure: {
          failedAt: '26 May · 9:05 AM',
          autoCancelAt: '30 May · 9:05 AM',
          timeLeftLabel: '3 days, 22 hours left',
          opsName: 'Rashid',
          opsRole: 'DHL Express',
          opsMessage:
            "Hi Andrea — we tried to create your pickup label but the courier couldn't validate the address we have on file (it's missing a building/office the driver can route to). Please confirm or update the pickup address and we'll generate the airway bill and book your collection.",
        },
      },
    }),
  },
  {
    id: 'claim_need_address',
    label: 'Pickup address confirmed',
    trigger: 'customer',
    event: 'claim.awb.address_submitted',
    // Customer confirmed the address (via UI) — the card flips to its
    // "generating label" state but the claim hasn't moved (awbFailure stays
    // set, tagged with submittedAt). The system re-runs claim_awb_generated
    // to actually create the AWB and resume the happy chain.
    next: ['claim_awb_generated'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        awbFailure: {
          ...o.claim.awbFailure,
          submittedAt: '26 May · 9:40 AM',
        },
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
    // Inbound-leg country fork — picked_up already seeds the functional pickup
    // state, so SA/Others skip the three granular transit sub-statuses straight
    // to QC (no detailed tracking). AE/ZA walk them. country_split.md §6.
    // Also the re-merge point for the pickup-failed detour
    // (claim_pickup_rescheduled → here): clears any pickupFailure / actionRequired
    // left by that branch (no-op on the happy path).
    next: [
      { id: 'claim_transit_arrived_origin_hub', countries: ['AE', 'ZA'] },
      { id: 'claim_qc_started', countries: ['SA', 'Others'] },
    ],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'pickup',
        pickupFailure: undefined,
        actionRequired: undefined,
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
    next: [
      'claim_refund_issued',
      'claim_invalid_confirmed',
      'claim_reset_failed',
      'claim_cancelled_shipback',
    ],
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
  // ----- Customer-cancelled terminal — reachable from the cancellable
  //       (pre-pickup) submitted nodes. Strips the claim so the order
  //       reverts to its delivered PastOrderCard (re-raisable). -------
  {
    id: 'claim_cancelled',
    label: 'Claim cancelled by customer',
    trigger: 'customer',
    event: 'claim.cancelled',
    next: [],
    apply: (o) => ({ ...o, claim: undefined }),
  },
  // ----- Post-collection cancel — the device is already with Revibe, so
  //       cancelling can't just revert: the customer pays return shipping
  //       to get it back. Sets the same `invalidClaim` gate (reason
  //       'cancelled') the invalid verdict uses and points into the
  //       existing return chain (`claim_return_shipping_paid` → return
  //       sub-statuses → delivered). Reachable from the QC-phase nodes. -
  {
    id: 'claim_cancelled_shipback',
    label: 'Claim cancelled — pay return shipping',
    trigger: 'customer',
    event: 'claim.cancelled',
    next: ['claim_return_shipping_paid'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        docsRejection: undefined,
        pickupFailure: undefined,
        resetFailed: undefined,
        actionRequired: undefined,
        subStatusId: null,
        invalidClaim: {
          reason: 'cancelled',
          requestedAt: '30 May · 4:18 PM',
          autoCancelAt: '6 Jun · 4:18 PM',
          timeLeftLabel: '7 days left',
          returnShipping: { amount: 35, currency: 'AED' },
          returnShipment: {
            courier: 'DHL Express',
            estimatedDelivery: 'Jun 8',
            estimatedDeliveryLong: 'Monday, 8 June',
            currentStatusId: 'created',
            timeline: { created: '31 May · 11:00 AM' },
          },
        },
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
    // Re-merges into the proof-accepted beat — the resubmitted proof clears,
    // so the customer gets the same "proof accepted → courier coming" beat as
    // the happy path before the pickup outcome fork.
    next: ['claim_proof_accepted'],
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
    // Customer confirmed the new pickup slot (via UI) — the card flips to its
    // "new pickup on the way" state but the claim itself hasn't moved yet
    // (pickupFailure stays set, tagged with rescheduledAt). Courier collection
    // is the separate system event below; re-merges at claim_picked_up, which
    // clears the failure, advances to 'pickup' and carries the country fork.
    next: ['claim_picked_up'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        subStatusId: undefined,
        actionRequired: undefined,
        scheduledPickup: {
          courier: 'DHL Express',
          date: 'Thursday, 28 May',
          slot: '10 AM – 12 PM',
        },
        pickupFailure: {
          ...o.claim.pickupFailure,
          rescheduledAt: '27 May · 9:15 AM',
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
    event: 'claim.ship_back.created',
    // Return-leg country fork — paying already set the shipment to `shipped`,
    // so SA/Others skip the four granular return sub-statuses straight to
    // delivered (no detailed tracking). AE/ZA walk them. country_split.md §6.
    next: [
      { id: 'claim_invalid_return_arrived_destination', countries: ['AE', 'ZA'] },
      { id: 'claim_invalid_return_delivered', countries: ['SA', 'Others'] },
    ],
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
    event: 'claim.ship_back.arrived_destination',
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
    event: 'claim.ship_back.cleared_customs',
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
    event: 'claim.ship_back.forwarded_to_agent',
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
    event: 'claim.ship_back.out_for_delivery',
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
    event: 'claim.device.returned',
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
            deliveredOn: '8 Jun',
            deliveredOnLong: 'Monday, 8 June',
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
    // Declining isn't fully terminal: within the short reversal window the
    // customer can still change their mind and pay return shipping (the closed
    // card's "I changed my mind" CTA), which creates the ship-back — the same
    // node as paying from the action-needed gate, so the dev panel stays in
    // lockstep.
    next: ['claim_return_shipping_paid'],
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
    next: ['claim_reset_details_received', 'claim_cancelled_shipback'],
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
    // Customer submitted unlink confirmation + passcode (via UI) — the card
    // flips to its "reset in progress / details received" state, but the claim
    // hasn't moved yet (resetFailed stays set, tagged with submittedAt). Ops
    // attempting the wipe is the separate system step below; from there the
    // reset either completes (claim_reset_complete → QC resumes) or fails
    // again (claim_reset_retry_failed).
    next: ['claim_reset_complete', 'claim_reset_retry_failed'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        actionRequired: undefined,
        resetFailed: {
          ...o.claim.resetFailed,
          submittedAt: '29 May · 12:48 PM',
        },
        resetUnlock: {
          at: '29 May · 12:48 PM',
          attempt: 1,
        },
      },
    }),
  },
  // The "24h passed" system step: ops finished the wipe, so the takeover
  // clears and quality check resumes (ClaimCard "Under Quality Check"), then
  // forks to the QC outcome. Shared by the first submission and the retry
  // resubmission. New event → silent until authored.
  {
    id: 'claim_reset_complete',
    label: '24h passed — reset done',
    trigger: 'system',
    event: 'claim.reset.completed',
    next: ['claim_refund_issued', 'claim_invalid_confirmed'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        claimStatusId: 'qc',
        subStatusId: undefined,
        actionRequired: undefined,
        resetFailed: undefined,
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
    // Same customer comm as the first submission — both fire
    // claim.reset.details_received (attempt distinguishes them). Mirrors the
    // first submission: keeps resetFailed (adds submittedAt) so the card shows
    // the "details received" state, then re-merges at the shared
    // claim_reset_complete ("24h passed") step.
    event: 'claim.reset.details_received',
    next: ['claim_reset_complete'],
    apply: (o) => ({
      ...o,
      claim: {
        ...o.claim,
        actionRequired: undefined,
        resetFailed: {
          ...o.claim.resetFailed,
          submittedAt: '30 May · 10:22 AM',
        },
        resetUnlock: {
          at: '30 May · 10:22 AM',
          attempt: 2,
        },
      },
    }),
  },
]
