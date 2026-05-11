import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Search, Check } from 'lucide-react'

export const STATUS_CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'in_progress', label: 'Open' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
]

export const DATE_RANGES = [
  { id: '30d', label: 'Last 30 days' },
  { id: '3m', label: 'Last 3 months' },
  { id: '1y', label: 'Last year' },
  { id: 'all', label: 'All time' },
]

// Search input + date-range preset side by side, with a status chip row
// underneath. Each chip carries a small count badge so customers can see
// how many orders fall into each bucket without filtering.
export default function OrderFilters({
  activeStatus,
  onStatusChange,
  activeRange,
  onRangeChange,
  counts,
}) {
  const [rangeOpen, setRangeOpen] = useState(false)
  const rangeRef = useRef(null)

  useEffect(() => {
    if (!rangeOpen) return
    function handle(e) {
      if (rangeRef.current && !rangeRef.current.contains(e.target)) {
        setRangeOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [rangeOpen])

  const activeRangeLabel =
    DATE_RANGES.find((r) => r.id === activeRange)?.label ?? DATE_RANGES[1].label

  return (
    <section className="px-4 pt-1.5 pb-3 flex flex-col gap-2.5 bg-canvas">
      <div className="flex items-center gap-2">
        <label className="flex-1 flex items-center gap-2 h-10 px-3 rounded-btn border border-line bg-surface min-w-0">
          <Search size={16} className="text-muted" strokeWidth={1.75} />
          <input
            type="search"
            placeholder="Find an order or item"
            className="flex-1 min-w-0 bg-transparent outline-none text-body text-ink placeholder:text-muted"
          />
        </label>

        <div ref={rangeRef} className="relative">
          <button
            type="button"
            onClick={() => setRangeOpen((v) => !v)}
            aria-haspopup="listbox"
            aria-expanded={rangeOpen}
            className="flex items-center gap-1.5 h-10 px-3 rounded-btn border border-line bg-surface text-[13px] font-medium text-ink whitespace-nowrap"
          >
            <span>{activeRangeLabel}</span>
            <ChevronDown
              size={14}
              strokeWidth={1.75}
              className={`text-muted transition-transform ${rangeOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {rangeOpen && (
            <ul
              role="listbox"
              className="absolute right-0 top-11 z-10 w-44 bg-surface border border-line rounded-btn shadow-md2 py-1"
            >
              {DATE_RANGES.map((r) => {
                const active = r.id === activeRange
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={active}
                      onClick={() => {
                        onRangeChange?.(r.id)
                        setRangeOpen(false)
                      }}
                      className={
                        'w-full flex items-center justify-between px-3 h-9 text-body text-left hover:bg-line-2 ' +
                        (active ? 'text-brand font-bold' : 'text-ink')
                      }
                    >
                      <span>{r.label}</span>
                      {active && <Check size={14} className="text-brand" />}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

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
