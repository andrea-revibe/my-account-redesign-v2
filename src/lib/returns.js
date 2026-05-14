// Single source of truth for the change-of-mind returns flow.
// Eligibility rules, refund math, formatting helpers.

export const RETURN_WINDOW_DAYS = 10
export const RESTOCKING_FEE_RATE = 0.10

const MS_PER_DAY = 24 * 60 * 60 * 1000

function parsePlacedAtDate(s) {
  if (!s) return null
  const [datePart, timePart, ampm] = s.split(' ')
  const [d, m, y] = datePart.split('/').map(Number)
  let [hh, mm] = (timePart || '00:00').split(':').map(Number)
  if (ampm === 'PM' && hh !== 12) hh += 12
  if (ampm === 'AM' && hh === 12) hh = 0
  return new Date(y, m - 1, d, hh, mm)
}

function deliveryDateOf(order) {
  if (order.deliveredOn) return new Date(order.deliveredOn + 'T00:00:00')
  // Fallback: best-effort parse from timeline string like "8 May · 3:14 PM"
  // by using the year from placedAt.
  if (order.timeline?.delivered) {
    const placed = parsePlacedAtDate(order.placedAt)
    const year = placed ? placed.getFullYear() : new Date().getFullYear()
    const dt = new Date(`${order.timeline.delivered.split(' · ')[0]}, ${year}`)
    if (!Number.isNaN(dt.getTime())) return dt
  }
  return null
}

export function addDays(date, days) {
  return new Date(date.getTime() + days * MS_PER_DAY)
}

export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export function eligibilityFor(order, today = new Date()) {
  if (order.state === 'cancelled') {
    if (order.cancellationStatusId === 'refunded') {
      return { eligible: false, reason: 'Already refunded' }
    }
    return { eligible: false, reason: 'Cancelled before delivery' }
  }
  if (order.statusId !== 'delivered') {
    return { eligible: false, reason: 'Not yet delivered' }
  }
  const delivered = deliveryDateOf(order)
  if (!delivered) {
    return { eligible: false, reason: 'Delivery date unknown' }
  }
  const deadline = addDays(startOfDay(delivered), RETURN_WINDOW_DAYS)
  const now = startOfDay(today)
  if (now > deadline) {
    return { eligible: false, reason: 'Delivered more than 10 days ago' }
  }
  if (order.returnedAt) {
    return { eligible: false, reason: 'Already returned' }
  }
  return { eligible: true, untilDate: deadline }
}

export function groupOrdersByEligibility(orders, today = new Date()) {
  const eligible = []
  const ineligible = []
  for (const order of orders) {
    const elig = eligibilityFor(order, today)
    if (elig.eligible) {
      eligible.push({ order, ...elig })
    } else {
      ineligible.push({ order, ...elig })
    }
  }
  return { eligible, ineligible }
}

export function refundBreakdown(order, units, method) {
  const u = Math.max(1, Math.min(units, order.quantity || 1))
  const unitPrice = order.unitPrice ?? order.subtotal ?? order.total
  const itemTotal = unitPrice * u
  const warranty = order.warranty ?? 0
  const gross = itemTotal + warranty
  if (method === 'wallet') {
    return { itemTotal, warranty, gross, fee: 0, net: gross, rate: 0 }
  }
  if (method === 'original') {
    const fee = Math.round(gross * RESTOCKING_FEE_RATE * 100) / 100
    const net = Math.round((gross - fee) * 100) / 100
    return { itemTotal, warranty, gross, fee, net, rate: RESTOCKING_FEE_RATE }
  }
  return { itemTotal, warranty, gross, fee: 0, net: gross, rate: 0 }
}

export function formatMoney(n) {
  if (n == null) return ''
  return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2)
}

export function formatLongDate(date) {
  if (!date) return ''
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

export function formatShortDate(date) {
  if (!date) return ''
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function generateClaimRef() {
  return 'IXipP8'
}
