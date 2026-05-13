export const TOTAL_STEPS = 9

export function initialState(initialOrderId = null) {
  // Entering from a specific order pre-seeds the claim type and lands the
  // user on Step 2 with that order selected — they can still back-step to
  // Step 1 to confirm the claim type.
  return {
    step: initialOrderId ? 2 : 1,
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
    returnMethod: { id: null, address: '' },
    refundMethod: null,
    claimRef: null,
  }
}

export function flowReducer(state, action) {
  switch (action.type) {
    case 'SET_CLAIM_TYPE':
      return { ...state, claimType: action.value }
    case 'SET_ORDER':
      // Reset downstream selections that depend on the order.
      return {
        ...state,
        orderId: action.value,
        units: 1,
      }
    case 'SET_UNITS':
      return { ...state, units: action.value }
    case 'SET_REASON':
      return { ...state, reason: { ...state.reason, ...action.value } }
    case 'SET_DEVICE_PREP':
      return { ...state, devicePrep: { ...state.devicePrep, ...action.value } }
    case 'SET_RETURN_METHOD':
      return {
        ...state,
        returnMethod: { ...state.returnMethod, ...action.value },
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
export function canAdvance(state, orderForFlow) {
  switch (state.step) {
    case 1:
      return state.claimType === 'change_of_mind'
    case 2:
      return Boolean(state.orderId)
    case 3: {
      const maxUnits = orderForFlow?.quantity || 1
      return state.units >= 1 && state.units <= maxUnits
    }
    case 4:
      return true
    case 5: {
      const dp = state.devicePrep
      if (dp.option === 'reset') return dp.resetConfirmed === true
      if (dp.option === 'credentials')
        return dp.email.trim().length > 0 && dp.password.length > 0
      return false
    }
    case 6: {
      const rm = state.returnMethod
      if (!rm.id) return false
      if (rm.id === 'courier' && rm.address.trim().length === 0) return false
      return true
    }
    case 7:
      return state.refundMethod === 'wallet' || state.refundMethod === 'original'
    case 8:
      return true
    default:
      return false
  }
}
