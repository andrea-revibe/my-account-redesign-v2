// Estimated Resolution Date (ERD) for claims — direct port of
// claims_ERD_model_v2.xlsx (sheets UAE / ZA / SA). Sibling to lib/edd.js,
// which does the same job for order delivery: same WORKDAY.INTL machinery
// (reused via `workdayIntl`), same "roll forward from today when the stage
// runs overdue" rule. Two differences that shape everything downstream:
//
//   1. The output is a WINDOW, not a date. `earliest` assumes the claim is
//      never escalated to expert revision; `latest` reserves that step. The
//      two collapse to a single date once a decision lands.
//   2. It ends at the VERDICT. Everything after it (refund_issued →
//      refund_credited, under_repair → ship_back → device_returned) is
//      outside this model — the cards hand off to their existing surfaces.
//
// Both bounds roll off the SAME trigger (the *earliest* baseline), which is
// what stops `latest` landing before `earliest`; the MAX() guard on `latest`
// is the model's own belt-and-braces. Kept pure (no React) so the cards, the
// sandbox hook and any future production wiring share one implementation.
//
// Known gaps, inherited from the spreadsheet and called out in its notes:
// collection is treated as instant (so the window rebases *later*, not
// earlier, at pickup), and there is no holiday calendar (Eid / public
// holidays will shift real ERDs).

import { workdayIntl } from './edd'
import { orderAsOf } from './returns'

// Working-day levers per market. Keyed on the app's country codes
// (lib/countries.js), not the spreadsheet's sheet names. `Others` has no
// sheet of its own — it inherits SA, the most conservative set.
//
// Still placeholders — ops to revise, exactly as the source spreadsheet says
// of its own column. Two have already been tuned away from it: `slaQc` (sheet
// 3 → 4) and `slaReadyForRefund` (sheet's "Decision", 2 → 1). Neither is
// measured yet. Note they cancel out — every bound depends on the two summed,
// and 3+2 = 4+1 — so only the expert-revision tail moved (one day tighter).
//
// `slaReadyForRefund` is the spreadsheet's Decision lever under a name that
// says what the wait is for. The *stage* it leads to is still `ERD_DECIDED`:
// a warranty verdict sends the device to repair, and no money moves, so the
// stage stays type-agnostic even though the lever reads refund-first.
export const CLAIM_MARKETS = {
  AE: {
    name: 'UAE',
    slaTransit: 2,
    slaQc: 4,
    slaReadyForRefund: 1,
    expertExtra: 3,
    overduePad: 0,
    weekend: [5, 6], // Sat, Sun
  },
  ZA: {
    name: 'ZA',
    slaTransit: 4,
    slaQc: 4,
    slaReadyForRefund: 1,
    expertExtra: 3,
    overduePad: 0,
    weekend: [5, 6],
  },
  SA: {
    name: 'SA',
    slaTransit: 5,
    slaQc: 4,
    slaReadyForRefund: 1,
    expertExtra: 3,
    overduePad: 0,
    weekend: [4, 5], // Fri, Sat
  },
  Others: {
    name: 'Others',
    slaTransit: 5,
    slaQc: 4,
    slaReadyForRefund: 1,
    expertExtra: 3,
    overduePad: 0,
    weekend: [4, 5],
  },
}

export const DEFAULT_CLAIM_MARKET = 'AE'

// Stage ids. `awaiting_review` is the no-transit sibling of
// `awaiting_collection`: a compensation claim keeps the device, so it never
// waits for a courier — it waits for a reviewer.
export const ERD_PRE_COLLECTION = 'pre_collection'
export const ERD_AWAITING_COLLECTION = 'awaiting_collection'
export const ERD_AWAITING_REVIEW = 'awaiting_review'
export const ERD_IN_TRANSIT = 'in_transit'
export const ERD_QUALITY_CHECK = 'quality_check'
export const ERD_EXPERT_REVISION = 'expert_revision'
export const ERD_DECIDED = 'decided'

export const ERD_STAGE_LABELS = {
  [ERD_PRE_COLLECTION]: 'Checking your documents',
  [ERD_AWAITING_COLLECTION]: 'Awaiting collection',
  [ERD_AWAITING_REVIEW]: 'Awaiting review',
  [ERD_IN_TRANSIT]: 'On its way to us',
  [ERD_QUALITY_CHECK]: 'Quality check',
  [ERD_EXPERT_REVISION]: 'Expert revision',
  [ERD_DECIDED]: 'Decided',
}

const DAY_MS = 24 * 60 * 60 * 1000

// Accepts an ISO `YYYY-MM-DD` string or a Date. Parsed at noon so a DST
// shift can't roll the day backwards — same convention as `orderAsOf` in
// lib/returns.js.
export function toErdDate(value) {
  if (!value) return null
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const d = new Date(`${value}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function stripTime(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function isAfterDay(a, b) {
  return stripTime(a).getTime() > stripTime(b).getTime()
}

function laterOf(a, b) {
  return stripTime(a).getTime() >= stripTime(b).getTime() ? a : b
}

// Excel NETWORKDAYS.INTL — working days between two dates, both endpoints
// inclusive. Only used for the informational "working days from clock start"
// readout (B23), which subtracts 1 so the start day isn't double-counted.
export function networkdaysIntl(start, end, weekend) {
  let cur = stripTime(start)
  const last = stripTime(end)
  if (cur.getTime() > last.getTime()) return 0
  const weekendSet = new Set(weekend)
  let count = 0
  while (cur.getTime() <= last.getTime()) {
    const pyDow = (cur.getDay() + 6) % 7
    if (!weekendSet.has(pyDow)) count += 1
    cur = new Date(cur.getTime() + DAY_MS)
  }
  return count
}

export function marketConfig(country) {
  return CLAIM_MARKETS[country] || CLAIM_MARKETS[DEFAULT_CLAIM_MARKET]
}

// Which stage the claim is in. Straight port of B19's precedence ladder,
// with the compensation fork: no `transit` means no courier leg, so
// `pickedUpAt` is ignored and the post-docs stage is `awaiting_review`.
export function claimErdStage(milestones, { transit = true } = {}) {
  const m = milestones || {}
  if (m.decidedAt) return ERD_DECIDED
  if (m.expertRevisionAt) return ERD_EXPERT_REVISION
  if (m.qcAt) return ERD_QUALITY_CHECK
  if (transit && m.pickedUpAt) return ERD_IN_TRANSIT
  if (m.docsClearedAt) return transit ? ERD_AWAITING_COLLECTION : ERD_AWAITING_REVIEW
  return ERD_PRE_COLLECTION
}

// The milestone each stage is waiting on — what "assume the current step
// completes today" would fill in. The two QC stages map to nothing on purpose:
// the step they're waiting on is the *verdict*, and assuming that lands today
// resolves to "you have your answer today", which is an assertion rather than
// an estimate.
const OUTSTANDING_MILESTONE = {
  [ERD_PRE_COLLECTION]: 'docsClearedAt',
  [ERD_AWAITING_COLLECTION]: 'pickedUpAt',
  [ERD_AWAITING_REVIEW]: 'qcAt',
  [ERD_IN_TRANSIT]: 'qcAt',
  [ERD_QUALITY_CHECK]: null,
  [ERD_EXPERT_REVISION]: null,
}

// Remaining working days from the stage's own anchor (columns E/F rows
// 11–13 + 26) and the overdue-roll buffers measured from today (rows 22–24
// + 29). `low` = no escalation, `high` = escalation reserved.
function boundsFor(cfg, stage, transit) {
  const T = transit ? cfg.slaTransit : 0
  const { slaQc: Q, slaReadyForRefund: D, expertExtra: X, overduePad: P } = cfg
  switch (stage) {
    case ERD_AWAITING_COLLECTION:
    case ERD_AWAITING_REVIEW:
      return {
        low: T + Q + D,
        high: T + Q + D + X,
        rollLow: T + Q + D + P,
        rollHigh: T + Q + D + X + P,
      }
    // Collection is treated as instant upstream, so the transit SLA runs
    // again in full from the pickup date rather than being netted off.
    case ERD_IN_TRANSIT:
      return {
        low: T + Q + D,
        high: T + Q + D + X,
        rollLow: Q + D + P,
        rollHigh: Q + D + X + P,
      }
    case ERD_QUALITY_CHECK:
      return { low: Q + D, high: Q + D + X, rollLow: D + P, rollHigh: D + X + P }
    // Escalation is sequential: the clock re-anchors on the expert-revision
    // date, so both bounds are the same and time already spent in QC no
    // longer distorts the estimate.
    case ERD_EXPERT_REVISION:
      return { low: X + D, high: X + D, rollLow: D + P, rollHigh: D + P }
    default:
      return null
  }
}

function anchorFor(m, stage) {
  switch (stage) {
    case ERD_AWAITING_COLLECTION:
    case ERD_AWAITING_REVIEW:
      return toErdDate(m.docsClearedAt)
    case ERD_IN_TRANSIT:
      return toErdDate(m.pickedUpAt)
    case ERD_QUALITY_CHECK:
      return toErdDate(m.qcAt)
    case ERD_EXPERT_REVISION:
      return toErdDate(m.expertRevisionAt)
    default:
      return null
  }
}

// The model's whole output for one claim. `pending` is the spreadsheet's
// "Pending - starts after docs cleared" — there is no date to show until the
// clock starts.
//
// `assume` controls whether an outstanding milestone is stood in for by today,
// i.e. "assuming this step completes today, here's your resolution date":
//
//   'never'        the spreadsheet's own behaviour — no anchor means pending.
//   'when_pending' substitute only when there'd otherwise be no date at all.
//                  What the cards use: it fills the one gap without touching
//                  any stage that already has a real anchor.
//   'always'       substitute at every stage that has an outstanding milestone.
//                  The sandbox's what-if toggle. Deliberately NOT used on
//                  cards: at awaiting-collection it makes the promise slide a
//                  day later for every day the courier hasn't come, which the
//                  overdue roll already handles properly at the SLA boundary.
//
// Either way the reported `stage` is the real one — only the date is
// hypothetical, so a card's headline and timeline keep saying where the device
// actually is. `assumed` names the substituted milestone, or is null.
export function claimErd(
  country,
  today,
  milestones,
  { transit = true, assume = 'never' } = {},
) {
  const cfg = marketConfig(country)
  const m = milestones || {}
  const now = toErdDate(today) || new Date()
  const stage = claimErdStage(m, { transit })

  if (stage === ERD_DECIDED) {
    const decided = toErdDate(m.decidedAt)
    return {
      stage,
      market: cfg.name,
      pending: false,
      assumed: null,
      earliest: decided,
      latest: decided,
      isRange: false,
      overdue: false,
      workingDays: workingDaysFrom(cfg, m, decided),
    }
  }

  const outstanding = OUTSTANDING_MILESTONE[stage]
  const substitute =
    Boolean(outstanding) &&
    (assume === 'always' ||
      (assume === 'when_pending' && !anchorFor(m, stage)))
  const effective = substitute ? { ...m, [outstanding]: now } : m
  const assumed = substitute ? outstanding : null
  // Bounds and anchor come from the stage the *effective* milestones imply
  // (substituting a pickup date moves the maths onto the in-transit row);
  // `stage` above stays the reported one.
  const evalStage = substitute ? claimErdStage(effective, { transit }) : stage

  const bounds = boundsFor(cfg, evalStage, transit)
  const anchor = anchorFor(effective, evalStage)
  if (!bounds || !anchor) {
    return {
      stage,
      market: cfg.name,
      pending: true,
      assumed: null,
      earliest: null,
      latest: null,
      isRange: false,
      overdue: false,
      workingDays: null,
    }
  }

  const baseLow = workdayIntl(anchor, bounds.low, cfg.weekend)
  const baseHigh = workdayIntl(anchor, bounds.high, cfg.weekend)
  // Both bounds test against the LOW baseline so `latest` can never roll
  // while `earliest` stays put (and therefore can never land before it).
  const overdue = isAfterDay(now, baseLow)
  const earliest = overdue ? workdayIntl(now, bounds.rollLow, cfg.weekend) : baseLow
  const rolledHigh = overdue ? workdayIntl(now, bounds.rollHigh, cfg.weekend) : baseHigh
  const latest = laterOf(rolledHigh, earliest)

  return {
    stage,
    market: cfg.name,
    pending: false,
    assumed,
    earliest,
    latest,
    isRange: stripTime(earliest).getTime() !== stripTime(latest).getTime(),
    overdue,
    workingDays: workingDaysFrom(cfg, effective, latest),
  }
}

// B23 — working days from the clock start (docs cleared) to the latest
// bound. Informational; surfaced in the sandbox debug strip.
function workingDaysFrom(cfg, m, end) {
  const start = toErdDate(m.docsClearedAt)
  if (!start || !end) return null
  return Math.max(0, networkdaysIntl(start, end, cfg.weekend) - 1)
}

// ────────────────────────────────────────────────────────────────────────
// Presentation — window formatting
// ────────────────────────────────────────────────────────────────────────

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const WEEKDAYS_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

const EMPTY_FORMAT = { pending: true, isRange: false, label: null, short: null, long: null }

// A single date reads as a weekday promise ("Monday, 25 May"); a window drops
// the weekday, which is meaningless across a span, and tightens to one month
// name where both bounds share it ("20–25 May" vs "28 May – 2 June").
export function formatClaimErd(erd) {
  if (!erd || erd.pending || !erd.earliest || !erd.latest) return EMPTY_FORMAT
  const a = erd.earliest
  const b = erd.latest

  if (!erd.isRange) {
    return {
      pending: false,
      isRange: false,
      short: `${WEEKDAYS_SHORT[a.getDay()]}, ${a.getDate()} ${MONTHS_SHORT[a.getMonth()]}`,
      long: `${WEEKDAYS_LONG[a.getDay()]}, ${a.getDate()} ${MONTHS_LONG[a.getMonth()]}`,
      label: `${WEEKDAYS_LONG[a.getDay()]}, ${a.getDate()} ${MONTHS_LONG[a.getMonth()]}`,
    }
  }

  const sameMonth =
    a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()
  const short = sameMonth
    ? `${a.getDate()}–${b.getDate()} ${MONTHS_SHORT[b.getMonth()]}`
    : `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]} – ${b.getDate()} ${MONTHS_SHORT[b.getMonth()]}`
  const long = sameMonth
    ? `${a.getDate()}–${b.getDate()} ${MONTHS_LONG[b.getMonth()]}`
    : `${a.getDate()} ${MONTHS_LONG[a.getMonth()]} – ${b.getDate()} ${MONTHS_LONG[b.getMonth()]}`
  return { pending: false, isRange: true, short, long, label: long }
}

// ────────────────────────────────────────────────────────────────────────
// Presentation — stage copy
// ────────────────────────────────────────────────────────────────────────
//
// The "what's happening and why it takes this long" line under the date.
// Distinct from CLAIM_EXPLANATIONS in lib/claims.js: those define the claim
// *stage* for the Learn-more accordion, these explain the *estimate*.

export const CLAIM_ERD_EXPLANATIONS = {
  [ERD_PRE_COLLECTION]:
    "We're checking the photos and details you sent. Your resolution date appears here once they're cleared — usually within 2 working days.",
  [ERD_AWAITING_COLLECTION]:
    "We're arranging collection. Keep an eye out — the courier will contact you to confirm your pickup window.",
  [ERD_AWAITING_REVIEW]:
    "Your request is queued for review. You keep your device — there's nothing to send back.",
  [ERD_IN_TRANSIT]:
    'Your device is on its way to us. Inspection starts as soon as it reaches our hub.',
  [ERD_QUALITY_CHECK]:
    'Our team is inspecting your device. Most claims are decided within a few working days of arriving.',
  [ERD_EXPERT_REVISION]:
    "We've sent your device to our specialists for a closer look. That adds a few working days but gives us a firmer answer.",
  [ERD_DECIDED]: null,
}

// Compensation keeps the device, so any copy that talks about inspecting or
// shipping "your device" is simply wrong for it.
const COMPENSATION_ERD_EXPLANATIONS = {
  [ERD_QUALITY_CHECK]:
    'Our team is reviewing your request and the evidence you sent.',
  [ERD_EXPERT_REVISION]:
    "We've passed your request to our specialists for a closer look. That adds a few working days.",
}

// The claim analogue of edd.js's MSG_*_LATE strings: once a stage runs past
// its baseline the estimate silently rolls forward, and a date that moves
// without explanation reads as a broken promise. This is the explanation.
export const CLAIM_ERD_OVERDUE = {
  [ERD_AWAITING_COLLECTION]:
    "Collection is taking longer than usual. We've updated your estimate and we're chasing the courier.",
  [ERD_AWAITING_REVIEW]:
    "This review is taking longer than usual. We've updated your estimate and we're on it.",
  [ERD_IN_TRANSIT]:
    "Your device is taking longer than usual to reach us. We've updated your estimate and we're tracking it.",
  [ERD_QUALITY_CHECK]:
    "Inspection is taking longer than usual. We've updated your estimate and we're on it.",
  [ERD_EXPERT_REVISION]:
    "The expert review is taking longer than usual. We've updated your estimate.",
}

// When the date rests on an assumption rather than a milestone that actually
// landed, the copy names it — otherwise the estimate looks like a firm promise
// and its later movement looks like a broken one. Keyed by the substituted
// milestone, not the stage, because that is what the sentence is about.
export const CLAIM_ERD_ASSUMED = {
  docsClearedAt:
    "Based on your documents clearing today. We'll firm this up as soon as our team has checked them.",
  pickedUpAt:
    "Based on your device being collected today. We'll update this as soon as the courier scans it.",
  qcAt:
    "Based on your device reaching us today. We'll update this as soon as it arrives at our hub.",
}

export function claimErdExplanation(
  stage,
  { transit = true, overdue = false, assumed = null } = {},
) {
  // An assumed date is anchored on today, so it can't also be overdue — but
  // check it first anyway: naming the assumption is the more useful sentence.
  if (assumed && CLAIM_ERD_ASSUMED[assumed]) return CLAIM_ERD_ASSUMED[assumed]
  if (overdue && CLAIM_ERD_OVERDUE[stage]) return CLAIM_ERD_OVERDUE[stage]
  if (!transit && COMPENSATION_ERD_EXPLANATIONS[stage]) {
    return COMPENSATION_ERD_EXPLANATIONS[stage]
  }
  return CLAIM_ERD_EXPLANATIONS[stage] ?? null
}

// ────────────────────────────────────────────────────────────────────────
// Order/claim adapter — the one call the cards make
// ────────────────────────────────────────────────────────────────────────
//
// `claim.milestones` is the ISO clock the model runs on:
//
//   { createdAt, docsClearedAt, pickedUpAt, qcAt, expertRevisionAt,
//     decidedAt, asOf? }
//
// All optional, all `YYYY-MM-DD`. `docsClearedAt` is the clock start — the
// prototype stamps it at submit (proof review is folded into the SLA rather
// than modelled as its own gate), so a claim without it is one whose
// documents were rejected, or a mock with no milestones at all. `asOf` lets a
// hand-written mock carry its own "today" so a fixture dated last spring
// doesn't read as months overdue against the wall clock; journey replays get
// theirs from `order.asOfDate` instead. Readers must tolerate the whole block
// being `undefined` — most pre-existing mocks predate it.
//
// One sandbox-only extra rides here: `assumeToday` flips `claimErdFor` from
// `when_pending` to `always`, so the ERD sandbox's what-if toggle reaches the
// real card. Nothing outside `lib/claimErdSandbox.js` sets it.

// Gates where the clock is on the *customer*, not on Revibe: each has its own
// deadline on its own takeover card, and none of them is a lever in the
// model. `repairQuote` counts even once paid or declined — pricing the repair
// *is* the verdict, so the ERD's job is already done.
const ERD_SUPPRESSING_GATES = [
  'docsRejection',
  'awbFailure',
  'pickupFailure',
  'resetFailed',
  'invalidClaim',
  'repairQuote',
  'actionRequired',
]

// The model ends at the verdict. Every status past it belongs to a pipeline
// tail the cards already narrate (refund destination, repair window,
// ship-back tracking), so the strip stands down rather than competing.
const POST_VERDICT_STATUSES = [
  'refund_issued',
  'refund_credited',
  'under_repair',
  'ship_back',
  'device_returned',
]

// Compensation has no courier leg — the customer keeps the device — so the
// transit lever is dropped from its window.
export function claimErdTransit(claim) {
  return claim?.type !== 'compensation'
}

export function claimMilestones(order) {
  const claim = order?.claim
  if (!claim) return null
  const m = { ...(claim.milestones || {}) }
  // A live documents rejection un-starts the clock: until the customer
  // re-uploads and Quality accepts, the model has no date to give.
  if (claim.docsRejection) m.docsClearedAt = null
  return m
}

// Resolves the ERD for a card, or `null` when no estimate should be shown.
// Cards call this unconditionally and render the strip only on a truthy
// result — every suppression rule lives here rather than in card guards.
export function claimErdFor(order, today) {
  const claim = order?.claim
  if (!claim || claim.closure) return null
  if (ERD_SUPPRESSING_GATES.some((gate) => claim[gate])) return null
  if (POST_VERDICT_STATUSES.includes(claim.claimStatusId)) return null

  // No second "has the clock started" test here: `claimErd` already returns
  // `pending` for exactly the states the model calls pending (no anchor at or
  // below the current stage), and duplicating the rule as a docsClearedAt
  // check made the card stricter than the spreadsheet it ports.
  const milestones = claimMilestones(order)
  const transit = claimErdTransit(claim)
  const now = today ?? toErdDate(milestones.asOf) ?? orderAsOf(order)
  // `when_pending` closes the one gap where the model has nothing to say by
  // standing today in for the outstanding milestone — but only for a claim
  // that actually carries a `milestones` block. Without one we know nothing
  // about this claim's clock, and inventing a confident date from no data is
  // worse than showing none. `assumeToday` is the sandbox's what-if toggle
  // (see lib/claimErdSandbox.js); nothing else sets it.
  const assume = !claim.milestones
    ? 'never'
    : milestones.assumeToday
      ? 'always'
      : 'when_pending'
  const erd = claimErd(order.country, now, milestones, { transit, assume })
  if (erd.pending || erd.stage === ERD_DECIDED) return null

  return {
    ...erd,
    transit,
    explanation: claimErdExplanation(erd.stage, {
      transit,
      overdue: erd.overdue,
      assumed: erd.assumed,
    }),
    ...formatClaimErd(erd),
  }
}
