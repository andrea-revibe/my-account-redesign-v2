import { Check } from 'lucide-react'
import StepHeading from './StepHeading'

const REASONS = [
  { id: 'no_fit', label: "Didn't suit my needs" },
  { id: 'better_option', label: 'Found a better option elsewhere' },
  { id: 'changed_mind', label: 'Changed my mind' },
  { id: 'mistake', label: 'Ordered by mistake' },
  { id: 'other', label: 'Other' },
]

export default function Step4Reason({ state, dispatch }) {
  const { value, otherText } = state.reason

  return (
    <>
      <StepHeading
        title="Why are you returning it?"
        subtitle="Optional — this helps us improve. Skip if you'd rather not say."
      />
      <div className="px-4 flex flex-col gap-2">
        {REASONS.map((r) => {
          const selected = value === r.id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() =>
                dispatch({
                  type: 'SET_REASON',
                  value: { value: selected ? null : r.id },
                })
              }
              className={`w-full text-left rounded-[12px] border px-3.5 py-3 flex items-center gap-3 transition-colors ${
                selected
                  ? 'border-brand bg-brand-bg/40'
                  : 'border-line bg-surface hover:bg-line-2/40'
              }`}
            >
              <span
                aria-hidden
                className={`w-[18px] h-[18px] rounded-full border-2 grid place-items-center shrink-0 ${
                  selected ? 'border-brand bg-brand' : 'border-line'
                }`}
              >
                {selected && (
                  <Check size={11} strokeWidth={3} className="text-white" />
                )}
              </span>
              <span className="text-[14px] text-ink">{r.label}</span>
            </button>
          )
        })}

        {value === 'other' && (
          <div className="mt-1 animate-slideDown">
            <textarea
              value={otherText}
              maxLength={200}
              onChange={(e) =>
                dispatch({
                  type: 'SET_REASON',
                  value: { otherText: e.target.value },
                })
              }
              placeholder="Tell us a bit more (optional)"
              className="w-full rounded-[12px] border border-line bg-surface px-3.5 py-3 text-[14px] text-ink placeholder:text-muted resize-none min-h-[88px] outline-none focus:border-brand"
            />
            <div className="mt-1 text-right text-[11px] text-muted tabular-nums">
              {otherText.length}/200
            </div>
          </div>
        )}
      </div>
    </>
  )
}
