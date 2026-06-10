import { useState } from 'react'
import { ChevronDown, Copy, Truck } from 'lucide-react'
import { SHIPPING_SUB_STATUSES, subProgressIndex } from '../lib/statuses'
import Timeline from './Timeline'

// Shared "return shipment" detailed-tracking dropdown — the single source
// of truth for the Revibe → customer leg, used by both return-shipment
// surfaces so they can't drift:
//   - WarrantyClaimCard `ship_back`        → ship={claim.shipBack}
//   - InvalidClaimCard `paid` (PaidShipBack) → ship={claim.invalidClaim.returnShipment}
// Both carry the same shape ({ courier, awb, subStatusId, subTimeline }).
// Brand-toned so it reads as an inviting tap target; reuses the outbound
// SHIPPING_SUB_STATUSES milestones (arrived in destination country →
// cleared customs → forwarded to third-party agent → out for delivery).
export function ReturnShipmentTracking({ ship }) {
  const [show, setShow] = useState(false)
  const cur = subProgressIndex(ship?.subStatusId)

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
        <div className="mt-2.5 pt-3.5 px-3.5 pb-1 rounded-[12px] border border-line bg-canvas animate-slideDown">
          {(ship?.courier || ship?.awb) && (
            <CourierStrip courier={ship.courier} awb={ship.awb} />
          )}
          <Timeline
            orientation="vertical"
            dense
            tone="brand"
            steps={SHIPPING_SUB_STATUSES}
            currentIndex={cur}
            stamps={ship?.subTimeline || {}}
          />
          <div className="pb-1" />
        </div>
      )}
    </div>
  )
}

// DHL chip + courier name + copyable AWB. Shared by the return-shipment
// dropdown and the warranty inbound-pickup dropdown — pass whichever leg's
// courier/awb. The AWB row is omitted when no awb is present.
export function CourierStrip({ courier, awb }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 mb-3 rounded-[10px] border border-line bg-surface">
      <span className="w-9 h-7 rounded-md grid place-items-center text-[11px] font-extrabold tracking-[0.04em] bg-[#ffcc00] text-[#1a1a1a] shrink-0">
        DHL
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold text-ink truncate">
          {courier || 'Courier'}
        </div>
        {awb && (
          <div className="text-[11.5px] text-muted mt-px tabular-nums truncate">
            AWB #{awb}
          </div>
        )}
      </div>
      <button
        type="button"
        aria-label="Copy AWB"
        onClick={(e) => {
          e.stopPropagation()
          if (awb) navigator.clipboard?.writeText(awb)
        }}
        className="w-8 h-8 rounded-lg grid place-items-center border border-line text-ink-2 hover:bg-line-2 shrink-0"
      >
        <Copy size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}
