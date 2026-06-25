import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Edit2,
  Phone,
  X,
  Settings2,
  ShieldCheck,
  Package,
  Zap,
  Clock,
} from 'lucide-react'
import { STATUSES, progressIndex, statusDescription, statusExplanation } from '../lib/statuses'
import CancelOrderSheet from './CancelOrderSheet'
import { ProductSummary } from './ProductSummary'
import DeliveryAddressPill from './DeliveryAddressPill'
import StatusExplainer from './StatusExplainer'
import Timeline from './Timeline'

const STATE_LABELS = {
  created: 'Order placed',
  quality_check: 'Quality check',
}

const STATE_ICONS = {
  created: Package,
  quality_check: ShieldCheck,
}

export default function InProgressCard({ order, defaultExpanded = false, onCancelOrder }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [cancelOpen, setCancelOpen] = useState(false)
  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])
  const detailsRef = useRef(null)
  const openDetails = () => {
    if (detailsRef.current) detailsRef.current.open = true
  }

  const desc = statusDescription(order)

  return (
    <article className="bg-surface rounded-card border border-line overflow-hidden relative">
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1 bg-brand"
      />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full text-left pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            Order · #{order.id}
          </div>
          <span
            aria-hidden
            className="w-6 h-6 rounded-full bg-line-2 text-ink-2 grid place-items-center shrink-0 transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            <ChevronDown size={12} strokeWidth={1.75} />
          </span>
        </div>
        <StatusExplainer
          pill={<StatePill order={order} />}
          explanation={statusExplanation(order)}
        />

        <ETAHero order={order} desc={desc} />

        <ProductSummary order={order} />
      </button>

      {expanded && (
        <div className="pl-4 pr-3.5 pb-4 pt-0 flex flex-col gap-3.5 animate-slideDown">
          <div className="px-1">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted mb-2.5">
              Timeline
            </div>
            <Timeline
              orientation="horizontal"
              tone="brand"
              steps={STATUSES}
              currentIndex={progressIndex(order.statusId)}
              stamps={order.timeline || {}}
            />
          </div>

          <DetailsCollapse order={order} detailsRef={detailsRef} />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="flex-1 h-[42px] rounded-[10px] bg-surface border border-[#f4c5cc] text-danger hover:bg-danger-bg font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5"
            >
              <X size={15} strokeWidth={1.75} />
              Cancel order
            </button>
            <button
              type="button"
              onClick={openDetails}
              className="flex-1 h-[42px] rounded-[10px] bg-surface border border-brand text-brand font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5"
            >
              <Settings2 size={15} strokeWidth={1.75} />
              Change details
            </button>
          </div>
        </div>
      )}

      <CancelOrderSheet
        order={order}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSubmit={onCancelOrder}
      />
    </article>
  )
}

function StatePill({ order }) {
  const Icon = STATE_ICONS[order.statusId] || Package
  return (
    <span className="self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] bg-brand-bg text-brand h-6 px-2.5 text-[10.5px]">
      <Icon size={11} strokeWidth={2} />
      {STATE_LABELS[order.statusId] || 'In progress'}
    </span>
  )
}

function ETAHero({ order, desc }) {
  const TagIcon = order.delayed ? Clock : Zap

  return (
    <div className="rounded-[14px] border p-3.5 bg-gradient-to-br from-brand-bg to-brand-bg2 border-brand-bg2">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
          Delivery by
        </div>
        <span
          className={`text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-right ${
            order.delayed ? 'text-amber-600' : 'text-brand'
          }`}
        >
          <TagIcon size={11} strokeWidth={2} />
          {desc.lead}
        </span>
      </div>
      <div className="mt-1 text-[26px] font-bold leading-[1.05] tracking-[-0.01em] text-brand">
        {order.estimatedDeliveryLong || order.estimatedDelivery}
      </div>
      {desc.body && (
        <div className="mt-1.5 text-[12px] leading-[1.45] text-ink-2">
          {desc.body}
        </div>
      )}
      <DeliveryAddressPill label="Delivering to" address={order.address} />
    </div>
  )
}

function DetailsCollapse({ order, detailsRef }) {
  return (
    <details
      ref={detailsRef}
      className="group rounded-[12px] border border-line bg-surface overflow-hidden"
    >
      <summary className="flex items-center justify-between px-3.5 py-3 text-[13px] font-semibold text-ink cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span>Order details</span>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className="text-muted transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="px-3.5 pb-3 pt-3 flex flex-col gap-3.5 border-t border-line-2 animate-slideDown">
        <DetailStack
          k="Delivery address"
          v={order.address}
          action={{ icon: Edit2, label: 'Change address' }}
        />
        <DetailStack
          k="Phone number"
          v={order.phone}
          action={{ icon: Phone, label: 'Change phone number' }}
        />
        <DetailRow k="Order date" v={order.placedAtFull || order.placedAt} />
      </div>
    </details>
  )
}

function DetailStack({ k, v, action }) {
  return (
    <div className="flex flex-col gap-2 items-end">
      <DetailRow k={k} v={v} />
      {action && (
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-line bg-surface text-[11.5px] font-medium text-ink hover:bg-line-2">
          <action.icon size={12} strokeWidth={1.75} className="opacity-70" />
          {action.label}
        </button>
      )}
    </div>
  )
}

function DetailRow({ k, v }) {
  return (
    <div className="flex justify-between gap-3 w-full">
      <div className="text-[12px] text-muted">{k}</div>
      <div className="text-[12.5px] text-ink text-right max-w-[60%] leading-[1.4]">
        {v}
      </div>
    </div>
  )
}
