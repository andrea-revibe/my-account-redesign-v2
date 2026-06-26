import { useEffect, useRef } from 'react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'
import IssueEvidence from './IssueEvidence'
import BatteryHealthCheck from './BatteryHealthCheck'
import { evidenceSubFor } from './issueTaxonomy'

// Evidence step (steps 4–9, behaviour unchanged) — proof card + uploader +
// description, plus the optional battery self-check. The specific issue is
// already chosen upstream (specific / wrongitem); this resolves its evidence
// contract via evidenceSubFor and only gates proof + description.
export default function StepEvidence({ state, dispatch, order, error }) {
  const { description } = state.issueDetails
  const sub = state.issueSubtypeId ? evidenceSubFor(state.issueSubtypeId, order) : null

  const errorRef = useRef(null)
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  return (
    <>
      <StepHeading
        title="Show us the issue"
        subtitle="Add proof and a short description so quality check knows what to look for."
      />

      <div className="px-4 flex flex-col gap-4">
        <IssueEvidence
          sub={sub}
          order={order}
          state={state}
          dispatch={dispatch}
          error={error}
          uploaderRef={error === 'attachment' ? errorRef : null}
        />

        {state.issueSubtypeId === 'battery_drain' && order && (
          <BatteryHealthCheck
            order={order}
            value={state.batteryCheck}
            onChange={(value) => dispatch({ type: 'SET_BATTERY_CHECK', value })}
          />
        )}

        <section
          className="flex flex-col gap-2"
          ref={error === 'description' ? errorRef : null}
        >
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            Describe the issue
          </div>
          <textarea
            value={description}
            maxLength={500}
            onChange={(e) =>
              dispatch({
                type: 'SET_ISSUE_DETAILS',
                value: { description: e.target.value },
              })
            }
            placeholder="What happens, when it started, anything you've already tried…"
            className={`w-full rounded-[12px] border bg-surface px-3.5 py-3 text-[14px] text-ink placeholder:text-muted resize-none min-h-[112px] outline-none ${
              error === 'description'
                ? 'border-danger focus:border-danger'
                : 'border-line focus:border-brand'
            }`}
          />
          <div className="flex items-center justify-between gap-2">
            {error === 'description' ? (
              <InlineError>
                Add a short description so quality check knows what to look for.
              </InlineError>
            ) : (
              <span />
            )}
            <div className="text-right text-[11px] text-muted tabular-nums shrink-0">
              {description.length}/500
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
