import { useEffect, useMemo, useReducer } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { ORDERS } from '../../data/orders'
import {
  flowReducer,
  initialState,
  canAdvance,
  TOTAL_STEPS,
} from './flowReducer'
import { generateClaimRef } from '../../lib/returns'
import ProgressBar from './ProgressBar'
import StickyActionBar from './StickyActionBar'
import Step1ClaimType from './Step1ClaimType'
import Step2OrderSelection from './Step2OrderSelection'
import Step3ProductQuantity from './Step3ProductQuantity'
import Step4Reason from './Step4Reason'
import Step5DevicePrep from './Step5DevicePrep'
import Step6ReturnMethod from './Step6ReturnMethod'
import Step7RefundMethod from './Step7RefundMethod'
import Step8Review from './Step8Review'
import Step9Confirmation from './Step9Confirmation'

export default function ClaimFlow({ initialOrderId, onClose }) {
  const [state, dispatch] = useReducer(
    flowReducer,
    initialOrderId,
    initialState,
  )

  // Lock background scroll while the overlay is up; restore on unmount.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const order = useMemo(
    () => ORDERS.find((o) => o.id === state.orderId) || null,
    [state.orderId],
  )

  const isConfirmation = state.step === TOTAL_STEPS && state.claimRef
  const isReview = state.step === 8

  const handlePrimary = () => {
    if (isReview) {
      dispatch({ type: 'SUBMIT', value: generateClaimRef() })
      return
    }
    dispatch({ type: 'NEXT' })
  }

  const handleBack = () => {
    if (state.step === 1 || isConfirmation) {
      onClose()
      return
    }
    dispatch({ type: 'BACK' })
  }

  const primaryLabel = isReview ? 'Submit return request' : 'Continue'
  const primaryVariant = isReview ? 'success' : 'brand'

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center"
      role="dialog"
      aria-modal="true"
      aria-label="Return an item"
    >
      <div className="relative w-full max-w-mobile bg-canvas flex flex-col animate-fadeIn">
        {!isConfirmation && (
          <header className="sticky top-0 z-10 bg-surface border-b border-line">
            <div className="flex items-center px-2 pt-3 pb-2">
              <button
                type="button"
                aria-label={state.step === 1 ? 'Close' : 'Back'}
                onClick={handleBack}
                className="w-9 h-9 rounded-full grid place-items-center text-ink hover:bg-line-2"
              >
                <ChevronLeft size={20} strokeWidth={1.75} />
              </button>
              <div className="flex-1" />
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="w-9 h-9 rounded-full grid place-items-center text-ink hover:bg-line-2"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            <ProgressBar step={state.step} />
          </header>
        )}

        <main className="flex-1 overflow-y-auto pb-4">
          {state.step === 1 && (
            <Step1ClaimType state={state} dispatch={dispatch} />
          )}
          {state.step === 2 && (
            <Step2OrderSelection state={state} dispatch={dispatch} />
          )}
          {state.step === 3 && (
            <Step3ProductQuantity
              state={state}
              dispatch={dispatch}
              order={order}
            />
          )}
          {state.step === 4 && (
            <Step4Reason state={state} dispatch={dispatch} />
          )}
          {state.step === 5 && (
            <Step5DevicePrep state={state} dispatch={dispatch} order={order} />
          )}
          {state.step === 6 && (
            <Step6ReturnMethod state={state} dispatch={dispatch} />
          )}
          {state.step === 7 && (
            <Step7RefundMethod
              state={state}
              dispatch={dispatch}
              order={order}
            />
          )}
          {state.step === 8 && (
            <Step8Review state={state} dispatch={dispatch} order={order} />
          )}
          {isConfirmation && (
            <Step9Confirmation
              state={state}
              order={order}
              onClose={onClose}
            />
          )}
        </main>

        {!isConfirmation && (
          <StickyActionBar
            primaryLabel={primaryLabel}
            primaryVariant={primaryVariant}
            primaryDisabled={!canAdvance(state, order)}
            onPrimary={handlePrimary}
            secondaryLabel={state.step === 4 ? 'Skip' : null}
            onSecondary={
              state.step === 4 ? () => dispatch({ type: 'NEXT' }) : null
            }
          />
        )}
      </div>
    </div>
  )
}
