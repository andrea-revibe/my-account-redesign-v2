import { useState } from 'react'
import {
  ChevronDown,
  BatteryMedium,
  BatteryCharging,
  CheckCircle2,
  Info,
  Check,
} from 'lucide-react'
import { assessBattery, conditionGradeOf } from '../../lib/returns'

// Optional battery-eligibility helper for the battery-drain issue. Collapsed by
// default behind a subtle icon-row trigger; expands the capacity input + verdict
// inline (see issue.md §"Battery check"). Never gates progression. Extracted
// from the old combined issue-details screen for reuse on the evidence step.
export default function BatteryHealthCheck({ order, value, onChange }) {
  const { capacity, nonOriginal } = value
  const [open, setOpen] = useState(false)
  const [showThresholds, setShowThresholds] = useState(false)
  const assessment = assessBattery({ order, capacity, nonOriginal })
  const { baseline, days } = assessment
  const grade = conditionGradeOf(order)
  const gradeLabel = grade ? grade.charAt(0).toUpperCase() + grade.slice(1) : null
  const showResult = nonOriginal || assessment.capacity != null

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 rounded-[12px] border border-line bg-surface hover:bg-line-2/40 px-3.5 py-3 text-left transition-colors"
      >
        <span className="w-8 h-8 rounded-[9px] bg-brand-bg text-brand grid place-items-center shrink-0">
          <BatteryMedium size={16} strokeWidth={1.75} />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-semibold text-ink">
            Battery check <span className="text-muted font-medium">· optional</span>
          </span>
          <span className="block text-[11.5px] text-muted mt-0.5">
            Check your likely outcome before you submit.
          </span>
        </span>
        <ChevronDown
          size={16}
          strokeWidth={2}
          className="text-muted shrink-0 transition-transform"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div className="rounded-[12px] border border-line bg-surface p-3.5 flex flex-col gap-3 animate-slideDown">
          <div className="text-[12px] leading-[1.45] text-ink-2">
            Enter the figure from{' '}
            <span className="font-semibold text-ink">
              Settings → Battery → Battery Health
            </span>{' '}
            to see your likely outcome.
            {baseline != null && gradeLabel && (
              <>
                {' '}Your {gradeLabel} device was guaranteed at least{' '}
                <span className="font-semibold text-ink">{baseline}%</span> at
                delivery
                {days != null && (
                  <>
                    , delivered{' '}
                    <span className="font-semibold text-ink">
                      {days} day{days === 1 ? '' : 's'} ago
                    </span>
                  </>
                )}
                .
              </>
            )}
          </div>

          <label className="flex items-center gap-2 rounded-[10px] border border-line bg-canvas px-3 py-2.5 focus-within:border-brand">
            <span className="text-[13px] text-ink-2 flex-1">
              Current battery capacity
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={capacity}
              onChange={(e) =>
                onChange({ capacity: e.target.value.replace(/[^0-9]/g, '').slice(0, 3) })
              }
              placeholder="—"
              className="w-14 text-right bg-transparent text-[15px] font-semibold text-ink tabular-nums outline-none placeholder:text-muted"
            />
            <span className="text-[14px] font-semibold text-muted">%</span>
          </label>

          <button
            type="button"
            onClick={() => onChange({ nonOriginal: !nonOriginal })}
            className="flex items-start gap-2.5 text-left"
          >
            <span
              className={`mt-px w-[18px] h-[18px] rounded-[6px] border grid place-items-center shrink-0 transition-colors ${
                nonOriginal
                  ? 'bg-brand border-brand text-white'
                  : 'border-line bg-surface'
              }`}
            >
              {nonOriginal && <Check size={12} strokeWidth={3} />}
            </span>
            <span className="text-[12px] leading-[1.4] text-ink-2">
              My phone shows a message that the{' '}
              <span className="font-semibold text-ink">
                battery or a part isn’t original
              </span>
              .
            </span>
          </button>

          {showResult && <BatteryVerdict assessment={assessment} />}

          <div className="border-t border-line -mx-3.5 px-3.5 pt-2.5 -mb-0.5">
            <button
              type="button"
              onClick={() => setShowThresholds((v) => !v)}
              aria-expanded={showThresholds}
              className="w-full flex items-center justify-between gap-2 text-left"
            >
              <span className="text-[12px] font-semibold text-ink-2">
                What counts as a battery defect?
              </span>
              <ChevronDown
                size={14}
                strokeWidth={2}
                className="text-muted shrink-0 transition-transform"
                style={{ transform: showThresholds ? 'rotate(180deg)' : 'none' }}
              />
            </button>
            {showThresholds && <BatteryThresholds />}
          </div>
        </div>
      )}
    </div>
  )
}

// §7.2 thresholds, surfaced verbatim so the customer can see why the
// verdict landed where it did (and what "normal wear" means).
const BATTERY_THRESHOLDS = [
  {
    window: 'Within 10 days of delivery',
    rule: 'More than 3% below the guaranteed capacity',
    remedy: 'Full refund',
  },
  {
    window: 'Within 6 months',
    rule: 'More than 10% degradation',
    remedy: 'Free battery replacement',
  },
  {
    window: 'Within 12 months',
    rule: 'More than 20% degradation',
    remedy: 'Free battery replacement',
  },
]

function BatteryThresholds() {
  return (
    <div className="mt-2 flex flex-col gap-2 animate-slideDown">
      {BATTERY_THRESHOLDS.map((t) => (
        <div
          key={t.window}
          className="rounded-[10px] border border-line bg-canvas px-3 py-2"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11.5px] font-semibold text-ink">
              {t.window}
            </span>
            <span className="text-[10.5px] font-bold uppercase tracking-[0.04em] text-brand shrink-0">
              {t.remedy}
            </span>
          </div>
          <div className="text-[11.5px] text-ink-2 leading-[1.4] mt-0.5">
            {t.rule}
          </div>
        </div>
      ))}
      <div className="text-[11px] text-muted leading-[1.45]">
        Anything outside these is treated as normal battery wear, which isn’t a
        covered defect. A phone reporting a non-original battery or part is
        always a full refund.
      </div>
    </div>
  )
}

function BatteryVerdict({ assessment }) {
  const { remedy, reason, baseline, capacity, degradation } = assessment

  const TONES = {
    success: 'border-success/30 bg-success-bg/40',
    brand: 'border-brand/30 bg-brand-bg/40',
    muted: 'border-line bg-line-2/40',
  }
  const ICON_TONES = {
    success: 'text-success',
    brand: 'text-brand',
    muted: 'text-ink-2',
  }

  let tone, Icon, title, body
  if (remedy === 'refund') {
    tone = 'success'
    Icon = CheckCircle2
    title = 'You’re likely entitled to a full refund'
    body =
      reason === 'non_original'
        ? 'A non-original battery or part qualifies for a full refund once the device is returned.'
        : `At ${capacity}%, your battery is more than 3% below the ${baseline}% it was guaranteed — within 10 days of delivery.`
  } else if (remedy === 'replacement') {
    tone = 'brand'
    Icon = BatteryCharging
    title = 'You’re likely entitled to a free battery replacement'
    const windowLabel =
      reason === 'replacement_6m' ? '6 months' : '12 months'
    body = `At ${capacity}%, your battery has degraded ${degradation}% below the ${baseline}% guaranteed — within ${windowLabel} of delivery, that's covered for a free replacement, logistics included.`
  } else {
    tone = 'muted'
    Icon = Info
    title = 'This looks like normal battery wear'
    body = `At ${capacity}%, your battery is within the range we’d expect, so it isn’t treated as a defect on its own. You can still submit — quality check will take a look.`
  }

  return (
    <div
      className={`rounded-[10px] border ${TONES[tone]} px-3 py-2.5 flex flex-col gap-1.5 animate-fadeIn`}
    >
      <div className="flex items-start gap-2">
        <Icon
          size={15}
          strokeWidth={1.9}
          className={`${ICON_TONES[tone]} shrink-0 mt-px`}
        />
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-semibold text-ink leading-[1.35]">
            {title}
          </div>
          <div className="text-[11.5px] text-ink-2 leading-[1.45] mt-0.5">
            {body}
          </div>
        </div>
      </div>
      <div className="text-[10.5px] text-muted leading-[1.4] pl-[23px]">
        Estimate only — final eligibility is confirmed by quality check after inspection.
      </div>
    </div>
  )
}
