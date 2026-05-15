import { ORDERS } from '../../data/orders'

export const TOTAL_STEPS = 7

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
    refundMethod: null,
    packingConfirmed: false,
    claimRef: null,
  }
}

export function flowReducer(state, action) {
  switch (action.type) {
    case 'SET_CLAIM_TYPE': {
      // Switching off the 'issue' path drops any sub-issue selection so
      // it can't survive into an unrelated flow (e.g. change_of_mind).
      const clearsSubIssue = action.value !== 'issue'
      return {
        ...state,
        claimType: action.value,
        issueScope: clearsSubIssue ? null : state.issueScope,
        issueSubtypeId: clearsSubIssue ? null : state.issueSubtypeId,
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
    case 'SET_REFUND_METHOD':
      return { ...state, refundMethod: action.value }
    case 'SET_PACKING_CONFIRMED':
      return { ...state, packingConfirmed: action.value }
    case 'GO_TO_STEP':
      return { ...state, step: action.value }
    case 'NEXT':
      return { ...state, step: Math.min(TOTAL_STEPS, state.step + 1) }
    case 'BACK':
      return { ...state, step: Math.max(1, state.step - 1) }
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
      return state.claimType === 'change_of_mind' || state.claimType === 'issue'
    case 2: {
      if (state.claimType === 'issue') {
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
        pd.phone.trim().length > 0
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
