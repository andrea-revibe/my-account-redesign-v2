// "My orders" + count + a tight gradient credits pill. Replaces the older
// full-width StoreCreditsCard so the page can lead with content instead of
// chrome.
export default function GreetRow({
  totalOrders,
  activeOrders,
  creditsAmount = 384,
  currency = 'AED',
}) {
  return (
    <div className="px-4 pt-4 pb-2 flex items-end justify-between gap-2 flex-wrap">
      <div>
        <div className="text-[22px] font-bold text-ink leading-[1.15] tracking-[-0.02em]">
          My orders
        </div>
        <div className="mt-0.5 text-[13px] text-muted">
          {totalOrders} order{totalOrders === 1 ? '' : 's'}
          {typeof activeOrders === 'number' && ` · ${activeOrders} active`}
        </div>
      </div>
      <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-white text-[11.5px] font-semibold whitespace-nowrap shrink-0 shadow-sm2 bg-credits-pill">
        <span className="w-1.5 h-1.5 rounded-full bg-white" />
        {currency} {creditsAmount}
      </button>
    </div>
  )
}
