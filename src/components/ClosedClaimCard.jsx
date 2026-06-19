import { useState } from 'react'
import {
  ChevronDown,
  ClipboardList,
  ShieldX,
  CalendarX2,
  Ban,
  FileX2,
  SearchX,
  CopyX,
  Headset,
  RotateCcw,
} from 'lucide-react'
import { ProductSummary } from './ProductSummary'
import OrderClaimLink from './OrderClaimLink'
import { formatClaimRef, closureCopyFor } from '../lib/claims'

// Terminal card for a claim Revibe closed without accepting it (rejected at
// review — outside window, ineligible, evidence insufficient, couldn't
// reproduce, duplicate). The customer keeps the device and no refund is
// issued. Mirrors InvalidClaimCard's `CompensationClosedCard` chrome (muted
// accent, "Claim closed" pill, "No refund issued" tag) but is reason-driven:
// the hero eyebrow surfaces the closure reason and the expanded body carries
// the attributed Revibe Quality note + a forward path (support / re-raise).
// Routed by `claim.closure` (isClaimClosed); lives in Past orders. Spec:
// docs/output/returns/claim_tracking.md §3.6.

// Reason → glyph. Copy lives in `CLAIM_CLOSURE_REASONS` (lib/claims.js); the
// icon is presentation, so it stays here.
const REASON_ICON = {
  outside_window: CalendarX2,
  not_eligible: Ban,
  evidence_insufficient: FileX2,
  not_reproduced: SearchX,
  duplicate: CopyX,
  other: ClipboardList,
}

// Hero eyebrow framing by claim type, matching InvalidClaimCard's phrasing.
const TYPE_LABEL = {
  change_of_mind: 'Return claim',
  issue: 'Return claim',
  warranty: 'Warranty claim',
  compensation: 'Compensation claim',
}

export default function ClosedClaimCard({ order, onRaiseClaim }) {
  const [expanded, setExpanded] = useState(false)
  const claim = order.claim
  const closure = claim.closure
  const copy = closureCopyFor(claim)
  const ReasonIcon = REASON_ICON[closure.reason] || ClipboardList
  const typeLabel = TYPE_LABEL[claim.type] || 'Claim'

  return (
    <OrderClaimLink order={order} onReveal={() => setExpanded(true)}>
      <article className="bg-surface rounded-card border border-line overflow-hidden relative animate-fadeIn">
        <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-muted/60" />

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="w-full text-left pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3"
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

          <span className="self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px] bg-line-2 text-ink-2">
            <ClipboardList size={11} strokeWidth={2.2} />
            Claim closed
          </span>

          <div className="rounded-[14px] border border-line bg-line-2/40 p-3.5 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2 inline-flex items-center gap-1 whitespace-nowrap truncate min-w-0">
                <ReasonIcon size={12} strokeWidth={2.2} className="shrink-0" />
                {copy.label}
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-muted whitespace-nowrap shrink-0">
                <ShieldX size={11} strokeWidth={2.2} />
                No refund issued
              </span>
            </div>
            <div className="text-[18px] font-bold leading-[1.15] tracking-[-0.01em] text-ink">
              {copy.headline}
            </div>
            <div className="text-[11.5px] text-ink-2 leading-snug">
              {copy.subline}
            </div>
          </div>

          <ProductSummary order={order} />
        </button>

        {expanded && (
          <div className="border-t border-line bg-canvas pl-4 pr-3.5 py-4 flex flex-col gap-3.5 animate-slideDown">
            {closure.opsMessage && (
              <div className="rounded-[12px] border border-line bg-surface p-3 flex gap-2.5 items-start">
                <span className="w-7 h-7 rounded-full bg-ink-2 text-white grid place-items-center shrink-0 text-[11px] font-bold uppercase">
                  {closure.opsName?.[0] || '?'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[11px] text-ink-2 font-semibold">
                      <span className="text-ink">{closure.opsName}</span>
                      <span className="text-muted"> · {closure.opsRole}</span>
                    </div>
                    {closure.closedAt && (
                      <span className="text-[10.5px] text-muted tabular-nums shrink-0">
                        {closure.closedAt}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 text-[12.5px] text-ink leading-snug pr-1">
                    {closure.opsMessage}
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-[12px] border border-line bg-surface px-3.5 py-3 text-[11.5px] text-ink-2 leading-snug">
              <span className="font-semibold text-ink">Think this is wrong?</span>{' '}
              If you have new proof, our support team can take another look — or
              you can raise a fresh claim on this order.
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                className="flex-1 h-[44px] rounded-[10px] bg-surface border border-line text-ink font-semibold text-[13px] inline-flex items-center justify-center gap-1.5 hover:bg-line-2"
              >
                <Headset size={14} strokeWidth={2} />
                Contact support
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRaiseClaim?.(order.id)
                }}
                className="flex-1 h-[44px] rounded-[10px] bg-ink text-white font-semibold text-[13px] inline-flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-[0.99] transition"
              >
                <RotateCcw size={14} strokeWidth={2.2} />
                Raise a new claim
              </button>
            </div>
          </div>
        )}
      </article>
    </OrderClaimLink>
  )
}
