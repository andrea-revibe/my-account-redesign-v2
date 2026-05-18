import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  MapPin,
  RotateCcw,
  Truck,
} from 'lucide-react'

const REVIBE_CARE_ICON =
  'https://cdn.shopify.com/s/files/1/0695/1737/7855/files/Revibe_logo_RE_CARE_Color_copy.png?v=1719938652'

// Routed in App.jsx when `claim.pickupFailure` is set on a claim. Mirrors
// the DocsRejectedCard pattern: a full danger-tone takeover for a claim
// that's blocked on a single customer action (here: confirm pickup address
// so the courier can re-dispatch), then flips to a warn-tone confirmation
// after the customer taps "Confirm new pickup".
export default function PickupFailedCard({ order, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])

  if (confirmed) {
    return (
      <PickupRescheduledCard
        order={order}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        onUndo={() => setConfirmed(false)}
      />
    )
  }

  const claim = order.claim
  const f = claim.pickupFailure

  return (
    <article className="bg-surface rounded-card border border-line overflow-hidden relative shadow-sm2">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-danger" />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full text-left pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            Order · #{order.id} · Claim RET-{claim.claimRef}
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
              <AlertTriangle size={11} strokeWidth={2.2} />
              Pickup failed
            </span>
          </div>
          <div className="text-[18px] font-bold leading-[1.15] tracking-[-0.01em] text-danger">
            Pickup didn't go through
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

        <ProductRow order={order} />

        {!expanded && (
          <div className="text-[11px] text-muted text-center pt-0.5">Tap to fix</div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-line bg-canvas pl-4 pr-3.5 py-4 flex flex-col gap-3.5 animate-slideDown">
          <PickupAddressCard claim={claim} />

          <div className="rounded-[10px] bg-surface border border-line px-3 py-2.5 text-[11.5px] text-ink-2 leading-snug">
            Confirming creates a new AWB with{' '}
            <span className="font-semibold text-ink">{f.nextPickup.courier}</span>, scheduled
            for <span className="font-semibold text-ink">{f.nextPickup.slot}</span>.
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="flex-1 h-[46px] rounded-[10px] bg-surface border border-line text-ink-2 font-semibold text-[13px] hover:bg-line-2"
            >
              Cancel claim
            </button>
            <button
              type="button"
              onClick={() => setConfirmed(true)}
              className="flex-[2] h-[46px] rounded-[10px] border font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5 bg-danger text-white border-danger hover:brightness-95 active:scale-[0.99] transition"
            >
              <Truck size={14} strokeWidth={2} />
              Confirm new pickup
            </button>
          </div>

          <div className="text-[10.5px] text-center text-muted -mt-0.5">
            You'll get a confirmation email and SMS once the new AWB is created.
          </div>
        </div>
      )}
    </article>
  )
}

function PickupRescheduledCard({ order, expanded, onToggle, onUndo }) {
  const claim = order.claim
  const f = claim.pickupFailure
  const next = f.nextPickup

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
            Order · #{order.id} · Claim RET-{claim.claimRef}
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
          Pickup rescheduled
        </span>

        <div className="rounded-[14px] border border-[#ffe3b8] bg-warn-bg p-3.5 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2 whitespace-nowrap truncate min-w-0">
              Return claim
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-warn whitespace-nowrap shrink-0">
              <CheckCircle2 size={11} strokeWidth={2.2} />
              New AWB created
            </span>
          </div>
          <div className="text-[18px] font-bold leading-[1.15] tracking-[-0.01em] text-warn">
            Your new pickup is on the way
          </div>
          <div className="text-[11.5px] text-ink-2 leading-snug">
            <span className="font-semibold text-ink">{next.courier}</span> will collect on{' '}
            <span className="font-semibold text-ink">{next.slot}</span>. AWB{' '}
            <span className="font-semibold text-ink tabular-nums">{next.awb}</span>.
          </div>
        </div>

        <ProductRow order={order} />
      </button>

      {expanded && (
        <div className="border-t border-line bg-canvas pl-4 pr-3.5 py-4 flex flex-col gap-3 animate-slideDown">
          <NewPickupSummary next={next} pickupDetails={claim.pickupDetails} />

          {/* Demo only — production rescheduling is committal once a new
              AWB is created. Kept here so reviewers can replay the
              confirmation flow without reloading. */}
          <button
            type="button"
            onClick={onUndo}
            className="h-[40px] rounded-[10px] bg-surface border border-line text-ink-2 font-semibold text-[12.5px] inline-flex items-center justify-center gap-1.5 hover:bg-line-2"
          >
            <RotateCcw size={13} strokeWidth={2} />
            Undo · replay the demo
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

function CountdownStrip({ failure }) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] bg-white/85 border border-white px-3 py-2 text-[11.5px]">
      <span className="w-6 h-6 rounded-full bg-danger/10 text-danger grid place-items-center shrink-0">
        <Clock size={12} strokeWidth={2.2} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] text-ink leading-tight">
          <span className="font-bold text-danger">{failure.timeLeftLabel}</span>
          <span className="text-ink-2"> to reschedule</span>
        </div>
        <div className="text-[10.5px] text-muted leading-tight mt-0.5">
          Claim auto-cancels {failure.autoCancelAt}
        </div>
      </div>
    </div>
  )
}

function PickupAddressCard({ claim }) {
  const p = claim.pickupDetails
  return (
    <div className="rounded-[12px] border border-line bg-surface overflow-hidden">
      <div className="px-3.5 py-2.5 flex items-center justify-between bg-line-2/30 border-b border-line">
        <div className="flex items-center gap-2">
          <MapPin size={13} strokeWidth={2} className="text-muted" />
          <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink">
            Pickup address
          </span>
        </div>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          className="text-[11px] font-semibold text-brand hover:underline"
        >
          Edit
        </button>
      </div>
      <div className="px-3.5 py-3 flex flex-col gap-1">
        <div className="text-[13px] font-semibold text-ink leading-snug">{p.address}</div>
        <div className="text-[11.5px] text-muted">
          {p.phone} · {p.email}
        </div>
      </div>
    </div>
  )
}

function NewPickupSummary({ next, pickupDetails }) {
  return (
    <div className="rounded-[12px] border border-line bg-surface overflow-hidden">
      <div className="px-3.5 py-2.5 bg-line-2/30 border-b border-line">
        <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink">
          Your new pickup
        </span>
      </div>
      <dl className="px-3.5 py-3 flex flex-col gap-2 text-[12.5px]">
        <SummaryRow label="Courier" value={next.courier} />
        <SummaryRow label="AWB" value={next.awb} mono />
        <SummaryRow label="Slot" value={next.slot} />
        <SummaryRow label="Pickup from" value={pickupDetails.address} />
      </dl>
    </div>
  )
}

function SummaryRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted shrink-0 pt-0.5">
        {label}
      </dt>
      <dd
        className={`text-[12.5px] font-semibold text-ink text-right leading-snug ${
          mono ? 'tabular-nums' : ''
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function ProductRow({ order }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-9 h-11 rounded-[8px] bg-brand-bg border border-line-2 grid place-items-center p-1 shrink-0">
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
        <div className="text-[11px] text-muted truncate">{order.product.variant}</div>
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
      <div className="text-right shrink-0">
        <div className="text-[10px] uppercase tracking-[0.08em] font-bold text-muted">
          Total
        </div>
        <div className="text-[13px] font-semibold text-ink tabular-nums whitespace-nowrap">
          {order.currency} {order.total.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
