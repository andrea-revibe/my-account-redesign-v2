import { useEffect, useState } from 'react'
import {
  Paperclip,
  X,
  AlertTriangle,
  FileImage,
  FileCheck,
  ShieldCheck,
  ExternalLink,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import InlineError from './InlineError'
import { PROOF_GUIDE_LABEL, DEFAULT_PROOF_GUIDE_URL } from './issueSubtypes'
import { conditionGradeOf } from '../../lib/returns'

// Stub filenames cycled when the user "uploads" — there is no real file
// picker in the prototype.
const STUB_FILES = ['IMG_proof_2614.jpg', 'video_evidence.mov', 'photo_back.heic']

// The per-issue media chip at the head of the "For this issue" group. Resolved
// from the subtype's `mediaType`; 'none' (e.g. the catch-all `other`) shows none.
const MEDIA_CHIP_LABELS = {
  screenshot: 'Screenshot',
  video: 'Video',
  photo: 'Photo',
  voice: 'Voice memo',
  none: '',
}

// Universal "for every return" checklist — same four items for every issue.
// Confirms the device wasn't tampered with (screen / camera / accessories) and
// is packed safely. Photos are real customer evidence in public/proof/.
const MINIMUM_PROOF_ITEMS = [
  {
    src: '/proof/minimum-required/minimum-required-proof2.jpg',
    label: 'Screen',
    desc: 'The full front of the device — no cracks, scratches, or marks.',
  },
  {
    src: '/proof/minimum-required/minimum-required-proof4.jpeg',
    label: 'Back & camera',
    desc: 'The back of the device and the camera lenses, undamaged.',
  },
  {
    src: '/proof/minimum-required/minimum-required-proof.jpg',
    label: 'Accessories',
    desc: 'Everything that came with the device (e.g. the charging cable).',
  },
  {
    src: '/proof/minimum-required/minimum-required-proof3.jpeg',
    label: 'Packed safely',
    desc: 'Wrapped in the original plastic sleeve or other protective material.',
  },
]

// One reusable evidence block for every issue subtype: a unified proof card
// (per-issue "For this issue" guidance + worked examples · universal "For every
// return" checklist · one guide link) above the single gated uploader.
export default function IssueEvidence({
  sub,
  order,
  state,
  dispatch,
  error,
  uploaderRef,
}) {
  const { attachmentName } = state.issueDetails
  const examples = sub?.examples || []

  // One lightbox pages across every image in the card: per-issue examples
  // first, then the universal checklist.
  const allImages = [
    ...examples.flatMap((ex) => ex.images),
    ...MINIMUM_PROOF_ITEMS.map((m) => m.src),
  ]
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const openAt = (src) => setLightboxIndex(allImages.indexOf(src))
  const closeLightbox = () => setLightboxIndex(null)
  const stepLightbox = (delta) =>
    setLightboxIndex((i) =>
      i == null ? i : (i + delta + allImages.length) % allImages.length,
    )

  const pickStub = () => {
    const idx = Math.floor(Math.random() * STUB_FILES.length)
    dispatch({ type: 'SET_ISSUE_DETAILS', value: { attachmentName: STUB_FILES[idx] } })
  }
  const removeAttachment = () =>
    dispatch({ type: 'SET_ISSUE_DETAILS', value: { attachmentName: '' } })

  const chipLabel = sub ? MEDIA_CHIP_LABELS[sub.mediaType] || '' : ''
  const showError = error === 'attachment' && !attachmentName

  return (
    <section className="flex flex-col gap-3.5">
      <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
        What good proof looks like
      </div>

      {/* Unified proof card — white surface, one hairline, two labelled groups */}
      <div className="rounded-[14px] border border-line bg-surface p-3.5 flex flex-col gap-3.5">
        {/* GROUP A — for this issue (per-issue, data-driven) */}
        <div className="flex items-start gap-2.5">
          <span className="w-[30px] h-[30px] rounded-[9px] bg-brand-bg text-brand grid place-items-center shrink-0">
            <FileCheck size={16} strokeWidth={1.75} />
          </span>
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted">
                For this issue
              </span>
              {chipLabel && (
                <span className="text-[9.5px] font-bold uppercase tracking-[0.05em] text-brand bg-brand-bg2 rounded-full px-[7px] py-0.5 leading-[1.4]">
                  {chipLabel}
                </span>
              )}
            </div>

            {sub ? (
              <div className="text-[12.5px] leading-[1.45] text-ink-2">{sub.need}</div>
            ) : (
              <div className="text-[12.5px] leading-[1.45] text-muted">
                Pick your issue above and we'll show exactly what to capture for it.
              </div>
            )}

            {sub?.id === 'physical' && <PhysicalConditionNote order={order} />}

            {examples.length > 0 && (
              <div className="flex flex-col gap-2 mt-0.5">
                <div className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-muted">
                  Approved examples
                </div>
                {examples.map((ex, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className="flex gap-1.5 shrink-0">
                      {ex.images.map((src) => (
                        <ProofThumb
                          key={src}
                          src={src}
                          alt={ex.caption}
                          onOpen={() => openAt(src)}
                        />
                      ))}
                    </div>
                    <div className="text-[11px] leading-[1.4] text-ink-2 flex-1 min-w-0">
                      {ex.caption}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* hairline divider between the two proof concepts */}
        <div className="h-px bg-line-2 -mx-0.5" />

        {/* GROUP B — for every return (universal, identical for every issue) */}
        <div className="flex items-start gap-2.5">
          <span className="w-[30px] h-[30px] rounded-[9px] bg-brand-bg text-brand grid place-items-center shrink-0">
            <ShieldCheck size={16} strokeWidth={1.75} />
          </span>
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted">
                For every return
              </span>
              <span className="text-[10px] font-semibold text-muted">· 4 photos</span>
            </div>
            {MINIMUM_PROOF_ITEMS.map((m) => (
              <div key={m.src} className="flex items-center gap-2.5">
                <ProofThumb
                  src={m.src}
                  alt={m.label}
                  onOpen={() => openAt(m.src)}
                  variant="checklist"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-semibold text-ink">{m.label}</div>
                  <div className="text-[11px] leading-[1.4] text-ink-2 mt-px">
                    {m.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* single guide link */}
        <a
          href={(sub && sub.proofGuideUrl) || DEFAULT_PROOF_GUIDE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand hover:underline"
        >
          {PROOF_GUIDE_LABEL}
          <ExternalLink size={11} strokeWidth={2} />
        </a>
      </div>

      {/* The uploader — the one gated action. Required reinforcement folds into
          the empty drop-zone; no standalone warn banner. */}
      <div ref={uploaderRef}>
        {attachmentName ? (
          <AttachedFile
            name={attachmentName}
            onAddAnother={pickStub}
            onRemove={removeAttachment}
          />
        ) : (
          <UploadDropzone onPick={pickStub} error={showError} />
        )}
      </div>
      {showError && (
        <InlineError>Attach a photo or video — it's required.</InlineError>
      )}

      {lightboxIndex != null && (
        <ProofLightbox
          images={allImages}
          index={lightboxIndex}
          onClose={closeLightbox}
          onStep={stepLightbox}
        />
      )}
    </section>
  )
}

function UploadDropzone({ onPick, error }) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`w-full rounded-[14px] border-2 border-dashed bg-surface hover:bg-brand-bg/20 px-4 py-[18px] flex flex-col items-center gap-1.5 transition-colors ${
        error ? 'border-danger' : 'border-line hover:border-brand'
      }`}
    >
      <span className="w-10 h-10 rounded-full bg-brand-bg text-brand grid place-items-center">
        <Paperclip size={18} strokeWidth={1.75} />
      </span>
      <span className="text-[14px] font-semibold text-ink">Add photos or video</span>
      <span className="text-[11.5px] text-muted">Up to 100 MB · JPG, PNG, MOV, MP4</span>
      {!error && (
        <span className="inline-flex items-center gap-1.5 mt-1 text-[11px] font-semibold text-warn">
          <AlertTriangle size={13} strokeWidth={1.9} />
          Required — claims without proof are often rejected or delayed
        </span>
      )}
    </button>
  )
}

function AttachedFile({ name, onAddAnother, onRemove }) {
  return (
    <div className="rounded-[14px] border border-line bg-surface px-3.5 py-3 flex items-center gap-3">
      <span className="w-9 h-9 rounded-[10px] bg-brand-bg text-brand grid place-items-center shrink-0">
        <FileImage size={16} strokeWidth={1.75} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-semibold text-ink truncate">{name}</span>
        <span className="block text-[11.5px] text-muted">
          Attached ·{' '}
          <button
            type="button"
            onClick={onAddAnother}
            className="text-brand font-semibold hover:underline"
          >
            Add another
          </button>
        </span>
      </span>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove attachment"
        className="w-8 h-8 rounded-full grid place-items-center text-ink-2 hover:bg-line-2 shrink-0"
      >
        <X size={16} strokeWidth={1.75} />
      </button>
    </div>
  )
}

function PhysicalConditionNote({ order }) {
  const grade = conditionGradeOf(order)
  if (!grade || grade === 'excellent') return null
  const gradeLabel = grade.charAt(0).toUpperCase() + grade.slice(1)
  return (
    <div className="flex items-start gap-2 rounded-[10px] border border-warn-bg bg-warn-bg/60 px-3 py-2 text-[11.5px] text-ink leading-[1.4]">
      <AlertTriangle
        size={13}
        strokeWidth={1.75}
        className="text-warn shrink-0 mt-px"
      />
      <span>
        Your device is graded <span className="font-semibold">{gradeLabel}</span>, so
        some signs of previous use — light scratches or surface marks — are expected at
        this grade and aren’t treated as a defect.
      </span>
    </div>
  )
}

// Tappable proof thumbnail → opens the lightbox. Carries a subtle zoom overlay
// (touch has no hover, so it's always shown); `variant` only sets the size —
// `example` (group A) vs the slightly smaller `checklist` (group B).
function ProofThumb({ src, alt, onOpen, variant = 'example' }) {
  const size = variant === 'checklist' ? 'w-[42px] h-[52px]' : 'w-[46px] h-[58px]'
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="View example evidence full size"
      className={`relative ${size} rounded-[8px] overflow-hidden border border-line bg-line-2 shrink-0 block`}
    >
      <img src={src} alt={alt} loading="lazy" className="w-full h-full object-cover" />
      <span className="absolute inset-0 grid place-items-center bg-black/10">
        <Maximize2 size={13} strokeWidth={2} className="text-white" />
      </span>
    </button>
  )
}

function ProofLightbox({ images, index, onClose, onStep }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') onStep(-1)
      else if (e.key === 'ArrowRight') onStep(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onStep])

  const multiple = images.length > 1

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20"
      >
        <X size={20} strokeWidth={2} />
      </button>

      <div className="w-full max-w-[430px] h-full flex items-center justify-center px-6 py-16">
        <img
          src={images[index]}
          alt="Example evidence"
          onClick={(e) => e.stopPropagation()}
          className="max-w-full max-h-full w-auto object-contain rounded-[12px] shadow-2xl"
        />
      </div>

      {multiple && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onStep(-1)
            }}
            aria-label="Previous"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20"
          >
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onStep(1)
            }}
            aria-label="Next"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 text-white grid place-items-center hover:bg-white/20"
          >
            <ChevronRight size={20} strokeWidth={2} />
          </button>
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-[12px] text-white/80 tabular-nums">
            {index + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  )
}
