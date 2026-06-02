import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Package,
  ShieldAlert,
  PlayCircle,
  ChevronDown,
  Maximize2,
  X,
  Lightbulb,
} from 'lucide-react'
import StepHeading from './StepHeading'

export const PACKING_OPTIONS = [
  {
    id: 'original_box',
    Icon: Package,
    title: 'Use the original Revibe box',
    subtitle: 'The box your device arrived in is already sized for safe transit.',
  },
  {
    id: 'post_box',
    Icon: ShieldAlert,
    title: 'Use any sturdy post box',
    subtitle: "No original box? Any rigid box works as long as it's well-padded.",
  },
]

const PACKING_TIPS = [
  'Make sure nothing is loose inside — fill empty space if needed.',
  'Seal all seams with packing tape.',
  'Mark the box "Fragile" so couriers handle it with care.',
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
        subtitle="Proper packing protects your device in transit. Watch the quick demo, then pick whichever method matches what you have on hand."
      />

      <div className="px-4 flex flex-col gap-3">
        <PackingDemo />

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

        <PackingTips />

        <div className="mt-1 text-[11.5px] text-muted leading-[1.45]">
          Devices returned damaged due to poor packing may be sent back at your
          cost.
        </div>
      </div>
    </>
  )
}

function PackingDemo() {
  const [expanded, setExpanded] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Expand packing demo"
        className="relative w-full rounded-[16px] overflow-hidden border-2 border-brand/40 bg-black ring-4 ring-brand-bg/40 group"
      >
        <video
          src="/revibe_packing_guide.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full aspect-square object-cover block"
        />
        <span className="absolute top-2.5 left-2.5 inline-flex items-center gap-1 rounded-full bg-brand text-white px-2.5 h-6 text-[10.5px] font-bold uppercase tracking-[0.06em] shadow-sm2">
          <PlayCircle size={12} strokeWidth={2.4} />
          Watch first
        </span>
        <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 px-3 py-2.5 bg-gradient-to-t from-black/75 to-transparent">
          <span className="flex-1 text-left text-[13px] font-semibold text-white leading-tight">
            Packing demo
            <span className="ml-1.5 font-normal text-white/70">· 12 sec</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-white/90">
            <Maximize2 size={13} strokeWidth={2.2} />
            Tap to expand
          </span>
        </span>
      </button>

      {expanded && <DemoLightbox onClose={() => setExpanded(false)} />}
    </>
  )
}

function DemoLightbox({ onClose }) {
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Packing demo"
    >
      <button
        aria-label="Close demo"
        onClick={onClose}
        className="absolute inset-0 bg-black/80 animate-fadeIn"
      />
      <div className="relative w-full max-w-mobile h-full flex flex-col justify-center px-4 animate-slideUp">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 grid place-items-center rounded-full bg-white/10 text-white hover:bg-white/20"
        >
          <X size={18} strokeWidth={2.2} />
        </button>
        <div className="rounded-[16px] overflow-hidden bg-black shadow-xl">
          <video
            src="/revibe_packing_guide.mp4"
            autoPlay
            loop
            controls
            playsInline
            className="w-full block"
          />
        </div>
        <p className="mt-3 text-center text-[12px] text-white/70 leading-snug">
          How to wrap and box your device for safe pickup.
        </p>
      </div>
    </div>,
    document.body,
  )
}

function PackingTips() {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-[14px] border border-brand/25 bg-brand-bg/40 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full px-3 py-2.5 flex items-center gap-2.5 hover:bg-brand-bg/30 transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-brand grid place-items-center shrink-0">
          <Lightbulb size={15} strokeWidth={2.2} className="text-white" />
        </span>
        <span className="text-[13.5px] font-semibold text-brand flex-1 text-left">
          Packing tips
        </span>
        <ChevronDown
          size={17}
          strokeWidth={2.2}
          className={`text-brand shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <ul className="px-3.5 pb-3.5 pt-0.5 flex flex-col gap-2 animate-slideDown">
          {PACKING_TIPS.map((tip, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[12.5px] text-ink-2 leading-[1.45]"
            >
              <span
                aria-hidden
                className="mt-[6px] w-1.5 h-1.5 rounded-full bg-brand shrink-0"
              />
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OptionCard({ option, selected, onSelect }) {
  const { Icon, title, subtitle } = option
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
    </button>
  )
}
