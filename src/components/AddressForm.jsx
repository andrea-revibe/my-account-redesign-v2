import { ChevronDown } from 'lucide-react'
import { addressSchema } from '../lib/address'

// The single structured address editor, reused by every address-modification
// surface (EditableContactCard → PickupFailed/AwbFailed, InvalidClaimCard, and
// the returns-flow Step 4 sheet). It renders the country's field schema
// (lib/address.js) as a two-column grid; `full` fields span the row. Controlled:
// `onChange` receives the whole next address object so callers can commit it
// wholesale (the flow reducer + card drafts both shallow-merge on `address`).
// `errorField` lights one field id (soft validation, matches stepError).
export default function AddressForm({ address, country, onChange, errorField = null }) {
  const schema = addressSchema(country)
  const value = address && typeof address === 'object' ? address : {}
  const set = (id, v) => onChange({ ...value, [id]: v })
  return (
    <div className="grid grid-cols-2 gap-3">
      {schema.map((field) => (
        <AddressField
          key={field.id}
          field={field}
          value={value[field.id] ?? ''}
          invalid={errorField === field.id}
          onChange={(v) => set(field.id, v)}
        />
      ))}
    </div>
  )
}

function AddressField({ field, value, invalid, onChange }) {
  const base = `w-full rounded-[8px] border bg-surface px-3 py-2 text-[12.5px] text-ink leading-snug outline-none focus:ring-1 ${
    invalid
      ? 'border-danger focus:border-danger focus:ring-danger/30'
      : 'border-line focus:border-brand focus:ring-brand/30'
  }`
  return (
    <label className={`flex flex-col gap-1 min-w-0 ${field.full ? 'col-span-2' : ''}`}>
      <span className="text-[10.5px] font-bold uppercase tracking-[0.08em] text-muted">
        {field.label}
        {!field.required && (
          <span className="ml-1 font-semibold lowercase tracking-normal text-muted/70">
            optional
          </span>
        )}
      </span>
      {field.type === 'select' ? (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={base + ' appearance-none pr-8'}
          >
            <option value="" disabled>
              Select…
            </option>
            {field.options.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            strokeWidth={2}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted"
          />
        </div>
      ) : field.type === 'textarea' ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={base + ' resize-none'}
        />
      ) : (
        <input
          type="text"
          inputMode={field.inputMode}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          className={base}
        />
      )}
    </label>
  )
}
