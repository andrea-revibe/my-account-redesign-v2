import { useState } from 'react'
import {
  ShieldAlert,
  ChevronDown,
  Check,
  Lock,
  KeyRound,
  ShieldCheck,
  ExternalLink,
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

const UNLINK_STEPS = {
  ios: [
    {
      title: 'Go to iCloud.com on any browser',
      body: 'Sign in with the Apple ID linked to this device.',
    },
    {
      title: 'Open Find My, then choose All Devices',
      body: 'Pick the device you\'re returning from the list.',
    },
    {
      title: 'Tap Erase This Device, then Remove from Account',
      body: 'This switches Activation Lock off so we can wipe it.',
    },
  ],
  android: [
    {
      title: 'Go to android.com/find on any browser',
      body: 'Sign in with the Google account linked to this device.',
    },
    {
      title: 'Open Find My Device, then pick this device',
      body: 'Select the device you\'re returning from the list.',
    },
    {
      title: 'Choose Erase device, then remove the account',
      body: 'This clears Factory Reset Protection so we can wipe it.',
    },
  ],
}

const UNLINK_LINKS = {
  ios: { href: 'https://www.icloud.com/find', label: 'Open iCloud' },
  android: {
    href: 'https://www.google.com/android/find',
    label: 'Open Find My Device',
  },
}

const PASSCODE_LEN = 6

export default function Step3DevicePrep({ state, dispatch, order }) {
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
          title="I can't factory reset it"
          subtitle="Share your passcode and unlink it — we'll wipe it on pickup. Slower to process."
          slower
        >
          {dp.option === 'credentials' && (
            <UnlinkPanel
              os={os}
              onOsChange={(value) =>
                dispatch({ type: 'SET_DEVICE_PREP', value: { os: value } })
              }
              accountUnlinked={dp.accountUnlinked}
              onUnlinkChange={(value) =>
                dispatch({
                  type: 'SET_DEVICE_PREP',
                  value: { accountUnlinked: value },
                })
              }
              passcode={dp.passcode}
              onPasscodeChange={(value) =>
                dispatch({
                  type: 'SET_DEVICE_PREP',
                  value: { passcode: value },
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

function OptionCard({
  selected,
  onSelect,
  title,
  subtitle,
  recommended,
  slower,
  children,
}) {
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
            {slower && (
              <span className="inline-flex items-center rounded-full bg-warn-bg text-warn font-bold uppercase tracking-[0.06em] h-5 px-2 text-[10px]">
                Slower
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

function UnlinkPanel({
  os,
  onOsChange,
  accountUnlinked,
  onUnlinkChange,
  passcode,
  onPasscodeChange,
}) {
  const steps = UNLINK_STEPS[os]
  const link = UNLINK_LINKS[os]
  const accountLabel = os === 'ios' ? 'iCloud account' : 'Google account'

  return (
    <div className="pt-3 flex flex-col gap-3">
      <OsTabs os={os} onChange={onOsChange} />

      <div className="rounded-[12px] border border-line bg-surface overflow-hidden">
        <div className="px-3.5 py-2.5 flex items-center justify-between gap-2 bg-line-2/30 border-b border-line">
          <div className="flex items-center gap-2">
            <Lock size={13} strokeWidth={2} className="text-muted" />
            <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink">
              Remove device from your {accountLabel}
            </span>
          </div>
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-[11px] font-semibold text-brand inline-flex items-center gap-1 hover:underline"
          >
            {link.label}
            <ExternalLink size={11} strokeWidth={2} />
          </a>
        </div>
        <ol className="px-3.5 py-3 flex flex-col gap-2.5">
          {steps.map((step, i) => (
            <li key={i} className="flex gap-2.5 items-start">
              <span className="w-5 h-5 rounded-full bg-brand text-white text-[10.5px] font-bold grid place-items-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-semibold text-ink leading-snug">
                  {step.title}
                </div>
                <div className="text-[11.5px] text-muted leading-snug mt-0.5">
                  {step.body}
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <UnlinkToggle
        accountLabel={accountLabel}
        checked={accountUnlinked}
        onChange={onUnlinkChange}
      />

      <PasscodeField value={passcode} onChange={onPasscodeChange} />

      <div className="rounded-[10px] border border-line bg-line-2/40 px-3 py-2.5 text-[11.5px] leading-snug flex items-start gap-2 text-ink">
        <ShieldCheck
          size={13}
          strokeWidth={2}
          className="text-ink-2 mt-0.5 shrink-0"
        />
        <span>
          Your passcode is encrypted and used only by our technician during the
          reset. It's deleted once the device is wiped.
        </span>
      </div>
    </div>
  )
}

function UnlinkToggle({ accountLabel, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      role="checkbox"
      aria-checked={checked}
      className={`w-full rounded-[12px] border px-3.5 py-3 flex items-start gap-2.5 text-left transition ${
        checked
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
        {checked && <Check size={12} strokeWidth={2.5} />}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ink leading-snug">
          I've removed this device from my {accountLabel}
        </div>
        <div className="text-[11.5px] text-muted leading-snug mt-0.5">
          Required so our technician can complete the wipe.
        </div>
      </div>
    </button>
  )
}

function PasscodeField({ value, onChange }) {
  const handleChange = (e) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, PASSCODE_LEN)
    onChange(digits)
  }
  const complete = value.length === PASSCODE_LEN

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5">
          <KeyRound size={12} strokeWidth={2.2} className="text-muted" />
          Device passcode
        </span>
        <span
          className={`text-[10.5px] tabular-nums font-medium ${
            complete ? 'text-success' : 'text-muted'
          }`}
        >
          {value.length}/{PASSCODE_LEN}
        </span>
      </label>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={handleChange}
        placeholder="6-digit passcode"
        className={`w-full h-[46px] rounded-[10px] border bg-surface px-3.5 text-[15px] text-ink tracking-[0.4em] font-semibold focus:outline-none focus:ring-2 focus:ring-brand/20 ${
          complete ? 'border-success/50' : 'border-line focus:border-brand'
        }`}
      />
      <div className="text-[11px] text-muted leading-snug">
        Enter the passcode you set on this device. If it's 4 digits, pad with
        zeros at the end.
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
