import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Check,
  Download,
  AlertTriangle,
  Wallet,
  CreditCard,
  Hourglass,
  Receipt,
  Sparkles,
  PackageCheck,
  RotateCcw,
  ExternalLink,
} from 'lucide-react'
import { cancellationStepsFor, statusExplanation } from '../lib/statuses'
import Timeline from './Timeline'
import StatusExplainer from './StatusExplainer'
import { getHistoryEvents } from '../lib/events'
import RefundDetailsSheet from './RefundDetailsSheet'
import RefundSplitRows from './RefundSplitRows'
import { isSplitPaid } from '../lib/returns'
import KeepOrderSheet from './KeepOrderSheet'
import HistoryThread from './HistoryThread'
import BnplDisclaimerTooltip from './BnplDisclaimerTooltip'
import { ProductSummary } from './ProductSummary'
import DeliveryAddressPill from './DeliveryAddressPill'
import OrderClaimLink from './OrderClaimLink'

// Compact card for past orders. Delivered keeps its one-row treatment +
// Download receipt / Raise a claim footer. Cancelled past orders
// (requested / refund_pending / refunded) render the refund-hero card,
// which leads with the refund amount and destination rather than the
// fulfilment journey.
export default function PastOrderCard({ order, onRaiseClaim, onKeep, onOpenWallet }) {
  if (order.state === 'cancelled')
    return <CancelledOrderCard order={order} onKeep={onKeep} onOpenWallet={onOpenWallet} />
  return <DeliveredOrderCard order={order} onRaiseClaim={onRaiseClaim} />
}

function DeliveredOrderCard({ order, onRaiseClaim }) {
  const history = getHistoryEvents(order, 'delivered')
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
        <ProductSummary
          order={order}
          afterRow={
            order.conditionReport?.url ? (
              <ConditionReportChip report={order.conditionReport} />
            ) : null
          }
        />
        {history.length > 0 && <HistoryThread events={history} />}
        <div className="flex flex-col gap-2 pt-2.5 border-t border-line-2 -mx-1 px-1">
          <PastButton
            icon={AlertTriangle}
            label="I need help with this device"
            tone="brand"
            full
            onClick={() => onRaiseClaim?.(order.id)}
          />
          <div className="flex justify-end">
            <PastButton icon={Download} label="Download receipt" tone="quiet" />
          </div>
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
      <DeliveryAddressPill label="Delivered to" address={order.address} />
    </div>
  )
}

// Third-party (NSYS) device condition report. Deliberately a quiet, borderless
// inline link so it stays subordinate to the Revibe Care block and the primary
// "I need help" CTA. Links out to the NSYS-hosted report (decorative
// placeholder here, like the DHL tracking link). Kept local — the card owns
// this affordance, not the shared ProductSummary row.
function ConditionReportChip({ report }) {
  return (
    <a
      href={report.url}
      target="_blank"
      rel="noreferrer"
      aria-label="View the NSYS device condition report (opens in a new tab)"
      className="group inline-flex items-center gap-2 text-[12px] font-medium text-muted hover:text-ink transition-colors"
    >
      <img src="/nsys-icon.svg" alt="" className="w-7 h-7 shrink-0" />
      <span>Verified by NSYS</span>
      <ExternalLink
        size={13}
        strokeWidth={1.75}
        className="opacity-50 group-hover:opacity-100 transition-opacity"
      />
    </a>
  )
}

function PastButton({ icon: Icon, label, onClick, tone = 'muted', full }) {
  const styles = {
    brand:
      'px-3 py-2 rounded-full border border-brand/30 bg-brand/5 text-brand hover:bg-brand/10',
    muted:
      'px-3 py-1.5 rounded-full border border-line bg-surface text-ink hover:bg-line-2',
    quiet: 'px-2 py-1 rounded-md text-muted hover:text-ink hover:bg-line-2',
  }[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1.5 text-[12px] font-medium ${styles}${full ? ' w-full' : ''}`}
    >
      <Icon size={13} strokeWidth={1.75} className={tone === 'brand' ? '' : 'opacity-75'} />
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

function CancelledOrderCard({ order, onKeep, onOpenWallet }) {
  const [expanded, setExpanded] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [keepOpen, setKeepOpen] = useState(false)
  const tone = toneFor(order.cancellationStatusId)
  // Reversible only while the cancellation is still 'requested' — once the
  // refund is accepted (refund_pending) it's committed and can't be undone.
  const canKeep = order.cancellationStatusId === 'requested'

  return (
    <OrderClaimLink order={order} onReveal={() => setExpanded(true)}>
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
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            {order.cancellationRef ? `#${order.cancellationRef}` : 'Cancellation'}
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
          pill={<StatePill cancellationStatusId={order.cancellationStatusId} />}
          explanation={statusExplanation(order)}
        />
        <RefundHero order={order} onOpenWallet={onOpenWallet} />
        <ProductSummary order={order} />
      </button>

      {expanded && (
        <div className="pl-4 pr-3.5 pb-4 pt-0 flex flex-col gap-3.5 animate-slideDown">
          <div className="px-1">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted mb-2">
              Cancellation progress
            </div>
            <Timeline
              orientation="horizontal"
              tone={toneFor(order.cancellationStatusId)}
              steps={cancellationStepsFor(order)}
              currentIndex={cancellationStepsFor(order).findIndex(
                (s) => s.id === order.cancellationStatusId,
              )}
              complete={order.cancellationStatusId === 'refunded'}
              stamps={order.cancellationTimeline || {}}
            />
          </div>

          {(() => {
            const history = getHistoryEvents(order, 'cancellation')
            return history.length > 0 ? (
              <HistoryThread events={history} />
            ) : null
          })()}

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

          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="h-[42px] rounded-[10px] bg-surface border border-line text-ink font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5 hover:bg-line-2"
          >
            View refund details
          </button>
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
          onKeep={onKeep}
          onClose={() => setKeepOpen(false)}
        />
      )}
    </article>
    </OrderClaimLink>
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

function RefundHero({ order, onOpenWallet }) {
  const tone = toneFor(order.cancellationStatusId)
  const t = TONE[tone]
  const isRefunded = order.cancellationStatusId === 'refunded'
  const dest = order.refund.destination
  const isWallet = dest.kind === 'wallet'
  const showSplit = isSplitPaid(order) && !isWallet

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
          Cancellation
        </div>
        <span
          className={`text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 ${t.text}`}
        >
          <PhaseIcon size={11} strokeWidth={2} />
          {phaseTag}
        </span>
      </div>
      <div className="mt-2 text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
        {isRefunded ? 'Refunded' : 'Refund of'}
      </div>
      <div className={`mt-1 text-[28px] font-bold tabular-nums leading-none ${t.text}`}>
        {order.currency} {order.refund.amount.toLocaleString()}
      </div>
      {showSplit ? (
        <RefundSplitRows
          order={order}
          net={order.refund.amount}
          caption={isRefunded ? 'Sent to' : 'Going to'}
          className="mt-2.5"
        />
      ) : (
        <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-ink-2">
          <span>{isRefunded ? 'Sent to' : 'Going to'}</span>
          <DestinationChip destination={dest} accent={isWallet} onOpenWallet={onOpenWallet} />
        </div>
      )}
      {order.refund.bonus > 0 && (
        <div className="mt-2 text-[11.5px] text-accent inline-flex items-center gap-1">
          <Sparkles size={11} strokeWidth={2} />
          Includes {order.currency} {order.refund.bonus.toLocaleString()} Wallet
          bonus
        </div>
      )}
      {isRefunded && order.refund.fundsAvailable && (
        <div className="mt-2 text-[11.5px] text-success inline-flex items-center gap-1">
          <Sparkles size={11} strokeWidth={2} />
          {order.refund.fundsAvailable}
        </div>
      )}
    </div>
  )
}

export function DestinationChip({ destination, accent, onOpenWallet }) {
  const isWallet = destination.kind === 'wallet'
  const isBnpl = destination.kind === 'bnpl'
  const Icon = isWallet ? Wallet : CreditCard
  const label = isWallet
    ? 'Revibe Wallet'
    : isBnpl
      ? destination.label
      : `${destination.label} •• ${destination.last4}`
  const tones = accent
    ? 'bg-gradient-to-r from-brand to-accent text-white border-transparent'
    : 'bg-surface text-ink border-line'
  const base = `inline-flex items-center rounded-full border font-semibold whitespace-nowrap h-7 px-2.5 text-[11.5px] gap-1.5 ${tones}`
  // Wallet destination → tap to open the Revibe Wallet ledger. stopPropagation
  // so it doesn't toggle the enclosing card-header button.
  if (isWallet && onOpenWallet) {
    return (
      <button
        type="button"
        aria-label="Open Revibe Wallet"
        onClick={(e) => {
          e.stopPropagation()
          onOpenWallet()
        }}
        className={`${base} hover:brightness-110 active:scale-[0.98] transition`}
      >
        <Icon size={12} strokeWidth={2} />
        {label}
        <ChevronRight size={13} strokeWidth={2.25} className="-mr-0.5 opacity-85" />
      </button>
    )
  }
  return (
    <span className={base}>
      <Icon size={12} strokeWidth={2} />
      {label}
      {isBnpl && (
        <BnplDisclaimerTooltip
          provider={destination.provider}
          align="center"
          iconClassName={
            accent
              ? 'text-white/85 hover:text-white'
              : 'text-muted hover:text-ink'
          }
          stopPropagation
        />
      )}
    </span>
  )
}

