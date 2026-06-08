import { useEffect, useRef } from 'react'
import { Check } from 'lucide-react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'

// Genuine change-of-mind reasons route to the change-of-mind track. The four
// `redirect: true` reasons signal a faulty / incorrect / incomplete item —
// picking one must NOT continue down the change-of-mind path (a faulty device
// on the no-fault refund track means substantial delays). They live in the
// same list so we can catch them from any flow and steer the customer to the
// right track — see routeForReason + the switch callout below + ClaimFlow's
// CTA swap. "Other" sits last.
export const REASONS = [
  { id: 'no_fit', label: "Didn't suit my needs" },
  { id: 'expectations', label: "Didn't meet my expectations" },
  { id: 'better_option', label: 'Found a better option elsewhere' },
  { id: 'not_needed', label: 'No longer needed' },
  { id: 'arrived_late', label: 'Arrived too late' },
  { id: 'mistake', label: 'Ordered by mistake' },
  { id: 'changed_mind', label: 'Changed my mind' },
  { id: 'defective', label: "Item is defective or doesn't work", redirect: true },
  { id: 'wrong_item', label: 'Wrong item was sent', redirect: true },
  { id: 'damaged', label: 'Arrived damaged', redirect: true },
  { id: 'missing_parts', label: 'Missing or broken parts', redirect: true },
  { id: 'other', label: 'Other' },
]

// Label map shared with Step6Review + lib/claims (single source for the copy).
export const REASON_LABELS = Object.fromEntries(
  REASONS.map((r) => [r.id, r.label]),
)

// Reasons that signal a problem with the item rather than a genuine change of
// mind. These never persist as a change-of-mind claim — they redirect.
export const REDIRECT_REASON_IDS = new Set(
  REASONS.filter((r) => r.redirect).map((r) => r.id),
)

// CTA copy when the chosen reason routes to a different track than the flow
// the customer is currently in.
export const SWITCH_CTA_LABELS = {
  change_of_mind: 'Switch to a refund',
  issue: 'Switch to repair & return',
  warranty: 'Switch to a warranty claim',
  compensation: 'Switch to compensation',
}

// The track a reason belongs to, given the flow it was picked in and the
// order. This is the single routing authority for the reason step.
//   - Missing / broken parts → compensation, always (keep the item, get
//     compensated for the part).
//   - Genuine reasons (incl. "other") → change of mind.
//   - Fault / wrong item: if the customer is already inside an issue/warranty
//     flow we leave them there (only catch the clear cross-track mistakes);
//     if they're in the change-of-mind flow we route to the warranty flow
//     when the order has Revibe Care, otherwise to the issue flow.
export function routeForReason(reasonId, claimType, order) {
  if (reasonId === 'missing_parts') return 'compensation'
  if (!REDIRECT_REASON_IDS.has(reasonId)) return 'change_of_mind'
  if (claimType === 'issue' || claimType === 'warranty') return claimType
  return (order?.warranty ?? 0) > 0 ? 'warranty' : 'issue'
}

// Pre-fills the issue-details scope when a fault reason routes into the
// issue/warranty flow, so we don't ask "what's wrong" twice.
export function scopeForReason(reasonId) {
  if (reasonId === 'defective' || reasonId === 'damaged') return 'not_working'
  if (reasonId === 'wrong_item') return 'wrong_device'
  return null
}

export default function Step2Reason({ state, dispatch, error }) {
  const { value, otherText } = state.reason
  const errorRef = useRef(null)

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'center' })
  }, [error])

  return (
    <>
      <StepHeading
        title="Why are you returning it?"
        subtitle="Pick the reason that fits best — this helps us route your return correctly."
      />
      <div className="px-4 flex flex-col gap-2">
        {error === 'reason' && (
          <InlineError className="mb-0.5">
            Pick a reason to continue.
          </InlineError>
        )}
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
                  : error === 'reason'
                    ? 'border-danger bg-surface'
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
              ref={error === 'reasonOther' ? errorRef : null}
              value={otherText}
              maxLength={200}
              onChange={(e) =>
                dispatch({
                  type: 'SET_REASON',
                  value: { otherText: e.target.value },
                })
              }
              placeholder="Tell us a bit more"
              className={`w-full rounded-[12px] border bg-surface px-3.5 py-3 text-[14px] text-ink placeholder:text-muted resize-none min-h-[88px] outline-none focus:border-brand ${
                error === 'reasonOther' ? 'border-danger' : 'border-line'
              }`}
            />
            <div className="mt-1 flex items-center justify-between">
              {error === 'reasonOther' ? (
                <InlineError>Tell us a bit more to continue.</InlineError>
              ) : (
                <span />
              )}
              <span className="text-[11px] text-muted tabular-nums">
                {otherText.length}/200
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
