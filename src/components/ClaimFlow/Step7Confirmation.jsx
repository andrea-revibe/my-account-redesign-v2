import { useState } from 'react'
import {
  CheckCircle2,
  Copy,
  Check,
  Mail,
  Clock,
  ShieldCheck,
  Wrench,
} from 'lucide-react'
import { refundBreakdown, formatMoney } from '../../lib/returns'
import { claimTypeLabel, expectedCompletionFor } from '../../lib/claims'
import BnplDisclaimerTooltip, { isBnpl } from '../BnplDisclaimerTooltip'

export default function Step7Confirmation({ state, order, onClose, onTrack }) {
  const [copied, setCopied] = useState(false)
  if (!order) return null
  const isWarranty = state.claimType === 'warranty'
  const isCompensation = state.claimType === 'compensation'
  const refund = isWarranty || isCompensation
    ? null
    : refundBreakdown(
        order,
        state.units,
        state.refundMethod,
        state.claimType,
      )
  const currency = order.currency
  const warrantyEta = isWarranty ? expectedCompletionFor('warranty') : null
  const timeline =
    state.refundMethod === 'wallet'
      ? 'Lands in your Revibe Wallet within 1 hour once return is complete.'
      : isBnpl(order)
        ? `Returns to your ${order.paymentMethod.brand} account in 5–10 business days once return is complete.`
        : 'Returns to your card in 5–10 business days once return is complete.'
  const devicePrepLine = state.devicePrep.neverSetUp
    ? 'You indicated the device was never set up, so no reset was needed.'
    : state.devicePrep.option === 'reset'
      ? 'You confirmed the device is factory reset.'
      : 'Thanks for unlinking the device and sharing your passcode.'

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
          Your request has been submitted
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
            {isCompensation
              ? "We've sent your compensation request details to your email."
              : `We've sent ${isWarranty ? 'warranty claim' : 'return'} instructions and your pickup details to your email.`}
          </Row>
          {isCompensation ? (
            <Row Icon={Clock} title="Expected refund">
              <span className="text-ink font-semibold">
                Amount confirmed after review
              </span>{' '}
              ·{' '}
              {state.refundMethod === 'wallet' ? (
                'Revibe Wallet'
              ) : isBnpl(order) ? (
                <span className="inline-flex items-center gap-1">
                  {order.paymentMethod.brand}
                  <BnplDisclaimerTooltip
                    provider={order.paymentMethod.provider}
                    align="left"
                  />
                </span>
              ) : (
                `${order.paymentMethod?.brand || 'Card'} •• ${order.paymentMethod?.last4 || '0000'}`
              )}
              <span className="block mt-1 text-[12px] text-muted">
                You keep the device. We'll review your evidence and confirm the
                amount before refunding.
              </span>
            </Row>
          ) : isWarranty ? (
            <Row Icon={Wrench} title="Expected back">
              <span className="text-ink font-semibold">
                {warrantyEta?.long || 'Soon'}
              </span>
              <span className="block mt-1 text-[12px] text-muted">
                No refund is issued — the same device is returned to you after
                repair.
              </span>
            </Row>
          ) : (
            <Row Icon={Clock} title="Expected refund">
              <span className="text-ink font-semibold">
                {currency} {formatMoney(refund.net)}
              </span>{' '}
              ·{' '}
              {state.refundMethod === 'wallet' ? (
                'Revibe Wallet'
              ) : isBnpl(order) ? (
                <span className="inline-flex items-center gap-1">
                  {order.paymentMethod.brand}
                  <BnplDisclaimerTooltip
                    provider={order.paymentMethod.provider}
                    align="left"
                  />
                </span>
              ) : (
                `${order.paymentMethod?.brand || 'Card'} •• ${order.paymentMethod?.last4 || '0000'}`
              )}
              <span className="block mt-1 text-[12px] text-muted">
                {timeline}
              </span>
            </Row>
          )}
          {!isCompensation && (
            <Row Icon={ShieldCheck} title="Device preparation">
              {devicePrepLine}
            </Row>
          )}
        </div>
      </div>

      <div className="mt-auto sticky bottom-0 bg-surface border-t border-line px-4 py-3 flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 h-[48px] rounded-[12px] inline-flex items-center justify-center bg-surface text-ink border border-line font-semibold text-[14px]"
        >
          Back to my account
        </button>
        <button
          type="button"
          onClick={() => (onTrack ? onTrack(order?.id) : onClose())}
          className="flex-1 h-[48px] rounded-[12px] inline-flex items-center justify-center bg-brand text-white border border-brand font-semibold text-[14px]"
        >
          {isWarranty
            ? 'Track this claim'
            : isCompensation
              ? 'Track this compensation'
              : 'Track this return'}
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
