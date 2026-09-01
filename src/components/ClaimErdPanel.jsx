import { RotateCcw } from 'lucide-react'
import CountryPicker from './CountryPicker'

// Sandbox sibling to EddSandboxPanel — same chrome (fixed bottom-right,
// w-360, journey-picker chips), but it exposes the claim ERD model's inputs:
// the claim type and the six milestone dates, plus Today. The market is the
// app-level CountryPicker: App.jsx stamps it onto the sandbox order, which is
// the same `order.country` the model reads, so there is exactly one control
// for it. Debug strip shows the raw model output including the states where
// the card deliberately shows nothing (pending / decided).
export default function ClaimErdPanel({
  inputs,
  setInput,
  setReached,
  anchorDate,
  erd,
  stageLabel,
  levers,
  claimTypes,
  reset,
  journeys,
  activeJourneyId,
  onSelectJourney,
  activeCountry,
  onSelectCountry,
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 w-[360px] bg-surface border border-line rounded-2xl shadow-lg p-4 max-h-[90vh] overflow-y-auto">
      {journeys && journeys.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-3 -mt-0.5">
          {journeys.map((j) => {
            const active = j.id === activeJourneyId
            return (
              <button
                key={j.id}
                onClick={() => onSelectJourney(j.id)}
                className={
                  'px-2 py-1 rounded-full text-[10.5px] font-semibold uppercase tracking-[0.04em] whitespace-nowrap transition ' +
                  (active
                    ? 'bg-brand text-white'
                    : 'bg-brand/10 text-brand hover:bg-brand/15')
                }
              >
                {j.label}
              </button>
            )
          })}
        </div>
      )}

      {onSelectCountry && (
        <CountryPicker
          activeCountry={activeCountry}
          onSelectCountry={onSelectCountry}
        />
      )}

      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted mb-2">
        Claim ERD · inputs
      </div>

      <Row label="Claim type">
        <select
          value={inputs.claimType}
          onChange={(e) => setInput('claimType', e.target.value)}
          className="w-full text-[12px] font-medium text-ink bg-canvas border border-line rounded-md px-2 py-1.5 outline-none focus:border-brand"
        >
          {claimTypes.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </Row>

      <DateRow label="Today" value={inputs.today} onChange={(v) => setInput('today', v)} />

      <div className="mt-2.5 mb-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-muted">
        Milestones
      </div>
      <DateRow label="Claim created" value={inputs.createdAt} onChange={(v) => setInput('createdAt', v)} />
      {[
        ['docsClearedAt', 'Docs cleared'],
        ['pickedUpAt', 'Picked up'],
        ['qcAt', 'QC started'],
        ['expertRevisionAt', 'Expert revision'],
        ['decidedAt', 'Decision'],
      ].map(([key, label]) => (
        <MilestoneRow
          key={key}
          label={label}
          value={inputs[key]}
          anchor={anchorDate}
          onChange={(v) => setInput(key, v)}
          onToggle={(on) => setReached(key, on)}
        />
      ))}

      <label className="flex items-start gap-2 mt-2 mb-1 cursor-pointer">
        <input
          type="checkbox"
          checked={Boolean(inputs.assumeToday)}
          onChange={(e) => setInput('assumeToday', e.target.checked)}
          className="mt-0.5 accent-brand"
        />
        <span className="text-[11.5px] text-muted leading-[1.35]">
          Assume the outstanding milestone lands <strong className="text-ink">today</strong>
          <span className="block text-[10.5px] text-muted/80">
            On by default, so this view is <strong className="text-ink">not</strong> what a
            card shows — cards assume only where there'd otherwise be no date.
            Untick for card behaviour. At other stages this slides the date a day
            later for every day nothing happens.
          </span>
        </span>
      </label>

      <div className="mt-3 pt-3 border-t border-line">
        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted mb-2">
          Computed window
        </div>
        <div className="flex flex-col gap-1.5 text-[12px]">
          <DebugRow k="Stage" v={stageLabel} />
          <DebugRow
            k="Clock"
            v={erd.pending ? 'pending — docs not cleared' : erd.overdue ? 'rolled (overdue)' : 'on baseline'}
            vClass={erd.overdue ? 'text-chip-danger' : erd.pending ? 'text-muted' : 'text-success'}
          />
          <DebugRow k="Earliest" v={fmtDate(erd.earliest)} />
          <DebugRow k="Latest" v={fmtDate(erd.latest)} />
          <DebugRow
            k="Assumed"
            v={erd.assumed ? `${erd.assumed} = today` : 'nothing — all real'}
            vClass={erd.assumed ? 'text-brand' : 'text-muted'}
          />
          <DebugRow k="Shown as" v={erd.label ?? '—'} bold />
          <DebugRow k="Working days" v={erd.workingDays ?? '—'} />
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-line">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted mb-2">
            Levers · {levers.name} (working days)
          </div>
          <div className="flex flex-col gap-1.5">
            <DebugRow k="In transit" v={levers.slaTransit} />
            <DebugRow k="Quality check" v={levers.slaQc} />
            <DebugRow k="Ready for refund" v={levers.slaReadyForRefund} />
            <DebugRow k="Expert extra" v={`+${levers.expertExtra}`} />
            <DebugRow k="Weekend" v={levers.weekend.includes(4) ? 'Fri / Sat' : 'Sat / Sun'} />
          </div>
        </div>
      </div>

      <button
        onClick={reset}
        className="w-full flex items-center justify-center gap-1.5 text-[12px] text-muted hover:text-ink py-1.5 mt-2"
      >
        <RotateCcw size={13} strokeWidth={2} />
        Reset inputs
      </button>
    </div>
  )
}

// Every control in the panel shares one left edge: a 13px slot that a
// MilestoneRow fills with its checkbox and every other row leaves empty.
function Row({ label, children }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span aria-hidden className="w-[13px] shrink-0" />
      <div className="text-[11.5px] font-medium text-muted w-[84px] shrink-0 whitespace-nowrap">
        {label}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function DateRow({ label, value, onChange }) {
  return (
    <Row label={label}>
      <input
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-[12px] font-medium text-ink bg-canvas border border-line rounded-md px-2 py-1.5 outline-none focus:border-brand"
      />
    </Row>
  )
}

// A milestone that can be switched on and off. The date input is *always*
// given a value — its own, or the anchor when the milestone hasn't been reached
// — because a native date picker opened on an empty input jumps to the real
// current month. The checkbox, not an empty field, is what says "not yet".
function MilestoneRow({ label, value, anchor, onChange, onToggle }) {
  const reached = Boolean(value)
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <input
        type="checkbox"
        checked={reached}
        onChange={(e) => onToggle(e.target.checked)}
        aria-label={`${label} reached`}
        className="accent-brand shrink-0 w-[13px] h-[13px]"
      />
      <div
        className={
          'text-[11.5px] font-medium w-[84px] shrink-0 whitespace-nowrap ' +
          (reached ? 'text-muted' : 'text-muted/50')
        }
      >
        {label}
      </div>
      <div className="flex-1">
        <input
          type="date"
          value={value ?? anchor ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={
            'w-full text-[12px] font-medium bg-canvas border border-line rounded-md px-2 py-1.5 outline-none focus:border-brand ' +
            (reached ? 'text-ink' : 'text-muted/50')
          }
        />
      </div>
    </div>
  )
}

function DebugRow({ k, v, vClass, bold }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-[11.5px] text-muted w-[100px] shrink-0">{k}</div>
      <div
        className={
          'flex-1 text-[12px] ' +
          (bold ? 'font-semibold ' : 'font-medium ') +
          (vClass ?? 'text-ink')
        }
      >
        {v}
      </div>
    </div>
  )
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function fmtDate(d) {
  if (!d) return '—'
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}
