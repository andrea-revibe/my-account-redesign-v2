import { useEffect } from 'react'
import {
  X,
  AlertTriangle,
  ArrowLeftRight,
  BadgePercent,
  Wrench,
  Truck,
  Clock,
  PackageCheck,
  Wallet,
} from 'lucide-react'
import { ProductSummary } from '../ProductSummary'

// Smart "switch?" safety net (RETURNS-FLOW-SPEC §5). A tripwire selection in
// one branch signals the customer is in the wrong lane; rather than
// auto-navigating, this sheet states the BENEFIT of switching and lets them
// choose. Keyed by the *target situation*; ClaimFlow dispatches
// SWITCH_SITUATION on confirm.
const SITUATION_SWITCH = {
  device_fault: {
    icon: AlertTriangle,
    tone: 'warn',
    title: "Sounds like something's wrong with the device",
    body: "Faulty devices follow a different process — you won't pay return shipping, and you may be able to get it repaired or refunded.",
    points: [
      [Truck, "You won't pay return shipping on a faulty device."],
      [Wrench, 'Get it repaired under warranty, or refunded — your choice.'],
      [Clock, 'Quality check prioritises reported faults.'],
    ],
  },
  wrong_item: {
    icon: ArrowLeftRight,
    tone: 'brand',
    title: 'Sounds like you got the wrong item',
    body: "If the device doesn't match what you ordered, we'll send you the correct one — free.",
    points: [
      [PackageCheck, "We'll send the correct item at no cost."],
      [Truck, 'Free return shipping for the one that arrived.'],
    ],
  },
  keep_compensation: {
    icon: BadgePercent,
    tone: 'warn',
    title: 'Sounds like an accessory issue',
    body: 'Keep the device and get compensated for the accessory instead of sending the whole thing back.',
    points: [
      [PackageCheck, 'Keep the device — only the accessory is the problem.'],
      [Wallet, "We'll confirm the amount after reviewing your details."],
    ],
  },
}

export default function SwitchFlowSheet({
  open,
  situation,
  order,
  onConfirm,
  onClose,
  dismissLabel = 'Not now',
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !situation) return null
  const content = SITUATION_SWITCH[situation]
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
            {dismissLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-[48px] rounded-[12px] bg-brand text-white border border-brand font-semibold text-[13.5px] hover:brightness-95 active:scale-[0.99] transition"
          >
            Yes, switch to that
          </button>
        </div>
      </div>
    </div>
  )
}
