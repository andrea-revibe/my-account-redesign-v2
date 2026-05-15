import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ChevronDown,
  CheckCircle2,
  Clock,
  History,
  Image as ImageIcon,
  Play,
  Plus,
  RotateCcw,
  UploadCloud,
  X,
} from 'lucide-react'

const REVIBE_CARE_ICON =
  'https://cdn.shopify.com/s/files/1/0695/1737/7855/files/Revibe_logo_RE_CARE_Color_copy.png?v=1719938652'

const NOTE_MAX = 280

// Stub library — taps on the upload zone cycle fake files in. Real <input
// type="file"> wiring is out of scope (matches the rest of the prototype's
// visual-placeholder posture).
const FAKE_FILES = [
  { name: 'IMG_4521.heic', size: '3.2 MB', kind: 'image' },
  { name: 'IMG_4522.heic', size: '2.8 MB', kind: 'image' },
  { name: 'screen-close-up.jpg', size: '2.4 MB', kind: 'image' },
  { name: 'VID_0095.mov', size: '24 MB', kind: 'video', duration: '0:32' },
  { name: 'IMG_4523.heic', size: '3.1 MB', kind: 'image' },
  { name: 'IMG_4524.heic', size: '2.6 MB', kind: 'image' },
  { name: 'touch-test.mp4', size: '18 MB', kind: 'video', duration: '0:24' },
]

export default function DocsRejectedCard({ order, defaultExpanded = false }) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const [files, setFiles] = useState([])
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setExpanded(defaultExpanded)
  }, [defaultExpanded])

  const addFile = () =>
    setFiles((prev) => {
      const next = FAKE_FILES[prev.length % FAKE_FILES.length]
      return [...prev, { ...next, id: `${Date.now()}-${prev.length}` }]
    })
  const removeFile = (id) => setFiles((prev) => prev.filter((f) => f.id !== id))
  const canSubmit = files.length > 0 && !submitted

  if (submitted) {
    return (
      <ResubmittedCard
        order={order}
        files={files}
        note={note}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
        onUndo={() => setSubmitted(false)}
      />
    )
  }

  const claim = order.claim
  const r = claim.docsRejection

  return (
    <article className="bg-surface rounded-card border border-line overflow-hidden relative shadow-sm2">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-danger" />

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="w-full text-left pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            Order · #{order.id} · Claim RET-{claim.claimRef}
          </div>
          <span
            aria-hidden
            className="w-6 h-6 rounded-full bg-line-2 text-ink-2 grid place-items-center shrink-0 transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            <ChevronDown size={12} strokeWidth={1.75} />
          </span>
        </div>

        <span className="self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px] bg-danger-bg text-danger">
          <AlertTriangle size={11} strokeWidth={2.2} />
          Action needed
        </span>

        <div className="rounded-[14px] border border-[#f6c5cc] bg-danger-bg p-3.5 flex flex-col gap-2.5">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2 whitespace-nowrap truncate min-w-0">
              Return claim
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-danger whitespace-nowrap shrink-0">
              <AlertTriangle size={11} strokeWidth={2.2} />
              Documents rejected
            </span>
          </div>
          <div className="text-[18px] font-bold leading-[1.15] tracking-[-0.01em] text-danger">
            We need clearer evidence
          </div>

          {expanded ? (
            <OpsMessage
              name={r.opsName}
              role={r.opsRole}
              message={r.opsMessage}
              timestamp={r.rejectedAt}
            />
          ) : (
            <div className="text-[11.5px] text-ink-2 leading-snug line-clamp-2">
              <span className="font-semibold text-ink">
                {r.opsName}, {r.opsRole}:
              </span>{' '}
              {r.opsMessage}
            </div>
          )}

          <CountdownStrip rejection={r} />
        </div>

        <ProductRow order={order} />

        {!expanded && (
          <div className="text-[11px] text-muted text-center pt-0.5">Tap to fix</div>
        )}
      </button>

      {expanded && (
        <div className="border-t border-line bg-canvas pl-4 pr-3.5 py-4 flex flex-col gap-3.5 animate-slideDown">
          <PreviousAttempt previous={r.previous} />

          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink">
                Re-upload your evidence
              </h3>
              <span className="text-[10.5px] text-muted tabular-nums">
                {files.length} added
              </span>
            </div>

            <UploadDropZone onClick={addFile} hasFiles={files.length > 0} />

            {files.length > 0 && (
              <div className="grid grid-cols-3 gap-2 animate-fadeIn">
                {files.map((f) => (
                  <UploadedFileTile key={f.id} file={f} onRemove={() => removeFile(f.id)} />
                ))}
                <button
                  type="button"
                  onClick={addFile}
                  aria-label="Add another file"
                  className="aspect-square rounded-[10px] border-2 border-dashed border-line text-muted grid place-items-center hover:bg-line-2 hover:text-ink-2 transition"
                >
                  <Plus size={20} strokeWidth={2} />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink flex items-center justify-between">
              <span>
                Note for Revibe Quality{' '}
                <span className="text-muted font-medium normal-case tracking-normal text-[11px]">
                  · optional
                </span>
              </span>
              <span
                className={`text-[10.5px] tabular-nums font-medium ${
                  note.length > NOTE_MAX * 0.9 ? 'text-warn' : 'text-muted'
                }`}
              >
                {note.length}/{NOTE_MAX}
              </span>
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
              placeholder={`Anything to add for ${r.opsName}? E.g. "I've re-shot the screen with the curtains drawn."`}
              rows={3}
              className="w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[12.5px] text-ink placeholder:text-muted/80 leading-snug resize-none focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              className="flex-1 h-[46px] rounded-[10px] bg-surface border border-line text-ink-2 font-semibold text-[13px] hover:bg-line-2"
            >
              Cancel claim
            </button>
            <button
              type="button"
              onClick={() => canSubmit && setSubmitted(true)}
              disabled={!canSubmit}
              className={`flex-[2] h-[46px] rounded-[10px] border font-semibold text-[13.5px] inline-flex items-center justify-center gap-1.5 transition ${
                canSubmit
                  ? 'bg-danger text-white border-danger hover:brightness-95 active:scale-[0.99]'
                  : 'bg-line-2 text-muted border-line cursor-not-allowed'
              }`}
            >
              <UploadCloud size={14} strokeWidth={2} />
              {canSubmit ? 'Resubmit for review' : 'Add evidence to resubmit'}
            </button>
          </div>

          <div className="text-[10.5px] text-center text-muted -mt-0.5">
            You'll hear back within 24 hours of resubmission.
          </div>
        </div>
      )}
    </article>
  )
}

function ResubmittedCard({ order, files, note, expanded, onToggle, onUndo }) {
  const claim = order.claim
  const r = claim.docsRejection
  return (
    <article className="bg-surface rounded-card border border-line overflow-hidden relative shadow-sm2 animate-fadeIn">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-warn" />

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="w-full text-left pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            Order · #{order.id} · Claim RET-{claim.claimRef}
          </div>
          <span
            aria-hidden
            className="w-6 h-6 rounded-full bg-line-2 text-ink-2 grid place-items-center shrink-0 transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            <ChevronDown size={12} strokeWidth={1.75} />
          </span>
        </div>

        <span className="self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px] bg-warn-bg text-warn">
          <span className="w-1.5 h-1.5 rounded-full bg-warn animate-pulse" />
          Back under review
        </span>

        <div className="rounded-[14px] border border-[#ffe3b8] bg-warn-bg p-3.5 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-ink-2 whitespace-nowrap truncate min-w-0">
              Return claim
            </div>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.06em] inline-flex items-center gap-1 text-warn whitespace-nowrap shrink-0">
              <CheckCircle2 size={11} strokeWidth={2.2} />
              Resubmitted
            </span>
          </div>
          <div className="text-[18px] font-bold leading-[1.15] tracking-[-0.01em] text-warn">
            Thanks — we've got your new evidence
          </div>
          <div className="text-[11.5px] text-ink-2 leading-snug">
            {r.opsName}, {r.opsRole} will review your {files.length} new{' '}
            {files.length === 1 ? 'file' : 'files'} within 24 hours.
          </div>
        </div>

        <ProductRow order={order} />
      </button>

      {expanded && (
        <div className="border-t border-line bg-canvas pl-4 pr-3.5 py-4 flex flex-col gap-3 animate-slideDown">
          <div>
            <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted mb-1.5">
              What you sent
            </div>
            <div className="grid grid-cols-3 gap-2">
              {files.map((f) => (
                <div
                  key={f.id}
                  className="relative aspect-square rounded-[10px] overflow-hidden border border-line"
                >
                  <FileThumb file={f} size={120} />
                  {f.kind === 'video' && (
                    <span className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 h-4 px-1 rounded-sm bg-black/55 text-white text-[9px] font-medium tabular-nums">
                      {f.duration || '0:00'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {note && (
            <div className="rounded-[10px] bg-surface border border-line px-3 py-2.5">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.06em] text-muted mb-1">
                Your note
              </div>
              <div className="text-[12.5px] text-ink leading-snug">{note}</div>
            </div>
          )}

          <button
            type="button"
            onClick={onUndo}
            className="h-[40px] rounded-[10px] bg-surface border border-line text-ink-2 font-semibold text-[12.5px] inline-flex items-center justify-center gap-1.5 hover:bg-line-2"
          >
            <RotateCcw size={13} strokeWidth={2} />
            Undo · edit before review starts
          </button>
        </div>
      )}
    </article>
  )
}

function OpsMessage({ name, role, message, timestamp }) {
  return (
    <div className="rounded-[12px] border bg-white/85 border-white p-3 flex gap-2.5 items-start">
      <span className="w-7 h-7 rounded-full bg-danger text-white grid place-items-center shrink-0 text-[11px] font-bold uppercase">
        {name?.[0] || '?'}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="text-[11px] text-ink-2 font-semibold">
            <span className="text-ink">{name}</span>
            <span className="text-muted"> · {role}</span>
          </div>
          {timestamp && (
            <span className="text-[10.5px] text-muted tabular-nums shrink-0">
              {timestamp}
            </span>
          )}
        </div>
        <div className="mt-1 text-[12.5px] text-ink leading-snug pr-1">{message}</div>
      </div>
    </div>
  )
}

function CountdownStrip({ rejection }) {
  return (
    <div className="flex items-center gap-2 rounded-[10px] bg-white/85 border border-white px-3 py-2 text-[11.5px]">
      <span className="w-6 h-6 rounded-full bg-danger/10 text-danger grid place-items-center shrink-0">
        <Clock size={12} strokeWidth={2.2} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11.5px] text-ink leading-tight">
          <span className="font-bold text-danger">{rejection.timeLeftLabel}</span>
          <span className="text-ink-2"> to re-upload</span>
        </div>
        <div className="text-[10.5px] text-muted leading-tight mt-0.5">
          Claim auto-cancels {rejection.autoCancelAt}
        </div>
      </div>
    </div>
  )
}

function PreviousAttempt({ previous }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-[12px] border border-line bg-surface overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3.5 py-2.5 flex items-center justify-between text-left hover:bg-line-2/40"
      >
        <div className="flex items-center gap-2">
          <History size={13} strokeWidth={2} className="text-muted" />
          <span className="text-[12px] font-semibold text-ink-2">Your last attempt</span>
          <span className="text-[10.5px] text-muted tabular-nums">
            · {previous.length} files
          </span>
        </div>
        <span
          className="w-5 h-5 grid place-items-center text-muted transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        >
          <ChevronDown size={12} strokeWidth={2} />
        </span>
      </button>
      {open && (
        <div className="px-3.5 pb-3 pt-1 flex gap-1.5 overflow-x-auto scrollbar-hide animate-slideDown">
          {previous.map((f, i) => (
            <div key={i} className="relative">
              <FileThumb file={f} size={56} dim />
              {f.tag && (
                <span className="absolute -top-1 -right-1 bg-danger text-white text-[8px] font-bold px-1 py-[1px] rounded-full leading-tight whitespace-nowrap shadow-sm2">
                  {f.tag}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function UploadDropZone({ onClick, hasFiles }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[12px] border-2 border-dashed border-danger/40 bg-danger-bg/40 px-4 py-5 flex flex-col items-center gap-1.5 text-center hover:bg-danger-bg/70 active:scale-[0.99] transition"
    >
      <span className="w-11 h-11 rounded-full bg-danger text-white grid place-items-center">
        <UploadCloud size={20} strokeWidth={2} />
      </span>
      <div className="text-[13.5px] font-bold text-ink">
        {hasFiles ? 'Add more evidence' : 'Tap to add evidence'}
      </div>
      <div className="text-[11px] text-ink-2 leading-snug max-w-[280px]">
        Photos and videos all at once · from camera, library, or drag files in · max 25 MB each
      </div>
    </button>
  )
}

function UploadedFileTile({ file, onRemove }) {
  return (
    <div className="relative aspect-square rounded-[10px] overflow-hidden border border-line bg-surface">
      <FileThumb file={file} size={120} />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onRemove()
        }}
        aria-label={`Remove ${file.name}`}
        className="absolute top-1 right-1 w-6 h-6 grid place-items-center rounded-full bg-black/55 text-white hover:bg-black/75 backdrop-blur-sm"
      >
        <X size={12} strokeWidth={2.4} />
      </button>
      {file.kind === 'video' && (
        <span className="absolute bottom-1 left-1 inline-flex items-center gap-0.5 h-4 px-1 rounded-sm bg-black/55 text-white text-[9px] font-medium tabular-nums">
          {file.duration || '0:00'}
        </span>
      )}
    </div>
  )
}

function FileThumb({ file, size = 56, dim = false }) {
  const isVideo = file.kind === 'video'
  const bg = isVideo ? 'bg-[#1a1a2e]' : 'bg-line-2'
  const dimCls = dim ? 'opacity-50 grayscale' : ''
  const label = isVideo
    ? `VID · ${file.duration || '0:12'}`
    : file.name.replace(/\.[^.]+$/, '')
  return (
    <div
      className={`relative rounded-[8px] overflow-hidden border border-line ${bg} ${dimCls} shrink-0`}
      style={{ width: size, height: size }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: isVideo
            ? 'repeating-linear-gradient(135deg, rgba(255,255,255,0.06) 0 6px, transparent 6px 12px)'
            : 'repeating-linear-gradient(135deg, rgba(0,0,0,0.04) 0 6px, transparent 6px 12px)',
        }}
      />
      <div className="absolute inset-0 grid place-items-center text-center px-1">
        {isVideo ? (
          <Play
            size={Math.round(size * 0.34)}
            strokeWidth={2.2}
            className="text-white/80"
          />
        ) : (
          <ImageIcon
            size={Math.round(size * 0.32)}
            strokeWidth={1.5}
            className="text-ink-2/60"
          />
        )}
      </div>
      <div
        className={`absolute left-0 right-0 bottom-0 px-1 py-[1px] text-[8px] font-mono leading-tight truncate text-center ${
          isVideo ? 'bg-black/40 text-white/85' : 'bg-white/85 text-ink-2'
        }`}
      >
        {label}
      </div>
    </div>
  )
}

function ProductRow({ order }) {
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <div className="w-9 h-11 rounded-[8px] bg-brand-bg border border-line-2 grid place-items-center p-1 shrink-0">
        <img
          src={order.product.image}
          alt=""
          className="max-w-full max-h-full object-contain"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ink truncate">
          {order.product.name}
        </div>
        <div className="text-[11px] text-muted truncate">{order.product.variant}</div>
        {order.warranty != null && (
          <div className="flex items-center gap-1 mt-0.5 text-[10.5px] text-muted">
            <img
              src={REVIBE_CARE_ICON}
              alt=""
              className="w-2.5 h-2.5 object-contain shrink-0"
            />
            <span className="truncate">
              Revibe Care +{order.currency} {order.warranty.toLocaleString()}
            </span>
          </div>
        )}
      </div>
      <div className="text-right shrink-0">
        <div className="text-[10px] uppercase tracking-[0.08em] font-bold text-muted">
          Total
        </div>
        <div className="text-[13px] font-semibold text-ink tabular-nums whitespace-nowrap">
          {order.currency} {order.total.toLocaleString()}
        </div>
      </div>
    </div>
  )
}
