import { useEffect, useRef, useState } from 'react'
import {
  Truck,
  Headphones,
  ChevronDown,
  Copy,
  X,
  AlertTriangle,
} from 'lucide-react'
import {
  STATUSES,
  SHIPPING_SUB_STATUSES,
  progressIndex,
  subProgressIndex,
  statusHeadline,
  statusDescription,
} from '../lib/statuses'
import { ProductSummary } from './ProductSummary'
import Timeline from './Timeline'
import CancelOrderSheet from './CancelOrderSheet'
import { countryConfig } from '../lib/countries'
import { canCancelShipped } from '../lib/returns'

// Hardcoded to a known-good DHL Express shipment so the demo lands on a real
// tracking page even though the mock orders use placeholder tracking numbers.
const DHL_TRACKING_URL =
  'https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=3392654392'

// The hero used to render `statusDescription`'s body and ignore its `tone`, so a
// stalled or refused delivery looked exactly as healthy as an on-track one —
// green "active" pulse and all. Both alert tones swap the pulse for a warning
// triangle and lift the body copy into a tinted block; `brand` / `success` keep
// the original treatment.
//
// The two tones say different things, matching what they already mean elsewhere
// in the app (delay banners warn; the action-needed takeover cards go danger):
//
//   warn   — something's wrong and we're on it. Nothing for the customer to do,
//            so the eyebrow still reads `Active order` (it is one) in amber.
//            Covers the stuck-in-transit stall + the Dynamic-EDD late messages.
//   danger — the customer has to decide something. Eyebrow becomes a solid red
//            `Action needed` pill. Covers the refused delivery.
//
// Inks are the light `chip-warn` / white-on-`chip-danger`, not the base `warn` /
// `danger` tokens, which are too dark to read on the purple gradient.
const ALERT_TONES = {
  warn: {
    label: 'Active order',
    ink: 'text-chip-warn',
    block: 'bg-chip-warn/15 border-chip-warn/40',
  },
  danger: {
    label: 'Action needed',
    pill: true,
    ink: 'text-white',
    block: 'bg-chip-danger/25 border-chip-danger/60',
  },
}

// Hero card pulls the most-active order to the very top of the list with a
// dark gradient background. Inside-out structure: eyebrow → headline →
// product strip → dot timeline → optional detailed-tracking expand → CTAs.
export default function HeroCard({ order, onRaiseClaim, onCancelOrder }) {
  const [showDetail, setShowDetail] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  if (!order) return null

  const desc = statusDescription(order)
  const alert = ALERT_TONES[desc.tone] ?? null
  const cur = progressIndex(order.statusId)
  const subCur = subProgressIndex(order.subStatusId)
  const isShipped = order.statusId === 'shipped'
  // Outside AE a shipment stuck in transit past the cancellation window can be
  // cancelled from here; everywhere else the button stays the tooltip stub.
  const canCancel = canCancelShipped(order)

  return (
    <>
    <section className="relative overflow-hidden mx-4 mt-1 mb-4 rounded-[22px] text-white shadow-lg2 bg-hero-gradient p-[18px] pb-4">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 110% 20%, rgba(217,26,122,0.35), transparent 50%), radial-gradient(circle at -10% 110%, rgba(122,61,211,0.5), transparent 50%)',
        }}
      />
      <div className="relative flex flex-col gap-2">
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]">
          {alert?.pill ? (
            <>
              <span className="inline-flex items-center gap-1 rounded-full bg-chip-danger px-2 py-[3px] text-white">
                <AlertTriangle size={11} strokeWidth={2.5} />
                {alert.label}
              </span>
              <span className="opacity-85">· #{order.id}</span>
            </>
          ) : (
            <span
              className={
                'inline-flex items-center gap-1.5 ' +
                (alert ? alert.ink : 'opacity-85')
              }
            >
              {alert ? (
                <AlertTriangle size={13} strokeWidth={2.5} />
              ) : (
                <span className="w-2 h-2 rounded-full bg-[#6dffb8] animate-heroPulse" />
              )}
              {alert ? alert.label : 'Active order'} · #{order.id}
            </span>
          )}
        </div>
        <h2 className="mt-2 mb-0 text-[22px] font-bold tracking-[-0.02em] leading-[1.2]">
          {statusHeadline(order)}
        </h2>
        {order.estimatedDelivery && (
          <div className="text-[18px] font-bold tracking-[-0.02em] leading-[1.2]">
            Delivery by {order.estimatedDelivery}
          </div>
        )}
        {alert ? (
          <div
            className={
              'mt-1 flex items-start gap-2 rounded-[12px] border px-3 py-2.5 ' +
              alert.block
            }
          >
            <AlertTriangle
              size={15}
              strokeWidth={2}
              className={'shrink-0 mt-px ' + alert.ink}
            />
            <span className="text-[13px] leading-[1.45]">{desc.body}</span>
          </div>
        ) : (
          <div className="text-[13.5px] opacity-85 leading-[1.4]">
            {desc.body}
          </div>
        )}

        <ProductSummary order={order} tone="hero" className="mt-3" />

        <div className="mt-4">
          <Timeline
            orientation="horizontal"
            onDark
            steps={STATUSES}
            currentIndex={cur}
            complete={order.statusId === 'delivered'}
          />
        </div>

        {isShipped && countryConfig(order).detailedTracking && (
          <>
            <button
              onClick={() => setShowDetail((v) => !v)}
              aria-expanded={showDetail}
              className="mt-3.5 w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] border border-white/[.18] bg-white/[.08] text-[12.5px] font-semibold text-white"
            >
              <span>{showDetail ? 'Hide detailed tracking' : 'See detailed tracking'}</span>
              <ChevronDown
                size={16}
                strokeWidth={1.75}
                className={`opacity-85 transition-transform ${showDetail ? 'rotate-180' : ''}`}
              />
            </button>
            {showDetail && (
              <div className="mt-2.5 pt-3.5 px-3.5 pb-1 rounded-[12px] border border-white/[.14] bg-white/[.06] animate-slideDown">
                {(order.courier || order.trackingNumber) && (
                  <CourierStrip order={order} />
                )}
                <Timeline
                  orientation="vertical"
                  dense
                  onDark
                  steps={SHIPPING_SUB_STATUSES}
                  currentIndex={subCur}
                  stamps={order.subTimeline || {}}
                />
                <div className="pb-1" />
              </div>
            )}
          </>
        )}

        <div className="mt-3.5 flex gap-2">
          <a
            href={DHL_TRACKING_URL}
            target="_blank"
            rel="noreferrer"
            className="flex-1 h-10 rounded-[10px] inline-flex items-center justify-center gap-1.5 bg-white text-brand font-semibold text-[13.5px]"
          >
            <Truck size={16} strokeWidth={1.75} /> Track package
          </a>
          <GhostBtn icon={Headphones} label="Get help" />
        </div>

        <button
          type="button"
          onClick={() => onRaiseClaim?.(order.id)}
          className="mt-2 w-full h-10 rounded-[10px] inline-flex items-center justify-center gap-1.5 bg-white/[.20] border border-white/40 text-white font-semibold text-[13.5px]"
        >
          <AlertTriangle size={16} strokeWidth={1.75} />
          I need help with this device
        </button>

        <div className="mt-2">
          {canCancel ? (
            <button
              type="button"
              onClick={() => setCancelOpen(true)}
              className="w-full h-10 rounded-[10px] inline-flex items-center justify-center gap-1.5 bg-white/[.12] border border-white/[.22] text-white font-semibold text-[13.5px]"
            >
              <X size={16} strokeWidth={1.75} />
              Cancel order
            </button>
          ) : (
            <CancelOrderButton />
          )}
        </div>
      </div>
    </section>
    {canCancel && (
      <CancelOrderSheet
        order={order}
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onSubmit={onCancelOrder}
      />
    )}
    </>
  )
}

function GhostBtn({ icon: Icon, label, ...rest }) {
  return (
    <button
      type="button"
      className="flex-1 h-10 rounded-[10px] inline-flex items-center justify-center gap-1.5 bg-white/[.12] border border-white/[.22] text-white font-semibold text-[13.5px]"
      {...rest}
    >
      <Icon size={16} strokeWidth={1.75} />
      {label}
    </button>
  )
}

function CancelOrderButton() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  return (
    <div ref={ref} className="relative flex-1">
      {open && (
        <div
          role="status"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[180px] rounded-[10px] bg-ink text-white text-[11.5px] leading-[1.35] px-3 py-2 text-center whitespace-normal shadow-lg2 animate-slideDown"
        >
          You cannot cancel the order at this stage
          <span
            aria-hidden
            className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 rotate-45 bg-ink"
          />
        </div>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full h-10 rounded-[10px] inline-flex items-center justify-center gap-1.5 bg-white/[.12] border border-white/[.22] text-white font-semibold text-[13.5px]"
      >
        <X size={16} strokeWidth={1.75} />
        Cancel order
      </button>
    </div>
  )
}

function CourierStrip({ order }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 mb-3 rounded-[10px] border border-white/[.16] bg-white/[.08]">
      <span className="w-9 h-7 rounded-md grid place-items-center text-[11px] font-extrabold tracking-[0.04em] bg-[#ffcc00] text-[#1a1a1a] shrink-0">
        DHL
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-white truncate">
          {order.courier || 'Courier'}
        </div>
        {order.trackingNumber && (
          <div className="text-[11.5px] text-white/70 mt-px tabular-nums truncate">
            Tracking #{order.trackingNumber}
          </div>
        )}
      </div>
      <button
        aria-label="Copy tracking number"
        onClick={() =>
          order.trackingNumber &&
          navigator.clipboard?.writeText(order.trackingNumber)
        }
        className="w-8 h-8 rounded-lg grid place-items-center border border-white/[.22] text-white/85 hover:bg-white/[.08] shrink-0"
      >
        <Copy size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}
