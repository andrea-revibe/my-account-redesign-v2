// Customer notifications for the `shipment.*` domain — the outbound delivery
// leg (Revibe → customer). See orders.js for the entry format ({tokens} are
// filled from the live order; screenshots live under public/emails/shipment/).
//
// Intermediate logistics steps are intentionally SILENT — no entry for
// 'shipment.cleared_customs' or 'shipment.forwarded_to_agent', so the panel
// shows "No notification sent at this step." Add them here only if Revibe
// decides to message on those.
export const SHIPMENT_NOTIFICATIONS = {
  'shipment.arrived_destination': {
    whatsapp:
      "📦 Your Revibe order has shipped via DHL Express and arrived in your country. Track it: tracking no. {trackingNumber}. We'll ping you when it's out for delivery.",
    email: {
      subject: 'Your order is on its way 📦',
      body: 'Great news — your Revibe order has shipped via DHL Express and arrived in your destination country. Follow its progress with tracking number {trackingNumber}.',
      screenshot: '/emails/shipment/shipped.png',
    },
  },

  'shipment.out_for_delivery': {
    whatsapp:
      "🚚 Your Revibe order is out for delivery today! Make sure someone's available to receive it.",
    email: {
      subject: 'Out for delivery today',
      body: 'Your Revibe order is out for delivery and should arrive today. Please make sure someone is available to receive the package.',
      screenshot: '/emails/shipment/out-for-delivery.png',
    },
  },

  'shipment.delivered': {
    whatsapp:
      '✅ Delivered! Your Revibe order has arrived. We hope you love it 💚 Something not right? Raise a claim anytime from My Account.',
    email: {
      subject: 'Your order has been delivered ✅',
      body: "Your Revibe order was delivered on {deliveredOnLong}. We hope you love your device! If anything isn't right, you can raise a claim from My Account within your return window.",
      screenshot: '/emails/shipment/delivered.png',
    },
  },
}
