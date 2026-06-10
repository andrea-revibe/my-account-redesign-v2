import { RotateCcw } from 'lucide-react'
import CountryPicker from './CountryPicker'

// Sandbox sibling to JourneyDevPanel — same chrome (fixed bottom-right,
// w-360, journey-picker chips), but instead of Next-button replay it
// exposes the EDD model's inputs (market + four dates + an "actual
// delivered" toggle) and a debug strip showing the computed stage, SLA
// status, message key, and EDD. Surfaces to stakeholders: tweak any input,
// watch the order card banner + ETA hero re-derive immediately.
export default function EddSandboxPanel({
  inputs,
  setInput,
  status,
  markets,
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
        Dynamic EDD · inputs
      </div>

      <Row label="Market">
        <select
          value={inputs.market}
          onChange={(e) => setInput('market', e.target.value)}
          className="w-full text-[12px] font-medium text-ink bg-canvas border border-line rounded-md px-2 py-1.5 outline-none focus:border-brand"
        >
          {markets.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </Row>

      <DateRow label="Today" value={inputs.today} onChange={(v) => setInput('today', v)} />
      <DateRow label="Order date" value={inputs.orderDate} onChange={(v) => setInput('orderDate', v)} />
      <DateRow label="QC date" value={inputs.qcDate} onChange={(v) => setInput('qcDate', v)} />
      <DateRow label="Shipped date" value={inputs.shippedDate} onChange={(v) => setInput('shippedDate', v)} />
      <DateRow label="Delivered date" value={inputs.deliveredDate} onChange={(v) => setInput('deliveredDate', v)} />

      <div className="mt-3 pt-3 border-t border-line">
        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted mb-2">
          Computed state
        </div>
        {status ? (
          <div className="flex flex-col gap-1.5 text-[12px]">
            <DebugRow k="Stage" v={status.currentStage} />
            <DebugRow k="Elapsed" v={`${status.currentStageElapsedDays} day${status.currentStageElapsedDays === 1 ? '' : 's'}`} />
            <DebugRow
              k="SLA"
              v={status.currentStageSlaStatus}
              vClass={status.currentStageSlaStatus === 'late' ? 'text-chip-danger' : 'text-success'}
            />
            {status.previousStage && (
              <DebugRow
                k={`Prev (${status.previousStage})`}
                v={`${status.previousStageElapsedDays}d · ${status.previousStageSlaStatus}`}
                vClass={status.previousStageSlaStatus === 'late' ? 'text-chip-danger' : 'text-muted'}
              />
            )}
            <DebugRow k="Message" v={status.customerMessage.key} mono />
            <DebugRow k="Initial promise" v={formatEddDate(status.initialPromise)} />
            <DebugRow k="EDD" v={formatEddDate(status.deliveryBy)} bold />
          </div>
        ) : (
          <div className="text-[12px] text-muted italic">
            Set both Today and Order date to compute.
          </div>
        )}
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

function Row({ label, children }) {
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <div className="text-[11.5px] font-medium text-muted w-[88px] shrink-0">{label}</div>
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

function DebugRow({ k, v, vClass, mono, bold }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-[11.5px] text-muted w-[88px] shrink-0">{k}</div>
      <div
        className={
          'flex-1 text-[12px] ' +
          (bold ? 'font-semibold ' : 'font-medium ') +
          (mono ? 'font-mono ' : '') +
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

function formatEddDate(d) {
  if (!d) return '—'
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`
}
