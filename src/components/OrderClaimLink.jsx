import { useState, useRef, useLayoutEffect } from 'react'
import { ChevronRight, AlertTriangle } from 'lucide-react'
import { claimToneFor, formatClaimRef } from '../lib/claims'
import { ProductSummary } from './ProductSummary'
import PastOrderCard from './PastOrderCard'

// ───────────────────────────────────────────────────────────────────────────
// Order ↔ Claim PAIRING wrapper  (spec: docs/handoff/order-claim-pairing/design.md)
//
// A LINKED PAIR of real cards in an accordion: the delivered order card (top)
// and the claim card (bottom), tied by the connector thread. Exactly one half
// is expanded; the other collapses to a compact `View ▸` header row. Tapping a
// compact row flips which half is open.
//
// Wrapper-level accordion: the claim-card family is UNTOUCHED — each card still
// renders `<OrderClaimLink order={order}>…</OrderClaimLink>` exactly as before
// and passes its <article> as children. This wrapper decides, per half, whether
// to render the real card (children for the claim; the real PastOrderCard
// delivered branch for the order) or a compact row. No card content changes.
// ───────────────────────────────────────────────────────────────────────────

const TONE = { warn: 'bg-warn', brand: 'bg-brand', success: 'bg-success' }

function shortDate(order) {
  return order.placedAtFull?.split(' · ')[0] || order.placedAt?.split(' ')[0] || ''
}

function isTakeoverClaim(claim) {
  return Boolean(
    claim?.docsRejection ||
      claim?.pickupFailure ||
      claim?.resetFailed ||
      claim?.invalidClaim,
  )
}

// Net-new (design.md §2). The whole row is one tap target → expand this card.
// The `View ▸` chip (not a bare chevron) reads "open the linked card", distinct
// from an expanded card's own collapse chevron.
function CompactRow({ stripClass, dotClass, eyebrow, line, lineClass, onOpen }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative overflow-hidden w-full flex items-center gap-3 rounded-[14px] border border-line bg-surface py-3 pl-[18px] pr-3.5 text-left hover:bg-line-2/40 transition-colors"
    >
      <span
        aria-hidden
        className={`absolute left-0 inset-y-0 w-[3px] rounded-l-[14px] ${stripClass}`}
      />
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-1.5">
          {dotClass && (
            <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${dotClass}`} />
          )}
          <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
            {eyebrow}
          </span>
        </span>
        <span className={`block text-[13px] font-semibold mt-[3px] ${lineClass || 'text-ink'}`}>
          {line}
        </span>
      </span>
      <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-brand shrink-0">
        View
        <ChevronRight size={13} strokeWidth={2.5} />
      </span>
    </button>
  )
}

function OrderCompactRow({ order, cancelled, onOpen }) {
  return (
    <CompactRow
      // §6: a never-delivered (pre-cancellation) order gets a calm neutral
      // strip, not the green delivered strip.
      stripClass={cancelled ? 'bg-[#b8bcc6]' : 'bg-success'}
      dotClass={null}
      eyebrow={`Order · #${order.id}`}
      line={`Placed ${shortDate(order)}`}
      onOpen={onOpen}
    />
  )
}

function ClaimCompactRow({ order, onOpen }) {
  const claim = order.claim
  const takeover = isTakeoverClaim(claim)
  const tone = claimToneFor(claim.claimStatusId)
  const stripClass = takeover ? 'bg-danger' : TONE[tone] || 'bg-line'
  const dotClass = takeover ? 'bg-danger' : TONE[tone] || 'bg-muted'
  return (
    <CompactRow
      stripClass={stripClass}
      dotClass={dotClass}
      eyebrow={formatClaimRef(claim)}
      line={
        takeover ? (
          <span className="inline-flex items-center gap-1.5 text-danger">
            <AlertTriangle size={13} strokeWidth={2} />
            Action needed
          </span>
        ) : (
          `Raised ${claim.submittedAt?.split(' · ')[0] || ''}`
        )
      }
      lineClass={takeover ? '' : 'text-ink'}
      onOpen={onOpen}
    />
  )
}

function CancellationCompactRow({ order, onOpen }) {
  const tone =
    order.cancellationStatusId === 'refunded'
      ? 'success'
      : order.cancellationStatusId === 'refund_pending'
      ? 'brand'
      : 'warn'
  const requested = order.cancellationTimeline?.requested?.split(' · ')[0] || ''
  return (
    <CompactRow
      stripClass={TONE[tone]}
      dotClass={TONE[tone]}
      eyebrow={order.cancellationRef ? `#${order.cancellationRef}` : 'Cancellation'}
      line={`Requested ${requested}`}
      onOpen={onOpen}
    />
  )
}

// §6: a cancelled order never arrived, so it has no delivered card. Its order
// half is a calm "Order placed" card — neutral, no green hero.
function PreCancellationOrderCard({ order }) {
  return (
    <article className="bg-surface rounded-card border border-line overflow-hidden relative">
      <span aria-hidden className="absolute left-0 top-0 bottom-0 w-1 bg-[#b8bcc6]" />
      <div className="pl-4 pr-3.5 pt-3 pb-3.5 flex flex-col gap-3">
        <div className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted tabular-nums">
          Order · #{order.id}
        </div>
        <span className="self-start inline-flex items-center gap-1.5 rounded-full font-bold uppercase tracking-[0.06em] h-6 px-2.5 text-[10.5px] bg-line-2 text-ink-2">
          <span className="w-1.5 h-1.5 rounded-full bg-muted" />
          Order placed
        </span>
        <ProductSummary order={order} />
      </div>
    </article>
  )
}

// The connector thread — a rail down the tight left gutter (pl-3, so cards stay
// near full width): a gradient spine running EXACTLY between two node centers,
// a hollow node on the order, a solid node on the claim / cancellation. The
// `hollow`/`solid` y-centers are measured from the live layout (see the wrapper)
// so the spine always terminates on the dots and the claim dot lands on the
// claim's status chip regardless of card heights / which half is open.
function Rail({ hollow, solid }) {
  const top = Math.min(hollow, solid)
  const height = Math.abs(solid - hollow)
  return (
    <>
      <span
        aria-hidden
        className="absolute left-[3px] w-0.5 rounded-full bg-gradient-to-b from-brand-2 to-brand-bg2"
        style={{ top, height }}
      />
      <span
        aria-hidden
        className="absolute left-0 w-2.5 h-2.5 rounded-full bg-surface border-[2.5px] border-brand-2"
        style={{ top: hollow - 5 }}
      />
      <span
        aria-hidden
        className="absolute left-0 w-2.5 h-2.5 rounded-full bg-brand"
        style={{ top: solid - 5 }}
      />
    </>
  )
}

export default function OrderClaimLink({ order, defaultOpen, children }) {
  const cancelled = !order.claim && order.state === 'cancelled'
  // Bottom half is the claim, or — for a cancelled order — the cancellation card.
  const bottomKey = cancelled ? 'cancellation' : 'claim'
  // One shared open-state. Default per family (design.md §3): the live half
  // (claim / cancellation) opens, the order collapses. Takeover families also
  // default to the claim open and are never auto-collapsed (state only changes
  // on an explicit row tap).
  const [openHalf, setOpenHalf] = useState(defaultOpen || bottomKey)
  const orderOpen = openHalf === 'order'

  // Measure each half so the rail's dots anchor precisely. The hollow (order)
  // dot sits at the order header when the order is open, else the compact row's
  // centre; the solid (claim) dot sits on the claim's status chip (~60px below
  // the claim card's top) when the claim is open, else the compact row's centre.
  const orderRef = useRef(null)
  const claimRef = useRef(null)
  const [nodes, setNodes] = useState({ hollow: 30, solid: 120 })
  useLayoutEffect(() => {
    const o = orderRef.current
    const c = claimRef.current
    if (!o || !c) return
    const hollow = orderOpen ? o.offsetTop + 30 : o.offsetTop + o.offsetHeight / 2
    const solid = orderOpen ? c.offsetTop + c.offsetHeight / 2 : c.offsetTop + 60
    setNodes({ hollow, solid })
  }, [openHalf, order])

  return (
    <div className="relative pl-3 flex flex-col gap-3">
      <Rail hollow={nodes.hollow} solid={nodes.solid} />

      {/* ORDER half — always on top */}
      <div ref={orderRef}>
      {orderOpen ? (
        cancelled ? (
          <PreCancellationOrderCard order={order} />
        ) : (
          // The real delivered card, verbatim (non-cancelled → delivered branch).
          <PastOrderCard order={order} />
        )
      ) : (
        <OrderCompactRow
          order={order}
          cancelled={cancelled}
          onOpen={() => setOpenHalf('order')}
        />
      )}
      </div>

      {/* CLAIM / CANCELLATION half — always below */}
      <div ref={claimRef}>
      {orderOpen ? (
        cancelled ? (
          <CancellationCompactRow order={order} onOpen={() => setOpenHalf(bottomKey)} />
        ) : (
          <ClaimCompactRow order={order} onOpen={() => setOpenHalf(bottomKey)} />
        )
      ) : (
        // The real card (passed as children). Its body opens with animate-slideDown
        // exactly as today — its content is untouched.
        children
      )}
      </div>
    </div>
  )
}
