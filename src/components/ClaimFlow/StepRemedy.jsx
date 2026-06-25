import { ChevronRight, RotateCcw, Wrench, ArrowLeftRight } from 'lucide-react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'

// Remedy screen — the redesigned "type of return", now AFTER we know the
// issue so the menu only shows eligible outcomes (RETURNS-FLOW-SPEC §4 B3 / C).
// device_fault → refund | repair (never compensation). wrong_item →
// replacement | refund. Each option names the outcome, not the system process.
const REMEDIES = {
  device_fault: [
    {
      id: 'refund',
      icon: RotateCcw,
      title: 'Return for a refund',
      sub: 'Send it back, get your money back',
    },
    {
      id: 'repair',
      icon: Wrench,
      title: 'Repair under warranty',
      sub: 'We fix it and return it to you',
    },
  ],
  wrong_item: [
    {
      id: 'replacement',
      icon: ArrowLeftRight,
      title: 'Get the correct item',
      sub: "We send you the right one — you won't be charged",
    },
    {
      id: 'refund',
      icon: RotateCcw,
      title: 'Return for a refund',
      sub: 'Send it back, get your money back',
    },
  ],
}

export default function StepRemedy({ state, dispatch, error }) {
  const options = REMEDIES[state.situation] || REMEDIES.device_fault
  return (
    <>
      <StepHeading
        title="How would you like us to fix this?"
        subtitle="Based on the issue you described, here's what you can choose."
      />
      <div className="px-4 flex flex-col gap-2">
        {error === 'remedy' && (
          <InlineError className="mb-0.5">Pick an option to continue.</InlineError>
        )}
        {options.map((o) => {
          const selected = state.remedy === o.id
          const Icon = o.icon
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={selected}
              onClick={() => dispatch({ type: 'SET_REMEDY', value: o.id })}
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
              <span className="flex-1 min-w-0">
                <span className="block text-[14.5px] font-semibold text-ink leading-[1.25]">
                  {o.title}
                </span>
                <span className="block text-[12px] text-muted mt-0.5 leading-[1.35]">
                  {o.sub}
                </span>
              </span>
              <ChevronRight size={16} strokeWidth={1.75} className="text-muted shrink-0" />
            </button>
          )
        })}
      </div>
    </>
  )
}
