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
  Truck,
  KeyRound,
  Info,
  Lock,
  PowerOff,
  Disc,
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
  AndroidTabletRemoveGoogle,
  AndroidTabletSignOutCarousel,
  AndroidTabletFactoryReset,
  AndroidTabletWelcome,
  IpadSettingsSignOut,
  IpadSettingsErase,
  IpadHelloScreen,
  MacSignOut,
  MacErase,
  MacWelcome,
  IosWallet,
  IosFindMyOff,
  IosPasscodeOff,
  IpadWallet,
  IpadFindMyOff,
  IpadPasscodeOff,
  SamsungLockSwipe,
  AndroidTabletLockSwipe,
  WindowsSetup,
  PathScreen,
} from './resetGuideMocks'
import { StepIllustration, GuideIntroArt } from './resetGuideFrames'
import PasscodeField from './PasscodeField'
import { ACCOUNT_RECOVERY, NEVER_ASK } from '../../data/resetGuides'
import {
  guideById,
  effectiveMode,
  variantFor,
  stepsFor,
  symptomsFor,
  cantUseEntry,
  resolveNode,
  fillNoun,
  passcodeError,
  RESET_MODES,
} from '../../lib/resetGuides'

// Guided reset — one engine that renders any guide definition from
// data/resetGuides/* (G1–G7 + no-reset) in Return or Repair mode. One step per
// screen; "I can't use my device" is reachable from every screen: the customer
// picks what's stopping them, answers at most a question or two, and lands on
// one self-contained numbered fix (lib/resetGuides resolveNode).
// Finishing either path fires onDone({ via, passcodeProvided }) — the caller
// (Step 3 / ResetFailedCard / the sandbox) decides what that unlocks.

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
  tab_remove_google: AndroidTabletRemoveGoogle,
  tab_signout: AndroidTabletSignOutCarousel,
  tab_reset: AndroidTabletFactoryReset,
  tab_welcome: AndroidTabletWelcome,
  mac_signout: MacSignOut,
  mac_erase: MacErase,
  mac_welcome: MacWelcome,
  ios_wallet: IosWallet,
  ios_findmy_off: IosFindMyOff,
  ios_passcode_off: IosPasscodeOff,
  ipad_wallet: IpadWallet,
  ipad_findmy_off: IpadFindMyOff,
  ipad_passcode_off: IpadPasscodeOff,
  sam_lock_swipe: SamsungLockSwipe,
  tab_lock_swipe: AndroidTabletLockSwipe,
  win_setup: WindowsSetup,
}

function mockFor(step, variantId) {
  const key = typeof step.mock === 'string' ? step.mock : step.mock?.[variantId]
  return key ? MOCKS[key] : null
}

export default function ResetGuideSheet({
  guideId = 'apple_mobile',
  mode = 'return',
  facts = {},
  // 'start' | 'with_you' | 'sent' | 'recovery' — opens "I can't use my device"
  // at the symptom picker, the guide's sent fix, or account recovery
  // (ResetFailedCard: the device is already at Revibe → 'sent').
  initialView = 'start',
  // Close via onDone on finish instead of showing the done screen.
  skipDone = false,
  onDone,
  onClose,
}) {
  const guide = guideById(guideId)
  const m = effectiveMode(guide, mode)
  const variant = variantFor(guide, facts.variant)
  const noun = variant.noun
  const fill = (t) => fillNoun(t, noun, variant.plural)
  const direct = initialView !== 'start'

  const [view, setView] = useState(direct ? 'cant_use' : 'intro')
  const [returnTo, setReturnTo] = useState(null)
  const [chip, setChip] = useState(facts.chip ?? null)
  const [chipError, setChipError] = useState(false)
  const [i, setI] = useState(0)
  const [dir, setDir] = useState(1)
  const [carouselIdx, setCarouselIdx] = useState(0)
  const [trail, setTrail] = useState(() => (direct ? cantUseEntry(guide, m, initialView, { variant: variant.id }) : []))
  const [trailBase, setTrailBase] = useState(trail.length)
  const scrollRef = useRef(null)
  const [passcode, setPasscode] = useState('')
  const [passcodeShown, setPasscodeShown] = useState(false)
  const [doneVia, setDoneVia] = useState('guide')

  useEffect(() => {
    setCarouselIdx(0)
  }, [i])

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

  const steps = stepsFor(guide, m, { variant: variant.id, chip })
  const step = steps[i]
  const screens = view === 'steps' ? mockFor(step, variant.id)?.screens : null
  const isCarousel = Array.isArray(screens)
  const atCarouselEnd = !isCarousel || carouselIdx >= screens.length - 1
  const showFinish = atCarouselEnd && i === steps.length - 1
  const pcError = step?.passcode ? passcodeError(passcode, step.passcode) : null
  const node = view === 'cant_use' && trail.length ? resolveNode(guide, m, trail[trail.length - 1], { variant: variant.id }) : null
  const passcodeProvided = !!passcode.trim() && !passcodeError(passcode, guide.steps.find((s) => s.passcode)?.passcode)

  const finish = (via) => {
    const result = { via, passcodeProvided }
    if (skipDone) return onDone(result)
    setDoneVia(via)
    setView('done')
  }
  const start = () => {
    if (guide.branch && !chip) {
      setChipError(true)
      return
    }
    setI(0)
    setDir(1)
    setView('steps')
  }
  const next = () => {
    if (isCarousel && carouselIdx < screens.length - 1) {
      setCarouselIdx((n) => n + 1)
      return
    }
    if (pcError) {
      setPasscodeShown(true)
      return
    }
    setDir(1)
    if (i < steps.length - 1) setI(i + 1)
    else finish('guide')
  }
  const back = () => {
    if (view === 'cant_use') {
      if (trail.length > trailBase) return setTrail((t) => t.slice(0, -1))
      if (returnTo) return setView(returnTo)
      return onClose()
    }
    if (isCarousel && carouselIdx > 0) return setCarouselIdx((n) => n - 1)
    setDir(-1)
    if (i > 0) setI(i - 1)
    else setView('intro')
  }
  const openCantUse = () => {
    setReturnTo(view)
    setTrail([])
    setTrailBase(0)
    setView('cant_use')
  }

  const headerTitle =
    view === 'done'
      ? ''
      : view === 'cant_use'
        ? 'I can’t use my device'
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
              {(view === 'steps' || view === 'cant_use') && (
                <button
                  onClick={back}
                  className="w-8 h-8 -ml-1 rounded-full grid place-items-center text-ink hover:bg-line-2/60 shrink-0"
                  aria-label="Back"
                >
                  <ChevronLeft size={18} strokeWidth={2} />
                </button>
              )}
              <span className="text-[13px] font-bold text-ink truncate">{headerTitle}</span>
              {view !== 'done' && guide.id !== 'no_reset' && <ModeBadge mode={m} />}
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 grid place-items-center rounded-full text-muted hover:bg-line-2/60 shrink-0"
            >
              <X size={18} strokeWidth={2} />
            </button>
          </div>
          {view === 'steps' && (
            <div className="mt-3">
              <Progress current={i + 1} total={steps.length} />
            </div>
          )}
        </header>

        <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
          {view === 'intro' && (
            <Intro
              guide={guide}
              variant={variant}
              mode={m}
              stepCount={steps.length}
              chip={chip}
              chipError={chipError}
              onChip={(id) => {
                setChip(id)
                setChipError(false)
              }}
            />
          )}

          {view === 'steps' && step && (
            <StepScreen
              key={`${step.id}-${i}`}
              step={step}
              guide={guide}
              variant={variant}
              mode={m}
              dir={dir}
              fill={fill}
              carouselIdx={carouselIdx}
              setCarouselIdx={setCarouselIdx}
              passcode={passcode}
              setPasscode={(v) => {
                setPasscode(v)
                setPasscodeShown(false)
              }}
              passcodeErr={passcodeShown ? pcError : null}
            />
          )}

          {view === 'cant_use' && (
            <CantUseFlow
              key={trail.join('/')}
              guide={guide}
              mode={m}
              variantId={variant.id}
              fill={fill}
              node={node}
              onPick={(to) => setTrail((t) => [...t, to])}
            />
          )}

          {view === 'done' && (
            <Done guide={guide} mode={m} fill={fill} via={doneVia} passcodeProvided={passcodeProvided} />
          )}
        </div>

        <footer className="shrink-0 px-4 py-3 border-t border-line">
          {view === 'intro' && (
            <PrimaryButton onClick={start}>
              Start <ArrowRight size={16} strokeWidth={2.4} />
            </PrimaryButton>
          )}
          {view === 'steps' && (
            <PrimaryButton onClick={next}>
              {showFinish ? (
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
            <PrimaryButton onClick={() => (node.resume ? setView(returnTo ?? 'intro') : finish('cant_use'))}>
              {node.resume ? (
                <>
                  <ChevronLeft size={16} strokeWidth={2.4} /> Back to the guide
                </>
              ) : (
                <>
                  Continue with this <ArrowRight size={16} strokeWidth={2.4} />
                </>
              )}
            </PrimaryButton>
          )}
          {view === 'done' && (
            <button
              onClick={() => onDone({ via: doneVia, passcodeProvided })}
              className="w-full h-[48px] rounded-[12px] bg-success text-white font-semibold text-[14.5px] inline-flex items-center justify-center gap-1.5"
            >
              <Check size={16} strokeWidth={2.6} />
              Done
            </button>
          )}
          {(view === 'intro' || view === 'steps') && guide.cantUse && (
            <button
              onClick={openCantUse}
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

function ModeBadge({ mode }) {
  const tone =
    mode === 'repair'
      ? 'bg-accent/10 text-accent'
      : mode === 'single'
        ? 'bg-line-2 text-ink-2'
        : 'bg-brand/10 text-brand'
  return (
    <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-[0.06em] ${tone}`}>
      {mode === 'single' ? 'Return & repair' : RESET_MODES[mode].label}
    </span>
  )
}

const INTRO_COPY = {
  return: {
    title: 'Reset your {noun}',
    sub: 'We’ll unlink it from your accounts and erase it, one step at a time. Back up anything you want to keep first.',
  },
  repair: {
    title: 'Prepare your {noun} for repair',
    sub: 'We’ll lift the locks so the repairer can test it. Your data stays on the device, and you never share an account password.',
  },
  single: {
    title: 'Prepare your {noun}',
    sub: 'The same few steps for a return or a repair — they free it from your Apple Account.',
  },
}

function Intro({ guide, variant, mode, stepCount, chip, chipError, onChip }) {
  const copy = INTRO_COPY[mode]
  return (
    <div className="px-5 pt-6 pb-4 flex flex-col items-center text-center animate-fadeIn">
      <GuideIntroArt variant={variant} />
      <h2 className="mt-3 text-[21px] font-bold text-ink leading-tight">
        {fillNoun(copy.title, variant.noun)}
      </h2>
      <p className="mt-2 text-[13.5px] text-ink-2 leading-[1.5] max-w-[300px]">{copy.sub}</p>
      <div className="mt-3 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-line-2/70 text-ink-2 px-2.5 h-6 text-[11px] font-semibold">
          <Clock size={12} strokeWidth={2} /> ~10 min
        </span>
        <span className="inline-flex items-center rounded-full bg-line-2/70 text-ink-2 px-2.5 h-6 text-[11px] font-semibold">
          {stepCount} {stepCount === 1 ? 'step' : 'steps'}
        </span>
      </div>

      {guide.branch && (
        <div className="mt-5 w-full text-left">
          <div className="text-[13px] font-semibold text-ink">{guide.branch.question}</div>
          <p className="mt-1 text-[11.5px] text-muted leading-snug">{guide.branch.hint}</p>
          <div className="mt-2.5 flex flex-col gap-2">
            {guide.branch.options.map((o) => {
              const active = chip === o.id
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onChip(o.id)}
                  className={`flex items-center gap-2.5 rounded-[12px] border-[1.5px] px-3 py-2.5 text-left transition-colors ${
                    active
                      ? 'border-brand bg-brand-bg/50'
                      : chipError
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
                    <span className="block text-[13px] font-semibold text-ink">{o.label}</span>
                    <span className="block text-[11.5px] text-muted">{o.sub}</span>
                  </span>
                </button>
              )
            })}
          </div>
          {chipError && (
            <p className="mt-1.5 ml-1 text-[11.5px] font-medium text-danger">
              Pick your Mac’s chip — the erase steps depend on it.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function StepScreen({
  step,
  guide,
  variant,
  mode,
  dir,
  fill,
  carouselIdx,
  setCarouselIdx,
  passcode,
  setPasscode,
  passcodeErr,
}) {
  const Mock = mockFor(step, variant.id)
  const isCarousel = Array.isArray(Mock?.screens)
  const path = step.path?.map(fill)
  const os = step.frame === 'phone' ? 'ios' : variant.os
  const biosLine = step.bios ? guide.bios?.[variant.id] : null
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
      {step.revibe && (
        <span className="mt-2 inline-flex items-center rounded-full bg-brand/10 text-brand px-2 h-5 text-[10px] font-bold uppercase tracking-[0.05em]">
          Revibe check
        </span>
      )}
      {biosLine && (
        <div className="mt-3 w-full max-w-[320px] rounded-[12px] border border-line bg-line-2/40 px-3 py-2.5 text-left">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted">
            {variant.label} · open BIOS / UEFI
          </div>
          <p className="mt-0.5 text-[12.5px] text-ink leading-snug">{biosLine}</p>
        </div>
      )}
      {step.notes?.length > 0 && (
        <ul className="mt-3 w-full max-w-[320px] flex flex-col gap-1.5 text-left">
          {step.notes.map((n) => (
            <li key={n.when} className="rounded-[10px] bg-brand-bg/60 px-3 py-2 text-[12px] leading-snug text-ink-2">
              <span className="font-semibold text-brand">{n.when}:</span> {fill(n.text)}
            </li>
          ))}
        </ul>
      )}
      {step.passcode && mode === 'repair' && (
        <PasscodeField kind={step.passcode} value={passcode} onChange={setPasscode} error={passcodeErr} />
      )}
      {step.trouble && <Trouble trouble={step.trouble} />}
    </div>
  )
}

const SYMPTOM_ICONS = { lock: Lock, power: PowerOff, key: KeyRound, truck: Truck, disc: Disc }

function CantUseFlow({ guide, mode, variantId, fill, node, onPick }) {
  if (!node) {
    return (
      <div className="px-5 pt-6 pb-5 animate-fadeIn">
        <h2 className="text-[20px] font-bold text-ink leading-tight text-center">What’s stopping you?</h2>
        <p className="mt-2 text-[13px] text-ink-2 leading-[1.5] text-center">
          Pick the one that fits and we’ll walk you through it.
        </p>
        <div className="mt-5 flex flex-col gap-2.5">
          {symptomsFor(guide, mode, { variant: variantId }).map((s) => (
            <WhereButton
              key={s.id}
              icon={SYMPTOM_ICONS[s.icon] ?? HelpCircle}
              title={fill(s.title)}
              sub={fill(s.sub)}
              onClick={() => onPick(s.to)}
            />
          ))}
        </div>
        <p className="mt-5 text-center text-[11.5px] font-semibold text-ink-2 leading-snug">{NEVER_ASK}</p>
      </div>
    )
  }

  if (node.ask) {
    return (
      <div className="px-5 pt-6 pb-5 animate-fadeIn">
        <h2 className="text-[20px] font-bold text-ink leading-tight text-center">{fill(node.ask)}</h2>
        {node.sub && (
          <p className="mt-2 text-[13px] text-ink-2 leading-[1.5] text-center">{fill(node.sub)}</p>
        )}
        <div className="mt-5 flex flex-col gap-2.5">
          {node.options.map((o) => (
            <WhereButton key={o.label} title={fill(o.label)} sub={fill(o.sub)} onClick={() => onPick(o.to)} />
          ))}
        </div>
      </div>
    )
  }

  let n = 0
  const lastResort = node.resume
    ? []
    : guide.account.map((a) => ACCOUNT_RECOVERY[a]?.nothingWorks).filter(Boolean)
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
      {node.more.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          {node.more.map((o) => (
            <button
              key={o.label}
              onClick={() => onPick(o.to)}
              className="inline-flex items-center gap-1.5 self-start text-[12.5px] font-semibold text-brand py-1"
            >
              <HelpCircle size={14} strokeWidth={2.2} />
              {fill(o.label)}
              <ArrowRight size={13} strokeWidth={2.4} />
            </button>
          ))}
        </div>
      )}
      {!node.resume && (
        <Trouble
          trouble={{
            label: 'If nothing works',
            body: [...lastResort, 'Continue anyway — if it still reaches us locked, we’ll contact you with the next step.'].join(' '),
          }}
        />
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
  return: {
    title: 'Your {noun} {is} at the setup screen',
    sub: 'Leave it there — don’t set it up again. It’s unlinked, erased and ready for pickup.',
  },
  repair: {
    title: 'Your {noun} {is} ready for repair',
    sub: 'The locks are off and your data stays on it.',
  },
  single: {
    title: 'Your {noun} {is} ready to send',
    sub: 'It’s removed from your Apple Account, so it won’t lock again.',
  },
}

function Done({ guide, mode, fill, via, passcodeProvided }) {
  const copy =
    via === 'cant_use'
      ? {
          title: 'Thanks — you can continue',
          sub: 'Your claim goes ahead. If the device still reaches us locked, we’ll contact you with the next step.',
        }
      : guide.id === 'no_reset'
        ? { title: 'All set', sub: 'Pack everything that came in the box.' }
        : DONE_COPY[mode]
  return (
    <div className="min-h-full px-5 py-8 flex flex-col items-center justify-center text-center animate-fadeIn">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full bg-success-bg" />
        <div className="absolute inset-0 grid place-items-center text-success">
          <CheckCircle2 size={40} strokeWidth={1.9} />
        </div>
      </div>
      <h2 className="mt-4 text-[21px] font-bold text-ink leading-tight">{fill(copy.title)}</h2>
      <p className="mt-2 text-[13.5px] text-ink-2 leading-[1.5] max-w-[300px]">
        {copy.sub}
        {passcodeProvided && via === 'guide' && ' Your passcode is stored securely for the repair partner only.'}
      </p>
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
