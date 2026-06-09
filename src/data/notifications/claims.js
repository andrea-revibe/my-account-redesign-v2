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

  'claim.cancelled': {
    status: 'missing',
    whatsapp:
      "missing ‼️",
    email: {
      subject: 'missing ‼️',
      body: "",
      screenshot: '',
    },
  },

  'claim.pickup.rescheduled': {
    status: 'missing',
    whatsapp:
      "missing ‼️",
    email: {
      subject: 'missing ‼️',
      body: "",
      screenshot: '',
    },
  },

  'claim.documents.rejected': {
    status: 'missing',
    whatsapp:
      "missing ‼️",
    email: {
      subject: 'missing ‼️',
      body: "",
      screenshot: '',
    },
  },

  'claim.documents.resubmitted': {
    status: 'missing',
    whatsapp:
      "missing ‼️",
    email: {
      subject: 'missing ‼️',
      body: "",
      screenshot: '',
    },
  },

  'claim.transit.picked_up': {
    whatsapp:
      "Your device is on its way to us! 📦 We will notify you as soon as it arrives at our warehouse.",
    email: {
      subject: 'Your device is on its way to us! 📦',
      body: "We will notify you as soon as it arrives at our warehouse.",
      screenshot: '/emails/claims/in-transit.png',
    },
  },

  'claim.qc.started': {
    whatsapp:
      "We are checking your device! 🔬 We have received your device and our quality control team is now inspecting it. We will update you as soon as the review is complete!",
    email: {
      subject: 'We are checking your device! 🔬',
      body: "We have received your device and our quality control team is now inspecting it. We will update you as soon as the review is complete!",
      screenshot: '/emails/claims/under-qc.png',
    },
  },

  'claim.reset.failed': {
    status: 'missing',
    whatsapp:
      "missing ‼️",
    email: {
      subject: 'missing ‼️',
      body: "",
      screenshot: '',
    },
  },

  'claim.reset.details_received': {
    status: 'missing',
    whatsapp:
      "missing ‼️",
    email: {
      subject: 'missing ‼️',
      body: "",
      screenshot: '',
    },
  },

  'claim.reset.retry_failed': {
    status: 'missing',
    whatsapp:
      "missing ‼️",
    email: {
      subject: 'missing ‼️',
      body: "",
      screenshot: '',
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

  'claim.repair.started': { // this is for warranties after its marked as a valid claim 
    status: 'missing',
    whatsapp:
      "missing ‼️",
    email: {
      subject: 'missing ‼️',
      body: "",
      screenshot: '',
    },
  },

  'claim.declined': {
    status: 'missing',
    whatsapp:
      "missing ‼️",
    email: {
      subject: 'missing ‼️',
      body: "",
      screenshot: '',
    },
  },

  'claim.return_shipping.paid': {
    whatsapp:
      "Your device will be shipped back! 📦",
    email: {
      subject: 'Your device will be shipped back! 📦',
      body: "Your device will be shipped back to you shortly 📦 You will receive a tracking update once it is on its way!",
      screenshot: '',
    },
  },

  'claim.refund.issued': {
    whatsapp:
      "Your claim has been approved and your refund is being processed! 💸 You will receive your money back to your preferred payment method shortly.",
    email: {
      subject: "Your refund is being processed! 💸",
      body: "Your claim has been approved and your refund is being processed! 💸 You will receive your money back to your preferred payment method shortly.",
      screenshot: '/emails/claims/refund-issued.png',
    },
  },

  'claim.refund.completed': { // no distinction between revibe wallet and original payment method (last sentence is not needed for revibe wallet)
    whatsapp:
      "Your claim has been approved and your refund is being processed! 💸 You will receive your money back to your preferred payment method shortly.",
    email: {
      subject: "Refunded! 💰",
      body: "Good news! We have refunded your order to your preferred payment method 💰 Please note that it might take up to 7 days to reflect in your account.",
      screenshot: '/emails/claims/refund-issued.png',
    },
  },

  // missing step where AWB is created from Revibe and ship_back_under_collection notifications are sent to customers 

  // missing step where AWB has first pcikup event and shipped_back notifications are sent to customers

  'claim.return_shipment.delivered': {
    whatsapp:
      "Great news! Your device has been successfully delivered back to you ✅ We hope everything was handled to your satisfaction. Feel free to reach out if you need anything!",
    email: {
      subject: "Your device has been delivered! ✅",
      body: "Great news! Your device has been successfully delivered back to you ✅ We hope everything was handled to your satisfaction. Feel free to reach out if you need anything!",
      screenshot: '/emails/claims/shipped-back-delivered.png',
    },
  },

  // --- Scaffold — add entries as flows are built --------------------------
  // Intake / evidence:
  //   'claim.evidence.unclear'        'claim.evidence.resubmitted'
  // Pickup + inbound transit (device → Revibe):
  //   'claim.transit.in_transit'
  //   'claim.transit.arrived_origin_hub'   'claim.transit.arrived_revibe_hub'
  // Inspection / review outcome:
  //   'claim.review.started'
  //   'claim.review.invalid_confirmed'   
  // Resolution — refund / repair / return:
  //   'claim.device.returned'
  //   'claim.ship_back.created'
  //   'claim.return_shipment.*'  /  'claim.ship_back.*'  (out_for_delivery, delivered, …)
  //
  // Template:
  // 'claim.documents.rejected': {
  //   whatsapp: '…',
  //   email: { subject: '…', body: '…', screenshot: '/emails/claims/docs-rejected.png' },
  // },
}
