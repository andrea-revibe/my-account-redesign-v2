import { REVIBE_WALLET_ICON } from './WalletInfoTooltip'

export default function GreetRow({
  totalOrders,
  activeOrders,
  creditsAmount = 0,
  currency = 'AED',
  onOpenWallet,
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
      <button
        type="button"
        onClick={onOpenWallet}
        aria-label={`Open Revibe Wallet · ${currency} ${creditsAmount.toLocaleString()}`}
        className="inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full text-white text-[11.5px] font-semibold whitespace-nowrap shrink-0 shadow-sm2 bg-credits-pill hover:brightness-105 active:scale-[0.98] transition"
      >
        <img
          src={REVIBE_WALLET_ICON}
          alt=""
          aria-hidden
          className="w-3.5 h-3.5 object-contain"
          style={{ filter: 'brightness(0) invert(1)' }}
        />
        <span>Revibe Wallet</span>
        <span aria-hidden className="opacity-70">·</span>
        <span className="tabular-nums">{currency} {creditsAmount.toLocaleString()}</span>
      </button>
    </div>
  )
}
