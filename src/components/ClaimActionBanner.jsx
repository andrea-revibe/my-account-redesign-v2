import { AlertTriangle, ChevronRight } from 'lucide-react'
import { actionGateCopy } from '../lib/claims'

// Inline action-required banner shown above the claim progress dot strip
// when claim.actionRequired is present. Surfaces the gate so the customer
// can't miss what they need to do. See docs/claim_detailed_tracking.md
// § 6 for the three gate kinds and § 7.1 for placement.
export default function ClaimActionBanner({ actionRequired }) {
  const copy = actionGateCopy(actionRequired)
  if (!copy) return null

  return (
    <div className="rounded-[12px] border border-[#ffe3b8] bg-warn-bg p-3 flex flex-col gap-2.5">
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-warn text-white grid place-items-center"
        >
          <AlertTriangle size={11} strokeWidth={2.4} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-bold text-warn leading-tight">
            {copy.headline}
          </div>
          <div className="mt-0.5 text-[11.5px] text-ink-2 leading-snug">
            {copy.body}
          </div>
          {copy.deadlineLabel && (
            <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-warn">
              {copy.deadlineLabel}
            </div>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        className="w-full h-9 rounded-[10px] bg-brand text-white font-semibold text-[12.5px] inline-flex items-center justify-center gap-1.5 hover:opacity-90"
      >
        {copy.primaryCta}
        <ChevronRight size={13} strokeWidth={2.2} />
      </button>
    </div>
  )
}
