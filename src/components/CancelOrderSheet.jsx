import { useEffect, useState } from 'react'
import { X, ChevronLeft, Info, ShieldCheck } from 'lucide-react'
import WalletInfoTooltip, { REVIBE_WALLET_ICON } from './WalletInfoTooltip'

const REVIBE_CARE_ICON =
  'https://cdn.shopify.com/s/files/1/0695/1737/7855/files/Revibe_logo_RE_CARE_Color_copy.png?v=1719938652'

export default function CancelOrderSheet({ order, open, onClose }) {
  const [step, setStep] = useState('select')
  const [method, setMethod] = useState(null)

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

  useEffect(() => {
    if (open) {
      setStep('select')
      setMethod(null)
    }
  }, [open])

  if (!open) return null

  const subtotal = order.subtotal ?? order.total
  const warranty = order.warranty
  const total = order.total
  const fee = Math.round(total * 0.05 * 100) / 100
  const refundOriginal = Math.round((total - fee) * 100) / 100
  const currency = order.currency

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
        {step === 'select' && (
          <SelectStep
            order={order}
            method={method}
            setMethod={setMethod}
            onClose={onClose}
            onContinue={() => {
              if (method === 'original' && order.statusId === 'created') {
                setStep('dissuade')
              } else {
                setStep('confirm')
              }
            }}
            subtotal={subtotal}
            warranty={warranty}
            total={total}
            fee={fee}
            refundOriginal={refundOriginal}
            currency={currency}
          />
        )}
        {step === 'dissuade' && (
          <DissuadeStep
            order={order}
            onBack={() => setStep('select')}
            onClose={onClose}
            onContinueToCancel={() => setStep('confirm')}
            fee={fee}
            currency={currency}
          />
        )}
        {step === 'confirm' && (
          <ConfirmStep
            order={order}
            method={method}
            onBack={() => {
              if (method === 'original' && order.statusId === 'created') {
                setStep('dissuade')
              } else {
                setStep('select')
              }
            }}
            onClose={onClose}
            onConfirm={onClose}
            total={total}
            fee={fee}
            refundOriginal={refundOriginal}
            currency={currency}
          />
        )}
      </div>
    </div>
  )
}

function SheetHeader({ title, subtitle, onBack, onClose }) {
  return (
    <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-line">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-8 h-8 -ml-1 rounded-full grid place-items-center text-ink hover:bg-line-2"
        >
          <ChevronLeft size={18} strokeWidth={1.75} />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold text-ink leading-[1.2]">
          {title}
        </div>
        {subtitle && (
          <div className="text-[12px] text-muted mt-0.5 truncate">
            {subtitle}
          </div>
        )}
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
  )
}

function SelectStep({
  order,
  method,
  setMethod,
  onClose,
  onContinue,
  subtotal,
  warranty,
  total,
  fee,
  refundOriginal,
  currency,
}) {
  return (
    <>
      <SheetHeader
        title="Cancel order"
        subtitle={`#${order.id}`}
        onClose={onClose}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
        <Section label="Order summary">
          <div className="rounded-[14px] border border-line bg-surface p-3.5">
            <div className="flex items-center gap-3 pb-3 border-b border-dashed border-line">
              <div className="w-11 h-14 rounded-[10px] bg-brand-bg border border-line-2 grid place-items-center p-1 shrink-0">
                <img
                  src={order.product.image}
                  alt=""
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-ink truncate">
                  {order.product.name}
                </div>
                <div className="text-[12px] text-muted mt-0.5 truncate">
                  {order.product.variant}
                </div>
              </div>
            </div>
            <div className="pt-3 flex flex-col gap-2">
              <LineItem
                label="Product"
                value={`${currency} ${formatMoney(subtotal)}`}
              />
              {warranty != null && (
                <LineItem
                  label={
                    <span className="inline-flex items-center gap-1.5">
                      <img
                        src={REVIBE_CARE_ICON}
                        alt=""
                        className="w-3.5 h-3.5 object-contain shrink-0"
                      />
                      Revibe Care
                    </span>
                  }
                  value={`${currency} ${formatMoney(warranty)}`}
                />
              )}
              <div className="border-t border-line my-1" />
              <LineItem
                label="Total"
                value={`${currency} ${formatMoney(total)}`}
                bold
              />
            </div>
          </div>
        </Section>

        <Section label="Choose your refund">
          <div className="flex flex-col gap-2.5">
            <RefundOption
              selected={method === 'store_credit'}
              onSelect={() => setMethod('store_credit')}
              title="Revibe Wallet"
              icon={REVIBE_WALLET_ICON}
              info
              amountLine={`${currency} ${formatMoney(total)} back to your Revibe Wallet`}
              detailLine="Full refund · available instantly"
              detailHighlight
            />
            <RefundOption
              selected={method === 'original'}
              onSelect={() => setMethod('original')}
              title="Original payment method"
              amountLine={`${currency} ${formatMoney(refundOriginal)} back to your card`}
              detailLine={`−${currency} ${formatMoney(fee)} (5% processing fee) · 5–10 business days`}
            />
          </div>
        </Section>
      </div>
      <SheetFooter>
        <FooterBtn variant="secondary" onClick={onClose}>
          Keep order
        </FooterBtn>
        <FooterBtn variant="primary" disabled={!method} onClick={onContinue}>
          Continue
        </FooterBtn>
      </SheetFooter>
    </>
  )
}

function ConfirmStep({
  order,
  method,
  onBack,
  onClose,
  onConfirm,
  total,
  fee,
  refundOriginal,
  currency,
}) {
  const isStoreCredit = method === 'store_credit'
  const amount = isStoreCredit ? total : refundOriginal
  const destination = isStoreCredit ? 'Revibe Wallet' : 'original payment method'
  const eta = isStoreCredit
    ? 'Available instantly after cancellation.'
    : 'Refunded to your card in 5–10 business days.'
  const message = isStoreCredit ? (
    <>
      <span className="font-semibold">Revibe Wallet credit stays on Revibe.</span>{' '}
      It won't be paid out to your bank account.
    </>
  ) : (
    <span className="font-semibold">
      You're giving up {currency} {formatMoney(fee)} to the processing fee.
    </span>
  )
  return (
    <>
      <SheetHeader
        title="Confirm cancellation"
        subtitle={`#${order.id}`}
        onBack={onBack}
        onClose={onClose}
      />
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">
        <div className="rounded-[16px] border border-line bg-canvas p-5 text-center">
          <div className="text-[11.5px] uppercase tracking-[0.06em] font-bold text-muted">
            You'll receive
          </div>
          <div className="mt-1 text-[28px] font-bold text-ink tracking-[-0.02em]">
            {currency} {formatMoney(amount)}
          </div>
          {!isStoreCredit && (
            <div className="mt-1 text-[12px] text-muted">
              Total {currency} {formatMoney(total)} · −{currency}{' '}
              {formatMoney(fee)} fee
            </div>
          )}
          <div className="mt-1 text-[13px] text-ink-2 flex items-center justify-center gap-1.5 flex-wrap">
            <span>back to your</span>
            {isStoreCredit ? (
              <>
                <img
                  src={REVIBE_WALLET_ICON}
                  alt=""
                  aria-hidden
                  className="w-4 h-4 object-contain"
                />
                <span className="text-ink font-semibold">Revibe Wallet</span>
                <WalletInfoTooltip />
              </>
            ) : (
              <span>{destination}</span>
            )}
          </div>
          <div className="mt-3 text-[12px] text-muted">{eta}</div>
        </div>
        <div className="flex items-start gap-2.5 rounded-[12px] border border-line bg-line-2 p-3 text-[12.5px] text-ink leading-[1.45]">
          <Info
            size={16}
            strokeWidth={1.75}
            className="text-muted shrink-0 mt-px"
          />
          <span>{message}</span>
        </div>
      </div>
      <SheetFooter>
        <FooterBtn variant="secondary" onClick={onBack}>
          Back
        </FooterBtn>
        <FooterBtn variant="danger" onClick={onConfirm}>
          Cancel order
        </FooterBtn>
      </SheetFooter>
    </>
  )
}

function DissuadeStep({
  order,
  onBack,
  onClose,
  onContinueToCancel,
  fee,
  currency,
}) {
  const deliveryDate =
    formatDeliveryDate(order.estimatedDelivery, order.placedAt) ||
    order.estimatedDelivery
  const shipDeadlineFull =
    order.shipDeadlineFull ||
    formatDeliveryDate(order.shipDeadline, order.placedAt) ||
    order.shipDeadline
  return (
    <>
      <SheetHeader
        title="Cancel this order?"
        subtitle={`#${order.id}`}
        onBack={onBack}
        onClose={onClose}
      />
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">
        <div className="rounded-[16px] border border-line bg-canvas p-5 text-center">
          <div className="text-[12.5px] text-ink-2 leading-[1.4]">
            You're on track to receive your{' '}
            <span className="font-semibold text-ink">{order.product.name}</span>{' '}
            by
          </div>
          <div className="mt-2 text-[24px] font-bold text-ink tracking-[-0.01em]">
            {deliveryDate}
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-[12px] border border-line bg-line-2 p-3 text-[12.5px] text-ink leading-[1.45]">
          <Info
            size={16}
            strokeWidth={1.75}
            className="text-muted shrink-0 mt-px"
          />
          <span>
            If you cancel,{' '}
            <span className="font-semibold">
              this item may not be available to reorder later.
            </span>
          </span>
        </div>
        <div className="flex items-start gap-2.5 rounded-[12px] border border-success/30 bg-success-bg p-3 text-[12.5px] text-ink leading-[1.45]">
          <ShieldCheck
            size={16}
            strokeWidth={1.75}
            className="text-success shrink-0 mt-px"
          />
          <span>
            If we don't ship by{' '}
            <span className="font-semibold">{shipDeadlineFull}</span>, the{' '}
            <span className="font-semibold">
              {currency} {formatMoney(fee)}
            </span>{' '}
            processing fee is waived.
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 px-4 py-3 border-t border-line bg-surface">
        <button
          type="button"
          onClick={onClose}
          className="w-full h-[52px] rounded-[12px] inline-flex items-center justify-center gap-1.5 bg-brand text-white border border-brand font-semibold text-[14.5px]"
        >
          Keep my order
        </button>
        <button
          type="button"
          onClick={onContinueToCancel}
          className="w-full h-[52px] rounded-[12px] inline-flex items-center justify-center bg-surface text-ink border border-line font-semibold text-[14.5px] transition-colors hover:bg-danger-bg hover:text-danger hover:border-danger"
        >
          Continue to cancel
        </button>
      </div>
    </>
  )
}

function Section({ label, children }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="m-0 text-[11.5px] font-bold uppercase tracking-[0.06em] text-muted">
        {label}
      </h3>
      {children}
    </div>
  )
}

function LineItem({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`text-[13px] ${bold ? 'font-bold text-ink' : 'text-ink-2'}`}
      >
        {label}
      </span>
      <span
        className={`text-[13.5px] tabular-nums ${bold ? 'font-bold text-ink' : 'text-ink'}`}
      >
        {value}
      </span>
    </div>
  )
}

function RefundOption({
  selected,
  onSelect,
  title,
  icon,
  info,
  amountLine,
  detailLine,
  detailHighlight,
}) {
  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onSelect()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={handleKey}
      aria-pressed={selected}
      className={`text-left rounded-[14px] border-2 px-3.5 py-3 flex items-start gap-3 transition-colors cursor-pointer ${
        selected
          ? 'border-brand bg-brand-bg/40'
          : 'border-line bg-surface hover:bg-line-2/40'
      }`}
    >
      <span
        aria-hidden
        className={`mt-0.5 w-[18px] h-[18px] rounded-full border-2 grid place-items-center shrink-0 ${
          selected ? 'border-brand' : 'border-line'
        }`}
      >
        {selected && <span className="w-2 h-2 rounded-full bg-brand" />}
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5 flex-wrap">
          {icon && (
            <img
              src={icon}
              alt=""
              aria-hidden
              className="w-4 h-4 object-contain shrink-0"
            />
          )}
          <span className="text-[14px] font-semibold text-ink">{title}</span>
          {info && <WalletInfoTooltip stopPropagation />}
        </span>
        <span className="block mt-1 text-[13px] text-ink">{amountLine}</span>
        <span
          className={`block mt-0.5 text-[11.5px] ${
            detailHighlight ? 'text-success font-semibold' : 'text-muted'
          }`}
        >
          {detailLine}
        </span>
      </span>
    </div>
  )
}

function SheetFooter({ children }) {
  return (
    <div className="flex gap-2 px-4 py-3 border-t border-line bg-surface">
      {children}
    </div>
  )
}

function FooterBtn({ variant, disabled, onClick, children }) {
  const styles = {
    primary: 'bg-brand text-white border-brand disabled:opacity-50',
    secondary: 'bg-surface text-ink border-line',
    danger: 'bg-danger text-white border-danger',
  }[variant]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 h-[44px] rounded-[10px] inline-flex items-center justify-center gap-1.5 border font-semibold text-[13.5px] ${styles}`}
    >
      {children}
    </button>
  )
}

function formatMoney(n) {
  return Number.isInteger(n) ? n.toLocaleString() : n.toFixed(2)
}

function formatDeliveryDate(estimatedDelivery, placedAt) {
  if (!estimatedDelivery) return null
  const yearMatch = placedAt && placedAt.match(/(\d{4})/)
  const year = yearMatch ? Number(yearMatch[1]) : new Date().getFullYear()
  const date = new Date(`${estimatedDelivery}, ${year}`)
  if (Number.isNaN(date.getTime())) return null
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const day = date.getDate()
  const month = date.toLocaleDateString('en-US', { month: 'long' })
  return `${weekday}, ${day} ${month}`
}
