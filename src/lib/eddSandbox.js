import { useCallback, useMemo, useState } from 'react'
import { JOURNEYS } from '../data/journey'
import {
  MARKETS,
  STAGE_ORDER_CREATED,
  STAGE_QC,
  STAGE_SHIPPED,
  SLA_LATE,
  SLA_ON_TIME,
  orderStatus,
} from './edd'

// Sandbox sibling to useJourney(). Where useJourney replays pre-baked event
// nodes along a path, useEddSandbox computes the displayed order purely
// from a set of date inputs (today / order / QC / shipped / delivered) and
// a market — letting stakeholders scrub through the EDD model interactively.
// The returned order shape feeds the same card-routing tree as a normal
// order, with a new `statusBanner` field that fully overrides the
// status-banner copy + tone (see statuses.js → statusDescription).

const DEFAULT_INPUTS = {
  market: 'UAE',
  today: '2026-05-20',
  orderDate: '2026-05-19',
  qcDate: null,
  shippedDate: null,
  deliveredDate: null,
}

function parseDate(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const WEEKDAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function fmtShort(d) {
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

function fmtLong(d) {
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_LONG[d.getMonth()]}`
}

function fmtEta(d) {
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getDate()}`
}

function fmtIso(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// Banner tone + lead for the SLA-divergence messages the card system has no
// equivalent for (late at each stage + the QC "back on track" recovery).
// Body is the already-resolved customerMessage.body from edd.js. The on-time
// steady states are NOT handled here — they reuse the card copy via a null
// banner (see buildOrder), so the sandbox can't drift from the cards.
function bannerFor(messageKey) {
  if (messageKey === 'qc_back_on_track') return { tone: 'brand', lead: 'Back on track' }
  if (messageKey === 'order_late') return { tone: 'warn', lead: 'Taking longer than usual' }
  if (messageKey === 'qc_late') return { tone: 'warn', lead: 'Taking longer than usual' }
  if (messageKey === 'shipped_late') return { tone: 'warn', lead: 'Slight delay' }
  return { tone: 'brand', lead: 'On track' }
}

function buildOrder(initialOrder, inputs, status) {
  const today = parseDate(inputs.today)
  const orderDate = parseDate(inputs.orderDate)
  const qcDate = parseDate(inputs.qcDate)
  const shippedDate = parseDate(inputs.shippedDate)
  const deliveredDate = parseDate(inputs.deliveredDate)

  // Base — strip timeline / shipping fields from INITIAL_ORDER so the
  // sandbox can build them up from the inputs without leaking the
  // default "21 May / 23 May" timestamps.
  const base = {
    ...initialOrder,
    courier: null,
    trackingNumber: null,
    trackingUrl: null,
    subStatusId: null,
    subTimeline: undefined,
    timeline: {},
    estimatedDelivery: null,
    estimatedDeliveryLong: null,
    shipDeadline: null,
    shipDeadlineFull: null,
    deliveredOn: undefined,
    deliveredOnLong: undefined,
    state: 'open',
  }

  if (!orderDate) {
    return {
      ...base,
      statusId: 'created',
      statusBanner: null,
    }
  }

  base.placedAt = `${String(orderDate.getDate()).padStart(2, '0')}/${String(orderDate.getMonth() + 1).padStart(2, '0')}/${orderDate.getFullYear()} 10:30 AM`
  base.placedAtFull = `${fmtLong(orderDate).replace(',', '')} · 10:30 AM`
  base.timeline.created = `${fmtShort(orderDate)} · 10:30 AM`

  if (qcDate) base.timeline.quality_check = `${fmtShort(qcDate)} · 9:18 AM`
  if (shippedDate) base.timeline.shipped = `${fmtShort(shippedDate)} · 11:02 AM`

  // Status progression mirrors the EDD pipeline. Delivered short-circuits
  // EDD math (status is terminal) but we still surface the computed value
  // for context in the debug strip.
  if (deliveredDate) {
    base.statusId = 'delivered'
    base.state = 'close'
    base.timeline.delivered = `${fmtShort(deliveredDate)} · 3:14 PM`
    base.deliveredOn = fmtIso(deliveredDate)
    base.deliveredOnLong = fmtLong(deliveredDate)
    // Delivered reuses the card copy (STATUS_DESCRIPTIONS.delivered) — leave
    // the banner unset so statusDescription() resolves it from statuses.js.
    base.statusBanner = null
    return base
  }

  // EDD applies on every non-delivered state.
  const edd = status.deliveryBy
  base.estimatedDelivery = fmtEta(edd)
  base.estimatedDeliveryLong = fmtLong(edd)
  base.shipDeadline = fmtEta(edd)
  base.shipDeadlineFull = fmtLong(edd)

  if (shippedDate) {
    base.statusId = 'shipped'
    // Default the sub-status so OrderCard renders a sensible sub-timeline
    // entry. Sandbox doesn't expose sub-status as an input — out of scope
    // for the EDD model.
    base.subStatusId = 'arrived_destination'
    base.courier = 'DHL Express'
    base.trackingNumber = '25193399'
    base.trackingUrl = 'https://www.dhl.com/track'
    base.subTimeline = {
      arrived_destination: `${fmtShort(shippedDate)} · 8:30 AM`,
    }
  } else if (qcDate) {
    base.statusId = 'quality_check'
  } else {
    base.statusId = 'created'
  }

  // On-time steady states reuse the card copy in statuses.js
  // (STATUS_DESCRIPTIONS) — leave the banner unset so statusDescription()
  // resolves it. Only the SLA-divergence messages, which have no card
  // equivalent, get a sandbox-owned banner.
  const SANDBOX_OWNED_KEYS = new Set([
    'order_late',
    'qc_late',
    'shipped_late',
    'qc_back_on_track',
  ])
  if (SANDBOX_OWNED_KEYS.has(status.customerMessage.key)) {
    const banner = bannerFor(status.customerMessage.key)
    base.statusBanner = {
      tone: banner.tone,
      lead: banner.lead,
      body: status.customerMessage.body,
    }
  } else {
    base.statusBanner = null
  }

  // Mirror `delayed` so any non-banner surface that reads it (e.g. card
  // header tint or future analytics hooks) stays consistent with the
  // EDD-derived SLA verdict. statusBanner already overrides the banner
  // copy, but the flag itself is cheap to keep in sync.
  base.delayed = status.currentStageSlaStatus === SLA_LATE

  return base
}

export function useEddSandbox(journey) {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const setInput = useCallback((key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value || null }))
  }, [])

  const reset = useCallback(() => {
    setInputs(DEFAULT_INPUTS)
  }, [])

  const status = useMemo(() => {
    const today = parseDate(inputs.today)
    const orderDate = parseDate(inputs.orderDate)
    if (!today || !orderDate || !MARKETS[inputs.market]) return null
    return orderStatus(
      inputs.market,
      today,
      orderDate,
      parseDate(inputs.qcDate),
      parseDate(inputs.shippedDate),
    )
  }, [inputs])

  const order = useMemo(
    () => buildOrder(journey?.initialOrder ?? {}, inputs, status ?? {}),
    [journey, inputs, status],
  )

  return {
    kind: 'sandbox',
    journey,
    journeys: JOURNEYS,
    inputs,
    setInput,
    reset,
    status,
    order,
    // Constants the panel surfaces in its dropdowns / debug rows.
    markets: Object.keys(MARKETS),
    stages: { STAGE_ORDER_CREATED, STAGE_QC, STAGE_SHIPPED },
    sla: { SLA_ON_TIME, SLA_LATE },
  }
}
