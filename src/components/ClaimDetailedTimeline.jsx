import { Check, AlertTriangle } from 'lucide-react'
import {
  detailedSteps,
  parseDisplayDate,
  DEMO_NOW,
} from '../lib/claims'

// Vertical timeline rendered inside ClaimCard's expanded state when the
// user toggles "Show detailed tracking." Past parents collapse to a
// single line; the current parent expands with any branch sub-steps;
// future parents show a relative estimate. See docs/claim_detailed_tracking.md
// § 7.2 for the model and § 7.3 for the delayed treatment.
export default function ClaimDetailedTimeline({ claim, order, now = DEMO_NOW }) {
  const rows = detailedSteps(claim, order, now)
  if (!rows.length) return null
  return (
    <ol className="flex flex-col">
      {rows.map((row, i) => (
        <ParentRow
          key={row.id}
          row={row}
          isFirst={i === 0}
          isLast={i === rows.length - 1}
          now={now}
        />
      ))}
    </ol>
  )
}

function ParentRow({ row, isFirst, isLast, now }) {
  const hasActiveSub = row.subSteps.some((s) => s.state === 'current')
  // Defer the delayed signal to the sub-step when one is active — avoids
  // double-signaling at the parent level.
  const showParentDelayed = row.isDelayed && !hasActiveSub

  return (
    <li className="flex">
      <Rail
        state={row.state}
        delayed={showParentDelayed}
        isFirst={isFirst}
        isLast={isLast}
      />
      <div className="flex-1 ml-2.5 min-w-0 pb-1.5">
        <ParentHeader
          row={row}
          delayed={showParentDelayed}
          hasActiveSub={hasActiveSub}
          now={now}
        />
        {row.subSteps.length > 0 && (
          <ul className="mt-2 flex flex-col gap-1.5">
            {row.subSteps.map((sub) => (
              <SubRow key={sub.id} sub={sub} now={now} />
            ))}
          </ul>
        )}
      </div>
    </li>
  )
}

function Rail({ state, delayed, isFirst, isLast }) {
  let dotClass = 'bg-line border border-line'
  let icon = null
  if (state === 'past') {
    dotClass = 'bg-success'
    icon = <Check size={9} strokeWidth={3} className="text-white" />
  } else if (state === 'current') {
    dotClass = delayed ? 'bg-warn' : 'bg-brand'
    icon = <span className="w-1.5 h-1.5 bg-white rounded-full" />
  }
  const railClass =
    state === 'past'
      ? 'bg-success/40'
      : state === 'current'
        ? 'bg-line'
        : 'bg-line'
  return (
    <div className="flex flex-col items-center w-[18px] shrink-0">
      <div className={`w-px flex-1 ${isFirst ? 'invisible' : railClass}`} />
      <div
        className={`grid place-items-center w-[16px] h-[16px] rounded-full ${dotClass} my-1`}
      >
        {icon}
      </div>
      <div className={`w-px flex-1 ${isLast ? 'invisible' : railClass}`} />
    </div>
  )
}

function ParentHeader({ row, delayed, hasActiveSub, now }) {
  const labelColor =
    row.state === 'current'
      ? delayed
        ? 'text-warn'
        : 'text-brand'
      : row.state === 'past'
        ? 'text-ink-2'
        : 'text-muted'
  const labelSize =
    row.state === 'current'
      ? 'text-[13px] font-bold'
      : 'text-[12px] font-semibold'

  const rightMeta = parentRightMeta(row, hasActiveSub, now)

  return (
    <div className="flex items-baseline justify-between gap-2 pt-1.5">
      <span className={`${labelSize} ${labelColor} tracking-[-0.01em]`}>
        {row.label}
      </span>
      <span className="text-[10.5px] tabular-nums text-muted shrink-0 leading-tight">
        {row.state === 'current' && delayed ? (
          <span className="text-warn font-semibold inline-flex items-center gap-1">
            <AlertTriangle size={10} strokeWidth={2.4} />
            Taking longer than usual
          </span>
        ) : (
          rightMeta
        )}
      </span>
    </div>
  )
}

function parentRightMeta(row, hasActiveSub, now) {
  if (row.state === 'past') {
    const dur = durationBetween(row.startedAt, row.completedAt)
    return dur ? `Done · ${dur}` : 'Done'
  }
  if (row.state === 'future') {
    return relativeEstimate(row.expectedRelativeHours)
  }
  // current — let the active sub-step carry the ETA when present
  if (hasActiveSub) return null
  if (!row.expectedBy) return null
  if (row.expectedBy > now) {
    return `Expected by ${formatShortDateTime(row.expectedBy)}`
  }
  return relativeEstimate(row.expectedRelativeHours)
}

function SubRow({ sub, now }) {
  const isCurrent = sub.state === 'current'
  const isDelayed = sub.isDelayed
  const tone = isDelayed ? 'warn' : sub.tone

  const wrapClass = isCurrent
    ? tone === 'warn'
      ? 'border-[#ffe3b8] bg-warn-bg'
      : tone === 'success'
        ? 'border-[#c6ebd9] bg-success-bg'
        : 'border-brand-bg2 bg-brand-bg'
    : 'border-line bg-line-2'

  const headlineColor = isCurrent
    ? tone === 'warn'
      ? 'text-warn'
      : tone === 'success'
        ? 'text-success'
        : 'text-brand'
    : 'text-ink-2'

  const dateLabel = isCurrent
    ? null
    : sub.startedAt
      ? shortDay(sub.startedAt)
      : ''

  return (
    <li className={`rounded-[10px] border px-2.5 py-2 ${wrapClass}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[11.5px] font-bold ${headlineColor} truncate`}>
          {sub.headline}
        </span>
        {dateLabel && (
          <span className="text-[10px] tabular-nums text-muted shrink-0">
            {dateLabel}
          </span>
        )}
      </div>
      {sub.subline && (
        <div className="mt-0.5 text-[10.5px] text-ink-2 leading-snug">
          {sub.subline}
        </div>
      )}
      {isCurrent && (
        <div className="mt-1 text-[10px] tabular-nums leading-tight">
          {isDelayed ? (
            <span className="text-warn font-semibold inline-flex items-center gap-1">
              <AlertTriangle size={9} strokeWidth={2.4} />
              Taking longer than usual
            </span>
          ) : sub.expectedBy && sub.expectedBy > now ? (
            <span className="text-muted">
              Expected by {formatShortDateTime(sub.expectedBy)}
            </span>
          ) : sub.startedAt ? (
            <span className="text-muted">Started {shortDay(sub.startedAt)}</span>
          ) : null}
        </div>
      )}
    </li>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────

function shortDay(displayDate) {
  if (!displayDate) return ''
  const idx = displayDate.indexOf(' · ')
  return idx > 0 ? displayDate.slice(0, idx) : displayDate
}

function relativeEstimate(hours) {
  if (!hours) return ''
  if (hours < 24) return `Usually ~${hours}h`
  const days = Math.max(1, Math.round(hours / 24))
  return `Usually ~${days}d`
}

function durationBetween(startStr, endStr) {
  const start = parseDisplayDate(startStr)
  const end = parseDisplayDate(endStr)
  if (!start || !end) return ''
  const ms = end - start
  if (ms <= 0) return ''
  const minutes = Math.round(ms / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.max(1, Math.round(hours / 24))
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatShortDateTime(date) {
  if (!date) return ''
  const day = date.getDate()
  const month = MONTHS_SHORT[date.getMonth()]
  let hour = date.getHours()
  const minute = date.getMinutes()
  const am = hour < 12
  hour = hour % 12 || 12
  const minStr = minute.toString().padStart(2, '0')
  return `${day} ${month} · ${hour}:${minStr} ${am ? 'AM' : 'PM'}`
}
