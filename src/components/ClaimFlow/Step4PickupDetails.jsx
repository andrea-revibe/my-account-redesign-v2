import { useEffect, useState } from 'react'
import { MapPin, Mail, Phone, ChevronRight, X, Truck } from 'lucide-react'
import StepHeading from './StepHeading'

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
        <div className="flex items-start gap-2.5 rounded-[12px] border border-brand-bg bg-brand-bg/40 px-3.5 py-3 text-[12.5px] text-ink leading-[1.45]">
          <Truck
            size={16}
            strokeWidth={1.75}
            className="text-brand shrink-0 mt-px"
          />
          <span>
            <span className="font-semibold text-ink">Courier pickup</span>{' '}
            <span className="text-ink-2">·</span>{' '}
            <span className="text-ink-2">Pickup within 2 business days</span>
          </span>
        </div>

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
