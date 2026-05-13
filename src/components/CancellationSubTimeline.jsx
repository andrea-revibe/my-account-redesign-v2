import { Check } from 'lucide-react'
import { cancellationStepsFor } from '../lib/statuses'

// Vertical sub-timeline rendered inside an expanded cancelled OrderCard.
// Mirrors ShippingSubTimeline's pattern. The created-stage cancellation
// path skips the `requested` step (no supplier check needed); that filtering
// happens in cancellationStepsFor(order).
//
// Tone: danger (red) by default; the final `refunded` step flips to success
// when reached, matching the banner tone resolution in statusDescription.
export default function CancellationSubTimeline({ order }) {
  const steps = cancellationStepsFor(order)
  const current = steps.findIndex((s) => s.id === order.cancellationStatusId)
  const timeline = order.cancellationTimeline || {}

  return (
    <div className="rounded-[14px] border border-line bg-surface p-3.5">
      <h4 className="m-0 mb-3 text-[11.5px] font-bold uppercase tracking-[0.06em] text-muted">
        Cancellation progress
      </h4>
      <ol className="space-y-0">
        {steps.map((s, i) => {
          const reached = i <= current
          const isCurrent = i === current
          const isLast = i === steps.length - 1
          const Icon = s.icon
          const tone =
            s.id === 'refunded' && reached ? 'success' : 'danger'
          const filledBg =
            tone === 'success' ? 'bg-success text-white' : 'bg-danger text-white'
          const softBg =
            tone === 'success'
              ? 'bg-success-bg text-success'
              : 'bg-danger-bg text-danger'
          const nextIsRefunded =
            steps[i + 1] && steps[i + 1].id === 'refunded'
          const connectorReached =
            i < current
              ? nextIsRefunded
                ? 'bg-success/40'
                : 'bg-danger/40'
              : 'bg-line/70'

          return (
            <li key={s.id} className="flex gap-3 relative">
              <div className="flex flex-col items-center">
                <span
                  className={`relative z-10 grid place-items-center w-9 h-9 rounded-full shrink-0 ${
                    reached
                      ? isCurrent
                        ? filledBg
                        : softBg
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
                    className={`flex-1 w-0.5 my-1 min-h-[20px] ${connectorReached}`}
                  />
                )}
              </div>
              <div className={`pb-4 flex-1 ${isLast ? 'pb-0' : ''}`}>
                <p
                  className={`text-[13px] ${
                    isCurrent
                      ? 'font-bold text-ink'
                      : reached
                        ? 'text-ink'
                        : 'text-muted'
                  }`}
                >
                  {s.label}
                </p>
                <p className="text-[11.5px] text-muted mt-0.5">
                  {reached
                    ? timeline[s.id] || (isCurrent ? 'just now' : '')
                    : 'pending'}
                </p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
