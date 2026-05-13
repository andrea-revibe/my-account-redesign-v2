import { useEffect } from 'react'
import { X, Wallet, CreditCard } from 'lucide-react'
import {
  reasonText,
  devicePrepText,
  refundMethodLabel,
  RETURN_METHOD_LABELS,
} from '../lib/claims'

// Bottom sheet surfacing the full set of choices captured during the
// raise-a-claim flow: reason, units, device prep, return method (with
// pickup address when courier), refund destination, and expected refund.
// Mirrors the layering of RefundDetailsSheet so the two feel like siblings.
export default function ClaimDetailsSheet({ order, open, onClose }) {
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

  const claim = order.claim
  const { currency } = order
  const returnLabel = RETURN_METHOD_LABELS[claim.returnMethod?.id]
  const isWallet = claim.refundMethod === 'wallet'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Claim details"
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
              Claim details
            </div>
            <div className="text-[12px] text-muted mt-0.5 truncate tabular-nums">
              {claim.claimRef} · Order #{order.id}
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

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          <SectionCard title="Summary">
            <Row label="Reason" value={reasonText(claim)} />
            <Row
              label="Units"
              value={`${claim.units} of ${order.quantity || 1}`}
            />
            <Row label="Device preparation" value={devicePrepText(claim)} />
            <Row
              label="Return method"
              value={returnLabel || 'Not selected'}
              sub={
                claim.returnMethod?.id === 'courier'
                  ? claim.returnMethod.address
                  : null
              }
            />
            <Row
              label="Refund destination"
              value={
                <span className="inline-flex items-center gap-1.5">
                  {isWallet ? (
                    <Wallet size={12} strokeWidth={2} className="text-ink-2" />
                  ) : (
                    <CreditCard
                      size={12}
                      strokeWidth={2}
                      className="text-ink-2"
                    />
                  )}
                  {refundMethodLabel(claim, order)}
                </span>
              }
              sub={
                claim.refundMethod === 'original'
                  ? 'Includes 10% restocking fee'
                  : null
              }
            />
            {claim.submittedAt && (
              <Row label="Submitted" value={claim.submittedAt} />
            )}
          </SectionCard>

          <SectionCard title="Refund">
            <div className="flex items-baseline justify-between">
              <span className="text-[13px] text-ink-2">
                {claim.claimStatusId === 'refunded'
                  ? 'Refunded'
                  : 'Expected refund'}
              </span>
              <span className="text-[18px] font-bold tabular-nums text-ink">
                {currency}{' '}
                {claim.expectedRefund.net.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            {claim.expectedRefund.fee > 0 && (
              <div className="mt-1 text-[11.5px] text-muted">
                Gross {currency}{' '}
                {claim.expectedRefund.gross.toLocaleString()} · Restocking fee
                − {currency}{' '}
                {claim.expectedRefund.fee.toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function SectionCard({ title, children }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface p-4 flex flex-col gap-2.5">
      <h3 className="m-0 text-[11.5px] font-bold uppercase tracking-[0.06em] text-muted">
        {title}
      </h3>
      {children}
    </div>
  )
}

function Row({ label, value, sub }) {
  return (
    <div className="flex justify-between gap-3 w-full">
      <div className="text-[12.5px] text-muted shrink-0">{label}</div>
      <div className="text-[13px] text-ink text-right max-w-[62%] leading-[1.4]">
        <div>{value}</div>
        {sub && <div className="text-[11.5px] text-muted mt-0.5">{sub}</div>}
      </div>
    </div>
  )
}
