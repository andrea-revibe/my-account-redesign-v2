import { Check, Paperclip, X, AlertTriangle, FileImage } from 'lucide-react'
import StepHeading from './StepHeading'

const CATEGORIES = [
  { id: 'battery', label: 'Battery draining' },
  { id: 'software', label: 'Software issue' },
  { id: 'physical', label: 'Physical condition' },
  { id: 'screen', label: 'Screen issue' },
  { id: 'charger', label: 'Defective charger' },
  { id: 'overheating', label: 'Overheating' },
  { id: 'camera', label: 'Camera issue' },
]

// Stub filenames cycled when the user "uploads" — there is no real file
// picker in the prototype.
const STUB_FILES = [
  'IMG_proof_2614.jpg',
  'video_evidence.mov',
  'photo_back.heic',
]

export default function Step2IssueDetails({ state, dispatch }) {
  const { category, description, attachmentName } = state.issueDetails

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
        subtitle="Pick a category, describe the issue, and add a photo or short video so our QC team knows what to look for."
      />

      <div className="px-4 flex flex-col gap-4">
        <section className="flex flex-col gap-2">
          <SectionLabel>What's the issue?</SectionLabel>
          <div className="flex flex-col gap-2">
            {CATEGORIES.map((c) => {
              const selected = category === c.id
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() =>
                    dispatch({
                      type: 'SET_ISSUE_DETAILS',
                      value: { category: selected ? null : c.id },
                    })
                  }
                  className={`w-full text-left rounded-[12px] border px-3.5 py-3 flex items-center gap-3 transition-colors ${
                    selected
                      ? 'border-brand bg-brand-bg/40'
                      : 'border-line bg-surface hover:bg-line-2/40'
                  }`}
                >
                  <span
                    aria-hidden
                    className={`w-[18px] h-[18px] rounded-full border-2 grid place-items-center shrink-0 ${
                      selected ? 'border-brand bg-brand' : 'border-line'
                    }`}
                  >
                    {selected && (
                      <Check size={11} strokeWidth={3} className="text-white" />
                    )}
                  </span>
                  <span className="text-[14px] text-ink">{c.label}</span>
                </button>
              )
            })}
          </div>
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

function SectionLabel({ children }) {
  return (
    <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
      {children}
    </div>
  )
}
