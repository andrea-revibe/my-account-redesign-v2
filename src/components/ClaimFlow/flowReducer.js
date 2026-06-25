import { ORDERS } from '../../data/orders'
import { deviceOsForOrder, deviceTypeForOrder } from '../../lib/devices'

// Each claim type walks its own ordered list of step keys. The reason
// picker ("Why are you returning it?") is now a shared early step for the
// three return flows (change of mind / issue / warranty) and acts as the
// authoritative router — see Step2Reason.routeForReason. Compensation keeps
// the item, so it skips device prep / packing / pickup and never shows the
// reason step (missing-parts redirects *into* it). NEXT / BACK / GO_TO_STEP
// all walk the active type's sequence, so there's no per-step skip logic to
// keep in sync.
export const STEP_SEQUENCES = {
  change_of_mind: [
    'type',
    'reason',
    'deviceprep',
    'packing',
    'pickup',
    'refund',
    'review',
    'confirm',
  ],
  issue: [
    'type',
    'reason',
    'issuedetails',
    'deviceprep',
    'packing',
    'pickup',
    'refund',
    'review',
    'confirm',
  ],
  warranty: [
    'type',
    'reason',
    'issuedetails',
    'deviceprep',
    'packing',
    'pickup',
    'review',
    'confirm',
  ],
  compensation: ['type', 'compsubtype', 'refund', 'review', 'confirm'],
}

// Before a claim type is chosen we're on 'type'; fall back to the longest
// sequence so the progress bar has a sensible denominator on step 1.
const DEFAULT_SEQUENCE = STEP_SEQUENCES.issue

function sequenceFor(claimType) {
  return STEP_SEQUENCES[claimType] || DEFAULT_SEQUENCE
}

export function visibleStepCount(claimType) {
  return sequenceFor(claimType).length
}

// Position (1-based) of a step key in its type's sequence — drives the
// progress bar's "Step X of Y".
export function visibleStepIndex(step, claimType) {
  const i = sequenceFor(claimType).indexOf(step)
  return i < 0 ? 1 : i + 1
}

export function initialState({ initialOrderId = null, initialOrder = null } = {}) {
  // The claim-type step is always shown empty — the customer picks every
  // time. Pickup details are pre-seeded from the order's contact info so the
  // user only needs to edit fields that are out of date. `initialOrder`
  // (journey mode) takes precedence — its order isn't in ORDERS, so the
  // lookup would miss without it.
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
    step: 'type',
    claimType: null,
    issueScope: null,
    issueSubtypeId: null,
    compensationSubtype: null,
    orderId: initialOrderId,
    units: 1,
    reason: { value: null, otherText: '' },
    issueDetails: {
      description: '',
      attachmentName: '',
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
    pickupDetails: {
      address: order?.address || '',
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
    // ROUTE_FROM_REASON) so the next step never paints its errors before the
    // user has tried to advance.
    attempted: false,
  }
}

export function flowReducer(state, action) {
  switch (action.type) {
    case 'SET_CLAIM_TYPE': {
      // The warranty branch reuses the issue picker, so the sub-issue is only
      // cleared when leaving evidence-collecting flows (issue / warranty) for
      // a different claim type (e.g. change_of_mind).
      const usesIssuePicker =
        action.value === 'issue' || action.value === 'warranty'
      return {
        ...state,
        claimType: action.value,
        issueScope: usesIssuePicker ? state.issueScope : null,
        issueSubtypeId: usesIssuePicker ? state.issueSubtypeId : null,
        compensationSubtype:
          action.value === 'compensation' ? state.compensationSubtype : null,
        attempted: false,
      }
    }
    // Leaving the shared reason step: route to the target track the reason
    // resolves to (Step2Reason.routeForReason), landing on that flow's first
    // post-classification step. When routing to issue/warranty we pre-fill
    // the issue scope from the fault reason (and reset the specific subtype
    // so the customer still picks it). target may equal the current claim
    // type — that's the normal "continue" path.
    case 'ROUTE_FROM_REASON': {
      const target = action.target
      const usesIssuePicker = target === 'issue' || target === 'warranty'
      const dest = usesIssuePicker
        ? 'issuedetails'
        : target === 'compensation'
          ? 'compsubtype'
          : 'deviceprep'
      return {
        ...state,
        claimType: target,
        issueScope: usesIssuePicker
          ? action.scope ?? state.issueScope
          : null,
        issueSubtypeId: usesIssuePicker
          ? action.scope
            ? null
            : state.issueSubtypeId
          : null,
        compensationSubtype:
          target === 'compensation' ? state.compensationSubtype : null,
        // The never-set-up skip is a change_of_mind-only affordance; clear it
        // when routing elsewhere so a back-nav can't carry it into a flow that
        // never offers it.
        devicePrep:
          target === 'change_of_mind'
            ? state.devicePrep
            : { ...state.devicePrep, neverSetUp: false },
        step: dest,
        attempted: false,
      }
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
      const seq = sequenceFor(state.claimType)
      const target = seq.includes(action.value) ? action.value : state.step
      return { ...state, step: target, attempted: false }
    }
    case 'NEXT': {
      const seq = sequenceFor(state.claimType)
      const i = seq.indexOf(state.step)
      const next = seq[Math.min(seq.length - 1, i + 1)]
      return { ...state, step: next, attempted: false }
    }
    case 'BACK': {
      const seq = sequenceFor(state.claimType)
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
    case 'type':
      return state.claimType ? null : 'claimType'
    // Reason is required on all three return flows. A fault / wrong-item
    // reason is valid here (it has a value) — Step2Reason swaps the CTA to
    // "Switch to …" and ROUTE_FROM_REASON handles the redirect, so it's
    // never gated.
    case 'reason': {
      if (!state.reason.value) return 'reason'
      if (
        state.reason.value === 'other' &&
        state.reason.otherText.trim().length === 0
      )
        return 'reasonOther'
      return null
    }
    case 'issuedetails': {
      const id = state.issueDetails
      if (!state.issueSubtypeId) return 'subtype'
      // Reading order: the uploader sits above the description textarea on
      // this step, so surface a missing attachment before the description.
      if (!id.attachmentName) return 'attachment'
      if (id.description.trim().length === 0) return 'description'
      return null
    }
    case 'compsubtype': {
      const id = state.issueDetails
      if (!state.compensationSubtype) return 'subtype'
      if (id.description.trim().length === 0) return 'description'
      if (!id.attachmentName) return 'attachment'
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
      if (pd.address.trim().length === 0) return 'address'
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
