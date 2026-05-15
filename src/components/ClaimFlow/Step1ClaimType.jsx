import { useState } from 'react'
import {
  ChevronRight,
  ChevronDown,
  PackageOpen,
  AlertTriangle,
  RotateCcw,
  Wrench,
  Coins,
} from 'lucide-react'
import StepHeading from './StepHeading'

const ISSUE_SUBTYPES = [
  {
    id: 'issue',
    label: 'Return for a refund or replacement',
    sub: 'Send the device back to us',
    icon: RotateCcw,
    inScope: true,
  },
  {
    id: 'warranty',
    label: 'Use my warranty',
    sub: 'Repair and return to me',
    icon: Wrench,
    inScope: false,
  },
]

const ISSUE_SUB_IDS = ISSUE_SUBTYPES.map((t) => t.id)

export default function Step1ClaimType({ state, dispatch }) {
  const [stub, setStub] = useState(null)
  const [expanded, setExpanded] = useState(
    ISSUE_SUB_IDS.includes(state.claimType),
  )

  const changeOfMindSelected = state.claimType === 'change_of_mind'

  return (
    <>
      <StepHeading
        title="What do you need help with?"
        subtitle="Tell us what's going on and we'll take it from there."
      />
      <div className="px-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => {
            setStub(null)
            setExpanded(false)
            dispatch({ type: 'SET_CLAIM_TYPE', value: 'change_of_mind' })
          }}
          className={`w-full text-left rounded-[14px] border px-4 py-3.5 flex items-center gap-3 transition-colors ${
            changeOfMindSelected
              ? 'border-brand bg-brand-bg/50'
              : 'border-line bg-surface hover:bg-line-2/40'
          }`}
        >
          <span
            className={`w-10 h-10 rounded-[10px] grid place-items-center shrink-0 ${
              changeOfMindSelected
                ? 'bg-brand text-white'
                : 'bg-line-2 text-ink-2'
            }`}
          >
            <PackageOpen size={18} strokeWidth={1.75} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14.5px] font-semibold text-ink">
              I changed my mind
            </span>
            <span className="block text-[12px] text-muted mt-0.5">
              Return the item for a refund
            </span>
          </span>
          <ChevronRight
            size={16}
            strokeWidth={1.75}
            className="text-muted shrink-0"
          />
        </button>

        <button
          type="button"
          onClick={() => {
            setStub(null)
            setExpanded((v) => !v)
          }}
          aria-expanded={expanded}
          className={`w-full text-left rounded-[14px] border px-4 py-3.5 flex items-center gap-3 transition-colors ${
            expanded
              ? 'border-line bg-line-2/40'
              : 'border-line bg-surface hover:bg-line-2/40'
          }`}
        >
          <span className="w-10 h-10 rounded-[10px] grid place-items-center shrink-0 bg-line-2 text-ink-2">
            <AlertTriangle size={18} strokeWidth={1.75} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14.5px] font-semibold text-ink">
              Something's wrong with my device
            </span>
            <span className="block text-[12px] text-muted mt-0.5">
              Pick the remedy that fits
            </span>
          </span>
          {expanded ? (
            <ChevronDown
              size={16}
              strokeWidth={1.75}
              className="text-muted shrink-0"
            />
          ) : (
            <ChevronRight
              size={16}
              strokeWidth={1.75}
              className="text-muted shrink-0"
            />
          )}
        </button>

        {expanded && (
          <div className="pl-4 flex flex-col gap-2 mb-1">
            {ISSUE_SUBTYPES.map((t) => {
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
                  className={`w-full text-left rounded-[12px] border px-3.5 py-3 flex items-center gap-3 transition-colors ${
                    selected
                      ? 'border-brand bg-brand-bg/50'
                      : 'border-line bg-surface hover:bg-line-2/40'
                  }`}
                >
                  <span
                    className={`w-9 h-9 rounded-[9px] grid place-items-center shrink-0 ${
                      selected ? 'bg-brand text-white' : 'bg-line-2 text-ink-2'
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13.5px] font-semibold text-ink">
                      {t.label}
                    </span>
                    <span className="block text-[11.5px] text-muted mt-0.5">
                      {t.sub}
                    </span>
                  </span>
                  <ChevronRight
                    size={14}
                    strokeWidth={1.75}
                    className="text-muted shrink-0"
                  />
                </button>
              )
            })}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setStub('compensation')
          }}
          className="w-full text-left rounded-[14px] border border-line bg-surface hover:bg-line-2/40 px-4 py-3.5 flex items-center gap-3 transition-colors"
        >
          <span className="w-10 h-10 rounded-[10px] grid place-items-center shrink-0 bg-line-2 text-ink-2">
            <Coins size={18} strokeWidth={1.75} />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-[14.5px] font-semibold text-ink">
              Request compensation
            </span>
            <span className="block text-[12px] text-muted mt-0.5">
              Shipping refund or faulty accessory — keep the item
            </span>
          </span>
          <ChevronRight
            size={16}
            strokeWidth={1.75}
            className="text-muted shrink-0"
          />
        </button>

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
