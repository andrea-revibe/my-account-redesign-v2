import { ORDERS } from '../../data/orders'

export const TOTAL_STEPS = 7

export function initialState(initialOrderId = null) {
  // Entering from a specific delivered product card pre-seeds the order and
  // claim type, but the user still starts on Step 1 to confirm what kind of
  // claim they're raising. Step 4 (pickup details) is also pre-seeded from
  // the order's contact info so the user only needs to edit fields that are
  // out of date.
  const order = initialOrderId
    ? ORDERS.find((o) => o.id === initialOrderId)
    : null
  return {
    step: 1,
    claimType: initialOrderId ? 'change_of_mind' : null,
    orderId: initialOrderId,
    units: 1,
    reason: { value: null, otherText: '' },
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
    claimRef: null,
  }
}

export function flowReducer(state, action) {
  switch (action.type) {
    case 'SET_CLAIM_TYPE':
      return { ...state, claimType: action.value }
    case 'SET_REASON':
      return { ...state, reason: { ...state.reason, ...action.value } }
    case 'SET_DEVICE_PREP':
      return { ...state, devicePrep: { ...state.devicePrep, ...action.value } }
    case 'SET_PICKUP_DETAILS':
      return {
        ...state,
        pickupDetails: { ...state.pickupDetails, ...action.value },
      }
    case 'SET_REFUND_METHOD':
      return { ...state, refundMethod: action.value }
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
      return state.claimType === 'change_of_mind'
    case 2:
      return true
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
      return true
    default:
      return false
  }
}
