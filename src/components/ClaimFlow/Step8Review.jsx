import { Pencil, CreditCard } from 'lucide-react'
import StepHeading from './StepHeading'
import { refundBreakdown, formatMoney } from '../../lib/returns'

const REASON_LABELS = {
  no_fit: "Didn't suit my needs",
  better_option: 'Found a better option elsewhere',
  changed_mind: 'Changed my mind',
  mistake: 'Ordered by mistake',
  other: 'Other',
}

const RETURN_METHOD_LABELS = {
  courier: 'Courier pickup',
  dropoff: 'Drop-off at partner location',
  store: 'In-store return',
}

export default function Step8Review({ state, dispatch, order }) {
  if (!order) return null
  const currency = order.currency
  const refund = refundBreakdown(order, state.units, state.refundMethod)
  const reasonText = !state.reason.value
    ? 'Not provided'
    : state.reason.value === 'other' && state.reason.otherText.trim()
      ? state.reason.otherText.trim()
      : REASON_LABELS[state.reason.value]

  const devicePrep =
    state.devicePrep.option === 'reset'
      ? 'Factory reset confirmed'
      : 'Credentials provided'

  const returnMethod = RETURN_METHOD_LABELS[state.returnMethod.id]
  const refundMethodLabel =
    state.refundMethod === 'wallet'
      ? 'Revibe Wallet'
      : `${order.paymentMethod?.brand || 'Card'} •• ${order.paymentMethod?.last4 || '0000'}`

  const goTo = (step) => dispatch({ type: 'GO_TO_STEP', value: step })

  return (
    <>
      <StepHeading
        title="Review your return"
        subtitle="Double-check before you submit. You can edit any section."
      />

      <div className="px-4 flex flex-col gap-3">
        <Section title="Order" onEdit={() => goTo(2)}>
          <div className="flex items-center gap-3">
            <div className="w-11 h-13 rounded-[10px] bg-brand-bg border border-line-2 grid place-items-center p-1 shrink-0">
              <img
                src={order.product.image}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
                Order · #{order.id}
              </div>
              <div className="text-[14px] font-semibold text-ink truncate mt-0.5">
                {order.product.name}
              </div>
              <div className="text-[12px] text-muted truncate">
                {order.product.variant}
              </div>
            </div>
          </div>
        </Section>

        <Section title="Returning" onEdit={() => goTo(3)}>
          <KeyValue
            label="Units"
            value={`${state.units} of ${order.quantity || 1}`}
          />
        </Section>

        <Section title="Reason" onEdit={() => goTo(4)}>
          <div
            className={`text-[13.5px] ${
              state.reason.value ? 'text-ink' : 'text-muted italic'
            }`}
          >
            {reasonText}
          </div>
        </Section>

        <Section title="Device preparation" onEdit={() => goTo(5)}>
          <div className="text-[13.5px] text-ink">{devicePrep}</div>
        </Section>

        <Section title="Return method" onEdit={() => goTo(6)}>
          <div className="text-[13.5px] text-ink">{returnMethod}</div>
          {state.returnMethod.id === 'courier' && state.returnMethod.address && (
            <div className="text-[12px] text-muted mt-1 whitespace-pre-line">
              {state.returnMethod.address}
            </div>
          )}
        </Section>

        <Section title="Refund" onEdit={() => goTo(7)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-[13.5px] text-ink flex items-center gap-1.5">
                {state.refundMethod === 'original' && (
                  <CreditCard
                    size={13}
                    strokeWidth={1.75}
                    className="text-ink-2"
                  />
                )}
                {refundMethodLabel}
              </div>
              {state.refundMethod === 'original' && (
                <div className="text-[11.5px] text-muted mt-0.5">
                  Includes 10% restocking fee
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
                You'll receive
              </div>
              <div className="text-[18px] font-bold text-ink tabular-nums leading-none mt-1">
                {currency} {formatMoney(refund.net)}
              </div>
            </div>
          </div>
        </Section>
      </div>
    </>
  )
}

function Section({ title, onEdit, children }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface px-3.5 py-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="m-0 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          {title}
        </h3>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand hover:underline"
        >
          <Pencil size={11} strokeWidth={2} />
          Edit
        </button>
      </div>
      {children}
    </div>
  )
}

function KeyValue({ label, value }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[13px] text-muted">{label}</span>
      <span className="text-[13.5px] font-semibold text-ink tabular-nums">
        {value}
      </span>
    </div>
  )
}
