// Customer notifications for the `claim.*` domain — returns, issue, warranty
// and compensation claims. This is the largest domain; one filled example is
// below and the rest are listed as a scaffold grouped by sub-domain. Add an
// entry as each flow's notifications are defined. See orders.js for the format
// ({tokens} filled from the live order; screenshots under public/emails/claims/).
//
// As this grows it can be split further (e.g. claims/transit.js,
// claims/resolution.js) and merged in index.js — same barrel pattern.
export const CLAIM_NOTIFICATIONS = {
  // --- Example (filled) ---------------------------------------------------
  'claim.created': {
    whatsapp:
      "We've received your claim for your Revibe order 📝 Our team is reviewing it and we'll be in touch with the next steps shortly.",
    email: {
      subject: 'We’ve received your claim',
      body: "Thanks for letting us know. We've received your claim and our team is reviewing it. We'll email you with the next steps — including how to return your device if needed — very soon.",
      screenshot: '/emails/claims/claim-created.png',
    },
  },

  'claim.pickup.failed': {
    whatsapp:
      "We're sorry, our courier was unable to collect your device today 😕 We will get in touch to understand if you would like us to arrange a new pickup.",
    email: {
      subject: 'We missed you! 😕',
      body: "We're sorry, our courier was unable to collect your device today 😕 We will get in touch to understand if you would like us to arrange a new pickup.",
      screenshot: '/emails/claims/collection-failed.png',
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
  //   'claim.review.invalid_confirmed'     'claim.inspection.invalid_confirmed'
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
