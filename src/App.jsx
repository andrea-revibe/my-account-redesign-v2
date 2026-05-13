import { useMemo, useState } from 'react'
import Header from './components/Header'
import GreetRow from './components/GreetRow'
import OrderFilters from './components/OrderFilters'
import HeroCard from './components/HeroCard'
import OrderCard from './components/OrderCard'
import PastOrderCard from './components/PastOrderCard'
import ChatFab from './components/ChatFab'
import { ORDERS } from './data/orders'
import { pickActiveOrderId } from './lib/statuses'

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

function isOpen(order) {
  return (
    (order.state !== 'cancelled' && order.statusId !== 'delivered') ||
    isInFlightCancellation(order)
  )
}

function matchesStatus(order, status) {
  if (status === 'all') return true
  if (status === 'cancelled') return order.state === 'cancelled'
  if (status === 'delivered')
    return order.statusId === 'delivered' && order.state !== 'cancelled'
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

  // Counts are computed off the date-range-filtered set so the chip badges
  // stay accurate when the user widens / narrows the date window.
  const dateFiltered = useMemo(() => {
    const now = Date.now()
    return ORDERS.filter((o) => matchesRange(o, activeRange, now))
  }, [activeRange])

  const counts = useMemo(
    () => ({
      all: dateFiltered.length,
      in_progress: dateFiltered.filter(isOpen).length,
      delivered: dateFiltered.filter(
        (o) => o.statusId === 'delivered' && o.state !== 'cancelled',
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
  // definition in-flight.
  const showHero =
    activeOrder &&
    activeStatus !== 'cancelled' &&
    activeStatus !== 'delivered'

  const inFlight = filtered.filter(
    (o) => isOpen(o) && (!showHero || o.id !== activeId),
  )
  const past = filtered.filter((o) => !isOpen(o))

  return (
    <div className="min-h-full flex justify-center">
      <div className="w-full max-w-mobile bg-canvas shadow-sm relative pb-24">
        <Header />
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
                  {inFlight.map((o) =>
                    isInFlightCancellation(o) ? (
                      <PastOrderCard key={o.id} order={o} />
                    ) : (
                      <OrderCard
                        key={o.id}
                        order={o}
                        defaultExpanded={!showHero && o.id === activeId}
                      />
                    ),
                  )}
                </div>
              </>
            )}

            {past.length > 0 && (
              <>
                <SectionLabel title="Past orders" count={past.length} />
                <div className="px-4 flex flex-col gap-3">
                  {past.map((o) => (
                    <PastOrderCard key={o.id} order={o} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <ChatFab />
      </div>
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
