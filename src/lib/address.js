// Structured, per-country address model — the single source of truth for which
// fields an address-modification surface renders. Country is the orthogonal
// dimension (see lib/countries.js): `order.country` selects the schema, and the
// address value is an object keyed by field id. `formatAddress` collapses that
// object to the one-line display string the read-only surfaces still use, and
// tolerates a legacy plain string so un-migrated mocks keep rendering.
import { DEFAULT_COUNTRY } from './countries'

const EMIRATES = [
  'Abu Dhabi',
  'Dubai',
  'Sharjah',
  'Ajman',
  'Umm Al Quwain',
  'Ras Al Khaimah',
  'Fujairah',
]

const PROVINCES = [
  'Eastern Cape',
  'Free State',
  'Gauteng',
  'KwaZulu-Natal',
  'Limpopo',
  'Mpumalanga',
  'North West',
  'Northern Cape',
  'Western Cape',
]

// Ordered field list per country. Field `id` is the storage key in the address
// object; `full` spans both grid columns; `type` defaults to a text input.
// Field order is also the display order used by `formatAddress`.
export const ADDRESS_SCHEMAS = {
  AE: [
    { id: 'area', label: 'Area / District', required: true },
    { id: 'building', label: 'Building / Villa', required: true },
    { id: 'unit', label: 'Flat / Office no.', required: true, full: true },
    { id: 'street', label: 'Street', required: true, full: true },
    { id: 'city', label: 'City', required: true },
    { id: 'emirate', label: 'Emirate', required: true, type: 'select', options: EMIRATES },
  ],
  SA: [
    { id: 'buildingNo', label: 'Building no.', required: true, inputMode: 'numeric' },
    { id: 'street', label: 'Street', required: true },
    { id: 'district', label: 'District', required: true },
    { id: 'city', label: 'City', required: true },
    { id: 'postalCode', label: 'Postal code', required: true, inputMode: 'numeric' },
    { id: 'additionalCode', label: 'Additional code', required: false, inputMode: 'numeric' },
  ],
  ZA: [
    { id: 'street', label: 'Street address', required: true, full: true },
    { id: 'suburb', label: 'Suburb', required: true },
    { id: 'city', label: 'City / Town', required: true },
    { id: 'province', label: 'Province', required: true, type: 'select', options: PROVINCES },
    { id: 'postalCode', label: 'Postal code', required: true, inputMode: 'numeric' },
  ],
  Others: [
    {
      id: 'address',
      label: 'Full address',
      required: true,
      full: true,
      type: 'textarea',
      placeholder: 'Street, building, city, postal code, country',
    },
  ],
}

// Country code (string) or an order ({ country }); falls back to the default
// schema for an unknown/missing code (mirrors countryConfig in lib/countries).
export function addressSchema(country) {
  const code = typeof country === 'string' ? country : country?.country
  return ADDRESS_SCHEMAS[code] ?? ADDRESS_SCHEMAS[DEFAULT_COUNTRY]
}

// Blank structured address for the country — every field key present, empty.
export function emptyAddress(country) {
  return Object.fromEntries(addressSchema(country).map((f) => [f.id, '']))
}

// Structured → one-line display string: values in schema order, blanks dropped,
// comma-joined, with consecutive duplicates collapsed (so "Dubai, Dubai" reads
// once). A legacy plain string passes through unchanged. NB DeliveryAddressPill
// splits the result on ',' for its short form, so the first non-empty field
// must be the most specific.
export function formatAddress(address, country) {
  if (!address) return ''
  if (typeof address === 'string') return address
  const parts = addressSchema(country)
    .map((f) => (address[f.id] == null ? '' : String(address[f.id]).trim()))
    .filter(Boolean)
  return parts
    .filter((v, i) => i === 0 || v.toLowerCase() !== parts[i - 1].toLowerCase())
    .join(', ')
}

// First unmet required field id (topmost-first, matching stepError), or null.
// A legacy string is complete when non-empty.
export function addressError(address, country) {
  if (typeof address === 'string') return address.trim() ? null : 'address'
  for (const f of addressSchema(country)) {
    if (f.required && String(address?.[f.id] ?? '').trim() === '') return f.id
  }
  return null
}

export function isAddressComplete(address, country) {
  return addressError(address, country) === null
}
