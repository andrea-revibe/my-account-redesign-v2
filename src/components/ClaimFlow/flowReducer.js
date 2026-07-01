import { ORDERS } from '../../data/orders'
import { deviceOsForOrder, deviceTypeForOrder } from '../../lib/devices'
import { DEFAULT_COUNTRY } from '../../lib/countries'
import { emptyAddress, addressError } from '../../lib/address'

// Situation-first flow (returns redesign). Screen 1 asks WHAT HAPPENED
// (`situation`), not which remedy the customer wants. The remedy — and with
// it the downstream `claimType` the rest of the app keys off — is derived
// later:
//   changed_mind      → change_of_mind            (auto-refund, no remedy screen)
//   device_fault      → issue (refund) | warranty (repair)   [remedy screen]
//   wrong_item        → issue (refund | replacement)         [remedy screen]
//   keep_compensation → compensation              (standalone, agent-reviewed)
// `claimType` stays the canonical contract for STEP_SEQUENCES tails, App.jsx
// routing and buildClaim; `remedy` ('refund' | 'repair' | 'replacement') only
// forks the tail (repair/replacement skip the refund step) and the
// confirmation copy.

// The decision-screen portion of each branch (everything before the shared
// out-of-scope steps 4–9). The reason / category / specific / remedy /
// wrongitem / compproblem screens are the redesigned surface.
const DECISION_STEPS = {
  changed_mind: ['situation', 'reason'],
  device_fault: ['situation', 'category', 'specific', 'remedy'],
  wrong_item: ['situation', 'wrongitem', 'remedy'],
  keep_compensation: ['situation', 'compproblem'],
}

// The branch's first screen after Screen 1 — where an accepted tripwire lands.
export const BRANCH_ENTRY = {
  changed_mind: 'reason',
  device_fault: 'category',
  wrong_item: 'wrongitem',
  keep_compensation: 'compproblem',
}

// The shared tail (steps 4–9, behaviour unchanged). `repair` and `replacement`
// return the device but issue no money, so they drop the refund-method step.
function tailSteps(situation, remedy) {
  if (situation === 'keep_compensation') return ['refund', 'review', 'confirm']
  if (situation === 'changed_mind')
    return ['deviceprep', 'packing', 'pickup', 'refund', 'review', 'confirm']
  const noRefund = remedy === 'repair' || remedy === 'replacement'
  const tail = ['evidence', 'deviceprep', 'packing', 'pickup']
  if (!noRefund) tail.push('refund')
  tail.push('review', 'confirm')
  return tail
}

// Before a situation is chosen we're on 'situation'; fall back to the longest
// path so the progress bar has a sensible denominator on screen 1.
const DEFAULT_SEQUENCE = [
  ...DECISION_STEPS.device_fault,
  ...tailSteps('device_fault', 'refund'),
]

// The active step sequence, derived from the draft. Drives NEXT / BACK and the
// progress bar — there is no per-step skip logic to keep in sync.
export function sequenceFor(state) {
  const s = state?.situation
  if (!s || !DECISION_STEPS[s]) return DEFAULT_SEQUENCE
  return [...DECISION_STEPS[s], ...tailSteps(s, state.remedy)]
}

// claimType derived from the situation (+ remedy for the two fork branches).
// Null until the fork is resolved on the remedy screen.
export function claimTypeFor(situation, remedy) {
  switch (situation) {
    case 'changed_mind':
      return 'change_of_mind'
    case 'keep_compensation':
      return 'compensation'
    case 'device_fault':
      return remedy === 'repair' ? 'warranty' : remedy === 'refund' ? 'issue' : null
    case 'wrong_item':
      // refund and replacement both ride the issue pipeline (replacement is
      // distinguished by `remedy` for the tail + confirmation copy).
      return remedy ? 'issue' : null
    default:
      return null
  }
}

// Macro step groups for the progress bar. The whole decision phase (situation →
// reason / category / specific / wrongitem / remedy / compproblem) reads as a
// single "Step 1" with internal sub-progress, so the redesign's extra decision
// screens don't lengthen the overall flow. Each later step is its own macro
// step; `confirm` carries no bar.
const STEP_GROUPS = [
  {
    id: 'details',
    steps: ['situation', 'reason', 'category', 'specific', 'wrongitem', 'remedy', 'compproblem'],
  },
  { id: 'evidence', steps: ['evidence'] },
  { id: 'prep', steps: ['deviceprep'] },
  { id: 'packing', steps: ['packing'] },
  { id: 'pickup', steps: ['pickup'] },
  { id: 'refund', steps: ['refund'] },
  { id: 'review', steps: ['review'] },
]

function groupIdFor(step) {
  const g = STEP_GROUPS.find((grp) => grp.steps.includes(step))
  return g ? g.id : null
}

// Progress for the bar: the active sequence collapsed into the macro groups
// present on this path, the current group's position, and the sub-step
// position within it (so the decision segment fills as the customer moves
// situation → … → remedy).
export function progressFor(state) {
  const seq = sequenceFor(state)
  const present = STEP_GROUPS.filter((g) => g.steps.some((s) => seq.includes(s)))
  const currentGroup = groupIdFor(state.step)
  const macroIndex = Math.max(
    1,
    present.findIndex((g) => g.id === currentGroup) + 1,
  )
  const group = present.find((g) => g.id === currentGroup)
  const subSteps = group ? group.steps.filter((s) => seq.includes(s)) : []
  return {
    macroCount: present.length,
    macroIndex,
    subCount: subSteps.length || 1,
    subIndex: Math.max(1, subSteps.indexOf(state.step) + 1),
  }
}

export function initialState({ initialOrderId = null, initialOrder = null } = {}) {
  // Screen 1 is always shown empty — the customer picks every time. Pickup
  // details are pre-seeded from the order's contact info so the user only
  // needs to edit fields that are out of date. `initialOrder` (journey mode)
  // takes precedence — its order isn't in ORDERS, so the lookup would miss
  // without it.
  const order =
    initialOrder ??
    (initialOrderId ? ORDERS.find((o) => o.id === initialOrderId) : null)
  // For the OS-ambiguous `Tablet` category, preselect the iPad guide (the
  // customer can switch to Android in the device-prep step). Everything else
  // resolves directly from the category.
  const resolvedType = deviceTypeForOrder(order)
  const initialDevice = resolvedType === 'tablet' ? 'ipad' : resolvedType
  const initialOs =
    resolvedType === 'tablet' ? 'ios' : deviceOsForOrder(order)
  return {
    step: 'situation',
    // What happened (Screen 1). Drives the branch; resolves to claimType.
    situation: null,
    // Derived downstream contract — set when the situation/remedy resolve it.
    claimType: null,
    // 'refund' | 'repair' | 'replacement' — chosen on the remedy screen for
    // the device_fault / wrong_item branches only.
    remedy: null,
    // device_fault only: the chosen issue category (battery_power / screen_body
    // / …), gating the specific-issue list.
    issueCategory: null,
    issueScope: null,
    issueSubtypeId: null,
    compensationSubtype: null,
    orderId: initialOrderId,
    units: 1,
    reason: { value: null, otherText: '' },
    issueDetails: {
      description: '',
      attachmentName: '',
      // Guided slotted proof capture for the issue/warranty/wrong-item evidence
      // step: a map of slotId -> { label, filename }. `attachmentName` is kept
      // for the compensation uploader + seeded mocks, which still use the
      // single-file model.
      proofSlots: {},
    },
    // Optional battery-health self-check (§7.2). Only surfaced on the
    // `battery` sub-type; never gates progression — the customer can skip
    // it and submit proof + description instead.
    batteryCheck: {
      capacity: '',
      nonOriginal: false,
    },
    // Only one device-prep path remains: the guided reset (which itself
    // covers locked / broken devices via its remote route). `option` is
    // pinned to 'reset' so the downstream Review / Confirmation summaries
    // and `devicePrepText` keep rendering the reset branch.
    devicePrep: {
      option: 'reset',
      os: initialOs,
      device: initialDevice,
      resetConfirmed: false,
      resetGuideSeen: false,
      // Change-of-mind escape hatch: a device that was never set up has no
      // account linked and nothing to erase, so the customer can attest to
      // that instead of running the guided reset. Only offered / honored on
      // the change_of_mind flow (see stepError + Step3DevicePrep).
      neverSetUp: false,
    },
    // Country selects the structured address schema (lib/address.js). It never
    // changes mid-flow, so it lives at the top of the draft beside the seed.
    country: order?.country ?? DEFAULT_COUNTRY,
    pickupDetails: {
      // Structured, country-shaped address (object keyed by schema field id).
      // Seeded from the order's saved fields when present, else a blank set.
      address: order?.addressFields ?? emptyAddress(order?.country),
      email: order?.email || '',
      phone: order?.phone || '',
    },
    pickupConfirmed: false,
    refundMethod: null,
    packingMethod: null,
    packingConfirmed: false,
    factoryResetConfirmed: false,
    claimRef: null,
    // Soft-validation flag: set by ATTEMPT when Continue is clicked with a
    // required input still missing, and cleared atomically by every
    // step-changing action (NEXT / BACK / GO_TO_STEP / SUBMIT /
    // SET_SITUATION / SWITCH_SITUATION) so the next step never paints its
    // errors before the user has tried to advance.
    attempted: false,
  }
}

// Branch-specific draft cleared whenever the customer (re)picks a situation or
// is moved by an accepted tripwire — a wrong-lane selection must never carry
// over into the new branch.
function resetBranchDraft(situation, { scope = null } = {}) {
  return {
    situation,
    claimType: claimTypeFor(situation, null),
    remedy: null,
    issueCategory: null,
    issueScope: scope,
    issueSubtypeId: null,
    compensationSubtype: null,
    reason: { value: null, otherText: '' },
  }
}

export function flowReducer(state, action) {
  switch (action.type) {
    // Screen 1 selection. Sets the situation (and the claimType it already
    // determines for the non-fork branches), resetting any prior branch draft.
    // Continue then advances via NEXT down the now-situation-specific sequence.
    case 'SET_SITUATION':
      return { ...state, ...resetBranchDraft(action.value), attempted: false }
    // Tripwire accepted: jump to the target situation's branch entry, carrying
    // an optional pre-filled issue scope (e.g. a fault tripwire → not_working).
    case 'SWITCH_SITUATION':
      return {
        ...state,
        ...resetBranchDraft(action.value, { scope: action.scope ?? null }),
        step: BRANCH_ENTRY[action.value] || 'situation',
        attempted: false,
      }
    // device_fault category pick. Changing category clears the specific issue
    // chosen beneath the old one.
    case 'SET_CATEGORY':
      return {
        ...state,
        issueCategory: action.value,
        issueSubtypeId:
          action.value === state.issueCategory ? state.issueSubtypeId : null,
        attempted: false,
      }
    // Remedy pick on the device_fault / wrong_item branches — this is where the
    // fork resolves the downstream claimType.
    case 'SET_REMEDY':
      return {
        ...state,
        remedy: action.value,
        claimType: claimTypeFor(state.situation, action.value),
      }
    case 'SET_ISSUE_SUBTYPE':
      return {
        ...state,
        issueScope: action.scope,
        issueSubtypeId: action.id,
      }
    case 'SET_COMPENSATION_SUBTYPE':
      return { ...state, compensationSubtype: action.value }
    case 'SET_REASON':
      return { ...state, reason: { ...state.reason, ...action.value } }
    case 'SET_ISSUE_DETAILS':
      return {
        ...state,
        issueDetails: { ...state.issueDetails, ...action.value },
      }
    case 'SET_BATTERY_CHECK':
      return {
        ...state,
        batteryCheck: { ...state.batteryCheck, ...action.value },
      }
    case 'SET_DEVICE_PREP':
      return { ...state, devicePrep: { ...state.devicePrep, ...action.value } }
    case 'SET_PICKUP_DETAILS':
      return {
        ...state,
        pickupDetails: { ...state.pickupDetails, ...action.value },
      }
    case 'SET_PICKUP_CONFIRMED':
      return { ...state, pickupConfirmed: action.value }
    case 'SET_REFUND_METHOD':
      return { ...state, refundMethod: action.value }
    case 'SET_PACKING_METHOD':
      return { ...state, packingMethod: action.value }
    case 'SET_PACKING_CONFIRMED':
      return { ...state, packingConfirmed: action.value }
    case 'SET_FACTORY_RESET_CONFIRMED':
      return { ...state, factoryResetConfirmed: action.value }
    case 'ATTEMPT':
      return { ...state, attempted: true }
    case 'GO_TO_STEP': {
      // Edit links from Review jump to a step key; ignore targets that
      // aren't part of the active flow's sequence (defensive).
      const seq = sequenceFor(state)
      const target = seq.includes(action.value) ? action.value : state.step
      return { ...state, step: target, attempted: false }
    }
    case 'NEXT': {
      const seq = sequenceFor(state)
      const i = seq.indexOf(state.step)
      const next = seq[Math.min(seq.length - 1, i + 1)]
      return { ...state, step: next, attempted: false }
    }
    case 'BACK': {
      const seq = sequenceFor(state)
      const i = seq.indexOf(state.step)
      const prev = seq[Math.max(0, i - 1)]
      return { ...state, step: prev, attempted: false }
    }
    case 'SUBMIT':
      return { ...state, claimRef: action.value, step: 'confirm', attempted: false }
    default:
      return state
  }
}

// First unmet requirement for the current step, in the order we want to
// surface them ("one at a time" — only the topmost missing input lights up).
// Returns a stable key the step component matches against, or null when the
// step is complete. This is the gate `ClaimFlow.handlePrimary` reads on a
// Continue click: a non-null key blocks advancement and flips the step into
// its attempted/error state instead of graying the button.
export function stepError(state) {
  switch (state.step) {
    case 'situation':
      return state.situation ? null : 'situation'
    // Reason is required on the change-of-mind branch. A tripwire reason is a
    // valid value here (it opens the switch sheet from ClaimFlow rather than
    // advancing), so it's never gated.
    case 'reason':
      return state.reason.value ? null : 'reason'
    case 'category':
      return state.issueCategory ? null : 'category'
    case 'specific':
      // The "Something else" category is a free-text capture, not a radio
      // list — gate on a non-empty description instead of a chosen subtype.
      if (state.issueCategory === 'something_else')
        return state.issueDetails.description.trim() ? null : 'description'
      return state.issueSubtypeId ? null : 'subtype'
    case 'wrongitem':
      return state.issueSubtypeId ? null : 'subtype'
    case 'remedy':
      return state.remedy ? null : 'remedy'
    // Compensation problem screen keeps its on-screen evidence (standalone,
    // agent-reviewed claim) — same keys as the old compsubtype step.
    case 'compproblem': {
      const id = state.issueDetails
      if (!state.compensationSubtype) return 'subtype'
      if (id.description.trim().length === 0) return 'description'
      if (!id.attachmentName) return 'attachment'
      return null
    }
    // Evidence step: proof is now guided slotted capture (IssueEvidence) and is
    // advisory — it never gates the step (the slot UI shows a soft "missing
    // proof" warning instead). Only the description is still required here.
    case 'evidence': {
      if (state.issueDetails.description.trim().length === 0) return 'description'
      return null
    }
    case 'deviceprep': {
      const dp = state.devicePrep
      // Change-of-mind only: attesting the device was never set up satisfies
      // the step in place of the guided reset.
      if (state.claimType === 'change_of_mind' && dp.neverSetUp) return null
      if (!dp.resetGuideSeen) return 'resetGuide'
      if (dp.resetConfirmed !== true) return 'resetConfirm'
      return null
    }
    case 'packing':
      return state.packingMethod !== null ? null : 'packing'
    case 'pickup': {
      const pd = state.pickupDetails
      if (addressError(pd.address, state.country)) return 'address'
      if (pd.email.trim().length === 0) return 'email'
      if (pd.phone.trim().length === 0) return 'phone'
      if (state.pickupConfirmed !== true) return 'pickupConfirm'
      return null
    }
    case 'refund':
      return state.refundMethod === 'wallet' || state.refundMethod === 'original'
        ? null
        : 'refundMethod'
    default:
      return null
  }
}

// Per-step validity predicate. Retained as a plain validity check; the button
// is never disabled (soft validation), so this no longer drives any UI.
export function canAdvance(state) {
  return stepError(state) === null
}
