import { useEffect, useState } from 'react'
import {
  X,
  ChevronLeft,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  CreditCard,
} from 'lucide-react'
import WalletInfoTooltip, { REVIBE_WALLET_ICON } from './WalletInfoTooltip'
import { formatMoney } from '../lib/returns'
import { latestSwitchableCredit, cardEquivalentFor } from '../lib/wallet'

// Bottom sheet for the Revibe Wallet, opened from the GreetRow pill. Two
// internal views: `list` (balance + transaction history, with a Move-to-card
// affordance on the latest switchable credit) and `confirm` (the deduction
// breakdown + the resulting card amount). Mirrors the scaffolding of
// ClaimDetailsSheet / RefundDetailsSheet so the sheets feel like siblings.
// The switch is self-contained: confirming calls onMoveToCard(txId), which
// the parent records in-session (undoable) and the derived ledger reflects.
export default function WalletSheet({
  ledger = [],
  balance = 0,
  currency = 'AED',
  open,
  onClose,
  onMoveToCard,
}) {
  const [view, setView] = useState('list')

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key !== 'Escape') return
      if (view === 'confirm') setView('list')
      else onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose, view])

  useEffect(() => {
    if (open) setView('list')
  }, [open])

  if (!open) return null

  const latest = latestSwitchableCredit(ledger)
  const cardInfo = latest ? cardEquivalentFor(latest) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Revibe Wallet"
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 animate-fadeIn"
      />
      <div className="relative w-full max-w-mobile bg-surface rounded-t-[22px] shadow-lg2 max-h-[92vh] flex flex-col animate-slideUp overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-line">
          {view === 'confirm' && (
            <button
              type="button"
              onClick={() => setView('list')}
              aria-label="Back"
              className="w-8 h-8 -ml-1 rounded-full grid place-items-center text-ink hover:bg-line-2"
            >
              <ChevronLeft size={20} strokeWidth={1.75} />
            </button>
          )}
          <div className="flex-1 min-w-0 flex items-center gap-1.5">
            <img
              src={REVIBE_WALLET_ICON}
              alt=""
              aria-hidden
              className="w-4 h-4 object-contain"
            />
            <div className="text-[15px] font-bold text-ink leading-[1.2]">
              {view === 'confirm' ? 'Move to card' : 'Revibe Wallet'}
            </div>
            {view === 'list' && <WalletInfoTooltip align="left" />}
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

        {view === 'list' ? (
          <ListView
            ledger={ledger}
            balance={balance}
            currency={currency}
            latestId={latest?.id}
            onMove={() => setView('confirm')}
          />
        ) : (
          <ConfirmView
            tx={latest}
            cardInfo={cardInfo}
            currency={currency}
            onConfirm={() => latest && onMoveToCard(latest.id)}
            onBack={() => setView('list')}
          />
        )}
      </div>
    </div>
  )
}

function ListView({ ledger, balance, currency, latestId, onMove }) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
      <div className="rounded-[16px] bg-credits-pill text-white p-4 shadow-md2">
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/80">
          Available balance
        </div>
        <div className="mt-1 text-[30px] font-bold tracking-[-0.02em] tabular-nums leading-none">
          {currency} {formatMoney(balance)}
        </div>
        <div className="mt-2 text-[12px] text-white/85 leading-[1.4]">
          Spend on any product · combinable with any payment method
        </div>
      </div>

      <div className="flex flex-col">
        <h3 className="m-0 text-[11.5px] font-bold uppercase tracking-[0.06em] text-muted mb-1">
          Transactions
        </h3>
        {ledger.map((t) => (
          <TxRow
            key={t.id}
            t={t}
            currency={currency}
            isLatestSwitchable={t.id === latestId}
            onMove={onMove}
          />
        ))}
      </div>
    </div>
  )
}

function TxRow({ t, currency, isLatestSwitchable, onMove }) {
  const credit = t.kind === 'credit'
  const Icon = t.moved ? ArrowRight : credit ? ArrowUpRight : ArrowDownLeft
  const iconTone = t.moved
    ? 'bg-line-2 text-muted'
    : credit
      ? 'bg-success/10 text-success'
      : 'bg-line-2 text-ink-2'
  const amountTone = t.moved
    ? 'text-muted line-through'
    : credit
      ? 'text-success'
      : 'text-ink'
  const sign = !t.moved && credit ? '+' : !credit ? '−' : ''

  return (
    <div className="py-2.5 border-b border-line last:border-b-0">
      <div className="flex items-center gap-3">
        <span
          className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${iconTone}`}
        >
          <Icon size={15} strokeWidth={2} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold text-ink truncate">
            {t.source}
          </div>
          <div className="text-[11.5px] text-muted">
            {t.dateLabel}
            {t.moved && ' · Moved to card'}
          </div>
        </div>
        <div
          className={`text-[14px] font-bold tabular-nums shrink-0 ${amountTone}`}
        >
          {sign}
          {currency} {formatMoney(t.amount)}
        </div>
      </div>
      {isLatestSwitchable && (
        <div className="mt-2 pl-11">
          <button
            type="button"
            onClick={onMove}
            className="inline-flex items-center gap-1 h-8 px-3 rounded-full border border-brand/40 bg-brand-bg/40 text-brand text-[12px] font-bold hover:bg-brand-bg/70 transition-colors"
          >
            <CreditCard size={13} strokeWidth={2} />
            Move to card
            <ArrowRight size={13} strokeWidth={2.25} />
          </button>
        </div>
      )}
    </div>
  )
}

function ConfirmView({ tx, cardInfo, currency, onConfirm, onBack }) {
  if (!tx || !cardInfo) return null
  const hasDeduction = cardInfo.deductions.length > 0
  return (
    <>
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        <p className="text-[13px] text-ink-2 leading-[1.5] m-0">
          Move the credit from{' '}
          <span className="font-semibold text-ink">{tx.source}</span> to{' '}
          <span className="font-semibold text-ink">
            {cardInfo.destinationLabel}
          </span>
          .
        </p>

        <div className="rounded-[14px] border border-line bg-surface p-4 flex flex-col gap-2">
          <Row
            label="In your Wallet now"
            value={`${currency} ${formatMoney(cardInfo.walletAmount)}`}
          />
          {cardInfo.deductions.map((d) => (
            <Row
              key={d.label}
              label={d.label}
              value={`− ${currency} ${formatMoney(d.amount)}`}
              tone="danger"
            />
          ))}
          <div className="border-t border-dashed border-line my-1" />
          <div className="flex items-baseline justify-between">
            <span className="text-[13.5px] font-bold text-ink">
              Lands on {cardInfo.destinationLabel}
            </span>
            <span className="text-[18px] font-bold tabular-nums text-ink">
              {currency} {formatMoney(cardInfo.cardAmount)}
            </span>
          </div>
        </div>

        {hasDeduction ? (
          <div className="rounded-[12px] bg-chip-warn/15 border border-chip-warn/40 px-3.5 py-3 text-[12px] text-chip-warnInk leading-[1.5]">
            Store credit waived this deduction — moving to your card re-applies
            it. Card refunds take 5–10 business days.
          </div>
        ) : (
          <div className="rounded-[12px] bg-line-2 border border-line px-3.5 py-3 text-[12px] text-ink-2 leading-[1.5]">
            The full amount moves to your card — no deduction. Card refunds take
            5–10 business days.
          </div>
        )}
      </div>

      <div className="px-4 py-3 border-t border-line flex gap-2 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 h-12 rounded-[12px] border border-line bg-surface text-ink text-[14px] font-bold hover:bg-line-2 transition-colors"
        >
          Keep in Wallet
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 h-12 rounded-[12px] bg-brand text-white text-[14px] font-bold hover:bg-brand/90 transition-colors tabular-nums"
        >
          Move {currency} {formatMoney(cardInfo.cardAmount)}
        </button>
      </div>
    </>
  )
}

function Row({ label, value, tone }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-ink-2">{label}</span>
      <span
        className={`text-[13.5px] tabular-nums ${
          tone === 'danger' ? 'text-danger font-semibold' : 'text-ink'
        }`}
      >
        {value}
      </span>
    </div>
  )
}
