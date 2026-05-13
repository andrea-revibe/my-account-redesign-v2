import { TOTAL_STEPS } from './flowReducer'

export default function ProgressBar({ step }) {
  return (
    <div className="px-4 pb-3">
      <div className="flex gap-1">
        {Array.from({ length: TOTAL_STEPS }, (_, i) => {
          const idx = i + 1
          const reached = idx <= step
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
        Step {step} of {TOTAL_STEPS}
      </div>
    </div>
  )
}
