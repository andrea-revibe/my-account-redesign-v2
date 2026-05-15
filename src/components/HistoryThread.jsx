import { useState } from 'react'
import {
  ShoppingBag,
  XCircle,
  CircleSlash,
  PackageCheck,
  RotateCcw,
  ShieldX,
  BadgeCheck,
  Circle,
  X,
} from 'lucide-react'

// Tone tokens for the chip + detail panel. Mirrors the design's TONE map
// in card-layered.jsx; widened with `danger` for the cancel-rejected chip.
const TONE = {
  neutral: {
    text: 'text-ink-2',
    bg: 'bg-line',
    softBg: 'bg-line-2',
    border: 'border-line',
  },
  warn: {
    text: 'text-warn',
    bg: 'bg-warn',
    softBg: 'bg-warn-bg',
    border: 'border-[#ffe3b8]',
  },
  brand: {
    text: 'text-brand',
    bg: 'bg-brand',
    softBg: 'bg-brand-bg',
    border: 'border-brand-bg2',
  },
  success: {
    text: 'text-success',
    bg: 'bg-success',
    softBg: 'bg-success-bg',
    border: 'border-[#c6ebd9]',
  },
  danger: {
    text: 'text-danger',
    bg: 'bg-danger',
    softBg: 'bg-danger-bg',
    border: 'border-[#f6c5cc]',
  },
}

function eventGlyph(ev) {
  if (ev.kind === 'order') return ShoppingBag
  if (ev.kind === 'cancellation') {
    return ev.status === 'rejected' ? XCircle : CircleSlash
  }
  if (ev.kind === 'delivery') return PackageCheck
  if (ev.kind === 'return') return ev.status === 'rejected' ? ShieldX : RotateCcw
  if (ev.kind === 'refund') return BadgeCheck
  return Circle
}

function chipLabel(ev) {
  if (ev.kind === 'order') return 'Placed'
  if (ev.kind === 'cancellation') {
    if (ev.status === 'rejected') return 'Cancel rejected'
    if (ev.status === 'requested') return 'Cancel requested'
    return 'Cancelled'
  }
  if (ev.kind === 'delivery') return 'Delivered'
  if (ev.kind === 'return') {
    if (ev.status === 'rejected') return 'Return rejected'
    return 'Returned'
  }
  if (ev.kind === 'refund') return 'Refunded'
  return ev.title
}

function kindLabel(ev) {
  if (ev.kind === 'order') return 'Order'
  if (ev.kind === 'cancellation') return 'Cancellation'
  if (ev.kind === 'delivery') return 'Delivery'
  if (ev.kind === 'return') return 'Return claim'
  if (ev.kind === 'refund') return 'Refund'
  return 'Event'
}

function shortDate(ts) {
  if (!ts) return ''
  const cleaned = String(ts)
    .replace(/^Submitted /, '')
    .replace(/^Delivered /, '')
  return (cleaned.split(' · ')[0] || cleaned).trim()
}

export default function HistoryThread({ events }) {
  const [openChipId, setOpenChipId] = useState(null)
  if (!events?.length) return null
  const openEvent = events.find((e) => e.id === openChipId) || null
  const toggle = (id) => setOpenChipId((prev) => (prev === id ? null : id))

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-line-2 px-1">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.08em] font-bold text-muted">
          History · {events.length} earlier{' '}
          {events.length === 1 ? 'event' : 'events'}
        </div>
        {openChipId && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              toggle(openChipId)
            }}
            className="text-[10.5px] text-muted hover:text-ink-2 font-semibold inline-flex items-center gap-0.5"
          >
            Close <X size={10} strokeWidth={2.4} />
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {events.map((ev) => (
          <HistoryChip
            key={ev.id}
            ev={ev}
            isOpen={ev.id === openChipId}
            onClick={(e) => {
              e.stopPropagation()
              toggle(ev.id)
            }}
          />
        ))}
      </div>
      {openEvent && <HistoryDetail ev={openEvent} />}
    </div>
  )
}

function HistoryChip({ ev, isOpen, onClick }) {
  const t = TONE[ev.tone] || TONE.neutral
  const Glyph = eventGlyph(ev)
  const isNeutral = ev.tone === 'neutral'
  const wrapClasses = isNeutral
    ? isOpen
      ? 'bg-ink text-white border-ink'
      : 'bg-line-2 border-line text-ink-2 hover:bg-line'
    : isOpen
      ? `${t.bg} ${t.border} text-white`
      : `${t.softBg} ${t.border} ${t.text} hover:brightness-95`
  const dotClasses = isNeutral
    ? isOpen
      ? 'bg-white/20 text-white'
      : 'bg-white text-ink-2'
    : isOpen
      ? 'bg-white/20 text-white'
      : `${t.bg} text-white`
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      className={`inline-flex items-center gap-1.5 h-[28px] pl-1.5 pr-2.5 rounded-full border text-[11px] font-semibold whitespace-nowrap transition ${wrapClasses}`}
    >
      <span
        className={`grid place-items-center w-[18px] h-[18px] rounded-full ${dotClasses}`}
      >
        <Glyph size={10} strokeWidth={2.4} />
      </span>
      <span>{chipLabel(ev)}</span>
      <span className="opacity-50 font-medium">·</span>
      <span className="font-medium tabular-nums opacity-70">
        {shortDate(ev.timestamp)}
      </span>
    </button>
  )
}

function HistoryDetail({ ev }) {
  const t = TONE[ev.tone] || TONE.neutral
  const isNeutral = ev.tone === 'neutral'
  const cardClasses = isNeutral
    ? 'border-line bg-line-2'
    : `${t.border} ${t.softBg}`
  return (
    <div
      className={`rounded-[12px] border ${cardClasses} p-3 flex flex-col gap-2 animate-slideDown`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-ink-2">
            {kindLabel(ev)}
            {ev.ref && (
              <span className="text-muted/80 font-semibold ml-1.5">
                · {ev.ref}
              </span>
            )}
          </div>
          <div
            className={`text-[14px] font-bold leading-[1.2] mt-0.5 ${isNeutral ? 'text-ink' : t.text}`}
          >
            {ev.title}
          </div>
        </div>
        <span className="text-[10.5px] text-muted tabular-nums tracking-[0.02em] shrink-0 pt-0.5">
          {String(ev.timestamp || '')
            .replace(/^Submitted /, '')
            .replace(/^Delivered /, '')}
        </span>
      </div>
      {ev.detail && (
        <div className="text-[11.5px] text-ink-2 leading-snug">
          {ev.detail}
        </div>
      )}
      {ev.message && (
        <div className="rounded-[10px] bg-surface/80 border border-white px-2.5 py-2 text-[11.5px] text-ink-2 leading-snug">
          {ev.message}
        </div>
      )}
    </div>
  )
}
