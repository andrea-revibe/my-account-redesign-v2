import { useEffect, useRef, useState } from 'react'
import {
  Paperclip,
  X,
  AlertTriangle,
  FileImage,
  ChevronRight,
  ChevronDown,
  Lightbulb,
  FileCheck,
  ExternalLink,
  BatteryMedium,
  BatteryCharging,
  CheckCircle2,
  Info,
  Check,
} from 'lucide-react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'
import {
  ISSUE_SCOPES,
  NOT_WORKING_SUBTYPES,
  WRONG_DEVICE_SUBTYPES,
  PROOF_GUIDE_LABEL,
  scopeForSubtype,
  findSubtype,
} from './issueSubtypes'
import { assessBattery, conditionGradeOf } from '../../lib/returns'

const SUBTYPES_BY_SCOPE = {
  not_working: NOT_WORKING_SUBTYPES,
  wrong_device: WRONG_DEVICE_SUBTYPES,
}

// Stub filenames cycled when the user "uploads" — there is no real file
// picker in the prototype.
const STUB_FILES = [
  'IMG_proof_2614.jpg',
  'video_evidence.mov',
  'photo_back.heic',
]

export default function Step2IssueDetails({ state, dispatch, order, error }) {
  const { description, attachmentName } = state.issueDetails
  const { issueScope, issueSubtypeId } = state

  const [openScope, setOpenScope] = useState(
    issueScope || (issueSubtypeId ? scopeForSubtype(issueSubtypeId) : null),
  )

  const selectedSubtype = issueSubtypeId ? findSubtype(issueSubtypeId) : null

  const errorRef = useRef(null)
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

  const clearSelection = () => {
    // Preserve the scope so the picker reopens on the same list
    setOpenScope(issueScope || openScope)
    dispatch({ type: 'SET_ISSUE_SUBTYPE', scope: null, id: null })
  }

  const pickStub = () => {
    const idx = Math.floor(Math.random() * STUB_FILES.length)
    dispatch({
      type: 'SET_ISSUE_DETAILS',
      value: { attachmentName: STUB_FILES[idx] },
    })
  }

  return (
    <>
      <StepHeading
        title="Tell us what went wrong"
        subtitle="Pick what matches your situation, describe it briefly, and attach a photo or short video so QC knows what to look for."
      />

      <div className="px-4 flex flex-col gap-4">
        <section
          className="flex flex-col gap-2"
          ref={error === 'subtype' ? errorRef : null}
        >
          <SectionLabel>What's the issue?</SectionLabel>
          {selectedSubtype ? (
            <>
              <SelectedSubtype sub={selectedSubtype} onRemove={clearSelection} />
              {issueSubtypeId === 'battery' && order && (
                <BatteryHealthCheck
                  order={order}
                  value={state.batteryCheck}
                  onChange={(value) =>
                    dispatch({ type: 'SET_BATTERY_CHECK', value })
                  }
                />
              )}
            </>
          ) : (
            <div className="flex flex-col gap-2">
              {ISSUE_SCOPES.map((scope) => {
                const isOpen = openScope === scope.id
                const items = SUBTYPES_BY_SCOPE[scope.id]
                return (
                  <div key={scope.id} className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenScope(isOpen ? null : scope.id)}
                      aria-expanded={isOpen}
                      className={`w-full text-left rounded-[12px] border px-3.5 py-3 flex items-center gap-3 transition-colors ${
                        isOpen
                          ? 'border-line bg-line-2/40'
                          : 'border-line bg-surface hover:bg-line-2/40'
                      }`}
                    >
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13.5px] font-semibold text-ink">
                          {scope.label}
                        </span>
                        <span className="block text-[11.5px] text-muted mt-0.5">
                          {scope.sub}
                        </span>
                      </span>
                      {isOpen ? (
                        <ChevronDown
                          size={14}
                          strokeWidth={1.75}
                          className="text-muted shrink-0"
                        />
                      ) : (
                        <ChevronRight
                          size={14}
                          strokeWidth={1.75}
                          className="text-muted shrink-0"
                        />
                      )}
                    </button>

                    {isOpen && (
                      <div className="pl-3 flex flex-col gap-1.5">
                        {items.map((sub) => (
                          <SubIssueRow
                            key={sub.id}
                            sub={sub}
                            onSelect={() =>
                              dispatch({
                                type: 'SET_ISSUE_SUBTYPE',
                                scope: scope.id,
                                id: sub.id,
                              })
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          {error === 'subtype' && (
            <InlineError>Select what's wrong to continue.</InlineError>
          )}
        </section>

        <section
          className="flex flex-col gap-2"
          ref={error === 'description' ? errorRef : null}
        >
          <SectionLabel>Describe the issue</SectionLabel>
          <textarea
            value={description}
            maxLength={500}
            onChange={(e) =>
              dispatch({
                type: 'SET_ISSUE_DETAILS',
                value: { description: e.target.value },
              })
            }
            placeholder="What happens, when it started, anything you've already tried…"
            className={`w-full rounded-[12px] border bg-surface px-3.5 py-3 text-[14px] text-ink placeholder:text-muted resize-none min-h-[112px] outline-none ${
              error === 'description'
                ? 'border-danger focus:border-danger'
                : 'border-line focus:border-brand'
            }`}
          />
          <div className="flex items-center justify-between gap-2">
            {error === 'description' ? (
              <InlineError>Add a short description so QC knows what to look for.</InlineError>
            ) : (
              <span />
            )}
            <div className="text-right text-[11px] text-muted tabular-nums shrink-0">
              {description.length}/500
            </div>
          </div>
        </section>

        <section
          className="flex flex-col gap-2"
          ref={error === 'attachment' ? errorRef : null}
        >
          <SectionLabel>Photo or video of the issue</SectionLabel>
          {attachmentName ? (
            <div className="rounded-[12px] border border-line bg-surface px-3.5 py-3 flex items-center gap-3">
              <span className="w-9 h-9 rounded-[10px] bg-brand-bg text-brand grid place-items-center shrink-0">
                <FileImage size={16} strokeWidth={1.75} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13.5px] font-semibold text-ink truncate">
                  {attachmentName}
                </span>
                <span className="block text-[11.5px] text-muted">
                  Attached
                </span>
              </span>
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'SET_ISSUE_DETAILS',
                    value: { attachmentName: '' },
                  })
                }
                aria-label="Remove attachment"
                className="w-8 h-8 rounded-full grid place-items-center text-ink-2 hover:bg-line-2"
              >
                <X size={16} strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={pickStub}
              className={`w-full rounded-[12px] border-2 border-dashed bg-surface hover:bg-brand-bg/20 px-4 py-5 flex flex-col items-center gap-1.5 transition-colors ${
                error === 'attachment'
                  ? 'border-danger'
                  : 'border-line hover:border-brand'
              }`}
            >
              <span className="w-10 h-10 rounded-full bg-brand-bg text-brand grid place-items-center">
                <Paperclip size={18} strokeWidth={1.75} />
              </span>
              <span className="text-[14px] font-semibold text-ink">
                Add a photo or video
              </span>
              <span className="text-[11.5px] text-muted">
                Up to 100 MB · JPG, PNG, MOV, MP4
              </span>
            </button>
          )}
          <div className="flex items-start gap-2 rounded-[12px] border border-warn-bg bg-warn-bg/60 px-3 py-2.5 text-[12px] text-ink leading-[1.4]">
            <AlertTriangle
              size={14}
              strokeWidth={1.75}
              className="text-warn shrink-0 mt-px"
            />
            <span>
              Required — claims without proof are often rejected or delayed.
            </span>
          </div>
          {error === 'attachment' && (
            <InlineError>Attach a photo or video — it's required.</InlineError>
          )}
        </section>
      </div>
    </>
  )
}

function SubIssueRow({ sub, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full text-left rounded-[10px] border border-line bg-surface hover:bg-line-2/40 px-3 py-2.5 flex items-center gap-2 transition-colors"
    >
      <span className="block flex-1 min-w-0 text-[13px] text-ink-2">
        {sub.label}
      </span>
      <ChevronRight
        size={12}
        strokeWidth={1.75}
        className="text-muted shrink-0"
      />
    </button>
  )
}

function SelectedSubtype({ sub, onRemove }) {
  return (
    <div className="flex flex-col">
      <div className="w-full rounded-[12px] border border-brand bg-brand-bg/50 px-3.5 py-3 flex items-center gap-2">
        <span className="block flex-1 min-w-0 text-[13.5px] font-semibold text-ink">
          {sub.label}
        </span>
        <button
          type="button"
          onClick={onRemove}
          aria-label="Change selection"
          className="w-7 h-7 rounded-full grid place-items-center text-ink-2 hover:bg-line-2 shrink-0"
        >
          <X size={15} strokeWidth={1.75} />
        </button>
      </div>
      <div className="mt-1.5 rounded-[10px] border border-brand/30 bg-brand-bg/30 px-3 py-2.5 flex flex-col gap-2">
        {sub.tryFirst && (
          <div className="flex items-start gap-2">
            <Lightbulb
              size={13}
              strokeWidth={1.75}
              className="text-ink-2 shrink-0 mt-0.5"
            />
            <div className="text-[11.5px] leading-[1.45] text-ink-2">
              <span className="font-semibold text-ink">Try this first.</span>{' '}
              {sub.tryFirst}
            </div>
          </div>
        )}
        <div className="flex items-start gap-2">
          <FileCheck
            size={13}
            strokeWidth={1.75}
            className="text-ink-2 shrink-0 mt-0.5"
          />
          <div className="text-[11.5px] leading-[1.45] text-ink-2">
            <span className="font-semibold text-ink">What we need.</span>{' '}
            {sub.need}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => e.preventDefault()}
          className="self-start inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand hover:underline"
        >
          {PROOF_GUIDE_LABEL}
          <ExternalLink size={11} strokeWidth={2} />
        </button>
      </div>
    </div>
  )
}

function BatteryHealthCheck({ order, value, onChange }) {
  const { capacity, nonOriginal } = value
  const [showThresholds, setShowThresholds] = useState(false)
  const assessment = assessBattery({ order, capacity, nonOriginal })
  const { baseline, days } = assessment
  const grade = conditionGradeOf(order)
  const gradeLabel = grade ? grade.charAt(0).toUpperCase() + grade.slice(1) : null
  const showResult = nonOriginal || assessment.capacity != null

  return (
    <section className="flex flex-col gap-2 mt-1">
      <SectionLabel>
        Battery check{' '}
        <span className="text-muted font-medium normal-case tracking-normal">
          · optional
        </span>
      </SectionLabel>
      <div className="rounded-[12px] border border-line bg-surface p-3.5 flex flex-col gap-3">
        <div className="flex items-start gap-2.5">
          <span className="w-9 h-9 rounded-[10px] bg-brand-bg text-brand grid place-items-center shrink-0">
            <BatteryMedium size={16} strokeWidth={1.75} />
          </span>
          <div className="text-[12px] leading-[1.45] text-ink-2">
            Enter the figure from{' '}
            <span className="font-semibold text-ink">
              Settings → Battery → Battery Health
            </span>{' '}
            to see your likely outcome.
            {baseline != null && gradeLabel && (
              <>
                {' '}Your {gradeLabel} device was guaranteed at least{' '}
                <span className="font-semibold text-ink">{baseline}%</span> at
                delivery
                {days != null && (
                  <>
                    , delivered{' '}
                    <span className="font-semibold text-ink">
                      {days} day{days === 1 ? '' : 's'} ago
                    </span>
                  </>
                )}
                .
              </>
            )}
          </div>
        </div>

        <label className="flex items-center gap-2 rounded-[10px] border border-line bg-canvas px-3 py-2.5 focus-within:border-brand">
          <span className="text-[13px] text-ink-2 flex-1">
            Current battery capacity
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={100}
            value={capacity}
            onChange={(e) =>
              onChange({ capacity: e.target.value.replace(/[^0-9]/g, '').slice(0, 3) })
            }
            placeholder="—"
            className="w-14 text-right bg-transparent text-[15px] font-semibold text-ink tabular-nums outline-none placeholder:text-muted"
          />
          <span className="text-[14px] font-semibold text-muted">%</span>
        </label>

        <button
          type="button"
          onClick={() => onChange({ nonOriginal: !nonOriginal })}
          className="flex items-start gap-2.5 text-left"
        >
          <span
            className={`mt-px w-[18px] h-[18px] rounded-[6px] border grid place-items-center shrink-0 transition-colors ${
              nonOriginal
                ? 'bg-brand border-brand text-white'
                : 'border-line bg-surface'
            }`}
          >
            {nonOriginal && <Check size={12} strokeWidth={3} />}
          </span>
          <span className="text-[12px] leading-[1.4] text-ink-2">
            My phone shows a message that the{' '}
            <span className="font-semibold text-ink">
              battery or a part isn’t original
            </span>
            .
          </span>
        </button>

        {showResult && <BatteryVerdict assessment={assessment} />}

        <div className="border-t border-line -mx-3.5 px-3.5 pt-2.5 -mb-0.5">
          <button
            type="button"
            onClick={() => setShowThresholds((v) => !v)}
            aria-expanded={showThresholds}
            className="w-full flex items-center justify-between gap-2 text-left"
          >
            <span className="text-[12px] font-semibold text-ink-2">
              What counts as a battery defect?
            </span>
            <ChevronDown
              size={14}
              strokeWidth={2}
              className="text-muted shrink-0 transition-transform"
              style={{ transform: showThresholds ? 'rotate(180deg)' : 'none' }}
            />
          </button>
          {showThresholds && <BatteryThresholds />}
        </div>
      </div>
    </section>
  )
}

// §7.2 thresholds, surfaced verbatim so the customer can see why the
// verdict landed where it did (and what "normal wear" means).
const BATTERY_THRESHOLDS = [
  {
    window: 'Within 10 days of delivery',
    rule: 'More than 3% below the guaranteed capacity',
    remedy: 'Full refund',
  },
  {
    window: 'Within 6 months',
    rule: 'More than 10% degradation',
    remedy: 'Free battery replacement',
  },
  {
    window: 'Within 12 months',
    rule: 'More than 20% degradation',
    remedy: 'Free battery replacement',
  },
]

function BatteryThresholds() {
  return (
    <div className="mt-2 flex flex-col gap-2 animate-slideDown">
      {BATTERY_THRESHOLDS.map((t) => (
        <div
          key={t.window}
          className="rounded-[10px] border border-line bg-canvas px-3 py-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11.5px] font-semibold text-ink">
              {t.window}
            </span>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.04em] text-brand shrink-0">
              {t.remedy}
            </span>
          </div>
          <div className="text-[11.5px] text-ink-2 leading-[1.4] mt-0.5">
            {t.rule}
          </div>
        </div>
      ))}
      <div className="text-[11px] text-muted leading-[1.45]">
        Anything outside these is treated as normal battery wear, which isn’t a
        covered defect. A phone reporting a non-original battery or part is
        always a full refund.
      </div>
    </div>
  )
}

function BatteryVerdict({ assessment }) {
  const { remedy, reason, baseline, capacity, degradation } = assessment

  const TONES = {
    success: 'border-success/30 bg-success-bg/40',
    brand: 'border-brand/30 bg-brand-bg/40',
    muted: 'border-line bg-line-2/40',
  }
  const ICON_TONES = {
    success: 'text-success',
    brand: 'text-brand',
    muted: 'text-ink-2',
  }

  let tone, Icon, title, body
  if (remedy === 'refund') {
    tone = 'success'
    Icon = CheckCircle2
    title = 'You’re likely entitled to a full refund'
    body =
      reason === 'non_original'
        ? 'A non-original battery or part qualifies for a full refund once the device is returned.'
        : `At ${capacity}%, your battery is more than 3% below the ${baseline}% it was guaranteed — within 10 days of delivery.`
  } else if (remedy === 'replacement') {
    tone = 'brand'
    Icon = BatteryCharging
    title = 'You’re likely entitled to a free battery replacement'
    const windowLabel =
      reason === 'replacement_6m' ? '6 months' : '12 months'
    body = `At ${capacity}%, your battery has degraded ${degradation}% below the ${baseline}% guaranteed — within ${windowLabel} of delivery, that's covered for a free replacement, logistics included.`
  } else {
    tone = 'muted'
    Icon = Info
    title = 'This looks like normal battery wear'
    body = `At ${capacity}%, your battery is within the range we’d expect, so it isn’t treated as a defect on its own. You can still submit — QC will take a look.`
  }

  return (
    <div
      className={`rounded-[10px] border ${TONES[tone]} px-3 py-2.5 flex flex-col gap-1.5 animate-fadeIn`}
    >
      <div className="flex items-start gap-2">
        <Icon
          size={15}
          strokeWidth={1.9}
          className={`${ICON_TONES[tone]} shrink-0 mt-px`}
        />
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold text-ink leading-[1.35]">
            {title}
          </div>
          <div className="text-[11.5px] text-ink-2 leading-[1.45] mt-0.5">
            {body}
          </div>
        </div>
      </div>
      <div className="text-[10.5px] text-muted leading-[1.4] pl-[23px]">
        Estimate only — final eligibility is confirmed by QC after inspection.
      </div>
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
      {children}
    </div>
  )
}
