import { useState } from 'react'
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
} from 'lucide-react'
import StepHeading from './StepHeading'
import {
  ISSUE_SCOPES,
  NOT_WORKING_SUBTYPES,
  WRONG_DEVICE_SUBTYPES,
  PROOF_GUIDE_LABEL,
  scopeForSubtype,
  findSubtype,
} from './issueSubtypes'

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

export default function Step2IssueDetails({ state, dispatch }) {
  const { description, attachmentName } = state.issueDetails
  const { issueScope, issueSubtypeId } = state

  const [openScope, setOpenScope] = useState(
    issueScope || (issueSubtypeId ? scopeForSubtype(issueSubtypeId) : null),
  )

  const selectedSubtype = issueSubtypeId ? findSubtype(issueSubtypeId) : null

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
        <section className="flex flex-col gap-2">
          <SectionLabel>What's the issue?</SectionLabel>
          {selectedSubtype ? (
            <SelectedSubtype
              sub={selectedSubtype}
              onRemove={clearSelection}
            />
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
        </section>

        <section className="flex flex-col gap-2">
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
            className="w-full rounded-[12px] border border-line bg-surface px-3.5 py-3 text-[14px] text-ink placeholder:text-muted resize-none min-h-[112px] outline-none focus:border-brand"
          />
          <div className="text-right text-[11px] text-muted tabular-nums">
            {description.length}/500
          </div>
        </section>

        <section className="flex flex-col gap-2">
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
              className="w-full rounded-[12px] border-2 border-dashed border-line bg-surface hover:border-brand hover:bg-brand-bg/20 px-4 py-5 flex flex-col items-center gap-1.5 transition-colors"
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

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
      {children}
    </div>
  )
}
