import { ChevronRight, Undo2, AlertTriangle, ArrowLeftRight, BadgePercent } from 'lucide-react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'

// Screen 1 of the returns redesign — four mutually-exclusive situations. We
// ask WHAT HAPPENED, not which remedy the customer wants; the remedy (and the
// downstream claim type) is derived from the branch later. Order, ids and copy
// follow RETURNS-FLOW-SPEC §4 / the wireframe.
const SITUATIONS = [
  {
    id: 'changed_mind',
    icon: Undo2,
    title: "I've changed my mind",
    sub: 'The device is fine, I just want to send it back',
  },
  {
    id: 'device_fault',
    icon: AlertTriangle,
    title: "Something's wrong with the device",
    sub: 'Faulty, damaged, or not working right',
  },
  {
    id: 'wrong_item',
    icon: ArrowLeftRight,
    title: 'I received the wrong item',
    sub: 'Wrong colour, storage, specs, or model',
  },
  {
    id: 'keep_compensation',
    icon: BadgePercent,
    title: "I'm keeping the device, but something's wrong",
    sub: 'A missing or broken accessory, or a shipping charge to refund',
  },
]

export default function Step1Situation({ state, dispatch, error }) {
  return (
    <>
      <StepHeading
        title="What's going on?"
        subtitle="Tell us what happened — we'll sort out the rest from there."
      />
      <div className="px-4 flex flex-col gap-2">
        {error === 'situation' && (
          <InlineError className="mb-0.5">
            Pick an option to continue.
          </InlineError>
        )}
        {SITUATIONS.map((s) => {
          const selected = state.situation === s.id
          const Icon = s.icon
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={selected}
              onClick={() => dispatch({ type: 'SET_SITUATION', value: s.id })}
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
                  {s.title}
                </span>
                <span className="block text-[12px] text-muted mt-0.5 leading-[1.35]">
                  {s.sub}
                </span>
              </span>
              <ChevronRight
                size={16}
                strokeWidth={1.75}
                className="text-muted shrink-0"
              />
            </button>
          )
        })}
      </div>
    </>
  )
}
