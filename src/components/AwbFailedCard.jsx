import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  MapPin,
  Settings2,
} from 'lucide-react'

import { ProductSummary } from './ProductSummary'
import TapToFixCta from './TapToFixCta'
import OrderClaimLink from './OrderClaimLink'
import EditableContactCard from './EditableContactCard'
import { formatClaimRef } from '../lib/claims'

// Routed in App.jsx when `claim.awbFailure` is set on a claim — the airway
// bill (shipping label) couldn't be generated because the courier couldn't
// validate the pickup address, so the claim is stuck before pickup. Mirrors
// the PickupFailedCard pattern: a full danger-tone takeover blocked on a
// single customer action (here: confirm/correct the pickup address so the
// AWB can be created), then flips to a warn-tone "generating label" state
// after the customer taps "Confirm pickup address". The scheduled-pickup
// strip on ClaimCard only appears once the AWB exists (scheduledPickup.awb),
// so this gate always precedes it.
export default function AwbFailedCard({
  order,
  defaultExpanded = false,
  onRequestCancelClaim,
  onConfirmAddress,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  // The warn "generating label" view is driven by the order data when journey
  // mode advances claim_need_address (awbFailure.submittedAt), read live so
  // dev-panel Back/Next stay in sync (mirrors PickupFailedCard's rescheduledAt).
  // localConfirmed is the fallback for the standalone mock, where there's no
  // journey to advance.
  const [localConfirmed, setLocalConfirmed] = useState(false)
  const confirmed = !!order.claim.awbFailure?.submittedAt || localConfirmed
  const [details, setDetails] = useState(order.claim.pickupDetails)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])

  if (confirmed) {
    return (
      <OrderClaimLink order={order} onReveal={() => setExpanded(true)}>
        <AddressConfirmedCard
          order={order}
          details={details}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
        />
      </OrderClaimLink>
    )
  }

  const claim = order.claim
  const f = claim.awbFailure

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
              Return claim
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-danger whitespace-nowrap shrink-0">
              <MapPin size={11} strokeWidth={2.2} />
              Address needed
            </span>
          </div>
          <div className="text-[18px] font-bold leading-[1.15] tracking-[-0.01em] text-danger">
            We couldn’t book a pickup
          </div>

          {expanded ? (
            <CourierMessage
              name={f.opsName}
              role={f.opsRole}
              message={f.opsMessage}
              timestamp={f.failedAt}
            />
          ) : (
            <div className="text-[11.5px] text-ink-2 leading-snug line-clamp-2">
              <span className="font-semibold text-ink">
                {f.opsName}, {f.opsRole}:
              </span>{' '}
              {f.opsMessage}
            </div>
          )}

          <CountdownStrip failure={f} />
        </div>

        <ProductSummary order={order} />

        {!expanded && <TapToFixCta />}
      </button>

      {expanded && (
        <div className="border-t border-line bg-canvas pl-4 pr-3.5 py-4 flex flex-col gap-3.5 animate-slideDown">
          <EditableContactCard
            title="Pickup address"
            details={details}
            editing={editing}
            onSave={(next) => {
              setDetails(next)
              setEditing(false)
            }}
            onCancel={() => setEditing(false)}
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
              Change pickup address
            </button>
          )}

          <div className="rounded-[10px] bg-surface border border-line px-3 py-2.5 text-[11.5px] text-ink-2 leading-snug">
            Confirming submits your address so we can create the{' '}
            <span className="font-semibold text-ink">airway bill</span> and book your
            pickup.
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => onRequestCancelClaim?.(order.id)}
              className="flex-1 h-[46px] rounded-[10px] bg-surface border border-line text-ink-2 font-semibold text-[13px] hover:bg-line-2"
            >
              Cancel claim
            </button>
            <button
              type="button"
              onClick={() => {
                // Journey mode wins (advances the dev panel in lockstep);
                // falls back to local state for the standalone mock.
                if (!onConfirmAddress?.(order.id)) setLocalConfirmed(true)
              }}
              className="flex-[2] h-[46px] rounded-[10px] border font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5 bg-danger text-white border-danger hover:brightness-95 active:scale-[0.99] transition"
            >
              <MapPin size={14} strokeWidth={2} />
              Confirm pickup address
            </button>
          </div>

          <div className="text-[10.5px] text-center text-muted -mt-0.5">
            You’ll get a confirmation once the airway bill is created and your pickup is
            booked.
          </div>
        </div>
      )}
    </article>
    </OrderClaimLink>
  )
}

function AddressConfirmedCard({ order, details, expanded, onToggle }) {
  const claim = order.claim
  const pickupDetails = details || claim.pickupDetails

  return (
    <article className="bg-surface rounded-card border border-line overflow-hidden relative shadow-sm2 animate-fadeIn">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-warn" />

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

        <span className="self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px] bg-warn-bg text-warn">
          <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
          Address confirmed
        </span>

        <div className="rounded-[14px] border border-[#ffe3b8] bg-warn-bg p-3.5 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2 whitespace-nowrap truncate min-w-0">
              Return claim
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-warn whitespace-nowrap shrink-0">
              <FileText size={11} strokeWidth={2.2} />
              Generating label
            </span>
          </div>
          <div className="text-[18px] font-bold leading-[1.15] tracking-[-0.01em] text-warn">
            We’re creating your shipping label
          </div>
          <div className="text-[11.5px] text-ink-2 leading-snug">
            Your scheduled pickup will appear here once the airway bill is ready.
          </div>
        </div>

        <ProductSummary order={order} />
      </button>

      {expanded && (
        <div className="border-t border-line bg-canvas pl-4 pr-3.5 py-4 flex flex-col gap-3 animate-slideDown">
          <div className="rounded-[12px] border border-line bg-surface overflow-hidden">
            <div className="px-3.5 py-2.5 flex items-center gap-2 bg-line-2/30 border-b border-line">
              <CheckCircle2 size={13} strokeWidth={2} className="text-warn" />
              <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink">
                Confirmed pickup address
              </span>
            </div>
            <div className="px-3.5 py-3 flex flex-col gap-1">
              <div className="text-[13px] font-semibold text-ink leading-snug">
                {pickupDetails.address}
              </div>
              <div className="text-[11.5px] text-muted">
                {pickupDetails.phone} · {pickupDetails.email}
              </div>
            </div>
          </div>
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

function CountdownStrip({ failure }) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] bg-white/85 border border-white px-3 py-2 text-[11.5px]">
      <span className="w-6 h-6 rounded-full bg-danger/10 text-danger grid place-items-center shrink-0">
        <Clock size={12} strokeWidth={2.2} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] text-ink leading-tight">
          <span className="font-bold text-danger">{failure.timeLeftLabel}</span>
          <span className="text-ink-2"> to confirm your address</span>
        </div>
        <div className="text-[10.5px] text-muted leading-tight mt-0.5">
          Claim auto-cancels {failure.autoCancelAt}
        </div>
      </div>
    </div>
  )
}
