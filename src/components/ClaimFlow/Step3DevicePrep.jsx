import { useEffect, useRef, useState } from 'react'
import {
  ShieldAlert,
  Check,
  Apple,
  Smartphone,
  AlertTriangle,
  Sparkles,
  WifiOff,
} from 'lucide-react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'
import ResetGuideSheet from './ResetGuideSheet'

// Step 3 — a single, mandatory path: run the guided reset, then confirm it.
// The guide itself branches (reset on-device vs erase remotely from
// iCloud / Google), so it now covers the customer who can't physically
// unlock or power on the device — there's no separate passcode-handover
// option anymore. The confirm checkbox is the gate; it stays locked until
// the guide has been opened and finished.
export default function Step3DevicePrep({ state, dispatch, order, error }) {
  const dp = state.devicePrep
  const defaultOs = order?.deviceOs || 'ios'
  const os = dp.os || defaultOs

  const [guideOpen, setGuideOpen] = useState(false)
  const guideSeen = dp.resetGuideSeen
  const confirmed = dp.resetConfirmed
  const confirmLocked = !guideSeen

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

  const setOs = (value) =>
    dispatch({ type: 'SET_DEVICE_PREP', value: { os: value } })

  return (
    <>
      <StepHeading
        title="Prepare your device for return"
        subtitle="Returns are delayed when this step is skipped. The guided reset walks you through it — even if the device is broken or you can't unlock it."
      />

      <div className="px-4 flex flex-col gap-3">
        <Callout>
          <span className="font-semibold text-ink">
            Unlock the device before we can refund you.
          </span>{' '}
          We can't access its data — this lets it be reset and resold.
        </Callout>

        <OsTabs os={os} onChange={setOs} />

        <GuideLauncher
          guideSeen={guideSeen}
          showError={showGuideError}
          onOpen={() => setGuideOpen(true)}
        />

        <div className="flex items-start gap-2 px-1 text-[11.5px] text-muted leading-[1.45]">
          <WifiOff size={13} strokeWidth={2} className="text-muted shrink-0 mt-0.5" />
          <span>
            Can't unlock or power on the device? The guide has a remote path —
            you'll erase it from{' '}
            {os === 'ios' ? 'iCloud' : 'your Google account'} instead.
          </span>
        </div>

        {guideOpen && (
          <ResetGuideSheet
            os={os}
            checks={dp.resetGuideChecks || {}}
            onToggle={(id, checked) =>
              dispatch({
                type: 'SET_DEVICE_PREP',
                value: {
                  resetGuideChecks: {
                    ...(dp.resetGuideChecks || {}),
                    [id]: checked,
                  },
                },
              })
            }
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

        <label
          ref={confirmRef}
          className={`flex items-start gap-2.5 pt-1 ${
            confirmLocked ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'
          }`}
        >
          <span className="relative mt-px shrink-0">
            <input
              type="checkbox"
              checked={confirmed}
              disabled={confirmLocked}
              onChange={(e) =>
                dispatch({
                  type: 'SET_DEVICE_PREP',
                  value: { resetConfirmed: e.target.checked },
                })
              }
              className="peer sr-only"
            />
            <span
              className={`w-[20px] h-[20px] rounded-[6px] border-2 grid place-items-center transition-colors ${
                confirmed
                  ? 'bg-brand border-brand'
                  : confirmError
                    ? 'border-danger bg-surface'
                    : 'border-line bg-surface'
              }`}
            >
              {confirmed && (
                <Check size={13} strokeWidth={3} className="text-white" />
              )}
            </span>
          </span>
          <span className="text-[13px] text-ink leading-[1.4]">
            I confirm I've completed the guided reset — this device is unlinked
            and erased.
          </span>
        </label>
        {confirmError && (
          <InlineError className="-mt-1.5 ml-[30px]">
            Confirm you've completed the reset before continuing.
          </InlineError>
        )}
        {confirmLocked && (
          <p
            className={`-mt-1.5 ml-[30px] flex items-start gap-1.5 text-[11.5px] leading-snug ${
              showGuideError
                ? 'font-medium text-danger animate-slideDown'
                : 'text-muted'
            }`}
          >
            {showGuideError && (
              <AlertTriangle
                size={13}
                strokeWidth={2.2}
                className="shrink-0 mt-px"
              />
            )}
            <span>
              Run the guide above and tap{' '}
              <span
                className={
                  showGuideError ? 'font-semibold' : 'font-semibold text-ink-2'
                }
              >
                Done
              </span>{' '}
              to confirm.
            </span>
          </p>
        )}

        <div className="mt-1 text-[11.5px] text-muted leading-[1.45]">
          If you leave this flow, you'll need to start over — your inputs
          aren't saved.
        </div>
      </div>
    </>
  )
}

function Callout({ children }) {
  return (
    <div className="flex items-start gap-2.5 rounded-[14px] border border-warn-bg bg-warn-bg/70 px-3.5 py-3 text-[12.5px] text-ink leading-[1.45]">
      <ShieldAlert
        size={17}
        strokeWidth={1.9}
        className="text-warn shrink-0 mt-px"
      />
      <span>{children}</span>
    </div>
  )
}

// The one prominent action on the step: launch the guided reset. Turns
// green once completed, red if Continue is pressed before it's run.
function GuideLauncher({ guideSeen, showError, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`relative overflow-hidden rounded-[16px] border-2 px-4 py-4 text-left transition-colors ${
        showError
          ? 'border-danger bg-danger-bg/60'
          : guideSeen
            ? 'border-success/40 bg-success-bg/50'
            : 'border-brand bg-brand-bg/60 hover:bg-brand-bg/80'
      }`}
    >
      <span className="relative flex items-center gap-3.5">
        <span
          className={`w-12 h-12 rounded-full grid place-items-center shrink-0 ${
            guideSeen
              ? 'bg-success text-white'
              : showError
                ? 'bg-danger text-white'
                : 'bg-brand text-white'
          }`}
        >
          {guideSeen ? (
            <Check size={22} strokeWidth={2} />
          ) : (
            <Sparkles size={22} strokeWidth={1.9} />
          )}
        </span>
        <span className="min-w-0">
          <span className="block text-[15.5px] font-semibold text-ink leading-snug">
            {guideSeen ? 'Guided reset completed' : 'Start the guided reset'}
          </span>
          <span className="block mt-0.5 text-[12.5px] text-muted">
            {guideSeen
              ? 'Tap to run through it again'
              : 'One step at a time · about 10 min'}
          </span>
        </span>
      </span>
    </button>
  )
}

function OsTabs({ os, onChange }) {
  const opts = [
    { id: 'ios', label: 'iPhone', Icon: Apple },
    { id: 'android', label: 'Android', Icon: Smartphone },
  ]
  return (
    <div className="inline-flex p-1 rounded-[10px] bg-line-2/70 self-start">
      {opts.map(({ id, label, Icon }) => {
        const active = os === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12.5px] font-semibold transition-colors ${
              active
                ? 'bg-surface text-ink shadow-sm2'
                : 'text-muted hover:text-ink-2'
            }`}
          >
            <Icon size={13} strokeWidth={1.75} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
