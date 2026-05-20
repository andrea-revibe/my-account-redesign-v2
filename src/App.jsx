import { useMemo, useState } from 'react'
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
import InvalidClaimCard from './components/InvalidClaimCard'
import ChatFab from './components/ChatFab'
import ClaimFlow from './components/ClaimFlow/ClaimFlow'
import UndoSnackbar from './components/UndoSnackbar'
import JourneyDevPanel from './components/JourneyDevPanel'
import { ORDERS } from './data/orders'
import { pickActiveOrderId } from './lib/statuses'
import { hasActiveClaim, isClaimRefunded, isWarrantyDelivered } from './lib/claims'
import { useJourney } from './lib/journey'
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
  // Demo-only undo handle — the most recent seeded claim. Snackbar
  // surfaces after the returns flow closes; Undo removes the entry
  // from submittedClaims so the order reverts to its delivered card.
  const [recentSubmit, setRecentSubmit] = useState(null)
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
  // refund-branch suffix (wallet / card). Guarded by validNext so an
  // out-of-sequence submit silently no-ops instead of corrupting the path.
  const handleCancelOrder = ({ method }) => {
    if (!journeyMode) return
    const branch = method === 'store_credit' ? 'wallet' : 'card'
    const target = `cancellation_requested_${branch}`
    if (journey.validNext().some((n) => n.id === target)) {
      journey.advance(target)
    }
  }

  // Customer-triggered journey advance from the real ClaimFlow submit.
  // Mirrors handleCancelOrder: refund-method ids (wallet / original) map
  // to the journey's refund-branch suffix on refund flows; warranty
  // submits have no refund method and target a single submit node.
  // validNext gates an out-of-sequence submit (e.g. journey isn't on the
  // claim_change_of_mind branch). Non-journey mode keeps the existing
  // seed-claim + undo flow.
  const handleSubmitClaim = (orderId, claim) => {
    if (journeyMode) {
      const target =
        claim.type === 'warranty'
          ? 'claim_submitted_warranty'
          : `claim_submitted_${claim.refundMethod === 'wallet' ? 'wallet' : 'card'}`
      if (journey.validNext().some((n) => n.id === target)) {
        journey.advance(target)
      }
      return
    }
    setSubmittedClaims((prev) => ({ ...prev, [orderId]: claim }))
    setRecentSubmit({ orderId, claimType: claim.type })
  }

  // Step 7 "Track this return" — close the flow and signal the matched
  // ClaimCard to mount expanded. Bumping `n` forces the key change.
  const handleTrackClaim = (orderId) => {
    setClaimFlowOrderId(null)
    if (orderId == null) return
    setAutoOpenClaim((prev) => ({ orderId, n: prev.n + 1 }))
  }

  const projectedOrders = useMemo(
    () =>
      journeyMode
        ? [journey.order]
        : ORDERS.map((o) =>
            submittedClaims[o.id] ? { ...o, claim: submittedClaims[o.id] } : o,
          ),
    [journeyMode, journey.order, submittedClaims],
  )

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
                    if (hasActiveClaim(o) && o.claim?.docsRejection) {
                      return <DocsRejectedCard key={o.id} order={o} />
                    }
                    if (hasActiveClaim(o) && o.claim?.pickupFailure) {
                      return <PickupFailedCard key={o.id} order={o} />
                    }
                    if (hasActiveClaim(o) && o.claim?.invalidClaim) {
                      return <InvalidClaimCard key={o.id} order={o} />
                    }
                    if (hasActiveClaim(o) && o.claim?.type === 'warranty') {
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
                    if (hasActiveClaim(o)) {
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
                    if (isInFlightCancellation(o)) {
                      return <PastOrderCard key={o.id} order={o} />
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
            journeyMode && journey.order.id === claimFlowOrderId
              ? journey.order
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
      {claimFlowOrderId === null && recentSubmit && (
        <UndoSnackbar
          message={
            recentSubmit.claimType === 'warranty'
              ? 'Warranty claim submitted'
              : 'Return request submitted'
          }
          onUndo={() => {
            setSubmittedClaims((prev) => {
              const next = { ...prev }
              delete next[recentSubmit.orderId]
              return next
            })
            setRecentSubmit(null)
          }}
          onDismiss={() => setRecentSubmit(null)}
        />
      )}
      {journeyMode && (
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
