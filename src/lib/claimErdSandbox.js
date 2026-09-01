import { useCallback, useMemo, useState } from 'react'
import { JOURNEYS } from '../data/journey'
import {
  CLAIM_MARKETS,
  ERD_AWAITING_COLLECTION,
  ERD_AWAITING_REVIEW,
  ERD_DECIDED,
  ERD_EXPERT_REVISION,
  ERD_IN_TRANSIT,
  ERD_PRE_COLLECTION,
  ERD_QUALITY_CHECK,
  ERD_STAGE_LABELS,
  claimErd,
  claimErdStage,
  claimErdTransit,
  formatClaimErd,
} from './claimErd'

// Sandbox sibling to useEddSandbox, for the claim resolution model instead of
// the delivery one. Where useJourney replays pre-baked nodes, this computes
// the displayed claim purely from the six milestone dates plus a claim type,
// letting stakeholders scrub the window open and shut and watch the real
// ClaimCard / WarrantyClaimCard re-derive.
//
// Market comes from the app-level CountryPicker rather than a control of its
// own: App.jsx stamps `country` onto the sandbox order last, and that is the
// same field claimErdFor reads, so one picker drives both.

const DEFAULT_INPUTS = {
  claimType: 'change_of_mind',
  // What-if switch: treat the stage's outstanding milestone as landing today,
  // at every stage rather than only where the model would otherwise be silent.
  // On by default, so the panel opens on the newest behaviour — which means the
  // opening view is deliberately *not* what a card ships (cards assume only
  // where there'd otherwise be no date). Untick it to see card behaviour.
  assumeToday: true,
  today: '2026-05-15',
  createdAt: '2026-05-04',
  docsClearedAt: '2026-05-06',
  pickedUpAt: '2026-05-08',
  qcAt: '2026-05-13',
  expertRevisionAt: null,
  decidedAt: null,
}

export const CLAIM_TYPE_OPTIONS = [
  'change_of_mind',
  'issue',
  'warranty',
  'compensation',
]

const MILESTONE_KEYS = [
  'createdAt',
  'docsClearedAt',
  'pickedUpAt',
  'qcAt',
  'expertRevisionAt',
  'decidedAt',
]

// The milestones the panel lets you switch on and off. `createdAt` is absent
// because the model never branches on it (nor does the spreadsheet — only B4
// and below feed the formulas), so a checkbox on it would toggle nothing.
export const TOGGLEABLE_MILESTONES = [
  'docsClearedAt',
  'pickedUpAt',
  'qcAt',
  'expertRevisionAt',
  'decidedAt',
]

// Fields that must always hold a date: clearing them keeps the previous value.
const REQUIRED_DATES = ['today', 'createdAt']

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS_LONG = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

function parseDate(s) {
  if (!s) return null
  const [y, m, d] = s.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}

function fmtStamp(s) {
  const d = parseDate(s)
  if (!d) return undefined
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} · 10:30 AM`
}

function fmtLong(d) {
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}

// Stage → the pipeline status the cards route on. The decided stage forks by
// claim type because "decided" means a refund for a return and a repair for a
// warranty — and both are past where the model stops, so the strip stands
// down there and the card's own tail takes over. That handoff is the point.
function statusForStage(stage, claimType) {
  if (stage === ERD_DECIDED) {
    return claimType === 'warranty' ? 'under_repair' : 'refund_issued'
  }
  if (stage === ERD_QUALITY_CHECK || stage === ERD_EXPERT_REVISION) return 'qc'
  if (stage === ERD_IN_TRANSIT) return 'pickup'
  return 'initiated'
}

function buildOrder(initialOrder, inputs, milestones, stage) {
  const isWarranty = inputs.claimType === 'warranty'
  const isCompensation = inputs.claimType === 'compensation'
  const claimStatusId = statusForStage(stage, inputs.claimType)

  // The claim's own progress timeline, derived from whichever milestones are
  // filled so the dot strip and the resolution strip can't disagree.
  const timeline = {}
  if (milestones.createdAt) timeline.initiated = fmtStamp(milestones.createdAt)
  if (milestones.pickedUpAt && !isCompensation) {
    timeline.pickup = fmtStamp(milestones.pickedUpAt)
  }
  if (milestones.qcAt) timeline.qc = fmtStamp(milestones.qcAt)
  if (milestones.decidedAt) {
    timeline[isWarranty ? 'under_repair' : 'refund_issued'] = fmtStamp(
      milestones.decidedAt,
    )
  }

  const delivered = parseDate(inputs.createdAt) ?? parseDate(inputs.today)

  return {
    ...initialOrder,
    statusId: 'delivered',
    state: 'close',
    deliveredOn: inputs.createdAt,
    deliveredOnLong: delivered ? fmtLong(delivered) : undefined,
    claim: {
      claimRef: 'ErdSbx',
      claimStatusId,
      type: inputs.claimType,
      submittedAt: fmtStamp(milestones.createdAt),
      units: 1,
      reason: { value: 'changed_mind', otherText: '' },
      devicePrep: { option: 'reset', os: 'ios' },
      pickupDetails: {
        address: initialOrder.address,
        email: initialOrder.email,
        phone: initialOrder.phone,
      },
      ...(isWarranty || isCompensation
        ? {}
        : {
            refundMethod: 'wallet',
            expectedRefund: {
              itemTotal: initialOrder.subtotal ?? 0,
              warranty: initialOrder.warranty ?? 0,
              gross: initialOrder.total ?? 0,
              fee: 0,
              net: initialOrder.total ?? 0,
              rate: 0,
            },
          }),
      ...(isCompensation
        ? {
            compensationSubtypeId: 'shipping_refund',
            refundMethod: 'wallet',
            expectedRefund: { itemTotal: 0, warranty: 0, gross: 45, fee: 0, net: 45, rate: 0 },
          }
        : {}),
      timeline,
      // `asOf` is the panel's Today: it makes the scrubbed date the model's
      // clock rather than the wall clock or the replay's delivery date.
      // `assumeToday` carries the what-if toggle through to `claimErdFor`, so
      // the toggle moves the real card and not just the panel's readout.
      milestones: {
        ...milestones,
        asOf: inputs.today,
        ...(inputs.assumeToday ? { assumeToday: true } : {}),
      },
    },
  }
}

export function useClaimErdSandbox(journey, country = 'AE') {
  const [inputs, setInputs] = useState(DEFAULT_INPUTS)

  const setInput = useCallback((key, value) => {
    setInputs((prev) => {
      // A boolean toggle must survive `false`.
      if (typeof value === 'boolean') return { ...prev, [key]: value }
      // Today and Claim created always carry a date — an empty value there is
      // a mis-tap, not an instruction, so the previous one stands.
      if (!value && REQUIRED_DATES.includes(key)) return prev
      // A cleared milestone means "not reached yet", same as unticking it.
      return { ...prev, [key]: value || null }
    })
  }, [])

  const reset = useCallback(() => setInputs(DEFAULT_INPUTS), [])

  const milestones = useMemo(() => {
    const m = {}
    for (const k of MILESTONE_KEYS) if (inputs[k]) m[k] = inputs[k]
    return m
  }, [inputs])

  // A native date input with no value opens its calendar on the real current
  // month, which for a claim dated last spring means the picker lands months
  // away from every other field. There is no attribute for the empty-state
  // view month, so instead the panel always hands the input a date: its own
  // when the milestone is set, otherwise this anchor — the latest date already
  // committed, or Today if none is. Derived rather than stored, so re-dating
  // the claim carries every unset field along with it. ISO strings sort
  // chronologically, so `sort().at(-1)` is the max.
  const anchorDate = useMemo(() => {
    const set = MILESTONE_KEYS.map((k) => inputs[k]).filter(Boolean)
    return set.length ? set.slice().sort().at(-1) : inputs.today
  }, [inputs])

  const transit = claimErdTransit({ type: inputs.claimType })
  const stage = claimErdStage(milestones, { transit })

  // The raw model output, shown in the panel's debug strip even where the
  // card suppresses the strip (pending, and everything past the verdict) —
  // the panel's job is to expose the model, the card's is to be honest about
  // when it has nothing useful to say.
  const erd = useMemo(() => {
    const raw = claimErd(country, inputs.today, milestones, {
      transit,
      assume: inputs.assumeToday ? 'always' : 'when_pending',
    })
    return { ...raw, ...formatClaimErd(raw) }
  }, [country, inputs.today, milestones, transit, inputs.assumeToday])

  const order = useMemo(
    () => buildOrder(journey?.initialOrder ?? {}, inputs, milestones, stage),
    [journey, inputs, milestones, stage],
  )

  // Ticking a milestone commits whatever date the row is showing (the anchor);
  // unticking clears it. Keeps what-you-see-is-what-you-get, so the value can't
  // jump when you flip the box.
  const setReached = useCallback(
    (key, reached) => setInput(key, reached ? anchorDate : null),
    [setInput, anchorDate],
  )

  return {
    kind: 'claim_sandbox',
    journey,
    journeys: JOURNEYS,
    inputs,
    setInput,
    setReached,
    anchorDate,
    toggleable: TOGGLEABLE_MILESTONES,
    reset,
    erd,
    stage,
    stageLabel: ERD_STAGE_LABELS[stage],
    order,
    claimTypes: CLAIM_TYPE_OPTIONS,
    levers: CLAIM_MARKETS[country] ?? CLAIM_MARKETS.AE,
    stages: {
      ERD_PRE_COLLECTION,
      ERD_AWAITING_COLLECTION,
      ERD_AWAITING_REVIEW,
      ERD_IN_TRANSIT,
      ERD_QUALITY_CHECK,
      ERD_EXPERT_REVISION,
      ERD_DECIDED,
    },
  }
}
