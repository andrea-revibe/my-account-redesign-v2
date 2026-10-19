import { useState } from 'react'
import { ArrowRight, RotateCcw } from 'lucide-react'
import ResetGuideSheet from './ClaimFlow/ResetGuideSheet'
import { resetGuideForOrder } from '../lib/devices'
import { stepsFor, RESET_MODES } from '../lib/resetGuides'

// Guided-reset sandbox panel (journey `guided_reset`): pick a guide, its
// device variant, the mode and where to open, then launch ResetGuideSheet.
// The debug strip re-runs the real order→guide mapping on the synthesised
// order, so a mapping regression shows up here as a mismatch.

const OPEN_AT = [
  { id: 'start', label: 'Start' },
  { id: 'with_you', label: 'Can’t use › picker' },
  { id: 'sent', label: 'Can’t use › sent' },
  { id: 'recovery', label: 'Account recovery' },
]

const CHIP =
  'px-2 py-1 rounded-full text-[10.5px] font-semibold whitespace-nowrap transition '
const CHIP_IDLE = 'bg-ink/[0.06] text-ink-2 hover:bg-ink/[0.1]'
const CHIP_ACTIVE = 'bg-ink text-white'

export default function ResetGuidePanel({
  guides,
  inputs,
  setInput,
  reset,
  guide,
  variant,
  single,
  order,
  journeys,
  activeJourneyId,
  onSelectJourney,
}) {
  const [open, setOpen] = useState(false)
  const [lastResult, setLastResult] = useState(null)
  const mode = single ? 'single' : inputs.mode
  const steps = stepsFor(guide, mode, { variant: variant.id })
  const mapped = resetGuideForOrder(order)
  const mapsBack = mapped.guideId === guide.id && mapped.variant === variant.id
  const passcodeKind = mode === 'repair' ? guide.steps.find((s) => s.passcode)?.passcode : null
  const noCantUse = !guide.cantUse

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[380px] bg-surface border border-line rounded-2xl shadow-lg p-4 max-h-[90vh] overflow-y-auto">
      {journeys && journeys.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3 -mt-0.5">
          {journeys.map((j) => {
            const active = j.id === activeJourneyId
            return (
              <button
                key={j.id}
                onClick={() => onSelectJourney(j.id)}
                className={
                  'px-2 py-1 rounded-full text-[10.5px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap transition ' +
                  (active ? 'bg-brand text-white' : 'bg-brand/10 text-brand hover:bg-brand/15')
                }
              >
                {j.label}
              </button>
            )
          })}
        </div>
      )}

      <Label>Guide</Label>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {guides.map((g) => (
          <button
            key={g.id}
            onClick={() => setInput('guideId', g.id)}
            className={CHIP + (g.id === guide.id ? CHIP_ACTIVE : CHIP_IDLE)}
          >
            {g.code !== '—' && <span className="opacity-60 mr-1">{g.code}</span>}
            {g.label}
            <span className="opacity-60 ml-1">{g.share}</span>
          </button>
        ))}
      </div>

      {guide.variants.length > 1 && (
        <>
          <Label>Device</Label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {guide.variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setInput('variant', v.id)}
                className={CHIP + (v.id === variant.id ? CHIP_ACTIVE : CHIP_IDLE)}
              >
                {v.label}
              </button>
            ))}
          </div>
        </>
      )}

      <Label>Mode</Label>
      {single ? (
        <div className="mb-3 text-[11.5px] text-muted">
          {guide.id === 'no_reset' ? 'No guide — packing note only' : RESET_MODES.single.sub}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-ink/[0.05] mb-3">
          {['return', 'repair'].map((m) => (
            <button
              key={m}
              onClick={() => setInput('mode', m)}
              className={`rounded-lg px-2 py-1.5 text-left transition ${
                inputs.mode === m ? 'bg-surface shadow-sm2' : 'hover:bg-surface/60'
              }`}
            >
              <span className="block text-[12px] font-semibold text-ink">{RESET_MODES[m].label}</span>
              <span className="block text-[10px] text-muted">{RESET_MODES[m].sub}</span>
            </button>
          ))}
        </div>
      )}

      {!noCantUse && (
        <>
          <Label>Open at</Label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {OPEN_AT.map((o) => (
              <button
                key={o.id}
                onClick={() => setInput('openAt', o.id)}
                className={CHIP + (inputs.openAt === o.id ? CHIP_ACTIVE : CHIP_IDLE)}
              >
                {o.label}
              </button>
            ))}
          </div>
        </>
      )}

      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold bg-brand text-white hover:bg-brand/90 transition mb-2"
      >
        Open guide <ArrowRight size={15} strokeWidth={2.4} />
      </button>

      <div className="rounded-lg bg-ink/[0.04] px-2.5 py-2 font-mono text-[10.5px] text-ink-2 leading-relaxed">
        <div className="truncate">
          {variant.category} · “{variant.title}”
        </div>
        <div>
          → {mapped.guideId}/{mapped.variant}{' '}
          {mapsBack ? (
            <span className="text-success">✓ maps back</span>
          ) : (
            <span className="text-danger">✗ mapping mismatch</span>
          )}
        </div>
        <div>
          {mode} · {steps.length} steps · passcode: {passcodeKind ?? 'none'}
        </div>
        {lastResult && (
          <div>
            last finish: via {lastResult.via}
            {lastResult.passcodeProvided ? ' · passcode given' : ''}
          </div>
        )}
      </div>
      <p className="mt-2 text-[10.5px] text-muted leading-snug">
        The card behind is this device — Raise a claim to reach the guide through Step 3
        (change of mind / issue → Return, warranty → Repair).
      </p>

      <button
        onClick={() => {
          reset()
          setLastResult(null)
        }}
        className="mt-1 w-full flex items-center justify-center gap-1.5 text-[12px] text-muted hover:text-ink py-1.5"
      >
        <RotateCcw size={13} strokeWidth={2} />
        Reset sandbox
      </button>

      {open && (
        <ResetGuideSheet
          key={`${guide.id}-${variant.id}-${mode}-${inputs.openAt}`}
          guideId={guide.id}
          mode={mode}
          facts={{ variant: variant.id }}
          initialView={noCantUse ? 'start' : inputs.openAt}
          onDone={(result) => {
            setLastResult(result)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}

function Label({ children }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted mb-1.5">
      {children}
    </div>
  )
}
