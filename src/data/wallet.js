// Curated Revibe Wallet history — a believable "used wallet" ledger. Store
// credit gets spent on purchases, so the resting balance hovers low (~AED 80
// here); a fresh refund lands on top and is the one the customer can still
// move to a card before spending it. The live in-context refund (the replayed
// journey order's wallet refund) is derived in lib/wallet.js and pinned ABOVE
// this seed (it's "what just happened this session"); in the static multi-order
// demo this seed is the whole history (we no longer auto-sum every order's
// refund — that read as an unrealistic pile).
//
// Dates are deliberately kept earlier than the journeys' base date (journeys
// replay from INITIAL_ORDER placed 19 May 2026, so their refunds are late May).
// Spring-2026 seed dates keep the ledger chronological once a late-May journey
// refund pins on top — no "30 May above 9 Jun" inversion.
//
// Shape per entry: { id, kind: 'credit' | 'debit', source, dateLabel, year,
// amount, switchable?, cardEquivalent? }. `year` feeds the date parser (the
// dateLabel carries none, matching order/claim timeline strings). Amount is
// positive; `kind` carries the sign. A `switchable: true` credit must carry a
// precomputed `cardEquivalent` (seed entries have no live order to compute
// from); promo credits, debits, and settled (already-spent) refunds omit both.
export const WALLET_SEED_TRANSACTIONS = [
  // Fresh, unspent refund — the movable one in the static (non-journey) demo.
  {
    id: 'seed:refund-89200',
    kind: 'credit',
    source: 'Return refund · #89200',
    dateLabel: '2 May · 4:02 PM',
    year: 2026,
    amount: 619,
    switchable: true,
    cardEquivalent: {
      walletAmount: 619,
      cardAmount: 557.1,
      deductions: [{ label: 'Restocking fee (10%)', amount: 61.9 }],
      destinationLabel: 'Visa •• 4242',
    },
  },
  // Spent on a purchase — debit.
  {
    id: 'seed:purchase-89540',
    kind: 'debit',
    source: 'Applied to order #89540',
    dateLabel: '28 Apr · 1:20 PM',
    year: 2026,
    amount: 400,
  },
  // Gift-card portion of a split-paid cancellation (#89518) refunded to the
  // original payment: the card portion went back to the card, this store-credit
  // portion came back into the Wallet. History-only (not switchable — it was
  // never card money). Pairs with the refund-hero/RefundDetailsSheet split on
  // order 89518.
  {
    id: 'seed:cancel-gift-89518',
    kind: 'credit',
    source: 'Order cancelled · gift card · #89518',
    dateLabel: '16 Mar · 10:15 AM',
    year: 2026,
    amount: 950,
  },
  // Older refund, already settled into the balance (history, not movable).
  {
    id: 'seed:cancel-89150',
    kind: 'credit',
    source: 'Order cancelled · #89150',
    dateLabel: '20 Apr · 11:00 AM',
    year: 2026,
    amount: 609,
  },
  {
    id: 'seed:purchase-89410',
    kind: 'debit',
    source: 'Applied to order #89410',
    dateLabel: '12 Apr · 6:45 PM',
    year: 2026,
    amount: 479,
  },
  {
    id: 'seed:refund-89320',
    kind: 'credit',
    source: 'Return refund · #89320',
    dateLabel: '5 Apr · 9:30 AM',
    year: 2026,
    amount: 250,
  },
  {
    id: 'seed:referral',
    kind: 'credit',
    source: 'Referral reward',
    dateLabel: '5 Feb · 9:00 AM',
    year: 2026,
    amount: 100,
  },
]
