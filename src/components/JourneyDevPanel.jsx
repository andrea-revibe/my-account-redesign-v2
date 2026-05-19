import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'

// Fixed bottom-right dev tool — only rendered in journey mode. Sits outside
// the mobile frame on wide viewports; overlaps the frame on narrow ones
// (acceptable for a demo tool — no minimise affordance yet).
//
// The picker chip row at the top lets stakeholders switch between top-level
// journeys (happy path, cancel-at-qc, etc.). The step counter / dots track
// the path length rather than `nodes.length` — total varies by branch so a
// fixed denominator would mislead. The back button next to the step
// counter steps one node back along the visited path.
export default function JourneyDevPanel({
  nodes,
  currentNodeId,
  currentIndex,
  validNext,
  advance,
  back,
  reset,
  journeys,
  activeJourneyId,
  onSelectJourney,
}) {
  const current = nodes[currentIndex] ?? nodes.find((n) => n.id === currentNodeId)
  const nexts = validNext()
  const isComplete = nexts.length === 0
  const stepNumber = currentIndex + 1
  const atStart = currentIndex === 0

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] bg-surface border border-line rounded-2xl shadow-lg p-4">
      {journeys && journeys.length > 1 && (
        <div className="flex items-center gap-1.5 mb-3 -mt-0.5">
          {journeys.map((j) => {
            const active = j.id === activeJourneyId
            return (
              <button
                key={j.id}
                onClick={() => onSelectJourney(j.id)}
                className={
                  'flex-1 px-2 py-1 rounded-full text-[10.5px] font-semibold uppercase tracking-[0.04em] transition ' +
                  (active
                    ? 'bg-brand text-white'
                    : 'bg-brand/10 text-brand hover:bg-brand/15')
                }
              >
                {j.label}
              </button>
            )
          })}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <DotStrip count={stepNumber} />
        <div className="flex items-center gap-1 ml-auto">
          <button
            onClick={back}
            disabled={atStart}
            aria-label="Previous step"
            className="w-6 h-6 rounded-full grid place-items-center text-muted hover:text-ink hover:bg-line-2 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
          >
            <ChevronLeft size={14} strokeWidth={2.25} />
          </button>
          <span className="text-[11px] font-medium text-muted">
            Step {stepNumber}
          </span>
        </div>
      </div>

      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted mb-1">
        Journey mode · current state
      </div>
      <div className="text-[15px] font-semibold text-ink leading-tight">
        {current?.label}
      </div>
      <div className="flex items-center gap-1.5 mt-1.5 mb-3">
        <TriggerChip trigger={current?.trigger} />
        <code className="text-[11px] text-muted font-mono truncate">
          {current?.event}
        </code>
      </div>

      {isComplete ? (
        <div className="rounded-xl bg-green-50 text-success text-[12px] font-medium px-3 py-2 mb-2 text-center">
          Journey complete
        </div>
      ) : (
        nexts.map((node) => {
          const isCustomer = node.trigger === 'customer'
          return (
            <button
              key={node.id}
              onClick={() => advance(node.id)}
              className={
                'w-full flex items-start justify-between gap-2 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition mb-2 ' +
                (isCustomer
                  ? 'bg-surface text-brand border border-brand hover:bg-brand/5'
                  : 'bg-brand text-white hover:bg-brand/90')
              }
            >
              <span className="flex-1 text-left whitespace-normal break-words">
                {isCustomer && (
                  <span
                    className={
                      'inline-block mr-1.5 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-[0.06em] align-[2px] ' +
                      'bg-brand/10 text-brand'
                    }
                  >
                    via UI
                  </span>
                )}
                Next: {node.label}
              </span>
              <ChevronRight size={16} strokeWidth={2.25} className="mt-0.5 shrink-0" />
            </button>
          )
        })
      )}

      <button
        onClick={reset}
        disabled={atStart}
        className="w-full flex items-center justify-center gap-1.5 text-[12px] text-muted hover:text-ink disabled:opacity-40 disabled:hover:text-muted py-1.5"
      >
        <RotateCcw size={13} strokeWidth={2} />
        Reset journey
      </button>
    </div>
  )
}

// Dots grow with the path — one filled dot per step taken. No fixed total
// (branched journeys have multiple terminal-path lengths). Capped visually
// at 14 to avoid the strip eating the whole panel width.
function DotStrip({ count }) {
  const dots = Math.min(count, 14)
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: dots }).map((_, i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-brand" />
      ))}
    </div>
  )
}

function TriggerChip({ trigger }) {
  const isSystem = trigger === 'system'
  return (
    <span
      className={
        'inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.04em] ' +
        (isSystem
          ? 'bg-brand/10 text-brand'
          : 'bg-accent/10 text-accent')
      }
    >
      {trigger}
    </span>
  )
}
