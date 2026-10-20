import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  Clock,
  Check,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronDown,
  HelpCircle,
  Info,
  Lock,
  Eraser,
  Smartphone,
  Globe,
} from 'lucide-react'
import { STEP_ANIM_CSS, stepAnim } from './resetGuideAnim'
import {
  SettingsSignOut,
  SettingsErase,
  HelloScreen,
  SamsungRemoveGoogle,
  SamsungSignOutCarousel,
  SamsungFactoryReset,
  SamsungWelcome,
  IpadSettingsSignOut,
  IpadSettingsErase,
  IpadHelloScreen,
  MacSignOut,
  MacErase,
  MacWelcome,
  IosStolenOff,
  IosSignedOut,
  IosPasscodeOff,
  IpadStolenOff,
  IpadSignedOut,
  IpadPasscodeOff,
  SamsungLockSwipe,
  SamsungAccountsEmpty,
  GoogleRemoveRemote,
  SamsungRemoveRemote,
  FindMyDevices,
  FindMyDevice,
  FindMyConfirm,
  IcloudWebSignIn,
  IcloudWebDevice,
  IcloudWebConfirm,
  WindowsSetup,
  PathScreen,
} from './resetGuideMocks'
import { StepIllustration, GuideIntroArt } from './resetGuideFrames'
import { ACCOUNT_RECOVERY, NEVER_ASK } from '../../data/resetGuides'
import {
  guideById,
  variantFor,
  stepsFor,
  eraseFor,
  remoteStepsFor,
  remoteRoutesFor,
  resolveNode,
  fillNoun,
} from '../../lib/resetGuides'

// Guided reset — one engine that renders any guide definition from
// data/resetGuides/* (G1–G7 + no-reset). Every claim type runs the same steps,
// word for word. The intro asks whether the
// customer can use the device: Yes runs the on-device steps (one per screen;
// guides with an optional erase ask after the must-dos), No runs the guide's
// remote-unlink carousel in the same layout. "I can't use my device" under
// every on-device step jumps to that carousel; a step's `help` link opens
// account recovery (lib/resetGuides resolveNode) and comes back.
// Finishing either path fires onDone({ via, erased }) — the caller (Step 3 /
// ClaimCard / ResetFailedCard / the sandbox) decides what that unlocks.

// step.mock keys → the hand-drawn CSS-art screens. Steps without one render
// their menu path as a PathScreen in the variant's OS style (`variant.os`;
// `frame: 'phone'` steps on Watch / AirPods happen on the iPhone), and steps
// with no path get a StepIllustration.
const MOCKS = {
  ios_signout: SettingsSignOut,
  ios_erase: SettingsErase,
  ios_hello: HelloScreen,
  ipad_signout: IpadSettingsSignOut,
  ipad_erase: IpadSettingsErase,
  ipad_hello: IpadHelloScreen,
  sam_remove_google: SamsungRemoveGoogle,
  sam_signout: SamsungSignOutCarousel,
  sam_reset: SamsungFactoryReset,
  sam_welcome: SamsungWelcome,
  mac_signout: MacSignOut,
  mac_erase: MacErase,
  mac_welcome: MacWelcome,
  ios_stolen_off: IosStolenOff,
  ios_signed_out: IosSignedOut,
  ios_passcode_off: IosPasscodeOff,
  ipad_stolen_off: IpadStolenOff,
  ipad_signed_out: IpadSignedOut,
  ipad_passcode_off: IpadPasscodeOff,
  sam_lock_swipe: SamsungLockSwipe,
  sam_accounts_empty: SamsungAccountsEmpty,
  win_setup: WindowsSetup,
  fm_devices: FindMyDevices,
  fm_device: FindMyDevice,
  fm_confirm: FindMyConfirm,
  web_signin: IcloudWebSignIn,
  web_device: IcloudWebDevice,
  web_confirm: IcloudWebConfirm,
  google_remote: GoogleRemoveRemote,
  samsung_remote: SamsungRemoveRemote,
}

function mockFor(step, variantId) {
  const key = typeof step.mock === 'string' ? step.mock : step.mock?.[variantId]
  return key ? MOCKS[key] : null
}

export default function ResetGuideSheet({
  guideId = 'apple_mobile',
  facts = {},
  // 'start' | 'remote' | 'recovery' — open on the intro, the remote-unlink
  // carousel (Step 3's off-ramp, ClaimCard, ResetFailedCard), or the guide's
  // first account recovery.
  initialView = 'start',
  // Close via onDone on finish instead of showing the done screen.
  skipDone = false,
  onDone,
  onClose,
}) {
  const guide = guideById(guideId)
  const variant = variantFor(guide, facts.variant)
  const noun = variant.noun
  const fill = (t) => fillNoun(t, noun, variant.plural)
  const eraseMode = eraseFor(guide)
  const remoteRoutes = remoteRoutesFor(guide)
  const recoveryEntry = guide.account[0] ? `account_${guide.account[0]}` : null

  const [view, setView] = useState(initialView === 'remote' ? 'remote' : initialView === 'recovery' ? 'recovery' : 'intro')
  // Where Back from the remote carousel goes (null = close: opened directly).
  const [remoteFrom, setRemoteFrom] = useState(null)
  const [i, setI] = useState(0)
  const [ri, setRi] = useState(0)
  // Parallel remote routes (Apple: Find My app vs icloud.com) share step
  // positions, so switching keeps the customer on the same step.
  const [route, setRoute] = useState(remoteRoutes[0]?.id ?? null)
  const remoteSteps = remoteStepsFor(guide, { variant: variant.id, route })
  const [dir, setDir] = useState(1)
  const [carouselIdx, setCarouselIdx] = useState(0)
  // Account recovery trail; Back past its first node returns to `recoveryFrom`.
  const [trail, setTrail] = useState(() => (initialView === 'recovery' && recoveryEntry ? [recoveryEntry] : []))
  const [recoveryFrom, setRecoveryFrom] = useState(null)
  const scrollRef = useRef(null)
  const [doneVia, setDoneVia] = useState('guide')
  // Optional erase: null until the customer picks; 'erase' needs the backup
  // + responsibility tick (never disabled — an unticked Start shows the error).
  const [eraseChoice, setEraseChoice] = useState(null)
  const [backupAck, setBackupAck] = useState(false)
  const [choiceError, setChoiceError] = useState(null)

  useEffect(() => {
    setCarouselIdx(0)
  }, [i, ri])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [trail, view])

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

  const steps = stepsFor(guide, { variant: variant.id, erase: eraseChoice === 'erase' })
  const inRemote = view === 'remote'
  const list = inRemote ? remoteSteps : steps
  const idx = inRemote ? ri : i
  const setIdx = inRemote ? setRi : setI
  const step = list[idx]
  const onChoice = view === 'steps' && !!step?.choice
  const screens = (view === 'steps' && !onChoice) || inRemote ? mockFor(step, variant.id)?.screens : null
  const isCarousel = Array.isArray(screens)
  const atCarouselEnd = !isCarousel || carouselIdx >= screens.length - 1
  const showFinish = atCarouselEnd && idx === list.length - 1
  const node = view === 'recovery' && trail.length ? resolveNode(guide, trail[trail.length - 1], { variant: variant.id }) : null
  // The last remote step carries the vendor's last resort + continue anyway.
  const lastResort = guide.account.map((a) => ACCOUNT_RECOVERY[a]?.nothingWorks).filter(Boolean)
  const remoteTrouble = {
    label: 'If nothing works',
    body: [...lastResort, 'Continue anyway — if it still reaches us locked, we’ll contact you with the next step.'].join(' '),
  }
  // Whether the device ends up erased; null when the customer took a fix route.
  const erasedFor = (via) =>
    via !== 'guide' ? null : eraseMode === 'required' ? true : eraseMode === 'optional' ? eraseChoice === 'erase' : null

  const finish = (via) => {
    const result = { via, erased: erasedFor(via) }
    if (skipDone) return onDone(result)
    setDoneVia(via)
    setView('done')
  }
  const start = () => {
    setI(0)
    setDir(1)
    setView('steps')
  }
  const next = () => {
    if (onChoice) {
      if (!eraseChoice) return setChoiceError('choose')
      if (eraseChoice === 'erase' && !backupAck) return setChoiceError('backup')
      if (eraseChoice === 'skip') return finish('guide')
    }
    if (isCarousel && carouselIdx < screens.length - 1) {
      setCarouselIdx((n) => n + 1)
      return
    }
    setDir(1)
    if (idx < list.length - 1) setIdx(idx + 1)
    else finish(inRemote ? 'cant_use' : 'guide')
  }
  const back = () => {
    if (view === 'recovery') {
      if (trail.length > 1) return setTrail((t) => t.slice(0, -1))
      if (recoveryFrom) return setView(recoveryFrom)
      return onClose()
    }
    if (isCarousel && carouselIdx > 0) return setCarouselIdx((n) => n - 1)
    setDir(-1)
    if (idx > 0) return setIdx(idx - 1)
    if (inRemote) return remoteFrom ? setView(remoteFrom) : onClose()
    setView('intro')
  }
  const openRemote = () => {
    setRemoteFrom(view)
    setRi(0)
    setDir(1)
    setView('remote')
  }
  const openRecovery = (to) => {
    setRecoveryFrom(view)
    setTrail([to])
    setView('recovery')
  }

  const headerTitle =
    view === 'done'
      ? ''
      : inRemote
        ? 'Unlink it remotely'
        : view === 'recovery'
          ? 'Account recovery'
          : guide.label

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Guided ${guide.label} reset`}
    >
      <style>{STEP_ANIM_CSS}</style>
      <button
        aria-label="Close guide"
        onClick={onClose}
        className="absolute inset-0 bg-black/40 animate-fadeIn"
      />
      <div className="relative w-full max-w-mobile h-full bg-surface flex flex-col animate-slideUp overflow-hidden">
        <header className="shrink-0 px-4 pt-4 pb-3 border-b border-line">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {(view === 'steps' || inRemote || view === 'recovery') && (
                <button
                  onClick={back}
                  className="w-8 h-8 -ml-1 rounded-full grid place-items-center text-ink hover:bg-line-2/60 shrink-0"
                  aria-label="Back"
                >
                  <ChevronLeft size={18} strokeWidth={2} />
                </button>
              )}
              <span className="text-[13px] font-bold text-ink truncate">{headerTitle}</span>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 grid place-items-center rounded-full text-muted hover:bg-line-2/60 shrink-0"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          {inRemote && remoteRoutes.length > 1 && (
            <RouteSwitch
              routes={remoteRoutes}
              value={route}
              onChange={(r) => {
                setRoute(r)
                setCarouselIdx(0)
              }}
            />
          )}
          {(view === 'steps' || inRemote) && (
            <div className="mt-3">
              <Progress current={idx + 1} total={list.length} />
            </div>
          )}
        </header>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
          {view === 'intro' && (
            <Intro
              guide={guide}
              variant={variant}
              fill={fill}
              stepCount={steps.length}
              eraseMode={eraseMode}
              onStart={start}
              onCantUse={openRemote}
            />
          )}

          {view === 'steps' && step && onChoice && (
            <EraseChoice
              noun={noun}
              dir={dir}
              choice={eraseChoice}
              onChoice={(v) => {
                setEraseChoice(v)
                setChoiceError(null)
              }}
              backupAck={backupAck}
              onBackup={(v) => {
                setBackupAck(v)
                setChoiceError(null)
              }}
              error={choiceError}
            />
          )}

          {(view === 'steps' || inRemote) && step && !onChoice && (
            <StepScreen
              key={`${view}-${step.id}-${idx}`}
              step={inRemote && idx === list.length - 1 && !step.trouble ? { ...step, trouble: remoteTrouble } : step}
              onHelp={openRecovery}
              variant={variant}
              dir={dir}
              fill={fill}
              carouselIdx={carouselIdx}
              setCarouselIdx={setCarouselIdx}
            />
          )}

          {view === 'recovery' && node && (
            <RecoveryNode key={trail.join('/')} fill={fill} node={node} onPick={(to) => setTrail((t) => [...t, to])} />
          )}

          {view === 'done' && <Done guide={guide} fill={fill} via={doneVia} erased={erasedFor(doneVia)} />}
        </div>

        <footer className="shrink-0 px-4 py-3 border-t border-line">
          {view === 'intro' && !guide.remote && (
            <PrimaryButton onClick={start}>
              Start <ArrowRight size={16} strokeWidth={2.4} />
            </PrimaryButton>
          )}
          {(view === 'steps' || inRemote) && (
            <PrimaryButton onClick={next}>
              {onChoice && eraseChoice === 'skip' ? (
                <>
                  Finish — send it as it is <Check size={16} strokeWidth={2.6} />
                </>
              ) : onChoice && eraseChoice === 'erase' ? (
                <>
                  Start erasing <ArrowRight size={16} strokeWidth={2.4} />
                </>
              ) : onChoice ? (
                <>
                  Continue <ArrowRight size={16} strokeWidth={2.4} />
                </>
              ) : showFinish ? (
                <>
                  I’ve done this — finish <Check size={16} strokeWidth={2.6} />
                </>
              ) : (
                <>
                  I’ve done this <ArrowRight size={16} strokeWidth={2.4} />
                </>
              )}
            </PrimaryButton>
          )}
          {node && !node.ask && (
            <PrimaryButton onClick={() => (recoveryFrom ? setView(recoveryFrom) : onClose())}>
              <ChevronLeft size={16} strokeWidth={2.4} /> Back to the guide
            </PrimaryButton>
          )}
          {view === 'done' && (
            <button
              onClick={() => onDone({ via: doneVia, erased: erasedFor(doneVia) })}
              className="w-full h-[48px] rounded-[12px] bg-success text-white font-semibold text-[14.5px] inline-flex items-center justify-center gap-1.5"
            >
              <Check size={16} strokeWidth={2.6} />
              Done
            </button>
          )}
          {view === 'steps' && guide.remote && (
            <button
              onClick={openRemote}
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-brand py-1"
            >
              <HelpCircle size={14} strokeWidth={2.2} />
              I can’t use my device
            </button>
          )}
        </footer>
      </div>
    </div>,
    document.body,
  )
}

const ROUTE_ICONS = { device: Smartphone, web: Globe }

function RouteSwitch({ routes, value, onChange }) {
  return (
    <div className="mt-3">
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">How do you want to do it?</div>
      <div className="mt-1.5 grid grid-flow-col auto-cols-fr gap-2" role="tablist">
        {routes.map((r) => {
          const Icon = ROUTE_ICONS[r.id] ?? Globe
          const active = value === r.id
          return (
            <button
              key={r.id}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(r.id)}
              className={`h-11 rounded-[12px] border-[1.5px] inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold transition ${
                active ? 'border-brand bg-brand text-white shadow-sm2' : 'border-line bg-surface text-ink hover:border-brand/50'
              }`}
            >
              <Icon size={15} strokeWidth={2.2} />
              {r.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function PrimaryButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="w-full h-[48px] rounded-[12px] bg-brand text-white font-semibold text-[14.5px] inline-flex items-center justify-center gap-1.5 active:scale-[0.99] transition-transform"
    >
      {children}
    </button>
  )
}

const INTRO_SUB = {
  optional: 'We’ll unlink it from your accounts and take the locks off. Erasing it is up to you, at the end.',
  required: 'We’ll unlink it from your accounts and erase it.',
  none: 'A few steps that free it from your account, so it won’t lock again.',
}

// First screen: the fork the guide has always opened with — can the customer
// use the device? Yes runs the on-device steps; No goes to "I can't use my
// device" (the remote-unlink carousel). Guides without one just
// get Start in the footer.
function Intro({ guide, variant, fill, stepCount, eraseMode, onStart, onCantUse }) {
  const isDevice = guide.id !== 'no_reset' && guide.account.length > 0
  return (
    <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center animate-fadeIn">
      <GuideIntroArt variant={variant} />
      <h2 className="mt-3 text-[21px] font-bold text-ink leading-tight">{fill('Prepare your {noun}')}</h2>
      <p className="mt-2 text-[13.5px] text-ink-2 leading-[1.5] max-w-[300px]">
        {INTRO_SUB[eraseMode ?? 'none']}
        {guide.remote && <> First — can you still use {fill('your {noun}')}?</>}
      </p>
      {guide.remote ? (
        <div className="mt-5 w-full flex flex-col gap-2.5">
          <WhereButton
            icon={CheckCircle2}
            title="Yes, I can unlock and use it"
            sub={`Do it on the device · ${stepCount} ${stepCount === 1 ? 'step' : 'steps'} · ~10 min`}
            onClick={onStart}
          />
          <WhereButton
            icon={Lock}
            title="No — it’s locked, broken or not with me"
            sub="Unlink it remotely instead"
            onClick={onCantUse}
          />
        </div>
      ) : (
        <div className="mt-3 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-line-2/70 text-ink-2 px-2.5 h-6 text-[11px] font-semibold">
            <Clock size={12} strokeWidth={2} /> ~10 min
          </span>
          <span className="inline-flex items-center rounded-full bg-line-2/70 text-ink-2 px-2.5 h-6 text-[11px] font-semibold">
            {stepCount} {stepCount === 1 ? 'step' : 'steps'}
          </span>
        </div>
      )}
      {isDevice && (
        <p className="mt-4 flex items-start gap-1.5 text-left text-[11.5px] text-muted leading-snug max-w-[320px]">
          <Info size={13} strokeWidth={2} className="shrink-0 mt-px" />
          <span>Your data is your responsibility — back up anything you want to keep.</span>
        </p>
      )}
    </div>
  )
}

// The optional-erase fork, after every must-do step. Erasing needs the backup
// + responsibility tick; sending it as it is finishes the guide.
function EraseChoice({ noun, dir, choice, onChoice, backupAck, onBackup, error }) {
  return (
    <div className="px-5 pt-5 pb-5 flex flex-col items-center text-center" style={{ animation: stepAnim(dir) }}>
      <span className="w-14 h-14 rounded-full bg-brand-bg text-brand grid place-items-center">
        <Eraser size={26} strokeWidth={1.9} />
      </span>
      <h2 className="mt-4 text-[20px] font-bold text-ink leading-tight">Erase it — optional</h2>
      <p className="mt-2 text-[13.5px] text-ink-2 leading-[1.55] max-w-[320px]">
        Your {noun} is unlinked and unlocked, so it’s ready to send. Erasing it as well is your choice.
      </p>
      <div className="mt-4 w-full flex flex-col gap-2 text-left">
        <ChoiceCard
          active={choice === 'skip'}
          error={error === 'choose'}
          label="Send it as it is"
          sub="Your data stays on it"
          onClick={() => onChoice('skip')}
        />
        <ChoiceCard
          active={choice === 'erase'}
          error={error === 'choose'}
          label={`Erase the ${noun} first`}
          sub="Everything on it is deleted"
          onClick={() => onChoice('erase')}
        />
      </div>
      {error === 'choose' && (
        <p className="mt-2 self-start text-[11.5px] font-medium text-danger">Choose one to continue.</p>
      )}
      {choice === 'erase' && (
        <div
          className={`mt-2 w-full text-left rounded-[12px] border px-3 py-2.5 animate-slideDown ${
            error === 'backup' ? 'border-danger bg-danger-bg/50' : 'border-warn/30 bg-warn-bg/60'
          }`}
        >
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={backupAck}
              onChange={(e) => onBackup(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-brand shrink-0"
            />
            <span className="text-[12px] text-ink leading-snug">
              I’ve backed up what I need, and I’m responsible for my data
            </span>
          </label>
          {error === 'backup' && (
            <p className="mt-1.5 text-[11.5px] font-medium text-danger">Confirm your backup before you erase.</p>
          )}
        </div>
      )}
    </div>
  )
}

function ChoiceCard({ active, error, label, sub, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 rounded-[12px] border-[1.5px] px-3 py-2.5 text-left transition-colors ${
        active
          ? 'border-brand bg-brand-bg/50'
          : error
            ? 'border-danger bg-surface'
            : 'border-line bg-surface hover:border-brand/40'
      }`}
    >
      <span
        className={`w-[15px] h-[15px] rounded-full border-2 grid place-items-center shrink-0 ${
          active ? 'border-brand' : 'border-line'
        }`}
      >
        {active && <span className="w-[7px] h-[7px] rounded-full bg-brand" />}
      </span>
      <span className="flex-1">
        <span className="block text-[13px] font-semibold text-ink">{label}</span>
        <span className="block text-[11.5px] text-muted">{sub}</span>
      </span>
    </button>
  )
}

function StepScreen({ step, variant, dir, fill, carouselIdx, setCarouselIdx, onHelp }) {
  const Mock = mockFor(step, variant.id)
  const isCarousel = Array.isArray(Mock?.screens)
  const path = step.path?.map(fill)
  const os = step.frame === 'phone' ? 'ios' : variant.os
  return (
    <div
      className="px-5 pt-5 pb-5 flex flex-col items-center text-center"
      style={{ animation: stepAnim(dir) }}
    >
      {Mock ? (
        isCarousel ? (
          <Mock idx={carouselIdx} onIdxChange={setCarouselIdx} />
        ) : (
          <Mock noun={variant.noun} />
        )
      ) : path ? (
        <PathScreen os={os} frame={step.frame} path={path} />
      ) : (
        <StepIllustration frame={step.frame ?? variant.frame} label={variant.label} />
      )}
      <h2 className="mt-4 text-[20px] font-bold text-ink leading-tight">{fill(step.title)}</h2>
      {path && (
        <p className="mt-1.5 text-[11.5px] font-semibold text-brand leading-snug max-w-[320px]">
          {path.join(' › ')}
        </p>
      )}
      <p className="mt-2 text-[13.5px] text-ink-2 leading-[1.55] max-w-[320px]">{fill(step.body)}</p>
      {step.notes?.length > 0 && (
        <ul className="mt-3 w-full max-w-[320px] flex flex-col gap-1.5 text-left">
          {step.notes.map((n) => (
            <li key={n.when} className="rounded-[10px] bg-brand-bg/60 px-3 py-2 text-[12px] leading-snug text-ink-2">
              <span className="font-semibold text-brand">{n.when}:</span> {fill(n.text)}
            </li>
          ))}
        </ul>
      )}
      {step.help && (
        <button
          onClick={() => onHelp(step.help.to)}
          className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand"
        >
          {step.help.label}
          <ArrowRight size={13} strokeWidth={2.4} />
        </button>
      )}
      {step.trouble && <Trouble trouble={step.trouble} />}
    </div>
  )
}

// Account recovery: a question (`ask` + `options`) or a numbered fix.
function RecoveryNode({ fill, node, onPick }) {
  if (node.ask) {
    return (
      <div className="px-5 pt-6 pb-5 animate-fadeIn">
        <h2 className="text-[20px] font-bold text-ink leading-tight text-center">{fill(node.ask)}</h2>
        {node.sub && <p className="mt-2 text-[13px] text-ink-2 leading-[1.5] text-center">{fill(node.sub)}</p>}
        <div className="mt-5 flex flex-col gap-2.5">
          {node.options.map((o) => (
            <WhereButton key={o.label} title={fill(o.label)} sub={fill(o.sub)} onClick={() => onPick(o.to)} />
          ))}
        </div>
      </div>
    )
  }
  let n = 0
  return (
    <div className="px-5 pt-5 pb-5 animate-fadeIn">
      <h2 className="text-[20px] font-bold text-ink leading-tight">{fill(node.title)}</h2>
      {node.body && <p className="mt-2 text-[13.5px] text-ink-2 leading-[1.55]">{fill(node.body)}</p>}
      {node.steps.length > 0 && (
        <ol className="mt-4 flex flex-col">
          {node.steps.map((st, idx) =>
            st.section ? (
              <li
                key={`s${idx}`}
                className="mt-1 mb-3 rounded-[10px] bg-warn-bg/60 px-3 py-2 text-[12px] font-semibold text-ink leading-snug"
              >
                {fill(st.section)}
              </li>
            ) : (
              <FixStep key={idx} n={++n} step={st} fill={fill} onPick={onPick} />
            ),
          )}
        </ol>
      )}
      {node.tip && (
        <p className="mt-1 flex items-start gap-1.5 rounded-[10px] bg-brand-bg/60 px-3 py-2 text-[12px] text-ink-2 leading-snug">
          <Info size={13} strokeWidth={2} className="shrink-0 mt-px text-brand" />
          {fill(node.tip)}
        </p>
      )}
      <p className="mt-5 text-center text-[11.5px] font-semibold text-ink-2 leading-snug">{NEVER_ASK}</p>
    </div>
  )
}

function FixStep({ n, step, fill, onPick }) {
  return (
    <li className="relative flex gap-3 pb-4 last:pb-3">
      <span className="w-6 h-6 rounded-full bg-brand text-white text-[12px] font-bold grid place-items-center shrink-0">
        {n}
      </span>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-[13.5px] text-ink leading-[1.5]">{fill(step.text)}</p>
        {step.path && <PathChips path={step.path.map(fill)} />}
        {step.note && <p className="mt-1.5 text-[12px] text-muted leading-snug">{fill(step.note)}</p>}
        {step.help && (
          <button
            onClick={() => onPick(step.help.to)}
            className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-semibold text-brand"
          >
            {step.help.label}
            <ArrowRight size={12} strokeWidth={2.4} />
          </button>
        )}
      </div>
    </li>
  )
}

function PathChips({ path }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {path.map((p, idx) => {
        const placeholder = /^\[.*\]$/.test(p)
        return (
          <span key={idx} className="inline-flex items-center gap-1">
            {idx > 0 && <span className="text-[11px] text-muted">›</span>}
            <span
              className={`inline-flex items-center rounded-[6px] px-1.5 h-[22px] text-[11.5px] font-semibold ${
                placeholder ? 'border border-dashed border-brand/40 text-brand italic' : 'bg-brand-bg text-brand'
              }`}
            >
              {placeholder ? p.slice(1, -1) : p}
            </span>
          </span>
        )
      })}
    </div>
  )
}

function WhereButton({ icon: Icon, title, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-[16px] border-2 border-line bg-surface px-4 py-3.5 flex items-center gap-3 hover:border-brand/50 transition-colors"
    >
      {Icon && (
        <span className="w-10 h-10 rounded-full bg-brand-bg text-brand grid place-items-center shrink-0">
          <Icon size={19} strokeWidth={2} />
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block text-[14.5px] font-semibold text-ink">{title}</span>
        {sub && <span className="block text-[12px] text-muted leading-snug">{sub}</span>}
      </span>
      <ArrowRight size={18} strokeWidth={2.2} className="text-muted shrink-0" />
    </button>
  )
}

const DONE_COPY = {
  erased: {
    title: 'Your {noun} {is} erased and unlinked',
    sub: 'Leave it at the setup screen — don’t set it up again. It’s ready for pickup.',
  },
  kept: {
    title: 'Your {noun} {is} ready to send',
    sub: 'It’s unlinked from your accounts and the locks are off. Your data stays on it.',
  },
  plain: {
    title: 'Your {noun} {is} ready to send',
    sub: 'It’s removed from your account, so it won’t lock again.',
  },
}

function Done({ guide, fill, via, erased }) {
  const copy =
    via === 'cant_use'
      ? {
          title: 'Your {noun} {is} unlinked',
          sub: 'It’s off your account, so your claim goes ahead. If it still reaches us locked, we’ll contact you with the next step.',
        }
      : guide.id === 'no_reset'
        ? { title: 'All set', sub: 'Pack everything that came in the box.' }
        : DONE_COPY[erased === true ? 'erased' : erased === false ? 'kept' : 'plain']
  return (
    <div className="min-h-full px-5 py-8 flex flex-col items-center justify-center text-center animate-fadeIn">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-success-bg" />
        <div className="absolute inset-0 grid place-items-center text-success">
          <CheckCircle2 size={40} strokeWidth={1.9} />
        </div>
      </div>
      <h2 className="mt-4 text-[21px] font-bold text-ink leading-tight">{fill(copy.title)}</h2>
      <p className="mt-2 text-[13.5px] text-ink-2 leading-[1.5] max-w-[300px]">{copy.sub}</p>
    </div>
  )
}

function Progress({ current, total }) {
  return (
    <div>
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }, (_, idx) => (
          <span key={idx} className="flex-1 h-1.5 rounded-full overflow-hidden bg-line">
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

function Trouble({ trouble }) {
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
        </div>
      )}
    </div>
  )
}
