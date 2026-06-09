// Notification rendering logic. The customer-facing COPY lives in
// src/data/notifications/* (split per `event.*` domain — orders / shipment /
// claims) and is merged into NOTIFICATIONS there; this module only resolves an
// event to its message and fills {tokens} from the live order.
//
// `notificationFor(event, order)` returns { whatsapp, email: { subject, body,
// screenshot } } with tokens interpolated, or null when no message is defined
// for that event (the panel then shows an empty state). Keying by `event` (not
// node id) means one event reuses the same copy across journeys.
import { NOTIFICATIONS } from '../data/notifications'

export { NOTIFICATIONS }

// Replace {token} with order[token]. Unknown tokens collapse to '' so raw
// braces never reach the UI. Copy with no tokens passes through untouched.
function interpolate(str, order) {
  if (typeof str !== 'string') return str
  return str.replace(/\{(\w+)\}/g, (_, key) => order?.[key] ?? '')
}

export function notificationFor(event, order) {
  const entry = NOTIFICATIONS[event]
  if (!entry) return null
  return {
    whatsapp: interpolate(entry.whatsapp, order),
    email: entry.email && {
      subject: interpolate(entry.email.subject, order),
      body: interpolate(entry.email.body, order),
      screenshot: entry.email.screenshot,
    },
  }
}
