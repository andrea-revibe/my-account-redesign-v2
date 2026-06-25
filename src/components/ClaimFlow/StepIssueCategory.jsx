import { ChevronRight } from 'lucide-react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'
import { ISSUE_CATEGORIES } from './issueTaxonomy'

// device_fault branch, screen 1 — six recognisable categories (RETURNS-FLOW-SPEC
// §4 B1). The customer drills into ≤5 specific issues next.
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
                  selected ? 'bg-brand text-white' : 'bg-line-2 text-ink-2'
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
      </div>
    </>
  )
}
