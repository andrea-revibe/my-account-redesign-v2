import { useState } from 'react'
import {
  ShoppingBag,
  CircleSlash,
  PackageCheck,
  RotateCcw,
  ShieldX,
  BadgeCheck,
  UploadCloud,
  Circle,
  ChevronDown,
} from 'lucide-react'

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
}

function eventGlyph(ev) {
  if (ev.kind === 'order') return ShoppingBag
  if (ev.kind === 'cancellation') return CircleSlash
  if (ev.kind === 'delivery') return PackageCheck
  if (ev.kind === 'return') return ev.status === 'rejected' ? ShieldX : RotateCcw
  if (ev.kind === 'refund') return BadgeCheck
  if (ev.kind === 'evidence') return UploadCloud
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
  if (ev.kind === 'evidence') return 'Evidence resubmitted'
  return ev.title
}

function kindLabel(ev) {
  if (ev.kind === 'order') return 'Order'
  if (ev.kind === 'cancellation') return 'Cancellation'
  if (ev.kind === 'delivery') return 'Delivery'
  if (ev.kind === 'return') return 'Return claim'
  if (ev.kind === 'refund') return 'Refund'
  if (ev.kind === 'evidence') return 'Return claim'
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
  const [isExpanded, setIsExpanded] = useState(false)
  const [openRowId, setOpenRowId] = useState(null)
  if (!events?.length) return null
  const openEvent = events.find((e) => e.id === openRowId) || null
  const toggleRow = (id) => setOpenRowId((prev) => (prev === id ? null : id))
  const toggleAll = () => {
    setIsExpanded((prev) => {
      if (prev) setOpenRowId(null)
      return !prev
    })
  }

  return (
    <div className="flex flex-col gap-2 pt-3 border-t border-line-2 px-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggleAll()
        }}
        aria-expanded={isExpanded}
        className="w-full flex items-center justify-between text-left hover:opacity-80 transition"
      >
        <span className="text-[10px] uppercase tracking-[0.08em] font-bold text-muted">
          History · {events.length} earlier{' '}
          {events.length === 1 ? 'event' : 'events'}
        </span>
        <ChevronDown
          size={14}
          strokeWidth={2.2}
          className={`text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>
      {isExpanded && (
        <>
          <div className="flex flex-col">
            {events.map((ev, idx) => (
              <TimelineRow
                key={ev.id}
                ev={ev}
                isFirst={idx === 0}
                isLast={idx === events.length - 1}
                isOpen={ev.id === openRowId}
                onClick={(e) => {
                  e.stopPropagation()
                  toggleRow(ev.id)
                }}
              />
            ))}
          </div>
          {openEvent && <HistoryDetail ev={openEvent} />}
        </>
      )}
    </div>
  )
}

function TimelineRow({ ev, isFirst, isLast, isOpen, onClick }) {
  const t = TONE[ev.tone] || TONE.neutral
  const Glyph = eventGlyph(ev)
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      className={`flex w-full text-left transition rounded-[8px] ${isOpen ? 'bg-line-2' : 'hover:bg-line-2/60'}`}
    >
      <div className="flex flex-col items-center w-[18px] shrink-0">
        <div className={`w-px flex-1 ${isFirst ? 'invisible' : 'bg-line'}`} />
        <div className={`grid place-items-center w-[16px] h-[16px] rounded-full ${t.bg}`}>
          <Glyph size={9} strokeWidth={2.6} className="text-white" />
        </div>
        <div className={`w-px flex-1 ${isLast ? 'invisible' : 'bg-line'}`} />
      </div>
      <div className="flex-1 ml-2.5 py-2 pr-1.5 flex items-center justify-between gap-3 min-w-0">
        <span className={`truncate text-[11.5px] font-semibold ${isOpen ? 'text-ink' : 'text-ink-2'}`}>
          {chipLabel(ev)}
        </span>
        <span className="shrink-0 text-[10.5px] tabular-nums text-muted">
          {shortDate(ev.timestamp)}
        </span>
      </div>
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
