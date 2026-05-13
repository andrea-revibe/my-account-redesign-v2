import { useState } from 'react'
import {
  ShieldAlert,
  ChevronDown,
  Check,
  Lock,
  Eye,
  EyeOff,
  Apple,
  Smartphone,
} from 'lucide-react'
import StepHeading from './StepHeading'

const RESET_STEPS = {
  ios: [
    'Open Settings → General → Transfer or Reset iPhone.',
    'Tap "Erase All Content and Settings".',
    'Sign out of your Apple ID when prompted.',
    'Confirm the erase and wait for the device to restart.',
  ],
  android: [
    'Open Settings → System → Reset options.',
    'Tap "Erase all data (factory reset)".',
    'Remove your Google account when prompted.',
    'Confirm and wait for the device to restart.',
  ],
}

export default function Step5DevicePrep({ state, dispatch, order }) {
  const dp = state.devicePrep
  const defaultOs = order?.deviceOs || 'ios'
  const os = dp.os || defaultOs

  return (
    <>
      <StepHeading
        title="Prepare your device for return"
        subtitle="Refunds are delayed significantly when this step is skipped. Pick one of the two paths below."
      />

      <div className="px-4 flex flex-col gap-3">
        <Callout>
          <span className="font-semibold text-ink">
            The device must be unlocked before we can refund you.
          </span>{' '}
          We can't access the device's data — this is so it can be reset and
          resold.
        </Callout>

        <OptionCard
          selected={dp.option === 'reset'}
          onSelect={() =>
            dispatch({
              type: 'SET_DEVICE_PREP',
              value: { option: 'reset' },
            })
          }
          title="I've factory reset the device"
          subtitle="Recommended — fastest to process."
          recommended
        >
          {dp.option === 'reset' && (
            <ResetPanel
              os={os}
              onOsChange={(value) =>
                dispatch({ type: 'SET_DEVICE_PREP', value: { os: value } })
              }
              confirmed={dp.resetConfirmed}
              onConfirmChange={(value) =>
                dispatch({
                  type: 'SET_DEVICE_PREP',
                  value: { resetConfirmed: value },
                })
              }
            />
          )}
        </OptionCard>

        <OptionCard
          selected={dp.option === 'credentials'}
          onSelect={() =>
            dispatch({
              type: 'SET_DEVICE_PREP',
              value: { option: 'credentials' },
            })
          }
          title="Provide unlock credentials"
          subtitle="We'll reset the device on your behalf."
        >
          {dp.option === 'credentials' && (
            <CredentialsPanel
              os={os}
              onOsChange={(value) =>
                dispatch({ type: 'SET_DEVICE_PREP', value: { os: value } })
              }
              email={dp.email}
              onEmailChange={(value) =>
                dispatch({ type: 'SET_DEVICE_PREP', value: { email: value } })
              }
              password={dp.password}
              onPasswordChange={(value) =>
                dispatch({
                  type: 'SET_DEVICE_PREP',
                  value: { password: value },
                })
              }
            />
          )}
        </OptionCard>

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
    <div className="flex items-start gap-2.5 rounded-[12px] border border-warn-bg bg-warn-bg/70 px-3.5 py-3 text-[12.5px] text-ink leading-[1.45]">
      <ShieldAlert
        size={16}
        strokeWidth={1.75}
        className="text-warn shrink-0 mt-px"
      />
      <span>{children}</span>
    </div>
  )
}

function OptionCard({ selected, onSelect, title, subtitle, recommended, children }) {
  return (
    <div
      className={`rounded-[14px] border-2 transition-colors ${
        selected
          ? 'border-brand bg-brand-bg/30'
          : 'border-line bg-surface'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="w-full text-left px-3.5 py-3 flex items-start gap-3"
      >
        <span
          aria-hidden
          className={`mt-0.5 w-[18px] h-[18px] rounded-full border-2 grid place-items-center shrink-0 ${
            selected ? 'border-brand' : 'border-line'
          }`}
        >
          {selected && <span className="w-2 h-2 rounded-full bg-brand" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-[14.5px] font-semibold text-ink">
              {title}
            </span>
            {recommended && (
              <span className="inline-flex items-center rounded-full bg-success-bg text-success font-bold uppercase tracking-[0.06em] h-5 px-2 text-[10px]">
                Recommended
              </span>
            )}
          </span>
          <span className="block mt-0.5 text-[12px] text-muted">
            {subtitle}
          </span>
        </span>
      </button>
      {children && (
        <div className="px-3.5 pb-3.5 pt-1 border-t border-line/60 animate-slideDown">
          {children}
        </div>
      )}
    </div>
  )
}

function ResetPanel({ os, onOsChange, confirmed, onConfirmChange }) {
  const [open, setOpen] = useState(true)
  const steps = RESET_STEPS[os]
  return (
    <div className="pt-3 flex flex-col gap-3">
      <OsTabs os={os} onChange={onOsChange} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center justify-between text-[12.5px] font-semibold text-ink-2 py-1"
      >
        <span>How to factory reset</span>
        <ChevronDown
          size={14}
          strokeWidth={1.75}
          className="transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>
      {open && (
        <ol className="flex flex-col gap-2 pl-1 animate-slideDown">
          {steps.map((step, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 text-[12.5px] text-ink-2 leading-[1.45]"
            >
              <span className="w-5 h-5 rounded-full bg-brand-bg text-brand grid place-items-center shrink-0 text-[11px] font-bold tabular-nums mt-px">
                {i + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}
      <label className="flex items-start gap-2.5 cursor-pointer pt-1">
        <span className="relative mt-px shrink-0">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => onConfirmChange(e.target.checked)}
            className="peer sr-only"
          />
          <span
            className={`w-[18px] h-[18px] rounded-[5px] border-2 grid place-items-center transition-colors ${
              confirmed ? 'bg-brand border-brand' : 'border-line bg-surface'
            }`}
          >
            {confirmed && (
              <Check size={12} strokeWidth={3} className="text-white" />
            )}
          </span>
        </span>
        <span className="text-[13px] text-ink leading-[1.4]">
          I confirm this device has been factory reset.
        </span>
      </label>
    </div>
  )
}

function CredentialsPanel({
  os,
  onOsChange,
  email,
  onEmailChange,
  password,
  onPasswordChange,
}) {
  const [show, setShow] = useState(false)
  const emailLabel = os === 'ios' ? 'Apple ID' : 'Google account email'
  const passwordLabel = os === 'ios' ? 'Apple ID password' : 'Google account password'

  return (
    <div className="pt-3 flex flex-col gap-3">
      <OsTabs os={os} onChange={onOsChange} />
      <Field label={emailLabel}>
        <input
          type="email"
          inputMode="email"
          autoComplete="off"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder={
            os === 'ios' ? 'name@icloud.com' : 'name@gmail.com'
          }
          className="w-full h-[44px] rounded-[10px] border border-line bg-surface px-3 text-[14px] text-ink placeholder:text-muted outline-none focus:border-brand"
        />
      </Field>
      <Field label={passwordLabel}>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            autoComplete="off"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            placeholder="••••••••"
            className="w-full h-[44px] rounded-[10px] border border-line bg-surface pl-3 pr-10 text-[14px] text-ink placeholder:text-muted outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center text-muted hover:text-ink"
          >
            {show ? (
              <EyeOff size={16} strokeWidth={1.75} />
            ) : (
              <Eye size={16} strokeWidth={1.75} />
            )}
          </button>
        </div>
      </Field>
      <div className="flex items-start gap-2 text-[11.5px] text-muted leading-[1.45]">
        <Lock size={12} strokeWidth={1.75} className="shrink-0 mt-px" />
        <span>
          Credentials are encrypted in transit, used only to process your
          return, and deleted after processing.
        </span>
      </div>
    </div>
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

function Field({ label, children }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[11.5px] font-semibold text-ink-2 uppercase tracking-[0.04em]">
        {label}
      </span>
      {children}
    </label>
  )
}
