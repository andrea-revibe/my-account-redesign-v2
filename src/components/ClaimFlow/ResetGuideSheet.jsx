import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Clock,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react'

// iOS-only guided reset walkthrough launched from the "I've factory reset
// the device" option on Step 3. The customer picks one of two routes —
// reset from the device, or remove it remotely. Checklist ticks persist in
// devicePrep.resetGuideChecks; pressing Done fires onDone so the step can
// unlock its confirm checkbox (the customer can't confirm until they've
// been through the guide). Instructional only — never gates the flow
// directly; the step's confirm checkbox does.

function renderBold(text) {
  if (!text) return null
  return String(text)
    .split(/(\*\*[^*]+\*\*)/g)
    .map((p, i) =>
      p.startsWith('**') && p.endsWith('**') ? (
        <strong key={i} className="font-semibold text-ink">
          {p.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{p}</span>
      ),
    )
}

const DEVICE_IDS = ['d_backup', 'd_signout', 'd_erase', 'd_confirm']
const REMOTE_IDS = ['r_icloud', 'r_appleid']
const FINAL_IDS = ['f_sim', 'f_watch', 'f_imessage', 'f_imei', 'f_ordernum']

export default function ResetGuideSheet({ checks, onToggle, onDone, onClose }) {
  const [route, setRoute] = useState(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const doneIn = (ids) => ids.filter((id) => checks[id]).length

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Reset your device guide"
    >
      <button
        aria-label="Close guide"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 animate-fadeIn"
      />
      <div className="relative w-full max-w-mobile bg-surface rounded-t-[22px] shadow-lg2 max-h-[94vh] flex flex-col animate-slideUp overflow-hidden">
        <header className="px-4 pt-4 pb-3 border-b border-line shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[17px] font-bold text-ink leading-tight">
                Reset your device before you ship it
              </h2>
              <p className="mt-1 text-[12.5px] text-ink-2 leading-[1.45]">
                Erase the device <span className="font-semibold text-ink">and</span>{' '}
                unlink it from your Apple ID, so our technicians aren't blocked
                by Activation Lock.
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 -mr-1 -mt-1 w-8 h-8 grid place-items-center rounded-full text-muted hover:bg-line-2/60"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-line-2/60 px-2.5 h-6 text-[11px] font-semibold text-ink-2">
            <Clock size={12} strokeWidth={2} />
            Takes about 10 min
          </span>
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-5">
          <RouteChooser route={route} onPick={setRoute} />

          {route === 'device' && (
            <RouteSection
              tone="brand"
              title="Reset from the device"
              caption="Most people"
              done={doneIn(DEVICE_IDS)}
              total={DEVICE_IDS.length}
            >
              <ChecklistRow
                id="d_backup"
                checked={!!checks.d_backup}
                onToggle={onToggle}
              >
                {renderBold(
                  '**Back up first** — **Settings → [your name] → iCloud → iCloud Backup → Back Up Now.** Erasing is permanent.',
                )}
              </ChecklistRow>

              <ChecklistRow
                id="d_signout"
                num="1"
                checked={!!checks.d_signout}
                onToggle={onToggle}
              >
                {renderBold(
                  '**Sign out of iCloud** — **Settings → tap your name → scroll down → Sign Out →** enter Apple ID password → confirm. ',
                )}
                <span className="italic text-ink-2">
                  This is what removes Activation Lock.
                </span>
                <Note>
                  {renderBold(
                    '*Stolen Device Protection (iOS 17.3+)* may force a 1-hour delay away from home/work. Do this at home/work, or turn it off first: **Settings → Face ID & Passcode → Stolen Device Protection.**',
                  )}
                </Note>
                <Escalate onClick={() => setRoute('remote')}>
                  Can't sign out (forgot password, biometrics broken, won't clear
                  the delay)? Remove it remotely instead.
                </Escalate>
              </ChecklistRow>

              <ChecklistRow
                id="d_erase"
                num="2"
                checked={!!checks.d_erase}
                onToggle={onToggle}
              >
                {renderBold(
                  '**Erase** — **Settings → General → Transfer or Reset → Erase All Content and Settings.** ',
                )}
                <span className="text-ink-2">
                  (<span className="italic">Not</span> the "Reset" sub-menu — that
                  only clears network/keyboard settings.) Wait 2–10 min; don't
                  interrupt.
                </span>
              </ChecklistRow>

              <ChecklistRow
                id="d_confirm"
                num="3"
                checked={!!checks.d_confirm}
                onToggle={onToggle}
              >
                {renderBold(
                  '**Confirm it worked** — On restart you should see the rotating **"Hello / Hola / Bonjour"** screen, then a language/country prompt — **not** an Apple ID request. That means it\'s unlocked. Power off and pack it.',
                )}
                <Flag>Passcode keypad appears → reset didn't run; redo step 2.</Flag>
                <Flag onClick={() => setRoute('remote')} escalate>
                  {renderBold(
                    '**"Activation Lock" / "iPhone Locked to Owner" / Apple ID prompt** → wiped but still linked. Remove it remotely instead.',
                  )}
                </Flag>
              </ChecklistRow>

              <FinalTouches checks={checks} onToggle={onToggle} doneIn={doneIn} />
            </RouteSection>
          )}

          {route === 'remote' && (
            <RouteSection
              tone="warn"
              title="Remove it remotely"
              caption="Biometrics broken, dead device, still locked, or couldn't sign out"
              done={doneIn(REMOTE_IDS)}
              total={REMOTE_IDS.length}
            >
              <p className="text-[12px] text-ink-2 leading-[1.5] -mt-1 mb-1">
                Works even on a device that's already erased or won't power on.
              </p>

              <ChecklistRow
                id="r_icloud"
                checked={!!checks.r_icloud}
                onToggle={onToggle}
              >
                <Ext href="https://www.icloud.com/find">icloud.com/find</Ext>{' '}
                {renderBold(
                  '→ sign in with the Apple ID that was on the device → select it → **Erase This Device → Remove from Account**',
                )}
              </ChecklistRow>

              <ChecklistRow
                id="r_appleid"
                checked={!!checks.r_appleid}
                onToggle={onToggle}
              >
                <Ext href="https://appleid.apple.com">appleid.apple.com</Ext>{' '}
                {renderBold('→ **Devices →** select the device **→ Remove from Account**')}
              </ChecklistRow>

              <FinalTouches checks={checks} onToggle={onToggle} doneIn={doneIn} />
            </RouteSection>
          )}

          {!route && (
            <p className="text-[12px] text-muted leading-[1.5] text-center py-1">
              Pick how you'll do it above to see the steps.
            </p>
          )}
        </div>

        <footer className="px-4 py-3 border-t border-line shrink-0">
          <button
            onClick={onDone}
            className="w-full h-[46px] rounded-[10px] bg-brand text-white font-semibold text-[14.5px]"
          >
            Done
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}

function RouteChooser({ route, onPick }) {
  return (
    <div>
      <h3 className="text-[13.5px] font-bold text-ink">
        First — how will you do this?
      </h3>
      <div className="mt-2.5 flex flex-col gap-2">
        <RouteCard
          selected={route === 'device'}
          onClick={() => onPick('device')}
          Icon={CheckCircle2}
          tone="brand"
          title="I can unlock this device"
          subtitle="Reset from the device · most people"
        />
        <RouteCard
          selected={route === 'remote'}
          onClick={() => onPick('remote')}
          Icon={AlertTriangle}
          tone="warn"
          title="Face ID/Touch ID is broken, or the device won't turn on"
          subtitle="Remove it remotely"
        />
      </div>
      <p className="mt-2 text-[11.5px] text-muted leading-[1.45]">
        Picking the right one up front saves you a wasted attempt.
      </p>
    </div>
  )
}

function RouteCard({ selected, onClick, Icon, tone, title, subtitle }) {
  const toneRing =
    tone === 'warn'
      ? selected
        ? 'border-warn bg-warn-bg/50'
        : 'border-line bg-surface'
      : selected
        ? 'border-brand bg-brand-bg/40'
        : 'border-line bg-surface'
  const toneIcon = tone === 'warn' ? 'text-warn' : 'text-brand'
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full text-left rounded-[14px] border-2 px-3.5 py-3 flex items-start gap-3 transition-colors ${toneRing}`}
    >
      <Icon size={18} strokeWidth={2} className={`${toneIcon} shrink-0 mt-0.5`} />
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-semibold text-ink leading-snug">
          {title}
        </span>
        <span className="block mt-0.5 text-[11.5px] text-muted">{subtitle}</span>
      </span>
    </button>
  )
}

function SectionHeader({ title, caption, done, total }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <h3 className="text-[13.5px] font-bold text-ink">{title}</h3>
        {caption && (
          <p className="text-[11.5px] text-muted leading-snug">{caption}</p>
        )}
      </div>
      <span
        className={`shrink-0 inline-flex items-center rounded-full px-2 h-5 text-[10.5px] font-bold tabular-nums ${
          done === total
            ? 'bg-success-bg text-success'
            : 'bg-line-2/70 text-ink-2'
        }`}
      >
        {done}/{total}
      </span>
    </div>
  )
}

function RouteSection({ tone, title, caption, done, total, children }) {
  const bar = tone === 'warn' ? 'bg-warn' : 'bg-brand'
  return (
    <section className="rounded-[14px] border border-line overflow-hidden">
      <div className={`h-1 w-full ${bar}`} />
      <div className="px-3.5 py-3.5">
        <SectionHeader
          title={title}
          caption={caption}
          done={done}
          total={total}
        />
        <ol className="mt-3 flex flex-col gap-3.5">{children}</ol>
      </div>
    </section>
  )
}

function FinalTouches({ checks, onToggle, doneIn }) {
  return (
    <li className="list-none mt-1 pt-3.5 border-t border-line/70">
      <SectionHeader
        title="Final touches"
        caption="Optional but smart"
        done={doneIn(FINAL_IDS)}
        total={FINAL_IDS.length}
      />
      <div className="mt-2.5 flex flex-col gap-2">
        <ChecklistRow
          id="f_sim"
          compact
          checked={!!checks.f_sim}
          onToggle={onToggle}
        >
          Remove SIM / delete eSIM
        </ChecklistRow>
        <ChecklistRow
          id="f_watch"
          compact
          checked={!!checks.f_watch}
          onToggle={onToggle}
        >
          Unpair Apple Watch
        </ChecklistRow>
        <ChecklistRow
          id="f_imessage"
          compact
          checked={!!checks.f_imessage}
          onToggle={onToggle}
        >
          Deregister iMessage if switching off Apple (
          <Ext href="https://selfsolve.apple.com/deregister-imessage">
            selfsolve.apple.com/deregister-imessage
          </Ext>
          )
        </ChecklistRow>
        <ChecklistRow
          id="f_imei"
          compact
          checked={!!checks.f_imei}
          onToggle={onToggle}
        >
          Photo the IMEI for warranty
        </ChecklistRow>
        <ChecklistRow
          id="f_ordernum"
          compact
          checked={!!checks.f_ordernum}
          onToggle={onToggle}
        >
          Include your order number in the box
        </ChecklistRow>
      </div>
    </li>
  )
}

function ChecklistRow({ id, num, checked, onToggle, compact, children }) {
  return (
    <li className="list-none">
      <label className="flex items-start gap-2.5 cursor-pointer">
        <span className="relative mt-px shrink-0">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onToggle(id, e.target.checked)}
            className="peer sr-only"
          />
          <span
            className={`w-[18px] h-[18px] rounded-[5px] border-2 grid place-items-center transition-colors ${
              checked ? 'bg-success border-success' : 'border-line bg-surface'
            }`}
          >
            {checked && <Check size={12} strokeWidth={3} className="text-white" />}
          </span>
        </span>
        <span
          className={`flex-1 min-w-0 leading-[1.5] text-[12.5px] ${
            checked ? 'text-muted' : 'text-ink-2'
          }`}
        >
          {num && (
            <span className="font-bold text-ink tabular-nums">{num}. </span>
          )}
          {children}
        </span>
      </label>
    </li>
  )
}

function Note({ children }) {
  return (
    <span className="mt-2 flex items-start gap-1.5 rounded-[8px] bg-line-2/40 border border-line px-2.5 py-2 text-[11.5px] text-ink-2 leading-snug">
      <ShieldAlert
        size={13}
        strokeWidth={2}
        className="text-muted shrink-0 mt-0.5"
      />
      <span>{children}</span>
    </span>
  )
}

function Flag({ children, onClick, escalate }) {
  const inner = (
    <span className="mt-2 flex items-start gap-1.5 rounded-[8px] bg-danger-bg/60 border border-danger/25 px-2.5 py-2 text-[11.5px] text-ink leading-snug">
      <AlertTriangle
        size={13}
        strokeWidth={2}
        className="text-danger shrink-0 mt-0.5"
      />
      <span className="flex-1">
        {children}
        {escalate && (
          <ArrowRight
            size={12}
            strokeWidth={2.4}
            className="inline-block ml-1 -mt-px text-danger align-middle"
          />
        )}
      </span>
    </span>
  )
  if (!onClick) return inner
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      {inner}
    </button>
  )
}

function Escalate({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mt-2 flex items-start gap-1.5 w-full text-left rounded-[8px] border border-brand/30 bg-brand-bg/30 px-2.5 py-2 text-[11.5px] font-semibold text-brand leading-snug hover:bg-brand-bg/50"
    >
      <ArrowRight size={13} strokeWidth={2.4} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </button>
  )
}

function Ext({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="text-brand font-semibold inline-flex items-center gap-0.5 hover:underline"
    >
      {children}
      <ExternalLink size={11} strokeWidth={2} className="inline-block" />
    </a>
  )
}
