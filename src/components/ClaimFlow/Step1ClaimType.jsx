import { useState } from 'react'
import {
  ChevronRight,
  PackageOpen,
  AlertTriangle,
  Truck,
  PackageX,
  HelpCircle,
} from 'lucide-react'
import StepHeading from './StepHeading'

const TYPES = [
  {
    id: 'change_of_mind',
    label: 'Return an item',
    sub: 'Change of mind, no fault',
    icon: PackageOpen,
    inScope: true,
  },
  {
    id: 'faulty',
    label: 'Faulty product',
    sub: 'Device not working as expected',
    icon: AlertTriangle,
    inScope: false,
  },
  {
    id: 'damaged',
    label: 'Damaged in transit',
    sub: 'Package or device arrived damaged',
    icon: Truck,
    inScope: false,
  },
  {
    id: 'missing',
    label: 'Missing items',
    sub: "Something didn't arrive in your order",
    icon: PackageX,
    inScope: false,
  },
  {
    id: 'other',
    label: 'Other',
    sub: 'Something else',
    icon: HelpCircle,
    inScope: false,
  },
]

export default function Step1ClaimType({ state, dispatch }) {
  const [stub, setStub] = useState(null)

  return (
    <>
      <StepHeading
        title="What do you need help with?"
        subtitle="Tell us what's going on and we'll take it from there."
      />
      <div className="px-4 flex flex-col gap-2">
        {TYPES.map((t) => {
          const selected = state.claimType === t.id
          const Icon = t.icon
          const isStub = !t.inScope
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                if (isStub) {
                  setStub(t.id)
                  return
                }
                setStub(null)
                dispatch({ type: 'SET_CLAIM_TYPE', value: t.id })
              }}
              className={`w-full text-left rounded-[14px] border px-4 py-3.5 flex items-center gap-3 transition-colors ${
                selected
                  ? 'border-brand bg-brand-bg/50'
                  : 'border-line bg-surface hover:bg-line-2/40'
              }`}
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
                  {t.label}
                </span>
                <span className="block text-[12px] text-muted mt-0.5">
                  {t.sub}
                </span>
              </span>
              <ChevronRight
                size={16}
                strokeWidth={1.75}
                className="text-muted shrink-0"
              />
            </button>
          )
        })}
        {stub && (
          <div className="mt-1 rounded-[12px] border border-line bg-line-2/50 px-3.5 py-3 text-[12.5px] text-ink-2 leading-[1.45]">
            That flow isn't part of this build yet — in production this would
            route to the legacy claims form.
          </div>
        )}
      </div>
    </>
  )
}
