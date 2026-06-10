// Country split — single source of truth for per-country capability flags.
//
// Country is an orthogonal dimension to the journey: the same journey replays
// under any country, and `order.country` (default `AE`) selects the flag set
// the cards read. Add a flag here, gate on it in the card; add a country by
// adding a row. Codes are the canonical AE/ZA/SA/Others (the values written on
// every mock order in data/orders/*); `eddMarket` bridges to lib/edd.js's
// MARKETS keys (UAE/ZA/SA) for a later sandbox unification, read by nothing yet.
//
// Flags:
//   detailedTracking — show the See-detailed-tracking dropdowns (order
//     delivery + claim inbound/return legs). Off → the dropdown is omitted.
//   expertReview — claim gets an expert-revision step before it can be marked
//     invalid (journey-sequence difference; scaffolded, not yet wired).
export const DEFAULT_COUNTRY = 'AE'

export const COUNTRIES = {
  AE:     { label: 'UAE',          detailedTracking: true,  expertReview: true,  eddMarket: 'UAE' },
  ZA:     { label: 'South Africa', detailedTracking: true,  expertReview: false, eddMarket: 'ZA'  },
  SA:     { label: 'Saudi Arabia', detailedTracking: false, expertReview: true,  eddMarket: 'SA'  },
  Others: { label: 'Others',       detailedTracking: false, expertReview: false, eddMarket: null  },
}

export const COUNTRY_CODES = ['AE', 'ZA', 'SA', 'Others']

// Accepts a country code string or an order ({ country }); falls back to the
// default config for an unknown/missing code so callers never crash.
export function countryConfig(country) {
  const code = typeof country === 'string' ? country : country?.country
  return COUNTRIES[code] ?? COUNTRIES[DEFAULT_COUNTRY]
}
