import { useEffect, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
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
  claimExplanation,
  claimTypeLabel,
  formatClaimRef,
  refundMethodLabel,
  transitSubProgressIndex,
} from '../lib/claims'
import { getHistoryEvents } from '../lib/events'
import { formatAddress } from '../lib/address'
import ClaimDetailsSheet from './ClaimDetailsSheet'
import OrderClaimLink from './OrderClaimLink'
import ClaimActionBanner from './ClaimActionBanner'
import HistoryThread from './HistoryThread'
import StatusExplainer from './StatusExplainer'
import BnplDisclaimerTooltip, { isBnpl } from './BnplDisclaimerTooltip'
import { ProductSummary } from './ProductSummary'
import { AwbLink } from './AwbLink'
import RefundSplitRows from './RefundSplitRows'
import { isSplitPaid } from '../lib/returns'
import Timeline from './Timeline'
import { TrackingDropdown } from './ReturnShipmentTracking'
import { countryConfig } from '../lib/countries'

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
  onOpenWallet,
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
    <OrderClaimLink order={order} onReveal={() => setExpanded(true)}>
      <article className="bg-surface rounded-card border border-line overflow-hidden relative">
        <span aria-hidden className={`absolute left-0 top-0 bottom-0 w-1 ${t.bg}`} />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full text-left pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            {formatClaimRef(claim)}
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
          pill={<StatePill claim={claim} tone={tone} />}
          explanation={claim.actionRequired ? null : claimExplanation(claim)}
        />
        <ClaimHero order={order} claim={claim} tone={tone} onOpenWallet={onOpenWallet} />
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
            <Timeline
              orientation="horizontal"
              steps={steps}
              currentIndex={steps.findIndex((s) => s.id === claim.claimStatusId)}
              stamps={claim.timeline}
              tone={tone}
            />
          </div>

          {Boolean(claim.transitSubTimeline?.picked_up) &&
            countryConfig(order).detailedTracking && (
              <TrackingDropdown
                steps={CLAIM_TRANSIT_SUB_STATUSES}
                currentIndex={transitSubProgressIndex(claim.transitSubStatusId)}
                stamps={claim.transitSubTimeline}
              />
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
    </OrderClaimLink>
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

function ClaimHero({ order, claim, tone, onOpenWallet }) {
  const t = TONE[tone]
  const phase = claimPhaseTag(claim.claimStatusId)
  const isRefunded = claim.claimStatusId === 'refund_credited'
  const isWallet = claim.refundMethod === 'wallet'
  const headline = claimStatusHeadline(claim)
  const subline = claimStatusSubline(claim)
  // The pickup strip (courier date/slot + address) only surfaces once the
  // airway bill has been generated — its number rides on scheduledPickup.awb.
  // Before that, the claim sits at `initiated` with no bookable pickup, so we
  // show a calm "arranging your pickup" placeholder instead. (An AWB that
  // *couldn't* be generated routes to AwbFailedCard, never here.)
  const showScheduledPickup =
    claim.claimStatusId === 'initiated' && Boolean(claim.scheduledPickup?.awb)
  const showArrangingPickup =
    claim.claimStatusId === 'initiated' && !claim.scheduledPickup?.awb
  // When the refund is split across the original payment, the split rows below
  // name each destination (with the BNPL note on its own line) — so the single
  // "Going to <chip>" summary is redundant and is replaced by a captioned split.
  const showRefundSplit =
    claim.refundMethod === 'original' &&
    Boolean(claim.expectedRefund) &&
    isSplitPaid(order)

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

      {subline && (
        <div className="mt-1 text-[11.5px] text-ink-2">{subline}</div>
      )}

      {showScheduledPickup && (
        <ScheduledPickupStrip
          scheduledPickup={claim.scheduledPickup}
          pickupDetails={claim.pickupDetails}
          toneText={t.text}
          country={order.country}
        />
      )}

      {showArrangingPickup && <ArrangingPickupStrip toneText={t.text} />}

      <div className="mt-3 pt-3 border-t border-line-2/70 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
            {isRefunded ? 'Refunded' : 'Expected refund'}
          </div>
          {!showRefundSplit && (
            <div className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-2">
              <span>{isRefunded ? 'Sent to' : 'Going to'}</span>
              <DestinationChip claim={claim} order={order} accent={isWallet} onOpenWallet={onOpenWallet} />
            </div>
          )}
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

      {showRefundSplit && (
        <RefundSplitRows
          order={order}
          net={claim.expectedRefund.net}
          caption={isRefunded ? 'Sent to' : 'Going to'}
          className="mt-3 pt-3 border-t border-line-2/70"
        />
      )}
    </div>
  )
}

function ScheduledPickupStrip({ scheduledPickup, pickupDetails, toneText, country }) {
  const { date, slot, awb, awbUrl } = scheduledPickup || {}
  const address = formatAddress(pickupDetails?.address, country)
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
      <AwbLink awb={awb} awbUrl={awbUrl} />
    </div>
  )
}

// Pre-AWB window: the claim is `initiated` but the shipping label hasn't been
// generated yet, so there's no bookable pickup to show. A calm placeholder
// keeps the hero from reading as empty until scheduledPickup.awb lands.
function ArrangingPickupStrip({ toneText }) {
  return (
    <div className="mt-3 pt-3 border-t border-line-2/70 flex items-start gap-1.5 text-[11.5px] text-ink-2/90">
      <CalendarClock
        size={13}
        strokeWidth={2}
        className={`${toneText} shrink-0 mt-px opacity-70`}
      />
      <span className="leading-[1.35]">
        Arranging your pickup — your collection window will appear here once your
        shipping label is ready.
      </span>
    </div>
  )
}

function DestinationChip({ claim, order, accent, onOpenWallet }) {
  const isWallet = claim.refundMethod === 'wallet'
  const Icon = isWallet ? Wallet : CreditCard
  const label = refundMethodLabel(claim, order)
  const showBnplTooltip =
    claim.refundMethod === 'original' && isBnpl(order)
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

