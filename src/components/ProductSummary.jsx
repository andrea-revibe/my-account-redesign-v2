export const REVIBE_CARE_ICON =
  'https://cdn.shopify.com/s/files/1/0695/1737/7855/files/Revibe_logo_RE_CARE_Color_copy.png?v=1719938652'

const CARE_GLOW =
  'radial-gradient(circle at 105% 0%, rgba(217,26,122,.45), transparent 55%), radial-gradient(circle at 0% 130%, rgba(122,61,211,.5), transparent 50%)'

// Canonical product line-item shared across every order/claim card. One
// adaptable treatment with two contexts (light card / dark hero), driven by
// `tone`. Owns thumbnail, name, variant, the Revibe Care callout, and the
// price breakdown — but no chevron / expand state (the card owns the tap
// target). Design: docs/handoff/product-summary/design.md (Direction C).
export function ProductSummary({ order, tone = 'light', className = '' }) {
  const hero = tone === 'hero'
  const hasWarranty = order.warranty != null
  const fmt = (n) => `${order.currency} ${n.toLocaleString()}`

  return (
    <div className={className}>
      <div className="flex items-center gap-3.5">
        <div
          className={`w-[72px] h-[72px] rounded-[14px] grid place-items-center p-1.5 shrink-0 ${
            hero ? 'bg-white/[.96]' : 'bg-surface border border-line'
          }`}
        >
          <img
            src={order.product.image}
            alt={order.product.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div
            className={`text-[16px] font-bold leading-[1.2] tracking-[-0.01em] truncate ${
              hero ? 'text-white' : 'text-ink'
            }`}
          >
            {order.product.name}
          </div>
          <div
            className={`text-[12.5px] mt-1 truncate ${
              hero ? 'text-white/75' : 'text-muted'
            }`}
          >
            {order.product.variant}
          </div>
        </div>

        <div className="text-right shrink-0">
          <div
            className={`text-[9.5px] font-bold tracking-[0.08em] uppercase ${
              hero ? 'text-white/[.65]' : 'text-muted'
            }`}
          >
            {hasWarranty ? 'Device' : 'Total'}
          </div>
          <div
            className={`mt-1 tabular-nums whitespace-nowrap ${
              hasWarranty
                ? 'text-[14.5px] font-semibold'
                : 'text-[18px] font-extrabold'
            } ${hero ? 'text-white' : 'text-ink'}`}
          >
            {fmt(hasWarranty ? order.subtotal ?? order.total : order.total)}
          </div>
        </div>
      </div>

      {hasWarranty && (
        <>
          <div
            className={`relative overflow-hidden flex items-center gap-3 mt-3.5 rounded-[14px] px-3.5 py-3 ${
              hero
                ? 'bg-white/[.12]'
                : 'bg-hero-gradient shadow-[0_10px_22px_-10px_rgba(80,25,160,.55)]'
            }`}
          >
            {!hero && (
              <div
                aria-hidden
                className="absolute inset-0 pointer-events-none"
                style={{ background: CARE_GLOW }}
              />
            )}
            <div
              aria-hidden
              className={`absolute inset-0 rounded-[14px] pointer-events-none border ${
                hero ? 'border-white/[.22]' : 'border-white/[.16]'
              }`}
            />
            <div className="relative w-[38px] h-[38px] rounded-[10px] bg-white grid place-items-center shrink-0 shadow-[0_2px_6px_rgba(20,12,40,.18)]">
              <img
                src={REVIBE_CARE_ICON}
                alt=""
                className="w-6 h-6 object-contain"
              />
            </div>
            <div className="relative flex-1 min-w-0">
              <div className="text-[13.5px] font-bold text-white leading-[1.2]">
                Revibe Care
              </div>
              <div className="text-[11px] text-white/[.78] mt-0.5 truncate">
                2-year extended warranty · added
              </div>
            </div>
            <div className="relative text-[14.5px] font-extrabold text-white shrink-0 whitespace-nowrap tabular-nums">
              +{fmt(order.warranty)}
            </div>
          </div>

          <div
            className={`flex items-center justify-between mt-3.5 pt-[13px] border-t ${
              hero ? 'border-white/20' : 'border-line'
            }`}
          >
            <div
              className={`text-[13.5px] font-bold ${
                hero ? 'text-white' : 'text-ink'
              }`}
            >
              Total paid
            </div>
            <div
              className={`text-[19px] font-extrabold whitespace-nowrap tabular-nums tracking-[-0.01em] ${
                hero ? 'text-white' : 'text-ink'
              }`}
            >
              {fmt(order.total)}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
