import { Check } from 'lucide-react'
import { STATUSES, progressIndex } from '../lib/statuses'

// Horizontal step indicator. Renders one circle per entry in STATUSES, so
// adding a phase-2 status is a one-line change in lib/statuses.js.
export default function StatusTimeline({ currentStatusId, timeline = {} }) {
  const current = progressIndex(currentStatusId)

  return (
    <ol className="flex items-start justify-between gap-1">
      {STATUSES.map((s, i) => {
        const reached = i <= current
        const isCurrent = i === current
        return (
          <li
            key={s.id}
            className="flex-1 flex flex-col items-center text-center relative"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute top-3 right-1/2 w-full h-0.5 ${
                  reached ? 'bg-brand' : 'bg-line/70'
                }`}
              />
            )}
            <span
              className={`relative z-10 grid place-items-center w-6 h-6 rounded-full ${
                reached
                  ? 'bg-brand text-white'
                  : 'bg-white border border-line text-line'
              }`}
            >
              {reached ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-line" />
              )}
            </span>
            <span
              className={`mt-2 text-small leading-tight ${
                isCurrent
                  ? 'font-bold text-ink'
                  : reached
                  ? 'text-ink'
                  : 'text-muted'
              }`}
            >
              {s.label}
            </span>
            {timeline[s.id] && reached && (
              <span className="mt-1 text-[11px] leading-tight text-muted whitespace-pre-line">
                {timeline[s.id]}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}
