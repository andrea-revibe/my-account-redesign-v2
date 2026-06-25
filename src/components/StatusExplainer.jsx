import { useState } from 'react'
import { Info, ChevronDown } from 'lucide-react'

// Inline "ⓘ Learn more" affordance that sits beside a card's status chip and
// reveals a plain-language definition of the current stage in a full-width
// inset block below the chip row. Pass the chip element via `pill` so the
// component owns the [chip · Learn more] row layout. Lives inside the
// card-header tap target (like ProductSummary's tooltips), so it stops click
// propagation to avoid toggling the card. Copy is resolved by the
// source-of-truth libs (`statusExplanation` in lib/statuses.js,
// `claimExplanation` / `warrantyClaimExplanation` in lib/claims.js). When
// there's no explanation it falls back to rendering the bare pill, so callers
// can always route the chip through here.
export default function StatusExplainer({ pill = null, explanation, label = 'Learn more', className = '' }) {
  const [open, setOpen] = useState(false)
  if (!explanation) return pill
  return (
    <div className={`self-stretch flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        {pill}
        <button
          type="button"
          aria-expanded={open}
          onClick={(e) => {
            e.stopPropagation()
            setOpen((v) => !v)
          }}
          className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-muted hover:text-ink normal-case tracking-normal"
        >
          <Info size={12} strokeWidth={1.75} />
          {label}
          <ChevronDown
            size={12}
            strokeWidth={1.75}
            className={`transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
      {open && (
        <div
          role="region"
          onClick={(e) => e.stopPropagation()}
          className="rounded-[10px] border border-line bg-canvas px-3 py-2.5 text-[12px] leading-[1.45] text-ink-2 font-normal normal-case tracking-normal animate-slideDown"
        >
          {explanation}
        </div>
      )}
    </div>
  )
}
