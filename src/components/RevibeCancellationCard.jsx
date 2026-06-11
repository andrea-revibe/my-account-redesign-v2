import { useState } from 'react'
import {
  PackageX,
  Tag,
  Truck,
  Sparkles,
  Copy,
  Check,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react'
import { ProductSummary } from './ProductSummary'
import { DestinationChip } from './PastOrderCard'
import DeliveryAddressPill from './DeliveryAddressPill'
import RefundDetailsSheet from './RefundDetailsSheet'

// Card for orders Revibe had to cancel (customer never asked). Sibling of the
// customer-initiated CancelledOrderCard: it shares that card's chrome and
// reused pieces (ProductSummary, DestinationChip, RefundDetailsSheet) but
// flips the hierarchy — apology + a fixed-amount re-buy discount lead, the
// full no-fee refund reassures below. Terminal state, Past orders section.
// Design: docs/handoff/revibe-cancellation/design.md.

// Reason → apology icon + the leading explanatory clause. The shared
// "fully refunded" close is appended after, bolded, in every reason.
const REASONS = {
  item_unavailable: {
    Icon: PackageX,
    lead: 'The seller no longer has this item in stock.',
  },
  price_error: {
    Icon: Tag,
    lead: 'This item was listed at the wrong price, so we had to cancel the order.',
  },
  undeliverable_address: {
    Icon: Truck,
    lead: "Our courier partner can't deliver to your address.",
  },
}

export default function RevibeCancellationCard({ order, onOpenWallet }) {
  const [refundOpen, setRefundOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const reason = REASONS[order.cancellationReason] ?? REASONS.item_unavailable
  const { Icon } = reason
  const { reBuyOffer, refund, currency } = order
  const fmt = (n) => `${currency} ${n.toLocaleString()}`

  const copyCode = () => {
    navigator.clipboard?.writeText(reBuyOffer.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <article className="bg-surface rounded-card border border-line overflow-hidden relative">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-accent z-[1]" />

      <div className="pl-[15px] pr-[13px] pt-3 pb-3.5 flex flex-col gap-[11px]">
        {/* 1. Eyebrow */}
        <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
          Order · #{order.id}
        </div>

        {/* 2. State pill — neutral, informational (not danger) */}
        <span className="self-start inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[10.5px] font-bold uppercase tracking-[0.06em] bg-line-2 text-ink-2">
          <span className="w-1.5 h-1.5 rounded-full bg-ink-2" />
          Cancelled by Revibe
        </span>

        {/* 3. Apology block */}
        <div className="border border-line bg-[#faf8fd] rounded-[13px] p-3 flex gap-[11px] items-start">
          <div className="w-[38px] h-[38px] rounded-[11px] bg-brand-bg text-brand grid place-items-center shrink-0">
            <Icon size={20} strokeWidth={1.9} />
          </div>
          <div className="min-w-0">
            <h2 className="text-[16.5px] font-bold leading-[1.18] tracking-[-0.01em] text-ink">
              We had to cancel your order
            </h2>
            <p className="text-[12.5px] leading-[1.5] text-ink-2 mt-[5px] [text-wrap:pretty]">
              {reason.lead} This wasn't your fault —{' '}
              <b className="text-ink font-semibold">you've been fully refunded.</b>
            </p>
            {order.cancellationReason === 'undeliverable_address' && (
              <DeliveryAddressPill label="Delivery to" address={order.address} />
            )}
          </div>
        </div>

        {/* 4. Offer block — subtle variant (the focal forward pull) */}
        <div className="bg-brand-bg border border-[#e6dcf7] rounded-[15px] px-3.5 pt-3.5 pb-[13px]">
          <div className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-accent">
            <Sparkles size={13} strokeWidth={2} />
            A little something to make it right
          </div>
          <div className="text-[22.5px] font-extrabold leading-[1.1] tracking-[-0.015em] text-brand mt-1.5">
            {fmt(reBuyOffer.amount)} off your next order
          </div>
          <div className="mt-[11px] flex items-center gap-2 bg-surface border border-dashed border-accent/45 rounded-[11px] pl-[13px] pr-[7px] py-[7px]">
            <span className="flex-1 min-w-0 text-[15px] font-extrabold tracking-[0.12em] text-brand tabular-nums">
              {reBuyOffer.code}
            </span>
            <button
              type="button"
              onClick={copyCode}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-white text-[12px] font-bold active:scale-95 transition-transform ${
                copied ? 'bg-brand' : 'bg-accent'
              }`}
            >
              {copied ? (
                <>
                  <Check size={13} strokeWidth={2.4} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={13} strokeWidth={2} />
                  Copy
                </>
              )}
            </button>
          </div>
          <div className="mt-[9px] inline-flex items-center gap-1.5 text-[11px] text-muted whitespace-nowrap">
            <Clock size={12} strokeWidth={2} />
            Expires {reBuyOffer.expiresAt}
          </div>
        </div>

        {/* 5. Primary CTA — white·magenta with glow / shine / arrow motion */}
        <button
          type="button"
          className="relative overflow-hidden w-full h-[46px] rounded-btn inline-flex items-center justify-center gap-2 text-[14px] font-bold bg-surface border-[1.5px] border-accent text-accent animate-ctaGlow motion-reduce:animate-none"
        >
          <span
            aria-hidden
            className="absolute top-0 left-[-65%] w-[45%] h-full -skew-x-[18deg] animate-ctaShine motion-reduce:hidden"
            style={{
              background:
                'linear-gradient(105deg, transparent, rgba(217,26,122,.12), transparent)',
            }}
          />
          <span className="relative z-[1] whitespace-nowrap">
            Browse similar devices
          </span>
          <ArrowRight
            size={16}
            strokeWidth={2}
            className="relative z-[1] animate-ctaNudge motion-reduce:animate-none"
          />
        </button>

        {/* 6. What was cancelled — reused ProductSummary, unchanged */}
        <div className="flex flex-col gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
            What we cancelled
          </div>
          <ProductSummary order={order} />
        </div>

        {/* 7. Refund reassurance — collapsible (the only expander) */}
        <div className="border border-[#c6ebd9] bg-success-bg rounded-[13px] overflow-hidden">
          <button
            type="button"
            onClick={() => setRefundOpen((v) => !v)}
            aria-expanded={refundOpen}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left"
          >
            <span className="w-7 h-7 rounded-full bg-surface border border-[#c6ebd9] text-success grid place-items-center shrink-0">
              <ShieldCheck size={15} strokeWidth={2} />
            </span>
            <span className="flex-1 min-w-0 text-[13px] font-bold text-ink leading-[1.25]">
              {fmt(refund.amount)} fully refunded ·{' '}
              <span className="text-success">no fee</span>
            </span>
            <span
              className="w-[22px] h-[22px] rounded-full text-success grid place-items-center shrink-0 transition-transform duration-200"
              style={{ transform: refundOpen ? 'rotate(180deg)' : 'none' }}
            >
              <ChevronDown size={16} strokeWidth={2} />
            </span>
          </button>
          {refundOpen && (
            <div className="px-3 pb-[11px] animate-slideDown">
              <div className="flex items-center gap-1.5 pt-[9px] mt-0.5 border-t border-dashed border-[#bfe7d6] text-[11.5px] text-ink-2">
                <span className="whitespace-nowrap">Sent to</span>
                <DestinationChip
                  destination={refund.destination}
                  accent={refund.destination.kind === 'wallet'}
                  onOpenWallet={onOpenWallet}
                />
              </div>
              <button
                type="button"
                onClick={() => setDetailsOpen(true)}
                className="mt-2.5 w-full h-[37px] rounded-[10px] bg-surface border border-[#c6ebd9] text-success text-[12.5px] font-bold inline-flex items-center justify-center gap-1.5 hover:bg-white"
              >
                View refund details
              </button>
            </div>
          )}
        </div>
      </div>

      <RefundDetailsSheet
        order={order}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
    </article>
  )
}
