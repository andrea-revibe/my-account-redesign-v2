import { useEffect, useMemo, useReducer, useState } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { ORDERS } from '../../data/orders'
import {
  flowReducer,
  initialState,
  canAdvance,
  TOTAL_STEPS,
} from './flowReducer'
import { generateClaimRef, refundBreakdown, assessBattery } from '../../lib/returns'
import { expectedCompletionFor } from '../../lib/claims'
import ProgressBar from './ProgressBar'
import StickyActionBar from './StickyActionBar'
import Step1ClaimType from './Step1ClaimType'
import Step2Reason from './Step2Reason'
import Step2IssueDetails from './Step2IssueDetails'
import Step2Compensation from './Step2Compensation'
import Step3DevicePrep from './Step3DevicePrep'
import Step4Packing from './Step4Packing'
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
  const [submitAttempted, setSubmitAttempted] = useState(false)
  const [devicePrepAttempted, setDevicePrepAttempted] = useState(false)

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
  const isReview = state.step === 7

  const handlePrimary = () => {
    if (isReview) {
      // Compensation keeps the device — no factory-reset / packing acks to
      // gate on. Refund + warranty flows still require both.
      const requiresAcks = state.claimType !== 'compensation'
      if (
        requiresAcks &&
        (!state.factoryResetConfirmed || !state.packingConfirmed)
      ) {
        setSubmitAttempted(true)
        return
      }
      const claimRef = generateClaimRef()
      if (order && onSubmitClaim) {
        onSubmitClaim(order.id, buildClaim({ state, order, claimRef }))
      }
      dispatch({ type: 'SUBMIT', value: claimRef })
      return
    }
    // Reset option on iOS: the customer must go through the guide (open it
    // and tap Done) before they can confirm. Surface the gate on a
    // premature Continue instead of advancing.
    if (
      state.step === 3 &&
      state.devicePrep.option === 'reset' &&
      state.devicePrep.os === 'ios' &&
      !state.devicePrep.resetGuideSeen
    ) {
      setDevicePrepAttempted(true)
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
      : state.claimType === 'compensation'
        ? 'Submit compensation request'
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
              <Step2IssueDetails
                state={state}
                dispatch={dispatch}
                order={order}
              />
            )}
          {state.step === 2 && state.claimType === 'change_of_mind' && (
            <Step2Reason state={state} dispatch={dispatch} />
          )}
          {state.step === 2 && state.claimType === 'compensation' && (
            <Step2Compensation state={state} dispatch={dispatch} />
          )}
          {state.step === 3 && (
            <Step3DevicePrep
              state={state}
              dispatch={dispatch}
              order={order}
              attempted={devicePrepAttempted}
            />
          )}
          {state.step === 4 && (
            <Step4Packing state={state} dispatch={dispatch} />
          )}
          {state.step === 5 && (
            <Step4PickupDetails state={state} dispatch={dispatch} />
          )}
          {state.step === 6 && (
            <Step5RefundMethod
              state={state}
              dispatch={dispatch}
              order={order}
            />
          )}
          {state.step === 7 && (
            <Step6Review
              state={state}
              dispatch={dispatch}
              order={order}
              submitAttempted={submitAttempted}
            />
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
// Carry the optional Step-2 battery self-check onto the claim when it was
// filled in for a battery sub-type. Data only — no tracking-card surface
// reads it yet (see docs/output/returns/issue.md §battery check).
function batteryAssessmentForClaim(state, order) {
  if (state.issueSubtypeId !== 'battery') return null
  const { capacity, nonOriginal } = state.batteryCheck
  const filled = nonOriginal || (capacity !== '' && capacity != null)
  if (!filled) return null
  const a = assessBattery({ order, capacity, nonOriginal })
  return {
    capacity: a.capacity,
    baseline: a.baseline,
    degradation: a.degradation,
    nonOriginal,
    remedy: a.remedy,
    reason: a.reason,
  }
}

function buildClaim({ state, order, claimRef }) {
  const now = new Date()
  const submittedAt = formatSubmittedAt(now)
  const initiatedStamp = formatStamp(now)
  const batteryAssessment = batteryAssessmentForClaim(state, order)

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

  if (state.claimType === 'compensation') {
    // Customer keeps the device: no scheduled pickup, device prep, or
    // pickup details, and no `expectedRefund` — the amount is confirmed by
    // support after the evidence review (claim.amountPending). Lands on the
    // compensation pipeline's `initiated` ("Claim submitted") state.
    return {
      claimRef,
      claimStatusId: 'initiated',
      type: 'compensation',
      submittedAt,
      units: state.units || 1,
      compensationSubtype: state.compensationSubtype,
      issueDetails: { ...state.issueDetails },
      refundMethod: state.refundMethod,
      amountPending: true,
      timeline: { initiated: initiatedStamp },
    }
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
      ...(batteryAssessment ? { batteryAssessment } : {}),
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
    ...(batteryAssessment ? { batteryAssessment } : {}),
    repairWindow: {
      expectedComplete: eta.short,
      expectedCompleteLong: eta.long,
      note: 'We\'ll confirm the exact repair window after inspection.',
    },
  }
}
