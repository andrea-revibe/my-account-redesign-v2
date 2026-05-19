import { visibleStepCount, visibleStepIndex } from './flowReducer'

export default function ProgressBar({ step, claimType }) {
  const total = visibleStepCount(claimType)
  const current = visibleStepIndex(step, claimType)
  return (
    <div className="px-4 pb-3">
      <div className="flex gap-1">
        {Array.from({ length: total }, (_, i) => {
          const idx = i + 1
          const reached = idx <= current
          return (
            <span
              key={idx}
              className={`flex-1 h-1 rounded-full transition-colors ${
                reached ? 'bg-brand' : 'bg-line'
              }`}
            />
          )
        })}
      </div>
      <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
        Step {current} of {total}
      </div>
    </div>
  )
}
