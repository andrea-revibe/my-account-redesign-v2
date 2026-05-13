import { Minus, Plus } from 'lucide-react'
import StepHeading from './StepHeading'

export default function Step3ProductQuantity({ state, dispatch, order }) {
  if (!order) return null
  const max = order.quantity || 1
  const single = max === 1

  return (
    <>
      <StepHeading
        title="What are you returning?"
        subtitle={
          single
            ? "Confirm the item you'd like to return."
            : `You can return any number of units from this order.`
        }
      />
      <div className="px-4">
        <div className="rounded-[14px] border border-line bg-surface p-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-16 rounded-[10px] bg-brand-bg border border-line-2 grid place-items-center p-1 shrink-0">
              <img
                src={order.product.image}
                alt=""
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
                Order · #{order.id}
              </div>
              <div className="text-[15px] font-semibold text-ink truncate mt-0.5">
                {order.product.name}
              </div>
              <div className="text-[12.5px] text-muted truncate">
                {order.product.variant}
              </div>
              <div className="text-[11.5px] text-muted mt-1">
                {max} in order
              </div>
            </div>
          </div>

          {single ? (
            <div className="mt-4 rounded-[10px] bg-line-2/60 px-3 py-2.5 text-[12.5px] text-ink-2">
              Returning <span className="font-semibold text-ink">1 of 1</span> unit.
            </div>
          ) : (
            <div className="mt-4 pt-4 border-t border-line flex items-center justify-between">
              <div className="text-[13px] font-semibold text-ink">
                How many?
              </div>
              <Stepper
                value={state.units}
                min={1}
                max={max}
                onChange={(v) => dispatch({ type: 'SET_UNITS', value: v })}
              />
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function Stepper({ value, min, max, onChange }) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))
  return (
    <div className="inline-flex items-center gap-2">
      <StepperBtn onClick={dec} disabled={value <= min} aria-label="Decrease">
        <Minus size={14} strokeWidth={2} />
      </StepperBtn>
      <span className="min-w-[28px] text-center text-[15px] font-bold tabular-nums text-ink">
        {value}
      </span>
      <StepperBtn onClick={inc} disabled={value >= max} aria-label="Increase">
        <Plus size={14} strokeWidth={2} />
      </StepperBtn>
    </div>
  )
}

function StepperBtn({ onClick, disabled, children, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="w-9 h-9 rounded-full border border-line bg-surface text-ink grid place-items-center disabled:opacity-40 disabled:cursor-not-allowed hover:bg-line-2"
      {...rest}
    >
      {children}
    </button>
  )
}
