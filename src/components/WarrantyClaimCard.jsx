import { useEffect, useState } from 'react'
import {
  ChevronDown,
  Check,
  Copy,
  Download,
  Home,
  Wrench,
  CalendarClock,
  MapPin,
  CheckCircle2,
  Truck,
  Zap,
} from 'lucide-react'
import {
  WARRANTY_CLAIM_STATUSES,
  warrantyClaimToneFor,
  warrantyClaimProgressIndex,
  warrantyClaimPhaseTag,
  warrantyClaimStatusHeadline,
  warrantyClaimStatusSubline,
  claimTypeLabel,
} from '../lib/claims'
import { SHIPPING_SUB_STATUSES, subProgressIndex } from '../lib/statuses'
import { getHistoryEvents } from '../lib/events'
import ClaimDetailsSheet from './ClaimDetailsSheet'
import HistoryThread from './HistoryThread'

const REVIBE_CARE_ICON =
  'https://cdn.shopify.com/s/files/1/0695/1737/7855/files/Revibe_logo_RE_CARE_Color_copy.png?v=1719938652'

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
export default function WarrantyClaimCard({ order, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [detailsOpen, setDetailsOpen] = useState(false)
  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])

  const claim = order.claim
  const tone = warrantyClaimToneFor(claim.claimStatusId)
  const t = TONE[tone]

  return (
    <article className="bg-surface rounded-card border border-line overflow-hidden relative">
      <span aria-hidden className={`absolute left-0 top-0 bottom-0 w-1 ${t.bg}`} />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full text-left pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3"
      >
        <OrderEyebrow id={order.id} />
        <StatePill claim={claim} tone={tone} />
        <WarrantyHero order={order} claim={claim} tone={tone} />
        <ProductRow order={order} expanded={expanded} />
      </button>

      {expanded && (
        <div className="pl-4 pr-3.5 pb-4 pt-0 flex flex-col gap-3.5 animate-slideDown">
          <div className="px-1">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted mb-2.5">
              Warranty progress
            </div>
            <WarrantyProgressDots claim={claim} tone={tone} />
          </div>

          {/* Detailed tracking surfaces as soon as the AWB has been
              created. Collapsed by default and styled in the brand tone
              so it reads as an inviting tap target rather than another
              neutral row. */}
          {Boolean(claim.shipBack?.awb) && (
            <ShipBackDetail claim={claim} order={order} />
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
        Returned on {shipBack.deliveredOnLong || shipBack.deliveredOn}
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
      <div className="mt-2.5 flex items-center gap-1.5 text-[12px] text-ink-2">
        <span>Delivering to</span>
        <span className="inline-flex items-center rounded-full border bg-surface text-ink border-line font-semibold whitespace-nowrap h-7 px-2.5 text-[11.5px] gap-1.5">
          <Home size={12} strokeWidth={2} />
          Home
        </span>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-ink-2 tabular-nums">
        <span className="font-semibold tracking-[0.02em]">{claim.claimRef}</span>
        <span className="text-muted/60">·</span>
        <span className="font-semibold uppercase tracking-[0.08em] text-[10.5px]">
          Claim · {claimTypeLabel(claim)}
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
              Revibe Care +{order.currency} {order.warranty.toLocaleString()}
            </span>
          </div>
        )}
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

// Brand-toned tracking dropdown. Mirrors ClaimCard's ClaimTransitDetail
// shape but reads from `claim.shipBack.subTimeline / subStatusId` and
// reuses the SHIPPING_SUB_STATUSES from lib/statuses.js so the
// milestones match a normal outgoing order (arrived in destination
// country → cleared customs → forwarded to third-party agent → out for
// delivery). Collapsed by default; the brand styling cues "tap me" so
// the customer notices it without it stealing focus from the hero.
function ShipBackDetail({ claim, order }) {
  const [show, setShow] = useState(false)
  const cur = subProgressIndex(claim.shipBack?.subStatusId)

  return (
    <div className="px-1">
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-expanded={show}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] border border-brand bg-brand-bg/60 text-[12.5px] font-semibold text-brand hover:bg-brand-bg transition"
      >
        <span className="inline-flex items-center gap-1.5">
          <Truck size={14} strokeWidth={2} />
          {show ? 'Hide detailed tracking' : 'See detailed tracking'}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className={`text-brand transition-transform ${show ? 'rotate-180' : ''}`}
        />
      </button>
      {show && (
        <div className="mt-2.5 pt-3.5 px-3.5 pb-1 rounded-[12px] border border-line bg-canvas animate-slideDown">
          {(claim.shipBack?.courier || claim.shipBack?.awb) && (
            <ShipBackCourierStrip shipBack={claim.shipBack} />
          )}
          {SHIPPING_SUB_STATUSES.map((s, i) => (
            <TransitSubItem
              key={s.id}
              label={s.label}
              timestamp={claim.shipBack?.subTimeline?.[s.id]}
              state={i < cur ? 'done' : i === cur ? 'current' : 'future'}
              isLast={i === SHIPPING_SUB_STATUSES.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ShipBackCourierStrip({ shipBack }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 mb-3 rounded-[10px] border border-line bg-surface">
      <span className="w-9 h-7 rounded-md grid place-items-center text-[11px] font-extrabold tracking-[0.04em] bg-[#ffcc00] text-[#1a1a1a] shrink-0">
        DHL
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ink truncate">
          {shipBack.courier || 'Courier'}
        </div>
        {shipBack.awb && (
          <div className="text-[11.5px] text-muted mt-px tabular-nums truncate">
            AWB #{shipBack.awb}
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="Copy AWB"
        onClick={() => shipBack.awb && navigator.clipboard?.writeText(shipBack.awb)}
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
          <div className="text-[11px] text-muted mt-px tabular-nums">
            {timestamp}
          </div>
        )}
      </div>
    </div>
  )
}

function WarrantyProgressDots({ claim, tone }) {
  const t = TONE[tone]
  const steps = WARRANTY_CLAIM_STATUSES
  const curIdx = warrantyClaimProgressIndex(claim.claimStatusId)

  return (
    <ol className="flex items-start justify-between gap-0.5">
      {steps.map((s, i) => {
        const reached = i <= curIdx
        const isCurrent = i === curIdx
        const ts = reached ? claim.timeline?.[s.id] : null
        let date = ''
        let time = ''
        if (ts) {
          const parts = String(ts).split(' · ')
          date = parts[0] || ''
          time = parts[1] || ''
        }
        const glow = isCurrent
          ? tone === 'success'
            ? 'shadow-[0_0_0_4px_rgb(216,239,225)]'
            : tone === 'brand'
              ? 'shadow-[0_0_0_4px_rgb(243,237,251)]'
              : 'shadow-[0_0_0_4px_rgb(255,242,221)]'
          : ''
        return (
          <li
            key={s.id}
            className="flex-1 flex flex-col items-center text-center relative min-w-0"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute top-[9px] right-1/2 w-full h-[2px] ${
                  reached ? t.bg : 'bg-line'
                }`}
              />
            )}
            <span
              className={`relative z-10 grid place-items-center w-[18px] h-[18px] rounded-full border-2 ${
                reached
                  ? `${t.bg} border-transparent text-white`
                  : 'bg-surface border-line text-muted'
              } ${glow}`}
            >
              {i < curIdx && <Check size={10} strokeWidth={3} />}
            </span>
            <span
              className={`mt-1.5 text-[9.5px] leading-[1.2] px-0.5 ${
                isCurrent
                  ? `${t.text} font-bold`
                  : reached
                    ? 'text-ink font-medium'
                    : 'text-muted font-medium'
              }`}
            >
              {s.short}
            </span>
            <span
              className={`mt-1 text-[9px] leading-[1.25] tabular-nums min-h-[22px] ${
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
          </li>
        )
      })}
    </ol>
  )
}
