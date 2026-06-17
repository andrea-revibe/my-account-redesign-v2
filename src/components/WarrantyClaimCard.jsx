import { useEffect, useState } from 'react'
import {
  ChevronDown,
  Wrench,
  CalendarClock,
  MapPin,
  CheckCircle2,
  Zap,
} from 'lucide-react'
import {
  WARRANTY_CLAIM_STATUSES,
  canCancelClaim,
  warrantyClaimToneFor,
  warrantyClaimProgressIndex,
  warrantyClaimPhaseTag,
  warrantyClaimStatusHeadline,
  warrantyClaimStatusSubline,
  claimTypeLabel,
  formatClaimRef,
  CLAIM_TRANSIT_SUB_STATUSES,
  transitSubProgressIndex,
} from '../lib/claims'
import { getHistoryEvents } from '../lib/events'
import ClaimDetailsSheet from './ClaimDetailsSheet'
import OrderClaimLink from './OrderClaimLink'
import HistoryThread from './HistoryThread'
import { ProductSummary } from './ProductSummary'
import Timeline from './Timeline'
import DeliveryAddressPill from './DeliveryAddressPill'
import {
  ReturnShipmentTracking,
  TrackingDropdown,
} from './ReturnShipmentTracking'
import { countryConfig } from '../lib/countries'

// Tone palette mirrors ClaimCard's so the two card types feel like
// siblings. Warranty tones: warn while the device is leaving the customer
// or being inspected, brand while Revibe is doing the work (repair + ship
// back), success once the device is home.
const TONE = {
  warn:    { text: 'text-warn',    bg: 'bg-warn',    softBg: 'bg-warn-bg',    softText: 'text-warn',    border: 'border-[#ffe3b8]', heroBg: 'bg-warn-bg' },
  brand:   { text: 'text-brand',   bg: 'bg-brand',   softBg: 'bg-brand-bg',   softText: 'text-brand',   border: 'border-brand-bg2',  heroBg: 'bg-gradient-to-br from-brand-bg to-brand-bg2' },
  success: { text: 'text-success', bg: 'bg-success', softBg: 'bg-success-bg', softText: 'text-success', border: 'border-[#c6ebd9]',  heroBg: 'bg-gradient-to-br from-success-bg to-[#d4f0e3]' },
}

// Warranty equivalent of ClaimCard. Same chrome family (left accent
// strip, eyebrow, state pill, tinted hero, compact product row,
// expand-on-tap, dot strip + history thread underneath), but the post-QC
// tail tracks repair-and-ship-back instead of refund. No `expectedRefund`
// block; the hero carries state-specific context instead (repair window
// on `under_repair`, return ETA + courier on `ship_back`, delivered date
// on `device_returned`).
export default function WarrantyClaimCard({
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
  // Expand signal driven by Step 7's "Track this claim" (bumps openSignal
  // to a positive value). App.jsx resets openSignal back to 0 when the
  // flow closes via "Back to my account" / X / Escape, which drops the
  // card back to collapsed here.
  useEffect(() => {
    setExpanded(openSignal > 0)
  }, [openSignal])

  const claim = order.claim
  const tone = warrantyClaimToneFor(claim.claimStatusId)
  const t = TONE[tone]

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
        <StatePill claim={claim} tone={tone} />
        <WarrantyHero order={order} claim={claim} tone={tone} />
        <ProductSummary order={order} />
      </button>

      {expanded && (
        <div className="pl-4 pr-3.5 pb-4 pt-0 flex flex-col gap-3.5 animate-slideDown">
          <div className="px-1">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted mb-2.5">
              Warranty progress
            </div>
            <Timeline
              orientation="horizontal"
              steps={WARRANTY_CLAIM_STATUSES}
              currentIndex={warrantyClaimProgressIndex(claim.claimStatusId)}
              stamps={claim.timeline}
              tone={tone}
            />
          </div>

          {/* Pickup-leg (inbound, customer → Revibe) detailed tracking —
              the inverse-journey scan chain. Neutral chrome. Shown only
              while the device is still inbound: once the return shipment
              exists (`shipBack.awb`) the inbound leg disappears so the
              return shipment is the only detailed tracking on the surface. */}
          {Boolean(claim.transitSubTimeline?.picked_up) &&
            !claim.shipBack?.awb &&
            countryConfig(order).detailedTracking && (
              <TrackingDropdown
                steps={CLAIM_TRANSIT_SUB_STATUSES}
                currentIndex={transitSubProgressIndex(claim.transitSubStatusId)}
                stamps={claim.transitSubTimeline}
              />
            )}

          {/* Return-shipment (Revibe → customer) detailed tracking,
              shared with InvalidClaimCard's paid surface. Surfaces once
              the AWB has been created. */}
          {Boolean(claim.shipBack?.awb) &&
            countryConfig(order).detailedTracking && (
              <ReturnShipmentTracking ship={claim.shipBack} />
            )}

          {(() => {
            const history = getHistoryEvents(order, 'claim')
            return history.length > 0 ? <HistoryThread events={history} /> : null
          })()}

          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="h-[42px] rounded-[10px] bg-surface border border-line text-ink font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5 hover:bg-line-2"
          >
            View claim details
          </button>
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
  const headline = warrantyClaimStatusHeadline(claim)
  return (
    <span
      className={`self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px] ${t.softBg} ${t.softText}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${t.bg}`} />
      {headline}
    </span>
  )
}

// State-aware hero. Three distinct surfaces driven by claim.claimStatusId:
//   - under_repair: repair-window strip (Wrench + estimated repair complete)
//   - ship_back:    return-ETA hero + Delivering to chip + courier strip
//   - device_returned: delivered-date strip (CheckCircle2)
// All other states (initiated / pickup / qc) reuse the ClaimCard-style
// hero with the scheduled-pickup strip surfaced on `initiated`.
function WarrantyHero({ order, claim, tone }) {
  if (claim.claimStatusId === 'ship_back') {
    return <ShipBackHero order={order} claim={claim} />
  }

  const t = TONE[tone]
  const phase = warrantyClaimPhaseTag(claim.claimStatusId)
  const headline = warrantyClaimStatusHeadline(claim)
  const subline = warrantyClaimStatusSubline(claim)
  const showScheduledPickup =
    claim.claimStatusId === 'initiated' && Boolean(claim.scheduledPickup)
  const showRepairWindow =
    claim.claimStatusId === 'under_repair' && Boolean(claim.repairWindow)
  const showReturnedOn =
    claim.claimStatusId === 'device_returned' &&
    Boolean(claim.shipBack?.deliveredOnLong || claim.shipBack?.deliveredOn)

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
        />
      )}

      {showRepairWindow && (
        <RepairWindowStrip repair={claim.repairWindow} toneText={t.text} />
      )}

      {showReturnedOn && (
        <ReturnedStrip shipBack={claim.shipBack} toneText={t.text} />
      )}
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

function RepairWindowStrip({ repair, toneText }) {
  return (
    <div className="mt-3 pt-3 border-t border-line-2/70 flex flex-col gap-1.5">
      <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
        Estimated repair complete
      </div>
      <div className="flex items-start gap-1.5 text-[12px] text-ink-2">
        <Wrench
          size={13}
          strokeWidth={2}
          className={`${toneText} shrink-0 mt-px`}
        />
        <span className="font-semibold leading-[1.3]">
          {repair.expectedCompleteLong || repair.expectedComplete}
        </span>
      </div>
      {repair.note && (
        <div className="text-[11.5px] text-ink-2/90 leading-snug">
          {repair.note}
        </div>
      )}
    </div>
  )
}

function ReturnedStrip({ shipBack, toneText }) {
  return (
    <div className="mt-3 pt-3 border-t border-line-2/70 flex items-start gap-1.5 text-[12px] text-ink-2">
      <CheckCircle2
        size={13}
        strokeWidth={2}
        className={`${toneText} shrink-0 mt-px`}
      />
      <span className="font-semibold leading-[1.3]">
        Delivered on {shipBack.deliveredOnLong || shipBack.deliveredOn}
      </span>
    </div>
  )
}

// Borrows InProgressCard's brand-gradient ETA hero — once the device is
// on its way back, the leg should read as a forward shipment ("delivery
// coming up") rather than a continuation of the claim chrome. Mirrors
// the InvalidClaimCard `paid` state hero verbatim except no eyebrow
// rewrite — the eyebrow stays as a normal Order eyebrow because the
// WarrantyClaimCard owns the surface end-to-end.
function ShipBackHero({ order, claim }) {
  const ship = claim.shipBack
  return (
    <div className="rounded-[14px] border p-3.5 bg-gradient-to-br from-brand-bg to-brand-bg2 border-brand-bg2">
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
          Back with you by
        </div>
        <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-brand text-right">
          <Zap size={11} strokeWidth={2} />
          On track
        </span>
      </div>
      <div className="mt-1 text-[26px] font-bold leading-[1.05] tracking-[-0.01em] text-brand">
        {ship.estimatedDeliveryLong || ship.estimatedDelivery}
      </div>
      <div className="mt-1.5 text-[12px] leading-[1.45] text-ink-2">
        Your repaired device is on its way back — we'll track it like any other delivery.
      </div>
      <DeliveryAddressPill label="Delivering to" address={order.address} />
      <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-ink-2 tabular-nums">
        <span className="font-semibold uppercase tracking-[0.08em] text-[10.5px]">
          Claim · {claimTypeLabel(claim)}
        </span>
      </div>
    </div>
  )
}

