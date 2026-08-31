import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Info,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react'
import { formatClaimRef } from '../lib/claims'
import { formatMoney } from '../lib/returns'
import { ProductSummary } from './ProductSummary'
import OrderClaimLink from './OrderClaimLink'
import TapToFixCta from './TapToFixCta'

// Routed in App.jsx when `repairQuotePending(order)` — an accidental-damage
// repair QC priced above the Revibe Care cap (lib/coverage.js). Sixth member of
// the takeover family (see CLAUDE.md → Card routing), and the only one that is
// a *pause* rather than a detour: the claim keeps its `qc` status throughout,
// and the moment the customer decides, `claim.repairQuote.paidAt` /
// `.declinedAt` retires this surface and WarrantyClaimCard resumes the normal
// warranty tail (repair → ship back, or straight to ship back unrepaired).
//
// That's why there is only one state here, unlike InvalidClaimCard's three: the
// post-decision surfaces already exist on the warranty card. The `decided`
// local state is purely the standalone-mock fallback for when journey mode has
// no node to advance.
//
// Spec: docs/output/warranties_compensations.md §5.
export default function RepairQuoteCard({
  order,
  defaultExpanded = false,
  onPayRepairExcess,
  onDeclineRepair,
  onRequestCancelClaim,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  // null while the customer hasn't chosen. Only ever set when the journey
  // handler declined the transition (no matching node), so the demo still shows
  // an outcome instead of an inert button.
  const [decided, setDecided] = useState(null)

  const claim = order.claim
  const quote = claim.repairQuote
  const currency = order.currency

  return (
    <OrderClaimLink order={order} onReveal={() => setExpanded(true)}>
      <article className="bg-surface rounded-card border border-line overflow-hidden relative shadow-sm2">
        <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-danger" />

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="group w-full text-left pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
              Claim {formatClaimRef(claim)}
            </div>
            <span
              aria-hidden
              className="w-6 h-6 rounded-full bg-line-2 text-ink-2 grid place-items-center shrink-0 transition-transform duration-200"
              style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
            >
              <ChevronDown size={12} strokeWidth={1.75} />
            </span>
          </div>

          <span className="self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px] bg-danger-bg text-danger">
            <AlertTriangle size={11} strokeWidth={2.2} />
            Action needed
          </span>

          <div className="rounded-[14px] border border-[#f6c5cc] bg-danger-bg p-3.5 flex flex-col gap-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2 whitespace-nowrap truncate min-w-0">
                Claim · Warranty
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-danger whitespace-nowrap shrink-0">
                <Wrench size={11} strokeWidth={2.2} />
                Quote ready
              </span>
            </div>
            <div className="text-[18px] font-bold leading-[1.15] tracking-[-0.01em] text-danger">
              Repair costs more than your cover
            </div>

            <div className="text-[11.5px] text-ink-2 leading-snug">
              We inspected your device. The repair comes to{' '}
              <span className="font-semibold text-ink">
                {currency} {formatMoney(quote.total)}
              </span>
              , which is {currency} {formatMoney(quote.excess)} above what
              Revibe Care covers.
            </div>

            {/* Which arm this is running under — same quiet line the warranty
                card uses, so the two surfaces read as one claim. */}
            <div className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.06em] text-ink-2">
              <ShieldCheck size={11} strokeWidth={2} />
              Revibe Care · accidental damage
            </div>

            {quote.deadlineLabel && (
              <div className="rounded-[12px] border bg-white/85 border-white px-3 py-2 text-[11.5px] text-ink leading-snug">
                <span className="font-semibold">{quote.deadlineLabel}</span> — we
                hold your device until then, then send it back unrepaired.
              </div>
            )}
          </div>

          <ProductSummary order={order} />

          {!expanded && <TapToFixCta />}
        </button>

        {expanded && (
          <div className="border-t border-line bg-canvas pl-4 pr-3.5 py-4 flex flex-col gap-3.5 animate-slideDown">
            <QuoteBreakdown quote={quote} currency={currency} />

            {decided ? (
              <DecisionConfirmation decided={decided} />
            ) : (
              <>
                <div className="flex flex-col gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      // Journey mode wins (advances the dev panel in lockstep);
                      // falls back to a local flip for the standalone mock.
                      if (!onPayRepairExcess?.(order.id)) setDecided('paid')
                    }}
                    className="h-[46px] rounded-[10px] border font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5 bg-danger text-white border-danger hover:brightness-95 active:scale-[0.99] transition"
                  >
                    <CreditCard size={14} strokeWidth={2} />
                    Pay {currency} {formatMoney(quote.excess)} · start repair
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!onDeclineRepair?.(order.id)) setDecided('declined')
                    }}
                    className="h-[46px] rounded-[10px] bg-surface border border-line text-ink-2 font-semibold text-[13px] inline-flex items-center justify-center gap-1.5 hover:bg-line-2"
                  >
                    <Truck size={14} strokeWidth={2} />
                    Send my device back — no repair
                  </button>
                </div>

                <div className="text-[10.5px] text-center text-muted -mt-0.5 leading-[1.45]">
                  Sending it back is free — your device comes home unrepaired and
                  your accidental damage cover stays unused.
                </div>
              </>
            )}
          </div>
        )}

        {onRequestCancelClaim && (
          <div className="border-t border-line px-4 py-2">
            <button
              type="button"
              onClick={() => onRequestCancelClaim(order.id)}
              className="w-full h-[38px] rounded-[10px] text-danger font-semibold text-[12.5px] hover:bg-danger-bg/60 transition"
            >
              Cancel claim
            </button>
          </div>
        )}
      </article>
    </OrderClaimLink>
  )
}

// Summary-only breakdown: what the repair costs, what Revibe Care absorbs, what
// is left for the customer. The three numbers are computed once by
// `repairQuoteSplit` (lib/coverage.js) and frozen onto `claim.repairQuote`, so
// nothing is re-derived here.
function QuoteBreakdown({ quote, currency }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface px-3.5 py-3">
      <h3 className="m-0 mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
        Repair quote
      </h3>

      {quote.summary && (
        <div className="text-[13.5px] text-ink font-semibold leading-[1.3] mb-2.5">
          {quote.summary}
        </div>
      )}

      <div className="flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-ink-2">Total repair cost</span>
        <span className="text-ink tabular-nums font-semibold">
          {currency} {formatMoney(quote.total)}
        </span>
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-3 text-[13px]">
        <span className="text-ink-2">Revibe Care · accidental</span>
        <span className="text-success tabular-nums font-semibold">
          −{currency} {formatMoney(quote.covered)}
        </span>
      </div>

      <div className="mt-2.5 pt-2.5 border-t border-dashed border-line flex items-baseline justify-between gap-3">
        <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
          You pay
        </span>
        <span className="text-[18px] font-bold text-ink tabular-nums leading-none">
          {currency} {formatMoney(quote.excess)}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-line-2 flex items-start gap-2">
        <Info size={13} strokeWidth={1.75} className="text-brand mt-px shrink-0" />
        <div className="text-[11.5px] text-muted leading-[1.4]">
          Revibe Care covers accidental damage once, up to {currency}{' '}
          {formatMoney(quote.cap)}. Anything above that is yours to cover.
        </div>
      </div>
    </div>
  )
}

// Standalone-mock fallback only — journey mode moves the claim on instead, and
// the warranty card picks the story up from there.
function DecisionConfirmation({ decided }) {
  const paid = decided === 'paid'
  return (
    <div className="rounded-[12px] border border-line bg-surface px-3.5 py-3 flex items-start gap-2.5">
      <CheckCircle2
        size={15}
        strokeWidth={2}
        className={`mt-px shrink-0 ${paid ? 'text-success' : 'text-ink-2'}`}
      />
      <div className="min-w-0">
        <div className="text-[13px] font-semibold text-ink leading-[1.3]">
          {paid ? 'Payment received' : 'Sending your device back'}
        </div>
        <div className="text-[11.5px] text-muted mt-0.5 leading-[1.4]">
          {paid
            ? "We'll start the repair and let you know when your device is on its way home."
            : "We'll ship your device back unrepaired at no cost. Your accidental damage cover stays unused."}
        </div>
      </div>
    </div>
  )
}
