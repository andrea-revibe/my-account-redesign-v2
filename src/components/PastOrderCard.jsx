import { Download, AlertTriangle } from 'lucide-react'

// Compact card for delivered / cancelled orders. Trades the full progress
// stack for a one-row product summary plus a single contextual action.
export default function PastOrderCard({ order }) {
  const isCancelled = order.state === 'cancelled'
  const placedShort = (order.placedAtFull || order.placedAt || '').split(' · ')[0]

  return (
    <article className="bg-surface rounded-card border border-line px-3.5 py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-[46px] rounded-[10px] bg-brand-bg border border-line-2 grid place-items-center p-1 shrink-0">
          <img
            src={order.product.image}
            alt={order.product.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-semibold text-ink truncate">
            {order.product.name}
          </div>
          <div className="mt-0.5 text-[11.5px] text-muted truncate">
            <span
              className={
                'inline-flex items-center gap-1 mr-1.5 px-1.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-[0.04em] ' +
                (isCancelled
                  ? 'bg-danger-bg text-danger'
                  : 'bg-success-bg text-success')
              }
            >
              {isCancelled ? 'Cancelled' : 'Delivered'}
            </span>
            {placedShort} · #{order.id}
          </div>
        </div>
        <div className="text-[13.5px] font-semibold text-ink whitespace-nowrap">
          {order.currency} {order.total.toLocaleString()}
        </div>
      </div>
      {!isCancelled && (
        <div className="flex justify-end gap-2 mt-2.5 pt-2.5 border-t border-line-2">
          <PastButton icon={Download} label="Download receipt" />
          <PastButton icon={AlertTriangle} label="Raise a claim" />
        </div>
      )}
    </article>
  )
}

function PastButton({ icon: Icon, label }) {
  return (
    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-surface text-[12px] font-medium text-ink hover:bg-line-2">
      <Icon size={13} strokeWidth={1.75} className="opacity-75" />
      {label}
    </button>
  )
}
