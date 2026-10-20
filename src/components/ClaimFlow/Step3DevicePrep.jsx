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
  Package,
} from 'lucide-react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'
import ResetGuideSheet from './ResetGuideSheet'
import DevicePicker from './DevicePicker'
import { DEVICE_OPTIONS, deviceOsForOrder, resetGuideForOrder } from '../../lib/devices'
import { guideById, modeForClaimType, stepsFor } from '../../lib/resetGuides'

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
  // Guide + variant are seeded in the reducer from the order line
  // (resetGuideForOrder); mode follows the claim type (warranty → repair).
  // A product category that spans several guides asks the customer which
  // device it is (`needsChooser`); the title only pre-selects an answer, and
  // with no guess guideId stays null until they pick. `os` only drives the
  // backup reassurance copy.
  const resolved = resetGuideForOrder(order)
  const guideId = dp.guideId
  const variant = dp.variant
  const picked = !!guideId
  const guide = guideById(guideId)
  const mode = modeForClaimType(state.claimType) ?? 'return'
  const isRepair = mode === 'repair'
  const os = guideId === 'android' ? 'android' : guideId === 'apple_mobile' || guideId === 'mac' ? 'ios' : deviceOsForOrder(order)
  const stepCount = picked ? stepsFor(guide, mode, { variant }).length : null

  // Switching device invalidates any reset already run on the other guide,
  // so re-gate the confirm checkbox.
  const [pickError, setPickError] = useState(false)
  const setDevice = (id) => {
    if (id === dp.device) return
    const o = DEVICE_OPTIONS[id]
    setPickError(false)
    dispatch({
      type: 'SET_DEVICE_PREP',
      value: { device: id, guideId: o.guideId, variant: o.variant, resetGuideSeen: false, resetConfirmed: false, passcodeProvided: false, dataChoice: null },
    })
  }
  const picker = resolved.needsChooser && (
    <DevicePicker
      category={resolved.category}
      value={dp.device}
      guess={resolved.device}
      onChange={setDevice}
      error={!picked && (pickError || error === 'devicePick' || error === 'resetGuide')}
    />
  )

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

  if (guideId === 'no_reset') {
    return (
      <>
        <StepHeading
          title={isRepair ? 'Prepare your item for repair' : 'Prepare your item for return'}
          subtitle="This item has no account lock, so there's nothing to reset."
        />
        <div className="px-4 flex flex-col gap-3">
          {picker}
          <NoResetCard />
        </div>
      </>
    )
  }

  return (
    <>
      <StepHeading
        title={isRepair ? 'Prepare your device for repair' : 'Prepare your device for return'}
        subtitle={
          isRepair
            ? 'Repairs are delayed when the device is locked. The guide turns the locks off, lets you keep or protect your data, and you never share an account password.'
            : "Returns are delayed when this step is skipped. The guided reset walks you through it — even if the device is broken or you can't unlock it."
        }
      />

      <div className="px-4 flex flex-col gap-3">
        <Callout isRepair={isRepair} />

        {picker}

        <HeroLauncher
          isRepair={isRepair}
          guideSeen={guideSeen}
          showError={showGuideError}
          stepCount={stepCount}
          dimmed={neverSetUp}
          onOpen={() => (picked ? setGuideOpen(true) : setPickError(true))}
        />

        <ResetOffRamps
          os={os}
          open={skipOpen}
          onToggle={() => setSkipOpen((v) => !v)}
          offerNeverSetUp={offerNeverSetUp}
          neverSetUp={neverSetUp}
          onCheck={setNeverSetUp}
        />

        {!neverSetUp && !isRepair && <SafetyNote os={os} />}

        {guideOpen && (
          <ResetGuideSheet
            guideId={guideId}
            mode={mode}
            facts={{ variant }}
            onDone={({ via, passcodeProvided, dataChoice }) => {
              dispatch({
                type: 'SET_DEVICE_PREP',
                value: {
                  resetGuideSeen: true,
                  mode,
                  guideVia: via,
                  passcodeProvided,
                  dataChoice,
                },
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
            isRepair={isRepair}
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
function Callout({ isRepair }) {
  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-warn-bg bg-warn-bg/70 px-3.5 py-3">
      <span
        className="w-7 h-7 rounded-full grid place-items-center shrink-0 mt-px text-warn"
        style={{ background: 'rgb(196 105 0 / 0.14)' }}
      >
        <ShieldAlert size={16} strokeWidth={2} />
      </span>
      <p className="text-[12.5px] text-ink leading-[1.45]">
        {isRepair ? (
          <>
            <span className="font-semibold text-ink">
              Turn the locks off before pickup.
            </span>{' '}
            A locked device can't be tested, so the repair waits until it's
            unlocked.
          </>
        ) : (
          <>
            <span className="font-semibold text-ink">
              Reset the device before we can refund you.
            </span>{' '}
            If it reaches us still locked, your refund may be delayed and a fee
            deducted.
          </>
        )}
      </p>
    </div>
  )
}

// The one prominent action on the step: an elevated hero launcher with a
// gradient icon coin, decorative ring texture, and meta chips. Turns green
// once completed, red (and shakes) if Continue is pressed before it's run.
function HeroLauncher({ isRepair, guideSeen, showError, stepCount = 3, dimmed = false, onOpen }) {
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
            {tone === 'done'
              ? isRepair
                ? 'Repair prep completed'
                : 'Guided reset completed'
              : isRepair
                ? 'Start the repair prep guide'
                : 'Start the guided reset'}
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
                {stepCount == null ? 'A few simple steps' : `${stepCount} simple ${stepCount === 1 ? 'step' : 'steps'}`}
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
        <span>Can't run the guide?</span>
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
              Start the guide and tap “I can't use my device” — it covers a
              forgotten passcode, a broken screen, and a device that won't
              turn on.
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
  isRepair,
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
          {isRepair
            ? "I confirm I've completed the guide — the account lock and screen lock are off."
            : "I confirm I've completed the guided reset — this device is unlinked and erased."}
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

// Items with no account lock (accessories, non-Apple watches, controllers…):
// nothing to run, so the step is just a packing note and is always satisfied.
function NoResetCard() {
  return (
    <div className="flex items-start gap-3 rounded-[14px] border border-line bg-line-2/40 px-3.5 py-3.5">
      <span className="w-9 h-9 rounded-full grid place-items-center shrink-0 bg-success-bg text-success">
        <Package size={18} strokeWidth={2} />
      </span>
      <p className="text-[12.5px] text-ink-2 leading-[1.5]">
        <span className="font-semibold text-ink">No reset needed.</span>{' '}
        Remove your own items, and pack everything that came in the box.
      </p>
    </div>
  )
}
