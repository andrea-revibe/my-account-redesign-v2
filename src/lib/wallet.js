// Single source of truth for the Revibe Wallet surface (the pill in GreetRow
// + WalletSheet). The ledger is derived from whatever order list the caller
// passes (App.jsx passes the journey-projected orders in journey mode, else
// none): every refund that landed in the Wallet becomes a credit, merged with
// the hand-seeded history in data/wallet.js. The only in-session mutation is
// `transfers` — a map of txId → true for credits the customer has moved to
// their card.
//
// Two refund paths credit the Wallet:
//   • return claim    — claim.refundMethod 'wallet' + claimStatusId
//                        'refund_credited' (amount = expectedRefund.net)
//   • cancellation    — refund.destination.kind 'wallet' +
//                        cancellationStatusId 'refunded' (amount = refund.amount)
//
// "Move to card" re-applies the deduction the customer avoided by taking
// store credit (see cardEquivalentFor). Only the latest *switchable* credit
// is movable; compensation credits and Revibe-initiated cancellations are
// history-only (no originating card alternative). See docs/output/wallet.md.

import {
  refundBreakdown,
  refundDestinations,
  isSplitPaid,
  RESTOCKING_FEE_RATE,
  CANCELLATION_FEE_RATE,
  ISSUE_WALLET_BONUS,
} from './returns'
import { WALLET_SEED_TRANSACTIONS } from '../data/wallet'

const MONTHS = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
}

const round2 = (n) => Math.round(n * 100) / 100

// Timeline strings ("18 Mar · 11:00 AM") and placedAtFull ("16 May 2026 ·
// 3:40 PM") carry no reliable year, so the year is passed in (from the
// order's placedAt). Returns null on anything unparseable.
function parseEventDate(label, year) {
  if (!label) return null
  const [datePart, timePart] = label.split('·').map((s) => s.trim())
  const [dayStr, monStr] = (datePart || '').split(/\s+/)
  const day = Number(dayStr)
  const month = MONTHS[monStr]
  if (!Number.isFinite(day) || month == null) return null
  let hh = 0
  let mm = 0
  if (timePart) {
    const [time, ampm] = timePart.split(/\s+/)
    const [h, m] = (time || '').split(':').map(Number)
    hh = Number.isFinite(h) ? h : 0
    mm = Number.isFinite(m) ? m : 0
    if (ampm === 'PM' && hh !== 12) hh += 12
    if (ampm === 'AM' && hh === 12) hh = 0
  }
  return new Date(year || 2026, month, day, hh, mm)
}

function yearOf(order) {
  const y = Number(order?.placedAt?.split(' ')[0]?.split('/')[2])
  return Number.isFinite(y) ? y : 2026
}

function cardLabelFor(order) {
  const pm = order?.paymentMethod
  if (!pm) return 'your original card'
  if (pm.type === 'bnpl') return pm.brand || 'Buy now, pay later'
  return `${pm.brand || 'Card'} •• ${pm.last4 || '0000'}`
}

function normalize(entry, transfers) {
  const d = parseEventDate(entry.dateLabel, entry.year)
  return {
    id: entry.id,
    kind: entry.kind,
    source: entry.source,
    dateLabel: entry.dateLabel || '',
    sortTs: d ? d.getTime() : 0,
    amount: entry.amount,
    currency: entry.currency || 'AED',
    switchable: Boolean(entry.switchable),
    moved: Boolean(transfers[entry.id]),
    via: entry.via,
    order: entry.order || null,
    cardEquivalent: entry.cardEquivalent || null,
  }
}

// Builds the full transaction list, newest first. `transfers` flips a moved
// credit's row (excluded from the balance, marked in the UI).
export function walletLedger(orders = [], transfers = {}) {
  const raw = []

  for (const order of orders) {
    const claim = order.claim
    if (
      claim &&
      claim.refundMethod === 'wallet' &&
      claim.claimStatusId === 'refund_credited' &&
      claim.expectedRefund
    ) {
      raw.push({
        id: `claim:${order.id}`,
        kind: 'credit',
        source: `Return refund · #${order.id}`,
        dateLabel: claim.timeline?.refund_credited,
        year: yearOf(order),
        amount: claim.expectedRefund.net,
        currency: order.currency,
        switchable: true,
        via: 'claim',
        order,
      })
    }

    // Split-paid order refunded to the *original* payment: the gift-card
    // (store-credit) portion comes back into the Wallet, the card portion
    // goes to the card. Not switchable — it was store credit, not card money,
    // so there's no card to "move it back" to.
    if (
      claim &&
      claim.refundMethod === 'original' &&
      claim.claimStatusId === 'refund_credited' &&
      claim.expectedRefund &&
      isSplitPaid(order)
    ) {
      const split = refundDestinations(order, claim.expectedRefund.net)
      if (split && split.giftCard > 0) {
        raw.push({
          id: `claim-gift:${order.id}`,
          kind: 'credit',
          source: `Return refund · gift card · #${order.id}`,
          dateLabel: claim.timeline?.refund_credited,
          year: yearOf(order),
          amount: split.giftCard,
          currency: order.currency,
          switchable: false,
          via: 'claim',
          order,
        })
      }
    }

    if (
      order.refund?.destination?.kind === 'wallet' &&
      order.cancellationStatusId === 'refunded'
    ) {
      const fromRevibe = order.cancellationInitiator === 'revibe'
      raw.push({
        id: `cancel:${order.id}`,
        kind: 'credit',
        source: `${fromRevibe ? 'Order refunded' : 'Order cancelled'} · #${order.id}`,
        dateLabel: order.cancellationTimeline?.refunded || order.placedAtFull,
        year: yearOf(order),
        amount: order.refund.amount,
        currency: order.currency,
        switchable: true,
        via: 'cancellation',
        order,
      })
    }

    // Split-paid cancellation refunded to the original payment (destination
    // isn't the Wallet): only the gift-card portion lands back in the Wallet.
    if (
      order.refund &&
      order.refund.destination?.kind !== 'wallet' &&
      order.cancellationStatusId === 'refunded' &&
      isSplitPaid(order)
    ) {
      const split = refundDestinations(order, order.refund.amount)
      if (split && split.giftCard > 0) {
        raw.push({
          id: `cancel-gift:${order.id}`,
          kind: 'credit',
          source: `Order cancelled · gift card · #${order.id}`,
          dateLabel: order.cancellationTimeline?.refunded || order.placedAtFull,
          year: yearOf(order),
          amount: split.giftCard,
          currency: order.currency,
          switchable: false,
          via: 'cancellation',
          order,
        })
      }
    }
  }

  for (const s of WALLET_SEED_TRANSACTIONS) {
    raw.push({
      ...s,
      currency: s.currency || 'AED',
      switchable: Boolean(s.switchable),
      via: 'seed',
    })
  }

  // Live/replay refunds (the in-context order) rank above seeded history —
  // they're "what just happened this session", so the journey refund pins to
  // the top regardless of its hardcoded date. Within a tier: newest first,
  // then id for a deterministic tiebreak.
  const tierOf = (t) => (t.via === 'seed' ? 1 : 0)
  return raw
    .map((e) => normalize(e, transfers))
    .sort(
      (a, b) =>
        tierOf(a) - tierOf(b) ||
        b.sortTs - a.sortTs ||
        a.id.localeCompare(b.id),
    )
}

export function walletBalance(ledger) {
  return ledger.reduce((sum, t) => {
    if (t.kind === 'debit') return sum - t.amount
    if (t.moved) return sum
    return sum + t.amount
  }, 0)
}

export function walletCurrency(ledger) {
  return ledger[0]?.currency || 'AED'
}

// The single credit that exposes "Move to card": the freshest switchable
// credit (the journey refund when replaying, else the freshest seeded
// refund). Latest-refund-only — no cascade: if that credit is already moved,
// nothing else is offered even when older unspent refunds exist. Also
// funds-gated: hidden once the wallet no longer holds at least its amount.
export function latestSwitchableCredit(ledger) {
  const tx = ledger.find((t) => t.kind === 'credit' && t.switchable)
  if (!tx || tx.moved) return null
  return walletBalance(ledger) >= tx.amount ? tx : null
}

// What the customer would actually receive on their card, and what they give
// up to get it. Any refund credit is movable; the deduction depends on origin:
//   change_of_mind → 10% restocking · issue → forfeit AED 100 bonus
//   cancellation (customer) → 5% processing · breached → forfeit bonus
//   compensation / Revibe-initiated → no deduction (full amount)
// Seed credits carry a precomputed `cardEquivalent` (no live order to derive
// from); everything else is computed from `tx.order` via refundBreakdown.
export function cardEquivalentFor(tx) {
  if (!tx || !tx.switchable) return null
  if (tx.cardEquivalent) return tx.cardEquivalent
  if (!tx.order) return null
  const order = tx.order
  const currency = order.currency || tx.currency
  const destinationLabel = cardLabelFor(order)
  const noDeduction = () => ({
    walletAmount: tx.amount,
    cardAmount: tx.amount,
    deductions: [],
    destinationLabel,
    currency,
  })

  if (tx.via === 'claim') {
    const claim = order.claim
    if (claim.type === 'compensation') return noDeduction()
    const card = refundBreakdown(order, claim.units || 1, 'original', claim.type)
    if (claim.type === 'issue') {
      return {
        walletAmount: tx.amount,
        cardAmount: card.net,
        deductions: [{ label: 'Wallet bonus forfeited', amount: ISSUE_WALLET_BONUS }],
        destinationLabel,
        currency,
      }
    }
    return {
      walletAmount: tx.amount,
      cardAmount: card.net,
      deductions: [{ label: `Restocking fee (${Math.round(RESTOCKING_FEE_RATE * 100)}%)`, amount: card.fee }],
      destinationLabel,
      currency,
    }
  }

  // Cancellation. Revibe-initiated carries no penalty — full amount moves.
  if (order.cancellationInitiator === 'revibe') return noDeduction()
  const refund = order.refund || {}
  const total = order.total
  if (refund.bonus > 0) {
    return {
      walletAmount: tx.amount,
      cardAmount: total,
      deductions: [{ label: 'Wallet bonus forfeited', amount: refund.bonus }],
      destinationLabel,
      currency,
    }
  }
  const fee = round2(total * CANCELLATION_FEE_RATE)
  return {
    walletAmount: tx.amount,
    cardAmount: round2(total - fee),
    deductions: [{ label: `Processing fee (${Math.round(CANCELLATION_FEE_RATE * 100)}%)`, amount: fee }],
    destinationLabel,
    currency,
  }
}
