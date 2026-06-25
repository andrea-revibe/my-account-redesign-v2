import { ChevronRight, CornerDownRight } from 'lucide-react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'
import { ISSUE_CATEGORIES } from './issueTaxonomy'

// Sentinel issueCategory for the "device is fine, I just don't want it"
// tripwire — ClaimFlow intercepts it to open the switch sheet to the
// change_of_mind branch. Never persists on a claim.
export const CATEGORY_COM_TRIP = 'cat_changed_mind'

// device_fault branch, screen 1 — six recognisable categories (RETURNS-FLOW-SPEC
// §4 B1). The customer drills into ≤5 specific issues next. A "nothing's
// actually wrong, I just don't want it" tripwire steers genuine change-of-mind
// returns out of the fault branch.
export default function StepIssueCategory({ state, dispatch, error }) {
  return (
    <>
      <StepHeading
        title="What kind of problem?"
        subtitle="Pick the area that's affected — we'll get specific next."
      />
      <div className="px-4 flex flex-col gap-2">
        {error === 'category' && (
          <InlineError className="mb-0.5">Pick an option to continue.</InlineError>
        )}
        {ISSUE_CATEGORIES.map((c) => {
          const selected = state.issueCategory === c.id
          const Icon = c.icon
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={selected}
              onClick={() => dispatch({ type: 'SET_CATEGORY', value: c.id })}
              className={`w-full text-left rounded-[14px] border px-4 py-3.5 flex items-center gap-3 transition-colors ${
                selected
                  ? 'border-brand bg-brand-bg/50 ring-2 ring-brand/10'
                  : 'border-line bg-surface hover:bg-line-2/40'
              }`}
            >
              <span
                className={`w-10 h-10 rounded-[10px] grid place-items-center shrink-0 ${
                  selected ? 'bg-brand text-white' : 'bg-brand-bg text-brand'
                }`}
              >
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <span className="flex-1 min-w-0 text-[14.5px] font-semibold text-ink leading-[1.25]">
                {c.label}
              </span>
              <ChevronRight size={16} strokeWidth={1.75} className="text-muted shrink-0" />
            </button>
          )
        })}

        <Divider>or</Divider>

        <button
          type="button"
          aria-pressed={state.issueCategory === CATEGORY_COM_TRIP}
          onClick={() => dispatch({ type: 'SET_CATEGORY', value: CATEGORY_COM_TRIP })}
          className={`w-full text-left rounded-[14px] border border-dashed px-4 py-3.5 flex items-center gap-3 transition-colors ${
            state.issueCategory === CATEGORY_COM_TRIP
              ? 'border-warn bg-warn-bg/50'
              : 'border-warn/45 bg-surface hover:bg-warn-bg/30'
          }`}
        >
          <span className="flex-1 text-[14px] font-medium text-warn leading-[1.3]">
            It works fine, it's just not good enough for me
          </span>
          <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-[0.04em] text-warn shrink-0">
            <CornerDownRight size={12} strokeWidth={2.5} />
            Switch
          </span>
        </button>
      </div>
    </>
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
