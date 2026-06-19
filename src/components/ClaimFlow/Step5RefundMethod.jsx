import { CreditCard, Clock, Sparkles } from 'lucide-react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'
import WalletInfoTooltip, { REVIBE_WALLET_ICON } from '../WalletInfoTooltip'
import BnplDisclaimerTooltip, { isBnpl } from '../BnplDisclaimerTooltip'
import { refundBreakdown, formatMoney } from '../../lib/returns'
import { REVIBE_CARE_ICON } from '../ProductSummary'
import RefundSplitRows from '../RefundSplitRows'

export default function Step5RefundMethod({ state, dispatch, order, error }) {
  if (!order) return null
  const currency = order.currency
  const claimType = state.claimType
  const showError = error === 'refundMethod'
  if (claimType === 'compensation') {
    return (
      <CompensationDestination
        state={state}
        dispatch={dispatch}
        order={order}
        showError={showError}
      />
    )
  }
  const isIssue = claimType === 'issue'
  const wallet = refundBreakdown(order, state.units, 'wallet', claimType)
  const original = refundBreakdown(order, state.units, 'original', claimType)
  const subtitle = isIssue
    ? `Two options — Wallet adds an AED ${wallet.bonus} bonus, card refunds the full amount.`
    : 'Two options — Wallet refunds you 100%, card has a 10% restocking fee.'

  return (
    <>
      <StepHeading
        title="How would you like your refund?"
        subtitle={subtitle}
      />
      <div className="px-4 flex flex-col gap-2.5">
        {showError && (
          <InlineError>Choose how you'd like your refund to continue.</InlineError>
        )}
        <RefundCard
          selected={state.refundMethod === 'wallet'}
          error={showError}
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
          {isIssue && wallet.bonus > 0 && (
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-accent/15 text-accent font-bold uppercase tracking-[0.06em] h-5 px-2 text-[10px]">
              <Sparkles size={10} strokeWidth={2} />
              +{currency} {formatMoney(wallet.bonus)} bonus
            </div>
          )}
          <div className="mt-2 text-[12.5px] font-semibold text-success leading-[1.4] whitespace-nowrap">
            {isIssue
              ? `Full refund + bonus · instantly once return is complete`
              : 'Full refund · instantly once return is complete'}
          </div>
        </RefundCard>
        <RefundCard
          selected={state.refundMethod === 'original'}
          error={showError}
          onSelect={() =>
            dispatch({ type: 'SET_REFUND_METHOD', value: 'original' })
          }
          title={
            <span className="flex items-center gap-1.5">
              <CreditCard size={14} strokeWidth={1.75} className="text-ink-2" />
              {isBnpl(order) ? (
                <>
                  <span>{order.paymentMethod.brand}</span>
                  <BnplDisclaimerTooltip
                    provider={order.paymentMethod.provider}
                    align="left"
                  />
                </>
              ) : (
                <span>
                  {order.paymentMethod?.brand || 'Card'} ••{' '}
                  {order.paymentMethod?.last4 || '0000'}
                </span>
              )}
            </span>
          }
          amount={`${currency} ${formatMoney(original.net)}`}
        >
          {!isIssue && (
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
          )}
          <RefundSplitRows
            order={order}
            net={original.net}
            caption="Split across your original payment"
            showTotal
            totalLabel="Total refund"
            className="mt-3 pt-3 border-t border-dashed border-line"
          />
          <div className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-2 leading-[1.4] whitespace-nowrap">
            <Clock size={12} strokeWidth={2} className="text-ink-2 shrink-0" />
            {isIssue
              ? 'Full refund · 5–10 business days once return is complete'
              : '5–10 business days once return is complete'}
          </div>
        </RefundCard>
      </div>
    </>
  )
}

// Compensation refund destination. Same Wallet-vs-original choice as the
// refund flows, but the amount is unknown at submission — support confirms
// it after reviewing the evidence — so each card shows a "confirmed after
// review" note in place of a figure (no bonus / restocking math).
function CompensationDestination({ state, dispatch, order, showError }) {
  const reviewNote = 'Amount confirmed by support after review'
  return (
    <>
      <StepHeading
        title="Where should your refund go?"
        subtitle="Pick where the money lands. We'll confirm the exact amount after reviewing your claim."
      />
      <div className="px-4 flex flex-col gap-2.5">
        {showError && (
          <InlineError>Pick where your refund should go to continue.</InlineError>
        )}
        <RefundCard
          selected={state.refundMethod === 'wallet'}
          error={showError}
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
        >
          <div className="text-[13px] font-semibold text-ink-2">{reviewNote}</div>
          <div className="mt-1.5 text-[12.5px] font-semibold text-success leading-[1.4]">
            Lands instantly once your claim is approved
          </div>
        </RefundCard>
        <RefundCard
          selected={state.refundMethod === 'original'}
          error={showError}
          onSelect={() =>
            dispatch({ type: 'SET_REFUND_METHOD', value: 'original' })
          }
          title={
            <span className="flex items-center gap-1.5">
              <CreditCard size={14} strokeWidth={1.75} className="text-ink-2" />
              {isBnpl(order) ? (
                <>
                  <span>{order.paymentMethod.brand}</span>
                  <BnplDisclaimerTooltip
                    provider={order.paymentMethod.provider}
                    align="left"
                  />
                </>
              ) : (
                <span>
                  {order.paymentMethod?.brand || 'Card'} ••{' '}
                  {order.paymentMethod?.last4 || '0000'}
                </span>
              )}
            </span>
          }
        >
          <div className="text-[13px] font-semibold text-ink-2">{reviewNote}</div>
          <div className="mt-1.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-2 leading-[1.4]">
            <Clock size={12} strokeWidth={2} className="text-ink-2 shrink-0" />
            5–10 business days once your claim is approved
          </div>
        </RefundCard>
      </div>
    </>
  )
}

function RefundCard({ selected, onSelect, title, amount, children, error }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full text-left rounded-[14px] border-2 px-3.5 py-3.5 transition-colors ${
        selected
          ? 'border-brand bg-brand-bg/30'
          : error
            ? 'border-danger bg-surface'
            : 'border-line bg-surface'
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
          {amount && (
            <div className="mt-2 text-[22px] font-bold text-ink tabular-nums leading-none">
              {amount}
            </div>
          )}
          <div className={amount ? '' : 'mt-2'}>{children}</div>
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
