// Customer notifications for the `order.*` domain — the pre-claim order
// lifecycle (placed, quality check) plus cancellation + order-level refund.
//
// Each entry is pure data: `whatsapp` string, `email` { subject, body,
// screenshot }. Copy can embed {tokens} (e.g. {trackingNumber}) — they're
// filled from the live order by `interpolate` in lib/notifications.js. Edit
// the strings freely; no code to touch. `screenshot` points to a file under
// public/emails/orders/ (the lightbox shows a placeholder until it exists).
//
// COVERAGE METADATA — `status` (see lib/notifications.js NOTIFICATION_STATUSES):
// tag every entry with how it relates to our existing comms —
//   'live'    in current comms, unchanged          'changed' revised wording
//   'new'     brand-new, not sent today            'missing' a gap (see below)
// An untagged entry still defaults to 'live'; events with no entry are 'silent'
// (intentional no-comm). To flag a gap, add a bare marker with no copy:
//   'order.refund.completed': { status: 'missing' },
// `order.created` below is the worked example — replicate `status` across the
// rest as you audit each against production copy.
export const ORDER_NOTIFICATIONS = {
  'order.created': {
    status: 'live',
    whatsapp:
      "Hi 👋 Your Revibe order is confirmed. We'll let you know the moment it's on the move — track it anytime in My Account.",
    email: {
      subject: 'Your Revibe order is confirmed 🎉',
      body: "Thanks for shopping with Revibe! We've received your order and our team is getting it ready. We'll be in touch once it passes quality check and ships.",
      screenshot: '/emails/orders/order-confirmed.png',
    },
  },

  'order.quality_check.started': {
    whatsapp:
      "Your Revibe device is now in quality check ✅ Every device is inspected and certified before it ships. We'll update you the moment it's on its way.",
    email: {
      subject: 'Your device is in quality check',
      body: "Your order has reached our quality check stage. Our technicians are inspecting and certifying your device to Revibe standards. You'll get another update as soon as it ships.",
      screenshot: '/emails/orders/quality-check.png',
    },
  },

  // --- Cancellation + order refund (scaffold) -----------------------------
  // Not yet authored — add entries here as the cancellation journey's
  // notifications are defined. Available events:
  //   'order.cancellation.requested'
  //   'order.cancellation.accepted'
  //   'order.cancellation.declined'
  //   'order.cancellation.reverted'
  //   'order.refund.completed'
  //   'order.sla.breached'
  // Template:
  // 'order.cancellation.requested': {
  //   whatsapp: '…',
  //   email: { subject: '…', body: '…', screenshot: '/emails/orders/cancellation-requested.png' },
  // },
}
