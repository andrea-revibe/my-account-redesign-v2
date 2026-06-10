import { useState } from 'react'
import { MapPin, ChevronDown } from 'lucide-react'

// The "Delivering to / Delivered to" address block shown in the hero of
// InProgressCard, PastOrderCard, WarrantyClaimCard and InvalidClaimCard.
// The label + pill stay on one fixed line; the pill shows the first segment of
// the real address, and tapping reveals the full address on a muted line below
// (so the label never reflows). Whole pill is the tap target.
export default function DeliveryAddressPill({ label, address }) {
  const [expanded, setExpanded] = useState(false)
  const full = address || 'Home'
  const short = full.split(',')[0].trim()
  const canExpand = full !== short

  return (
    <div className="mt-2.5 text-[12px] text-ink-2">
      <div className="flex items-center gap-1.5">
        <span>{label}</span>
        <button
          type="button"
          onClick={() => canExpand && setExpanded((v) => !v)}
          aria-expanded={canExpand ? expanded : undefined}
          className="inline-flex items-center rounded-full border bg-surface text-ink border-line font-semibold whitespace-nowrap h-7 px-2.5 text-[11.5px] gap-1.5"
        >
          <MapPin size={12} strokeWidth={2} className="shrink-0" />
          {short}
          {canExpand && (
            <ChevronDown
              size={12}
              strokeWidth={2}
              className={`shrink-0 text-muted transition-transform ${
                expanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </button>
      </div>
      {canExpand && expanded && (
        <div className="mt-1.5 leading-[1.45] text-muted">{full}</div>
      )}
    </div>
  )
}
