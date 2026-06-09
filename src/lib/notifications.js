// Notification rendering logic. The customer-facing COPY lives in
// src/data/notifications/* (split per `event.*` domain — orders / shipment /
// claims) and is merged into NOTIFICATIONS there; this module only resolves an
// event to its message and fills {tokens} from the live order.
//
// `notificationFor(event, order)` returns { status, whatsapp, email: { subject,
// body, screenshot } } with tokens interpolated. `whatsapp`/`email` are null
// when no copy exists for the event; `status` always resolves (see
// `notificationStatus`). Keying by `event` (not node id) means one event reuses
// the same copy across journeys.
import { NOTIFICATIONS } from '../data/notifications'
import { claimRequiresProof } from './claims'

export { NOTIFICATIONS }

// Coverage metadata — how each step's comm relates to our existing comms:
//   live    copy exists, unchanged from production
//   new     brand-new comm, not sent today
//   changed copy exists in prod but we're revising the wording
//   missing a gap — a comm should exist here but isn't authored (opt-in marker)
//   silent  intentional no-comm (logistics steps) — the default for any event
//           with no NOTIFICATIONS entry
// Convention: tag every authored entry with `status`; an untagged entry still
// resolves to `live`. A gap is flagged with a bare `{ status: 'missing' }`
// entry (no whatsapp/email).
export const NOTIFICATION_STATUSES = ['live', 'new', 'changed', 'missing', 'silent']

// Replace {token} with order[token]. Unknown tokens collapse to '' so raw
// braces never reach the UI. Copy with no tokens passes through untouched.
function interpolate(str, order) {
  if (typeof str !== 'string') return str
  return str.replace(/\{(\w+)\}/g, (_, key) => order?.[key] ?? '')
}

// Resolve an event to its coverage status. Order-independent: `status` lives on
// the keyed entry (alongside `variants`, not inside them), so picking a variant
// is unnecessary here. Unknown event → 'silent'; otherwise `entry.status` or
// the 'live' default.
export function notificationStatus(event) {
  const raw = NOTIFICATIONS[event]
  if (!raw) return 'silent'
  return raw.status ?? 'live'
}

export function notificationFor(event, order) {
  const raw = NOTIFICATIONS[event]
  const status = notificationStatus(event)
  if (!raw) return { status, whatsapp: null, email: null }
  // A few events (today only `claim.created`) carry per-claim-type variants:
  // proof claims go into review, change-of-mind jumps to pickup. All other
  // events resolve straight to their single copy.
  const entry = raw.variants
    ? raw.variants[claimRequiresProof(order?.claim) ? 'proof' : 'no_proof']
    : raw
  if (!entry || (!entry.whatsapp && !entry.email)) {
    return { status, whatsapp: null, email: null }
  }
  return {
    status,
    whatsapp: interpolate(entry.whatsapp, order),
    email: entry.email && {
      subject: interpolate(entry.email.subject, order),
      body: interpolate(entry.email.body, order),
      screenshot: entry.email.screenshot,
    },
  }
}

// Journey-wide coverage roll-up: counts DISTINCT events across all nodes that
// carry an `event` (so the same comm on two branches counts once; eventless
// nodes are excluded). Returns counts keyed by status. Flip the `seen` dedupe
// to count per-node if you'd rather measure steps than distinct comms.
export function journeyNotificationCoverage(nodes) {
  const seen = new Set()
  const counts = { live: 0, new: 0, changed: 0, missing: 0, silent: 0 }
  for (const node of nodes ?? []) {
    if (!node?.event || seen.has(node.event)) continue
    seen.add(node.event)
    counts[notificationStatus(node.event)] += 1
  }
  return counts
}
