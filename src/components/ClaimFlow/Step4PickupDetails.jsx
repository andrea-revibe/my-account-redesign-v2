import { useEffect, useState } from 'react'
import { MapPin, Mail, Phone, ChevronRight, X, Check } from 'lucide-react'
import StepHeading from './StepHeading'
import { CLAIM_STATUSES, CLAIM_SLAS } from '../../lib/claims'

const FIELDS = [
  {
    key: 'address',
    label: 'Delivery address',
    Icon: MapPin,
    inputType: 'textarea',
    placeholder: 'Street, building, city',
    inputMode: 'text',
    autoComplete: 'street-address',
  },
  {
    key: 'email',
    label: 'Email',
    Icon: Mail,
    inputType: 'input',
    placeholder: 'name@example.com',
    inputMode: 'email',
    autoComplete: 'email',
    type: 'email',
  },
  {
    key: 'phone',
    label: 'Phone',
    Icon: Phone,
    inputType: 'input',
    placeholder: '+971 50 000 0000',
    inputMode: 'tel',
    autoComplete: 'tel',
    type: 'tel',
  },
]

export default function Step4PickupDetails({ state, dispatch }) {
  const { pickupDetails } = state
  const [editingKey, setEditingKey] = useState(null)
  const editingField = FIELDS.find((f) => f.key === editingKey) || null

  return (
    <>
      <StepHeading
        title="Pickup address & contact"
        subtitle="We'll collect the device from this address. Update anything that's out of date."
      />

      <div className="px-4 flex flex-col gap-3">
        <div className="rounded-[14px] border border-line bg-surface overflow-hidden">
          {FIELDS.map((field, i) => {
            const value = pickupDetails[field.key]
            const Icon = field.Icon
            return (
              <button
                key={field.key}
                type="button"
                onClick={() => setEditingKey(field.key)}
                className={`w-full text-left px-3.5 py-3 flex items-start gap-3 hover:bg-line-2/40 transition-colors ${
                  i > 0 ? 'border-t border-line' : ''
                }`}
              >
                <span className="w-9 h-9 rounded-[10px] grid place-items-center shrink-0 bg-line-2 text-ink-2">
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
                    {field.label}
                  </span>
                  <span
                    className={`block mt-0.5 text-[13.5px] leading-[1.4] whitespace-pre-line break-words ${
                      value ? 'text-ink' : 'text-muted italic'
                    }`}
                  >
                    {value || 'Not provided'}
                  </span>
                </span>
                <ChevronRight
                  size={18}
                  strokeWidth={1.75}
                  className="text-muted mt-1 shrink-0"
                />
              </button>
            )
          })}
        </div>

        <div className="mt-1 text-[11.5px] text-muted leading-[1.45]">
          Used only for this pickup — your account details aren't changed.
        </div>

        <div className="mt-5 flex flex-col gap-2.5">
          <div className="px-1 text-[11px] font-bold uppercase tracking-[0.08em] text-muted">
            What happens next
          </div>
          <div className="rounded-[14px] border border-line bg-surface px-3.5 py-3.5">
            <ProcessTimeline />
          </div>
          <div className="px-1 text-[11.5px] text-muted leading-[1.45]">
            Typically 5–7 business days from pickup to refund.
          </div>
        </div>

        <ConfirmationCheckbox
          checked={state.pickupConfirmed}
          onChange={(value) =>
            dispatch({ type: 'SET_PICKUP_CONFIRMED', value })
          }
        />
      </div>

      {editingField && (
        <EditFieldSheet
          field={editingField}
          value={pickupDetails[editingField.key]}
          onSave={(value) => {
            dispatch({
              type: 'SET_PICKUP_DETAILS',
              value: { [editingField.key]: value },
            })
            setEditingKey(null)
          }}
          onClose={() => setEditingKey(null)}
        />
      )}
    </>
  )
}

// Plain-English duration for an SLA's expectedHours. Very-short SLAs read
// as instant, so we drop them; refund_credited has no SLA.
function formatExpected(hours) {
  if (!hours || hours <= 1) return null
  if (hours === 12) return 'same day'
  if (hours < 24) return `within ${hours}h`
  if (hours === 24) return 'within 24h'
  const days = Math.round(hours / 24)
  return `~${days} days`
}

const STEP_NOTES = {
  qc: 'May take longer if expert inspection is needed.',
}

const PROCESS_STEPS = CLAIM_STATUSES.map((s) => ({
  id: s.id,
  label: s.headline,
  duration: formatExpected(CLAIM_SLAS[s.id]?.expectedHours),
  note: STEP_NOTES[s.id] || null,
}))

function ProcessTimeline() {
  return (
    <ol className="flex flex-col">
      {PROCESS_STEPS.map((step, i) => (
        <ProcessRow
          key={step.id}
          step={step}
          isFirst={i === 0}
          isLast={i === PROCESS_STEPS.length - 1}
        />
      ))}
    </ol>
  )
}

function ProcessRow({ step, isFirst, isLast }) {
  return (
    <li className="flex">
      <div className="flex flex-col items-center w-[18px] shrink-0">
        <div className={`w-px flex-1 ${isFirst ? 'invisible' : 'bg-line'}`} />
        <div className="w-[10px] h-[10px] rounded-full border-2 border-line bg-surface my-1" />
        <div className={`w-px flex-1 ${isLast ? 'invisible' : 'bg-line'}`} />
      </div>
      <div className="flex-1 ml-2.5 min-w-0 pb-2.5">
        <div className="pt-0.5 flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-semibold text-ink tracking-[-0.01em]">
            {step.label}
          </span>
          {step.duration && (
            <span className="text-[11px] tabular-nums text-muted shrink-0">
              {step.duration}
            </span>
          )}
        </div>
        {step.note && (
          <div className="mt-1 text-[11px] text-ink-2 leading-snug">
            {step.note}
          </div>
        )}
      </div>
    </li>
  )
}

function ConfirmationCheckbox({ checked, onChange }) {
  return (
    <label
      className={`mt-1 flex items-start gap-3 rounded-[14px] border-2 px-3.5 py-3 cursor-pointer transition-colors ${
        checked
          ? 'border-brand bg-brand-bg/30'
          : 'border-line bg-surface hover:bg-line-2/40'
      }`}
    >
      <span className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`w-[20px] h-[20px] rounded-[6px] border-2 grid place-items-center transition-colors ${
            checked ? 'bg-brand border-brand' : 'border-line bg-surface'
          }`}
        >
          {checked && (
            <Check size={13} strokeWidth={3} className="text-white" />
          )}
        </span>
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[13.5px] font-semibold text-ink leading-[1.35]">
          I confirm the pickup details above and understand the return process timeline.
        </span>
        <span className="block mt-1 text-[11.5px] text-muted leading-[1.4]">
          Each step has its own SLA — most returns complete in 5–7 business days, longer if expert inspection is needed.
        </span>
      </span>
    </label>
  )
}

function EditFieldSheet({ field, value, onSave, onClose }) {
  const [draft, setDraft] = useState(value || '')

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [onClose])

  const canSave = draft.trim().length > 0

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Edit ${field.label.toLowerCase()}`}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/45 animate-fadeIn"
      />
      <div className="relative w-full max-w-mobile bg-surface rounded-t-[22px] shadow-lg2 max-h-[92vh] flex flex-col animate-slideUp overflow-hidden">
        <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-line">
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-ink leading-[1.2]">
              Edit {field.label.toLowerCase()}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 rounded-full grid place-items-center text-ink hover:bg-line-2"
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        </div>

        <div className="px-4 py-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[11.5px] font-semibold text-ink-2 uppercase tracking-[0.04em]">
              {field.label}
            </span>
            {field.inputType === 'textarea' ? (
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={field.placeholder}
                inputMode={field.inputMode}
                autoComplete={field.autoComplete}
                className="w-full rounded-[10px] border border-line bg-surface px-3 py-2.5 text-[14px] text-ink placeholder:text-muted resize-none min-h-[88px] outline-none focus:border-brand"
              />
            ) : (
              <input
                autoFocus
                type={field.type || 'text'}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={field.placeholder}
                inputMode={field.inputMode}
                autoComplete={field.autoComplete}
                className="w-full h-[44px] rounded-[10px] border border-line bg-surface px-3 text-[14px] text-ink placeholder:text-muted outline-none focus:border-brand"
              />
            )}
          </label>
        </div>

        <div className="px-4 pb-4 pt-1 flex flex-col gap-2 border-t border-line/60">
          <button
            type="button"
            onClick={() => canSave && onSave(draft.trim())}
            disabled={!canSave}
            className="w-full h-12 rounded-[12px] bg-brand text-white text-[14.5px] font-semibold disabled:bg-line disabled:text-muted transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full h-12 rounded-[12px] text-ink-2 text-[14px] font-semibold hover:bg-line-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
