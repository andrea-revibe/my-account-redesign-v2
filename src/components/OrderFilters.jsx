import { Search } from 'lucide-react'

export const STATUS_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'in_progress', label: 'Open' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
]

// Full-width search input with a status chip row underneath. Each chip
// carries a small count badge so customers can see how many orders fall
// into each bucket without filtering.
export default function OrderFilters({
  activeStatus,
  onStatusChange,
  counts,
}) {
  return (
    <section className="px-4 pt-1.5 pb-3 flex flex-col gap-2.5 bg-canvas">
      <label className="flex items-center gap-2 h-10 px-3 rounded-btn border border-line bg-surface min-w-0">
        <Search size={16} className="text-muted" strokeWidth={1.75} />
        <input
          type="search"
          placeholder="Find an order or item"
          className="flex-1 min-w-0 bg-transparent outline-none text-body text-ink placeholder:text-muted"
        />
      </label>

      <div
        className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 pb-1 scrollbar-none"
        style={{
          scrollbarWidth: 'none',
          WebkitMaskImage:
            'linear-gradient(90deg, #000 0, #000 calc(100% - 24px), transparent 100%)',
          maskImage:
            'linear-gradient(90deg, #000 0, #000 calc(100% - 24px), transparent 100%)',
        }}
      >
        {STATUS_CHIPS.map((chip) => {
          const active = chip.id === activeStatus
          const count = counts?.[chip.id]
          return (
            <button
              key={chip.id}
              type="button"
              aria-pressed={active}
              onClick={() => onStatusChange?.(chip.id)}
              className={
                'shrink-0 h-[30px] px-2.5 inline-flex items-center gap-1.5 rounded-full border text-[12px] font-semibold transition-colors ' +
                (active
                  ? 'bg-ink text-white border-ink'
                  : 'bg-surface text-ink border-line')
              }
            >
              <span>{chip.label}</span>
              {typeof count === 'number' && (
                <span
                  className={
                    'inline-grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full text-[10.5px] font-bold ' +
                    (active
                      ? 'bg-white/20 text-white'
                      : 'bg-line-2 text-muted')
                  }
                >
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
