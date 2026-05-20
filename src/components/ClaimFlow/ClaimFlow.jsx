import { useEffect, useMemo, useReducer } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { ORDERS } from '../../data/orders'
import {
  flowReducer,
  initialState,
  canAdvance,
  TOTAL_STEPS,
} from './flowReducer'
import { generateClaimRef, refundBreakdown } from '../../lib/returns'
import { expectedCompletionFor } from '../../lib/claims'
import ProgressBar from './ProgressBar'
import StickyActionBar from './StickyActionBar'
import Step1ClaimType from './Step1ClaimType'
import Step2Reason from './Step2Reason'
import Step2IssueDetails from './Step2IssueDetails'
import Step3DevicePrep from './Step3DevicePrep'
import Step4PickupDetails from './Step4PickupDetails'
import Step5RefundMethod from './Step5RefundMethod'
import Step6Review from './Step6Review'
import Step7Confirmation from './Step7Confirmation'

export default function ClaimFlow({
  initialOrderId,
  initialOrder = null,
  onClose,
  onSubmitClaim,
  onTrackClaim,
}) {
  const [state, dispatch] = useReducer(
    flowReducer,
    { initialOrderId, initialOrder },
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
    () => initialOrder ?? ORDERS.find((o) => o.id === state.orderId) ?? null,
    [initialOrder, state.orderId],
  )

  const isConfirmation = state.step === TOTAL_STEPS && state.claimRef
  const isReview = state.step === 6

  const handlePrimary = () => {
    if (isReview) {
      const claimRef = generateClaimRef()
      if (order && onSubmitClaim) {
        onSubmitClaim(order.id, buildClaim({ state, order, claimRef }))
      }
      dispatch({ type: 'SUBMIT', value: claimRef })
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

  const primaryLabel = isReview
    ? state.claimType === 'warranty'
      ? 'Submit warranty claim'
      : 'Submit return request'
    : 'Continue'
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
            <ProgressBar step={state.step} claimType={state.claimType} />
          </header>
        )}

        <main className="flex-1 overflow-y-auto pb-4">
          {state.step === 1 && (
            <Step1ClaimType state={state} dispatch={dispatch} />
          )}
          {state.step === 2 &&
            (state.claimType === 'issue' || state.claimType === 'warranty') && (
              <Step2IssueDetails state={state} dispatch={dispatch} />
            )}
          {state.step === 2 && state.claimType === 'change_of_mind' && (
            <Step2Reason state={state} dispatch={dispatch} />
          )}
          {state.step === 3 && (
            <Step3DevicePrep state={state} dispatch={dispatch} order={order} />
          )}
          {state.step === 4 && (
            <Step4PickupDetails state={state} dispatch={dispatch} />
          )}
          {state.step === 5 && (
            <Step5RefundMethod
              state={state}
              dispatch={dispatch}
              order={order}
            />
          )}
          {state.step === 6 && (
            <Step6Review state={state} dispatch={dispatch} order={order} />
          )}
          {isConfirmation && (
            <Step7Confirmation
              state={state}
              order={order}
              onClose={onClose}
              onTrack={onTrackClaim}
            />
          )}
        </main>

        {!isConfirmation && (
          <StickyActionBar
            primaryLabel={primaryLabel}
            primaryVariant={primaryVariant}
            primaryDisabled={!canAdvance(state)}
            onPrimary={handlePrimary}
            secondaryLabel={
              state.step === 2 && state.claimType === 'change_of_mind'
                ? 'Skip'
                : null
            }
            onSecondary={
              state.step === 2 && state.claimType === 'change_of_mind'
                ? () => dispatch({ type: 'NEXT' })
                : null
            }
          />
        )}
      </div>
    </div>
  )
}

// '19 May · 9:12 AM'-style timestamp matching the existing claim mocks.
function formatStamp(d = new Date()) {
  const day = d.getDate()
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(d)
  let hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${day} ${month} · ${hours}:${minutes} ${ampm}`
}

// '19 May 2026 · 9:12 AM' — used for `claim.submittedAt`.
function formatSubmittedAt(d = new Date()) {
  const day = d.getDate()
  const month = new Intl.DateTimeFormat('en-GB', { month: 'short' }).format(d)
  const year = d.getFullYear()
  let hours = d.getHours()
  const minutes = d.getMinutes().toString().padStart(2, '0')
  const ampm = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  return `${day} ${month} ${year} · ${hours}:${minutes} ${ampm}`
}

// 'Tomorrow, 21 May' — pickup is tentatively scheduled the day after
// submission. Used only for the seeded `scheduledPickup` strip.
function formatScheduledPickup(today = new Date()) {
  const next = new Date(today.getTime() + 24 * 60 * 60 * 1000)
  const weekday = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(next)
  const month = new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(next)
  return `${weekday}, ${next.getDate()} ${month}`
}

// Build the claim object that gets stitched onto the order in App.jsx.
// Shape mirrors the seeded mocks in src/data/orders.js — refund flows
// land on ClaimCard; warranty flows land on WarrantyClaimCard via the
// type === 'warranty' branch in App.jsx routing.
function buildClaim({ state, order, claimRef }) {
  const now = new Date()
  const submittedAt = formatSubmittedAt(now)
  const initiatedStamp = formatStamp(now)

  const base = {
    claimRef,
    claimStatusId: 'initiated',
    type: state.claimType,
    submittedAt,
    units: state.units || 1,
    devicePrep: { ...state.devicePrep },
    pickupDetails: { ...state.pickupDetails },
    scheduledPickup: {
      courier: 'DHL Express',
      date: formatScheduledPickup(now),
      slot: '10 AM – 12 PM',
    },
    timeline: { initiated: initiatedStamp },
  }

  if (state.claimType === 'change_of_mind') {
    return {
      ...base,
      reason: { ...state.reason },
      refundMethod: state.refundMethod,
      expectedRefund: refundBreakdown(
        order,
        state.units,
        state.refundMethod,
        state.claimType,
      ),
    }
  }

  if (state.claimType === 'issue') {
    return {
      ...base,
      issueDetails: { ...state.issueDetails },
      issueScope: state.issueScope,
      issueSubtypeId: state.issueSubtypeId,
      refundMethod: state.refundMethod,
      expectedRefund: refundBreakdown(
        order,
        state.units,
        state.refundMethod,
        state.claimType,
      ),
    }
  }

  // Warranty — no refund block; carry a placeholder repairWindow so the
  // WarrantyClaimCard's later `under_repair` hero has something to land
  // on if/when the claim is progressed manually.
  const eta = expectedCompletionFor('warranty', now)
  return {
    ...base,
    issueDetails: { ...state.issueDetails },
    issueScope: state.issueScope,
    issueSubtypeId: state.issueSubtypeId,
    repairWindow: {
      expectedComplete: eta.short,
      expectedCompleteLong: eta.long,
      note: 'We\'ll confirm the exact repair window after inspection.',
    },
  }
}
