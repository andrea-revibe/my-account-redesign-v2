import { useEffect, useState } from 'react'
import {
  ChevronDown,
  Check,
  Download,
  Wallet,
  CreditCard,
  PackageCheck,
} from 'lucide-react'
import {
  CLAIM_STATUSES,
  claimToneFor,
  claimProgressIndex,
  claimPhaseTag,
  claimStatusHeadline,
  claimStatusSubline,
  refundMethodLabel,
} from '../lib/claims'
import ClaimDetailsSheet from './ClaimDetailsSheet'

const REVIBE_CARE_ICON =
  'https://cdn.shopify.com/s/files/1/0695/1737/7855/files/Revibe_logo_RE_CARE_Color_copy.png?v=1719938652'

// Card chrome is the refund-hero family (see PastOrderCard cancelled
// branch): left accent strip, eyebrow, state pill, tinted hero, compact
// product row, expand-on-tap. Tone shifts amber → brand → success across
// the seven claim states (see lib/claims.js `claimToneFor`).
const TONE = {
  warn:    { text: 'text-warn',    bg: 'bg-warn',    softBg: 'bg-warn-bg',    softText: 'text-warn',    border: 'border-[#ffe3b8]', heroBg: 'bg-warn-bg' },
  brand:   { text: 'text-brand',   bg: 'bg-brand',   softBg: 'bg-brand-bg',   softText: 'text-brand',   border: 'border-brand-bg2',  heroBg: 'bg-gradient-to-br from-brand-bg to-brand-bg2' },
  success: { text: 'text-success', bg: 'bg-success', softBg: 'bg-success-bg', softText: 'text-success', border: 'border-[#c6ebd9]',  heroBg: 'bg-gradient-to-br from-success-bg to-[#d4f0e3]' },
}

export default function ClaimCard({ order, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [detailsOpen, setDetailsOpen] = useState(false)
  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])

  const claim = order.claim
  const tone = claimToneFor(claim.claimStatusId)
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
        <ClaimHero order={order} claim={claim} tone={tone} />
        <ProductRow order={order} expanded={expanded} />
      </button>

      {expanded && (
        <div className="pl-4 pr-3.5 pb-4 pt-0 flex flex-col gap-3.5 animate-slideDown">
          <div className="px-1">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted mb-2.5">
              Claim progress
            </div>
            <ClaimProgressDots claim={claim} tone={tone} />
          </div>

          <OriginalOrderTrace order={order} />

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
  const headline = claimStatusHeadline(claim)
  return (
    <span
      className={`self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px] ${t.softBg} ${t.softText}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${t.bg}`} />
      {headline}
    </span>
  )
}

function ClaimHero({ order, claim, tone }) {
  const t = TONE[tone]
  const phase = claimPhaseTag(claim.claimStatusId)
  const isRefunded = claim.claimStatusId === 'refunded'
  const isWallet = claim.refundMethod === 'wallet'
  const headline = claimStatusHeadline(claim)
  const subline = claimStatusSubline(claim)

  return (
    <div className={`rounded-[14px] border p-3.5 ${t.heroBg} ${t.border}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
          Claim
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

      <div className="mt-3 pt-3 border-t border-line-2/70 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2">
            {isRefunded ? 'Refunded' : 'Expected refund'}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-2">
            <span>{isRefunded ? 'Sent to' : 'Going to'}</span>
            <DestinationChip claim={claim} order={order} accent={isWallet} />
          </div>
        </div>
        <div
          className={`text-[22px] font-bold tabular-nums leading-none shrink-0 ${t.text}`}
        >
          {order.currency} {claim.expectedRefund.net.toLocaleString()}
        </div>
      </div>
    </div>
  )
}

function DestinationChip({ claim, order, accent }) {
  const isWallet = claim.refundMethod === 'wallet'
  const Icon = isWallet ? Wallet : CreditCard
  const label = refundMethodLabel(claim, order)
  const tones = accent
    ? 'bg-gradient-to-r from-brand to-accent text-white border-transparent'
    : 'bg-surface text-ink border-line'
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold whitespace-nowrap h-7 px-2.5 text-[11.5px] gap-1.5 ${tones}`}
    >
      <Icon size={12} strokeWidth={2} />
      {label}
    </span>
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

function ClaimProgressDots({ claim, tone }) {
  const t = TONE[tone]
  const steps = CLAIM_STATUSES
  const curIdx = claimProgressIndex(claim.claimStatusId)

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
              } ${isCurrent ? 'shadow-[0_0_0_4px_rgb(255,242,221)]' : ''}`}
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

function OriginalOrderTrace({ order }) {
  const deliveredDate =
    order.deliveredOnLong ||
    (order.timeline?.delivered
      ? order.timeline.delivered.split(' · ')[0]
      : null)
  if (!deliveredDate) return null
  return (
    <div className="flex items-center justify-between px-1">
      <span className="text-[10.5px] uppercase tracking-[0.06em] font-bold text-muted">
        Original order
      </span>
      <span className="inline-flex items-center gap-1 text-[11px] text-ink-2">
        <PackageCheck size={11} strokeWidth={2} className="text-success" />
        Delivered {deliveredDate}
      </span>
    </div>
  )
}

