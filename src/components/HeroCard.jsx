import { useEffect, useRef, useState } from 'react'
import {
  Truck,
  Headphones,
  ChevronDown,
  Check,
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

// Hardcoded to a known-good DHL Express shipment so the demo lands on a real
// tracking page even though the mock orders use placeholder tracking numbers.
const DHL_TRACKING_URL =
  'https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=3392654392'

// Hero card pulls the most-active order to the very top of the list with a
// dark gradient background. Inside-out structure: eyebrow → headline →
// product strip → dot timeline → optional detailed-tracking expand → CTAs.
export default function HeroCard({ order }) {
  const [showDetail, setShowDetail] = useState(false)
  if (!order) return null

  const desc = statusDescription(order)
  const cur = progressIndex(order.statusId)
  const subCur = subProgressIndex(order.subStatusId)
  const isShipped = order.statusId === 'shipped'

  return (
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
        <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] opacity-85">
          <span className="w-2 h-2 rounded-full bg-[#6dffb8] animate-heroPulse" />
          Active order · #{order.id}
        </div>
        <h2 className="mt-2 mb-0 text-[22px] font-bold tracking-[-0.02em] leading-[1.2]">
          {statusHeadline(order)}
        </h2>
        {order.estimatedDelivery && (
          <div className="text-[18px] font-bold tracking-[-0.02em] leading-[1.2]">
            Delivery by {order.estimatedDelivery}
          </div>
        )}
        <div className="text-[13.5px] opacity-85 leading-[1.4]">
          {desc.body}
        </div>

        <div className="mt-3 flex items-center gap-3 p-3 rounded-[14px] border border-white/[.14] bg-white/[.08] backdrop-blur-[4px]">
          <div className="w-12 h-12 rounded-[10px] bg-white/[.94] grid place-items-center p-1 shrink-0">
            <img
              src={order.product.image}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-[14px] truncate">
              {order.product.name}
            </div>
            <div className="text-[12px] opacity-75 mt-px truncate">
              {order.product.variant}
            </div>
            {order.warranty != null && (
              <div className="text-[11.5px] opacity-60 mt-px truncate">
                + Warranty {order.currency} {order.warranty.toLocaleString()}
              </div>
            )}
          </div>
          <div className="ml-auto font-bold text-[15px]">
            {order.currency} {order.total.toLocaleString()}
          </div>
        </div>

        <div className="mt-4">
          <DotTimeline cur={cur} />
        </div>

        {isShipped && (
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
                {SHIPPING_SUB_STATUSES.map((s, i) => (
                  <SubItem
                    key={s.id}
                    label={s.label}
                    timestamp={order.subTimeline?.[s.id]}
                    state={
                      i < subCur
                        ? 'done'
                        : i === subCur
                          ? 'current'
                          : 'future'
                    }
                    isLast={i === SHIPPING_SUB_STATUSES.length - 1}
                  />
                ))}
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

        <div className="mt-2 flex gap-2">
          <CancelOrderButton />
          <GhostBtn icon={AlertTriangle} label="Raise a claim" />
        </div>
      </div>
    </section>
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

function DotTimeline({ cur }) {
  return (
    <div className="flex items-start justify-between gap-1">
      {STATUSES.map((s, i) => {
        const done = i < cur
        const current = i === cur
        return (
          <div
            key={s.id}
            className="flex-1 flex flex-col items-center relative"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute top-[9px] right-1/2 w-full h-[2px] ${
                  done || current ? 'bg-white' : 'bg-white/[.22]'
                }`}
              />
            )}
            <span
              className={`relative z-10 grid place-items-center w-[18px] h-[18px] rounded-full border-2 text-brand ${
                done || current
                  ? 'bg-white border-white'
                  : 'bg-transparent border-white/40'
              } ${current ? 'shadow-[0_0_0_4px_rgba(255,255,255,0.18)]' : ''}`}
            >
              {done && <Check size={10} strokeWidth={3} />}
            </span>
            <span
              className={`mt-1.5 text-[10.5px] text-center leading-[1.2] ${
                current
                  ? 'text-white font-bold'
                  : done
                    ? 'text-white font-medium'
                    : 'text-white/65 font-medium'
              }`}
            >
              {s.short}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function SubItem({ label, timestamp, state, isLast }) {
  const done = state === 'done'
  const current = state === 'current'
  return (
    <div className="flex gap-3 items-start">
      <div className="w-[18px] flex flex-col items-center self-stretch">
        <span
          className={`w-[14px] h-[14px] rounded-full border-2 grid place-items-center text-brand shrink-0 ${
            done || current ? 'bg-white border-white' : 'bg-transparent border-white/40'
          } ${current ? 'shadow-[0_0_0_4px_rgba(255,255,255,0.18)]' : ''}`}
        >
          {done && <Check size={9} strokeWidth={3} />}
        </span>
        {!isLast && (
          <span
            className={`flex-1 w-[2px] mt-0.5 ${done ? 'bg-white' : 'bg-white/[.22]'}`}
          />
        )}
      </div>
      <div className={`flex-1 ${isLast ? 'pb-1' : 'pb-3'}`}>
        <div
          className={`text-[13px] ${
            current
              ? 'text-white font-bold'
              : done
                ? 'text-white'
                : 'text-white/75'
          }`}
        >
          {label}
        </div>
        {timestamp && (
          <div className="text-[11px] text-white/55 mt-px">{timestamp}</div>
        )}
      </div>
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
