import { CalendarCheck } from 'lucide-react'

// The claim's estimated resolution window plus the line explaining what the
// wait is for. Shared by ClaimCard and WarrantyClaimCard, in the same strip
// grammar as ScheduledPickupStrip / RepairWindowStrip: top rule, uppercase
// label, toned icon + bold value, muted sub-copy.
//
// Callers pass `claimErdFor(order)` straight through and render this
// unconditionally — every suppression rule (action gates, post-verdict
// statuses, missing milestones) lives in that resolver, so there are no
// card-level guards to keep in sync. See lib/claimErd.js.
export default function ClaimErdStrip({ erd, toneText, className = '' }) {
  if (!erd?.label) return null
  return (
    <div
      className={`mt-3 pt-3 border-t border-line-2/70 flex flex-col gap-1.5 ${className}`}
    >
      <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
        {erd.overdue ? 'Updated resolution estimate' : 'Estimated resolution'}
      </div>
      <div className="flex items-start gap-1.5 text-[12px] text-ink-2">
        <CalendarCheck
          size={13}
          strokeWidth={2}
          className={`${toneText} shrink-0 mt-px`}
        />
        <span className="font-semibold leading-[1.3]">{erd.label}</span>
      </div>
      {erd.explanation && (
        <div className="text-[11.5px] text-ink-2/90 leading-snug">
          {erd.explanation}
        </div>
      )}
    </div>
  )
}
