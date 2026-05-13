import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Check,
  Edit2,
  Phone,
  X,
  Settings2,
  ShieldCheck,
  Package,
  Zap,
  Home,
  Clock,
} from 'lucide-react'
import { STATUSES, statusDescription } from '../lib/statuses'
import CancelOrderSheet from './CancelOrderSheet'

const REVIBE_CARE_ICON =
  'https://cdn.shopify.com/s/files/1/0695/1737/7855/files/Revibe_logo_RE_CARE_Color_copy.png?v=1719938652'

const STATE_LABELS = {
  created: 'Order placed',
  quality_check: 'Quality check',
}

const STATE_ICONS = {
  created: Package,
  quality_check: ShieldCheck,
}

export default function InProgressCard({ order, defaultExpanded = false }) {
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
        <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
          Order · #{order.id}
        </div>
        <StatePill order={order} />

        <ETAHero order={order} desc={desc} />

        <ProductRow order={order} expanded={expanded} />
      </button>

      {expanded && (
        <div className="pl-4 pr-3.5 pb-4 pt-0 flex flex-col gap-3.5 animate-slideDown">
          <div className="px-1">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted mb-2.5">
              Timeline
            </div>
            <TimelineDots order={order} />
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
        <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-brand text-right">
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
      <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-ink-2">
        <span>Delivering to</span>
        <span className="inline-flex items-center rounded-full border bg-surface text-ink border-line font-semibold whitespace-nowrap h-7 px-2.5 text-[11.5px] gap-1.5">
          <Home size={12} strokeWidth={2} />
          Home
        </span>
      </div>
    </div>
  )
}

function ProductRow({ order, expanded }) {
  return (
    <div className="flex items-center gap-2.5 -mx-1 px-1">
      <div className="w-8 h-10 rounded-[8px] bg-brand-bg border border-line-2 grid place-items-center p-1 shrink-0">
        <img
          src={order.product.image}
          alt=""
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ink truncate">
          {order.product.name}
        </div>
        <div className="text-[11px] text-muted truncate">
          {order.product.variant}
        </div>
        {order.warranty != null && (
          <div className="flex items-center gap-1 mt-0.5 text-[10.5px] text-muted">
            <img
              src={REVIBE_CARE_ICON}
              alt=""
              className="w-2.5 h-2.5 object-contain shrink-0"
            />
            <span className="truncate">
              Revibe Care +{order.currency}{' '}
              {order.warranty.toLocaleString()}
            </span>
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="text-[13px] font-semibold text-ink tabular-nums whitespace-nowrap">
          {order.currency} {order.total.toLocaleString()}
        </div>
      </div>
      <span
        aria-hidden
        className="w-6 h-6 rounded-full bg-line-2 text-ink-2 grid place-items-center shrink-0 ml-1 transition-transform duration-200"
        style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
      >
        <ChevronDown size={12} strokeWidth={1.75} />
      </span>
    </div>
  )
}

function TimelineDots({ order }) {
  const curIdx = STATUSES.findIndex((s) => s.id === order.statusId)
  return (
    <div className="flex items-start justify-between gap-1">
      {STATUSES.map((s, i) => {
        const done = i < curIdx
        const current = i === curIdx
        const reached = done || current
        const ts = order.timeline?.[s.id]
        let date = ''
        let time = ''
        if (ts) {
          const parts = String(ts).split(' · ')
          date = parts[0] || ''
          time = parts[1] || ''
        }
        return (
          <div
            key={s.id}
            className="flex-1 flex flex-col items-center relative"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute top-[9px] right-1/2 w-full h-[2px] ${
                  reached ? 'bg-brand' : 'bg-line'
                }`}
              />
            )}
            <span
              className={`relative z-10 grid place-items-center w-[18px] h-[18px] rounded-full border-2 ${
                reached
                  ? 'bg-brand border-brand text-white'
                  : 'bg-surface border-line text-muted'
              } ${current ? 'shadow-[0_0_0_4px_rgb(243,237,251)]' : ''}`}
            >
              {done && <Check size={10} strokeWidth={3} />}
            </span>
            <span
              className={`mt-1.5 text-[10.5px] text-center leading-[1.2] ${
                current
                  ? 'text-ink font-bold'
                  : reached
                    ? 'text-ink font-medium'
                    : 'text-muted font-medium'
              }`}
            >
              {s.short}
            </span>
            <span
              className={`mt-1 text-[9.5px] text-center leading-[1.25] tabular-nums min-h-[22px] ${
                reached ? 'text-ink-2' : 'text-muted/50'
              }`}
            >
              {date && (
                <>
                  {date}
                  {time && (
                    <>
                      <br />
                      {time}
                    </>
                  )}
                </>
              )}
            </span>
          </div>
        )
      })}
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
