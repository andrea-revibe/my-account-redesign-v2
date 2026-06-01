import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Clock,
  Check,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  Search,
  Cloud,
  KeyRound,
  Package,
  Lock,
  Watch,
  Camera,
  Hash,
  ShieldCheck,
  RotateCcw,
  Apple,
  Volume2,
  Smartphone,
  Laptop,
  Menu,
  ChevronUp,
} from 'lucide-react'

// Guided iPhone reset — a focused, one-step-per-screen walkthrough launched
// from the "I've factory reset the device" option on Step 3 (iOS only). The
// customer picks a route on the intro screen (reset from the device, or
// remove it remotely), walks each step grounded in a mock iOS screen, then
// lands on a "ready to ship" finish with an optional final-touches checklist.
// Pressing Done fires onDone so the step can unlock its confirm checkbox.
// Instructional only — never gates the flow directly; the step's confirm
// checkbox does. Final-touches ticks persist in devicePrep.resetGuideChecks
// via checks / onToggle.

// Step-transition keyframes (forward slides in from the right, back from the
// left). Scoped to this sheet so we don't touch the global Tailwind config.
const STEP_ANIM_CSS = `
@keyframes gSlideR { from { opacity: 0; transform: translateX(26px); } to { opacity: 1; transform: none; } }
@keyframes gSlideL { from { opacity: 0; transform: translateX(-26px); } to { opacity: 1; transform: none; } }
`

const stepAnim = (dir) =>
  `${dir < 0 ? 'gSlideL' : 'gSlideR'} 0.34s cubic-bezier(0.32,0.72,0,1)`

const DEVICE_STEPS = [
  {
    Mock: SettingsSignOut,
    title: 'Sign out of iCloud',
    lead: 'Open Settings, tap your name, scroll to the very bottom and tap Sign Out. Enter your Apple ID password to confirm.',
    why: 'This is the one step that removes Activation Lock.',
    trouble: {
      label: "It won't let me sign out",
      body: 'On iOS 17.3+, Stolen Device Protection can add a 1-hour delay away from home or work — do it at home, or turn it off under Settings › Face ID & Passcode. Forgot the password or biometrics broken? Switch to the remote path.',
      escalate: true,
    },
  },
  {
    Mock: SettingsErase,
    title: 'Erase all content',
    lead: 'Go to Settings › General › Transfer or Reset, then tap Erase All Content and Settings. It takes 2–10 minutes — don’t interrupt it.',
    why: 'Not the “Reset” sub-menu — that only clears network & keyboard settings.',
  },
  {
    Mock: HelloScreen,
    title: 'Restart and check',
    lead: 'When it reboots you’ll see the rotating “hello” screen and a language picker — not an Apple ID prompt. Then power it off and pack it.',
    why: 'No Apple ID prompt means Activation Lock is off — you’re done.',
    trouble: {
      label: 'I see a passcode or “Locked to Owner” screen',
      body: 'A passcode keypad means the erase didn’t run — redo the erase step. An Apple ID / “iPhone Locked to Owner” prompt means it’s wiped but still linked — finish it on the remote path.',
      escalate: true,
    },
  },
]

const REMOTE_STEPS = [
  {
    Mock: ICloudRemove,
    title: 'Remove it from iCloud',
    lead: 'On any device, open icloud.com/find and sign in with the Apple ID that was on this iPhone. Pick the device, then tap Remove This Device — not Erase.',
    why: 'Remove This Device is what unlinks it and lifts Activation Lock. Erase only wipes the data — the lock stays on.',
    trouble: {
      label: 'What if it’s still online?',
      body: 'If the iPhone is offline, Activation Lock lifts straight away (and it drops off Find My after 30 days). If it’s still online it can’t be removed yet — tap Continue to mark it “Ready for Repair / Trade In” for 30 days. One catch: if it later comes back online while still signed in, it can reappear and re-lock — so if you can still reach the device, also sign out of iCloud on it. You can do the same from appleid.apple.com › Devices.',
    },
  },
  {
    Mock: AccountRemoveCarousel,
    title: 'Or unlink it from your account',
    lead: 'No iCloud access? On any device open account.apple.com and sign in. Open the menu, tap Devices, pick this iPhone, scroll to About, then tap Remove from account. Swipe the screens with the arrows.',
    why: 'Removing it from your Apple Account lifts Activation Lock too — same result as the iCloud step, just a different route.',
    trouble: {
      label: 'Which one should I use?',
      body: 'Either lifts the lock. Use icloud.com/find if the phone is lost or you also want to erase it remotely. Use account.apple.com › Devices when you just need to unlink a phone you still have in hand.',
    },
  },
]

const FINAL_CHECKS = [
  { id: 'gf_sim', Icon: SimCard, label: 'Remove SIM / delete eSIM' },
  { id: 'gf_watch', Icon: Watch, label: 'Unpair Apple Watch' },
  { id: 'gf_imei', Icon: Camera, label: 'Photo the IMEI for warranty' },
  { id: 'gf_order', Icon: Hash, label: 'Order number in the box' },
]

const COPY = {
  introTitle: 'Let’s unlock your iPhone',
  introSub:
    'We’ll go one step at a time. First — can you still unlock and use this phone?',
  yes: 'Yes, I can unlock it',
  yesSub: 'Reset right from the device · most people',
  no: 'No — it’s broken or won’t turn on',
  noSub: 'We’ll erase it remotely instead',
  doneTitle: 'Your iPhone is ready to ship',
  doneSub:
    'It’s erased and unlinked. Before you box it up, a few quick optional checks:',
}

export default function ResetGuideSheet({ checks, onToggle, onDone, onClose }) {
  const [phase, setPhase] = useState('intro')
  const [route, setRoute] = useState(null)
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)

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

  const steps = route === 'remote' ? REMOTE_STEPS : DEVICE_STEPS

  const start = (r) => {
    setRoute(r)
    setI(0)
    setDir(1)
    setPhase('steps')
  }
  const next = () => {
    setDir(1)
    if (i < steps.length - 1) setI(i + 1)
    else setPhase('done')
  }
  const back = () => {
    setDir(-1)
    if (i > 0) setI(i - 1)
    else setPhase('intro')
  }
  const escalate = () => {
    setRoute('remote')
    setI(0)
    setDir(1)
  }

  const headerTitle =
    phase === 'done'
      ? 'Almost there'
      : route === 'remote'
        ? 'Remote reset'
        : route === 'device'
          ? 'Reset from the device'
          : 'Reset your iPhone'

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Guided iPhone reset"
    >
      <style>{STEP_ANIM_CSS}</style>
      <button
        aria-label="Close guide"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-fadeIn"
      />
      <div className="relative w-full max-w-mobile h-full bg-surface flex flex-col animate-slideUp overflow-hidden">
        <header className="shrink-0 px-4 pt-4 pb-3 border-b border-line">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              {phase === 'steps' && (
                <button
                  onClick={back}
                  className="w-8 h-8 -ml-1 rounded-full grid place-items-center text-ink hover:bg-line-2/60 shrink-0"
                  aria-label="Back"
                >
                  <ChevronLeft size={18} strokeWidth={2} />
                </button>
              )}
              <span className="text-[13px] font-bold text-ink truncate">
                {headerTitle}
              </span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 grid place-items-center rounded-full text-muted hover:bg-line-2/60 shrink-0"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          {phase === 'steps' && (
            <Progress current={i + 1} total={steps.length} />
          )}
        </header>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {phase === 'intro' && (
            <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center animate-fadeIn">
              <div className="relative">
                <div
                  className="absolute inset-0 -m-3 rounded-full blur-2xl bg-brand-bg"
                  aria-hidden
                />
                <img
                  src="/iphone-midnight.png"
                  alt=""
                  className="relative w-[148px] h-[148px] object-contain drop-shadow-xl"
                />
              </div>
              <h2 className="mt-3 text-[21px] font-bold text-ink leading-tight">
                {COPY.introTitle}
              </h2>
              <p className="mt-2 text-[13.5px] text-ink-2 leading-[1.5] max-w-[300px]">
                {COPY.introSub}
              </p>
              <div className="mt-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-line-2/70 text-ink-2 px-2.5 h-6 text-[11px] font-semibold">
                  <Clock size={12} strokeWidth={2} />
                  About 10 minutes
                </span>
              </div>
              <div className="mt-5 w-full flex flex-col gap-2.5">
                <button
                  onClick={() => start('device')}
                  className="w-full text-left rounded-[16px] border-2 border-brand bg-brand-bg/50 px-4 py-3.5 flex items-center gap-3 hover:bg-brand-bg/70 transition-colors"
                >
                  <span className="w-10 h-10 rounded-full bg-brand text-white grid place-items-center shrink-0">
                    <CheckCircle2 size={20} strokeWidth={2} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14.5px] font-semibold text-ink">
                      {COPY.yes}
                    </span>
                    <span className="block text-[12px] text-muted">
                      {COPY.yesSub}
                    </span>
                  </span>
                  <ArrowRight
                    size={18}
                    strokeWidth={2.2}
                    className="text-brand shrink-0"
                  />
                </button>
                <button
                  onClick={() => start('remote')}
                  className="w-full text-left rounded-[16px] border-2 border-line bg-surface px-4 py-3.5 flex items-center gap-3 hover:bg-line-2/30 transition-colors"
                >
                  <span className="w-10 h-10 rounded-full bg-warn-bg text-warn grid place-items-center shrink-0">
                    <AlertTriangle size={20} strokeWidth={2} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[14.5px] font-semibold text-ink leading-snug">
                      {COPY.no}
                    </span>
                    <span className="block text-[12px] text-muted">
                      {COPY.noSub}
                    </span>
                  </span>
                  <ArrowRight
                    size={18}
                    strokeWidth={2.2}
                    className="text-muted shrink-0"
                  />
                </button>
              </div>
            </div>
          )}

          {phase === 'steps' &&
            (() => {
              const s = steps[i]
              const Mock = s.Mock
              return (
                <div
                  key={`${route}-${i}`}
                  className="px-5 pt-5 pb-5 flex flex-col items-center text-center"
                  style={{ animation: stepAnim(dir) }}
                >
                  <Mock />
                  <h2 className="mt-4 text-[20px] font-bold text-ink leading-tight">
                    {s.title}
                  </h2>
                  <p className="mt-2 text-[13.5px] text-ink-2 leading-[1.55] max-w-[320px]">
                    {s.lead}
                  </p>
                  {s.why && (
                    <div
                      className={`mt-3 inline-flex items-start gap-1.5 rounded-[10px] px-3 py-2 text-[12px] leading-snug max-w-[320px] ${
                        route === 'remote'
                          ? 'bg-warn-bg/70 text-warn'
                          : 'bg-brand-bg/70 text-brand'
                      }`}
                    >
                      <ShieldCheck
                        size={14}
                        strokeWidth={2}
                        className="shrink-0 mt-px"
                      />
                      <span className="text-left font-medium">{s.why}</span>
                    </div>
                  )}
                  {s.trouble && (
                    <Trouble trouble={s.trouble} onEscalate={escalate} />
                  )}
                </div>
              )
            })()}

          {phase === 'done' && (
            <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center animate-fadeIn">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-success-bg" />
                <div className="absolute inset-0 grid place-items-center text-success">
                  <CheckCircle2 size={40} strokeWidth={1.9} />
                </div>
              </div>
              <h2 className="mt-3 text-[21px] font-bold text-ink leading-tight">
                {COPY.doneTitle}
              </h2>
              <p className="mt-2 text-[13.5px] text-ink-2 leading-[1.5] max-w-[300px]">
                {COPY.doneSub}
              </p>
              <div className="mt-4 w-full rounded-[16px] border border-line overflow-hidden">
                {FINAL_CHECKS.map((f, idx) => {
                  const ItemIcon = f.Icon
                  const checked = !!checks[f.id]
                  return (
                    <button
                      key={f.id}
                      onClick={() => onToggle(f.id, !checked)}
                      className={`w-full flex items-center gap-3 px-3.5 py-3 text-left ${
                        idx > 0 ? 'border-t border-line-2' : ''
                      }`}
                    >
                      <span
                        className={`w-[22px] h-[22px] rounded-[7px] border-2 grid place-items-center shrink-0 transition-colors ${
                          checked
                            ? 'bg-success border-success'
                            : 'border-line bg-surface'
                        }`}
                      >
                        {checked && (
                          <Check size={13} strokeWidth={3} className="text-white" />
                        )}
                      </span>
                      <ItemIcon
                        size={16}
                        strokeWidth={1.9}
                        className="text-muted shrink-0"
                      />
                      <span
                        className={`flex-1 text-[13px] ${
                          checked
                            ? 'text-muted line-through decoration-line'
                            : 'text-ink-2'
                        }`}
                      >
                        {f.label}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="mt-3 text-[11.5px] text-muted leading-snug">
                These are optional — tap Done whenever you’re ready.
              </p>
            </div>
          )}
        </div>

        <footer className="shrink-0 px-4 py-3 border-t border-line">
          {phase === 'steps' && (
            <button
              onClick={next}
              className="w-full h-[48px] rounded-[12px] bg-brand text-white font-semibold text-[14.5px] inline-flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
            >
              {i < steps.length - 1 ? (
                <>
                  I’ve done this
                  <ArrowRight size={16} strokeWidth={2.4} />
                </>
              ) : (
                <>
                  I’ve done this — finish
                  <Check size={16} strokeWidth={2.6} />
                </>
              )}
            </button>
          )}
          {phase === 'done' && (
            <button
              onClick={onDone}
              className="w-full h-[48px] rounded-[12px] bg-success text-white font-semibold text-[14.5px] inline-flex items-center justify-center gap-1.5"
            >
              <Check size={16} strokeWidth={2.6} />
              Done
            </button>
          )}
          {phase === 'intro' && (
            <p className="text-center text-[11.5px] text-muted leading-snug py-1">
              Not sure? Pick “Yes” — you can switch paths anytime.
            </p>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  )
}

function Progress({ current, total }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, idx) => (
          <span
            key={idx}
            className="flex-1 h-1.5 rounded-full overflow-hidden bg-line"
          >
            <span
              className={`block h-full rounded-full bg-brand transition-all duration-500 ${
                idx < current ? 'w-full' : 'w-0'
              }`}
            />
          </span>
        ))}
      </div>
      <div className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
        Step {Math.min(current, total)} of {total}
      </div>
    </div>
  )
}

function Trouble({ trouble, onEscalate }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand"
        aria-expanded={open}
      >
        <HelpCircle size={15} strokeWidth={2} />
        {trouble.label}
        <ChevronDown
          size={14}
          strokeWidth={2.2}
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="mt-2 rounded-[12px] border border-line bg-line-2/40 px-3.5 py-3 animate-slideDown text-left">
          <p className="text-[12.5px] text-ink-2 leading-[1.5]">{trouble.body}</p>
          {trouble.escalate && (
            <button
              onClick={onEscalate}
              className="mt-2.5 inline-flex items-center gap-1.5 rounded-[10px] bg-warn-bg text-warn font-semibold text-[12px] px-3 h-9 hover:brightness-95"
            >
              <RotateCcw size={14} strokeWidth={2.2} />
              Switch to the remote path
              <ArrowRight size={13} strokeWidth={2.4} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ----------------------------------------------------- iOS mock screens */
// Polished CSS illustrations of the iOS screen each reset step happens on.
// The highlight glow uses the brand channels. No screenshots.

const BRAND = '80 25 160'
const BRAND2 = '122 61 211'
const HILITE = {
  background: `rgb(${BRAND} / 0.12)`,
  boxShadow: `inset 3px 0 0 rgb(${BRAND})`,
}

// Base screen is 190×384 (tall enough that the densest step — Sign out of
// iCloud — fits without clipping), then scaled up so the illustration reads
// clearly inside the sheet.
function MiniPhone({ children, dark = false }) {
  const W = 190
  const H = 384
  const S = 1.32
  const outerW = W + 14
  const outerH = H + 14
  return (
    <div
      className="mx-auto"
      style={{ width: outerW * S, height: outerH * S }}
    >
      <div
        className="relative rounded-[34px] p-[7px]"
        style={{
          width: outerW,
          height: outerH,
          transform: `scale(${S})`,
          transformOrigin: 'top left',
          background: dark
            ? 'linear-gradient(160deg,#2a2a30,#0a0a0c)'
            : 'linear-gradient(160deg,#efecf5,#c9c2da)',
          boxShadow:
            '0 18px 40px -16px rgba(40,20,80,0.45), 0 2px 6px rgba(40,20,80,0.18), inset 0 1px 1px rgba(255,255,255,0.5)',
        }}
      >
        <div
          className={`relative rounded-[28px] overflow-hidden ${
            dark ? '' : 'bg-[#f1f1f6]'
          }`}
          style={{
            width: W,
            height: H,
            ...(dark
              ? {
                  background:
                    'radial-gradient(130% 100% at 50% 0%, #232838 0%, #050507 72%)',
                }
              : {}),
          }}
        >
          <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-[54px] h-[15px] bg-black rounded-full z-20" />
          {children}
          <div
            className={`absolute bottom-[5px] left-1/2 -translate-x-1/2 w-[66px] h-[3.5px] rounded-full z-20 ${
              dark ? 'bg-white/55' : 'bg-ink/25'
            }`}
          />
        </div>
      </div>
    </div>
  )
}

function StatusBar({ light }) {
  const c = light ? 'bg-white/90' : 'bg-ink/80'
  return (
    <div className="flex items-center justify-between px-4 pt-[8px] pb-1">
      <span className={`text-[9px] font-bold ${light ? 'text-white' : 'text-ink'}`}>
        9:41
      </span>
      <div className="flex items-center gap-[3px]">
        <div
          className={`w-[12px] h-[7px] rounded-[1px] ${c}`}
          style={{
            clipPath:
              'polygon(0 40%,18% 40%,18% 100%,0 100%, 0 40%, 27% 25%,45% 25%,45% 100%,27% 100%,27% 25%, 55% 10%,73% 10%,73% 100%,55% 100%,55% 10%, 82% 0,100% 0,100% 100%,82% 100%)',
          }}
        />
        <Cloud
          size={9}
          strokeWidth={2}
          className={light ? 'text-white/90' : 'text-ink/80'}
        />
        <div
          className={`relative w-[15px] h-[7px] rounded-[2px] border ${
            light ? 'border-white/70' : 'border-ink/60'
          }`}
        >
          <div className={`absolute inset-[1px] right-[5px] rounded-[1px] ${c}`} />
        </div>
      </div>
    </div>
  )
}

function Row({ Icon, iconBg, label, value, highlight, danger, chevron = true }) {
  return (
    <div
      className={`relative flex items-center gap-2 px-2.5 py-[8px] ${
        highlight ? 'z-10' : ''
      }`}
      style={highlight ? HILITE : undefined}
    >
      {Icon && (
        <span
          className="w-[19px] h-[19px] rounded-[5px] grid place-items-center shrink-0 text-white"
          style={{ background: iconBg }}
        >
          <Icon size={11} strokeWidth={2.2} />
        </span>
      )}
      <span
        className={`flex-1 text-[10.5px] font-medium ${
          danger ? 'text-danger' : 'text-ink'
        } truncate`}
      >
        {label}
      </span>
      {value && (
        <span className="text-[9.5px] text-muted truncate max-w-[52px]">
          {value}
        </span>
      )}
      {chevron && (
        <ChevronRight
          size={11}
          strokeWidth={2.2}
          className="text-muted/50 shrink-0"
        />
      )}
    </div>
  )
}

// 1 · Sign out of iCloud — Apple-ID card + the Sign Out row glowing.
function SettingsSignOut() {
  return (
    <MiniPhone>
      <StatusBar />
      <div className="px-2.5 pt-1.5">
        <div className="text-[15px] font-bold text-ink px-1">Settings</div>
        <div className="mt-1.5 flex items-center gap-1.5 bg-black/5 rounded-[9px] px-2 h-[22px]">
          <Search size={10} strokeWidth={2.2} className="text-muted" />
          <span className="text-[9px] text-muted">Search</span>
        </div>
      </div>
      <div className="px-2.5 mt-2">
        <div className="flex items-center gap-2 bg-white rounded-[11px] px-2 py-2 shadow-sm2">
          <span
            className="w-[28px] h-[28px] rounded-full grid place-items-center text-white text-[11px] font-bold"
            style={{
              background: `linear-gradient(145deg, rgb(${BRAND2}), rgb(${BRAND}))`,
            }}
          >
            A
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[10.5px] font-semibold text-ink leading-tight">
              Your Name
            </span>
            <span className="block text-[8.5px] text-muted">
              Apple Account, iCloud &amp; more
            </span>
          </span>
          <ChevronRight size={11} strokeWidth={2.2} className="text-muted/50" />
        </div>
      </div>
      <div className="px-2.5 mt-2">
        <div className="bg-white rounded-[11px] overflow-hidden divide-y divide-line-2 shadow-sm2">
          <Row Icon={Cloud} iconBg="#3478f6" label="iCloud" value="50 GB" />
          <Row Icon={KeyRound} iconBg="#34c759" label="Sign-In &amp; Security" />
          <Row Icon={Package} iconBg="#ff9500" label="Payment &amp; Shipping" />
        </div>
      </div>
      <div className="px-2.5 mt-2.5">
        <div className="bg-white rounded-[11px] overflow-hidden shadow-sm2">
          <Row label="Sign Out" danger highlight chevron={false} />
        </div>
        <div className="mt-1.5 flex items-center justify-center gap-1 text-[8.5px] font-semibold text-brand">
          <ArrowRight size={9} strokeWidth={2.6} /> at the very bottom
        </div>
      </div>
    </MiniPhone>
  )
}

// 2 · Erase — Transfer or Reset list with the destructive action glowing.
function SettingsErase() {
  return (
    <MiniPhone>
      <StatusBar />
      <div className="px-2.5 pt-1.5 flex items-center gap-0.5 text-brand">
        <ChevronLeft size={13} strokeWidth={2.4} />
        <span className="text-[9px] font-medium">General</span>
      </div>
      <div className="px-2.5 mt-1">
        <div className="text-[13px] font-bold text-ink px-1 leading-tight">
          Transfer or Reset iPhone
        </div>
      </div>
      <div className="px-2.5 mt-3">
        <div className="bg-white rounded-[11px] overflow-hidden divide-y divide-line-2 shadow-sm2">
          <Row Icon={Package} iconBg="#34c759" label="Prepare for New iPhone" />
        </div>
      </div>
      <div className="px-2.5 mt-2.5">
        <div className="bg-white rounded-[11px] overflow-hidden divide-y divide-line-2 shadow-sm2">
          <Row label="Reset" chevron />
          <div className="relative" style={HILITE}>
            <div className="px-2.5 py-[9px] text-[10.5px] font-semibold text-danger leading-tight">
              Erase All Content and Settings
            </div>
          </div>
        </div>
        <div className="mt-2 px-1 text-[8px] text-muted leading-snug">
          Not the “Reset” row above — that only clears network &amp;
          keyboard settings.
        </div>
      </div>
    </MiniPhone>
  )
}

// 3 · Confirm it worked — the rotating Hello screen means you're unlocked.
function HelloScreen() {
  return (
    <MiniPhone>
      <StatusBar />
      <div className="h-full flex flex-col items-center justify-center -mt-8">
        <div
          className="text-ink text-[34px] leading-none"
          style={{
            fontFamily: '"Snell Roundhand", "Brush Script MT", Georgia, cursive',
            fontStyle: 'italic',
          }}
        >
          hello
        </div>
        <div
          className="mt-3 text-muted text-[13px]"
          style={{
            fontFamily: '"Snell Roundhand", Georgia, cursive',
            fontStyle: 'italic',
          }}
        >
          Bonjour
        </div>
        <div className="mt-9 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-ink/70" />
          <span className="w-1.5 h-1.5 rounded-full bg-ink/25" />
          <span className="w-1.5 h-1.5 rounded-full bg-ink/25" />
        </div>
        <div className="mt-8 flex items-center gap-1 rounded-full bg-success-bg border border-success/30 px-2.5 h-6 text-[9px] font-semibold text-success">
          <CheckCircle2 size={11} strokeWidth={2.4} />
          No Apple ID prompt
        </div>
      </div>
    </MiniPhone>
  )
}

// Remote · the iCloud Find Devices sheet in a browser. Mirrors the real
// UI: the device card, Play Sound / Lost iPhone actions, and the Erase /
// Remove list — with Remove glowing as the correct choice.
function ICloudRemove() {
  return (
    <MiniPhone>
      <StatusBar />
      <div className="px-2.5 mt-1.5">
        <div className="flex items-center justify-center gap-1.5 bg-black/5 rounded-full px-2.5 h-[22px]">
          <Lock size={9} strokeWidth={2.2} className="text-muted" />
          <span className="text-[9px] text-ink-2 font-medium truncate">
            icloud.com
          </span>
        </div>
      </div>
      <div className="px-2.5 mt-2.5 flex items-center gap-1">
        <Apple size={12} strokeWidth={1.5} className="text-ink fill-ink" />
        <span className="text-[11px] font-bold text-ink">iCloud</span>
        <span className="text-[11px] font-bold text-success">Find Devices</span>
      </div>
      <div className="px-2.5 mt-2.5">
        <div className="text-[11.5px] font-bold text-ink leading-tight">
          This iPhone
        </div>
        <div className="text-[8.5px] text-muted mt-0.5">
          iPhone · Offline · 6 min ago
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-1.5">
          <div className="rounded-[9px] bg-white border border-line shadow-sm2 px-2 py-1.5 flex flex-col gap-1">
            <span
              className="w-[18px] h-[18px] rounded-full grid place-items-center text-white"
              style={{ background: `rgb(${BRAND2})` }}
            >
              <Volume2 size={10} strokeWidth={2.4} />
            </span>
            <span className="text-[9px] font-semibold text-ink leading-none">
              Play Sound
            </span>
          </div>
          <div className="rounded-[9px] bg-white border border-line shadow-sm2 px-2 py-1.5 flex flex-col gap-1">
            <span className="w-[18px] h-[18px] rounded-full grid place-items-center text-white bg-[#ff9500]">
              <Lock size={10} strokeWidth={2.4} />
            </span>
            <span className="text-[9px] font-semibold text-ink leading-none">
              Lost iPhone
            </span>
          </div>
        </div>

        <div className="mt-1.5 rounded-[10px] overflow-hidden border border-line bg-white shadow-sm2">
          <div className="px-2.5 py-[10px] text-[11px] font-medium text-muted">
            Erase
          </div>
          <div className="relative border-t border-line-2" style={HILITE}>
            <div className="px-2.5 py-[10px] text-[11px] font-bold text-brand">
              Remove
            </div>
          </div>
        </div>

        <div className="mt-2 px-1 text-[8.5px] text-muted leading-snug">
          Tap <span className="font-semibold text-ink-2">Remove</span> — not
          Erase.
        </div>
      </div>
    </MiniPhone>
  )
}

// Remote · account.apple.com route — a four-screen swipeable walkthrough of
// removing the device from the Apple Account (menu › Devices › pick › About ›
// Remove from account). Same polished CSS-mock language as ICloudRemove; the
// account holder's details are masked since this is a removal-from-account
// surface, not a sign-in one.
const ACCOUNT_SCREENS = [
  { Screen: AcctMenu, caption: 'Open the menu, tap Devices' },
  { Screen: AcctDeviceList, caption: 'Pick this iPhone' },
  { Screen: AcctDeviceDetail, caption: 'Open it, scroll to About' },
  { Screen: AcctRemove, caption: 'Tap Remove from account' },
]

function AccountRemoveCarousel() {
  const [idx, setIdx] = useState(0)
  const [dir, setDir] = useState(1)
  const last = ACCOUNT_SCREENS.length - 1
  const go = (n) => {
    setDir(n > idx ? 1 : -1)
    setIdx(n)
  }
  const { Screen, caption } = ACCOUNT_SCREENS[idx]
  return (
    <div className="w-full">
      <div className="relative flex justify-center">
        <button
          onClick={() => idx > 0 && go(idx - 1)}
          disabled={idx === 0}
          aria-label="Previous screen"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-surface border border-line shadow-sm2 grid place-items-center text-ink disabled:opacity-30 active:scale-95 transition-transform"
        >
          <ChevronLeft size={18} strokeWidth={2.2} />
        </button>
        <div key={idx} style={{ animation: stepAnim(dir) }}>
          <MiniPhone>
            <Screen />
          </MiniPhone>
        </div>
        <button
          onClick={() => idx < last && go(idx + 1)}
          disabled={idx === last}
          aria-label="Next screen"
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-surface border border-line shadow-sm2 grid place-items-center text-ink disabled:opacity-30 active:scale-95 transition-transform"
        >
          <ChevronRight size={18} strokeWidth={2.2} />
        </button>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1.5">
        {ACCOUNT_SCREENS.map((_, d) => (
          <button
            key={d}
            onClick={() => go(d)}
            aria-label={`Screen ${d + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              d === idx ? 'w-5 bg-brand' : 'w-1.5 bg-line'
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-[12px] font-semibold text-ink-2">
        {idx + 1}. {caption}
      </p>
    </div>
  )
}

// Shared chrome for the account.apple.com screens — status bar + URL pill.
function AcctScreen({ children }) {
  return (
    <>
      <StatusBar />
      <div className="px-2.5 mt-1.5">
        <div className="flex items-center justify-center gap-1.5 bg-black/5 rounded-full px-2.5 h-[22px]">
          <Lock size={9} strokeWidth={2.2} className="text-muted" />
          <span className="text-[9px] text-ink-2 font-medium truncate">
            account.apple.com
          </span>
        </div>
      </div>
      {children}
    </>
  )
}

function AcctSignOut({ collapsed }) {
  const Chevron = collapsed ? ChevronDown : ChevronUp
  return (
    <div className="px-2.5 mt-2.5 flex items-center justify-between">
      <span className="text-[13px] font-bold text-ink">Apple Account</span>
      <div className="flex items-center gap-1.5">
        <Chevron size={12} strokeWidth={2.4} className="text-ink" />
        <span className="rounded-full bg-[#0071e3] text-white text-[8.5px] font-semibold px-2 py-[3px]">
          Sign Out
        </span>
      </div>
    </div>
  )
}

// 1 · Account menu expanded — the Devices row glowing as the route to take.
function AcctMenu() {
  const items = [
    'Personal Information',
    'Sign-In and Security',
    'Payment & Shipping',
    'Subscriptions',
    'Family Sharing',
    'Devices',
    'Privacy',
  ]
  return (
    <AcctScreen>
      <div className="px-2.5 mt-2.5 flex items-center justify-between">
        <Apple size={13} strokeWidth={1} className="text-ink fill-ink" />
        <div className="flex items-center gap-2 text-ink/70">
          <Search size={11} strokeWidth={2} />
          <Package size={11} strokeWidth={2} />
          <Menu size={12} strokeWidth={2.4} />
        </div>
      </div>
      <AcctSignOut />
      <div className="px-2.5 mt-2">
        <div className="border-t border-line-2 divide-y divide-line-2">
          {items.map((label) => {
            const highlight = label === 'Devices'
            return (
              <div
                key={label}
                className="relative px-1.5 py-[8px]"
                style={highlight ? HILITE : undefined}
              >
                <span
                  className={`text-[10.5px] ${
                    highlight ? 'font-semibold text-brand' : 'font-medium text-ink'
                  }`}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
      <div className="mt-1.5 flex items-center justify-center gap-1 text-[8.5px] font-semibold text-brand">
        <ArrowRight size={9} strokeWidth={2.6} /> tap Devices
      </div>
    </AcctScreen>
  )
}

// 2 · Devices list — this iPhone picked out of the account's devices.
function AcctDeviceList() {
  return (
    <AcctScreen>
      <AcctSignOut collapsed />
      <div className="px-2.5 mt-2 border-t border-line-2 pt-2 text-[9px] text-muted leading-snug">
        See details for the devices associated with your account.
      </div>
      <div className="px-2.5 mt-2.5 space-y-2">
        <div
          className="relative rounded-[11px] border border-line bg-white shadow-sm2 p-2.5"
          style={HILITE}
        >
          <div className="flex items-start gap-2">
            <span className="flex-1 min-w-0">
              <span className="block text-[11px] font-bold text-ink leading-tight">
                Your iPhone
              </span>
              <span className="block text-[9px] text-muted mt-0.5">iPhone 17</span>
            </span>
            <Smartphone size={20} strokeWidth={1.6} className="text-ink/70" />
          </div>
        </div>
        <div className="rounded-[11px] border border-line bg-white shadow-sm2 p-2.5 flex items-start gap-2">
          <span className="flex-1 min-w-0">
            <span className="block text-[11px] font-bold text-ink leading-tight">
              Your MacBook Air
            </span>
            <span className="block text-[9px] text-muted mt-0.5">
              MacBook Air 13″
            </span>
          </span>
          <Laptop size={20} strokeWidth={1.6} className="text-ink/70" />
        </div>
      </div>
    </AcctScreen>
  )
}

// 3 · Device detail — Backup & Security; a hint to scroll down to About.
function AcctDeviceDetail() {
  return (
    <AcctScreen>
      <div className="px-2.5 mt-1.5">
        <X size={13} strokeWidth={2.2} className="text-ink" />
      </div>
      <div className="flex flex-col items-center mt-0.5">
        <Smartphone size={26} strokeWidth={1.4} className="text-ink/70" />
        <span className="mt-1 text-[12px] font-bold text-ink">Your iPhone</span>
        <span className="text-[9.5px] text-ink-2">iPhone 17</span>
        <span className="text-[8.5px] text-muted mt-0.5">
          Serial Number: ••••••••
        </span>
      </div>
      <div className="px-2.5 mt-3">
        <div className="text-[11px] font-bold text-ink">Backup &amp; Security</div>
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted">—</span>
            <span className="text-[9.5px] text-muted">iCloud Backup</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} strokeWidth={2.2} className="text-success" />
            <span className="text-[9.5px] text-ink">Find My iPhone</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={12} strokeWidth={2.2} className="text-success" />
            <span className="text-[9.5px] text-ink">Trusted Device</span>
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-center gap-1 text-[8.5px] font-semibold text-brand">
        scroll down to About
        <ChevronDown size={10} strokeWidth={2.6} />
      </div>
    </AcctScreen>
  )
}

// 4 · About — masked details + the Remove from account button glowing.
function AcctRemove() {
  const rows = [
    ['Model', 'iPhone 17'],
    ['Version', 'iOS 26.5'],
    ['Phone Number', '+•• ••• ••• ••••'],
    ['Serial Number', '••••••••••'],
    ['IMEI', '•• •••••• •••••• •'],
  ]
  return (
    <AcctScreen>
      <div className="px-2.5 mt-1.5">
        <X size={13} strokeWidth={2.2} className="text-ink" />
      </div>
      <div className="px-2.5 mt-1">
        <div className="text-[12px] font-bold text-ink">About</div>
        <div className="mt-2 space-y-[7px]">
          {rows.map(([k, v]) => (
            <div key={k}>
              <div className="text-[8.5px] text-muted leading-none">{k}</div>
              <div className="text-[10px] font-medium text-ink mt-[2px]">{v}</div>
            </div>
          ))}
        </div>
        <div className="relative mt-3 rounded-[8px]" style={HILITE}>
          <div className="rounded-[8px] border border-brand/60 px-2.5 py-[8px] text-center">
            <span className="text-[10.5px] font-semibold text-brand">
              Remove from account
            </span>
          </div>
        </div>
      </div>
    </AcctScreen>
  )
}

// lucide has no SIM-card glyph — inline one matching the design's path.
function SimCard({ size = 16, strokeWidth = 1.9, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M5 3h9l5 5v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <rect x="8" y="13" width="8" height="5" rx="1" />
    </svg>
  )
}
