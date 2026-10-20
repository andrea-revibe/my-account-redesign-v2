import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Clock,
  KeyRound,
  Lock,
  ShieldCheck,
  Eye,
  EyeOff,
  RotateCcw,
} from 'lucide-react'

import { ProductSummary } from './ProductSummary'
import TapToFixCta from './TapToFixCta'
import ResetGuideSheet from './ClaimFlow/ResetGuideSheet'
import OrderClaimLink from './OrderClaimLink'
import { resetGuideForOrder } from '../lib/devices'
import {
  guideById,
  variantFor,
  fillNoun,
  unlockFieldFor,
  unlockError,
  unlinkAckLabel,
} from '../lib/resetGuides'
import { formatClaimRef, claimTypeLabel } from '../lib/claims'

// Routed in App.jsx when `claim.resetFailed` is set on a claim. Mirrors the
// DocsRejectedCard / PickupFailedCard pattern: a danger-tone takeover for a
// claim blocked on a single customer action — here, Activation Lock is still
// on the device, so QC can't wipe it. Customer removes the device from their
// iCloud account remotely and shares the device passcode, then the card flips
// to a warn-tone confirmation while ops attempt the reset. The code field is
// per device (UNLOCK_FIELDS in lib/resetGuides): numeric passcode, Android
// PIN / password / pattern, Mac login password, optional Windows PIN or
// local password; none for AirPods / PlayStation.
export default function ResetFailedCard({
  order,
  defaultExpanded = false,
  onRequestCancelClaim,
  onSubmitResetDetails,
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [guideOpen, setGuideOpen] = useState(false)
  const [guideDone, setGuideDone] = useState(false)
  const [unlinked, setUnlinked] = useState(false)
  const [passcode, setPasscode] = useState('')
  const [kindId, setKindId] = useState(null)
  // The "details received" view is driven by the order data when journey mode
  // advances the unlock-details node (resetFailed.submittedAt), read live so
  // dev-panel Back/Next stay in sync (mirrors PickupFailedCard's rescheduledAt).
  // localSubmitted is the fallback for the standalone mock, where there's no
  // journey to advance.
  const [localSubmitted, setLocalSubmitted] = useState(false)

  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])

  const claim = order.claim
  const r = claim.resetFailed
  const submitted = !!r?.submittedAt || localSubmitted

  if (submitted) {
    return (
      <OrderClaimLink order={order} onReveal={() => setExpanded(true)}>
        <ResetDetailsReceivedCard
          order={order}
          field={unlockFieldFor(guideById(resetGuideForOrder(order).guideId).id)}
          sent={!!passcode}
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
        />
      </OrderClaimLink>
    )
  }
  // The guide opens straight onto its "already sent" branch (device locked +
  // already at Revibe), picked from the order line like Step 3 does.
  const resetGuide = resetGuideForOrder(order)
  const guide = guideById(resetGuide.guideId)
  const variant = variantFor(guide, resetGuide.variant)
  const field = unlockFieldFor(guide.id)
  const kind = field ? field.kinds.find((k) => k.id === kindId) ?? field.kinds[0] : null
  const codeError = field ? unlockError(passcode, field, kind) : null
  const canSubmit = unlinked && !codeError

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
              {claimTypeLabel(claim)} claim
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-danger whitespace-nowrap shrink-0">
              <Lock size={11} strokeWidth={2.2} />
              Device still locked
            </span>
          </div>
          <div className="text-[18px] font-bold leading-[1.15] tracking-[-0.01em] text-danger">
            We couldn’t wipe the device
          </div>

          {expanded ? (
            <OpsMessage
              name={r.opsName}
              role={r.opsRole}
              message={r.opsMessage}
              timestamp={r.failedAt}
            />
          ) : (
            <div className="text-[11.5px] text-ink-2 leading-snug line-clamp-2">
              <span className="font-semibold text-ink">
                {r.opsName}, {r.opsRole}:
              </span>{' '}
              {r.opsMessage}
            </div>
          )}

          <CountdownStrip rejection={r} />
        </div>

        <ProductSummary order={order} />

        {!expanded && <TapToFixCta />}
      </button>

      {expanded && (
        <div
          className="border-t border-line bg-canvas pl-4 pr-3.5 py-4 flex flex-col gap-3.5 animate-slideDown"
          onClick={(e) => e.stopPropagation()}
        >
          <RemoteResetLauncher
            done={guideDone}
            onOpen={() => setGuideOpen(true)}
          />

          {guideOpen && (
            <ResetGuideSheet
              guideId={resetGuide.guideId}
              facts={{ variant: resetGuide.variant }}
              initialView="remote"
              skipDone
              onDone={() => {
                setGuideDone(true)
                setGuideOpen(false)
              }}
              onClose={() => setGuideOpen(false)}
            />
          )}

          <AckToggle
            label={unlinkAckLabel(guide, variant.id)}
            checked={unlinked}
            locked={!guideDone}
            onChange={() => guideDone && setUnlinked((v) => !v)}
          />

          {field && (
            <UnlockField
              field={field}
              kind={kind}
              onKind={(id) => {
                setKindId(id)
                setPasscode('')
              }}
              value={passcode}
              onChange={setPasscode}
              error={passcode ? codeError : null}
              hint={fillNoun(field.hint, variant.noun)}
            />
          )}

          {field && <SecurityNote />}

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
                if (!canSubmit) return
                // Journey mode wins (advances the dev panel in lockstep);
                // falls back to local state for the standalone mock.
                if (!onSubmitResetDetails?.(order.id)) setLocalSubmitted(true)
              }}
              disabled={!canSubmit}
              className={`flex-[2] h-[46px] rounded-[10px] border font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5 transition ${
                canSubmit
                  ? 'bg-danger text-white border-danger hover:brightness-95 active:scale-[0.99]'
                  : 'bg-line-2 text-muted border-line cursor-not-allowed'
              }`}
            >
              <ShieldCheck size={14} strokeWidth={2} />
              {canSubmit ? 'Submit details' : field?.required ? `Confirm unlink + ${field.short}` : 'Confirm unlink'}
            </button>
          </div>

          <div className="text-[10.5px] text-center text-muted -mt-0.5">
            We’ll attempt the reset within 24 hours of receiving your details.
          </div>
        </div>
      )}
    </article>
    </OrderClaimLink>
  )
}

function ResetDetailsReceivedCard({ order, field, sent, expanded, onToggle }) {
  const claim = order.claim
  const r = claim.resetFailed
  const guide = guideById(resetGuideForOrder(order).guideId)
  // Never echo the code back: fixed-length dots. A journey replay (no local
  // entry) still shows dots so the summary isn't blank; an optional field
  // left empty says so.
  const masked = field ? (sent || field.required ? '••••••••' : 'Not shared') : null

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
          Reset in progress
        </span>

        <div className="rounded-[14px] border border-[#ffe3b8] bg-warn-bg p-3.5 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2 whitespace-nowrap truncate min-w-0">
              {claimTypeLabel(claim)} claim
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-warn whitespace-nowrap shrink-0">
              <CheckCircle2 size={11} strokeWidth={2.2} />
              Details received
            </span>
          </div>
          <div className="text-[18px] font-bold leading-[1.15] tracking-[-0.01em] text-warn">
            Thanks — we’ll attempt the reset
          </div>
          <div className="text-[11.5px] text-ink-2 leading-snug">
            <span className="font-semibold text-ink">{r.opsName}</span> will retry the wipe
            within 24 hours and resume quality check once the device is reset.
          </div>
        </div>

        <ProductSummary order={order} />
      </button>

      {expanded && (
        <div className="border-t border-line bg-canvas pl-4 pr-3.5 py-4 flex flex-col gap-3 animate-slideDown">
          <DetailsSummary
            unlinkLabel={guide.id === 'playstation' ? 'Deactivated' : 'Account unlink'}
            codeLabel={field?.label}
            masked={masked}
          />

          {field && <SecurityNote tone="warn" />}
        </div>
      )}
    </article>
  )
}

function OpsMessage({ name, role, message, timestamp }) {
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

function CountdownStrip({ rejection }) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] bg-white/85 border border-white px-3 py-2 text-[11.5px]">
      <span className="w-6 h-6 rounded-full bg-danger/10 text-danger grid place-items-center shrink-0">
        <Clock size={12} strokeWidth={2.2} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] text-ink leading-tight">
          <span className="font-bold text-danger">{rejection.timeLeftLabel}</span>
          <span className="text-ink-2"> to unlock</span>
        </div>
        <div className="text-[10.5px] text-muted leading-tight mt-0.5">
          Claim auto-cancels {rejection.autoCancelAt}
        </div>
      </div>
    </div>
  )
}

// Launches the guided reset straight onto its remote route — the customer no
// longer has the device (it's at Revibe), so the only way to clear Activation
// Lock is to unlink it remotely. Finishing the guide flips to a done state and
// unlocks the confirm checkbox below. Brand-toned so it reads as the action,
// distinct from the danger-toned blocked hero above.
function RemoteResetLauncher({ done, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full rounded-[14px] border-2 px-4 py-3.5 flex items-center gap-3 text-left transition-colors ${
        done
          ? 'border-success/40 bg-success/5 hover:bg-success/10'
          : 'border-brand bg-brand-bg/50 hover:bg-brand-bg/70'
      }`}
    >
      <span
        className={`w-10 h-10 rounded-full grid place-items-center shrink-0 text-white ${
          done ? 'bg-success' : 'bg-brand'
        }`}
      >
        {done ? (
          <CheckCircle2 size={20} strokeWidth={2} />
        ) : (
          <Lock size={18} strokeWidth={2.2} />
        )}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14px] font-semibold text-ink leading-snug">
          {done ? 'Guided reset completed' : 'Run the guided remote reset'}
        </span>
        <span className="block text-[11.5px] text-muted leading-snug mt-0.5">
          {done
            ? 'Tap to run it again'
            : 'We’ll walk you through unlinking the device remotely'}
        </span>
      </span>
      <ArrowRight
        size={18}
        strokeWidth={2.2}
        className={`shrink-0 ${done ? 'text-success' : 'text-brand'}`}
      />
    </button>
  )
}

function AckToggle({ label, checked, locked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={locked}
      className={`w-full rounded-[12px] border px-3.5 py-3 flex items-start gap-2.5 text-left transition ${
        locked
          ? 'bg-line-2/30 border-line opacity-55 cursor-not-allowed'
          : checked
            ? 'bg-success/5 border-success/40'
            : 'bg-surface border-line hover:bg-line-2/40'
      }`}
    >
      <span
        aria-hidden
        className={`w-5 h-5 rounded-[6px] border-2 grid place-items-center shrink-0 mt-0.5 transition ${
          checked
            ? 'bg-success border-success text-white'
            : 'bg-surface border-line'
        }`}
      >
        {checked && <CheckCircle2 size={12} strokeWidth={2.5} />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ink leading-snug">
          {label}
        </div>
        <div className="text-[11.5px] text-muted leading-snug mt-0.5">
          {locked
            ? 'Run the guided reset above first.'
            : 'Required so our technician can complete the wipe.'}
        </div>
      </div>
    </button>
  )
}

function UnlockField({ field, kind, onKind, value, onChange, error, hint }) {
  const [shown, setShown] = useState(false)
  const handleText = (e) => {
    const v = kind.input === 'numeric' ? e.target.value.replace(/\D/g, '').slice(0, kind.max) : e.target.value
    onChange(v)
  }
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink inline-flex items-center gap-1.5">
        <KeyRound size={12} strokeWidth={2.2} className="text-muted" />
        {field.label}
        {!field.required && <span className="normal-case tracking-normal font-medium text-muted">· optional</span>}
      </label>

      {field.kinds.length > 1 && (
        <div className="grid grid-flow-col auto-cols-fr gap-1 p-1 rounded-[10px] bg-line-2/70" role="tablist">
          {field.kinds.map((k) => (
            <button
              key={k.id}
              type="button"
              role="tab"
              aria-selected={kind.id === k.id}
              onClick={() => onKind(k.id)}
              className={`h-8 rounded-[8px] text-[12.5px] font-semibold transition ${
                kind.id === k.id ? 'bg-surface text-ink shadow-sm2' : 'text-ink-2 hover:text-ink'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}

      {kind.input === 'pattern' ? (
        <PatternGrid value={value} onChange={onChange} />
      ) : (
        <div className="relative">
          <input
            type={shown ? 'text' : 'password'}
            inputMode={kind.input === 'numeric' ? 'numeric' : 'text'}
            autoComplete="off"
            value={value}
            onChange={handleText}
            placeholder={kind.placeholder}
            className={`w-full h-[46px] rounded-[10px] border bg-surface pl-3.5 pr-11 text-[15px] text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 ${
              kind.input === 'numeric' ? 'tracking-[0.3em]' : ''
            } ${error ? 'border-danger' : 'border-line focus:border-brand'}`}
          />
          <button
            type="button"
            onClick={() => setShown((v) => !v)}
            aria-label={shown ? 'Hide' : 'Show'}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center rounded-full text-muted hover:bg-line-2/60"
          >
            {shown ? <EyeOff size={15} strokeWidth={2} /> : <Eye size={15} strokeWidth={2} />}
          </button>
        </div>
      )}

      {error ? (
        <div className="text-[11px] font-medium text-danger leading-snug">{error}</div>
      ) : (
        <div className="text-[11px] text-muted leading-snug">{hint}</div>
      )}
    </div>
  )
}

// Android pattern: tap the dots in the order they're drawn. Stored as the dot
// order ('14789'); a dot can't repeat.
const DOT_XY = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => [((n - 1) % 3) * 50 + 25, Math.floor((n - 1) / 3) * 50 + 25])

function PatternGrid({ value, onChange }) {
  const seq = value.split('').map(Number)
  const tap = (n) => !seq.includes(n) && onChange(value + n)
  return (
    <div className="rounded-[12px] border border-line bg-surface px-3 py-3 flex items-center gap-4">
      <svg viewBox="0 0 150 150" className="w-[132px] h-[132px] shrink-0" role="group" aria-label="Pattern grid">
        {seq.length > 1 && (
          <polyline
            points={seq.map((n) => DOT_XY[n - 1].join(',')).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-brand/50"
          />
        )}
        {DOT_XY.map(([x, y], k) => {
          const n = k + 1
          const order = seq.indexOf(n)
          const on = order >= 0
          return (
            <g key={n} onClick={() => tap(n)} className="cursor-pointer" aria-label={`Dot ${n}`}>
              <circle cx={x} cy={y} r="20" fill="transparent" />
              <circle cx={x} cy={y} r={on ? 11 : 7} className={on ? 'fill-brand' : 'fill-line'} />
              {on && (
                <text x={x} y={y + 3.5} textAnchor="middle" className="fill-white text-[10px] font-bold">
                  {order + 1}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-ink-2 leading-snug">Tap the dots in the order you draw your pattern.</div>
        <div className="mt-1.5 text-[13px] font-semibold text-ink tabular-nums min-h-[18px]">
          {seq.length ? `${seq.length} dots connected` : <span className="text-muted font-normal">No dots yet</span>}
        </div>
        {seq.length > 0 && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-brand"
          >
            <RotateCcw size={12} strokeWidth={2.2} /> Clear
          </button>
        )}
      </div>
    </div>
  )
}

function SecurityNote({ tone = 'danger' }) {
  const palette =
    tone === 'warn'
      ? 'bg-warn-bg border-[#ffe3b8] text-ink'
      : 'bg-danger-bg/60 border-[#f6c5cc] text-ink'
  return (
    <div
      className={`rounded-[10px] border px-3 py-2.5 text-[11.5px] leading-snug flex items-start gap-2 ${palette}`}
    >
      <ShieldCheck size={13} strokeWidth={2} className="text-ink-2 mt-0.5 shrink-0" />
      <div>
        What you share is encrypted and used only by our technician during the reset. It’s
        deleted once the device is wiped, and we never show it back to you.
      </div>
    </div>
  )
}

function DetailsSummary({ unlinkLabel, codeLabel, masked }) {
  return (
    <div className="rounded-[12px] border border-line bg-surface overflow-hidden">
      <div className="px-3.5 py-2.5 bg-line-2/30 border-b border-line">
        <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink">
          What you sent
        </span>
      </div>
      <dl className="px-3.5 py-3 flex flex-col gap-2 text-[12.5px]">
        <div className="flex items-start justify-between gap-3">
          <dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted shrink-0 pt-0.5">
            {unlinkLabel}
          </dt>
          <dd className="text-[12.5px] font-semibold text-ink text-right leading-snug inline-flex items-center gap-1">
            <CheckCircle2 size={12} strokeWidth={2.2} className="text-success" />
            Confirmed by you
          </dd>
        </div>
        {masked && (
          <div className="flex items-start justify-between gap-3">
            <dt className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted shrink-0 pt-0.5">
              {codeLabel}
            </dt>
            <dd className="text-[13px] font-semibold text-ink text-right leading-snug tracking-[0.2em]">{masked}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
