import { useEffect } from 'react'
import { X } from 'lucide-react'

// Bottom sheet for past cancelled orders. Strictly the money math:
// line items → subtotal → fee (if any) → total refund. Destination,
// timeline, and product info stay on the card.
export default function RefundDetailsSheet({ order, open, onClose }) {
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

  const { currency } = order
  const { subtotal, fee, amount, breakdown } = order.refund
  const tone = toneFor(order.cancellationStatusId)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Refund details"
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
              Refund details
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

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-[14px] border border-line bg-surface p-4 flex flex-col gap-2">
            <h3 className="m-0 text-[11.5px] font-bold uppercase tracking-[0.06em] text-muted mb-1">
              Refund breakdown
            </h3>

            {breakdown.map((l) => (
              <Row
                key={l.label}
                label={l.label}
                value={`${currency} ${formatMoney(l.amount)}`}
              />
            ))}

            {fee && (
              <>
                <Divider />
                <Row
                  label="Subtotal"
                  value={`${currency} ${formatMoney(subtotal)}`}
                />
                <Row
                  label={
                    <span>
                      {fee.label}
                      {fee.rate != null && (
                        <span className="text-muted">
                          {' '}
                          ({Math.round(fee.rate * 100)}%)
                        </span>
                      )}
                    </span>
                  }
                  value={`− ${currency} ${formatMoney(fee.amount)}`}
                  valueTone="text-danger"
                />
              </>
            )}

            <Divider />
            <div className="flex items-baseline justify-between">
              <span className="text-[13.5px] font-bold text-ink">
                Total refund
              </span>
              <span
                className={`text-[16px] font-bold tabular-nums ${TONE_TEXT[tone]}`}
              >
                {currency} {formatMoney(amount)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const TONE_TEXT = {
  warn: 'text-warn',
  brand: 'text-brand',
  success: 'text-success',
}

function toneFor(id) {
  if (id === 'refunded') return 'success'
  if (id === 'refund_pending') return 'brand'
  return 'warn'
}

function Row({ label, value, valueTone }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-ink-2">{label}</span>
      <span
        className={`text-[13.5px] tabular-nums ${valueTone ?? 'text-ink'}`}
      >
        {value}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-dashed border-line my-1" />
}

function formatMoney(n) {
  return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2)
}
