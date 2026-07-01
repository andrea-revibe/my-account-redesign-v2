import { FileText, ExternalLink } from 'lucide-react'

// The airway-bill (shipping label) line inside a scheduled-pickup strip.
// When the journey/mock supplies an `awbUrl`, this renders a neutral CTA
// button that opens the real AWB PDF in a new tab; otherwise it falls back
// to the plain "AWB {number}" text row — so an AWB with no document still
// reads correctly (e.g. a fresh clone where the gitignored PDF is absent).
// Shared by ClaimCard + WarrantyClaimCard so the two strips can't drift.
// stopPropagation keeps a tap on the button from toggling the card header
// it's nested inside (same trick DestinationChip uses).
export function AwbLink({ awb, awbUrl }) {
  if (!awb) return null
  if (awbUrl) {
    return (
      <a
        href={awbUrl}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label={`View airway bill ${awb} (PDF, opens in a new tab)`}
        className="mt-0.5 self-start inline-flex items-center gap-1.5 h-9 px-3 rounded-[9px] bg-surface border border-line text-ink font-semibold text-[12px] hover:bg-line-2 transition-colors tabular-nums"
      >
        <FileText size={13} strokeWidth={2} className="shrink-0" />
        <span>View airway bill · AWB {awb}</span>
        <ExternalLink
          size={12}
          strokeWidth={1.75}
          className="opacity-50 shrink-0"
        />
      </a>
    )
  }
  return (
    <div className="flex items-start gap-1.5 text-[11.5px] text-ink-2/90">
      <FileText size={12} strokeWidth={2} className="text-ink-2/70 shrink-0 mt-px" />
      <span className="tabular-nums">AWB {awb}</span>
    </div>
  )
}
