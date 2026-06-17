import { useEffect } from 'react'
import { X, Download, ChevronRight, CreditCard } from 'lucide-react'
import { ProductSummary } from './ProductSummary'
import { claimToneFor, formatClaimRef } from '../lib/claims'

// The order side of the order↔claim link. A claim card replaces the original
// order card in the list, so there's no standalone order card to navigate to —
// tapping the claim's parent strip opens this bottom sheet instead. Its
// "Linked claim" row is the reciprocal half of the two-way link: `onGoToClaim`
// dismisses the sheet and returns focus to the claim card (expand + ring).
// Chrome mirrors ClaimDetailsSheet / RefundDetailsSheet so the three read as
// siblings.

// Single-letter type code for the linked-claim chip — colored by the claim's
// existing state tone, not a new color.
const TYPE_CODE = {
  change_of_mind: 'R',
  issue: 'R',
  warranty: 'W',
  compensation: 'Cmp',
  cancellation: 'Cxl',
}
const TONE_BG = { warn: 'bg-warn', brand: 'bg-brand', success: 'bg-success' }

function paymentLabel(pm) {
  if (!pm) return '—'
  if (pm.type === 'bnpl') return pm.brand || pm.provider || 'Buy now, pay later'
  return `${pm.brand || 'Card'} ···· ${pm.last4 || '0000'}`
}

export default function OriginalOrderSheet({ order, open, onClose, onGoToClaim }) {
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
  const isDelivered = order.statusId === 'delivered'
  const tone = claim ? claimToneFor(claim.claimStatusId) : 'brand'
  const isBnplPay = order.paymentMethod?.type === 'bnpl'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Original order"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 animate-fadeIn"
      />
      <div className="relative w-full max-w-mobile bg-surface rounded-t-[22px] shadow-lg2 max-h-[92vh] flex flex-col animate-slideUp overflow-hidden">
        <div className="mx-auto mt-2.5 h-1 w-[38px] rounded-full bg-line shrink-0" />

        <div className="flex items-start gap-2 px-4 pt-3 pb-3 border-b border-line">
          <div className="flex-1 min-w-0">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
              Original order
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-[30px] font-extrabold text-ink tabular-nums leading-none">
                #{order.id}
              </span>
              {isDelivered && (
                <span className="inline-flex items-center h-[22px] px-2 rounded-full bg-success-bg text-success text-[10.5px] font-bold uppercase tracking-[0.06em]">
                  Delivered
                </span>
              )}
            </div>
            {(order.placedAtFull || order.placedAt) && (
              <div className="mt-1.5 text-[12.5px] text-muted">
                Placed {order.placedAtFull || order.placedAt}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-[30px] h-[30px] rounded-full grid place-items-center bg-line-2 text-ink hover:bg-line shrink-0"
          >
            <X size={16} strokeWidth={1.75} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
          <div className="rounded-[14px] bg-canvas p-3.5">
            <ProductSummary order={order} tone="light" />
          </div>

          <div className="rounded-[14px] border border-line bg-surface overflow-hidden">
            <KeyValue
              label="Order total"
              value={`${currency} ${order.total.toLocaleString()}`}
            />
            <Divider />
            <KeyValue
              label="Payment"
              value={
                <span className="inline-flex items-center gap-1.5">
                  {isBnplPay ? null : (
                    <CreditCard size={13} strokeWidth={2} className="text-ink-2" />
                  )}
                  {paymentLabel(order.paymentMethod)}
                </span>
              }
            />
            {claim && (
              <>
                <Divider />
                <button
                  type="button"
                  onClick={onGoToClaim}
                  className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left hover:bg-line-2/60 transition-colors"
                >
                  <span className="text-[13px] text-muted shrink-0">
                    Linked claim
                  </span>
                  <span className="inline-flex items-center gap-2 min-w-0">
                    <span
                      className={`grid place-items-center w-[18px] h-[18px] rounded-[5px] text-white text-[9.5px] font-extrabold shrink-0 ${TONE_BG[tone]}`}
                    >
                      {TYPE_CODE[claim.type] || 'C'}
                    </span>
                    <span className="text-[13px] font-bold text-ink tabular-nums truncate">
                      {formatClaimRef(claim)}
                    </span>
                    <ChevronRight
                      size={15}
                      strokeWidth={2.25}
                      className="text-muted shrink-0"
                    />
                  </span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            className="h-[44px] rounded-btn border border-line bg-surface text-ink font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5 hover:bg-line-2"
          >
            <Download size={16} strokeWidth={1.75} />
            Download receipt
          </button>
        </div>
      </div>
    </div>
  )
}

function KeyValue({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3.5 py-3">
      <span className="text-[13px] text-muted shrink-0">{label}</span>
      <span className="text-[13.5px] font-semibold text-ink text-right tabular-nums">
        {value}
      </span>
    </div>
  )
}

function Divider() {
  return <div className="border-t border-line" />
}
