import { Check } from 'lucide-react'
import {
  SHIPPING_SUB_STATUSES,
  subProgressIndex,
} from '../lib/statuses'

// Vertical sub-timeline shown only while statusId === 'shipped'. Each row
// is one sub-status; reached/current/future are styled differently.
export default function ShippingSubTimeline({ subStatusId, subTimeline = {} }) {
  const current = subProgressIndex(subStatusId)

  return (
    <section className="rounded-card border border-line/60 p-4">
      <p className="text-section font-bold text-ink mb-4">Shipping progress</p>
      <ol className="space-y-0">
        {SHIPPING_SUB_STATUSES.map((s, i) => {
          const reached = i <= current
          const isCurrent = i === current
          const isLast = i === SHIPPING_SUB_STATUSES.length - 1
          const Icon = s.icon
          return (
            <li key={s.id} className="flex gap-3 relative">
              <div className="flex flex-col items-center">
                <span
                  className={`relative z-10 grid place-items-center w-9 h-9 rounded-full shrink-0 ${
                    reached
                      ? isCurrent
                        ? 'bg-brand text-white'
                        : 'bg-brand/15 text-brand'
                      : 'bg-white border border-line text-line'
                  }`}
                >
                  {reached && !isCurrent ? (
                    <Check size={16} strokeWidth={3} />
                  ) : (
                    <Icon size={16} strokeWidth={2} />
                  )}
                </span>
                {!isLast && (
                  <span
                    aria-hidden
                    className={`flex-1 w-0.5 my-1 min-h-[20px] ${
                      i < current ? 'bg-brand/40' : 'bg-line/70'
                    }`}
                  />
                )}
              </div>
              <div className={`pb-4 flex-1 ${isLast ? 'pb-0' : ''}`}>
                <p
                  className={`text-body ${
                    isCurrent
                      ? 'font-bold text-ink'
                      : reached
                      ? 'text-ink'
                      : 'text-muted'
                  }`}
                >
                  {s.label}
                </p>
                {subTimeline[s.id] && reached && (
                  <p className="text-small text-muted mt-0.5">
                    {subTimeline[s.id]}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
