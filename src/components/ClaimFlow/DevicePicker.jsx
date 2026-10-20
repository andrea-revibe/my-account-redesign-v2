import { DEVICE_OPTIONS } from '../../lib/devices'

// "Which tablet is it?" — shown when the order's product category spans more
// than one reset guide (lib/devices.js PRODUCT_CATEGORIES). The product title
// only pre-selects an answer (`guess`); the customer has the final say.
export default function DevicePicker({ category, value, guess, onChange, error = false }) {
  return (
    <div>
      <div className="mb-1.5 px-0.5 text-[12.5px] font-semibold text-ink">{category.question}</div>
      <div className="flex flex-col gap-2">
        {category.options.map((id) => {
          const o = DEVICE_OPTIONS[id]
          const active = value === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`rounded-[12px] border-[1.5px] px-3 py-2.5 text-left transition-colors ${
                active
                  ? 'border-brand bg-brand-bg/50'
                  : error
                    ? 'border-danger/60 bg-surface'
                    : 'border-line bg-surface hover:border-brand/40'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className={`w-[15px] h-[15px] rounded-full border-2 grid place-items-center shrink-0 ${
                    active ? 'border-brand' : 'border-line'
                  }`}
                >
                  {active && <span className="w-[7px] h-[7px] rounded-full bg-brand" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-ink">{o.label}</span>
                  {o.sub && <span className="block text-[11.5px] text-muted leading-snug">{o.sub}</span>}
                </span>
                {guess === id && (
                  <span className="ml-auto shrink-0 rounded-full bg-line-2/70 px-2 py-[2px] text-[10.5px] font-semibold text-ink-2">
                    From your order
                  </span>
                )}
              </span>
            </button>
          )
        })}
      </div>
      {error && (
        <p className="mt-1.5 ml-1 text-[11.5px] font-medium text-danger">
          Pick your device — the reset steps depend on it.
        </p>
      )}
    </div>
  )
}
