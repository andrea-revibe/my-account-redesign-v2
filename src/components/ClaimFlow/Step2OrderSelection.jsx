import { useMemo, useState } from 'react'
import { ChevronDown, Check, CalendarClock } from 'lucide-react'
import { ORDERS } from '../../data/orders'
import {
  groupOrdersByEligibility,
  formatLongDate,
} from '../../lib/returns'
import StepHeading from './StepHeading'

export default function Step2OrderSelection({ state, dispatch }) {
  const [showIneligible, setShowIneligible] = useState(false)
  const { eligible, ineligible } = useMemo(
    () => groupOrdersByEligibility(ORDERS),
    [],
  )

  return (
    <>
      <StepHeading
        title="Which order?"
        subtitle="Choose the order you'd like to return from."
      />

      <div className="px-4">
        <SectionLabel>Eligible for return · {eligible.length}</SectionLabel>
        {eligible.length === 0 ? (
          <EmptyState
            title="No eligible orders"
            body="Change-of-mind returns are available for 10 days after delivery."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {eligible.map(({ order, untilDate }) => (
              <EligibleCard
                key={order.id}
                order={order}
                untilDate={untilDate}
                selected={state.orderId === order.id}
                onSelect={() =>
                  dispatch({ type: 'SET_ORDER', value: order.id })
                }
              />
            ))}
          </div>
        )}

        {ineligible.length > 0 && (
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowIneligible((v) => !v)}
              aria-expanded={showIneligible}
              className="w-full flex items-center justify-between py-2.5"
            >
              <span className="text-[12px] font-bold uppercase tracking-[0.08em] text-muted">
                Not eligible · {ineligible.length}
              </span>
              <ChevronDown
                size={16}
                strokeWidth={1.75}
                className="text-muted transition-transform"
                style={{
                  transform: showIneligible ? 'rotate(180deg)' : 'none',
                }}
              />
            </button>
            {showIneligible && (
              <div className="flex flex-col gap-2.5 animate-slideDown">
                {ineligible.map(({ order, reason }) => (
                  <IneligibleCard key={order.id} order={order} reason={reason} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

function SectionLabel({ children }) {
  return (
    <h3 className="m-0 mb-2.5 text-[12px] font-bold uppercase tracking-[0.08em] text-muted">
      {children}
    </h3>
  )
}

function EligibleCard({ order, untilDate, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full text-left rounded-[14px] border-2 px-3.5 py-3 transition-colors ${
        selected
          ? 'border-brand bg-brand-bg/40'
          : 'border-line bg-surface hover:bg-line-2/40'
      }`}
    >
      <div className="flex items-center gap-3">
        <ProductThumb order={order} />
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            Order · #{order.id}
          </div>
          <div className="text-[14px] font-semibold text-ink truncate mt-0.5">
            {order.product.name}
            {order.quantity > 1 && (
              <span className="text-muted font-normal">
                {' '}
                · {order.quantity}×
              </span>
            )}
          </div>
          <div className="text-[12px] text-muted truncate">
            {order.product.variant}
          </div>
        </div>
        <span
          aria-hidden
          className={`w-[18px] h-[18px] rounded-full border-2 grid place-items-center shrink-0 ${
            selected ? 'border-brand bg-brand' : 'border-line'
          }`}
        >
          {selected && <Check size={11} strokeWidth={3} className="text-white" />}
        </span>
      </div>
      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-success-bg text-success px-2.5 h-6 text-[11px] font-semibold">
        <CalendarClock size={11} strokeWidth={2} />
        Eligible to return until {formatLongDate(untilDate)}
      </div>
    </button>
  )
}

function IneligibleCard({ order, reason }) {
  return (
    <div className="rounded-[14px] border border-line bg-line-2/40 px-3.5 py-3 opacity-75">
      <div className="flex items-center gap-3">
        <ProductThumb order={order} muted />
        <div className="flex-1 min-w-0">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            Order · #{order.id}
          </div>
          <div className="text-[14px] font-semibold text-ink-2 truncate mt-0.5">
            {order.product.name}
          </div>
          <div className="text-[12px] text-muted truncate">
            {order.product.variant}
          </div>
        </div>
      </div>
      <div className="mt-2.5 text-[12px] text-muted">
        {reason}
      </div>
    </div>
  )
}

function ProductThumb({ order, muted }) {
  return (
    <div
      className={`w-12 h-14 rounded-[10px] border grid place-items-center p-1 shrink-0 ${
        muted ? 'bg-line-2 border-line' : 'bg-brand-bg border-line-2'
      }`}
    >
      <img
        src={order.product.image}
        alt=""
        className="max-w-full max-h-full object-contain"
      />
    </div>
  )
}

function EmptyState({ title, body }) {
  return (
    <div className="rounded-[14px] border border-dashed border-line bg-surface px-4 py-6 text-center">
      <div className="text-[14px] font-semibold text-ink">{title}</div>
      <div className="text-[12.5px] text-muted mt-1">{body}</div>
    </div>
  )
}
