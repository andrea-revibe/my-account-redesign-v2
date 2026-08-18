import { useMemo } from 'react'
import {
  ChevronRight,
  RotateCcw,
  Wrench,
  ArrowLeftRight,
  ShieldCheck,
  Info,
} from 'lucide-react'
import StepHeading from './StepHeading'
import InlineError from './InlineError'
import { REVIBE_CARE_ICON } from '../ProductSummary'
import { eligibilityFor, formatMoney } from '../../lib/returns'
import { coverageFor, remedyOptionsFor, coverageStripFor } from '../../lib/coverage'

// Remedy screen — the redesigned "type of return", now AFTER we know the
// issue so the menu only shows eligible outcomes (RETURNS-FLOW-SPEC §4 B3 / C).
// device_fault → refund | repair | accidental. wrong_item → replacement |
// refund. Each option names the outcome, not the system process.
//
// On device_fault the menu is coverage-aware (lib/coverage.js decides which ids
// appear, from the device's age + whether Revibe Care was bought):
//   refund      only inside the 10-day return window
//   repair      always — the standard-warranty arm, for faults the customer
//               didn't cause. Labelled "standard warranty" in both tiers: Care
//               extends that warranty's duration rather than replacing it.
//   accidental  the Care-only arm; picking it IS the customer declaring they
//               caused the damage, which is why it's phrased as an outcome
//               rather than a cause.
//
// Layout: when Care is in play the two repair options are wrapped in one
// purple-outlined group whose header is the Care coverage strip — the strip is
// what explains why those two are on offer, so it reads as their label rather
// than a floating banner. Refund sits above, outside the group: it isn't a Care
// benefit, and leaving the outlined group to pull the eye is a deliberate steer
// toward repair. With no Care, there's no group and every option renders as a
// plain card exactly as it did before coverage existed.
//
// wrong_item is a fulfilment error, not a warranty matter, so it ignores
// coverage entirely.

const REFUND_OPTION = {
  id: 'refund',
  icon: RotateCcw,
  title: 'Return for a refund',
  sub: 'Send it back, get your money back',
}

const REPLACEMENT_OPTION = {
  id: 'replacement',
  icon: ArrowLeftRight,
  title: 'Get the correct item',
  sub: "We send you the right one — you won't be charged",
}

const REPAIR_OPTION = {
  id: 'repair',
  icon: Wrench,
  title: 'Repair under standard warranty',
  sub: "A fault you didn't cause — a defect it arrived with, or developed on its own",
}

function accidentalOption(order, coverage) {
  return {
    id: 'accidental',
    icon: ShieldCheck,
    title: 'Repair accidental damage',
    sub: `Damage you caused — drops, cracks, liquid. Covered once, up to ${order.currency} ${formatMoney(coverage.cap)}`,
  }
}

function OptionRow({ option, selected, onClick, inGroup = false }) {
  const Icon = option.icon
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 flex items-center gap-3 transition-colors ${
        inGroup
          ? selected
            ? 'bg-brand-bg/70'
            : 'bg-surface hover:bg-brand-bg/25'
          : selected
            ? 'rounded-[14px] border border-brand bg-brand-bg/50 ring-2 ring-brand/10'
            : 'rounded-[14px] border border-line bg-surface hover:bg-line-2/40'
      }`}
    >
      <span
        className={`w-10 h-10 rounded-[10px] grid place-items-center shrink-0 ${
          selected ? 'bg-brand text-white' : 'bg-brand-bg text-brand'
        }`}
      >
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[14.5px] font-semibold text-ink leading-[1.25]">
          {option.title}
        </span>
        <span className="block text-[12px] text-muted mt-0.5 leading-[1.35]">
          {option.sub}
        </span>
      </span>
      <ChevronRight size={16} strokeWidth={1.75} className="text-muted shrink-0" />
    </button>
  )
}

function CareGroupHeader({ strip }) {
  return (
    <div className="bg-hero-gradient px-3.5 py-3 flex items-start gap-3">
      <div className="w-[34px] h-[34px] rounded-[9px] bg-white grid place-items-center shrink-0 shadow-[0_2px_6px_rgba(20,12,40,.18)]">
        <img src={REVIBE_CARE_ICON} alt="" className="w-[22px] h-[22px] object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-white leading-[1.25]">
          {strip.headline}
        </div>
        <div className="text-[11.5px] text-white/[.78] mt-1 leading-[1.4]">
          {strip.body}
        </div>
      </div>
    </div>
  )
}

export default function StepRemedy({ state, dispatch, order, error }) {
  const isWrongItem = state.situation === 'wrong_item'
  const coverage = useMemo(() => coverageFor(order), [order])
  // No order (defensive — every other step guards the same way): behave as the
  // screen did before coverage existed.
  const refundEligible = useMemo(
    () => (order ? eligibilityFor(order).eligible : true),
    [order],
  )

  const options = useMemo(() => {
    if (isWrongItem) return [REFUND_OPTION, REPLACEMENT_OPTION]
    return remedyOptionsFor(order, coverage, refundEligible).map((id) => {
      if (id === 'refund') return REFUND_OPTION
      if (id === 'repair') return REPAIR_OPTION
      return accidentalOption(order, coverage)
    })
  }, [isWrongItem, order, coverage, refundEligible])

  const strip = isWrongItem ? null : coverageStripFor(coverage)
  // The Care group only exists when there's coverage to label it with.
  const grouped = strip !== null
  const soloOptions = grouped ? options.filter((o) => o.id === 'refund') : options
  const groupOptions = grouped ? options.filter((o) => o.id !== 'refund') : []

  const pick = (id) => dispatch({ type: 'SET_REMEDY', value: id })

  return (
    <>
      <StepHeading
        title="How would you like us to fix this?"
        subtitle="Based on the issue you described, here's what you can choose."
      />
      <div className="px-4 flex flex-col gap-2">
        {error === 'remedy' && (
          <InlineError className="mb-0.5">Pick an option to continue.</InlineError>
        )}

        {soloOptions.map((o) => (
          <OptionRow
            key={o.id}
            option={o}
            selected={state.remedy === o.id}
            onClick={() => pick(o.id)}
          />
        ))}

        {grouped && groupOptions.length > 0 && (
          <div className="rounded-[14px] border border-brand/35 overflow-hidden shadow-[0_4px_14px_-9px_rgba(80,25,160,.4)]">
            <CareGroupHeader strip={strip} />
            <div className="divide-y divide-line">
              {groupOptions.map((o) => (
                <OptionRow
                  key={o.id}
                  option={o}
                  selected={state.remedy === o.id}
                  onClick={() => pick(o.id)}
                  inGroup
                />
              ))}
            </div>
          </div>
        )}

        {isWrongItem && state.remedy === 'replacement' && (
          <div className="mt-1 flex items-start gap-2.5 rounded-[12px] border border-line bg-canvas px-3.5 py-3 animate-slideDown">
            <Info size={15} strokeWidth={2} className="text-brand shrink-0 mt-px" />
            <p className="m-0 text-[12px] leading-[1.45] text-ink-2">
              Getting the correct item depends on our sellers' current stock. If
              it's not available, we'll refund you instead.
            </p>
          </div>
        )}

        {!isWrongItem && state.remedy === 'accidental' && (
          <div className="mt-1 flex items-start gap-2.5 rounded-[12px] border border-line bg-canvas px-3.5 py-3 animate-slideDown">
            <Info size={15} strokeWidth={2} className="text-brand shrink-0 mt-px" />
            <p className="m-0 text-[12px] leading-[1.45] text-ink-2">
              We'll inspect the device and confirm the repair cost first. If it
              comes to more than {order.currency} {formatMoney(coverage.cap)},
              we'll contact you before any work starts. Revibe Care covers
              accidental damage once.
            </p>
          </div>
        )}
      </div>
    </>
  )
}
