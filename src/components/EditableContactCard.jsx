import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'

// Read-only contact block (address · phone · email) that flips to an inline
// edit form when `editing` is true (Address / Phone / Email inputs + Save /
// Cancel beneath). Local draft state only — Save commits the next values back
// to the parent via `onSave`. Shared by PickupFailedCard (pickup address) and
// AwbFailedCard (address the AWB couldn't be generated for); InvalidClaimCard's
// DeliveryDetailsCard is a third copy left to migrate later.
export default function EditableContactCard({
  title = 'Pickup address',
  details,
  editing,
  onSave,
  onCancel,
}) {
  const [draft, setDraft] = useState(details)

  useEffect(() => {
    if (editing) setDraft(details)
  }, [editing, details])

  const updateField = (key, value) => setDraft((prev) => ({ ...prev, [key]: value }))

  return (
    <div className="rounded-[12px] border border-line bg-surface overflow-hidden">
      <div className="px-3.5 py-2.5 flex items-center gap-2 bg-line-2/30 border-b border-line">
        <MapPin size={13} strokeWidth={2} className="text-muted" />
        <span className="text-[12px] font-bold uppercase tracking-[0.06em] text-ink">
          {title}
        </span>
      </div>
      {editing ? (
        <div
          className="px-3.5 py-3 flex flex-col gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <EditableField
            label="Address"
            value={draft.address}
            onChange={(v) => updateField('address', v)}
            multiline
          />
          <EditableField
            label="Phone number"
            value={draft.phone}
            onChange={(v) => updateField('phone', v)}
          />
          <EditableField
            label="Email"
            value={draft.email}
            onChange={(v) => updateField('email', v)}
            type="email"
          />
          <div className="flex gap-2 pt-0.5">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 h-[38px] rounded-[10px] bg-surface border border-line text-ink-2 font-semibold text-[12.5px] hover:bg-line-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="flex-1 h-[38px] rounded-[10px] bg-brand text-white font-semibold text-[12.5px] hover:opacity-90"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="px-3.5 py-3 flex flex-col gap-1">
          <div className="text-[13px] font-semibold text-ink leading-snug">{details.address}</div>
          <div className="text-[11.5px] text-muted">
            {details.phone} · {details.email}
          </div>
        </div>
      )}
    </div>
  )
}

function EditableField({ label, value, onChange, multiline = false, type = 'text' }) {
  const baseClass =
    'w-full rounded-[8px] border border-line bg-surface px-3 py-2 text-[12.5px] text-ink leading-snug focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30'
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
        {label}
      </span>
      {multiline ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass + ' resize-none'}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={baseClass}
        />
      )}
    </label>
  )
}
