import { CreditCard } from 'lucide-react'
import StepHeading from './StepHeading'
import WalletInfoTooltip, { REVIBE_WALLET_ICON } from '../WalletInfoTooltip'
import { refundBreakdown, formatMoney } from '../../lib/returns'

export default function Step7RefundMethod({ state, dispatch, order }) {
  if (!order) return null
  const currency = order.currency
  const wallet = refundBreakdown(order, state.units, 'wallet')
  const original = refundBreakdown(order, state.units, 'original')

  return (
    <>
      <StepHeading
        title="How would you like your refund?"
        subtitle="Two options — Wallet refunds you 100%, card has a 10% restocking fee."
      />
      <div className="px-4 flex flex-col gap-2.5">
        <RefundCard
          selected={state.refundMethod === 'wallet'}
          onSelect={() =>
            dispatch({ type: 'SET_REFUND_METHOD', value: 'wallet' })
          }
          recommended
          title={
            <span className="flex items-center gap-1.5">
              <img
                src={REVIBE_WALLET_ICON}
                alt=""
                aria-hidden
                className="w-4 h-4 object-contain"
              />
              <span>Revibe Wallet</span>
              <WalletInfoTooltip stopPropagation />
            </span>
          }
          amount={`${currency} ${formatMoney(wallet.net)}`}
          amountHint="Full refund · no fees"
          detail="Available in your wallet within 1 hour."
        />
        <RefundCard
          selected={state.refundMethod === 'original'}
          onSelect={() =>
            dispatch({ type: 'SET_REFUND_METHOD', value: 'original' })
          }
          title={
            <span className="flex items-center gap-1.5">
              <CreditCard size={14} strokeWidth={1.75} className="text-ink-2" />
              <span>
                {order.paymentMethod?.brand || 'Card'} ••{' '}
                {order.paymentMethod?.last4 || '0000'}
              </span>
            </span>
          }
          amount={`${currency} ${formatMoney(original.net)}`}
          amountHint={
            <>
              <span className="line-through text-muted">
                {currency} {formatMoney(original.gross)}
              </span>{' '}
              · −{currency} {formatMoney(original.fee)} (10% restocking fee)
            </>
          }
          detail="Returns to your card in 5–10 business days."
        />
      </div>
    </>
  )
}

function RefundCard({
  selected,
  onSelect,
  recommended,
  title,
  amount,
  amountHint,
  detail,
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full text-left rounded-[14px] border-2 px-3.5 py-3.5 transition-colors ${
        selected ? 'border-brand bg-brand-bg/30' : 'border-line bg-surface'
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={`mt-1 w-[18px] h-[18px] rounded-full border-2 grid place-items-center shrink-0 ${
            selected ? 'border-brand' : 'border-line'
          }`}
        >
          {selected && <span className="w-2 h-2 rounded-full bg-brand" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-[14.5px] font-semibold text-ink">{title}</div>
            {recommended && (
              <span className="inline-flex items-center rounded-full bg-success-bg text-success font-bold uppercase tracking-[0.06em] h-5 px-2 text-[10px]">
                Recommended
              </span>
            )}
          </div>
          <div className="mt-2 text-[22px] font-bold text-ink tabular-nums leading-none">
            {amount}
          </div>
          <div className="mt-1 text-[12px] text-muted">{amountHint}</div>
          <div className="mt-2 text-[12px] text-ink-2">{detail}</div>
        </div>
      </div>
    </button>
  )
}
