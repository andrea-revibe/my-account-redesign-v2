import { useEffect } from 'react'
import { X, AlertTriangle, RotateCcw, PackageCheck, Wallet, Truck } from 'lucide-react'
import { claimTypeLabel, cancelNeedsShipBack, cancelReturnGate, formatClaimRef } from '../lib/claims'
import { ProductSummary } from './ProductSummary'

// Confirmation sheet for cancelling an in-flight claim. Mirrors
// CancelOrderSheet's chrome (scrim, slide-up panel, Escape-to-close,
// body-scroll lock). Context-aware via `cancelNeedsShipBack`:
//   - pre-collection (device not yet collected / compensation): a clean
//     confirm — Confirm reverts the order to its delivered card.
//   - post-collection (device already with Revibe): the confirm is step 1
//     of a two-step flow — Confirm hands off to the pay-return-shipping
//     surface (InvalidClaimCard, reason 'cancelled') so the customer can
//     pay to get the device shipped back.
export default function CancelClaimSheet({ order, open, onConfirm, onClose }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open || !order?.claim) return null

  const claim = order.claim
  const needsShipBack = cancelNeedsShipBack(claim)
  const fee = cancelReturnGate(order).returnShipping
  const feeLabel = `${fee.currency} ${fee.amount.toLocaleString()}`

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
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
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            Claim {formatClaimRef(claim)}
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
            <span className="w-9 h-9 rounded-full bg-danger-bg text-danger grid place-items-center shrink-0">
              <AlertTriangle size={18} strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <h2 className="m-0 text-[18px] font-bold leading-[1.2] tracking-[-0.01em] text-ink">
                Cancel this claim?
              </h2>
              <p className="mt-1 text-[12.5px] text-ink-2 leading-snug">
                {needsShipBack
                  ? `Your device is already with us. To cancel your ${claimTypeLabel(
                      claim,
                    ).toLowerCase()} claim and get it back, you'll need to cover return shipping (${feeLabel}).`
                  : `You're cancelling your ${claimTypeLabel(
                      claim,
                    ).toLowerCase()} claim. This can't be reversed once we've started processing it.`}
              </p>
            </div>
          </div>

          <ProductSummary order={order} />

          <ul className="flex flex-col gap-2.5 rounded-[12px] border border-line bg-canvas px-3.5 py-3">
            {needsShipBack ? (
              <>
                <WhatHappensRow
                  Icon={Truck}
                  text={`Next, you'll pay ${feeLabel} return shipping and we'll send your device back.`}
                />
                <WhatHappensRow
                  Icon={PackageCheck}
                  text="We track the return like any other delivery until it reaches you."
                />
                <WhatHappensRow
                  Icon={RotateCcw}
                  text="No refund will be issued — this just returns your device."
                />
              </>
            ) : (
              <>
                <WhatHappensRow
                  Icon={RotateCcw}
                  text={
                    claim.type === 'compensation'
                      ? 'No compensation will be paid for this claim.'
                      : "We'll cancel your return — no device pickup will be scheduled."
                  }
                />
                <WhatHappensRow
                  Icon={PackageCheck}
                  text="The order goes back to Delivered — you can raise a new claim anytime."
                />
                <WhatHappensRow
                  Icon={Wallet}
                  text="Nothing has been charged, so there's nothing to reverse."
                />
              </>
            )}
          </ul>
        </div>

        <div className="px-5 pt-2 pb-5 flex gap-2 border-t border-line">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[48px] rounded-[12px] bg-surface border border-line text-ink font-semibold text-[14px] hover:bg-line-2"
          >
            Keep claim
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 h-[48px] rounded-[12px] bg-danger text-white border border-danger font-semibold text-[14px] hover:brightness-95 active:scale-[0.99] transition"
          >
            {needsShipBack ? 'Continue to payment' : 'Cancel claim'}
          </button>
        </div>
      </div>
    </div>
  )
}

function WhatHappensRow({ Icon, text }) {
  return (
    <li className="flex items-start gap-2.5 text-[12.5px] text-ink-2 leading-snug">
      <Icon size={15} strokeWidth={2} className="text-muted shrink-0 mt-px" />
      <span>{text}</span>
    </li>
  )
}
