import { useState } from 'react'
import { CheckCircle2, Copy, Check, Mail, Clock, ShieldCheck } from 'lucide-react'
import { refundBreakdown, formatMoney } from '../../lib/returns'
import { claimTypeLabel } from '../../lib/claims'

export default function Step7Confirmation({ state, order, onClose }) {
  const [copied, setCopied] = useState(false)
  if (!order) return null
  const refund = refundBreakdown(
    order,
    state.units,
    state.refundMethod,
    state.claimType,
  )
  const currency = order.currency
  const timeline =
    state.refundMethod === 'wallet'
      ? 'Lands in your Revibe Wallet within 1 hour once return is complete.'
      : 'Returns to your card in 5–10 business days once return is complete.'
  const devicePrepLine =
    state.devicePrep.option === 'reset'
      ? 'You confirmed the device is factory reset.'
      : 'Thanks for providing your credentials.'

  const copy = () => {
    navigator.clipboard?.writeText(state.claimRef)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="min-h-full bg-surface flex flex-col">
      <div className="px-6 pt-10 pb-6 text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-success-bg grid place-items-center mb-4">
          <CheckCircle2 size={32} strokeWidth={1.75} className="text-success" />
        </div>
        <h1 className="m-0 text-[24px] leading-[1.15] font-bold text-ink tracking-[-0.01em]">
          Your return request is in
        </h1>
        <div className="mt-3 inline-flex items-center rounded-full bg-brand-bg text-brand font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px]">
          {claimTypeLabel(state.claimType)}
        </div>
        <p className="mt-3 text-[13.5px] leading-[1.45] text-muted">
          We'll email you the next steps shortly.
        </p>
      </div>

      <div className="px-4 pb-2">
        <div className="rounded-[14px] border border-line bg-canvas px-4 py-3.5">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            Reference
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-[18px] font-bold text-ink tabular-nums tracking-[-0.01em]">
              {state.claimRef}
            </span>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full border border-line bg-surface text-[12px] font-semibold text-ink hover:bg-line-2"
            >
              {copied ? (
                <>
                  <Check size={12} strokeWidth={2} className="text-success" />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={12} strokeWidth={2} />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-3 pb-4">
        <div className="rounded-[14px] border border-line bg-surface divide-y divide-line">
          <Row Icon={Mail} title="Check your inbox">
            We've sent return instructions and your shipping label (or pickup
            details) to your email.
          </Row>
          <Row Icon={Clock} title="Expected refund">
            <span className="text-ink font-semibold">
              {currency} {formatMoney(refund.net)}
            </span>{' '}
            ·{' '}
            {state.refundMethod === 'wallet'
              ? 'Revibe Wallet'
              : `${order.paymentMethod?.brand || 'Card'} •• ${order.paymentMethod?.last4 || '0000'}`}
            <span className="block mt-1 text-[12px] text-muted">{timeline}</span>
          </Row>
          <Row Icon={ShieldCheck} title="Device preparation">
            {devicePrepLine}
          </Row>
        </div>
      </div>

      <div className="mt-auto sticky bottom-0 bg-surface border-t border-line px-4 py-3 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-[48px] rounded-[12px] inline-flex items-center justify-center bg-surface text-ink border border-line font-semibold text-[14px]"
        >
          Track this return
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-[48px] rounded-[12px] inline-flex items-center justify-center bg-brand text-white border border-brand font-semibold text-[14px]"
        >
          Back to my account
        </button>
      </div>
    </div>
  )
}

function Row({ Icon, title, children }) {
  return (
    <div className="px-3.5 py-3 flex items-start gap-3">
      <span className="w-8 h-8 rounded-full bg-brand-bg text-brand grid place-items-center shrink-0">
        <Icon size={14} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-semibold text-ink">{title}</div>
        <div className="mt-0.5 text-[12.5px] text-ink-2 leading-[1.45]">
          {children}
        </div>
      </div>
    </div>
  )
}
