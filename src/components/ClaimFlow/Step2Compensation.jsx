import {
  Paperclip,
  X,
  AlertTriangle,
  FileImage,
  ChevronRight,
  FileCheck,
  Info,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'
import { COMPENSATION_SUBTYPES, findCompensationSubtype } from './compensationSubtypes'

// Stub filenames cycled when the user "uploads" — there is no real file
// picker in the prototype. Mirrors Step2IssueDetails.
const STUB_FILES = [
  'shipping_receipt.jpg',
  'charger_test.mov',
  'order_confirmation.png',
]

export default function Step2Compensation({ state, dispatch, error }) {
  const { description, attachmentName } = state.issueDetails
  const selected = state.compensationSubtype
    ? findCompensationSubtype(state.compensationSubtype)
    : null

  const errorRef = useRef(null)
  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [error])

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
        title="What's the problem?"
        subtitle="You'll keep your device — we'll sort out the rest."
      />

      <div className="px-4 flex flex-col gap-4">
        <section
          className="flex flex-col gap-2"
          ref={error === 'subtype' ? errorRef : null}
        >
          <SectionLabel>What happened?</SectionLabel>
          <div className="flex flex-col gap-2">
            {COMPENSATION_SUBTYPES.map((t) => {
              const isSelected = state.compensationSubtype === t.id
              const Icon = t.icon
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: 'SET_COMPENSATION_SUBTYPE',
                      value: t.id,
                    })
                  }
                  aria-pressed={isSelected}
                  className={`w-full text-left rounded-[12px] border px-3.5 py-3 flex items-center gap-3 transition-colors ${
                    isSelected
                      ? 'border-brand bg-brand-bg/50'
                      : 'border-line bg-surface hover:bg-line-2/40'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-[9px] grid place-items-center shrink-0 ${
                      isSelected ? 'bg-brand text-white' : 'bg-line-2 text-ink-2'
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] font-semibold text-ink">
                      {t.label}
                    </span>
                    <span className="block text-[11.5px] text-muted mt-0.5">
                      {t.sub}
                    </span>
                  </span>
                  <ChevronRight
                    size={14}
                    strokeWidth={1.75}
                    className="text-muted shrink-0"
                  />
                </button>
              )
            })}
          </div>
          {selected && (
            <div className="mt-0.5 rounded-[10px] border border-brand/30 bg-brand-bg/30 px-3 py-2.5 flex items-start gap-2">
              <FileCheck
                size={13}
                strokeWidth={1.75}
                className="text-ink-2 shrink-0 mt-0.5"
              />
              <div className="text-[11.5px] leading-[1.45] text-ink-2">
                <span className="font-semibold text-ink">What we need.</span>{' '}
                {selected.need}
              </div>
            </div>
          )}
          {error === 'subtype' && (
            <InlineError>Pick what happened to continue.</InlineError>
          )}
        </section>

        <div className="flex items-start gap-2.5 rounded-[12px] border border-amber-200 bg-amber-50 px-3.5 py-3 text-[12px] leading-[1.45] text-amber-900">
          <Info size={15} strokeWidth={2} className="text-amber-600 shrink-0 mt-px" />
          <span>
            We'll raise a claim and an agent will review it — usually within 2
            business days. Your device stays with you.
          </span>
        </div>

        <section
          className="flex flex-col gap-2"
          ref={error === 'description' ? errorRef : null}
        >
          <SectionLabel>Describe what happened</SectionLabel>
          <textarea
            value={description}
            maxLength={500}
            onChange={(e) =>
              dispatch({
                type: 'SET_ISSUE_DETAILS',
                value: { description: e.target.value },
              })
            }
            placeholder="Tell us what went wrong and anything that helps us confirm it…"
            className={`w-full rounded-[12px] border bg-surface px-3.5 py-3 text-[14px] text-ink placeholder:text-muted resize-none min-h-[112px] outline-none ${
              error === 'description'
                ? 'border-danger focus:border-danger'
                : 'border-line focus:border-brand'
            }`}
          />
          <div className="flex items-center justify-between gap-2">
            {error === 'description' ? (
              <InlineError>Describe what happened so we can review it.</InlineError>
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
          <SectionLabel>Proof</SectionLabel>
          {attachmentName ? (
            <div className="rounded-[12px] border border-line bg-surface px-3.5 py-3 flex items-center gap-3">
              <span className="w-9 h-9 rounded-[10px] bg-brand-bg text-brand grid place-items-center shrink-0">
                <FileImage size={16} strokeWidth={1.75} />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-[13.5px] font-semibold text-ink truncate">
                  {attachmentName}
                </span>
                <span className="block text-[11.5px] text-muted">Attached</span>
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
                Add a photo, video, or receipt
              </span>
              <span className="text-[11.5px] text-muted">
                Up to 100 MB · JPG, PNG, MOV, MP4, PDF
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
            <InlineError>Attach proof — it's required.</InlineError>
          )}
        </section>
      </div>
    </>
  )
}

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
      {children}
    </div>
  )
}
