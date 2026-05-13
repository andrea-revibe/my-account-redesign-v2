import { Truck, MapPin, Store } from 'lucide-react'
import StepHeading from './StepHeading'

const METHODS = [
  {
    id: 'courier',
    label: 'Courier pickup',
    sub: 'We collect from your address',
    eta: 'Pickup within 2 business days',
    cost: 'Partial cost covered',
    Icon: Truck,
  },
  {
    id: 'dropoff',
    label: 'Drop-off at partner location',
    sub: 'Bring it to a nearby drop-off point',
    eta: 'Locations within 5 km',
    cost: 'Free',
    Icon: MapPin,
  },
  {
    id: 'store',
    label: 'In-store return',
    sub: 'Bring it to a Revibe location',
    eta: 'Walk in any open hour',
    cost: 'Free',
    Icon: Store,
  },
]

export default function Step6ReturnMethod({ state, dispatch }) {
  const { id, address } = state.returnMethod

  return (
    <>
      <StepHeading
        title="How will you return it?"
        subtitle="Pick what works best — we'll send instructions once you submit."
      />
      <div className="px-4 flex flex-col gap-2.5">
        {METHODS.map((m) => {
          const selected = id === m.id
          const Icon = m.Icon
          return (
            <div
              key={m.id}
              className={`rounded-[14px] border-2 transition-colors ${
                selected
                  ? 'border-brand bg-brand-bg/30'
                  : 'border-line bg-surface'
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  dispatch({
                    type: 'SET_RETURN_METHOD',
                    value: { id: m.id },
                  })
                }
                aria-pressed={selected}
                className="w-full text-left px-3.5 py-3 flex items-start gap-3"
              >
                <span
                  className={`w-10 h-10 rounded-[10px] grid place-items-center shrink-0 ${
                    selected ? 'bg-brand text-white' : 'bg-line-2 text-ink-2'
                  }`}
                >
                  <Icon size={18} strokeWidth={1.75} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[14.5px] font-semibold text-ink">
                    {m.label}
                  </span>
                  <span className="block text-[12px] text-muted mt-0.5">
                    {m.sub}
                  </span>
                  <span className="block mt-2 text-[11.5px] text-ink-2">
                    {m.eta} ·{' '}
                    <span
                      className={
                        m.cost === 'Free'
                          ? 'text-success font-semibold'
                          : 'text-ink-2'
                      }
                    >
                      {m.cost}
                    </span>
                  </span>
                </span>
                <span
                  aria-hidden
                  className={`mt-1 w-[18px] h-[18px] rounded-full border-2 grid place-items-center shrink-0 ${
                    selected ? 'border-brand' : 'border-line'
                  }`}
                >
                  {selected && <span className="w-2 h-2 rounded-full bg-brand" />}
                </span>
              </button>
              {selected && m.id === 'courier' && (
                <div className="px-3.5 pb-3.5 pt-1 border-t border-line/60 animate-slideDown">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11.5px] font-semibold text-ink-2 uppercase tracking-[0.04em]">
                      Pickup address
                    </span>
                    <textarea
                      value={address}
                      onChange={(e) =>
                        dispatch({
                          type: 'SET_RETURN_METHOD',
                          value: { address: e.target.value },
                        })
                      }
                      placeholder="Street, building, city"
                      className="w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[14px] text-ink placeholder:text-muted resize-none min-h-[72px] outline-none focus:border-brand"
                    />
                  </label>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </>
  )
}
