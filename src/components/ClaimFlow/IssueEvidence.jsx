import { useEffect, useState } from 'react'
import {
  Paperclip,
  X,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  CheckCircle2,
  Lightbulb,
  ExternalLink,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Camera,
  Video,
  Plus,
} from 'lucide-react'
import { PROOF_GUIDE_LABEL, DEFAULT_PROOF_GUIDE_URL } from './issueTaxonomy'
import { conditionGradeOf } from '../../lib/returns'

// Stub filenames cycled when the user "adds" to a slot — there is no real file
// picker in the prototype.
const PHOTO_STUBS = ['IMG_proof_2614.jpg', 'photo_back.heic', 'IMG_4821.jpg']
const VIDEO_STUBS = ['video_evidence.mov', 'clip_2207.mp4']
const pickStub = (media) => {
  const pool = media === 'video' ? VIDEO_STUBS : PHOTO_STUBS
  return pool[Math.floor(Math.random() * pool.length)]
}

// The per-issue media chip(s) at the head of the "For this issue" group. Two
// chip types only — Photo and Video. The catch-all ("Something else") issues
// use `both` to show both, signalling either format is fine.
const MEDIA_CHIPS = {
  photo: ['Photo'],
  video: ['Video'],
  both: ['Photo', 'Video'],
}

// Universal "for every return" proof — the same four items for every issue,
// each its own capture slot (keyed by `id`). Photos are real customer evidence
// in public/proof/.
const MINIMUM_PROOF_ITEMS = [
  {
    id: 'screen',
    src: '/proof/minimum-required/minimum-required-proof2.jpg',
    label: 'Screen',
    desc: 'The full front of the device — no cracks, scratches, or marks.',
  },
  {
    id: 'back_camera',
    src: '/proof/minimum-required/minimum-required-proof4.jpeg',
    label: 'Back & camera',
    desc: 'The back of the device and the camera lenses, undamaged.',
  },
  {
    id: 'accessories',
    src: '/proof/minimum-required/minimum-required-proof.jpg',
    label: 'Accessories',
    desc: 'Everything that came with the device (e.g. the charging cable).',
  },
  {
    id: 'packed',
    src: '/proof/minimum-required/minimum-required-proof3.jpeg',
    label: 'Packed safely',
    desc: 'Wrapped in the original plastic sleeve or other protective material.',
  },
]

// Issue-proof slot label, driven by the issue's media type. `both` collapses to
// one "photo or video" slot (the data treats the two formats as interchangeable).
const ISSUE_SLOT_LABEL = {
  photo: 'Photo of the issue',
  video: 'Video of the issue',
  both: 'Photo or video of the issue',
}

// Guided slotted proof capture. Two modes share one area: a collapsed
// examples/guidance view (what good proof looks like) with an "Add your proof"
// CTA, and an expanded view of per-item upload slots — the universal four plus
// one issue-specific slot. Files live in reducer state (`issueDetails.proofSlots`)
// so collapsing back to the examples never loses them. Proof never gates the
// step (soft warning only); see flowReducer `stepError` 'evidence'.
export default function IssueEvidence({ sub, order, state, dispatch }) {
  const [expanded, setExpanded] = useState(false)
  const proofSlots = state.issueDetails.proofSlots || {}
  const examples = sub?.examples || []

  // One lightbox pages across every image in the examples view: per-issue
  // examples first, then the universal checklist.
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

  // Slot model: the issue slot (driven by media type) + the universal four.
  const issueSlot = sub
    ? {
        id: 'issue',
        label: ISSUE_SLOT_LABEL[sub.mediaType] || ISSUE_SLOT_LABEL.photo,
        media: sub.mediaType === 'video' ? 'video' : 'photo',
        optional: !!sub.proofOptional,
      }
    : null
  const universalSlots = MINIMUM_PROOF_ITEMS.map((m) => ({
    id: m.id,
    label: m.label,
    media: 'photo',
    optional: false,
  }))
  // "Required" = everything except an optional issue slot; drives the counter.
  const requiredSlots = [
    ...(issueSlot && !issueSlot.optional ? [issueSlot] : []),
    ...universalSlots,
  ]
  const filledRequired = requiredSlots.filter((s) => proofSlots[s.id]).length
  const totalRequired = requiredSlots.length
  const complete = filledRequired >= totalRequired
  const chips = sub ? MEDIA_CHIPS[sub.mediaType] || [] : []

  const addToSlot = (slot) =>
    dispatch({
      type: 'SET_ISSUE_DETAILS',
      value: {
        proofSlots: {
          ...proofSlots,
          [slot.id]: { label: slot.label, filename: pickStub(slot.media) },
        },
      },
    })
  const removeSlot = (slot) => {
    const next = { ...proofSlots }
    delete next[slot.id]
    dispatch({ type: 'SET_ISSUE_DETAILS', value: { proofSlots: next } })
  }

  return (
    <section className="flex flex-col gap-3.5">
      {!expanded && (
        <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
          What good proof looks like
        </div>
      )}

      {!expanded ? (
        <>
          {/* Examples card — per-issue guidance + worked examples · universal
              checklist · guide link. The reference the customer collapses back to. */}
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
                  {chips.map((c) => (
                    <span
                      key={c}
                      className="text-[9.5px] font-bold uppercase tracking-[0.05em] text-brand bg-brand-bg2 rounded-full px-[7px] py-0.5 leading-[1.4]"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                {sub ? (
                  <div className="text-[12.5px] leading-[1.45] text-ink-2">{sub.need}</div>
                ) : (
                  <div className="text-[12.5px] leading-[1.45] text-muted">
                    Pick your issue above and we'll show exactly what to capture for it.
                  </div>
                )}

                {sub?.coverage && (
                  <div className="flex items-start gap-1.5 text-[11.5px] leading-[1.4] text-ink-2">
                    <CheckCircle2
                      size={13}
                      strokeWidth={2}
                      className="text-success shrink-0 mt-px"
                    />
                    <span>
                      <span className="font-semibold text-ink">When we cover this:</span>{' '}
                      {sub.coverage}
                    </span>
                  </div>
                )}

                {sub?.tryFirst && (
                  <div className="flex items-start gap-1.5 rounded-[10px] bg-brand-bg/60 px-2.5 py-1.5 text-[11.5px] leading-[1.4] text-ink-2">
                    <Lightbulb
                      size={13}
                      strokeWidth={2}
                      className="text-brand shrink-0 mt-px"
                    />
                    <span>
                      <span className="font-semibold text-ink">Try this first:</span>{' '}
                      {sub.tryFirst}
                    </span>
                  </div>
                )}

                {sub?.id === 'body' && <PhysicalConditionNote order={order} />}

                {examples.length > 0 && (
                  <div className="flex flex-col gap-2 mt-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-muted">
                        {sub?.exampleKind === 'golden'
                          ? 'Example of good proof'
                          : 'Approved examples'}
                      </span>
                      {sub?.proofOptional && (
                        <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-muted bg-line-2 rounded-full px-[7px] py-0.5 leading-[1.4]">
                          Optional
                        </span>
                      )}
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

            {/* Secondary, easy-to-skip guide link. */}
            <a
              href={(sub && sub.proofGuideUrl) || DEFAULT_PROOF_GUIDE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start inline-flex items-center gap-1 text-[10.5px] font-medium text-muted hover:text-ink-2 hover:underline"
            >
              {PROOF_GUIDE_LABEL}
              <ExternalLink size={10} strokeWidth={2} />
            </a>
          </div>

          {/* Primary CTA — opens the slotted capture. Carries the progress so the
              customer sees what they've added without expanding. */}
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full rounded-[14px] bg-brand text-white px-4 py-3.5 inline-flex items-center justify-center gap-2 text-[14px] font-semibold hover:bg-brand/90 transition-colors"
          >
            <Paperclip size={16} strokeWidth={2} />
            {filledRequired > 0
              ? `Edit your proof · ${filledRequired} of ${totalRequired}`
              : 'Add your proof'}
          </button>
          {filledRequired > 0 && !complete && (
            <div className="-mt-1 inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-warn">
              <AlertTriangle size={13} strokeWidth={1.9} className="shrink-0" />
              {totalRequired - filledRequired} more to add — missing proof can delay your claim
            </div>
          )}
        </>
      ) : (
        /* EXPANDED — the slotted capture. */
        <div className="rounded-[14px] border border-line bg-surface p-3.5 flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13.5px] font-bold text-ink">Add your proof</span>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-brand hover:underline"
            >
              <ChevronLeft size={13} strokeWidth={2.25} />
              Examples
            </button>
          </div>

          {issueSlot && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted">
                  For this issue
                </span>
                {issueSlot.optional && (
                  <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-muted bg-line-2 rounded-full px-[7px] py-0.5 leading-[1.4]">
                    Optional
                  </span>
                )}
              </div>
              <ProofSlot
                slot={issueSlot}
                value={proofSlots[issueSlot.id]}
                onAdd={() => addToSlot(issueSlot)}
                onRemove={() => removeSlot(issueSlot)}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted">
              For every return · 4 photos
            </span>
            <div className="grid grid-cols-2 gap-2">
              {universalSlots.map((s) => (
                <ProofSlot
                  key={s.id}
                  slot={s}
                  value={proofSlots[s.id]}
                  onAdd={() => addToSlot(s)}
                  onRemove={() => removeSlot(s)}
                />
              ))}
            </div>
          </div>

          {complete ? (
            <div className="inline-flex items-center gap-1.5 rounded-[10px] bg-success-bg px-3 py-2 text-[12px] font-semibold text-success">
              <CheckCircle2 size={14} strokeWidth={2} className="shrink-0" />
              All proof added — you're good to go.
            </div>
          ) : (
            <div className="flex items-start gap-1.5 rounded-[10px] border border-warn-bg bg-warn-bg/60 px-3 py-2 text-[11.5px] leading-[1.4] text-ink">
              <AlertTriangle size={13} strokeWidth={1.9} className="text-warn shrink-0 mt-px" />
              <span>
                <span className="font-semibold">
                  {filledRequired} of {totalRequired} added.
                </span>{' '}
                You can continue, but missing proof can delay your claim.
              </span>
            </div>
          )}
        </div>
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

// One capture slot — empty (tappable dashed tile) or filled (placeholder
// thumbnail + filename + remove). Single file each; "adding" cycles a stub.
function ProofSlot({ slot, value, onAdd, onRemove }) {
  const Icon = slot.media === 'video' ? Video : Camera
  if (value) {
    return (
      <div className="relative rounded-[12px] border border-brand/40 bg-brand-bg/30 px-2.5 py-2.5 flex flex-col gap-1.5 min-w-0">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${slot.label}`}
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-surface/90 border border-line grid place-items-center text-ink-2 hover:bg-line-2"
        >
          <X size={12} strokeWidth={2} />
        </button>
        <span className="w-9 h-9 rounded-[8px] bg-surface border border-line grid place-items-center text-brand shrink-0">
          <Icon size={16} strokeWidth={1.75} />
        </span>
        <span className="block text-[11.5px] font-semibold text-ink leading-tight">
          {slot.label}
        </span>
        <span className="block text-[10.5px] text-muted truncate max-w-full">
          {value.filename}
        </span>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onAdd}
      className="rounded-[12px] border-2 border-dashed border-line bg-surface hover:border-brand hover:bg-brand-bg/20 px-2.5 py-2.5 flex flex-col gap-1.5 items-start text-left transition-colors min-w-0"
    >
      <span className="w-9 h-9 rounded-[8px] bg-brand-bg grid place-items-center text-brand shrink-0">
        <Icon size={16} strokeWidth={1.75} />
      </span>
      <span className="block text-[11.5px] font-semibold text-ink leading-tight">
        {slot.label}
      </span>
      <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-muted">
        <Plus size={11} strokeWidth={2.25} />
        Add {slot.media === 'video' ? 'video' : 'photo'}
      </span>
    </button>
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
