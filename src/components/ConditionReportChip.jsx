import { ExternalLink } from 'lucide-react'

// Third-party (NSYS) device condition-report link. Deliberately a quiet,
// borderless inline link so it stays subordinate to the primary content of
// whichever card hosts it. Links out to the NSYS-hosted report (a decorative
// placeholder here, like the DHL tracking link). Shared by the delivered
// PastOrderCard and the two device-returned surfaces (WarrantyClaimCard's
// `device_returned` hero + InvalidClaimCard's paid-return delivered state) —
// the card decides *when* to show it and *which* report to pass.
export function ConditionReportChip({ report }) {
  if (!report?.url) return null
  return (
    <a
      href={report.url}
      target="_blank"
      rel="noreferrer"
      aria-label="View the NSYS device condition report (opens in a new tab)"
      className="group inline-flex items-center gap-2 text-[12px] font-medium text-muted hover:text-ink transition-colors"
    >
      <img src="/nsys-icon.svg" alt="" className="w-7 h-7 shrink-0" />
      <span>Verified by NSYS</span>
      <ExternalLink
        size={13}
        strokeWidth={1.75}
        className="opacity-50 group-hover:opacity-100 transition-opacity"
      />
    </a>
  )
}
