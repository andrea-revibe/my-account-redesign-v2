// Single source of truth for the change-of-mind returns flow.
// Eligibility rules, refund math, formatting helpers.

export const RETURN_WINDOW_DAYS = 10
export const RESTOCKING_FEE_RATE = 0.10
// Card processing fee re-applied when a customer cancellation refunds to the
// original card instead of the Wallet. Mirrors RESTOCKING_FEE_RATE: the
// Wallet path waives it, the card path incurs it. Shared by CancelOrderSheet
// (the cancel-time choice) and lib/wallet.js (the move-credit-to-card flow).
export const CANCELLATION_FEE_RATE = 0.05
// Flat Wallet bonus paid when the customer accepts store credit on an
// issue (faulty product) claim. Acts as the equivalent of the
// change-of-mind "fee waived on Wallet" — incentivises store credit.
export const ISSUE_WALLET_BONUS = 100

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

// `claimType` controls the fee + bonus rules:
//   change_of_mind: Wallet 100%, Card −10% restocking fee.
//   issue:          Wallet 100% + flat AED 100 bonus, Card 100% (no fee).
// Defaults to change_of_mind so existing callers keep working.
export function refundBreakdown(order, units, method, claimType = 'change_of_mind') {
  const u = Math.max(1, Math.min(units, order.quantity || 1))
  const unitPrice = order.unitPrice ?? order.subtotal ?? order.total
  const itemTotal = unitPrice * u
  const warranty = order.warranty ?? 0
  const gross = itemTotal + warranty
  const isIssue = claimType === 'issue'
  if (method === 'wallet') {
    const bonus = isIssue ? ISSUE_WALLET_BONUS : 0
    return {
      itemTotal,
      warranty,
      gross,
      fee: 0,
      bonus,
      net: gross + bonus,
      rate: 0,
    }
  }
  if (method === 'original') {
    if (isIssue) {
      return {
        itemTotal,
        warranty,
        gross,
        fee: 0,
        bonus: 0,
        net: gross,
        rate: 0,
      }
    }
    const fee = Math.round(gross * RESTOCKING_FEE_RATE * 100) / 100
    const net = Math.round((gross - fee) * 100) / 100
    return {
      itemTotal,
      warranty,
      gross,
      fee,
      bonus: 0,
      net,
      rate: RESTOCKING_FEE_RATE,
    }
  }
  return { itemTotal, warranty, gross, fee: 0, bonus: 0, net: gross, rate: 0 }
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

// ----- Battery health (§7.2 Battery Standards) --------------------------
// A refurbished grade guarantees a minimum battery capacity at delivery.
// "Very good" isn't in the current catalog but is kept for completeness;
// "Fair" has no published battery floor, so it's treated as Good (85%).
export const BATTERY_BASELINE_BY_GRADE = {
  excellent: 95,
  'very good': 90,
  good: 85,
  fair: 85,
}

// Condition grade is the last `·`-separated segment of product.variant,
// e.g. "Midnight · 128 GB · Good" → "good".
export function conditionGradeOf(order) {
  const variant = order?.product?.variant
  if (!variant) return null
  const seg = variant.split('·').pop()?.trim().toLowerCase()
  return seg || null
}

export function batteryBaselineFor(order) {
  const grade = conditionGradeOf(order)
  return grade ? BATTERY_BASELINE_BY_GRADE[grade] ?? null : null
}

function addMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

export function daysSinceDelivery(order, today = new Date()) {
  const delivered = deliveryDateOf(order)
  if (!delivered) return null
  return Math.floor((startOfDay(today) - startOfDay(delivered)) / MS_PER_DAY)
}

// §7.2 remedies, evaluated most-favourable-first. A "non-original
// battery/part" message is a full-refund trigger on its own (capacity is
// irrelevant). Otherwise the remedy depends on how far the battery has
// degraded below its guaranteed floor (degradation = baseline − reported)
// and how long ago the device was delivered:
//   > 3% within 10 days   → full refund
//   > 10% within 6 months → free battery replacement
//   > 20% within 12 months → free battery replacement
//   else                  → normal wear, not a covered defect
// Returns `remedy: null` when there's nothing to assess yet (no capacity
// entered and the non-original toggle is off).
export function assessBattery({ order, capacity, nonOriginal = false, today = new Date() }) {
  const baseline = batteryBaselineFor(order)
  const delivered = deliveryDateOf(order)
  const days = daysSinceDelivery(order, today)
  const cap = Number(capacity)
  const hasCapacity =
    capacity !== '' &&
    capacity != null &&
    !Number.isNaN(cap) &&
    cap > 0 &&
    cap <= 100

  if (nonOriginal) {
    return {
      baseline,
      days,
      capacity: hasCapacity ? cap : null,
      degradation:
        hasCapacity && baseline != null ? Math.max(0, baseline - cap) : null,
      remedy: 'refund',
      reason: 'non_original',
    }
  }

  if (!hasCapacity || baseline == null || !delivered) {
    return {
      baseline,
      days,
      capacity: hasCapacity ? cap : null,
      degradation: null,
      remedy: null,
      reason: null,
    }
  }

  const degradation = Math.max(0, baseline - cap)
  const now = startOfDay(today)
  const from = startOfDay(delivered)
  const within10Days = now <= addDays(from, 10)
  const within6Months = now <= addMonths(from, 6)
  const within12Months = now <= addMonths(from, 12)

  let remedy = 'none'
  let reason = 'normal_wear'
  if (within10Days && degradation > 3) {
    remedy = 'refund'
    reason = 'refund_10d'
  } else if (within6Months && degradation > 10) {
    remedy = 'replacement'
    reason = 'replacement_6m'
  } else if (within12Months && degradation > 20) {
    remedy = 'replacement'
    reason = 'replacement_12m'
  }

  return { baseline, days, capacity: cap, degradation, remedy, reason }
}
