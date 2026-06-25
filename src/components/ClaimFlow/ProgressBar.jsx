import { progressFor } from './flowReducer'

// Macro-step progress. The decision phase is a single "Step 1" segment whose
// fill grows across its sub-screens (situation → … → remedy); every later step
// is its own segment. Per-path — no hardcoded total.
export default function ProgressBar({ state }) {
  const { macroCount, macroIndex, subCount, subIndex } = progressFor(state)
  return (
    <div className="px-4 pb-3">
      <div className="flex gap-1">
        {Array.from({ length: macroCount }, (_, i) => {
          const seg = i + 1
          const fill =
            seg < macroIndex
              ? 100
              : seg === macroIndex
                ? (subIndex / subCount) * 100
                : 0
          return (
            <span
              key={seg}
              className="flex-1 h-1 rounded-full bg-line overflow-hidden"
            >
              <span
                className="block h-full rounded-full bg-brand transition-[width] duration-300"
                style={{ width: `${fill}%` }}
              />
            </span>
          )
        })}
      </div>
      <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
        Step {macroIndex} of {macroCount}
      </div>
    </div>
  )
}
