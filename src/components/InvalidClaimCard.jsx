import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  CreditCard,
  RotateCcw,
  Settings2,
  ShieldX,
  Truck,
  Zap,
} from 'lucide-react'
import {
  RETURN_CLAIM_STATUSES,
  returnClaimProgressIndex,
  claimTypeLabel,
  formatClaimRef,
} from '../lib/claims'

import { ProductSummary } from './ProductSummary'
import { ConditionReportChip } from './ConditionReportChip'
import OrderClaimLink from './OrderClaimLink'
import Timeline from './Timeline'
import { ReturnShipmentTracking } from './ReturnShipmentTracking'
import { countryConfig } from '../lib/countries'
import TapToFixCta from './TapToFixCta'
import DeliveryAddressPill from './DeliveryAddressPill'
import EditableContactCard from './EditableContactCard'

// Routed in App.jsx when `claim.invalidClaim` is set on a claim. Mirrors
// the DocsRejectedCard / PickupFailedCard pattern: a full danger-tone
// takeover while the claim is blocked on the customer paying return
// shipping after an inspection determined the claim was invalid. Three
// internal states demoed via local toggles:
//
//   action_needed → pay → fresh-order-like ship-back card (brand tone)
//                 → decline → closed-no-refund card (muted tone)
//                                       └─ reversal CTA flips back to paid
//
// Per CLAUDE.md, this is the third takeover variant — see Card routing.
export default function InvalidClaimCard({
  order,
  defaultExpanded = false,
  onKeepClaim,
  onPayReturnShipping,
  onDeclineReturn,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  // The card's state is derived from the order data, so a journey advance — or
  // a dev-panel Back — flips the card both ways with no sync effect. paidAt
  // wins over declinedAt: paying creates the ship-back, which is forward of a
  // prior decline (the "I changed my mind and will pay" reversal sets paidAt
  // while declinedAt lingers, since the paid node spreads the existing
  // invalidClaim).
  const dataMode = order.claim.invalidClaim?.paidAt
    ? 'paid'
    : order.claim.invalidClaim?.declinedAt
      ? 'declined'
      : 'action_needed'
  // Local override for the standalone mock, where there's no journey to write
  // paidAt / declinedAt back to the order. null = follow the data; set only by
  // the in-card Pay / Decline / Reverse fallbacks when journey mode didn't take
  // the transition.
  const [localMode, setLocalMode] = useState(null)
  const mode = localMode ?? dataMode
  const [details, setDetails] = useState(order.claim.pickupDetails)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])

  // Compensation claims keep the device, so an invalid verdict has no
  // return-shipping gate — it's a plain "claim closed, no refund" terminal.
  if (order.claim.type === 'compensation') {
    return (
      <OrderClaimLink order={order} onReveal={() => setExpanded(true)}>
        <CompensationClosedCard
          order={order}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
        />
      </OrderClaimLink>
    )
  }

  if (mode === 'paid') {
    return (
      <OrderClaimLink order={order} onReveal={() => setExpanded(true)}>
        <PaidShipBackCard
          order={order}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
        />
      </OrderClaimLink>
    )
  }

  if (mode === 'declined') {
    return (
      <OrderClaimLink order={order} onReveal={() => setExpanded(true)}>
        <ClaimClosedCard
          order={order}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
          onReverse={() => {
          // "I changed my mind and will pay" — same target as Pay: journey
          // mode advances claim_return_shipping_paid (the declined node forks
          // to it), falling back to a local flip for the standalone mock.
          if (!onPayReturnShipping?.(order.id)) setLocalMode('paid')
          }}
        />
      </OrderClaimLink>
    )
  }

  const claim = order.claim
  const inv = claim.invalidClaim
  const fee = inv.returnShipping
  // `reason: 'cancelled'` reuses this whole surface for a customer-initiated
  // cancel whose device is already with Revibe — only the framing differs
  // (no QC verdict; the customer chose to cancel and just needs the device
  // sent back). The secondary becomes "Keep claim" (resume) instead of the
  // invalid path's "Decline" terminal.
  const isCancel = inv.reason === 'cancelled'
  const heroLabel = isCancel ? 'Cancelled claim' : 'Return claim'
  const heroHeadline = isCancel
    ? 'Pay return shipping to get your device back'
    : "Claim couldn't be approved"
  const cancelNote =
    'You asked to cancel this claim. Your device is at our hub — cover return shipping and we’ll send it straight back.'

  return (
    <OrderClaimLink order={order} onReveal={() => setExpanded(true)}>
    <article className="bg-surface rounded-card border border-line overflow-hidden relative shadow-sm2">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-danger" />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="group w-full text-left pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            Claim {formatClaimRef(claim)}
          </div>
          <span
            aria-hidden
            className="w-6 h-6 rounded-full bg-line-2 text-ink-2 grid place-items-center shrink-0 transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            <ChevronDown size={12} strokeWidth={1.75} />
          </span>
        </div>

        <span className="self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px] bg-danger-bg text-danger">
          <AlertTriangle size={11} strokeWidth={2.2} />
          Action needed
        </span>

        <div className="rounded-[14px] border border-[#f6c5cc] bg-danger-bg p-3.5 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2 whitespace-nowrap truncate min-w-0">
              {heroLabel}
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-danger whitespace-nowrap shrink-0">
              {isCancel ? (
                <RotateCcw size={11} strokeWidth={2.2} />
              ) : (
                <ShieldX size={11} strokeWidth={2.2} />
              )}
              {isCancel ? 'Cancellation requested' : 'Inspection complete'}
            </span>
          </div>
          <div className="text-[18px] font-bold leading-[1.15] tracking-[-0.01em] text-danger">
            {heroHeadline}
          </div>

          {isCancel ? (
            <div className="rounded-[12px] border bg-white/85 border-white px-3 py-2.5 text-[12px] text-ink leading-snug">
              {cancelNote}
            </div>
          ) : expanded ? (
            <CourierMessage
              name={inv.opsName}
              role={inv.opsRole}
              message={inv.opsMessage}
              timestamp={inv.determinedAt}
            />
          ) : (
            <div className="text-[11.5px] text-ink-2 leading-snug line-clamp-2">
              <span className="font-semibold text-ink">
                {inv.opsName}, {inv.opsRole}:
              </span>{' '}
              {inv.opsMessage}
            </div>
          )}

          <CountdownStrip inv={inv} isCancel={isCancel} />
        </div>

        <ProductSummary order={order} />

        {!expanded && <TapToFixCta />}
      </button>

      {expanded && (
        <div className="border-t border-line bg-canvas pl-4 pr-3.5 py-4 flex flex-col gap-3.5 animate-slideDown">
          <ReturnShippingFeeCard fee={fee} />

          <EditableContactCard
            title="Delivery details"
            details={details}
            editing={editing}
            onSave={(next) => {
              setDetails(next)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
            country={order.country}
          />

          {!editing && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setEditing(true)
              }}
              className="h-[42px] rounded-[10px] bg-surface border border-brand text-brand font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5"
            >
              <Settings2 size={15} strokeWidth={1.75} />
              Change delivery details
            </button>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                // Cancel variant resumes the claim (Keep claim); invalid
                // variant declines. Journey mode advances the matching node so
                // the dev panel stays in lockstep; the invalid path falls back
                // to a local flip for the standalone mock.
                if (isCancel) {
                  onKeepClaim?.(order.id)
                } else if (!onDeclineReturn?.(order.id)) {
                  setLocalMode('declined')
                }
              }}
              className="flex-1 h-[46px] rounded-[10px] bg-surface border border-line text-ink-2 font-semibold text-[13px] hover:bg-line-2"
            >
              {isCancel ? 'Keep claim' : 'Decline'}
            </button>
            <button
              type="button"
              onClick={() => {
                // Journey mode wins (advances the dev panel to the ship-back
                // node in lockstep); falls back to local state for the
                // standalone mock.
                if (!onPayReturnShipping?.(order.id)) setLocalMode('paid')
              }}
              className="flex-[2] h-[46px] rounded-[10px] border font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5 bg-danger text-white border-danger hover:brightness-95 active:scale-[0.99] transition"
            >
              <CreditCard size={14} strokeWidth={2} />
              Pay {fee.currency} {fee.amount.toLocaleString()}
            </button>
          </div>

          <div className="text-[10.5px] text-center text-muted -mt-0.5">
            {isCancel
              ? "Keeping the claim leaves it active — nothing changes. You'll get a confirmation once the return shipment is created."
              : "You'll get a confirmation email and SMS once the new shipment is created."}
          </div>
        </div>
      )}
    </article>
    </OrderClaimLink>
  )
}

// Post-payment state. Chrome borrows the InProgressCard family (brand
// gradient hero, 4-step horizontal dot timeline) so the customer reads
// it as a fresh fulfilment trajectory — the only signals it's a
// post-claim shipment are the eyebrow ("Return from Claim RET-X") and
// the state pill ("Return shipment").
function PaidShipBackCard({ order, expanded, onToggle }) {
  const claim = order.claim
  const ship = claim.invalidClaim.returnShipment
  // Merge the claim's own head (initiated → pickup → qc, collected for QC
  // before the verdict) with the return shipment's Shipped → Delivered tail,
  // so the dot strip keeps the full claim context instead of reading as a
  // fresh order — and matches the warranty ship-back card's tail.
  const stamps = {
    initiated: claim.timeline?.initiated,
    pickup: claim.timeline?.pickup,
    qc: claim.timeline?.qc,
    shipped: ship.timeline?.shipped,
    delivered: ship.timeline?.delivered,
  }
  // Once the device is delivered the leg is complete — flip the whole card to
  // success (green), mirroring the warranty `device_returned` card, and swap
  // the future-tense ETA hero for a "Delivered on …" hero.
  const delivered = ship.currentStatusId === 'delivered'
  const tone = delivered ? 'success' : 'brand'

  return (
    <article className="bg-surface rounded-card border border-line overflow-hidden relative animate-fadeIn">
      <span
        aria-hidden
        className={`absolute left-0 top-0 bottom-0 w-1 ${delivered ? 'bg-success' : 'bg-brand'}`}
      />

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full text-left pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            Return · Claim {formatClaimRef(claim)}
          </div>
          <span
            aria-hidden
            className="w-6 h-6 rounded-full bg-line-2 text-ink-2 grid place-items-center shrink-0 transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            <ChevronDown size={12} strokeWidth={1.75} />
          </span>
        </div>

        {delivered ? (
          <span className="self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] bg-success-bg text-success h-6 px-2.5 text-[10.5px]">
            <Check size={11} strokeWidth={2.4} />
            Delivered
          </span>
        ) : (
          <span className="self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] bg-brand-bg text-brand h-6 px-2.5 text-[10.5px]">
            <Truck size={11} strokeWidth={2} />
            Return shipment
          </span>
        )}

        {delivered ? (
          <div className="rounded-[14px] border p-3.5 bg-gradient-to-br from-success-bg to-[#d4f0e3] border-[#c6ebd9]">
            <div className="flex items-start justify-between gap-2">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
                Back with you
              </div>
              <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-success text-right">
                <Check size={11} strokeWidth={2.4} />
                Complete
              </span>
            </div>
            <div className="mt-1 text-[26px] font-bold leading-[1.05] tracking-[-0.01em] text-success">
              Delivered
            </div>
            <div className="mt-2.5 flex items-start gap-1.5 text-[12px] text-ink-2">
              <CheckCircle2
                size={13}
                strokeWidth={2}
                className="text-success shrink-0 mt-px"
              />
              <span className="font-semibold leading-[1.3]">
                Delivered on{' '}
                {ship.deliveredOnLong ||
                  ship.deliveredOn ||
                  (ship.timeline?.delivered || '').split(' · ')[0] ||
                  ship.estimatedDeliveryLong ||
                  ship.estimatedDelivery}
              </span>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-ink-2 tabular-nums">
              <span className="font-semibold uppercase tracking-[0.08em] text-[10.5px]">
                Claim · {claimTypeLabel(claim)}
              </span>
            </div>
          </div>
        ) : (
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
              Your device is on its way back — we'll track it like any other delivery.
            </div>
            <DeliveryAddressPill label="Delivering to" address={order.address} />
            <div className="mt-2.5 flex items-center gap-1.5 text-[11.5px] text-ink-2 tabular-nums">
              <span className="font-semibold uppercase tracking-[0.08em] text-[10.5px]">
                Claim · {claimTypeLabel(claim)}
              </span>
            </div>
          </div>
        )}

        <ProductSummary
          order={order}
          afterRow={
            delivered &&
            (ship.conditionReport?.url || order.conditionReport?.url) ? (
              <ConditionReportChip
                report={ship.conditionReport ?? order.conditionReport}
              />
            ) : null
          }
        />
      </button>

      {expanded && (
        <div className="border-t border-line bg-canvas pl-4 pr-3.5 py-4 flex flex-col gap-3.5 animate-slideDown">
          <div className="px-1">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted mb-2.5">
              Return shipment timeline
            </div>
            <Timeline
              orientation="horizontal"
              steps={RETURN_CLAIM_STATUSES}
              currentIndex={returnClaimProgressIndex(ship)}
              stamps={stamps}
              tone={tone}
            />
          </div>

          {/* Once the return shipment is dispatched, surface the shared
              return-shipment tracking dropdown (same brand chrome + courier
              strip + outbound sub-status drill-down as WarrantyClaimCard's
              ship-back leg). Gated on ship being dispatched — pre-shipping
              there's nothing to track yet. */}
          {ship.currentStatusId === 'shipped' &&
            countryConfig(order).detailedTracking && (
              <ReturnShipmentTracking ship={ship} />
            )}

          <div className="rounded-[10px] bg-brand-bg/60 border border-brand-bg2 px-3 py-2.5 text-[11.5px] text-ink-2 leading-snug">
            <span className="font-semibold text-ink">Heads up:</span> this leg is linked to Claim {formatClaimRef(claim)}. No refund will be issued —{' '}
            {claim.invalidClaim.reason === 'cancelled'
              ? 'your device is on its way back because you cancelled the claim.'
              : 'the device is being shipped back as it was inspected.'}
          </div>
        </div>
      )}
    </article>
  )
}

// Declined / closed terminal. Muted danger tone — claim is over, no
// refund, no device coming back. Single reversal CTA carries the
// verbatim copy requested by product ("I changed my mind and will pay
// for the shipment fee"); tapping it flips into the paid trajectory.
function ClaimClosedCard({ order, expanded, onToggle, onReverse }) {
  const claim = order.claim
  const fee = claim.invalidClaim.returnShipping

  return (
    <article className="bg-surface rounded-card border border-line overflow-hidden relative animate-fadeIn">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-muted/60" />

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full text-left pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            Claim {formatClaimRef(claim)}
          </div>
          <span
            aria-hidden
            className="w-6 h-6 rounded-full bg-line-2 text-ink-2 grid place-items-center shrink-0 transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            <ChevronDown size={12} strokeWidth={1.75} />
          </span>
        </div>

        <span className="self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px] bg-line-2 text-ink-2">
          <ClipboardList size={11} strokeWidth={2.2} />
          Claim closed
        </span>

        <div className="rounded-[14px] border border-line bg-line-2/40 p-3.5 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2 whitespace-nowrap truncate min-w-0">
              Return claim
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-muted whitespace-nowrap shrink-0">
              <ShieldX size={11} strokeWidth={2.2} />
              No refund issued
            </span>
          </div>
          <div className="text-[18px] font-bold leading-[1.15] tracking-[-0.01em] text-ink">
            Claim closed — device not returned
          </div>
          <div className="text-[11.5px] text-ink-2 leading-snug">
            Inspection didn't confirm the issue and you declined to cover the return shipping fee. The device stays with Revibe and no refund will be issued.
          </div>
        </div>

        <ProductSummary order={order} />
      </button>

      {expanded && (
        <div className="border-t border-line bg-canvas pl-4 pr-3.5 py-4 flex flex-col gap-3.5 animate-slideDown">
          <div className="rounded-[12px] border border-[#ffe3b8] bg-warn-bg p-3 flex flex-col gap-2.5">
            <div className="flex items-start gap-2">
              <span
                aria-hidden
                className="shrink-0 mt-0.5 w-5 h-5 rounded-full bg-warn text-white grid place-items-center"
              >
                <AlertTriangle size={11} strokeWidth={2.4} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-bold text-warn leading-tight">
                  Still want your device back?
                </div>
                <div className="mt-0.5 text-[11.5px] text-ink-2 leading-snug">
                  You can still cover the {fee.currency} {fee.amount.toLocaleString()} return shipping fee for a short window. After that the device returns to circulation.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onReverse()
              }}
              className="w-full h-10 rounded-[10px] bg-warn text-white font-semibold text-[12.5px] inline-flex items-center justify-center gap-1.5 hover:brightness-95 active:scale-[0.99] transition"
            >
              <CreditCard size={13} strokeWidth={2.2} />
              I changed my mind and will pay for the shipment fee
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

// Compensation invalid terminal. The customer kept the device, so there's
// nothing to ship back and no fee to pay — the claim simply closes with no
// refund. Muted danger tone, mirroring ClaimClosedCard's chrome, but with a
// "Discuss with support" affordance instead of the pay-shipping reversal.
function CompensationClosedCard({ order, expanded, onToggle }) {
  const claim = order.claim
  const inv = claim.invalidClaim || {}

  return (
    <article className="bg-surface rounded-card border border-line overflow-hidden relative animate-fadeIn">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-muted/60" />

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full text-left pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            Claim {formatClaimRef(claim)}
          </div>
          <span
            aria-hidden
            className="w-6 h-6 rounded-full bg-line-2 text-ink-2 grid place-items-center shrink-0 transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            <ChevronDown size={12} strokeWidth={1.75} />
          </span>
        </div>

        <span className="self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px] bg-line-2 text-ink-2">
          <ClipboardList size={11} strokeWidth={2.2} />
          Claim closed
        </span>

        <div className="rounded-[14px] border border-line bg-line-2/40 p-3.5 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2 whitespace-nowrap truncate min-w-0">
              Compensation claim
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-muted whitespace-nowrap shrink-0">
              <ShieldX size={11} strokeWidth={2.2} />
              No refund issued
            </span>
          </div>
          <div className="text-[18px] font-bold leading-[1.15] tracking-[-0.01em] text-ink">
            Claim closed — no refund
          </div>
          <div className="text-[11.5px] text-ink-2 leading-snug">
            We reviewed your evidence and couldn't approve this claim, so no
            refund will be issued. You keep your device.
          </div>
        </div>

        <ProductSummary order={order} />
      </button>

      {expanded && (
        <div className="border-t border-line bg-canvas pl-4 pr-3.5 py-4 flex flex-col gap-3.5 animate-slideDown">
          {inv.opsMessage && (
            <CourierMessage
              name={inv.opsName}
              role={inv.opsRole}
              message={inv.opsMessage}
              timestamp={inv.determinedAt}
            />
          )}

          <div className="rounded-[12px] border border-line bg-surface px-3.5 py-3 text-[11.5px] text-ink-2 leading-snug">
            <span className="font-semibold text-ink">Think this is wrong?</span>{' '}
            If you have additional proof, our support team can take another look.
          </div>

          <button
            type="button"
            className="h-[44px] rounded-[10px] bg-surface border border-line text-ink font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5 hover:bg-line-2"
          >
            Discuss with support
          </button>
        </div>
      )}
    </article>
  )
}

function CourierMessage({ name, role, message, timestamp }) {
  return (
    <div className="rounded-[12px] border bg-white/85 border-white p-3 flex gap-2.5 items-start">
      <span className="w-7 h-7 rounded-full bg-danger text-white grid place-items-center shrink-0 text-[11px] font-bold uppercase">
        {name?.[0] || '?'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] text-ink-2 font-semibold">
            <span className="text-ink">{name}</span>
            <span className="text-muted"> · {role}</span>
          </div>
          {timestamp && (
            <span className="text-[10.5px] text-muted tabular-nums shrink-0">
              {timestamp}
            </span>
          )}
        </div>
        <div className="mt-1 text-[12.5px] text-ink leading-snug pr-1">{message}</div>
      </div>
    </div>
  )
}

function CountdownStrip({ inv, isCancel = false }) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] bg-white/85 border border-white px-3 py-2 text-[11.5px]">
      <span className="w-6 h-6 rounded-full bg-danger/10 text-danger grid place-items-center shrink-0">
        <Clock size={12} strokeWidth={2.2} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] text-ink leading-tight">
          <span className="font-bold text-danger">{inv.timeLeftLabel}</span>
          <span className="text-ink-2"> to pay return shipping</span>
        </div>
        <div className="text-[10.5px] text-muted leading-tight mt-0.5">
          {isCancel ? 'Device returns to circulation' : 'Claim auto-closes'}{' '}
          {inv.autoCancelAt}
        </div>
      </div>
    </div>
  )
}

function ReturnShippingFeeCard({ fee }) {
  return (
    <div className="rounded-[12px] border border-line bg-surface overflow-hidden">
      <div className="px-3.5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck size={13} strokeWidth={2} className="text-muted" />
          <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink">
            Return shipping fee
          </span>
        </div>
        <span className="text-[15px] font-bold text-ink tabular-nums">
          {fee.currency} {fee.amount.toLocaleString()}
        </span>
      </div>
    </div>
  )
}

// Mirrors PickupFailedCard's PickupAddressCard but swaps the inline


