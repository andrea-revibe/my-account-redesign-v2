import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import OriginalOrderSheet from './OriginalOrderSheet'

// Shared order↔claim linkage chrome for the whole claim-card family
// (ClaimCard, WarrantyClaimCard, and the four takeover cards). Renders the
// parent order strip + connector thread above the wrapped card, owns the
// Original-order sheet, and pulses a highlight ring on the card when the
// customer rounds back from the sheet's "Linked claim" row. The card stays
// untouched — it's passed as `children`; `onReveal` lets the card expand
// itself on the round-trip (no-op for always-expanded cards).
export default function OrderClaimLink({ order, onReveal, children }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [reveal, setReveal] = useState(0)
  const orderDate =
    order.placedAtFull?.split(' · ')[0] || order.placedAt?.split(' ')[0] || ''

  const goToClaim = () => {
    setSheetOpen(false)
    onReveal?.()
    setReveal((n) => n + 1)
  }

  return (
    <div className="relative pl-5">
      {/* Connector thread: the order strip (top node) is the parent, the claim
          card (bottom node) hangs off it — the line is the "these belong
          together" cue. The card's top is stable regardless of expanded
          height, so the lower node stays anchored. */}
      <span
        aria-hidden
        className="absolute left-[3px] top-[28px] h-[66px] w-0.5 rounded-full bg-gradient-to-b from-brand-2 to-brand-bg2"
      />
      <span
        aria-hidden
        className="absolute left-0 top-[22px] w-2.5 h-2.5 rounded-full bg-surface border-[2.5px] border-brand-2"
      />
      <span
        aria-hidden
        className="absolute left-0 top-[88px] w-2.5 h-2.5 rounded-full bg-brand"
      />

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label={`View original order #${order.id}`}
        className="relative w-full flex items-center gap-2.5 rounded-[14px] border border-line bg-surface px-3 py-2.5 text-left hover:bg-line-2/40 transition-colors"
      >
        <span className="w-[38px] h-[38px] rounded-[9px] bg-line-2 grid place-items-center overflow-hidden shrink-0 p-0.5">
          <img
            src={order.product.image}
            alt=""
            className="w-full h-full object-contain"
          />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[10px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            Order #{order.id}
          </span>
          <span className="block text-[12.5px] font-semibold text-ink mt-0.5 truncate">
            Placed {orderDate}
          </span>
        </span>
        <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-brand shrink-0">
          View
          <ChevronRight size={13} strokeWidth={2.5} />
        </span>
      </button>

      <div className="relative mt-2.5">
        {reveal > 0 && (
          <span
            key={reveal}
            aria-hidden
            className="absolute inset-0 rounded-card pointer-events-none z-10 animate-ringPulse motion-reduce:animate-none motion-reduce:shadow-[inset_0_0_0_2px_rgba(80,25,160,0.55)]"
          />
        )}
        {children}
      </div>

      <OriginalOrderSheet
        order={order}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onGoToClaim={goToClaim}
      />
    </div>
  )
}
