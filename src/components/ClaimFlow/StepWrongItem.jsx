import { useEffect, useRef } from 'react'
import { Check, CornerDownRight } from 'lucide-react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'
import { WRONG_ITEM_DETAILS } from './issueTaxonomy'

// Sentinel subtype id for the "it's actually a fault" tripwire — ClaimFlow
// intercepts it to open the switch sheet to the device_fault branch
// (RETURNS-FLOW-SPEC §5, wrong_item row). Never persists on a claim.
export const WRONG_ITEM_FAULT_TRIP = 'wi_fault'

// wrong_item branch, screen 1 — how the device differs from what was ordered
// (RETURNS-FLOW-SPEC §4 C). A fault-like description tripwires to device_fault.
export default function StepWrongItem({ state, dispatch, error }) {
  const errorRef = useRef(null)
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'center' })
  }, [error])

  const select = (scope, id) =>
    dispatch({
      type: 'SET_ISSUE_SUBTYPE',
      scope,
      id: state.issueSubtypeId === id ? null : id,
    })

  return (
    <>
      <StepHeading
        title="What's wrong with it?"
        subtitle="Tell us how it differs from what you ordered."
      />
      <div className="px-4 flex flex-col gap-2">
        {error === 'subtype' && (
          <InlineError className="mb-0.5">Pick an option to continue.</InlineError>
        )}
        <div ref={error === 'subtype' ? errorRef : null} className="flex flex-col gap-2">
          {WRONG_ITEM_DETAILS.map((d) => (
            <Row
              key={d.id}
              label={d.label}
              selected={state.issueSubtypeId === d.id}
              onClick={() => select('wrong_device', d.id)}
            />
          ))}
        </div>

        <Divider>or</Divider>

        <Row
          label="It's faulty or damaged, not the wrong item"
          selected={state.issueSubtypeId === WRONG_ITEM_FAULT_TRIP}
          tripwire
          onClick={() => select('wrong_device', WRONG_ITEM_FAULT_TRIP)}
        />
      </div>
    </>
  )
}

function Row({ label, selected, tripwire = false, onClick }) {
  const base =
    'w-full text-left rounded-[12px] border px-3.5 py-3 flex items-center gap-3 transition-colors'
  const tone = tripwire
    ? selected
      ? 'border-warn bg-warn-bg/50 border-dashed'
      : 'border-warn/45 bg-surface border-dashed hover:bg-warn-bg/30'
    : selected
      ? 'border-brand bg-brand-bg/40'
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
