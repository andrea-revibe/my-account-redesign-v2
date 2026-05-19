import { ORDERS } from '../../data/orders'

export const TOTAL_STEPS = 7

// Warranty submissions skip Step 5 (refund method) — no money changes
// hands. Customer-visible step count therefore drops to 6 on warranty,
// and NEXT / BACK / GO_TO_STEP step over the refund step.
export function visibleStepCount(claimType) {
  return claimType === 'warranty' ? 6 : TOTAL_STEPS
}

// Maps a state.step (still 1..7 internally so Step 6 = review and Step 7
// = confirmation stay aligned across claim types) onto the position the
// user sees in the progress bar (1..visibleStepCount).
export function visibleStepIndex(step, claimType) {
  if (claimType !== 'warranty') return step
  return step >= 5 ? step - 1 : step
}

export function initialState(initialOrderId = null) {
  // Step 1 (claim type) is always shown empty — the customer picks every
  // time. Step 4 (pickup details) is pre-seeded from the order's contact
  // info so the user only needs to edit fields that are out of date.
  const order = initialOrderId
    ? ORDERS.find((o) => o.id === initialOrderId)
    : null
  return {
    step: 1,
    claimType: null,
    issueScope: null,
    issueSubtypeId: null,
    orderId: initialOrderId,
    units: 1,
    reason: { value: null, otherText: '' },
    issueDetails: {
      description: '',
      attachmentName: '',
    },
    devicePrep: {
      option: null,
      os: 'ios',
      resetConfirmed: false,
      email: '',
      password: '',
    },
    pickupDetails: {
      address: order?.address || '',
      email: order?.email || '',
      phone: order?.phone || '',
    },
    pickupConfirmed: false,
    refundMethod: null,
    packingConfirmed: false,
    claimRef: null,
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
      }
    }
    case 'SET_ISSUE_SUBTYPE':
      return {
        ...state,
        issueScope: action.scope,
        issueSubtypeId: action.id,
      }
    case 'SET_REASON':
      return { ...state, reason: { ...state.reason, ...action.value } }
    case 'SET_ISSUE_DETAILS':
      return {
        ...state,
        issueDetails: { ...state.issueDetails, ...action.value },
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
    case 'SET_PACKING_CONFIRMED':
      return { ...state, packingConfirmed: action.value }
    case 'GO_TO_STEP': {
      // Edit links from Step 6 must never land the user on Step 5 when
      // there is no refund-method step in the warranty flow.
      const target =
        state.claimType === 'warranty' && action.value === 5
          ? 4
          : action.value
      return { ...state, step: target }
    }
    case 'NEXT': {
      const next = state.step + 1
      const skipRefund = state.claimType === 'warranty' && next === 5
      return { ...state, step: Math.min(TOTAL_STEPS, skipRefund ? 6 : next) }
    }
    case 'BACK': {
      const prev = state.step - 1
      const skipRefund = state.claimType === 'warranty' && prev === 5
      return { ...state, step: Math.max(1, skipRefund ? 4 : prev) }
    }
    case 'SUBMIT':
      return { ...state, claimRef: action.value, step: TOTAL_STEPS }
    default:
      return state
  }
}

// Per-step validation. Returns true when the user can advance from `state.step`.
export function canAdvance(state) {
  switch (state.step) {
    case 1:
      return (
        state.claimType === 'change_of_mind' ||
        state.claimType === 'issue' ||
        state.claimType === 'warranty'
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
      return true
    }
    case 3: {
      const dp = state.devicePrep
      if (dp.option === 'reset') return dp.resetConfirmed === true
      if (dp.option === 'credentials')
        return dp.email.trim().length > 0 && dp.password.length > 0
      return false
    }
    case 4: {
      const pd = state.pickupDetails
      return (
        pd.address.trim().length > 0 &&
        pd.email.trim().length > 0 &&
        pd.phone.trim().length > 0 &&
        state.pickupConfirmed === true
      )
    }
    case 5:
      return state.refundMethod === 'wallet' || state.refundMethod === 'original'
    case 6:
      return state.packingConfirmed === true
    default:
      return false
  }
}
