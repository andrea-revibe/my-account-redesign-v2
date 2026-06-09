// Barrel: merges the per-domain notification maps into one event → message
// lookup, keyed by backend `event` name. Same pattern as data/journeys and
// data/orders. To add a domain, create a sibling file and spread it here.
//
// The rendering logic (interpolation, the notificationFor accessor) lives in
// lib/notifications.js — this file is content only.
import { ORDER_NOTIFICATIONS } from './orders'
import { SHIPMENT_NOTIFICATIONS } from './shipment'
import { CLAIM_NOTIFICATIONS } from './claims'

export const NOTIFICATIONS = {
  ...ORDER_NOTIFICATIONS,
  ...SHIPMENT_NOTIFICATIONS,
  ...CLAIM_NOTIFICATIONS,
}
