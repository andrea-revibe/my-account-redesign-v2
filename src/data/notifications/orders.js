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
      "Thank you for choosing Revibe! 🙌🏼 We received your order and soon we will start the quality check process. Please notice that our shipping time is 2 to 4 working days, so the expected delivery date for your device is by “today + 4 WD”. We will keep updating you during the process but if you want to see your order or create any request, please access to myaccount.",
    email: {
      subject: 'Thank you for choosing Revibe! 🙌🏼',
      body: "We received your order and soon we will start the quality check process. Please notice that our shipping time is 2 to 4 working days, so the expected delivery date for your device is by “today + 4 WD”. We will keep updating you during the process but if you want to see your order or create any request, please access to myaccount.",
      screenshot: '/emails/orders/order-confirmed.png',
    },
  },

  'order.quality_check.started': {
    whatsapp:
      "Good news! Your order is being processed 😀 Your device is being checked by our experts! As soon as they give us green light, we will ship the device to you! Estimated arrival time: “today + 2 WD” We will keep updating you during the process but if you want to track your order, you can always do it from here:",
    email: {
      subject: 'Good news! Your order is being processed 😀',
      body: "Your device is being checked by our experts! As soon as they give us green light, we will ship the device to you! Estimated arrival time: “today + 2 WD” We will keep updating you during the process but if you want to track your order, you can always do it from here:",
      screenshot: '/emails/orders/at-quality-check.png',
    },
  },

  'order.cancellation.revibe_initiated': {
    variantBy:'cancellationReason',
    variants: {
      item_unavailable: {
        whatsapp:
          "We are sorry! We are sorry to inform you that our seller couldn't ship the order and we have been forced to cancel it. The refund has been processed to your original payment method. Please note that it might take up to 7 days to reflect in your bank account depending in your personal bank. Please find a discount code that you can use in case you want to purchase a new device with us!",
        email: {
          subject: 'We are sorry!',
          body: "We are sorry to inform you that our seller couldn't ship the order and we have been forced to cancel it. The refund has been processed to your original payment method. Please note that it might take up to 7 days to reflect in your bank account depending in your personal bank. Please find a discount code that you can use in case you want to purchase a new device with us!",
          screenshot: '/emails/orders/we-are-sorry-not-available.png',
        },
      },
      price_error: {
        whatsapp:
          "We are sorry! We are sorry to inform you that your order had a pricing issue in our website and we have been forced to cancel the order. The refund has been processed to your original payment method. Please note that it might take up to 7 days to reflect in your bank account depending in your personal bank. Please find a discount code that you can use in case you want to purchase a new device with us!",
        email: {
          subject: 'We are sorry!',
          body: "We are sorry to inform you that your order had a pricing issue in our website and we have been forced to cancel the order. The refund has been processed to your original payment method. Please note that it might take up to 7 days to reflect in your bank account depending in your personal bank. Please find a discount code that you can use in case you want to purchase a new device with us!",
          screenshot: '/emails/orders/we-are-sorry-pricing.png',
        },
      },
      undeliverable_address: {
        whatsapp:
          "There was an issue with your shipping address! We are sorry to inform you that we canceled your order because our courier partner can’t deliver in your current address. The refund has been processed to your original payment method. Please note that it might take up to 7 days to reflect in your bank account depending in your personal bank. Please find a discount code that you can use in case you have another address where we can deliver and you want to purchase a new device with us!",
        email: {
          subject: 'There was an issue with your shipping address!',
          body: "We are sorry to inform you that we canceled your order because our courier partner can’t deliver in your current address. The refund has been processed to your original payment method. Please note that it might take up to 7 days to reflect in your bank account depending in your personal bank. Please find a discount code that you can use in case you have another address where we can deliver and you want to purchase a new device with us!",
          screenshot: '/emails/orders/we-are-sorry-remote-area.png',
        },
      },
    },
  },

  'order.cancellation.requested': {
    variantBy:'statusId',
    variants: {
      created: {
        status: 'missing',
        whatsapp:
          "Your refund is being processed!",
        email: {
          subject: 'Your refund is being processed!',
          body: "",
          screenshot: '/emails/orders/missing.png',
        },
      },
      quality_check: {
        whatsapp:
          "We received your cancellation request! We have successfully received your cancellation request and will do our best to cancel it. We cannot guarantee that cancellation will be accepted as our sellers might have already shipped the product. We will get back to you in the next 24 working hours. Estimated resolution date: “today () + 2 WD”",
        email: {
          subject: 'We received your cancellation request!',
          body: "We have successfully received your cancellation request and will do our best to cancel it. We cannot guarantee that cancellation will be accepted as our sellers might have already shipped the product. We will get back to you in the next 24 working hours. Estimated resolution date: “today () + 2 WD”",
          screenshot: '/emails/orders/to-be-canceled.png',
        },
      },
    },
  },

    'order.cancellation.declined': {
    whatsapp:
      "Your order is on the way! We are sorry to inform you that we couldn't cancel the order as our seller already shipped it! Remember that with Revibe you have 10 days return policy once you receive your device!",
    email: {
      subject: 'Your order is on the way!',
      body: "We are sorry to inform you that we couldn't cancel the order as our seller already shipped it! Remember that with Revibe you have 10 days return policy once you receive your device!",
      screenshot: '/emails/orders/already-shipped.png',
    },
  },

  // --- Cancellation + order refund (scaffold) -----------------------------
  // Not yet authored — add entries here as the cancellation journey's
  // notifications are defined. Available events:
  //   'order.cancellation.accepted'
  //   'order.cancellation.reverted'
  //   'order.refund.completed'
  //   'order.sla.breached'
  // Template:
  // 'order.cancellation.requested': {
  //   whatsapp: '…',
  //   email: { subject: '…', body: '…', screenshot: '/emails/orders/cancellation-requested.png' },
  // },
}
