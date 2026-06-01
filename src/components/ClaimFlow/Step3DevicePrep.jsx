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
  BadgeCheck,
  AlertTriangle,
  Sparkles,
} from 'lucide-react'
import StepHeading from './StepHeading'
import ResetGuideSheet from './ResetGuideSheet'

const RESET_GUIDE = {
  ios: [
    {
      title: 'Back up your device',
      body: "If you want to keep anything on this device, back it up to iCloud or your computer before continuing — the next steps will erase everything.",
    },
    {
      title: 'Sign out of iCloud and turn off Find My',
      lead: 'This is the single most important step in this entire guide.',
      body: 'Doing this before the reset is what prevents Activation Lock from blocking the device after the wipe.',
      subActions: [
        'Open **Settings**',
        'Tap your name at the very top',
        'Scroll all the way to the bottom and tap **Sign Out**',
        'Enter your Apple ID password when prompted (this is what disables Find My and removes Activation Lock)',
        "Choose whether to keep a copy of your data on the device (it'll be erased in the next step anyway, so it doesn't matter much)",
        'Confirm **Sign Out**',
      ],
      tip: 'You should now see "Sign in to your iPhone/iPad" at the top of Settings. That confirms iCloud is disconnected.',
    },
    {
      title: 'Erase all content and settings',
      subActions: [
        'Open **Settings → General → Transfer or Reset iPhone**',
        'Tap **Erase All Content and Settings**',
        'Enter your passcode if prompted, then tap **Continue**',
        'Confirm the erase',
      ],
    },
    {
      title: 'Leave the device on the Hello screen',
      body: "Once it restarts, you'll see the Hello / language picker. Don't set it up — just power it off and pack it for pickup.",
    },
  ],
  android: [
    {
      title: 'Back up your device',
      body: 'Back up photos, contacts, and anything else you want to keep before continuing — the next steps will erase everything.',
    },
    {
      title: 'Sign out of your Google account and turn off Find My Device',
      lead: 'This is the single most important step in this entire guide.',
      body: 'Doing this before the reset is what prevents Factory Reset Protection (FRP) from locking the device after the wipe.',
      subActions: [
        'Open **Settings**',
        'Tap **Passwords & accounts** (called **Accounts** on some versions)',
        'Tap your Google account, then **Remove account**',
        'Confirm with your screen-lock PIN or pattern if prompted',
        'Go to **Settings → Security → Find My Device** and toggle it off',
        'If you have more than one Google account on the device, repeat for each one',
      ],
      tip: "Your Google account should no longer appear under Accounts. That confirms Factory Reset Protection won't trigger after the reset.",
    },
    {
      title: 'Erase all data (factory reset)',
      subActions: [
        'Open **Settings → System → Reset options**',
        'Tap **Erase all data (factory reset)**',
        'Enter your PIN, pattern, or password if prompted',
        'Confirm the erase',
      ],
    },
    {
      title: 'Leave the device on the welcome screen',
      body: "Once it restarts, you'll see the welcome / language picker. Don't set it up — just power it off and pack it for pickup.",
    },
  ],
}

const UNLINK_GUIDE = {
  ios: [
    {
      title: 'Sign in to iCloud.com from any browser',
      body: 'Use a phone, tablet, or computer — anything with internet. Sign in with the Apple ID linked to the device you are returning.',
      tip: "If two-factor is on, you'll need a verification code from another trusted Apple device or phone number.",
    },
    {
      title: 'Open Find My, then choose All Devices',
      body: 'From the iCloud dashboard, open Find My and pick the device you are returning from the All Devices list.',
    },
    {
      title: 'Erase the device, then remove it from your account',
      lead: 'This is the single most important step in this entire guide.',
      body: 'This is what switches Activation Lock off so our technician can wipe and resell the device.',
      subActions: [
        'Tap **Erase This Device**',
        'Confirm with your Apple ID password',
        'Once the device shows as erased, tap **Remove from Account**',
        'Confirm the removal',
      ],
      tip: 'The device should disappear from the All Devices list. That confirms Activation Lock is switched off.',
    },
  ],
  android: [
    {
      title: 'Sign in to android.com/find from any browser',
      body: 'Use a phone, tablet, or computer with internet. Sign in with the Google account linked to the device you are returning.',
    },
    {
      title: 'Open Find My Device, then pick this device',
      body: 'Select the device you are returning from the list of devices on your account.',
    },
    {
      title: 'Erase the device, then sign out of your Google account',
      lead: 'This is the single most important step in this entire guide.',
      body: 'This is what clears Factory Reset Protection so our technician can wipe and resell the device.',
      subActions: [
        'Tap **Erase device**',
        'Confirm with your Google password',
        'Open **myaccount.google.com → Security → Your devices**',
        'Find the returned device and tap **Sign out**',
      ],
      tip: 'The device should disappear from Find My Device. That confirms Factory Reset Protection has been cleared.',
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

export default function Step3DevicePrep({ state, dispatch, order, attempted }) {
  const dp = state.devicePrep
  const defaultOs = order?.deviceOs || 'ios'
  const os = dp.os || defaultOs

  return (
    <>
      <StepHeading
        title="Prepare your device for return"
        subtitle="Returns are delayed when this step is skipped. Pick one of the two paths below."
      />

      <div className="px-4 flex flex-col gap-3">
        <Callout>
          <span className="font-semibold text-ink">
            Unlock the device before we can refund you.
          </span>{' '}
          We can't access its data — this lets it be reset and resold.
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
              guideChecks={dp.resetGuideChecks || {}}
              onGuideCheck={(id, checked) =>
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
              guideSeen={dp.resetGuideSeen}
              onGuideDone={() =>
                dispatch({
                  type: 'SET_DEVICE_PREP',
                  value: { resetGuideSeen: true },
                })
              }
              attempted={attempted}
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
          subtitle="Share your passcode and unlink it — we'll wipe it on pickup. Slower."
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
      className={`rounded-[16px] border-2 transition-colors ${
        selected
          ? 'border-brand bg-brand-bg/30'
          : 'border-line bg-surface'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="w-full text-left px-4 py-3.5 flex items-start gap-3"
      >
        <span
          aria-hidden
          className={`mt-0.5 w-[20px] h-[20px] rounded-full border-2 grid place-items-center shrink-0 ${
            selected ? 'border-brand' : 'border-line'
          }`}
        >
          {selected && <span className="w-2.5 h-2.5 rounded-full bg-brand" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2 flex-wrap">
            <span className="text-[15px] font-semibold text-ink">{title}</span>
            {recommended && <Badge tone="success">Recommended</Badge>}
            {slower && <Badge tone="warn">Slower</Badge>}
          </span>
          <span className="block mt-0.5 text-[12.5px] text-muted leading-snug">
            {subtitle}
          </span>
        </span>
      </button>
      {children && (
        <div className="px-4 pb-4 pt-1 border-t border-line/60 animate-slideDown">
          {children}
        </div>
      )}
    </div>
  )
}

function Badge({ tone = 'success', children }) {
  const tones = {
    success: 'bg-success-bg text-success',
    warn: 'bg-warn-bg text-warn',
  }
  return (
    <span
      className={`inline-flex items-center rounded-full h-5 px-2 text-[10px] font-bold uppercase tracking-[0.06em] ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

function renderBold(text) {
  if (!text) return null
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g)
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? (
      <strong key={i} className="font-semibold text-ink">
        {p.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{p}</span>
    ),
  )
}

function GuideStep({ index, step }) {
  return (
    <li className="flex gap-2.5 items-start">
      <span className="w-6 h-6 rounded-full bg-brand text-white grid place-items-center shrink-0 text-[11px] font-bold tabular-nums mt-px">
        {index + 1}
      </span>
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-[13px] font-semibold text-ink leading-snug">
          {step.title}
        </div>
        {(step.lead || step.body) && (
          <div className="text-[12px] text-ink-2 leading-[1.5] mt-1">
            {step.lead && (
              <span className="font-semibold text-ink">{step.lead} </span>
            )}
            {step.body && renderBold(step.body)}
          </div>
        )}
        {step.subActions && (
          <ol className="flex flex-col gap-1.5 mt-2">
            {step.subActions.map((sa, j) => (
              <li
                key={j}
                className="flex gap-2 items-start text-[12px] text-ink-2 leading-[1.5]"
              >
                <span className="text-muted shrink-0 tabular-nums font-medium min-w-[14px]">
                  {j + 1}.
                </span>
                <span>{renderBold(sa)}</span>
              </li>
            ))}
          </ol>
        )}
        {step.tip && (
          <div className="mt-2 flex items-start gap-1.5 rounded-[8px] bg-success-bg/40 border border-success-bg px-2.5 py-2 text-[11.5px] text-ink-2 leading-snug">
            <BadgeCheck
              size={13}
              strokeWidth={2}
              className="text-success shrink-0 mt-0.5"
            />
            <span>{renderBold(step.tip)}</span>
          </div>
        )}
      </div>
    </li>
  )
}

function ResetPanel({
  os,
  onOsChange,
  confirmed,
  onConfirmChange,
  guideChecks,
  onGuideCheck,
  guideSeen,
  onGuideDone,
  attempted,
}) {
  const [open, setOpen] = useState(true)
  const [guideOpen, setGuideOpen] = useState(false)
  const guide = RESET_GUIDE[os]
  // On iOS the confirm checkbox is locked until the customer has been
  // through the guide (opened it and pressed Done). Android keeps its
  // inline accordion, so there's nothing to gate on.
  const confirmLocked = os === 'ios' && !guideSeen
  // Set when the customer clicks Continue before completing the guide —
  // escalates the guide button + gate message into a red error state.
  const showError = attempted && confirmLocked
  return (
    <div className="pt-3 flex flex-col gap-3">
      <OsTabs os={os} onChange={onOsChange} />

      {os === 'ios' ? (
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className={`relative overflow-hidden rounded-[16px] border-2 px-4 py-3.5 text-left transition-colors ${
            showError
              ? 'border-danger bg-danger-bg/60'
              : guideSeen
                ? 'border-success/40 bg-success-bg/50'
                : 'border-brand bg-brand-bg/60 hover:bg-brand-bg/80'
          }`}
        >
          <span className="relative flex items-center gap-3">
            <span
              className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${
                guideSeen
                  ? 'bg-success text-white'
                  : showError
                    ? 'bg-danger text-white'
                    : 'bg-brand text-white'
              }`}
            >
              {guideSeen ? (
                <Check size={19} strokeWidth={1.9} />
              ) : (
                <Sparkles size={19} strokeWidth={1.9} />
              )}
            </span>
            <span className="min-w-0">
              <span className="block text-[14.5px] font-semibold text-ink leading-snug">
                {guideSeen ? 'Guided reset completed' : 'Start the guided reset'}
              </span>
              <span className="block mt-0.5 text-[12px] text-muted">
                {guideSeen
                  ? 'Tap to run through it again'
                  : 'One step at a time · about 10 min'}
              </span>
            </span>
          </span>
        </button>
      ) : (
        <>
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
            <ol className="flex flex-col gap-3.5 animate-slideDown">
              {guide.map((step, i) => (
                <GuideStep key={i} index={i} step={step} />
              ))}
            </ol>
          )}
        </>
      )}

      {guideOpen && (
        <ResetGuideSheet
          checks={guideChecks}
          onToggle={onGuideCheck}
          onDone={() => {
            onGuideDone()
            setGuideOpen(false)
          }}
          onClose={() => setGuideOpen(false)}
        />
      )}

      <label
        className={`flex items-start gap-2.5 pt-1 ${
          confirmLocked ? 'cursor-not-allowed opacity-55' : 'cursor-pointer'
        }`}
      >
        <span className="relative mt-px shrink-0">
          <input
            type="checkbox"
            checked={confirmed}
            disabled={confirmLocked}
            onChange={(e) => onConfirmChange(e.target.checked)}
            className="peer sr-only"
          />
          <span
            className={`w-[20px] h-[20px] rounded-[6px] border-2 grid place-items-center transition-colors ${
              confirmed ? 'bg-brand border-brand' : 'border-line bg-surface'
            }`}
          >
            {confirmed && (
              <Check size={13} strokeWidth={3} className="text-white" />
            )}
          </span>
        </span>
        <span className="text-[13px] text-ink leading-[1.4]">
          I confirm this device has been unlinked and factory reset.
        </span>
      </label>
      {confirmLocked && (
        <p
          className={`-mt-1.5 ml-[30px] flex items-start gap-1.5 text-[11.5px] leading-snug ${
            showError
              ? 'font-medium text-danger animate-slideDown'
              : 'text-muted'
          }`}
        >
          {showError && (
            <AlertTriangle
              size={13}
              strokeWidth={2.2}
              className="shrink-0 mt-px"
            />
          )}
          <span>
            Run the guide above and tap{' '}
            <span
              className={showError ? 'font-semibold' : 'font-semibold text-ink-2'}
            >
              Done
            </span>{' '}
            to confirm.
          </span>
        </p>
      )}
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
  const guide = UNLINK_GUIDE[os]
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
        <ol className="px-3.5 py-3.5 flex flex-col gap-3.5">
          {guide.map((step, i) => (
            <GuideStep key={i} index={i} step={step} />
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
