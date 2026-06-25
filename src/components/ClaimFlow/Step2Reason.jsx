import { useEffect, useRef } from 'react'
import { Check, CornerDownRight } from 'lucide-react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'

// Change-of-mind branch only. Six no-fault reasons (analytics-grade, no
// branching) — a no-fault return then goes straight to a refund (no remedy
// screen). Fault / wrong-item reasons live in their own situations now; the
// two most common wrong-turns are kept here as visible "tripwires" below a
// divider. Selecting a tripwire does NOT advance — ClaimFlow opens the smart
// "switch?" sheet (see tripwireFor + SwitchFlowSheet). Copy follows
// RETURNS-FLOW-SPEC §4 (branch A) / the wireframe.
export const REASONS = [
  { id: 'didnt_suit', label: "Didn't suit my needs" },
  { id: 'not_expected', label: 'Not what I expected' },
  { id: 'found_better', label: 'Found a better option' },
  { id: 'no_longer_needed', label: 'No longer need it' },
  { id: 'ordered_mistake', label: 'Ordered by mistake' },
  { id: 'arrived_late', label: 'Arrived too late' },
]

// Visible "switch triggers". Selecting one opens the switch sheet to the
// target situation rather than continuing down the change-of-mind track.
export const REASON_TRIPWIRES = [
  {
    id: 'trip_fault',
    label: "It's faulty or not as described",
    situation: 'device_fault',
    scope: 'not_working',
  },
  {
    id: 'trip_wrong',
    label: 'I got the wrong item',
    situation: 'wrong_item',
    scope: 'wrong_device',
  },
]

// Label map shared with Step6Review (single source for the change-of-mind
// reason copy). Tripwire labels are included so a mid-switch summary still
// reads, though a tripwire never persists as a change_of_mind reason.
export const REASON_LABELS = Object.fromEntries(
  [...REASONS, ...REASON_TRIPWIRES].map((r) => [r.id, r.label]),
)

// The tripwire a reason id maps to (situation + pre-filled issue scope), or
// null for a genuine no-fault reason. ClaimFlow reads this to decide whether
// Continue advances or opens the switch sheet.
export function tripwireFor(reasonId) {
  return REASON_TRIPWIRES.find((t) => t.id === reasonId) || null
}

export default function Step2Reason({ state, dispatch, error }) {
  const { value } = state.reason
  const errorRef = useRef(null)

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'center' })
  }, [error])

  const select = (id) =>
    dispatch({
      type: 'SET_REASON',
      value: { value: value === id ? null : id },
    })

  return (
    <>
      <StepHeading
        title="Why are you sending it back?"
        subtitle="Helps us improve — pick the closest reason."
      />
      <div className="px-4 flex flex-col gap-2">
        {error === 'reason' && (
          <InlineError className="mb-0.5" >
            Pick a reason to continue.
          </InlineError>
        )}

        <div ref={error === 'reason' ? errorRef : null} className="flex flex-col gap-2">
          {REASONS.map((r) => (
            <ReasonRow
              key={r.id}
              label={r.label}
              selected={value === r.id}
              error={error === 'reason'}
              onClick={() => select(r.id)}
            />
          ))}
        </div>

        <Divider>or, if it's not really a change of mind</Divider>

        <div className="flex flex-col gap-2">
          {REASON_TRIPWIRES.map((t) => (
            <ReasonRow
              key={t.id}
              label={t.label}
              selected={value === t.id}
              tripwire
              onClick={() => select(t.id)}
            />
          ))}
        </div>
      </div>
    </>
  )
}

function ReasonRow({ label, selected, tripwire = false, error = false, onClick }) {
  const base =
    'w-full text-left rounded-[12px] border px-3.5 py-3 flex items-center gap-3 transition-colors'
  const tone = tripwire
    ? selected
      ? 'border-warn bg-warn-bg/50 border-dashed'
      : 'border-warn/45 bg-surface border-dashed hover:bg-warn-bg/30'
    : selected
      ? 'border-brand bg-brand-bg/40'
      : error
        ? 'border-danger bg-surface'
        : 'border-line bg-surface hover:bg-line-2/40'

  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={`${base} ${tone}`}>
      <span
        aria-hidden
        className={`w-[18px] h-[18px] rounded-full border-2 grid place-items-center shrink-0 ${
          selected
            ? tripwire
              ? 'border-warn bg-warn'
              : 'border-brand bg-brand'
            : tripwire
              ? 'border-warn/60'
              : 'border-line'
        }`}
      >
        {selected && <Check size={11} strokeWidth={3} className="text-white" />}
      </span>
      <span className={`flex-1 text-[14px] ${tripwire ? 'text-warn font-medium' : 'text-ink'}`}>
        {label}
      </span>
      {tripwire && (
        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.04em] text-warn shrink-0">
          <CornerDownRight size={12} strokeWidth={2.5} />
          Switch
        </span>
      )}
    </button>
  )
}

function Divider({ children }) {
  return (
    <div className="flex items-center gap-2.5 my-1.5">
      <span className="h-px flex-1 bg-line" />
      <span className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted">
        {children}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}
