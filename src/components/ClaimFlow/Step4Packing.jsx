import { Package, ShieldAlert } from 'lucide-react'
import StepHeading from './StepHeading'

export const PACKING_OPTIONS = [
  {
    id: 'original_box',
    Icon: Package,
    title: 'Use the original Revibe box',
    subtitle: 'The box your device arrived in is already sized for safe transit.',
    bullets: [
      'Place the device back in its original protective tray or sleeve.',
      'Include all original accessories (charger, cable, SIM tool).',
      'Make sure nothing is loose inside — fill empty space if needed.',
      'Seal all seams with packing tape.',
    ],
  },
  {
    id: 'post_box',
    Icon: ShieldAlert,
    title: 'Use any sturdy post box',
    subtitle: "No original box? Any rigid box works as long as it's well-padded.",
    bullets: [
      'Wrap the device fully in bubble wrap (at least 2 layers).',
      "Cushion the top, bottom, and sides so it can't shift inside.",
      'Tape all seams of the outer box.',
      'Mark the box "Fragile" so couriers handle it with care.',
    ],
  },
]

export const PACKING_LABELS = Object.fromEntries(
  PACKING_OPTIONS.map((o) => [o.id, o.title]),
)

export default function Step4Packing({ state, dispatch }) {
  const selected = state.packingMethod
  return (
    <>
      <StepHeading
        title="Pack your device for pickup"
        subtitle="Proper packing protects your device in transit. Pick whichever method matches what you have on hand."
      />

      <div className="px-4 flex flex-col gap-3">
        {PACKING_OPTIONS.map((opt) => (
          <OptionCard
            key={opt.id}
            option={opt}
            selected={selected === opt.id}
            onSelect={() =>
              dispatch({ type: 'SET_PACKING_METHOD', value: opt.id })
            }
          />
        ))}

        <div className="mt-1 text-[11.5px] text-muted leading-[1.45]">
          Devices returned damaged due to poor packing may be sent back at your
          cost.
        </div>
      </div>
    </>
  )
}

function OptionCard({ option, selected, onSelect }) {
  const { Icon, title, subtitle, bullets } = option
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full text-left rounded-[14px] border-2 px-3.5 py-3 transition-colors ${
        selected
          ? 'border-brand bg-brand-bg/30'
          : 'border-line bg-surface hover:bg-line-2/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`mt-0.5 w-[18px] h-[18px] rounded-full border-2 grid place-items-center shrink-0 ${
            selected ? 'border-brand' : 'border-line'
          }`}
        >
          {selected && <span className="w-2 h-2 rounded-full bg-brand" />}
        </span>
        <span className="w-9 h-9 rounded-[10px] bg-brand-bg grid place-items-center shrink-0">
          <Icon size={18} strokeWidth={1.75} className="text-brand" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14.5px] font-semibold text-ink leading-[1.3]">
            {title}
          </span>
          <span className="block mt-0.5 text-[12px] text-muted leading-[1.4]">
            {subtitle}
          </span>
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-1.5 pl-1">
        {bullets.map((b, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-[12.5px] text-ink-2 leading-[1.45]"
          >
            <span
              aria-hidden
              className="mt-[7px] w-1 h-1 rounded-full bg-ink-2 shrink-0"
            />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </button>
  )
}
