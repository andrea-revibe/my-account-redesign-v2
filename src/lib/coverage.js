// Warranty coverage — single source of truth for WHICH warranty applies to a
// device and WHAT that warranty covers.
//
// Every order carries warranty. The tier decides the duration and the kinds of
// fault that qualify:
//
//   standard (free, every order)   defects present from the start · 12 months
//   extended (Revibe Care, paid)   defects · 24 months
//                                  + accidental damage · 24 months, one use,
//                                    repairs up to the country cap
//
// The entitlement is the Revibe Care add-on the customer bought at checkout —
// already on the order as `order.warranty` (the amount paid), rendered by
// ProductSummary as the "2-year extended warranty · added" tile. Note the `> 0`
// test: a couple of compensation mocks carry `warranty: 0`, which is not Care.
//
// Ages run from the ORDER date (`order.placedAt`), not delivery — a different
// clock from `eligibilityFor` in lib/returns.js, which runs the 10-day return
// window from delivery.
//
// Deliberately standalone: coverage is consumed by the returns flow's remedy
// screen, its review/confirmation summaries and the warranty tracking card, and
// keeping it out of lib/returns.js + lib/claims.js means adding it costs those
// modules' consumers nothing.
import {
  parsePlacedAtDate,
  startOfDay,
  formatShortDate,
  formatMoney,
  orderAsOf,
} from './returns'

export const STANDARD_WARRANTY_MONTHS = 12
export const EXTENDED_WARRANTY_MONTHS = 24

// Repair-cost ceiling for the accidental-damage arm: above this the damage is
// quoted to the customer instead of covered. AE is the real published figure;
// the other markets are stubbed at parity until their own caps are set (they
// also need the local currency — `countryConfig` carries no currency yet, so
// the cap is read alongside `order.currency`).
export const ACCIDENTAL_DAMAGE_CAPS = {
  AE: 1500,
  ZA: 1500, // TODO: real ZAR figure
  SA: 1500, // TODO: real SAR figure
  Others: 1500,
}
export const ACCIDENTAL_DAMAGE_CAP = ACCIDENTAL_DAMAGE_CAPS.AE

export function accidentalDamageCap(order) {
  const code = typeof order === 'string' ? order : order?.country
  return ACCIDENTAL_DAMAGE_CAPS[code] ?? ACCIDENTAL_DAMAGE_CAP
}

// Did this order include the Revibe Care add-on?
export function hasExtendedWarranty(order) {
  return (order?.warranty ?? 0) > 0
}

// The accidental-damage arm is a single use per device. No surface sets this
// yet — a used entitlement is an uncovered path (out of scope for this phase),
// so the flag exists to keep the "covered once" copy honest and to give the
// used state somewhere to hang later.
export function careAccidentalUsed(order) {
  return order?.careAccidentalUsed === true
}

// Calendar-month arithmetic, clamped to the end of the target month so
// 31 Jan + 1 month lands on 28/29 Feb rather than overflowing into March.
function addMonths(date, months) {
  const d = new Date(date.getTime())
  const day = d.getDate()
  d.setDate(1)
  d.setMonth(d.getMonth() + months)
  const lastDayOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  d.setDate(Math.min(day, lastDayOfMonth))
  return d
}

function fullMonthsBetween(from, to) {
  let months =
    (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
  if (to.getDate() < from.getDate()) months -= 1
  return Math.max(0, months)
}

// What covers this device today.
//
// `tier`:
//   'standard'  within the first 12 months — the free warranty still applies
//               (whether or not Care was bought)
//   'extended'  past 12 months, inside 24, and Care was bought
//   'expired'   nothing applies: past 24 months, or past 12 with no Care
//   'unknown'   the order has no parseable date — treated as today's behaviour
//
// `coversDefect` / `coversAccidental` are descriptive, for copy. They are NOT a
// filter for the remedy menu: uncovered outcomes are out of scope this phase and
// still render as they do today (see remedyOptionsFor).
// `today` defaults to the order's own clock (`orderAsOf` in lib/returns.js) so a
// journey replay's warranty age is measured on its synthetic calendar — otherwise
// a journey authored today would silently age out of warranty in a year.
export function coverageFor(order, today = null) {
  const hasCare = hasExtendedWarranty(order)
  const cap = accidentalDamageCap(order)
  const placed = parsePlacedAtDate(order?.placedAt)

  if (!placed) {
    return {
      tier: 'unknown',
      hasCare,
      cap,
      monthsOld: null,
      placedOn: null,
      standardUntil: null,
      extendedUntil: null,
      coversDefect: true,
      coversAccidental: false,
      accidentalUsed: careAccidentalUsed(order),
    }
  }

  const standardUntil = addMonths(placed, STANDARD_WARRANTY_MONTHS)
  const extendedUntil = addMonths(placed, EXTENDED_WARRANTY_MONTHS)
  const now = startOfDay(today ?? orderAsOf(order))
  const withinStandard = now <= startOfDay(standardUntil)
  const withinExtended = now <= startOfDay(extendedUntil)
  const accidentalUsed = careAccidentalUsed(order)

  const tier = withinStandard
    ? 'standard'
    : withinExtended && hasCare
      ? 'extended'
      : 'expired'

  return {
    tier,
    hasCare,
    cap,
    monthsOld: fullMonthsBetween(placed, now),
    placedOn: placed,
    standardUntil,
    extendedUntil,
    coversDefect: tier === 'standard' || tier === 'extended',
    coversAccidental: hasCare && withinExtended && !accidentalUsed,
    accidentalUsed,
  }
}

// Which remedy options the device_fault branch should offer, in display order.
// Returns ids only — the copy and icons stay in StepRemedy.
//
//   refund      gated on the 10-day return window (production rule: no refund
//               once the window closes)
//   repair      ALWAYS offered — the standard-warranty arm. Never removed:
//               uncovered devices keep today's behaviour this phase, and removing
//               it alongside a closed refund window would leave the screen with
//               nothing on it.
//   accidental  the new arm — Care held, inside 24 months, not yet used
export function remedyOptionsFor(order, coverage, refundEligible) {
  const ids = []
  if (refundEligible) ids.push('refund')
  ids.push('repair')
  if (coverage.coversAccidental) ids.push('accidental')
  return ids
}

// One line naming the coverage a warranty repair is being made under — shared by
// the flow's Review + Confirmation summaries and the warranty tracking surfaces,
// so the terms a customer agrees to at submit are the terms they're shown later.
// Takes primitives rather than an order because the callers hold different
// shapes: the flow has a draft (`state.remedy`), the tracking cards have the
// frozen `claim.cause` / `claim.coverage`.
export function coverageSummary({ cause, tier, cap, currency }) {
  if (cause === 'accidental') {
    return {
      label: 'Revibe Care · accidental damage',
      detail: `Covered once, up to ${currency} ${formatMoney(cap)} — we'll confirm the repair cost after inspection.`,
    }
  }
  if (tier === 'extended') {
    return {
      label: 'Revibe Care · standard warranty cover',
      detail:
        'Your first-year warranty has ended — Revibe Care carries the same cover to two years.',
    }
  }
  return {
    label: 'Standard warranty',
    detail: "Faults you didn't cause are repaired free of charge.",
  }
}

// Short label distinguishing the two warranty arms on tracking surfaces, where
// "Warranty" alone can't tell an accidental-damage repair from a defect one.
// Null when there's nothing to add (a plain first-year defect repair, or a
// hand-seeded mock with no `cause`).
export function coverageArmLabel(claim) {
  if (claim?.type !== 'warranty') return null
  if (claim.cause === 'accidental') return 'Revibe Care · accidental damage'
  if (claim.coverage === 'extended') return 'Revibe Care'
  return null
}

// Entitlement summary for the remedy screen's coverage strip. Null when there is
// nothing new to tell the customer — the first-year, no-Care case is today's flow
// untouched, and uncovered devices are out of scope this phase.
//
// The headline always names the Revibe Care expiry, never the standard one: Care
// covers defects AND accidental damage for the full two years, so a Care holder
// never hits the one-year cliff and quoting that date reads as a shorter
// entitlement than they actually bought. The tier only changes the body, which
// spells out why Care is the thing answering for them today.
export function coverageStripFor(coverage) {
  if (!coverage.hasCare) return null
  if (coverage.tier !== 'standard' && coverage.tier !== 'extended') return null

  const headline = `Covered by Revibe Care until ${formatShortDate(coverage.extendedUntil)}`
  const body =
    coverage.tier === 'extended'
      ? `Your device is ${coverage.monthsOld} months old — past the standard one-year warranty, but Revibe Care covers you for two, including damage you caused.`
      : 'Defects and accidental damage — including damage you caused — are covered for two years from your order date.'
  return { headline, body }
}
