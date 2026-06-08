import { useEffect } from 'react'
import {
  X,
  Wrench,
  RotateCcw,
  Coins,
  PackageOpen,
  ShieldCheck,
  Clock,
  BadgeCheck,
  Camera,
  PackageCheck,
  Wallet,
  Truck,
} from 'lucide-react'
import { ProductSummary } from '../ProductSummary'
import { SWITCH_CTA_LABELS } from './Step2Reason'

// Track-specific copy for the redirect sheet. The sheet is authoritative: a
// faulty / wrong / incomplete item must not continue down the change-of-mind
// (no-fault) track, and a no-fault reason shouldn't sit in an issue flow. The
// only two outcomes are "switch" (primary) or "choose a different reason"
// (dismiss back to the reason list) — there is no "continue anyway".
const CONTENT = {
  warranty: {
    icon: Wrench,
    tone: 'warn',
    title: 'Use your warranty instead?',
    body: 'This sounds like a fault, and your device is covered by Revibe Care. A warranty claim repairs it and returns the same device to you.',
    points: [
      [ShieldCheck, 'Covered by Revibe Care — no repair cost to you.'],
      [RotateCcw, 'We repair it and ship the same device back to you.'],
      [Clock, 'Faster than a change-of-mind return for a faulty device.'],
    ],
  },
  issue: {
    icon: RotateCcw,
    tone: 'warn',
    title: 'Report a problem instead?',
    body: "Faulty or incorrect items go through repair & return — the right path when something's actually wrong with the device.",
    points: [
      [BadgeCheck, 'No 10% restocking fee on faulty or incorrect items.'],
      [Clock, 'Quality check prioritises reported faults.'],
      [Camera, "You'll add a photo or short video so we can verify it."],
    ],
  },
  compensation: {
    icon: Coins,
    tone: 'warn',
    title: 'Request compensation instead?',
    body: "For missing or broken parts you can keep the item and we'll compensate you — no need to send the whole device back.",
    points: [
      [PackageCheck, 'Keep the device — only the part is the problem.'],
      [Wallet, "We'll confirm the amount after reviewing your details."],
    ],
  },
  change_of_mind: {
    icon: PackageOpen,
    tone: 'info',
    title: 'Switch to a change-of-mind return?',
    body: "There's no fault with the device, so this is a change-of-mind return rather than a repair.",
    points: [
      [Truck, "We'll arrange a courier to collect it from your address."],
      [Wallet, 'Full refund to Revibe Wallet, or to your card minus a 10% restocking fee.'],
    ],
  },
}

export default function SwitchFlowSheet({ open, target, order, onConfirm, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !target) return null
  const content = CONTENT[target]
  if (!content) return null

  const Icon = content.icon
  const warn = content.tone === 'warn'

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 animate-fadeIn"
      />
      <div className="relative w-full max-w-mobile bg-surface rounded-t-[22px] shadow-lg2 max-h-[92vh] flex flex-col animate-slideUp overflow-hidden">
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-line">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
            Before you continue
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-8 h-8 -mr-1 rounded-full grid place-items-center text-muted hover:bg-line-2"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
          <div className="flex items-start gap-3">
            <span
              className={`w-9 h-9 rounded-full grid place-items-center shrink-0 ${
                warn ? 'bg-amber-100 text-amber-600' : 'bg-brand/10 text-brand'
              }`}
            >
              <Icon size={18} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h2 className="m-0 text-[18px] font-bold leading-[1.2] tracking-[-0.01em] text-ink">
                {content.title}
              </h2>
              <p className="mt-1 text-[12.5px] text-ink-2 leading-snug">
                {content.body}
              </p>
            </div>
          </div>

          {order && <ProductSummary order={order} />}

          <ul className="flex flex-col gap-2.5 rounded-[12px] border border-line bg-canvas px-3.5 py-3">
            {content.points.map(([PointIcon, text]) => (
              <li
                key={text}
                className="flex items-start gap-2.5 text-[12.5px] text-ink-2 leading-snug"
              >
                <PointIcon
                  size={15}
                  strokeWidth={2}
                  className="text-muted shrink-0 mt-px"
                />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="px-5 pt-2 pb-5 flex gap-2 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[48px] rounded-[12px] bg-surface border border-line text-ink font-semibold text-[13.5px] hover:bg-line-2"
          >
            Choose another reason
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-[48px] rounded-[12px] bg-brand text-white border border-brand font-semibold text-[13.5px] hover:brightness-95 active:scale-[0.99] transition"
          >
            {SWITCH_CTA_LABELS[target]}
          </button>
        </div>
      </div>
    </div>
  )
}
