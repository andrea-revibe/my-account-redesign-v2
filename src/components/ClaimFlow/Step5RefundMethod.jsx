import { CreditCard, Clock } from 'lucide-react'
import StepHeading from './StepHeading'
import WalletInfoTooltip, { REVIBE_WALLET_ICON } from '../WalletInfoTooltip'
import { refundBreakdown, formatMoney } from '../../lib/returns'

const REVIBE_CARE_ICON =
  'https://cdn.shopify.com/s/files/1/0695/1737/7855/files/Revibe_logo_RE_CARE_Color_copy.png?v=1719938652'

export default function Step5RefundMethod({ state, dispatch, order }) {
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
        >
          <div className="mt-2 text-[12.5px] font-semibold text-success leading-[1.4] whitespace-nowrap">
            Full refund · instantly once return is complete
          </div>
        </RefundCard>
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
        >
          <div className="mt-3 pt-3 border-t border-dashed border-line flex flex-col gap-1.5">
            <BreakdownRow
              label="Product"
              value={`${currency} ${formatMoney(original.itemTotal)}`}
            />
            {original.warranty > 0 && (
              <BreakdownRow
                label={
                  <span className="inline-flex items-center gap-1.5">
                    <img
                      src={REVIBE_CARE_ICON}
                      alt=""
                      aria-hidden
                      className="w-3.5 h-3.5 object-contain shrink-0"
                    />
                    Revibe Care
                  </span>
                }
                value={`${currency} ${formatMoney(original.warranty)}`}
              />
            )}
            <BreakdownRow
              label="Subtotal"
              value={`${currency} ${formatMoney(original.gross)}`}
            />
            <BreakdownRow
              label="Restocking fee (10%)"
              value={`−${currency} ${formatMoney(original.fee)}`}
              tone="danger"
            />
          </div>
          <div className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-2 leading-[1.4] whitespace-nowrap">
            <Clock size={12} strokeWidth={2} className="text-ink-2 shrink-0" />
            5–10 business days once return is complete
          </div>
        </RefundCard>
      </div>
    </>
  )
}

function RefundCard({ selected, onSelect, title, amount, children }) {
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
          <div className="text-[14.5px] font-semibold text-ink">{title}</div>
          <div className="mt-2 text-[22px] font-bold text-ink tabular-nums leading-none">
            {amount}
          </div>
          {children}
        </div>
      </div>
    </button>
  )
}

function BreakdownRow({ label, value, tone }) {
  const valueClass =
    tone === 'danger' ? 'text-danger font-semibold' : 'text-ink'
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-ink-2">{label}</span>
      <span className={`tabular-nums ${valueClass}`}>{value}</span>
    </div>
  )
}
