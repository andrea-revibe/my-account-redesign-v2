import { useEffect, useRef, useState } from 'react'
import {
  ChevronDown,
  Check,
  Edit2,
  Phone,
  X,
  Download,
  MessageSquareText,
  ExternalLink,
  Settings2,
} from 'lucide-react'
import {
  STATUSES,
  progressIndex,
  statusHeadline,
  statusSubline,
  statusDescription,
  statusIconFor,
} from '../lib/statuses'
import StatusTimeline from './StatusTimeline'
import ShippingSubTimeline from './ShippingSubTimeline'
import CancellationSubTimeline from './CancellationSubTimeline'
import CancelOrderSheet from './CancelOrderSheet'

// Hardcoded so the demo lands on a real DHL test shipment regardless of the
// placeholder tracking numbers in the mock data.
const DHL_TRACKING_URL =
  'https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=3392654392'

const REVIBE_CARE_ICON =
  'https://cdn.shopify.com/s/files/1/0695/1737/7855/files/Revibe_logo_RE_CARE_Color_copy.png?v=1719938652'

// Inline-expandable order card. Collapsed view leads with status, an ETA
// block (for created / quality_check states), the dot timeline, and a
// product strip. Expanding reveals the long-form banner, sub-timeline,
// courier card, Order details collapse, and the action row.
export default function OrderCard({ order, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [cancelOpen, setCancelOpen] = useState(false)
  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])
  const detailsRef = useRef(null)
  const openDetails = () => {
    if (detailsRef.current) detailsRef.current.open = true
  }

  const isCancelled = order.state === 'cancelled'
  const isInProgress =
    (order.statusId === 'created' || order.statusId === 'quality_check') &&
    !isCancelled
  const showEta = isInProgress
  // Main-card dot timeline only renders for shipped / delivered / cancelled
  // orders. For created / quality_check it lives inside the expanded view
  // (above Order details) so the same progression isn't shown twice.
  const showTimeline = !isInProgress
  const desc = statusDescription(order)
  const isShipped = order.statusId === 'shipped'
  const showCancel = isInProgress

  const fullTimeline = (
    <div className="rounded-[14px] border border-line bg-surface p-3.5">
      <h4 className="m-0 mb-3 text-[11.5px] font-bold uppercase tracking-[0.06em] text-muted">
        Full timeline
      </h4>
      <StatusTimeline
        currentStatusId={order.statusId}
        timeline={formatTimeline(order.timeline)}
      />
    </div>
  )

  return (
    <article
      data-expanded={expanded}
      className="bg-surface rounded-card border border-line overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full text-left flex flex-col gap-3 px-4 py-3.5"
      >
        <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted -mb-1.5">
          Order · #{order.id}
        </div>
        <SummaryHeader order={order} expanded={expanded} />

        {showEta && (
          <div className="px-0.5 pt-1 pb-1.5">
            <div className="text-[17px] font-bold text-ink leading-[1.2] tracking-[-0.01em]">
              Delivery by {order.estimatedDelivery || 'May 4'}
            </div>
            <div className="mt-1 text-[12px] leading-[1.45] text-muted">
              <ToneLead tone={desc.tone}>{desc.lead}.</ToneLead>{' '}
              <span>{desc.body}</span>
            </div>
          </div>
        )}

        {showTimeline && <DotBar order={order} />}

        <div className="flex items-center gap-3 pt-3 border-t border-dashed border-line">
          <div className="w-11 h-14 rounded-[10px] bg-brand-bg border border-line-2 grid place-items-center p-1 shrink-0">
            <img
              src={order.product.image}
              alt={order.product.name}
              className="max-w-full max-h-full object-contain"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-semibold text-ink truncate">
              {order.product.name}
            </div>
            <div className="text-[12px] text-muted mt-0.5 truncate">
              {order.product.variant}
            </div>
            {order.warranty != null && (
              <div className="flex items-center gap-1 mt-0.5 text-[11.5px] text-muted">
                <img
                  src={REVIBE_CARE_ICON}
                  alt=""
                  className="w-3.5 h-3.5 object-contain shrink-0"
                />
                <span className="truncate">
                  Revibe Care +{order.currency}{' '}
                  {order.warranty.toLocaleString()}
                </span>
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted leading-none">
              Total
            </div>
            <div className="mt-1 text-[14.5px] font-bold text-ink whitespace-nowrap tabular-nums">
              {order.currency} {order.total.toLocaleString()}
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <div className="px-4 py-4 flex flex-col gap-3.5 border-t border-line bg-canvas animate-slideDown">
          {!showEta && <StatusBannerInline desc={desc} />}

          {isCancelled && <CancellationSubTimeline order={order} />}

          {isShipped && (
            <div className="rounded-[14px] border border-line bg-surface p-3.5">
              <h4 className="m-0 mb-2.5 text-[11.5px] font-bold uppercase tracking-[0.06em] text-muted">
                Shipping progress
              </h4>
              <ShippingSubTimeline
                subStatusId={order.subStatusId}
                subTimeline={order.subTimeline}
              />
            </div>
          )}

          {order.courier && (
            <div className="flex items-center gap-2.5 p-3 rounded-[12px] border border-line bg-surface">
              <span className="w-8 h-8 rounded-lg grid place-items-center text-[11px] font-extrabold tracking-[0.04em] bg-[#fff5d4] text-[#8a5a00] shrink-0">
                DHL
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-ink truncate">
                  Tracked by {order.courier}
                </div>
                {order.trackingNumber && (
                  <div className="text-[11.5px] text-muted mt-px tabular-nums truncate">
                    Tracking #{order.trackingNumber}
                  </div>
                )}
              </div>
              <a
                href={DHL_TRACKING_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-semibold text-brand inline-flex items-center gap-1"
              >
                Track <ExternalLink size={12} strokeWidth={1.75} />
              </a>
            </div>
          )}

          {isInProgress && fullTimeline}

          <DetailsCollapse
            order={order}
            canEdit={isInProgress}
            detailsRef={detailsRef}
          />

          <div className="flex gap-2">
            {isCancelled ? (
              <PrimaryBtn icon={MessageSquareText} label="Get help" />
            ) : (
              <>
                {showCancel ? (
                  <SecondaryBtn
                    tone="danger"
                    icon={X}
                    label="Cancel order"
                    onClick={() => setCancelOpen(true)}
                  />
                ) : (
                  <SecondaryBtn icon={Download} label="Receipt" />
                )}
                {isInProgress ? (
                  <PrimaryBtn
                    icon={Settings2}
                    label="Change order details"
                    variant="outline"
                    onClick={openDetails}
                  />
                ) : (
                  <PrimaryBtn icon={MessageSquareText} label="Get help" />
                )}
              </>
            )}
          </div>

          {!isInProgress && !isCancelled && fullTimeline}
        </div>
      )}
      {showCancel && (
        <CancelOrderSheet
          order={order}
          open={cancelOpen}
          onClose={() => setCancelOpen(false)}
        />
      )}
    </article>
  )
}

function SummaryHeader({ order, expanded }) {
  const { Icon, bg, fg } = statusIconFor(order)
  const sub = statusSubline(order)
  return (
    <div className="flex items-start gap-3">
      <span
        className={`w-[38px] h-[38px] rounded-[12px] grid place-items-center shrink-0 ${bg} ${fg}`}
      >
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-bold text-ink tracking-[-0.005em]">
          {statusHeadline(order)}
        </div>
        {sub && (
          <div className="text-[12.5px] text-muted mt-0.5 truncate">{sub}</div>
        )}
      </div>
      <span
        aria-hidden
        className={`w-7 h-7 rounded-full bg-line-2 text-ink-2 grid place-items-center shrink-0 transition-transform duration-200 ${
          expanded ? 'rotate-180' : ''
        }`}
      >
        <ChevronDown size={14} strokeWidth={1.75} />
      </span>
    </div>
  )
}

// Compact dot timeline used inside the collapsed card header. Mirrors the
// hero-card variant but in the light palette — see HeroCard's DotTimeline
// for the dark counterpart.
function DotBar({ order }) {
  const cur = progressIndex(order.statusId)
  const cancelled = order.state === 'cancelled'
  const delivered = order.statusId === 'delivered'
  return (
    <div className="flex items-start justify-between gap-1 mt-1">
      {STATUSES.map((s, i) => {
        const done = i < cur
        const current = i === cur
        // On cancelled the timeline is frozen — the cancel point is marked
        // with an ✕ instead of treated as "current and progressing".
        const reached = cancelled ? done : done || current
        const cancelPoint = cancelled && current
        const tone = cancelled ? 'danger' : delivered ? 'success' : 'brand'
        const showHalo = current && !cancelled
        return (
          <div
            key={s.id}
            className="flex-1 flex flex-col items-center relative"
          >
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute top-[9px] right-1/2 w-full h-[2px] ${
                  reached || cancelPoint
                    ? tone === 'danger'
                      ? 'bg-danger'
                      : tone === 'success'
                        ? 'bg-success'
                        : 'bg-brand'
                    : 'bg-line'
                }`}
              />
            )}
            <span
              className={`relative z-10 grid place-items-center w-[18px] h-[18px] rounded-full border-2 ${
                reached || cancelPoint
                  ? tone === 'danger'
                    ? 'bg-danger border-danger text-white'
                    : tone === 'success'
                      ? 'bg-success border-success text-white'
                      : 'bg-brand border-brand text-white'
                  : 'bg-surface border-line text-muted'
              } ${showHalo ? 'shadow-[0_0_0_4px_rgb(243,237,251)]' : ''}`}
            >
              {cancelPoint ? (
                <X size={10} strokeWidth={3} />
              ) : done ? (
                <Check size={10} strokeWidth={3} />
              ) : null}
            </span>
            <span
              className={`mt-1.5 text-[10.5px] text-center leading-[1.2] font-medium ${
                cancelPoint
                  ? 'text-danger font-bold'
                  : current
                    ? 'text-ink font-bold'
                    : reached
                      ? 'text-ink'
                      : 'text-muted'
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

function ToneLead({ tone, children }) {
  const cls =
    tone === 'warn'
      ? 'text-warn'
      : tone === 'success'
        ? 'text-success'
        : tone === 'danger'
          ? 'text-danger'
          : 'text-brand'
  return <span className={`font-semibold ${cls}`}>{children}</span>
}

function StatusBannerInline({ desc }) {
  const tones = {
    brand: 'bg-brand-bg border-brand-bg2 text-ink',
    success: 'bg-success-bg border-[#c6ebd9] text-ink',
    warn: 'bg-warn-bg border-[#ffe3b8] text-ink',
    danger: 'bg-danger-bg border-[#f8c8cf] text-ink',
  }
  const lead = {
    brand: 'text-brand',
    success: 'text-success',
    warn: 'text-warn',
    danger: 'text-danger',
  }
  return (
    <div
      className={`rounded-[12px] border px-3.5 py-3 text-[13px] leading-[1.45] ${tones[desc.tone] || tones.brand}`}
    >
      <span className={`font-bold ${lead[desc.tone] || lead.brand}`}>
        {desc.lead}
      </span>{' '}
      <span>{desc.body}</span>
    </div>
  )
}

function DetailsCollapse({ order, canEdit, detailsRef }) {
  return (
    <details
      ref={detailsRef}
      className="group rounded-[12px] border border-line bg-surface overflow-hidden"
    >
      <summary className="flex items-center justify-between px-3.5 py-3 text-[13px] font-semibold text-ink cursor-pointer list-none [&::-webkit-details-marker]:hidden">
        <span>Order details</span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className="text-muted transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="px-3.5 pb-3 pt-3 flex flex-col gap-3.5 border-t border-line-2">
        <DetailStack
          k="Delivery address"
          v={order.address}
          action={canEdit ? { icon: Edit2, label: 'Change address' } : null}
        />
        <DetailStack
          k="Phone number"
          v={order.phone}
          action={
            canEdit ? { icon: Phone, label: 'Change phone number' } : null
          }
        />
        <DetailRow k="Order date" v={order.placedAtFull || order.placedAt} />
      </div>
    </details>
  )
}

function DetailStack({ k, v, action }) {
  return (
    <div className="flex flex-col gap-2 items-end">
      <DetailRow k={k} v={v} />
      {action && (
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border border-line bg-surface text-[11.5px] font-medium text-ink hover:bg-line-2">
          <action.icon size={12} strokeWidth={1.75} className="opacity-70" />
          {action.label}
        </button>
      )}
    </div>
  )
}

function DetailRow({ k, v }) {
  return (
    <div className="flex justify-between gap-3 w-full">
      <div className="text-[12px] text-muted">{k}</div>
      <div className="text-[12.5px] text-ink text-right max-w-[60%] leading-[1.4]">
        {v}
      </div>
    </div>
  )
}

function PrimaryBtn({ icon: Icon, label, onClick, variant = 'filled' }) {
  const styles =
    variant === 'outline'
      ? 'bg-surface text-brand border-brand'
      : 'bg-brand text-white border-brand'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 h-[42px] rounded-[10px] inline-flex items-center justify-center gap-1.5 border font-semibold text-[13.5px] ${styles}`}
    >
      <Icon size={16} strokeWidth={1.75} />
      {label}
    </button>
  )
}

function SecondaryBtn({ icon: Icon, label, tone, onClick }) {
  const danger =
    tone === 'danger'
      ? 'text-danger border-[#f4c5cc] hover:bg-danger-bg'
      : 'text-ink border-line hover:bg-line-2'
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 h-[42px] rounded-[10px] inline-flex items-center justify-center gap-1.5 bg-surface border font-semibold text-[13.5px] ${danger}`}
    >
      <Icon size={16} strokeWidth={1.75} />
      {label}
    </button>
  )
}

function formatTimeline(timeline) {
  const out = {}
  for (const [k, v] of Object.entries(timeline)) {
    const parts = String(v).split(' ')
    if (parts.length >= 4) {
      out[k] = `${parts.slice(0, 2).join(' ')}\n${parts.slice(2).join(' ')}`
    } else {
      out[k] = v
    }
  }
  return out
}
