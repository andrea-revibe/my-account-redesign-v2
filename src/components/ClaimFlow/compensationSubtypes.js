// "Keeping the device" branch (RETURNS-FLOW-SPEC §4 D). The customer keeps the
// device; an agent reviews the claim and the outcome is a refund/credit, never
// a return. Three triggers: a missing accessory, a broken accessory (the
// charger that left the device-fault list lands here), and a shipping refund.
// Each carries the evidence we ask for so QC can assess the amount.
import { PackageX, PlugZap, Truck } from 'lucide-react'

export const COMPENSATION_SUBTYPES = [
  {
    id: 'accessory_missing',
    label: 'An accessory is missing',
    sub: 'Something that should have been in the box wasn’t',
    icon: PackageX,
    need: 'A photo of everything that came in the box, so we can see what’s missing.',
  },
  {
    id: 'accessory_broken',
    label: 'An accessory is broken',
    sub: 'e.g. the charger or cable is faulty',
    icon: PlugZap,
    need: 'A short video or photo, filmed with another device, showing the accessory failing to work.',
  },
  {
    id: 'shipping_refund',
    label: 'I was charged for shipping',
    sub: 'You were charged shipping you shouldn’t have paid',
    icon: Truck,
    need: 'A screenshot or photo of the order confirmation or receipt showing the shipping charge.',
  },
]

export const COMPENSATION_SUBTYPE_LABELS = Object.fromEntries(
  COMPENSATION_SUBTYPES.map((s) => [s.id, s.label]),
)

export function findCompensationSubtype(id) {
  return COMPENSATION_SUBTYPES.find((s) => s.id === id) || null
}
