import { useEffect, useState } from 'react'
import {
  ChevronDown,
  Check,
  Copy,
  Download,
  Wallet,
  CreditCard,
  CalendarClock,
  MapPin,
} from 'lucide-react'
import {
  CLAIM_TRANSIT_SUB_STATUSES,
  canCancelClaim,
  claimStatusesFor,
  claimToneFor,
  claimPhaseTag,
  claimStatusHeadline,
  claimStatusSubline,
  claimTypeLabel,
  refundMethodLabel,
  transitSubProgressIndex,
} from '../lib/claims'
import { getHistoryEvents } from '../lib/events'
import ClaimDetailsSheet from './ClaimDetailsSheet'
import ClaimActionBanner from './ClaimActionBanner'
import HistoryThread from './HistoryThread'
import BnplDisclaimerTooltip, { isBnpl } from './BnplDisclaimerTooltip'
import { ProductSummary } from './ProductSummary'
import ClaimProgressDots from './ClaimProgressDots'

// Card chrome is the refund-hero family (see PastOrderCard cancelled
// branch): left accent strip, eyebrow, state pill, tinted hero, compact
// product row, expand-on-tap. Tone shifts amber → brand → success across
// the seven claim states (see lib/claims.js `claimToneFor`).
const TONE = {
  warn:    { text: 'text-warn',    bg: 'bg-warn',    softBg: 'bg-warn-bg',    softText: 'text-warn',    border: 'border-[#ffe3b8]', heroBg: 'bg-warn-bg' },
  brand:   { text: 'text-brand',   bg: 'bg-brand',   softBg: 'bg-brand-bg',   softText: 'text-brand',   border: 'border-brand-bg2',  heroBg: 'bg-gradient-to-br from-brand-bg to-brand-bg2' },
  success: { text: 'text-success', bg: 'bg-success', softBg: 'bg-success-bg', softText: 'text-success', border: 'border-[#c6ebd9]',  heroBg: 'bg-gradient-to-br from-success-bg to-[#d4f0e3]' },
}

export default function ClaimCard({
  order,
  defaultExpanded = false,
  openSignal = 0,
  onRequestCancelClaim,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [detailsOpen, setDetailsOpen] = useState(false)
  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])
  // Expand signal driven by Step 7's "Track this return" (bumps
  // openSignal to a positive value). App.jsx resets openSignal back to 0
  // when the flow closes via "Back to my account" / X / Escape, which
  // drops the card back to collapsed here.
  useEffect(() => {
    setExpanded(openSignal > 0)
  }, [openSignal])

  const claim = order.claim
  const tone = claimToneFor(claim.claimStatusId)
  const t = TONE[tone]
  const steps = claimStatusesFor(claim)

  return (
    <article className="bg-surface rounded-card border border-line overflow-hidden relative">
      <span aria-hidden className={`absolute left-0 top-0 bottom-0 w-1 ${t.bg}`} />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full text-left pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-2">
          <OrderEyebrow id={order.id} />
          <span
            aria-hidden
            className="w-6 h-6 rounded-full bg-line-2 text-ink-2 grid place-items-center shrink-0 transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            <ChevronDown size={12} strokeWidth={1.75} />
          </span>
        </div>
        <StatePill claim={claim} tone={tone} />
        <ClaimHero order={order} claim={claim} tone={tone} />
        <ProductSummary order={order} />
      </button>

      {expanded && (
        <div className="pl-4 pr-3.5 pb-4 pt-0 flex flex-col gap-3.5 animate-slideDown">
          {claim.actionRequired && (
            <ClaimActionBanner actionRequired={claim.actionRequired} />
          )}

          <div className="px-1">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted mb-2.5">
              Claim progress
            </div>
            <ClaimProgressDots
              steps={steps}
              curIdx={steps.findIndex((s) => s.id === claim.claimStatusId)}
              stamps={claim.timeline}
              tone={tone}
            />
          </div>

          {Boolean(claim.transitSubTimeline?.picked_up) && (
            <ClaimTransitDetail claim={claim} order={order} />
          )}

          {(() => {
            const history = getHistoryEvents(order, 'claim')
            return history.length > 0 ? <HistoryThread events={history} /> : null
          })()}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDetailsOpen(true)}
              className="flex-1 h-[42px] rounded-[10px] bg-surface border border-line text-ink font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5 hover:bg-line-2"
            >
              View claim details
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

      {canCancelClaim(claim) && onRequestCancelClaim && (
        <div className="border-t border-line px-4 py-2">
          <button
            type="button"
            onClick={() => onRequestCancelClaim(order.id)}
            className="w-full h-[38px] rounded-[10px] text-danger font-semibold text-[12.5px] hover:bg-danger-bg/60 transition"
          >
            Cancel claim
          </button>
        </div>
      )}

      <ClaimDetailsSheet
        order={order}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
      />
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

function StatePill({ claim, tone }) {
  const t = TONE[tone]
  const headline = claimStatusHeadline(claim)
  return (
    <span
      className={`self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px] ${t.softBg} ${t.softText}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${t.bg}`} />
      {headline}
    </span>
  )
}

function ClaimHero({ order, claim, tone }) {
  const t = TONE[tone]
  const phase = claimPhaseTag(claim.claimStatusId)
  const isRefunded = claim.claimStatusId === 'refund_credited'
  const isWallet = claim.refundMethod === 'wallet'
  const headline = claimStatusHeadline(claim)
  const subline = claimStatusSubline(claim)
  const showScheduledPickup =
    claim.claimStatusId === 'initiated' && Boolean(claim.scheduledPickup)

  return (
    <div className={`rounded-[14px] border p-3.5 ${t.heroBg} ${t.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
          Claim · {claimTypeLabel(claim)}
        </div>
        <span
          className={`text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 ${t.text}`}
        >
          <phase.Icon size={11} strokeWidth={2} />
          {phase.label}
        </span>
      </div>

      <div
        className={`mt-1 text-[22px] font-bold leading-[1.1] tracking-[-0.01em] ${t.text}`}
      >
        {headline}
      </div>

      <div className="mt-1 flex items-center gap-1.5 text-[11.5px] text-ink-2 tabular-nums">
        <span className="font-semibold tracking-[0.02em]">{claim.claimRef}</span>
        {subline && (
          <>
            <span className="text-muted/60">·</span>
            <span>{subline}</span>
          </>
        )}
      </div>

      {showScheduledPickup && (
        <ScheduledPickupStrip
          scheduledPickup={claim.scheduledPickup}
          pickupDetails={claim.pickupDetails}
          toneText={t.text}
        />
      )}

      <div className="mt-3 pt-3 border-t border-line-2/70 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
            {isRefunded ? 'Refunded' : 'Expected refund'}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-2">
            <span>{isRefunded ? 'Sent to' : 'Going to'}</span>
            <DestinationChip claim={claim} order={order} accent={isWallet} />
          </div>
        </div>
        {claim.expectedRefund ? (
          <div
            className={`text-[22px] font-bold tabular-nums leading-none shrink-0 ${t.text}`}
          >
            {order.currency} {claim.expectedRefund.net.toLocaleString()}
          </div>
        ) : (
          <div
            className={`text-[13px] font-bold leading-[1.2] text-right shrink-0 ${t.text}`}
          >
            To be confirmed
          </div>
        )}
      </div>
    </div>
  )
}

function ScheduledPickupStrip({ scheduledPickup, pickupDetails, toneText }) {
  const { date, slot } = scheduledPickup || {}
  const address = pickupDetails?.address
  return (
    <div className="mt-3 pt-3 border-t border-line-2/70 flex flex-col gap-1.5">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
        Scheduled pickup
      </div>
      <div className="flex items-start gap-1.5 text-[12px] text-ink-2">
        <CalendarClock
          size={13}
          strokeWidth={2}
          className={`${toneText} shrink-0 mt-px`}
        />
        <span className="font-semibold leading-[1.3]">
          {date}
          {slot && (
            <>
              <span className="text-muted/60 font-normal"> · </span>
              {slot}
            </>
          )}
        </span>
      </div>
      {address && (
        <div className="flex items-start gap-1.5 text-[11.5px] text-ink-2/90">
          <MapPin
            size={12}
            strokeWidth={2}
            className="text-ink-2/70 shrink-0 mt-px"
          />
          <span className="truncate">{address}</span>
        </div>
      )}
    </div>
  )
}

function DestinationChip({ claim, order, accent }) {
  const isWallet = claim.refundMethod === 'wallet'
  const Icon = isWallet ? Wallet : CreditCard
  const label = refundMethodLabel(claim, order)
  const showBnplTooltip =
    claim.refundMethod === 'original' && isBnpl(order)
  const tones = accent
    ? 'bg-gradient-to-r from-brand to-accent text-white border-transparent'
    : 'bg-surface text-ink border-line'
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap h-7 px-2.5 text-[11.5px] gap-1.5 ${tones}`}
    >
      <Icon size={12} strokeWidth={2} />
      {label}
      {showBnplTooltip && (
        <BnplDisclaimerTooltip
          provider={order.paymentMethod.provider}
          align="center"
          iconClassName={
            accent ? 'text-white/85 hover:text-white' : 'text-muted hover:text-ink'
          }
          stopPropagation
        />
      )}
    </span>
  )
}
function ClaimTransitDetail({ claim, order }) {
  const [show, setShow] = useState(false)
  const cur = transitSubProgressIndex(claim.transitSubStatusId)

  return (
    <div className="px-1">
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-expanded={show}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] border border-line bg-surface text-[12.5px] font-semibold text-ink hover:bg-line-2"
      >
        <span>{show ? 'Hide detailed tracking' : 'See detailed tracking'}</span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className={`text-ink-2 transition-transform ${show ? 'rotate-180' : ''}`}
        />
      </button>
      {show && (
        <div className="mt-2.5 pt-3.5 px-3.5 pb-1 rounded-[12px] border border-line bg-canvas animate-slideDown">
          {(order.courier || order.trackingNumber) && (
            <TransitCourierStrip order={order} />
          )}
          {CLAIM_TRANSIT_SUB_STATUSES.map((s, i) => (
            <TransitSubItem
              key={s.id}
              label={s.label}
              timestamp={claim.transitSubTimeline?.[s.id]}
              state={
                i < cur ? 'done' : i === cur ? 'current' : 'future'
              }
              isLast={i === CLAIM_TRANSIT_SUB_STATUSES.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TransitCourierStrip({ order }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 mb-3 rounded-[10px] border border-line bg-surface">
      <span className="w-9 h-7 rounded-md grid place-items-center text-[11px] font-extrabold tracking-[0.04em] bg-[#ffcc00] text-[#1a1a1a] shrink-0">
        DHL
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ink truncate">
          {order.courier || 'Courier'}
        </div>
        {order.trackingNumber && (
          <div className="text-[11.5px] text-muted mt-px tabular-nums truncate">
            Tracking #{order.trackingNumber}
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="Copy tracking number"
        onClick={() =>
          order.trackingNumber &&
          navigator.clipboard?.writeText(order.trackingNumber)
        }
        className="w-8 h-8 rounded-lg grid place-items-center border border-line text-ink-2 hover:bg-line-2 shrink-0"
      >
        <Copy size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}

function TransitSubItem({ label, timestamp, state, isLast }) {
  const done = state === 'done'
  const current = state === 'current'
  return (
    <div className="flex gap-3 items-start">
      <div className="w-[18px] flex flex-col items-center self-stretch">
        <span
          className={`w-[14px] h-[14px] rounded-full border-2 grid place-items-center shrink-0 ${
            done || current
              ? 'bg-brand border-brand text-white'
              : 'bg-surface border-line text-muted'
          } ${current ? 'shadow-[0_0_0_4px_rgb(243,237,251)]' : ''}`}
        >
          {done && <Check size={9} strokeWidth={3} />}
        </span>
        {!isLast && (
          <span
            className={`flex-1 w-[2px] mt-0.5 ${done ? 'bg-brand' : 'bg-line'}`}
          />
        )}
      </div>
      <div className={`flex-1 ${isLast ? 'pb-1' : 'pb-3'}`}>
        <div
          className={`text-[13px] ${
            current
              ? 'text-ink font-bold'
              : done
                ? 'text-ink'
                : 'text-muted'
          }`}
        >
          {label}
        </div>
        {timestamp && (
          <div className="text-[11px] text-muted mt-px tabular-nums">{timestamp}</div>
        )}
      </div>
    </div>
  )
}



