// Estimated Delivery Date + SLA messaging — direct port of the Python
// reference at brief/edd.py (which itself translates EDD_FINAL.xlsx). Kept
// pure (no React) so the sandbox hook and any future production wiring can
// share it.
//
// Three markets:
//   Market  EDD: working days  EDD: today buffer  Min cal days       Weekend
//           (OC/QC)            (cal days)         post-ship
//   UAE     3                  2                  1                  Sat+Sun
//   ZA      5                  5                  1 or 4 (MAX)       Sat+Sun
//   SA      7                  6                  1 or 4 (MAX)       Fri+Sat
//
// Stage SLAs (calendar days; stage is LATE when elapsed > SLA):
//          Order created   QC   Shipped
//   UAE    2               2    2
//   ZA     2               2    5
//   SA     2               2    6
//
// Dates flowing in/out are JS Date objects. All comparisons use whole-day
// arithmetic — the time-of-day component of any input is ignored. Today is
// caller-supplied so the sandbox can scrub freely without touching the
// system clock.

export const MARKETS = {
  UAE: {
    name: 'UAE',
    ocqcWorkingDays: 3,
    ocqcTodayBuffer: 2,
    shipMinBuffer: 0,
    shipTodayBuffer: 1,
    weekend: [5, 6], // Sat, Sun
    slaOrderCreated: 2,
    slaQc: 2,
    slaShipped: 2,
  },
  ZA: {
    name: 'ZA',
    ocqcWorkingDays: 5,
    ocqcTodayBuffer: 5,
    shipMinBuffer: 4,
    shipTodayBuffer: 1,
    weekend: [5, 6],
    slaOrderCreated: 2,
    slaQc: 2,
    slaShipped: 5,
  },
  SA: {
    name: 'SA',
    ocqcWorkingDays: 7,
    ocqcTodayBuffer: 6,
    shipMinBuffer: 4,
    shipTodayBuffer: 1,
    weekend: [4, 5], // Fri, Sat
    slaOrderCreated: 2,
    slaQc: 2,
    slaShipped: 6,
  },
}

export const STAGE_ORDER_CREATED = 'Order created'
export const STAGE_QC = 'QC'
export const STAGE_SHIPPED = 'Shipped'

export const SLA_ON_TIME = 'on_time'
export const SLA_LATE = 'late'

// Customer-facing message strings — centralised so future copy edits don't
// require touching the resolution logic.
export const MSG_ORDER_ON_TIME = 'Order received. Quality check will begin shortly.'
export const MSG_ORDER_LATE =
  "Your order is taking a little longer than usual to start. We're working to move your order forward."
export const MSG_QC_ON_TIME = "Your order is in quality check. We'll ship it shortly."
export const MSG_QC_BACK_ON_TRACK =
  "We're back on track. Your order is in quality check and will ship it shortly."
export const MSG_QC_LATE =
  "Quality check is taking longer than usual. We're working to move your order forward."
export const MSG_SHIPPED_ON_TIME =
  'Good news. Your order is on its way and the courier will be in touch with delivery details.'
export const MSG_SHIPPED_LATE =
  "Your order has been shipped and is currently in transit, though delivery is taking a bit longer than usual. We're on it."
export const MSG_DELIVERED = 'Your order has been delivered. Enjoy your device!'

const DAY_MS = 24 * 60 * 60 * 1000

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function addDays(d, days) {
  const n = stripTime(d)
  n.setDate(n.getDate() + days)
  return n
}

function diffDays(a, b) {
  return Math.round((stripTime(a).getTime() - stripTime(b).getTime()) / DAY_MS)
}

// Excel WORKDAY.INTL equivalent — returns the date `days` working days
// after `start`, skipping `weekend` weekday numbers (Mon=0 .. Sun=6). The
// start date itself is NOT counted. Supports negative `days`.
export function workdayIntl(start, days, weekend) {
  if (days === 0) return stripTime(start)
  const step = days > 0 ? 1 : -1
  let remaining = Math.abs(days)
  let cur = stripTime(start)
  const weekendSet = new Set(weekend)
  while (remaining > 0) {
    cur = addDays(cur, step)
    // JS getDay(): Sun=0..Sat=6. Python weekday(): Mon=0..Sun=6.
    // Convert getDay -> python weekday so the MARKETS config can stay
    // Python-flavoured (Sat=5, Sun=6 etc.).
    const pyDow = (cur.getDay() + 6) % 7
    if (!weekendSet.has(pyDow)) remaining -= 1
  }
  return cur
}

export function currentStage(orderDate, qcDate, shippedDate) {
  if (shippedDate) return STAGE_SHIPPED
  if (qcDate) return STAGE_QC
  if (orderDate) return STAGE_ORDER_CREATED
  return null
}

// qcDate is informational — the Excel model only branches on shipped/not.
export function calculateEdd(market, today, orderDate, qcDate, shippedDate) {
  const cfg = MARKETS[market]
  if (!cfg) throw new Error(`Unknown market: ${market}`)

  if (shippedDate) {
    let edd = addDays(
      today.getTime() > shippedDate.getTime() ? today : shippedDate,
      cfg.shipTodayBuffer,
    )
    if (cfg.shipMinBuffer > 0) {
      const min = addDays(shippedDate, cfg.shipMinBuffer)
      if (min.getTime() > edd.getTime()) edd = min
    }
    return edd
  }

  const workdayTarget = workdayIntl(orderDate, cfg.ocqcWorkingDays, cfg.weekend)
  if (stripTime(today).getTime() > workdayTarget.getTime()) {
    return addDays(today, cfg.ocqcTodayBuffer)
  }
  return workdayTarget
}

function slaFor(cfg, stage) {
  if (stage === STAGE_ORDER_CREATED) return cfg.slaOrderCreated
  if (stage === STAGE_QC) return cfg.slaQc
  if (stage === STAGE_SHIPPED) return cfg.slaShipped
  return 0
}

function slaStatus(elapsed, sla) {
  return elapsed > sla ? SLA_LATE : SLA_ON_TIME
}

// Message key + body. The sandbox UI uses the key to derive a lead phrase
// and tone; production wiring would consume either field directly.
export function buildCustomerMessage(stage, currentSlaStatus, previousSlaStatus) {
  if (stage === STAGE_ORDER_CREATED) {
    return currentSlaStatus === SLA_ON_TIME
      ? { key: 'order_on_time', body: MSG_ORDER_ON_TIME }
      : { key: 'order_late', body: MSG_ORDER_LATE }
  }
  if (stage === STAGE_QC) {
    if (currentSlaStatus === SLA_LATE) return { key: 'qc_late', body: MSG_QC_LATE }
    if (previousSlaStatus === SLA_LATE)
      return { key: 'qc_back_on_track', body: MSG_QC_BACK_ON_TRACK }
    return { key: 'qc_on_time', body: MSG_QC_ON_TIME }
  }
  if (stage === STAGE_SHIPPED) {
    return currentSlaStatus === SLA_ON_TIME
      ? { key: 'shipped_on_time', body: MSG_SHIPPED_ON_TIME }
      : { key: 'shipped_late', body: MSG_SHIPPED_LATE }
  }
  return { key: 'unknown', body: '' }
}

// Full status for an order. Stage timing (calendar days):
//   Order Created stage: orderDate    → qcDate (or today if not yet QC'd)
//   QC stage:            qcDate       → shippedDate (or today if not yet shipped)
//   Shipped stage:       shippedDate  → today
export function orderStatus(market, today, orderDate, qcDate, shippedDate) {
  const cfg = MARKETS[market]
  if (!cfg) throw new Error(`Unknown market: ${market}`)

  let current
  let currentStart
  let prevName = null
  let prevStart = null
  let prevEnd = null

  if (shippedDate) {
    current = STAGE_SHIPPED
    currentStart = shippedDate
    prevName = STAGE_QC
    // qcDate may be blank even though shipped is set — treat QC as
    // instantaneous at shippedDate in that case so the prev-stage
    // calculation has finite endpoints.
    prevStart = qcDate ?? shippedDate
    prevEnd = shippedDate
  } else if (qcDate) {
    current = STAGE_QC
    currentStart = qcDate
    prevName = STAGE_ORDER_CREATED
    prevStart = orderDate
    prevEnd = qcDate
  } else {
    current = STAGE_ORDER_CREATED
    currentStart = orderDate
  }

  const currentElapsed = Math.max(0, diffDays(today, currentStart))
  const currentStatus = slaStatus(currentElapsed, slaFor(cfg, current))

  let prevElapsed = null
  let prevStatus = null
  if (prevName) {
    prevElapsed = Math.max(0, diffDays(prevEnd, prevStart))
    prevStatus = slaStatus(prevElapsed, slaFor(cfg, prevName))
  }

  const message = buildCustomerMessage(current, currentStatus, prevStatus)
  const deliveryBy = calculateEdd(market, today, orderDate, qcDate, shippedDate)
  // The "raw" workday target from the order date alone — what the customer
  // would have seen at checkout, before the today-buffer kicks in if the
  // stage runs late. Always the OC/QC workday math; doesn't depend on
  // shipped/QC progression.
  const initialPromise = workdayIntl(orderDate, cfg.ocqcWorkingDays, cfg.weekend)

  return {
    currentStage: current,
    currentStageElapsedDays: currentElapsed,
    currentStageSlaStatus: currentStatus,
    previousStage: prevName,
    previousStageElapsedDays: prevElapsed,
    previousStageSlaStatus: prevStatus,
    customerMessage: message,
    deliveryBy,
    initialPromise,
  }
}
