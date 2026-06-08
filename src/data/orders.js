// Mock orders. Phase 2 will swap this for an API response of the same shape.
// Split by scenario into ./orders/* (field docs: docs/output/orders.md §7;
// navigation: docs/code_map.md). The spread order below is the on-page order —
// keep it stable.
//
// `placedAt` is the canonical machine date used by the date-range filter in
// App.jsx (DD/MM/YYYY HH:MM AM/PM). `placedAtFull` is the human-readable long
// form rendered inside the Order details collapse on each card.
import { BASELINE_ORDERS } from './orders/baseline'
import { CLAIM_ORDERS } from './orders/claims'
import { WARRANTY_ORDERS } from './orders/warranty'
import { COMPENSATION_ORDERS } from './orders/compensation'

export const ORDERS = [
  ...BASELINE_ORDERS,
  ...CLAIM_ORDERS,
  ...WARRANTY_ORDERS,
  ...COMPENSATION_ORDERS,
]
