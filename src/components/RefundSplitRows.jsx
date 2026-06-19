import { CreditCard } from 'lucide-react'
import { REVIBE_WALLET_ICON } from './WalletInfoTooltip'
import BnplDisclaimerTooltip, { isBnpl } from './BnplDisclaimerTooltip'
import { refundDestinations, formatMoney } from '../lib/returns'

// Card-portion label for a split refund. Mirrors the inline label logic the
// refund surfaces use for `order.paymentMethod` (BNPL → provider brand).
function cardLabelFor(order) {
  const pm = order?.paymentMethod
  if (pm?.type === 'bnpl') return pm.brand || 'Buy now, pay later'
  if (pm?.brand && pm?.last4) return `${pm.brand} •• ${pm.last4}`
  return pm?.brand || 'Card'
}

// The two refund-destination rows for a split-paid order (bank-card portion +
// gift-card / store-credit portion), keeping the original payment ratio. `net`
// is the post-fee refund total. Renders nothing when the order wasn't paid
// with a card+gift-card split, so callers can drop it in unconditionally on
// the original-payment path. The single source of truth for this display —
// reused by the cancel sheet, the returns flow (Steps 5/6/7), the refund/claim
// detail sheets, and the refund-hero cards. Don't re-roll the rows.
export default function RefundSplitRows({
  order,
  net,
  currency = order?.currency,
  caption,
  showTotal = false,
  totalLabel = 'Total',
  onDark = false,
  className = '',
}) {
  const split = refundDestinations(order, net)
  if (!split) return null

  const labelTone = onDark ? 'text-white/80' : 'text-ink-2'
  const valueTone = onDark ? 'text-white' : 'text-ink'

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {caption && (
        <div
          className={`text-[10.5px] font-bold uppercase tracking-[0.06em] ${
            onDark ? 'text-white/70' : 'text-muted'
          }`}
        >
          {caption}
        </div>
      )}
      <Row
        icon={
          <CreditCard
            size={13}
            strokeWidth={1.75}
            className={`shrink-0 ${onDark ? 'text-white/80' : 'text-ink-2'}`}
          />
        }
        label={cardLabelFor(order)}
        labelAfter={
          isBnpl(order) && (
            <BnplDisclaimerTooltip
              provider={order.paymentMethod.provider}
              align="left"
              iconClassName={
                onDark
                  ? 'text-white/85 hover:text-white'
                  : 'text-muted hover:text-ink'
              }
            />
          )
        }
        value={`${currency} ${formatMoney(split.card)}`}
        labelTone={labelTone}
        valueTone={valueTone}
      />
      <Row
        icon={
          <img
            src={REVIBE_WALLET_ICON}
            alt=""
            aria-hidden
            className="w-3.5 h-3.5 object-contain shrink-0"
          />
        }
        label="Gift card"
        value={`${currency} ${formatMoney(split.giftCard)}`}
        labelTone={labelTone}
        valueTone={valueTone}
      />
      {showTotal && (
        <div
          className={`mt-0.5 pt-2 border-t border-dashed flex items-center justify-between gap-3 ${
            onDark ? 'border-white/25' : 'border-line'
          }`}
        >
          <span className={`text-[12.5px] font-semibold ${valueTone}`}>
            {totalLabel}
          </span>
          <span className={`text-[13px] font-bold tabular-nums shrink-0 ${valueTone}`}>
            {currency} {formatMoney(split.card + split.giftCard)}
          </span>
        </div>
      )}
    </div>
  )
}

function Row({ icon, label, labelAfter, value, labelTone, valueTone }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={`inline-flex items-center gap-1.5 min-w-0 text-[12.5px] ${labelTone}`}>
        {icon}
        <span className="truncate">{label}</span>
        {labelAfter}
      </span>
      <span className={`text-[13px] font-semibold tabular-nums shrink-0 ${valueTone}`}>
        {value}
      </span>
    </div>
  )
}
