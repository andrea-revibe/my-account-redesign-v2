import { useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { ChevronLeft, X } from 'lucide-react'
import { ORDERS } from '../../data/orders'
import { flowReducer, initialState, stepError } from './flowReducer'
import { generateClaimRef, refundBreakdown, assessBattery } from '../../lib/returns'
import { expectedCompletionFor } from '../../lib/claims'
import ProgressBar from './ProgressBar'
import StickyActionBar from './StickyActionBar'
import Step1ClaimType from './Step1ClaimType'
import Step2Reason, { routeForReason, scopeForReason } from './Step2Reason'
import SwitchFlowSheet from './SwitchFlowSheet'
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
  // Soft-validation lives in the reducer (state.attempted): ATTEMPT sets it,
  // every step-changing action clears it in the same dispatch — so the next
  // step never flashes its errors before the user tries to advance.

  // Tracks the redirect sheet so Escape closes the sheet (its own handler)
  // without also tearing down the whole flow here.
  const switchOpenRef = useRef(false)

  // Lock background scroll while the overlay is up; restore on unmount.
  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => {
      if (e.key === 'Escape' && !switchOpenRef.current) onClose()
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

  const isConfirmation = state.step === 'confirm' && state.claimRef
  const isReview = state.step === 'review'
  const onReasonStep = state.step === 'reason'

  // The reason picker is the router: each reason resolves to a track. When
  // that track differs from the flow the customer is in, a confirm sheet
  // intercepts Continue and offers to switch; when it matches, Continue
  // advances within the current flow. ROUTE_FROM_REASON carries the target +
  // any pre-filled issue scope either way.
  const [switchOpen, setSwitchOpen] = useState(false)
  switchOpenRef.current = switchOpen
  const reasonTarget = onReasonStep && state.reason.value
    ? routeForReason(state.reason.value, state.claimType, order)
    : null
  const reasonIsSwitch = Boolean(reasonTarget && reasonTarget !== state.claimType)

  const routeFromReason = () =>
    dispatch({
      type: 'ROUTE_FROM_REASON',
      target: reasonTarget,
      scope: scopeForReason(state.reason.value),
    })

  const handlePrimary = () => {
    if (onReasonStep) {
      if (stepError(state)) {
        dispatch({ type: 'ATTEMPT' })
        return
      }
      // Mismatched reason → confirm the redirect in a sheet before leaving
      // the step. Matching reason → advance straight away.
      if (reasonIsSwitch) {
        setSwitchOpen(true)
        return
      }
      routeFromReason()
      return
    }
    if (isReview) {
      // Compensation keeps the device — no factory-reset / packing acks to
      // gate on. Refund + warranty flows still require both.
      const requiresAcks = state.claimType !== 'compensation'
      if (
        requiresAcks &&
        (!state.factoryResetConfirmed || !state.packingConfirmed)
      ) {
        dispatch({ type: 'ATTEMPT' })
        return
      }
      const claimRef = generateClaimRef()
      if (order && onSubmitClaim) {
        onSubmitClaim(order.id, buildClaim({ state, order, claimRef }))
      }
      dispatch({ type: 'SUBMIT', value: claimRef })
      return
    }
    // Button is never disabled: a premature Continue surfaces the step's
    // first unmet requirement inline (stepError) instead of advancing.
    if (stepError(state)) {
      dispatch({ type: 'ATTEMPT' })
      return
    }
    dispatch({ type: 'NEXT' })
  }

  const errorKey = state.attempted ? stepError(state) : null

  const handleBack = () => {
    if (state.step === 'type' || isConfirmation) {
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
                aria-label={state.step === 'type' ? 'Close' : 'Back'}
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
          {state.step === 'type' && (
            <Step1ClaimType state={state} dispatch={dispatch} error={errorKey} />
          )}
          {state.step === 'reason' && (
            <Step2Reason state={state} dispatch={dispatch} error={errorKey} />
          )}
          {state.step === 'issuedetails' && (
            <Step2IssueDetails
              state={state}
              dispatch={dispatch}
              order={order}
              error={errorKey}
            />
          )}
          {state.step === 'compsubtype' && (
            <Step2Compensation state={state} dispatch={dispatch} error={errorKey} />
          )}
          {state.step === 'deviceprep' && (
            <Step3DevicePrep
              state={state}
              dispatch={dispatch}
              order={order}
              error={errorKey}
            />
          )}
          {state.step === 'packing' && (
            <Step4Packing state={state} dispatch={dispatch} error={errorKey} />
          )}
          {state.step === 'pickup' && (
            <Step4PickupDetails state={state} dispatch={dispatch} error={errorKey} />
          )}
          {state.step === 'refund' && (
            <Step5RefundMethod
              state={state}
              dispatch={dispatch}
              order={order}
              error={errorKey}
            />
          )}
          {state.step === 'review' && (
            <Step6Review
              state={state}
              dispatch={dispatch}
              order={order}
              submitAttempted={state.attempted}
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
            primaryDisabled={false}
            onPrimary={handlePrimary}
            secondaryLabel={null}
            onSecondary={null}
          />
        )}
      </div>

      <SwitchFlowSheet
        open={switchOpen}
        target={reasonTarget}
        order={order}
        onConfirm={() => {
          setSwitchOpen(false)
          routeFromReason()
        }}
        onClose={() => setSwitchOpen(false)}
      />
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
