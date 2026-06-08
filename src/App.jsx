import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import GreetRow from './components/GreetRow'
import OrderFilters from './components/OrderFilters'
import HeroCard from './components/HeroCard'
import OrderCard from './components/OrderCard'
import InProgressCard from './components/InProgressCard'
import PastOrderCard from './components/PastOrderCard'
import ClaimCard from './components/ClaimCard'
import WarrantyClaimCard from './components/WarrantyClaimCard'
import DocsRejectedCard from './components/DocsRejectedCard'
import PickupFailedCard from './components/PickupFailedCard'
import ResetFailedCard from './components/ResetFailedCard'
import InvalidClaimCard from './components/InvalidClaimCard'
import ChatFab from './components/ChatFab'
import ClaimFlow from './components/ClaimFlow/ClaimFlow'
import CancelClaimSheet from './components/CancelClaimSheet'
import UndoSnackbar from './components/UndoSnackbar'
import JourneyDevPanel from './components/JourneyDevPanel'
import EddSandboxPanel from './components/EddSandboxPanel'
import { ORDERS } from './data/orders'
import { pickActiveOrderId } from './lib/statuses'
import {
  hasActiveClaim,
  isClaimRefunded,
  isWarrantyDelivered,
  cancelNeedsShipBack,
  cancelReturnGate,
} from './lib/claims'
import { useJourney } from './lib/journey'
import { useEddSandbox } from './lib/eddSandbox'
import { JOURNEYS } from './data/journey'

const RANGE_DAYS = { '30d': 30, '3m': 90, '1y': 365, all: Infinity }

// Parses 'DD/MM/YYYY HH:MM AM/PM' → epoch ms.
function parsePlacedAt(s) {
  const [datePart, timePart, ampm] = s.split(' ')
  const [d, m, y] = datePart.split('/').map(Number)
  let [hh, mm] = timePart.split(':').map(Number)
  if (ampm === 'PM' && hh !== 12) hh += 12
  if (ampm === 'AM' && hh === 12) hh = 0
  return new Date(y, m - 1, d, hh, mm).getTime()
}

// A cancelled order is still "in flight" until the refund actually lands.
// Requested / refund_pending sit in the open section; refunded drops to past.
function isInFlightCancellation(order) {
  return (
    order.state === 'cancelled' &&
    order.cancellationStatusId !== 'refunded'
  )
}

// A delivered order with an active claim is "open" again — the customer is
// tracking a return-in-progress. Refunded claims drop back to past.
function isOpen(order) {
  if (hasActiveClaim(order)) return true
  return (
    (order.state !== 'cancelled' && order.statusId !== 'delivered') ||
    isInFlightCancellation(order)
  )
}

function matchesStatus(order, status) {
  if (status === 'all') return true
  if (status === 'cancelled') return order.state === 'cancelled'
  if (status === 'delivered')
    return (
      order.statusId === 'delivered' &&
      order.state !== 'cancelled' &&
      !hasActiveClaim(order)
    )
  if (status === 'in_progress') return isOpen(order)
  return true
}

function matchesRange(order, rangeId, now) {
  const days = RANGE_DAYS[rangeId] ?? Infinity
  if (days === Infinity) return true
  const cutoff = now - days * 24 * 60 * 60 * 1000
  return parsePlacedAt(order.placedAt) >= cutoff
}

export default function App() {
  const [activeStatus, setActiveStatus] = useState('all')
  const [activeRange, setActiveRange] = useState('3m')
  const [claimFlowOrderId, setClaimFlowOrderId] = useState(null)
  // In-session map of orderId → claim seeded by the returns flow on
  // submit. Cleared on refresh — there's no backend. Listed orders are
  // projected through this map before filtering so a freshly-submitted
  // warranty (or refund) claim flips the order to the right card type
  // immediately and moves between the "In progress" / "Past" sections.
  const [submittedClaims, setSubmittedClaims] = useState({})
  // In-session set of orderIds whose claim the customer cancelled. The
  // projection strips the claim for these (winning over submittedClaims and
  // any hand-seeded claim), so the order reverts to its delivered card.
  // Cleared on refresh; undoable via the snackbar.
  const [cancelledClaims, setCancelledClaims] = useState({})
  // Order whose claim-cancel confirmation sheet is open (null = closed).
  const [cancelClaimOrderId, setCancelClaimOrderId] = useState(null)
  // In-session set of orderIds cancelled *after* the device was collected.
  // The projection overlays the `invalidClaim` ship-back gate (reason
  // 'cancelled') on these — clearing any takeover flag so the order routes
  // to InvalidClaimCard's pay-return-shipping surface. Cleared on refresh;
  // backed out via the card's "Keep claim".
  const [shipBackCancels, setShipBackCancels] = useState({})
  // Demo-only undo handle for the most recent claim mutation. Snackbar
  // surfaces after a submit or a cancel; Undo reverses that one action.
  // `kind` is 'submit' (drop from submittedClaims) or 'cancel' (drop from
  // cancelledClaims).
  const [pendingUndo, setPendingUndo] = useState(null)
  // Auto-expand target driven by Step 7's "Track this return" button.
  // `n` is bumped on each Track click so the matched ClaimCard's key
  // changes → it remounts with defaultExpanded={true} even if the same
  // orderId was tracked previously (e.g. journey replay).
  const [autoOpenClaim, setAutoOpenClaim] = useState({ orderId: null, n: 0 })

  // Journey mode — sourced from ?journey=<id> URL param. Replaces ORDERS
  // with a single replayed order driven by the JourneyDevPanel. Mutually
  // exclusive with the normal multi-order demo. Backward compat:
  // `?journey=1` maps to the first journey (happy path).
  const initialJourneyParam =
    typeof window === 'undefined'
      ? null
      : new URLSearchParams(window.location.search).get('journey')
  const resolveJourneyId = (raw) => {
    if (raw == null || raw === '1') return JOURNEYS[0].id
    return JOURNEYS.some((j) => j.id === raw) ? raw : JOURNEYS[0].id
  }
  const [journeyMode, setJourneyMode] = useState(initialJourneyParam != null)
  const [journeyId, setJourneyId] = useState(() =>
    resolveJourneyId(initialJourneyParam),
  )
  const journey = useJourney(journeyId)
  // Sandbox state lives outside the replay hook — both hooks are called
  // unconditionally (hook rules), then `active` is the one we actually use.
  const sandbox = useEddSandbox(journey.journey)
  const isSandbox = journey.kind === 'sandbox'
  const activeOrderFromJourney = isSandbox ? sandbox.order : journey.order
  const toggleJourneyMode = () => {
    setJourneyMode((prev) => {
      const next = !prev
      const url = new URL(window.location.href)
      if (next) url.searchParams.set('journey', journeyId)
      else url.searchParams.delete('journey')
      window.history.replaceState({}, '', url)
      return next
    })
  }
  const selectJourney = (id) => {
    setJourneyId(id)
    const url = new URL(window.location.href)
    url.searchParams.set('journey', id)
    window.history.replaceState({}, '', url)
  }

  // Customer-triggered journey advance from the real cancel sheet.
  // Sheet's `method` ids (store_credit / original) map to the journey's
  // refund-branch suffix (wallet / card). The request node differs by stage:
  // `cancel_before_qc_*` before QC (straight to refund pending), or
  // `cancellation_requested_*` at QC (awaits supplier review). We advance
  // whichever is in validNext, so an out-of-sequence submit no-ops instead
  // of corrupting the path.
  const handleCancelOrder = ({ method }) => {
    if (!journeyMode || isSandbox) return
    const branch = method === 'store_credit' ? 'wallet' : 'card'
    // Late + past-promise variants take precedence: they're only ever in
    // validNext from the `order_late` / `qc_late` nodes, so listing them
    // first is harmless on the normal path (only one is ever reachable).
    const candidates = [
      `cancel_late_before_qc_${branch}`,
      `cancellation_late_requested_${branch}`,
      `cancel_before_qc_${branch}`,
      `cancellation_requested_${branch}`,
    ]
    const target = journey.validNext().find((n) => candidates.includes(n.id))
    if (target) journey.advance(target.id)
  }

  // Customer-triggered journey advance from the `keep my order` undo. Reverts
  // an in-flight cancellation back to its open state; guarded by validNext so
  // it only fires while `cancellation_kept` is reachable (the `requested`
  // stage). No-op outside journey mode.
  const handleKeepOrder = () => {
    if (!journeyMode || isSandbox) return
    if (journey.validNext().some((n) => n.id === 'cancellation_kept')) {
      journey.advance('cancellation_kept')
    }
  }

  // Customer-triggered journey advance from the real ClaimFlow submit.
  // Mirrors handleCancelOrder: refund-method ids (wallet / original) map
  // to the journey's refund-branch suffix on refund flows; warranty
  // submits have no refund method and target a single submit node;
  // compensation submits fork on sub-type (shipping_refund / charger).
  // validNext gates an out-of-sequence submit (e.g. journey isn't on the
  // claim_change_of_mind branch). Non-journey mode keeps the existing
  // seed-claim + undo flow.
  const handleSubmitClaim = (orderId, claim) => {
    if (journeyMode) {
      // Sandbox journeys have no node graph to advance and no Past-order
      // surfaces — claim submit is a no-op there.
      if (isSandbox) return
      const target =
        claim.type === 'warranty'
          ? 'claim_submitted_warranty'
          : claim.type === 'compensation'
            ? `claim_submitted_${claim.compensationSubtype}`
            : `claim_submitted_${claim.refundMethod === 'wallet' ? 'wallet' : 'card'}`
      if (journey.validNext().some((n) => n.id === target)) {
        journey.advance(target)
      }
      return
    }
    setSubmittedClaims((prev) => ({ ...prev, [orderId]: claim }))
    setPendingUndo({
      kind: 'submit',
      orderId,
      message:
        claim.type === 'warranty'
          ? 'Warranty claim submitted'
          : 'Return request submitted',
    })
  }

  // Customer taps "Cancel claim" on a claim card (baseline or takeover).
  // Opens the confirmation sheet. Works in both the multi-order demo and
  // journey mode; in journey mode the cancel reverts the replayed order to
  // delivered until the next node advance/reset replays the claim (see the
  // effect that clears the journey cancel on node change).
  const handleRequestCancelClaim = (orderId) => {
    setCancelClaimOrderId(orderId)
  }

  // Confirmed from the sheet. Two paths, decided by `cancelNeedsShipBack`:
  //
  //  • Clean revert (pre-collection device claims + compensation): the order
  //    drops the claim and falls back to its delivered PastOrderCard. Journey
  //    mode advances the `claim_cancelled` terminal node (strips the claim via
  //    apply()); otherwise the in-session `cancelledClaims` flag does it, with
  //    an undo snackbar (submittedClaims left intact so Undo restores it).
  //
  //  • Ship-back (device already with Revibe): hands off to the pay-return-
  //    shipping surface (InvalidClaimCard, reason 'cancelled'). Journey mode
  //    advances `claim_cancelled_shipback` (sets the gate, then reuses the
  //    invalid return chain); otherwise the `shipBackCancels` flag overlays
  //    the gate. No undo snackbar here — the card's "Keep claim" is the
  //    back-out.
  //
  // On journey takeover surfaces that don't wire the matching node, both
  // paths fall through to the in-session flag (cleared on the next node
  // change by the effect below).
  const handleConfirmCancelClaim = (orderId) => {
    setCancelClaimOrderId(null)
    const claim = projectedOrders.find((o) => o.id === orderId)?.claim
    const needsShipBack = cancelNeedsShipBack(claim)
    const nodeId = needsShipBack ? 'claim_cancelled_shipback' : 'claim_cancelled'
    if (
      journeyMode &&
      !isSandbox &&
      journey.validNext().some((n) => n.id === nodeId)
    ) {
      journey.advance(nodeId)
      return
    }
    if (needsShipBack) {
      setShipBackCancels((prev) => ({ ...prev, [orderId]: true }))
      return
    }
    setCancelledClaims((prev) => ({ ...prev, [orderId]: true }))
    setPendingUndo({ kind: 'cancel', orderId, message: 'Claim cancelled' })
  }

  // "Keep claim" on the cancel ship-back surface (InvalidClaimCard, reason
  // 'cancelled') — backs out so the original claim resumes. Journey mode at
  // the cancel node steps back; otherwise clears the in-session gate.
  const handleKeepClaim = (orderId) => {
    if (
      journeyMode &&
      !isSandbox &&
      journey.currentNodeId === 'claim_cancelled_shipback'
    ) {
      journey.back()
      return
    }
    setShipBackCancels((prev) => {
      const next = { ...prev }
      delete next[orderId]
      return next
    })
  }

  // Step 7 "Track this return" — close the flow and signal the matched
  // ClaimCard to mount expanded. Bumping `n` forces the key change.
  const handleTrackClaim = (orderId) => {
    setClaimFlowOrderId(null)
    if (orderId == null) return
    setAutoOpenClaim((prev) => ({ orderId, n: prev.n + 1 }))
  }

  const projectedOrders = useMemo(() => {
    // Overlay the in-session cancel state on a (possibly submitted-claim)
    // order: a clean cancel strips the claim; a post-collection cancel swaps
    // in the `invalidClaim` ship-back gate and clears any takeover flag so
    // routing lands on InvalidClaimCard rather than the original takeover.
    const applyCancel = (o) => {
      if (!o.claim) return o
      if (cancelledClaims[o.id]) return { ...o, claim: undefined }
      if (shipBackCancels[o.id]) {
        return {
          ...o,
          claim: {
            ...o.claim,
            docsRejection: undefined,
            pickupFailure: undefined,
            resetFailed: undefined,
            actionRequired: undefined,
            invalidClaim: cancelReturnGate(o),
          },
        }
      }
      return o
    }
    if (journeyMode) return [applyCancel(activeOrderFromJourney)]
    return ORDERS.map((o) =>
      applyCancel(
        submittedClaims[o.id] ? { ...o, claim: submittedClaims[o.id] } : o,
      ),
    )
  }, [
    journeyMode,
    activeOrderFromJourney,
    submittedClaims,
    cancelledClaims,
    shipBackCancels,
  ])

  // In journey mode the in-session cancel flags (clean revert + ship-back
  // fallback) are demo-only overlays used when the current node has no
  // matching cancel node wired. Advancing/resetting to a different node
  // replays the claim, so we clear both flags for the journey order whenever
  // the current node changes — keeps the cancel flow replayable without
  // leaking across nodes or journeys. (Node-driven cancels don't touch these
  // flags, so this is a no-op for them.)
  useEffect(() => {
    if (!journeyMode) return
    const id = activeOrderFromJourney?.id
    if (id == null) return
    const drop = (prev) => {
      if (!prev[id]) return prev
      const next = { ...prev }
      delete next[id]
      return next
    }
    setCancelledClaims(drop)
    setShipBackCancels(drop)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journey.currentNodeId, journeyId, journeyMode])

  // Counts are computed off the date-range-filtered set so the chip badges
  // stay accurate when the user widens / narrows the date window. Journey
  // mode bypasses the date filter — its single order's placedAt is always
  // "today" and the demo shouldn't disappear if the system clock drifts.
  const dateFiltered = useMemo(() => {
    if (journeyMode) return projectedOrders
    const now = Date.now()
    return projectedOrders.filter((o) => matchesRange(o, activeRange, now))
  }, [journeyMode, projectedOrders, activeRange])

  const counts = useMemo(
    () => ({
      all: dateFiltered.length,
      in_progress: dateFiltered.filter(isOpen).length,
      delivered: dateFiltered.filter(
        (o) =>
          o.statusId === 'delivered' &&
          o.state !== 'cancelled' &&
          !hasActiveClaim(o),
      ).length,
      cancelled: dateFiltered.filter((o) => o.state === 'cancelled').length,
    }),
    [dateFiltered],
  )

  const filtered = useMemo(
    () => dateFiltered.filter((o) => matchesStatus(o, activeStatus)),
    [dateFiltered, activeStatus],
  )

  const activeId = useMemo(() => pickActiveOrderId(filtered), [filtered])
  const activeOrder = filtered.find((o) => o.id === activeId)

  // Hero hides on cancelled/delivered tabs since the active order is by
  // definition in-flight. Also hidden for created / quality_check — those
  // states have no courier or ETA yet, and InProgressCard is the canonical
  // surface for them (kept collapsed; the user expands manually).
  const showHero =
    activeOrder &&
    activeStatus !== 'cancelled' &&
    activeStatus !== 'delivered' &&
    activeOrder.statusId !== 'created' &&
    activeOrder.statusId !== 'quality_check'

  const inFlight = filtered.filter(
    (o) => isOpen(o) && (!showHero || o.id !== activeId),
  )
  const past = filtered.filter((o) => !isOpen(o))

  return (
    <div className="min-h-full flex justify-center">
      <div className="w-full max-w-mobile bg-canvas shadow-sm relative pb-24">
        <Header journeyMode={journeyMode} onToggleJourney={toggleJourneyMode} />
        <GreetRow
          totalOrders={counts.all}
          activeOrders={counts.in_progress}
        />
        <OrderFilters
          activeStatus={activeStatus}
          onStatusChange={setActiveStatus}
          activeRange={activeRange}
          onRangeChange={setActiveRange}
          counts={counts}
        />

        {showHero && <HeroCard order={activeOrder} />}

        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-small text-muted text-center">
            No orders match the selected filters.
          </p>
        ) : (
          <>
            {inFlight.length > 0 && (
              <>
                <SectionLabel
                  title={showHero ? 'Other open orders' : 'In progress'}
                  count={inFlight.length}
                />
                <div className="px-4 flex flex-col gap-3">
                  {inFlight.map((o) => {
                    const onRequestCancelClaim = handleRequestCancelClaim
                    if (hasActiveClaim(o) && o.claim?.docsRejection) {
                      return (
                        <DocsRejectedCard
                          key={o.id}
                          order={o}
                          onRequestCancelClaim={onRequestCancelClaim}
                        />
                      )
                    }
                    if (hasActiveClaim(o) && o.claim?.pickupFailure) {
                      return (
                        <PickupFailedCard
                          key={o.id}
                          order={o}
                          onRequestCancelClaim={onRequestCancelClaim}
                        />
                      )
                    }
                    if (hasActiveClaim(o) && o.claim?.resetFailed) {
                      return (
                        <ResetFailedCard
                          key={o.id}
                          order={o}
                          onRequestCancelClaim={onRequestCancelClaim}
                        />
                      )
                    }
                    if (hasActiveClaim(o) && o.claim?.invalidClaim) {
                      return (
                        <InvalidClaimCard
                          key={o.id}
                          order={o}
                          onKeepClaim={handleKeepClaim}
                        />
                      )
                    }
                    if (hasActiveClaim(o) && o.claim?.type === 'warranty') {
                      return (
                        <WarrantyClaimCard
                          key={o.id}
                          order={o}
                          openSignal={
                            autoOpenClaim.orderId === o.id ? autoOpenClaim.n : 0
                          }
                          onRequestCancelClaim={onRequestCancelClaim}
                        />
                      )
                    }
                    if (hasActiveClaim(o)) {
                      return (
                        <ClaimCard
                          key={o.id}
                          order={o}
                          openSignal={
                            autoOpenClaim.orderId === o.id ? autoOpenClaim.n : 0
                          }
                          onRequestCancelClaim={onRequestCancelClaim}
                        />
                      )
                    }
                    if (isInFlightCancellation(o)) {
                      return (
                        <PastOrderCard
                          key={o.id}
                          order={o}
                          onKeep={handleKeepOrder}
                        />
                      )
                    }
                    if (o.statusId === 'created' || o.statusId === 'quality_check') {
                      return (
                        <InProgressCard
                          key={o.id}
                          order={o}
                          onCancelOrder={handleCancelOrder}
                        />
                      )
                    }
                    return (
                      <OrderCard
                        key={o.id}
                        order={o}
                        defaultExpanded={!showHero && o.id === activeId}
                        onCancelOrder={handleCancelOrder}
                      />
                    )
                  })}
                </div>
              </>
            )}

            {past.length > 0 && (
              <>
                <SectionLabel title="Past orders" count={past.length} />
                <div className="px-4 flex flex-col gap-3">
                  {past.map((o) => {
                    if (isWarrantyDelivered(o)) {
                      return (
                        <WarrantyClaimCard
                          key={o.id}
                          order={o}
                          openSignal={
                            autoOpenClaim.orderId === o.id ? autoOpenClaim.n : 0
                          }
                        />
                      )
                    }
                    if (isClaimRefunded(o)) {
                      return (
                        <ClaimCard
                          key={o.id}
                          order={o}
                          openSignal={
                            autoOpenClaim.orderId === o.id ? autoOpenClaim.n : 0
                          }
                        />
                      )
                    }
                    return (
                      <PastOrderCard
                        key={o.id}
                        order={o}
                        onRaiseClaim={setClaimFlowOrderId}
                      />
                    )
                  })}
                </div>
              </>
            )}
          </>
        )}

        <ChatFab />
      </div>
      {claimFlowOrderId !== null && (
        <ClaimFlow
          initialOrderId={claimFlowOrderId}
          initialOrder={
            journeyMode && activeOrderFromJourney.id === claimFlowOrderId
              ? activeOrderFromJourney
              : undefined
          }
          onClose={() => {
            setClaimFlowOrderId(null)
            // Only Track-this-claim should auto-expand the card; if the
            // user lands here via "Back to my account" / X / Escape, drop
            // any prior expand signal so the card returns to collapsed.
            setAutoOpenClaim({ orderId: null, n: 0 })
          }}
          onSubmitClaim={handleSubmitClaim}
          onTrackClaim={handleTrackClaim}
        />
      )}
      {cancelClaimOrderId !== null && (
        <CancelClaimSheet
          order={projectedOrders.find((o) => o.id === cancelClaimOrderId)}
          open
          onConfirm={() => handleConfirmCancelClaim(cancelClaimOrderId)}
          onClose={() => setCancelClaimOrderId(null)}
        />
      )}
      {claimFlowOrderId === null && cancelClaimOrderId === null && pendingUndo && (
        <UndoSnackbar
          message={pendingUndo.message}
          onUndo={() => {
            if (pendingUndo.kind === 'cancel') {
              setCancelledClaims((prev) => {
                const next = { ...prev }
                delete next[pendingUndo.orderId]
                return next
              })
            } else {
              setSubmittedClaims((prev) => {
                const next = { ...prev }
                delete next[pendingUndo.orderId]
                return next
              })
            }
            setPendingUndo(null)
          }}
          onDismiss={() => setPendingUndo(null)}
        />
      )}
      {journeyMode && !isSandbox && (
        <JourneyDevPanel
          nodes={journey.nodes}
          currentNodeId={journey.currentNodeId}
          currentIndex={journey.currentIndex}
          validNext={journey.validNext}
          advance={journey.advance}
          back={journey.back}
          reset={journey.reset}
          journeys={journey.journeys}
          activeJourneyId={journey.journey.id}
          onSelectJourney={selectJourney}
        />
      )}
      {journeyMode && isSandbox && (
        <EddSandboxPanel
          inputs={sandbox.inputs}
          setInput={sandbox.setInput}
          status={sandbox.status}
          markets={sandbox.markets}
          reset={sandbox.reset}
          journeys={sandbox.journeys}
          activeJourneyId={journey.journey.id}
          onSelectJourney={selectJourney}
        />
      )}
    </div>
  )
}

function SectionLabel({ title, count }) {
  return (
    <div className="flex items-baseline justify-between px-4 pt-3 pb-2">
      <h3 className="m-0 text-[12px] font-bold uppercase tracking-[0.08em] text-muted">
        {title}
      </h3>
      <span className="text-[12px] font-medium text-muted">{count}</span>
    </div>
  )
}
