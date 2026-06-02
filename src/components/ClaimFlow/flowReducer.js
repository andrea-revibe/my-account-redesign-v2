import { ORDERS } from '../../data/orders'

export const TOTAL_STEPS = 8

// Warranty submissions skip Step 6 (refund method) — no money changes
// hands, so the customer-visible step count drops by one. Compensation
// claims keep the device, so they skip Steps 3 (device prep), 4 (packing)
// and 5 (pickup) entirely — 5 visible steps (1, 2, 6, 7, 8). NEXT / BACK /
// GO_TO_STEP step over the skipped screens for each type.
export function visibleStepCount(claimType) {
  if (claimType === 'warranty') return TOTAL_STEPS - 1
  if (claimType === 'compensation') return TOTAL_STEPS - 3
  return TOTAL_STEPS
}

// Maps a state.step (1..8 internally — 4 = packing, 5 = pickup, 6 =
// refund method, 7 = review, 8 = confirmation) onto the position the
// user sees in the progress bar (1..visibleStepCount).
export function visibleStepIndex(step, claimType) {
  if (claimType === 'warranty') return step >= 6 ? step - 1 : step
  // Compensation collapses 3/4/5 — only 1, 2, 6, 7, 8 are reachable, so
  // everything from the refund step on shifts down by three.
  if (claimType === 'compensation') return step >= 6 ? step - 3 : step
  return step
}

export function initialState({ initialOrderId = null, initialOrder = null } = {}) {
  // Step 1 (claim type) is always shown empty — the customer picks every
  // time. Step 4 (pickup details) is pre-seeded from the order's contact
  // info so the user only needs to edit fields that are out of date.
  // `initialOrder` (journey mode) takes precedence — its order isn't in
  // ORDERS, so the lookup would miss without it.
  const order =
    initialOrder ??
    (initialOrderId ? ORDERS.find((o) => o.id === initialOrderId) : null)
  return {
    step: 1,
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
    devicePrep: {
      option: null,
      os: 'ios',
      resetConfirmed: false,
      accountUnlinked: false,
      passcode: '',
      resetGuideChecks: {},
      resetGuideSeen: false,
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
    // step-changing action (NEXT / BACK / GO_TO_STEP / SUBMIT) so the next
    // step never paints its errors before the user has tried to advance.
    attempted: false,
  }
}

export function flowReducer(state, action) {
  switch (action.type) {
    case 'SET_CLAIM_TYPE': {
      // The warranty branch reuses Step 2's issue picker, so the
      // sub-issue is only cleared when leaving evidence-collecting flows
      // (issue / warranty) for a different claim type (e.g. change_of_mind).
      const usesIssuePicker =
        action.value === 'issue' || action.value === 'warranty'
      return {
        ...state,
        claimType: action.value,
        issueScope: usesIssuePicker ? state.issueScope : null,
        issueSubtypeId: usesIssuePicker ? state.issueSubtypeId : null,
        compensationSubtype:
          action.value === 'compensation' ? state.compensationSubtype : null,
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
      // Edit links from Review must never land the user on Step 6 when
      // there is no refund-method step in the warranty flow.
      const target =
        state.claimType === 'warranty' && action.value === 6
          ? 5
          : action.value
      return { ...state, step: target, attempted: false }
    }
    case 'NEXT': {
      const next = state.step + 1
      // Warranty skips Step 6 (refund); compensation skips 3/4/5 (device
      // prep, packing, pickup) — from Step 2 it jumps straight to refund.
      if (state.claimType === 'warranty' && next === 6) {
        return { ...state, step: 7, attempted: false }
      }
      if (state.claimType === 'compensation' && next === 3) {
        return { ...state, step: 6, attempted: false }
      }
      return { ...state, step: Math.min(TOTAL_STEPS, next), attempted: false }
    }
    case 'BACK': {
      const prev = state.step - 1
      if (state.claimType === 'warranty' && prev === 6) {
        return { ...state, step: 5, attempted: false }
      }
      if (state.claimType === 'compensation' && prev === 5) {
        return { ...state, step: 2, attempted: false }
      }
      return { ...state, step: Math.max(1, prev), attempted: false }
    }
    case 'SUBMIT':
      return { ...state, claimRef: action.value, step: TOTAL_STEPS, attempted: false }
    default:
      return state
  }
}

// First unmet requirement for the current step, in the order we want to
// surface them ("one at a time" — only the topmost missing input lights
// up). Returns a stable key the step component matches against, or null
// when the step is complete. This is the gate `ClaimFlow.handlePrimary`
// reads on a Continue click: a non-null key blocks advancement and flips
// the step into its attempted/error state instead of graying the button.
//
// Note this intentionally diverges from `canAdvance` on the iOS reset
// path: there `canAdvance` returns true (so the button was never
// disabled) and the premature-Continue gate lives here as 'resetGuide'.
export function stepError(state) {
  switch (state.step) {
    case 1:
      return state.claimType ? null : 'claimType'
    case 2: {
      const id = state.issueDetails
      if (state.claimType === 'issue' || state.claimType === 'warranty') {
        if (!state.issueSubtypeId) return 'subtype'
        if (id.description.trim().length === 0) return 'description'
        if (!id.attachmentName) return 'attachment'
        return null
      }
      if (state.claimType === 'compensation') {
        if (!state.compensationSubtype) return 'subtype'
        if (id.description.trim().length === 0) return 'description'
        if (!id.attachmentName) return 'attachment'
        return null
      }
      return null
    }
    case 3: {
      const dp = state.devicePrep
      if (!dp.option) return 'devicePrepOption'
      if (dp.option === 'reset') {
        if (dp.os === 'ios' && !dp.resetGuideSeen) return 'resetGuide'
        if (dp.resetConfirmed !== true) return 'resetConfirm'
        return null
      }
      if (dp.option === 'credentials') {
        if (dp.accountUnlinked !== true) return 'unlink'
        if (dp.passcode.length !== 6) return 'passcode'
        return null
      }
      return 'devicePrepOption'
    }
    case 4:
      return state.packingMethod !== null ? null : 'packing'
    case 5: {
      const pd = state.pickupDetails
      if (pd.address.trim().length === 0) return 'address'
      if (pd.email.trim().length === 0) return 'email'
      if (pd.phone.trim().length === 0) return 'phone'
      if (state.pickupConfirmed !== true) return 'pickupConfirm'
      return null
    }
    case 6:
      return state.refundMethod === 'wallet' || state.refundMethod === 'original'
        ? null
        : 'refundMethod'
    default:
      return null
  }
}

// Per-step validation. Returns true when the user can advance from `state.step`.
export function canAdvance(state) {
  switch (state.step) {
    case 1:
      return (
        state.claimType === 'change_of_mind' ||
        state.claimType === 'issue' ||
        state.claimType === 'warranty' ||
        state.claimType === 'compensation'
      )
    case 2: {
      if (state.claimType === 'issue' || state.claimType === 'warranty') {
        const id = state.issueDetails
        return Boolean(
          state.issueSubtypeId &&
            id.description.trim().length > 0 &&
            id.attachmentName,
        )
      }
      if (state.claimType === 'compensation') {
        const id = state.issueDetails
        return Boolean(
          state.compensationSubtype &&
            id.description.trim().length > 0 &&
            id.attachmentName,
        )
      }
      return true
    }
    case 3: {
      const dp = state.devicePrep
      if (dp.option === 'reset') {
        // On iOS, keep Continue clickable until the guide has been opened
        // and completed, so a premature click can surface the "open the
        // guide" gate (ClaimFlow.handlePrimary) rather than silently
        // disabling the button. Once seen, the confirm checkbox is the gate.
        if (dp.os === 'ios' && !dp.resetGuideSeen) return true
        return dp.resetConfirmed === true
      }
      if (dp.option === 'credentials')
        return dp.accountUnlinked === true && dp.passcode.length === 6
      return false
    }
    case 4:
      return state.packingMethod !== null
    case 5: {
      const pd = state.pickupDetails
      return (
        pd.address.trim().length > 0 &&
        pd.email.trim().length > 0 &&
        pd.phone.trim().length > 0 &&
        state.pickupConfirmed === true
      )
    }
    case 6:
      return state.refundMethod === 'wallet' || state.refundMethod === 'original'
    case 7:
      // Review keeps Submit clickable regardless of the two ack
      // checkboxes. ClaimFlow.handlePrimary enforces the gate and
      // flips unchecked cards into their red error state on a
      // blocked submit.
      return true
    default:
      return false
  }
}
