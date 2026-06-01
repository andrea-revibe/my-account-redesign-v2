// Sub-cases shown under Step 1 → "Request compensation". The customer
// keeps the device — the outcome is always a refund, never a return.
// Each entry carries the evidence we ask for so QC can assess the amount.
import { Truck, PlugZap } from 'lucide-react'

export const COMPENSATION_SUBTYPES = [
  {
    id: 'shipping_refund',
    label: 'Refund my shipping cost',
    sub: 'You were charged shipping you shouldn’t have paid',
    icon: Truck,
    need: 'A screenshot or photo of the order confirmation or receipt showing the shipping charge.',
  },
  {
    id: 'charger',
    label: 'Charger not working',
    sub: 'The device is fine — the charger is faulty',
    icon: PlugZap,
    need: 'A short video or photo, filmed with another device, showing the charger failing to charge.',
  },
]

export const COMPENSATION_SUBTYPE_LABELS = Object.fromEntries(
  COMPENSATION_SUBTYPES.map((s) => [s.id, s.label]),
)

export function findCompensationSubtype(id) {
  return COMPENSATION_SUBTYPES.find((s) => s.id === id) || null
}
