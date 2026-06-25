import { useEffect, useRef, forwardRef } from 'react'
import { Check } from 'lucide-react'
import InlineError from './InlineError'
import {
  categoryById,
  visibleIssuesFor,
  labelForIssue,
  scopeForIssue,
  SOMETHING_ELSE_ID,
} from './issueTaxonomy'

// device_fault branch, screen 2 — the specific issue within the chosen
// category (RETURNS-FLOW-SPEC §4 B2). Pure selection; evidence is captured on
// the later evidence step. The category stays in the header for orientation.
export default function StepIssueSpecific({ state, dispatch, order, error }) {
  const category = categoryById(state.issueCategory)
  const errorRef = useRef(null)

  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ block: 'center' })
  }, [error])

  // The "Something else" category is a free-text capture (and, in production, a
  // switch-trigger point). Pin the subtype so the downstream evidence/review
  // steps have something to read; the description is the gated field.
  const freeText = category?.freeText
  useEffect(() => {
    if (freeText && state.issueSubtypeId !== SOMETHING_ELSE_ID) {
      dispatch({ type: 'SET_ISSUE_SUBTYPE', scope: 'not_working', id: SOMETHING_ELSE_ID })
    }
  }, [freeText, state.issueSubtypeId, dispatch])

  return (
    <>
      <Header
        eyebrow={category?.label}
        title={freeText ? 'Tell us what’s going on' : 'What’s happening?'}
        subtitle={
          freeText
            ? "Describe the problem in your own words — an agent will pick it up."
            : 'Pick the closest match.'
        }
      />

      <div className="px-4 flex flex-col gap-2">
        {freeText ? (
          <FreeText
            ref={error === 'description' ? errorRef : null}
            value={state.issueDetails.description}
            error={error === 'description'}
            onChange={(v) =>
              dispatch({ type: 'SET_ISSUE_DETAILS', value: { description: v } })
            }
          />
        ) : (
          <>
            {error === 'subtype' && (
              <InlineError className="mb-0.5">
                Pick what's happening to continue.
              </InlineError>
            )}
            <div ref={error === 'subtype' ? errorRef : null} className="flex flex-col gap-2">
              {visibleIssuesFor(state.issueCategory, order).map((issue) => {
                const selected = state.issueSubtypeId === issue.id
                return (
                  <button
                    key={issue.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() =>
                      dispatch({
                        type: 'SET_ISSUE_SUBTYPE',
                        scope: scopeForIssue(issue.id),
                        id: selected ? null : issue.id,
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
                      {selected && <Check size={11} strokeWidth={3} className="text-white" />}
                    </span>
                    <span className="text-[14px] text-ink">
                      {labelForIssue(issue, order)}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    </>
  )
}

// forwardRef so the error scroll target works on the textarea.
const FreeText = forwardRef(function FreeText({ value, error, onChange }, ref) {
  return (
    <div>
      <textarea
        ref={ref}
        value={value}
        maxLength={500}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What happens, when it started, anything you've already tried…"
        className={`w-full rounded-[12px] border bg-surface px-3.5 py-3 text-[14px] text-ink placeholder:text-muted resize-none min-h-[120px] outline-none ${
          error ? 'border-danger focus:border-danger' : 'border-line focus:border-brand'
        }`}
      />
      <div className="mt-1 flex items-center justify-between gap-2">
        {error ? (
          <InlineError>Add a short description to continue.</InlineError>
        ) : (
          <span />
        )}
        <span className="text-[11px] text-muted tabular-nums">{value.length}/500</span>
      </div>
    </div>
  )
})

function Header({ eyebrow, title, subtitle }) {
  return (
    <div className="px-4 pt-1 pb-5">
      {eyebrow && (
        <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-brand mb-1.5">
          {eyebrow}
        </div>
      )}
      <h1 className="m-0 text-[24px] leading-[1.15] font-bold text-ink tracking-[-0.01em]">
        {title}
      </h1>
      {subtitle && (
        <p className="mt-2 text-[13.5px] leading-[1.45] text-muted">{subtitle}</p>
      )}
    </div>
  )
}
