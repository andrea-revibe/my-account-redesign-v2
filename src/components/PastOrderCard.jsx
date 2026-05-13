import { useState } from 'react'
import {
  ChevronDown,
  Check,
  Download,
  AlertTriangle,
  Wallet,
  CreditCard,
  Hourglass,
  Receipt,
  Sparkles,
  Home,
  PackageCheck,
  RotateCcw,
} from 'lucide-react'
import { CANCELLATION_STATUSES, STATUSES } from '../lib/statuses'
import RefundDetailsSheet from './RefundDetailsSheet'
import KeepOrderSheet from './KeepOrderSheet'

const REVIBE_CARE_ICON =
  'https://cdn.shopify.com/s/files/1/0695/1737/7855/files/Revibe_logo_RE_CARE_Color_copy.png?v=1719938652'

// Compact card for past orders. Delivered keeps its one-row treatment +
// Download receipt / Raise a claim footer. Cancelled past orders
// (requested / refund_pending / refunded) render the refund-hero card,
// which leads with the refund amount and destination rather than the
// fulfilment journey.
export default function PastOrderCard({ order, onRaiseClaim }) {
  if (order.state === 'cancelled') return <CancelledOrderCard order={order} />
  return <DeliveredOrderCard order={order} onRaiseClaim={onRaiseClaim} />
}

function DeliveredOrderCard({ order, onRaiseClaim }) {
  return (
    <article className="bg-surface rounded-card border border-line overflow-hidden relative">
      <span
        aria-hidden
        className="absolute left-0 top-0 bottom-0 w-1 bg-success"
      />
      <div className="pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3">
        <OrderEyebrow id={order.id} />
        <DeliveredStatePill />
        <DeliveredHero order={order} />
        <DeliveredProductRow order={order} />
        <div className="flex justify-end gap-2 pt-2.5 border-t border-line-2 -mx-1 px-1">
          <PastButton icon={Download} label="Download receipt" />
          <PastButton
            icon={AlertTriangle}
            label="Raise a claim"
            onClick={() => onRaiseClaim?.(order.id)}
          />
        </div>
      </div>
    </article>
  )
}

function DeliveredStatePill() {
  return (
    <span className="self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px] bg-success-bg text-success">
      <PackageCheck size={11} strokeWidth={2} />
      Delivered
    </span>
  )
}

function DeliveredHero({ order }) {
  const headline =
    order.deliveredOnLong ||
    (order.timeline?.delivered ? order.timeline.delivered.split(' · ')[0] : '')
  return (
    <div className="rounded-[14px] border p-3.5 bg-gradient-to-br from-success-bg to-[#d4f0e3] border-[#c6ebd9]">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
          Delivered on
        </div>
        <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-success">
          <Check size={11} strokeWidth={2.5} />
          Complete
        </span>
      </div>
      <div className="mt-1 text-[26px] font-bold leading-[1.05] tracking-[-0.01em] text-success">
        {headline}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-ink-2">
        <span>Delivered to</span>
        <span className="inline-flex items-center rounded-full border bg-surface text-ink border-line font-semibold whitespace-nowrap h-7 px-2.5 text-[11.5px] gap-1.5">
          <Home size={12} strokeWidth={2} />
          Home
        </span>
      </div>
    </div>
  )
}

function DeliveredProductRow({ order }) {
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
    </div>
  )
}

function PastButton({ icon: Icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-line bg-surface text-[12px] font-medium text-ink hover:bg-line-2"
    >
      <Icon size={13} strokeWidth={1.75} className="opacity-75" />
      {label}
    </button>
  )
}

// Tone per cancellation phase. Deliberate departure from the in-flight
// CancellationSubTimeline (which is all red): on past orders, a finished
// refund should feel completed, not alarming.
//   requested        → warn  (amber)  — provisional, awaiting supplier
//   refund_pending   → brand (purple) — actively processing
//   refunded         → success (green) — completed positive outcome
function toneFor(id) {
  if (id === 'refunded') return 'success'
  if (id === 'refund_pending') return 'brand'
  return 'warn'
}

const TONE = {
  warn:    { text: 'text-warn',    bg: 'bg-warn',    softBg: 'bg-warn-bg',    softText: 'text-warn',    border: 'border-[#ffe3b8]' },
  brand:   { text: 'text-brand',   bg: 'bg-brand',   softBg: 'bg-brand-bg',   softText: 'text-brand',   border: 'border-brand-bg2' },
  success: { text: 'text-success', bg: 'bg-success', softBg: 'bg-success-bg', softText: 'text-success', border: 'border-[#c6ebd9]' },
}

function CancelledOrderCard({ order }) {
  const [expanded, setExpanded] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [keepOpen, setKeepOpen] = useState(false)
  const tone = toneFor(order.cancellationStatusId)
  const canKeep =
    order.cancellationStatusId === 'requested' ||
    order.cancellationStatusId === 'refund_pending'

  return (
    <article className="bg-surface rounded-card border border-line overflow-hidden relative">
      <span
        aria-hidden
        className={`absolute left-0 top-0 bottom-0 w-1 ${TONE[tone].bg}`}
      />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full text-left pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3"
      >
        <OrderEyebrow id={order.id} />
        <StatePill cancellationStatusId={order.cancellationStatusId} />
        <RefundHero order={order} />
        <ProductRow order={order} expanded={expanded} />
      </button>

      {expanded && (
        <div className="pl-4 pr-3.5 pb-4 pt-0 flex flex-col gap-3.5 animate-slideDown">
          <div className="px-1">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted mb-2">
              Refund progress
            </div>
            <RefundProgressDots order={order} />
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-[10.5px] uppercase tracking-[0.06em] font-bold text-muted">
              Order was
            </span>
            <FulfilmentTrace order={order} />
          </div>

          {canKeep && (
            <button
              type="button"
              onClick={() => setKeepOpen(true)}
              className="h-[44px] rounded-[10px] bg-brand text-white border border-brand font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={15} strokeWidth={1.75} />
              I want to keep my order
            </button>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="flex-1 h-[42px] rounded-[10px] bg-surface border border-line text-ink font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5 hover:bg-line-2"
            >
              View refund details
            </button>
            <button
              type="button"
              aria-label="Download receipt"
              title="Download receipt"
              className="w-[42px] h-[42px] rounded-[10px] bg-surface border border-line text-ink-2 inline-flex items-center justify-center hover:bg-line-2"
            >
              <Download size={16} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      )}

      <RefundDetailsSheet
        order={order}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
      {canKeep && (
        <KeepOrderSheet
          order={order}
          open={keepOpen}
          onClose={() => setKeepOpen(false)}
        />
      )}
    </article>
  )
}

function OrderEyebrow({ id }) {
  return (
    <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
      Order · #{id}
    </div>
  )
}

function StatePill({ cancellationStatusId }) {
  const tone = toneFor(cancellationStatusId)
  const t = TONE[tone]
  const label =
    cancellationStatusId === 'requested'
      ? 'Cancellation requested'
      : cancellationStatusId === 'refund_pending'
      ? 'Refund pending'
      : 'Refunded'
  return (
    <span
      className={`self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px] ${t.softBg} ${t.softText}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${t.bg}`} />
      {label}
    </span>
  )
}

function RefundHero({ order }) {
  const tone = toneFor(order.cancellationStatusId)
  const t = TONE[tone]
  const isRefunded = order.cancellationStatusId === 'refunded'
  const dest = order.refund.destination
  const isWallet = dest.kind === 'wallet'

  const heroBg =
    tone === 'success'
      ? 'bg-gradient-to-br from-success-bg to-[#d4f0e3]'
      : tone === 'brand'
      ? 'bg-gradient-to-br from-brand-bg to-brand-bg2'
      : 'bg-warn-bg'

  const phaseTag =
    order.cancellationStatusId === 'requested'
      ? 'Requested'
      : order.cancellationStatusId === 'refund_pending'
      ? 'Processing'
      : 'Complete'
  const PhaseIcon =
    order.cancellationStatusId === 'requested'
      ? Hourglass
      : order.cancellationStatusId === 'refund_pending'
      ? Receipt
      : Check

  return (
    <div className={`rounded-[14px] border p-3.5 ${heroBg} ${t.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
          {isRefunded ? 'Refunded' : 'Refund of'}
        </div>
        <span
          className={`text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 ${t.text}`}
        >
          <PhaseIcon size={11} strokeWidth={2} />
          {phaseTag}
        </span>
      </div>
      <div className={`mt-1 text-[28px] font-bold tabular-nums leading-none ${t.text}`}>
        {order.currency} {order.refund.amount.toLocaleString()}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-ink-2">
        <span>{isRefunded ? 'Sent to' : 'Going to'}</span>
        <DestinationChip destination={dest} accent={isWallet} />
      </div>
      {isRefunded && order.refund.fundsAvailable && (
        <div className="mt-2 text-[11.5px] text-success inline-flex items-center gap-1">
          <Sparkles size={11} strokeWidth={2} />
          {order.refund.fundsAvailable}
        </div>
      )}
    </div>
  )
}

function DestinationChip({ destination, accent }) {
  const isWallet = destination.kind === 'wallet'
  const Icon = isWallet ? Wallet : CreditCard
  const label = isWallet
    ? 'Revibe Wallet'
    : `${destination.label} •• ${destination.last4}`
  const tones = accent
    ? 'bg-gradient-to-r from-brand to-accent text-white border-transparent'
    : 'bg-surface text-ink border-line'
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap h-7 px-2.5 text-[11.5px] gap-1.5 ${tones}`}
    >
      <Icon size={12} strokeWidth={2} />
      {label}
    </span>
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
      </div>
      <span
        aria-hidden
        className="w-6 h-6 rounded-full bg-line-2 text-ink-2 grid place-items-center shrink-0 transition-transform duration-200"
        style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
      >
        <ChevronDown size={12} strokeWidth={1.75} />
      </span>
    </div>
  )
}

// Mirrors the created-path filter in statuses.js — orders cancelled at
// 'created' skip the 'requested' phase because nothing's been pulled yet.
function cancellationStepsFor(order) {
  if (order.statusId === 'created') {
    return CANCELLATION_STATUSES.filter((s) => s.id !== 'requested')
  }
  return CANCELLATION_STATUSES
}

function RefundProgressDots({ order }) {
  const steps = cancellationStepsFor(order)
  const curIdx = steps.findIndex((s) => s.id === order.cancellationStatusId)
  const tone = toneFor(order.cancellationStatusId)
  const t = TONE[tone]

  return (
    <ol className="flex items-start justify-between gap-1">
      {steps.map((s, i) => {
        const reached = i <= curIdx
        const isCurrent = i === curIdx
        const ts = reached ? order.cancellationTimeline?.[s.id] : null
        return (
          <li
            key={s.id}
            className="flex-1 flex flex-col items-center text-center relative"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute top-3 right-1/2 w-full h-0.5 ${
                  reached ? t.bg : 'bg-line/70'
                }`}
              />
            )}
            <span
              className={`relative z-10 grid place-items-center w-6 h-6 rounded-full ${
                reached
                  ? `${t.bg} text-white`
                  : 'bg-white border border-line text-line'
              }`}
            >
              {reached ? (
                <Check size={14} strokeWidth={3} />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-line" />
              )}
            </span>
            <span
              className={`mt-2 text-[11px] leading-tight ${
                isCurrent
                  ? `${t.text} font-bold`
                  : reached
                    ? 'text-ink'
                    : 'text-muted'
              }`}
            >
              {shortLabel(s)}
            </span>
            {ts && (
              <span className="mt-1 text-[10.5px] leading-tight text-muted tabular-nums">
                {ts}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

function shortLabel(step) {
  if (step.id === 'requested') return 'Requested'
  if (step.id === 'refund_pending') return 'Pending'
  return 'Refunded'
}

function FulfilmentTrace({ order }) {
  const reachedIdx = STATUSES.findIndex((s) => s.id === order.statusId)
  return (
    <div className="flex items-center gap-1 opacity-55">
      {STATUSES.map((s, i) => {
        const reached = i <= reachedIdx
        const last = reached && i === reachedIdx
        return (
          <div key={s.id} className="flex items-center gap-1">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                last ? 'bg-danger' : reached ? 'bg-ink-2' : 'bg-line'
              }`}
            />
            <span
              className={`text-[9.5px] uppercase tracking-[0.05em] ${
                last
                  ? 'text-danger font-bold'
                  : reached
                  ? 'text-ink-2'
                  : 'text-muted'
              }`}
            >
              {s.short}
            </span>
            {i < STATUSES.length - 1 && (
              <span className="w-3 h-px bg-line ml-0.5" />
            )}
          </div>
        )
      })}
    </div>
  )
}

