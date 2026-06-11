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
  AlertTriangle,
  ChevronRight,
} from 'lucide-react'
import { ProductSummary } from '../ProductSummary'
import { SWITCH_CTA_LABELS } from './Step2Reason'

// Choice mode: a fault reason was caught inside the change-of-mind flow. Rather
// than auto-switching to a single track, the customer chooses how to fix it —
// a replacement (warranty: we repair the device and return it, covered, at no
// cost) or a refund (issue). Replacement is the recommended path; the only
// nudge is the "Recommended" badge (both cards otherwise read the same).
const REMEDY_CHOICES = [
  {
    target: 'warranty',
    icon: Wrench,
    recommended: true,
    title: 'Get a replacement',
    body: 'A fully working device back — covered by your warranty, at no cost. No refund delays.',
  },
  {
    target: 'issue',
    icon: RotateCcw,
    recommended: false,
    title: 'Get a refund',
    body: "Send it back and we'll refund you — no restocking fee on a faulty item.",
  },
]

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

export default function SwitchFlowSheet({
  open,
  target,
  order,
  choice = false,
  onConfirm,
  onChoose,
  onClose,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !target) return null

  // Refund-vs-replacement fork (fault reason caught in change of mind).
  if (choice) {
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
              <span className="w-9 h-9 rounded-full grid place-items-center shrink-0 bg-brand/10 text-brand">
                <AlertTriangle size={18} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <h2 className="m-0 text-[18px] font-bold leading-[1.2] tracking-[-0.01em] text-ink">
                  This sounds like a fault
                </h2>
                <p className="mt-1 text-[12.5px] text-ink-2 leading-snug">
                  Since something's actually wrong with the device, how would
                  you like us to fix it?
                </p>
              </div>
            </div>

            {order && <ProductSummary order={order} />}

            <div className="flex flex-col gap-2">
              {REMEDY_CHOICES.map((c) => {
                const CIcon = c.icon
                return (
                  <button
                    key={c.target}
                    type="button"
                    onClick={() => onChoose(c.target)}
                    className="w-full text-left rounded-[14px] border border-line bg-surface px-3.5 py-3 flex items-start gap-3 transition-colors hover:bg-line-2/40 active:scale-[0.995]"
                  >
                    <span className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0 bg-brand/10 text-brand">
                      <CIcon size={17} strokeWidth={2} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center gap-2 flex-wrap">
                        <span className="text-[14px] font-semibold text-ink">
                          {c.title}
                        </span>
                        {c.recommended && (
                          <span className="text-[10px] font-bold uppercase tracking-[0.04em] text-brand bg-brand/10 rounded-full px-2 py-0.5">
                            Recommended
                          </span>
                        )}
                      </span>
                      <span className="block text-[12px] text-ink-2 leading-snug mt-0.5">
                        {c.body}
                      </span>
                    </span>
                    <ChevronRight
                      size={16}
                      strokeWidth={1.75}
                      className="text-muted shrink-0 mt-1.5"
                    />
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-5 pt-2 pb-5 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="w-full h-[48px] rounded-[12px] bg-surface border border-line text-ink font-semibold text-[13.5px] hover:bg-line-2"
            >
              Choose another reason
            </button>
          </div>
        </div>
      </div>
    )
  }

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
