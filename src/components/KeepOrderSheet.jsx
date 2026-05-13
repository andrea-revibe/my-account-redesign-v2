import { useEffect } from 'react'
import { X, Info, RotateCcw } from 'lucide-react'

// Single-step bottom sheet for reversing an in-flight cancellation
// (cancellationStatusId 'requested' or 'refund_pending'). Submit is a
// prototype stub — closes the sheet, no state mutation. See
// docs/my-account-flow.md § "Mocked vs production gap".
export default function KeepOrderSheet({ order, open, onClose }) {
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

  if (!open) return null

  const isRefundPending = order.cancellationStatusId === 'refund_pending'

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
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-line">
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-ink leading-[1.2]">
              Keep your order?
            </div>
            <div className="text-[12px] text-muted mt-0.5 truncate">
              #{order.id}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full grid place-items-center text-ink hover:bg-line-2"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">
          <div className="rounded-[16px] border border-line bg-canvas p-5 text-center">
            <div className="w-10 h-10 mx-auto rounded-full bg-brand-bg grid place-items-center text-brand">
              <RotateCcw size={18} strokeWidth={2} />
            </div>
            <div className="mt-2.5 text-[15px] font-bold text-ink leading-[1.25]">
              Reverse your cancellation
            </div>
            <div className="mt-1.5 text-[12.5px] text-ink-2 leading-[1.45]">
              Your{' '}
              <span className="font-semibold text-ink">
                {order.product.name}
              </span>{' '}
              will continue through fulfilment as if it was never cancelled.
            </div>
          </div>

          {isRefundPending && (
            <div className="flex items-start gap-2.5 rounded-[12px] border border-line bg-line-2 p-3 text-[12.5px] text-ink leading-[1.45]">
              <Info
                size={16}
                strokeWidth={1.75}
                className="text-muted shrink-0 mt-px"
              />
              <span>
                Your pending refund of{' '}
                <span className="font-semibold">
                  {order.currency} {order.refund.amount.toLocaleString()}
                </span>{' '}
                will be cancelled — no money will be returned to your{' '}
                {order.refund.destination.kind === 'wallet'
                  ? 'Revibe Wallet'
                  : `${order.refund.destination.label} •• ${order.refund.destination.last4}`}
                .
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-2 px-4 py-3 border-t border-line bg-surface">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[44px] rounded-[10px] inline-flex items-center justify-center gap-1.5 bg-surface text-ink border border-line font-semibold text-[13.5px]"
          >
            No, continue cancellation
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-[44px] rounded-[10px] inline-flex items-center justify-center gap-1.5 bg-brand text-white border border-brand font-semibold text-[13.5px]"
          >
            Yes, keep my order
          </button>
        </div>
      </div>
    </div>
  )
}
