import { useState } from 'react'
import { ChevronDown, Truck, ExternalLink, Headphones } from 'lucide-react'
import { SHIPPING_SUB_STATUSES, subProgressIndex } from '../lib/statuses'
import Timeline from './Timeline'

// Hardcoded so the demo lands on a real DHL test shipment regardless of the
// placeholder tracking numbers in the mock data (same value as OrderCard /
// HeroCard). Mirrored here so the harmonized tracking dropdown's "Track
// package" button resolves.
const DHL_TRACKING_URL =
  'https://www.dhl.com/us-en/home/tracking/tracking-express.html?submit=1&tracking-id=3392654392'

// Single shared detailed-tracking dropdown for every courier leg in a claim —
// the one source of truth so the four surfaces can't drift:
//   - ClaimCard inbound (refund pickup, customer → Revibe)
//   - WarrantyClaimCard inbound (warranty pickup, customer → Revibe)
//   - WarrantyClaimCard `ship_back` (Revibe → customer)        — via ReturnShipmentTracking
//   - InvalidClaimCard `paid` return shipment (Revibe → customer) — via ReturnShipmentTracking
// Brand-toned so it reads as an inviting tap target. Callers pass the leg's
// stop list (SHIPPING_SUB_STATUSES for the return leg, CLAIM_TRANSIT_SUB_STATUSES
// for the inbound leg) plus its progress. The expanded panel is the milestone
// timeline + a Track package / Get Help action row. Only renders behind
// countryConfig(order).detailedTracking (AE + ZA) at the call site.
export function TrackingDropdown({ steps, currentIndex, stamps }) {
  const [show, setShow] = useState(false)

  return (
    <div className="px-1">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setShow((v) => !v)
        }}
        aria-expanded={show}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-[10px] border border-brand bg-brand-bg/60 text-[12.5px] font-semibold text-brand hover:bg-brand-bg transition"
      >
        <span className="inline-flex items-center gap-1.5">
          <Truck size={14} strokeWidth={2} />
          {show ? 'Hide detailed tracking' : 'See detailed tracking'}
        </span>
        <ChevronDown
          size={16}
          strokeWidth={1.75}
          className={`text-brand transition-transform ${show ? 'rotate-180' : ''}`}
        />
      </button>
      {show && (
        <div className="mt-2.5 pt-3.5 px-3.5 pb-3.5 rounded-[12px] border border-line bg-canvas animate-slideDown">
          <Timeline
            orientation="vertical"
            dense
            tone="brand"
            steps={steps}
            currentIndex={currentIndex}
            stamps={stamps || {}}
          />
          <TrackingActions />
        </div>
      )}
    </div>
  )
}

// Thin adapter for the return leg (Revibe → customer), shared by
// WarrantyClaimCard's ship-back (`claim.shipBack`) and InvalidClaimCard's
// paid state (`claim.invalidClaim.returnShipment`). Both carry the same
// shape ({ courier, awb, subStatusId, subTimeline }) and walk the outbound
// SHIPPING_SUB_STATUSES milestones.
export function ReturnShipmentTracking({ ship }) {
  return (
    <TrackingDropdown
      steps={SHIPPING_SUB_STATUSES}
      currentIndex={subProgressIndex(ship?.subStatusId)}
      stamps={ship?.subTimeline}
    />
  )
}

// Track package (→ known-good DHL test shipment) + Get Help. Get Help is a
// styled placeholder for now — not wired. The Get Help icon (Headphones)
// matches the delivery hero card's "Get help" ghost button.
function TrackingActions() {
  return (
    <div className="mt-3 pt-3 border-t border-line flex gap-2">
      <a
        href={DHL_TRACKING_URL}
        target="_blank"
        rel="noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[10px] bg-brand text-white text-[12.5px] font-semibold hover:bg-brand/90 transition"
      >
        <ExternalLink size={14} strokeWidth={2} />
        Track package
      </a>
      <button
        type="button"
        onClick={(e) => e.stopPropagation()}
        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[10px] border border-brand bg-surface text-brand text-[12.5px] font-semibold hover:bg-brand-bg/60 transition"
      >
        <Headphones size={14} strokeWidth={2} />
        Get Help
      </button>
    </div>
  )
}
