import { useEffect, useRef, useState } from 'react'
import {
  ShieldAlert,
  ShieldCheck,
  Check,
  AlertTriangle,
  Sparkles,
  WifiOff,
  Clock,
  RotateCcw,
  ArrowRight,
  Lock,
  ChevronDown,
  HelpCircle,
} from 'lucide-react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'
import ResetGuideSheet from './ResetGuideSheet'
import {
  deviceOsForOrder,
  deviceTypeForOrder,
  isOsAmbiguous,
} from '../../lib/devices'

// Step 3 — a single, mandatory path: run the guided reset, then confirm it.
// The guide itself branches (reset on-device vs erase remotely from
// iCloud / Google), so it now covers the customer who can't physically
// unlock or power on the device — there's no separate passcode-handover
// option anymore. The confirm checkbox is the gate; it stays locked until
// the guide has been opened and finished.
//
// Visual direction: "Refined card" — an elevated hero launcher (gradient
// icon coin, decorative ring texture, meta chips, a tap affordance), a
// data-safety reassurance line near the launcher (the screen's emotional
// crux — "am I about to lose my photos?"), and a confirm gate that reads as
// the clear final action.
export default function Step3DevicePrep({ state, dispatch, order, error }) {
  const dp = state.devicePrep
  // The guide platform is driven by the order's category (seeded in the
  // reducer from category_name). The only manual input is for the OS-ambiguous
  // `Tablet` category — `ambiguous` gates the iPad/Android chooser below. The
  // fallbacks are defensive should dp.os / dp.device ever be unset. `os`
  // (ios|android) drives the iCloud-vs-Google copy; `device`
  // (iphone|ipad|mac|android) selects which walkthrough the guide shows.
  const ambiguous = isOsAmbiguous(order)
  const os = dp.os || deviceOsForOrder(order)
  const device = dp.device || deviceTypeForOrder(order)
  const stepCount = os === 'android' ? 4 : 3

  // Switching tablet OS invalidates any reset already run on the other guide,
  // so re-gate the confirm checkbox. The Android pick resolves to the dedicated
  // `android_tablet` guide (tablet-shaped frames + tablet copy), kept distinct
  // from the `android` Samsung-phone guide.
  const setTabletOs = (pick) => {
    const nextDevice = pick === 'android' ? 'android_tablet' : 'ipad'
    if (nextDevice === device) return
    dispatch({
      type: 'SET_DEVICE_PREP',
      value: {
        device: nextDevice,
        os: pick === 'android' ? 'android' : 'ios',
        resetGuideSeen: false,
        resetConfirmed: false,
      },
    })
  }

  const [guideOpen, setGuideOpen] = useState(false)
  const guideSeen = dp.resetGuideSeen
  const confirmed = dp.resetConfirmed
  const confirmLocked = !guideSeen

  // Change-of-mind escape hatch: a device that was never set up has no
  // account linked and nothing to erase. The customer can attest to that
  // instead of running the guided reset — when they do, the reset becomes
  // optional (launcher dims, the reset confirm gate is replaced by the
  // attestation). Only offered on the change_of_mind flow.
  const offerNeverSetUp = state.claimType === 'change_of_mind'
  const neverSetUp = dp.neverSetUp
  const [skipOpen, setSkipOpen] = useState(false)
  const setNeverSetUp = (value) =>
    dispatch({ type: 'SET_DEVICE_PREP', value: { neverSetUp: value } })

  // Premature Continue before completing the guide — escalates the guide
  // launcher + gate message into a red error state.
  const showGuideError = error === 'resetGuide'
  // Guide done but the confirm checkbox is still unticked.
  const confirmError = error === 'resetConfirm'

  const confirmRef = useRef(null)
  useEffect(() => {
    if (confirmError && confirmRef.current) {
      confirmRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [confirmError])

  return (
    <>
      <StepHeading
        title="Prepare your device for return"
        subtitle="Returns are delayed when this step is skipped. The guided reset walks you through it — even if the device is broken or you can't unlock it."
      />

      <div className="px-4 flex flex-col gap-3">
        <Callout />

        {ambiguous && (
          <TabletPicker
            value={device === 'android_tablet' ? 'android' : 'ipad'}
            onChange={setTabletOs}
          />
        )}

        <HeroLauncher
          guideSeen={guideSeen}
          showError={showGuideError}
          stepCount={stepCount}
          dimmed={neverSetUp}
          onOpen={() => setGuideOpen(true)}
        />

        <ResetOffRamps
          os={os}
          open={skipOpen}
          onToggle={() => setSkipOpen((v) => !v)}
          offerNeverSetUp={offerNeverSetUp}
          neverSetUp={neverSetUp}
          onCheck={setNeverSetUp}
        />

        {!neverSetUp && <SafetyNote os={os} />}

        {guideOpen && (
          <ResetGuideSheet
            device={device}
            onDone={() => {
              dispatch({
                type: 'SET_DEVICE_PREP',
                value: { resetGuideSeen: true },
              })
              setGuideOpen(false)
            }}
            onClose={() => setGuideOpen(false)}
          />
        )}

        {!neverSetUp && (
          <ConfirmGate
            ref={confirmRef}
            confirmed={confirmed}
            setConfirmed={(checked) =>
              dispatch({
                type: 'SET_DEVICE_PREP',
                value: { resetConfirmed: checked },
              })
            }
            locked={confirmLocked}
            confirmError={confirmError}
            showGuideError={showGuideError}
          />
        )}

        <div className="mt-1 text-[11.5px] text-muted leading-[1.45]">
          If you leave this flow, you'll need to start over — your inputs
          aren't saved.
        </div>
      </div>
    </>
  )
}

// Shown only for the OS-ambiguous `Tablet` category: a two-option segmented
// control that resolves the guide to the iPad or the Samsung/Android
// walkthrough. Preselected to iPad in the reducer.
function TabletPicker({ value, onChange }) {
  const opts = [
    { id: 'ipad', label: 'Apple' },
    { id: 'android', label: 'Android' },
  ]
  return (
    <div>
      <div className="mb-1.5 px-0.5 text-[12.5px] font-semibold text-ink">
        What kind of tablet is this?
      </div>
      <div className="grid grid-cols-2 gap-2">
        {opts.map((o) => {
          const active = value === o.id
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className={`rounded-[12px] border-[1.5px] px-3 py-2.5 text-left transition-colors ${
                active
                  ? 'border-brand bg-brand-bg/50'
                  : 'border-line bg-surface hover:border-brand/40'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={`w-[15px] h-[15px] rounded-full border-2 grid place-items-center shrink-0 ${
                    active ? 'border-brand' : 'border-line'
                  }`}
                >
                  {active && (
                    <span className="w-[7px] h-[7px] rounded-full bg-brand" />
                  )}
                </span>
                <span className="text-[13px] font-semibold text-ink">
                  {o.label}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Callout() {
  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-warn-bg bg-warn-bg/70 px-3.5 py-3">
      <span
        className="w-7 h-7 rounded-full grid place-items-center shrink-0 mt-px text-warn"
        style={{ background: 'rgb(196 105 0 / 0.14)' }}
      >
        <ShieldAlert size={16} strokeWidth={2} />
      </span>
      <p className="text-[12.5px] text-ink leading-[1.45]">
        <span className="font-semibold text-ink">
          Reset the device before we can refund you.
        </span>{' '}
        If it reaches us still locked, your refund may be delayed and a fee
        deducted.
      </p>
    </div>
  )
}

// The one prominent action on the step: an elevated hero launcher with a
// gradient icon coin, decorative ring texture, and meta chips. Turns green
// once completed, red (and shakes) if Continue is pressed before it's run.
function HeroLauncher({ guideSeen, showError, stepCount = 3, dimmed = false, onOpen }) {
  const tone = showError ? 'error' : guideSeen ? 'done' : 'default'
  const surface =
    tone === 'error'
      ? {
          background: 'linear-gradient(165deg,#fff,rgb(253,232,235))',
          borderColor: 'rgb(200,36,58)',
        }
      : tone === 'done'
        ? {
            background: 'linear-gradient(165deg,#fff,rgb(230,246,240))',
            borderColor: 'rgb(0 150 106 / 0.4)',
          }
        : {
            background:
              'linear-gradient(165deg,#fff 12%,rgb(243,237,251) 130%)',
            borderColor: 'rgb(80 25 160 / 0.28)',
            boxShadow:
              '0 16px 40px -16px rgba(80,25,160,0.28), 0 2px 6px rgba(20,12,40,0.05)',
          }
  const coin =
    tone === 'error'
      ? { background: 'linear-gradient(150deg,#e0566d,rgb(200,36,58))' }
      : tone === 'done'
        ? { background: 'linear-gradient(150deg,#2bbd92,rgb(0,150,106))' }
        : {
            background:
              'linear-gradient(150deg,rgb(122,61,211),rgb(80,25,160))',
          }

  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative w-full overflow-hidden rounded-[18px] border-[1.5px] px-4 py-4 text-left transition-all ${
        showError ? 'animate-shakeX' : ''
      } ${dimmed ? 'opacity-55 grayscale-[0.35]' : ''}`}
      style={surface}
    >
      {/* decorative concentric rings, brand-tinted texture */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-12 w-40 h-40 rounded-full"
        style={{
          background:
            'radial-gradient(circle, rgb(80 25 160 / 0.06) 0%, transparent 62%)',
          border: '1px solid rgb(80 25 160 / 0.06)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-2 top-2 w-24 h-24 rounded-full border"
        style={{ borderColor: 'rgb(80 25 160 / 0.05)' }}
      />

      <div className="relative flex items-center gap-3.5">
        <span
          className="relative w-[52px] h-[52px] rounded-full grid place-items-center shrink-0 text-white shadow-md2"
          style={coin}
        >
          <span
            aria-hidden
            className="absolute inset-[3px] rounded-full"
            style={{ boxShadow: 'inset 0 1px 1px rgb(255 255 255 / 0.45)' }}
          />
          {tone === 'done' ? (
            <Check size={24} strokeWidth={2.4} />
          ) : tone === 'error' ? (
            <AlertTriangle size={22} strokeWidth={2} />
          ) : (
            <Sparkles size={23} strokeWidth={1.9} />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[15.5px] font-bold text-ink leading-snug tracking-[-0.01em]">
            {tone === 'done' ? 'Guided reset completed' : 'Start the guided reset'}
          </span>
          {tone === 'done' ? (
            <span className="mt-0.5 inline-flex items-center gap-1 text-[12.5px] font-medium text-success">
              <RotateCcw size={12} strokeWidth={2.2} /> Tap to run through it again
            </span>
          ) : (
            <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface/80 border border-line px-2 h-[22px] text-[11px] font-semibold text-ink-2">
                <Clock size={11} strokeWidth={2.2} /> ~10 min
              </span>
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-surface/80 border border-line px-2 h-[22px] text-[11px] font-semibold text-ink-2">
                {stepCount} simple steps
              </span>
            </span>
          )}
        </span>

        <span
          className={`w-8 h-8 rounded-full grid place-items-center shrink-0 ${
            tone === 'done'
              ? 'text-success'
              : tone === 'error'
                ? 'text-danger'
                : 'text-brand'
          }`}
          style={{
            background:
              tone === 'done'
                ? 'rgb(0 150 106 / 0.12)'
                : tone === 'error'
                  ? 'rgb(200 36 58 / 0.12)'
                  : 'rgb(80 25 160 / 0.1)',
          }}
        >
          {tone === 'done' ? (
            <Check size={16} strokeWidth={2.6} />
          ) : (
            <ArrowRight size={16} strokeWidth={2.4} />
          )}
        </span>
      </div>
    </button>
  )
}

// Data-safety reassurance — the screen's emotional crux ("am I about to lose
// my photos?"). One quiet, warm line that lifts completion more than any
// visual polish.
function SafetyNote({ os }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[12px] border border-line bg-line-2/40 px-3 py-2.5">
      <span
        className="w-6 h-6 rounded-full grid place-items-center shrink-0 mt-px text-success"
        style={{ background: 'rgb(230,246,240)' }}
      >
        <ShieldCheck size={14} strokeWidth={2} />
      </span>
      <p className="text-[12px] text-ink-2 leading-[1.45]">
        <span className="font-semibold text-ink">Worried about your photos?</span>{' '}
        The reset only erases the copy on this device — your{' '}
        {os === 'ios' ? 'iCloud' : 'Google'} backup stays safe.
      </p>
    </div>
  )
}

// Single quiet "Can't run the guided reset?" disclosure that folds away the
// two off-ramps from the normal on-device reset, replacing two always-on text
// blocks with one collapsed link:
//   • Remote erase — broken / locked / won't power on (all flows). Purely
//     informational: the route is actually picked inside the guide's intro.
//   • Never set up (change_of_mind only) — an attestation checkbox that skips
//     the reset; ticking it dims the launcher and replaces the reset confirm
//     gate with this attestation (see Step3DevicePrep render).
// Stays force-expanded while the skip is checked so the attestation is visible.
function ResetOffRamps({ os, open, onToggle, offerNeverSetUp, neverSetUp, onCheck }) {
  const expanded = open || neverSetUp
  return (
    <div className="pt-0.5">
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-2 rounded-[12px] border px-3.5 py-3 text-[13px] font-semibold transition-colors ${
          expanded
            ? 'border-brand/40 bg-brand-bg/30 text-ink'
            : 'border-line bg-surface text-ink hover:border-brand/40'
        }`}
      >
        <HelpCircle size={16} strokeWidth={2.2} className="shrink-0 text-brand" />
        <span>Can't run the guided reset?</span>
        <ChevronDown
          size={16}
          strokeWidth={2.2}
          className={`ml-auto shrink-0 text-muted transition-transform ${
            expanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {expanded && (
        <div className="mt-2 flex flex-col gap-2 animate-slideDown">
          {offerNeverSetUp && (
            <label
              className={`flex items-start gap-2.5 rounded-[12px] border px-3 py-2.5 cursor-pointer transition-colors ${
                neverSetUp
                  ? 'border-brand/40 bg-brand-bg/40'
                  : 'border-line bg-surface hover:border-brand/40'
              }`}
            >
              <span className="relative mt-px shrink-0">
                <input
                  type="checkbox"
                  checked={neverSetUp}
                  onChange={(e) => onCheck(e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  className={`w-[20px] h-[20px] rounded-[6px] border-2 grid place-items-center transition-colors ${
                    neverSetUp ? 'bg-brand border-brand' : 'border-line bg-surface'
                  }`}
                >
                  {neverSetUp && (
                    <Check size={13} strokeWidth={3} className="text-white" />
                  )}
                </span>
              </span>
              <span className="text-[12px] text-ink-2 leading-[1.45]">
                <span className="font-semibold text-ink">
                  Never set up this device?
                </span>{' '}
                No account is linked, so there's nothing to erase — skip the
                guided reset.
              </span>
            </label>
          )}

          <div className="flex items-start gap-2.5 rounded-[12px] border border-line bg-line-2/40 px-3 py-2.5">
            <WifiOff size={14} strokeWidth={2} className="shrink-0 mt-0.5 text-muted" />
            <p className="text-[12px] text-ink-2 leading-[1.45]">
              <span className="font-semibold text-ink">
                Broken, or can't unlock it?
              </span>{' '}
              Start the guide and choose “No” — you'll erase it remotely from{' '}
              {os === 'ios' ? 'iCloud' : 'your Google account'} instead.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// The confirm gate, restyled as a bordered card whose border / fill track
// locked → error → checked → default. The clear final action of the step.
function ConfirmGate({
  ref,
  confirmed,
  setConfirmed,
  locked,
  confirmError,
  showGuideError,
}) {
  return (
    <div ref={ref} className="pt-1">
      <label
        className={`flex items-start gap-2.5 rounded-[14px] border px-3.5 py-3 transition-colors ${
          locked
            ? 'cursor-not-allowed border-line bg-line-2/30'
            : confirmError
              ? 'cursor-pointer border-danger bg-danger-bg/40'
              : confirmed
                ? 'cursor-pointer border-brand/40 bg-brand-bg/40'
                : 'cursor-pointer border-line bg-surface hover:border-brand/40'
        }`}
      >
        <span className="relative mt-px shrink-0">
          <input
            type="checkbox"
            checked={confirmed}
            disabled={locked}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="peer sr-only"
          />
          <span
            className={`w-[20px] h-[20px] rounded-[6px] border-2 grid place-items-center transition-colors ${
              confirmed
                ? 'bg-brand border-brand'
                : confirmError
                  ? 'border-danger bg-surface'
                  : locked
                    ? 'border-line bg-line-2/40'
                    : 'border-line bg-surface'
            }`}
          >
            {confirmed ? (
              <Check size={13} strokeWidth={3} className="text-white" />
            ) : locked ? (
              <Lock size={11} strokeWidth={2.4} className="text-muted" />
            ) : null}
          </span>
        </span>
        <span
          className={`text-[13px] leading-[1.4] ${
            locked ? 'text-muted' : 'text-ink'
          }`}
        >
          I confirm I've completed the guided reset — this device is unlinked
          and erased.
        </span>
      </label>

      {confirmError && (
        <InlineError className="mt-1.5 ml-1">
          Confirm you've completed the reset before continuing.
        </InlineError>
      )}
      {locked && showGuideError && (
        <p className="mt-1.5 ml-1 flex items-start gap-1.5 text-[11.5px] leading-snug font-medium text-danger animate-slideDown">
          <AlertTriangle size={13} strokeWidth={2.2} className="shrink-0 mt-px" />
          <span>
            Run the guide above and tap{' '}
            <span className="font-semibold">Done</span> to confirm.
          </span>
        </p>
      )}
    </div>
  )
}

