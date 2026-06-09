// Customer notifications for the `claim.*` domain — returns, issue, warranty
// and compensation claims. This is the largest domain; one filled example is
// below and the rest are listed as a scaffold grouped by sub-domain. Add an
// entry as each flow's notifications are defined. See orders.js for the format
// ({tokens} filled from the live order; screenshots under public/emails/claims/).
//
// As this grows it can be split further (e.g. claims/transit.js,
// claims/resolution.js) and merged in index.js — same barrel pattern.

// "Pending collection" — courier-pickup-is-coming message. Shared by two
// beats so they stay word-for-word identical to the one screenshot:
//   • change-of-mind at `claim.created` (no proof to review → straight to
//     pickup), via the `no_proof` variant below; and
//   • issue/warranty at `claim.documents.accepted` (after the background
//     proof review passes — see the proof-accepted node in those journeys).
const PENDING_COLLECTION = {
  whatsapp:
    "We received your claim! 🎉 Our courier will be in touch soon to arrange the pickup of your device — please have it ready!",
  email: {
    subject: 'We received your claim! 👍',
    body: 'We have received your claim! 🎉 Our courier will be in touch soon to arrange the pickup of your device. Please have it ready!',
    screenshot: '/emails/claims/pending-collection.png',
  },
}

export const CLAIM_NOTIFICATIONS = {
  // --- Example (filled) ---------------------------------------------------
  // `claim.created` is the one event whose copy diverges by claim type: claims
  // that carry proof (issue/warranty/compensation) go into a background review,
  // so the customer hears "we're reviewing it"; change-of-mind has nothing to
  // review and jumps straight to courier pickup. The resolver picks a variant
  // via `claimRequiresProof` — see lib/notifications.js.
  'claim.created': {
    variants: {
      proof: {
        whatsapp:
          "We received your claim! 👍 We have received your claim and our team is reviewing it 🔍 We will get back to you if needed!",
        email: {
          subject: 'We received your claim! 👍',
          body: 'We have received your claim and our team is reviewing it 🔍 We will get back to you if needed!',
          screenshot: '/emails/claims/form-received.png',
        },
      },
      no_proof: PENDING_COLLECTION,
    },
  },

  // Proof review passed (issue/warranty only — change-of-mind has no proof,
  // compensation has no pickup). Same pending-collection message as the
  // change-of-mind `claim.created`, fired one beat later once proof clears.
  'claim.documents.accepted': PENDING_COLLECTION,

  'claim.pickup.failed': {
    whatsapp:
      "We're sorry, our courier was unable to collect your device today 😕 We will get in touch to understand if you would like us to arrange a new pickup.",
    email: {
      subject: 'We missed you! 😕',
      body: "We're sorry, our courier was unable to collect your device today 😕 We will get in touch to understand if you would like us to arrange a new pickup.",
      screenshot: '/emails/claims/collection-failed.png',
    },
  },

  'claim.inspection.invalid_confirmed': {
    whatsapp:
      "Update on your claim 😔 We will get in touch to understand if you would like us to arrange a new pickup.",
    email: {
      subject: 'Update on your claim 😔',
      body: "After carefully reviewing your claim, our team has determined that unfortunately it does not meet our policy criteria 😔 Someone from our team will be in touch soon to explain the reasons and provide next steps.",
      screenshot: '/emails/claims/invalid-claim.png',
    },
  },



  // --- Scaffold — add entries as flows are built --------------------------
  // Intake / evidence:
  //   'claim.documents.rejected'      'claim.documents.resubmitted'
  //   'claim.evidence.unclear'        'claim.evidence.resubmitted'
  // Pickup + inbound transit (device → Revibe):
  //   'claim.pickup.rescheduled'
  //   'claim.transit.picked_up'       'claim.transit.in_transit'
  //   'claim.transit.arrived_origin_hub'   'claim.transit.arrived_revibe_hub'
  // Reset (Activation Lock):
  //   'claim.reset.failed'            'claim.reset.details_received'
  //   'claim.reset.retry_failed'      'claim.reset.retry_resubmitted'
  // Inspection / review outcome:
  //   'claim.qc.started'              'claim.review.started'
  //   'claim.review.invalid_confirmed'   
  // Resolution — refund / repair / return:
  //   'claim.refund.issued'           'claim.refund.completed'
  //   'claim.repair.started'          'claim.device.returned'
  //   'claim.cancelled'               'claim.declined'
  //   'claim.return_shipping.paid'    'claim.ship_back.created'
  //   'claim.return_shipment.*'  /  'claim.ship_back.*'  (out_for_delivery, delivered, …)
  //
  // Template:
  // 'claim.documents.rejected': {
  //   whatsapp: '…',
  //   email: { subject: '…', body: '…', screenshot: '/emails/claims/docs-rejected.png' },
  // },
}
